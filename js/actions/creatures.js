/* Acciones — Criaturas y formas. */
'use strict';

Object.assign(A, {
  'crea-new': () => creaPick(),
  'crea-kind': el => {
    CX = creaBlank(C(), el.dataset.k);
    creaModal();
  },
  'crea-from-cast': el => {
    const c = C(),
      tt = el.closest('.toast');
    if (tt) tt.remove();
    CX = creaBlank(c, el.dataset.k, { s: el.dataset.s, L: +el.dataset.l || 0, cast: el.dataset.spell });
    if (el.dataset.k === 'summon' || el.dataset.k === 'steed') {
      CX.conc = el.dataset.k === 'summon';
      CX.spell = el.dataset.spell;
    }
    creaModal();
  },
  'crea-edit': el => {
    const x = C().companions.find(y => y.id === el.dataset.id);
    CX = JSON.parse(JSON.stringify(x));
    CX.attacks = CX.attacks || [];
    creaModal();
  },
  'crea-cancel': () => {
    CX = null;
    closeModal();
  },
  'cx-atk-add': () => {
    creaCollect();
    CX.attacks.push({ n: '', hit: '', dmg: '' });
    creaModal();
  },
  'cx-atk-del': el => {
    creaCollect();
    CX.attacks.splice(+el.dataset.i, 1);
    creaModal();
  },
  'crea-save': () => {
    const c = C();
    creaCollect();
    const x = CX,
      msg = $('#cx-msg');
    if (!String(x.name || '').trim()) {
      $('#cx-name').focus();
      return;
    }
    x.name = x.name.trim();
    x.attacks = (x.attacks || []).filter(a => a.n || a.dmg);
    const isNew = !x.id,
      st = creaStats(c, x);
    if (isNew && x.spend && (x.kind === 'summon' || x.kind === 'steed')) {
      const o = slotOptions(c, +x.L).find(o => o.level === +x.L && o.avail > 0);
      if (!o) {
        msg.textContent = `No te quedan espacios de nivel ${x.L}. Desmarca «Gastar un espacio» si lo lanzas de otra forma.`;
        return;
      }
      consume(c, o.kind, o.level);
    }
    if (isNew && x.kind === 'summon') {
      const S = SUMMONS[x.s];
      if (x.fromCast) {
        x.conc = true;
        x.spell = x.fromCast;
      } else if (x.concNew) {
        c.concentration = S.n;
        addEffect(c, S.n, x.s === 'insect' ? { m: 10 } : { m: 60 }, true);
        x.conc = true;
        x.spell = S.n;
      }
    }
    if (x.kind === 'steed' && isNew) c.companions = c.companions.filter(y => y.kind !== 'steed');
    if (st.track) {
      if (isNew) x.hp.current = st.hpMax;
      x.hp.max = st.hpMax;
    } else x.hp.max = x.hp.max === '' ? 0 : +x.hp.max;
    ['spend', 'concNew', 'fromCast', 'confirm', '_autoName'].forEach(k => delete x[k]);
    if (isNew) {
      x.id = uid();
      c.companions.push(x);
    } else {
      const i = c.companions.findIndex(y => y.id === x.id);
      c.companions[i] = x;
    }
    CX = null;
    closeModal();
    S.tab = 'crea';
    save();
    render();
  },
  'crea-del': () => {
    creaCollect();
    CX.confirm = true;
    creaModal();
  },
  'crea-del-ok': () => {
    const c = C();
    if (c.form === CX.id) endEffects(c, e => e.form);
    c.companions = c.companions.filter(y => y.id !== CX.id);
    CX = null;
    closeModal();
    save();
    render();
  },
  'crea-dup': () => {
    const c = C(),
      o = c.companions.find(y => y.id === CX.id),
      n = JSON.parse(JSON.stringify(o));
    n.id = uid();
    n.name = n.name.replace(/( \d+)?$/, m => ' ' + ((parseInt(m) || 1) + 1));
    c.companions.push(n);
    CX = null;
    closeModal();
    save();
    render();
  },
  'crea-hp': el => {
    const c = C(),
      x = c.companions.find(y => y.id === el.dataset.id),
      inp = $('#cp-' + x.id),
      n = Math.max(0, parseInt(inp.value) || 0);
    if (!n) {
      inp.focus();
      return;
    }
    const mx = creaStats(c, x).hpMax,
      was = x.hp.current;
    x.hp.current = el.dataset.m === 'heal' ? Math.min(mx, was + n) : Math.max(0, was - n);
    save();
    render();
    toast(
      `<div class="t-label">${esc(x.name)}</div><div class="t-big ${el.dataset.m === 'heal' ? 'good' : 'bad'}">${el.dataset.m === 'heal' ? '+' + (x.hp.current - was) : '−' + n}</div><div class="t-parts">PG: ${x.hp.current} / ${mx}${x.hp.current === 0 && was > 0 ? ' · ha caído a 0 PG' : ''}</div>`
    );
  },
  'crea-transform': el => {
    const c = C(),
      x = c.companions.find(y => y.id === el.dataset.id);
    if (x.via === 'wild') {
      const f = wsFeat(c);
      if (!f || featLeft(f) <= 0) return;
      f.uses.used++;
      spendEco(c, 'AA');
    }
    const msg = transformInto(c, x);
    save();
    render();
    toast(
      `<div class="t-label">Te transformas</div><div class="t-big">${esc(x.name)}</div><div class="t-parts">${esc(msg)}</div>`
    );
  },
  'crea-revert': () => {
    const c = C(),
      x = formOf(c);
    if (x && x.via === 'wild') spendEco(c, 'AA');
    endEffects(c, e => e.form);
    c.form = null;
    save();
    render();
    toast('<div class="t-label">Vuelves a tu forma</div>');
  },
  'form-go': el => {
    const c = C(),
      via = el.dataset.via,
      pe = pendingEco;
    closeModal();
    if (via === 'wild') {
      const f = wsFeat(c);
      if (!f || featLeft(f) <= 0) return;
      f.uses.used++;
      spendEco(c, pe || 'AA');
      if (!el.dataset.id) {
        const ws = wsInfo(c);
        if (ws) c.hp.temp = Math.max(c.hp.temp, ws.temp);
        save();
        render();
        return;
      }
    }
    const x = c.companions.find(y => y.id === el.dataset.id);
    const msg = transformInto(c, x, { conc: el.dataset.conc || null });
    save();
    render();
    toast(
      `<div class="t-label">Te transformas</div><div class="t-big">${esc(x.name)}</div><div class="t-parts">${esc(msg)}</div>`
    );
  },
  'form-familiar': () => {
    const c = C(),
      f = wsFeat(c),
      pe = pendingEco;
    closeModal();
    if (!f || featLeft(f) <= 0) return;
    f.uses.used++;
    save();
    render();
    const fam = c.companions.find(x => x.kind === 'familiar');
    if (fam) {
      fam.hp.current = +fam.hp.max || fam.hp.current;
      save();
      render();
      toast(
        `<div class="t-label">Compañero salvaje</div><div class="t-parts">${esc(fam.name)} vuelve con todos sus PG.</div>`
      );
    } else {
      CX = creaBlank(c, 'familiar');
      creaModal();
    }
  },
  't-fatk': el => {
    const c = C(),
      x = formOf(c),
      a = x && x.attacks[+el.dataset.i];
    if (!a) return;
    spendEco(c, 'A');
    save();
    render();
    toast(
      `<div class="t-label">${esc(x.name)}: ${esc(a.n)}</div><div class="t-big">1d20 ${esc(a.hit || '')}</div><div class="t-parts">Daño: ${esc(a.dmg || '—')}</div>`
    );
  },
  't-pcmd': el => {
    const c = C(),
      x = c.companions.find(y => y.id === el.dataset.id);
    if (!x) return;
    const st = creaStats(c, x);
    spendEco(c, 'AA');
    save();
    render();
    toast(
      `<div class="t-label">${esc(x.name)}: Golpe de bestia${st.n > 1 ? ' (dos veces)' : ''}</div><div class="t-big">1d20 ${esc(st.atks[0][1])}</div><div class="t-parts">Daño: ${esc(st.atks[0][2])}</div>`
    );
  },
  'form-cast': el => {
    const t = el.closest('.toast');
    if (t) t.remove();
    formPicker('poly', el.dataset.spell);
  },
});
