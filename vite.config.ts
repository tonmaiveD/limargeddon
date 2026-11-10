/// <reference types="vitest/config" />
import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';

// commit del build, para saber con qué versión se jugó cada pelea del registro
const build = (() => { try { return execSync('git rev-parse --short HEAD').toString().trim(); } catch { return 'dev'; } })();

export default defineConfig({
  // base relativa para que el build funcione en GitHub Pages bajo /limargeddon/ o en cualquier hosting estático
  base: './',
  define: { __BUILD__: JSON.stringify(build) },
  build: { target: 'es2022', chunkSizeWarningLimit: 1600 },
  // npm run balance usa BALANCE=1 para correr solo el reporte de duración
  // las simulaciones tardan menos de 1 s, pero con la máquina cargada (simuladores de iOS) llegan a 25 s: el límite de 5 s
  // las hacía fallar sin que hubiera error. Una prueba colgada igual se corta, al minuto.
  test: { include: process.env.BALANCE ? ['scripts/**/*.test.ts'] : ['tests/**/*.test.ts'], testTimeout: 60_000 },
});
