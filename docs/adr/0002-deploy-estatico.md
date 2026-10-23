# 0002. Deploy estático con GitHub Actions a Pages

**Estado:** aceptada, Hito 1.

## Contexto
El build de Vite es estático. CLAUDE.md propone GitHub Pages desde `main`; Pages en repo privado requiere un plan de pago. El dueño del producto indicó que el repo puede ser público para usar Pages.

## Decisión
- Workflow `.github/workflows/deploy.yml`: en cada push a `main` corre `npm ci`, tests, build y publica `dist/` con `actions/deploy-pages`.
- `base: './'` en Vite para que el build funcione bajo `/limargeddon/` o en cualquier otro hosting sin reconfigurar.
- En el repo hay que activar una vez *Settings → Pages → Source: GitHub Actions*.

## Consecuencias
- Si el repo queda privado sin plan que lo permita, el job `deploy` falla pero el `build` sigue sirviendo como verificación; mover a Netlify o Vercel solo requiere apuntarlos a `dist/`.
