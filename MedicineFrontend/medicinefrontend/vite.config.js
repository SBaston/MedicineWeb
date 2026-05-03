import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';

// Lee la versión de package.json en tiempo de build
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const APP_VERSION = pkg.version;

export default defineConfig({
    plugins: [react()],

    // Expone __APP_VERSION__ como constante global en el código
    define: {
        __APP_VERSION__: JSON.stringify(APP_VERSION),
    },

    server: {
        port: 5173,
        host: '0.0.0.0',
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false,
            },
            '/uploads': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false,
            }
        }
    },

    preview: {
        port: 5173,
        host: '0.0.0.0'
    },

    build: {
        // Nombra los chunks con la versión + hash de contenido → fuerza cache busting al desplegar
        rollupOptions: {
            output: {
                // Archivo de entrada principal: index@v1.0.0.AbCd.js
                entryFileNames: `assets/index@v${APP_VERSION}.[hash].js`,
                // Chunks lazy-loaded
                chunkFileNames: `assets/[name]@v${APP_VERSION}.[hash].js`,
                // CSS e imágenes
                assetFileNames: `assets/[name]@v${APP_VERSION}.[hash][extname]`,
            }
        },
        // Avisa si un chunk supera 600 KB
        chunkSizeWarningLimit: 600,
    },
})
