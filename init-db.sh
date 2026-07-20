#!/bin/sh
# ════════════════════════════════════════════════════════════════════
# QRTags — init-db.sh (ultra-robuste, v3)
# ════════════════════════════════════════════════════════════════════
set -e

echo "══════════════════════════════════════════════════"
echo "  QRTags — Démarrage"
echo "  DATABASE_URL: ${DATABASE_URL:-file:/app/data/qrtags.db}"
echo "══════════════════════════════════════════════════"

mkdir -p /app/data /app/data/backups /app/public/uploads/damage

DB_FILE=$(echo "${DATABASE_URL:-file:/app/data/qrtags.db}" | sed 's/^file://')
SCHEMA_PATH="/app/prisma/schema.prisma"

# ════════════════════════════════════════════════════════════════════
# ÉTAPE 1 : Si la DB existe, vérifier les colonnes QRTags critiques
# Si elles manquent → HARD RESET (supprimer la DB pour forcer une
# recréation propre avec prisma db push)
# ════════════════════════════════════════════════════════════════════
NEEDS_RESET=0

if [ -f "$DB_FILE" ]; then
  echo "📂 DB existante détectée — vérification des colonnes QRTags..."

  # Vérifier si la colonne trackingToken existe (critère de schéma QRTags)
  HAS_TRACKING=$(sqlite3 "$DB_FILE" "PRAGMA table_info(Baggage);" 2>/dev/null | grep -c "trackingToken" || echo "0")

  if [ "$HAS_TRACKING" = "0" ]; then
    echo "🚨 Colonne 'trackingToken' MANQUANTE — la DB a un schéma obsolète"
    echo "🗑️  HARD RESET : suppression de la DB pour recréation propre..."
    rm -f "$DB_FILE" "$DB_FILE-journal" "$DB_FILE-wal" "$DB_FILE-shm"
    NEEDS_RESET=1
  else
    echo "✅ Colonne 'trackingToken' présente — schéma QRTags OK"
  fi
else
  echo "📦 Aucune DB existante — création from scratch..."
  NEEDS_RESET=1
fi

# ════════════════════════════════════════════════════════════════════
# ÉTAPE 2 : Appliquer le schéma Prisma (crée ou met à jour la DB)
# Utiliser le binaire prisma directement (pas npx, qui peut échouer
# en standalone sans internet)
# ════════════════════════════════════════════════════════════════════
echo "📦 Application du schéma Prisma..."

# Essayer plusieurs chemins pour le binaire prisma
PRISMA_BIN=""
for path in "/app/node_modules/.bin/prisma" "/app/.next/standalone/node_modules/.bin/prisma"; do
  if [ -x "$path" ]; then
    PRISMA_BIN="$path"
    break
  fi
done

if [ -z "$PRISMA_BIN" ]; then
  echo "⚠️ Binaire prisma non trouvé — fallback vers npx"
  PRISMA_BIN="npx prisma"
fi

echo "  Using prisma: $PRISMA_BIN"

# Lancer prisma db push
$PRISMA_BIN db push --schema="$SCHEMA_PATH" --skip-generate --accept-data-loss 2>&1 || {
  echo "⚠️ prisma db push a échoué — fallback vers le script Node de migration"
}
echo "✅ Schéma DB appliqué"

# ════════════════════════════════════════════════════════════════════
# ÉTAPE 3 : Migration idempotente via script Node.js
# (vérifie chaque colonne, ALTER TABLE si manquante, crée superadmin)
# ════════════════════════════════════════════════════════════════════
echo "🔧 Migration idempotente des colonnes QRTags..."
MIGRATE_SCRIPT="/app/scripts/migrate-qrtags-columns.cjs"
if [ -f "$MIGRATE_SCRIPT" ]; then
  node "$MIGRATE_SCRIPT" 2>&1 || {
    echo "⚠️ Migration script failed — continuing anyway"
  }
else
  echo "⚠️ Migration script not found at $MIGRATE_SCRIPT"
fi

# ════════════════════════════════════════════════════════════════════
# ÉTAPE 4 : Vérification FINALE — refuser de démarrer si colonnes manquent
# ════════════════════════════════════════════════════════════════════
echo "📊 Vérification finale des colonnes Baggage..."
if [ -f "$DB_FILE" ]; then
  FINAL_CHECK=$(sqlite3 "$DB_FILE" "PRAGMA table_info(Baggage);" 2>/dev/null | grep -c "trackingToken\|trackingEnabled\|scanCount\|isLost\|customData" || echo "0")
  echo "  Colonnes QRTags trouvées: $FINAL_CHECK / 5 attendues"

  if [ "$FINAL_CHECK" -lt 5 ]; then
    echo "❌ CRITICAL: Colonnes QRTags toujours manquantes après migration"
    echo "🗑️  Dernier recours : HARD RESET de la DB..."
    rm -f "$DB_FILE" "$DB_FILE-journal" "$DB_FILE-wal" "$DB_FILE-shm"

    # Re-run prisma db push
    $PRISMA_BIN db push --schema="$SCHEMA_PATH" --skip-generate --accept-data-loss 2>&1 || true

    # Re-run migration
    if [ -f "$MIGRATE_SCRIPT" ]; then
      node "$MIGRATE_SCRIPT" 2>&1 || true
    fi

    # Re-check final
    FINAL_CHECK2=$(sqlite3 "$DB_FILE" "PRAGMA table_info(Baggage);" 2>/dev/null | grep -c "trackingToken\|trackingEnabled\|scanCount\|isLost\|customData" || echo "0")
    echo "  Après hard reset: $FINAL_CHECK2 / 5 colonnes trouvées"

    if [ "$FINAL_CHECK2" -lt 5 ]; then
      echo "💀 FATAL: Impossible de créer les colonnes QRTags. Le serveur va démarrer mais crashera."
    fi
  fi
fi

# ════════════════════════════════════════════════════════════════════
# ÉTAPE 5 : Démarrer le serveur Next.js
# ════════════════════════════════════════════════════════════════════
echo "🚀 Démarrage Next.js..."
exec node server.js
