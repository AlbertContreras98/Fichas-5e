# Plan de pruebas

Buscamos tres cosas: **fallos**, **mejoras** y **mecánicas que la app aún no automatiza**. Cada fase usa el método que mejor encuentra lo suyo, y primero va lo que os afecta en la mesa (niveles bajos y vuestros personajes).

Una prueba por chat. Se hace siempre **la primera pendiente**. El procedimiento está en `README.md`.

Leyenda: `[ ]` pendiente · `[x]` hecha (fecha · hallazgos). Entre paréntesis, el esfuerzo recomendado.

## Fase 0 · Preparación

- [x] **Base, reparto y prueba de humo** (medio). `tests/base.js` con lo común: abrir la app, importar una ficha, pulsar `data-act`, recoger errores de consola y comprobar las cuentas (ver «Comprobaciones» en `README.md`). Fichas del reparto en `tests/fichas/`: Zyo, un marcial (guerrero o bárbaro), un lanzador completo (mago o clérigo) y un medio lanzador (paladín o explorador); si Albert pasa las fichas de sus amigos, se añaden. `tests/humo.js`: un recorrido corto por lo básico (combate, daño, curación, descansos, subir de nivel) para pasarlo antes de cada versión. (2026-11-09 · 5 hallazgos)

## Fase 1 · Inventario de automatizaciones

El objetivo es la lista completa de lo que la app **hace sola**, lo que **solo muestra como texto** y lo que **ni menciona**.

- [x] **1a. Datos de la app** (alto). Guion que recorre `data/` (rasgos de clase y subclase, conjuros, dotes, invocaciones, especies, trasfondos, objetos) y, para cada entrada, mira si el código la usa (daño, curación, duración, concentración, usos, efectos, CA…) o si solo enseña la descripción. Salida: `tests/INVENTARIO.md`. Se puede repartir entre 3 subagentes que solo lean (clases / conjuros / dotes, invocaciones y origen), cada uno con su propio archivo `tests/inventario-*.md`, que luego se juntan. (2026-11-09 · 23 hallazgos, n.º 6–28)
- [x] **1b. Reglas generales** (alto). Lista en `tests/REGLAS.md` con las reglas del Manual del Jugador de 2024 que no dependen de la clase: cómo se juega, glosario de reglas y estados. Por ejemplo, salvaciones contra la muerte, ataques de oportunidad, cobertura, agarrar y empujar, caídas, combate con dos armas, sorpresa, carga, luz y visión, cada estado y cada acción. Para cada una: la hace sola / solo texto / no aparece. Guion: `tests/reglas.js`. (2026-11-09 · 14 hallazgos, n.º 31–44)
- [x] **1c. Priorizar** (alto). Pasar a `HALLAZGOS.md` las candidatas de 1a y 1b, puntuadas por frecuencia, facilidad para olvidarla y coste. Descartar lo que choca con la idea de la app (no tira dados; la munición recuperada la suma el jugador). Resumen corto para Albert con las 10 primeras. La tabla ordenada está en «Prioridades» de `HALLAZGOS.md`; 2 de los nuevos están descartados. (2026-11-09 · 37 hallazgos nuevos, n.º 45–81)

## Fase 2 · Prueba de estrés

Guiones automáticos que buscan fallos sin tener que pensar casos concretos. Después se pueden volver a pasar gratis.

- [x] **2a. Todas las clases y subclases del 1 al 20** (medio). Crear con el asistente cada clase y subclase, subirla nivel a nivel y comprobar en cada paso que no hay errores de consola y que las cuentas cuadran (PG, espacios, usos, competencia). Guion: `tests/clases.js` (48 subclases, 960 niveles; tarda unos 10 minutos; `node tests/clases.js wizard/evoker` pasa solo una). `base.js` conoce ahora los espacios de los lanzadores de un tercio. (2026-11-11 · 4 hallazgos, n.º 82–85)
- [x] **2b. Botones al azar** (medio). Sobre las fichas del reparto, pulsar `data-act` al azar durante un buen rato (combate, descansos, efectos, inventario, deshacer, recargar la página) y vigilar las comprobaciones. Exportar e importar cada ficha y comprobar que queda igual. Incluir «Editar ficha» (cambiar características y nivel a mano, ver n.º 82) y las ventanas de dotes e invocaciones fuera del asistente (añadir y quitar). Guion: `tests/azar.js` (4 fichas × 5 semillas × 400 pasos = 8000 pasos al azar, más los casos aparte de «Editar ficha», 119 dotes y 26 invocaciones añadidas y quitadas, y duplicar y borrar personaje; tarda unos 6 minutos). El azar va con semilla: `node tests/azar.js --ficha=monje --semilla=3 --solo=azar --rastro` repite una tanda paso a paso. Pulsa 155 de los 241 botones del jugador; no llega a la tienda, los mapas, las pociones y pergaminos, los objetos mágicos ni las formas y criaturas (ver 2d). Mientras no se arreglen los n.º 86, 87, 89 y 92, el informe acaba con esas comprobaciones fallidas. (2026-11-12 · 7 hallazgos, n.º 86–92)
- [ ] **2c. Modo máster y compartir** (medio). Campañas, combate del máster con NPC del bestiario, y que cada código (`#pj`, `#cr`, `#tienda`, `#recibo`) llegue igual al otro lado y que un recibo no se aplique dos veces. Incluir la pestaña «Tienda» del jugador (comprar, regatear, vender, deshacer y recibo), a la que la prueba 2b no llega porque hace falta un código de tienda.
- [ ] **2d. Botones al azar en los rincones** (medio). Ampliar `tests/azar.js` para llegar a lo que la 2b no pulsa: una ficha de nivel 5 o más con pociones, pergaminos, objetos mágicos con cargas, un mapa con imagen, criaturas (familiar, montura, invocaciones) y formas; y una clase con reacciones que restan daño y con recursos de hechicero o pícaro. Volver a pasar el guion entero cuando se arreglen los n.º 86–89.

## Fase 3 · Partidas simuladas

Jugar como lo haría un jugador real, con situaciones típicas. **Norma principal:** cada vez que el jugador tenga que acordarse de algo, calcular algo o consultar una regla fuera de la app, se apunta como posible automatización.

- [ ] **Zyo, niveles 1 a 3** (alto; extra si se cruzan reglas). Combate con el arma de pacto y Explosión sobrenatural, concentración que se pierde al recibir daño, caer a 0 PG y salvaciones contra la muerte, descanso corto y largo, subir a nivel 2 y 3 (invocaciones nuevas), rasgos del legado ctónico, «Mendigo» y «Dote Superviviente». Reacciones dentro y fuera de su turno (Represión infernal tras un ataque de oportunidad, ver n.º 31) y avisos de ventaja o desventaja por estados (n.º 37). Apuntar también cuántas veces hay que buscar fuera de la app el daño de Estallido arcano y de Maleficio (n.º 45, 46 y 49) y la resistencia necrótica (n.º 52).
- [ ] **Explorador elfo drow, niveles 1 a 5** (alto). Como el del grupo de Albert (`explorador.json`). Armas a distancia y maestrías, munición, Marca del cazador, conjuros de explorador, rasgos del drow. Mirar en especial el +1d6 de Marca del cazador (n.º 49), las maestrías con números (n.º 61), Bayas nutritivas (n.º 77) y la Pericia de nivel 2 (n.º 62).
- [ ] **Monje humano, niveles 1 a 5** (alto). Como el del grupo de Albert (`monje.json`). Artes marciales y golpes desarmados, puntos de concentración, Defensa sin armadura, Ráfaga de golpes, Golpe aturdidor. Mirar en especial el golpe desarmado (n.º 41), Metabolismo asombroso al tirar iniciativa (n.º 54 y 64), Movimiento sin armadura (n.º 56), Desviar ataques (n.º 68) y la CD de Golpe aturdidor (n.º 57).
- [ ] **Lanzador completo (mago), niveles 1 a 5** (alto). Preparar conjuros, espacios, rituales, concentración, conjuros con salvación cada turno. Mirar en especial Escudo (n.º 51), Recuperación arcana (n.º 55), Dormir y otras salvaciones repetidas (n.º 50), el daño de Proyectil mágico y Descarga de fuego con espacios mayores (n.º 46 y 47) y el libro de conjuros (n.º 65).
- [ ] **Fichas reales de los amigos de Albert** (alto). Si las pasa, sustituyen o completan a las de arriba.
- [ ] **En reserva: marcial (guerrera enana) y medio lanzador (paladín humano), niveles 1 a 5** (alto). Fichas en `tests/fichas/reserva/`. Para más adelante.
- [ ] **Máster dirigiendo un combate** (alto). El reparto contra NPC del bestiario: iniciativa, turnos, caídos, criaturas de los jugadores.
- [ ] **Niveles altos (5, 11, 17 y 20)** (alto). Solo cuando el grupo se acerque a esos niveles.

## Fase 4 · Interfaz

- [ ] **Repaso con capturas** (alto). Capturas a 390 px (móvil) y 1280 px (PC) de todas las pantallas y ventanas, revisadas como lo haría un novato: qué no se entiende, qué cuesta encontrar, qué sobra, qué tapa otra cosa.

## Siempre abierto · Partidas reales

Cuando Albert cuente algo de una partida («aquí tuve que buscar una regla», «se me olvidó…», «esto falló»), se apunta en `HALLAZGOS.md` con origen «Partida real». No hace falta esperar a ninguna fase.

## Fase 5 · Lista final

- [ ] **Juntar y ordenar** (alto). Repasar todos los hallazgos pendientes, quitar repetidos y dejar en lo alto de `HALLAZGOS.md` una tabla ordenada por prioridad para que Albert elija qué se arregla.
