/* Cálculos de reglas: competencia, salvaciones, habilidades, conjuros, espacios, recursos de clase y origen. */
'use strict';

const pbAt = L => 2 + Math.floor((clamp(L, 1, 20) - 1) / 4);
const pb = c => pbAt(+c.level || 1);
const M = (c, k) => mod(c.abilities[k]);
const miOn = e => e.mi && (!e.mi.att || e.mi.on);
const wearsArmor = c => c.equipment.some(e => e.armor && ARMORS[e.armor] && e.equipped);
const miAC = c =>
  c.equipment.reduce((t, e) => t + (miOn(e) && +e.mi.ac && !(e.mi.noarm && wearsArmor(c)) ? +e.mi.ac : 0), 0);
const miSave = c => c.equipment.reduce((t, e) => t + (miOn(e) ? +e.mi.sv || 0 : 0), 0);
const attuned = c => c.equipment.filter(e => e.mi && e.mi.att && e.mi.on).length;
const saveB = (c, k) => M(c, k) + (c.saveProf.includes(k) ? pb(c) : 0) + miSave(c);
const skillB = (c, s) => {
  const p = +c.skills[s[0]] || 0;
  return M(c, s[2]) + (p === 2 ? 2 * pb(c) : p === 1 ? pb(c) : 0);
};
const featsOf = c => (c.featKeys || []).map(k => FEATS[k]).filter(Boolean);
const featHas = (c, p) => featsOf(c).find(f => f[p]) || null;
const featSpeed = c => featsOf(c).reduce((t, f) => t + (f.speed || 0), 0);
const init = c => M(c, 'dex') + (+c.initiativeBonus || 0) + (featsOf(c).some(f => f.initPB) ? pb(c) : 0);
const specOf = k => SPEC[k] || null;
const linOf = (sk, lk) => {
  const s = SPEC[sk];
  return s && s.lin && lk ? s.lin[lk] || null : null;
};
function hpPerLevel(sk, feats) {
  return (
    ((SPEC[sk] && SPEC[sk].hpPerLevel) || 0) +
    feats.reduce((t, k) => t + ((FEATS[k] && FEATS[k].hpPerLevel) || 0), 0)
  );
}
function originRes(sk, lk, feats, L) {
  const out = [],
    sp = specOf(sk),
    ln = linOf(sk, lk);
  for (const r of [
    ...((sp && sp.res) || []),
    ...((ln && ln.res) || []),
    ...feats.flatMap(k => (FEATS[k] && FEATS[k].res) || []),
  ]) {
    if (L < (r.from || 1)) continue;
    const max = r.by === 'pb' ? pbAt(L) : r.by;
    if (max > 0) out.push({ n: r.n, max, rec: r.rec, pool: !!r.pool });
  }
  return out;
}
function originSpellIds(sk, lk, fromL, toL) {
  const sp = specOf(sk),
    ln = linOf(sk, lk),
    ids = [];
  for (const src of [sp && sp.spells, ln && ln.spells])
    if (src) for (const l in src) if (+l >= fromL && +l <= toL) ids.push(...src[l]);
  return ids;
}
function originSpellObj(id, sk, lk) {
  const d = SPBY[id],
    o = spellObj(d);
  o.src = (linOf(sk, lk) || specOf(sk)).n || 'Especie';
  const res = originRes(sk, lk, [], 20).find(r => r.n.startsWith(d.n));
  if (res && d.l > 0) o.free = res.n;
  return o;
}
const SPEN = Object.fromEntries(SP.map(s => [s.en, s.id]));
function alwaysIds(ck, sk, from, to) {
  const A = window.ALWAYS_PREPARED,
    ids = [];
  for (const src of [A.classes[ck], sk && A.subs[sk]])
    if (src)
      for (const l in src) if (+l >= from && +l <= to) src[l].forEach(n => SPEN[n] && ids.push(SPEN[n]));
  return ids;
}
const FREE_LINK = {
  'hunters-mark': 'Marca del cazador gratis',
  'divine-smite': 'Castigo del paladín gratis',
  'misty-step': 'Pasos de las hadas',
};
function addAlways(c, ids) {
  for (const id of ids)
    if (!c.spells.some(s => s.ref === id)) {
      const o = spellObj(SPBY[id]);
      o.src = 'Siempre preparado';
      if (FREE_LINK[id]) o.free = FREE_LINK[id];
      c.spells.push(o);
    }
  c.spells.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'es'));
}
function addOriginSpells(c, ids) {
  for (const id of ids) {
    const ex = c.spells.find(s => s.ref === id);
    if (!ex) c.spells.push(originSpellObj(id, c.speciesKey, c.lineageKey));
    else if (!ex.src) {
      const o = originSpellObj(id, c.speciesKey, c.lineageKey);
      ex.src = o.src;
      if (o.free) ex.free = o.free;
    }
  }
  c.spells.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'es'));
}
function upsertRes(c, list, source) {
  for (const r of list) {
    let f = c.features.find(x => x.name === r.n);
    if (!f) {
      f = { name: r.n, source, text: '', uses: { max: 0, used: 0, recover: '' } };
      c.features.push(f);
    }
    f.uses.max = r.max;
    f.uses.recover = r.rec;
    f.uses.pool = r.pool;
    f.uses.used = clamp(f.uses.used || 0, 0, r.max);
  }
}
function addFeature(c, n, t, src) {
  const ex = c.features.find(f => f.name === n);
  if (ex) {
    if (t && !ex.text.includes(t)) ex.text = (ex.text ? ex.text + '\n\n' : '') + t;
  } else c.features.push({ name: n, source: src, text: t || '', uses: { max: 0, used: 0, recover: '' } });
}
/* Conjuros que gastan su componente material: palabras con las que se busca ese objeto en el inventario */
const SP_CONSUME = {
  'find-familiar': ['incienso'],
  'illusory-script': ['tinta'],
  'protection-from-evil-and-good': ['agua bendita'],
  'magic-mouth': ['jade'],
  'arcane-lock': ['polvo de oro', 'oro en polvo'],
  'gentle-repose': 'cp',
  'continual-flame': ['rubi'],
  'magic-circle': ['plata'],
  'glyph-of-warding': ['polvo de diamante', 'diamante en polvo'],
  nondetection: ['polvo de diamante', 'diamante en polvo'],
  revivify: ['diamante'],
  divination: ['incienso'],
  stoneskin: ['polvo de diamante', 'diamante en polvo'],
  'legend-lore': ['incienso'],
  'teleportation-circle': ['tinta'],
  awaken: ['agata'],
  reincarnate: ['aceite'],
  'greater-restoration': ['polvo de diamante', 'diamante en polvo'],
  'raise-dead': ['diamante'],
  hallow: ['incienso'],
  'planar-binding': ['joya', 'gema'],
  'heroes-feast': ['cuenco'],
  'true-seeing': ['seta', 'hongo'],
  forcecage: ['rubi'],
  sequester: ['gema'],
  resurrection: ['diamante'],
  simulacrum: ['rubi'],
  symbol: ['polvo de diamante', 'diamante en polvo'],
  clone: ['diamante'],
  'astral-projection': ['jacinto'],
  'true-resurrection': ['diamante'],
};
/* Objeto a descontar al terminar de lanzar el conjuro (se fija en A.cast) */
let spPendingUse = null;
/* Descuenta el objeto que gasta el conjuro y devuelve el aviso para el mensaje ('' si no gasta nada) */
function spUseItem(c, sp) {
  const u = spPendingUse;
  spPendingUse = null;
  if (!u || u.sp !== sp) return '';
  if (u.cp) {
    c.coins.cp = Math.max(0, (+c.coins.cp || 0) - 2);
    return `<div class="t-parts">Gastas 2 piezas de cobre · te quedan ${c.coins.cp} pc.</div>`;
  }
  const e = c.equipment.includes(u.item) && u.item;
  if (!e || !(+e.qty > 0)) return '';
  e.qty = +e.qty - 1;
  return `<div class="t-parts">Gastas ${esc(e.name)} · te ${e.qty === 1 ? 'queda' : 'quedan'} ${e.qty}.</div>`;
}
/* Objeto que gasta el conjuro y si lo tienes: null si no gasta nada */
function spConsume(c, sp) {
  const kw = sp.ref && SP_CONSUME[sp.ref];
  if (!kw) return null;
  const what = (sp.material || (SPBY[sp.ref] || {}).m || '').replace(/,? ?que el conjuro consume.*$/, '');
  const item =
    kw === 'cp' ? null : c.equipment.find(e => (+e.qty || 0) > 0 && kw.some(k => norm(e.name).includes(k)));
  const has = kw === 'cp' ? (+(c.coins || {}).cp || 0) >= 2 : !!item;
  return { what, has, item, cp: kw === 'cp' };
}
const spMod = c => (c.spellcasting.ability ? M(c, c.spellcasting.ability) : null);
const spDC = c => 8 + pb(c) + spMod(c);
const spAtk = c => pb(c) + spMod(c);
const defOf = c => CL[c.classKey] || null;
const subOf = (c, key) => {
  const d = defOf(c);
  const k = key === undefined ? c.subclassKey : key;
  return d && k ? d.subs[k] : null;
};
function casterOf(def, sub) {
  if (!def) return null;
  if (def.cast)
    return {
      type: def.cast,
      ab: def.ab,
      list: def === CL.warlock ? 'warlock' : Object.keys(CL).find(k => CL[k] === def),
      cantrips: def.cantrips,
      prepared: def.prepared,
    };
  if (sub && sub.cast)
    return { type: sub.cast, ab: sub.ab, list: sub.list, cantrips: sub.cantrips, prepared: sub.prepared };
  return null;
}
function slotsFor(type, L) {
  const z = { slots: Array(9).fill(0), pact: { level: 0, total: 0 } };
  if (type === 'full') FULL[L - 1].forEach((n, i) => (z.slots[i] = n));
  if (type === 'half') FULL[Math.ceil(L / 2) - 1].forEach((n, i) => (z.slots[i] = n));
  if (type === 'third' && L >= 3) FULL[Math.ceil(L / 3) - 1].forEach((n, i) => (z.slots[i] = n));
  if (type === 'pact')
    z.pact = { level: Math.min(5, Math.ceil(L / 2)), total: L === 1 ? 1 : L < 11 ? 2 : L < 17 ? 3 : 4 };
  return z;
}
function maxSpellLevel(type, L) {
  const z = slotsFor(type, L);
  let m = 0;
  z.slots.forEach((n, i) => {
    if (n) m = i + 1;
  });
  if (type === 'pact') {
    m = z.pact.level;
    if (L >= 11) m = L >= 17 ? 9 : L >= 15 ? 8 : L >= 13 ? 7 : 6;
  }
  return m;
}
function recAt(rec, L) {
  if (typeof rec === 'string') return rec;
  let r = '';
  for (const k of Object.keys(rec)
    .map(Number)
    .sort((a, b) => a - b))
    if (L >= k) r = rec[k];
  return r;
}
function resourcesFor(def, sub, L, abilities) {
  const out = [];
  for (const r of [...(def ? def.res : []), ...((sub && sub.res) || [])]) {
    let max = 0;
    if (r.by) max = r.by[L - 1] || 0;
    else if (r.mod) {
      if (L >= (r.from || 1)) max = Math.max(1, mod(abilities[r.mod]));
    }
    if (max > 0) out.push({ n: r.n, max, rec: recAt(r.rec, L), pool: !!r.pool || max > 12 });
  }
  return out;
}
function infoFor(def, sub, L) {
  const o = {};
  for (const src of [def && def.info, sub && sub.info])
    if (src)
      for (const k in src) {
        const v = src[k][L - 1];
        if (v !== undefined && v !== '—' && v !== 0) o[k] = v;
      }
  return o;
}

/* Trucos de daño: dado, tipo y si piden ataque de conjuro ('atk') o una salvación (característica) */
const CANTRIP_DMG = {
  'eldritch-blast': ['1d10', 'de fuerza', 'atk'],
  'fire-bolt': ['1d10', 'de fuego', 'atk'],
  'chill-touch': ['1d10', 'necrótico', 'atk'],
  'shocking-grasp': ['1d8', 'de relámpago', 'atk'],
  'ray-of-frost': ['1d8', 'de frío', 'atk'],
  'produce-flame': ['1d8', 'de fuego', 'atk'],
  'starry-wisp': ['1d8', 'radiante', 'atk'],
  'sorcerous-burst': ['1d8', 'del tipo que elijas', 'atk'],
  'poison-spray': ['1d12', 'de veneno', 'atk'],
  'sacred-flame': ['1d8', 'radiante', 'dex'],
  'acid-splash': ['1d6', 'de ácido', 'dex'],
  'vicious-mockery': ['1d6', 'psíquico', 'wis'],
};
/* Los trucos mejoran a nivel 5, 11 y 17 */
const cantripTier = L => 1 + (L >= 5) + (L >= 11) + (L >= 17);
/* Daño extra al impactar por efectos activos (Maleficio, Marca del cazador, Favor divino). spell: ataque de conjuro */
const HIT_EXTRA = [
  ['hex', '1d6 necrótico', 'si es el objetivo de tu Maleficio', true],
  ['hunters-mark', '1d6 de fuerza', 'si es tu presa (Marca del cazador)', true],
  ['divine-favor', '1d4 radiante', 'Favor divino', false],
];
function hitExtras(c, spell) {
  const on = id => {
    const d = SPBY[id];
    return d && c.effects.some(e => [d.n, d.en].some(x => norm(x) === norm(e.name)));
  };
  return HIT_EXTRA.filter(([id, , , any]) => (any || !spell) && on(id)).map(([, d, w]) => `+${d} ${w}`);
}
/* Qué tirar al lanzar un truco de daño (o '' si no lo es) */
function cantripRoll(c, sp) {
  const r = sp.ref || '',
    t = cantripTier(+c.level || 1),
    atk = spMod(c) !== null ? sgn(spAtk(c) + d20Pen(c)) : '+ tu ataque de conjuro',
    dl = d20Line(c, 'atk'),
    dlh = dl ? `<div class="t-parts">${dl}</div>` : '',
    out = [];
  if (r === 'true-strike')
    return `<div class="t-parts">Ataca con tu arma usando tu aptitud mágica: <b>1d20 ${atk}</b>. Si impactas: el daño del arma + ${spMod(c) !== null ? spMod(c) : 'tu aptitud'}${t > 1 ? ` y <b>${t - 1}d6 radiante</b> extra` : ''}.</div>${dlh}`;
  if (r === 'shillelagh')
    return `<div class="t-parts">Con ese garrote o bastón atacas con <b>1d20 ${atk}</b> y su dado de daño pasa a ser <b>${['d8', 'd10', 'd12', '2d6'][t - 1]}</b> + ${spMod(c) !== null ? spMod(c) : 'tu aptitud'}.</div>${dlh}`;
  const d = CANTRIP_DMG[r];
  if (!d) return '';
  const [die, type, how] = d,
    ivs = typeof ivFromChar === 'function' ? ivFromChar(c) : [],
    mine = id =>
      ivs.some(
        e =>
          e.id === id &&
          (e.pick
            ? [sp.name, SPBY[r] && SPBY[r].n].some(x => norm(x) === norm(e.pick))
            : r === 'eldritch-blast')
      ),
    cha = mine('agonizing-blast') ? M(c, 'cha') : 0,
    bonus = cha ? ` ${sgn(cha)}` : '';
  if (r === 'eldritch-blast') {
    out.push(
      t > 1
        ? `Lanzas <b>${t} rayos</b> (a uno o a varios objetivos). Cada rayo es un ataque aparte: <b>1d20 ${atk}</b>. Cada rayo que impacte: <b>1d10${bonus}</b> de daño de fuerza.`
        : `Ataque de conjuro: <b>1d20 ${atk}</b>. Si impacta: <b>1d10${bonus}</b> de daño de fuerza.`
    );
  } else {
    const dice = `${t * parseInt(die)}d${die.split('d')[1]}${bonus}`;
    out.push(
      how === 'atk'
        ? `Ataque de conjuro: <b>1d20 ${atk}</b>. Si impacta: <b>${dice}</b> de daño ${type}.`
        : `El objetivo hace una salvación de <b>${AB[how][2]}</b> contra tu CD <b>${spMod(c) !== null ? spDC(c) : '—'}</b>. Si falla: <b>${dice}</b> de daño ${type}.`
    );
  }
  if (cha)
    out.push(
      `Estallido agonizante: sumas tu CAR (${sgn(cha)}) al daño${r === 'eldritch-blast' ? ' de cada rayo' : ''}.`
    );
  if (r === 'sorcerous-burst')
    out.push(
      `Por cada 8 que saques en los dados de daño, tira otro d8 (como mucho ${Math.max(1, spMod(c) || 1)} más).`
    );
  if (mine('repelling-blast'))
    out.push('Estallido repulsor: si impacta, puedes empujar al objetivo hasta 10 pies en línea recta.');
  if (mine('eldritch-spear') && c.classKey === 'warlock' && SPBY[r])
    out.push(`Lanza arcana: alcance de ${(parseInt(SPBY[r].r) || 0) + 30 * (+c.level || 1)} pies.`);
  if (how === 'atk' && dl) out.push(dl);
  if (how === 'atk')
    hitExtras(c, true).forEach(x =>
      out.push(`Al impactar${r === 'eldritch-blast' && t > 1 ? ' (cada rayo)' : ''}: ${x}.`)
    );
  return out.map(x => `<div class="t-parts">${x}</div>`).join('');
}

/* Ventaja, desventaja y agotamiento en las tiradas d20. kind: 'atk' (x = ataque), 'check', 'save' (x = característica), 'init' */
const d20Pen = c => -2 * (+c.exhaustion || 0);
function d20Line(c, kind, x) {
  const has = n => c.conditions.includes(n),
    out = [],
    adv = [],
    dis = [],
    fail = ['Aturdido', 'Paralizado', 'Petrificado', 'Inconsciente'].filter(has);
  if (kind === 'atk') {
    ['Envenenado', 'Cegado', 'Derribado', 'Apresado'].filter(has).forEach(n => dis.push(n));
    if (has('Asustado')) dis.push('Asustado, si ves lo que te asusta');
    if (has('Agarrado')) dis.push('Agarrado, si no atacas a quien te agarra');
    if (has('Invisible')) adv.push('Invisible');
    const w = x && x.wpn && WEAPONS[x.wpn];
    if (w && (w.p || []).includes('pesada')) {
      const k = w.r ? 'dex' : 'str';
      if ((+c.abilities[k] || 10) < 13) dis.push(`arma pesada con ${AB[k][1]} menor de 13`);
    }
  } else if (kind === 'check') {
    if (has('Envenenado')) dis.push('Envenenado');
    if (has('Asustado')) dis.push('Asustado, si ves lo que te asusta');
  } else if (kind === 'save') {
    if ((x === 'str' || x === 'dex') && fail.length)
      out.push(`<b>Fallas automáticamente</b> las salvaciones de FUE y DES (${fail.join(', ')}).`);
    else if (x === 'dex' && has('Apresado')) dis.push('Apresado');
  } else if (kind === 'init') {
    if (has('Invisible')) adv.push('Invisible');
    if (has('Incapacitado') || fail.length) dis.push(has('Incapacitado') ? 'Incapacitado' : fail[0]);
  }
  if (adv.length && dis.length)
    out.push(`Ventaja (${adv.join(', ')}) y desventaja (${dis.join(', ')}) se anulan: tira un solo d20.`);
  else if (adv.length) out.push(`Con <b>ventaja</b> (${adv.join(', ')}): tira 2d20 y quédate el más alto.`);
  else if (dis.length)
    out.push(`Con <b>desventaja</b> (${dis.join('; ')}): tira 2d20 y quédate el más bajo.`);
  if (+c.exhaustion)
    out.push(`Ya está restado el −${2 * c.exhaustion} del agotamiento (nivel ${c.exhaustion}).`);
  return out.join(' ');
}

/* Golpe desarmado: ataque y daño. El monje sin armadura ni escudo usa su mejor entre FUE y DES y su dado de artes marciales */
function unarmedCalc(c) {
  const str = M(c, 'str'),
    dex = M(c, 'dex'),
    armored = c.equipment.some(e => e.equipped && e.armor && ARMORS[e.armor]),
    monk = c.classKey === 'monk' && !armored,
    maD = monk && (infoFor(defOf(c), subOf(c), c.level)['Dado de artes marciales'] || ''),
    style = (c.featKeys || []).includes('unarmed-fighting'),
    mod = monk ? Math.max(str, dex) : str,
    sm = n => (n ? ` ${n > 0 ? '+' : '−'} ${Math.abs(n)}` : '');
  let dmg, note;
  if (monk && /^d\d+$/.test(maD)) {
    dmg = `1${maD}${sm(mod)}`;
    note = `Artes marciales: usas ${dex > str ? 'DES' : 'FUE'} y tu dado (${maD}). Tras atacar puedes dar otro golpe desarmado como acción adicional.`;
  } else if (style) {
    dmg = `1d6${sm(mod)}`;
    note =
      'Combate sin armas: 1d8 si no llevas arma ni escudo en las manos. Al principio de tu turno, 1d4 a quien tengas agarrado.';
  } else {
    dmg = String(Math.max(1, 1 + mod));
    note = '';
  }
  return { atk: mod + pb(c), dmg, note };
}

/* Rasgos que se usan o se notan al tirar iniciativa (Metabolismo asombroso, Furia persistente…), para recordarlos al empezar el combate */
function initFeats(c) {
  const re = /(al tirar (la )?iniciativa|en (las tiradas de )?iniciativa|a la iniciativa|a tu iniciativa)/;
  const list = c.features.filter(f => re.test(norm(f.text)) && !/^invocaci[oó]n/i.test(f.name));
  if (!list.length) return '';
  return `<div class="t-parts"><b>Al tirar iniciativa, recuerda:</b></div>${list
    .map(f => {
      const u = f.uses && +f.uses.max ? ` (quedan ${f.uses.max - (+f.uses.used || 0)}/${f.uses.max})` : '';
      return `<div class="t-parts">· <b>${esc(f.name)}</b>${u}: ${esc(f.text.length > 220 ? f.text.slice(0, 217) + '…' : f.text)}</div>`;
    })
    .join('')}`;
}
