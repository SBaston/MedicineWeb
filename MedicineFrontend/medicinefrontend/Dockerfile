# ═══════════════════════════════════════════════════════════════
# ETAPA 1: BUILD
# ═══════════════════════════════════════════════════════════════
FROM node:18 AS build
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto del código
COPY . .

# ═══════════════════════════════════════════════════════════════
# IMPORTANTE: ARG para la URL de la API
# Se puede pasar desde docker-compose con build.args
# ═══════════════════════════════════════════════════════════════
ARG VITE_API_URL=http://localhost:5000/api
ENV VITE_API_URL=$VITE_API_URL

# Compilar la aplicación
RUN npm run build

# ═══════════════════════════════════════════════════════════════
# ETAPA 2: SERVE
# ═══════════════════════════════════════════════════════════════
FROM node:18-slim
WORKDIR /app

# Copiar solo los archivos construidos
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# Instalar solo vite para el preview
RUN npm install --only=production vite

# Exponer puerto
EXPOSE 5173

# Ejecutar con vite preview (modo producción)
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "5173"]
