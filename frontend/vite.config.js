import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'https://branddna-1-wndy.onrender.com',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
