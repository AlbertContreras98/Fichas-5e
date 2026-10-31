/* Acciones — Personajes, edición de la ficha, importar y exportar. */
'use strict';

Object.assign(A, {
  'tog-save': el => {
    const c = C(),
      k = el.dataset.k,
      i = c.saveProf.indexOf(k);
    i >= 0 ? c.saveProf.splice(i, 1) : c.saveProf.push(k);
    save();
    render();
  },
  add: el => {
    C()[el.dataset.list].push(NEW[el.dataset.list]());
    save();
    renderView();
    const nm = [...document.querySelectorAll(`[data-path^="${el.dataset.list}."]`)].pop();
    nm && nm.closest('.row-ed').querySelector('input').focus();
  },
  del: el => {
    C()[el.dataset.list].splice(+el.dataset.i, 1);
    save();
    renderView();
  },
  'open-data': () => {
    closeModal();
    S.tab = 'data';
    save();
    render();
    scrollTo(0, 0);
  },
  'open-edit': () => {
    closeModal();
    S.tab = 'edit';
    save();
    render();
    scrollTo(0, 0);
  },
  'img-del': () => {
    C().story.img = '';
    save();
    render();
  },
  chars: () => {
    charMenu = '';
    openChars();
  },
  'char-menu': el => {
    charMenu = charMenu === el.dataset.id ? '' : el.dataset.id;
    openChars();
  },
  use: el => {
    closeModal();
    S.active = el.dataset.id;
    if (S.tab === 'edit' || S.tab === 'data') S.tab = 'pj';
    save();
    render();
    scrollTo(0, 0);
  },
  dup: el => {
    const o = S.chars.find(x => x.id === el.dataset.id),
      n = normalize(JSON.parse(JSON.stringify(o)));
    n.id = uid();
    n.name += ' (copia)';
    S.chars.push(n);
    charMenu = '';
    save();
    openChars();
  },
  delchar: el => {
    const o = S.chars.find(x => x.id === el.dataset.id);
    openModal(
      `<h2>¿Borrar a ${esc(o.name)}?</h2><p>No se puede deshacer. Si quieres conservarla, copia antes su JSON.</p><div class="btns"><button class="b" data-act="chars">Cancelar</button><button class="b bad" data-act="delchar-ok" data-id="${o.id}">Borrar</button></div>`
    );
  },
  'delchar-ok': el => {
    S.chars = S.chars.filter(x => x.id !== el.dataset.id);
    if (!C()) S.active = S.chars.length ? S.chars[0].id : null;
    charMenu = '';
    save();
    if (S.chars.length) {
      render();
      openChars();
    } else {
      closeModal();
      S.tab = 'play';
      render();
    }
  },
  newchar: () => {
    closeModal();
    const n = normalize(blank());
    S.chars.push(n);
    S.active = n.id;
    S.tab = 'edit';
    save();
    render();
  },
  import: () => {
    const t = $('#imp-text').value.trim(),
      msg = $('#imp-msg');
    if (!t) {
      msg.textContent = 'Pega primero el JSON de la ficha.';
      return;
    }
    let data;
    let tt = t
      .replace(/^\uFEFF/, '')
      .replace(/^```(json)?|```$/g, '')
      .trim();
    {
      const a = tt.search(/[\[{]/),
        b = Math.max(tt.lastIndexOf('}'), tt.lastIndexOf(']'));
      if (a >= 0 && b > a) tt = tt.slice(a, b + 1);
    }
    try {
      data = JSON.parse(tt);
    } catch (e) {
      msg.textContent = /\}\s*$/.test(tt)
        ? 'Ese texto no es JSON válido. Revisa que no se haya modificado.'
        : 'El texto está cortado: le falta el final. Suele pasar al copiar y pegar fichas grandes. Descarga el archivo desde el otro dispositivo (Exportar → Descargar ficha) y usa «Elegir archivo .json».';
      return;
    }
    const arr = Array.isArray(data) ? data : Array.isArray(data.chars) ? data.chars : [data];
    let last;
    for (const x of arr) {
      const n = normalize(x);
      n.spells.forEach(fillFromRef);
      if (S.chars.some(c => c.id === n.id)) n.id = uid();
      S.chars.push(n);
      last = n;
    }
    S.active = last.id;
    S.tab = 'play';
    save();
    render();
    toast(
      `<div class="t-label">Importado</div><div class="t-parts">${arr.length} ficha${arr.length > 1 ? 's' : ''}: ${esc(arr.map(x => x.name || 'Sin nombre').join(', '))}</div>`
    );
  },
  'copy-prompt': el => copy(prompt4Claude(), el),
  'dl-exp': () => {
    const c = C();
    download(
      `${(c.name || 'ficha').replace(/[^\wáéíóúñü -]/gi, '').trim() || 'ficha'}.json`,
      JSON.stringify(c, null, 2)
    );
  },
  'dl-all': () => download('fichas-5e.json', JSON.stringify({ chars: S.chars }, null, 2)),
  'copy-exp': el => copy(JSON.stringify(C(), null, 2), el),
  'copy-all': el => copy(JSON.stringify({ chars: S.chars }, null, 2), el),
});
