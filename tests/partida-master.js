/* Prueba de la fase 3: partida simulada desde el lado del máster. Un máster novato con dados físicos dirige al reparto contra NPC del bestiario. */
'use strict';

/* Uso: node tests/partida-master.js [--semilla=N] [--rastro]
   Dos navegadores: el del grupo de jugadores (las 4 fichas del reparto, y Brasa, un amigo que se une en la escena 3) y el del
   máster. Escenas: preparar la mesa (campaña, las 4 fichas por #pj y el búho del mago por #cr); la emboscada goblin (nivel 1:
   sorpresa, empates de iniciativa, el familiar en la lista, Dormir con su salvación repetida, NPC muertos e incapacitados,
   un PJ a 0 PG, el jefe huye en su turno); los sectarios de la cripta (Bruno sube a nivel 2 y vuelve a compartir;
   concentración del fanático, refuerzos a mitad de combate, un sectario huye en su turno al final de la ronda, un jugador
   se va de la mesa en su turno y vuelve); el puente (ogro, trol y goblins: regeneración, Bola de fuego de Brasa sobre
   varios NPC, el ogro quitado por error); y el dragón rojo adulto (legendario: acciones y resistencias legendarias,
   recarga del aliento, inmunidad).
   Los momentos clave los fija el guion (como un máster que decide); la semilla solo cambia los dados de relleno.
   Cada vez que el máster tiene que acordarse de algo, calcular algo o buscar una regla fuera de la app, se apunta («Pensar»). */

const b = require('./base');

const APP = b.URL;
const ARG = process.argv.slice(2);
const SEMILLA = +(ARG.find(a => a.startsWith('--semilla=')) || '--semilla=7').slice(10) || 7;
const RASTRO = ARG.includes('--rastro');
const CAPT = process.env.CAPTURAS || '/tmp';

/* ---------- Dados con semilla ---------- */

let st = SEMILLA >>> 0;
function azar() {
  st = (st + 0x6d2b79f5) >>> 0;
  let t = st;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const dado = n => 1 + Math.floor(azar() * n);

/* ---------- Diario, pensar y reglas ---------- */

let ESC = '';
const DIARIO = [];
function narra(t) {
  DIARIO.push(`[${ESC}] ${t}`);
  if (RASTRO) console.log(`  · ${t}`);
}
/* Cada vez que el máster piensa fuera de la app: tipo = acordarse | calcular | buscar */
const PIENSA = [];
function pensar(tipo, que) {
  PIENSA.push({ esc: ESC, tipo, que });
  if (RASTRO) console.log(`  ? (${tipo}) ${que}`);
}
const REGLAS = { ok: 0, mal: 0 };
function regla(donde, ok, que) {
  if (ok) REGLAS.ok++;
  else {
    REGLAS.mal++;
    b.fallo(`${ESC} · ${donde}`, que);
  }
  return ok;
}
const NOTAS = [];
const nota = t => NOTAS.includes(t) || NOTAS.push(t);
const espera = ms => new Promise(r => setTimeout(r, ms));
const md = v => Math.floor((v - 10) / 2);
const sg = n => (n >= 0 ? `+${n}` : `${n}`);

/* ---------- Dispositivos (como en master.js) ---------- */

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
  const t = await page.$$eval('#toasts .toast', ts => ts.map(x => x.innerText.replace(/\s+/g, ' ').trim()));
  await b.cerrarToasts(page);
  return t.join(' | ');
}
function consola(dev, donde) {
  for (const e of dev.errores.splice(0)) b.fallo(donde, `consola (${dev.nombre}): ${e.slice(0, 300)}`);
}
/* Máster: consola limpia y, si toca, recargar y que todo siga igual */
async function compMaster(m, donde, { recarga = false } = {}) {
  const D = `${ESC} · ${donde}`;
  b.INF.pasos++;
  consola(m, D);
  if (!recarga) return;
  await b.cerrarModal(m.page);
  const a = await mst(m.page);
  const g = JSON.parse((await m.page.evaluate(() => localStorage.getItem('fichas-master'))) || '{}');
  const d0 = b.difs(sinT({ on: a.on, cur: a.cur, camps: a.camps }), sinT(g));
  if (d0.length) b.fallo(D, `lo guardado no es lo que se ve: ${d0.join('; ')}`);
  await m.page.reload();
  await m.page.waitForFunction(() => typeof MST === 'object' && typeof A === 'object');
  const c = await mst(m.page);
  const d = b.difs(a, c);
  if (d.length) b.fallo(D, `al recargar (máster) cambia ${d.join('; ')}`);
  consola(m, D + ' (tras recargar)');
}
async function copiado(page) {
  const ta = page.locator('#modal textarea.code').filter({ visible: true });
  if (await ta.count()) return ta.first().inputValue();
  return page.evaluate(() => navigator.clipboard.readText());
}
async function ajustes(page) {
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
const texto = async (page, sel) => (await page.locator(sel).first().innerText()).replace(/\s+/g, ' ');

/* ---------- Jugador ---------- */

async function usarFicha(j, nombre) {
  await b.cerrarModal(j.page);
  await b.act(j.page, 'chars');
  const id = await j.page.evaluate(n => (S.chars.find(c => c.name === n) || {}).id, nombre);
  if (!id) throw new Error(`no hay ficha «${nombre}»`);
  await b.act(j.page, 'use', { id });
  await b.cerrarModal(j.page);
}
async function compartirPj(j) {
  const page = j.page;
  await ajustes(page);
  await b.act(page, 'share-open');
  await b.act(page, 'share-copy');
  const code = await copiado(page);
  await b.cerrarModal(page);
  await b.cerrarToasts(page);
  return code;
}
async function vida(page, n, m) {
  await b.act(page, 'vida');
  await b.escribir(page, '#hpAmt', n);
  await b.act(page, 'hp', { m });
  await b.cerrarModal(page);
  return toasts(page);
}
async function irA(page, t) {
  const ya = await page.evaluate(() => S.tab);
  if (ya !== t) await b.act(page, 'tab', { t });
}
const pasoActual = page => page.evaluate(() => (W ? wizSteps()[W.step][0] : null));
async function subirNivel(page, elige) {
  await b.act(page, 'settings');
  await b.act(page, 'levelup');
  for (let v = 0; v < 20; v++) {
    const s = await pasoActual(page);
    if (!s) throw new Error('el asistente se ha cerrado antes de tiempo');
    if (s === 'hp' && elige.pg) {
      await b.radio(page, 'wz-hp', 'roll');
      await b.escribir(page, '#wz-hproll', elige.pg);
    } else if (s === 'confirm') {
      await b.act(page, 'wz-apply');
      await page.waitForFunction(() => !W);
      return;
    }
    if (!(await page.locator('[data-act="wz-next"]').isEnabled()))
      throw new Error(`paso «${s}» del asistente sin completar`);
    await b.act(page, 'wz-next');
  }
  throw new Error('el asistente no termina');
}
/* Un paso del jugador con las comprobaciones de base.js */
async function pasoJ(j, donde, fn, op) {
  let out;
  const ok = await b.paso(
    j,
    `${ESC} · jugador · ${donde}`,
    async pg => {
      out = await fn(pg);
    },
    op
  );
  if (!ok) throw new Error(`no se pudo hacer «${donde}»`);
  return out;
}
/* Lo que el máster debería ver de un jugador, calculado aparte de la app */
function esperado(c) {
  const PB = b.PB(c.level),
    K = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  const per = +c.skills.perception || 0;
  return {
    a: K.map(k => c.abilities[k]),
    s: K.map(k => md(c.abilities[k]) + (c.saveProf.includes(k) ? PB : 0)),
    pp: 10 + md(c.abilities.wis) + (per === 2 ? 2 * PB : per === 1 ? PB : 0),
  };
}

/* ---------- Máster: mesa ---------- */

async function pegarJugador(m, code) {
  const page = m.page;
  await b.cerrarModal(page);
  await b.cerrarToasts(page);
  await b.act(page, 'm-add');
  await b.escribir(page, '#m-code', code);
  await b.act(page, 'm-paste');
  return toasts(page);
}
async function abrirEnlace(dev, link) {
  await dev.page.goto('about:blank');
  await dev.page.goto(link);
  await dev.page.waitForFunction(() => typeof MST === 'object' && typeof A === 'object');
  await espera(50);
}
/* Un jugador comparte y el máster lo pega; comprueba lo que llega */
async function llegaJugador(m, j, nombre, { enlace = false } = {}) {
  await usarFicha(j, nombre);
  const code = await compartirPj(j);
  let t;
  if (enlace) {
    await abrirEnlace(m, code);
    t = await toasts(m.page);
  } else t = await pegarJugador(m, code);
  const c = await b.ficha(j.page);
  const app = await j.page.evaluate(() => ({ ac: acOf(C()), i: init(C()) }));
  const p = await m.page.evaluate(id => MST.players.find(x => x.id === id), c.id);
  const D = `${nombre} llega a la mesa`;
  if (!regla(D, !!p, `no ha llegado al máster («${t}»)`)) return { t, c };
  const e = esperado(c);
  regla(D, JSON.stringify(p.a) === JSON.stringify(e.a), `características ${p.a} (deberían ser ${e.a})`);
  regla(D, JSON.stringify(p.s) === JSON.stringify(e.s), `salvaciones ${p.s} (deberían ser ${e.s})`);
  regla(D, p.pp === e.pp, `Percepción pasiva ${p.pp} (debería ser ${e.pp})`);
  regla(D, p.ac === app.ac && p.i === app.i, `CA ${p.ac}/inic. ${p.i} (la ficha dice ${app.ac}/${app.i})`);
  regla(D, p.c.includes(`${c.class} ${c.level}`), `clase y nivel en la mesa: «${p.c}»`);
  return { t, c, p };
}

/* ---------- Máster: lista de combate ---------- */

const FST = page =>
  page.evaluate(() => ({ F: JSON.parse(JSON.stringify(MST.fight)), L: fightSorted().map(f => f.id) }));
const caido = f => f.kind !== 'pj' && f.hp !== '' && +f.hp <= 0;
const nombreDe = (s, id) => (s.F.list.find(f => f.id === id) || { name: '(nadie)' }).name;
async function actual(m) {
  const s = await FST(m.page);
  return s.F.list.find(f => f.id === s.F.cur) || null;
}
const porNombre = async (m, n) => (await FST(m.page)).F.list.find(f => f.name === n);
async function aCombate(page) {
  await b.cerrarModal(page);
  await b.cerrarToasts(page);
  if ((await page.evaluate(() => MST.tab)) !== 'combat') await b.act(page, 'm-tab', { t: 'combat' });
}

/* Añade NPC del bestiario con la ventana «Añadir NPC», como el máster */
async function añadirNPC(m, { q, id, n = 1, init = '', nombre = '' }) {
  const page = m.page;
  await aCombate(page);
  const antes = (await FST(page)).F.list.map(f => f.id);
  await b.act(page, 'm-foe');
  await b.escribir(page, '#mf-q', q);
  await page.locator('#mf-q').dispatchEvent('input');
  const enc = await page.locator(`#mf-res [data-act="m-foe-pick"][data-id="${id}"]`).count();
  regla(`bestiario · buscar «${q}»`, enc > 0, `no sale ${id} al buscar «${q}»`);
  await b.act(page, 'm-foe-pick', { id }, '#mf-res');
  const hint = await texto(page, '#modal');
  if (nombre) await b.escribir(page, '#mf-name', nombre);
  await b.escribir(page, '#mf-n', n);
  if (init !== '') await b.escribir(page, '#mf-init', init);
  await b.act(page, 'm-foe-add');
  const s = await FST(page);
  const nuevos = s.F.list.filter(f => !antes.includes(f.id));
  const bb = await page.evaluate(i => bestGet(i), id);
  const D = `añadir ${n} × ${bb.n}`;
  regla(D, nuevos.length === n, `${nuevos.length} añadidos`);
  regla(
    D,
    nuevos.every(
      f => f.mon === id && f.ac === bb.ac && f.hp === bb.hp && f.hpMax === bb.hp && f.ib === md(bb.ab[1])
    ),
    `CA, PG o iniciativa no cuadran con el bestiario: ${JSON.stringify(nuevos[0])}`
  );
  if (init !== '')
    regla(
      D,
      nuevos.every(f => f.init === +init),
      `iniciativa ${nuevos.map(f => f.init)}`
    );
  narra(
    `Añade ${n > 1 ? `${n} × ` : ''}${nombre || bb.n} (CA ${bb.ac}, PG ${bb.hp}, inic. ${sg(md(bb.ab[1]))}${init !== '' ? `; iniciativa ${init}` : ''}).`
  );
  return { nuevos, hint, bb };
}
async function ponerIni(m, id, v) {
  await aCombate(m.page);
  await poner(m.page, `input[data-mf="init"][data-id="${id}"]`, v);
}
/* Pone los PG de un NPC (lo único que deja la lista: escribir el resultado). Devuelve si pregunta cómo queda. */
async function ponerPG(m, id, v) {
  await aCombate(m.page);
  await poner(m.page, `input[data-mf="hp"][data-id="${id}"]`, v);
  return (await m.page.locator('#modal [data-act="m-st"]').count()) === 2;
}
/* El máster resta el daño de cabeza y escribe el resultado */
async function dañar(m, id, dmg, por, { st: estado = 'dead', crudo = false } = {}) {
  const s = await FST(m.page);
  const f = s.F.list.find(x => x.id === id);
  const nuevo = Math.max(0, +f.hp - dmg);
  pensar('calcular', 'Restar el daño de cabeza: la lista solo deja escribir los PG que quedan');
  /* crudo: el máster escribe la resta tal cual, aunque salga negativa (n.º 100: la app la deja en 0) */
  const pregunta = await ponerPG(m, id, crudo ? +f.hp - dmg : nuevo);
  const d = (await FST(m.page)).F.list.find(x => x.id === id);
  regla(
    crudo ? `n.º 100 (PG negativos) · ${f.name}` : `daño a ${f.name}`,
    d.hp === nuevo,
    `PG ${d.hp} (deberían ser ${nuevo}${crudo ? `; el máster escribió ${+f.hp - dmg}` : ''})`
  );
  if (nuevo === 0) {
    regla(`${f.name} cae`, pregunta, 'no pregunta si queda muerto o incapacitado');
    if (pregunta) await b.act(m.page, 'm-st', { id, st: estado }, '#modal');
    const e = (await FST(m.page)).F.list.find(x => x.id === id);
    regla(`${f.name} cae`, e.st === estado, `estado ${e.st} (debería ser ${estado})`);
  }
  narra(
    `${por}: ${dmg} de daño a ${f.name} (${f.hp} → ${nuevo} PG)${nuevo === 0 ? ` · ${estado === 'dead' ? 'muerto' : 'incapacitado'}` : ''}.`
  );
  return nuevo;
}
/* «Siguiente turno», comprobado con un modelo propio: el siguiente que no sea un NPC caído; al dar la vuelta, sube la ronda */
async function siguiente(m, donde = 'siguiente turno') {
  const page = m.page;
  await aCombate(page);
  const a = await FST(page);
  const down = id => caido(a.F.list.find(x => x.id === id));
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
  const d = await FST(page);
  regla(
    donde,
    d.F.cur === a.L[i] && d.F.round === r,
    `tras ${nombreDe(a, a.F.cur)} le toca a ${nombreDe(d, d.F.cur)} en la ronda ${d.F.round} (debería ser ${nombreDe(a, a.L[i])}, ronda ${r})`
  );
  return d.F.list.find(f => f.id === d.F.cur);
}
/* Comprueba que le toca a quien dice la partida */
async function leToca(m, nombre, ronda) {
  const s = await FST(m.page);
  const f = s.F.list.find(x => x.id === s.F.cur);
  const ok = f && f.name === nombre && (ronda === undefined || s.F.round === ronda);
  if (!ok)
    throw new Error(
      `le toca a ${f ? f.name : '(nadie)'} en la ronda ${s.F.round} (la partida esperaba a ${nombre}${ronda ? `, ronda ${ronda}` : ''})`
    );
  narra(`— Turno de ${nombre}${ronda ? ` (ronda ${ronda})` : ''}.`);
}
/* Quita a alguien de la lista con la «×» y comprueba a quién le toca: lo mismo que si hubiera pulsado «Siguiente turno» */
async function quitarX(m, id, donde) {
  const page = m.page;
  await aCombate(page);
  const a = await FST(page);
  const eraSuTurno = a.F.cur === id;
  let esp = a.F.cur,
    r = a.F.round;
  if (eraSuTurno) {
    const L = a.L;
    let i = L.indexOf(id);
    for (let s = 0; s < L.length; s++) {
      i++;
      if (i >= L.length) {
        i = 0;
        r++;
      }
      if (L[i] !== id && !caido(a.F.list.find(x => x.id === L[i]))) break;
    }
    esp = L[i];
  }
  await b.act(page, 'm-rm', { id });
  const d = await FST(page);
  regla(donde, !d.F.list.some(f => f.id === id), 'sigue en la lista');
  const ok = regla(
    donde,
    d.F.cur === esp && d.F.round === r,
    `le toca a ${nombreDe(d, d.F.cur)} en la ronda ${d.F.round} (debería ser ${nombreDe(a, esp)}, ronda ${r})`
  );
  return { ok, esp, r, d };
}

/* ===================================================================================== */
/* Escena 0 · Preparar la mesa */

async function escena0(m, j) {
  ESC = 'Escena 0 · Preparar la mesa';
  console.log(`\n— ${ESC}`);
  const page = m.page;
  for (const f of ['zyo.json', 'explorador.json', 'monje.json', 'mago.json'])
    await b.importar(j.page, b.leerFicha(f));
  await b.comprobar(j, `${ESC} · jugador · importar las 4 fichas`);
  /* El máster pasa a modo máster desde la bienvenida */
  await b.act(page, 'master-on');
  let M = await mst(page);
  regla('modo máster', M.on && M.camps.length === 1, `modo ${M.on}, ${M.camps.length} campañas`);
  await b.act(page, 'camp-open');
  await b.act(page, 'camp-ren', { id: M.cur });
  await b.escribir(page, '#camp-rn', 'Los jueves');
  await b.act(page, 'camp-ren-ok', { id: M.cur });
  await b.cerrarModal(page);
  M = await mst(page);
  regla('campaña', M.camps[0].n === 'Los jueves', `nombre «${M.camps[0].n}»`);
  narra('El máster crea la campaña «Los jueves».');
  await compMaster(m, 'campaña', { recarga: true });
  /* Zyo por enlace (el máster escanea con la cámara del móvil); los demás pegan su código */
  await llegaJugador(m, j, 'Zyo', { enlace: true });
  for (const n of ['Vhaeryn', 'Bruno', 'Elarion']) await llegaJugador(m, j, n);
  M = await mst(page);
  regla('4 jugadores', M.camps[0].players.length === 4, `${M.camps[0].players.length} jugadores`);
  narra('Llegan Zyo, Vhaeryn, Bruno y Elarion con su QR.');
  b.sola(
    'Las fichas llegan al máster con #pj: características, salvaciones, CA, Percepción pasiva e iniciativa'
  );
  /* El búho de Elarion por #cr */
  await usarFicha(j, 'Elarion');
  await pasoJ(j, 'Elarion invoca a su búho (Plumas)', async pg => {
    await b.act(pg, 'tab', { t: 'crea' });
    await b.act(pg, 'crea-new');
    await b.act(pg, 'crea-kind', { k: 'familiar' });
    await b.elegir(pg, '#cx-cat', 'owl');
    await espera(50);
    await b.escribir(pg, '#cx-name', 'Plumas');
    await b.act(pg, 'crea-save');
  });
  const owl = (await b.ficha(j.page)).companions.find(x => x.name === 'Plumas');
  await b.act(j.page, 'tab', { t: 'crea' });
  await b.act(j.page, 'crea-share', { id: owl.id });
  await b.act(j.page, 'cr-copy');
  const code = await copiado(j.page);
  await b.cerrarModal(j.page);
  const t = await pegarJugador(m, code);
  regla('búho por #cr', /Criatura de Elarion/.test(t), `aviso «${t}»`);
  const el = await page.evaluate(() => MST.players.find(p => p.n === 'Elarion'));
  const cr = (el.crs || []).find(x => x.id === owl.id);
  regla('búho por #cr', cr && cr.ac === 11 && cr.pp === 15, `en la mesa: ${JSON.stringify(cr)}`);
  const tarjeta = await texto(page, '#view .mview');
  regla('búho en la pestaña de Elarion', /Plumas/.test(tarjeta), 'no sale la tarjeta del búho');
  if (!/PG|puntos de golpe/i.test(tarjeta.split('Plumas')[1] || ''))
    pensar(
      'buscar',
      'PG del familiar: el código #cr no los trae; hay que buscar la criatura en el bestiario'
    );
  narra('Elarion pasa a Plumas, su búho, por #cr.');
  b.sola('Las criaturas de los jugadores llegan con #cr y salen en la pestaña de su jugador');
  await compMaster(m, 'mesa preparada', { recarga: true });
}

/* ===================================================================================== */
/* Escena 1 · Emboscada goblin (nivel 1) */

async function escena1(m, j) {
  ESC = 'Escena 1 · Emboscada goblin';
  console.log(`\n— ${ESC}`);
  const page = m.page;
  await aCombate(page);
  await b.act(page, 'm-pjs');
  let s = await FST(page);
  regla(
    'añadir jugadores',
    s.F.list.filter(f => f.kind === 'pj').length === 4,
    `${s.F.list.length} en la lista`
  );
  /* PJ en la lista: CA e iniciativa de su ficha */
  const pjs = await page.evaluate(() =>
    MST.fight.list.filter(f => f.kind === 'pj').map(f => ({ f, p: MST.players.find(p => p.id === f.pid) }))
  );
  regla(
    'jugadores en la lista',
    pjs.every(x => x.f.ac === x.p.ac),
    `CA en la lista distinta de la ficha: ${pjs.map(x => `${x.f.name} ${x.f.ac}/${x.p.ac}`)}`
  );
  /* Tres goblins guerreros con una sola tirada (grupo), el jefe aparte y el búho del mago */
  const g = await añadirNPC(m, { q: 'goblin guerrero', id: 'goblin-warrior', n: 3, init: 14 });
  regla(
    'n.º 99 (iniciativa de 2024)',
    /2024/.test(g.hint) && /mano/.test(g.hint),
    'la ventana de añadir NPC ya no avisa de que algunos monstruos tienen más iniciativa en 2024'
  );
  regla(
    'nombres',
    g.nuevos.map(f => f.name).join() === 'Goblin guerrero 1,Goblin guerrero 2,Goblin guerrero 3',
    `nombres ${g.nuevos.map(f => f.name)}`
  );
  narra('Los tres goblins guerreros tiran una sola vez (grupo de criaturas iguales): 12 + 2 = 14.');
  const jefe = (await añadirNPC(m, { q: 'jefe goblin', id: 'goblin-boss', init: 16 })).nuevos[0];
  pensar(
    'acordarse',
    'El familiar no entra con «Añadir jugadores»: hay que añadirlo a mano como NPC (desde el bestiario) aunque es un aliado'
  );
  const plumas = (await añadirNPC(m, { q: 'búho', id: 'owl', init: 9, nombre: 'Plumas' })).nuevos[0];
  regla('familiar en la lista', plumas.name === 'Plumas', `nombre ${plumas.name}`);
  const fam = await texto(page, `.mrow:has([data-id="${plumas.id}"]) .mname`);
  if (/NPC/.test(fam) && !/Elarion|aliad/i.test(fam))
    pensar('acordarse', 'El familiar sale como «NPC», igual que los enemigos: no dice que es de Elarion');
  /* Sorpresa: los goblins les tienden una emboscada */
  pensar(
    'acordarse',
    'Sorpresa: decir a los jugadores que tiran la iniciativa con desventaja (la lista del máster no lo pregunta)'
  );
  const PJ_INI = { Zyo: 19, Bruno: 17, Vhaeryn: 14, Elarion: 7 };
  s = await FST(page);
  for (const f of s.F.list.filter(x => x.kind === 'pj')) {
    const p = await page.evaluate(id => MST.players.find(q => q.id === id), f.pid);
    const d = PJ_INI[f.name] - p.i;
    regla(`iniciativa de ${f.name}`, d >= 1 && d <= 20, `haría falta sacar ${d} en el d20`);
    await ponerIni(m, f.id, PJ_INI[f.name]);
    narra(
      `${f.name} tira con desventaja: ${d} y ${Math.min(20, d + dado(6))}; se queda el ${d}: ${d} ${sg(p.i)} = ${PJ_INI[f.name]}.`
    );
  }
  /* Empate: Vhaeryn (14) con los goblins (14) */
  s = await FST(page);
  const orden = s.L.map(id => nombreDe(s, id));
  const esp = [
    'Zyo',
    'Bruno',
    'Jefe goblin',
    'Goblin guerrero 1',
    'Goblin guerrero 2',
    'Goblin guerrero 3',
    'Vhaeryn',
    'Plumas',
    'Elarion',
  ];
  regla('orden de iniciativa', orden.join() === esp.join(), `orden ${orden.join(', ')}`);
  pensar(
    'acordarse',
    'Empate de iniciativa (Vhaeryn y los goblins con 14): lo decide el máster, pero la lista los ordena por nombre y no deja cambiarlo'
  );
  /* El truco para deshacer el empate: escribir 14.5 (el máster decide que Vhaeryn va antes) */
  const vh = s.F.list.find(f => f.name === 'Vhaeryn');
  await ponerIni(m, vh.id, '14.5');
  const s2 = await FST(page);
  const truco = nombreDe(s2, s2.L[3]) === 'Vhaeryn';
  narra(
    `El máster prueba a escribir 14.5 para Vhaeryn: ${truco ? 'pasa delante de los goblins' : 'no cambia el orden'}.`
  );
  if (truco)
    nota(
      'Escribir una iniciativa con decimales (14.5) deshace un empate, pero la app no lo dice en ningún sitio.'
    );
  await ponerIni(m, vh.id, 14);
  await b.act(page, 'm-start');
  s = await FST(page);
  regla(
    'empezar combate',
    nombreDe(s, s.F.cur) === 'Zyo' && s.F.round === 1,
    `le toca a ${nombreDe(s, s.F.cur)}, ronda ${s.F.round}`
  );
  await compMaster(m, 'empezar combate', { recarga: true });
  /* Bruno en su app: combate */
  await usarFicha(j, 'Bruno');
  await pasoJ(j, 'Bruno empieza el combate', async pg => {
    await irA(pg, 'combat');
    await b.act(pg, 'cb-start');
  });

  const id = n => s.F.list.find(f => f.name === n).id;
  const G1 = id('Goblin guerrero 1'),
    G2 = id('Goblin guerrero 2'),
    G3 = id('Goblin guerrero 3');

  /* Ronda 1 */
  await leToca(m, 'Zyo', 1);
  narra('Zyo lanza Explosión sobrenatural al goblin 1: impacta (15 contra CA 15).');
  b.sola('La lista enseña la CA de cada NPC para saber si un ataque impacta');
  await dañar(m, G1, 6, 'Explosión sobrenatural');
  await siguiente(m);
  await leToca(m, 'Bruno');
  await dañar(m, G1, 5, 'Bruno, golpe desarmado', { st: 'dead' });
  await siguiente(m);
  await leToca(m, 'Jefe goblin');
  pensar('buscar', 'Ataques del jefe goblin: hay que abrir «Ver ficha» (la lista no los resume)');
  narra('El jefe goblin ataca dos veces a Bruno (Ataque múltiple): 6 y 5 de daño.');
  const pj = (await b.ficha(j.page)).hp;
  await pasoJ(j, 'Bruno recibe 6 y 5', async pg => {
    await vida(pg, 6, 'dmg');
    await vida(pg, 5, 'dmg');
  });
  const cB = await b.ficha(j.page);
  regla(
    'Bruno a 0 PG',
    cB.hp.current === 0 && cB.conditions.includes('Inconsciente'),
    `PG ${cB.hp.current} (tenía ${pj.current}), estados ${cB.conditions}`
  );
  pensar(
    'acordarse',
    'Bruno está a 0 PG: la lista no lo marca (los PJ no llevan PG en la lista); un ataque a 5 pies contra él es crítico'
  );
  await siguiente(m, 'siguiente turno: se salta al goblin 1 (muerto)');
  await leToca(m, 'Goblin guerrero 2');
  narra('El goblin 2 dispara a Plumas: 4 de daño.');
  await dañar(m, plumas.id, 4, 'Arco corto del goblin 2', { st: 'dead' });
  pensar(
    'acordarse',
    'Decir a Elarion que su familiar ha desaparecido (puede volver a invocarlo con el ritual)'
  );
  await siguiente(m);
  await leToca(m, 'Goblin guerrero 3');
  narra('El goblin 3 ataca a Vhaeryn: 12 contra CA de la lista; falla.');
  await siguiente(m);
  await leToca(m, 'Vhaeryn');
  await dañar(m, jefe.id, 11, 'Arco largo con Marca del cazador');
  await siguiente(m, 'siguiente turno: se salta a Plumas (muerto)');
  await leToca(m, 'Elarion');
  narra('Elarion lanza Dormir sobre los goblins 2 y 3: salvación de SAB CD 13.');
  pensar(
    'buscar',
    'Salvación de SAB de cada goblin: la lista no la tiene; «Ver ficha» da SAB 8 y hay que sacar el −1'
  );
  narra('Goblin 2: 7 − 1 = 6, falla: queda Incapacitado. Goblin 3: 16 − 1 = 15, supera.');
  pensar(
    'acordarse',
    'Estado de un NPC (Dormir: Incapacitado hasta el final de su siguiente turno): la lista no tiene dónde apuntarlo'
  );
  await compMaster(m, 'ronda 1', { recarga: true });

  /* Ronda 2 */
  await siguiente(m, 'siguiente turno: nueva ronda');
  await leToca(m, 'Zyo', 2);
  await dañar(m, G3, 8, 'Explosión sobrenatural');
  await siguiente(m);
  await leToca(m, 'Bruno');
  b.sola('Un PJ a 0 PG sigue teniendo turno en la lista (para su salvación contra muerte)');
  await pasoJ(j, 'Bruno: salvación contra muerte (sale 13)', async pg => {
    await irA(pg, 'combat');
    await b.act(pg, 'ds-roll', { r: 'ok' }, '.death');
  });
  regla('salvación contra muerte', (await b.ficha(j.page)).deathSaves.success === 1, 'no apunta el éxito');
  await siguiente(m);
  await leToca(m, 'Jefe goblin');
  narra(
    'El jefe goblin, malherido, usa Huida ágil (Destrabarse) y huye del puente: el máster lo quita con la «×».'
  );
  const q = await quitarX(m, jefe.id, 'el jefe huye en su turno (×)');
  if (!q.ok) {
    /* El máster pulsa «Siguiente turno» para saltar al muerto */
    const f = await actual(m);
    if (f && caido(f)) {
      pensar(
        'acordarse',
        'Tras quitar con la «×» a quien tenía el turno, le toca a un NPC muerto: hay que pulsar «Siguiente turno» otra vez'
      );
      await siguiente(m);
    }
  }
  await leToca(m, 'Goblin guerrero 2');
  narra(
    'El goblin 2 está dormido: no hace nada. Al final de su turno repite la salvación de SAB: 5 − 1 = 4, falla: Inconsciente.'
  );
  pensar('acordarse', 'Salvación que se repite al final del turno del NPC (Dormir): nadie lo recuerda');
  await siguiente(m);
  await leToca(m, 'Goblin guerrero 3');
  narra('El goblin 3 ataca a Vhaeryn: 17, impacta; 5 de daño.');
  await siguiente(m);
  await leToca(m, 'Vhaeryn');
  await dañar(m, G3, 7, 'Arco largo', { st: 'dead' });
  await siguiente(m);
  await leToca(m, 'Elarion');
  narra('Elarion da a Bruno una poción de curación: 2d4 + 2 = 7.');
  await pasoJ(j, 'Bruno bebe una poción (7 PG)', pg => vida(pg, 7, 'heal'));
  const cB2 = await b.ficha(j.page);
  regla(
    'Bruno se levanta',
    cB2.hp.current === 7 && !cB2.conditions.includes('Inconsciente') && cB2.deathSaves.success === 0,
    `PG ${cB2.hp.current}, ${cB2.conditions}, ${JSON.stringify(cB2.deathSaves)}`
  );

  /* Ronda 3: capturan al goblin dormido */
  await siguiente(m, 'siguiente turno: nueva ronda');
  await leToca(m, 'Zyo', 3);
  pensar(
    'buscar',
    'Atacar a un Inconsciente: ventaja, y crítico si es a 5 pies (regla de estados, fuera de la lista)'
  );
  narra(
    'Zyo golpea con su arma de pacto al goblin dormido: crítico. Quieren interrogarlo: el máster elige «Incapacitado».'
  );
  await dañar(m, G2, 10, 'Arma de pacto (cuerpo a cuerpo)', { st: 'ko' });
  const sGo = await FST(page);
  const enPie = sGo.F.list.filter(f => f.kind !== 'pj' && !caido(f));
  regla('sin enemigos en pie', enPie.length === 0, `quedan ${enPie.map(f => f.name)}`);
  if (!/terminar/i.test(await texto(page, '.mfight .hint')))
    pensar('acordarse', 'No queda ningún enemigo en pie: la lista no avisa de que el combate ha acabado');
  /* Un NPC curado se levanta (el goblin capturado recupera 1 PG tras un descanso) */
  await ponerPG(m, G2, 1);
  regla('NPC que se levanta', !(await porNombre(m, 'Goblin guerrero 2')).st, 'conserva el estado de caído');
  narra('El goblin capturado recupera 1 PG: deja de estar caído.');
  await ponerPG(m, G2, 0);
  await b.act(page, 'm-st', { id: G2, st: 'ko' }, '#modal');
  await compMaster(m, 'fin del combate', { recarga: true });
  /* Puntos de experiencia */
  const bb = await page.evaluate(() => bestCard(bestGet('goblin-warrior')));
  regla('PX en la ficha', /50 PX/.test(bb), 'la ficha del goblin guerrero no dice 50 PX');
  pensar(
    'calcular',
    'Puntos de experiencia del combate: sumar los PX de cada NPC derrotado (están en «Ver ficha») y repartirlos entre los jugadores'
  );
  narra(`PX: 3 goblins guerreros × 50 = 150 (el jefe huyó): ${150 / 4} para cada uno.`);
  await b.act(page, 'm-end');
  await b.act(page, 'm-end-ok');
  s = await FST(page);
  regla('terminar combate', !s.F.list.length && s.F.round === 1 && s.F.cur === '', JSON.stringify(s.F));
  regla('terminar combate', (await page.evaluate(() => MST.players.length)) === 4, 'se pierden jugadores');
  pensar(
    'acordarse',
    'El goblin capturado desaparece de la lista al terminar el combate: hay que apuntarlo aparte'
  );
  await pasoJ(j, 'Bruno termina el combate', async pg => {
    await irA(pg, 'combat');
    await b.act(pg, 'cb-end');
    await b.act(pg, 'cb-end-ok');
  });
  await compMaster(m, 'combate terminado', { recarga: true });
}

/* ===================================================================================== */
/* Escena 2 · Sectarios en la cripta (Bruno nivel 2) */

async function escena2(m, j) {
  ESC = 'Escena 2 · Sectarios en la cripta';
  console.log(`\n— ${ESC}`);
  const page = m.page;
  /* Bruno sube a nivel 2 y vuelve a compartir */
  await usarFicha(j, 'Bruno');
  await pasoJ(j, 'descanso largo', async pg => {
    await b.act(pg, 'rest-menu');
    await b.act(pg, 'long');
    await b.act(pg, 'long-done');
  });
  await pasoJ(j, 'Bruno sube a nivel 2 (PG: sale 5)', pg => subirNivel(pg, { pg: 5 }));
  const nAntes = await page.evaluate(() => MST.players.length);
  const r = await llegaJugador(m, j, 'Bruno');
  regla('Bruno vuelve a compartir', /Jugador actualizado/.test(r.t), `aviso «${r.t}»`);
  regla('Bruno vuelve a compartir', (await page.evaluate(() => MST.players.length)) === nAntes, 'se duplica');
  narra('Bruno sube a nivel 2 y vuelve a enseñar su QR: la mesa dice «Monje 2».');
  await compMaster(m, 'Bruno nivel 2', { recarga: true });

  await aCombate(page);
  await b.act(page, 'm-pjs');
  const fan = (await añadirNPC(m, { q: 'sectario fanatico', id: 'cultist-fanatic', init: 17 })).nuevos[0];
  const sec = (await añadirNPC(m, { q: 'sectario', id: 'cultist', n: 4, init: 8 })).nuevos;
  let s = await FST(page);
  for (const [n, v] of Object.entries({ Vhaeryn: 20, Elarion: 15, Bruno: 13, Zyo: 11 }))
    await ponerIni(m, s.F.list.find(f => f.name === n).id, v);
  await b.act(page, 'm-start');
  s = await FST(page);
  const orden = s.L.map(id => nombreDe(s, id)).join(', ');
  regla(
    'orden',
    orden ===
      'Vhaeryn, Sectario fanático, Elarion, Bruno, Zyo, Sectario 1, Sectario 2, Sectario 3, Sectario 4',
    orden
  );
  await compMaster(m, 'empezar', { recarga: true });

  /* Ronda 1 */
  await leToca(m, 'Vhaeryn', 1);
  await dañar(m, fan.id, 9, 'Arco largo');
  await siguiente(m);
  await leToca(m, 'Sectario fanático');
  narra('El fanático lanza Inmovilizar persona a Bruno: falla la salvación de SAB y queda Paralizado.');
  pensar('acordarse', 'El fanático se concentra en Inmovilizar persona: la lista no lo marca');
  pensar(
    'buscar',
    'Arma espiritual (acción adicional del fanático) también es de concentración en 2024: no puede llevar las dos'
  );
  await siguiente(m);
  await leToca(m, 'Elarion');
  narra('Elarion lanza Proyectil mágico al fanático: 3 dardos de 1d4 + 1 (3, 4 y 4).');
  await dañar(m, fan.id, 11, 'Proyectil mágico');
  pensar(
    'calcular',
    'Concentración del NPC al recibir daño: salvación de CON con CD 10 o la mitad del daño (y con Proyectil mágico, ¿una por dardo? por confirmar)'
  );
  narra('El fanático supera la salvación de concentración (CON +1): 14.');
  await siguiente(m);
  await leToca(m, 'Bruno');
  narra('Bruno está Paralizado: no hace nada. Al final de su turno repite la salvación de SAB: falla.');
  await siguiente(m);
  await leToca(m, 'Zyo');
  await dañar(m, sec[0].id, 10, 'Explosión sobrenatural', { st: 'dead' });
  await siguiente(m, 'siguiente turno: se salta al sectario 1 (muerto)');
  await leToca(m, 'Sectario 2');
  narra('El sectario 2 ataca a Zyo: falla.');
  await siguiente(m);
  await leToca(m, 'Sectario 3');
  pensar('buscar', 'Atacar a un Paralizado: ventaja y crítico a 5 pies');
  narra('El sectario 3 apuñala a Bruno paralizado: crítico, 2d4 + 1 + 2 necrótico = 8.');
  await usarFicha(j, 'Bruno');
  await pasoJ(j, 'Bruno recibe 8', pg => vida(pg, 8, 'dmg'));
  await siguiente(m);
  await leToca(m, 'Sectario 4');
  narra(
    'El sectario 4, el último de la ronda, sale corriendo escaleras arriba: el máster lo quita con la «×».'
  );
  const q = await quitarX(m, sec[3].id, 'el último de la ronda huye en su turno (×)');
  void q;
  /* Para seguir la partida, que le toque a Vhaeryn (si la app no lo ha hecho, ya lo ha apuntado quitarX) */
  let f = await actual(m);
  regla('tras huir el último', f && f.name === 'Vhaeryn', `le toca a ${f && f.name}`);
  const rondaApp = (await FST(page)).F.round;
  if (rondaApp !== 2)
    pensar(
      'acordarse',
      `La ronda se queda en ${rondaApp} al quitar al último de la ronda: el máster lleva la cuenta de cabeza`
    );
  /* Refuerzos: dos sectarios más bajan la escalera. El máster olvida la iniciativa */
  const ref = (await añadirNPC(m, { q: 'sectario', id: 'cultist', n: 2 })).nuevos;
  s = await FST(page);
  const nom = ref.map(x => x.name);
  const repes = s.F.list.filter(x => nom.includes(x.name)).length;
  regla(
    'refuerzos: nombres',
    repes === nom.length,
    `los refuerzos se llaman ${nom.join(' y ')}, igual que otros sectarios de la lista (${repes} filas con esos nombres)`
  );
  regla(
    'refuerzos sin iniciativa',
    s.L.slice(-2).every(id => ref.some(x => x.id === id)),
    'los NPC sin iniciativa no van al final'
  );
  regla(
    'refuerzos',
    s.F.cur === f.id && s.F.round === rondaApp,
    'añadir a mitad de combate cambia el turno o la ronda'
  );
  const avisa = /iniciativa/i.test(await toasts(page));
  if (!avisa)
    pensar(
      'acordarse',
      'Los refuerzos añadidos sin iniciativa van al final de la lista sin ningún aviso: hay que acordarse de tirarla'
    );
  for (const x of ref) await ponerIni(m, x.id, 16);
  narra('Los refuerzos tiran: 14 + 2 = 16. Actúan esta ronda, después del fanático.');

  /* Ronda 2: Vhaeryn se tiene que ir en su turno */
  await leToca(m, 'Vhaeryn');
  const vh = await porNombre(m, 'Vhaeryn');
  const r0 = (await FST(page)).F.round;
  narra('El jugador de Vhaeryn se tiene que ir: el máster lo quita de la mesa en su turno.');
  await b.act(page, 'm-tab', { t: vh.pid });
  await b.act(page, 'm-del', { id: vh.pid });
  await b.act(page, 'm-del-ok', { id: vh.pid });
  s = await FST(page);
  regla(
    'n.º 93 (quitar de la mesa al del turno)',
    nombreDe(s, s.F.cur) === 'Sectario fanático' && s.F.round === r0,
    `le toca a ${nombreDe(s, s.F.cur)}, ronda ${s.F.round} (debería ser el fanático, ronda ${r0})`
  );
  await compMaster(m, 'Vhaeryn se va', { recarga: true });
  await leToca(m, 'Sectario fanático');
  narra('El fanático ataca a Zyo con su hoja del pacto y mantiene Inmovilizar persona.');
  await siguiente(m);
  await leToca(m, ref[0].name);
  narra('Los refuerzos atacan a Elarion: fallan.');
  await siguiente(m);
  await leToca(m, ref[1].name);
  await siguiente(m);
  await leToca(m, 'Elarion');
  await dañar(m, fan.id, 6, 'Rayo de escarcha');
  narra('Concentración del fanático: CD 10, saca 7 + 1 = 8: falla. Bruno queda libre.');
  pensar(
    'acordarse',
    'Decir a Bruno que Inmovilizar persona ha terminado (la concentración del NPC la lleva el máster)'
  );
  await siguiente(m);
  await leToca(m, 'Bruno');
  await dañar(m, sec[1].id, 9, 'Ráfaga de golpes', { st: 'dead' });
  await siguiente(m);
  await leToca(m, 'Zyo');
  await dañar(m, fan.id, 7, 'Explosión sobrenatural');
  await siguiente(m);
  await leToca(m, 'Sectario 3');
  narra('El sectario 3 ataca a Zyo: impacta, 4 de daño.');
  await siguiente(m);
  /* Ronda 3: Vhaeryn vuelve */
  f = await actual(m);
  regla('ronda 3', f && f.name === 'Sectario fanático', `le toca a ${f && f.name}`);
  narra('El jugador de Vhaeryn vuelve y enseña su QR otra vez.');
  const rv = await llegaJugador(m, j, 'Vhaeryn');
  regla('Vhaeryn vuelve', /Jugador añadido/.test(rv.t), `aviso «${rv.t}»`);
  await aCombate(page);
  await b.act(page, 'm-pjs');
  const vh2 = await porNombre(m, 'Vhaeryn');
  regla('Vhaeryn vuelve al combate', vh2 && vh2.init === '', `iniciativa ${vh2 && vh2.init}`);
  pensar(
    'acordarse',
    'Quien vuelve a la mesa pierde su iniciativa: el máster tiene que recordar que sacó 20'
  );
  await ponerIni(m, vh2.id, 20);
  s = await FST(page);
  regla('Vhaeryn vuelve', nombreDe(s, s.F.cur) === 'Sectario fanático', 'cambia el turno');
  await leToca(m, 'Sectario fanático');
  await siguiente(m);
  await siguiente(m);
  await siguiente(m);
  await leToca(m, 'Elarion');
  await dañar(m, fan.id, 11, 'Proyectil mágico', { st: 'ko' });
  narra('El fanático cae; lo dejan inconsciente para interrogarlo. Los demás sectarios se rinden.');
  s = await FST(page);
  const enPie = s.F.list.filter(x => x.kind !== 'pj' && !caido(x)).map(x => x.name);
  narra(`Se rinden: ${enPie.join(', ')}.`);
  pensar(
    'calcular',
    'Puntos de experiencia: 2 sectarios × 25 + fanático 450 (y ¿cuentan los que se rinden?)'
  );
  await b.act(page, 'm-end');
  await b.act(page, 'm-end-ok');
  await compMaster(m, 'combate terminado', { recarga: true });
}

/* ===================================================================================== */
/* Escena 3 · El puente: ogro, trol y goblins; Brasa se une; Bola de fuego */

async function escena3(m, j) {
  ESC = 'Escena 3 · El puente';
  console.log(`\n— ${ESC}`);
  const page = m.page;
  await aCombate(page);
  await b.act(page, 'm-pjs');
  const gob = (await añadirNPC(m, { q: 'goblin guerrero', id: 'goblin-warrior', n: 2, init: 18 })).nuevos;
  const trol = (await añadirNPC(m, { q: 'trol', id: 'troll', init: 12 })).nuevos[0];
  let ogro = (await añadirNPC(m, { q: 'ogro', id: 'ogre', init: 10 })).nuevos[0];
  let s = await FST(page);
  for (const [n, v] of Object.entries({ Vhaeryn: 20, Bruno: 16, Zyo: 13, Elarion: 9 }))
    await ponerIni(m, s.F.list.find(f => f.name === n).id, v);
  await b.act(page, 'm-start');
  await compMaster(m, 'empezar', { recarga: true });

  /* Ronda 1 */
  await leToca(m, 'Vhaeryn', 1);
  await dañar(m, gob[0].id, 8, 'Arco largo');
  await siguiente(m);
  await leToca(m, 'Goblin guerrero 1');
  await siguiente(m);
  await leToca(m, 'Goblin guerrero 2');
  narra('Los goblins disparan a Elarion: fallan.');
  await siguiente(m);
  await leToca(m, 'Bruno');
  await dañar(m, trol.id, 9, 'Golpes desarmados');
  await siguiente(m);
  await leToca(m, 'Zyo');
  await dañar(m, ogro.id, 6, 'Explosión sobrenatural');
  /* Llega Brasa, un amigo con su hechicero de nivel 5 */
  narra('Llega Brasa (hechicero goliat de nivel 5), un amigo que se une a la partida.');
  await b.importar(j.page, b.leerFicha('rincones/hechicero.json'));
  await b.comprobar(j, `${ESC} · jugador · importar a Brasa`);
  const rb = await llegaJugador(m, j, 'Brasa');
  regla('Brasa llega', /Jugador añadido/.test(rb.t), `aviso «${rb.t}»`);
  await aCombate(page);
  const antes = await FST(page);
  await b.act(page, 'm-pjs');
  const br = await porNombre(m, 'Brasa');
  await ponerIni(m, br.id, 15);
  s = await FST(page);
  regla(
    'añadir a mitad de combate',
    s.F.cur === antes.F.cur && s.F.round === antes.F.round,
    `cambia el turno (${nombreDe(s, s.F.cur)}) o la ronda (${s.F.round})`
  );
  narra('Brasa tira iniciativa: 15. Va antes que Zyo, así que actúa en la ronda siguiente.');
  await siguiente(m);
  await leToca(m, 'Trol');
  pensar(
    'buscar',
    'Regeneración del trol (15 PG al empezar su turno si no recibió fuego ni ácido): solo está en «Ver ficha»'
  );
  const t1 = await porNombre(m, 'Trol');
  const reg = Math.min(t1.hpMax, +t1.hp + 15);
  pensar('calcular', 'Regeneración del trol: sumar 15 sin pasar de sus PG máximos');
  await ponerPG(m, trol.id, reg);
  narra(`Trol: regenera (${t1.hp} → ${reg}). Ataca tres veces a Bruno con Desgarrar.`);
  await siguiente(m);
  await leToca(m, 'Ogro');
  narra('El ogro ataca a Zyo con su gran garrote: falla.');
  await siguiente(m);
  await leToca(m, 'Elarion');
  await dañar(m, trol.id, 7, 'Descarga de fuego');
  pensar(
    'acordarse',
    'El trol ha recibido fuego: no se regenera en su siguiente turno (la lista no lo apunta)'
  );
  await compMaster(m, 'ronda 1', { recarga: true });

  /* El máster quita al ogro por error */
  narra('El máster quiere ver la ficha del ogro y toca la «×» de su fila sin querer.');
  const o0 = await porNombre(m, 'Ogro');
  await quitarX(m, ogro.id, 'quitar al ogro por error');
  const hayUndo = await page.locator('[data-act="undo"]').filter({ visible: true }).count();
  const pide = await page.locator('#modal').isVisible();
  if (!pide && !hayUndo)
    pensar(
      'acordarse',
      'La «×» quita al NPC sin preguntar y el modo máster no tiene «Deshacer»: hay que volver a añadirlo y escribir sus PG e iniciativa de memoria'
    );
  ogro = (await añadirNPC(m, { q: 'ogro', id: 'ogre', init: o0.init })).nuevos[0];
  await ponerPG(m, ogro.id, o0.hp);
  s = await FST(page);
  regla('ogro de vuelta', s.F.list.find(f => f.id === ogro.id).hp === o0.hp, 'no recupera sus PG');

  /* Ronda 2 */
  await siguiente(m, 'siguiente turno: nueva ronda');
  await leToca(m, 'Vhaeryn', 2);
  await dañar(m, gob[0].id, 9, 'Arco largo', { st: 'dead' });
  await siguiente(m, 'siguiente turno: se salta al goblin 1');
  await leToca(m, 'Goblin guerrero 2');
  await siguiente(m);
  await leToca(m, 'Bruno');
  await siguiente(m);
  await leToca(m, 'Brasa');
  /* Brasa lanza Bola de fuego en su app */
  await usarFicha(j, 'Brasa');
  const cd = await j.page.evaluate(() => spDC(C()));
  const tb = await pasoJ(j, 'Brasa lanza Bola de fuego', async pg => {
    await irA(pg, 'play');
    const i = await pg.evaluate(() => C().spells.findIndex(x => x.name === 'Bola de fuego'));
    await b.act(pg, 'cast', { i });
    if (await pg.locator('#modal [data-act="cast-with"]').filter({ visible: true }).count())
      await b.act(pg, 'cast-with', { kind: 'slot', level: 3 }, '#modal');
    return toasts(pg);
  });
  regla('Bola de fuego (jugador)', /8d6/.test(tb), `el aviso no dice 8d6: «${tb}»`);
  if (!new RegExp(`CD ${cd}`).test(tb) || !/Destreza|DES/.test(tb))
    nota(`El aviso de Bola de fuego no dice la salvación (Destreza, CD ${cd}): «${tb.slice(0, 160)}»`);
  narra(
    `Brasa lanza Bola de fuego: 8d6 = 28 de fuego, salvación de DES CD ${cd}. Pilla al trol, al ogro y al goblin 2.`
  );
  const bola = 28;
  const objetivos = [
    [trol.id, 'troll', 14],
    [ogro.id, 'ogre', 6],
    [gob[1].id, 'goblin-warrior', 4],
  ];
  for (const [id, mon, d20] of objetivos) {
    const bb = await page.evaluate(x => bestGet(x), mon);
    const tot = d20 + md(bb.ab[1]);
    const supera = tot >= cd;
    pensar(
      'calcular',
      'Bola de fuego sobre varios NPC: tirar la salvación de cada uno con su DES (de «Ver ficha»), y restar el daño entero o la mitad a cada uno, uno a uno'
    );
    narra(`${bb.n}: salvación de DES ${d20} ${sg(md(bb.ab[1]))} = ${tot} → ${supera ? 'la mitad' : 'todo'}.`);
    await dañar(m, id, supera ? Math.floor(bola / 2) : bola, 'Bola de fuego', {
      st: 'dead',
      crudo: mon === 'goblin-warrior',
    });
  }
  pensar('acordarse', 'El trol ha recibido fuego otra vez: no se regenera en su siguiente turno');
  await siguiente(m);
  await leToca(m, 'Zyo');
  await siguiente(m);
  await leToca(m, 'Trol');
  narra('Trol: no se regenera (fuego). Ataca a Bruno.');
  const tr = await porNombre(m, 'Trol');
  if (+tr.hp <= tr.hpMax / 2)
    pensar(
      'calcular',
      'Ensangrentado (la mitad de los PG o menos), que activa Miembros repugnantes del trol: la lista no lo marca'
    );
  await siguiente(m);
  await leToca(m, 'Ogro');
  await siguiente(m);
  await leToca(m, 'Elarion');
  await dañar(m, ogro.id, 5, 'Rayo de escarcha');

  /* Ronda 3 */
  await siguiente(m, 'siguiente turno: nueva ronda');
  await leToca(m, 'Vhaeryn', 3);
  await dañar(m, ogro.id, 9, 'Arco largo');
  await siguiente(m);
  await leToca(m, 'Bruno');
  await dañar(m, trol.id, 11, 'Golpes desarmados');
  await siguiente(m);
  await leToca(m, 'Brasa');
  narra('Brasa lanza otra Bola de fuego (25): el trol falla (6 + 1), el ogro también (9 − 1).');
  await dañar(m, trol.id, 25, 'Bola de fuego');
  await dañar(m, ogro.id, 25, 'Bola de fuego', { st: 'dead' });
  const tr3 = await porNombre(m, 'Trol');
  if (+tr3.hp <= tr3.hpMax / 2)
    pensar(
      'calcular',
      'Ensangrentado (la mitad de los PG o menos), que activa Miembros repugnantes del trol: la lista no lo marca'
    );
  await siguiente(m);
  await leToca(m, 'Zyo');
  await siguiente(m);
  await leToca(m, 'Trol');
  narra('Trol: recibió fuego, no se regenera. Ataca a Bruno.');
  await siguiente(m, 'siguiente turno: se salta al ogro');
  await leToca(m, 'Elarion');
  narra('Elarion lanza Rayo de escarcha (frío) al trol.');
  await dañar(m, trol.id, 7, 'Rayo de escarcha');

  /* Ronda 4: el trol cae sin fuego */
  await siguiente(m, 'siguiente turno: nueva ronda');
  await leToca(m, 'Vhaeryn', 4);
  const tr4 = await porNombre(m, 'Trol');
  narra(
    'Vhaeryn remata al trol con una flecha. El máster sabe que un trol solo muere si empieza su turno a 0 PG sin regenerarse: elige «Incapacitado».'
  );
  await dañar(m, trol.id, +tr4.hp, 'Arco largo', { st: 'ko' });
  await siguiente(m, 'siguiente turno: se salta a los goblins (muertos)');
  await leToca(m, 'Bruno');
  await siguiente(m);
  await leToca(m, 'Brasa');
  await siguiente(m);
  await leToca(m, 'Zyo');
  /* Le debería tocar al trol: empieza su turno a 0 PG y se regenera */
  await b.act(page, 'm-next');
  s = await FST(page);
  const toca = nombreDe(s, s.F.cur);
  regla(
    'regeneración del trol a 0 PG',
    toca === 'Trol',
    `tras Zyo le toca a ${toca}: la lista se salta al trol porque está a 0 PG, pero su Regeneración le hace empezar el turno (recupera 15 PG si no recibió fuego ni ácido)`
  );
  if (toca !== 'Trol') {
    pensar(
      'acordarse',
      'El trol a 0 PG no tiene turno en la lista: el máster tiene que acordarse de que se regenera y no puede devolverle el turno'
    );
    narra(`La lista pasa a ${toca}. El máster se acuerda: el trol se regenera 15 PG y se levanta.`);
    await ponerPG(m, trol.id, 15);
    regla('el trol se levanta', !(await porNombre(m, 'Trol')).st, 'conserva el estado');
  }
  await leToca(m, 'Elarion');
  await dañar(m, trol.id, 15, 'Descarga de fuego', { st: 'dead' });
  narra(
    'Elarion le lanza Descarga de fuego: 15 de fuego. Ahora sí: empezará su turno a 0 PG y sin regenerarse.'
  );
  /* PX */
  const card = await page.evaluate(() => bestCard(bestGet('troll')));
  regla('PX del trol', /1\.?800 PX/.test(card), 'la ficha del trol no dice 1800 PX');
  pensar('calcular', 'PX: ogro 450 + trol 1.800 + goblin 50 = 2.300, entre 5 jugadores = 460');
  await b.act(page, 'm-end');
  await b.act(page, 'm-end-ok');
  await compMaster(m, 'combate terminado', { recarga: true });
}

/* ===================================================================================== */
/* Escena 4 · El dragón rojo adulto (legendario) */

async function escena4(m) {
  ESC = 'Escena 4 · El dragón rojo adulto';
  console.log(`\n— ${ESC}`);
  const page = m.page;
  narra('El máster prepara el jefe final y prueba dos rondas con un dragón legendario.');
  await aCombate(page);
  await b.act(page, 'm-pjs');
  const g = await añadirNPC(m, { q: 'dragon rojo adulto', id: 'adult-red-dragon' });
  const dr = g.nuevos[0];
  regla('dragón', dr.hp === 256 && dr.ac === 19, `PG ${dr.hp}, CA ${dr.ac}`);
  pensar(
    'buscar',
    'Iniciativa de 2024 del dragón rojo adulto (la app da +0 por su DES; en el manual de 2024 es más alta, n.º 99)'
  );
  await ponerIni(m, dr.id, 20);
  narra('El máster usa la iniciativa de su manual (por confirmar: +12): 8 + 12 = 20.');
  await b.act(page, 'm-mon', { id: 'adult-red-dragon' });
  const card = (await page.locator('#modal .bcard').textContent()).replace(/\s+/g, ' ');
  regla(
    'ficha legendaria',
    /Acciones legendarias/.test(card) && /3 usos/.test(card),
    'no salen las acciones legendarias con sus usos'
  );
  regla('ficha legendaria', /Resistencia legendaria/.test(card), 'no sale la resistencia legendaria');
  regla('ficha: inmunidad', /Inmunidades: fuego/.test(card), 'no sale la inmunidad al fuego');
  regla('ficha: PX', /18\.000 PX/.test(card), 'no dice 18.000 PX');
  regla('n.º 99 en la ficha', /2024/.test(card), 'la ficha ya no avisa de la iniciativa de 2024');
  if (!/Salv/i.test(card))
    pensar(
      'buscar',
      'Salvaciones del dragón: la ficha solo trae las características; las salvaciones con competencia (2024: DES +6, SAB +7, por confirmar) hay que buscarlas'
    );
  await b.cerrarModal(page);
  const s0 = await FST(page);
  for (const [n, v] of Object.entries({ Vhaeryn: 17, Brasa: 14, Bruno: 12, Zyo: 10, Elarion: 5 }))
    await ponerIni(m, s0.F.list.find(f => f.name === n).id, v);
  await b.act(page, 'm-start');
  await leToca(m, 'Dragón rojo adulto', 1);
  narra('El dragón usa Aliento de fuego (CD 21, 17d6) contra todo el grupo.');
  pensar(
    'acordarse',
    'Recarga del aliento (5-6): tirar 1d6 al empezar cada turno del dragón; la lista no lo recuerda'
  );
  let leg = 3,
    resi = 3;
  const tras = async quien => {
    if (leg > 0) {
      leg--;
      pensar(
        'acordarse',
        'Acciones legendarias: cuántas le quedan esta ronda (3) y usarlas tras el turno de otro; la lista no las cuenta'
      );
      narra(`Tras ${quien}, el dragón usa una acción legendaria (le quedan ${leg}).`);
    }
  };
  await siguiente(m);
  await leToca(m, 'Vhaeryn');
  await dañar(m, dr.id, 9, 'Arco largo');
  await tras('Vhaeryn');
  await siguiente(m);
  await leToca(m, 'Brasa');
  narra('Brasa lanza Bola de fuego al dragón.');
  pensar('buscar', 'Inmunidades del NPC (fuego): solo en «Ver ficha»; la lista no avisa al apuntar el daño');
  narra('El dragón es inmune al fuego: 0 de daño.');
  await siguiente(m);
  await leToca(m, 'Bruno');
  narra('Bruno usa Golpe aturdidor: el dragón falla la salvación de CON y usa una Resistencia legendaria.');
  resi--;
  pensar('acordarse', `Resistencias legendarias: le quedan ${resi} de 3 hoy; la lista no las cuenta`);
  await tras('Bruno');
  await siguiente(m);
  await leToca(m, 'Zyo');
  await dañar(m, dr.id, 8, 'Explosión sobrenatural');
  await siguiente(m);
  await leToca(m, 'Elarion');
  await dañar(m, dr.id, 7, 'Rayo de escarcha');
  await tras('Elarion');
  await siguiente(m, 'siguiente turno: nueva ronda');
  await leToca(m, 'Dragón rojo adulto', 2);
  leg = 3;
  pensar('acordarse', 'Al empezar el turno del dragón recupera las 3 acciones legendarias');
  narra('Recarga del aliento: 1d6 = 4, no se recarga. El dragón usa Ataque múltiple.');
  const dd = await porNombre(m, 'Dragón rojo adulto');
  regla('PG del dragón', +dd.hp === 256 - 9 - 8 - 7, `PG ${dd.hp}`);
  /* Ancho de móvil con el dragón y cinco jugadores */
  for (const [w, h] of [
    [390, 800],
    [1280, 900],
  ]) {
    await page.setViewportSize({ width: w, height: h });
    await espera(80);
    const ok = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
    regla(`${w} px`, ok, 'la lista de combate se sale de la pantalla (scroll horizontal)');
    await page.screenshot({ path: `${CAPT}/partida-master-${w}.png`, fullPage: true });
  }
  narra('El grupo huye: el máster termina el combate.');
  await b.act(page, 'm-end');
  await b.act(page, 'm-end-ok');
  await compMaster(m, 'combate terminado', { recarga: true });
}

/* ===================================================================================== */

(async () => {
  console.log(`Partida simulada del máster (semilla ${SEMILLA})`);
  const j = await dispositivo('jugadores');
  const m = await dispositivo('máster');
  await b.limpiar(j.page);
  await b.limpiar(m.page);
  for (const f of [escena0, escena1, escena2, escena3, escena4]) {
    try {
      await f(m, j);
    } catch (e) {
      b.fallo(
        ESC,
        `el guion se ha parado: ${String(e.stack || e)
          .split('\n')
          .slice(0, 3)
          .join(' | ')}`
      );
      break;
    }
  }
  consola(m, 'final');
  consola(j, 'final');
  await j.browser.close();
  await m.browser.close();

  b.sola(
    '«Siguiente turno» sigue la iniciativa, sube la ronda y se salta a los NPC caídos (no a los PJ a 0 PG)'
  );
  b.sola(
    'Al bajar un NPC a 0 PG pregunta si queda muerto o incapacitado; si vuelve a tener PG, deja de estar caído'
  );
  b.sola(
    'Añadir NPC del bestiario rellena CA, PG e iniciativa (DES), numera a los repetidos y deja ver su ficha'
  );
  b.sola(
    'Añadir a alguien a mitad de combate no cambia el turno ni la ronda; quitar a un jugador en su turno pasa al siguiente'
  );
  b.sola('Volver a compartir tras subir de nivel actualiza al jugador sin duplicarlo');
  const grupos = {};
  PIENSA.forEach(p => (grupos[p.que] = grupos[p.que] || { ...p, n: 0 }).n++);
  for (const p of Object.values(grupos)) b.noSola(`(${p.tipo}${p.n > 1 ? ` ×${p.n}` : ''}) ${p.que}`);
  console.log(`\nDiario de la partida:\n${DIARIO.map(x => '  ' + x).join('\n')}`);
  if (NOTAS.length) console.log('\nNotas:\n' + NOTAS.map(t => '  · ' + t).join('\n'));
  console.log(
    `\nVeces que el máster piensa fuera de la app: ${PIENSA.length} (${Object.keys(grupos).length} distintas)`
  );
  console.log(`Reglas comprobadas: ${REGLAS.ok + REGLAS.mal} (${REGLAS.mal} mal)`);
  process.exitCode = b.informe('Partida simulada: máster dirigiendo un combate');
})();
