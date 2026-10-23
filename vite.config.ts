/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  // base relativa para que el build funcione en GitHub Pages bajo /limargeddon/ o en cualquier hosting estático
  base: './',
  build: { target: 'es2022', chunkSizeWarningLimit: 1600 },
  // npm run balance usa BALANCE=1 para correr solo el reporte de duración
  test: { include: process.env.BALANCE ? ['scripts/*.test.ts'] : ['tests/**/*.test.ts'] },
});
