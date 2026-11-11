(function () {
  var KEY = 'ab_theme', root = document.documentElement;
  var ICON = '<span class="ab-tt-track"><svg class="ab-tt-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg><svg class="ab-tt-moon" viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg></span>';

  function read() {
    var v = null;
    try { v = localStorage.getItem(KEY); } catch (e) {}
    if (v !== 'light' && v !== 'dark') {
      var m = document.cookie.match(/(?:^|; )ab_theme=(light|dark)/);
      v = m ? m[1] : null;
    }
    return v === 'light' ? 'light' : 'dark';
  }
  function save(t) {
    try { localStorage.setItem(KEY, t); } catch (e) {}
    try { document.cookie = KEY + '=' + t + ';path=/;max-age=31536000;SameSite=Lax'; } catch (e) {}
  }
  function apply(t) {
    root.setAttribute('data-theme', t);
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', t === 'light' ? '#f1f4f9' : '#000000');
    var label = t === 'light' ? 'Switch to dark mode' : 'Switch to light mode';
    var b = document.querySelectorAll('.ab-theme-toggle');
    for (var i = 0; i < b.length; i++) b[i].setAttribute('aria-label', label);
  }
  function ensureButton() {
    var box = document.querySelector('.topbar .top-actions');
    if (!box || box.querySelector('.ab-theme-toggle')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'icon-btn ab-theme-toggle';
    btn.title = 'Light / Dark';
    btn.innerHTML = ICON;
    box.insertBefore(btn, box.firstChild);
    apply(root.getAttribute('data-theme') || 'dark');
  }

  apply(read());                                   // before first paint (script is in <head>)

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.ab-theme-toggle');
    if (!b) return;
    b.classList.remove('ab-spin'); void b.offsetWidth; b.classList.add('ab-spin');
    var t = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    apply(t); save(t);
  });

  function boot() {
    ensureButton();
    var bar = document.querySelector('.topbar');
    if (bar) new MutationObserver(ensureButton).observe(bar, { childList: true, subtree: true });
    var main = document.getElementById('pageContent');
    if (main) new MutationObserver(function () {
      apply(root.getAttribute('data-theme') || 'dark');
    }).observe(main, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.addEventListener('pageshow', function () { apply(read()); });   // back/forward + reload cache
  window.addEventListener('storage', function (e) { if (e.key === KEY) apply(read()); });
})();
