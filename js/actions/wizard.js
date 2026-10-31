/* Acciones — Asistente y buscador de conjuros. */
'use strict';

Object.assign(A, {
  levelup: () => {
    closeModal();
    startWizard('level');
  },
  'apply-origin': () => {
    const c = C();
    const sp = specOf(c.speciesKey);
    if (!sp) return;
    if (sp.lin && !c.lineageKey) {
      toast(
        `<div class="t-parts">Elige antes el ${esc((sp.linLabel || 'linaje').toLowerCase())} en el desplegable.</div>`
      );
      return;
    }
    applyOrigin(c);
    if (!c.spellcasting.ability && c.spells.length)
      c.spellcasting.ability = ['int', 'wis', 'cha'].sort((a, b) => c.abilities[b] - c.abilities[a])[0];
    save();
    render();
    toast(
      `<div class="t-label">Rasgos de especie aplicados</div><div class="t-parts">Velocidad, visión, rasgos, conjuros y usos de ${esc(c.species)} al nivel ${c.level}.</div>`
    );
  },
  create: () => {
    closeModal();
    startWizard('create');
  },
  'wz-cancel': closeModal,
  'wz-back': () => {
    W.step--;
    renderWizard();
  },
  'wz-next': () => {
    const st = wizSteps();
    if (!wizValid(st[W.step][0])) return;
    W.step++;
    renderWizard();
    $('#wz-body').scrollTop = 0;
  },
  'wz-apply': applyWizard,
  'wz-skill': el => {
    const k = el.dataset.k,
      i = W.skills.indexOf(k);
    i >= 0 ? W.skills.splice(i, 1) : W.skills.push(k);
    W._keepScroll = true;
    renderWizard();
  },
  'wz-sp-del': el => {
    W.spells.splice(+el.dataset.i, 1);
    W._keepScroll = true;
    renderWizard();
  },
  'sp-open': openSpellModal,
  'prep-open': el => {
    const t = el.closest('.toast');
    if (t) t.remove();
    openPrepModal();
  },
  'sp-close': () => {
    closeModal();
    save();
    render();
  },
  'sp-det': el => {
    P.open = P.open === el.dataset.id ? '' : el.dataset.id;
    refreshPicker();
  },
  'sp-tog': el => {
    const d = SPBY[el.dataset.id],
      i = P.list.findIndex(s => s.ref === d.id);
    if (i >= 0) P.list.splice(i, 1);
    else {
      P.list.push(spellObj(d));
      P.list.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'es'));
    }
    if (P.target === 'wizard') {
      const mine = $('#wz-mine');
      if (mine) {
        W._keepScroll = true;
        renderWizard();
        return;
      }
    } else save();
    refreshPicker();
  },
});
