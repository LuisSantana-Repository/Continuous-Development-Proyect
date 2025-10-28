# --- STAGE 1: build (con dev deps para compilar) ---
FROM node:18-bookworm-slim AS builder
WORKDIR /app
ENV DEBIAN_FRONTEND=noninteractive

# (opcional) instalar herramientas del sistema necesarias para build
RUN apt-get update && apt-get upgrade -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# copiar lock + package para cache
COPY package.json package-lock.json* ./

# instalar todas las deps (dev + prod) para poder construir
RUN npm ci

# copiar código y construir Next (.next)
COPY . .
RUN npm run build

# --- STAGE 2: runtime (limpia, sólo prod deps) ---
FROM node:18-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV DEBIAN_FRONTEND=noninteractive

# utilidades mínimas (curl para healthcheck/debug)
RUN apt-get update && apt-get upgrade -y --no-install-recommends \
    && apt-get install -y --no-install-recommends curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# copiar artefactos del build
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# copiar package.json + lockfile (necesario para npm ci en runtime)
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

# instalar sólo deps de producción (usa --omit=dev para npm moderno)
RUN npm ci --omit=dev

# seguridad: cambiar ownership y usar usuario no-root
RUN chown -R node:node /app
USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/ || exit 1

# start (debe existir "start": "next start -p 3000" o equivalente en package.json)
CMD ["npm", "start"]
