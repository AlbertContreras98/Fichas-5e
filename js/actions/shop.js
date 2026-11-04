/* Acciones — Tiendas: comprar, regatear, vender, recibo y salir (jugador); crear, editar y aplicar recibos (máster). */
'use strict';

Object.assign(A, {
  /* ── Jugador ── */
  'p-scan': openScan,
  'scan-paste': () => {
    const h = qrKind($('#scan-code').value);
    if (!h) {
      toast('<div class="t-parts">Ese código no es de Fichas 5e.</div>');
      return;
    }
    closeModal();
    qrRun(h);
  },
  'sh-enter-ok': () => {
    const x = SHX && SHX.enter;
    if (x) shopOpen(C(), x);
  },
  'sh-buy': el => {
    const c = C(),
      it = shItem(c, el.dataset.id);
    if (!it) return;
    const qi = $('#shq-' + it.id),
      q = Math.max(1, parseInt(qi ? qi.value : 1) || 1);
    shBuy(c, it, q, it.p * q);
  },
  'sh-haggle': el => {
    const c = C(),
      it = shItem(c, el.dataset.id);
    if (!it) return;
    const qi = $('#shq-' + it.id),
      q = Math.max(1, parseInt(qi ? qi.value : 1) || 1);
    SHX = { buy: it.id, q };
    openModal(`<h2>Regatear: ${esc(shName(it))}${q > 1 ? ` ×${q}` : ''}</h2><p class="hint">Precio de la tienda: ${fmtCp(it.p * q)}. Tienes ${fmtCp(totalCp(c))}.</p>
      <p>¿A qué precio se ha comprado?</p><div class="pay"><input id="shb-amt" type="number" inputmode="decimal" min="0" placeholder="0" aria-label="Precio">${coinSel('shb-coin')}</div>
      <div class="btns"><button class="b pri" data-act="sh-haggle-ok">Comprar</button><button class="b" data-act="close-modal">Cancelar</button></div>`);
    setTimeout(() => $('#shb-amt') && $('#shb-amt').focus(), 0);
  },
  'sh-haggle-ok': () => {
    const c = C(),
      it = SHX && shItem(c, SHX.buy),
      cp = readCp('shb-amt', 'shb-coin');
    if (!it) return closeModal();
    if (!(cp >= 0)) {
      $('#shb-amt').focus();
      return;
    }
    shBuy(c, it, SHX.q, cp);
  },
  'sh-sell': el => shSellOpen(C(), +el.dataset.i),
  'sh-sell-ok': () => {
    const c = C(),
      e = SHX && c.equipment.find(x => x.id === SHX.sell),
      cp = readCp('shs-amt', 'shs-coin');
    if (!e) return closeModal();
    if (!(cp >= 0)) {
      $('#shs-amt').focus();
      return;
    }
    const q = $('#shs-q') ? clamp(parseInt($('#shs-q').value) || 1, 1, +e.qty) : 1;
    if (cp > c.shop.g) return shNoMoney('v');
    const code = shCodeOf(e),
      name = e.name,
      take = shTake(c, e, q),
      [coin, amt] = cpCoin(cp);
    c.coins[coin] = (+c.coins[coin] || 0) + amt;
    c.shop.g -= cp;
    c.shop.log.push({ t: 's', name, q, cp, code, take });
    closeModal();
    save();
    render();
    toast(
      `<div class="t-label">Vendes</div><div class="t-big">${esc(name)}${q > 1 ? ` ×${q}` : ''}</div><div class="t-parts">Cobras ${fmtCp(cp)}.</div>`
    );
  },
  'sh-undo': el => {
    const c = C(),
      sh = c.shop,
      i = +el.dataset.i,
      l = sh && sh.log[i];
    if (!l || l.r) return;
    if (l.t === 'b') {
      const e = c.equipment.find(x => x.id === l.eid);
      if (e) {
        if ((+e.qty || 1) > l.added) e.qty = +e.qty - l.added;
        else {
          c.equipment = c.equipment.filter(x => x.id !== e.id);
          c.attacks = c.attacks.filter(a => a.item !== e.id);
          c.attacks.forEach(a => {
            if (a.ammo === e.id) a.ammo = '';
          });
        }
      }
      const [coin, amt] = cpCoin(l.cp);
      c.coins[coin] = (+c.coins[coin] || 0) + amt;
      const it = sh.items.find(x => x.id === l.sid);
      if (it && it.q >= 0) it.q += l.q;
      sh.g = Math.max(0, sh.g - l.cp);
    } else {
      const [coin, amt] = cpCoin(l.cp);
      if (l.cp > 0 && !pay(c, amt, coin)) {
        toast('<div class="t-parts">Ya no tienes ese dinero, así que no se puede anular la venta.</div>');
        return;
      }
      if (l.take.whole) {
        c.equipment.push(l.take.copy);
        c.attacks.push(...l.take.atks);
      } else {
        const e = c.equipment.find(x => x.id === l.take.id);
        if (e) e.qty = (+e.qty || 0) + l.q;
      }
      sh.g += l.cp;
    }
    sh.log.splice(i, 1);
    save();
    render();
    toast(`<div class="t-parts">Anulado: ${l.t === 'b' ? 'compra' : 'venta'} de ${esc(l.name)}.</div>`);
  },
  'sh-rcpt': () => shRcptOpen(C()),
  'sh-copy': async () => {
    const t = SHX && SHX.link;
    if (!t) return;
    try {
      await navigator.clipboard.writeText(t);
      toast('<div class="t-parts">Código copiado. Pásaselo al máster.</div>');
    } catch (e) {
      toast('<div class="t-parts">No se ha podido copiar. Enséñale el QR al máster.</div>');
    }
  },
  'sh-exit': () => {
    const c = C();
    if (c.shop && c.shop.log.some(l => !l.r)) {
      openModal(`<h2>¿Salir de la tienda?</h2><p>Tienes compras o ventas que aún no están en un recibo. Si sales sin enseñárselo al máster, su tienda no se actualizará.</p>
        <div class="btns"><button class="b pri" data-act="sh-rcpt">Generar recibo</button><button class="b bad" data-act="sh-exit-ok">Salir igualmente</button><button class="b" data-act="close-modal">Cancelar</button></div>`);
      return;
    }
    A['sh-exit-ok']();
  },
  'sh-exit-ok': () => {
    const c = C();
    c.shop = null;
    S.tab = 'play';
    closeModal();
    save();
    render();
    scrollTo(0, 0);
  },

  /* ── Máster ── */
  'msh-new': () => shEditOpen(null),
  'msh-edit': el => shEditOpen(MST.shops.find(x => x.id === el.dataset.id)),
  'msh-qr': el => {
    const sh = MST.shops.find(x => x.id === el.dataset.id);
    if (!sh) return;
    const t = el.closest('.toast');
    if (t) t.remove();
    shopQrOpen(sh);
  },
  'msh-del': el => {
    const sh = MST.shops.find(x => x.id === el.dataset.id);
    if (!sh) return;
    openModal(`<h2>¿Borrar ${esc(sh.n)}?</h2><p class="hint">Se borra la tienda de este dispositivo. Los jugadores que la tengan abierta pueden seguir, pero sus recibos ya no se podrán aplicar.</p>
      <div class="btns"><button class="b bad" data-act="msh-del-ok" data-id="${sh.id}">Borrar</button><button class="b" data-act="close-modal">Cancelar</button></div>`);
  },
  'msh-del-ok': el => {
    MST.shops = MST.shops.filter(x => x.id !== el.dataset.id);
    masterSave();
    closeModal();
    render();
  },
  'msh-add': () => {
    let k = $('#she-k').value;
    if (!k) return $('#she-k').focus();
    const it = { id: uid().slice(0, 6), c: k, p: 0, q: -1, u: 1 };
    if (k === 's:') {
      const sp = $('#she-sp').value;
      if (!sp) return $('#she-sp').focus();
      it.c = 's:' + sp;
    }
    if (k === 'x') {
      it.n = $('#she-xn').value.trim();
      if (!it.n) return $('#she-xn').focus();
      it.cat = $('#she-xc').value;
      it.d = $('#she-xd').value.trim();
    }
    const [t, key] = it.c.split(':');
    if (t === 'g' && GEAR[key] && GEAR[key].qty) it.u = GEAR[key].qty;
    if (t === 'm' && AMMO[key]) it.u = AMMO[key][1];
    const p = parseFloat(String($('#she-p').value).replace(',', '.'));
    it.p = p >= 0 ? Math.round(p * 100) : 0;
    const q = $('#she-q').value.trim();
    it.q = q === '' ? -1 : Math.max(0, parseInt(q) || 0);
    SHE.items.push(it);
    shEditRefresh();
  },
  'msh-rm': el => {
    SHE.items.splice(+el.dataset.i, 1);
    shEditRefresh();
  },
  'msh-save': () => {
    SHE.n = $('#she-n').value.trim() || 'Tienda';
    const g = readCp('she-g', 'she-gc');
    if (g >= 0) SHE.g = g;
    const isNew = SHE.isNew;
    delete SHE.isNew;
    SHE.ver = (SHE.ver || 0) + 1;
    const i = MST.shops.findIndex(x => x.id === SHE.id);
    if (i < 0) MST.shops.push(SHE);
    else MST.shops[i] = SHE;
    const sh = SHE;
    MST.tab = 'shops';
    masterSave();
    closeModal();
    render();
    toast(
      `<div class="t-label">${isNew ? 'Tienda creada' : 'Tienda guardada'}</div><div class="t-big">${esc(sh.n)}</div><div class="t-actions"><button class="b sm pri" data-act="msh-qr" data-id="${sh.id}">Mostrar QR</button></div>`
    );
  },
});
