# ════════════════════════════════════════════════════════════════════
# QRTags — Dockerfile production pour Coolify
# Multi-stage build (deps → build → runtime)
# Coolify monte le code source automatiquement (pas de git clone)
# ════════════════════════════════════════════════════════════════════

# ─── Stage 1: deps — installer les dépendances ──────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copier uniquement les fichiers de dépendances (cache Docker optimal)
COPY package.json package-lock.json* ./
COPY prisma ./prisma

# Installer avec --legacy-peer-deps (nodemailer 8 vs next-auth 4)
RUN npm install --legacy-peer-deps --no-audit --no-fund

# ─── Stage 2: builder — compiler l'application ──────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copier node_modules depuis l'étage deps
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables d'env de build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# DATABASE_URL de build (sera écrasée au runtime par Coolify)
ENV DATABASE_URL="file:/tmp/build.db"

# QRTags : Cache buster — force Coolify à rebuild from scratch
# (évite d'utiliser un build en cache avec anciennes colonnes QRBags)
ARG CACHE_BUST=2026-07-19-v2
RUN echo "Build ${CACHE_BUST}"

# Générer le client Prisma
RUN npx prisma generate

# Build Next.js (standalone mode — voir next.config.ts)
RUN npm run build

# ─── Stage 3: runtime — image finale légère ─────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl curl tini

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# DATABASE_URL par défaut — Coolify la surchargera via ses variables d'env
ENV DATABASE_URL="file:/app/data/qrtags.db"

# Créer un user non-root pour la sécurité
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copier le build standalone (Next.js output: standalone)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copier Prisma (pour prisma db push au runtime)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
# QRTags : copier scripts/create-admin.cjs (requis par docker-entrypoint.sh)
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Créer les répertoires de données + uploads
RUN mkdir -p /app/data /app/data/backups /app/public/uploads/damage && \
    chown -R nextjs:nodejs /app/data /app/public

# Script de démarrage
COPY --chown=nextjs:nodejs docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/app/docker-entrypoint.sh"]
