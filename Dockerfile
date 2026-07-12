# QRLabs - Dockerfile for Coolify Deployment (standalone test environment)
FROM node:20-alpine

# Install required packages + cron
RUN apk add --no-cache git libc6-compat sqlite curl dcron
RUN npm install -g bun

WORKDIR /app

# Clone the repository
RUN git clone https://github.com/topmuch/qrbags-labs.git .

# Install dependencies
RUN bun install

# Generate Prisma Client
RUN npx prisma generate

# Build the application (standalone mode — required by next.config.ts)
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/app/data/qrlabs.db
RUN bun run build

# ─── Copy ALL missing packages into standalone build ───
# Next.js standalone only includes ~52 packages out of 653.
# We copy the entire node_modules to be 100% safe.
RUN cp -r node_modules/.next/standalone/node_modules/ .next/standalone/node_modules/ 2>/dev/null || true
RUN rm -rf .next/standalone/node_modules
RUN cp -r node_modules .next/standalone/node_modules

# Also copy Prisma schema + migrations for runtime db push
RUN cp -r prisma .next/standalone/prisma 2>/dev/null || true
RUN cp package.json .next/standalone/package.json 2>/dev/null || true

# Create data + upload directories
RUN mkdir -p /app/data /app/data/backups /app/.next/standalone/public/uploads/damage

# ─── Setup cron for automatic DB backup (every hour) ───
RUN echo '0 * * * * curl -s -H "Authorization: Bearer qrlabs-backup-2026" http://localhost:3000/api/cron/backup-db > /dev/null 2>&1' > /etc/crontabs/root
RUN chmod 0644 /etc/crontabs/root

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL=file:/app/data/qrlags.db
ENV NODE_ENV=production

# Start command — standalone server + cron (both run in background, server in foreground)
WORKDIR /app/.next/standalone
CMD sh -c "mkdir -p /app/data /app/data/backups /app/.next/standalone/public/uploads/damage && export DATABASE_URL=file:/app/data/qrlags.db && npx prisma db push --skip-generate 2>/dev/null || true && node /app/scripts/create-admin.cjs 2>/dev/null || true && crond && exec node server.js"
