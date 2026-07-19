#!/bin/sh
# ════════════════════════════════════════════════════════════════════
# QRTags — docker-entrypoint.sh
# ════════════════════════════════════════════════════════════════════

echo "══════════════════════════════════════════════════"
echo "  QRTags — Démarrage du container"
echo "  DATABASE_URL: ${DATABASE_URL:-file:/app/data/qrtags.db}"
echo "══════════════════════════════════════════════════"

# 1. Créer les répertoires
mkdir -p /app/data /app/data/backups /app/public/uploads/damage
echo "✅ Répertoires créés"

# 2. Synchroniser le schéma Prisma avec la DB
# --accept-data-loss pour dropper les anciennes colonnes QRBags
echo "📦 Synchronisation schéma Prisma..."
npx prisma db push --skip-generate --accept-data-loss 2>&1 || {
  echo "⚠️  prisma db push a échoué — utilisation du script SQL manuel..."
}

# 3. Script SQL manuel : ajouter colonnes QRTags manquantes
# Ce script utilise sqlite3 directement pour ALTER TABLE + CREATE TABLE
# Il fonctionne MÊME si prisma db push a échoué
if [ -f /app/scripts/migrate-db.cjs ]; then
  echo "🔧 Migration SQL manuelle..."
  node /app/scripts/migrate-db.cjs 2>&1 || {
    echo "⚠️  Migration SQL manuelle échouée — continuation..."
  }
fi

# 4. Créer le superadmin par défaut (uniquement si aucun superadmin existe)
if [ -f /app/scripts/create-admin.cjs ]; then
  echo "👤 Vérification superadmin..."
  node /app/scripts/create-admin.cjs 2>&1 || true
fi

# 5. Démarrer le serveur
echo "🚀 Démarrage Next.js port ${PORT:-3000}..."
exec node server.js
