/* Prueba 1b: comprueba en la app real cómo aplica algunas reglas generales (estados, daño a 0 PG, descansos, acciones, escudo). */
'use strict';

const fs = require('fs');
const path = require('path');
const B = require('./base');

const zyo = JSON.parse(fs.readFileSync(path.join(B.FICHAS, 'zyo.json'), 'utf8'));
const R = [];
const apunta = (regla, sale) => {
  R.push([regla, sale]);
  console.log(`· ${regla}: ${sale}`);
};
const velocidad = page =>
  page.evaluate(() => parseInt(document.querySelector('[data-k="speed"] b').textContent));
const toastTxt = page =>
  page.evaluate(() => [...document.querySelectorAll('.toast')].map(t => t.innerText).join(' | '));

(async () => {
  const { browser, page, errores } = await B.abrir();
  await B.limpiar(page);
  const nueva = async () => {
    await B.cerrarModal(page);
    await page.evaluate(() => {
      S.chars = [];
      S.active = null;
      save();
      render();
    });
    await B.importar(page, zyo);
  };
  await nueva();
  const v0 = await velocidad(page);

  // Estados que ponen la velocidad a 0
  for (const st of ['Agarrado', 'Apresado', 'Paralizado', 'Inconsciente']) {
    await B.act(page, 'vida');
    await B.act(page, 'cond', { n: st });
    await B.cerrarModal(page);
    apunta(`Velocidad arriba con ${st}`, `${await velocidad(page)} pies (sin estado: ${v0})`);
    await B.act(page, 'vida');
    await B.act(page, 'cond', { n: st });
    await B.cerrarModal(page);
  }

  // Agotamiento: velocidad y números de las tiradas
  await B.act(page, 'vida');
  await B.act(page, 'exh', { d: '1' });
  await B.cerrarModal(page);
  const sk = await page.evaluate(() => skillB(C(), SK.stealth));
  await page.evaluate(() => showGloss({ dataset: { k: 'skill:stealth' } }));
  const roll = await page.evaluate(() => document.querySelector('#modal .roll').innerText);
  apunta(
    'Agotamiento 1',
    `velocidad ${await velocidad(page)}; Sigilo en la ventana: «${roll}» (bonificador sin agotamiento ${sk})`
  );
  await B.cerrarModal(page);
  await page.evaluate(() => {
    C().exhaustion = 0;
    save();
    render();
  });

  // Combate: iniciativa, ataque con Envenenado, Esquivar, Esconderse
  await B.act(page, 'tab', { t: 'combat' });
  await B.act(page, 'cb-start');
  apunta('Empezar combate', await toastTxt(page));
  await B.cerrarToasts(page);
  await B.act(page, 'vida');
  await B.act(page, 'cond', { n: 'Envenenado' });
  await B.cerrarModal(page);
  await B.act(page, 't-atk');
  apunta('Atacar estando Envenenado (mensaje)', await toastTxt(page));
  await B.cerrarToasts(page);
  await B.act(page, 't-end');
  await B.cerrarToasts(page);
  await B.act(page, 't-gen', { k: 'a_dodge' });
  let c = await B.ficha(page);
  apunta('Esquivar', `efectos: [${c.effects.map(e => e.name).join(', ')}]`);
  await B.act(page, 't-end');
  await B.cerrarToasts(page);
  await B.act(page, 't-gen', { k: 'a_hide' });
  c = await B.ficha(page);
  apunta('Esconderse', `estados: [${c.conditions.join(', ')}]`);
  await B.act(page, 't-end');
  await B.cerrarToasts(page);

  // Daño a 0 PG y muerte instantánea estando ya a 0
  await nueva();
  await B.act(page, 'vida');
  await B.escribir(page, '#hpAmt', 10);
  await B.act(page, 'hp', { m: 'dmg' });
  await B.cerrarToasts(page);
  await B.escribir(page, '#hpAmt', 25);
  await B.act(page, 'hp', { m: 'dmg' });
  c = await B.ficha(page);
  apunta(
    'A 0 PG recibe 25 de daño (máx. 10)',
    `fallos ${c.deathSaves.fail}; mensaje: ${await toastTxt(page)}`
  );
  await B.cerrarToasts(page);
  await B.cerrarModal(page);
  // Descanso largo a 0 PG
  await B.act(page, 'rest-menu');
  await B.act(page, 'long');
  await B.act(page, 'long-done');
  c = await B.ficha(page);
  apunta('Descanso largo empezado a 0 PG', `PG ${c.hp.current}/${c.hp.max}`);
  await B.cerrarToasts(page);

  // Concentración larga y descanso largo (n.º 30)
  await nueva();
  await B.act(page, 'vida');
  await B.act(page, 'eff-add');
  await B.escribir(page, '#eff-name', 'Prueba 24 h');
  await B.escribir(page, '#eff-n', 1);
  await B.elegir(page, '#eff-u', 'd');
  await page.locator('#eff-conc').check();
  await B.act(page, 'eff-add-ok');
  await B.cerrarModal(page);
  await B.act(page, 'rest-menu');
  await B.act(page, 'long');
  await B.act(page, 'long-done');
  c = await B.ficha(page);
  apunta(
    'Concentración de 24 h y descanso largo',
    `concentración «${c.concentration}»; efectos [${c.effects.map(e => e.name + ' ' + e.m + ' min').join(', ')}]`
  );
  await B.cerrarToasts(page);

  // Incapacitado quita la concentración
  await B.act(page, 'vida');
  await B.act(page, 'eff-add');
  await B.escribir(page, '#eff-name', 'Prueba C');
  await page.locator('#eff-conc').check();
  await B.act(page, 'eff-add-ok');
  await B.act(page, 'cond', { n: 'Aturdido' });
  c = await B.ficha(page);
  apunta(
    'Aturdido con concentración',
    `concentración «${c.concentration}», efectos [${c.effects.map(e => e.name).join(', ')}]`
  );
  await B.cerrarModal(page);
  await B.cerrarToasts(page);

  // Escudo sin competencia (Zyo no la tiene)
  const ca0 = await page.evaluate(() => acOf(C()));
  await page.evaluate(() => {
    const c = C();
    c.equipment.push(
      Object.assign(NEW.equipment ? NEW.equipment() : {}, {
        id: uid(),
        name: 'Escudo',
        cat: 'armadura',
        armor: 'shield',
        equipped: true,
        qty: 1,
      })
    );
    save();
    render();
  });
  const ca1 = await page.evaluate(() => acOf(C()));
  const warn = await page.evaluate(() => acCalc(C()).warn.join(' '));
  apunta('Escudo sin competencia', `CA ${ca0} → ${ca1}; aviso: ${warn}`);
  // Lanzar un conjuro con el escudo sin competencia
  await B.act(page, 'tab', { t: 'play' });
  const puede = await page.evaluate(() =>
    canCast(
      C(),
      C().spells.find(s => s.name === 'Maleficio')
    )
  );
  apunta('Lanzar Maleficio con escudo sin competencia', puede ? 'la app deja lanzarlo' : 'no deja');

  apunta('Errores de consola', errores.length ? errores.join(' / ') : 'ninguno');
  await browser.close();
})().catch(e => {
  console.error(e);
  process.exit(1);
});
