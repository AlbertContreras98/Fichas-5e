# Inventario de automatizaciones

Resultado de la prueba 1a: qué hace la app **sola**, qué hace **a medias** y qué **solo muestra como texto**, para todo lo que hay en `data/`. El detalle, entrada a entrada, está en tres archivos:

- `inventario-clases.md` — rasgos de clase y subclase (guion: `inventario-clases.js`).
- `inventario-conjuros.md` — conjuros (guion: `inventario-conjuros.js`).
- `inventario-origen.md` — dotes, invocaciones, especies, linajes, trasfondos y objetos (guion: `inventario-origen.js`).

Las reglas generales que no dependen de los datos (estados, acciones, cobertura…) van aparte, en `REGLAS.md` (prueba 1b). Los fallos encontrados de paso están en `HALLAZGOS.md` (n.º 6–28). Las candidatas a automatizar se pasan a `HALLAZGOS.md` con su prioridad en la prueba 1c.

## Resumen en cifras

| Qué | Total | Sola | A medias | Solo texto |
|---|---:|---:|---:|---:|
| Rasgos de clase y subclase | 386 | 64 | 42 | 280 |
| — de ellos, niveles 1–5 | 172 | 53 | 30 | 89 |
| Conjuros | 339 | 113 | 166 | 60 |
| Dotes | 76 | 25 | 43 | 8 |
| Invocaciones | 28 | 12 | 5 | 11 |
| Especies | 10 | 3 | 6 | 1 |
| Linajes y legados | 24 | 11 | 3 | 10 |
| Trasfondos | 16 + «Otro» | 10 | 6 | «Otro» |
| Armas y armaduras | 51 | 51 | 0 | 0 |
| Propiedades de arma | 9 | 3 | 3 | 3 |
| Maestrías | 8 | 3 | 5 | 0 |
| Objetos mágicos | 6 | 4 | 2 | 0 |

**Cómo leerlo:**
- **Conjuros:** la app lleva bien lo común a todos (gastar el espacio o hacerlo ritual, la acción, la concentración, la duración y los materiales que se gastan). Pero `data/spells.js` no tiene datos de daño, curación ni salvación, así que **ningún conjuro dice qué tirar ni escala con el nivel**. De los 113 «Sola», solo 6 aplican algo con números (Armadura de mago, Falsa vida y 4 que invocan criaturas); el resto son conjuros sin números (detectar, luz…).
- **Clases:** guerrero, druida, paladín, explorador y brujo están bien cubiertos. Monje (1 de 38), bárbaro y pícaro casi no tienen nada automatizado. Los datos de `data/classes.js` (niveles, usos, dados, espacios) coinciden con el Manual de 2024.
- **Dotes:** 28 de las «a medias» solo suben la característica; el resto de la dote es texto.

## Lo que más afecta a Zyo

- **Legado ctónico:** los conjuros y Falsa vida gratis funcionan solos. La resistencia necrótica es solo texto.
- **Pacto del Filo:** a medias. «Invocar arma de pacto» solo gasta la acción adicional; no crea el ataque con CAR ni deja elegir el tipo de daño (n.º 3).
- **Estallido arcano:** no dice qué tirar (1d10, más rayos según nivel, +CAR con Estallido agonizante).
- **Contador de invocaciones:** sale «2 / 1» (n.º 9).
- **Astucia mágica (nivel 2):** el botón gasta el uso pero no devuelve los espacios de pacto.
- **Maleficio (nivel 3 en adelante):** la duración no sube con el espacio y el descanso corto lo quita (n.º 10).
- **Trasfondo y dote personalizados:** el asistente solo deja poner el nombre del trasfondo (n.º 4). La dote se añade como rasgo en «Editar ficha» y puede tener usos fijos, pero no usos «= competencia», ni subir características, PG, CA o velocidad.

## Candidatas a automatizar (las que más se notarían)

Juntadas de los tres informes, sin repetir. Se puntúan en la prueba 1c.

1. **Arma de pacto** con CAR, competencia y tipo de daño a elegir (ya en n.º 3).
2. **Daño y curación de conjuros**, empezando por los más usados: Estallido arcano, trucos de daño (14 escalan igual a niveles 5, 11 y 17), Curar heridas y Palabra de curación, castigos del paladín. Con un patrón común se cubren 52 conjuros que suben dados por nivel de espacio.
3. **Daño extra mientras dura un efecto:** Maleficio, Marca del cazador, Favor divino… (8 conjuros), Furia del bárbaro y Ataque furtivo (una vez por turno).
4. **Recordar la salvación de cada turno** al pulsar «Terminar turno»: 25 conjuros la piden.
5. **Rasgos que recuperan o curan:** Astucia mágica, Recuperación arcana y Restauración hechicera (devolver espacios); Tomar aliento, Imposición de manos, Manos sanadoras y similares (decir qué tirar y sumar los PG).
6. **CA y velocidad completas:** Defensa sin armadura siempre (n.º 7), bardo de la Danza, Escudo (+5) y Escudo de la fe (+2), Movimiento sin armadura, Movimiento rápido.
7. **Resistencias de especie** guardadas en la ficha y recordadas al recibir daño (tiefling, enano, aasimar, dracónido).
8. **Bendición, Orientación, Resistencia:** recordar el ±1d4.
9. **Elecciones que no se preguntan:** dotes de origen al crear (n.º 2 y 19), Pericia, Orden divino, Orden primigenio, trasfondo propio completo (n.º 4).
10. **Ataques creados por conjuros** (Arma espiritual, Hoja de fuego, Crear llama, Garrote, Golpe certero): darles el dato `wpn` que ya usan los conjuros propios.
11. **Maestrías con números:** daño de Rozar, CD de Derribar, Mellar sin acción adicional, tope de armas por clase (n.º 17).
12. **Monje:** golpe desarmado con DES y su dado (n.º 12), Defensa paciente gratis (n.º 11).
13. **Datos que faltan:** unos 25 contadores de subclase (Destello protector, Restaurar el equilibrio…) y varios lanzamientos gratis sin enlazar.
14. **Avisos de ventaja en concentración** con Mente arcana o Lanzador de guerra (una línea en `js/actions/play.js:254`).
15. **Usos «= bonificador de competencia»** para rasgos personalizados (útil para «Dote Superviviente»).
