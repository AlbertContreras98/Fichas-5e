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
    return e;
  });
  c.features = c.features.map(x => {
    const f = Object.assign(NEW.features(), x);
    f.uses = Object.assign({ max: 0, used: 0, recover: '' }, (x && x.uses) || {});
    return f;
  });
  c.level = clamp(+c.level || 1, 1, 20);
  if (!c.classKey) c.classKey = classKeyFrom(c.class);
  if (!c.speciesKey) c.speciesKey = keyFrom(SPEC, c.species);
  if (!c.backgroundKey) c.backgroundKey = keyFrom(BG, c.background);
  if (!Array.isArray(c.featKeys)) c.featKeys = [];
  if (c.speciesKey && !SPEC[c.speciesKey]) c.speciesKey = '';
  if (c.lineageKey && !(c.speciesKey && SPEC[c.speciesKey].lin && SPEC[c.speciesKey].lin[c.lineageKey]))
    c.lineageKey = '';
  if (c.classKey && !CL[c.classKey]) c.classKey = '';
  if (c.subclassKey && !(c.classKey && CL[c.classKey].subs[c.subclassKey])) c.subclassKey = '';
  if (!c.id) c.id = uid();
  c.formato = 'fichas-dnd-2024/2';
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
  if (c.form && !c.effects.some(e => e.form)) c.form = null;
  c.companions = c.companions.filter(x => !x.conc || x.spell === c.concentration);
}
function save() {
  syncEffects(C());
  try {
    localStorage.setItem(KEY, JSON.stringify({ chars: S.chars, active: S.active, tab: S.tab }));
  } catch (e) {}
}
const C = () => S.chars.find(c => c.id === S.active);
