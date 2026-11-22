import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_PROXY_TARGET || 'https://glamgo-backend-lqn6.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
