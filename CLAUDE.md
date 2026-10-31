# CLAUDE.md

Contexto para Claude cuando trabaje en este repositorio.

## El proyecto

Fichas 5e es una PWA de fichas de personaje para D&D 5.ª edición con las **reglas de 2024**, toda en castellano. La publica GitHub Pages desde `main`: https://albertcontreras98.github.io/Fichas-5e/

La usan Albert (el autor) y sus amigos en sus partidas, en Android y en PC. Albert es novato en D&D. Su personaje es **Zyo**: tiefling con legado ctónico, brujo de nivel 1 con Pacto del Filo, trasfondo personalizado «Mendigo» y dote personalizada «Dote Superviviente».

La app está pensada para jugar con dados físicos. No tira dados: dice qué tirar y lleva la cuenta de PG, espacios, usos, munición, efectos, etc. Explica las reglas en lenguaje sencillo, porque los usuarios son principiantes.

## Normas de Albert (respetarlas siempre)

- Si dice «no cambies nada», «únicamente respóndeme» o «no lo hagas aún», **solo responde, no implementes**.
- Las recomendaciones son bienvenidas, pero **implementa solo lo que él acepte**.
- **No mostrar el número de versión en la interfaz.**
- El botón de descanso (zZ) se queda donde está.
- Munición: su máster **no** usa la regla de recuperar la mitad. La app solo descuenta munición al disparar; lo recuperado lo suma el jugador a mano.
- Comunicación con él: en castellano y sin jerga innecesaria.

## Arquitectura

HTML, CSS y JS sin frameworks ni compilación. Los scripts son **clásicos (no módulos ES)** y comparten el ámbito global (`const`, `let` y `function` de nivel superior). Por eso **el orden de los `<script>` en `index.html` importa**: un archivo puede usar en tiempo de carga solo lo definido en los anteriores; en tiempo de ejecución puede usar todo.

Orden de carga:
1. `data/*.js` (datos de reglas que cuelgan de `window.*`).
2. `js/core` → `js/ui` → `js/features/creatures.js` → `js/core/effects.js` → `js/views` → resto de `js/features`.
3. `js/actions/index.js` (define `A = {}`) → `js/actions/*.js` (cada uno hace `Object.assign(A, {...})`).
4. `js/events.js`, que contiene el arranque: `load(); tipsInit(); render();`.
5. `js/pwa.js`.

Piezas clave:
- **Estado:** `S = {chars, active, tab}`, guardado en `localStorage['fichas-dnd-2024-v1']`. `C()` devuelve el personaje activo. `save()` guarda y `render()` repinta todo.
- **Pintado:** `render()` llama a `applyTheme()`, después a `renderWelcome()` si no hay personaje, o a `renderTop()`, `renderView()`, `refreshVida()` y `tourMaybe()`. Las vistas devuelven HTML como plantillas de texto; usa siempre `esc()` con el texto del usuario.
- **Acciones:** cualquier elemento con `data-act="x"` ejecuta `A[x](el)` desde el manejador de clic de `events.js`. Ese manejador guarda una instantánea en `UNDO` cuando cambian los personajes.
- **Modales:** `openModal(html, big)` / `closeModal()`. Al cerrar se reinician los estados temporales `W` (asistente), `P` (buscador de conjuros), `CX` (criatura en edición), `NI` (objeto nuevo) y `pendingEco`. Capas (z-index): modal 20, toasts 25, tutorial 40.
- **Efectos:** duración `{r}` en rondas, `{m}` en minutos o `{inf}`. `endEffects(c, pred)` también quita la concentración y la forma. `syncEffects` elimina las invocaciones ligadas a una concentración perdida.
- **Combate:** `c.combat = {round}` o `null`. `t-end` avanza la ronda.
- **Tutorial:** clave aparte, `localStorage['fichas-tips']`, por dispositivo y no por ficha: `{tour, seen:{...}, off}`.
- **Ojo con los nombres globales cortos:** `W`, `P`, `D`, `A`, `G`, `S`, `C`, `M`... Al añadir funciones, no los reutilices como globales. Dentro de funciones, usa nombres que no tapen otros que necesites (por eso `tourPlace` usa `VW`/`VH`).

Cada archivo empieza con un comentario de una línea que dice qué contiene. El formato lo aplica Prettier (`npm run format`, config en `.prettierrc.json`). `data/` y `css/themes.css` se excluyen: son datos y CSS generado.

## Publicar una versión

1. Sube `VERSION` en `sw.js` (`'fichas-vNN'`) **en cada release**. Si no, los dispositivos no descargan la nueva versión.
2. Si añades, quitas o renombras un archivo, actualiza la lista `SHELL` de `sw.js` **y** los `<script>`/`<link>` de `index.html`.
3. Haz commit y push a `main`. Pages despliega solo.

## Probar

No hay tests automatizados en el repo. Para comprobar los cambios:
- Levanta un servidor estático (`python3 -m http.server 8777`) y prueba con Playwright, usando `serviceWorkers: 'block'` en el contexto.
- Prueba el flujo real: importar una ficha (botón «Importar ficha», textarea `#imp-text`, `[data-act=import]`) y pulsar los `data-act` implicados.
- Para que el tutorial no se cruce en las pruebas, define antes de cargar la página `localStorage['fichas-tips'] = {"tour":1,"seen":{},"off":1}`.
- Revisa la consola: no debe haber errores, salvo las fuentes de Google si no hay red.
- Comprueba con capturas a 390 px (móvil) y 1280 px (PC).

## Git

- Identidad para commits: `Albert Contreras <acont.g98@gmail.com>`.
- Mensajes de commit en castellano y descriptivos.
