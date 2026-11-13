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
const hasFeat = (c, n) => c.features.some(f => norm(f.name) === norm(n));
/* Aura de protección (paladín 6): tu modificador de CAR (mínimo +1) a todas tus salvaciones */
const saveB = (c, k) =>
  M(c, k) +
  (c.saveProf.includes(k) ? pb(c) : 0) +
  miSave(c) +
  (c.classKey === 'paladin' && hasFeat(c, 'Aura de protección') ? Math.max(1, M(c, 'cha')) : 0);
const skillB = (c, s) => {
  const p = +c.skills[s[0]] || 0;
  /* skillPlus: habilidades que suman otra característica (Taumaturgo, Mago del Orden primigenio: SAB, mínimo +1) */
  const plus = c.skillPlus && c.skillPlus[s[0]] ? Math.max(1, M(c, c.skillPlus[s[0]])) : 0;
  /* Aprendiz de todo (bardo 2): la mitad de la competencia a las habilidades sin competencia */
  const jack = !p && hasFeat(c, 'Aprendiz de todo') ? Math.floor(pb(c) / 2) : 0;
  return M(c, s[2]) + (p === 2 ? 2 * pb(c) : p === 1 ? pb(c) : 0) + plus + jack;
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
  /* Cada recurso lleva su origen (especie, linaje o dote), para que la ficha diga de dónde viene */
  for (const [r, src] of [
    ...((sp && sp.res) || []).map(r => [r, sp.n]),
    ...((ln && ln.res) || []).map(r => [r, ln.n]),
    ...feats.flatMap(k => ((FEATS[k] && FEATS[k].res) || []).map(r => [r, `Dote: ${FEATS[k].n}`])),
  ]) {
    if (L < (r.from || 1)) continue;
    const max = r.by === 'pb' ? pbAt(L) : r.by;
    if (max > 0) out.push({ n: r.n, max, rec: r.rec, pool: !!r.pool, src });
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
  'find-steed': 'Corcel fiel',
  'contact-other-plane': 'Contactar con el patrón',
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
    else {
      const o = originSpellObj(id, c.speciesKey, c.lineageKey);
      if (!ex.src) {
        ex.src = o.src;
        if (o.free) ex.free = o.free;
      } else if (o.free && ex.free && ex.free !== o.free) ex.free2 = o.free;
      else if (o.free && !ex.free) ex.free = o.free;
    }
  }
  c.spells.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'es'));
}
function upsertRes(c, list, source) {
  for (const r of list) {
    let f = c.features.find(x => x.name === r.n);
    if (!f) {
      f = { name: r.n, source: r.src || source, text: '', uses: { max: 0, used: 0, recover: '' } };
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
  const out = HIT_EXTRA.filter(([id, , , any]) => (any || !spell) && on(id)).map(([, d, w]) => `+${d} ${w}`);
  if (!spell) {
    const info = infoFor(defOf(c), subOf(c), c.level);
    if (c.effects.some(e => e.name === 'Furia') && info['Daño de furia'])
      out.push(`${info['Daño de furia']} de daño de Furia si atacas con FUE`);
    if (info['Ataque furtivo'] && hasFeat(c, 'Ataque furtivo'))
      out.push(
        `+${info['Ataque furtivo']} de Ataque furtivo, una vez por turno, con arma sutil o a distancia si tienes ventaja o un aliado a 5 pies del objetivo`
      );
  }
  return out;
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
  if (r === 'spare-the-dying')
    return `<div class="t-parts">La criatura a 0 PG queda estable. A tu nivel, el alcance es de <b>${15 * 2 ** (t - 1)} pies</b>.</div>`;
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
    out.push(
      `Con un 20 natural (crítico): ${r === 'eldritch-blast' ? `<b>2d10${bonus}</b> en ese rayo` : `<b>${2 * t * parseInt(die)}d${die.split('d')[1]}${bonus}</b>`}${hitExtras(c, true).length ? ', y también se doblan los dados extra' : ''}.`
    );
  if (how === 'atk')
    hitExtras(c, true).forEach(x =>
      out.push(`Al impactar${r === 'eldritch-blast' && t > 1 ? ' (cada rayo)' : ''}: ${x}.`)
    );
  /* Truco potente (mago Evocador 3) */
  if (c.subclassKey === 'evoker' && c.level >= 3)
    out.push(
      `<b>Truco potente:</b> si ${how === 'atk' ? 'fallas el ataque' : 'supera la salvación'}, el objetivo recibe igualmente la mitad del daño (sin los efectos extra del truco).`
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
  if (kind === 'save' && ['int', 'wis', 'cha'].includes(x) && hasFeat(c, 'Astucia gnómica'))
    adv.push('Astucia gnómica');
  if ((kind === 'save' && x === 'str') || kind === 'check')
    if (c.effects.some(e => e.name === 'Furia')) adv.push(kind === 'check' ? 'Furia, si es de FUE' : 'Furia');
  /* Armadura puesta sin competencia: desventaja en todo lo que use FUE o DES */
  if (armorAuto(c) && acCalc(c).noProf) {
    if (kind === 'atk' || kind === 'check') dis.push('armadura sin competencia, si usas FUE o DES');
    else if (kind === 'save' && (x === 'str' || x === 'dex') && !fail.length)
      dis.push('armadura sin competencia');
    else if (kind === 'init') dis.push('armadura sin competencia');
  }
  if (adv.length && dis.length)
    out.push(`Ventaja (${adv.join(', ')}) y desventaja (${dis.join(', ')}) se anulan: tira un solo d20.`);
  else if (adv.length) out.push(`Con <b>ventaja</b> (${adv.join(', ')}): tira 2d20 y quédate el más alto.`);
  else if (dis.length)
    out.push(`Con <b>desventaja</b> (${dis.join('; ')}): tira 2d20 y quédate el más bajo.`);
  if (+c.exhaustion)
    out.push(`Ya está restado el −${2 * c.exhaustion} del agotamiento (nivel ${c.exhaustion}).`);
  /* Dados que se suman o restan mientras dura el conjuro */
  const fx = id => {
    const d = SPBY[id];
    return d && c.effects.some(e => !e.other && [d.n, d.en].some(x => norm(x) === norm(e.name)));
  };
  if ((kind === 'atk' || kind === 'save') && fx('bless'))
    out.push('Suma <b>1d4</b> si eres uno de los objetivos de Bendición.');
  if ((kind === 'atk' || kind === 'save') && fx('bane')) out.push('Resta <b>1d4</b> si te afecta Perdición.');
  if (kind === 'check' && fx('guidance'))
    out.push('Suma <b>1d4</b> si es la habilidad elegida con Orientación.');
  /* Pruebas de una habilidad concreta (x = clave de la habilidad) */
  if (kind === 'check' && x === 'stealth' && fx('pass-without-trace'))
    out.push('Suma <b>+10</b> si estás en el aura de Pasar sin dejar rastro.');
  if (kind === 'check' && (x === 'perception' || x === 'survival') && fx('hunters-mark'))
    out.push('Con <b>ventaja</b> si buscas a tu presa de Marca del cazador.');
  if (
    kind === 'check' &&
    x === 'perception' &&
    c.features.some(f => /visi[oó]n en la oscuridad/i.test(f.name))
  )
    out.push(
      'Con poca luz o a oscuras ves como con luz tenue: <b>desventaja</b> si la prueba depende de la vista.'
    );
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
    note = `Artes marciales: usas ${dex > str ? 'DES' : 'FUE'} y tu dado (${maD}). Puedes dar un golpe desarmado con la acción adicional.`;
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
      const i = c.features.indexOf(f),
        now =
          f.name === 'Metabolismo asombroso' && f.uses && f.uses.max - (+f.uses.used || 0) > 0
            ? ` <button class="b sm" data-act="t-feat" data-i="${i}">Usar ahora</button>`
            : '';
      return `<div class="t-parts">· <b>${esc(f.name)}</b>${u}: ${esc(f.text.length > 220 ? f.text.slice(0, 217) + '…' : f.text)}${now}</div>`;
    })
    .join('')}`;
}

/* Ventajas y desventajas que dependen del objetivo o de la distancia: la app no las sabe, así que las recuerda */
function atkNotes(c, a, thrown) {
  const out = [],
    W = a && a.wpn && WEAPONS[a.wpn],
    on = id => {
      const d = SPBY[id];
      return d && c.effects.some(e => [d.n, d.en].some(x => norm(x) === norm(e.name)));
    };
  if (c.effects.some(e => e.name === 'Molestar'))
    out.push('<b>Molestar:</b> si atacas a la criatura que impactaste con Molestar, tienes <b>ventaja</b>.');
  if (on('faerie-fire'))
    out.push('Si el objetivo brilla por tu <b>Fuego feérico</b>, tienes <b>ventaja</b>.');
  if (on('ensnaring-strike'))
    out.push('Si atacas a la criatura apresada por tu <b>Golpe atrapador</b>, tienes <b>ventaja</b>.');
  if (W && (W.r || thrown)) {
    const rg = thrown ? W.th : W.am && W.am[1];
    if (rg) {
      const [n, l] = String(rg).split('/');
      out.push(`A distancia: hasta ${n} pies normal; de ${n} a ${l} pies, con <b>desventaja</b>.`);
    }
    out.push('Si tienes un enemigo a 5 pies que te vea, el ataque a distancia va con <b>desventaja</b>.');
  }
  /* Presa del cazador */
  const prey = c.features.find(f => f.name === 'Presa del cazador');
  if (prey && /Elegido: Asesino de colosos/.test(prey.text))
    out.push(
      '<b>Asesino de colosos:</b> una vez por turno, si al objetivo ya le faltan PG, +1d8 al impactar (del mismo tipo que el arma).'
    );
  if (prey && /Elegido: Rompehordas/.test(prey.text))
    out.push(
      '<b>Rompehordas:</b> una vez por turno, puedes hacer otro ataque con la misma arma contra otra criatura a 5 pies del objetivo.'
    );
  return out.map(x => `<div class="t-parts">${x}</div>`).join('');
}
/* Daño de un crítico: los dados se tiran dos veces (los números fijos no). '' si no hay dados */
function critDmg(s) {
  s = String(s || '');
  return /\d*d\d+/.test(s) ? s.replace(/(\d*)d(\d+)/g, (m, n, d) => `${2 * (+n || 1)}d${d}`) : '';
}
/* Con qué sale un crítico: 20, o 19–20 / 18–20 con Crítico mejorado o superior (guerrero Campeón) */
const critOn = c =>
  hasFeat(c, 'Crítico superior')
    ? 'un 18, 19 o 20 natural'
    : hasFeat(c, 'Crítico mejorado')
      ? 'un 19 o 20 natural'
      : 'un 20 natural';
const critLine = (dmg, extra) =>
  critDmg(dmg)
    ? `<div class="t-parts">Con ${critOn(C())} (crítico): <b>${esc(critDmg(dmg))}</b>${extra ? ' (los dados extra al impactar también se doblan)' : ''}.</div>`
    : '';

/* Velocidad que se ve arriba: base, dotes, rasgos de clase, armadura, agotamiento y estados que la dejan en 0 */
const SPEED0 = ['Agarrado', 'Apresado', 'Paralizado', 'Petrificado', 'Inconsciente', 'Aturdido'];
function speedCalc(c) {
  const fm = formOf(c);
  const stop = c.conditions.find(n => SPEED0.includes(n));
  if (stop) return { ft: 0, why: stop };
  if (fm && parseInt(fm.speed) >= 0)
    return { ft: Math.max(0, parseInt(fm.speed) - 5 * (+c.exhaustion || 0)) };
  const worn = c.equipment.filter(e => e.equipped && e.armor && ARMORS[e.armor]),
    heavy = worn.some(e => ARMORS[e.armor].t === 'h'),
    has = n => c.features.some(f => norm(f.name) === norm(n));
  let ft = c.speedFt + featSpeed(c) - (armorAuto(c) && acCalc(c).slow ? 10 : 0);
  if (c.classKey === 'monk' && !worn.length)
    ft += parseInt(infoFor(defOf(c), subOf(c), c.level)['Movimiento sin armadura']) || 0;
  if (!heavy && has('Movimiento rápido')) ft += 10;
  if (!heavy && has('Errante')) ft += 10;
  if (has('Aura de presteza')) ft += 10;
  return { ft: Math.max(0, ft - 5 * (+c.exhaustion || 0)) };
}

/* Qué tirar con un conjuro de nivel 1 o más, según el espacio usado (lee la frase de nivel superior de los datos) */
function upcastLine(c, sp, L) {
  const d = sp.ref && SPBY[sp.ref];
  if (!d || !(+d.l >= 1) || ['searing-smite', 'shining-smite'].includes(d.id)) return '';
  L = Math.max(+d.l, +L || +d.l);
  const up = L - d.l,
    hl = d.hl || '',
    mod = spMod(c),
    out = [];
  if (d.id === 'magic-missile')
    out.push(
      `Lanzas <b>${3 + up} dardos</b>: cada uno impacta sin tirar y hace <b>1d4 + 1</b> de daño de fuerza.`
    );
  else if (d.id === 'scorching-ray')
    out.push(
      `Lanzas <b>${3 + up} rayos</b>: cada uno es un ataque de conjuro y hace <b>2d6</b> de daño de fuego.`
    );
  else {
    const m = hl.match(/aumenta en (\d+)d(\d+) por cada nivel de espacio por encima de (\d)/);
    if (m) {
      const b = d.de.match(new RegExp(`(\\d+)d${m[2]}(?: de daño ((?:de |del )?[a-záéíóúñ]+))?`));
      const n = (b ? +b[1] : 0) + up * +m[1],
        heal = /curaci[oó]n/i.test(hl),
        type = b && b[2] ? (b[2] === 'del' ? ' del tipo elegido' : ` ${b[2]}`) : '';
      if (heal)
        out.push(
          `Curación: <b>${n}d${m[2]}</b>${/modificador/.test(d.de) ? ` + tu aptitud (${mod !== null ? sgn(mod) : 'tu modificador'})` : ''}${up ? ` (con espacio de nivel ${L})` : ''}.`
        );
      else if (b)
        out.push(
          `Daño: <b>${n}d${m[2]}</b>${type ? ` de daño${type}` : ''}${up ? ` (con espacio de nivel ${L}: +${up * +m[1]}d${m[2]})` : ''}.`
        );
    }
    const t = hl.match(
      /(?:una|un) (criatura|bestia|humanoide|objetivo)? ?(?:adicional|más) por cada nivel de espacio por encima de \d/
    );
    if (t && up && /objetivo|afectar/.test(hl))
      out.push(
        `Con espacio de nivel ${L}: <b>${up} ${up === 1 ? 'objetivo' : 'objetivos'} más</b> que con el espacio mínimo.`
      );
  }
  return out.map(x => `<div class="t-parts">${x}</div>`).join('');
}

/* Conjuros cuyo objetivo repite la salvación: característica y cuándo */
const EOT = 'al final de cada uno de sus turnos; si la supera, el conjuro termina para él';
const REPEAT_SAVE = {
  'searing-smite': [
    'con',
    'al principio de cada uno de sus turnos, después de recibir 1d6 de fuego; si la supera, termina',
  ],
  sleep: ['wis', 'al final de su siguiente turno; si la falla, queda inconsciente'],
  'hideous-laughter': [
    'wis',
    'al final de cada uno de sus turnos y cada vez que recibe daño (con ventaja si es por el daño)',
  ],
  'ensnaring-strike': [
    'str',
    'cuando quiera, con su acción, haciendo una prueba de Fuerza (Atletismo) contra tu CD',
  ],
  'blindness-deafness': ['con', EOT],
  'hold-person': ['wis', EOT],
  'ray-of-enfeeblement': ['con', EOT],
  slow: ['wis', EOT],
  confusion: ['wis', EOT],
  'hold-monster': ['wis', EOT],
  'phantasmal-killer': [
    'wis',
    'al final de cada uno de sus turnos; si la falla, recibe 4d10 de daño psíquico',
  ],
  'flesh-to-stone': ['con', 'al final de cada uno de sus turnos'],
  'dominate-beast': ['wis', 'cada vez que recibe daño'],
  'dominate-person': ['wis', 'cada vez que recibe daño'],
  'dominate-monster': ['wis', 'cada vez que recibe daño'],
};
/* Recordatorio al terminar tu turno: salvaciones que repiten los objetivos de tus conjuros activos */
function repeatSaves(c) {
  const out = [];
  for (const [id, [ab, when]] of Object.entries(REPEAT_SAVE)) {
    const d = SPBY[id];
    if (d && c.effects.some(e => [d.n, d.en].some(x => norm(x) === norm(e.name))))
      out.push(
        `<b>${esc(d.n)}:</b> el objetivo repite la salvación de ${AB[ab][2]}${spMod(c) !== null ? ` contra tu CD <b>${spDC(c)}</b>` : ''} ${when}.`
      );
  }
  return out.map(x => `<div class="t-parts">${x}</div>`).join('');
}

/* Tipos de daño a los que resistes ahora: rasgos (especie, linaje…), Furia, Piel pétrea y Petrificado */
function resistOf(c) {
  const set = new Set(),
    re = /resistencia al daño (?:de )?([a-záéíóúñ]+)(?: y (?:de )?([a-záéíóúñ]+))?/gi;
  for (const f of c.features)
    for (const m of String(f.text || '').matchAll(re))
      [m[1], m[2]].filter(Boolean).forEach(t => set.add(t.toLowerCase()));
  const on = n => c.effects.some(e => norm(e.name) === norm(n));
  if (
    on('Furia') &&
    !c.equipment.some(e => e.equipped && e.armor && ARMORS[e.armor] && ARMORS[e.armor].t === 'h')
  )
    ['contundente', 'cortante', 'perforante'].forEach(t => set.add(t));
  if (on('Piel pétrea')) ['contundente', 'cortante', 'perforante'].forEach(t => set.add(t));
  if (c.conditions.includes('Petrificado')) return ['todo'];
  return [...set];
}

/* Ventaja en las salvaciones de concentración: Mente arcana (invocación) o Lanzador de guerra (dote). '' si no */
function concAdv(c) {
  const out = [];
  if (ivFromChar(c).some(e => e.id === 'eldritch-mind')) out.push('Mente arcana');
  if ((c.featKeys || []).includes('war-caster')) out.push('Lanzador de guerra');
  return out.join(' y ');
}

/* Curación de un conjuro con el espacio usado: {n, d, bonus} (n dados de d caras + bonus) o null */
function healOf(c, sp, L) {
  const d = sp.ref && SPBY[sp.ref];
  if (!d || !(+d.l >= 1)) return null;
  const m = (d.hl || '').match(
    /curaci[oó]n aumenta en (\d+)d(\d+) por cada nivel de espacio por encima de (\d)/i
  );
  if (!m) return null;
  const b = d.de.match(new RegExp(`(\\d+)d${m[2]}`)),
    up = Math.max(0, Math.max(+d.l, +L || +d.l) - d.l);
  return {
    n: (b ? +b[1] : 0) + up * +m[1],
    d: +m[2],
    bonus: /modificador/.test(d.de) && spMod(c) !== null ? spMod(c) : 0,
  };
}

/* Arma de pacto: Golpe arcano (gastar un espacio de pacto al impactar, una vez por turno) y Bebedor de vida */
const pactSmiteOk = c => ivFromChar(c).some(e => e.id === 'eldritch-smite') && c.pact.total - c.pact.used > 0;
function pactExtras(c, a) {
  if (!a.pact) return '';
  const out = [];
  if (ivFromChar(c).some(e => e.id === 'lifedrinker'))
    out.push(
      `<div class="t-parts"><b>Bebedor de vida</b> (una vez por turno, al impactar): +1d6 necrótico, psíquico o radiante, y puedes gastar un dado de golpe para curarte (el dado ${sgn(M(c, 'con'))}).</div>`
    );
  if (pactSmiteOk(c))
    out.push(
      `<div class="t-parts"><b>Golpe arcano</b> (una vez por turno): si impactas, puedes gastar un espacio de pacto para hacer ${1 + c.pact.level}d8 de fuerza extra.</div><div class="t-actions"><button class="b sm pri" data-act="smite-ok">Usar Golpe arcano</button></div>`
    );
  return out.join('');
}

/* Rasgos cuyos usos dependen de la competencia o de una característica (uses.by): se recalculan solos al subir de nivel o cambiar la ficha */
const usesBy = (c, by) => (by === 'pb' ? pb(c) : AB[by] ? Math.max(1, M(c, by)) : 0);
function usesSync(c) {
  let ch = false;
  for (const f of c.features) {
    if (!f.uses || !f.uses.by) continue;
    const max = usesBy(c, f.uses.by);
    if (max && f.uses.max !== max) {
      f.uses.max = max;
      f.uses.used = clamp(+f.uses.used || 0, 0, max);
      ch = true;
    }
  }
  return ch;
}

/* Peso (en libras) de lo que hay en el catálogo: armas, armaduras, equipo, pociones, munición y monedas (50 = 1 libra) */
const WEIGHT = {
  w: {
    club: 2,
    dagger: 1,
    greatclub: 10,
    handaxe: 2,
    javelin: 2,
    lighthammer: 2,
    mace: 4,
    quarterstaff: 4,
    sickle: 2,
    spear: 3,
    dart: 0.25,
    lightcrossbow: 5,
    shortbow: 2,
    sling: 0,
    battleaxe: 4,
    flail: 2,
    glaive: 6,
    greataxe: 7,
    greatsword: 6,
    halberd: 6,
    lance: 6,
    longsword: 3,
    maul: 10,
    morningstar: 4,
    pike: 18,
    rapier: 2,
    scimitar: 3,
    shortsword: 2,
    trident: 4,
    warhammer: 5,
    warpick: 2,
    whip: 3,
    blowgun: 1,
    handcrossbow: 3,
    heavycrossbow: 18,
    longbow: 2,
    musket: 10,
    pistol: 3,
  },
  a: {
    padded: 8,
    leather: 10,
    studded: 13,
    hide: 12,
    chainshirt: 20,
    scale: 45,
    breastplate: 20,
    halfplate: 40,
    ring: 40,
    chainmail: 55,
    splint: 60,
    plate: 65,
    shield: 6,
  },
  g: {
    healerkit: 3,
    antitoxin: 0,
    acid: 1,
    alchfire: 1,
    holywater: 1,
    caltrops: 2,
    ballbearings: 2,
    climberkit: 12,
    torch: 1,
    rations: 2,
    waterskin: 5,
  },
  am: { arrow: 0.05, bolt: 0.075, slingbullet: 0.075, firebullet: 0.2, needle: 0.02 },
};
/* Peso de un objeto (por unidad) o null si no se sabe. e.w lo fija el jugador */
function itemWeight(e) {
  if (e.w != null && e.w !== '') return +e.w || 0;
  if (e.weapon && WEIGHT.w[e.weapon] != null) return WEIGHT.w[e.weapon];
  if (e.armor && WEIGHT.a[e.armor] != null) return WEIGHT.a[e.armor];
  if (e.gear && WEIGHT.g[e.gear] != null) return WEIGHT.g[e.gear];
  if (e.ammoKind && WEIGHT.am[e.ammoKind] != null) return WEIGHT.am[e.ammoKind];
  if (e.potion) return 0.5;
  if (e.berry) return 0;
  return null;
}
/* Carga: lo que llevas, lo que puedes llevar (FUE × 15) y cuántos objetos no tienen peso conocido */
function carryInfo(c) {
  let total = 0,
    unknown = 0;
  for (const e of c.equipment) {
    const w = itemWeight(e);
    if (w == null) unknown += +e.qty > 0 ? 1 : 0;
    else total += w * (e.cat === 'mapa' ? 1 : Math.max(0, +e.qty || 0));
  }
  const coins = Object.values(c.coins || {}).reduce((t, n) => t + (+n || 0), 0);
  total += coins / 50;
  const str = +c.abilities.str || 10;
  return { total: Math.round(total * 10) / 10, cap: str * 15, push: str * 30, unknown };
}
