/* Glosario: términos pulsables y su explicación. */
'use strict';

const G = window.GLOSS;
const term = (label, k) => `<button class="term" data-act="gloss" data-k="${k}">${label}</button>`;
function weaponTerms(text) {
  const t = norm(text);
  return window.WEAPON_TERMS.filter(([k]) => t.includes(norm(k)));
}
function showGloss(el) {
  const c = C(),
    k = el.dataset.k;
  let t,
    d,
    roll = '';
  if (k.startsWith('skill:')) {
    const s = SK[k.slice(6)],
      pv = +c.skills[s[0]] || 0;
    t = s[1];
    d = window.SKILL_DESC[s[0]] + ` Usa ${AB[s[2]][2]}.`;
    roll = `Tira <b>1d20 ${sgn(skillB(c, s))}</b>${pv === 2 ? ' (con pericia)' : pv ? ' (competente)' : ''}.`;
  } else if (k.startsWith('abil:')) {
    const a = k.slice(5);
    t = AB[a][2];
    d = window.ABIL_DESC[a];
    roll = `Prueba de ${AB[a][2]}: <b>1d20 ${sgn(M(c, a))}</b><br>Salvación de ${AB[a][2]}: <b>1d20 ${sgn(saveB(c, a))}</b>${c.saveProf.includes(a) ? ' (competente)' : ''}`;
  } else if (k.startsWith('wp:')) {
    const w = window.WEAPON_TERMS.find(x => x[0] === k.slice(3));
    t = w[1];
    d = w[2];
  } else if (k.startsWith('cond:')) {
    const x = CONDS.find(x => x[0] === k.slice(5));
    t = x[0];
    d = x[1];
  } else {
    const g = G[k];
    if (!g) return;
    t = g.t;
    d = g.d;
    if (k === 'init') roll = `Tira <b>1d20 ${sgn(init(c))}</b>.`;
    if (k === 'spatk' && spMod(c) !== null) roll = `Tira <b>1d20 ${sgn(spAtk(c))}</b>.`;
    if (k === 'conc') roll = `Tu salvación de Constitución: <b>1d20 ${sgn(saveB(c, 'con'))}</b>.`;
  }
  openModal(
    `<h2>${esc(t)}</h2><p>${esc(d)}</p>${roll ? `<p class="roll">${roll}</p>` : ''}<div class="btns"><button class="b pri" data-act="close-modal">Entendido</button></div>`
  );
}
