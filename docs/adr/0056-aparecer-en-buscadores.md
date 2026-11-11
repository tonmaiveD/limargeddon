# 0056. Aparecer en Google y en los enlaces compartidos

**Estado:** aceptada (plan aprobado por el dueño, 10 de noviembre de 2026).

## Contexto
La página solo tenía el título "Limargeddon". El juego se dibuja en un canvas, que Google no puede leer, así que no había texto para entender de qué trata. Tampoco había descripción, imagen para compartir ni mapa del sitio.

## Decisiones del dueño
- Seguir en `https://tonmaived.github.io/limargeddon/`, sin dominio propio por ahora. Si llega uno, GitHub Pages redirige la dirección vieja.
- Una página de texto real, `acerca.html`, en lugar de esconder texto en la página del juego, que Google trata como trampa.

## Decisión
- **`index.html`:**
  - Título "Limargeddon · Arcade de taxi y combate por Lima".
  - Descripción de 155 letras.
  - Dirección canónica.
  - Etiquetas para compartir (Open Graph y tarjeta grande).
  - Datos estructurados `VideoGame`: gratis, en español, para navegador, de un jugador. Sin reseñas ni puntajes inventados.
- **`public/acerca.html`:** de qué trata, cómo se juega, los nueve distritos con su jefe y la etapa secreta sin nombrarla, y dónde se juega. Tiene dos botones "Jugar ahora". El menú la enlaza junto a "Privacidad", y la página de privacidad también.
- **`public/compartir.png`** (1200 × 630): capturas reales de la pelea contra el Rochabús y la Combi Asesina, con el título del juego. Se armó con Chrome sin ventana sobre el servidor de desarrollo, con capturas a doble resolución, y se compuso en HTML con la tipografía del juego.
- **`public/sitemap.xml`:** la página del juego, la de "Acerca del juego" y la de privacidad.
- **`robots.txt` no hace falta.** Sin él, Google lee todo. Además, en una dirección de proyecto de GitHub Pages no se puede poner en la raíz del dominio.
- **Sin Google Analytics.** Search Console no agrega nada al juego ni sigue a los jugadores, y la página de privacidad sigue siendo cierta.

## Pasos del dueño
1. Search Console, propiedad "Prefijo de URL" con la dirección del juego, y verificación por etiqueta HTML. La etiqueta `google-site-verification` ya está en `index.html` y no se debe quitar, o la verificación se pierde.
2. Después del deploy, tocar "Verificar", enviar `sitemap.xml` y pedir la indexación de la página del juego y de la de "Acerca del juego".
3. Opcional: Bing Webmaster Tools, que importa todo desde Search Console.

## Consecuencias
- Buscando "Limargeddon" debería aparecer primero, porque el nombre es único. Google tarda de días a unas semanas.
- Para búsquedas genéricas ayudan la página "Acerca del juego" y los enlaces de otros sitios (README, itch.io y compartirlo).
- Si cambian los distritos o los controles, `acerca.html` se actualiza a mano.
