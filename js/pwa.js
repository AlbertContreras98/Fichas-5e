/* Instalación como app (PWA) y service worker: descarga las versiones nuevas y recarga sola. */
'use strict';

let deferredInstall = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstall = e;
  const b = document.getElementById('install-btn');
  if (b) b.hidden = false;
});
window.addEventListener('appinstalled', () => {
  deferredInstall = null;
  const b = document.getElementById('install-btn');
  if (b) b.hidden = true;
});
document.addEventListener('click', async e => {
  if (e.target.id !== 'install-btn' || !deferredInstall) return;
  deferredInstall.prompt();
  await deferredInstall.userChoice;
  deferredInstall = null;
  e.target.hidden = true;
});
if ('serviceWorker' in navigator) {
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloaded) {
      reloaded = true;
      location.reload();
    }
  });
  window.addEventListener('load', () =>
    navigator.serviceWorker
      .register('sw.js', { updateViaCache: 'none' })
      .then(r => {
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') r.update().catch(() => {});
        });
      })
      .catch(() => {})
  );
}
