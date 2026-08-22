# ═══════════════════════════════════════════════════════════════
# QRTags — Production Dockerfile (multi-stage)
# ═══════════════════════════════════════════════════════════════════════════

# ── Stage 1: Build ────────────────────────────────────────────────
FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    sqlite3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps --no-audit --no-fund

COPY prisma ./prisma/
COPY scripts ./scripts/
COPY next.config.ts .
COPY tsconfig.json .
COPY postcss.config.mjs .
COPY public ./public/
COPY src ./src/
COPY init-db.sh .

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:/tmp/build.db"
RUN npx prisma generate
RUN npm run build
RUN npm prune --production

# ── Stage 2: Production ──────────────────────────────────────────
FROM node:20-slim AS runner

RUN apt-get update && apt-get install -y --no-install-recommends \
    sqlite3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy standalone output
COPY --from=builder /app/.next/standalone ./

# Copy static assets and public
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy prisma and scripts for runtime migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/init-db.sh ./
COPY --from=builder /app/package.json ./

# Copy only production node_modules
COPY --from=builder /app/node_modules ./node_modules

# Create data directories
RUN mkdir -p /app/data /app/data/backups /app/public/uploads/damage \
    && chmod -R 777 /app/data /app/public/uploads/damage \
    && chmod +x init-db.sh

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/qrtags.db"

CMD ["sh", "/app/init-db.sh"]
