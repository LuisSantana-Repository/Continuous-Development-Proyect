# Multi-stage Dockerfile for Next.js Web - Production Optimized
# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app

# Install dependencies needed for node-gyp
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY . .

# Set environment variable for Next.js
ENV NEXT_TELEMETRY_DISABLED 1

# Build Next.js application
RUN npm run build

# Stage 3: Runner (Final lightweight image)
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copy Next.js build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3001

ENV PORT 3001
ENV HOSTNAME "0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start Next.js
CMD ["node", "server.js"]