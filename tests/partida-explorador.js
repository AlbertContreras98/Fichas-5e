/* Prueba de la fase 3: partida simulada con Vhaeryn (explorador elfo drow) de nivel 1 a 5, como un jugador novato con dados físicos. */
'use strict';

/* Uso: node tests/partida-explorador.js [--semilla=N] [--rastro]
   Escenas: lobos de noche (nivel 1), descansos y nivel 2, bandidos en la cueva (nivel 2), nivel 3 y goblins en la mina,
   niveles 4 y 5 y el ogro, y fuera de combate. Con la semilla 5 (la de siempre) salen todos los momentos salvo caer a 0 PG;
   con --semilla=1 cae a 0 PG en la primera escena.
   Los dados los «tira» el guion con la semilla y escribe los resultados donde la app los pide.
   Cada vez que el jugador tiene que acordarse de algo, calcular algo o buscar una regla fuera de la app, se apunta («Pensar»).
   La munición recuperada la suma el jugador a mano (el máster no usa la regla de la mitad): no cuenta como «pensar». */

const b = require('./base');

const ARG = process.argv.slice(2);
const SEMILLA = +(ARG.find(a => a.startsWith('--semilla=')) || '--semilla=5').slice(10) || 5;
const RASTRO = ARG.includes('--rastro');

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
function tira(n, c) {
  const dados = Array.from({ length: n }, () => dado(c));
  return { dados, suma: dados.reduce((t, x) => t + x, 0) };
}

/* ---------- Diario, pensar y cuentas ---------- */

let ESC = '';
const DIARIO = [];
function narra(t) {
  DIARIO.push(`[${ESC}] ${t}`);
  if (RASTRO) console.log(`  · ${t}`);
}
/* Cada vez que el jugador piensa fuera de la app: tipo = acordarse | calcular | buscar */
const PIENSA = [];
function pensar(tipo, que) {
  PIENSA.push({ esc: ESC, tipo, que });
  if (RASTRO) console.log(`  ? (${tipo}) ${que}`);
}
/* Lo que pide PLAN.md: el +1d6 de Marca del cazador y las maestrías con números */
const CUENTA = { marcaApp: 0, marcaFuera: 0, maestriaApp: 0, maestriaFuera: 0, flechas: 0 };
const MOMENTOS = {
  'marca-gratis': 'Marca del cazador gratis (Enemigo predilecto)',
  'marca-pasa': 'pasar Marca del cazador a otra presa',
  'dos-armas': 'ataque extra con la segunda arma ligera (Mellar)',
  molestar: 'Molestar con la espada corta',
  atrapador: 'Golpe atrapador',
  bayas: 'Bayas nutritivas (crear, comer, comida del descanso)',
  luces: 'Luces danzantes (drow)',
  fuego: 'Fuego feérico gratis (drow, nivel 3)',
  oscuridad: 'Oscuridad gratis (drow, nivel 5)',
  curar: 'Curar heridas sobre sí mismo',
  suerte: 'punto de suerte (Afortunado)',
  oportunidad: 'ataque de oportunidad',
  'cae-0': 'cae a 0 PG y le curan (no siempre sale)',
  corto: 'descanso corto',
  largo: 'descanso largo',
  nivel2: 'nivel 2 (Estilo de combate y Pericia)',
  nivel3: 'nivel 3 (subclase)',
  nivel4: 'nivel 4 (mejora)',
  nivel5: 'nivel 5 (Ataque adicional)',
  flechas: 'recuperar flechas a mano',
};
const HECHO = new Set();
const hecho = k => HECHO.add(k);
const REGLAS = { ok: 0, mal: 0 };
function regla(donde, ok, que) {
  if (ok) REGLAS.ok++;
  else {
    REGLAS.mal++;
    b.fallo(`${ESC} · ${donde}`, que);
  }
  return ok;
}

/* ---------- Ayudas de la app ---------- */

const ficha = page => b.ficha(page);
const leerToasts = page =>
  page.$$eval('#toasts .toast', l => l.map(t => t.innerText.replace(/\s+/g, ' ').trim()));
const texto = (page, sel) => page.locator(sel).first().innerText();
const tiene = (toasts, re) => toasts.some(t => re.test(t));

async function paso(ctx, donde, fn, op) {
  let out;
  const ok = await b.paso(
    ctx,
    `${ESC} · ${donde}`,
    async pg => {
      out = await fn(pg);
    },
    op
  );
  if (!ok) throw new Error(`no se pudo hacer «${donde}»`);
  return out;
}
async function irA(page, t) {
  const ya = await page.evaluate(() => S.tab);
  if (ya !== t) await b.act(page, 'tab', { t });
}
const fila = (page, nombre) =>
  page.locator('.trow').filter({ has: page.locator('.tname', { hasText: nombre }) });
/* Lanza un conjuro desde Combate. como = {kind:'free'} | {kind:'slot', level} (si la app pregunta). Devuelve los avisos */
async function lanzar(page, nombre, como) {
  await irA(page, 'combat');
  const btn = fila(page, nombre).locator('[data-act="t-cast"]').first();
  if (!(await btn.isVisible())) {
    const det = page.locator('details.tmag').filter({ has: page.locator('.tname', { hasText: nombre }) });
    await det.locator('summary').first().click();
  }
  if (await btn.isDisabled()) throw new Error(`«${nombre}» está apagado en Combate`);
  await btn.click();
  await b.actSi(page, 'cast-conc-ok', {}, '#modal'); // aviso de concentración (n.º 112)
  await elegirEspacio(page, como);
  const t = await leerToasts(page);
  if (RASTRO) console.log(`    aviso: ${t.join(' | ')}`);
  return t;
}
/* Lanza un conjuro desde la pestaña Partida (fuera de combate) */
async function lanzarFuera(page, nombre, como) {
  await irA(page, 'play');
  await b.act(page, 'cast', { i: await idxSp(page, nombre) });
  await elegirEspacio(page, como);
  const t = await leerToasts(page);
  if (RASTRO) console.log(`    aviso: ${t.join(' | ')}`);
  return t;
}
let VENTANA = '';
async function elegirEspacio(page, como) {
  VENTANA = '';
  const hay = await page.locator('#modal [data-act="cast-with"]').filter({ visible: true }).count();
  if (!hay) return;
  VENTANA = (await texto(page, '#modal .sheet')).replace(/\s+/g, ' ');
  const d =
    como && como.kind === 'free' ? { kind: 'free' } : { kind: 'slot', level: (como && como.level) || 1 };
  await b.act(page, 'cast-with', d, '#modal');
}
async function atacar(page, nombre, extra = {}) {
  await irA(page, 'combat');
  const i = await idxAtk(page, nombre);
  await b.act(page, 't-atk', Object.assign({ i }, extra));
  const t = await leerToasts(page);
  if (RASTRO) console.log(`    aviso: ${t.join(' | ')}`);
  return t;
}
async function vida(page, n, m) {
  await b.act(page, 'vida');
  await b.escribir(page, '#hpAmt', n);
  await b.act(page, 'hp', { m });
  return leerToasts(page);
}
const idxAtk = (page, n) => page.evaluate(x => C().attacks.findIndex(a => a.name === x), n);
const idxSp = (page, n) => page.evaluate(x => C().spells.findIndex(s => s.name === x), n);
const idxEq = (page, n) => page.evaluate(x => C().equipment.findIndex(e => e.name === x), n);
const usos = (c, n) => {
  const f = c.features.find(x => x.name === n);
  return f ? f.uses : null;
};
/* Lo que dice la app al tocar una habilidad (qué tirar) */
async function tirada(page, sk) {
  await irA(page, 'play');
  await b.act(page, 'gloss', { k: `skill:${sk}` });
  const t = (await texto(page, '#modal .sheet')).replace(/\s+/g, ' ');
  await b.cerrarModal(page);
  return t;
}
const marcaOn = async page => !!(await ficha(page)).effects.find(e => e.name === 'Marca del cazador');
const flechas = c => (c.equipment.find(e => e.name === 'Flechas') || { qty: -1 }).qty;
const num = page =>
  page.evaluate(() => {
    const c = C(),
      a = n => c.attacks.find(x => x.name === n) || {};
    return {
      ca: acOf(c),
      ini: init(c),
      cd: spDC(c),
      atk: spAtk(c),
      pb: pb(c),
      arco: [a('Arco largo').atk, a('Arco largo').dmg],
      cimi: [a('Cimitarra').atk, a('Cimitarra').dmg],
      espada: [a('Espada corta').atk, a('Espada corta').dmg],
      perc: skillB(c, SK.perception),
      sig: skillB(c, SK.stealth),
      sup: skillB(c, SK.survival),
      ataques: attacksPerAction(c),
      vel: speedCalc(c).ft,
    };
  });

/* Comprueba el aviso de un ataque con Marca del cazador activa */
function cuentaMarca(donde, toasts, activa) {
  if (!activa) return;
  if (tiene(toasts, /1d6 de fuerza si es tu presa/)) CUENTA.marcaApp++;
  else {
    CUENTA.marcaFuera++;
    pensar('acordarse', `${donde}: sumar el 1d6 de fuerza de Marca del cazador (el aviso no lo dice)`);
    regla(donde, false, 'con Marca del cazador activa, el aviso del ataque no dice el +1d6 de fuerza');
  }
}
/* Comprueba que el aviso de un ataque con maestría trae su número o su texto */
function cuentaMaestria(donde, toasts, re) {
  if (tiene(toasts, re)) CUENTA.maestriaApp++;
  else {
    CUENTA.maestriaFuera++;
    pensar('buscar', `${donde}: qué hace la maestría del arma`);
    regla(donde, false, `el aviso no trae la maestría (${re})`);
  }
}

/* ---------- Enemigos (los números los decide el máster; aquí, inventados) ---------- */

const enemigo = (n, ca, pg, atk, dmg, tipo) => ({ n, ca, pg, max: pg, atk, dmg, tipo });
function ataqueEnemigo(e, ca) {
  const d = dado(20),
    total = d + e.atk;
  const [n, c, m] = e.dmg;
  if (d === 20) {
    const r = tira(2 * n, c);
    narra(`${e.n} ataca: 20 natural, ¡crítico! ${r.suma + m} de daño ${e.tipo}`);
    return { dmg: r.suma + m };
  }
  if (d !== 1 && total >= ca) {
    const r = tira(n, c);
    narra(`${e.n} ataca: ${total} contra CA ${ca}, impacta: ${r.suma + m} de daño ${e.tipo}`);
    return { dmg: r.suma + m };
  }
  narra(`${e.n} ataca: ${total} contra CA ${ca}, falla`);
  return { dmg: 0 };
}
/* El explorador ataca: ven = 1 ventaja, -1 desventaja */
function tiradaJ(bono, ca, ven = 0) {
  const d1 = dado(20),
    d2 = ven ? dado(20) : d1,
    d = ven > 0 ? Math.max(d1, d2) : ven < 0 ? Math.min(d1, d2) : d1;
  return { d, total: d + bono, impacta: d === 20 || (d !== 1 && d + bono >= ca), crit: d === 20 };
}
/* Daño de un golpe: dados del arma (n caras), modificador, y los dados extra (Marca del cazador…) */
function danoJ(a, caras, mod, extras = []) {
  const k = a.crit ? 2 : 1;
  let t = tira(k, caras).suma + mod;
  for (const c of extras) t += tira(k, c).suma;
  return t;
}

/* El jugador recibe daño y tira la concentración si hace falta */
async function recibe(ctx, e, ca) {
  const { page } = ctx;
  const r = ataqueEnemigo(e, ca);
  if (!r.dmg) return r;
  const c0 = await ficha(page);
  const conc = c0.concentration;
  const sv = dado(20) + 1,
    cd = Math.max(10, Math.floor(r.dmg / 2)),
    pierde = sv < cd;
  const t = await paso(
    ctx,
    `recibe ${r.dmg} de daño ${e.tipo}${conc ? ` (concentración ${sv})` : ''}`,
    async pg => {
      const out = await vida(pg, r.dmg, 'dmg');
      const sel = pierde ? 'conc-lose' : 'conc-keep';
      if (await pg.locator(`[data-act="${sel}"]`).count()) await b.act(pg, sel);
      await b.cerrarModal(pg);
      return out;
    }
  );
  const c = await ficha(page);
  if (conc && c.hp.current > 0) {
    regla(
      'concentración',
      tiene(t, new RegExp(`salvación de CON, CD ${cd} \\(tu bonificador \\+1`)),
      `el aviso no pide «salvación de CON, CD ${cd} (+1)»: ${t[0]}`
    );
    narra(
      `Salvación de concentración (${conc}): ${sv} contra CD ${cd}: ${pierde ? 'la pierde' : 'la mantiene'}.`
    );
    if (pierde) regla('concentración', !c.concentration, 'sigue concentrado tras «La fallo»');
  }
  if (c.hp.current === 0) await caer(ctx);
  return Object.assign(r, { pierde: conc && pierde });
}
/* Cae a 0 PG: la clériga del grupo le cura con Palabra de curación antes de su turno */
async function caer(ctx) {
  const { page } = ctx;
  let c = await ficha(page);
  hecho('cae-0');
  regla(
    'caer a 0 PG',
    c.conditions.includes('Inconsciente') && !c.concentration,
    `estados ${c.conditions}, concentración «${c.concentration}»`
  );
  if (!c.conditions.includes('Derribado'))
    pensar(
      'acordarse',
      'Al caer a 0 PG también quedas Derribado y sueltas el arco (la app no lo marca, n.º 108)'
    );
  narra('Vhaeryn cae a 0 PG. La clériga le lanza Palabra de curación.');
  const cura = tira(2, 4).suma + 3;
  await paso(ctx, `le curan ${cura} PG`, pg => vida(pg, cura, 'heal'));
  c = await ficha(page);
  regla(
    'curación a 0 PG',
    c.hp.current === cura && !c.conditions.includes('Inconsciente'),
    `PG ${c.hp.current}, estados ${c.conditions}`
  );
}

/* ---------- Asistente de subir de nivel ---------- */

const pasoActual = page => page.evaluate(() => (W ? wizSteps()[W.step][0] : null));
async function subirNivel(page, elige) {
  await b.act(page, 'settings');
  await b.act(page, 'levelup');
  const vistos = [];
  const textos = {};
  for (let v = 0; v < 20; v++) {
    const s = await pasoActual(page);
    if (!s) throw new Error('el asistente se ha cerrado antes de tiempo');
    vistos.push(s);
    textos[s] = await texto(page, '#modal .sheet');
    if (s === 'hp' && elige.pg) {
      await b.radio(page, 'wz-hp', 'roll');
      await b.escribir(page, '#wz-hproll', elige.pg);
    } else if (s === 'sub') await b.radio(page, 'wz-sub', elige.sub);
    else if (s === 'style') await b.elegir(page, 'select[data-fs="k"]', elige.style);
    else if (s === 'expert') {
      for (const k of elige.exp || []) await b.act(page, 'wz-exp', { k });
    } else if (s === 'order') await b.radio(page, 'wz-order', elige.presa || 'colossus');
    else if (s === 'asi') {
      await b.radio(page, 'wz-asi', elige.asi.mode);
      await b.elegir(page, '#wz-asi-a', elige.asi.a);
      if (elige.asi.b) await b.elegir(page, '#wz-asi-b', elige.asi.b);
    } else if (s === 'spells') {
      for (const id of elige.conjuros || []) {
        const ya = await page.evaluate(i => W.spells.some(x => x.ref === i), id);
        if (ya) continue;
        const en = await page.evaluate(i => SPBY[i].en, id);
        await b.escribir(page, '#sp-q', en);
        await b.act(page, 'sp-tog', { id });
      }
    } else if (s === 'confirm') {
      await b.act(page, 'wz-apply');
      await page.waitForFunction(() => !W);
      return { vistos, textos };
    }
    if (!(await page.locator('[data-act="wz-next"]').isEnabled()))
      throw new Error(`paso «${s}» sin completar: ${await texto(page, '.wz-foot .hint')}`);
    await b.act(page, 'wz-next');
  }
  throw new Error('el asistente no termina');
}

async function descansoCorto(ctx, hd) {
  const { page } = ctx;
  return paso(ctx, `descanso corto${hd ? `: dado de golpe (sale ${hd})` : ''}`, async pg => {
    await b.act(pg, 'rest-menu');
    await b.act(pg, 'short');
    if (hd) {
      await b.escribir(pg, '#hd-roll', hd);
      await b.act(pg, 'hd');
    }
    await b.act(pg, 'short-done');
    return leerToasts(pg);
  });
}
async function descansoLargo(ctx) {
  return paso(ctx, 'descanso largo', async pg => {
    await b.act(pg, 'rest-menu');
    await b.act(pg, 'long');
    const txt = await texto(pg, '#modal .sheet');
    await b.act(pg, 'long-done');
    return { txt, t: await leerToasts(pg) };
  });
}
async function terminarCombate(ctx) {
  await paso(ctx, 'terminar combate', async pg => {
    await irA(pg, 'combat');
    await b.act(pg, 'cb-end');
    await b.act(pg, 'cb-end-ok');
  });
}
const finTurno = (ctx, n) => paso(ctx, `terminar turno${n ? ` (ronda ${n})` : ''}`, pg => b.act(pg, 't-end'));

/* Recoger flechas: el jugador las suma a mano (Objetos → Munición → +), regla de su máster */
async function recoger(ctx, n) {
  await paso(ctx, `recoger ${n} flechas a mano`, async pg => {
    await b.act(pg, 'inv');
    await b.act(pg, 'belt', { k: 'ammo' });
    const i = await idxEq(pg, 'Flechas');
    for (let k = 0; k < n; k++) await b.act(pg, 'qty', { i, d: 1 }, '#modal');
    await b.cerrarModal(pg);
  });
}
/* Golpe atrapador justo después de impactar: es de concentración y acaba con la Marca */
async function golpeAtrapador(ctx, obj) {
  const { page } = ctx;
  let c = await ficha(page);
  const concAntes = c.concentration,
    sl = c.slots[0].used;
  const t = await paso(ctx, 'Golpe atrapador tras impactar', pg =>
    lanzar(pg, 'Golpe atrapador', { kind: 'slot', level: 1 })
  );
  c = await ficha(page);
  hecho('atrapador');
  narra(`Aviso de Golpe atrapador: «${t[0]}».`);
  regla('Golpe atrapador', c.slots[0].used === sl + 1, `espacios gastados ${c.slots[0].used}`);
  regla('Golpe atrapador', c.concentration === 'Golpe atrapador', `concentración «${c.concentration}»`);
  regla('Golpe atrapador', c.turn.aa, 'no gasta la acción adicional');
  if (concAntes) {
    regla('Golpe atrapador', !c.effects.find(e => e.name === concAntes), `${concAntes} sigue activo`);
    regla(
      'Golpe atrapador',
      tiene(t, new RegExp(`Dejas de concentrarte en ${concAntes}`)),
      'no avisa de la concentración perdida'
    );
    pensar(
      'acordarse',
      `Golpe atrapador es de concentración: lanzarlo acaba con ${concAntes}. La app solo lo dice después de gastar el espacio, sin preguntar antes`
    );
  }
  if (!tiene(t, /Fuerza|FUE/))
    pensar(
      'buscar',
      'Golpe atrapador: el aviso dice «CD 12», pero no que es una salvación de Fuerza (con ventaja si es Grande) ni que queda Apresado'
    );
  regla('Golpe atrapador', tiene(t, /1d6/), 'no dice el 1d6 perforante');
  const sv = dado(20) + 1;
  const atrapado = sv < 12;
  narra(
    `Golpe atrapador: ${obj.n} tira salvación de FUE ${sv} contra CD 12: ${atrapado ? 'queda apresado' : 'se libra'}.`
  );
  if (atrapado) {
    pensar(
      'acordarse',
      'Mientras el objetivo está apresado, tus ataques contra él tienen ventaja (la app no lo recuerda)'
    );
  } else {
    /* Se libra: el conjuro termina. El jugador lo quita en «Vida y estado» */
    await paso(ctx, 'se libra: quitar Golpe atrapador', async pg => {
      await irA(pg, 'play');
      await b.act(pg, 'end-conc');
    });
    c = await ficha(page);
    regla(
      'Golpe atrapador',
      !c.concentration && !c.effects.find(e => e.name === 'Golpe atrapador'),
      'el efecto sigue tras dejar de concentrarse'
    );
  }
  return atrapado;
}

/* Ataque extra con un arma ligera (acción adicional, o dentro de la acción con Mellar). Devuelve los avisos, o null si sale apagado */
async function ligero(ctx, nombre) {
  const { page } = ctx;
  await irA(page, 'combat');
  const btn = fila(page, `${nombre} (arma ligera)`).locator('[data-act="t-light"]');
  const c = await ficha(page);
  const nick = await page.evaluate(n => {
    const a = C().attacks.find(x => x.name === n);
    return !!(a && a.mastery && WEAPONS[a.wpn] && WEAPONS[a.wpn].ms === 'nick');
  }, nombre);
  if (await btn.isDisabled()) {
    if (nick && c.turn.aa && !c.turn.nick && c.turn.light) {
      regla(
        'Mellar',
        false,
        `con la acción adicional ya gastada, el ataque ligero de la ${nombre} (Mellar) sale apagado, aunque con Mellar no gasta la acción adicional`
      );
      pensar(
        'acordarse',
        `Mellar: el ataque extra con la ${nombre} va dentro de la acción de Atacar, así que se puede hacer aunque ya hayas gastado la acción adicional; la app lo apaga y hay que hacerlo de memoria`
      );
    }
    return null;
  }
  return paso(ctx, `${nombre}: ataque extra ligero`, async pg => {
    await b.act(pg, 't-light', { i: await idxAtk(pg, nombre) });
    return leerToasts(pg);
  });
}

/* =====================================================================
   Escena 1 · Nivel 1: lobos en el bosque, de noche
   ===================================================================== */
async function escena1(ctx) {
  const { page } = ctx;
  ESC = 'E1 nivel 1 · lobos de noche';
  console.log(`\n— ${ESC}`);
  await b.limpiar(page);
  await paso(ctx, 'importar a Vhaeryn', pg => b.importar(pg, b.leerFicha('explorador.json')));
  let c = await ficha(page);

  /* Los números de la ficha (reglas de 2024) */
  let n = await num(page);
  regla('ficha', n.ca === 15, `CA ${n.ca} (cuero tachonado 12 + DES 3 = 15)`);
  regla('ficha', n.ini === 3, `iniciativa ${n.ini} (DES +3)`);
  regla(
    'ficha',
    n.cd === 12 && n.atk === 4,
    `CD ${n.cd} y ataque de conjuro +${n.atk} (8 + 2 + SAB 2 = 12; +4)`
  );
  regla('ficha', c.hp.max === 11, `PG máximos ${c.hp.max} (d10: 10 + CON 1 = 11)`);
  regla('ficha', n.arco[0] === 5 && n.arco[1] === '1d8 + 3', `arco largo ${n.arco} (+5, 1d8 + 3)`);
  regla('ficha', n.cimi[0] === 5 && n.cimi[1] === '1d6 + 3', `cimitarra ${n.cimi} (sutil: DES)`);
  regla('ficha', n.perc === 4 && n.sig === 5, `Percepción ${n.perc} (+4), Sigilo ${n.sig} (+5)`);
  regla('ficha', JSON.stringify(c.slots.map(s => s.total).slice(0, 2)) === '[2,0]', 'espacios: 2 de nivel 1');
  regla(
    'ficha',
    usos(c, 'Marca del cazador gratis').max === 2,
    'Enemigo predilecto: 2 usos gratis a nivel 1'
  );
  regla('ficha', usos(c, 'Puntos de suerte').max === 2, 'Afortunado: puntos de suerte = competencia (2)');
  regla('ficha', n.vel === 30, `velocidad ${n.vel} (elfo: 30)`);
  const vis = c.features.find(f => f.name === 'Visión en la oscuridad');
  regla('ficha', vis && /120 pies/.test(vis.text), 'el drow ve en la oscuridad a 120 pies');
  const perc = await tirada(page, 'perception');
  narra(`De noche, Percepción para oír a los lobos. La app dice: «${perc}».`);
  regla('Percepción', /1d20 \+4/.test(perc), `tirada de Percepción: ${perc}`);
  if (!/oscuridad|tenue/i.test(perc))
    pensar(
      'acordarse',
      'Visión en la oscuridad: de noche ve a 120 pies como en luz tenue, así que sus pruebas de Percepción que dependen de la vista tienen desventaja (solo está en el texto del rasgo, no en la tirada de Percepción)'
    );

  /* El jugador quiere la maestría en el arco (Ralentizar) y no en la espada corta: ¿se puede? */
  const mast = c.attacks.filter(a => a.mastery).map(a => a.name);
  narra(`Maestrías elegidas al crear: ${mast.join(', ')}. El arco largo no la tiene.`);

  const l1 = enemigo('Lobo 1', 12, 11, 4, [1, 6, 2], 'perforante');
  const l2 = enemigo('Lobo 2', 12, 11, 4, [1, 6, 2], 'perforante');

  let t = await paso(ctx, 'empezar combate', async pg => {
    await irA(pg, 'combat');
    await b.act(pg, 'cb-start');
    return leerToasts(pg);
  });
  regla('empezar combate', tiene(t, /Iniciativa: 1d20 \+3/), `el aviso no dice «1d20 +3»: ${t[0]}`);
  narra(`Iniciativa: ${dado(20) + 3}. Vhaeryn actúa antes que los lobos.`);

  /* Ronda 1: Marca del cazador gratis (acción adicional) y flecha */
  t = await paso(ctx, 'Marca del cazador gratis', pg => lanzar(pg, 'Marca del cazador', { kind: 'free' }));
  c = await ficha(page);
  hecho('marca-gratis');
  narra(`Ventana de lanzar: «${VENTANA}». Aviso: «${t[0]}».`);
  if (/Siempre preparado/.test(VENTANA + t[0]))
    pensar(
      'acordarse',
      'Marca del cazador gratis: la ventana dice «Gratis (Siempre preparado)» y el aviso «Uso gratuito de Siempre preparado», sin nombrar Enemigo predilecto ni decir cuántos usos gratis quedan'
    );
  regla('Marca del cazador', usos(c, 'Marca del cazador gratis').used === 1, 'no gasta el uso gratis');
  regla('Marca del cazador', c.slots[0].used === 0, 'el uso gratis ha gastado un espacio');
  regla('Marca del cazador', c.concentration === 'Marca del cazador', `concentración «${c.concentration}»`);
  const fx = c.effects.find(e => e.name === 'Marca del cazador');
  regla(
    'Marca del cazador',
    fx && fx.m === 60 && fx.conc,
    `efecto ${JSON.stringify(fx)} (1 hora, concentración)`
  );
  regla('Marca del cazador', c.turn.aa && !c.turn.a, 'debería gastar solo la acción adicional');
  if (!tiene(t, /1d6/))
    pensar(
      'buscar',
      'Marca del cazador: el aviso de lanzarla no dice qué hace (+1d6 de fuerza al impactar a la presa)'
    );
  if (tiene(t, /CD de salvación/))
    pensar(
      'acordarse',
      'Marca del cazador: el aviso dice «CD de salvación 12 · ataque de conjuro +4», que no sirven para este conjuro (no hay salvación ni ataque de conjuro)'
    );

  let ronda = 1;
  const fl0 = flechas(c);
  t = await paso(ctx, 'disparar el arco largo al lobo 1', pg => atacar(pg, 'Arco largo'));
  c = await ficha(page);
  CUENTA.flechas++;
  regla('munición', flechas(c) === fl0 - 1, `flechas ${fl0} → ${flechas(c)} (debería gastar 1)`);
  regla('ataque', tiene(t, /1d20 \+5/) && tiene(t, /1d8 \+ 3 perforante/), `aviso del arco: ${t[0]}`);
  regla('ataque', tiene(t, /quedan 19 Flechas/), 'el aviso no dice las flechas que quedan');
  regla(
    'crítico',
    tiene(t, /2d8 \+ 3/) && tiene(t, /dados extra/),
    'no dice el crítico (2d8 + 3 y el 1d6 doblado)'
  );
  cuentaMarca('arco', t, await marcaOn(page));
  if (!tiene(t, /150|600|largo alcance|desventaja/i))
    pensar(
      'buscar',
      'Arco largo: alcance 150/600 pies; más allá de 150, desventaja (el aviso del ataque no lo dice; solo sale en las notas del arma)'
    );
  let a = tiradaJ(5, l1.ca);
  if (a.impacta) {
    const d = danoJ(a, 8, 3, [6]);
    l1.pg -= d;
    narra(`Flecha al lobo 1: ${a.total}, impacta: ${d} (con la Marca). Lobo 1: ${l1.pg} PG.`);
  } else narra(`Flecha al lobo 1: ${a.total}, falla.`);
  await finTurno(ctx, ronda++);

  /* Los lobos corren hacia él; uno muerde. Sigue disparando hasta que cae el lobo 1 */
  for (let i = 0; i < 6 && l1.pg > 0; i++) {
    await recibe(ctx, l2, 15);
    c = await ficha(page);
    const cerca = i > 0;
    if (cerca && i === 1)
      pensar(
        'acordarse',
        'Disparar con un enemigo a 5 pies que te ve da desventaja (2024): la app no lo sabe ni lo recuerda'
      );
    t = await paso(ctx, `disparar al lobo 1 (ronda ${ronda})`, pg => atacar(pg, 'Arco largo'));
    CUENTA.flechas++;
    cuentaMarca('arco', t, !!(await ficha(page)).effects.find(e => e.name === 'Marca del cazador'));
    a = tiradaJ(5, l1.ca, cerca ? -1 : 0);
    if (a.impacta) {
      const marca = !!(await ficha(page)).effects.find(e => e.name === 'Marca del cazador');
      const d = danoJ(a, 8, 3, marca ? [6] : []);
      l1.pg -= d;
      narra(`Flecha: ${a.total}${cerca ? ' (desventaja)' : ''}, impacta: ${d}. Lobo 1: ${l1.pg} PG.`);
    } else narra(`Flecha: ${a.total}${cerca ? ' (desventaja)' : ''}, falla.`);
    await finTurno(ctx, ronda++);
  }
  if (l1.pg > 0) {
    narra('El lobo 1 huye malherido (el máster lo da por vencido).');
    l1.pg = 0;
  } else narra('El lobo 1 cae.');

  /* Su turno: pasa la marca al lobo 2 (sin espacio) y ataca cuerpo a cuerpo con dos armas */
  c = await ficha(page);
  const tenia = !!c.effects.find(e => e.name === 'Marca del cazador');
  if (tenia) {
    const antes = {
      u: usos(c, 'Marca del cazador gratis').used,
      s: c.slots[0].used,
      fx: c.effects.find(e => e.name === 'Marca del cazador').m,
    };
    t = await paso(ctx, 'pasar Marca del cazador al lobo 2', async pg => {
      await irA(pg, 'combat');
      await b.act(pg, 't-mark', { id: 'hunters-mark' });
      return leerToasts(pg);
    });
    c = await ficha(page);
    hecho('marca-pasa');
    regla('pasar la marca', c.turn.aa, 'no gasta la acción adicional');
    regla(
      'pasar la marca',
      usos(c, 'Marca del cazador gratis').used === antes.u && c.slots[0].used === antes.s,
      'pasar la marca gasta un uso o un espacio'
    );
    regla(
      'pasar la marca',
      c.concentration === 'Marca del cazador' &&
        c.effects.find(e => e.name === 'Marca del cazador').m === antes.fx,
      'la duración o la concentración cambian al pasar la marca'
    );
    regla('pasar la marca', tiene(t, /1d6 de fuerza/) && tiene(t, /No gastas espacio/), `aviso: ${t[0]}`);
  } else narra('Ha perdido la concentración: no hay marca que pasar.');

  /* Cuerpo a cuerpo: Espada corta (Molestar) en la acción y Cimitarra (Mellar) como ataque extra ligero */
  t = await paso(ctx, 'espada corta al lobo 2', pg => atacar(pg, 'Espada corta'));
  c = await ficha(page);
  hecho('molestar');
  regla('espada corta', tiene(t, /1d20 \+5/) && tiene(t, /1d6 \+ 3 perforante/), `aviso: ${t[0]}`);
  cuentaMaestria('Molestar', t, /Molestar/);
  cuentaMarca('espada corta', t, tenia);
  pensar(
    'acordarse',
    'Molestar: si la espada corta impacta, el siguiente ataque contra ese lobo tiene ventaja (lo dice al atacar, pero el siguiente aviso de ataque no lo recuerda)'
  );
  a = tiradaJ(5, l2.ca);
  const vexOn = a.impacta;
  if (a.impacta) {
    const d = danoJ(a, 6, 3, tenia ? [6] : []);
    l2.pg -= d;
    narra(
      `Espada corta: ${a.total}, impacta: ${d}. Lobo 2: ${l2.pg} PG. Molestar: ventaja en el siguiente ataque.`
    );
  } else narra(`Espada corta: ${a.total}, falla.`);

  /* ¿Deja atacar otra vez con la misma espada como ataque ligero? (la regla pide un arma ligera distinta) */
  const misma = fila(page, 'Espada corta (arma ligera)').locator('[data-act="t-light"]');
  const mismaOn = (await misma.count()) && !(await misma.isDisabled());
  regla(
    'arma ligera',
    !mismaOn,
    'tras atacar con la Espada corta, el ataque extra ligero con la misma Espada corta sale activo (tiene que ser otra arma ligera, lo dice el glosario de la app)'
  );
  a = { impacta: false };
  t = await ligero(ctx, 'Cimitarra');
  if (t) {
    c = await ficha(page);
    hecho('dos-armas');
    regla('Mellar', c.turn.nick, 'con Mellar el ataque extra no debería gastar la acción adicional');
    regla('Mellar', tiene(t, /Mellar/), 'el aviso no explica Mellar');
    regla(
      'arma ligera',
      tiene(t, /Daño: 1d6 \(sin tu modificador/),
      `daño del ataque extra sin modificador: ${t[0]}`
    );
    cuentaMarca('cimitarra (ligera)', t, tenia);
    CUENTA.maestriaApp++;
    a = tiradaJ(5, l2.ca, vexOn ? 1 : 0);
    if (a.impacta) {
      const d = danoJ(a, 6, 0, tenia ? [6] : []);
      l2.pg -= d;
      narra(
        `Cimitarra${vexOn ? ' con ventaja (Molestar)' : ''}: ${a.total}, impacta: ${d}. Lobo 2: ${l2.pg} PG.`
      );
    } else narra(`Cimitarra: ${a.total}, falla.`);
    if (vexOn) pensar('acordarse', 'Tirar con ventaja este ataque por Molestar (la app no lo recuerda)');
  } else {
    narra(
      'El botón del ataque ligero con la Cimitarra sale apagado (la acción adicional se fue en pasar la marca).'
    );
    a = tiradaJ(5, l2.ca, vexOn ? 1 : 0);
    if (a.impacta) {
      const d = danoJ(a, 6, 0, tenia ? [6] : []);
      l2.pg -= d;
      narra(
        `Cimitarra (de memoria)${vexOn ? ' con ventaja (Molestar)' : ''}: ${a.total}, impacta: ${d}. Lobo 2: ${l2.pg} PG.`
      );
    } else narra(`Cimitarra (de memoria): ${a.total}, falla.`);
  }

  t = await paso(ctx, `terminar turno (ronda ${ronda})`, async pg => {
    await b.act(pg, 't-end');
    return leerToasts(pg);
  });
  ronda++;

  /* El lobo 2 muerde; Vhaeryn lo remata con el arco (desventaja: el lobo está a 5 pies) */
  for (let i = 0; i < 6 && l2.pg > 0; i++) {
    await recibe(ctx, l2, 15);
    t = await paso(ctx, `espada corta al lobo 2 (ronda ${ronda})`, pg => atacar(pg, 'Espada corta'));
    a = tiradaJ(5, l2.ca);
    if (a.impacta) {
      const marca = !!(await ficha(page)).effects.find(e => e.name === 'Marca del cazador');
      const d = danoJ(a, 6, 3, marca ? [6] : []);
      l2.pg -= d;
      narra(`Espada corta: ${a.total}, impacta: ${d}. Lobo 2: ${l2.pg} PG.`);
    } else narra(`Espada corta: ${a.total}, falla.`);
    if (l2.pg > 0) await finTurno(ctx, ronda++);
  }
  narra('Los lobos caen o huyen.');
  await terminarCombate(ctx);
  c = await ficha(page);
  regla('terminar combate', !c.combat, 'el combate sigue');
  if (c.concentration)
    narra(`Al terminar el combate sigue concentrado en ${c.concentration} (dura más que el combate).`);

  /* Recoger flechas: el jugador las suma a mano en el inventario (regla de su máster) */
  const usadas = fl0 - flechas(c),
    recup = Math.floor(usadas / 2) + (dado(2) - 1);
  if (recup > 0) {
    await recoger(ctx, recup);
    c = await ficha(page);
    hecho('flechas');
    regla('flechas', flechas(c) === fl0 - usadas + recup, `flechas ${flechas(c)}`);
    narra(`Gasta ${usadas} flechas y recoge ${recup} (las suma a mano). Le quedan ${flechas(c)}.`);
  }
}

/* =====================================================================
   Escena 2 · Descansos, Bayas nutritivas y nivel 2
   ===================================================================== */
async function escena2(ctx) {
  const { page } = ctx;
  ESC = 'E2 descansos y nivel 2';
  console.log(`\n— ${ESC}`);
  let c = await ficha(page);

  /* Descanso corto: dado de golpe d10 + CON */
  const antes = c.hp.current,
    hd = antes < c.hp.max ? dado(10) : 0;
  await descansoCorto(ctx, hd);
  c = await ficha(page);
  hecho('corto');
  const espera = hd ? Math.min(c.hp.max, antes + hd + 1) : antes;
  regla(
    'descanso corto',
    c.hp.current === espera,
    `PG ${antes} → ${c.hp.current} (debería ser ${espera}: d10 ${hd} + CON 1)`
  );
  if (hd) regla('descanso corto', c.hitDice.spent === 1, 'no gasta el dado de golpe');
  const fxM = c.effects.find(e => e.name === 'Marca del cazador');
  if (fxM) narra(`La Marca del cazador sigue (le quedan ${fxM.m} min tras el descanso corto).`);

  /* Bayas nutritivas antes de dormir (espacio de nivel 1) */
  const sl = c.slots[0].used;
  let t = await paso(ctx, 'Bayas nutritivas', pg =>
    lanzarFuera(pg, 'Bayas nutritivas', { kind: 'slot', level: 1 })
  );
  c = await ficha(page);
  hecho('bayas');
  narra(`Aviso de Bayas nutritivas: «${t[0]}».`);
  const bay = c.equipment.find(e => e.berry);
  regla('Bayas nutritivas', bay && bay.qty === 10, `bayas: ${bay && bay.qty} (deberían ser 10)`);
  regla('Bayas nutritivas', c.slots[0].used === sl + 1, 'no gasta el espacio');
  const fxB = c.effects.find(e => e.name === 'Bayas nutritivas');
  regla('Bayas nutritivas', fxB && fxB.m === 1440, `efecto ${JSON.stringify(fxB)} (24 horas)`);
  if (tiene(t, /CD de salvación/))
    pensar(
      'acordarse',
      'Bayas nutritivas: el aviso trae «CD de salvación · ataque de conjuro», que no pinta nada aquí'
    );

  /* Come una baya en Combate (acción adicional) */
  if (c.hp.current < c.hp.max) {
    const pg0 = c.hp.current;
    t = await paso(ctx, 'comer una baya', async pg => {
      await irA(pg, 'combat');
      await b.act(pg, 't-item', { i: await idxEq(pg, 'Bayas nutritivas') });
      return leerToasts(pg);
    });
    c = await ficha(page);
    regla(
      'baya',
      c.hp.current === pg0 + 1 && c.equipment.find(e => e.berry).qty === 9,
      `PG ${pg0} → ${c.hp.current}`
    );
  }

  /* Descanso largo: ¿come baya o ración? Los elfos descansan 4 h en trance */
  const raciones = c.equipment.find(e => e.gear === 'rations').qty,
    bayas = c.equipment.find(e => e.berry).qty;
  const lr = await descansoLargo(ctx);
  c = await ficha(page);
  hecho('largo');
  const r2 = c.equipment.find(e => e.gear === 'rations').qty,
    b2 = (c.equipment.find(e => e.berry) || { qty: 0 }).qty;
  narra(`Descanso largo: raciones ${raciones} → ${r2}, bayas ${bayas} → ${b2}.`);
  if (b2 === bayas && r2 === raciones - 1)
    pensar(
      'acordarse',
      'Descanso largo: la app gasta una ración aunque lleva bayas nutritivas que desaparecen mañana; para comerse una baya hay que restarla a mano y desmarcar la ración'
    );
  if (!/trance|4 horas/i.test(lr.txt))
    pensar(
      'acordarse',
      'Trance (elfo): su descanso largo dura 4 horas, no 8; la app cuenta 8 horas para los efectos (bayas, Marca del cazador…)'
    );
  regla(
    'descanso largo',
    c.hp.current === c.hp.max && c.hitDice.spent === 0 && c.slots[0].used === 0,
    'no recupera PG, dados o espacios'
  );
  regla(
    'descanso largo',
    usos(c, 'Marca del cazador gratis').used === 0,
    'no recupera Marca del cazador gratis'
  );
  const fxB2 = c.effects.find(e => e.name === 'Bayas nutritivas');
  regla(
    'descanso largo',
    /* Vhaeryn es elfo: con Trance el descanso largo dura 4 horas (n.º 118) */
    fxB2 && fxB2.m === 1440 - 240,
    `bayas tras el descanso: ${JSON.stringify(fxB2)} (24 h − 4 h, por Trance)`
  );

  /* Nivel 2: Estilo de combate (Tiro con arco), Pericia (Explorador hábil) y Curar heridas */
  const lang0 = c.languages;
  const sube = await paso(ctx, 'subir a nivel 2', pg =>
    subirNivel(pg, { style: 'archery', exp: ['stealth'], conjuros: ['cure-wounds'] })
  );
  c = await ficha(page);
  hecho('nivel2');
  regla(
    'nivel 2',
    sube.vistos.includes('style') && sube.vistos.includes('expert'),
    `pasos: ${sube.vistos.join(', ')}`
  );
  regla('nivel 2', c.level === 2 && c.hp.max === 18, `nivel ${c.level}, PG ${c.hp.max} (11 + 6 + 1 = 18)`);
  regla('nivel 2', (c.featKeys || []).includes('archery'), 'no tiene la dote Tiro con arco');
  const n = await num(page);
  regla('nivel 2', n.arco[0] === 7 && n.arco[1] === '1d8 + 3', `arco ${n.arco} (+5 +2 de Tiro con arco)`);
  regla('nivel 2', n.cimi[0] === 5, `cimitarra ${n.cimi} (Tiro con arco solo a distancia)`);
  regla('nivel 2', n.sig === 7, `Sigilo ${n.sig} (DES 3 + pericia 4 = 7)`);
  regla(
    'nivel 2',
    c.spells.some(s => s.ref === 'cure-wounds'),
    'falta Curar heridas'
  );
  regla(
    'nivel 2',
    JSON.stringify(c.slots.map(s => s.total).slice(0, 2)) === '[2,0]',
    'espacios a nivel 2: 2 de nivel 1'
  );
  if (c.languages === lang0)
    pensar(
      'acordarse',
      'Explorador hábil: dos idiomas más (el asistente no los pregunta; se escriben a mano en la ficha)'
    );
}

/* =====================================================================
   Escena 3 · Nivel 2: emboscada de bandidos en la cueva (Luces danzantes, Curar heridas, suerte)
   ===================================================================== */
async function escena3(ctx) {
  const { page } = ctx;
  ESC = 'E3 nivel 2 · bandidos en la cueva';
  console.log(`\n— ${ESC}`);
  const b1 = enemigo('Capitán bandido', 15, 30, 5, [1, 6, 3], 'cortante');
  const b2 = enemigo('Bandido 2', 12, 11, 3, [1, 6, 1], 'cortante');

  /* Ilumina la cueva para el grupo con Luces danzantes (él ve en la oscuridad; sus amigos no) */
  let t = await paso(ctx, 'Luces danzantes (drow)', pg => lanzarFuera(pg, 'Luces danzantes'));
  let c = await ficha(page);
  hecho('luces');
  narra(`Aviso de Luces danzantes: «${t[0]}».`);
  regla('Luces danzantes', c.concentration === 'Luces danzantes', `concentración «${c.concentration}»`);
  regla('Luces danzantes', c.slots[0].used === 0, 'un truco no gasta espacio');
  const fxL = c.effects.find(e => e.name === 'Luces danzantes');
  regla('Luces danzantes', fxL && fxL.r === 10, `efecto ${JSON.stringify(fxL)} (1 minuto = 10 rondas)`);

  t = await paso(ctx, 'empezar combate', async pg => {
    await irA(pg, 'combat');
    await b.act(pg, 'cb-start');
    return leerToasts(pg);
  });
  /* Marca del cazador: acaba con Luces danzantes (las dos son de concentración) */
  t = await paso(ctx, 'Marca del cazador gratis (rompe Luces danzantes)', pg =>
    lanzar(pg, 'Marca del cazador', { kind: 'free' })
  );
  c = await ficha(page);
  regla(
    'concentración',
    c.concentration === 'Marca del cazador' && !c.effects.find(e => e.name === 'Luces danzantes'),
    'Luces danzantes sigue tras lanzar la Marca'
  );
  regla(
    'concentración',
    tiene(t, /Dejas de concentrarte en Luces danzantes/),
    'no avisa de que Luces danzantes termina'
  );
  pensar(
    'acordarse',
    'Luces danzantes y Marca del cazador son de concentración: al marcar, la cueva se queda a oscuras para sus amigos; la app lo dice solo después de lanzar'
  );

  let ronda = 1;
  t = await paso(ctx, 'arco largo al bandido 1', pg => atacar(pg, 'Arco largo'));
  CUENTA.flechas++;
  regla('Tiro con arco', tiene(t, /1d20 \+7/), `ataque con Tiro con arco: ${t[0]}`);
  cuentaMarca('arco', t, await marcaOn(page));
  let a = tiradaJ(7, b1.ca);
  if (a.impacta) {
    const d = danoJ(a, 8, 3, [6]);
    b1.pg -= d;
    narra(`Flecha: ${a.total}, impacta: ${d}. Bandido 1: ${b1.pg} PG.`);
  } else narra(`Flecha: ${a.total}, falla.`);

  /* Falla por poco: gasta un punto de suerte para repetir con ventaja */
  if (!a.impacta) {
    const c0 = await ficha(page);
    t = await paso(ctx, 'punto de suerte (Afortunado)', async pg => {
      await irA(pg, 'combat');
      await b.act(pg, 't-feat', {
        i: await pg.evaluate(() => C().features.findIndex(f => f.name === 'Puntos de suerte')),
      });
      return leerToasts(pg);
    });
    c = await ficha(page);
    hecho('suerte');
    regla(
      'suerte',
      usos(c, 'Puntos de suerte').used === usos(c0, 'Puntos de suerte').used + 1,
      'no gasta el punto'
    );
    if (!t.length)
      pensar(
        'buscar',
        'Afortunado: al gastar un punto de suerte la app no dice nada (qué hace: ventaja en esa tirada d20, o desventaja al ataque de un enemigo contra ti)'
      );
    narra('Usa un punto de suerte.');
  }
  await finTurno(ctx, ronda++);
  let r = await recibe(ctx, b1, 15);
  r = await recibe(ctx, b2, 15);

  /* Curar heridas sobre sí mismo (acción) */
  c = await ficha(page);
  if (c.hp.current < c.hp.max) {
    const cura = tira(2, 8).suma;
    t = await paso(ctx, `Curar heridas sobre sí mismo (saca ${cura})`, async pg => {
      await lanzar(pg, 'Curar heridas', { kind: 'slot', level: 1 });
      const out = await leerToasts(pg);
      await b.act(pg, 'heal-cast');
      await b.escribir(pg, '#hr-r', cura);
      await b.act(pg, 'hr-ok');
      return out;
    });
    const c2 = await ficha(page);
    hecho('curar');
    regla('Curar heridas', tiene(t, /2d8/) && tiene(t, /\+2/), `aviso: ${t[0]}`);
    regla(
      'Curar heridas',
      c2.hp.current === Math.min(c2.hp.max, c.hp.current + cura + 2),
      `PG ${c.hp.current} → ${c2.hp.current} (+${cura} + SAB 2)`
    );
    narra(`Curar heridas: ${cura} + 2. PG ${c2.hp.current}.`);
  } else {
    t = await paso(ctx, 'arco largo al bandido 1', pg => atacar(pg, 'Arco largo'));
    CUENTA.flechas++;
  }
  await finTurno(ctx, ronda++);

  /* El bandido 2 huye: ataque de oportunidad con la cimitarra */
  t = await paso(ctx, 'ataque de oportunidad al bandido que huye', async pg => {
    await irA(pg, 'combat');
    await b.act(pg, 't-opp');
    await b.act(pg, 't-opp', { i: await idxAtk(pg, 'Cimitarra') }, '#modal');
    return leerToasts(pg);
  });
  c = await ficha(page);
  hecho('oportunidad');
  regla('ataque de oportunidad', c.turn.r && tiene(t, /1d20 \+5/) && tiene(t, /1d6 \+ 3/), `aviso: ${t[0]}`);
  if (!tiene(t, /Mellar/))
    narra('El ataque de oportunidad con la cimitarra no enseña la maestría (Mellar no sirve ahí, bien).');
  cuentaMarca('oportunidad', t, !!c.effects.find(e => e.name === 'Marca del cazador'));
  a = tiradaJ(5, b2.ca);
  narra(
    `Ataque de oportunidad: ${a.total}, ${a.impacta ? 'impacta: el bandido 2 huye herido' : 'falla: el bandido 2 huye'}.`
  );
  b2.pg = 0;

  /* Remata al bandido 1 con dos armas */
  for (let i = 0; i < 4 && b1.pg > 0; i++) {
    t = await paso(ctx, `espada corta al bandido 1 (ronda ${ronda})`, pg => atacar(pg, 'Espada corta'));
    a = tiradaJ(5, b1.ca);
    if (a.impacta) {
      const d = danoJ(a, 6, 3, [6]);
      b1.pg -= d;
      narra(`Espada corta: ${a.total}, impacta: ${d}. Bandido 1: ${b1.pg} PG.`);
    } else narra(`Espada corta: ${a.total}, falla.`);
    let preso = false;
    if (i === 0) {
      const misma = fila(page, 'Espada corta (arma ligera)').locator('[data-act="t-light"]');
      const tc = await ficha(page);
      if (!tc.turn.aa && (await misma.count()))
        regla(
          'arma ligera',
          await misma.isDisabled(),
          'tras atacar con la Espada corta, el ataque extra ligero con la misma Espada corta sale activo (tiene que ser otra arma ligera, lo dice el glosario de la app)'
        );
    }
    if (a.impacta && b1.pg > 0 && !HECHO.has('atrapador')) preso = await golpeAtrapador(ctx, b1);
    let aaAntes = false;
    if (b1.pg > 0) {
      aaAntes = !!(await ficha(page)).turn.aa;
      t = await ligero(ctx, 'Cimitarra');
      c = await ficha(page);
      if (!t) {
        a = tiradaJ(5, b1.ca, preso ? 1 : 0);
        if (a.impacta)
          b1.pg -= danoJ(a, 6, 0, c.effects.find(e => e.name === 'Marca del cazador') ? [6] : []);
        narra(
          `Cimitarra (de memoria): ${a.total}${a.impacta ? `, impacta. Bandido: ${b1.pg} PG` : ', falla'}.`
        );
      }
    }
    if (b1.pg > 0 && t) {
      hecho('dos-armas');
      regla(
        'Mellar',
        c.turn.nick && !!c.turn.aa === aaAntes,
        `turno tras el ataque ligero: ${JSON.stringify(c.turn)}`
      );
      regla(
        'arma ligera',
        tiene(t, /Daño: 1d6 \(sin tu modificador/) && tiene(t, /Mellar/),
        `aviso del ataque ligero: ${t[0]}`
      );
      const marca = !!c.effects.find(e => e.name === 'Marca del cazador');
      cuentaMarca('cimitarra (ligera)', t, marca);
      a = tiradaJ(5, b1.ca, preso ? 1 : 0);
      if (a.impacta) {
        const d = danoJ(a, 6, 0, marca ? [6] : []);
        b1.pg -= d;
        narra(
          `Cimitarra${preso ? ' con ventaja (apresado)' : ''}: ${a.total}, impacta: ${d}. Bandido 1: ${b1.pg} PG.`
        );
      }
    }
    if (b1.pg > 0) {
      const tf = await paso(ctx, `terminar turno (ronda ${ronda})`, async pg => {
        await b.act(pg, 't-end');
        return leerToasts(pg);
      });
      ronda++;
      if ((await ficha(page)).effects.find(e => e.name === 'Golpe atrapador')) {
        regla(
          'Golpe atrapador',
          tiene(tf, /Golpe atrapador.*Fuerza/),
          'al terminar el turno no recuerda la salvación de Fuerza'
        );
        if (!tiene(tf, /1d6/))
          pensar(
            'acordarse',
            'Golpe atrapador: el apresado recibe 1d6 perforante al principio de cada uno de sus turnos (el recordatorio de «Terminar turno» solo habla de la prueba para soltarse)'
          );
      }
      await recibe(ctx, b1, 15);
    }
  }
  narra('El bandido 1 se rinde.');
  await terminarCombate(ctx);
}

/* =====================================================================
   Escena 4 · Nivel 3 (Cazador): goblins en la mina (Fuego feérico, Asesino de colosos)
   ===================================================================== */
async function escena4(ctx) {
  const { page } = ctx;
  ESC = 'E4 nivel 3 · goblins en la mina';
  console.log(`\n— ${ESC}`);
  await descansoLargo(ctx);
  let c = await ficha(page);
  const sube = await paso(ctx, 'subir a nivel 3 (Cazador)', pg =>
    subirNivel(pg, { sub: 'hunter', pg: 8, conjuros: ['fog-cloud'] })
  );
  c = await ficha(page);
  hecho('nivel3');
  regla(
    'nivel 3',
    c.level === 3 && c.subclassKey === 'hunter',
    `nivel ${c.level}, subclase ${c.subclassKey}`
  );
  regla('nivel 3', c.hp.max === 27, `PG ${c.hp.max} (18 + 8 + 1 = 27)`);
  regla(
    'nivel 3',
    JSON.stringify(c.slots.map(s => s.total).slice(0, 2)) === '[3,0]',
    'espacios a nivel 3: 3 de nivel 1'
  );
  const ff = c.spells.find(s => s.ref === 'faerie-fire');
  regla(
    'nivel 3',
    ff && ff.free === 'Fuego feérico (gratis)',
    `Fuego feérico de la Magia drow: ${JSON.stringify(ff && { src: ff.src, free: ff.free })}`
  );
  regla(
    'nivel 3',
    usos(c, 'Fuego feérico (gratis)') && usos(c, 'Fuego feérico (gratis)').max === 1,
    'falta el uso gratis de Fuego feérico'
  );
  regla(
    'nivel 3',
    c.spells.filter(s => !s.src && +s.level > 0).length === 4,
    'conjuros preparados: 4 a nivel 3'
  );
  regla(
    'nivel 3',
    c.features.some(f => f.name === 'Presa del cazador'),
    'falta Presa del cazador'
  );
  if (!/Asesino de colosos|Rompehordas/.test(JSON.stringify(sube.vistos)) && !sube.vistos.includes('prey'))
    pensar(
      'acordarse',
      'Presa del cazador: el asistente no pregunta si eliges Asesino de colosos o Rompehordas; hay que apuntarlo a mano'
    );

  const g = [
    enemigo('Goblin 1', 15, 10, 4, [1, 6, 2], 'cortante'),
    enemigo('Goblin 2', 15, 10, 4, [1, 6, 2], 'perforante'),
    enemigo('Goblin jefe', 17, 21, 4, [2, 6, 2], 'cortante'),
  ];
  let t = await paso(ctx, 'empezar combate', async pg => {
    await irA(pg, 'combat');
    await b.act(pg, 'cb-start');
    return leerToasts(pg);
  });
  let ronda = 1;

  /* Ronda 1: Fuego feérico gratis sobre los goblins (acción) */
  t = await paso(ctx, 'Fuego feérico gratis', pg => lanzar(pg, 'Fuego feérico', { kind: 'free' }));
  c = await ficha(page);
  hecho('fuego');
  narra(`Aviso de Fuego feérico: «${t[0]}».`);
  regla(
    'Fuego feérico',
    usos(c, 'Fuego feérico (gratis)').used === 1 && c.slots[0].used === 0,
    'el uso gratis gasta un espacio o no gasta el uso'
  );
  regla('Fuego feérico', c.concentration === 'Fuego feérico', `concentración «${c.concentration}»`);
  regla('Fuego feérico', tiene(t, /CD 12/), `CD (8 + 2 + SAB 2 = 12): ${t[0]}`);
  if (!tiene(t, /Destreza|DES/))
    pensar('buscar', 'Fuego feérico: el aviso dice la CD pero no que es una salvación de Destreza');
  const fallan = [dado(20) + 2 < 12, dado(20) + 2 < 12, dado(20) + 1 < 12];
  narra(`Fuego feérico: ${fallan.filter(Boolean).length} de 3 goblins quedan perfilados.`);
  await finTurno(ctx, ronda++);
  for (const e of g.slice(0, 2)) await recibe(ctx, e, 15);

  /* Ronda 2: dispara al goblin perfilado (ventaja). Duda: ¿Marca del cazador? Rompería el Fuego feérico */
  c = await ficha(page);
  const ffOn = c.concentration === 'Fuego feérico';
  t = await paso(ctx, 'arco largo al goblin 1', pg => atacar(pg, 'Arco largo'));
  CUENTA.flechas++;
  if (ffOn && fallan[0] && !tiene(t, /ventaja/i))
    pensar(
      'acordarse',
      'Fuego feérico: los ataques contra un objetivo perfilado tienen ventaja (el aviso del ataque no lo dice)'
    );
  if (!tiene(t, /colosos|1d8 extra/i))
    pensar(
      'acordarse',
      'Asesino de colosos: +1d8 una vez por turno si el objetivo ya estaba herido (el aviso del ataque no lo dice)'
    );
  let a = tiradaJ(7, g[0].ca, ffOn && fallan[0] ? 1 : 0);
  if (a.impacta) {
    const d = danoJ(a, 8, 3);
    g[0].pg -= d;
    narra(
      `Flecha${ffOn && fallan[0] ? ' con ventaja' : ''}: ${a.total}, impacta: ${d}. Goblin 1: ${g[0].pg} PG.`
    );
  } else narra(`Flecha: ${a.total}, falla.`);
  /* El jugador novato lanza la Marca igualmente (acción adicional) y pierde el Fuego feérico */
  t = await paso(ctx, 'Marca del cazador con espacio (rompe Fuego feérico)', pg =>
    lanzar(pg, 'Marca del cazador', { kind: 'free' })
  );
  c = await ficha(page);
  regla(
    'concentración',
    c.concentration === 'Marca del cazador' && !c.effects.find(e => e.name === 'Fuego feérico'),
    'el Fuego feérico sigue'
  );
  if (ffOn)
    pensar(
      'acordarse',
      'Marca del cazador acaba con el Fuego feérico (los dos son de concentración): la app no avisa antes de lanzar'
    );
  if (!tiene(t, /inmunidades|resistencias|vulnerabilidades/i))
    pensar(
      'acordarse',
      'Saber del cazador (nivel 3): al marcar, preguntar al máster las inmunidades, resistencias y vulnerabilidades de la presa (el aviso no lo recuerda)'
    );
  await finTurno(ctx, ronda++);
  await recibe(ctx, g[2], 15);

  /* Ronda 3: dos flechas no: un ataque (aún sin Ataque adicional) */
  for (let i = 0; i < 4 && g[0].pg > 0; i++) {
    t = await paso(ctx, `arco largo al goblin 1 (ronda ${ronda})`, pg => atacar(pg, 'Arco largo'));
    CUENTA.flechas++;
    cuentaMarca('arco', t, await marcaOn(page));
    a = tiradaJ(7, g[0].ca);
    if (a.impacta) {
      const d = danoJ(a, 8, 3, [6, 8]);
      g[0].pg -= d;
      narra(`Flecha: ${a.total}, impacta: ${d} (con Marca y Asesino de colosos). Goblin 1: ${g[0].pg} PG.`);
    } else narra(`Flecha: ${a.total}, falla.`);
    await finTurno(ctx, ronda++);
    if (g[0].pg > 0) await recibe(ctx, g[1], 15);
  }
  narra('Cae el goblin 1. El jefe y el otro goblin huyen por un túnel.');
  /* La presa ha caído: pasa la marca al jefe, que huye */
  c = await ficha(page);
  if (c.effects.find(e => e.name === 'Marca del cazador')) {
    await paso(ctx, 'pasar la marca al jefe', async pg => {
      await irA(pg, 'combat');
      await b.act(pg, 't-mark', { id: 'hunters-mark' });
    });
    hecho('marca-pasa');
  }
  await terminarCombate(ctx);
  c = await ficha(page);
  /* Siguen al jefe por el rastro: ventaja en Supervivencia por la Marca */
  const n = await num(page);
  const sup = await tirada(page, 'survival');
  narra(`Prueba de Supervivencia para seguir al jefe: «${sup}».`);
  regla('Supervivencia', new RegExp(`1d20 \\+${n.sup}`).test(sup), `tirada: ${sup}`);
  if (!/ventaja/i.test(sup))
    pensar(
      'acordarse',
      'Marca del cazador: ventaja en Percepción y Supervivencia para encontrar a la presa (la tirada de la habilidad no lo dice)'
    );
}

/* =====================================================================
   Escena 5 · Niveles 4 y 5: el ogro del puente (mejora, Ataque adicional, Oscuridad)
   ===================================================================== */
async function escena5(ctx) {
  const { page } = ctx;
  ESC = 'E5 niveles 4 y 5 · el ogro';
  console.log(`\n— ${ESC}`);
  await descansoLargo(ctx);
  let s = await paso(ctx, 'subir a nivel 4 (+1 DES, +1 SAB)', pg =>
    subirNivel(pg, { asi: { mode: '11', a: 'dex', b: 'wis' }, conjuros: ['longstrider'] })
  );
  let c = await ficha(page);
  hecho('nivel4');
  let n = await num(page);
  regla(
    'nivel 4',
    c.abilities.dex === 18 && c.abilities.wis === 16,
    `DES ${c.abilities.dex}, SAB ${c.abilities.wis}`
  );
  regla('nivel 4', c.hp.max === 34, `PG ${c.hp.max} (27 + 6 + 1 = 34)`);
  regla(
    'nivel 4',
    n.arco[0] === 8 && n.arco[1] === '1d8 + 4',
    `arco ${n.arco} (DES 4 + 2 + 2 = +8; 1d8 + 4)`
  );
  regla('nivel 4', n.cimi[0] === 6 && n.cimi[1] === '1d6 + 4', `cimitarra ${n.cimi}`);
  regla('nivel 4', n.ca === 16 && n.ini === 4, `CA ${n.ca}, iniciativa ${n.ini}`);
  regla('nivel 4', n.cd === 13 && n.atk === 5, `CD ${n.cd}, ataque de conjuro ${n.atk}`);
  regla('nivel 4', n.sig === 8 && n.perc === 5, `Sigilo ${n.sig} (4 + 4), Percepción ${n.perc} (3 + 2)`);

  s = await paso(ctx, 'subir a nivel 5', pg => subirNivel(pg, { pg: 3, conjuros: ['pass-without-trace'] }));
  c = await ficha(page);
  hecho('nivel5');
  n = await num(page);
  regla('nivel 5', c.hp.max === 38, `PG ${c.hp.max} (34 + 3 + 1 = 38)`);
  regla(
    'nivel 5',
    n.pb === 3 && n.arco[0] === 9 && n.cd === 14,
    `competencia ${n.pb}, arco ${n.arco[0]}, CD ${n.cd}`
  );
  regla('nivel 5', n.ataques === 2, `ataques por acción: ${n.ataques} (Ataque adicional)`);
  regla(
    'nivel 5',
    JSON.stringify(c.slots.map(x => x.total).slice(0, 3)) === '[4,2,0]',
    `espacios ${JSON.stringify(c.slots.map(x => x.total).slice(0, 3))} (4 y 2)`
  );
  regla(
    'nivel 5',
    usos(c, 'Marca del cazador gratis').max === 3,
    `Marca gratis ${usos(c, 'Marca del cazador gratis').max} (3 a nivel 5)`
  );
  regla(
    'nivel 5',
    usos(c, 'Puntos de suerte').max === 3,
    `puntos de suerte ${usos(c, 'Puntos de suerte').max} (competencia 3)`
  );
  const os = c.spells.find(x => x.ref === 'darkness');
  regla(
    'nivel 5',
    os && os.free === 'Oscuridad (gratis)' && usos(c, 'Oscuridad (gratis)').max === 1,
    'falta Oscuridad gratis'
  );
  regla(
    'nivel 5',
    c.spells.filter(x => !x.src && +x.level > 0).length === 6,
    'conjuros preparados: 6 a nivel 5'
  );
  regla(
    'nivel 5',
    /Ataque adicional/.test(s.textos.summary || ''),
    'el resumen no habla del Ataque adicional'
  );

  const ogro = enemigo('Ogro', 11, 68, 6, [2, 8, 4], 'contundente');
  let t = await paso(ctx, 'empezar combate', async pg => {
    await irA(pg, 'combat');
    await b.act(pg, 'cb-start');
    return leerToasts(pg);
  });
  regla('iniciativa', tiene(t, /1d20 \+4/), `iniciativa con DES 18: ${t[0]}`);
  let ronda = 1;
  t = await paso(ctx, 'Marca del cazador gratis al ogro', pg =>
    lanzar(pg, 'Marca del cazador', { kind: 'free' })
  );
  c = await ficha(page);
  regla('Marca', c.effects.find(e => e.name === 'Marca del cazador').m === 60, 'la marca gratis dura 1 hora');

  /* Ataque adicional: dos flechas */
  const fl0 = flechas(c);
  t = await paso(ctx, 'primera flecha', pg => atacar(pg, 'Arco largo'));
  c = await ficha(page);
  CUENTA.flechas++;
  regla(
    'Ataque adicional',
    c.turn.atk === 1 && tiene(t, /te queda 1 ataque\b/),
    `turno ${JSON.stringify(c.turn)}`
  );
  if (tiene(t, /te quedan 1 ataques/)) narra('El aviso dice «te quedan 1 ataques» (debería ser «1 ataque»).');
  regla('ataque', tiene(t, /1d20 \+9/) && tiene(t, /1d8 \+ 4/), `arco a nivel 5: ${t[0]}`);
  cuentaMarca('arco', t, await marcaOn(page));
  let a = tiradaJ(9, ogro.ca);
  if (a.impacta) {
    const d = danoJ(a, 8, 4, [6, 8]);
    ogro.pg -= d;
    narra(`Flecha 1: ${a.total}, impacta: ${d}. Ogro: ${ogro.pg} PG.`);
  } else narra(`Flecha 1: ${a.total}, falla.`);
  t = await paso(ctx, 'segunda flecha', pg => atacar(pg, 'Arco largo'));
  c = await ficha(page);
  CUENTA.flechas++;
  regla(
    'Ataque adicional',
    c.turn.atk === 0 && flechas(c) === fl0 - 2,
    `ataques ${c.turn.atk}, flechas ${flechas(c)}`
  );
  cuentaMarca('arco', t, await marcaOn(page));
  a = tiradaJ(9, ogro.ca);
  if (a.impacta) {
    const d = danoJ(a, 8, 4, [6]);
    ogro.pg -= d;
    narra(`Flecha 2: ${a.total}, impacta: ${d}. Ogro: ${ogro.pg} PG.`);
  } else narra(`Flecha 2: ${a.total}, falla.`);
  pensar(
    'acordarse',
    'Asesino de colosos es una vez por turno: con dos flechas, recordar en cuál se ha sumado el 1d8'
  );
  const arcoOff = await fila(page, 'Arco largo').locator('[data-act="t-atk"]').isDisabled();
  regla('Ataque adicional', arcoOff, 'tras dos ataques el arco sigue activo');
  await finTurno(ctx, ronda++);
  await recibe(ctx, ogro, 16);

  /* El ogro se le echa encima: cuerpo a cuerpo con Ataque adicional y Mellar */
  t = await paso(ctx, 'espada corta (1.º ataque)', pg => atacar(pg, 'Espada corta'));
  regla('ataque', tiene(t, /1d20 \+7/) && tiene(t, /1d6 \+ 4/), `espada corta a nivel 5: ${t[0]}`);
  t = await paso(ctx, 'espada corta (2.º ataque, Ataque adicional)', pg => atacar(pg, 'Espada corta'));
  c = await ficha(page);
  regla('Ataque adicional', c.turn.atk === 0, `ataques que quedan ${c.turn.atk}`);
  /* Mellar: el ataque extra con la cimitarra va dentro de la acción; la acción adicional queda libre */
  t = (await ligero(ctx, 'Cimitarra')) || [];
  c = await ficha(page);
  if (t.length) hecho('dos-armas');
  regla(
    'Mellar',
    !c.turn.aa && c.turn.nick,
    `con Mellar la acción adicional debería quedar libre: ${JSON.stringify(c.turn)}`
  );
  regla('arma ligera', tiene(t, /Daño: 1d6 \(sin tu modificador/), `daño del ataque ligero: ${t[0]}`);
  /* Ya ha hecho el ataque extra de Ligera: no debería poder hacer otro con la acción adicional */
  const otro = fila(page, 'Espada corta (arma ligera)').locator('[data-act="t-light"]');
  regla(
    'arma ligera',
    !(await otro.count()) || (await otro.isDisabled()),
    'tras el ataque extra con Mellar, la app deja hacer otro ataque extra ligero con la acción adicional (Ligera da un solo ataque extra por turno)'
  );
  for (let k = 0; k < 3; k++) {
    a = tiradaJ(7, ogro.ca);
    if (a.impacta) ogro.pg -= danoJ(a, 6, k === 2 ? 0 : 4, k === 0 ? [6, 8] : [6]);
  }
  narra(
    `Tres golpes cuerpo a cuerpo (dos con la espada corta y la cimitarra con Mellar). Ogro: ${ogro.pg} PG.`
  );
  pensar(
    'calcular',
    'Con tres golpes en un turno, sumar el 1d6 de la Marca a cada impacto y el 1d8 de Asesino de colosos solo a uno'
  );
  await finTurno(ctx, ronda++);
  const r = await recibe(ctx, ogro, 16);

  /* Oscuridad gratis para escapar del ogro: rompe la Marca; su visión en la oscuridad no ve a través */
  c = await ficha(page);
  t = await paso(ctx, 'Oscuridad gratis (drow)', pg => lanzar(pg, 'Oscuridad', { kind: 'free' }));
  c = await ficha(page);
  hecho('oscuridad');
  narra(`Aviso de Oscuridad: «${t[0]}».`);
  regla(
    'Oscuridad',
    usos(c, 'Oscuridad (gratis)').used === 1 && c.slots[1].used === 0,
    'el uso gratis gasta espacio o no gasta el uso'
  );
  regla('Oscuridad', c.concentration === 'Oscuridad', `concentración «${c.concentration}»`);
  const fxO = c.effects.find(e => e.name === 'Oscuridad');
  regla('Oscuridad', fxO && fxO.m === 10, `efecto ${JSON.stringify(fxO)} (10 minutos)`);
  if (!tiene(t, /visi[oó]n en la oscuridad/i))
    pensar(
      'buscar',
      'Oscuridad: su visión en la oscuridad no ve a través de la oscuridad mágica; dentro, nadie ve a nadie (ventaja y desventaja se anulan). El aviso no lo dice'
    );
  if (tiene(t, /ataque de conjuro/))
    pensar(
      'acordarse',
      'Oscuridad: el aviso dice «CD 14 · ataque de conjuro +6», que no sirven para este conjuro'
    );
  if (tiene(t, /Dejas de concentrarte en Marca del cazador/))
    pensar(
      'acordarse',
      'Oscuridad es de concentración y acaba con la Marca del cazador: la app lo dice solo después de lanzarla'
    );
  if (r.pierde === false && !tiene(t, /Marca del cazador/))
    regla('Oscuridad', false, 'no avisa de que la Marca termina');
  narra('Vhaeryn se esconde en la oscuridad y el grupo remata al ogro.');
  await terminarCombate(ctx);
}

/* =====================================================================
   Escena 6 · Fuera de combate: flechas, bayas, sigilo y descanso
   ===================================================================== */
async function escena6(ctx) {
  const { page } = ctx;
  ESC = 'E6 fuera de combate';
  console.log(`\n— ${ESC}`);
  let c = await ficha(page);
  /* Recoge flechas (a mano) */
  const recup = 3;
  await recoger(ctx, recup);
  hecho('flechas');
  /* Pasar sin dejar rastro y una prueba de Sigilo con pericia */
  let t = await paso(ctx, 'Pasar sin dejar rastro', pg =>
    lanzarFuera(pg, 'Pasar sin dejar rastro', { kind: 'slot', level: 2 })
  );
  c = await ficha(page);
  regla(
    'Pasar sin dejar rastro',
    c.slots[1].used >= 1 && c.concentration === 'Pasar sin dejar rastro',
    `espacios ${JSON.stringify(c.slots[1])}`
  );
  const n = await num(page);
  const sig = await tirada(page, 'stealth');
  narra(`Prueba de Sigilo del grupo con Pasar sin dejar rastro. La app dice: «${sig}».`);
  regla(
    'Sigilo',
    new RegExp(`1d20 \\+${n.sig}`).test(sig) && /pericia/.test(sig),
    `tirada de Sigilo: ${sig}`
  );
  if (!/\+20|Pasar sin dejar rastro/.test(sig))
    pensar(
      'calcular',
      'Pasar sin dejar rastro: sumar +10 a la prueba de Sigilo (la habilidad no lo suma ni lo recuerda)'
    );

  /* Falla la prueba por poco: punto de suerte (fuera de combate, desde la columna «Sin gastar acción») */
  if (!HECHO.has('suerte')) {
    const c0 = await ficha(page);
    t = await paso(ctx, 'punto de suerte para repetir el Sigilo', async pg => {
      await irA(pg, 'combat');
      await b.act(pg, 't-feat', {
        i: await pg.evaluate(() => C().features.findIndex(f => f.name === 'Puntos de suerte')),
      });
      return leerToasts(pg);
    });
    c = await ficha(page);
    hecho('suerte');
    regla(
      'suerte',
      usos(c, 'Puntos de suerte').used === usos(c0, 'Puntos de suerte').used + 1,
      'no gasta el punto'
    );
    if (!t.length)
      pensar(
        'buscar',
        'Afortunado: al gastar un punto de suerte la app no dice nada (qué hace: ventaja en esa tirada d20, o desventaja al ataque de un enemigo contra ti)'
      );
  }
  /* Descanso largo comiendo bayas, si quedan */
  await descansoLargo(ctx);
  c = await ficha(page);
  regla(
    'descanso largo',
    usos(c, 'Fuego feérico (gratis)').used === 0 && usos(c, 'Oscuridad (gratis)').used === 0,
    'no recupera la magia drow gratis'
  );
  regla('descanso largo', usos(c, 'Puntos de suerte').used === 0, 'no recupera los puntos de suerte');
  regla(
    'descanso largo',
    !c.turn.r && !c.turn.a && !c.turn.aa,
    `el turno no queda limpio: ${JSON.stringify(c.turn)}`
  );
}

(async () => {
  const ctx = await b.abrir();
  console.log(`Partida simulada del explorador (semilla ${SEMILLA})`);
  for (const f of [escena1, escena2, escena3, escena4, escena5, escena6]) {
    try {
      await f(ctx);
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
  await ctx.browser.close();

  /* Informe */
  if (CUENTA.marcaApp)
    b.sola(
      `+1d6 de Marca del cazador: la app lo dice ${CUENTA.marcaApp} de ${CUENTA.marcaApp + CUENTA.marcaFuera} veces`
    );
  if (CUENTA.marcaFuera)
    b.noSola(`+1d6 de Marca del cazador: buscado fuera de la app ${CUENTA.marcaFuera} veces`);
  if (CUENTA.maestriaApp)
    b.sola(
      `Maestrías: el aviso las trae ${CUENTA.maestriaApp} de ${CUENTA.maestriaApp + CUENTA.maestriaFuera} veces`
    );
  b.sola(`Munición: ${CUENTA.flechas} disparos descontados solos`);
  b.sola('Marca del cazador gratis, duración, concentración y pasarla a otra presa sin espacio');
  b.sola(
    'Ataque extra con arma ligera sin modificador, Mellar sin gastar la acción adicional, Ataque adicional a nivel 5'
  );
  b.sola(
    'Bayas nutritivas: 10 bayas, comer en Combate, comida del descanso largo; Magia drow gratis a nivel 3 y 5'
  );
  const grupos = {};
  PIENSA.forEach(p => (grupos[p.que] = grupos[p.que] || { ...p, n: 0 }).n++);
  for (const p of Object.values(grupos)) b.noSola(`(${p.tipo}${p.n > 1 ? ` ×${p.n}` : ''}) ${p.que}`);
  console.log(`\nDiario de la partida:\n${DIARIO.map(x => '  ' + x).join('\n')}`);
  console.log(
    `\nVeces que el jugador piensa fuera de la app: ${PIENSA.length} (${Object.keys(grupos).length} distintas)`
  );
  console.log(
    `Marca del cazador: la app ${CUENTA.marcaApp}, fuera ${CUENTA.marcaFuera} · Maestrías: la app ${CUENTA.maestriaApp}, fuera ${CUENTA.maestriaFuera}`
  );
  console.log(`Reglas comprobadas: ${REGLAS.ok + REGLAS.mal} (${REGLAS.mal} mal)`);
  const faltan = Object.keys(MOMENTOS).filter(k => !HECHO.has(k));
  console.log(
    faltan.length
      ? `Momentos que no han salido con esta semilla: ${faltan.map(k => MOMENTOS[k]).join('; ')}`
      : 'Han salido todos los momentos de la partida.'
  );
  process.exitCode = b.informe('Partida simulada: explorador elfo drow, niveles 1 a 5');
})();
