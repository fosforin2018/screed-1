import { defineConfig } from 'vite';
export default defineConfig({
  root: 'src',
  build: {
    outDir: '../www',
    emptyOutDir: true,
    rollupOptions: {
      input: { main: 'src/index.html' }
    }
  },
  server: { port: 3000 }
});
