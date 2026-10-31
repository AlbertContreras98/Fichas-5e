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
      (!q || norm(s.n).includes(q) || norm(s.en).includes(q))
  );
}
function spResultsHTML() {
  const all = spFiltered(),
    list = all.slice(0, 80),
    mine = new Set(P.list.map(s => s.ref).filter(Boolean));
  return (
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
}
function prepCounts() {
  const c = C(),
    ca = casterOf(defOf(c), subOf(c));
  if (!ca) return '';
  const can = ca.cantrips ? ca.cantrips[c.level - 1] : 0,
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
    min: 1,
  };
  openModal(
    `<div class="wz-head"><h2>Cambiar conjuros preparados</h2><button class="b sm" data-act="sp-close">Hecho</button></div>
    <p class="hint">${rule === 'one' ? 'Tras un descanso largo puedes cambiar <b>uno</b> de tus conjuros preparados por otro de tu lista.' : c.classKey === 'wizard' ? 'Tras un descanso largo puedes cambiar los que quieras, eligiendo entre los de tu libro de conjuros.' : 'Tras un descanso largo puedes cambiar los que quieras de tu lista de clase.'} Los marcados como «Siempre preparado» no cuentan en el límite.</p>
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
