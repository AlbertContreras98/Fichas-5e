/* Avisos (toasts), ventanas modales y estado compartido de la interfaz. */
'use strict';

function toast(html, keep) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = html + '<button class="x" data-act="close-toast" aria-label="Cerrar">×</button>';
  const box = $('#toasts');
  box.prepend(t);
  while (box.children.length > 3) box.lastChild.remove();
  setTimeout(() => t.remove(), keep ? 30000 : 7000);
}
function openModal(h, big) {
  const m = $('#modal');
  m.innerHTML = `<div class="sheet${big ? ' big' : ''}" role="dialog" aria-modal="true">${h}</div>`;
  m.hidden = false;
  enhanceSelects(m);
  const f = m.querySelector('input:not([type=hidden]),button');
  f && !big && f.focus();
}
/* En ordenador, los desplegables largos nativos se salen de la pantalla: se sustituyen por una lista dentro de la ventana */
function enhanceSelects(root) {
  if (!matchMedia('(pointer:fine)').matches) return;
  root.querySelectorAll('select').forEach(sel => {
    if (sel.options.length <= 10 || sel.dataset.enh) return;
    sel.dataset.enh = '1';
    const wrap = document.createElement('div');
    wrap.className = 'xsel';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'xsel-btn';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    const lbl = () => {
      const o = sel.options[sel.selectedIndex];
      btn.textContent = o ? o.textContent : '';
    };
    lbl();
    const list = document.createElement('div');
    list.className = 'xsel-list';
    list.setAttribute('role', 'listbox');
    list.hidden = true;
    [...sel.children].forEach(ch => {
      const add = o => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'xsel-opt' + (o.selected ? ' on' : '');
        b.setAttribute('role', 'option');
        b.textContent = o.textContent;
        b.dataset.v = o.value;
        list.appendChild(b);
      };
      if (ch.tagName === 'OPTGROUP') {
        const h = document.createElement('div');
        h.className = 'xsel-grp';
        h.textContent = ch.label;
        list.appendChild(h);
        [...ch.children].forEach(add);
      } else add(ch);
    });
    btn.addEventListener('click', e => {
      e.stopPropagation();
      list.hidden = !list.hidden;
      btn.setAttribute('aria-expanded', String(!list.hidden));
      if (!list.hidden) {
        const on = list.querySelector('.on');
        on && on.scrollIntoView({ block: 'nearest' });
      }
    });
    list.addEventListener('click', e => {
      const b = e.target.closest('.xsel-opt');
      if (!b) return;
      e.stopPropagation();
      sel.value = b.dataset.v;
      list.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      lbl();
      list.querySelectorAll('.on').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    });
    sel.hidden = true;
    sel.after(wrap);
    wrap.append(btn, list);
  });
}
function closeModal() {
  const m = $('#modal');
  m.hidden = true;
  m.innerHTML = '';
  W = null;
  P = null;
  pendingEco = null;
  CX = null;
  NI = null;
}
let pendingEco = null,
  restOpen = false;
const INCAP = ['Incapacitado', 'Aturdido', 'Paralizado', 'Petrificado', 'Inconsciente'];
let CX = null,
  lastCastL = 0,
  effBack = false;
