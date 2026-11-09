# Pruebas de la app

Pruebas para encontrar **fallos**, **mejoras** y **mecánicas que la app aún no automatiza** (lo que el jugador tiene que recordar o calcular a mano). Se hacen poco a poco, una por chat.

## Archivos

- `PLAN.md`: lista de pruebas, hechas y pendientes. Es lo primero que hay que leer.
- `HALLAZGOS.md`: lo que se ha encontrado, con su prioridad y si ya está arreglado.
- `INVENTARIO.md` y `REGLAS.md`: lo que hace la app sola, lo que solo muestra como texto y lo que no aparece (salen de la fase 1).
- `fichas/`: las fichas del reparto de pruebas, para importar. Las activas se parecen al grupo de Albert: Zyo (brujo tiefling), un explorador elfo drow, un monje humano y un mago. En `fichas/reserva/` están la guerrera enana y el paladín, que no entran en la prueba de humo y se usarán más adelante. Se crean con el asistente de la app pasando `node tests/generar-fichas.js` (sobrescribe las que haya).
- `*.js`: los guiones de prueba (Playwright). Se pueden volver a pasar cuando haga falta. `humo.js` se pasa antes de cada versión.

## Cómo seguir en un chat nuevo

Cuando Albert pida «haz la siguiente prueba pendiente» (o algo parecido):

1. Lee `PLAN.md` y coge **solo la primera prueba pendiente**.
2. Lee únicamente el código de la app que necesite esa prueba; no leas toda la app.
3. Escribe o amplía el guion en `tests/` y pásalo.
4. Apunta en `HALLAZGOS.md` cada fallo, regla mal aplicada, mejora y posible automatización, con el formato de ese archivo. En las partidas simuladas, apunta **cada vez que el jugador tenga que pensar**: acordarse de algo, calcular algo o buscar una regla fuera de la app.
5. Marca la prueba como hecha en `PLAN.md` con la fecha y el número de hallazgos. Si sale algo nuevo que convenga probar, añádelo como pendiente en la fase que toque.
6. **No arregles nada todavía:** propón los arreglos a Albert y haz solo los que acepte. Cuando se arregle algo, márcalo como arreglado en `HALLAZGOS.md`.
7. Haz commit y push a la rama de trabajo y a `main`, para que el siguiente chat lo vea.
8. Termina con un resumen corto para Albert: qué se ha probado, qué se ha encontrado (lo más importante primero) y cuál es la siguiente prueba.

Si Albert cuenta algo de una partida real, apúntalo en `HALLAZGOS.md` con origen «Partida real», aunque no toque ninguna prueba.

**Cada prueba se lanza en un subagente** con el esfuerzo que indica `PLAN.md` (si Albert pide otro, se usa el suyo). Una prueba cada vez, nunca varias a la vez, para que no escriban en los mismos archivos. El subagente hace los pasos 2 a 5; el chat principal revisa lo que ha hecho, hace el paso 7 (commit y push) y el 8 (resumen para Albert). Así el chat principal crece poco, y cuando se alargue Albert sigue en uno nuevo: el avance está en `PLAN.md`.

Excepción: en la prueba 1a se pueden lanzar a la vez hasta 3 subagentes que solo lean, cada uno con su propio archivo de salida.

## Comprobaciones

Lo que `base.js` vigila después de cada paso, en todas las pruebas automáticas:

- No hay errores en la consola (salvo las fuentes de Google si no hay red).
- PG entre 0 y el máximo (más los temporales); dados de golpe, espacios, usos y munición entre 0 y su máximo.
- Bonificador de competencia y espacios según el nivel.
- La ficha queda igual tras exportarla e importarla, y tras recargar la página.
- Deshacer devuelve el estado anterior.

## Qué no se propone automatizar

- Tirar dados: la app dice qué tirar, pero los dados son físicos.
- Recuperar munición: el máster de Albert no usa la regla de la mitad; lo recuperado lo suma el jugador.

## Cómo pasar los guiones

```sh
python3 -m http.server 8777   # desde la raíz del repo, en segundo plano
node tests/<guion>.js
```

Los guiones usan `require('playwright')`, `serviceWorkers: 'block'` y definen antes de cargar la página `localStorage['fichas-tips'] = {"tour":1,"seen":{},"off":1}`. Los personajes se crean con el flujo real (asistente o «Importar ficha») y se manejan pulsando los `data-act`, como haría un jugador. Lo común va en `tests/base.js`, para no repetirlo en cada guion.

Cada guion termina con un informe corto por consola: qué ha hecho la app sola, qué no y qué comprobaciones han fallado. Así el informe se lee sin tener que repasar todo el código.
