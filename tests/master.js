/* Prueba 2c: modo máster y compartir. Dos dispositivos (jugador y máster), campañas, combate con el bestiario, y los códigos #pj, #cr, #tienda y #recibo de un lado a otro. */
'use strict';

const fs = require('fs');
const b = require('./base');

const APP = b.URL;
const NOTAS = []; // cosas que no son fallos de las comprobaciones pero conviene apuntar
const nota = t => NOTAS.includes(t) || NOTAS.push(t);
const espera = ms => new Promise(r => setTimeout(r, ms));
function regla(donde, ok, t) {
  if (!ok) b.fallo(donde, t);
  return ok;
}

/* ---------- Dispositivos ---------- */

async function dispositivo(nombre) {
  const d = await b.abrir();
  d.nombre = nombre;
  await d.ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(APP).origin });
  return d;
}
const mst = page =>
  page.evaluate(() =>
    JSON.parse(JSON.stringify({ on: MST.on, cur: MST.cur, tab: MST.tab, camps: MST.camps }))
  );
const sinT = o =>
  JSON.parse(JSON.stringify(o, (k, v) => (k === 't' && typeof v === 'number' ? undefined : v)));
async function toasts(page) {
  const t = await page.$$eval('#toasts .toast', ts => ts.map(x => x.textContent.replace('×', '').trim()));
  await b.cerrarToasts(page);
  return t.join(' | ');
}
/* Errores de consola del dispositivo */
function consola(dev, donde) {
  for (const e of dev.errores.splice(0)) b.fallo(donde, `consola (${dev.nombre}): ${e.slice(0, 300)}`);
}
/* Máster: consola limpia y, si toca, recargar y que todo siga igual */
async function compMaster(m, donde, { recarga = false } = {}) {
  b.INF.pasos++;
  consola(m, donde);
  if (!recarga) return;
  await b.cerrarModal(m.page);
  const a = await mst(m.page);
  const st = await m.page.evaluate(() => localStorage.getItem('fichas-master'));
  const g = JSON.parse(st || '{}');
  const d0 = b.difs(sinT({ on: a.on, cur: a.cur, camps: a.camps }), sinT(g));
  if (d0.length) b.fallo(donde, `lo guardado no es lo que se ve: ${d0.join('; ')}`);
  await m.page.reload();
  await m.page.waitForFunction(() => typeof MST === 'object' && typeof A === 'object');
  const c = await mst(m.page);
  const d = b.difs(a, c);
  if (d.length) b.fallo(donde, `al recargar (máster) cambia ${d.join('; ')}`);
  consola(m, donde + ' (tras recargar)');
}
/* Lee lo que se acaba de copiar (portapapeles o, si falla, el cuadro de texto de la app) */
async function copiado(page) {
  const ta = page.locator('#modal textarea.code').filter({ visible: true });
  if (await ta.count()) return ta.first().inputValue();
  return page.evaluate(() => navigator.clipboard.readText());
}
async function qrOk(page, donde) {
  const n = await page.locator('#modal .qrbox svg').count();
  const warn = await page.locator('#modal .hint.warn').allTextContents();
  regla(donde, n === 1, `no se ha generado el QR (${warn.join(' ')})`);
  return n === 1;
}
async function ajustesMaster(page) {
  await b.cerrarModal(page);
  await b.act(page, 'settings');
  await page.evaluate(() => document.querySelectorAll('#modal details').forEach(d => (d.open = true)));
}
/* Pone un valor y lanza input y change, como el teclado al salir del campo */
async function poner(page, sel, v) {
  const ok = await page.evaluate(
    ([s, w]) => {
      const el = document.querySelector(s);
      if (!el) return false;
      const proto =
        el.tagName === 'SELECT'
          ? HTMLSelectElement.prototype
          : el.tagName === 'TEXTAREA'
            ? HTMLTextAreaElement.prototype
            : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, w);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    },
    [sel, String(v)]
  );
  if (!ok) throw new Error('No existe ' + sel);
}

/* ---------- Jugador ---------- */

async function usarFicha(j, nombre) {
  await b.cerrarModal(j.page);
  await b.act(j.page, 'chars');
  const id = await j.page.evaluate(n => (S.chars.find(c => c.name === n) || {}).id, nombre);
  await b.act(j.page, 'use', { id });
  await b.cerrarModal(j.page);
}
async function compartirPj(j, donde) {
  const page = j.page;
  await ajustesMaster(page);
  await b.act(page, 'share-open');
  await qrOk(page, donde + ' · QR');
  const ver = await page.evaluate(() => sheetOf(C()));
  await b.act(page, 'share-copy');
  const code = await copiado(page);
  await b.cerrarModal(page);
  await b.cerrarToasts(page);
  return { code, ver };
}
/* Lo que el máster debería ver, calculado aparte de la app */
function esperado(c) {
  const PB = b.PB(c.level),
    K = ['str', 'dex', 'con', 'int', 'wis', 'cha'],
    md = v => Math.floor((v - 10) / 2);
  const per = +c.skills.perception || 0;
  return {
    a: K.map(k => c.abilities[k]),
    s: K.map(k => md(c.abilities[k]) + (c.saveProf.includes(k) ? PB : 0)),
    p: K.reduce((t, k, i) => t | (c.saveProf.includes(k) ? 1 << i : 0), 0),
    pp: 10 + md(c.abilities.wis) + (per === 2 ? 2 * PB : per === 1 ? PB : 0),
  };
}

/* ---------- Máster ---------- */

async function pegarJugador(m, code) {
  const page = m.page;
  await b.cerrarModal(page);
  await b.cerrarToasts(page);
  await b.act(page, 'm-add');
  await b.escribir(page, '#m-code', code);
  await b.act(page, 'm-paste');
  return toasts(page);
}
/* «Escanear o importar» → «¿No se lee? Pega el código» (máster o jugador) */
async function pegarEscaner(dev, code) {
  const page = dev.page;
  await b.cerrarModal(page);
  await b.cerrarToasts(page);
  const on = await page.evaluate(() => MST.on);
  if (on) {
    await b.act(page, 'm-add');
    await b.act(page, 'm-scan', {}, '#modal');
  } else {
    await ajustesMaster(page);
    await b.act(page, 'p-scan');
  }
  await page.evaluate(() => document.querySelectorAll('#modal details').forEach(d => (d.open = true)));
  await b.escribir(page, '#scan-code', code);
  await b.act(page, 'scan-paste');
  await espera(50);
  return toasts(page);
}
/* Abrir la app con un enlace (como al escanear el QR con la cámara del móvil): carga completa */
async function abrirEnlace(dev, link) {
  await dev.page.goto('about:blank');
  await dev.page.goto(link);
  await dev.page.waitForFunction(() => typeof MST === 'object' && typeof A === 'object');
  await espera(50);
}
async function usarCamp(page, id) {
  await b.cerrarModal(page);
  if (await page.evaluate(i => MST.cur === i, id)) return;
  await b.act(page, 'camp-open');
  await b.act(page, 'camp-use', { id });
}
const campIds = page => page.evaluate(() => MST.camps.map(k => ({ id: k.id, n: k.n })));

/* ===================================================================================== */

const FICHAS = ['zyo.json', 'explorador.json', 'monje.json', 'mago.json'];

async function main() {
  const filtro = (process.argv.find(a => a.startsWith('--solo=')) || '').slice(7);
  const j = await dispositivo('jugador');
  const m = await dispositivo('máster');
  await b.limpiar(j.page);
  await b.limpiar(m.page);

  /* ---------- 1. Fichas del jugador y primer jugador por enlace ---------- */
  console.log('\n— Jugadores (#pj)');
  const fichas = {};
  for (const f of FICHAS) {
    const c = await b.importar(j.page, b.leerFicha(f));
    fichas[c.name] = c.id;
  }
  await b.comprobar(j, 'jugador · importar las 4 fichas');

  /* El máster aún no está en modo máster: abre el enlace de Zyo con la cámara */
  await usarFicha(j, 'Zyo');
  let sh = await compartirPj(j, 'Zyo · compartir');
  regla(
    'Zyo · copiar código',
    sh.code.includes('#pj='),
    `«Copiar código» no da un enlace #pj= (${sh.code.slice(0, 60)})`
  );
  await abrirEnlace(m, sh.code);
  const llega = await m.page.locator('#modal [data-act="m-hash-ok"]').count();
  regla('máster · enlace #pj sin modo máster', llega === 1, 'no sale la ventana «Ha llegado una ficha»');
  if (llega) await b.act(m.page, 'm-hash-ok');
  let M = await mst(m.page);
  regla(
    'máster · enlace #pj',
    M.on && M.camps.length === 1,
    `modo máster ${M.on}, ${M.camps.length} campañas`
  );
  regla(
    'máster · enlace #pj',
    !(await m.page.evaluate(() => location.hash)),
    'el enlace se queda en la barra de direcciones'
  );
  await compMaster(m, 'máster · entra Zyo por enlace', { recarga: true });

  /* Las otras tres por «+ Jugador» → pegar el código */
  for (const nombre of Object.keys(fichas)) {
    await usarFicha(j, nombre);
    const r = await compartirPj(j, `${nombre} · compartir`);
    if (nombre !== 'Zyo') {
      const t = await pegarJugador(m, r.code);
      regla(`${nombre} · m-paste`, /Jugador añadido/.test(t), `aviso al añadir: «${t}»`);
    }
    const c = await b.ficha(j.page);
    const app = await j.page.evaluate(() => ({ ac: acOf(C()), i: init(C()) }));
    const p = await m.page.evaluate(id => MST.players.find(x => x.id === id), c.id);
    if (!regla(`${nombre} · en la mesa`, !!p, 'no ha llegado al máster')) continue;
    const e = esperado(c);
    const D = `${nombre} · datos en el máster`;
    regla(D, JSON.stringify(p.a) === JSON.stringify(e.a), `características ${p.a} (deberían ser ${e.a})`);
    regla(D, JSON.stringify(p.s) === JSON.stringify(e.s), `salvaciones ${p.s} (deberían ser ${e.s})`);
    regla(D, p.p === e.p, `marcas de competencia en salvaciones ${p.p} (deberían ser ${e.p})`);
    regla(D, p.pp === e.pp, `Percepción pasiva ${p.pp} (debería ser ${e.pp})`);
    regla(D, p.ac === app.ac, `CA ${p.ac} (la ficha dice ${app.ac})`);
    regla(D, p.i === app.i, `iniciativa ${p.i} (la ficha dice ${app.i})`);
    regla(D, p.n === c.name && p.c.includes(String(c.level)), `nombre o clase: ${p.n} · ${p.c}`);
    /* Lo que ve el máster en la pestaña del jugador */
    await b.act(m.page, 'm-tab', { t: c.id });
    const txt = await m.page.locator('#view .msheet').first().textContent();
    regla(
      D,
      txt.includes(`Percepción pasiva${p.pp}`) || txt.includes(String(p.pp)),
      'la ventana no enseña la Percepción pasiva'
    );
  }
  M = await mst(m.page);
  regla(
    'máster · 4 jugadores',
    M.camps[0].players.length === 4,
    `${M.camps[0].players.length} jugadores en la mesa`
  );
  b.sola(
    'El máster recibe características, salvaciones, CA, Percepción pasiva e iniciativa con el código #pj'
  );
  await compMaster(m, 'máster · 4 jugadores', { recarga: true });

  /* ---------- 2. Criaturas (#cr) ---------- */
  console.log('\n— Criaturas (#cr)');
  await usarFicha(j, 'Elarion');
  await b.paso(j, 'mago · añadir familiar (búho)', async pg => {
    await b.act(pg, 'tab', { t: 'crea' });
    await b.act(pg, 'crea-new');
    await b.act(pg, 'crea-kind', { k: 'familiar' });
    await b.elegir(pg, '#cx-cat', 'owl');
    await espera(50);
    await b.escribir(pg, '#cx-name', 'Plumas');
    await b.act(pg, 'crea-save');
  });
  await b.paso(j, 'mago · añadir invocación (bestia)', async pg => {
    await b.act(pg, 'tab', { t: 'crea' });
    await b.act(pg, 'crea-new');
    await b.act(pg, 'crea-kind', { k: 'summon' });
    await pg.evaluate(() =>
      ['cx-spend', 'cx-concNew'].forEach(i => $('#' + i) && ($('#' + i).checked = false))
    );
    await b.act(pg, 'crea-save');
  });
  let cm = await b.ficha(j.page);
  const owl = cm.companions.find(x => x.name === 'Plumas'),
    inv = cm.companions.find(x => x.kind === 'summon');
  regla('mago · criaturas', owl && inv, `criaturas: ${cm.companions.map(x => x.name).join(', ')}`);
  for (const x of [owl, inv].filter(Boolean)) {
    const D = `${x.name} · pasar al máster`;
    await b.act(j.page, 'tab', { t: 'crea' });
    await b.act(j.page, 'crea-share', { id: x.id });
    await qrOk(j.page, D + ' · QR');
    await b.act(j.page, 'cr-copy');
    const code = await copiado(j.page);
    await b.cerrarModal(j.page);
    regla(D, code.includes('#cr='), `el código no es un enlace #cr= (${code.slice(0, 50)})`);
    const t = await pegarJugador(m, code);
    regla(D, /Criatura de Elarion/.test(t), `aviso: «${t}»`);
    const p = await m.page.evaluate(id => MST.players.find(q => q.id === id), cm.id);
    const cr = p && (p.crs || []).find(q => q.id === x.id);
    if (!regla(D, !!cr, 'no está en p.crs del mago')) continue;
    if (x === owl) {
      const bo = await m.page.evaluate(() => BEASTS.find(z => z.id === 'owl'));
      regla(D, JSON.stringify(cr.a) === JSON.stringify(bo.ab), `características ${cr.a} (catálogo ${bo.ab})`);
      regla(D, cr.ac === bo.ac, `CA ${cr.ac} (catálogo ${bo.ac})`);
      const pp = +/Percepción pasiva (\d+)/.exec(bo.sen)[1];
      regla(D, cr.pp === pp, `Percepción pasiva ${cr.pp} (catálogo ${pp})`);
    } else {
      const ab = await m.page.evaluate(() => CR_AB.beast[0]);
      regla(D, JSON.stringify(cr.a) === JSON.stringify(ab), `características ${cr.a} (deberían ser ${ab})`);
      const st = await j.page.evaluate(
        id =>
          creaStats(
            C(),
            C().companions.find(q => q.id === id)
          ).ac,
        x.id
      );
      regla(D, cr.ac === +st, `CA ${cr.ac} (la ficha dice ${st})`);
    }
    /* que no esté en otros jugadores */
    const otros = await m.page.evaluate(
      ([id, o]) => MST.players.filter(q => q.id !== o && (q.crs || []).some(z => z.id === id)).length,
      [x.id, cm.id]
    );
    regla(D, !otros, 'la criatura aparece en otro jugador');
  }
  /* Volver a pasar el familiar tras cambiarle el nombre: se actualiza, no se duplica */
  await b.paso(j, 'mago · renombrar familiar', async pg => {
    await b.act(pg, 'tab', { t: 'crea' });
    const id = await pg.evaluate(() => C().companions.find(x => x.kind === 'familiar').id);
    await b.act(pg, 'crea-edit', { id });
    await b.escribir(pg, '#cx-name', 'Plumas II');
    await b.act(pg, 'crea-save');
  });
  {
    await b.act(j.page, 'tab', { t: 'crea' });
    await b.act(j.page, 'crea-share', { id: owl.id });
    await b.act(j.page, 'cr-copy');
    const code = await copiado(j.page);
    await b.cerrarModal(j.page);
    await pegarJugador(m, code);
    const crs = await m.page.evaluate(id => MST.players.find(q => q.id === id).crs, cm.id);
    regla('familiar · volver a pasarlo', crs.length === 2, `${crs.length} criaturas (deberían ser 2)`);
    regla(
      'familiar · volver a pasarlo',
      crs.some(x => x.n === 'Plumas II'),
      'no se actualiza el nombre'
    );
    /* Por el enlace (cámara del móvil) también, ya en modo máster */
    await abrirEnlace(m, code);
    const crs2 = await m.page.evaluate(id => MST.players.find(q => q.id === id).crs.length, cm.id);
    regla('familiar · por enlace', crs2 === 2, `${crs2} criaturas tras abrir el enlace #cr`);
    b.sola('Las criaturas del jugador llegan a su jugador con #cr y se actualizan sin duplicarse');
    /* Pegar solo el código (sin «…#cr=»), por ejemplo si el jugador lo recorta */
    const solo = code.split('#cr=')[1];
    const t = await pegarJugador(m, solo);
    const desp = await mst(m.page);
    const cur = desp.camps.find(k => k.id === desp.cur);
    const comoJug = cur.players.some(p => p.id === owl.id);
    if (comoJug)
      b.fallo(
        'familiar · código sin enlace en «+ Jugador»',
        `la criatura entra como un jugador nuevo («${t}»): ${cur.players.length} jugadores`
      );
    if (comoJug) {
      /* lo quitamos para seguir */
      await m.page.evaluate(id => {
        MST.players = MST.players.filter(p => p.id !== id);
        MST.tab = 'combat';
        masterSave();
        render();
      }, owl.id);
    }
  }
  await compMaster(m, 'máster · criaturas', { recarga: true });

  /* ---------- 3. Campañas ---------- */
  console.log('\n— Campañas');
  const c1 = (await mst(m.page)).cur;
  await b.act(m.page, 'camp-open');
  await b.escribir(m.page, '#camp-n', '');
  await b.act(m.page, 'camp-add');
  regla('campañas · nombre vacío', (await mst(m.page)).camps.length === 1, 'crea una campaña sin nombre');
  await b.escribir(m.page, '#camp-n', 'Campaña B');
  await b.act(m.page, 'camp-add');
  M = await mst(m.page);
  regla(
    'campañas · crear',
    M.camps.length === 2 && M.cur !== c1,
    `${M.camps.length} campañas, activa ${M.cur}`
  );
  const c2 = M.cur;
  const k2 = M.camps.find(k => k.id === c2);
  regla(
    'campañas · crear',
    k2 && !k2.players.length && !k2.shops.length && !k2.fight.list.length,
    'la campaña nueva no empieza vacía'
  );
  await b.cerrarToasts(m.page);
  await b.act(m.page, 'camp-open');
  await b.act(m.page, 'camp-ren', { id: c2 });
  await b.escribir(m.page, '#camp-rn', 'Campaña Beta');
  await b.act(m.page, 'camp-ren-ok', { id: c2 });
  regla(
    'campañas · renombrar',
    (await campIds(m.page)).find(k => k.id === c2).n === 'Campaña Beta',
    'no se renombra'
  );
  const top = await m.page.locator('#top small').first().textContent();
  regla('campañas · renombrar', top.includes('Campaña Beta'), `la cabecera dice «${top}»`);
  await b.cerrarModal(m.page);
  /* En la B: solo Zyo y en la pestaña Tiendas */
  await usarFicha(j, 'Zyo');
  sh = await compartirPj(j, 'Zyo · compartir (B)');
  await pegarJugador(m, sh.code);
  await b.act(m.page, 'm-tab', { t: 'shops' });
  await compMaster(m, 'campañas · B con Zyo', { recarga: true });
  /* Criatura de un jugador que no está en esta campaña */
  {
    await usarFicha(j, 'Elarion');
    await b.act(j.page, 'tab', { t: 'crea' });
    await b.act(j.page, 'crea-share', { id: owl.id });
    await b.act(j.page, 'cr-copy');
    const code = await copiado(j.page);
    await b.cerrarModal(j.page);
    const antes = await mst(m.page);
    const t = await pegarJugador(m, code);
    regla('criatura · jugador fuera de la campaña', /no está en tu mesa/.test(t), `aviso: «${t}»`);
    regla('criatura · jugador fuera de la campaña', !b.difs(antes, await mst(m.page)).length, 'cambia algo');
  }
  await compMaster(m, 'campañas · criatura fuera');
  /* Cambiar a la 1 y volver */
  await usarCamp(m.page, c1);
  M = await mst(m.page);
  regla('campañas · cambiar a la 1', M.cur === c1, 'no cambia');
  let ids = await m.page.evaluate(() => MST.players.map(p => p.n).sort());
  regla('campañas · cambiar a la 1', ids.length === 4, `jugadores de la 1: ${ids}`);
  regla('campañas · cambiar a la 1', M.tab !== 'shops', `pestaña ${M.tab} (la 1 estaba en otra)`);
  await usarCamp(m.page, c2);
  M = await mst(m.page);
  ids = await m.page.evaluate(() => MST.players.map(p => p.n));
  regla(
    'campañas · volver a la B',
    ids.join() === 'Zyo' && M.tab === 'shops',
    `jugadores ${ids}, pestaña ${M.tab}`
  );
  await compMaster(m, 'campañas · cambiar', { recarga: true });
  /* Una tercera para borrarla (la activa) */
  await b.act(m.page, 'camp-open');
  await b.escribir(m.page, '#camp-n', 'Para borrar');
  await b.act(m.page, 'camp-add');
  const c3 = (await mst(m.page)).cur;
  await b.cerrarToasts(m.page);
  await b.act(m.page, 'camp-open');
  await b.act(m.page, 'camp-del', { id: c3 });
  await b.act(m.page, 'camp-del-ok', { id: c3 });
  M = await mst(m.page);
  regla(
    'campañas · borrar la activa',
    M.camps.length === 2 && M.cur !== c3,
    `${M.camps.length} campañas, activa ${M.cur}`
  );
  const vis = await m.page.locator('#modal [data-act="camp-del"]').count();
  regla('campañas · borrar', vis === 2, `${vis} botones de borrar con 2 campañas`);
  await b.cerrarModal(m.page);
  await usarCamp(m.page, c1);
  await b.cerrarToasts(m.page);
  await compMaster(m, 'campañas · borrar', { recarga: true });

  if (filtro && filtro !== 'combate') console.log('(salto el combate)');
  else await combate(m, j);
  if (!filtro || filtro === 'tienda') await tiendas(m, j, c1, c2);
  await rotos(m, j);

  /* Ancho de móvil: nada se sale de la pantalla en las vistas del máster y en la tienda del jugador */
  for (const [dev, tabs] of [
    [m, ['combat', 'shops']],
    [j, ['shop']],
  ]) {
    await dev.page.setViewportSize({ width: 390, height: 800 });
    for (const t of tabs) {
      await b.cerrarModal(dev.page);
      const ok = await dev.page.evaluate(async t => {
        if (MST.on) {
          MST.tab = t;
        } else if (C() && C().shop) S.tab = t;
        else return true;
        render();
        await new Promise(r => setTimeout(r, 50));
        return document.documentElement.scrollWidth <= innerWidth + 1;
      }, t);
      regla(`390 px · ${dev.nombre} · ${t}`, ok, 'la página se sale de la pantalla (scroll horizontal)');
      await dev.page.screenshot({
        path: `${process.env.CAPTURAS || '/tmp'}/master-${dev.nombre}-${t}.png`,
        fullPage: true,
      });
    }
  }
  consola(m, 'final');
  consola(j, 'final');

  await j.browser.close();
  await m.browser.close();
  if (NOTAS.length) console.log('\nNotas:\n' + NOTAS.map(t => '  · ' + t).join('\n'));
  process.exitCode = b.informe('Prueba 2c · Modo máster y compartir');
}

/* ---------- 4. Combate del máster ---------- */
async function combate(m, j) {
  console.log('\n— Combate del máster');
  const page = m.page;
  await b.act(page, 'm-tab', { t: 'combat' });
  await b.act(page, 'm-pjs');
  let F = await page.evaluate(() => MST.fight);
  regla(
    'combate · añadir jugadores',
    F.list.filter(f => f.kind === 'pj').length === 4,
    `${F.list.length} en la lista`
  );
  /* Dos goblins del bestiario */
  await b.act(page, 'm-foe');
  await b.escribir(page, '#mf-q', 'goblin');
  await page.locator('#mf-q').dispatchEvent('input');
  const gid = await page.evaluate(() => {
    const x = [...document.querySelectorAll('#mf-res [data-act="m-foe-pick"]')].find(e =>
      /goblin/i.test(e.dataset.id)
    );
    return x && x.dataset.id;
  });
  regla('combate · bestiario', !!gid, 'no encuentra «goblin»');
  await b.act(page, 'm-foe-pick', { id: gid });
  await b.escribir(page, '#mf-n', '2');
  await b.act(page, 'm-foe-add');
  const gb = await page.evaluate(id => bestGet(id), gid);
  F = await page.evaluate(() => MST.fight);
  const gobs = F.list.filter(f => f.mon === gid);
  regla('combate · NPC del bestiario', gobs.length === 2, `${gobs.length} goblins`);
  regla(
    'combate · NPC del bestiario',
    gobs.every(
      f => f.ac === gb.ac && f.hp === gb.hp && f.hpMax === gb.hp && f.ib === Math.floor((gb.ab[1] - 10) / 2)
    ),
    `goblins: ${JSON.stringify(gobs)}`
  );
  regla(
    'combate · NPC del bestiario',
    gobs.map(f => f.name).join() === `${gb.n} 1,${gb.n} 2`,
    `nombres ${gobs.map(f => f.name)}`
  );
  /* Un lobo con su ficha y un NPC hecho a mano */
  await b.act(page, 'm-foe');
  await b.escribir(page, '#mf-q', 'lobo');
  await page.locator('#mf-q').dispatchEvent('input');
  await b.act(page, 'm-foe-pick', { id: 'wolf' });
  await b.act(page, 'm-foe-see', { id: 'wolf' });
  const ficha = await page.locator('#modal .bcard').count();
  regla('combate · ver ficha del bestiario', ficha === 1, 'no se ve la ficha');
  await b.act(page, 'm-foe-back');
  await b.escribir(page, '#mf-init', '12');
  await b.act(page, 'm-foe-add');
  await b.act(page, 'm-foe');
  await b.escribir(page, '#mf-name', 'Bandido');
  await b.escribir(page, '#mf-ac', '12');
  await b.escribir(page, '#mf-hp', '11');
  await b.act(page, 'm-foe-add');
  F = await page.evaluate(() => MST.fight);
  regla('combate · NPC', F.list.length === 8, `${F.list.length} en la lista (deberían ser 8)`);
  const wolf = F.list.find(f => f.mon === 'wolf');
  regla('combate · iniciativa escrita al añadir', wolf && wolf.init === 12, `lobo ${JSON.stringify(wolf)}`);
  /* Algunas iniciativas, y «Empezar combate» con huecos: pregunta */
  const inis = {};
  F.list.forEach((f, i) => (inis[f.id] = [17, 9, 14, 6, 15, 3, 12, 11][i]));
  const idsSin = F.list.slice(0, 2).map(f => f.id);
  for (const f of F.list)
    if (!idsSin.includes(f.id) && f.init === '')
      await poner(page, `input[data-mf="init"][data-id="${f.id}"]`, inis[f.id]);
  await b.act(page, 'm-start');
  const preg = await page.locator('#modal [data-act="m-start-ok"]').count();
  regla('combate · empezar sin todas las iniciativas', preg === 1, 'no avisa de las iniciativas que faltan');
  await b.cerrarModal(page);
  for (const id of idsSin) await poner(page, `input[data-mf="init"][data-id="${id}"]`, inis[id]);
  await b.act(page, 'm-start');
  F = await page.evaluate(() => MST.fight);
  const orden = await page.evaluate(() => fightSorted().map(f => f.id));
  regla('combate · empezar', F.cur === orden[0] && F.round === 1, `le toca a ${F.cur}, ronda ${F.round}`);
  const btn = await page.locator('[data-act="m-next"]').count();
  regla('combate · empezar', btn === 1, 'no sale «Siguiente turno»');
  const nom = id => F.list.find(f => f.id === id).name;
  /* La lista en pantalla sigue el orden de iniciativa */
  const pant = await page.$$eval('.mlist .mname b', bs => bs.map(x => x.textContent.replace('▶ ', '')));
  regla('combate · orden', pant.join() === orden.map(nom).join(), `en pantalla: ${pant}`);
  await compMaster(m, 'combate · empezar', { recarga: true });

  /* Siguiente turno: lo comprobamos contra un modelo propio */
  const sigue = async (donde, n) => {
    for (let k = 0; k < n; k++) {
      const a = await page.evaluate(() => ({
        F: JSON.parse(JSON.stringify(MST.fight)),
        L: fightSorted().map(f => f.id),
      }));
      const down = id => {
        const f = a.F.list.find(x => x.id === id);
        return f.kind !== 'pj' && f.hp !== '' && +f.hp <= 0;
      };
      let i = a.L.indexOf(a.F.cur),
        r = a.F.round;
      for (let s = 0; s < a.L.length; s++) {
        i++;
        if (i >= a.L.length) {
          i = 0;
          r++;
        }
        if (!down(a.L[i])) break;
      }
      await b.act(page, 'm-next');
      const d = await page.evaluate(() => MST.fight);
      if (
        !regla(
          donde,
          d.cur === a.L[i] && d.round === r,
          `tras ${a.F.list.find(x => x.id === a.F.cur).name} le toca a ${(d.list.find(x => x.id === d.cur) || {}).name} en la ronda ${d.round} (debería ser ${a.F.list.find(x => x.id === a.L[i]).name}, ronda ${r})`
        )
      )
        return;
    }
  };
  await sigue('combate · siguiente turno', 17);
  F = await page.evaluate(() => MST.fight);
  regla('combate · rondas', F.round === 3, `ronda ${F.round} tras 17 turnos con 8 (debería ser 3)`);
  b.sola('«Siguiente turno» sigue la iniciativa y sube la ronda al dar la vuelta');

  /* Goblin 1 a 0 PG → ventana → muerto */
  const g1 = gobs[0].id,
    g2 = gobs[1].id;
  await poner(page, `input[data-mf="hp"][data-id="${g1}"]`, 0);
  let vent = await page.locator('#modal [data-act="m-st"]').count();
  regla('combate · goblin a 0 PG', vent === 2, 'no pregunta muerto o incapacitado');
  await b.act(page, 'm-st', { id: g1, st: 'dead' });
  F = await page.evaluate(() => MST.fight);
  regla('combate · muerto', F.list.find(f => f.id === g1).st === 'dead', 'no se apunta muerto');
  /* Goblin 2 con daño de más (−4): «Decidirlo luego» y luego incapacitado */
  await poner(page, `input[data-mf="hp"][data-id="${g2}"]`, -4);
  vent = await page.locator('#modal [data-act="m-st"]').count();
  regla('combate · goblin a −4 PG', vent === 2, 'no pregunta con PG negativos');
  await b.cerrarModal(page);
  const lbl = await page.locator(`[data-act="m-st-ask"][data-id="${g2}"]`).textContent();
  regla('combate · decidir luego', /Derrotado/.test(lbl), `la etiqueta dice «${lbl}»`);
  await b.act(page, 'm-st-ask', { id: g2 });
  await b.act(page, 'm-st', { id: g2, st: 'ko' });
  F = await page.evaluate(() => MST.fight);
  regla('combate · incapacitado', F.list.find(f => f.id === g2).st === 'ko', 'no se apunta incapacitado');
  const g2hp = F.list.find(f => f.id === g2).hp;
  if (g2hp < 0)
    nota(`Los PG de un NPC pueden quedar negativos (${g2hp}) en la lista de combate; no se corrigen a 0.`);
  await compMaster(m, 'combate · caídos', { recarga: true });
  await sigue('combate · se salta a los caídos', 14);
  /* Que nunca le toque a un caído */
  /* Curar al goblin 1: se borra el estado */
  await poner(page, `input[data-mf="hp"][data-id="${g1}"]`, 3);
  F = await page.evaluate(() => MST.fight);
  regla(
    'combate · curar',
    F.list.find(f => f.id === g1).st === undefined,
    `estado ${F.list.find(f => f.id === g1).st} tras curarlo`
  );
  await sigue('combate · vuelve a tener turno', 9);

  /* Si a quien le toca lo quitas del combate, pasa al siguiente */
  F = await page.evaluate(() => MST.fight);
  const cur = F.cur;
  await b.act(page, 'm-rm', { id: cur });
  F = await page.evaluate(() => MST.fight);
  regla(
    'combate · quitar al del turno',
    F.cur && F.cur !== cur && F.list.some(f => f.id === F.cur),
    `le toca a ${F.cur}`
  );
  /* Quitar de la mesa a un jugador al que le toca */
  await page.evaluate(() => {
    const p = MST.fight.list.find(f => f.kind === 'pj');
    MST.fight.cur = p.id;
    masterSave();
    render();
  });
  const pj = await page.evaluate(() => MST.fight.list.find(f => f.id === MST.fight.cur));
  const rAntes = (await page.evaluate(() => MST.fight)).round;
  await b.act(page, 'm-tab', { t: pj.pid });
  await b.act(page, 'm-del', { id: pj.pid });
  await b.act(page, 'm-del-ok', { id: pj.pid });
  const tras = await page.evaluate(() => ({
    on: fightOn(),
    F: MST.fight,
    btn: !!document.querySelector('[data-act="m-start"]'),
  }));
  if (!tras.on)
    b.fallo(
      'combate · quitar de la mesa al jugador del turno',
      `el combate deja de estar empezado (nadie tiene el turno; sale «Empezar combate» y al pulsarlo vuelve a la ronda 1, estaba en la ${rAntes})`
    );
  /* Lo volvemos a meter (para seguir) */
  await usarFicha(j, pj.name);
  const r = await compartirPj(j, 'volver a compartir');
  await pegarJugador(m, r.code);
  await b.act(page, 'm-tab', { t: 'combat' });
  await b.act(page, 'm-pjs');

  /* Volver a compartir tras cambiar la ficha: se actualiza en la mesa y en el combate */
  await usarFicha(j, 'Zyo');
  const zid = await j.page.evaluate(() => C().id);
  await b.paso(
    j,
    'Zyo · DES 16 y quitarse la armadura',
    async pg => {
      await b.act(pg, 'settings');
      await b.act(pg, 'open-edit');
      await poner(pg, '[data-path="abilities.dex"]', 16);
      await pg.evaluate(() => {
        const e = C().equipment.find(x => x.armor && x.equipped);
        if (e) e.equipped = false;
        save();
        render();
      });
    },
    { deshacer: false }
  );
  const r2 = await compartirPj(j, 'Zyo · compartir tras cambiar');
  const antesN = await page.evaluate(() => MST.players.length);
  const t = await pegarJugador(m, r2.code);
  regla('Zyo · actualizar', /Jugador actualizado/.test(t), `aviso: «${t}»`);
  const z = await page.evaluate(
    id => ({
      p: MST.players.filter(x => x.id === id),
      n: MST.players.length,
      f: MST.fight.list.filter(f => f.pid === id),
    }),
    zid
  );
  const zc = await j.page.evaluate(() => ({ ac: acOf(C()), dex: C().abilities.dex, i: init(C()) }));
  regla(
    'Zyo · actualizar',
    z.p.length === 1 && z.n === antesN,
    `${z.p.length} copias de Zyo, ${z.n} jugadores`
  );
  regla(
    'Zyo · actualizar',
    z.p[0].a[1] === 16 && z.p[0].ac === zc.ac && z.p[0].i === zc.i,
    `DES ${z.p[0].a[1]}, CA ${z.p[0].ac} (ficha ${zc.ac}), inic. ${z.p[0].i}`
  );
  regla(
    'Zyo · actualizar en el combate',
    z.f.length === 1 && z.f[0].ac === zc.ac,
    `en el combate: ${JSON.stringify(z.f)}`
  );
  b.sola('Volver a compartir actualiza al jugador (también su CA en el combate) sin duplicarlo');
  await compMaster(m, 'combate · Zyo actualizado', { recarga: true });

  /* El combate es de cada campaña */
  const F1 = await page.evaluate(() => JSON.stringify(MST.fight));
  const c2 = await page.evaluate(() => MST.camps.find(k => k.id !== MST.cur).id);
  const c1 = await page.evaluate(() => MST.cur);
  await usarCamp(page, c2);
  const F2 = await page.evaluate(() => MST.fight.list.length);
  regla('combate · por campaña', F2 === 0, `la campaña B tiene ${F2} en combate`);
  await usarCamp(page, c1);
  regla(
    'combate · por campaña',
    (await page.evaluate(() => JSON.stringify(MST.fight))) === F1,
    'el combate de la 1 cambia al volver'
  );
  await b.cerrarToasts(page);
  /* Terminar */
  await b.act(page, 'm-tab', { t: 'combat' });
  await b.act(page, 'm-end');
  await b.act(page, 'm-end-ok');
  F = await page.evaluate(() => MST.fight);
  regla('combate · terminar', !F.list.length && F.cur === '' && F.round === 1, JSON.stringify(F));
  const M0 = await page.evaluate(() => MST.players.length);
  regla('combate · terminar', M0 === 4, `quedan ${M0} jugadores en la mesa`);
  await compMaster(m, 'combate · terminar', { recarga: true });
}

/* ---------- 5. Tiendas ---------- */
async function crearTienda(m, nombre, oro, picks, extra) {
  const page = m.page;
  await b.act(page, 'm-tab', { t: 'shops' });
  await b.act(page, 'msh-new');
  await b.escribir(page, '#she-n', nombre);
  await b.escribir(page, '#she-g', String(oro));
  for (const p of picks) await page.locator(`input[data-she-pick="${p}"]`).check({ force: true });
  await b.act(page, 'msh-add-many');
  if (extra) {
    await poner(page, '#she-g', String(oro)); // se repinta: volvemos a escribir el dinero
    await b.elegir(page, '#she-k', 'x');
    await b.escribir(page, '#she-xn', extra.n);
    await b.escribir(page, '#she-xd', extra.d);
    await b.escribir(page, '#she-p', extra.p);
    await b.elegir(page, '#she-p-c', extra.coin);
    await b.escribir(page, '#she-q', extra.q);
    await b.act(page, 'msh-add');
  }
  return page;
}
async function tiendaJugador(j, m, shid) {
  /* El máster exporta el archivo .json de la tienda y el jugador lo importa en «Recibir del máster» */
  await b.cerrarModal(m.page);
  await b.cerrarToasts(m.page);
  await b.act(m.page, 'm-tab', { t: 'shops' });
  await b.act(m.page, 'msh-qr', { id: shid });
  await qrOk(m.page, 'tienda · QR');
  const [dl] = await Promise.all([m.page.waitForEvent('download'), b.act(m.page, 'qr-dl')]);
  const file = await dl.path();
  await b.cerrarModal(m.page);
  const prev = await j.page.evaluate(() => (C().shop ? C().shop.sess : ''));
  await ajustesMaster(j.page);
  await b.act(j.page, 'p-scan');
  await j.page.locator('#qr-file').setInputFiles(file);
  await j.page
    .waitForFunction(p => S.tab === 'shop' && C().shop && C().shop.sess !== p, prev, { timeout: 4000 })
    .catch(() => {});
  return { file, txt: fs.readFileSync(file, 'utf8') };
}
async function recibo(j, donde) {
  if (await j.page.evaluate(() => !document.getElementById('modal').hidden))
    nota(
      `${donde}: antes del recibo había una ventana abierta: «${(await j.page.locator('#modal').textContent()).trim().slice(0, 160)}»`
    );
  await b.cerrarModal(j.page);
  await b.act(j.page, 'tab', { t: 'shop' });
  await b.act(j.page, 'sh-rcpt');
  await qrOk(j.page, donde + ' · QR del recibo');
  await b.act(j.page, 'sh-copy');
  const code = await j.page.evaluate(() => navigator.clipboard.readText());
  await b.cerrarModal(j.page);
  await b.cerrarToasts(j.page);
  return code;
}
const tot = page => page.evaluate(() => totalCp(C()));
const shopM = (page, id) =>
  page.evaluate(id => JSON.parse(JSON.stringify(MST.shops.find(s => s.id === id) || null)), id);

async function tiendas(m, j, c1, c2) {
  console.log('\n— Tiendas (#tienda y #recibo)');
  const page = m.page;
  await crearTienda(
    m,
    'Herrería de Brom',
    50,
    ['w:dagger', 'p:healing', 'm:arrow', 'g:healerkit', 'a:leather'],
    {
      n: 'Mapa del tesoro',
      d: 'Un mapa viejo',
      p: '7',
      coin: 'sp',
      q: '1',
    }
  );
  /* Stock de la daga: 2; ocultar la armadura de cuero */
  const items = await page.evaluate(() => SHE.items.map(it => it.c));
  const di = items.indexOf('w:dagger'),
    li = items.indexOf('a:leather');
  await poner(page, `input[data-she="q"][data-i="${di}"]`, 2);
  await b.act(page, 'msh-hide', { i: li });
  await b.act(page, 'msh-save');
  let S1 = await page.evaluate(() => JSON.parse(JSON.stringify(MST.shops[MST.shops.length - 1])));
  regla(
    'tienda · crear',
    S1.n === 'Herrería de Brom' && S1.g === 5000 && S1.items.length === 6 && S1.ver === 1,
    `tienda ${S1.n}, ${S1.g} pc, ${S1.items.length} objetos, versión ${S1.ver}`
  );
  const it = c => S1.items.find(x => x.c === c);
  regla(
    'tienda · precios del manual',
    it('w:dagger').p === 200 &&
      it('p:healing').p === 5000 &&
      it('m:arrow').u === 20 &&
      it('g:healerkit').u === 10,
    JSON.stringify(S1.items)
  );
  regla('tienda · objeto inventado', it('x') && it('x').p === 70 && it('x').q === 1, JSON.stringify(it('x')));
  await compMaster(m, 'tienda · crear', { recarga: true });

  /* Zyo entra en la tienda */
  await usarFicha(j, 'Zyo');
  const { txt } = await tiendaJugador(j, m, S1.id);
  let c = await b.ficha(j.page);
  regla('tienda · entrar', c.shop && c.shop.id === S1.id, `tienda del jugador: ${c.shop && c.shop.n}`);
  if (!c.shop) return;
  regla(
    'tienda · objeto oculto',
    !c.shop.items.some(x => x.c === 'a:leather') && c.shop.items.length === 5,
    `el jugador ve ${c.shop.items.map(x => x.c)}`
  );
  regla('tienda · archivo', /"fichas5e": "tienda"/.test(txt), 'el archivo no es de tienda');
  await b.comprobar(j, 'tienda · entrar');
  const dinero0 = await tot(j.page);
  let libro = 0; // lo que debería haber cambiado el dinero del jugador
  const id = cc => c.shop.items.find(x => x.c === cc).id;

  /* Comprar 1 daga */
  await b.paso(j, 'tienda · comprar daga', pg => b.act(pg, 'sh-buy', { id: id('w:dagger') }));
  libro -= 200;
  c = await b.ficha(j.page);
  regla(
    'tienda · comprar daga',
    (await tot(j.page)) === dinero0 + libro,
    `dinero ${await tot(j.page)} (debería ser ${dinero0 + libro})`
  );
  regla(
    'tienda · comprar daga',
    c.shop.items.find(x => x.c === 'w:dagger').q === 1 && c.shop.g === 5200,
    `stock ${c.shop.items.find(x => x.c === 'w:dagger').q}, vendedor ${c.shop.g}`
  );
  regla(
    'tienda · comprar daga',
    c.attacks.length > 0 && c.equipment.filter(e => e.weapon === 'dagger').length >= 1,
    'no está en la mochila'
  );
  /* Comprar 2 paquetes de flechas (×20) */
  await b.paso(j, 'tienda · comprar 2 de flechas', async pg => {
    await poner(pg, `#shq-${id('m:arrow')}`, 2);
    await b.act(pg, 'sh-buy', { id: id('m:arrow') });
  });
  libro -= 200;
  c = await b.ficha(j.page);
  const fl = c.equipment.find(e => e.ammoKind === 'arrow');
  regla('tienda · flechas', fl && +fl.qty === 40, `flechas en la mochila: ${fl && fl.qty}`);
  /* Regatear la poción: 5 po (vale 50) */
  await b.paso(j, 'tienda · regatear poción', async pg => {
    await b.act(pg, 'sh-haggle', { id: id('p:healing') });
    await b.escribir(pg, '#shb-amt', '5');
    await b.act(pg, 'sh-haggle-ok');
  });
  libro -= 500;
  regla(
    'tienda · regatear',
    (await b.ficha(j.page)).equipment.some(e => e.potion === 'healing'),
    'la poción no está en la mochila'
  );
  /* Regatear por encima de lo que tienes: avisa */
  await b.act(j.page, 'sh-haggle', { id: id('g:healerkit') });
  await b.escribir(j.page, '#shb-amt', '999');
  await b.act(j.page, 'sh-haggle-ok');
  const aviso = await j.page.locator('#modal h2').textContent();
  regla('tienda · sin dinero', /insuficiente/.test(aviso), `ventana: ${aviso}`);
  await b.cerrarModal(j.page);
  /* Vender 1 de las 2 dagas que traía y la armadura */
  await b.paso(j, 'tienda · vender 1 daga por 1,5 po', async pg => {
    const i = await pg.evaluate(() => C().equipment.findIndex(e => e.weapon === 'dagger' && +e.qty === 2));
    await b.act(pg, 'sh-sell', { i });
    await b.escribir(pg, '#shs-q', '1');
    await b.escribir(pg, '#shs-amt', '1.5');
    await b.act(pg, 'sh-sell-ok');
  });
  libro += 150;
  await b.paso(j, 'tienda · vender la armadura', async pg => {
    const i = await pg.evaluate(() => C().equipment.findIndex(e => e.armor));
    await b.act(pg, 'sh-sell', { i });
    await b.escribir(pg, '#shs-amt', '4');
    await b.act(pg, 'sh-sell-ok');
  });
  const vendioArm = (await b.ficha(j.page)).shop.log.some(l => l.t === 's' && /cuero/i.test(l.name));
  regla('tienda · vender la armadura', vendioArm, 'no se ha vendido');
  if (vendioArm) libro += 400;
  regla(
    'tienda · cuentas',
    (await tot(j.page)) === dinero0 + libro,
    `dinero ${await tot(j.page)} pc (debería ser ${dinero0 + libro})`
  );
  /* Anular la compra de la poción */
  await b.paso(j, 'tienda · anular la poción', async pg => {
    const i = await pg.evaluate(() => C().shop.log.findIndex(l => /curación/.test(l.name)));
    await b.act(pg, 'sh-undo', { i });
  });
  libro += 500;
  c = await b.ficha(j.page);
  regla(
    'tienda · anular',
    (await tot(j.page)) === dinero0 + libro && !c.equipment.some(e => e.potion === 'healing'),
    `dinero ${await tot(j.page)} (debería ser ${dinero0 + libro}), poción en la mochila: ${c.equipment.some(e => e.potion === 'healing')}`
  );
  const gJug = c.shop.g;
  regla(
    'tienda · dinero del vendedor',
    gJug === 5000 + 200 + 200 - 150 - (vendioArm ? 400 : 0),
    `vendedor ${gJug}`
  );
  /* El dinero del jugador en monedas: ninguna negativa ni con decimales */
  regla(
    'tienda · monedas',
    Object.values(c.coins).every(v => Number.isInteger(+v) && +v >= 0),
    JSON.stringify(c.coins)
  );
  b.sola('La tienda del jugador lleva su dinero en piezas de cobre, el stock y el dinero del vendedor');

  /* Recibo → máster (pegando el código en «Escanear o importar recibo») */
  const rc1 = await recibo(j, 'tienda · recibo 1');
  regla(
    'tienda · recibo',
    rc1.includes('#recibo='),
    `el código no es un enlace #recibo= (${rc1.slice(0, 40)})`
  );
  /* Primero el máster lo pega donde los jugadores (+ Jugador): ¿qué dice? */
  {
    const t = await pegarJugador(m, rc1);
    const S0 = await shopM(page, S1.id);
    if (S0.ver === S1.ver)
      nota(
        `Si el máster pega un recibo en «+ Jugador → O pega su código», la app dice «${t}»: no le dice que los recibos van en Tiendas → «Escanear o importar recibo».`
      );
  }
  let t = await pegarEscaner(m, rc1);
  let S2 = await shopM(page, S1.id);
  regla('máster · aplicar recibo', /Recibo de Zyo/.test(t), `aviso: «${t}»`);
  regla(
    'máster · aplicar recibo',
    S2.g === gJug,
    `vendedor en el máster ${S2.g} pc; en el jugador ${gJug} pc`
  );
  const cJ = await b.ficha(j.page);
  for (const x of cJ.shop.items) {
    const y = S2.items.find(z => z.id === x.id);
    const q = x.c === 'w:dagger' ? 2 : x.q; // la daga que vende Zyo vuelve al stock del máster
    regla('máster · stock tras el recibo', y && y.q === q, `${x.c}: máster ${y && y.q}, debería ser ${q}`);
  }
  regla(
    'máster · lo vendido',
    S2.items.length === S1.items.length,
    `objetos: ${S2.items.map(x => x.c + '×' + x.q)}`
  );
  regla('máster · versión', S2.ver === S1.ver + 1, `versión ${S2.ver}`);
  regla('máster · registro', S2.applied && Object.keys(S2.applied).length === 1, JSON.stringify(S2.applied));
  await compMaster(m, 'máster · recibo 1', { recarga: true });
  /* El mismo recibo otra vez: nada cambia (por el escáner y por el enlace) */
  t = await pegarEscaner(m, rc1);
  regla('máster · recibo dos veces', /ya aplicado/i.test(t), `aviso: «${t}»`);
  regla(
    'máster · recibo dos veces',
    !b.difs(S2, await shopM(page, S1.id)).length,
    b.difs(S2, await shopM(page, S1.id)).join('; ')
  );
  await abrirEnlace(m, rc1);
  regla(
    'máster · recibo dos veces (enlace)',
    !b.difs(S2, await shopM(page, S1.id)).length,
    b.difs(S2, await shopM(page, S1.id)).join('; ')
  );
  b.sola('Un recibo no se aplica dos veces');
  await compMaster(m, 'máster · recibo repetido', { recarga: true });

  /* Segundo recibo de la misma visita: solo lo nuevo */
  await b.paso(j, 'tienda · comprar kit de sanador', pg => b.act(pg, 'sh-buy', { id: id('g:healerkit') }));
  libro -= 500;
  const rc2 = await recibo(j, 'tienda · recibo 2');
  t = await pegarEscaner(m, rc2);
  let S3 = await shopM(page, S1.id);
  regla('máster · segundo recibo', S3.g === S2.g + 500, `vendedor ${S3.g} (debería ser ${S2.g + 500})`);
  regla(
    'máster · segundo recibo',
    S3.g === (await b.ficha(j.page)).shop.g,
    `máster ${S3.g}, jugador ${(await b.ficha(j.page)).shop.g}`
  );
  regla(
    'tienda · cuentas',
    (await tot(j.page)) === dinero0 + libro,
    `dinero ${await tot(j.page)} (debería ser ${dinero0 + libro})`
  );

  /* «Deshacer» después del recibo y luego «Anular»: el recibo siguiente ya no cuadra con el máster */
  await b.cerrarModal(j.page);
  /* Desde el n.º 94, generar el recibo no se puede deshacer: «Deshacer» queda desactivado */
  const undoOff = await j.page.evaluate(() => {
    const u = document.querySelector('[data-act="undo"]');
    return !u || u.disabled;
  });
  regla('tienda · «Deshacer» tras el recibo', undoOff, '«Deshacer» sigue activo tras generar el recibo');
  if (!undoOff) await b.act(j.page, 'undo'); // quita la marca «ya en un recibo» de la última línea
  const trasU = await b.ficha(j.page);
  const libre = trasU.shop.log.findIndex(l => !l.r);
  if (libre >= 0) {
    nota(
      `«Deshacer» justo después de generar el recibo quita la marca «ya en un recibo» y deja «Anular» una compra que el máster ya tiene apuntada.`
    );
    await b.act(j.page, 'sh-undo', { i: libre });
    libro += 500;
    await b.act(j.page, 'sh-buy', { id: id('m:arrow') });
    libro -= 100;
    const rc3 = await recibo(j, 'tienda · recibo tras deshacer');
    const t3 = await pegarEscaner(m, rc3);
    const S4 = await shopM(page, S1.id);
    const gj = (await b.ficha(j.page)).shop.g;
    if (S4.g !== gj)
      b.fallo(
        'tienda · «Deshacer» y «Anular» tras el recibo',
        `el máster no aplica la compra nueva («${t3}») y mantiene la anulada: vendedor ${S4.g} pc en el máster y ${gj} pc en el jugador`
      );
  }
  regla(
    'tienda · cuentas',
    (await tot(j.page)) === dinero0 + libro,
    `dinero ${await tot(j.page)} (debería ser ${dinero0 + libro})`
  );
  await compMaster(m, 'máster · tras deshacer', { recarga: true });

  /* Anular la venta de todas las flechas: ¿vuelve la munición al arco? (explorador) */
  await usarFicha(j, 'Vhaeryn');
  await tiendaJugador(j, m, S1.id);
  c = await b.ficha(j.page);
  const ai = c.attacks.findIndex(a => a.ammo);
  const arco = c.attacks[ai];
  if (arco) {
    const fid = arco.ammo;
    await b.paso(j, 'explorador · vender todas las flechas', async pg => {
      const i = await pg.evaluate(f => C().equipment.findIndex(e => e.id === f), fid);
      await b.act(pg, 'sh-sell', { i });
      await b.escribir(pg, '#shs-q', '20');
      await b.escribir(pg, '#shs-amt', '1');
      await b.act(pg, 'sh-sell-ok');
    });
    c = await b.ficha(j.page);
    regla(
      'explorador · vender flechas',
      !c.equipment.some(e => e.id === fid) && !c.attacks.find(a => a.name === arco.name).ammo,
      'las flechas siguen'
    );
    await b.paso(j, 'explorador · anular la venta', async pg => {
      const i = await pg.evaluate(() => C().shop.log.findIndex(l => l.t === 's'));
      await b.act(pg, 'sh-undo', { i });
    });
    c = await b.ficha(j.page);
    const a2 = c.attacks.find(a => a.name === arco.name);
    if (c.equipment.some(e => e.id === fid) && a2.ammo !== fid)
      b.fallo(
        'explorador · anular la venta de las flechas',
        `las flechas vuelven a la mochila pero el ${a2.name} se queda sin munición enlazada (ammo «${a2.ammo}»)`
      );
  }

  /* Versión vieja: el mago entra con el QR antiguo (versión 1) y compra la última daga */
  await usarFicha(j, 'Elarion');
  const viejo = JSON.parse(txt); // archivo exportado antes de los recibos
  const vfile = `${process.env.CAPTURAS || '/tmp'}/tienda-vieja.json`;
  fs.writeFileSync(vfile, JSON.stringify(viejo));
  await ajustesMaster(j.page);
  await b.act(j.page, 'p-scan');
  await j.page.locator('#qr-file').setInputFiles(vfile);
  await j.page.waitForFunction(() => C().shop, null, { timeout: 4000 }).catch(() => {});
  c = await b.ficha(j.page);
  if (!c.shop) {
    b.fallo(
      'tienda · QR viejo',
      `el jugador no entra en la tienda: «${await toasts(j.page)}» ${await j.page.locator('#modal').textContent()}`
    );
    return;
  }
  const dg = c.shop.items.find(x => x.c === 'w:dagger');
  await b.act(j.page, 'sh-buy', { id: dg.id });
  await b.act(j.page, 'sh-buy', { id: dg.id }); // el QR viejo dice que quedan 2
  const rcv = await recibo(j, 'tienda · recibo con QR viejo');
  const sv0 = await shopM(page, S1.id);
  t = await pegarEscaner(m, rcv);
  const sv = await shopM(page, S1.id);
  regla('máster · recibo de versión vieja', /antiguo/.test(t), `no avisa del QR antiguo: «${t}»`);
  regla(
    'máster · recibo de versión vieja',
    sv.items.every(x => x.q === -1 || x.q >= 0),
    'stock negativo'
  );
  if (sv.items.find(x => x.c === 'w:dagger').q === 0 && sv0.items.find(x => x.c === 'w:dagger').q < 2)
    nota(
      `Con un QR viejo, el jugador compra ${2} dagas cuando en el máster quedaban ${sv0.items.find(x => x.c === 'w:dagger').q}: el máster las da por vendidas (stock 0) y avisa de revisar el stock; el vendedor cobra las dos.`
    );
  b.sola('Un recibo de un QR antiguo se aplica con aviso y el stock no baja de 0');

  /* Tienda de la otra campaña y tienda borrada */
  await usarCamp(page, c2);
  await b.cerrarToasts(page);
  await crearTienda(m, 'Puesto de la B', 5, ['g:torch']);
  await b.act(page, 'msh-save');
  const SB = await page.evaluate(() => JSON.parse(JSON.stringify(MST.shops[MST.shops.length - 1])));
  await crearTienda(m, 'Para borrar', 5, ['w:dagger']);
  await b.act(page, 'msh-save');
  const SX = await page.evaluate(() => JSON.parse(JSON.stringify(MST.shops[MST.shops.length - 1])));
  await usarFicha(j, 'Bruno');
  await tiendaJugador(j, m, SB.id);
  await b.act(j.page, 'sh-buy', { id: (await b.ficha(j.page)).shop.items[0].id });
  const rcB = await recibo(j, 'tienda B · recibo');
  /* El mago (mismo dispositivo) entra en la que se va a borrar */
  await usarFicha(j, 'Elarion');
  await j.page.evaluate(() => {
    C().shop.log.forEach(l => (l.r = 1));
    save();
  });
  await tiendaJugador(j, m, SX.id);
  await b.act(j.page, 'sh-buy', { id: (await b.ficha(j.page)).shop.items[0].id });
  const rcX = await recibo(j, 'tienda borrada · recibo');
  await b.act(page, 'm-tab', { t: 'shops' });
  await b.act(page, 'msh-del', { id: SX.id });
  await b.act(page, 'msh-del-ok', { id: SX.id });
  await usarCamp(page, c1);
  await b.cerrarToasts(page);
  let antes = await mst(page);
  t = await pegarEscaner(m, rcB);
  regla('máster · recibo de otra campaña', /Campaña Beta/.test(t), `aviso: «${t}»`);
  regla('máster · recibo de otra campaña', !b.difs(antes, await mst(page)).length, 'cambia algo');
  antes = await mst(page);
  t = await pegarEscaner(m, rcX);
  regla('máster · recibo de tienda borrada', /no está en este dispositivo/.test(t), `aviso: «${t}»`);
  regla('máster · recibo de tienda borrada', !b.difs(antes, await mst(page)).length, 'cambia algo');
  /* En la B sí se aplica */
  await usarCamp(page, c2);
  await b.cerrarToasts(page);
  t = await pegarEscaner(m, rcB);
  regla('máster · recibo en su campaña', /Recibo de Bruno/.test(t), `aviso: «${t}»`);
  await usarCamp(page, c1);
  await b.cerrarToasts(page);
  /* Un jugador que pega un recibo (es para el máster) y un máster que pega una tienda */
  t = await pegarEscaner(j, rcB);
  regla('jugador · pega un recibo', /para el máster/.test(t), `aviso: «${t}»`);
  const tl = await page.evaluate(id => shopLink(MST.shops.find(s => s.id === id)), S1.id);
  t = await pegarEscaner(m, tl);
  regla('máster · pega una tienda', /lo tiene que escanear un jugador/.test(t), `aviso: «${t}»`);
  /* Tienda por enlace (cámara del móvil) con compras sin recibo: pregunta */
  await usarFicha(j, 'Bruno');
  await b.act(j.page, 'sh-buy', { id: (await b.ficha(j.page)).shop.items[0].id }).catch(() => {});
  await abrirEnlace(j, tl);
  const preg = await j.page.locator('#modal [data-act="sh-enter-ok"]').count();
  regla(
    'jugador · entrar en otra tienda con compras pendientes',
    preg === 1,
    'no avisa de que se pierde el recibo'
  );
  if (preg) await b.act(j.page, 'sh-enter-ok');
  c = await b.ficha(j.page);
  regla('jugador · tienda por enlace', c.shop && c.shop.id === S1.id, `tienda ${c.shop && c.shop.n}`);
  await b.comprobar(j, 'jugador · tienda por enlace');
  /* Salir de la tienda */
  await b.paso(j, 'jugador · salir de la tienda', async pg => {
    await b.act(pg, 'tab', { t: 'shop' });
    await b.act(pg, 'sh-exit');
  });
  c = await b.ficha(j.page);
  regla('jugador · salir', !c.shop && (await j.page.evaluate(() => S.tab)) !== 'shop', 'sigue en la tienda');
  await compMaster(m, 'tiendas · final', { recarga: true });
}

/* ---------- 6. Códigos rotos ---------- */
async function rotos(m, j) {
  console.log('\n— Códigos rotos');
  const b64u = s => Buffer.from(s, 'utf8').toString('base64url');
  await usarFicha(j, 'Zyo');
  const pj = (await compartirPj(j, 'rotos · pj')).code.split('#pj=')[1];
  const sid = await m.page.evaluate(() => MST.shops[0] && MST.shops[0].id);
  const tienda = (await m.page.evaluate(id => shopLink(MST.shops.find(s => s.id === id)), sid)).split(
    '#tienda='
  )[1];
  const rec = b64u(
    JSON.stringify({ t: 'r', id: 'xx', sh: sid, v: 1, n: 'Roto', l: [['b', 'nada', 1, 100]] })
  );
  const cr = (
    await j.page.evaluate(() =>
      crLink(C(), {
        id: 'q1',
        kind: 'other',
        name: 'Mula',
        cat: 'mule',
        hp: { max: 11, current: 11 },
        attacks: [],
      })
    )
  ).split('#cr=')[1];
  const tipos = { pj, cr, tienda, recibo: rec };
  const variantes = v => [
    ['vacío', ''],
    ['espacios', '   '],
    ['texto', 'hola que tal'],
    ['mitad', v.slice(0, Math.floor(v.length / 2))],
    ['sin el final', v.slice(0, -3)],
    ['sin el principio', v.slice(5)],
    ['no es JSON', b64u('no es json')],
    ['JSON vacío', b64u('{}')],
    ['JSON null', b64u('null')],
  ];
  for (const [k, v] of Object.entries(tipos)) {
    for (const [n, x] of variantes(v)) {
      for (const via of ['máster pega', 'jugador pega', 'enlace máster', 'enlace jugador']) {
        const dev = via.includes('máster') ? m : j;
        const D = `roto · #${k} ${n} · ${via}`;
        const A0 = await mst(m.page),
          J0 = await b.estado(j.page);
        let t = '';
        try {
          if (via.endsWith('pega')) {
            if (!x.trim() && via === 'máster pega') {
              t = await pegarEscaner(dev, x);
            } else t = await pegarEscaner(dev, x ? `${APP}#${k}=${x}` : x);
          } else {
            await abrirEnlace(dev, `${APP}#${k}=${x}`);
            t = await toasts(dev.page);
            await b.cerrarModal(dev.page);
          }
        } catch (e) {
          b.fallo(D, `el guion no pudo hacerlo: ${String(e.message).split('\n')[0]}`);
        }
        consola(dev, D);
        const d1 = b.difs(A0, await mst(m.page)),
          d2 = b.difs(b.limpia(J0.S.chars), b.limpia((await b.estado(j.page)).S.chars));
        if (d1.length) b.fallo(D, `cambia el máster: ${d1.join('; ')}`);
        if (d2.length) b.fallo(D, `cambia el jugador: ${d2.join('; ')}`);
        if (via.endsWith('pega') && !t) b.fallo(D, 'no avisa de nada');
        if (via.startsWith('enlace') && x && !t && !/^(vacío|espacios)$/.test(n))
          nota(`Abrir un enlace #${k} roto (${n}) no avisa de nada: la app se abre como si nada.`);
      }
    }
  }
  /* Recibos y fichas con forma rara (códigos hechos a mano o de otra versión) */
  const raros = [
    [
      'recibo con una línea que no es lista',
      'recibo',
      { t: 'r', id: 'r1', sh: sid, v: 1, n: 'Raro', l: [5] },
    ],
    ['recibo con una línea null', 'recibo', { t: 'r', id: 'r2', sh: sid, v: 1, n: 'Raro', l: [null] }],
    [
      'recibo con números en texto',
      'recibo',
      { t: 'r', id: 'r3', sh: sid, v: 1, n: 'Raro', l: [['s', 'x', 'dos', 'mucho', 'Cosa']] },
    ],
    ['recibo vacío', 'recibo', { t: 'r', id: 'r4', sh: sid, v: 1, n: 'Raro', l: [] }],
    [
      'ficha con 2 salvaciones',
      'pj',
      { v: 1, id: 'raro1', n: 'Raro', a: [10, 10, 10, 10, 10, 10], s: [1, 2] },
    ],
    ['tienda con objetos null', 'tienda', { t: 's', id: 'ts', v: 1, n: 'Rara', g: 10, i: [null] }],
    [
      'tienda con un código de objeto desconocido',
      'tienda',
      { t: 's', id: 'ts2', v: 1, n: 'Rara', g: 10, i: [['a1', 'w:noexiste', 100, 1, 1, 0, 0, 0]] },
    ],
  ];
  for (const [n, k, o] of raros) {
    const D = `raro · ${n}`;
    const dev = k === 'tienda' ? j : m;
    await pegarEscaner(dev, `${APP}#${k}=${b64u(JSON.stringify(o))}`);
    await espera(100);
    consola(dev, D);
    if (k === 'pj') {
      await b.act(m.page, 'm-tab', { t: 'raro1' }).catch(() => {});
      const txt = await m.page.locator('#view').textContent();
      if (/NaN|undefined/.test(txt))
        b.fallo(D, 'la ventana del jugador enseña «NaN» o «undefined» en las salvaciones');
      await m.page.evaluate(() => {
        MST.players = MST.players.filter(p => p.id !== 'raro1');
        MST.tab = 'combat';
        masterSave();
        render();
      });
    }
    if (k === 'tienda' && n.includes('desconocido')) {
      const c = await b.ficha(j.page);
      if (c.shop && c.shop.id === 'ts2') {
        const t0 = await tot(j.page);
        await b.act(j.page, 'sh-buy', { id: 'a1' }).catch(() => {});
        const c2 = await b.ficha(j.page);
        if ((await tot(j.page)) !== t0 && !c2.shop.log.length)
          nota(
            `Comprar un objeto con un código que la app no conoce: se cobra (${t0 - (await tot(j.page))} pc) pero el objeto no llega a la mochila ni al registro.`
          );
        consola(j, D + ' · comprar');
        await b.comprobar(j, D + ' · comprar', { recarga: false });
        await j.page.evaluate(() => {
          C().shop = null;
          S.tab = 'play';
          save();
          render();
        });
      }
    }
  }
  await compMaster(m, 'rotos · final', { recarga: true });
  await b.comprobar(j, 'rotos · final');
  /* Archivo .json roto */
  for (const [n, txt] of [
    ['no es JSON', 'hola'],
    ['JSON de otra cosa', '{"a":1}'],
    ['fichas5e sin datos', '{"fichas5e":"tienda"}'],
    ['tienda con datos rotos', '{"fichas5e":"tienda","datos":{"t":"s"}}'],
  ]) {
    const f = `${process.env.CAPTURAS || '/tmp'}/roto.json`;
    fs.writeFileSync(f, txt);
    await ajustesMaster(j.page);
    await b.act(j.page, 'p-scan');
    await j.page.locator('#qr-file').setInputFiles(f);
    await espera(150);
    const t = await toasts(j.page);
    consola(j, `archivo roto · ${n}`);
    regla(`archivo roto · ${n}`, !!t, 'no avisa de nada');
    await b.cerrarModal(j.page);
  }
}

main().catch(async e => {
  console.error(e);
  process.exitCode = 2;
  process.exit(2);
});
