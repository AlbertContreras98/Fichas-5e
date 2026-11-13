/* Prueba de la fase 3: partida simulada con Bruno (monje humano) de nivel 1 a 5, como un jugador novato con dados físicos. */
'use strict';

/* Uso: node tests/partida-monje.js [--semilla=N] [--rastro]
   Escenas: bandidos en el camino (nivel 1, cae a 0 PG), descansos y nivel 2, goblins en las ruinas (nivel 2, dos combates
   seguidos con Metabolismo asombroso), nivel 3 con la Mano Abierta y arqueros (Desviar ataques), niveles 4 y 5 y el ogro
   (Golpe aturdidor, Ataque adicional, Caída lenta), y fuera de combate (escudo y armadura, descanso largo).
   Con la semilla 3 (la de siempre) salen todos los momentos; con otras, alguno puede no salir (lo dice el informe).
   Los dados los «tira» el guion con la semilla y escribe los resultados donde la app los pide.
   Cada vez que el jugador tiene que acordarse de algo, calcular algo o buscar una regla fuera de la app, se apunta («Pensar»). */

const b = require('./base');

const ARG = process.argv.slice(2);
const SEMILLA = +(ARG.find(a => a.startsWith('--semilla=')) || '--semilla=3').slice(10) || 3;
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
/* Lo que pide PLAN.md: cuántas veces la app da los números del golpe desarmado y cuántas hay que sacarlos fuera */
const CUENTA = { golpeApp: 0, golpeFuera: 0, puntos: 0 };
const MOMENTOS = {
  desarmado: 'golpe desarmado con la acción (Otras acciones)',
  'desarmado-aa': 'golpe desarmado extra con la acción adicional (Artes marciales)',
  lanzar: 'lanzar una daga',
  inspiracion: 'gastar la Inspiración heroica',
  'cae-0': 'cae a 0 PG, salvación contra muerte y le curan',
  corto: 'descanso corto (dado de golpe y puntos de concentración)',
  largo: 'descanso largo (Inspiración heroica, Metabolismo asombroso)',
  nivel2: 'nivel 2 (puntos, Movimiento sin armadura, Metabolismo)',
  rafaga: 'Ráfaga de golpes',
  'paciente-0': 'Defensa paciente gratis',
  'paciente-1': 'Defensa paciente con 1 punto',
  'viento-0': 'Paso del viento gratis',
  'viento-1': 'Paso del viento con 1 punto',
  metabolismo: 'Metabolismo asombroso al tirar iniciativa',
  nivel3: 'nivel 3 (Mano Abierta, Desviar ataques)',
  desviar: 'Desviar ataques',
  devolver: 'devolver el golpe con Desviar ataques (1 punto)',
  'mano-abierta': 'Técnica de la mano abierta',
  nivel4: 'nivel 4 (mejora de característica)',
  caida: 'Caída lenta',
  nivel5: 'nivel 5 (Ataque adicional, Golpe aturdidor, d8)',
  aturdidor: 'Golpe aturdidor',
  empujar: 'Empujar',
  armadura: 'escudo y armadura (sin Defensa sin armadura ni Artes marciales)',
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
const filaExacta = (page, nombre) =>
  page.locator('.trow').filter({ has: page.locator('.tname', { hasText: new RegExp(`^${nombre}`) }) });
async function atacar(page, nombre, extra = {}) {
  await irA(page, 'combat');
  const i = await idxAtk(page, nombre);
  /* «Atacar» cuerpo a cuerpo o «Lanzar» (las armas arrojadizas tienen los dos botones) */
  const sel = `[data-act="t-atk"][data-i="${i}"]${extra.throw ? '[data-throw="1"]' : ':not([data-throw])'}`;
  await page.locator(sel).filter({ visible: true }).first().click();
  const t = await leerToasts(page);
  if (RASTRO) console.log(`    aviso: ${t.join(' | ')}`);
  return t;
}
/* Pulsa una opción derivada de la pestaña Combate (Ráfaga de golpes, Defensa paciente…) por su nombre exacto */
async function derivada(page, nombre) {
  await irA(page, 'combat');
  const j = await page.evaluate(n => DERIVED.findIndex(o => o.n === n), nombre);
  if (j < 0) throw new Error(`no existe la opción «${nombre}»`);
  const btn = page.locator(`[data-act="t-der"][data-j="${j}"]`).first();
  if (!(await btn.count())) throw new Error(`«${nombre}» no sale en Combate`);
  if (await btn.isDisabled()) throw new Error(`«${nombre}» está apagado en Combate`);
  await btn.click();
  await b.actSi(page, 'cast-conc-ok', {}, '#modal'); // aviso de concentración (n.º 112)
  const t = await leerToasts(page);
  if (RASTRO) console.log(`    aviso: ${t.join(' | ')}`);
  return t;
}
const derivadaOn = async (page, nombre) => {
  await irA(page, 'combat');
  const j = await page.evaluate(n => DERIVED.findIndex(o => o.n === n), nombre);
  const btn = page.locator(`[data-act="t-der"][data-j="${j}"]`).first();
  return (await btn.count()) > 0 && !(await btn.isDisabled());
};
async function desarmado(page) {
  await irA(page, 'combat');
  await b.act(page, 't-unarmed');
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
const idxFeat = (page, n) => page.evaluate(x => C().features.findIndex(f => f.name === x), n);
const usos = (c, n) => {
  const f = c.features.find(x => x.name === n);
  return f ? f.uses : null;
};
const puntos = c => {
  const u = usos(c, 'Puntos de concentración');
  return u ? u.max - u.used : -1;
};
const num = page =>
  page.evaluate(() => {
    const c = C(),
      a = n => c.attacks.find(x => x.name === n) || {},
      u = unarmedCalc(c);
    return {
      ca: acOf(c),
      caTxt: acCalc(c).src,
      ini: init(c),
      pb: pb(c),
      vel: speedCalc(c).ft,
      golpe: [u.atk, u.dmg],
      lanza: [a('Lanza').atk, a('Lanza').dmg],
      daga: [a('Daga').atk, a('Daga').dmg],
      baston: [a('Bastón').atk, a('Bastón').dmg],
      atl: skillB(c, SK.athletics),
      acro: skillB(c, SK.acrobatics),
      sig: skillB(c, SK.stealth),
      ataques: attacksPerAction(c),
      ma: infoFor(defOf(c), subOf(c), c.level)['Dado de artes marciales'],
    };
  });
/* Lo que dice un aviso de golpe desarmado: ¿trae el ataque y el daño? */
function cuentaGolpe(donde, t, atk, dmg) {
  const ok = tiene(t, new RegExp(`1d20 \\+${atk}`)) && tiene(t, new RegExp(dmg.replace(/\+/g, '\\+')));
  if (ok) CUENTA.golpeApp++;
  else {
    CUENTA.golpeFuera++;
    pensar(
      'buscar',
      `${donde}: el aviso no dice qué tirar (hay que mirar el «Golpe desarmado» de Otras acciones: 1d20 +${atk}, ${dmg} contundente)`
    );
  }
  return ok;
}

/* ---------- Enemigos (los números los decide el máster; aquí, inventados) ---------- */

const enemigo = (n, ca, pg, atk, dmg, tipo) => ({ n, ca, pg, max: pg, atk, dmg, tipo });
function ataqueEnemigo(e, ca, ven = 0) {
  const d1 = dado(20),
    d2 = ven ? dado(20) : d1,
    d = ven > 0 ? Math.max(d1, d2) : ven < 0 ? Math.min(d1, d2) : d1,
    total = d + e.atk;
  const [n, c, m] = e.dmg;
  const v = ven < 0 ? ' (con desventaja)' : ven > 0 ? ' (con ventaja)' : '';
  if (d === 20) {
    const r = tira(2 * n, c);
    narra(`${e.n} ataca${v}: 20 natural, ¡crítico! ${r.suma + m} de daño ${e.tipo}`);
    return { dmg: r.suma + m, crit: true };
  }
  if (d !== 1 && total >= ca) {
    const r = tira(n, c);
    narra(`${e.n} ataca${v}: ${total} contra CA ${ca}, impacta: ${r.suma + m} de daño ${e.tipo}`);
    return { dmg: r.suma + m };
  }
  narra(`${e.n} ataca${v}: ${total} contra CA ${ca}, falla`);
  return { dmg: 0 };
}
/* El monje ataca: ven = 1 ventaja, -1 desventaja */
function tiradaJ(bono, ca, ven = 0) {
  const d1 = dado(20),
    d2 = ven ? dado(20) : d1,
    d = ven > 0 ? Math.max(d1, d2) : ven < 0 ? Math.min(d1, d2) : d1;
  return { d, total: d + bono, impacta: d === 20 || (d !== 1 && d + bono >= ca), crit: d === 20 };
}
function danoJ(a, caras, mod) {
  return tira(a.crit ? 2 : 1, caras).suma + mod;
}
/* Golpea a un enemigo: devuelve si impacta */
function golpea(e, bono, caras, mod, que, ven = 0) {
  const a = tiradaJ(bono, e.ca, ven);
  if (a.impacta) {
    const d = danoJ(a, caras, mod);
    e.pg -= d;
    narra(`${que}: ${a.total}${a.crit ? ' (crítico)' : ''}, impacta: ${d}. ${e.n}: ${Math.max(0, e.pg)} PG.`);
  } else narra(`${que}: ${a.total}, falla.`);
  return a;
}

/* El monje recibe daño (sin reacción) */
async function recibe(ctx, e, ca, ven = 0) {
  const { page } = ctx;
  const r = ataqueEnemigo(e, ca, ven);
  if (!r.dmg) return r;
  await paso(ctx, `recibe ${r.dmg} de daño ${e.tipo}`, async pg => {
    const out = await vida(pg, r.dmg, 'dmg');
    await b.cerrarModal(pg);
    return out;
  });
  const c = await ficha(page);
  if (c.hp.current === 0) {
    r.cae = true;
    await caer(ctx);
  }
  return r;
}

/* Desviar ataques: la reacción en la ventana de «Vida y estado». Devuelve {red, quedan, t} */
async function desviar(ctx, e, dmg) {
  const { page } = ctx;
  const c0 = await ficha(page);
  const dd = dado(10);
  /* ¿Está libre el botón? (la reacción vuelve al empezar su turno) */
  await b.act(page, 'vida');
  const libre = await page.locator('#modal [data-act="hp-red"][data-k="deflect"]').isEnabled();
  await b.cerrarModal(page);
  if (!libre) {
    regla(
      'reacción',
      false,
      `la reacción sale gastada para Desviar ataques, aunque ya ha empezado otro turno suyo desde que la usó (turno ${JSON.stringify(c0.turn)})`
    );
    pensar(
      'acordarse',
      'La reacción gastada antes de su primer turno no vuelve en ese turno: para Desviar ataques en la ronda siguiente hay que saber pulsar el ↺ de «Reacción» en Combate'
    );
    await paso(ctx, 'liberar la reacción con ↺', async pg => {
      await irA(pg, 'combat');
      await b.act(pg, 't-reset', { k: 'r' });
    });
  }
  const t = await paso(ctx, `Desviar ataques (${dmg} de daño, sale ${dd} en el d10)`, async pg => {
    await b.act(pg, 'vida');
    await b.escribir(pg, '#hpAmt', dmg);
    await b.act(pg, 'hp-red', { k: 'deflect' }, '#modal');
    const txt = (await texto(pg, '#modal .sheet')).replace(/\s+/g, ' ');
    await b.escribir(pg, '#red-r', dd);
    await b.act(pg, 'hp-red-ok', { k: 'deflect' });
    await b.cerrarModal(pg);
    return { txt, t: await leerToasts(pg) };
  });
  const c = await ficha(page);
  const x = (await page.evaluate(() => M(C(), 'dex'))) + c.level;
  const quedan = Math.max(0, dmg - (dd + x));
  hecho('desviar');
  regla(
    'Desviar ataques',
    new RegExp(`Tira 1d10 .* la app suma \\+${x}`).test(t.txt),
    `la ventana debería decir 1d10 + ${x} (DES + nivel de monje): ${t.txt}`
  );
  regla(
    'Desviar ataques',
    c.hp.current === Math.max(0, c0.hp.current - quedan),
    `PG ${c0.hp.current} → ${c.hp.current} (daño ${dmg} − ${dd + x} = ${quedan})`
  );
  if (c.combat) regla('Desviar ataques', c.turn.r, 'no gasta la reacción en combate');
  narra(
    `${e.n} le da (${dmg} ${e.tipo}); Desviar ataques: 1d10 (${dd}) + ${x} = ${dd + x}. Recibe ${quedan}. PG ${c.hp.current}.`
  );
  if (!/contundente|cortante|perforante/.test(t.txt))
    pensar('acordarse', 'Desviar ataques solo sirve contra daño contundente, cortante o perforante');
  return { red: dd + x, quedan, t: t.t };
}

/* Cae a 0 PG: salvación contra muerte en su turno, «Terminar turno» y la clériga le cura */
async function caer(ctx) {
  const { page } = ctx;
  let c = await ficha(page);
  regla(
    'caer a 0 PG',
    c.hp.current === 0 && c.conditions.includes('Inconsciente'),
    `PG ${c.hp.current}, estados ${c.conditions}`
  );
  if (!c.conditions.includes('Derribado'))
    pensar(
      'acordarse',
      'Al caer inconsciente también quedas Derribado y sueltas lo que llevas (la app no lo marca, n.º 108)'
    );
  narra('Bruno cae a 0 PG.');
  const sv1 = dado(20);
  const r1 = sv1 === 20 ? '20' : sv1 >= 10 ? 'ok' : sv1 === 1 ? '1' : 'ko';
  await paso(ctx, `salvación contra muerte (sale ${sv1})`, async pg => {
    await irA(pg, 'combat');
    await b.act(pg, 'ds-roll', { r: r1 }, '.death');
  });
  c = await ficha(page);
  narra(`Salvación contra muerte: ${sv1}. Éxitos ${c.deathSaves.success}, fallos ${c.deathSaves.fail}.`);
  if (c.hp.current === 0) {
    const pregunta = await paso(ctx, 'terminar turno a 0 PG', async pg => {
      await b.act(pg, 't-end');
      const hay = await pg.locator('#ds-ask').count();
      if (hay) await b.act(pg, 'close-modal', {}, '#modal');
      return hay;
    });
    if (pregunta)
      pensar(
        'acordarse',
        'Al terminar el turno a 0 PG la app vuelve a pedir la salvación contra muerte que ya se marcó (n.º 109): hay que pulsar «Ya la había apuntado»'
      );
    const cura = tira(2, 4).suma + 3;
    await paso(ctx, `la clériga le cura ${cura} PG`, pg => vida(pg, cura, 'heal'));
    c = await ficha(page);
    regla(
      'curación a 0 PG',
      c.hp.current === Math.min(c.hp.max, cura) &&
        !c.conditions.includes('Inconsciente') &&
        c.deathSaves.fail === 0 &&
        c.deathSaves.success === 0,
      `PG ${c.hp.current}, estados ${c.conditions}, salvaciones ${JSON.stringify(c.deathSaves)}`
    );
    narra(`La clériga le lanza Palabra de curación: ${c.hp.current} PG.`);
    if (!c.conditions.includes('Derribado'))
      pensar('acordarse', 'Al despertar sigue en el suelo: levantarse cuesta la mitad de la velocidad');
  }
  hecho('cae-0');
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
    textos[s] = (await texto(page, '#modal .sheet')).replace(/\s+/g, ' ');
    if (s === 'hp' && elige.pg) {
      await b.radio(page, 'wz-hp', 'roll');
      await b.escribir(page, '#wz-hproll', elige.pg);
    } else if (s === 'sub') await b.radio(page, 'wz-sub', elige.sub);
    else if (s === 'asi') {
      await b.radio(page, 'wz-asi', elige.asi.mode);
      await b.elegir(page, '#wz-asi-a', elige.asi.a);
      if (elige.asi.b) await b.elegir(page, '#wz-asi-b', elige.asi.b);
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
  return paso(ctx, `descanso corto${hd ? `: dado de golpe (sale ${hd})` : ''}`, async pg => {
    await b.act(pg, 'rest-menu');
    await b.act(pg, 'short');
    const txt = (await texto(pg, '#modal .sheet')).replace(/\s+/g, ' ');
    if (hd) {
      await b.escribir(pg, '#hd-roll', hd);
      await b.act(pg, 'hd');
    }
    await b.act(pg, 'short-done');
    return { txt, t: await leerToasts(pg) };
  });
}
async function descansoLargo(ctx) {
  return paso(ctx, 'descanso largo', async pg => {
    await b.act(pg, 'rest-menu');
    await b.act(pg, 'long');
    const txt = (await texto(pg, '#modal .sheet')).replace(/\s+/g, ' ');
    await b.act(pg, 'long-done');
    return { txt, t: await leerToasts(pg) };
  });
}
async function empezarCombate(ctx) {
  return paso(ctx, 'empezar combate', async pg => {
    await irA(pg, 'combat');
    await b.act(pg, 'cb-start');
    return leerToasts(pg);
  });
}
async function terminarCombate(ctx) {
  await paso(ctx, 'terminar combate', async pg => {
    await irA(pg, 'combat');
    await b.act(pg, 'cb-end');
    await b.act(pg, 'cb-end-ok');
  });
}
const finTurno = (ctx, n) =>
  paso(ctx, `terminar turno${n ? ` (ronda ${n})` : ''}`, async pg => {
    await irA(pg, 'combat');
    await b.act(pg, 't-end');
    return leerToasts(pg);
  });
/* Gasta un punto de concentración a mano, en las casillas de Partida (lo que hace el jugador cuando la app no tiene botón) */
async function gastarPuntoAMano(ctx, por) {
  const { page } = ctx;
  const c0 = await ficha(page);
  await paso(ctx, `gastar 1 punto a mano (${por})`, async pg => {
    await irA(pg, 'play');
    const i = await idxFeat(pg, 'Puntos de concentración');
    const left = await pg.evaluate(k => C().features[k].uses.max - C().features[k].uses.used, i);
    await b.act(pg, 'pip', { kind: 'feat', a: i, i: left - 1 });
  });
  const c = await ficha(page);
  regla('gastar a mano', puntos(c) === puntos(c0) - 1, `puntos ${puntos(c0)} → ${puntos(c)}`);
}

/* =====================================================================
   Escena 1 · Nivel 1: bandidos en el camino
   ===================================================================== */
async function escena1(ctx) {
  const { page } = ctx;
  ESC = 'E1 nivel 1 · bandidos en el camino';
  console.log(`\n— ${ESC}`);
  await b.limpiar(page);
  await paso(ctx, 'importar a Bruno', pg => b.importar(pg, b.leerFicha('monje.json')));
  let c = await ficha(page);

  /* Los números de la ficha (reglas de 2024) */
  let n = await num(page);
  regla('ficha', c.hp.max === 10, `PG máximos ${c.hp.max} (d8: 8 + CON 2 = 10)`);
  regla('ficha', n.ca === 15 && /SAB/.test(n.caTxt), `CA ${n.ca} (${n.caTxt}; 10 + DES 2 + SAB 3 = 15)`);
  regla('ficha', n.ini === 4, `iniciativa ${n.ini} (DES 2 + Alerta: competencia 2 = 4)`);
  regla('ficha', n.vel === 30, `velocidad ${n.vel} (a nivel 1 no hay Movimiento sin armadura)`);
  regla('ficha', n.ma === 'd6', `dado de artes marciales ${n.ma} (d6 a nivel 1)`);
  regla(
    'ficha',
    n.golpe[0] === 4 && n.golpe[1] === '1d6 + 2',
    `golpe desarmado ${n.golpe} (DES 2 + competencia 2; 1d6 + DES)`
  );
  regla(
    'ficha',
    n.daga[0] === 4 && n.daga[1] === '1d6 + 2',
    `daga ${n.daga} (arma de monje: d6 en vez de d4)`
  );
  regla(
    'ficha',
    n.lanza[0] === 4 && /^1d6 \+ 2/.test(n.lanza[1]),
    `lanza ${n.lanza} (arma de monje con DES)`
  );
  regla(
    'ficha',
    n.baston[0] === 4 && /^1d6 \+ 2/.test(n.baston[1]),
    `bastón ${n.baston} (arma de monje con DES)`
  );
  regla('ficha', n.atl === 3, `Atletismo ${n.atl} (Habilidoso del humano: FUE 1 + competencia 2 = 3)`);
  regla('ficha', n.acro === 4 && n.sig === 4, `Acrobacias ${n.acro}, Sigilo ${n.sig} (DES 2 + 2 = 4)`);
  regla('ficha', c.inspiration === true, 'el humano empieza con Inspiración heroica (Ingenioso)');
  regla(
    'ficha',
    !usos(c, 'Puntos de concentración'),
    'a nivel 1 el monje aún no tiene puntos de concentración'
  );
  regla('ficha', n.ataques === 1, `ataques por acción ${n.ataques}`);

  const ban = [
    enemigo('Bandido 1', 12, 11, 3, [1, 6, 1], 'cortante'),
    enemigo('Bandido 2', 12, 11, 3, [1, 6, 1], 'cortante'),
    enemigo('Jefe bandido', 14, 16, 4, [1, 8, 2], 'perforante'),
  ];
  let t = await empezarCombate(ctx);
  regla('empezar combate', tiene(t, /Iniciativa: 1d20 \+4/), `el aviso no dice «1d20 +4»: ${t[0]}`);
  regla('empezar combate', tiene(t, /Alerta/), 'el aviso no recuerda que Alerta deja cambiar la iniciativa');
  narra(`Iniciativa: ${dado(20) + 4}. Bruno actúa antes que los bandidos.`);

  /* Ronda 1: bastón con la acción y golpe desarmado con la acción adicional */
  let ronda = 1;
  t = await paso(ctx, 'bastón al bandido 1', pg => atacar(pg, 'Bastón'));
  regla('bastón', tiene(t, /1d20 \+4/) && tiene(t, /1d6 \+ 2 .*contundente/), `aviso: ${t[0]}`);
  if (!tiene(t, /acción adicional|golpe desarmado/i))
    pensar(
      'acordarse',
      'Artes marciales: además de la acción, puede dar un golpe desarmado con la acción adicional (el aviso del ataque no lo recuerda; hay que mirar la columna de al lado)'
    );
  golpea(ban[0], 4, 6, 2, 'Bastón');
  t = await paso(ctx, 'golpe desarmado con la acción adicional', pg =>
    derivada(pg, 'Golpe desarmado (Artes marciales)')
  );
  c = await ficha(page);
  hecho('desarmado-aa');
  regla('golpe extra', c.turn.aa, 'no gasta la acción adicional');
  cuentaGolpe('Golpe desarmado con la acción adicional', t, 4, '1d6 + 2');
  golpea(ban[0], 4, 6, 2, 'Golpe desarmado (acción adicional)');
  await finTurno(ctx, ronda++);

  /* Los bandidos le rodean hasta que cae */
  let cayo = false;
  for (let i = 0; i < 6 && !cayo; i++) {
    for (const e of ban.filter(x => x.pg > 0)) {
      const r = await recibe(ctx, e, 15);
      if (r.cae) {
        cayo = true;
        break;
      }
    }
    if (cayo) break;
    /* Su turno: golpe desarmado con la acción (Otras acciones) y otro con la adicional */
    const obj = ban.find(x => x.pg > 0);
    if (!obj) break;
    t = await paso(ctx, `golpe desarmado con la acción (ronda ${ronda})`, pg => desarmado(pg));
    hecho('desarmado');
    regla('golpe desarmado', tiene(t, /1d20 \+4/) && tiene(t, /1d6 \+ 2 contundente/), `aviso: ${t[0]}`);
    if (tiene(t, /Tras atacar puedes dar otro golpe/))
      narra('El aviso dice «Tras atacar puedes dar otro golpe desarmado como acción adicional».');
    let a = golpea(obj, 4, 6, 2, 'Golpe desarmado');
    /* Falla: gasta la Inspiración heroica para repetir la tirada */
    if (!a.impacta && (await ficha(page)).inspiration) {
      t = await paso(ctx, 'gastar Inspiración heroica', async pg => {
        await b.act(pg, 'insp');
        return leerToasts(pg);
      });
      c = await ficha(page);
      hecho('inspiracion');
      regla('Inspiración heroica', !c.inspiration, 'sigue teniendo Inspiración heroica');
      if (!tiene(t, /repit|repetir|otra vez/))
        pensar(
          'acordarse',
          'Al gastar la Inspiración heroica el aviso solo dice «Inspiración gastada»: no recuerda que repite el d20 y se queda con el nuevo resultado'
        );
      a = golpea(obj, 4, 6, 2, 'Golpe desarmado repetido (Inspiración heroica)');
    }
    if (obj.pg > 0 && (await derivadaOn(page, 'Golpe desarmado (Artes marciales)'))) {
      t = await paso(ctx, `golpe desarmado extra (ronda ${ronda})`, pg =>
        derivada(pg, 'Golpe desarmado (Artes marciales)')
      );
      cuentaGolpe('Golpe desarmado con la acción adicional', t, 4, '1d6 + 2');
      golpea(obj, 4, 6, 2, 'Golpe desarmado (acción adicional)');
    } else if (obj.pg <= 0) {
      /* El bandido cae: lanza una daga al jefe con la acción adicional… no se puede (lanzar es un ataque de la acción) */
      narra(`${obj.n} cae.`);
    }
    await finTurno(ctx, ronda++);
    /* Ronda siguiente: lanza una daga al jefe, que se queda atrás con el arco */
    if (!HECHO.has('lanzar') && !cayo) {
      const d0 = (await ficha(page)).equipment.find(e => e.name === 'Daga').qty;
      t = await paso(ctx, 'lanzar una daga al jefe', pg => atacar(pg, 'Daga', { throw: 1 }));
      c = await ficha(page);
      hecho('lanzar');
      regla('lanzar daga', c.equipment.find(e => e.name === 'Daga').qty === d0 - 1, 'no descuenta la daga');
      regla('lanzar daga', tiene(t, /1d20 \+4/) && tiene(t, /1d6 \+ 2/), `aviso: ${t[0]}`);
      golpea(ban[2], 4, 6, 2, 'Daga lanzada al jefe');
      await finTurno(ctx, ronda++);
    }
  }
  if (!cayo) {
    /* El máster decide que el jefe le embosca con un crítico (para probar caer a 0 PG) */
    c = await ficha(page);
    narra('El jefe bandido le dispara a bocajarro: crítico.');
    await paso(ctx, `recibe ${c.hp.current + 3} de daño perforante`, pg => vida(pg, c.hp.current + 3, 'dmg'));
    await caer(ctx);
  }
  narra('El resto del grupo ahuyenta a los bandidos.');
  await terminarCombate(ctx);
}

/* =====================================================================
   Escena 2 · Descansos y nivel 2
   ===================================================================== */
async function escena2(ctx) {
  const { page } = ctx;
  ESC = 'E2 descansos y nivel 2';
  console.log(`\n— ${ESC}`);
  let c = await ficha(page);
  const antes = c.hp.current,
    hd = dado(8);
  await descansoCorto(ctx, hd);
  c = await ficha(page);
  hecho('corto');
  const espera = Math.min(c.hp.max, antes + hd + 2);
  regla(
    'descanso corto',
    c.hp.current === espera && c.hitDice.spent === 1,
    `PG ${antes} → ${c.hp.current} (d8 ${hd} + CON 2 = ${espera})`
  );
  narra(`Descanso corto: gasta su dado de golpe (${hd} + 2). PG ${c.hp.current}.`);

  const insp0 = c.inspiration;
  const lr = await descansoLargo(ctx);
  c = await ficha(page);
  hecho('largo');
  regla(
    'descanso largo',
    c.hp.current === c.hp.max && c.hitDice.spent === 0,
    `PG ${c.hp.current}/${c.hp.max}, dados gastados ${c.hitDice.spent}`
  );
  regla('descanso largo', c.inspiration, 'el humano no recupera la Inspiración heroica (Ingenioso)');
  narra(
    `Descanso largo: Inspiración heroica ${insp0 ? 'la tenía' : 'la recupera'}${tiene(lr.t, /Inspiraci/) ? ' (el aviso lo dice)' : ''}.`
  );

  /* Nivel 2: puntos de concentración, Movimiento sin armadura y Metabolismo asombroso */
  const pg2 = dado(8);
  const sube = await paso(ctx, `subir a nivel 2 (PG: sale ${pg2})`, pg => subirNivel(pg, { pg: pg2 }));
  c = await ficha(page);
  hecho('nivel2');
  regla(
    'nivel 2',
    c.level === 2 && c.hp.max === 10 + pg2 + 2,
    `nivel ${c.level}, PG ${c.hp.max} (10 + ${pg2} + 2)`
  );
  regla(
    'nivel 2',
    usos(c, 'Puntos de concentración') && usos(c, 'Puntos de concentración').max === 2,
    'puntos: 2'
  );
  regla(
    'nivel 2',
    usos(c, 'Puntos de concentración') && usos(c, 'Puntos de concentración').recover === 'corto',
    `los puntos se recuperan con un descanso corto o largo: ${JSON.stringify(usos(c, 'Puntos de concentración'))}`
  );
  regla(
    'nivel 2',
    usos(c, 'Metabolismo asombroso') && usos(c, 'Metabolismo asombroso').max === 1,
    'Metabolismo asombroso: 1 uso'
  );
  const n = await num(page);
  regla('nivel 2', n.vel === 40, `velocidad ${n.vel} (30 + 10 de Movimiento sin armadura)`);
  regla('nivel 2', n.golpe[1] === '1d6 + 2', `golpe desarmado ${n.golpe}`);
  const nov = sube.textos.summary || '';
  regla(
    'nivel 2',
    /Concentraci[oó]n del monje/.test(nov) && /Metabolismo/.test(nov),
    `«Novedades» no enseña los rasgos de nivel 2: ${nov.slice(0, 200)}`
  );
  if (!/CD|8 \+/.test(JSON.stringify(c.features.filter(f => /Concentraci/.test(f.name)))))
    narra('El texto de Concentración del monje no da la CD de sus rasgos (la usará la Mano Abierta).');
}

/* =====================================================================
   Escena 3 · Nivel 2: goblins en las ruinas (dos combates seguidos)
   ===================================================================== */
async function escena3(ctx) {
  const { page } = ctx;
  ESC = 'E3 nivel 2 · goblins en las ruinas';
  console.log(`\n— ${ESC}`);
  const g = [
    enemigo('Goblin 1', 15, 10, 4, [1, 6, 2], 'cortante'),
    enemigo('Goblin 2', 15, 10, 4, [1, 6, 2], 'perforante'),
  ];
  let t = await empezarCombate(ctx);
  let c = await ficha(page);
  regla('empezar combate', tiene(t, /Metabolismo asombroso/), 'el aviso no recuerda Metabolismo asombroso');
  narra(
    'Al empezar el combate tiene todos los PG y todos los puntos: guarda Metabolismo asombroso para luego.'
  );

  /* Ronda 1: lanza y Ráfaga de golpes */
  let ronda = 1;
  t = await paso(ctx, 'lanza al goblin 1', pg => atacar(pg, 'Lanza'));
  regla('lanza', tiene(t, /1d20 \+4/) && tiene(t, /1d6 \+ 2/), `aviso: ${t[0]}`);
  golpea(g[0], 4, 6, 2, 'Lanza');
  const p0 = puntos(await ficha(page));
  t = await paso(ctx, 'Ráfaga de golpes', pg => derivada(pg, 'Ráfaga de golpes'));
  c = await ficha(page);
  hecho('rafaga');
  CUENTA.puntos++;
  regla(
    'Ráfaga de golpes',
    puntos(c) === p0 - 1 && c.turn.aa,
    `puntos ${p0} → ${puntos(c)}, adicional ${c.turn.aa}`
  );
  cuentaGolpe('Ráfaga de golpes', t, 4, '1d6 + 2');
  golpea(g[0], 4, 6, 2, 'Ráfaga, golpe 1');
  golpea(g[0].pg > 0 ? g[0] : g[1], 4, 6, 2, 'Ráfaga, golpe 2');
  regla(
    'Ráfaga de golpes',
    !(await derivadaOn(page, 'Golpe desarmado (Artes marciales)')),
    'tras la Ráfaga, el golpe desarmado extra sigue activo (los dos gastan la acción adicional)'
  );
  await finTurno(ctx, ronda++);
  for (const e of g.filter(x => x.pg > 0)) await recibe(ctx, e, 15);

  /* Ronda 2: dagas y Defensa paciente con 1 punto (Destrabarse y Esquivar) para retirarse */
  const obj = g.find(x => x.pg > 0) || g[1];
  t = await paso(ctx, `daga al ${obj.n}`, pg => atacar(pg, 'Daga'));
  regla('daga', tiene(t, /1d20 \+4/) && tiene(t, /1d6 \+ 2 perforante/), `aviso: ${t[0]}`);
  golpea(obj, 4, 6, 2, 'Daga');
  const p1 = puntos(await ficha(page));
  t = await paso(ctx, 'Defensa paciente (1 punto)', pg => derivada(pg, 'Defensa paciente (1 punto)'));
  c = await ficha(page);
  hecho('paciente-1');
  CUENTA.puntos++;
  regla('Defensa paciente', puntos(c) === p1 - 1 && c.turn.aa, `puntos ${p1} → ${puntos(c)}`);
  const esq = c.effects.find(e => /Esquiv/.test(e.name));
  if (!esq) {
    regla(
      'Defensa paciente',
      false,
      'Defensa paciente con 1 punto incluye Esquivar, pero no pone el efecto «Esquivando» (sí lo pone la acción Esquivar)'
    );
    pensar(
      'acordarse',
      'Defensa paciente (1 punto) = Esquivar: los ataques contra él tienen desventaja y tiene ventaja en las salvaciones de DES hasta su siguiente turno (la app no pone «Esquivando» ni lo explica)'
    );
  }
  await finTurno(ctx, ronda++);
  for (const e of g.filter(x => x.pg > 0)) await recibe(ctx, e, 15, -1);
  c = await ficha(page);
  if (esq)
    regla(
      'Esquivando',
      !!c.effects.find(e => /Esquiv/.test(e.name)),
      'Esquivando debería seguir durante los turnos de los enemigos (acaba al empezar su turno)'
    );

  /* Ronda 3: Defensa paciente gratis (Destrabarse) y Paso del viento gratis (Correr) en otra ronda */
  t = await paso(ctx, 'Defensa paciente gratis (Destrabarse)', pg => derivada(pg, 'Defensa paciente'));
  c = await ficha(page);
  hecho('paciente-0');
  regla(
    'Defensa paciente',
    c.turn.aa && puntos(c) === p1 - 1,
    'la versión gratis gasta un punto o no gasta la adicional'
  );
  regla('Defensa paciente', tiene(t, /Destrabarse/), `aviso: ${t[0]}`);
  t = await paso(ctx, 'golpe desarmado a un goblin', pg => desarmado(pg));
  golpea(g.find(x => x.pg > 0) || g[0], 4, 6, 2, 'Golpe desarmado');
  await finTurno(ctx, ronda++);
  for (const e of g.filter(x => x.pg > 0)) await recibe(ctx, e, 15);

  t = await paso(ctx, 'Paso del viento gratis (Correr)', pg => derivada(pg, 'Paso del viento'));
  c = await ficha(page);
  hecho('viento-0');
  regla('Paso del viento', c.turn.aa && c.turn.dash === 1, `turno ${JSON.stringify(c.turn)}`);
  const mov = await page.locator('.movebar').innerText();
  regla('Paso del viento', /de 80 pies/.test(mov), `movimiento: ${mov} (40 × 2 = 80)`);
  narra('Bruno corre 80 pies por las ruinas hasta la palanca de la puerta.');
  g.forEach(x => (x.pg = 0));
  narra('Los goblins huyen.');
  await terminarCombate(ctx);
  c = await ficha(page);
  narra(`Tras el primer combate: ${c.hp.current}/${c.hp.max} PG y ${puntos(c)} puntos.`);

  /* Segundo combate sin descansar: lobos. Metabolismo asombroso al tirar iniciativa */
  const lobo = enemigo('Lobo', 13, 11, 4, [2, 4, 2], 'perforante');
  if (c.hp.current === c.hp.max) {
    await paso(ctx, 'una trampa de dardos le hace 5', pg => vida(pg, 5, 'dmg'));
    c = await ficha(page);
  }
  t = await empezarCombate(ctx);
  regla(
    'Metabolismo asombroso',
    tiene(t, /Metabolismo asombroso \(quedan 1\/1\)/),
    `el aviso de iniciativa no recuerda Metabolismo con sus usos: ${t[0]}`
  );
  if (!tiene(t, /data-act|Usar/))
    pensar(
      'acordarse',
      'Metabolismo asombroso: el aviso de iniciativa lo recuerda, pero no tiene botón; hay que buscarlo en la columna «Sin gastar acción»'
    );
  const pg0 = c.hp.current,
    pts0 = puntos(c),
    md = dado(6);
  const tm = await paso(ctx, `Metabolismo asombroso (sale ${md})`, async pg => {
    await irA(pg, 'combat');
    await b.act(pg, 't-feat', { i: await idxFeat(pg, 'Metabolismo asombroso') });
    const txt = (await texto(pg, '#modal .sheet')).replace(/\s+/g, ' ');
    await b.escribir(pg, '#hr-r', md);
    await b.act(pg, 'hr-ok');
    return txt;
  });
  c = await ficha(page);
  hecho('metabolismo');
  regla('Metabolismo asombroso', /1d6/.test(tm) && /nivel de monje \(2\)/.test(tm), `ventana: ${tm}`);
  regla(
    'Metabolismo asombroso',
    c.hp.current === Math.min(c.hp.max, pg0 + md + 2) && puntos(c) === 2,
    `PG ${pg0} → ${c.hp.current} (+${md} + 2), puntos ${pts0} → ${puntos(c)}`
  );
  regla('Metabolismo asombroso', usos(c, 'Metabolismo asombroso').used === 1, 'no gasta el uso');
  regla('Metabolismo asombroso', !c.turn.a && !c.turn.aa, 'gasta la acción o la adicional');
  narra(`Metabolismo asombroso: recupera los puntos (${pts0} → 2) y cura ${md} + 2. PG ${c.hp.current}.`);

  /* Paso del viento con 1 punto: Destrabarse y Correr, salto doble */
  ronda = 1;
  t = await paso(ctx, 'golpe desarmado al lobo', pg => desarmado(pg));
  golpea(lobo, 4, 6, 2, 'Golpe desarmado');
  t = await paso(ctx, 'Paso del viento (1 punto)', pg => derivada(pg, 'Paso del viento (1 punto)'));
  c = await ficha(page);
  hecho('viento-1');
  CUENTA.puntos++;
  regla(
    'Paso del viento',
    puntos(c) === 1 && c.turn.dash === 1,
    `puntos ${puntos(c)}, turno ${JSON.stringify(c.turn)}`
  );
  if (!tiene(t, /\d+ pies/))
    pensar(
      'calcular',
      'Paso del viento con 1 punto: «salto doble», pero no dice cuánto puede saltar (salto de longitud = puntuación de FUE en pies con carrerilla, ×2: 24 pies)'
    );
  narra('Bruno se destraba y salta el foso para cortar el paso al lobo.');
  await finTurno(ctx, ronda++);
  await recibe(ctx, lobo, 15);
  t = await paso(ctx, 'golpe desarmado al lobo', pg => desarmado(pg));
  golpea(lobo, 4, 6, 2, 'Golpe desarmado');
  narra('El lobo huye.');
  await terminarCombate(ctx);
}

/* =====================================================================
   Escena 4 · Nivel 3 (Mano Abierta): arqueros en el puente
   ===================================================================== */
async function escena4(ctx) {
  const { page } = ctx;
  ESC = 'E4 nivel 3 · arqueros en el puente';
  console.log(`\n— ${ESC}`);
  let c = await ficha(page);
  const p0 = puntos(c);
  const hd = c.hp.current < c.hp.max ? dado(8) : 0;
  const dc = await descansoCorto(ctx, hd);
  c = await ficha(page);
  hecho('corto');
  regla(
    'descanso corto',
    puntos(c) === 2,
    `puntos ${p0} → ${puntos(c)} (se recuperan todos en un descanso corto)`
  );
  if (!/punto/i.test(dc.txt + dc.t.join(' ')))
    narra(
      'La ventana del descanso corto no dice que recupera los puntos de concentración (los recupera igualmente).'
    );
  regla(
    'descanso corto',
    usos(c, 'Metabolismo asombroso').used === 1,
    'Metabolismo asombroso no vuelve con el descanso corto'
  );

  const pg3 = dado(8);
  const sube = await paso(ctx, `subir a nivel 3 (Mano Abierta, PG: sale ${pg3})`, pg =>
    subirNivel(pg, { sub: 'openhand', pg: pg3 })
  );
  const max2 = c.hp.max;
  c = await ficha(page);
  hecho('nivel3');
  regla(
    'nivel 3',
    c.level === 3 && c.subclassKey === 'openhand',
    `nivel ${c.level}, subclase ${c.subclassKey}`
  );
  regla('nivel 3', c.hp.max === max2 + pg3 + 2, `PG ${max2} → ${c.hp.max} (+${pg3} + 2)`);
  regla('nivel 3', usos(c, 'Puntos de concentración').max === 3, 'puntos: 3');
  regla(
    'nivel 3',
    c.features.some(f => f.name === 'Desviar ataques'),
    'falta Desviar ataques'
  );
  regla(
    'nivel 3',
    c.features.some(f => f.name === 'Técnica de la mano abierta'),
    'falta Técnica de la mano abierta'
  );
  regla('nivel 3', sube.vistos.includes('sub'), `pasos: ${sube.vistos.join(', ')}`);
  const tec = c.features.find(f => f.name === 'Técnica de la mano abierta');
  if (tec && /reacciones/.test(tec.text))
    regla(
      'Técnica de la mano abierta',
      false,
      'el texto dice «impedir reacciones» (regla de 2014); en 2024 el objetivo no puede hacer ataques de oportunidad (de memoria, por confirmar)'
    );

  const arq = [
    enemigo('Arquero 1', 12, 11, 3, [1, 8, 1], 'perforante'),
    enemigo('Arquero 2', 12, 11, 3, [1, 8, 1], 'perforante'),
  ];
  let t = await empezarCombate(ctx);
  let ronda = 1;
  /* Los arqueros disparan primero: Desviar ataques */
  const r = ataqueEnemigo(arq[0], 15);
  const dmg = r.dmg || 7;
  if (!r.dmg) narra('(El máster repite: el segundo arquero sí impacta, 7 perforante.)');
  const dv = await desviar(ctx, arq[0], dmg);
  /* Si lo deja en 0, puede gastar 1 punto para devolver el golpe */
  if (!dv.quedan) {
    if (!tiene(dv.t, /CD/) || !tiene(dv.t, /2d6|1d6 \+ 1d6/)) {
      pensar(
        'calcular',
        'Desviar ataques: para devolver el golpe la app solo dice «puedes gastar 1 punto»; el jugador tiene que saber que el objetivo (a 60 pies si era a distancia) hace salvación de DES CD 13 (8 + SAB + competencia) y recibe 2 dados de artes marciales + DES (2d6 + 2) del mismo tipo'
      );
    }
    if (
      !(await page
        .locator('#toasts [data-act]')
        .filter({ hasText: /punto|devolver/i })
        .count())
    )
      pensar(
        'acordarse',
        'Desviar ataques: no hay botón para devolver el golpe; el punto se gasta a mano en Partida'
      );
    await gastarPuntoAMano(ctx, 'devolver el golpe con Desviar ataques');
    hecho('devolver');
    const sv = dado(20) + 2;
    if (sv < 13) {
      const d = tira(2, 6).suma + 2;
      arq[0].pg -= d;
      narra(
        `Devuelve la flecha: salvación de DES ${sv} contra CD 13, falla: ${d} perforante. ${arq[0].n}: ${arq[0].pg} PG.`
      );
    } else narra(`Devuelve la flecha: salvación de DES ${sv} contra CD 13, la supera.`);
  } else narra('No la deja en 0: no puede devolver el golpe.');
  c = await ficha(page);
  /* El segundo arquero dispara: la reacción ya está gastada */
  const vtxt = await (async () => {
    await b.act(page, 'vida');
    const out = await texto(page, '#modal .sheet');
    const on = await page.locator('#modal [data-act="hp-red"][data-k="deflect"]').isEnabled();
    await b.cerrarModal(page);
    return { out, on };
  })();
  regla('Desviar ataques', !vtxt.on, 'con la reacción gastada, el botón de Desviar ataques sigue activo');
  await recibe(ctx, arq[1], 15);

  /* Su turno: corre hasta los arqueros (Paso del viento gratis no: usa la Ráfaga) */
  t = await paso(ctx, 'golpe desarmado al arquero 1', pg => desarmado(pg));
  cuentaGolpe('Golpe desarmado (acción)', t, 4, '1d6 + 2');
  golpea(arq[0], 4, 6, 2, 'Golpe desarmado');
  const p1 = puntos(await ficha(page));
  t = await paso(ctx, 'Ráfaga de golpes (Mano Abierta)', pg => derivada(pg, 'Ráfaga de golpes'));
  c = await ficha(page);
  CUENTA.puntos++;
  regla('Ráfaga de golpes', puntos(c) === p1 - 1, `puntos ${p1} → ${puntos(c)}`);
  cuentaGolpe('Ráfaga de golpes', t, 4, '1d6 + 2');
  const a1 = golpea(arq[0].pg > 0 ? arq[0] : arq[1], 4, 6, 2, 'Ráfaga, golpe 1');
  if (a1.impacta) {
    hecho('mano-abierta');
    if (!tiene(t, /mano abierta|Derribar|derrib/i))
      pensar(
        'acordarse',
        'Técnica de la mano abierta: cada impacto de la Ráfaga puede derribar, empujar 15 pies o impedir ataques de oportunidad (el aviso de la Ráfaga no lo recuerda)'
      );
    if (!tiene(t, /CD 13/))
      pensar(
        'calcular',
        'Técnica de la mano abierta: la CD de la salvación para derribar o empujar es 8 + SAB + competencia = 13 (la app no la dice en ningún sitio)'
      );
    const sv = dado(20) + 2;
    narra(
      `Mano abierta: derribar. El arquero tira DES ${sv} contra CD 13: ${sv < 13 ? 'cae derribado' : 'aguanta'}.`
    );
  }
  golpea(arq[0].pg > 0 ? arq[0] : arq[1], 4, 6, 2, 'Ráfaga, golpe 2');
  await finTurno(ctx, ronda++);
  /* El otro arquero le dispara: otra vez Desviar ataques */
  const r2 = ataqueEnemigo(arq[1], 15);
  if (r2.dmg) await desviar(ctx, arq[1], r2.dmg);
  t = await paso(ctx, 'golpe desarmado al arquero 2', pg => desarmado(pg));
  golpea(arq[1], 4, 6, 2, 'Golpe desarmado');
  narra('Los arqueros se rinden en el puente.');
  await terminarCombate(ctx);
}

/* =====================================================================
   Escena 5 · Niveles 4 y 5: la cornisa y el ogro
   ===================================================================== */
async function escena5(ctx) {
  const { page } = ctx;
  ESC = 'E5 niveles 4 y 5 · el ogro';
  console.log(`\n— ${ESC}`);
  await descansoLargo(ctx);
  let c = await ficha(page);
  regla('descanso largo', usos(c, 'Metabolismo asombroso').used === 0, 'no recupera Metabolismo asombroso');
  regla('descanso largo', puntos(c) === usos(c, 'Puntos de concentración').max, 'no recupera los puntos');

  /* Nivel 4: +1 DES y +1 SAB */
  const pg4 = dado(8),
    max3 = c.hp.max;
  const s4 = await paso(ctx, `subir a nivel 4 (+1 DES, +1 SAB; PG: sale ${pg4})`, pg =>
    subirNivel(pg, { pg: pg4, asi: { mode: '11', a: 'dex', b: 'wis' } })
  );
  c = await ficha(page);
  hecho('nivel4');
  let n = await num(page);
  regla(
    'nivel 4',
    c.level === 4 && c.hp.max === max3 + pg4 + 2,
    `nivel ${c.level}, PG ${max3} → ${c.hp.max}`
  );
  regla('nivel 4', s4.vistos.includes('asi'), `pasos: ${s4.vistos.join(', ')}`);
  regla(
    'nivel 4',
    c.abilities.dex === 16 && c.abilities.wis === 17,
    `DES ${c.abilities.dex}, SAB ${c.abilities.wis}`
  );
  regla('nivel 4', n.ca === 16, `CA ${n.ca} (10 + DES 3 + SAB 3)`);
  regla('nivel 4', n.ini === 5, `iniciativa ${n.ini} (DES 3 + Alerta 2)`);
  regla('nivel 4', n.golpe[0] === 5 && n.golpe[1] === '1d6 + 3', `golpe desarmado ${n.golpe}`);
  regla(
    'nivel 4',
    n.daga[0] === 5 && n.daga[1] === '1d6 + 3',
    `daga ${n.daga} (la DES nueva en el arma guardada)`
  );
  regla('nivel 4', n.lanza[0] === 5 && /^1d6 \+ 3/.test(n.lanza[1]), `lanza ${n.lanza}`);
  regla('nivel 4', n.acro === 5, `Acrobacias ${n.acro}`);
  regla('nivel 4', usos(c, 'Puntos de concentración').max === 4, 'puntos: 4');
  regla(
    'nivel 4',
    c.features.some(f => f.name === 'Caída lenta'),
    'falta Caída lenta'
  );

  /* Caída lenta: resbala por la cornisa (20 pies: 2d6) */
  const caida = tira(2, 6).suma;
  await b.act(page, 'vida');
  const hayCaida = await page.locator('#modal [data-act="hp-red"]').filter({ hasText: /Caída/ }).count();
  await b.cerrarModal(page);
  hecho('caida');
  if (!hayCaida) {
    pensar(
      'calcular',
      `Caída lenta: al caer 20 pies (2d6 = ${caida}) usa la reacción y reduce el daño en 5 × nivel de monje = 20; la ventana de daño no tiene botón y hay que restarlo de cabeza`
    );
    const queda = Math.max(0, caida - 20);
    if (queda)
      await paso(ctx, `cae por la cornisa (${queda} de daño tras Caída lenta)`, pg => vida(pg, queda, 'dmg'));
    narra(`Cae por la cornisa: ${caida} de daño, Caída lenta lo reduce en 20: recibe ${queda}.`);
  }

  /* Nivel 5: Ataque adicional, Golpe aturdidor, dado d8 */
  const pg5 = dado(8),
    max4 = (await ficha(page)).hp.max;
  await paso(ctx, `subir a nivel 5 (PG: sale ${pg5})`, pg => subirNivel(pg, { pg: pg5 }));
  c = await ficha(page);
  hecho('nivel5');
  n = await num(page);
  regla('nivel 5', c.level === 5 && c.hp.max === max4 + pg5 + 2, `nivel ${c.level}, PG ${c.hp.max}`);
  regla('nivel 5', n.pb === 3, `competencia +${n.pb}`);
  regla('nivel 5', n.ma === 'd8', `dado de artes marciales ${n.ma}`);
  regla('nivel 5', n.ataques === 2, `ataques por acción ${n.ataques}`);
  regla('nivel 5', n.golpe[0] === 6 && n.golpe[1] === '1d8 + 3', `golpe desarmado ${n.golpe} (+6, 1d8 + 3)`);
  regla('nivel 5', n.daga[0] === 6 && n.daga[1] === '1d8 + 3', `daga ${n.daga} (+6, 1d8 + 3)`);
  regla('nivel 5', n.lanza[0] === 6 && /^1d8 \+ 3/.test(n.lanza[1]), `lanza ${n.lanza} (+6, 1d8 + 3)`);
  regla('nivel 5', n.baston[0] === 6 && /^1d8 \+ 3/.test(n.baston[1]), `bastón ${n.baston} (+6, 1d8 + 3)`);
  regla('nivel 5', n.ini === 6, `iniciativa ${n.ini} (DES 3 + Alerta 3)`);
  regla('nivel 5', n.vel === 40, `velocidad ${n.vel} (+10 hasta nivel 5)`);
  regla('nivel 5', usos(c, 'Puntos de concentración').max === 5, 'puntos: 5');
  regla(
    'nivel 5',
    c.features.some(f => f.name === 'Golpe aturdidor'),
    'falta Golpe aturdidor'
  );

  const ogro = enemigo('Ogro', 11, 68, 6, [2, 8, 4], 'contundente');
  let t = await empezarCombate(ctx);
  regla('empezar combate', tiene(t, /Iniciativa: 1d20 \+6/), `iniciativa: ${t[0]}`);
  c = await ficha(page);
  narra(
    `Iniciativa ${dado(20) + 6}. Metabolismo asombroso ${usos(c, 'Metabolismo asombroso').used ? 'gastado' : 'disponible'}: está entero, no lo usa.`
  );

  /* Ronda 1: dos ataques (golpe desarmado y daga), Golpe aturdidor al impactar */
  let ronda = 1;
  t = await paso(ctx, 'golpe desarmado al ogro (ataque 1)', pg => desarmado(pg));
  cuentaGolpe('Golpe desarmado (acción)', t, 6, '1d8 + 3');
  regla('Ataque adicional', tiene(t, /te queda/), `el aviso no dice que queda otro ataque: ${t[0]}`);
  if (tiene(t, /quedan 1 ataques/)) narra('El aviso dice «te quedan 1 ataques» (n.º 120).');
  let a = golpea(ogro, 6, 8, 3, 'Golpe desarmado');
  let aturdido = false;
  /* Golpe aturdidor: el jugador lo usa al primer impacto */
  const stun = async donde => {
    const p = puntos(await ficha(page));
    const ts = await paso(ctx, `Golpe aturdidor (${donde})`, pg => derivada(pg, 'Golpe aturdidor'));
    const cc = await ficha(page);
    hecho('aturdidor');
    CUENTA.puntos++;
    regla('Golpe aturdidor', puntos(cc) === p - 1, `puntos ${p} → ${puntos(cc)}`);
    regla('Golpe aturdidor', tiene(ts, /salvación de CON CD 14/), `aviso: ${ts[0]} (CD 8 + 3 + SAB 3 = 14)`);
    const sv = dado(20) + 3;
    aturdido = sv < 14;
    narra(
      `Golpe aturdidor: el ogro tira CON ${sv} contra CD 14: ${aturdido ? 'queda aturdido' : 'la supera (velocidad a la mitad)'}.`
    );
    return ts;
  };
  if (a.impacta) await stun('ataque 1');
  t = await paso(ctx, 'daga al ogro (ataque 2)', pg => atacar(pg, 'Daga'));
  regla('daga', tiene(t, /1d20 \+6/) && tiene(t, /1d8 \+ 3/), `aviso: ${t[0]}`);
  c = await ficha(page);
  regla('Ataque adicional', c.turn.atk === 0, `tras dos ataques quedan ${c.turn.atk}`);
  a = golpea(ogro, 6, 8, 3, 'Daga', aturdido ? 1 : 0);
  if (aturdido)
    pensar(
      'acordarse',
      'El ogro aturdido: los ataques contra él tienen ventaja (la app no lo sabe: el estado es del enemigo)'
    );
  if (a.impacta && HECHO.has('aturdidor')) {
    /* Ya lo usó este turno: ¿la app deja volver a usarlo? */
    const otra = await derivadaOn(page, 'Golpe aturdidor');
    regla(
      'Golpe aturdidor',
      !otra,
      'Golpe aturdidor es «una vez por turno», pero el botón sigue activo tras usarlo en este turno'
    );
    if (otra)
      pensar(
        'acordarse',
        'Golpe aturdidor: solo una vez por turno (la app deja pulsarlo otra vez y gastar otro punto)'
      );
  } else if (a.impacta) await stun('ataque 2');
  /* Ráfaga de golpes con la adicional */
  t = await paso(ctx, 'Ráfaga de golpes al ogro', pg => derivada(pg, 'Ráfaga de golpes'));
  CUENTA.puntos++;
  cuentaGolpe('Ráfaga de golpes', t, 6, '1d8 + 3');
  golpea(ogro, 6, 8, 3, 'Ráfaga, golpe 1', aturdido ? 1 : 0);
  golpea(ogro, 6, 8, 3, 'Ráfaga, golpe 2', aturdido ? 1 : 0);
  await finTurno(ctx, ronda++);

  /* El ogro: si no está aturdido, golpea. Desviar ataques */
  if (!aturdido) {
    const r = ataqueEnemigo(ogro, 16);
    if (r.dmg) await desviar(ctx, ogro, r.dmg);
  } else narra('El ogro está aturdido y pierde su turno.');

  /* Ronda 2: Empujar al ogro (Grande) por el barranco… no: es un tamaño mayor, sí se puede */
  c = await ficha(page);
  t = await paso(ctx, 'Empujar al ogro', async pg => {
    await irA(pg, 'combat');
    await b.act(pg, 't-shove', { k: 'shove' });
    return leerToasts(pg);
  });
  hecho('empujar');
  regla(
    'Empujar',
    tiene(t, /CD 14/),
    `CD de Empujar: ${t[0]} (el monje usa DES en los golpes desarmados, y Empujar es uno: 8 + DES 3 + 3 = 14; la app usa FUE: 12; de memoria, por confirmar)`
  );
  const sv = dado(20) + 4;
  narra(`Empujar: el ogro tira FUE ${sv} contra CD ${tiene(t, /CD 14/) ? 14 : 12}.`);
  t = await paso(ctx, 'golpe desarmado al ogro (ataque 2)', pg => desarmado(pg));
  golpea(ogro, 6, 8, 3, 'Golpe desarmado');
  if (await derivadaOn(page, 'Golpe desarmado (Artes marciales)')) {
    t = await paso(ctx, 'golpe desarmado extra', pg => derivada(pg, 'Golpe desarmado (Artes marciales)'));
    cuentaGolpe('Golpe desarmado con la acción adicional', t, 6, '1d8 + 3');
    golpea(ogro, 6, 8, 3, 'Golpe desarmado (acción adicional)');
  }
  await finTurno(ctx, ronda++);
  await recibe(ctx, ogro, 16);
  narra('El grupo acaba con el ogro.');
  await terminarCombate(ctx);
}

/* =====================================================================
   Escena 6 · Fuera de combate: escudo, armadura y descanso
   ===================================================================== */
async function escena6(ctx) {
  const { page } = ctx;
  ESC = 'E6 fuera de combate · escudo y armadura';
  console.log(`\n— ${ESC}`);
  /* Encuentra un escudo y una armadura de cuero en la guarida del ogro y se los prueba */
  await paso(ctx, 'añadir un escudo (embrazado)', async pg => {
    await irA(pg, 'play');
    await b.act(pg, 'item-new', { from: 'armadura' });
    await b.elegir(pg, '#ni-arm', 'shield');
    await b.act(pg, 'item-add');
    await b.cerrarModal(pg);
  });
  let c = await ficha(page);
  hecho('armadura');
  let n = await num(page);
  const esc = c.equipment.find(e => e.armor === 'shield');
  regla('escudo', esc && esc.equipped, `escudo: ${JSON.stringify(esc)}`);
  const avisos = (await page.evaluate(() => acCalc(C()).warn)) || [];
  regla(
    'escudo',
    n.ca === 13 && avisos.some(w => /competente con escudos/.test(w)),
    `CA con escudo ${n.ca} (${n.caTxt}; el monje no es competente con escudos: no suma el +2 y pierde Defensa sin armadura: 10 + DES 3 = 13). Avisos: ${avisos.join(' ')}`
  );
  regla('escudo', n.vel === 30, `velocidad con escudo ${n.vel} (sin Movimiento sin armadura: 30)`);
  regla(
    'escudo',
    n.golpe[1] === '2',
    `golpe desarmado con escudo ${n.golpe} (sin Artes marciales: 1 + FUE 1 = 2)`
  );
  regla('escudo', n.daga[1] === '1d4 + 3', `daga con escudo ${n.daga} (sin Artes marciales: 1d4 + DES)`);
  regla(
    'escudo',
    n.lanza[0] === 4 && /^1d6 \+ 1/.test(n.lanza[1]),
    `lanza con escudo ${n.lanza} (FUE: +4, 1d6 + 1)`
  );
  const aaOn = await derivadaOn(page, 'Golpe desarmado (Artes marciales)');
  regla(
    'escudo',
    !aaOn,
    'con escudo sigue saliendo el golpe desarmado extra de Artes marciales en la acción adicional (Artes marciales pide no llevar armadura ni escudo)'
  );
  narra(
    `Con el escudo: CA ${n.ca} (${n.caTxt}), velocidad ${n.vel}. Avisos: ${avisos.join(' ') || 'ninguno'}.`
  );
  if (!avisos.some(w => /Defensa sin armadura|Artes marciales/.test(w)))
    pensar(
      'acordarse',
      'Con escudo, el aviso de la CA dice que no es competente, pero no que además pierde Defensa sin armadura, Artes marciales y Movimiento sin armadura (se ve solo en los números)'
    );

  /* Se quita el escudo y se pone la armadura de cuero */
  await paso(ctx, 'quitarse el escudo y ponerse cuero', async pg => {
    await irA(pg, 'play');
    await b.act(pg, 'eq', { i: await pg.evaluate(() => C().equipment.findIndex(e => e.armor === 'shield')) });
    await b.act(pg, 'item-new', { from: 'armadura' });
    await b.elegir(pg, '#ni-arm', 'leather');
    await b.act(pg, 'item-add');
    await b.cerrarModal(pg);
  });
  n = await num(page);
  regla('armadura', n.ca === 14, `CA con cuero ${n.ca} (11 + DES 3 = 14)`);
  regla('armadura', n.vel === 30, `velocidad con cuero ${n.vel}`);
  regla('armadura', n.golpe[1] === '2', `golpe desarmado con armadura ${n.golpe}`);
  await paso(ctx, 'quitarse la armadura', async pg => {
    await irA(pg, 'play');
    await b.act(pg, 'eq', {
      i: await pg.evaluate(() => C().equipment.findIndex(e => e.armor === 'leather')),
    });
  });
  n = await num(page);
  regla('sin armadura', n.ca === 16 && n.vel === 40, `CA ${n.ca}, velocidad ${n.vel} (16 y 40 otra vez)`);
  regla(
    'sin armadura',
    n.golpe[1] === '1d8 + 3' && n.daga[1] === '1d8 + 3',
    `golpe ${n.golpe}, daga ${n.daga}`
  );

  /* Un descanso largo al final: todo vuelve, y la Inspiración heroica si la gastó */
  c = await ficha(page);
  if (c.inspiration) {
    await paso(ctx, 'gasta la Inspiración heroica en una prueba de Atletismo', async pg => {
      await b.act(pg, 'insp');
    });
    hecho('inspiracion');
  }
  await descansoLargo(ctx);
  c = await ficha(page);
  regla('descanso largo', c.inspiration, 'no recupera la Inspiración heroica (Ingenioso)');
  regla(
    'descanso largo',
    puntos(c) === 5 && usos(c, 'Metabolismo asombroso').used === 0,
    'no recupera puntos o Metabolismo'
  );
  regla(
    'descanso largo',
    !c.turn.r && !c.turn.a && !c.turn.aa,
    `el turno no queda limpio: ${JSON.stringify(c.turn)}`
  );
}

(async () => {
  const ctx = await b.abrir();
  console.log(`Partida simulada del monje (semilla ${SEMILLA})`);
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
  if (CUENTA.golpeApp)
    b.sola(
      `Golpe desarmado: el aviso trae ataque y daño ${CUENTA.golpeApp} de ${CUENTA.golpeApp + CUENTA.golpeFuera} veces`
    );
  if (CUENTA.golpeFuera)
    b.noSola(
      `Golpe desarmado (adicional o Ráfaga): ataque y daño buscados fuera del aviso ${CUENTA.golpeFuera} veces`
    );
  b.sola(
    `Puntos de concentración: ${CUENTA.puntos} gastados solos (Ráfaga, Defensa paciente, Paso del viento, Golpe aturdidor)`
  );
  b.sola(
    'Defensa sin armadura (CA 10 + DES + SAB) y Movimiento sin armadura, que se quitan con escudo o armadura'
  );
  b.sola('Armas de monje con DES y dado de artes marciales; dado d8 y Ataque adicional a nivel 5');
  b.sola('Metabolismo asombroso: recupera los puntos y pide el dado; Desviar ataques en la ventana de daño');
  b.sola('Inspiración heroica del humano tras el descanso largo; Alerta en la iniciativa');
  const grupos = {};
  PIENSA.forEach(p => (grupos[p.que] = grupos[p.que] || { ...p, n: 0 }).n++);
  for (const p of Object.values(grupos)) b.noSola(`(${p.tipo}${p.n > 1 ? ` ×${p.n}` : ''}) ${p.que}`);
  console.log(`\nDiario de la partida:\n${DIARIO.map(x => '  ' + x).join('\n')}`);
  console.log(
    `\nVeces que el jugador piensa fuera de la app: ${PIENSA.length} (${Object.keys(grupos).length} distintas)`
  );
  console.log(`Golpe desarmado: la app ${CUENTA.golpeApp}, fuera ${CUENTA.golpeFuera}`);
  console.log(`Reglas comprobadas: ${REGLAS.ok + REGLAS.mal} (${REGLAS.mal} mal)`);
  const faltan = Object.keys(MOMENTOS).filter(k => !HECHO.has(k));
  console.log(
    faltan.length
      ? `Momentos que no han salido con esta semilla: ${faltan.map(k => MOMENTOS[k]).join('; ')}`
      : 'Han salido todos los momentos de la partida.'
  );
  process.exitCode = b.informe('Partida simulada: monje humano, niveles 1 a 5');
})();
