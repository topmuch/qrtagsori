#!/bin/sh
# ════════════════════════════════════════════════════════════════════
# QRTags — docker-entrypoint.sh
# Exécuté au démarrage du container Coolify.
# 1. Création des répertoires de données
# 2. Synchronisation du schéma Prisma (db push)
# 3. Création du superadmin par défaut (si DB vide)
# 4. Lancement du serveur Next.js (standalone)
# ════════════════════════════════════════════════════════════════════
set -e

echo "────────────────────────────────────────────────"
echo "  QRTags — Démarrage du container"
echo "  DATABASE_URL: ${DATABASE_URL:-file:/app/data/qrtags.db}"
echo "  NODE_ENV:     ${NODE_ENV:-production}"
echo "  PORT:         ${PORT:-3000}"
echo "────────────────────────────────────────────────"

# 1. Créer les répertoires de données (idempotent)
mkdir -p /app/data /app/data/backups /app/public/uploads/damage
echo "✅ Répertoires de données prêts"

# 2. Synchroniser le schéma Prisma avec la DB
# (Crée la DB SQLite si elle n'existe pas, ajoute les nouvelles colonnes sinon)
echo "📦 Synchronisation du schéma Prisma..."
npx prisma db push --skip-generate --accept-data-loss 2>&1 | tail -10 || {
  echo "⚠️  prisma db push a échoué — le serveur va quand même démarrer"
}

# 3. Créer le superadmin par défaut si la DB est vide
# (Le script create-admin.cjs vérifie lui-même si l'admin existe déjà)
if [ -f /app/scripts/create-admin.cjs ]; then
  echo "👤 Vérification du superadmin par défaut..."
  node /app/scripts/create-admin.cjs 2>&1 | tail -5 || {
    echo "⚠️  create-admin a échoué — le serveur va quand même démarrer"
  }
fi

# 4. Lancer le serveur Next.js (standalone)
echo "🚀 Démarrage du serveur Next.js sur le port ${PORT:-3000}..."
exec node server.js
