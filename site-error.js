/* Shows a notice if a page script fails to load or throws. Loaded first and
   dependency-free, so it still works when data.js is what broke. */
(function () {
  let shown = false;

  function show() {
    if (shown) return;
    shown = true;

    const message = document.createElement('p');
    message.textContent = 'Something went wrong loading this page. Try reloading; if it keeps happening, please let us know.';

    const reload = document.createElement('button');
    reload.type = 'button';
    reload.textContent = 'Reload';
    reload.addEventListener('click', () => location.reload());

    const dismiss = document.createElement('button');
    dismiss.type = 'button';
    dismiss.textContent = 'Dismiss';
    dismiss.addEventListener('click', () => box.remove());

    const box = document.createElement('div');
    box.className = 'site-error';
    box.setAttribute('role', 'alert');
    [message, reload, dismiss].forEach(n => box.appendChild(n));
    document.body.insertBefore(box, document.body.firstChild);
  }

  // Capture phase, so failed <script>/<link> loads (which don't bubble) are seen too.
  window.addEventListener('error', e => {
    const t = e.target;
    if (t && t !== window) {
      if ((t.tagName === 'SCRIPT' && t.src) || (t.tagName === 'LINK' && t.rel === 'stylesheet')) show();
      return;
    }
    if (/ResizeObserver/.test(e.message || '')) return;
    // Only our own scripts; browser-extension errors have another origin or none.
    if (e.filename && e.filename.startsWith(location.origin)) show();
  }, true);

  window.addEventListener('load', () => {
    if (typeof SITE_DATA === 'undefined') show();
  });
})();
