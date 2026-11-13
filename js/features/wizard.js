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
    if (newFeatures().some(f => norm(f[0]).startsWith(norm('Estilo de combate'))))
      st.push(['style', 'Estilo de combate']);
    if (wizOrder()) st.push(['order', wizOrder().n]);
    if (wizExpN()) st.push(['expert', 'Pericia']);
    const ca = casterOf(def, W.subKey ? def.subs[W.subKey] : null);
    if (ca && ((ca.cantrips && ca.cantrips[W.L - 1]) || (ca.prepared && ca.prepared[W.L - 1])))
      st.push(['spells', 'Conjuros']);
    if (W.classKey === 'warlock') st.push(['invoc', 'Invocaciones']);
  }
  /* Dotes de origen con conjuros a elegir (Iniciado en la magia): después de los conjuros de clase, para no repetirlos */
  if (W.mode === 'create')
    wizFeats()
      .filter((k, i, a) => FEATS[k] && FEATS[k].spPick && a.indexOf(k) === i)
      .forEach(k => st.push([`ofeat:${k}`, 'Dote de origen']));
  if (W.mode === 'create' && (CLASS_KITS[W.classKey] || BG_KITS[W.bgKey])) st.push(['equip', 'Equipo']);
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
      asi: { mode: '2', a: '', b: '', feat: '', featText: '', fs: ftNew(null) },
    };
  }
  renderWizard();
}
/* Trasfondo del asistente: uno del manual o el propio, con los mismos campos (características, habilidades, herramienta y dote) */
function wizCbg() {
  return (W.cbg = W.cbg || { ab: ['', '', ''], skills: ['', ''], tool: '', feat: '', fn: '', ft: '' });
}
function wizBg() {
  if (BG[W.bgKey]) return BG[W.bgKey];
  if (W.bgKey || W.mode !== 'create') return null;
  const cb = wizCbg(),
    ab = cb.ab.filter((k, i, a) => k && a.indexOf(k) === i);
  return {
    n: W.background,
    ab: ab.length === 3 ? ab : [],
    skills: cb.skills.filter(Boolean),
    tool: cb.tool.trim(),
    feat: FEATS[cb.feat] ? cb.feat : '',
    custom: true,
  };
}
function bgBonus() {
  const o = {};
  const bg = wizBg();
  if (!bg || !bg.ab.length) return o;
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
    ? [wizBg() && wizBg().feat, W.speciesKey === 'human' && W.humanFeat].filter(Boolean)
    : C().featKeys || [];
function extraSkills() {
  const sp = specOf(W.speciesKey);
  return (
    ((sp && sp.extraSkill && sp.extraSkill.n) || 0) +
    wizFeats().reduce((t, k) => t + ((FEATS[k] && FEATS[k].skills) || 0), 0)
  );
}
const bgSkills = () => (wizBg() ? wizBg().skills : []);
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
/* PG extra al subir de nivel si la mejora de este nivel sube el modificador de CON: 1 por nivel */
function hpConUp() {
  const def = wizDef(),
    a = W.asi;
  if (W.mode !== 'level' || !def || !a || !def.asi.includes(W.L)) return 0;
  const con = +C().abilities.con || 0;
  let up = 0;
  if (a.mode === '2') up = a.a === 'con' ? 2 : 0;
  else if (a.mode === '11') up = a.a === 'con' || a.b === 'con' ? 1 : 0;
  else if (a.mode === 'feat' && a.fs && FEATS[a.fs.k] && a.fs.ab === 'con' && con < ftCap(FEATS[a.fs.k]))
    up = 1;
  return (mod(Math.min(a.mode === 'feat' ? ftCap(FEATS[a.fs.k]) : 20, con + up)) - mod(con)) * W.L;
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
/* Órdenes de nivel 1 (clérigo y druida): opciones y lo que da cada una */
const ORDERS = {
  'Orden divino': {
    n: 'Orden divino',
    opts: [
      [
        'protector',
        'Protector',
        'Competencia con armas marciales y entrenamiento con armadura pesada.',
        { w: 'armas marciales', a: 'armaduras pesadas' },
      ],
      [
        'thaumaturge',
        'Taumaturgo',
        'Un truco de clérigo más, y sumas tu modificador de SAB (mínimo +1) a las pruebas de Conocimiento arcano y Religión.',
        { cantrip: 1, sk: ['arcana', 'religion'] },
      ],
    ],
  },
  'Presa del cazador': {
    n: 'Presa del cazador',
    opts: [
      [
        'colossus',
        'Asesino de colosos',
        'Una vez por turno, al impactar a una criatura a la que ya le faltan PG, +1d8 de daño.',
        {},
      ],
      [
        'horde',
        'Rompehordas',
        'Una vez por turno, al atacar con un arma, puedes atacar a otra criatura a 5 pies del objetivo original.',
        {},
      ],
    ],
  },
  'Orden primigenio': {
    n: 'Orden primigenio',
    opts: [
      [
        'magician',
        'Mago',
        'Un truco de druida más, y sumas tu modificador de SAB (mínimo +1) a las pruebas de Conocimiento arcano y Naturaleza.',
        { cantrip: 1, sk: ['arcana', 'nature'] },
      ],
      [
        'warden',
        'Guardián',
        'Competencia con armas marciales y entrenamiento con armadura media.',
        { w: 'armas marciales', a: 'armaduras intermedias' },
      ],
    ],
  },
};
const wizOrder = () => {
  const f = newFeatures().find(f => ORDERS[f[0]]);
  return f ? ORDERS[f[0]] : null;
};
const wizOrderOpt = () => (wizOrder() && wizOrder().opts.find(o => o[0] === W.order)) || null;
/* Pericia que se elige este nivel: cuántas habilidades y de qué lista (null = cualquiera en la que seas competente) */
const EXPERT_F = {
  Pericia: [2, null],
  'Explorador hábil': [1, null],
  Erudito: [1, ['arcana', 'history', 'investigation', 'medicine', 'nature', 'religion']],
};
const wizExpF = () => newFeatures().find(f => EXPERT_F[f[0]]);
const wizExpN = () => (wizExpF() ? EXPERT_F[wizExpF()[0]][0] : 0);
/* Habilidades en las que se puede coger pericia ahora: competente y sin pericia todavía */
function wizExpOpts() {
  const from = wizExpF() ? EXPERT_F[wizExpF()[0]][1] : null,
    prof =
      W.mode === 'create'
        ? [...bgSkills(), ...W.skills]
        : SKILLS.map(x => x[0]).filter(k => +C().skills[k] === 1);
  return prof.filter((k, i, a) => a.indexOf(k) === i && (!from || from.includes(k)));
}
function wizSpellLimits() {
  const def = wizDef(),
    ca = casterOf(def, wizSub());
  if (!ca) return null;
  const L = W.L,
    can =
      (ca.cantrips ? ca.cantrips[L - 1] : 0) +
      ((wizOrderOpt() && wizOrderOpt()[3].cantrip) || 0) +
      (W.mode === 'level' ? +C().cantripPlus || 0 : 0),
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
  W.ft = null;
  if (step.startsWith('ofeat:')) {
    const k = step.slice(6),
      f = FEATS[k];
    W.ft = wizOfs(k);
    const caster = !!casterOf(def, sub);
    return `<p>Tu dote de origen <b>${esc(f.n)}</b> te da conjuros. Elígelos aquí: quedarán en Magia.</p>
      ${ftPickerHTML(W.ft, wizOfsCtx(), [], true)}
      ${
        caster
          ? `<p class="hint">Los lanzas con tu aptitud mágica de ${esc(def.n.toLowerCase())}.</p>`
          : `<label class="f"><span>Aptitud mágica para estos conjuros</span><select id="wz-ofab">${['int', 'wis', 'cha'].map(a => `<option value="${a}" ${(W.ofsAb || 'int') === a ? 'selected' : ''}>${AB[a][2]} (${sgn(mod(W.ab[a]))})</option>`).join('')}</select></label>`
      }`;
  }
  switch (step) {
    case 'order': {
      const o = wizOrder();
      return `<p>Tu rasgo <b>${esc(o.n)}</b> te deja elegir una de estas dos opciones. La app apunta lo que da.</p>
      <div class="choice">${o.opts.map(([k, n, d]) => `<label><input type="radio" name="wz-order" value="${k}" ${W.order === k ? 'checked' : ''}><span><b>${esc(n)}</b><br><small>${esc(d)}</small></span></label>`).join('')}</div>`;
    }
    case 'expert': {
      const n = wizExpN(),
        opts = wizExpOpts();
      W.exp = (W.exp || []).filter(k => opts.includes(k));
      return `<p>Tu rasgo <b>${esc(wizExpF()[0])}</b> te da <b>pericia</b> en ${n === 1 ? 'una habilidad' : `${n} habilidades`} en las que ya seas competente: sumas el doble de tu bonificador de competencia.</p>
      <div class="chips">${opts.map(k => `<button class="chip ${W.exp.includes(k) ? 'on' : ''}" data-act="wz-exp" data-k="${k}">${SK[k][1]}</button>`).join('')}</div>
      <p class="hint">Llevas ${W.exp.length} de ${Math.min(n, opts.length)}.</p>`;
    }
    case 'style': {
      W.style = W.style || ftNew(['style']);
      W.ft = W.style;
      const alt = ['paladin', 'ranger'].includes(W.classKey);
      return `<p>Tu rasgo <b>Estilo de combate</b> te da una dote de estilo de combate. Elige una: lo que se pueda calcular (CA, ataques…) lo hace la app sola.</p>
      ${ftPickerHTML(W.style, wizFtCtx(), alt ? [['_none', 'Ninguno: elijo la otra opción del rasgo (trucos)']] : [])}
      ${alt && W.style.k === '_none' ? '<p class="hint">Añade esos trucos en el paso de conjuros o con «Buscar conjuros».</p>' : ''}`;
    }
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
      sp && / o /.test(sp.size || '')
        ? `<h3>Tamaño</h3><div class="choice"><label><input type="radio" name="wz-size" value="M" ${W.size !== 'P' ? 'checked' : ''}><span><b>Mediano</b><br><small>Entre 4 y 7 pies de alto (1,20 a 2,10 m).</small></span></label><label><input type="radio" name="wz-size" value="P" ${W.size === 'P' ? 'checked' : ''}><span><b>Pequeño</b><br><small>Entre 2 y 4 pies (0,60 a 1,20 m).</small></span></label></div>`
        : ''
    }
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
      const bg = BG[W.bgKey],
        cb = wizCbg(),
        cbg = wizBg() || { ab: [] };
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
        : `<label class="f"><span>Nombre del trasfondo</span><input id="wz-background" value="${esc(W.background)}"></label>
      <p class="hint">Rellena lo que te haya dado tu máster. Lo que dejes en blanco lo puedes poner después en ⚙ Ajustes → Editar ficha.</p>
      <h3>Aumento de características</h3><p class="hint">Un trasfondo deja subir tres características. Elígelas, o déjalas en blanco y suma tú los aumentos en el paso siguiente.</p>
      <div class="grid">${[0, 1, 2]
        .map(
          n =>
            `<label class="f"><span>Característica ${n + 1}</span>${abSel(
              `wz-cbab-${n}`,
              cb.ab[n],
              ABIL.map(a => a[0]).filter(k => k === cb.ab[n] || !cb.ab.includes(k))
            )}</label>`
        )
        .join('')}</div>
      ${
        cbg.ab.length
          ? `<div class="choice"><label><input type="radio" name="wz-bgmode" value="21" ${W.bgMode === '21' ? 'checked' : ''}><span><b>+2 a una y +1 a otra</b>${
              W.bgMode === '21'
                ? `<div class="grid" style="margin-top:.4rem"><label class="f"><span>+2</span>${abSel('wz-bg2', W.bg2, cbg.ab)}</label><label class="f"><span>+1</span>${abSel(
                    'wz-bg1',
                    W.bg1,
                    cbg.ab.filter(k => k !== W.bg2)
                  )}</label></div>`
                : ''
            }</span></label>
        <label><input type="radio" name="wz-bgmode" value="111" ${W.bgMode === '111' ? 'checked' : ''}><span><b>+1 a las tres</b></span></label></div>`
          : ''
      }
      <h3>Habilidades y herramienta</h3>
      <div class="grid">${[0, 1].map(n => `<label class="f"><span>Habilidad ${n + 1}</span><select id="wz-cbsk-${n}">${[['', '—'], ...SKILLS.filter(x => x[0] === cb.skills[n] || !cb.skills.includes(x[0])).map(x => [x[0], x[1]])].map(([k, t]) => `<option value="${k}" ${cb.skills[n] === k ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`).join('')}
        <label class="f wide"><span>Herramienta</span><input id="wz-cbtool" value="${esc(cb.tool)}" placeholder="Herramientas de ladrón, un juego…" autocomplete="off"></label></div>
      <h3>Dote de origen</h3>
      <div class="f"><span>Dote</span><select id="wz-cbfeat">${[
        ['', '— Ninguna por ahora —'],
        ['_custom', 'Otra (la escribo a mano)'],
        ...Object.entries(FEATS)
          .filter(([, f]) => f.cat === 'origin')
          .map(([k, f]) => [k, f.n]),
      ]
        .map(([k, t]) => `<option value="${k}" ${cb.feat === k ? 'selected' : ''}>${esc(t)}</option>`)
        .join('')}</select></div>
      ${
        cb.feat === '_custom'
          ? `<div class="grid"><label class="f wide"><span>Nombre de la dote</span><input id="wz-cbfn" value="${esc(cb.fn)}" autocomplete="off"></label><label class="f wide"><span>Qué hace</span><textarea id="wz-cbft" rows="3">${esc(cb.ft)}</textarea></label></div><p class="hint">Si la dote tiene usos limitados, ponlos después en ⚙ Ajustes → Editar ficha.</p>`
          : FEATS[cb.feat]
            ? `<p class="hint">${esc(FEATS[cb.feat].text)}</p>`
            : ''
      }`
    }
    ${
      W.speciesKey === 'human'
        ? `<h3>Versátil (humano)</h3><div class="f"><span>Dote de origen extra</span><select id="wz-hfeat">${[
            ['', '—'],
            ...Object.entries(FEATS)
              .filter(([, f]) => f.cat === 'origin')
              .map(([k, f]) => [k, f.n]),
          ]
            .map(([k, n]) => `<option value="${k}" ${W.humanFeat === k ? 'selected' : ''}>${n}</option>`)
            .join('')}</select></div>`
        : ''
    }`;
    }
    case 'abil': {
      const b = bgBonus();
      return `<p class="hint">Escribe las puntuaciones base (la matriz estándar es 15, 14, 13, 12, 10, 8). ${wizBg() && wizBg().ab.length ? 'Los aumentos del trasfondo se suman solos.' : 'Incluye ya los aumentos de tu trasfondo.'}</p>
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
    case 'equip': {
      const kits = CLASS_KITS[W.classKey] || [],
        bk = BG_KITS[W.bgKey];
      if (W.kit === undefined) W.kit = 0;
      if (W.bgKit === undefined) W.bgKit = 0;
      const opt = (nm, cur, v, title, sub) =>
        `<label><input type="radio" name="${nm}" value="${v}" ${cur === v ? 'checked' : ''}><span><b>${title}</b><br><small>${sub}</small></span></label>`;
      return `${
        kits.length
          ? `<h3>De tu clase (${esc(def.n.toLowerCase())})</h3><div class="choice">${kits
              .map((k, i) =>
                opt(
                  'wz-kit',
                  W.kit,
                  i,
                  `Equipo básico${kits.length > 1 ? `: ${esc(k.n)}` : ''}`,
                  `${esc(kitList(k))} y ${k.gp} po.`
                )
              )
              .join(
                ''
              )}${opt('wz-kit', W.kit, -1, 'Nada, lo añado yo', 'Sin equipo ni dinero de la clase.')}</div>`
          : ''
      }${
        bk
          ? `<h3>De tu trasfondo (${esc(BG[W.bgKey].n.toLowerCase())})</h3><div class="choice">${opt('wz-bgkit', W.bgKit, 0, 'Su equipo', `${esc(kitList(bk))} y ${bk.gp} po.`)}${opt('wz-bgkit', W.bgKit, 1, '50 po en su lugar', 'Te lo gastas tú en lo que quieras.')}${opt('wz-bgkit', W.bgKit, -1, 'Nada, lo añado yo', 'Sin equipo ni dinero del trasfondo.')}</div>`
          : '<p class="hint">Tu trasfondo es propio: su equipo lo añades tú desde la mochila.</p>'
      }
    <p class="hint">Es el equipo que trae el manual para empezar a jugar. Las armas, las armaduras y el dinero se colocan solos: la armadura y el escudo quedan puestos y la CA se calcula sola.</p>`;
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
      <label><input type="radio" name="wz-asi" value="feat" ${a.mode === 'feat' ? 'checked' : ''}><span><b>Una dote</b><br><small>Elígela del catálogo; si es casera, escríbela a mano.</small></span></label></div>
    ${
      a.mode === 'feat'
        ? ((W.ft = a.fs),
          ftPickerHTML(a.fs, wizFtCtx(), [['_custom', 'Otra (la escribo a mano)']]) +
            (a.fs.k === '_custom'
              ? `<div class="grid"><label class="f"><span>Dote</span><input id="wz-feat" value="${esc(a.feat)}" placeholder="Nombre de la dote"></label><label class="f wide"><span>Qué hace</span><textarea id="wz-feattext">${esc(a.featText)}</textarea></label></div><p class="hint">Si la dote sube una característica, cámbiala luego en ⚙ Ajustes → Editar ficha.</p>`
              : ''))
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
      /* Los que te van a dar gratis (especie, linaje, clase, subclase) no se ofrecen: no gastarías una elección */
      const sk = W.mode === 'create' ? W.speciesKey : C().speciesKey,
        lk = W.mode === 'create' ? W.lineageKey : C().lineageKey || W.lineageKey;
      P.skip = [
        ...originSpellIds(sk, lk, 1, L),
        ...alwaysIds(W.classKey, '', 1, L),
        ...(W.subKey ? alwaysIds('', W.subKey, 1, L) : []),
      ];
      const mine = W.spells.length
        ? `<div class="mine">${W.spells.map((s, i) => `<span class="chip">${esc(s.name)} <small>${+s.level ? 'N' + s.level : 'truco'}</small> <button class="b sm" style="padding:0 .3rem;border:0;background:none" data-act="wz-sp-del" data-i="${i}" aria-label="Quitar ${esc(s.name)}">×</button></span>`).join('')}</div>`
        : '<p class="empty">Ningún conjuro todavía.</p>';
      return `<p id="wz-counts">${countsHTML(l)}</p>
      <p class="hint">${l.ca.type === 'pact' ? 'Los brujos pueden cambiar un conjuro preparado al subir de nivel.' : 'Puedes cambiar conjuros preparados según las reglas de tu clase.'} Los conjuros que siempre tienes preparados (de clase, subclase o especie) se añaden solos al confirmar, no cuentan en el límite y no salen en la lista.</p>
      <h3>Tus conjuros</h3><div id="wz-mine">${mine}</div><h3>Añadir</h3>${spPickerHTML()}`;
    }
    case 'invoc':
      return ivHTML(wizIv());
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
      }<span>Salvaciones</span><b>${d ? d.saves.map(s => AB[s][1]).join(', ') : '—'}</b><span>Habilidades</span><b>${W.skills.length}</b><span>Conjuros</span><b>${W.spells.length}</b>${W.iv ? `<span>Invocaciones</span><b>${esc(W.iv.list.map(ivLabel).join(', ') || '—')}</b>` : ''}${W.style && FEATS[W.style.k] ? `<span>Estilo de combate</span><b>${esc(FEATS[W.style.k].n)}</b>` : ''}</div>
      ${newFeatures()
        .map(f => `<div class="feat"><b>${esc(f[0])}</b><p>${esc(f[1])}</p></div>`)
        .join('')}
      <p class="hint">Después podrás añadir armas, armaduras y herramientas desde la pestaña Partida, y los demás objetos y el dinero con los botones de la mochila y de las monedas.</p>`;
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
      <div class="diff"><span>PG máximos</span><b>${c.hp.max} → <span class="up">${c.hp.max + hpGain() + hpConUp()}</span></b>${hpConUp() ? `<span>Por subir la CON</span><b>+${hpConUp()} PG (1 por nivel)</b>` : ''}<span>Rasgos nuevos</span><b>${newFeatures().length}</b>${W.iv ? `<span>Invocaciones</span><b>${W.iv.list.length}</b>` : ''}${W.style && FEATS[W.style.k] ? `<span>Estilo de combate</span><b>${esc(FEATS[W.style.k].n)}</b>` : ''}${
        W.asi && def.asi.includes(L)
          ? `<span>${L === 19 ? 'Don épico' : 'Mejora'}</span><b>${esc(
              W.asi.mode === 'feat'
                ? FEATS[W.asi.fs.k]
                  ? FEATS[W.asi.fs.k].n
                  : W.asi.feat || '(sin nombre)'
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
  if (step === 'skills') {
    const sp = specOf(W.speciesKey),
      from = sp && sp.extraSkill && sp.extraSkill.from,
      cls = l => l.filter(k => def.skills.from.includes(k)).length >= def.skills.n;
    /* Si la especie obliga a elegir de una lista (Sentidos agudos del elfo), una de las elegidas tiene que ser de ella, aparte de las de clase */
    return (
      W.skills.length >= def.skills.n + extraSkills() &&
      (from ? W.skills.some(k => from.includes(k) && cls(W.skills.filter(x => x !== k))) : cls(W.skills))
    );
  }
  if (step === 'species') {
    const sp = specOf(W.speciesKey);
    return sp ? !sp.lin || !!W.lineageKey : !!W.species.trim();
  }
  if (step === 'background') {
    if (W.speciesKey === 'human' && !W.humanFeat) return false;
    if (!W.bgKey) {
      const cb = wizCbg(),
        n = cb.ab.filter(Boolean).length;
      if (!W.background.trim() || (n && n < 3)) return false;
      if (cb.feat === '_custom' && !cb.fn.trim()) return false;
      return n < 3 || W.bgMode === '111' || (!!W.bg2 && !!W.bg1 && W.bg1 !== W.bg2);
    }
    return W.bgMode === '111' || (!!W.bg2 && !!W.bg1 && W.bg1 !== W.bg2);
  }
  if (step.startsWith('ofeat:')) return !ftMissing(wizOfs(step.slice(6)), wizOfsCtx());
  if (step === 'order') return !!wizOrderOpt();
  if (step === 'expert') return (W.exp || []).length === Math.min(wizExpN(), wizExpOpts().length);
  if (step === 'lineage') return !!W.lineageKey;
  if (step === 'invoc') {
    const st = wizIv();
    return !ivProblems(st).length && st.list.length === ivMax(st.L);
  }
  if (step === 'hp') return W.hpMode === 'avg' || (+W.hpRoll >= 1 && +W.hpRoll <= def.hd);
  if (step === 'sub') return !!W.subKey;
  if (step === 'style') return !!W.style && (W.style.k === '_none' || !ftMissing(W.style, wizFtCtx()));
  if (step === 'asi') {
    const a = W.asi;
    if (a.mode === 'feat') return a.fs.k === '_custom' ? !!a.feat.trim() : !ftMissing(a.fs, wizFtCtx());
    if (a.mode === '2') return !!a.a && W.ab[a.a] + 2 <= 20;
    return !!a.a && !!a.b && a.a !== a.b && W.ab[a.a] < 20 && W.ab[a.b] < 20;
  }
  return true;
}
/* Estado de las dotes de origen con conjuros (asistente de creación) */
function wizOfs(k) {
  W.ofs = W.ofs || {};
  return (W.ofs[k] = W.ofs[k] || Object.assign(ftNew(['origin']), { k }));
}
const wizOfsCtx = () => Object.assign(wizFtCtx(), { keys: [] });
const STEP_HELP = {
  species: 'Elige especie (y su linaje si lo tiene).',
  background: 'Completa el trasfondo y sus aumentos.',
  lineage: 'Elige una opción.',
  pickclass: 'Elige una clase.',
  basics: 'Escribe un nombre y elige una clase.',
  skills:
    'Elige las habilidades que faltan. Si tu especie te da una de una lista, tiene que ser de esa lista.',
  hp: 'Escribe un resultado válido del dado.',
  sub: 'Elige una subclase.',
  asi: 'Completa la mejora (máximo 20 por característica) o elige la dote y sus opciones.',
  style: 'Elige un estilo de combate.',
  order: 'Elige una de las dos opciones.',
  expert: 'Elige las habilidades con pericia.',
  invoc: 'Elige tantas invocaciones como indica el contador y completa sus opciones.',
};
/* Datos que miran los requisitos de las dotes dentro del asistente */
function wizFtCtx() {
  const def = wizDef(),
    caster = !!casterOf(def, wizSub());
  if (W.mode === 'create') {
    const skills = {};
    [...bgSkills(), ...W.skills].forEach(k => (skills[k] = 1));
    return {
      L: 1,
      abil: W.ab,
      prof: def ? def.armor : '',
      caster,
      style: true,
      keys: wizFeats(),
      skills,
      spells: W.spells,
    };
  }
  const ctx = ftCtx(C());
  return Object.assign(ctx, {
    L: W.L,
    abil: W.ab,
    caster: caster || ctx.caster,
    style: ctx.style || newFeatures().some(f => norm(f[0]).startsWith(norm('Estilo de combate'))),
    spells: W.spells,
  });
}
/* Estado de las invocaciones dentro del asistente (se crea la primera vez que hace falta) */
function wizIv() {
  if (!W.iv) {
    const list = W.mode === 'level' ? ivFromChar(C()) : [];
    W.iv = { mode: W.mode, list, orig: [...list] };
  }
  W.iv.L = W.L;
  W.iv.spells = W.spells;
  return W.iv;
}
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
    enhanceSelects(sh);
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
    const bg = wizBg();
    c.backgroundKey = W.bgKey;
    c.background = bg ? bg.n : W.background;
    c.saveProf = [...def.saves];
    [...bgSkills(), ...W.skills].forEach(k => (c.skills[k] = 1));
    c.proficiencies.armor = def.armor;
    c.proficiencies.weapons = def.weapons;
    if (bg) c.proficiencies.tools = bg.tool;
    c.languages = 'Común y dos idiomas a elegir';
    c.featKeys = wizFeats().filter(k => !(FEATS[k] && FEATS[k].spPick));
    for (const k of c.featKeys)
      addFeature(
        c,
        FEATS[k].n,
        FEATS[k].text,
        k === W.humanFeat && W.speciesKey === 'human'
          ? 'Dote de origen (Versátil)'
          : `Dote de origen (${bg ? bg.n : 'trasfondo'})`
      );
    if (bg && bg.custom && wizCbg().feat === '_custom')
      addFeature(c, wizCbg().fn.trim(), wizCbg().ft.trim(), `Dote de origen (${bg.n})`);
    c.hp.max = c.hp.current = hpGain();
    c.ac =
      10 +
      mod(W.ab.dex) +
      (W.classKey === 'barbarian' ? mod(W.ab.con) : W.classKey === 'monk' ? mod(W.ab.wis) : 0);
    if (W.speciesKey === 'human') c.inspiration = true;
    S.chars.push(c);
    S.active = c.id;
    /* Un personaje recién creado no se quita con «Deshacer» */
    undoCut = true;
  } else {
    c = C();
    const g = hpGain();
    c.hp.max += g;
    c.hp.current += g;
    if (W.asi && def.asi.includes(L)) {
      const a = W.asi;
      if (a.mode === 'feat' && a.fs.k === '_custom')
        c.features.push({
          name: a.feat.trim(),
          source: L === 19 ? 'Don épico (nivel 19)' : `Dote (nivel ${L})`,
          text: a.featText,
          uses: { max: 0, used: 0, recover: '' },
        });
      else if (a.mode === 'feat') {
        /* la dote del catálogo se aplica más abajo, con el nivel y los conjuros ya puestos */
      } else {
        const con0 = mod(c.abilities.con);
        if (a.mode === '2') c.abilities[a.a] = Math.min(20, c.abilities[a.a] + 2);
        else {
          c.abilities[a.a] = Math.min(20, c.abilities[a.a] + 1);
          c.abilities[a.b] = Math.min(20, c.abilities[a.b] + 1);
        }
        conHpAdj(c, con0, L);
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
  // pericia y órdenes elegidas en el asistente
  if (wizExpN()) (W.exp || []).forEach(k => (c.skills[k] = 2));
  if (wizOrderOpt()) {
    const [, on, , g] = wizOrderOpt(),
      f = c.features.find(x => x.name === wizOrder().n);
    if (f && !/Elegido:/.test(f.text)) f.text += `\n\nElegido: ${on}.`;
    if (g.w && !norm(c.proficiencies.weapons || '').includes('marcial'))
      c.proficiencies.weapons = [c.proficiencies.weapons, g.w].filter(Boolean).join(', ');
    if (g.a) c.proficiencies.armor = [c.proficiencies.armor, g.a].filter(Boolean).join(', ');
    if (g.cantrip) c.cantripPlus = (+c.cantripPlus || 0) + g.cantrip;
    if (g.sk) c.skillPlus = Object.assign({}, c.skillPlus, Object.fromEntries(g.sk.map(k => [k, 'wis'])));
    syncWeapons(c);
  }
  // invocaciones del brujo
  if (W.classKey === 'warlock') ivApply(c, wizIv());
  // dotes del catálogo (mejora de nivel y estilo de combate)
  if (W.asi && def.asi.includes(L) && W.asi.mode === 'feat' && FEATS[W.asi.fs.k])
    featApply(c, W.asi.fs, L === 19 ? 'Don épico (nivel 19)' : `Dote (nivel ${L})`);
  if (W.style && FEATS[W.style.k]) featApply(c, W.style, 'Estilo de combate');
  // dotes de origen con conjuros (Iniciado en la magia), con los conjuros elegidos
  if (W.mode === 'create') {
    const bg = wizBg();
    wizFeats()
      .filter((k, i, a) => FEATS[k] && FEATS[k].spPick && a.indexOf(k) === i)
      .forEach(k =>
        featApply(
          c,
          wizOfs(k),
          bg && bg.feat === k ? `Dote de origen (${bg.n})` : 'Dote de origen (Versátil)'
        )
      );
    if (!c.spellcasting.ability && wizFeats().some(k => FEATS[k] && FEATS[k].spPick))
      c.spellcasting.ability = W.ofsAb || 'int';
  }
  // conjuros siempre preparados de clase y subclase
  addAlways(c, [
    ...alwaysIds(c.classKey, '', W.mode === 'create' ? 1 : L, L),
    ...alwaysIds('', c.subclassKey, W.mode === 'level' && !W.origSub ? 1 : L, L),
  ]);
  // especie, linaje y dotes de origen
  if (W.mode === 'create') {
    applyOrigin(c);
    if (/ o /.test(c.size || '')) c.size = W.size || 'M';
  } else {
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
  // equipo inicial de la clase y del trasfondo
  if (
    W.mode === 'create' &&
    (W.kit === undefined || W.kit >= 0) &&
    CLASS_KITS[W.classKey] &&
    CLASS_KITS[W.classKey][W.kit || 0]
  )
    kitGive(c, CLASS_KITS[W.classKey][W.kit || 0]);
  if (W.mode === 'create' && BG_KITS[W.bgKey]) {
    if (W.bgKit === 0 || W.bgKit === undefined) kitGive(c, BG_KITS[W.bgKey]);
    else if (W.bgKit === 1) c.coins.gp = (+c.coins.gp || 0) + 50;
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
      ? `<div class="t-label">Personaje creado</div><div class="t-big">${esc(name)}</div><div class="t-parts">${C().equipment.length ? 'Tu equipo ya está en la mochila. Puedes añadir más desde la pestaña Partida o con el botón de la mochila.' : 'Añade armas, armaduras y herramientas desde la pestaña Partida, y los demás objetos con el botón de la mochila.'}</div>`
      : `<div class="t-label">¡Subida de nivel!</div><div class="t-big">${esc(def.n)} ${L}</div><div class="t-parts">Rasgos, recursos y espacios actualizados.</div>${
          C().classKey === 'wizard'
            ? `<div class="t-parts"><b>Libro de conjuros:</b> apunta 2 conjuros de mago nuevos (gratis, de un nivel que puedas lanzar).${C().subclassKey && /savant|evoker|abjurer|diviner|illusionist/.test(C().subclassKey) && (L === 3 || [5, 7, 9].includes(L)) ? ` Por ser ${esc(subOf(C()).n)}, apunta también ${L === 3 ? '2 conjuros' : '1 conjuro'} de tu escuela gratis.` : ''}</div><div class="t-actions"><button class="b sm pri" data-act="book-open">Abrir el libro</button></div>`
            : ''
        }`,
    mode !== 'create' && C().classKey === 'wizard'
  );
  ivFeatAsk();
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
/* ── Equipo inicial de la clase ── */
function kitName([code, q, nm]) {
  const n =
    nm ||
    (code.startsWith('pk:') ? PACKS[code.slice(3)].n : code.includes(':') ? shInfo({ c: code }).n : code);
  return code.startsWith('m:') ? `${n} (${q})` : q > 1 ? `${n} ×${q}` : n;
}
const kitList = k =>
  k.items
    .map(kitName)
    .join(', ')
    .replace(/^./, m => m.toUpperCase());
function kitGive(c, kit) {
  kit.items.forEach(([code, q, nm]) => {
    const [k, key] = code.split(':');
    if (k === 'pk') return packGive(c, key, q);
    if (!code.includes(':')) {
      const ex = c.equipment.find(e => norm(e.name) === norm(code) && !e.weapon && !e.armor);
      if (ex) ex.qty = (+ex.qty || 0) + q;
      else c.equipment.push({ id: uid(), name: code, qty: q, cat: 'otro', notes: '' });
      return;
    }
    const [id] = shGive(
        c,
        { c: code, u: k === 'g' && GEAR[key] && GEAR[key].qty ? GEAR[key].qty : 1 },
        k === 'm' || k === 'g' ? q : 1
      ),
      e = c.equipment.find(x => x.id === id);
    if (!e) return;
    if (k !== 'm' && k !== 'g' && q > 1) e.qty = q;
    if (nm) {
      e.name = nm;
      c.attacks.forEach(a => {
        if (a.item === e.id) a.name = nm;
      });
    }
    if (k === 'a' || k === 'w') e.equipped = true;
  });
  c.coins.gp = (+c.coins.gp || 0) + kit.gp;
  syncWeapons(c);
}
