/* Acciones — Modo máster (jugadores, combate, QR) y compartir con el máster. */
'use strict';

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
    const id = el.dataset.id;
    MST.players = MST.players.filter(x => x.id !== id);
    MST.fight.list = MST.fight.list.filter(f => f.pid !== id);
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
  'm-foe': openAddFoe,
  'm-foe-add': () => {
    const name = $('#mf-name').value.trim() || 'Enemigo',
      n = clamp(parseInt($('#mf-n').value) || 1, 1, 20),
      ini = $('#mf-init').value.trim(),
      ac = $('#mf-ac').value.trim(),
      hp = $('#mf-hp').value.trim();
    for (let i = 1; i <= n; i++)
      MST.fight.list.push({
        id: uid(),
        kind: 'npc',
        name: n > 1 ? `${name} ${i}` : name,
        init: ini === '' ? '' : +ini,
        ac: ac === '' ? '' : +ac,
        hp: hp === '' ? '' : +hp,
        hpMax: hp === '' ? '' : +hp,
      });
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
  'm-next': () => {
    const F = MST.fight,
      L = fightSorted();
    if (!L.length) return;
    const i = L.findIndex(f => f.id === F.cur);
    if (i < 0) F.cur = L[0].id;
    else if (i === L.length - 1) {
      F.cur = L[0].id;
      F.round++;
    } else F.cur = L[i + 1].id;
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
