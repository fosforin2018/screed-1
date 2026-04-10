import { defineConfig } from 'vite';
export default defineConfig({
  // root по умолчанию = корень проекта (где лежит index.html)
  publicDir: 'public',  // Статика копируется из public/ в www/
  build: {
    outDir: 'www',      // Сборка в www/ в корне проекта
    emptyOutDir: true,  // Очищать www перед сборкой
    rollupOptions: {
      input: {
        main: 'index.html'  // Точка входа: ./index.html
      }
    }
  },
  server: { port: 3000, host: true }
});
