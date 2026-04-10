import { defineConfig } from 'vite';
export default defineConfig({
  root: 'src',
  build: {
    outDir: '../www',
    emptyOutDir: true
    // Убрали rollupOptions.input — Vite сам найдёт index.html
  }
});
