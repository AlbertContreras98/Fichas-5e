/* Acciones — Combate: iniciar/terminar, acciones del turno. */
'use strict';

/* Aviso de un golpe desarmado (o varios) con sus números, el crítico y lo que se suma al impactar */
function unarmedMsg(c, title, n) {
  const u = unarmedCalc(c),
    dl = d20Line(c, 'atk'),
    gs = c.features.find(f => f.name === 'Golpe aturdidor'),
    pts = c.features.find(f => f.name === 'Puntos de concentración' && f.uses.max > 0);
  return `<div class="t-label">${esc(title)}</div>${n > 1 ? `<div class="t-parts"><b>${n} golpes desarmados</b>, cada uno con su tirada:</div>` : ''}<div class="t-big">1d20 ${sgn(u.atk + d20Pen(c))}</div><div class="t-parts">Si impactas, daño: ${esc(u.dmg)} contundente</div>${dl ? `<div class="t-parts">${dl}</div>` : ''}${critLine(u.dmg, hitExtras(c, false).length)}${hitExtras(
    c,
    false
  )
    .filter(x => !/Favor divino/.test(x))
    .map(x => `<div class="t-parts">Al impactar: ${esc(x)}</div>`)
    .join(
      ''
    )}${gs && pts && featLeft(pts) > 0 ? `<div class="t-parts">Al impactar puedes usar <b>Golpe aturdidor</b> (1 punto, una vez por turno): salvación de CON CD ${8 + pb(c) + M(c, 'wis')}.</div>` : ''}`;
}
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
    /* La reacción no vuelve al terminar tu turno, sino al empezar el siguiente (turnStart) */
    const rSpent = !!c.turn.r,
      dsDone = !!c.turn.ds;
    c.turn = {
      a: false,
      aa: false,
      r: rSpent,
      atk: 0,
      wait: true,
      k: (+c.turn.k || 0) + 1,
      ready: rSpent ? '' : c.turn.ready || '',
    };
    const rd = c.combat ? c.combat.round : null;
    if (c.combat) c.combat.round++;
    c.effects.forEach(e => {
      if (e.r == null) return;
      if (e.rc != null && e.rc === rd) return delete e.rc;
      delete e.rc;
      e.r--;
    });
    const gone = endEffects(c, e => e.r != null && e.r <= 0);
    save();
    render();
    if (gone.length)
      toast(
        `<div class="t-label">Efecto terminado</div><div class="t-parts">${gone.map(esc).join(', ')} ${gone.length > 1 ? 'han' : 'ha'} terminado.</div>`
      );
    /* A 0 PG y sin estar estable ni muerto: recordar la salvación contra muerte del turno */
    if (c.hp.current <= 0 && !isDead(c) && c.deathSaves.success < 3 && !dsDone)
      openModal(
        `<h2 id="ds-ask">Salvación contra muerte</h2><p>Estás a 0 PG. Al empezar tu turno tira un d20, sin sumar nada. ¿Qué has sacado?</p>${DS_BTNS}<div class="btns"><button class="b" data-act="close-modal">Ya la había apuntado</button></div>`
      );
    const rs = repeatSaves(c);
    if (rs) toast(`<div class="t-label">Recuerda al máster</div>${rs}`, true);
  },
  'cb-start': () => {
    const c = C();
    c.combat = { round: 1 };
    /* wait: si un enemigo actúa antes y gastas la reacción, vuelve al empezar tu primer turno */
    c.turn = { a: false, aa: false, r: false, atk: 0, wait: true };
    S.tab = 'combat';
    save();
    render();
    scrollTo(0, 0);
    toast(
      `<div class="t-label">¡Combate!</div><div class="t-big">Iniciativa: 1d20 ${sgn(init(c) + d20Pen(c))}</div><div class="t-parts">Tira y díselo al máster. Estás en la ronda 1.</div>${d20Line(c, 'init') ? `<div class="t-parts">${d20Line(c, 'init')}</div>` : ''}<div class="t-parts">Si el máster dice que te han sorprendido, tira con <b>desventaja</b> (2d20, el más bajo).</div>${initFeats(c)}`
    );
  },
  'cb-end': () => {
    const c = C();
    if (!c.combat) return;
    const re = c.effects.filter(e => e.r != null),
      /* Todos los estados menos los que no acaban con el combate; los de combate, ya marcados */
      cs = c.conditions.filter(n => !['Inconsciente', 'Agotamiento'].includes(n)),
      csOn = ['Derribado', 'Agarrado', 'Apresado', 'Asustado'],
      n = c.combat.round;
    const box = (k, v, lbl, on, note) =>
      `<label class="chk"><input type="checkbox" data-cb="${k}" value="${esc(v)}" ${on ? 'checked' : ''}><span>${lbl}${note ? `<br><small class="muted">${note}</small>` : ''}</span></label>`;
    openModal(`<h2>Terminar combate</h2><p>Habéis llegado a la ronda ${n}. Se quita el contador y tu turno vuelve a empezar limpio.</p>
      ${re.length ? `<h3>Efectos que duran rondas</h3><p class="hint">Marca los que se acaban. Si el combate ha sido corto, alguno puede seguir activo.</p>${re.map(e => box('eff', e.id, `<b>${esc(e.name)}</b> · ${fmtEff(e)}`, !e.conc, e.conc ? 'Concentración: si lo quitas, dejas de concentrarte.' : '')).join('')}` : ''}
      ${cs.length ? `<h3>Estados</h3><p class="hint">Marca los que ya no tienes.</p>${cs.map(x => box('cond', x, `<b>${esc(x)}</b>`, csOn.includes(x))).join('')}` : ''}
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
    /* Lanzar un arma arrojadiza: deja de estar en la mano, como la munición (recogerla la suma el jugador) */
    const thrown = el.dataset.throw && atkItem(c, a);
    let thrownMsg = '';
    if (thrown) {
      const W = WEAPONS[a.wpn],
        left = Math.max(0, (+thrown.qty || 1) - 1);
      thrown.qty = left;
      if (!left) thrown.equipped = false;
      thrownMsg = `<div class="t-parts"><b>La lanzas</b> (alcance ${esc(W.th)} pies; más allá del primero, con desventaja). ${left ? `Te quedan ${left}.` : 'Ya no la tienes: deja de salir en Combate.'} Si la recoges, súmala o equípala otra vez en Partida.</div>${featHas(c, 'thrown') ? `<div class="t-parts"><b>Armas arrojadizas:</b> al lanzarla, el daño es <b>${esc(dmgPlus(a.dmg, 2))}</b>.</div>` : ''}`;
    }
    if (!T.a) {
      T.a = true;
      T.atk = attacksPerAction(c) - 1;
    } else T.atk = Math.max(0, T.atk - 1);
    if (/ligera/i.test(a.notes || '')) T.light = true;
    T.rl = [...(T.rl || []), +el.dataset.i];
    const notes = atkNotes(c, a, !!el.dataset.throw);
    /* Molestar: si impacta, ventaja en el siguiente ataque contra esa criatura hasta el final de tu siguiente turno */
    const W0 = a.wpn && WEAPONS[a.wpn];
    if (a.mastery && W0 && W0.ms === 'vex') {
      endEffects(c, e => e.name === 'Molestar');
      addEffect(c, 'Molestar', { r: 1 }, false, true);
    }
    save();
    render();
    toast(
      `<div class="t-label">Ataque con ${esc(a.name)}</div><div class="t-big">1d20 ${sgn((+a.atk || 0) + d20Pen(c))}</div>${d20Line(c, 'atk', a) ? `<div class="t-parts">${d20Line(c, 'atk', a)}</div>` : ''}${notes}<div class="t-parts">Si impactas, daño: ${esc(a.dmg || '—')} ${esc(a.type || '')}${am ? ` · quedan ${am.qty} ${esc(am.name)}` : ''}${T.atk > 0 ? ` · ${T.atk === 1 ? 'te queda 1 ataque' : `te quedan ${T.atk} ataques`}` : ''}</div>${critLine(a.dmg, hitExtras(c, false).length)}${hitExtras(
        c,
        false
      )
        .map(x => `<div class="t-parts">Al impactar: ${esc(x)}</div>`)
        .join('')}${thrownMsg}${thrown ? '' : styleLines(c, a)}${masteryLine(c, a)}${pactExtras(c, a)}`,
      !!(a.pact && pactSmiteOk(c))
    );
  },
  /* Golpe arcano: al impactar con el arma de pacto, gasta un espacio de pacto */
  'smite-ok': el => {
    const c = C();
    if (!pactSmiteOk(c)) return;
    c.pact.used++;
    const t = el.closest('.toast');
    if (t) t.remove();
    save();
    render();
    toast(
      `<div class="t-label">Golpe arcano</div><div class="t-big">+${1 + c.pact.level}d8 de fuerza</div><div class="t-parts">Súmalo al daño del golpe. Si el objetivo es Enorme o más pequeño, puedes dejarlo derribado. Te quedan ${c.pact.total - c.pact.used} espacios de pacto.</div>`
    );
  },
  't-reset': el => {
    const c = C(),
      T = c.turn,
      k = el.dataset.k;
    if (k === 'a') {
      T.a = false;
      T.atk = 0;
    } else T[k] = false;
    save();
    render();
  },
  't-mag': el => {
    const k = el.dataset.k;
    TMAG[k] = !TMAG[k];
    el.parentElement.open = TMAG[k];
  },
  't-shove': el => {
    const c = C(),
      T = c.turn,
      grab = el.dataset.k === 'grapple',
      monkDex = c.classKey === 'monk' && !wearsArmor(c) && M(c, 'dex') > M(c, 'str'),
      ab = monkDex ? M(c, 'dex') : M(c, 'str');
    if (!T.a) {
      T.a = true;
      T.atk = attacksPerAction(c) - 1;
    } else T.atk = Math.max(0, T.atk - 1);
    save();
    render();
    toast(
      `<div class="t-label">${grab ? 'Agarrar' : 'Empujar'}</div><div class="t-big">CD ${8 + ab + pb(c)}</div>${monkDex ? '<div class="t-parts">Con DES, por Artes marciales.</div>' : ''}<div class="t-parts">Elige a una criatura a 5 pies que no sea más de un tamaño mayor que tú${grab ? ' (necesitas una mano libre)' : ''}. Hace una salvación de FUE o DES (elige ella). ${grab ? 'Si falla, queda agarrada: su velocidad es 0 y tiene desventaja al atacar a cualquiera que no seas tú. Para soltarse usa su acción en una prueba de FUE (Atletismo) o DES (Acrobacias) contra la misma CD.' : 'Si falla, la empujas 5 pies o la derribas (eliges tú).'}${T.atk > 0 ? ` · ${T.atk === 1 ? 'te queda 1 ataque' : `te quedan ${T.atk} ataques`}` : ''}</div>`
    );
  },
  't-unarmed': () => {
    const c = C(),
      T = c.turn,
      u = unarmedCalc(c),
      dl = d20Line(c, 'atk');
    if (!T.a) {
      T.a = true;
      T.atk = attacksPerAction(c) - 1;
    } else T.atk = Math.max(0, T.atk - 1);
    save();
    render();
    toast(
      `<div class="t-label">Golpe desarmado</div><div class="t-big">1d20 ${sgn(u.atk + d20Pen(c))}</div><div class="t-parts">Si impactas, daño: ${esc(u.dmg)} contundente${T.atk > 0 ? ` · ${T.atk === 1 ? 'te queda 1 ataque' : `te quedan ${T.atk} ataques`}` : ''}</div>${dl ? `<div class="t-parts">${dl}</div>` : ''}${u.note ? `<div class="t-parts">${esc(u.note)}</div>` : ''}${critLine(u.dmg, hitExtras(c, false).length)}${hitExtras(
        c,
        false
      )
        .filter(x => !/Favor divino/.test(x))
        .map(x => `<div class="t-parts">Al impactar: ${esc(x)}</div>`)
        .join('')}`
    );
  },
  't-light': el => {
    const c = C(),
      a = c.attacks[+el.dataset.i];
    if (lightBlock(c, c.turn, c.turn, a, +el.dataset.i)) return;
    const nick = a.mastery && WEAPONS[a.wpn] && WEAPONS[a.wpn].ms === 'nick' && !c.turn.nick;
    if (nick) c.turn.nick = true;
    else c.turn.aa = true;
    c.turn.lightDone = true;
    save();
    render();
    toast(
      `<div class="t-label">Ataque con ${esc(a.name)} (acción adicional)</div><div class="t-big">1d20 ${sgn((+a.atk || 0) + d20Pen(c))}</div>${d20Line(c, 'atk', a) ? `<div class="t-parts">${d20Line(c, 'atk', a)}</div>` : ''}${nick ? '<div class="t-parts"><b>Mellar:</b> este ataque extra va dentro de la acción de Atacar; no gastas la acción adicional.</div>' : ''}<div class="t-parts">El ataque suma tu bonificador de competencia como siempre.</div><div class="t-parts">Daño: ${esc(lightDmg(c, a))}${featHas(c, 'twf') ? ' (con Combate con dos armas sumas tu modificador al daño)' : ' (sin tu modificador de característica, salvo que sea negativo)'}.</div>${critLine(lightDmg(c, a), hitExtras(c, false).length)}${hitExtras(
        c,
        false
      )
        .map(x => `<div class="t-parts">Al impactar: ${esc(x)}</div>`)
        .join('')}`
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
    if (f.name === 'Metabolismo asombroso') {
      const pts = c.features.find(x => x.name === 'Puntos de concentración'),
        maD = infoFor(defOf(c), subOf(c), c.level)['Dado de artes marciales'] || 'd6';
      if (pts) pts.uses.used = 0;
      save();
      render();
      return healRoll(
        'Metabolismo asombroso',
        `${pts ? `Recuperas todos tus puntos de concentración (${pts.uses.max}). ` : ''}Tira <b>1${maD}</b> y escribe el resultado: la app suma tu nivel de monje (${c.level}).`,
        c.level,
        +maD.slice(1) || 6
      );
    }
    if (f.name === 'Arma de aliento') {
      const n = cantripTier(c.level);
      toast(
        `<div class="t-label">Arma de aliento</div><div class="t-big">${n}d10</div><div class="t-parts">Cono de 15 pies o línea de 30 pies. Cada criatura hace una salvación de DES <b>CD ${8 + M(c, 'con') + pb(c)}</b>: si falla recibe todo el daño; si la supera, la mitad. Sustituye uno de tus ataques.</div>`,
        true
      );
    }
    if (!['Arma de aliento', 'Furia'].includes(f.name)) {
      const src =
        f.text ||
        (c.features.find(x => x !== f && x.text && String(f.source || '').includes(x.name)) || {}).text ||
        '';
      toast(
        `<div class="t-label">${esc(f.name)}</div><div class="t-parts">Te ${featLeft(f) === 1 ? 'queda 1 uso' : `quedan ${featLeft(f)} usos`} de ${f.uses.max}.</div>${src ? `<div class="t-parts">${esc(src.length > 260 ? src.slice(0, 257) + '…' : src)}</div>` : ''}`
      );
    }
    if (f.name === 'Furia') {
      const was = c.concentration;
      if (was) endEffects(c, e => e.conc);
      c.concentration = '';
      addEffect(c, 'Furia', { m: 10 });
      toast(
        `<div class="t-label">¡Furia!</div><div class="t-parts">Ventaja en FUE, daño extra y resistencia a contundente, cortante y perforante. No puedes lanzar conjuros ni concentrarte.${was ? ` Dejas de concentrarte en ${esc(was)}.` : ''}</div>`
      );
    }
    save();
    render();
  },
  'hr-ok': el => {
    const c = C(),
      r = parseInt($('#hr-r').value),
      max = +el.dataset.max;
    if (!(r >= 1 && r <= max)) {
      $('#hr-r').focus();
      return;
    }
    const was = c.hp.current,
      n = r + +el.dataset.x;
    c.hp.current = Math.min(c.hp.max, c.hp.current + n);
    if (was <= 0 && c.hp.current > 0) {
      c.deathSaves = { success: 0, fail: 0 };
      c.conditions = c.conditions.filter(x => x !== 'Inconsciente');
    }
    closeModal();
    save();
    render();
    toast(
      `<div class="t-label">${esc(el.dataset.t)}</div><div class="t-big good">+${c.hp.current - was}</div><div class="t-parts">${r} + ${el.dataset.x}${c.hp.current - was < n ? ' (no pasas de tu máximo)' : ''} · PG: ${c.hp.current} / ${c.hp.max}</div>`
    );
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
  't-mark': el => {
    const c = C(),
      m = MARK_MOVE.find(x => x[0] === el.dataset.id);
    if (!m || c.turn.aa) return;
    spendEco(c, 'AA');
    save();
    render();
    toast(
      `<div class="t-label">${esc(m[1])}: nuevo objetivo</div><div class="t-parts">${
        m[0] === 'hex'
          ? 'Elige otra criatura que veas a 90 pies (la anterior tiene que haber caído a 0 PG). Vuelve a elegir una característica: tendrá desventaja en sus pruebas de esa característica. Sigues haciéndole 1d6 necrótico extra al impactar.'
          : 'Elige otra criatura que veas a 90 pies (la anterior tiene que haber caído a 0 PG). Sigues haciéndole 1d6 de fuerza extra al impactar.'
      } No gastas espacio y la duración sigue igual.</div>`
    );
  },
  't-der': el => {
    const c = C(),
      o = DERIVED[+el.dataset.j];
    if (o.n === 'Invocar arma de pacto') return pactOpen(true);
    if (o.cost) {
      const f = c.features.find(x => x.name === o.cost);
      if (!f || featLeft(f) <= 0) return;
      f.uses.used++;
    }
    if (/^Paso del viento/.test(o.n)) c.turn.dash = (+c.turn.dash || 0) + 1;
    if (o.n === 'Golpe aturdidor') c.turn.stun = true;
    let more = '';
    if (o.n === 'Defensa paciente (1 punto)') {
      addEffect(c, 'Esquivando', { r: 1 }, false, true);
      markSt(
        c,
        c.effects.find(e => e.name === 'Esquivando')
      );
      more =
        '<div class="t-parts">Hasta el principio de tu siguiente turno: los ataques contra ti tienen desventaja (si ves a quien ataca) y tienes ventaja en las salvaciones de DES. La app lo quita sola al empezar tu turno.</div>';
    }
    spendEco(c, o.t);
    save();
    render();
    /* Golpes desarmados con la acción adicional: qué tirar, como el golpe desarmado de Otras acciones */
    if (o.n === 'Ráfaga de golpes' || o.n === 'Golpe desarmado (Artes marciales)')
      return toast(
        unarmedMsg(c, o.n, o.n === 'Ráfaga de golpes' ? 2 : 1) +
          (o.n === 'Ráfaga de golpes' && c.subclassKey === 'openhand'
            ? `<div class="t-parts"><b>Técnica de la mano abierta</b>, en cada golpe que impacte puedes elegir una: <b>Desequilibrar</b> (no puede hacer ataques de oportunidad hasta el principio de su siguiente turno), <b>Empujar</b> (salvación de FUE CD ${8 + pb(c) + M(c, 'wis')} o lo alejas hasta 15 pies) o <b>Derribar</b> (salvación de DES CD ${8 + pb(c) + M(c, 'wis')} o queda derribado).</div>`
            : '')
      );
    toast(
      `<div class="t-label">${esc(o.n)}</div><div class="t-parts">${esc(typeof o.d === 'function' ? o.d(c) : o.d)}</div>${more}`
    );
  },
  'pact-ok': el => {
    const c = C(),
      v = $('#pact-w').value,
      t = $('#pact-t').value;
    if (!v) return;
    let a = v.startsWith('a:') ? c.attacks[+v.slice(2)] : null;
    // Solo puede haber un arma de pacto: la invocada anterior desaparece
    c.attacks = c.attacks.filter(x => !(x.pact && x.pactNew));
    c.attacks.forEach(x => {
      if (x.pact) {
        delete x.pact;
        delete x.pactT;
      }
    });
    if (v.startsWith('w:')) {
      const k = v.slice(2);
      a = Object.assign(NEW.attacks(), {
        name: `${WEAPONS[k].n} (pacto)`,
        wpn: k,
        magic: 0,
        mastery: false,
        pactNew: true,
      });
      c.attacks.push(a);
    }
    if (!a) return;
    a.pact = true;
    a.pactT = t;
    const r = wpnCalc(c, a);
    Object.assign(a, { atk: r.atk, dmg: r.dmg, type: r.type, notes: r.notes });
    if (el.dataset.eco) spendEco(c, 'AA');
    closeModal();
    save();
    render();
    toast(
      `<div class="t-label">Arma de pacto</div><div class="t-big">${esc(a.name)}</div><div class="t-parts">${sgn(r.atk)} al ataque · ${esc(r.dmg)} ${esc(r.type)}. Desaparece si la sueltas más de un minuto o la vuelves a invocar.</div>`
    );
  },
  't-item': el => {
    const c = C(),
      e = c.equipment[+el.dataset.i];
    if (e.qty <= 0) return;
    if (e.potion && POTIONS[e.potion] && e.potion !== 'other') return potModal(+el.dataset.i, el.dataset.eco);
    if (e.berry) {
      const was = c.hp.current;
      e.qty--;
      c.hp.current = Math.min(c.hp.max, c.hp.current + 1);
      if (was <= 0 && c.hp.current > 0) {
        c.deathSaves = { success: 0, fail: 0 };
        c.conditions = c.conditions.filter(x => x !== 'Inconsciente');
      }
      spendEco(c, el.dataset.eco);
      save();
      render();
      toast(
        `<div class="t-label">Comes una baya nutritiva</div><div class="t-parts">${c.hp.current > was ? 'Recuperas 1 PG' : 'Ya tenías todos los PG'} (${c.hp.current} / ${c.hp.max}). Te alimenta todo el día. Te quedan ${e.qty}.</div>`
      );
      return;
    }
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
      k = el.dataset.k,
      g = G[k];
    spendEco(c, 'A');
    let more = '',
      keep = false;
    const sk = ids =>
      `<div class="t-parts">${ids.map(id => `${SK[id][1]} <b>${sgn(skillB(c, SK[id]) + d20Pen(c))}</b>`).join(' · ')}</div>${d20Line(c, 'check', ids.length === 1 ? ids[0] : '') ? `<div class="t-parts">${d20Line(c, 'check', ids.length === 1 ? ids[0] : '')}</div>` : ''}`;
    if (k === 'a_dodge') {
      addEffect(c, 'Esquivando', { r: 1 }, false, true);
      markSt(
        c,
        c.effects.find(e => e.name === 'Esquivando')
      );
      more =
        '<div class="t-parts">Hasta el principio de tu siguiente turno: los ataques contra ti tienen desventaja (si ves a quien ataca) y tienes ventaja en las salvaciones de DES. Se pierde si quedas incapacitado o tu velocidad baja a 0. La app lo quita sola al empezar tu turno.</div>';
    } else if (k === 'a_dash') {
      c.turn.dash = (+c.turn.dash || 0) + 1;
      more = `<div class="t-parts">Este turno puedes moverte hasta <b>${speedCalc(c).ft * (1 + c.turn.dash)} pies</b> en total. El contador de movimiento ya lo cuenta.</div>`;
    } else if (k === 'a_ready') {
      save();
      render();
      openModal(`<h2>Preparar</h2><p>Gastas tu acción ahora para actuar más tarde con tu reacción. Escribe qué harás y cuándo.</p>
        <label class="f"><span>Qué preparas</span><input id="rd-t" placeholder="Si se acerca, le ataco con la lanza" autocomplete="off"></label>
        <p class="hint">Si preparas un conjuro, lánzalo ahora desde Magia: gasta el espacio y lo mantienes con concentración hasta soltarlo.</p>
        <div class="btns"><button class="b pri" data-act="ready-ok">Guardar</button><button class="b" data-act="close-modal">Sin apuntar</button></div>`);
      setTimeout(() => $('#rd-t') && $('#rd-t').focus(), 0);
      return;
    } else if (k === 'a_search') more = sk(['perception', 'insight', 'medicine', 'survival']);
    else if (k === 'a_study') more = sk(['investigation', 'arcana', 'history', 'nature', 'religion']);
    else if (k === 'a_influence')
      more = sk(['persuasion', 'deception', 'intimidation', 'performance', 'animal']);
    else if (k === 'a_hide') {
      keep = true;
      more = `<div class="t-parts">Tira Sigilo <b>1d20 ${sgn(skillB(c, SK.stealth) + d20Pen(c))}</b> contra CD 15. Necesitas no estar a la vista de los enemigos (detrás de algo que te tape o en oscuridad).</div>${d20Line(c, 'check', 'stealth') ? `<div class="t-parts">${d20Line(c, 'check', 'stealth')}</div>` : ''}<div class="t-actions"><button class="b sm pri" data-act="hide-ok">Lo supero</button><button class="b sm" data-act="close-toast">No</button></div>`;
    }
    save();
    render();
    toast(`<div class="t-label">${esc(g.t)}</div>${more || `<div class="t-parts">${esc(g.d)}</div>`}`, keep);
  },
  't-mv': el => {
    const c = C(),
      T = c.turn,
      max = speedCalc(c).ft * (1 + (+T.dash || 0));
    T.mv = clamp((+T.mv || 0) + +el.dataset.d, 0, max);
    save();
    render();
  },
  't-stand': () => {
    const c = C(),
      T = c.turn;
    T.mv = (+T.mv || 0) + Math.ceil(speedCalc(c).ft / 2);
    c.conditions = c.conditions.filter(x => x !== 'Derribado');
    save();
    render();
    toast(
      '<div class="t-label">Te levantas</div><div class="t-parts">Gastas la mitad de tu velocidad y dejas de estar derribado.</div>'
    );
  },
  'ready-ok': () => {
    const c = C(),
      t = ($('#rd-t').value || '').trim();
    c.turn.ready = t || 'Acción preparada';
    closeModal();
    save();
    render();
    toast(
      '<div class="t-label">Preparado</div><div class="t-parts">Lo tienes en la columna de Reacción. Si no ocurre antes de tu siguiente turno, se pierde.</div>'
    );
  },
  'ready-go': () => {
    const c = C(),
      t = c.turn.ready;
    c.turn.r = true;
    c.turn.ready = '';
    save();
    render();
    toast(
      `<div class="t-label">Usas lo preparado</div><div class="t-parts">${esc(t)}. Gastas tu reacción.</div>`
    );
  },
  'hide-ok': el => {
    const c = C();
    if (!c.conditions.includes('Invisible')) c.conditions.push('Invisible');
    const t = el.closest('.toast');
    if (t) t.remove();
    save();
    render();
    toast(
      '<div class="t-label">Escondido</div><div class="t-parts">Tienes el estado Invisible. Lo pierdes si haces ruido, atacas, lanzas un conjuro con componente verbal o te encuentran. Quítalo en Vida y estado cuando pase.</div>'
    );
  },
  /* Ataque de oportunidad: con un arma cuerpo a cuerpo equipada o un golpe desarmado. Si hay varias opciones, se elige */
  't-opp': el => {
    const c = C(),
      melee = c.attacks
        .map((a, i) => [a, i])
        .filter(([a]) => atkReady(c, a) && !(a.wpn && WEAPONS[a.wpn] && WEAPONS[a.wpn].r));
    if (el && el.dataset.i === undefined && melee.length) {
      openModal(`<h2>Ataque de oportunidad</h2><p>Un enemigo que ves sale de tu alcance: le haces un ataque cuerpo a cuerpo con tu reacción. ¿Con qué?</p>
        ${melee.map(([a, i]) => `<button class="b opt" data-act="t-opp" data-i="${i}"><span>${esc(a.name)}</span><small>${sgn(+a.atk || 0)} · ${esc(a.dmg || '')}</small></button>`).join('')}
        <button class="b opt" data-act="t-opp" data-i="-1"><span>Golpe desarmado</span><small>${sgn(unarmedCalc(c).atk)} · ${esc(unarmedCalc(c).dmg)}</small></button>
        <button class="b" data-act="close-modal">Cancelar</button>`);
      return;
    }
    closeModal();
    const i = el && el.dataset.i !== undefined ? +el.dataset.i : -1,
      a = i >= 0 ? c.attacks[i] : null,
      u = unarmedCalc(c),
      atk = a ? +a.atk || 0 : u.atk,
      dmg = a ? a.dmg || '—' : u.dmg,
      dl = d20Line(c, 'atk', a);
    c.turn.r = true;
    save();
    render();
    toast(
      `<div class="t-label">Ataque de oportunidad con ${esc(a ? a.name : 'golpe desarmado')}</div><div class="t-big">1d20 ${sgn(atk + d20Pen(c))}</div>${dl ? `<div class="t-parts">${dl}</div>` : ''}<div class="t-parts">Si impactas, daño: ${esc(dmg)} ${esc(a ? a.type || '' : 'contundente')}</div>${critLine(dmg, hitExtras(c, false).length)}${hitExtras(
        c,
        false
      )
        .filter(x => a || !/Favor divino/.test(x))
        .map(x => `<div class="t-parts">Al impactar: ${esc(x)}</div>`)
        .join('')}${a ? styleLines(c, a) + masteryLine(c, a) : ''}`
    );
  },
});
