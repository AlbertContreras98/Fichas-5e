/* Eventos globales (clic, entrada, cambios, teclado) y arranque de la app. */
'use strict';

document.addEventListener('click', e => {
  if (e.target.id === 'modal') {
    if (W) return;
    if (D) {
      dLeave();
      D = null;
      closeModal();
      return;
    }
    const wasPicker = !!P;
    closeModal();
    if (wasPicker) {
      save();
      render();
    }
    return;
  }
  const el = e.target.closest('[data-act]');
  if (restOpen && !e.target.closest('.menuwrap')) {
    restOpen = false;
    renderTop();
  }
  if (!el || el.disabled) return;
  const f = A[el.dataset.act];
  if (!f) return;
  e.preventDefault();
  if (el.dataset.act === 'undo') {
    f(el);
    return;
  }
  const before = JSON.stringify(S.chars),
    act = S.active;
  f(el);
  if (JSON.stringify(S.chars) !== before) {
    UNDO.push({ chars: before, active: act });
    if (UNDO.length > 40) UNDO.shift();
    if (C()) renderTop();
  }
});
document.addEventListener('input', e => {
  const el = e.target;
  if (D && (el.id === 'd-text' || el.id === 'd-title')) {
    const n = dGet(D.note);
    if (n) {
      if (el.id === 'd-text') n.text = el.value;
      else n.name = el.value;
      n.updated = Date.now();
      if (UNDO.length) {
        UNDO.length = 0;
        renderTop();
      }
      save();
    }
    return;
  }
  if (D && el.id === 'd-pq') {
    D.pq = el.value;
    const pos = el.selectionStart;
    renderDiary();
    const q = $('#d-pq');
    if (q) {
      q.focus();
      q.setSelectionRange(pos, pos);
    }
    return;
  }
  if (D && el.id === 'd-q') {
    D.q = el.value;
    const pos = el.selectionStart;
    renderDiary();
    const q = $('#d-q');
    if (q) {
      q.focus();
      q.setSelectionRange(pos, pos);
    }
    return;
  }
  if (NI && el.id === 'ni-spl') {
    NI.spl = el.value;
    const nm = $('#ni-name');
    if (nm && (!nm.value || nm.value === NI.auto)) {
      niAutoName();
      nm.value = NI.name;
    }
    return;
  }
  if (el.id === 'sp-q') {
    P.q = el.value;
    refreshPicker();
    return;
  }
  if (W) {
    if (el.id === 'wz-name') W.name = el.value;
    else if (el.id === 'wz-species') W.species = el.value;
    else if (el.id === 'wz-background') W.background = el.value;
    else if (el.dataset.wab) {
      const k = el.dataset.wab;
      W.base[k] = clamp(parseInt(el.value) || 0, 1, 20);
      recomputeAb();
      const b = bgBonus(),
        lab = el.previousElementSibling;
      if (lab) lab.textContent = `${AB[k][2]}${b[k] ? ` +${b[k]}` : ''} → ${W.ab[k]} (${sgn(mod(W.ab[k]))})`;
    } else if (el.id === 'wz-hproll') {
      W.hpRoll = el.value;
      W.hpMode = 'roll';
      const r = document.querySelector('input[name="wz-hp"][value="roll"]');
      if (r) r.checked = true;
    } else if (el.id === 'wz-feat') W.asi.feat = el.value;
    else if (el.id === 'wz-feattext') W.asi.featText = el.value;
    refreshWizFoot();
    if (el.id === 'wz-hproll') {
      const ps = [...document.querySelectorAll('#wz-body > p')];
      const last = ps[ps.length - 1];
      if (last)
        last.innerHTML = `Ganas <b>${hpGain()} PG</b>: tus PG máximos pasan de ${C().hp.max} a <b>${C().hp.max + hpGain()}</b>.`;
    }
    return;
  }
  if (el.dataset && el.dataset.actInput === 'res-set') {
    const u = C().features[+el.dataset.i].uses;
    const v = parseInt(el.value);
    if (!isNaN(v)) {
      u.used = clamp(u.max - v, 0, u.max);
      save();
    }
    return;
  }
  if (!el.dataset || !el.dataset.path) return;
  const c = C();
  UNDO.length = 0;
  let v = el.dataset.bool ? el.checked : el.dataset.num ? (el.value === '' ? 0 : Number(el.value)) : el.value;
  const ks = el.dataset.path.split('.');
  let t = c;
  for (let i = 0; i < ks.length - 1; i++) t = t[ks[i]];
  t[ks[ks.length - 1]] = v;
  if (el.dataset.path === 'level') c.level = clamp(+v || 1, 1, 20);
  if (el.dataset.path === 'classKey') {
    c.class = v ? CL[v].n : c.class;
    c.subclassKey = '';
    c.subclass = '';
  }
  if (el.dataset.path === 'subclassKey') {
    const s = subOf(c);
    c.subclass = s ? s.n : '';
  }
  if (el.dataset.path === 'speciesKey') {
    c.lineageKey = '';
    c.species = v ? SPEC[v].n : c.species;
  }
  if (el.dataset.path === 'lineageKey') {
    const l = linOf(c.speciesKey, v);
    c.species = SPEC[c.speciesKey].n + (l ? ` (${l.n})` : '');
  }
  if (el.dataset.path === 'backgroundKey') {
    c.background = v ? BG[v].n : c.background;
  }
  if (el.dataset.path.startsWith('coins.')) {
    const tt = document.querySelector('.total');
    if (tt)
      tt.textContent = `Total: ${(totalCp(c) / 100).toLocaleString('es-ES', { maximumFractionDigits: 2 })} PO en monedas`;
  }
  save();
  renderTop();
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.id === 'imp-file' && el.files && el.files[0]) {
    const r = new FileReader();
    r.onload = () => {
      $('#imp-text').value = r.result;
      $('#imp-msg').textContent = 'Archivo cargado. Pulsa «Importar».';
    };
    r.readAsText(el.files[0]);
    return;
  }
  if (el.id === 'story-img' && el.files && el.files[0]) {
    loadPortrait(el.files[0]);
    el.value = '';
    return;
  }
  if (NI && el.dataset && el.dataset.ni) {
    niCollect();
    if (el.id === 'ni-cat' && NI.cat === 'pocion' && !NI.pot) NI.pot = 'healing';
    if (el.id === 'ni-ak' && NI.ak) NI.qty = AMMO[NI.ak][1];
    if (el.id === 'ni-gr') {
      NI.var = '';
      const G = NI.gr && NI.gr.startsWith('g:') && GEAR[NI.gr.slice(2)];
      NI.qty = G && G.qty ? G.qty : 1;
    }
    if (el.id === 'ni-mip' && NI.mi) {
      const P = MAGIC[NI.mip];
      NI.mi = {
        att: P.att || 0,
        ac: P.ac || 0,
        sv: P.sv || 0,
        ch: P.ch || 0,
        rec: P.rec || '',
        d: P.d || '',
        noarm: P.noarm || 0,
      };
      if (NI.mip !== 'other' && (!NI.name || NI.name === NI.auto)) {
        NI.name = P.n;
        NI.auto = P.n;
      }
      itemModal();
      return;
    }
    if (el.id === 'ni-cat') {
      NI.gr = '';
      if (NI.cat === 'paquete' && !NI.pack) NI.pack = 'explorer';
    }
    niAutoName();
    itemModal();
    return;
  }
  if (CX && el.dataset && el.dataset.rr) {
    const dn = k =>
      SUMMONS[k] ? SUMMONS[k].n.replace(/^Invocar /, '').replace(/^./, m => m.toUpperCase()) : '';
    const oldS = CX.s,
      oldN = $('#cx-name') ? $('#cx-name').value : '';
    creaCollect();
    if (CX.kind === 'summon' && CX.s !== oldS && (!oldN || oldN === dn(oldS))) {
      CX.name = dn(CX.s);
      CX.v = Object.keys(SUMMONS[CX.s].vars)[0];
      CX.L = SUMMONS[CX.s].L;
    }
    if (el.id === 'cx-cat' && CX.cat) {
      const b = BEASTS.find(z => z.id === CX.cat);
      if (b) applyBeast(CX, b);
    }
    creaModal();
    return;
  }
  if (el.id === 'sp-cls') {
    P.cls = el.value;
    refreshPicker();
    return;
  }
  if (el.id === 'sp-lvl') {
    P.lvl = el.value;
    refreshPicker();
    return;
  }
  if (el.dataset && el.dataset.actInput === 'res-set') {
    render();
    return;
  }
  if (W) {
    if (el.id === 'wz-class') {
      W.classKey = el.value;
      W.subKey = '';
      W.origSub = '';
      renderWizard();
      return;
    }
    if (el.name === 'wz-cls') {
      W.classKey = el.value;
      W.skills = [];
      W.spells = [];
      P = null;
      W._keepScroll = true;
      renderWizard();
      return;
    }
    if (el.name === 'wz-spec') {
      W.speciesKey = el.value;
      W.lineageKey = '';
      W.skills = [];
      W._keepScroll = true;
      renderWizard();
      return;
    }
    if (el.name === 'wz-lin') {
      W.lineageKey = el.value;
      W._keepScroll = true;
      renderWizard();
      return;
    }
    if (el.id === 'wz-bg') {
      W.bgKey = el.value;
      W.bg2 = '';
      W.bg1 = '';
      W.skills = W.skills.filter(k => !bgSkills().includes(k));
      recomputeAb();
      W._keepScroll = true;
      renderWizard();
      return;
    }
    if (el.name === 'wz-bgmode') {
      W.bgMode = el.value;
      recomputeAb();
      W._keepScroll = true;
      renderWizard();
      return;
    }
    if (el.id === 'wz-bg2') {
      W.bg2 = el.value;
      if (W.bg1 === W.bg2) W.bg1 = '';
      recomputeAb();
      W._keepScroll = true;
      renderWizard();
      return;
    }
    if (el.id === 'wz-bg1') {
      W.bg1 = el.value;
      recomputeAb();
      refreshWizFoot();
      return;
    }
    if (el.id === 'wz-hfeat') {
      W.humanFeat = el.value;
      refreshWizFoot();
      return;
    }
    if (el.name === 'wz-hp') {
      W.hpMode = el.value;
      W._keepScroll = true;
      renderWizard();
      return;
    }
    if (el.name === 'wz-sub') {
      W.subKey = el.value;
      P = null;
      W._keepScroll = true;
      renderWizard();
      return;
    }
    if (el.name === 'wz-asi') {
      W.asi.mode = el.value;
      W.asi.a = '';
      W.asi.b = '';
      W._keepScroll = true;
      renderWizard();
      return;
    }
    if (el.id === 'wz-asi-a') {
      W.asi.a = el.value;
      refreshWizFoot();
      return;
    }
    if (el.id === 'wz-asi-b') {
      W.asi.b = el.value;
      refreshWizFoot();
      return;
    }
    if (el.dataset.wab) {
      refreshWizFoot();
      return;
    }
    return;
  }
  if (el.dataset && el.dataset.rr) renderView();
});
document.addEventListener('keydown', e => {
  if (TOUR) {
    if (e.key === 'Escape') tourEnd();
    return;
  }
  if (e.key === 'Escape' && restOpen) {
    restOpen = false;
    renderTop();
  }
  if (e.key === 'Escape' && !$('#modal').hidden) {
    if (P && P.target === 'edit') {
      A['sp-close']();
    } else closeModal();
  }
  if (e.key === 'Enter' && e.target.id === 'hpAmt') A.hp({ dataset: { m: 'dmg' } });
  if (e.key === 'Enter' && e.target.id === 'ni-name') A['item-add']();
  if (e.key === 'Enter' && e.target.id === 'd-name') {
    const b = document.querySelector('.sheet [data-act=d-create],.sheet [data-act=d-rename-ok]');
    if (b) b.click();
  }
});

load();
tipsInit();
render();
addEventListener('resize', tourPlace);
addEventListener('scroll', tourPlace, true);
document.addEventListener(
  'click',
  e => {
    document.querySelectorAll('.xsel-list:not([hidden])').forEach(l => {
      if (!l.parentNode.contains(e.target)) {
        l.hidden = true;
        const b = l.previousElementSibling;
        b && b.setAttribute('aria-expanded', 'false');
      }
    });
  },
  true
);
