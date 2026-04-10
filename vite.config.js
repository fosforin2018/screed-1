import { defineConfig } from 'vite';
export default defineConfig({
  root: 'src',                    // Исходники в src/
  publicDir: '../public',         // Статика из public/ копируется в www/
  build: {
    outDir: '../www',             // Сборка в www/ (на уровень выше)
    emptyOutDir: true,            // Очищать www перед сборкой
    rollupOptions: {
      input: {
        main: './index.html'      // Путь ОТНОСИТЕЛЬНО root: 'src' → src/index.html
      }
    }
  },
  server: { port: 3000, host: true }
});
