/* Inventario: dinero, herramientas, armas, armaduras, pociones, pergaminos y objetos. */
'use strict';

function totalCp(c) {
  return COINS.reduce((t, [k, , v]) => t + (+c.coins[k] || 0) * v, 0);
}
function moneyHTML(c) {
  const tot = totalCp(c);
  return `<div class="coins">${COINS.map(([k, l]) => `<label>${l}<input id="coin-${k}" type="number" inputmode="numeric" min="0" data-path="coins.${k}" data-num="1" value="${c.coins[k]}"></label>`).join('')}</div>
      <p class="total">Total: ${(tot / 100).toLocaleString('es-ES', { maximumFractionDigits: 2 })} PO en monedas</p>
      <h3>Pagar o cobrar</h3>
      <div class="pay"><input id="pay-amt" type="number" inputmode="numeric" min="0" placeholder="0" aria-label="Cantidad"><select id="pay-coin" aria-label="Moneda">${COINS.map(([k, l]) => `<option value="${k}" ${k === 'gp' ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <button class="b bad" data-act="pay">Pagar</button><button class="b good" data-act="earn">Cobrar</button></div>
      <p class="hint" style="margin-top:.5rem">Al pagar, si no tienes monedas de ese tipo, se cambian monedas mayores y te quedas el cambio. 1 PPt = 10 PO = 20 PE = 100 PP = 1000 PC.</p>`;
}
function refreshMoney() {
  const b = $('#money-body');
  if (b) b.innerHTML = moneyHTML(C());
}
function openMoney() {
  openModal(
    `<div class="wz-head"><h2>Dinero</h2><button class="b sm" data-act="money-close">Hecho</button></div><div id="money-body">${moneyHTML(C())}</div>`
  );
}
function toolProf(c, T, v) {
  const t = norm(c.proficiencies.tools || '');
  return (
    t.includes(norm(T.n)) ||
    (!!v && t.includes(norm(v))) ||
    (T.vars && /instrumento/.test(t) && T === TOOLS.instrument) ||
    (T === TOOLS.gaming && /juego/.test(t))
  );
}
function toolBonus(c, T, v) {
  const pr = toolProf(c, T, v);
  return { b: M(c, T.ab) + (pr ? pb(c) : 0), pr };
}
function toolsList(c) {
  const out = [],
    seen = new Set();
  c.equipment.forEach(e => {
    const T = e.tool && TOOLS[e.tool];
    if (!T) return;
    const k = e.tool + '|' + (e.tvar || '');
    if (seen.has(k)) return;
    seen.add(k);
    out.push({ T, v: e.tvar || '', name: e.name, have: true, id: e.id });
  });
  const t = norm(c.proficiencies.tools || '');
  Object.entries(TOOLS).forEach(([k, T]) => {
    if (t.includes(norm(T.n)) && ![...seen].some(x => x.startsWith(k + '|')))
      out.push({ T, v: '', name: T.n, have: false });
  });
  return out;
}
function toolDetail(c, x) {
  const { b, pr } = toolBonus(c, x.T, x.v);
  return `<div class="it"><div class="it-head">${x.id ? `<button class="it-link" data-act="item-open" data-id="${x.id}">${esc(x.name)}</button>` : `<span class="it-name">${esc(x.name)} <span class="tag">no la llevas</span></span>`}<span class="badge">${AB[x.T.ab][1]} ${sgn(b)}</span></div>
    <div class="meta">${pr ? 'Competente: sumas tu bonificador de competencia' : 'Sin competencia: solo tu modificador de ' + AB[x.T.ab][2]}</div>
    <details><summary>Usos y fabricación</summary><ul class="tuse">${x.T.use.map(u => `<li>${esc(u[0])} <b>CD ${u[1]}</b></li>`).join('')}</ul>${x.T.craft ? `<p class="meta"><b>Puedes fabricar:</b> ${esc(x.T.craft)}</p>` : ''}</details></div>`;
}
function gearUse(i, eco) {
  const c = C(),
    e = c.equipment[i],
    G = GEAR[e.gear];
  if (!G || (!G.keep && e.qty <= 0)) return;
  const T = c.turn;
  let extra = '';
  if (G.act === 'atk') {
    if (!T.a) {
      T.a = true;
      T.atk = attacksPerAction(c) - 1;
    } else T.atk = Math.max(0, T.atk - 1);
    extra = `Salvación de ${G.save} CD <b>${8 + M(c, 'dex') + pb(c)}</b> · si falla: ${esc(G.dmg)}.`;
  } else if (G.act === 'A' || G.act === 'AA') spendEco(c, G.act);
  if (!G.keep) e.qty = Math.max(0, e.qty - 1);
  if (G.eff) c.effects.push(Object.assign({ id: uid(), name: G.eff[0], conc: false }, G.eff[1]));
  save();
  render();
  refreshInv();
  toast(
    `<div class="t-label">${G.act === 'lit' ? 'Enciendes' : 'Usas'}</div><div class="t-big">${esc(e.name)}</div><div class="t-parts">${esc(G.d)}${extra ? ' ' + extra : ''}${G.keep ? '' : ` Te quedan ${e.qty}${G.unit ? ' ' + G.unit : ''}.`}</div>`
  );
}
/* Quita de la ficha los objetos que se han quedado a 0 (salvo munición, mapas, armas, armaduras y herramientas) */
function pruneEmpty(c) {
  if (!c || !Array.isArray(c.equipment)) return;
  const gone = c.equipment.filter(
    e =>
      e.qty !== '' && e.qty != null && +e.qty <= 0 && e.cat !== 'municion' && e.cat !== 'mapa' && !inCard(e)
  );
  if (!gone.length) return;
  const ids = gone.map(e => e.id);
  c.equipment = c.equipment.filter(e => !ids.includes(e.id));
  c.attacks.forEach(a => {
    if (ids.includes(a.ammo)) a.ammo = '';
    if (ids.includes(a.item)) a.item = '';
  });
  toast(
    `<div class="t-label">Se ha acabado</div><div class="t-parts">${esc(gone.map(e => e.name).join(', '))}: ${gone.length > 1 ? 'los quito' : 'lo quito'} de la mochila.</div>`
  );
}
/* Armas, armaduras y herramientas se gestionan en sus tarjetas de Partida, no en la mochila */
const inCard = e => e.cat === 'arma' || e.cat === 'armadura' || e.cat === 'herramienta';
const atkItem = (c, a) => (a.item ? c.equipment.find(e => e.id === a.item) : null);
/* Un ataque sale en Combate salvo que sea de un arma sin equipar */
const atkReady = (c, a) => {
  const e = atkItem(c, a);
  return !(e && e.cat === 'arma' && e.equipped === false);
};
/* ¿El arma sale en Combate? Tiene su ataque y no está desequipada */
const wpnOn = (c, e) => e.equipped !== false && c.attacks.some(a => a.item === e.id);
/* Crea el ataque de un arma del catálogo si todavía no lo tiene */
function wpnEnsureAtk(c, e) {
  if (c.attacks.some(a => a.item === e.id) || !e.weapon || !WEAPONS[e.weapon]) return;
  const W = WEAPONS[e.weapon],
    a = Object.assign(NEW.attacks(), {
      name: e.name,
      wpn: e.weapon,
      magic: +e.magic || 0,
      mastery: MASTERY_CLS.has(c.classKey),
      item: e.id,
    });
  const r = wpnCalc(c, a);
  Object.assign(a, { atk: r.atk, dmg: r.dmg, type: r.type, notes: r.notes });
  if (W.am) {
    const am = c.equipment.find(x => x.ammoKind === W.am[0]);
    if (am) a.ammo = am.id;
  }
  c.attacks.push(a);
}
/* Aviso al equipar un arma con la que no se es competente */
function wpnProfWarn(c, e) {
  const W = e.weapon && WEAPONS[e.weapon];
  if (W && !wpnProf(c, W))
    toast(
      `<div class="t-label">Sin competencia</div><div class="t-parts">No eres competente con ${esc(e.name)}: al atacar no sumas tu bonificador de competencia (+${pb(c)}), solo tu modificador. El daño es el mismo.</div>`
    );
}
function linkItemWeapons(c) {
  if (c._itemWpnLinked) return;
  c._itemWpnLinked = true;
  c.equipment.forEach(e => {
    if (e.weapon || e.cat !== 'arma') return;
    const n = norm(e.name).replace(/\s*\(.*\)$/, '');
    const k = Object.keys(WEAPONS).find(k => norm(WEAPONS[k].n) === n);
    if (k) e.weapon = k;
  });
}
/* Fichas antiguas: enlaza cada ataque con el arma del equipo del mismo nombre (o del mismo tipo) */
function linkAttackItems(c) {
  if (c._atkItemLinked) return;
  c._atkItemLinked = true;
  const used = new Set(c.attacks.map(a => a.item).filter(Boolean));
  c.attacks.forEach(a => {
    if (a.item) return;
    const e =
      c.equipment.find(e => e.cat === 'arma' && !used.has(e.id) && norm(e.name) === norm(a.name)) ||
      c.equipment.find(e => e.cat === 'arma' && !used.has(e.id) && a.wpn && e.weapon === a.wpn);
    if (e) {
      a.item = e.id;
      used.add(e.id);
    }
  });
}
function linkGear(c) {
  if (c._gearLinked) return;
  c._gearLinked = true;
  c.equipment.forEach(e => {
    if (e.tool || e.gear) return;
    const n = norm(e.name);
    const tk = Object.keys(TOOLS).find(k => n === norm(TOOLS[k].n) || n.startsWith(norm(TOOLS[k].n)));
    if (tk) {
      e.tool = tk;
      return;
    }
    const gk = Object.keys(GEAR).find(
      k =>
        n === norm(GEAR[k].n) ||
        (k === 'rations' && /^racion/.test(n)) ||
        (k === 'torch' && /^antorcha/.test(n)) ||
        (k === 'waterskin' && /^odre/.test(n))
    );
    if (gk) e.gear = gk;
  });
}
const MASTERY_CLS = new Set(['barbarian', 'fighter', 'paladin', 'ranger', 'rogue']);
function wpnProf(c, W) {
  const t = norm(c.proficiencies.weapons || '');
  if (t.includes(norm(W.n))) return true;
  if (W.c === 's') return /sencill|marcial/.test(t);
  if (/marcial/.test(t)) {
    if (/sutil|ligera/.test(t) && !/sencillas y marciales$/.test(t))
      return (/sutil/.test(t) && W.p.includes('sutil')) || (/ligera/.test(t) && W.p.includes('ligera'));
    return true;
  }
  return false;
}
function wpnCalc(c, a) {
  const W = WEAPONS[a.wpn],
    str = M(c, 'str'),
    dex = M(c, 'dex'),
    mg = +a.magic || 0;
  const mod = W.p.includes('sutil') ? Math.max(str, dex) : W.r ? dex : str,
    prof = wpnProf(c, W);
  const arch = W.r && featHas(c, 'rangedAtk'),
    gwm = W.p.includes('pesada') && featHas(c, 'heavyPB');
  const dm = x => {
    const b = mod + mg + (gwm ? pb(c) : 0);
    return W.d === '1' ? `${Math.max(1, 1 + b)}` : `${x}${b ? ` ${b > 0 ? '+' : '−'} ${Math.abs(b)}` : ''}`;
  };
  const props = W.p
    .map(x => x)
    .concat(W.th ? [`arrojadiza (${W.th})`] : [])
    .concat(W.am ? [`munición (${W.am[1]})`] : [])
    .concat(W.v ? [`versátil (${W.v})`] : []);
  const notes = [
    props.join(', ').replace(/^./, m => m.toUpperCase()),
    a.mastery ? `Maestría: ${MASTERY[W.ms][0].toLowerCase()}` : '',
    prof ? '' : 'sin competencia',
    arch ? `${arch.n}: +${arch.rangedAtk} al ataque` : '',
    gwm ? `${gwm.n}: +${pb(c)} al daño` : '',
    !W.r && !W.p.includes('a dos manos') && featHas(c, 'duel') ? 'Duelo: +2 al daño si es tu única arma' : '',
    W.th && featHas(c, 'thrown') ? '+2 al daño si la lanzas' : '',
    W.p.includes('ligera') && featHas(c, 'twf') ? 'ataque extra (Ligera): suma tu modificador al daño' : '',
    !W.r && (W.p.includes('a dos manos') || W.v) && featHas(c, 'gwf')
      ? 'a dos manos: los 1 y 2 de daño cuentan como 3'
      : '',
  ]
    .filter(Boolean)
    .join(' · ');
  return {
    atk: mod + (prof ? pb(c) : 0) + mg + (arch ? arch.rangedAtk : 0),
    dmg: dm(W.d) + (W.v ? ` (${dm(W.v)} a dos manos)` : ''),
    type: W.t,
    notes,
    prof,
  };
}
function syncWeapons(c) {
  c.attacks.forEach(a => {
    if (a.wpn && WEAPONS[a.wpn])
      Object.assign(a, (({ atk, dmg, type, notes }) => ({ atk, dmg, type, notes }))(wpnCalc(c, a)));
  });
}
function linkWeapons(c) {
  if (c._wpnLinked) return;
  c._wpnLinked = true;
  c.attacks.forEach(a => {
    if (a.wpn) return;
    const k = Object.keys(WEAPONS).find(k => norm(WEAPONS[k].n) === norm(a.name));
    if (!k) return;
    const r = wpnCalc(c, { wpn: k });
    if (
      r.atk === +a.atk &&
      r.dmg.replace(/[\s−]/g, m => (m === '−' ? '-' : '')) === String(a.dmg).replace(/\s/g, '')
    ) {
      a.wpn = k;
      a.notes = r.notes;
      a.type = a.type || r.type;
    }
  });
}
const maxSlotL = c =>
  Math.max(c.pact.total > 0 ? c.pact.level : 0, ...c.slots.map((x, i) => (x.total > 0 ? i + 1 : 0)));
let SCR = null;
function scrollModal(i, eco) {
  const c = C(),
    e = c.equipment[i],
    d = SPBY[e.scroll];
  if (!d) return;
  const L = +d.l || 0,
    [dc, at] = SCROLL_STATS[L],
    onList = (d.c || []).includes(c.classKey),
    hard = L > 0 && L > maxSlotL(c);
  SCR = { i, eco };
  openModal(`<h2>${esc(e.name)}</h2><p><b>${esc(d.n)}</b> · ${L ? `nivel ${L}` : 'truco'} · ${esc(TIME[d.t] || d.t)}${d.k ? ' · concentración' : ''}</p>
    <p class="hint">Con el pergamino: CD de salvación <b>${dc}</b> y ataque de conjuro <b>${sgn(at)}</b>. No necesitas componentes materiales. Al lanzarlo, el pergamino se gasta.</p>
    ${
      !onList
        ? `<p class="hint warn">${esc(d.n)} no está en la lista de conjuros de tu clase, así que no puedes lanzarlo desde el pergamino (salvo que el máster diga otra cosa).</p>`
        : hard
          ? `<p class="hint warn">Es de un nivel mayor que los que puedes lanzar: haz una prueba de INT (Conocimiento Arcano) CD <b>${10 + L}</b>. Si la fallas, el pergamino se desmorona sin efecto.</p>`
          : ''
    }
    <details><summary>Qué hace</summary><p>${esc(d.de)}</p></details>
    <div class="btns">${hard && onList ? `<button class="b pri" data-act="scr-cast">La supero: lanzar</button><button class="b bad" data-act="scr-fail">La fallo</button>` : `<button class="b pri" data-act="scr-cast">${onList ? 'Lanzar' : 'Lanzarlo igualmente'}</button>`}<button class="b" data-act="close-modal">Cancelar</button></div>`);
}
const armorAuto = c => c.equipment.some(e => e.armor && ARMORS[e.armor]);
function acCalc(c) {
  const dex = M(c, 'dex'),
    eq = c.equipment.filter(e => e.armor && ARMORS[e.armor] && e.equipped);
  const body = eq.find(e => ARMORS[e.armor].t !== 's'),
    shield = eq.find(e => ARMORS[e.armor].t === 's');
  let base, src;
  if (body) {
    const A = ARMORS[body.armor],
      mg = +body.magic || 0,
      cap = featHas(c, 'mam') && c.abilities.dex >= 16 ? 3 : 2;
    base = A.ac + (A.t === 'l' ? dex : A.t === 'm' ? Math.min(dex, cap) : 0) + mg;
    src = `${body.name} ${A.ac}${A.t === 'l' ? ` + DES (${sgn(dex)})` : A.t === 'm' ? ` + DES (${sgn(Math.min(dex, cap))}, máx. +${cap})` : ''}${mg ? ` + ${mg} mágica` : ''}`;
  } else {
    const o = [[10 + dex, `Sin armadura: 10 + DES (${sgn(dex)})`]];
    if (c.classKey === 'barbarian') o.push([10 + dex + M(c, 'con'), 'Defensa sin armadura: 10 + DES + CON']);
    if (c.classKey === 'monk' && !shield)
      o.push([10 + dex + M(c, 'wis'), 'Defensa sin armadura: 10 + DES + SAB']);
    if (c.subclassKey === 'draconic')
      o.push([10 + dex + M(c, 'cha'), 'Resistencia dracónica: 10 + DES + CAR']);
    if (c.effects.some(e => norm(e.name).includes('armadura de mago')))
      o.push([13 + dex, 'Armadura de mago: 13 + DES']);
    o.sort((a, b) => b[0] - a[0]);
    [base, src] = o[0];
  }
  let ac = base;
  if (shield) {
    const mg = +shield.magic || 0;
    ac += 2 + mg;
    src += ` + escudo ${2 + mg}`;
  }
  const fd = body && featHas(c, 'acArmor');
  if (fd) {
    ac += fd.acArmor;
    src += ` + ${fd.n} ${fd.acArmor}`;
  }
  if (+c.acBonus) {
    ac += +c.acBonus;
    src += ` + otros ${+c.acBonus}`;
  }
  const mac = miAC(c);
  if (mac) {
    ac += mac;
    src += ` + objetos mágicos ${mac}`;
  }
  const warn = [];
  const prof = norm(c.proficiencies.armor || ''),
    has = k => /todas/.test(prof) || prof.includes(k);
  if (body) {
    const A = ARMORS[body.armor];
    if (!has({ l: 'liger', m: 'intermed', h: 'pesad' }[A.t]))
      warn.push(
        `No eres competente con armadura ${ARMOR_T[A.t].toLowerCase()}: desventaja en pruebas, salvaciones y ataques de FUE y DES, y no puedes lanzar conjuros.`
      );
    if (A.str && c.abilities.str < A.str) warn.push(`Necesitas FUE ${A.str}: tu velocidad baja 10 pies.`);
    if (A.st) warn.push('Desventaja en pruebas de DES (Sigilo).');
  }
  if (shield && !has('escud'))
    warn.push(
      'No eres competente con escudos: desventaja en pruebas, salvaciones y ataques de FUE y DES, y no puedes lanzar conjuros.'
    );
  return {
    ac,
    src,
    warn,
    slow: !!(body && ARMORS[body.armor].str && c.abilities.str < ARMORS[body.armor].str),
  };
}
const acOf = c => (armorAuto(c) ? acCalc(c).ac : (+c.ac || 0) + miAC(c));
function linkArmor(c) {
  if (c._armorLinked) return;
  c._armorLinked = true;
  if (armorAuto(c)) return;
  const cands = Object.entries(ARMORS).sort((a, b) => b[1].n.length - a[1].n.length),
    touched = [];
  let body = false;
  c.equipment.forEach(e => {
    if (e.cat !== 'armadura') return;
    const hit = cands.find(
      ([k, A]) => norm(e.name).includes(norm(A.n)) || (k === 'padded' && /acolchad/.test(norm(e.name)))
    );
    if (!hit) return;
    const isBody = hit[1].t !== 's';
    if (isBody && body) return;
    if (isBody) body = true;
    e.armor = hit[0];
    e.equipped = true;
    touched.push(e);
  });
  if (touched.length && acCalc(c).ac !== +c.ac)
    touched.forEach(e => {
      delete e.armor;
      delete e.equipped;
    });
}
function healBy(c, n) {
  const was = c.hp.current;
  c.hp.current = Math.min(c.hp.max, was + n);
  if (was <= 0 && c.hp.current > 0) {
    c.deathSaves = { success: 0, fail: 0 };
    c.conditions = c.conditions.filter(x => x !== 'Inconsciente');
  }
  return c.hp.current - was;
}
const diceRange = t => {
  const m = String(t).match(/(\d+)d(\d+)\s*\+\s*(\d+)/);
  return m ? [+m[1] + +m[3], +m[1] * +m[2] + +m[3]] : [0, 999];
};
let POT = null,
  NI = null;
function potModal(i, eco) {
  const c = C(),
    e = c.equipment[i],
    P = POTIONS[e.potion];
  POT = { i, eco };
  openModal(`<h2>${esc(e.name)}</h2><p>${esc(P.d)}</p><p class="hint">Beberla o dársela a otra criatura es una acción adicional. Te quedan ${e.qty}.</p>
    ${
      P.heal
        ? `<label class="f"><span>Tira ${P.heal} y escribe el total</span><input id="pot-roll" type="number" inputmode="numeric" min="1"></label>
      <div class="btns"><button class="b good" data-act="pot-heal">Beber y curarme</button><button class="b" data-act="pot-give">Dársela a otro</button><button class="b" data-act="close-modal">Cancelar</button></div>`
        : `${P.ask ? `<label class="f"><span>${esc(P.ask)}</span><input id="pot-ask" autocomplete="off"></label>` : ''}
      <div class="btns"><button class="b pri" data-act="pot-fx">Beber</button><button class="b" data-act="pot-give">Dársela a otro</button><button class="b" data-act="close-modal">Cancelar</button></div>`
    }`);
  const f = $('#pot-roll') || $('#pot-ask');
  if (f) f.focus();
}
function itemModal() {
  const x = NI,
    f = (l, h, w) => `<label class="f ${w || ''}"><span>${l}</span>${h}</label>`;
  const c = C(),
    W = x.wpn && WEAPONS[x.wpn],
    hasAmmo = W && W.am && c.equipment.find(e => e.ammoKind === W.am[0]);
  const wGroups = [
    ['s', 0, 'Sencillas cuerpo a cuerpo'],
    ['s', 1, 'Sencillas a distancia'],
    ['m', 0, 'Marciales cuerpo a cuerpo'],
    ['m', 1, 'Marciales a distancia'],
  ];
  const gearOpts = cat =>
    Object.entries(GEAR)
      .filter(([, g]) => g.cat === cat)
      .map(([k, g]) => `<option value="g:${k}" ${x.gr === 'g:' + k ? 'selected' : ''}>${esc(g.n)}</option>`)
      .join('');
  const TT = x.gr && x.gr.startsWith('t:') && TOOLS[x.gr.slice(2)],
    GG = x.gr && x.gr.startsWith('g:') && GEAR[x.gr.slice(2)];
  const gearDesc = TT
    ? `<p class="hint wide">${AB[TT.ab][2]} · ${TT.use.map(u => `${esc(u[0])} (CD ${u[1]})`).join(' · ')}${TT.craft ? `. Fabrica: ${esc(TT.craft)}` : ''}</p>`
    : GG
      ? `<p class="hint wide">${esc(GG.d)}</p>`
      : '';
  const isMap = x.cat === 'mapa';
  const extra = isMap
    ? `<div class="f wide"><span>Imagen del mapa (opcional)</span><div class="map-pick">${x.img ? `<img src="${esc(x.img)}" alt="Vista previa del mapa">` : ''}<label class="b sm">${x.img ? 'Cambiar imagen' : 'Añadir imagen'}<input type="file" id="ni-img" accept="image/*" hidden></label>${x.img ? '<button class="b sm bad" data-act="ni-img-del">Quitar</button>' : ''}</div></div>
      <p class="hint wide">Si el máster te da el dibujo o la foto del mapa, añádela y podrás abrirlo desde el botón de mapas de la mochila. Sin imagen, queda como un objeto más para rolear.</p>`
    : x.cat === 'herramienta'
      ? f(
          'Herramienta',
          `<select id="ni-gr" data-ni="1"><option value="">Otra</option><optgroup label="Herramientas de artesano">${Object.entries(
            TOOLS
          )
            .filter(([, t]) => t.g === 'a')
            .map(
              ([k, t]) => `<option value="t:${k}" ${x.gr === 't:' + k ? 'selected' : ''}>${esc(t.n)}</option>`
            )
            .join('')}</optgroup><optgroup label="Otras herramientas">${Object.entries(TOOLS)
            .filter(([, t]) => t.g === 'o')
            .map(
              ([k, t]) => `<option value="t:${k}" ${x.gr === 't:' + k ? 'selected' : ''}>${esc(t.n)}</option>`
            )
            .join('')}</optgroup><optgroup label="Equipo">${gearOpts('herramienta')}</optgroup></select>`,
          'wide'
        ) +
        (TT && TT.vars
          ? f(
              'Cuál',
              `<select id="ni-var" data-ni="1">${TT.vars.map(v => `<option ${x.var === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select>`,
              'wide'
            )
          : '') +
        gearDesc
      : x.cat === 'consumible' || x.cat === 'comida'
        ? f(
            x.cat === 'comida' ? 'Comida y bebida' : 'Objeto',
            `<select id="ni-gr" data-ni="1"><option value="">Otro</option>${gearOpts(x.cat)}</select>`,
            'wide'
          ) + gearDesc
        : x.cat === 'paquete'
          ? f(
              'Paquete',
              `<select id="ni-pack" data-ni="1">${Object.entries(PACKS)
                .map(
                  ([k, o]) => `<option value="${k}" ${x.pack === k ? 'selected' : ''}>${esc(o.n)}</option>`
                )
                .join('')}</select>`,
              'wide'
            ) +
            `<p class="hint wide">Se añadirá todo su contenido: ${PACKS[x.pack || 'explorer'].items.map(([k, q]) => `${GEAR[k] ? GEAR[k].n.replace(/ \(días\)/, '') : k}${q > 1 ? ' ×' + q : ''}`).join(', ')}.</p>`
          : x.cat === 'arma'
            ? f(
                'Arma',
                `<select id="ni-wpn" data-ni="1"><option value="">Otra (la añades a mano)</option>${wGroups
                  .map(
                    ([cc, r, lbl]) =>
                      `<optgroup label="${lbl}">${Object.entries(WEAPONS)
                        .filter(([, w]) => w.c === cc && !!w.r === !!r)
                        .map(
                          ([k, w]) =>
                            `<option value="${k}" ${x.wpn === k ? 'selected' : ''}>${esc(w.n)} (${w.d}${w.d === '1' ? '' : ''} ${w.t})</option>`
                        )
                        .join('')}</optgroup>`
                  )
                  .join('')}</select>`,
                'wide'
              ) +
              (W
                ? f(
                    'Bonificador mágico',
                    `<select id="ni-mag" data-ni="1">${[0, 1, 2, 3].map(n => `<option value="${n}" ${+x.mag === n ? 'selected' : ''}>${n ? '+' + n : 'Ninguno'}</option>`).join('')}</select>`
                  ) +
                  `<p class="hint wide">${esc(wpnCalc(c, { wpn: x.wpn, magic: x.mag, mastery: x.ms }).notes)}. Maestría: <b>${MASTERY[W.ms][0]}</b> — ${esc(MASTERY[W.ms][1])}</p>` +
                  `<label class="chk wide"><input type="checkbox" id="ni-atk" ${x.atk ? 'checked' : ''}> Equipada: sale en Combate para atacar con ella (bonificador y daño calculados)</label>` +
                  (MASTERY_CLS.has(c.classKey)
                    ? `<label class="chk wide"><input type="checkbox" id="ni-ms" ${x.ms ? 'checked' : ''}> Uso su maestría (${MASTERY[W.ms][0]})</label>`
                    : '') +
                  (W.am
                    ? hasAmmo
                      ? `<p class="hint wide">Se enlazará con tus ${esc(hasAmmo.name)} (quedan ${hasAmmo.qty}).</p>`
                      : `<label class="chk wide"><input type="checkbox" id="ni-am" ${x.am ? 'checked' : ''}> Añadir también ${AMMO[W.am[0]][1]} ${AMMO[W.am[0]][0].toLowerCase()}</label>`
                    : '')
                : '')
            : x.cat === 'municion'
              ? f(
                  'Munición',
                  `<select id="ni-ak" data-ni="1"><option value="">Otra</option>${Object.entries(AMMO)
                    .map(([k, a]) => `<option value="${k}" ${x.ak === k ? 'selected' : ''}>${a[0]}</option>`)
                    .join('')}</select>`,
                  'wide'
                )
              : x.cat === 'pergamino'
                ? f(
                    'Conjuro del pergamino',
                    `<input id="ni-spl" list="ni-spl-list" value="${esc(x.spl || '')}" placeholder="Escribe para buscar…" autocomplete="off" data-ni-in="1"><datalist id="ni-spl-list">${SP.map(d => `<option value="${esc(d.n)}">${d.l ? `Nivel ${d.l}` : 'Truco'}</option>`).join('')}</datalist>`,
                    'wide'
                  )
                : x.cat === 'pocion'
                  ? f(
                      'Tipo de poción',
                      `<select id="ni-pot" data-ni="1">${Object.entries(POTIONS)
                        .map(
                          ([k, o]) =>
                            `<option value="${k}" ${x.pot === k ? 'selected' : ''}>${esc(o.n)}${o.heal ? ` (${o.heal})` : ''}</option>`
                        )
                        .join('')}</select>`,
                      'wide'
                    ) +
                    (POTIONS[x.pot] && POTIONS[x.pot].d
                      ? `<p class="hint wide">${esc(POTIONS[x.pot].d)}</p>`
                      : '')
                  : x.cat === 'armadura'
                    ? f(
                        'Armadura o escudo',
                        `<select id="ni-arm" data-ni="1"><option value="">Otra (no cambia la CA)</option>${[
                          'l',
                          'm',
                          'h',
                          's',
                        ]
                          .map(
                            t =>
                              `<optgroup label="${ARMOR_T[t]}">${Object.entries(ARMORS)
                                .filter(([, a]) => a.t === t)
                                .map(
                                  ([k, a]) =>
                                    `<option value="${k}" ${x.arm === k ? 'selected' : ''}>${esc(a.n)} (${a.t === 's' ? '+2' : a.ac + (a.t === 'l' ? ' + DES' : a.t === 'm' ? ' + DES máx. 2' : '')})</option>`
                                )
                                .join('')}</optgroup>`
                          )
                          .join('')}</select>`,
                        'wide'
                      ) +
                      (x.arm
                        ? f(
                            'Bonificador mágico',
                            `<select id="ni-mag" data-ni="1">${[0, 1, 2, 3].map(n => `<option value="${n}" ${+x.mag === n ? 'selected' : ''}>${n ? '+' + n : 'Ninguno'}</option>`).join('')}</select>`
                          ) +
                          `<label class="chk"><input type="checkbox" id="ni-eq" ${x.eq ? 'checked' : ''}> La llevo puesta</label>`
                        : '')
                    : '';
  const FROM = {
    arma: 'Añadir arma',
    armadura: 'Añadir armadura o escudo',
    herramienta: 'Añadir herramienta',
  };
  openModal(`<h2>${FROM[x.from] || 'Añadir objeto'}</h2><div class="grid">
      ${x.from ? '' : f('Tipo', `<select id="ni-cat" data-ni="1">${[...CATS.filter(([k]) => !['arma', 'armadura', 'herramienta'].includes(k)), ['paquete', 'Paquete de equipo (añade su contenido)']].map(([k, n]) => `<option value="${k}" ${x.cat === k ? 'selected' : ''}>${n}</option>`).join('')}</select>`)}
      ${isMap ? '' : f('Cantidad', `<input id="ni-qty" type="number" inputmode="numeric" min="0" value="${esc(x.qty)}">`)}
      ${isMap ? f('Zona que mapea', `<input id="ni-name" value="${esc(x.name)}" placeholder="Bosque de Neverwinter, la cripta…" autocomplete="off">`, 'wide') + `<p class="hint wide">En la mochila aparecerá como «<span id="ni-mapname">${esc(mapName(mapZone({ name: x.name }) || 'zona'))}</span>».</p>` : ''}
      ${extra}
      ${isMap ? '' : f('Nombre', `<input id="ni-name" value="${esc(x.name)}" placeholder="Flechas, ración de viaje, cuerda…" autocomplete="off">`, 'wide')}
      ${x.cat === 'paquete' || isMap ? '' : `<label class="chk wide"><input type="checkbox" id="ni-mi" data-ni="1" ${x.mi ? 'checked' : ''}> Es un objeto mágico</label>`}
      ${
        x.mi
          ? `<div class="mibox wide">${f(
              'Objeto',
              `<select id="ni-mip" data-ni="1">${Object.entries(MAGIC)
                .map(([k, o]) => `<option value="${k}" ${x.mip === k ? 'selected' : ''}>${esc(o.n)}</option>`)
                .join('')}</select>`
            )}
        <label class="chk"><input type="checkbox" id="ni-matt" ${x.mi.att ? 'checked' : ''}> Requiere sintonización</label>
        <div class="effdur3">${f('+ CA', `<input id="ni-mac" type="number" inputmode="numeric" value="${esc(x.mi.ac || 0)}">`)}${f('+ Salvaciones', `<input id="ni-msv" type="number" inputmode="numeric" value="${esc(x.mi.sv || 0)}">`)}${f('Cargas', `<input id="ni-mch" type="number" inputmode="numeric" min="0" value="${esc(x.mi.ch || 0)}">`)}</div>
        ${f('Recupera al amanecer', `<input id="ni-mrec" value="${esc(x.mi.rec || '')}" placeholder="1d6 + 1, «todas» o vacío">`)}
        ${f('Qué hace', `<textarea id="ni-md" rows="2">${esc(x.mi.d || '')}</textarea>`)}</div>`
          : ''
      }
      ${f('Notas', `<input id="ni-notes" value="${esc(x.notes)}" placeholder="Opcional">`, 'wide')}</div>
    <div class="btns"><button class="b pri" data-act="item-add">Añadir</button><button class="b" data-act="item-cancel">Cancelar</button></div>`);
}
function niCollect() {
  const g = id => {
    const e = $('#' + id);
    return e ? (e.type === 'checkbox' ? e.checked : e.value) : undefined;
  };
  const mi = g('ni-mi');
  if (mi !== undefined) {
    if (mi && !NI.mi) {
      NI.mi = { att: 0, ac: 0, sv: 0, ch: 0, rec: '', d: '' };
      NI.mip = 'other';
    }
    if (!mi) NI.mi = null;
  }
  if (NI.mi) {
    const mp = g('ni-mip');
    if (mp !== undefined) NI.mip = mp;
    const a = g('ni-matt');
    if (a !== undefined) NI.mi.att = a ? 1 : 0;
    [
      ['mac', 'ac'],
      ['msv', 'sv'],
      ['mch', 'ch'],
    ].forEach(([id, k]) => {
      const v = g('ni-' + id);
      if (v !== undefined) NI.mi[k] = +v || 0;
    });
    const r = g('ni-mrec');
    if (r !== undefined) NI.mi.rec = r.trim();
    const d = g('ni-md');
    if (d !== undefined) NI.mi.d = d;
  }
  ['name', 'qty', 'cat', 'notes', 'pot', 'arm', 'mag', 'wpn', 'ak', 'spl', 'gr', 'var', 'pack'].forEach(k => {
    const v = g('ni-' + k);
    if (v !== undefined) NI[k] = v;
  });
  ['eq', 'atk', 'ms', 'am'].forEach(k => {
    const v = g('ni-' + k);
    if (v !== undefined) NI[k] = v;
  });
}
const splFind = v => {
  const k = norm(String(v || '').trim());
  return k ? SP.find(d => norm(d.n) === k || norm(d.en || '') === k) : null;
};
function niAutoName() {
  const sd = splFind(NI.spl),
    TT = NI.gr && NI.gr.startsWith('t:') && TOOLS[NI.gr.slice(2)],
    GG = NI.gr && NI.gr.startsWith('g:') && GEAR[NI.gr.slice(2)];
  const base = TT
    ? TT.vars
      ? NI.var || TT.vars[0]
      : TT.n
    : GG
      ? GG.n
      : NI.cat === 'arma' && NI.wpn
        ? WEAPONS[NI.wpn].n + (+NI.mag ? ` +${NI.mag}` : '')
        : NI.cat === 'municion' && NI.ak
          ? AMMO[NI.ak][0]
          : NI.cat === 'pergamino' && sd
            ? `Pergamino de ${sd.n.toLowerCase()}`
            : NI.cat === 'pocion' && NI.pot && NI.pot !== 'other'
              ? POTIONS[NI.pot].n
              : NI.cat === 'armadura' && NI.arm
                ? ARMORS[NI.arm].n + (+NI.mag ? ` +${NI.mag}` : '')
                : '';
  if (!NI.name || NI.name === NI.auto) NI.name = base;
  NI.auto = base;
}
/* Iconos de las categorías de la mochila */
const CAT_ICON = {
  arma: '<path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2"/>',
  armadura: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
  municion: '<path d="M19 5 5 19M19 5h-6M19 5v6M5 19H2M5 19v3M8 16H5M8 16v3"/>',
  pocion: '<path d="M10 2v7.5L4.5 19A2 2 0 0 0 6.3 22h11.4a2 2 0 0 0 1.8-3L14 9.5V2M8.5 2h7M7 16h10"/>',
  pergamino:
    '<path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4M19 17V5a2 2 0 0 0-2-2H4"/>',
  comida: '<path d="M12 7c-2-2-6-1.5-6 3 0 4 3 10 6 9 3 1 6-5 6-9 0-4.5-4-5-6-3ZM12 7c0-2 1-3 3-4"/>',
  consumible:
    '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5Z"/>',
  herramienta:
    '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9l-3.8 3.8Z"/>',
  mapa: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2ZM9 4v14M15 6v14"/>',
  tesoro: '<path d="M6 3h12l4 6-10 13L2 9ZM11 3 8 9l4 13 4-13-3-6M2 9h20"/>',
  otro: '<path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7ZM3.3 7 12 12l8.7-5M12 22V12"/>',
};
const catIcon = k =>
  `<svg class="cat-ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${CAT_ICON[k] || CAT_ICON.otro}</svg>`;
/* Resumen de una línea bajo el nombre del objeto en la lista */
function itemSub(c, e) {
  const p = [];
  if (e.weapon && WEAPONS[e.weapon]) p.push(`${WEAPONS[e.weapon].d} ${WEAPONS[e.weapon].t}`);
  if (e.armor && ARMORS[e.armor]) {
    const R = ARMORS[e.armor];
    p.push(
      R.t === 's'
        ? '+2 a la CA'
        : `CA ${R.ac}${R.t === 'l' ? ' + DES' : R.t === 'm' ? ' + DES (máx. 2)' : ''}`
    );
    if (e.equipped) p.push(R.t === 's' ? 'embrazado' : 'puesta');
  }
  if (+e.magic) p.push(`+${e.magic} mágica`);
  if (e.mi) {
    if (e.mi.att) p.push(e.mi.on ? 'sintonizado' : 'sin sintonizar');
    if (+e.mi.ch) p.push(`${e.mi.ch - (+e.mi.used || 0)}/${e.mi.ch} cargas`);
  }
  if (e.potion && POTIONS[e.potion] && POTIONS[e.potion].heal) p.push(`cura ${POTIONS[e.potion].heal}`);
  if (e.scroll && SPBY[e.scroll]) p.push(SPBY[e.scroll].l ? `nivel ${SPBY[e.scroll].l}` : 'truco');
  if (e.tool && TOOLS[e.tool]) p.push(`tu bonificador ${sgn(toolBonus(c, TOOLS[e.tool], e.tvar).b)}`);
  if (e.cat === 'mapa') p.push('sin imagen');
  if (e.notes) p.push(e.notes);
  return p.map(esc).join(' · ');
}
/* Detalles y botones de uso de un objeto (en su ventana) */
function itemInfo(c, e, i) {
  return `
      ${
        e.tool && TOOLS[e.tool]
          ? (() => {
              const T = TOOLS[e.tool],
                { b, pr } = toolBonus(c, T, e.tvar);
              return `<div class="meta">${AB[T.ab][2]} · tu bonificador <b>${sgn(b)}</b>${pr ? ' (competente)' : ''} · ${T.use.map(u => `${esc(u[0])} CD ${u[1]}`).join(' · ')}</div>`;
            })()
          : ''
      }
      ${e.gear && GEAR[e.gear] ? `<div class="meta">${esc(GEAR[e.gear].d)}${GEAR[e.gear].unit ? ` Quedan ${e.qty} ${GEAR[e.gear].unit}.` : ''}</div>${GEAR[e.gear].act ? `<div class="btns"><button class="b sm" data-act="gear" data-i="${i}" ${GEAR[e.gear].keep || e.qty > 0 ? '' : 'disabled'}>${GEAR[e.gear].act === 'lit' ? 'Encender' : 'Usar'}</button></div>` : ''}` : ''}
      ${
        e.mi
          ? `<div class="meta">✦ ${[e.mi.d, !e.mi.d && +e.mi.ac ? `+${e.mi.ac} CA${e.mi.noarm ? ' (sin armadura ni escudo)' : ''}` : '', !e.mi.d && +e.mi.sv ? `+${e.mi.sv} salvaciones` : ''].filter(Boolean).map(esc).join(' · ')}${e.mi.att && !e.mi.on ? ' <b>(sin sintonizar: no funciona)</b>' : ''}</div>
        <div class="btns">${e.mi.att ? `<button class="chip ${e.mi.on ? 'on' : ''}" data-act="mi-att" data-i="${i}" aria-pressed="${!!e.mi.on}">${e.mi.on ? 'Sintonizado' : 'Sintonizar'}</button>` : ''}
        ${+e.mi.ch ? `<span class="counter"><button class="b sq" data-act="mi-ch" data-i="${i}" data-d="1" aria-label="Gastar una carga">−</button><b style="min-width:3.2rem;text-align:center">${e.mi.ch - (+e.mi.used || 0)}/${e.mi.ch}</b><button class="b sq" data-act="mi-ch" data-i="${i}" data-d="-1" aria-label="Recuperar una carga">+</button></span><small class="muted">cargas${e.mi.rec ? ` · recupera ${esc(e.mi.rec)} al amanecer` : ''}</small>` : ''}</div>`
          : ''
      }
      ${e.weapon && WEAPONS[e.weapon] ? `<div class="meta">${WEAPONS[e.weapon].d} ${WEAPONS[e.weapon].t}${+e.magic ? ` · +${e.magic} mágica` : ''} · ${WEAPONS[e.weapon].c === 's' ? 'sencilla' : 'marcial'} · maestría: ${MASTERY[WEAPONS[e.weapon].ms][0].toLowerCase()}</div>` : ''}
      ${
        e.cat === 'arma' && (c.attacks.some(a => a.item === e.id) || (e.weapon && WEAPONS[e.weapon]))
          ? `<div class="btns"><button class="chip ${wpnOn(c, e) ? 'on' : ''}" data-act="wpn-eq" data-id="${e.id}" aria-pressed="${wpnOn(c, e)}">${wpnOn(c, e) ? 'Equipada' : 'Sin equipar'}</button><small class="muted">${wpnOn(c, e) ? 'Sale en Combate para atacar con ella.' : 'No sale en Combate hasta que la equipes.'}</small></div>`
          : ''
      }
      ${e.scroll && SPBY[e.scroll] ? `<div class="meta">${SPBY[e.scroll].l ? `Conjuro de nivel ${SPBY[e.scroll].l}` : 'Truco'} · lánzalo desde Magia (Partida) o desde Combate</div>` : ''}
      ${
        e.armor && ARMORS[e.armor]
          ? `<div class="meta">${ARMOR_T[ARMORS[e.armor].t]} · ${ARMORS[e.armor].t === 's' ? '+2 a la CA' : `CA ${ARMORS[e.armor].ac}${ARMORS[e.armor].t === 'l' ? ' + DES' : ARMORS[e.armor].t === 'm' ? ' + DES (máx. 2)' : ''}`}${+e.magic ? ` · +${e.magic} mágica` : ''}${ARMORS[e.armor].str ? ` · FUE ${ARMORS[e.armor].str}` : ''}${ARMORS[e.armor].st ? ' · desventaja en Sigilo' : ''}</div>
        <div class="btns"><button class="chip ${e.equipped ? 'on' : ''}" data-act="eq" data-i="${i}" aria-pressed="${!!e.equipped}">${e.equipped ? (ARMORS[e.armor].t === 's' ? 'Embrazado' : 'Puesta') : 'Ponérmela'}</button></div>`
          : ''
      }
      ${e.potion && POTIONS[e.potion] && e.potion !== 'other' ? `<div class="meta">${esc(POTIONS[e.potion].d)}</div><div class="btns"><button class="b sm good" data-act="pot" data-i="${i}" ${e.qty > 0 ? '' : 'disabled'}>Beber</button></div>` : ''}
      ${
        inBelt(e) && e.cat !== 'mapa'
          ? `<div class="btns"><span class="counter"><button class="b sq" data-act="qty" data-i="${i}" data-d="-1" aria-label="Quitar una">−</button><b style="min-width:2rem;text-align:center">${e.qty}</b><button class="b sq" data-act="qty" data-i="${i}" data-d="1" aria-label="Sumar una">+</button></span>${e.gear === 'rations' ? `<button class="b sm" data-act="give1" data-i="${i}" ${e.qty > 0 ? '' : 'disabled'}>Dar una</button>` : ''}</div>
        ${e.gear === 'rations' ? '<p class="meta">Al hacer un descanso largo se gasta una sola. Para darle una a un compañero, pulsa «Dar una».</p>' : e.cat === 'municion' ? '<p class="meta">Al disparar se descuenta sola desde Combate. Las que recuperes o te den, súmalas con +.</p>' : ''}`
          : ''
      }
      ${e.scroll && SPBY[e.scroll] && e.qty > 0 ? `<div class="btns"><button class="b sm" data-act="scroll" data-i="${i}">Lanzar el conjuro</button></div>` : ''}`;
}
/* Ventana de un objeto: detalles, usar, editar y borrar */
function itemSheet(id) {
  const c = C(),
    i = c.equipment.findIndex(x => x.id === id),
    e = c.equipment[i];
  if (!e) return openInv();
  if (e.cat === 'mapa') return e.img ? (openInv(), mapView(id)) : mapDetail(id);
  const f = (l, h, w) => `<label class="f ${w || ''}"><span>${l}</span>${h}</label>`;
  const info = itemInfo(c, e, i).trim(),
    back = inCard(e) ? 'close-modal' : 'inv';
  openModal(`<div class="wz-head"><h2 class="it-title">${catIcon(e.cat || 'otro')}<span>${esc(e.name)}</span></h2><button class="b sm" data-act="${back}">Volver</button></div>
    <div id="it-acts" data-id="${e.id}" class="it-acts"${info ? '' : ' hidden'}>${info}</div>
    <div class="grid">
      ${f('Nombre', `<input id="it-name" value="${esc(e.name)}" autocomplete="off">`, 'wide')}
      ${f('Cantidad', `<input id="it-qty" type="number" inputmode="numeric" min="0" value="${esc(e.qty)}">`)}
      ${f(
        'Tipo',
        `<select id="it-cat">${CATS.filter(([k]) => k !== 'mapa')
          .map(([k, n]) => `<option value="${k}" ${(e.cat || 'otro') === k ? 'selected' : ''}>${n}</option>`)
          .join('')}</select>`
      )}
      ${f('Notas', `<textarea id="it-notes" rows="2" placeholder="Opcional">${esc(e.notes || '')}</textarea>`, 'wide')}
    </div>
    <div class="btns"><button class="b pri" data-act="item-save" data-id="${e.id}">Guardar</button><button class="b" data-act="${back}">Cancelar</button><button class="b bad" data-act="item-delask" data-id="${e.id}" style="margin-left:auto">Borrar</button></div>`);
}
/* Categorías plegadas de la mochila (se recuerdan en este dispositivo) */
const INV_SHUT = 'fichas-inv-plegadas';
function invShut() {
  try {
    return JSON.parse(localStorage.getItem(INV_SHUT)) || {};
  } catch (e) {
    return {};
  }
}
function invShutToggle(k) {
  const o = invShut();
  if (o[k]) delete o[k];
  else o[k] = 1;
  try {
    localStorage.setItem(INV_SHUT, JSON.stringify(o));
  } catch (e) {}
}
function invHTML(c) {
  const shut = invShut();
  const groups = CATS.map(([k, n]) => [
    k,
    n,
    c.equipment.map((e, i) => [e, i]).filter(([e]) => (e.cat || 'otro') === k && !inBelt(e) && !inCard(e)),
  ]).filter(g => g[2].length);
  const items = groups.length
    ? groups
        .map(
          ([k, n, list]) =>
            `<div class="cat-h"><h3><button class="cat-tog" data-act="cat-tog" data-k="${k}" aria-expanded="${!shut[k]}">${catIcon(k)}${n} <span class="cat-n">(${list.length})</span><span class="cat-arr" aria-hidden="true">▾</span></button></h3></div>${
              shut[k]
                ? ''
                : `<div class="list">${list
                    .map(([e, i]) => {
                      const sub = itemSub(c, e),
                        qty = USABLE.has(e.cat)
                          ? `<span class="counter"><button class="b sq" data-act="qty" data-i="${i}" data-d="-1" aria-label="Quitar uno de ${esc(e.name)}">−</button><b style="min-width:2rem;text-align:center">${e.qty}</b><button class="b sq" data-act="qty" data-i="${i}" data-d="1" aria-label="Añadir uno de ${esc(e.name)}">+</button></span>`
                          : e.cat !== 'mapa' && +e.qty !== 1
                            ? `<span class="it-qty">×${e.qty}</span>`
                            : '';
                      return `<div class="it it-row${+e.qty === 0 && e.cat !== 'mapa' ? ' zero' : ''}"><button class="it-main" data-act="item-open" data-id="${e.id}"><span class="it-name">${esc(e.name)}</span>${sub ? `<span class="it-sub">${sub}</span>` : ''}</button>${qty}<span class="it-chev" aria-hidden="true">›</span></div>`;
                    })
                    .join('')}</div>`
            }`
        )
        .join('')
    : c.equipment.some(inBelt)
      ? ''
      : '<p class="empty">Sin objetos todavía.</p>';
  const att = attuned(c),
    anyAtt = c.equipment.some(e => e.mi && e.mi.att);
  return `<div class="btns" style="margin-bottom:.4rem"><button class="b sm pri" data-act="item-new">Añadir objeto</button>${anyAtt ? `<span class="badge" style="${att > 3 ? 'color:var(--bad)' : ''}">Sintonización ${att}/3</span>` : ''}</div>${items}
    <p class="hint" style="margin-top:.6rem">Toca un objeto para ver qué hace, usarlo, cambiarle el nombre o borrarlo. Las armas, armaduras y herramientas están en la pestaña Partida.${c.equipment.some(inBelt) ? ' Los mapas, las pociones, el kit de sanador, las raciones y la munición están en el cinturón de abajo.' : ''}</p>${beltHTML(c)}`;
}
function refreshInv() {
  const b = $('#inv-body');
  if (b) b.innerHTML = invHTML(C());
  const t = $('#it-acts');
  if (t) {
    const c = C(),
      i = c.equipment.findIndex(x => x.id === t.dataset.id);
    if (i < 0) return openInv();
    t.innerHTML = itemInfo(c, c.equipment[i], i);
    t.hidden = !t.innerHTML.trim();
    const q = $('#it-qty');
    if (q) q.value = c.equipment[i].qty;
  }
}
function openInv() {
  openModal(
    `<div class="wz-head"><h2>Objetos</h2><button class="b sm" data-act="close-modal">Hecho</button></div><div id="inv-body">${invHTML(C())}</div>`,
    true
  );
  tipMaybe('inv');
}
function viewPj(c) {
  return `<div class="pj">${viewStory(c)}</div>`;
}
function pay(c, amt, coin) {
  let need = amt * COINV[coin];
  if (need > totalCp(c)) return false;
  const cs = c.coins;
  // 1) la misma moneda; 2) monedas menores (de mayor a menor); 3) romper monedas mayores
  const take = k => {
    const v = COINV[k];
    const n = Math.min(cs[k], Math.floor(need / v));
    cs[k] -= n;
    need -= n * v;
  };
  take(coin);
  for (const [k, , v] of COINS) if (v < COINV[coin] && need > 0) take(k);
  for (const [k, , v] of [...COINS].reverse())
    if (v > COINV[coin] && need > 0 && cs[k] > 0) {
      const n = Math.min(cs[k], Math.ceil(need / v));
      cs[k] -= n;
      let change = n * v - need;
      need = 0;
      for (const [k2, , v2] of COINS)
        if (v2 <= COINV[coin] && change > 0) {
          const m = Math.floor(change / v2);
          cs[k2] += m;
          change -= m * v2;
        }
    }
  if (need > 0) {
    for (const [k, , v] of COINS)
      if (need > 0 && cs[k] > 0) {
        const n = Math.min(cs[k], Math.ceil(need / v));
        cs[k] -= n;
        let ch = n * v - need;
        need = 0;
        for (const [k2, , v2] of COINS)
          if (v2 < v && ch > 0) {
            const m = Math.floor(ch / v2);
            cs[k2] += m;
            ch -= m * v2;
          }
      }
  }
  return true;
}
