/* Descansos corto y largo. */
'use strict';

function shortRestModal() {
  const c = C(),
    left = c.hitDice.total - c.hitDice.spent,
    cm = M(c, 'con');
  const rec = c.features.filter(
    f => f.uses.max > 0 && (f.uses.recover === 'corto' || f.uses.recover === 'corto1')
  );
  openModal(`<h2>Descanso corto (1 hora)</h2><p>PG: <b>${c.hp.current} / ${c.hp.max}</b> · Dados de golpe: <b>${left} / ${c.hitDice.total}</b></p>
    <p class="hint">Para curarte, tira un ${esc(c.hitDice.die)} físico y escribe el resultado; se suma tu CON (${sgn(cm)}).</p>
    <div class="hpctl"><input id="hd-roll" type="number" inputmode="numeric" min="1" placeholder="Dado" aria-label="Resultado del dado de golpe"><button class="b" data-act="hd" ${left > 0 && c.hp.current < c.hp.max ? '' : 'disabled'}>Gastar dado de golpe</button></div>
    <p class="hint">Al terminar se recupera:</p><ul>${c.pact.total ? '<li>Espacios de magia de pacto</li>' : ''}${rec.map(f => `<li>${esc(f.name)}${f.uses.recover === 'corto1' ? ' (1 uso)' : ''}</li>`).join('')}${!c.pact.total && !rec.length ? '<li>Nada más que los PG de los dados que gastes</li>' : ''}</ul>
    <div class="btns"><button class="b pri" data-act="short-done">Terminar descanso</button><button class="b" data-act="close-modal">Cancelar</button></div>`);
}
