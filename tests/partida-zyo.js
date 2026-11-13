/* Prueba de la fase 3: partida simulada con Zyo (brujo tiefling ctónico, Pacto del Filo) de nivel 1 a 3, como un jugador novato con dados físicos. */
'use strict';

/* Uso: node tests/partida-zyo.js [--semilla=N] [--rastro]
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
/* n dados de c caras: {dados, suma} */
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
/* Lo que pide PLAN.md: cuántas veces sale el daño de Estallido arcano y Maleficio, y la resistencia necrótica */
const CUENTA = {
  estallidoApp: 0,
  estallidoFuera: 0,
  maleficioApp: 0,
  maleficioFuera: 0,
  necroApp: 0,
  necroFuera: 0,
};
/* Momentos de la partida que pide PLAN.md: con algunas semillas no salen todos */
const MOMENTOS = {
  'conc-falla': 'pierde la concentración al fallar la salvación',
  'cae-0': 'cae a 0 PG, salvación contra muerte y le curan',
  oportunidad: 'ataque de oportunidad con el arma de pacto',
  'represion-fuera': 'Represión infernal fuera de su turno',
  derribado: 'ataca derribado (desventaja)',
  asustado: 'ataca asustado (desventaja)',
  necro: 'recibe daño necrótico (resistencia)',
  'mente-arcana': 'concentración con ventaja (Mente arcana)',
  bendicion: 'Bendición del oscuro',
  'falsa-vida': 'Falsa vida gratis del legado ctónico',
  corto: 'descanso corto',
  largo: 'descanso largo',
  nivel2: 'subir a nivel 2',
  nivel3: 'subir a nivel 3',
  astucia: 'Astucia mágica',
};
const HECHO = new Set();
const hecho = k => HECHO.add(k);
/* Reglas de 2024 comprobadas (para el informe) */
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

/* Un paso de la partida con las comprobaciones de base.js. Devuelve lo que devuelva fn (de la última vez que se hace) */
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
/* Fila del turno (Combate) que tiene ese nombre */
const fila = (page, nombre) =>
  page.locator('.trow').filter({ has: page.locator('.tname', { hasText: nombre }) });
/* Lanza un conjuro desde Combate (abre el desplegable «Magia» si hace falta). Devuelve los avisos */
async function lanzar(page, nombre) {
  await irA(page, 'combat');
  const btn = fila(page, nombre).locator('[data-act="t-cast"]').first();
  if (!(await btn.isVisible())) {
    const det = page.locator('details.tmag').filter({ has: page.locator('.tname', { hasText: nombre }) });
    await det.locator('summary').first().click();
  }
  if (await btn.isDisabled()) throw new Error(`«${nombre}» está apagado en Combate`);
  await btn.click();
  await b.actSi(page, 'cast-conc-ok', {}, '#modal'); // aviso de concentración (n.º 112)
  const t = await leerToasts(page);
  if (RASTRO) console.log(`    aviso: ${t.join(' | ')}`);
  return t;
}
/* ¿Se puede lanzar ese conjuro ahora desde Combate? */
async function lanzable(page, nombre) {
  await irA(page, 'combat');
  const btn = fila(page, nombre).locator('[data-act="t-cast"]').first();
  if (!(await btn.count())) return { hay: false };
  return { hay: true, ok: !(await btn.isDisabled()), txt: (await btn.textContent()).trim() };
}
/* Daño, curación o PG temporales desde «Vida y estado». m = dmg | half | heal | temp */
async function vida(page, n, m) {
  await b.act(page, 'vida');
  await b.escribir(page, '#hpAmt', n);
  await b.act(page, 'hp', { m });
  return leerToasts(page);
}
/* Pone (on = true) o quita un estado desde «Vida y estado» */
async function estado(page, n, on = true) {
  await b.act(page, 'vida');
  const ya = await page.evaluate(x => C().conditions.includes(x), n);
  if (ya !== on) await b.act(page, 'cond', { n });
  await b.cerrarModal(page);
}
const idxAtk = (page, f) =>
  page.evaluate(src => C().attacks.findIndex(new Function('a', 'return ' + src)), f);
const idxSp = (page, n) => page.evaluate(x => C().spells.findIndex(s => s.name === x), n);
const tiene = (toasts, re) => toasts.some(t => re.test(t));

/* Comprueba el aviso de un ataque o truco con Maleficio activo */
function cuentaMaleficio(donde, toasts, activo) {
  if (!activo) return;
  if (tiene(toasts, /1d6 necrótico/)) CUENTA.maleficioApp++;
  else {
    CUENTA.maleficioFuera++;
    pensar('acordarse', `${donde}: sumar el 1d6 necrótico de Maleficio (el aviso no lo dice)`);
    regla(donde, false, 'con Maleficio activo, el aviso del ataque no dice el +1d6 necrótico');
  }
}

/* ---------- Enemigos (los números los decide el máster; aquí, inventados) ---------- */

function enemigo(n, ca, pg, atk, dmg, tipo) {
  return { n, ca, pg, atk, dmg, tipo };
}
/* El máster ataca a Zyo: devuelve el daño (0 si falla) */
function ataqueEnemigo(e, ca, ventaja) {
  const d1 = dado(20),
    d2 = ventaja ? dado(20) : d1,
    d = ventaja ? Math.max(d1, d2) : d1,
    total = d + e.atk;
  const [n, c, m] = e.dmg;
  if (d === 20) {
    const r = tira(2 * n, c);
    narra(`${e.n} ataca: ${d} natural, ¡crítico! ${r.suma + m} de daño ${e.tipo}`);
    return { dmg: r.suma + m, crit: true };
  }
  if (d !== 1 && total >= ca) {
    const r = tira(n, c);
    narra(`${e.n} ataca: ${total} contra CA ${ca}, impacta: ${r.suma + m} de daño ${e.tipo}`);
    return { dmg: r.suma + m };
  }
  narra(`${e.n} ataca: ${total} contra CA ${ca}, falla`);
  return { dmg: 0 };
}
/* Zyo ataca: tirada, ¿impacta?, ¿crítico? */
function ataqueZyo(bono, ca, desv) {
  const d1 = dado(20),
    d2 = desv ? dado(20) : d1,
    d = desv ? Math.min(d1, d2) : d1;
  return { d, total: d + bono, impacta: d === 20 || (d !== 1 && d + bono >= ca), crit: d === 20 };
}

/* ---------- Asistente de subir de nivel ---------- */

const pasoActual = page => page.evaluate(() => (W ? wizSteps()[W.step][0] : null));
async function subirNivel(page, elige) {
  await b.act(page, 'settings');
  await b.act(page, 'levelup');
  const vistos = [];
  for (let v = 0; v < 20; v++) {
    const s = await pasoActual(page);
    if (!s) throw new Error('el asistente se ha cerrado antes de tiempo');
    vistos.push(s);
    if (s === 'hp' && elige.pg) {
      await b.radio(page, 'wz-hp', 'roll');
      await b.escribir(page, '#wz-hproll', elige.pg);
    } else if (s === 'sub') await b.radio(page, 'wz-sub', elige.sub);
    else if (s === 'spells') {
      for (const id of elige.conjuros || []) {
        const ya = await page.evaluate(i => W.spells.some(x => x.ref === i), id);
        if (ya) continue;
        const en = await page.evaluate(i => SPBY[i].en, id);
        await b.escribir(page, '#sp-q', en);
        await b.act(page, 'sp-tog', { id });
      }
    } else if (s === 'invoc') {
      for (const id of elige.invoc || []) {
        const ya = await page.evaluate(i => wizIv().list.some(e => e.id === i), id);
        if (ya) continue;
        await b.act(page, 'iv-add', { id });
        const i = await page.evaluate(() => wizIv().list.length - 1);
        const sel = `select[data-iv-pick="${i}"]`;
        if (await page.locator(sel).count()) await b.elegir(page, sel, 'Estallido arcano');
      }
    } else if (s === 'confirm') {
      await b.act(page, 'wz-apply');
      await page.waitForFunction(() => !W);
      return vistos;
    }
    if (!(await page.locator('[data-act="wz-next"]').isEnabled()))
      throw new Error(`paso «${s}» sin completar: ${await texto(page, '.wz-foot .hint')}`);
    await b.act(page, 'wz-next');
  }
  throw new Error('el asistente no termina');
}

/* Zyo a 0 PG: salvación contra muerte al empezar su turno, «Terminar turno» y la clériga le cura */
async function caerYCurar(ctx) {
  const { page } = ctx;
  let c;
  c = await ficha(page);
  regla(
    'caer a 0 PG',
    c.hp.current === 0 && c.conditions.includes('Inconsciente'),
    `PG ${c.hp.current}, estados ${c.conditions}`
  );
  if (!c.conditions.includes('Derribado'))
    pensar(
      'acordarse',
      'Al caer inconsciente también quedas Derribado (la app no lo marca; al despertar sigues en el suelo)'
    );
  pensar('acordarse', 'Al caer inconsciente sueltas el arma de pacto (la app la deja en tus ataques)');
  narra('Zyo cae a 0 PG.');

  /* Su turno: salvación contra muerte al empezar (con los botones de la tarjeta), y la ventana de «Terminar turno» */
  const sv1 = dado(20);
  const r1 = sv1 === 20 ? '20' : sv1 >= 10 ? 'ok' : sv1 === 1 ? '1' : 'ko';
  await paso(ctx, `salvación contra muerte al empezar el turno (sale ${sv1})`, async pg => {
    await irA(pg, 'combat');
    await b.act(pg, 'ds-roll', { r: r1 }, '.death');
  });
  c = await ficha(page);
  narra(`Salvación contra muerte: ${sv1}. Éxitos ${c.deathSaves.success}, fallos ${c.deathSaves.fail}.`);
  const dsAntes = JSON.stringify(c.deathSaves);
  const pregunta = await paso(ctx, 'terminar turno a 0 PG', async pg => {
    await b.act(pg, 't-end');
    const hay = await pg.locator('#ds-ask').count();
    const txt = hay ? await texto(pg, '#modal .sheet') : '';
    if (hay) await b.act(pg, 'close-modal', {}, '#modal');
    return txt;
  });
  if (pregunta) {
    pensar(
      'acordarse',
      'Al terminar el turno a 0 PG la app vuelve a pedir la salvación contra muerte aunque ya la hayas marcado al empezar el turno: hay que saber que es la misma y pulsar «Ya la había apuntado»'
    );
  }
  c = await ficha(page);
  regla(
    'salvaciones contra muerte',
    JSON.stringify(c.deathSaves) === dsAntes,
    'terminar el turno ha cambiado las salvaciones'
  );

  /* La clériga del grupo le cura con Palabra de curación (2d4 + 3) */
  const cura = tira(2, 4).suma + 3;
  await paso(ctx, `le curan ${cura} PG`, pg => vida(pg, cura, 'heal'));
  c = await ficha(page);
  regla(
    'curación a 0 PG',
    c.hp.current === Math.min(10, cura) &&
      !c.conditions.includes('Inconsciente') &&
      c.deathSaves.fail === 0 &&
      c.deathSaves.success === 0,
    `PG ${c.hp.current}, estados ${c.conditions}, salvaciones ${JSON.stringify(c.deathSaves)}`
  );
  narra(`La clériga cura a Zyo: ${c.hp.current} PG.`);
  hecho('cae-0');
}

/* =====================================================================
   Escena 1 · Nivel 1: emboscada de goblins en el camino
   ===================================================================== */
async function escena1(ctx) {
  const { page } = ctx;
  ESC = 'E1 nivel 1 · goblins';
  console.log(`\n— ${ESC}`);
  await b.limpiar(page);
  await paso(ctx, 'importar a Zyo', pg => b.importar(pg, b.leerFicha('zyo.json')));
  let c = await ficha(page);

  /* Los números de la ficha (reglas de 2024) */
  const num = await page.evaluate(() => ({ ca: acOf(C()), ini: init(C()), cd: spDC(C()), atk: spAtk(C()) }));
  regla('ficha', num.ca === 13, `CA ${num.ca} (cuero 11 + DES 2 = 13)`);
  regla('ficha', num.ini === 2, `iniciativa ${num.ini} (DES +2)`);
  regla('ficha', num.cd === 13 && num.atk === 5, `CD ${num.cd} y ataque de conjuro +${num.atk} (13 y +5)`);
  regla('ficha', c.hp.max === 10, `PG máximos ${c.hp.max} (8 + CON 2 = 10)`);
  regla('ficha', c.pact.total === 1 && c.pact.level === 1, 'magia de pacto: 1 espacio de nivel 1');

  /* Rasgos de origen: solo texto */
  const nombres = c.features.map(f => f.name);
  regla(
    'ficha',
    nombres.includes('Legado ctónico') && nombres.includes('Dote Superviviente'),
    'faltan el legado ctónico o la Dote Superviviente en los rasgos'
  );

  const g1 = enemigo('Goblin 1', 15, 10, 4, [1, 6, 2], 'cortante');
  const g2 = enemigo('Goblin 2 (arco)', 15, 10, 4, [1, 6, 2], 'perforante');
  const osgo = enemigo('Osgo', 16, 33, 4, [2, 6, 2], 'contundente');

  // Iniciativa
  let t = await paso(ctx, 'empezar combate', async pg => {
    await irA(pg, 'combat');
    await b.act(pg, 'cb-start');
    return leerToasts(pg);
  });
  regla(
    'empezar combate',
    tiene(t, /Iniciativa: 1d20 \+2/),
    `el aviso de iniciativa no dice «1d20 +2»: ${t[0]}`
  );
  narra(`Iniciativa: ${dado(20) + 2}. Zyo actúa primero.`);

  // Ronda 1 · Maleficio al goblin 1
  t = await paso(ctx, 'Maleficio (acción adicional)', pg => lanzar(pg, 'Maleficio'));
  c = await ficha(page);
  regla('Maleficio', c.pact.used === 1, `espacios de pacto gastados ${c.pact.used} (debería ser 1)`);
  regla('Maleficio', c.concentration === 'Maleficio', `concentración «${c.concentration}»`);
  const fxM = c.effects.find(e => e.name === 'Maleficio');
  regla(
    'Maleficio',
    fxM && fxM.m === 60 && fxM.conc,
    `efecto ${JSON.stringify(fxM)} (1 hora, concentración)`
  );
  regla('Maleficio', c.turn.aa && !c.turn.a, 'debería gastar solo la acción adicional');
  if (!tiene(t, /caracter[ií]stica/i))
    pensar(
      'acordarse',
      'Maleficio: elegir la característica con la que el objetivo tiene desventaja (no se pregunta)'
    );
  if (!tiene(t, /1d6/))
    pensar('buscar', 'Maleficio: qué hace (el aviso de lanzarlo no dice el 1d6 necrótico)');
  narra('Zyo lanza Maleficio sobre el goblin 1 (Sabiduría).');

  // Estallido arcano al goblin 1
  t = await paso(ctx, 'Estallido arcano', pg => lanzar(pg, 'Estallido arcano'));
  regla('Estallido arcano', (await ficha(page)).turn.a, 'el truco no ha gastado la acción');
  if (tiene(t, /1d20 \+5/) && tiene(t, /1d10/) && tiene(t, /fuerza/)) CUENTA.estallidoApp++;
  else {
    CUENTA.estallidoFuera++;
    pensar('buscar', 'Estallido arcano: qué tirar (ataque y daño)');
    regla('Estallido arcano', false, `el aviso no dice «1d20 +5» y «1d10 de fuerza»: ${t.join(' | ')}`);
  }
  cuentaMaleficio('Estallido arcano', t, true);
  let a = ataqueZyo(5, g1.ca);
  if (a.impacta) {
    const dmg = tira(a.crit ? 2 : 1, 10).suma + tira(a.crit ? 2 : 1, 6).suma;
    g1.pg -= dmg;
    narra(`Estallido arcano: ${a.total}, impacta. ${dmg} de daño (con Maleficio). Goblin 1: ${g1.pg} PG.`);
  } else narra(`Estallido arcano: ${a.total}, falla.`);

  await paso(ctx, 'moverse 10 pies', pg => b.act(pg, 't-mv', { d: 10 }));
  const mov = await texto(page, '.movebar');
  regla('movimiento', /te quedan 20 de 30/.test(mov), `barra de movimiento: «${mov}»`);

  await paso(ctx, 'terminar turno (ronda 1)', pg => b.act(pg, 't-end'));
  c = await ficha(page);
  regla('terminar turno', c.combat && c.combat.round === 2, `ronda ${c.combat && c.combat.round}`);

  /* Turno de los goblins: atacan hasta que Zyo pierde la concentración (o cae) */
  let caido = false,
    rebukeVisto = false;
  for (let i = 0; i < 8; i++) {
    c = await ficha(page);
    if (!c.concentration || c.hp.current <= 0) break;
    const e = i % 2 ? g2 : g1;
    if (e.pg <= 0) continue;
    const r = ataqueEnemigo(e, 13);
    if (!r.dmg) continue;
    const sv = dado(20),
      cd = Math.max(10, Math.floor(r.dmg / 2));
    const pierde = sv + 2 < cd;
    t = await paso(ctx, `recibe ${r.dmg} de daño ${e.tipo} y tira concentración (${sv}+2)`, async pg => {
      const out = await vida(pg, r.dmg, 'dmg');
      const sel = pierde ? 'conc-lose' : 'conc-keep';
      if (await pg.locator(`[data-act="${sel}"]`).count()) await b.act(pg, sel);
      await b.cerrarModal(pg);
      return out;
    });
    c = await ficha(page);
    if (c.hp.current > 0)
      regla(
        'concentración',
        tiene(t, new RegExp(`salvación de CON, CD ${cd} \\(tu bonificador \\+2`)),
        `el aviso no pide «salvación de CON, CD ${cd} (+2)»: ${t[0]}`
      );
    if (c.hp.current <= 0) {
      narra('Zyo cae a 0 PG y pierde la concentración.');
      regla('caer a 0 PG', !c.concentration, 'a 0 PG sigue concentrado');
      await caerYCurar(ctx);
      caido = true;
      break;
    }
    narra(
      `Salvación de concentración: ${sv} + 2 = ${sv + 2} contra CD ${cd}: ${pierde ? 'la pierde' : 'la mantiene'}.`
    );
    if (pierde && c.hp.current > 0) {
      regla('concentración', !c.concentration, 'sigue concentrado tras «La fallo»');
      hecho('conc-falla');
      regla(
        'concentración',
        !c.effects.some(x => x.name === 'Maleficio'),
        'el efecto Maleficio sigue tras perder la concentración'
      );
    }
    /* Represión infernal: con 1 solo espacio de pacto ya gastado en Maleficio, no se puede */
    if (!rebukeVisto && c.hp.current > 0) {
      rebukeVisto = true;
      const l = await lanzable(page, 'Represión infernal');
      regla(
        'Represión infernal',
        l.hay && !l.ok,
        `con el espacio gastado debería salir apagado (${JSON.stringify(l)})`
      );
      pensar(
        'acordarse',
        'Represión infernal: al recibir daño, la ventana de daño no la recuerda (y a nivel 1 compite con Maleficio por el único espacio)'
      );
    }
  }

  /* Su turno: invoca su arma de pacto y ataca desde el suelo (un goblin lo derribó) */
  await paso(ctx, 'le derriban (Derribado)', pg => estado(pg, 'Derribado'));
  narra('El goblin 2 empuja a Zyo: queda derribado.');
  t = await paso(ctx, 'invocar arma de pacto (espada larga, necrótico)', async pg => {
    await irA(pg, 'combat');
    await b.act(pg, 't-der', {}, '.trow:has-text("Invocar arma de pacto")');
    await b.elegir(pg, '#pact-w', 'w:longsword');
    await b.elegir(pg, '#pact-t', 'necrótico');
    await b.act(pg, 'pact-ok');
    return leerToasts(pg);
  });
  c = await ficha(page);
  let ip = c.attacks.findIndex(x => x.pact);
  let ap = c.attacks[ip];
  regla(
    'arma de pacto',
    ap && ap.atk === 5 && /1d8 \+ 3/.test(ap.dmg) && ap.type === 'necrótico',
    `arma de pacto ${JSON.stringify(ap && { atk: ap.atk, dmg: ap.dmg, type: ap.type })} (debería ser +5, 1d8 + 3 necrótico: CAR + competencia)`
  );
  regla('arma de pacto', c.turn.aa, 'invocar el arma de pacto debería gastar la acción adicional');
  t = await paso(ctx, 'atacar con el arma de pacto (derribado)', async pg => {
    await b.act(pg, 't-atk', { i: ip });
    return leerToasts(pg);
  });
  hecho('derribado');
  regla(
    'ataque derribado',
    tiene(t, /desventaja \(Derribado\)/),
    `no avisa de la desventaja por Derribado: ${t[0]}`
  );
  regla('ataque derribado', tiene(t, /1d20 \+5/) && tiene(t, /1d8 \+ 3.*necrótico/), `ataque: ${t[0]}`);
  regla('ataque derribado', tiene(t, /2d8 \+ 3/), 'no dice el daño con un crítico (2d8 + 3)');
  a = ataqueZyo(5, g1.ca, true);
  if (a.impacta && g1.pg > 0) {
    const dmg = tira(a.crit ? 2 : 1, 8).suma + 3;
    g1.pg -= dmg;
    narra(`Espada de pacto con desventaja: ${a.total}, impacta, ${dmg} necrótico. Goblin 1: ${g1.pg} PG.`);
  } else narra(`Espada de pacto con desventaja: ${a.total}, falla.`);
  await paso(ctx, 'levantarse', async pg => {
    await irA(pg, 'combat');
    await b.act(pg, 't-stand');
  });
  c = await ficha(page);
  regla(
    'levantarse',
    !c.conditions.includes('Derribado') && c.turn.mv === 15,
    `mv ${c.turn.mv}, estados ${c.conditions}`
  );
  await paso(ctx, 'terminar turno', pg => b.act(pg, 't-end'));

  /* Turno de los goblins: el goblin 1 huye y Zyo le hace un ataque de oportunidad */
  t = await paso(ctx, 'ataque de oportunidad al goblin que huye', async pg => {
    await irA(pg, 'combat');
    await b.act(pg, 't-opp');
    await b.act(pg, 't-opp', { i: ip }, '#modal');
    return leerToasts(pg);
  });
  c = await ficha(page);
  hecho('oportunidad');
  regla('ataque de oportunidad', c.turn.r, 'no gasta la reacción');
  regla(
    'ataque de oportunidad',
    tiene(t, /1d20 \+5/) && tiene(t, /1d8 \+ 3.*necrótico/),
    `no usa el arma de pacto con CAR: ${t[0]}`
  );
  const pill = await texto(page, '.pills');
  regla(
    'ataque de oportunidad',
    /Vuelve en tu turno/.test(pill),
    `la reacción debería decir «Vuelve en tu turno»: ${pill}`
  );
  a = ataqueZyo(5, g1.ca);
  if (a.impacta) {
    const dmg = tira(a.crit ? 2 : 1, 8).suma + 3;
    g1.pg -= dmg;
    narra(`Ataque de oportunidad: ${a.total}, impacta, ${dmg}. Goblin 1: ${g1.pg} PG.`);
  } else narra(`Ataque de oportunidad: ${a.total}, falla.`);
  const l = await lanzable(page, 'Represión infernal');
  regla(
    'reacción gastada',
    l.hay && !l.ok,
    'con la reacción gastada, Represión infernal debería salir apagado'
  );

  /* Llega el osgo y golpea hasta dejar a Zyo a 0 PG (si no ha caído antes) */
  for (let i = 0; i < 10 && !caido; i++) {
    c = await ficha(page);
    if (c.hp.current <= 0) break;
    const r = ataqueEnemigo(osgo, 13);
    if (!r.dmg) continue;
    t = await paso(ctx, `el osgo le hace ${r.dmg} de daño`, async pg => {
      const out = await vida(pg, r.dmg, 'dmg');
      if (await pg.locator('[data-act="conc-keep"]').count()) await b.act(pg, 'conc-keep');
      return out;
    });
  }
  if (!caido) await caerYCurar(ctx);
  /* Su turno: la reacción vuelve al usar la acción */
  t = await paso(ctx, 'Estallido arcano al goblin 2', pg => lanzar(pg, 'Estallido arcano'));
  c = await ficha(page);
  regla('reacción', !c.turn.r, 'la reacción no ha vuelto al usar la acción en el turno siguiente (n.º 31)');
  if (tiene(t, /1d10/)) CUENTA.estallidoApp++;
  else CUENTA.estallidoFuera++;
  a = ataqueZyo(5, g2.ca);
  narra(
    `Estallido arcano al goblin 2: ${a.total}, ${a.impacta ? 'impacta: huye' : 'falla: el goblin huye igualmente'}.`
  );
  await paso(ctx, 'terminar combate', async pg => {
    await b.act(pg, 'cb-end');
    await b.act(pg, 'cb-end-ok');
  });
  c = await ficha(page);
  regla('terminar combate', !c.combat, 'el combate sigue');
  if (c.attacks.some(x => x.pact))
    pensar(
      'acordarse',
      'El arma de pacto sigue en Combate aunque se le cayó al quedar inconsciente (hay que invocarla otra vez)'
    );
}

/* =====================================================================
   Escena 2 · Descanso corto y largo, subir a nivel 2
   ===================================================================== */
async function escena2(ctx) {
  const { page } = ctx;
  ESC = 'E2 descansos y nivel 2';
  console.log(`\n— ${ESC}`);
  let c = await ficha(page);
  const antes = c.hp.current;
  const hd = dado(8),
    gasta = antes < c.hp.max;
  await paso(ctx, `descanso corto${gasta ? `: dado de golpe (sale ${hd})` : ''}`, async pg => {
    await b.act(pg, 'rest-menu');
    await b.act(pg, 'short');
    if (gasta) {
      await b.escribir(pg, '#hd-roll', hd);
      await b.act(pg, 'hd');
    }
    await b.act(pg, 'short-done');
  });
  c = await ficha(page);
  hecho('corto');
  const espera = gasta ? Math.min(10, antes + hd + 2) : antes;
  regla('descanso corto', c.hp.current === espera, `PG ${antes} → ${c.hp.current} (debería ser ${espera})`);
  regla(
    'descanso corto',
    c.pact.used === 0 && c.hitDice.spent === (gasta ? 1 : 0),
    `pacto ${c.pact.used}, dados ${c.hitDice.spent}`
  );
  narra(
    `Descanso corto: ${gasta ? `${hd} + 2 PG` : 'sin dados de golpe'} (${c.hp.current}/10). Recupera el espacio de pacto.`
  );

  await paso(ctx, 'descanso largo', async pg => {
    await b.act(pg, 'rest-menu');
    await b.act(pg, 'long');
    await b.act(pg, 'long-done');
  });
  c = await ficha(page);
  hecho('largo');
  regla(
    'descanso largo',
    c.hp.current === 10 && c.hitDice.spent === 0,
    `PG ${c.hp.current}, dados ${c.hitDice.spent}`
  );

  const vistos = await paso(ctx, 'subir a nivel 2', pg =>
    subirNivel(pg, { invoc: ['agonizing-blast', 'eldritch-mind'], conjuros: ['detect-magic'] })
  );
  narra(`Asistente: ${vistos.join(' → ')}.`);
  c = await ficha(page);
  hecho('nivel2');
  regla('nivel 2', c.level === 2 && c.hp.max === 17, `nivel ${c.level}, PG ${c.hp.max} (10 + 5 + 2 = 17)`);
  regla('nivel 2', c.pact.total === 2 && c.pact.level === 1, `pacto ${c.pact.total}×N${c.pact.level} (2×N1)`);
  const iv = await page.evaluate(() => ivFromChar(C()).map(e => e.id));
  regla(
    'nivel 2',
    ['pact-of-the-blade', 'agonizing-blast', 'eldritch-mind'].every(x => iv.includes(x)) && iv.length === 3,
    `invocaciones ${iv.join(', ')} (3 a nivel 2)`
  );
  const cun = c.features.find(f => f.name === 'Astucia mágica');
  regla('nivel 2', cun && cun.uses.max === 1, 'falta Astucia mágica con 1 uso');
  const prep = c.spells.filter(s => +s.level > 0 && !s.src).length;
  regla('nivel 2', prep === 3, `${prep} conjuros preparados (3 a nivel 2)`);
}

/* =====================================================================
   Escena 3 · Nivel 2: la cripta (sombra con daño necrótico, esqueleto, cultista)
   ===================================================================== */
async function escena3(ctx) {
  const { page } = ctx;
  ESC = 'E3 nivel 2 · cripta';
  console.log(`\n— ${ESC}`);
  const sombra = enemigo('Sombra', 12, 30, 4, [2, 6, 2], 'necrótico');
  const esq = enemigo('Esqueleto', 14, 13, 5, [1, 6, 3], 'perforante');
  let c,
    t,
    a,
    maleficioEn = 'Sombra';

  await paso(ctx, 'empezar combate', async pg => {
    await irA(pg, 'combat');
    await b.act(pg, 'cb-start');
  });

  // Ronda 1: Maleficio a la sombra + Estallido arcano con Estallido agonizante
  await paso(ctx, 'Maleficio a la sombra', pg => lanzar(pg, 'Maleficio'));
  t = await paso(ctx, 'Estallido arcano (agonizante)', pg => lanzar(pg, 'Estallido arcano'));
  if (tiene(t, /1d10 \+3/) && tiene(t, /agonizante/i)) CUENTA.estallidoApp++;
  else {
    CUENTA.estallidoFuera++;
    pensar('calcular', 'Estallido arcano: sumar la CAR de Estallido agonizante');
    regla('Estallido agonizante', false, `el aviso no suma la CAR al daño: ${t.join(' | ')}`);
  }
  cuentaMaleficio('Estallido arcano', t, true);
  a = ataqueZyo(5, sombra.ca);
  if (a.impacta) {
    const dmg = tira(a.crit ? 2 : 1, 10).suma + 3 + tira(a.crit ? 2 : 1, 6).suma;
    sombra.pg -= dmg;
    narra(`Estallido arcano a la sombra: ${a.total}, ${dmg} de daño. Sombra: ${sombra.pg} PG.`);
  } else narra(`Estallido arcano: ${a.total}, falla.`);
  await paso(ctx, 'terminar turno (ronda 1)', pg => b.act(pg, 't-end'));

  // Turno enemigo: el cultista le asusta (Causar miedo, salvación de SAB)
  const sabB = await page.evaluate(() => saveB(C(), 'wis'));
  regla('salvación de SAB', sabB === 3, `salvación de SAB +${sabB} (SAB +1, competente +2 = +3)`);
  const sv = dado(20);
  narra(`El cultista lanza Causar miedo: salvación de SAB ${sv} + 3 = ${sv + 3} contra CD 13.`);
  await paso(ctx, 'queda Asustado', pg => estado(pg, 'Asustado'));
  if (sv + 3 >= 13) narra('(El máster decide que le afecta igualmente para la prueba.)');

  // La sombra le golpea: daño necrótico → resistencia; concentración con ventaja (Mente arcana); Represión infernal
  let r = { dmg: 0 };
  for (let i = 0; i < 6 && !r.dmg; i++) r = ataqueEnemigo(sombra, 13);
  if (!r.dmg) r = { dmg: 7 };
  const mitad = Math.floor(r.dmg / 2);
  const svc = [dado(20), dado(20)],
    cd = 10,
    mantiene = Math.max(...svc) + 2 >= cd;
  let resiste = false;
  t = await paso(ctx, `la sombra le hace ${r.dmg} necrótico`, async pg => {
    await b.act(pg, 'vida');
    resiste = /Resistes:[^.]*necrótico/.test(await texto(pg, '#vida-body'));
    await b.escribir(pg, '#hpAmt', r.dmg);
    await b.act(pg, 'hp', { m: resiste ? 'half' : 'dmg' });
    const out = await leerToasts(pg);
    await b.act(pg, mantiene ? 'conc-keep' : 'conc-lose');
    await b.cerrarModal(pg);
    return out;
  });
  hecho('necro');
  if (resiste) CUENTA.necroApp++;
  else {
    CUENTA.necroFuera++;
    pensar('acordarse', 'Resistencia al daño necrótico del legado ctónico');
  }
  regla('resistencia necrótica', tiene(t, new RegExp(`−${mitad}`)), `no resta la mitad (${mitad}): ${t[0]}`);
  hecho('mente-arcana');
  regla(
    'Mente arcana',
    tiene(t, /ventaja\*?\*? \(Mente arcana\)|ventaja.*Mente arcana/),
    `la concentración no avisa de la ventaja de Mente arcana: ${t[0]}`
  );
  narra(
    `Concentración con ventaja: ${svc.join(' y ')} → ${Math.max(...svc) + 2}: ${mantiene ? 'la mantiene' : 'la pierde'}.`
  );
  pensar(
    'acordarse',
    'Represión infernal: la sombra le ha dañado; la ventana de daño no recuerda la reacción'
  );
  t = await paso(ctx, 'Represión infernal a la sombra (reacción)', pg => lanzar(pg, 'Represión infernal'));
  c = await ficha(page);
  hecho('represion-fuera');
  regla(
    'Represión infernal',
    c.pact.used === 2 && c.turn.r,
    `pacto gastado ${c.pact.used}, reacción ${c.turn.r}`
  );
  regla(
    'Represión infernal',
    tiene(t, /2d10/) && tiene(t, /fuego/),
    `no dice el daño (2d10 de fuego): ${t.join(' | ')}`
  );
  regla('Represión infernal', tiene(t, /CD 13/), 'no dice la CD 13');
  if (!tiene(t, /Destreza|DES/))
    pensar('buscar', 'Represión infernal: la sombra hace salvación de DES (el aviso solo dice la CD)');
  if (!tiene(t, /mitad/))
    pensar('buscar', 'Represión infernal: si la supera recibe la mitad (el aviso no lo dice)');
  if (tiene(t, /Solo puedes gastar un espacio/))
    regla('Represión infernal', false, 'avisa de «un solo espacio por turno» en el turno del enemigo');
  const rb = tira(2, 10).suma,
    rbs = dado(20) + 2;
  sombra.pg -= rbs >= 13 ? Math.floor(rb / 2) : rb;
  narra(
    `Represión infernal: ${rb} de fuego, salvación de la sombra ${rbs}: ${rbs >= 13 ? 'la mitad' : 'todo'}. Sombra: ${sombra.pg} PG.`
  );
  const pill = await texto(page, '.pills');
  regla('reacción fuera de turno', /Vuelve en tu turno/.test(pill), `pastilla de reacción: ${pill}`);

  // Ronda 2: Asustado → desventaja; la reacción vuelve al usar la acción
  t = await paso(ctx, 'Estallido arcano asustado (ronda 2)', pg => lanzar(pg, 'Estallido arcano'));
  c = await ficha(page);
  hecho('asustado');
  regla(
    'Asustado',
    tiene(t, /desventaja \(Asustado/),
    `no avisa de la desventaja por Asustado: ${t.join(' | ')}`
  );
  regla('reacción', !c.turn.r, 'la reacción no vuelve al usar la acción en el turno siguiente');
  if (tiene(t, /1d10 \+3/)) CUENTA.estallidoApp++;
  else CUENTA.estallidoFuera++;
  cuentaMaleficio('Estallido arcano', t, !!c.concentration);
  a = ataqueZyo(5, sombra.ca, true);
  if (a.impacta) {
    const dmg = tira(1, 10).suma + 3 + (c.concentration ? tira(1, 6).suma : 0);
    sombra.pg -= dmg;
  }
  if (sombra.pg > 0) {
    narra(
      `Con desventaja: ${a.total}. La sombra sigue en pie con ${sombra.pg}; el máster dice que cae por el daño de luz del clérigo.`
    );
    sombra.pg = 0;
  } else narra(`Estallido arcano: ${a.total}, la sombra se deshace.`);

  // La sombra cae con Maleficio encima: pasarlo al esqueleto con la acción adicional
  c = await ficha(page);
  if (c.concentration === 'Maleficio') {
    const m = await lanzable(page, 'Maleficio');
    narra(`Maleficio estaba sobre la sombra, que ha caído. En Combate, «Maleficio» sale como «${m.txt}».`);
    pensar(
      'buscar',
      'Maleficio: cuando el objetivo cae a 0 PG, se puede pasar a otra criatura con la acción adicional sin gastar espacio; la app no tiene botón (y «Maleficio» sale apagado sin espacios)'
    );
    maleficioEn = 'Esqueleto';
  }
  await paso(ctx, 'terminar turno (ronda 2)', pg => b.act(pg, 't-end'));

  // El esqueleto dispara
  r = { dmg: 0 };
  for (let i = 0; i < 6 && !r.dmg; i++) r = ataqueEnemigo(esq, 13);
  if (r.dmg) {
    c = await ficha(page);
    const conc = !!c.concentration;
    t = await paso(ctx, `el esqueleto le hace ${r.dmg} perforante`, async pg => {
      const out = await vida(pg, r.dmg, 'dmg');
      if (await pg.locator('[data-act="conc-keep"]').count()) await b.act(pg, 'conc-keep');
      return out;
    });
    if (conc) regla('Mente arcana', tiene(t, /Mente arcana/), 'la concentración no avisa de Mente arcana');
  }
  // Ronda 3: Estallido arcano al esqueleto (Maleficio pasado a mano)
  t = await paso(ctx, 'Estallido arcano al esqueleto (ronda 3)', pg => lanzar(pg, 'Estallido arcano'));
  if (tiene(t, /1d10 \+3/)) CUENTA.estallidoApp++;
  else CUENTA.estallidoFuera++;
  c = await ficha(page);
  cuentaMaleficio('Estallido arcano', t, !!c.concentration);
  narra(
    `El esqueleto cae (${maleficioEn === 'Esqueleto' ? 'con el Maleficio pasado de palabra' : 'sin Maleficio'}).`
  );

  // Terminar combate: Asustado no sale en la lista para quitar
  const cbTxt = await paso(ctx, 'terminar combate', async pg => {
    await b.act(pg, 'cb-end');
    const tx = await texto(pg, '#modal .sheet');
    await b.act(pg, 'cb-end-ok');
    return tx;
  });
  c = await ficha(page);
  if (c.conditions.includes('Asustado') && !/Asustado/.test(cbTxt))
    pensar(
      'acordarse',
      'Quitar «Asustado» al acabar el combate (la ventana de terminar combate no lo ofrece)'
    );
  if (c.conditions.includes('Asustado'))
    await paso(ctx, 'quitar Asustado a mano', pg => estado(pg, 'Asustado', false));

  // Astucia mágica: 1 minuto de ritual, recupera la mitad de los espacios de pacto (redondeando hacia arriba)
  c = await ficha(page);
  const usados = c.pact.used;
  await paso(ctx, 'Astucia mágica', async pg => {
    await irA(pg, 'play');
    await b.act(pg, 'cunning');
  });
  c = await ficha(page);
  hecho('astucia');
  regla(
    'Astucia mágica',
    c.pact.used === Math.max(0, usados - 1),
    `espacios gastados ${usados} → ${c.pact.used} (recupera 1 de 2)`
  );
}

/* =====================================================================
   Escena 4 · Descanso largo y nivel 3 (Patrón Infernal)
   ===================================================================== */
async function escena4(ctx) {
  const { page } = ctx;
  ESC = 'E4 nivel 3';
  console.log(`\n— ${ESC}`);
  await paso(ctx, 'descanso largo', async pg => {
    await b.act(pg, 'rest-menu');
    await b.act(pg, 'long');
    await b.act(pg, 'long-done');
  });
  let c = await ficha(page);
  regla(
    'descanso largo',
    !c.concentration && c.pact.used === 0,
    `concentración «${c.concentration}», pacto ${c.pact.used}`
  );
  regla(
    'descanso largo',
    c.features.find(f => f.name === 'Astucia mágica').uses.used === 0,
    'Astucia mágica no se recupera'
  );

  const pg3 = dado(8);
  const vistos = await paso(ctx, `subir a nivel 3 (Infernal, PG tirando: ${pg3})`, pg =>
    subirNivel(pg, { sub: 'fiend', conjuros: ['misty-step'], pg: pg3 })
  );
  narra(`Asistente: ${vistos.join(' → ')}.`);
  c = await ficha(page);
  hecho('nivel3');
  regla('nivel 3', c.level === 3 && c.hp.max === 17 + pg3 + 2, `PG ${c.hp.max} (17 + ${pg3} + 2)`);
  regla('nivel 3', c.pact.total === 2 && c.pact.level === 2, `pacto ${c.pact.total}×N${c.pact.level} (2×N2)`);
  regla('nivel 3', c.subclassKey === 'fiend', `subclase ${c.subclassKey}`);
  const sp = n => c.spells.find(s => s.name === n);
  const fl = sp('Falsa vida');
  regla(
    'legado ctónico',
    fl && fl.src && fl.free,
    `Falsa vida del legado ctónico: ${JSON.stringify(fl && { src: fl.src, free: fl.free })}`
  );
  const inf = ['Manos ardientes', 'Orden imperiosa', 'Rayo abrasador', 'Sugestión'].filter(n => !sp(n));
  regla('Patrón Infernal', !inf.length, `faltan los conjuros siempre preparados: ${inf.join(', ')}`);
  regla(
    'Patrón Infernal',
    c.features.some(f => f.name === 'Bendición del oscuro'),
    'falta Bendición del oscuro'
  );
  const prep = c.spells.filter(s => +s.level > 0 && !s.src).length;
  regla('nivel 3', prep === 4, `${prep} conjuros preparados (4 a nivel 3)`);
}

/* =====================================================================
   Escena 5 · Nivel 3: bandidos (Falsa vida, Represión infernal con espacio de nivel 2, Bendición del oscuro)
   ===================================================================== */
async function escena5(ctx) {
  const { page } = ctx;
  ESC = 'E5 nivel 3 · bandidos';
  console.log(`\n— ${ESC}`);
  const b1 = enemigo('Bandido 1', 12, 11, 3, [1, 6, 1], 'cortante');
  const b2 = enemigo('Bandido 2', 12, 11, 3, [1, 6, 1], 'cortante');
  const b3 = enemigo('Bandido 3', 12, 11, 3, [1, 6, 1], 'cortante');
  let c, t, a;

  // Antes del combate: Falsa vida gratis (legado ctónico)
  const fl = tira(2, 4).suma;
  await paso(ctx, `Falsa vida gratis (2d4 = ${fl})`, async pg => {
    await irA(pg, 'play');
    const i = await idxSp(pg, 'Falsa vida');
    await b.act(pg, 'cast', { i });
    await b.act(pg, 'cast-with', { kind: 'free' }, '#modal');
    await b.escribir(pg, '#fl-r', fl);
    await b.act(pg, 'fl-ok');
  });
  c = await ficha(page);
  hecho('falsa-vida');
  regla(
    'Falsa vida',
    c.hp.temp === fl + 4 && c.pact.used === 0,
    `PG temporales ${c.hp.temp} (${fl} + 4), pacto ${c.pact.used}`
  );
  narra(`Falsa vida: ${c.hp.temp} PG temporales sin gastar espacio.`);

  await paso(ctx, 'empezar combate', async pg => {
    await irA(pg, 'combat');
    await b.act(pg, 'cb-start');
  });
  // Ronda 1: invocar el arma de pacto otra vez y atacar
  await paso(ctx, 'invocar arma de pacto', async pg => {
    await b.act(pg, 't-der', {}, '.trow:has-text("Invocar arma de pacto")');
    await b.elegir(pg, '#pact-w', 'w:longsword');
    await b.elegir(pg, '#pact-t', 'necrótico');
    await b.act(pg, 'pact-ok');
  });
  const ip = await idxAtk(page, 'a.pact');
  t = await paso(ctx, 'atacar con el arma de pacto', async pg => {
    await b.act(pg, 't-atk', { i: ip });
    return leerToasts(pg);
  });
  regla('arma de pacto (nivel 3)', tiene(t, /1d20 \+5/) && tiene(t, /1d8 \+ 3/), `ataque: ${t[0]}`);
  const bandidos = [b1, b2, b3],
    vivo = () => bandidos.find(x => x.pg > 0) || b3;
  let bendicion = false;
  /* Bendición del oscuro: PG temporales = CAR + nivel de brujo (3 + 3 = 6). La app no lo hace sola */
  async function bendicionOscuro(quien) {
    bendicion = true;
    hecho('bendicion');
    const toastBend = await leerToasts(page);
    if (!tiene(toastBend, /Bendición del oscuro/)) {
      pensar(
        'acordarse',
        'Bendición del oscuro: al caer un enemigo (por Zyo o a 10 pies de él) gana PG temporales (la app no lo recuerda)'
      );
      pensar('calcular', 'Bendición del oscuro: CAR (+3) + nivel de brujo (3) = 6 PG temporales');
    }
    const tAntes = (await ficha(page)).hp.temp;
    await paso(ctx, `Bendición del oscuro por ${quien}: 6 PG temporales a mano`, pg => vida(pg, 6, 'temp'));
    const c2 = await ficha(page);
    regla(
      'PG temporales',
      c2.hp.temp === Math.max(6, tAntes),
      `temporales ${tAntes} → ${c2.hp.temp} (no se suman: el mayor)`
    );
    narra(`Bendición del oscuro: PG temporales ${tAntes} → ${c2.hp.temp}.`);
  }
  async function dano(obj, n, como) {
    const antes = obj.pg;
    obj.pg -= n;
    narra(`${como}: ${n} de daño a ${obj.n} (${Math.max(0, obj.pg)} PG).`);
    if (antes > 0 && obj.pg <= 0) {
      narra(`${obj.n} cae.`);
      await bendicionOscuro(obj.n);
    }
  }
  a = ataqueZyo(5, vivo().ca);
  if (a.impacta) await dano(vivo(), tira(a.crit ? 2 : 1, 8).suma + 3, `Espada de pacto (${a.total})`);
  else narra(`Espada de pacto: ${a.total}, falla.`);
  await paso(ctx, 'terminar turno (ronda 1)', pg => b.act(pg, 't-end'));

  // Turno de los bandidos: el daño se lo comen los PG temporales; Represión infernal con espacio de nivel 2
  const atq = vivo();
  let r = { dmg: 0 };
  for (let i = 0; i < 6 && !r.dmg; i++) r = ataqueEnemigo(atq, 13);
  if (!r.dmg) r = { dmg: 4 };
  const antes = await ficha(page);
  await paso(ctx, `${atq.n} le hace ${r.dmg} cortante`, pg => vida(pg, r.dmg, 'dmg'));
  c = await ficha(page);
  const absorbe = Math.min(antes.hp.temp, r.dmg);
  regla(
    'PG temporales',
    c.hp.temp === antes.hp.temp - absorbe && c.hp.current === antes.hp.current - (r.dmg - absorbe),
    `temporales ${antes.hp.temp} → ${c.hp.temp}, PG ${antes.hp.current} → ${c.hp.current}`
  );
  pensar(
    'acordarse',
    'Represión infernal: el bandido le ha dañado; la ventana de daño no recuerda la reacción'
  );
  t = await paso(ctx, 'Represión infernal con espacio de nivel 2', pg => lanzar(pg, 'Represión infernal'));
  regla(
    'Represión infernal (nivel 2)',
    tiene(t, /3d10/),
    `con espacio de nivel 2 debería decir 3d10: ${t.join(' | ')}`
  );
  const rb = tira(3, 10).suma,
    rbs = dado(20) + 1;
  await dano(
    atq,
    rbs >= 13 ? Math.floor(rb / 2) : rb,
    `Represión infernal (${rb} de fuego, salvación ${rbs})`
  );

  // Ronda 2: Maleficio (segundo espacio) + espada de pacto
  t = await paso(ctx, 'Maleficio con espacio de nivel 2 (ronda 2)', pg => lanzar(pg, 'Maleficio'));
  c = await ficha(page);
  const fxM = c.effects.find(e => e.name === 'Maleficio');
  regla(
    'Maleficio (nivel 2)',
    fxM && fxM.m === 240,
    `duración ${JSON.stringify(fxM)} (4 horas con espacio de nivel 2)`
  );
  regla(
    'un espacio por turno',
    !tiene(t, /Solo puedes gastar un espacio de conjuro por turno/),
    'avisa de «un solo espacio por turno» porque la Represión infernal del turno del enemigo cuenta como de este turno'
  );
  narra(`Maleficio sobre ${vivo().n} (Fuerza).`);
  t = await paso(ctx, 'espada de pacto con Maleficio', async pg => {
    await b.act(pg, 't-atk', { i: ip });
    return leerToasts(pg);
  });
  cuentaMaleficio('arma de pacto', t, true);
  a = ataqueZyo(5, vivo().ca);
  if (a.impacta)
    await dano(
      vivo(),
      tira(a.crit ? 2 : 1, 8).suma + 3 + tira(a.crit ? 2 : 1, 6).suma,
      `Espada de pacto con Maleficio (${a.total})`
    );
  else narra(`Espada de pacto: ${a.total}, falla.`);
  if (!bendicion) {
    const v = vivo();
    v.pg = 0;
    narra(`La clériga remata a ${v.n} a 10 pies de Zyo.`);
    await bendicionOscuro(`${v.n} (lo remata la clériga a 10 pies)`);
  }
  pensar(
    'buscar',
    'Maleficio: pasar la maldición a otro bandido con la acción adicional del turno siguiente (sin botón)'
  );
  await paso(ctx, 'terminar turno (ronda 2)', pg => b.act(pg, 't-end'));

  // Ronda 3: Estallido arcano al siguiente bandido
  t = await paso(ctx, 'Estallido arcano (ronda 3)', pg => lanzar(pg, 'Estallido arcano'));
  if (tiene(t, /1d10 \+3/)) CUENTA.estallidoApp++;
  else CUENTA.estallidoFuera++;
  cuentaMaleficio('Estallido arcano', t, true);
  a = ataqueZyo(5, vivo().ca);
  if (a.impacta)
    await dano(vivo(), tira(1, 10).suma + 3 + tira(1, 6).suma, `Estallido arcano con Maleficio (${a.total})`);
  else narra(`Estallido arcano: ${a.total}, falla.`);
  await paso(ctx, 'terminar turno (ronda 3)', pg => b.act(pg, 't-end'));
  // Ronda 4: Toque gélido (truco del legado)
  t = await paso(ctx, 'Toque gélido (ronda 4)', pg => lanzar(pg, 'Toque gélido'));
  regla(
    'Toque gélido',
    tiene(t, /1d10/) && tiene(t, /necrótico/),
    `no dice 1d10 necrótico: ${t.join(' | ')}`
  );
  if (!tiene(t, /recuperar/i))
    pensar(
      'buscar',
      'Toque gélido: el objetivo no puede recuperar PG hasta el final de tu siguiente turno (el aviso no lo dice)'
    );
  cuentaMaleficio('Toque gélido', t, true);
  narra(
    bandidos.some(x => x.pg > 0)
      ? 'Los bandidos que quedan se rinden.'
      : 'El jefe de los bandidos, al que Zyo ha tocado con Toque gélido, huye.'
  );
  await paso(ctx, 'terminar combate', async pg => {
    await b.act(pg, 'cb-end');
    await b.act(pg, 'cb-end-ok');
  });
  c = await ficha(page);
  regla(
    'Maleficio tras el combate',
    c.concentration === 'Maleficio',
    'Maleficio (4 h) debería seguir tras el combate'
  );
}

/* =====================================================================
   Escena 6 · Descanso corto con Maleficio activo y cosas fuera de combate
   ===================================================================== */
async function escena6(ctx) {
  const { page } = ctx;
  ESC = 'E6 fuera de combate';
  console.log(`\n— ${ESC}`);
  let c = await ficha(page);
  const fxAntes = c.effects.find(e => e.name === 'Maleficio');
  const antes = c.hp.current;
  const hd = dado(8);
  await paso(ctx, `descanso corto con Maleficio activo (dado ${hd})`, async pg => {
    await b.act(pg, 'rest-menu');
    await b.act(pg, 'short');
    if (antes < (await pg.evaluate(() => C().hp.max))) {
      await b.escribir(pg, '#hd-roll', hd);
      await b.act(pg, 'hd');
    }
    await b.act(pg, 'short-done');
  });
  c = await ficha(page);
  const fx = c.effects.find(e => e.name === 'Maleficio');
  regla(
    'descanso corto',
    fx && fxAntes && fx.m === fxAntes.m - 60 && c.concentration === 'Maleficio',
    `Maleficio ${JSON.stringify(fxAntes)} → ${JSON.stringify(fx)} (debería seguir con 1 h menos)`
  );
  regla('descanso corto', c.pact.used === 0, 'no recupera los espacios de pacto');

  // Detectar magia como ritual
  const t = await paso(ctx, 'Detectar magia como ritual', async pg => {
    await irA(pg, 'play');
    await b.act(pg, 'cast', { i: await idxSp(pg, 'Detectar magia') });
    await b.act(pg, 'cast-with', { kind: 'ritual' }, '#modal');
    return leerToasts(pg);
  });
  c = await ficha(page);
  regla('ritual', c.pact.used === 0, 'el ritual ha gastado un espacio');
  regla(
    'ritual',
    c.concentration === 'Detectar magia',
    `Detectar magia es de concentración: «${c.concentration}»`
  );
  if (tiene(t, /Dejas de concentrarte en Maleficio/))
    narra('Detectar magia acaba con Maleficio (concentración): la app lo avisa.');

  // Taumaturgia y una prueba de Sigilo (Mendigo)
  const sk = await page.evaluate(() => ({ sig: skillB(C(), SK.stealth), man: skillB(C(), SK.sleight) }));
  regla(
    'Mendigo',
    sk.sig === 4 && sk.man === 4,
    `Sigilo ${sk.sig}, Juego de manos ${sk.man} (DES 2 + competencia 2)`
  );
  c = await ficha(page);
  regla('Mendigo', /disfraz/i.test(c.proficiencies.tools), `herramienta: ${c.proficiencies.tools}`);
  const dote = c.features.find(f => f.name === 'Dote Superviviente');
  if (dote && /pone Albert|provisional|casera/i.test(dote.text))
    pensar(
      'acordarse',
      'Dote Superviviente: la ficha de prueba no tiene su texto, así que el jugador tiene que recordar qué hace'
    );

  /* Pelea de taberna fuera de combate: Represión infernal desde Combate, y la reacción gastada (ver n.º 101) */
  await paso(ctx, 'fuera de combate: un borracho le hace 2 de daño', pg => vida(pg, 2, 'dmg'));
  await paso(ctx, 'Represión infernal fuera de combate', pg => lanzar(pg, 'Represión infernal'));
  c = await ficha(page);
  const rFuera = c.turn.r;
  narra(
    `Represión infernal en la taberna, sin iniciar combate: reacción ${rFuera ? 'marcada como gastada' : 'libre'}.`
  );
  await paso(ctx, 'descanso largo tras la taberna', async pg => {
    await b.act(pg, 'rest-menu');
    await b.act(pg, 'long');
    await b.act(pg, 'long-done');
  });
  c = await ficha(page);
  if (rFuera && c.turn.r) {
    const pill = await (async () => {
      await irA(page, 'combat');
      return texto(page, '.pills');
    })();
    narra(`Tras el descanso largo, la reacción sigue gastada: «${pill}».`);
    pensar(
      'acordarse',
      'Tras usar una reacción fuera de combate, liberarla a mano con ↺ (ni el descanso largo la devuelve, n.º 101)'
    );
    regla(
      'reacción fuera de combate',
      false,
      'la reacción gastada fuera de combate (Represión infernal) sigue gastada tras un descanso largo (n.º 101)'
    );
  }
}

(async () => {
  const ctx = await b.abrir();
  console.log(`Partida simulada de Zyo (semilla ${SEMILLA})`);
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
  for (const k of ['estallido', 'maleficio', 'necro']) {
    const n = {
      estallido: 'Daño de Estallido arcano',
      maleficio: '+1d6 de Maleficio',
      necro: 'Resistencia necrótica',
    }[k];
    if (CUENTA[k + 'App'])
      b.sola(`${n}: la app lo dice ${CUENTA[k + 'App']} de ${CUENTA[k + 'App'] + CUENTA[k + 'Fuera']} veces`);
    if (CUENTA[k + 'Fuera']) b.noSola(`${n}: buscado fuera de la app ${CUENTA[k + 'Fuera']} veces`);
  }
  b.sola(
    'Espacios de pacto, concentración, duración de Maleficio según el espacio, reacción que vuelve en tu turno'
  );
  b.sola(
    'Arma de pacto con CAR, ataque de oportunidad con el arma de pacto, desventaja por Derribado y Asustado'
  );
  b.sola('Salvaciones contra muerte, caer inconsciente, PG temporales que no se suman, Falsa vida gratis');
  const grupos = {};
  PIENSA.forEach(p => (grupos[p.que] = grupos[p.que] || { ...p, n: 0 }).n++);
  for (const p of Object.values(grupos)) b.noSola(`(${p.tipo}${p.n > 1 ? ` ×${p.n}` : ''}) ${p.que}`);
  console.log(`\nDiario de la partida:\n${DIARIO.map(x => '  ' + x).join('\n')}`);
  console.log(
    `\nVeces que el jugador piensa fuera de la app: ${PIENSA.length} (${Object.keys(grupos).length} distintas)`
  );
  console.log(
    `Estallido arcano: la app ${CUENTA.estallidoApp}, fuera ${CUENTA.estallidoFuera} · Maleficio: la app ${CUENTA.maleficioApp}, fuera ${CUENTA.maleficioFuera} · Necrótico: la app ${CUENTA.necroApp}, fuera ${CUENTA.necroFuera}`
  );
  console.log(`Reglas comprobadas: ${REGLAS.ok + REGLAS.mal} (${REGLAS.mal} mal)`);
  const faltan = Object.keys(MOMENTOS).filter(k => !HECHO.has(k));
  console.log(
    faltan.length
      ? `Momentos que no han salido con esta semilla: ${faltan.map(k => MOMENTOS[k]).join('; ')}`
      : 'Han salido todos los momentos de la partida.'
  );
  process.exitCode = b.informe('Partida simulada: Zyo, niveles 1 a 3');
})();
