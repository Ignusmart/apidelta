# ── Stage 1: Install dependencies + generate Prisma client ──
FROM node:20-alpine AS deps

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
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@9 --activate

# Create non-root user
RUN addgroup --system --gid 1001 apidelta && \
    adduser --system --uid 1001 --ingroup apidelta apidelta

WORKDIR /app

# Copy package files for pnpm to resolve workspace
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/

# Install production deps only
RUN pnpm install --frozen-lockfile --prod

# Copy Prisma schema + regenerate client for production node_modules
COPY apps/api/prisma/ apps/api/prisma/
RUN cd apps/api && npx prisma@6.19.3 generate

# Copy built dist
COPY --from=builder /app/apps/api/dist apps/api/dist

# Copy start script
COPY apps/api/scripts/start.sh apps/api/scripts/start.sh
RUN chmod +x apps/api/scripts/start.sh

# Switch to non-root user
RUN chown -R apidelta:apidelta /app
USER apidelta

ENV NODE_ENV=production
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

CMD ["apps/api/scripts/start.sh"]
