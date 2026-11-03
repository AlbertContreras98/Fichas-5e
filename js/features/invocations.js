/* Invocaciones sobrenaturales del brujo: catálogo, elección (asistente y ventana propia) y aplicación a la ficha. */
'use strict';

const IVBY = Object.fromEntries(INVOCS.map(d => [d.id, d]));
const IV_PRE = /^invocaci[oó]n\s*:\s*/i;
const IV_SRC = 'Invocación';
const IV_FEAT_SRC = 'Lecciones de los Primeros';
let IVS = null; // estado de la ventana «Invocaciones» fuera del asistente

const ivMax = L => (CL.warlock.info.Invocaciones || [])[L - 1] || 0;
const ivLabel = e =>
  e.custom ? e.name.replace(IV_PRE, '') : IVBY[e.id].n + (e.pick ? ` (${ivPickName(e)})` : '');
const ivName = e => (e.custom ? e.name : `Invocación: ${ivLabel(e)}`);
const ivPickName = e => (IVBY[e.id].pick === 'feat' ? (FEATS[e.pick] || { n: e.pick }).n : e.pick);

/* Busca una invocación del catálogo por su nombre (en castellano, en inglés o un nombre alternativo) */
function ivFind(n) {
  const k = norm(n);
  return INVOCS.find(d => [d.n, d.en, ...(d.al || [])].some(x => norm(x) === k)) || null;
}
/* Lee las invocaciones que ya tiene la ficha: las que empiezan por «Invocación:» y las del catálogo escritas a mano sin ese prefijo */
function ivFromChar(c) {
  const list = [];
  if (!c) return list;
  for (const f of c.features) {
    const pre = IV_PRE.test(f.name),
      base = f.name.replace(IV_PRE, '').trim(),
      m = base.match(/^(.*?)\s*\((.*)\)\s*$/);
    const d = ivFind(base) || (m && ivFind(m[1]));
    if (d) {
      let pick = '';
      if (d.pick && m && ivFind(m[1]) === d) {
        if (d.pick === 'feat') pick = Object.keys(FEATS).find(k => norm(FEATS[k].n) === norm(m[2])) || '';
        else pick = m[2];
      }
      list.push({ id: d.id, pick, from: f.name, featFrom: d.pick === 'feat' ? pick : '' });
    } else if (pre) list.push({ custom: true, name: f.name, from: f.name });
  }
  return list;
}
/* Trucos de la lista que cumplen el requisito de una invocación */
function ivCantrips(spells, need) {
  return spells
    .filter(s => +s.level === 0)
    .filter(s => {
      const d = s.ref && SPBY[s.ref];
      if (d && !d.c.includes('warlock')) return false;
      const de = (d ? d.de : s.desc) || '';
      if (!/\d+d\d+ de daño/i.test(de)) return false;
      if (need === 'atk' && !/ataque de conjuro/i.test(de)) return false;
      if (need === 'range' && !((parseInt(d ? d.r : s.range) || 0) >= 10)) return false;
      return true;
    })
    .map(s => s.name);
}
/* Por qué no se puede tener una invocación ('' si se puede). idx: posición si ya está elegida */
function ivWhyNot(st, d, idx) {
  if (!d.rep && st.list.some((e, i) => e.id === d.id && i !== idx)) return 'Ya la tienes.';
  const why = [];
  if (st.L < d.lv) why.push(`brujo de nivel ${d.lv}`);
  if (d.req && !st.list.some(e => e.id === d.req)) why.push(IVBY[d.req].n);
  if (d.need && !ivCantrips(st.spells, d.need).length)
    why.push(
      d.need === 'atk'
        ? 'un truco de brujo que haga daño con tirada de ataque'
        : d.need === 'range'
          ? 'un truco de brujo que haga daño a 10 pies o más'
          : 'un truco de brujo que haga daño'
    );
  return why.length ? `Necesitas: ${why.join(', ')}.` : '';
}
/* Opciones a elegir dentro de una invocación (truco o dote), sin las que ya usan otras copias */
function ivPickOpts(st, i) {
  const e = st.list[i],
    d = IVBY[e.id],
    used = st.list.filter((x, j) => j !== i && x.id === e.id).map(x => x.pick);
  const all =
    d.pick === 'feat'
      ? Object.entries(FEATS)
          .filter(([, f]) => f.cat === 'origin')
          .map(([k, f]) => [k, f.n])
      : ivCantrips(st.spells, d.need).map(n => [n, n]);
  return all.filter(([k]) => !used.includes(k) || k === e.pick);
}
function ivProblems(st) {
  const out = [],
    max = ivMax(st.L);
  if (st.list.length > max)
    out.push(`Tienes ${st.list.length} invocaciones y a nivel ${st.L} solo puedes tener ${max}.`);
  st.list.forEach((e, i) => {
    if (e.custom) return;
    const d = IVBY[e.id],
      w = ivWhyNot(st, d, i);
    if (w) out.push(`${d.n}: ${w}`);
    if (d.pick && !e.pick) out.push(`${d.n}: elige ${d.pick === 'feat' ? 'la dote' : 'el truco'}.`);
  });
  return out;
}
function ivHTML(st) {
  const max = ivMax(st.L),
    n = st.list.length,
    full = n >= max,
    probs = ivProblems(st);
  const swapped = st.orig.filter(o => !st.list.includes(o)).length;
  const mine = n
    ? `<div class="list">${st.list
        .map((e, i) => {
          const d = !e.custom && IVBY[e.id];
          const sel =
            d && d.pick
              ? `<label class="f"><span>${d.pick === 'feat' ? 'Dote de origen' : 'Truco'}</span><select data-iv-pick="${i}">${[['', '—'], ...ivPickOpts(st, i)].map(([k, t]) => `<option value="${esc(k)}" ${e.pick === k ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`
              : '';
          return `<div class="it"><div class="it-head"><span class="it-name">${esc(d ? d.n : ivLabel(e))}</span><button class="b sm" data-act="iv-del" data-i="${i}" aria-label="Quitar ${esc(d ? d.n : ivLabel(e))}">Quitar</button></div>
          ${sel}${d ? `<details><summary>Qué hace</summary><p>${esc(d.de)}</p></details>` : '<div class="meta">Escrita a mano</div>'}</div>`;
        })
        .join('')}</div>`
    : '<p class="empty">Ninguna invocación todavía.</p>';
  const cat = INVOCS.map(d => ({ d, why: ivWhyNot(st, d, -1) }))
    .sort((a, b) => !!a.why - !!b.why || a.d.lv - b.d.lv || a.d.n.localeCompare(b.d.n, 'es'))
    .map(({ d, why }) => {
      const meta = [
        d.lv > 1 ? `Nivel ${d.lv}+` : 'Desde nivel 1',
        d.req && `requiere ${IVBY[d.req].n}`,
        d.rep && 'repetible',
        d.sp && (d.use ? 'conjuro gratis 1 vez por descanso largo' : 'conjuro gratis sin límite'),
      ]
        .filter(Boolean)
        .join(' · ');
      return `<div class="it" ${why ? 'style="opacity:.6"' : ''}><div class="it-head"><span class="it-name">${esc(d.n)}</span><button class="b sm ${why || full ? '' : 'pri'}" data-act="iv-add" data-id="${d.id}" ${why || full ? 'disabled' : ''}>Elegir</button></div>
        <div class="meta">${esc(meta)}</div>${why ? `<div class="meta">${esc(why)}</div>` : ''}
        <details><summary>Qué hace</summary><p>${esc(d.de)}</p></details></div>`;
    })
    .join('');
  return `<p><span class="badge" style="${n > max ? 'color:var(--bad)' : ''}">Invocaciones ${n}/${max}</span></p>
    <p class="hint">Las invocaciones son poderes del brujo. Unas funcionan siempre y otras te dejan lanzar un conjuro sin gastar espacio (lo verás en tus conjuros con la etiqueta «${IV_SRC}»). ${st.mode === 'level' ? 'Al subir de nivel puedes cambiar una de las que ya tenías por otra.' : st.mode === 'edit' ? 'Normalmente solo puedes cambiar una al subir de nivel; aquí puedes corregir tu lista.' : ''}</p>
    ${st.mode === 'level' && swapped > 1 ? '<p class="hint warn">Has quitado más de una invocación que ya tenías. Las reglas solo permiten cambiar una al subir de nivel (salvo que tu máster diga otra cosa).</p>' : ''}
    ${probs.map(p => `<p class="hint warn">${esc(p)}</p>`).join('')}
    ${n < max ? `<p class="hint">Te ${max - n === 1 ? 'queda 1 por elegir' : `quedan ${max - n} por elegir`}.</p>` : ''}
    <h3>Tus invocaciones</h3>${mine}<h3>Catálogo</h3>${full && max ? '<p class="hint">Ya tienes todas las que puedes. Para elegir otra, quita antes una de las tuyas.</p>' : ''}<div class="list">${cat}</div>`;
}
/* Estado actual: el del asistente o el de la ventana propia */
const ivState = () => (W && W.iv) || IVS;
function ivRefresh() {
  if (W && W.iv) {
    W._keepScroll = true;
    renderWizard();
    return;
  }
  const b = $('#iv-body');
  if (!b) return;
  const sc = b.scrollTop;
  b.innerHTML = ivHTML(IVS);
  enhanceSelects(b);
  b.scrollTop = sc;
  const ok = $('[data-act="iv-save"]');
  if (ok) ok.disabled = !!ivProblems(IVS).length;
}
function openInvocations() {
  const c = C(),
    list = ivFromChar(c);
  IVS = { mode: 'edit', L: c.level, spells: c.spells, list, orig: [...list] };
  openModal(
    `<div class="wz-head"><h2>Invocaciones</h2><div class="btns"><button class="b sm" data-act="close-modal">Cancelar</button><button class="b sm pri" data-act="iv-save">Guardar</button></div></div><div class="wz-body" id="iv-body">${ivHTML(IVS)}</div>`,
    true
  );
  const ok = $('[data-act="iv-save"]');
  if (ok) ok.disabled = !!ivProblems(IVS).length;
}
/* Aplica la lista elegida a la ficha: rasgos, conjuros gratis y dotes de Lecciones de los Primeros */
function ivApply(c, st) {
  const dropSpells = fname => (c.spells = c.spells.filter(s => !(s.src === IV_SRC && s.free === fname)));
  const featOf = e => !e.custom && IVBY[e.id].pick === 'feat' && FEATS[e.pick] && e.pick;
  const dropFeat = k => {
    if (!k || st.list.some(e => featOf(e) === k)) return;
    c.featKeys = (c.featKeys || []).filter(x => x !== k);
    const res = (FEATS[k].res || []).map(r => r.n);
    c.features = c.features.filter(
      f =>
        !(f.name === FEATS[k].n && f.source === IV_FEAT_SRC) && !(res.includes(f.name) && f.source === 'Dote')
    );
    if (FEATS[k].hpPerLevel) {
      c.hp.max -= FEATS[k].hpPerLevel * c.level;
      c.hp.current = Math.min(c.hp.current, c.hp.max);
    }
  };
  // quitadas
  for (const o of st.orig)
    if (!st.list.includes(o)) {
      c.features = c.features.filter(f => f.name !== o.from);
      dropSpells(o.from);
      dropFeat(o.featFrom);
    }
  // conservadas y nuevas
  for (const e of st.list) {
    if (e.custom) continue;
    const d = IVBY[e.id],
      name = ivName(e);
    let f = e.from && c.features.find(x => x.name === e.from);
    if (f) {
      if (f.name !== name) {
        c.spells.forEach(s => {
          if (s.src === IV_SRC && s.free === f.name) s.free = name;
        });
        f.name = name;
      }
      if (!f.text) f.text = d.de;
    } else {
      f = { name, source: 'Invocación sobrenatural', text: d.de, uses: { max: 0, used: 0, recover: '' } };
      c.features.push(f);
    }
    if (d.use && !f.uses.max) f.uses = { max: d.use, used: 0, recover: 'largo' };
    if (d.sp && SPBY[d.sp]) {
      const s = c.spells.find(x => x.ref === d.sp && (!x.src || (x.src === IV_SRC && x.free === name)));
      if (s) Object.assign(s, { src: IV_SRC, free: name, atwill: !d.use });
      else if (!c.spells.some(x => x.ref === d.sp && x.src === IV_SRC))
        c.spells.push(Object.assign(spellObj(SPBY[d.sp]), { src: IV_SRC, free: name, atwill: !d.use }));
    }
    const k = featOf(e);
    if (k && !(c.featKeys || []).includes(k)) {
      c.featKeys = [...(c.featKeys || []), k];
      if (!c.features.some(x => x.name === FEATS[k].n))
        c.features.push({
          name: FEATS[k].n,
          source: IV_FEAT_SRC,
          text: FEATS[k].text,
          uses: { max: 0, used: 0, recover: '' },
        });
      if (FEATS[k].hpPerLevel) {
        c.hp.max += FEATS[k].hpPerLevel * c.level;
        c.hp.current += FEATS[k].hpPerLevel * c.level;
      }
    }
  }
  // dotes cambiadas dentro de una invocación conservada
  for (const o of st.orig) if (st.list.includes(o) && o.featFrom !== featOf(o)) dropFeat(o.featFrom);
  upsertRes(c, originRes(c.speciesKey, c.lineageKey, c.featKeys || [], c.level), 'Dote');
  c.spells.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'es'));
}
