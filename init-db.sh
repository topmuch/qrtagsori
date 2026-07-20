#!/bin/sh
set -e

echo "══════════════════════════════════════════════════"
echo "  QRTags — Démarrage"
echo "══════════════════════════════════════════════════"

mkdir -p /app/data /app/data/backups /app/public/uploads/damage

# ─── STRATÉGIE ROBUSTE ────────────────────────────────────────────
# On ne supprime plus la DB existante. À la place :
#  1. Si la DB n'existe pas → la créer from scratch avec le schéma complet
#  2. Si la DB existe → vérifier chaque table et ALTER TABLE pour ajouter
#     les colonnes manquantes (idempotent — ne fait rien si la colonne existe)
#
# Avantages :
#  - Préserve les données utilisateur entre les déploiements
#  - Ajoute les nouvelles colonnes sans casser l'existant
#  - Fonctionne même si le volume Docker persiste
# ─────────────────────────────────────────────────────────────────

DB_PATH="/app/data/qrtags.db"

# Créer la DB + tables si elle n'existe pas
if [ ! -f "$DB_PATH" ]; then
  echo "📦 Création DB from scratch..."
  sqlite3 "$DB_PATH" <<'SQLEOF'
CREATE TABLE User (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  password TEXT,
  role TEXT NOT NULL DEFAULT 'agency',
  agencyId TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Agency (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  email TEXT,
  phone TEXT,
  address TEXT,
  agencyType TEXT NOT NULL DEFAULT 'generic',
  active INTEGER NOT NULL DEFAULT 1,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Baggage (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'voyageur',
  setId TEXT,
  agencyId TEXT,
  travelerFirstName TEXT,
  travelerLastName TEXT,
  whatsappOwner TEXT,
  baggageIndex INTEGER DEFAULT 1,
  baggageType TEXT DEFAULT 'cabine',
  status TEXT NOT NULL DEFAULT 'in_stock',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expiresAt DATETIME,
  lastScanDate DATETIME,
  lastLocation TEXT,
  declaredLostAt DATETIME,
  foundAt DATETIME,
  founderName TEXT,
  founderPhone TEXT,
  founderAt DATETIME,
  activatedAt DATETIME,
  customData TEXT,
  ownerPin TEXT,
  ownerPinSetAt DATETIME,
  -- Suivi partageable (page /track/[token])
  trackingToken TEXT UNIQUE,
  trackingEnabled INTEGER NOT NULL DEFAULT 1,
  scanCount INTEGER NOT NULL DEFAULT 0,
  lastScanLocation TEXT,
  isLost INTEGER NOT NULL DEFAULT 0,
  lostReportedAt DATETIME,
  lostMessage TEXT
);

CREATE TABLE ScanLog (
  id TEXT PRIMARY KEY,
  baggageId TEXT NOT NULL,
  ipAddress TEXT,
  country TEXT,
  city TEXT,
  latitude REAL,
  longitude REAL,
  location TEXT,
  message TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Session (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  userAgent TEXT,
  ipAddress TEXT,
  lastActivity DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expiresAt DATETIME NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Notification (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  userId TEXT,
  agencyId TEXT,
  baggageId TEXT,
  message TEXT NOT NULL,
  data TEXT,
  read INTEGER NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE LoginLog (
  id TEXT PRIMARY KEY,
  userId TEXT,
  email TEXT NOT NULL,
  success INTEGER NOT NULL DEFAULT 0,
  failureReason TEXT,
  ipAddress TEXT,
  userAgent TEXT,
  country TEXT,
  city TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE DamageReport (
  id TEXT PRIMARY KEY,
  baggageId TEXT NOT NULL,
  type TEXT NOT NULL,
  photos TEXT NOT NULL,
  description TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Setting (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE FeatureFlag (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  enabled INTEGER NOT NULL DEFAULT 0,
  icon TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Page (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  published INTEGER NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Banner (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE EmailSettings (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'console',
  fromEmail TEXT NOT NULL DEFAULT 'noreply@qrtags.com',
  fromName TEXT NOT NULL DEFAULT 'QRTags',
  recipientEmail TEXT,
  smtpHost TEXT,
  smtpPort INTEGER,
  smtpUser TEXT,
  smtpPassword TEXT,
  smtpEncryption TEXT NOT NULL DEFAULT 'tls',
  isActive INTEGER NOT NULL DEFAULT 1,
  lastTestAt DATETIME,
  lastTestStatus TEXT,
  lastTestError TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE EmailLog (
  id TEXT PRIMARY KEY,
  to TEXT NOT NULL,
  subject TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  userId TEXT,
  agencyId TEXT,
  data TEXT,
  sentAt DATETIME,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE EmailToken (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  code TEXT,
  expiresAt DATETIME NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  usedAt DATETIME,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Invoice (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  agencyId TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending',
  description TEXT,
  items TEXT NOT NULL,
  dueDate DATETIME,
  paidAt DATETIME,
  paymentMethod TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Lead (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  source TEXT,
  notes TEXT,
  agencyId TEXT,
  assignedToId TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Observation (
  id TEXT PRIMARY KEY,
  leadId TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  userId TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE DailyReport (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  content TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Advertisement (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  imageUrl TEXT NOT NULL,
  linkUrl TEXT,
  linkTarget TEXT NOT NULL DEFAULT '_blank',
  position TEXT NOT NULL DEFAULT 'footer',
  targetScope TEXT NOT NULL DEFAULT 'all',
  agencyId TEXT,
  startDate DATETIME NOT NULL,
  endDate DATETIME,
  status TEXT NOT NULL DEFAULT 'draft',
  priority INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE AdImpression (
  id TEXT PRIMARY KEY,
  advertisementId TEXT NOT NULL,
  userId TEXT,
  agencyId TEXT,
  userRole TEXT,
  action TEXT NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE BlogPost (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  coverImage TEXT,
  category TEXT NOT NULL DEFAULT 'actualites',
  status TEXT NOT NULL DEFAULT 'draft',
  publishedAt DATETIME,
  authorId TEXT,
  views INTEGER NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE BlogView (
  id TEXT PRIMARY KEY,
  postId TEXT NOT NULL,
  userId TEXT,
  agencyId TEXT,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE SystemLog (
  id TEXT PRIMARY KEY,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT NOT NULL,
  metadata TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Checklist (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  verificationKey TEXT NOT NULL,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  email TEXT NOT NULL,
  departureDate TEXT NOT NULL,
  departureCity TEXT,
  destinationCountry TEXT NOT NULL,
  airline TEXT,
  flightNumber TEXT,
  items TEXT NOT NULL,
  itemsCount INTEGER NOT NULL DEFAULT 0,
  photoPath TEXT,
  photoSizeBytes INTEGER DEFAULT 0,
  pdfPath TEXT,
  pdfSizeBytes INTEGER DEFAULT 0,
  viewCount INTEGER NOT NULL DEFAULT 0,
  lastViewedAt DATETIME,
  emailSent INTEGER NOT NULL DEFAULT 0,
  emailSentAt DATETIME,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Review (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  rating INTEGER NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  baggageRef TEXT,
  isFeatured INTEGER NOT NULL DEFAULT 0,
  isApproved INTEGER NOT NULL DEFAULT 0,
  response TEXT,
  language TEXT NOT NULL DEFAULT 'fr',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE LossAlert (
  id TEXT PRIMARY KEY,
  baggageId TEXT NOT NULL,
  reference TEXT NOT NULL,
  alertType TEXT NOT NULL DEFAULT 'no_scan_after_arrival',
  message TEXT NOT NULL,
  dismissed INTEGER NOT NULL DEFAULT 0,
  dismissedAt DATETIME,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_baggage_agencyId ON Baggage(agencyId);
CREATE INDEX IF NOT EXISTS idx_baggage_reference ON Baggage(reference);
CREATE INDEX IF NOT EXISTS idx_baggage_status ON Baggage(status);
CREATE INDEX IF NOT EXISTS idx_baggage_trackingToken ON Baggage(trackingToken);
CREATE INDEX IF NOT EXISTS idx_scanlog_baggageId ON ScanLog(baggageId);
CREATE INDEX IF NOT EXISTS idx_session_userId ON Session(userId);
CREATE INDEX IF NOT EXISTS idx_loginlog_userId ON LoginLog(userId);
CREATE INDEX IF NOT EXISTS idx_notification_userId ON Notification(userId);
CREATE INDEX IF NOT EXISTS idx_systemlog_level ON SystemLog(level);
CREATE INDEX IF NOT EXISTS idx_systemlog_source ON SystemLog(source);

-- Insérer le superadmin
INSERT INTO User (id, email, name, password, role, createdAt, updatedAt)
VALUES ('admin-001', 'admin@qrtags.com', 'QRTags SuperAdmin', '$2b$10$5JnNkrnAaKKWV6kw5Ya9X.yCPqhCi4qTEFTQ37fGRUIORU9nSx9Dq', 'superadmin', datetime('now'), datetime('now'));
SQLEOF
  echo "✅ DB créée from scratch avec toutes les colonnes QRTags"
else
  echo "📂 DB existante détectée — vérification des colonnes manquantes..."

  # ─── ALTER TABLE pour ajouter les colonnes manquantes (idempotent) ───
  # SQLite ne supporte pas "IF NOT EXISTS" sur ALTER TABLE ADD COLUMN,
  # donc on vérifie d'abord avec PRAGMA table_info.

  # Helper: vérifier si une colonne existe dans une table
  has_column() {
    TABLE="$1"
    COL="$2"
    sqlite3 "$DB_PATH" "PRAGMA table_info($TABLE);" | cut -d'|' -f2 | grep -qx "$COL"
  }

  # Helper: ajouter une colonne si elle n'existe pas
  add_column_if_missing() {
    TABLE="$1"
    COL="$2"
    DEF="$3"
    if has_column "$TABLE" "$COL"; then
      echo "  ✓ $TABLE.$COL déjà présente"
    else
      echo "  + Ajout $TABLE.$COL"
      sqlite3 "$DB_PATH" "ALTER TABLE $TABLE ADD COLUMN $COL $DEF;"
    fi
  }

  # Vérifier que la table Baggage existe
  if has_column Baggage reference; then
    echo "  Table Baggage OK — vérification colonnes QRTags..."
    add_column_if_missing Baggage activatedAt      "DATETIME"
    add_column_if_missing Baggage customData       "TEXT"
    add_column_if_missing Baggage ownerPin         "TEXT"
    add_column_if_missing Baggage ownerPinSetAt    "DATETIME"
    add_column_if_missing Baggage trackingToken    "TEXT"
    add_column_if_missing Baggage trackingEnabled  "INTEGER NOT NULL DEFAULT 1"
    add_column_if_missing Baggage scanCount        "INTEGER NOT NULL DEFAULT 0"
    add_column_if_missing Baggage lastScanLocation "TEXT"
    add_column_if_missing Baggage isLost           "INTEGER NOT NULL DEFAULT 0"
    add_column_if_missing Baggage lostReportedAt   "DATETIME"
    add_column_if_missing Baggage lostMessage      "TEXT"

    # Créer l'index sur trackingToken s'il n'existe pas
    sqlite3 "$DB_PATH" "CREATE INDEX IF NOT EXISTS idx_baggage_trackingToken ON Baggage(trackingToken);" 2>/dev/null || true
    echo "✅ Baggage à jour"
  else
    echo "❌ Table Baggage manquante — la DB est corrompue. Suppression et recréation..."
    rm -f "$DB_PATH"
    # Relancer ce script pour créer from scratch
    exec sh "$0"
  fi

  # Vérifier le superadmin existe
  HAS_ADMIN=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM User WHERE email='admin@qrtags.com';" 2>/dev/null || echo "0")
  if [ "$HAS_ADMIN" = "0" ]; then
    echo "  + Création du superadmin..."
    sqlite3 "$DB_PATH" "INSERT INTO User (id, email, name, password, role, createdAt, updatedAt) VALUES ('admin-001', 'admin@qrtags.com', 'QRTags SuperAdmin', '\$2b\$10\$5JnNkrnAaKKWV6kw5Ya9X.yCPqhCi4qTEFTQ37fGRUIORU9nSx9Dq', 'superadmin', datetime('now'), datetime('now'));" 2>/dev/null || true
  fi
fi

# ─── Vérification finale ──────────────────────────────────────────
echo "📊 Vérification colonnes Baggage:"
sqlite3 "$DB_PATH" "PRAGMA table_info(Baggage);" | grep -E "trackingToken|trackingEnabled|scanCount|isLost|customData" || echo "  ⚠️ Certaines colonnes QRTags manquent encore"

# ─── Démarrer le serveur ──────────────────────────────────────────
echo "🚀 Démarrage Next.js..."
exec node server.js
