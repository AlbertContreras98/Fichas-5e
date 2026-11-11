/* Acciones — Asistente, buscador de conjuros, conjuros propios, invocaciones y dotes. */
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
  'ft-open': openFeats,
  'ft-close': () => {
    closeModal();
    save();
    render();
  },
  'ft-add': () => {
    const c = C();
    if (!FTS || ftMissing(FTS, ftCtx(c))) return;
    const n = FEATS[FTS.k].n;
    featApply(c, FTS, FEATS[FTS.k].cat === 'style' ? 'Estilo de combate' : 'Dote');
    FTS = ftNew(null);
    save();
    ftRefresh();
    toast(`<div class="t-label">Dote añadida</div><div class="t-big">${esc(n)}</div>`);
  },
  'ft-del': el => {
    const c = C(),
      o = ftOwned(c)[+el.dataset.i];
    if (!o) return;
    featRemove(c, o.k, o.rec);
    save();
    ftRefresh();
  },
  'iv-open': openInvocations,
  'iv-add': el => {
    const st = ivState();
    st.list.push({ id: el.dataset.id, pick: '' });
    ivRefresh();
  },
  'iv-del': el => {
    ivState().list.splice(+el.dataset.i, 1);
    ivRefresh();
  },
  'iv-save': () => {
    const c = C();
    if (!IVS || ivProblems(IVS).length) return;
    ivApply(c, IVS);
    closeModal();
    save();
    render();
    toast(
      `<div class="t-label">Invocaciones guardadas</div><div class="t-parts">Las tienes en «Rasgos y dotes»; las que dan un conjuro gratis salen en tu Magia.</div>`
    );
    ivFeatAsk();
  },
  /* Guarda las elecciones de la dote de «Lecciones de los Primeros»: quita la dote apuntada como texto y la aplica con sus opciones */
  'iv-feat-ok': () => {
    const c = C();
    if (!FTS || !FTS.iv) return;
    const fs = FTS,
      k = fs.k;
    if (ftMissing(fs, Object.assign(ftCtx(c), { keys: (c.featKeys || []).filter(x => x !== k) }))) return;
    featRemove(c, k, null);
    featApply(c, fs, IV_FEAT_SRC);
    closeModal();
    save();
    render();
    toast(
      `<div class="t-label">${esc(FEATS[k].n)}</div><div class="t-parts">Elecciones guardadas en la ficha.</div>`
    );
    ivFeatAsk();
  },
  'cs-new': () => csOpen(-1),
  'cs-edit': el => csOpen(+el.dataset.i),
  'cs-save': el => {
    const c = C(),
      i = +el.dataset.i,
      x = csRead();
    if (!x.name) {
      $('#cs-name').focus();
      toast('<div class="t-parts">Ponle un nombre al conjuro.</div>');
      return;
    }
    const sp = i >= 0 ? c.spells[i] : NEW.spells();
    if (i >= 0 && csKey(sp) !== csKey(x)) csForget(sp);
    Object.assign(sp, x);
    csRemember(sp);
    if (i < 0) c.spells.push(sp);
    c.spells.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'es'));
    if (!c.spellcasting.ability)
      c.spellcasting.ability = ['int', 'wis', 'cha'].sort((a, b) => c.abilities[b] - c.abilities[a])[0];
    closeModal();
    save();
    render();
    toast(
      `<div class="t-label">${i >= 0 ? 'Conjuro guardado' : 'Conjuro creado'}</div><div class="t-big">${esc(x.name)}</div>`
    );
  },
  'cs-del': el => {
    const c = C(),
      sp = c.spells[+el.dataset.i];
    if (!sp) return;
    openModal(`<h2>¿Borrar ${esc(sp.name)}?</h2><p class="hint">Se quita de esta ficha y deja de salir en «Buscar conjuros» (salvo que otra ficha lo tenga). Si lo exportaste antes, el archivo sigue sirviendo para recuperarlo.</p>
      <div class="btns"><button class="b bad" data-act="cs-del-ok" data-i="${el.dataset.i}">Borrar</button><button class="b" data-act="cs-edit" data-i="${el.dataset.i}">Cancelar</button></div>`);
  },
  'cs-del-ok': el => {
    const c = C(),
      sp = c.spells[+el.dataset.i];
    if (sp) csForget(sp);
    c.spells.splice(+el.dataset.i, 1);
    closeModal();
    save();
    render();
  },
  'cs-exp': csExportOpen,
  'cs-exp-ok': csExport,
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
    if (el.dataset.own !== undefined) {
      const s = P.own && P.own[+el.dataset.own];
      if (!s) return;
      const i = P.list.findIndex(x => csOwn(x) && csKey(x) === csKey(s));
      if (i >= 0) P.list.splice(i, 1);
      else P.list.push(Object.assign(NEW.spells(), csFields(s)));
    } else {
      const d = SPBY[el.dataset.id],
        i = P.list.findIndex(s => s.ref === d.id);
      if (i >= 0) P.list.splice(i, 1);
      else P.list.push(spellObj(d));
    }
    P.list.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'es'));
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
