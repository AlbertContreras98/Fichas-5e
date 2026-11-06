# Pruebas de la app

Pruebas que hacen lo mismo que un jugador para descubrir qué mecánicas aún no están automatizadas y tiene que llevar el jugador a mano. Se hacen poco a poco, una por chat.

## Archivos

- `PLAN.md`: lista de pruebas, hechas y pendientes. Es lo primero que hay que leer.
- `HALLAZGOS.md`: lo que se ha encontrado en las pruebas, y si ya está arreglado.
- `*.js`: los guiones de prueba (Playwright). Se pueden volver a pasar cuando haga falta.

## Cómo seguir en un chat nuevo

Cuando Albert pida «haz la siguiente prueba pendiente» (o algo parecido):

1. Lee `PLAN.md` y coge **solo la primera prueba pendiente** (un solo apartado por chat, para que no se alargue).
2. Lee únicamente el código de la app que necesite esa prueba; no leas toda la app.
3. Escribe o amplía el guion en `tests/` y pásalo.
4. Apunta en `HALLAZGOS.md` cada cosa que el jugador tenga que hacer a mano, cada fallo y cada regla mal aplicada, con el formato de ese archivo.
5. Marca la prueba como hecha en `PLAN.md` con la fecha y el número de hallazgos. Si sale algo nuevo que convenga probar, añádelo como pendiente.
6. **No arregles nada todavía:** propón los arreglos a Albert y haz solo los que acepte. Cuando se arregle algo, márcalo como arreglado en `HALLAZGOS.md`.
7. Haz commit y push a la rama de trabajo y a `main`, para que el siguiente chat lo vea.
8. Termina con un resumen corto para Albert: qué se ha probado, qué se ha encontrado y cuál es la siguiente prueba.

## Cómo pasar los guiones

```sh
python3 -m http.server 8777   # desde la raíz del repo, en segundo plano
node tests/<guion>.js
```

Los guiones usan `require('playwright')`, `serviceWorkers: 'block'` y definen antes de cargar la página `localStorage['fichas-tips'] = {"tour":1,"seen":{},"off":1}`. Los personajes se crean con el flujo real (asistente o «Importar ficha») y se manejan pulsando los `data-act`, como haría un jugador. Lo común (abrir la app, crear personaje, subir de nivel, empezar combate...) va en `tests/base.js`, para no repetirlo en cada guion.

Cada guion termina con un informe corto por consola: qué ha hecho la app sola y qué no. Así el informe se lee sin tener que repasar todo el código.
