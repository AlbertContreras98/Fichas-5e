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
    const gone = F.list.filter(f => f.pid === id).map(f => f.id);
    if (gone.includes(F.cur)) {
      /* le tocaba a él: el turno pasa al siguiente que sigue en la mesa, como con la «×» */
      const L = fightSorted(),
        i = L.findIndex(f => f.id === F.cur),
        nx = [...L.slice(i + 1), ...L.slice(0, i)].find(f => !gone.includes(f.id));
      F.cur = nx ? nx.id : '';
    }
    F.list = F.list.filter(f => f.pid !== id);
    MST.tab = 'combat';
    masterSave();
    closeModal();
    render();
  },
  'm-pjs': () => {
    MST.players
      .filter(p => !MST.fight.list.some(f => f.pid === p.id))
      .forEach(p => MST.fight.list.push({ id: uid(), kind: 'pj', pid: p.id, name: p.n, init: '', ac: p.ac }));
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
    for (let i = 1; i <= n; i++)
      MST.fight.list.push({
        id: uid(),
        kind: 'npc',
        name: n > 1 ? `${name} ${i}` : name,
        init: ini === '' ? '' : +ini,
        ac: ac === '' ? '' : +ac,
        hp: hp === '' ? '' : +hp,
        hpMax: hp === '' ? '' : +hp,
        ...(b ? { mon: b.id, ib: bestIni(b) } : {}),
      });
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
    const F = MST.fight,
      id = el.dataset.id;
    if (F.cur === id) {
      const L = fightSorted(),
        i = L.findIndex(f => f.id === id),
        nx = L[i + 1] || L[0];
      F.cur = nx && nx.id !== id ? nx.id : '';
    }
    F.list = F.list.filter(f => f.id !== id);
    masterSave();
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
    /* Pasa al siguiente que siga en pie; si da la vuelta, sube la ronda */
    let j = L.findIndex(f => f.id === F.cur),
      wrap = false;
    for (let k = 0; k < L.length; k++) {
      j++;
      if (j >= L.length) {
        j = 0;
        wrap = true;
      }
      if (!fDown(L[j])) break;
    }
    if (fDown(L[j])) {
      toast('<div class="t-label">Combate</div><div class="t-parts">No queda nadie en pie.</div>');
      return;
    }
    F.cur = L[j].id;
    if (wrap) F.round++;
    masterSave();
    render();
  },
  'm-end': () =>
    openModal(`<h2>¿Terminar el combate?</h2><p class="hint">Se vacía la lista de combate (los jugadores siguen en tu mesa).</p>
      <div class="btns"><button class="b bad" data-act="m-end-ok">Terminar</button><button class="b" data-act="close-modal">Cancelar</button></div>`),
  'm-end-ok': () => {
    MST.fight = { round: 1, cur: '', list: [] };
    masterSave();
    closeModal();
    render();
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
