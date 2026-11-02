/* Mapas de la mochila: nombre «Mapa: zona», imagen opcional, selector y visor con zoom (se abren desde el cinturón). */
'use strict';

const MAP_MAX = 1600;
const mapZone = e =>
  String(e.name || '')
    .replace(/^\s*mapa\s*:\s*/i, '')
    .trim();
const mapName = z => 'Mapa: ' + z;
const mapsWithImg = c => c.equipment.filter(e => e.cat === 'mapa' && e.img);
const mapGet = id => C().equipment.find(e => e.id === id && e.cat === 'mapa');
const mapDup = (c, z, id) =>
  c.equipment.some(e => e.cat === 'mapa' && e.id !== id && norm(mapZone(e)) === norm(z));

/* Menú para elegir mapa cuando hay más de uno con imagen */
function mapMenu() {
  const ms = mapsWithImg(C());
  openModal(`<div class="wz-head"><h2>Mapas</h2><button class="b sm" data-act="inv">Volver</button></div>
    <p class="hint">Elige qué mapa quieres abrir.</p>
    <div class="map-list">${ms
      .map(
        e =>
          `<button class="b opt map-row" data-act="map-view" data-id="${e.id}"><img src="${esc(e.img)}" alt=""><span><b>${esc(e.name)}</b>${e.notes ? `<br><small>${esc(e.notes)}</small>` : ''}</span><span aria-hidden="true">›</span></button>`
      )
      .join('')}</div>`);
}

/* Ventana de un mapa sin imagen: notas, añadir imagen y cambiar zona */
function mapDetail(id) {
  const e = mapGet(id);
  if (!e) return openInv();
  openModal(`<h2>${esc(e.name)}</h2>
    ${e.notes ? `<p>${esc(e.notes)}</p>` : '<p class="hint">Sin notas.</p>'}
    <p class="hint">Este mapa no tiene imagen. Si el máster te da el dibujo o una foto, añádela para poder verlo desde la mochila.</p>
    <div class="btns"><label class="b pri">Añadir imagen<input type="file" id="map-file" data-id="${e.id}" accept="image/*" hidden></label><button class="b" data-act="map-zone" data-id="${e.id}" data-back="det">Cambiar zona</button><button class="b" data-act="inv">Volver</button></div>`);
}

/* Cambiar la zona (y las notas) de un mapa */
function mapZoneModal(id, back) {
  const e = mapGet(id);
  if (!e) return openInv();
  openModal(`<h2>Cambiar zona</h2>
    <label class="f"><span>Zona que mapea</span><input id="map-zone-in" value="${esc(mapZone(e))}" autocomplete="off"></label>
    <label class="f"><span>Notas</span><input id="map-notes-in" value="${esc(e.notes || '')}" placeholder="Opcional"></label>
    <div class="btns"><button class="b pri" data-act="map-zone-ok" data-id="${e.id}" data-back="${back}">Guardar</button><button class="b" data-act="map-back" data-id="${e.id}" data-back="${back}">Cancelar</button></div>`);
  const i = $('#map-zone-in');
  i.focus();
  i.select();
}

/* Pone o cambia la imagen de un mapa ya guardado */
function mapSetImg(id, file) {
  imgToData(file, MAP_MAX, data => {
    const e = mapGet(id);
    if (!e) return;
    const prev = e.img;
    e.img = data;
    if (!saveOk()) {
      if (prev) e.img = prev;
      else delete e.img;
      toast(FULL_MSG);
      return;
    }
    UNDO.length = 0;
    render();
    openInv();
    mapView(id);
    toast(
      `<div class="t-label">${esc(e.name)}</div><div class="t-parts">Imagen ${prev ? 'cambiada' : 'añadida'}.</div>`
    );
  });
}

/* Visor a pantalla completa: pellizcar o rueda para ampliar, arrastrar para moverse, doble toque para ajustar */
let MAPV = null;
function mapView(id) {
  const e = mapGet(id);
  if (!e || !e.img) return;
  mapClose();
  const d = document.createElement('div');
  d.id = 'mapview';
  d.setAttribute('role', 'dialog');
  d.setAttribute('aria-modal', 'true');
  d.setAttribute('aria-label', e.name);
  d.innerHTML = `<div class="mv-top"><div class="mv-title"><h2>${esc(e.name)}</h2>${e.notes ? `<small>${esc(e.notes)}</small>` : ''}</div><button class="b" data-act="map-close">Cerrar</button></div>
    <div class="mv-stage"><img src="${esc(e.img)}" alt="${esc(e.name)}" draggable="false"></div>
    <div class="mv-bar">
      <div class="mv-zoom"><button class="b sq" data-act="map-zoom" data-d="-1" aria-label="Alejar">−</button><button class="b sq" data-act="map-zoom" data-d="0" aria-label="Ajustar a la pantalla">⤢</button><button class="b sq" data-act="map-zoom" data-d="1" aria-label="Acercar">+</button></div>
      <div class="mv-opts"><label class="b sm">Cambiar imagen<input type="file" id="map-file" data-id="${e.id}" accept="image/*" hidden></label><button class="b sm" data-act="map-zone" data-id="${e.id}" data-back="view">Cambiar zona</button><button class="b sm mv-del" data-act="map-del" data-id="${e.id}">Borrar mapa</button></div>
      <small class="mv-hint">Pellizca o usa la rueda para ampliar · arrastra para moverte · doble toque para ajustar</small>
    </div>`;
  document.body.appendChild(d);
  const st = d.querySelector('.mv-stage'),
    im = st.querySelector('img');
  MAPV = { id, s: 1, x: 0, y: 0, st, im, pts: new Map(), tap: 0, tapX: 0, tapY: 0, moved: 0 };
  const rel = ev => {
    const r = st.getBoundingClientRect();
    return { x: ev.clientX - r.left - r.width / 2, y: ev.clientY - r.top - r.height / 2 };
  };
  st.addEventListener('pointerdown', ev => {
    try {
      st.setPointerCapture(ev.pointerId);
    } catch (er) {}
    MAPV.pts.set(ev.pointerId, rel(ev));
    if (MAPV.pts.size === 1) MAPV.moved = 0;
  });
  st.addEventListener('pointermove', ev => {
    const V = MAPV;
    if (!V || !V.pts.has(ev.pointerId)) return;
    const old = [...V.pts.values()],
      p = rel(ev);
    V.pts.set(ev.pointerId, p);
    const now = [...V.pts.values()];
    if (now.length === 1) {
      V.moved += Math.abs(p.x - old[0].x) + Math.abs(p.y - old[0].y);
      V.x += p.x - old[0].x;
      V.y += p.y - old[0].y;
      mapApply();
    } else if (now.length >= 2) {
      V.moved = 99;
      const mid = a => ({ x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 }),
        dist = a => Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1,
        m0 = mid(old),
        m1 = mid(now);
      V.x += m1.x - m0.x;
      V.y += m1.y - m0.y;
      mapZoomAt(m1, (V.s * dist(now)) / dist(old));
    }
  });
  const up = ev => {
    const V = MAPV;
    if (!V || !V.pts.has(ev.pointerId)) return;
    const p = V.pts.get(ev.pointerId);
    V.pts.delete(ev.pointerId);
    if (V.pts.size || ev.type === 'pointercancel' || V.moved > 10) return;
    const t = Date.now();
    if (t - V.tap < 320 && Math.hypot(p.x - V.tapX, p.y - V.tapY) < 30) {
      V.tap = 0;
      if (V.s > 1.05) mapZoomAt({ x: 0, y: 0 }, 1);
      else mapZoomAt(p, 2.5);
    } else Object.assign(V, { tap: t, tapX: p.x, tapY: p.y });
  };
  st.addEventListener('pointerup', up);
  st.addEventListener('pointercancel', up);
  st.addEventListener(
    'wheel',
    ev => {
      ev.preventDefault();
      mapZoomAt(rel(ev), MAPV.s * (ev.deltaY < 0 ? 1.2 : 1 / 1.2));
    },
    { passive: false }
  );
  d.querySelector('[data-act=map-close]').focus();
}
function mapZoomAt(p, ns) {
  const V = MAPV;
  ns = clamp(ns, 1, 6);
  V.x = p.x - ((p.x - V.x) * ns) / V.s;
  V.y = p.y - ((p.y - V.y) * ns) / V.s;
  V.s = ns;
  mapApply();
}
function mapApply() {
  const V = MAPV;
  if (!V) return;
  const mx = Math.max(0, (V.im.offsetWidth * V.s - V.st.clientWidth) / 2),
    my = Math.max(0, (V.im.offsetHeight * V.s - V.st.clientHeight) / 2);
  V.x = clamp(V.x, -mx, mx);
  V.y = clamp(V.y, -my, my);
  V.im.style.transform = `translate(${V.x}px,${V.y}px) scale(${V.s})`;
}
function mapClose() {
  const d = $('#mapview');
  if (d) d.remove();
  MAPV = null;
}
addEventListener('resize', mapApply);
