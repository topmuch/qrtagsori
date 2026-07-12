# QRLabs - Dockerfile for Coolify Deployment (standalone test environment)
FROM node:20-alpine

# Install required packages
RUN apk add --no-cache git libc6-compat sqlite
RUN npm install -g bun

WORKDIR /app

# Clone the repository
RUN git clone https://github.com/topmuch/qrbags-labs.git .

# Install dependencies
RUN bun install

# Generate Prisma Client
RUN npx prisma generate

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/app/data/qrlabs.db
RUN bun run build

# Create data + upload directories
RUN mkdir -p /app/data /app/public/uploads/damage

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL=file:/app/data/qrlabs.db
ENV NODE_ENV=production

# Start command — uses next start (full node_modules, no standalone issues)
CMD sh -c "mkdir -p /app/data /app/public/uploads/damage && export DATABASE_URL=file:/app/data/qrlabs.db && npx prisma db push --skip-generate 2>/dev/null || true && node scripts/create-admin.cjs 2>/dev/null || true && exec npx next start -p 3000"
