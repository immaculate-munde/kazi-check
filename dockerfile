# syntax=docker/dockerfile:1.7

# ============================================
# Stage 1: Build the application
# ============================================
FROM dhi.io/node:24-alpine3.22-dev AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies first. This layer is cached until the lockfile changes.
COPY package.json package-lock.json* .npmrc* ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

# Generate the Prisma client in its own cached layer.
# It only re-runs when the schema or Prisma config changes.
COPY prisma ./prisma
COPY prisma.config.ts ./
ARG DATABASE_URL="postgresql://build:build@localhost:5432/kazi_check?schema=public"
RUN npx prisma generate

# Copy the source last so code changes do not bust the dependency layers above.
COPY . .

ENV NODE_ENV=production

# Persist an empty cache directory so the runtime stage can copy it in.
RUN mkdir -p /app/.next/cache

# Reuse the Turbopack/Next build cache across builds.
RUN --mount=type=cache,target=/app/.next/cache \
    npx next build

# ============================================
# Stage 2: Minimal production runtime
# ============================================
FROM dhi.io/node:24-alpine3.22 AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0" \
    NEXT_TELEMETRY_DISABLED=1

# The standalone bundle already contains server.js and the traced node_modules.
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

# The hardened runtime image ships without OpenSSL, but Prisma's musl query
# engine needs it. Reuse the libraries from the build image.
COPY --from=builder /usr/lib/libssl.so.3 /usr/lib/libssl.so.3
COPY --from=builder /usr/lib/libcrypto.so.3 /usr/lib/libcrypto.so.3

# The runtime image has no shell, so create the cache dir in the builder and
# copy it in. It must be writable by the runtime user.
COPY --from=builder --chown=node:node /app/.next/cache ./.next/cache

USER node

EXPOSE 3000

CMD ["node", "server.js"]
