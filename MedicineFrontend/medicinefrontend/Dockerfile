# ═══════════════════════════════════════════════════════════════
# Frontend Dockerfile - React + Vite + NGINX
# ✅ Usa nginx para servir archivos estáticos correctamente
# ═══════════════════════════════════════════════════════════════

# ═══════════════════════════════════════════════════════════════
# ETAPA 1: BUILD
# ═══════════════════════════════════════════════════════════════
FROM node:18 AS build
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# ✅ Variables de entorno para el build
ARG VITE_API_URL=http://localhost:5000/api
ARG VITE_BACKEND_URL=http://localhost:5000

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

# Build de producción
RUN npm run build

# ═══════════════════════════════════════════════════════════════
# ETAPA 2: NGINX (Producción)
# ═══════════════════════════════════════════════════════════════
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Eliminar archivos por defecto de nginx
RUN rm -rf ./*

# Copiar build artifacts desde la etapa de build
COPY --from=build /app/dist .

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Puerto
EXPOSE 5173

# Ejecutar nginx
CMD ["nginx", "-g", "daemon off;"]