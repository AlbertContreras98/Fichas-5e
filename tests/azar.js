/* Pruebas 2b y 2d: botones al azar sobre las fichas del reparto y las de los rincones (tests/fichas/rincones/, nivel 5
   con objetos, mapas, criaturas y formas), con semilla para poder repetir un fallo.
   Uso: node tests/azar.js [--semilla=N | --semillas=1,2,3] [--pasos=N] [--ficha=zyo] [--hilos=N] [--rastro] [--solo=azar|aparte] */
'use strict';

const fs = require('fs');
const path = require('path');
const b = require('./base');

const ARG = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const m = /^--([a-z]+)(?:=(.*))?$/.exec(a);
    return m ? [m[1], m[2] === undefined ? '1' : m[2]] : [a, '1'];
  })
);
const SEMILLAS = ARG.semilla
  ? [+ARG.semilla]
  : ARG.semillas
    ? ARG.semillas.split(',').map(Number)
    : [1, 2, 3, 4, 5];
/* Las fichas de los rincones son más grandes y cada tanda tarda más: sin --semilla(s), solo las 3 primeras semillas */
const SEMILLAS_RINCONES = ARG.semilla || ARG.semillas ? SEMILLAS : SEMILLAS.slice(0, 3);
const PASOS = +ARG.pasos || 400;
const HILOS = +ARG.hilos || 4;
const RASTRO = !!ARG.rastro;
/* Las del reparto y, desde la prueba 2d, las de los rincones (nivel 5, con objetos, mapas, criaturas y formas) */
const RINCONES = 'rincones/';
const FICHAS = [
  ...fs.readdirSync(b.FICHAS).sort(),
  ...fs
    .readdirSync(path.join(b.FICHAS, RINCONES))
    .sort()
    .map(f => RINCONES + f),
]
  .filter(f => f.endsWith('.json'))
  .filter(f => !ARG.ficha || nombreDe(f).startsWith(ARG.ficha));
function nombreDe(f) {
  return path.basename(f, '.json');
}

/* ---------- Azar con semilla ---------- */

function azar(semilla) {
  let s = semilla >>> 0;
  const r = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.n = n => Math.floor(r() * n);
  r.de = a => a[r.n(a.length)];
  return r;
}
const hash = t => [...t].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0, 7);

/* ---------- Fallos: se agrupan por tipo y se guarda cómo se llegó al primero ---------- */

const FALLOS = new Map();
/* Cuántas veces se ha pulsado cada data-act, y todos los que tiene la app */
const PULSADOS = new Map();
let ACTS = [];
const NOTAS = [];
/* Las notas que solo cambian en la ficha o en los números se dan una vez */
const CLAVES = new Set();
function nota(t) {
  const k = t
    .split('\n')[0]
    .replace(/\([^)]*\)/g, '')
    .replace(/\d+/g, '#')
    .slice(0, 90);
  if (CLAVES.has(k)) return;
  CLAVES.add(k);
  NOTAS.push(t);
}
function apunta(run, msg) {
  const firma = msg
    .replace(/«[^»]*»/g, '«…»')
    .replace(/"[^"]*"/g, '"…"')
    .replace(/-?\d+(\.\d+)?/g, '#')
    .slice(0, 160);
  const f = FALLOS.get(firma);
  if (f) {
    f.veces++;
    f.donde.add(run.nombre);
    return;
  }
  FALLOS.set(firma, {
    msg,
    veces: 1,
    donde: new Set([run.nombre]),
    paso: run.i,
    cola: run.cola.slice(-25),
  });
  console.log(`  ✗ ${run.nombre} · paso ${run.i}: ${msg.slice(0, 400)}`);
}

/* ---------- Lo que se inyecta en la página ---------- */

/* Azar de la app con semilla (ids), temporizadores largos a mano (avisos) y ayudas para elegir y pulsar */
function inyectado(semilla) {
  let n = 0;
  try {
    n = +(sessionStorage.getItem('__azn') || 0);
    sessionStorage.setItem('__azn', n + 1);
  } catch (e) {}
  let s = (semilla * 7919 + n * 104729 + 13) >>> 0;
  Math.random = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const st0 = window.setTimeout.bind(window),
    ct0 = window.clearTimeout.bind(window);
  const cola = [];
  let ahora = 0,
    idc = 1e9;
  window.setTimeout = (f, d, ...a) => {
    if (!(d >= 1000)) return st0(f, d, ...a);
    cola.push({ id: ++idc, f, a, at: ahora + d });
    return idc;
  };
  window.clearTimeout = id => {
    const i = cola.findIndex(x => x.id === id);
    if (i >= 0) cola.splice(i, 1);
    else ct0(id);
  };
  const vis = el => {
    if (el.disabled || el.closest('[hidden]')) return false;
    const r = el.getBoundingClientRect();
    return r.width > 2 && r.height > 2;
  };
  const desc = el => {
    const d = Object.entries(el.dataset)
      .filter(([k]) => k !== 'act')
      .map(([k, v]) => `${k}=${String(v).slice(0, 24)}`)
      .join(',');
    const t = (el.getAttribute('aria-label') || el.textContent || '')
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 30);
    return `${el.dataset.act}${d ? `{${d}}` : ''}${t ? ` «${t}»` : ''}`;
  };
  const AZ = (window.__az = {
    list: [],
    campos: [],
    tick(ms) {
      ahora += ms;
      for (const x of cola.filter(x => x.at <= ahora)) {
        cola.splice(cola.indexOf(x), 1);
        try {
          x.f(...x.a);
        } catch (e) {
          console.error('temporizador: ' + e);
        }
      }
    },
    /* Candidatos: si hay una ventana (u otra capa) abierta, solo lo que está encima */
    cands() {
      const modal = !document.getElementById('modal').hidden;
      let els = [...document.querySelectorAll('[data-act]')].filter(vis);
      const capa = els.filter(el => !el.closest('#top,#view'));
      const fuera = capa.filter(el => !el.closest('#modal,#toasts'));
      if (modal || fuera.length) els = capa;
      els = els.filter(el => !(el.tagName === 'A' && el.href && !el.getAttribute('href').startsWith('#')));
      AZ.list = els;
      return els.map(el => ({
        act: el.dataset.act,
        d: desc(el),
        id: el.dataset.id || '',
        k: `${el.dataset.act}:${el.dataset.t || el.dataset.m || el.dataset.kind || el.dataset.list || (/^(belt|hp-red)$/.test(el.dataset.act) ? el.dataset.k : '') || ''}`,
        aviso: !!el.closest('#toasts'),
        cierra: !!el.closest('#toasts') && el.dataset.act === 'close-toast',
      }));
    },
    /* Lleva el elemento a la vista y dice dónde pulsar, si de verdad se puede pulsar ahí */
    pos(i, sinPre) {
      const el = AZ.list[i];
      if (!el || !el.isConnected) return null;
      el.scrollIntoView({ block: 'center', inline: 'center' });
      const r = el.getBoundingClientRect();
      const x = r.left + r.width / 2,
        y = r.top + r.height / 2;
      const h = document.elementFromPoint(x, y);
      if (!h || (h !== el && !el.contains(h) && h.closest('[data-act]') !== el)) return null;
      if (!sinPre) AZ.pre();
      return { x, y };
    },
    /* Campos que se pueden rellenar ahora */
    fields() {
      const modal = !document.getElementById('modal').hidden;
      const raiz = modal ? document.getElementById('modal') : document.getElementById('view');
      const els = [...raiz.querySelectorAll('input,select,textarea')].filter(el => {
        if (el.disabled || el.readOnly || el.type === 'file' || el.type === 'hidden') return false;
        if (el.tagName === 'SELECT' && el.dataset.enh) return !el.closest('[hidden]:not(select)');
        return vis(el);
      });
      AZ.campos = els;
      return els.map(el => ({
        tag: el.tagName,
        type: el.type || '',
        num: el.type === 'number' || el.inputMode === 'numeric' || !!el.dataset.num,
        path: el.dataset.path || '',
        /* Campo de un conjuro del catálogo (al cargar, la app lo vuelve a poner como en el catálogo) */
        cat: (m => !!(m && C() && C().spells[+m[1]] && C().spells[+m[1]].ref && m[2] !== 'desc'))(
          /^spells\.(\d+)\.(\w+)$/.exec(el.dataset.path || '')
        ),
        id: el.id || '',
        name: el.name || '',
        opts: el.tagName === 'SELECT' ? [...el.options].filter(o => !o.disabled).map(o => o.value) : null,
        d:
          (el.id ? '#' + el.id : '') ||
          (el.dataset.path ? `[data-path="${el.dataset.path}"]` : '') ||
          (el.name ? `[name="${el.name}"]` : '') ||
          el.tagName.toLowerCase() +
            Object.entries(el.dataset)
              .map(([k, v]) => `[${k}=${v}]`)
              .join(''),
      }));
    },
    set(i, v) {
      const el = AZ.campos[i];
      if (!el || !el.isConnected) return false;
      if (el.type === 'checkbox' || el.type === 'radio') {
        el.click();
        return true;
      }
      const proto =
        el.tagName === 'SELECT'
          ? HTMLSelectElement.prototype
          : el.tagName === 'TEXTAREA'
            ? HTMLTextAreaElement.prototype
            : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      if (el.isConnected) el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    },
    pre() {
      AZ.b = JSON.stringify(S.chars);
      AZ.act = S.active;
    },
    post() {
      const a = JSON.stringify(S.chars);
      const txt = ['top', 'view', 'modal', 'toasts']
        .map(i => document.getElementById(i))
        .map(e => (e && !e.hidden ? e.innerText : ''))
        .join('\n');
      const raro = /(^|[^\wáéíóúñ])(NaN|undefined|Infinity|null)(?![\wáéíóúñ])|\[object Object\]/.exec(txt);
      return {
        cambia: a !== AZ.b,
        otra: S.active !== AZ.act,
        acts: Object.keys(A),
        nodos: document.getElementsByTagName('*').length,
        arriba: !!UNDO.length && UNDO[UNDO.length - 1].chars === AZ.b,
        nUndo: UNDO.length,
        modal: !document.getElementById('modal').hidden,
        tab: S.tab,
        n: S.chars.length,
        activo: S.active,
        ids: S.chars.map(c => c.id),
        hay: !!C(),
        master: typeof MST === 'object' && !!MST.on,
        raro: raro ? txt.slice(Math.max(0, raro.index - 50), raro.index + 40).replace(/\s+/g, ' ') : '',
      };
    },
    igualQueAntes: () => JSON.stringify(S.chars) === AZ.b && S.active === AZ.act,
  });
}

/* ---------- Valores para los campos ---------- */

const NUM_RAROS = ['', '0', '-1', '-7', '999999', '1000000000000', '0.5', '3.7'];
const TXT_NORMAL = ['Prueba', 'Espada corta', 'Cueva del norte', '2', '1d6+2', 'd8', 'Fuego'];
const TXT_RAROS = [
  '',
  '   ',
  '<img src=x onerror=alert(1)>',
  '"\'&<>`',
  'x'.repeat(400),
  '0',
  '-5',
  '💀 ñandú',
  '</textarea><b>',
];
/* Campos de «Editar ficha» que rompen las cuentas a propósito (se prueban aparte, con calma) */
const ESTRUCT = /^(hp\.|hitDice\.|slots\.|pact\.)|\.uses\.max$|\.qty$|^equipment\.\d+\.cat$/;
/* Campos de «Editar ficha» que dejan los espacios y los dados de golpe sin seguir al nivel (lo avisa la propia app) */
const A_MANO = /^(level|classKey|subclassKey)$/;

function valor(r, f) {
  if (f.opts) return r.de(f.opts.length ? f.opts : ['']);
  /* Un nivel de conjuro negativo o con decimales deja en blanco «Personaje» y «Combate» (apuntado en HALLAZGOS; se prueba aparte) */
  if (/^spells\.\d+\.level$/.test(f.path)) return String(r.n(10));
  if (f.path === 'level')
    return r() < 0.6 ? String(1 + r.n(20)) : r.de(['', '0', '-1', '-7', '21', '999999']);
  if (f.num) {
    if (r() < 0.55) return String(/^abilities\./.test(f.path) ? 3 + r.n(18) : 1 + r.n(20));
    return r.de(NUM_RAROS);
  }
  return r() < 0.55 ? r.de(TXT_NORMAL) : r.de(TXT_RAROS);
}

/* ---------- Qué se puede pulsar ---------- */

const NUNCA = new Set(['master-on', 'tour-replay']);
const PESO = {
  'close-modal': 0.3,
  'wz-cancel': 0.15,
  'ft-close': 0.3,
  'sp-close': 0.3,
  'd-close': 0.3,
  'money-close': 0.3,
  'map-close': 0.3,
  'item-cancel': 0.3,
  'crea-cancel': 0.3,
  'eff-cancel': 0.3,
  'cb-end': 0.2,
  'cb-end-ok': 0.3,
  theme: 0.2,
  'dl-exp': 0.2,
  'dl-all': 0.2,
  'qr-dl': 0.2,
  create: 0.3,
  newchar: 0.3,
  dup: 0.5,
  /* «Quitar» y «Añadir» de «Editar ficha»: pocos, para no dejar la ficha vacía enseguida */
  del: 0.08,
  add: 0.3,
  delchar: 0.5,
  undo: 0.6,
};
/* Prueba 2d: los botones de los rincones (objetos, mapas, criaturas, formas, reacciones y recursos) pesan más */
for (const a of [
  'pot',
  'scroll',
  'mi-ch',
  'mi-att',
  'gear',
  'belt',
  'map-view',
  'map-open',
  'map-zoom',
  'map-zone',
  'crea-transform',
  'crea-revert',
  'crea-hp',
  'crea-edit',
  'form-go',
  't-fatk',
  't-pcmd',
  't-mi',
  't-scroll',
  't-gear',
  't-feat',
  't-pool',
  'hp-red',
  'hp-red-ok',
  'sorc-rest',
  'res-d',
])
  PESO[a] = 3;
function peso(c, est, run) {
  if (NUNCA.has(c.act)) return 0;
  if (c.cierra) return 0.25;
  /* Lo que se ha pulsado poco en esta tanda pesa más, para llegar a los rincones (descansos, combate, criaturas…) */
  return peso0(c, est) * Math.max(0.25, 4 / (1 + (run.vistos.get(c.k) || 0))) * (c.aviso ? 3 : 1);
}
function peso0(c, est) {
  if (c.act === 'delchar-ok' && est.n <= 1) return 0;
  if ((c.act === 'dup' || c.act === 'newchar' || c.act === 'create') && est.n >= 3) return 0;
  return PESO[c.act] === undefined ? 1 : PESO[c.act];
}

/* ---------- Una tanda al azar ---------- */

async function preparar(nombre, semilla) {
  const ctx = await b.abrir();
  const { page } = ctx;
  await ctx.ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  await ctx.ctx.addInitScript(inyectado, semilla);
  const run = { nombre, i: 0, cola: [], manual: false, vistos: new Map() };
  ctx.ctx.on('page', p => {
    if (p === page) return;
    apunta(run, `se abre otra ventana o pestaña: ${p.url()}`);
    p.close().catch(() => {});
  });
  page.on('dialog', d => {
    apunta(run, `sale un diálogo del navegador (${d.type()}): ${d.message().slice(0, 100)}`);
    d.dismiss().catch(() => {});
  });
  await b.limpiar(page);
  return { ctx, page, run };
}

/* Comprobaciones tras cada paso */
const TABLA = /^(Espacios \[|Dados de golpe totales|Magia de pacto \d+×)/;
async function revisar(ctx, run, { ida = true, siempre = false, tick = 0 } = {}) {
  const { page, errores } = ctx;
  b.INF.pasos++;
  for (const e of errores.splice(0)) apunta(run, `consola: ${e.slice(0, 300)}`);
  if (!page.url().startsWith(b.URL)) {
    apunta(run, `la app se ha ido a otra dirección: ${page.url()}`);
    await page.goto(b.URL);
    await page.waitForFunction(() => typeof S === 'object' && typeof A === 'object');
  }
  let est;
  try {
    est = await page.evaluate(ms => {
      if (ms) __az.tick(ms);
      return __az.post();
    }, tick);
  } catch (e) {
    apunta(run, `el guion no puede leer la página: ${String(e.message).split('\n')[0]}`);
    return null;
  }
  if (est.acts.length > ACTS.length) ACTS = est.acts;
  if (est.raro) apunta(run, `texto raro en pantalla: …${est.raro}…`);
  if (est.master) {
    apunta(run, 'se ha entrado en el modo máster');
    await page.evaluate(() => A['master-off'] && A['master-off']());
  }
  if (!est.hay) return est;
  /* Si la ficha no ha cambiado desde la última vez, las cuentas son las mismas */
  if (!est.cambia && !est.otra && !siempre) return est;
  try {
    for (const p of await b.cuentas(page)) if (!(run.manual && TABLA.test(p))) apunta(run, p);
    if (ida) for (const d of await b.idaYVuelta(page)) apunta(run, `exportar→importar cambia ${d}`);
  } catch (e) {
    apunta(run, `las comprobaciones dan error: ${String(e.message).split('\n')[0].slice(0, 250)}`);
  }
  return est;
}

function log(run, t) {
  run.cola.push(`${run.i}. ${t}`);
  if (run.cola.length > 60) run.cola.shift();
  if (RASTRO) console.log(`    ${run.nombre} ${run.i}. ${t}`);
}

/* Pulsa un data-act al azar. Devuelve el candidato pulsado o null */
async function pulsar(page, run, r, est) {
  const cs = await page.evaluate(() => __az.cands());
  const pool = cs.map((c, i) => ({ c, i, w: peso(c, est, run) })).filter(x => x.w > 0);
  for (let v = 0; v < 12 && pool.length; v++) {
    let t = r() * pool.reduce((s, x) => s + x.w, 0),
      k = 0;
    while (k < pool.length - 1 && (t -= pool[k].w) > 0) k++;
    const [x] = pool.splice(k, 1);
    const p = await page.evaluate(i => __az.pos(i), x.i);
    if (!p) continue;
    log(run, `pulsar ${x.c.d}`);
    PULSADOS.set(x.c.act, (PULSADOS.get(x.c.act) || 0) + 1);
    run.vistos.set(x.c.k, (run.vistos.get(x.c.k) || 0) + 1);
    await page.mouse.click(p.x, p.y);
    return x.c;
  }
  return null;
}

/* Rellena campos de la ventana abierta (o de la pestaña, si no hay ventana) */
/* Imagen para los <input type="file"> (se hace una vez) */
let PNG = null;
/* Los <input type="file"> de imágenes que se pueden usar ahora (mapa nuevo, imagen de un mapa, retrato) */
const FICHEROS = ['ni-img', 'map-file', 'story-img'];
async function rellenar(page, run, r, est) {
  const fich = await page.evaluate(ids => {
    const modal = !document.getElementById('modal').hidden;
    return ids.filter(id => {
      const el = document.getElementById(id);
      if (!el || (modal && !el.closest('#modal'))) return false;
      const l = el.closest('label') || el;
      const q = l.getBoundingClientRect();
      return q.width > 2 && q.height > 2;
    });
  }, FICHEROS);
  if (fich.length && r() < 0.4) {
    const id = r.de(fich);
    PNG = PNG || (await b.imagenPNG(page));
    await page.evaluate(() => __az.pre());
    log(run, `elegir una imagen en #${id}`);
    await page.setInputFiles('#' + id, PNG);
    /* La app lee y reduce la imagen por su cuenta (FileReader e Image) */
    await page.waitForTimeout(150);
    return true;
  }
  const fs0 = await page.evaluate(() => __az.fields());
  let idx = fs0
    .map((f, i) => i)
    .filter(i => !ESTRUCT.test(fs0[i].path) && !fs0[i].cat && fs0[i].id !== 'exp-text');
  if (!run.aMano) idx = idx.filter(i => !A_MANO.test(fs0[i].path));
  if (!idx.length) return false;
  /* En «Editar ficha» hay cientos de campos: solo unos pocos cada vez, y con preferencia por características y nivel */
  let elegidos;
  if (!est.modal && est.tab === 'edit') {
    const pref = idx.filter(i => /^(abilities\.|level$)/.test(fs0[i].path));
    elegidos = [];
    for (let k = 0, n = 1 + r.n(3); k < n; k++)
      elegidos.push(r() < 0.5 && pref.length ? r.de(pref) : r.de(idx));
  } else elegidos = idx.filter(() => r() < 0.7);
  await page.evaluate(() => __az.pre());
  for (const i of elegidos) {
    const f = fs0[i],
      v = valor(r, f);
    const ok = await page.evaluate(([j, w]) => __az.set(j, w), [i, v]);
    if (!ok) break;
    if (A_MANO.test(f.path)) run.manual = true;
    log(
      run,
      `escribir en ${f.d} ${f.type === 'checkbox' || f.type === 'radio' ? '(marcar)' : JSON.stringify(v.length > 40 ? v.slice(0, 20) + `…(${v.length} letras)` : v)}`
    );
  }
  return true;
}

async function recarga(ctx, run, comprobada) {
  const { page } = ctx;
  if (comprobada) {
    await page.keyboard.press('Escape');
    await b.cerrarModal(page);
    /* Se pasa antes por «Personaje»: al pintarla, la app pone al día los usos calculados y el libro del mago */
    await b.actSi(page, 'tab', { t: 'play' });
    log(run, 'cerrar la ventana, ir a «Personaje» y recargar la página');
    try {
      for (const d of await b.recargar(page)) apunta(run, `al recargar cambia ${d}`);
    } catch (e) {
      apunta(run, `no se puede recargar: ${String(e.message).split('\n')[0]}`);
    }
  } else {
    log(run, 'recargar la página');
    await page.reload();
    await page.waitForFunction(() => typeof S === 'object' && typeof A === 'object' && !!window.__az);
  }
  await page.evaluate(() => __az.pre());
}

/* Exportar e importar con los botones de verdad: la ficha debe quedar igual */
async function exportarImportar(ctx, run) {
  const { page } = ctx;
  log(run, 'exportar (Ajustes → Copia de seguridad), borrar los datos e importar lo exportado');
  try {
    await page.keyboard.press('Escape');
    await b.cerrarModal(page);
    await b.actSi(page, 'tab', { t: 'play' });
    const antes = await b.ficha(page);
    const txt = await b.exportar(page);
    await b.limpiar(page);
    const desp = await b.importar(page, txt);
    /* Solo queda la ficha importada: pasa a ser la de la tanda */
    run.orig = desp.id;
    /* El libro del mago se completa solo con lo preparado al pintar la pestaña: no es un cambio de la importación */
    const d = b
      .difs(b.limpia(antes), b.limpia(desp))
      .filter(x => !x.startsWith('id:') && !/^book\.\d+: undefined → /.test(x));
    for (const x of d) apunta(run, `exportar e importar con los botones cambia ${x}`);
  } catch (e) {
    apunta(run, `no se puede exportar e importar con los botones: ${String(e.message).split('\n')[0]}`);
    await page.evaluate(() => typeof closeModal === 'function' && closeModal()).catch(() => {});
  }
  await page.evaluate(() => __az.pre());
}

async function tanda(archivo, semilla) {
  const json = b.leerFicha(archivo);
  const nombre = `${nombreDe(archivo)} semilla ${semilla}`;
  const { ctx, page, run } = await preparar(nombre, semilla);
  const r = azar(semilla * 1000003 + hash(archivo));
  /* Las semillas pares también cambian a mano el nivel, la clase y la subclase en «Editar ficha» */
  run.aMano = semilla % 2 === 0;
  run.rincon = archivo.startsWith(RINCONES);
  try {
    run.orig = (await b.importar(page, json)).id;
    await page.evaluate(() => __az.pre());
    let est = await revisar(ctx, run, { siempre: true });
    let enModal = 0,
      tope = 4 + r.n(14);
    for (run.i = 1; run.i <= PASOS; run.i++) {
      if (!est || !est.hay) {
        /* «Deshacer» justo después de importar deshace la importación: es así a propósito, pero se apunta */
        if (est && /pulsar undo/.test(run.cola[run.cola.length - 1] || ''))
          nota(
            '«Deshacer» después de importar (o crear) la única ficha la quita y la app vuelve a la pantalla de bienvenida.'
          );
        else apunta(run, 'la app se ha quedado sin ficha: se vuelve a importar');
        await b.limpiar(page);
        run.orig = (await b.importar(page, json)).id;
        est = await revisar(ctx, run, { siempre: true });
        continue;
      }
      /* Si se ha pasado a otra ficha (una vacía, una creada con el asistente…), al rato se vuelve a la de la tanda,
         para no gastar la mayor parte de los pasos en una ficha sin nada */
      run.fuera = est.activo !== run.orig ? (run.fuera || 0) + 1 : 0;
      if (run.fuera > 15 && !est.modal && est.ids.includes(run.orig)) {
        log(run, 'Personajes → volver a la ficha de la tanda');
        await page.evaluate(() => __az.pre());
        if (await b.actSi(page, 'chars')) await b.actSi(page, 'use', { id: run.orig });
        await b.cerrarModal(page);
        est = await revisar(ctx, run, { siempre: true });
        continue;
      }
      enModal = est.modal ? enModal + 1 : 0;
      const x = r();
      let clic = null;
      if (run.i % 150 === 0) await exportarImportar(ctx, run);
      else if (run.i % 40 === 0) await recarga(ctx, run, true);
      else if (run.rincon && run.i % 20 === 10 && !est.modal) {
        /* Fichas de los rincones: cada 20 pasos se entra por una de sus puertas (Criaturas, Objetos, el cinturón o
           Combate), porque entre tantos botones el azar llega poco */
        const k = r.n(4);
        await page.evaluate(() => __az.pre());
        /* Primero se cierra lo que haya abierto (el menú de descanso, un aviso…) */
        await page.keyboard.press('Escape');
        await b.cerrarToasts(page);
        const clic = async (n, d) => {
          const loc = page.locator(b.selAct(n, d)).filter({ visible: true }).first();
          if (!(await loc.count())) return false;
          await loc.click({ timeout: 3000 }).catch(() => log(run, `(no se puede pulsar ${n})`));
          return true;
        };
        if (k === 0) {
          log(run, 'ir a «Criaturas»');
          await clic('tab', { t: 'crea' });
        } else if (k === 1) {
          log(run, 'ir a «Combate»');
          await clic('tab', { t: 'combat' });
        } else if (k === 2) {
          log(run, 'abrir «Objetos»');
          await clic('inv');
        } else {
          const ks = await page.evaluate(() => beltData(C()).map(x => x[0]));
          if (ks.length) {
            const kk = r.de(ks);
            log(run, `abrir «Objetos» y el cinturón «${kk}»`);
            if (await clic('inv')) await clic('belt', { k: kk });
          }
        }
      } else if (x < 0.015) await recarga(ctx, run, false);
      else if (enModal > tope || x < 0.03) {
        log(run, 'tecla Escape');
        await page.evaluate(() => __az.pre());
        await page.keyboard.press('Escape');
        tope = 4 + r.n(14);
      } else if (x < 0.06 && est.modal) {
        log(run, 'pulsar fuera de la ventana');
        await page.evaluate(() => __az.pre());
        await page.mouse.click(3, 3);
      } else if (x < 0.05 && !est.modal && est.tab !== 'edit') {
        /* Ir a «Editar ficha» por el camino de verdad */
        log(run, 'Ajustes → Editar ficha');
        await page.evaluate(() => __az.pre());
        if (await b.actSi(page, 'settings')) await b.actSi(page, 'open-edit');
      } else if (x < (est.tab === 'edit' && !est.modal ? 0.5 : 0.28)) {
        if (!(await rellenar(page, run, r, est))) clic = await pulsar(page, run, r, est);
      } else clic = await pulsar(page, run, r, est);

      est = await revisar(ctx, run, { tick: 400, siempre: run.i % 40 === 0 || run.i % 150 === 0 });
      if (!est) continue;
      /* Deshacer: un clic que cambia la ficha deja el estado anterior arriba de la pila… */
      if (clic && clic.act !== 'undo' && est.cambia && !est.arriba)
        apunta(run, `«${clic.act}» cambia la ficha y «Deshacer» no guarda el estado anterior`);
      /* …y de vez en cuando se comprueba que de verdad vuelve */
      if (clic && clic.act !== 'undo' && est.cambia && est.arriba && !est.modal && r() < 0.2) {
        const p = await page.evaluate(() => {
          __az.cands();
          const i = __az.list.findIndex(el => el.dataset.act === 'undo');
          return i < 0 ? null : __az.pos(i, true);
        });
        if (p) {
          log(run, 'pulsar undo (comprobación)');
          await page.mouse.click(p.x, p.y);
          const v = await page.evaluate(() =>
            __az.igualQueAntes() ? null : { a: JSON.parse(__az.b), z: JSON.parse(JSON.stringify(S.chars)) }
          );
          /* «Deshacer» pone el estado anterior y repinta: si no queda igual es que pintar la pantalla completa la ficha
             (usos calculados, libro del mago…). Se apunta como nota; si cambia la ficha en uso, como fallo */
          if (v) {
            const d = b.difs(v.a, v.z).slice(0, 4);
            if (!d.length) apunta(run, `«Deshacer» tras «${clic.act}» cambia la ficha en uso`);
            else
              for (const x of d)
                nota(
                  `Al deshacer, la ficha no queda idéntica porque la app completa datos al pintar: ${x.replace(/\d+/g, 'N').slice(0, 120)}`
                );
          }
          await page.evaluate(() => __az.pre());
          est = (await revisar(ctx, run, { siempre: true })) || est;
        }
      }
    }
    run.i = PASOS + 1;
    await exportarImportar(ctx, run);
    await revisar(ctx, run, { siempre: true });
  } catch (e) {
    apunta(run, `el guion se ha parado: ${String(e.stack || e).slice(0, 400)}`);
  } finally {
    await ctx.browser.close();
  }
}

/* ---------- Casos aparte (sin azar): «Editar ficha», dotes, invocaciones y borrar personaje ---------- */

/* Escribe en un campo de «Editar ficha» como lo haría el teclado (input + change) */
async function campo(page, path, v) {
  return page.evaluate(
    ([p, w]) => {
      const el = document.querySelector(`[data-path="${p}"]`);
      if (!el) return false;
      const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, w);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    },
    [path, String(v)]
  );
}
async function abrirEditar(page) {
  await b.cerrarModal(page);
  if (await page.evaluate(() => S.tab === 'edit')) return;
  await b.act(page, 'settings');
  await b.act(page, 'open-edit');
}
/* Pasa por todas las pestañas y devuelve lo raro que se vea */
async function pasear(ctx, run) {
  const { page } = ctx;
  await b.cerrarModal(page);
  const tabs = await page.evaluate(() => [
    ...new Set([...document.querySelectorAll('#top [data-act="tab"]')].map(e => e.dataset.t)),
  ]);
  for (const t of tabs) {
    if (!(await b.actSi(page, 'tab', { t }))) continue;
    await page.evaluate(() => __az.pre());
    await revisar(ctx, run, { ida: false, siempre: true });
  }
  if (await b.actSi(page, 'vida')) await revisar(ctx, run, { ida: false, siempre: true });
  await b.cerrarModal(page);
}

async function aparteEditar(ctx, run, json) {
  const { page } = ctx;
  const P = t => {
    run.i++;
    log(run, t);
  };
  let c = await b.ficha(page);
  const L = c.level,
    con = c.abilities.con,
    max = c.hp.max;

  /* CON +2 y «Ajustar los PG» */
  P(`Editar ficha: CON ${con} → ${con + 2} y «Ajustar los PG»`);
  await abrirEditar(page);
  await campo(page, 'abilities.con', con + 2);
  if (!(await b.actSi(page, 'con-hp')))
    apunta(run, 'al subir la CON 2 puntos no sale el aviso con «Ajustar los PG»');
  c = await b.ficha(page);
  if (c.hp.max !== max + L)
    apunta(run, `CON +2 y «Ajustar los PG»: PG máximos ${max} → ${c.hp.max} (debería ser ${max + L})`);
  else b.sola('Al cambiar la CON en «Editar ficha» ofrece ajustar los PG (1 por nivel)');
  await page.evaluate(() => __az.pre());
  await revisar(ctx, run, { siempre: true });
  /* Vuelta atrás, también con el aviso */
  P(`Editar ficha: CON ${con + 2} → ${con} y «Ajustar los PG»`);
  await b.cerrarToasts(page);
  await campo(page, 'abilities.con', con);
  await b.actSi(page, 'con-hp');
  c = await b.ficha(page);
  if (c.hp.max !== max)
    apunta(run, `CON de vuelta y «Ajustar los PG»: PG máximos ${c.hp.max} (deberían volver a ${max})`);
  /* CON rara: vacía, 0, negativa y enorme, ajustando los PG cada vez */
  for (const v of ['', '0', '-5', '999999', con]) {
    P(`Editar ficha: CON = ${JSON.stringify(v)} y «Ajustar los PG» si lo ofrece`);
    await b.cerrarToasts(page);
    await campo(page, 'abilities.con', v);
    await b.actSi(page, 'con-hp');
    await page.evaluate(() => __az.pre());
    await revisar(ctx, run, { siempre: true });
  }
  await b.cerrarToasts(page);

  /* Nivel a mano */
  await b.limpiar(page);
  await b.importar(page, json);
  const L2 = Math.min(20, L + 4);
  P(`Editar ficha: nivel ${L} → ${L2} a mano`);
  await abrirEditar(page);
  await campo(page, 'level', L2);
  const d = await page.evaluate(() => ({ c: JSON.parse(JSON.stringify(C())), pb: pb(C()) }));
  const tabla = (await b.cuentas(page)).filter(p => TABLA.test(p));
  if (d.c.level !== L2) apunta(run, `nivel a mano: se queda en ${d.c.level}`);
  if (tabla.length)
    nota(
      `Nivel a mano en «Editar ficha» (${run.nombre}, ${L} → ${L2}): la competencia sube sola a +${d.pb}, pero no cambian ${tabla
        .map(t => t.split(/ \[| \d/)[0].toLowerCase())
        .filter((x, i, a) => a.indexOf(x) === i)
        .join(', ')}; PG máximos ${d.c.hp.max} (igual que antes). La app lo avisa en la propia pantalla.`
    );
  run.manual = true;
  await page.evaluate(() => __az.pre());
  await revisar(ctx, run, { siempre: true });
  await pasear(ctx, run);
  for (const v of ['', '0', '-3', '21', '999999', '2.5']) {
    P(`Editar ficha: nivel = ${JSON.stringify(v)}`);
    await abrirEditar(page);
    await campo(page, 'level', v);
    const lv = await page.evaluate(() => C().level);
    if (!(Number.isInteger(lv) && lv >= 1 && lv <= 20)) {
      apunta(run, `nivel = ${JSON.stringify(v)} en «Editar ficha» deja el nivel en ${lv}`);
      /* Las tablas del guion no tienen niveles con decimales: solo se mira que la app no dé errores */
      await pasearSinCuentas(ctx, run);
      continue;
    }
    await page.evaluate(() => __az.pre());
    await revisar(ctx, run, { siempre: true });
    await pasear(ctx, run);
  }
  run.manual = false;

  /* Valores raros en los demás campos numéricos: qué acepta la app y si algo se rompe al pintar */
  await b.limpiar(page);
  await b.importar(page, json);
  const orig = await b.ficha(page);
  await abrirEditar(page);
  const paths = await page.evaluate(() =>
    [...document.querySelectorAll('#view [data-path][data-num]')]
      .map(e => e.dataset.path)
      .filter(
        p =>
          p !== 'level' &&
          !/^(skills|spells\.[1-9]|features\.[1-9]|equipment\.[1-9]|attacks\.[1-9]|slots\.[1-8])/.test(p)
      )
  );
  const acepta = {};
  for (const p of paths) {
    /* Los campos que se pintan con una casilla por unidad cuelgan la app con 999999 (apuntado en HALLAZGOS): aquí, 3000 */
    const casillas = /(total|uses\.max)$/.test(p);
    const vs = /^abilities\.(?!str)/.test(p) ? ['999999'] : ['-5', casillas ? '3000' : '999999'];
    if (ESTRUCT.test(p)) vs.unshift('');
    if (/^(hp\.max|hitDice\.total|abilities\.str|spells\.0\.level)$/.test(p)) vs.push('2.5');
    for (const v of vs) {
      P(`Editar ficha: ${p} = ${JSON.stringify(v)}`);
      await abrirEditar(page);
      if (!(await campo(page, p, v))) continue;
      await b.cerrarToasts(page);
      const prob = await b.cuentas(page).catch(e => [`error: ${e.message}`]);
      if (prob.length) (acepta[p] = acepta[p] || []).push(`${JSON.stringify(v)} → ${prob[0]}`);
      /* Solo interesan aquí los errores y lo raro en pantalla: las cuentas se apuntan en una nota */
      await page.evaluate(() => __az.pre());
      const nodos = await pasearSinCuentas(ctx, run, /^(hp\.|hitDice\.)/.test(p));
      if (casillas && v === '3000' && nodos > 3000)
        nota(
          `«Editar ficha»: ${p} = 3000 pinta una casilla por cada uno (${nodos} elementos en pantalla); con 999999 la app se queda colgada.`
        );
    }
    await b.limpiar(page);
    await b.importar(page, json);
  }
  const lista = Object.entries(acepta);
  if (lista.length)
    nota(
      `«Editar ficha» acepta sin avisar valores que dejan la ficha fuera de rango (${run.nombre}):\n` +
        lista.map(([p, l]) => `      - ${p}: ${l.join(' | ')}`).join('\n')
    );
  /* Cambios de «Editar ficha» que no sobreviven a una recarga */
  const iRef = orig.spells.findIndex(x => x.ref && x.level > 0);
  if (iRef >= 0) {
    const sp = orig.spells[iRef];
    P(
      `Editar ficha: conjuro del catálogo «${sp.name}»: nivel 7, alcance vacío, material «Prueba», cambiar concentración y ritual; recargar`
    );
    await abrirEditar(page);
    await campo(page, `spells.${iRef}.level`, 7);
    await campo(page, `spells.${iRef}.range`, '');
    await campo(page, `spells.${iRef}.material`, 'Prueba');
    for (const k of ['conc', 'ritual']) await page.locator(`[data-path="spells.${iRef}.${k}"]`).click();
    const cambios = await b.recargar(page);
    if (cambios.length)
      nota(
        `«Editar ficha» deja cambiar los datos de un conjuro del catálogo, pero al recargar vuelven a ser los del catálogo (${run.nombre}, «${sp.name}»): ${cambios.join('; ')}`
      );
    await b.limpiar(page);
    await b.importar(page, json);
  }
  const iObj = orig.equipment.findIndex(x => x.cat !== 'arma' && x.equipped === undefined);
  if (iObj >= 0) {
    P(`Editar ficha: tipo del objeto «${orig.equipment[iObj].name}» = arma; recargar`);
    await abrirEditar(page);
    await campo(page, `equipment.${iObj}.cat`, 'arma');
    const cambios = await b.recargar(page);
    if (cambios.length)
      nota(
        `«Editar ficha»: al cambiar el tipo de un objeto a «arma», la ficha cambia sola al recargar (${run.nombre}): ${cambios.join('; ')}`
      );
    await b.limpiar(page);
    await b.importar(page, json);
  }
  const fin = await b.ficha(page);
  const dd = b.difs(b.limpia(orig), b.limpia(fin)).filter(x => !x.startsWith('id:'));
  if (dd.length) apunta(run, `reimportar la ficha no la deja como al principio: ${dd.join('; ')}`);
}
/* Como pasear(), pero sin las cuentas (para los valores que las rompen a propósito) */
async function pasearSinCuentas(ctx, run, descansos = true) {
  const { page, errores } = ctx;
  const tabs = await page.evaluate(() => [
    ...new Set([...document.querySelectorAll('#top [data-act="tab"]')].map(e => e.dataset.t)),
  ]);
  const mira = async donde => {
    b.INF.pasos++;
    for (const e of errores.splice(0)) apunta(run, `consola (${donde}): ${e.slice(0, 300)}`);
    const est = await page.evaluate(() => __az.post());
    nodos = Math.max(nodos, est.nodos);
    if (est.raro) apunta(run, `texto raro en pantalla (${donde}): …${est.raro}…`);
  };
  let nodos = 0;
  await mira('Editar ficha');
  for (const t of tabs) if (await b.actSi(page, 'tab', { t })) await mira(`pestaña ${t}`);
  if (await b.actSi(page, 'vida')) await mira('Vida y estado');
  await b.cerrarModal(page);
  for (const a of descansos ? ['short', 'long'] : []) {
    await b.actSi(page, 'rest-menu');
    if (await b.actSi(page, a)) await mira(`descanso ${a}`);
    await b.cerrarModal(page);
  }
  return nodos;
}

/* Dotes fuera del asistente: añadir cada una que se pueda y quitarla; la ficha debe quedar como estaba */
async function aparteDotes(ctx, run) {
  const { page } = ctx;
  await b.cerrarModal(page);
  await b.act(page, 'tab', { t: 'play' });
  const abrir = async () => {
    await b.cerrarModal(page);
    await b.act(page, 'ft-open');
  };
  await abrir();
  const ks = await page.evaluate(() =>
    [...document.querySelectorAll('select[data-fs="k"] option')]
      .filter(o => o.value && !o.disabled)
      .map(o => o.value)
  );
  let hechas = 0;
  for (const k of ks) {
    run.i++;
    log(run, `Dotes: añadir «${k}» (primeras opciones que ofrece) y quitarla`);
    await abrir();
    const antes = await b.ficha(page);
    await b.elegir(page, 'select[data-fs="k"]', k);
    for (let v = 0; v < 14; v++) {
      const falta = await page.evaluate(() => {
        const s = [...document.querySelectorAll('#ft-body select[data-fs]')].find(
          x => x.dataset.fs !== 'k' && !x.value
        );
        if (s) {
          const o = [...s.options].find(x => x.value && !x.disabled);
          if (!o) return 'sin opciones';
          s.value = o.value;
          s.dispatchEvent(new Event('change', { bubbles: true }));
          return 'otra';
        }
        const t = document.querySelector('#fs-opt');
        if (t && !t.value) {
          t.value = 'Prueba';
          t.dispatchEvent(new Event('input', { bubbles: true }));
          return 'otra';
        }
        return '';
      });
      if (falta !== 'otra') break;
    }
    if (!(await page.locator('[data-act="ft-add"]').isEnabled())) {
      const why = await page.evaluate(
        () => (document.querySelector('#ft-body .hint.warn') || {}).textContent || ''
      );
      nota(`Dotes: «${k}» no se puede añadir con las primeras opciones (${run.nombre}): ${why}`);
      continue;
    }
    await page.evaluate(() => __az.pre());
    await b.act(page, 'ft-add');
    hechas++;
    let est = await revisar(ctx, run, { siempre: true });
    if (est && !est.arriba) apunta(run, `añadir la dote «${k}» no se puede deshacer`);
    const i = await page.evaluate(kk => {
      const o = ftOwned(C());
      for (let j = o.length - 1; j >= 0; j--) if (o[j].k === kk && o[j].rec) return j;
      return -1;
    }, k);
    if (i < 0) {
      apunta(run, `la dote «${k}» añadida no sale en «Tus dotes»`);
      continue;
    }
    await page.evaluate(() => __az.pre());
    await b.act(page, 'ft-del', { i });
    est = await revisar(ctx, run, { siempre: true });
    const desp = await b.ficha(page);
    const d = b.difs(b.limpia(antes), b.limpia(desp));
    if (d.length)
      apunta(run, `añadir y quitar la dote «${k}» no deja la ficha igual: ${d.slice(0, 4).join('; ')}`);
    if (hechas % 12 === 0) {
      await b.act(page, 'ft-close');
      for (const x of await b.recargar(page)) apunta(run, `al recargar tras las dotes cambia ${x}`);
    }
  }
  await b.cerrarModal(page);
  return hechas;
}

/* Invocaciones fuera del asistente (brujo): añadir cada una que se pueda, guardar, quitarla y guardar */
async function aparteInvoc(ctx, run) {
  const { page } = ctx;
  await b.cerrarModal(page);
  await b.act(page, 'tab', { t: 'play' });
  if (!(await page.locator('[data-act="iv-open"]').count())) return 0;
  const guardar = async () => {
    if (!(await page.locator('[data-act="iv-save"]').isEnabled())) return false;
    await page.evaluate(() => __az.pre());
    await b.act(page, 'iv-save');
    /* «Lecciones de los Primeros» pregunta después por su dote: «Ahora no» */
    await b.cerrarModal(page);
    return true;
  };
  const orig = await b.ficha(page);
  /* Se deja sitio quitando la primera que tenga */
  await b.act(page, 'iv-open');
  const tenia = await page.locator('[data-act="iv-del"]').count();
  if (tenia) {
    run.i++;
    log(run, 'Invocaciones: quitar la primera y guardar');
    await b.act(page, 'iv-del', { i: 0 });
    await guardar();
    await revisar(ctx, run, { siempre: true });
  } else await b.cerrarModal(page);
  const base = await b.ficha(page);
  await b.act(page, 'iv-open');
  const ids = await page.evaluate(() =>
    [...document.querySelectorAll('[data-act="iv-add"]')].filter(e => !e.disabled).map(e => e.dataset.id)
  );
  await b.cerrarModal(page);
  let hechas = 0;
  for (const id of ids) {
    run.i++;
    log(run, `Invocaciones: añadir «${id}», guardar, quitarla y guardar`);
    await b.act(page, 'iv-open');
    const n0 = await page.locator('[data-act="iv-del"]').count();
    if (!(await b.actSi(page, 'iv-add', { id }))) {
      await b.cerrarModal(page);
      continue;
    }
    await page.evaluate(() => {
      for (const s of document.querySelectorAll('#iv-body select[data-iv-pick]')) {
        if (s.value) continue;
        const o = [...s.options].find(x => x.value && !x.disabled);
        if (o) {
          s.value = o.value;
          s.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    });
    if (!(await guardar())) {
      const why = await page.evaluate(
        () => (document.querySelector('#iv-body .hint.warn') || {}).textContent || ''
      );
      nota(`Invocaciones: «${id}» se puede elegir pero no guardar (${run.nombre}): ${why}`);
      await b.cerrarModal(page);
      continue;
    }
    hechas++;
    const est = await revisar(ctx, run, { siempre: true });
    if (est && est.cambia && !est.arriba) apunta(run, `guardar la invocación «${id}» no se puede deshacer`);
    await pasear(ctx, run);
    await b.act(page, 'tab', { t: 'play' });
    await b.act(page, 'iv-open');
    const n1 = await page.locator('[data-act="iv-del"]').count();
    if (n1 !== n0 + 1) apunta(run, `tras guardar «${id}» la ventana enseña ${n1} invocaciones (había ${n0})`);
    else {
      await b.act(page, 'iv-del', { i: n1 - 1 });
      await guardar();
    }
    await b.cerrarModal(page);
    await revisar(ctx, run, { siempre: true });
    const desp = await b.ficha(page);
    const d = b.difs(b.limpia(base), b.limpia(desp));
    if (d.length) {
      apunta(
        run,
        `añadir y quitar la invocación «${id}» no deja la ficha igual: ${d.slice(0, 4).join('; ')}`
      );
      /* Se parte otra vez de la ficha limpia para no arrastrar el cambio */
      await page.evaluate(x => {
        S.chars = S.chars.map(c => (c.id === x.id ? x : c));
        save();
        render();
      }, base);
    }
  }
  /* Volver a poner la que tenía */
  if (tenia) {
    const suya = await page.evaluate(o => ivFromChar(o).map(e => e.id)[0], orig);
    run.i++;
    log(run, `Invocaciones: volver a elegir «${suya}» y guardar`);
    await b.act(page, 'iv-open');
    if (await b.actSi(page, 'iv-add', { id: suya })) {
      await guardar();
      const desp = await b.ficha(page);
      /* El rasgo vuelve al final de la lista: se compara sin mirar el orden */
      const ord = c => {
        const x = b.limpia(c);
        x.features.sort((p, q) => p.name.localeCompare(q.name));
        x.features.forEach(f => delete f.id);
        return x;
      };
      const d = b.difs(ord(orig), ord(desp));
      if (d.length)
        apunta(
          run,
          `quitar y volver a elegir la invocación «${suya}» no deja la ficha igual: ${d.slice(0, 5).join('; ')}`
        );
    }
    await b.cerrarModal(page);
  }
  return hechas;
}

/* Duplicar y borrar la copia: la original no cambia, y «Deshacer» recupera la borrada */
async function aparteBorrar(ctx, run) {
  const { page } = ctx;
  await b.cerrarModal(page);
  const antes = await b.estado(page);
  run.i++;
  log(run, 'Personajes → ⋯ → Duplicar; ⋯ de la copia → Borrar → Borrar');
  await b.act(page, 'chars');
  await b.act(page, 'char-menu', { id: antes.c.id });
  await b.act(page, 'dup', { id: antes.c.id });
  const copia = await page.evaluate(() => S.chars[S.chars.length - 1].id);
  await b.act(page, 'char-menu', { id: copia });
  await b.act(page, 'delchar', { id: copia });
  await b.act(page, 'delchar-ok', { id: copia });
  await b.cerrarModal(page);
  const desp = await b.estado(page);
  if (desp.S.chars.length !== antes.S.chars.length || desp.S.active !== antes.S.active)
    apunta(run, 'duplicar y borrar la copia no deja la lista de personajes como estaba');
  const d = b.difs(b.limpia(antes.c), b.limpia(desp.c));
  if (d.length) apunta(run, `duplicar y borrar la copia cambia la ficha original: ${d.join('; ')}`);
  /* Borrar la ficha en uso teniendo dos: debe quedar la otra, sin errores */
  run.i++;
  log(run, 'Duplicar y borrar la ficha en uso; después «Deshacer»');
  await b.act(page, 'chars');
  await b.act(page, 'char-menu', { id: antes.c.id });
  await b.act(page, 'dup', { id: antes.c.id });
  await b.act(page, 'char-menu', { id: antes.c.id });
  await b.act(page, 'delchar', { id: antes.c.id });
  await page.evaluate(() => __az.pre());
  await b.act(page, 'delchar-ok', { id: antes.c.id });
  await b.cerrarModal(page);
  let est = await revisar(ctx, run, { siempre: true });
  if (!est || !est.hay) apunta(run, 'al borrar la ficha en uso habiendo otra, la app se queda sin ficha');
  if (await b.actSi(page, 'undo')) {
    const v = await page.evaluate(id => S.chars.some(x => x.id === id), antes.c.id);
    if (!v) apunta(run, '«Deshacer» tras borrar un personaje no lo recupera');
    else
      nota(
        'Borrar un personaje dice «No se puede deshacer», pero el botón «Deshacer» sí lo recupera (mientras no se recargue).'
      );
  } else nota('Tras borrar un personaje no hay botón «Deshacer» a la vista.');
  est = await revisar(ctx, run, { siempre: true });
}

/* Rincones (prueba 2d): reacciones que restan daño, formas, concentración, pociones, pergaminos y cargas, con números conocidos */
async function aparteRincones(ctx, run) {
  const { page } = ctx;
  const P = t => {
    run.i++;
    log(run, t);
  };
  const c0 = await b.ficha(page);
  const tiene = n => c0.features.some(f => f.name === n);
  const pg = () => page.evaluate(() => ({ cur: C().hp.current, temp: C().hp.temp, max: C().hp.max }));
  const uso = n => page.evaluate(k => (C().features.find(f => f.name === k) || { uses: {} }).uses.used, n);
  const sinAvisos = () => page.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove()));
  /* Escribe el daño en «Vida y estado» y pulsa «Daño» o una reacción */
  const dano = async (n, k) => {
    await b.cerrarModal(page);
    await sinAvisos();
    await b.act(page, 'vida');
    await b.escribir(page, '#hpAmt', n);
    if (k) await b.act(page, 'hp-red', { k });
    else await b.act(page, 'hp', { m: 'dmg' });
  };
  const curar = async () => {
    await b.cerrarModal(page);
    await page.evaluate(() => __az.pre());
    await b.act(page, 'vida');
    await b.escribir(page, '#hpAmt', 999);
    await b.act(page, 'hp', { m: 'heal' });
    await b.cerrarModal(page);
    await sinAvisos();
  };
  const mira = async () => {
    await page.evaluate(() => __az.pre());
    await revisar(ctx, run, { siempre: true });
  };
  const con = await page.evaluate(() => M(C(), 'con'));
  /* «Reacción: Gastada ↺» de la pestaña Combate */
  const liberar = async (k = 'r') => {
    await b.cerrarModal(page);
    await sinAvisos();
    await b.act(page, 'tab', { t: 'combat' });
    await b.actSi(page, 't-reset', { k });
  };

  /* Esquiva asombrosa: la mitad del daño, redondeando hacia abajo */
  if (tiene('Esquiva asombrosa')) {
    P('Vida: 21 de daño y «Esquiva asombrosa»');
    const a = await pg();
    await dano(21, 'uncanny');
    const d = await pg();
    if (a.cur - d.cur !== 10)
      apunta(run, `Esquiva asombrosa con 21 de daño quita ${a.cur - d.cur} PG (debería quitar 10)`);
    else b.sola('Esquiva asombrosa: recibes la mitad del daño, redondeando hacia abajo');
    await mira();
    await curar();
    /* Fuera de combate no hay turnos: ¿cuándo vuelve la reacción? */
    P('Fuera de combate, tras la reacción: ¿vuelve con un descanso largo?');
    await b.act(page, 'rest-menu');
    await b.act(page, 'long');
    await b.act(page, 'long-done');
    await b.cerrarModal(page);
    await sinAvisos();
    if (await page.evaluate(() => !!(C().turn && C().turn.r)))
      apunta(
        run,
        'fuera de combate, tras usar una reacción que resta daño, la reacción queda «ya gastada» y no vuelve ni con un descanso largo ni al recargar (solo con el ↺ de «Reacción» en Combate)'
      );
    await liberar();
  }
  /* Aguante de piedra: 1d12 + CON, con usos */
  if (tiene('Aguante de piedra')) {
    const usos = await page.evaluate(() => C().features.find(f => f.name === 'Aguante de piedra').uses);
    P(
      `Vida: 20 de daño y «Aguante de piedra» con un 13 en el d12 (no vale) y luego un 5 (CON ${con >= 0 ? '+' : ''}${con})`
    );
    const a = await pg();
    await dano(20, 'stone');
    await b.escribir(page, '#red-r', 13);
    await b.act(page, 'hp-red-ok');
    if ((await pg()).cur !== a.cur) apunta(run, 'Aguante de piedra acepta un 13 en el d12');
    await b.escribir(page, '#red-r', 5);
    await b.act(page, 'hp-red-ok');
    const d = await pg();
    const want = Math.max(0, 20 - 5 - con);
    if (a.cur - d.cur !== want)
      apunta(
        run,
        `Aguante de piedra (20 de daño, 5 en el d12, CON ${con}) quita ${a.cur - d.cur} PG (deberían ser ${want})`
      );
    else b.sola('Aguante de piedra: resta 1d12 + CON del daño y gasta un uso');
    if ((await uso('Aguante de piedra')) !== usos.used + 1) apunta(run, 'Aguante de piedra no gasta un uso');
    await mira();
    /* Hasta gastar todos los usos: después, el botón no se puede pulsar */
    for (let k = usos.used + 1; k < usos.max; k++) {
      await liberar();
      await dano(3, 'stone');
      await b.escribir(page, '#red-r', 12);
      await b.act(page, 'hp-red-ok');
    }
    await liberar();
    await b.cerrarModal(page);
    await b.act(page, 'vida');
    const on = await page.locator('[data-act="hp-red"][data-k="stone"]').isEnabled();
    if (on) apunta(run, `Aguante de piedra se puede pulsar sin usos (${usos.max} de ${usos.max} gastados)`);
    await curar();
    await liberar();
  }
  /* En combate, una sola reacción por ronda: después de una, las demás se apagan hasta tu turno */
  if (tiene('Esquiva asombrosa') && tiene('Aguante de piedra')) {
    P('Combate: «Esquiva asombrosa» y después mirar si «Aguante de piedra» sigue disponible');
    await b.cerrarModal(page);
    await b.act(page, 'tab', { t: 'combat' });
    await b.act(page, 'cb-start');
    await dano(10, 'uncanny');
    await b.cerrarModal(page);
    await b.act(page, 'vida');
    if (await page.locator('[data-act="hp-red"][data-k="stone"]').isEnabled())
      apunta(
        run,
        'en combate, tras usar Esquiva asombrosa, Aguante de piedra sigue disponible en la misma ronda'
      );
    await mira();
    await b.cerrarModal(page);
    await b.act(page, 'cb-end');
    await b.act(page, 'cb-end-ok');
    await curar();
  }

  /* Puntos de hechicería y Restauración hechicera (la mitad del nivel, hacia abajo) */
  if (tiene('Restauración hechicera')) {
    P('Gastar 4 puntos de hechicería y usar «Restauración hechicera»');
    await b.cerrarModal(page);
    await b.act(page, 'tab', { t: 'play' });
    const i = await page.evaluate(() => C().features.findIndex(f => f.name === 'Puntos de hechicería'));
    for (let k = 0; k < 4; k++) {
      const loc = page.locator(`[data-act="pip"][data-kind="feat"][data-a="${i}"].full`).first();
      if (await loc.count()) await loc.click();
    }
    const antes = await uso('Puntos de hechicería');
    await b.act(page, 'sorc-rest');
    const desp = await uso('Puntos de hechicería');
    const L = c0.level;
    if (antes - desp !== Math.min(Math.floor(L / 2), antes))
      apunta(
        run,
        `Restauración hechicera a nivel ${L} con ${antes} puntos gastados devuelve ${antes - desp} (deberían ser ${Math.min(Math.floor(L / 2), antes)})`
      );
    else b.sola('Restauración hechicera devuelve la mitad del nivel en puntos de hechicería');
    await mira();
  }

  /* Formas: Forma salvaje del Círculo de la Luna (PG temporales = 3 × nivel de druida) y Polimorfar */
  const formas = c0.companions.filter(x => x.kind === 'form');
  const salvaje = formas.find(x => x.via === 'wild');
  if (salvaje) {
    P(`Criaturas: transformarse en «${salvaje.name}» con Forma salvaje y recibir 20 de daño`);
    const ws = await page.evaluate(() => wsInfo(C()));
    const u0 = await uso('Forma salvaje');
    await b.cerrarModal(page);
    await b.act(page, 'tab', { t: 'crea' });
    await b.act(page, 'crea-transform', { id: salvaje.id });
    const a = await pg();
    const want = c0.subclassKey === 'moon' ? 3 * c0.level : c0.level;
    if (a.temp !== want)
      apunta(
        run,
        `Forma salvaje (${c0.subclass}, nivel ${c0.level}) da ${a.temp} PG temporales (deberían ser ${want})`
      );
    if ((await uso('Forma salvaje')) !== u0 + 1)
      apunta(run, 'transformarse con Forma salvaje no gasta un uso');
    const ef = await page.evaluate(() => C().effects.find(e => e.form));
    if (!ef || ef.m !== 60 * Math.floor(c0.level / 2))
      apunta(
        run,
        `el efecto de Forma salvaje dura ${ef ? ef.m + ' min' : '(no hay efecto)'} (debería durar ${Math.floor(c0.level / 2)} h)`
      );
    const conc = await page.evaluate(() => C().concentration);
    await dano(20);
    const d = await pg();
    if (d.temp !== Math.max(0, a.temp - 20) || d.cur !== a.cur - Math.max(0, 20 - a.temp))
      apunta(
        run,
        `en Forma salvaje, 20 de daño con ${a.temp} PG temporales deja ${d.cur} PG y ${d.temp} temporales`
      );
    if (conc) {
      const t = await page.evaluate(() =>
        [...document.querySelectorAll('.toast')].map(x => x.innerText).join(' ')
      );
      if (!/CD\s*10/.test(t))
        apunta(run, `con 20 de daño y concentración, el aviso no pide CD 10: ${t.slice(0, 160)}`);
      else
        b.sola(
          'Al recibir daño concentrado, pide la salvación de CON con su CD (la mitad del daño, mínimo 10)'
        );
      /* Fallar la salvación: se pierde la concentración y desaparece la invocación ligada a ella */
      P('Fallar la salvación de concentración');
      const nInv = await page.evaluate(() => C().companions.filter(x => x.conc).length);
      if (await b.actSi(page, 'conc-lose')) {
        const st = await page.evaluate(() => ({
          conc: C().concentration,
          inv: C().companions.filter(x => x.conc).length,
        }));
        if (st.conc) apunta(run, 'tras «La fallo», sigue la concentración');
        if (nInv && st.inv)
          apunta(run, `al perder la concentración siguen ${st.inv} invocaciones ligadas a ella`);
        else if (nInv) b.sola('Al perder la concentración desaparece la invocación de ese conjuro');
      } else apunta(run, 'con concentración y daño, el aviso no tiene «La fallo»');
    }
    await mira();
    /* Transformarse gasta la acción adicional, y volver a tu forma también: se libera antes con «↺» */
    P('Volver a tu forma (Combate: «Acción adicional ↺» y «Volver a tu forma»)');
    await liberar('aa');
    await b.act(page, 'crea-revert');
    const fin = await page.evaluate(() => ({ form: C().form, ef: C().effects.filter(e => e.form).length }));
    if (fin.form || fin.ef) apunta(run, `tras volver a tu forma sigue la forma (${JSON.stringify(fin)})`);
    await mira();
    await curar();
    if (ws && ws.temp !== want) apunta(run, `wsInfo da ${ws.temp} PG temporales`);
  }
  const poli = formas.find(x => x.via === 'poly');
  if (poli) {
    P(`Criaturas: transformarse en «${poli.name}» (Polimorfar) y recibir más daño que sus PG`);
    await page.evaluate(() => {
      C().hp.temp = 0;
    });
    await b.cerrarModal(page);
    await b.act(page, 'tab', { t: 'crea' });
    await b.act(page, 'crea-transform', { id: poli.id });
    const a = await pg();
    if (a.temp !== +poli.hp.max)
      apunta(run, `Polimorfar en «${poli.name}» da ${a.temp} PG temporales (deberían ser ${poli.hp.max})`);
    await dano(a.temp + 2);
    const d = await page.evaluate(() => ({ form: C().form, cur: C().hp.current }));
    if (d.form) apunta(run, 'Polimorfar: al acabarse los PG temporales de la forma, sigue transformado');
    if (d.cur !== a.cur - 2)
      apunta(run, `Polimorfar: el daño que sobra de la forma quita ${a.cur - d.cur} PG (deberían ser 2)`);
    await mira();
    await curar();
  }

  /* Pociones: curación (el jugador tira) y heroísmo (10 PG temporales y efecto) */
  /* Los objetos se buscan por su id: al gastar el último, la app lo quita de la mochila y los demás cambian de sitio */
  const idx = id => page.evaluate(x => C().equipment.findIndex(e => e.id === x), id);
  const pot = k => c0.equipment.find(e => e.potion === k && e.qty > 0);
  if (pot('healing')) {
    const e0 = pot('healing'),
      i = await idx(e0.id);
    P('Recibir 8 de daño y beber una «Poción de curación» con un 11 (no vale) y un 7');
    await dano(8);
    await b.cerrarModal(page);
    await sinAvisos();
    const a = await pg();
    await page.evaluate(j => A.pot({ dataset: { i: j } }), i);
    await b.escribir(page, '#pot-roll', 11);
    await b.act(page, 'pot-heal');
    if ((await pg()).cur !== a.cur) apunta(run, 'la poción de curación (2d4 + 2) acepta un 11');
    await b.escribir(page, '#pot-roll', 7);
    await b.act(page, 'pot-heal');
    const d = await page.evaluate(
      x => ({ hp: C().hp.current, e: C().equipment.find(e => e.id === x) }),
      e0.id
    );
    if (d.hp !== Math.min(a.max, a.cur + 7))
      apunta(run, `beber la poción con un 7 deja ${d.hp} PG (deberían ser ${Math.min(a.max, a.cur + 7)})`);
    if ((d.e ? d.e.qty : 0) !== e0.qty - 1) apunta(run, 'beber la poción no la descuenta');
    await mira();
  }
  if (pot('heroism')) {
    const i = await idx(pot('heroism').id);
    P('Beber una «Poción de heroísmo»');
    await b.cerrarModal(page);
    await page.evaluate(() => {
      C().hp.temp = 0;
    });
    await page.evaluate(j => A.pot({ dataset: { i: j } }), i);
    await b.act(page, 'pot-fx');
    const d = await page.evaluate(() => ({ t: C().hp.temp, e: C().effects.map(e => e.name + ':' + e.m) }));
    if (d.t !== 10 || !d.e.some(x => /^Heroísmo:60$/.test(x)))
      apunta(run, `la poción de heroísmo deja ${d.t} PG temporales y los efectos ${d.e.join(', ')}`);
    await mira();
  }
  /* Pergaminos: uno de su lista que puede lanzar, uno de nivel alto (prueba) y uno que no es de su lista */
  for (const e of c0.equipment) {
    if (!e.scroll || !(e.qty > 0)) continue;
    const j = await idx(e.id);
    P(`Lanzar el pergamino «${e.name}»`);
    await b.cerrarModal(page);
    await sinAvisos();
    await page.evaluate(k => A.scroll({ dataset: { i: k } }), j);
    const txt = await page.locator('#modal').innerText();
    const fallar = await page.locator('#modal [data-act="scr-fail"]').count();
    await b.act(page, fallar ? 'scr-fail' : 'scr-cast');
    await b.cerrarModal(page);
    const q = await page.evaluate(x => (C().equipment.find(y => y.id === x) || { qty: 0 }).qty, e.id);
    if (q !== e.qty - 1) apunta(run, `lanzar el pergamino «${e.name}» lo deja con ${q} (tenía ${e.qty})`);
    if (/no está en la lista/.test(txt))
      b.sola('Avisa si el conjuro del pergamino no es de tu lista de clase');
    if (fallar) b.sola('Pergamino de nivel mayor que tus espacios: pide la prueba y deja fallarla');
    await mira();
  }
  /* Objetos con cargas: gastar todas, una de más, y recuperar con el descanso largo */
  for (const e of c0.equipment) {
    if (!e.mi || !(+e.mi.ch > 0)) continue;
    const j = await idx(e.id);
    P(`Gastar ${+e.mi.ch + 1} cargas de «${e.name}» y descansar (largo) con un 4 en ${e.mi.rec}`);
    for (let k = 0; k <= +e.mi.ch; k++) await page.evaluate(x => A['mi-ch']({ dataset: { i: x, d: 1 } }), j);
    const u = await page.evaluate(x => C().equipment[x].mi.used, j);
    if (u !== +e.mi.ch) apunta(run, `«${e.name}»: tras gastar de más, ${u} cargas gastadas de ${e.mi.ch}`);
    await b.cerrarModal(page);
    await b.act(page, 'rest-menu');
    await b.act(page, 'long');
    const inp = page.locator(`#lr-ch-${e.id}`);
    if (await inp.count()) await inp.fill('4');
    else apunta(run, `el descanso largo no pregunta por las cargas de «${e.name}»`);
    await b.act(page, 'long-done');
    await b.cerrarModal(page);
    const u2 = await page.evaluate(x => C().equipment[x].mi.used, j);
    if (u2 !== Math.max(0, +e.mi.ch - 4))
      apunta(
        run,
        `«${e.name}»: tras el descanso largo con un 4, ${u2} cargas gastadas (deberían ser ${+e.mi.ch - 4})`
      );
    else b.sola('Objetos con cargas: el descanso largo pregunta cuántas recuperan');
    await mira();
  }
}

const CONTADO = { dotes: 0, invoc: 0 };
async function aparte(archivo) {
  const json = b.leerFicha(archivo);
  const nombre = `${nombreDe(archivo)} aparte`;
  const { ctx, page, run } = await preparar(nombre, 99);
  const parte = async (t, fn) => {
    try {
      await b.limpiar(page);
      await b.importar(page, json);
      await page.evaluate(() => __az.pre());
      run.manual = false;
      const t1 = Date.now();
      const v = await fn();
      if (ARG.tiempos) console.log(`    ${nombre} · ${t}: ${Math.round((Date.now() - t1) / 1000)} s`);
      return v;
    } catch (e) {
      apunta(
        run,
        `el guion se ha parado en «${t}»: ${String(e.message || e)
          .split('\n')[0]
          .slice(0, 300)}`
      );
    }
  };
  try {
    /* Las fichas de los rincones (2d) ya pasan por «Editar ficha» y las dotes en las del reparto: aquí, solo lo suyo */
    if (archivo.startsWith(RINCONES)) {
      await parte('Rincones', () => aparteRincones(ctx, run));
      await parte('Borrar personaje', () => aparteBorrar(ctx, run));
      return;
    }
    await parte('Editar ficha', () => aparteEditar(ctx, run, json));
    CONTADO.dotes += (await parte('Dotes', () => aparteDotes(ctx, run))) || 0;
    /* Con más nivel (puesto a mano) hay más dotes para probar */
    CONTADO.dotes +=
      (await parte('Dotes a nivel 8', async () => {
        await abrirEditar(page);
        await campo(page, 'level', 8);
        /* «Aplicar rasgos de especie» pone al día lo que da la especie a ese nivel, para partir de una ficha asentada */
        await b.actSi(page, 'apply-origin');
        await b.cerrarToasts(page);
        run.manual = true;
        run.i++;
        log(run, 'Editar ficha: nivel 8 a mano (para tener más dotes)');
        return aparteDotes(ctx, run);
      })) || 0;
    CONTADO.invoc += (await parte('Invocaciones', () => aparteInvoc(ctx, run))) || 0;
    /* Con más nivel (puesto a mano) hay más invocaciones para probar */
    CONTADO.invoc +=
      (await parte('Invocaciones a nivel 12', async () => {
        if ((await b.ficha(page)).classKey !== 'warlock') return 0;
        await abrirEditar(page);
        await campo(page, 'level', 12);
        /* «Aplicar rasgos de especie» pone al día lo que da la especie a ese nivel, para partir de una ficha asentada */
        await b.actSi(page, 'apply-origin');
        await b.cerrarToasts(page);
        run.manual = true;
        run.i++;
        log(run, 'Editar ficha: nivel 12 a mano (para tener más invocaciones)');
        return aparteInvoc(ctx, run);
      })) || 0;
    await parte('Borrar personaje', () => aparteBorrar(ctx, run));
  } finally {
    await ctx.browser.close();
  }
}

/* ---------- Principal ---------- */

(async () => {
  const t0 = Date.now();
  const tareas = [];
  if (ARG.solo !== 'azar')
    for (const f of FICHAS) tareas.push({ t: `${f} · casos aparte`, fn: () => aparte(f) });
  if (ARG.solo !== 'aparte')
    for (const s of SEMILLAS)
      for (const f of FICHAS)
        if (!f.startsWith(RINCONES) || SEMILLAS_RINCONES.includes(s))
          tareas.push({ t: `${f} · semilla ${s}`, fn: () => tanda(f, s) });
  console.log(
    `Botones al azar: ${FICHAS.join(', ')} · semillas ${SEMILLAS.join(', ')} (rincones: ${SEMILLAS_RINCONES.join(', ')}) · ${PASOS} pasos por tanda · ${HILOS} navegadores a la vez`
  );
  let k = 0;
  await Promise.all(
    Array.from({ length: Math.min(HILOS, tareas.length) }, async () => {
      while (k < tareas.length) {
        const ta = tareas[k++];
        const t1 = Date.now();
        try {
          await ta.fn();
        } catch (e) {
          console.log(`  ✗ ${ta.t}: el guion no ha podido empezar: ${String(e.message || e).split('\n')[0]}`);
          FALLOS.set(`guion ${ta.t}`, {
            msg: `el guion no ha podido empezar (${ta.t}): ${e.message}`,
            veces: 1,
            donde: new Set([ta.t]),
            paso: 0,
            cola: [],
          });
        }
        console.log(`— ${ta.t}: ${Math.round((Date.now() - t1) / 1000)} s`);
      }
    })
  );

  console.log('\n===== Botones al azar (pruebas 2b y 2d) =====');
  console.log(`Fichas: ${FICHAS.join(', ')}`);
  console.log(
    `Semillas: ${SEMILLAS.join(', ')} (rincones: ${SEMILLAS_RINCONES.join(', ')}) · ${PASOS} pasos por tanda · comprobaciones hechas: ${b.INF.pasos}`
  );
  console.log(
    `Casos aparte: «Editar ficha», ${CONTADO.dotes} dotes y ${CONTADO.invoc} invocaciones añadidas y quitadas, duplicar y borrar personaje; en los rincones, reacciones, formas, pociones, pergaminos y cargas`
  );
  console.log(`Tiempo: ${Math.round((Date.now() - t0) / 1000)} s`);
  if (PULSADOS.size) {
    const master = /^(m-|msh-|camp-|master-|share-send|cr-copy|crea-share)/;
    const jug = ACTS.filter(a => !master.test(a) && !NUNCA.has(a));
    const nunca = jug.filter(a => !PULSADOS.has(a));
    console.log(
      `Botones distintos pulsados al azar: ${jug.length - nunca.length} de ${jug.length} (sin contar el modo máster)` +
        (nunca.length ? `\n  Sin pulsar: ${nunca.join(', ')}` : '')
    );
  }
  if (b.INF.sola.length) console.log('\nLa app lo hace sola:\n' + b.INF.sola.map(t => '  · ' + t).join('\n'));
  if (NOTAS.length)
    console.log('\nNotas (no son fallos del guion):\n' + NOTAS.map(t => '  · ' + t).join('\n'));
  if (!FALLOS.size) console.log('\nTodas las comprobaciones han pasado.');
  else {
    console.log(`\nComprobaciones fallidas (${FALLOS.size} tipos):`);
    for (const f of [...FALLOS.values()].sort((x, y) => y.veces - x.veces)) {
      const donde = [...f.donde];
      console.log(`\n  ✗ ${f.msg.slice(0, 500)}`);
      console.log(
        `    ${f.veces} veces · en ${donde.slice(0, 6).join(', ')}${donde.length > 6 ? ` y ${donde.length - 6} más` : ''}`
      );
      console.log(`    Primera vez: ${donde[0]}, paso ${f.paso}. Últimos pasos:`);
      for (const l of f.cola.slice(-8)) console.log(`      ${l}`);
    }
    console.log(
      '\nPara repetir una tanda: node tests/azar.js --ficha=<nombre> --semilla=<N> --solo=azar --rastro'
    );
  }
  process.exit(FALLOS.size ? 1 : 0);
})();
