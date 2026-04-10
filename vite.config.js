import { defineConfig } from 'vite';
export default defineConfig({
  root: 'src',                    // Исходники в src/
  build: {
    outDir: '../www',             // Сборка в www/ (на уровень выше)
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './index.html'      // ✅ Путь ОТНОСИТЕЛЬНО root: 'src' → src/index.html
      }
    }
  },
  server: { port: 3000, host: true }
});
