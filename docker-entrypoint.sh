#!/bin/sh
# ════════════════════════════════════════════════════════════════════
# QRTags — docker-entrypoint.sh
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

# 2. Synchroniser le schéma Prisma avec la DB
# QRTags : --accept-data-loss pour dropper les anciennes colonnes QRBags
# (maxTags, identificationMark, itemBrand, itemColor, objectCategory, plan, etc.)
# et ajouter les nouvelles (agencyTypeUpdatedAt, customData, lotId, ownerPin, etc.)
# IMPORTANT : pas de pipe vers tail — ça casse le prompt interactif de Prisma
echo "📦 Synchronisation du schéma Prisma..."
npx prisma db push --accept-data-loss --skip-generate 2>&1 || {
  echo "⚠️  prisma db push a échoué — tentative avec --force-reset..."
  # Dernier recours : reset complet de la DB (perte de données)
  npx prisma db push --force-reset --skip-generate --accept-data-loss 2>&1 || {
    echo "⚠️  --force-reset a aussi échoué — le serveur va quand même démarrer"
  }
}
echo "✅ Schéma DB synchronisé"

# 3. Créer le superadmin par défaut
if [ -f /app/scripts/create-admin.cjs ]; then
  echo "👤 Vérification du superadmin..."
  node /app/scripts/create-admin.cjs 2>&1 || {
    echo "⚠️  create-admin a échoué — le serveur va quand même démarrer"
  }
fi

# 4. Lancer le serveur Next.js (standalone)
echo "🚀 Démarrage du serveur Next.js sur le port ${PORT:-3000}..."
exec node server.js
