/* Acciones — Inventario: objetos, munición, dinero, pociones y pergaminos. */
'use strict';

Object.assign(A, {
  qty: el => {
    const c = C(),
      i = +el.dataset.i,
      e = c.equipment[i];
    if (+el.dataset.d < 0 && (+e.qty || 0) <= 1 && el.closest('#inv-body')) {
      openModal(`<h2>¿Quitar ${esc(e.name)}?</h2><p>Se ha quedado a 0. ¿Lo quitas de la mochila?</p><p class="hint">Si piensas reponerlo (munición, raciones…), puedes dejarlo a 0.</p>
      <div class="btns"><button class="b bad" data-act="item-del" data-id="${e.id}">Quitar</button><button class="b" data-act="item-zero" data-id="${e.id}">Dejar a 0</button><button class="b" data-act="item-cancel">Cancelar</button></div>`);
      return;
    }
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
    c.attacks.forEach(a => {
      if (a.ammo === id) a.ammo = '';
      if (a.item === id) a.item = '';
    });
    closeModal();
    save();
    render();
    openInv();
    toast(
      `<div class="t-label">Quitado</div><div class="t-parts">${esc(e ? e.name : 'Objeto')} ya no está en la mochila.</div>`
    );
  },
  'item-zero': el => {
    const e = C().equipment.find(x => x.id === el.dataset.id);
    if (e) e.qty = 0;
    closeModal();
    save();
    render();
    openInv();
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
  'item-new': () => {
    NI = {
      name: '',
      qty: 1,
      cat: 'otro',
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
    };
    itemModal();
    $('#ni-name').focus();
  },
  'item-cancel': () => {
    closeModal();
    openInv();
  },
  inv: () => openInv(),
  'item-add': () => {
    niCollect();
    const c = C();
    if (NI.cat === 'paquete') {
      const P = PACKS[NI.pack || 'explorer'],
        k = Math.max(1, parseInt(NI.qty) || 1);
      P.items.forEach(([key, q]) => {
        const G = GEAR[key],
          nm = G ? G.n : key,
          ex = c.equipment.find(e => (G ? e.gear === key : norm(e.name) === norm(nm)));
        if (ex) ex.qty = (+ex.qty || 0) + q * k;
        else
          c.equipment.push(
            Object.assign(
              {
                id: uid(),
                name: nm,
                qty: q * k,
                cat: G ? G.cat : /aceite|vela/i.test(nm) ? 'consumible' : 'otro',
                notes: '',
              },
              G ? { gear: key } : {}
            )
          );
      });
      NI = null;
      closeModal();
      save();
      render();
      openInv();
      toast(
        `<div class="t-label">${esc(P.n)}</div><div class="t-parts">Añadido todo su contenido a la mochila.</div>`
      );
      return;
    }
    const n = NI.name.trim();
    if (!n) {
      $('#ni-name').focus();
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
      if (NI.atk) {
        const a = Object.assign(NEW.attacks(), {
          name: n,
          wpn: NI.wpn,
          magic: +NI.mag || 0,
          mastery: MASTERY_CLS.has(c.classKey) && !!NI.ms,
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
    NI = null;
    closeModal();
    save();
    render();
    openInv();
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
  'wpn-atk': el => {
    const c = C(),
      e = c.equipment[+el.dataset.i];
    const a = Object.assign(NEW.attacks(), {
      name: e.name,
      wpn: e.weapon,
      magic: +e.magic || 0,
      mastery: MASTERY_CLS.has(c.classKey),
      item: e.id,
    });
    const W = WEAPONS[e.weapon];
    if (W.am) {
      const am = c.equipment.find(x => x.ammoKind === W.am[0]);
      if (am) a.ammo = am.id;
    }
    c.attacks.push(a);
    save();
    render();
    refreshInv();
    toast(
      `<div class="t-label">${esc(e.name)} añadida a tus ataques</div><div class="t-parts">${sgn(a.atk)} · ${esc(a.dmg)} ${esc(a.type || '')}</div>`
    );
  },
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
