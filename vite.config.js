import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // === ПРОФЕССИОНАЛЬНАЯ НАСТРОЙКА ===
  root: resolve(__dirname, 'src'),  // Абсолютный путь к src/
  
  // publicDir относительно root
  publicDir: resolve(__dirname, 'public'),  // Абсолютный путь к public/
  
  build: {
    // outDir относительно project root (не src!)
    outDir: resolve(__dirname, 'www'),  // Абсолютный путь к www/
    emptyOutDir: true,
    
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html')  // Абсолютный путь к entry point
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  
  server: { 
    port: 3000, 
    host: true,
    fs: { allow: [resolve(__dirname, '..')] }
  },
  
  optimizeDeps: { exclude: ['@capacitor/core'] }
});
