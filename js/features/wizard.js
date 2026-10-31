/* Asistente para crear personajes y subir de nivel. */
'use strict';

let W = null;
function wizSteps() {
  const st = [];
  if (W.mode === 'create') {
    st.push(
      ['basics', 'Datos'],
      ['species', 'Especie'],
      ['background', 'Trasfondo'],
      ['abil', 'Características'],
      ['skills', 'Habilidades']
    );
  } else {
    if (W.needClass) st.push(['pickclass', 'Clase']);
    st.push(['summary', 'Novedades'], ['hp', 'Puntos de golpe']);
  }
  const def = CL[W.classKey];
  if (def) {
    if (W.mode === 'level' && def.subLv[0] <= W.L && !W.origSub) st.push(['sub', 'Subclase']);
    if (W.mode === 'level') {
      const sp = specOf(C().speciesKey);
      if (sp && sp.lin && !C().lineageKey && (W.L === 3 || W.L === 5))
        st.push(['lineage', sp.linLabel || 'Linaje']);
    }
    if (W.mode === 'level' && def.asi.includes(W.L)) st.push(['asi', W.L === 19 ? 'Don épico' : 'Mejora']);
    const ca = casterOf(def, W.subKey ? def.subs[W.subKey] : null);
    if (ca && ((ca.cantrips && ca.cantrips[W.L - 1]) || (ca.prepared && ca.prepared[W.L - 1])))
      st.push(['spells', 'Conjuros']);
  }
  st.push(['confirm', 'Confirmar']);
  return st;
}
function startWizard(mode) {
  const c = C();
  if (mode === 'create') {
    W = {
      mode,
      L: 1,
      classKey: '',
      subKey: '',
      origSub: '',
      name: '',
      species: '',
      background: '',
      speciesKey: '',
      lineageKey: '',
      bgKey: '',
      bgMode: '21',
      bg2: '',
      bg1: '',
      humanFeat: '',
      base: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
      ab: {},
      skills: [],
      spells: [],
      step: 0,
      hpMode: 'avg',
      hpRoll: '',
    };
    recomputeAb();
  } else {
    W = {
      mode,
      L: c.level + 1,
      needClass: !c.classKey,
      lineageKey: c.lineageKey,
      classKey: c.classKey,
      subKey: c.subclassKey,
      origSub: c.subclassKey,
      ab: Object.assign({}, c.abilities),
      spells: c.spells.map(s => Object.assign({}, s)),
      step: 0,
      hpMode: 'avg',
      hpRoll: '',
      asi: { mode: '2', a: '', b: '', feat: '', featText: '' },
    };
  }
  renderWizard();
}
function bgBonus() {
  const o = {};
  const bg = BG[W.bgKey];
  if (!bg) return o;
  if (W.bgMode === '111') bg.ab.forEach(k => (o[k] = 1));
  else {
    if (W.bg2) o[W.bg2] = 2;
    if (W.bg1 && W.bg1 !== W.bg2) o[W.bg1] = (o[W.bg1] || 0) + 1;
  }
  return o;
}
function recomputeAb() {
  const b = bgBonus();
  W.ab = {};
  for (const [k] of ABIL) W.ab[k] = Math.min(20, (+W.base[k] || 0) + (b[k] || 0));
}
const wizFeats = () =>
  W.mode === 'create'
    ? [BG[W.bgKey] && BG[W.bgKey].feat, W.speciesKey === 'human' && W.humanFeat].filter(Boolean)
    : C().featKeys || [];
function extraSkills() {
  const sp = specOf(W.speciesKey);
  return (
    ((sp && sp.extraSkill && sp.extraSkill.n) || 0) +
    wizFeats().reduce((t, k) => t + ((FEATS[k] && FEATS[k].skills) || 0), 0)
  );
}
const bgSkills = () => (BG[W.bgKey] ? BG[W.bgKey].skills : []);
const wizDef = () => CL[W.classKey];
const wizSub = () => (W.subKey && wizDef() ? wizDef().subs[W.subKey] : null);
function newFeatures() {
  const def = wizDef(),
    sub = wizSub(),
    L = W.L,
    out = [];
  if (!def) return out;
  (def.f[L] || []).forEach(f => out.push([...f, `${def.n} ${L}`]));
  if (W.mode === 'level') {
    const sp = specOf(C().speciesKey);
    if (sp && sp.lv && sp.lv[L]) sp.lv[L].forEach(f => out.push([...f, sp.n]));
  }
  if (sub) {
    const levels = W.mode === 'level' && !W.origSub ? def.subLv.filter(l => l <= L) : [L];
    levels.forEach(l => (sub.f[l] || []).forEach(f => out.push([...f, `${sub.n} ${l}`])));
  }
  return out;
}
function hpGain() {
  const def = wizDef(),
    c = C();
  if (!def) return 0;
  const con = mod(W.mode === 'level' ? W.ab.con : W.ab.con);
  let base = W.mode === 'create' ? def.hd : W.hpMode === 'avg' ? def.hd / 2 + 1 : +W.hpRoll || 0;
  let g = Math.max(1, base + con);
  if (W.subKey === 'draconic') g += W.mode === 'level' && !W.origSub ? W.L : 1;
  g += hpPerLevel(W.mode === 'create' ? W.speciesKey : c.speciesKey, wizFeats());
  return g;
}
function wizSpellLimits() {
  const def = wizDef(),
    ca = casterOf(def, wizSub());
  if (!ca) return null;
  const L = W.L,
    can = ca.cantrips ? ca.cantrips[L - 1] : 0,
    prep = ca.prepared ? ca.prepared[L - 1] : 0;
  const cur = {
    c: W.spells.filter(s => !s.src && +s.level === 0).length,
    p: W.spells.filter(s => !s.src && +s.level > 0).length,
  };
  return { ca, can, prep, cur, max: maxSpellLevel(ca.type, L) };
}
function renderWizCounts() {
  const el = $('#wz-counts');
  if (!el) return;
  const l = wizSpellLimits();
  if (!l) return;
  el.innerHTML = countsHTML(l);
}
function countsHTML(l) {
  return `<span class="badge" style="${l.cur.c > l.can ? 'color:var(--bad)' : ''}">Trucos ${l.cur.c}/${l.can}</span> <span class="badge" style="${l.cur.p > l.prep ? 'color:var(--bad)' : ''}">Conjuros preparados ${l.cur.p}/${l.prep}</span> <small>hasta nivel ${l.max}</small>`;
}
function diffRow(k, a, b) {
  return a === b ? '' : `<span>${esc(k)}</span><b>${esc(a)} → <span class="up">${esc(b)}</span></b>`;
}
function wizBody(step) {
  const c = C(),
    def = wizDef(),
    sub = wizSub(),
    L = W.L;
  switch (step) {
    case 'pickclass':
      return `<p>Esta ficha no tiene una clase reconocida. Elige la clase para que el asistente sepa qué ganas al subir.</p>
    <div class="f"><span>Clase</span><select id="wz-class">${[['', '—'], ...Object.entries(CL).map(([k, d]) => [k, d.n])].map(([k, n]) => `<option value="${k}" ${W.classKey === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div>`;
    case 'basics':
      return `<div class="grid">
    <label class="f"><span>Nombre</span><input id="wz-name" value="${esc(W.name)}" autocomplete="off"></label>
    <label class="f"><span>Especie</span><input id="wz-species" value="${esc(W.species)}" placeholder="Humano, Elfo, Tiefling…"></label>
    <label class="f"><span>Trasfondo</span><input id="wz-background" value="${esc(W.background)}" placeholder="Acólito, Soldado…"></label></div>
    <h3>Clase</h3><div class="choice">${Object.entries(CL)
      .map(
        ([k, d]) =>
          `<label><input type="radio" name="wz-cls" value="${k}" ${W.classKey === k ? 'checked' : ''}><span><b>${d.n}</b><br><small>Dado de golpe d${d.hd} · Salvaciones ${d.saves.map(s => AB[s][1]).join(' y ')}${d.cast ? ` · Lanza conjuros con ${AB[d.ab][2]}` : ''}</small></span></label>`
      )
      .join('')}</div>`;
    case 'species': {
      const sp = specOf(W.speciesKey);
      return `<div class="choice">${Object.entries(SPEC)
        .map(
          ([
            k,
            d,
          ]) => `<label><input type="radio" name="wz-spec" value="${k}" ${W.speciesKey === k ? 'checked' : ''}><span><b>${d.n}</b><br><small>Tamaño ${d.size} · ${d.speed} pies${d.dv ? ` · visión en la oscuridad ${d.dv} pies` : ''}</small>
      ${W.speciesKey === k ? `<div style="margin-top:.4rem">${d.traits.map(t => `<div class="feat"><b>${esc(t[0])}</b><p>${esc(t[1])}</p></div>`).join('')}</div>` : ''}</span></label>`
        )
        .join('')}
      <label><input type="radio" name="wz-spec" value="" ${W.speciesKey === '' && W.species ? 'checked' : ''}><span><b>Otra</b><br><small>La completas tú a mano.</small>${W.speciesKey === '' ? `<br><input id="wz-species" class="inline-num" style="width:100%;margin-top:.4rem" value="${esc(W.species)}" placeholder="Nombre de la especie">` : ''}</span></label></div>
    ${
      sp && sp.lin
        ? `<h3>${esc(sp.linLabel || 'Linaje')}</h3><div class="choice">${Object.entries(sp.lin)
            .map(
              ([k, l]) =>
                `<label><input type="radio" name="wz-lin" value="${k}" ${W.lineageKey === k ? 'checked' : ''}><span><b>${esc(l.n)}</b><br><small>${esc(l.traits.map(t => t[1]).join(' '))}</small></span></label>`
            )
            .join('')}</div>`
        : ''
    }`;
    }
    case 'background': {
      const bg = BG[W.bgKey];
      const abSel = (id, v, opts) =>
        `<select id="${id}">${[['', '—'], ...opts.map(k => [k, AB[k][2]])].map(([k, n]) => `<option value="${k}" ${v === k ? 'selected' : ''}>${n}</option>`).join('')}</select>`;
      return `<div class="f"><span>Trasfondo</span><select id="wz-bg">${[['', 'Otro (lo completo a mano)'], ...Object.entries(BG).map(([k, b]) => [k, b.n])].map(([k, n]) => `<option value="${k}" ${W.bgKey === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
    ${
      bg
        ? `<div class="diff"><span>Habilidades</span><b>${bg.skills.map(k => SK[k][1]).join(', ')}</b><span>Herramienta</span><b>${esc(bg.tool)}</b><span>Dote de origen</span><b>${esc(FEATS[bg.feat].n)}</b></div>
      <p class="hint">${esc(FEATS[bg.feat].text)}</p>
      <h3>Aumento de características</h3><p class="hint">Este trasfondo puede aumentar ${bg.ab.map(k => AB[k][2]).join(', ')}.</p>
      <div class="choice"><label><input type="radio" name="wz-bgmode" value="21" ${W.bgMode === '21' ? 'checked' : ''}><span><b>+2 a una y +1 a otra</b>${
        W.bgMode === '21'
          ? `<div class="grid" style="margin-top:.4rem"><label class="f"><span>+2</span>${abSel('wz-bg2', W.bg2, bg.ab)}</label><label class="f"><span>+1</span>${abSel(
              'wz-bg1',
              W.bg1,
              bg.ab.filter(k => k !== W.bg2)
            )}</label></div>`
          : ''
      }</span></label>
        <label><input type="radio" name="wz-bgmode" value="111" ${W.bgMode === '111' ? 'checked' : ''}><span><b>+1 a las tres</b></span></label></div>`
        : `<label class="f"><span>Nombre del trasfondo</span><input id="wz-background" value="${esc(W.background)}"></label><p class="hint">Con un trasfondo propio, aplica tú los aumentos en el paso siguiente.</p>`
    }
    ${W.speciesKey === 'human' ? `<h3>Versátil (humano)</h3><div class="f"><span>Dote de origen extra</span><select id="wz-hfeat">${[['', '—'], ...Object.entries(FEATS).map(([k, f]) => [k, f.n])].map(([k, n]) => `<option value="${k}" ${W.humanFeat === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div>` : ''}`;
    }
    case 'abil': {
      const b = bgBonus();
      return `<p class="hint">Escribe las puntuaciones base (la matriz estándar es 15, 14, 13, 12, 10, 8). ${BG[W.bgKey] ? 'Los aumentos del trasfondo se suman solos.' : 'Incluye ya los aumentos de tu trasfondo.'}</p>
    <div class="grid">${ABIL.map(([k, , n]) => `<label class="f"><span>${n}${b[k] ? ` +${b[k]}` : ''} → ${W.ab[k]} (${sgn(mod(W.ab[k]))})</span><input id="wz-ab-${k}" type="number" inputmode="numeric" min="1" max="20" value="${W.base[k]}" data-wab="${k}"></label>`).join('')}</div>`;
    }
    case 'lineage': {
      const sp = specOf(C().speciesKey);
      return `<p>A nivel ${L} tu ${esc(sp.n.toLowerCase())} gana conjuros según su ${esc((sp.linLabel || 'linaje').toLowerCase())}, y tu ficha aún no tiene uno elegido.</p>
    <div class="choice">${Object.entries(sp.lin)
      .map(
        ([k, l]) =>
          `<label><input type="radio" name="wz-lin" value="${k}" ${W.lineageKey === k ? 'checked' : ''}><span><b>${esc(l.n)}</b><br><small>${esc(l.traits.map(t => t[1]).join(' '))}</small></span></label>`
      )
      .join('')}</div>`;
    }
    case 'skills': {
      const sk = def.skills,
        bgs = bgSkills(),
        ex = extraSkills(),
        sp = specOf(W.speciesKey);
      return `<p>Elige <b>${sk.n}</b> habilidades de ${def.n}${
        ex
          ? ` y <b>${ex}</b> más a tu elección (${[
              sp && sp.extraSkill && sp.extraSkill.label,
              ...wizFeats()
                .filter(k => FEATS[k].skills)
                .map(k => FEATS[k].n),
            ]
              .filter(Boolean)
              .join(', ')})`
          : ''
      }.${bgs.length ? ' Las del trasfondo ya vienen marcadas.' : ''}</p>
    <div class="chips">${SKILLS.map(s => {
      const locked = bgs.includes(s[0]),
        on = locked || W.skills.includes(s[0]),
        cls = sk.from.includes(s[0]);
      return `<button class="chip ${on ? 'on' : ''}" data-act="wz-skill" data-k="${s[0]}" ${locked ? 'disabled title="Del trasfondo"' : ''} ${cls || locked ? '' : 'style="opacity:.75"'}>${s[1]}${locked ? ' ✓' : cls ? '' : ' *'}</button>`;
    }).join('')}</div>
    <p class="hint">* No está en la lista de ${def.n.toLowerCase()}${ex ? '; puedes usarla para tus elecciones extra' : ''}. Llevas ${W.skills.length} de ${sk.n + ex}.${sp && sp.extraSkill && sp.extraSkill.from ? ` ${esc(sp.extraSkill.label)}: elige entre ${sp.extraSkill.from.map(k => SK[k][1]).join(', ')}.` : ''}</p>`;
    }
    case 'summary': {
      const nf = newFeatures();
      const old = resourcesFor(
          def,
          CL[c.classKey] && c.subclassKey ? def.subs[c.subclassKey] : null,
          c.level,
          c.abilities
        ),
        nw = resourcesFor(def, sub, L, W.ab);
      const ca = casterOf(def, sub),
        o = ca ? slotsFor(ca.type, c.level) : null,
        n = ca ? slotsFor(ca.type, L) : null;
      let rows = '';
      rows += diffRow('Bonificador de competencia', sgn(pbAt(c.level)), sgn(pbAt(L)));
      nw.forEach(r => {
        const p = old.find(x => x.n === r.n);
        rows += diffRow(r.n, p ? String(p.max) : '0', String(r.max));
      });
      const oi = infoFor(def, CL[c.classKey] && c.subclassKey ? def.subs[c.subclassKey] : null, c.level),
        ni = infoFor(def, sub, L);
      for (const k in ni) rows += diffRow(k, String(oi[k] ?? '—'), String(ni[k]));
      if (ca) {
        if (ca.type === 'pact')
          rows += diffRow(
            'Espacios de pacto',
            `${o.pact.total} de nivel ${o.pact.level}`,
            `${n.pact.total} de nivel ${n.pact.level}`
          );
        else
          n.slots.forEach(
            (v, i) => (rows += diffRow(`Espacios de nivel ${i + 1}`, String(o.slots[i]), String(v)))
          );
        if (ca.cantrips)
          rows += diffRow('Trucos', String(ca.cantrips[c.level - 1] || 0), String(ca.cantrips[L - 1]));
        if (ca.prepared)
          rows += diffRow(
            'Conjuros preparados',
            String(ca.prepared[c.level - 1] || 0),
            String(ca.prepared[L - 1])
          );
      }
      return `<p><b>${esc(c.name)}</b> pasa de ${def.n} ${c.level} a ${def.n} ${L}.</p>
      ${nf.length ? `<h3>Rasgos nuevos</h3>${nf.map(f => `<div class="feat"><b>${esc(f[0])}</b><p>${esc(f[1])}</p></div>`).join('')}` : def.subLv.includes(L) && !sub ? '' : '<p class="hint">A este nivel no ganas rasgos nuevos de clase.</p>'}
      ${def.subLv.includes(L) && !sub && W.origSub === '' ? '<p class="hint">Elegirás tu subclase en el siguiente paso.</p>' : ''}
      ${def.asi.includes(L) ? `<p class="hint">A este nivel ganas ${L === 19 ? 'un Don épico (una dote)' : 'una Mejora de característica o una dote'}; lo eliges más adelante.</p>` : ''}
      ${rows ? `<h3>Cambios</h3><div class="diff">${rows}</div>` : ''}
      ${(() => {
        const ids = [
          ...alwaysIds(W.classKey, '', L, L),
          ...(sub ? alwaysIds('', W.subKey, W.origSub ? L : 1, L) : []),
          ...originSpellIds(c.speciesKey, c.lineageKey || W.lineageKey, L, L),
        ].filter(id => !c.spells.some(s => s.ref === id));
        return ids.length
          ? `<h3>Conjuros que se añaden solos</h3><p>${ids.map(id => esc(SPBY[id].n)).join(', ')}</p><p class="hint">Siempre preparados o de tu especie: no cuentan en tu límite.</p>`
          : '';
      })()}`;
    }
    case 'hp': {
      const con = mod(W.ab.con),
        avg = def.hd / 2 + 1;
      return `<p>Al subir ganas PG: tu dado de golpe (d${def.hd}) + tu modificador de CON (${sgn(con)}).</p>
    <div class="choice">
      <label><input type="radio" name="wz-hp" value="avg" ${W.hpMode === 'avg' ? 'checked' : ''}><span><b>Valor fijo: ${avg} ${sgn(con)} = ${Math.max(1, avg + con)} PG</b><br><small>La opción segura, sin tirar.</small></span></label>
      <label><input type="radio" name="wz-hp" value="roll" ${W.hpMode === 'roll' ? 'checked' : ''}><span><b>Tirar el dado</b><br><small>Tira un d${def.hd} físico y escribe el resultado.</small>
        <br><input id="wz-hproll" type="number" inputmode="numeric" min="1" max="${def.hd}" value="${esc(W.hpRoll)}" class="inline-num" style="margin-top:.4rem" aria-label="Resultado del dado"></span></label></div>
    ${W.subKey === 'draconic' ? '<p class="hint">Resistencia dracónica: +1 PG extra por nivel de hechicero (incluido).</p>' : ''}
    <p>Ganas <b>${hpGain()} PG</b>: tus PG máximos pasan de ${c.hp.max} a <b>${c.hp.max + hpGain()}</b>.</p>`;
    }
    case 'sub':
      return `<p>A nivel ${def.subLv[0]} eliges tu ${def.sub.toLowerCase()} de ${def.n.toLowerCase()}.</p>
    <div class="choice">${Object.entries(def.subs)
      .map(
        ([
          k,
          s,
        ]) => `<label><input type="radio" name="wz-sub" value="${k}" ${W.subKey === k ? 'checked' : ''}><span><b>${s.n}</b><br><small>${(s.f[def.subLv[0]] || []).map(f => f[0]).join(' · ')}</small>
      ${W.subKey === k ? `<div style="margin-top:.4rem">${def.subLv.map(l => (s.f[l] || []).map(f => `<div class="feat"><b>Nivel ${l}: ${esc(f[0])}</b><p>${esc(f[1])}</p></div>`).join('')).join('')}</div>` : ''}</span></label>`
      )
      .join('')}</div>`;
    case 'asi': {
      const a = W.asi;
      return `<p>${L === 19 ? 'Don épico: en 2024 ganas una dote de Don épico (o cualquier otra dote para la que cumplas requisitos). También puedes elegir Mejora de característica.' : 'Elige una Mejora de característica o una dote.'}</p>
    <div class="choice">
      <label><input type="radio" name="wz-asi" value="2" ${a.mode === '2' ? 'checked' : ''}><span><b>+2 a una característica</b></span></label>
      <label><input type="radio" name="wz-asi" value="11" ${a.mode === '11' ? 'checked' : ''}><span><b>+1 a dos características</b></span></label>
      <label><input type="radio" name="wz-asi" value="feat" ${a.mode === 'feat' ? 'checked' : ''}><span><b>Una dote</b><br><small>Escribe su nombre y, si quieres, un resumen.</small></span></label></div>
    ${
      a.mode === 'feat'
        ? `<div class="grid"><label class="f"><span>Dote</span><input id="wz-feat" value="${esc(a.feat)}" placeholder="Alerta, Afortunado…"></label><label class="f wide"><span>Qué hace</span><textarea id="wz-feattext">${esc(a.featText)}</textarea></label></div><p class="hint">Si la dote sube una característica, cámbiala luego en ⚙ Ajustes → Editar ficha.</p>`
        : `<div class="grid"><label class="f"><span>${a.mode === '2' ? 'Característica (+2)' : 'Primera (+1)'}</span><select id="wz-asi-a">${[['', '—'], ...ABIL.map(x => [x[0], `${x[2]} (${W.ab[x[0]]})`])].map(([k, n]) => `<option value="${k}" ${a.a === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        ${a.mode === '11' ? `<label class="f"><span>Segunda (+1)</span><select id="wz-asi-b">${[['', '—'], ...ABIL.map(x => [x[0], `${x[2]} (${W.ab[x[0]]})`])].map(([k, n]) => `<option value="${k}" ${a.b === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>` : ''}</div>
        <p class="hint">Máximo 20 en cada característica.</p>`
    }`;
    }
    case 'spells': {
      const l = wizSpellLimits();
      if (!P || P.target !== 'wizard')
        P = { target: 'wizard', q: '', lvl: '', cls: l.ca.list, open: '', list: W.spells, max: l.max };
      else {
        P.list = W.spells;
        P.max = l.max;
      }
      const mine = W.spells.length
        ? `<div class="mine">${W.spells.map((s, i) => `<span class="chip">${esc(s.name)} <small>${+s.level ? 'N' + s.level : 'truco'}</small> <button class="b sm" style="padding:0 .3rem;border:0;background:none" data-act="wz-sp-del" data-i="${i}" aria-label="Quitar ${esc(s.name)}">×</button></span>`).join('')}</div>`
        : '<p class="empty">Ningún conjuro todavía.</p>';
      return `<p id="wz-counts">${countsHTML(l)}</p>
      <p class="hint">${l.ca.type === 'pact' ? 'Los brujos pueden cambiar un conjuro preparado al subir de nivel.' : 'Puedes cambiar conjuros preparados según las reglas de tu clase.'} Los conjuros que siempre tienes preparados (de clase, subclase o especie) se añaden solos al confirmar y no cuentan en el límite.</p>
      <h3>Tus conjuros</h3><div id="wz-mine">${mine}</div><h3>Añadir</h3>${spPickerHTML()}`;
    }
    case 'confirm': {
      if (W.mode === 'create') {
        const d = def,
          sp = specOf(W.speciesKey),
          ln = linOf(W.speciesKey, W.lineageKey);
        return `<p>Vas a crear a <b>${esc(W.name || 'Sin nombre')}</b>, ${esc(sp ? sp.n + (ln ? ` (${ln.n})` : '') : W.species)} ${d ? d.n + ' 1' : ''}${BG[W.bgKey] ? `, ${esc(BG[W.bgKey].n.toLowerCase())}` : ''}.</p>
      <div class="diff"><span>PG máximos</span><b>${d ? hpGain() : '—'}</b>${
        sp
          ? `<span>Velocidad</span><b>${(ln && ln.speed) || sp.speed} pies</b>${(ln && ln.dv) || sp.dv ? `<span>Visión en la oscuridad</span><b>${(ln && ln.dv) || sp.dv} pies</b>` : ''}<span>Conjuros de especie</span><b>${
              originSpellIds(W.speciesKey, W.lineageKey, 1, 1)
                .map(id => SPBY[id].n)
                .join(', ') || '—'
            }</b>`
          : ''
      }${
        wizFeats().length
          ? `<span>Dotes</span><b>${wizFeats()
              .map(k => FEATS[k].n)
              .join(', ')}</b>`
          : ''
      }<span>Salvaciones</span><b>${d ? d.saves.map(s => AB[s][1]).join(', ') : '—'}</b><span>Habilidades</span><b>${W.skills.length}</b><span>Conjuros</span><b>${W.spells.length}</b></div>
      ${newFeatures()
        .map(f => `<div class="feat"><b>${esc(f[0])}</b><p>${esc(f[1])}</p></div>`)
        .join('')}
      <p class="hint">Después podrás completar CA y armas en ⚙ Ajustes → Editar ficha, y los objetos y el dinero con los botones de la mochila y de las monedas.</p>`;
      }
      const warn = [];
      const l = wizSpellLimits();
      if (l) {
        if (l.cur.c > l.can) warn.push(`Tienes ${l.cur.c} trucos y tu límite es ${l.can}.`);
        if (l.cur.p > l.prep)
          warn.push(
            `Tienes ${l.cur.p} conjuros y tu límite de preparados es ${l.prep} (puede ser correcto si alguno es de subclase).`
          );
      }
      return `<p>Todo listo para subir a <b>${esc(c.name)}</b> a ${def.n} ${L}${sub ? ` (${sub.n})` : ''}.</p>
      <div class="diff"><span>PG máximos</span><b>${c.hp.max} → <span class="up">${c.hp.max + hpGain()}</span></b><span>Rasgos nuevos</span><b>${newFeatures().length}</b>${
        W.asi && def.asi.includes(L)
          ? `<span>${L === 19 ? 'Don épico' : 'Mejora'}</span><b>${esc(
              W.asi.mode === 'feat'
                ? W.asi.feat || '(sin nombre)'
                : W.asi.mode === '2'
                  ? W.asi.a
                    ? AB[W.asi.a][2] + ' +2'
                    : '—'
                  : [W.asi.a, W.asi.b]
                      .filter(Boolean)
                      .map(k => AB[k][2] + ' +1')
                      .join(', ') || '—'
            )}</b>`
          : ''
      }</div>
      ${warn.map(w => `<p class="hint warn">${esc(w)}</p>`).join('')}
      <p class="hint">Se recalculan los espacios de conjuro y los rasgos con usos, y recuperas los PG ganados.</p>`;
    }
  }
  return '';
}
function wizValid(step) {
  const def = wizDef();
  if (step === 'pickclass') return !!W.classKey;
  if (step === 'basics') return !!(W.name.trim() && W.classKey);
  if (step === 'skills')
    return (
      W.skills.length >= def.skills.n + extraSkills() &&
      W.skills.filter(k => def.skills.from.includes(k)).length >= def.skills.n
    );
  if (step === 'species') {
    const sp = specOf(W.speciesKey);
    return sp ? !sp.lin || !!W.lineageKey : !!W.species.trim();
  }
  if (step === 'background') {
    if (W.speciesKey === 'human' && !W.humanFeat) return false;
    if (!W.bgKey) return !!W.background.trim();
    return W.bgMode === '111' || (!!W.bg2 && !!W.bg1 && W.bg1 !== W.bg2);
  }
  if (step === 'lineage') return !!W.lineageKey;
  if (step === 'hp') return W.hpMode === 'avg' || (+W.hpRoll >= 1 && +W.hpRoll <= def.hd);
  if (step === 'sub') return !!W.subKey;
  if (step === 'asi') {
    const a = W.asi;
    if (a.mode === 'feat') return !!a.feat.trim();
    if (a.mode === '2') return !!a.a && W.ab[a.a] + 2 <= 20;
    return !!a.a && !!a.b && a.a !== a.b && W.ab[a.a] < 20 && W.ab[a.b] < 20;
  }
  return true;
}
const STEP_HELP = {
  species: 'Elige especie (y su linaje si lo tiene).',
  background: 'Completa el trasfondo y sus aumentos.',
  lineage: 'Elige una opción.',
  pickclass: 'Elige una clase.',
  basics: 'Escribe un nombre y elige una clase.',
  skills: 'Elige las habilidades que faltan.',
  hp: 'Escribe un resultado válido del dado.',
  sub: 'Elige una subclase.',
  asi: 'Completa la mejora (máximo 20 por característica) o el nombre de la dote.',
};
function renderWizard() {
  const st = wizSteps();
  W.step = clamp(W.step, 0, st.length - 1);
  const [key, label] = st[W.step];
  const title = W.mode === 'create' ? 'Crear personaje' : `Subir a nivel ${W.L}`;
  const ok = wizValid(key);
  const html = `<div class="wz-head"><div><h2>${title}</h2><div class="steps">${st.map((s, i) => `<span class="${i === W.step ? 'on' : i < W.step ? 'done' : ''}">${s[1]}</span>`).join('')}</div></div><button class="b sm" data-act="wz-cancel">Cancelar</button></div>
    <div class="wz-body" id="wz-body">${wizBody(key)}</div>
    <div class="wz-foot"><button class="b" data-act="wz-back" ${W.step ? '' : 'disabled'}>Atrás</button>
      <span class="hint" style="margin:0;align-self:center">${ok ? '' : esc(STEP_HELP[key] || '')}</span>
      ${key === 'confirm' ? `<button class="b pri" data-act="wz-apply">${W.mode === 'create' ? 'Crear personaje' : 'Subir de nivel'}</button>` : `<button class="b pri" data-act="wz-next" ${ok ? '' : 'disabled'}>Siguiente</button>`}</div>`;
  const m = $('#modal');
  if (m.hidden || !m.querySelector('.sheet.big')) {
    openModal(html, true);
  } else {
    const sh = m.querySelector('.sheet');
    const sc = $('#wz-body') ? $('#wz-body').scrollTop : 0;
    sh.innerHTML = html;
    if (W._keepScroll) $('#wz-body').scrollTop = sc;
  }
  W._keepScroll = false;
}
function refreshWizFoot() {
  if (!W) return;
  const st = wizSteps(),
    key = st[W.step][0],
    ok = wizValid(key);
  const nb = document.querySelector('[data-act="wz-next"]');
  if (nb) nb.disabled = !ok;
  const h = document.querySelector('.wz-foot .hint');
  if (h) h.textContent = ok ? '' : STEP_HELP[key] || '';
}
function applyWizard() {
  const def = wizDef(),
    sub = wizSub(),
    L = W.L;
  let c;
  if (W.mode === 'create') {
    c = normalize(blank());
    c.name = W.name.trim();
    c.abilities = Object.assign({}, W.ab);
    c.speciesKey = W.speciesKey;
    c.lineageKey = W.lineageKey;
    const sp = specOf(W.speciesKey),
      ln = linOf(W.speciesKey, W.lineageKey);
    c.species = sp ? sp.n + (ln ? ` (${ln.n})` : '') : W.species;
    const bg = BG[W.bgKey];
    c.backgroundKey = W.bgKey;
    c.background = bg ? bg.n : W.background;
    c.saveProf = [...def.saves];
    [...bgSkills(), ...W.skills].forEach(k => (c.skills[k] = 1));
    c.proficiencies.armor = def.armor;
    c.proficiencies.weapons = def.weapons;
    if (bg) c.proficiencies.tools = bg.tool;
    c.languages = 'Común y dos idiomas a elegir';
    c.featKeys = wizFeats();
    for (const k of c.featKeys)
      addFeature(
        c,
        FEATS[k].n,
        FEATS[k].text,
        k === W.humanFeat && W.speciesKey === 'human'
          ? 'Dote de origen (Versátil)'
          : `Dote de origen (${bg ? bg.n : 'trasfondo'})`
      );
    c.hp.max = c.hp.current = hpGain();
    c.ac =
      10 +
      mod(W.ab.dex) +
      (W.classKey === 'barbarian' ? mod(W.ab.con) : W.classKey === 'monk' ? mod(W.ab.wis) : 0);
    if (W.speciesKey === 'human') c.inspiration = true;
    S.chars.push(c);
    S.active = c.id;
  } else {
    c = C();
    const g = hpGain();
    c.hp.max += g;
    c.hp.current += g;
    if (W.asi && def.asi.includes(L)) {
      const a = W.asi;
      if (a.mode === 'feat')
        c.features.push({
          name: a.feat.trim(),
          source: L === 19 ? 'Don épico (nivel 19)' : `Dote (nivel ${L})`,
          text: a.featText,
          uses: { max: 0, used: 0, recover: '' },
        });
      else if (a.mode === '2') c.abilities[a.a] = Math.min(20, c.abilities[a.a] + 2);
      else {
        c.abilities[a.a] = Math.min(20, c.abilities[a.a] + 1);
        c.abilities[a.b] = Math.min(20, c.abilities[a.b] + 1);
      }
    }
  }
  c.classKey = W.classKey;
  c.class = def.n;
  c.level = L;
  c.subclassKey = W.subKey || '';
  c.subclass = sub ? sub.n : '';
  c.hitDice.die = 'd' + def.hd;
  c.hitDice.total = L;
  c.hitDice.spent = Math.min(c.hitDice.spent, L);
  // rasgos nuevos
  for (const [n, t, src] of newFeatures()) {
    const ex = c.features.find(f => f.name === n);
    if (ex) {
      if (!ex.text.includes(t)) ex.text = (ex.text ? ex.text + '\n\n' : '') + `${src}: ${t}`;
    } else c.features.push({ name: n, source: src, text: t, uses: { max: 0, used: 0, recover: '' } });
  }
  // recursos con usos
  for (const r of resourcesFor(def, sub, L, c.abilities)) {
    let f = c.features.find(x => x.name === r.n);
    if (!f) {
      f = { name: r.n, source: `${def.n}`, text: '', uses: { max: 0, used: 0, recover: '' } };
      c.features.push(f);
    }
    f.uses.max = r.max;
    f.uses.recover = r.rec;
    f.uses.pool = r.pool;
    f.uses.used = clamp(f.uses.used || 0, 0, r.max);
  }
  // magia
  const ca = casterOf(def, sub);
  if (ca) {
    c.spellcasting.ability = ca.ab;
    const z = slotsFor(ca.type, L);
    c.slots.forEach((s, i) => {
      s.total = z.slots[i];
      s.used = Math.min(s.used, s.total);
    });
    c.pact.level = z.pact.level;
    c.pact.total = z.pact.total;
    c.pact.used = Math.min(c.pact.used, c.pact.total);
    c.spells = W.spells.map(s => Object.assign(NEW.spells(), s));
  }
  // conjuros siempre preparados de clase y subclase
  addAlways(c, [
    ...alwaysIds(c.classKey, '', W.mode === 'create' ? 1 : L, L),
    ...alwaysIds('', c.subclassKey, W.mode === 'level' && !W.origSub ? 1 : L, L),
  ]);
  // especie, linaje y dotes de origen
  if (W.mode === 'create') applyOrigin(c);
  else {
    if (W.lineageKey && !c.lineageKey) {
      c.lineageKey = W.lineageKey;
      const sp = specOf(c.speciesKey),
        ln = linOf(c.speciesKey, c.lineageKey);
      c.species = sp.n + ` (${ln.n})`;
      ln.traits.forEach(t => addFeature(c, t[0], t[1], ln.n));
      addOriginSpells(c, originSpellIds(c.speciesKey, c.lineageKey, 1, L));
    } else addOriginSpells(c, originSpellIds(c.speciesKey, c.lineageKey, L, L));
    upsertRes(
      c,
      originRes(c.speciesKey, c.lineageKey, c.featKeys, L),
      (specOf(c.speciesKey) || { n: 'Origen' }).n
    );
  }
  if (!c.spellcasting.ability && c.spells.length)
    c.spellcasting.ability = ['int', 'wis', 'cha'].sort((a, b) => c.abilities[b] - c.abilities[a])[0];
  const name = c.name,
    mode = W.mode;
  closeModal();
  S.tab = 'play';
  save();
  render();
  scrollTo(0, 0);
  toast(
    mode === 'create'
      ? `<div class="t-label">Personaje creado</div><div class="t-big">${esc(name)}</div><div class="t-parts">Completa CA y armas en ⚙ Ajustes → Editar ficha, y los objetos con el botón de la mochila.</div>`
      : `<div class="t-label">¡Subida de nivel!</div><div class="t-big">${esc(def.n)} ${L}</div><div class="t-parts">Rasgos, recursos y espacios actualizados.</div>`
  );
}

/* Aplica a la ficha todo lo automatizable de su especie y linaje (y los recursos de sus dotes) */
function applyOrigin(c) {
  const sp = specOf(c.speciesKey),
    ln = linOf(c.speciesKey, c.lineageKey);
  if (!sp) return;
  c.speedFt = (ln && ln.speed) || sp.speed;
  c.size = sp.size;
  const dv = (ln && ln.dv) || sp.dv;
  if (dv)
    addFeature(
      c,
      'Visión en la oscuridad',
      `Ves en la oscuridad hasta ${dv} pies como si fuera luz tenue (sin colores).`,
      sp.n
    );
  sp.traits.forEach(t => addFeature(c, t[0], t[1], sp.n));
  if (ln) ln.traits.forEach(t => addFeature(c, t[0], t[1], ln.n));
  if (sp.lv) for (const l in sp.lv) if (+l <= c.level) sp.lv[l].forEach(t => addFeature(c, t[0], t[1], sp.n));
  addOriginSpells(c, originSpellIds(c.speciesKey, c.lineageKey, 1, c.level));
  upsertRes(c, originRes(c.speciesKey, c.lineageKey, c.featKeys || [], c.level), sp.n);
}
