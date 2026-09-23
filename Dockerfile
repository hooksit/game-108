# Multi-stage Dockerfile for Game 108 (Node 22 on Alpine / Debian)
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root and workspace package files
COPY package.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/

# Install dependencies
RUN npm --prefix shared install && \
    npm --prefix server install && \
    npm --prefix client install

# Copy source code and assets
COPY shared/ shared/
COPY server/ server/
COPY client/ client/

# Build shared, client, and server
RUN npm --prefix shared run build && \
    npm --prefix client run build && \
    npm --prefix server run build

# --- Production Runner Stage ---
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy built server and dependencies
COPY --from=builder /app/shared/package.json ./shared/package.json
COPY --from=builder /app/shared/dist ./shared/dist

COPY --from=builder /app/server/package.json ./server/package.json
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/dist ./server/dist

# Copy client built dist files (server serves client/dist)
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 3000

WORKDIR /app/server
CMD ["node", "dist/server.js"]
