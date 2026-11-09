# Plan de pruebas

Buscamos tres cosas: **fallos**, **mejoras** y **mecánicas que la app aún no automatiza**. Cada fase usa el método que mejor encuentra lo suyo, y primero va lo que os afecta en la mesa (niveles bajos y vuestros personajes).

Una prueba por chat. Se hace siempre **la primera pendiente**. El procedimiento está en `README.md`.

Leyenda: `[ ]` pendiente · `[x]` hecha (fecha · hallazgos). Entre paréntesis, el esfuerzo recomendado.

## Fase 0 · Preparación

- [x] **Base, reparto y prueba de humo** (medio). `tests/base.js` con lo común: abrir la app, importar una ficha, pulsar `data-act`, recoger errores de consola y comprobar las cuentas (ver «Comprobaciones» en `README.md`). Fichas del reparto en `tests/fichas/`: Zyo, un marcial (guerrero o bárbaro), un lanzador completo (mago o clérigo) y un medio lanzador (paladín o explorador); si Albert pasa las fichas de sus amigos, se añaden. `tests/humo.js`: un recorrido corto por lo básico (combate, daño, curación, descansos, subir de nivel) para pasarlo antes de cada versión. (2026-11-09 · 5 hallazgos)

## Fase 1 · Inventario de automatizaciones

El objetivo es la lista completa de lo que la app **hace sola**, lo que **solo muestra como texto** y lo que **ni menciona**.

- [ ] **1a. Datos de la app** (alto). Guion que recorre `data/` (rasgos de clase y subclase, conjuros, dotes, invocaciones, especies, trasfondos, objetos) y, para cada entrada, mira si el código la usa (daño, curación, duración, concentración, usos, efectos, CA…) o si solo enseña la descripción. Salida: `tests/INVENTARIO.md`. Se puede repartir entre 3 subagentes que solo lean (clases / conjuros / dotes, invocaciones y origen), cada uno con su propio archivo `tests/inventario-*.md`, que luego se juntan.
- [ ] **1b. Reglas generales** (alto). Lista en `tests/REGLAS.md` con las reglas del Manual del Jugador de 2024 que no dependen de la clase: cómo se juega, glosario de reglas y estados. Por ejemplo, salvaciones contra la muerte, ataques de oportunidad, cobertura, agarrar y empujar, caídas, combate con dos armas, sorpresa, carga, luz y visión, cada estado y cada acción. Para cada una: la hace sola / solo texto / no aparece.
- [ ] **1c. Priorizar** (alto). Pasar a `HALLAZGOS.md` las candidatas de 1a y 1b, puntuadas por frecuencia, facilidad para olvidarla y coste. Descartar lo que choca con la idea de la app (no tira dados; la munición recuperada la suma el jugador). Resumen corto para Albert con las 10 primeras.

## Fase 2 · Prueba de estrés

Guiones automáticos que buscan fallos sin tener que pensar casos concretos. Después se pueden volver a pasar gratis.

- [ ] **2a. Todas las clases y subclases del 1 al 20** (medio). Crear con el asistente cada clase y subclase, subirla nivel a nivel y comprobar en cada paso que no hay errores de consola y que las cuentas cuadran (PG, espacios, usos, competencia).
- [ ] **2b. Botones al azar** (medio). Sobre las fichas del reparto, pulsar `data-act` al azar durante un buen rato (combate, descansos, efectos, inventario, deshacer, recargar la página) y vigilar las comprobaciones. Exportar e importar cada ficha y comprobar que queda igual.
- [ ] **2c. Modo máster y compartir** (medio). Campañas, combate del máster con NPC del bestiario, y que cada código (`#pj`, `#cr`, `#tienda`, `#recibo`) llegue igual al otro lado y que un recibo no se aplique dos veces.

## Fase 3 · Partidas simuladas

Jugar como lo haría un jugador real, con situaciones típicas. **Norma principal:** cada vez que el jugador tenga que acordarse de algo, calcular algo o consultar una regla fuera de la app, se apunta como posible automatización.

- [ ] **Zyo, niveles 1 a 3** (alto; extra si se cruzan reglas). Combate con el arma de pacto y Explosión sobrenatural, concentración que se pierde al recibir daño, caer a 0 PG y salvaciones contra la muerte, descanso corto y largo, subir a nivel 2 y 3 (invocaciones nuevas), rasgos del legado ctónico, «Mendigo» y «Dote Superviviente».
- [ ] **Marcial, niveles 1 a 5** (alto). Armas y maestrías, munición, estilos de combate, Ataque extra.
- [ ] **Lanzador completo, niveles 1 a 5** (alto). Preparar conjuros, espacios, rituales, concentración, conjuros con salvación cada turno.
- [ ] **Medio lanzador, niveles 1 a 5** (alto). Mezcla de armas y conjuros, recursos de clase.
- [ ] **Fichas de los amigos de Albert** (alto). Una prueba por ficha, cuando las pase.
- [ ] **Máster dirigiendo un combate** (alto). El reparto contra NPC del bestiario: iniciativa, turnos, caídos, criaturas de los jugadores.
- [ ] **Niveles altos (5, 11, 17 y 20)** (alto). Solo cuando el grupo se acerque a esos niveles.

## Fase 4 · Interfaz

- [ ] **Repaso con capturas** (alto). Capturas a 390 px (móvil) y 1280 px (PC) de todas las pantallas y ventanas, revisadas como lo haría un novato: qué no se entiende, qué cuesta encontrar, qué sobra, qué tapa otra cosa.

## Siempre abierto · Partidas reales

Cuando Albert cuente algo de una partida («aquí tuve que buscar una regla», «se me olvidó…», «esto falló»), se apunta en `HALLAZGOS.md` con origen «Partida real». No hace falta esperar a ninguna fase.

## Fase 5 · Lista final

- [ ] **Juntar y ordenar** (alto). Repasar todos los hallazgos pendientes, quitar repetidos y dejar en lo alto de `HALLAZGOS.md` una tabla ordenada por prioridad para que Albert elija qué se arregla.
