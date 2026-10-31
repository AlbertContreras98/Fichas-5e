/* Efectos con duración (rondas, minutos o indefinidos), concentración y deshacer. */
'use strict';

/* Duraciones: {r:rondas} | {m:minutos} | {inf:true} */
function parseDur(t) {
  t = norm(t || '').replace(/^hasta\s+/, '');
  let m;
  if (/disipe/.test(t)) return { inf: true };
  if ((m = t.match(/^(\d+)\s*asaltos?/))) return { r: +m[1] };
  if ((m = t.match(/^(\d+)\s*minutos?/))) return +m[1] <= 1 ? { r: 10 * +m[1] } : { m: +m[1] };
  if ((m = t.match(/^(\d+)\s*horas?/))) return { m: 60 * +m[1] };
  if ((m = t.match(/^(\d+)\s*dias?/))) return { m: 1440 * +m[1] };
  return null;
}
function fmtEff(e) {
  if (e.r != null) return `${e.r} ronda${e.r === 1 ? '' : 's'}`;
  if (e.inf) return 'hasta que se disipe';
  const m = e.m || 0;
  return m < 60
    ? `${m} min`
    : m < 1440
      ? `${+(m / 60).toFixed(1)} h`
      : `${+(m / 1440).toFixed(1)} día${m === 1440 ? '' : 's'}`;
}
function addEffect(c, name, d, conc) {
  if (!d) return;
  c.effects = c.effects.filter(e => e.name !== name || !!e.conc !== !!conc);
  c.effects.push(Object.assign({ id: uid(), name, conc: !!conc }, d));
}
function endEffects(c, pred) {
  const gone = c.effects.filter(pred);
  if (!gone.length) return [];
  c.effects = c.effects.filter(e => !pred(e));
  if (gone.some(e => e.conc)) c.concentration = '';
  if (gone.some(e => e.form)) c.form = null;
  return gone.map(e => e.name);
}
function effectsBar(c, inModal) {
  const ce = c.concentration && c.effects.find(e => e.conc && e.name === c.concentration);
  const pills = [];
  if (!inModal) {
    c.conditions.forEach(n =>
      pills.push(`<button class="eff cond-pill" data-act="vida"><b>${esc(n)}</b></button>`)
    );
    if (+c.exhaustion)
      pills.push(`<button class="eff cond-pill" data-act="vida"><b>Agotamiento ${c.exhaustion}</b></button>`);
  }
  if (c.concentration)
    pills.push(
      `<div class="eff conc-pill"><span>${term('Concentrado', 'conc')} en <b>${esc(c.concentration)}</b>${ce ? ` · ${fmtEff(ce)}` : ''}</span><button class="b sm sq" data-act="end-conc" aria-label="Terminar concentración" title="Terminar concentración">✕</button></div>`
    );
  c.effects
    .filter(e => !e.conc)
    .forEach(e =>
      pills.push(
        `<div class="eff"><span><b>${esc(e.name)}</b> · ${fmtEff(e)}</span><button class="b sm sq" data-act="eff-del" data-id="${e.id}" aria-label="Quitar ${esc(e.name)}" title="Quitar">✕</button></div>`
      )
    );
  return pills.length ? `<div class="effrow">${pills.join('')}</div>` : '';
}
const UNDO = [];
