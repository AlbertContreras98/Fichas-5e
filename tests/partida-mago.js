/* Prueba de la fase 3: partida simulada con Elarion (mago alto elfo) de nivel 1 a 5, como un jugador novato con dados físicos. */
'use strict';

/* Uso: node tests/partida-mago.js [--semilla=N] [--rastro]
   Escenas: la biblioteca (nivel 1: libro, rituales, Armadura de mago), goblins en el camino (nivel 1: Dormir, concentración
   que se pierde, cae a 0 PG), descansos, un conjuro copiado y nivel 2 (Recuperación arcana, preparar del libro, Erudito),
   la cripta (nivel 2: Escudo como reacción, Risa horrible), niveles 3 y 4 con el Evocador y los orcos (espacios de nivel 2,
   Proyectil mágico y Manos ardientes con espacio mayor, Inmovilizar persona), y nivel 5 y el ogro (Bola de fuego, trucos de
   nivel 5, Paso brumoso del alto elfo, Recuperación arcana de un espacio de nivel 3).
   Los momentos clave (que un goblin le dé, que falle la concentración, que caiga a 0 PG) los fija el guion, como si el máster
   lo decidiera, para que salgan con cualquier semilla; el resto de los dados los «tira» el guion con la semilla y escribe los
   resultados donde la app los pide.
   Cada vez que el jugador tiene que acordarse de algo, calcular algo o buscar una regla fuera de la app, se apunta («Pensar»). */

const b = require('./base');

const ARG = process.argv.slice(2);
const SEMILLA = +(ARG.find(a => a.startsWith('--semilla=')) || '--semilla=7').slice(10) || 7;
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
/* Lo que pide PLAN.md: cuántas veces la app dice el daño de los conjuros (trucos y con espacio mayor) y cuántas hay que buscarlo */
const CUENTA = { dañoApp: 0, dañoFuera: 0 };
const MOMENTOS = {
  libro: 'apuntar conjuros en el libro',
  'ritual-libro': 'ritual del libro sin preparar (Encontrar familiar, Identificar)',
  familiar: 'crear el familiar',
  'ritual-prep': 'ritual preparado (Detectar magia)',
  armadura: 'Armadura de mago',
  dormir: 'Dormir y su salvación repetida',
  'conc-pierde': 'concentración que se pierde al recibir daño',
  'conc-mantiene': 'concentración que se mantiene al recibir daño',
  'cae-0': 'cae a 0 PG, salvación contra muerte y le curan',
  arcana: 'Recuperación arcana tras un descanso corto',
  copiar: 'copiar un conjuro encontrado al libro',
  preparar: 'cambiar los preparados tras un descanso largo (solo del libro)',
  nivel2: 'nivel 2 (Erudito)',
  escudo: 'Escudo como reacción (CA +5 hasta tu turno)',
  risa: 'Risa horrible',
  nivel3: 'nivel 3 (Evocador, espacios de nivel 2)',
  nivel4: 'nivel 4 (mejora de INT, truco nuevo)',
  proyectil2: 'Proyectil mágico con espacio de nivel 2',
  manos2: 'Manos ardientes con espacio de nivel 2',
  inmovilizar: 'Inmovilizar persona',
  nivel5: 'nivel 5 (espacios de nivel 3, trucos a 2 dados)',
  bola: 'Bola de fuego',
  'paso-brumoso': 'Paso brumoso gratis del alto elfo',
  'arcana-3': 'Recuperación arcana de un espacio de nivel 3',
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
const texto = async (page, sel) => (await page.locator(sel).first().innerText()).replace(/\s+/g, ' ');
const tiene = (toasts, re) => toasts.some(t => re.test(t));
const todo = t => t.join(' | ');

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
const idxSp = (page, n) => page.evaluate(x => C().spells.findIndex(s => s.name === x), n);
const idxFeat = (page, n) => page.evaluate(x => C().features.findIndex(f => f.name === x), n);
const usos = (c, n) => {
  const f = c.features.find(x => x.name === n);
  return f ? f.uses : null;
};
const efecto = (c, n) => c.effects.find(e => e.name === n);
const libres = (c, L) => c.slots[L - 1].total - c.slots[L - 1].used;
const preparados = c => c.spells.filter(s => !s.src && +s.level > 0);
const trucos = c => c.spells.filter(s => !s.src && +s.level === 0);
const num = page =>
  page.evaluate(() => {
    const c = C();
    return {
      ca: acOf(c),
      caTxt: acCalc(c).src,
      ini: init(c),
      atk: spAtk(c),
      cd: spDC(c),
      pb: pb(c),
      arc: skillB(c, SK.arcana),
      hist: skillB(c, SK.history),
      libro: (bookOf(c) || []).length,
      need: bookNeed(c),
      libroIds: (bookOf(c) || []).map(x => x.ref),
    };
  });

/* Lanza un conjuro desde Combate. como = {kind:'free'|'slot'|'ritual', level}. Devuelve los avisos */
let VENTANA = '';
async function lanzar(page, nombre, como) {
  await irA(page, 'combat');
  const btn = fila(page, nombre).locator('[data-act="t-cast"]').first();
  if (!(await btn.count())) throw new Error(`«${nombre}» no sale en Combate (¿no está preparado?)`);
  if (!(await btn.isVisible())) {
    const det = page.locator('details.tmag').filter({ has: page.locator('.tname', { hasText: nombre }) });
    await det.locator('summary').first().click();
  }
  if (await btn.isDisabled()) throw new Error(`«${nombre}» está apagado en Combate`);
  await btn.click();
  await b.actSi(page, 'cast-conc-ok', {}, '#modal'); // aviso de concentración (n.º 112)
  await elegirEspacio(page, como);
  const t = await leerToasts(page);
  if (RASTRO) console.log(`    aviso: ${todo(t)}`);
  return t;
}
/* Lanza un conjuro desde la pestaña Partida (fuera de combate) */
async function lanzarFuera(page, nombre, como) {
  await irA(page, 'play');
  await b.act(page, 'cast', { i: await idxSp(page, nombre) });
  await elegirEspacio(page, como);
  const t = await leerToasts(page);
  if (RASTRO) console.log(`    aviso: ${todo(t)}`);
  return t;
}
async function elegirEspacio(page, como) {
  VENTANA = '';
  const hay = await page.locator('#modal [data-act="cast-with"]').filter({ visible: true }).count();
  if (!hay) return;
  VENTANA = await texto(page, '#modal .sheet');
  const k = (como && como.kind) || 'slot';
  const d = k === 'slot' ? { kind: 'slot', level: (como && como.level) || 1 } : { kind: k };
  await b.act(page, 'cast-with', d, '#modal');
}
/* Armadura de mago sobre sí mismo (la app pregunta sobre quién) */
async function armaduraDeMago(page, enCombate) {
  if (enCombate) {
    await irA(page, 'combat');
    await fila(page, 'Armadura de mago').locator('[data-act="t-cast"]').first().click();
  } else {
    await irA(page, 'play');
    await b.act(page, 'cast', { i: await idxSp(page, 'Armadura de mago') });
  }
  await b.act(page, 'cast-armor-ok', { who: 'me' }, '#modal');
  await elegirEspacio(page, { kind: 'slot', level: 1 });
  return leerToasts(page);
}
async function vida(page, n, m) {
  await b.act(page, 'vida');
  await b.escribir(page, '#hpAmt', n);
  await b.act(page, 'hp', { m });
  return leerToasts(page);
}
/* Busca por nombre en inglés y pulsa «Añadir»/«Quitar» en la ventana de conjuros abierta (libro, preparar o asistente) */
async function marcar(page, id) {
  const en = await page.evaluate(i => SPBY[i].en, id);
  await b.escribir(page, '#sp-q', en);
  await b.act(page, 'sp-tog', { id });
}
/* Lo que sale en el buscador abierto con una búsqueda: ids de los resultados */
async function buscar(page, q) {
  await b.escribir(page, '#sp-q', q);
  return page.$$eval('#sp-results [data-act="sp-tog"][data-id]', l => l.map(x => x.dataset.id));
}

/* Comprueba si un aviso trae el daño que hay que tirar; si no, el jugador lo busca fuera */
function cuentaDaño(donde, t, re, fuera) {
  const ok = tiene(t, re);
  if (ok) CUENTA.dañoApp++;
  else {
    CUENTA.dañoFuera++;
    pensar('buscar', `${donde}: el aviso no dice qué tirar (${fuera})`);
  }
  regla(donde, ok, `el aviso no dice ${re}: ${todo(t)}`);
  return ok;
}

/* ---------- Enemigos (los números los decide el máster; aquí, inventados) ---------- */

const enemigo = (n, ca, pg, atk, dmg, tipo) => ({ n, ca, pg, max: pg, atk, dmg, tipo });
/* Tirada de ataque del enemigo. d fija el d20 (el máster decide); si no, sale con la semilla */
function tiradaE(e, d) {
  d = d || dado(20);
  return { d, total: d + e.atk, crit: d === 20 };
}
function dañoE(e, crit) {
  const [n, c, m] = e.dmg;
  return tira(crit ? 2 * n : n, c).suma + m;
}
/* El mago ataca con un conjuro: devuelve si impacta */
function tiradaJ(bono, ca) {
  const d = dado(20);
  return { d, total: d + bono, impacta: d === 20 || (d !== 1 && d + bono >= ca), crit: d === 20 };
}

/* Un enemigo ataca al mago. op = {d (d20 fijado), escudo (usar Escudo si le da y sirve), conc ('pierde'|'mantiene')} */
async function ataque(ctx, e, op = {}) {
  const { page } = ctx;
  let c = await ficha(page);
  const ca0 = (await num(page)).ca;
  const a = tiradaE(e, op.d);
  if (a.d === 1 || (!a.crit && a.total < ca0)) {
    narra(`${e.n} ataca: ${a.total} contra CA ${ca0}, falla.`);
    return { dmg: 0 };
  }
  narra(`${e.n} ataca: ${a.crit ? '20 natural, ¡crítico!' : `${a.total} contra CA ${ca0}, impacta`}.`);
  /* Escudo: la reacción del mago al ver que le dan (antes del daño) */
  if (op.escudo && !a.crit) {
    const ok = await escudo(ctx, a.total, ca0);
    if (ok) return { dmg: 0, escudo: true };
  } else if (!op.escudo && !a.crit && a.total < ca0 + 5) {
    /* Podría usar Escudo y no lo hace: ¿se lo recuerda la app? */
    const off = await escudoApagado(page);
    if (off === null)
      pensar(
        'acordarse',
        'Le dan con un ataque que, con Escudo (+5), fallaría: la app no lo recuerda en ningún sitio; el jugador tiene que pensarlo antes de que el máster tire el daño'
      );
  }
  const dmg = dañoE(e, a.crit);
  return recibe(ctx, e, dmg, op.conc);
}
/* ¿Está el botón de Escudo apagado en Combate? null si está encendido (se podría usar) */
async function escudoApagado(page) {
  await irA(page, 'combat');
  const btn = fila(page, 'Escudo').locator('[data-act="t-cast"]').first();
  if (!(await btn.count())) return 'no está';
  return (await btn.isDisabled()) ? ((await btn.textContent()) || '').trim() : null;
}
/* Lanza Escudo como reacción ante un ataque que impacta con «total». Devuelve si el ataque pasa a fallar */
async function escudo(ctx, total, ca0) {
  const { page } = ctx;
  const off = await escudoApagado(page);
  if (off !== null) {
    narra(`Quiere lanzar Escudo, pero el botón está apagado («${off}»).`);
    return false;
  }
  const c0 = await ficha(page);
  const t = await paso(ctx, `Escudo como reacción (le dan con ${total})`, pg =>
    lanzar(pg, 'Escudo', { kind: 'slot', level: 1 })
  );
  const c = await ficha(page);
  const ca = (await num(page)).ca;
  hecho('escudo');
  regla('Escudo', ca === ca0 + 5, `CA ${ca0} → ${ca} (debería subir 5)`);
  regla('Escudo', c.turn.r, 'no gasta la reacción');
  regla('Escudo', c.slots[0].used === c0.slots[0].used + 1, 'no gasta un espacio de nivel 1');
  regla(
    'Escudo',
    tiene(t, new RegExp(`Tu CA pasa a ${ca} hasta el principio de tu siguiente turno`)),
    `el aviso no dice la CA nueva y hasta cuándo: ${todo(t)}`
  );
  if (!tiene(t, /Proyectil/) && !HECHO.has('escudo-pm'))
    (hecho('escudo-pm'),
      pensar(
        'acordarse',
        'Escudo también te protege de Proyectil mágico (no recibes daño de sus dardos): el aviso no lo dice'
      ));
  const falla = total < ca;
  narra(`Escudo: CA ${ca0} → ${ca}. El ataque (${total}) ${falla ? 'ahora falla' : 'sigue impactando'}.`);
  return falla;
}

/* El mago recibe daño. conc = 'pierde' | 'mantiene' | undefined (tira con la semilla) */
async function recibe(ctx, e, dmg, conc) {
  const { page } = ctx;
  const c0 = await ficha(page);
  const cc = c0.concentration;
  const cd = Math.max(10, Math.floor(dmg / 2));
  const sv = conc === 'pierde' ? cd - 1 : conc === 'mantiene' ? Math.max(cd, 12) : dado(20) + 2;
  const pierde = sv < cd;
  const t = await paso(
    ctx,
    `recibe ${dmg} de daño ${e.tipo}${cc && c0.hp.current > dmg ? ` (concentración: saca ${sv})` : ''}`,
    async pg => {
      const out = await vida(pg, dmg, 'dmg');
      const sel = pierde ? 'conc-lose' : 'conc-keep';
      if (await pg.locator(`[data-act="${sel}"]`).count()) await b.act(pg, sel);
      await b.cerrarModal(pg);
      return out;
    }
  );
  const c = await ficha(page);
  narra(`${e.n} le hace ${dmg} de daño ${e.tipo}. PG ${c.hp.current}/${c.hp.max}.`);
  if (cc && c.hp.current > 0) {
    regla(
      'concentración',
      tiene(t, new RegExp(`Concentración en ${cc}: tira salvación de CON, CD ${cd} \\(tu bonificador \\+2`)),
      `el aviso no pide «salvación de CON, CD ${cd} (+2)»: ${todo(t)}`
    );
    narra(
      `Salvación de concentración (${cc}): ${sv} contra CD ${cd}: ${pierde ? 'la pierde' : 'la mantiene'}.`
    );
    if (pierde) {
      hecho('conc-pierde');
      regla('concentración', !c.concentration && !efecto(c, cc), `sigue concentrado en «${c.concentration}»`);
    } else {
      hecho('conc-mantiene');
      regla('concentración', c.concentration === cc, `ha perdido la concentración: «${c.concentration}»`);
    }
  }
  if (c.hp.current === 0) await caer(ctx, cc);
  return { dmg, pierde: cc && pierde };
}

/* Cae a 0 PG: salvación contra muerte en su turno, «Terminar turno» y la clériga le cura */
async function caer(ctx, conc) {
  const { page } = ctx;
  let c = await ficha(page);
  hecho('cae-0');
  regla(
    'caer a 0 PG',
    c.hp.current === 0 && c.conditions.includes('Inconsciente'),
    `PG ${c.hp.current}, estados ${c.conditions}`
  );
  regla(
    'caer a 0 PG (n.º 108, arreglado)',
    c.conditions.includes('Derribado'),
    `al caer inconsciente no queda Derribado: ${c.conditions}`
  );
  if (conc) hecho('conc-pierde');
  if (conc)
    regla('caer a 0 PG', !c.concentration, `sigue concentrado en «${c.concentration}» estando inconsciente`);
  narra('Elarion cae a 0 PG.');
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
      await irA(pg, 'combat');
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
    const cura = tira(1, 4).suma + 3;
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
    narra(`La clériga le lanza Palabra de curación: ${c.hp.current} PG. Sigue derribado.`);
    if (c.conditions.includes('Derribado'))
      await paso(ctx, 'levantarse', async pg => {
        await irA(pg, 'combat');
        if (await pg.locator('[data-act="t-stand"]').count()) await b.act(pg, 't-stand');
        else {
          await b.act(pg, 'vida');
          await b.act(pg, 'cond', { n: 'Derribado' }, '#modal');
          await b.cerrarModal(pg);
        }
      });
  }
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
    else if (s === 'expert') {
      for (const k of elige.exp || []) await b.act(page, 'wz-exp', { k });
    } else if (s === 'asi') {
      await b.radio(page, 'wz-asi', elige.asi.mode);
      await b.elegir(page, '#wz-asi-a', elige.asi.a);
      if (elige.asi.b) await b.elegir(page, '#wz-asi-b', elige.asi.b);
    } else if (s === 'spells') {
      for (const id of elige.conjuros || []) {
        const ya = await page.evaluate(i => W.spells.some(x => x.ref === i), id);
        if (ya) continue;
        await marcar(page, id);
      }
      textos.spellsDespues = await texto(page, '#modal .sheet');
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
/* Lo que se comprueba tras cada subida de nivel */
async function trasSubir(ctx, L, pgAntes, pgDado, prep, can, atk, cd) {
  const { page } = ctx;
  const c = await ficha(page);
  const n = await num(page);
  regla(`nivel ${L}`, c.level === L, `nivel ${c.level}`);
  regla(
    `nivel ${L}`,
    c.hp.max === pgAntes + pgDado + 2,
    `PG máximos ${c.hp.max} (deberían ser ${pgAntes} + ${pgDado} del d6 + 2 de CON = ${pgAntes + pgDado + 2})`
  );
  regla(`nivel ${L}`, c.hitDice.die === 'd6', `dado de golpe ${c.hitDice.die}`);
  regla(
    `nivel ${L}`,
    preparados(c).length === prep,
    `conjuros preparados ${preparados(c).length} (a nivel ${L} el mago prepara ${prep})`
  );
  regla(`nivel ${L}`, trucos(c).length === can, `trucos de mago ${trucos(c).length} (a nivel ${L}: ${can})`);
  regla(
    `nivel ${L}`,
    n.atk === atk && n.cd === cd,
    `ataque de conjuro +${n.atk} y CD ${n.cd} (+${atk} y ${cd})`
  );
  return { c, n };
}

async function descansoCorto(ctx, hd) {
  return paso(ctx, `descanso corto${hd ? `: dado de golpe (sale ${hd})` : ''}`, async pg => {
    await b.act(pg, 'rest-menu');
    await b.act(pg, 'short');
    const txt = await texto(pg, '#modal .sheet');
    if (hd) {
      await b.escribir(pg, '#hd-roll', hd);
      await b.act(pg, 'hd');
    }
    await b.act(pg, 'short-done');
    return { txt, t: await leerToasts(pg) };
  });
}
/* Descanso largo. luego(pg) se hace en el mismo paso, con el aviso aún abierto (el botón «Cambiar conjuros» solo está ahí) */
async function descansoLargo(ctx, luego, que) {
  return paso(ctx, `descanso largo${que ? ` y ${que}` : ''}`, async pg => {
    await b.act(pg, 'rest-menu');
    await b.act(pg, 'long');
    const txt = await texto(pg, '#modal .sheet');
    await b.act(pg, 'long-done');
    const t = await leerToasts(pg);
    return { txt, t, luego: luego ? await luego(pg) : null };
  });
}
/* Recuperación arcana desde «Rasgos y dotes»: elige cuántos espacios de cada nivel. pick = {nivel: cuántos} */
async function recuperacionArcana(ctx, pick) {
  const { page } = ctx;
  const c0 = await ficha(page);
  const r = await paso(ctx, `Recuperación arcana (${JSON.stringify(pick)})`, async pg => {
    await irA(pg, 'play');
    await b.act(pg, 'arcane', { i: await idxFeat(pg, 'Recuperación arcana') });
    const txt = await texto(pg, '#modal .sheet');
    const opciones = await pg.$$eval('#modal select[data-arc]', l =>
      Object.fromEntries(l.map(s => [s.dataset.arc, [...s.options].map(o => +o.value)]))
    );
    for (const [L, n] of Object.entries(pick)) await b.elegir(pg, `#modal select[data-arc="${L}"]`, n);
    await b.act(pg, 'arcane-ok');
    return { txt, opciones, t: await leerToasts(pg) };
  });
  const c = await ficha(page);
  for (const [L, n] of Object.entries(pick))
    regla(
      'Recuperación arcana',
      c.slots[L - 1].used === c0.slots[L - 1].used - n,
      `espacios de nivel ${L} gastados ${c0.slots[L - 1].used} → ${c.slots[L - 1].used} (recupera ${n})`
    );
  regla('Recuperación arcana', usos(c, 'Recuperación arcana').used === 1, 'no gasta el uso');
  const cap = Math.ceil(c.level / 2);
  regla(
    'Recuperación arcana',
    new RegExp(`como mucho ${cap}`).test(r.txt),
    `la ventana debería decir el tope (${cap}, la mitad del nivel redondeando hacia arriba): ${r.txt}`
  );
  return r;
}
async function empezarCombate(ctx, ini) {
  const t = await paso(ctx, 'empezar combate', async pg => {
    await irA(pg, 'combat');
    await b.act(pg, 'cb-start');
    return leerToasts(pg);
  });
  regla(
    'empezar combate',
    tiene(t, new RegExp(`Iniciativa: 1d20 \\+${ini}`)),
    `el aviso no dice «1d20 +${ini}»: ${todo(t)}`
  );
  return t;
}
async function terminarCombate(ctx) {
  return paso(ctx, 'terminar combate', async pg => {
    await irA(pg, 'combat');
    await b.act(pg, 'cb-end');
    const txt = await texto(pg, '#modal .sheet');
    await b.act(pg, 'cb-end-ok');
    return txt;
  });
}
const finTurno = (ctx, n) =>
  paso(ctx, `terminar turno${n ? ` (ronda ${n})` : ''}`, async pg => {
    await irA(pg, 'combat');
    await b.act(pg, 't-end');
    return leerToasts(pg);
  });

/* Lanza un truco de daño en Combate contra un enemigo. re = qué debe decir el aviso */
async function truco(ctx, nombre, e, bono, caras, nDados, re, fuera) {
  const { page } = ctx;
  const t = await paso(ctx, `${nombre} contra ${e.n}`, pg => lanzar(pg, nombre));
  cuentaDaño(nombre, t, re, fuera);
  const a = tiradaJ(bono, e.ca);
  if (a.impacta) {
    const d = tira(a.crit ? 2 * nDados : nDados, caras).suma;
    e.pg -= d;
    narra(
      `${nombre}: ${a.total}${a.crit ? ' (crítico)' : ''}, impacta: ${d}. ${e.n}: ${Math.max(0, e.pg)} PG.`
    );
  } else narra(`${nombre}: ${a.total} contra CA ${e.ca}, falla.`);
  return { t, a };
}

/* =====================================================================
   Escena 1 · Nivel 1: la biblioteca (libro de conjuros, rituales, Armadura de mago)
   ===================================================================== */
async function escena1(ctx) {
  const { page } = ctx;
  ESC = 'E1 nivel 1 · la biblioteca';
  console.log(`\n— ${ESC}`);
  await b.limpiar(page);
  await paso(ctx, 'importar a Elarion', pg => b.importar(pg, b.leerFicha('mago.json')));
  let c = await ficha(page);
  let n = await num(page);

  /* Los números de la ficha (reglas de 2024) */
  regla('ficha', c.hp.max === 8, `PG máximos ${c.hp.max} (d6: 6 + CON 2 = 8)`);
  regla('ficha', n.ca === 12, `CA ${n.ca} (10 + DES 2)`);
  regla('ficha', n.ini === 2, `iniciativa ${n.ini} (DES 2)`);
  regla(
    'ficha',
    n.atk === 5 && n.cd === 13,
    `ataque de conjuro +${n.atk}, CD ${n.cd} (INT 17: +3 + competencia 2 = +5; 8 + 5 = 13)`
  );
  regla(
    'ficha',
    preparados(c).length === 4,
    `preparados ${preparados(c).length} (el mago de nivel 1 prepara 4)`
  );
  regla(
    'ficha',
    trucos(c).length === 3,
    `trucos de mago ${trucos(c).length} (3 a nivel 1; los 2 de la dote van aparte)`
  );
  regla('ficha', usos(c, 'Recuperación arcana').max === 1, 'Recuperación arcana: 1 uso por descanso largo');
  regla(
    'ficha',
    n.libro === 4 && n.need === 6,
    `libro ${n.libro} de ${n.need} (el mago empieza con 6 en el libro)`
  );
  await irA(page, 'play');
  const aviso = await page.locator('.hint.warn', { hasText: 'libro de conjuros le faltan' }).count();
  regla('libro', aviso === 1, 'no avisa de que faltan conjuros en el libro');
  narra(
    `Elarion mira su ficha: CA ${n.ca}, ataque de conjuro +${n.atk}, CD ${n.cd}. «A tu libro le faltan 2».`
  );

  /* Apunta los 2 conjuros que faltan en el libro: Encontrar familiar y Manos ardientes */
  const lib = await paso(ctx, 'apuntar Encontrar familiar y Manos ardientes en el libro', async pg => {
    await irA(pg, 'play');
    await b.act(pg, 'book-open');
    const txt = await texto(pg, '#modal .sheet');
    const otros = await buscar(pg, 'Bless');
    await marcar(pg, 'find-familiar');
    await marcar(pg, 'burning-hands');
    const cuenta = await texto(pg, '#book-count');
    await b.act(pg, 'sp-close');
    return { txt, otros, cuenta };
  });
  hecho('libro');
  c = await ficha(page);
  n = await num(page);
  regla('libro', n.libro === 6, `libro ${n.libro} (6)`);
  regla('libro', !lib.otros.length, `el buscador del libro ofrece conjuros que no son de mago: ${lib.otros}`);
  regla(
    'libro',
    preparados(c).length === 4 && !c.spells.some(s => s.ref === 'find-familiar'),
    'apuntar en el libro no debería prepararlos'
  );
  await irA(page, 'play');
  regla(
    'libro',
    !(await page.locator('.hint.warn', { hasText: 'libro de conjuros le faltan' }).count()),
    'sigue el aviso de que faltan conjuros en el libro'
  );
  narra(`Apunta Encontrar familiar y Manos ardientes. ${lib.cuenta}.`);

  /* Encontrar familiar como ritual desde el libro, sin prepararlo */
  const rit = await page.locator('details.rules', { hasText: 'Rituales de tu libro' }).count();
  regla('Ritualista', rit === 1, 'no sale «Rituales de tu libro» con Encontrar familiar');
  const tienincienso = c.equipment.some(e => /incienso/i.test(e.name));
  let t = await paso(ctx, 'Encontrar familiar como ritual desde el libro y crear el familiar', async pg => {
    await irA(pg, 'play');
    const det = pg.locator('details.rules', { hasText: 'Rituales de tu libro' });
    await det.locator('summary').click();
    await b.act(pg, 'book-ritual', { id: 'find-familiar' });
    /* Sin el incienso, la app pregunta antes (n.º 137) */
    let mt = '';
    if (await pg.locator('#modal [data-act="book-ritual"][data-force]').count()) {
      mt = await texto(pg, '#modal .sheet');
      await b.act(pg, 'book-ritual', { force: '1' }, '#modal');
    }
    const t = [mt, ...(await leerToasts(pg))].filter(Boolean);
    /* Crear el familiar desde el botón del aviso */
    await b.act(pg, 'crea-from-cast', { k: 'familiar' });
    await b.elegir(pg, '#cx-cat', 'owl');
    await b.escribir(pg, '#cx-name', 'Ceniza (búho)');
    await b.act(pg, 'crea-save');
    await b.cerrarModal(pg);
    return t;
  });
  hecho('ritual-libro');
  c = await ficha(page);
  regla('Ritualista', libres(c, 1) === 2, 'el ritual gasta un espacio');
  regla('Ritualista', tiene(t, /ritual/i), `el aviso no dice que es un ritual: ${todo(t)}`);
  narra(`Aviso: «${todo(t)}».`);
  if (!tienincienso) {
    /* Desde «Lanzar» la app avisa de que falta el incienso; desde «Rituales de tu libro», no */
    regla(
      'Encontrar familiar',
      tiene(t, /incienso/i),
      'desde «Rituales de tu libro» no avisa de que falta el incienso de 10 po que gasta el conjuro (desde «Lanzar» sí lo pide)'
    );
    pensar(
      'acordarse',
      'Encontrar familiar gasta incienso que vale 10 po; Elarion no lo lleva y desde «Rituales de tu libro» la app no lo pregunta'
    );
  }
  if (!tiene(t, /1 hora/))
    pensar(
      'acordarse',
      'Encontrar familiar tarda 1 hora (más 10 minutos como ritual): el aviso solo dice «tarda 10 minutos más»'
    );
  c = await ficha(page);
  hecho('familiar');
  const fam = c.companions.find(x => x.kind === 'familiar');
  regla(
    'familiar',
    !!fam && fam.hp.max === 1 && fam.ac === 11,
    `familiar ${JSON.stringify(fam && { ac: fam.ac, hp: fam.hp })} (búho: CA 11, 1 PG)`
  );
  narra(`Aparece Ceniza, un búho (CA ${fam && fam.ac}, ${fam && fam.hp.max} PG).`);

  /* Detectar magia (preparado por la dote) como ritual: sin espacio, concentración 10 minutos */
  t = await paso(ctx, 'Detectar magia como ritual', pg =>
    lanzarFuera(pg, 'Detectar magia', { kind: 'ritual' })
  );
  hecho('ritual-prep');
  c = await ficha(page);
  regla(
    'Detectar magia',
    /Como ritual/.test(VENTANA) && /Gratis/.test(VENTANA),
    `la ventana no ofrece ritual y uso gratis: ${VENTANA}`
  );
  regla('Detectar magia', libres(c, 1) === 2, 'como ritual no debería gastar espacio');
  regla(
    'Detectar magia',
    usos(c, 'Conjuro de iniciado (gratis)').used === 0,
    'como ritual gasta el uso gratis'
  );
  const dm = efecto(c, 'Detectar magia');
  regla(
    'Detectar magia',
    c.concentration === 'Detectar magia' && dm && dm.m === 10,
    `concentración «${c.concentration}», efecto ${JSON.stringify(dm)} (10 minutos)`
  );
  narra('Detectar magia como ritual: la biblioteca tiene un aura de adivinación en un estante.');

  /* Armadura de mago antes de salir: 8 horas, CA 13 + DES */
  t = await paso(ctx, 'Armadura de mago', pg => armaduraDeMago(pg));
  hecho('armadura');
  c = await ficha(page);
  n = await num(page);
  regla('Armadura de mago', n.ca === 15, `CA ${n.ca} (13 + DES 2 = 15)`);
  regla('Armadura de mago', libres(c, 1) === 1, `espacios libres ${libres(c, 1)}`);
  const ma = efecto(c, 'Armadura de mago');
  regla(
    'Armadura de mago',
    ma && ma.m === 480 && !ma.conc,
    `efecto ${JSON.stringify(ma)} (8 horas, sin concentración)`
  );
  regla(
    'Armadura de mago',
    c.concentration === 'Detectar magia',
    'Armadura de mago le quita la concentración'
  );
  narra(`Armadura de mago: CA ${n.ca}. Le queda 1 espacio de nivel 1.`);

  /* Pasan 10 minutos: se acaba Detectar magia */
  await paso(ctx, 'pasan 10 minutos', async pg => {
    await b.act(pg, 'vida');
    await b.act(pg, 'pass-time', { m: 10 }, '#modal');
    await b.cerrarModal(pg);
  });
  c = await ficha(page);
  regla(
    'duraciones',
    !c.concentration && !efecto(c, 'Detectar magia'),
    'Detectar magia no termina a los 10 minutos'
  );
  regla(
    'duraciones',
    efecto(c, 'Armadura de mago') && efecto(c, 'Armadura de mago').m === 470,
    'Armadura de mago no descuenta los 10 minutos'
  );
}

/* =====================================================================
   Escena 2 · Nivel 1: goblins en el camino (Dormir, concentración perdida, cae a 0 PG)
   ===================================================================== */
async function escena2(ctx) {
  const { page } = ctx;
  ESC = 'E2 nivel 1 · goblins en el camino';
  console.log(`\n— ${ESC}`);
  const gob = [
    enemigo('Goblin 1', 15, 7, 4, [1, 6, 2], 'cortante'),
    enemigo('Goblin 2', 15, 7, 4, [1, 6, 2], 'cortante'),
    enemigo('Goblin 3', 15, 7, 4, [1, 6, 2], 'perforante'),
  ];
  await empezarCombate(ctx, 2);
  narra(`Iniciativa: ${dado(20) + 2}. Elarion actúa primero.`);

  /* Ronda 1: Dormir sobre los tres goblins (su último espacio) */
  let t = await paso(ctx, 'Dormir sobre los goblins', pg => lanzar(pg, 'Dormir'));
  hecho('dormir');
  let c = await ficha(page);
  regla('Dormir', c.concentration === 'Dormir', `concentración «${c.concentration}»`);
  regla('Dormir', libres(c, 1) === 0, `espacios libres ${libres(c, 1)}`);
  const dor = efecto(c, 'Dormir');
  regla('Dormir', dor && dor.r === 10, `efecto ${JSON.stringify(dor)} (hasta 1 minuto = 10 rondas)`);
  regla('Dormir', c.turn.a, 'no gasta la acción');
  narra(`Aviso: «${todo(t)}».`);
  if (!tiene(t, /Sabidur|SAB/))
    pensar(
      'buscar',
      'Dormir: el aviso dice la CD, pero no que es una salvación de Sabiduría ni qué pasa si la fallan (n.º 107)'
    );
  if (!tiene(t, /5 pies|esfera/i))
    pensar(
      'buscar',
      'Dormir: cuántas criaturas afecta (esfera de 5 pies de radio) solo está en la descripción'
    );
  const svs = gob.map(g => dado(20));
  const dormidos = gob.filter((g, i) => svs[i] < 13);
  narra(
    `Salvaciones de SAB de los goblins: ${svs.join(', ')} contra CD 13. ${dormidos.map(g => g.n).join(' y ') || 'Ninguno'} quedan incapacitados.`
  );
  t = await finTurno(ctx, 1);
  regla(
    'Dormir',
    tiene(t, /Dormir:.*salvación de Sabiduría contra tu CD 13/),
    `al terminar el turno no recuerda la salvación de SAB de Dormir: ${todo(t)}`
  );
  /* El goblin que no se durmió ataca: el máster decide que le da (17) */
  const despierto = gob.find(g => !dormidos.includes(g)) || gob[2];
  const off = await escudoApagado(page);
  regla('Escudo', off !== null, 'Escudo sale encendido sin espacios');
  if (off !== null) narra(`Escudo: el botón dice «${off}» (no le quedan espacios).`);
  let r = await ataque(ctx, despierto, { d: 13, conc: 'pierde' });
  c = await ficha(page);
  if (r.pierde) {
    narra('Pierde la concentración: los goblins dormidos se despiertan.');
    pensar(
      'acordarse',
      'Al pulsar «La fallo», la concentración en Dormir se quita sin ningún aviso: hay que acordarse de decirle al máster que los goblins incapacitados se despiertan'
    );
  }

  /* Ronda 2: Descarga de fuego */
  await truco(
    ctx,
    'Descarga de fuego',
    despierto,
    5,
    10,
    1,
    /Ataque de conjuro: 1d20 \+5\. Si impacta: 1d10 de daño de fuego/,
    '1d20 +5, 1d10 de fuego'
  );
  await finTurno(ctx, 2);
  /* Los tres goblins atacan; el último le deja a 0 PG (el máster decide los d20) */
  for (const g of gob) {
    c = await ficha(page);
    if (c.hp.current === 0 || HECHO.has('cae-0')) break;
    const d = g === gob[2] ? 19 : undefined;
    r = await ataque(ctx, g, { d });
    c = await ficha(page);
    if (g === gob[2] && !HECHO.has('cae-0')) {
      /* El máster remata: otro golpe del jefe para que caiga */
      const jefe = enemigo('Jefe goblin', 17, 21, 4, [2, 6, 2], 'cortante');
      await recibe(ctx, jefe, c.hp.current + 1);
    }
  }
  c = await ficha(page);
  regla('caer a 0 PG', HECHO.has('cae-0'), 'no ha caído a 0 PG');
  /* Ronda 3: de pie otra vez, Rayo de escarcha */
  t = await truco(
    ctx,
    'Rayo de escarcha',
    gob[0],
    5,
    8,
    1,
    /1d20 \+5\. Si impacta: 1d8 de daño de frío/,
    '1d20 +5, 1d8 de frío'
  );
  if (!tiene(t.t, /10 pies/))
    pensar('buscar', 'Rayo de escarcha: el aviso no dice que el objetivo pierde 10 pies de velocidad');
  narra('El guerrero y la clériga acaban con los goblins.');
  const fin = await terminarCombate(ctx);
  c = await ficha(page);
  narra(`Fin del combate. PG ${c.hp.current}/${c.hp.max}.`);
}

/* =====================================================================
   Escena 3 · Descansos, un conjuro copiado y nivel 2
   ===================================================================== */
async function escena3(ctx) {
  const { page } = ctx;
  ESC = 'E3 descansos y nivel 2';
  console.log(`\n— ${ESC}`);
  let c = await ficha(page);

  /* Antes de descansar: el botón «Usar» de Recuperación arcana ya está, aunque solo sirve al terminar un descanso corto */
  await irA(page, 'play');
  if (await page.locator('[data-act="arcane"]').count())
    pensar(
      'acordarse',
      'Recuperación arcana: el botón «Usar» sale siempre, también en combate o sin haber descansado; solo vale al terminar un descanso corto (lo dice el texto de la ventana)'
    );
  /* Descanso corto: dado de golpe y Recuperación arcana */
  const hd = dado(6);
  const dc = await descansoCorto(ctx, hd);
  c = await ficha(page);
  narra(`Descanso corto: gasta un d6 (${hd} + 2). PG ${c.hp.current}/${c.hp.max}.`);
  if (!/Recuperaci[oó]n arcana/.test(dc.txt))
    pensar(
      'acordarse',
      'Descanso corto: la ventana no menciona Recuperación arcana; hay que acordarse de ir a «Rasgos y dotes» y pulsar «Usar»'
    );
  const ra = await recuperacionArcana(ctx, { 1: 1 });
  hecho('arcana');
  narra(`Recuperación arcana: «${ra.txt.slice(0, 160)}». Recupera 1 espacio de nivel 1.`);
  await irA(page, 'play');
  regla(
    'Recuperación arcana',
    !(await page.locator('[data-act="arcane"]').count()),
    'el botón «Usar» sigue saliendo con el uso gastado'
  );

  /* El botín de los goblins: 60 po y la hoja de un libro de conjuros con Risa horrible */
  await paso(ctx, 'cobra 60 po del botín', async pg => {
    await irA(pg, 'play');
    await b.act(pg, 'money');
    await b.escribir(pg, '#pay-amt', 60);
    await b.elegir(pg, '#pay-coin', 'gp');
    await b.act(pg, 'earn');
    await b.cerrarModal(pg);
  });
  c = await ficha(page);
  const oro0 = c.coins.gp;
  const cp = await paso(ctx, 'copiar Risa horrible en el libro', async pg => {
    await irA(pg, 'play');
    await b.act(pg, 'book-open');
    const txt = await texto(pg, '#modal .sheet');
    await marcar(pg, 'hideous-laughter');
    await b.act(pg, 'sp-close');
    return { txt, t: await leerToasts(pg) };
  });
  hecho('copiar');
  c = await ficha(page);
  regla(
    'copiar',
    c.book.some(x => x.ref === 'hideous-laughter'),
    'Risa horrible no queda en el libro'
  );
  regla(
    'copiar',
    /2 horas y 50 po/.test(cp.txt),
    `la ventana del libro no dice lo que cuesta copiar: ${cp.txt.slice(0, 200)}`
  );
  if (c.coins.gp === oro0) {
    pensar(
      'calcular',
      'Copiar Risa horrible: 2 horas y 50 po por nivel. La app lo dice, pero no resta el oro ni pasa el tiempo: el jugador paga a mano'
    );
    await paso(ctx, 'paga a mano los 50 po de copiar', async pg => {
      await irA(pg, 'play');
      await b.act(pg, 'money');
      await b.escribir(pg, '#pay-amt', 50);
      await b.elegir(pg, '#pay-coin', 'gp');
      await b.act(pg, 'pay');
      await b.cerrarModal(pg);
    });
    c = await ficha(page);
    regla('copiar', c.coins.gp === oro0 - 50, `oro ${oro0} → ${c.coins.gp}`);
  }
  narra(`Copia Risa horrible en su libro (2 horas, 50 po). Le quedan ${c.coins.gp} po.`);

  /* Descanso largo: vuelve todo; cambiar preparados solo del libro (desde el botón del aviso) */
  const dl = await descansoLargo(
    ctx,
    async pg => {
      await b.act(pg, 'prep-open');
      const txt = await texto(pg, '#modal .sheet');
      /* Los trucos sí salen: el mago puede cambiar uno tras el descanso largo (n.º 138) */
      const fuera = await pg.evaluate(
        ids => ids.filter(i => SPBY[i] && SPBY[i].l > 0),
        await buscar(pg, 'Chromatic Orb')
      );
      const todos = await pg.evaluate(ids => ids.filter(i => SPBY[i] && SPBY[i].l > 0), await buscar(pg, ''));
      await marcar(pg, 'sleep');
      await marcar(pg, 'hideous-laughter');
      const cuenta = await texto(pg, '#prep-counts');
      await b.act(pg, 'sp-close');
      return { txt, fuera, todos, cuenta };
    },
    'cambiar Dormir por Risa horrible'
  );
  const pr = dl.luego;
  c = await ficha(page);
  regla(
    'descanso largo',
    libres(c, 1) === 2 && usos(c, 'Recuperación arcana').used === 0,
    'no recupera espacios o Recuperación arcana'
  );
  regla(
    'descanso largo',
    /* Elarion es elfo: con Trance el descanso largo dura 4 horas (n.º 118) */
    !efecto(c, 'Armadura de mago') || efecto(c, 'Armadura de mago').m <= 240,
    'Armadura de mago (8 horas) sigue con más de 4 horas tras el descanso largo de 4 horas'
  );
  regla(
    'descanso largo',
    c.hp.current === c.hp.max && c.hitDice.spent === 0,
    'no recupera PG o dados de golpe'
  );
  regla(
    'descanso largo',
    tiene(dl.t, /Cambiar conjuros/),
    `el aviso no ofrece cambiar los conjuros preparados: ${todo(dl.t)}`
  );
  if (!/Trance|4 horas/.test(dl.txt))
    pensar('acordarse', 'Descanso largo de un elfo: con Trance son 4 horas (n.º 118)');
  hecho('preparar');
  /* Si el aviso se cierra, ¿hay otro sitio para cambiar los preparados? */
  await irA(page, 'play');
  const otro = await page.locator('[data-act="prep-open"]').count();
  if (!otro)
    pensar(
      'acordarse',
      '«Cambiar conjuros» (preparar solo del libro) solo está en el aviso del descanso largo: si se cierra, queda «Buscar conjuros», que ofrece toda la lista de mago'
    );
  c = await ficha(page);
  regla('preparar', !pr.fuera.length, `preparar ofrece conjuros que no están en el libro: ${pr.fuera}`);
  const libroIds = c.book.map(x => x.ref);
  regla(
    'preparar',
    pr.todos.length && pr.todos.every(id => libroIds.includes(id)),
    `preparar ofrece ${pr.todos} (el libro tiene ${libroIds})`
  );
  regla(
    'preparar',
    preparados(c).length === 4 &&
      c.spells.some(s => s.ref === 'hideous-laughter') &&
      !c.spells.some(s => s.ref === 'sleep'),
    `preparados: ${preparados(c).map(s => s.name)}`
  );
  regla('preparar', libroIds.includes('sleep'), 'Dormir desaparece del libro al dejar de prepararlo');
  narra(`Cambia Dormir por Risa horrible. ${pr.cuenta}.`);
  if (!pr.todos.some(id => /fire-bolt|light|mage-hand/.test(id)))
    pensar(
      'buscar',
      'Tras el descanso largo, el mago de 2024 puede cambiar también uno de sus trucos (por confirmar): la ventana de preparar no ofrece trucos'
    );

  /* Subir a nivel 2: Erudito (pericia en Conocimiento arcano) y un preparado más */
  const pgD = dado(6);
  const n0 = await num(page);
  const c0 = await ficha(page);
  const sub = await paso(ctx, `subir a nivel 2 (sale ${pgD} en el d6)`, pg =>
    subirNivel(pg, { pg: pgD, exp: ['arcana'], conjuros: ['sleep'] })
  );
  hecho('nivel2');
  let { c: c2, n } = await trasSubir(ctx, 2, c0.hp.max, pgD, 5, 3, 5, 13);
  regla(
    'Erudito',
    sub.vistos.includes('expert'),
    `el asistente no pregunta la pericia de Erudito: ${sub.vistos}`
  );
  regla('Erudito', n.arc === n0.arc + 2, `Conocimiento arcano ${n0.arc} → ${n.arc} (pericia: +2 más)`);
  regla('nivel 2', c2.slots[0].total === 3, `espacios de nivel 1: ${c2.slots[0].total}`);
  narra(`Nivel 2: PG ${c2.hp.max}, Conocimiento arcano +${n.arc}, 3 espacios. Prepara Dormir otra vez.`);
  const habla = sub.textos.summary + ' ' + (sub.textos.spells || '');
  if (!/libro/i.test(habla))
    pensar(
      'acordarse',
      'Al subir de nivel, el mago añade 2 conjuros gratis a su libro: el asistente no lo dice ni los pide (solo pide los preparados)'
    );
  await irA(page, 'play');
  const falta = await page.locator('.hint.warn', { hasText: 'libro de conjuros le faltan' }).count();
  narra(`Libro: ${n.libro} de ${n.need}${falta ? ' (avisa de que faltan)' : ' (no avisa de nada)'}.`);
  if (falta && n.need - n.libro < 2)
    pensar(
      'calcular',
      `El aviso dice que al libro le falta ${n.need - n.libro}, pero al subir de nivel se añaden 2: la app cuenta el conjuro copiado (Risa horrible) como uno de los 2 gratis del nivel`
    );
  if (!falta)
    pensar(
      'calcular',
      `El libro tiene ${n.libro} y la app pide ${n.need}: cuenta el conjuro copiado (Risa horrible) como si fuera de los 2 gratis del nivel, y no avisa. El jugador tiene que saber que le tocan 2 más`
    );
  await paso(ctx, 'apuntar los 2 conjuros del nivel en el libro', async pg => {
    await irA(pg, 'play');
    await b.act(pg, 'book-open');
    await marcar(pg, 'identify');
    await marcar(pg, 'thunderwave');
    await b.act(pg, 'sp-close');
  });
  n = await num(page);
  regla('libro', n.libro === 9, `libro ${n.libro} (6 + 2 del nivel 2 + 1 copiado = 9)`);

  /* Identificar como ritual desde el libro, para el anillo de los goblins */
  const t = await paso(ctx, 'Identificar como ritual desde el libro', async pg => {
    await irA(pg, 'play');
    await pg.locator('details.rules', { hasText: 'Rituales de tu libro' }).locator('summary').click();
    await b.act(pg, 'book-ritual', { id: 'identify' });
    return leerToasts(pg);
  });
  c = await ficha(page);
  regla('Ritualista', libres(c, 1) === 3, 'Identificar como ritual gasta espacio');
  narra(`Identificar como ritual: un anillo de protección (lo apunta el máster). Aviso: «${todo(t)}».`);
  if (!tiene(t, /1 minuto|11 minutos/))
    pensar(
      'acordarse',
      'Identificar tarda 1 minuto (11 como ritual): el aviso solo dice «tarda 10 minutos más»'
    );
}

/* =====================================================================
   Escena 4 · Nivel 2: la cripta (Escudo como reacción, Risa horrible, Recuperación arcana)
   ===================================================================== */
async function escena4(ctx) {
  const { page } = ctx;
  ESC = 'E4 nivel 2 · la cripta';
  console.log(`\n— ${ESC}`);
  let t = await paso(ctx, 'Armadura de mago al entrar', pg => armaduraDeMago(pg));
  let c = await ficha(page);
  regla(
    'Armadura de mago',
    (await num(page)).ca === 15 && libres(c, 1) === 2,
    'CA o espacios mal tras Armadura de mago'
  );
  const esq = [
    enemigo('Esqueleto 1', 13, 13, 4, [1, 6, 2], 'perforante'),
    enemigo('Esqueleto 2', 13, 13, 4, [1, 6, 2], 'cortante'),
  ];
  await empezarCombate(ctx, 2);
  narra('Los esqueletos ganan la iniciativa.');
  /* El esqueleto 1 actúa antes que Elarion y le da con un 17: Escudo */
  await ataque(ctx, esq[0], { d: 13, escudo: true });
  regla('Escudo', HECHO.has('escudo'), 'no se ha podido lanzar Escudo');
  c = await ficha(page);
  const fx = efecto(c, 'Escudo');
  regla('Escudo', !!fx, 'no hay efecto de Escudo');
  /* El esqueleto 2 ataca con el Escudo puesto (CA 20) */
  await ataque(ctx, esq[1], { d: 15 });

  /* Turno de Elarion: Risa horrible. Al gastar la acción empieza su turno y Escudo debería terminar */
  t = await paso(ctx, 'Risa horrible sobre el esqueleto 1', pg => lanzar(pg, 'Risa horrible'));
  hecho('risa');
  regla(
    'un espacio por turno (n.º 103, arreglado)',
    !tiene(t, /Solo puedes gastar un espacio/),
    `aviso falso de «un solo espacio por turno» tras el Escudo del turno del enemigo: ${todo(t)}`
  );
  c = await ficha(page);
  const n = await num(page);
  regla(
    'Escudo',
    !efecto(c, 'Escudo') && n.ca === 15,
    `Escudo sigue en el turno de Elarion (CA ${n.ca}); acaba al empezar su turno`
  );
  regla(
    'reacción (n.º 121, arreglado)',
    !c.turn.r,
    'la reacción gastada antes del primer turno no vuelve al empezar su turno'
  );
  regla(
    'Risa horrible',
    c.concentration === 'Risa horrible' && libres(c, 1) === 0,
    `concentración «${c.concentration}», espacios ${libres(c, 1)}`
  );
  narra(`Aviso: «${todo(t)}».`);
  if (!tiene(t, /Sabidur|SAB/))
    pensar(
      'buscar',
      'Risa horrible: el aviso dice la CD, pero no que es una salvación de Sabiduría ni que el objetivo cae Derribado e Incapacitado (n.º 107)'
    );
  const sv = dado(20) - 1;
  narra(`El esqueleto 1 tira SAB: ${sv} contra CD 13: ${sv < 13 ? 'cae al suelo riéndose' : 'la supera'}.`);
  t = await finTurno(ctx, 1);
  regla(
    'Risa horrible',
    tiene(t, /Risa horrible:.*Sabiduría contra tu CD 13.*recibe daño/),
    `al terminar el turno no recuerda la salvación de Risa horrible: ${todo(t)}`
  );
  /* El esqueleto 2 le da: mantiene la concentración */
  await ataque(ctx, esq[1], { d: 16, conc: 'mantiene' });
  c = await ficha(page);
  /* Ronda 2: Descarga de fuego */
  await truco(
    ctx,
    'Descarga de fuego',
    esq[1],
    5,
    10,
    1,
    /1d20 \+5\. Si impacta: 1d10 de daño de fuego/,
    '1d20 +5, 1d10 de fuego'
  );
  await finTurno(ctx, 2);
  /* Rituales del libro en combate: apagados */
  await irA(page, 'play');
  const ritOff = await page.locator('[data-act="book-ritual"]').first().isDisabled();
  regla('Ritualista', ritOff, '«Lanzar como ritual» del libro sale encendido en combate');
  narra('El grupo destroza a los esqueletos.');
  const fin = await terminarCombate(ctx);
  c = await ficha(page);
  narra(`Al terminar el combate: concentración «${c.concentration}».`);
  if (c.concentration === 'Risa horrible')
    await paso(ctx, 'deja de concentrarse en Risa horrible', async pg => {
      await irA(pg, 'play');
      await b.act(pg, 'end-conc');
    });
  /* Descanso corto y Recuperación arcana (1 espacio de nivel 1) */
  await descansoCorto(ctx, c.hp.current < c.hp.max ? dado(6) : 0);
  await recuperacionArcana(ctx, { 1: 1 });
  c = await ficha(page);
  narra(`Recuperación arcana: le quedan ${libres(c, 1)} espacios de nivel 1.`);
}

/* =====================================================================
   Escena 5 · Niveles 3 y 4 (Evocador) y los orcos
   ===================================================================== */
async function escena5(ctx) {
  const { page } = ctx;
  ESC = 'E5 niveles 3 y 4 · los orcos';
  console.log(`\n— ${ESC}`);
  await descansoLargo(ctx);
  let c0 = await ficha(page);
  let pgD = dado(6);
  const s3 = await paso(ctx, `subir a nivel 3: Evocador (sale ${pgD} en el d6)`, pg =>
    subirNivel(pg, { pg: pgD, sub: 'evoker', conjuros: ['scorching-ray'] })
  );
  hecho('nivel3');
  let { c, n } = await trasSubir(ctx, 3, c0.hp.max, pgD, 6, 3, 5, 13);
  regla('nivel 3', c.subclassKey === 'evoker', `subclase ${c.subclassKey}`);
  regla('nivel 3', c.slots[1].total === 2, `espacios de nivel 2: ${c.slots[1].total}`);
  regla(
    'Sabio de la evocación',
    c.features.some(f => f.name === 'Sabio de la evocación'),
    'no aparece Sabio de la evocación'
  );
  /* El alto elfo aprende Detectar magia a nivel 3 (ya lo tenía por la dote) */
  const det = c.spells.filter(s => s.ref === 'detect-magic');
  const libreElfo = usos(c, 'Detectar magia (gratis)');
  regla('alto elfo', det.length === 1, `Detectar magia sale ${det.length} veces`);
  regla('alto elfo', !!libreElfo, 'no aparece el uso gratis de Detectar magia del alto elfo');
  narra(
    `Nivel 3: Evocador. Espacios ${c.slots[0].total}+${c.slots[1].total}. Detectar magia: ${det.map(s => `${s.src}/${s.free}`).join(', ')}.`
  );
  if (libreElfo && det.length === 1 && det[0].free !== 'Detectar magia (gratis)')
    pensar(
      'acordarse',
      `Detectar magia tiene ahora dos usos gratis (la dote y el alto elfo), pero al lanzarlo la app solo ofrece el de «${det[0].free}»: el del elfo hay que marcarlo a mano`
    );
  if (n.libro <= n.need)
    pensar(
      'acordarse',
      'Sabio de la evocación: 2 conjuros de evocación gratis en el libro (y 1 más cada nivel de espacio nuevo). La app no los pide ni los cuenta'
    );
  await paso(ctx, 'apuntar en el libro los de Sabio de la evocación y los del nivel', async pg => {
    await irA(pg, 'play');
    await b.act(pg, 'book-open');
    for (const id of ['shatter', 'darkness', 'web']) await marcar(pg, id);
    await b.act(pg, 'sp-close');
  });
  n = await num(page);
  narra(
    `Libro: ${n.libro} (la app pide ${n.need}; con las reglas serían 6 + 2×2 + 1 copiado + 2 del Evocador = 13).`
  );

  /* Nivel 4: INT +2, un truco nuevo (Agarre electrizante) y un preparado más (Inmovilizar persona) */
  c0 = await ficha(page);
  pgD = dado(6);
  const s4 = await paso(ctx, `subir a nivel 4: INT +2 (sale ${pgD} en el d6)`, pg =>
    subirNivel(pg, { pg: pgD, asi: { mode: '2', a: 'int' }, conjuros: ['shocking-grasp', 'hold-person'] })
  );
  hecho('nivel4');
  ({ c, n } = await trasSubir(ctx, 4, c0.hp.max, pgD, 7, 4, 6, 14));
  regla('nivel 4', c.abilities.int === 19, `INT ${c.abilities.int}`);
  regla('nivel 4', c.slots[1].total === 3, `espacios de nivel 2: ${c.slots[1].total}`);
  narra(`Nivel 4: INT 19, ataque +${n.atk}, CD ${n.cd}. Espacios ${c.slots[0].total}+${c.slots[1].total}.`);
  await paso(ctx, 'apuntar los 2 conjuros del nivel 4 en el libro', async pg => {
    await irA(pg, 'play');
    await b.act(pg, 'book-open');
    await marcar(pg, 'misty-step');
    await b.act(pg, 'sp-close');
  });

  /* Descanso largo: prepara Manos ardientes (del libro) en vez de Risa horrible, para los orcos */
  const dl = await descansoLargo(
    ctx,
    async pg => {
      await b.act(pg, 'prep-open');
      await marcar(pg, 'hideous-laughter');
      await marcar(pg, 'burning-hands');
      const cuenta = await texto(pg, '#prep-counts');
      await b.act(pg, 'sp-close');
      return cuenta;
    },
    'cambiar Risa horrible por Manos ardientes'
  );
  c = await ficha(page);
  regla(
    'preparar',
    preparados(c).length === 7 && c.spells.some(s => s.ref === 'burning-hands'),
    `preparados: ${preparados(c).map(s => s.name)}`
  );
  narra(`Tras el descanso largo prepara Manos ardientes. ${dl.luego}.`);
  /* Combate con los orcos */
  await paso(ctx, 'Armadura de mago', pg => armaduraDeMago(pg));
  const orcos = [
    enemigo('Orco 1', 13, 15, 5, [1, 12, 3], 'cortante'),
    enemigo('Orco 2', 13, 15, 5, [1, 12, 3], 'cortante'),
    enemigo('Orco 3', 13, 15, 5, [1, 12, 3], 'cortante'),
    enemigo('Chamán orco', 12, 22, 4, [1, 6, 1], 'contundente'),
  ];
  await empezarCombate(ctx, 2);
  /* Ronda 1: Manos ardientes con espacio de nivel 2 sobre los tres orcos */
  let t = await paso(ctx, 'Manos ardientes con espacio de nivel 2', pg =>
    lanzar(pg, 'Manos ardientes', { kind: 'slot', level: 2 })
  );
  hecho('manos2');
  c = await ficha(page);
  regla(
    'Manos ardientes',
    /Espacio de nivel 1/.test(VENTANA) && /Espacio de nivel 2/.test(VENTANA),
    `la ventana no ofrece elegir el espacio: ${VENTANA}`
  );
  regla('Manos ardientes', c.slots[1].used === 1, `espacios de nivel 2 gastados ${c.slots[1].used}`);
  cuentaDaño(
    'Manos ardientes (nivel 2)',
    t,
    /Daño: 4d6 de daño de fuego \(con espacio de nivel 2: \+1d6\)/,
    '4d6 de fuego'
  );
  if (!tiene(t, /Destreza|mitad/))
    pensar(
      'buscar',
      'Manos ardientes: salvación de Destreza y mitad de daño si la superan; el aviso no lo dice (n.º 107)'
    );
  if (!tiene(t, /15 pies|cono/i))
    pensar('buscar', 'Manos ardientes: el área (cono de 15 pies) solo está en la descripción');
  const dmg = tira(4, 6).suma;
  narra(
    `Manos ardientes (4d6): ${dmg} de fuego. Dos orcos fallan la salvación de DES, uno la supera (${Math.floor(dmg / 2)}).`
  );
  await finTurno(ctx, 1);
  await ataque(ctx, orcos[0], {});
  /* Ronda 2: Proyectil mágico con espacio de nivel 2 */
  t = await paso(ctx, 'Proyectil mágico con espacio de nivel 2', pg =>
    lanzar(pg, 'Proyectil mágico', { kind: 'slot', level: 2 })
  );
  hecho('proyectil2');
  cuentaDaño(
    'Proyectil mágico (nivel 2)',
    t,
    /Lanzas 4 dardos: cada uno impacta sin tirar y hace 1d4 \+ 1/,
    '4 dardos de 1d4 + 1'
  );
  narra(`Proyectil mágico: 4 dardos, ${tira(4, 4).suma + 4} de fuerza repartidos.`);
  await finTurno(ctx, 2);
  /* El chamán lanza un conjuro: no hay nada que hacer, pero el jugador mira su Escudo */
  await ataque(ctx, orcos[1], { d: 12, escudo: true });
  /* Ronda 3: Inmovilizar persona sobre el chamán, con espacio de nivel 2 */
  t = await paso(ctx, 'Inmovilizar persona sobre el chamán', pg =>
    lanzar(pg, 'Inmovilizar persona', { kind: 'slot', level: 2 })
  );
  hecho('inmovilizar');
  regla(
    'un espacio por turno (n.º 103, arreglado)',
    !tiene(t, /Solo puedes gastar un espacio/),
    `aviso falso de «un solo espacio por turno» tras el Escudo del turno del enemigo: ${todo(t)}`
  );
  c = await ficha(page);
  regla(
    'Inmovilizar persona',
    c.concentration === 'Inmovilizar persona',
    `concentración «${c.concentration}»`
  );
  if (!tiene(t, /Sabidur|SAB|Paralizado/))
    pensar(
      'buscar',
      'Inmovilizar persona: salvación de Sabiduría y estado Paralizado; el aviso no lo dice (n.º 107)'
    );
  pensar(
    'acordarse',
    'Inmovilizar persona: los ataques contra el paralizado tienen ventaja y los cuerpo a cuerpo a 5 pies son críticos automáticos; hay que decírselo al grupo (n.º 113)'
  );
  t = await finTurno(ctx, 3);
  regla(
    'Inmovilizar persona',
    tiene(t, /Inmovilizar persona:.*Sabiduría contra tu CD 14/),
    `al terminar el turno no recuerda la salvación de Inmovilizar persona: ${todo(t)}`
  );
  /* Ronda 4: Agarre electrizante al orco que se le ha pegado */
  t = await truco(
    ctx,
    'Agarre electrizante',
    orcos[0],
    6,
    8,
    1,
    /1d20 \+6\. Si impacta: 1d8 de daño de relámpago/,
    '1d20 +6, 1d8 de relámpago'
  );
  if (!tiene(t.t, /oportunidad|reacci/i))
    pensar(
      'buscar',
      'Agarre electrizante: si impacta, el objetivo no puede hacer ataques de oportunidad; el aviso no lo dice'
    );
  if (!t.a.impacta) {
    if (!tiene(t.t, /mitad/))
      pensar(
        'acordarse',
        'Truco potente (Evocador): si el truco falla, el objetivo recibe igualmente la mitad del daño; el aviso no lo recuerda'
      );
  }
  await finTurno(ctx, 4);
  await ataque(ctx, orcos[2], {});
  /* Ronda 5: Descarga de fuego */
  t = await truco(
    ctx,
    'Descarga de fuego',
    orcos[2],
    6,
    10,
    1,
    /1d20 \+6\. Si impacta: 1d10 de daño de fuego/,
    '1d20 +6, 1d10 de fuego'
  );
  if (!tiene(t.t, /mitad|Truco potente/))
    pensar(
      'acordarse',
      'Truco potente (Evocador): si el truco falla o el objetivo supera la salvación, recibe la mitad del daño; el aviso no lo recuerda'
    );
  narra('Los orcos huyen.');
  await terminarCombate(ctx);
  c = await ficha(page);
  if (c.concentration)
    await paso(ctx, 'deja de concentrarse', async pg => {
      await irA(pg, 'play');
      await b.act(pg, 'end-conc');
    });
}

/* =====================================================================
   Escena 6 · Nivel 5 y el ogro (Bola de fuego, trucos de nivel 5, Paso brumoso, Recuperación arcana de nivel 3)
   ===================================================================== */
async function escena6(ctx) {
  const { page } = ctx;
  ESC = 'E6 nivel 5 · el ogro';
  console.log(`\n— ${ESC}`);
  await descansoLargo(ctx);
  const c0 = await ficha(page);
  const pgD = dado(6);
  const s5 = await paso(ctx, `subir a nivel 5 (sale ${pgD} en el d6)`, pg =>
    subirNivel(pg, { pg: pgD, conjuros: ['fireball', 'counterspell'] })
  );
  hecho('nivel5');
  let { c, n } = await trasSubir(ctx, 5, c0.hp.max, pgD, 9, 4, 7, 15);
  regla('nivel 5', c.slots[2].total === 2, `espacios de nivel 3: ${c.slots[2].total}`);
  regla(
    'nivel 5',
    c.features.some(f => f.name === 'Memorizar conjuro'),
    'no aparece Memorizar conjuro'
  );
  const pb = c.spells.find(s => s.ref === 'misty-step');
  regla(
    'alto elfo',
    !!pb && pb.src === 'Alto elfo' && !!pb.free,
    `Paso brumoso del alto elfo: ${JSON.stringify(pb && { src: pb.src, free: pb.free })}`
  );
  narra(
    `Nivel 5: PG ${c.hp.max}, ataque +${n.atk}, CD ${n.cd}, espacios ${c.slots
      .slice(0, 3)
      .map(s => s.total)
      .join('/')}.`
  );
  if (!/libro/i.test(s5.textos.summary + (s5.textos.spells || '')))
    pensar(
      'acordarse',
      'Nivel 5: otra vez 2 conjuros gratis al libro (y 1 de evocación por el nuevo nivel de espacio): el asistente no los pide'
    );
  await paso(ctx, 'apuntar los del nivel 5 en el libro', async pg => {
    await irA(pg, 'play');
    await b.act(pg, 'book-open');
    for (const id of ['lightning-bolt', 'fly']) await marcar(pg, id);
    await b.act(pg, 'sp-close');
  });

  /* El ogro y dos goblins en el puente */
  const ogro = enemigo('Ogro', 11, 68, 6, [2, 8, 4], 'contundente');
  const gobs = [
    enemigo('Goblin 1', 15, 7, 4, [1, 6, 2], 'cortante'),
    enemigo('Goblin 2', 15, 7, 4, [1, 6, 2], 'cortante'),
  ];
  await empezarCombate(ctx, 2);
  /* Ronda 1: Bola de fuego */
  let t = await paso(ctx, 'Bola de fuego', pg => lanzar(pg, 'Bola de fuego', { kind: 'slot', level: 3 }));
  hecho('bola');
  c = await ficha(page);
  regla('Bola de fuego', c.slots[2].used === 1, 'no gasta un espacio de nivel 3');
  cuentaDaño('Bola de fuego', t, /Daño: 8d6 de daño de fuego/, '8d6 de fuego');
  if (!tiene(t, /Destreza|mitad/))
    pensar('buscar', 'Bola de fuego: salvación de Destreza y mitad de daño; el aviso no lo dice (n.º 107)');
  if (!tiene(t, /20 pies/)) pensar('buscar', 'Bola de fuego: el radio (20 pies) solo está en la descripción');
  narra(`Bola de fuego: ${tira(8, 6).suma} de fuego. Los goblins caen; el ogro aguanta.`);
  await finTurno(ctx, 1);
  /* El ogro le da: Paso brumoso gratis para alejarse en su turno */
  await ataque(ctx, ogro, { d: 14 });
  c = await ficha(page);
  if (c.hp.current === 0) {
    narra('El ogro deja a Elarion en el suelo; la clériga le ha curado.');
  }
  /* Ronda 2: Paso brumoso gratis (acción adicional) y Descarga de fuego de nivel 5 */
  t = await paso(ctx, 'Paso brumoso gratis (alto elfo)', pg => lanzar(pg, 'Paso brumoso', { kind: 'free' }));
  hecho('paso-brumoso');
  c = await ficha(page);
  regla(
    'Paso brumoso',
    c.turn.aa && c.slots[1].used === 0,
    `no gasta la acción adicional o gasta espacio (${JSON.stringify(c.turn)}, ${c.slots[1].used})`
  );
  regla(
    'Paso brumoso',
    usos(c, 'Paso brumoso (gratis)') && usos(c, 'Paso brumoso (gratis)').used === 1,
    'no gasta el uso gratis del alto elfo'
  );
  if (!tiene(t, /30 pies/))
    pensar('buscar', 'Paso brumoso: cuánto te teletransportas (30 pies) solo está en la descripción');
  t = await truco(
    ctx,
    'Descarga de fuego',
    ogro,
    7,
    10,
    2,
    /1d20 \+7\. Si impacta: 2d10 de daño de fuego/,
    '1d20 +7, 2d10 de fuego'
  );
  await finTurno(ctx, 2);
  /* Ronda 3: Rayo de escarcha (2d8) y Proyectil mágico con espacio de nivel 3 no, que guarda para Contraconjuro */
  t = await truco(
    ctx,
    'Rayo de escarcha',
    ogro,
    7,
    8,
    2,
    /1d20 \+7\. Si impacta: 2d8 de daño de frío/,
    '1d20 +7, 2d8 de frío'
  );
  await finTurno(ctx, 3);
  await ataque(ctx, ogro, { d: 9 });
  /* Ronda 4: Proyectil mágico con espacio de nivel 3 */
  t = await paso(ctx, 'Proyectil mágico con espacio de nivel 3', pg =>
    lanzar(pg, 'Proyectil mágico', { kind: 'slot', level: 3 })
  );
  cuentaDaño('Proyectil mágico (nivel 3)', t, /Lanzas 5 dardos/, '5 dardos de 1d4 + 1');
  narra('El ogro cae.');
  await finTurno(ctx, 4);
  await terminarCombate(ctx);

  /* Descanso corto: Recuperación arcana puede devolver un espacio de nivel 3 (tope 3) */
  c = await ficha(page);
  const dc = await descansoCorto(ctx, c.hp.current < c.hp.max ? dado(6) : 0);
  if (!/Memorizar/.test(dc.txt))
    pensar(
      'acordarse',
      'Memorizar conjuro (mago 5): tras un descanso corto puede cambiar un preparado por otro del libro; la ventana del descanso corto no lo ofrece'
    );
  const ra = await recuperacionArcana(ctx, { 3: 1 });
  hecho('arcana-3');
  regla(
    'Recuperación arcana',
    (ra.opciones['3'] || []).includes(1) && !(ra.opciones['1'] || []).length,
    `opciones de la ventana: ${JSON.stringify(ra.opciones)}`
  );
  c = await ficha(page);
  narra(`Recuperación arcana a nivel 5: recupera el espacio de nivel 3 (tope ${Math.ceil(5 / 2)}).`);
  /* Memorizar conjuro: cambiar Contraconjuro por Relámpago a mano */
  const mem = await paso(ctx, 'Memorizar conjuro: cambiar Contraconjuro por Relámpago', async pg => {
    await irA(pg, 'play');
    const hay = await pg.locator('[data-act="prep-open"]').count();
    if (hay) {
      await b.act(pg, 'prep-open');
      await marcar(pg, 'counterspell');
      await marcar(pg, 'lightning-bolt');
      await b.act(pg, 'sp-close');
    } else {
      /* No hay botón: lo hace con «Buscar conjuros» (de toda la lista) */
      await b.act(pg, 'sp-open');
      await marcar(pg, 'counterspell');
      await marcar(pg, 'lightning-bolt');
      await b.act(pg, 'sp-close');
    }
    return hay;
  });
  c = await ficha(page);
  regla(
    'Memorizar conjuro',
    c.spells.some(s => s.ref === 'lightning-bolt') && !c.spells.some(s => s.ref === 'counterspell'),
    'no se ha hecho el cambio'
  );
  if (!mem)
    pensar(
      'buscar',
      'Memorizar conjuro: no hay botón para cambiar un preparado tras el descanso corto; hay que usar «Buscar conjuros», que ofrece toda la lista de mago y no solo el libro'
    );
  await descansoLargo(ctx);
}

(async () => {
  const ctx = await b.abrir();
  console.log(`Partida simulada del mago (semilla ${SEMILLA})`);
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
  b.sola(
    `Daño de trucos y conjuros con espacio mayor: el aviso lo dice ${CUENTA.dañoApp} de ${CUENTA.dañoApp + CUENTA.dañoFuera} veces`
  );
  b.sola(
    'Libro de conjuros: avisa si faltan, preparar solo ofrece los del libro y los rituales del libro se lanzan sin prepararlos'
  );
  b.sola('Armadura de mago y Escudo suben la CA; Escudo acaba al empezar tu turno');
  b.sola('Recuperación arcana con el tope calculado; espacios, preparados y trucos por nivel; PG por nivel');
  b.sola('Salvación que se repite (Dormir, Risa horrible, Inmovilizar persona) al terminar el turno');
  const grupos = {};
  PIENSA.forEach(p => (grupos[p.que] = grupos[p.que] || { ...p, n: 0 }).n++);
  for (const p of Object.values(grupos)) b.noSola(`(${p.tipo}${p.n > 1 ? ` ×${p.n}` : ''}) ${p.que}`);
  console.log(`\nDiario de la partida:\n${DIARIO.map(x => '  ' + x).join('\n')}`);
  console.log(
    `\nVeces que el jugador piensa fuera de la app: ${PIENSA.length} (${Object.keys(grupos).length} distintas)`
  );
  console.log(`Daño de conjuros: la app ${CUENTA.dañoApp}, fuera ${CUENTA.dañoFuera}`);
  console.log(`Reglas comprobadas: ${REGLAS.ok + REGLAS.mal} (${REGLAS.mal} mal)`);
  const faltan = Object.keys(MOMENTOS).filter(k => !HECHO.has(k));
  console.log(
    faltan.length
      ? `Momentos que no han salido con esta semilla: ${faltan.map(k => MOMENTOS[k]).join('; ')}`
      : 'Han salido todos los momentos de la partida.'
  );
  process.exitCode = b.informe('Partida simulada: mago alto elfo, niveles 1 a 5');
})();
