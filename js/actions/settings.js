/* Acciones — Ajustes, créditos y tutorial. */
'use strict';

Object.assign(A, {
  settings: () => {
    const t = getTheme();
    const themeRow = `<div class="setting"><b>Tema</b><div class="seg" role="group" aria-label="Tema">${[
      ['', 'Sistema'],
      ['light', 'Claro'],
      ['dark', 'Oscuro'],
    ]
      .map(
        ([k, n]) =>
          `<button class="${t === k ? 'on' : ''}" data-act="theme" data-v="${k}" aria-pressed="${t === k}">${n}</button>`
      )
      .join('')}</div></div>`;
    if (MST.on || !C()) {
      openModal(`<div class="wz-head"><h2>Ajustes</h2><button class="b sm" data-act="close-modal">Cerrar</button></div>
      ${MST.on ? '<button class="b opt" data-act="master-off"><span><b>Modo jugador</b><br><small>Vuelve a tus fichas de personaje</small></span><span aria-hidden="true">›</span></button>' : '<button class="b opt" data-act="master-on"><span><b>Cambiar a modo máster</b><br><small>Seguimiento de turnos y características de tus jugadores</small></span><span aria-hidden="true">›</span></button>'}
      ${themeRow}
      <button class="b opt" data-act="open-credits"><span><b>Créditos y aviso legal</b><br><small>Aviso de contenido de fans y licencias</small></span><span aria-hidden="true">›</span></button>`);
      return;
    }
    openModal(`<div class="wz-head"><h2>Ajustes</h2><button class="b sm" data-act="close-modal">Cerrar</button></div>
    <button class="b opt" data-act="levelup" ${C().level >= 20 ? 'disabled' : ''}><span><b>Subir de nivel</b><br><small>${C().level >= 20 ? 'Ya estás en el nivel máximo' : `Asistente para pasar a nivel ${C().level + 1}`}</small></span><span aria-hidden="true">›</span></button>
    <button class="b opt" data-act="open-edit"><span><b>Editar ficha</b><br><small>Características, habilidades, armas, conjuros, rasgos y objetos</small></span><span aria-hidden="true">›</span></button>
    <details class="setgrp"><summary class="b opt"><span><b>Máster</b><br><small>Modo máster, recibir del máster y compartir con él</small></span><span class="chev" aria-hidden="true">›</span></summary><div class="setgrp-in">
      <button class="b opt" data-act="master-on"><span><b>Cambiar a modo máster</b><br><small>Seguimiento de turnos, tiendas y características de tus jugadores</small></span><span aria-hidden="true">›</span></button>
      <button class="b opt" data-act="p-scan"><span><b>Recibir del máster</b><br><small>Escanea su QR o importa su archivo .json (por ejemplo, una tienda)</small></span><span aria-hidden="true">›</span></button>
      <button class="b opt" data-act="share-open"><span><b>Compartir con el máster</b><br><small>QR o archivo con tus características, CA y percepción pasiva</small></span><span aria-hidden="true">›</span></button>
    </div></details>
    ${themeRow}
    <button class="b opt" data-act="open-data"><span><b>Copia de seguridad</b><br><small>Importar y exportar fichas</small></span><span aria-hidden="true">›</span></button>
    <button class="b opt" data-act="tour-replay"><span><b>Ver tutorial</b><br><small>Repite la visita guiada y vuelve a activar las pistas</small></span><span aria-hidden="true">›</span></button>
    <button class="b opt" data-act="open-credits"><span><b>Créditos y aviso legal</b><br><small>Aviso de contenido de fans y licencias</small></span><span aria-hidden="true">›</span></button>`);
  },
  theme: el => {
    setTheme(el.dataset.v);
    render();
    A.settings();
  },
  'open-credits': () =>
    openModal(
      `<div class="wz-head"><h2>Créditos y aviso legal</h2><button class="b sm" data-act="close-modal">Cerrar</button></div><div class="credits">${CREDITS}</div>`
    ),
  'tour-next': () => {
    if (!TOUR) return;
    if (TOUR.i < TOUR.steps.length - 1) {
      TOUR.i++;
      tourDraw();
    } else tourEnd();
  },
  'tour-prev': () => {
    if (TOUR && TOUR.i > 0) {
      TOUR.i--;
      tourDraw();
    }
  },
  'tour-skip': () => tourEnd(),
  'tips-off': () => {
    TIPS.off = 1;
    tourEnd();
    toast(
      '<div class="t-label">Pistas desactivadas</div><div class="t-parts">Puedes volver a verlas desde el engranaje → «Ver tutorial».</div>'
    );
  },
  'tour-replay': () => {
    closeModal();
    TIPS = { tour: 0, seen: {}, off: 0 };
    tipsSet(TIPS);
    S.tab = 'play';
    save();
    render();
    scrollTo(0, 0);
  },
});
