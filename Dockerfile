FROM node:20-alpine

RUN apk add --no-cache git libc6-compat sqlite

WORKDIR /app

RUN git clone https://github.com/topmuch/qrtagsori.git .
RUN npm install --legacy-peer-deps --no-audit --no-fund
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/tmp/build.db
RUN npm run build

# QRTags : Copier TOUT dans le standalone
# Le standalone par défaut n'inclut que ~52 packages sur 653
# Il manque prisma, bcryptjs, qrcode, etc. → crash runtime
RUN cp -r .next/static .next/standalone/.next/ && \
    cp -r public .next/standalone/public && \
    cp -r node_modules .next/standalone/node_modules && \
    cp prisma/schema.prisma .next/standalone/prisma/schema.prisma && \
    cp package.json .next/standalone/package.json

RUN mkdir -p /app/data
RUN chmod +x init-db.sh

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL=file:/app/data/qrtags.db

WORKDIR /app/.next/standalone
CMD ["sh", "/app/init-db.sh"]
