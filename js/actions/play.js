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
  /* Conjuro de curación sobre ti: el jugador tira los dados y la app suma la aptitud */
  'heal-cast': el => {
    const t = el.closest('.toast');
    if (t) t.remove();
    const n = +el.dataset.n,
      d = +el.dataset.d,
      x = +el.dataset.x;
    healRoll(
      el.dataset.t,
      `Tira <b>${n}d${d}</b> y escribe lo que suman.${x ? ` La app añade tu aptitud (${sgn(x)}).` : ''}`,
      x,
      n * d
    );
  },
  /* Reacción que resta daño: primero se escribe el daño en la ventana de vida */
  'hp-red': el => {
    const c = C(),
      dmg = Math.max(0, parseInt($('#hpAmt').value) || 0),
      R = DMG_REACT.find(x => x[0] === el.dataset.k);
    if (!R) return;
    if (!dmg) {
      $('#hpAmt').focus();
      toast('<div class="t-parts">Escribe primero el daño que te hacen y luego pulsa la reacción.</div>');
      return;
    }
    if (!R[2]) return dmgReactApply(c, R, dmg, R[3] ? R[3](c) : Math.ceil(dmg / 2));
    const x = R[3](c);
    openModal(`<h2>${esc(R[1])}</h2><p>Usas tu reacción para reducir ${R[4]}. Tira <b>${R[2]}</b> y escribe el resultado: la app suma ${sgn(x)}.</p>
      <div class="hpctl"><input id="red-r" type="number" inputmode="numeric" min="1" max="${R[2].slice(2)}" aria-label="Resultado del dado"><button class="b pri" data-act="hp-red-ok" data-k="${R[0]}" data-dmg="${dmg}">Reducir</button></div>
      <div class="btns"><button class="b" data-act="vida">Volver</button></div>`);
    setTimeout(() => $('#red-r') && $('#red-r').focus(), 0);
  },
  /* Desviar ataques: si dejas el daño en 0, gastas 1 punto y lo devuelves */
  'deflect-back': el => {
    const c = C(),
      pts = c.features.find(x => x.name === 'Puntos de concentración' && x.uses.max - x.uses.used > 0);
    if (!pts) return;
    pts.uses.used++;
    const t = el.closest('.toast');
    if (t) t.remove();
    const maD = infoFor(defOf(c), subOf(c), c.level)['Dado de artes marciales'] || 'd6';
    save();
    render();
    toast(
      `<div class="t-label">Devuelves el golpe</div><div class="t-parts">Elige una criatura a 5 pies (si el ataque era cuerpo a cuerpo) o que veas a 60 pies (si era a distancia). Hace una salvación de DES <b>CD ${8 + pb(c) + M(c, 'wis')}</b>: si falla, recibe <b>2${maD} ${sgn(M(c, 'dex'))}</b> del mismo tipo de daño que el ataque.</div><div class="t-parts">Te ${pts.uses.max - pts.uses.used === 1 ? 'queda 1 punto' : `quedan ${pts.uses.max - pts.uses.used} puntos`}.</div>`,
      true
    );
  },
  'hp-red-ok': el => {
    const c = C(),
      R = DMG_REACT.find(x => x[0] === el.dataset.k),
      r = parseInt($('#red-r').value),
      max = +R[2].slice(2);
    if (!(r >= 1 && r <= max)) return $('#red-r').focus();
    dmgReactApply(c, R, +el.dataset.dmg, r + R[3](c));
  },
  /* Salvación contra muerte: el jugador dice qué ha sacado y la app suma el éxito o el fallo */
  'ds-roll': el => {
    const c = C(),
      r = el.dataset.r;
    if (c.hp.current > 0) return;
    const t = el.closest('.toast');
    if (t) t.remove();
    if ($('#modal') && !$('#modal').hidden && $('#ds-ask')) closeModal();
    if (c.turn) c.turn.ds = true;
    if (r === '20') return A.nat20();
    if (r === 'ok') c.deathSaves.success = Math.min(3, c.deathSaves.success + 1);
    else c.deathSaves.fail = Math.min(3, c.deathSaves.fail + (r === '1' ? 2 : 1));
    save();
    render();
    const s3 = c.deathSaves.success >= 3,
      f3 = c.deathSaves.fail >= 3;
    toast(
      `<div class="t-label">Salvación contra muerte</div><div class="t-parts">${r === 'ok' ? 'Éxito' : r === '1' ? 'Un 1: dos fallos' : 'Fallo'}. Llevas ${c.deathSaves.success} ${c.deathSaves.success === 1 ? 'éxito' : 'éxitos'} y ${c.deathSaves.fail} ${c.deathSaves.fail === 1 ? 'fallo' : 'fallos'}.${f3 ? ' <b>Tu personaje muere.</b>' : s3 ? ' <b>Estás estable:</b> ya no tiras más. Sin curación, recuperas 1 PG en 1d4 horas.' : ''}</div>`,
      f3 || s3
    );
  },
  /* Corregir una muerte marcada por error */
  undead: () => {
    const c = C();
    c.deathSaves.fail = Math.min(2, c.deathSaves.fail);
    if (+c.exhaustion >= 6) c.exhaustion = 5;
    save();
    render();
  },
  relentless: el => {
    const c = C(),
      f = c.features.find(x => x.name === 'Aguante incansable' && x.uses.max - x.uses.used > 0);
    if (!f || c.hp.current > 0) return;
    f.uses.used++;
    c.hp.current = 1;
    c.deathSaves = { success: 0, fail: 0 };
    /* No llegas a caer: tampoco quedas derribado (si fue por esta caída) */
    c.conditions = c.conditions.filter(x => x !== 'Inconsciente' && !(x === 'Derribado' && c.koProne));
    delete c.koProne;
    const t = el.closest('.toast');
    if (t) t.remove();
    save();
    render();
    toast(
      '<div class="t-label">Aguante incansable</div><div class="t-parts">En vez de caer, te quedas a 1 PG.</div>'
    );
  },
  /* El golpe recibido a 0 PG era un crítico: segundo fallo de salvación contra muerte */
  'crit-fail': el => {
    const c = C();
    c.deathSaves.fail = Math.min(3, c.deathSaves.fail + 1);
    const t = el.closest('.toast');
    if (t) t.remove();
    save();
    render();
    toast(
      `<div class="t-label">Crítico a 0 PG</div><div class="t-parts">Sumas otro fallo: llevas ${c.deathSaves.fail} de 3.</div>`
    );
  },
  /* Fuera de combate: pasa el tiempo y caducan los efectos (los de rondas acaban con 1 minuto o más) */
  'pass-time': el => {
    const c = C(),
      m = +el.dataset.m,
      gone = passTime(c, m);
    save();
    render();
    refreshVida();
    toast(
      `<div class="t-label">Pasan ${m === 60 ? '1 hora' : `${m} min`}</div><div class="t-parts">${gone && gone.length ? `Terminan: ${gone.map(esc).join(', ')}.` : 'Ningún efecto termina todavía.'}</div>`
    );
  },
  /* Recuperación arcana (mago 1): tras un descanso corto, espacios gastados cuyos niveles sumen hasta la mitad del nivel de mago (redondeando hacia arriba), ninguno de nivel 6 o más */
  arcane: el => {
    const c = C(),
      f = c.features[+el.dataset.i];
    if (!f || f.uses.max - f.uses.used <= 0) return;
    const cap = Math.ceil(c.level / 2),
      rows = c.slots
        .map((s, i) => ({ L: i + 1, used: Math.min(+s.used || 0, +s.total || 0) }))
        .filter(o => o.L <= 5 && o.L <= cap && o.used > 0);
    if (!rows.length) {
      toast(
        '<div class="t-label">Recuperación arcana</div><div class="t-parts">No tienes espacios gastados que puedas recuperar (de nivel 1 a 5).</div>'
      );
      return;
    }
    openModal(`<h2>Recuperación arcana</h2><p>Al terminar un descanso corto recuperas espacios gastados cuyos niveles sumen como mucho <b>${cap}</b> (la mitad de tu nivel de mago, redondeando hacia arriba). Ninguno puede ser de nivel 6 o más.</p>
      <div class="grid">${rows.map(o => `<label class="f"><span>Nivel ${o.L} (gastados ${o.used})</span><select data-arc="${o.L}">${Array.from({ length: Math.min(o.used, Math.floor(cap / o.L)) + 1 }, (_, n) => `<option value="${n}">${n}</option>`).join('')}</select></label>`).join('')}</div>
      <p class="hint" id="arc-msg"></p>
      <div class="btns"><button class="b pri" data-act="arcane-ok" data-i="${el.dataset.i}">Recuperar</button><button class="b" data-act="close-modal">Cancelar</button></div>`);
  },
  'arcane-ok': el => {
    const c = C(),
      f = c.features[+el.dataset.i],
      cap = Math.ceil(c.level / 2),
      pick = [...document.querySelectorAll('[data-arc]')]
        .map(s => [+s.dataset.arc, +s.value])
        .filter(([, n]) => n > 0),
      sum = pick.reduce((t, [L, n]) => t + L * n, 0);
    if (!pick.length) return ($('#arc-msg').textContent = 'Elige al menos un espacio.');
    if (sum > cap) return ($('#arc-msg').textContent = `Suman ${sum} niveles y el máximo es ${cap}.`);
    pick.forEach(([L, n]) => (c.slots[L - 1].used = Math.max(0, c.slots[L - 1].used - n)));
    f.uses.used++;
    closeModal();
    save();
    render();
    toast(
      `<div class="t-label">Recuperación arcana</div><div class="t-parts">Recuperas ${pick.map(([L, n]) => `${n} de nivel ${L}`).join(', ')}.</div>`
    );
  },
  /* Restauración hechicera (hechicero 5): tras un descanso corto, puntos de hechicería hasta la mitad del nivel (hacia abajo) */
  'sorc-rest': el => {
    const c = C(),
      f = c.features[+el.dataset.i],
      pts = c.features.find(x => x.name === 'Puntos de hechicería');
    if (!f || f.uses.max - f.uses.used <= 0 || !pts) return;
    const n = Math.min(Math.floor(c.level / 2), pts.uses.used);
    pts.uses.used -= n;
    f.uses.used++;
    save();
    render();
    toast(
      `<div class="t-label">Restauración hechicera</div><div class="t-parts">${n ? `Recuperas ${n} puntos de hechicería.` : 'No tenías puntos de hechicería gastados.'} Úsala al terminar un descanso corto.</div>`
    );
  },
  /* Astucia mágica (brujo 2): ritual de 1 minuto que devuelve espacios de pacto hasta la mitad del máximo (todos a nivel 20) */
  cunning: el => {
    const c = C(),
      f = c.features[+el.dataset.i];
    if (!f || f.uses.max - f.uses.used <= 0) return;
    const cap = c.level >= 20 ? c.pact.total : Math.ceil(c.pact.total / 2),
      n = Math.min(cap, c.pact.used);
    f.uses.used++;
    c.pact.used -= n;
    save();
    render();
    toast(
      `<div class="t-label">Astucia mágica</div><div class="t-parts">${n ? `Recuperas ${n} ${n === 1 ? 'espacio' : 'espacios'} de pacto. Tienes ${c.pact.total - c.pact.used} / ${c.pact.total}.` : 'No tenías espacios de pacto gastados.'} Tarda 1 minuto.</div>`
    );
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
    castFree = false;
    /* Concentración: avisar antes de que el conjuro nuevo acabe con el que llevas */
    if (
      !el.dataset.conc &&
      !el.dataset.who &&
      !el.dataset.force &&
      sp.conc &&
      c.concentration &&
      c.concentration !== sp.name
    ) {
      openModal(`<h2>${esc(sp.name)}</h2><p>Es de concentración y ya te estás concentrando en <b>${esc(c.concentration)}</b>. Si lo lanzas, <b>${esc(c.concentration)}</b> termina.</p>
        <div class="btns"><button class="b pri" data-act="cast-conc-ok" data-i="${el.dataset.i}">Lanzarlo igualmente</button><button class="b" data-act="close-modal">Cancelar</button></div>`);
      return;
    }
    if (!el.dataset.who && !el.dataset.force && armorAuto(c) && acCalc(c).noProf)
      toast(
        '<div class="t-label">Ojo</div><div class="t-parts">Llevas una armadura con la que no eres competente: con ella puesta no puedes lanzar conjuros. Quítatela desde el inventario.</div>',
        true
      );
    /* Armadura de mago: sobre quién se lanza; sobre ti no funciona si llevas armadura */
    if (!el.dataset.who && sp.ref === 'mage-armor') {
      const ar =
        wearsBodyArmor(c) &&
        c.equipment.find(
          e =>
            e.equipped && e.cat === 'armadura' && !(e.armor && ARMORS[e.armor] && ARMORS[e.armor].t === 's')
        );
      openModal(`<h2>Armadura de mago</h2><p>¿Sobre quién lo lanzas? Solo sube tu CA si te lo lanzas a ti.</p>
        ${ar ? `<p class="hint warn">Llevas armadura puesta (${esc(ar.name)}): sobre ti no funcionará hasta que te la quites desde el inventario.</p>` : ''}
        <div class="btns"><button class="b pri" data-act="cast-armor-ok" data-i="${el.dataset.i}" data-who="me">Sobre mí</button><button class="b" data-act="cast-armor-ok" data-i="${el.dataset.i}" data-who="other">Sobre otra criatura</button><button class="b" data-act="close-modal">Cancelar</button></div>`);
      return;
    }
    /* Conjuros que suben la CA de quien los recibe: sobre quién se lanzan */
    if (!el.dataset.who && SPELL_AC[sp.ref] && sp.ref !== 'shield') {
      openModal(`<h2>${esc(sp.name)}</h2><p>¿Sobre quién lo lanzas? Solo sube tu CA si te lo lanzas a ti.</p>
        <div class="btns"><button class="b pri" data-act="cast-armor-ok" data-i="${el.dataset.i}" data-who="me">Sobre mí</button><button class="b" data-act="cast-armor-ok" data-i="${el.dataset.i}" data-who="other">Sobre otra criatura</button><button class="b" data-act="close-modal">Cancelar</button></div>`);
      return;
    }
    castOther = el.dataset.who === 'other';
    const hdNeed = csHdCost(sp, L),
      hdLeft = c.hitDice.total - c.hitDice.spent;
    if (hdNeed > hdLeft) {
      openModal(
        `<h2>No te quedan dados de golpe</h2><p>${esc(sp.name)} gasta ${hdNeed} ${hdNeed === 1 ? 'dado' : 'dados'} de golpe al lanzarlo y te ${hdLeft === 1 ? 'queda' : 'quedan'} ${hdLeft}. Sin ellos, el conjuro falla.</p><p class="hint">Los recuperas con un descanso largo.</p><div class="btns"><button class="b" data-act="close-modal">Vale</button></div>`
      );
      return;
    }
    const need = !el.dataset.force && spConsume(c, sp);
    spPendingUse = need && need.has ? Object.assign({ sp }, need) : null;
    if (need && !need.has) {
      openModal(`<h2>Lanzar ${esc(sp.name)}</h2><p>Estás intentando lanzar un conjuro sin el objeto necesario.</p>
        <p class="hint">Este conjuro gasta: ${esc(need.what)}. No lo encuentro en tu inventario.</p>
        <button class="b opt" data-act="cast-force" data-i="${el.dataset.i}"><span>Lanzar conjuro sin necesidad de consumir el objeto necesario</span></button>
        <button class="b" data-act="close-modal">Cancelar</button>`);
      return;
    }
    if (L === 0) return afterCast(sp, 'Truco: no gasta espacio');
    const opts = slotOptions(c, L),
      usable = opts.filter(o => o.avail > 0);
    const fr = freeUse(c, sp);
    lastCastL = L;
    if ((!sp.ritual || c.combat) && !fr && usable.length === 1) {
      lastCastL = usable[0].level;
      consume(c, usable[0].kind, usable[0].level);
      return afterCast(sp, `${slotLabel(usable[0])} · te quedan ${usable[0].avail - 1}`);
    }
    openModal(`<h2>Lanzar ${esc(sp.name)}</h2><p class="hint">Elige con qué espacio. Con uno de nivel superior algunos conjuros son más potentes.</p>
      ${opts.map(o => `<button class="b opt" data-act="cast-with" data-i="${el.dataset.i}" data-kind="${o.kind}" data-level="${o.level}" ${o.avail > 0 ? '' : 'disabled'}><span>${slotLabel(o)}</span><small>quedan ${o.avail}</small></button>`).join('')}
      ${fr ? `<button class="b opt" data-act="cast-with" data-i="${el.dataset.i}" data-kind="free"><span>Gratis (${esc(sp.src || 'rasgo')})</span><small>${fr.atwill ? 'sin límite' : `quedan ${fr.uses.max - fr.uses.used}`}</small></button>` : ''}
      ${sp.ritual ? (c.combat ? '<p class="hint">Como ritual tarda 10 minutos más: no da tiempo en combate.</p>' : `<button class="b opt" data-act="cast-with" data-i="${el.dataset.i}" data-kind="ritual"><span>Como ritual</span><small>+10 min, sin espacio</small></button>`) : ''}
      <button class="b" data-act="close-modal">Cancelar</button>`);
  },
  'cast-conc-ok': el => {
    const pe = pendingEco;
    closeModal();
    pendingEco = pe;
    A.cast({ dataset: { i: el.dataset.i, conc: '1' } });
  },
  'cast-armor-ok': el => {
    const pe = pendingEco;
    closeModal();
    pendingEco = pe;
    A.cast({ dataset: { i: el.dataset.i, who: el.dataset.who } });
  },
  'cast-force': el => {
    const pe = pendingEco;
    closeModal();
    pendingEco = pe;
    A.cast({ dataset: { i: el.dataset.i, force: '1', who: castOther ? 'other' : 'me' } });
  },
  'fl-ok': el => {
    const c = C(),
      r = parseInt($('#fl-r').value);
    if (!(r >= 2 && r <= 8)) {
      $('#fl-r').focus();
      toast('<div class="t-parts">Escribe lo que suman los dos d4 (de 2 a 8).</div>');
      return;
    }
    closeModal();
    giveTemp(c, r + +el.dataset.x, 'Falsa vida');
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
      if (f && f.uses) f.uses.used = Math.min(f.uses.max, f.uses.used + 1);
      castFree = true;
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
        : '<div class="t-label">Inspiración gastada</div><div class="t-parts">Repite la tirada d20 y quédate con el nuevo resultado.</div>'
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
      rolled = Math.max(0, parseInt($('#hpAmt').value) || 0);
    if (!rolled) {
      $('#hpAmt').focus();
      return;
    }
    let m = el.dataset.m,
      n = rolled,
      why = '';
    if (m === 'half' || m === 'double') {
      n = m === 'half' ? Math.floor(rolled / 2) : rolled * 2;
      why =
        m === 'half'
          ? `<div class="t-parts">Resistencia: la mitad de ${rolled}, redondeando hacia abajo.</div>`
          : `<div class="t-parts">Vulnerabilidad: el doble de ${rolled}.</div>`;
      m = 'dmg';
    }
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
        /* Si estabas estable, el daño te hace volver a tirar */
        if (c.deathSaves.success >= 3) c.deathSaves.success = 0;
        if (rest >= c.hp.max) {
          c.deathSaves.fail = 3;
          extra =
            '<div class="t-parts"><b>Muerte instantánea:</b> estabas a 0 PG y el daño iguala o supera tus PG máximos.</div>';
        } else {
          c.deathSaves.fail = Math.min(3, c.deathSaves.fail + 1);
          extra = `<div class="t-parts">Recibir daño a 0 PG cuenta como un fallo de salvación contra muerte. Si el golpe fue un crítico, son dos.</div>${c.deathSaves.fail < 3 ? '<div class="t-actions"><button class="b sm bad" data-act="crit-fail">Era un crítico (+1 fallo)</button></div>' : ''}`;
        }
      }
      c.hp.current = Math.max(0, was - rest);
      if (was > 0 && c.hp.current === 0) {
        if (rest - was >= c.hp.max) c.deathSaves.fail = 3;
        extra =
          rest - was >= c.hp.max
            ? '<div class="t-parts"><b>Muerte instantánea:</b> el daño sobrante iguala o supera tus PG máximos.</div>'
            : '<div class="t-parts"><b>Caes inconsciente.</b> En tus turnos tira salvaciones contra muerte.</div>';
        if (!c.conditions.includes('Inconsciente')) c.conditions.push('Inconsciente');
        /* Inconsciente incluye caer derribado, y al despertar sigues en el suelo */
        if (!c.conditions.includes('Derribado')) {
          c.conditions.push('Derribado');
          c.koProne = true;
        }
        extra +=
          '<div class="t-parts">Caes <b>derribado</b> y sueltas lo que llevas en las manos. Al recuperarte sigues en el suelo (levantarte cuesta la mitad de tu movimiento) y tendrás que recoger tu arma (o invocar otra vez tu arma de pacto).</div>';
        /* Aguante incansable (orco): si le queda el uso y no es muerte instantánea, puede quedarse a 1 PG */
        const ri = c.features.find(f => f.name === 'Aguante incansable' && f.uses.max - f.uses.used > 0);
        if (ri && c.deathSaves.fail < 3)
          extra +=
            '<div class="t-actions"><button class="b sm pri" data-act="relentless">Usar Aguante incansable (quedo a 1 PG)</button></div>';
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
      const relentless = c.classKey === 'ranger' && c.level >= 13 && c.concentration === 'Marca del cazador';
      if (relentless && n > 0 && c.hp.current > 0)
        acts =
          '<div class="t-parts">Cazador implacable: el daño no rompe tu concentración en Marca del cazador.</div>';
      else if (c.concentration && n > 0 && c.hp.current > 0) {
        const dc = Math.min(30, Math.max(10, Math.floor(n / 2)));
        acts = `<div class="t-parts">Concentración en ${esc(c.concentration)}: tira salvación de CON, CD <b>${dc}</b> (tu bonificador ${sgn(saveB(c, 'con') + d20Pen(c))}${+c.exhaustion ? ', con el agotamiento' : ''}).${concAdv(c) ? ` Con <b>ventaja</b> (${concAdv(c)}): tira 2d20 y quédate el más alto.` : ''}</div><div class="t-actions"><button class="b sm" data-act="conc-keep">La supero</button><button class="b sm bad" data-act="conc-lose">La fallo</button></div>`;
      } else if (c.concentration && c.hp.current === 0) c.concentration = '';
      /* Represión infernal: reacción «cuando te daña una criatura que ves» */
      const hr = c.spells.findIndex(s => s.ref === 'hellish-rebuke');
      const rb =
        hr >= 0 && n > 0 && c.hp.current > 0 && !(c.combat && c.turn && c.turn.r) && canCast(c, c.spells[hr])
          ? `<div class="t-actions"><button class="b sm" data-act="t-cast" data-i="${hr}" data-eco="R">Responder con Represión infernal</button></div>`
          : '';
      toast(
        `<div class="t-label">Daño recibido</div><div class="t-big bad">−${n}</div>${why}<div class="t-parts">${fromTemp ? `${fromTemp} absorbidos por PG temporales · ` : ''}PG: ${c.hp.current} / ${c.hp.max}</div>${extra}${acts}${rb}`,
        !!acts || !!rb || /data-act="(crit-fail|relentless)"/.test(extra)
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
    <label class="chk"><input type="checkbox" id="eff-conc"> Requiere concentración</label>
    <p class="hint">${term('¿Qué es la concentración?', 'conc')} Márcalo si el rasgo, la dote o el objeto dice que requiere concentración. Si recibes daño, la app te pedirá la tirada para mantenerla.${C().concentration ? ` Ahora estás concentrado en <b>${esc(C().concentration)}</b>: si lo marcas, eso termina.` : ''}</p>
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
    const conc = $('#eff-conc') && $('#eff-conc').checked,
      prev = c.concentration;
    if (conc) {
      c.concentration = name;
      addEffect(c, name, d, true);
    } else c.effects.push(Object.assign({ id: uid(), name, conc: false }, d));
    const back = effBack;
    closeModal();
    save();
    render();
    if (back) openVida();
    if (conc)
      toast(
        `<div class="t-label">Concentrado en</div><div class="t-big">${esc(name)}</div>${prev && prev !== name ? `<div class="t-parts">Dejas de concentrarte en ${esc(prev)}.</div>` : ''}`
      );
  },
  info: () => openInfo(),
  'atk-open': el => atkSheet(+el.dataset.i),
  'atk-save': el => {
    const c = C(),
      i = +el.dataset.i,
      n = $('#at-name').value.trim(),
      g = id => ($('#' + id) ? $('#' + id).value : undefined);
    if (!n) {
      $('#at-name').focus();
      return;
    }
    const a = i >= 0 ? c.attacks[i] : NEW.attacks();
    a.name = n;
    if (g('at-atk') !== undefined) {
      a.atk = parseInt(g('at-atk')) || 0;
      a.dmg = g('at-dmg').trim();
      a.type = g('at-type').trim();
      a.notes = g('at-notes').trim();
    }
    if (g('at-ammo') !== undefined) a.ammo = g('at-ammo');
    if (i < 0) c.attacks.push(a);
    closeModal();
    save();
    render();
  },
  'atk-delask': el => {
    const a = C().attacks[+el.dataset.i];
    if (!a) return;
    openModal(`<h2>¿Borrar ${esc(a.name || 'este ataque')}?</h2><p>Dejará de salir en Combate.</p>
      <div class="btns"><button class="b bad" data-act="atk-del" data-i="${el.dataset.i}">Borrar</button><button class="b" data-act="atk-open" data-i="${el.dataset.i}">Cancelar</button></div>`);
  },
  'atk-del': el => {
    const c = C(),
      a = c.attacks[+el.dataset.i];
    if (!a) return;
    c.attacks.splice(+el.dataset.i, 1);
    closeModal();
    save();
    render();
    toast(
      `<div class="t-label">Quitado</div><div class="t-parts">${esc(a.name || 'El ataque')} ya no está en tus ataques.</div>`
    );
  },
});
