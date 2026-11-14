/* Acciones — Modo máster (jugadores, combate, QR) y compartir con el máster. */
'use strict';

let mStartForce = false; // «Empezar igualmente» aunque falten iniciativas
Object.assign(A, {
  'master-on': () => {
    MST.on = true;
    masterSave();
    closeModal();
    render();
    scrollTo(0, 0);
    toast(
      '<div class="t-label">Modo máster</div><div class="t-parts">Para volver a tus fichas: ⚙ Ajustes → Modo jugador.</div>'
    );
  },
  'master-off': () => {
    MST.on = false;
    masterSave();
    closeModal();
    render();
    scrollTo(0, 0);
  },
  'camp-open': openCamps,
  'camp-use': el => {
    campSync();
    campUse(el.dataset.id);
    masterSave();
    closeModal();
    render();
    scrollTo(0, 0);
    toast(`<div class="t-label">Campaña</div><div class="t-big">${esc(campOf(MST.cur).n)}</div>`);
  },
  'camp-add': () => {
    const n = $('#camp-n').value.trim();
    if (!n) return $('#camp-n').focus();
    campSync();
    const k = campNew(n);
    MST.camps.push(k);
    campUse(k.id);
    masterSave();
    closeModal();
    render();
    scrollTo(0, 0);
    toast(
      `<div class="t-label">Campaña creada</div><div class="t-big">${esc(n)}</div><div class="t-parts">Añade a sus jugadores con «+ Jugador».</div>`
    );
  },
  'camp-ren': el => {
    const k = campOf(el.dataset.id);
    if (!k) return;
    openModal(`<h2>Renombrar campaña</h2><label class="f"><span>Nombre</span><input id="camp-rn" value="${esc(k.n)}" autocomplete="off"></label>
      <div class="btns"><button class="b pri" data-act="camp-ren-ok" data-id="${k.id}">Guardar</button><button class="b" data-act="camp-open">Volver</button></div>`);
    setTimeout(() => $('#camp-rn') && $('#camp-rn').select(), 0);
  },
  'camp-ren-ok': el => {
    const k = campOf(el.dataset.id),
      n = $('#camp-rn').value.trim();
    if (!k || !n) return $('#camp-rn').focus();
    k.n = n;
    masterSave();
    render();
    openCamps();
  },
  'camp-del': el => {
    const k = campOf(el.dataset.id);
    if (!k) return;
    openModal(`<h2>¿Borrar «${esc(k.n)}»?</h2><p class="hint">Se borran de este dispositivo sus jugadores, sus tiendas y su combate. No se puede deshacer.</p>
      <div class="btns"><button class="b bad" data-act="camp-del-ok" data-id="${k.id}">Borrar</button><button class="b" data-act="camp-open">Cancelar</button></div>`);
  },
  'camp-del-ok': el => {
    const id = el.dataset.id;
    if (MST.camps.length < 2) return;
    campSync();
    MST.camps = MST.camps.filter(x => x.id !== id);
    if (MST.cur === id) campUse(MST.camps[0].id);
    masterSave();
    render();
    openCamps();
  },
  'm-tab': el => {
    MST.tab = el.dataset.t;
    masterSave();
    render();
    scrollTo(0, 0);
  },
  'm-add': () => {
    scanStop();
    openAddPlayer();
  },
  'm-scan': openScan,
  'm-paste': () => {
    const x = sheetParse($('#m-code').value);
    const h = !x && qrKind($('#m-code').value);
    if (h) {
      closeModal();
      qrRun(h);
      return;
    }
    if (!x) {
      toast(
        '<div class="t-parts">Ese código no es válido. Pídele al jugador que lo copie de nuevo (⚙ Ajustes → Compartir con el máster).</div>'
      );
      return;
    }
    const nw = masterAddPlayer(x);
    MST.tab = x.id;
    masterSave();
    closeModal();
    render();
    toast(
      `<div class="t-label">${nw ? 'Jugador añadido' : 'Jugador actualizado'}</div><div class="t-big">${esc(x.n)}</div>`
    );
  },
  'm-hash-ok': () => {
    const x = MHASH;
    MHASH = null;
    if (!x) return closeModal();
    MST.on = true;
    masterAddPlayer(x);
    MST.tab = x.id;
    masterSave();
    closeModal();
    render();
    toast(
      `<div class="t-label">Jugador añadido</div><div class="t-big">${esc(x.n)}</div><div class="t-parts">Para volver a tus fichas: ⚙ Ajustes → Modo jugador.</div>`
    );
  },
  'm-del': el => {
    const p = MST.players.find(x => x.id === el.dataset.id);
    if (!p) return;
    openModal(`<h2>¿Quitar a ${esc(p.n)}?</h2><p class="hint">Se quita de tu mesa y del combate. Puedes volver a añadirlo con su QR.</p>
      <div class="btns"><button class="b bad" data-act="m-del-ok" data-id="${esc(p.id)}">Quitar</button><button class="b" data-act="close-modal">Cancelar</button></div>`);
  },
  'm-del-ok': el => {
    const id = el.dataset.id,
      F = MST.fight;
    MST.players = MST.players.filter(x => x.id !== id);
    const gone = F.list.filter(f => f.pid === id || f.owner === id).map(f => f.id);
    /* Su iniciativa, por si vuelve a la mesa en este combate */
    const me = F.list.find(f => f.pid === id);
    if (me && me.init !== '') F.keep = Object.assign({}, F.keep, { [id]: me.init });
    /* le tocaba a él: el turno pasa al siguiente en pie, como con «Siguiente turno» */
    if (gone.includes(F.cur)) F.cur = fightPass(F.cur, gone);
    F.list = F.list.filter(f => !gone.includes(f.id));
    MST.tab = 'combat';
    masterSave();
    closeModal();
    render();
  },
  'm-pjs': () => {
    const F = MST.fight,
      keep = F.keep || {};
    MST.players
      .filter(p => !F.list.some(f => f.pid === p.id))
      .forEach(p =>
        F.list.push({ id: uid(), kind: 'pj', pid: p.id, name: p.n, init: keep[p.id] ?? '', ac: p.ac })
      );
    /* Y sus criaturas (familiar, invocaciones…): tiran su propia iniciativa */
    MST.players.forEach(p =>
      (p.crs || [])
        .filter(x => !F.list.some(f => f.crid === x.id))
        .forEach(x =>
          F.list.push({
            id: uid(),
            kind: 'cr',
            crid: x.id,
            owner: p.n,
            pid0: p.id,
            name: x.n,
            init: '',
            ac: x.ac || '',
            hp: x.hp ?? '',
            hpMax: x.hp ?? '',
            ib: x.s ? x.s[1] : '',
            ...(x.mon && bestGet(x.mon) ? { mon: x.mon } : {}),
          })
        )
    );
    masterSave();
    render();
  },
  'm-foe': () => {
    MFOE = mfoeNew();
    openAddFoe();
  },
  'm-foe-back': openAddFoe,
  'm-foe-pick': el => mfoePick(el.dataset.id),
  'm-foe-see': el => {
    mfoeCollect();
    openBest(el.dataset.id, true);
  },
  'm-mon': el => openBest(el.dataset.id),
  'm-foe-add': () => {
    mfoeCollect();
    const x = MFOE || mfoeNew(),
      b = x.id && bestGet(x.id),
      name = x.name || (b ? b.n : 'NPC'),
      n = clamp(parseInt(x.n) || 1, 1, 20),
      ini = x.init,
      ac = x.ac,
      hp = x.hp;
    /* Numeración: sigue por el mayor número que ya haya con ese nombre (y numera al que estaba solo) */
    const L0 = MST.fight.list,
      re = new RegExp('^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?: (\\d+))?$'),
      same = L0.filter(f => re.test(f.name));
    let top = same.reduce((t, f) => Math.max(t, +(re.exec(f.name)[1] || 0)), 0);
    const solo = same.find(f => f.name === name);
    if (solo) solo.name = `${name} ${++top}`;
    const numbered = n > 1 || same.length > 0;
    /* Contadores de los legendarios y de las recargas */
    const lr = b && (b.tr || []).map(t => /^Resistencia legendaria \((\d+)/.exec(t[0])).find(Boolean),
      rc = b && [...(b.ex || []), ...(b.at || [])].find(x => /recarga/i.test(x[0]));
    const started = fightOn();
    for (let i = 1; i <= n; i++)
      L0.push({
        id: uid(),
        kind: 'npc',
        name: numbered ? `${name} ${++top}` : name,
        init: ini === '' ? '' : +ini,
        ac: ac === '' ? '' : +ac,
        hp: hp === '' ? '' : +hp,
        hpMax: hp === '' ? '' : +hp,
        ...(b ? { mon: b.id, ib: bestIni(b) } : {}),
        ...(b && b.lg && b.lg.length ? { lg: 3, lgU: 0 } : {}),
        ...(lr ? { lr: +lr[1], lrU: 0 } : {}),
        ...(rc ? { rc: rc[0].replace(/\s*\(.*\)\s*$/, '') } : {}),
      });
    if (started && ini === '')
      setTimeout(
        () =>
          toast(
            '<div class="t-label">Refuerzos</div><div class="t-parts">El combate ya ha empezado: apunta la iniciativa de los nuevos para que entren en su sitio (sin ella van al final de la ronda).</div>'
          ),
        0
      );
    MFOE = null;
    masterSave();
    closeModal();
    render();
  },
  'm-st-ask': el => {
    const f = MST.fight.list.find(x => x.id === el.dataset.id);
    if (f) openFoeDown(f);
  },
  'm-st': el => {
    const f = MST.fight.list.find(x => x.id === el.dataset.id);
    if (!f) return;
    f.st = el.dataset.st;
    masterSave();
    closeModal();
    render();
  },
  'm-rm': el => {
    const f = MST.fight.list.find(x => x.id === el.dataset.id);
    if (!f) return;
    /* En pleno combate se pregunta: la «×» está al lado de los PG y es fácil tocarla sin querer */
    if (fightOn() && f.kind !== 'pj') {
      openModal(`<h2>¿Quitar a ${esc(f.name)}?</h2><p class="hint">${f.hp !== '' ? `Tiene ${esc(f.hp)}${f.hpMax ? ` de ${esc(f.hpMax)}` : ''} PG. ` : ''}Si te equivocas, pulsa «Deshacer» en la cabecera del combate.</p>
        <div class="btns"><button class="b bad" data-act="m-rm-ok" data-id="${f.id}">Quitar</button><button class="b" data-act="close-modal">Cancelar</button></div>`);
      return;
    }
    A['m-rm-ok'](el);
  },
  'm-rm-ok': el => {
    const F = MST.fight,
      id = el.dataset.id;
    if (F.cur === id) F.cur = fightPass(id, [id]);
    F.list = F.list.filter(f => f.id !== id);
    masterSave();
    closeModal();
    render();
  },
  'm-start': () => {
    const F = MST.fight,
      L = fightSorted().filter(f => !fDown(f)),
      sin = L.filter(f => f.init === '');
    if (!L.length) return;
    if (sin.length && !mStartForce) {
      openModal(`<h2>¿Empezar el combate?</h2><p class="hint">Falta la iniciativa de: ${sin.map(f => `<b>${esc(f.name)}</b>`).join(', ')}. Si empiezas igualmente, ${sin.length === 1 ? 'irá' : 'irán'} al final.</p>
        <div class="btns"><button class="b pri" data-act="m-start-ok">Empezar igualmente</button><button class="b" data-act="close-modal">Apuntarla antes</button></div>`);
      return;
    }
    F.round = 1;
    F.cur = L[0].id;
    masterSave();
    closeModal();
    render();
  },
  'm-start-ok': () => {
    mStartForce = true;
    A['m-start']();
    mStartForce = false;
  },
  'm-next': () => {
    const F = MST.fight,
      L = fightSorted();
    if (!L.length) return;
    const prev = L.find(f => f.id === F.cur);
    /* Pasa al siguiente que siga en pie; si da la vuelta, sube la ronda */
    const nx = fightPass(F.cur);
    if (!nx) {
      toast('<div class="t-label">Combate</div><div class="t-parts">No queda nadie en pie.</div>');
      return;
    }
    F.cur = nx;
    const f = F.list.find(x => x.id === nx);
    let msg = fightTurnNotes(prev, true) ? `<div class="t-parts">${fightTurnNotes(prev, true)}</div>` : '';
    /* Empieza su turno: acciones legendarias de vuelta y Regeneración */
    if (f.lg) f.lgU = 0;
    const rg = fRegen(f);
    if (rg && f.hp !== '') {
      if (f.noRegen) {
        if (+f.hp <= 0 && rg.revive) {
          f.st = 'dead';
          msg += `<div class="t-parts"><b>${esc(f.name)} muere:</b> empieza su turno a 0 PG y no se regenera (recibió fuego o ácido).</div>`;
        } else
          msg += `<div class="t-parts">${esc(f.name)} no se regenera este turno (recibió fuego o ácido).</div>`;
        delete f.noRegen;
      } else if (+f.hp > 0 || rg.revive) {
        const was = +f.hp;
        f.hp = Math.min(+f.hpMax || was + rg.n, was + rg.n);
        if (f.hp > was)
          msg += `<div class="t-parts"><b>Regeneración:</b> ${esc(f.name)} recupera ${f.hp - was} PG (${f.hp}${f.hpMax ? `/${f.hpMax}` : ''}).${was <= 0 ? ' Se levanta.' : ''}</div>`;
        if (f.hp > 0) delete f.st;
      }
    }
    msg += fightTurnNotes(f);
    /* Si no queda ningún enemigo en pie */
    const foes = F.list.filter(x => x.kind === 'npc');
    if (foes.length && foes.every(x => fDown(x)))
      msg +=
        '<div class="t-parts">No queda ningún enemigo en pie.</div><div class="t-actions"><button class="b sm pri" data-act="m-end">Terminar combate</button></div>';
    masterSave();
    render();
    const row = document.querySelector('.mrow.cur');
    if (row && row.scrollIntoView) row.scrollIntoView({ block: 'nearest' });
    if (msg) toast(msg, /m-end/.test(msg));
  },
  /* Terminar combate: PX de los derrotados (y de los que elija el máster) repartidos entre los jugadores */
  'm-end': () => {
    const F = MST.fight;
    MXP = new Set(F.list.filter(f => f.kind === 'npc' && f.mon && fDown(f)).map(f => f.id));
    openEndFight();
  },
  'm-xp-tog': el => {
    const id = el.dataset.id;
    if (MXP.has(id)) MXP.delete(id);
    else MXP.add(id);
    openEndFight();
  },
  'm-end-ok': () => {
    const keep = $('#m-keep') && $('#m-keep').checked;
    const ko = keep ? MST.fight.list.filter(f => f.kind === 'npc' && f.st === 'ko') : [];
    MST.fight = { round: 1, cur: '', list: ko };
    masterSave();
    closeModal();
    render();
    if (ko.length)
      toast(
        `<div class="t-label">Prisioneros</div><div class="t-parts">Siguen en la lista: ${ko.map(f => esc(f.name)).join(', ')}.</div>`
      );
  },
  /* Daño o curación a una fila, sin hacer cuentas */
  'm-hp': el => {
    const f = MST.fight.list.find(x => x.id === el.dataset.id);
    if (!f) return;
    openModal(`<h2>${esc(f.name)}</h2><p class="hint">PG: <b>${esc(f.hp === '' ? '—' : f.hp)}</b>${f.hpMax ? ` de ${esc(f.hpMax)}` : ''}. Escribe cuánto y pulsa Daño o Curar.</p>
      <div class="hpctl"><input id="mhp-n" type="number" inputmode="numeric" min="0" placeholder="0" aria-label="Cantidad"><button class="b bad" data-act="m-hp-ok" data-id="${f.id}" data-m="dmg">Daño</button><button class="b good" data-act="m-hp-ok" data-id="${f.id}" data-m="heal">Curar</button></div>
      ${fRegen(f) ? `<label class="chk"><input type="checkbox" id="mhp-fire" ${f.noRegen ? 'checked' : ''}> Es daño de fuego o ácido (no se regenera en su siguiente turno)</label>` : ''}
      <div class="btns"><button class="b" data-act="close-modal">Cancelar</button></div>`);
    setTimeout(() => $('#mhp-n') && $('#mhp-n').focus(), 0);
  },
  'm-hp-ok': el => {
    const f = MST.fight.list.find(x => x.id === el.dataset.id),
      n = Math.max(0, parseInt($('#mhp-n').value) || 0);
    if (!f) return;
    if (!n) return $('#mhp-n').focus();
    const fire = $('#mhp-fire') && $('#mhp-fire').checked;
    closeModal();
    fightHp(f, el.dataset.m === 'dmg' ? -n : n, fire);
  },
  /* Estados, concentración y nota de una fila (y «A 0 PG» de un jugador) */
  'm-cond': el => openFightCond(el.dataset.id),
  'm-cond-ok': el => {
    const f = MST.fight.list.find(x => x.id === el.dataset.id);
    if (!f) return;
    const m = $('#modal');
    if (f.kind === 'pj') f.ko = !!(m.querySelector('#mc-ko') || {}).checked;
    else {
      f.cs = [...m.querySelectorAll('[data-mc]:checked')].map(x => x.value);
      f.conc = ($('#mc-conc') ? $('#mc-conc').value : '').trim();
      f.note = ($('#mc-note') ? $('#mc-note').value : '').trim();
      if ($('#mc-fire')) f.noRegen = $('#mc-fire').checked;
    }
    masterSave();
    closeModal();
    render();
  },
  /* Contadores de acciones y resistencias legendarias */
  'm-ctr': el => {
    const f = MST.fight.list.find(x => x.id === el.dataset.id),
      k = el.dataset.k,
      max = k === 'lgU' ? f && f.lg : f && f.lr;
    if (!f || !max) return;
    f[k] = Math.min(max, (+f[k] || 0) + 1);
    masterSave();
    render();
  },
  /* Daño en área a varios NPC: cada uno supera o falla su salvación */
  'm-area': () => {
    MAREA = { ids: new Set(), ab: 1, dc: '', dmg: '', ok: new Set(), half: true };
    openFightArea();
  },
  'm-area-tog': el => {
    mareaCollect();
    const S2 = el.dataset.k === 'ok' ? MAREA.ok : MAREA.ids;
    if (S2.has(el.dataset.id)) S2.delete(el.dataset.id);
    else S2.add(el.dataset.id);
    openFightArea();
  },
  'm-area-ab': () => {
    mareaCollect();
    openFightArea();
  },
  'm-area-ok': () => {
    mareaCollect();
    const d = Math.max(0, parseInt(MAREA.dmg) || 0);
    if (!d || !MAREA.ids.size)
      return toast('<div class="t-parts">Marca a quién le afecta y escribe el daño.</div>');
    const out = [];
    for (const id of MAREA.ids) {
      const f = MST.fight.list.find(x => x.id === id);
      if (!f) continue;
      const got = MAREA.ok.has(id) ? (MAREA.half ? Math.floor(d / 2) : 0) : d;
      out.push(`${esc(f.name)} −${got}`);
      if (got) fightHp(f, -got, false, true);
    }
    closeModal();
    masterSave();
    render();
    toast(`<div class="t-label">Daño a varios</div><div class="t-parts">${out.join(' · ')}</div>`);
    const fallen = MST.fight.list.find(f => MAREA.ids.has(f.id) && fDown(f) && !f.st && f.kind === 'npc');
    if (fallen) openFoeDown(fallen);
  },
  'm-undo': () => {
    const s = MUNDO.pop();
    if (!s) return;
    MST.fight = JSON.parse(s);
    masterSave();
    render();
    toast(
      '<div class="t-label">Deshecho</div><div class="t-parts">El combate vuelve a como estaba antes del último cambio.</div>'
    );
  },
  'share-open': openShare,
  'crea-share': el => openCreaShare(el.dataset.id),
  'cr-copy': async () => {
    try {
      await navigator.clipboard.writeText(CRSH);
      toast(
        '<div class="t-label">Código copiado</div><div class="t-parts">Pásaselo al máster: lo pega en «+ Jugador».</div>'
      );
    } catch (e) {
      openModal(
        `<h2>Código de la criatura</h2><p class="hint">Cópialo y pásaselo al máster: lo pega en «+ Jugador».</p><textarea class="code" readonly onclick="this.select()">${esc(CRSH)}</textarea><div class="btns"><button class="b" data-act="close-modal">Cerrar</button></div>`
      );
    }
  },
  'm-cr-del': el => {
    const p = MST.players.find(x => x.id === el.dataset.p);
    if (!p) return;
    p.crs = (p.crs || []).filter(x => x.id !== el.dataset.id);
    masterSave();
    render();
  },
  'share-copy': async () => {
    const t = sheetLink(C());
    try {
      await navigator.clipboard.writeText(t);
      toast(
        '<div class="t-label">Código copiado</div><div class="t-parts">Pásaselo al máster: lo pega en «+ Jugador».</div>'
      );
    } catch (e) {
      openModal(
        `<h2>Tu código</h2><p class="hint">Cópialo y pásaselo al máster: lo pega en «+ Jugador».</p><textarea class="code" readonly onclick="this.select()">${esc(t)}</textarea><div class="btns"><button class="b" data-act="share-open">Volver</button></div>`
      );
    }
  },
  'share-send': () => {
    const c = C();
    navigator
      .share({
        title: `Características de ${c.name}`,
        text: `Características de ${c.name} para el máster (Fichas 5e)`,
        url: sheetLink(c),
      })
      .catch(() => {});
  },
});
