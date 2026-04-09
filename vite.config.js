import { defineConfig } from 'vite';
export default defineConfig({
  root: 'src',                    // Все исходники в src/
  build: {
    outDir: '../www',             // Сборка в www/ (на уровень выше)
    emptyOutDir: true,            // Очищать www перед сборкой
    rollupOptions: {
      input: {
        main: 'src/index.html'    // Точка входа
      }
    }
  },
  server: { port: 3000, host: true }
});
