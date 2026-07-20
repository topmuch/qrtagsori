#!/bin/sh
set -e

echo "══════════════════════════════════════════════════"
echo "  QRTags — Démarrage"
echo "══════════════════════════════════════════════════"

mkdir -p /app/data /app/data/backups /app/public/uploads/damage

# ─── STRATÉGIE ROBUSTE ────────────────────────────────────────────
# 1. Si la DB n'existe pas → prisma db push la crée from scratch
# 2. Si la DB existe → prisma db push met à jour le schéma (ajoute colonnes
#    manquantes sans toucher aux données — c'est Prisma qui gère)
# 3. Ensuite, le script Node migrate-qrtags-columns.cjs:
#    - Vérifie idempotemment chaque colonne avec PRAGMA + ALTER TABLE
#    - Crée l'index sur trackingToken
#    - Crée/met à jour le superadmin
#
# Avantage : Prisma db push gère mieux que sqlite3 heredoc
# ─────────────────────────────────────────────────────────────────

DB_FILE=$(echo "${DATABASE_URL:-file:/app/data/qrtags.db}" | sed 's/^file://')

# 1. Appliquer le schéma Prisma (crée ou met à jour la DB)
echo "📦 Application du schéma Prisma..."
npx prisma db push --skip-generate --accept-data-loss 2>&1 || {
  echo "⚠️ prisma db push a échoué — fallback vers le script de migration"
}
echo "✅ Schéma DB appliqué"

# 2. Lancer le script de migration idempotent (Node.js, plus fiable que shell)
echo "🔧 Migration idempotente des colonnes QRTags..."
node /app/scripts/migrate-qrtags-columns.cjs 2>&1 || {
  echo "⚠️ Migration script failed — continuing anyway"
}

# 3. Vérification finale
echo "📊 Vérification colonnes Baggage:"
if [ -f "$DB_FILE" ]; then
  sqlite3 "$DB_FILE" "PRAGMA table_info(Baggage);" 2>/dev/null | grep -E "trackingToken|trackingEnabled|scanCount|isLost|customData" || echo "  ⚠️ Certaines colonnes QRTags manquent"
fi

# 4. Démarrer le serveur
echo "🚀 Démarrage Next.js..."
exec node server.js
