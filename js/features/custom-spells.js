/* Conjuros propios: crearlos y editarlos desde la tarjeta de Magia, y exportarlos o importarlos en un archivo .json. */
'use strict';

const CS_TIMES = [
  ['A', 'Acción'],
  ['AA', 'Acción adicional'],
  ['R', 'Reacción'],
  ['1 minuto', '1 minuto'],
  ['10 minutos', '10 minutos'],
  ['1 hora', '1 hora'],
  ['8 horas', '8 horas'],
];
const CS_FIELDS = ['level', 'name', 'time', 'range', 'dur', 'conc', 'ritual', 'material', 'desc'];
/* Un conjuro es propio si no viene del catálogo ni de un rasgo */
const csOwn = sp => !sp.ref && !sp.src;
/* Biblioteca de conjuros propios del dispositivo, para que sigan en «Buscar conjuros» aunque se quiten de una ficha */
const CS_KEY = 'fichas-propios';
function csStored() {
  try {
    const x = JSON.parse(localStorage.getItem(CS_KEY) || '[]');
    return Array.isArray(x) ? x.filter(s => s && s.name) : [];
  } catch (e) {
    return [];
  }
}
function csStore(list) {
  try {
    localStorage.setItem(CS_KEY, JSON.stringify(list));
  } catch (e) {}
}
const csFields = sp => Object.fromEntries(CS_FIELDS.map(k => [k, sp[k]]));
function csRemember(sp) {
  const k = `${norm(sp.name)}|${+sp.level || 0}`,
    list = csStored().filter(s => `${norm(s.name)}|${+s.level || 0}` !== k);
  list.push(csFields(sp));
  csStore(list);
}
function csForget(sp) {
  const k = `${norm(sp.name)}|${+sp.level || 0}`;
  csStore(csStored().filter(s => `${norm(s.name)}|${+s.level || 0}` !== k));
}

/* Ventana para crear (i = -1) o editar un conjuro propio */
function csOpen(i) {
  const c = C(),
    sp = i >= 0 ? c.spells[i] : NEW.spells();
  if (!sp) return;
  const opt = (v, list) =>
    list
      .map(
        ([k, n]) =>
          `<option value="${esc(k)}" ${String(v) === String(k) ? 'selected' : ''}>${esc(n)}</option>`
      )
      .join('');
  openModal(
    `<div class="wz-head"><h2>${i >= 0 ? 'Editar conjuro' : 'Crear conjuro'}</h2><button class="b sm" data-act="close-modal">Cancelar</button></div>
    <div class="grid">
      <label class="f wide"><span>Nombre</span><input id="cs-name" value="${esc(sp.name)}" autocomplete="off" placeholder="Rayo de sombras"></label>
      <label class="f"><span>Nivel</span><select id="cs-level">${opt(+sp.level || 0, [['0', 'Truco'], ...Array.from({ length: 9 }, (_, k) => [String(k + 1), `Nivel ${k + 1}`])])}</select></label>
      <label class="f"><span>Tiempo de lanzamiento</span><select id="cs-time">${opt(sp.time || 'A', CS_TIMES)}</select></label>
      <label class="f"><span>Alcance</span><input id="cs-range" value="${esc(sp.range)}" placeholder="60 pies, Toque, Personal…"></label>
      <label class="f"><span>Duración</span><input id="cs-dur" value="${esc(sp.dur)}" placeholder="Instantánea, 1 minuto…"></label>
      <label class="f wide"><span>Componente material (si tiene)</span><input id="cs-material" value="${esc(sp.material)}" placeholder="Una pluma de cuervo"></label>
      <div class="wide cs-chks"><label class="chk"><input type="checkbox" id="cs-conc" ${sp.conc ? 'checked' : ''}> Concentración</label><label class="chk"><input type="checkbox" id="cs-ritual" ${sp.ritual ? 'checked' : ''}> Ritual</label></div>
      <label class="f wide"><span>Qué hace</span><textarea id="cs-desc" rows="6" placeholder="Describe el efecto: a quién afecta, qué salvación o ataque pide, cuánto daño hace…">${esc(sp.desc)}</textarea></label>
    </div>
    <p class="hint">Se guarda en esta ficha y sale en tu Magia y en Combate como los demás. Puedes pasárselo a otros jugadores con «Exportar mis conjuros».</p>
    <div class="btns"><button class="b pri" data-act="cs-save" data-i="${i}">${i >= 0 ? 'Guardar' : 'Crear conjuro'}</button>${i >= 0 ? `<button class="b bad" data-act="cs-del" data-i="${i}">Borrar</button>` : ''}</div>`,
    true
  );
  setTimeout(() => $('#cs-name') && !sp.name && $('#cs-name').focus(), 0);
}
function csRead() {
  return {
    level: clamp(parseInt($('#cs-level').value) || 0, 0, 9),
    name: $('#cs-name').value.trim(),
    time: $('#cs-time').value,
    range: $('#cs-range').value.trim(),
    dur: $('#cs-dur').value.trim(),
    material: $('#cs-material').value.trim(),
    conc: $('#cs-conc').checked,
    ritual: $('#cs-ritual').checked,
    desc: $('#cs-desc').value.trim(),
  };
}
/* Ventana para elegir qué conjuros propios se exportan */
function csExportOpen() {
  const c = C(),
    own = c.spells.map((sp, i) => [sp, i]).filter(([sp]) => csOwn(sp));
  if (!own.length) {
    openModal(
      `<h2>Exportar mis conjuros</h2><p>Esta ficha no tiene conjuros propios todavía.</p><p class="hint">Créalos con «Crear conjuro» en la tarjeta de Magia.</p><div class="btns"><button class="b" data-act="close-modal">Vale</button></div>`
    );
    return;
  }
  openModal(`<h2>Exportar mis conjuros</h2><p class="hint">Marca los que quieras pasar. Se descarga un archivo .json que tus compañeros importan con «Importar conjuros».</p>
    <div class="stack">${own.map(([sp, i]) => `<label class="chk"><input type="checkbox" data-csx="${i}" checked> ${esc(sp.name)} <small>(${+sp.level ? `nivel ${sp.level}` : 'truco'})</small></label>`).join('')}</div>
    <div class="btns"><button class="b pri" data-act="cs-exp-ok">Exportar archivo .json</button><button class="b" data-act="close-modal">Cancelar</button></div>`);
}
function csExport() {
  const c = C(),
    pick = [...document.querySelectorAll('[data-csx]')]
      .filter(x => x.checked)
      .map(x => c.spells[+x.dataset.csx]);
  if (!pick.length) {
    toast('<div class="t-parts">Marca al menos un conjuro.</div>');
    return;
  }
  const datos = pick.map(sp => Object.fromEntries(CS_FIELDS.map(k => [k, sp[k]])));
  download(
    `conjuros-${fileSlug(c.name || 'personaje')}.json`,
    JSON.stringify({ fichas5e: 'conjuros', datos }, null, 2)
  );
  closeModal();
}
/* Añade a la ficha los conjuros de un archivo; se salta los que ya tiene (mismo nombre y nivel) */
function csImport(text) {
  let list = null;
  try {
    const o = JSON.parse(text);
    list = o && o.fichas5e === 'conjuros' && Array.isArray(o.datos) ? o.datos : Array.isArray(o) ? o : null;
  } catch (e) {}
  if (!list) {
    toast(
      '<div class="t-parts">Ese archivo no es de conjuros de Fichas 5e. Pídelo con «Exportar mis conjuros».</div>'
    );
    return;
  }
  const c = C();
  let added = 0,
    dup = 0;
  for (const x of list.slice(0, 200)) {
    if (!x || !String(x.name || '').trim()) continue;
    const sp = Object.assign(NEW.spells(), {
      level: clamp(parseInt(x.level) || 0, 0, 9),
      name: String(x.name).trim().slice(0, 80),
      time: CS_TIMES.some(t => t[0] === x.time) ? x.time : 'A',
      range: String(x.range || '').slice(0, 80),
      dur: String(x.dur || '').slice(0, 80),
      material: String(x.material || '').slice(0, 200),
      conc: !!x.conc,
      ritual: !!x.ritual,
      desc: String(x.desc || '').slice(0, 4000),
    });
    if (c.spells.some(s => norm(s.name) === norm(sp.name) && +s.level === sp.level)) {
      dup++;
      continue;
    }
    c.spells.push(sp);
    csRemember(sp);
    added++;
  }
  c.spells.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'es'));
  save();
  render();
  toast(
    `<div class="t-label">Conjuros importados</div><div class="t-parts">${added ? `${added} ${added === 1 ? 'añadido' : 'añadidos'} a tu Magia.` : 'Ninguno nuevo.'}${dup ? ` ${dup} ya ${dup === 1 ? 'lo tenías' : 'los tenías'}.` : ''}</div>`
  );
}
