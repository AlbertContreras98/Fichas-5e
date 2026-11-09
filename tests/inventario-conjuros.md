# Inventario de conjuros (prueba 1a)

Qué hace la app con cada uno de los 339 conjuros de `data/spells.js` (SRD 5.2, reglas de 2024). Sale del guion `tests/inventario-conjuros.js` (clasifica solo leyendo los datos y el código) y de una revisión a mano de todos los trucos, todos los de nivel 1 y los de nivel 2 a 9 que lo necesitaban. Fecha: 9-11-2026.

## Cómo se ha clasificado

Hay una parte que la app hace **con todos los conjuros por igual** (lo llamo «lo común»):

- Gasta el espacio de conjuro (deja elegir uno de nivel superior o el de pacto) o, si es ritual, deja lanzarlo como ritual sin espacio. Los trucos no gastan nada.
- En combate, gasta la acción, la acción adicional o la reacción según el tiempo de lanzamiento. Los de 1 minuto o más no salen en combate.
- Si es de concentración, la marca y quita la anterior; al recibir daño pide la salvación de CON con su CD; se pierde al caer a 0 PG o quedar incapacitado.
- Crea un efecto con la duración del conjuro (en rondas, minutos o «hasta que se disipe») que baja al pulsar «Terminar turno» o desaparece con los descansos.
- Muestra tu CD de salvación y tu ataque de conjuro en el aviso, y el texto del conjuro.

Con eso, cada conjuro queda así:

- **Sola**: la app hace todo lo que el conjuro pide en tu ficha. O bien aplica el efecto (CA, PG temporales, crea la criatura…), o bien el conjuro no tiene números que aplicar (detectar, comunicarse, luz, teletransporte…) y lo común basta. A estos últimos los marco como «narrativo».
- **Parcial**: la app lleva la duración o la concentración (o parte del efecto), pero queda mecánica a mano: daño extra, bonificadores, salvaciones que se repiten, estados, escalado…
- **Solo texto**: el efecto es instantáneo y toda su mecánica (daño, curación, salvación, estado) está solo en la descripción. La app solo gasta el espacio (o nada, si es truco). Aquí están casi todos los conjuros de daño y de curación.

Ojo: la app **no calcula daño ni curación de ningún conjuro del catálogo**. Ni los dados, ni el escalado por nivel de personaje (trucos), ni el escalado por nivel de espacio. Eso es lo que más pesa en «Parcial» y «Solo texto».

## 1. Resumen

| Nivel | Conjuros | Sola | Parcial | Solo texto |
|---|---|---|---|---|
| 0 (trucos) | 27 | 11 | 4 | 12 |
| 1 | 57 | 20 | 23 | 14 |
| 2 | 57 | 17 | 35 | 5 |
| 3 | 42 | 17 | 21 | 4 |
| 4 | 34 | 10 | 21 | 3 |
| 5 | 38 | 12 | 22 | 4 |
| 6 | 31 | 11 | 14 | 6 |
| 7 | 20 | 7 | 9 | 4 |
| 8 | 17 | 5 | 9 | 3 |
| 9 | 16 | 3 | 8 | 5 |
| **Total** | **339** | **113** | **166** | **60** |

De los 113 «Sola», solo **6 aplican un efecto de verdad** (Armadura de mago, Falsa vida, Encontrar familiar, Encontrar montura, Invocar dragón e Insecto gigante); los otros 107 son narrativos y les basta con lo común. Entre los trucos y los de nivel 1 (los que más se usan ahora): 31 «Sola» (3 con efecto), 27 «Parcial» y 26 «Solo texto».

## 2. Qué campos entiende la app

### Campos de cada conjuro en `data/spells.js`

No hay ningún campo de daño, curación, salvación ni efecto: todo eso está solo en el texto (`de`, `hl`).

| Campo | Qué es | Qué hace la app con él |
|---|---|---|
| `id` | identificador inglés | Enlaza el conjuro de la ficha (`ref`) con el catálogo. Es la llave de todo lo específico (tabla de abajo). |
| `n`, `en` | nombre en castellano e inglés | Se muestran y se buscan. Al importar una ficha, `matchSpell` enlaza por cualquiera de los dos. |
| `l` | nivel (0 = truco) | Decide si gasta espacio, qué espacios se ofrecen, filtros del buscador y precio del pergamino. |
| `s` | escuela | Solo se muestra en el buscador. |
| `c` | clases | Filtro del buscador y aviso al lanzar un pergamino que no es de tu lista. |
| `t` | tiempo de lanzamiento (`A`, `AA`, `R` o «1 minuto»…) | En combate gasta la acción, la adicional o la reacción. Los demás no salen en el turno. |
| `r` | alcance | Solo se muestra (y el requisito de alcance de Lanza arcana). |
| `d` | duración | `parseDur` la convierte en un efecto: «1 minuto» = 10 rondas, «hasta 1 hora» = 60 min, «Hasta que se disipe» = indefinido. «Instantánea» y «Especial» no crean efecto. Entiende las 21 duraciones distintas del archivo. |
| `k` | concentración | Marca la concentración, quita la anterior y pide la salvación al recibir daño. |
| `ri` | ritual | Ofrece «Como ritual» (sin espacio). |
| `v` | componentes V, S, M | **No se usa.** Solo se ve el material (`m`); las letras V y S no salen en ningún sitio. |
| `m` | material | Se muestra. En 31 conjuros, si dice «que el conjuro consume», busca el objeto en el inventario y lo descuenta (tabla `SP_CONSUME`, `js/core/rules.js`). |
| `de` | descripción | Se muestra. Solo se lee por dentro para una cosa: saber si un truco de brujo «hace daño» o «hace ataque de conjuro» (requisitos de algunas invocaciones). |
| `hl` | mejora a niveles superiores (109 conjuros) | Solo se muestra. Nunca se aplica, ni al daño ni a la duración. |

### Lo que el código hace con conjuros concretos

| Conjuro | Qué hace | Dónde |
|---|---|---|
| Armadura de mago | CA = 13 + DES mientras dure el efecto; avisa si llevas armadura. | `js/actions/play.js:42`, `js/views/inventory.js:396` |
| Falsa vida | Pide los 2d4, suma 4 (+5 por nivel de espacio) y da PG temporales sin acumular; con Vigor infernal, el máximo. | `js/views/play.js:317` |
| Encontrar familiar | Botón «Crear el familiar» (si no tienes uno). | `js/views/play.js:355` |
| Encontrar montura | Botón «Crear la montura», con estadísticas según el nivel del espacio. | `js/views/play.js:353` |
| Invocar dragón, Insecto gigante | Botón «Crear la criatura», con CA, PG y ataques según el nivel; desaparece al perder la concentración. | `js/views/play.js:351`, `data/creatures.js` |
| Polimorfar, Polimorfar verdadero, Cambiar de forma | Botón «Elegir forma» entre tus formas guardadas: te transforma y da sus PG como temporales. | `js/views/play.js:359`, `js/features/creatures.js:386` |
| Marca del cazador, Castigo divino | Usos gratis de los rasgos del explorador y del paladín. | `js/core/rules.js:73` |
| 31 conjuros con material que se consume | Lo descuentan del inventario o avisan si no lo tienes. | `js/core/rules.js:119` |

Además, en la ficha cada conjuro guarda `src` (de dónde viene: especie, dote, siempre preparado…), `free`/`atwill` (lanzamiento gratis ligado a un rasgo con usos) y, solo en los **conjuros propios**, `hd` (gasta dados de golpe) y `wpn` (crea un arma en tus ataques mientras dura). Ese mecanismo de `wpn` es justo el que les falta a los conjuros del catálogo que crean un arma (Arma espiritual, Hoja de fuego, Crear llama, Garrote).

## 3. Conjuro por conjuro


### Trucos

| Conjuro | Estado | Qué hace / qué falta |
|---|---|---|
| Agarre electrizante | Solo texto | Falta: el ataque (ataque de conjuro, 1d8 de relámpago que sube a 2d8/3d8/4d8 a niveles 5/11/17) y que el objetivo no puede hacer ataques de oportunidad. |
| Burla cruel | Solo texto | Falta: salvación de SAB, 1d6 psíquico con su escalado y la desventaja del objetivo. |
| Crear llama | Parcial | Lleva la llama 10 min y gasta la acción adicional. Falta: el ataque de la llama (1d8 de fuego con escalado) en tu lista de ataques mientras dura. |
| Descarga de fuego | Solo texto | Falta: el ataque (1d10 de fuego con escalado por nivel). |
| Druidismo | Sola | Narrativo: no hay números que aplicar. |
| Elementalismo | Sola | Narrativo: no hay números que aplicar. |
| Estallido arcano | Solo texto | Falta: el ataque (1d10 de fuerza), el número de rayos según el nivel (2 a nivel 5, 3 a nivel 11, 4 a nivel 17) y sumar CAR con Estallido agonizante. |
| Estallido hechicero | Solo texto | Falta: el ataque (1d8 del tipo elegido, d8 que explotan hasta tu modificador) con escalado. |
| Fuego fatuo estelar | Solo texto | Falta: el ataque (1d8 radiante con escalado) y que el objetivo no puede ser invisible. |
| Garrote | Parcial | Lleva el minuto y gasta la acción adicional. Falta: cambiar el ataque del garrote o bastón (aptitud mágica en vez de FUE, dado d8 → d10/d12/2d6 por nivel, daño de fuerza opcional). |
| Golpe certero | Solo texto | Falta: el ataque con tu arma usando la aptitud mágica y el daño radiante extra (1d6/2d6/3d6 a niveles 5/11/17). |
| Ilusión menor | Sola | Narrativo: lleva el minuto; la CD se ve en el aviso. |
| Llama sagrada | Solo texto | Falta: salvación de DES (sin cobertura) y 1d8 radiante con escalado. |
| Luces danzantes | Sola | Narrativo: lleva la concentración (1 min). |
| Luz | Sola | Narrativo: lleva la hora. |
| Mano de mago | Sola | Narrativo: lleva el minuto. |
| Mensaje | Sola | Narrativo. |
| Orientación | Parcial | Lleva la concentración (1 min). Falta: recordar +1d4 a la prueba de la habilidad elegida. |
| Piedad con los moribundos | Sola | Estabiliza a otro: no hay números en tu ficha. (No muestra el alcance que sube con el nivel: 30/60/120 pies.) |
| Prestidigitación | Sola | Narrativo. (Crea siempre un efecto de 1 h aunque elijas una opción instantánea.) |
| Rayo de escarcha | Solo texto | Falta: el ataque (1d8 de frío con escalado) y la velocidad −10 pies del objetivo. |
| Reparar | Sola | Narrativo (tiempo de lanzamiento de 1 min: no aparece en combate, bien). |
| Resistencia | Parcial | Lleva la concentración (1 min). Falta: restar 1d4 al daño de ese tipo cuando lo recibes (el botón de daño no lo recuerda). |
| Rociada venenosa | Solo texto | Falta: el ataque (1d12 de veneno con escalado). |
| Salpicadura ácida | Solo texto | Falta: salvación de DES y 1d6 de ácido con escalado. |
| Taumaturgia | Sola | Narrativo (la ventaja en Intimidación de «Voz atronadora» queda en el texto). |
| Toque gélido | Solo texto | Falta: el ataque (1d10 necrótico con escalado) y que el objetivo no puede curarse. |

### Nivel 1

| Conjuro | Estado | Qué hace / qué falta |
|---|---|---|
| Alarma | Sola | Narrativo: ritual y 8 h. |
| Amistad con los animales | Parcial | Lleva las 24 h. El estado hechizado de la bestia y la salvación quedan en el texto; +1 bestia por nivel de espacio. |
| Armadura de mago | Sola | CA 13 + DES mientras dure (8 h); avisa si llevas armadura; con Armadura de sombras se lanza gratis. (Si lo lanzas sobre otra criatura, la app también sube tu CA.) |
| Bayas nutritivas | Parcial | Lleva las 24 h. Falta: las 10 bayas como objeto consumible (1 PG cada una con acción adicional y comida del día) que desaparezcan al acabar. |
| Bendición | Parcial | Lleva la concentración (1 min). Falta: recordar +1d4 a ataques y salvaciones; +1 objetivo por nivel de espacio. |
| Caída de pluma | Sola | Narrativo: reacción, 1 min. |
| Castigo abrasador | Parcial | Lleva el minuto y gasta la acción adicional. Falta: 1d6 de fuego extra al impactar, 1d6 al principio de cada turno del objetivo y su salvación de CON para apagarlo; +1d6 por nivel. |
| Castigo divino | Solo texto | Gasta la acción adicional y el uso gratis de Castigo del paladín. Falta: el daño (2d8 radiante, +1d8 contra infernales y muertos vivientes, +1d8 por nivel de espacio). |
| Comprensión idiomática | Sola | Narrativo: ritual, 1 h. |
| Crear o destruir agua | Sola | Narrativo. |
| Cuchillo de hielo | Solo texto | Falta: el ataque (1d10 perforante) y la salvación de DES en área (2d6 de frío, +1d6 por nivel). |
| Curar heridas | Solo texto | Falta: la curación (2d8 + aptitud, +2d8 por nivel). No ofrece sumarla a tus PG ni a los de tu criatura. |
| Detectar el bien y el mal | Sola | Narrativo: concentración, 10 min. |
| Detectar magia | Sola | Narrativo: concentración, 10 min, ritual. |
| Detectar venenos y enfermedades | Sola | Narrativo: concentración, 10 min, ritual. |
| Disco flotante | Sola | Narrativo: ritual, 1 h. |
| Disfrazarse | Sola | Narrativo: 1 h (la CD de Investigación se ve en el aviso). |
| Dormir | Parcial | Lleva la concentración (1 min). Falta: recordar que el objetivo repite la salvación al final de su siguiente turno (de incapacitado pasa a inconsciente). |
| Encontrar familiar | Sola | Botón «Crear el familiar», gasta el incienso y se puede lanzar como ritual. |
| Enmarañar | Parcial | Lleva la concentración (1 min). El estado apresado, la salvación de FUE y la prueba de Atletismo para soltarse quedan en el texto. |
| Escritura ilusoria | Sola | Narrativo: ritual, 10 días, gasta la tinta. |
| Escudo | Parcial | Gasta la reacción y crea un efecto de 1 ronda. Falta: +5 a la CA (no se suma) y que dure hasta el principio de tu siguiente turno (la app lo quita al final de tu siguiente turno). |
| Escudo de la fe | Parcial | Lleva la concentración (10 min). Falta: +2 a la CA si te lo lanzas a ti. |
| Falsa vida | Sola | Pide la tirada de 2d4, suma 4 (+5 por nivel de espacio) y aplica los PG temporales sin acumular; con Vigor infernal da el máximo sin tirar. |
| Favor divino | Parcial | Lleva el minuto. Falta: +1d4 radiante en tus ataques con armas mientras dura. |
| Fuego feérico | Parcial | Lleva la concentración (1 min). La salvación de DES y la ventaja contra los perfilados quedan en el texto. |
| Golpe atrapador | Parcial | Lleva la concentración (1 min). Falta: salvación de FUE, estado apresado y 1d6 perforante al principio de cada turno del objetivo (+1d6 por nivel). |
| Grasa | Parcial | Lleva el minuto. La salvación de DES al entrar o acabar el turno en la grasa y el derribo quedan en el texto. |
| Hablar con los animales | Sola | Narrativo: ritual, 10 min. |
| Hechizar persona | Parcial | Lleva la hora. El estado hechizado (salvación con ventaja si lucháis) queda en el texto; +1 objetivo por nivel. |
| Heroísmo | Parcial | Lleva la concentración (1 min). Falta: PG temporales iguales a tu aptitud al principio de cada turno del objetivo e inmunidad a asustado. |
| Identificar | Sola | Narrativo: ritual. |
| Imagen silenciosa | Sola | Narrativo: concentración, 10 min. |
| Infligir heridas | Solo texto | Falta: salvación de CON y 2d10 necrótico (+1d10 por nivel). |
| Maleficio | Parcial | Lleva la concentración y gasta la acción adicional. Falta: 1d6 necrótico extra en tus impactos, pasar la maldición a otro con acción adicional y la duración larga con espacio de nivel 2+ (4 h, 8 h, 24 h): la app pone siempre 1 h y un descanso corto lo termina. |
| Manos ardientes | Solo texto | Falta: salvación de DES y 3d6 de fuego (+1d6 por nivel). |
| Marca del cazador | Parcial | Lleva la concentración, gasta la acción adicional y descuenta los usos gratis de Enemigo predilecto. Falta: 1d6 de fuerza extra en tus impactos, pasar la marca y la duración larga con espacio de nivel 3+ (8 h, 24 h). |
| Nube de niebla | Sola | Narrativo: concentración, 1 h (el radio que sube con el nivel queda en el texto). |
| Onda atronadora | Solo texto | Falta: salvación de CON, 2d8 de trueno (+1d8 por nivel) y empuje. |
| Orbe cromático | Solo texto | Falta: el ataque (3d8 del tipo elegido, +1d8 por nivel) y los saltos. |
| Orden imperiosa | Solo texto | Falta: salvación de SAB y la orden; +1 objetivo por nivel. |
| Palabra de curación | Solo texto | Falta: la curación (2d4 + aptitud, +2d4 por nivel). No ofrece sumarla a tus PG. |
| Perdición | Parcial | Lleva la concentración (1 min). La salvación de CAR y el −1d4 a los objetivos quedan en el texto. |
| Protección contra el bien y el mal | Parcial | Gasta el agua bendita y lleva los 10 min. ERROR DE DATOS: no está marcado como concentración (en 2024 sí la requiere), así que la app no la lleva ni pide la salvación al recibir daño. La desventaja a esos atacantes queda en el texto. |
| Proyectil mágico | Solo texto | Falta: el daño (3 dardos de 1d4 + 1, +1 dardo por nivel). Impactan siempre. |
| Purificar comida y bebida | Sola | Narrativo: ritual. |
| Rayo nauseabundo | Solo texto | Falta: el ataque (2d8 de veneno, +1d8 por nivel) y el estado envenenado. |
| Represión infernal | Solo texto | Gasta la reacción. Falta: salvación de DES y 2d10 de fuego (+1d10 por nivel). |
| Retirada expeditiva | Parcial | Lleva la concentración (10 min). Falta: ofrecer «Correr» como acción adicional en tu turno mientras dura. |
| Risa horrible | Parcial | Lleva la concentración (1 min). Falta: recordar la salvación de SAB al final de cada turno del objetivo y al recibir daño. |
| Rociada de color | Solo texto | Falta: salvación de CON y el estado cegado hasta el final de tu siguiente turno. |
| Saeta guía | Parcial | Crea un efecto de 1 ronda, pero lo quita al final del mismo turno en que lo lanzas (la ventaja dura hasta el final de tu siguiente turno). Falta: el ataque (4d6 radiante, +1d6 por nivel). |
| Salto | Sola | Narrativo: lleva el minuto (el salto de 30 pies queda en el texto). |
| Santuario | Parcial | Lleva el minuto. Falta: recordar que termina si el protegido ataca, lanza un conjuro o hace daño. |
| Sirviente invisible | Sola | Narrativo: ritual, 1 h. |
| Susurros disonantes | Solo texto | Falta: salvación de SAB y 3d6 psíquico (+1d6 por nivel). |
| Zancada prodigiosa | Parcial | Lleva la hora. Falta: +10 pies a tu velocidad si te lo lanzas a ti. |


### Nivel 2 a 9 (por estado)

Los «Sola» sin nota son narrativos. En «Parcial», lo que va entre paréntesis es lo que falta; todos llevan ya la duración (y la concentración si la tienen). La parte automática detecta «daño», «salvación» o «estado» por el texto, así que en algunos de nivel alto puede sobrar o faltar algún detalle; los revisados a mano llevan nota completa.


### Nivel 2

**Sola (17):** Apertura; Augurio; Aura mágica del arcanista; Boca mágica (Descuenta del inventario el material que se consume. Narrativo: no hay números que aplicar; lleva la duración); Cerradura arcana (Descuenta del inventario el material que se consume. Narrativo: no hay números que aplicar; lleva la duración); Descanso apacible (Descuenta del inventario el material que se consume. Narrativo: no hay números que aplicar; lleva la duración); Encontrar montura (Botón «Crear la montura» con CA, PG y ataque según el nivel del espacio y el tipo elegido); Encontrar trampas; Llama permanente (Descuenta del inventario el material que se consume. Narrativo: no hay números que aplicar; lleva la duración); Localizar animales o plantas; Localizar objeto; Oscuridad; Paso brumoso (Narrativo: teletransporte de 30 pies con acción adicional); Trepar cual arácnido; Truco de la cuerda; Ver lo invisible; Visión en la oscuridad.

**Parcial (35):** Agrandar/reducir (falta: daño, daño extra en tus impactos, salvación del objetivo); Aliento de dragón (falta: daño, salvación del objetivo; escalado por nivel de espacio); Alterar el propio aspecto (falta: daño); Arma espiritual (Lleva la concentración y gasta la acción adicional. Falta: el ataque del arma (1d8 + aptitud, +1d8 por nivel) en tu lista de ataques y en la acción adicional de cada turno); Arma mágica (Lleva la hora. Falta: +1 (+2 a nivel 4, +3 a nivel 6) a ataque y daño del arma tocada); Auxilio (Lleva las 8 h. Falta: subir 5 los PG máximos y actuales (+5 por nivel) y quitarlos al acabar); Calentar metal (falta: daño, salvación del objetivo; escalado por nivel de espacio); Calmar emociones (falta: salvación del objetivo, estado que impone); Castigo resplandeciente (falta: daño, daño extra en tus impactos; escalado por nivel de espacio); Ceguera/sordera (falta: salvación del objetivo, salvación repetida cada turno, estado que impone; escalado por nivel de espacio); Crecimiento espinoso (falta: daño); Desenfoque (Lleva la concentración. Los atacantes tienen desventaja contra ti (queda en el texto)); Detectar pensamientos (falta: salvación del objetivo); Embelesar (falta: salvación del objetivo); Esfera flamígera (falta: daño, salvación del objetivo; escalado por nivel de espacio); Fuerza fantasmal (falta: daño, salvación del objetivo); Hoja de fuego (Lleva la concentración. Falta: el ataque de la hoja (3d6 de fuego + aptitud, +1d6 por nivel) en tu lista de ataques); Imagen múltiple (Lleva el minuto. Falta: contar los 3 duplicados y la tirada para desviar cada ataque); Inmovilizar persona (falta: salvación del objetivo, salvación repetida cada turno, estado que impone; escalado por nivel de espacio); Invisibilidad (Lleva la concentración. Falta: el estado invisible en tu ficha y que termine al atacar, hacer daño o lanzar un conjuro); Levitar (falta: salvación del objetivo); Mensajero animal (falta: salvación del objetivo; escalado por nivel de espacio); Pasar sin dejar rastro (Lleva la concentración. Falta: +10 a las pruebas de DES (Sigilo) mientras dura); Piel robliza (Lleva la hora. Falta: que tu CA no baje de 17); Potenciar característica (Lleva la concentración. Falta: ventaja en las pruebas de la característica elegida); Protección contra veneno (Lleva la hora. Falta: quitar el estado envenenado, la resistencia al veneno y la ventaja contra quedar envenenado); Punzada mental (falta: daño, salvación del objetivo; escalado por nivel de espacio); Ráfaga de viento (falta: salvación del objetivo); Rayo de luna (falta: daño, salvación del objetivo; escalado por nivel de espacio); Rayo debilitador (falta: daño, salvación del objetivo, salvación repetida cada turno, +/-1d4 en tiradas); Silencio (falta: estado que impone); Sugestión (falta: salvación del objetivo, estado que impone); Telaraña (falta: daño, salvación del objetivo, estado que impone); Vínculo protector (Lleva la hora. Falta: +1 CA y a salvaciones, resistencia a todo el daño y el daño compartido); Zona de verdad (falta: salvación del objetivo).

**Solo texto (5):** Flecha ácida (falta: daño, ataque de conjuro; escalado por nivel de espacio); Plegaria de curación (falta: curación; escalado por nivel de espacio); Rayo abrasador (falta: daño, ataque de conjuro; escalado por nivel de espacio); Restablecimiento menor (falta: quitar el estado (cegado, ensordecido, paralizado o envenenado) si te lo lanzas a ti); Romper (falta: daño, salvación del objetivo; escalado por nivel de espacio).


### Nivel 3

**Sola (17):** Cabaña diminuta; Caminar sobre el agua; Clarividencia; Corcel fantasma; Crear comida y agua; Crecimiento vegetal; Disipar magia; Don de lenguas; Hablar con las plantas; Hablar con los muertos; Imagen mayor; Indetectable (Descuenta del inventario el material que se consume. Narrativo: no hay números que aplicar; lleva la duración); Levantar maldición; Luz del día; Recado; Respirar bajo el agua; Revivificar (Descuenta del inventario el material que se consume. Narrativo: no hay números que aplicar).

**Parcial (21):** Acelerar (Lleva la concentración. Falta: +2 CA, velocidad doble, ventaja en salvaciones de DES, la acción extra limitada y el turno perdido al terminar); Animar a los muertos (Solo gasta el espacio. Los no muertos se crean a mano en Criaturas (hay plantilla «Otra criatura»); la orden diaria para mantenerlos no se recuerda); Círculo mágico (Descuenta del inventario el material que se consume. Lleva la duración. Falta: salvación del objetivo, estado que impone; escalado por nivel de espacio); Conjurar animales (Lleva la concentración. Falta: recordar el daño (3d10) y la salvación de DES al moverse la manada); Espíritus guardianes (Lleva la concentración. Falta: recordar el daño (3d8, +1d8 por nivel) y la salvación de SAB de los enemigos que entren o empiecen allí); Faro de esperanza (Lleva la concentración. Falta: que tus curaciones den el máximo y la ventaja en salvaciones de SAB y contra la muerte); Forma gaseosa (falta: estado que impone; escalado por nivel de espacio); Fundirse con la piedra (falta: daño, estado que impone); Glifo custodio (Descuenta del inventario el material que se consume. Lleva la duración. Falta: daño, salvación del objetivo; escalado por nivel de espacio); Imponer maldición (falta: daño, daño extra en tus impactos, salvación del objetivo, salvación repetida cada turno; escalado por nivel de espacio); Intermitencia (Lleva el minuto. Falta: recordar la tirada de 1d20 al final de cada turno (con 11+ pasas al plano Etéreo)); Invocar relámpagos (falta: daño, salvación del objetivo; escalado por nivel de espacio); Miedo (falta: salvación del objetivo, estado que impone); Muro de viento (falta: daño, salvación del objetivo); Nube apestosa (falta: salvación del objetivo, estado que impone); Patrón hipnótico (falta: salvación del objetivo, estado que impone); Protección contra energía (Lleva la concentración. Falta: la resistencia al tipo de daño elegido (el botón de daño no la aplica)); Ralentizar (falta: salvación del objetivo, salvación repetida cada turno); Toque vampírico (falta: daño, curación, ataque de conjuro; escalado por nivel de espacio); Tormenta de aguanieve (falta: salvación del objetivo, estado que impone); Volar (Lleva la concentración. Falta: velocidad de vuelo de 60 pies).

**Solo texto (4):** Bola de fuego (falta: daño, salvación del objetivo; escalado por nivel de espacio); Contraconjuro (falta: salvación del objetivo); Palabra de curación en masa (falta: curación; escalado por nivel de espacio); Relámpago (falta: daño, salvación del objetivo; escalado por nivel de espacio).


### Nivel 4

**Sola (10):** Adivinación (Descuenta del inventario el material que se consume. Narrativo: no hay números que aplicar); Cofre secreto; Fabricar; Insecto gigante (Botón «Crear la criatura»: CA, PG y ataques según el nivel; desaparece al perder la concentración); Localizar criatura; Moldear la piedra; Ojo arcano; Puerta dimensional (Narrativo: teletransporte (el daño si el destino está ocupado queda en el texto)); Santuario privado; Terreno alucinatorio.

**Parcial (21):** Asesino fantasmal (falta: daño, salvación del objetivo, salvación repetida cada turno; escalado por nivel de espacio); Aura de vida (Lleva la concentración. Falta: resistencia al necrótico, que tus PG máximos no bajen y que los aliados a 0 PG recuperen 1); Compulsión (falta: salvación del objetivo, salvación repetida cada turno, estado que impone); Confusión (falta: salvación del objetivo, salvación repetida cada turno; escalado por nivel de espacio); Conjurar elementales menores (falta: daño, daño extra en tus impactos; escalado por nivel de espacio); Conjurar seres del bosque (falta: daño, salvación del objetivo; escalado por nivel de espacio); Controlar el agua (falta: daño, salvación del objetivo); Custodia contra la muerte (Lleva las 8 h. Falta: que la primera vez que bajes a 0 PG te quedes con 1); Destierro (falta: salvación del objetivo, estado que impone; escalado por nivel de espacio); Dominar bestia (falta: salvación del objetivo, salvación repetida cada turno, estado que impone; escalado por nivel de espacio); Escudo de fuego (Lleva los 10 min. Falta: la resistencia elegida y el daño de 2d8 a quien te golpee cuerpo a cuerpo); Esfera resistente (falta: salvación del objetivo); Guardián de la fe (Lleva las 8 h. Falta: recordar el daño (20 radiante con salvación de DES, hasta 60 en total) a los enemigos que se acerquen); Hechizar monstruo (falta: salvación del objetivo, estado que impone; escalado por nivel de espacio); Invisibilidad mayor (Lleva la concentración. Falta: el estado invisible en tu ficha); Libertad de movimiento (Lleva la hora. Falta: que no te afecten paralizado ni apresado y no pierdas movimiento por terreno difícil); Muro de fuego (falta: daño, salvación del objetivo; escalado por nivel de espacio); Perro fiel (falta: daño, salvación del objetivo); Piel pétrea (Gasta el polvo de diamante y lleva la concentración. Falta: resistencia al daño contundente, perforante y cortante); Polimorfar (Botón «Elegir forma»: si te lo lanzas a ti, te transforma en una forma guardada y da sus PG como temporales. Sobre otra criatura, todo queda en el texto (salvación de SAB)); Tentáculos negros (falta: daño, salvación del objetivo, estado que impone).

**Solo texto (3):** Esfera vitriólica (falta: daño, salvación del objetivo; escalado por nivel de espacio); Plaga (falta: daño, salvación del objetivo; escalado por nivel de espacio); Tormenta de hielo (falta: daño, salvación del objetivo; escalado por nivel de espacio).


### Nivel 5

**Sola (12):** Caparazón antivida; Círculo de teletransporte (Descuenta del inventario el material que se consume. Narrativo: no hay números que aplicar; lleva la duración); Comunión; Comunión con la naturaleza; Conocimiento de leyendas (Descuenta del inventario el material que se consume. Narrativo: no hay números que aplicar); Creación; Invocar dragón (Botón «Crear la criatura»: CA, PG y ataques según el nivel; desaparece al perder la concentración); Muro de fuerza; Pasamuros; Reencarnar (Descuenta del inventario el material que se consume. Narrativo: no hay números que aplicar); Vínculo telepático; Zancada arbórea.

**Parcial (22):** Animar objetos (falta: daño, ataque de conjuro, estado que impone; escalado por nivel de espacio); Apariencia (falta: salvación del objetivo); Conjurar elemental (falta: daño, salvación del objetivo, salvación repetida cada turno, estado que impone; escalado por nivel de espacio); Contactar con otro plano (falta: daño, salvación del objetivo, estado que impone); Contagio (falta: daño, salvación del objetivo, salvación repetida cada turno, estado que impone); Despertar (Descuenta del inventario el material que se consume. Lleva parte. Falta: estado que impone); Disipar el bien y el mal (falta: salvación del objetivo, estado que impone); Dominar persona (falta: salvación del objetivo, salvación repetida cada turno, estado que impone; escalado por nivel de espacio); Engañar (Lleva la concentración. Falta: el estado invisible en tu ficha); Escudriñar (falta: salvación del objetivo); Geas (falta: daño, salvación del objetivo, estado que impone; escalado por nivel de espacio); Inmovilizar monstruo (falta: salvación del objetivo, salvación repetida cada turno, estado que impone; escalado por nivel de espacio); Mano arcana (falta: daño, salvación del objetivo, ataque de conjuro; escalado por nivel de espacio); Modificar recuerdo (falta: salvación del objetivo, estado que impone; escalado por nivel de espacio); Muro de piedra (falta: salvación del objetivo); Nube aniquiladora (falta: daño, salvación del objetivo; escalado por nivel de espacio); Plaga de insectos (falta: daño, salvación del objetivo; escalado por nivel de espacio); Revivir a los muertos (Gasta el diamante. Falta: la penalización de −4 a las pruebas d20 que baja 1 en cada descanso largo); Santificar (Descuenta del inventario el material que se consume. Lleva la duración. Falta: estado que impone); Sueño (falta: daño, salvación del objetivo, estado que impone); Telequinesis (falta: salvación del objetivo, estado que impone); Vínculo planar (Descuenta del inventario el material que se consume. Lleva la duración. Falta: salvación del objetivo; escalado por nivel de espacio).

**Solo texto (4):** Cono de frío (falta: daño, salvación del objetivo; escalado por nivel de espacio); Curar heridas en masa (falta: curación; escalado por nivel de espacio); Descarga flamígera (falta: daño, salvación del objetivo; escalado por nivel de espacio); Restablecimiento mayor (Gasta el polvo de diamante. Falta: quitar el agotamiento o el efecto elegido si te lo lanzas a ti).


### Nivel 6

**Sola (11):** Aliado planar; Contingencia; Convocatoria instantánea; Encontrar el camino; Globo de invulnerabilidad; Guardas y custodias; Ilusión programada; Mover la tierra; Palabra de regreso; Transporte vegetal; Visión verdadera (Descuenta del inventario el material que se consume. Narrativo: no hay números que aplicar; lleva la duración).

**Parcial (14):** Baile irresistible (falta: salvación del objetivo, salvación repetida cada turno, estado que impone); Banquete de héroes (Gasta el cuenco. Falta: +2d10 a los PG máximos y actuales durante 24 h, inmunidad al veneno y a asustado); Barrera de cuchillas (falta: daño, salvación del objetivo); Caminar con el viento (falta: estado que impone); Carne a piedra (falta: salvación del objetivo, salvación repetida cada turno, estado que impone); Conjurar feérico (falta: daño, ataque de conjuro, estado que impone; escalado por nivel de espacio); Crear muertos vivientes (Solo gasta el espacio. Los no muertos se crean a mano en Criaturas; la orden diaria para mantenerlos no se recuerda); Mirada penetrante (falta: salvación del objetivo, estado que impone); Muro de espinas (falta: daño, salvación del objetivo; escalado por nivel de espacio); Muro de hielo (falta: daño, salvación del objetivo; escalado por nivel de espacio); Prohibición (falta: daño); Rayo de sol (falta: daño, salvación del objetivo, estado que impone); Recipiente mágico (falta: salvación del objetivo, estado que impone); Sugestión en masa (falta: salvación del objetivo, estado que impone; escalado por nivel de espacio).

**Solo texto (6):** Círculo de muerte (falta: daño, salvación del objetivo; escalado por nivel de espacio); Curar (falta: curar 70 PG (+10 por nivel) y quitar cegado, ensordecido y envenenado); Dañar (falta: daño, salvación del objetivo); Desintegrar (falta: daño, salvación del objetivo; escalado por nivel de espacio); Esfera congelante (falta: daño, salvación del objetivo, estado que impone; escalado por nivel de espacio); Relámpago en cadena (falta: daño, salvación del objetivo; escalado por nivel de espacio).


### Nivel 7

**Sola (7):** Desplazamiento entre planos; Espejismo arcano; Forma etérea; Mansión magnífica; Proyectar imagen; Simulacro (Descuenta del inventario el material que se consume. Narrativo: no hay números que aplicar; lleva la duración); Teletransporte (Narrativo (el daño de un error de destino queda en el texto)).

**Parcial (9):** Bola de fuego de explosión retardada (falta: daño, salvación del objetivo; escalado por nivel de espacio); Conjurar celestial (falta: daño, curación, salvación del objetivo; escalado por nivel de espacio); Espada arcana (falta: daño, ataque de conjuro); Invertir la gravedad (falta: salvación del objetivo); Jaula de fuerza (Descuenta del inventario el material que se consume. Lleva la concentración y la duración. Falta: salvación del objetivo); Ocultar (Descuenta del inventario el material que se consume. Lleva la duración. Falta: estado que impone); Regenerar (falta: curación); Resurrección (Gasta el diamante. Falta: la penalización de −4 a las pruebas d20 que baja 1 en cada descanso largo); Símbolo (Descuenta del inventario el material que se consume. Lleva la duración. Falta: daño, salvación del objetivo, estado que impone).

**Solo texto (4):** Dedo de la muerte (falta: daño, salvación del objetivo); Palabra divina (falta: salvación del objetivo, estado que impone); Rociada prismática (falta: daño, salvación del objetivo, salvación repetida cada turno, estado que impone); Tormenta de fuego (falta: daño, salvación del objetivo).


### Nivel 8

**Sola (5):** Campo antimagia; Clon (Descuenta del inventario el material que se consume. Narrativo: no hay números que aplicar); Controlar el clima; Laberinto; Semiplano (Narrativo: lleva la hora).

**Parcial (9):** Antipatía/simpatía (falta: salvación del objetivo, estado que impone); Aura sagrada (falta: salvación del objetivo, estado que impone); Dominar monstruo (falta: salvación del objetivo, salvación repetida cada turno, estado que impone; escalado por nivel de espacio); Formas animales (falta: PG temporales); Labia (Lleva la hora. Falta: que tus pruebas de Carisma valgan como mínimo 15); Mente en blanco (falta: estado que impone); Nube incendiaria (falta: daño, salvación del objetivo); Terremoto (falta: daño, salvación del objetivo, estado que impone); Tsunami (falta: daño, salvación del objetivo).

**Solo texto (3):** Aturdimiento mental (falta: daño, salvación del objetivo, salvación repetida cada turno); Palabra de poder: aturdir (falta: salvación del objetivo, salvación repetida cada turno, estado que impone); Resplandor solar (falta: daño, salvación del objetivo, salvación repetida cada turno, estado que impone).


### Nivel 9

**Sola (3):** Detener el tiempo; Portal; Resurrección verdadera (Descuenta del inventario el material que se consume. Narrativo: no hay números que aplicar).

**Parcial (8):** Cambiar de forma (Botón «Elegir forma» con PG temporales. Cambiar de forma como acción adicional queda a mano); Encarcelamiento (falta: salvación del objetivo, estado que impone); Extraño (falta: daño, salvación del objetivo, salvación repetida cada turno, estado que impone); Muro prismático (falta: daño, salvación del objetivo, salvación repetida cada turno, estado que impone); Polimorfar verdadero (Botón «Elegir forma» (sobre ti). Lo demás (objetos, criaturas, hacerlo permanente) queda en el texto); Presciencia (Lleva las 8 h. Falta: ventaja en tus pruebas d20 y desventaja en los ataques contra ti); Proyección astral (Descuenta del inventario el material que se consume. Lleva la duración. Falta: estado que impone); Tormenta de venganza (falta: daño, salvación del objetivo, estado que impone).

**Solo texto (5):** Curar en masa (falta: curación, estado que impone); Deseo (Narrativo en general; el estrés de usarlo para otra cosa (daño necrótico al lanzar conjuros, FUE 3 durante 2d4 días, 33 % de perderlo) queda en el texto); Enjambre de meteoritos (falta: daño, salvación del objetivo); Palabra de poder: curar (falta: curación, estado que impone); Palabra de poder: matar (falta: daño).


## 4. Candidatas a automatizar

### Las más útiles (niveles bajos y clases comunes)

1. **Estallido arcano** (brujo, Zyo). Que aparezca como ataque en «Combate» con 1d10 de fuerza, su ataque de conjuro, el número de rayos según el nivel (2/3/4 a niveles 5/11/17) y +CAR por rayo si tiene Estallido agonizante. Es el conjuro que Zyo usa cada turno.
2. **Maleficio y Marca del cazador** (brujo, explorador). Tres cosas: recordar el 1d6 extra en cada ataque que impacte mientras estén activos; usar la duración según el espacio (`hl`: con un espacio de pacto de nivel 2, Maleficio dura 4 h, no 1 h); y no quitarlos en el descanso corto si les queda tiempo (ver fallo 2).
3. **Trucos de daño con ataque o salvación**: Descarga de fuego, Llama sagrada, Toque gélido, Rayo de escarcha, Agarre electrizante, Rociada venenosa, Burla cruel, Salpicadura ácida, Fuego fatuo estelar, Estallido hechicero. Mostrar en el aviso y en «Combate» qué tirar con el escalado ya hecho («Tira 2d10 de fuego»).
4. **Curar heridas y Palabra de curación** (clérigo, paladín, explorador, bardo, druida). Al lanzarlos, decir cuántos dados tirar según el espacio (2d8/2d4 por nivel) más la aptitud, y ofrecer sumar el resultado a tus PG o a los de una criatura tuya, como ya hace Falsa vida con los PG temporales.
5. **Escudo y Escudo de la fe** (mago, clérigo, paladín). Sumar +5 o +2 a la CA mientras dure el efecto, como ya se hace con Armadura de mago. Escudo debe acabar al **empezar** tu siguiente turno.
6. **Bendición** (clérigo, paladín) y Orientación/Resistencia. Mientras estén activas, recordar +1d4 en ataques y salvaciones (Bendición), en pruebas de esa habilidad (Orientación) o −1d4 al daño de ese tipo (Resistencia).
7. **Castigos del paladín y Favor divino**: Castigo divino (2d8 radiante +1d8 por nivel, +1d8 contra infernales y muertos vivientes), Castigo abrasador, Castigo resplandeciente, Golpe atrapador, Favor divino (+1d4 radiante en ataques con armas). Decir el daño con el nivel del espacio y recordar el extra mientras dure.
8. **Conjuros que crean un arma**: Arma espiritual, Hoja de fuego, Crear llama y Garrote, y Golpe certero. Los conjuros propios ya tienen `wpn`, que añade el ataque y lo quita al acabar el efecto; bastaría dar ese mismo dato a estos 5 del catálogo.
9. **Proyectil mágico, Manos ardientes, Onda atronadora, Saeta guía, Orbe cromático, Represión infernal, Susurros disonantes, Cuchillo de hielo**: los conjuros de daño de nivel 1 más comunes. Decir los dados con el espacio usado (1d4 + 1 por dardo y +1 dardo por nivel, 3d6 + 1d6 por nivel…).
10. **Invocar bestia, feérico, muerto viviente, elemental, constructo, aberración, celestial e infernal**: las plantillas de criatura ya existen en `data/creatures.js`, pero esos conjuros no están en el SRD 5.2. Si el jugador los crea como conjuro propio, la app no los enlaza con su plantilla y no sale «Crear la criatura». Basta con enlazar un conjuro propio con ese nombre a su plantilla.
11. **Bayas nutritivas** (druida, explorador): crear las 10 bayas como consumible (1 PG cada una, comida del día) que desaparecen a las 24 h.
12. **Heroísmo y Auxilio**: PG temporales al principio de cada turno (Heroísmo) y +5 a los PG máximos y actuales durante 8 h (Auxilio).

### Patrones que se arreglarían de una vez

- **Ningún conjuro calcula daño ni curación.** Unos 45 conjuros de daño instantáneo y una docena de curación tienen todo en el texto. Casi todos usan las mismas frases («recibe XdY de daño de TIPO», «recupera puntos de golpe iguales a XdY más tu modificador…»), así que un lector de texto, o mejor unos pocos campos nuevos en `data/spells.js` (dados, tipo, ataque o salvación y característica), cubriría la mayoría de golpe.
- **14 trucos de daño escalan igual**: «Mejora de truco» a los niveles 5, 11 y 17 (1 → 2 → 3 → 4 dados). Una sola función resuelve todos (Estallido arcano cuenta rayos en vez de dados).
- **52 conjuros suben dados por nivel de espacio** con la misma frase en `hl`: «aumenta en XdY por cada nivel de espacio por encima de N» (6 de ellos de curación). La app ya sabe con qué nivel se lanza (`lastCastL`); falta usarlo.
- **19 conjuros suben «una criatura adicional por nivel»** (Bendición, Perdición, Hechizar persona, Orden imperiosa, Inmovilizar persona…). Basta con decirlo en el aviso: «Con espacio de nivel 3: hasta 5 objetivos».
- **25 conjuros piden una salvación que se repite** cada turno o al recibir daño (17 de concentración): Dormir, Risa horrible, Inmovilizar persona/monstruo, Ceguera/sordera, Ralentizar, Rayo debilitador, Imponer maldición, Confusión, Dominar bestia/persona/monstruo, Asesino fantasmal, Castigo abrasador… La app lleva la concentración pero no recuerda la salvación. Un aviso al pulsar «Terminar turno» con la lista de esos conjuros activos y la CD resolvería todos; en el modo máster serviría aún más.
- **8 conjuros dan daño extra a tus impactos mientras duran** (Maleficio, Marca del cazador, Favor divino, Castigo abrasador, Castigo resplandeciente, Agrandar/reducir, Imponer maldición, Conjurar elementales menores). Mostrar «+1d6 necrótico (Maleficio)» junto a cada ataque mientras el efecto siga activo.
- **Bonificadores a tu CA por efecto**: Escudo (+5), Escudo de la fe (+2), Vínculo protector (+1), Acelerar (+2), Piel robliza (mínimo 17). El cálculo de la CA ya mira si hay un efecto «Armadura de mago»; generalizarlo a un campo de CA en el efecto sirve para todos.
- **+1d4/−1d4 en tiradas** (Bendición, Perdición, Orientación, Resistencia, Rayo debilitador): un recordatorio en las tiradas de ataque, salvación o prueba mientras estén activos.
- **5 conjuros duran más con un espacio mayor** (Maleficio, Marca del cazador y los tres Dominar). Leer la duración según el espacio en `hl`.
- **Resistencias por conjuro** (Resistencia, Protección contra energía, Piel pétrea, Escudo de fuego, Vínculo protector, Protección contra veneno): el botón de daño ya tiene la opción de resistencia (la mitad); podría proponerla sola cuando uno de estos efectos esté activo.
- **82 conjuros imponen un estado al objetivo** (hechizado, apresado, asustado…). En la ficha del jugador vale con el texto; en el modo máster podría marcarse en el NPC.

## 5. Fallos o reglas mal aplicadas vistos de paso

1. **Protección contra el bien y el mal no pide concentración** (`data/spells.js`, id `protection-from-evil-and-good`: `"k":false`). En 2024 es «Concentración, hasta 10 minutos». La app no la marca, no quita la concentración anterior y no pide la salvación al recibir daño. Comprobado en la app. Es el único conjuro con este problema (el guion compara todos: los demás «hasta…» sin concentración son correctos según 2024: Prestidigitación, Taumaturgia y Forma etérea).
2. **El descanso corto termina Maleficio y Marca del cazador aunque les quede tiempo** (`js/actions/rest.js:86` quita todo efecto de 60 min o menos, y `js/views/play.js:341` siempre usa la duración base). Con un espacio de nivel 2, Maleficio debería durar 4 h y seguir tras el descanso corto si mantienes la concentración; la app le pone 60 min y lo quita. Afecta a Zyo en cuanto tenga espacios de pacto de nivel 2 (nivel 3). Comprobado en la app.
3. **Los efectos de 1 ronda acaban en el turno equivocado** (`js/actions/combat.js:24-26`). Saeta guía se quita al terminar el mismo turno en que se lanza, pero la ventaja dura hasta el final de tu siguiente turno (comprobado). Y Escudo, lanzado como reacción en el turno de un enemigo, sigue visible todo tu turno siguiente, cuando acaba al empezarlo.
4. **Los efectos en minutos u horas nunca bajan**: solo las rondas cuentan con «Terminar turno». Los de minutos solo se quitan con un descanso (corto: hasta 1 h; largo: hasta 8 h, `js/actions/rest.js:86` y `:133`). Los de 24 h o más (Bayas nutritivas, Amistad con los animales, Sugestión en masa…) se quedan para siempre hasta quitarlos a mano. Y los de «1 minuto» lanzados fuera de combate se quedan en «10 rondas» hasta el siguiente descanso o combate.
5. **El ritual se ofrece en combate** (`js/actions/play.js:81`): desde «Combate», un conjuro ritual muestra «Como ritual» y solo gasta la acción, cuando un ritual tarda 10 minutos más.
6. **No se controla «un solo espacio de conjuro por turno»** (regla de 2024; `js/views/turn.js:119` no guarda si ya gastaste un espacio). Un paladín puede lanzar Castigo divino y otro conjuro con espacio en el mismo turno sin aviso.
7. **Armadura de mago lanzada sobre otro sube tu CA** (`js/views/inventory.js:396` mira solo si hay un efecto con ese nombre). La propia ventana sugiere «lánzalo igualmente (por ejemplo, sobre otra criatura)», y entonces tu CA sube si no llevas armadura.
8. **Polimorfar deja dos efectos con el mismo nombre** (`js/views/play.js:341` crea el efecto del conjuro y `js/features/creatures.js:406` crea otro al elegir la forma). No se ve porque los dos son de concentración y se quitan juntos, pero está duplicado.
9. **Las componentes V y S no se ven en ningún sitio** (el campo `v` no se copia a la ficha, `js/features/spell-search.js:11`). Importa con el estado «Silenciado», atado o con Conjuro sutil.
10. **Visto de paso (rasgos de clase):** un brujo de nivel 11+ no puede lanzar su conjuro de Arcano místico desde la app: `slotOptions` (`js/views/play.js:240`) solo ofrece el espacio de pacto si su nivel llega al del conjuro (máx. 5) y el brujo no tiene espacios normales, así que el botón sale «Sin espacios». Arcano místico es solo texto en `data/classes.js:372`.
11. **Menores:** Prestidigitación crea siempre un efecto de 1 h aunque se use una opción instantánea; Piedad con los moribundos no muestra el alcance que sube con el nivel.

## 6. Comprobación en la app

`node tests/inventario-conjuros.js --app` levanta su propio servidor en el puerto 8782, importa las fichas de `tests/fichas/` y lanza conjuros con `A.cast`. Resultado del 9-11-2026 (✗ = la app no lo hace o lo hace mal):

```
✓ Maleficio: queda en concentración
✗ Maleficio con espacio de nivel 2 dura 4 h (la app pone 60 min)
✗ Maleficio de 4 h sigue tras un descanso corto (concentración: «»)
✗ Estallido arcano añade o usa un ataque con su daño
✗ Escudo sube la CA en 5 (antes 12, después 12)
ℹ Escudo (1 ronda) se quita tras pulsar «Terminar turno» una vez: lanzado como reacción en el turno de un enemigo, sigue visible todo tu turno siguiente
✓ Armadura de mago: CA 15 (13 + DES = 15)
✗ Protección contra el bien y el mal pide concentración (concentración: «»)
✓ Saeta guía crea un efecto de 1 ronda
✗ La ventaja de Saeta guía sigue tras terminar el turno en que se lanza
✗ Curar heridas ofrece aplicar la curación
✓ Sin errores de consola
```

## Cómo volver a pasarlo

- `node tests/inventario-conjuros.js`: resumen por consola, lista de conjuros con tratamiento propio y datos que no cuadran (concentración contra duración, duraciones que `parseDur` no entiende, plantillas de criatura sin conjuro).
- `node tests/inventario-conjuros.js --md`: regenera las tablas de este documento.
- `node tests/inventario-conjuros.js --app`: comprueba en la app los fallos de arriba. Cuando se arregle uno, su línea pasará a ✓.
- La revisión a mano está en el objeto `MANUAL` del guion: si se automatiza un conjuro, cambia ahí su estado y su nota.
