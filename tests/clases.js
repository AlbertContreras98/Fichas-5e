/* Prueba 2a: crea cada clase y subclase con el asistente, la sube del nivel 1 al 20 y comprueba las cuentas en cada nivel. */
'use strict';

/* Uso: node tests/clases.js [filtro] [--hilos=N]
   filtro: «wizard» (una clase) o «wizard/evoker» (una subclase). Sin filtro, todas. */

const b = require('./base');

const ARG = process.argv.slice(2);
const FILTRO = ARG.find(a => !a.startsWith('--')) || '';
const HILOS = +(ARG.find(a => a.startsWith('--hilos=')) || '').slice(8) || 4;

/* ---------- Tablas del Manual del Jugador de 2024, escritas aparte de la app ---------- */

const rep = pares => {
  const a = [];
  let lv = 1;
  for (const [v, hasta] of pares) while (lv <= hasta) (a.push(v), lv++);
  return a;
};
const mod = n => Math.floor((n - 10) / 2);

/* Dado de golpe y niveles con Mejora de característica */
const HD = {
  barbarian: 12,
  bard: 8,
  cleric: 8,
  druid: 8,
  fighter: 10,
  monk: 8,
  paladin: 10,
  ranger: 10,
  rogue: 8,
  sorcerer: 6,
  warlock: 8,
  wizard: 6,
};
const ASI = k =>
  k === 'fighter' ? [4, 6, 8, 12, 14, 16, 19] : k === 'rogue' ? [4, 8, 10, 12, 16, 19] : [4, 8, 12, 16, 19];

/* Trucos y conjuros preparados por nivel */
const PREP_COMUN = [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22];
const PREP_MEDIO = [2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15];
const PREP_TERCIO = [0, 0, 3, 4, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 11, 11, 12, 13];
const TABLAS = {
  bard: {
    c: rep([
      [2, 3],
      [3, 9],
      [4, 20],
    ]),
    p: PREP_COMUN,
  },
  cleric: {
    c: rep([
      [3, 3],
      [4, 9],
      [5, 20],
    ]),
    p: PREP_COMUN,
  },
  druid: {
    c: rep([
      [2, 3],
      [3, 9],
      [4, 20],
    ]),
    p: PREP_COMUN,
  },
  sorcerer: {
    c: rep([
      [4, 3],
      [5, 9],
      [6, 20],
    ]),
    p: [2, 4, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  },
  wizard: {
    c: rep([
      [3, 3],
      [4, 9],
      [5, 20],
    ]),
    p: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 18, 19, 21, 22, 23, 24, 25],
  },
  warlock: {
    c: rep([
      [2, 3],
      [3, 9],
      [4, 20],
    ]),
    p: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
  },
  paladin: { c: null, p: PREP_MEDIO },
  ranger: { c: null, p: PREP_MEDIO },
  'fighter/eldritch': {
    c: rep([
      [0, 2],
      [2, 9],
      [3, 20],
    ]),
    p: PREP_TERCIO,
  },
  /* Embaucador arcano: Mano de mago y dos trucos más (la app puede contar Mano de mago aparte) */
  'rogue/arcanetrickster': {
    c: rep([
      [0, 2],
      [2, 9],
      [3, 20],
    ]),
    p: PREP_TERCIO,
    cAlt: rep([
      [0, 2],
      [3, 9],
      [4, 20],
    ]),
  },
};
/* Usos de los recursos más conocidos, por nivel (0 = todavía no lo tiene). c = ficha */
const desde =
  (n, v = 1) =>
  L =>
    L >= n ? v : 0;
const USOS = {
  barbarian: {
    Furia: L =>
      rep([
        [2, 2],
        [3, 5],
        [4, 11],
        [5, 16],
        [6, 20],
      ])[L - 1],
  },
  bard: { 'Inspiración bárdica': (L, c) => Math.max(1, mod(c.abilities.cha)) },
  cleric: {
    'Canalizar divinidad': L => (L < 2 ? 0 : L < 6 ? 2 : L < 18 ? 3 : 4),
    'Intervención divina': desde(10),
  },
  druid: { 'Forma salvaje': L => (L < 2 ? 0 : L < 6 ? 2 : L < 17 ? 3 : 4) },
  fighter: {
    'Tomar aliento': L => (L < 4 ? 2 : L < 10 ? 3 : 4),
    'Oleada de acción': L => (L < 2 ? 0 : L < 17 ? 1 : 2),
    Indómito: L => (L < 9 ? 0 : L < 13 ? 1 : L < 17 ? 2 : 3),
  },
  monk: { 'Puntos de concentración': L => (L < 2 ? 0 : L), 'Metabolismo asombroso': desde(2) },
  paladin: {
    'Imposición de manos (PG)': L => 5 * L,
    'Canalizar divinidad': L => (L < 3 ? 0 : L < 11 ? 2 : 3),
    'Castigo del paladín gratis': desde(2),
    'Corcel fiel': desde(5),
  },
  ranger: {
    'Marca del cazador gratis': L => (L < 5 ? 2 : L < 9 ? 3 : L < 13 ? 4 : L < 17 ? 5 : 6),
    'Incansable (PG temporales)': (L, c) => (L < 10 ? 0 : Math.max(1, mod(c.abilities.wis))),
  },
  rogue: { 'Golpe de suerte': desde(20) },
  sorcerer: {
    'Puntos de hechicería': L => (L < 2 ? 0 : L),
    'Hechicería innata': () => 2,
    'Restauración hechicera': desde(5),
  },
  warlock: { 'Astucia mágica': desde(2), 'Contactar con el patrón': desde(9) },
  wizard: { 'Recuperación arcana': () => 1 },
  'fighter/battlemaster': { 'Dados de superioridad': L => (L < 3 ? 0 : L < 7 ? 4 : L < 15 ? 5 : 6) },
  'fighter/psiwarrior': {
    'Dados de energía psiónica': L => (L < 3 ? 0 : L < 5 ? 4 : L < 9 ? 6 : L < 13 ? 8 : L < 17 ? 10 : 12),
  },
  'rogue/soulknife': {
    'Dados de energía psiónica': L => (L < 3 ? 0 : L < 5 ? 4 : L < 9 ? 6 : L < 13 ? 8 : L < 17 ? 10 : 12),
  },
  'wizard/diviner': { Portento: L => (L < 3 ? 0 : L < 14 ? 2 : 3) },
  'warlock/celestial': { 'Luz sanadora (d6)': L => (L < 3 ? 0 : 1 + L) },
  'sorcerer/wildmagic': { 'Mareas del caos': desde(3) },
};

/* Puntuaciones (15, 14, 13, 12, 10, 8) repartidas según la clase: la primera característica recibe el 15, etc. */
const ORDEN_CAR = {
  barbarian: ['str', 'con', 'dex', 'wis', 'cha', 'int'],
  bard: ['cha', 'dex', 'con', 'wis', 'int', 'str'],
  cleric: ['wis', 'con', 'str', 'cha', 'dex', 'int'],
  druid: ['wis', 'con', 'dex', 'int', 'cha', 'str'],
  fighter: ['str', 'con', 'int', 'dex', 'wis', 'cha'],
  monk: ['dex', 'wis', 'con', 'str', 'int', 'cha'],
  paladin: ['str', 'cha', 'con', 'wis', 'dex', 'int'],
  ranger: ['dex', 'wis', 'con', 'str', 'int', 'cha'],
  rogue: ['dex', 'int', 'con', 'cha', 'wis', 'str'],
  sorcerer: ['cha', 'con', 'dex', 'wis', 'int', 'str'],
  warlock: ['cha', 'con', 'dex', 'wis', 'int', 'str'],
  wizard: ['int', 'con', 'dex', 'wis', 'cha', 'str'],
};
const BASE = [15, 14, 13, 12, 10, 8];

/* ---------- Informe propio ---------- */

const R = {
  hechas: 0,
  niveles: 0,
  rotas: [],
  conRetro: [],
  pgMal: [],
  usosMal: new Set(),
  tablasMal: [],
  limites: new Set(),
  dotes: new Set(),
  especies: new Set(),
  trasfondos: new Set(),
  invoc: new Set(),
  notas: new Set(),
};

/* ---------- Ayudas del asistente ---------- */

const pasoActual = page => page.evaluate(() => (W ? wizSteps()[W.step][0] : null));
const radioN = async (page, name, n) => {
  const l = page.locator(`input[name="${name}"]`);
  const t = await l.count();
  if (!t) throw new Error(`no hay opciones «${name}»`);
  await l.nth(n % t).check({ force: true });
};
/* Opciones elegibles de un <select> */
const opciones = (page, sel) =>
  page.$eval(sel, e => [...e.options].filter(o => o.value && !o.disabled).map(o => o.value));

/* Completa los desplegables de una dote (característica, habilidades, conjuros…) con la primera opción libre */
async function rellenarDote(page) {
  /* La opción que se escribe a mano (el arma de Maestro de armas) */
  const txt = page.locator('#modal #fs-opt');
  if ((await txt.count()) && !(await txt.inputValue())) await txt.fill('Espada larga');
  for (let v = 0; v < 30; v++) {
    const sel = await page.evaluate(() => {
      const m = document.getElementById('modal');
      for (const e of m.querySelectorAll('select[data-fs]:not([data-fs="k"])')) {
        if (e.value) continue;
        if (![...e.options].some(o => o.value && !o.disabled)) continue;
        const d = e.dataset;
        return (
          `select[data-fs="${d.fs}"]` +
          (d.g !== undefined ? `[data-g="${d.g}"]` : '') +
          (d.i !== undefined ? `[data-i="${d.i}"]` : '')
        );
      }
      return '';
    });
    if (!sel) return;
    await b.elegir(page, sel, (await opciones(page, sel))[0]);
  }
}
/* Elige una dote del desplegable (la n-ésima de las que se pueden coger) y completa sus opciones */
async function elegirDote(page, n) {
  const ops = (await opciones(page, 'select[data-fs="k"]')).filter(k => k !== '_custom' && k !== '_none');
  if (!ops.length) throw new Error('no hay ninguna dote que se pueda elegir');
  const k = ops[n % ops.length];
  await b.elegir(page, 'select[data-fs="k"]', k);
  await rellenarDote(page);
  R.dotes.add(k);
  return k;
}

/* Paso «Conjuros»: añade trucos y conjuros de la lista de la clase hasta llenar los límites */
async function conjuros(page) {
  const d = await page.evaluate(() => {
    const l = wizSpellLimits(),
      have = new Set(W.spells.map(s => s.ref)),
      cand = SP.filter(s => s.c.includes(l.ca.list) && !have.has(s.id));
    return {
      nc: l.can - l.cur.c,
      np: l.prep - l.cur.p,
      trucos: cand.filter(s => +s.l === 0).map(s => [s.id, s.en]),
      conj: cand
        .filter(s => +s.l > 0 && +s.l <= l.max)
        .sort((x, y) => y.l - x.l)
        .map(s => [s.id, s.en]),
    };
  });
  const poner = async ([id, en]) => {
    await b.escribir(page, '#sp-q', en);
    await b.act(page, 'sp-tog', { id });
  };
  for (const s of d.trucos.slice(0, Math.max(0, d.nc))) await poner(s);
  for (const s of d.conj.slice(0, Math.max(0, d.np))) await poner(s);
}

/* Paso «Invocaciones»: elige hasta completar las que tocan */
async function invocaciones(page, n) {
  const no = [];
  for (let v = 0; v < 20; v++) {
    const falta = await page.evaluate(() => ivMax(wizIv().L) - wizIv().list.length);
    if (falta <= 0) break;
    const ids = (
      await page.$$eval('[data-act="iv-add"]:not([disabled])', l => l.map(e => e.dataset.id))
    ).filter(id => !no.includes(id));
    if (!ids.length) throw new Error('faltan invocaciones por elegir y no se puede coger ninguna');
    const id = ids[(n + v) % ids.length];
    await b.act(page, 'iv-add', { id });
    /* Si pide elegir un truco o una dote, la primera opción; si no queda ninguna, se quita y se prueba otra */
    const i = await page.evaluate(() => wizIv().list.length - 1);
    const sel = `select[data-iv-pick="${i}"]`;
    if (await page.locator(sel).count()) {
      const ops = await opciones(page, sel);
      if (!ops.length) {
        R.notas.add(
          `Invocación «${id}»: el botón «Elegir» está activo aunque no queda ningún truco que elegir`
        );
        await b.act(page, 'iv-del', { i });
        no.push(id);
        continue;
      }
      await b.elegir(page, sel, ops[0]);
    }
    R.invoc.add(id);
  }
}
/* Tras confirmar, «Lecciones de los Primeros» pregunta las opciones de su dote */
async function trasConfirmar(page) {
  await page.waitForFunction(() => !W);
  for (let v = 0; v < 6; v++) {
    const hay = await page.locator('[data-act="iv-feat-ok"]').filter({ visible: true }).count();
    if (!hay) break;
    await rellenarDote(page);
    await b.act(page, 'iv-feat-ok');
  }
  await b.cerrarToasts(page);
}

async function siguiente(page, st) {
  const ok = await page.locator('[data-act="wz-next"]').isEnabled();
  if (!ok) {
    const h = await page.locator('.wz-foot .hint').textContent();
    /* El motivo exacto, para saber si es cosa del guion o de la app */
    const por = await page.evaluate(s => {
      if (s === 'invoc')
        return ivProblems(wizIv()).join(' ') || `lleva ${wizIv().list.length} de ${ivMax(wizIv().L)}`;
      if (s === 'asi' && W.asi.mode === 'feat') return `${W.asi.fs.k}: ${ftMissing(W.asi.fs, wizFtCtx())}`;
      if (s === 'style') return `${W.style && W.style.k}: ${W.style ? ftMissing(W.style, wizFtCtx()) : ''}`;
      return '';
    }, st);
    throw new Error(`paso «${st}» sin completar: ${h}${por ? ` [${por}]` : ''}`);
  }
  await b.act(page, 'wz-next');
}

/* Pasos que salen igual al crear y al subir de nivel */
async function pasoComun(page, st, r, L) {
  const n = r.n + L;
  if (st === 'style') await elegirDote(page, n);
  else if (st === 'order') await radioN(page, 'wz-order', n);
  else if (st === 'expert') {
    const k = await page.evaluate(() => Math.min(wizExpN(), wizExpOpts().length));
    for (let i = 0; i < k; i++) await page.locator('[data-act="wz-exp"]:not(.on)').first().click();
  } else if (st === 'spells') await conjuros(page);
  else if (st === 'invoc') await invocaciones(page, n);
  else if (st.startsWith('ofeat:')) await rellenarDote(page);
  else return false;
  return true;
}

/* Crea el personaje de la tanda r con el asistente */
async function crear(page, r) {
  await b.act(page, 'create');
  for (let v = 0; v < 30; v++) {
    const st = await pasoActual(page);
    if (!st) throw new Error('el asistente se ha cerrado antes de tiempo');
    if (st === 'basics') {
      await b.escribir(page, '#wz-name', r.id);
      await b.radio(page, 'wz-cls', r.clase);
    } else if (st === 'species') {
      await b.radio(page, 'wz-spec', r.especie);
      if (r.linaje) await b.radio(page, 'wz-lin', r.linaje);
      else if (await page.locator('input[name="wz-lin"]').count()) await radioN(page, 'wz-lin', r.n);
    } else if (st === 'background') {
      await b.elegir(page, '#wz-bg', r.trasfondo);
      if (r.n % 3 === 2) await b.radio(page, 'wz-bgmode', '111');
      else {
        const ab = await page.evaluate(() => wizBg().ab);
        /* +2 y +1 a las dos características del trasfondo que más le importan a la clase */
        const pref = ORDEN_CAR[r.clase].filter(k => ab.includes(k));
        await b.elegir(page, '#wz-bg2', pref[0]);
        await b.elegir(page, '#wz-bg1', pref[1]);
      }
      if (r.especie === 'human') {
        const ops = await opciones(page, '#wz-hfeat');
        await b.elegir(page, '#wz-hfeat', ops[r.n % ops.length]);
      }
    } else if (st === 'abil') {
      for (const [i, k] of ORDEN_CAR[r.clase].entries()) await b.escribir(page, `#wz-ab-${k}`, BASE[i]);
    } else if (st === 'skills') {
      const ks = await page.evaluate(n => {
        const def = wizDef(),
          bgs = bgSkills(),
          sp = specOf(W.speciesKey),
          from = sp && sp.extraSkill && sp.extraSkill.from,
          out = [],
          libre = k => !bgs.includes(k) && !out.includes(k) && !W.skills.includes(k);
        const cls = def.skills.from.filter(libre),
          ini = cls.length ? n % cls.length : 0;
        out.push(...[...cls.slice(ini), ...cls.slice(0, ini)].slice(0, def.skills.n));
        let ex = extraSkills();
        if (from && ex) {
          out.push(from.find(libre));
          ex--;
        }
        out.push(
          ...SKILLS.map(x => x[0])
            .filter(libre)
            .slice(0, ex)
        );
        return out;
      }, r.n);
      for (const k of ks) await b.act(page, 'wz-skill', { k });
    } else if (st === 'confirm') {
      await b.act(page, 'wz-apply');
      await trasConfirmar(page);
      return;
    } else await pasoComun(page, st, r, 1);
    await siguiente(page, st);
  }
  throw new Error('el asistente de creación no termina');
}

/* Lo que se elige en la mejora de característica de cada nivel */
async function mejora(page, r, L) {
  const i = ASI(r.clase).indexOf(L);
  const ab = await page.evaluate(() => Object.assign({}, W.ab));
  const ord = ORDEN_CAR[r.clase];
  if (i === 0 && ab.con <= 18) {
    /* +2 a CON: sirve para ver si los PG de los niveles anteriores suben */
    await b.radio(page, 'wz-asi', '2');
    await b.elegir(page, '#wz-asi-a', 'con');
    return;
  }
  if (i === 2) {
    const dos = ord.filter(k => ab[k] < 20).slice(0, 2);
    if (dos.length === 2) {
      await b.radio(page, 'wz-asi', '11');
      await b.elegir(page, '#wz-asi-a', dos[0]);
      await b.elegir(page, '#wz-asi-b', dos[1]);
      return;
    }
  }
  await b.radio(page, 'wz-asi', 'feat');
  await elegirDote(page, r.n * 5 + i * 11);
}

/* PG que se ganan al subir a L sin contar CON: valor fijo o dado (resultado inventado, siempre el mismo) */
function dadoPG(r, L) {
  const hd = HD[r.clase];
  if ((r.n + L) % 3) return { modo: 'avg', v: hd / 2 + 1 };
  return { modo: 'roll', v: 1 + ((r.n * 7 + L * 3) % hd) };
}

/* Sube un nivel con el asistente */
async function subir(page, r, L) {
  await b.act(page, 'settings');
  await b.act(page, 'levelup');
  for (let v = 0; v < 20; v++) {
    const st = await pasoActual(page);
    if (!st) throw new Error('el asistente se ha cerrado antes de tiempo');
    if (st === 'hp') {
      const d = dadoPG(r, L);
      if (d.modo === 'roll') {
        await b.radio(page, 'wz-hp', 'roll');
        await b.escribir(page, '#wz-hproll', d.v);
      }
    } else if (st === 'sub') await b.radio(page, 'wz-sub', r.sub);
    else if (st === 'lineage') await radioN(page, 'wz-lin', r.n);
    else if (st === 'asi') await mejora(page, r, L);
    else if (st === 'confirm') {
      await b.act(page, 'wz-apply');
      await trasConfirmar(page);
      return;
    } else if (st !== 'summary') await pasoComun(page, st, r, L);
    await siguiente(page, st);
  }
  throw new Error('el asistente de subir de nivel no termina');
}

/* Gasta casillas (espacios, magia de pacto y usos) para ver que al subir de nivel lo gastado no pasa del máximo */
async function gastar(page) {
  for (let i = 0; i < 40; i++) {
    const loc = page.locator('[data-act="pip"].full').filter({ visible: true }).first();
    if (!(await loc.count())) break;
    await loc.click();
  }
  await b.cerrarToasts(page);
}

/* ---------- Comprobaciones de cada nivel ---------- */

/* PG máximos, usos y límites de conjuros */
async function reglasNivel(page, r, donde, hist) {
  const { c, extra, lim } = await page.evaluate(() => {
    const c = JSON.parse(JSON.stringify(C()));
    const fk = c.featKeys || [];
    const ca = casterOf(defOf(c), subOf(c));
    return {
      c,
      extra: {
        especie: ((SPEC[c.speciesKey] && SPEC[c.speciesKey].hpPerLevel) || 0) * c.level,
        dotes: fk.reduce((t, k) => t + (FEATS[k].hp || 0) + (FEATS[k].hpPerLevel || 0) * c.level, 0),
      },
      lim: ca
        ? {
            can: (ca.cantrips ? ca.cantrips[c.level - 1] : 0) + (+c.cantripPlus || 0),
            prep: ca.prepared ? ca.prepared[c.level - 1] : 0,
            c: c.spells.filter(s => !s.src && +s.level === 0).length,
            p: c.spells.filter(s => !s.src && +s.level > 0).length,
            mx: Math.max(0, ...c.spells.filter(s => !s.src).map(s => +s.level)),
            tope: maxSpellLevel(ca.type, c.level),
          }
        : null,
    };
  });
  const L = c.level;
  /* PG máximos: según las reglas (CON de ahora × nivel) y según la CON que había al subir cada nivel */
  const dados = hist.reduce((t, h) => t + h.v, 0);
  const otros = extra.especie + extra.dotes + (c.subclassKey === 'draconic' ? L : 0);
  const reglas = dados + mod(c.abilities.con) * L + otros;
  const sinRetro = hist.reduce((t, h) => t + Math.max(1, h.v + h.con), 0) + otros;
  if (c.hp.max !== reglas) {
    if (c.hp.max === sinRetro) R.conRetro.push({ id: r.id, L, app: c.hp.max, reglas, con: c.abilities.con });
    else {
      R.pgMal.push(`${donde}: PG máx. ${c.hp.max}; según las reglas ${reglas}; nivel a nivel ${sinRetro}`);
      b.fallo(donde, `PG máximos ${c.hp.max} (reglas ${reglas}, sumando nivel a nivel ${sinRetro})`);
    }
  }
  if (c.hp.current !== c.hp.max)
    b.fallo(donde, `PG actuales ${c.hp.current} ≠ máximos ${c.hp.max} sin haber recibido daño`);
  if (c.hitDice.die !== 'd' + HD[r.clase]) b.fallo(donde, `Dado de golpe ${c.hitDice.die} (d${HD[r.clase]})`);
  /* Usos de los recursos conocidos */
  const tabla = Object.assign({}, USOS[r.clase], L >= 3 ? USOS[r.id] : null);
  for (const [n, f] of Object.entries(tabla)) {
    const want = f(L, c) || 0;
    const ft = c.features.find(x => x.name === n);
    const got = ft ? +ft.uses.max || 0 : 0;
    if (got !== want) {
      const k = `${r.clase}${USOS[r.clase] && USOS[r.clase][n] ? '' : '/' + r.sub} · «${n}»: ${got} usos a nivel ${L} (deberían ser ${want})`;
      if (!R.usosMal.has(k)) b.fallo(donde, `usos de «${n}»: ${got} (deberían ser ${want})`);
      R.usosMal.add(k);
    }
  }
  /* Conjuros elegidos dentro de los límites */
  if (lim) {
    if (lim.c > lim.can) b.fallo(donde, `${lim.c} trucos y el límite es ${lim.can}`);
    if (lim.p > lim.prep) b.fallo(donde, `${lim.p} conjuros preparados y el límite es ${lim.prep}`);
    if (lim.mx > lim.tope) b.fallo(donde, `conjuro de nivel ${lim.mx} y el máximo es ${lim.tope}`);
    if (process.env.VER && (lim.c < lim.can || lim.p < lim.prep))
      console.log(
        donde,
        JSON.stringify(c.spells.map(x => [x.name, x.level, x.src || ''])),
        JSON.stringify(c.featData || [])
      );
    if (lim.c < lim.can)
      R.limites.add(
        `${r.id}: ${lim.c} trucos de ${lim.can} a nivel ${L} (alguno de los elegidos lo da ya la especie, la subclase o una dote, y deja de contar)`
      );
    if (lim.p < lim.prep)
      R.limites.add(
        `${r.id}: ${lim.p} conjuros de ${lim.prep} a nivel ${L} (alguno de los elegidos lo da ya la especie, la subclase o una dote, y deja de contar)`
      );
  }
  /* Rasgos repetidos o sin nombre */
  const nombres = c.features.map(f => f.name);
  nombres.forEach((n, i) => {
    if (!n || !String(n).trim()) b.fallo(donde, 'hay un rasgo sin nombre');
    else if (nombres.indexOf(n) !== i) R.notas.add(`${r.id}: rasgo repetido «${n}» (nivel ${L})`);
  });
  if (L >= 3 && c.subclassKey !== r.sub) b.fallo(donde, `subclase «${c.subclassKey}» (debería ser ${r.sub})`);
  for (const k of ['str', 'dex', 'con', 'int', 'wis', 'cha'])
    if (!(c.abilities[k] >= 1 && c.abilities[k] <= 30))
      b.fallo(donde, `característica ${k} = ${c.abilities[k]}`);
  return c;
}

/* Compara las tablas de la app (dado de golpe, mejoras, trucos y preparados) con las del manual */
async function tablas(page) {
  const app = await page.evaluate(() =>
    Object.fromEntries(
      Object.entries(CL).map(([k, d]) => [
        k,
        {
          hd: d.hd,
          asi: d.asi,
          c: d.cantrips || null,
          p: d.prepared || null,
          subs: Object.fromEntries(
            Object.entries(d.subs).map(([s, x]) => [s, x.cast ? { c: x.cantrips, p: x.prepared } : null])
          ),
        },
      ])
    )
  );
  const dif = (que, a, m, alt) => {
    if (!m) return;
    const A = JSON.stringify((a || []).map(x => x || 0)),
      ok = [m, alt].filter(Boolean).some(t => JSON.stringify(t) === A);
    if (!ok) {
      const lv = m.map((x, i) => ((a || [])[i] || 0) !== x && i + 1).filter(Boolean);
      R.tablasMal.push(
        `${que}: distinta del manual en los niveles ${lv.join(', ')} (app ${A}, manual ${JSON.stringify(m)})`
      );
    }
  };
  for (const [k, d] of Object.entries(app)) {
    if (d.hd !== HD[k]) R.tablasMal.push(`${k}: dado de golpe d${d.hd} (d${HD[k]})`);
    if (JSON.stringify(d.asi) !== JSON.stringify(ASI(k))) R.tablasMal.push(`${k}: mejoras en ${d.asi}`);
    if (TABLAS[k]) {
      dif(`${k} · trucos`, d.c, TABLAS[k].c);
      dif(`${k} · conjuros preparados`, d.p, TABLAS[k].p);
    }
    for (const [s, x] of Object.entries(d.subs)) {
      const t = TABLAS[`${k}/${s}`];
      if (x && t) {
        dif(`${k}/${s} · trucos`, x.c, t.c, t.cAlt);
        dif(`${k}/${s} · conjuros preparados`, x.p, t.p);
      } else if (x && !t) R.tablasMal.push(`${k}/${s}: lanza conjuros y el guion no tiene su tabla`);
    }
  }
  for (const t of R.tablasMal) b.fallo('tablas', t);
}

/* ---------- Una tanda: una subclase del 1 al 20 ---------- */

async function tanda(ctx, r) {
  const { page } = ctx;
  await b.limpiar(page);
  ctx.errores.length = 0;
  const hist = [];
  const t0 = Date.now();
  try {
    await crear(page, r);
    let c = await b.ficha(page);
    hist.push({ v: HD[r.clase], con: mod(c.abilities.con) });
    await b.comprobar(ctx, `${r.id} 1`);
    await reglasNivel(page, r, `${r.id} 1`, hist);
    R.niveles++;
    for (let L = 2; L <= 20; L++) {
      const donde = `${r.id} ${L}`;
      /* De vez en cuando se gasta todo antes de subir */
      if ([5, 11, 17].includes(L)) await gastar(page);
      c = await b.ficha(page);
      const con = mod(c.abilities.con);
      const pgAntes = { cur: c.hp.current, max: c.hp.max };
      /* b.paso sube el nivel, lo deshace, lo vuelve a subir y pasa las comprobaciones de base.js */
      const hecho = await b.paso(ctx, donde, p => subir(p, r, L), { recarga: false });
      if (!hecho) throw new Error(b.INF.fallos[b.INF.fallos.length - 1]);
      if ([5, 11, 17, 20].includes(L)) {
        for (const d of await b.recargar(page)) b.fallo(donde, `al recargar cambia ${d}`);
        for (const e of ctx.errores.splice(0)) b.fallo(donde, `consola tras recargar: ${e.slice(0, 300)}`);
      }
      hist.push({ v: dadoPG(r, L).v, con });
      c = await b.ficha(page);
      if (c.level !== L) throw new Error(`tras subir, el nivel es ${c.level} y no ${L}`);
      /* Los PG actuales suben lo mismo que los máximos */
      if (c.hp.current - pgAntes.cur !== c.hp.max - pgAntes.max)
        b.fallo(donde, `PG actuales +${c.hp.current - pgAntes.cur} y máximos +${c.hp.max - pgAntes.max}`);
      await reglasNivel(page, r, donde, hist);
      R.niveles++;
    }
    R.hechas++;
    R.especies.add(r.especie);
    R.trasfondos.add(r.trasfondo);
    console.log(
      `  ✓ ${r.id} (${r.especie}, ${r.trasfondo}) · PG ${c.hp.max} · ${Math.round((Date.now() - t0) / 1000)} s`
    );
  } catch (e) {
    const m = String(e.message || e).split('\n')[0];
    const lv = await page.evaluate(() => (C() ? C().level : 0)).catch(() => '?');
    R.rotas.push(`${r.id}: se queda en el nivel ${lv} · ${m}`);
    if (!b.INF.fallos.some(f => f.includes(m))) b.fallo(r.id, `la tanda no ha terminado (nivel ${lv}): ${m}`);
    await b.cerrarModal(page).catch(() => {});
  }
}

/* Otros guiones (generar-rincones.js) usan el asistente de crear y subir de nivel de aquí */
module.exports = { crear, subir };
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exit(1);
  });

async function main() {
  const primero = await b.abrir();
  const datos = await primero.page.evaluate(() => ({
    clases: Object.fromEntries(Object.entries(CL).map(([k, d]) => [k, Object.keys(d.subs)])),
    especies: Object.keys(SPEC),
    trasfondos: Object.keys(BG),
  }));
  await tablas(primero.page);
  /* Una tanda por subclase; la especie y el trasfondo van rotando para probar todos */
  const tandas = [];
  for (const [clase, subs] of Object.entries(datos.clases))
    for (const sub of subs) {
      const n = tandas.length;
      tandas.push({
        n,
        id: `${clase}/${sub}`,
        clase,
        sub,
        especie: datos.especies[n % datos.especies.length],
        trasfondo: datos.trasfondos[(n * 5) % datos.trasfondos.length],
      });
    }
  const lista = tandas.filter(r => !FILTRO || r.clase === FILTRO || r.id === FILTRO);
  console.log(`Tandas: ${lista.length} de ${tandas.length} (${HILOS} a la vez)`);
  const cola = lista.slice();
  const hilo = async ctx => {
    for (let r = cola.shift(); r; r = cola.shift()) await tanda(ctx, r);
    await ctx.browser.close();
  };
  const ctxs = [primero];
  for (let i = 1; i < Math.min(HILOS, lista.length); i++) ctxs.push(await b.abrir());
  await Promise.all(ctxs.map(hilo));

  /* Informe */
  b.sola('Subir de nivel: PG, dados de golpe, competencia, espacios, magia de pacto, rasgos nuevos y usos');
  b.sola('Subclase a nivel 3, con sus rasgos, recursos y conjuros siempre preparados');
  b.sola('Mejora de característica o dote (con sus opciones) en los niveles que tocan');
  b.noSola('Elegir los conjuros nuevos de cada nivel (el asistente deja seguir sin elegirlos)');
  const fin = b.informe('Prueba 2a · Todas las clases y subclases del 1 al 20');
  console.log(`\nTandas completas: ${R.hechas} de ${lista.length} · niveles comprobados: ${R.niveles}`);
  console.log(
    `Especies: ${R.especies.size} · trasfondos: ${R.trasfondos.size} · dotes elegidas: ${R.dotes.size} · invocaciones: ${R.invoc.size}`
  );
  const bloque = (t, l) =>
    l.length && console.log(`\n${t} (${l.length}):\n` + l.map(x => '  · ' + x).join('\n'));
  bloque('Tandas que no llegan al nivel 20', R.rotas);
  bloque('Tablas distintas del manual', R.tablasMal);
  bloque('Usos distintos del manual', [...R.usosMal]);
  bloque('PG máximos que no cuadran', R.pgMal);
  if (R.conRetro.length) {
    const ids = [...new Set(R.conRetro.map(x => x.id))];
    const peor = R.conRetro.reduce((a, x) => (x.reglas - x.app > a.reglas - a.app ? x : a));
    console.log(
      `\nPG máximos sin la subida de CON de los niveles anteriores: ${R.conRetro.length} niveles de ${ids.length} tandas.` +
        ` La mayor diferencia: ${peor.id} a nivel ${peor.L}, ${peor.app} PG en la app y ${peor.reglas} según las reglas.`
    );
  }
  bloque('Límites de conjuros sin llenar', [...R.limites].slice(0, 12));
  bloque('Notas', [...R.notas].slice(0, 30));
  process.exit(fin || (R.rotas.length ? 1 : 0));
}
