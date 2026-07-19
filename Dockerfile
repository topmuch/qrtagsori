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

# Start command : hard reset DB + create admin + start server
CMD sh -c "mkdir -p /app/data && \
  rm -f /app/data/qrtags.db && \
  npx prisma db push --skip-generate 2>&1 && \
  sqlite3 /app/data/qrtags.db \"INSERT OR IGNORE INTO User (id, email, name, password, role, createdAt, updatedAt) VALUES ('admin-001', 'admin@qrtags.com', 'QRTags SuperAdmin', '\$2b\$10\$5JnNkrnAaKKWV6kw5Ya9X.yCPqhCi4qTEFTQ37fGRUIORU9nSx9Dq', 'superadmin', datetime('now'), datetime('now'));\" && \
  echo '✅ Superadmin créé' && \
  exec node .next/standalone/server.js"
