# ── Stage 1: Install dependencies + generate Prisma client ──
FROM node:20-bookworm-slim AS deps

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/api/prisma/ apps/api/prisma/

# Install all deps (production + dev for prisma generate + nest build)
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# ── Stage 2: Build NestJS ──
FROM deps AS builder

COPY apps/api/ apps/api/

RUN cd apps/api && pnpm build

# ── Stage 3: Production image ──
FROM node:20-bookworm-slim AS runner

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy package files for pnpm to resolve workspace
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/

# Install production deps only — playwright npm is in apps/api dependencies,
# so it lands in node_modules here and `pnpm exec playwright` resolves to
# the version pinned in the lockfile.
RUN pnpm install --frozen-lockfile --prod

# Install Chromium + Playwright's system dependencies into a stable
# shared path so the non-root runtime user can read the browser. Done as
# root because `--with-deps` shells out to apt-get.
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN pnpm --filter @apidelta/api exec playwright install --with-deps chromium && \
    rm -rf /var/lib/apt/lists/*

# Copy Prisma schema + regenerate client for production node_modules
COPY apps/api/prisma/ apps/api/prisma/
RUN cd apps/api && npx prisma@6.19.3 generate

# Copy built dist
COPY --from=builder /app/apps/api/dist apps/api/dist

# Copy start script
COPY apps/api/scripts/start.sh apps/api/scripts/start.sh
RUN chmod +x apps/api/scripts/start.sh

# Create non-root runtime user. Use groupadd/useradd (Debian shadow
# package) instead of Alpine's addgroup/adduser. `--create-home` is
# REQUIRED — Debian's useradd doesn't create /home/<user> by default
# (Alpine's adduser does), and npx writes its cache to $HOME/.npm. The
# start.sh runs `npx prisma migrate deploy` on boot, which crash-loops
# the container with EACCES on mkdir /home/apidelta otherwise.
RUN groupadd --system --gid 1001 apidelta && \
    useradd --system --uid 1001 --gid apidelta --create-home apidelta && \
    chown -R apidelta:apidelta /app /ms-playwright
USER apidelta

ENV NODE_ENV=production
EXPOSE 3001

# bookworm-slim has no wget/curl — use Node for the healthcheck instead.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))" || exit 1

CMD ["apps/api/scripts/start.sh"]
