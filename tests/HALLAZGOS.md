# Hallazgos de las pruebas

Lo que han encontrado las pruebas de `PLAN.md` y las partidas reales. Se añaden al final, con el número siguiente. En la fase 5 se pondrá aquí arriba una tabla ordenada por prioridad.

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

Estado: `pendiente` · `aceptado` (Albert quiere arreglarlo) · `descartado` (Albert prefiere dejarlo así) · `arreglado`

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

### 1. Las armas del equipo inicial no quedan equipadas
- Origen: Base, reparto y prueba de humo
- Tipo: Fallo
- Qué pasa: al crear un personaje con el asistente, la armadura y el escudo quedan puestos, pero las armas del equipo inicial entran en la mochila sin equipar. Resultado: en la pestaña Combate no sale ningún ataque con arma (pasa con las 4 fichas del reparto: el guerrero no tiene su espadón para atacar). El paso de Equipo dice «Las armas, las armaduras y el dinero se colocan solos».
- Qué debería pasar: un personaje recién creado debería poder atacar con sus armas en Combate sin tocar nada más.
- Propuesta: en `kitGive()` (asistente), marcar también como equipadas las armas del equipo de clase (o al menos las de la opción elegida), igual que se hace con la armadura.
- Prioridad: frecuencia 3 + olvido 3 + coste 3 = 9
- Estado: pendiente

### 2. «Iniciado en la magia» del trasfondo no añade sus conjuros al crear el personaje
- Origen: Base, reparto y prueba de humo
- Tipo: Fallo
- Qué pasa: con Sabio (mago) y Acólito (paladín), la dote de origen «Iniciado en la magia» aparece como rasgo y crea el contador «Conjuro de iniciado (gratis)», pero el asistente no pide ni añade los 2 trucos ni el conjuro de nivel 1, ni la característica para lanzarlos. El contador queda apuntando a un conjuro que no está en la ficha. Pasa igual con cualquier trasfondo que dé esta dote (Guía) y con la dote extra del humano. Al crear, las dotes de origen solo se copian como texto (`addFeature`), no con `featApply`, que sí sabe elegir conjuros (`spPick`) cuando la dote se coge a nivel 4.
- Qué debería pasar: al crear, el asistente debería pedir los conjuros (y la característica) de la dote, como hace al cogerla a nivel 4, y dejarlos en Magia.
- Propuesta: en el paso Trasfondo (o uno nuevo, «Dote de origen»), usar `ftPickerHTML`/`featApply` para las dotes de origen que tengan opciones.
- Prioridad: frecuencia 2 + olvido 3 + coste 2 = 7
- Estado: pendiente

### 3. El arma de pacto (Pacto del Filo) no se convierte en un ataque con CAR
- Origen: Base, reparto y prueba de humo
- Tipo: Automatizar
- Qué pasa: Zyo tiene «Invocación: Pacto del Filo» y en Combate sale «Invocar arma de pacto» como acción adicional, pero solo marca la acción adicional. Sus ataques con arma usan FUE/DES (la hoz sale a +1 y 1d4−1). Para atacar con CAR, el jugador tiene que crear a mano un ataque en «Otros ataques» y calcular el bonificador y el daño.
- Qué debería pasar: al invocar el arma de pacto, la app debería dejar elegir el arma (sencilla o marcial cuerpo a cuerpo) y crear el ataque con CAR para ataque y daño, con competencia, y el tipo de daño a elegir (el normal, necrótico, psíquico o radiante).
- Propuesta: un ataque temporal como los de los conjuros propios (`fxSpell`), ligado al arma de pacto, que se quite al volver a invocarla o al soltarla.
- Prioridad: frecuencia 3 + olvido 3 + coste 2 = 8
- Estado: pendiente

### 4. Con un trasfondo propio, el asistente solo deja escribir el nombre
- Origen: Base, reparto y prueba de humo
- Tipo: Mejora
- Qué pasa: al elegir «Otro (lo completo a mano)» en el trasfondo, el asistente no deja elegir sus 2 habilidades, la herramienta, los aumentos de características ni la dote de origen (del catálogo o casera). Para Zyo («Mendigo» con «Dote Superviviente») hubo que: sumar a mano los aumentos en las puntuaciones, y después, en «Editar ficha», añadir el rasgo «Dote Superviviente», marcar las habilidades (Sigilo y Juego de manos, elegidas para la prueba) y escribir la herramienta. La ficha de prueba usa esos valores como aproximación; el texto de la dote es provisional.
- Qué debería pasar: el trasfondo propio debería poder completarse en el mismo asistente, como uno del manual.
- Propuesta: en «Otro», mostrar los mismos campos que un trasfondo del manual: 3 características (para +2/+1 o +1/+1/+1), 2 habilidades, herramienta y dote de origen (catálogo o «Otra», con nombre y texto).
- Prioridad: frecuencia 1 + olvido 3 + coste 2 = 6
- Estado: pendiente

### 5. Algunos recursos salen con un origen equivocado
- Origen: Base, reparto y prueba de humo
- Tipo: Mejora
- Qué pasa: en «Rasgos y dotes», «Afinidad con la piedra» (rasgo de enano) sale con origen «Dote» en el guerrero enano, y «Conjuro de iniciado (gratis)» (de la dote del trasfondo) sale con origen «Elfo» en el mago y «Humano» en el paladín. Pasa porque el recurso se crea con el origen de quien lo añade primero (`upsertRes`), no con el suyo.
- Qué debería pasar: cada recurso debería decir de dónde viene (especie, linaje o dote).
- Propuesta: que `originRes` devuelva también el origen de cada recurso y `upsertRes` lo use.
- Prioridad: frecuencia 1 + olvido 1 + coste 3 = 5
- Estado: pendiente
