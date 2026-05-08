# --- Build Stage ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npx prisma generate
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine
WORKDIR /app

# Non-root user
RUN addgroup -S fusionai && adduser -S fusionai -G fusionai

COPY --from=builder --chown=fusionai:fusionai /app/dist ./dist
COPY --from=builder --chown=fusionai:fusionai /app/node_modules ./node_modules
COPY --from=builder --chown=fusionai:fusionai /app/package.json ./
COPY --from=builder --chown=fusionai:fusionai /app/prisma ./prisma

USER fusionai

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/ready || exit 1

# Migrate (idempotent) then start. Skip seed in production.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
