/* Modo máster: jugadores recibidos por QR o código, sus características y el seguimiento de turnos. También la ventana del jugador para compartir con el máster. */
'use strict';

const MKEY = 'fichas-master';
/* Estado del modo máster (por dispositivo). players, shops, fight y tab son los de la campaña activa (MST.cur);
   cada campaña de MST.camps guarda los suyos, y masterSave() los vuelca en ella */
let MST = {
  on: false,
  tab: 'combat',
  players: [],
  shops: [],
  fight: { round: 1, cur: '', list: [] },
  cur: '',
  camps: [],
};
const CAMP_KEYS = ['players', 'shops', 'fight', 'tab'];
const campNew = n => ({
  id: uid(),
  n,
  players: [],
  shops: [],
  fight: { round: 1, cur: '', list: [] },
  tab: 'combat',
});
const campOf = id => MST.camps.find(x => x.id === id) || null;
/* Copia los datos de la campaña activa en su sitio de MST.camps */
function campSync() {
  const k = campOf(MST.cur);
  if (k) CAMP_KEYS.forEach(f => (k[f] = MST[f]));
}
/* Pone como activa otra campaña */
function campUse(id) {
  const k = campOf(id) || MST.camps[0];
  MST.cur = k.id;
  MST.players = Array.isArray(k.players) ? k.players : (k.players = []);
  MST.shops = Array.isArray(k.shops) ? k.shops : (k.shops = []);
  MST.fight = k.fight = Object.assign({ round: 1, cur: '', list: [] }, k.fight || {});
  MST.tab = k.tab || 'combat';
}
let SCAN = null; // cámara abierta para leer un QR
let MHASH = null; // ficha llegada por enlace, pendiente de confirmar

function masterLoad() {
  try {
    const x = JSON.parse(localStorage.getItem(MKEY) || 'null') || {};
    MST.on = !!x.on;
    MST.camps = Array.isArray(x.camps) ? x.camps.filter(k => k && k.id) : [];
    if (!MST.camps.length) {
      /* Datos de antes de las campañas: pasan a «Campaña 1» */
      const k = campNew('Campaña 1');
      if (Array.isArray(x.players)) k.players = x.players;
      if (Array.isArray(x.shops)) k.shops = x.shops;
      if (x.fight) k.fight = x.fight;
      if (x.tab) k.tab = x.tab;
      MST.camps.push(k);
    }
    campUse(x.cur);
  } catch (e) {}
}
function masterSave() {
  campSync();
  try {
    localStorage.setItem(MKEY, JSON.stringify({ on: MST.on, cur: MST.cur, camps: MST.camps }));
  } catch (e) {}
}

/* ── Datos que comparte el jugador: solo la ventana de características ── */
function sheetOf(c) {
  const sp = ABIL.reduce((t, [k], i) => t | (c.saveProf.includes(k) ? 1 << i : 0), 0);
  return {
    v: 1,
    id: c.id,
    n: c.name || 'Sin nombre',
    c: [c.class && `${c.class} ${c.level}`, c.species].filter(Boolean).join(' · '),
    a: ABIL.map(([k]) => +c.abilities[k] || 10),
    s: ABIL.map(([k]) => saveB(c, k)),
    p: sp,
    ac: acOf(c),
    pp: 10 + skillB(c, SK.perception),
    i: init(c),
  };
}
const b64u = s =>
  btoa(String.fromCharCode(...new TextEncoder().encode(s)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
const unb64u = s =>
  new TextDecoder().decode(
    Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), ch => ch.charCodeAt(0))
  );
const sheetCode = c => b64u(JSON.stringify(sheetOf(c)));
const sheetLink = c => `${location.origin}${location.pathname}#pj=${sheetCode(c)}`;
/* Lee un código o un enlace con #pj=… y devuelve la ficha, o null si no es válido */
function sheetParse(txt) {
  const t = String(txt || '').trim(),
    m = t.match(/#pj=([A-Za-z0-9_-]+)/),
    code = m ? m[1] : /^[A-Za-z0-9_-]+$/.test(t) ? t : '';
  if (!code) return null;
  try {
    const x = JSON.parse(unb64u(code));
    /* Las criaturas, tiendas y recibos llevan «t»; una ficha no. Y siempre 6 características y 6 salvaciones */
    if (
      !x ||
      x.t ||
      !x.id ||
      !Array.isArray(x.a) ||
      x.a.length !== 6 ||
      !Array.isArray(x.s) ||
      x.s.length !== 6
    )
      return null;
    return {
      id: String(x.id).slice(0, 40),
      n: String(x.n || 'Sin nombre').slice(0, 60),
      c: String(x.c || '').slice(0, 80),
      a: x.a.map(v => clamp(parseInt(v) || 10, 1, 30)),
      s: x.s.map(v => clamp(parseInt(v) || 0, -10, 30)),
      p: parseInt(x.p) || 0,
      ac: clamp(parseInt(x.ac) || 10, 0, 40),
      pp: clamp(parseInt(x.pp) || 10, 0, 40),
      i: clamp(parseInt(x.i) || 0, -10, 30),
    };
  } catch (e) {
    return null;
  }
}
/* ── Criaturas del jugador (familiar, invocación, forma…): la misma ventana, una a una ── */
/* Características de las criaturas que la app calcula sola (reglas de 2024): [FUE…CAR], Percepción pasiva */
const CR_AB = {
  beast: [[18, 11, 16, 4, 14, 5], 12],
  fey: [[13, 16, 14, 14, 11, 16], 10],
  undead: [[12, 16, 15, 4, 10, 9], 10],
  elemental: [[18, 15, 17, 4, 10, 16], 10],
  construct: [[18, 10, 18, 14, 11, 5], 10],
  aberration: [[16, 10, 15, 16, 10, 6], 10],
  celestial: [[16, 14, 16, 10, 14, 16], 12],
  fiend: [[13, 16, 15, 10, 10, 16], 10],
  dragon: [[19, 14, 17, 10, 14, 14], 12],
  steed: [[18, 12, 14, 6, 12, 8], 11],
  land: [[14, 14, 15, 8, 14, 11], 12],
  sea: [[14, 14, 15, 8, 14, 11], 12],
  sky: [[6, 16, 13, 8, 14, 11], 12],
};
function creaSheetOf(c, x) {
  const st = creaStats(c, x),
    b = x.cat && BEASTS.find(z => z.id === x.cat);
  let a = null,
    pp = null,
    s = null;
  if (b) {
    a = [...b.ab];
    const m = /Percepción pasiva (\d+)/.exec(b.sen || '');
    pp = m ? +m[1] : null;
  } else {
    const k =
      x.kind === 'summon' ? x.s : x.kind === 'steed' ? 'steed' : x.kind === 'primal' ? x.v || 'land' : '';
    if (CR_AB[k]) [a, pp] = [[...CR_AB[k][0]], CR_AB[k][1]];
  }
  if (a) {
    s = a.map(v => mod(v));
    /* Forma salvaje: conservas tu INT, SAB y CAR y tus competencias en salvaciones */
    if (x.kind === 'form' && x.via === 'wild')
      ABIL.forEach(([k], i) => {
        if (i >= 3) a[i] = +c.abilities[k] || 10;
        s[i] = mod(a[i]) + (c.saveProf.includes(k) ? pb(c) : 0);
      });
    /* Compañero primigenio: suma tu competencia a sus pruebas y salvaciones */
    if (x.kind === 'primal') {
      s = s.map(v => v + pb(c));
      pp += pb(c);
    }
  }
  const lbl =
    x.kind === 'form'
      ? { wild: 'Forma salvaje', poly: 'Polimorfar', other: 'Transformación' }[x.via || 'other']
      : x.label || CREA_KINDS[x.kind].n;
  return {
    t: 'c',
    v: 1,
    id: x.id,
    o: c.id,
    on: c.name || 'Sin nombre',
    n: x.name || 'Sin nombre',
    k: [lbl, st.sub].filter(Boolean).join(' · '),
    a,
    s,
    ac: x.kind === 'form' ? formAC(c, x) : +st.ac || 0,
    pp,
    hp: +st.hpMax || null,
    mon: b ? b.id : '',
  };
}
const crCode = (c, x) => b64u(JSON.stringify(creaSheetOf(c, x)));
const crLink = (c, x) => `${location.origin}${location.pathname}#cr=${crCode(c, x)}`;
function crParse(code) {
  try {
    const x = JSON.parse(unb64u(code));
    if (!x || x.t !== 'c' || !x.id || !x.o) return null;
    const ok = Array.isArray(x.a) && x.a.length === 6 && Array.isArray(x.s) && x.s.length === 6;
    return {
      id: String(x.id).slice(0, 40),
      o: String(x.o).slice(0, 40),
      on: String(x.on || '').slice(0, 60),
      n: String(x.n || 'Sin nombre').slice(0, 60),
      k: String(x.k || '').slice(0, 100),
      a: ok ? x.a.map(v => clamp(parseInt(v) || 10, 1, 30)) : null,
      s: ok ? x.s.map(v => clamp(parseInt(v) || 0, -10, 30)) : null,
      ac: clamp(parseInt(x.ac) || 0, 0, 40),
      pp: x.pp === null || x.pp === undefined || x.pp === '' ? null : clamp(parseInt(x.pp) || 10, 0, 40),
      hp: parseInt(x.hp) > 0 ? clamp(parseInt(x.hp), 1, 9999) : null,
      mon: x.mon ? String(x.mon).slice(0, 60) : '',
    };
  } catch (e) {
    return null;
  }
}
/* Guarda la criatura con su jugador; devuelve el jugador o null si no está en la mesa */
function masterAddCrea(x) {
  const p = MST.players.find(q => q.id === x.o);
  if (!p) return null;
  x.t = Date.now();
  p.crs = (p.crs || []).filter(q => q.id !== x.id).concat(x);
  masterSave();
  return p;
}
/* Ventana de una criatura: lo mismo que la del jugador (características, salvaciones, CA y Percepción pasiva) */
function crCard(x, foot = '') {
  const irow = (lbl, val, desc) =>
    `<details class="inforow"><summary><span>${esc(lbl)}</span><b>${esc(val)}</b></summary><p class="hint">${esc(desc)}</p></details>`;
  return `<section class="card msheet"><div class="card-head"><h2>${esc(x.n)}</h2><small>${esc(x.k)}</small></div>${
    x.a
      ? `<div class="abil">${ABIL.map(
          ([k, l], i) => `<div class="ab"><span class="lbl">${l}</span>
      <span class="mod">${sgn(mod(x.a[i]))}</span><span class="sc">${x.a[i]}</span>
      <span class="sv">Salv. ${sgn(x.s[i])}</span></div>`
        ).join('')}</div>`
      : '<p class="hint">Sin características: es una criatura hecha a mano.</p>'
  }
    <div class="abil-extra">${irow('CA', String(x.ac), 'Clase de armadura: lo que tiene que igualar o superar un ataque para impactarle.')}${x.pp !== null ? irow('Percepción pasiva', String(x.pp), 'Lo que nota sin tirar dados.') : ''}</div>${foot}</section>`;
}
/* Ventana del jugador para pasar una criatura al máster */
let CRSH = null;
function openCreaShare(id) {
  const c = C(),
    x = c.companions.find(q => q.id === id);
  if (!x) return;
  const link = crLink(c, x),
    svg = qrSvg(link);
  CRSH = link;
  openModal(
    `<div class="wz-head"><h2>Pasar al máster</h2><button class="b sm" data-act="close-modal">Cerrar</button></div>
    <p class="hint">Enséñale este QR al máster: verá las características de <b>${esc(x.name || 'esta criatura')}</b> debajo de las tuyas. Solo se pasa esta criatura; las demás, solo si se las enseñas. Para que le llegue, antes tiene que tenerte en su mesa.</p>
    ${svg ? `<div class="qrbox">${svg}</div>` : '<p class="hint warn">No se ha podido crear el QR. Usa el código.</p>'}
    <div class="btns" style="justify-content:center"><button class="b pri" data-act="cr-copy">Copiar código</button>${qrFileBtn('cr', crCode(c, x), x.name || 'criatura')}</div>
    <h3>Lo que verá el máster</h3>${crCard(crParse(crCode(c, x)))}`,
    true
  );
}
/* Añade o actualiza un jugador en la mesa del máster */
function masterAddPlayer(x) {
  const i = MST.players.findIndex(p => p.id === x.id),
    nw = i < 0;
  x.t = Date.now();
  if (nw) MST.players.push(x);
  else {
    if (MST.players[i].crs) x.crs = MST.players[i].crs;
    MST.players[i] = x;
  }
  MST.fight.list.forEach(f => {
    if (f.pid === x.id) Object.assign(f, { name: x.n, ac: x.ac });
  });
  masterSave();
  return nw;
}

/* La ventana de características tal como la ve el máster (y la vista previa del jugador) */
function sheetCard(x, foot = '') {
  const irow = (lbl, val, desc) =>
    `<details class="inforow"><summary><span>${esc(lbl)}</span><b>${esc(val)}</b></summary><p class="hint">${esc(desc)}</p></details>`;
  return `<section class="card msheet"><div class="card-head"><h2>Características</h2><small>${esc(x.n)}${x.c ? ` · ${esc(x.c)}` : ''}</small></div><div class="abil">${ABIL.map(
    ([k, l], i) => `<div class="ab"><span class="lbl">${l}</span>
      <span class="mod">${sgn(mod(x.a[i]))}</span><span class="sc">${x.a[i]}</span>
      <span class="sv ${x.p & (1 << i) ? 'p' : ''}">Salv. ${sgn(x.s[i])}</span></div>`
  ).join('')}</div>
    <div class="abil-extra">${irow('CA', String(x.ac), 'Clase de armadura: lo que tiene que igualar o superar un ataque para impactarle.')}${irow('Percepción pasiva', String(x.pp), 'Lo que nota sin tirar dados: compárala con el Sigilo de quien se esconde o con la CD de lo que haya que notar.')}</div>${foot}</section>`;
}

/* ── Ventana del jugador: compartir con el máster ── */
function openShare() {
  const c = C(),
    link = sheetLink(c);
  let svg = '';
  try {
    const q = qrcode(0, 'M');
    q.addData(link);
    q.make();
    svg = q.createSvgTag({ cellSize: 4, margin: 3, scalable: true, alt: 'Código QR de tus características' });
  } catch (e) {}
  openModal(
    `<div class="wz-head"><h2>Compartir con el máster</h2><button class="b sm" data-act="close-modal">Cerrar</button></div>
    <p class="hint">Enséñale este QR al máster: lo escanea desde su modo máster (o con la cámara del móvil) y le llegan tus características. Si alguno usa portátil, exporta el archivo .json y pásaselo: lo importa en «+ Jugador». Si cambian (subes de nivel, otra armadura…), vuelve a enseñárselo.</p>
    ${svg ? `<div class="qrbox">${svg}</div>` : '<p class="hint warn">No se ha podido crear el QR. Usa el código.</p>'}
    <div class="btns" style="justify-content:center"><button class="b pri" data-act="share-copy">Copiar código</button>${qrFileBtn('pj', sheetCode(c), c.name || 'personaje')}${navigator.share ? '<button class="b" data-act="share-send">Enviar…</button>' : ''}</div>
    <h3>Lo que verá el máster</h3>${sheetCard(sheetOf(c))}`,
    true
  );
}

/* ── Vista del modo máster ── */
function renderMaster() {
  const tabs = [['combat', 'Combate'], ['shops', 'Tiendas'], ...MST.players.map(p => [p.id, p.n])];
  if (!tabs.some(t => t[0] === MST.tab)) MST.tab = 'combat';
  $('#top').innerHTML =
    `<div class="wrap"><div class="top-in mtop"><div><h1>Modo máster</h1><small>${esc((campOf(MST.cur) || {}).n || '')} · ${MST.players.length ? `${MST.players.length} ${MST.players.length === 1 ? 'jugador' : 'jugadores'}` : 'añade a tus jugadores con su QR'}</small></div><div class="btns"><button class="b" data-act="camp-open">Campañas</button><button class="b pri" data-act="m-add">+ Jugador</button></div></div>
    <div class="tabrow"><nav class="tabs">${tabs
      .map(
        ([t, n]) =>
          `<button class="${MST.tab === t ? 'on' : ''}" data-act="m-tab" data-t="${esc(t)}">${esc(n)}${t === 'combat' && MST.fight.list.length ? '<span class="live" title="En combate"></span>' : ''}</button>`
      )
      .join('')}</nav>${GEAR_BTN}</div></div>`;
  const p = MST.players.find(x => x.id === MST.tab);
  $('#view').innerHTML = p
    ? `<div class="mview">${sheetCard(
        p,
        `<p class="hint" style="margin-top:.6rem">Recibido el ${new Date(p.t).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}. Para actualizarlo, vuelve a escanear su QR.</p><div class="btns"><button class="b bad sm" data-act="m-del" data-id="${esc(p.id)}">Quitar jugador</button></div>`
      )}${(p.crs || [])
        .map(x =>
          crCard(
            x,
            `<p class="hint" style="margin-top:.6rem">Criatura de ${esc(p.n)} · recibida el ${new Date(x.t).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}.</p><div class="btns"><button class="b bad sm" data-act="m-cr-del" data-p="${esc(p.id)}" data-id="${esc(x.id)}">Quitar criatura</button></div>`
          )
        )
        .join('')}</div>`
    : MST.tab === 'shops'
      ? masterShops()
      : masterFight();
}
/* Lista de combate ordenada por iniciativa (las vacías al final) */
const fightSorted = () =>
  [...MST.fight.list].sort(
    (a, b) =>
      (b.init === '' ? -99 : +b.init) - (a.init === '' ? -99 : +a.init) || a.name.localeCompare(b.name, 'es')
  );
/* Regeneración que le deja levantarse a 0 PG (el trol): {n: PG por turno, revive: true} o null */
function fRegen(f) {
  const b = f.mon && bestGet(f.mon),
    t = b && (b.tr || []).find(x => /^Regeneraci/.test(x[0]));
  if (!t) return null;
  const m = /Recupera (\d+) PG/.exec(t[1]);
  return { n: m ? +m[1] : 0, revive: /solo muere si empieza su turno/i.test(t[1]) };
}
/* NPC (o criatura de un jugador) a 0 PG o menos. Con Regeneración del trol no cuenta hasta que se marca Muerto */
const fDown = f =>
  f.kind !== 'pj' && f.hp !== '' && +f.hp <= 0 && !(f.st !== 'dead' && fRegen(f) && fRegen(f).revive);
/* Salvación de un monstruo del bestiario (con competencia si la tiene) */
const bestSave = (b, i) => (b.sv && b.sv[i] != null ? b.sv[i] : Math.floor((b.ab[i] - 10) / 2));
/* Números con punto de miles siempre (1.800 y 18.000) */
const fmtNum = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
/* Ensangrentado: con la mitad de los PG o menos (algunos monstruos tienen rasgos que dependen de ello) */
const fBloodied = f => f.kind !== 'pj' && +f.hpMax > 0 && f.hp !== '' && +f.hp > 0 && +f.hp <= +f.hpMax / 2;
/* Cómo ha quedado un NPC caído */
const F_ST = { dead: 'Muerto', ko: 'Incapacitado' };
const fStLabel = f => F_ST[f.st] || 'Derrotado';
/* El combate ha empezado cuando a alguien le toca */
const fightOn = () => !!MST.fight.cur && MST.fight.list.some(f => f.id === MST.fight.cur);
function masterFight() {
  const F = MST.fight,
    L = fightSorted(),
    on = fightOn();
  const num = (f, k, w) =>
    `<input class="inline-num" type="number" inputmode="numeric" value="${esc(f[k] ?? '')}" data-mf="${k}" data-id="${f.id}" style="width:${w || 3.6}rem" aria-label="${k === 'init' ? 'Iniciativa' : k === 'hp' ? 'PG' : k === 'hpMax' ? 'PG máximos' : 'CA'} de ${esc(f.name)}">`;
  const rows = L.map(f => {
    const pl = f.kind === 'pj' && MST.players.find(p => p.id === f.pid);
    const down = fDown(f),
      ib = f.kind === 'pj' ? (pl ? pl.i : null) : f.ib;
    const who =
      f.kind === 'pj'
        ? 'Jugador'
        : down
          ? `<button class="mst ${f.st || ''}" data-act="m-st-ask" data-id="${f.id}" aria-label="Cambiar cómo ha quedado ${esc(f.name)}">${f.st === 'dead' ? '☠ ' : ''}${fStLabel(f)}</button>`
          : f.kind === 'cr'
            ? `Criatura de ${esc(f.owner || 'un jugador')}`
            : 'NPC';
    const b = f.mon && bestGet(f.mon);
    /* Etiquetas: ensangrentado, PJ a 0 PG, estados, concentración, nota, inmunidades y contadores de legendario */
    const tags = [
      fBloodied(f) ? '<span class="tag warn">Ensangrentado</span>' : '',
      f.kind === 'pj' && f.ko ? '<span class="tag bad">A 0 PG</span>' : '',
      ...(f.cs || []).map(x => `<span class="tag">${esc(x)}</span>`),
      f.conc ? `<span class="tag">Concentrado: ${esc(f.conc)}</span>` : '',
      f.noRegen ? '<span class="tag warn">Sin regenerar</span>' : '',
      f.note ? `<span class="tag">📝 ${esc(f.note)}</span>` : '',
    ].join('');
    const ctr = (k, max, lbl) =>
      max
        ? `<span class="mctr">${lbl} <b>${max - (+f[k] || 0)}/${max}</b> <button class="b sm" data-act="m-ctr" data-id="${f.id}" data-k="${k}" ${(+f[k] || 0) >= max ? 'disabled' : ''} aria-label="Gastar una (${lbl})">−1</button></span>`
        : '';
    const extra =
      f.kind === 'pj'
        ? ''
        : `${ctr('lgU', f.lg, 'Acc. legendarias')}${ctr('lrU', f.lr, 'Resist. legendarias')}${b && b.res ? `<span class="mres">${esc(b.res)}</span>` : ''}`;
    const atks =
      F.cur === f.id && b && (b.at || []).length
        ? `<div class="mat">${b.at.map(a => `<span><b>${esc(a[0])}</b> ${esc(a[1])} · ${esc(a[2])}</span>`).join('')}</div>`
        : '';
    return `<div class="mrow ${F.cur === f.id ? 'cur' : ''} ${down ? 'down' : ''} ${down && f.st ? 'st-' + f.st : ''}">
      <div class="mname"><b>${F.cur === f.id ? '▶ ' : ''}${esc(f.name)}</b><small>${who}${ib !== null && ib !== undefined && ib !== '' ? ` · inic. ${sgn(ib)}` : ''}${b ? ` · <button class="lnk" data-act="m-mon" data-id="${esc(f.mon)}">Ver ficha</button>` : ''} · <button class="lnk" data-act="m-cond" data-id="${f.id}">${f.kind === 'pj' ? 'Estado' : 'Estados y notas'}</button></small>${tags ? `<div class="mtags">${tags}</div>` : ''}${extra ? `<div class="mtags">${extra}</div>` : ''}${atks}</div>
      <label class="mf"><span>Inic.</span>${num(f, 'init')}</label>
      <label class="mf"><span>CA</span>${f.kind === 'pj' ? `<b>${esc(f.ac)}</b>` : num(f, 'ac')}</label>
      ${f.kind === 'pj' ? '<span class="mf"></span>' : `<label class="mf"><span>PG</span><span class="mhp">${num(f, 'hp')}<small>/ ${esc(f.hpMax || '—')}</small></span><button class="b sm mhpb" data-act="m-hp" data-id="${f.id}" aria-label="Daño o curación a ${esc(f.name)}">−/+</button></label>`}
      <button class="b sm" data-act="m-rm" data-id="${f.id}" aria-label="Quitar a ${esc(f.name)} del combate">×</button></div>`;
  }).join('');
  const missing =
    MST.players.filter(p => !F.list.some(f => f.pid === p.id)).length +
    MST.players.reduce((t, p) => t + (p.crs || []).filter(x => !F.list.some(f => f.crid === x.id)).length, 0);
  const btn = !F.list.length
    ? ''
    : on
      ? '<button class="b pri" data-act="m-next">Siguiente turno</button>'
      : '<button class="b pri" data-act="m-start">Empezar combate</button>';
  const undo = MUNDO.length ? '<button class="b sm" data-act="m-undo">Deshacer</button>' : '';
  const area = F.list.some(f => f.kind !== 'pj' && !fDown(f))
    ? '<button class="b" data-act="m-area">Daño a varios</button>'
    : '';
  return `<section class="card mfight"><div class="card-head mhead"><h2>Combate${on ? ` <span class="round">Ronda ${F.round}</span>` : ''}</h2><div class="btns">${undo}${btn}</div></div>
    <p class="hint">${
      on
        ? '«Siguiente turno» marca a quién le toca y al dar la vuelta pasa de ronda. Los NPC caídos se saltan. Con «−/+» restas daño o sumas curación sin hacer cuentas.'
        : 'Añade a todos y apunta la iniciativa que saque cada uno: la lista se ordena sola. Si hay un empate, decide el orden escribiendo decimales (14.5 va antes que 14). Quien esté sorprendido tira su iniciativa con desventaja (2d20, el más bajo). Cuando estéis listos, pulsa «Empezar combate».'
    }</p>
    ${rows ? `<div class="mlist">${rows}</div>` : '<p class="empty">Nadie en el combate todavía.</p>'}
    ${on && L.length > 5 ? `<div class="btns" style="margin-top:.6rem">${btn}</div>` : ''}
    <div class="btns" style="margin-top:.8rem"><button class="b" data-act="m-pjs" ${missing ? '' : 'disabled'}>Añadir jugadores${missing ? ` (${missing})` : ''}</button><button class="b" data-act="m-foe">Añadir NPC</button>${area}${F.list.length ? '<button class="b bad" data-act="m-end">Terminar combate</button>' : ''}</div>
    ${MST.players.length ? '' : '<p class="hint">Para añadir jugadores, pulsa «+ Jugador» y escanea su QR (en su app: ⚙ Ajustes → Compartir con el máster).</p>'}</section>`;
}
/* Suma o resta PG a una fila (d < 0 = daño). Avisa de la concentración y de si cae */
function fightHp(f, d, fire, quiet) {
  if (f.hp === '' && d < 0 && !f.hpMax) return;
  const was = fDown(f),
    before = f.hp === '' ? +f.hpMax || 0 : +f.hp;
  let now = before + d;
  if (d > 0 && +f.hpMax) now = Math.min(+f.hpMax, now);
  f.hp = Math.max(0, now);
  if (fire) f.noRegen = true;
  if (+f.hp > 0) delete f.st;
  if (quiet) return;
  masterSave();
  render();
  const msgs = [];
  if (d < 0 && f.conc && f.hp > 0)
    msgs.push(
      `<b>Concentración:</b> ${esc(f.name)} tira salvación de CON CD ${Math.min(30, Math.max(10, Math.floor(-d / 2)))} para no perder ${esc(f.conc)}.`
    );
  if (fBloodied(f) && !(before > 0 && before <= +f.hpMax / 2))
    msgs.push(`${esc(f.name)} está <b>ensangrentado</b>.`);
  if (msgs.length) toast(msgs.map(x => `<div class="t-parts">${x}</div>`).join(''), true);
  if ((fDown(f) && !was) || (f.kind !== 'pj' && +f.hp <= 0 && before > 0)) openFoeDown(f);
}
/* Ventana de estados y notas de una fila de combate */
function openFightCond(id) {
  const f = MST.fight.list.find(x => x.id === id);
  if (!f) return;
  if (f.kind === 'pj') {
    openModal(`<h2>${esc(f.name)}</h2>
      <label class="chk"><input type="checkbox" id="mc-ko" ${f.ko ? 'checked' : ''}> Está a 0 PG (inconsciente)</label>
      <p class="hint">Sus PG los lleva el jugador en su app: marca esto cuando te lo diga. Atacarle a 5 pies es crítico, y cada golpe que recibe a 0 PG es un fallo de salvación contra la muerte (dos si es crítico).</p>
      <div class="btns"><button class="b pri" data-act="m-cond-ok" data-id="${f.id}">Guardar</button><button class="b" data-act="close-modal">Cancelar</button></div>`);
    return;
  }
  const rg = fRegen(f);
  openModal(`<div class="wz-head"><h2>${esc(f.name)}</h2><button class="b sm pri" data-act="m-cond-ok" data-id="${f.id}">Guardar</button></div>
    <h3>Estados</h3><div class="mconds">${CONDS.map(([n, d]) => `<label class="chk"><input type="checkbox" data-mc value="${esc(n)}" ${(f.cs || []).includes(n) ? 'checked' : ''}><span><b>${esc(n)}</b><br><small class="muted">${esc(d)}</small></span></label>`).join('')}</div>
    <label class="f"><span>Se concentra en (si lanza un conjuro de concentración)</span><input id="mc-conc" value="${esc(f.conc || '')}" placeholder="Por ejemplo: Inmovilizar persona"></label>
    <label class="f"><span>Nota (salvaciones que repite al final de su turno, lo que hizo…)</span><input id="mc-note" value="${esc(f.note || '')}" placeholder="Por ejemplo: repite SAB CD 13 (Dormir)"></label>
    ${rg ? `<label class="chk"><input type="checkbox" id="mc-fire" ${f.noRegen ? 'checked' : ''}> Ha recibido daño de fuego o ácido (no se regenera en su siguiente turno)</label>` : ''}
    <p class="hint">Al empezar su turno, la app te recuerda sus estados, su concentración y la nota.</p>`);
}
/* PX del combate */
let MXP = new Set();
function openEndFight() {
  const F = MST.fight,
    npcs = F.list.filter(f => f.kind === 'npc' && f.mon && bestGet(f.mon)),
    pjs = F.list.filter(f => f.kind === 'pj').length,
    xpOf = f => BEST_XP[bestGet(f.mon).cr] || 0,
    tot = npcs.filter(f => MXP.has(f.id)).reduce((t, f) => t + xpOf(f), 0),
    ko = F.list.some(f => f.kind === 'npc' && f.st === 'ko');
  openModal(`<h2>Terminar el combate</h2>
    ${
      npcs.length
        ? `<h3>Puntos de experiencia</h3><p class="hint">Marcados, los derrotados. Marca también los que hayan huido o se hayan rendido si el máster quiere contarlos.</p>
      <div class="mconds">${npcs.map(f => `<label class="chk"><input type="checkbox" data-act="m-xp-tog" data-id="${f.id}" ${MXP.has(f.id) ? 'checked' : ''}><span>${esc(f.name)} · ${fmtNum(xpOf(f))} PX</span></label>`).join('')}</div>
      <p><b>Total: ${fmtNum(tot)} PX</b>${pjs ? ` · <b>${fmtNum(Math.floor(tot / pjs))} PX</b> para cada uno de los ${pjs} jugadores` : ''}.</p>`
        : ''
    }
    ${ko ? '<label class="chk"><input type="checkbox" id="m-keep" checked> Mantener en la lista a los incapacitados (prisioneros)</label>' : ''}
    <p class="hint">Se vacía la lista de combate (los jugadores siguen en tu mesa).</p>
    <div class="btns"><button class="b bad" data-act="m-end-ok">Terminar</button><button class="b" data-act="close-modal">Cancelar</button></div>`);
}
/* Daño en área */
let MAREA = null;
function mareaCollect() {
  if (!MAREA) return;
  if ($('#ma-dmg')) MAREA.dmg = $('#ma-dmg').value;
  if ($('#ma-dc')) MAREA.dc = $('#ma-dc').value;
  if ($('#ma-ab')) MAREA.ab = +$('#ma-ab').value;
  if ($('#ma-half')) MAREA.half = $('#ma-half').checked;
}
function openFightArea() {
  const M2 = MAREA,
    L = fightSorted().filter(f => f.kind !== 'pj' && !fDown(f)),
    AB6 = ['FUE', 'DES', 'CON', 'INT', 'SAB', 'CAR'];
  openModal(`<div class="wz-head"><h2>Daño a varios</h2><button class="b sm pri" data-act="m-area-ok">Aplicar</button></div>
    <p class="hint">Para Bola de fuego, un aliento o cualquier área: marca a quién le afecta, escribe el daño que ha tirado el jugador y su CD. Cada uno tira su salvación: marca quién la supera.</p>
    <div class="grid"><label class="f"><span>Daño</span><input id="ma-dmg" type="number" inputmode="numeric" min="0" value="${esc(M2.dmg)}"></label>
    <label class="f"><span>Salvación de</span><select id="ma-ab">${AB6.map((a, i) => `<option value="${i}" ${M2.ab === i ? 'selected' : ''}>${a}</option>`).join('')}</select></label>
    <label class="f"><span>CD</span><input id="ma-dc" type="number" inputmode="numeric" value="${esc(M2.dc)}"></label></div>
    <label class="chk"><input type="checkbox" id="ma-half" ${M2.half ? 'checked' : ''}> Si la supera, recibe la mitad (si no, nada)</label>
    <div class="mconds">${L.map(f => {
      const b = f.mon && bestGet(f.mon),
        sv = b ? sgn(bestSave(b, M2.ab)) : '';
      return `<div class="marea"><label class="chk"><input type="checkbox" data-act="m-area-tog" data-k="ids" data-id="${f.id}" ${M2.ids.has(f.id) ? 'checked' : ''}><span><b>${esc(f.name)}</b>${sv ? ` · tira 1d20 ${sv}` : ''}</span></label>${M2.ids.has(f.id) ? `<label class="chk"><input type="checkbox" data-act="m-area-tog" data-k="ok" data-id="${f.id}" ${M2.ok.has(f.id) ? 'checked' : ''}><span>La supera</span></label>` : ''}</div>`;
    }).join('')}</div>`);
}
/* Pregunta cómo queda un NPC que ha caído a 0 PG */
function openFoeDown(f) {
  if (f.kind === 'cr') {
    openModal(`<h2>${esc(f.name)} ha caído</h2><p class="hint">Es una criatura de ${esc(f.owner || 'un jugador')}. Las invocaciones y los familiares desaparecen al llegar a 0 PG (un familiar se puede volver a invocar más adelante).</p>
      <div class="btns"><button class="b bad" data-act="m-rm-ok" data-id="${f.id}">Quitarla del combate</button><button class="b" data-act="m-st" data-id="${f.id}" data-st="dead">Dejarla en la lista, caída</button></div>`);
    return;
  }
  const rg = fRegen(f);
  openModal(`<h2>${esc(f.name)} ha caído</h2>${rg && rg.revive ? `<p class="hint warn"><b>Regeneración:</b> solo muere si empieza su turno a 0 PG sin regenerarse (si recibió daño de fuego o ácido). Si no, en su turno recupera ${rg.n} PG y se levanta. Márcalo como muerto solo si es así; la app lo hace sola en su turno.</p>` : ''}
    <p class="hint">Ha llegado a 0 PG. ¿Cómo queda?</p>
    <button class="b opt ${f.st === 'dead' ? 'on' : ''}" data-act="m-st" data-id="${f.id}" data-st="dead"><span><b>☠ Muerto</b><br><small>Ya no actúa.</small></span><span aria-hidden="true">›</span></button>
    <button class="b opt ${f.st === 'ko' ? 'on' : ''}" data-act="m-st" data-id="${f.id}" data-st="ko"><span><b>Incapacitado</b><br><small>Inconsciente pero vivo: luego se le puede interrogar o estabilizar.</small></span><span aria-hidden="true">›</span></button>
    <p class="hint">Regla: normalmente un monstruo a 0 PG muere. Pero si el golpe final es un ataque cuerpo a cuerpo, quien ataca puede decidir dejarlo inconsciente en vez de matarlo.</p>
    <div class="btns"><button class="b" data-act="close-modal">Decidirlo luego</button></div>`);
}
function openAddPlayer() {
  openModal(`<div class="wz-head"><h2>Añadir jugador</h2><button class="b sm" data-act="close-modal">Cerrar</button></div>
    <p class="hint">En la app del jugador: ⚙ Ajustes → Compartir con el máster. Escanea el QR que le aparece o importa el archivo .json que te pase.</p>
    <button class="b pri opt" data-act="m-scan"><span><b>Escanear QR</b><br><small>Con la cámara de este dispositivo</small></span><span aria-hidden="true">›</span></button>
    <div class="btns">${qrFileInput()}</div>
    <h3>O pega su código</h3><textarea id="m-code" class="code" style="min-height:5rem" placeholder="Código o enlace que te ha pasado el jugador"></textarea>
    <div class="btns"><button class="b" data-act="m-paste">Añadir</button></div>`);
}
/* NPC que se está añadiendo (la ventana se repinta al buscar o elegir del bestiario) */
let MFOE = null;
/* «Deshacer» del combate del máster: copias de MST.fight (las guarda el manejador de clics) */
const MUNDO = [];
/* Pasa el turno desde la fila «from» (que puede haberse ido ya): salta a los caídos y sube la ronda al dar la vuelta.
   gone = ids que ya no cuentan. Devuelve el id del nuevo turno o '' */
function fightPass(from, gone = []) {
  const F = MST.fight,
    L = fightSorted(),
    all = [...L],
    me = all.find(f => f.id === from);
  if (!me) return '';
  /* El orden incluye al que se va para saber dónde estaba */
  let j = all.indexOf(me),
    wrap = false;
  for (let k = 0; k < all.length; k++) {
    j++;
    if (j >= all.length) {
      j = 0;
      wrap = true;
    }
    const f = all[j];
    if (!gone.includes(f.id) && f.id !== from && !fDown(f)) {
      if (wrap) F.round++;
      return f.id;
    }
  }
  return '';
}
/* Lo que el máster tiene que recordar cuando a alguien le empieza o le acaba el turno */
function fightTurnNotes(f, ending) {
  if (!f) return '';
  const out = [];
  if (ending) {
    if ((f.cs || []).length || f.note)
      out.push(
        `<b>Acaba el turno de ${esc(f.name)}:</b> mira si tiene que repetir alguna salvación${f.note ? ` (${esc(f.note)})` : ''}.`
      );
    return out.join('');
  }
  if ((f.cs || []).length) out.push(`Estados: ${f.cs.map(esc).join(', ')}.`);
  if (f.conc) out.push(`Se está concentrando en ${esc(f.conc)}.`);
  if (f.note) out.push(`Nota: ${esc(f.note)}.`);
  if (f.lg) out.push(`Recupera sus ${f.lg} acciones legendarias.`);
  if (f.rc) out.push(`Recarga de ${esc(f.rc)}: si está gastada, tira 1d6 (se recarga con 5 o 6).`);
  return out.length ? `<div class="t-parts"><b>Turno de ${esc(f.name)}.</b> ${out.join(' ')}</div>` : '';
}
const mfoeNew = () => ({ q: '', id: '', name: '', n: 1, init: '', ac: '', hp: '' });
/* Guarda en MFOE lo escrito en la ventana */
function mfoeCollect() {
  if (!MFOE) return;
  const g = id => ($('#' + id) ? $('#' + id).value.trim() : null);
  [
    ['name', 'mf-name'],
    ['n', 'mf-n'],
    ['init', 'mf-init'],
    ['ac', 'mf-ac'],
    ['hp', 'mf-hp'],
    ['q', 'mf-q'],
  ].forEach(([k, id]) => {
    const v = g(id);
    if (v !== null) MFOE[k] = v;
  });
}
function openAddFoe() {
  if (!MFOE) MFOE = mfoeNew();
  const x = MFOE,
    b = x.id && bestGet(x.id);
  openModal(`<div class="wz-head"><h2>Añadir NPC</h2><button class="b sm" data-act="close-modal">Cerrar</button></div>
    <h3>Del bestiario</h3>
    <p class="hint">Busca la criatura y tócala: se rellenan solos su CA y sus PG. Si no está, rellena los datos a mano.</p>
    <input id="mf-q" type="search" class="bsearch" placeholder="Goblin, lobo, dragón rojo…" autocomplete="off" value="${esc(x.q)}" aria-label="Buscar en el bestiario">
    <div id="mf-res" class="bresults">${bestResults(x.q, x.id)}</div>
    ${b ? `<div class="bpick"><span>Elegido: <b>${esc(b.n)}</b> · VD ${esc(b.crs)}</span><span class="btns"><button class="b sm" data-act="m-foe-see" data-id="${b.id}">Ver ficha</button><button class="b sm" data-act="m-foe-pick" data-id="">Quitar</button></span></div>` : ''}
    <h3>Datos</h3>
    <div class="grid"><label class="f wide"><span>Nombre</span><input id="mf-name" placeholder="Goblin, Bandido…" autocomplete="off" value="${esc(x.name)}"></label>
    <label class="f"><span>Cuántos</span><input id="mf-n" type="number" inputmode="numeric" min="1" max="20" value="${esc(x.n)}"></label>
    <label class="f"><span>Iniciativa</span><input id="mf-init" type="number" inputmode="numeric" placeholder="Opcional" value="${esc(x.init)}"></label>
    <label class="f"><span>CA</span><input id="mf-ac" type="number" inputmode="numeric" value="${esc(x.ac)}"></label>
    <label class="f"><span>PG</span><input id="mf-hp" type="number" inputmode="numeric" value="${esc(x.hp)}"></label></div>
    <p class="hint">${b ? `Iniciativa: tira 1d20 ${sgn(bestIni(b))} (su Destreza; algunos monstruos, sobre todo los grandes, tienen más en el manual de 2024: si es así, apunta su resultado a mano). ` : ''}Si pones varios, se numeran solos (Goblin 1, Goblin 2…) y cada uno lleva sus PG.</p>
    <div class="btns"><button class="b pri" data-act="m-foe-add">Añadir</button><button class="b" data-act="close-modal">Cancelar</button></div>`);
}
/* Elige (o quita) una criatura del bestiario */
function mfoePick(id) {
  mfoeCollect();
  const x = MFOE,
    old = x.id && bestGet(x.id),
    b = id && bestGet(id);
  /* El nombre se cambia solo si no lo ha escrito el máster */
  const auto = !x.name || (old && x.name === old.n);
  x.id = b ? b.id : '';
  if (b) {
    if (auto) x.name = b.n;
    x.ac = String(b.ac);
    x.hp = String(b.hp);
  } else if (old) {
    if (auto) x.name = '';
    x.ac = x.hp = '';
  }
  openAddFoe();
}
/* Al buscar, solo se repinta la lista (para no perder el foco) */
function mfoeSearch(q) {
  if (!MFOE) return;
  MFOE.q = q;
  const r = $('#mf-res');
  if (r) {
    r.innerHTML = bestResults(q, MFOE.id);
    r.scrollTop = 0;
  }
}

/* ── Campañas: cada una con sus jugadores, tiendas y combate ── */
function openCamps() {
  campSync();
  const cnt = (n, a, b) => `${n} ${n === 1 ? a : b}`;
  openModal(`<div class="wz-head"><h2>Campañas</h2><button class="b sm" data-act="close-modal">Cerrar</button></div>
    <p class="hint">Cada campaña tiene sus propios jugadores, tiendas y combate. Elige con cuál quieres jugar.</p>
    <div class="list">${MST.camps
      .map(
        k => `<div class="it ${k.id === MST.cur ? 'camp-on' : ''}"><div class="it-head"><span class="it-name">${esc(k.n)}${k.id === MST.cur ? ' <span class="tag">activa</span>' : ''}</span>${k.id === MST.cur ? '' : `<button class="b sm pri" data-act="camp-use" data-id="${k.id}">Jugar esta</button>`}</div>
        <div class="meta">${cnt(k.players.length, 'jugador', 'jugadores')} · ${cnt(k.shops.length, 'tienda', 'tiendas')}${k.fight && k.fight.list && k.fight.list.length ? ' · combate en curso' : ''}</div>
        <div class="btns"><button class="b sm" data-act="camp-ren" data-id="${k.id}">Renombrar</button>${MST.camps.length > 1 ? `<button class="b sm bad" data-act="camp-del" data-id="${k.id}">Borrar</button>` : ''}</div></div>`
      )
      .join('')}</div>
    <h3>Nueva campaña</h3><div class="pay"><input id="camp-n" style="flex:1;min-width:0" placeholder="Nombre de la campaña" autocomplete="off" aria-label="Nombre de la nueva campaña"><button class="b pri" data-act="camp-add">Crear</button></div>`);
}
/* ── Leer un QR con la cámara (BarcodeDetector si existe; si no, jsQR) ── */
function scanStop() {
  if (!SCAN) return;
  SCAN.stop = true;
  if (SCAN.stream) SCAN.stream.getTracks().forEach(t => t.stop());
  SCAN = null;
}
function loadJsQR() {
  if (window.jsQR) return Promise.resolve();
  return new Promise((ok, ko) => {
    const s = document.createElement('script');
    s.src = 'vendor/jsQR.js';
    s.onload = ok;
    s.onerror = ko;
    document.head.appendChild(s);
  });
}
/* ── Pasar lo mismo que un QR con un archivo .json (para quien no tenga cámara, como en un portátil) ── */
const QR_FILE = { pj: 'caracteristicas', cr: 'criatura', tienda: 'tienda', recibo: 'recibo' };
const fileSlug = s =>
  norm(s)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'fichas';
/* Botón para exportar: guarda en QRDL lo que se descargará */
let QRDL = null;
function qrFileBtn(k, code, name) {
  QRDL = { k, code, name };
  return '<button class="b" data-act="qr-dl">Exportar archivo .json</button>';
}
const qrFileInput = () =>
  '<label class="b">Importar archivo .json<input type="file" id="qr-file" accept=".json,application/json,text/plain" hidden></label>';
function qrFileSave() {
  if (!QRDL) return;
  download(
    `${QR_FILE[QRDL.k]}-${fileSlug(QRDL.name)}.json`,
    JSON.stringify({ fichas5e: QRDL.k, datos: JSON.parse(unb64u(QRDL.code)) }, null, 2)
  );
}
/* Lee un archivo exportado (o un archivo con un código o enlace dentro) */
function qrFileRead(text) {
  try {
    const o = JSON.parse(text);
    if (o && QR_FILE[o.fichas5e] && o.datos) return { k: o.fichas5e, code: b64u(JSON.stringify(o.datos)) };
  } catch (e) {}
  return qrKind(text);
}
/* Qué es un QR o código leído: {k:'pj'|'tienda'|'recibo', code} o null */
function qrKind(txt) {
  const t = String(txt || '').trim(),
    m = t.match(/#(pj|cr|tienda|recibo)=([A-Za-z0-9_-]+)/);
  if (m) return { k: m[1], code: m[2] };
  if (!/^[A-Za-z0-9_-]+$/.test(t)) return null;
  if (sheetParse(t)) return { k: 'pj', code: t };
  if (crParse(t)) return { k: 'cr', code: t };
  if (shopParse(t)) return { k: 'tienda', code: t };
  if (rcptParse(t)) return { k: 'recibo', code: t };
  return null;
}
/* Hace lo que toca con lo leído, según el modo (máster o jugador) */
function qrRun(h) {
  if (!h) {
    toast('<div class="t-parts">Ese código no es de Fichas 5e.</div>');
    return;
  }
  if (MST.on) {
    if (h.k === 'pj') {
      const x = sheetParse(h.code);
      if (!x) return qrRun(null);
      const nw = masterAddPlayer(x);
      MST.tab = x.id;
      masterSave();
      render();
      toast(
        `<div class="t-label">${nw ? 'Jugador añadido' : 'Jugador actualizado'}</div><div class="t-big">${esc(x.n)}</div>`
      );
    } else if (h.k === 'cr') {
      const x = crParse(h.code);
      if (!x) return qrRun(null);
      const p = masterAddCrea(x);
      if (!p) {
        toast(
          `<div class="t-parts">${esc(x.n)} es de ${esc(x.on || 'un jugador')}, que no está en tu mesa${MST.camps.length > 1 ? ' de esta campaña' : ''}. Añade primero a su jugador con su QR y vuelve a escanear el de la criatura.</div>`
        );
        return;
      }
      MST.tab = p.id;
      render();
      toast(`<div class="t-label">Criatura de ${esc(p.n)}</div><div class="t-big">${esc(x.n)}</div>`);
    } else if (h.k === 'recibo') {
      const rc = rcptParse(h.code);
      if (!rc) return qrRun(null);
      rcptApply(rc);
    } else toast('<div class="t-parts">Ese QR es de una tienda: lo tiene que escanear un jugador.</div>');
    return;
  }
  if (h.k === 'tienda') {
    const x = shopParse(h.code);
    if (!x) return qrRun(null);
    shopEnter(x);
  } else toast('<div class="t-parts">Ese QR es para el máster: escanéalo desde el modo máster.</div>');
}
async function openScan() {
  openModal(`<h2>${MST.on ? 'Escanear o importar' : 'Recibir del máster'}</h2><div class="scanbox"><video id="scan-v" playsinline muted></video></div>
    <p class="hint" id="scan-msg">${MST.on ? 'Apunta la cámara al QR del jugador (sus características o su recibo).' : 'Apunta la cámara al QR del máster.'}</p>
    <div class="btns">${qrFileInput()}</div><p class="hint">Sin cámara (por ejemplo, en un portátil), importa el archivo .json que te hayan pasado.</p>
    <details><summary>¿No se lee? Pega el código</summary><textarea id="scan-code" class="code" style="min-height:4rem"></textarea><div class="btns"><button class="b" data-act="scan-paste">Usar el código</button></div></details>
    <div class="btns"><button class="b" data-act="${MST.on ? 'm-add' : 'close-modal'}">${MST.on ? 'Volver' : 'Cerrar'}</button></div>`);
  const msg = t => $('#scan-msg') && ($('#scan-msg').textContent = t);
  const noCam = t => {
    msg(t);
    const box = $('.scanbox');
    if (box) box.hidden = true;
  };
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    noCam(
      'Este navegador no deja usar la cámara. Importa el archivo .json, pega el código o escanéalo con la cámara del móvil.'
    );
    return;
  }
  const me = (SCAN = { stop: false, stream: null });
  try {
    me.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
  } catch (e) {
    noCam('No hay cámara o no hay permiso para usarla. Importa el archivo .json o pega el código.');
    return;
  }
  if (me.stop) return me.stream.getTracks().forEach(t => t.stop());
  const v = $('#scan-v');
  v.srcObject = me.stream;
  await v.play().catch(() => {});
  let detect;
  if ('BarcodeDetector' in window) {
    try {
      const bd = new BarcodeDetector({ formats: ['qr_code'] });
      detect = async () => ((await bd.detect(v))[0] || {}).rawValue || '';
    } catch (e) {}
  }
  if (!detect) {
    try {
      await loadJsQR();
    } catch (e) {
      msg('No se ha podido cargar el lector de QR. Pega el código.');
      return;
    }
    const cv = document.createElement('canvas'),
      cx = cv.getContext('2d', { willReadFrequently: true });
    detect = async () => {
      if (!v.videoWidth) return '';
      cv.width = v.videoWidth;
      cv.height = v.videoHeight;
      cx.drawImage(v, 0, 0);
      const r = jsQR(cx.getImageData(0, 0, cv.width, cv.height).data, cv.width, cv.height);
      return r ? r.data : '';
    };
  }
  const tick = async () => {
    if (me.stop) return;
    let txt = '';
    try {
      txt = await detect();
    } catch (e) {}
    if (txt) {
      const h = qrKind(txt);
      if (h) {
        scanStop();
        closeModal();
        qrRun(h);
        return;
      }
      msg('Ese QR no es de Fichas 5e.');
    }
    setTimeout(tick, 250);
  };
  tick();
}

/* Al abrir la app con un enlace #pj=…, #tienda=… o #recibo=… (un QR escaneado con la cámara del móvil) */
function masterHash() {
  const m = location.hash.match(/^#(pj|cr|tienda|recibo)=([A-Za-z0-9_-]+)/);
  if (!m) return;
  history.replaceState(null, '', location.pathname + location.search);
  if (m[1] !== 'pj' || MST.on) return qrRun({ k: m[1], code: m[2] });
  const x = sheetParse(m[2]);
  if (!x) return qrRun(null);
  MHASH = x;
  openModal(`<h2>Ha llegado una ficha</h2><p>Son las características de <b>${esc(x.n)}</b>${x.c ? ` (${esc(x.c)})` : ''}, compartidas para el máster.</p>
    <p class="hint">Si eres el máster, se añade a tu mesa y la app pasa al modo máster (puedes volver al modo jugador desde ⚙ Ajustes).</p>
    <div class="btns"><button class="b pri" data-act="m-hash-ok">Añadir a mi mesa</button><button class="b" data-act="close-modal">Cancelar</button></div>`);
}
