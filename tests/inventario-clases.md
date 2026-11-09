# Inventario: rasgos de clase y subclase

Prueba 1a (parte de clases) · 2026-11-09 · solo lectura, no se ha tocado la app.

Recorre los 386 rasgos de `data/classes.js` (12 clases, 48 subclases, niveles 1–20) y dice, para cada uno, si la app lo **hace sola**, lo hace **a medias** o **solo enseña el texto**.

## Cómo se ha hecho

1. `node tests/inventario-clases.js` hace la primera criba: busca el nombre de cada rasgo en `js/`, mira si tiene recurso con usos (`res`) y qué claves de clase o subclase compara el código.
2. Después se ha leído a mano el código que toca rasgos: `js/views/turn.js` (Combate), `js/actions/combat.js`, `js/core/rules.js`, `js/features/wizard.js`, `js/views/inventory.js` (CA y armas), `js/features/creatures.js` (Forma salvaje, compañeros), `js/actions/rest.js` y `js/views/play.js`. Algunos casos dudosos se han comprobado en la app con Playwright (servidor en el puerto 8781).
3. La clasificación final está dentro del guion (`CLASIF`) y las tablas de abajo salen con `node tests/inventario-clases.js --md`, así que si se arregla algo basta con cambiar esa línea y volver a sacarlas.

Qué significa cada estado:

- **Sola**: la app lo aplica por su cuenta (contador con usos y recuperación, CA, PG, ataques por acción, conjuros siempre preparados, efecto con duración, opción en Combate que hace algo…).
- **Parcial**: hace algo, pero falta una parte importante de la regla de 2024 (se dice cuál).
- **Solo texto**: solo sale la descripción; el jugador lo lleva de memoria. Muchos son reglas que se aplican al tirar (ventaja, sumar un dado, repetir una tirada) y es normal que se queden así; los que se notarían en partida están en «Candidatas».

**Los datos en sí están bien.** Se han comparado con el Manual de 2024: niveles de cada rasgo, niveles de subclase y de mejora, dados de golpe, salvaciones, usos de Furia, Canalizar divinidad, Forma salvaje, Tomar aliento, Oleada de acción, Indómito, puntos de concentración y de hechicería, dados de superioridad y psiónicos, Marca del cazador gratis, tablas de daño de furia, dado de inspiración, artes marciales, movimiento sin armadura, ataque furtivo, maestrías, invocaciones, metamagias, trucos y conjuros preparados, y espacios (completos, medios, tercios y de pacto). No hay ningún número mal.

## 1. Resumen

| Clase | Rasgos | Sola | Parcial | Solo texto | Niv. 1–5: Sola / Parcial / Texto |
|---|---|---|---|---|---|
| Bárbaro | 35 | 2 | 2 | 31 | 2 / 2 / 10 |
| Bardo | 26 | 3 | 4 | 19 | 2 / 2 / 8 |
| Clérigo | 28 | 5 | 2 | 21 | 5 / 1 / 10 |
| Druida | 30 | 7 | 1 | 22 | 7 / 1 / 6 |
| Guerrero | 35 | 11 | 4 | 20 | 5 / 3 / 6 |
| Monje | 38 | 1 | 6 | 31 | 1 / 6 / 9 |
| Paladín | 35 | 9 | 3 | 23 | 9 / 3 / 5 |
| Explorador | 35 | 9 | 1 | 25 | 8 / 0 / 7 |
| Pícaro | 36 | 4 | 2 | 30 | 3 / 2 / 11 |
| Hechicero | 30 | 5 | 4 | 21 | 5 / 4 / 4 |
| Brujo | 31 | 7 | 9 | 15 | 6 / 3 / 3 |
| Mago | 27 | 1 | 4 | 22 | 0 / 3 / 10 |
| **Total** | **386** | **64** | **42** | **280** | **53 / 30 / 89** |

En números redondos: de cada 10 rasgos, la app hace sola menos de 2, a medias 1 y los otros 7 son solo texto. En niveles 1–5 la cosa mejora (53 de 172 los hace sola) porque ahí están los contadores básicos (Furia, Canalizar divinidad, Forma salvaje, Tomar aliento…), los ataques por acción, los espacios y los conjuros siempre preparados.

Por clase:

- **Mejor cubiertos:** guerrero (contadores, estilo de combate y ataques por acción), druida (Forma salvaje está muy completa), paladín y explorador (conjuros de juramento y lanzamientos gratis enlazados), brujo (invocaciones y magia de pacto).
- **Peor cubiertos:** monje (casi todo depende de puntos de concentración, golpes desarmados y velocidad, que no se calculan), bárbaro (la Furia solo cuenta usos) y pícaro (Ataque furtivo y Pericia, que son su base, no salen en Combate ni en el asistente).
- **Lo que más se repite como «Parcial»:** rasgos con contador cuyo botón gasta el uso pero no aplica el efecto (no cura, no devuelve espacios, no crea el efecto con duración).
- **Lo que más se repite como «Solo texto» que sí tendría arreglo fácil:** rasgos con usos por descanso que no tienen contador (unos 25 en subclases), y bonificadores fijos que no se suman (velocidad, salvaciones, iniciativa, CA de algunas subclases).

## 2. Tablas por clase

Primero los rasgos de la clase y después los de cada subclase. Los rasgos sin nota son «Solo texto» sin nada que añadir.

### Bárbaro

| Rasgo | Subclase | Nivel | Estado | Qué hace / qué falta |
|---|---|---|---|---|
| Furia | — | 1 | Parcial | Contador de usos (2–6; 1 en descanso corto, todos en largo), botón en Acción adicional y aviso. Falta: efecto con duración (hasta 10 min), sumar el daño de furia a los ataques de FUE, aplicar la resistencia al recibir daño y avisar de que no puedes lanzar conjuros ni concentrarte. |
| Defensa sin armadura | — | 1 | Parcial | Calcula 10 + DES + CON solo si tienes alguna armadura o escudo en el equipo. Sin ninguna (lo normal en un bárbaro), la CA se queda fija en la de la creación y no cambia al subir CON o DES. |
| Maestría con armas | — | 1 | Sola | Cada arma lleva su maestría (casilla por arma) y Datos de clase dice cuántas puedes tener; no comprueba que no te pases. |
| Sentir el peligro | — | 2 | Solo texto |  |
| Ataque temerario | — | 2 | Solo texto | No hay botón ni efecto «atacan con ventaja contra ti hasta tu turno». |
| Conocimiento primigenio | — | 3 | Solo texto | La habilidad se marca a mano en Editar. |
| Ataque adicional | — | 5 | Sola | Combate dice «haces 2 ataques» y los va descontando. |
| Movimiento rápido | — | 5 | Solo texto | No suma +10 pies a la velocidad. |
| Instinto salvaje | — | 7 | Solo texto | Al empezar el combate no avisa de la ventaja en iniciativa. |
| Abalanzamiento instintivo | — | 7 | Solo texto |  |
| Golpe brutal | — | 9 | Solo texto |  |
| Furia implacable | — | 11 | Solo texto | No lleva la CD que sube ni salta al caer a 0 PG. |
| Golpe brutal mejorado | — | 13 | Solo texto |  |
| Furia persistente | — | 15 | Solo texto |  |
| Golpe brutal mejorado | — | 17 | Solo texto |  |
| Poder indomable | — | 18 | Solo texto |  |
| Campeón primigenio | — | 20 | Solo texto | Las características se suben a mano. |
| Frenesí | Senda del Berserker | 3 | Solo texto |  |
| Furia irracional | Senda del Berserker | 6 | Solo texto |  |
| Represalia | Senda del Berserker | 10 | Solo texto |  |
| Presencia intimidante | Senda del Berserker | 14 | Solo texto | Sin contador de 1 uso por descanso largo. |
| Hablar con los animales | Senda del Corazón Salvaje | 3 | Solo texto |  |
| Furia de lo salvaje | Senda del Corazón Salvaje | 3 | Solo texto |  |
| Aspecto de lo salvaje | Senda del Corazón Salvaje | 6 | Solo texto |  |
| Hablar con la naturaleza | Senda del Corazón Salvaje | 10 | Solo texto |  |
| Poder de lo salvaje | Senda del Corazón Salvaje | 14 | Solo texto |  |
| Vitalidad del árbol | Senda del Árbol del Mundo | 3 | Solo texto | No da los PG temporales (nivel de bárbaro) al entrar en furia. |
| Ramas del árbol | Senda del Árbol del Mundo | 6 | Solo texto |  |
| Raíces golpeadoras | Senda del Árbol del Mundo | 10 | Solo texto |  |
| Viajar por el árbol | Senda del Árbol del Mundo | 14 | Solo texto |  |
| Furia divina | Senda del Fanático | 3 | Solo texto |  |
| Guerrero de los dioses | Senda del Fanático | 3 | Solo texto | La reserva de d12 no tiene contador. |
| Concentración fanática | Senda del Fanático | 6 | Solo texto |  |
| Presencia fanática | Senda del Fanático | 10 | Solo texto | Sin contador de 1 uso por descanso largo. |
| Furia de los dioses | Senda del Fanático | 14 | Solo texto |  |

### Bardo

| Rasgo | Subclase | Nivel | Estado | Qué hace / qué falta |
|---|---|---|---|---|
| Inspiración bárdica | — | 1 | Sola | Contador con usos = CAR (mín. 1), recupera en largo (en corto desde nivel 5), botón en Acción adicional y dado por nivel en Datos de clase. |
| Lanzamiento de conjuros | — | 1 | Sola | Espacios, CD, ataque, trucos y preparados por nivel. |
| Pericia | — | 2 | Solo texto | Se marca a mano en Editar (la app sí suma el doble de competencia); el asistente no la pide. |
| Aprendiz de todo | — | 2 | Solo texto | No suma la mitad de la competencia a las pruebas sin competencia (tampoco a la iniciativa). |
| Fuente de inspiración | — | 5 | Parcial | La recuperación pasa sola a descanso corto; gastar un espacio para recuperar un uso es a mano. |
| Contraencanto | — | 7 | Solo texto |  |
| Pericia | — | 9 | Solo texto | Igual que la de nivel 2. |
| Secretos mágicos | — | 10 | Solo texto | El buscador filtra por la lista de bardo; los de otras listas se buscan quitando el filtro. |
| Inspiración superior | — | 18 | Solo texto |  |
| Palabras de creación | — | 20 | Parcial | Los dos conjuros quedan siempre preparados; el segundo objetivo es texto. |
| Juego de pies deslumbrante | Colegio de la Danza | 3 | Solo texto | La CA 10 + DES + CAR no se calcula (solo se calcula la del bárbaro, el monje y el dracónico). |
| Movimiento inspirador | Colegio de la Danza | 6 | Solo texto |  |
| Juego de pies en tándem | Colegio de la Danza | 6 | Solo texto |  |
| Evasión dirigida | Colegio de la Danza | 14 | Solo texto |  |
| Magia cautivadora | Colegio del Glamour | 3 | Parcial | Hechizar persona e Imagen múltiple quedan siempre preparados; el efecto extra tras lanzar es texto. |
| Manto de inspiración | Colegio del Glamour | 3 | Solo texto |  |
| Manto de majestad | Colegio del Glamour | 6 | Parcial | Orden imperiosa siempre preparado; los lanzamientos gratis durante 1 minuto (1 por descanso largo) no se llevan. |
| Majestad inquebrantable | Colegio del Glamour | 14 | Solo texto |  |
| Competencias adicionales | Colegio del Conocimiento | 3 | Solo texto |  |
| Palabras cortantes | Colegio del Conocimiento | 3 | Solo texto |  |
| Descubrimientos mágicos | Colegio del Conocimiento | 6 | Solo texto | Los dos conjuros se añaden a mano y no quedan marcados como siempre preparados. |
| Habilidad sin par | Colegio del Conocimiento | 14 | Solo texto |  |
| Inspiración de combate | Colegio del Valor | 3 | Solo texto |  |
| Entrenamiento marcial | Colegio del Valor | 3 | Solo texto | No añade armas marciales, armadura media ni escudos a las competencias (la app avisará «sin competencia»). |
| Ataque adicional | Colegio del Valor | 6 | Sola | 2 ataques por acción; cambiar uno por un truco es texto. |
| Magia de batalla | Colegio del Valor | 14 | Solo texto |  |

### Clérigo

| Rasgo | Subclase | Nivel | Estado | Qué hace / qué falta |
|---|---|---|---|---|
| Lanzamiento de conjuros | — | 1 | Sola | Espacios, CD, ataque, trucos y preparados por nivel; tras un descanso largo ofrece cambiar los preparados. |
| Orden divino | — | 1 | Solo texto | El asistente no lo pregunta: ni armas marciales y armadura pesada (Protector) ni truco extra y bonificador a Conocimiento arcano y Religión (Taumaturgo). |
| Canalizar divinidad | — | 2 | Parcial | Contador (2/3/4; 1 en corto, todos en largo) y botón en Acción. No dice cuánto cura o daña Chispa divina (1d8–4d8 + SAB) ni la CD de Expulsar muertos vivientes. |
| Abrasar muertos vivientes | — | 5 | Solo texto |  |
| Golpes bendecidos | — | 7 | Solo texto |  |
| Intervención divina | — | 10 | Parcial | Contador de 1 uso por descanso largo y botón; no deja elegir y lanzar gratis el conjuro. |
| Golpes bendecidos mejorados | — | 14 | Solo texto |  |
| Intervención divina mayor | — | 20 | Solo texto |  |
| Bendiciones del conocimiento | Dominio del Conocimiento | 3 | Solo texto |  |
| Conjuros del dominio | Dominio del Conocimiento | 3 | Sola | Siempre preparados según el nivel. |
| Magia mental | Dominio del Conocimiento | 3 | Solo texto |  |
| Mente libre | Dominio del Conocimiento | 6 | Solo texto |  |
| Presciencia divina | Dominio del Conocimiento | 17 | Solo texto |  |
| Discípulo de la vida | Dominio de la Vida | 3 | Solo texto | Al lanzar un conjuro de curación no suma ni recuerda los 2 + nivel del espacio. |
| Conjuros del dominio | Dominio de la Vida | 3 | Sola | Siempre preparados según el nivel. |
| Preservar la vida | Dominio de la Vida | 3 | Solo texto | Gasta Canalizar divinidad a mano; no reparte la curación. |
| Sanador bendecido | Dominio de la Vida | 6 | Solo texto |  |
| Curación suprema | Dominio de la Vida | 17 | Solo texto |  |
| Conjuros del dominio | Dominio de la Luz | 3 | Sola | Siempre preparados según el nivel. |
| Resplandor del alba | Dominio de la Luz | 3 | Solo texto |  |
| Destello protector | Dominio de la Luz | 3 | Solo texto | Sin contador (SAB usos por descanso largo; desde nivel 6 también en corto). |
| Destello protector mejorado | Dominio de la Luz | 6 | Solo texto |  |
| Corona de luz | Dominio de la Luz | 17 | Solo texto | Sin contador (SAB usos por descanso largo). |
| Bendición del embaucador | Dominio del Engaño | 3 | Solo texto |  |
| Conjuros del dominio | Dominio del Engaño | 3 | Sola | Siempre preparados según el nivel. |
| Invocar duplicidad | Dominio del Engaño | 3 | Solo texto |  |
| Transposición del embaucador | Dominio del Engaño | 6 | Solo texto |  |
| Duplicidad mejorada | Dominio del Engaño | 17 | Solo texto |  |

### Druida

| Rasgo | Subclase | Nivel | Estado | Qué hace / qué falta |
|---|---|---|---|---|
| Druídico | — | 1 | Sola | Hablar con los animales queda siempre preparado; el idioma secreto es texto. |
| Orden primigenio | — | 1 | Solo texto | El asistente no lo pregunta: ni truco extra y bonificador a Conocimiento arcano y Naturaleza (Mago) ni armas marciales y armadura media (Guardián). |
| Lanzamiento de conjuros | — | 1 | Sola | Espacios, CD, ataque, trucos y preparados por nivel; tras un descanso largo ofrece cambiar los preparados. |
| Forma salvaje | — | 2 | Sola | Contador (2/3/4; 1 en corto), formas guardadas con VD y límite por nivel, PG temporales = nivel, efecto que dura la mitad del nivel en horas, usa los ataques de la forma, bloquea los conjuros y botón para volver. |
| Compañero salvaje | — | 2 | Sola | Desde Forma salvaje gasta un uso y crea el familiar (o le devuelve los PG). |
| Resurgir salvaje | — | 5 | Solo texto |  |
| Furia elemental | — | 7 | Solo texto |  |
| Furia elemental mejorada | — | 15 | Solo texto |  |
| Conjuros bestiales | — | 18 | Solo texto | La app sigue bloqueando los conjuros en forma salvaje (ver fallos). |
| Archidruida | — | 20 | Solo texto |  |
| Conjuros del círculo | Círculo de la Tierra | 3 | Solo texto | No añade los conjuros del terreno elegido (no están en la lista de siempre preparados). |
| Ayuda de la tierra | Círculo de la Tierra | 3 | Solo texto |  |
| Recuperación natural | Círculo de la Tierra | 6 | Solo texto | Ni el lanzamiento gratis ni la recuperación de espacios. |
| Protección de la naturaleza | Círculo de la Tierra | 10 | Solo texto |  |
| Santuario natural | Círculo de la Tierra | 14 | Solo texto |  |
| Formas del círculo | Círculo de la Luna | 3 | Sola | VD máximo = nivel ÷ 3, CA mínima 13 + SAB y PG temporales ×3, aplicados al transformarte. |
| Conjuros del círculo | Círculo de la Luna | 3 | Sola | Siempre preparados y se pueden lanzar transformado (Fuente de luz de luna no está en el SRD). |
| Formas del círculo mejoradas | Círculo de la Luna | 6 | Solo texto |  |
| Paso a la luz de la luna | Círculo de la Luna | 10 | Solo texto | Sin contador (SAB usos por descanso largo). |
| Forma lunar | Círculo de la Luna | 14 | Solo texto |  |
| Conjuros del círculo | Círculo del Mar | 3 | Sola | Siempre preparados según el nivel. |
| Ira del mar | Círculo del Mar | 3 | Solo texto | Gasta Forma salvaje a mano; no crea el aura de 10 minutos. |
| Afinidad acuática | Círculo del Mar | 6 | Solo texto |  |
| Nacido de la tormenta | Círculo del Mar | 10 | Solo texto |  |
| Don oceánico | Círculo del Mar | 14 | Solo texto |  |
| Mapa estelar | Círculo de las Estrellas | 3 | Parcial | Orientación y Saeta guía siempre preparados; los lanzamientos gratis de Saeta guía (SAB por descanso largo) no tienen contador. |
| Forma estrellada | Círculo de las Estrellas | 3 | Solo texto | Gasta Forma salvaje a mano; no crea el efecto de 10 minutos. |
| Presagio cósmico | Círculo de las Estrellas | 6 | Solo texto | Sin contador (SAB usos por descanso largo). |
| Constelaciones titilantes | Círculo de las Estrellas | 10 | Solo texto |  |
| Lleno de estrellas | Círculo de las Estrellas | 14 | Solo texto |  |

### Guerrero

| Rasgo | Subclase | Nivel | Estado | Qué hace / qué falta |
|---|---|---|---|---|
| Estilo de combate | — | 1 | Sola | El asistente pide la dote de estilo y aplica lo calculable (CA, ataque, daño). |
| Tomar aliento | — | 1 | Parcial | Contador (2–4; 1 en corto) y botón en Acción adicional; no dice qué tirar (1d10 + nivel) ni suma los PG. |
| Maestría con armas | — | 1 | Sola | Cada arma lleva su maestría y Datos de clase dice cuántas; no comprueba el máximo. |
| Oleada de acción | — | 2 | Sola | Contador (1–2, descanso corto) y botón que te devuelve la acción del turno. |
| Mente táctica | — | 2 | Solo texto | Gasta Tomar aliento a mano. |
| Ataque adicional | — | 5 | Sola | 2 ataques por acción. |
| Cambio táctico | — | 5 | Solo texto |  |
| Indómito | — | 9 | Sola | Contador (1–3 por descanso largo) y botón sin gastar acción; el + nivel lo sumas tú. |
| Maestro táctico | — | 9 | Solo texto |  |
| Dos ataques adicionales | — | 11 | Sola | 3 ataques por acción. |
| Ataques estudiados | — | 13 | Solo texto |  |
| Tres ataques adicionales | — | 20 | Sola | 4 ataques por acción. |
| Superioridad en combate | Maestro de Batalla | 3 | Parcial | Contador de dados (4–6, descanso corto) y tamaño del dado; no hay lista de maniobras ni se muestra la CD de maniobra. |
| Estudiante de la guerra | Maestro de Batalla | 3 | Solo texto |  |
| Conoce a tu enemigo | Maestro de Batalla | 7 | Solo texto |  |
| Superioridad en combate mejorada | Maestro de Batalla | 10 | Sola | El dado pasa a d10 en Datos de clase. |
| Implacable | Maestro de Batalla | 15 | Solo texto |  |
| Superioridad en combate definitiva | Maestro de Batalla | 18 | Sola | El dado pasa a d12. |
| Crítico mejorado | Campeón | 3 | Solo texto | Los ataques no recuerdan que haces crítico con 19. |
| Atleta excepcional | Campeón | 3 | Solo texto | Ni la ventaja en iniciativa ni en Atletismo. |
| Estilo de combate adicional | Campeón | 7 | Sola | El asistente vuelve a pedir una dote de estilo. |
| Guerrero heroico | Campeón | 10 | Solo texto |  |
| Crítico superior | Campeón | 15 | Solo texto |  |
| Superviviente | Campeón | 18 | Solo texto | No cura al empezar el turno. |
| Lanzamiento de conjuros | Caballero Arcano | 3 | Sola | Espacios de un tercio de lanzador, trucos y preparados por nivel. |
| Vínculo con el arma | Caballero Arcano | 3 | Solo texto |  |
| Magia de guerra | Caballero Arcano | 7 | Solo texto |  |
| Golpe arcano | Caballero Arcano | 10 | Solo texto |  |
| Carga arcana | Caballero Arcano | 15 | Solo texto |  |
| Magia de guerra mejorada | Caballero Arcano | 18 | Solo texto |  |
| Poder psiónico | Guerrero Psiónico | 3 | Parcial | Contador de dados (4–12; 1 en corto) y tamaño del dado; los tres usos son texto. |
| Adepto telequinético | Guerrero Psiónico | 7 | Solo texto |  |
| Mente protegida | Guerrero Psiónico | 10 | Solo texto |  |
| Baluarte de fuerza | Guerrero Psiónico | 15 | Solo texto |  |
| Maestro telequinético | Guerrero Psiónico | 18 | Parcial | Telequinesis siempre preparado; lanzarlo gratis no tiene contador. |

### Monje

| Rasgo | Subclase | Nivel | Estado | Qué hace / qué falta |
|---|---|---|---|---|
| Artes marciales | — | 1 | Parcial | Opción «Golpe desarmado» en Acción adicional y dado en Datos de clase. Falta un ataque de golpe desarmado con DES y el dado, y que las armas de monje usen DES y el dado. |
| Defensa sin armadura | — | 1 | Parcial | Calcula 10 + DES + SAB solo si tienes alguna armadura o escudo en el equipo; si no (lo normal), la CA queda fija en la de la creación. |
| Concentración del monje | — | 2 | Parcial | Contador de puntos (descanso corto) y opciones Ráfaga de golpes, Defensa paciente y Paso del viento que gastan 1 punto y la acción adicional. Faltan las versiones gratis (Destrabarse o Correr sin gastar punto). |
| Movimiento sin armadura | — | 2 | Parcial | Datos de clase muestran los pies extra, pero la velocidad no los suma. |
| Metabolismo asombroso | — | 2 | Parcial | Contador y botón; no recupera los puntos ni dice qué curar (dado de artes marciales + nivel). |
| Desviar ataques | — | 3 | Solo texto | No hay reacción que reste el daño. |
| Caída lenta | — | 4 | Solo texto |  |
| Ataque adicional | — | 5 | Sola | 2 ataques por acción. |
| Golpe aturdidor | — | 5 | Parcial | Opción sin gastar acción que gasta 1 punto y recuerda la salvación de CON; no muestra la CD (8 + competencia + SAB). |
| Golpes potenciados | — | 6 | Solo texto |  |
| Evasión | — | 7 | Solo texto |  |
| Movimiento acrobático | — | 9 | Solo texto |  |
| Concentración elevada | — | 10 | Solo texto |  |
| Autorrestauración | — | 10 | Solo texto |  |
| Desviar energía | — | 13 | Solo texto |  |
| Superviviente disciplinado | — | 14 | Solo texto |  |
| Concentración perfecta | — | 15 | Solo texto |  |
| Defensa superior | — | 18 | Solo texto |  |
| Cuerpo y mente | — | 20 | Solo texto |  |
| Sintonía elemental | Guerrero de los Elementos | 3 | Solo texto |  |
| Manipular los elementos | Guerrero de los Elementos | 3 | Solo texto |  |
| Estallido elemental | Guerrero de los Elementos | 6 | Solo texto |  |
| Zancada de los elementos | Guerrero de los Elementos | 11 | Solo texto |  |
| Epítome elemental | Guerrero de los Elementos | 17 | Solo texto |  |
| Mano dañina | Guerrero de la Misericordia | 3 | Solo texto | Gasta puntos a mano. |
| Mano sanadora | Guerrero de la Misericordia | 3 | Solo texto | Gasta puntos a mano; no hay botón ni curación. |
| Herramientas de la misericordia | Guerrero de la Misericordia | 3 | Solo texto |  |
| Toque del médico | Guerrero de la Misericordia | 6 | Solo texto |  |
| Ráfaga de curación y daño | Guerrero de la Misericordia | 11 | Solo texto |  |
| Mano de la misericordia definitiva | Guerrero de la Misericordia | 17 | Solo texto |  |
| Técnica de la mano abierta | Guerrero de la Mano Abierta | 3 | Solo texto |  |
| Plenitud corporal | Guerrero de la Mano Abierta | 6 | Solo texto | Sin contador (SAB usos por descanso largo). |
| Paso veloz | Guerrero de la Mano Abierta | 11 | Solo texto |  |
| Palma temblorosa | Guerrero de la Mano Abierta | 17 | Solo texto |  |
| Artes de la sombra | Guerrero de la Sombra | 3 | Solo texto |  |
| Paso de sombra | Guerrero de la Sombra | 6 | Solo texto |  |
| Paso de sombra mejorado | Guerrero de la Sombra | 11 | Solo texto |  |
| Manto de sombras | Guerrero de la Sombra | 17 | Solo texto |  |

### Paladín

| Rasgo | Subclase | Nivel | Estado | Qué hace / qué falta |
|---|---|---|---|---|
| Imposición de manos | — | 1 | Parcial | Reserva de 5 × nivel con botón en Acción adicional que pregunta cuántos gastas; no suma los PG curados (ni a ti) ni avisa de que 5 PG quitan Envenenado. |
| Lanzamiento de conjuros | — | 1 | Sola | Espacios, CD, ataque y preparados; tras un descanso largo ofrece cambiar uno. |
| Maestría con armas | — | 1 | Sola | Cada arma lleva su maestría; no comprueba el máximo. |
| Estilo de combate | — | 2 | Sola | Dote de estilo o la opción de trucos (estos, a mano). |
| Castigo del paladín | — | 2 | Sola | Castigo divino siempre preparado y 1 lanzamiento gratis por descanso largo enlazado al conjuro. |
| Canalizar divinidad | — | 3 | Parcial | Contador (2/3; 1 en corto) y botón en Acción; Sentido divino y las opciones del juramento son texto. |
| Ataque adicional | — | 5 | Sola | 2 ataques por acción. |
| Corcel fiel | — | 5 | Parcial | Encontrar montura siempre preparado y ficha de montura con casilla «es gratis», pero el uso gratis por descanso largo no tiene contador. |
| Aura de protección | — | 6 | Solo texto | No suma CAR (mín. +1) a tus salvaciones. |
| Abjurar enemigos | — | 9 | Solo texto |  |
| Aura de valor | — | 10 | Solo texto |  |
| Golpes radiantes | — | 11 | Solo texto | Los ataques cuerpo a cuerpo no recuerdan el +1d8 radiante. |
| Toque restaurador | — | 14 | Solo texto |  |
| Expansión del aura | — | 18 | Solo texto |  |
| Ira de la naturaleza | Juramento de los Antiguos | 3 | Solo texto |  |
| Conjuros del juramento | Juramento de los Antiguos | 3 | Sola | Siempre preparados según el nivel. |
| Aura de protección mágica | Juramento de los Antiguos | 7 | Solo texto |  |
| Centinela imperecedero | Juramento de los Antiguos | 15 | Solo texto |  |
| Campeón ancestral | Juramento de los Antiguos | 20 | Solo texto |  |
| Conjuros del juramento | Juramento de Devoción | 3 | Sola | Siempre preparados según el nivel. |
| Arma sagrada | Juramento de Devoción | 3 | Solo texto |  |
| Aura de devoción | Juramento de Devoción | 7 | Solo texto |  |
| Castigo protector | Juramento de Devoción | 15 | Solo texto |  |
| Nimbo sagrado | Juramento de Devoción | 20 | Solo texto |  |
| Castigo inspirador | Juramento de Gloria | 3 | Solo texto |  |
| Atleta sin par | Juramento de Gloria | 3 | Solo texto |  |
| Conjuros del juramento | Juramento de Gloria | 3 | Sola | Siempre preparados según el nivel. |
| Aura de presteza | Juramento de Gloria | 7 | Solo texto | No suma +10 pies a la velocidad. |
| Defensa gloriosa | Juramento de Gloria | 15 | Solo texto | Sin contador (CAR usos por descanso largo). |
| Leyenda viviente | Juramento de Gloria | 20 | Solo texto |  |
| Voto de enemistad | Juramento de Venganza | 3 | Solo texto | Gasta Canalizar divinidad a mano; no crea el efecto de 1 minuto. |
| Conjuros del juramento | Juramento de Venganza | 3 | Sola | Siempre preparados según el nivel. |
| Vengador implacable | Juramento de Venganza | 7 | Solo texto |  |
| Alma de venganza | Juramento de Venganza | 15 | Solo texto |  |
| Ángel vengador | Juramento de Venganza | 20 | Solo texto |  |

### Explorador

| Rasgo | Subclase | Nivel | Estado | Qué hace / qué falta |
|---|---|---|---|---|
| Enemigo predilecto | — | 1 | Sola | Marca del cazador siempre preparada y contador de lanzamientos gratis (2–6 por descanso largo) enlazado al conjuro. |
| Lanzamiento de conjuros | — | 1 | Sola | Espacios, CD, ataque y preparados; tras un descanso largo ofrece cambiar uno. |
| Maestría con armas | — | 1 | Sola | Cada arma lleva su maestría; no comprueba el máximo. |
| Explorador hábil | — | 2 | Solo texto | La pericia y los idiomas se ponen a mano. |
| Estilo de combate | — | 2 | Sola | Dote de estilo o la opción de trucos (estos, a mano). |
| Ataque adicional | — | 5 | Sola | 2 ataques por acción. |
| Errante | — | 6 | Solo texto | No suma +10 pies ni pone velocidad de trepar y nadar. |
| Pericia | — | 9 | Solo texto | Se marca a mano en Editar. |
| Incansable | — | 10 | Parcial | Contador (SAB por descanso largo) y botón en Acción; no dice qué tirar (1d8 + SAB) ni suma los PG temporales, ni quita agotamiento en el descanso corto. |
| Cazador implacable | — | 13 | Solo texto | La app sigue pidiendo salvación de concentración al recibir daño con Marca del cazador. |
| Velo de la naturaleza | — | 14 | Solo texto | Sin contador (SAB usos por descanso largo). |
| Cazador preciso | — | 17 | Solo texto |  |
| Sentidos salvajes | — | 18 | Solo texto |  |
| Asesino de enemigos | — | 20 | Solo texto |  |
| Compañero primigenio | Señor de las Bestias | 3 | Sola | Ficha de la bestia calculada con tu nivel y SAB (CA, PG, golpe) y botón «Ordenar» en Acción adicional. |
| Entrenamiento excepcional | Señor de las Bestias | 7 | Solo texto | Aparece como texto en los rasgos de la bestia. |
| Furia bestial | Señor de las Bestias | 11 | Sola | La bestia ataca dos veces (×2 en el botón «Ordenar»). |
| Compartir conjuros | Señor de las Bestias | 15 | Solo texto | Aparece como texto en los rasgos de la bestia. |
| Golpes terribles | Trotamundos Feérico | 3 | Solo texto |  |
| Conjuros del trotamundos | Trotamundos Feérico | 3 | Sola | Siempre preparados según el nivel (los que no están en el SRD, a mano). |
| Encanto sobrenatural | Trotamundos Feérico | 3 | Solo texto |  |
| Giro seductor | Trotamundos Feérico | 7 | Solo texto |  |
| Refuerzos feéricos | Trotamundos Feérico | 11 | Solo texto |  |
| Trotamundos brumoso | Trotamundos Feérico | 15 | Solo texto |  |
| Emboscador terrible | Acechador en la Penumbra | 3 | Solo texto | No suma SAB a la iniciativa ni lleva el contador de daño extra (SAB por descanso largo). |
| Conjuros del acechador | Acechador en la Penumbra | 3 | Sola | Siempre preparados según el nivel (los que no están en el SRD, a mano). |
| Visión umbría | Acechador en la Penumbra | 3 | Solo texto |  |
| Mente de hierro | Acechador en la Penumbra | 7 | Solo texto |  |
| Ráfaga del acechador | Acechador en la Penumbra | 11 | Solo texto |  |
| Esquiva sombría | Acechador en la Penumbra | 15 | Solo texto |  |
| Saber del cazador | Cazador | 3 | Solo texto |  |
| Presa del cazador | Cazador | 3 | Solo texto |  |
| Tácticas defensivas | Cazador | 7 | Solo texto |  |
| Presa del cazador superior | Cazador | 11 | Solo texto |  |
| Defensa del cazador superior | Cazador | 15 | Solo texto |  |

### Pícaro

| Rasgo | Subclase | Nivel | Estado | Qué hace / qué falta |
|---|---|---|---|---|
| Pericia | — | 1 | Solo texto | Se marca a mano en Editar (la app sí suma el doble de competencia); el asistente no la pide. |
| Ataque furtivo | — | 1 | Parcial | Datos de clase muestran los dados (1d6–10d6); en Combate no hay recordatorio de «una vez por turno» ni de las condiciones. |
| Jerga de ladrones | — | 1 | Solo texto |  |
| Maestría con armas | — | 1 | Sola | Cada arma lleva su maestría; no comprueba el máximo. |
| Acción astuta | — | 2 | Sola | Opción en Acción adicional (Correr, Destrabarse o Esconderse). |
| Apuntar con calma | — | 3 | Solo texto | No hay opción en Acción adicional. |
| Golpe astuto | — | 5 | Solo texto |  |
| Esquiva asombrosa | — | 5 | Solo texto | No hay reacción que divida el daño a la mitad. |
| Pericia | — | 6 | Solo texto | Se marca a mano en Editar. |
| Evasión | — | 7 | Solo texto |  |
| Talento fiable | — | 7 | Solo texto |  |
| Golpe astuto mejorado | — | 11 | Solo texto |  |
| Golpes taimados | — | 14 | Solo texto |  |
| Mente escurridiza | — | 15 | Solo texto |  |
| Esquivo | — | 18 | Solo texto |  |
| Golpe de suerte | — | 20 | Sola | Contador de 1 uso por descanso corto con botón. |
| Lanzamiento de conjuros | Embaucador Arcano | 3 | Sola | Espacios de un tercio de lanzador, trucos y preparados (Mano de mago se añade a mano). |
| Juego de manos con la mano de mago | Embaucador Arcano | 3 | Solo texto |  |
| Emboscada mágica | Embaucador Arcano | 9 | Solo texto |  |
| Embaucador versátil | Embaucador Arcano | 13 | Solo texto |  |
| Ladrón de conjuros | Embaucador Arcano | 17 | Solo texto |  |
| Asesinar | Asesino | 3 | Solo texto |  |
| Herramientas del asesino | Asesino | 3 | Solo texto |  |
| Experto en infiltración | Asesino | 9 | Solo texto |  |
| Envenenar armas | Asesino | 13 | Solo texto |  |
| Golpe mortal | Asesino | 17 | Solo texto |  |
| Poder psiónico | Cuchilla Psíquica | 3 | Parcial | Contador de dados (4–12; 1 en corto) y tamaño; los usos son texto. |
| Cuchillas psíquicas | Cuchilla Psíquica | 3 | Solo texto | No crea el ataque de las cuchillas (1d6 psíquico + la segunda de 1d4). |
| Cuchillas del alma | Cuchilla Psíquica | 9 | Solo texto |  |
| Velo psíquico | Cuchilla Psíquica | 13 | Solo texto | Sin contador. |
| Desgarrar la mente | Cuchilla Psíquica | 17 | Solo texto |  |
| Manos rápidas | Ladrón | 3 | Solo texto |  |
| Trabajo en las alturas | Ladrón | 3 | Solo texto |  |
| Sigilo supremo | Ladrón | 9 | Solo texto |  |
| Usar objeto mágico | Ladrón | 13 | Solo texto |  |
| Reflejos de ladrón | Ladrón | 17 | Solo texto |  |

### Hechicero

| Rasgo | Subclase | Nivel | Estado | Qué hace / qué falta |
|---|---|---|---|---|
| Hechicería innata | — | 1 | Parcial | Contador (2 por descanso largo) y botón en Acción adicional; no crea el efecto de 1 minuto ni sube la CD ni recuerda la ventaja. |
| Lanzamiento de conjuros | — | 1 | Sola | Espacios, CD, ataque, trucos y preparados por nivel. |
| Fuente de magia | — | 2 | Parcial | Contador de puntos de hechicería (nivel, descanso largo); convertir puntos en espacios (o al revés) se hace a mano y sin la tabla de costes. |
| Metamagia | — | 2 | Solo texto | No hay catálogo de opciones; el recuento «Metamagias conocidas» cuenta de más (ver fallos). |
| Restauración hechicera | — | 5 | Parcial | Contador de 1 uso por descanso largo; no devuelve los puntos (mitad del nivel) en el descanso corto. |
| Hechicería encarnada | — | 7 | Solo texto |  |
| Metamagia | — | 10 | Solo texto | Igual que la de nivel 2. |
| Metamagia | — | 17 | Solo texto | Igual que la de nivel 2. |
| Apoteosis arcana | — | 20 | Solo texto |  |
| Conjuros psiónicos | Hechicería Aberrante | 3 | Sola | Siempre preparados según el nivel. |
| Habla telepática | Hechicería Aberrante | 3 | Solo texto |  |
| Hechicería psiónica | Hechicería Aberrante | 6 | Solo texto |  |
| Defensas psíquicas | Hechicería Aberrante | 6 | Solo texto |  |
| Revelación en la carne | Hechicería Aberrante | 14 | Solo texto |  |
| Implosión distorsionante | Hechicería Aberrante | 18 | Solo texto |  |
| Conjuros mecánicos | Hechicería Mecánica | 3 | Sola | Siempre preparados según el nivel. |
| Restaurar el equilibrio | Hechicería Mecánica | 3 | Solo texto | Sin contador (CAR usos por descanso largo). |
| Bastión de la ley | Hechicería Mecánica | 6 | Solo texto |  |
| Trance del orden | Hechicería Mecánica | 14 | Solo texto |  |
| Cabalgata mecánica | Hechicería Mecánica | 18 | Solo texto |  |
| Resistencia dracónica | Hechicería Dracónica | 3 | Parcial | Suma +1 PG por nivel al subir (y los atrasados al elegirla). La CA 10 + DES + CAR solo se calcula si tienes alguna armadura o escudo en el equipo; si no (lo normal en un hechicero), se queda la CA de la creación. |
| Conjuros dracónicos | Hechicería Dracónica | 3 | Sola | Siempre preparados según el nivel. |
| Afinidad elemental | Hechicería Dracónica | 6 | Solo texto |  |
| Alas de dragón | Hechicería Dracónica | 14 | Solo texto | Sin contador ni efecto de 1 hora. |
| Compañero dragón | Hechicería Dracónica | 18 | Solo texto |  |
| Oleada de magia salvaje | Hechicería de Magia Salvaje | 3 | Solo texto | Al lanzar con espacio no recuerda tirar el d20. |
| Mareas del caos | Hechicería de Magia Salvaje | 3 | Sola | Contador de 1 uso por descanso largo con botón; recuperarlo tras una oleada es a mano. |
| Doblegar la suerte | Hechicería de Magia Salvaje | 6 | Solo texto |  |
| Caos controlado | Hechicería de Magia Salvaje | 14 | Solo texto |  |
| Oleada domada | Hechicería de Magia Salvaje | 18 | Solo texto |  |

### Brujo

| Rasgo | Subclase | Nivel | Estado | Qué hace / qué falta |
|---|---|---|---|---|
| Invocaciones sobrenaturales | — | 1 | Sola | El asistente y el botón «Invocaciones» eligen del catálogo con requisitos y máximo por nivel, y añaden los conjuros gratis y las dotes. El recuento de la ficha cuenta una de más (ver fallos). |
| Magia de pacto | — | 1 | Sola | Espacios de pacto (número y nivel), se recuperan en descanso corto, CD y ataque con CAR. |
| Astucia mágica | — | 2 | Parcial | Contador de 1 uso por descanso largo, pero no devuelve los espacios de pacto (la mitad del máximo, redondeando arriba): hay que marcarlos a mano. |
| Contactar con el patrón | — | 9 | Parcial | Contactar con otro plano siempre preparado y contador de 1 uso, pero no están enlazados: al lanzarlo pide espacio de pacto. |
| Arcano místico | — | 11 | Parcial | Contador de usos (1–4) y deja añadir conjuros de nivel 6–9, pero lanzarlos no se enlaza con el contador y sale «Sin espacios». |
| Arcano místico | — | 13 | Parcial | Igual que el de nivel 11. |
| Arcano místico | — | 15 | Parcial | Igual que el de nivel 11. |
| Arcano místico | — | 17 | Parcial | Igual que el de nivel 11. |
| Maestro sobrenatural | — | 20 | Solo texto |  |
| Conjuros del archifeérico | Patrón Archifeérico | 3 | Sola | Siempre preparados según el nivel. |
| Pasos de las hadas | Patrón Archifeérico | 3 | Parcial | Contador (CAR por descanso largo), pero no está enlazado a Paso brumoso (que gasta espacio de pacto) y en Combate sale como «sin gastar acción» en vez de acción adicional. |
| Huida brumosa | Patrón Archifeérico | 6 | Solo texto |  |
| Defensas cautivadoras | Patrón Archifeérico | 10 | Solo texto |  |
| Magia hechizante | Patrón Archifeérico | 14 | Solo texto |  |
| Conjuros celestiales | Patrón Celestial | 3 | Sola | Siempre preparados según el nivel. |
| Luz sanadora | Patrón Celestial | 3 | Parcial | Reserva de d6 (1 + nivel) con botón en Acción adicional que pregunta cuántos gastas; no limita a CAR dados ni suma la curación. |
| Alma radiante | Patrón Celestial | 6 | Solo texto |  |
| Resistencia celestial | Patrón Celestial | 10 | Solo texto |  |
| Venganza abrasadora | Patrón Celestial | 14 | Solo texto |  |
| Bendición del oscuro | Patrón Infernal | 3 | Solo texto | No hay botón para ganar los PG temporales (CAR + nivel) cuando cae un enemigo. |
| Conjuros infernales | Patrón Infernal | 3 | Sola | Siempre preparados según el nivel. |
| Suerte del oscuro | Patrón Infernal | 6 | Sola | Contador de CAR usos por descanso largo (desde nivel 6) con botón sin gastar acción. |
| Resistencia infernal | Patrón Infernal | 10 | Solo texto |  |
| Lanzar a través del infierno | Patrón Infernal | 14 | Solo texto |  |
| Mente despierta | Patrón Primigenio | 3 | Solo texto |  |
| Conjuros del primigenio | Patrón Primigenio | 3 | Sola | Siempre preparados según el nivel. |
| Conjuros psíquicos | Patrón Primigenio | 3 | Solo texto |  |
| Combatiente clarividente | Patrón Primigenio | 6 | Solo texto |  |
| Maleficio sobrenatural | Patrón Primigenio | 10 | Parcial | Maleficio siempre preparado; la desventaja extra es texto. |
| Escudo mental | Patrón Primigenio | 10 | Solo texto |  |
| Crear siervo | Patrón Primigenio | 14 | Solo texto |  |

### Mago

| Rasgo | Subclase | Nivel | Estado | Qué hace / qué falta |
|---|---|---|---|---|
| Lanzamiento de conjuros | — | 1 | Parcial | Espacios, CD, ataque, trucos y preparados por nivel, pero no hay libro de conjuros: al cambiar los preparados se elige de toda la lista de mago. |
| Ritualista | — | 1 | Solo texto | Sin libro, no se puede lanzar como ritual un conjuro no preparado. |
| Recuperación arcana | — | 1 | Parcial | Contador de 1 uso por descanso largo; no deja elegir y recuperar los espacios (nivel total = mitad del nivel de mago). |
| Erudito | — | 2 | Solo texto | La pericia se marca a mano en Editar. |
| Memorizar conjuro | — | 5 | Solo texto |  |
| Dominio de conjuros | — | 18 | Solo texto |  |
| Conjuros distintivos | — | 20 | Solo texto |  |
| Sabio de la abjuración | Abjurador | 3 | Solo texto |  |
| Custodia arcana | Abjurador | 3 | Solo texto | La custodia no tiene contador de PG ni absorbe el daño. |
| Custodia proyectada | Abjurador | 6 | Solo texto |  |
| Rompeconjuros | Abjurador | 10 | Solo texto |  |
| Resistencia a los conjuros | Abjurador | 14 | Solo texto |  |
| Sabio de la adivinación | Adivino | 3 | Solo texto |  |
| Portento | Adivino | 3 | Parcial | Contador (2; 3 desde nivel 14) con botón; no hay sitio para apuntar los números que sacaste. |
| Adivinación experta | Adivino | 6 | Solo texto |  |
| El tercer ojo | Adivino | 10 | Solo texto |  |
| Gran portento | Adivino | 14 | Sola | El contador de Portento pasa a 3. |
| Sabio de la evocación | Evocador | 3 | Solo texto |  |
| Truco potente | Evocador | 3 | Solo texto |  |
| Esculpir conjuros | Evocador | 6 | Solo texto |  |
| Evocación potenciada | Evocador | 10 | Solo texto |  |
| Sobrecarga | Evocador | 14 | Solo texto |  |
| Sabio de la ilusión | Ilusionista | 3 | Solo texto |  |
| Ilusiones mejoradas | Ilusionista | 3 | Solo texto |  |
| Criaturas fantasmales | Ilusionista | 6 | Parcial | Al invocar bestia o feérico hay casilla «ilusoria» que pone la mitad de PG; el uso gratis no tiene contador y los conjuros no se añaden como siempre preparados. |
| Yo ilusorio | Ilusionista | 10 | Solo texto |  |
| Realidad ilusoria | Ilusionista | 14 | Solo texto |  |

## 3. Candidatas a automatizar

Ordenadas por lo que más se notaría en la mesa: primero niveles 1–5 y lo que afecta a Zyo (brujo con Pacto del Filo). Cada una con su propuesta en una línea.

### Para Zyo y el brujo

1. **Recuento de invocaciones** (brujo 1). Hoy Zyo ve «Invocaciones 2 / 1» (ver fallo F1). Propuesta: contar solo los rasgos que empiezan por «Invocación:».
2. **Arma de pacto con CAR** (Pacto del Filo, brujo 1; se solapa con el inventario de invocaciones). La Hoz de Zyo ataca con FUE (+1, 1d4 − 1). Propuesta: casilla «arma de pacto» en el arma que use CAR para ataque y daño y deje elegir daño necrótico, psíquico o radiante; «Invocar arma de pacto» podría equiparla.
3. **Astucia mágica** (brujo 2). Propuesta: botón «Usar» que devuelva la mitad de los espacios de pacto (redondeando arriba) y gaste el uso; mejor aún, una casilla en la ventana de descanso corto.
4. **Enlazar lanzamientos gratis de subclase y de nivel alto** (brujo 3, 9 y 11+). Propuesta: añadir a `FREE_LINK` (`js/core/rules.js:73`) Paso brumoso → «Pasos de las hadas», Contactar con otro plano → «Contactar con el patrón» y los conjuros elegidos de Arcano místico; y poner «Pasos de las hadas» como acción adicional en `WHEN`.
5. **Bendición del oscuro** (brujo infernal 3). Propuesta: en Combate, opción «Ha caído un enemigo cerca» que dé CAR + nivel de PG temporales.
6. **Luz sanadora** (brujo celestial 3). Propuesta: limitar a CAR dados por uso y pedir el resultado para sumar los PG.

### Niveles 1–5, resto de clases

7. **CA sin armadura siempre calculada** (bárbaro 1, monje 1, hechicero dracónico 3, bardo de la Danza 3). Propuesta: usar el cálculo de CA aunque no haya armaduras en el equipo (arregla el fallo F4) y añadir la opción 10 + DES + CAR del Colegio de la Danza.
8. **Furia** (bárbaro 1). Propuesta: al pulsarla, crear el efecto «Furia» (hasta 10 min), mostrar el daño de furia en los ataques de FUE, ofrecer dividir a la mitad el daño contundente, cortante y perforante al recibirlo, terminar la concentración y avisar si se intenta lanzar un conjuro.
9. **Rasgos que curan** (Tomar aliento, guerrero 1; Imposición de manos, paladín 1; Metabolismo asombroso, monje 2; Incansable, explorador 10). Propuesta: al pulsar «Usar», decir qué tirar (por ejemplo «1d10 + 3») y pedir el resultado para sumarlo a los PG (o a los PG temporales). En Imposición de manos, elegir «a mí / a otro».
10. **Recuperar espacios o puntos en el descanso corto** (Recuperación arcana, mago 1; Restauración hechicera, hechicero 5). Propuesta: casillas en la ventana de descanso corto que devuelvan los espacios elegidos (nivel total = mitad del nivel) o los puntos (mitad del nivel).
11. **Velocidad** (Movimiento sin armadura, monje 2; Movimiento rápido, bárbaro 5; Errante, explorador 6). Propuesta: sumarla a la velocidad cuando se cumpla la condición de armadura, igual que ya se resta la de armadura pesada.
12. **Ataque furtivo** (pícaro 1). Propuesta: fila «Ataque furtivo (2d6)» en «Sin gastar acción» que se marque una vez por turno y se libere con «Terminar turno».
13. **Golpe desarmado y armas de monje** (monje 1). Propuesta: crear el ataque «Golpe desarmado» con FUE o DES y el dado de artes marciales, y que las armas de monje usen DES y ese dado. En Golpe aturdidor (monje 5), mostrar la CD (8 + competencia + SAB).
14. **Hechicería innata** (hechicero 1). Propuesta: al usarla, efecto de 1 minuto (10 rondas) y, mientras dure, CD +1 en la ficha y aviso de ventaja en los ataques de conjuro.
15. **Elecciones de nivel 1–2 en el asistente**: Pericia (pícaro 1, bardo 2, explorador 2, mago 2), Orden divino (clérigo 1) y Orden primigenio (druida 1). Propuesta: un paso que pida las habilidades con pericia y la opción de orden, y aplique competencias, el truco extra y el bonificador a las habilidades.
16. **Aprendiz de todo** (bardo 2). Propuesta: sumar la mitad de la competencia (redondeando abajo) a las habilidades sin competencia y a la iniciativa.
17. **Canalizar divinidad** (clérigo 2, paladín 3). Propuesta: al pulsarla, mostrar los dados de Chispa divina (1d8 a 4d8 + SAB) y la CD de Expulsar muertos vivientes y de las opciones de subclase.
18. **Contadores que faltan en `data/classes.js`** (coste muy bajo: solo datos). Destello protector (clérigo de la Luz 3, SAB por largo y desde nivel 6 también en corto), Restaurar el equilibrio (hechicero mecánico 3, CAR), Saeta guía gratis del Mapa estelar (druida 3, SAB, enlazado al conjuro), Guerrero de los dioses (bárbaro fanático 3, reserva de d12), Emboscador terrible (explorador 3, SAB), Corcel fiel (paladín 5, enlazado a Encontrar montura) y, más adelante, Paso a la luz de la luna, Plenitud corporal, Velo de la naturaleza, Presagio cósmico, Defensa gloriosa, las «1 vez por descanso largo» de nivel 10+ y Yo ilusorio.
19. **Al empezar el combate** (bárbaro 7, campeón 3, asesino 3, acechador 3). Propuesta: que el aviso de iniciativa diga «con ventaja» o sume SAB cuando toque, y recuerde los rasgos «al tirar iniciativa» (Metabolismo asombroso, Inspiración superior, Furia persistente…).
20. **Discípulo de la vida** (clérigo de la Vida 3). Propuesta: al lanzar un conjuro de curación con espacio, añadir al aviso «+2 + nivel del espacio».
21. **Aura de protección** (paladín 6). Propuesta: sumar CAR (mínimo +1) a todas las salvaciones del paladín.

### Menos urgentes

- Botones para opciones que gastan un recurso que ya existe: maniobras del Maestro de batalla (con su CD), Mano sanadora y Mano dañina (monje de la Misericordia 3), Voto de enemistad (paladín de Venganza 3) como efecto de 1 minuto, Mente táctica (guerrero 2).
- Reacciones que restan daño: Desviar ataques (monje 3) y Esquiva asombrosa (pícaro 5), en la ventana de recibir daño.
- Apuntar con calma (pícaro 3) como opción de acción adicional; Cuchillas psíquicas (pícaro 3) como ataque.
- Crítico mejorado y superior (campeón 3 y 15) y Golpes radiantes (paladín 11) como nota en los ataques.
- Portento (mago adivino 3): dos casillas para apuntar los números sacados.
- Libro de conjuros del mago (Lanzamiento de conjuros y Ritualista).

## 4. Fallos o reglas mal aplicadas vistos de paso

- **F1. El recuento de invocaciones cuenta una de más.** `js/views/play.js:203` y `:211` cuentan los rasgos que empiezan por «Invocación», y el propio rasgo de clase «Invocaciones sobrenaturales» también empieza así. Comprobado con la ficha de Zyo: sale «2 / 1». En la ventana «Datos» (`js/views/top.js:84-85`) ese rasgo también aparece en la lista de invocaciones.
- **F2. Lo mismo con las metamagias.** `js/views/play.js:213` y `js/views/top.js:87`: el rasgo de clase «Metamagia» cuenta como una opción conocida («1 / 2» sin haber elegido ninguna).
- **F3. No reconoce la competencia con armadura media.** `js/views/inventory.js:369` busca «intermed» en las competencias, pero las clases dicen «Ligera, media, escudos» (bárbaro, clérigo y explorador en `data/classes.js`). Comprobado: con una cota de escamas sale «No eres competente con armadura intermedia… y no puedes lanzar conjuros».
- **F4. La CA sin armadura no se recalcula si no tienes ninguna armadura en el equipo.** `js/views/inventory.js:398-402` (`acOf`) solo usa el cálculo de CA si hay alguna armadura o escudo en el equipo; si no, usa la CA guardada en la creación (`js/features/wizard.js:653-656`). Comprobado: un bárbaro sin armaduras no sube la CA al subir CON, y un hechicero dracónico con CAR 16 se queda en CA 11 en vez de 14 (la opción 10 + DES + CAR de `js/views/inventory.js:338` nunca se usa porque los hechiceros no llevan armadura).
- **F5. Conjuros bestiales (druida 18) no se aplica.** `js/views/turn.js:169` bloquea los conjuros en forma salvaje salvo al Círculo de la Luna, también a partir del nivel 18. De paso: al druida de la Luna transformado le salen todos sus conjuros, aunque el aviso dice que solo puede lanzar los de su círculo.
- **F6. Pasos de las hadas sale como «sin gastar acción».** No está en `WHEN` (`js/views/turn.js:5-47`) y `whenOf` (`:48`) lo pone en esa columna; es una acción adicional (es Paso brumoso). Además, Paso brumoso sigue gastando espacio de pacto porque no está enlazado al contador.
- **F7. Los conjuros de Arcano místico no se pueden lanzar desde la app.** Con `canCast` (`js/views/play.js:256`) un conjuro de nivel 6–9 de brujo sale «Sin espacios»: los espacios de pacto llegan a nivel 5 y el contador «Arcano místico» no está enlazado al conjuro.
- **F8. Cazador implacable (explorador 13).** Al recibir daño la app pide la salvación de concentración (`js/actions/play.js:252`) también con Marca del cazador, que a ese nivel no se pierde por daño.
- **F9. Defensa paciente y Paso del viento siempre gastan 1 punto.** `js/views/turn.js:59-70`. En 2024, Destrabarse (Defensa paciente) o Correr (Paso del viento) como acción adicional son gratis; el punto añade Esquivar, o Destrabarse y el salto doble.
- **F10. Armas de monje y arma de pacto calculan con FUE o DES.** `js/views/inventory.js:204` elige la característica solo por las propiedades del arma (Sutil o a distancia). El monje debería poder usar DES y su dado con las armas de monje, y el Pacto del Filo, CAR.
- **F11. La Furia no corta la concentración** ni impide lanzar conjuros (`js/actions/combat.js:165-171` solo gasta el uso y muestra el aviso).
