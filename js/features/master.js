/* Modo máster: jugadores recibidos por QR o código, sus características y el seguimiento de turnos. También la ventana del jugador para compartir con el máster. */
'use strict';

const MKEY = 'fichas-master';
/* Estado del modo máster (por dispositivo): on, pestaña, jugadores y combate */
let MST = { on: false, tab: 'combat', players: [], fight: { round: 1, cur: '', list: [] } };
let SCAN = null; // cámara abierta para leer un QR
let MHASH = null; // ficha llegada por enlace, pendiente de confirmar

function masterLoad() {
  try {
    const x = JSON.parse(localStorage.getItem(MKEY) || 'null');
    if (x)
      MST = Object.assign(MST, x, { fight: Object.assign({ round: 1, cur: '', list: [] }, x.fight || {}) });
  } catch (e) {}
}
function masterSave() {
  try {
    localStorage.setItem(MKEY, JSON.stringify(MST));
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
    if (!x || !x.id || !Array.isArray(x.a) || x.a.length !== 6 || !Array.isArray(x.s)) return null;
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
/* Añade o actualiza un jugador en la mesa del máster */
function masterAddPlayer(x) {
  const i = MST.players.findIndex(p => p.id === x.id),
    nw = i < 0;
  x.t = Date.now();
  if (nw) MST.players.push(x);
  else MST.players[i] = x;
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
    <p class="hint">Enséñale este QR al máster: lo escanea desde su modo máster (o con la cámara del móvil) y le llegan tus características. Si cambian (subes de nivel, otra armadura…), vuelve a enseñárselo.</p>
    ${svg ? `<div class="qrbox">${svg}</div>` : '<p class="hint warn">No se ha podido crear el QR. Usa el código.</p>'}
    <div class="btns" style="justify-content:center"><button class="b pri" data-act="share-copy">Copiar código</button>${navigator.share ? '<button class="b" data-act="share-send">Enviar…</button>' : ''}</div>
    <h3>Lo que verá el máster</h3>${sheetCard(sheetOf(c))}`,
    true
  );
}

/* ── Vista del modo máster ── */
function renderMaster() {
  const tabs = [['combat', 'Combate'], ...MST.players.map(p => [p.id, p.n])];
  if (!tabs.some(t => t[0] === MST.tab)) MST.tab = 'combat';
  $('#top').innerHTML =
    `<div class="wrap"><div class="top-in mtop"><div><h1>Modo máster</h1><small>${MST.players.length ? `${MST.players.length} ${MST.players.length === 1 ? 'jugador' : 'jugadores'}` : 'Añade a tus jugadores con su QR'}</small></div><button class="b pri" data-act="m-add">+ Jugador</button></div>
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
      )}</div>`
    : masterFight();
}
/* Lista de combate ordenada por iniciativa (las vacías al final) */
const fightSorted = () =>
  [...MST.fight.list].sort(
    (a, b) =>
      (b.init === '' ? -99 : +b.init) - (a.init === '' ? -99 : +a.init) || a.name.localeCompare(b.name, 'es')
  );
function masterFight() {
  const F = MST.fight,
    L = fightSorted();
  const num = (f, k, w) =>
    `<input class="inline-num" type="number" inputmode="numeric" value="${esc(f[k] ?? '')}" data-mf="${k}" data-id="${f.id}" style="width:${w || 3.6}rem" aria-label="${k === 'init' ? 'Iniciativa' : k === 'hp' ? 'PG' : k === 'hpMax' ? 'PG máximos' : 'CA'} de ${esc(f.name)}">`;
  const rows = L.map(f => {
    const pl = f.kind === 'pj' && MST.players.find(p => p.id === f.pid);
    const down = f.kind !== 'pj' && f.hp !== '' && +f.hp <= 0;
    return `<div class="mrow ${F.cur === f.id ? 'cur' : ''} ${down ? 'down' : ''}">
      <div class="mname"><b>${F.cur === f.id ? '▶ ' : ''}${esc(f.name)}</b><small>${f.kind === 'pj' ? `Jugador${pl ? ` · inic. ${sgn(pl.i)}` : ''}` : down ? 'Derrotado' : 'Enemigo'}</small></div>
      <label class="mf"><span>Inic.</span>${num(f, 'init')}</label>
      <label class="mf"><span>CA</span>${f.kind === 'pj' ? `<b>${esc(f.ac)}</b>` : num(f, 'ac')}</label>
      ${f.kind === 'pj' ? '<span class="mf"></span>' : `<label class="mf"><span>PG</span><span class="mhp">${num(f, 'hp')}<small>/ ${esc(f.hpMax || '—')}</small></span></label>`}
      <button class="b sm" data-act="m-rm" data-id="${f.id}" aria-label="Quitar a ${esc(f.name)} del combate">×</button></div>`;
  }).join('');
  const missing = MST.players.filter(p => !F.list.some(f => f.pid === p.id)).length;
  return `<section class="card mfight"><div class="card-head"><h2>Combate${F.list.length ? ` <span class="round">Ronda ${F.round}</span>` : ''}</h2><div class="btns">${F.list.length ? '<button class="b pri" data-act="m-next">Siguiente turno</button>' : ''}</div></div>
    <p class="hint">Apunta la iniciativa que saque cada uno: la lista se ordena sola. «Siguiente turno» marca a quién le toca y al dar la vuelta pasa de ronda.</p>
    ${rows ? `<div class="mlist">${rows}</div>` : '<p class="empty">Nadie en el combate todavía.</p>'}
    <div class="btns" style="margin-top:.8rem"><button class="b" data-act="m-pjs" ${missing ? '' : 'disabled'}>Añadir jugadores${missing ? ` (${missing})` : ''}</button><button class="b" data-act="m-foe">Añadir enemigo</button>${F.list.length ? '<button class="b bad" data-act="m-end">Terminar combate</button>' : ''}</div>
    ${MST.players.length ? '' : '<p class="hint">Para añadir jugadores, pulsa «+ Jugador» y escanea su QR (en su app: ⚙ Ajustes → Compartir con el máster).</p>'}</section>`;
}
function openAddPlayer() {
  openModal(`<div class="wz-head"><h2>Añadir jugador</h2><button class="b sm" data-act="close-modal">Cerrar</button></div>
    <p class="hint">En la app del jugador: ⚙ Ajustes → Compartir con el máster. Escanea el QR que le aparece.</p>
    <button class="b pri opt" data-act="m-scan"><span><b>Escanear QR</b><br><small>Con la cámara de este dispositivo</small></span><span aria-hidden="true">›</span></button>
    <h3>O pega su código</h3><textarea id="m-code" class="code" style="min-height:5rem" placeholder="Código o enlace que te ha pasado el jugador"></textarea>
    <div class="btns"><button class="b" data-act="m-paste">Añadir</button></div>`);
}
function openAddFoe() {
  openModal(`<h2>Añadir enemigo</h2>
    <div class="grid"><label class="f wide"><span>Nombre</span><input id="mf-name" placeholder="Goblin, Bandido…" autocomplete="off"></label>
    <label class="f"><span>Cuántos</span><input id="mf-n" type="number" inputmode="numeric" min="1" max="20" value="1"></label>
    <label class="f"><span>Iniciativa</span><input id="mf-init" type="number" inputmode="numeric" placeholder="Opcional"></label>
    <label class="f"><span>CA</span><input id="mf-ac" type="number" inputmode="numeric"></label>
    <label class="f"><span>PG</span><input id="mf-hp" type="number" inputmode="numeric"></label></div>
    <p class="hint">Si pones varios, se numeran solos (Goblin 1, Goblin 2…) y cada uno lleva sus PG.</p>
    <div class="btns"><button class="b pri" data-act="m-foe-add">Añadir</button><button class="b" data-act="close-modal">Cancelar</button></div>`);
  setTimeout(() => $('#mf-name') && $('#mf-name').focus(), 0);
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
async function openScan() {
  openModal(`<h2>Escanear QR</h2><div class="scanbox"><video id="scan-v" playsinline muted></video></div>
    <p class="hint" id="scan-msg">Apunta la cámara al QR del jugador.</p>
    <div class="btns"><button class="b" data-act="m-add">Volver</button></div>`);
  const msg = t => $('#scan-msg') && ($('#scan-msg').textContent = t);
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    msg('Este navegador no deja usar la cámara. Escanéalo con la cámara del móvil o pega el código.');
    return;
  }
  const me = (SCAN = { stop: false, stream: null });
  try {
    me.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
  } catch (e) {
    msg('No hay permiso para usar la cámara. Actívalo en el navegador o pega el código.');
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
      const x = sheetParse(txt);
      if (x) {
        scanStop();
        closeModal();
        const nw = masterAddPlayer(x);
        MST.tab = x.id;
        masterSave();
        render();
        toast(
          `<div class="t-label">${nw ? 'Jugador añadido' : 'Jugador actualizado'}</div><div class="t-big">${esc(x.n)}</div>`
        );
        return;
      }
      msg('Ese QR no es de Fichas 5e. Prueba con el de «Compartir con el máster».');
    }
    setTimeout(tick, 250);
  };
  tick();
}

/* Al abrir la app con un enlace #pj=… (el QR escaneado con la cámara del móvil) */
function masterHash() {
  const m = location.hash.match(/^#pj=([A-Za-z0-9_-]+)/);
  if (!m) return;
  history.replaceState(null, '', location.pathname + location.search);
  const x = sheetParse(m[1]);
  if (!x) return;
  if (MST.on) {
    const nw = masterAddPlayer(x);
    MST.tab = x.id;
    masterSave();
    render();
    toast(
      `<div class="t-label">${nw ? 'Jugador añadido' : 'Jugador actualizado'}</div><div class="t-big">${esc(x.n)}</div>`
    );
    return;
  }
  MHASH = x;
  openModal(`<h2>Ha llegado una ficha</h2><p>Son las características de <b>${esc(x.n)}</b>${x.c ? ` (${esc(x.c)})` : ''}, compartidas para el máster.</p>
    <p class="hint">Si eres el máster, se añade a tu mesa y la app pasa al modo máster (puedes volver al modo jugador desde ⚙ Ajustes).</p>
    <div class="btns"><button class="b pri" data-act="m-hash-ok">Añadir a mi mesa</button><button class="b" data-act="close-modal">Cancelar</button></div>`);
}
