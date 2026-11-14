
# ===== Base común: Node 22 (Alpine, liviano) + pnpm =====
FROM node:22-alpine AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    NEXT_TELEMETRY_DISABLED=1

# corepack trae pnpm (la versión que dice "packageManager" en cada package.json)
RUN corepack enable

# ===== Etapa 1: backend (solo dependencias de producción) =====
FROM base AS backend
WORKDIR /build/backend
# Primero solo las dependencias: Docker guarda esta capa en caché
COPY backend/package.json backend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod
# Luego el código
COPY backend/src ./src
COPY backend/scripts ./scripts

# ===== Etapa 2: portal del propietario (vive en /) =====
FROM base AS propietario
WORKDIR /build/propietario
COPY frontend-propietario/package.json frontend-propietario/pnpm-lock.yaml frontend-propietario/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY frontend-propietario/ ./
# Sin esto saldrían los datos de mentira (lib/mock.js)
ENV NEXT_PUBLIC_USAR_MOCK=false
RUN pnpm build

# ===== Etapa 3: portal de la clínica (vive en /clinica) =====
FROM base AS clinica
WORKDIR /build/clinica
COPY frontend-clinica/package.json frontend-clinica/pnpm-lock.yaml frontend-clinica/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY frontend-clinica/ ./
ENV NEXT_PUBLIC_USAR_MOCK=false \
    NEXT_PUBLIC_BASE_PATH=/clinica \
    NEXT_PUBLIC_URL_PROPIETARIO=/
RUN pnpm build

# ===== Etapa 4: imagen final (lo único que se sube a GHCR) =====
FROM node:22-alpine

# nginx: la puerta de entrada que reparte las peticiones
RUN apk add --no-cache nginx
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8080

# Backend
COPY --from=backend /build/backend ./backend

# Portal del propietario (carpeta mínima + archivos estáticos + imágenes)
COPY --from=propietario /build/propietario/.next/standalone ./propietario
COPY --from=propietario /build/propietario/.next/static ./propietario/.next/static
COPY --from=propietario /build/propietario/public ./propietario/public

# Portal de la clínica
COPY --from=clinica /build/clinica/.next/standalone ./clinica
COPY --from=clinica /build/clinica/.next/static ./clinica/.next/static
COPY --from=clinica /build/clinica/public ./clinica/public

# Arranque y configuración de nginx
COPY docker/iniciar.mjs docker/nginx.conf.template ./

# Carpeta de fotos y exámenes (en Railway se monta un Volume aquí)
RUN mkdir -p backend/uploads

EXPOSE 8080
CMD ["node", "iniciar.mjs"]