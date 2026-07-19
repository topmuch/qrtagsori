#!/bin/sh
# ════════════════════════════════════════════════════════════════════
# QRTags — docker-entrypoint.sh
# ════════════════════════════════════════════════════════════════════

echo "══════════════════════════════════════════════════"
echo "  QRTags — Démarrage"
echo "  DATABASE_URL: ${DATABASE_URL:-file:/app/data/qrtags.db}"
echo "══════════════════════════════════════════════════"

mkdir -p /app/data /app/data/backups /app/public/uploads/damage

# 1. Supprimer ancienne DB si colonnes QRBags fantômes détectées
DB_FILE=$(echo "${DATABASE_URL:-file:/app/data/qrtags.db}" | sed 's/file://')
if [ -f "$DB_FILE" ]; then
  HAS_GHOST=$(sqlite3 "$DB_FILE" "PRAGMA table_info(Agency);" 2>/dev/null | grep -c "maxTags\|identificationMark\|itemBrand")
  if [ "$HAS_GHOST" -gt 0 ]; then
    echo "🗑️  Anciennes colonnes QRBags détectées — suppression DB..."
    rm -f "$DB_FILE" "$DB_FILE-journal"
    echo "✅ DB supprimée"
  fi
fi

# 2. Créer la DB from scratch avec prisma db push
echo "📦 Création schéma DB..."
npx prisma db push --skip-generate 2>&1
echo "✅ Schéma DB créé"

# 3. Créer le superadmin DIRECTEMENT en SQL (pas via Prisma)
# QRTags : on utilise sqlite3 directement pour garantir que l'admin existe
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@qrtags.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"

echo "👤 Création superadmin: $ADMIN_EMAIL"

# Hasher le mot de passe avec node + bcrypt
HASHED_PASSWORD=$(node -e "
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('$ADMIN_PASSWORD', 10);
console.log(hash);
" 2>/dev/null)

if [ -z "$HASHED_PASSWORD" ]; then
  echo "⚠️  bcrypt indisponible — utilisation hash précalculé"
  HASHED_PASSWORD='$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
fi

# Insérer le superadmin en SQL direct
sqlite3 "$DB_FILE" "
  INSERT OR IGNORE INTO User (id, email, name, password, role, createdAt, updatedAt)
  VALUES (
    LOWER(HEX(RANDOMBLOB(12))),
    '$ADMIN_EMAIL',
    'QRTags SuperAdmin',
    '$HASHED_PASSWORD',
    'superadmin',
    datetime('now'),
    datetime('now')
  );
" 2>&1

# Si l'user existe déjà, update le mot de passe
sqlite3 "$DB_FILE" "
  UPDATE User SET password='$HASHED_PASSWORD', role='superadmin'
  WHERE email='$ADMIN_EMAIL';
" 2>&1

# Vérifier
COUNT=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM User WHERE role='superadmin';" 2>/dev/null)
echo "✅ Superadmin en DB: $COUNT"

# 4. Démarrer le serveur
echo "🚀 Démarrage Next.js..."
exec node server.js
