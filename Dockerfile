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

# Build the application (npm, pas bun)
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/tmp/build.db
RUN npm run build

# Create data directory
RUN mkdir -p /app/data

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL=file:/app/data/qrtags.db

# Start command : create DB + admin + start server
CMD sh -c " \
  mkdir -p /app/data && \
  echo '📦 Création DB...' && \
  npx prisma db push --force-reset --skip-generate --schema=prisma/schema.prisma && \
  echo '👤 Création superadmin...' && \
  sqlite3 /app/data/qrtags.db \"INSERT OR IGNORE INTO User (id, email, name, password, role, createdAt, updatedAt) VALUES ('admin-001', 'admin@qrtags.com', 'QRTags SuperAdmin', '\$2b\$10\$5JnNkrnAaKKWV6kw5Ya9X.yCPqhCi4qTEFTQ37fGRUIORU9nSx9Dq', 'superadmin', datetime('now'), datetime('now'));\" && \
  echo '✅ Prêt' && \
  exec node .next/standalone/server.js"
