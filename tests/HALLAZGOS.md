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
- Estado: arreglado (2026-11-09): las armas del equipo inicial quedan equipadas.

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
- Estado: arreglado (2026-11-09): al pulsar «Invocar arma de pacto» se elige una de tus armas cuerpo a cuerpo o se invoca una nueva, y el tipo de daño. El ataque usa CAR (o tu mejor característica) y es competente. Solo hay una arma de pacto a la vez.

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
- Estado: pendiente

### 13. Los efectos de minutos u horas nunca bajan
- Origen: 1a. Datos de la app (conjuros)
- Tipo: Regla
- Qué pasa: solo los quitan los descansos. Los de 24 h o más se quedan hasta quitarlos a mano. Fuera de combate no hay forma de decir «han pasado 10 minutos».
- Qué debería pasar: poder hacer pasar el tiempo y que los efectos caduquen.
- Propuesta: botón «Pasa el tiempo» (10 min / 1 h) que descuente los efectos.
- Prioridad: frecuencia 2 + olvido 2 + coste 2 = 6
- Estado: pendiente

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
- Estado: pendiente

### 16. Hoja sedienta y Hoja devoradora suben los ataques con cualquier arma
- Origen: 1a. Datos de la app (invocaciones)
- Tipo: Regla
- Qué pasa: `js/views/turn.js:113-115`. Dan el ataque extra con cualquier arma, no solo con la de pacto.
- Qué debería pasar: solo con el arma de pacto.
- Propuesta: ligarlo al arma de pacto cuando exista (ver n.º 3).
- Prioridad: frecuencia 1 + olvido 2 + coste 3 = 6
- Estado: pendiente

### 17. La maestría se activa en todas las armas, sin límite
- Origen: 1a. Datos de la app (objetos)
- Tipo: Regla
- Qué pasa: `js/views/inventory.js:121` y `js/features/shop.js:136`. No se respeta el número de armas de «Maestría con armas» de cada clase, y la dote Maestro de armas no activa ninguna (`js/views/inventory.js:187`).
- Qué debería pasar: elegir tantas armas como permita la clase (y la dote).
- Propuesta: marcar en cada arma si su maestría está elegida, con el tope por clase.
- Prioridad: frecuencia 2 + olvido 2 + coste 2 = 6
- Estado: pendiente

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
- Estado: pendiente

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
- Estado: pendiente

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
- Estado: pendiente

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
- Estado: pendiente
