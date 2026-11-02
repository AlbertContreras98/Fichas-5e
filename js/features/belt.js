/* Cinturón de la mochila: iconos que aparecen según lo que lleva el personaje (mapas, pociones, kit de sanador, raciones y munición). */
'use strict';

const BELT_KIT = '<path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7Z"/>';
const beltIcon = p =>
  `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;

/* Objetos que viven en el cinturón y no salen en la lista de la mochila */
const inBelt = e =>
  (e.cat === 'mapa' && !!e.img) ||
  e.cat === 'pocion' ||
  e.cat === 'municion' ||
  e.gear === 'healerkit' ||
  e.gear === 'rations';
/* Qué hay en el cinturón: [clave, nombre, icono, número, poco, objetos [e, i]] */
function beltData(c) {
  const all = c.equipment.map((e, i) => [e, i]),
    sum = l => l.reduce((n, [e]) => n + (+e.qty || 0), 0),
    maps = all.filter(([e]) => e.cat === 'mapa' && e.img),
    pots = all.filter(([e]) => e.cat === 'pocion'),
    kits = all.filter(([e]) => e.gear === 'healerkit'),
    food = all.filter(([e]) => e.gear === 'rations'),
    ammo = all.filter(([e]) => e.cat === 'municion');
  return [
    ['map', maps.length > 1 ? 'Mapas' : 'Mapa', CAT_ICON.mapa, maps.length, false, maps],
    ['pot', 'Pociones', CAT_ICON.pocion, sum(pots), pots.some(([e]) => +e.qty <= 0), pots],
    ['kit', 'Sanador', BELT_KIT, sum(kits), kits.some(([e]) => +e.qty <= 0), kits],
    ['food', 'Raciones', CAT_ICON.comida, sum(food), food.some(([e]) => +e.qty <= 1), food],
    ['ammo', 'Munición', CAT_ICON.municion, sum(ammo), ammo.some(([e]) => +e.qty <= 5), ammo],
  ].filter(b => b[5].length);
}

function beltHTML(c) {
  const B = beltData(c);
  if (!B.length) return '';
  return `<div class="belt-wrap"><nav class="belt" aria-label="Lo que llevas a mano">${B.map(
    ([k, n, ic, num, low]) =>
      `<button class="belt-b${low ? ' low' : ''}" data-act="belt" data-k="${k}" aria-label="${n}: ${num}${low ? ' (quedan pocas)' : ''}">${beltIcon(ic)}<b class="belt-n">${num}</b><small>${n}</small></button>`
  ).join('')}</nav></div>`;
}

/* Lista para elegir cuando hay varios objetos del mismo tipo (pociones, kits, raciones o munición) */
function beltMenu(k) {
  const b = beltData(C()).find(x => x[0] === k);
  if (!b) return openInv();
  openModal(`<div class="wz-head"><h2>${b[1]}</h2><button class="b sm" data-act="inv">Volver</button></div>
    <div class="map-list">${b[5]
      .map(
        ([e]) =>
          `<button class="b opt map-row${+e.qty <= 0 ? ' zero' : ''}" data-act="item-open" data-id="${e.id}"><span><b>${esc(e.name)}</b>${itemSub(C(), e) ? `<br><small>${itemSub(C(), e)}</small>` : ''}</span><b>×${e.qty}</b><span aria-hidden="true">›</span></button>`
      )
      .join('')}</div>`);
}

function beltOpen(k) {
  const b = beltData(C()).find(x => x[0] === k);
  if (!b) return;
  const L = b[5];
  if (k === 'map') return L.length === 1 ? mapView(L[0][0].id) : mapMenu();
  if (L.length === 1) return itemSheet(L[0][0].id);
  beltMenu(k);
}
