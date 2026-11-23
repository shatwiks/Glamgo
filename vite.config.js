import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/preview-api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/preview-api/, '/api/v1')
      },
      '/api': {
        target: process.env.VITE_DEV_PROXY_TARGET || 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
