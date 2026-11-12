# Hallazgos de las pruebas

Lo que han encontrado las pruebas de `PLAN.md` y las partidas reales. Se añaden al final, con el número siguiente. En la fase 5 se pondrá aquí arriba una tabla ordenada por prioridad; mientras, está la de la prueba 1c («Prioridades», justo debajo del formato).

Tipos:
- **Fallo:** algo no funciona o da error.
- **Regla:** la app aplica mal una regla de 2024.
- **Automatizar:** la app no lo hace sola y el jugador lo tiene que recordar, calcular o buscar a mano.
- **Mejora:** funciona, pero se podría entender o usar mejor.

Prioridad (sobre todo para **Automatizar** y **Mejora**), puntuando cada cosa de 1 a 3:
- **Frecuencia:** cuántas veces sale en una partida normal.
- **Olvido:** lo fácil que es que un novato se olvide o se equivoque.
- **Coste:** lo que cuesta hacerlo (1 = mucho, 3 = poco).

Prioridad = frecuencia + olvido + coste (de 3 a 9). Los **Fallos** y las **Reglas** van siempre primero.

Estado: `pendiente` · `aceptado` (Albert quiere arreglarlo) · `descartado` (Albert prefiere dejarlo así, o choca con la idea de la app) · `arreglado`

Formato:

```
### N. Título corto
- Origen: (nombre de la prueba de PLAN.md, o «Partida real»)
- Tipo: Fallo | Regla | Automatizar | Mejora
- Qué pasa: …
- Qué debería pasar: …
- Propuesta: …
- Prioridad: frecuencia X + olvido X + coste X = N
- Estado: pendiente
```

---

## Prioridades (prueba 1c)

Hecha el 2026-11-09. Las candidatas de `INVENTARIO.md` (1a) y `REGLAS.md` (1b) que faltaban están ya abajo como hallazgos (n.º 45–81). Aquí se ordenan **todos los pendientes**: los nuevos y los de antes (también los fallos y las reglas sin arreglar).

### Cómo se puntúa

Tres notas de 1 a 3, pensando en **vuestra mesa**: niveles 1 a 5 y el grupo de Albert (Zyo, brujo tiefling ctónico con Pacto del Filo; un explorador elfo drow; un monje humano; un mago).

- **Frecuencia** (cuántas veces sale): 3 = casi en cada combate o sesión para alguien del grupo; 2 = a menudo, pero solo para un personaje, en algunas situaciones o a partir de nivel 2–5; 1 = rara vez, en niveles altos o solo para clases y especies que no tenéis.
- **Olvido** (lo fácil que es olvidarlo o equivocarse): 3 = casi seguro que un novato se lo salta (el número está escondido en un texto o cambia otra tirada); 2 = a veces; 1 = cuesta olvidarlo, porque la app ya lo dice en el momento.
- **Coste** (al revés: más nota, más barato): 3 = cambiar un texto o un dato, o unas pocas líneas en un sitio; 2 = una función o una ventana nueva, o tocar 2–3 sitios; 1 = datos nuevos para muchas cosas o una parte nueva de la ficha.

**Total** = frecuencia + olvido + coste (de 3 a 9). Con el mismo total va antes lo más frecuente; después, los fallos y las reglas mal aplicadas; después, lo más fácil de olvidar.

Se ha cambiado la nota de un hallazgo antiguo: el **n.º 41** (golpe desarmado) pasa de 6 a 8, porque el monje del grupo lo usa en cada turno. Los demás conservan la suya.

**Descartados** por chocar con la idea de la app: n.º 80 (recuperar la munición sola: la suma el jugador) y n.º 81 (que la app tire los dados: solo dice qué tirar y pregunta el resultado).

### Las 10 primeras

**Toda la lista está hecha** (10 y 11 de noviembre de 2026): los 57 puestos están arreglados, salvo los dos descartados (n.º 80 y 81). Algunos quedaron a medias a propósito; lo que falta está en la nota de «Estado» de cada uno (sobre todo los n.º 28, 49, 54, 63, 67, 68 y 75).

1. **N.º 45 · Estallido arcano: qué tirar.** Es el ataque de Zyo en casi cada turno, y la app no dice ni el dado ni cuántos rayos.
2. **N.º 49 · Daño extra de Maleficio y Marca del cazador.** Zyo y el explorador los usan en cada combate, y el +1d6 se olvida en cada impacto.
3. **N.º 37 · Avisar de la ventaja, la desventaja y el agotamiento.** Lo que más tiene que recordar un novato; afecta a todos y a cada tirada.
4. **N.º 46 · Trucos de daño: qué tirar.** Zyo y el mago los lanzan en cada combate, y a nivel 5 doblan los dados.
5. **N.º 41 · Golpe desarmado.** El monje golpea así en cada turno y no tiene ningún ataque con números.
6. **N.º 64 · Rasgos al tirar iniciativa.** Recordar Metabolismo asombroso (monje 2) en el momento justo; es barato.
7. **N.º 42 · Reglas comunes en el glosario.** Cobertura, terreno difícil, saltar, luz… Solo texto: muy barato y lo consultaréis a menudo.
8. **N.º 2 · Iniciado en la magia al crear.** Fallo: el mago (o cualquiera con esa dote) se queda sin 2 trucos y un conjuro.
9. **N.º 31 · La reacción vuelve en el momento equivocado.** Regla mal aplicada que toca a todos (Zyo: Represión infernal).
10. **N.º 36 · Textos de estados incompletos o de 2014.** Solo texto, barato, y evita jugar con reglas viejas.

Muy cerca (también 7 puntos): n.º 47 (conjuros de daño con espacio), 50 (salvación cada turno), 52 (resistencia necrótica de Zyo), 54 (Metabolismo asombroso), 55 (Recuperación arcana del mago) y 51 (Escudo del mago).

### Tabla completa

Frec. = frecuencia. En negrita, las 10 primeras.

| Puesto | N.º | Qué | Tipo | Frec. | Olvido | Coste | Total | A quién del grupo |
|---:|---:|---|---|:-:|:-:|:-:|:-:|---|
| **1** | **45** | **Estallido arcano: qué tirar** | Automatizar | 3 | 3 | 3 | **9** | Zyo |
| **2** | **49** | **Daño extra de Maleficio, Marca del cazador…** | Automatizar | 3 | 3 | 3 | **9** | Zyo, explorador |
| **3** | **37** | **Avisos de ventaja, desventaja y agotamiento** | Automatizar | 3 | 3 | 2 | **8** | Todos |
| **4** | **46** | **Trucos de daño: qué tirar y subida de dados** | Automatizar | 3 | 3 | 2 | **8** | Zyo, mago |
| **5** | **41** | **Golpe desarmado** | Automatizar | 3 | 2 | 3 | **8** | Monje |
| **6** | **64** | **Rasgos al tirar iniciativa** | Automatizar | 2 | 3 | 3 | **8** | Monje (nivel 2) |
| **7** | **42** | **Reglas comunes en el glosario** | Mejora | 2 | 3 | 3 | **8** | Todos |
| **8** | **2** | **Iniciado en la magia al crear** | Fallo | 2 | 3 | 2 | **7** | Mago (según trasfondo) |
| **9** | **31** | **La reacción vuelve al terminar tu turno** | Regla | 2 | 2 | 3 | **7** | Todos |
| **10** | **36** | **Textos de estados y glosario** | Regla | 2 | 2 | 3 | **7** | Todos |
| 11 | 47 | Conjuros de daño con espacio: qué tirar | Automatizar | 2 | 3 | 2 | 7 | Mago, Zyo, explorador |
| 12 | 50 | Salvación que se repite cada turno | Automatizar | 2 | 3 | 2 | 7 | Mago, explorador |
| 13 | 52 | Resistencias guardadas en la ficha | Automatizar | 2 | 3 | 2 | 7 | Zyo |
| 14 | 54 | Rasgos que curan (Metabolismo asombroso) | Automatizar | 2 | 3 | 2 | 7 | Monje (nivel 2) |
| 15 | 55 | Recuperación arcana | Automatizar | 2 | 3 | 2 | 7 | Mago |
| 16 | 38 | Velocidad 0 por estados y cómo soltarse | Automatizar | 2 | 2 | 3 | 7 | Todos |
| 17 | 39 | Esquivar, Esconderse, Correr… | Automatizar | 2 | 2 | 3 | 7 | Todos |
| 18 | 40 | Crítico: qué tirar | Automatizar | 2 | 2 | 3 | 7 | Todos |
| 19 | 51 | Escudo y CA por conjuros | Automatizar | 2 | 2 | 3 | 7 | Mago |
| 20 | 56 | Velocidad de rasgos (Movimiento sin armadura) | Automatizar | 2 | 2 | 3 | 7 | Monje (nivel 2) |
| 21 | 57 | CD de Golpe aturdidor | Automatizar | 2 | 2 | 3 | 7 | Monje (nivel 5) |
| 22 | 58 | Ventaja en concentración (Mente arcana) | Automatizar | 2 | 2 | 3 | 7 | Zyo (si la coge) |
| 23 | 73 | Glosario, segunda tanda | Mejora | 2 | 2 | 3 | 7 | Todos |
| 24 | 74 | Contar el movimiento del turno | Mejora | 3 | 1 | 2 | 6 | Todos |
| 25 | 13 | «Pasa el tiempo» para los efectos | Regla | 2 | 2 | 2 | 6 | Todos |
| 26 | 17 | Tope de armas con maestría | Regla | 2 | 2 | 2 | 6 | Explorador |
| 27 | 48 | Conjuros de curación: qué tirar | Automatizar | 2 | 2 | 2 | 6 | Explorador |
| 28 | 61 | Maestrías con sus números | Automatizar | 2 | 2 | 2 | 6 | Explorador |
| 29 | 66 | Golpe arcano y Bebedor de vida | Automatizar | 2 | 2 | 2 | 6 | Zyo (nivel 5) |
| 30 | 68 | Reacciones que restan daño | Automatizar | 2 | 2 | 2 | 6 | Monje (nivel 3) |
| 31 | 43 | Ataque de oportunidad: con qué arma | Automatizar | 2 | 1 | 3 | 6 | Todos |
| 32 | 19 | Lecciones de los Primeros | Fallo | 1 | 3 | 2 | 6 | Zyo (si la coge) |
| 33 | 30 | ¿Dormir rompe la concentración? | Regla | 1 | 2 | 3 | 6 | Zyo (esperando al máster) |
| 34 | 32 | Daño a 0 PG: muerte instantánea y crítico | Regla | 1 | 2 | 3 | 6 | Todos |
| 35 | 33 | Descanso largo a 0 PG | Regla | 1 | 2 | 3 | 6 | Todos |
| 36 | 53 | ±1d4 de Bendición y similares | Automatizar | 1 | 3 | 2 | 6 | Fuera del grupo |
| 37 | 60 | Conjuros del catálogo que crean un arma | Automatizar | 1 | 2 | 3 | 6 | Fuera del grupo |
| 38 | 63 | Contadores de subclase que faltan | Automatizar | 1 | 2 | 3 | 6 | Explorador (si es Acechador) |
| 39 | 69 | Duelo y armas arrojadizas: +2 al daño | Automatizar | 1 | 2 | 3 | 6 | Explorador (si lo elige) |
| 40 | 72 | Preparar y la reacción | Automatizar | 1 | 2 | 3 | 6 | Todos |
| 41 | 4 | Trasfondo propio en el asistente | Mejora | 1 | 3 | 2 | 6 | Zyo |
| 42 | 62 | Pericia y órdenes en el asistente | Mejora | 1 | 3 | 2 | 6 | Explorador y mago (nivel 2) |
| 43 | 59 | Usos «= competencia» en rasgos propios | Mejora | 1 | 2 | 3 | 6 | Zyo |
| 44 | 70 | Componentes V y S | Mejora | 1 | 2 | 3 | 6 | Zyo, mago |
| 45 | 65 | Libro de conjuros del mago | Mejora | 2 | 2 | 1 | 5 | Mago |
| 46 | 28 | Fallos menores | Fallo | 1 | 1 | 3 | 5 | Varios |
| 47 | 79 | Fallos menores (segunda tanda) | Fallo | 1 | 1 | 3 | 5 | Fuera del grupo |
| 48 | 34 | Escudo y armadura sin competencia | Regla | 1 | 1 | 3 | 5 | Todos |
| 49 | 35 | Días sin comer (por confirmar) | Regla | 1 | 1 | 3 | 5 | Todos |
| 50 | 67 | Rasgos de clases y especies fuera del grupo | Automatizar | 1 | 3 | 1 | 5 | Fuera del grupo |
| 51 | 44 | Salvaciones contra la muerte en el turno | Automatizar | 1 | 2 | 2 | 5 | Todos |
| 52 | 76 | Armas arrojadizas: descontarlas | Automatizar | 1 | 2 | 2 | 5 | Todos |
| 53 | 77 | Bayas nutritivas | Automatizar | 1 | 2 | 2 | 5 | Explorador |
| 54 | 78 | Invocar criaturas con conjuros propios | Automatizar | 1 | 1 | 3 | 5 | Fuera del grupo |
| 55 | 5 | Origen de los recursos | Mejora | 1 | 1 | 3 | 5 | Todos |
| 56 | 71 | Estado «Muerto» | Mejora | 1 | 1 | 3 | 5 | Todos |
| 57 | 75 | Peso y carga | Automatizar | 1 | 1 | 1 | 3 | Si el máster usa la carga |

### De dónde sale cada candidata

Las 15 candidatas del resumen de `INVENTARIO.md` y dónde han quedado (las que ya estaban apuntadas no se repiten):

| Candidata de `INVENTARIO.md` | Hallazgo |
|---|---|
| 1. Arma de pacto | n.º 3 (arreglado) |
| 2. Daño y curación de conjuros | n.º 45, 46, 47 y 48 |
| 3. Daño extra mientras dura un efecto | n.º 49 (Furia y Ataque furtivo: n.º 67; Furia y concentración: n.º 25, arreglado) |
| 4. Salvación de cada turno | n.º 50 |
| 5. Rasgos que recuperan o curan | n.º 29 (arreglado), 54 y 55 |
| 6. CA y velocidad | n.º 7 (arreglado), 51 y 56 |
| 7. Resistencias de especie | n.º 52 |
| 8. Bendición, Orientación, Resistencia | n.º 53 |
| 9. Elecciones que no se preguntan | n.º 2, 4, 19 y 62 |
| 10. Ataques creados por conjuros | n.º 60 |
| 11. Maestrías con números | n.º 61 (tope por clase: n.º 17) |
| 12. Monje | n.º 11 y 12 (arreglados), 41 y 57 |
| 13. Datos que faltan | n.º 63 (Pasos de las hadas: n.º 24, arreglado) |
| 14. Ventaja en concentración | n.º 58 |
| 15. Usos «= competencia» | n.º 59 |

Las de los informes de detalle (`inventario-*.md`): Golpe arcano y Bebedor de vida (n.º 66), al empezar el combate (n.º 64), reacciones que restan daño (n.º 68), Duelo (n.º 69), libro de conjuros (n.º 65), Bayas nutritivas (n.º 77), invocar criaturas (n.º 78), componentes V y S (n.º 70), propiedad Pesada (n.º 37), rasgos de otras clases y especies (n.º 67), fallos de paso (n.º 79). Las de `REGLAS.md` que no tenían número: movimiento del turno (n.º 74), carga (n.º 75), estado «Muerto» (n.º 71), Preparar (n.º 72), glosario (n.º 73), armas arrojadizas (n.º 76) y munición (n.º 80, descartado).

---

### 1. Las armas del equipo inicial no quedan equipadas
- Origen: Base, reparto y prueba de humo
- Tipo: Fallo
- Qué pasa: al crear un personaje con el asistente, la armadura y el escudo quedan puestos, pero las armas del equipo inicial entran en la mochila sin equipar. Resultado: en la pestaña Combate no sale ningún ataque con arma (pasa con las 4 fichas del reparto: el guerrero no tiene su espadón para atacar). El paso de Equipo dice «Las armas, las armaduras y el dinero se colocan solos».
- Qué debería pasar: un personaje recién creado debería poder atacar con sus armas en Combate sin tocar nada más.
- Propuesta: en `kitGive()` (asistente), marcar también como equipadas las armas del equipo de clase (o al menos las de la opción elegida), igual que se hace con la armadura.
- Prioridad: frecuencia 3 + olvido 3 + coste 3 = 9
- Estado: arreglado (2026-11-09): las armas del equipo inicial quedan equipadas.

### 2. «Iniciado en la magia» del trasfondo no añade sus conjuros al crear el personaje
- Origen: Base, reparto y prueba de humo
- Tipo: Fallo
- Qué pasa: con Sabio (mago) y Acólito (paladín), la dote de origen «Iniciado en la magia» aparece como rasgo y crea el contador «Conjuro de iniciado (gratis)», pero el asistente no pide ni añade los 2 trucos ni el conjuro de nivel 1, ni la característica para lanzarlos. El contador queda apuntando a un conjuro que no está en la ficha. Pasa igual con cualquier trasfondo que dé esta dote (Guía) y con la dote extra del humano. Al crear, las dotes de origen solo se copian como texto (`addFeature`), no con `featApply`, que sí sabe elegir conjuros (`spPick`) cuando la dote se coge a nivel 4.
- Qué debería pasar: al crear, el asistente debería pedir los conjuros (y la característica) de la dote, como hace al cogerla a nivel 4, y dejarlos en Magia.
- Propuesta: en el paso Trasfondo (o uno nuevo, «Dote de origen»), usar `ftPickerHTML`/`featApply` para las dotes de origen que tengan opciones.
- Prioridad: frecuencia 2 + olvido 3 + coste 2 = 7
- Estado: arreglado (2026-11-10): paso nuevo «Dote de origen» en el asistente de creación para las dotes con conjuros a elegir; se aplica con `featApply` y, si la clase no lanza conjuros, pregunta la aptitud mágica. `generar-fichas.js` lo recorre (el mago y el paladín ya traen sus conjuros de iniciado).

### 3. El arma de pacto (Pacto del Filo) no se convierte en un ataque con CAR
- Origen: Base, reparto y prueba de humo
- Tipo: Automatizar
- Qué pasa: Zyo tiene «Invocación: Pacto del Filo» y en Combate sale «Invocar arma de pacto» como acción adicional, pero solo marca la acción adicional. Sus ataques con arma usan FUE/DES (la hoz sale a +1 y 1d4−1). Para atacar con CAR, el jugador tiene que crear a mano un ataque en «Otros ataques» y calcular el bonificador y el daño.
- Qué debería pasar: al invocar el arma de pacto, la app debería dejar elegir el arma (sencilla o marcial cuerpo a cuerpo) y crear el ataque con CAR para ataque y daño, con competencia, y el tipo de daño a elegir (el normal, necrótico, psíquico o radiante).
- Propuesta: un ataque temporal como los de los conjuros propios (`fxSpell`), ligado al arma de pacto, que se quite al volver a invocarla o al soltarla.
- Prioridad: frecuencia 3 + olvido 3 + coste 2 = 8
- Estado: arreglado (2026-11-09): al pulsar «Invocar arma de pacto» se elige una de tus armas cuerpo a cuerpo o se invoca una nueva, y el tipo de daño. El ataque usa CAR (o tu mejor característica) y es competente. Solo hay una arma de pacto a la vez.

### 4. Con un trasfondo propio, el asistente solo deja escribir el nombre
- Origen: Base, reparto y prueba de humo
- Tipo: Mejora
- Qué pasa: al elegir «Otro (lo completo a mano)» en el trasfondo, el asistente no deja elegir sus 2 habilidades, la herramienta, los aumentos de características ni la dote de origen (del catálogo o casera). Para Zyo («Mendigo» con «Dote Superviviente») hubo que: sumar a mano los aumentos en las puntuaciones, y después, en «Editar ficha», añadir el rasgo «Dote Superviviente», marcar las habilidades (Sigilo y Juego de manos, elegidas para la prueba) y escribir la herramienta. La ficha de prueba usa esos valores como aproximación; el texto de la dote es provisional.
- Qué debería pasar: el trasfondo propio debería poder completarse en el mismo asistente, como uno del manual.
- Propuesta: en «Otro», mostrar los mismos campos que un trasfondo del manual: 3 características (para +2/+1 o +1/+1/+1), 2 habilidades, herramienta y dote de origen (catálogo o «Otra», con nombre y texto).
- Prioridad: frecuencia 1 + olvido 3 + coste 2 = 6
- Estado: arreglado (2026-11-11): con «Otro», el asistente deja elegir las 3 características y el reparto (+2/+1 o +1/+1/+1), 2 habilidades, la herramienta y la dote de origen (del catálogo o escrita a mano). Todo es opcional salvo el nombre.

### 5. Algunos recursos salen con un origen equivocado
- Origen: Base, reparto y prueba de humo
- Tipo: Mejora
- Qué pasa: en «Rasgos y dotes», «Afinidad con la piedra» (rasgo de enano) sale con origen «Dote» en el guerrero enano, y «Conjuro de iniciado (gratis)» (de la dote del trasfondo) sale con origen «Elfo» en el mago y «Humano» en el paladín. Pasa porque el recurso se crea con el origen de quien lo añade primero (`upsertRes`), no con el suyo.
- Qué debería pasar: cada recurso debería decir de dónde viene (especie, linaje o dote).
- Propuesta: que `originRes` devuelva también el origen de cada recurso y `upsertRes` lo use.
- Prioridad: frecuencia 1 + olvido 1 + coste 3 = 5
- Estado: arreglado (2026-11-11): `originRes()` devuelve el origen de cada recurso (especie, linaje o «Dote: nombre») y `upsertRes()` lo usa. Solo para fichas nuevas; las ya creadas conservan el que tenían.

### 6. No reconoce la competencia con armadura media
- Origen: 1a. Datos de la app (clases)
- Tipo: Fallo
- Qué pasa: `js/views/inventory.js:369` busca «intermed» en las competencias, pero las clases dicen «armadura media». Un bárbaro, clérigo o explorador con armadura media ve «no eres competente… no puedes lanzar conjuros». Comprobado en la app.
- Qué debería pasar: reconocer «media» como competencia con armadura media.
- Propuesta: buscar «media» (y dejar «intermed» por compatibilidad).
- Prioridad: frecuencia 3 + olvido 3 + coste 3 = 9
- Estado: arreglado (2026-11-09).

### 7. La CA sin armadura solo se calcula si hay alguna armadura en el equipo
- Origen: 1a. Datos de la app (clases)
- Tipo: Fallo
- Qué pasa: `acOf` (`js/views/inventory.js:398`) solo recalcula la CA si el equipo tiene alguna armadura. Un bárbaro o monje sin armaduras no sube la CA al subir CON, DES o SAB, y un hechicero dracónico con CAR 16 se queda en CA 11 en vez de 14. Comprobado en la app.
- Qué debería pasar: la Defensa sin armadura (bárbaro, monje, hechicero dracónico; y bardo de la Danza) se calcula siempre.
- Propuesta: calcular la CA sin armadura aunque no haya armaduras en el equipo.
- Prioridad: frecuencia 3 + olvido 3 + coste 2 = 8
- Estado: arreglado (2026-11-09): también para el bardo de la Danza desde nivel 3.

### 8. Los efectos de 1 ronda acaban en el turno equivocado
- Origen: 1a. Datos de la app (conjuros)
- Tipo: Regla
- Qué pasa: `js/actions/combat.js:24`. La ventaja de Saeta guía se quita al terminar el mismo turno en que se lanza (comprobado), cuando dura hasta el final de tu siguiente turno. Escudo lanzado como reacción sigue visible todo tu turno siguiente, cuando acaba al empezarlo.
- Qué debería pasar: distinguir «hasta el final de tu siguiente turno» y «hasta el inicio de tu siguiente turno».
- Propuesta: guardar en el efecto en qué momento acaba (inicio o final de turno) y descontarlo en ese momento.
- Prioridad: frecuencia 3 + olvido 3 + coste 2 = 8
- Estado: arreglado en parte (2026-11-09): un efecto de 1 ronda lanzado en tu turno dura hasta el final de tu siguiente turno. Lo lanzado como reacción sigue quitándose al terminar tu siguiente turno: la app no sabe cuándo empieza tu turno, así que Escudo se sigue viendo durante ese turno.

### 9. El contador de invocaciones (y el de Metamagia) cuenta de más
- Origen: 1a. Datos de la app (clases)
- Tipo: Fallo
- Qué pasa: Zyo ve «Invocaciones 2 / 1» porque se cuenta también el rasgo «Invocaciones sobrenaturales» (`js/views/play.js:203,211`, `js/views/top.js:84`). Comprobado. Lo mismo pasa con Metamagia (`js/views/play.js:213`, `js/views/top.js:87`).
- Qué debería pasar: contar solo las invocaciones (u opciones de Metamagia) elegidas.
- Propuesta: contar solo los rasgos que empiezan por «Invocación:» (o «Metamagia:»).
- Prioridad: frecuencia 3 + olvido 1 + coste 3 = 7
- Estado: arreglado (2026-11-09).

### 10. El descanso corto termina Maleficio y Marca del cazador, y su duración no sube con el espacio
- Origen: 1a. Datos de la app (conjuros)
- Tipo: Regla
- Qué pasa: `js/actions/rest.js:86` y `js/views/play.js:341`. La app pone siempre 1 h y el descanso corto los quita aunque les quede tiempo. Con un espacio de nivel 2 Maleficio dura 4 h (8 h con nivel 3–4, 24 h con 5+). A Zyo le afectará a partir de nivel 3. Comprobado.
- Qué debería pasar: duración según el espacio, y que un descanso corto no los quite si les queda tiempo.
- Propuesta: duración por nivel de espacio en los datos; el descanso corto solo resta 1 h.
- Prioridad: frecuencia 2 + olvido 3 + coste 2 = 7
- Estado: arreglado (2026-11-09): Maleficio dura 4 h con espacio de nivel 2, 8 h con 3–4 y 24 h con 5+ (Marca del cazador, 8 h y 24 h). Los descansos restan su tiempo (1 h el corto, 8 h el largo) en vez de quitar todos los efectos de hasta 1 h.

### 11. Defensa paciente y Paso del viento siempre gastan 1 punto
- Origen: 1a. Datos de la app (clases)
- Tipo: Regla
- Qué pasa: en 2024 la versión básica (Destrabarse / Esquivar o Correr) es gratis como acción adicional; solo la versión mejorada gasta 1 punto de concentración. La app siempre gasta el punto.
- Qué debería pasar: ofrecer las dos versiones.
- Propuesta: dos botones (gratis / con punto).
- Prioridad: frecuencia 2 + olvido 2 + coste 3 = 7
- Estado: arreglado (2026-11-09): salen las dos versiones, la gratis y la de 1 punto.

### 12. Las armas de monje calculan con FUE en vez de la mejor entre FUE y DES
- Origen: 1a. Datos de la app (clases)
- Tipo: Regla
- Qué pasa: `js/views/inventory.js:204`. Las armas de monje (y el arma de pacto, ver n.º 3) usan la regla normal del arma. Además falta el ataque de golpe desarmado del monje con DES y su dado de Artes marciales.
- Qué debería pasar: el monje usa DES si es mejor y el dado de Artes marciales si es mayor.
- Propuesta: aplicarlo en el cálculo del ataque cuando el personaje tiene Artes marciales.
- Prioridad: frecuencia 2 + olvido 3 + coste 2 = 7
- Estado: arreglado (2026-11-09): las armas de monje usan la mejor entre FUE y DES y el dado de artes marciales si es mayor (sin armadura ni escudo). Falta aún el ataque de golpe desarmado como tal.

### 13. Los efectos de minutos u horas nunca bajan
- Origen: 1a. Datos de la app (conjuros)
- Tipo: Regla
- Qué pasa: solo los quitan los descansos. Los de 24 h o más se quedan hasta quitarlos a mano. Fuera de combate no hay forma de decir «han pasado 10 minutos».
- Qué debería pasar: poder hacer pasar el tiempo y que los efectos caduquen.
- Propuesta: botón «Pasa el tiempo» (10 min / 1 h) que descuente los efectos.
- Prioridad: frecuencia 2 + olvido 2 + coste 2 = 6
- Estado: arreglado (2026-11-10): en Vida y estado, fuera de combate, «Pasa el tiempo: 1 min · 10 min · 1 hora» descuenta los efectos y quita los que se acaban.

### 14. Protección contra el bien y el mal no es de concentración
- Origen: 1a. Datos de la app (conjuros)
- Tipo: Regla
- Qué pasa: tiene `"k":false` en `data/spells.js`. En 2024 es de concentración. Es el único conjuro con ese error. Comprobado.
- Qué debería pasar: que pida concentración.
- Propuesta: cambiar el dato.
- Prioridad: frecuencia 1 + olvido 2 + coste 3 = 6
- Estado: arreglado (2026-11-09).

### 15. Los conjuros de Arcano místico no se pueden lanzar
- Origen: 1a. Datos de la app (clases y conjuros)
- Tipo: Fallo
- Qué pasa: a un brujo de nivel 11 o más le sale «Sin espacios» en su conjuro de Arcano místico (`js/views/play.js:240`).
- Qué debería pasar: se lanza una vez por descanso largo sin gastar espacio.
- Propuesta: tratarlo como lanzamiento gratis con su uso.
- Prioridad: frecuencia 1 + olvido 3 + coste 2 = 6
- Estado: arreglado (2026-11-09): los conjuros de brujo de nivel 6 a 9 se lanzan gastando un uso de Arcano místico.

### 16. Hoja sedienta y Hoja devoradora suben los ataques con cualquier arma
- Origen: 1a. Datos de la app (invocaciones)
- Tipo: Regla
- Qué pasa: `js/views/turn.js:113-115`. Dan el ataque extra con cualquier arma, no solo con la de pacto.
- Qué debería pasar: solo con el arma de pacto.
- Propuesta: ligarlo al arma de pacto cuando exista (ver n.º 3).
- Prioridad: frecuencia 1 + olvido 2 + coste 3 = 6
- Estado: arreglado (2026-11-09): solo dan el ataque extra si tienes arma de pacto.

### 17. La maestría se activa en todas las armas, sin límite
- Origen: 1a. Datos de la app (objetos)
- Tipo: Regla
- Qué pasa: `js/views/inventory.js:121` y `js/features/shop.js:136`. No se respeta el número de armas de «Maestría con armas» de cada clase, y la dote Maestro de armas no activa ninguna (`js/views/inventory.js:187`).
- Qué debería pasar: elegir tantas armas como permita la clase (y la dote).
- Propuesta: marcar en cada arma si su maestría está elegida, con el tope por clase.
- Prioridad: frecuencia 2 + olvido 2 + coste 2 = 6
- Estado: arreglado (2026-11-10): `masteryMax()`: bárbaro y guerrero según el nivel; paladín, explorador y pícaro, 2; +1 con Maestro de armas. Las armas nuevas solo la activan si queda hueco, cada arma tiene un botón «Maestría» para cambiarla y la tarjeta avisa si hay más de las permitidas.

### 18. La competencia con algunas herramientas no se reconoce
- Origen: 1a. Datos de la app (origen)
- Tipo: Fallo
- Qué pasa: los trasfondos y dotes usan nombres distintos a los del inventario: «Útiles de caligrafía» (Acólito, Sabio, Escriba, `data/origins.js:58,69,71`) frente a «Suministros de calígrafo»; «Útiles de falsificación» (Charlatán, `data/origins.js:60`) frente a «Kit de falsificación»; «útiles de envenenador» (dote Envenenador, `data/feats.js:86`) frente a «Kit de envenenador». El inventario los marca «sin competencia» (visto en las fichas del mago y el paladín).
- Qué debería pasar: reconocer la competencia.
- Propuesta: unificar los nombres.
- Prioridad: frecuencia 1 + olvido 2 + coste 3 = 6
- Estado: arreglado (2026-11-09): los trasfondos y la dote usan los mismos nombres que el inventario, y las fichas antiguas se reconocen igual.

### 19. Lecciones de los Primeros no aplica las elecciones de la dote
- Origen: 1a. Datos de la app (invocaciones)
- Tipo: Fallo
- Qué pasa: `js/features/invocations.js:219-232`. La dote de origen se añade como texto, sin pedir sus elecciones (conjuros, habilidades, herramientas). Es el mismo problema que el n.º 2, por otra vía.
- Qué debería pasar: pedir las elecciones como al coger la dote a nivel 4.
- Propuesta: usar `featApply` también aquí.
- Prioridad: frecuencia 1 + olvido 3 + coste 2 = 6
- Estado: arreglado (2026-11-11): tras guardar las invocaciones (o subir de nivel), si la dote de Lecciones de los Primeros tiene elecciones, se abre una ventana para hacerlas y se aplica con `featApply` (`ivFeatAsk()`); al quitar la invocación se deshace con `featRemove`.

### 20. Desde Combate, lanzar como ritual solo gasta la acción
- Origen: 1a. Datos de la app (conjuros)
- Tipo: Regla
- Qué pasa: `js/actions/play.js:81`. Un ritual tarda 10 minutos más que el lanzamiento normal, así que en combate casi nunca se puede.
- Qué debería pasar: no ofrecer el ritual en combate, o avisar de los 10 minutos.
- Propuesta: aviso o quitar la opción con el combate en marcha.
- Prioridad: frecuencia 1 + olvido 2 + coste 3 = 6
- Estado: arreglado (2026-11-09): en combate no se ofrece el ritual y se avisa de que tarda 10 minutos más.

### 21. Armadura de mago lanzada sobre otra criatura sube tu CA
- Origen: 1a. Datos de la app (conjuros)
- Tipo: Fallo
- Qué pasa: `js/views/inventory.js:396`. Siempre se aplica a quien lo lanza.
- Qué debería pasar: preguntar el objetivo y solo subir tu CA si eres tú.
- Propuesta: pregunta «¿sobre ti?» al lanzarlo.
- Prioridad: frecuencia 1 + olvido 2 + coste 3 = 6
- Estado: arreglado (2026-11-09): pregunta si es sobre ti o sobre otra criatura; solo sube tu CA si es sobre ti.

### 22. Don de recuperación pierde la reserva de 10d10
- Origen: 1a. Datos de la app (origen)
- Tipo: Fallo
- Qué pasa: `js/core/rules.js:44`. El recurso se crea sin `pool`, así que no lleva la cuenta de los dados.
- Qué debería pasar: reserva de 10d10 que se gasta y se recupera en descanso largo.
- Propuesta: conservar `pool` al crear el recurso.
- Prioridad: frecuencia 1 + olvido 2 + coste 3 = 6
- Estado: arreglado (2026-11-09).

### 23. El druida de nivel 18 sigue sin poder lanzar conjuros en forma salvaje
- Origen: 1a. Datos de la app (clases)
- Tipo: Regla
- Qué pasa: `js/views/turn.js:169` bloquea siempre los conjuros en forma salvaje, aunque Conjuros bestiales (nivel 18) lo permite.
- Propuesta: no bloquearlos desde nivel 18.
- Prioridad: frecuencia 1 + olvido 2 + coste 3 = 6
- Estado: arreglado (2026-11-09).

### 24. Pasos de las hadas sale como «sin gastar acción»
- Origen: 1a. Datos de la app (clases)
- Tipo: Regla
- Qué pasa: no está en `WHEN`, así que no gasta la acción adicional que le toca. Además, el Paso brumoso gratis no está enlazado en `FREE_LINK`.
- Propuesta: añadirlo a `WHEN` como acción adicional y enlazarlo.
- Prioridad: frecuencia 1 + olvido 2 + coste 3 = 6
- Estado: arreglado (2026-11-09): gasta la acción adicional y el Paso brumoso gratis se enlaza al rasgo (en personajes nuevos o al subir de nivel).

### 25. La Furia no corta la concentración
- Origen: 1a. Datos de la app (clases)
- Tipo: Regla
- Qué pasa: al entrar en Furia no se quita la concentración ni se impide lanzar conjuros. La Furia tampoco crea un efecto con duración ni aplica daño extra o resistencias (ver candidatas en `INVENTARIO.md`).
- Propuesta: al usar Furia, terminar la concentración y crear el efecto.
- Prioridad: frecuencia 1 + olvido 2 + coste 3 = 6
- Estado: arreglado (2026-11-09): la Furia termina la concentración y crea el efecto «Furia» (10 minutos).

### 26. Se pide concentración por Marca del cazador al explorador de nivel 13
- Origen: 1a. Datos de la app (clases)
- Tipo: Regla
- Qué pasa: desde nivel 13 (Cazador implacable) el daño no rompe la concentración de Marca del cazador, pero la app pide la salvación igual.
- Propuesta: no pedirla desde nivel 13 si solo se concentra en Marca del cazador.
- Prioridad: frecuencia 1 + olvido 1 + coste 3 = 5
- Estado: arreglado (2026-11-09): al recibir daño se avisa de que Cazador implacable mantiene la concentración.

### 27. No se controla «un solo espacio de conjuro por turno»
- Origen: 1a. Datos de la app (conjuros)
- Tipo: Regla
- Qué pasa: en 2024 solo puedes gastar un espacio de conjuro por turno. La app deja gastar varios sin avisar.
- Propuesta: aviso al gastar un segundo espacio en el mismo turno.
- Prioridad: frecuencia 1 + olvido 2 + coste 2 = 5
- Estado: arreglado (2026-11-09): aviso al gastar un segundo espacio en el mismo turno.

### 28. Fallos menores varios
- Origen: 1a. Datos de la app
- Tipo: Fallo
- Qué pasa:
  - El ataque extra con arma ligera se puede usar sin haber atacado antes con un arma ligera.
  - La Lanza de caballería sale con la nota de Duelo.
  - Sentidos agudos del elfo no obliga a elegir de su lista.
  - El tamaño «M o P» se guarda tal cual, sin dejar elegir.
  - Las dotes con conjuros usan la aptitud mágica de la ficha en vez de la que dice la dote (`js/features/feats.js:311-312`).
  - La poción de invisibilidad no pone el estado «Invisible».
  - Polimorfar deja dos efectos con el mismo nombre.
- Propuesta: arreglarlos de uno en uno cuando se toque cada parte.
- Prioridad: frecuencia 1 + olvido 1 + coste 3 = 5
- Estado: arreglado (2026-11-11): arreglados seis de siete: el ataque extra con arma ligera pide haber atacado antes con un arma ligera; la Lanza de caballería ya no sale con Duelo; Sentidos agudos del elfo obliga a elegir de su lista; el tamaño «M o P» se elige en el asistente; la poción de invisibilidad pone Invisible; Polimorfar deja un solo efecto. Queda pendiente la aptitud mágica propia de cada dote (la ficha solo tiene una aptitud).

### 29. Astucia mágica no devuelve los espacios de pacto
- Origen: 1a. Datos de la app (clases)
- Tipo: Automatizar
- Qué pasa: el brujo de nivel 2 tiene el contador de Astucia mágica, pero gastarlo no le devuelve ningún espacio de pacto: hay que sumarlos a mano.
- Qué debería pasar: recuperar espacios de pacto hasta la mitad del máximo (redondeando hacia arriba), o todos a nivel 20.
- Propuesta: botón «Usar» junto al contador.
- Prioridad: frecuencia 3 + olvido 3 + coste 3 = 9
- Estado: arreglado (2026-11-09): botón «Usar» en Rasgos y dotes que gasta el uso y devuelve los espacios.

### 30. Duda para el máster: ¿dormir en un descanso largo rompe la concentración?
- Origen: arreglo del n.º 10
- Tipo: Regla
- Qué pasa: las reglas de 2024 no lo dejan del todo claro. Ahora la app resta 8 h a los efectos en el descanso largo, así que un Maleficio de 24 h sigue activo (con 16 h) después de dormir.
- Qué debería pasar: lo que diga el máster de Albert.
- Propuesta: si dice que dormir la rompe, terminar la concentración en el descanso largo (cambio pequeño).
- Prioridad: frecuencia 1 + olvido 2 + coste 3 = 6
- Estado: arreglado (2026-11-10): el máster de Albert dice que dormir **sí** rompe la concentración. La app ya lo hace así (`js/actions/rest.js:144`); no hace falta cambiar nada.
- Nota (prueba 1b, comprobado con `tests/reglas.js`): la app hace ya **lo contrario** de lo que dice «Qué pasa». `long-done` (`js/actions/rest.js:144`) pone `c.concentration = ''`, así que el descanso largo termina siempre la concentración: un efecto de concentración de 24 h desaparece al dormir. Lo que sí sigue (con 8 h menos) son los efectos de más de 8 h **sin** concentración. Si el máster dice que dormir **no** rompe la concentración, el cambio es quitar esa línea.

### 31. La reacción se recupera al terminar tu turno, no al empezar el siguiente
- Origen: 1b. Reglas generales
- Tipo: Regla
- Qué pasa: `t-end` (`js/actions/combat.js:19-21`) deja libres la acción, la acción adicional **y la reacción** al pulsar «Terminar turno». Ejemplo: Zyo se aleja de un enemigo en su turno, le hacen un ataque de oportunidad y responde con una reacción (Escudo, Represión infernal…). Al terminar su turno la app le devuelve la reacción, y podría usar otra antes de su siguiente turno. Al revés, si gasta la reacción en el turno de un enemigo, en su propio turno sale «Gastada» aunque ya la tiene.
- Qué debería pasar: la reacción se recupera al **empezar** tu turno.
- Propuesta: al pulsar «Terminar turno», dejar libres la acción y la adicional, y la reacción solo si no se ha gastado en este turno (o recuperarla al empezar el turno siguiente). El botón ↺ ya permite arreglarlo a mano.
- Prioridad: frecuencia 2 + olvido 2 + coste 3 = 7
- Estado: arreglado (2026-11-10): «Terminar turno» deja la reacción como estaba y marca la espera; vuelve sola en cuanto usas tu acción o tu acción adicional del turno siguiente (o con ↺). Mientras, la pastilla dice «Vuelve en tu turno».

### 32. Daño a 0 PG: no mira la muerte instantánea ni deja marcar el crítico
- Origen: 1b. Reglas generales
- Tipo: Regla
- Qué pasa: si ya estás a 0 PG y recibes daño igual o mayor que tus PG máximos, mueres. La app solo suma un fallo (comprobado con `tests/reglas.js`: Zyo, 10 PG máximos, 25 de daño a 0 PG → 1 fallo). Si el golpe es crítico son dos fallos, pero solo lo dice el texto: no hay forma de indicarlo.
- Qué debería pasar: con daño ≥ PG máximos estando a 0, avisar de la muerte; con un crítico, sumar dos fallos.
- Propuesta: en `hp` (`js/actions/play.js:249-254`), comprobar `rest >= c.hp.max` y añadir un botón «Era un crítico» en el mensaje que sume el segundo fallo.
- Prioridad: frecuencia 1 + olvido 2 + coste 3 = 6
- Estado: arreglado (2026-11-11): a 0 PG, un daño igual o mayor que tus PG máximos marca los 3 fallos y avisa de la muerte instantánea; si no, el aviso trae el botón «Era un crítico (+1 fallo)».

### 33. El descanso largo a 0 PG lo recupera todo
- Origen: 1b. Reglas generales
- Tipo: Regla
- Qué pasa: en 2024 hace falta tener al menos 1 PG al empezar el descanso largo para recibir sus beneficios. La app deja hacerlo a 0 PG y te deja con todos los PG (comprobado).
- Qué debería pasar: a 0 PG, avisar de que no recibe los beneficios (primero hay que curarse o estabilizarse y recuperar 1 PG).
- Propuesta: aviso en `longModal` (`js/actions/rest.js`) si `c.hp.current <= 0`.
- Prioridad: frecuencia 1 + olvido 2 + coste 3 = 6
- Estado: arreglado (2026-11-11): la ventana del descanso largo avisa si estás a 0 PG y el botón pasa a «Hacerlo igualmente» (por si el máster lo permite).

### 34. Escudo y armadura sin competencia
- Origen: 1b. Reglas generales
- Tipo: Regla
- Qué pasa: con un escudo sin competencia la app suma +2 a la CA y avisa con la regla de 2014 («desventaja en pruebas, salvaciones y ataques de FUE y DES, y no puedes lanzar conjuros»). En 2024, sin competencia con escudos **no ganas su bonificador a la CA**. Con armadura sin competencia el aviso es correcto, pero la app deja lanzar conjuros igual (comprobado: Zyo con escudo, CA 13 → 15 y puede lanzar Maleficio).
- Qué debería pasar: escudo sin competencia → sin +2 a la CA. Armadura sin competencia → no dejar lanzar (o avisar al lanzar).
- Propuesta: en `acCalc()` (`js/views/inventory.js:376-380`), no sumar el escudo sin competencia y cambiar el aviso; en `canCast()` o al lanzar, avisar si hay armadura sin competencia.
- Prioridad: frecuencia 1 + olvido 1 + coste 3 = 5
- Estado: arreglado (2026-11-11): un escudo sin competencia ya no suma a la CA (aviso nuevo). Con armadura sin competencia, al lanzar un conjuro sale un aviso y las tiradas de FUE y DES avisan de la desventaja. No se bloquea el lanzamiento.

### 35. Días sin comer: la app usa la regla de 2014 (por confirmar)
- Origen: 1b. Reglas generales
- Tipo: Regla
- Qué pasa: en el descanso largo, si no comes, la app aguanta «3 + CON días» y después suma 1 nivel de agotamiento por día (`js/actions/rest.js:155-163`). Esa es la regla de 2014. En el glosario de 2024 (Desnutrición) creo que es distinto: si comes menos de la mitad, salvación de CON CD 10 o 1 nivel de agotamiento al final del día; sin comer nada, agotamiento seguro desde el quinto día; y ese agotamiento no se quita hasta comer un día entero. El agua (Deshidratación) no aparece.
- Qué debería pasar: lo que diga el manual de 2024 (conviene confirmarlo antes de cambiar nada).
- Propuesta: confirmarlo con el manual y ajustar el texto y la cuenta.
- Prioridad: frecuencia 1 + olvido 1 + coste 3 = 5
- Estado: arreglado (2026-11-11): comprobado con las reglas de 2024 (Desnutrición y Deshidratación): sin comer nada, 1 nivel de agotamiento al final del quinto día y otro cada día después, y el descanso no lo quita. Entrada nueva «Comida y agua» en Reglas útiles. La salvación CD 10 por comer menos de la mitad y el agua quedan como texto.

### 36. Textos de estados y del glosario incompletos o de 2014
- Origen: 1b. Reglas generales
- Tipo: Regla
- Qué pasa (`CONDS` en `js/core/constants.js:35` y `data/glossary.js`):
  - **Derribado:** dice que los ataques cuerpo a cuerpo contra ti tienen ventaja. En 2024 es cualquier ataque a 5 pies o menos; los de más lejos, desventaja.
  - **Incapacitado:** falta que no puedes hablar (ni lanzar conjuros con componente verbal) y que tiras la iniciativa con desventaja.
  - **Inconsciente, Paralizado, Petrificado:** faltan velocidad 0, te atacan con ventaja y fallas las salvaciones de FUE y DES (Petrificado: inmune a veneno).
  - **Invisible:** falta la ventaja en la iniciativa.
  - **Inspiración heroica:** en 2024 sirve para repetir **cualquier dado**, no solo un d20.
  - **Ayudar:** mezcla las dos formas (para ayudar en una prueba necesitas competencia en esa habilidad; para un ataque, el enemigo tiene que estar a 5 pies de ti) y no dice que sirve para estabilizar (Medicina CD 10).
  - **Preparar:** no dice que un conjuro preparado gasta el espacio y pide concentración hasta que lo sueltas.
  - **Hendir** (glosario de armas): falta que el segundo ataque no suma el modificador al daño (en `MASTERY` sí está).
  - **Munición:** dice que tras el combate recuperas la mitad; vuestro máster no usa esa regla. Se podría quitar o poner «si el máster lo permite».
- Propuesta: corregir los textos (cambio pequeño, solo texto).
- Prioridad: frecuencia 2 + olvido 2 + coste 3 = 7
- Estado: arreglado (2026-11-10): textos corregidos de Derribado, Incapacitado, Inconsciente, Paralizado, Petrificado, Invisible, Inspiración heroica, Ayudar, Preparar, Hendir y Munición (ya no habla de recuperar la mitad).

### 37. La app no avisa de la ventaja o desventaja ni resta el agotamiento
- Origen: 1b. Reglas generales
- Tipo: Automatizar
- Qué pasa: los estados, el agotamiento y otras reglas cambian las tiradas, pero la app solo lo explica en notas aparte. Comprobado: atacando Envenenado, el mensaje del ataque dice «1d20 +1» sin mencionar la desventaja; con Agotamiento 1, Sigilo sigue saliendo «+4» y no «+2». Tampoco avisa de la desventaja con un arma Pesada y FUE < 13, ni de la ventaja o desventaja en la iniciativa (sorpresa, Invisible, Incapacitado).
- Qué debería pasar: que cada número que da la app (ataque, habilidad, salvación, iniciativa) diga «con ventaja» o «con desventaja» cuando toque y reste el agotamiento.
- Propuesta: una función `d20Notes(c, tipo)` que mire los estados (Envenenado, Asustado, Cegado, Derribado, Apresado, Invisible…), el agotamiento y el arma, y que la usen el mensaje del ataque, la ventana de habilidades y características y la de iniciativa. Al empezar el combate, preguntar «¿Te han sorprendido?».
- Prioridad: frecuencia 3 + olvido 3 + coste 2 = 8
- Estado: arreglado (2026-11-10): `d20Line()` y `d20Pen()` (`js/core/rules.js`). Ataques, trucos, habilidades, características, salvaciones, concentración e iniciativa avisan de ventaja o desventaja por estados y armas pesadas, y restan el agotamiento (también en las listas de habilidades y salvaciones). La sorpresa queda como aviso de texto al empezar el combate.

### 38. Los estados no bajan la velocidad a 0 ni dicen qué tirar
- Origen: 1b. Reglas generales
- Tipo: Automatizar
- Qué pasa: con Agarrado, Apresado, Paralizado, Petrificado o Inconsciente la velocidad de arriba sigue en 30 pies (comprobado); solo la nota del turno dice «velocidad 0». Agarrado dice «puedes usar una acción para intentar soltarte», pero no qué tirar.
- Qué debería pasar: velocidad 0 arriba mientras dure el estado, y en Agarrado o Apresado, «Para soltarte: FUE (Atletismo) +X o DES (Acrobacias) +Y».
- Propuesta: en `js/views/top.js:111`, poner 0 si hay uno de esos estados; en las notas de `viewTurn()`, añadir los bonificadores.
- Prioridad: frecuencia 2 + olvido 2 + coste 3 = 7
- Estado: arreglado (2026-11-10): `speedCalc()`: la velocidad de arriba es 0 con Agarrado, Apresado, Paralizado, Petrificado, Inconsciente y Aturdido. Agarrado dice qué tirar para soltarte (Atletismo o Acrobacias). Tocar la velocidad dice por qué es 0.

### 39. Esquivar, Esconderse, Correr, Buscar, Estudiar e Influir solo gastan la acción
- Origen: 1b. Reglas generales
- Tipo: Automatizar
- Qué pasa: los botones de «Otras acciones» (`t-gen`, `js/actions/combat.js:261`) gastan la acción y sacan el texto del glosario. Comprobado: Esquivar no crea ningún efecto y Esconderse no pone Invisible.
- Qué debería pasar:
  - **Esquivar:** un efecto «Esquivando» hasta el principio de tu siguiente turno.
  - **Esconderse:** decir qué tirar (Sigilo +X contra CD 15) y preguntar si lo has superado; si sí, poner Invisible.
  - **Correr:** «Este turno puedes moverte hasta N pies».
  - **Buscar, Estudiar e Influir:** enseñar los bonificadores de las habilidades que se pueden usar.
- Propuesta: un caso para cada una en `t-gen`, reutilizando `addEffect` y `skillB`.
- Prioridad: frecuencia 2 + olvido 2 + coste 3 = 7
- Estado: arreglado (2026-11-10): Esquivar crea el efecto «Esquivando», que se quita solo al empezar tu turno; Esconderse dice qué tirar (Sigilo contra CD 15) y pone Invisible si lo superas; Correr dice los pies; Buscar, Estudiar e Influir enseñan los bonificadores de sus habilidades.

### 40. El mensaje del ataque no dice qué tirar en un crítico
- Origen: 1b. Reglas generales
- Tipo: Automatizar
- Qué pasa: con un 20 natural se tiran el doble de dados de daño. Solo lo explica el glosario; el mensaje del ataque (`t-atk`) dice «Si impactas, daño: 1d8 + 3».
- Qué debería pasar: «Si impactas: 1d8 + 3 · con un 20: 2d8 + 3».
- Propuesta: duplicar los dados de `a.dmg` en el mensaje de `t-atk` y del ataque con arma ligera.
- Prioridad: frecuencia 2 + olvido 2 + coste 3 = 7
- Estado: arreglado (2026-11-10): los mensajes de ataque (armas, arma ligera, golpe desarmado y trucos de ataque) dicen el daño con un 20 natural.

### 41. No hay golpe desarmado para nadie
- Origen: 1b. Reglas generales
- Tipo: Automatizar
- Qué pasa: cualquiera puede dar un golpe desarmado (FUE + competencia al ataque, 1 + FUE de daño contundente). En la app solo están las opciones Agarrar y Empujar; el golpe para hacer daño no sale en Combate (el del monje con DES y su dado es el n.º 12).
- Qué debería pasar: un ataque «Golpe desarmado» siempre disponible en Combate.
- Propuesta: añadirlo junto a Agarrar y Empujar, calculado con FUE (o con lo del monje cuando se arregle el n.º 12).
- Prioridad: frecuencia 3 + olvido 2 + coste 3 = 8 (revisada en la prueba 1c; antes 1 + 2 + 3 = 6: el monje del grupo da golpes desarmados en cada turno con su dado de artes marciales y DES, y ahora no tiene ningún ataque con números para ello. De paso, el estilo Combate sin armas, 1d6/1d8 + FUE, tampoco tiene ataque)
- Estado: arreglado (2026-11-10): botón «Golpe desarmado» en Otras acciones (FUE + competencia, 1 + FUE). El monje sin armadura usa su mejor entre FUE y DES y su dado de artes marciales; con Combate sin armas, 1d6/1d8.

### 42. Faltan reglas comunes en el glosario
- Origen: 1b. Reglas generales
- Tipo: Mejora
- Qué pasa: estas reglas no salen en ningún sitio y un novato las tiene que buscar fuera: cobertura (+2, +5, total), atacar a largo alcance o a distancia con un enemigo a 5 pies (desventaja), terreno difícil, saltar, trepar y nadar, caídas, luz y oscuridad, sorpresa, estabilizar a un compañero, asfixia, descanso interrumpido, pruebas de grupo y la acción Magia.
- Qué debería pasar: poder consultarlas en la app, con los números del personaje cuando los haya (por ejemplo, «Salto de longitud: 8 pies con carrerilla; de altura: 2 pies»).
- Propuesta: añadir entradas a `GLOSS` y una lista «Reglas» (en Ajustes o en Combate) que las enseñe. Solo texto, barato.
- Prioridad: frecuencia 2 + olvido 3 + coste 3 = 8
- Estado: arreglado (2026-11-10): 13 entradas nuevas en `GLOSS` (cobertura, atacar a distancia, terreno difícil, saltar con los números del personaje, trepar y nadar, caídas, luz, sorpresa, estabilizar, asfixia, descanso interrumpido, pruebas de grupo y la acción Magia) y una tarjeta «Reglas útiles» al final de la pestaña Combate.

### 43. El ataque de oportunidad no dice con qué arma
- Origen: 1b. Reglas generales
- Tipo: Automatizar
- Qué pasa: el botón (`t-opp`, `js/actions/combat.js:269`) gasta la reacción y dice «Haz un ataque cuerpo a cuerpo». No dice qué tirar.
- Qué debería pasar: elegir el arma cuerpo a cuerpo (o golpe desarmado) y enseñar el ataque y el daño, como en «Atacar».
- Propuesta: si solo hay un arma cuerpo a cuerpo, usarla directamente; si hay varias, preguntar.
- Prioridad: frecuencia 2 + olvido 1 + coste 3 = 6
- Estado: arreglado (2026-11-11): el ataque de oportunidad deja elegir el arma cuerpo a cuerpo equipada (o el golpe desarmado) y enseña el ataque, el daño, el crítico y la maestría, como «Atacar».

### 44. Las salvaciones contra la muerte no se piden en el turno
- Origen: 1b. Reglas generales
- Tipo: Automatizar
- Qué pasa: a 0 PG el contador sale arriba de Combate, pero hay que acordarse de tirar al empezar el turno y de marcarlo con los rombos. Al llegar a tres éxitos solo dice «estable» (que recuperas 1 PG a las 1d4 horas no aparece).
- Qué debería pasar: al terminar el turno a 0 PG (o al empezar el siguiente), preguntar «¿Qué has sacado?» con botones (10 o más / menos de 10 / 1 / 20) y sumar solo el éxito o el fallo.
- Propuesta: en `t-end`, si `c.hp.current <= 0` y no está estable, abrir esa pregunta.
- Prioridad: frecuencia 1 + olvido 2 + coste 2 = 5
- Estado: arreglado (2026-11-11): al terminar el turno a 0 PG se abre «Salvación contra muerte» con botones (20 / 10 a 19 / 2 a 9 / 1) que suman el éxito o el fallo; los mismos botones están en la tarjeta de 0 PG. Estable explica lo de 1 PG en 1d4 horas y el daño hace volver a tirar.

### 45. Estallido arcano no dice qué tirar
- Origen: 1c. Priorizar (candidata de 1a: conjuros e invocaciones)
- Tipo: Automatizar
- Qué pasa: es el conjuro que Zyo usa casi cada turno, pero al lanzarlo la app solo gasta la acción. No dice el ataque de conjuro, ni «1d10 de fuerza», ni que a nivel 5, 11 y 17 lanza 2, 3 y 4 rayos (cada uno con su tirada de ataque). Las invocaciones que lo cambian son solo texto: Estallido agonizante (+CAR al daño de cada rayo), Estallido repulsor (empuja 10 pies) y Lanza arcana (más alcance).
- Qué debería pasar: al lanzarlo, «Haz N ataques de conjuro (1d20 + X). Cada rayo que impacte: 1d10 + CAR de fuerza», con lo que añadan las invocaciones que tenga.
- Propuesta: un caso especial al lanzarlo (como el de Falsa vida) que mire el nivel y las invocaciones. Se puede hacer a la vez que el n.º 46.
- Prioridad: frecuencia 3 + olvido 3 + coste 3 = 9
- Estado: arreglado (2026-11-10): al lanzarlo, la app dice cuántos rayos, el ataque y el daño de cada rayo, con Estallido agonizante, Estallido repulsor y Lanza arcana si los tiene.

### 46. Los trucos de daño no dicen qué tirar ni suben de dados con el nivel
- Origen: 1c. Priorizar (candidata de 1a: conjuros)
- Tipo: Automatizar
- Qué pasa: Toque gélido (Zyo), Descarga de fuego (mago) y los otros 12 trucos de daño (Llama sagrada, Rayo de escarcha, Agarre electrizante, Rociada venenosa, Burla cruel, Salpicadura ácida…) solo tienen el daño en la descripción. A nivel 5, 11 y 17 pasan de 1 a 2, 3 y 4 dados, y la app no lo dice. `data/spells.js` no tiene campos de daño.
- Qué debería pasar: al lanzarlo, «Ataque de conjuro 1d20 + X (o salvación de DES CD Y). Si impacta: 2d10 de fuego», con los dados ya subidos según el nivel.
- Propuesta: añadir a esos 14 trucos el dado, el tipo de daño y si es ataque o salvación, y una sola función que suba los dados en los niveles 5, 11 y 17.
- Prioridad: frecuencia 3 + olvido 3 + coste 2 = 8
- Estado: arreglado (2026-11-10): `CANTRIP_DMG` y `cantripRoll()` (`js/core/rules.js`) para 12 trucos de daño, más Golpe certero y Garrote; los dados suben a nivel 5, 11 y 17.

### 47. Los conjuros de daño con espacio no dicen qué tirar ni cuánto suben con un espacio mayor
- Origen: 1c. Priorizar (candidata de 1a: conjuros)
- Tipo: Automatizar
- Qué pasa: Proyectil mágico, Dormir, Manos ardientes, Onda atronadora, Represión infernal (Zyo), Golpe atrapador (explorador), Castigo divino, Orbe cromático… dicen el daño y la subida solo en el texto. 52 conjuros suben dados «por cada nivel de espacio por encima de N» y 19 añaden «una criatura más por nivel». La app ya sabe con qué espacio se lanza (`lastCastL`), pero no lo usa para esto.
- Qué debería pasar: «Con espacio de nivel 2: 4 dardos de 1d4 + 1 de fuerza» o «Con espacio de nivel 3: hasta 5 objetivos».
- Propuesta: empezar por lo barato: leer la frase de nivel superior (`hl`) y enseñarla ya calculada en el aviso de lanzar; después, dados y tipo en los conjuros de nivel 1 y 2 más usados.
- Prioridad: frecuencia 2 + olvido 3 + coste 2 = 7
- Estado: arreglado (2026-11-10): `upcastLine()` lee la frase de nivel superior de los datos y, al lanzar, dice el daño o la curación con los dados ya sumados según el espacio, y cuántos objetivos más. Proyectil mágico y Rayo abrasador dicen cuántos dardos o rayos.

### 48. Los conjuros de curación no dicen qué tirar ni suman los PG
- Origen: 1c. Priorizar (candidata de 1a: conjuros y clases)
- Tipo: Automatizar
- Qué pasa: Curar heridas y Palabra de curación (el explorador puede prepararlos) solo enseñan el texto: hay que calcular «2d8 + SAB por nivel de espacio» y sumar los PG a mano. Lo mismo con Auxilio (+5 PG máximos y actuales por 8 h, más con espacio mayor), Heroísmo (PG temporales cada turno) y Discípulo de la vida (clérigo de la Vida 3: +2 + nivel del espacio).
- Qué debería pasar: decir qué tirar con el espacio usado y preguntar el resultado para sumarlo a tus PG (o dejarlo apuntado si es para otro), como ya hace Falsa vida con los PG temporales.
- Propuesta: reutilizar la ventana de Falsa vida («tira X, escribe el resultado») con los dados de cada conjuro.
- Prioridad: frecuencia 2 + olvido 2 + coste 2 = 6
- Estado: arreglado (2026-11-10): al lanzar Curar heridas, Palabra de curación y similares, la app dice qué tirar según el espacio y el botón «Me curo a mí» suma el resultado + la aptitud. Auxilio, Heroísmo y Discípulo de la vida, pendientes.

### 49. El daño extra de Maleficio, Marca del cazador y similares no sale en los ataques
- Origen: 1c. Priorizar (candidata de 1a: conjuros)
- Tipo: Automatizar
- Qué pasa: mientras Maleficio (Zyo) o Marca del cazador (explorador) están activos, cada ataque que impacta al objetivo marcado hace 1d6 más. La app lleva el efecto y la concentración, pero el mensaje del ataque solo dice el daño del arma. Igual con Favor divino (+1d4 radiante), Castigo abrasador y Castigo resplandeciente (el primer impacto), Agrandar/reducir e Imponer maldición.
- Qué debería pasar: «Si impactas: 1d8 + 3 perforante · +1d6 de fuerza si es tu presa (Marca del cazador)».
- Propuesta: una pequeña lista «nombre del efecto → dado extra» que mire el mensaje del ataque (`t-atk`) mientras el efecto siga activo.
- Prioridad: frecuencia 3 + olvido 3 + coste 3 = 9
- Estado: arreglado (2026-11-10): con Maleficio, Marca del cazador o Favor divino activos, los mensajes de ataque (armas, golpe desarmado y trucos de ataque) añaden «Al impactar: +1d6…». Castigo abrasador y Castigo resplandeciente dicen el daño extra al lanzarlos. Agrandar/reducir e Imponer maldición quedan pendientes.

### 50. No se recuerda la salvación que se repite cada turno
- Origen: 1c. Priorizar (candidata de 1a: conjuros)
- Tipo: Automatizar
- Qué pasa: 25 conjuros dejan al objetivo repetir la salvación al final de cada turno o al recibir daño (Dormir, Risa horrible, Inmovilizar persona, Ceguera/sordera, Rayo debilitador, Castigo abrasador, Ralentizar…). La app lleva la concentración, pero no recuerda esa salvación ni su CD, y en la mesa se olvida a menudo. Además, 82 conjuros ponen un estado al objetivo; en el modo máster se podría marcar en el NPC.
- Qué debería pasar: al pulsar «Terminar turno» con uno de esos conjuros activo, un aviso: «Dormir: el objetivo repite la salvación de SAB (CD 13)».
- Propuesta: marcar en los datos los conjuros con salvación repetida y añadir el aviso en `t-end`. En el modo máster, más adelante.
- Prioridad: frecuencia 2 + olvido 3 + coste 2 = 7
- Estado: arreglado (2026-11-10): `REPEAT_SAVE` y `repeatSaves()`: al pulsar «Terminar turno» con uno de esos conjuros activo, un aviso «Recuerda al máster» con la característica, tu CD y cuándo se repite (15 conjuros: Dormir, Risa horrible, Inmovilizar persona, Ralentizar…). En el modo máster, pendiente.

### 51. Escudo, Escudo de la fe y otros conjuros no suben la CA
- Origen: 1c. Priorizar (candidata de 1a: conjuros)
- Tipo: Automatizar
- Qué pasa: Escudo (+5, el conjuro de reacción típico del mago), Escudo de la fe (+2), Vínculo protector (+1), Acelerar (+2) y Piel robliza (CA mínima 17) crean el efecto, pero la CA de arriba no cambia; solo lo hace Armadura de mago. Además Escudo acaba al empezar tu turno y la app lo deja hasta el final (lo que queda del n.º 8).
- Qué debería pasar: la CA de arriba sube mientras dure el efecto.
- Propuesta: generalizar lo de Armadura de mago con un campo de CA en el efecto (`+5`, `+2`, `mín. 17`).
- Prioridad: frecuencia 2 + olvido 2 + coste 3 = 7
- Estado: arreglado (2026-11-10): `SPELL_AC`: Escudo (+5), Escudo de la fe (+2), Acelerar (+2) y Piel robliza (mínimo 17) suben la CA de arriba mientras duran; pregunta sobre quién se lanzan. Escudo se quita solo al empezar tu turno (lo que quedaba del n.º 8). Vínculo protector no, porque siempre se lanza sobre otro.

### 52. Las resistencias de la especie no se guardan ni se recuerdan al recibir daño
- Origen: 1c. Priorizar (candidata de 1a: especies, linajes y conjuros)
- Tipo: Automatizar
- Qué pasa: Zyo resiste el daño necrótico (legado ctónico), pero solo lo dice el texto del rasgo: al recibir daño necrótico tiene que acordarse de pulsar «Resistencia (½)». Igual con el enano (veneno), el aasimar (necrótico y radiante), el dracónido (según su ascendencia), los otros legados tiefling, la Furia y conjuros como Resistencia, Protección contra energía o Piel pétrea.
- Qué debería pasar: la ficha sabe a qué resiste y, en la ventana de daño, se elige el tipo de daño (o se ve «Resistes: necrótico» junto al botón ½).
- Propuesta: guardar las resistencias en la ficha (de la especie, del linaje y de los efectos activos) y mostrarlas en la ventana de daño.
- Prioridad: frecuencia 2 + olvido 3 + coste 2 = 7
- Estado: arreglado (2026-11-10): `resistOf()` lee las resistencias de los rasgos (especie, linaje…), Furia, Piel pétrea y Petrificado, y la ventana de Vida y estado dice «Resistes: necrótico» junto al botón ½. Los conjuros con tipo elegido (Resistencia, Protección contra energía) siguen a mano.

### 53. Bendición, Perdición, Orientación y Resistencia: el ±1d4 no se recuerda
- Origen: 1c. Priorizar (candidata de 1a: conjuros)
- Tipo: Automatizar
- Qué pasa: mientras están activos, hay que acordarse de sumar 1d4 a los ataques y salvaciones (Bendición), a una prueba (Orientación) o de restarlo (Perdición, Resistencia). En el grupo no los tiene nadie ahora, pero son de los más usados por clérigos y druidas.
- Qué debería pasar: que los números de ataque, salvación y prueba digan «+1d4 (Bendición)» mientras dure el efecto.
- Propuesta: aprovechar la función de avisos del n.º 37.
- Prioridad: frecuencia 1 + olvido 3 + coste 2 = 6
- Estado: arreglado (2026-11-11): con Bendición, Perdición u Orientación activos, los avisos de ataque, salvación y prueba recuerdan el ±1d4. Resistencia (el truco) en 2024 resta daño, no va en las tiradas: queda fuera.

### 54. Los rasgos que curan o devuelven puntos no lo hacen
- Origen: 1c. Priorizar (candidata de 1a: clases y especies)
- Tipo: Automatizar
- Qué pasa: el botón gasta el uso, pero no dice qué tirar ni suma nada. En el grupo: **Metabolismo asombroso** (monje 2) debería devolver todos los puntos de concentración y curar «dado de artes marciales + nivel de monje». Fuera del grupo: Tomar aliento (guerrero), Imposición de manos (paladín; tampoco quita Envenenado con 5 PG), Luz sanadora (brujo celestial), Manos sanadoras (aasimar), Incansable (explorador 10) y Subidón de adrenalina (orco).
- Qué debería pasar: «Tira 1d6 + 2 y escribe el resultado» y sumar los PG (o los PG temporales); en Metabolismo, además, rellenar los puntos.
- Propuesta: la misma ventana del n.º 48; en Metabolismo, rellenar el contador de puntos.
- Prioridad: frecuencia 2 + olvido 3 + coste 2 = 7
- Estado: arreglado (2026-11-10): Metabolismo asombroso rellena los puntos de concentración y abre una ventana para escribir el dado de artes marciales; la app suma el nivel de monje (`healRoll()`, reutilizable). Los demás rasgos que curan, pendientes.

### 55. Recuperación arcana no deja elegir los espacios que recuperas
- Origen: 1c. Priorizar (candidata de 1a: clases)
- Tipo: Automatizar
- Qué pasa: el mago tiene el contador, pero al usarlo no recupera nada: hay que saber que son espacios cuyo nivel total no pasa de la mitad del nivel de mago (redondeando hacia arriba) y ninguno de nivel 6 o más, y marcarlos a mano. Lo mismo con Restauración hechicera (hechicero 5: puntos de hechicería).
- Qué debería pasar: en la ventana del descanso corto, casillas con los espacios gastados que se pueden recuperar, con el tope ya calculado.
- Propuesta: como el botón «Usar» de Astucia mágica (n.º 29), pero dejando elegir.
- Prioridad: frecuencia 2 + olvido 3 + coste 2 = 7
- Estado: arreglado (2026-11-10): botón «Usar» en Recuperación arcana: deja elegir qué espacios recuperar con el tope ya calculado. Restauración hechicera también tiene «Usar».

### 56. La velocidad no suma los rasgos que la suben
- Origen: 1c. Priorizar (candidata de 1a: clases)
- Tipo: Automatizar
- Qué pasa: Movimiento sin armadura (monje 2: +10 pies, más a niveles altos) sale en «Datos de clase», pero la velocidad de arriba no lo suma. Lo mismo con Movimiento rápido (bárbaro 5), Errante (explorador 6) y Aura de presteza (paladín de Gloria 7).
- Qué debería pasar: sumar los pies cuando se cumple la condición (sin armadura ni escudo para el monje; sin armadura pesada para el bárbaro), igual que ya se resta la armadura pesada sin FUE.
- Propuesta: añadirlo al cálculo de la velocidad de `js/views/top.js:111`.
- Prioridad: frecuencia 2 + olvido 2 + coste 3 = 7
- Estado: arreglado (2026-11-10): Movimiento sin armadura (monje), Movimiento rápido (bárbaro), Errante (explorador) y Aura de presteza suman a la velocidad de arriba cuando toca.

### 57. Golpe aturdidor no dice la CD
- Origen: 1c. Priorizar (candidata de 1a: clases)
- Tipo: Automatizar
- Qué pasa: el monje de nivel 5 tiene el botón, que gasta el punto y recuerda la salvación de CON, pero no dice la CD (8 + competencia + SAB). El máster la preguntará cada vez.
- Qué debería pasar: «El objetivo hace una salvación de CON CD 13 o queda aturdido».
- Propuesta: calcularla en el mensaje del botón. Lo mismo serviría para otras CD de rasgos (Arma de aliento, Canalizar divinidad, ver n.º 67).
- Prioridad: frecuencia 2 + olvido 2 + coste 3 = 7
- Estado: arreglado (2026-11-10): el botón de Golpe aturdidor dice la CD (8 + competencia + SAB) y qué pasa si la supera. Las CD de otros rasgos (n.º 67) siguen pendientes.

### 58. La salvación de concentración no avisa de la ventaja con Mente arcana o Lanzador de guerra
- Origen: 1c. Priorizar (candidata de 1a: invocaciones y dotes)
- Tipo: Automatizar
- Qué pasa: al recibir daño concentrado, la app pide la salvación de CON, pero no dice que se tira con ventaja si tienes la invocación Mente arcana (Zyo puede cogerla a nivel 2) o la dote Lanzador de guerra.
- Qué debería pasar: «Salvación de CON CD 10, con ventaja (Mente arcana)».
- Propuesta: una línea en el aviso de concentración (`js/actions/play.js`, al recibir daño).
- Prioridad: frecuencia 2 + olvido 2 + coste 3 = 7
- Estado: arreglado (2026-11-10): `concAdv()`: el aviso de concentración al recibir daño y el glosario dicen «con ventaja» con Mente arcana o Lanzador de guerra.

### 59. Los rasgos propios no pueden tener usos «igual a tu bonificador de competencia»
- Origen: 1c. Priorizar (candidata de 1a: dotes y origen)
- Tipo: Mejora
- Qué pasa: una dote casera como «Dote Superviviente» de Zyo se añade en «Editar ficha» con usos fijos (un número). Si sus usos dependen de la competencia o de una característica, hay que cambiarlos a mano al subir de nivel. Tampoco puede subir por sí sola una característica, los PG, la CA o la velocidad (se cambia a mano en los campos de la ficha).
- Qué debería pasar: poder elegir «usos = bonificador de competencia» (o «= modificador de…»), como las dotes del catálogo.
- Propuesta: añadir esa opción al formulario de rasgo. Cuando Albert pase el texto de la dote, ver si necesita algo más.
- Prioridad: frecuencia 1 + olvido 2 + coste 3 = 6
- Estado: arreglado (2026-11-11): en Editar ficha, cada rasgo tiene «Los usos son»: un número fijo, tu bonificador de competencia o tu modificador de una característica (mínimo 1). Se recalcula solo al subir de nivel (`usesSync()`). Subir características, PG, CA o velocidad desde un rasgo propio sigue a mano.

### 60. Los conjuros del catálogo que crean un arma no crean el ataque
- Origen: 1c. Priorizar (candidata de 1a: conjuros)
- Tipo: Automatizar
- Qué pasa: Arma espiritual, Hoja de fuego, Crear llama, Garrote y Golpe certero solo gastan la acción. Los conjuros propios ya pueden crear un ataque (`wpn`) que se quita al acabar el efecto.
- Qué debería pasar: al lanzarlos, aparece el ataque en Combate con sus números.
- Propuesta: dar el mismo dato `wpn` a esos 5 conjuros del catálogo.
- Prioridad: frecuencia 1 + olvido 2 + coste 3 = 6
- Estado: arreglado (2026-11-11): `CAT_WPN`: Arma espiritual, Hoja de fuego, Crear llama y Garrote crean su ataque en Combate con sus números (según el espacio o el nivel) y se quita al acabar el conjuro. Golpe certero ya dice qué tirar al lanzarlo.

### 61. Las maestrías de arma no dan sus números
- Origen: 1c. Priorizar (candidata de 1a: objetos)
- Tipo: Automatizar
- Qué pasa: al atacar sale el texto de la maestría, pero no el número: Rozar (al fallar, daño igual a tu modificador), Derribar (CD 8 + modificador + competencia), Molestar (ventaja en tu siguiente ataque contra esa criatura), Hendir (el segundo ataque, sin modificador al daño) y Mellar (el ataque extra ligero pasa a la acción de Atacar en vez de gastar la acción adicional). El explorador del grupo usa maestrías en cada ataque. El tope de armas por clase es el n.º 17.
- Qué debería pasar: el mensaje del ataque dice el número exacto («Si fallas: 3 de daño (Rozar)»; «Derribar: salvación de CON CD 13»).
- Propuesta: calcularlo en el mensaje del ataque; Mellar, en el botón del ataque ligero.
- Prioridad: frecuencia 2 + olvido 2 + coste 2 = 6
- Estado: arreglado (2026-11-10): `masteryLine()`: el mensaje del ataque da los números de Rozar (daño al fallar), Derribar (CD) y Hendir (ataque y daño del segundo golpe). Con Mellar, el ataque extra ligero no gasta la acción adicional (una vez por turno).

### 62. El asistente no pregunta Pericia ni las órdenes de nivel 1
- Origen: 1c. Priorizar (candidata de 1a: clases)
- Tipo: Mejora
- Qué pasa: Pericia (explorador 2 con Explorador hábil, mago 2 con Erudito, pícaro 1, bardo 2), Orden divino (clérigo 1) y Orden primigenio (druida 1) son solo texto: hay que marcarlo a mano en «Editar ficha». Al explorador y al mago del grupo les tocará a nivel 2. Las dotes de origen y el trasfondo propio son los n.º 2, 4 y 19.
- Qué debería pasar: al crear o subir de nivel, el asistente pide las habilidades con pericia (o la opción de orden) y las aplica.
- Propuesta: un paso nuevo en el asistente y al subir de nivel.
- Prioridad: frecuencia 1 + olvido 3 + coste 2 = 6
- Estado: arreglado (2026-11-11): pasos nuevos en el asistente (al crear y al subir de nivel): «Pericia» (pícaro, bardo, Explorador hábil, Erudito del mago con su lista) y «Orden divino»/«Orden primigenio», que apuntan las competencias, el truco extra y el bonificador de SAB a las habilidades (`skillPlus`). Los idiomas de Explorador hábil siguen a mano.

### 63. Faltan contadores de subclase y algunos lanzamientos gratis sin enlazar
- Origen: 1c. Priorizar (candidata de 1a: clases)
- Tipo: Automatizar
- Qué pasa: unos 25 rasgos con usos no tienen contador: Emboscador terrible (explorador Acechador 3), Destello protector (clérigo de la Luz 3), Restaurar el equilibrio (hechicero mecánico 3), Guerrero de los dioses (bárbaro fanático 3), Corcel fiel (paladín 5), Plenitud corporal (monje de la Mano Abierta 6) y otros de nivel alto. Contactar con el patrón (brujo 9) gasta espacio de pacto porque no está enlazado al conjuro.
- Qué debería pasar: cada uno con su contador y su recuperación; los lanzamientos gratis, enlazados.
- Propuesta: solo datos en `data/classes.js` y `FREE_LINK` (`js/core/rules.js:73`).
- Prioridad: frecuencia 1 + olvido 2 + coste 3 = 6
- Estado: arreglado (2026-11-11): contadores nuevos: Emboscador terrible, Destello protector, Restaurar el equilibrio, Plenitud corporal, Guerrero de los dioses (d12) y Corcel fiel; Encontrar montura y Contactar con otro plano quedan enlazados a su uso gratis. Los de nivel alto restantes, pendientes. Se crean al subir de nivel (las fichas ya subidas, a mano).

### 64. Al tirar iniciativa no se recuerdan los rasgos que se usan en ese momento
- Origen: 1c. Priorizar (candidata de 1a: clases)
- Tipo: Automatizar
- Qué pasa: el aviso de «Empezar combate» dice «Iniciativa: 1d20 + DES» (y suma Alerta), pero no recuerda lo que se usa al tirarla: Metabolismo asombroso (monje 2), Emboscador terrible (+SAB, explorador Acechador 3), Furia persistente (bárbaro 15), Inspiración superior (bardo 18)… Para la ventaja o desventaja (sorpresa, Invisible, Incapacitado) ver el n.º 37.
- Qué debería pasar: el mismo aviso añade «Puedes usar ahora: Metabolismo asombroso».
- Propuesta: una lista de rasgos «al tirar iniciativa» que se enseñan si tienen usos libres.
- Prioridad: frecuencia 2 + olvido 3 + coste 3 = 8
- Estado: arreglado (2026-11-10): al empezar el combate, el aviso lista los rasgos cuyo texto habla de la iniciativa, con sus usos.

### 65. El mago no tiene libro de conjuros
- Origen: 1c. Priorizar (candidata de 1a: clases)
- Tipo: Mejora
- Qué pasa: al preparar conjuros, el mago elige de toda la lista de mago, no de los que tiene en su libro. Ritualista (lanzar como ritual los del libro aunque no estén preparados) no se puede usar. Copiar conjuros al libro (tiempo y oro) tampoco aparece.
- Qué debería pasar: el mago tiene su libro (6 conjuros a nivel 1, +2 por nivel y los que copie) y prepara de ahí.
- Propuesta: una lista «Libro» en Magia para el mago; preparar y los rituales salen de ella. Es un cambio grande.
- Prioridad: frecuencia 2 + olvido 2 + coste 1 = 5
- Estado: arreglado (2026-11-11): el mago tiene «Libro» en Magia (`c.book`): se apuntan sus conjuros, avisa si faltan (6 al empezar y 2 por nivel), preparar solo ofrece los del libro y los rituales del libro sin preparar se lanzan desde «Rituales de tu libro». Copiar conjuros (tiempo y oro) queda como texto: el oro lo resta el jugador.

### 66. Golpe arcano y Bebedor de vida no dicen qué tirar
- Origen: 1c. Priorizar (candidata de 1a: invocaciones)
- Tipo: Automatizar
- Qué pasa: son invocaciones del Pacto del Filo que Zyo podrá coger a nivel 5 (Golpe arcano) y 9 (Bebedor de vida). Golpe arcano gasta un espacio de pacto al impactar con el arma de pacto para hacer (1 + nivel del espacio)d8 de fuerza y derribar; Bebedor de vida suma 1d6 y deja gastar un dado de golpe para curarse. Ahora son solo texto.
- Qué debería pasar: tras atacar con el arma de pacto, un botón que gaste el espacio y diga qué tirar.
- Propuesta: opción «Golpe arcano» junto al ataque del arma de pacto; el 1d6 de Bebedor de vida, en el mensaje del ataque (como el n.º 49).
- Prioridad: frecuencia 2 + olvido 2 + coste 2 = 6
- Estado: arreglado (2026-11-10): al atacar con el arma de pacto, si tienes Golpe arcano y espacios de pacto, botón «Usar Golpe arcano» que gasta el espacio y dice los d8; Bebedor de vida sale como recordatorio en el mensaje.

### 67. Rasgos de clases y especies que no están en el grupo
- Origen: 1c. Priorizar (candidatas de 1a: clases, especies y dotes)
- Tipo: Automatizar
- Qué pasa: solo texto o a medias, pero de uso constante para quien los tenga: Ataque furtivo del pícaro (una vez por turno), daño y resistencias de la Furia del bárbaro, Hechicería innata, Aprendiz de todo del bardo, Aura de protección del paladín (CAR a las salvaciones), dados y CD de Canalizar divinidad, Bendición del oscuro (brujo infernal), Arma de aliento del dracónido (CD y daño por nivel), Aguante incansable del orco al caer a 0 PG, ventaja del gnomo en salvaciones mentales, maniobras del Maestro de batalla, Mano sanadora y Mano dañina (monje de la Misericordia), Voto de enemistad, Apuntar con calma, Portento (apuntar los números sacados) y Crítico mejorado.
- Qué debería pasar: cada uno, sus números en el momento de usarlo.
- Propuesta: dejarlo para cuando alguien del grupo juegue una de esas clases o especies (o el monje elija la Misericordia), y hacerlos de uno en uno.
- Prioridad: frecuencia 1 + olvido 3 + coste 1 = 5
- Estado: arreglado (2026-11-11): hechos los que se resuelven con un número en el momento: Ataque furtivo y daño de Furia en el mensaje del ataque, ventaja de la Furia en FUE, Aura de protección sumada a las salvaciones, Aprendiz de todo sumado a las habilidades, CD y daño del Arma de aliento, Aguante incansable al caer a 0 PG, Astucia gnómica en las salvaciones mentales y Crítico mejorado o superior en el aviso del crítico. Pendientes (cuando alguien juegue esas clases): Hechicería innata, Canalizar divinidad, Bendición del oscuro, maniobras del Maestro de batalla, monje de la Misericordia, Voto de enemistad, Apuntar con calma y Portento.

### 68. No hay reacciones que resten daño
- Origen: 1c. Priorizar (candidata de 1a: clases y dotes)
- Tipo: Automatizar
- Qué pasa: Desviar ataques (monje 3: resta 1d10 + DES + nivel de monje) y, fuera del grupo, Esquiva asombrosa (pícaro 5: la mitad), Duelista defensivo, Intercepción, Protección, Maestro en armadura pesada y Aguante de piedra (goliat) se aplican de memoria: hay que restar el daño antes de escribirlo y marcar la reacción.
- Qué debería pasar: en la ventana de daño, un botón por reacción que gaste la reacción y pregunte lo sacado (o divida a la mitad).
- Propuesta: añadirlos junto a «Resistencia (½)».
- Prioridad: frecuencia 2 + olvido 2 + coste 2 = 6
- Estado: arreglado (2026-11-10): en la ventana de daño, botones de reacción para Desviar ataques (1d10 + DES + nivel), Esquiva asombrosa (½) y Aguante de piedra (1d12 + CON): restan el daño, gastan la reacción y aplican el resto. Duelista defensivo, Intercepción, Protección y Maestro en armadura pesada, pendientes.

### 69. Duelo y Combate con armas arrojadizas no suman el +2 al daño
- Origen: 1c. Priorizar (candidata de 1a: estilos de combate)
- Tipo: Automatizar
- Qué pasa: los dos estilos salen como nota en el arma; el daño del ataque no incluye el +2. El explorador elegirá estilo a nivel 2.
- Qué debería pasar: sumar el +2 cuando se cumpla la condición (Duelo: un arma cuerpo a cuerpo en una mano y ninguna otra arma).
- Propuesta: en `wpnCalc()`, como ya se hace con otros estilos.
- Prioridad: frecuencia 1 + olvido 2 + coste 3 = 6
- Estado: arreglado (2026-11-11): `styleLines()`: el mensaje del ataque dice el daño ya sumado con Duelo («si no llevas otra arma en la otra mano») y con Armas arrojadizas («si la lanzas»). No se suma solo porque la app no sabe qué llevas en cada mano.

### 70. Las componentes verbal y somática no se ven
- Origen: 1c. Priorizar (candidata de 1a y 1b: conjuros)
- Tipo: Mejora
- Qué pasa: el dato `v` del conjuro no se copia a la ficha, así que no se ve qué conjuros necesitan hablar o mover las manos. Importa al estar amordazado, Incapacitado, en Silencio o con las dos manos ocupadas (Zyo con su arma de pacto y otra cosa en la mano).
- Qué debería pasar: ver «V, S, M» en cada conjuro y un aviso si un estado te impide lanzarlo.
- Propuesta: copiar el campo al añadir el conjuro y enseñarlo en Magia.
- Prioridad: frecuencia 1 + olvido 2 + coste 3 = 6
- Estado: arreglado (2026-11-11): cada conjuro del catálogo dice en Magia «necesita voz, gestos, material». Sin aviso automático por estados: Silencio y las manos ocupadas no se pueden saber.

### 71. No hay estado «Muerto»
- Origen: 1c. Priorizar (candidata de 1b)
- Tipo: Mejora
- Qué pasa: con tres fallos de salvación contra la muerte, con muerte instantánea o con agotamiento 6, la app solo enseña un aviso; la ficha sigue como si nada.
- Qué debería pasar: marcar al personaje como muerto (bloquear Combate y explicar qué hacer: conjuros que devuelven la vida, hablar con el máster).
- Propuesta: un estado «Muerto» que se ponga solo en esos casos y se pueda quitar a mano.
- Prioridad: frecuencia 1 + olvido 1 + coste 3 = 5
- Estado: arreglado (2026-11-11): `isDead()`: con tres fallos a 0 PG, muerte instantánea o agotamiento 6, Combate enseña «Tu personaje ha muerto» en vez del turno, con la explicación y un botón para corregirlo.

### 72. Preparar no reserva la reacción
- Origen: 1c. Priorizar (candidata de 1b)
- Tipo: Automatizar
- Qué pasa: el botón Preparar gasta la acción, pero no deja apuntar qué se ha preparado ni gasta después la reacción. El texto incompleto es parte del n.º 36.
- Qué debería pasar: al preparar, escribir el disparador («si se acerca, le ataco») y que salga un botón en Reacción para hacerlo; con un conjuro, gastar el espacio y pedir concentración.
- Propuesta: guardar el disparador en el turno y mostrarlo en la columna de Reacción hasta el siguiente turno.
- Prioridad: frecuencia 1 + olvido 2 + coste 3 = 6
- Estado: arreglado (2026-11-11): Preparar pide qué preparas y lo deja en la columna de Reacción con el botón «Hacerlo» (gasta la reacción); se pierde al empezar tu siguiente turno.

### 73. Más reglas que faltan en el glosario (segunda tanda)
- Origen: 1c. Priorizar (candidatas de 1b)
- Tipo: Mejora
- Qué pasa: además de las del n.º 42, no aparecen: interactuar gratis con un objeto (desenfundar o envainar al atacar), armas improvisadas, inmunidad, volar (caes si quedas derribado o con velocidad 0), tamaño y espacio (pasar por el espacio de otra criatura), viajar a ritmo rápido, normal o lento, visión ciega, sentido sísmico y visión verdadera, el agua (deshidratación), un solo descanso largo cada 24 horas, dejar inconsciente en vez de matar, combate montado y bajo el agua, y la Percepción pasiva con ventaja (+5) o desventaja (−5). La Inspiración heroica tampoco dice que, si ya la tienes y ganas otra, se la puedes dar a otro jugador.
- Qué debería pasar: poder consultarlas en la app.
- Propuesta: hacerlo junto con el n.º 42 (solo texto).
- Prioridad: frecuencia 2 + olvido 2 + coste 3 = 7
- Estado: arreglado (2026-11-10): 11 entradas nuevas en `GLOSS` y en «Reglas útiles» (interactuar con un objeto, armas improvisadas, resistencia e inmunidad, volar, tamaño y espacio, viajar, sentidos especiales, dejar inconsciente, combate montado y bajo el agua) y el ±5 de la Percepción pasiva. Comida y agua no, hasta confirmar la regla de 2024 (n.º 35).

### 74. No se cuenta el movimiento del turno
- Origen: 1c. Priorizar (candidata de 1b)
- Tipo: Mejora
- Qué pasa: la velocidad sale arriba, pero no cuánto te queda en el turno. Hay que llevar la cuenta de cabeza al moverte antes y después de atacar, al levantarte (la mitad), con terreno difícil (el doble) o al Correr (el doble de pies).
- Qué debería pasar: en Combate, «Te quedan 15 de 30 pies», con botones de 5 pies y reinicio al terminar el turno.
- Propuesta: un contador sencillo en el turno. Opcional: muchas mesas lo cuentan en el tablero.
- Prioridad: frecuencia 3 + olvido 1 + coste 2 = 6
- Estado: arreglado (2026-11-10): contador «Movimiento: te quedan X de Y pies» en el turno, con −5, −10, ↺ y «Levantarse» si estás derribado. Correr y Paso del viento suman otra vez la velocidad; se reinicia al terminar el turno.

### 75. Los objetos no tienen peso
- Origen: 1c. Priorizar (candidata de 1b)
- Tipo: Automatizar
- Qué pasa: la capacidad de carga (FUE × 15 libras) y empujar, arrastrar o levantar (FUE × 30) no aparecen, y `data/items.js` no tiene pesos.
- Qué debería pasar: si el máster usa la carga, ver el peso total y el límite.
- Propuesta: añadir pesos a los objetos y un total en el inventario. Solo si el máster usa esta regla (muchas mesas no).
- Prioridad: frecuencia 1 + olvido 1 + coste 1 = 3
- Estado: arreglado (2026-11-11): `WEIGHT` y `carryInfo()`: la ventana de Objetos dice el peso que llevas frente a lo que puedes cargar (FUE × 15), contando armas, armaduras, equipo del catálogo, pociones, munición y monedas, y cuántos objetos no tienen peso conocido. Entrada «Peso y carga» en Reglas útiles con los números del personaje. Los demás objetos no tienen peso (no hay campo para escribirlo todavía).

### 76. Las armas arrojadizas no se descuentan al lanzarlas
- Origen: 1c. Priorizar (candidata de 1a: objetos)
- Tipo: Automatizar
- Qué pasa: al atacar lanzando una daga, una jabalina o un hacha de mano, el arma sigue en la mano en la ficha.
- Qué debería pasar: descontarla al lanzarla, como la munición. Recogerla después la suma el jugador (como la munición, ver n.º 80).
- Propuesta: tratar las armas arrojadizas apiladas (varias dagas) como la munición al elegir «lanzar».
- Prioridad: frecuencia 1 + olvido 2 + coste 2 = 5
- Estado: arreglado (2026-11-11): las armas arrojadizas cuerpo a cuerpo (daga, jabalina, hacha de mano…) tienen botón «Lanzar» en Combate: descuenta una y, si era la última, deja de salir en Combate. Recogerla la suma el jugador.

### 77. Bayas nutritivas no crea las bayas
- Origen: 1c. Priorizar (candidata de 1a: conjuros)
- Tipo: Automatizar
- Qué pasa: el explorador del grupo tiene este conjuro. Al lanzarlo, la app crea un efecto de 24 h, pero no las 10 bayas (cada una cura 1 PG y alimenta un día). Además, los efectos de 24 h no bajan solos (n.º 13).
- Qué debería pasar: 10 bayas en el inventario como consumible, que curan 1 PG al comerlas y sirven de comida en el descanso largo.
- Propuesta: crear el objeto al lanzarlo y quitarlo al acabar el efecto.
- Prioridad: frecuencia 1 + olvido 2 + coste 2 = 5
- Estado: arreglado (2026-11-11): al lanzar Bayas nutritivas aparecen 10 bayas en la mochila y en Combate (acción adicional: comer una cura 1 PG), sirven de comida en el descanso largo y desaparecen con el efecto de 24 horas.

### 78. Los conjuros de invocar criaturas que no están en el SRD no se enlazan con su ficha
- Origen: 1c. Priorizar (candidata de 1a: conjuros)
- Tipo: Automatizar
- Qué pasa: las fichas de Invocar bestia, feérico, muerto viviente, elemental, constructo, aberración, celestial e infernal ya existen en `data/creatures.js`, pero esos conjuros no están en el catálogo. Si el jugador los crea como conjuro propio, no sale «Crear la criatura».
- Qué debería pasar: un conjuro propio con ese nombre se enlaza solo con su ficha de criatura.
- Propuesta: buscar la plantilla por nombre al lanzar un conjuro propio.
- Prioridad: frecuencia 1 + olvido 1 + coste 3 = 5
- Estado: arreglado (2026-11-11): un conjuro propio que se llame como una invocación del catálogo de criaturas (Invocar bestia, feérico…) saca el botón «Crear la criatura».

### 79. Fallos menores (segunda tanda)
- Origen: 1c. Priorizar (vistos de paso en 1a y 1b)
- Tipo: Fallo
- Qué pasa:
  - Prestidigitación crea siempre un efecto de 1 hora, aunque se use una opción instantánea.
  - Piedad con los moribundos no dice que su alcance sube con el nivel.
  - Al druida del Círculo de la Luna transformado le salen todos sus conjuros, aunque el aviso dice que solo puede lanzar los de su círculo.
  - Un arma a dos manos y un escudo equipados a la vez no dan ningún aviso.
  - La propiedad Recarga no limita a un disparo por acción con Ataque adicional.
- Propuesta: arreglarlos de uno en uno cuando se toque cada parte.
- Prioridad: frecuencia 1 + olvido 1 + coste 3 = 5
- Estado: arreglado (2026-11-11): Prestidigitación ya no crea efecto; Piedad con los moribundos dice su alcance según el nivel; al druida de la Luna transformado solo le salen los conjuros de su círculo; escudo + arma a dos manos equipados avisan; Recarga limita a un disparo por acción con esa arma (salvo Experto en ballestas).

### 80. Recuperar la munición y las armas lanzadas automáticamente
- Origen: 1c. Priorizar (candidata de 1a: objetos, y 1b)
- Tipo: Automatizar
- Qué pasa: la regla del manual dice que tras el combate recuperas la mitad de la munición gastada, y las armas arrojadizas se pueden recoger.
- Qué debería pasar: nada nuevo. El máster de Albert no usa la regla de la mitad: la app solo descuenta al disparar y lo recuperado lo suma el jugador (botón «Recuperar 1»). El texto del glosario se corrige en el n.º 36.
- Propuesta: ninguna.
- Prioridad: no se puntúa
- Estado: descartado (choca con la idea de la app: lo recuperado lo suma el jugador)

### 81. Que la app tire los dados o decida si un ataque impacta
- Origen: 1c. Priorizar (idea que sale al automatizar daño, curación, salvaciones contra la muerte, Portento o la recarga del Arma de aliento)
- Tipo: Automatizar
- Qué pasa: varias candidatas de 1a y 1b serían más cómodas si la app tirase el dado (el daño de un conjuro, la curación, la salvación contra la muerte) o comparase la tirada con la CA del enemigo.
- Qué debería pasar: nada nuevo. La app está pensada para dados físicos: dice qué tirar y pregunta el resultado (como hace Falsa vida). Todas las propuestas de esta lista se han escrito así.
- Propuesta: ninguna.
- Prioridad: no se puntúa
- Estado: descartado (choca con la idea de la app: no tira dados)

### 82. Los PG máximos no suben cuando sube la Constitución
- Origen: Prueba 2a
- Tipo: Regla
- Qué pasa: al subir de nivel, la app suma los PG con el modificador de CON que tenías **antes** de la mejora de ese nivel, y nunca repasa los niveles anteriores. Si con la Mejora de característica (o con una dote que da +1 a CON) el modificador sube, se pierden PG: 1 por cada nivel que tengas, incluido el de la mejora. Sale en las 48 tandas de `tests/clases.js` (816 de 960 niveles). Ejemplos: guerrero con CON 14 → 16 a nivel 4: 36 PG en la app y 40 según las reglas; clérigo de la Luz a nivel 19: 169 y 192. Tampoco cambian los PG si se cambia la CON a mano en «Editar ficha».
- Qué debería pasar: cuando el modificador de CON sube 1, los PG máximos (y los actuales) suben 1 por nivel; si baja, bajan.
- Propuesta: en `applyWizard()`, después de aplicar la mejora o la dote, comparar el modificador de CON de antes y de después y sumar la diferencia × nivel a `hp.max` y `hp.current` (lo mismo en `featApply()`/`featRemove()` fuera del asistente). En «Editar ficha», al cambiar la CON, avisar con un toast que ofrezca ajustar los PG.
- Prioridad: frecuencia 2 + olvido 3 + coste 3 = 8
- Estado: arreglado (2026-11-12): al subir la CON con una mejora o una dote, los PG suben 1 por nivel (y bajan si se quita la dote); el resumen del asistente lo muestra. En «Editar ficha», al cambiar la CON sale un aviso que ofrece ajustar los PG.

### 83. El mago tiene menos conjuros preparados de la cuenta desde el nivel 14
- Origen: Prueba 2a
- Tipo: Regla
- Qué pasa: `data/classes.js` usa para el mago la misma tabla de conjuros preparados que para el bardo, el clérigo y el druida. La del mago es distinta desde el nivel 14: 18, 19, 21, 22, 23, 24 y 25 (niveles 14 a 20), y la app pone 17, 18, 18, 19, 20, 21 y 22. El contador «Conjuros preparados X/Y» y los avisos del asistente salen con hasta 3 de menos. Las demás tablas (trucos, preparados, espacios, magia de pacto, dados de golpe, niveles de mejora y usos de los recursos principales) coinciden con el manual.
- Qué debería pasar: mago 14 → 18 preparados, 15 → 19, 16 → 21, 17 → 22, 18 → 23, 19 → 24, 20 → 25.
- Propuesta: darle al mago su propia lista `prepared` en `data/classes.js`.
- Prioridad: frecuencia 1 + olvido 2 + coste 3 = 6
- Estado: arreglado (2026-11-12): el mago tiene su propia tabla de conjuros preparados.

### 84. Una invocación repetible se puede volver a elegir aunque no quede truco para ella
- Origen: Prueba 2a
- Tipo: Mejora
- Qué pasa: Estallido agónico, Lanza arcana y las demás invocaciones que se aplican a un truco se pueden coger una vez por truco. Si el brujo solo tiene un truco que sirva (lo normal: Estallido arcano) y ya la tiene, el botón «Elegir» sigue activo: al pulsarlo se añade otra copia con el desplegable «Truco» vacío, y «Siguiente» se queda bloqueado con «elige el truco» hasta que la quitas. Visto al subir a nivel 15 con dos brujos.
- Qué debería pasar: si no queda ningún truco libre para esa invocación, el botón sale apagado con el motivo («Ya la tienes en todos tus trucos»).
- Propuesta: en `ivWhyNot()`, para las invocaciones repetibles con `need`, mirar si queda algún truco sin usar por otra copia.
- Prioridad: frecuencia 1 + olvido 2 + coste 3 = 6
- Estado: pendiente

### 85. El asistente deja elegir conjuros que ya te da la especie, la subclase o una dote
- Origen: Prueba 2a
- Tipo: Mejora
- Qué pasa: en el paso «Conjuros» se puede elegir un conjuro que el personaje va a tener gratis. Al confirmar, la app lo marca bien como de la especie o «Siempre preparado» y deja de contar en el límite, pero el jugador se queda con una elección de menos sin enterarse. Ejemplos: clérigo aasimar que elige Luz como truco (acaba con 3 trucos de 4); brujo del Primigenio que tenía Risa horrible y a nivel 3 pasa a tenerla siempre preparada (3 conjuros de 4).
- Qué debería pasar: que el buscador del asistente no ofrezca (o marque como «ya lo tienes gratis») los conjuros de la especie, del linaje y de la subclase; y si un conjuro elegido pasa a ser gratis, avisar al confirmar de que queda un hueco para preparar otro.
- Propuesta: en el paso «Conjuros», apagar en la lista los de `originSpellIds()` y `alwaysIds()` hasta ese nivel; al confirmar, un aviso «Te queda 1 conjuro por elegir» con el botón de preparar.
- Prioridad: frecuencia 1 + olvido 2 + coste 2 = 5
- Estado: pendiente

### 86. Añadir un «Paquete de equipo» da error y no se puede deshacer
- Origen: Prueba 2b
- Tipo: Fallo
- Qué pasa: en Objetos → «Añadir objeto» → Tipo «Paquete de equipo (añade su contenido)» → «Añadir», el contenido del paquete se añade a la mochila, pero la app da un error por dentro (`js/actions/inventory.js:209` usa `P.n`, y `P` es el buscador de conjuros, que está vacío). Por ese error no sale el aviso «Añadido todo su contenido a la mochila» y el cambio **no se apunta en «Deshacer»**: si pulsas «Deshacer» para quitar el paquete, se deshace lo anterior que hubieras hecho. Con una ficha recién importada o creada, lo anterior es la propia importación y la ficha desaparece (ver n.º 90). Sale con cualquier ficha y cualquier paquete. Cómo se repite: importar `monje.json` → Objetos → «Añadir objeto» → Tipo: Paquete de equipo → «Añadir» (consola: `TypeError: Cannot read properties of null (reading 'n')`). Con el guion: `node tests/azar.js --ficha=monje --semilla=3 --solo=azar` (paso 255).
- Qué debería pasar: el paquete se añade, sale el aviso con su nombre y «Deshacer» lo quita.
- Propuesta: en `item-add`, guardar el nombre antes de vaciar `NI` (`PACKS[NI.pack || 'explorer'].n`) y usarlo en el aviso en vez de `P.n`.
- Prioridad: frecuencia 1 + olvido 3 + coste 3 = 7
- Estado: pendiente

### 87. Un nivel de conjuro negativo o con decimales deja en blanco «Partida» y «Combate»
- Origen: Prueba 2b
- Tipo: Fallo
- Qué pasa: en «Editar ficha», el campo «Nivel (0 = truco)» de un conjuro acepta cualquier número. Con uno negativo (−1, −5) o con decimales (2.5), las pestañas «Partida» y «Combate» dejan de pintarse (error en `slotOptions()`, `js/views/play.js:325`: busca un espacio de un nivel que no existe). Queda guardado: al recargar, la app arranca con la pantalla en blanco bajo la cabecera, y hay que volver a Ajustes → «Editar ficha» para corregir el número. Un nivel mayor que 9 no da error. Cómo se repite: importar `monje.json` → Ajustes → Editar ficha → «Añadir conjuro a mano» → Nivel = −1 → «Partida». También pasa con un conjuro del catálogo (Zyo, primer conjuro, nivel −5).
- Qué debería pasar: el nivel de un conjuro solo puede ser un entero de 0 a 9; lo demás se corrige solo.
- Propuesta: en el manejador de `data-path` de `events.js`, redondear y limitar `spells.N.level` a 0–9 (y lo mismo en `normalize()`); además, que `slotOptions()` no falle si el nivel no existe.
- Prioridad: frecuencia 1 + olvido 2 + coste 3 = 6
- Estado: pendiente

### 88. Un número enorme de espacios o de dados de golpe cuelga la app
- Origen: Prueba 2b
- Tipo: Fallo
- Qué pasa: los espacios de conjuro, los espacios de pacto y los dados de golpe se pintan con una casilla por cada uno. «Editar ficha» acepta cualquier número: con 3000 espacios de nivel 1 la pestaña «Partida» tiene más de 4000 elementos; con 999999 (un dedo que se queda en el 9, o pegar un número en el campo equivocado) la pestaña del navegador se queda colgada más de 20 segundos y puede romperse por falta de memoria. Como el número queda guardado y «Partida» es la primera pantalla, la app se cuelga también al volver a abrirla. Con 999999 dados de golpe se cuelga al abrir «Vida y estado». Cómo se repite: importar `zyo.json` → Ajustes → Editar ficha → «Espacios de pacto» = 999999 → «Partida» (o «Nº dados de golpe» = 999999 → pulsar los PG).
- Qué debería pasar: esos campos tienen un tope razonable (9 espacios por nivel bastan; 20 dados de golpe) y un número mayor se recorta.
- Propuesta: limitar `slots.N.total`, `pact.total`, `pact.level` (0–9), `hitDice.total` (0–20) y `features.N.uses.max` al escribirlos y en `normalize()`; y que las funciones que pintan casillas no pinten más de, por ejemplo, 30.
- Prioridad: frecuencia 1 + olvido 1 + coste 3 = 5
- Estado: pendiente

### 89. «Editar ficha» acepta números imposibles sin avisar
- Origen: Prueba 2b
- Tipo: Mejora
- Qué pasa: los campos numéricos de «Editar ficha» guardan lo que se escriba, sin límites. No dan error (salvo los n.º 87 y 88), pero dejan la ficha con datos imposibles que luego confunden: PG actuales por encima del máximo (999999 de 10) o negativos; PG máximos vacíos, negativos o con decimales; dados de golpe negativos o con decimales; espacios y usos negativos; cantidades de objetos negativas; características negativas o de 999999 (la app calcula con ellas modificadores de +499994). El nivel sí se limita a 1–20, pero admite decimales: con 2.5, Ajustes dice «Asistente para pasar a nivel 3.5». Además, al vaciar la Constitución o ponerla a 0, el aviso de ajustar los PG calcula con 0 (−5) pero «Ajustar los PG» la pone a 10. La lista completa sale en las notas del informe de `tests/azar.js` (casos aparte).
- Qué debería pasar: cada campo se queda dentro de lo que tiene sentido: características 1–30, nivel entero 1–20, PG actuales entre 0 y el máximo, PG máximos de 1 o más, cantidades y usos de 0 o más, todo sin decimales.
- Propuesta: una tabla de límites por `data-path` en el manejador de `input` de `events.js` (redondear y recortar al salir del campo, no mientras se escribe), con `min`, `max` y `step` en los `<input>`; y los mismos límites en `normalize()` para lo importado.
- Prioridad: frecuencia 1 + olvido 2 + coste 2 = 5
- Estado: pendiente

### 90. «Deshacer» puede quitar la ficha recién importada o creada
- Origen: Prueba 2b
- Tipo: Mejora
- Qué pasa: importar una ficha, crear una (con el asistente o vacía) y borrar un personaje se apuntan en «Deshacer» como cualquier otro cambio. Si después de importar o crear pulsas «Deshacer» una vez de más (o lo pulsas porque algo no se deshizo, como en el n.º 86), la ficha entera desaparece; si era la única, la app vuelve a la pantalla de bienvenida, y queda guardado así (al recargar no vuelve). No hay «Rehacer». Al revés, la ventana de borrar un personaje dice «No se puede deshacer», pero el botón «Deshacer» sí lo recupera mientras no se recargue la página. Cómo se repite: importar `monje.json` → «Deshacer» → pantalla de bienvenida, 0 fichas. O: Personajes → «Crear ficha vacía» → «Deshacer» → la ficha nueva desaparece.
- Qué debería pasar: «Deshacer» sirve para los cambios dentro de una ficha; importar y crear una ficha no deberían poder perderse con un toque. El texto de borrar debería decir lo que pasa de verdad.
- Propuesta: vaciar la pila `UNDO` al importar, al crear y al cambiar de ficha (como ya se hace al escribir en «Editar ficha»). Para borrar, o se vacía también (y el texto es cierto), o se cambia el texto por «Puedes recuperarla con Deshacer hasta que cierres la app».
- Prioridad: frecuencia 1 + olvido 2 + coste 3 = 6
- Estado: pendiente

### 91. En «Editar ficha», los cambios en un conjuro del catálogo no se conservan
- Origen: Prueba 2b
- Tipo: Mejora
- Qué pasa: los conjuros añadidos desde el buscador enseñan en «Editar ficha» los mismos campos que los hechos a mano (nivel, tiempo, alcance, duración, material, concentración, ritual), y se pueden cambiar. Pero la app los vuelve a poner como en el catálogo sin avisar: el material, al recargar la página (`normalize()`); el nivel, y la concentración o el ritual si se desmarcan, y el alcance o la duración si se vacían, al exportar e importar la ficha (`fillFromRef()`). Hasta entonces la ficha guarda el valor cambiado. Algo parecido pasa con los objetos: si cambias el «Tipo» de un objeto a «arma», al recargar aparece además como equipado. Y un conjuro hecho a mano que se llame igual que uno del catálogo queda enlazado con él al recargar. Cómo se repite: Zyo → Editar ficha → Maleficio → Material = «Prueba» y desmarcar Concentración → recargar (vuelve el material) → exportar e importar (vuelve la concentración).
- Qué debería pasar: o los campos que manda el catálogo no se pueden tocar (solo las «Notas propias»), o lo que el jugador cambie se respeta.
- Propuesta: en `viewEdit()`, para los conjuros con `ref`, enseñar esos datos como texto fijo y dejar editables solo el nombre y las notas, con una pista: «Para cambiar sus datos, crea un conjuro propio».
- Prioridad: frecuencia 1 + olvido 2 + coste 3 = 6
- Estado: pendiente

### 92. Quitar una dote con conjuros no quita la aptitud mágica que puso
- Origen: Prueba 2b
- Tipo: Fallo
- Qué pasa: si un personaje que no lanza conjuros (el monje) coge en la ventana «Dotes» una dote con conjuros (visto con Lanzador de rituales; por el código, lo mismo con cualquier dote con conjuros que suba Inteligencia, Sabiduría o Carisma, como Toque feérico), la app le pone como aptitud mágica la característica elegida. Al quitar la dote se van los conjuros y los usos, pero la aptitud mágica se queda («int»). La app sigue tratándolo como lanzador (`ftCtx().caster`), lo que puede cambiar qué dotes le deja coger después, y «Editar ficha» enseña una aptitud mágica que no usa. En el resto de las 119 pruebas de añadir y quitar una dote (las cuatro fichas, a nivel 1 y a nivel 8), no se ha visto ninguna otra diferencia. Cómo se repite: monje a nivel 4 o más → Dotes → Lanzador de rituales (Inteligencia y los dos primeros conjuros) → «Añadir dote» → «Quitar» → Editar ficha → Aptitud mágica: Inteligencia.
- Qué debería pasar: al quitar la dote, la aptitud mágica vuelve a «Ninguna» si la puso esa dote.
- Propuesta: apuntar en el registro de la dote (`rec`) que fijó la aptitud (`rec.cast = true`) y, en `featRemove()`, vaciarla si no quedan conjuros ni otra dote que la necesite.
- Prioridad: frecuencia 1 + olvido 1 + coste 3 = 5
- Estado: pendiente

### 93. Quitar de la mesa al jugador al que le toca para el combate del máster
- Origen: Prueba 2c
- Tipo: Fallo
- Qué pasa: en el modo máster, si se quita un jugador («Quitar jugador» en su pestaña) justo cuando le toca, sale de la lista de combate pero nadie pasa a tener el turno (`m-del-ok` no mueve `MST.fight.cur`, a diferencia de la «×» de la lista, que sí lo hace). El combate deja de contar como empezado: desaparece «Siguiente turno», vuelve a salir «Empezar combate», y al pulsarlo la ronda vuelve a 1 (en la prueba estaba en la 6). Cómo se repite: modo máster con 2 jugadores y un NPC → Combate → «Añadir jugadores», iniciativas, «Empezar combate» → «Siguiente turno» hasta que le toque a un jugador → pestaña de ese jugador → «Quitar jugador» → Combate. Con el guion: `node tests/master.js` (paso «combate · quitar de la mesa al jugador del turno»).
- Qué debería pasar: el turno pasa al siguiente de la lista y la ronda sigue igual, como al quitarlo con la «×».
- Propuesta: en `m-del-ok`, antes de filtrar la lista, hacer lo mismo que `m-rm` con el turno (o llamar a una función común).
- Prioridad: frecuencia 1 + olvido 2 + coste 3 = 6
- Estado: pendiente

### 94. «Deshacer» tras generar el recibo descuadra la tienda del máster
- Origen: Prueba 2c
- Tipo: Fallo
- Qué pasa: al generar el recibo, las líneas se marcan «ya en un recibo» y eso se apunta en «Deshacer». Si el jugador pulsa «Deshacer» después (por ejemplo, para cerrar algo o por error), las líneas pierden la marca y vuelven a tener «Anular». Si anula una compra que el máster ya ha aplicado y luego compra otra cosa, el recibo nuevo tiene el mismo número de líneas que el anterior y el máster lo rechaza («Recibo ya aplicado»): `rcptApply()` solo cuenta cuántas líneas de esa visita ha aplicado (`applied[sesión] = n`), no cuáles. La tienda del máster se queda con la compra anulada y sin la nueva, y el dinero del vendedor no cuadra (en la prueba, 5350 pc en el máster y 4950 en el jugador); el jugador recupera el dinero de lo anulado aunque el máster lo tenga cobrado. Cómo se repite: Zyo entra en una tienda → compra un kit de sanador → «Generar recibo» → el máster lo aplica → Zyo pulsa «Deshacer» → «Anular» el kit → compra flechas → «Generar recibo» → el máster lo pega: «Recibo ya aplicado».
- Qué debería pasar: lo que ya está en un recibo no se puede anular, ni siquiera con «Deshacer»; o, si se anula, el siguiente recibo lo deshace en el máster.
- Propuesta: dar a cada línea del registro su propio id y que el máster guarde los ids aplicados (`applied[sesión] = [ids]`); y que generar el recibo no se pueda deshacer (vaciar `UNDO` al generarlo, como al escribir en «Editar ficha»).
- Prioridad: frecuencia 1 + olvido 2 + coste 2 = 5
- Estado: pendiente

### 95. Anular la venta de toda la munición deja el arma sin munición
- Origen: Prueba 2c
- Tipo: Fallo
- Qué pasa: al vender todas las unidades de una munición (por ejemplo, las 20 flechas del explorador), la app quita el enlace de munición del arco (`shTake()`). Al anular la venta, las flechas vuelven a la mochila, pero el arco sigue sin munición enlazada (solo se recuperan los ataques que son ese mismo objeto, no los que la usaban como munición), y al disparar ya no se descuentan. No se arregla al recargar. Cómo se repite: importar `explorador.json` → entrar en una tienda → Vender «Flechas» ×20 → «Anular» → Combate: el Arco largo no tiene munición.
- Qué debería pasar: anular la venta deja todo como estaba, también el enlace del arco con sus flechas.
- Propuesta: en `shTake()`, guardar los ids de los ataques cuya munición era ese objeto y, en `sh-undo`, volver a ponérsela.
- Prioridad: frecuencia 1 + olvido 2 + coste 3 = 6
- Estado: pendiente

### 96. Un código de criatura sin el «#cr=» entra como un jugador nuevo
- Origen: Prueba 2c
- Tipo: Fallo
- Qué pasa: «Copiar código» de una criatura copia el enlace entero (`…#cr=…`) y así funciona. Pero si se pega solo el código (por ejemplo, porque el jugador lo recorta o lo pasa por un chat que corta el enlace), `qrKind()` prueba primero `sheetParse()`, que acepta cualquier cosa con id, 6 características y salvaciones, y la criatura se añade a la mesa como si fuera un jugador más (con pestaña propia), en vez de ir con su dueño. Pasa en «+ Jugador → O pega su código» y en «Escanear → Pega el código». Cómo se repite: mago con un familiar → Criaturas → «QR para el máster» → «Copiar código» → pegar en «+ Jugador» solo lo que va después de `#cr=` → «Jugador añadido: Plumas».
- Qué debería pasar: el código se reconoce como criatura y va a su jugador.
- Propuesta: que `sheetParse()` rechace los códigos con `t` (las criaturas llevan `t: 'c'`, las tiendas `'s'` y los recibos `'r'`), o que `qrKind()` mire `t` antes.
- Prioridad: frecuencia 1 + olvido 1 + coste 3 = 5
- Estado: pendiente

### 97. Comprar un objeto que la app del jugador no conoce cobra y no da el objeto
- Origen: Prueba 2c
- Tipo: Fallo
- Qué pasa: los objetos del catálogo viajan en la tienda solo con su código (`w:dagger`, `p:healing`…). Si la app del jugador no conoce el código (por ejemplo, el máster ya tiene una versión nueva con objetos nuevos y el móvil del jugador aún no se ha actualizado), la tienda lo enseña como «Objeto» y, al comprarlo, la app da un error (`shGive()`, `js/features/shop.js:140`, en armas; con otros tipos puede pasar algo parecido) **después** de cobrar: el dinero se descuenta, pero el objeto no llega a la mochila ni al registro, y no sale en el recibo. Cómo se repite (con un código hecho a mano): abrir la app del jugador con `#tienda=` de una tienda que tenga el objeto `w:noexiste` → Comprar (consola: `Cannot read properties of undefined (reading 'am')`).
- Qué debería pasar: el objeto se compra como uno inventado (con su nombre) o no deja comprarlo; nunca cobrar sin dar el objeto.
- Propuesta: que `shopPayload()` mande también el nombre y el tipo de los objetos del catálogo, y que `shopParse()` convierta en `x` (inventado) los códigos que no existan; en `shBuy()`, cobrar después de `shGive()`.
- Prioridad: frecuencia 1 + olvido 1 + coste 3 = 5
- Estado: pendiente

### 98. Pegar un recibo en «+ Jugador» dice que el código no es válido
- Origen: Prueba 2c
- Tipo: Mejora
- Qué pasa: el máster tiene dos sitios para pegar códigos: «+ Jugador → O pega su código» y «Escanear o importar recibo → ¿No se lee? Pega el código». El primero solo acepta jugadores y criaturas: con un recibo (o una tienda) dice «Ese código no es válido. Pídele al jugador que lo copie de nuevo (⚙ Ajustes → Compartir con el máster)», que despista (el código está bien). El aviso del jugador al copiar el recibo («Código copiado. Pásaselo al máster») no dice dónde se pega.
- Qué debería pasar: cualquier código de Fichas 5e pegado en cualquiera de los dos sitios hace lo que toca (como ya hace el escáner).
- Propuesta: en `m-paste`, si `qrKind()` reconoce el código, llamar a `qrRun()` sea del tipo que sea; y que el aviso del recibo diga «lo pega en Tiendas → Escanear o importar recibo».
- Prioridad: frecuencia 1 + olvido 2 + coste 3 = 6
- Estado: pendiente

### 99. La iniciativa de los monstruos del bestiario es solo la Destreza (por confirmar)
- Origen: Prueba 2c
- Tipo: Regla
- Qué pasa: al añadir un NPC del bestiario, la app le pone como bonificador de iniciativa el modificador de DES (`bestIni()`), y lo mismo enseña la ficha del monstruo. En las fichas de 2024 (SRD 5.2) cada criatura trae su iniciativa, y muchas suman su competencia una o dos veces: por ejemplo, el Aboleth (DES 9) tiene +7 y la app dice −1; el Dragón rojo adulto (DES 10), +12 y la app dice +0. Para los monstruos de nivel bajo (goblins, lobos, bandidos) suele coincidir. Hay que confirmarlo con el JSON del SRD de 5e-database (si trae la iniciativa).
- Qué debería pasar: la iniciativa de cada criatura la de su ficha de 2024.
- Propuesta: que `tools/bestiario/gen.py` guarde la iniciativa del SRD en cada criatura (`ini`) y que `bestIni()` la use si existe (y la DES si no).
- Prioridad: frecuencia 1 + olvido 3 + coste 2 = 6
- Estado: pendiente

### 100. Fallos menores del modo máster y de los códigos
- Origen: Prueba 2c
- Tipo: Fallo
- Qué pasa (todos poco probables en la mesa; salen con códigos hechos a mano, cortados o de otra versión):
  - Un recibo con una línea que no es una lista (`l: [5]` o `[null]`) da un error en `rcptApply()` y no avisa de nada.
  - Una ficha `#pj` con menos de 6 salvaciones se añade a la mesa y su ventana enseña «Salv. NaN».
  - Abrir un enlace `#pj=` roto (cortado, mal copiado) en un dispositivo que no está en modo máster no avisa de nada: la app se abre como si no hubiera enlace. Los demás tipos (`#cr`, `#tienda`, `#recibo`) y el modo máster sí avisan («Ese código no es de Fichas 5e»).
  - En la lista de combate del máster, los PG de un NPC pueden quedar negativos (−4) si se escribe así; en las reglas los PG no bajan de 0.
- Qué debería pasar: los códigos raros se rechazan con un aviso; los PG se quedan en 0.
- Propuesta: en `rcptParse()`, quedarse solo con las líneas que sean listas; en `sheetParse()`, exigir 6 salvaciones; en `masterHash()`, si el `#pj` no es válido, llamar a `qrRun(null)`; en el manejador de `data-mf`, no dejar PG por debajo de 0.
- Prioridad: frecuencia 1 + olvido 1 + coste 3 = 5
- Estado: pendiente
