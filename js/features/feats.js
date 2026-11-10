/* Dotes: catálogo con desplegable, requisitos, opciones y aplicación a la ficha (y cómo deshacerla). */
'use strict';

const FT_CATS = [
  ['origin', 'Dotes de origen'],
  ['general', 'Dotes generales (nivel 4+)'],
  ['style', 'Estilos de combate'],
  ['epic', 'Dones épicos (nivel 19+)'],
];
const FT_ARMOR = {
  l: ['liger', 'armaduras ligeras'],
  m: ['intermed', 'armaduras intermedias'],
  h: ['pesad', 'armaduras pesadas'],
  s: ['escud', 'escudos'],
};
const FT_SRC_SP = 'Dote';
let FTS = null; // estado de la ventana «Dotes» fuera del asistente

const ftNew = cats => ({ k: '', ab: '', opt: '', sk: [], pe: '', exp: [], sp: [], cats });
const ftCap = f => (f.cat === 'epic' ? 30 : 20);
const ftCount = (g, L) => (g.n === 'pb' ? pbAt(L) : g.n);
const ftHasStyle = c => !!c && c.features.some(f => norm(f.name).startsWith(norm('Estilo de combate')));

/* Datos del personaje que miran los requisitos */
function ftCtx(c) {
  return {
    L: c.level,
    abil: c.abilities,
    prof: c.proficiencies.armor || '',
    caster: !!casterOf(defOf(c), subOf(c)) || !!c.spellcasting.ability,
    style: ftHasStyle(c),
    keys: c.featKeys || [],
    skills: c.skills,
    spells: c.spells,
  };
}
/* Por qué no se puede coger una dote ('' si se puede) */
function ftWhyNot(k, ctx, cats) {
  const f = FEATS[k],
    r = f.req || {};
  if (cats && !cats.includes(f.cat)) return 'no se puede elegir aquí';
  if (!f.rep && ctx.keys.includes(k)) return 'ya la tienes';
  if (f.cat === 'general' && ctx.L < 4) return 'nivel 4';
  if (f.cat === 'epic' && ctx.L < 19) return 'nivel 19';
  if (f.cat === 'style' && !ctx.style) return 'el rasgo Estilo de combate';
  if (r.ab && !r.ab.some(a => (+ctx.abil[a] || 0) >= r.min))
    return `${r.ab.map(a => AB[a][1]).join(' o ')} ${r.min}`;
  if (r.armor) {
    const p = norm(ctx.prof);
    if (!/todas/.test(p) && !p.includes(FT_ARMOR[r.armor][0]))
      return `entrenamiento con ${FT_ARMOR[r.armor][1]}`;
  }
  if (r.cast && !ctx.caster) return 'poder lanzar conjuros';
  return '';
}
const ftWhyLabel = why =>
  why === 'ya la tienes' || why === 'no se puede elegir aquí' ? why : `necesitas ${why}`;
/* Opciones de cada desplegable de la dote elegida */
function ftSkillOpts(fs, ctx, i) {
  return SKILLS.filter(
    s => !(+ctx.skills[s[0]] >= 1) && !fs.sk.some((x, j) => j !== i && x === s[0]) && fs.pe !== s[0]
  );
}
function ftExpOpts(fs, ctx, i) {
  const f = FEATS[fs.k];
  return SKILLS.filter(s => {
    const p = +ctx.skills[s[0]] || 0;
    const prof = p >= 1 || f.allSk || fs.sk.includes(s[0]) || (fs.pe === s[0] && p === 0);
    return prof && p < 2 && !(fs.pe === s[0] && p >= 1) && !fs.exp.some((x, j) => j !== i && x === s[0]);
  });
}
function ftSpellOpts(fs, ctx, g, gi, i) {
  const used = fs.sp.flatMap((a, x) => (a || []).filter((v, j) => !(x === gi && j === i)));
  return SP.filter(
    s =>
      +s.l === g.lv &&
      (!g.cls || s.c.includes(g.cls)) &&
      (!g.school || g.school.includes(s.s)) &&
      (!g.ritual || s.ri) &&
      !ctx.spells.some(x => x.ref === s.id) &&
      !used.includes(s.id)
  ).sort((a, b) => a.n.localeCompare(b.n, 'es'));
}
/* Lo que falta por completar ('' si está todo) */
function ftMissing(fs, ctx) {
  if (!fs.k) return 'Elige una dote.';
  const f = FEATS[fs.k];
  const why = ftWhyNot(fs.k, ctx, fs.cats);
  if (why) return `No puedes coger ${f.n} (${ftWhyLabel(why)}).`;
  if (f.ab && f.ab.length && !fs.ab) return 'Elige qué característica sube.';
  if (f.opt && !fs.opt.trim()) return `Elige: ${f.opt.label.toLowerCase()}.`;
  if (f.skills && fs.sk.filter(Boolean).length < f.skills) return 'Elige las habilidades.';
  if (f.pe && !fs.pe) return 'Elige la habilidad.';
  if (f.exp && fs.exp.filter(Boolean).length < f.exp) return 'Elige la habilidad con pericia.';
  for (const [gi, g] of (f.spPick || []).entries()) {
    const n = Math.min(ftCount(g, ctx.L), ftSpellOpts(ftNew(), ctx, g, -1, -1).length);
    if ((fs.sp[gi] || []).filter(Boolean).length < n) return 'Elige los conjuros.';
  }
  return '';
}
function ftSel(attr, val, opts, ph = '—') {
  return `<select ${attr}>${[['', ph], ...opts].map(([k, t, dis]) => `<option value="${esc(k)}" ${val === k ? 'selected' : ''} ${dis ? 'disabled' : ''}>${esc(t)}</option>`).join('')}</select>`;
}
/* Desplegable de dotes + opciones de la elegida. extra: opciones añadidas al principio, como [['_custom', 'Otra…']] */
function ftPickerHTML(fs, ctx, extra = [], lock = false) {
  const groups = FT_CATS.filter(([cat]) => !fs.cats || fs.cats.includes(cat))
    .map(([cat, lbl]) => {
      const opts = Object.entries(FEATS)
        .filter(([, f]) => f.cat === cat)
        .sort((a, b) => a[1].n.localeCompare(b[1].n, 'es'))
        .map(([k, f]) => {
          const why = ftWhyNot(k, ctx, fs.cats);
          return `<option value="${k}" ${fs.k === k ? 'selected' : ''} ${why ? 'disabled' : ''}>${esc(f.n)}${why ? ` (${esc(ftWhyLabel(why))})` : ''}</option>`;
        })
        .join('');
      return `<optgroup label="${esc(lbl)}">${opts}</optgroup>`;
    })
    .join('');
  const sel = `<label class="f"><span>Dote</span><select data-fs="k"><option value="">— Elige una dote —</option>${extra.map(([k, t]) => `<option value="${k}" ${fs.k === k ? 'selected' : ''}>${esc(t)}</option>`).join('')}${groups}</select></label>`;
  const f = FEATS[fs.k];
  if (!f) return sel;
  if (lock) {
    const rowsOnly = (f.spPick || []).flatMap((g, gi) =>
      Array.from(
        { length: ftCount(g, ctx.L) },
        (_, i) =>
          `<label class="f"><span>${g.lv ? `Conjuro de nivel ${g.lv}` : 'Truco'}${ftCount(g, ctx.L) > 1 ? ` ${i + 1}` : ''}</span>${ftSel(
            `data-fs="sp" data-g="${gi}" data-i="${i}"`,
            (fs.sp[gi] || [])[i] || '',
            ftSpellOpts(fs, ctx, g, gi, i).map(s => [s.id, s.n])
          )}</label>`
      )
    );
    return `<div class="feat"><b>${esc(f.n)}</b><p>${esc(f.text)}</p></div><div class="grid">${rowsOnly.join('')}</div>`;
  }
  const L = ctx.L,
    rows = [];
  if (f.ab && f.ab.length)
    rows.push(
      `<label class="f"><span>Sube +1</span>${ftSel(
        'data-fs="ab"',
        fs.ab,
        f.ab.map(a => [
          a,
          `${AB[a][2]} (${ctx.abil[a]})${+ctx.abil[a] >= ftCap(f) ? ' · ya al máximo' : ''}`,
          +ctx.abil[a] >= ftCap(f),
        ])
      )}</label>`
    );
  if (f.opt)
    rows.push(
      f.opt.list
        ? `<label class="f"><span>${esc(f.opt.label)}</span>${ftSel(
            'data-fs="opt"',
            fs.opt,
            f.opt.list.map(x => [x, x])
          )}</label>`
        : `<label class="f"><span>${esc(f.opt.label)}</span><input id="fs-opt" value="${esc(fs.opt)}" autocomplete="off"></label>`
    );
  for (let i = 0; i < (f.skills || 0); i++)
    rows.push(
      `<label class="f"><span>Habilidad ${f.skills > 1 ? i + 1 : ''} (competencia)</span>${ftSel(
        `data-fs="sk" data-i="${i}"`,
        fs.sk[i] || '',
        ftSkillOpts(fs, ctx, i).map(s => [s[0], s[1]])
      )}</label>`
    );
  if (f.pe)
    rows.push(
      `<label class="f"><span>Habilidad</span>${ftSel(
        'data-fs="pe"',
        fs.pe,
        f.pe.map(k => [
          k,
          `${SK[k][1]} (${+ctx.skills[k] >= 2 ? 'ya tienes pericia' : +ctx.skills[k] >= 1 ? 'ganas pericia' : 'ganas competencia'})`,
          +ctx.skills[k] >= 2,
        ])
      )}</label>`
    );
  for (let i = 0; i < (f.exp || 0); i++)
    rows.push(
      `<label class="f"><span>Pericia</span>${ftSel(
        `data-fs="exp" data-i="${i}"`,
        fs.exp[i] || '',
        ftExpOpts(fs, ctx, i).map(s => [s[0], s[1]])
      )}</label>`
    );
  (f.spPick || []).forEach((g, gi) => {
    const n = ftCount(g, L);
    for (let i = 0; i < n; i++)
      rows.push(
        `<label class="f"><span>${g.lv ? `Conjuro de nivel ${g.lv}` : 'Truco'}${n > 1 ? ` ${i + 1}` : ''}</span>${ftSel(
          `data-fs="sp" data-g="${gi}" data-i="${i}"`,
          (fs.sp[gi] || [])[i] || '',
          ftSpellOpts(fs, ctx, g, gi, i).map(s => [s.id, s.n])
        )}</label>`
      );
  });
  const auto = [
    f.initPB && 'iniciativa',
    (f.hpPerLevel || f.hp) && 'PG máximos',
    f.speed && 'velocidad',
    f.acArmor && 'CA',
    f.mam && 'CA',
    (f.rangedAtk || f.heavyPB) && 'ataques',
    f.save && 'salvación',
    (f.skills || f.pe || f.exp || f.allSk) && 'habilidades',
    (f.armorProf || f.wpnProf || f.toolProf) && 'competencias',
    f.res && 'usos',
    (f.sp || f.spPick) && 'conjuros',
  ].filter((x, i, a) => x && a.indexOf(x) === i);
  return `${sel}<div class="feat"><b>${esc(f.n)}</b><p>${esc(f.text)}</p>${auto.length ? `<p class="hint">La app actualiza sola: ${auto.join(', ')}.</p>` : ''}</div>${rows.length ? `<div class="grid">${rows.join('')}</div>` : ''}`;
}
/* Estado y repintado del desplegable activo (asistente o ventana propia) */
const ftState = () => (W && W.ft) || FTS;
function ftRefresh() {
  if (W && W.ft) {
    W._keepScroll = true;
    renderWizard();
    return;
  }
  const b = $('#ft-body');
  if (!b || !FTS) return;
  const sc = b.scrollTop;
  b.innerHTML = ftModalBody();
  enhanceSelects(b);
  b.scrollTop = sc;
}
function ftSet(el) {
  const fs = ftState();
  if (!fs) return;
  const k = el.dataset.fs,
    i = +el.dataset.i;
  if (k === 'k') Object.assign(fs, ftNew(fs.cats), { k: el.value });
  else if (k === 'sk' || k === 'exp') fs[k][i] = el.value;
  else if (k === 'sp') {
    const g = +el.dataset.g;
    fs.sp[g] = fs.sp[g] || [];
    fs.sp[g][i] = el.value;
  } else fs[k] = el.value;
  ftRefresh();
}

/* Aplica la dote a la ficha y guarda en c.featData lo necesario para deshacerla */
function featApply(c, fs, src) {
  const f = FEATS[fs.k],
    k = fs.k;
  const rec = { k, ab: '', opt: fs.opt.trim(), sk: [], save: false, prof: {}, sp: [], spConv: [], src };
  const name = f.n + (rec.opt ? ` (${rec.opt})` : '');
  rec.feat = name;
  const notes = [];
  if (fs.ab && c.abilities[fs.ab] < ftCap(f)) {
    c.abilities[fs.ab] = Math.min(ftCap(f), c.abilities[fs.ab] + 1);
    rec.ab = fs.ab;
    notes.push(`${AB[fs.ab][2]} +1`);
  }
  if (f.save && fs.ab && !c.saveProf.includes(fs.ab)) {
    c.saveProf.push(fs.ab);
    rec.save = true;
    notes.push(`competencia en salvaciones de ${AB[fs.ab][2]}`);
  }
  const setSk = (s, v) => {
    rec.sk.push([s, +c.skills[s] || 0]);
    c.skills[s] = v;
  };
  fs.sk.filter(Boolean).forEach(s => setSk(s, Math.max(1, +c.skills[s] || 0)));
  if (f.pe && fs.pe) {
    const had = +c.skills[fs.pe] >= 1;
    setSk(fs.pe, had ? 2 : 1);
    notes.push(`${had ? 'pericia' : 'competencia'} en ${SK[fs.pe][1]}`);
  }
  if (f.allSk) SKILLS.forEach(s => !(+c.skills[s[0]] >= 1) && setSk(s[0], 1));
  fs.exp.filter(Boolean).forEach(s => {
    setSk(s, 2);
    notes.push(`pericia en ${SK[s][1]}`);
  });
  if (fs.sk.filter(Boolean).length)
    notes.push(
      `competencia en ${fs.sk
        .filter(Boolean)
        .map(s => SK[s][1])
        .join(', ')}`
    );
  for (const [field, key] of [
    ['armor', 'armorProf'],
    ['weapons', 'wpnProf'],
    ['tools', 'toolProf'],
  ])
    if (f[key]) {
      const cur = c.proficiencies[field] || '';
      c.proficiencies[field] = cur ? `${cur}, ${f[key]}` : f[key].replace(/^./, m => m.toUpperCase());
      rec.prof[field] = f[key];
    }
  const hp = (f.hp || 0) + (f.hpPerLevel || 0) * c.level;
  if (hp) {
    c.hp.max += hp;
    c.hp.current += hp;
  }
  c.featKeys = [...(c.featKeys || []), k];
  c.features.push({
    name,
    source: src,
    text: f.text + (notes.length ? `\n\nElegido: ${notes.join('; ')}.` : ''),
    uses: { max: 0, used: 0, recover: '' },
  });
  upsertRes(c, originRes(c.speciesKey, c.lineageKey, c.featKeys, c.level), 'Dote');
  const addSp = (id, fr) => {
    const d = SPBY[id];
    if (!d) return;
    const free = fr !== undefined && f.res && f.res[fr] ? f.res[fr].n : '';
    const ex = c.spells.find(s => s.ref === id);
    if (ex) {
      if (!ex.src) {
        Object.assign(ex, { src: FT_SRC_SP, free });
        rec.spConv.push(id);
      }
      return;
    }
    c.spells.push(Object.assign(NEW.spells(), spellObj(d), { src: FT_SRC_SP, free }));
    rec.sp.push(id);
  };
  (f.sp || []).forEach(x => addSp(x.id, x.free));
  (f.spPick || []).forEach((g, gi) => (fs.sp[gi] || []).filter(Boolean).forEach(id => addSp(id, g.free)));
  c.spells.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'es'));
  if (!c.spellcasting.ability && (f.sp || f.spPick) && fs.ab && ['int', 'wis', 'cha'].includes(fs.ab))
    c.spellcasting.ability = fs.ab;
  (c.featData = c.featData || []).push(rec);
  syncWeapons(c);
}
/* Quita una dote. rec: su registro en c.featData, o null para una dote sin registro (p. ej. la del trasfondo) */
function featRemove(c, k, rec) {
  const f = FEATS[k];
  if (rec) {
    if (rec.ab) c.abilities[rec.ab] = Math.max(1, c.abilities[rec.ab] - 1);
    if (rec.save) c.saveProf = c.saveProf.filter(x => x !== rec.ab);
    [...rec.sk].reverse().forEach(([s, prev]) => (c.skills[s] = prev));
    for (const field in rec.prof) {
      const add = rec.prof[field],
        cur = c.proficiencies[field] || '';
      c.proficiencies[field] = cur.includes(`, ${add}`)
        ? cur.replace(`, ${add}`, '')
        : norm(cur) === norm(add)
          ? ''
          : cur;
    }
    c.spells = c.spells.filter(s => !(rec.sp.includes(s.ref) && s.src === FT_SRC_SP));
    c.spells.forEach(s => {
      if (rec.spConv.includes(s.ref) && s.src === FT_SRC_SP) Object.assign(s, { src: '', free: '' });
    });
    c.featData = c.featData.filter(x => x !== rec);
  }
  const hp = (f.hp || 0) + (f.hpPerLevel || 0) * c.level;
  if (hp) {
    c.hp.max = Math.max(1, c.hp.max - hp);
    c.hp.current = Math.min(c.hp.current, c.hp.max);
  }
  const i = (c.featKeys || []).indexOf(k);
  if (i >= 0) c.featKeys.splice(i, 1);
  const fname = rec ? rec.feat : f.n,
    fi = c.features.findIndex(x => x.name === fname);
  if (fi >= 0) c.features.splice(fi, 1);
  if (!c.featKeys.includes(k)) {
    const still = originRes(c.speciesKey, c.lineageKey, c.featKeys, c.level).map(r => r.n);
    const gone = (f.res || []).map(r => r.n).filter(n => !still.includes(n));
    c.features = c.features.filter(x => !gone.includes(x.name));
  }
  syncWeapons(c);
}
/* Dotes del catálogo que tiene la ficha: con registro (añadidas aquí) y sin él (trasfondo, humano…) */
function ftOwned(c) {
  const recs = (c.featData || []).filter(r => FEATS[r.k]);
  const left = [...(c.featKeys || [])];
  recs.forEach(r => {
    const i = left.indexOf(r.k);
    if (i >= 0) left.splice(i, 1);
  });
  return [
    ...recs.map(r => ({ k: r.k, rec: r, name: r.feat })),
    ...left.filter(k => FEATS[k]).map(k => ({ k, rec: null, name: FEATS[k].n })),
  ];
}
function ftModalBody() {
  const c = C(),
    ctx = ftCtx(c),
    own = ftOwned(c);
  const miss = ftMissing(FTS, ctx);
  return `<p class="hint">Normalmente ganas dotes con tu trasfondo, al subir de nivel (en vez de la Mejora de característica) o con rasgos como Estilo de combate; el asistente de subir de nivel te las ofrece. Aquí puedes añadir una si tu máster te la da o corregir tu ficha. Una dote casera añádela como rasgo en ⚙ Ajustes → Editar ficha.</p>
    <h3>Tus dotes</h3>${
      own.length
        ? `<div class="list">${own
            .map(
              (o, i) =>
                `<div class="it"><div class="it-head"><span class="it-name">${esc(o.name)}</span><button class="b sm" data-act="ft-del" data-i="${i}">Quitar</button></div><div class="meta">${esc(FT_CATS.find(x => x[0] === FEATS[o.k].cat)[1])}</div></div>`
            )
            .join(
              ''
            )}</div><p class="hint">Al quitar una dote se deshace lo que la app sumó (características, habilidades, PG, conjuros…).</p>`
        : '<p class="empty">Ninguna dote del catálogo todavía.</p>'
    }
    <h3>Añadir una dote</h3>${ftPickerHTML(FTS, ctx)}
    ${FTS.k && miss ? `<p class="hint warn">${esc(miss)}</p>` : ''}
    <div class="btns"><button class="b pri" data-act="ft-add" ${miss ? 'disabled' : ''}>Añadir dote</button></div>`;
}
function openFeats() {
  FTS = ftNew(null);
  openModal(
    `<div class="wz-head"><h2>Dotes</h2><button class="b sm" data-act="ft-close">Hecho</button></div><div class="wz-body" id="ft-body">${ftModalBody()}</div>`,
    true
  );
}
