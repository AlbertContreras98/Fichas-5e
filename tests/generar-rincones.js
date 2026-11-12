/* Crea las fichas de la prueba 2d (tests/fichas/rincones/) con el asistente de la app, las sube a nivel 5 y les añade
   objetos, mapas y criaturas con las ventanas de verdad. Uso: node tests/generar-rincones.js (sobrescribe las que haya) */
'use strict';

const fs = require('fs');
const path = require('path');
const b = require('./base');
const { crear, subir } = require('./clases');

const DIR = path.join(b.FICHAS, 'rincones');
const NIVEL = 5;

/* Objetos que se añaden con «Añadir objeto» */
const POCIONES = [
  { cat: 'pocion', pot: 'healing', qty: 3 },
  { cat: 'pocion', pot: 'heroism', qty: 1 },
  { cat: 'pocion', pot: 'invisibility', qty: 1 },
  { cat: 'pocion', pot: 'resistance', qty: 1 },
];
const MAGICOS = [
  { cat: 'otro', mip: 'wandmm', qty: 1 },
  { cat: 'otro', mip: 'ringprot', qty: 1 },
  { cat: 'otro', mip: 'cloakprot', qty: 1 },
  { cat: 'otro', mip: 'bracers', qty: 1 },
];

const REPARTO = [
  {
    /* Druida del Círculo de la Luna: formas, criaturas de todos los tipos, pociones, pergaminos, objetos mágicos y mapas */
    archivo: 'druida.json',
    r: {
      id: 'Musgo',
      n: 0,
      clase: 'druid',
      sub: 'moon',
      especie: 'elf',
      linaje: 'wood',
      trasfondo: 'hermit',
    },
    objetos: [
      ...POCIONES,
      /* Uno de su lista que puede lanzar, uno de su lista de nivel alto (prueba de característica) y uno de otra lista */
      { cat: 'pergamino', spl: 'Curar heridas', qty: 2 },
      { cat: 'pergamino', spl: 'Muro de fuego', qty: 1 },
      { cat: 'pergamino', spl: 'Bola de fuego', qty: 1 },
      ...MAGICOS,
      { cat: 'mapa', name: 'Bosque de Neverwinter', img: true },
      { cat: 'mapa', name: 'La cripta', img: false },
    ],
    criaturas: [
      { k: 'form', via: 'wild', cat: 0 },
      { k: 'form', via: 'wild', cat: 3 },
      { k: 'form', via: 'poly', cat: 10 },
      { k: 'familiar', cat: 0 },
      { k: 'steed', quitar: ['cx-spend'] },
      { k: 'summon', s: 'beast', quitar: ['cx-spend'] },
      { k: 'summon', s: 'elemental', quitar: ['cx-spend', 'cx-concNew'] },
      { k: 'primal' },
      { k: 'other', cat: 2 },
    ],
  },
  {
    /* Pícaro goliat de linaje de piedra: Esquiva asombrosa y Aguante de piedra (reacciones que restan daño), Ataque furtivo */
    archivo: 'picaro.json',
    r: {
      id: 'Kava',
      n: 1,
      clase: 'rogue',
      sub: 'thief',
      especie: 'goliath',
      linaje: 'stone',
      trasfondo: 'criminal',
    },
    objetos: [...POCIONES.slice(0, 2), { cat: 'pergamino', spl: 'Escudo', qty: 1 }, ...MAGICOS.slice(0, 2)],
    criaturas: [],
  },
  {
    /* Hechicero goliat de linaje de piedra: puntos de hechicería, Restauración hechicera, Escudo y Aguante de piedra */
    archivo: 'hechicero.json',
    r: {
      id: 'Brasa',
      n: 2,
      clase: 'sorcerer',
      sub: 'draconic',
      especie: 'goliath',
      linaje: 'stone',
      trasfondo: 'sage',
    },
    objetos: [POCIONES[0], { cat: 'pergamino', spl: 'Bola de fuego', qty: 1 }, MAGICOS[0]],
    criaturas: [{ k: 'familiar', cat: 1 }],
    conjuros: ['shield'],
  },
];

async function objeto(page, o) {
  await b.cerrarModal(page);
  await b.act(page, 'inv');
  await b.act(page, 'item-new', {}, '#modal');
  await b.elegir(page, '#ni-cat', o.cat);
  if (o.pot) await b.elegir(page, '#ni-pot', o.pot);
  if (o.spl) {
    await b.escribir(page, '#ni-spl', o.spl);
    await page.locator('#ni-spl').dispatchEvent('change');
  }
  if (o.mip) {
    await page.locator('#ni-mi').check();
    await b.elegir(page, '#ni-mip', o.mip);
  }
  if (o.img) {
    await page.setInputFiles('#ni-img', await b.imagenPNG(page));
    await page.waitForFunction(() => NI && NI.img);
  }
  if (o.name) await b.escribir(page, '#ni-name', o.name);
  if (o.qty && o.cat !== 'mapa') await b.escribir(page, '#ni-qty', o.qty);
  const n0 = await page.evaluate(() => C().equipment.length);
  await b.act(page, 'item-add');
  const n1 = await page.evaluate(() => C().equipment.length);
  if (n1 !== n0 + 1) throw new Error(`no se ha añadido el objeto ${JSON.stringify(o)}`);
  await b.cerrarToasts(page);
}

async function criatura(page, o) {
  await b.cerrarModal(page);
  await b.act(page, 'tab', { t: 'crea' });
  await b.act(page, 'crea-new');
  await b.act(page, 'crea-kind', { k: o.k });
  if (o.via) await b.elegir(page, '#cx-via', o.via);
  if (o.s) await b.elegir(page, '#cx-s', o.s);
  if (o.cat !== undefined) {
    const ops = await page.$eval('#cx-cat', e => [...e.options].filter(x => x.value).map(x => x.value));
    await b.elegir(page, '#cx-cat', ops[o.cat % ops.length]);
  }
  for (const id of o.quitar || []) await page.locator('#' + id).uncheck();
  const n0 = await page.evaluate(() => C().companions.length);
  await b.act(page, 'crea-save');
  const n1 = await page.evaluate(() => C().companions.length);
  if (n1 !== n0 + 1) {
    const msg = await page.evaluate(() => ($('#cx-msg') || {}).textContent || '');
    throw new Error(`no se ha añadido la criatura ${JSON.stringify(o)}: ${msg}`);
  }
}

/* Conjuros que interesan y que el asistente no ha elegido solo: con el buscador de conjuros de «Partida» */
async function conjuro(page, id) {
  if (await page.evaluate(i => C().spells.some(s => s.ref === i), id)) return;
  await b.cerrarModal(page);
  await b.act(page, 'tab', { t: 'play' });
  await b.act(page, 'sp-open');
  const en = await page.evaluate(i => SPBY[i].en, id);
  await b.escribir(page, '#sp-q', en);
  await b.act(page, 'sp-tog', { id });
  await b.cerrarModal(page);
  if (!(await page.evaluate(i => C().spells.some(s => s.ref === i), id)))
    throw new Error(`no se ha podido añadir el conjuro ${id}`);
}

(async () => {
  const ctx = await b.abrir();
  const { page } = ctx;
  fs.mkdirSync(DIR, { recursive: true });
  for (const f of REPARTO) {
    await b.limpiar(page);
    await crear(page, f.r);
    for (let L = 2; L <= NIVEL; L++) await subir(page, f.r, L);
    for (const id of f.conjuros || []) await conjuro(page, id);
    for (const o of f.objetos) await objeto(page, o);
    for (const o of f.criaturas) await criatura(page, o);
    await b.cerrarModal(page);
    await b.act(page, 'tab', { t: 'play' });
    const json = await b.exportar(page);
    fs.writeFileSync(path.join(DIR, f.archivo), json + '\n');
    const c = JSON.parse(json);
    console.log(
      `${f.archivo}: ${c.name}, ${c.species} ${c.class} (${c.subclass}) ${c.level} · PG ${c.hp.max} · CA ${c.ac} · ${c.spells.length} conjuros · ${c.equipment.length} objetos · ${c.companions.length} criaturas`
    );
  }
  if (ctx.errores.length) console.log('Errores de consola:\n' + ctx.errores.join('\n'));
  await ctx.browser.close();
})().catch(e => {
  console.error(e);
  process.exit(1);
});
