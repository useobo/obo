# Multi-stage build for OBO API
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Dependencies stage
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/crypto/package.json ./packages/crypto/
COPY packages/db/package.json ./packages/db/
COPY packages/policy/package.json ./packages/policy/
COPY packages/providers/package.json ./packages/providers/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build

# Production stage
FROM base AS production
WORKDIR /app

ENV NODE_ENV production

# Copy built packages
COPY --from=build /app/packages/core/dist ./packages/core/dist
COPY --from=build /app/packages/crypto/dist ./packages/crypto/dist
COPY --from=build /app/packages/db/dist ./packages/db/dist
COPY --from=build /app/packages/policy/dist ./packages/policy/dist
COPY --from=build /app/packages/providers/dist ./packages/providers/dist
COPY --from=build /app/apps/api/dist ./apps/api/dist

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY packages/core/package.json ./packages/core/
COPY packages/crypto/package.json ./packages/crypto/
COPY packages/db/package.json ./packages/db/
COPY packages/policy/package.json ./packages/policy/
COPY packages/providers/package.json ./packages/providers/
COPY apps/api/package.json ./apps/api/
COPY package.json pnpm-workspace.yaml ./

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "apps/api/dist/index.js"]
