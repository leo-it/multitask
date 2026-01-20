FROM node:20-alpine AS base

# Install pnpm and OpenSSL for Prisma
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache openssl1.1-compat libc6-compat

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client (OpenSSL already installed in base)
RUN pnpm db:generate

# Build the application
RUN pnpm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files - create script to handle pnpm structure
RUN mkdir -p ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy .prisma generated client using a shell command that handles missing directory
RUN --mount=from=builder,source=/app/node_modules,target=/tmp/node_modules \
    if [ -d /tmp/node_modules/.prisma ]; then \
        cp -r /tmp/node_modules/.prisma ./node_modules/.prisma && \
        chown -R nextjs:nodejs ./node_modules/.prisma; \
    else \
        echo "Warning: .prisma directory not found, Prisma Client may not work correctly"; \
    fi

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
