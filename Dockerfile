FROM node:20-alpine

RUN apk add --no-cache git libc6-compat sqlite

WORKDIR /app

RUN git clone https://github.com/topmuch/qrtagsori.git .
RUN npm install --legacy-peer-deps --no-audit --no-fund
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/tmp/build.db
RUN npm run build

# QRTags : Copier les assets statiques dans le standalone
# Sans ça, les pages crashent (client-side exception)
RUN cp -r .next/static .next/standalone/.next/ && \
    cp -r public .next/standalone/public

RUN mkdir -p /app/data
RUN chmod +x init-db.sh

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL=file:/app/data/qrtags.db

WORKDIR /app/.next/standalone
CMD ["sh", "/app/init-db.sh"]
