FROM node:20-alpine

# Install required packages
RUN apk add --no-cache git libc6-compat sqlite

WORKDIR /app

# Clone the repository (toujours la dernière version depuis GitHub)
RUN git clone https://github.com/topmuch/qrtagsori.git .

# Install dependencies
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Generate Prisma Client
RUN npx prisma generate

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/app/data/qrtags.db
RUN npm run build

# Create data directory
RUN mkdir -p /app/data

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL=file:/app/data/qrtags.db

# Start command : HARD RESET DB + prisma db push + create admin + start server
CMD sh -c " \
  echo '=== QRTags Démarrage ===' && \
  echo 'PWD:' \$(pwd) && \
  echo 'Schema:' && ls -la prisma/schema.prisma && \
  mkdir -p /app/data && \
  rm -f /app/data/qrtags.db /app/data/qrtags.db-journal && \
  echo '📦 Création DB from scratch...' && \
  npx prisma db push --skip-generate --accept-data-loss --schema=prisma/schema.prisma 2>&1 && \
  echo '✅ DB créée' && \
  echo '👤 Création superadmin...' && \
  sqlite3 /app/data/qrtags.db \"INSERT OR IGNORE INTO User (id, email, name, password, role, createdAt, updatedAt) VALUES ('admin-001', 'admin@qrtags.com', 'QRTags SuperAdmin', '\$2b\$10\$5JnNkrnAaKKWV6kw5Ya9X.yCPqhCi4qTEFTQ37fGRUIORU9nSx9Dq', 'superadmin', datetime('now'), datetime('now'));\" && \
  echo '✅ Superadmin créé' && \
  echo '📊 Tables en DB:' && sqlite3 /app/data/qrtags.db '.tables' && \
  echo '📊 Colonnes Baggage:' && sqlite3 /app/data/qrtags.db 'PRAGMA table_info(Baggage);' && \
  exec node .next/standalone/server.js"
