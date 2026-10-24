/* ============================================================
   ANIMEBOX APP.JS — Clean URL Routing (No Hash), Fixed Series & See All
   ============================================================ */

let heroSlides = [];
let heroIndex = 0;
let heroTimer = null;
let lastInitialHeroId = '';
let heroContentMap = {};
let latestContentItems = [];
let adminTypes = [];
let customTypeConfig = [];
let allPageConfig = null;
let activeSearchCategory = 'All';
let activeSearchQuery = '';
let cachedHomeMarkup = '';
let contentFirstPaintDone = false;
let lastRandomizedSource = null;

const builtinTypeConfig = [
  {name:'Movie',    rail:'homeTypeMovie',    empty:'homeTypeMovieEmpty',  page:0},
  {name:'Trending', rail:'homeTypeTrending', empty:'homeTypeTrendingEmpty',page:0},
  {name:'Anime',    rail:'homeTypeAnime',    empty:'homeTypeAnimeEmpty',   page:0},
  {name:'Series',   rail:'homeTypeSeries',   empty:'homeTypeSeriesEmpty',  page:0},
  {name:'TV Show',  rail:'homeTypeTVShow',   empty:'homeTypeTVShowEmpty', page:0}
];

/* ---------- SMALL POPUP WINDOW FOR OPENED PAGES ---------- */
(function initSmallPagePopup(){
  if (window.__animeBoxPopupReady) return;
  window.__animeBoxPopupReady = true;
  let popup, popupFrame;
  function ensurePopup(){
    if (popup) return;
    popup = document.createElement('div');
    popup.className = 'ab-page-popup-backdrop';
    popup.innerHTML = '<section class="ab-page-popup" role="dialog" aria-modal="true" aria-label="Popup page"><header class="ab-page-popup-head"><span>Opened page</span><button type="button" class="ab-page-popup-close" aria-label="Close popup">✕</button></header><iframe class="ab-page-popup-frame" title="Popup page" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; fullscreen; picture-in-picture"></iframe></section>';
    document.body.appendChild(popup);
    popupFrame = popup.querySelector('iframe');
    const close = () => { popup.classList.remove('show'); popupFrame.src='about:blank'; };
    popup.querySelector('.ab-page-popup-close').addEventListener('click', close);
    popup.addEventListener('click', e => { if (e.target === popup) close(); });
    document.addEventListener('keydown', e => { if(e.key==='Escape' && popup.classList.contains('show')) close(); });
  }
  window.__animeBoxShowPopup = function(url, name){
    try {
      const u = new URL(String(url || ''), location.href);
      if (!/^https?:$/.test(u.protocol)) return null;
      ensurePopup();
      popup.querySelector('.ab-page-popup-head span').textContent = name || 'Opened page';
      popup.classList.add('show');
      popupFrame.src = u.href;
      return {closed:false, close:()=>{popup.classList.remove('show');popupFrame.src='about:blank';}, focus:()=>{popup.classList.add('show');}};
    } catch(_) { return null; }
  };
  const nativeOpen = window.open.bind(window);
  window.open = function(url, target, features){
    const popupWindow = window.__animeBoxShowPopup(url, 'Opened page');
    return popupWindow || nativeOpen(url, target, features);
  };
  document.addEventListener('click', function(e){
    const a = e.target && e.target.closest ? e.target.closest('a[target="_blank"]') : null;
    if (!a || a.hasAttribute('download') || a.closest('.user-download-hub')) return;
    const href = a.href;
    if (!href || !/^https?:/i.test(href)) return;
    e.preventDefault();
    window.__animeBoxShowPopup(href, a.textContent.trim() || 'Opened page');
  }, true);
})();


/* ---------- SPLASH ---------- */
(function initLoadingScreen(){
  const screen = document.getElementById('loadingScreen');
  if (!screen) return;
  let hidden = false;
  const hide = () => {
    if (hidden) return; hidden = true;
    screen.classList.add('hide');
    setTimeout(() => { screen.style.display = 'none'; }, 600);
  };
  window.__hideSplashNow = hide;
  window.setTimeout(hide, 4000);
})();

/* ---------- UTILS ---------- */
function safeText(v){ return String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
function firstValue(obj, keys, fallback=''){
  for (const k of keys){ const v = obj && obj[k]; if (v !== undefined && v !== null && String(v).trim() !== '') return v; }
  return fallback;
}
function asUrl(v){ if (!v) return ''; if (typeof v==='string') return v; return firstValue(v, ['url','src','imageUrl','image','original','large']); }
function typeKey(v){ return String(v ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g,''); }
function slugify(str){ return String(str ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') || 'item'; }
function normalizeSlideList(data){
  if (Array.isArray(data)) return data.filter(Boolean);
  return data && typeof data==='object'
    ? Object.entries(data).map(([id,v]) => ({...((v&&typeof v==='object')?v:{}), id}))
    : [];
}
function cardImage(item){ return asUrl(firstValue(item,['poster','posterUrl','image','imageUrl','thumbnail','thumbnailUrl','cover','coverUrl','photo','banner','backdrop'],'')); }
function cardTitle(item){ return firstValue(item,['title','name','animeName','movieName','contentTitle'],'Untitled'); }
function cardTarget(item){ return firstValue(item,['detailUrl','route','contentUrl','url','link','id','key'],''); }
function contentUrl(item){
  const id = String(item?.id ?? item?.key ?? item?.contentId ?? '');
  if (!id) return '/home';
  return `/details/${slugify(cardTitle(item))}/${encodeURIComponent(id)}`;
}

/* ============================================================
   HERO SLIDER
   ============================================================ */
function slideIdentity(s,i){ return String((s && (s.id ?? s.key ?? s.link ?? s.title ?? s.name)) ?? i); }
function chooseRandomInitialSlide(){
  if (!heroSlides.length){ heroIndex = 0; return; }
  if (heroSlides.length === 1){ heroIndex = 0; return; }
  let previous = '';
  try { previous = localStorage.getItem('animebox_last_initial_hero') || ''; } catch(_){}
  const all = heroSlides.map((s,i) => ({ i, id: slideIdentity(s,i) }));
  let pool = all.filter(x => x.id !== previous);
  if (!pool.length) pool = all;
  const pick = pool[Math.floor(Math.random()*pool.length)];
  heroIndex = pick.i;
  lastInitialHeroId = pick.id;
  try { localStorage.setItem('animebox_last_initial_hero', pick.id); } catch(_){}
}
function renderHero(){
  const heroSlider = document.getElementById('heroSlider');
  if (!heroSlider) return;
  if (!heroSlides.length){
    heroSlider.innerHTML = '<div class="hero-empty">No hero slides published yet.</div>';
    return;
  }
  const s = heroSlides[heroIndex] || {};
  const linkedCard = (s.link && heroContentMap) ? (heroContentMap[String(s.link)] || null) : null;
  const value = (keys, fb='') => {
    for (const k of keys){
      const v = s[k] ?? (linkedCard ? linkedCard[k] : undefined);
      if (v !== undefined && v !== null && String(v).trim() !== '') return v;
    }
    return fb;
  };
  const title       = value(['title','name','contentTitle'], 'Featured');
  const poster      = value(['linkedPoster','poster','image','thumbnail'], '') || (linkedCard ? cardImage(linkedCard) : '');
  const background  = value(['image','backdrop','backdropUrl','backgroundImage','bannerImage'], poster);
  const type        = value(['category','type','contentType','label'], 'Movie');
  const year        = value(['year','releaseYear'], '');
  const rating      = value(['rating','imdbRating','score'], '');
  const language    = value(['language','lang','audioLanguage'], '');
  const genre       = value(['genre','genres','tags'], '');
  const description = value(['subtitle','description','overview'], '');
  const quality     = value(['quality','resolution','videoQuality'], '');
  const status      = value(['status','badge','labelBadge'], '');
  const target      = value(['link','detailUrl','route','contentUrl'], '');
  const chips = [language, genre, quality, status].filter(Boolean);
  const bgSafe = String(background || '').replace(/'/g,'%27').replace(/\)/g,'%29');
  const fallbackBg = poster ? `url('${safeText(String(poster).replace(/'/g,'%27'))}')` : 'none';

  heroSlider.innerHTML = `
    <div class="hero-slide-bg" style="background-image:${background ? `url('${safeText(bgSafe)}')` : fallbackBg}"></div>
    <div class="hero-slide">
      ${poster ? `<img class="hero-poster" src="${safeText(poster)}" alt="${safeText(title)} poster" loading="eager" onerror="this.style.display='none'">` : ''}
      <div class="hero-info">
        <div class="hero-tags">
          <span class="hero-tag type">${safeText(type).toUpperCase()}</span>
          ${year ? `<span class="hero-tag">${safeText(year)}</span>` : ''}
          ${rating ? `<span class="hero-tag">★ ${safeText(rating)}</span>` : ''}
        </div>
        <h2 class="hero-title">${safeText(title)}</h2>
        ${chips.length ? `<div class="hero-meta">${chips.map(x=>`<span>${safeText(Array.isArray(x)?x.join(', '):x)}</span>`).join('')}</div>` : ''}
        ${description ? `<p class="hero-description">${safeText(description)}</p>` : ''}
        <button class="hero-watch" type="button" id="heroWatch">▶ &nbsp; Watch Now</button>
      </div>
    </div>
    ${heroSlides.length > 1 ? `
      <button class="hero-arrow prev" id="heroPrev" aria-label="Previous slide">‹</button>
      <button class="hero-arrow next" id="heroNext" aria-label="Next slide">›</button>
      <div class="hero-dots">${heroSlides.map((_,i)=>`<button class="hero-dot ${i===heroIndex?'active':''}" data-dot="${i}" aria-label="Slide ${i+1}"></button>`).join('')}</div>
    ` : ''}
  `;
  document.getElementById('heroWatch')?.addEventListener('click', () => {
    if (!target) return;
    if (/^https?:\/\//i.test(String(target))){ location.href = target; return; }
    if (linkedCard){ navigateTo(contentUrl(linkedCard)); return; }
    const maybe = heroContentMap[String(target)];
    if (maybe) navigateTo(contentUrl(maybe));
  });
  document.getElementById('heroPrev')?.addEventListener('click', () => { moveHero(-1); restartHeroTimer(); });
  document.getElementById('heroNext')?.addEventListener('click', () => { moveHero(1);  restartHeroTimer(); });
  heroSlider.querySelectorAll('[data-dot]').forEach(b => b.addEventListener('click', () => {
    heroIndex = Number(b.dataset.dot); renderHero(); restartHeroTimer();
  }));
}
function moveHero(step){
  if (!heroSlides.length) return;
  heroIndex = (heroIndex + step + heroSlides.length) % heroSlides.length;
  renderHero();
}
function restartHeroTimer(){
  clearInterval(heroTimer); heroTimer = null;
  if (heroSlides.length > 1) heroTimer = setInterval(() => moveHero(1), 6000);
}

/* ============================================================
   HOME TYPE CARDS
   ============================================================ */
function ensureTypeControls(section, cfg){
  let controls = section.querySelector('.home-type-controls');
  if (!controls){
    controls = document.createElement('div');
    controls.className = 'home-type-controls';
    const prev = document.createElement('button');
    prev.type='button'; prev.className='home-type-arrow'; prev.textContent='<';
    const next = document.createElement('button');
    next.type='button'; next.className='home-type-arrow'; next.textContent='>';
    prev.addEventListener('click', () => { cfg.page = Math.max(0, (cfg.page||0)-1); renderHomeTypeCards(latestContentItems); });
    next.addEventListener('click', () => { cfg.page = (cfg.page||0)+1; renderHomeTypeCards(latestContentItems); });
    controls.append(prev, next); section.appendChild(controls);
  }
  let more = section.querySelector('.home-type-more');
  if (!more){
    more = document.createElement('button');
    more.type='button'; more.className='home-type-more'; more.textContent='See All →';
    // FIX: Navigation logic for See All button
    more.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('/' + slugify(cfg.name));
    });
    const heading = section.querySelector('.home-type-heading');
    if (heading && heading.parentNode){
      const row = document.createElement('div');
      row.className='home-type-heading-row';
      heading.parentNode.insertBefore(row, heading);
      row.append(heading, more);
    }
  }
  return controls;
}
function cardsPerPage(){
  if (document.querySelector('.type-list-page')) return window.matchMedia('(max-width: 640px)').matches ? 9 : 32;
  return window.matchMedia('(max-width: 640px)').matches ? 3 : 5;
}
function allHomeTypeConfig(){ return [...builtinTypeConfig, ...customTypeConfig, ...(allPageConfig ? [allPageConfig] : [])]; }
function itemMatchesType(item, cfg){
  const fields = ['type','category','contentType','mediaType','kind','section','typeKey','typeId','typeName'];
  const values = fields.map(k => item && item[k]).filter(v => v!==undefined && v!==null && String(v).trim()!=='').map(String);
  const accepted = new Set([cfg.name, cfg.key, cfg.id].filter(Boolean).map(typeKey));
  for (const raw of values){
    const n = typeKey(raw);
    if (accepted.has(n)) return true;
    const linked = (adminTypes||[]).find(t => [t&&t.id, t&&t.key, t&&t.name].some(v => v && typeKey(v)===n));
    if (linked && [linked.name, linked.key, linked.id].some(v => v && accepted.has(typeKey(v)))) return true;
  }
  return false;
}
function shuffleCards(list){
  const out = list.slice();
  for (let i = out.length-1; i > 0; i--){ const j = Math.floor(Math.random()*(i+1)); [out[i],out[j]]=[out[j],out[i]]; }
  return out;
}
function renderHomeTypeCards(items){
  const incomingItems = Array.isArray(items) ? items : [];
  latestContentItems = incomingItems;
  const sourceChanged = incomingItems !== lastRandomizedSource;
  if (sourceChanged){
    lastRandomizedSource = incomingItems;
    allHomeTypeConfig().forEach(cfg => { cfg.randomizedItems = null; cfg.page = 0; });
  }
  const perPage = cardsPerPage();
  allHomeTypeConfig().forEach(cfg => {
    const rail = document.getElementById(cfg.rail);
    if (!rail) return;
    const matchesNow = latestContentItems.filter(item => {
      if (cfg.name === 'Trending') return itemMatchesType(item,cfg) || item.trending===true || item.isTrending===true || String(item.trending).toLowerCase()==='true';
      return itemMatchesType(item, cfg);
    });
    if (!Array.isArray(cfg.randomizedItems)) cfg.randomizedItems = shuffleCards(matchesNow);
    const matches = cfg.randomizedItems;
    const totalPages = Math.max(1, Math.ceil(matches.length / perPage));
    cfg.page = Math.min(Math.max(0, cfg.page||0), totalPages-1);
    const start = cfg.page * perPage;
    const visible = matches.slice(start, start + perPage);
    rail.innerHTML = visible.map(item => {
      const image = cardImage(item);
      const title = cardTitle(item);
      const target = cardTarget(item);
      const href = /^https?:\/\//i.test(String(target)) ? String(target) : (target ? contentUrl(item) : '/home');
      const rawType = firstValue(item, ['typeName','type','contentType','mediaType','kind','category'],'');
      const rawAdminBadge = firstValue(item, ['badge','statusBadge','status','labelBadge','tag','contentStatus','badgesText','badgeText'],'');
      const rawLanguage = firstValue(item, ['language','lang','audioLanguage','dubLanguage','languageBadge','audio'],'');
      const rawYear = firstValue(item, ['year','releaseYear','released','release_year'],'');
      const rawQuality = firstValue(item, ['quality','resolution','videoQuality','qualityBadge','videoType','qualityLabel','videoResolution','video_resolution','hdQuality','hd','isHD','isHd'],'');
      const rawRating = firstValue(item, ['rating','imdbRating','score','ratingValue','ratingBadge'],'');
      const badgeText = v => Array.isArray(v) ? v.filter(Boolean).join(', ') : (typeof v==='object' && v ? firstValue(v,['name','label','value','title'],'') : String(v??'').trim());
      const adminBadgeText = badgeText(rawAdminBadge);
      const badgeTokens = adminBadgeText.split(/[;,|]+/).map(v=>v.trim()).filter(Boolean);
      const detectedQuality = badgeTokens.find(v => /^(HD|FHD|FULL\s*HD|UHD|4K|8K|720P|1080P|2160P)$/i.test(v)) || '';
      const statusTokens = badgeTokens.filter(v => v !== detectedQuality);
      if (item && (item.comingSoon===true || String(item.comingSoon).toLowerCase()==='true')) statusTokens.push('Coming Soon');
      const statusText = statusTokens.join(' · ');
      const languageText = badgeText(rawLanguage);
      const yearText = badgeText(rawYear);
      const qualityText = badgeText(rawQuality) || detectedQuality || 'WEB-DL';
      const ratingText = badgeText(rawRating);
      const typeText = badgeText(rawType);
      const extraRaw = item && (item.badges ?? item.badgeList ?? item.labels);
      const extraBadges = (Array.isArray(extraRaw) ? extraRaw : (extraRaw && typeof extraRaw==='object' ? Object.values(extraRaw) : []))
        .map(badgeText).filter(Boolean).filter(v => ![statusText,languageText,yearText,qualityText,ratingText,typeText].includes(v));
      const topLeftVals = [statusText, languageText, yearText, ...extraBadges];
      const topLeft = topLeftVals.filter(Boolean).map((v,i)=>`<span class="home-card-badge ${i===0?'new':i===1?'language':i===2?'year':'new'}">${safeText(v)}</span>`).join('');
      const ratingBadge = ratingText ? `<span class="home-card-badge rating">★ ${safeText(ratingText.replace(/^★\s*/,''))}</span>` : '';
      const typeBadge = typeText ? `<span class="home-card-badge type">${safeText(typeText)}</span>` : '';
      const qualityBadge = qualityText ? `<span class="home-card-badge quality">${safeText(qualityText)}</span>` : '';
      return `<a class="home-type-card" href="${safeText(href)}" title="${safeText(title)}">
        <div class="home-type-card-poster">
          <img src="${safeText(image)}" alt="${safeText(title)}" loading="lazy" onerror="this.style.visibility='hidden'">
          <div class="home-card-badges">
            <div class="home-card-badge-row"><div class="home-card-badge-stack">${topLeft}</div>${qualityBadge}</div>
            <div class="home-card-badge-row">${ratingBadge}${typeBadge}</div>
          </div>
        </div>
        <div class="home-type-card-title">${safeText(title)}</div>
      </a>`;
    }).join('');
    const empty = cfg.emptyElement || document.getElementById(cfg.empty);
    if (empty) empty.hidden = matches.length > 0;
    const section = rail.closest('.home-type-section');
    if (section){
      section.hidden = matches.length === 0;
      const controls = ensureTypeControls(section, cfg);
      const [prev, next] = controls.querySelectorAll('button');
      prev.hidden = cfg.page <= 0;
      next.hidden = start + perPage >= matches.length;
    }
  });
}
function renderCustomTypeSections(){
  const container = document.querySelector('.home-types');
  if (!container) return;
  container.querySelectorAll('[data-admin-type-section="true"]').forEach(s => s.remove());
  const seen = new Set(builtinTypeConfig.map(t => typeKey(t.name)));
  customTypeConfig = (adminTypes||[])
    .filter(t => t && t.name && t.enabled !== false && t.enabled !== 'false')
    .sort((a,b) => Number(a.order??0) - Number(b.order??0))
    .filter(t => { const k = typeKey(t.name); if (!k || seen.has(k)) return false; seen.add(k); return true; })
    .map(t => {
      const id = String(t.id || t.key || typeKey(t.name)).replace(/[^a-zA-Z0-9_-]/g,'_');
      const section = document.createElement('section');
      section.className = 'home-type-section';
      section.dataset.adminTypeSection = 'true';
      const h = document.createElement('h2'); h.className='home-type-heading'; h.textContent = String(t.name).trim();
      const rail = document.createElement('div'); rail.className='home-type-rail'; rail.id='homeTypeAdmin_'+id;
      const empty = document.createElement('div'); empty.className='home-type-empty'; empty.textContent='No '+String(t.name).trim()+' cards yet.';
      section.append(h, rail, empty); container.appendChild(section);
      const cfg = {name:String(t.name).trim(), key:String(t.key||''), id:String(t.id||''), rail:rail.id, emptyElement:empty, page:0};
      ensureTypeControls(section, cfg);
      return cfg;
    });
  renderHomeTypeCards(latestContentItems);
}

/* ============================================================
   SEARCH
   ============================================================ */
function renderSearchPage(){
  const content = document.getElementById('pageContent');
  const chips = ['The Last: Naruto the...','Naruto Shippuden the Mov','Naruto Season 6 Episodes','Naruto the Movie: Guardian','Naruto Shippuden the Mov','Pechi (2024)'];
  const cats = [['All','▦'],['Movie','▣'],['Series','▱'],['Short TV','⊙'],['Music','♫'],['Anime','◉'],['Drama','♙'],['Top Rated','☆'],['Community','♧']];
  content.innerHTML = `<section class="search-page">
    <div class="search-top">
      <button class="search-back" id="searchBack" aria-label="Back">←</button>
      <div class="search-input-wrap"><span>⌕</span><input id="contentSearchInput" type="search" placeholder="Search movies, series, anime..." value="${safeText(activeSearchQuery)}" autocomplete="off"></div>
      <button class="search-mic" id="searchMic" aria-label="Voice search">♩</button>
    </div>
    <div class="search-trending"><h3 class="search-small-title">🔥 Everyone is searching</h3><div class="search-chips">${chips.map(c=>`<button class="search-chip" data-search-chip="${safeText(c)}">${safeText(c)}</button>`).join('')}</div></div>
    <nav class="search-categories">${cats.map(([n,i])=>`<button class="search-category ${activeSearchCategory===n?'active':''}" data-search-category="${safeText(n)}">${i} &nbsp;${safeText(n)}</button>`).join('')}</nav>
    <div class="search-results" id="searchResults"></div>
  </section>`;
  document.getElementById('searchBack').addEventListener('click', e => { e.preventDefault(); navigateTo('/home'); });
  const input = document.getElementById('contentSearchInput');
  input.addEventListener('input', () => { activeSearchQuery = input.value; updateSearchResults(); });
  content.querySelectorAll('[data-search-chip]').forEach(b => b.addEventListener('click', () => {
    activeSearchQuery = b.dataset.searchChip; input.value = activeSearchQuery; updateSearchResults(); input.focus();
  }));
  content.querySelectorAll('[data-search-category]').forEach(b => b.addEventListener('click', () => {
    activeSearchCategory = b.dataset.searchCategory;
    content.querySelectorAll('[data-search-category]').forEach(x => x.classList.toggle('active', x===b));
    updateSearchResults();
  }));
  document.getElementById('searchMic').addEventListener('click', () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR){ input.focus(); return; }
    const rec = new SR(); rec.lang='en-US';
    rec.onresult = e => { activeSearchQuery = e.results[0][0].transcript; input.value = activeSearchQuery; updateSearchResults(); };
    rec.start();
  });
  updateSearchResults();
}
function updateSearchResults(){
  const grid = document.getElementById('searchResults'); if (!grid) return;
  const q = activeSearchQuery.trim().toLowerCase();
  let items = (latestContentItems||[]).filter(item => {
    const title = String(cardTitle(item)).toLowerCase();
    const type = String(firstValue(item, ['typeName','type','contentType','mediaType','kind','category'],'Movie')).toLowerCase();
    const genre = String(firstValue(item, ['genre','genres','tags'],'')).toLowerCase();
    const matchesQuery = !q || title.includes(q) || type.includes(q) || genre.includes(q);
    let matchesCat = true;
    if (activeSearchCategory==='Movie') matchesCat = ['movie','movies'].includes(typeKey(type));
    else if (activeSearchCategory==='Anime') matchesCat = typeKey(type).includes('anime');
    else if (activeSearchCategory==='Series') matchesCat = ['series','tvseries','webseries'].includes(typeKey(type));
    else if (activeSearchCategory==='Short TV') matchesCat = type.includes('short');
    else if (activeSearchCategory==='Music') matchesCat = type.includes('music');
    else if (activeSearchCategory==='Drama') matchesCat = type.includes('drama') || genre.includes('drama');
    else if (activeSearchCategory==='Top Rated') matchesCat = Number(firstValue(item,['rating','imdbRating','score'],'0')) >= 7;
    else if (activeSearchCategory==='Community') matchesCat = false;
    return matchesQuery && matchesCat;
  });
  if (activeSearchCategory==='Top Rated') items.sort((a,b)=>Number(firstValue(b,['rating','imdbRating','score'],'0'))-Number(firstValue(a,['rating','imdbRating','score'],'0')));
  const pageItems = items.slice(0,100);
  if (!pageItems.length){ grid.innerHTML='<div class="search-empty">No matching content found.</div>'; return; }
  allPageConfig = {name:'Search', rail:'__searchTempRail', empty:'', emptyElement:null, page:0, randomizedItems:pageItems};
  const temp = document.createElement('div'); temp.className='home-type-section';
  temp.innerHTML='<div class="home-type-rail" id="__searchTempRail"></div>'; temp.hidden=true; document.body.appendChild(temp);
  renderHomeTypeCards(latestContentItems);
  const rail = document.getElementById('__searchTempRail');
  grid.innerHTML = rail ? rail.innerHTML : '';
  temp.remove(); allPageConfig = null;
  grid.querySelectorAll('a.home-type-card').forEach(a => a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (href && href.startsWith('/')){ e.preventDefault(); navigateTo(href); }
  }));
}

/* ============================================================
   DETAILS PAGE
   ============================================================ */
function detailValue(item, keys, fb=''){ return firstValue(item, keys, fb); }
function detailText(v, fb=''){
  if (Array.isArray(v)) return v.filter(Boolean).map(x=>typeof x==='object'?firstValue(x,['name','title','label','value'],''):String(x)).filter(Boolean).join(', ')||fb;
  if (v && typeof v==='object') return firstValue(v,['name','title','label','value','url'],'')||fb;
  return String(v ?? '').trim() || fb;
}
function detailArray(item, keys){
  for (const k of keys){ const v = item && item[k]; if (Array.isArray(v)) return v; if (v && typeof v==='object') return Object.values(v); }
  return [];
}

function renderDetailsPage(id, seasonParam, episodeParam){
  const item = (latestContentItems||[]).find(x =>
    String(x.id ?? x.key ?? x.contentId ?? '') === String(id) ||
    String(cardTarget(x)) === String(id) ||
    String(cardTitle(x)) === decodeURIComponent(String(id))
  );
  if (!item){ document.getElementById('pageContent').innerHTML='<section class="details-page"><div class="details-not-found">Content not found. Please check that this title exists in Admin and is published.</div></section>'; return; }
  const title=detailText(detailValue(item,['title','name','animeName','movieName','contentTitle']),'Untitled');
  const poster=cardImage(item) || detailText(item.backdrop,'');
  const type=detailText(detailValue(item,['typeName','type','contentType','mediaType','kind','category']),'Movie');
  const year=detailText(detailValue(item,['year','releaseYear','releasedYear'],''));
  const rating=detailText(detailValue(item,['rating','imdbRating','score','ratingValue'],''));
  const genre=detailText(detailValue(item,['genre','genres','tags'],''));
  const language=detailText(detailValue(item,['language','lang','audioLanguage','dubLanguage'],'Not specified'));
  const quality=detailText(detailValue(item,['quality','resolution','videoQuality','qualityLabel'],'WEB-DL'));
  const release=detailText(detailValue(item,['releaseDate','released','release_date','premiereDate'],year));
  const status=detailText(detailValue(item,['status','badge','contentStatus','showStatus'],item.comingSoon?'Coming Soon':'Ongoing'));
  const seasonNote=detailText(detailValue(item,['seasonEpisodeUpdate','episodeUpdate','latestEpisode','seasonInfo','episodeInfo'],''));
  const description=detailText(detailValue(item,['description','overview','storyline','plot','synopsis'],''),'No storyline added yet.');
  const cast=detailArray(item,['cast','actors','voiceActors','staff']);
  const trailer=detailText(detailValue(item,['trailerUrl','trailer','youtubeTrailer'],''));
  const myListKey='animebox_my_list'; let saved=[]; try{saved=JSON.parse(localStorage.getItem(myListKey)||'[]')}catch(_){}
  const itemId=String(item.id ?? item.key ?? item.contentId ?? id); const inList=saved.includes(itemId);
  const castHtml=cast.length ? cast.map(person=>{const obj=typeof person==='object'&&person?person:{name:String(person)};const n=detailText(detailValue(obj,['name','actor','title','personName']),'Cast');const role=detailText(detailValue(obj,['role','character','as','voice'],'Cast'));const img=detailText(detailValue(obj,['image','photo','imageUrl','photoUrl','profile','avatar'],''));return `<div class="details-cast-card">${img?`<img src="${safeText(img)}" alt="${safeText(n)}" loading="lazy" onerror="this.outerHTML='<div class=\\'details-cast-placeholder\\'>${safeText(n.slice(0,1))}</div>'">`:`<div class="details-cast-placeholder">${safeText(n.slice(0,1))}</div>`}<div class="details-cast-name">${safeText(n)}</div><div class="details-cast-role">${safeText(role)}</div></div>`}).join('') : '<div class="details-cast-card"><div class="details-cast-placeholder">★</div><div class="details-cast-name">Cast not added</div><div class="details-cast-role">Admin content</div></div>';
  document.getElementById('pageContent').innerHTML=`<section class="details-page">
    <div class="details-topbar"><button class="details-back" type="button" id="detailsBack">← Back</button><span class="details-topbar-title">${safeText(title)}</span></div>
    <div class="details-shell">
      <aside class="details-poster-wrap">
        ${poster?`<img class="details-poster" src="${safeText(poster)}" alt="${safeText(title)} poster" onerror="this.style.visibility='hidden'">`:'<div class="details-poster"></div>'}
        <div class="details-poster-badges">
          <div class="details-badge-row"><span class="details-badge quality">${safeText(quality)}</span></div>
          <div class="details-badge-row"><span class="details-badge language">${safeText(language)}</span><span class="details-badge type">${safeText(type.toUpperCase())}</span></div>
        </div>
      </aside>
      <article class="details-main">
        <h1 class="details-title">${safeText(title)}${year?` (${safeText(year)})`:''}</h1>
        ${seasonNote?`<div class="details-season-note">${safeText(seasonNote)}</div>`:''}
        <div class="details-status"><span class="status-dot">●</span>${safeText(status)}</div>
        <div class="details-facts">
          <div><div class="details-fact-label">Type</div><div class="details-fact-value type">${safeText(type)}</div></div>
          <div><div class="details-fact-label">Language</div><div class="details-fact-value language">${safeText(language)}</div></div>
          <div><div class="details-fact-label">Quality</div><div class="details-fact-value quality">${safeText(quality)}</div></div>
        </div>
        <div class="details-actions">
          ${trailer?`<button class="details-btn" type="button" id="detailsTrailer">▶ Watch Trailer</button>`:''}
          <button class="details-btn" type="button" id="detailsSave">${inList?'✓ Added to My List':'+ My List'}</button>
          <button class="details-btn" type="button" id="detailsWatch">▶ Watch Now</button>
        </div>
        <div class="details-list">
          ${rating?`<div class="details-list-row">⭐ <b>IMDb:</b> ${safeText(rating)}${String(rating).includes('/')?'':'/10'}</div>`:''}
          ${genre?`<div class="details-list-row">🎬 <b>Genre:</b> ${safeText(genre)}</div>`:''}
          <div class="details-list-row">🔊 <b>Language:</b> ${safeText(language)}</div>
          <div class="details-list-row">📺 <b>Quality:</b> ${safeText(quality)}</div>
          ${release?`<div class="details-list-row">🗓️ <b>Released:</b> ${safeText(release)}</div>`:''}
        </div>
        <h2 class="details-section-title">🎭 Cast</h2>
        <div class="details-cast">${castHtml}</div>
        <h2 class="details-section-title">📖 Storyline</h2>
        <p class="details-story">${safeText(description)}</p>
      </article>
    </div>
    <section class="watch-area" id="detailsWatchArea">
      <div class="watch-head">
        <div><div class="watch-kicker">WATCH ONLINE</div><h2 class="watch-title">${safeText(title)}${year?` (${safeText(year)})`:''}</h2></div>
        <span class="watch-ready" id="watchReady">● Ready</span>
      </div>
      <div class="watch-screen">
        <iframe id="adminVideoFrame" src="" title="${safeText(title)} video player" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
        <div class="watch-placeholder" id="watchPlaceholder">Admin Panel থেকে Video Player Website / Embed URL এবং episode link যোগ করলে এখানে চালু হবে।</div>
      </div>
      <div class="episode-head"><h3 class="episode-heading">Episodes</h3><select class="season-select" id="watchSeasonSelect" aria-label="Select season"><option value="0">Season 1</option></select></div>
      <div class="episode-grid" id="watchEpisodeGrid"><div class="episode-empty">Admin থেকে Season ও Episode data লোড হচ্ছে…</div></div>
      <div class="watch-controls">
        <span class="watch-chip" id="watchCurrentEpisode">Episode —</span>
        <span class="watch-chip" id="watchCurrentQuality">${safeText(quality)}</span>
        <span class="watch-chip" id="watchCurrentLanguage">${safeText(language)}</span>
        <div class="watch-nav"><button type="button" id="watchPrevious">◀ Previous</button><button type="button" id="watchNext">Next ▶</button></div>
      </div>
      <section class="episode-screenshots" id="episodeScreenshots" aria-label="Selected episode screenshots"><h3 class="episode-screenshots-title">SCREENSHOTS</h3><div class="episode-screenshot-list" id="episodeScreenshotList"></div></section>
    </section>
    <section class="user-download-hub" id="userDownloadHub" style="display:none" aria-label="Download links">
      <section class="user-download-block" id="userSeasonZipBlock"><h2 class="user-download-heading">📦 Season ZIP Downloads</h2><div class="user-download-grid" id="userSeasonZipList"></div></section>
      <section class="user-download-block" id="userEpisodeDownloadBlock"><h2 class="user-download-heading">⬇️ Episode Downloads</h2><div class="user-download-grid" id="userEpisodeDownloadList"></div></section>
    </section>
  </section>`;

  document.getElementById('detailsBack')?.addEventListener('click', e => { e.preventDefault(); navigateTo('/home'); });
  document.getElementById('detailsSave')?.addEventListener('click',()=>{
    let list=[]; try{list=JSON.parse(localStorage.getItem(myListKey)||'[]')}catch(_){}
    const idx=list.indexOf(itemId);
    if(idx>=0) list.splice(idx,1); else list.push(itemId);
    try{localStorage.setItem(myListKey,JSON.stringify(list))}catch(_){}
    document.getElementById('detailsSave').textContent = idx>=0?'+ My List':'✓ Added to My List';
  });
  document.getElementById('detailsTrailer')?.addEventListener('click',()=>{ if(trailer) window.open(trailer,'_blank','noopener'); });
  document.getElementById('detailsWatch')?.addEventListener('click',()=>{ document.getElementById('detailsWatchArea')?.scrollIntoView({behavior:'smooth',block:'start'}); });
  setupAdminWatchPlayer(item,itemId,title,quality,language);

  if (seasonParam && episodeParam){
    const tryJump = (attempts) => {
      const sel = document.getElementById('watchSeasonSelect');
      const grid = document.getElementById('watchEpisodeGrid');
      const epBtns = grid?.querySelectorAll('[data-watch-ep]');
      if (sel && sel.options.length >= seasonParam && epBtns && epBtns.length >= episodeParam){
        sel.selectedIndex = seasonParam - 1;
        sel.dispatchEvent(new Event('change'));
        setTimeout(() => {
          const btns2 = document.getElementById('watchEpisodeGrid')?.querySelectorAll('[data-watch-ep]');
          if (btns2 && btns2[episodeParam - 1]) btns2[episodeParam - 1].click();
        }, 300);
      } else if (attempts > 0){ setTimeout(() => tryJump(attempts - 1), 400); }
    };
    setTimeout(() => tryJump(6), 600);
  }
}

function watchUrlOf(obj){
  if (typeof obj==='string') return /^https?:\/\//i.test(obj) ? obj : '';
  return String(firstValue(obj,['websiteUrl','episodeUrl','episodeLink','playerUrl','videoPlayerUrl','videoPlayerWebsiteUrl','videoPlayerWebsite','playerWebsite','videoWebsiteUrl','videoWebsite','videoEmbedUrl','videoPlayerEmbedUrl','videoUrl','videoURL','embedUrl','watchUrl','streamUrl','url','link','src','iframeUrl','source'],'')||'').trim();
}
function normalizeWatchSeasons(raw, item){
  let source = raw || firstValue(item,['seasons','seasonList','seasonEpisodes','episodesBySeason','episodeData'],'');
  if (!source){
    const eps = firstValue(item,['episodes','episodeList','videoLinks','servers'],'');
    if (eps) source = [{name:'Season 1', episodes:eps}];
  }
  if (!source) return [];
  let arr = Array.isArray(source) ? source : (typeof source==='object' ? Object.entries(source).map(([k,v])=>({key:k, ...(v&&typeof v==='object'?v:{url:v})})) : []);
  if (arr.length && arr.every(x => typeof x==='string' || (x && !Array.isArray(x) && !x.episodes && !x.items && !x.episodeList && (x.episodeNumber || x.ep || x.episode || x.videoUrl || x.playerUrl || x.url)))) arr = [{name:'Season 1', episodes:arr}];
  return arr.map((season,index)=>{
    if (typeof season==='string') return {name:season, episodes:[]};
    const name = String(firstValue(season,['name','title','seasonName','label'],'Season '+(index+1)));
    let episodes = firstValue(season,['episodes','items','episodeList','videos','links'],'');
    if (!episodes && (season.url || season.videoUrl || season.playerUrl || season.embedUrl)) episodes = [season];
    if (Array.isArray(episodes)) episodes = episodes.map((ep,ei)=>typeof ep==='string'?{name:'Episode '+(ei+1),url:ep}:({...(ep||{}), name:firstValue(ep||{},['name','title','episodeName','label'],'Episode '+firstValue(ep||{},['episodeNumber','episode','ep','number'],ei+1))}));
    else if (episodes && typeof episodes==='object') episodes = Object.entries(episodes).map(([k,ep],ei)=>typeof ep==='string'?{name:'Episode '+k,url:ep}:({...(ep||{}), name:firstValue(ep||{},['name','title','episodeName','label'],'Episode '+firstValue(ep||{},['episodeNumber','episode','ep','number'],k||ei+1))}));
    else episodes=[];
    return {...season, name, episodes};
  });
}

function setupAdminWatchPlayer(item,itemId,title,quality,language){
  const seasonSelect=document.getElementById('watchSeasonSelect');
  const grid=document.getElementById('watchEpisodeGrid');
  const frame=document.getElementById('adminVideoFrame');
  if(!seasonSelect||!grid||!frame) return;
  let seasons=[], allEpisodes=[], selectedSeason=0, selectedEpisode=0;
  const directUrl=watchUrlOf(firstValue(item,['playerUrl','videoPlayerUrl','videoPlayerWebsiteUrl','videoPlayerWebsite','playerWebsite','videoWebsiteUrl','videoWebsite','webviewUrl','videoPlayerEmbedUrl','videoEmbedUrl','embedUrl','videoUrl','videoURL','watchUrl','streamUrl','linkVideo','websiteUrl'],''));
  const currentContentId=String(item?.id ?? item?.key ?? item?.contentId ?? itemId ?? '').trim();
  const visible=(x)=>x && x.enabled!==false && x.active!==false && x.published!==false;
  const dlEscUser=(v)=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const sortDownloadRows=(rows)=>rows.sort((a,b)=>(Number(a.order??a.sortOrder??0)-Number(b.order??b.sortOrder??0)) || (Number(a.number??a.episodeNumber??0)-Number(b.number??b.episodeNumber??0)));
  function renderUserDownloadHub(){
    const hub=document.getElementById('userDownloadHub'), zipRoot=document.getElementById('userSeasonZipList'), epRoot=document.getElementById('userEpisodeDownloadList');
    const zipBlock=document.getElementById('userSeasonZipBlock'), epBlock=document.getElementById('userEpisodeDownloadBlock');
    if(!hub||!zipRoot||!epRoot||!zipBlock||!epBlock)return;
    const validUrl=value=>/^https?:\/\//i.test(String(value||'').trim());
    const zipRows=seasons.filter(s=>validUrl(s.zipUrl)); const episodeRows=[];
    seasons.forEach((season,si)=>{
      const eps=sortDownloadRows(allEpisodes.filter(ep=>{
        const sid=String(ep.seasonId??ep.parentSeasonId??ep.groupId??'').trim(); if(sid&&sid===String(season.id))return true;
        const values=[ep.season,ep.seasonNumber,ep.groupNumber,ep.parentSeasonNumber].filter(v=>v!==undefined&&v!==null&&String(v).trim()!=='');
        if(values.some(v=>String(v)===String(season.number??si+1)||String(v).toLowerCase()===String(season.name||'').toLowerCase()))return true;
        return !sid&&!values.length&&seasons.length===1;
      }).filter(visible));
      eps.forEach((ep,ei)=>{const url=String(ep.downloadUrl||'').trim(), ez=String(ep.episodeZipUrl||ep.zipDownloadUrl||ep.zipUrl||ep.downloadZipUrl||'').trim();if(validUrl(url)||validUrl(ez))episodeRows.push({season,ep,ei,url:validUrl(url)?url:'',episodeZip:validUrl(ez)?ez:''});});
    });
    zipRoot.innerHTML=zipRows.map(s=>`<article class="user-download-card"><div class="user-download-name">${dlEscUser(s.zipName||s.name||('Season '+(s.number||''))+' ZIP')}</div><div class="user-download-meta">${dlEscUser(s.name||('Season '+(s.number||'')))} · Full Season ZIP</div><a class="user-download-btn" href="${dlEscUser(s.zipUrl)}" target="_blank" rel="noopener noreferrer" download>⬇ Download ZIP</a></article>`).join('');
    epRoot.innerHTML=episodeRows.map(({season,ep,ei,url,episodeZip})=>`<article class="user-download-card"><div class="user-download-name">${dlEscUser(ep.title||ep.name||('Episode '+(ep.episodeNumber||ei+1)))}</div><div class="user-download-meta">${dlEscUser(season.name||('Season '+(season.number||'')))} · ${dlEscUser(ep.qualityName||ep.downloadQuality||ep.downloadQualityName||'Download')}</div>${url?`<a class="user-download-btn" href="${dlEscUser(url)}" target="_blank" rel="noopener noreferrer">⬇ Download Episode</a>`:''}${episodeZip?`<a class="user-download-btn ep-zip-download-btn" href="${dlEscUser(episodeZip)}" target="_blank" rel="noopener noreferrer" download>📦 Download EP ZIP</a>`:''}</article>`).join('');
    zipBlock.classList.toggle('has-items',zipRows.length>0);epBlock.classList.toggle('has-items',episodeRows.length>0);hub.style.display=(zipRows.length||episodeRows.length)?'block':'none';
  }

  function renderEpisodeScreenshots(episode){
    const section=document.getElementById('episodeScreenshots');
    const list=document.getElementById('episodeScreenshotList');
    if(!section||!list)return;
    // Admin Preview Manager saves each episode's previews at episodes/{contentId}/{episodeId}/previews.
    const raw=episode?.previews ?? episode?.screenshots ?? episode?.screenshotImages ?? [];
    let shots=Array.isArray(raw)?raw:(raw&&typeof raw==='object'?Object.values(raw):[]);
    shots=shots.filter(p=>p&&typeof p==='object'&&String(p.imageUrl||p.image||p.thumbnail||'').trim());
    if(!shots.length){section.classList.remove('show');list.innerHTML='';return;}
    list.innerHTML=shots.map((shot,i)=>{
      const image=String(shot.imageUrl||shot.image||shot.thumbnail||'').trim();
      const click=String(shot.clickUrl||shot.url||shot.link||'').trim();
      const name=String(shot.name||('Screenshot '+(i+1)));
      const img=`<img src="${safeText(image)}" alt="${safeText(name)}" loading="lazy" onerror="this.closest('.episode-screenshot').style.display='none'">`;
      return click&&/^https?:\/\//i.test(click)
        ? `<a class="episode-screenshot" href="${safeText(click)}" target="_blank" rel="noopener noreferrer">${img}<span class="episode-screenshot-name">${safeText(name)}</span></a>`
        : `<div class="episode-screenshot">${img}<span class="episode-screenshot-name">${safeText(name)}</span></div>`;
    }).join('');
    section.classList.add('show');
  }
  function setFrame(url,episode){
    renderEpisodeScreenshots(episode);
    const safeUrl=String(url||'').trim();
    const ready=document.getElementById('watchReady');
    const placeholder=document.getElementById('watchPlaceholder');
    if (safeUrl && /^https?:\/\//i.test(safeUrl)){ frame.src=safeUrl; placeholder.style.display='none'; ready.textContent='● Player Loaded'; }
    else { frame.removeAttribute('src'); placeholder.style.display='grid'; ready.textContent='● Add Player URL'; }
    const epName=episode ? (episode.title||episode.name||('Episode '+(episode.episodeNumber||''))) : 'Episode —';
    document.getElementById('watchCurrentEpisode').textContent=epName;
    document.getElementById('watchCurrentQuality').textContent=detailText(firstValue(episode||{},['quality','resolution','videoQuality'],quality),quality);
    document.getElementById('watchCurrentLanguage').textContent=detailText(firstValue(episode||{},['language','lang','audioLanguage'],language),language);
  }
  function selectedEpisodes(){
    const season=seasons[selectedSeason];
    if(!season) return [];
    return allEpisodes.filter(ep=>{
      if(ep.seasonId!==undefined && ep.seasonId!==null && String(ep.seasonId)!=='') return String(ep.seasonId)===String(season.id);
      return Number(ep.season||1)===Number(season.number||selectedSeason+1);
    });
  }
  function renderSeasonOptions(){
    seasonSelect.innerHTML=seasons.length ? seasons.map((s,i)=>`<option value="${i}">${safeText(s.name||('Season '+(s.number||i+1)))}</option>`).join('') : '<option value="0">No seasons added</option>';
    seasonSelect.disabled=!seasons.length;
    seasonSelect.value=String(Math.min(selectedSeason,Math.max(0,seasons.length-1)));
  }
  function playSelectedEpisode(scroll){
    const eps=selectedEpisodes();
    const ep=eps[selectedEpisode];
    const url=watchUrlOf(ep) || directUrl;
    setFrame(url,ep||null);
    grid.querySelectorAll('[data-watch-ep]').forEach((btn,i)=>btn.classList.toggle('active',i===selectedEpisode));
    document.getElementById('watchPrevious').disabled=!eps.length || (selectedSeason===0 && selectedEpisode===0);
    document.getElementById('watchNext').disabled=!eps.length || (selectedSeason===seasons.length-1 && selectedEpisode>=eps.length-1);
    if(scroll) document.getElementById('detailsWatchArea')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function renderEpisodes(){
    const eps=selectedEpisodes();
    if(!eps.length){
      grid.innerHTML='<div class="episode-empty">এই Season-এ কোনো Published Episode পাওয়া যায়নি।</div>';
      document.getElementById('watchPrevious').disabled=true;
      document.getElementById('watchNext').disabled=true;
      setFrame(directUrl,null);
      return;
    }
    selectedEpisode=Math.min(selectedEpisode,eps.length-1);
    grid.innerHTML=eps.map((ep,i)=>{
      const n=ep.episodeNumber ?? ep.number ?? (i+1);
      const label=ep.title || ep.name || ('EP '+n);
      return `<button type="button" class="episode-card ${i===selectedEpisode?'active':''}" data-watch-ep="${i}">${safeText(label)}</button>`;
    }).join('');
    grid.querySelectorAll('[data-watch-ep]').forEach(btn=>btn.addEventListener('click',()=>{selectedEpisode=Number(btn.dataset.watchEp);playSelectedEpisode(true)}));
    playSelectedEpisode(false);
  }
  seasonSelect.addEventListener('change',()=>{selectedSeason=Number(seasonSelect.value)||0;selectedEpisode=0;renderEpisodes()});
  document.getElementById('watchPrevious').addEventListener('click',()=>{
    if(selectedEpisode>0) selectedEpisode--;
    else if(selectedSeason>0){selectedSeason--;selectedEpisode=Math.max(0,selectedEpisodes().length-1);seasonSelect.value=String(selectedSeason)}
    renderEpisodes();
  });
  document.getElementById('watchNext').addEventListener('click',()=>{
    const eps=selectedEpisodes();
    if(selectedEpisode<eps.length-1) selectedEpisode++;
    else if(selectedSeason<seasons.length-1){selectedSeason++;selectedEpisode=0;seasonSelect.value=String(selectedSeason)}
    renderEpisodes();
  });

  if(typeof db!=='undefined'){
    db.ref('seasons/'+currentContentId).on('value',snap=>{
      seasons=normalizeSlideList(snap.val()).map(x=>({...x,id:String(x.id??x.key??'')})).filter(x=>x.enabled!==false && x.active!==false);
      selectedSeason=Math.min(selectedSeason,Math.max(0,seasons.length-1));
      renderSeasonOptions(); renderEpisodes(); renderUserDownloadHub();
    });
    db.ref('episodes/'+currentContentId).on('value',snap=>{
      allEpisodes=normalizeSlideList(snap.val()).map(x=>({...x,id:String(x.id??x.key??'')}));
      renderEpisodes(); renderUserDownloadHub();
    });
  } else {
    seasons=normalizeWatchSeasons(null,item);
    renderSeasonOptions(); renderEpisodes();
  }
  if(!seasons.length){ seasons=normalizeWatchSeasons(null,item); renderSeasonOptions(); renderEpisodes(); renderUserDownloadHub(); }
}

/* ============================================================
   TYPE LIST PAGE
   ============================================================ */
function renderTypeListPage(typeName, page=0){
  const cfg = allHomeTypeConfig().find(x => typeKey(x.name)===typeKey(typeName));
  if (!cfg){ document.getElementById('pageContent').innerHTML='<section class="type-list-page"><p class="type-list-empty">Type not found.</p><button class="type-list-back" id="typeBack2">← Home</button></section>'; document.getElementById('typeBack2')?.addEventListener('click',e=>{e.preventDefault();navigateTo('/home')}); return; }
  const matched = (latestContentItems||[]).filter(item => cfg.name==='Trending'
    ? (itemMatchesType(item,cfg)||item.trending===true||item.isTrending===true||String(item.trending).toLowerCase()==='true')
    : itemMatchesType(item,cfg));
  const pageSize = window.matchMedia('(max-width: 640px)').matches ? 9 : 32;
  const totalPages = Math.max(1, Math.ceil(matched.length/pageSize));
  page = Math.max(0, Math.min(Number(page)||0, totalPages-1));
  const pageItems = matched.slice(page*pageSize, (page+1)*pageSize);
  const content = document.getElementById('pageContent');
  content.innerHTML = `<section class="type-list-page"><div class="type-list-head"><button class="type-list-back" id="typeBack">← Back</button><h1 class="type-list-title">${safeText(cfg.name)}</h1></div><div class="type-list-toolbar"><button class="type-filter">☷ All Genres</button><button class="type-filter">▣ All Years</button><button class="type-filter">◎ All Audio</button><button class="type-filter">▣ All Quality</button><button class="type-filter">☷ Newest</button></div><div class="type-list-grid" id="typeListGrid"></div>${matched.length ? `<div class="type-pagination">${Array.from({length:totalPages},(_,i)=>`<button class="type-page-btn ${i===page?'active':''}" data-page-number="${i}">${i+1}</button>`).join('')}</div>` : '<div class="type-list-empty">No content in this Type yet.</div>'}</section>`;
  document.getElementById('typeBack').addEventListener('click', e => { e.preventDefault(); navigateTo('/home'); });
  const grid = document.getElementById('typeListGrid');
  allPageConfig = {...cfg, rail:'__typeListTempRail', empty:'', emptyElement:null, page:0, randomizedItems:pageItems};
  const temp = document.createElement('div'); temp.className='home-type-section';
  temp.innerHTML='<div class="home-type-rail" id="__typeListTempRail"></div>'; temp.hidden=true; document.body.appendChild(temp);
  renderHomeTypeCards(latestContentItems);
  const rail = document.getElementById('__typeListTempRail');
  if (rail) grid.innerHTML = rail.innerHTML;
  temp.remove(); allPageConfig = null;
  grid.querySelectorAll('a.home-type-card').forEach(a => a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (href && href.startsWith('/')){ e.preventDefault(); navigateTo(href); }
  }));
  content.querySelectorAll('[data-page-number]').forEach(b => b.addEventListener('click', () => renderTypeListPage(cfg.name, Number(b.dataset.pageNumber))));
}

/* ============================================================
   ROUTER (CLEAN URLs - No Hash)
   ============================================================ */
function currentPath(){
  let p = decodeURI(location.pathname || '/home');
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0,-1);
  return p || '/home';
}
function navigateTo(path, replace=false){
  if (replace) history.replaceState({}, '', path);
  else history.pushState({}, '', path);
  routePage();
  window.scrollTo({top:0, behavior:'instant'});
}
function parseDetailPath(path){
  const m = path.match(/^(?:\/details|\/home\/details?|\/home\/detail)\/([^/]+)(?:\/([^/]+))?(?:\/season\/(\d+)\/episode\/(\d+))?/i);
  if (!m) return null;
  return { slug: m[1], id: m[2] || m[1], season: m[3]?Number(m[3]):null, episode: m[4]?Number(m[4]):null };
}
function showHomeSections(visible){
  const hw = document.querySelector('.hero-wrap');
  const ht = document.querySelector('.home-types');
  if (visible){ hw?.removeAttribute('hidden'); ht?.removeAttribute('hidden'); }
  else { hw?.setAttribute('hidden',''); ht?.setAttribute('hidden',''); }
}
function findTypeBySlug(slug){
  const norm = s => String(s ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g,'');
  const key = norm(slug);
  const hit = (adminTypes||[]).find(t => norm(t.name)===key || norm(t.key)===key || norm(t.id)===key);
  if (hit) return hit.name;
  const b = builtinTypeConfig.find(t => norm(t.name)===key);
  return b ? b.name : slug;
}
function setActiveNav(page){
  document.querySelectorAll('[data-page]').forEach(el => el.classList.toggle('active', el.dataset.page===page));
}

function routePage(){
  const path = currentPath();
  const content = document.getElementById('pageContent');
  if (!content) return;
  document.body.classList.toggle('search-active', path === '/search');
  const detailInfo = parseDetailPath(path);
  const builtinSlugs = builtinTypeConfig.map(t => slugify(t.name));
  const adminSlugs = (adminTypes||[]).map(t => slugify(t.name));
  const allSlugs = [...new Set([...builtinSlugs, ...adminSlugs])];
  let typeSlug = null;
  if (path !== '/' && path !== '/home' && !path.startsWith('/details') && !path.startsWith('/home/detail') && path !== '/search' && path !== '/profile'){
    const seg = path.slice(1).split('/')[0];
    if (allSlugs.includes(seg)) typeSlug = seg;
  }
  const leavingHome = detailInfo || path === '/search' || typeSlug || path === '/profile';
  if (leavingHome && content.querySelector('.hero-wrap')) cachedHomeMarkup = content.innerHTML;

  if (path === '/search'){ showHomeSections(false); setActiveNav(''); renderSearchPage(); return; }
  if (detailInfo){ showHomeSections(false); setActiveNav(''); renderDetailsPage(detailInfo.id, detailInfo.season, detailInfo.episode); return; }
  if (path === '/profile'){ showHomeSections(false); setActiveNav('profile'); return; }
  if (typeSlug){ showHomeSections(false); setActiveNav(''); renderTypeListPage(findTypeBySlug(typeSlug)); return; }
  if (path === '/home' || path === '/'){
    showHomeSections(true); setActiveNav('home');
    if (!content.querySelector('.hero-wrap')){
      if (cachedHomeMarkup) content.innerHTML = cachedHomeMarkup;
      renderCustomTypeSections();
      renderHomeTypeCards(latestContentItems);
    }
    const hs = document.getElementById('heroSlider');
    if (hs){
      if (!hs.querySelector('.hero-slide') || hs.querySelector('.hero-empty')){
        if (!heroIndex && heroSlides.length > 1) chooseRandomInitialSlide();
        renderHero();
      }
      restartHeroTimer();
    }
    return;
  }
  navigateTo('/home', true);
}

/* ---------- EVENTS ---------- */
window.addEventListener('popstate', routePage);

document.addEventListener('click', e => {
  const link = e.target.closest('a');
  if (!link) return;
  const href = link.getAttribute('href');
  if (!href) return;
  if (/^(https?:)?\/\//i.test(href)) return;
  if (/^(mailto:|tel:|#)/i.test(href)) return;
  if (href.startsWith('/')){ e.preventDefault(); navigateTo(href); }
});

document.addEventListener('DOMContentLoaded', () => {
  if (location.pathname === '/' || location.pathname === '') {
    history.replaceState({}, '', '/home');
  }

  builtinTypeConfig.forEach(cfg => {
    const rail = document.getElementById(cfg.rail);
    const section = rail && rail.closest('.home-type-section');
    if (section) ensureTypeControls(section, cfg);
  });

  document.getElementById('searchButton')?.addEventListener('click', () => { activeSearchQuery=''; activeSearchCategory='All'; navigateTo('/search'); });
  document.getElementById('menuButton')?.addEventListener('click', () => alert('Menu controls will be added later.'));
  document.querySelectorAll('[data-go="profile"]').forEach(b => b.addEventListener('click', () => navigateTo('/profile')));
  window.addEventListener('resize', () => renderHomeTypeCards(latestContentItems));

  routePage();
});

/* ============================================================
   FIREBASE
   ============================================================ */
const firebaseConfig = {
  apiKey: "AIzaSyCivW6E7Nk2OE794_8vggiYFLn7x4ElrIQ",
  authDomain: "ttttt-9bee0.firebaseapp.com",
  databaseURL: "https://ttttt-9bee0-default-rtdb.firebaseio.com",
  projectId: "ttttt-9bee0",
  storageBucket: "ttttt-9bee0.firebasestorage.app",
  messagingSenderId: "416509818110",
  appId: "1:416509818110:web:cbefe7284695e8ea9261af"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

function applyContentSnapshot(content){
  heroContentMap = {};
  content.forEach(item => {
    const id = item.id || item.key;
    if (id !== undefined && id !== null) heroContentMap[String(id)] = item;
  });
  renderHomeTypeCards(content);
  const heroSlider = document.getElementById('heroSlider');
  if (heroSlider && heroSlider.offsetParent !== null){
    if (!heroIndex && heroSlides.length > 1) chooseRandomInitialSlide();
    renderHero();
    restartHeroTimer();
  }
}

db.ref('content').once('value')
  .then(snap => { applyContentSnapshot(normalizeSlideList(snap.val())); contentFirstPaintDone = true; if (window.__hideSplashNow) window.__hideSplashNow(); routePage(); })
  .catch(err => { console.warn('Content first read failed:', err); contentFirstPaintDone = true; if (window.__hideSplashNow) window.__hideSplashNow(); routePage(); });

db.ref('content').on('value', snap => {
  applyContentSnapshot(normalizeSlideList(snap.val()));
  if (!contentFirstPaintDone){ contentFirstPaintDone = true; if (window.__hideSplashNow) window.__hideSplashNow(); }
});

db.ref('types').on('value', snap => {
  const raw = snap.val();
  adminTypes = raw && typeof raw==='object' ? Object.entries(raw).map(([id,v]) => ({id, ...(v||{})})) : [];
  renderCustomTypeSections();
}, err => console.warn('Could not load Admin types:', err));

db.ref('heroSlides').on('value', snap => {
  const incoming = normalizeSlideList(snap.val())
    .filter(s => s && s.enabled!==false && s.active!==false && s.hidden!==true && s.published!==false)
    .sort((a,b) => Number(a.order ?? a.sortOrder ?? 0) - Number(b.order ?? b.sortOrder ?? 0));
  const firstLoad = heroSlides.length === 0 && incoming.length > 0;
  heroSlides = incoming;
  if (firstLoad) chooseRandomInitialSlide();
  else heroIndex = Math.min(heroIndex, Math.max(0, heroSlides.length - 1));
  renderHero();
  restartHeroTimer();
}, () => { heroSlides = []; renderHero(); });
