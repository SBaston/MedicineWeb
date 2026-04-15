FROM node:20 AS build
WORKDIR /app

ARG VITE_API_URL
ARG VITE_BACKEND_URL

ENV VITE_API_URL=$VITE_API_URL \
    VITE_BACKEND_URL=$VITE_BACKEND_URL

# NODE_ENV debe ser development durante npm install para que se incluyan
# devDependencies (vite, @vitejs/plugin-react, etc.). Sin esto npm las omite
# y el comando `vite build` no se encuentra.
COPY package.json ./
RUN NODE_ENV=development npm install

COPY . .

RUN npm run build

FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Instalar wget para healthcheck
RUN apk add --no-cache wget

EXPOSE 5173
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5173 || exit 1
CMD ["nginx", "-g", "daemon off;"]