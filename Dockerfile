FROM node:20-alpine

# Install required packages
RUN apk add --no-cache git libc6-compat sqlite

WORKDIR /app

# Clone the repository
RUN git clone https://github.com/topmuch/qrtagsori.git .

# Install dependencies
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Generate Prisma Client
RUN npx prisma generate

# BUILD-TIME : Créer la DB SQLite from scratch avec prisma db push
# La DB est créée dans /tmp pendant le build, puis copiée dans l'image
RUN mkdir -p /app/data && \
    rm -f /app/data/qrtags.db && \
    DATABASE_URL="file:/app/data/qrtags.db" npx prisma db push --force-reset --skip-generate --schema=prisma/schema.prisma && \
    sqlite3 /app/data/qrtags.db "INSERT INTO User (id, email, name, password, role, createdAt, updatedAt) VALUES ('admin-001', 'admin@qrtags.com', 'QRTags SuperAdmin', '\$2b\$10\$5JnNkrnAaKKWV6kw5Ya9X.yCPqhCi4qTEFTQ37fGRUIORU9nSx9Dq', 'superadmin', datetime('now'), datetime('now'));" && \
    echo '✅ DB créée au build avec superadmin' && \
    sqlite3 /app/data/qrtags.db '.tables' && \
    sqlite3 /app/data/qrtags.db 'PRAGMA table_info(Baggage);' | grep transitMode && \
    echo '✅ Colonne transitMode présente'

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/app/data/qrtags.db
RUN npm run build

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL=file:/app/data/qrtags.db

# Runtime : juste démarrer le serveur (la DB est déjà créée dans l'image)
# Note : si Coolify monte un volume sur /app/data, la DB sera écrasée.
# Dans ce cas, on recrée la DB au démarrage.
CMD sh -c " \
  if [ ! -f /app/data/qrtags.db ]; then \
    echo '📦 DB manquante — création...' && \
    npx prisma db push --force-reset --skip-generate --schema=prisma/schema.prisma && \
    sqlite3 /app/data/qrtags.db \"INSERT INTO User (id, email, name, password, role, createdAt, updatedAt) VALUES ('admin-001', 'admin@qrtags.com', 'QRTags SuperAdmin', '\$2b\$10\$5JnNkrnAaKKWV6kw5Ya9X.yCPqhCi4qTEFTQ37fGRUIORU9nSx9Dq', 'superadmin', datetime('now'), datetime('now'));\" && \
    echo '✅ DB créée'; \
  else \
    echo '📦 DB existante — vérification schéma...' && \
    npx prisma db push --skip-generate --accept-data-loss --schema=prisma/schema.prisma 2>&1 || true; \
  fi && \
  echo '🚀 Démarrage serveur...' && \
  exec node .next/standalone/server.js"
