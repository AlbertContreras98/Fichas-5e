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
/* Muerto: tres fallos de salvación contra muerte a 0 PG (también la muerte instantánea) o agotamiento 6 */
const isDead = c => (c.hp.current <= 0 && c.deathSaves.fail >= 3) || +c.exhaustion >= 6;
const DS_BTNS = `<div class="btns"><button class="b sm good" data-act="ds-roll" data-r="20">Un 20</button><button class="b sm" data-act="ds-roll" data-r="ok">De 10 a 19</button><button class="b sm" data-act="ds-roll" data-r="ko">De 2 a 9</button><button class="b sm bad" data-act="ds-roll" data-r="1">Un 1</button></div>`;
function deathHTML(c) {
  if (isDead(c))
    return `<div class="death"><div class="dl">Tu personaje ha muerto</div>
    <p class="hint">${+c.exhaustion >= 6 ? 'Has llegado al nivel 6 de agotamiento.' : 'Tres fallos de salvación contra muerte (o un golpe que te mata en el acto).'} No todo está perdido: conjuros como Revivir o Alzar a los muertos pueden devolverte la vida. Habla con tu máster.</p>
    <div class="btns"><button class="b sm" data-act="undead">No está muerto (corregir)</button></div></div>`;
  return c.hp.current <= 0
    ? `<div class="death"><div class="dl">A 0 PG: ${term('salvaciones contra muerte', 'death')}</div>
    ${
      c.deathSaves.success >= 3
        ? '<p class="hint">Tres éxitos: estás <b>estable</b>. Sigues inconsciente, pero ya no tiras más. Si nadie te cura, recuperas 1 PG al cabo de 1d4 horas. Si recibes daño, vuelves a tirar.</p>'
        : `<p class="hint">Al empezar cada turno tuyo tira un d20 (sin sumar nada) y pulsa lo que has sacado: 10 o más es un éxito, menos es un fallo, un 1 son dos fallos y un 20 te devuelve 1 PG.</p>${DS_BTNS}`
    }
    <div class="dsrow"><span>Éxitos</span>${pips('ds', 0, 3, c.deathSaves.success)}</div>
    <div class="dsrow"><span>Fallos</span>${pips('df', 0, 3, c.deathSaves.fail)}</div></div>`
    : '';
}
/* Dados de golpe como rombos: lleno = disponible (tócalo para gastarlo), vacío = gastado (tócalo para recuperarlo) */
function hdHTML(c) {
  const T = +c.hitDice.total || 0,
    left = Math.max(0, T - (+c.hitDice.spent || 0));
  let p = '';
  for (let k = 0; k < T; k++)
    p += `<button class="pip${k < left ? ' full' : ''}" data-act="hd-pip" data-i="${k}" aria-label="${k < left ? `Gastar un dado de golpe (quedan ${left})` : 'Recuperar un dado de golpe'}"></button>`;
  return `<div class="vida-hd"><div class="hd-head"><span>Dados de golpe <small>(${esc(c.hitDice.die)})</small></span><b>${left} / ${T}</b></div>
    ${T ? `<span class="pips">${p}</span>` : ''}
    <details><summary>¿Para qué sirven?</summary><p class="hint">Sirven para curarte: tiras el dado y sumas tu CON (${sgn(M(c, 'con'))}). Se gastan sobre todo en el descanso corto, pero algunas dotes y rasgos también los usan. Toca un rombo lleno para gastar uno y uno vacío para recuperarlo. Tienes tantos como tu nivel y los recuperas en el descanso largo.</p></details></div>`;
}
function vidaHTML(c) {
  const active = CONDS.filter(x => c.conditions.includes(x[0]));
  return `<div class="vida-top"><p class="vida-hp">PG <b>${c.hp.current}</b> / ${c.hp.max}${c.hp.temp ? ` · <span class="tmp">+${c.hp.temp} temporales</span>` : ''}</p></div>
    ${hdHTML(c)}
    <div class="hpctl"><input id="hpAmt" type="number" inputmode="numeric" min="0" placeholder="0" aria-label="Cantidad de PG">
      <button class="b bad" data-act="hp" data-m="dmg">Daño</button><button class="b good" data-act="hp" data-m="heal">Curar</button><button class="b" data-act="hp" data-m="temp">PG temporales</button><button class="b sm help" data-act="gloss" data-k="temp" aria-label="Qué son los PG temporales">?</button></div>
    <div class="hpctl2"><small>Daño con</small><button class="b sm bad" data-act="hp" data-m="half">Resistencia (½)</button><button class="b sm bad" data-act="hp" data-m="double">Vulnerabilidad (×2)</button></div>
    ${dmgReactions(c)}
    ${resistOf(c).length ? `<p class="hint warn"><b>Resistes:</b> ${esc(resistOf(c).join(', '))}. Si el daño es de ese tipo, pulsa «Resistencia (½)».</p>` : ''}
    <p class="hint">Escribe el daño que sale en los dados. Con resistencia recibes la mitad (redondeando hacia abajo); con vulnerabilidad, el doble.</p>
    ${deathHTML(c)}
    <h3>Estados</h3><div class="chips">${CONDS.map(([n]) => `<button class="chip ${c.conditions.includes(n) ? 'on' : ''}" data-act="cond" data-n="${n}" aria-pressed="${c.conditions.includes(n)}">${n}</button>`).join('')}</div>
    ${active.length ? `<ul class="condlist">${active.map(([n, ds]) => `<li><b>${n}:</b> ${esc(ds)}</li>`).join('')}</ul>` : '<p class="hint">Toca un estado para activarlo o quitarlo.</p>'}
    <div class="exh"><span>${term('Agotamiento', 'exh')}</span><button class="b sq" data-act="exh" data-d="-1" aria-label="Menos">−</button><b>${c.exhaustion}</b><button class="b sq" data-act="exh" data-d="1" aria-label="Más">+</button>
      <small>${c.exhaustion ? `Resta ${2 * c.exhaustion} a tus tiradas d20 y ${5 * c.exhaustion} pies de velocidad${c.exhaustion >= 6 ? ' · nivel 6: muerte' : ''}` : 'Ninguno'}</small></div>
    <h3>Efectos</h3>${effectsBar(c, true) || '<p class="hint">Ninguno activo.</p>'}<div class="btns"><button class="b sm" data-act="eff-add" data-from="vida">+ Efecto con duración</button></div>${
      c.effects.some(e => e.r != null || e.m != null) && !c.combat
        ? `<div class="btns"><small>Pasa el tiempo:</small>${[
            [1, '1 min'],
            [10, '10 min'],
            [60, '1 hora'],
          ]
            .map(([m, l]) => `<button class="b sm" data-act="pass-time" data-m="${m}">${l}</button>`)
            .join('')}</div>`
        : ''
    }`;
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
  if (isDead(c)) return `<section class="card">${deathHTML(c)}</section>${rulesCard()}`;
  return `${c.hp.current <= 0 ? `<section class="card">${deathHTML(c)}</section>` : ''}${start}${viewTurn(c)}${rulesCard()}`;
}
/* Componentes del conjuro en palabras: «voz y gestos» (V = hablar, S = mover una mano, M = un material) */
function spComp(sp) {
  const v = (sp.ref && SPBY[sp.ref] && SPBY[sp.ref].v) || '';
  if (!v) return '';
  return (
    'necesita ' +
    [/V/.test(v) && 'voz', /S/.test(v) && 'gestos', /M/.test(v) && 'material'].filter(Boolean).join(', ')
  );
}
/* Reglas comunes para consultar en mitad del combate (cobertura, saltar, luz…) */
const RULES_LIST = [
  'r_cover',
  'r_range',
  'r_terrain',
  'r_jump',
  'r_climb',
  'r_fall',
  'r_light',
  'r_surprise',
  'r_stabilize',
  'r_suffocate',
  'r_restbreak',
  'r_group',
  'r_food',
  'r_object',
  'r_improv',
  'r_immune',
  'r_fly',
  'r_size',
  'r_travel',
  'r_senses',
  'r_knockout',
  'r_mounted',
  'r_underwater',
  'a_magic',
  'crit',
  'death',
  'conc',
];
const rulesCard = () =>
  `<section class="card"><details class="rules"><summary><b>Reglas útiles</b> <small>cobertura, saltar, luz, caídas…</small></summary><p class="hint">Toca una para ver qué dice.</p><div class="chips">${RULES_LIST.filter(
    k => G[k]
  )
    .map(k => term(esc(G[k].t), k))
    .join('')}</div></details></section>`;
function viewPlay(c) {
  const p = pb(c),
    def = defOf(c),
    sub = subOf(c);
  const irow = (lbl, val, desc) =>
    `<details class="inforow"><summary><span>${esc(lbl)}</span><b>${esc(val)}</b></summary><p class="hint">${esc(desc)}</p></details>`;
  const abil = `<section class="card"><h2>Características</h2><div class="abil">${ABIL.map(
    ([k, l]) => `<button class="ab" data-act="gloss" data-k="abil:${k}"><span class="lbl">${l}</span>
      <span class="mod">${sgn(M(c, k))}</span><span class="sc">${c.abilities[k]}</span>
      <span class="sv ${c.saveProf.includes(k) ? 'p' : ''}">Salv. ${sgn(saveB(c, k) + d20Pen(c))}</span></button>`
  ).join('')}</div>
    <div class="abil-extra">${irow('Bonificador de competencia', sgn(p), 'Lo sumas a todo aquello en lo que eres competente: ataques, habilidades, salvaciones, herramientas y conjuros. Sube con el nivel.')}${irow('Percepción pasiva', String(10 + skillB(c, SK.perception)), 'Lo que notas sin tirar dados: 10 + tu bonificador de Percepción. El máster la usa para ver si detectas enemigos escondidos, trampas o a quien te sigue.')}</div>
    <p class="hint" style="margin-top:.6rem">Toca una característica para ver qué tirar. ${term('¿Puntuación o modificador?', 'mod')} · ${term('¿Qué es una salvación?', 'save')}</p></section>`;
  const sk = `<section class="card"><h2>Habilidades</h2>${SKILLS.map(s => {
    const pv = +c.skills[s[0]] || 0;
    return `<button class="skill" data-act="gloss" data-k="skill:${s[0]}"><span class="dot ${pv ? 'p' : ''}">${pv === 2 ? '◆' : pv ? '●' : '○'}</span><span>${s[1]}</span><span class="ak">${AB[s[2]][1]}</span><b>${sgn(skillB(c, s) + d20Pen(c))}</b></button>`;
  }).join(
    ''
  )}${+c.exhaustion ? `<p class="hint warn">Agotamiento ${c.exhaustion}: las habilidades y salvaciones ya llevan restado el −${2 * c.exhaustion}.</p>` : ''}
    <p class="hint" style="margin-top:.5rem">Toca una habilidad para ver para qué sirve y qué tirar. ${term('● competente · ◆ pericia', 'prof')} · ${term('Ventaja y desventaja', 'adv')}</p></section>`;
  const atkBadges = a =>
    `<span class="badge">${sgn(+a.atk || 0)}</span>${a.dmg ? `<span class="badge">${esc(a.dmg)}</span>` : ''}`;
  const atkChips = notes =>
    weaponTerms(notes).length
      ? `<div class="chips" style="margin-top:.3rem">${weaponTerms(notes)
          .map(w => `<button class="chip" data-act="gloss" data-k="wp:${w[0]}">${esc(w[1])}</button>`)
          .join('')}</div>`
      : '';
  const shoot = (a, i) => {
    const am = a.ammo && c.equipment.find(e => e.id === a.ammo);
    return am
      ? `<button class="b sm" data-act="ammo" data-i="${i}" ${am.qty > 0 ? '' : 'disabled'}>Disparar (quedan ${am.qty})</button>`
      : '';
  };
  const wpnRows = c.equipment
    .filter(e => e.cat === 'arma')
    .map(e => {
      const i = c.attacks.findIndex(a => a.item === e.id),
        a =
          i >= 0
            ? c.attacks[i]
            : e.weapon && WEAPONS[e.weapon]
              ? wpnCalc(c, { wpn: e.weapon, magic: e.magic })
              : null,
        on = wpnOn(c, e);
      return `<div class="it${a && !on ? ' off' : ''}"><div class="it-head"><button class="it-link" data-act="item-open" data-id="${e.id}">${esc(e.name)}</button>${a ? atkBadges(a) : ''}
        ${i >= 0 || (e.weapon && WEAPONS[e.weapon]) ? `<button class="chip ${on ? 'on' : ''}" data-act="wpn-eq" data-id="${e.id}" aria-pressed="${on}">${on ? 'Equipada' : 'Sin equipar'}</button>${on ? shoot(c.attacks[i], i) : ''}` : ''}${i >= 0 && masteryMax(c) && WEAPONS[c.attacks[i].wpn] ? `<button class="chip ${c.attacks[i].mastery ? 'on' : ''}" data-act="wpn-ms" data-i="${i}" aria-pressed="${!!c.attacks[i].mastery}" title="${esc(MASTERY[WEAPONS[c.attacks[i].wpn].ms][1])}">Maestría: ${MASTERY[WEAPONS[c.attacks[i].wpn].ms][0].toLowerCase()}</button>` : ''}</div>
      ${a ? `<div class="meta">${esc([a.type, a.notes].filter(Boolean).join(' · '))}</div>${atkChips(a.notes)}` : e.notes ? `<div class="meta">${esc(e.notes)}</div>` : ''}</div>`;
    });
  const otherRows = c.attacks
    .map((a, i) => [a, i])
    .filter(([a]) => !atkItem(c, a))
    .map(
      ([a, i]) =>
        `<div class="it"><div class="it-head"><button class="it-link" data-act="atk-open" data-i="${i}">${esc(a.name || 'Ataque')}</button>${atkBadges(a)}${shoot(a, i)}</div>
      ${a.type || a.notes ? `<div class="meta">${esc([a.type, a.notes].filter(Boolean).join(' · '))}</div>` : ''}${atkChips(a.notes)}</div>`
    );
  const atk = `<section class="card"><div class="card-head"><h2>Armas y ataques</h2><button class="b sm" data-act="item-new" data-from="arma">Añadir arma</button></div>
    ${wpnRows.length ? `<div class="list">${wpnRows.join('')}</div>` : '<p class="empty">Sin armas. Pulsa «Añadir arma» para elegirla del catálogo.</p>'}
    ${masteryMax(c) ? `<p class="hint ${masteryKinds(c).length > masteryMax(c) ? 'warn' : ''}">Maestrías en uso: ${masteryKinds(c).length} de ${masteryMax(c)}${masteryKinds(c).length > masteryMax(c) ? ': quita alguna' : ''}. Se pueden cambiar al terminar un descanso largo.</p>` : ''}
    ${otherRows.length ? `<h3>Otros ataques</h3><div class="list">${otherRows.join('')}</div>` : ''}
    <div class="btns" style="margin-top:.4rem"><button class="b sm" data-act="atk-open" data-i="-1">Añadir otro ataque</button></div>
    <p class="hint" style="margin-top:.5rem">Las armas equipadas salen en Combate para atacar. «Otros ataques» son los que no vienen de un arma de tu equipo, como un arma de pacto o un ataque sin armas. Al atacar tira 1d20 + el primer número contra la CA del enemigo; si impactas, tira el daño. ${term('¿Y si saco un 20?', 'crit')}</p></section>`;
  const AC = armorAuto(c) ? acCalc(c) : null,
    armRows = c.equipment
      .map((e, i) => [e, i])
      .filter(([e]) => e.cat === 'armadura')
      .map(([e, i]) => {
        const sub = itemSub(c, e).replace(/ · (puesta|embrazado)/, '');
        return `<div class="it"><div class="it-head"><button class="it-link" data-act="item-open" data-id="${e.id}">${esc(e.name)}</button>${e.armor && ARMORS[e.armor] ? `<button class="chip ${e.equipped ? 'on' : ''}" data-act="eq" data-i="${i}" aria-pressed="${!!e.equipped}">${e.equipped ? (ARMORS[e.armor].t === 's' ? 'Embrazado' : 'Puesta') : ARMORS[e.armor].t === 's' ? 'Embrazar' : 'Ponérmela'}</button>` : ''}</div>
      ${sub ? `<div class="meta">${sub}</div>` : ''}</div>`;
      });
  const arm = `<section class="card"><div class="card-head"><h2>Armaduras y escudos</h2><button class="b sm" data-act="item-new" data-from="armadura">Añadir armadura</button></div>
    ${AC ? `<div class="acbox"><div><b>CA ${AC.ac}</b><small>${esc(AC.src)}</small></div>${AC.warn.map(w => `<p class="hint warn">${esc(w)}</p>`).join('')}</div>` : ''}
    ${armRows.length ? `<div class="list">${armRows.join('')}</div>` : '<p class="empty">Sin armadura ni escudo.</p>'}</section>`;
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
    mag = `<section class="card"><div class="card-head"><h2>Magia</h2><div class="btns"><button class="b sm" data-act="cs-new">Crear conjuro</button><button class="b sm" data-act="sp-open">Buscar conjuros</button></div></div>${head}
      ${Object.keys(groups)
        .sort((a, b) => a - b)
        .map(
          L =>
            `<h3>${+L === 0 ? term('Trucos (no gastan espacio)', 'cantrip') : `Nivel ${L}`}</h3><div class="list">${groups[
              L
            ].map(([sp, i]) => {
              const ok = canCast(c, sp);
              const tags =
                (csOwn(sp) ? '<span class="tag" title="Conjuro creado por ti">propio</span>' : '') +
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
          <div class="meta">${esc([TIME[sp.time] || sp.time, sp.range, sp.dur, spComp(sp), sp.material && `M: ${sp.material}`, sp.hd && (sp.hd === 'lvl' ? 'gasta dados de golpe según el nivel' : `gasta ${sp.hd} ${+sp.hd === 1 ? 'dado' : 'dados'} de golpe`), sp.wpn && `crea: ${sp.wpn.n}`].filter(Boolean).join(' · '))}</div>
          ${desc || csOwn(sp) ? `<details><summary>Qué hace</summary>${desc ? `<p>${esc(desc)}</p>` : ''}${csOwn(sp) ? `<div class="btns"><button class="b sm" data-act="cs-edit" data-i="${i}">Editar conjuro</button></div>` : ''}</details>` : ''}</div>`;
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
      ${!c.spells.length && !scrolls.length ? '<p class="empty">Sin conjuros. Pulsa «Buscar conjuros» para añadirlos o «Crear conjuro» para inventar uno.</p>' : ''}
      <div class="sp-own"><small>Conjuros propios:</small><button class="b sm" data-act="cs-exp">Exportar mis conjuros</button><label class="b sm">Importar conjuros<input type="file" id="cs-file" accept=".json,application/json,text/plain" hidden></label></div></section>`;
  }
  const cinfo = infoFor(def, sub, c.level),
    cnt = pre => c.features.filter(f => norm(f.name).startsWith(norm(pre))).length;
  const feats = `<section class="card"><div class="card-head"><h2>Rasgos y dotes</h2><div class="btns">${c.classKey === 'warlock' ? '<button class="b sm" data-act="iv-open">Invocaciones</button>' : ''}<button class="b sm" data-act="ft-open">Dotes</button></div></div>${
    Object.keys(cinfo).length
      ? `<div class="classinfo">${Object.entries(cinfo)
          .map(([k, v]) =>
            irow(
              k,
              k === 'Invocaciones'
                ? `${cnt('Invocación:')} / ${v}`
                : k === 'Metamagias conocidas'
                  ? `${cnt('Metamagia:')} / ${v}`
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
      ${f.uses.max > 0 ? `<div class="usesrow">${usesCtl(f, i)}<small>${esc(REC[f.uses.recover] || 'sin recuperación automática')}</small>${f.name === 'Astucia mágica' && f.uses.used < f.uses.max ? `<button class="b sm" data-act="cunning" data-i="${i}">Usar</button>` : ''}${['Recuperación arcana', 'Restauración hechicera'].includes(f.name) && f.uses.used < f.uses.max ? `<button class="b sm" data-act="${f.name === 'Recuperación arcana' ? 'arcane' : 'sorc-rest'}" data-i="${i}">Usar</button>` : ''}</div>` : ''}
      ${f.source ? `<div class="meta">${esc(f.source)}</div>` : ''}
      ${f.text ? `<details><summary>Detalles</summary><p>${esc(f.text)}</p></details>` : ''}</div>`
          )
          .join('')}</div>`
      : '<p class="empty">Sin rasgos.</p>'
  }</section>`;
  const tl = toolsList(c);
  const tools = `<section class="card"><div class="card-head"><h2>Herramientas</h2><button class="b sm" data-act="item-new" data-from="herramienta">Añadir herramienta</button></div>${
    tl.length
      ? `<div class="list">${tl.map(x => toolDetail(c, x)).join('')}</div><p class="hint" style="margin-top:.5rem">Al usar una herramienta tiras 1d20 + ese bonificador contra la CD. Si además eres competente en una habilidad que encaje con la prueba (el máster decide cuál), tiras con ventaja.</p>`
      : '<p class="empty">Sin herramientas.</p>'
  }</section>`;
  return `<div class="cols play"><div class="col">${abil}${sk}</div><div class="col">${atk}${arm}${tools}</div><div class="col">${mag}${feats}</div></div>`;
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
  /* Arcano místico: los conjuros de brujo de nivel 6 a 9 se lanzan con su uso, sin espacio */
  const free = sp.free || (c.classKey === 'warlock' && +sp.level >= 6 ? 'Arcano místico' : '');
  if (!free) return null;
  const f = c.features.find(x => x.name === free);
  if (f && sp.atwill) return { atwill: true };
  return f && f.uses.max - f.uses.used > 0 ? f : null;
};
const canCast = (c, sp) => {
  const L = +sp.level || 0;
  return L === 0 || sp.ritual || !!freeUse(c, sp) || slotOptions(c, L).some(o => o.avail > 0);
};
const slotLabel = o =>
  o.kind === 'pact' ? `Espacio de pacto (nivel ${o.level})` : `Espacio de nivel ${o.level}`;
function consume(c, kind, level) {
  if (c.combat && c.turn) {
    if (c.turn.slot)
      toast(
        '<div class="t-label">Ojo</div><div class="t-parts">Solo puedes gastar un espacio de conjuro por turno. Si es una reacción fuera de tu turno, no pasa nada.</div>'
      );
    c.turn.slot = true;
  }
  if (kind === 'pact') c.pact.used = Math.min(c.pact.total, c.pact.used + 1);
  else {
    const s = c.slots[level - 1];
    s.used = Math.min(s.total, s.used + 1);
  }
}
/* Lo que hace un conjuro propio al lanzarlo: gastar dados de golpe y crear su arma. Devuelve el aviso para el mensaje */
function csOnCast(c, sp) {
  const out = [];
  if (sp.hd) {
    const n = Math.min(csHdCost(sp, lastCastL || +sp.level), c.hitDice.total - c.hitDice.spent);
    c.hitDice.spent += n;
    if (n)
      out.push(
        `Gastas ${n} ${n === 1 ? 'dado' : 'dados'} de golpe (${esc(c.hitDice.die)}) · te quedan ${c.hitDice.total - c.hitDice.spent}.`
      );
  }
  if (sp.wpn) {
    const w = sp.wpn,
      r = csWeaponAtk(c, w),
      timed = c.effects.some(e => e.name === sp.name);
    c.attacks = c.attacks.filter(a => a.fxSpell !== sp.name);
    c.attacks.push(
      Object.assign(NEW.attacks(), {
        name: w.n,
        atk: r.atk,
        dmg: r.dmg,
        type: w.t,
        notes: [w.p.join(', ').replace(/^./, m => m.toUpperCase()), w.fx, `Conjuro: ${sp.name}`]
          .filter(Boolean)
          .join(' · '),
        fxSpell: timed ? sp.name : '',
      })
    );
    out.push(
      `${esc(w.n)} aparece en tus ataques: ${sgn(r.atk)} al ataque, ${esc(r.dmg)} ${esc(w.t)}.${timed ? ' Desaparece al acabar el conjuro.' : ''}`
    );
  }
  return out.map(t => `<div class="t-parts">${t}</div>`).join('');
}
/* Conjuros del catálogo que te dan un ataque mientras duran (Arma espiritual, Hoja de fuego, Crear llama, Garrote) */
const CAT_WPN = {
  'spiritual-weapon': (c, L, t, m) => [
    'Arma espiritual',
    `${Math.max(1, L - 1)}d8`,
    'de fuerza',
    'Ataque de conjuro cuerpo a cuerpo. Con tu acción adicional puedes moverla 20 pies y atacar otra vez en turnos posteriores',
  ],
  'flame-blade': (c, L, t, m) => [
    'Hoja de fuego',
    `${Math.max(3, L + 1)}d6`,
    'de fuego',
    'Ataque de conjuro cuerpo a cuerpo con la acción Magia',
  ],
  'produce-flame': (c, L, t, m) => [
    'Crear llama (lanzarla)',
    `${t}d8`,
    'de fuego',
    'Ataque de conjuro a distancia, 60 pies, con la acción Magia',
    true,
  ],
  shillelagh: (c, L, t, m) => [
    'Garrote (conjuro)',
    ['1d8', '1d10', '1d12', '2d6'][t - 1],
    'contundente o de fuerza',
    'Tu garrote o bastón usa tu aptitud mágica',
  ],
};
function catWpnOnCast(c, sp) {
  const f = CAT_WPN[sp.ref || ''],
    mod = spMod(c);
  if (!f || mod === null || !c.effects.some(e => e.name === sp.name)) return '';
  const [n, dice, type, note, noMod] = f(
      c,
      Math.max(+sp.level || 0, lastCastL || 0),
      cantripTier(+c.level || 1),
      mod
    ),
    dmg = `${dice}${noMod || !mod ? '' : ` ${mod > 0 ? '+' : '−'} ${Math.abs(mod)}`}`;
  c.attacks = c.attacks.filter(a => a.fxSpell !== sp.name);
  c.attacks.push(
    Object.assign(NEW.attacks(), {
      name: n,
      atk: spAtk(c),
      dmg,
      type,
      notes: `${note} · Conjuro: ${sp.name}`,
      fxSpell: sp.name,
    })
  );
  return `<div class="t-parts">${esc(n)} aparece en tus ataques: ${sgn(spAtk(c))} al ataque, ${esc(dmg)} ${esc(type)}. Desaparece al acabar el conjuro.</div>`;
}
/* PG temporales de un conjuro: no se suman, te quedas con el valor más alto */
function giveTemp(c, n, from) {
  const had = c.hp.temp;
  if (n > had) c.hp.temp = n;
  save();
  render();
  refreshVida();
  toast(
    n > had
      ? `<div class="t-label">${esc(from)}</div><div class="t-big good">${n} PG temporales</div>${had ? `<div class="t-parts">Sustituyen a los ${had} que tenías (no se suman).</div>` : ''}`
      : `<div class="t-label">${esc(from)}</div><div class="t-parts">Sacas ${n}, pero ya tienes ${had} PG temporales: no se suman y te quedas con los ${had}.</div>`
  );
}
/* Falsa vida: suma sola los PG temporales (con Vigor infernal, el máximo del dado sin tirar) */
function falseLife(c, sp) {
  const L = Math.max(1, lastCastL || 1),
    bonus = 4 + 5 * (L - 1),
    vigor = castFree && sp.src === 'Invocación' && /vigor infernal/i.test(sp.free || '');
  castFree = false;
  if (vigor) return giveTemp(c, 8 + bonus, 'Falsa vida (Vigor infernal)');
  openModal(`<h2>Falsa vida</h2><p>Tira <b>2d4</b> y escribe lo que suman. La app añade ${bonus}${L > 1 ? ` (4 + 5 por cada nivel de espacio por encima de 1)` : ''}.</p>
    <div class="hpctl"><input id="fl-r" type="number" inputmode="numeric" min="2" max="8" placeholder="2d4" aria-label="Resultado de 2d4"><button class="b good" data-act="fl-ok" data-x="${bonus}">Ganar PG temporales</button></div>
    <p class="hint">Los PG temporales no se suman a los que ya tengas: te quedas con el valor más alto.</p>
    <div class="btns"><button class="b" data-act="close-modal">Ahora no</button></div>`);
  setTimeout(() => $('#fl-r') && $('#fl-r').focus(), 0);
}
/* Reacciones que restan daño (Desviar ataques, Esquiva asombrosa, Aguante de piedra): botones en la ventana de daño */
const DMG_REACT = [
  [
    'deflect',
    'Desviar ataques',
    '1d10',
    c => M(c, 'dex') + c.level,
    'el daño de un ataque (contundente, cortante o perforante, salvo con Desviar energía)',
  ],
  ['uncanny', 'Esquiva asombrosa', '', null, 'la mitad del daño de un ataque que veas'],
  ['stone', 'Aguante de piedra', '1d12', c => M(c, 'con'), 'el daño que recibes'],
];
function dmgReactApply(c, R, dmg, red) {
  const f = c.features.find(x => x.name === R[1]);
  if (f && f.uses && +f.uses.max) f.uses.used = Math.min(f.uses.max, f.uses.used + 1);
  if (c.turn) c.turn.r = true;
  const left = Math.max(0, dmg - red);
  toast(
    `<div class="t-label">${esc(R[1])}</div><div class="t-parts">Reduces ${Math.min(dmg, red)} del daño: de ${dmg} a <b>${left}</b>.${R[0] === 'deflect' && !left ? ' Puedes gastar 1 punto de concentración para devolver el golpe a otra criatura.' : ''}</div>`
  );
  openVida();
  if (left) {
    $('#hpAmt').value = left;
    A.hp({ dataset: { m: 'dmg' } });
  } else {
    save();
    render();
  }
}
function dmgReactions(c) {
  const has = n => c.features.find(f => f.name === n);
  const l = DMG_REACT.filter(([, n]) => has(n));
  if (!l.length) return '';
  return `<div class="hpctl2"><small>Con tu reacción${c.turn && c.turn.r ? ' (ya gastada)' : ''}</small>${l
    .map(([k, n]) => {
      const f = has(n),
        left = f.uses && +f.uses.max ? f.uses.max - f.uses.used : 1;
      return `<button class="b sm" data-act="hp-red" data-k="${k}" ${left > 0 && !(c.turn && c.turn.r) ? '' : 'disabled'}>${esc(n)}</button>`;
    })
    .join('')}</div>`;
}
/* Ventana de curación de un rasgo: el jugador tira el dado y la app suma el resto */
function healRoll(title, text, bonus, max) {
  openModal(`<h2>${esc(title)}</h2><p>${text}</p>
    <div class="hpctl"><input id="hr-r" type="number" inputmode="numeric" min="1" max="${max}" placeholder="1–${max}" aria-label="Resultado del dado"><button class="b good" data-act="hr-ok" data-x="${bonus}" data-max="${max}" data-t="${esc(title)}">Curarme</button></div>
    <div class="btns"><button class="b" data-act="close-modal">Ahora no</button></div>`);
  setTimeout(() => $('#hr-r') && $('#hr-r').focus(), 0);
}
function afterCast(sp, how) {
  const c = C();
  let note = '';
  const eco = pendingEco;
  if (pendingEco) {
    spendEco(c, pendingEco);
    pendingEco = null;
  }
  if (sp.conc) {
    if (c.concentration && c.concentration !== sp.name)
      note = `<div class="t-parts">Dejas de concentrarte en ${esc(c.concentration)}.</div>`;
    c.concentration = sp.name;
  }
  addEffect(c, sp.name, spellDur(sp, lastCastL), sp.conc, eco !== 'R');
  if (sp.ref === 'shield') {
    /* Escudo dura hasta el principio de tu siguiente turno */
    markSt(
      c,
      c.effects.find(e => e.name === sp.name)
    );
  }
  if (castOther) {
    const fx = c.effects.find(e => e.name === sp.name);
    if (fx) fx.other = true;
    castOther = false;
  }
  const used =
    spUseItem(c, sp) +
    csOnCast(c, sp) +
    catWpnOnCast(c, sp) +
    (SPELL_AC[sp.ref] && !(c.effects.find(e => e.name === sp.name) || {}).other
      ? `<div class="t-parts">Tu CA pasa a <b>${acOf(c)}</b>${sp.ref === 'shield' ? ' hasta el principio de tu siguiente turno (también contra el ataque que la provocó)' : ' mientras dure'}.</div>`
      : '');
  save();
  render();
  const r = sp.ref || '',
    L = Math.max(+sp.level || 0, lastCastL || 0),
    roll =
      cantripRoll(c, sp) ||
      (r === 'searing-smite'
        ? `<div class="t-parts">El ataque que acabas de impactar hace <b>${L}d6 de fuego</b> extra.</div>`
        : r === 'shining-smite'
          ? `<div class="t-parts">El ataque que acabas de impactar hace <b>${L}d6 radiante</b> extra.</div>`
          : '');
  const extra =
    roll ||
    upcastLine(c, sp, L) +
      (spMod(c) !== null
        ? `<div class="t-parts">CD de salvación ${spDC(c)} · ataque de conjuro ${sgn(spAtk(c) + d20Pen(c))}</div>`
        : '');
  let cbtn = '';
  /* Un conjuro propio que se llame como una invocación del catálogo de criaturas se enlaza con su ficha */
  const sumK = SUMMON_REF[r] || (!r && Object.keys(SUMMONS).find(k => norm(SUMMONS[k].n) === norm(sp.name)));
  if (sumK)
    cbtn = `<button class="b sm pri" data-act="crea-from-cast" data-k="summon" data-s="${sumK}" data-l="${lastCastL || sp.level}" data-spell="${esc(sp.name)}">Crear la criatura</button>`;
  else if (r === 'find-steed')
    cbtn = `<button class="b sm pri" data-act="crea-from-cast" data-k="steed" data-l="${lastCastL || sp.level}" data-spell="${esc(sp.name)}">Crear la montura</button>`;
  else if (r === 'find-familiar')
    cbtn = c.companions.some(x => x.kind === 'familiar')
      ? ''
      : `<button class="b sm pri" data-act="crea-from-cast" data-k="familiar" data-spell="${esc(sp.name)}">Crear el familiar</button>`;
  else if (healOf(c, sp, L)) {
    const h = healOf(c, sp, L);
    cbtn = `<button class="b sm good" data-act="heal-cast" data-n="${h.n}" data-d="${h.d}" data-x="${h.bonus}" data-t="${esc(sp.name)}">Me curo a mí</button>`;
  } else if (['polymorph', 'true-polymorph', 'shapechange'].includes(r))
    cbtn = `<button class="b sm pri" data-act="form-cast" data-spell="${esc(sp.name)}">Elegir forma</button>`;
  toast(
    `<div class="t-label">Lanzas</div><div class="t-big">${esc(sp.name)}</div><div class="t-parts">${esc(how)}${sp.conc ? ' · requiere concentración' : ''}</div>${used}${extra}${note}${cbtn ? `<div class="t-actions">${cbtn}</div>` : ''}`,
    !!cbtn
  );
  if (r === 'false-life') falseLife(c, sp);
  castFree = false;
}

/* Ventana de un ataque que no viene de un arma del equipo (arma de pacto, ataque sin armas…). i = -1 para uno nuevo */
function atkSheet(i) {
  const c = C(),
    a = i >= 0 ? c.attacks[i] : NEW.attacks(),
    auto = a.wpn && WEAPONS[a.wpn],
    ammo = c.equipment.filter(e => e.cat === 'municion'),
    f = (l, h, w) => `<label class="f ${w || ''}"><span>${l}</span>${h}</label>`;
  if (!a) return;
  openModal(`<div class="wz-head"><h2>${i >= 0 ? esc(a.name || 'Ataque') : 'Nuevo ataque'}</h2><button class="b sm" data-act="close-modal">Volver</button></div>
    <div class="grid">
      ${f('Nombre', `<input id="at-name" value="${esc(a.name)}" placeholder="Arma de pacto, ataque sin armas…" autocomplete="off">`, 'wide')}
      ${
        auto
          ? `<p class="hint wide">Ataque <b>${sgn(+a.atk || 0)}</b> · daño <b>${esc(a.dmg)}</b> ${esc(a.type || '')}. Se calcula solo con tus características.</p>`
          : f(
              'Bonificador de ataque',
              `<input id="at-atk" type="number" inputmode="numeric" value="${esc(+a.atk || 0)}">`
            ) +
            f('Daño', `<input id="at-dmg" value="${esc(a.dmg)}" placeholder="1d8+3" autocomplete="off">`) +
            f(
              'Tipo de daño',
              `<input id="at-type" value="${esc(a.type || '')}" placeholder="cortante, necrótico…" autocomplete="off">`,
              'wide'
            ) +
            f(
              'Notas',
              `<textarea id="at-notes" rows="2" placeholder="Opcional">${esc(a.notes || '')}</textarea>`,
              'wide'
            )
      }
      ${ammo.length ? f('Munición', `<select id="at-ammo"><option value="">Ninguna</option>${ammo.map(e => `<option value="${e.id}" ${a.ammo === e.id ? 'selected' : ''}>${esc(e.name)}</option>`).join('')}</select>`, 'wide') : ''}
    </div>
    <div class="btns"><button class="b pri" data-act="atk-save" data-i="${i}">Guardar</button><button class="b" data-act="close-modal">Cancelar</button>${i >= 0 ? `<button class="b bad" data-act="atk-delask" data-i="${i}" style="margin-left:auto">Borrar</button>` : ''}</div>`);
  if (i < 0) $('#at-name').focus();
}
