import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../www',
    emptyOutDir: true,
    rollupOptions: {
      input: { main: './index.html' },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  server: { port: 3000, host: true, fs: { allow: ['..'] } },
  optimizeDeps: { exclude: ['@capacitor/core'] }
});
