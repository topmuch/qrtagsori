# ════════════════════════════════════════════════════════════════════
# QRTags — Dockerfile production pour Coolify
# Multi-stage build optimisé (deps → build → runtime)
# Stack : Next.js 16 (standalone) + Prisma 6 + SQLite
# ════════════════════════════════════════════════════════════════════

# ─── Stage 1: deps ──────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copier seulement les fichiers de dépendances (cache Docker optimal)
COPY package.json package-lock.json* bun.lock* ./
COPY prisma ./prisma

# Installer les dépendances (--legacy-peer-deps nécessaire à cause de
# nodemailer 8 vs next-auth 4 — voir README)
RUN npm install --legacy-peer-deps --no-audit --no-fund

# ─── Stage 2: builder ───────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables d'env de build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# DATABASE_URL de build (sera écrasée au runtime par Coolify)
ENV DATABASE_URL="file:/tmp/build.db"

# Générer le client Prisma
RUN npx prisma generate

# Build Next.js (standalone mode — voir next.config.ts)
RUN npm run build

# ─── Stage 3: runtime ───────────────────────────────────────────────
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

# Copier le build standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copier Prisma (pour `prisma db push` au runtime)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Créer les répertoires de données + uploads
RUN mkdir -p /app/data /app/data/backups /app/public/uploads/damage && \
    chown -R nextjs:nodejs /app/data /app/public

# Script de démarrage : 
#   1. mkdir données
#   2. prisma db push (synchro schéma)
#   3. create-admin (crée le superadmin si DB vide)
#   4. lancement du serveur Next.js
COPY --chown=nextjs:nodejs docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/app/docker-entrypoint.sh"]
