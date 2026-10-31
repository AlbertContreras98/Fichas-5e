/* Pestaña de partida: rasgos con usos, vida, estados, conjuros y lanzamiento. */
'use strict';

function usesCtl(f, i) {
  const u = f.uses,
    left = u.max - u.used;
  return u.pool || u.max > 12
    ? `<span class="counter"><button class="b sq" data-act="res-d" data-i="${i}" data-d="-1" aria-label="Gastar 1">−</button><input id="res-${i}" type="number" inputmode="numeric" value="${left}" data-act-input="res-set" data-i="${i}" aria-label="Quedan"><span class="of">/ ${u.max}</span><button class="b sq" data-act="res-d" data-i="${i}" data-d="1" aria-label="Recuperar 1">+</button></span>`
    : pips('feat', i, u.max, left);
}
function resRow(f, i) {
  const u = f.uses,
    left = u.max - u.used;
  const ctl =
    u.pool || u.max > 12
      ? `<span class="counter"><button class="b sq" data-act="res-d" data-i="${i}" data-d="-1" aria-label="Gastar 1">−</button><input id="res-${i}" type="number" inputmode="numeric" value="${left}" data-act-input="res-set" data-i="${i}" aria-label="Quedan"><span class="of">/ ${u.max}</span><button class="b sq" data-act="res-d" data-i="${i}" data-d="1" aria-label="Recuperar 1">+</button></span>`
      : pips('feat', i, u.max, left);
  return `<div class="slotrow"><span>${esc(f.name)}<br><small>${esc(REC[u.recover] || 'sin recuperación automática')}</small></span>${ctl}</div>`;
}
function deathHTML(c) {
  return c.hp.current <= 0
    ? `<div class="death"><div class="dl">A 0 PG: ${term('salvaciones contra muerte', 'death')}</div>
    <p class="hint">En tu turno tira un d20: 10 o más es éxito, menos es fallo. Un 1 cuenta como dos fallos y un 20 te devuelve 1 PG.</p>
    <div class="dsrow"><span>Éxitos</span>${pips('ds', 0, 3, c.deathSaves.success)}</div>
    <div class="dsrow"><span>Fallos</span>${pips('df', 0, 3, c.deathSaves.fail)}</div>
    <div class="btns"><button class="b sm" data-act="nat20">He sacado un 20</button><button class="b sm" data-act="nat1">He sacado un 1</button></div>
    ${c.deathSaves.fail >= 3 ? '<p class="hint warn">Tres fallos: tu personaje muere.</p>' : c.deathSaves.success >= 3 ? '<p class="hint">Tres éxitos: estás estable, inconsciente pero sin tirar más.</p>' : ''}</div>`
    : '';
}
function vidaHTML(c) {
  const active = CONDS.filter(x => c.conditions.includes(x[0]));
  return `<div class="vida-top"><p class="vida-hp">PG <b>${c.hp.current}</b> / ${c.hp.max}${c.hp.temp ? ` · <span class="tmp">+${c.hp.temp} temporales</span>` : ''}</p><details class="vida-hd"><summary>Dados de golpe <b>${c.hitDice.total - c.hitDice.spent} / ${c.hitDice.total} ${esc(c.hitDice.die)}</b></summary><p class="hint">En un descanso corto gastas dados para curarte: tiras el dado y sumas tu CON (${sgn(M(c, 'con'))}). Tienes tantos como tu nivel y se recuperan en el descanso largo.</p></details></div>
    <div class="hpctl"><input id="hpAmt" type="number" inputmode="numeric" min="0" placeholder="0" aria-label="Cantidad de PG">
      <button class="b bad" data-act="hp" data-m="dmg">Daño</button><button class="b good" data-act="hp" data-m="heal">Curar</button><button class="b" data-act="hp" data-m="temp">PG temporales</button><button class="b sm help" data-act="gloss" data-k="temp" aria-label="Qué son los PG temporales">?</button></div>
    ${deathHTML(c)}
    <h3>Estados</h3><div class="chips">${CONDS.map(([n]) => `<button class="chip ${c.conditions.includes(n) ? 'on' : ''}" data-act="cond" data-n="${n}" aria-pressed="${c.conditions.includes(n)}">${n}</button>`).join('')}</div>
    ${active.length ? `<ul class="condlist">${active.map(([n, ds]) => `<li><b>${n}:</b> ${esc(ds)}</li>`).join('')}</ul>` : '<p class="hint">Toca un estado para activarlo o quitarlo.</p>'}
    <div class="exh"><span>${term('Agotamiento', 'exh')}</span><button class="b sq" data-act="exh" data-d="-1" aria-label="Menos">−</button><b>${c.exhaustion}</b><button class="b sq" data-act="exh" data-d="1" aria-label="Más">+</button>
      <small>${c.exhaustion ? `Resta ${2 * c.exhaustion} a tus tiradas d20 y ${5 * c.exhaustion} pies de velocidad${c.exhaustion >= 6 ? ' · nivel 6: muerte' : ''}` : 'Ninguno'}</small></div>
    <h3>Efectos</h3>${effectsBar(c, true) || '<p class="hint">Ninguno activo.</p>'}<div class="btns"><button class="b sm" data-act="eff-add" data-from="vida">+ Efecto con duración</button></div>`;
}
function openVida() {
  restOpen = false;
  openModal(
    `<div class="wz-head"><h2>Vida y estado</h2><button class="b sm" data-act="close-modal">Hecho</button></div><div id="vida-body">${vidaHTML(C())}</div>`,
    true
  );
  tipMaybe('vida');
}
function refreshVida() {
  const b = $('#vida-body');
  if (b && C()) b.innerHTML = vidaHTML(C());
}
function viewCombat(c) {
  const start = c.combat
    ? ''
    : `<section class="card cbstart"><div><h2>¿Empieza la pelea?</h2><p class="hint">Inicia el combate para llevar la cuenta de las rondas. Al terminarlo podrás quitar los efectos y estados que ya no tengan sentido.</p></div><button class="b pri" data-act="cb-start">Iniciar combate</button></section>`;
  return `${c.hp.current <= 0 ? `<section class="card">${deathHTML(c)}</section>` : ''}${start}${viewTurn(c)}`;
}
function viewPlay(c) {
  const p = pb(c),
    def = defOf(c),
    sub = subOf(c);
  const irow = (lbl, val, desc) =>
    `<details class="inforow"><summary><span>${esc(lbl)}</span><b>${esc(val)}</b></summary><p class="hint">${esc(desc)}</p></details>`;
  const abil = `<section class="card"><h2>Características</h2><div class="abil">${ABIL.map(
    ([k, l]) => `<button class="ab" data-act="gloss" data-k="abil:${k}"><span class="lbl">${l}</span>
      <span class="mod">${sgn(M(c, k))}</span><span class="sc">${c.abilities[k]}</span>
      <span class="sv ${c.saveProf.includes(k) ? 'p' : ''}">Salv. ${sgn(saveB(c, k))}</span></button>`
  ).join('')}</div>
    <div class="abil-extra">${irow('Bonificador de competencia', sgn(p), 'Lo sumas a todo aquello en lo que eres competente: ataques, habilidades, salvaciones, herramientas y conjuros. Sube con el nivel.')}${irow('Percepción pasiva', String(10 + skillB(c, SK.perception)), 'Lo que notas sin tirar dados: 10 + tu bonificador de Percepción. El máster la usa para ver si detectas enemigos escondidos, trampas o a quien te sigue.')}</div>
    <p class="hint" style="margin-top:.6rem">Toca una característica para ver qué tirar. ${term('¿Puntuación o modificador?', 'mod')} · ${term('¿Qué es una salvación?', 'save')}</p></section>`;
  const sk = `<section class="card"><h2>Habilidades</h2>${SKILLS.map(s => {
    const pv = +c.skills[s[0]] || 0;
    return `<button class="skill" data-act="gloss" data-k="skill:${s[0]}"><span class="dot ${pv ? 'p' : ''}">${pv === 2 ? '◆' : pv ? '●' : '○'}</span><span>${s[1]}</span><span class="ak">${AB[s[2]][1]}</span><b>${sgn(skillB(c, s))}</b></button>`;
  }).join('')}
    <p class="hint" style="margin-top:.5rem">Toca una habilidad para ver para qué sirve y qué tirar. ${term('● competente · ◆ pericia', 'prof')} · ${term('Ventaja y desventaja', 'adv')}</p></section>`;
  const atk = `<section class="card"><h2>Armas y ataques</h2>${
    c.attacks.length
      ? `<div class="list">${c.attacks
          .map((a, i) => {
            const am = a.ammo && c.equipment.find(e => e.id === a.ammo);
            return `<div class="it"><div class="it-head"><span class="it-name">${esc(a.name)}</span><span class="badge">${sgn(+a.atk || 0)}</span>${a.dmg ? `<span class="badge">${esc(a.dmg)}</span>` : ''}
        ${am ? `<button class="b sm" data-act="ammo" data-i="${i}" ${am.qty > 0 ? '' : 'disabled'}>Disparar (quedan ${am.qty})</button>` : ''}</div>
      <div class="meta">${esc([a.type, a.notes].filter(Boolean).join(' · '))}</div>
      ${
        weaponTerms(a.notes).length
          ? `<div class="chips" style="margin-top:.3rem">${weaponTerms(a.notes)
              .map(w => `<button class="chip" data-act="gloss" data-k="wp:${w[0]}">${esc(w[1])}</button>`)
              .join('')}</div>`
          : ''
      }</div>`;
          })
          .join('')}</div>`
      : '<p class="empty">Sin armas. Añádelas en ⚙ Ajustes → Editar ficha.</p>'
  }
    <p class="hint" style="margin-top:.5rem">Al atacar tira 1d20 + el primer número contra la CA del enemigo; si impactas, tira el daño. ${term('¿Y si saco un 20?', 'crit')}</p></section>`;
  let mag = '';
  const scrolls = c.equipment.map((e, i) => [e, i]).filter(([e]) => e.scroll && SPBY[e.scroll] && e.qty > 0);
  if (
    scrolls.length ||
    c.spells.length ||
    c.slots.some(s => s.total > 0) ||
    c.pact.total > 0 ||
    c.spellcasting.ability
  ) {
    const groups = {};
    c.spells.forEach((sp, i) => {
      (groups[+sp.level || 0] ??= []).push([sp, i]);
    });
    const head =
      spMod(c) !== null
        ? `<div class="spellhead"><span>Aptitud: <b>${AB[c.spellcasting.ability][2]}</b></span><span>${term('CD de salvación', 'dc')}: <b>${spDC(c)}</b></span><span>${term('Ataque de conjuro', 'spatk')}: <b>${sgn(spAtk(c))}</b></span></div>`
        : '';
    mag = `<section class="card"><div class="card-head"><h2>Magia</h2><button class="b sm" data-act="sp-open">Buscar conjuros</button></div>${head}
      ${Object.keys(groups)
        .sort((a, b) => a - b)
        .map(
          L =>
            `<h3>${+L === 0 ? term('Trucos (no gastan espacio)', 'cantrip') : `Nivel ${L}`}</h3><div class="list">${groups[
              L
            ].map(([sp, i]) => {
              const ok = canCast(c, sp);
              const tags =
                (sp.src
                  ? `<span class="tag" title="No cuenta en tu límite de conjuros">${esc(sp.src)}</span>`
                  : '') +
                (sp.conc ? '<button class="tag" data-act="gloss" data-k="cconc">C</button>' : '') +
                (sp.ritual ? '<button class="tag" data-act="gloss" data-k="ritual">R</button>' : '') +
                (sp.material ? '<button class="tag" data-act="gloss" data-k="comp">M</button>' : '');
              const d = sp.ref && SPBY[sp.ref];
              const desc = sp.desc || (d ? d.de + (d.hl ? '\n\nA niveles superiores: ' + d.hl : '') : '');
              return `<div class="it"><div class="it-head"><span class="it-name">${esc(sp.name)}${tags}</span>
          <button class="b sm ${ok ? 'pri' : ''}" data-act="cast" data-i="${i}" ${ok ? '' : 'disabled'}>${+sp.level === 0 ? 'Usar' : ok ? 'Lanzar' : 'Sin espacios'}</button></div>
          <div class="meta">${esc([TIME[sp.time] || sp.time, sp.range, sp.dur, sp.material && `M: ${sp.material}`].filter(Boolean).join(' · '))}</div>
          ${desc ? `<details><summary>Qué hace</summary><p>${esc(desc)}</p></details>` : ''}</div>`;
            }).join('')}</div>`
        )
        .join('')}
      ${
        scrolls.length
          ? `<h3>Pergaminos</h3><div class="list">${scrolls
              .map(([e, i]) => {
                const d = SPBY[e.scroll];
                return `<div class="it"><div class="it-head"><span class="it-name">${esc(d.n)} <span class="tag">×${e.qty}</span></span><button class="b sm" data-act="scroll" data-i="${i}" ${e.qty > 0 ? '' : 'disabled'}>Lanzar</button></div><div class="meta">${d.l ? `Nivel ${d.l}` : 'Truco'} · ${esc(TIME[d.t] || d.t)} · CD ${SCROLL_STATS[+d.l || 0][0]} · ataque ${sgn(SCROLL_STATS[+d.l || 0][1])}</div></div>`;
              })
              .join('')}</div>`
          : ''
      }
      ${!c.spells.length && !scrolls.length ? '<p class="empty">Sin conjuros. Pulsa «Buscar conjuros» para añadirlos.</p>' : ''}</section>`;
  }
  const cinfo = infoFor(def, sub, c.level),
    cnt = pre => c.features.filter(f => norm(f.name).startsWith(norm(pre))).length;
  const feats = `<section class="card"><h2>Rasgos y dotes</h2>${
    Object.keys(cinfo).length
      ? `<div class="classinfo">${Object.entries(cinfo)
          .map(([k, v]) =>
            irow(
              k,
              k === 'Invocaciones'
                ? `${cnt('Invocación')} / ${v}`
                : k === 'Metamagias conocidas'
                  ? `${cnt('Metamagia')} / ${v}`
                  : String(v),
              INFO_DESC[k] || ''
            )
          )
          .join('')}</div>`
      : ''
  }${
    c.features.length
      ? `<div class="list">${c.features
          .map(
            (f, i) => `<div class="it"><div class="it-head"><span class="it-name">${esc(f.name)}</span></div>
      ${f.uses.max > 0 ? `<div class="usesrow">${usesCtl(f, i)}<small>${esc(REC[f.uses.recover] || 'sin recuperación automática')}</small></div>` : ''}
      ${f.source ? `<div class="meta">${esc(f.source)}</div>` : ''}
      ${f.text ? `<details><summary>Detalles</summary><p>${esc(f.text)}</p></details>` : ''}</div>`
          )
          .join('')}</div>`
      : '<p class="empty">Sin rasgos.</p>'
  }</section>`;
  const tl = toolsList(c);
  const tools = tl.length
    ? `<section class="card"><h2>Herramientas</h2><div class="list">${tl.map(x => toolDetail(c, x)).join('')}</div><p class="hint" style="margin-top:.5rem">Al usar una herramienta tiras 1d20 + ese bonificador contra la CD. Si además eres competente en una habilidad que encaje con la prueba (el máster decide cuál), tiras con ventaja.</p></section>`
    : '';
  return `<div class="cols play"><div class="col">${abil}${sk}${tools}</div><div class="col">${atk}${mag}</div><div class="col">${feats}</div></div>`;
}
function slotOptions(c, L) {
  const o = [];
  if (c.pact.total > 0 && c.pact.level >= L)
    o.push({ kind: 'pact', level: c.pact.level, avail: c.pact.total - c.pact.used });
  for (let l = L; l <= 9; l++) {
    const s = c.slots[l - 1];
    if (s.total > 0) o.push({ kind: 'slot', level: l, avail: s.total - s.used });
  }
  return o;
}
const freeUse = (c, sp) => {
  if (!sp.free) return null;
  const f = c.features.find(x => x.name === sp.free);
  return f && f.uses.max - f.uses.used > 0 ? f : null;
};
const canCast = (c, sp) => {
  const L = +sp.level || 0;
  return L === 0 || sp.ritual || !!freeUse(c, sp) || slotOptions(c, L).some(o => o.avail > 0);
};
const slotLabel = o =>
  o.kind === 'pact' ? `Espacio de pacto (nivel ${o.level})` : `Espacio de nivel ${o.level}`;
function consume(c, kind, level) {
  if (kind === 'pact') c.pact.used = Math.min(c.pact.total, c.pact.used + 1);
  else {
    const s = c.slots[level - 1];
    s.used = Math.min(s.total, s.used + 1);
  }
}
function afterCast(sp, how) {
  const c = C();
  let note = '';
  if (pendingEco) {
    spendEco(c, pendingEco);
    pendingEco = null;
  }
  if (sp.conc) {
    if (c.concentration && c.concentration !== sp.name)
      note = `<div class="t-parts">Dejas de concentrarte en ${esc(c.concentration)}.</div>`;
    c.concentration = sp.name;
  }
  addEffect(c, sp.name, parseDur(sp.dur), sp.conc);
  save();
  render();
  const extra =
    spMod(c) !== null
      ? `<div class="t-parts">CD de salvación ${spDC(c)} · ataque de conjuro ${sgn(spAtk(c))}</div>`
      : '';
  const r = sp.ref || '';
  let cbtn = '';
  if (SUMMON_REF[r])
    cbtn = `<button class="b sm pri" data-act="crea-from-cast" data-k="summon" data-s="${SUMMON_REF[r]}" data-l="${lastCastL || sp.level}" data-spell="${esc(sp.name)}">Crear la criatura</button>`;
  else if (r === 'find-steed')
    cbtn = `<button class="b sm pri" data-act="crea-from-cast" data-k="steed" data-l="${lastCastL || sp.level}" data-spell="${esc(sp.name)}">Crear la montura</button>`;
  else if (r === 'find-familiar')
    cbtn = c.companions.some(x => x.kind === 'familiar')
      ? ''
      : `<button class="b sm pri" data-act="crea-from-cast" data-k="familiar" data-spell="${esc(sp.name)}">Crear el familiar</button>`;
  else if (['polymorph', 'true-polymorph', 'shapechange'].includes(r))
    cbtn = `<button class="b sm pri" data-act="form-cast" data-spell="${esc(sp.name)}">Elegir forma</button>`;
  toast(
    `<div class="t-label">Lanzas</div><div class="t-big">${esc(sp.name)}</div><div class="t-parts">${esc(how)}${sp.conc ? ' · requiere concentración' : ''}</div>${extra}${note}${cbtn ? `<div class="t-actions">${cbtn}</div>` : ''}`,
    !!cbtn
  );
}
