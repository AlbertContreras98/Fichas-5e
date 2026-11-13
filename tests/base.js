/* Lo común de los guiones de prueba: abrir la app, importar fichas, pulsar data-act, leer el estado y comprobar las cuentas. */
'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const URL = process.env.FICHAS_URL || 'http://localhost:8777/';
const TIPS = '{"tour":1,"seen":{},"off":1}';
const FICHAS = path.join(__dirname, 'fichas');

/* Informe: lo que hace la app sola, lo que no y las comprobaciones fallidas */
const INF = { sola: [], noSola: [], fallos: [], pasos: 0 };
const sola = t => INF.sola.includes(t) || INF.sola.push(t);
const noSola = t => INF.noSola.includes(t) || INF.noSola.push(t);
function fallo(donde, t) {
  INF.fallos.push(`[${donde}] ${t}`);
  console.log(`  ✗ ${donde}: ${t}`);
}

/* ---------- Abrir la app ---------- */

/* Abre el navegador y una página con la app. Devuelve {browser, ctx, page, errores} */
async function abrir(opts = {}) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    serviceWorkers: 'block',
    viewport: opts.viewport || { width: 1280, height: 900 },
  });
  await ctx.addInitScript(t => {
    try {
      localStorage.setItem('fichas-tips', t);
    } catch (e) {}
  }, TIPS);
  const page = await ctx.newPage();
  const errores = [];
  const fuente = u => /fonts\.(googleapis|gstatic)\.com/.test(u || '');
  page.on('console', m => {
    if (m.type() !== 'error') return;
    if (fuente(m.location().url) || fuente(m.text())) return;
    errores.push(m.text());
  });
  page.on('pageerror', e => errores.push(String(e && e.stack ? e.stack : e)));
  page.on('requestfailed', r => {
    if (!fuente(r.url())) errores.push(`Petición fallida: ${r.url()}`);
  });
  await page.goto(URL);
  await page.waitForFunction(() => typeof S === 'object' && typeof A === 'object');
  return { browser, ctx, page, errores };
}

/* Borra los datos guardados de la app (no el tutorial) y recarga */
async function limpiar(page) {
  await page.evaluate(() => {
    localStorage.removeItem('fichas-dnd-2024-v1');
    localStorage.removeItem('fichas-master');
  });
  await page.reload();
  await page.waitForFunction(() => typeof S === 'object');
}

/* ---------- Pulsar y rellenar ---------- */

/* Selector de un data-act con filtros opcionales: act('hp', {m: 'dmg'}) → [data-act="hp"][data-m="dmg"] */
function selAct(nombre, datos = {}) {
  return (
    `[data-act="${nombre}"]` +
    Object.entries(datos)
      .map(([k, v]) => `[data-${k}="${v}"]`)
      .join('')
  );
}
/* Pulsa el primer data-act visible que coincida (como un jugador). Falla si no lo hay. */
async function act(page, nombre, datos = {}, dentro = '') {
  const s = (dentro ? dentro + ' ' : '') + selAct(nombre, datos);
  const loc = page.locator(s).filter({ visible: true }).first();
  await loc.waitFor({ state: 'visible', timeout: 4000 });
  await loc.click();
  /* Desde el n.º 112, un conjuro de concentración avisa antes si ya te concentras en otro: se acepta */
  if (['cast', 't-cast', 'cast-armor-ok', 'book-ritual'].includes(nombre))
    await actSi(page, 'cast-conc-ok', {}, '#modal');
}
/* Igual, pero dice si existía en vez de fallar */
async function actSi(page, nombre, datos = {}, dentro = '') {
  const s = (dentro ? dentro + ' ' : '') + selAct(nombre, datos);
  const loc = page.locator(s).filter({ visible: true }).first();
  if (!(await loc.count())) return false;
  await loc.click();
  return true;
}
/* Elige una opción de un <select> (aunque la app lo haya cambiado por su lista propia) */
async function elegir(page, sel, valor) {
  await page.evaluate(
    ([s, v]) => {
      const el = document.querySelector(s);
      if (!el) throw new Error('No existe ' + s);
      el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    },
    [sel, valor]
  );
}
/* Marca un radio por nombre y valor */
async function radio(page, name, valor) {
  await page.locator(`input[name="${name}"][value="${valor}"]`).check({ force: true });
}
/* Escribe en un campo de texto o número */
async function escribir(page, sel, valor) {
  await page.locator(sel).first().fill(String(valor));
}

/* Imagen PNG pequeña (un mapa de mentira), dibujada en la propia página, para los <input type="file"> */
async function imagenPNG(page) {
  const d = await page.evaluate(() => {
    const cv = document.createElement('canvas');
    cv.width = 64;
    cv.height = 48;
    const x = cv.getContext('2d');
    x.fillStyle = '#6a8';
    x.fillRect(0, 0, 64, 48);
    x.fillStyle = '#353';
    x.fillRect(10, 10, 20, 14);
    x.strokeStyle = '#a33';
    x.beginPath();
    x.moveTo(0, 40);
    x.lineTo(64, 8);
    x.stroke();
    return cv.toDataURL('image/png');
  });
  return { name: 'mapa.png', mimeType: 'image/png', buffer: Buffer.from(d.split(',')[1], 'base64') };
}

/* ---------- Estado ---------- */

const estado = page => page.evaluate(() => JSON.parse(JSON.stringify({ S, c: C() || null })));
const ficha = async page => (await estado(page)).c;

/* Copia de la ficha sin lo que cambia solo (ids nuevos, marcas de tiempo) */
function limpia(c) {
  return JSON.parse(JSON.stringify(c, (k, v) => (k === 'updated' ? undefined : v)));
}
/* Diferencias entre dos objetos (rutas), para el informe */
/* Un campo que falta y aparece con su valor por defecto ('' , false, null, 0, [] o {}) no cuenta como cambio:
   la app crea algunos objetos sin todos sus campos y normalize() los completa al cargar. */
const vacio = v =>
  v === '' ||
  v === false ||
  v === null ||
  v === 0 ||
  (Array.isArray(v) && !v.length) ||
  (v && typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length);
function difs(a, b, ruta = '', out = []) {
  if (out.length > 8) return out;
  if ((a === undefined && vacio(b)) || (b === undefined && vacio(a))) return out;
  /* Marcas internas de migración (_wpnLinked…): las pone la app al cargar y no son datos de la ficha */
  if (/(^|\.)_[a-zA-Z]+Linked$/.test(ruta)) return out;
  if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') {
    if (JSON.stringify(a) !== JSON.stringify(b))
      out.push(`${ruta || '(raíz)'}: ${JSON.stringify(a)} → ${JSON.stringify(b)}`.slice(0, 200));
    return out;
  }
  const ks = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of ks) difs(a[k], b[k], ruta ? `${ruta}.${k}` : k, out);
  return out;
}

/* ---------- Importar ---------- */

const leerFicha = n => fs.readFileSync(path.join(FICHAS, n), 'utf8');

/* Importa una ficha con el flujo real: «Importar ficha» (o Ajustes → Copia de seguridad) → textarea → Importar */
async function importar(page, json) {
  await cerrarModal(page);
  const texto = typeof json === 'string' ? json : JSON.stringify(json, null, 2);
  const hay = await page.evaluate(() => !!C());
  if (!hay) await act(page, 'tab', { t: 'data' });
  else {
    await act(page, 'settings');
    await act(page, 'open-data');
  }
  await escribir(page, '#imp-text', texto);
  await act(page, 'import');
  await page.waitForFunction(() => S.tab === 'play');
  await cerrarToasts(page);
  return ficha(page);
}

/* Exporta con el flujo real (Ajustes → Copia de seguridad) y devuelve el JSON del cuadro de exportar */
async function exportar(page) {
  await cerrarModal(page);
  await act(page, 'settings');
  await act(page, 'open-data');
  const t = await page.locator('#exp-text').inputValue();
  await act(page, 'tab', { t: 'pj' });
  return t;
}

async function cerrarToasts(page) {
  await page.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove()));
}
async function cerrarModal(page) {
  await page.evaluate(() => {
    if (!document.getElementById('modal').hidden) closeModal();
  });
}

/* ---------- Comprobaciones ---------- */

/* Tablas del Manual del Jugador de 2024, escritas aparte de la app para compararlas */
const PB = L => 2 + Math.floor((L - 1) / 4);
const FULL = [
  [2],
  [3],
  [4, 2],
  [4, 3],
  [4, 3, 2],
  [4, 3, 3],
  [4, 3, 3, 1],
  [4, 3, 3, 2],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 2, 1, 1],
];
const HALF = [
  [2],
  [2],
  [3],
  [3],
  [4, 2],
  [4, 2],
  [4, 3],
  [4, 3],
  [4, 3, 2],
  [4, 3, 2],
  [4, 3, 3],
  [4, 3, 3],
  [4, 3, 3, 1],
  [4, 3, 3, 1],
  [4, 3, 3, 2],
  [4, 3, 3, 2],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2],
];
const PACT = L => ({
  level: Math.min(5, Math.ceil(L / 2)),
  total: L === 1 ? 1 : L <= 10 ? 2 : L <= 16 ? 3 : 4,
});
const TIPO = {
  bard: 'full',
  cleric: 'full',
  druid: 'full',
  sorcerer: 'full',
  wizard: 'full',
  paladin: 'half',
  ranger: 'half',
  warlock: 'pact',
};
/* Lanzadores de un tercio: la subclase es la que da los conjuros, desde el nivel 3 */
const THIRD = L => (L < 3 ? [] : FULL[Math.ceil(L / 3) - 1]);
const TIPO_SUB = { eldritch: 'third', arcanetrickster: 'third' };
const pad9 = a => Array.from({ length: 9 }, (_, i) => a[i] || 0);

/* Cuentas de la ficha: devuelve la lista de problemas */
async function cuentas(page) {
  const { c, pbApp } = await page.evaluate(() => ({ c: JSON.parse(JSON.stringify(C())), pbApp: pb(C()) }));
  const out = [];
  const L = c.level;
  const hp = c.hp;
  if (!(hp.current >= 0 && hp.current <= hp.max)) out.push(`PG ${hp.current} fuera de 0..${hp.max}`);
  if (!(hp.temp >= 0)) out.push(`PG temporales negativos (${hp.temp})`);
  const hd = c.hitDice;
  if (!(hd.spent >= 0 && hd.spent <= hd.total))
    out.push(`Dados de golpe gastados ${hd.spent} de ${hd.total}`);
  if (hd.total !== L) out.push(`Dados de golpe totales ${hd.total} ≠ nivel ${L}`);
  c.slots.forEach((s, i) => {
    if (!(s.used >= 0 && s.used <= s.total))
      out.push(`Espacios de nivel ${i + 1}: ${s.used} gastados de ${s.total}`);
  });
  if (!(c.pact.used >= 0 && c.pact.used <= c.pact.total))
    out.push(`Magia de pacto: ${c.pact.used} gastados de ${c.pact.total}`);
  c.features.forEach(f => {
    const u = f.uses;
    if (u.max && !(u.used >= 0 && u.used <= u.max)) out.push(`Usos de «${f.name}»: ${u.used} de ${u.max}`);
  });
  c.equipment.forEach(e => {
    if (!(+e.qty >= 0)) out.push(`Cantidad de «${e.name}» = ${e.qty}`);
  });
  if (
    !(
      c.deathSaves.success >= 0 &&
      c.deathSaves.success <= 3 &&
      c.deathSaves.fail >= 0 &&
      c.deathSaves.fail <= 3
    )
  )
    out.push(`Salvaciones contra muerte fuera de rango: ${JSON.stringify(c.deathSaves)}`);
  if (pbApp !== PB(L)) out.push(`Competencia +${pbApp} a nivel ${L} (debería ser +${PB(L)})`);
  const t = TIPO[c.classKey] || TIPO_SUB[c.subclassKey];
  const want =
    t === 'full'
      ? pad9(FULL[L - 1])
      : t === 'half'
        ? pad9(HALF[L - 1])
        : t === 'third'
          ? pad9(THIRD(L))
          : pad9([]);
  const got = c.slots.map(s => s.total);
  if (c.classKey && JSON.stringify(got) !== JSON.stringify(want))
    out.push(`Espacios ${JSON.stringify(got)} a nivel ${L} (deberían ser ${JSON.stringify(want)})`);
  const pw = t === 'pact' ? PACT(L) : { level: 0, total: 0 };
  if (c.classKey && (c.pact.level !== pw.level || c.pact.total !== pw.total))
    out.push(`Magia de pacto ${c.pact.total}×N${c.pact.level} (debería ser ${pw.total}×N${pw.level})`);
  return out;
}

/* Exportar → importar: el mismo camino que el botón Importar, sin tocar la lista de fichas */
async function idaYVuelta(page) {
  const r = await page.evaluate(() => {
    const a = JSON.parse(JSON.stringify(C()));
    const n = normalize(JSON.parse(JSON.stringify(a, null, 2)));
    n.spells.forEach(fillFromRef);
    [linkWeapons, linkGear, linkItemWeapons, linkAttackItems, linkArmor].forEach(f => f(n));
    return { a, b: JSON.parse(JSON.stringify(n)) };
  });
  return difs(limpia(r.a), limpia(r.b));
}

/* Recargar: la ficha y la ficha activa deben quedar igual */
async function recargar(page) {
  const a = await estado(page);
  await page.reload();
  await page.waitForFunction(() => typeof S === 'object' && typeof A === 'object');
  const b = await estado(page);
  const d = difs(limpia(a.c), limpia(b.c));
  if (a.S.active !== b.S.active) d.unshift(`ficha activa ${a.S.active} → ${b.S.active}`);
  return d;
}

/* Revisa todo menos deshacer. donde = nombre del paso */
async function comprobar(ctx, donde, { recarga = true } = {}) {
  const { page, errores } = ctx;
  INF.pasos++;
  for (const e of errores.splice(0)) fallo(donde, `consola: ${e.slice(0, 300)}`);
  for (const p of await cuentas(page)) fallo(donde, p);
  for (const d of await idaYVuelta(page)) fallo(donde, `exportar→importar cambia ${d}`);
  if (recarga) {
    await cerrarModal(page);
    for (const d of await recargar(page)) fallo(donde, `al recargar cambia ${d}`);
    for (const e of errores.splice(0)) fallo(donde, `consola tras recargar: ${e.slice(0, 300)}`);
  }
}

/* Hace un paso, comprueba que «Deshacer» devuelve el estado anterior, lo rehace y pasa las comprobaciones.
   fn(page) debe poder repetirse. */
async function paso(ctx, donde, fn, { deshacer = true, recarga = true } = {}) {
  const { page } = ctx;
  await cerrarModal(page);
  await cerrarToasts(page);
  const antes = await page.evaluate(() => ({ chars: JSON.stringify(S.chars), n: UNDO.length }));
  try {
    await fn(page);
  } catch (e) {
    fallo(donde, `el guion no pudo hacer el paso: ${String(e.message || e).split('\n')[0]}`);
    return false;
  }
  if (deshacer) {
    const desp = await page.evaluate(() => ({ chars: JSON.stringify(S.chars), n: UNDO.length }));
    const n = desp.n - antes.n;
    if (desp.chars !== antes.chars) {
      if (n <= 0) fallo(donde, 'el paso cambia la ficha pero «Deshacer» no tiene nada que deshacer');
      else {
        await cerrarToasts(page);
        await cerrarModal(page);
        for (let i = 0; i < n; i++) await act(page, 'undo');
        const vuelta = await page.evaluate(() => JSON.stringify(S.chars));
        if (vuelta !== antes.chars) {
          const d = difs(limpia(JSON.parse(antes.chars)), limpia(JSON.parse(vuelta)));
          fallo(donde, `«Deshacer» no devuelve el estado anterior: ${d.join('; ')}`);
        }
        await cerrarToasts(page);
        await cerrarModal(page);
        try {
          await fn(page);
        } catch (e) {
          fallo(
            donde,
            `el guion no pudo repetir el paso tras deshacer: ${String(e.message || e).split('\n')[0]}`
          );
          return false;
        }
      }
    }
  }
  await comprobar(ctx, donde, { recarga });
  return true;
}

/* Informe final por consola. Devuelve el código de salida. */
function informe(titulo) {
  console.log(`\n===== ${titulo} =====`);
  console.log(`Pasos comprobados: ${INF.pasos}`);
  if (INF.sola.length) console.log('\nLa app lo hace sola:\n' + INF.sola.map(t => '  · ' + t).join('\n'));
  if (INF.noSola.length)
    console.log('\nNo lo hace sola (lo hace el jugador):\n' + INF.noSola.map(t => '  · ' + t).join('\n'));
  console.log(
    INF.fallos.length
      ? `\nComprobaciones fallidas (${INF.fallos.length}):\n` + INF.fallos.map(t => '  ✗ ' + t).join('\n')
      : '\nTodas las comprobaciones han pasado.'
  );
  return INF.fallos.length ? 1 : 0;
}

module.exports = {
  URL,
  FICHAS,
  INF,
  sola,
  noSola,
  fallo,
  abrir,
  limpiar,
  selAct,
  act,
  actSi,
  elegir,
  radio,
  escribir,
  imagenPNG,
  estado,
  ficha,
  limpia,
  difs,
  leerFicha,
  importar,
  exportar,
  cerrarToasts,
  cerrarModal,
  cuentas,
  idaYVuelta,
  recargar,
  comprobar,
  paso,
  informe,
  PB,
  FULL,
  HALF,
  PACT,
};
