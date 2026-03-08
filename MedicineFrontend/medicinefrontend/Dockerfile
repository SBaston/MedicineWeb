# ═══════════════════════════════════════════════════════════════
# ETAPA 1: BUILD
# ═══════════════════════════════════════════════════════════════
FROM node:18 AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=http://localhost:5000/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ═══════════════════════════════════════════════════════════════
# ETAPA 2: SERVE
# ═══════════════════════════════════════════════════════════════
FROM node:18-slim
WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# Instalar vite para preview
RUN npm install vite

EXPOSE 5173

CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "5173"]
