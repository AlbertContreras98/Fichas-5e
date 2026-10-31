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
    if (max > 0) out.push({ n: r.n, max, rec: r.rec, pool: false });
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
