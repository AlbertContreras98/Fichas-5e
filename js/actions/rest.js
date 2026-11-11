/* Acciones — Descansos. */
'use strict';

Object.assign(A, {
  'rest-menu': () => {
    restOpen = !restOpen;
    renderTop();
  },
  short: () => {
    restOpen = false;
    renderTop();
    shortRestModal();
  },
  'hd-pip': el => {
    const c = C(),
      left = c.hitDice.total - c.hitDice.spent;
    if (+el.dataset.i >= left) {
      c.hitDice.spent = Math.max(0, c.hitDice.spent - 1);
      save();
      render();
      refreshVida();
      return;
    }
    openModal(`<h2>Gastar un dado de golpe</h2><p>Tira un ${esc(c.hitDice.die)} físico y escribe el resultado: se suma tu CON (${sgn(M(c, 'con'))}).</p>
      <div class="hpctl"><input id="hd-r" type="number" inputmode="numeric" min="1" placeholder="Dado" aria-label="Resultado del dado de golpe"><button class="b good" data-act="hd-heal">Curarme</button></div>
      <p class="hint">Si el dado no es para curarte ahora (por ejemplo, ya lo has apuntado de otra forma), márcalo solo como gastado.</p>
      <div class="btns"><button class="b" data-act="hd-mark">Solo marcarlo como gastado</button><button class="b" data-act="vida">Cancelar</button></div>`);
    setTimeout(() => $('#hd-r') && $('#hd-r').focus(), 0);
  },
  'hd-heal': () => {
    const c = C(),
      r = parseInt($('#hd-r').value),
      f = +String(c.hitDice.die).replace(/\D/g, '') || 8;
    if (!(r >= 1 && r <= f)) {
      $('#hd-r').focus();
      toast(
        `<div class="t-parts">Escribe lo que has sacado en el ${esc(c.hitDice.die)} (de 1 a ${f}).</div>`
      );
      return;
    }
    const cm = M(c, 'con'),
      was = c.hp.current;
    c.hitDice.spent = Math.min(c.hitDice.total, c.hitDice.spent + 1);
    c.hp.current = Math.min(c.hp.max, c.hp.current + Math.max(0, r + cm));
    save();
    render();
    openVida();
    toast(
      `<div class="t-label">Dado de golpe</div><div class="t-big good">+${c.hp.current - was}</div><div class="t-parts">${r} ${sgn(cm)} CON · te quedan ${c.hitDice.total - c.hitDice.spent} dados</div>`
    );
  },
  'hd-mark': () => {
    const c = C();
    c.hitDice.spent = Math.min(c.hitDice.total, c.hitDice.spent + 1);
    save();
    render();
    openVida();
  },
  hd: () => {
    const c = C(),
      r = parseInt($('#hd-roll').value),
      f = +String(c.hitDice.die).replace(/\D/g, '') || 8;
    if (!(r >= 1 && r <= f)) {
      $('#hd-roll').focus();
      toast(
        `<div class="t-parts">Escribe lo que has sacado en el ${esc(c.hitDice.die)} (de 1 a ${f}).</div>`
      );
      return;
    }
    const cm = M(c, 'con'),
      heal = Math.max(0, r + cm),
      was = c.hp.current;
    c.hitDice.spent = Math.min(c.hitDice.total, c.hitDice.spent + 1);
    c.hp.current = Math.min(c.hp.max, c.hp.current + heal);
    toast(
      `<div class="t-label">Dado de golpe</div><div class="t-big good">+${c.hp.current - was}</div><div class="t-parts">${r} ${sgn(cm)} CON</div>`
    );
    save();
    renderTop();
    if (S.tab === 'play') renderView();
    shortRestModal();
  },
  'short-done': () => {
    const c = C();
    c.pact.used = 0;
    passTime(c, 60);
    c.features.forEach(f => {
      if (f.uses.recover === 'corto') f.uses.used = 0;
      if (f.uses.recover === 'corto1') f.uses.used = Math.max(0, f.uses.used - 1);
    });
    closeModal();
    save();
    render();
    toast(
      '<div class="t-label">Descanso corto terminado</div><div class="t-parts">Recursos de descanso corto recuperados.</div>'
    );
  },
  long: () => {
    restOpen = false;
    renderTop();
    A.longModal();
  },
  longModal: () =>
    openModal(`<h2>Descanso largo (8 horas)</h2><ul><li>Recuperas todos los PG y todos los dados de golpe</li><li>Recuperas todos los espacios de conjuro</li><li>Se recuperan los rasgos con usos limitados</li><li>Agotamiento −1 y pierdes los PG temporales</li>${C().companions.length ? '<li>Tus compañeros recuperan todos sus PG</li>' : ''}</ul>${(() => {
      const c = C(),
        ch = c.equipment.filter(e => e.mi && +e.mi.ch && +e.mi.used && e.mi.rec);
      return ch.length
        ? `<h3>Cargas al amanecer</h3>${ch.map(e => (/todas/i.test(e.mi.rec) ? `<p class="hint">${esc(e.name)} recupera todas sus cargas.</p>` : `<label class="f"><span>${esc(e.name)} (${e.mi.ch - e.mi.used}/${e.mi.ch}): tira ${esc(e.mi.rec)} y escribe el resultado</span><input id="lr-ch-${e.id}" type="number" inputmode="numeric" min="0"></label>`)).join('')}`
        : '';
    })()}${(() => {
      const c = C(),
        r = c.equipment.find(e => e.gear === 'rations' && e.qty > 0);
      return `<label class="chk"><input type="checkbox" id="lr-eat" ${r ? 'checked' : ''}> ${r ? `Comer: gastar 1 ración (te quedan ${r.qty})` : 'He comido hoy (sin gastar raciones de la mochila)'}</label>${c.noFood ? `<p class="hint warn">Llevas ${c.noFood} día${c.noFood > 1 ? 's' : ''} sin comer.</p>` : ''}`;
    })()}
    ${C().hp.current <= 0 ? '<p class="hint warn"><b>Estás a 0 PG.</b> Para aprovechar un descanso largo tienes que empezarlo con al menos 1 PG: antes te tienen que curar, o estabilizarte y esperar a recuperar 1 PG (1d4 horas). Si el máster lo permite, puedes hacerlo igualmente.</p>' : ''}
    <div class="btns"><button class="b pri" data-act="long-done">${C().hp.current <= 0 ? 'Hacerlo igualmente' : 'Hacer descanso largo'}</button><button class="b" data-act="close-modal">Cancelar</button></div>`),
  'long-done': () => {
    const c = C(),
      ate = $('#lr-eat') ? $('#lr-eat').checked : true;
    c.equipment.forEach(e => {
      if (!e.mi || !+e.mi.ch || !+e.mi.used || !e.mi.rec) return;
      if (/todas/i.test(e.mi.rec)) {
        e.mi.used = 0;
        return;
      }
      const v = $('#lr-ch-' + e.id),
        n = v ? parseInt(v.value) : NaN;
      if (n > 0) e.mi.used = Math.max(0, e.mi.used - n);
    });
    c.companions.forEach(x => {
      const st = creaStats(c, x);
      if (st.track) x.hp.current = st.hpMax;
    });
    passTime(c, 480);
    c.hp.current = c.hp.max;
    c.hp.temp = 0;
    c.hitDice.spent = 0;
    c.slots.forEach(s => (s.used = 0));
    c.pact.used = 0;
    c.features.forEach(f => {
      if (f.uses.recover) f.uses.used = 0;
    });
    c.exhaustion = Math.max(0, (+c.exhaustion || 0) - 1);
    c.deathSaves = { success: 0, fail: 0 };
    c.concentration = '';
    c.conditions = c.conditions.filter(x => x !== 'Inconsciente');
    if (c.speciesKey === 'human') c.inspiration = true;
    let food = '';
    if (ate) {
      const r = c.equipment.find(e => e.gear === 'rations' && e.qty > 0);
      if (r) {
        r.qty--;
        food = ` Gastas 1 ración (te quedan ${r.qty}).`;
      }
      c.noFood = 0;
    } else {
      c.noFood = (+c.noFood || 0) + 1;
      const lim = Math.max(1, 3 + M(c, 'con'));
      if (c.noFood > lim) {
        c.exhaustion = Math.min(6, (+c.exhaustion || 0) + 1);
        food = ` Llevas ${c.noFood} días sin comer (aguantas ${lim}): ganas 1 nivel de agotamiento.`;
      } else
        food = ` Llevas ${c.noFood} día${c.noFood > 1 ? 's' : ''} sin comer; aguantas ${lim} sin consecuencias.`;
    }
    closeModal();
    save();
    render();
    const pr = PREP_RULE[c.classKey];
    toast(
      `<div class="t-label">Descanso largo terminado</div><div class="t-parts">Como nuevo.${food}</div>${pr ? `<div class="t-parts">${pr === 'all' ? 'Puedes cambiar tus conjuros preparados.' : 'Puedes cambiar uno de tus conjuros preparados.'}</div><div class="t-actions"><button class="b sm pri" data-act="prep-open">Cambiar conjuros</button></div>` : ''}`,
      !!pr
    );
  },
});
