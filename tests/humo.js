/* Prueba de humo: recorrido corto por lo básico con cada ficha del reparto. Se pasa antes de cada versión. */
'use strict';

const fs = require('fs');
const b = require('./base');

const FICHAS = fs
  .readdirSync(b.FICHAS)
  .filter(f => f.endsWith('.json'))
  .sort();

/* Comprueba una condición de las reglas y la apunta en el informe */
function regla(donde, ok, que) {
  if (!ok) b.fallo(donde, que);
}

/* Abre «Vida y estado», escribe la cantidad y pulsa el botón (dmg, heal, temp) */
async function vida(page, n, m) {
  await b.act(page, 'vida');
  await b.escribir(page, '#hpAmt', n);
  await b.act(page, 'hp', { m });
}

/* Gasta la primera casilla llena que haya (espacio, magia de pacto o uso de un rasgo) */
async function gastarCasilla(page, kind) {
  const loc = page.locator(`[data-act="pip"][data-kind="${kind}"].full`).filter({ visible: true }).first();
  if (!(await loc.count())) return false;
  await loc.click();
  return true;
}

/* Lo que se elige al subir a nivel 2 */
const NIVEL2 = {
  warlock: { invoc: ['agonizing-blast', 'repelling-blast'] },
  paladin: { estilo: 'defense' },
  ranger: { estilo: 'archery' },
};

async function subirNivel(page, clase) {
  await b.act(page, 'settings');
  await b.act(page, 'levelup');
  const elige = NIVEL2[clase] || {};
  for (let v = 0; v < 20; v++) {
    const st = await page.evaluate(() => (W ? wizSteps()[W.step][0] : null));
    if (!st) throw new Error('el asistente se ha cerrado');
    if (st === 'confirm') {
      await b.act(page, 'wz-apply');
      await page.waitForFunction(() => !W);
      return;
    }
    if (st === 'style') await b.elegir(page, '[data-fs="k"]', elige.estilo);
    if (st === 'invoc') {
      for (const id of elige.invoc || []) {
        const ya = await page.evaluate(i => W.iv && W.iv.list.some(e => e.id === i), id);
        if (!ya) await b.act(page, 'iv-add', { id });
      }
      /* Las que piden elegir un truco: el primero que ofrezca */
      for (const s of await page.locator('select[data-iv-pick]').all()) {
        const v = await s.inputValue();
        if (v) continue;
        const op = await s.locator('option').evaluateAll(os => os.map(o => o.value).filter(Boolean));
        if (op.length)
          await b.elegir(page, `select[data-iv-pick="${await s.getAttribute('data-iv-pick')}"]`, op[0]);
      }
    }
    if (st === 'asi') throw new Error('mejora de característica sin preparar en el guion');
    const ok = await page.locator('[data-act="wz-next"]').isEnabled();
    if (!ok)
      throw new Error(`paso «${st}» sin completar: ${await page.locator('.wz-foot .hint').textContent()}`);
    await b.act(page, 'wz-next');
  }
  throw new Error('el asistente no termina');
}

async function recorrido(ctx, archivo) {
  const { page } = ctx;
  const json = b.leerFicha(archivo);
  const orig = JSON.parse(json);
  const P = t => `${orig.name} · ${t}`;
  console.log(`\n— ${orig.name} (${orig.class} ${orig.level}, ${archivo})`);
  await b.limpiar(page);

  // 1. Importar
  await b.paso(ctx, P('importar'), async pg => {
    await b.importar(pg, json);
  });
  let c = await b.ficha(page);
  const dif = b.difs(b.limpia(orig), b.limpia(c)).filter(d => !d.startsWith('id:'));
  if (dif.length) b.fallo(P('importar'), `la ficha importada no es igual al archivo: ${dif.join('; ')}`);
  const max = c.hp.max,
    con = Math.floor((c.abilities.con - 10) / 2);

  // Armas listas para atacar en Combate (las del equipo inicial deberían salir sin tener que equiparlas)
  await b.act(page, 'tab', { t: 'combat' });
  const ataques = await page.locator('[data-act="t-atk"]').count();
  if (!ataques)
    b.noSola(`Equipar las armas del equipo inicial: sin eso no sale ningún ataque en Combate (${orig.name})`);
  await b.act(page, 'tab', { t: 'play' });

  // 2. Empezar combate
  await b.paso(ctx, P('empezar combate'), async pg => {
    await b.act(pg, 'tab', { t: 'combat' });
    await b.act(pg, 'cb-start');
  });
  c = await b.ficha(page);
  regla(
    P('empezar combate'),
    c.combat && c.combat.round === 1,
    `ronda ${JSON.stringify(c.combat)} (debería ser 1)`
  );
  if (c.combat) b.sola('Lleva la cuenta de las rondas y dice qué tirar de iniciativa');

  // 3. Avanzar ronda
  await b.paso(ctx, P('terminar turno'), pg => b.act(pg, 't-end'));
  c = await b.ficha(page);
  regla(
    P('terminar turno'),
    c.combat && c.combat.round === 2,
    `ronda ${c.combat && c.combat.round} tras terminar el turno (debería ser 2)`
  );

  // 4. Recibir daño
  const dmg = Math.min(5, max - 1);
  await b.paso(ctx, P(`recibir ${dmg} de daño`), pg => vida(pg, dmg, 'dmg'));
  c = await b.ficha(page);
  regla(
    P('recibir daño'),
    c.hp.current === max - dmg,
    `PG ${c.hp.current} tras ${dmg} de daño (debería ser ${max - dmg})`
  );

  // 5. Gastar algo (espacio, pacto o uso de rasgo) para ver si los descansos lo recuperan
  const gastado = [];
  for (const k of ['slot', 'pact', 'feat'])
    await b.paso(ctx, P(`gastar casilla (${k})`), async pg => {
      if (await gastarCasilla(pg, k)) gastado.push(k);
    });
  const conGasto = await b.ficha(page);

  // 6. Curarse
  await b.paso(ctx, P('curarse 3'), pg => vida(pg, 3, 'heal'));
  c = await b.ficha(page);
  regla(
    P('curarse'),
    c.hp.current === Math.min(max, max - dmg + 3),
    `PG ${c.hp.current} tras curar 3 (debería ser ${Math.min(max, max - dmg + 3)})`
  );

  // 7. Terminar combate
  await b.paso(ctx, P('terminar combate'), async pg => {
    await b.act(pg, 'cb-end');
    await b.act(pg, 'cb-end-ok');
  });
  c = await b.ficha(page);
  regla(P('terminar combate'), c.combat === null, 'el combate sigue activo');

  // 8. Descanso corto gastando un dado de golpe (sacamos un 4)
  const antesCorto = await b.ficha(page);
  await b.paso(ctx, P('descanso corto'), async pg => {
    await b.act(pg, 'rest-menu');
    await b.act(pg, 'short');
    await b.escribir(pg, '#hd-roll', 4);
    await b.act(pg, 'hd');
    await b.act(pg, 'short-done');
  });
  c = await b.ficha(page);
  const curaHD = Math.max(0, 4 + con);
  regla(
    P('descanso corto'),
    c.hitDice.spent === 1,
    `dados de golpe gastados ${c.hitDice.spent} (debería ser 1)`
  );
  regla(
    P('descanso corto'),
    c.hp.current === Math.min(max, antesCorto.hp.current + curaHD),
    `PG ${c.hp.current} tras el dado de golpe (debería ser ${Math.min(max, antesCorto.hp.current + curaHD)})`
  );
  regla(
    P('descanso corto'),
    c.pact.used === 0,
    `magia de pacto gastada ${c.pact.used} tras el descanso corto`
  );
  regla(
    P('descanso corto'),
    JSON.stringify(c.slots) === JSON.stringify(antesCorto.slots),
    'el descanso corto ha cambiado los espacios de conjuro normales'
  );
  antesCorto.features.forEach((f, i) => {
    const u = c.features[i] && c.features[i].uses;
    if (!u || !f.uses.max) return;
    const want =
      f.uses.recover === 'corto'
        ? 0
        : f.uses.recover === 'corto1'
          ? Math.max(0, f.uses.used - 1)
          : f.uses.used;
    regla(
      P('descanso corto'),
      u.used === want,
      `«${f.name}» gastados ${u.used} tras el descanso corto (debería ser ${want})`
    );
  });
  if (gastado.includes('pact')) b.sola('Recupera la magia de pacto en el descanso corto');
  b.sola('Cura con los dados de golpe sumando la CON (el jugador tira el dado)');

  // 9. Descanso largo
  const antesLargo = await b.ficha(page);
  await b.paso(ctx, P('descanso largo'), async pg => {
    await b.act(pg, 'rest-menu');
    await b.act(pg, 'long');
    await b.act(pg, 'long-done');
  });
  c = await b.ficha(page);
  regla(
    P('descanso largo'),
    c.hp.current === c.hp.max,
    `PG ${c.hp.current}/${c.hp.max} tras el descanso largo`
  );
  regla(
    P('descanso largo'),
    c.hitDice.spent === 0,
    `dados de golpe gastados ${c.hitDice.spent} tras el descanso largo`
  );
  regla(
    P('descanso largo'),
    c.slots.every(s => s.used === 0) && c.pact.used === 0,
    'quedan espacios gastados'
  );
  regla(
    P('descanso largo'),
    c.features.every(f => !f.uses.max || !f.uses.recover || f.uses.used === 0),
    'quedan usos de rasgos sin recuperar'
  );
  const rac = e => e.equipment.filter(x => x.gear === 'rations').reduce((t, x) => t + (+x.qty || 0), 0);
  if (rac(antesLargo)) {
    regla(
      P('descanso largo'),
      rac(c) === rac(antesLargo) - 1,
      `raciones ${rac(antesLargo)} → ${rac(c)} (debería gastar 1)`
    );
    b.sola('Gasta una ración al comer en el descanso largo');
  }
  if (gastado.includes('slot') || gastado.includes('feat'))
    b.sola('Recupera espacios y usos de rasgos en el descanso largo');

  // 10. Subir de nivel
  const antesNivel = await b.ficha(page);
  await b.paso(ctx, P('subir a nivel 2'), pg => subirNivel(pg, orig.classKey));
  c = await b.ficha(page);
  const hdCaras = +String(c.hitDice.die).replace(/\D/g, '');
  const conNueva = Math.floor((c.abilities.con - 10) / 2);
  const tough = (c.featKeys || []).includes('tough') ? 2 : 0;
  const dwarf = c.speciesKey === 'dwarf' ? 1 : 0;
  const gana = Math.max(1, hdCaras / 2 + 1 + conNueva) + tough + dwarf;
  regla(P('subir a nivel 2'), c.level === 2, `nivel ${c.level} (debería ser 2)`);
  regla(
    P('subir a nivel 2'),
    c.hp.max === antesNivel.hp.max + gana,
    `PG máximos ${antesNivel.hp.max} → ${c.hp.max} (deberían subir ${gana})`
  );
  regla(
    P('subir a nivel 2'),
    c.hp.current === c.hp.max,
    `PG actuales ${c.hp.current}/${c.hp.max} tras subir`
  );
  if (c.level === 2) b.sola('Subir de nivel: PG, dados de golpe, espacios, rasgos y recursos nuevos');

  // 11. Exportar → importar con el flujo real (botones), en la misma app
  const exp = await b.exportar(page);
  const antes = JSON.parse(exp);
  await b.importar(page, exp);
  const vuelta = await b.ficha(page);
  const d2 = b.difs(b.limpia(antes), b.limpia(vuelta)).filter(d => !d.startsWith('id:'));
  if (d2.length) b.fallo(P('exportar e importar con los botones'), d2.join('; '));
  await b.comprobar(ctx, P('tras importar la copia'));
}

(async () => {
  const ctx = await b.abrir();
  for (const f of FICHAS) {
    try {
      await recorrido(ctx, f);
    } catch (e) {
      b.fallo(
        f,
        `el guion se ha parado: ${String(e.stack || e)
          .split('\n')
          .slice(0, 3)
          .join(' | ')}`
      );
    }
  }
  b.noSola('Tirar los dados (iniciativa, daño, curación, dado de golpe): la app dice qué tirar');
  await ctx.browser.close();
  process.exit(b.informe('Prueba de humo'));
})();
