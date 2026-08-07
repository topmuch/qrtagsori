# ═══════════════════════════════════════════════════════════════
# QRTags — Production Dockerfile (bun + Next.js standalone)
# ═══════════════════════════════════════════════════════════════════════════

FROM oven/bun:1-debian

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    sqlite3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Clone the repo
RUN git clone https://github.com/topmuch/qrtagsori.git .

# Install dependencies
RUN bun install --frozen-lockfile || bun install

# Generate Prisma Client
RUN bunx prisma generate

# Build Next.js (standalone output)
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:/tmp/build.db"
RUN bun run build

# Copy everything needed for runtime into standalone
RUN cp -r .next/static .next/standalone/.next/ && \
    cp -r public .next/standalone/public && \
    cp -r node_modules .next/standalone/node_modules && \
    cp -r prisma .next/standalone/prisma && \
    cp -r scripts .next/standalone/scripts && \
    cp package.json .next/standalone/package.json

# Create data directories
RUN mkdir -p /app/data /app/data/backups /app/public/uploads/damage && \
    chmod -R 777 /app/data /app/public/uploads/damage
RUN chmod +x init-db.sh

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/qrtags.db"

WORKDIR /app/.next/standalone
CMD ["sh", "/app/init-db.sh"]
