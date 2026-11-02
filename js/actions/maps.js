/* Acciones — Mapas de la mochila: abrir, elegir, cambiar zona o imagen y borrar. */
'use strict';

Object.assign(A, {
  'map-view': el => mapView(el.dataset.id),
  'map-open': el => {
    const e = mapGet(el.dataset.id);
    if (e && e.img) mapView(e.id);
    else mapDetail(el.dataset.id);
  },
  'map-close': () => mapClose(),
  'map-zoom': el => {
    if (!MAPV) return;
    const d = +el.dataset.d;
    mapZoomAt({ x: 0, y: 0 }, d ? MAPV.s * (d > 0 ? 1.5 : 1 / 1.5) : 1);
  },
  'map-zone': el => {
    mapClose();
    mapZoneModal(el.dataset.id, el.dataset.back);
  },
  'map-back': el => {
    const id = el.dataset.id;
    if (el.dataset.back === 'view') {
      openInv();
      mapView(id);
    } else mapDetail(id);
  },
  'map-zone-ok': el => {
    const c = C(),
      e = mapGet(el.dataset.id),
      z = mapZone({ name: $('#map-zone-in').value });
    if (!e) return openInv();
    if (!z) {
      $('#map-zone-in').focus();
      return;
    }
    if (mapDup(c, z, e.id)) {
      toast(`<div class="t-parts">Ya tienes un mapa de «${esc(z)}». Ponle otro nombre a la zona.</div>`);
      $('#map-zone-in').focus();
      return;
    }
    e.name = mapName(z);
    e.notes = $('#map-notes-in').value.trim();
    save();
    render();
    A['map-back'](el);
  },
  'map-del': el => {
    const e = mapGet(el.dataset.id);
    if (!e) return;
    mapClose();
    openModal(`<h2>¿Borrar ${esc(e.name)}?</h2><p>Se quitará de la mochila junto con su imagen.</p>
      <div class="btns"><button class="b bad" data-act="item-del" data-id="${e.id}">Borrar</button><button class="b" data-act="map-back" data-id="${e.id}" data-back="view">Cancelar</button></div>`);
  },
  'ni-img-del': () => {
    niCollect();
    NI.img = '';
    itemModal();
  },
});
