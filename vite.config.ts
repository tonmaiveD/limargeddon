import { defineConfig } from 'vite';

// base relativa para que el build funcione en GitHub Pages bajo /limargeddon/ o en cualquier hosting estático
export default defineConfig({
  base: './',
  build: { target: 'es2022', chunkSizeWarningLimit: 1600 },
});
