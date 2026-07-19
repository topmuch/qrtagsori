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
echo "📦 Synchronisation schéma Prisma..."
npx prisma db push --skip-generate --accept-data-loss 2>&1 || {
  echo "⚠️  prisma db push a échoué — utilisation du script SQL manuel..."
}

# 3. Script SQL manuel : ajouter colonnes QRTags manquantes
if [ -f /app/scripts/migrate-db.cjs ]; then
  echo "🔧 Migration SQL manuelle..."
  node /app/scripts/migrate-db.cjs 2>&1 || true
fi

# 4. Créer le superadmin par défaut
if [ -f /app/scripts/create-admin.cjs ]; then
  echo "👤 Vérification superadmin..."
  node /app/scripts/create-admin.cjs 2>&1 || true
fi

# 5. Vérifier que le superadmin existe vraiment
echo "🔍 Vérification superadmin en DB..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findFirst({ where: { role: 'superadmin' } })
  .then(u => {
    if (u) console.log('✅ Superadmin trouvé:', u.email);
    else console.log('⚠️ Aucun superadmin trouvé!');
  })
  .catch(e => console.log('⚠️ Erreur vérif:', e.message))
  .finally(() => prisma.\$disconnect());
" 2>&1

# 6. Démarrer le serveur
echo "🚀 Démarrage Next.js port ${PORT:-3000}..."
exec node server.js
