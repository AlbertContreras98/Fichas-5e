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
  return L.filter(b => {
    const h = bestNorm(`${b.n} ${b.en} ${b.t}`);
    return ws.every(w => h.includes(w));
  });
}
/* Lista de resultados para la ventana «Añadir enemigo» */
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
  return `<div class="bcard"><p class="hint">${esc(b.t)} ${esc(b.sz.toLowerCase())} · VD ${esc(b.crs)}</p>
    <div class="bstats"><span><small>CA</small><b>${b.ac}</b></span><span><small>PG</small><b>${b.hp}</b><small>${esc(b.hd)}</small></span><span><small>Iniciativa</small><b>${sgn(bestIni(b))}</b></span></div>
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
    ${list('Acciones legendarias', b.lg, line)}</div>`;
}
function openBest(id, back) {
  const b = bestGet(id);
  if (!b) return;
  openModal(
    `<div class="wz-head"><h2>${esc(b.n)}</h2><button class="b sm" data-act="${back ? 'm-foe-back' : 'close-modal'}">${back ? 'Volver' : 'Cerrar'}</button></div>${bestCard(b)}`,
    true
  );
}
