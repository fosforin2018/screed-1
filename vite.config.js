import { defineConfig } from 'vite';
export default defineConfig({
  root: 'src',
  publicDir: '../public',  // Копирует public/ в www/
  build: {
    outDir: '../www',
    emptyOutDir: true,
    rollupOptions: {
      input: { main: 'index.html' }
    }
  },
  server: { port: 3000, host: true }
});
