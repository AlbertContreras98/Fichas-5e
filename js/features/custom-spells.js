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
const CS_FIELDS = [
  'level',
  'name',
  'time',
  'range',
  'dur',
  'conc',
  'ritual',
  'material',
  'desc',
  'hd',
  'wpn',
];
const CS_DMG = [
  'contundente',
  'cortante',
  'perforante',
  'ácido',
  'frío',
  'fuego',
  'fuerza',
  'necrótico',
  'psíquico',
  'radiante',
  'relámpago',
  'trueno',
  'veneno',
];
const CS_PROPS = [
  ['ligera', 'Ligera'],
  ['sutil', 'Sutil'],
  ['alcance', 'Alcance'],
  ['a dos manos', 'A dos manos'],
  ['arrojadiza', 'Arrojadiza'],
];
const CS_AB = [
  ['best', 'Aptitud mágica, FUE o DES (la mejor)'],
  ['spell', 'Solo la aptitud mágica'],
  ['phys', 'FUE (o DES si es sutil)'],
];
/* Lo que hace un conjuro propio en la app: dados de golpe que gasta y arma que crea */
function csClean(x) {
  const hd = x && x.hd === 'lvl' ? 'lvl' : clamp(parseInt(x && x.hd) || 0, 0, 20) || '';
  let w = x && x.wpn && typeof x.wpn === 'object' ? x.wpn : null;
  if (w)
    w = {
      n: String(w.n || 'Arma del conjuro').slice(0, 60),
      die:
        w.die === 'hd'
          ? 'hd'
          : /^\d{0,2}d(4|6|8|10|12|20)$/.test(String(w.die || '').replace(/\s/g, ''))
            ? String(w.die).replace(/\s/g, '')
            : 'hd',
      t: CS_DMG.includes(w.t) ? w.t : 'necrótico',
      ab: CS_AB.some(a => a[0] === w.ab) ? w.ab : 'best',
      p: (Array.isArray(w.p) ? w.p : []).filter(k => CS_PROPS.some(q => q[0] === k)),
      prof: w.prof !== false,
      fx: String(w.fx || '').slice(0, 300),
    };
  return { hd, wpn: w };
}
/* Dados de golpe que gasta al lanzarlo con un espacio de nivel L */
const csHdCost = (sp, L) => (sp.hd === 'lvl' ? Math.max(1, L || +sp.level || 1) : +sp.hd || 0);
/* Tirada de ataque y daño del arma que crea el conjuro */
function csWeaponAtk(c, w) {
  const str = M(c, 'str'),
    dex = M(c, 'dex'),
    spm = spMod(c),
    phys = w.p.includes('sutil') ? Math.max(str, dex) : str;
  const mod =
    w.ab === 'spell' && spm !== null ? spm : w.ab === 'best' && spm !== null ? Math.max(phys, spm) : phys;
  const die = w.die === 'hd' ? c.hitDice.die || 'd8' : w.die,
    d = /^d/.test(die) ? '1' + die : die;
  return {
    atk: mod + (w.prof ? pb(c) : 0),
    dmg: `${d}${mod ? ` ${mod > 0 ? '+' : '−'} ${Math.abs(mod)}` : ''}`,
  };
}
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
    ${csAppHTML(sp)}
    <p class="hint">Se guarda en esta ficha y sale en tu Magia y en Combate como los demás. Puedes pasárselo a otros jugadores con «Exportar mis conjuros».</p>
    <div class="btns"><button class="b pri" data-act="cs-save" data-i="${i}">${i >= 0 ? 'Guardar' : 'Crear conjuro'}</button>${i >= 0 ? `<button class="b bad" data-act="cs-del" data-i="${i}">Borrar</button>` : ''}</div>`,
    true
  );
  setTimeout(() => $('#cs-name') && !sp.name && $('#cs-name').focus(), 0);
}
/* Apartado «Qué hace en la app» del formulario */
function csAppHTML(sp) {
  const w = sp.wpn || { n: '', die: 'hd', t: 'necrótico', ab: 'best', p: [], prof: true, fx: '' };
  const opt = (v, list) =>
    list
      .map(
        ([k, n]) =>
          `<option value="${esc(k)}" ${String(v) === String(k) ? 'selected' : ''}>${esc(n)}</option>`
      )
      .join('');
  const custom = w.die !== 'hd';
  return `<h3>Qué hace en la app <small>(opcional)</small></h3>
    <p class="hint">Si lo rellenas, la app lo hace sola al lanzar el conjuro, y viaja con él al exportarlo.</p>
    <div class="grid">
      <label class="f wide"><span>Gasta dados de golpe al lanzarlo</span><select id="cs-hd">${opt(
        sp.hd || '',
        [
          ['', 'No'],
          ['1', '1 dado'],
          ['2', '2 dados'],
          ['3', '3 dados'],
          ['lvl', 'Tantos como el nivel del espacio (sangromancia)'],
        ]
      )}</select></label>
      <label class="chk wide"><input type="checkbox" id="cs-wpn" ${sp.wpn ? 'checked' : ''}> Crea un arma mientras dura el conjuro</label>
      <div class="wide" id="cs-wpn-f" ${sp.wpn ? '' : 'hidden'}><div class="grid">
        <label class="f wide"><span>Nombre del arma</span><input id="cs-wn" value="${esc(w.n)}" placeholder="Látigo de sangre"></label>
        <label class="f"><span>Daño</span><select id="cs-wdie">${opt(custom ? 'x' : 'hd', [
          ['hd', 'Tu dado de golpe'],
          ['x', 'Otro dado…'],
        ])}</select></label>
        <label class="f" id="cs-wdx-w" ${custom ? '' : 'hidden'}><span>Dado</span><input id="cs-wdx" value="${esc(custom ? w.die : '1d8')}" placeholder="1d8"></label>
        <label class="f"><span>Tipo de daño</span><select id="cs-wt">${opt(
          w.t,
          CS_DMG.map(t => [t, t.charAt(0).toUpperCase() + t.slice(1)])
        )}</select></label>
        <label class="f wide"><span>Ataque y daño con</span><select id="cs-wab">${opt(w.ab, CS_AB)}</select></label>
        <div class="wide cs-chks">${CS_PROPS.map(([k, n]) => `<label class="chk"><input type="checkbox" data-csp="${esc(k)}" ${w.p.includes(k) ? 'checked' : ''}> ${n}</label>`).join('')}<label class="chk"><input type="checkbox" id="cs-wprof" ${w.prof ? 'checked' : ''}> Eres competente</label></div>
        <label class="f wide"><span>Efecto al impactar (nota)</span><input id="cs-wfx" value="${esc(w.fx)}" placeholder="El máximo de PG del objetivo baja tanto como el daño"></label>
      </div><p class="hint">Al lanzar el conjuro, el arma aparece en tus ataques y en Combate. Desaparece sola cuando acaba su duración (o si pierdes la concentración).</p></div>
    </div>`;
}
function csRead() {
  const wpn = $('#cs-wpn').checked
    ? {
        n: $('#cs-wn').value.trim() || 'Arma del conjuro',
        die: $('#cs-wdie').value === 'hd' ? 'hd' : $('#cs-wdx').value.trim(),
        t: $('#cs-wt').value,
        ab: $('#cs-wab').value,
        p: [...document.querySelectorAll('[data-csp]')].filter(x => x.checked).map(x => x.dataset.csp),
        prof: $('#cs-wprof').checked,
        fx: $('#cs-wfx').value.trim(),
      }
    : null;
  return Object.assign(csReadBase(), csClean({ hd: $('#cs-hd').value, wpn }));
}
function csReadBase() {
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
      ...csClean(x),
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
