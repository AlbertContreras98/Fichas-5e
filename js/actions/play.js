/* Acciones — Partida: PG, estados, conjuros, efectos e inspiración. */
'use strict';

Object.assign(A, {
  tab: el => {
    S.tab = el.dataset.t;
    save();
    render();
    scrollTo(0, 0);
  },
  'close-toast': el => el.closest('.toast').remove(),
  'close-modal': closeModal,
  pip: el => {
    const c = C(),
      k = +el.dataset.i,
      kind = el.dataset.kind,
      a = +el.dataset.a;
    const nf = filled => (k < filled ? k : k + 1);
    if (kind === 'ds' || kind === 'df') {
      const key = kind === 'ds' ? 'success' : 'fail';
      c.deathSaves[key] = clamp(nf(c.deathSaves[key]), 0, 3);
    } else {
      const o = kind === 'slot' ? c.slots[a] : kind === 'pact' ? c.pact : c.features[a].uses;
      const T = kind === 'feat' ? o.max : o.total;
      o.used = clamp(T - nf(T - o.used), 0, T);
    }
    save();
    render();
  },
  'res-d': el => {
    const u = C().features[+el.dataset.i].uses;
    u.used = clamp(u.used - +el.dataset.d, 0, u.max);
    save();
    render();
  },
  cast: el => {
    const c = C(),
      sp = c.spells[+el.dataset.i],
      L = +sp.level || 0;
    if (L === 0) return afterCast(sp, 'Truco: no gasta espacio');
    const opts = slotOptions(c, L),
      usable = opts.filter(o => o.avail > 0);
    const fr = freeUse(c, sp);
    lastCastL = L;
    if (!sp.ritual && !fr && usable.length === 1) {
      lastCastL = usable[0].level;
      consume(c, usable[0].kind, usable[0].level);
      return afterCast(sp, `${slotLabel(usable[0])} · te quedan ${usable[0].avail - 1}`);
    }
    openModal(`<h2>Lanzar ${esc(sp.name)}</h2><p class="hint">Elige con qué espacio. Con uno de nivel superior algunos conjuros son más potentes.</p>
      ${opts.map(o => `<button class="b opt" data-act="cast-with" data-i="${el.dataset.i}" data-kind="${o.kind}" data-level="${o.level}" ${o.avail > 0 ? '' : 'disabled'}><span>${slotLabel(o)}</span><small>quedan ${o.avail}</small></button>`).join('')}
      ${fr ? `<button class="b opt" data-act="cast-with" data-i="${el.dataset.i}" data-kind="free"><span>Gratis (${esc(sp.src || 'rasgo')})</span><small>quedan ${fr.uses.max - fr.uses.used}</small></button>` : ''}
      ${sp.ritual ? `<button class="b opt" data-act="cast-with" data-i="${el.dataset.i}" data-kind="ritual"><span>Como ritual</span><small>+10 min, sin espacio</small></button>` : ''}
      <button class="b" data-act="close-modal">Cancelar</button>`);
  },
  'cast-with': el => {
    const c = C(),
      sp = c.spells[+el.dataset.i],
      pe = pendingEco;
    closeModal();
    pendingEco = pe;
    lastCastL = +sp.level || 0;
    if (el.dataset.kind === 'ritual') return afterCast(sp, 'Como ritual: sin espacio');
    if (el.dataset.kind === 'free') {
      const f = freeUse(c, sp);
      if (f) f.uses.used = Math.min(f.uses.max, f.uses.used + 1);
      return afterCast(sp, `Uso gratuito de ${sp.src || 'rasgo'}`);
    }
    lastCastL = +el.dataset.level || +sp.level;
    consume(c, el.dataset.kind, +el.dataset.level);
    const o = slotOptions(c, +sp.level).find(
      x => x.kind === el.dataset.kind && x.level === +el.dataset.level
    );
    afterCast(
      sp,
      `${slotLabel({ kind: el.dataset.kind, level: +el.dataset.level })} · te quedan ${o ? o.avail : 0}`
    );
  },
  'end-conc': () => {
    C().concentration = '';
    save();
    render();
  },
  'conc-keep': el => el.closest('.toast').remove(),
  'conc-lose': el => {
    el.closest('.toast').remove();
    C().concentration = '';
    save();
    render();
  },
  insp: () => {
    const c = C();
    c.inspiration = !c.inspiration;
    save();
    render();
    toast(
      c.inspiration
        ? '<div class="t-label">Inspiración heroica</div><div class="t-parts">La tienes. Gástala para repetir una tirada d20 que no te guste (te quedas con el nuevo resultado).</div>'
        : '<div class="t-label">Inspiración gastada</div>'
    );
  },
  cond: el => {
    const c = C(),
      n = el.dataset.n,
      i = c.conditions.indexOf(n);
    i >= 0 ? c.conditions.splice(i, 1) : c.conditions.push(n);
    if (i < 0 && INCAP.includes(n) && c.form) {
      const fx = formOf(c);
      endEffects(c, e => e.form);
      c.form = null;
      toast(
        `<div class="t-label">Vuelves a tu forma</div><div class="t-parts">${esc(fx ? fx.name : 'La transformación')} termina al quedar incapacitado.</div>`
      );
    }
    if (i < 0 && INCAP.includes(n) && c.concentration) {
      const lost = c.concentration;
      c.concentration = '';
      toast(
        `<div class="t-label">Pierdes la concentración</div><div class="t-parts">${esc(lost)} termina: ${n === 'Incapacitado' ? 'estás incapacitado' : `el estado ${esc(n)} te incapacita`}.</div>`
      );
    }
    save();
    render();
    if (el.closest('.condpick')) A.conds();
  },
  conds: () => {
    const c = C();
    openModal(`<div class="wz-head"><h2>Estados</h2><button class="b sm" data-act="close-modal">Hecho</button></div>
    <p class="hint">Toca para activar o quitar. Debajo de cada uno, qué hace.</p>
    <div class="condpick">${CONDS.map(([n, ds]) => `<button class="b opt ${c.conditions.includes(n) ? 'pri' : ''}" data-act="cond" data-n="${n}" aria-pressed="${c.conditions.includes(n)}"><span><b>${n}</b><br><small>${esc(ds)}</small></span><span aria-hidden="true">${c.conditions.includes(n) ? '✓' : ''}</span></button>`).join('')}</div>`);
  },
  exh: el => {
    const c = C();
    c.exhaustion = clamp((+c.exhaustion || 0) + +el.dataset.d, 0, 6);
    save();
    render();
  },
  hp: el => {
    const c = C(),
      n = Math.max(0, parseInt($('#hpAmt').value) || 0);
    if (!n) {
      $('#hpAmt').focus();
      return;
    }
    const m = el.dataset.m;
    if (m === 'heal') {
      const was = c.hp.current;
      c.hp.current = Math.min(c.hp.max, c.hp.current + n);
      if (was <= 0 && c.hp.current > 0) {
        c.deathSaves = { success: 0, fail: 0 };
        c.conditions = c.conditions.filter(x => x !== 'Inconsciente');
      }
      toast(
        `<div class="t-label">Curación</div><div class="t-big good">+${c.hp.current - was}</div><div class="t-parts">PG: ${c.hp.current} / ${c.hp.max}</div>`
      );
    } else if (m === 'temp') {
      c.hp.temp = Math.max(c.hp.temp, n);
      toast(
        `<div class="t-label">PG temporales</div><div class="t-big">${c.hp.temp}</div><div class="t-parts">No se suman: te quedas con el valor más alto.</div>`
      );
    } else {
      let rest = n;
      const fromTemp = Math.min(c.hp.temp, rest);
      c.hp.temp -= fromTemp;
      rest -= fromTemp;
      const was = c.hp.current;
      let extra = '';
      if (was <= 0 && rest > 0) {
        c.deathSaves.fail = Math.min(3, c.deathSaves.fail + 1);
        extra =
          '<div class="t-parts">Recibir daño a 0 PG cuenta como un fallo de salvación contra muerte (dos si es crítico).</div>';
      }
      c.hp.current = Math.max(0, was - rest);
      if (was > 0 && c.hp.current === 0) {
        extra =
          rest - was >= c.hp.max
            ? '<div class="t-parts"><b>Muerte instantánea:</b> el daño sobrante iguala o supera tus PG máximos.</div>'
            : '<div class="t-parts"><b>Caes inconsciente.</b> En tus turnos tira salvaciones contra muerte.</div>';
        if (!c.conditions.includes('Inconsciente')) c.conditions.push('Inconsciente');
      }
      if (c.form) {
        const fx = formOf(c);
        if (c.hp.current === 0 || (fx && fx.via === 'poly' && c.hp.temp === 0 && fromTemp > 0)) {
          endEffects(c, e => e.form);
          c.form = null;
          extra += `<div class="t-parts">${esc(fx ? fx.name : 'La transformación')} termina: vuelves a tu forma.</div>`;
        }
      }
      let acts = '';
      if (c.concentration && n > 0 && c.hp.current > 0) {
        const dc = Math.min(30, Math.max(10, Math.floor(n / 2)));
        acts = `<div class="t-parts">Concentración en ${esc(c.concentration)}: tira salvación de CON, CD <b>${dc}</b> (tu bonificador ${sgn(saveB(c, 'con'))}).</div><div class="t-actions"><button class="b sm" data-act="conc-keep">La supero</button><button class="b sm bad" data-act="conc-lose">La fallo</button></div>`;
      } else if (c.concentration && c.hp.current === 0) c.concentration = '';
      toast(
        `<div class="t-label">Daño recibido</div><div class="t-big bad">−${n}</div><div class="t-parts">${fromTemp ? `${fromTemp} absorbidos por PG temporales · ` : ''}PG: ${c.hp.current} / ${c.hp.max}</div>${extra}${acts}`,
        !!acts
      );
    }
    $('#hpAmt').value = '';
    save();
    render();
  },
  nat20: () => {
    const c = C();
    c.hp.current = 1;
    c.deathSaves = { success: 0, fail: 0 };
    c.conditions = c.conditions.filter(x => x !== 'Inconsciente');
    save();
    render();
    toast(
      '<div class="t-label">¡20 natural!</div><div class="t-parts">Recuperas 1 PG y te despiertas.</div>'
    );
  },
  nat1: () => {
    const c = C();
    c.deathSaves.fail = Math.min(3, c.deathSaves.fail + 2);
    save();
    render();
  },
  undo: () => {
    const u = UNDO.pop();
    if (!u) return;
    S.chars = JSON.parse(u.chars);
    S.active = S.chars.some(x => x.id === u.active) ? u.active : S.chars[0] && S.chars[0].id;
    restOpen = false;
    D = null;
    closeModal();
    save();
    render();
    toast(
      `<div class="t-label">Deshecho</div><div class="t-parts">Has vuelto al estado anterior al último cambio.${UNDO.length ? '' : ' No quedan más cambios por deshacer.'}</div>`
    );
  },
  gloss: el => showGloss(el),
  vida: () => openVida(),
  'eff-cancel': () => {
    const back = effBack;
    closeModal();
    if (back) openVida();
  },
  'eff-del': el => {
    const c = C();
    endEffects(c, e => e.id === el.dataset.id);
    save();
    render();
  },
  'eff-add': el => {
    effBack = el.dataset.from === 'vida';
    openModal(`<h2>Añadir efecto</h2><p class="hint">Algo que dura un tiempo: un conjuro que te han lanzado, un veneno, una bendición… Las rondas bajan al pulsar «Terminar turno» (1 ronda = 6 segundos).</p>
    <label class="f"><span>Nombre</span><input id="eff-name" autocomplete="off" placeholder="Envenenado"></label>
    <div class="effdur"><label class="f"><span>Duración</span><input id="eff-n" type="number" inputmode="numeric" min="1" value="1"></label>
    <label class="f"><span>&nbsp;</span><select id="eff-u"><option value="r">rondas</option><option value="min" selected>minutos</option><option value="h">horas</option><option value="d">días</option><option value="inf">hasta que se disipe</option></select></label></div>
    <div class="btns"><button class="b pri" data-act="eff-add-ok">Añadir</button><button class="b" data-act="eff-cancel">Cancelar</button></div>`);
  },
  'eff-add-ok': () => {
    const c = C(),
      name = $('#eff-name').value.trim(),
      n = Math.max(1, parseInt($('#eff-n').value) || 1),
      u = $('#eff-u').value;
    if (!name) {
      $('#eff-name').focus();
      return;
    }
    const d =
      u === 'inf'
        ? { inf: true }
        : u === 'r'
          ? { r: n }
          : u === 'min'
            ? n <= 1
              ? { r: 10 }
              : { m: n }
            : u === 'h'
              ? { m: 60 * n }
              : { m: 1440 * n };
    c.effects.push(Object.assign({ id: uid(), name, conc: false }, d));
    const back = effBack;
    closeModal();
    save();
    render();
    if (back) openVida();
  },
  info: () => openInfo(),
});
