/* Pintado principal: tema por clase, vista activa y pantalla de bienvenida. */
'use strict';

function renderView() {
  const c = C();
  $('#view').innerHTML =
    S.tab === 'edit'
      ? viewEdit(c)
      : S.tab === 'data'
        ? viewData(c)
        : S.tab === 'pj'
          ? viewPj(c)
          : S.tab === 'crea'
            ? viewCrea(c)
            : S.tab === 'combat'
              ? viewCombat(c)
              : viewPlay(c);
}
function applyTheme() {
  const k = (C() || {}).classKey || '',
    r = document.documentElement;
  if (k) r.dataset.class = k;
  else delete r.dataset.class;
  const bg = getComputedStyle(r).getPropertyValue('--surface').trim();
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach(m => m.setAttribute('content', bg || '#ffffff'));
}
function render() {
  applyTheme();
  if (!C()) {
    renderWelcome();
    return;
  }
  renderTop();
  renderView();
  refreshVida();
  tourMaybe();
}
function renderWelcome() {
  $('#top').innerHTML = '';
  if (S.tab === 'data') {
    $('#view').innerHTML = viewData(null);
    return;
  }
  $('#view').innerHTML = `<section class="card welcome"><h1>Fichas 5e</h1>
    <p>Tu ficha de personaje interactiva para partidas de 5.ª edición (reglas de 2024). Lleva la cuenta de vida, conjuros, recursos, dinero y objetos mientras juegas con tus dados de siempre.</p>
    <p class="hint">Las fichas se guardan solo en este dispositivo.</p>
    <div class="btns"><button class="b pri" data-act="create">Crear personaje</button><button class="b" data-act="tab" data-t="data">Importar ficha</button></div>
    <p class="hint">¿Tienes una copia de seguridad o una ficha exportada desde otro dispositivo? Usa «Importar ficha».</p></section>`;
}
