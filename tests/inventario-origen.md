# Inventario 1a · Dotes, invocaciones, origen y objetos

Parte de la prueba 1a. Recorre `data/feats.js`, `data/invocations.js`, `data/origins.js` y `data/items.js` y, para cada entrada, dice si la app la aplica sola, a medias o solo enseña el texto.

- Primera criba: `node tests/inventario-origen.js` (o `--json`). Carga los datos y busca en `js/` qué código lee cada campo, qué rasgos tienen botón en Combate y qué herramientas reconoce el inventario.
- Después se ha revisado a mano el código (`js/features/feats.js`, `invocations.js`, `wizard.js`, `js/core/rules.js`, `js/views/inventory.js`, `turn.js`, `play.js`, `js/actions/combat.js`, `play.js`, `rest.js`, `inventory.js`) y las fichas que genera el asistente (`tests/fichas/*.json`). La clasificación final es la de este archivo.

Estados:
- **Sola**: la app lo aplica por sí misma (números, usos, conjuros, avisos en el momento justo). Lo que es de la mesa (mover a un enemigo, tirar un dado) no cuenta como «falta».
- **Parcial**: hace algo, pero falta una parte importante de la regla de 2024. En las dotes, «Parcial (solo +1)» quiere decir que **solo sube la característica** y todo lo demás es texto.
- **Solo texto**: solo enseña la descripción.

## 1. Resumen

| Tipo | Entradas | Sola | Parcial | Solo texto |
|---|---:|---:|---:|---:|
| Dotes | 76 | 25 | 43 (28 de ellas «solo +1») | 8 |
| · de origen | 12 | 4 | 4 | 4 |
| · generales | 42 | 14 | 28 (22 «solo +1») | 0 |
| · estilos de combate | 10 | 4 | 2 | 4 |
| · dones épicos | 12 | 3 | 9 (6 «solo +1») | 0 |
| Invocaciones | 28 | 12 | 5 | 11 |
| Especies | 10 | 3 | 6 | 1 |
| Linajes, legados y ascendencias | 24 | 11 | 3 | 10 |
| Trasfondos (+ «Otro») | 16 + 1 | 10 | 6 | 1 («Otro») |
| Armas | 38 | 38 | 0 | 0 |
| Propiedades de arma | 9 | 3 | 3 | 3 |
| Maestrías | 8 | 3 | 5 | 0 |
| Armaduras y escudo | 13 | 13 | 0 | 0 |
| Objetos mágicos | 6 | 4 | 2 | 0 |
| Pociones | 15 | 9 | 5 | 1 |
| Equipo con mecánica | 11 | 9 | 1 | 1 |
| Herramientas | 25 | 25* | 0 | 0 |

\* Las herramientas funcionan, pero 3 trasfondos y 1 dote dan la competencia con un nombre que el inventario no reconoce (ver «Fallos», n.º 1).

Lo más importante para **Zyo**:
- **Legado ctónico**: Toque gélido y Taumaturgia salen solos; a nivel 3 Falsa vida gratis 1 vez por descanso largo (con su ventana de 2d4 + 4) y a nivel 5 Rayo debilitador. La **resistencia al daño necrótico es solo texto**: al recibir daño tiene que acordarse de pulsar «Resistencia (½)».
- **Pacto del Filo**: solo sale «Invocar arma de pacto» como acción adicional. No crea el ataque con CAR, no da competencia con el arma elegida ni deja cambiar el tipo de daño (ya en HALLAZGOS n.º 3). Hoja sedienta y Hoja devoradora suben los ataques por acción, pero con cualquier arma.
- **Invocaciones** de nivel 2 que le tocarán: las de conjuro gratis (Máscara de los mil rostros, Visiones brumosas, Salto de otro mundo, Vigor infernal) funcionan solas; **Mente arcana, Vista del diablo, Estallido agonizante, Lanza arcana y Estallido repulsor son solo texto**; Lecciones de los Primeros es parcial.
- **Trasfondo propio «Mendigo»**: el asistente solo deja escribir el nombre (HALLAZGOS n.º 4). Aumentos, 2 habilidades y herramienta se ponen a mano en «Editar ficha».
- **Dote personalizada «Dote Superviviente»**: solo se puede añadir como rasgo en ⚙ Ajustes → Editar ficha → «Añadir rasgo». Lo que permite: nombre, origen, descripción, **usos fijos** (un número; no puede ser «tu bonificador de competencia»), recuperación (corto, largo o «1 en corto y todos en largo») y **cuándo se usa** (acción, adicional, reacción, sin gastar acción, sustituye un ataque, fuera de combate); con usos y momento, sale con su botón en Combate y se recupera en los descansos. Lo que no permite: que suba una característica, PG, CA, velocidad o iniciativa por sí sola (hay que cambiarlo a mano en los campos de la ficha: «Otros bonificadores a la CA», «Extra a iniciativa», «Velocidad», «PG máximos», habilidades y salvaciones), resistencias ni conjuros gratis. Si da un efecto con duración, se puede usar «Añadir efecto» (rondas, minutos o indefinido, con concentración).

## 2. Tablas

### 2.1 Dotes de origen

| Dote | Estado | Qué hace / qué falta |
|---|---|---|
| Alerta | Sola | Suma la competencia a la iniciativa (`init`, `js/core/rules.js:21`). El cambio de iniciativa con un aliado es cosa de la mesa. |
| Artesano | Solo texto | Desde el trasfondo no añade nada; desde la ventana «Dotes» escribe «tres herramientas de artesano a elegir» en Herramientas, que el inventario no reconoce. El 20 % de descuento no se aplica en la Tienda; la fabricación tras el descanso largo no se recuerda. |
| Sanador | Solo texto | El kit de sanador solo estabiliza; no ofrece «gastar un uso para curar 1 dado de golpe + competencia» ni recuerda repetir los 1. |
| Afortunado | Sola | Puntos de suerte = competencia, se recuperan en descanso largo, botón «sin gastar acción». |
| Iniciado en la magia (clérigo / druida / mago) | Parcial | Desde la ventana «Dotes» o al subir de nivel, pide los 2 trucos y el conjuro de nivel 1 y lo enlaza al uso gratis. **Desde el trasfondo (Acólito, Guía, Sabio), el Versátil humano o Lecciones de los Primeros no pide ni añade los conjuros**, y el contador «Conjuro de iniciado (gratis)» queda suelto (HALLAZGOS n.º 2). Tampoco deja elegir la aptitud mágica (INT, SAB o CAR): usa la de la ficha. |
| Músico | Parcial | La competencia con instrumentos se reconoce. No recuerda dar Inspiración heroica a los aliados al terminar un descanso. |
| Atacante salvaje | Solo texto | Podría recordarse en el aviso del ataque («una vez por turno, tira el daño dos veces»). |
| Hábil | Sola | Al crear (trasfondo o humano) suma 3 habilidades más a elegir; en la ventana «Dotes» también. Desde Lecciones de los Primeros **no** pide las habilidades (ver Invocaciones). Las herramientas hay que escribirlas a mano (lo avisa el texto). |
| Camorrista | Solo texto | La app no tiene un ataque desarmado genérico: no calcula el 1d4 + FUE ni la competencia con armas improvisadas. |
| Duro | Sola | +2 PG por nivel, también al subir de nivel y al quitarla. |

### 2.2 Dotes generales (nivel 4+)

Todas suben +1 a la característica elegida (con tope 20) y se pueden quitar deshaciendo lo sumado.

| Dote | Estado | Qué hace / qué falta |
|---|---|---|
| Actor | Parcial (solo +1) | Ventaja en Engaño/Interpretación al disfrazarse: texto. |
| Atleta | Parcial (solo +1) | Velocidad de trepar y levantarse por 5 pies: texto (no hay campo de velocidad de trepar). |
| Cargador | Parcial (solo +1) | +10 pies al Correr y +1d8 tras moverse en línea recta: texto. |
| Chef | Parcial | Competencia con utensilios de cocinero (reconocida) y contador de dulces (competencia por descanso largo). Comer un dulce no da los PG temporales solo; el 1d8 extra del descanso corto no se recuerda. |
| Experto en ballestas | Parcial (solo +1) | Ignorar Recarga, sin desventaja a 5 pies y modificador en el ataque extra con ballesta de mano: texto (el ataque extra ligero sigue sin modificador). |
| Aplastador | Parcial (solo +1) | Empujar 5 pies / ventaja tras crítico contundente: texto. |
| Duelista defensivo | Parcial (solo +1) | La reacción de +competencia a la CA no sale en Combate. |
| Combatiente con dos armas | Parcial (solo +1) | La app solo ofrece el ataque extra si llevas **dos** armas ligeras equipadas; con esta dote la segunda puede no ser ligera, y eso no lo permite. |
| Robusto | Parcial (solo +1) | Ventaja en salvaciones contra muerte y gastar un dado de golpe con acción adicional: texto. |
| Adepto elemental | Parcial (solo +1) | Guarda el tipo de daño en el nombre; ignorar resistencia y «los 1 cuentan como 2» es texto. |
| Toque feérico | Sola | Paso brumoso + un conjuro de adivinación o encantamiento, cada uno gratis 1 vez por descanso largo. Usa la aptitud mágica de la ficha (si la dote sube otra, la CD puede no cuadrar). |
| Agarrador | Parcial (solo +1) | Ventaja contra quien agarras: texto. |
| Maestro de armas pesadas | Parcial | Suma la competencia al daño de las armas pesadas. Falta el ataque extra con acción adicional tras un crítico o dejar a alguien a 0 PG. |
| Muy acorazado | Sola | Añade armaduras pesadas a las competencias (quita el aviso de la CA). |
| Maestro en armadura pesada | Parcial (solo +1) | La reducción del daño contundente/perforante/cortante en tu competencia no se aplica al recibir daño. |
| Líder inspirador | Parcial (solo +1) | Los PG temporales (nivel + modificador) tras un descanso no se ofrecen. |
| Mente aguda | Sola | Competencia o pericia en la habilidad elegida. Estudiar como acción adicional: texto. |
| Ligeramente acorazado | Sola | Armaduras ligeras y escudos a las competencias. |
| Asesino de magos | Sola | Contador «Mente protegida» (1 por descanso corto). La desventaja del enemigo es cosa de la mesa. |
| Entrenamiento con armas marciales | Sola | Añade «marciales»: los ataques pasan a sumar la competencia. |
| Maestro en armadura intermedia | Sola | DES hasta +3 en armadura intermedia con DES 16+. |
| Moderadamente acorazado | Sola | Intermedias y escudos a las competencias. |
| Combatiente montado | Parcial (solo +1) | Texto. |
| Observador | Sola | Competencia o pericia en la habilidad elegida. |
| Perforador | Parcial (solo +1) | Repetir un dado / dado extra en crítico: texto. |
| Envenenador | Parcial | Escribe «útiles de envenenador», que **no coincide** con «Kit de envenenador» del inventario: sale sin competencia. Dosis, CD y 2d8 de veneno: texto. |
| Maestro de armas de asta | Parcial (solo +1) | El ataque con el otro extremo (1d4, acción adicional) y el ataque de reacción no salen en Combate. |
| Resiliente | Sola | Competencia en la salvación de la característica elegida. |
| Lanzador de rituales | Parcial | Pide tantos rituales de nivel 1 como tu competencia y crea el contador «Ritual rápido». Cuando sube la competencia no pide el ritual nuevo; el contador no está enlazado a los conjuros. |
| Centinela | Parcial (solo +1) | Ataque de oportunidad extra y velocidad 0: texto. |
| Toque sombrío | Sola | Invisibilidad + un conjuro de ilusión o nigromancia, gratis 1 vez por descanso largo cada uno. |
| Tirador de primera | Parcial (solo +1) | Ignorar cobertura y desventajas: texto. |
| Maestro del escudo | Parcial (solo +1) | Golpe con el escudo (salvación de FUE) y reacción contra DES: texto; no calcula la CD. |
| Experto en habilidades | Sola | Competencia en una y pericia en otra. |
| Acechador | Parcial (solo +1) | Vista ciega 10 pies y ventaja en Sigilo: texto. |
| Cortador | Parcial (solo +1) | Texto. |
| Veloz | Sola | +10 pies de velocidad. El resto es situacional. |
| Francotirador de conjuros | Parcial (solo +1) | +60 pies de alcance a conjuros de ataque: no cambia el alcance mostrado. |
| Telequinético | Parcial | Aprende Mano de mago. El empujón con acción adicional (salvación de FUE) no sale en Combate ni calcula la CD. |
| Telepático | Sola | Detectar pensamientos gratis 1 vez por descanso largo. |
| Lanzador de guerra | Parcial (solo +1) | La **ventaja en concentración** no se avisa al pedir la salvación de CON tras recibir daño. |
| Maestro de armas | Parcial | Sube +1 y apunta el arma escrita a mano, pero **no activa la maestría** de esa arma (la app solo la da a bárbaro, guerrero, paladín, explorador y pícaro). |

### 2.3 Estilos de combate

| Dote | Estado | Qué hace / qué falta |
|---|---|---|
| Tiro con arco | Sola | +2 al ataque con armas a distancia. |
| Combate a ciegas | Solo texto | Vista ciega 10 pies. |
| Defensa | Sola | +1 a la CA con armadura puesta. |
| Duelo | Parcial | Solo pone la nota «+2 al daño si es tu única arma»; no lo suma. |
| Combate con armas grandes | Sola | Nota en el ataque («los 1 y 2 cuentan como 3»): es una regla de los dados, no hay nada que sumar. |
| Intercepción | Solo texto | Podría ser una reacción en Combate (1d10 + competencia). |
| Protección | Solo texto | Podría ser una reacción en Combate. |
| Combate con armas arrojadizas | Parcial | Solo la nota «+2 al daño si la lanzas». |
| Combate con dos armas | Sola | El ataque extra con arma ligera suma el modificador. |
| Combate sin armas | Solo texto | No hay ataque desarmado que calcular (1d6/1d8 + FUE). |

### 2.4 Dones épicos (nivel 19+)

Todos suben +1 (tope 30).

| Dote | Estado | Qué hace / qué falta |
|---|---|---|
| Don de destreza en combate | Parcial (solo +1) | Texto. |
| Don del viaje dimensional | Parcial (solo +1) | Texto. |
| Don de resistencia a la energía | Parcial (solo +1) | Las 2 resistencias no se guardan ni se aplican. |
| Don del destino | Parcial | Contador que vuelve en descanso corto; también debería volver **al tirar iniciativa**. |
| Don de fortaleza | Sola | +40 PG máximos. «+CON al curarte» es texto. |
| Don de ofensiva irresistible | Parcial (solo +1) | Texto. |
| Don de recuperación | Parcial | Crea «Último aliento» y «Recuperar vitalidad (d10)», pero la reserva de 10d10 sale como 10 usos sueltos (se pierde `pool`, ver Fallos n.º 6) y no cura sola; «Último aliento» no salta al caer a 0 PG. |
| Don de habilidad | Sola | Competencia en todo y una pericia. |
| Don de velocidad | Sola | +30 pies. |
| Don de recuerdo de conjuros | Parcial | Contador 1 por descanso largo, pero al lanzar el conjuro la app gasta el espacio igualmente (hay que devolverlo a mano). |
| Don del espíritu nocturno | Parcial (solo +1) | Texto. |
| Don de visión verdadera | Parcial (solo +1) | Texto. |

### 2.5 Invocaciones sobrenaturales

Comunes a todas: el catálogo comprueba nivel, requisitos y trucos necesarios, cuenta las que caben por nivel y avisa si cambias más de una al subir. Las de «conjuro gratis» añaden el conjuro con la etiqueta «Invocación» y lo lanzan sin espacio.

| Invocación | Estado | Qué hace / qué falta |
|---|---|---|
| Estallido agonizante | Solo texto | Apunta el truco elegido, pero no suma CAR a su daño (la app no muestra el daño del truco al lanzarlo). |
| Armadura de sombras | Sola | Armadura de mago a voluntad; al lanzarla la CA pasa a 13 + DES (y avisa si llevas armadura). |
| Paso ascendente | Sola | Levitar a voluntad. |
| Vista del diablo | Solo texto | Ver en oscuridad mágica a 120 pies. |
| Hoja devoradora | Parcial | 3 ataques por acción de Atacar, pero con **cualquier** arma (debería ser solo el arma de pacto). |
| Mente arcana | Solo texto | La ventaja en salvaciones de concentración **no se avisa** al pedir la tirada. |
| Golpe arcano | Solo texto | No ofrece gastar un espacio de pacto al impactar ni dice cuántos d8 tirar. |
| Lanza arcana | Solo texto | No cambia el alcance del truco. |
| Vigor infernal | Sola | Falsa vida a voluntad con el máximo de PG temporales, sin tirar. |
| Mirada de dos mentes | Solo texto | |
| Don de las profundidades | Sola | Respirar bajo el agua gratis 1 vez por descanso largo. La velocidad nadando es texto (la ficha no tiene ese campo). |
| Don de los protectores | Parcial | Contador 1 por descanso largo; no salta cuando alguien de la página cae a 0 PG (es de otros jugadores). |
| Inversión del maestro de la cadena | Solo texto | No cambia las estadísticas del familiar (vuelo/nado 40, CD, resistencia). |
| Lecciones de los Primeros | Parcial | Elige una dote de origen y la añade (Alerta, Afortunado y Duro funcionan). **No pide las habilidades de Hábil, los conjuros de Iniciado en la magia ni las herramientas de Artesano/Músico** (`js/features/invocations.js:219-232` no usa `featApply`). |
| Bebedor de vida | Solo texto | Ni el 1d6 extra ni gastar un dado de golpe para curarse. |
| Máscara de los mil rostros | Sola | Disfrazarse a voluntad. |
| Maestro de las mil formas | Sola | Alterar el propio aspecto a voluntad. |
| Visiones brumosas | Sola | Imagen silenciosa a voluntad. |
| Uno con las sombras | Sola | Invisibilidad a voluntad (lo de la luz tenue lo decide la mesa). |
| Salto de otro mundo | Sola | Salto a voluntad. |
| **Pacto del Filo** | Parcial | Sale «Invocar arma de pacto» (acción adicional) en Combate. **No crea el ataque con CAR, no da competencia con el arma elegida** (si eliges un arma marcial del inventario avisa «sin competencia») **ni deja elegir daño necrótico, psíquico o radiante**. Ya en HALLAZGOS n.º 3. |
| Pacto de la cadena | Sola | Encontrar familiar gratis; el buscador de criaturas ofrece las formas especiales; botón «Crear el familiar». |
| Pacto del tomo | Solo texto | Dice que añadas los conjuros con «Buscar conjuros»; no los marca como del libro ni los quita al cambiarlo. |
| Estallido repulsor | Solo texto | |
| Hoja sedienta | Parcial | 2 ataques por acción de Atacar, pero con cualquier arma. |
| Visiones de reinos lejanos | Sola | Ojo arcano a voluntad. |
| Susurros de la tumba | Sola | Hablar con los muertos a voluntad. |
| Vista de bruja | Solo texto | Visión verdadera 30 pies. |

### 2.6 Especies

Comunes a todas (con especie del catálogo): tamaño, velocidad, visión en la oscuridad (como rasgo), rasgos como texto, conjuros de especie por nivel (también al subir) y recursos con usos.

| Especie | Estado | Qué hace / qué falta |
|---|---|---|
| Aasimar | Parcial | Luz, visión 60, contadores de Manos sanadoras y Revelación celestial (nivel 3). Resistencia necrótica y radiante: texto. Manos sanadoras no pide los d4 (tantos como tu competencia) ni cura; Revelación no crea el efecto de 1 minuto. |
| Dracónido | Parcial | Arma de aliento con usos = competencia y «sustituye un ataque»; Vuelo dracónico a nivel 5. El botón **no dice la CD (8 + CON + competencia) ni el daño por nivel** (1d10 → 4d10). |
| Enano | Parcial | +1 PG por nivel, visión 120, Afinidad con la piedra con usos. Resistencia al veneno y ventaja contra envenenado: texto. |
| Elfo | Sola | Visión 60, habilidad extra de Sentidos agudos (no obliga a que sea Perspicacia, Percepción o Supervivencia). Ascendencia feérica y Trance: texto. |
| Gnomo | Parcial | Visión 60. La ventaja en salvaciones de INT, SAB y CAR (siempre) no se ve en las salvaciones. |
| Goliat | Parcial | Velocidad 35 y Forma grande a nivel 5 con usos, pero no crea el efecto (+10 pies, ventaja en FUE). Complexión poderosa: texto. |
| Mediano | Solo texto | Solo velocidad y tamaño. Valiente, Agilidad, Suerte y Sigiloso: texto. |
| Humano | Sola | Inspiración heroica al crear y en cada descanso largo, habilidad extra y dote de origen extra (con el fallo de Iniciado en la magia). |
| Orco | Parcial | Contadores de Subidón de adrenalina y Aguante incansable. El Subidón no da los PG temporales (competencia) y el Aguante no salta solo al caer a 0 PG. |
| Tiefling | Sola | Taumaturgia y visión 60. |

El tamaño «M o P» (aasimar, humano, tiefling) se guarda tal cual en la ficha, sin elegir.

### 2.7 Linajes, legados y ascendencias

| Linaje | Estado | Qué hace / qué falta |
|---|---|---|
| Dracónido · 10 ascendencias (negro, azul, latón, bronce, cobre, oro, verde, rojo, plata, blanco) | Solo texto (las 10) | La resistencia y el tipo de daño del aliento solo están en el texto. |
| Elfo drow | Sola | Visión 120, Luces danzantes, Fuego feérico (3) y Oscuridad (5) gratis 1 vez por descanso largo. |
| Alto elfo | Sola | Prestidigitación, Detectar magia (3) y Paso brumoso (5) con uso gratis. Cambiar el truco en un descanso largo: a mano. |
| Elfo silvano | Sola | Velocidad 35, Druidismo, Zancada prodigiosa (3), Pasar sin dejar rastro (5). |
| Gnomo de los bosques | Sola | Ilusión menor y Hablar con los animales gratis (competencia por descanso largo). |
| Gnomo de las rocas | Sola | Reparar y Prestidigitación. Los aparatos de relojería: texto. |
| Goliat · nube, fuego, escarcha, colina, piedra, tormenta | Sola (las 6) | Contador con usos = competencia y botón en su columna (acción adicional, reacción o sin gastar acción). El dado lo tiras tú; Aguante de piedra no resta el daño solo. |
| **Tiefling ctónico** (Zyo) | Parcial | Toque gélido, Falsa vida (3) y Rayo debilitador (5) con uso gratis; Falsa vida pide los 2d4 y suma el resto. **Resistencia necrótica: texto.** Deja la aptitud en la de la ficha (CAR en el brujo). |
| Tiefling abisal | Parcial | Rociada venenosa, Rayo nauseabundo, Inmovilizar persona. Resistencia al veneno: texto. |
| Tiefling infernal | Parcial | Descarga de fuego, Represión infernal, Oscuridad. Resistencia al fuego: texto. |

### 2.8 Trasfondos

Comunes a los 16 del manual: aumentos (+2/+1 o +1 a las tres, con tope 20), 2 habilidades marcadas, herramienta (como texto en Competencias), dote de origen y equipo (o 50 po).

| Trasfondo | Estado | Qué falta |
|---|---|---|
| Acólito | Parcial | «Útiles de caligrafía» no coincide con «Suministros de calígrafo»: el inventario dice «sin competencia». Iniciado en la magia (clérigo) sin conjuros. |
| Artesano | Parcial | «Herramientas de artesano (una)» no deja elegir cuál; Artesano (dote) es texto. |
| Charlatán | Parcial | «Útiles de falsificación» no coincide con «Kit de falsificación». |
| Criminal | Sola | |
| Artista | Sola | |
| Granjero | Sola | |
| Guardia | Sola | |
| Guía | Parcial | Iniciado en la magia (druida) sin conjuros. |
| Ermitaño | Sola | (La dote Sanador es solo texto.) |
| Mercader | Sola | |
| Noble | Sola | |
| Sabio | Parcial | Caligrafía no reconocida + Iniciado en la magia (mago) sin conjuros. |
| Marinero | Sola | (Camorrista es solo texto.) |
| Escriba | Parcial | Caligrafía no reconocida. |
| Soldado | Sola | (Atacante salvaje es solo texto.) |
| Vagabundo | Sola | |
| **Otro (lo completo a mano)** | Solo texto | Solo el nombre. Los aumentos hay que meterlos ya en las puntuaciones; no pide las 2 habilidades, la herramienta ni la dote de origen (ni del catálogo ni casera). Después: «Dotes» para una del catálogo, «Editar ficha» para el resto. |

### 2.9 Armas

Las 38 armas son **Sola**: al equiparlas sale el ataque con su bonificador (competencia según «Sencillas»/«Marciales»/nombre, FUE o DES según sutil o a distancia, bonificador mágico +1 a +3), el daño (con el versátil a dos manos), el tipo, las propiedades como nota y, si tienen munición, la enlazan y la descuentan al disparar. Se calculan de nuevo al cambiar características o dotes.

| Grupo | Armas | Notas |
|---|---|---|
| Sencillas cuerpo a cuerpo | Garrote, Daga, Gran garrote, Hacha de mano, Jabalina, Martillo ligero, Maza, Bastón, Hoz, Lanza | Arrojadizas: usan el mismo modificador que en cuerpo a cuerpo (correcto), pero lanzarlas no las descuenta. |
| Sencillas a distancia | Dardo, Ballesta ligera, Arco corto, Honda | Dardo: sutil, usa la mejor entre FUE y DES. |
| Marciales cuerpo a cuerpo | Hacha de batalla, Mayal, Guja, Gran hacha, Espadón, Alabarda, Lanza de caballería, Espada larga, Mazo, Lucero del alba, Pica, Estoque, Cimitarra, Espada corta, Tridente, Martillo de guerra, Pico de guerra, Látigo | Lanza de caballería: ver Fallos n.º 8. |
| Marciales a distancia | Cerbatana, Ballesta de mano, Ballesta pesada, Arco largo, Mosquete, Pistola | Cerbatana: daño fijo 1 + modificador (mínimo 1). |

### 2.10 Propiedades de arma

| Propiedad | Estado | Qué hace / qué falta |
|---|---|---|
| Sutil | Sola | Usa la mejor entre FUE y DES (ataque y daño). |
| Versátil | Sola | Enseña los dos daños (una y dos manos). |
| Munición | Sola | Enlaza la munición, la descuenta al atacar (o con «Disparar»), bloquea el ataque sin munición y deja «Recuperar 1». Lo recuperado tras el combate lo suma el jugador (norma del máster). |
| Ligera | Parcial | Con dos armas ligeras equipadas ofrece el ataque extra con acción adicional y quita el modificador al daño (salvo Combate con dos armas). No comprueba que hayas atacado con un arma ligera en la acción de Atacar; Mellar no lo pasa a la acción. |
| Arrojadiza | Parcial | Enseña el alcance y usa el modificador correcto. No resta el arma lanzada del equipo; el +2 de Combate con armas arrojadizas es solo nota. |
| Pesada | Parcial | Maestro de armas pesadas suma la competencia. **Falta la desventaja si es cuerpo a cuerpo y FUE < 13, o a distancia y DES < 13** (regla de 2024). |
| A dos manos | Solo texto | Solo nota (y quita la nota de Duelo). No avisa si llevas escudo y un arma a dos manos a la vez. |
| Recarga | Solo texto | No limita a un disparo por acción con Ataque extra. |
| Alcance | Solo texto | Solo nota. |

### 2.11 Maestrías

La app marca la maestría en todas las armas de bárbaro, guerrero, paladín, explorador y pícaro, y al atacar enseña su texto. No limita al número de «Maestrías con armas» de la clase, no deja elegir qué armas, y la dote Maestro de armas no la activa.

| Maestría | Estado | Qué hace / qué falta |
|---|---|---|
| Empujar | Sola | Aviso al atacar (el movimiento es de la mesa). |
| Debilitar | Sola | Aviso al atacar. |
| Ralentizar | Sola | Aviso al atacar. |
| Hendir | Parcial | No ofrece el segundo ataque (sin modificador al daño) una vez por turno. |
| Rozar | Parcial | No dice el número: al fallar, el daño es tu modificador (la app lo sabe). |
| Mellar | Parcial | No pasa el ataque extra ligero a la acción de Atacar: sigue gastando la acción adicional. |
| Derribar | Parcial | No calcula la CD (8 + modificador del ataque + competencia). |
| Molestar | Parcial | No recuerda la ventaja en tu siguiente ataque contra esa criatura. |

### 2.12 Armaduras y escudo

Las 13 son **Sola**: CA con DES completa (ligeras), hasta +2 (intermedias, +3 con Maestro en armadura intermedia) o sin DES (pesadas), escudo +2, bonificador mágico, estilo Defensa, aviso de competencia, de FUE mínima (y −10 pies de velocidad) y de desventaja en Sigilo. Sin armadura elige la mejor CA entre 10 + DES, Defensa sin armadura (bárbaro, monje), Resistencia dracónica y Armadura de mago.

| Armadura | Tipo | Nota |
|---|---|---|
| Acolchada, Cuero, Cuero tachonado | Ligera | Acolchada: aviso de Sigilo. |
| Pieles, Camisote de mallas, Cota de escamas, Coraza, Semiplacas | Intermedia | Escamas y semiplacas: aviso de Sigilo. |
| Cota de anillas, Cota de mallas, Bandas, Placas | Pesada | FUE 13/15 y aviso de Sigilo. |
| Escudo | Escudo | +2. |

Sin competencia, la app avisa, pero no aplica la desventaja ni impide lanzar conjuros. La desventaja en Sigilo solo sale en el desglose de la CA, no junto a la habilidad.

### 2.13 Objetos mágicos y sintonización

| Objeto | Estado | Qué hace / qué falta |
|---|---|---|
| Anillo de protección | Sola | +1 CA y salvaciones solo si está sintonizado. |
| Capa de protección | Sola | Igual. |
| Brazales de defensa | Sola | +2 CA sin armadura ni escudo. |
| Varita de proyectiles mágicos | Parcial | 7 cargas, botón en Combate (gasta la acción) y recarga al amanecer (pide el 1d6 + 1). No lanza el conjuro ni dice el daño, no deja gastar varias cargas para subir el nivel, ni recuerda el 1d20 al gastar la última. |
| Varita de telarañas | Parcial | Igual (CD 15 en el texto). |
| Otro objeto mágico | Sola | Plantilla: +CA, +salvaciones, «sin armadura», cargas y recarga, sintonización. |
| Sintonización | Sola | Máximo 3 objetos; solo funcionan sintonizados. |
| Armas y armaduras +1/+2/+3 | Sola | Se suman al ataque, al daño y a la CA. |

### 2.14 Otros objetos

| Objeto | Estado | Qué hace / qué falta |
|---|---|---|
| Pociones de curación (4) | Sola | Acción adicional; pide el resultado del dado, lo valida y cura. También «Dar» a otro. |
| Poción de heroísmo | Parcial | 10 PG temporales y efecto de 1 hora; el 1d4 de Bendecir no aparece en ataques ni salvaciones. |
| Poción de invisibilidad | Parcial | Crea el efecto «Invisible» de 1 hora, pero no el estado: la nota de ventaja/desventaja de Combate no sale y no termina al atacar. |
| Poción de velocidad | Parcial | Efecto de 1 minuto; no suma +2 a la CA ni dobla la velocidad. |
| Vuelo, Trepar, Respirar bajo el agua, Forma gaseosa | Sola | Efecto con su duración. |
| Poción de resistencia | Sola | Efecto con el tipo elegido; al recibir daño se usa el botón «Resistencia (½)». |
| Fuerza de gigante | Parcial | Efecto de 1 hora; la FUE no cambia (ni los ataques). |
| Aliento de fuego | Parcial | Efecto de 1 hora; no cuenta las 3 exhalaciones. |
| Otra poción | Solo texto | |
| Kit de sanador | Parcial | Gasta un uso para estabilizar. No se integra con la dote Sanador. |
| Antitoxina, Antorchas | Sola | Efecto de 1 hora. |
| Ácido, Fuego de alquimista, Agua bendita | Sola | Sustituyen un ataque y calculan la CD (8 + DES + competencia). El «arder» del fuego es texto. |
| Abrojos, Bolas de rodamiento, Kit de escalada | Sola | Botón que gasta la acción (y la unidad) con su texto. |
| Raciones | Sola | El descanso largo ofrece gastar una y cuenta los días sin comer. |
| Odre | Solo texto | |
| Herramientas (25) | Sola | Bonificador con o sin competencia, usos con su CD y qué se fabrica. |

## 3. Candidatas a automatizar

Ordenadas por lo que más se notaría en partida (primero lo que afecta a Zyo).

1. **Arma de pacto con CAR** (Pacto del Filo): al invocarla, elegir el arma (o vincular una del inventario) y crear el ataque con CAR, competencia y tipo de daño a elegir. Se puede reutilizar `csWeaponAtk` con «la mejor entre aptitud mágica, FUE o DES». Ya en HALLAZGOS n.º 3.
2. **Resistencias de especie y linaje** (tiefling, enano, aasimar, dracónido; también Furia, poción y Don de resistencia): guardarlas en la ficha y, en «Daño recibido», preguntar el tipo de daño o mostrar «Tienes resistencia a necrótico» junto al botón ½.
3. **Ventaja en concentración** (Mente arcana, Lanzador de guerra): añadir «tiras con ventaja» al aviso de la salvación de CON tras recibir daño. Cambio de una línea en `js/actions/play.js:254`.
4. **Dotes de origen con elecciones al crear** (Iniciado en la magia de Acólito/Guía/Sabio y del humano, Hábil/Iniciado/Artesano/Músico desde Lecciones de los Primeros): pasar por `featApply` y pedir conjuros, habilidades o herramientas. Ya en HALLAZGOS n.º 2 para el trasfondo; Lecciones es nuevo.
5. **Trasfondo propio completo**: con «Otro», pedir 3 características (+2/+1 o +1/+1/+1), 2 habilidades, la herramienta y la dote de origen (catálogo o casera). Ya en HALLAZGOS n.º 4.
6. **Golpe arcano y Bebedor de vida** (brujo de pacto del filo, nivel 5 y 9): botón tras atacar con el arma de pacto que gaste el espacio y diga «tira (1 + nivel)d8 de fuerza», y el 1d6 extra con curación por dado de golpe.
7. **Maestrías con números**: en el aviso del ataque, Rozar con el daño exacto y Derribar con su CD; Mellar que no gaste la acción adicional; limitar a las «Maestrías con armas» de la clase y que Maestro de armas active la suya.
8. **Rasgos de especie con números**: Arma de aliento con CD y daño por nivel; Manos sanadoras pidiendo los d4 y curando; Subidón de adrenalina dando los PG temporales; Aguante incansable (y Último aliento) ofrecido al caer a 0 PG.
9. **Dote personalizada con usos «= competencia»**: en «Editar ficha», poder poner los usos como «bonificador de competencia» (o «modificador de…») para que suban solos de nivel, como las dotes del catálogo. Útil para «Dote Superviviente».
10. **Propiedad Pesada**: avisar de la desventaja con FUE < 13 (cuerpo a cuerpo) o DES < 13 (a distancia).
11. **Reacciones de dotes en Combate**: Duelista defensivo (+competencia a la CA), Intercepción, Protección, Maestro en armadura pesada (restar daño en «Daño recibido»).
12. **Duelo y armas arrojadizas**: sumar el +2 al daño (Duelo cuando es la única arma equipada) en vez de dejarlo como nota.

## 4. Fallos o reglas mal aplicadas vistos de paso

1. **Competencia con herramientas no reconocida** por nombres distintos: Acólito, Sabio y Escriba dan «Útiles de caligrafía» (`data/origins.js:58,69,71`) y Charlatán «Útiles de falsificación» (`data/origins.js:60`), pero el inventario los llama «Suministros de calígrafo» y «Kit de falsificación» (`data/items.js:92,108`). Lo mismo con Envenenador: «útiles de envenenador» (`data/feats.js:86`) frente a «Kit de envenenador» (`data/items.js:113`). `toolProf` (`js/views/inventory.js:25`) busca el nombre exacto, así que el mago (Sabio) y el paladín (Acólito) del reparto ven sus útiles de calígrafo «sin competencia». Comprobado en `tests/fichas/mago.json` y `paladin.json`.
2. **Lecciones de los Primeros no aplica las elecciones de la dote** (`js/features/invocations.js:219-232`): solo añade la clave, el rasgo, los usos y los PG de Duro. Con Hábil no da las 3 habilidades, con Iniciado en la magia no da conjuros y con Artesano o Músico no da herramientas.
3. **Hoja sedienta y Hoja devoradora valen con cualquier arma** (`js/views/turn.js:113-115`): suben los ataques de toda la acción de Atacar; la regla dice «solo con tu arma de pacto».
4. **Maestría en todas las armas** (`js/views/inventory.js:121`, `js/features/shop.js:136`): cualquier arma que se equipe una clase con maestría la tiene activa, sin respetar el número de «Maestrías con armas» (2 o 3 a nivel 1 según la clase).
5. **Maestro de armas no activa la maestría**: la app solo la da por clase (`MASTERY_CLS`, `js/views/inventory.js:187`); la dote solo guarda el nombre del arma.
6. **La reserva de Don de recuperación pierde `pool`**: `originRes` pone siempre `pool: false` (`js/core/rules.js:44`), así que los 10d10 se gastan de uno en uno en vez de preguntar cuántos.
7. **Ataque extra de arma ligera** (`js/views/turn.js:276-290`, `js/actions/combat.js` «t-light»): se puede usar sin haber atacado con un arma ligera en la acción de Atacar.
8. **Lanza de caballería**: su propiedad es «a dos manos (salvo montado)» y el código busca exactamente «a dos manos» (`js/views/inventory.js:223,226`), así que muestra la nota de Duelo y no la de Combate con armas grandes. Menor.
9. **Sentidos agudos del elfo** no obliga a elegir Perspicacia, Percepción o Supervivencia: el paso de habilidades solo cuenta cuántas llevas. Menor.
10. **Tamaño «M o P»** se guarda literalmente (`js/features/wizard.js:786`) en aasimar, humano y tiefling, sin dejar elegir. Menor.
11. **Dotes con conjuros usan una sola aptitud mágica**: Toque feérico, Toque sombrío o Iniciado en la magia dicen «la característica que sube la dote» (o INT/SAB/CAR a elegir), pero la app usa la de la ficha; `featApply` solo la cambia si no había ninguna (`js/features/feats.js:311-312`). Afecta a CD y ataque si la clase lanza con otra característica.
12. **Poción de invisibilidad** crea un efecto llamado «Invisible» pero no el estado, así que Combate no muestra la nota de ventaja/desventaja de estar invisible.
