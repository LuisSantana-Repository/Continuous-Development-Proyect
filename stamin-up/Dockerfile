# ---- deps ----
FROM node:18-alpine AS deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json* ./
RUN npm ci --production --ignore-scripts

# ---- builder ----
FROM node:18-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runner ----
FROM node:18-alpine AS runner
WORKDIR /app
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
ENV NODE_ENV=production
ENV PORT=3000
COPY --chown=nextjs:nodejs --from=builder /app/.next/standalone ./
COPY --chown=nextjs:nodejs --from=builder /app/.next/static ./.next/static
COPY --chown=nextjs:nodejs --from=builder /app/public ./public
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s CMD wget -qO- --tries=1 --timeout=2 http://localhost:3000/ || exit 1
CMD ["node", "server.js"]
