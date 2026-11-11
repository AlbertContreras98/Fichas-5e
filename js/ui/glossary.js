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
    roll = `Tira <b>1d20 ${sgn(skillB(c, s) + d20Pen(c))}</b>${pv === 2 ? ' (con pericia)' : pv ? ' (competente)' : ''}.${d20Line(c, 'check') ? `<br>${d20Line(c, 'check')}` : ''}`;
  } else if (k.startsWith('abil:')) {
    const a = k.slice(5);
    t = AB[a][2];
    d = window.ABIL_DESC[a];
    roll = `Prueba de ${AB[a][2]}: <b>1d20 ${sgn(M(c, a) + d20Pen(c))}</b>${d20Line(c, 'check') ? ` · ${d20Line(c, 'check')}` : ''}<br>Salvación de ${AB[a][2]}: <b>1d20 ${sgn(saveB(c, a) + d20Pen(c))}</b>${c.saveProf.includes(a) ? ' (competente)' : ''}${d20Line(c, 'save', a) ? ` · ${d20Line(c, 'save', a)}` : ''}`;
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
    if (k === 'r_carry') {
      const ci = carryInfo(c);
      roll = `Tú: puedes llevar <b>${ci.cap} libras</b> y empujar, arrastrar o levantar <b>${ci.push}</b>. Ahora llevas unas ${ci.total}${ci.unknown ? ` (sin contar ${ci.unknown} de peso desconocido)` : ''}.`;
    }
    if (k === 'r_jump') {
      const str = +c.abilities.str || 10,
        hi = Math.max(0, 3 + M(c, 'str'));
      roll = `Tú: longitud <b>${str} pies</b> con carrerilla (${Math.floor(str / 2)} sin ella) · altura <b>${hi} pies</b> con carrerilla (${Math.floor(hi / 2)} sin ella).`;
    }
    if (k === 'r_suffocate') {
      const m = Math.max(1, 1 + M(c, 'con'));
      roll = `Tú: aguantas <b>${m} ${m === 1 ? 'minuto' : 'minutos'}</b>.`;
    }
    if (k === 'ca' && spellACList(c).length)
      roll = `Ahora: <b>${acOf(c)}</b> con ${spellACList(c)
        .map(([n, v]) => (typeof v === 'number' ? `${esc(n)} (+${v})` : `${esc(n)} (mínimo 17)`))
        .join(', ')}. Sin ellos: ${acBase(c)}.`;
    if (k === 'speed') {
      const sp = speedCalc(c);
      roll = sp.why
        ? `Ahora: <b>0 pies</b> (${esc(sp.why)}).`
        : `Ahora: <b>${sp.ft} pies</b>${+c.exhaustion ? ` (ya restado el agotamiento)` : ''}.`;
    }
    if (k === 'init')
      roll = `Tira <b>1d20 ${sgn(init(c) + d20Pen(c))}</b>.${d20Line(c, 'init') ? `<br>${d20Line(c, 'init')}` : ''}`;
    if (k === 'spatk' && spMod(c) !== null)
      roll = `Tira <b>1d20 ${sgn(spAtk(c) + d20Pen(c))}</b>.${d20Line(c, 'atk') ? `<br>${d20Line(c, 'atk')}` : ''}`;
    if (k === 'conc')
      roll = `Tu salvación de Constitución: <b>1d20 ${sgn(saveB(c, 'con') + d20Pen(c))}</b>.${d20Line(c, 'save', 'con') ? ` ${d20Line(c, 'save', 'con')}` : ''}${concAdv(c) ? ` Para mantener la concentración, con <b>ventaja</b> (${concAdv(c)}).` : ''}`;
  }
  openModal(
    `<h2>${esc(t)}</h2><p>${esc(d)}</p>${roll ? `<p class="roll">${roll}</p>` : ''}<div class="btns"><button class="b pri" data-act="close-modal">Entendido</button></div>`
  );
}
