import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        basicSsl()  // ← Plugin para HTTPS
    ],
    server: {
        https: true,  // ← Habilitar HTTPS
        port: 5173,   // ← Puerto estándar (o usa 50239 si prefieres)
        host: true,   // ← Exponer a la red
        proxy: {
            '/api': {
                target: 'https://localhost:5001',  // ← Backend HTTPS
                changeOrigin: true,
                secure: false  // ← Permitir certificados auto-firmados
            }
        }
    }
})