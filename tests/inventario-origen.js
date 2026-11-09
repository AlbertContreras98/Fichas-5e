/* Inventario de dotes, invocaciones, especies, trasfondos y objetos (prueba 1a): primera criba de qué usa el código de cada entrada.
   Uso: node tests/inventario-origen.js [--json]   La clasificación final (Sola / Parcial / Solo texto) está revisada a mano en tests/inventario-origen.md. */
'use strict';
const fs = require('fs'),
  path = require('path'),
  vm = require('vm');
const ROOT = path.join(__dirname, '..');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

/* Datos: feats/invocations/origins cuelgan de window.*; items.js declara const de nivel superior, que se sacan al final */
const ctx = { window: {} };
vm.createContext(ctx);
for (const f of ['data/feats.js', 'data/invocations.js', 'data/origins.js']) vm.runInContext(rd(f), ctx);
vm.runInContext(
  rd('data/items.js') +
    '\n;window.ITEMS={POTIONS,ARMORS,MASTERY,AMMO,WEAPONS,TOOLS,GEAR,MAGIC,PACKS,BG_KITS,CLASS_KITS};',
  ctx
);
const { FEATS, INVOCS, SPECIES, BACKGROUNDS, ITEMS } = ctx.window;

/* Código de la app (sin el modo máster, que no toca la ficha) */
const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.js') && !/master\.js$/.test(p)) files.push(p);
  }
})(path.join(ROOT, 'js'));
const src = files.map(f => [path.relative(ROOT, f), fs.readFileSync(f, 'utf8').split('\n')]);
const norm = s =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
function hits(re) {
  const out = [];
  for (const [f, lines] of src)
    lines.forEach((l, i) => {
      if (re.test(l)) out.push(`${f}:${i + 1}`);
    });
  return out;
}
const lit = s => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

/* ── Campos de las dotes y quién los lee ── */
const FEAT_FIELDS = {
  ab: /f\.ab\b/,
  initPB: /\.initPB/,
  hpPerLevel: /hpPerLevel/,
  hp: /f\.hp\b/,
  speed: /f\.speed|featSpeed/,
  acArmor: /'acArmor'/,
  mam: /'mam'/,
  rangedAtk: /'rangedAtk'/,
  heavyPB: /'heavyPB'/,
  duel: /'duel'/,
  thrown: /'thrown'/,
  twf: /'twf'/,
  gwf: /'gwf'/,
  save: /f\.save\b/,
  skills: /f\.skills|FEATS\[k\]\.skills/,
  pe: /f\.pe\b/,
  exp: /f\.exp\b/,
  allSk: /f\.allSk/,
  armorProf: /armorProf/,
  wpnProf: /'wpnProf'|\['weapons', 'wpnProf'\]/,
  toolProf: /'toolProf'/,
  res: /\.res\b/,
  sp: /f\.sp\b/,
  spPick: /spPick/,
  opt: /f\.opt\b/,
};
/* Campos que solo valen para elegir la dote (requisitos), no hacen nada en partida */
const META = ['n', 'cat', 'text', 'req', 'rep', 'magic'];
/* Campos que la app solo enseña como nota (no cambian números) */
const NOTE_ONLY = ['duel', 'thrown', 'gwf', 'opt'];

const fieldUse = Object.fromEntries(Object.entries(FEAT_FIELDS).map(([k, re]) => [k, hits(re)]));

function featRow(k, f) {
  const fields = Object.keys(f).filter(x => !META.includes(x));
  const unused = fields.filter(x => !fieldUse[x] || !fieldUse[x].length);
  const mech = fields.filter(x => !NOTE_ONLY.includes(x) && x !== 'ab');
  const keyHits = hits(lit(`'${k}'`)).filter(h => !/data\//.test(h));
  // Primera criba: sin campos de mecánica → solo texto; con campos → parcial si el texto describe más cosas
  const extraText = f.text.replace(/\(la app[^)]*\)/g, '').split(/\.\s/).length;
  let pre = 'Solo texto';
  if (mech.length) pre = extraText > 2 ? 'Parcial' : 'Sola';
  else if (fields.length) pre = 'Parcial';
  return { k, n: f.n, cat: f.cat, fields, unused, keyHits, pre };
}

/* ── Invocaciones ── */
function invRow(d) {
  const nameHits = [d.n, ...(d.al || [])].flatMap(n => hits(new RegExp(n, 'i'))).filter(h => !/invocations\.js/.test(h));
  const auto = [d.sp && `conjuro gratis ${d.sp}${d.use ? ` (${d.use}/largo)` : ' (sin límite)'}`, d.pick && `elige ${d.pick}`]
    .filter(Boolean);
  let pre = 'Solo texto';
  if (d.sp && !/además|y tienes|velocidad/i.test(d.de)) pre = 'Sola';
  else if (d.sp || d.pick || nameHits.length) pre = 'Parcial';
  return { id: d.id, n: d.n, lv: d.lv, auto, nameHits, pre };
}

/* ── Especies y linajes: rasgos [nombre, texto] y qué se aplica solo ── */
function traitHits(n) {
  return hits(new RegExp(`'${n.replace(/[()]/g, '.')}'`)).filter(h => !/data\//.test(h));
}
function specRows() {
  const out = [];
  const one = (sk, lk, o) => {
    const auto = [];
    if (o.speed) auto.push(`velocidad ${o.speed}`);
    if (o.dv) auto.push(`visión en la oscuridad ${o.dv}`);
    if (o.hpPerLevel) auto.push(`+${o.hpPerLevel} PG/nivel`);
    if (o.extraSkill) auto.push(`+${o.extraSkill.n} habilidad`);
    if (o.spells) auto.push(`conjuros ${Object.values(o.spells).flat().join(', ')}`);
    if (o.res) auto.push(`usos: ${o.res.map(r => r.n).join(', ')}`);
    const traits = (o.traits || []).map(([n, t]) => ({
      n,
      hits: traitHits(n),
      resist: /resistencia al da/i.test(t),
      adv: /ventaja/i.test(t),
    }));
    out.push({ sk, lk: lk || '', n: o.n, auto, traits });
  };
  for (const [sk, s] of Object.entries(SPECIES)) {
    one(sk, '', s);
    for (const [lk, l] of Object.entries(s.lin || {})) one(sk, lk, l);
  }
  return out;
}

/* ── Trasfondos: herramienta que da y si el inventario la reconoce (misma lógica que toolProf en js/views/inventory.js) ── */
function toolProfLike(profText, T) {
  const t = norm(profText);
  return (
    t.includes(norm(T.n)) ||
    (T.vars && /instrumento/.test(t) && T === ITEMS.TOOLS.instrument) ||
    (T === ITEMS.TOOLS.gaming && /juego/.test(t))
  );
}
function bgRows() {
  return Object.entries(BACKGROUNDS).map(([k, b]) => {
    const tools = Object.entries(ITEMS.TOOLS).filter(([, T]) => toolProfLike(b.tool, T)).map(([tk]) => tk);
    const kitTools = ((ITEMS.BG_KITS[k] || {}).items || [])
      .map(([code]) => code)
      .filter(c => /^t:/.test(c))
      .map(c => c.slice(2));
    const notRecognized = kitTools.filter(t => !tools.includes(t));
    return { k, n: b.n, tool: b.tool, toolKeys: tools, kitTools, notRecognized, feat: b.feat, featFields: Object.keys(FEATS[b.feat] || {}).filter(x => !META.includes(x)) };
  });
}

/* ── Objetos ── */
function itemRows() {
  const W = Object.entries(ITEMS.WEAPONS).map(([k, w]) => ({ k, n: w.n, p: w.p, th: w.th || '', am: w.am ? w.am[0] : '', v: w.v || '', ms: w.ms }));
  const props = {};
  W.forEach(w => [...w.p, w.th && 'arrojadiza', w.am && 'munición', w.v && 'versátil'].filter(Boolean).forEach(p => (props[p] = (props[p] || 0) + 1)));
  const propCode = Object.fromEntries(
    Object.keys(props).map(p => [p, hits(new RegExp(`['"/]${p.split(' (')[0]}`, 'i')).filter(h => !/data\//.test(h))])
  );
  const masteryCode = Object.fromEntries(Object.keys(ITEMS.MASTERY).map(m => [m, hits(lit(`'${m}'`)).filter(h => !/data\//.test(h))]));
  return { weapons: W, props, propCode, masteryCode, armors: ITEMS.ARMORS, magic: ITEMS.MAGIC, potions: ITEMS.POTIONS, gear: ITEMS.GEAR };
}

const out = {
  feats: Object.entries(FEATS).map(([k, f]) => featRow(k, f)),
  fieldUse,
  invocations: INVOCS.map(invRow),
  species: specRows(),
  backgrounds: bgRows(),
  items: itemRows(),
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(out, null, 1));
  process.exit(0);
}

const cnt = (rows, key = 'pre') => rows.reduce((o, r) => ((o[r[key]] = (o[r[key]] || 0) + 1), o), {});
console.log('== Campos de dote sin código que los lea ==');
for (const [k, h] of Object.entries(fieldUse)) if (!h.length) console.log('  ', k);
console.log('\n== Dotes (primera criba) ==', cnt(out.feats));
for (const r of out.feats) console.log(`  ${r.pre.padEnd(10)} ${r.n} [${r.fields.join(',')}]${r.keyHits.length ? ' · clave en ' + r.keyHits.join(' ') : ''}`);
console.log('\n== Invocaciones (primera criba) ==', cnt(out.invocations));
for (const r of out.invocations)
  console.log(`  ${r.pre.padEnd(10)} ${r.n} ${r.auto.join('; ')}${r.nameHits.length ? ' · nombre en ' + r.nameHits.join(' ') : ''}`);
console.log('\n== Especies y linajes ==');
for (const r of out.species)
  console.log(
    `  ${(r.sk + (r.lk ? '/' + r.lk : '')).padEnd(20)} auto: ${r.auto.join('; ') || '—'} · rasgos: ${r.traits.map(t => `${t.n}${t.hits.length ? ' (código: ' + t.hits.join(' ') + ')' : ' (solo texto)'}${t.resist ? ' [resistencia]' : ''}`).join(' | ')}`
  );
console.log('\n== Trasfondos: herramienta reconocida por el inventario ==');
for (const r of out.backgrounds)
  console.log(`  ${r.n.padEnd(12)} «${r.tool}» → ${r.toolKeys.join(',') || 'NINGUNA'}${r.notRecognized.length ? ' · ¡el kit da ' + r.notRecognized.join(',') + ' y no se reconoce la competencia!' : ''} · dote ${r.feat} [${r.featFields.join(',')}]`);
console.log('\n== Dotes con toolProf: ¿se reconoce la herramienta? ==');
for (const [k, f] of Object.entries(FEATS))
  if (f.toolProf)
    console.log(`  ${f.n.padEnd(14)} «${f.toolProf}» → ${Object.entries(ITEMS.TOOLS).filter(([, T]) => toolProfLike(f.toolProf, T)).map(([t]) => t).join(',') || 'NINGUNA'}`);
const it = out.items;
console.log('\n== Propiedades de arma: nº de armas · código que la mira ==');
for (const [p, n] of Object.entries(it.props)) console.log(`  ${p.padEnd(26)} ${String(n).padStart(2)} · ${it.propCode[p].slice(0, 6).join(' ') || '—'}`);
console.log('\n== Maestrías: código que mira cada una por su clave ==');
for (const [m, h] of Object.entries(it.masteryCode)) console.log(`  ${m.padEnd(8)} ${h.join(' ') || '— (solo texto en el aviso del ataque)'}`);
console.log(`\nArmaduras: ${Object.keys(it.armors).length} · Objetos mágicos: ${Object.keys(it.magic).length} · Pociones: ${Object.keys(it.potions).length} · Equipo con mecánica: ${Object.keys(it.gear).length}`);
