import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      // Proxy OAuth start → backend
      '/oauth2': {
        target: 'http://localhost:8080',
        changeOrigin: false,
      },
      // Proxy Google callback → backend, intercept JSON → redirect FE
      '/login/oauth2': {
        target: 'http://localhost:8080',
        changeOrigin: false,
        selfHandleResponse: true,
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            let body = '';
            proxyRes.on('data', (chunk) => { body += chunk; });
            proxyRes.on('end', () => {
              try {
                const data = JSON.parse(body);
                const params = new URLSearchParams({
                  token: data.token || '',
                  email: data.email || '',
                  role: data.role || '',
                });
                res.writeHead(302, { Location: `/auth/callback?${params}` });
                res.end();
              } catch {
                res.writeHead(proxyRes.statusCode, proxyRes.headers);
                res.end(body);
              }
            });
          });
        },
      },
      // Proxy API → backend
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
