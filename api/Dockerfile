# Multi-stage Dockerfile for API - Production Optimized
# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app

# Install system dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Stage 2: Builder (if you need to build/transpile)
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# If you have a build step, run it here
# RUN npm run build

# Stage 3: Runner (Final lightweight image)
FROM node:18-alpine AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy only production dependencies from deps stage
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start application
CMD ["npm", "start"]