/* Tiendas: el máster las crea y las pasa por QR; el jugador compra, regatea y vende, y devuelve un recibo por QR. */
'use strict';

let SHE = null; // tienda en edición (máster)
let SHX = null; // compra o venta a medias (jugador)

/* ── Dinero en piezas de cobre ── */
function fmtCp(cp) {
  cp = Math.max(0, Math.round(+cp || 0));
  const gp = Math.floor(cp / 100),
    sp = Math.floor((cp % 100) / 10),
    c = cp % 10;
  return (
    [gp && `${gp.toLocaleString('es-ES')} po`, sp && `${sp} pp`, c && `${c} pc`].filter(Boolean).join(' ') ||
    '0 po'
  );
}
/* La mayor moneda en la que la cantidad sale exacta (para pagar sin llenarte de cambio en cobre) */
const cpCoin = cp => (cp % 100 === 0 ? ['gp', cp / 100] : cp % 10 === 0 ? ['sp', cp / 10] : ['cp', cp]);
const coinSel = (id, v = 'gp') =>
  `<select id="${id}" aria-label="Moneda">${COINS.map(([k, l]) => `<option value="${k}" ${k === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
const readCp = (amtId, coinId) => {
  const n = parseFloat(String($('#' + amtId).value).replace(',', '.'));
  return n >= 0 ? Math.round(n * COINV[$('#' + coinId).value]) : NaN;
};

/* ── Objetos de la tienda: código del catálogo o inventado (x) ── */
const SH_STACK = ['g', 'p', 's', 'm', 'x'];
function shInfo(it) {
  const [k, key] = it.c.split(':');
  const d =
    k === 'w'
      ? WEAPONS[key] && { n: WEAPONS[key].n, cat: 'arma', m: `${WEAPONS[key].d} ${WEAPONS[key].t}` }
      : k === 'a'
        ? ARMORS[key] && {
            n: ARMORS[key].n,
            cat: 'armadura',
            m: ARMORS[key].t === 's' ? '+2 a la CA' : `CA ${ARMORS[key].ac}`,
          }
        : k === 'g'
          ? GEAR[key] && { n: GEAR[key].n, cat: GEAR[key].cat, m: GEAR[key].d || '' }
          : k === 't'
            ? TOOLS[key] && { n: TOOLS[key].n, cat: 'herramienta', m: '' }
            : k === 'p'
              ? POTIONS[key] && { n: POTIONS[key].n, cat: 'pocion', m: POTIONS[key].d || '' }
              : k === 's'
                ? SPBY[key] && {
                    n: `Pergamino de ${SPBY[key].n.toLowerCase()}`,
                    cat: 'pergamino',
                    m: SPBY[key].l ? `Conjuro de nivel ${SPBY[key].l}` : 'Truco',
                  }
                : k === 'm'
                  ? AMMO[key] && { n: AMMO[key][0], cat: 'municion', m: '' }
                  : k === 'mi'
                    ? MAGIC[key] && { n: MAGIC[key].n, cat: 'otro', m: MAGIC[key].d || '' }
                    : null;
  return d || { n: it.n || 'Objeto', cat: it.cat || 'otro', m: it.d || '' };
}
const shName = it => (it.c === 'x' ? it.n : shInfo(it).n);
const shStack = it => SH_STACK.includes(it.c.split(':')[0]);
/* Código con el que un objeto de la mochila vuelve al stock del vendedor */
function shCodeOf(e) {
  if (+e.magic || e.mi) return { c: 'x', n: e.name, cat: e.cat, d: e.notes || '' };
  const c = e.weapon
    ? 'w:' + e.weapon
    : e.armor
      ? 'a:' + e.armor
      : e.gear
        ? 'g:' + e.gear
        : e.tool
          ? 't:' + e.tool
          : e.potion && e.potion !== 'other'
            ? 'p:' + e.potion
            : e.scroll
              ? 's:' + e.scroll
              : e.ammoKind
                ? 'm:' + e.ammoKind
                : '';
  return c ? { c } : { c: 'x', n: e.name, cat: e.cat, d: e.notes || '' };
}
/* Mete en la mochila q compras de un objeto de la tienda; devuelve [id del objeto, cantidad añadida] */
function shGive(c, it, q) {
  const [k, key] = it.c.split(':'),
    info = shInfo(it),
    n = q * (it.u || 1);
  const same = e =>
    (k === 'g' && e.gear === key) ||
    (k === 'p' && e.potion === key) ||
    (k === 's' && e.scroll === key) ||
    (k === 'm' && e.ammoKind === key) ||
    (k === 'x' && norm(e.name) === norm(info.n) && e.cat === info.cat && !e.mi && !+e.magic);
  const ex = shStack(it) && c.equipment.find(same);
  if (ex) {
    ex.qty = (+ex.qty || 0) + n;
    return [ex.id, n];
  }
  const e = {
    id: uid(),
    name: info.n,
    qty: shStack(it) ? n : 1,
    cat: info.cat,
    notes: k === 'x' ? it.d || '' : '',
  };
  if (k === 'g') e.gear = key;
  if (k === 'p') e.potion = key;
  if (k === 's') e.scroll = key;
  if (k === 't') e.tool = key;
  if (k === 'm') {
    e.ammoKind = key;
    c.attacks.forEach(a => {
      const W = a.wpn && WEAPONS[a.wpn];
      if (W && W.am && W.am[0] === key && !a.ammo) a.ammo = e.id;
    });
  }
  if (k === 'a') Object.assign(e, { armor: key, magic: 0, equipped: false });
  if (k === 'mi') {
    const P = MAGIC[key];
    e.mi = {
      att: P.att || 0,
      ac: P.ac || 0,
      sv: P.sv || 0,
      ch: P.ch || 0,
      rec: P.rec || '',
      d: P.d || '',
      on: 0,
      used: 0,
    };
    if (P.noarm) e.mi.noarm = 1;
  }
  if (k === 'w') {
    Object.assign(e, { weapon: key, magic: 0, equipped: false });
    const a = Object.assign(NEW.attacks(), {
      name: e.name,
      wpn: key,
      magic: 0,
      mastery: masteryCanAdd(c, key),
      item: e.id,
    });
    const W = WEAPONS[key],
      am = W.am && c.equipment.find(x => x.ammoKind === W.am[0]);
    if (am) a.ammo = am.id;
    c.attacks.push(a);
  }
  c.equipment.push(e);
  syncWeapons(c);
  return [e.id, e.qty];
}
/* Quita q unidades de un objeto de la mochila; devuelve una copia para poder deshacerlo */
function shTake(c, e, q) {
  const copy = JSON.parse(JSON.stringify(e)),
    atks = JSON.parse(JSON.stringify(c.attacks.filter(a => a.item === e.id)));
  if ((+e.qty || 1) > q) {
    e.qty = +e.qty - q;
    return { id: e.id, q, whole: false };
  }
  c.equipment = c.equipment.filter(x => x.id !== e.id);
  c.attacks = c.attacks.filter(a => a.item !== e.id);
  c.attacks.forEach(a => {
    if (a.ammo === e.id) a.ammo = '';
  });
  return { id: e.id, q, whole: true, copy, atks };
}

/* ── Enlaces y QR ── */
function shopPayload(sh) {
  return {
    t: 's',
    id: sh.id,
    v: sh.ver,
    n: sh.n,
    g: sh.g,
    i: sh.items
      .filter(it => !it.h)
      .map(it => [
        it.id,
        it.c,
        it.p,
        it.q,
        it.u || 1,
        it.c === 'x' ? it.n : 0,
        it.c === 'x' ? it.cat : 0,
        it.c === 'x' ? it.d || 0 : 0,
      ]),
  };
}
const shopLink = sh =>
  `${location.origin}${location.pathname}#tienda=${b64u(JSON.stringify(shopPayload(sh)))}`;
function shopParse(code) {
  try {
    const x = JSON.parse(unb64u(code));
    if (!x || x.t !== 's' || !x.id || !Array.isArray(x.i)) return null;
    return {
      id: String(x.id).slice(0, 40),
      v: +x.v || 1,
      n: String(x.n || 'Tienda').slice(0, 60),
      g: Math.max(0, Math.round(+x.g || 0)),
      items: x.i.slice(0, 200).map(r => ({
        id: String(r[0]).slice(0, 20),
        c: String(r[1]).slice(0, 40),
        p: Math.max(0, Math.round(+r[2] || 0)),
        q: +r[3] < 0 ? -1 : Math.max(0, Math.round(+r[3] || 0)),
        u: Math.max(1, Math.round(+r[4] || 1)),
        n: r[5] ? String(r[5]).slice(0, 80) : '',
        cat: r[6] && CATN[r[6]] ? r[6] : 'otro',
        d: r[7] ? String(r[7]).slice(0, 300) : '',
      })),
    };
  } catch (e) {
    return null;
  }
}
function rcptParse(code) {
  try {
    const x = JSON.parse(unb64u(code));
    if (!x || x.t !== 'r' || !x.id || !x.sh || !Array.isArray(x.l)) return null;
    return x;
  } catch (e) {
    return null;
  }
}
function qrSvg(txt) {
  try {
    const q = qrcode(0, 'M');
    q.addData(txt);
    q.make();
    return q.createSvgTag({ cellSize: 4, margin: 3, scalable: true, alt: 'Código QR' });
  } catch (e) {
    return '';
  }
}
const QR_BIG = 1400; // a partir de aquí el QR es muy denso para leerlo con el móvil

/* ── Jugador: entrar en la tienda ── */
function shopEnter(x) {
  const c = C();
  if (!c) {
    toast('<div class="t-parts">Crea o elige antes tu personaje para entrar en la tienda.</div>');
    return;
  }
  const cur = c.shop,
    pend = cur && cur.log.some(l => !l.r);
  if (cur && pend) {
    SHX = { enter: x };
    openModal(`<h2>Ya estás en ${esc(cur.n)}</h2><p>Tienes compras o ventas sin enseñar al máster. Si entras en ${esc(x.n)}, se pierde ese recibo.</p>
      <div class="btns"><button class="b pri" data-act="sh-rcpt">Ver mi recibo</button><button class="b bad" data-act="sh-enter-ok">Entrar igualmente</button><button class="b" data-act="close-modal">Cancelar</button></div>`);
    return;
  }
  shopOpen(c, x);
}
function shopOpen(c, x) {
  c.shop = Object.assign(x, { sess: uid(), log: [] });
  S.tab = 'shop';
  save();
  closeModal();
  render();
  scrollTo(0, 0);
  toast(`<div class="t-label">Entras en la tienda</div><div class="t-big">${esc(x.n)}</div>`);
}

/* ── Jugador: pestaña Tienda ── */
function viewShop(c) {
  const sh = c.shop;
  const rows = sh.items
    .map(it => {
      const info = shInfo(it),
        out = it.q === 0,
        st = it.q < 0 ? 'sin límite' : out ? 'agotado' : `quedan ${it.q}`;
      return `<div class="it"><div class="it-head"><span class="it-name">${esc(shName(it))}${(it.u || 1) > 1 ? ` <span class="tag">×${it.u}</span>` : ''}</span><b>${fmtCp(it.p)}</b></div>
        <div class="meta">${esc(CATN[info.cat] || '')} · ${st}${info.m ? ` · ${esc(info.m)}` : ''}</div>
        <div class="btns">${shStack(it) && (it.q < 0 || it.q > 1) ? `<input class="inline-num shop-q" type="number" inputmode="numeric" min="1" ${it.q > 0 ? `max="${it.q}"` : ''} value="1" id="shq-${esc(it.id)}" aria-label="Cuántos compras" ${out ? 'disabled' : ''}>` : ''}<button class="b sm pri" data-act="sh-buy" data-id="${esc(it.id)}" ${out ? 'disabled' : ''}>Comprar</button><button class="b sm" data-act="sh-haggle" data-id="${esc(it.id)}" ${out ? 'disabled' : ''}>Regatear</button></div></div>`;
    })
    .join('');
  const mine = c.equipment
    .map((e, i) => [e, i])
    .filter(([e]) => e.cat !== 'mapa' && (+e.qty || 0) > 0)
    .map(
      ([e, i]) =>
        `<div class="it"><div class="it-head"><span class="it-name">${esc(e.name)}${+e.qty > 1 ? ` <span class="tag">×${e.qty}</span>` : ''}</span><button class="b sm" data-act="sh-sell" data-i="${i}">Vender</button></div>${e.equipped ? `<div class="meta">${e.armor ? 'Puesta' : 'Equipada'}</div>` : ''}${e.mi && e.mi.att && e.mi.on ? '<div class="meta">Sintonizado</div>' : ''}</div>`
    )
    .join('');
  const log = sh.log
    .map(
      (l, i) =>
        `<div class="trow"><div class="tname">${l.t === 'b' ? 'Compras' : 'Vendes'} ${esc(l.name)}${l.q > 1 ? ` ×${l.q}` : ''}<small>${fmtCp(l.cp)}${l.r ? ' · ya en un recibo' : ''}</small></div>${l.r ? '' : `<button class="b sm" data-act="sh-undo" data-i="${i}">Anular</button>`}</div>`
    )
    .join('');
  return `<div class="cols"><div class="col"><section class="card"><div class="card-head"><h2>${esc(sh.n)}</h2><div class="btns"><button class="b sm" data-act="sh-rcpt" ${sh.log.length ? '' : 'disabled'}>Generar recibo</button><button class="b sm bad" data-act="sh-exit">Salir de la tienda</button></div></div>
      <div class="diff"><span>Dinero del vendedor</span><b>${fmtCp(sh.g)}</b><span>Tu dinero</span><b>${fmtCp(totalCp(c))}</b></div>
      <p class="hint">«Comprar» paga el precio de la tienda. «Regatear» te pregunta el precio que habéis acordado. Cuando termines, pulsa «Generar recibo» y enséñaselo al máster.</p></section>
      <section class="card"><h2>Comprar</h2>${rows ? `<div class="list">${rows}</div>` : '<p class="empty">La tienda no tiene nada a la venta.</p>'}</section></div>
    <div class="col"><section class="card"><h2>Vender</h2><p class="hint">Elige qué vendes y apunta el precio que acordéis con el vendedor.</p>${mine ? `<div class="list">${mine}</div>` : '<p class="empty">No tienes nada que vender.</p>'}</section>
      <section class="card"><h2>Lo que has hecho</h2>${log ? log : '<p class="empty">Nada todavía.</p>'}</section></div></div>`;
}
function shItem(c, id) {
  return c.shop && c.shop.items.find(x => x.id === id);
}
function shNoMoney(who) {
  openModal(
    `<h2>${who === 'v' ? 'El vendedor no tiene dinero suficiente' : 'Dinero insuficiente'}</h2><p class="hint">${who === 'v' ? 'No puede pagarte ese precio. Acordad otro más bajo.' : 'No tienes monedas suficientes para pagar ese precio.'}</p><div class="btns"><button class="b" data-act="close-modal">Vale</button></div>`
  );
}
/* Compra: q compras de it por cp en total */
function shBuy(c, it, q, cp) {
  if (it.q >= 0 && q > it.q) {
    toast(`<div class="t-parts">Solo quedan ${it.q}.</div>`);
    return false;
  }
  if (cp > totalCp(c)) {
    shNoMoney('j');
    return false;
  }
  const [coin, amt] = cpCoin(cp);
  if (cp > 0 && !pay(c, amt, coin)) {
    shNoMoney('j');
    return false;
  }
  const [eid, added] = shGive(c, it, q);
  if (it.q > 0) it.q -= q;
  c.shop.g += cp;
  c.shop.log.push({ t: 'b', sid: it.id, name: shName(it), q, cp, eid, added });
  closeModal();
  save();
  render();
  toast(
    `<div class="t-label">Compras</div><div class="t-big">${esc(shName(it))}${q > 1 ? ` ×${q}` : ''}</div><div class="t-parts">Pagas ${fmtCp(cp)}. Ya lo tienes en la mochila${it.c.startsWith('w:') || it.c.startsWith('a:') ? ' (equípalo desde Partida)' : ''}.</div>`
  );
  return true;
}
function shSellOpen(c, i) {
  const e = c.equipment[i];
  if (!e) return;
  const warn = [];
  if (e.armor && e.equipped) {
    const before = acOf(c);
    e.equipped = false;
    const after = acOf(c);
    e.equipped = true;
    if (before !== after)
      warn.push(`Llevas puesta esta armadura: si la vendes, tu CA pasará de ${before} a ${after}.`);
  }
  if (e.cat === 'arma' && c.attacks.some(a => a.item === e.id)) warn.push('Desaparecerá de tus ataques.');
  if (e.mi && e.mi.att && e.mi.on) warn.push('Estás sintonizado con este objeto: dejarás de estarlo.');
  SHX = { sell: e.id };
  openModal(`<h2>Vender ${esc(e.name)}</h2>
    ${warn.map(w => `<p class="hint warn">${esc(w)}</p>`).join('')}
    ${+e.qty > 1 ? `<label class="f"><span>¿Cuántos vendes? (tienes ${e.qty})</span><input id="shs-q" type="number" inputmode="numeric" min="1" max="${e.qty}" value="1"></label>` : ''}
    <p>¿A qué precio se ha vendido?</p><div class="pay"><input id="shs-amt" type="number" inputmode="decimal" min="0" placeholder="0" aria-label="Precio">${coinSel('shs-coin')}</div>
    <p class="hint">El vendedor tiene ${fmtCp(c.shop.g)}.</p>
    <div class="btns"><button class="b pri" data-act="sh-sell-ok">Vender</button><button class="b" data-act="close-modal">Cancelar</button></div>`);
  setTimeout(() => $('#shs-amt') && $('#shs-amt').focus(), 0);
}
function shRcptOpen(c) {
  const sh = c.shop;
  sh.log.forEach(l => (l.r = 1));
  save();
  render();
  const rc = {
    t: 'r',
    id: sh.sess,
    sh: sh.id,
    v: sh.v,
    n: c.name || 'Jugador',
    l: sh.log.map(l =>
      l.t === 'b'
        ? ['b', l.sid, l.q, l.cp]
        : ['s', l.code.c, l.q, l.cp, l.code.n || 0, l.code.cat || 0, l.code.d || 0]
    ),
  };
  const link = `${location.origin}${location.pathname}#recibo=${b64u(JSON.stringify(rc))}`;
  const svg = qrSvg(link);
  SHX = { link };
  openModal(
    `<div class="wz-head"><h2>Recibo</h2><button class="b sm" data-act="close-modal">Cerrar</button></div>
    <p class="hint">Enséñale este QR al máster para que su tienda se actualice (o exporta el archivo .json y pásaselo). Después te pasará la tienda actualizada para el siguiente.</p>
    ${svg ? `<div class="qrbox">${svg}</div>` : ''}${link.length > QR_BIG ? '<p class="hint warn">El recibo es largo y el QR es muy denso: si no se lee, copia el código.</p>' : ''}
    <div class="btns" style="justify-content:center"><button class="b" data-act="sh-copy">Copiar código</button>${qrFileBtn('recibo', link.split('#recibo=')[1], `${sh.n} ${c.name || ''}`)}</div>
    <div class="diff">${sh.log.map(l => `<span>${l.t === 'b' ? 'Compras' : 'Vendes'} ${esc(l.name)}${l.q > 1 ? ` ×${l.q}` : ''}</span><b>${fmtCp(l.cp)}</b>`).join('')}</div>`,
    true
  );
}

/* ── Máster: pestaña Tiendas ── */
function masterShops() {
  const list = MST.shops
    .map(
      sh => `<div class="it"><div class="it-head"><span class="it-name">${esc(sh.n)}</span><b>${fmtCp(sh.g)}</b></div>
      <div class="meta">${sh.items.length} ${sh.items.length === 1 ? 'objeto' : 'objetos'}${sh.items.some(it => it.h) ? ` (${sh.items.filter(it => it.h).length} ocultos)` : ''} · dinero del vendedor</div>
      <div class="btns"><button class="b sm pri" data-act="msh-qr" data-id="${sh.id}">Mostrar QR</button><button class="b sm" data-act="msh-edit" data-id="${sh.id}">Editar</button><button class="b sm bad" data-act="msh-del" data-id="${sh.id}">Borrar</button></div></div>`
    )
    .join('');
  return `<section class="card"><div class="card-head"><h2>Tiendas</h2><div class="btns"><button class="b pri" data-act="msh-new">Nueva tienda</button></div></div>
    <p class="hint">Enseña el QR de la tienda a un jugador (o pásale su archivo .json). Cuando termine, escanea o importa su recibo: la tienda se actualiza y le pasas la versión nueva al siguiente.</p>
    ${list ? `<div class="list">${list}</div>` : '<p class="empty">Ninguna tienda todavía.</p>'}
    <div class="btns" style="margin-top:.8rem"><button class="b" data-act="m-scan">Escanear o importar recibo</button></div></section>`;
}
function shopQrOpen(sh) {
  const link = shopLink(sh),
    svg = qrSvg(link);
  openModal(
    `<div class="wz-head"><h2>${esc(sh.n)}</h2><button class="b sm" data-act="close-modal">Cerrar</button></div>
    <p class="hint">El jugador lo escanea con la cámara del móvil o desde su app (⚙ Ajustes → Recibir del máster). Si usa portátil, exporta el archivo .json y pásaselo: lo importa en ese mismo sitio.</p>
    ${svg ? `<div class="qrbox">${svg}</div>` : '<p class="hint warn">La tienda es demasiado grande para un QR. Quita objetos o acorta las descripciones.</p>'}
    ${svg && link.length > QR_BIG ? '<p class="hint warn">La tienda es grande y el QR es muy denso: puede costar leerlo. Quita objetos o acorta las descripciones.</p>' : ''}
    <div class="btns" style="justify-content:center">${qrFileBtn('tienda', link.split('#tienda=')[1], sh.n)}<button class="b" data-act="m-scan">Escanear o importar recibo</button></div>`,
    true
  );
}
/* Precio del manual de un objeto del catálogo, en pc (0 si no lo hay) */
function shPrice(code) {
  const [k, key] = code.split(':');
  if (k === 's') return SPBY[key] ? SCROLL_PRICES[SPBY[key].l] || 0 : 0;
  return PRICES[code] || 0;
}
/* Objetos del manual, por grupos, para marcarlos y añadirlos de golpe */
function shCatalogGroups() {
  const g = (lbl, pre, obj, nm = v => v.n) => [
    lbl,
    Object.entries(obj)
      .filter(([k]) => k !== 'other')
      .map(([k, v]) => [`${pre}:${k}`, nm(v)])
      .sort((a, b) => a[1].localeCompare(b[1], 'es')),
  ];
  return [
    g('Armas', 'w', WEAPONS),
    g('Armaduras y escudos', 'a', ARMORS),
    g('Munición', 'm', AMMO, v => `${v[0]} (${v[1]})`),
    g('Pociones', 'p', POTIONS),
    g('Equipo', 'g', GEAR, v => (v.qty ? `${v.n} (${v.qty})` : v.n)),
    g('Herramientas', 't', TOOLS),
    g('Objetos mágicos', 'mi', MAGIC),
  ];
}
/* Precio con su moneda: casilla de cantidad + desplegable */
function shPriceIn(id, cp, coin, attrs = '') {
  const k = coin && COINV[coin] ? coin : cpCoin(cp)[0];
  return `<span class="pay shpay"><input id="${id}" type="number" inputmode="decimal" min="0" step="any" value="${cp === '' ? '' : +(cp / COINV[k]).toFixed(2)}" ${attrs} aria-label="Precio"><select id="${id}-c" ${attrs.replace('data-she="p"', 'data-she="pc"')} aria-label="Moneda">${COINS.map(([c, l]) => `<option value="${c}" ${c === k ? 'selected' : ''}>${l}</option>`).join('')}</select></span>`;
}
function shEditHTML() {
  const sh = SHE;
  const [gc, ga] = cpCoin(sh.g);
  const hid = sh.items.filter(it => it.h).length;
  const rows = sh.items
    .map(
      (
        it,
        i
      ) => `<div class="shrow ${it.h ? 'hid' : ''}"><div class="shname"><b>${esc(shName(it))}</b>${it.h ? '<span class="tag">Oculto</span>' : ''}${shStack(it) ? `<label class="mf"><span>Por compra</span><input class="inline-num" type="number" inputmode="numeric" min="1" value="${it.u || 1}" data-she="u" data-i="${i}" aria-label="Unidades por compra"></label>` : ''}</div>
      <label class="mf"><span>Precio</span>${shPriceIn(`she-p${i}`, it.p, it.pc, `data-she="p" data-i="${i}"`)}</label>
      <label class="mf"><span>Stock</span><input class="inline-num" type="number" inputmode="numeric" min="0" value="${it.q < 0 ? '' : it.q}" placeholder="∞" data-she="q" data-i="${i}" aria-label="Stock (vacío = sin límite)"></label>
      <span class="btns shbtns"><button class="b sm" data-act="msh-hide" data-i="${i}" aria-pressed="${it.h ? 'true' : 'false'}">${it.h ? 'Mostrar' : 'Ocultar'}</button><button class="b sm" data-act="msh-rm" data-i="${i}" aria-label="Quitar ${esc(shName(it))}">×</button></span></div>`
    )
    .join('');
  const have = new Set(sh.items.map(it => it.c)),
    pick = new Set(sh.pick || []),
    f = bestNorm(sh.f || '');
  const groups = shCatalogGroups()
    .map(([lbl, list]) => {
      const opts = list
        .map(
          ([code, n]) =>
            `<label class="shopt" data-n="${esc(bestNorm(n))}" ${f && !bestNorm(n).includes(f) ? 'hidden' : ''}><input type="checkbox" data-she-pick="${code}" ${pick.has(code) ? 'checked' : ''}><span>${esc(n)}${have.has(code) ? ' <small>(ya está)</small>' : ''}</span><small>${shPrice(code) ? fmtCp(shPrice(code)) : '—'}</small></label>`
        )
        .join('');
      return `<div class="shgrp"><h4>${lbl}</h4>${opts}</div>`;
    })
    .join('');
  const len = shopLink(sh).length;
  return `<div class="grid"><label class="f wide"><span>Nombre de la tienda o del vendedor</span><input id="she-n" value="${esc(sh.n)}" placeholder="Herrería de Brom"></label>
    <label class="f"><span>Dinero del vendedor</span><span class="pay"><input id="she-g" type="number" inputmode="decimal" min="0" value="${ga}">${coinSel('she-gc', gc)}</span></label></div>
    <h3>A la venta</h3>${rows || '<p class="empty">Nada todavía.</p>'}
    <p class="hint">Precio por compra, en la moneda que elijas (PO oro, PP plata, PC cobre…). Stock vacío = sin límite. «Ocultar» deja el objeto en tu tienda pero no sale en el QR que enseñas a los jugadores${hid ? ` (ahora hay ${hid} ${hid === 1 ? 'oculto' : 'ocultos'})` : ''}; si luego lo muestras, pásales el QR de nuevo.</p>
    <h3>Añadir del manual</h3>
    <p class="hint">Marca todo lo que quieras y pulsa «Añadir». Se ponen con el precio del manual y después puedes cambiarlo.</p>
    <input id="she-f" type="search" class="bsearch" placeholder="Buscar: espada, poción, cuerda…" autocomplete="off" value="${esc(sh.f || '')}" aria-label="Buscar en el catálogo">
    <div class="shpick" id="she-pick">${groups}</div>
    <div class="btns"><button class="b pri" id="she-pick-btn" data-act="msh-add-many" ${pick.size ? '' : 'disabled'}>Añadir${pick.size ? ` (${pick.size})` : ''}</button>${pick.size ? '<button class="b" data-act="msh-pick-clear">Desmarcar</button>' : ''}</div>
    <h3>Añadir otro objeto</h3><div class="grid"><label class="f wide"><span>Objeto</span><select id="she-k"><option value="">— Elige —</option><option value="s:">Pergamino de conjuro…</option><option value="x">Otro (lo invento yo)</option></select></label>
      <label class="f wide" id="she-sp-w" hidden><span>Conjuro del pergamino</span><select id="she-sp"><option value="">—</option>${[
        ...SP,
      ]
        .sort((a, b) => a.l - b.l || a.n.localeCompare(b.n, 'es'))
        .map(s => `<option value="${s.id}">${esc(s.n)} (${s.l ? 'nivel ' + s.l : 'truco'})</option>`)
        .join('')}</select></label>
      <div class="wide" id="she-x" hidden><div class="grid"><label class="f"><span>Nombre</span><input id="she-xn" autocomplete="off"></label><label class="f"><span>Tipo</span><select id="she-xc">${CATS.filter(
        ([k]) => k !== 'mapa'
      )
        .map(([k, n]) => `<option value="${k}" ${k === 'otro' ? 'selected' : ''}>${n}</option>`)
        .join(
          ''
        )}</select></label><label class="f wide"><span>Descripción (corta)</span><input id="she-xd" maxlength="200"></label></div></div>
      <label class="f"><span>Precio</span>${shPriceIn('she-p', '', 'gp')}</label>
      <label class="f"><span>Stock</span><input id="she-q" type="number" inputmode="numeric" min="0" placeholder="∞ (sin límite)"></label></div>
    <p class="hint">Si es un pergamino y no pones precio, se pone el del manual según su nivel.</p>
    <div class="btns"><button class="b" data-act="msh-add">Añadir a la tienda</button></div>
    ${len > QR_BIG ? '<p class="hint warn">La tienda ya es grande: el QR será muy denso. Quita u oculta objetos, o acorta las descripciones.</p>' : ''}`;
}
/* Filtra el catálogo sin repintar (para no perder el foco ni lo marcado) */
function shPickFilter(q) {
  SHE.f = q;
  const f = bestNorm(q);
  document.querySelectorAll('#she-pick .shopt').forEach(l => (l.hidden = !!f && !l.dataset.n.includes(f)));
  document
    .querySelectorAll('#she-pick .shgrp')
    .forEach(g => (g.hidden = !g.querySelector('.shopt:not([hidden])')));
}
/* Cuenta lo marcado en el botón «Añadir» */
function shPickCount() {
  const n = (SHE.pick || []).length,
    b = $('#she-pick-btn');
  if (!b) return;
  b.disabled = !n;
  b.textContent = n ? `Añadir (${n})` : 'Añadir';
}
function shEditOpen(sh) {
  SHE = JSON.parse(JSON.stringify(sh || { id: uid(), ver: 0, n: '', g: 10000, items: [], applied: {} }));
  SHE.isNew = !sh;
  openModal(
    `<div class="wz-head"><h2>${sh ? 'Editar tienda' : 'Nueva tienda'}</h2><div class="btns"><button class="b sm" data-act="close-modal">Cancelar</button><button class="b sm pri" data-act="msh-save">Guardar</button></div></div><div class="wz-body" id="she-body">${shEditHTML()}</div>`,
    true
  );
  shPickFilter('');
}
function shEditRefresh() {
  const b = $('#she-body');
  if (!b) return;
  SHE.n = $('#she-n').value;
  const g = readCp('she-g', 'she-gc');
  if (g >= 0) SHE.g = g;
  const sc = b.scrollTop;
  b.innerHTML = shEditHTML();
  enhanceSelects(b);
  shPickFilter(SHE.f || '');
  b.scrollTop = sc;
}
/* Máster: aplica un recibo a su tienda */
function rcptApply(rc) {
  const sh = MST.shops.find(x => x.id === rc.sh);
  if (!sh) {
    const k = MST.camps.find(x => x.id !== MST.cur && (x.shops || []).some(s => s.id === rc.sh)),
      other = k && k.shops.find(s => s.id === rc.sh);
    toast(
      k
        ? `<div class="t-parts">Ese recibo es de ${esc(other.n)}, de la campaña «${esc(k.n)}». Cámbiate a esa campaña en «Campañas» y vuelve a escanearlo.</div>`
        : '<div class="t-parts">Ese recibo es de una tienda que no está en este dispositivo.</div>'
    );
    return;
  }
  sh.applied = sh.applied || {};
  const done = sh.applied[rc.id] || 0,
    lines = rc.l.slice(done);
  if (!lines.length) {
    toast(
      `<div class="t-label">Recibo ya aplicado</div><div class="t-parts">Lo de ${esc(rc.n)} ya estaba en ${esc(sh.n)}.</div>`
    );
    return;
  }
  const old = !done && +rc.v !== sh.ver;
  const parts = [];
  for (const l of lines) {
    const [t, ref, q0, cp0] = l,
      q = Math.max(1, +q0 || 1),
      cp = Math.max(0, +cp0 || 0);
    if (t === 'b') {
      const it = sh.items.find(x => x.id === ref);
      if (it && it.q >= 0) it.q = Math.max(0, it.q - q);
      sh.g += cp;
      parts.push(`compra ${it ? shName(it) : 'un objeto'}${q > 1 ? ` ×${q}` : ''} por ${fmtCp(cp)}`);
    } else if (t === 's') {
      const code = String(ref),
        x = { c: code, n: l[4] ? String(l[4]) : '', cat: l[5] || 'otro', d: l[6] ? String(l[6]) : '' };
      const ex = sh.items.find(
        it => it.c === code && (it.u || 1) === 1 && (code !== 'x' || norm(it.n) === norm(x.n))
      );
      if (ex) {
        if (ex.q >= 0) ex.q += q;
      } else sh.items.push(Object.assign({ id: uid().slice(0, 6), p: Math.round(cp / q), q, u: 1 }, x));
      sh.g = Math.max(0, sh.g - cp);
      parts.push(`vende ${shName(Object.assign({ u: 1 }, x))}${q > 1 ? ` ×${q}` : ''} por ${fmtCp(cp)}`);
    }
  }
  sh.applied[rc.id] = rc.l.length;
  sh.ver++;
  masterSave();
  MST.tab = 'shops';
  closeModal();
  render();
  toast(
    `<div class="t-label">Recibo de ${esc(rc.n)}</div><div class="t-parts">${esc(parts.join('; '))}.</div>${old ? '<div class="t-parts"><b>Ojo:</b> entró con un QR antiguo de la tienda. Revisa el stock.</div>' : ''}<div class="t-actions"><button class="b sm pri" data-act="msh-qr" data-id="${sh.id}">QR para el siguiente</button></div>`,
    true
  );
}
