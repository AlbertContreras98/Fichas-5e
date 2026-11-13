/* Buscador de conjuros y conjuros preparados. */
'use strict';

let P = null; // {target:'edit'|'wizard', q, lvl, cls, open, list(ref a array de conjuros), max}
const CLASS_OPTS = () => [
  ['', 'Todas las clases'],
  ...Object.entries(CL)
    .filter(([k, d]) => d.cast)
    .map(([k, d]) => [k, d.n]),
];
function spellObj(d) {
  return {
    level: d.l,
    name: d.n,
    time: d.t,
    range: d.r,
    dur: d.d,
    conc: d.k,
    ritual: d.ri,
    material: d.m,
    desc: '',
    ref: d.id,
  };
}
function spFiltered() {
  const q = norm(P.q);
  return SP.filter(
    s =>
      (P.cls === '' || s.c.includes(P.cls)) &&
      (P.lvl === '' || s.l === +P.lvl) &&
      (P.max == null || s.l <= P.max) &&
      (P.min == null || s.l >= P.min) &&
      (!P.only || !s.l || P.only.includes(s.id)) &&
      (!P.skip || !P.skip.includes(s.id)) &&
      (!q || norm(s.n).includes(q) || norm(s.en).includes(q))
  );
}
/* Libro de conjuros del mago: c.book guarda los conjuros de nivel 1 o más que tiene apuntados. Prepara de ahí y lanza sus rituales sin prepararlos */
const bookNeed = c => 6 + 2 * (Math.max(1, +c.level || 1) - 1);
function bookOf(c) {
  if (c.classKey !== 'wizard') return null;
  if (!Array.isArray(c.book)) c.book = [];
  /* Lo que ya tiene preparado está en el libro por fuerza (fichas anteriores al libro, o recién creadas) */
  c.spells
    .filter(sp => sp.ref && !sp.src && +sp.level >= 1 && SPBY[sp.ref] && SPBY[sp.ref].c.includes('wizard'))
    .forEach(sp => c.book.some(b => b.ref === sp.ref) || c.book.push(spellObj(SPBY[sp.ref])));
  c.book.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'es'));
  return c.book;
}
const bookCount = () => {
  const c = C(),
    n = bookOf(c).filter(b => !b.copied).length,
    need = bookNeed(c);
  return `<span class="badge" style="${n < need ? 'color:var(--bad)' : ''}">En tu libro: ${n}</span> <small>a nivel ${c.level} tienes al menos ${need} (6 al empezar y 2 más por nivel), más los que copies</small>`;
};
function openBookModal() {
  const c = C(),
    ca = casterOf(defOf(c), subOf(c));
  if (!bookOf(c) || !ca) return;
  P = {
    target: 'book',
    q: '',
    lvl: '',
    cls: 'wizard',
    open: '',
    list: c.book,
    max: maxSpellLevel(ca.type, c.level),
    min: 1,
  };
  openModal(
    `<div class="wz-head"><h2>Libro de conjuros</h2><button class="b sm" data-act="sp-close">Hecho</button></div>
    <p class="hint">Apunta aquí los conjuros de mago que tienes en tu libro. Preparas de entre ellos, y los que son ritual (R) los puedes lanzar como ritual aunque no los tengas preparados. Copiar uno nuevo que encuentres cuesta 2 horas y 50 po por cada nivel del conjuro.</p>
    <div id="book-count" style="margin:.3rem 0 .6rem">${bookCount()}</div><div class="wz-body">${spPickerHTML()}</div>`,
    true
  );
}
/* Conjuros propios de todas las fichas de este dispositivo (sin repetir nombre y nivel) */
const csKey = sp => `${norm(sp.name)}|${+sp.level || 0}`;
function csLibrary() {
  const seen = new Set(),
    out = [];
  for (const sp of [
    ...(P ? P.list : []),
    ...S.chars.flatMap(c => c.spells),
    ...csStored().map(x => Object.assign(NEW.spells(), x)),
  ])
    if (csOwn(sp) && sp.name && !seen.has(csKey(sp))) {
      seen.add(csKey(sp));
      out.push(sp);
    }
  return out.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'es'));
}
function csFiltered() {
  const q = norm(P.q);
  return csLibrary().filter(
    s =>
      (P.lvl === '' || +s.level === +P.lvl) &&
      (P.max == null || +s.level <= P.max) &&
      (P.min == null || +s.level >= P.min) &&
      (!q || norm(s.name).includes(q))
  );
}
function csResultsHTML() {
  const own = (P.own = csFiltered());
  if (!own.length) return '';
  const mine = new Set(P.list.filter(csOwn).map(csKey));
  return `<h3 class="sp-own-h">Tus conjuros propios</h3>${own
    .map((s, i) => {
      const have = mine.has(csKey(s)),
        open = P.open === 'own:' + i;
      return `<div class="sp-row"><div class="it-head"><button class="b sm" data-act="sp-det" data-id="own:${i}" aria-expanded="${open}" style="border:0;padding:0;background:none;text-align:left;flex:1 1 auto;min-width:0;display:block">
        <span class="it-name">${esc(s.name)}</span><span class="tag">propio</span>${s.conc ? '<span class="tag">C</span>' : ''}${s.ritual ? '<span class="tag">R</span>' : ''}
        <span class="meta" style="display:block">${esc([+s.level ? 'Nivel ' + s.level : 'Truco', TIME[s.time] || s.time, s.range, s.dur].filter(Boolean).join(' · '))}</span></button>
      <button class="b sm ${have ? 'bad' : 'pri'}" data-act="sp-tog" data-own="${i}">${have ? 'Quitar' : 'Añadir'}</button></div>
      ${open ? `<div class="sp-det"><div class="lang">Conjuro propio</div>${esc(s.desc || 'Sin descripción.')}${s.material ? `\n\nMaterial: ${esc(s.material)}` : ''}</div>` : ''}</div>`;
    })
    .join('')}<h3 class="sp-own-h">Catálogo</h3>`;
}
function spResultsHTML() {
  const all = spFiltered(),
    list = all.slice(0, 80),
    mine = new Set(P.list.map(s => s.ref).filter(Boolean));
  return (
    csResultsHTML() +
    `<p class="sp-count">${all.length} conjuro${all.length === 1 ? '' : 's'}${all.length > 80 ? ' · mostrando 80, afina la búsqueda' : ''}</p>` +
    list
      .map(s => {
        const have = mine.has(s.id),
          open = P.open === s.id;
        return `<div class="sp-row"><div class="it-head"><button class="b sm" data-act="sp-det" data-id="${s.id}" aria-expanded="${open}" style="border:0;padding:0;background:none;text-align:left;flex:1 1 auto;min-width:0;display:block">
        <span class="it-name">${esc(s.n)}</span>${s.k ? '<span class="tag">C</span>' : ''}${s.ri ? '<span class="tag">R</span>' : ''} <span class="en">${esc(s.en)}</span>
        <span class="meta" style="display:block">${s.l === 0 ? 'Truco' : 'Nivel ' + s.l} · ${esc(s.s)} · ${esc(TIME[s.t] || s.t)} · ${esc(s.r)} · ${esc(s.d)}</span></button>
      <button class="b sm ${have ? 'bad' : 'pri'}" data-act="sp-tog" data-id="${s.id}">${have ? 'Quitar' : 'Añadir'}</button></div>
      ${open ? `<div class="sp-det"><div class="lang">Texto del SRD 5.2</div>${esc(s.de)}${s.hl ? '\n\nA niveles superiores: ' + esc(s.hl) : ''}${s.m ? `\n\nMaterial: ${esc(s.m)}` : ''}\n\nClases: ${s.c.map(k => (CL[k] ? CL[k].n : k)).join(', ')}</div>` : ''}</div>`;
      })
      .join('')
  );
}
function spPickerHTML() {
  const lv = [
    ['', 'Todos los niveles'],
    ['0', 'Trucos'],
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9]
      .filter(l => P.max == null || l <= P.max)
      .map(l => [String(l), 'Nivel ' + l]),
  ];
  return `<div class="sp-tools"><input type="search" id="sp-q" placeholder="Buscar por nombre (castellano o inglés)" value="${esc(P.q)}" autocomplete="off">
    <select id="sp-cls" aria-label="Clase">${CLASS_OPTS()
      .map(([k, n]) => `<option value="${k}" ${P.cls === k ? 'selected' : ''}>${n}</option>`)
      .join('')}</select>
    <select id="sp-lvl" aria-label="Nivel">${lv.map(([k, n]) => `<option value="${k}" ${P.lvl === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
    <div id="sp-results">${spResultsHTML()}</div>`;
}
function refreshPicker() {
  const r = $('#sp-results');
  if (r) r.innerHTML = spResultsHTML();
  if (W) renderWizCounts();
  const pc = $('#prep-counts');
  if (pc && P && P.target === 'prep') pc.innerHTML = prepCounts();
  const bc = $('#book-count');
  if (bc && P && P.target === 'book') bc.innerHTML = bookCount();
}
function prepCounts() {
  const c = C(),
    ca = casterOf(defOf(c), subOf(c));
  if (!ca) return '';
  const can = (ca.cantrips ? ca.cantrips[c.level - 1] : 0) + (+c.cantripPlus || 0),
    prep = ca.prepared ? ca.prepared[c.level - 1] : 0;
  return countsHTML({
    can,
    prep,
    cur: {
      c: c.spells.filter(s => !s.src && +s.level === 0).length,
      p: c.spells.filter(s => !s.src && +s.level > 0).length,
    },
    max: maxSpellLevel(ca.type, c.level),
  });
}
function openPrepModal() {
  const c = C(),
    ca = casterOf(defOf(c), subOf(c));
  if (!ca) return;
  const rule = PREP_RULE[c.classKey];
  P = {
    target: 'prep',
    q: '',
    lvl: '',
    cls: ca.list,
    open: '',
    list: c.spells,
    max: maxSpellLevel(ca.type, c.level),
    /* El mago también puede cambiar un truco tras el descanso largo */
    min: c.classKey === 'wizard' ? 0 : 1,
    /* El mago solo prepara lo que tiene en su libro */
    only: bookOf(c) && c.book.length ? c.book.map(b => b.ref) : null,
  };
  openModal(
    `<div class="wz-head"><h2>Cambiar conjuros preparados</h2><button class="b sm" data-act="sp-close">Hecho</button></div>
    <p class="hint">${rule === 'one' ? 'Tras un descanso largo puedes cambiar <b>uno</b> de tus conjuros preparados por otro de tu lista.' : c.classKey === 'wizard' ? 'Tras un descanso largo puedes cambiar los que quieras, eligiendo entre los de tu libro de conjuros, y también <b>uno</b> de tus trucos por otro truco de mago.' : 'Tras un descanso largo puedes cambiar los que quieras de tu lista de clase.'} Los marcados como «Siempre preparado» no cuentan en el límite.</p>
    <div id="prep-counts" style="margin:.3rem 0 .6rem">${prepCounts()}</div><div class="wz-body">${spPickerHTML()}</div>`,
    true
  );
}
function openSpellModal() {
  const c = C(),
    def = defOf(c),
    ca = casterOf(def, subOf(c));
  P = { target: 'edit', q: '', lvl: '', cls: ca ? ca.list : '', open: '', list: c.spells, max: null };
  openModal(
    `<div class="wz-head"><h2>Buscar conjuros</h2><button class="b sm" data-act="sp-close">Hecho</button></div>
    <p class="hint">Añade o quita conjuros de la ficha de ${esc(c.name)}. Filtrado por defecto con la lista de tu clase.</p>
    <div class="wz-body">${spPickerHTML()}</div>`,
    true
  );
}
