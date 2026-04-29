#!/usr/bin/env node
/**
 * Copies apps/api/prisma/schema.prisma into apps/web/prisma/schema.prisma
 * so `prisma generate` in the web workspace can find it via a sibling
 * path. This is intentionally a copy (not a symlink) — Prisma 6 infers
 * the "project root" from the schema's parent directory, and a path
 * outside the workspace makes Prisma try to auto-install into the
 * inferred parent (which fails on Vercel where pnpm filters skip
 * installing apps/api's deps).
 *
 * Source of truth stays at apps/api/prisma/schema.prisma. The copy in
 * apps/web/prisma/ is gitignored.
 */
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, '../../api/prisma/schema.prisma');
const dest = resolve(here, '../prisma/schema.prisma');

if (!existsSync(src)) {
  console.error(`[sync-schema] source not found: ${src}`);
  process.exit(1);
}

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);
console.log(`[sync-schema] ${src} → ${dest}`);
