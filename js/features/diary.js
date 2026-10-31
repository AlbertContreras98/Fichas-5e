/* Diario: carpetas, notas y enlaces [[entre notas]]. */
'use strict';

let D = null;
const dItems = () => C().diary.items;
const dGet = id => dItems().find(x => x.id === id);
const dKids = pid =>
  dItems()
    .filter(x => (x.parent || null) === (pid || null))
    .sort((a, b) =>
      a.type === b.type ? a.name.localeCompare(b.name, 'es', { numeric: true }) : a.type === 'folder' ? -1 : 1
    );
function dPath(id) {
  const out = [];
  let x = id && dGet(id);
  while (x) {
    out.unshift(x);
    x = x.parent && dGet(x.parent);
  }
  return out;
}
function dDesc(id) {
  const out = [];
  for (const k of dKids(id)) {
    out.push(k);
    if (k.type === 'folder') out.push(...dDesc(k.id));
  }
  return out;
}
const ICON_FOLDER =
  '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="currentColor" opacity=".85"/></svg>';
const ICON_NOTE =
  '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 3h8l4 4v14H6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 11h6M9 14.5h6M9 18h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
function dRow(x) {
  const n = x.type === 'folder' ? dDesc(x.id).filter(y => y.type === 'note').length : 0;
  const where = D.q
    ? dPath(x.parent)
        .map(p => p.name)
        .join(' / ')
    : '';
  return `<div class="drow">
    <button class="dopen" data-act="d-open" data-id="${x.id}"><span class="dic ${x.type}">${x.type === 'folder' ? ICON_FOLDER : ICON_NOTE}</span><span class="dtxt"><b>${esc(x.name || 'Sin título')}</b><small>${x.type === 'folder' ? `${n} entrada${n === 1 ? '' : 's'}` : esc((x.text || '').replace(/\s+/g, ' ').slice(0, 70) || 'Vacía')}${where ? ` · en ${esc(where)}` : ''}</small></span></button>
    <button class="b sm sq" data-act="d-menu" data-id="${x.id}" aria-label="Opciones de ${esc(x.name)}" aria-expanded="${D.menu === x.id}">⋯</button>
    ${
      D.menu === x.id
        ? `<div class="charmenu">${
            D.confirm === x.id
              ? `<span class="hint" style="margin:0">¿Borrar${x.type === 'folder' ? ' la categoría y todo lo que contiene' : ''}?</span><button class="b sm bad" data-act="d-del-ok" data-id="${x.id}">Borrar</button><button class="b sm" data-act="d-menu" data-id="${x.id}">Cancelar</button>`
              : `<button class="b sm" data-act="d-rename" data-id="${x.id}">Renombrar</button><button class="b sm" data-act="d-move" data-id="${x.id}">Mover a…</button><button class="b sm bad" data-act="d-del" data-id="${x.id}">Borrar</button>`
          }</div>`
        : ''
    }
  </div>`;
}
function renderDiary() {
  const c = C();
  let body;
  if (D.note) {
    const n = dGet(D.note);
    if (!n) {
      D.note = null;
      return renderDiary();
    }
    if (D.pick) {
      const pq = norm(D.pq),
        opts = dItems()
          .filter(x => x.id !== n.id && (!pq || norm(x.name).includes(pq)))
          .sort((a, b) => a.name.localeCompare(b.name, 'es', { numeric: true }));
      body = `<p>Enlazar a otra entrada desde <b>${esc(n.name)}</b>:</p><div class="dtools"><input type="search" id="d-pq" placeholder="Buscar o escribir un nombre nuevo" value="${esc(D.pq)}" autocomplete="off"></div>
        <div class="charlist">${D.pq.trim() && !dFind(D.pq.trim()) ? `<button class="b opt" data-act="d-pick" data-name="${esc(D.pq.trim())}"><span>+ Enlazar a «<b>${esc(D.pq.trim())}</b>» (entrada nueva)</span></button>` : ''}
        ${opts
          .map(
            x =>
              `<button class="b opt" data-act="d-pick" data-name="${esc(x.name)}"><span>${x.type === 'folder' ? ICON_FOLDER : ICON_NOTE} <b>${esc(x.name)}</b> <small>${esc(
                dPath(x.parent)
                  .map(p => p.name)
                  .join(' / ')
              )}</small></span></button>`
          )
          .join('')}</div>
        <div class="btns"><button class="b" data-act="d-pick-cancel">Cancelar</button></div>`;
    } else if (D.edit) {
      body = `<div class="crumbs">${crumbs(n.parent)}</div>
      <input class="dtitle" id="d-title" value="${esc(n.name)}" placeholder="Título" aria-label="Título">
      <textarea class="notes diary" id="d-text" placeholder="Escribe aquí…">${esc(n.text || '')}</textarea>
      <p class="hint">Para enlazar otra entrada usa «Enlazar» o escribe su nombre entre corchetes dobles: [[Puerto Brumoso]].</p>
      <div class="btns"><button class="b pri" data-act="d-done">Listo</button><button class="b" data-act="d-linkpick">Enlazar…</button></div>`;
    } else {
      const back = dBacklinks(n);
      body = `<div class="crumbs">${crumbs(n.parent)}</div><h3 class="dread-title">${esc(n.name || 'Sin título')}</h3>
      <div class="dread">${n.text ? dRender(n.text) : '<p class="empty">Entrada vacía.</p>'}</div>
      ${back.length ? `<div class="dback"><small>Mencionada en:</small> ${back.map(x => `<button class="dlink" data-act="d-goto" data-id="${x.id}">${esc(x.name)}</button>`).join(' ')}</div>` : ''}
      <div class="btns"><button class="b" data-act="d-back">← Volver</button><button class="b pri" data-act="d-edit">Editar</button></div>`;
    }
  } else if (D.move) {
    const x = dGet(D.move),
      bad = new Set([x.id, ...(x.type === 'folder' ? dDesc(x.id).map(y => y.id) : [])]);
    const folders = dItems().filter(y => y.type === 'folder' && !bad.has(y.id));
    body = `<p>Mover <b>${esc(x.name)}</b> a:</p><div class="charlist">
      <button class="b opt" data-act="d-move-to" data-id=""><span>${ICON_FOLDER} <b>Diario</b> (principal)</span></button>
      ${folders
        .map(
          f =>
            `<button class="b opt" data-act="d-move-to" data-id="${f.id}"><span>${ICON_FOLDER} <b>${esc(
              dPath(f.id)
                .map(p => p.name)
                .join(' / ')
            )}</b></span></button>`
        )
        .join('')}</div>
      <div class="btns"><button class="b" data-act="d-move-cancel">Cancelar</button></div>`;
  } else {
    const list = D.q
      ? dItems().filter(x => norm(x.name + ' ' + (x.text || '')).includes(norm(D.q)))
      : dKids(D.folder);
    body = `<div class="dtools"><input type="search" id="d-q" placeholder="Buscar en todo el diario" value="${esc(D.q)}" autocomplete="off"></div>
      ${D.q ? '' : `<div class="crumbs">${crumbs(D.folder)}</div>`}
      <div class="btns"><button class="b sm pri" data-act="d-new" data-type="note">+ Entrada</button><button class="b sm" data-act="d-new" data-type="folder">+ Categoría</button><button class="b sm" data-act="d-session">+ Sesión</button></div>
      <div class="dlist">${list.length ? list.map(dRow).join('') : `<p class="empty">${D.q ? 'No hay resultados.' : D.folder ? 'Esta categoría está vacía.' : 'Tu diario está vacío. Crea una entrada o una categoría (por ejemplo «Lugares», «Personajes» o «Facciones»); dentro de una categoría puedes crear otras.'}</p>`}</div>`;
  }
  const html = `<div class="wz-head"><h2>Diario</h2><button class="b sm" data-act="d-close">Hecho</button></div><div class="wz-body" id="d-body">${body}</div>`;
  const m = $('#modal');
  if (m.hidden || !m.querySelector('.sheet.big')) openModal(html, true);
  else m.querySelector('.sheet').innerHTML = html;
}
function dLinks(t) {
  const out = [];
  const re = /\[\[([^\[\]\n]{1,80})\]\]/g;
  let m;
  while ((m = re.exec(t || ''))) out.push(m[1].trim());
  return out;
}
function dFind(nm) {
  const k = norm(nm.trim());
  const its = dItems();
  return (
    its.find(x => x.type === 'note' && norm(x.name) === k) ||
    its.find(x => x.type === 'folder' && norm(x.name) === k)
  );
}
function dRender(t) {
  let out = '',
    last = 0;
  const re = /\[\[([^\[\]\n]{1,80})\]\]/g;
  let m;
  while ((m = re.exec(t))) {
    out += esc(t.slice(last, m.index));
    const nm = m[1].trim(),
      tg = dFind(nm);
    out += `<button class="dlink${tg ? '' : ' missing'}" data-act="d-link" data-name="${esc(nm)}"${tg ? '' : ' title="Aún no existe: tócalo para crearla"'}>${esc(nm)}</button>`;
    last = re.lastIndex;
  }
  return (out + esc(t.slice(last))).replace(/\n/g, '<br>');
}
function dBacklinks(n) {
  const k = norm(n.name);
  return dItems().filter(x => x.type === 'note' && x.id !== n.id && dLinks(x.text).some(l => norm(l) === k));
}
function dRelink(oldN, newN) {
  if (!oldN || !newN || norm(oldN) === norm(newN)) return;
  const k = norm(oldN);
  dItems().forEach(x => {
    if (x.type === 'note' && x.text)
      x.text = x.text.replace(/\[\[([^\[\]\n]{1,80})\]\]/g, (all, nm) =>
        norm(nm.trim()) === k ? `[[${newN}]]` : all
      );
  });
}
function dLeave() {
  if (!D || !D.note) return;
  const n = dGet(D.note);
  if (n && D.edit && D.orig) dRelink(D.orig, n.name);
  D.edit = false;
  D.orig = '';
  D.pick = false;
  save();
}
function dOpenNote(id, edit) {
  const n = dGet(id);
  D.note = id;
  D.edit = !!edit;
  D.orig = edit && n ? n.name : '';
  D.pick = false;
  D.menu = null;
}
function crumbs(id) {
  const path = dPath(id);
  return [
    `<button class="crumb" data-act="d-go" data-id="">Diario</button>`,
    ...path.map(p => `<button class="crumb" data-act="d-go" data-id="${p.id}">${esc(p.name)}</button>`),
  ].join('<span aria-hidden="true">›</span>');
}
function dPrompt(title, val, act, id, extra) {
  openModal(
    `<h2>${title}</h2><input class="dtitle" id="d-name" value="${esc(val)}" autocomplete="off"><div class="btns"><button class="b pri" data-act="${act}" data-id="${id || ''}" ${extra || ''}>Guardar</button><button class="b" data-act="d-cancel">Cancelar</button></div>`
  );
  setTimeout(() => {
    const i = $('#d-name');
    if (i) {
      i.focus();
      i.select();
    }
  }, 30);
}
