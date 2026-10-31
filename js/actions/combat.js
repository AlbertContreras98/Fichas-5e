/* Acciones — Combate: iniciar/terminar, acciones del turno. */
'use strict';

Object.assign(A, {
  't-mi': el => {
    const c = C(),
      e = c.equipment[+el.dataset.i];
    if (!e.mi || e.mi.ch - (+e.mi.used || 0) <= 0) return;
    e.mi.used = (+e.mi.used || 0) + 1;
    spendEco(c, 'A');
    save();
    render();
    toast(
      `<div class="t-label">Usas ${esc(e.name)}</div><div class="t-parts">${esc(e.mi.d || 'Gastas 1 carga.')} Te quedan ${e.mi.ch - e.mi.used} cargas.</div>`
    );
  },
  't-gear': el => gearUse(+el.dataset.i),
  't-scroll': el => scrollModal(+el.dataset.i, el.dataset.eco),
  't-end': () => {
    const c = C();
    c.turn = { a: false, aa: false, r: false, atk: 0 };
    if (c.combat) c.combat.round++;
    c.effects.forEach(e => {
      if (e.r != null) e.r--;
    });
    const gone = endEffects(c, e => e.r != null && e.r <= 0);
    save();
    render();
    if (gone.length)
      toast(
        `<div class="t-label">Efecto terminado</div><div class="t-parts">${gone.map(esc).join(', ')} ${gone.length > 1 ? 'han' : 'ha'} terminado.</div>`
      );
  },
  'cb-start': () => {
    const c = C();
    c.combat = { round: 1 };
    c.turn = { a: false, aa: false, r: false, atk: 0 };
    S.tab = 'combat';
    save();
    render();
    scrollTo(0, 0);
    toast(
      `<div class="t-label">¡Combate!</div><div class="t-big">Iniciativa: 1d20 ${sgn(init(c))}</div><div class="t-parts">Tira y díselo al máster. Estás en la ronda 1.</div>`
    );
  },
  'cb-end': () => {
    const c = C();
    if (!c.combat) return;
    const re = c.effects.filter(e => e.r != null),
      cs = ['Derribado', 'Agarrado', 'Apresado'].filter(n => c.conditions.includes(n)),
      n = c.combat.round;
    const box = (k, v, lbl, on, note) =>
      `<label class="chk"><input type="checkbox" data-cb="${k}" value="${esc(v)}" ${on ? 'checked' : ''}><span>${lbl}${note ? `<br><small class="muted">${note}</small>` : ''}</span></label>`;
    openModal(`<h2>Terminar combate</h2><p>Habéis llegado a la ronda ${n}. Se quita el contador y tu turno vuelve a empezar limpio.</p>
      ${re.length ? `<h3>Efectos que duran rondas</h3><p class="hint">Marca los que se acaban. Si el combate ha sido corto, alguno puede seguir activo.</p>${re.map(e => box('eff', e.id, `<b>${esc(e.name)}</b> · ${fmtEff(e)}`, !e.conc, e.conc ? 'Concentración: si lo quitas, dejas de concentrarte.' : '')).join('')}` : ''}
      ${cs.length ? `<h3>Estados de combate</h3><p class="hint">Marca los que ya no tienes.</p>${cs.map(x => box('cond', x, `<b>${x}</b>`, true)).join('')}` : ''}
      <p class="hint">Las invocaciones, la concentración y las transformaciones no se tocan: terminan por sus propias reglas.</p>
      <div class="btns"><button class="b pri" data-act="cb-end-ok">Terminar combate</button><button class="b" data-act="close-modal">Cancelar</button></div>`);
  },
  'cb-end-ok': () => {
    const c = C(),
      m = $('#modal'),
      ids = [...m.querySelectorAll('[data-cb=eff]:checked')].map(x => x.value),
      cs = [...m.querySelectorAll('[data-cb=cond]:checked')].map(x => x.value);
    const gone = endEffects(c, e => ids.includes(e.id));
    c.conditions = c.conditions.filter(x => !cs.includes(x));
    const n = c.combat ? c.combat.round : 0,
      out = [...gone, ...cs];
    c.combat = null;
    c.turn = { a: false, aa: false, r: false, atk: 0 };
    closeModal();
    save();
    render();
    toast(
      `<div class="t-label">Combate terminado</div><div class="t-parts">${n} ronda${n === 1 ? '' : 's'}.${out.length ? ` Fuera: ${out.map(esc).join(', ')}.` : ''}</div>`
    );
  },
  't-atk': el => {
    const c = C(),
      a = c.attacks[+el.dataset.i],
      T = c.turn;
    const am = a.ammo && c.equipment.find(e => e.id === a.ammo);
    if (am) {
      if (am.qty <= 0) return;
      am.qty--;
    }
    if (!T.a) {
      T.a = true;
      T.atk = attacksPerAction(c) - 1;
    } else T.atk = Math.max(0, T.atk - 1);
    save();
    render();
    toast(
      `<div class="t-label">Ataque con ${esc(a.name)}</div><div class="t-big">1d20 ${sgn(+a.atk || 0)}</div><div class="t-parts">Si impactas, daño: ${esc(a.dmg || '—')} ${esc(a.type || '')}${am ? ` · quedan ${am.qty} ${esc(am.name)}` : ''}${T.atk > 0 ? ` · te quedan ${T.atk} ataques` : ''}</div>${a.wpn && a.mastery && WEAPONS[a.wpn] ? `<div class="t-parts"><b>${MASTERY[WEAPONS[a.wpn].ms][0]}:</b> ${esc(MASTERY[WEAPONS[a.wpn].ms][1])}</div>` : ''}`
    );
  },
  't-light': el => {
    const c = C(),
      a = c.attacks[+el.dataset.i];
    c.turn.aa = true;
    save();
    render();
    toast(
      `<div class="t-label">Ataque con ${esc(a.name)} (acción adicional)</div><div class="t-big">1d20 ${sgn(+a.atk || 0)}</div><div class="t-parts">Daño: ${esc(a.dmg || '—')} sin sumar tu modificador.</div>`
    );
  },
  't-cast': el => {
    pendingEco = el.dataset.eco;
    A.cast(el);
  },
  't-feat': el => {
    const c = C(),
      f = c.features[+el.dataset.i],
      w = whenOf(f);
    if (featLeft(f) <= 0) return;
    if (f.name === 'Forma salvaje') {
      formPicker('wild');
      pendingEco = 'AA';
      return;
    }
    if (f.uses.pool || f.uses.max > 12) {
      openModal(
        `<h2>${esc(f.name)}</h2><p>Quedan <b>${featLeft(f)}</b>. ¿Cuántos gastas?</p><div class="hpctl"><input id="pool-n" type="number" inputmode="numeric" min="1" max="${featLeft(f)}" value="1"><button class="b pri" data-act="t-pool" data-i="${el.dataset.i}">Gastar</button><button class="b" data-act="close-modal">Cancelar</button></div>`
      );
      return;
    }
    f.uses.used++;
    if (w === 'atk') {
      const T = c.turn;
      if (!T.a) {
        T.a = true;
        T.atk = attacksPerAction(c) - 1;
      } else T.atk = Math.max(0, T.atk - 1);
    } else spendEco(c, w);
    if (f.name === 'Oleada de acción') {
      c.turn.a = false;
      c.turn.atk = 0;
    }
    if (f.name === 'Furia')
      toast(
        '<div class="t-label">¡Furia!</div><div class="t-parts">Ventaja en FUE, daño extra y resistencia a contundente, cortante y perforante.</div>'
      );
    save();
    render();
  },
  't-pool': el => {
    const c = C(),
      f = c.features[+el.dataset.i],
      n = clamp(parseInt($('#pool-n').value) || 0, 0, featLeft(f));
    if (!n) return;
    f.uses.used += n;
    spendEco(c, whenOf(f));
    closeModal();
    save();
    render();
  },
  't-der': el => {
    const c = C(),
      o = DERIVED[+el.dataset.j];
    if (o.cost) {
      const f = c.features.find(x => x.name === o.cost);
      if (!f || featLeft(f) <= 0) return;
      f.uses.used++;
    }
    spendEco(c, o.t);
    save();
    render();
    toast(`<div class="t-label">${esc(o.n)}</div><div class="t-parts">${esc(o.d)}</div>`);
  },
  't-item': el => {
    const c = C(),
      e = c.equipment[+el.dataset.i];
    if (e.qty <= 0) return;
    if (e.potion && POTIONS[e.potion] && e.potion !== 'other') return potModal(+el.dataset.i, el.dataset.eco);
    e.qty--;
    spendEco(c, el.dataset.eco);
    save();
    render();
    toast(
      `<div class="t-label">${e.cat === 'pocion' ? 'Bebes' : 'Usas'}</div><div class="t-big">${esc(e.name)}</div><div class="t-parts">Te quedan ${e.qty}.${/curaci/i.test(e.name) ? ' Si cura, apunta los PG en «Curar».' : ''}</div>`
    );
  },
  't-gen': el => {
    const c = C(),
      g = G[el.dataset.k];
    spendEco(c, 'A');
    save();
    render();
    toast(`<div class="t-label">${esc(g.t)}</div><div class="t-parts">${esc(g.d)}</div>`);
  },
  't-opp': () => {
    const c = C();
    c.turn.r = true;
    save();
    render();
    toast(
      `<div class="t-label">Ataque de oportunidad</div><div class="t-parts">Haz un ataque cuerpo a cuerpo con tu reacción.</div>`
    );
  },
});
