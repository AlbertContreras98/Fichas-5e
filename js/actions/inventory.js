/* Acciones — Inventario: objetos, munición, dinero, pociones y pergaminos. */
'use strict';

Object.assign(A, {
  qty: el => {
    const c = C(),
      i = +el.dataset.i,
      e = c.equipment[i];
    e.qty = Math.max(0, (+e.qty || 0) + +el.dataset.d);
    save();
    render();
    refreshInv();
  },
  'item-del': el => {
    const c = C(),
      id = el.dataset.id,
      e = c.equipment.find(x => x.id === id);
    c.equipment = c.equipment.filter(x => x.id !== id);
    if (e && e.cat === 'arma') c.attacks = c.attacks.filter(a => a.item !== id);
    c.attacks.forEach(a => {
      if (a.ammo === id) a.ammo = '';
      if (a.item === id) a.item = '';
    });
    closeModal();
    save();
    render();
    if (!e || !inCard(e)) openInv();
    toast(
      `<div class="t-label">Quitado</div><div class="t-parts">${esc(e ? e.name : 'Objeto')} ya no está ${e && inCard(e) ? 'en tu equipo' : 'en la mochila'}.</div>`
    );
  },
  ammo: el => {
    const c = C(),
      a = c.attacks[+el.dataset.i],
      e = c.equipment.find(x => x.id === a.ammo);
    if (!e || e.qty <= 0) return;
    e.qty--;
    save();
    render();
    toast(
      `<div class="t-label">${esc(a.name)}</div><div class="t-parts">Gastas 1 ${esc(e.name)}. Te quedan <b>${e.qty}</b>.${e.qty === 0 ? ' ¡Sin munición!' : ''}</div><div class="t-actions"><button class="b sm" data-act="ammo-back" data-id="${e.id}">Recuperar 1</button></div>`
    );
  },
  'ammo-back': el => {
    const e = C().equipment.find(x => x.id === el.dataset.id);
    if (e) {
      e.qty++;
      save();
      render();
    }
    el.closest('.toast').remove();
  },
  pay: () => {
    const c = C(),
      n = parseInt($('#pay-amt').value),
      k = $('#pay-coin').value;
    if (!(n > 0)) {
      $('#pay-amt').focus();
      return;
    }
    if (!pay(c, n, k)) {
      toast(
        `<div class="t-label">No te llega</div><div class="t-parts">Necesitas ${n} ${COINN[k]} y tienes el equivalente a ${(totalCp(c) / COINV[k]).toLocaleString('es-ES', { maximumFractionDigits: 2 })} ${COINN[k]}.</div>`
      );
      return;
    }
    save();
    renderTop();
    refreshMoney();
    toast(`<div class="t-label">Pagado</div><div class="t-big bad">−${n} ${COINN[k]}</div>`);
  },
  earn: () => {
    const c = C(),
      n = parseInt($('#pay-amt').value),
      k = $('#pay-coin').value;
    if (!(n > 0)) {
      $('#pay-amt').focus();
      return;
    }
    c.coins[k] = (+c.coins[k] || 0) + n;
    save();
    renderTop();
    refreshMoney();
    toast(`<div class="t-label">Cobrado</div><div class="t-big good">+${n} ${COINN[k]}</div>`);
  },
  'item-new': el => {
    const from = (el && el.dataset && el.dataset.from) || '';
    NI = {
      from,
      name: '',
      qty: 1,
      cat: from || 'otro',
      notes: '',
      pot: 'healing',
      arm: '',
      mag: 0,
      eq: true,
      auto: '',
      wpn: '',
      atk: true,
      ms: true,
      am: true,
      ak: '',
      spl: '',
      gr: '',
      var: '',
      pack: 'explorer',
      img: '',
    };
    itemModal();
    $('#ni-name').focus();
  },
  'item-cancel': () => {
    const from = NI && NI.from;
    closeModal();
    if (!from) openInv();
  },
  inv: () => openInv(),
  'item-open': el => itemSheet(el.dataset.id),
  'wpn-eq': el => {
    const c = C(),
      e = c.equipment.find(x => x.id === el.dataset.id);
    if (!e) return;
    if (wpnOn(c, e)) e.equipped = false;
    else {
      wpnEnsureAtk(c, e);
      e.equipped = true;
      if (!(+e.qty > 0)) e.qty = 1;
      wpnProfWarn(c, e);
    }
    save();
    render();
    refreshInv();
  },
  /* Usar o dejar de usar la maestría de un tipo de arma (todas las armas de ese tipo a la vez) */
  'wpn-ms': el => {
    const c = C(),
      a = c.attacks[+el.dataset.i];
    if (!a || !a.wpn) return;
    const on = !a.mastery;
    if (on && !masteryCanAdd(c, a.wpn)) {
      toast(
        `<div class="t-label">Maestrías</div><div class="t-parts">Ya usas ${masteryMax(c)} (${masteryKinds(c)
          .map(k => WEAPONS[k].n)
          .join(', ')}). Quita otra antes. Puedes cambiarlas al terminar un descanso largo.</div>`
      );
      return;
    }
    c.attacks.filter(x => x.wpn === a.wpn).forEach(x => (x.mastery = on));
    syncWeapons(c);
    save();
    render();
  },
  belt: el => beltOpen(el.dataset.k),
  'cat-tog': el => {
    invShutToggle(el.dataset.k);
    refreshInv();
    const b = $(`.cat-tog[data-k="${el.dataset.k}"]`);
    if (b) b.focus();
  },
  give1: el => {
    const e = C().equipment[+el.dataset.i];
    if (!e || +e.qty <= 0) return;
    e.qty--;
    save();
    render();
    refreshInv();
    toast(
      `<div class="t-label">${esc(e.name)}</div><div class="t-parts">Das 1 a un compañero. Te quedan ${e.qty}. Él la suma con + en su ficha.</div>`
    );
  },
  'item-save': el => {
    const c = C(),
      e = c.equipment.find(x => x.id === el.dataset.id),
      n = $('#it-name').value.trim();
    if (!e) return openInv();
    if (!n) {
      $('#it-name').focus();
      return;
    }
    const wasCard = inCard(e);
    e.name = n;
    e.qty = Math.max(0, parseInt($('#it-qty').value) || 0);
    e.cat = $('#it-cat').value;
    e.notes = $('#it-notes').value.trim();
    if (e.cat === 'arma' && e.equipped === undefined) e.equipped = true;
    save();
    render();
    if (wasCard) closeModal();
    else openInv();
  },
  'item-delask': el => {
    const e = C().equipment.find(x => x.id === el.dataset.id);
    if (!e) return openInv();
    openModal(`<h2>¿Borrar ${esc(e.name)}?</h2><p>${inCard(e) ? 'Se quitará de tu equipo' : 'Se quitará de la mochila'}${e.cat === 'arma' && C().attacks.some(a => a.item === e.id) ? ', y también su ataque de Combate' : ''}.</p>
      <div class="btns"><button class="b bad" data-act="item-del" data-id="${e.id}">Borrar</button><button class="b" data-act="item-open" data-id="${e.id}">Cancelar</button></div>`);
  },
  'item-add': () => {
    niCollect();
    const c = C();
    if (NI.cat === 'paquete') {
      const pk = PACKS[NI.pack || 'explorer'];
      packGive(c, NI.pack || 'explorer', Math.max(1, parseInt(NI.qty) || 1));
      NI = null;
      closeModal();
      save();
      render();
      openInv();
      toast(
        `<div class="t-label">${esc(pk.n)}</div><div class="t-parts">Añadido todo su contenido a la mochila.</div>`
      );
      return;
    }
    const n = NI.name.trim();
    if (!n) {
      $('#ni-name').focus();
      return;
    }
    if (NI.cat === 'mapa') {
      const z = mapZone({ name: n });
      if (!z) {
        $('#ni-name').focus();
        return;
      }
      if (mapDup(c, z)) {
        toast(`<div class="t-parts">Ya tienes un mapa de «${esc(z)}». Ponle otro nombre a la zona.</div>`);
        $('#ni-name').focus();
        return;
      }
      const m = { id: uid(), name: mapName(z), qty: 1, cat: 'mapa', notes: NI.notes.trim() };
      if (NI.img) m.img = NI.img;
      c.equipment.push(m);
      if (!saveOk()) {
        c.equipment.pop();
        toast(FULL_MSG);
        return;
      }
      NI = null;
      closeModal();
      render();
      openInv();
      toast(
        `<div class="t-label">${esc(m.name)}</div><div class="t-parts">${m.img ? 'Guardado en la mochila. Ábrelo desde el cinturón de abajo.' : 'Guardado en la mochila, sin imagen.'}</div>`
      );
      return;
    }
    const it = {
      id: uid(),
      name: n,
      qty: Math.max(0, parseInt(NI.qty) || 0),
      cat: NI.cat,
      notes: NI.notes.trim(),
    };
    if (NI.cat === 'pocion' && NI.pot && NI.pot !== 'other') it.potion = NI.pot;
    if (NI.gr && NI.gr.startsWith('t:')) {
      it.tool = NI.gr.slice(2);
      if (TOOLS[it.tool].vars) it.tvar = NI.var || TOOLS[it.tool].vars[0];
    }
    if (NI.gr && NI.gr.startsWith('g:')) {
      it.gear = NI.gr.slice(2);
      it.cat = GEAR[it.gear].cat;
    }
    if (NI.cat === 'pergamino') {
      const d = splFind(NI.spl);
      if (!d) {
        toast('<div class="t-parts">Elige un conjuro de la lista para el pergamino.</div>');
        $('#ni-spl').focus();
        return;
      }
      it.scroll = d.id;
    }
    if (NI.cat === 'municion' && NI.ak) {
      it.ammoKind = NI.ak;
      c.attacks.forEach(a => {
        const W = a.wpn && WEAPONS[a.wpn];
        if (W && W.am && W.am[0] === NI.ak && !a.ammo) a.ammo = it.id;
      });
    }
    if (NI.cat === 'arma' && NI.wpn) {
      const W = WEAPONS[NI.wpn];
      it.weapon = NI.wpn;
      it.magic = +NI.mag || 0;
      {
        const a = Object.assign(NEW.attacks(), {
          name: n,
          wpn: NI.wpn,
          magic: +NI.mag || 0,
          mastery: masteryCanAdd(c, NI.wpn) && !!NI.ms,
          item: it.id,
        });
        if (W.am) {
          let am = c.equipment.find(e => e.ammoKind === W.am[0]);
          if (!am && NI.am) {
            am = {
              id: uid(),
              name: AMMO[W.am[0]][0],
              qty: AMMO[W.am[0]][1],
              cat: 'municion',
              notes: '',
              ammoKind: W.am[0],
            };
            c.equipment.push(am);
          }
          if (am) a.ammo = am.id;
        }
        c.attacks.push(a);
      }
    }
    if (NI.cat === 'arma') it.equipped = NI.wpn ? !!NI.atk : true;
    if (NI.cat === 'armadura' && NI.arm) {
      it.armor = NI.arm;
      it.magic = +NI.mag || 0;
      it.equipped = !!NI.eq;
      if (it.equipped)
        c.equipment.forEach(o => {
          if (o.armor && o.equipped && (ARMORS[o.armor].t === 's') === (ARMORS[it.armor].t === 's'))
            o.equipped = false;
        });
    }
    if (NI.mi) {
      it.mi = Object.assign({}, NI.mi, { on: 0, used: 0 });
      if (NI.mip && MAGIC[NI.mip] && MAGIC[NI.mip].noarm) it.mi.noarm = 1;
    }
    c.equipment.push(it);
    const from = NI.from;
    NI = null;
    closeModal();
    save();
    render();
    if (inCard(it)) {
      if (it.cat === 'arma' && it.equipped) wpnProfWarn(c, it);
      toast(
        `<div class="t-label">${esc(it.name)}</div><div class="t-parts">Añadido a ${it.cat === 'arma' ? 'Armas y ataques' : it.cat === 'armadura' ? 'Armaduras y escudos' : 'Herramientas'}, en la pestaña Partida.</div>`
      );
      if (!from) openInv();
      return;
    }
    openInv();
    if (inBelt(it))
      toast(
        `<div class="t-label">${esc(it.name)}</div><div class="t-parts">Guardado en el cinturón, abajo de la mochila.</div>`
      );
  },
  eq: el => {
    const c = C(),
      e = c.equipment[+el.dataset.i],
      sh = ARMORS[e.armor].t === 's';
    e.equipped = !e.equipped;
    if (e.equipped)
      c.equipment.forEach(o => {
        if (o !== e && o.armor && o.equipped && (ARMORS[o.armor].t === 's') === sh) o.equipped = false;
      });
    save();
    render();
    refreshInv();
  },
  gear: el => gearUse(+el.dataset.i),
  'mi-att': el => {
    const c = C(),
      e = c.equipment[+el.dataset.i];
    if (!e.mi.on && attuned(c) >= 3) {
      toast(
        '<div class="t-label">Máximo 3 objetos sintonizados</div><div class="t-parts">Deja de sintonizar otro primero (se hace durante un descanso corto).</div>'
      );
      return;
    }
    e.mi.on = e.mi.on ? 0 : 1;
    save();
    render();
    refreshInv();
    if (e.mi.on)
      toast(
        `<div class="t-label">Sintonizado</div><div class="t-parts">${esc(e.name)} ya funciona. Sintonizarse requiere un descanso corto con el objeto.</div>`
      );
  },
  'mi-ch': el => {
    const c = C(),
      e = c.equipment[+el.dataset.i];
    e.mi.used = clamp((+e.mi.used || 0) + +el.dataset.d, 0, e.mi.ch);
    save();
    render();
    refreshInv();
  },
  pot: el => {
    potModal(+el.dataset.i, 'AA');
    POT.back = true;
  },
  scroll: el => scrollModal(+el.dataset.i, null),
  'scr-cast': () => {
    const c = C(),
      e = c.equipment[SCR.i],
      d = SPBY[e.scroll],
      L = +d.l || 0,
      [dc, at] = SCROLL_STATS[L],
      eco = SCR.eco;
    closeModal();
    e.qty = Math.max(0, e.qty - 1);
    if (eco) pendingEco = eco === 'BA' ? 'AA' : eco;
    lastCastL = L;
    const sp = fillFromRef({ ref: d.id, name: d.n, level: L });
    afterCast(sp, `Desde pergamino · CD ${dc} · ataque ${sgn(at)} · te quedan ${e.qty}`);
  },
  'scr-fail': () => {
    const c = C(),
      e = c.equipment[SCR.i];
    e.qty = Math.max(0, e.qty - 1);
    if (SCR.eco) spendEco(c, SCR.eco === 'BA' ? 'AA' : SCR.eco);
    closeModal();
    save();
    render();
    toast(
      `<div class="t-label">El pergamino se desmorona</div><div class="t-parts">${esc(e.name)} se pierde sin efecto. Te quedan ${e.qty}.</div>`
    );
  },
  'pot-heal': () => {
    const c = C(),
      e = c.equipment[POT.i],
      P = POTIONS[e.potion],
      inp = $('#pot-roll'),
      n = parseInt(inp.value),
      [lo, hi] = diceRange(P.heal);
    if (!(n >= lo && n <= hi)) {
      inp.focus();
      toast(`<div class="t-parts">Con ${P.heal} el total va de ${lo} a ${hi}.</div>`);
      return;
    }
    e.qty = Math.max(0, e.qty - 1);
    spendEco(c, POT.eco);
    const got = healBy(c, n);
    const back = POT.back;
    closeModal();
    save();
    render();
    if (back) openInv();
    toast(
      `<div class="t-label">${esc(e.name)}</div><div class="t-big good">+${got}</div><div class="t-parts">PG: ${c.hp.current} / ${c.hp.max} · te quedan ${e.qty}</div>`
    );
  },
  'pot-fx': () => {
    const c = C(),
      e = c.equipment[POT.i],
      P = POTIONS[e.potion],
      ask = $('#pot-ask') ? $('#pot-ask').value.trim() : '';
    e.qty = Math.max(0, e.qty - 1);
    spendEco(c, POT.eco);
    if (P.temp) c.hp.temp = Math.max(c.hp.temp, P.temp);
    if (P.eff)
      c.effects.push(
        Object.assign({ id: uid(), name: P.eff[0] + (ask ? ` (${ask})` : ''), conc: false }, P.eff[1])
      );
    if (P.eff && P.eff[0] === 'Invisible' && !c.conditions.includes('Invisible'))
      c.conditions.push('Invisible');
    const back = POT.back;
    closeModal();
    save();
    render();
    if (back) openInv();
    toast(
      `<div class="t-label">Bebes</div><div class="t-big">${esc(e.name)}</div><div class="t-parts">${esc(P.d)} Te quedan ${e.qty}.</div>`
    );
  },
  'pot-give': () => {
    const c = C(),
      e = c.equipment[POT.i],
      P = POTIONS[e.potion];
    e.qty = Math.max(0, e.qty - 1);
    spendEco(c, POT.eco);
    const back = POT.back;
    closeModal();
    save();
    render();
    if (back) openInv();
    toast(
      `<div class="t-label">Das ${esc(e.name)}</div><div class="t-parts">${P.heal ? `La criatura recupera ${P.heal} PG (que tire ella).` : esc(P.d)} Te quedan ${e.qty}.</div>`
    );
  },
  money: () => openMoney(),
  'money-close': () => {
    closeModal();
    render();
  },
});
