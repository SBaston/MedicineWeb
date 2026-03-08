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
# ARG para la URL de la API (HTTPS)
# ═══════════════════════════════════════════════════════════════
ARG VITE_API_URL=https://localhost:5001/api
ENV VITE_API_URL=$VITE_API_URL

# Compilar la aplicación
RUN npm run build

# ═══════════════════════════════════════════════════════════════
# ETAPA 2: SERVE
# ═══════════════════════════════════════════════════════════════
FROM node:18-slim
WORKDIR /app

# Copiar archivos construidos
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# Instalar vite y plugin para HTTPS
RUN npm install --only=production vite @vitejs/plugin-basic-ssl

# Crear vite.config.js para HTTPS
RUN echo "import { defineConfig } from 'vite';\nimport basicSsl from '@vitejs/plugin-basic-ssl';\nexport default defineConfig({\n  plugins: [basicSsl()],\n  preview: {\n    host: '0.0.0.0',\n    port: 5173,\n    https: true\n  }\n});" > vite.config.js

# Exponer puerto
EXPOSE 5173

# Ejecutar con vite preview en HTTPS
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "5173"]