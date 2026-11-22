import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

/*
 * Build aparte de la demo del piloto de arte de la Costa Verde (ADR 0067). Corre después del build del juego y escribe
 * en el mismo dist sin borrarlo: el juego conserva su paquete de siempre y la demo lleva el suyo, en
 * dist/piloto-costa-verde/. Las imágenes del arte ya las copia el build del juego desde public/.
 */
const build = (() => { try { return execSync('git rev-parse --short HEAD').toString().trim(); } catch { return 'dev'; } })();

export default defineConfig({
  base: './',
  define: { __BUILD__: JSON.stringify(build) },
  publicDir: false,
  build: {
    target: 'es2022', chunkSizeWarningLimit: 1600, outDir: 'dist', emptyOutDir: false,
    rollupOptions: { input: resolve(__dirname, 'piloto-costa-verde/index.html'), output: { entryFileNames: 'assets/piloto-[hash].js', assetFileNames: 'assets/piloto-[hash][extname]' } },
  },
});
