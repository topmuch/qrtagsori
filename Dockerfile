FROM node:20-alpine

# Install required packages
RUN apk add --no-cache git libc6-compat sqlite

WORKDIR /app

# Clone the repository (dernière version GitHub)
RUN git clone https://github.com/topmuch/qrtagsori.git .

# Install dependencies
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Generate Prisma Client
RUN npx prisma generate

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/tmp/build.db
RUN npm run build

# Create data directory
RUN mkdir -p /app/data

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL=file:/app/data/qrtags.db

# Start command : HARD RESET DB + create admin + start server
# On utilise sqlite3 directement pour garantir la structure de la DB
CMD sh -c " \
  mkdir -p /app/data && \
  rm -f /app/data/qrtags.db /app/data/qrtags.db-journal && \
  echo '📦 Création DB from scratch via sqlite3...' && \
  sqlite3 /app/data/qrtags.db \" \
    CREATE TABLE IF NOT EXISTS User (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT, password TEXT, role TEXT NOT NULL DEFAULT 'agency', agencyId TEXT, createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP); \
    CREATE TABLE IF NOT EXISTS Agency (id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, email TEXT, phone TEXT, address TEXT, agencyType TEXT NOT NULL DEFAULT 'generic', active BOOLEAN NOT NULL DEFAULT 1, createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP); \
    CREATE TABLE IF NOT EXISTS Baggage (id TEXT PRIMARY KEY, reference TEXT NOT NULL UNIQUE, type TEXT NOT NULL DEFAULT 'voyageur', setId TEXT, agencyId TEXT, travelerFirstName TEXT, travelerLastName TEXT, whatsappOwner TEXT, baggageIndex INTEGER DEFAULT 1, baggageType TEXT DEFAULT 'cabine', status TEXT NOT NULL DEFAULT 'in_stock', createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, expiresAt DATETIME, lastScanDate DATETIME, lastLocation TEXT, declaredLostAt DATETIME, foundAt DATETIME, founderName TEXT, founderPhone TEXT, founderAt DATETIME, activatedAt DATETIME, customData TEXT, ownerPin TEXT, ownerPinSetAt DATETIME); \
    CREATE TABLE IF NOT EXISTS ScanLog (id TEXT PRIMARY KEY, baggageId TEXT NOT NULL, ipAddress TEXT, country TEXT, city TEXT, latitude REAL, longitude REAL, location TEXT, message TEXT, createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP); \
    CREATE TABLE IF NOT EXISTS Session (id TEXT PRIMARY KEY, userId TEXT NOT NULL, userAgent TEXT, ipAddress TEXT, lastActivity DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, expiresAt DATETIME NOT NULL, createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP); \
    CREATE TABLE IF NOT EXISTS Notification (id TEXT PRIMARY KEY, type TEXT NOT NULL, userId TEXT, agencyId TEXT, baggageId TEXT, message TEXT NOT NULL, data TEXT, read BOOLEAN NOT NULL DEFAULT 0, createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP); \
    CREATE TABLE IF NOT EXISTS LoginLog (id TEXT PRIMARY KEY, userId TEXT, email TEXT NOT NULL, success BOOLEAN NOT NULL DEFAULT 0, failureReason TEXT, ipAddress TEXT, userAgent TEXT, country TEXT, city TEXT, createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP); \
    CREATE TABLE IF NOT EXISTS DamageReport (id TEXT PRIMARY KEY, baggageId TEXT NOT NULL, type TEXT NOT NULL, photos TEXT NOT NULL, description TEXT, createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP); \
    CREATE TABLE IF NOT EXISTS Setting (id TEXT PRIMARY KEY, key TEXT NOT NULL UNIQUE, value TEXT NOT NULL, updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP); \
    CREATE TABLE IF NOT EXISTS FeatureFlag (id TEXT PRIMARY KEY, key TEXT NOT NULL UNIQUE, label TEXT NOT NULL, description TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'general', enabled BOOLEAN NOT NULL DEFAULT 0, icon TEXT, createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP); \
  \" && \
  echo '✅ DB créée avec toutes les colonnes QRTags' && \
  echo '👤 Création superadmin...' && \
  sqlite3 /app/data/qrtags.db \"INSERT OR IGNORE INTO User (id, email, name, password, role, createdAt, updatedAt) VALUES ('admin-001', 'admin@qrtags.com', 'QRTags SuperAdmin', '\$2b\$10\$5JnNkrnAaKKWV6kw5Ya9X.yCPqhCi4qTEFTQ37fGRUIORU9nSx9Dq', 'superadmin', datetime('now'), datetime('now'));\" && \
  echo '✅ Superadmin créé' && \
  echo '📊 Vérification colonnes Baggage:' && \
  sqlite3 /app/data/qrtags.db 'PRAGMA table_info(Baggage);' && \
  exec node .next/standalone/server.js"
