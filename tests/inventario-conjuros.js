/* Prueba 1a (conjuros): clasifica cada conjuro de data/spells.js según lo que la app hace con él (sola / parcial / solo texto). */
'use strict';
/*
 * Uso:
 *   node tests/inventario-conjuros.js          → resumen por consola
 *   node tests/inventario-conjuros.js --md     → trozos en Markdown para tests/inventario-conjuros.md
 *   node tests/inventario-conjuros.js --app    → además comprueba en la app (Playwright, servidor propio en el puerto 8782)
 *
 * Cómo clasifica:
 *  1. Lee del código de la app (js/ y data/creatures.js) qué conjuros tienen tratamiento propio:
 *     material que se gasta (SP_CONSUME), criaturas (SUMMONS, find-steed, find-familiar), formas (polymorph…),
 *     usos gratis (FREE_LINK), Armadura de mago (CA) y Falsa vida (PG temporales).
 *  2. Para todos: la app gasta el espacio (o el ritual), lleva la concentración y crea un efecto con la duración
 *     que entiende parseDur (js/core/effects.js). Eso es lo «genérico».
 *  3. Busca en el texto (campo de) la mecánica que la app NO interpreta: daño, curación, PG temporales, salvación,
 *     salvación repetida, ataque de conjuro, estados, CA, +1d4, velocidad, escalado.
 *  4. Estado: Sola si no queda mecánica sin aplicar (o el tratamiento propio la cubre); Parcial si la app lleva
 *     la duración/concentración o parte del efecto pero queda mecánica a mano; Solo texto si el efecto es
 *     instantáneo y toda su mecánica está solo en la descripción (la app solo gasta el espacio).
 *  5. MANUAL sustituye lo automático: revisados a mano todos los de nivel 0–1 y los de 2–9 que lo necesitan.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

/* ---------- Datos ---------- */
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(rd('data/spells.js'), ctx);
vm.runInContext(rd('data/creatures.js') + '\n;this.SUMMONS=SUMMONS;', ctx);
const SPELLS = ctx.window.SPELLS;
const SUMMONS = ctx.SUMMONS;

/* parseDur y norm, sacados tal cual del código de la app */
const fnSrc = (file, re) => {
  const m = rd(file).match(re);
  if (!m) throw new Error(`No encuentro ${re} en ${file}`);
  return m[0];
};
const norm = vm.runInNewContext(fnSrc('js/core/utils.js', /const norm = s =>[\s\S]*?;\n/).replace('const norm =', '(').replace(/;\n$/, ')'), {});
const parseDur = vm.runInNewContext(
  '(' + fnSrc('js/core/effects.js', /function parseDur\(t\) \{[\s\S]*?\n\}/) + ')',
  { norm }
);

/* ---------- Lo que el código trata de forma propia ---------- */
const JS = {};
(function walk(dir) {
  for (const f of fs.readdirSync(path.join(ROOT, dir))) {
    const p = path.join(dir, f);
    if (fs.statSync(path.join(ROOT, p)).isDirectory()) walk(p);
    else if (f.endsWith('.js')) JS[p] = rd(p);
  }
})('js');
const rules = JS[path.join('js', 'core', 'rules.js')];
const consumeBlock = rules.match(/const SP_CONSUME = \{([\s\S]*?)\n\};/)[1];
const CONSUME = new Set([...consumeBlock.matchAll(/^\s*'?([a-z-]+)'?:/gm)].map(m => m[1]));
const freeBlock = rules.match(/const FREE_LINK = \{([\s\S]*?)\n\};/)[1];
const FREE = new Set([...freeBlock.matchAll(/'([a-z-]+)':/g)].map(m => m[1]));
const SUMMON_REFS = new Set(Object.values(SUMMONS).map(s => s.ref));
const IDS = new Set(SPELLS.map(s => s.id));

/* Dónde aparece cada id entre comillas en js/ (para no dejar ninguno sin mirar) */
function codeRefs(id) {
  const out = [];
  const re = new RegExp(`['"\`]${id}['"\`]`);
  for (const [f, src] of Object.entries(JS))
    src.split('\n').forEach((l, i) => {
      if (re.test(l)) out.push(`${f}:${i + 1}`);
    });
  return out;
}

/* Tratamiento propio de cada conjuro (lo que hace por encima de lo genérico) */
function special(s) {
  const out = [];
  if (s.id === 'mage-armor') out.push('pone tu CA en 13 + DES mientras dure y avisa si llevas armadura');
  if (s.id === 'false-life') out.push('pide la tirada de 2d4 y suma 4 (+5 por nivel de espacio) en PG temporales, sin acumular');
  if (SUMMON_REFS.has(s.id)) out.push('botón «Crear la criatura» con CA, PG y ataques según el nivel del espacio; desaparece al perder la concentración');
  if (s.id === 'find-steed') out.push('botón «Crear la montura» con sus estadísticas según el nivel del espacio');
  if (s.id === 'find-familiar') out.push('botón «Crear el familiar»');
  if (['polymorph', 'true-polymorph', 'shapechange'].includes(s.id))
    out.push('botón «Elegir forma» entre tus formas guardadas: te transforma y da PG temporales');
  if (CONSUME.has(s.id)) out.push('descuenta del inventario el material que se consume');
  if (FREE.has(s.id)) out.push('usos gratis del rasgo de clase');
  return out;
}

/* ---------- Mecánica que hay en el texto ---------- */
const sentences = t => t.split(/(?<=[.:])\s+|\n/);
function mech(s) {
  const t = s.de + (s.hl ? '\n' + s.hl : '');
  const S = sentences(t);
  const any = re => S.some(x => re.test(x));
  const f = {};
  f.dmg = S.some(x => /\d+d\d+/.test(x) && /daño/i.test(x) && !/no recibe daño|reduce el daño/i.test(x));
  f.extra = any(/daño[^.\n]{0,40}extra|extra[^.\n]{0,30}daño/i);
  f.heal = S.some(
    x => /(recupera|restablece|cura)[^.\n]*(puntos de golpe|\bPG\b)|recupera(n)? \d+d\d+/i.test(x) && !/no puede(n)? recuperar/i.test(x)
  );
  f.temp = any(/puntos de golpe temporales/i);
  f.save = any(/salvaci[oó]n de (Fuerza|Destreza|Constituci|Inteligencia|Sabidur|Carisma)/i);
  f.repeat = any(
    /(final|principio) de cada uno de sus turnos[^.\n]*salvaci|salvaci[^.\n]*(final|principio) de cada uno de sus turnos|repet\w* la salvaci|repite la salvaci|vuelve a hacer la salvaci|(final|principio) de cada uno de sus turnos[^.\n]*(otra|nueva) salvaci/i
  );
  f.atk = any(/ataque de conjuro/i);
  f.cond = any(/\b(asustad|hechizad|paralizad|apresad|derribad|cegad|ensordecid|envenenad|incapacitad|aturdid|petrificad|inconscient)/i);
  f.ac = any(/\+\d+ a la CA|CA (base )?pasa a ser|CA no puede ser (inferior|menor)|bonificador de \+\d+ a la CA|\+\d+ a (la )?CA/i);
  f.d20 = any(/(suma|resta)(r)? 1d\d+ a|1d4 a (esa|cualquier|la) (tirada|prueba|salvaci)|reduce el daño total recibido en 1d4/i);
  f.adv = any(/\b(ventaja|desventaja)\b/i);
  f.speed = any(/velocidad (aumenta|se reduce|se duplica|pasa a ser)|aumenta(n)? (tu|su) velocidad/i);
  f.cantrip = /Mejora de truco/.test(s.de);
  f.upcast = !!s.hl || /espacio de nivel superior|por cada nivel de espacio/i.test(s.de);
  return f;
}
const MECH_LBL = {
  dmg: 'daño',
  extra: 'daño extra en tus impactos',
  heal: 'curación',
  temp: 'PG temporales',
  save: 'salvación del objetivo',
  repeat: 'salvación repetida cada turno',
  atk: 'ataque de conjuro',
  cond: 'estado que impone',
  ac: 'bonificador a la CA',
  d20: '+/-1d4 en tiradas',
  adv: 'ventaja/desventaja',
  speed: 'velocidad',
};

/* ---------- Revisión a mano ---------- */
/* [estado, qué hace / qué falta]. Estados: S = sola, P = parcial, T = solo texto */
const MANUAL = {
  // Trucos
  'shocking-grasp': ['T', 'Falta: el ataque (ataque de conjuro, 1d8 de relámpago que sube a 2d8/3d8/4d8 a niveles 5/11/17) y que el objetivo no puede hacer ataques de oportunidad.'],
  'vicious-mockery': ['T', 'Falta: salvación de SAB, 1d6 psíquico con su escalado y la desventaja del objetivo.'],
  'produce-flame': ['P', 'Lleva la llama 10 min y gasta la acción adicional. Falta: el ataque de la llama (1d8 de fuego con escalado) en tu lista de ataques mientras dura.'],
  'fire-bolt': ['T', 'Falta: el ataque (1d10 de fuego con escalado por nivel).'],
  druidcraft: ['S', 'Narrativo: no hay números que aplicar.'],
  elementalism: ['S', 'Narrativo: no hay números que aplicar.'],
  'eldritch-blast': ['T', 'Falta: el ataque (1d10 de fuerza), el número de rayos según el nivel (2 a nivel 5, 3 a nivel 11, 4 a nivel 17) y sumar CAR con Estallido agonizante.'],
  'sorcerous-burst': ['T', 'Falta: el ataque (1d8 del tipo elegido, d8 que explotan hasta tu modificador) con escalado.'],
  'starry-wisp': ['T', 'Falta: el ataque (1d8 radiante con escalado) y que el objetivo no puede ser invisible.'],
  shillelagh: ['P', 'Lleva el minuto y gasta la acción adicional. Falta: cambiar el ataque del garrote o bastón (aptitud mágica en vez de FUE, dado d8 → d10/d12/2d6 por nivel, daño de fuerza opcional).'],
  'true-strike': ['T', 'Falta: el ataque con tu arma usando la aptitud mágica y el daño radiante extra (1d6/2d6/3d6 a niveles 5/11/17).'],
  'minor-illusion': ['S', 'Narrativo: lleva el minuto; la CD se ve en el aviso.'],
  'sacred-flame': ['T', 'Falta: salvación de DES (sin cobertura) y 1d8 radiante con escalado.'],
  'dancing-lights': ['S', 'Narrativo: lleva la concentración (1 min).'],
  light: ['S', 'Narrativo: lleva la hora.'],
  'mage-hand': ['S', 'Narrativo: lleva el minuto.'],
  message: ['S', 'Narrativo.'],
  guidance: ['P', 'Lleva la concentración (1 min). Falta: recordar +1d4 a la prueba de la habilidad elegida.'],
  'spare-the-dying': ['S', 'Estabiliza a otro: no hay números en tu ficha. (No muestra el alcance que sube con el nivel: 30/60/120 pies.)'],
  prestidigitation: ['S', 'Narrativo. (Crea siempre un efecto de 1 h aunque elijas una opción instantánea.)'],
  'ray-of-frost': ['T', 'Falta: el ataque (1d8 de frío con escalado) y la velocidad −10 pies del objetivo.'],
  mending: ['S', 'Narrativo (tiempo de lanzamiento de 1 min: no aparece en combate, bien).'],
  resistance: ['P', 'Lleva la concentración (1 min). Falta: restar 1d4 al daño de ese tipo cuando lo recibes (el botón de daño no lo recuerda).'],
  'poison-spray': ['T', 'Falta: el ataque (1d12 de veneno con escalado).'],
  'acid-splash': ['T', 'Falta: salvación de DES y 1d6 de ácido con escalado.'],
  thaumaturgy: ['S', 'Narrativo (la ventaja en Intimidación de «Voz atronadora» queda en el texto).'],
  'chill-touch': ['T', 'Falta: el ataque (1d10 necrótico con escalado) y que el objetivo no puede curarse.'],
  // Nivel 1
  alarm: ['S', 'Narrativo: ritual y 8 h.'],
  'animal-friendship': ['P', 'Lleva las 24 h. El estado hechizado de la bestia y la salvación quedan en el texto; +1 bestia por nivel de espacio.'],
  'mage-armor': ['S', 'CA 13 + DES mientras dure (8 h); avisa si llevas armadura; con Armadura de sombras se lanza gratis. (Si lo lanzas sobre otra criatura, la app también sube tu CA.)'],
  goodberry: ['P', 'Lleva las 24 h. Falta: las 10 bayas como objeto consumible (1 PG cada una con acción adicional y comida del día) que desaparezcan al acabar.'],
  bless: ['P', 'Lleva la concentración (1 min). Falta: recordar +1d4 a ataques y salvaciones; +1 objetivo por nivel de espacio.'],
  'searing-smite': ['P', 'Lleva el minuto y gasta la acción adicional. Falta: 1d6 de fuego extra al impactar, 1d6 al principio de cada turno del objetivo y su salvación de CON para apagarlo; +1d6 por nivel.'],
  'divine-smite': ['T', 'Gasta la acción adicional y el uso gratis de Castigo del paladín. Falta: el daño (2d8 radiante, +1d8 contra infernales y muertos vivientes, +1d8 por nivel de espacio).'],
  'feather-fall': ['S', 'Narrativo: reacción, 1 min.'],
  'comprehend-languages': ['S', 'Narrativo: ritual, 1 h.'],
  'create-or-destroy-water': ['S', 'Narrativo.'],
  'ice-knife': ['T', 'Falta: el ataque (1d10 perforante) y la salvación de DES en área (2d6 de frío, +1d6 por nivel).'],
  'cure-wounds': ['T', 'Falta: la curación (2d8 + aptitud, +2d8 por nivel). No ofrece sumarla a tus PG ni a los de tu criatura.'],
  'detect-evil-and-good': ['S', 'Narrativo: concentración, 10 min.'],
  'detect-magic': ['S', 'Narrativo: concentración, 10 min, ritual.'],
  'detect-poison-and-disease': ['S', 'Narrativo: concentración, 10 min, ritual.'],
  'floating-disk': ['S', 'Narrativo: ritual, 1 h.'],
  'disguise-self': ['S', 'Narrativo: 1 h (la CD de Investigación se ve en el aviso).'],
  sleep: ['P', 'Lleva la concentración (1 min). Falta: recordar que el objetivo repite la salvación al final de su siguiente turno (de incapacitado pasa a inconsciente).'],
  'find-familiar': ['S', 'Botón «Crear el familiar», gasta el incienso y se puede lanzar como ritual.'],
  entangle: ['P', 'Lleva la concentración (1 min). El estado apresado, la salvación de FUE y la prueba de Atletismo para soltarse quedan en el texto.'],
  'illusory-script': ['S', 'Narrativo: ritual, 10 días, gasta la tinta.'],
  shield: ['P', 'Gasta la reacción y crea un efecto de 1 ronda. Falta: +5 a la CA (no se suma) y que dure hasta el principio de tu siguiente turno (la app lo quita al final de tu siguiente turno).'],
  'shield-of-faith': ['P', 'Lleva la concentración (10 min). Falta: +2 a la CA si te lo lanzas a ti.'],
  'false-life': ['S', 'Pide la tirada de 2d4, suma 4 (+5 por nivel de espacio) y aplica los PG temporales sin acumular; con Vigor infernal da el máximo sin tirar.'],
  'divine-favor': ['P', 'Lleva el minuto. Falta: +1d4 radiante en tus ataques con armas mientras dura.'],
  'faerie-fire': ['P', 'Lleva la concentración (1 min). La salvación de DES y la ventaja contra los perfilados quedan en el texto.'],
  'ensnaring-strike': ['P', 'Lleva la concentración (1 min). Falta: salvación de FUE, estado apresado y 1d6 perforante al principio de cada turno del objetivo (+1d6 por nivel).'],
  grease: ['P', 'Lleva el minuto. La salvación de DES al entrar o acabar el turno en la grasa y el derribo quedan en el texto.'],
  'speak-with-animals': ['S', 'Narrativo: ritual, 10 min.'],
  'charm-person': ['P', 'Lleva la hora. El estado hechizado (salvación con ventaja si lucháis) queda en el texto; +1 objetivo por nivel.'],
  heroism: ['P', 'Lleva la concentración (1 min). Falta: PG temporales iguales a tu aptitud al principio de cada turno del objetivo e inmunidad a asustado.'],
  identify: ['S', 'Narrativo: ritual.'],
  'silent-image': ['S', 'Narrativo: concentración, 10 min.'],
  'inflict-wounds': ['T', 'Falta: salvación de CON y 2d10 necrótico (+1d10 por nivel).'],
  hex: ['P', 'Lleva la concentración y gasta la acción adicional. Falta: 1d6 necrótico extra en tus impactos, pasar la maldición a otro con acción adicional y la duración larga con espacio de nivel 2+ (4 h, 8 h, 24 h): la app pone siempre 1 h y un descanso corto lo termina.'],
  'burning-hands': ['T', 'Falta: salvación de DES y 3d6 de fuego (+1d6 por nivel).'],
  'hunters-mark': ['P', 'Lleva la concentración, gasta la acción adicional y descuenta los usos gratis de Enemigo predilecto. Falta: 1d6 de fuerza extra en tus impactos, pasar la marca y la duración larga con espacio de nivel 3+ (8 h, 24 h).'],
  'fog-cloud': ['S', 'Narrativo: concentración, 1 h (el radio que sube con el nivel queda en el texto).'],
  thunderwave: ['T', 'Falta: salvación de CON, 2d8 de trueno (+1d8 por nivel) y empuje.'],
  'chromatic-orb': ['T', 'Falta: el ataque (3d8 del tipo elegido, +1d8 por nivel) y los saltos.'],
  command: ['T', 'Falta: salvación de SAB y la orden; +1 objetivo por nivel.'],
  'healing-word': ['T', 'Falta: la curación (2d4 + aptitud, +2d4 por nivel). No ofrece sumarla a tus PG.'],
  bane: ['P', 'Lleva la concentración (1 min). La salvación de CAR y el −1d4 a los objetivos quedan en el texto.'],
  'protection-from-evil-and-good': ['P', 'Gasta el agua bendita y lleva los 10 min. ERROR DE DATOS: no está marcado como concentración (en 2024 sí la requiere), así que la app no la lleva ni pide la salvación al recibir daño. La desventaja a esos atacantes queda en el texto.'],
  'magic-missile': ['T', 'Falta: el daño (3 dardos de 1d4 + 1, +1 dardo por nivel). Impactan siempre.'],
  'purify-food-and-drink': ['S', 'Narrativo: ritual.'],
  'ray-of-sickness': ['T', 'Falta: el ataque (2d8 de veneno, +1d8 por nivel) y el estado envenenado.'],
  'hellish-rebuke': ['T', 'Gasta la reacción. Falta: salvación de DES y 2d10 de fuego (+1d10 por nivel).'],
  'expeditious-retreat': ['P', 'Lleva la concentración (10 min). Falta: ofrecer «Correr» como acción adicional en tu turno mientras dura.'],
  'hideous-laughter': ['P', 'Lleva la concentración (1 min). Falta: recordar la salvación de SAB al final de cada turno del objetivo y al recibir daño.'],
  'color-spray': ['T', 'Falta: salvación de CON y el estado cegado hasta el final de tu siguiente turno.'],
  'guiding-bolt': ['P', 'Crea un efecto de 1 ronda, pero lo quita al final del mismo turno en que lo lanzas (la ventaja dura hasta el final de tu siguiente turno). Falta: el ataque (4d6 radiante, +1d6 por nivel).'],
  jump: ['S', 'Narrativo: lleva el minuto (el salto de 30 pies queda en el texto).'],
  sanctuary: ['P', 'Lleva el minuto. Falta: recordar que termina si el protegido ataca, lanza un conjuro o hace daño.'],
  'unseen-servant': ['S', 'Narrativo: ritual, 1 h.'],
  'dissonant-whispers': ['T', 'Falta: salvación de SAB y 3d6 psíquico (+1d6 por nivel).'],
  longstrider: ['P', 'Lleva la hora. Falta: +10 pies a tu velocidad si te lo lanzas a ti.'],
  // Nivel 2–9 que lo automático no acierta o que conviene detallar
  'find-steed': ['S', 'Botón «Crear la montura» con CA, PG y ataque según el nivel del espacio y el tipo elegido.'],
  'summon-dragon': ['S', 'Botón «Crear la criatura»: CA, PG y ataques según el nivel; desaparece al perder la concentración.'],
  'giant-insect': ['S', 'Botón «Crear la criatura»: CA, PG y ataques según el nivel; desaparece al perder la concentración.'],
  polymorph: ['P', 'Botón «Elegir forma»: si te lo lanzas a ti, te transforma en una forma guardada y da sus PG como temporales. Sobre otra criatura, todo queda en el texto (salvación de SAB).'],
  'true-polymorph': ['P', 'Botón «Elegir forma» (sobre ti). Lo demás (objetos, criaturas, hacerlo permanente) queda en el texto.'],
  shapechange: ['P', 'Botón «Elegir forma» con PG temporales. Cambiar de forma como acción adicional queda a mano.'],
  'spiritual-weapon': ['P', 'Lleva la concentración y gasta la acción adicional. Falta: el ataque del arma (1d8 + aptitud, +1d8 por nivel) en tu lista de ataques y en la acción adicional de cada turno.'],
  'flame-blade': ['P', 'Lleva la concentración. Falta: el ataque de la hoja (3d6 de fuego + aptitud, +1d6 por nivel) en tu lista de ataques.'],
  'magic-weapon': ['P', 'Lleva la hora. Falta: +1 (+2 a nivel 4, +3 a nivel 6) a ataque y daño del arma tocada.'],
  barkskin: ['P', 'Lleva la hora. Falta: que tu CA no baje de 17.'],
  aid: ['P', 'Lleva las 8 h. Falta: subir 5 los PG máximos y actuales (+5 por nivel) y quitarlos al acabar.'],
  haste: ['P', 'Lleva la concentración. Falta: +2 CA, velocidad doble, ventaja en salvaciones de DES, la acción extra limitada y el turno perdido al terminar.'],
  'mirror-image': ['P', 'Lleva el minuto. Falta: contar los 3 duplicados y la tirada para desviar cada ataque.'],
  blur: ['P', 'Lleva la concentración. Los atacantes tienen desventaja contra ti (queda en el texto).'],
  'misty-step': ['S', 'Narrativo: teletransporte de 30 pies con acción adicional.'],
  'enhance-ability': ['P', 'Lleva la concentración. Falta: ventaja en las pruebas de la característica elegida.'],
  'protection-from-energy': ['P', 'Lleva la concentración. Falta: la resistencia al tipo de daño elegido (el botón de daño no la aplica).'],
  stoneskin: ['P', 'Gasta el polvo de diamante y lleva la concentración. Falta: resistencia al daño contundente, perforante y cortante.'],
  'death-ward': ['P', 'Lleva las 8 h. Falta: que la primera vez que bajes a 0 PG te quedes con 1.'],
  'fire-shield': ['P', 'Lleva los 10 min. Falta: la resistencia elegida y el daño de 2d8 a quien te golpee cuerpo a cuerpo.'],
  'warding-bond': ['P', 'Lleva la hora. Falta: +1 CA y a salvaciones, resistencia a todo el daño y el daño compartido.'],
  'spirit-guardians': ['P', 'Lleva la concentración. Falta: recordar el daño (3d8, +1d8 por nivel) y la salvación de SAB de los enemigos que entren o empiecen allí.'],
  'beacon-of-hope': ['P', 'Lleva la concentración. Falta: que tus curaciones den el máximo y la ventaja en salvaciones de SAB y contra la muerte.'],
  fly: ['P', 'Lleva la concentración. Falta: velocidad de vuelo de 60 pies.'],
  'greater-invisibility': ['P', 'Lleva la concentración. Falta: el estado invisible en tu ficha.'],
  invisibility: ['P', 'Lleva la concentración. Falta: el estado invisible en tu ficha y que termine al atacar, hacer daño o lanzar un conjuro.'],
  'animate-dead': ['P', 'Solo gasta el espacio. Los no muertos se crean a mano en Criaturas (hay plantilla «Otra criatura»); la orden diaria para mantenerlos no se recuerda.'],
  'conjure-animals': ['P', 'Lleva la concentración. Falta: recordar el daño (3d10) y la salvación de DES al moverse la manada.'],
  heal: ['T', 'Falta: curar 70 PG (+10 por nivel) y quitar cegado, ensordecido y envenenado.'],
  'pass-without-trace': ['P', 'Lleva la concentración. Falta: +10 a las pruebas de DES (Sigilo) mientras dura.'],
  'protection-from-poison': ['P', 'Lleva la hora. Falta: quitar el estado envenenado, la resistencia al veneno y la ventaja contra quedar envenenado.'],
  'lesser-restoration': ['T', 'Falta: quitar el estado (cegado, ensordecido, paralizado o envenenado) si te lo lanzas a ti.'],
  'greater-restoration': ['T', 'Gasta el polvo de diamante. Falta: quitar el agotamiento o el efecto elegido si te lo lanzas a ti.'],
  blink: ['P', 'Lleva el minuto. Falta: recordar la tirada de 1d20 al final de cada turno (con 11+ pasas al plano Etéreo).'],
  'aura-of-life': ['P', 'Lleva la concentración. Falta: resistencia al necrótico, que tus PG máximos no bajen y que los aliados a 0 PG recuperen 1.'],
  'dimension-door': ['S', 'Narrativo: teletransporte (el daño si el destino está ocupado queda en el texto).'],
  'freedom-of-movement': ['P', 'Lleva la hora. Falta: que no te afecten paralizado ni apresado y no pierdas movimiento por terreno difícil.'],
  'guardian-of-faith': ['P', 'Lleva las 8 h. Falta: recordar el daño (20 radiante con salvación de DES, hasta 60 en total) a los enemigos que se acerquen.'],
  mislead: ['P', 'Lleva la concentración. Falta: el estado invisible en tu ficha.'],
  'create-undead': ['P', 'Solo gasta el espacio. Los no muertos se crean a mano en Criaturas; la orden diaria para mantenerlos no se recuerda.'],
  'heroes-feast': ['P', 'Gasta el cuenco. Falta: +2d10 a los PG máximos y actuales durante 24 h, inmunidad al veneno y a asustado.'],
  'raise-dead': ['P', 'Gasta el diamante. Falta: la penalización de −4 a las pruebas d20 que baja 1 en cada descanso largo.'],
  resurrection: ['P', 'Gasta el diamante. Falta: la penalización de −4 a las pruebas d20 que baja 1 en cada descanso largo.'],
  teleport: ['S', 'Narrativo (el daño de un error de destino queda en el texto).'],
  glibness: ['P', 'Lleva la hora. Falta: que tus pruebas de Carisma valgan como mínimo 15.'],
  demiplane: ['S', 'Narrativo: lleva la hora.'],
  foresight: ['P', 'Lleva las 8 h. Falta: ventaja en tus pruebas d20 y desventaja en los ataques contra ti.'],
  wish: ['T', 'Narrativo en general; el estrés de usarlo para otra cosa (daño necrótico al lanzar conjuros, FUE 3 durante 2d4 días, 33 % de perderlo) queda en el texto.'],
};

/* ---------- Clasificación ---------- */
function classify(s) {
  const sp = special(s);
  const f = mech(s);
  const d = parseDur(s.d);
  const gen = [];
  gen.push(s.l === 0 ? 'truco (sin espacio)' : 'gasta el espacio');
  if (s.ri) gen.push('ritual');
  if (s.k) gen.push('concentración');
  if (d) gen.push(`efecto de ${d.r != null ? d.r + ' ronda(s)' : d.inf ? 'duración indefinida' : d.m + ' min'}`);
  const miss = Object.keys(MECH_LBL).filter(k => f[k]);
  let estado, nota;
  if (MANUAL[s.id]) [estado, nota] = MANUAL[s.id];
  else {
    const mechMiss = miss.filter(k => k !== 'adv' || miss.length === 1);
    if (!mechMiss.length) {
      estado = 'S';
      nota = 'Narrativo: no hay números que aplicar' + (d ? '; lleva la duración' : '') + '.';
    } else if (d || sp.length) {
      estado = 'P';
      nota = `Lleva ${d ? (s.k ? 'la concentración y la duración' : 'la duración') : 'parte'}. Falta: ${mechMiss.map(k => MECH_LBL[k]).join(', ')}${f.upcast ? '; escalado por nivel de espacio' : ''}.`;
    } else {
      estado = 'T';
      nota = `Falta: ${mechMiss.map(k => MECH_LBL[k]).join(', ')}${f.upcast ? '; escalado por nivel de espacio' : ''}${f.cantrip ? '; escalado por nivel' : ''}.`;
    }
    if (sp.length) nota = sp.join('; ').replace(/^./, m => m.toUpperCase()) + '. ' + nota;
  }
  return { s, f, d, sp, gen, estado, nota, manual: !!MANUAL[s.id], refs: codeRefs(s.id) };
}
const R = SPELLS.map(classify);
const EST = { S: 'Sola', P: 'Parcial', T: 'Solo texto' };

/* ---------- Datos que no cuadran ---------- */
const avisos = [];
for (const r of R) {
  const s = r.s;
  if (/^hasta \d/i.test(s.d) && !s.k && !['prestidigitation', 'thaumaturgy', 'etherealness'].includes(s.id))
    avisos.push(`${s.id}: duración «${s.d}» pero sin concentración (k:false)`);
  if (s.k && !/^hasta/i.test(s.d)) avisos.push(`${s.id}: concentración pero duración «${s.d}»`);
  if (!['A', 'AA', 'R'].includes(s.t) && !/^\d+ (minutos?|horas?)$/.test(s.t)) avisos.push(`${s.id}: tiempo «${s.t}» raro`);
  if (s.d !== 'Instantánea' && s.d !== 'Especial' && !r.d) avisos.push(`${s.id}: parseDur no entiende «${s.d}»`);
}
for (const ref of SUMMON_REFS) if (!IDS.has(ref)) avisos.push(`SUMMONS usa ref «${ref}», que no está en data/spells.js: no se puede lanzar desde el catálogo`);
for (const id of CONSUME) if (!IDS.has(id)) avisos.push(`SP_CONSUME usa «${id}», que no está en data/spells.js`);

/* ---------- Salida ---------- */
const byL = {};
for (const r of R) {
  const o = (byL[r.s.l] ??= { S: 0, P: 0, T: 0, n: 0 });
  o[r.estado]++;
  o.n++;
}
const tot = { S: 0, P: 0, T: 0, n: 0 };
Object.values(byL).forEach(o => ['S', 'P', 'T', 'n'].forEach(k => (tot[k] += o[k])));

const pat = {
  cantrip: R.filter(r => r.f.cantrip && (r.f.dmg || r.f.extra)),
  upcast: R.filter(r => r.f.upcast && r.s.l > 0),
  dmgInst: R.filter(r => (r.f.dmg || r.f.extra) && !r.d),
  heal: R.filter(r => r.f.heal),
  temp: R.filter(r => r.f.temp),
  repeat: R.filter(r => r.f.repeat),
  repeatConc: R.filter(r => r.f.repeat && r.s.k),
  ac: R.filter(r => r.f.ac),
  d20: R.filter(r => r.f.d20),
  extra: R.filter(r => r.f.extra && r.d),
  cond: R.filter(r => r.f.cond),
  speed: R.filter(r => r.f.speed),
  atk: R.filter(r => r.f.atk),
  conc: R.filter(r => r.s.k),
  ritual: R.filter(r => r.s.ri),
  long: R.filter(r => r.d && r.d.m > 480),
  hlDur: R.filter(r => /(concentraci[oó]n|duraci[oó]n|dura)[^.]*(puede durar|m[aá]s|hasta \d+ horas)/i.test(r.s.hl)),
};
const names = list => list.map(r => r.s.n).join(', ');

if (process.argv.includes('--md')) {
  const L = [];
  L.push('| Nivel | Conjuros | Sola | Parcial | Solo texto |', '|---|---|---|---|---|');
  for (let l = 0; l <= 9; l++) {
    const o = byL[l];
    L.push(`| ${l === 0 ? '0 (trucos)' : l} | ${o.n} | ${o.S} | ${o.P} | ${o.T} |`);
  }
  L.push(`| **Total** | **${tot.n}** | **${tot.S}** | **${tot.P}** | **${tot.T}** |`, '');
  L.push('<!-- tabla 0-1 -->');
  for (const l of [0, 1]) {
    L.push(`\n### ${l === 0 ? 'Trucos' : 'Nivel 1'}\n`, '| Conjuro | Estado | Qué hace / qué falta |', '|---|---|---|');
    for (const r of R.filter(r => r.s.l === l).sort((a, b) => a.s.n.localeCompare(b.s.n, 'es')))
      L.push(`| ${r.s.n} | ${EST[r.estado]} | ${r.nota.replace(/\|/g, '/')} |`);
  }
  L.push('\n<!-- listas 2-9 -->');
  for (let l = 2; l <= 9; l++) {
    L.push(`\n### Nivel ${l}\n`);
    for (const e of ['S', 'P', 'T']) {
      const xs = R.filter(r => r.s.l === l && r.estado === e).sort((a, b) => a.s.n.localeCompare(b.s.n, 'es'));
      if (!xs.length) continue;
      L.push(
        `**${EST[e]} (${xs.length}):** ` +
          xs
            .map(r =>
              e === 'S' && !r.manual && !r.sp.length
                ? r.s.n
                : `${r.s.n} (${r.nota
                    .replace(/^Lleva (la concentración y la duración|la duración|parte)\. /, '')
                    .replace(/^Falta: /, 'falta: ')
                    .replace(/\.$/, '')})`
            )
            .join('; ') +
          '.',
        ''
      );
    }
  }
  L.push('<!-- patrones -->');
  for (const [k, v] of Object.entries(pat)) L.push(`- ${k} (${v.length}): ${names(v)}`);
  L.push('', '<!-- avisos -->', ...avisos.map(a => '- ' + a));
  console.log(L.join('\n'));
} else {
  console.log(`Conjuros: ${R.length}`);
  for (let l = 0; l <= 9; l++) {
    const o = byL[l];
    console.log(`  Nivel ${l}: ${o.n} · sola ${o.S} · parcial ${o.P} · solo texto ${o.T}`);
  }
  console.log(`  Total: sola ${tot.S} · parcial ${tot.P} · solo texto ${tot.T}`);
  console.log('\nTratamiento propio en el código:');
  for (const r of R.filter(r => r.sp.length)) console.log(`  · ${r.s.n} (${r.s.id}): ${r.sp.join('; ')}`);
  console.log('\nPatrones:');
  for (const [k, v] of Object.entries(pat)) console.log(`  · ${k}: ${v.length}`);
  console.log('\nDatos que no cuadran:');
  avisos.forEach(a => console.log('  ✗ ' + a));
  const sinMirar = R.filter(r => r.refs.length && !r.sp.length && !r.manual);
  if (sinMirar.length)
    console.log('\nIds que aparecen en js/ sin clasificación propia (revisar):\n' + sinMirar.map(r => `  · ${r.s.id}: ${r.refs.join(', ')}`).join('\n'));
}

/* ---------- Comprobación en la app (opcional) ---------- */
if (process.argv.includes('--app')) appCheck().catch(e => {
  console.error(e);
  process.exitCode = 1;
});

async function appCheck() {
  const { spawn } = require('child_process');
  const PORT = 8782;
  process.env.FICHAS_URL = `http://localhost:${PORT}/`;
  const srv = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 800));
  const B = require('./base');
  const res = [];
  const ok = (cond, t) => res.push(`${cond ? '✓' : '✗'} ${t}`);
  let app;
  try {
    app = await B.abrir();
    const { page } = app;
    const leer = n => JSON.parse(fs.readFileSync(path.join(B.FICHAS, n), 'utf8'));
    const cast = (ref, extra) =>
      page.evaluate(
        ([ref, extra]) => {
          const c = C();
          let i = c.spells.findIndex(s => s.ref === ref);
          if (i < 0) {
            c.spells.push(spellObj(SPBY[ref]));
            i = c.spells.length - 1;
          }
          Object.assign(c, extra || {});
          A.cast({ dataset: { i } });
          const m = document.getElementById('modal');
          if (!m.hidden) {
            const b = m.querySelector('[data-act="cast-with"]:not([disabled]):not([data-kind="ritual"])');
            if (b) A['cast-with'](b);
          }
          return JSON.parse(JSON.stringify(C()));
        },
        [ref, extra]
      );

    // Zyo con espacio de pacto de nivel 2 (como un brujo de nivel 3): Maleficio
    await B.importar(page, leer('zyo.json'));
    let c = await cast('hex', { pact: { level: 2, total: 2, used: 0 } });
    const hx = c.effects.find(e => e.name === 'Maleficio');
    ok(c.concentration === 'Maleficio', 'Maleficio: queda en concentración');
    ok(hx && hx.m === 240, `Maleficio con espacio de nivel 2 dura 4 h (la app pone ${hx ? hx.m + ' min' : 'nada'})`);
    c = await page.evaluate(() => {
      A['short-done']();
      return JSON.parse(JSON.stringify(C()));
    });
    ok(c.concentration === 'Maleficio', `Maleficio de 4 h sigue tras un descanso corto (concentración: «${c.concentration}»)`);
    const atk0 = c.attacks.length;
    c = await cast('eldritch-blast');
    ok(c.attacks.length > atk0, 'Estallido arcano añade o usa un ataque con su daño');

    // Mago: Escudo, Armadura de mago, Protección contra el bien y el mal, Saeta guía, Curar heridas
    await B.importar(page, leer('mago.json'));
    const ac0 = await page.evaluate(() => acOf(C()));
    await cast('shield', { slots: Array.from({ length: 9 }, (_, i) => ({ total: i < 2 ? 3 : 0, used: 0 })) });
    const ac1 = await page.evaluate(() => acOf(C()));
    ok(ac1 === ac0 + 5, `Escudo sube la CA en 5 (antes ${ac0}, después ${ac1})`);
    await page.evaluate(() => A['t-end']());
    c = await page.evaluate(() => JSON.parse(JSON.stringify(C())));
    res.push(
      `ℹ Escudo (1 ronda) ${c.effects.some(e => e.name === 'Escudo') ? 'sigue' : 'se quita'} tras pulsar «Terminar turno» una vez: lanzado como reacción en el turno de un enemigo, sigue visible todo tu turno siguiente (debería acabar al empezarlo)`
    );
    await cast('mage-armor');
    const ac2 = await page.evaluate(() => [acOf(C()), 13 + M(C(), 'dex'), wearsBodyArmor(C())]);
    ok(ac2[2] || ac2[0] >= ac2[1], `Armadura de mago: CA ${ac2[0]} (13 + DES = ${ac2[1]})`);
    c = await cast('protection-from-evil-and-good', { equipment: [] });
    ok(
      c.concentration === 'Protección contra el bien y el mal',
      `Protección contra el bien y el mal pide concentración (concentración: «${c.concentration}»)`
    );
    c = await cast('guiding-bolt');
    ok(c.effects.some(e => e.name === 'Saeta guía'), 'Saeta guía crea un efecto de 1 ronda');
    c = await page.evaluate(() => {
      A['t-end']();
      return JSON.parse(JSON.stringify(C()));
    });
    ok(c.effects.some(e => e.name === 'Saeta guía'), 'La ventaja de Saeta guía sigue tras terminar el turno en que se lanza');
    const hp0 = await page.evaluate(() => {
      C().hp.current = 1;
      return 1;
    });
    c = await cast('cure-wounds');
    ok(c.hp.current > hp0 || (await page.evaluate(() => !document.getElementById('modal').hidden)), 'Curar heridas ofrece aplicar la curación');
    ok(!app.errores.length, `Sin errores de consola${app.errores.length ? ': ' + app.errores.join(' | ') : ''}`);
  } finally {
    if (app) await app.browser.close();
    srv.kill();
  }
  console.log('\nComprobación en la app (✗ = la app no lo hace o lo hace mal):');
  res.forEach(t => console.log('  ' + t));
}
