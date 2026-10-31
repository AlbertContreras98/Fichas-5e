/* Personajes: lista, importar/exportar, datos, historia y retrato. */
'use strict';

function example() {
  const e = blank();
  delete e.id;
  e.attacks = [NEW.attacks()];
  e.spells = [NEW.spells()];
  e.features = [NEW.features()];
  e.equipment = [NEW.equipment()];
  delete e.equipment[0].id;
  return e;
}
function prompt4Claude() {
  return `Convierte la ficha de personaje de quinta edición (reglas de 2024) que te adjunto a JSON para mi app de fichas. Usa exactamente esta estructura y estas claves:
- classKey: una de ${Object.keys(CL).join(', ')}; subclassKey: la subclase si la tiene (déjala vacía si no).
- abilities: puntuaciones (no modificadores). saveProf: salvaciones con competencia (str, dex, con, int, wis, cha).
- skills: 1 = competencia, 2 = pericia. Claves: ${SKILLS.map(s => s[0]).join(', ')}.
- slots: 9 entradas, una por nivel de conjuro (total = espacios). Los espacios de brujo van en "pact" (level y total), no en "slots".
- spells: time "A" acción, "AA" acción adicional, "R" reacción u otro texto. Pon en "ref" el nombre en inglés del conjuro en minúsculas y con guiones (p. ej. "hellish-rebuke") para enlazarlo con la base de datos.
- attacks.atk: bonificador de ataque como número; dmg: fórmula como "1d6+2".
- equipment.cat: arma, armadura, municion, pocion, comida, consumible, herramienta, tesoro u otro.
- features: rasgos de especie y clase y dotes; uses.max y uses.recover ("corto", "corto1" o "largo") solo si tienen usos limitados.
- Lo que no aparezca en la ficha, déjalo con el valor por defecto. Devuelve solo el JSON.

${JSON.stringify(example(), null, 2)}`;
}
let charMenu = '';
function charsHTML() {
  return `<div class="wz-head"><h2>Personajes</h2><button class="b sm" data-act="close-modal">Cerrar</button></div>
  <div class="charlist">${S.chars
    .map(
      x => `<div class="charrow ${x.id === S.active ? 'on' : ''}">
      <button class="charpick" data-act="use" data-id="${x.id}">${x.story && x.story.img ? `<img class="avatar sm" src="${x.story.img}" alt="">` : '<span class="avatar sm ph" aria-hidden="true"></span>'}<span><b>${esc(x.name || 'Sin nombre')}</b><small>${esc([x.species, x.class && `${x.class} ${x.level}`].filter(Boolean).join(' · ') || 'Sin datos')}${x.id === S.active ? ' · en uso' : ''}</small></span></button>
      <button class="b sm sq" data-act="char-menu" data-id="${x.id}" aria-label="Más opciones de ${esc(x.name)}" aria-expanded="${charMenu === x.id}">⋯</button>
      ${charMenu === x.id ? `<div class="charmenu"><button class="b sm" data-act="dup" data-id="${x.id}">Duplicar</button><button class="b sm bad" data-act="delchar" data-id="${x.id}">Borrar</button></div>` : ''}
    </div>`
    )
    .join('')}</div>
  <div class="btns"><button class="b pri" data-act="create">Crear personaje paso a paso</button><button class="b" data-act="newchar">Crear ficha vacía</button></div>`;
}
function openChars() {
  openModal(charsHTML());
}
function viewData(c) {
  return `<div class="ed">
  <div class="ed-head"><h2>${c ? 'Copia de seguridad' : 'Importar ficha'}</h2><button class="b pri" data-act="tab" data-t="${c ? 'pj' : 'play'}">${c ? 'Hecho' : 'Volver'}</button></div>
  <p class="hint">Las fichas se guardan solo en este dispositivo. Exporta de vez en cuando para no perderlas o para pasarlas a otro dispositivo.</p>
  <section class="card"><h2>Importar</h2>
    <p class="hint">Pega el JSON de una ficha (o de varias) o elige un archivo .json. Para pasar una ficha en papel: escanéala, copia las instrucciones de abajo y pásaselas a Claude junto al escaneo; pega aquí lo que te devuelva.</p>
    <div class="btns" style="margin-bottom:.6rem"><button class="b" data-act="copy-prompt">Copiar instrucciones para Claude</button><label class="b" for="imp-file">Elegir archivo .json</label><input id="imp-file" type="file" accept=".json,application/json,text/plain" hidden></div>
    <textarea class="code" id="imp-text" placeholder='{"name": "…", "classKey": "…", …}'></textarea>
    <div class="btns" style="margin-top:.6rem"><button class="b pri" data-act="import">Importar</button></div><p class="hint" id="imp-msg" role="status"></p></section>
  ${
    c
      ? `<section class="card"><h2>Exportar</h2>
    <p class="hint">Abajo tienes la ficha de ${esc(c.name)}. «Copiar todas las fichas» guarda todos tus personajes de una vez.</p>
    <textarea class="code" id="exp-text" readonly>${esc(JSON.stringify(c, null, 2))}</textarea>
    <div class="btns" style="margin-top:.6rem"><button class="b pri" data-act="dl-exp">Descargar ficha (.json)</button><button class="b" data-act="dl-all">Descargar todas</button><button class="b" data-act="copy-exp">Copiar JSON</button><button class="b" data-act="copy-all">Copiar todas</button></div><p class="hint" style="margin-top:.4rem">Recomendado: descarga el archivo y, en el otro dispositivo, usa «Elegir archivo .json». Copiar y pegar puede cortar el texto si la ficha es grande (por ejemplo, con retrato).</p></section>`
      : ''
  }
  </div>`;
}
const CREDITS = `<p>Fichas 5e es contenido de fans no oficial permitido bajo la Fan Content Policy. No aprobado ni respaldado por Wizards. Partes de los materiales usados son propiedad de Wizards of the Coast. ©Wizards of the Coast LLC.</p><p>Esta app incluye material del System Reference Document 5.2 («SRD 5.2») de Wizards of the Coast LLC, disponible en https://www.dndbeyond.com/srd, bajo licencia Creative Commons Attribution 4.0 International (https://creativecommons.org/licenses/by/4.0/legalcode). Los textos de los conjuros están traducidos y adaptados al castellano. Los resúmenes de rasgos de clase y subclase están escritos para esta app; consulta el Manual del Jugador para el texto completo.</p>`;
const ALIGN = [
  '',
  'Legal bueno',
  'Neutral bueno',
  'Caótico bueno',
  'Legal neutral',
  'Neutral',
  'Caótico neutral',
  'Legal malvado',
  'Neutral malvado',
  'Caótico malvado',
];
function viewStory(c) {
  const st = c.story;
  if (st.appearance && st.appearance.trim()) {
    st.personality = `Apariencia: ${st.appearance.trim()}${st.personality ? '\n\n' + st.personality : ''}`;
    st.appearance = '';
    save();
  }
  return `<div class="story">
  <section class="card portrait-card"><h2>Retrato</h2>
    <div class="portrait">${st.img ? `<img src="${st.img}" alt="Retrato de ${esc(c.name)}">` : `<div class="portrait-empty">Sin imagen</div>`}</div>
    <div class="btns"><label class="b pri" for="story-img">${st.img ? 'Cambiar imagen' : 'Elegir imagen'}</label><input id="story-img" type="file" accept="image/*" hidden>${st.img ? '<button class="b bad" data-act="img-del">Quitar</button>' : ''}</div>
    <p class="hint">Desde la galería o la cámara. Se guarda reducida en este dispositivo.</p>
    <div class="grid">${sel(
      'Alineamiento',
      'story.alignment',
      st.alignment,
      ALIGN.map(a => [a, a || 'Sin especificar'])
    )}${inp('Edad', 'story.age', st.age, { ph: 'Ej. 23 años' })}${inp('Idiomas', 'languages', c.languages || '', { w: 'wide', ph: 'Común, Infernal…' })}</div></section>
  <div class="story-col">
  <section class="card"><h2>Personalidad</h2>
    <textarea id="f-story-personality" class="notes" data-path="story.personality" placeholder="Cómo es, qué valora, a quién o qué está unido, sus miedos y defectos…">${esc(st.personality)}</textarea></section>
  <section class="card"><h2>Historia</h2>
    <textarea id="f-story-history" class="notes tall" data-path="story.history" placeholder="De dónde viene, qué le ha pasado y por qué se ha hecho aventurero…">${esc(st.history)}</textarea></section>
  </div>
  </div>`;
}
function loadPortrait(file) {
  if (!file || !/^image\//.test(file.type)) {
    toast('<div class="t-parts">Ese archivo no es una imagen.</div>');
    return;
  }
  const url = URL.createObjectURL(file),
    img = new Image();
  img.onload = () => {
    const max = 900,
      k = Math.min(1, max / Math.max(img.width, img.height));
    const cv = document.createElement('canvas');
    cv.width = Math.round(img.width * k);
    cv.height = Math.round(img.height * k);
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    URL.revokeObjectURL(url);
    const c = C(),
      prev = c.story.img;
    c.story.img = cv.toDataURL('image/jpeg', 0.82);
    try {
      localStorage.setItem(KEY, JSON.stringify({ chars: S.chars, active: S.active, tab: S.tab }));
    } catch (e) {
      c.story.img = prev;
      toast(
        '<div class="t-label">No cabe la imagen</div><div class="t-parts">El almacenamiento del dispositivo está lleno. Prueba con otra imagen o quita retratos de otros personajes.</div>'
      );
      return;
    }
    render();
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    toast('<div class="t-parts">No se ha podido abrir la imagen.</div>');
  };
  img.src = url;
}
