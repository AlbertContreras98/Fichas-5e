/* Criaturas: familiares, invocaciones, compañeros y formas (Forma salvaje, transformaciones). */
'use strict';

const druidLv = c => (c.classKey === 'druid' ? c.level : 0);
function wsInfo(c) {
  const L = druidLv(c);
  if (L < 2) return null;
  const moon = c.subclassKey === 'moon' && L >= 3;
  return {
    L,
    moon,
    known: L >= 8 ? 8 : L >= 4 ? 6 : 4,
    cr: moon
      ? String(L >= 18 ? 6 : L >= 15 ? 5 : L >= 12 ? 4 : L >= 9 ? 3 : L >= 6 ? 2 : 1)
      : L >= 8
        ? '1'
        : L >= 4
          ? '1/2'
          : '1/4',
    fly: L >= 8,
    temp: moon ? 3 * L : L,
    hours: Math.floor(L / 2),
  };
}
const wsFeat = c => c.features.find(f => f.name === 'Forma salvaje' && f.uses.max > 0);
const hitStr = c => (spMod(c) !== null ? sgn(spAtk(c)) : 'tu ataque de conjuro');
const TRACKED = k => k !== 'form';
function creaStats(c, x) {
  const st = {
    ac: x.ac,
    hpMax: x.hp ? +x.hp.max || 0 : 0,
    speed: x.speed || '',
    atks: (x.attacks || []).map(a => [a.n, a.hit, a.dmg]),
    traits: x.notes || '',
    sub: '',
    rules: CREA_RULES[x.kind] || '',
    n: 1,
  };
  if (x.kind === 'primal') {
    const P = PRIMAL[x.v] || PRIMAL.land,
      R = c.level,
      w = M(c, 'wis'),
      [die, b] = P.dmg.split(' + ');
    Object.assign(st, {
      ac: 13 + w,
      hpMax: P.hp[0] + P.hp[1] * R,
      speed: P.speed,
      sub: P.n,
      n: R >= 11 && c.classKey === 'ranger' ? 2 : 1,
      atks: [['Golpe de bestia', hitStr(c), `${die} + ${+b + w} ${x.dtype || P.types[0]}`]],
      traits: `${P.trait}\nVínculo primigenio: suma tu bonificador de competencia (${sgn(pb(c))}) a sus pruebas y salvaciones.${R >= 7 ? '\nEntrenamiento excepcional: al ordenarle una acción, también puede Correr, Destrabarse, Esquivar o Ayudar como acción adicional; su daño puede ser de fuerza.' : ''}${R >= 15 ? '\nCompartir conjuros: los conjuros que te lances a ti también le afectan si está a 30 pies.' : ''}`,
    });
  } else if (x.kind === 'steed') {
    const T = STEED_TYPES[x.v] || STEED_TYPES.celestial,
      L = +x.L || 2;
    Object.assign(st, {
      ac: 10 + L,
      hpMax: 5 + 10 * L,
      speed: L >= 4 ? '60 pies, volar 60' : '60 pies',
      sub: `${T[0]} · conjuro de nivel ${L}`,
      atks: [['Golpe de otro mundo', hitStr(c), `1d8 + ${L} ${T[1]}`]],
      traits: T[2],
    });
  } else if (x.kind === 'summon') {
    const S = SUMMONS[x.s] || SUMMONS.beast,
      L = +x.L || S.L,
      v = S.vars[x.v] ? x.v : Object.keys(S.vars)[0];
    let hp = S.hp(L, v);
    if (x.illus) hp = Math.floor(hp / 2);
    Object.assign(st, {
      ac: S.ac(L, v),
      hpMax: hp,
      speed: typeof S.speed === 'function' ? S.speed() : S.speed[v],
      n: Math.max(1, Math.floor(L / 2)),
      sub: `${S.n}${Object.keys(S.vars).length > 1 ? ` (${S.vars[v]})` : ''} · nivel ${L}${x.illus ? ' · ilusoria' : ''}`,
      atks: S.atk(v).map(([n, f]) => [n, hitStr(c), f(L)]),
      traits:
        (S.traits[v] || '') + (x.illus ? '\nIlusoria (Ilusionista): tiene la mitad de los PG normales.' : ''),
    });
  }
  st.track = TRACKED(x.kind);
  return st;
}
function creaCard(c, x) {
  const st = creaStats(c, x),
    isForm = x.kind === 'form',
    active = c.form === x.id;
  if (st.track) {
    x.hp.max = st.hpMax;
    x.hp.current = clamp(x.hp.current, 0, st.hpMax);
  }
  const pct = st.track && st.hpMax ? clamp((x.hp.current / st.hpMax) * 100, 0, 100) : 0;
  const kindLbl = isForm
    ? { wild: 'Forma salvaje', poly: 'Polimorfar', other: 'Transformación' }[x.via || 'other']
    : x.label || CREA_KINDS[x.kind].n;
  let formBtn = '';
  if (isForm) {
    const ws = wsInfo(c),
      f = wsFeat(c);
    if (active) formBtn = `<button class="b pri" data-act="crea-revert">Volver a tu forma</button>`;
    else if (x.via === 'wild')
      formBtn =
        ws && f
          ? `<button class="b pri" data-act="crea-transform" data-id="${x.id}" ${featLeft(f) > 0 ? '' : 'disabled'}>${featLeft(f) > 0 ? `Transformarte (quedan ${featLeft(f)})` : 'Sin usos de Forma salvaje'}</button>`
          : '<p class="hint">La Forma salvaje es del druida a partir de nivel 2.</p>';
    else formBtn = `<button class="b pri" data-act="crea-transform" data-id="${x.id}">Transformarte</button>`;
  }
  return `<div class="compc ${active ? 'active' : ''}">
    <div class="comp-top"><span><b>${esc(x.name || 'Sin nombre')}</b> <small>${esc(st.sub || kindLbl)}${isForm && x.cr ? ` · VD ${esc(x.cr)}` : ''}</small></span><button class="b sm" data-act="crea-edit" data-id="${x.id}">Editar</button></div>
    <div class="comp-stats"><span>CA <b>${esc(st.ac === '' || st.ac == null ? '—' : st.ac)}</b></span>${st.speed ? `<span>${esc(st.speed)}</span>` : ''}${isForm && st.hpMax ? `<span>PG de la bestia <b>${st.hpMax}</b></span>` : ''}${x.conc ? `<span>ligada a tu concentración</span>` : ''}</div>
    ${
      st.track
        ? `<div class="comp-hp"><span><b>${x.hp.current}</b> / ${st.hpMax} PG</span><div class="bar"><i class="${pct <= 25 ? 'low' : ''}" style="width:${pct}%"></i></div></div>
    <div class="hpctl"><input id="cp-${x.id}" type="number" inputmode="numeric" min="0" placeholder="PG" aria-label="PG de ${esc(x.name)}"><button class="b bad" data-act="crea-hp" data-m="dmg" data-id="${x.id}">Daño</button><button class="b good" data-act="crea-hp" data-m="heal" data-id="${x.id}">Curar</button></div>
    ${x.hp.current <= 0 ? `<p class="hint warn">${x.kind === 'other' ? 'A 0 PG: cae (pregunta al máster qué le pasa).' : x.kind === 'primal' ? 'A 0 PG muere. Puedes revivirlo durante la hora siguiente con una acción mágica gastando un espacio de conjuro.' : 'A 0 PG desaparece.'}</p>` : ''}`
        : ''
    }
    ${st.atks.length ? `<ul class="catk">${st.atks.map(a => `<li><b>${esc(a[0])}</b>${a[1] !== '' && a[1] != null ? ` <span>${esc(a[1])}</span>` : ''}${a[2] ? ` · ${esc(a[2])}` : ''}</li>`).join('')}</ul>${st.n > 1 ? `<p class="hint">Hace ${st.n} ataques por turno.</p>` : ''}` : ''}
    ${st.traits || st.rules ? `<details><summary>Rasgos y reglas</summary>${st.traits ? `<p class="comp-notes">${esc(st.traits).replace(/\n/g, '<br>')}</p>` : ''}${st.rules ? `<p class="comp-notes hint">${esc(st.rules)}</p>` : ''}</details>` : ''}
    ${formBtn ? `<div class="btns">${formBtn}</div>` : ''}</div>`;
}
function viewCrea(c) {
  const forms = c.companions.filter(x => x.kind === 'form'),
    others = c.companions.filter(x => x.kind !== 'form'),
    ws = wsInfo(c),
    f = wsFeat(c);
  const wsBox = ws
    ? `<section class="card"><h2>${term('Forma salvaje', 'wildshape')}</h2>
    <div class="kv"><span>Usos</span><b>${f ? `${featLeft(f)} / ${f.uses.max}` : '—'}</b></div>
    <div class="kv"><span>Formas que puedes conocer</span><b>${ws.known}</b></div>
    <div class="kv"><span>VD máximo</span><b>${ws.cr}${ws.fly ? '' : ' · sin velocidad de vuelo'}</b></div>
    <div class="kv"><span>Duración</span><b>${ws.hours} h</b></div>
    <div class="kv"><span>PG temporales al transformarte</span><b>${ws.temp}</b></div>
    ${ws.moon ? `<div class="kv"><span>CA mínima (Círculo de la Luna)</span><b>${13 + M(c, 'wis')}</b></div>` : ''}
    <p class="hint">Te transformas con una acción adicional y puedes volver igual. Mantienes tus PG, tus dados de golpe, INT, SAB y CAR, tus competencias y tus rasgos de clase; usas la CA, la velocidad, FUE, DES, CON y los ataques de la bestia. ${ws.moon ? 'Puedes lanzar los conjuros de tu círculo.' : 'No puedes lanzar conjuros, pero no pierdes la concentración.'} Termina al acabar la duración, si quedas incapacitado o si mueres.</p></section>`
    : '';
  return `<div class="ed"><div class="ed-head"><h2>Criaturas y formas</h2><button class="b pri" data-act="crea-new">+ Añadir</button></div>
    ${
      !c.companions.length
        ? `<section class="card"><p>Aquí guardas las fichas extra que usa tu personaje:</p><ul class="kinds">${Object.values(
            CREA_KINDS
          )
            .map(k => `<li><b>${k.n}:</b> ${k.d}</li>`)
            .join('')}</ul></section>`
        : ''
    }
    <div class="cols crea">${wsBox || forms.length ? `<div class="col">${wsBox}${forms.length ? `<section class="card"><h2>Formas</h2>${forms.map(x => creaCard(c, x)).join('')}</section>` : ''}</div>` : ''}
    ${others.length ? `<div class="col"><section class="card"><h2>Compañeros e invocaciones</h2>${others.map(x => creaCard(c, x)).join('')}</section></div>` : ''}</div></div>`;
}
function creaPick() {
  openModal(
    `<h2>¿Qué quieres añadir?</h2><div class="charlist">${Object.entries(CREA_KINDS)
      .map(
        ([k, v]) =>
          `<button class="b opt" data-act="crea-kind" data-k="${k}"><span><b>${v.n}</b><br><small>${v.d}</small></span></button>`
      )
      .join('')}</div><div class="btns"><button class="b" data-act="close-modal">Cancelar</button></div>`
  );
}
function creaBlank(c, k, o) {
  o = o || {};
  const x = { kind: k, name: '', attacks: [], notes: '', hp: { max: '', current: 0 } };
  if (k === 'form') {
    x.via = wsInfo(c) ? 'wild' : 'poly';
  }
  if (k === 'primal') {
    x.v = 'land';
    x.dtype = 'perforante';
    x.name = 'Compañero primigenio';
  }
  if (k === 'steed') {
    x.v = 'celestial';
    x.L = o.L || 2;
    x.name = 'Montura';
    x.spend = !o.cast;
  }
  if (k === 'summon') {
    x.s = o.s || 'beast';
    x.L = o.L || SUMMONS[x.s].L;
    x.v = Object.keys(SUMMONS[x.s].vars)[0];
    x.name = SUMMONS[x.s].n.replace(/^Invocar /, '').replace(/^./, m => m.toUpperCase());
    x.concNew = !o.cast;
    x.spend = !o.cast;
    x.fromCast = o.cast || '';
  }
  if (k === 'familiar') {
    x.name = '';
  }
  return x;
}
function creaCollect() {
  if (!CX) return;
  const g = id => {
    const e = $('#' + id);
    return e ? (e.type === 'checkbox' ? e.checked : e.value) : undefined;
  };
  const set = (k, id, num) => {
    const v = g(id);
    if (v !== undefined) CX[k] = num ? (v === '' ? '' : +v) : v;
  };
  set('name', 'cx-name');
  set('v', 'cx-v');
  set('s', 'cx-s');
  set('L', 'cx-L', 1);
  set('via', 'cx-via');
  set('cr', 'cx-cr');
  set('dtype', 'cx-dtype');
  set('ac', 'cx-ac', 1);
  set('speed', 'cx-speed');
  set('notes', 'cx-notes');
  set('label', 'cx-label');
  set('cat', 'cx-cat');
  ['illus', 'spend', 'concNew'].forEach(k => {
    const v = g('cx-' + k);
    if (v !== undefined) CX[k] = v;
  });
  const mx = g('cx-max');
  if (mx !== undefined) CX.hp.max = mx === '' ? '' : +mx;
  const cu = g('cx-cur');
  if (cu !== undefined && cu !== '') CX.hp.current = +cu;
  if (CX.attacks)
    CX.attacks = CX.attacks.map((a, i) => ({
      n: g('cx-an' + i) ?? a.n,
      hit: g('cx-ah' + i) ?? a.hit,
      dmg: g('cx-ad' + i) ?? a.dmg,
    }));
}
const crNum = v => {
  v = String(v);
  return v.includes('/') ? +v.split('/')[0] / +v.split('/')[1] : +v;
};
function catOptions(c, x) {
  const ws = wsInfo(c),
    beasts = BEASTS.filter(b => b.t === 'Bestia');
  let groups = [];
  if (x.kind === 'form') {
    if (x.via === 'wild' && ws) {
      const mx = crNum(ws.cr);
      groups = [
        [
          `Bestias que puedes usar (VD ${ws.cr} o menos${ws.fly ? '' : ', sin vuelo'})`,
          beasts.filter(b => b.cr <= mx && (ws.fly || !b.fly)),
        ],
      ];
    } else groups = [['Bestias', beasts]];
  } else if (x.kind === 'familiar')
    groups = [
      ['Familiares (bestias de VD 0)', beasts.filter(b => b.cr === 0)],
      ['Formas especiales del Pacto de la cadena', BEASTS.filter(b => b.chain)],
    ];
  else
    groups = [
      ['No muertos (Animar a los muertos)', BEASTS.filter(b => b.undead)],
      ['Bestias y monturas', beasts],
      ['Otras criaturas', BEASTS.filter(b => b.t !== 'Bestia' && !b.undead)],
    ];
  return groups.filter(g => g[1].length);
}
function catSelect(c, x) {
  const g = catOptions(c, x);
  return `<label class="f"><span>Elegir del catálogo</span><select id="cx-cat" data-rr="1"><option value="">— Rellenar a mano —</option>${g.map(([lbl, list]) => `<optgroup label="${esc(lbl)}">${list.map(b => `<option value="${b.id}" ${x.cat === b.id ? 'selected' : ''}>${esc(b.n)} (VD ${b.crs})</option>`).join('')}</optgroup>`).join('')}</select></label>`;
}
function beastNotes(b) {
  const AB6 = ['FUE', 'DES', 'CON', 'INT', 'SAB', 'CAR'];
  return [
    `${b.t} ${b.sz.toLowerCase()} · VD ${b.crs}`,
    b.ab.map((v, i) => `${AB6[i]} ${v} (${sgn(Math.floor((v - 10) / 2))})`).join(' · '),
    b.sen,
    b.res,
    b.lang ? 'Idiomas: ' + b.lang : '',
    ...b.tr.map(t => `${t[0]}: ${t[1]}`),
    ...b.ex.map(t => `${t[0]}: ${t[1]}`),
  ]
    .filter(Boolean)
    .join('\n');
}
function applyBeast(x, b) {
  const auto = !x.name || x.name === x._autoName;
  if (auto) {
    x.name = b.n;
    x._autoName = b.n;
  }
  Object.assign(x, {
    cat: b.id,
    ac: b.ac,
    speed: b.sp,
    cr: b.crs,
    notes: beastNotes(b),
    attacks: b.at.map(a => ({ n: a[0], hit: a[1], dmg: a[2] })),
  });
  x.hp = Object.assign({}, x.hp, { max: b.hp, current: b.hp });
}
function creaModal() {
  const c = C(),
    x = CX,
    isNew = !x.id,
    k = x.kind,
    ws = wsInfo(c);
  const f = (lbl, inner) => `<label class="f"><span>${lbl}</span>${inner}</label>`;
  const inp = (id, val, extra) =>
    `<input id="${id}" value="${esc(val ?? '')}" autocomplete="off" ${extra || ''}>`;
  const sel = (id, opts, val, rr) =>
    `<select id="${id}" ${rr ? 'data-rr="1"' : ''}>${opts.map(([v, t]) => `<option value="${v}" ${String(val) === String(v) ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>`;
  const lv = from => Array.from({ length: 10 - from }, (_, i) => [from + i, `Nivel ${from + i}`]);
  const atkRows = () =>
    `<h3>Ataques</h3>${x.attacks.map((a, i) => `<div class="atkrow">${inp('cx-an' + i, a.n, 'placeholder="Mordisco"')}${inp('cx-ah' + i, a.hit, 'placeholder="+4" inputmode="text"')}${inp('cx-ad' + i, a.dmg, 'placeholder="2d4 + 2 perforante"')}<button class="b sm sq" data-act="cx-atk-del" data-i="${i}" aria-label="Quitar ataque">✕</button></div>`).join('')}<button class="b sm" data-act="cx-atk-add">+ Ataque</button>`;
  let body = '';
  if (k === 'form') {
    const vias = [
      ...(ws ? [['wild', 'Forma salvaje (druida)']] : []),
      ['poly', 'Polimorfar o Polimorfar verdadero'],
      ['other', 'Otra (Cambiar de forma, Formas animales…)'],
    ];
    body = `${f('Cómo te transformas', sel('cx-via', vias, x.via, 1))}${catSelect(c, x)}${f('Bestia o forma', inp('cx-name', x.name, 'placeholder="Lobo"'))}
      ${x.via === 'wild' && ws ? `<p class="hint">Puedes conocer ${ws.known} formas de VD ${ws.cr} como máximo${ws.fly ? '' : ', sin velocidad de vuelo'}. Al transformarte ganas ${ws.temp} PG temporales.</p>` : x.via === 'poly' ? '<p class="hint">Polimorfar: ganas tantos PG temporales como los PG de la bestia, y la transformación termina cuando se te acaban.</p>' : ''}
      <div class="effdur3">${f('VD', inp('cx-cr', x.cr, 'placeholder="1/4"'))}${f('CA', inp('cx-ac', x.ac, 'type="number" inputmode="numeric"'))}${f('PG de la bestia', inp('cx-max', x.hp.max, 'type="number" inputmode="numeric"'))}</div>
      ${f('Velocidad', inp('cx-speed', x.speed, 'placeholder="40 pies"'))}${atkRows()}${f('Rasgos y sentidos', `<textarea id="cx-notes" rows="3" placeholder="Olfato agudo, Tácticas de manada…">${esc(x.notes)}</textarea>`)}`;
  } else if (k === 'primal') {
    const P = PRIMAL[x.v] || PRIMAL.land;
    if (!P.types.includes(x.dtype)) x.dtype = P.types[0];
    body = `${f('Nombre', inp('cx-name', x.name))}${f(
      'Tipo de bestia',
      sel(
        'cx-v',
        Object.entries(PRIMAL).map(([v, o]) => [v, o.n]),
        x.v,
        1
      )
    )}${
      P.types.length > 1
        ? f(
            'Tipo de daño',
            sel(
              'cx-dtype',
              P.types.map(t => [t, t]),
              x.dtype
            )
          )
        : ''
    }${c.classKey !== 'ranger' ? '<p class="hint warn">Este compañero es del explorador Señor de las Bestias; se calcula con tu nivel y tu SAB.</p>' : ''}`;
  } else if (k === 'steed') {
    body = `${f('Nombre', inp('cx-name', x.name))}${f(
      'Tipo',
      sel(
        'cx-v',
        Object.entries(STEED_TYPES).map(([v, o]) => [v, o[0]]),
        x.v,
        1
      )
    )}${f('Nivel del conjuro', sel('cx-L', lv(2), x.L, 1))}
      ${isNew && !x.fromCast ? `<label class="chk"><input type="checkbox" id="cx-spend" ${x.spend ? 'checked' : ''}> Gastar un espacio de nivel ${x.L} (desmárcalo si es gratis, como el Corcel fiel del paladín)</label>` : ''}`;
  } else if (k === 'summon') {
    const S = SUMMONS[x.s] || SUMMONS.beast;
    if (+x.L < S.L) x.L = S.L;
    if (!S.vars[x.v]) x.v = Object.keys(S.vars)[0];
    body = `${f(
      'Conjuro',
      sel(
        'cx-s',
        Object.entries(SUMMONS).map(([v, o]) => [v, `${o.n} (nivel ${o.L})`]),
        x.s,
        1
      )
    )}<p class="hint">${esc(S.who)}.</p>
      ${Object.keys(S.vars).length > 1 ? f('Variante', sel('cx-v', Object.entries(S.vars), x.v, 1)) : ''}${f('Nivel al que lo lanzas', sel('cx-L', lv(S.L), x.L, 1))}${f('Nombre', inp('cx-name', x.name))}
      ${c.subclassKey === 'illusionist' && ['beast', 'fey'].includes(x.s) ? `<label class="chk"><input type="checkbox" id="cx-illus" ${x.illus ? 'checked' : ''}> Ilusoria (Criaturas fantasmales del Ilusionista: mitad de PG)</label>` : ''}
      ${isNew && !x.fromCast ? `<label class="chk"><input type="checkbox" id="cx-concNew" ${x.concNew ? 'checked' : ''}> La acabo de invocar: empiezo a concentrarme en ${esc(S.n)}</label><label class="chk"><input type="checkbox" id="cx-spend" ${x.spend ? 'checked' : ''}> Gastar un espacio de nivel ${x.L}</label>` : ''}`;
  } else {
    body = `${catSelect(c, x)}${f(k === 'familiar' ? 'Nombre y forma' : 'Nombre', inp('cx-name', x.name, k === 'familiar' ? 'placeholder="Ceniza (búho)"' : ''))}${k === 'other' ? f('Tipo (opcional)', inp('cx-label', x.label, 'placeholder="Montura, esqueleto, aliado…"')) : ''}
      <div class="effdur3">${f('CA', inp('cx-ac', x.ac, 'type="number" inputmode="numeric"'))}${f('PG máx.', inp('cx-max', x.hp.max, 'type="number" inputmode="numeric" min="1"'))}${isNew ? '' : f('PG actuales', inp('cx-cur', x.hp.current, 'type="number" inputmode="numeric" min="0"'))}</div>
      ${f('Velocidad', inp('cx-speed', x.speed, 'placeholder="10 pies, volar 60 pies"'))}${atkRows()}
      ${f(k === 'familiar' ? 'Rasgos y sentidos' : 'Rasgos y notas', `<textarea id="cx-notes" rows="3">${esc(x.notes)}</textarea>`)}
      ${k === 'familiar' ? '<p class="hint">Un familiar no puede atacar, salvo con el Pacto de la cadena (renuncias a uno de tus ataques y él ataca con su reacción).</p>' : ''}`;
  }
  if (!isNew && TRACKED(k) && k !== 'other' && k !== 'familiar')
    body += `<div class="effdur3">${f('PG actuales', inp('cx-cur', x.hp.current, 'type="number" inputmode="numeric" min="0"'))}</div>`;
  if (['primal', 'steed', 'summon'].includes(k)) {
    const st = creaStats(c, x);
    body += `<div class="preview"><b>Vista previa:</b> CA ${st.ac} · ${st.hpMax} PG · ${esc(st.speed)}<br>${st.atks.map(a => `${esc(a[0])} ${esc(a[1])} · ${esc(a[2])}`).join('<br>')}${st.n > 1 ? `<br>${st.n} ataques por turno` : ''}</div>`;
  }
  openModal(`<h2>${isNew ? 'Añadir' : 'Editar'}: ${esc(CREA_KINDS[k].n.toLowerCase())}</h2>${body}<p class="hint" id="cx-msg" role="status"></p>
    <div class="btns"><button class="b pri" data-act="crea-save">Guardar</button>
      ${isNew ? '' : x.confirm ? `<button class="b bad" data-act="crea-del-ok">Sí, borrar</button>` : `<button class="b bad" data-act="crea-del">Borrar</button>${['other', 'summon', 'familiar'].includes(k) ? '<button class="b" data-act="crea-dup">Duplicar</button>' : ''}`}
      <button class="b" data-act="crea-cancel">Cancelar</button></div>`);
}
function transformInto(c, x, opt) {
  opt = opt || {};
  const ws = wsInfo(c);
  endEffects(c, e => e.form);
  c.form = x.id;
  let msg = '';
  if (x.via === 'wild' && ws) {
    const t = ws.temp;
    c.hp.temp = Math.max(c.hp.temp, t);
    c.effects.push({
      id: uid(),
      name: `Forma salvaje: ${x.name}`,
      m: 60 * ws.hours,
      form: true,
      conc: false,
    });
    msg = `Ganas ${t} PG temporales. Dura ${ws.hours} h.`;
  } else if (x.via === 'poly') {
    const t = +x.hp.max || 0;
    c.hp.temp = Math.max(c.hp.temp, t);
    if (opt.conc) c.effects.push({ id: uid(), name: opt.conc, m: 60, form: true, conc: true });
    else c.effects.push({ id: uid(), name: `Polimorfado: ${x.name}`, m: 60, form: true, conc: false });
    msg = `Ganas ${t} PG temporales; la transformación termina cuando se te acaben.`;
  } else {
    c.effects.push(
      Object.assign(
        { id: uid(), name: opt.conc || `Transformado: ${x.name}`, form: true, conc: !!opt.conc },
        opt.conc ? { m: 60 } : { inf: true }
      )
    );
  }
  return msg;
}
const formOf = c => (c.form ? c.companions.find(x => x.id === c.form && x.kind === 'form') : null);
function formAC(c, x) {
  const ws = wsInfo(c),
    b = +x.ac || 0;
  return x.via === 'wild' && ws && ws.moon ? Math.max(b, 13 + M(c, 'wis')) : b;
}
function formPicker(via, conc) {
  const c = C(),
    forms = c.companions.filter(
      x => x.kind === 'form' && (via === 'wild' ? x.via === 'wild' : x.via !== 'wild')
    );
  openModal(`<h2>${via === 'wild' ? 'Forma salvaje' : '¿En qué te transformas?'}</h2>
    ${forms.length ? `<div class="charlist">${forms.map(x => `<button class="b opt" data-act="form-go" data-id="${x.id}" data-via="${via}" data-conc="${esc(conc || '')}"><span><b>${esc(x.name)}</b> <small>CA ${formAC(c, x)}${x.hp.max ? ` · ${x.hp.max} PG` : ''}${x.cr ? ` · VD ${esc(x.cr)}` : ''}</small></span></button>`).join('')}</div>` : '<p>Aún no tienes formas guardadas. Créalas en la pestaña Criaturas (+ Añadir → Forma o transformación).</p>'}
    ${via === 'wild' ? `<div class="charlist"><button class="b opt" data-act="form-go" data-id="" data-via="wild"><span>Gastar el uso sin elegir forma</span></button>${c.companions.some(x => x.kind === 'familiar') || druidLv(c) >= 2 ? `<button class="b opt" data-act="form-familiar"><span><b>Compañero salvaje</b><br><small>Gasta un uso para lanzar Encontrar familiar sin componentes</small></span></button>` : ''}</div>` : ''}
    <div class="btns"><button class="b" data-act="close-modal">Cancelar</button></div>`);
}
const SUMMON_REF = {};
Object.entries(SUMMONS).forEach(([k, v]) => (SUMMON_REF[v.ref] = k));
