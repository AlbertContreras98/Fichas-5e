# Reglas generales

Resultado de la prueba 1b: las reglas del Manual del Jugador de 2024 que **no dependen de la clase** y qué hace la app con cada una. Lo que depende de los datos (rasgos, conjuros, dotes, especies, objetos) está en `INVENTARIO.md`.

- **La hace sola:** la app lleva la cuenta o hace el cálculo (aunque falte algún detalle, que se apunta en la nota).
- **Solo texto:** la app la explica (glosario, avisos, notas del turno), pero el jugador la aplica de memoria.
- **No aparece:** la app no la menciona en ningún sitio.

Se ha mirado el código con búsquedas (`js/`, `data/`, `index.html`) y lo dudoso se ha comprobado en la app con `tests/reglas.js` (Zyo de `tests/fichas/zyo.json`). Los hallazgos están en `HALLAZGOS.md` (n.º 31–44).

## 1. Cómo se juega

| Regla | Estado | Dónde y qué falta |
|---|---|---|
| Pruebas de característica y de habilidad (1d20 + modificador) | La hace sola | `showGloss()` (`js/ui/glossary.js:16-27`) dice qué tirar al tocar una habilidad o característica. |
| Competencia y pericia | La hace sola | `pb()` y `skillB()` (`js/core/rules.js:4-17`). Pericia suma el doble. |
| Tiradas de salvación | La hace sola | `saveB()` (`js/core/rules.js:13`), con los objetos mágicos. |
| Ventaja y desventaja | Solo texto | Glosario `adv`. La app nunca avisa de cuándo la tienes (estados, agotamiento, armas pesadas…). n.º 37. |
| Inspiración heroica | La hace sola | Botón de la estrella (`insp`, `js/actions/play.js:162`); el humano la gana en el descanso largo (`js/actions/rest.js:146`). El texto dice «repetir una tirada d20»; en 2024 sirve para **cualquier dado**. Si ya la tienes y ganas otra, se la puedes dar a otro personaje: no aparece. n.º 36. |
| Pruebas de grupo | No aparece | Ni en el glosario. n.º 42. |
| Percepción pasiva | La hace sola | `js/views/top.js:77` (10 + Percepción). El ±5 por ventaja o desventaja no aparece. |

## 2. Combate: empezar y turnos

| Regla | Estado | Dónde y qué falta |
|---|---|---|
| Iniciativa | La hace sola | `cb-start` (`js/actions/combat.js:38`): «Iniciativa: 1d20 + DES» (suma la competencia con Alerta). |
| Sorpresa (desventaja en la iniciativa) | No aparece | n.º 37 y 42. |
| Ventaja en iniciativa si estás Invisible, desventaja si estás Incapacitado | No aparece | n.º 37. |
| Rondas y turnos | La hace sola | Contador de ronda; «Terminar turno» (`t-end`, `combat.js:19`) baja las rondas de los efectos. |
| Una acción, una acción adicional y una reacción | La hace sola | Pastillas de `viewTurn()` (`js/views/turn.js:153`); los botones se apagan al gastarlas y se pueden recuperar a mano. |
| La reacción se recupera **al empezar tu turno** | La hace sola | Pero se recupera al pulsar «Terminar turno» (`combat.js:21`), no al empezar el siguiente. Regla mal aplicada: n.º 31. |
| Movimiento repartido antes y después de la acción | Solo texto | Glosario `speed`. No se cuentan los pies gastados. |
| Interactuar gratis con un objeto; desenfundar o envainar un arma al atacar | No aparece | |
| Terminar el combate | La hace sola | `cb-end` (`combat.js:50`) pregunta qué efectos de rondas y qué estados de combate se acaban. |

## 3. Acciones

| Regla | Estado | Dónde y qué falta |
|---|---|---|
| Atacar (y Ataque adicional) | La hace sola | `attacksPerAction()` (`turn.js:132`) y `t-atk` (`combat.js:82`) cuentan los ataques que quedan y gastan la munición. |
| Correr | Solo texto | `t-gen` (`combat.js:261`) gasta la acción y saca el texto; no dice cuántos pies tienes en total. n.º 39. |
| Destrabarse | Solo texto | Igual que Correr. |
| Esquivar | Solo texto | Gasta la acción, pero no crea ningún efecto «hasta tu siguiente turno» (comprobado). n.º 39. |
| Ayudar | Solo texto | El glosario mezcla las dos formas (para ayudar en una prueba necesitas competencia en esa habilidad) y no dice que también sirve para estabilizar. n.º 36. |
| Esconderse | Solo texto | Gasta la acción, pero no pone el estado Invisible aunque superes la CD 15 (comprobado). n.º 39. |
| Influir | Solo texto | No enseña los bonificadores de Engaño, Intimidación, Interpretación, Persuasión o Trato con animales. n.º 39. |
| Magia (lanzar un conjuro o usar un objeto mágico) | La hace sola | Desplegable «Magia» de cada columna (`turn.js:244-271` y `turn.js:377-382`) y objetos con cargas (`t-mi`). No tiene entrada en el glosario. |
| Preparar | Solo texto | Gasta la acción, pero no reserva la reacción. No dice que preparar un conjuro gasta el espacio y pide concentración. n.º 36. |
| Buscar | Solo texto | No enseña los bonificadores de Perspicacia, Medicina, Percepción y Supervivencia. n.º 39. |
| Estudiar | Solo texto | Igual con Conocimiento arcano, Historia, Investigación, Naturaleza y Religión. n.º 39. |
| Usar un objeto | La hace sola | Pociones como acción adicional, consumibles, kit de sanador… (`t-item`, `t-gear`). El botón genérico solo gasta la acción. |
| Acción adicional | La hace sola | Columna propia; solo salen las que te da algo. |
| Reacción | La hace sola | Columna propia (ver n.º 31). |
| Ataque de oportunidad | La hace sola | `t-opp` (`combat.js:269`) gasta la reacción, pero no dice con qué arma ni qué tirar. n.º 43. |
| Combate con dos armas (propiedad Ligera) | La hace sola | `turn.js:303-320` y `lightDmg()`: acción adicional y daño sin modificador (con Combate con dos armas, con él). Se puede usar sin haber atacado antes (n.º 28). |
| Maestrías de armas | Solo texto | Salen en las notas del arma; solo 3 de 8 hacen algo solas (ver `INVENTARIO.md` y n.º 17). |
| Agarrar | La hace sola | `t-shove` (`combat.js:117`): calcula la CD (8 + FUE + competencia) y gasta uno de los ataques. |
| Empujar | La hace sola | Igual que Agarrar. |
| Soltarse de un agarre | Solo texto | La nota del turno dice «puedes usar una acción», sin decir qué tirar (Atletismo o Acrobacias). n.º 38. |
| Golpe desarmado (1 + FUE contundente) | No aparece | No hay ataque de golpe desarmado para nadie (el del monje es el n.º 12). n.º 41. |

## 4. Ataques y daño

| Regla | Estado | Dónde y qué falta |
|---|---|---|
| Tirada de ataque con arma (modificador + competencia) | La hace sola | `wpnCalc()` (`js/views/inventory.js:207`). |
| Arma sin competencia | La hace sola | No suma la competencia y lo avisa (`inventory.js:243`). |
| Propiedad Pesada con FUE (o DES) menor de 13 | Solo texto | Glosario de armas; no avisa en el ataque. n.º 37. |
| Propiedad Alcance | Solo texto | Glosario de armas. |
| Alcance normal y largo de las armas a distancia | Solo texto | Las notas dicen «munición (80/320)»; la desventaja a largo alcance solo sale en el glosario de Arrojadiza. n.º 42. |
| Ataque a distancia con un enemigo a 5 pies (desventaja) | No aparece | n.º 42. |
| Cobertura (+2, +5, total) | No aparece | Ni en el glosario. n.º 42. |
| Golpe crítico (el doble de dados) | Solo texto | Glosario `crit`. El mensaje del ataque no dice qué tirar si sacas un 20. n.º 40. |
| Un 1 natural siempre falla | Solo texto | Glosario `crit`. |
| Armas improvisadas | No aparece | |
| Tipos de daño | La hace sola | Cada ataque lleva su tipo. |
| Resistencia y vulnerabilidad | La hace sola | Botones «Resistencia (½)» y «Vulnerabilidad (×2)» (`js/views/play.js:47`). El jugador tiene que acordarse de cuándo usarlos; las resistencias propias no se guardan (ver `INVENTARIO.md`, candidata 7). |
| Inmunidad | No aparece | No hace falta botón (no apuntas el daño), pero no se guarda en la ficha. |
| PG temporales | La hace sola | No se suman, se gastan primero y se pierden en el descanso largo (`play.js:237-248`, `rest.js`). |
| Curación (sin pasar del máximo) | La hace sola | `hp` (`play.js:209`). |
| Combate montado | No aparece | |
| Combate bajo el agua | No aparece | |

## 5. Caer a 0 PG

| Regla | Estado | Dónde y qué falta |
|---|---|---|
| Caer a 0 PG: quedas Inconsciente | La hace sola | `play.js:255-260` pone el estado; curarte lo quita. |
| Salvaciones contra la muerte | La hace sola | Contador con éxitos y fallos (`deathHTML()`, `js/views/play.js:20`), arriba de Combate. Se marcan a mano: no las pide al empezar o terminar tu turno. n.º 44. |
| 20 natural: recuperas 1 PG | La hace sola | Botón «He sacado un 20» (`nat20`). |
| 1 natural: dos fallos | La hace sola | Botón «He sacado un 1» (`nat1`). |
| Recibir daño a 0 PG: un fallo (dos si es crítico) | La hace sola | Suma un fallo; lo del crítico es solo texto (no hay forma de decir que el golpe fue crítico). n.º 32. |
| Muerte instantánea al caer (el daño sobrante iguala tus PG máximos) | La hace sola | Mensaje en `play.js:257`; no marca al personaje como muerto. |
| Muerte instantánea si ya estás a 0 PG y el daño iguala tus PG máximos | No aparece | Comprobado: con 10 PG máximos, 25 de daño a 0 PG solo suma un fallo. n.º 32. |
| Tres éxitos: estable | Solo texto | Aviso en el contador. Que recuperas 1 PG a las 1d4 horas no aparece. n.º 44. |
| Tres fallos: muerto | Solo texto | Aviso en el contador; no hay estado «muerto». |
| Estabilizar (Ayudar + Medicina CD 10, o kit de sanador) | Solo texto | El kit de sanador gasta un uso y la acción y lo explica (`data/items.js:117`); lo de Medicina CD 10 no aparece. n.º 42. |
| Derribar sin matar (dejar inconsciente en vez de a 0 PG) | Solo texto | Solo en el modo máster: el NPC se puede marcar como «inconsciente pero vivo» (`js/features/master.js:382`). Para el jugador no aparece. |

## 6. Movimiento

| Regla | Estado | Dónde y qué falta |
|---|---|---|
| Velocidad | La hace sola | `js/views/top.js:111`: especie + dotes − 10 por armadura pesada sin FUE − 5 por nivel de agotamiento. |
| Velocidad 0 por estados (Agarrado, Apresado, Paralizado, Petrificado, Inconsciente) | Solo texto | Lo dicen las notas del turno, pero arriba sigue saliendo la velocidad normal (comprobado). n.º 38. |
| Terreno difícil | No aparece | n.º 42. |
| Arrastrarse | Solo texto | En el estado Derribado. |
| Levantarse (cuesta la mitad de la velocidad) | Solo texto | En el estado Derribado y en las notas del turno. |
| Saltar (longitud = FUE en pies con carrerilla; altura = 3 + mod. FUE) | No aparece | n.º 42. |
| Trepar y nadar (cada pie cuesta uno más) | No aparece | n.º 42. |
| Caídas (1d6 por cada 10 pies, máx. 20d6, y quedas derribado) | No aparece | n.º 42. |
| Volar (caes si quedas derribado o con velocidad 0) | No aparece | |
| Tamaño y espacio; pasar por el espacio de otra criatura | No aparece | |
| Viajar a ritmo rápido, normal o lento | No aparece | |

## 7. Entorno

| Regla | Estado | Dónde y qué falta |
|---|---|---|
| Luz brillante, luz tenue y oscuridad (zonas poco o muy oscuras) | No aparece | n.º 42. |
| Visión en la oscuridad | Solo texto | Rasgo de especie que crea el asistente (`js/features/wizard.js:791`). |
| Visión ciega, sentido sísmico, visión verdadera | No aparece | Solo en los datos del bestiario del máster. |
| Ceguera | Solo texto | Estado Cegado. |
| Asfixia (aguantas la respiración 1 + mod. CON minutos) | No aparece | n.º 42. |
| Comida | La hace sola | El descanso largo gasta una ración y cuenta los días sin comer (`rest.js:147-163`). Usa «3 + CON días», que parece la regla de 2014: hay que confirmarlo con el manual de 2024. n.º 35. |
| Agua | No aparece | |
| Capacidad de carga (FUE × 15 libras) y empujar, arrastrar o levantar (× 30) | No aparece | Los objetos no tienen peso en `data/items.js`. |

## 8. Conjuros: reglas comunes

| Regla | Estado | Dónde y qué falta |
|---|---|---|
| CD de salvación y ataque de conjuro | La hace sola | `spDC()` y `spAtk()` (`js/core/rules.js:180-181`). |
| Espacios de conjuro y lanzar a nivel superior | La hace sola | Elige el espacio al lanzar (`js/actions/play.js:88-104`). El efecto del nivel superior es otra cosa (ver `INVENTARIO.md`). |
| Trucos sin espacio | La hace sola | |
| Tiempo de lanzamiento (acción, adicional, reacción) | La hace sola | Cada conjuro sale en su columna y gasta lo suyo. |
| Rituales (+10 minutos, sin espacio, no en combate) | La hace sola | `play.js:92-100`. |
| Un solo espacio de conjuro por turno | La hace sola | Aviso al gastar el segundo (`js/views/play.js:266`). |
| Componentes verbal y somático (no puedes hablar, necesitas una mano libre) | Solo texto | Glosario `comp`. Ningún estado lo recuerda (Incapacitado: no puedes hablar). |
| Componente material con precio que se gasta | La hace sola | `spConsume()` (`js/core/rules.js:170`) lo busca en el inventario y lo gasta. |
| Canalizador o bolsa de componentes | Solo texto | Glosario `comp`. |
| Concentración: solo un conjuro a la vez | La hace sola | Lanzar otro quita el anterior. |
| Concentración: salvación de CON al recibir daño (CD 10 o la mitad, máx. 30) | La hace sola | `play.js:272-276`, con botones «La supero / La fallo». |
| Concentración: se pierde al quedar incapacitado o a 0 PG | La hace sola | `play.js:186-192` y `play.js:278` (comprobado con Aturdido). |
| Duración de los conjuros | La hace sola | `spellDur()` y efectos (`js/core/effects.js`). |
| Lanzar con armadura o escudo sin competencia (no se puede) | Solo texto | Aviso junto a la CA (`inventory.js:402-409`), pero deja lanzar igual (comprobado). n.º 34. |
| Alcance, objetivos y áreas de efecto | Solo texto | En la descripción de cada conjuro. |
| Pergaminos de conjuro | La hace sola | `t-scroll`: usa la CD del pergamino y lo gasta. |

## 9. Descansos

| Regla | Estado | Dónde y qué falta |
|---|---|---|
| Descanso corto: gastar dados de golpe (dado + CON) | La hace sola | `shortRestModal()` (`js/features/rest.js`) y `hd` (`js/actions/rest.js:59`). |
| Descanso corto: recuperar magia de pacto y rasgos | La hace sola | `short-done` (`rest.js:83`). |
| Descanso largo: PG, todos los dados de golpe, espacios, rasgos, −1 agotamiento y fuera PG temporales | La hace sola | `long-done` (`rest.js:116`). |
| Hace falta tener al menos 1 PG para el descanso largo | No aparece | Comprobado: a 0 PG lo recupera todo. n.º 33. |
| Solo un descanso largo cada 24 horas | No aparece | |
| Interrupciones (iniciativa, lanzar un conjuro, recibir daño, 1 hora de esfuerzo; si ha durado 1 hora, cuenta como corto) | No aparece | n.º 42. |
| El tiempo del descanso pasa para los efectos | La hace sola | `passTime()` (`js/core/effects.js:33`). El descanso largo además termina siempre la concentración (`rest.js:144`); ver la nota del n.º 30. |

## 10. Agotamiento

| Regla | Estado | Dónde y qué falta |
|---|---|---|
| Niveles de 1 a 6 | La hace sola | Contador en «Vida y estado» (`exh`). |
| −2 por nivel a todas las tiradas d20 | Solo texto | Lo dice el contador y la nota del turno, pero los números de habilidades, salvaciones, ataques e iniciativa no lo restan (comprobado). n.º 37. |
| −5 pies de velocidad por nivel | La hace sola | `js/views/top.js:111`. |
| Nivel 6: muerte | Solo texto | Aviso en el contador. |
| El descanso largo quita un nivel | La hace sola | `rest.js:142`. |

## 11. Estados

Todos se activan a mano en «Vida y estado» (`cond`, `js/actions/play.js:173`) con su texto (`CONDS`, `js/core/constants.js:35`). Algunos tienen además una nota en Combate (`viewTurn()`, `js/views/turn.js:160-186`). Los que incapacitan (`INCAP`, `js/ui/modals.js:105`) bloquean las acciones, quitan la concentración y la transformación.

| Estado | Estado en la app | Dónde y qué falta |
|---|---|---|
| Agarrado | Solo texto | Nota en Combate. La velocidad de arriba no baja a 0 (n.º 38); no dice qué tirar para soltarte. |
| Apresado | Solo texto | Nota en Combate; velocidad igual que el anterior. |
| Asustado | Solo texto | Nota en Combate. |
| Aturdido | La hace sola | Incapacita (bloquea acciones, quita concentración). |
| Cegado | Solo texto | Nota en Combate. |
| Derribado | Solo texto | Nota en Combate. El texto dice que **todos** los ataques cuerpo a cuerpo contra ti tienen ventaja; en 2024 es a 5 pies o menos, y los de más lejos tienen desventaja (n.º 36). |
| Ensordecido | Solo texto | Solo en la lista de estados. |
| Envenenado | Solo texto | Nota en Combate; el mensaje del ataque no avisa de la desventaja (comprobado, n.º 37). |
| Hechizado | Solo texto | Solo en la lista de estados. |
| Incapacitado | La hace sola | Bloquea acciones y quita la concentración. Falta en el texto: no puedes hablar y tiras la iniciativa con desventaja (n.º 36). |
| Inconsciente | La hace sola | Se pone solo al caer a 0 PG y se quita al curarte. Falta en el texto: velocidad 0, te atacan con ventaja y fallas las salvaciones de FUE y DES (n.º 36). |
| Invisible | Solo texto | Nota en Combate. No lo pone Esconderse ni la poción de invisibilidad (n.º 28 y 39). Falta en el texto: ventaja en la iniciativa. |
| Paralizado | La hace sola | Incapacita. Falta en el texto: te atacan con ventaja; velocidad arriba sin bajar a 0. |
| Petrificado | La hace sola | Incapacita. La resistencia a todo el daño no se aplica sola; falta en el texto: te atacan con ventaja, fallas FUE y DES, inmune a veneno. |
| Agotamiento | La hace sola | Ver el apartado 10. |

## Resumen en cifras

| Apartado | Reglas | La hace sola | Solo texto | No aparece |
|---|---:|---:|---:|---:|
| 1. Cómo se juega | 7 | 5 | 1 | 1 |
| 2. Combate: empezar y turnos | 9 | 5 | 1 | 3 |
| 3. Acciones | 21 | 9 | 11 | 1 |
| 4. Ataques y daño | 17 | 6 | 5 | 6 |
| 5. Caer a 0 PG | 11 | 6 | 4 | 1 |
| 6. Movimiento | 11 | 1 | 3 | 7 |
| 7. Entorno | 8 | 1 | 2 | 5 |
| 8. Conjuros | 16 | 12 | 4 | 0 |
| 9. Descansos | 7 | 4 | 0 | 3 |
| 10. Agotamiento | 5 | 3 | 2 | 0 |
| 11. Estados | 15 | 6 | 9 | 0 |
| **Total** | **127** | **58** | **42** | **27** |

**Cómo leerlo:**
- **Lo que mejor lleva:** los conjuros (espacios, concentración, rituales), los PG (temporales, resistencia, caer a 0, salvaciones contra la muerte), los descansos y la economía del turno.
- **Lo que más falta:** la app nunca dice **cuándo tienes ventaja o desventaja**. Los estados, el agotamiento, las armas pesadas o atacar a distancia con un enemigo al lado se explican, pero no se reflejan en los números ni en el mensaje del ataque. Es lo que más tiene que recordar un novato.
- **Acciones sin efecto:** Esquivar, Esconderse, Correr, Buscar, Estudiar e Influir solo gastan la acción y sacan el texto.
- **No aparecen:** casi todo el movimiento (saltar, caer, trepar, terreno difícil), la luz y la visión, la cobertura y la carga. Lo más barato es explicarlos en el glosario (n.º 42).
- **Reglas mal aplicadas:** la reacción se recupera al terminar tu turno (n.º 31), daño a 0 PG sin muerte instantánea (n.º 32), descanso largo a 0 PG (n.º 33), escudo sin competencia (n.º 34), días sin comer (n.º 35, por confirmar) y textos de estados incompletos (n.º 36).
