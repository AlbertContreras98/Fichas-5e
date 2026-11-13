/* Bestiario del máster: busca criaturas del SRD (BEASTS + MONSTERS), enseña su ficha y las añade al combate. */
'use strict';

/* Todas las criaturas, ordenadas por nombre (se calcula una vez) */
let BEST_ALL = null;
const bestAll = () =>
  BEST_ALL ||
  (BEST_ALL = [...BEASTS, ...(typeof MONSTERS !== 'undefined' ? MONSTERS : [])].sort((a, b) =>
    a.n.localeCompare(b.n, 'es')
  ));
const bestGet = id => bestAll().find(b => b.id === id) || null;
/* Puntos de experiencia según el VD */
const BEST_XP = {
  0: 10,
  0.125: 25,
  0.25: 50,
  0.5: 100,
  1: 200,
  2: 450,
  3: 700,
  4: 1100,
  5: 1800,
  6: 2300,
  7: 2900,
  8: 3900,
  9: 5000,
  10: 5900,
  11: 7200,
  12: 8400,
  13: 10000,
  14: 11500,
  15: 13000,
  16: 15000,
  17: 18000,
  18: 20000,
  19: 22000,
  20: 25000,
  21: 33000,
  22: 41000,
  23: 50000,
  24: 62000,
  25: 75000,
  26: 90000,
  27: 105000,
  28: 120000,
  29: 135000,
  30: 155000,
};
/* Bonificador de iniciativa: el de Destreza */
const bestIni = b => Math.floor((b.ab[1] - 10) / 2);
/* Quita tildes y pasa a minúsculas para buscar */
const bestNorm = s =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
/* Criaturas que encajan con lo buscado: todas las palabras en el nombre (castellano o inglés) o el tipo */
function bestFind(q) {
  const ws = bestNorm(q).split(/\s+/).filter(Boolean),
    L = bestAll();
  if (!ws.length) return L;
  /* Primero las que empiezan por lo buscado, luego las que tienen una palabra que empieza así y luego el resto */
  const rank = b => {
    const n = bestNorm(b.n);
    return n.startsWith(ws[0]) ? 0 : (' ' + n).includes(' ' + ws[0]) ? 1 : 2;
  };
  return L.filter(b => {
    const h = bestNorm(`${b.n} ${b.en} ${b.t}`);
    return ws.every(w => h.includes(w));
  })
    .map(b => [rank(b), b])
    .sort((x, y) => x[0] - y[0])
    .map(x => x[1]);
}
/* Lista de resultados para la ventana «Añadir NPC» */
function bestResults(q, sel) {
  const L = bestFind(q),
    max = 40;
  if (!L.length) return '<p class="empty">No hay ninguna criatura con ese nombre.</p>';
  return (
    L.slice(0, max)
      .map(
        b =>
          `<button class="b opt bres ${sel === b.id ? 'on' : ''}" data-act="m-foe-pick" data-id="${b.id}"><span><b>${esc(b.n)}</b><br><small>${esc(b.t)} · VD ${esc(b.crs)} · CA ${b.ac} · PG ${b.hp}</small></span><span aria-hidden="true">${sel === b.id ? '✓' : '›'}</span></button>`
      )
      .join('') +
    (L.length > max
      ? `<p class="hint">Y ${L.length - max} más: escribe más letras para encontrarla.</p>`
      : '')
  );
}
/* Ficha completa de una criatura */
function bestCard(b) {
  const AB6 = ['FUE', 'DES', 'CON', 'INT', 'SAB', 'CAR'],
    list = (t, L, f) =>
      L && L.length ? `<h3>${t}</h3>${L.map(x => `<p class="bline">${f(x)}</p>`).join('')}` : '',
    line = x => `<b>${esc(x[0])}.</b> ${esc(x[1])}`;
  const xp = BEST_XP[b.cr];
  return `<div class="bcard"><p class="hint">${esc(b.t)} ${esc(b.sz.toLowerCase())} · VD ${esc(b.crs)}${xp ? ` (${xp.toLocaleString('es-ES')} PX)` : ''}</p>
    <div class="bstats"><span><small>CA</small><b>${b.ac}</b></span><span><small>PG</small><b>${b.hp}</b><small>${esc(b.hd)}</small></span><span><small>Iniciativa</small><b>${sgn(bestIni(b))}</b><small>por su DES</small></span></div><p class="hint">La iniciativa sale de la Destreza. En el manual de 2024 algunos monstruos (sobre todo los grandes y legendarios) tienen una más alta: si la sabes, usa esa.</p>
    <p class="bline"><b>Velocidad:</b> ${esc(b.sp)}</p>
    <div class="babil">${b.ab.map((v, i) => `<span><small>${AB6[i]}</small><b>${v}</b><small>${sgn(Math.floor((v - 10) / 2))}</small></span>`).join('')}</div>
    ${b.res ? `<p class="bline">${esc(b.res)}</p>` : ''}
    <p class="bline"><b>Sentidos:</b> ${esc(b.sen)}</p>
    ${b.lang ? `<p class="bline"><b>Idiomas:</b> ${esc(b.lang)}</p>` : ''}
    ${list('Rasgos', b.tr, line)}
    ${list('Ataques', b.at, a => `<b>${esc(a[0])}.</b> ${esc(a[1])} para impactar. ${esc(a[2])}`)}
    ${list(b.at && b.at.length ? 'Otras acciones' : 'Acciones', b.ex, line)}
    ${list('Acciones adicionales', b.bo, line)}
    ${list('Reacciones', b.re, line)}
    ${b.lg && b.lg.length ? `${list('Acciones legendarias', b.lg, line)}<p class="hint">Normalmente tiene 3 usos (4 en su guarida). Gasta uno justo después del turno de otra criatura para hacer una de estas acciones, y los recupera todos al empezar su turno.</p>` : ''}</div>`;
}
function openBest(id, back) {
  const b = bestGet(id);
  if (!b) return;
  openModal(
    `<div class="wz-head"><h2>${esc(b.n)}</h2><button class="b sm" data-act="${back ? 'm-foe-back' : 'close-modal'}">${back ? 'Volver' : 'Cerrar'}</button></div>${bestCard(b)}`,
    true
  );
}
