/* Acciones — Ajustes, créditos y tutorial. */
'use strict';

Object.assign(A, {
  settings: () => {
    const t = getTheme();
    openModal(`<div class="wz-head"><h2>Ajustes</h2><button class="b sm" data-act="close-modal">Cerrar</button></div>
    <button class="b opt" data-act="levelup" ${C().level >= 20 ? 'disabled' : ''}><span><b>Subir de nivel</b><br><small>${C().level >= 20 ? 'Ya estás en el nivel máximo' : `Asistente para pasar a nivel ${C().level + 1}`}</small></span><span aria-hidden="true">›</span></button>
    <button class="b opt" data-act="open-edit"><span><b>Editar ficha</b><br><small>Características, habilidades, armas, conjuros, rasgos y objetos</small></span><span aria-hidden="true">›</span></button>
    <div class="setting"><b>Tema</b><div class="seg" role="group" aria-label="Tema">${[
      ['', 'Sistema'],
      ['light', 'Claro'],
      ['dark', 'Oscuro'],
    ]
      .map(
        ([k, n]) =>
          `<button class="${t === k ? 'on' : ''}" data-act="theme" data-v="${k}" aria-pressed="${t === k}">${n}</button>`
      )
      .join('')}</div></div>
    <button class="b opt" data-act="open-data"><span><b>Copia de seguridad</b><br><small>Importar y exportar fichas</small></span><span aria-hidden="true">›</span></button>
    <button class="b opt" data-act="tour-replay"><span><b>Ver tutorial</b><br><small>Repite la visita guiada y vuelve a activar las pistas</small></span><span aria-hidden="true">›</span></button>
    <button class="b opt" data-act="open-credits"><span><b>Créditos y aviso legal</b><br><small>Aviso de contenido de fans y licencia del SRD</small></span><span aria-hidden="true">›</span></button>`);
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
