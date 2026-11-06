# Plan de pruebas

Una prueba por chat. Se hace siempre **la primera pendiente**. El procedimiento está en `README.md`.

Leyenda: `[ ]` pendiente · `[x]` hecha (fecha · hallazgos)

## Fase 0 · Base

- [ ] **Base de pruebas** (`tests/base.js`): abrir la app, crear un personaje con el asistente, subirlo de nivel, empezar y terminar un combate, recibir daño y curación, descanso corto y largo. Comprobar con un guion de humo sencillo que todo funciona.

## Fase 1 · Mecánicas generales

- [ ] **Especies, trasfondos y dotes:** rasgos de especie (incluido el legado ctónico del tiefling de Zyo), trasfondos y dotes, también los personalizados (como «Mendigo» y «Dote Superviviente»).
- [ ] **Estados:** derribado, envenenado, asustado, agarrado, invisible, etc. (qué cambia la app sola).
- [ ] **Concentración y efectos:** duración en rondas y minutos, final del combate, conjuros que piden salvación cada turno.
- [ ] **Agotamiento, inspiración heroica y descansos interrumpidos.**
- [ ] **Armas y munición:** propiedades (sutil, a dos manos, arrojadiza...), maestrías de arma, munición (solo descontar al disparar).
- [ ] **Criaturas:** familiar, invocaciones, montura y compañero (PG, turnos, que desaparezcan al perder la concentración).
- [ ] **Objetos mágicos y sintonización.**

## Fase 2 · Clases (niveles 1–20, una por chat)

Para cada una: rasgos de clase, recursos (usos y cuándo se recuperan), subclases, mejoras de característica y un combate representativo. El brujo va primero porque es la clase de Zyo.

- [ ] **Brujo** (todas las subclases y pactos, con especial atención al Pacto del Filo): espacios de pacto, invocaciones, arma de pacto, Explosión sobrenatural, concentración y caer a 0 PG.
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
- [ ] Mago

## Fase 3 · Conjuros

- [ ] **Repaso automático de la lista de conjuros:** un guion que separe los que la app ya automatiza (daño, curación, duración, concentración, efectos) de los que solo muestran texto.
- [ ] **Conjuros de nivel 0–1 sin automatizar:** decidir cuáles merecen integración.
- [ ] **Conjuros de nivel 2–3.**
- [ ] **Conjuros de nivel 4–5.**
- [ ] **Conjuros de nivel 6–9.**

## Fase 4 · Modo máster

- [ ] **Combate del máster:** iniciativa, turnos, NPC del bestiario, caídos.
- [ ] **Compartir con QR o código:** fichas, criaturas, tiendas y recibos.
