import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(__dirname, 'src'),
  
  // publicDir копируется как есть в www/
  publicDir: resolve(__dirname, 'public'),
  
  build: {
    outDir: resolve(__dirname, 'www'),
    emptyOutDir: true,
    rollupOptions: {
      input: { main: resolve(__dirname, 'src/index.html') },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  
  server: { port: 3000, host: true, fs: { allow: [resolve(__dirname, '..')] } },
  optimizeDeps: { exclude: ['@capacitor/core'] }
});
