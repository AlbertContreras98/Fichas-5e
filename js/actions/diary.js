/* Acciones — Diario. */
'use strict';

Object.assign(A, {
  'd-close': () => {
    dLeave();
    D = null;
    closeModal();
  },
  'd-open': el => {
    const x = dGet(el.dataset.id);
    D.menu = null;
    D.hist = [];
    if (x.type === 'folder') {
      D.folder = x.id;
      D.q = '';
    } else dOpenNote(x.id, !x.text);
    renderDiary();
  },
  'd-go': el => {
    dLeave();
    D.hist = [];
    D.folder = el.dataset.id || null;
    D.note = null;
    D.menu = null;
    renderDiary();
  },
  'd-back': () => {
    dLeave();
    const n = dGet(D.note);
    let prev = null;
    while (D.hist.length && !prev) prev = dGet(D.hist.pop());
    if (prev) dOpenNote(prev.id, false);
    else {
      D.note = null;
      D.folder = n ? n.parent : D.folder;
    }
    renderDiary();
  },
  'd-edit': () => {
    dOpenNote(D.note, true);
    renderDiary();
    const t = $('#d-text');
    if (t) t.focus();
  },
  'd-done': () => {
    dLeave();
    renderDiary();
  },
  'd-link': el => {
    const nm = el.dataset.name;
    const cur = dGet(D.note);
    dLeave();
    let tg = dFind(nm);
    if (tg && tg.type === 'folder') {
      D.hist = [];
      D.note = null;
      D.folder = tg.id;
      D.q = '';
      return renderDiary();
    }
    let isNew = false;
    if (!tg) {
      tg = {
        id: uid(),
        type: 'note',
        name: nm,
        parent: cur ? cur.parent : D.folder,
        text: '',
        updated: Date.now(),
      };
      dItems().push(tg);
      save();
      isNew = true;
    }
    if (cur) D.hist.push(cur.id);
    dOpenNote(tg.id, isNew);
    renderDiary();
    if (isNew) {
      const t = $('#d-text');
      if (t) t.focus();
    }
  },
  'd-goto': el => {
    const cur = D.note;
    dLeave();
    if (cur) D.hist.push(cur);
    dOpenNote(el.dataset.id, false);
    renderDiary();
  },
  'd-linkpick': () => {
    const t = $('#d-text');
    D.caret = t ? t.selectionStart : null;
    D.pick = true;
    D.pq = '';
    renderDiary();
    const q = $('#d-pq');
    if (q) q.focus();
  },
  'd-pick-cancel': () => {
    D.pick = false;
    renderDiary();
  },
  'd-pick': el => {
    const n = dGet(D.note),
      ins = `[[${el.dataset.name}]]`,
      t = n.text || '',
      at = D.caret == null ? t.length : Math.min(D.caret, t.length);
    n.text = t.slice(0, at) + ins + t.slice(at);
    n.updated = Date.now();
    D.pick = false;
    save();
    renderDiary();
    const ta = $('#d-text');
    if (ta) {
      ta.focus();
      ta.setSelectionRange(at + ins.length, at + ins.length);
    }
  },
  'd-menu': el => {
    D.menu = D.menu === el.dataset.id && !D.confirm ? null : el.dataset.id;
    D.confirm = null;
    renderDiary();
  },
  'd-session': () => {
    let f = dItems().find(x => x.type === 'folder' && !x.parent && norm(x.name) === norm('Sesiones'));
    if (!f) {
      f = { id: uid(), type: 'folder', name: 'Sesiones', parent: null, text: '', updated: Date.now() };
      dItems().push(f);
    }
    const n = dKids(f.id).filter(x => x.type === 'note').length + 1,
      day = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '');
    const x = {
      id: uid(),
      type: 'note',
      name: `Sesión ${n} – ${day}`,
      parent: f.id,
      text: '',
      updated: Date.now(),
    };
    dItems().push(x);
    save();
    D.q = '';
    D.hist = [];
    D.folder = f.id;
    dOpenNote(x.id, true);
    renderDiary();
    const t = $('#d-text');
    if (t) t.focus();
  },
  'd-new': el => {
    const t = el.dataset.type;
    dPrompt(t === 'folder' ? 'Nueva categoría' : 'Nueva entrada', '', 'd-create', '', `data-type="${t}"`);
  },
  'd-create': el => {
    const name =
      $('#d-name').value.trim() || (el.dataset.type === 'folder' ? 'Nueva categoría' : 'Nueva entrada');
    const x = { id: uid(), type: el.dataset.type, name, parent: D.folder, text: '', updated: Date.now() };
    dItems().push(x);
    save();
    $('#modal').innerHTML = '';
    $('#modal').hidden = true;
    if (x.type === 'note') {
      D.hist = [];
      dOpenNote(x.id, true);
    }
    renderDiary();
  },
  'd-rename': el => {
    const x = dGet(el.dataset.id);
    dPrompt('Renombrar', x.name, 'd-rename-ok', x.id);
  },
  'd-rename-ok': el => {
    const x = dGet(el.dataset.id);
    const v = $('#d-name').value.trim();
    if (v) {
      dRelink(x.name, v);
      x.name = v;
    }
    D.menu = null;
    save();
    $('#modal').hidden = true;
    renderDiary();
  },
  'd-cancel': () => {
    $('#modal').hidden = true;
    renderDiary();
  },
  'd-del': el => {
    D.confirm = el.dataset.id;
    renderDiary();
  },
  'd-del-ok': el => {
    const x = dGet(el.dataset.id),
      gone = new Set([x.id, ...(x.type === 'folder' ? dDesc(x.id).map(y => y.id) : [])]);
    C().diary.items = dItems().filter(y => !gone.has(y.id));
    D.menu = D.confirm = null;
    save();
    renderDiary();
  },
  'd-move': el => {
    D.move = el.dataset.id;
    D.menu = null;
    renderDiary();
  },
  'd-move-to': el => {
    const x = dGet(D.move);
    x.parent = el.dataset.id || null;
    D.move = null;
    save();
    renderDiary();
  },
  'd-move-cancel': () => {
    D.move = null;
    renderDiary();
  },
  diary: () => {
    D = {
      folder: null,
      note: null,
      menu: null,
      confirm: null,
      move: null,
      q: '',
      hist: [],
      edit: false,
      orig: '',
      pick: false,
      pq: '',
    };
    renderDiary();
  },
});
