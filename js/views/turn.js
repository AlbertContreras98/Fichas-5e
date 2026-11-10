/* Pestaña de combate: tu turno, economía de acciones y opciones derivadas de rasgos. */
'use strict';

// Cuándo se usa cada rasgo con usos (por nombre). 'none' = no aparece en el turno (fuera de combate o ligado a un conjuro).
const WHEN = {
  Furia: 'AA',
  'Tomar aliento': 'AA',
  'Pasos de las hadas': 'AA',
  'Oleada de acción': 'free',
  Indómito: 'free',
  'Inspiración bárdica': 'AA',
  'Canalizar divinidad': 'A',
  'Intervención divina': 'A',
  'Forma salvaje': 'AA',
  'Hechicería innata': 'AA',
  'Metabolismo asombroso': 'free',
  'Dados de superioridad': 'free',
  'Dados de energía psiónica': 'free',
  'Mareas del caos': 'free',
  Portento: 'free',
  'Luz sanadora (d6)': 'AA',
  'Suerte del oscuro': 'free',
  'Golpe de suerte': 'free',
  'Imposición de manos (PG)': 'AA',
  'Manos sanadoras': 'A',
  'Revelación celestial': 'AA',
  'Arma de aliento': 'atk',
  'Vuelo dracónico': 'AA',
  'Afinidad con la piedra': 'AA',
  'Subidón de adrenalina': 'AA',
  'Aguante incansable': 'free',
  'Forma grande': 'AA',
  'Salto de las nubes': 'AA',
  'Quemadura de fuego': 'free',
  'Frío de la escarcha': 'free',
  'Caída de la colina': 'free',
  'Aguante de piedra': 'R',
  'Trueno de la tormenta': 'R',
  'Puntos de suerte': 'free',
  'Incansable (PG temporales)': 'A',
  'Puntos de hechicería': 'free',
  'Puntos de concentración': 'none',
  'Astucia mágica': 'none',
  'Contactar con el patrón': 'none',
  'Arcano místico': 'none',
  'Recuperación arcana': 'none',
  'Restauración hechicera': 'none',
};
const whenOf = f => f.when || WHEN[f.name] || (/gratis/i.test(f.name) ? 'none' : 'free');
// Opciones derivadas de rasgos (gastan un recurso de otro rasgo o no gastan nada)
const DERIVED = [
  {
    need: 'Puntos de concentración',
    n: 'Ráfaga de golpes',
    t: 'AA',
    cost: 'Puntos de concentración',
    d: 'Dos golpes desarmados (1 punto).',
  },
  { need: 'Puntos de concentración', n: 'Defensa paciente', t: 'AA', d: 'Destrabarse (gratis).' },
  {
    need: 'Puntos de concentración',
    n: 'Defensa paciente (1 punto)',
    t: 'AA',
    cost: 'Puntos de concentración',
    d: 'Destrabarse y Esquivar.',
  },
  { need: 'Puntos de concentración', n: 'Paso del viento', t: 'AA', d: 'Correr (gratis).' },
  {
    need: 'Puntos de concentración',
    n: 'Paso del viento (1 punto)',
    t: 'AA',
    cost: 'Puntos de concentración',
    d: 'Destrabarse y Correr, salto doble.',
  },
  {
    need: 'Golpe aturdidor',
    n: 'Golpe aturdidor',
    t: 'free',
    cost: 'Puntos de concentración',
    d: c =>
      `Al impactar: salvación de CON CD ${8 + pb(c) + M(c, 'wis')} o queda aturdido hasta el principio de tu siguiente turno; si la supera, su velocidad baja a la mitad y el siguiente ataque contra él tiene ventaja (1 punto).`,
  },
  {
    need: 'Artes marciales',
    n: 'Golpe desarmado (Artes marciales)',
    t: 'AA',
    d: 'Un golpe desarmado extra.',
  },
  { need: 'Acción astuta', n: 'Correr, Destrabarse o Esconderse', t: 'AA', d: 'Acción astuta del pícaro.' },
  {
    need: ['Pacto del Filo', 'Pacto de la Espada'],
    n: 'Invocar arma de pacto',
    t: 'AA',
    d: 'Haces aparecer tu arma de pacto en la mano.',
  },
];
/* Pacto del Filo: elegir el arma de pacto (una de las tuyas o una invocada) y el tipo de daño */
function pactOpen(eco) {
  const c = C(),
    cur = c.attacks.find(a => a.pact),
    mine = c.attacks
      .map((a, i) => [a, i])
      .filter(([a]) => a.wpn && WEAPONS[a.wpn] && !WEAPONS[a.wpn].r && !a.pactNew && atkReady(c, a)),
    all = Object.entries(WEAPONS).filter(([, W]) => !W.r && W.d !== '1'),
    opt = (v, n, on) => `<option value="${v}" ${on ? 'selected' : ''}>${esc(n)}</option>`,
    W0 = cur && WEAPONS[cur.wpn];
  openModal(`<h2>Invocar arma de pacto</h2><p class="hint">Haces aparecer un arma cuerpo a cuerpo sencilla o marcial, o unes a tu pacto un arma que ya llevas. Con ella eres competente y puedes usar tu CAR para el ataque y el daño.</p>
    <label class="f"><span>Arma</span><select id="pact-w">${mine.length ? `<optgroup label="Tus armas">${mine.map(([a, i]) => opt('a:' + i, a.name, cur === a)).join('')}</optgroup>` : ''}<optgroup label="Invocar una nueva">${all.map(([k, W]) => opt('w:' + k, W.n, cur && cur.pactNew && cur.wpn === k)).join('')}</optgroup></select></label>
    <label class="f"><span>Tipo de daño</span><select id="pact-t">${[
      ['', 'El normal del arma'],
      ['necrótico', 'Necrótico'],
      ['psíquico', 'Psíquico'],
      ['radiante', 'Radiante'],
    ]
      .map(([v, n]) => opt(v, n, cur && (cur.pactT || '') === v && W0))
      .join('')}</select></label>
    <div class="btns"><button class="b pri" data-act="pact-ok" ${eco && c.combat ? 'data-eco="1"' : ''}>Invocar</button><button class="b" data-act="close-modal">Cancelar</button></div>`);
}
/* Desplegables «Magia» de cada columna que el jugador tiene abiertos (solo mientras la app está abierta) */
const TMAG = {};
const GENERIC = [
  ['a_dash', 'Correr'],
  ['a_disengage', 'Destrabarse'],
  ['a_dodge', 'Esquivar'],
  ['a_help', 'Ayudar'],
  ['a_hide', 'Esconderse'],
  ['a_influence', 'Influir'],
  ['a_study', 'Estudiar'],
  ['a_search', 'Buscar'],
  ['a_ready', 'Preparar'],
  ['a_utilize', 'Usar un objeto'],
];
function attacksPerAction(c) {
  const has = n => c.features.some(f => norm(f.name).includes(norm(n))),
    pactOn = c.attacks.some(a => a.pact);
  return has('Tres ataques adicionales')
    ? 4
    : has('Dos ataques adicionales')
      ? 3
      : has('Hoja devoradora') && pactOn
        ? 3
        : has('Ataque adicional') || (has('Hoja sedienta') && pactOn)
          ? 2
          : 1;
}
/* Empieza tu turno: si gastas la acción o la adicional tras «Terminar turno», recuperas la reacción */
function turnStart(c) {
  const T = c && c.turn;
  if (!T || !T.wait || !(T.a || T.aa)) return false;
  T.wait = false;
  T.r = false;
  /* Lo que dura «hasta el principio de tu siguiente turno» (Esquivar, Escudo) */
  const gone = endEffects(c, e => e.st && (e.stw || (+e.stk || 0) < (+T.k || 0)));
  if (gone.length)
    toast(
      `<div class="t-label">Empieza tu turno</div><div class="t-parts">${gone.map(esc).join(', ')} ${gone.length > 1 ? 'han' : 'ha'} terminado.</div>`
    );
  return true;
}
/* Movimiento del turno: pies gastados de los que tienes (Correr suma otra vez tu velocidad) */
function moveHTML(c, T) {
  const sp = speedCalc(c).ft,
    max = sp * (1 + (+T.dash || 0)),
    used = Math.min(+T.mv || 0, max),
    left = max - used,
    prone = c.conditions.includes('Derribado'),
    b = (d, l) =>
      `<button class="b sm" data-act="t-mv" data-d="${d}" ${d > 0 && left < d ? 'disabled' : ''}>${l}</button>`;
  return `<div class="movebar"><span>${term('Movimiento', 'speed')}: te quedan <b>${left}</b> de ${max} pies${T.dash ? ' (con Correr)' : ''}</span><span class="btns">${b(5, '−5')}${b(10, '−10')}${prone && sp ? `<button class="b sm" data-act="t-stand" ${left < Math.ceil(sp / 2) ? 'disabled' : ''}>Levantarse (−${Math.ceil(sp / 2)})</button>` : ''}${used ? b(-used, '↺') : ''}</span></div>`;
}
/* Marca un efecto que dura hasta el principio de tu siguiente turno */
function markSt(c, fx) {
  const T = c.turn || {};
  if (!fx) return;
  fx.st = true;
  fx.stk = +T.k || 0;
  fx.stw = !!(T.wait && !(T.a || T.aa));
}
function spendEco(c, k) {
  if (k === 'A') {
    c.turn.a = true;
    c.turn.atk = 0;
  } else if (k === 'AA') c.turn.aa = true;
  else if (k === 'R') c.turn.r = true;
}
const featLeft = f => f.uses.max - f.uses.used;
function viewTurn(c) {
  const incap = c.conditions.find(n => INCAP.includes(n));
  const T0 = c.turn,
    T = incap ? { a: true, aa: true, r: true, atk: 0 } : T0,
    aFree = !T.a,
    atkOn = aFree || T.atk > 0,
    dis = b => (b ? 'disabled' : '');
  const condNotes = [];
  if (incap)
    condNotes.push(
      `<b>${esc(incap)}:</b> no puedes hacer acciones, acciones adicionales ni reacciones${['Paralizado', 'Petrificado', 'Inconsciente'].includes(incap) ? ' y tu velocidad es 0' : ''}.`
    );
  if (c.conditions.includes('Derribado'))
    condNotes.push(
      '<b>Derribado:</b> levantarte cuesta la mitad de tu velocidad. Tus ataques tienen desventaja; los de enemigos a 5 pies, ventaja, y los de más lejos, desventaja.'
    );
  if (c.conditions.includes('Agarrado'))
    condNotes.push(
      `<b>Agarrado:</b> tu velocidad es 0 y tienes desventaja al atacar a cualquiera que no sea quien te agarra. Para soltarte, usa tu acción: Atletismo <b>1d20 ${sgn(skillB(c, SK.athletics) + d20Pen(c))}</b> o Acrobacias <b>1d20 ${sgn(skillB(c, SK.acrobatics) + d20Pen(c))}</b> contra la CD que te diga el máster.`
    );
  if (c.conditions.includes('Apresado'))
    condNotes.push(
      '<b>Apresado:</b> velocidad 0, desventaja en tus ataques y en salvaciones de DES; te atacan con ventaja. Cómo librarte lo dice lo que te apresa (una red, un conjuro…).'
    );
  if (c.conditions.includes('Envenenado'))
    condNotes.push('<b>Envenenado:</b> desventaja en tiradas de ataque y pruebas de característica.');
  if (c.conditions.includes('Asustado'))
    condNotes.push(
      '<b>Asustado:</b> desventaja en pruebas y ataques mientras veas la fuente; no puedes acercarte a ella.'
    );
  if (c.conditions.includes('Cegado'))
    condNotes.push('<b>Cegado:</b> tus ataques tienen desventaja; los ataques contra ti, ventaja.');
  if (c.conditions.includes('Invisible'))
    condNotes.push('<b>Invisible:</b> tus ataques tienen ventaja; los ataques contra ti, desventaja.');
  if (+c.exhaustion)
    condNotes.push(`<b>Agotamiento ${c.exhaustion}:</b> −${2 * c.exhaustion} a tus tiradas d20.`);
  const row = (name, meta, btn) =>
    `<div class="trow"><div class="tname">${name}${meta ? `<small>${meta}</small>` : ''}</div>${btn}</div>`;
  const cols = { A: [], AA: [], R: [], free: [] },
    mag = { A: [], AA: [], R: [] };
  // Atacar
  const nAtk = attacksPerAction(c),
    fm = formOf(c),
    ws = wsInfo(c),
    beast = fm && fm.via === 'wild' && c.classKey === 'druid' && c.level >= 18,
    noSpells = fm && !beast && !(fm.via === 'wild' && ws && ws.moon);
  if (fm) {
    cols.A.push(
      `<p class="hint">Transformado en <b>${esc(fm.name)}</b>: usas sus ataques.${noSpells ? ' No puedes lanzar conjuros.' : beast ? ' Conjuros bestiales: puedes lanzar conjuros, salvo los que gastan un material con precio.' : ' Solo puedes lanzar los conjuros de tu círculo.'}</p>`
    );
    (fm.attacks || []).forEach((a, i) =>
      cols.A.push(
        row(
          esc(a.n),
          `${esc(a.hit || '')} · ${esc(a.dmg || '')}`,
          `<button class="b sm pri" data-act="t-fatk" data-i="${i}" ${dis(!aFree)}>Atacar</button>`
        )
      )
    );
    if (fm.via === 'wild')
      cols.AA.push(
        row(
          'Volver a tu forma',
          'Termina la Forma salvaje',
          `<button class="b sm" data-act="crea-revert" ${dis(T.aa)}>Usar</button>`
        )
      );
  }
  c.companions.forEach(x => {
    if (x.kind !== 'primal' || x.hp.current <= 0) return;
    const st = creaStats(c, x);
    cols.AA.push(
      row(
        `Ordenar a ${esc(x.name)}`,
        `Golpe de bestia${st.n > 1 ? ' ×2' : ''}: ${esc(st.atks[0][1])} · ${esc(st.atks[0][2])}`,
        `<button class="b sm" data-act="t-pcmd" data-id="${x.id}" ${dis(T.aa)}>Usar</button>`
      )
    );
  });
  if (!fm)
    c.attacks.forEach((a, i) => {
      if (!atkReady(c, a)) return;
      const am = a.ammo && c.equipment.find(e => e.id === a.ammo);
      const noAmmo = am && am.qty <= 0;
      cols.A.push(
        row(
          `${esc(a.name)}`,
          `${sgn(+a.atk || 0)} · ${esc(a.dmg || '')}${am ? ` · quedan ${am.qty}` : ''}`,
          `<button class="b sm pri" data-act="t-atk" data-i="${i}" ${dis(!atkOn || noAmmo)}>Atacar</button>`
        )
      );
    });
  // Conjuros por tiempo de lanzamiento (van en el desplegable «Magia»)
  if (!noSpells)
    c.equipment.forEach((e, i) => {
      const d = e.scroll && SPBY[e.scroll];
      if (!d || e.qty <= 0) return;
      const t = d.t === 'BA' ? 'AA' : d.t;
      if (!['A', 'AA', 'R'].includes(t)) return;
      const busy = t === 'A' ? !aFree : t === 'AA' ? T.aa : T.r;
      mag[t].push(
        row(
          `${esc(d.n)} <span class="tag">pergamino</span>`,
          `${d.l ? 'Nivel ' + d.l : 'Truco'} · quedan ${e.qty}`,
          `<button class="b sm" data-act="t-scroll" data-i="${i}" data-eco="${t}" ${dis(busy)}>Lanzar</button>`
        )
      );
    });
  if (!noSpells)
    c.spells.forEach((sp, i) => {
      const t = sp.time === 'BA' ? 'AA' : sp.time;
      if (!['A', 'AA', 'R'].includes(t)) return;
      const busy = t === 'A' ? !aFree : t === 'AA' ? T.aa : T.r;
      const ok = canCast(c, sp);
      mag[t].push(
        row(
          `${esc(sp.name)}${sp.conc ? ' <span class="tag">C</span>' : ''}`,
          `${+sp.level ? 'Nivel ' + sp.level : 'Truco'}`,
          `<button class="b sm ${ok && !busy ? 'pri' : ''}" data-act="t-cast" data-i="${i}" data-eco="${t}" ${dis(busy || !ok)}>${ok ? (+sp.level ? 'Lanzar' : 'Usar') : 'Sin espacios'}</button>`
        )
      );
    });
  // Rasgos con usos
  c.features.forEach((f, i) => {
    if (!(f.uses.max > 0)) return;
    const w = whenOf(f);
    if (w === 'none') return;
    const left = featLeft(f);
    const k = w === 'atk' ? 'A' : w;
    const busy = w === 'atk' ? !atkOn : k === 'A' ? !aFree : k === 'AA' ? T.aa : k === 'R' ? T.r : false;
    cols[k].push(
      row(
        esc(f.name),
        `quedan ${left}/${f.uses.max}${w === 'atk' ? ' · sustituye un ataque' : ''}`,
        `<button class="b sm" data-act="t-feat" data-i="${i}" ${dis(busy || left <= 0)}>Usar</button>`
      )
    );
  });
  // Derivadas
  DERIVED.forEach((o, j) => {
    if (![].concat(o.need).some(n => c.features.some(f => norm(f.name).includes(norm(n))))) return;
    const src = o.cost && c.features.find(f => f.name === o.cost && f.uses.max > 0);
    if (o.cost && !src) return;
    const busy = o.t === 'A' ? !aFree : o.t === 'AA' ? T.aa : o.t === 'R' ? T.r : false;
    cols[o.t].push(
      row(
        esc(o.n),
        esc(typeof o.d === 'function' ? o.d(c) : o.d) + (src ? ` · quedan ${featLeft(src)}` : ''),
        `<button class="b sm" data-act="t-der" data-j="${j}" ${dis(busy || (src && featLeft(src) <= 0))}>Usar</button>`
      )
    );
  });
  // Segunda arma ligera
  const lights = c.attacks
    .map((a, i) => [a, i])
    .filter(([a]) => atkReady(c, a) && /ligera/i.test(a.notes || ''));
  if (lights.length >= 2)
    lights.forEach(([a, i]) =>
      cols.AA.push(
        row(
          `${esc(a.name)} (arma ligera)`,
          featHas(c, 'twf')
            ? 'Ataque extra: Combate con dos armas te deja sumar tu modificador al daño'
            : 'Ataque extra: sin tu modificador al daño',
          `<button class="b sm" data-act="t-light" data-i="${i}" ${dis(T.aa)}>Atacar</button>`
        )
      )
    );
  // Consumibles
  c.equipment.forEach((e, i) => {
    const G = e.gear && GEAR[e.gear];
    if (G) {
      if (!G.act || G.act === 'lit') return;
      const k = G.act === 'atk' ? 'A' : G.act,
        busy = G.act === 'atk' ? !atkOn : k === 'A' ? !aFree : T.aa;
      cols[k].push(
        row(
          esc(e.name),
          `${G.act === 'atk' ? 'sustituye un ataque · ' : ''}${G.keep ? '' : `quedan ${e.qty}`}`,
          `<button class="b sm" data-act="t-gear" data-i="${i}" ${dis(busy || (!G.keep && e.qty <= 0))}>Usar</button>`
        )
      );
      return;
    }
    if (e.cat !== 'pocion' && e.cat !== 'consumible') return;
    const k = e.cat === 'pocion' ? 'AA' : 'A';
    const busy = k === 'A' ? !aFree : T.aa;
    cols[k].push(
      row(
        esc(e.name),
        `quedan ${e.qty}`,
        `<button class="b sm" data-act="t-item" data-i="${i}" data-eco="${k}" ${dis(busy || e.qty <= 0)}>${e.cat === 'pocion' ? 'Beber' : 'Usar'}</button>`
      )
    );
  });
  c.equipment.forEach((e, i) => {
    if (!e.mi || !+e.mi.ch || !miOn(e)) return;
    const left = e.mi.ch - (+e.mi.used || 0);
    cols.A.push(
      row(
        `${esc(e.name)} <span class="tag">mágico</span>`,
        `quedan ${left}/${e.mi.ch} cargas`,
        `<button class="b sm" data-act="t-mi" data-i="${i}" ${dis(!aFree || left <= 0)}>Usar</button>`
      )
    );
  });
  // Acciones de cualquiera
  // Agarrar y Empujar sustituyen un ataque de la acción de Atacar (no gastan la acción entera): van antes de «Usar un objeto»
  const chip = ([k, n]) =>
    k === 'grapple' || k === 'shove' || k === 'unarmed'
      ? fm
        ? ''
        : `<button class="chip" data-act="${k === 'unarmed' ? 't-unarmed' : 't-shove'}" data-k="${k}" ${dis(!atkOn)} title="${k === 'unarmed' ? 'Uno de los ataques de la acción de Atacar' : 'Sustituye uno de tus ataques'}">${n}</button>`
      : `<button class="chip" data-act="t-gen" data-k="${k}" ${dis(!aFree)}>${n}</button>`;
  const generic = `<div class="chips">${GENERIC.flatMap(g =>
    g[0] === 'a_utilize'
      ? [['unarmed', 'Golpe desarmado'], ['grapple', 'Agarrar'], ['shove', 'Empujar'], g]
      : [g]
  )
    .map(chip)
    .join('')}</div>`;
  cols.R.push(
    row(
      term('Ataque de oportunidad', 'a_opp'),
      '',
      `<button class="b sm" data-act="t-opp" ${dis(T.r)}>Usar</button>`
    )
  );
  // Desplegable «Magia» al final de cada columna
  for (const k of ['A', 'AA', 'R'])
    if (mag[k].length)
      cols[k].push(
        `<details class="tmag" ${TMAG[k] ? 'open' : ''}><summary data-act="t-mag" data-k="${k}">Magia <small>${mag[k].length} ${mag[k].length === 1 ? 'conjuro' : 'conjuros'}</small></summary>${mag[k].join('')}</details>`
      );
  /* Si está gastada, la etiqueta es un botón para volver a tenerla disponible (si el máster lo permite) */
  const pill = (lbl, k, used, extra, slot) =>
    `<span class="pill ${used ? 'used' : ''}">${term(lbl, k)}${
      used && !incap
        ? `<button class="pill-b" data-act="t-reset" data-k="${slot}" title="Pulsa para volver a tenerla disponible" aria-label="${esc(lbl)} gastada: pulsa para volver a tenerla disponible">${extra || 'Gastada'} ↺</button>`
        : `<b>${extra || (used ? 'Gastada' : 'Disponible')}</b>`
    }</span>`;
  const aState = T.a ? (T.atk > 0 ? `Atacando · ${T.atk} más` : 'Gastada') : '';
  const col = (k, title, gk, body) =>
    `<div class="tcol ${k === 'A' ? (aFree || T.atk > 0 ? '' : 'off') : k === 'AA' ? (T.aa ? 'off' : '') : k === 'R' ? (T.r ? 'off' : '') : ''}"><h3>${term(title, gk)}</h3>${body || '<p class="empty">Nada por ahora.</p>'}</div>`;
  return `<section class="card turn"><div class="card-head"><h2>Tu turno${c.combat ? ` <span class="round">Ronda ${c.combat.round}</span>` : ''}</h2><div class="btns"><button class="b" data-act="t-end">Terminar turno</button>${c.combat ? '<button class="b bad" data-act="cb-end">Terminar combate</button>' : ''}</div></div>
    <div class="pills">${pill('Acción', 'action', T.a, incap ? 'Bloqueada' : aState, 'a')}${pill('Acción adicional', 'bonus', T.aa, incap ? 'Bloqueada' : '', 'aa')}${pill('Reacción', 'reaction', T.r, incap ? 'Bloqueada' : T.r && T.wait ? 'Vuelve en tu turno' : '', 'r')}</div>
    ${moveHTML(c, T0)}
    ${T.wait && T.r && !incap ? '<p class="hint">Tu reacción vuelve al empezar tu próximo turno: en cuanto uses tu acción o tu acción adicional (o pulsa ↺).</p>' : ''}
    ${condNotes.length ? `<div class="condnotes">${condNotes.map(n => `<p>${n}</p>`).join('')}</div>` : ''}
    <div class="tgrid">
      ${col('A', 'Acción', 'action', `${nAtk > 1 ? `<p class="hint">Con la acción de Atacar haces ${nAtk} ataques.</p>` : ''}${cols.A.join('')}<h3 class="sub3">Otras acciones</h3>${generic}`)}
      ${col('AA', 'Acción adicional', 'bonus', cols.AA.join(''))}
      ${col('R', 'Reacción', 'reaction', cols.R.join(''))}
      ${col('free', 'Sin gastar acción', 'free', cols.free.join(''))}
    </div></section>`;
}
