/* Barra superior: PG, estadísticas, espacios, controles rápidos, efectos y pestañas. */
'use strict';

function pips(kind, a, T, filled) {
  let h = '<span class="pips">';
  for (let k = 0; k < T; k++)
    h += `<button class="pip${k < filled ? ' full' : ''}" data-act="pip" data-kind="${kind}" data-a="${a}" data-i="${k}" aria-label="Casilla ${k + 1} de ${T}"></button>`;
  return h + '</span>';
}
function slotLine(c) {
  const parts = [];
  c.slots.forEach((x, i) => {
    if (x.total > 0)
      parts.push(
        `<span class="sl" title="Espacios de nivel ${i + 1}">${pips('slot', i, x.total, x.total - x.used)}</span>`
      );
  });
  if (c.pact.total > 0)
    parts.push(
      `<span class="sl" title="Espacios de pacto (nivel ${c.pact.level})">${pips('pact', 0, c.pact.total, c.pact.total - c.pact.used)}</span>`
    );
  return parts.length ? `<div class="slotline">${parts.join('')}</div>` : '';
}
const INFO_DESC = {
  'Daño de furia': 'Daño extra que sumas a tus ataques con Fuerza mientras estás en furia.',
  'Maestrías con armas':
    'Cuántas armas puedes usar con su propiedad de maestría. Puedes cambiar una tras un descanso largo.',
  'Dado de inspiración':
    'El dado que das con Inspiración bárdica. Quien lo tiene puede sumarlo a una tirada d20 que falle.',
  'Dado de superioridad': 'El dado que gastas en tus maniobras (Maestro de batalla).',
  'Dado psiónico': 'El dado de tu energía psiónica, que gastas en tus poderes de subclase.',
  'Dado de artes marciales':
    'El daño de tus golpes sin armas y de tus armas de monje (puedes usar DES para atacar con ellas).',
  'Movimiento sin armadura': 'Pies que sumas a tu velocidad si no llevas armadura ni escudo.',
  'Ataque furtivo':
    'Daño extra, una vez por turno, si atacas con un arma sutil o a distancia y tienes ventaja (o un aliado está junto al objetivo).',
  'Metamagias conocidas':
    'Cuántas opciones de Metamagia conoces para modificar tus conjuros gastando puntos de hechicería.',
  Invocaciones:
    'Poderes especiales del brujo. Unos funcionan siempre, otros te dejan lanzar un conjuro sin gastar espacio y otros tienen un coste concreto. Ninguno gasta espacios de conjuro.',
};
function openInfo() {
  const c = C(),
    info = infoFor(defOf(c), subOf(c), c.level);
  const row = (lbl, k, val, desc) =>
    desc
      ? `<details class="inforow"><summary><span>${esc(lbl)}</span><b>${esc(val)}</b></summary><p class="hint">${esc(desc)}</p></details>`
      : `<div class="inforow"><div class="isum"><span>${esc(lbl)}</span><b>${esc(val)}</b></div></div>`;
  const list = pre =>
    c.features
      .filter(f => norm(f.name).startsWith(norm(pre)))
      .map(
        f =>
          `<details><summary>${esc(f.name.replace(/^[^:]*:\s*/, ''))}</summary><p>${esc(f.text || '')}</p></details>`
      )
      .join('');
  openModal(
    `<div class="wz-head"><h2>Datos de ${esc(c.name || 'tu personaje')}</h2><button class="b sm" data-act="close-modal">Hecho</button></div>
    ${row('Bonificador de competencia', 'pb', sgn(pb(c)), 'Lo sumas a todo aquello en lo que eres competente: ataques, habilidades, salvaciones, herramientas y conjuros. Sube con el nivel.')}
    ${row('Percepción pasiva', 'passive', String(10 + skillB(c, SK.perception)), 'Lo que notas sin tirar dados. El máster la usa para ver si detectas enemigos escondidos, trampas o a quien te sigue.')}
    ${
      Object.keys(info).length
        ? `<h3>Datos de clase</h3>${Object.entries(info)
            .map(
              ([k, v]) =>
                row(k, '', String(v), INFO_DESC[k] || '') +
                (k === 'Invocaciones'
                  ? list('Invocación')
                  : k === 'Metamagias conocidas'
                    ? list('Metamagia')
                    : '')
            )
            .join('')}`
        : ''
    }`,
    true
  );
}
function renderTop() {
  const c = C(),
    fm = formOf(c),
    pct = c.hp.max ? clamp((c.hp.current / c.hp.max) * 100, 0, 100) : 0;
  const sub = [c.species, c.class && `${c.class} ${c.level}`, c.subclass, c.background]
    .filter(Boolean)
    .join(' · ');
  $('#top').innerHTML = `<div class="wrap"><div class="top-in">
    <button class="avatar-btn ${S.tab === 'pj' ? 'on' : ''}" data-act="tab" data-t="pj" aria-label="Retrato, personalidad e historia" title="Retrato, personalidad e historia" aria-pressed="${S.tab === 'pj'}">${c.story.img ? `<img class="avatar" src="${c.story.img}" alt="">` : `<span class="avatar ph" aria-hidden="true">${esc((c.name || '?').trim().charAt(0).toUpperCase() || '?')}</span>`}</button><div class="whorow"><button class="who" data-act="chars" aria-label="Cambiar de personaje"><div class="nm">${esc(c.name || 'Sin nombre')}<span class="caret" aria-hidden="true">▾</span></div><div class="sub">${esc(sub)}</div></button></div>
    <div class="vit">
      <button class="hpbox" data-act="vida" aria-label="Vida y estado: daño, curación y estados"><div class="hpnum"><b>${c.hp.current}</b> / ${c.hp.max}${c.hp.temp ? `<em>+${c.hp.temp}</em>` : ''}</div><div class="bar"><i class="${pct <= 25 ? 'low' : ''}" style="width:${pct}%"></i></div><small>Puntos de golpe</small></button>
      <button class="stat" data-act="gloss" data-k="ca"><b>${fm ? formAC(c, fm) : acOf(c)}</b><small>CA</small></button>
      <button class="stat" data-act="gloss" data-k="init"><b>${sgn(init(c))}</b><small>Inic.</small></button>
      <button class="stat" data-act="gloss" data-k="speed"><b>${Math.max(0, (fm && parseInt(fm.speed) >= 0 ? parseInt(fm.speed) : c.speedFt - (armorAuto(c) && acCalc(c).slow ? 10 : 0)) - 5 * (+c.exhaustion || 0))}</b><small>pies</small></button>
    </div>
    ${slotLine(c)}
    <div class="ctl quick">
      <div class="menuwrap"><button class="b qbtn icon" data-act="rest-menu" title="Descansar" aria-haspopup="true" aria-expanded="${restOpen}" aria-label="Descansar"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 8h7l-7 9h7M14 4h6l-6 7.5h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        ${restOpen ? `<div class="popmenu" role="menu"><button class="b opt" role="menuitem" data-act="short"><span><b>Descanso corto</b><br><small>1 hora · dados de golpe</small></span></button><button class="b opt" role="menuitem" data-act="long"><span><b>Descanso largo</b><br><small>8 horas · lo recuperas todo</small></span></button></div>` : ''}</div>
      <button class="b qbtn icon" data-act="diary" title="Diario" aria-label="Diario"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M5 4.5h10a1.5 1.5 0 0 1 1.5 1.5v13.5H6.5A1.5 1.5 0 0 1 5 18z"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M8 8.5h5.5M8 11.5h4"/><path fill="currentColor" d="M19.6 7.2l1.2 1.2-6.3 6.3-1.8.6.6-1.8z"/></svg></button>
      <button class="b qbtn icon" data-act="undo" title="Deshacer" aria-label="Deshacer el último cambio" ${UNDO.length ? '' : 'disabled'}><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 14L4 9l5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <button class="b qbtn insp ${c.inspiration ? 'on' : ''}" data-act="insp" aria-pressed="${!!c.inspiration}" title="${c.inspiration ? 'Tienes inspiración heroica (toca para gastarla)' : 'Sin inspiración heroica (toca para ganarla)'}" aria-label="Inspiración heroica"><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path class="st" d="M12 2.5c.6 4.6 2.9 6.9 7.5 7.5-4.6.6-6.9 2.9-7.5 7.5-.6-4.6-2.9-6.9-7.5-7.5 4.6-.6 6.9-2.9 7.5-7.5z"/><path class="sm" d="M19 15.5c.25 1.7 1.05 2.5 2.75 2.75-1.7.25-2.5 1.05-2.75 2.75-.25-1.7-1.05-2.5-2.75-2.75 1.7-.25 2.5-1.05 2.75-2.75zM5 15.8c.2 1.3.8 1.9 2.1 2.1-1.3.2-1.9.8-2.1 2.1-.2-1.3-.8-1.9-2.1-2.1 1.3-.2 1.9-.8 2.1-2.1z"/></svg></button>
      <button class="b qbtn inv" data-act="inv" title="Objetos" aria-label="Objetos"><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M9 5.5V4.2A1.7 1.7 0 0 1 10.7 2.5h2.6A1.7 1.7 0 0 1 15 4.2v1.3" fill="none" stroke="#5e3a17" stroke-width="1.6"/><path d="M5 10.5A5 5 0 0 1 10 5.5h4a5 5 0 0 1 5 5V19a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 19z" fill="#9a6532" stroke="#5e3a17" stroke-width="1.2"/><path d="M5.2 11.5h13.6v2.3a1.8 1.8 0 0 1-1.8 1.8H7a1.8 1.8 0 0 1-1.8-1.8z" fill="#b97d43" stroke="#5e3a17" stroke-width="1.1"/><rect x="10.3" y="13.4" width="3.4" height="2.8" rx=".6" fill="#e6bd4f" stroke="#7a5212" stroke-width=".9"/><path d="M8 17.5v2.6M16 17.5v2.6" stroke="#5e3a17" stroke-width="1.2" stroke-linecap="round"/></svg></button>
      <button class="b qbtn money" data-act="money" aria-label="Dinero"><span class="coin" aria-hidden="true"></span><span>${(Math.floor(totalCp(c) / 10) / 10).toLocaleString('es-ES')} PO</span></button>
    </div>
    ${effectsBar(c)}</div>
    <div class="tabrow"><nav class="tabs">${[
      ['play', 'Partida'],
      ['combat', 'Combate'],
      ['crea', 'Criaturas'],
    ]
      .map(
        ([t, n]) =>
          `<button class="${S.tab === t || (t === 'pj' && (S.tab === 'edit' || S.tab === 'data')) ? 'on' : ''}" data-act="tab" data-t="${t}">${esc(n)}${t === 'combat' && c.combat ? '<span class="live" title="En combate"></span>' : ''}</button>`
      )
      .join('')}</nav>
    <button class="b gear" data-act="settings" aria-label="Ajustes"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1L15 3.3h-4l-.4 2.6a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.4 7.4 0 0 0 1.7 1l.4 2.6h4l.4-2.6a7.4 7.4 0 0 0 1.7-1l2.5 1 2-3.5zM13 15.5A3.5 3.5 0 1 1 13 8.5a3.5 3.5 0 0 1 0 7z" transform="translate(-1 0)"/></svg></button></div></div>`;
}
