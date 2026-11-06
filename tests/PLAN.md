# Plan de pruebas

Una prueba por chat. Se hace siempre **la primera pendiente**. El procedimiento está en `README.md`.

Leyenda: `[ ]` pendiente · `[x]` hecha (fecha · hallazgos)

## Fase 0 · Base

- [ ] **Base de pruebas** (`tests/base.js`): abrir la app, crear un personaje con el asistente, subirlo de nivel, empezar y terminar un combate, recibir daño y curación, descanso corto y largo. Comprobar con un guion de humo sencillo que todo funciona.

## Fase 1 · Zyo (brujo, Pacto del Filo)

- [ ] **Brujo niveles 1–5:** espacios de pacto, invocaciones, arma de pacto, subida de nivel y descansos.
- [ ] **Combate de brujo:** Explosión sobrenatural, conjuros de concentración (perderla al recibir daño), un conjuro que dure varias rondas y caer a 0 PG (salvaciones de muerte).
- [ ] **Origen de Zyo:** legado ctónico del tiefling, trasfondo «Mendigo» y «Dote Superviviente» (personalizados).

## Fase 2 · Mecánicas generales

- [ ] **Estados:** derribado, envenenado, asustado, agarrado, invisible, etc. (qué cambia la app sola).
- [ ] **Concentración y efectos:** duración en rondas y minutos, final del combate, conjuros que piden salvación cada turno.
- [ ] **Agotamiento, inspiración heroica y descansos interrumpidos.**
- [ ] **Armas y munición:** propiedades (sutil, a dos manos, arrojadiza...), maestrías de arma, munición (solo descontar al disparar).
- [ ] **Criaturas:** familiar, invocaciones, montura y compañero (PG, turnos, que desaparezcan al perder la concentración).
- [ ] **Objetos mágicos y sintonización.**

## Fase 3 · Clases (niveles 1–20, una por chat)

Para cada una: rasgos de clase, recursos (usos y cuándo se recuperan), subclase, mejoras de característica y un combate representativo.

- [ ] Bárbaro
- [ ] Bardo
- [ ] Clérigo
- [ ] Druida
- [ ] Guerrero
- [ ] Monje
- [ ] Paladín
- [ ] Explorador
- [ ] Pícaro
- [ ] Hechicero
- [ ] Brujo (niveles 6–20 y las otras subclases)
- [ ] Mago

## Fase 4 · Conjuros

- [ ] **Repaso automático de la lista de conjuros:** un guion que separe los que la app ya automatiza (daño, curación, duración, concentración, efectos) de los que solo muestran texto.
- [ ] **Conjuros de nivel 0–1 sin automatizar:** decidir cuáles merecen integración.
- [ ] **Conjuros de nivel 2–3.**
- [ ] **Conjuros de nivel 4–5.**
- [ ] **Conjuros de nivel 6–9.**

## Fase 5 · Modo máster

- [ ] **Combate del máster:** iniciativa, turnos, NPC del bestiario, caídos.
- [ ] **Compartir con QR o código:** fichas, criaturas, tiendas y recibos.
