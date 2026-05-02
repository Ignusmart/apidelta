import { Injectable, Logger } from '@nestjs/common';
import {
  Project,
  ScriptKind,
  SyntaxKind,
  Node,
  ImportDeclaration,
  CallExpression,
  PropertyAccessExpression,
  StringLiteral,
  NoSubstitutionTemplateLiteral,
  TemplateExpression,
} from 'ts-morph';

export type ScanKind = 'SDK_CALL' | 'HTTP_HOSTNAME' | 'HTTP_PATH' | 'OPENAPI_PATH';

export interface ScanResult {
  catalogSlug: string;
  kind: ScanKind;
  surface: string;
  filePath: string;
  line: number;
}

export interface CatalogMapping {
  slug: string;
  npmPackages: string[];
  urlHostnames: string[];
}

export interface FileToScan {
  path: string;
  content: string;
}

interface ImportBinding {
  /** local identifier (default import or named alias) */
  local: string;
  /** module specifier — matches CatalogMapping.npmPackages */
  moduleSpecifier: string;
}

@Injectable()
export class TsScannerService {
  private readonly logger = new Logger(TsScannerService.name);

  /**
   * Run all three scan passes over the provided files. Returns a flat
   * list of `ScanResult`s — the orchestrator dedupes and persists.
   *
   * The scanner is robust to syntax errors (ts-morph parses
   * permissively). If a single file blows up, we log and continue.
   */
  scan(files: FileToScan[], mappings: CatalogMapping[]): ScanResult[] {
    if (files.length === 0 || mappings.length === 0) return [];

    // Build lookup tables once — scanned per-file work stays O(matched-imports).
    const packageToSlug = new Map<string, string>();
    const hostnameToSlug = new Map<string, string>();
    for (const m of mappings) {
      for (const pkg of m.npmPackages) packageToSlug.set(pkg, m.slug);
      for (const host of m.urlHostnames) hostnameToSlug.set(host, m.slug);
    }

    const project = new Project({
      useInMemoryFileSystem: true,
      // Skip type-checking; we only care about syntax + names. Massively faster.
      compilerOptions: {
        allowJs: true,
        checkJs: false,
        noEmit: true,
        skipLibCheck: true,
      },
    });

    const results: ScanResult[] = [];
    for (const f of files) {
      try {
        const sf = project.createSourceFile(f.path, f.content, {
          overwrite: true,
          scriptKind: this.scriptKindFor(f.path),
        });

        const imports = this.collectImports(sf.getImportDeclarations(), packageToSlug);

        // Pass 1 — SDK call sites attributed to imported bindings.
        results.push(...this.scanSdkCalls(sf, imports, packageToSlug, f.path));

        // Pass 2 — URL literals (string literals + template literals).
        results.push(...this.scanUrlLiterals(sf, hostnameToSlug, f.path));

        // Pass 3 — openapi-fetch / openapi-typescript path access.
        // Uses raw imports (not the catalog-filtered list) since
        // `openapi-fetch` is a meta-package, not a tracked SDK.
        results.push(...this.scanOpenapiPaths(sf, f.path));
      } catch (err) {
        this.logger.warn(
          `Scanner failed on ${f.path}: ${(err as Error).message}`,
        );
      }
    }
    return results;
  }

  // ── Pass 1: SDK imports + call sites ───────────────────────

  private collectImports(
    decls: ImportDeclaration[],
    packageToSlug: Map<string, string>,
  ): ImportBinding[] {
    const bindings: ImportBinding[] = [];
    for (const d of decls) {
      const spec = d.getModuleSpecifierValue();
      if (!spec) continue;
      const slug = packageToSlug.get(spec);
      if (!slug) continue;

      const def = d.getDefaultImport();
      if (def) bindings.push({ local: def.getText(), moduleSpecifier: spec });

      const ns = d.getNamespaceImport();
      if (ns) bindings.push({ local: ns.getText(), moduleSpecifier: spec });

      for (const n of d.getNamedImports()) {
        const alias = n.getAliasNode();
        const local = alias ? alias.getText() : n.getName();
        bindings.push({ local, moduleSpecifier: spec });
      }
    }
    return bindings;
  }

  private scanSdkCalls(
    sf: ReturnType<Project['createSourceFile']>,
    imports: ImportBinding[],
    packageToSlug: Map<string, string>,
    filePath: string,
  ): ScanResult[] {
    if (imports.length === 0) return [];
    const localToSpec = new Map(imports.map((b) => [b.local, b.moduleSpecifier]));

    // Track aliases: `const stripe = new Stripe(key)` → 'stripe' aliases to the
    // Stripe constructor's import. We build a one-pass alias map by scanning
    // VariableDeclarations whose initializer references an imported binding.
    const aliasToSpec = new Map<string, string>(localToSpec);
    sf.forEachDescendant((node) => {
      if (node.getKind() !== SyntaxKind.VariableDeclaration) return;
      const decl = node.asKindOrThrow(SyntaxKind.VariableDeclaration);
      const init = decl.getInitializer();
      if (!init) return;
      const root = this.rootIdentifier(init);
      if (!root) return;
      const spec = localToSpec.get(root);
      if (spec) {
        aliasToSpec.set(decl.getName(), spec);
      }
    });

    const out: ScanResult[] = [];
    sf.forEachDescendant((node) => {
      if (node.getKind() !== SyntaxKind.CallExpression) return;
      const call = node as CallExpression;
      const expr = call.getExpression();
      if (expr.getKind() !== SyntaxKind.PropertyAccessExpression) return;

      const access = expr as PropertyAccessExpression;
      const chain = this.flattenPropertyAccess(access);
      if (chain.length < 2) return;
      const root = chain[0];
      const spec = aliasToSpec.get(root);
      if (!spec) return;
      const slug = packageToSlug.get(spec);
      if (!slug) return;

      // Surface = chain rendered with the package's canonical local name
      // (`stripe.subscriptions.create`). Using the variable name keeps
      // the surface readable without leaking user-chosen aliases.
      const canonicalRoot = this.canonicalName(spec);
      const surface = [canonicalRoot, ...chain.slice(1)].join('.');
      out.push({
        catalogSlug: slug,
        kind: 'SDK_CALL',
        surface,
        filePath,
        line: call.getStartLineNumber(),
      });
    });
    return out;
  }

  private flattenPropertyAccess(access: PropertyAccessExpression): string[] {
    const chain: string[] = [access.getName()];
    let current: Node = access.getExpression();
    while (current.getKind() === SyntaxKind.PropertyAccessExpression) {
      const inner = current as PropertyAccessExpression;
      chain.unshift(inner.getName());
      current = inner.getExpression();
    }
    if (current.getKind() === SyntaxKind.Identifier) {
      chain.unshift(current.getText());
    } else {
      // Non-identifier root (e.g. `(await getClient()).foo.bar`) — skip
      return [];
    }
    return chain;
  }

  private rootIdentifier(node: Node): string | null {
    if (node.getKind() === SyntaxKind.Identifier) return node.getText();
    if (node.getKind() === SyntaxKind.NewExpression) {
      const newExpr = node.asKindOrThrow(SyntaxKind.NewExpression);
      const name = newExpr.getExpression();
      return name.getKind() === SyntaxKind.Identifier ? name.getText() : null;
    }
    if (node.getKind() === SyntaxKind.CallExpression) {
      const call = node as CallExpression;
      const expr = call.getExpression();
      if (expr.getKind() === SyntaxKind.Identifier) return expr.getText();
      if (expr.getKind() === SyntaxKind.PropertyAccessExpression) {
        const chain = this.flattenPropertyAccess(expr as PropertyAccessExpression);
        return chain[0] ?? null;
      }
    }
    return null;
  }

  /**
   * Pick a stable, readable identifier for an imported package so two
   * developers using different aliases produce the same surface string.
   * Prefer the part after the last `/`; strip leading `@` on scoped packages.
   */
  private canonicalName(moduleSpecifier: string): string {
    const last = moduleSpecifier.split('/').pop() ?? moduleSpecifier;
    return last.replace(/^@/, '');
  }

  // ── Pass 2: URL literals ───────────────────────────────────

  private scanUrlLiterals(
    sf: ReturnType<Project['createSourceFile']>,
    hostnameToSlug: Map<string, string>,
    filePath: string,
  ): ScanResult[] {
    if (hostnameToSlug.size === 0) return [];
    const out: ScanResult[] = [];

    sf.forEachDescendant((node) => {
      let raw: string | null = null;
      if (node.getKind() === SyntaxKind.StringLiteral) {
        raw = (node as StringLiteral).getLiteralText();
      } else if (node.getKind() === SyntaxKind.NoSubstitutionTemplateLiteral) {
        raw = (node as NoSubstitutionTemplateLiteral).getLiteralText();
      } else if (node.getKind() === SyntaxKind.TemplateExpression) {
        // For interpolated templates, take the static head — that's where
        // hostnames live in real code (`https://api.stripe.com/${path}`).
        raw = (node as TemplateExpression).getHead().getLiteralText();
      } else {
        return;
      }

      if (!raw || raw.length < 4) return;
      // Cheap skip: only consider literals that look like URLs / paths.
      if (!raw.includes('/') && !raw.includes('.')) return;

      for (const [host, slug] of hostnameToSlug) {
        if (!raw.includes(host)) continue;

        out.push({
          catalogSlug: slug,
          kind: 'HTTP_HOSTNAME',
          surface: host,
          filePath,
          line: node.getStartLineNumber(),
        });

        // Try to extract a path component too — `https://api.stripe.com/v1/customers`
        // → `/v1/customers`. Naive but fine for V3.1; full URL parse comes in V3.2.
        const path = this.extractPath(raw, host);
        if (path) {
          out.push({
            catalogSlug: slug,
            kind: 'HTTP_PATH',
            surface: path,
            filePath,
            line: node.getStartLineNumber(),
          });
        }
        break; // one literal can only match one hostname
      }
    });

    return out;
  }

  private extractPath(literal: string, host: string): string | null {
    const idx = literal.indexOf(host);
    if (idx === -1) return null;
    const after = literal.slice(idx + host.length);
    if (!after.startsWith('/')) return null;
    // Stop at query string, hash, or template interpolation marker.
    const stop = after.search(/[?#${]/);
    const path = stop === -1 ? after : after.slice(0, stop);
    if (path.length < 2) return null;
    return path;
  }

  // ── Pass 3: OpenAPI paths ──────────────────────────────────

  private scanOpenapiPaths(
    sf: ReturnType<Project['createSourceFile']>,
    filePath: string,
  ): ScanResult[] {
    // Detect `import createClient from 'openapi-fetch'` (or named) and
    // collect call sites — the first string-literal arg to the resulting
    // client's HTTP methods is the path. We scan imports directly here
    // because openapi-fetch is meta — not associated with any single
    // catalog entry, so it isn't in `packageToSlug`.
    const hasOpenapiImport = sf.getImportDeclarations().some((d) => {
      const spec = d.getModuleSpecifierValue();
      return spec === 'openapi-fetch' || (spec ?? '').startsWith('openapi-fetch/');
    });
    if (!hasOpenapiImport) return [];

    // Without full type-resolution we can't bind a generic `paths` type
    // back to a catalog entry. V3.1 surfaces the raw path; V3.2 will
    // resolve the `paths` type literal against the catalog's surface
    // registry. For now, attribute to `null` slug — the orchestrator
    // drops these unless the path matches a known hostname pattern.
    const out: ScanResult[] = [];
    sf.forEachDescendant((node) => {
      if (node.getKind() !== SyntaxKind.CallExpression) return;
      const call = node as CallExpression;
      const expr = call.getExpression();
      if (expr.getKind() !== SyntaxKind.PropertyAccessExpression) return;

      const access = expr as PropertyAccessExpression;
      const method = access.getName().toLowerCase();
      if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) return;

      const args = call.getArguments();
      if (args.length === 0) return;
      const first = args[0];
      let pathLiteral: string | null = null;
      if (first.getKind() === SyntaxKind.StringLiteral) {
        pathLiteral = (first as StringLiteral).getLiteralText();
      } else if (first.getKind() === SyntaxKind.NoSubstitutionTemplateLiteral) {
        pathLiteral = (first as NoSubstitutionTemplateLiteral).getLiteralText();
      }
      if (!pathLiteral || !pathLiteral.startsWith('/')) return;

      // No catalog attribution yet — emit with a sentinel slug and let
      // the orchestrator filter. Keeping the data lets V3.2 backfill.
      out.push({
        catalogSlug: '__openapi__',
        kind: 'OPENAPI_PATH',
        surface: `${method.toUpperCase()} ${pathLiteral}`,
        filePath,
        line: call.getStartLineNumber(),
      });
    });
    return out;
  }

  private scriptKindFor(path: string): ScriptKind {
    if (path.endsWith('.tsx')) return ScriptKind.TSX;
    if (path.endsWith('.jsx')) return ScriptKind.JSX;
    if (path.endsWith('.js') || path.endsWith('.cjs') || path.endsWith('.mjs')) {
      return ScriptKind.JS;
    }
    return ScriptKind.TS;
  }
}
