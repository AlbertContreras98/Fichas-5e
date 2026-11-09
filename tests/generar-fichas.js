/* Crea las fichas del reparto de pruebas con el asistente de la app y las guarda en tests/fichas/ tal como las exporta la app. */
'use strict';

const fs = require('fs');
const path = require('path');
const b = require('./base');

/* Lo que se elige en cada paso del asistente */
const REPARTO = [
  {
    archivo: 'zyo.json',
    nombre: 'Zyo',
    clase: 'warlock',
    especie: 'tiefling',
    linaje: 'chthonic',
    /* Trasfondo personalizado: el asistente solo deja escribir el nombre; los aumentos van ya en las puntuaciones */
    trasfondo: { propio: 'Mendigo' },
    car: { str: 8, dex: 14, con: 15, int: 10, wis: 12, cha: 17 },
    habilidades: ['deception', 'intimidation'],
    conjuros: ['eldritch-blast', 'minor-illusion', 'hex', 'hellish-rebuke'],
    invocaciones: ['pact-of-the-blade'],
    /* Lo que el asistente no deja hacer con un trasfondo propio: se añade después desde «Editar ficha» */
    despues: {
      rasgos: [
        {
          name: 'Dote Superviviente',
          source: 'Dote de origen (Mendigo)',
          text: 'Dote personalizada de Zyo (casera). El texto exacto lo pone Albert.',
        },
      ],
      habilidades: ['stealth', 'sleight'],
      herramientas: 'Kit de disfraz',
    },
  },
  {
    archivo: 'guerrero.json',
    nombre: 'Brunilda',
    clase: 'fighter',
    especie: 'dwarf',
    trasfondo: { key: 'soldier', mas2: 'str', mas1: 'con' },
    car: { str: 15, dex: 13, con: 14, int: 8, wis: 12, cha: 10 },
    habilidades: ['perception', 'survival'],
    estilo: 'defense',
  },
  {
    archivo: 'mago.json',
    nombre: 'Elarion',
    clase: 'wizard',
    especie: 'elf',
    linaje: 'high',
    trasfondo: { key: 'sage', mas2: 'int', mas1: 'con' },
    car: { str: 8, dex: 14, con: 13, int: 15, wis: 12, cha: 10 },
    habilidades: ['investigation', 'medicine', 'perception'],
    conjuros: ['fire-bolt', 'mage-hand', 'light', 'magic-missile', 'shield', 'sleep', 'mage-armor'],
  },
  {
    archivo: 'paladin.json',
    nombre: 'Tomás',
    clase: 'paladin',
    especie: 'human',
    dote: 'tough',
    trasfondo: { key: 'acolyte', mas2: 'cha', mas1: 'wis' },
    car: { str: 15, dex: 10, con: 13, int: 8, wis: 12, cha: 14 },
    habilidades: ['athletics', 'persuasion', 'perception'],
    conjuros: ['bless', 'cure-wounds'],
  },
];

const pasoActual = page => page.evaluate(() => (W ? wizSteps()[W.step][0] : null));

async function conjuro(page, id) {
  const ya = await page.evaluate(i => W.spells.some(s => s.ref === i), id);
  if (ya) return;
  const en = await page.evaluate(i => SPBY[i].en, id);
  await b.escribir(page, '#sp-q', en);
  await b.act(page, 'sp-tog', { id });
}

/* Recorre el asistente de crear personaje con las elecciones de f */
async function crear(page, f) {
  await b.act(page, 'create');
  for (let vuelta = 0; vuelta < 30; vuelta++) {
    const st = await pasoActual(page);
    if (!st) throw new Error('El asistente se ha cerrado antes de tiempo');
    switch (st) {
      case 'basics':
        await b.escribir(page, '#wz-name', f.nombre);
        await b.radio(page, 'wz-cls', f.clase);
        break;
      case 'species':
        await b.radio(page, 'wz-spec', f.especie);
        if (f.linaje) await b.radio(page, 'wz-lin', f.linaje);
        break;
      case 'background':
        if (f.trasfondo.propio) {
          await b.elegir(page, '#wz-bg', '');
          await b.escribir(page, '#wz-background', f.trasfondo.propio);
        } else {
          await b.elegir(page, '#wz-bg', f.trasfondo.key);
          await b.elegir(page, '#wz-bg2', f.trasfondo.mas2);
          await b.elegir(page, '#wz-bg1', f.trasfondo.mas1);
        }
        if (f.dote) await b.elegir(page, '#wz-hfeat', f.dote);
        break;
      case 'abil':
        for (const [k, v] of Object.entries(f.car)) await b.escribir(page, `#wz-ab-${k}`, v);
        break;
      case 'skills':
        for (const k of f.habilidades) await b.act(page, 'wz-skill', { k });
        break;
      case 'style':
        await b.elegir(page, '[data-fs="k"]', f.estilo);
        break;
      case 'spells':
        for (const id of f.conjuros || []) await conjuro(page, id);
        break;
      case 'invoc':
        for (const id of f.invocaciones || []) await b.act(page, 'iv-add', { id });
        break;
      case 'confirm':
        await b.act(page, 'wz-apply');
        await page.waitForFunction(() => !W);
        await b.cerrarToasts(page);
        return;
    }
    const ok = await page.locator('[data-act="wz-next"]').isEnabled();
    if (!ok) {
      const h = await page.locator('.wz-foot .hint').textContent();
      throw new Error(`Paso «${st}» sin completar: ${h}`);
    }
    await b.act(page, 'wz-next');
  }
  throw new Error('El asistente no termina');
}

/* Lo que no se puede hacer en el asistente se hace en «Editar ficha», como lo haría el jugador */
async function retocar(page, d) {
  if (!d) return;
  await b.act(page, 'settings');
  await b.act(page, 'open-edit');
  for (const r of d.rasgos || []) {
    await b.act(page, 'add', { list: 'features' });
    const i = await page.evaluate(() => C().features.length - 1);
    await b.escribir(page, `[data-path="features.${i}.name"]`, r.name);
    await b.escribir(page, `[data-path="features.${i}.source"]`, r.source);
    await b.escribir(page, `[data-path="features.${i}.text"]`, r.text);
  }
  if (d.herramientas) await b.escribir(page, '[data-path="proficiencies.tools"]', d.herramientas);
  for (const k of d.habilidades || []) await b.elegir(page, `[data-path="skills.${k}"]`, '1');
  await b.act(page, 'tab', { t: 'pj' });
}

(async () => {
  const ctx = await b.abrir();
  const { page } = ctx;
  fs.mkdirSync(b.FICHAS, { recursive: true });
  for (const f of REPARTO) {
    await b.limpiar(page);
    await crear(page, f);
    await retocar(page, f.despues);
    const json = await b.exportar(page);
    fs.writeFileSync(path.join(b.FICHAS, f.archivo), json + '\n');
    const c = JSON.parse(json);
    console.log(
      `${f.archivo}: ${c.name}, ${c.species} ${c.class} ${c.level}, ${c.background} · PG ${c.hp.max} · CA ${c.ac} · ${c.spells.length} conjuros · ${c.features.length} rasgos`
    );
  }
  if (ctx.errores.length) console.log('Errores de consola:\n' + ctx.errores.join('\n'));
  await ctx.browser.close();
})().catch(e => {
  console.error(e);
  process.exit(1);
});
