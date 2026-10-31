/* Tutorial guiado y pistas por sección. */
'use strict';

/* Se guarda por dispositivo (no en la ficha). tour: visita guiada vista; seen: pistas vistas; off: sin pistas */
const TIPK = 'fichas-tips';
let TIPS = null,
  TOUR = null;
function tipsSet(t) {
  try {
    localStorage.setItem(TIPK, JSON.stringify(t));
  } catch (e) {}
}
function tipsInit() {
  try {
    TIPS = JSON.parse(localStorage.getItem(TIPK));
  } catch (e) {
    TIPS = null;
  }
  // Quien ya tenía fichas antes de que existiera el tutorial no lo ve de golpe (lo tiene en el engranaje)
  if (!TIPS || typeof TIPS !== 'object') {
    TIPS = S.chars.length
      ? { tour: 1, seen: { play: 1, combat: 1, combatTab: 1, crea: 1, inv: 1, vida: 1 }, off: 0 }
      : { tour: 0, seen: {}, off: 0 };
    tipsSet(TIPS);
  }
  if (!TIPS.seen) TIPS.seen = {};
}
const TOUR_STEPS = [
  {
    t: '¡Bienvenido!',
    d: 'Te enseño la ficha en un minuto. Puedes saltarlo cuando quieras y repetirlo desde el engranaje.',
  },
  {
    sel: '#top .hpbox',
    t: 'Puntos de golpe',
    d: 'Toca aquí para recibir daño, curarte, añadir PG temporales y marcar estados. Dentro también tienes tus dados de golpe.',
  },
  {
    sel: '#top .vit .stat',
    t: 'CA, iniciativa y velocidad',
    d: 'Se calculan solas con tu armadura, tus características y tus estados. Toca cualquiera para ver de dónde sale.',
  },
  {
    sel: '#top .slotline',
    t: 'Espacios de conjuro',
    d: 'Cada rombo es un espacio. Se gastan solos al lanzar un conjuro y vuelven al descansar. También puedes tocarlos para marcarlos a mano.',
  },
  {
    sel: '#top .ctl.quick',
    t: 'Accesos rápidos',
    d: 'Descansar (zZ), diario de partida, deshacer el último cambio, inspiración heroica, mochila y dinero.',
  },
  {
    sel: '#top .effrow',
    t: 'Estados y efectos',
    d: 'Aquí aparecen la concentración, los estados y los efectos con duración. Los efectos se quitan solos cuando se acaban.',
  },
  {
    sel: '#top .tabs',
    t: 'Pestañas',
    d: 'Partida: tu ficha para jugar. Combate: tu turno, con acciones y ataques. Criaturas: familiares, invocaciones y formas.',
  },
  {
    sel: '#top .avatar-btn',
    t: 'Tu personaje',
    d: 'Retrato, personalidad, historia e idiomas. Tocando el nombre cambias de personaje o creas otro.',
  },
  {
    sel: '#top .gear',
    t: 'Ajustes',
    d: 'Subir de nivel, editar la ficha, el tema, las copias de seguridad y repetir este tutorial.',
  },
  {
    sel: '#view .card',
    t: 'Partida',
    d: 'Características, habilidades, ataques, conjuros y rasgos. Toca cualquier nombre para ver qué hace y qué tienes que tirar.',
  },
  {
    t: '¡Listo!',
    d: 'La primera vez que abras cada sección te saldrá una pista corta. Si ya lo controlas, puedes desactivarlas.',
  },
];
const TIPS_DEF = {
  combatTab: [
    {
      sel: '[data-act=cb-start]',
      t: 'Combate',
      d: 'Cuando empiece una pelea, pulsa «Iniciar combate». Llevarás la cuenta de las rondas y te explico esta pestaña.',
    },
  ],
  combat: [
    {
      sel: '.turn .pills',
      t: 'Tu turno',
      d: 'En cada turno tienes una acción, una acción adicional y una reacción. Se marcan como gastadas cuando usas algo.',
    },
    {
      sel: '.turn .tgrid',
      t: 'Qué puedes hacer',
      d: 'Tus ataques, conjuros, rasgos y objetos, ordenados según lo que gastan. Al pulsar te dice qué tirar y lo descuenta todo (espacios, munición, usos…).',
    },
    {
      sel: '[data-act=t-end]',
      t: 'Terminar turno',
      d: 'Recupera tus acciones, baja las rondas de los efectos y suma una ronda al contador.',
    },
    {
      sel: '[data-act=cb-end]',
      t: 'Terminar combate',
      d: 'Cuando acabe la pelea: quita el contador y te deja elegir qué efectos de rondas y qué estados (Derribado, Agarrado…) se acaban.',
    },
  ],
  crea: [
    {
      sel: '[data-act=crea-new]',
      t: 'Criaturas y formas',
      d: 'Añade familiares, compañeros, monturas, invocaciones o las formas en las que te transformas. Elige del catálogo y las estadísticas se rellenan solas.',
    },
  ],
  inv: [
    {
      sel: '#inv-body [data-act=item-new]',
      t: 'Mochila',
      d: 'Añade objetos del catálogo: armas, armaduras, pociones, herramientas, kits… Muchos tienen botones para usarlos directamente.',
    },
    {
      sel: '#inv-body .counter',
      t: 'Cantidades',
      d: 'Con − y + cambias cuántos llevas. Si algo llega a 0, te pregunta si quieres quitarlo.',
    },
  ],
  vida: [
    {
      sel: '#vida-body .hpctl',
      t: 'Daño y curación',
      d: 'Escribe la cantidad y pulsa Daño, Curar o PG temporales. El daño gasta primero los PG temporales.',
    },
    {
      sel: '#vida-body .chips',
      t: 'Estados',
      d: 'Toca un estado para activarlo o quitarlo. Los que te impiden actuar bloquean tus acciones en Combate.',
    },
  ],
};
const tourEls = s =>
  s.sel ? [...document.querySelectorAll(s.sel)].filter(e => e.getClientRects().length) : [];
function tourStart(key, steps) {
  steps = steps.filter(s => !s.sel || tourEls(s).length);
  if (!steps.length) return;
  TOUR = { key, steps, i: 0 };
  tourDraw();
}
function tourEnd() {
  if (!TOUR) return;
  if (TOUR.key === 'tour') {
    TIPS.tour = 1;
    TIPS.seen.play = 1;
  } else TIPS.seen[TOUR.key] = 1;
  tipsSet(TIPS);
  TOUR = null;
  const o = $('#tour');
  if (o) o.remove();
}
function tourDraw() {
  let o = $('#tour');
  if (!o) {
    o = document.createElement('div');
    o.id = 'tour';
    document.body.appendChild(o);
  }
  const s = TOUR.steps[TOUR.i],
    n = TOUR.steps.length,
    last = TOUR.i === n - 1,
    isTour = TOUR.key === 'tour',
    els = tourEls(s);
  if (els[0]) {
    const r = els[0].getBoundingClientRect();
    if (r.top < 0 || r.bottom > innerHeight) els[0].scrollIntoView({ block: 'center' });
  }
  const left = isTour
    ? last
      ? '<button class="b sm link" data-act="tips-off">Sin pistas</button>'
      : '<button class="b sm link" data-act="tour-skip">Saltar</button>'
    : '<button class="b sm link" data-act="tips-off">No mostrar más pistas</button>';
  o.innerHTML = `<div class="tour-hole" ${els.length ? '' : 'hidden'}></div>${els.length ? '' : '<div class="tour-dim"></div>'}<div class="tour-bub" role="dialog" aria-modal="true" aria-labelledby="tour-t">${n > 1 ? `<div class="tour-n">${TOUR.i + 1} de ${n}</div>` : ''}<h3 id="tour-t">${s.t}</h3><p>${s.d}</p>
    <div class="tour-btns">${left}<span class="sp"></span>${TOUR.i ? '<button class="b sm" data-act="tour-prev">Atrás</button>' : ''}<button class="b sm pri" data-act="tour-next">${last ? (isTour ? 'Empezar' : 'Entendido') : 'Siguiente'}</button></div></div>`;
  tourPlace();
  o.querySelector('[data-act=tour-next]').focus({ preventScroll: true });
}
function tourPlace() {
  const o = $('#tour');
  if (!o || !TOUR) return;
  const s = TOUR.steps[TOUR.i],
    els = tourEls(s),
    hole = o.querySelector('.tour-hole'),
    bub = o.querySelector('.tour-bub');
  const VW = document.documentElement.clientWidth,
    VH = innerHeight,
    g = 12,
    bw = Math.min(340, VW - 2 * g);
  bub.style.width = bw + 'px';
  if (!els.length) {
    bub.style.left = (VW - bw) / 2 + 'px';
    bub.style.top = Math.max(g, (VH - bub.offsetHeight) / 2) + 'px';
    return;
  }
  let x1 = 1e9,
    y1 = 1e9,
    x2 = -1e9,
    y2 = -1e9;
  els.forEach(e => {
    const r = e.getBoundingClientRect();
    x1 = Math.min(x1, r.left);
    y1 = Math.min(y1, r.top);
    x2 = Math.max(x2, r.right);
    y2 = Math.max(y2, r.bottom);
  });
  const p = 6;
  x1 = Math.max(4, x1 - p);
  y1 = Math.max(4, y1 - p);
  x2 = Math.min(VW - 4, x2 + p);
  y2 = Math.min(VH - 4, y2 + p);
  Object.assign(hole.style, {
    left: x1 + 'px',
    top: y1 + 'px',
    width: Math.max(0, x2 - x1) + 'px',
    height: Math.max(0, y2 - y1) + 'px',
  });
  const bh = bub.offsetHeight,
    top = y2 + 10 + bh <= VH - g ? y2 + 10 : y1 - 10 - bh >= g ? y1 - 10 - bh : VH - bh - g;
  bub.style.left = Math.min(Math.max(g, (x1 + x2) / 2 - bw / 2), VW - bw - g) + 'px';
  bub.style.top = top + 'px';
}
function tipMaybe(key) {
  if (!TIPS || TOUR || !TIPS.tour || TIPS.off || TIPS.seen[key] || !TIPS_DEF[key]) return;
  setTimeout(() => {
    if (TOUR || TIPS.seen[key] || TIPS.off) return;
    tourStart(key, TIPS_DEF[key]);
  }, 350);
}
function tourMaybe() {
  if (!TIPS || TOUR || !C()) return;
  if (!TIPS.tour) {
    if (!$('#modal').hidden || !['play', 'combat', 'crea'].includes(S.tab)) return;
    setTimeout(() => {
      if (TOUR || TIPS.tour || !$('#modal').hidden || !C()) return;
      if (S.tab !== 'play') {
        S.tab = 'play';
        save();
        render();
      }
      scrollTo(0, 0);
      tourStart('tour', TOUR_STEPS);
    }, 400);
    return;
  }
  if ($('#modal').hidden) {
    if (S.tab === 'crea') tipMaybe('crea');
    else if (S.tab === 'combat') tipMaybe(C().combat ? 'combat' : 'combatTab');
  }
}
