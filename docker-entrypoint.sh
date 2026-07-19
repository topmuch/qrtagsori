#!/bin/sh
# ════════════════════════════════════════════════════════════════════
# QRTags — docker-entrypoint.sh
# Exécuté au démarrage du container Coolify.
# ════════════════════════════════════════════════════════════════════
set -e

echo "────────────────────────────────────────────────"
echo "  QRTags — Démarrage du container"
echo "  DATABASE_URL: ${DATABASE_URL:-file:/app/data/qrtags.db}"
echo "  NODE_ENV:     ${NODE_ENV:-production}"
echo "  PORT:         ${PORT:-3000}"
echo "────────────────────────────────────────────────"

# 1. Créer les répertoires de données
mkdir -p /app/data /app/data/backups /app/public/uploads/damage
echo "✅ Répertoires de données prêts"

# 2. Synchroniser le schéma Prisma
echo "📦 Synchronisation du schéma Prisma..."
npx prisma db push --skip-generate --accept-data-loss 2>&1 | tail -10 || {
  echo "⚠️  prisma db push a échoué — le serveur va quand même démarrer"
}

# 3. Créer le superadmin par défaut
if [ -f /app/scripts/create-admin.cjs ]; then
  echo "👤 Vérification du superadmin..."
  node /app/scripts/create-admin.cjs 2>&1 | tail -5 || {
    echo "⚠️  create-admin a échoué — le serveur va quand même démarrer"
  }
fi

# 4. Lancer le serveur Next.js (standalone)
echo "🚀 Démarrage du serveur Next.js sur le port ${PORT:-3000}..."
exec node server.js
