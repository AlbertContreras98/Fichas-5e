/* Editor de la ficha: campos y formularios. */
'use strict';

const pid = p => 'f-' + p.replace(/\./g, '-');
const inp = (l, p, v, o = {}) =>
  `<label class="f ${o.w || ''}"><span>${l}</span><input id="${pid(p)}" data-path="${p}" ${o.num ? 'data-num="1" type="number" inputmode="numeric"' : 'type="text"'} ${o.rr ? 'data-rr="1"' : ''} value="${esc(v)}" ${o.ph ? `placeholder="${esc(o.ph)}"` : ''}></label>`;
const sel = (l, p, v, opts, o = {}) =>
  `<label class="f ${o.w || ''}"><span>${l}</span><select id="${pid(p)}" data-path="${p}" ${o.num ? 'data-num="1"' : ''} ${o.rr ? 'data-rr="1"' : ''}>${opts.map(([k, t]) => `<option value="${esc(k)}" ${String(v) === String(k) ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;
const ta = (l, p, v, o = {}) =>
  `<label class="f ${o.w || 'wide'}"><span>${l}</span><textarea id="${pid(p)}" data-path="${p}">${esc(v)}</textarea></label>`;
const chk = (l, p, v) =>
  `<label class="chk"><input type="checkbox" id="${pid(p)}" data-path="${p}" data-bool="1" ${v ? 'checked' : ''}> ${l}</label>`;
const del = (list, i) =>
  `<button class="b sm bad" data-act="del" data-list="${list}" data-i="${i}">Quitar</button>`;
function viewEdit(c) {
  const ab = [['', 'Ninguna'], ...ABIL.map(a => [a[0], a[2]])];
  const def = defOf(c);
  const subOpts = def
    ? [['', '— Sin elegir —'], ...Object.entries(def.subs).map(([k, s]) => [k, s.n])]
    : [['', '—']];
  const ammoOpts = [
    ['', 'Sin munición'],
    ...c.equipment.filter(e => e.cat === 'municion').map(e => [e.id, e.name]),
  ];
  return `<div class="ed">
  <div class="ed-head"><h2>Editar ficha</h2><button class="b pri" data-act="tab" data-t="pj">Hecho</button></div>
  <section class="card"><h2>Identidad</h2><div class="grid">
    ${inp('Nombre', 'name', c.name)}
    ${sel('Especie', 'speciesKey', c.speciesKey, [['', 'Otra (escribe abajo)'], ...Object.entries(SPEC).map(([k, d]) => [k, d.n])], { rr: 1 })}
    ${c.speciesKey && SPEC[c.speciesKey].lin ? sel(SPEC[c.speciesKey].linLabel || 'Linaje', 'lineageKey', c.lineageKey, [['', '— Sin elegir —'], ...Object.entries(SPEC[c.speciesKey].lin).map(([k, d]) => [k, d.n])], { rr: 1 }) : ''}
    ${c.speciesKey ? '' : inp('Especie (texto)', 'species', c.species)}
    ${sel('Trasfondo', 'backgroundKey', c.backgroundKey, [['', 'Otro (escribe abajo)'], ...Object.entries(BG).map(([k, d]) => [k, d.n])], { rr: 1 })}
    ${c.backgroundKey ? '' : inp('Trasfondo (texto)', 'background', c.background)}
    ${sel('Clase', 'classKey', c.classKey, [['', 'Otra (escribe abajo)'], ...Object.entries(CL).map(([k, d]) => [k, d.n])], { rr: 1 })}
    ${c.classKey ? sel('Subclase', 'subclassKey', c.subclassKey, subOpts, { rr: 1 }) : inp('Clase (texto)', 'class', c.class)}
    ${inp('Nivel', 'level', c.level, { num: 1, rr: 1 })}${inp('Experiencia', 'xp', c.xp, { num: 1 })}
  </div><p class="hint">Para subir de nivel usa el botón «Subir de nivel»: actualiza PG, rasgos, recursos y conjuros. Cambiar el nivel, la especie o el trasfondo aquí solo cambia los datos; para que la app añada sola sus rasgos y conjuros, pulsa «Aplicar rasgos de especie».</p><div class="btns"><button class="b sm" data-act="apply-origin" ${c.speciesKey ? '' : 'disabled'}>Aplicar rasgos de especie</button></div></section>
  <section class="card"><h2>Características y salvaciones</h2><div class="grid">
    ${ABIL.map(([k, , n]) => `<div class="f">${inp(`${n} (${sgn(M(c, k))})`, `abilities.${k}`, c.abilities[k], { num: 1, rr: 1 })}<button class="chip ${c.saveProf.includes(k) ? 'on' : ''}" data-act="tog-save" data-k="${k}" style="margin-top:.3rem">Salvación ${c.saveProf.includes(k) ? 'competente' : 'normal'}</button></div>`).join('')}
  </div></section>
  <section class="card"><h2>Habilidades</h2><div class="skillgrid">${SKILLS.map(s =>
    sel(
      `${s[1]} (${AB[s[2]][1]})`,
      `skills.${s[0]}`,
      +c.skills[s[0]] || 0,
      [
        [0, '—'],
        [1, 'Competente'],
        [2, 'Pericia'],
      ],
      { num: 1 }
    )
  ).join('')}</div></section>
  <section class="card"><h2>Combate</h2><div class="grid">
    ${armorAuto(c) ? `<label class="f"><span>CA (calculada)</span><input value="${acOf(c)}" readonly title="Se calcula con la armadura y el escudo que llevas puestos"></label>${inp('Otros bonificadores a la CA', 'acBonus', c.acBonus || 0, { num: 1 })}` : inp('CA', 'ac', c.ac, { num: 1 })}${inp('Velocidad (pies)', 'speedFt', c.speedFt, { num: 1 })}${inp('Tamaño', 'size', c.size)}${inp('Extra a iniciativa', 'initiativeBonus', c.initiativeBonus, { num: 1 })}
    ${inp('PG máximos', 'hp.max', c.hp.max, { num: 1 })}${inp('PG actuales', 'hp.current', c.hp.current, { num: 1 })}${inp('Dado de golpe', 'hitDice.die', c.hitDice.die, { ph: 'd8' })}${inp('Nº dados de golpe', 'hitDice.total', c.hitDice.total, { num: 1 })}
  </div></section>
  <section class="card"><h2>Armas y ataques</h2><p class="hint">Si el arma usa munición (arco, ballesta…), enlázala a un objeto de munición del inventario y en la partida podrás descontarla con un toque.</p><div class="stack">${c.attacks
    .map(
      (a, i) => `<div class="row-ed">
    ${inp('Nombre', `attacks.${i}.name`, a.name)}${inp('Bonif. ataque', `attacks.${i}.atk`, a.atk, { num: 1 })}${inp('Daño', `attacks.${i}.dmg`, a.dmg, { ph: '1d6+2' })}${inp('Tipo de daño', `attacks.${i}.type`, a.type)}${inp('Propiedades', `attacks.${i}.notes`, a.notes)}
    ${sel('Munición', `attacks.${i}.ammo`, a.ammo, ammoOpts)}${del('attacks', i)}</div>`
    )
    .join('')}
    <div><button class="b" data-act="add" data-list="attacks">Añadir arma</button></div></div></section>
  <section class="card"><div class="card-head"><h2>Magia</h2><button class="b sm pri" data-act="sp-open">Buscar conjuros</button></div><div class="grid">
    ${sel('Aptitud mágica', 'spellcasting.ability', c.spellcasting.ability, ab, { rr: 1 })}
    ${inp('Nivel de pacto (brujo)', 'pact.level', c.pact.level, { num: 1 })}${inp('Espacios de pacto', 'pact.total', c.pact.total, { num: 1 })}
    ${c.slots.map((s, i) => inp(`Espacios nivel ${i + 1}`, `slots.${i}.total`, s.total, { num: 1 })).join('')}
  </div>
  <h3>Conjuros</h3><p class="hint">Los conjuros añadidos desde el buscador traen sus datos. También puedes crear uno a mano.</p><div class="stack">${c.spells
    .map(
      (sp, i) => `<div class="row-ed">
    ${inp('Nivel (0 = truco)', `spells.${i}.level`, sp.level, { num: 1 })}${inp('Nombre', `spells.${i}.name`, sp.name)}
    ${sel('Tiempo', `spells.${i}.time`, sp.time, [
      ['A', 'Acción'],
      ['AA', 'Acción adicional'],
      ['R', 'Reacción'],
      ['1 minuto', '1 minuto'],
      ['10 minutos', '10 minutos'],
      ['1 hora', '1 hora'],
      ['8 horas', '8 horas'],
    ])}
    ${inp('Alcance', `spells.${i}.range`, sp.range)}${inp('Duración', `spells.${i}.dur`, sp.dur)}${inp('Material', `spells.${i}.material`, sp.material)}
    <div class="f">${chk('Concentración', `spells.${i}.conc`, sp.conc)}${chk('Ritual', `spells.${i}.ritual`, sp.ritual)}</div>
    ${ta(sp.ref ? 'Notas propias (si lo dejas vacío se muestra la descripción del conjuro)' : 'Qué hace', `spells.${i}.desc`, sp.desc)}${del('spells', i)}</div>`
    )
    .join('')}
    <div class="btns"><button class="b" data-act="add" data-list="spells">Añadir conjuro a mano</button></div></div></section>
  <section class="card"><h2>Rasgos, dotes y recursos limitados</h2><p class="hint">Si un rasgo tiene usos (p. ej. «2 veces por descanso largo»), pon los usos y cuándo se recuperan; aparecerá con sus rombos en «Rasgos y dotes» y en Combate.</p>
    <div class="stack">${c.features
      .map(
        (f, i) => `<div class="row-ed">
    ${inp('Nombre', `features.${i}.name`, f.name)}${inp('Origen', `features.${i}.source`, f.source, { ph: 'Clase, especie, dote…' })}${inp('Usos (0 = ilimitado)', `features.${i}.uses.max`, f.uses.max, { num: 1 })}
    ${sel('Se recupera con', `features.${i}.uses.recover`, f.uses.recover, [
      ['', '—'],
      ['corto', 'Descanso corto o largo'],
      ['corto1', '1 en corto, todos en largo'],
      ['largo', 'Descanso largo'],
    ])}
    ${sel('Cuándo se usa', `features.${i}.when`, f.when || '', [
      ['', 'Automático'],
      ['A', 'Acción'],
      ['AA', 'Acción adicional'],
      ['R', 'Reacción'],
      ['free', 'Sin gastar acción'],
      ['atk', 'Sustituye un ataque'],
      ['none', 'Fuera de combate'],
    ])}
    ${ta('Descripción', `features.${i}.text`, f.text)}${del('features', i)}</div>`
      )
      .join('')}
    <div><button class="b" data-act="add" data-list="features">Añadir rasgo</button></div></div></section>
  <section class="card"><h2>Objetos</h2><div class="stack">${c.equipment
    .map(
      (e, i) => `<div class="row-ed">
    ${inp('Objeto', `equipment.${i}.name`, e.name)}${inp('Cantidad', `equipment.${i}.qty`, e.qty, { num: 1 })}${sel('Tipo', `equipment.${i}.cat`, e.cat, CATS)}${inp('Notas', `equipment.${i}.notes`, e.notes)}${del('equipment', i)}</div>`
    )
    .join('')}
    <div><button class="b" data-act="add" data-list="equipment">Añadir objeto</button></div></div>
    <h3>Competencias e idiomas</h3>
    <div class="grid">${inp('Armaduras', 'proficiencies.armor', c.proficiencies.armor)}${inp('Armas', 'proficiencies.weapons', c.proficiencies.weapons)}${inp('Herramientas', 'proficiencies.tools', c.proficiencies.tools)}${inp('Idiomas', 'languages', c.languages)}</div></section>
  </div>`;
}
