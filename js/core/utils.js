/* Utilidades genéricas: selección del DOM, tema claro/oscuro, escapado de HTML, números y descargas. */
'use strict';

const $ = s => document.querySelector(s);
function getTheme() {
  try {
    return localStorage.getItem('fichas-theme') || '';
  } catch (e) {
    return '';
  }
}
function setTheme(t) {
  const r = document.documentElement;
  if (t) r.dataset.theme = t;
  else delete r.dataset.theme;
  try {
    t ? localStorage.setItem('fichas-theme', t) : localStorage.removeItem('fichas-theme');
  } catch (e) {}
}
setTheme(getTheme());
const esc = s =>
  String(s ?? '').replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
const uid = () => Math.random().toString(36).slice(2, 10);
const mod = s => Math.floor(((+s || 0) - 10) / 2);
const sgn = n => (n >= 0 ? '+' : '−') + Math.abs(n);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const norm = s =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

function download(name, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 1500);
  toast(
    `<div class="t-label">Descargado</div><div class="t-parts">${esc(name)} está en tu carpeta de descargas.</div>`
  );
}
function copy(text, btn) {
  const old = btn.textContent;
  const ok = () => {
    btn.textContent = 'Copiado';
    setTimeout(() => (btn.textContent = old), 1600);
  };
  const fail = () => {
    const t = $('#exp-text') || $('#imp-text');
    if (t) {
      t.value = text;
      t.focus();
      t.select();
    }
    btn.textContent = 'Selecciónalo y cópialo';
    setTimeout(() => (btn.textContent = old), 2500);
  };
  try {
    navigator.clipboard.writeText(text).then(ok, fail);
  } catch (e) {
    fail();
  }
}
