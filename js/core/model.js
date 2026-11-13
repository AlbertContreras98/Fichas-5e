/* Modelo de la ficha: personaje en blanco, importación/normalización y guardado en localStorage. */
'use strict';

function blank() {
  return {
    formato: 'fichas-dnd-2024/2',
    id: uid(),
    name: 'Nuevo personaje',
    species: '',
    speciesKey: '',
    lineageKey: '',
    background: '',
    backgroundKey: '',
    featKeys: [],
    featData: [],
    class: '',
    classKey: '',
    subclass: '',
    subclassKey: '',
    level: 1,
    xp: 0,
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    saveProf: [],
    skills: {},
    ac: 10,
    acBonus: 0,
    speedFt: 30,
    size: 'M',
    initiativeBonus: 0,
    hp: { max: 8, current: 8, temp: 0 },
    hitDice: { die: 'd8', total: 1, spent: 0 },
    deathSaves: { success: 0, fail: 0 },
    inspiration: false,
    exhaustion: 0,
    conditions: [],
    concentration: '',
    effects: [],
    companions: [],
    attacks: [],
    spellcasting: { ability: '' },
    slots: Array.from({ length: 9 }, () => ({ total: 0, used: 0 })),
    pact: { level: 0, total: 0, used: 0 },
    spells: [],
    features: [],
    equipment: [],
    coins: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    languages: '',
    proficiencies: { armor: '', weapons: '', tools: '' },
    notes: '',
    story: { img: '', alignment: '', age: '', appearance: '', personality: '', history: '' },
    turn: { a: false, aa: false, r: false, atk: 0 },
    combat: null,
    diary: { items: [] },
  };
}
const NEW = {
  attacks: () => ({ name: '', atk: 0, dmg: '', type: '', notes: '', ammo: '' }),
  spells: () => ({
    level: 0,
    name: '',
    time: 'A',
    range: '',
    dur: '',
    conc: false,
    ritual: false,
    material: '',
    desc: '',
    ref: '',
    src: '',
    free: '',
    atwill: false,
    hd: '',
    wpn: null,
  }),
  features: () => ({ name: '', source: '', text: '', when: '', uses: { max: 0, used: 0, recover: '' } }),
  equipment: () => ({ id: uid(), name: '', qty: 1, cat: 'otro', notes: '' }),
};
function guessCat(n) {
  n = norm(n);
  if (/flecha|virote|bala|dardo|aguja|municion/.test(n)) return 'municion';
  if (/pocion|elixir|antidoto|aceite/.test(n)) return 'pocion';
  if (/racion|comida|agua|odre|pan|queso|vino/.test(n)) return 'comida';
  if (
    /daga|espada|hoz|arco|ballesta|hacha|lanza|maza|martillo|baston|jabalina|cimitarra|estoque|honda|latigo|tridente|alabarda|garrote|mangual/.test(
      n
    )
  )
    return 'arma';
  if (/armadura|escudo|cota|cuero|coraza|placas|malla/.test(n)) return 'armadura';
  if (/kit|util|herramienta|instrumento|laud|flauta/.test(n)) return 'herramienta';
  if (/gema|joya|anillo|collar|idolo/.test(n)) return 'tesoro';
  return 'otro';
}
function matchSpell(name) {
  const cands = [norm(name)];
  const m = String(name || '').match(/\(([^)]+)\)/);
  if (m) cands.push(norm(m[1]));
  cands.push(norm(String(name || '').replace(/\s*\(.*\)\s*/, '')));
  const d = SP.find(s => cands.includes(norm(s.n)) || cands.includes(norm(s.en)));
  return d ? d.id : '';
}
function keyFrom(tbl, name) {
  const n = norm(name);
  if (!n) return '';
  for (const k in tbl) if (n === norm(tbl[k].n) || n.startsWith(norm(tbl[k].n))) return k;
  return '';
}
function classKeyFrom(name) {
  const n = norm(name);
  if (!n) return '';
  for (const k in CL) {
    if (
      norm(CL[k].n) === n ||
      norm(CL[k].en) === n ||
      n.startsWith(norm(CL[k].n)) ||
      n.startsWith(norm(CL[k].en))
    )
      return k;
  }
  return '';
}
function normalize(src) {
  const c = Object.assign(blank(), JSON.parse(JSON.stringify(src || {}))),
    B = blank();
  for (const k of [
    'abilities',
    'hp',
    'hitDice',
    'deathSaves',
    'coins',
    'proficiencies',
    'spellcasting',
    'pact',
    'story',
    'turn',
    'diary',
  ])
    c[k] = Object.assign(B[k], c[k] || {});
  if (!Array.isArray(c.diary.items)) c.diary.items = [];
  if (!c.diary.items.length && String(c.notes || '').trim())
    c.diary.items.push({
      id: uid(),
      type: 'note',
      name: 'Notas',
      parent: null,
      text: c.notes,
      updated: Date.now(),
    });
  if (typeof c.skills !== 'object' || !c.skills || Array.isArray(c.skills)) c.skills = {};
  for (const k of ['saveProf', 'conditions', 'attacks', 'spells', 'features', 'equipment'])
    if (!Array.isArray(c[k])) c[k] = [];
  const sl = Array.isArray(c.slots) ? c.slots : [];
  c.slots = Array.from({ length: 9 }, (_, i) => ({
    total: +(sl[i] && sl[i].total) || 0,
    used: +(sl[i] && sl[i].used) || 0,
  }));
  c.attacks = c.attacks.map(x => Object.assign(NEW.attacks(), x));
  c.spells = c.spells.map(x => {
    const s = Object.assign(NEW.spells(), x);
    if (s.time === 'BA') s.time = 'AA';
    if (!s.ref) s.ref = matchSpell(s.name);
    if (s.ref && SPBY[s.ref]) s.material = SPBY[s.ref].m;
    return s;
  });
  c.equipment = c.equipment.map(x => {
    const e = Object.assign(NEW.equipment(), x);
    if (!x.cat) e.cat = guessCat(e.name);
    if (!x.id) e.id = uid();
    if (e.cat === 'arma' && x.equipped === undefined) e.equipped = true;
    return e;
  });
  c.features = c.features.map(x => {
    const f = Object.assign(NEW.features(), x);
    f.uses = Object.assign({ max: 0, used: 0, recover: '' }, (x && x.uses) || {});
    return f;
  });
  c.level = clamp(+c.level || 1, 1, 20);
  /* Solo se deduce del texto si la ficha no trae el campo (fichas antiguas o de fuera); vacío a propósito = «Otra» */
  const raw = src || {};
  if (!c.classKey && !('classKey' in raw)) c.classKey = classKeyFrom(c.class);
  if (!c.speciesKey && !('speciesKey' in raw)) c.speciesKey = keyFrom(SPEC, c.species);
  if (!c.backgroundKey && !('backgroundKey' in raw)) c.backgroundKey = keyFrom(BG, c.background);
  if (!Array.isArray(c.featKeys)) c.featKeys = [];
  if (!Array.isArray(c.featData)) c.featData = [];
  if (c.speciesKey && !SPEC[c.speciesKey]) c.speciesKey = '';
  if (c.lineageKey && !(c.speciesKey && SPEC[c.speciesKey].lin && SPEC[c.speciesKey].lin[c.lineageKey]))
    c.lineageKey = '';
  if (c.classKey && !CL[c.classKey]) c.classKey = '';
  if (c.subclassKey && !(c.classKey && CL[c.classKey].subs[c.subclassKey])) c.subclassKey = '';
  if (!c.id) c.id = uid();
  c.formato = 'fichas-dnd-2024/2';
  return sane(c);
}
/* Recorta los números que se pintan como casillas o que buscan un nivel de espacio: un valor imposible
   (negativo, con decimales o enorme, p. ej. escrito a mano en «Editar ficha») no puede romper ni colgar la app */
function sane(c) {
  const int = (v, lo, hi) => clamp(Math.round(+v || 0), lo, hi);
  c.slots.forEach(s => {
    s.total = int(s.total, 0, 9);
    s.used = int(s.used, 0, s.total);
  });
  c.pact.level = int(c.pact.level, 0, 9);
  c.pact.total = int(c.pact.total, 0, 9);
  c.pact.used = int(c.pact.used, 0, c.pact.total);
  c.hitDice.total = int(c.hitDice.total, 0, 20);
  c.hitDice.spent = int(c.hitDice.spent, 0, c.hitDice.total);
  c.spells.forEach(s => (s.level = int(s.level, 0, 9)));
  /* Números imposibles de «Editar ficha» o de una ficha importada (n.º 89) */
  for (const k in c.abilities) c.abilities[k] = int(c.abilities[k] || 10, 1, 30);
  c.level = int(c.level, 1, 20);
  c.hp.max = int(c.hp.max, 1, 9999);
  c.hp.current = int(c.hp.current, 0, c.hp.max);
  c.hp.temp = int(c.hp.temp, 0, 9999);
  c.features.forEach(f => {
    if (!f.uses) return;
    f.uses.max = int(f.uses.max, 0, 999);
    f.uses.used = int(f.uses.used, 0, f.uses.max);
  });
  c.equipment.forEach(e => {
    if (e.qty !== undefined && e.qty !== '') e.qty = int(e.qty, 0, 99999);
  });
  for (const k in c.coins) c.coins[k] = int(c.coins[k], 0, 9999999);
  return c;
}

function fillFromRef(s) {
  const d = s.ref && SPBY[s.ref];
  if (!d) return s;
  return Object.assign(s, {
    level: d.l,
    name: s.name || d.n,
    time: s.time && s.time !== 'A' ? s.time : d.t,
    range: s.range || d.r,
    dur: s.dur || d.d,
    conc: s.conc || d.k,
    ritual: s.ritual || d.ri,
    material: s.material || d.m,
    desc: s.desc || '',
  });
}

let S = { chars: [], active: null, tab: 'play' };
function load() {
  try {
    const r = localStorage.getItem(KEY);
    if (r) {
      const x = JSON.parse(r);
      S.chars = (x.chars || []).map(normalize);
      S.active = x.active;
      if (x.tab) S.tab = x.tab;
      if (S.tab === 'inv' || S.tab === 'story') S.tab = 'pj';
      if (S.tab === 'chars') S.tab = 'play';
    }
  } catch (e) {}
  S.chars.forEach(linkWeapons);
  S.chars.forEach(linkGear);
  S.chars.forEach(linkItemWeapons);
  S.chars.forEach(linkAttackItems);
  S.chars.forEach(syncEffects);
  S.chars.forEach(linkArmor);
  if (!S.chars.find(c => c.id === S.active)) S.active = S.chars.length ? S.chars[0].id : null;
}
const OLDK = {
  Familiar: 'familiar',
  Montura: 'other',
  Invocación: 'other',
  'Compañero animal': 'other',
  Otro: 'other',
};
function syncEffects(c) {
  if (!c) return;
  if (Array.isArray(c.attacks) && Array.isArray(c.equipment)) syncWeapons(c);
  if (Array.isArray(c.companions))
    c.companions.forEach(x => {
      if (!CREA_KINDS[x.kind]) {
        x.label = x.kind && x.kind !== 'Otro' && x.kind !== 'Familiar' ? x.kind : '';
        x.kind = OLDK[x.kind] || 'other';
      }
      if (!x.attacks) x.attacks = [];
      if (!x.hp) x.hp = { max: 0, current: 0 };
    });
  if (!Array.isArray(c.effects)) c.effects = [];
  if (!Array.isArray(c.companions)) c.companions = [];
  c.effects = c.effects.filter(e => !e.conc || e.name === c.concentration);
  if (Array.isArray(c.attacks))
    c.attacks = c.attacks.filter(a => !a.fxSpell || c.effects.some(e => e.name === a.fxSpell));
  /* Objetos creados por un conjuro (bayas nutritivas): desaparecen con su efecto */
  if (Array.isArray(c.equipment))
    c.equipment = c.equipment.filter(e => !e.fxSpell || c.effects.some(x => x.name === e.fxSpell));
  if (c.form && !c.effects.some(e => e.form)) c.form = null;
  c.companions = c.companions.filter(x => !x.conc || x.spell === c.concentration);
}
function save() {
  capNums(C());
  pruneEmpty(C());
  syncEffects(C());
  saveOk();
}
/* Topes que no dependen de otro dato: ningún campo guarda números enormes (n.º 89) */
function capNums(c) {
  if (!c) return;
  const cap = (v, hi) => (typeof v === 'number' && v > hi ? hi : v);
  for (const k in c.abilities) c.abilities[k] = cap(c.abilities[k], 30);
  c.hp.max = cap(c.hp.max, 9999);
  c.hp.temp = cap(c.hp.temp, 9999);
  for (const k in c.coins) c.coins[k] = cap(c.coins[k], 9999999);
  c.equipment.forEach(e => (e.qty = cap(e.qty, 99999)));
  c.features.forEach(f => f.uses && (f.uses.max = cap(f.uses.max, 999)));
}
/* Guarda y dice si ha cabido (false si el almacenamiento del dispositivo está lleno) */
function saveOk() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ chars: S.chars, active: S.active, tab: S.tab }));
    return true;
  } catch (e) {
    return false;
  }
}
const C = () => S.chars.find(c => c.id === S.active);
