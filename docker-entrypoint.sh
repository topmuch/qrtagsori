#!/bin/sh
# ════════════════════════════════════════════════════════════════════
# QRTags — docker-entrypoint.sh
# Hard reset DB + sync schéma + create admin + start server
# ════════════════════════════════════════════════════════════════════

echo "══════════════════════════════════════════════════"
echo "  QRTags — Démarrage du container"
echo "  DATABASE_URL: ${DATABASE_URL:-file:/app/data/qrtags.db}"
echo "  NODE_ENV:     ${NODE_ENV:-production}"
echo "  PORT:         ${PORT:-3000}"
echo "══════════════════════════════════════════════════"

# 1. Créer les répertoires
mkdir -p /app/data /app/data/backups /app/public/uploads/damage
echo "✅ Répertoires créés"

# 2. HARD RESET de la DB SQLite
# QRTags : on supprime le fichier DB et on le recrée from scratch
# pour éviter les conflits de colonnes entre QRBags et QRTags.
# ATTENTION : cela efface les données existantes. Acceptable en phase
# de refonte. En prod stable, on fera des migrations Prisma propres.
DB_FILE="/app/data/qrtags.db"
if [ -f "$DB_FILE" ]; then
  echo "🗑️  Suppression de l'ancienne DB (hard reset)..."
  rm -f "$DB_FILE" "$DB_FILE-journal"
  echo "✅ Ancienne DB supprimée"
fi

# 3. Créer la DB from scratch avec le schéma QRTags
echo "📦 Création de la DB from scratch..."
npx prisma db push --skip-generate 2>&1
if [ $? -ne 0 ]; then
  echo "⚠️  prisma db push a échoué — tentative avec --force-reset..."
  npx prisma db push --force-reset --skip-generate 2>&1 || true
fi
echo "✅ DB créée avec le schéma QRTags"

# 4. Créer le superadmin par défaut
if [ -f /app/scripts/create-admin.cjs ]; then
  echo "👤 Création du superadmin..."
  node /app/scripts/create-admin.cjs 2>&1 || true
fi

# 5. Lancer le serveur
echo "🚀 Démarrage Next.js sur port ${PORT:-3000}..."
exec node server.js
