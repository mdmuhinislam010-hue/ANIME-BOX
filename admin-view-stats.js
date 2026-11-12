/* AnimeBox ADMIN \u2014 View Statistics (drop-in, v2026-11-12)
   ---------------------------------------------------------------------------
   Shows total views for every movie / anime / series and for every individual
   episode, plus a "Most viewed episodes" ranking. Read-only: it never writes to
   the database, so no existing Admin feature can be affected.

   Install (Admin HTML only, NOT the user website):
     <script src="/supabase-adapter.js"></script>      <!-- already there -->
     <script src="/admin-view-stats.js"></script>       <!-- add this line after it -->
   A floating "Views" button appears at the bottom-right of the Admin Panel.
   To open it from your own Admin menu button instead, call:
     window.AnimeBoxViewStats.open()
   Data read: views/*  content/*  episodes/*  seasons/*  (same shared Supabase document). */
(function () {
  'use strict';
  if (window.AnimeBoxViewStats) return;

  var db = null, panel = null, isOpen = false, tab = 'titles', query = '';
  var expanded = Object.create(null);
  var data = { views: {}, content: [], episodes: {}, seasons: {} };

  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function num(v) { var n = Number(v); return isFinite(n) && n > 0 ? Math.floor(n) : 0; }
  function fmt(n) { return Number(n || 0).toLocaleString(); }
  function first(o, keys, fb) { for (var i = 0; i < keys.length; i++) { var v = o && o[keys[i]]; if (v !== undefined && v !== null && String(v).trim() !== '') return v; } return fb; }

  // Same unwrapping rules the user website uses for Admin-saved lists.
  function toList(raw) {
    var src = raw;
    for (var i = 0; i < 3 && src && !Array.isArray(src) && typeof src === 'object'; i++) {
      var nested = ['items', 'list', 'records', 'content', 'data'].filter(function (k) { return src[k] && typeof src[k] === 'object'; })[0];
      if (!nested) break; src = src[nested];
    }
    if (Array.isArray(src)) return src.filter(function (v) { return v && typeof v === 'object'; });
    if (src && typeof src === 'object') return Object.keys(src).filter(function (k) { return src[k] && typeof src[k] === 'object'; })
      .map(function (k) { var v = src[k]; var o = {}; for (var p in v) o[p] = v[p]; o.id = v.id != null ? v.id : (v.key != null ? v.key : k); return o; });
    return [];
  }

  function build() {
    var contentById = Object.create(null);
    data.content.forEach(function (c) { contentById[String(c.id)] = c; });
    var ids = Object.keys(data.views);
    Object.keys(contentById).forEach(function (id) { if (ids.indexOf(id) < 0) ids.push(id); });

    var rows = ids.map(function (id) {
      var v = data.views[id] || {}, c = contentById[id];
      var epViews = v.episodes && typeof v.episodes === 'object' ? v.episodes : {};
      var epRecords = Object.create(null);
      toList(data.episodes[id]).forEach(function (e) { epRecords[String(e.id)] = e; });
      var seasonRecords = Object.create(null);
      toList(data.seasons[id]).forEach(function (s) { seasonRecords[String(s.id)] = s; });

      var title = c ? String(first(c, ['title', 'name', 'animeName', 'movieName', 'contentTitle'], 'Untitled')) : 'Deleted title (' + id + ')';
      var type = c ? String(first(c, ['typeName', 'type', 'contentType', 'mediaType', 'kind', 'category'], '')) : '';
      var sumEp = 0;
      var eps = Object.keys(epViews).map(function (eid) {
        var n = num(epViews[eid]); sumEp += n;
        var rec = epRecords[eid], label, season = '';
        if (eid === 'main') label = 'Movie / main player';
        else if (rec) {
          var no = first(rec, ['episodeNumber', 'number', 'episode', 'ep'], '');
          label = String(first(rec, ['title', 'name', 'episodeName'], no !== '' ? 'Episode ' + no : 'Episode'));
          var sid = String(first(rec, ['seasonId', 'parentSeasonId', 'groupId'], ''));
          var sr = sid && seasonRecords[sid];
          if (sr) season = String(first(sr, ['name', 'title', 'seasonName'], 'Season ' + first(sr, ['number', 'seasonNumber'], '')));
          else { var sn = first(rec, ['season', 'seasonNumber', 'groupNumber'], ''); if (sn !== '') season = 'Season ' + sn; }
        } else label = 'Removed episode (' + eid + ')';
        return { id: eid, label: label, season: season, views: n, contentId: id, title: title };
      }).filter(function (e) { return e.views > 0; }).sort(function (a, b) { return b.views - a.views || a.label.localeCompare(b.label, undefined, { numeric: true }); });

      var total = num(v.total) || sumEp;
      return { id: id, title: title, type: type, total: total, episodes: eps, lastViewAt: num(v.lastViewAt) };
    });
    rows.sort(function (a, b) { return b.total - a.total || a.title.localeCompare(b.title); });
    return rows;
  }

  function css() {
    if (document.getElementById('abvs-style')) return;
    var st = document.createElement('style'); st.id = 'abvs-style';
    st.textContent = [
      '.abvs-fab{position:fixed;right:16px;bottom:16px;z-index:2147483000;display:flex;align-items:center;gap:7px;padding:10px 14px;border:0;border-radius:999px;cursor:pointer;font:700 13px/1 system-ui,Segoe UI,Roboto,sans-serif;color:#111;background:#f2d400;box-shadow:0 6px 20px rgba(0,0,0,.35)}',
      '.abvs-fab svg,.abvs-eye{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}',
      '.abvs-overlay{position:fixed;inset:0;z-index:2147483001;display:none;align-items:center;justify-content:center;padding:12px;background:rgba(0,0,0,.62)}',
      '.abvs-overlay.show{display:flex}',
      '.abvs{--bg:#14171d;--card:#1c2029;--line:#2b303b;--text:#eef1f6;--muted:#97a0b0;--accent:#f2d400;--bar:#2f6df6;width:min(880px,100%);max-height:92vh;display:flex;flex-direction:column;border-radius:12px;background:var(--bg);color:var(--text);border:1px solid var(--line);box-shadow:0 20px 60px rgba(0,0,0,.5);font:14px/1.4 system-ui,Segoe UI,Roboto,sans-serif}',
      '@media(prefers-color-scheme:light){.abvs{--bg:#fff;--card:#f3f6fb;--line:#d8dee8;--text:#162033;--muted:#5b6779;--accent:#a16207;--bar:#0a58ca}}',
      'html[data-theme="light"] .abvs,body.light .abvs{--bg:#fff;--card:#f3f6fb;--line:#d8dee8;--text:#162033;--muted:#5b6779;--accent:#a16207;--bar:#0a58ca}',
      'html[data-theme="dark"] .abvs,body.dark .abvs{--bg:#14171d;--card:#1c2029;--line:#2b303b;--text:#eef1f6;--muted:#97a0b0;--accent:#f2d400;--bar:#2f6df6}',
      '.abvs-head{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--line)}',
      '.abvs-head h2{margin:0;font-size:17px;flex:1;display:flex;align-items:center;gap:8px}',
      '.abvs-total{font-size:12px;color:var(--muted);font-weight:600}',
      '.abvs-total b{color:var(--accent);font-size:15px}',
      '.abvs-x{border:0;background:transparent;color:var(--muted);font-size:22px;line-height:1;cursor:pointer;padding:2px 6px}',
      '.abvs-tools{display:flex;flex-wrap:wrap;gap:8px;padding:10px 16px;border-bottom:1px solid var(--line)}',
      '.abvs-tab{border:1px solid var(--line);background:var(--card);color:var(--text);padding:7px 12px;border-radius:8px;font:600 13px system-ui,sans-serif;cursor:pointer}',
      '.abvs-tab.on{background:var(--accent);border-color:var(--accent);color:#111}',
      '.abvs-search{flex:1;min-width:140px;border:1px solid var(--line);background:var(--card);color:var(--text);padding:7px 10px;border-radius:8px;font:13px system-ui,sans-serif}',
      '.abvs-body{overflow:auto;padding:10px 16px 16px;-webkit-overflow-scrolling:touch}',
      '.abvs-row{border:1px solid var(--line);background:var(--card);border-radius:10px;margin-top:8px;overflow:hidden}',
      '.abvs-main{display:grid;grid-template-columns:28px minmax(0,1fr) auto;align-items:center;gap:10px;width:100%;padding:10px 12px;border:0;background:transparent;color:inherit;text-align:left;cursor:pointer;font:inherit}',
      '.abvs-rank{color:var(--muted);font-weight:700;font-size:12px;text-align:center}',
      '.abvs-name{font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.abvs-sub{font-size:12px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.abvs-count{display:flex;align-items:center;gap:5px;font-weight:800;color:var(--accent);white-space:nowrap}',
      '.abvs-bar{height:4px;background:var(--line)}.abvs-bar i{display:block;height:100%;background:var(--bar)}',
      '.abvs-eps{border-top:1px solid var(--line);padding:4px 12px 8px}',
      '.abvs-ep{display:grid;grid-template-columns:28px minmax(0,1fr) auto;gap:10px;align-items:center;padding:6px 0;border-bottom:1px dashed var(--line)}',
      '.abvs-ep:last-child{border-bottom:0}',
      '.abvs-ep .abvs-count{font-size:13px}',
      '.abvs-empty{padding:28px 8px;text-align:center;color:var(--muted)}',
      '.abvs-note{margin:10px 0 0;font-size:11px;color:var(--muted)}'
    ].join('\n');
    document.head.appendChild(st);
  }

  var EYE = '<svg class="abvs-eye" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';

  function render() {
    if (!panel || !isOpen) return;
    var rows = build(), grand = rows.reduce(function (a, r) { return a + r.total; }, 0);
    var q = query.trim().toLowerCase(), html = '';
    panel.querySelector('.abvs-total').innerHTML = 'All views: <b>' + fmt(grand) + '</b>';
    panel.querySelectorAll('.abvs-tab').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === tab); });

    if (tab === 'titles') {
      var list = rows.filter(function (r) { return !q || r.title.toLowerCase().indexOf(q) >= 0 || r.type.toLowerCase().indexOf(q) >= 0; });
      var max = list.reduce(function (m, r) { return Math.max(m, r.total); }, 0) || 1;
      html = list.map(function (r, i) {
        var open = !!expanded[r.id];
        var eps = open ? '<div class="abvs-eps">' + (r.episodes.length ? r.episodes.map(function (e, j) {
          return '<div class="abvs-ep"><span class="abvs-rank">' + (j + 1) + '</span><div><div class="abvs-name">' + esc(e.label) + '</div>' + (e.season ? '<div class="abvs-sub">' + esc(e.season) + '</div>' : '') + '</div><span class="abvs-count">' + EYE + fmt(e.views) + '</span></div>';
        }).join('') : '<div class="abvs-empty">No episode views yet.</div>') + '</div>' : '';
        return '<div class="abvs-row"><button type="button" class="abvs-main" data-toggle="' + esc(r.id) + '" aria-expanded="' + open + '"><span class="abvs-rank">' + (i + 1) + '</span><div style="min-width:0"><div class="abvs-name">' + esc(r.title) + '</div><div class="abvs-sub">' + esc(r.type || 'Content') + ' \u00b7 ' + r.episodes.length + ' episode' + (r.episodes.length === 1 ? '' : 's') + ' viewed' + (r.lastViewAt ? ' \u00b7 last view ' + esc(new Date(r.lastViewAt).toLocaleString()) : '') + '</div></div><span class="abvs-count">' + EYE + fmt(r.total) + '</span></button><div class="abvs-bar"><i style="width:' + Math.round(r.total / max * 100) + '%"></i></div>' + eps + '</div>';
      }).join('');
    } else {
      var all = [];
      rows.forEach(function (r) { r.episodes.forEach(function (e) { all.push(e); }); });
      all = all.filter(function (e) { return !q || e.label.toLowerCase().indexOf(q) >= 0 || e.title.toLowerCase().indexOf(q) >= 0; })
        .sort(function (a, b) { return b.views - a.views; }).slice(0, 100);
      var mx = all.length ? all[0].views : 1;
      html = all.map(function (e, i) {
        return '<div class="abvs-row"><div class="abvs-main" style="cursor:default"><span class="abvs-rank">' + (i + 1) + '</span><div style="min-width:0"><div class="abvs-name">' + esc(e.title) + ' \u2014 ' + esc(e.label) + '</div><div class="abvs-sub">' + (e.season ? esc(e.season) : 'Episode') + '</div></div><span class="abvs-count">' + EYE + fmt(e.views) + '</span></div><div class="abvs-bar"><i style="width:' + Math.round(e.views / mx * 100) + '%"></i></div></div>';
      }).join('');
    }
    panel.querySelector('.abvs-body-list').innerHTML = html || '<div class="abvs-empty">No views recorded yet. A view is counted after an episode has played for 60 seconds.</div>';
  }

  function ensurePanel() {
    if (panel) return;
    css();
    var ov = document.createElement('div');
    ov.className = 'abvs-overlay'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'View statistics');
    ov.innerHTML = '<section class="abvs"><header class="abvs-head"><h2>' + EYE + ' View Statistics</h2><span class="abvs-total"></span><button type="button" class="abvs-x" aria-label="Close">\u00d7</button></header>' +
      '<div class="abvs-tools"><button type="button" class="abvs-tab on" data-tab="titles">By title</button><button type="button" class="abvs-tab" data-tab="top">Most viewed episodes</button><input class="abvs-search" type="search" placeholder="Search title or episode\u2026" aria-label="Search"></div>' +
      '<div class="abvs-body"><div class="abvs-body-list"></div><p class="abvs-note">A view is counted once per viewer and episode after 60 seconds of active playback. Opening pages, seasons or the episode list is never counted.</p></div></section>';
    document.body.appendChild(ov);
    panel = ov;
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('.abvs-x')) { close(); return; }
      var t = e.target.closest('.abvs-tab'); if (t) { tab = t.dataset.tab; render(); return; }
      var tg = e.target.closest('[data-toggle]'); if (tg) { var id = tg.getAttribute('data-toggle'); expanded[id] = !expanded[id]; render(); }
    });
    ov.querySelector('.abvs-search').addEventListener('input', function (e) { query = e.target.value; render(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen) close(); });
  }

  function open() { ensurePanel(); isOpen = true; panel.classList.add('show'); render(); }
  function close() { isOpen = false; if (panel) panel.classList.remove('show'); }

  function listen(path, key, mapFn) {
    try { db.ref(path).on('value', function (snap) { data[key] = mapFn(snap.val()); render(); }, function (err) { console.warn('View stats: could not read ' + path, err); }); }
    catch (e) { console.warn('View stats: listener failed for ' + path, e); }
  }

  function init() {
    db = window.db;
    if (!db || !db.ref) return false;
    listen('views', 'views', function (v) { return v && typeof v === 'object' ? v : {}; });
    listen('content', 'content', toList);
    listen('episodes', 'episodes', function (v) { return v && typeof v === 'object' ? v : {}; });
    listen('seasons', 'seasons', function (v) { return v && typeof v === 'object' ? v : {}; });
    return true;
  }

  function addButton() {
    if (document.querySelector('.abvs-fab')) return;
    css();
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'abvs-fab'; b.title = 'View statistics';
    b.innerHTML = EYE + '<span>Views</span>';
    b.addEventListener('click', open);
    document.body.appendChild(b);
  }

  window.AnimeBoxViewStats = { open: open, close: close };

  function boot() {
    addButton();
    var tries = 0;
    (function wait() { if (init()) return; if (++tries < 50) setTimeout(wait, 200); else console.warn('View stats: window.db was not found. Load supabase-adapter.js before admin-view-stats.js.'); })();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
