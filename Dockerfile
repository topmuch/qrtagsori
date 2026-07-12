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

# Copy missing packages not included in standalone build
# (serverExternalPackages + native/pure-JS packages used at runtime)
RUN cp -r node_modules/bcryptjs .next/standalone/node_modules/ 2>/dev/null || true
RUN cp -r node_modules/.prisma .next/standalone/node_modules/ 2>/dev/null || true
RUN mkdir -p .next/standalone/public/uploads/damage

# Create data directory
RUN mkdir -p /app/data

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL=file:/app/data/qrlabs.db

# Start command - create admin and start server
CMD sh -c "mkdir -p /app/data && export DATABASE_URL=file:/app/data/qrlabs.db && npx prisma db push --skip-generate 2>/dev/null || true && node scripts/create-admin.cjs 2>/dev/null || true && exec node .next/standalone/server.js"
