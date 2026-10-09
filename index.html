/* Safe storage wrapper: sandboxed previews may block window.localStorage.
   Uses browser storage when available and an in-memory fallback otherwise. */
const safeStorage = (() => {
  const memory = new Map();
  const getNative = () => {
    try { return window.localStorage; } catch (_) { return null; }
  };
  return {
    getItem(key) {
      try { const store = getNative(); if (store) return store.getItem(key); } catch (_) {}
      return memory.has(String(key)) ? memory.get(String(key)) : null;
    },
    setItem(key, value) {
      key = String(key); value = String(value);
      try { const store = getNative(); if (store) { store.setItem(key, value); return; } } catch (_) {}
      memory.set(key, value);
    },
    removeItem(key) {
      key = String(key);
      try { const store = getNative(); if (store) { store.removeItem(key); } } catch (_) {}
      memory.delete(key);
    },
    keys() {
      try {
        const store = getNative();
        if (store) return Array.from({ length: store.length }, (_, i) => store.key(i)).filter(Boolean);
      } catch (_) {}
      return Array.from(memory.keys());
    }
  };
})();

document.getElementById('year').textContent = new Date().getFullYear();

const firebaseConfig = {
    apiKey: "AIzaSyCivW6E7Nk2OE794_8vggiYFLn7x4ElrIQ",
    authDomain: "ttttt-9bee0.firebaseapp.com",
    databaseURL: "https://ttttt-9bee0-default-rtdb.firebaseio.com",
    projectId: "ttttt-9bee0",
    storageBucket: "ttttt-9bee0.firebasestorage.app",
    messagingSenderId: "416509818110",
    appId: "1:416509818110:web:cbefe7284695e8ea9261af",
    measurementId: "G-CLY83NZJF8"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let heroSlides = [];
let banners = [];
let categories = [];
let types = [];
let content = [];
let heroIndex = 0, bannerIndex = 0;
let heroTimer = null, bannerTimer = null;
let activeMovieCat = 'all', activeTvCat = 'all', activeAnimeCat = 'all';

const $ = (id) => document.getElementById(id);

const DEFAULT_SITE_THEME = {
    bg:'#0a0800',
    bgSoft:'#0f0a00',
    card:'#1a1400',
    cardHover:'#2a2000',
    text:'#fdf6e3',
    muted:'#a89040',
    accent:'#fbbf24',
    accent2:'#f59e0b',
    cardBorder:'rgba(251,191,36,.2)',
    badge:'#fbbf24',
    badgeText:'#fbbf24',
    badgeLang:'#fcd34d',
    badgeYear:'#fbbf24',
    quality:'#fbbf24',
    rating:'#fbbf24',
    typeBadge:'#f59e0b',
    cardTitle:'#fdf6e3'
};

function applySiteTheme(theme){
    const t = Object.assign({}, DEFAULT_SITE_THEME, theme || {});
    const root = document.documentElement;
    root.style.setProperty('--bg', t.bg);
    root.style.setProperty('--bg-soft', t.bgSoft);
    root.style.setProperty('--bg-card', t.card);
    root.style.setProperty('--bg-card-hover', t.cardHover);
    root.style.setProperty('--text', t.text);
    root.style.setProperty('--text-muted', t.muted);
    root.style.setProperty('--accent', t.accent);
    root.style.setProperty('--accent2', t.accent2);
    root.style.setProperty('--theme-card-bg', t.card);
    root.style.setProperty('--theme-card-border', t.cardBorder);
    root.style.setProperty('--theme-badge', t.badge);
    root.style.setProperty('--theme-badge-text', t.badgeText || t.badge);
    root.style.setProperty('--theme-badge-lang', t.badgeLang);
    root.style.setProperty('--theme-badge-year', t.badgeYear);
    root.style.setProperty('--theme-quality', t.quality || '#fbbf24');
    root.style.setProperty('--theme-rating', t.rating);
    root.style.setProperty('--theme-type', t.typeBadge);
    root.style.setProperty('--theme-card-title', t.cardTitle);
    root.style.setProperty('--gradient', `linear-gradient(135deg, ${t.accent}, ${t.accent2})`);
    try { safeStorage.setItem('streambox_theme', JSON.stringify(t)); } catch(e){}
}

try { applySiteTheme(JSON.parse(safeStorage.getItem('streambox_theme') || 'null')); }
catch(e) { applySiteTheme(DEFAULT_SITE_THEME); }

db.ref('settings/theme').on('value', snap => {
    if(snap.exists()) applySiteTheme(snap.val());
    else applySiteTheme(DEFAULT_SITE_THEME);
});

function toArray(snapVal){ if(!snapVal) return []; return Object.keys(snapVal).map(key => ({ id: key, ...snapVal[key] })); }
function sortByOrder(arr){ return arr.slice().sort((a,b)=>(a.order??0)-(b.order??0)); }
function shuffleForRefresh(arr){ const a=arr.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
function onlyEnabled(arr){ return arr.filter(x => x.enabled !== false); }
function escapeHtml(value){ return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[ch])); }

function hashCode(str){ let h=0; const s=String(str||''); for(let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0;} return Math.abs(h); }
function formatViews(n){ n=Number(n)||0; if(n>=1000000) return (n/1000000).toFixed(1).replace(/\.0$/,'')+'M'; if(n>=1000) return Math.floor(n/1000)+'k'; return String(n); }
function getRandomViewFor(item){ if(!item) return '0'; const seed=String(item.id||'')+'|'+String(item.title||item.name||''); const h=hashCode(seed); const min=10000,max=180000; const n=min+(h%(max-min+1)); return formatViews(n); }
function incrementView(btn){ if(!btn) return; const span=btn.querySelector('.view-count'); if(!span) return; const currentText=String(span.textContent||'0').trim(); let currentNum=0; if(/k$/i.test(currentText)) currentNum=Math.round(parseFloat(currentText)*1000); else if(/m$/i.test(currentText)) currentNum=Math.round(parseFloat(currentText)*1000000); else currentNum=parseInt(currentText,10)||0; currentNum+=1; span.textContent=formatViews(currentNum); }

function normalizeType(t){ t=String(t||'').toLowerCase().trim().replace(/[_-]+/g,' '); if(t==='tvshow'||t==='tv show'||t==='series') return 'tv'; if(t==='movie'||t==='movies') return 'movie'; if(t==='anime'||t==='animes') return 'anime'; return t.replace(/\s+/g,'-'); }
function typeDisplayName(key){ const built={movie:'Movies',tv:'TV Shows',anime:'Anime'}; if(built[key]) return built[key]; const t=types.find(x=>(x.key||normalizeType(x.name))===key); return t?.name || key; }
function typeKeyOf(t){ return t.key || normalizeType(t.name); }
function isBuiltInType(key){ return ['movie','tv','anime'].includes(key); }
function isTypeValid(key){ if(!key) return false; if(isBuiltInType(key)) return true; return types.some(t => typeKeyOf(t) === key && t.enabled !== false); }

db.ref('heroSlides').on('value', snap => { heroSlides = sortByOrder(onlyEnabled(toArray(snap.val()))); renderHero(); });
db.ref('banners').on('value', snap => { banners = sortByOrder(onlyEnabled(toArray(snap.val()))); renderBanner(); });
db.ref('categories').on('value', snap => {
    categories = sortByOrder(onlyEnabled(toArray(snap.val())));
    renderCategoryTabs(); renderGrids(); renderWatchHistory(); renderMyList(); renderContinueWatching();
    const catSel=$('advCategory');
    if(catSel){ const selected=advancedSearchFilters.category; catSel.innerHTML='<option value="">All Categories</option>'+[...new Set(categories.map(c=>c.name||c.title||c.id).filter(Boolean))].map(v=>`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join(''); catSel.value=selected; }
    const langSel=$('advLanguage');
    if(langSel){ const selected=advancedSearchFilters.language; const langs=[...new Set(content.map(c=>c.language||c.lang||c.audioLanguage).filter(Boolean))]; langSel.innerHTML='<option value="">All Languages</option>'+langs.map(v=>`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join(''); langSel.value=selected; }
});
db.ref('types').on('value', snap => { types = sortByOrder(onlyEnabled(toArray(snap.val()))); renderCustomTypeSections(); renderCustomTypeMenuItems(); });

function renderCustomTypeMenuItems(){
    const wrap = $('customTypeMenuItems');
    if(!wrap) return;
    const custom = types.filter(t => t.enabled !== false && !isBuiltInType(typeKeyOf(t)));
    wrap.innerHTML = custom.map(t => { const key = typeKeyOf(t); const name = t.name || key; return `<a href="#" data-section="${escapeHtml(key)}" data-custom-type="1"><span class="nav-icon html-icon html-icon-anime">◇</span> ${escapeHtml(name)}</a>`; }).join('');
}

if(!window.location.hash){ history.replaceState({}, '', '#/'); }

function getHashRoute(){ const raw = (window.location.hash || '#/').slice(1); const qIndex = raw.indexOf('?'); return { path: (qIndex >= 0 ? raw.slice(0, qIndex) : raw) || '/', query: qIndex >= 0 ? raw.slice(qIndex + 1) : '' }; }
function getRouteParams(){ return new URLSearchParams(getHashRoute().query); }
function getSearchFromUrl(){ return getRouteParams().get('search') || ''; }
function getCategoryFromUrl(){ return (getRouteParams().get('category') || '').toLowerCase(); }

function parseAppRoute(){
    const path = getHashRoute().path.replace(/\/+$/, '') || '/';
    const parts = path.split('/').filter(Boolean);
    const homeIndex = parts.indexOf('home');
    if(homeIndex < 0) return {type:'home'};
    const rest = parts.slice(homeIndex + 1);
    if(rest[0] !== 'detail' || !rest[1]) return {type:'home'};
    let slug = rest[1];
    try { slug = decodeURIComponent(slug); } catch (_) {}
    const route = {type:'detail', slug, seasonSlug:'', episodeSlug:''};
    if(rest[2] === 'season' && rest[3]) route.seasonSlug = decodeURIComponent(rest[3]);
    if(rest[4] === 'ep' && rest[5]) route.episodeSlug = decodeURIComponent(rest[5]);
    return route;
}

function findContentByRouteSlug(slug){ const wanted = slugifyWatch(slug); return content.find(c => slugifyWatch(c.title || c.name || c.id) === wanted); }
function buildDetailPath(item, seasonNo='', episodeNo=''){ const slug = slugifyWatch(item?.title || item?.name || item?.id); let path = '#/home/detail/' + encodeURIComponent(slug); if(seasonNo !== '' && seasonNo != null) path += '/season/' + encodeURIComponent(String(seasonNo)); if(episodeNo !== '' && episodeNo != null) path += '/ep/' + encodeURIComponent(String(episodeNo)); return path; }
function updateAppRoute(item, seasonNo='', episodeNo='', replace=false){ if(!item) return; const path = buildDetailPath(item, seasonNo, episodeNo); if(window.location.hash !== path){ (replace ? history.replaceState : history.pushState).call(history, {}, '', path); } }

function handleAppRoute(){
    const q=getSearchFromUrl(); const cat=getCategoryFromUrl();
    if(q){ renderSearchPage(); window.scrollTo({top:0,behavior:'auto'}); return; }
    if(cat){ renderCategoryPage(); window.scrollTo({top:0,behavior:'auto'}); return; }
    const route=parseAppRoute();
    if(route.type !== 'detail'){ closeModal(false); goHome(); return; }
    const item=findContentByRouteSlug(route.slug);
    if(!item){ closeModal(false); goHome(); return; }
    openContentById(item.id, true, route);
    window.scrollTo({top:0,behavior:'auto'});
}

window.addEventListener('popstate', handleAppRoute);
window.addEventListener('hashchange', handleAppRoute);

function openSearchPage(query){
    query=String(query||'').trim(); if(!query) return;
    const encoded=encodeURIComponent(query); const url='#/home?search='+encoded;
    if(window.location.hash !== url) history.pushState({},'',url);
    currentSearchFilter='all';
    const tabs=$('searchPageTabs'); if(tabs) tabs.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.filter==='all'));
    const input=$('searchInput'); if(input) input.value=query;
    const results=$('searchResults'); if(results) results.classList.remove('show');
    renderSearchPage(); window.scrollTo({top:0,behavior:'auto'});
}

function goSearchBack(){ if(window.history.length>1) history.back(); else goHome(); }

function openSearchResultPlayer(encodedId){
    const id = decodeURIComponent(String(encodedId || ''));
    const item = content.find(c => String(c.id) === String(id));
    if(!item) return;
    document.body.classList.remove('search-mode','category-mode','detail-mode');
    const loader = $('loader'); if(loader) loader.classList.add('hide');
    if(typeof openContentById === 'function') openContentById(item.id);
}

function searchCardHTML(item){
    const poster = item.poster || item.backdrop || '';
    const title = item.title || item.name || 'Untitled';
    const rating = item.rating || item.score || '';
    const badge = item.badge || (item.limitedFree ? 'Limited Free' : '');
    return `
      <article class="search-card" onclick="openSearchResultPlayer('${encodeURIComponent(String(item.id))}')">
        <div class="search-card-poster">
          <img src="${escapeHtml(poster)}" loading="lazy" alt="${escapeHtml(title)}" onerror="this.style.opacity='.25'">
          ${badge ? `<span class="search-card-free">${escapeHtml(badge)}</span>` : ''}
          ${rating ? `<span class="search-card-rating">★ ${escapeHtml(rating)}</span>` : ''}
        </div>
        <div class="search-card-title">${escapeHtml(title)}</div>
        <button class="search-card-watch" onclick="event.stopPropagation();openSearchResultPlayer('${encodeURIComponent(String(item.id))}')">Watch now</button>
      </article>`;
}

let currentSearchFilter = 'all';
let advancedSearchFilters = {type:'', category:'', year:'', language:''};

function renderSearchPage(){
    const query=getSearchFromUrl().trim(); if(!query) return false;
    document.body.classList.add('search-mode');
    const homeLoader = $('loader'); if(homeLoader) homeLoader.classList.add('hide');
    document.title='Search: '+query+' - Anime Box';
    const searchInputEl=$('searchInput'); if(searchInputEl) searchInputEl.value=query;
    const title=$('searchPageTitle'); const count=$('searchPageCount'); const grid=$('searchPageGrid'); const tabs=$('searchPageTabs'); const crumb=$('searchPageCrumb');
    if(!title || !count || !grid) return true;
    title.textContent='Search Results for "'+query+'"';
    if(crumb) crumb.textContent='Search results for "'+query+'"';
    if(tabs && !tabs.dataset.ready){
        tabs.dataset.ready='1';
        tabs.querySelectorAll('button').forEach(btn=>{
            btn.addEventListener('click',()=>{
                tabs.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
                btn.classList.add('active');
                currentSearchFilter=btn.dataset.filter || 'all';
                drawSearchResults();
            });
        });
    }
    drawSearchResults(); return true;
}

function drawSearchResults(){
    const query=getSearchFromUrl().trim(); if(!query) return;
    const q=query.toLowerCase();
    let matches=content.filter(item=>{ const text=[item.title,item.name,item.type,item.category,item.genre,item.language,item.lang,item.tags,item.description,item.overview,item.country,item.year].filter(Boolean).join(' ').toLowerCase(); return text.includes(q); });
    if(currentSearchFilter!=='all') matches=matches.filter(item=>normalizeType(item.type)===currentSearchFilter);
    const af=advancedSearchFilters;
    if(af.type) matches=matches.filter(item=>normalizeType(item.type)===af.type);
    if(af.category) matches=matches.filter(item=>String(item.category||'').trim().toLowerCase()===af.category.toLowerCase());
    if(af.year) matches=matches.filter(item=>String(item.year||item.releaseYear||'')===String(af.year));
    if(af.language) matches=matches.filter(item=>String(item.language||item.lang||item.audioLanguage||'').trim().toLowerCase()===af.language.toLowerCase());
    const count=$('searchPageCount'); const grid=$('searchPageGrid');
    if(count) count.textContent=matches.length+' result'+(matches.length===1?'':'s');
    grid.innerHTML=matches.length ? matches.map(searchCardHTML).join('') : '<div class="search-page-empty">No results found for "'+escapeHtml(query)+'".</div>';
}

function openCategoryPage(type){
    const clean = String(type || '').toLowerCase().trim(); if(!clean) return;
    const norm = normalizeType(clean); if(!isTypeValid(norm)) return;
    const url = '#/home?category=' + encodeURIComponent(norm);
    if(window.location.hash !== url) history.pushState({}, '', url);
    const input = $('searchInput'); if(input) input.value = '';
    const results = $('searchResults'); if(results) results.classList.remove('show');
    renderCategoryPage(); window.scrollTo({top:0,behavior:'auto'});
}

function goHome(){
    history.pushState({},'', '#/');
    document.body.classList.remove('search-mode','category-mode','detail-mode');
    document.title='Anime Box';
    const input=$('searchInput'); if(input) input.value='';
    const results=$('searchResults'); if(results) results.classList.remove('show');
    const loader=$('loader'); if(loader) loader.classList.add('hide');
    updateRandomFeedState(); renderAll(); renderCustomTypeSections(); setupRandomFeed();
    window.scrollTo({top:0,behavior:'auto'});
}

function renderCustomTypeSections(){
    const wrap=$('customTypeSections'); if(!wrap) return;
    const custom=types.filter(t => t.enabled !== false && !isBuiltInType(typeKeyOf(t)));
    wrap.innerHTML=custom.map(t=>{
        const key=typeKeyOf(t);
        const items=content.filter(c=>normalizeType(c.type)===key);
        return `<div class="section custom-type-section" id="type-section-${escapeHtml(key)}">
            <div class="section-head"><h2><span class="dot"></span>${escapeHtml(t.name)}</h2>
            <button class="home-more" onclick="openCategoryPage('${escapeHtml(key)}')">More ›</button></div>
            <div class="type-row-wrap"><div class="type-row">${items.length?items.map(cardHTML).join(''):'<div class="empty-state">No titles found.</div>'}</div></div>
        </div>`;
    }).join('');
}

function renderCategoryPage(){
    const type=normalizeType(getCategoryFromUrl()); if(!isTypeValid(type)) return false;
    document.body.classList.add('category-mode');
    const homeLoader = $('loader'); if(homeLoader) homeLoader.classList.add('hide');
    const title = typeDisplayName(type); document.title = title + ' - Anime Box';
    const titleEl=$('categoryTitle'); const countEl=$('categoryCount'); const grid=$('categoryGrid'); const tabs=$('categoryTabs');
    titleEl.textContent=title;
    let items=content.filter(x=>normalizeType(x.type)===type);
    const cats=[...new Set(items.map(x=>String(x.category||'').trim()).filter(Boolean))];
    tabs.innerHTML = `<button class="active" data-cat="all">All</button>` + cats.map(c=>`<button data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('');
    const draw=(cat='all')=>{
        let list=items;
        if(cat!=='all') list=items.filter(x=>String(x.category||'').trim()===cat);
        countEl.textContent=list.length + ' titles';
        grid.innerHTML=list.length ? list.map(cardHTML).join('') : `<div class="category-empty">No ${escapeHtml(title)} found.</div>`;
    };
    tabs.querySelectorAll('button').forEach(btn=>{ btn.addEventListener('click',()=>{ tabs.querySelectorAll('button').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); draw(btn.dataset.cat); }); });
    draw('all'); return true;
}

function getDetailIdFromUrl(){ const route=parseAppRoute(); const item=route.type==='detail' ? findContentByRouteSlug(route.slug) : null; return item ? item.id : ''; }
function loadSingleDetailIfNeeded(){ const route=parseAppRoute(); if(route.type!=='detail') return false; const item=findContentByRouteSlug(route.slug); if(!item) return false; openContentById(item.id,true,route); return true; }

if(loadSingleDetailIfNeeded()){}
if(getSearchFromUrl() || getCategoryFromUrl() || parseAppRoute().type==='detail'){ const homeLoader = $('loader'); if(homeLoader) homeLoader.classList.add('hide'); }

db.ref('content').on('value', snap => {
    content = shuffleForRefresh(sortByOrder(onlyEnabled(toArray(snap.val()))));
    if(renderSearchPage()) return;
    if(renderCategoryPage()) return;
    updateRandomFeedState(); renderAll(); renderCustomTypeSections(); setupRandomFeed();
    if(parseAppRoute().type === 'detail') handleAppRoute();
    requestAnimationFrame(() => {
        const sentinel = $('randomFeedSentinel');
        const hasNew = getRandomFeedPool().some(item => !randomFeedUsed.has(item.id));
        if(sentinel && hasNew && sentinel.getBoundingClientRect().top < window.innerHeight + 1000) loadRandomFeed();
    });
    $('loader').classList.add('hide');
});

const sidebar = $('sidebar'); const overlay = $('sidebarOverlay'); const hamburger = $('hamburgerBtn');
function toggleSidebar(open){ const shouldOpen = open !== undefined ? open : !sidebar.classList.contains('open'); sidebar.classList.toggle('open', shouldOpen); overlay.classList.toggle('open', shouldOpen); document.body.style.overflow = shouldOpen ? 'hidden' : ''; }
hamburger.addEventListener('click', () => toggleSidebar());
overlay.addEventListener('click', () => toggleSidebar(false));

const sidebarNavEl = $('sidebarNav');
if(sidebarNavEl){
    sidebarNavEl.addEventListener('click', (e) => {
        const link = e.target.closest('a[data-section]'); if(!link || !sidebarNavEl.contains(link)) return;
        e.preventDefault();
        const target = link.dataset.section;
        sidebarNavEl.querySelectorAll('a').forEach(a => a.classList.remove('active'));
        link.classList.add('active');
        if(target === 'home'){ goHome(); }
        else if(target === 'movies'){ openCategoryPage('movie'); }
        else if(target === 'tvshows'){ openCategoryPage('tv'); }
        else if(target === 'anime'){ openCategoryPage('anime'); }
        else if(['trending','continueWatching','watchHistory','myList'].includes(target)){ goHome(); setTimeout(() => { const el = $(target); if(el) el.scrollIntoView({behavior:'smooth', block:'start'}); }, 80); }
        else { openCategoryPage(target); }
        if(window.innerWidth <= 820) toggleSidebar(false);
    });
}

function renderHero(){
    const el = $('heroSection');
    if(!heroSlides.length){ el.innerHTML = `<div class="empty-state" style="padding-top:80px;">No hero slides published yet.</div>`; return; }
    if(heroIndex >= heroSlides.length) heroIndex = 0;
    el.innerHTML = heroSlides.map((s, i) => `
        <div class="hero-slide ${i === heroIndex ? 'active' : ''}" style="background-image:url('${s.image || ''}')">
            <div class="hero-content">
                <div class="hero-poster-card">
                    <img src="${s.image || s.poster || ''}" alt="${s.title || 'Poster'}" onerror="this.style.opacity='.4'">
                </div>
                <div class="hero-text-block">
                    <div class="hero-badge"><span class="html-icon html-icon-fire">◆</span> Now Playing</div>
                    <h1>${s.title || ''}</h1>
                    <div class="hero-meta">
                        <span class="meta-chip">▣ ${s.category || 'Movie'}</span>
                        <span>★ ${s.rating || '7.0'}</span>
                        <span class="meta-chip">${s.year || '2025'}</span>
                        <span class="dot-sep">•</span>
                        <span>${s.language || 'Hindi'}</span>
                        <span class="dot-sep">•</span>
                        <span>${s.genre || 'Action'}</span>
                    </div>
                    <p>${s.subtitle || 'Watch the latest blockbuster now in HD quality.'}</p>
                    <div class="hero-actions">
                        <button class="btn btn-primary" onclick="openContentById('${s.link || ''}')">▶ Watch Now</button>
                    </div>
                </div>
            </div>
        </div>
    `).join('') + `
        <button class="hero-arrow left" onclick="heroNav(-1)">‹</button>
        <button class="hero-arrow right" onclick="heroNav(1)">›</button>
        <div class="hero-dots">${heroSlides.map((_, i) => `<div class="hero-dot ${i === heroIndex ? 'active' : ''}" onclick="heroGo(${i})"></div>`).join('')}</div>
    `;
    restartHeroTimer();
}
function heroNav(dir){ heroGo((heroIndex + dir + heroSlides.length) % heroSlides.length); }
function heroGo(i){ heroIndex = i; renderHero(); }
function restartHeroTimer(){ clearInterval(heroTimer); if(heroSlides.length > 1) heroTimer = setInterval(() => heroNav(1), 6000); }

function renderBanner(){
    const el = $('bannerStrip');
    if(!banners.length){ el.style.display = 'none'; return; }
    el.style.display = 'block';
    if(bannerIndex >= banners.length) bannerIndex = 0;
    el.innerHTML = banners.map((b, i) => `
        <div class="banner-slide ${i === bannerIndex ? 'active' : ''}" style="background-image:url('${b.image || ''}')" onclick="openContentById('${b.link || ''}')"></div>
    `).join('');
    clearInterval(bannerTimer);
    if(banners.length > 1){ bannerTimer = setInterval(() => { bannerIndex = (bannerIndex + 1) % banners.length; renderBanner(); }, 4500); }
}

function renderCategoryTabs(){
    const catNames = categories.map(c => c.name);
    buildTabs('movieCatTabs', catNames, activeMovieCat, (c)=>{ activeMovieCat = c; renderGrids(); });
    buildTabs('tvCatTabs', catNames, activeTvCat, (c)=>{ activeTvCat = c; renderGrids(); });
    buildTabs('animeCatTabs', catNames, activeAnimeCat, (c)=>{ activeAnimeCat = c; renderGrids(); });
}
function buildTabs(containerId, catNames, active, onClick){
    const el = $(containerId); if(!el) return;
    const all = ['all', ...catNames];
    el.innerHTML = all.map(c => `<button class="tab-btn ${c === active ? 'active' : ''}" data-cat="${c}">${c === 'all' ? 'All' : c}</button>`).join('');
    el.querySelectorAll('.tab-btn').forEach(btn => { btn.addEventListener('click', () => onClick(btn.dataset.cat)); });
}

function cardHTML(item){
    const language = item.language || item.lang || item.audioLanguage || 'Hindi';
    const releaseRaw = item.year || item.releaseYear || item.releaseDate || item.release || item.date || '';
    const yearMatch = String(releaseRaw).match(/\b(19|20)\d{2}\b/);
    const year = yearMatch ? yearMatch[0] : '';
    const badge = item.badge || (item.limitedFree ? 'Limited Free' : 'DUAL AUDIO');
    const quality = item.quality || item.resolution || item.videoQuality || 'HD';
    const ratingRaw = item.rating ?? item.score ?? '';
    const rating = ratingRaw !== '' && !Number.isNaN(Number(ratingRaw)) ? Number(ratingRaw).toFixed(1) : '';
    const typeRaw = String(item.type || 'movie').trim().toLowerCase();
    const typeLabel = (typeRaw === 'tv' || typeRaw === 'tv show' || typeRaw === 'tvshow' || typeRaw === 'series') ? 'TV' : (typeRaw ? typeRaw.charAt(0).toUpperCase() + typeRaw.slice(1) : 'Movie');
    const coming = item.comingSoon === true || String(item.comingSoon).toLowerCase() === 'true';
    const poster = item.poster || item.backdrop || '';
    const title = item.title || item.name || 'Untitled';
    const views = getRandomViewFor(item);
    return `
        <div class="simple-card" onclick="openSearchResultPlayer('${encodeURIComponent(String(item.id))}')">
            <div class="simple-card-poster">
                <img src="${escapeHtml(poster)}" loading="lazy" alt="${escapeHtml(title)}" onerror="this.style.display='none';this.parentElement.classList.add('no-image')">
                <div class="simple-badges-on-poster">
                    ${badge ? `<span class="simple-badge badge-main">${escapeHtml(badge)}</span>` : ''}
                    ${language ? `<span class="simple-badge badge-lang">${escapeHtml(language)}</span>` : ''}
                    ${year ? `<span class="simple-badge badge-date">${escapeHtml(year)}</span>` : ''}
                </div>
                <span class="simple-quality">${escapeHtml(quality)}</span>
                <button type="button" class="simple-view-btn" title="Views" onclick="event.stopPropagation();incrementView(this)">
                    <span class="html-icon" style="width:auto;min-width:0;height:auto;font-size:9px;color:#fbbf24;filter:none;">◉</span>
                    <span class="view-count">${escapeHtml(views)}</span>
                </button>
                ${coming ? '<span class="simple-coming">Coming Soon</span>' : ''}
                ${rating ? `<span class="simple-rating">★ ${escapeHtml(rating)}</span>` : ''}
                <span class="simple-type">${escapeHtml(typeLabel)}</span>
            </div>
            <div class="simple-card-info">
                <div class="simple-title">${escapeHtml(title)}</div>
            </div>
        </div>
    `;
}

function renderAll(){ renderTrending(); renderGrids(); renderCustomTypeSections(); renderContinueWatching(); }
function renderTrending(){ const row = $('trendingRow'); const items = content.filter(c => c.trending); row.innerHTML = items.length ? items.map(cardHTML).join('') : `<div class="empty-state">No trending titles right now.</div>`; }
function renderGrids(){ renderTypeGrid('movie', 'moviesGrid', activeMovieCat); renderTypeGrid('tv', 'tvGrid', activeTvCat); renderTypeGrid('anime', 'animeGrid', activeAnimeCat); }
function renderTypeGrid(type, gridId, cat){ let items = content.filter(c => c.type === type); if(cat && cat !== 'all') items = items.filter(c => c.category === cat); const el = $(gridId); if(!el) return; el.innerHTML = items.length ? items.map(cardHTML).join('') : `<div class="empty-state">No titles found.</div>`; }

let randomFeedUsed = new Set(); let randomFeedLoading = false; let randomFeedFinished = false; let randomFeedStarted = false; let randomFeedObserver = null;
const RANDOM_BATCH_SIZE = 8;
function randomShuffle(arr){ const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
function getRandomFeedPool(){ return content.filter(item => { const type = String(item.type || '').trim().toLowerCase().replace(/[_-]+/g,' ').replace(/\s+/g,' '); return ['anime','movie','tv','tv show','tvshow','series'].includes(type); }); }
function updateRandomFeedState(){ const pool = getRandomFeedPool(); const hasUnused = pool.some(item => !randomFeedUsed.has(item.id)); if(hasUnused){ randomFeedFinished = false; const loader = $('randomFeedLoader'); if(loader && !randomFeedLoading) loader.innerHTML = '<span class="rf-dot"></span><span class="rf-dot"></span><span class="rf-dot"></span><span>Scroll down for more</span>'; } else if(pool.length && !randomFeedLoading){ randomFeedFinished = true; const loader = $('randomFeedLoader'); if(loader) loader.innerHTML = '<span>All available titles have been shown.</span>'; } }
function loadRandomFeed(){
    const grid = $('randomFeedGrid'); const loader = $('randomFeedLoader'); if(!grid || randomFeedLoading) return;
    const pool = getRandomFeedPool(); if(!pool.length){ randomFeedFinished = true; if(loader) loader.innerHTML = '<span>Waiting for Anime, Movie or TV Show from Admin...</span>'; return; }
    let available = pool.filter(item => !randomFeedUsed.has(item.id)); if(!available.length){ randomFeedFinished = true; if(loader) loader.innerHTML = '<span>All available titles have been shown.</span>'; return; }
    randomFeedLoading = true; randomFeedFinished = false;
    if(loader) loader.innerHTML = '<span class="rf-dot"></span><span class="rf-dot"></span><span class="rf-dot"></span><span>Loading more titles...</span>';
    setTimeout(() => {
        available = getRandomFeedPool().filter(item => !randomFeedUsed.has(item.id));
        const batch = randomShuffle(available).slice(0, RANDOM_BATCH_SIZE);
        batch.forEach(item => randomFeedUsed.add(item.id));
        if(batch.length) grid.insertAdjacentHTML('beforeend', batch.map(cardHTML).join(''));
        randomFeedLoading = false; updateRandomFeedState();
        requestAnimationFrame(() => { const sentinel = $('randomFeedSentinel'); const moreAvailable = getRandomFeedPool().some(item => !randomFeedUsed.has(item.id)); if(sentinel && moreAvailable && sentinel.getBoundingClientRect().top < window.innerHeight + 250) loadRandomFeed(); });
    }, 180);
}
function setupRandomFeed(){ const sentinel = $('randomFeedSentinel'); if(!sentinel || randomFeedStarted) return; randomFeedStarted = true; if('IntersectionObserver' in window){ randomFeedObserver = new IntersectionObserver(entries => { if(entries.some(entry => entry.isIntersecting)) loadRandomFeed(); }, {root:null, rootMargin:'0px 0px 900px 0px', threshold:0}); randomFeedObserver.observe(sentinel); } else { window.addEventListener('scroll', () => { if(window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 900) loadRandomFeed(); }, {passive:true}); } loadRandomFeed(); }

const searchInput = $('searchInput'); const searchResults = $('searchResults');
searchInput.addEventListener('keydown', (e) => { if(e.key === 'Enter'){ e.preventDefault(); e.stopPropagation(); const q = searchInput.value.trim(); if(q) openSearchPage(q); } });
searchInput.addEventListener('focus', () => { if(!searchInput.value.trim()) searchResults.classList.remove('show'); });
searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    if(!q){ searchResults.innerHTML = ''; searchResults.classList.remove('show'); return; }
    const matches = content.filter(c => { const title = String(c.title || c.name || '').trim().toLowerCase(); return title && title.includes(q); }).slice(0, 12);
    searchResults.innerHTML = matches.length ? matches.map(m => { const id = encodeURIComponent(String(m.id)); const title = escapeHtml(m.title || m.name || 'Untitled'); return `<div class="search-item" onclick="selectSearchResult('${id}')"><div class="si-info"><b>${title}</b></div></div>`; }).join('') : `<div class="search-empty">No results for "${escapeHtml(q)}"</div>`;
    searchResults.classList.add('show');
});
document.addEventListener('click', (e) => { if(!$('searchWrap').contains(e.target)) searchResults.classList.remove('show'); });
function selectSearchResult(encodedId){ const id = decodeURIComponent(String(encodedId || '')); const item = content.find(x => String(x.id) === String(id)); searchResults.classList.remove('show'); if(item){ const q = item.title || item.name || ''; openSearchPage(q); } }

function renderContinueWatching(){
    const section = $('continueWatching'), row = $('continueWatchingRow');
    if(!content.length){ section.style.display = 'none'; return; }
    let entries = safeStorage.keys().filter(k => k.startsWith('sb_progress::')).map(k => { try { return JSON.parse(safeStorage.getItem(k)); } catch(e) { return null; } }).filter(e => e && e.duration && e.time > 5 && e.time < e.duration - 15);
    entries.sort((a,b) => b.updatedAt - a.updatedAt); entries = entries.slice(0, 15);
    const cards = entries.map(e => {
        const item = content.find(c => c.id === e.itemId); if(!item) return '';
        const pct = Math.min(100, (e.time / e.duration) * 100);
        return `<div class="card" onclick="resumeFromContinue('${item.id}','${e.episodeId || ''}')"><div class="poster-wrap"><img src="${item.poster || ''}" loading="lazy" alt="${item.title || ''}" /><div class="overlay"><div class="play-btn">▶</div></div><div class="cw-progress"><i style="width:${pct}%"></i></div></div><div class="title">${item.title || ''}</div><div class="meta">${item.year || ''} ${item.category ? '• ' + item.category : ''}</div></div>`;
    }).filter(Boolean).join('');
    if(!cards){ section.style.display = 'none'; return; }
    row.innerHTML = cards; section.style.display = 'block';
}
function resumeFromContinue(itemId, episodeId){ const item=content.find(c=>String(c.id)===String(itemId)); if(item){ const ep=episodeId?getHistory().find(x=>String(x.itemId)===String(itemId)&&String(x.episodeId)===String(episodeId)):null; openContentById(item.id,false,ep?{episodeSlug:''}:null); } }

const SB_KEYS = { history:'sb_watch_history_v1', favorites:'sb_favorites_v1', autoNext:'sb_auto_next_v1' };
function readJSON(key, fallback){ try{return JSON.parse(safeStorage.getItem(key)||'') ?? fallback}catch(e){return fallback} }
function getHistory(){ const v=readJSON(SB_KEYS.history,[]); return Array.isArray(v)?v:[]; }
function saveHistory(v){ safeStorage.setItem(SB_KEYS.history,JSON.stringify(v.slice(0,100))); }
function addHistory(item,season,episode){ if(!item)return; const h=getHistory().filter(x=>!(String(x.itemId)===String(item.id)&&String(x.episodeId||'')===String(episode?.id||''))); h.unshift({itemId:item.id,episodeId:episode?.id||'',seasonId:season?.id||'',title:item.title||item.name||'',updatedAt:Date.now()}); saveHistory(h); renderWatchHistory(); }
function getFavorites(){ const v=readJSON(SB_KEYS.favorites,[]); return Array.isArray(v)?v:[]; }
function isFavorite(id){ return getFavorites().some(x=>String(x)===String(id)); }
function toggleFavorite(id){ let a=getFavorites(); const i=a.findIndex(x=>String(x)===String(id)); if(i>=0)a.splice(i,1); else a.unshift(String(id)); safeStorage.setItem(SB_KEYS.favorites,JSON.stringify(a)); renderMyList(); refreshFavoriteButtons(id); }
function refreshFavoriteButtons(id){ document.querySelectorAll('[data-favorite-id="'+CSS.escape(String(id))+'"]').forEach(b=>{b.classList.toggle('active',isFavorite(id));b.textContent=isFavorite(id)?'♥':'♡';}); }
function renderWatchHistory(){ const section=$('watchHistory'),row=$('watchHistoryRow'); if(!section||!row)return; const h=getHistory(); const cards=h.map(e=>{const item=content.find(c=>String(c.id)===String(e.itemId));if(!item)return '';return `<div class="card" onclick="openContentById('${item.id}')"><div class="poster-wrap"><img src="${item.poster||''}" loading="lazy" alt=""><div class="overlay"><div class="play-btn">▶</div></div></div><div class="title">${escapeHtml(item.title||'')}</div><div class="meta">${e.title?'EP • '+escapeHtml(e.title):'Watched'}</div></div>`}).filter(Boolean).join(''); row.innerHTML=cards||'<div class="empty" style="width:100%">No watch history yet.</div>'; section.style.display=h.length?'block':'none'; }
function clearWatchHistory(){ safeStorage.removeItem(SB_KEYS.history); renderWatchHistory(); }
function renderMyList(){ const section=$('myList'),row=$('myListRow'); if(!section||!row)return; const fav=getFavorites(); const cards=fav.map(id=>{const item=content.find(c=>String(c.id)===String(id));if(!item)return '';return `<div class="card" onclick="openContentById('${item.id}')"><div class="poster-wrap"><img src="${item.poster||''}" loading="lazy" alt=""><button class="favorite-badge active" data-favorite-id="${item.id}" onclick="event.stopPropagation();toggleFavorite('${item.id}')">♥</button></div><div class="title">${escapeHtml(item.title||'')}</div><div class="meta">${escapeHtml(item.type||'')}</div></div>`}).filter(Boolean).join(''); row.innerHTML=cards||'<div class="empty" style="width:100%">Your My List is empty.</div>'; section.style.display=fav.length?'block':'none'; }
function savePlaybackProgress(){ const v=$('streamVideo'); if(!v||!currentPlaybackItem||!currentPlaybackEpisode||!Number.isFinite(v.duration)||v.duration<=0)return; safeStorage.setItem('sb_progress::'+currentPlaybackItem.id+'::'+currentPlaybackEpisode.id,JSON.stringify({itemId:currentPlaybackItem.id,episodeId:currentPlaybackEpisode.id,seasonId:currentPlaybackSeason?.id||'',time:v.currentTime,duration:v.duration,updatedAt:Date.now()})); addHistory(currentPlaybackItem,currentPlaybackSeason,currentPlaybackEpisode); renderContinueWatching(); }
function getNextEpisode(){ if(!currentPlaybackEpisode)return null; const i=playbackEpisodes.findIndex(e=>String(e.id)===String(currentPlaybackEpisode.id)); return i>=0?playbackEpisodes[i+1]||null:null; }
function playNextEpisode(){ const next=getNextEpisode(); if(!next){ $('playbackMessage').textContent='You reached the end of this season.'; return; } currentPlaybackEpisode=next; renderEpisodePills(next.id); handleEpisodeClick(next); }
function setAutoNext(v){ safeStorage.setItem(SB_KEYS.autoNext,v?'1':'0'); }
function autoNextEnabled(){ return safeStorage.getItem(SB_KEYS.autoNext)!=='0'; }
let firebaseAutoNextSetting=null;
db.ref('settings/playback/autoNext').on('value',snap=>{ if(snap.exists()) firebaseAutoNextSetting=snap.val()!==false; });
function effectiveAutoNextEnabled(){ return firebaseAutoNextSetting===null ? autoNextEnabled() : firebaseAutoNextSetting; }
function applyAdvancedSearch(){ advancedSearchFilters={type:$('advType')?.value||'',category:$('advCategory')?.value||'',year:$('advYear')?.value||'',language:$('advLanguage')?.value||''}; const q=$('searchInput').value.trim(); if(q){ openSearchPage(q); } else { const grid=$('searchPageGrid'); if(grid) drawSearchResults(); }}

let currentPlaybackItem = null; let playbackSeasons = []; let playbackEpisodes = []; let playbackDubs = []; let playbackSources = {}; let currentPlaybackEpisode = null; let currentPlaybackSeason = null; let openedFromWatchUrl = false;

function resetPlaybackUI(){
    $('playbackPanel').style.display = 'none'; $('seasonField').style.display = 'none'; $('episodeField').style.display = 'none'; $('dubField').style.display = 'none'; $('qualityRow').style.display = 'none'; $('qualityRow').innerHTML = ''; $('subtitleNote').style.display = 'none'; $('subtitleNote').textContent = ''; $('playbackMessage').textContent = ''; $('episodePills').innerHTML = ''; $('seasonPills').innerHTML = ''; $('dubPills').innerHTML = ''; $('watchExternalNote').style.display = 'none'; $('videoWrap').classList.remove('show');
    if(typeof hlsInstance !== 'undefined' && hlsInstance){ try{hlsInstance.destroy();}catch(e){} hlsInstance=null; }
    const v = $('streamVideo'); v.pause(); v.removeAttribute('src'); v.load();
    const frame = $('episodeFrame'); if(frame) frame.src = '';
    const tap = $('tapPlay'); if(tap) tap.style.display = 'flex';
    $('modalDetails').style.display = ''; $('modalSocial').style.display = ''; $('modalHero').style.display = 'none'; $('playbackPanel').style.display = 'none'; $('playbackPanel').style.margin = ''; $('playbackPanel').style.padding = '';
    playbackSeasons = []; playbackEpisodes = []; playbackDubs = []; playbackSources = {};
}

function slugifyWatch(value){ return String(value || '').trim().toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
function getSeasonNumber(season, index = 0){ const n = season?.number ?? String(season?.name || '').match(/\d+/)?.[0]; return Number(n) || (index + 1); }
function getEpisodeNumber(episode, index = 0){ const n = episode?.episodeNumber ?? episode?.number ?? String(episode?.title || episode?.name || '').match(/\d+/)?.[0]; return Number(n) || (index + 1); }

function openContentById(id, fromUrl = false, watchState = null){
    if(!id) return;
    const item = content.find(c => String(c.id) === String(id));
    if(!item) return;
    currentPlaybackItem = item;
    const poster = item.poster || item.backdrop || '';
    $('modalDetailPoster').src = poster;
    $('modalTitle').textContent = item.title || item.name || 'Untitled';
    const country = item.country || item.origin || item.region || '';
    const genre = item.genre || item.category || '';
    $('modalMeta').innerHTML = `
        <span>▣ ${item.type ? String(item.type).toUpperCase() : 'MOVIE'}</span>
        ${item.year ? `<span>${escapeHtml(item.year)}</span>` : ''}
        ${item.rating ? `<span>R ${escapeHtml(item.rating)}</span>` : '<span>R</span>'}
        ${country ? `<span>${escapeHtml(country)}</span>` : ''}
        ${genre ? `<span>${escapeHtml(genre)}</span>` : ''}
    `;
    $('modalDesc').innerHTML = `${escapeHtml(item.description || 'No description available.')} <a href="#" class="modal-more" onclick="return false">More ›</a>`;
    const score = parseFloat(item.rating);
    $('modalRatingNumber').textContent = Number.isFinite(score) ? score.toFixed(1) : '6.4';
    $('modalRatingPeople').textContent = `${item.ratingCount || item.votes || 0} people rated`;
    const shareUrl = encodeURIComponent(location.href);
    const shareTitle = encodeURIComponent(item.title || item.name || 'Movie');
    $('socialExternal').href = item.link || item.url || location.href;
    $('socialFacebook').href = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
    $('socialTwitter').href = `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`;
    $('socialLinkedin').href = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
    $('socialTelegram').href = `https://t.me/share/url?url=${shareUrl}&text=${shareTitle}`;
    $('socialReddit').href = `https://www.reddit.com/submit?url=${shareUrl}&title=${shareTitle}`;
    resetPlaybackUI();
    $('modalFavBtn').onclick = () => toggleFavorite(item.id);
    $('modalFavBtn').textContent = isFavorite(item.id) ? '♥ My List' : '♡ My List';
    $('modalPlayBtn').style.display = 'inline-flex';
    $('modalPlayBtn').onclick = () => openPlayback(item);
    $('modalAppBtn').onclick = () => openPlayback(item);
    $('modalTvBtn').onclick = () => openPlayback(item);
    document.body.classList.add('modal-page');
    $('modalBackdrop').classList.add('show');
    if(!fromUrl){ updateAppRoute(item); }
    if(fromUrl && (watchState?.seasonSlug || watchState?.episodeSlug)) openPlayback(item, watchState);
}

function openPlayback(item, watchState = null){
    $('modalDetails').style.display = 'none';
    $('modalSocial').style.display = 'none';
    $('modalHero').style.display = 'none';
    $('playbackPanel').style.display = 'block';
    $('playbackPanel').style.margin = '0';
    $('playbackPanel').style.padding = '18px 28px 28px';
    $('watchPageTitle').textContent = item.title || '';
    if(!watchState){ updateAppRoute(item); }
    else if(watchState.seasonSlug){ updateAppRoute(item, watchState.seasonSlug, watchState.episodeSlug ? String(watchState.episodeSlug).replace(/^ep-?/i,'') : ''); }
    $('watchUrlMeta').innerHTML = `<span class="watch-chip"><span class="html-icon html-icon-film">▣</span> <strong>${escapeHtml(item.title || 'Video')}</strong></span>`;
    $('playbackMessage').textContent = 'Loading playback options…';
    currentPlaybackSeason = null;
    currentPlaybackEpisode = null;
    addHistory(item,null,null);
    renderRandomCardsInPanel();
    loadPlaybackSeasonsFirst(item.id, null);
}

function renderRandomCardsInPanel() {
    const wrap = $('randomCardScrollWrap');
    if (!wrap) return;
    const pool = content.filter(c => { const t = String(c.type || '').toLowerCase().trim(); return t === 'movie' || t === 'tv' || t === 'anime'; });
    const shuffled = randomShuffle(pool).slice(0, 12);
    if (!shuffled.length) { wrap.innerHTML = '<div style="color:#8a7a3a;font-size:12px;padding:10px;">No titles available.</div>'; return; }
    wrap.innerHTML = shuffled.map(item => {
        const poster = item.poster || item.backdrop || '';
        const title = item.title || item.name || 'Untitled';
        const year = item.year || '';
        return `<div class="simple-card" onclick="openSearchResultPlayer('${encodeURIComponent(String(item.id))}')"><div class="simple-card-poster"><img src="${escapeHtml(poster)}" loading="lazy" alt="${escapeHtml(title)}" onerror="this.style.display='none';this.parentElement.classList.add('no-image')"><div class="simple-badges-on-poster">${year ? `<span class="simple-badge badge-date">${escapeHtml(year)}</span>` : ''}</div></div><div class="simple-card-info"><div class="simple-title">${escapeHtml(title)}</div></div></div>`;
    }).join('');
}

function loadPlaybackSeasonsFirst(contentId, watchState = null){
    playbackSeasons = [];
    db.ref(`seasons/${contentId}`).once('value').then(snap => {
        const seasons = sortByOrder(onlyEnabled(toArray(snap.val())));
        playbackSeasons = seasons;
        if(seasons.length){
            $('seasonField').style.display = 'block'; $('episodeField').style.display = 'block'; $('dubField').style.display = 'block';
            renderSeasonPills();
            const wantedSeasonNo = String(watchState?.seasonSlug || '').match(/(\d+)/)?.[1] || '';
            const wantedSeason = wantedSeasonNo ? playbackSeasons.find((ss, i) => String(getSeasonNumber(ss, i)) === wantedSeasonNo) : null;
            const selectedSeasonId = wantedSeason ? wantedSeason.id : playbackSeasons[0]?.id || '';
            currentPlaybackSeason = playbackSeasons.find(ss => String(ss.id) === String(selectedSeasonId)) || null;
            document.querySelectorAll('.season-card').forEach(c => { c.classList.toggle('active', String(c.dataset.seasonId) === String(selectedSeasonId)); });
            loadEpisodesForSeason(selectedSeasonId, watchState?.episodeSlug || '');
            return;
        }
        if(String(currentPlaybackItem?.type || '').toLowerCase() === 'movie'){ loadMovieDubs(contentId); }
        else { $('seasonField').style.display = 'none'; $('episodeField').style.display = 'none'; $('dubField').style.display = 'none'; $('playbackMessage').textContent = 'No seasons have been added by the admin yet.'; }
    }).catch(() => { if(String(currentPlaybackItem?.type || '').toLowerCase() === 'movie'){ loadMovieDubs(contentId); } else $('playbackMessage').textContent = 'Unable to load seasons.'; });
}

function loadMovieDubs(contentId){
    const item = content.find(c => String(c.id) === String(contentId));
    db.ref(`content/${contentId}/dubs`).once('value').then(snap => {
        playbackDubs = sortByOrder(onlyEnabled(toArray(snap.val())));
        $('seasonField').style.display = 'none'; $('episodeField').style.display = 'none';
        $('dubField').style.display = playbackDubs.length ? 'block' : 'none';
        populateDubSelect();
        if(playbackDubs.length){ $('playbackMessage').textContent = 'Select a dub / language to start playback.'; selectPlaybackDub($('dubSelect').value); }
        else { $('playbackMessage').textContent = 'No playable dub has been added by the admin yet.'; }
    }).catch(() => { $('playbackMessage').textContent = 'Unable to load playback options.'; });
}

function renderSeasonPills(activeSeasonId = ''){
    const grid = $('seasonPills'); if (!grid) return;
    grid.innerHTML = playbackSeasons.length ? playbackSeasons.map((s, i) => {
        const seasonNo = getSeasonNumber(s, i);
        const seasonLabel = 'S' + String(seasonNo).padStart(2, '0');
        return `<div class="season-card ${String(s.id) === String(activeSeasonId || playbackSeasons[0]?.id) ? 'active' : ''}" data-season-id="${escapeHtml(s.id)}"><span class="season-number">${seasonLabel}</span><span class="season-name"></span></div>`;
    }).join('') : '<div class="episode-empty">No seasons</div>';
    grid.querySelectorAll('.season-card').forEach(card => {
        card.addEventListener('click', () => {
            grid.querySelectorAll('.season-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            const seasonId = card.dataset.seasonId;
            currentPlaybackSeason = playbackSeasons.find(s => String(s.id) === String(seasonId)) || null;
            if (currentPlaybackItem && currentPlaybackSeason) { updateAppRoute(currentPlaybackItem, getSeasonNumber(currentPlaybackSeason, playbackSeasons.indexOf(currentPlaybackSeason)), ''); }
            loadEpisodesForSeason(seasonId);
        });
    });
}

function loadEpisodesForSeason(seasonId, wantedEpisodeId = ''){
    $('episodeSelect').innerHTML = '<option value="">Loading episodes…</option>'; $('dubSelect').innerHTML = '<option value="">Choose dub / language</option>'; $('episodePills').innerHTML = ''; $('dubPills').innerHTML = '';
    playbackEpisodes = []; playbackDubs = []; playbackSources = {};
    $('videoWrap').classList.remove('show'); $('qualityRow').style.display = 'none'; $('subtitleNote').style.display = 'none';
    if(!seasonId) return;
    db.ref(`episodes/${currentPlaybackItem.id}`).once('value').then(snap => {
        const all = toArray(snap.val());
        playbackEpisodes = sortByOrder(onlyEnabled(all.filter(e => String(e.seasonId || e.season) === String(seasonId))));
        renderEpisodePills();
        if(playbackEpisodes.length){
            currentPlaybackSeason = playbackSeasons.find(s => String(s.id) === String(seasonId)) || currentPlaybackSeason;
            const wantedEpNo = String(wantedEpisodeId || '').match(/x(\d+)$/)?.[1] || '';
            const wantedEpisode = wantedEpNo ? playbackEpisodes.find((e, i) => String(getEpisodeNumber(e, i)) === wantedEpNo) : null;
            const episode = wantedEpisode || playbackEpisodes[0];
            currentPlaybackEpisode = episode; renderEpisodePills(episode.id); $('watchExternalNote').style.display = 'block'; loadDubsForEpisode(episode.id);
        } else { $('playbackMessage').textContent = 'No episodes have been added to this season yet.'; }
    }).catch(() => { $('playbackMessage').textContent = 'Unable to load episodes.'; });
}

function renderEpisodePills(activeEpisodeId = ''){
    const row = $('episodePills');
    row.innerHTML = playbackEpisodes.length ? playbackEpisodes.map((e, i) => {
        let epNum = e.episodeNumber ?? e.number ?? (i + 1);
        const epLabel = 'EP' + String(epNum).padStart(2, '0');
        return `<div class="episode-card ${String(e.id) === String(activeEpisodeId || playbackEpisodes[0]?.id) ? 'active' : ''}" data-episode-id="${escapeHtml(e.id)}"><span class="episode-number">${epLabel}</span><span class="episode-name"></span></div>`;
    }).join('') : '<div class="episode-empty">No episodes</div>';
    row.querySelectorAll('.episode-card').forEach(card => {
        card.addEventListener('click', () => {
            row.querySelectorAll('.episode-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            const episode = playbackEpisodes.find(e => e.id === card.dataset.episodeId);
            if(episode){ currentPlaybackEpisode = episode; currentPlaybackSeason = playbackSeasons.find(s => String(s.id) === String(episode.seasonId || episode.season)) || currentPlaybackSeason; handleEpisodeClick(episode); }
        });
    });
}

let hlsInstance = null;
function handleEpisodeClick(episode){
    currentPlaybackEpisode = episode;
    const seasonNo = currentPlaybackSeason ? getSeasonNumber(currentPlaybackSeason, playbackSeasons.indexOf(currentPlaybackSeason)) : '';
    const epNo = episode ? getEpisodeNumber(episode, playbackEpisodes.indexOf(episode)) : '';
    if(currentPlaybackItem) updateAppRoute(currentPlaybackItem, seasonNo, epNo);
    $('playbackMessage').textContent = 'Loading video…';
    resetPlayerOnly();
    loadDubsForEpisode(episode.id);
}
function resetPlayerOnly(){ if(hlsInstance){ try{hlsInstance.destroy();}catch(e){} hlsInstance = null; } const v = $('streamVideo'); v.pause(); v.removeAttribute('src'); v.load(); $('videoWrap').classList.remove('show'); const frame = $('episodeFrame'); frame.src = ''; frame.style.display = 'none'; $('tapPlay').style.display = 'flex'; }
function playVideoSource(url){
    const clean = String(url || '').trim(); if(!clean || !/^https?:\/\//i.test(clean)){ $('playbackMessage').textContent = 'Invalid video URL.'; return false; }
    const video = $('streamVideo'); const frame = $('episodeFrame'); const tap = $('tapPlay'); const lower = clean.split('?')[0].toLowerCase();
    if(hlsInstance){ try{hlsInstance.destroy();}catch(e){} hlsInstance = null; }
    frame.src = ''; frame.style.display = 'none';
    if(lower.endsWith('.m3u8')){
        $('videoWrap').classList.add('show'); tap.style.display = 'none';
        if(video.canPlayType('application/vnd.apple.mpegurl')) video.src = clean;
        else {
            const startHls = () => { if(window.Hls && window.Hls.isSupported()){ hlsInstance = new window.Hls({ enableWorker: true }); hlsInstance.loadSource(clean); hlsInstance.attachMedia(video); hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, () => { video.play().catch(()=>{}); }); } else $('playbackMessage').textContent = 'This browser cannot play the M3U8 video.'; };
            if(window.Hls) startHls();
            else { const sc=document.createElement('script'); sc.src='https://cdn.jsdelivr.net/npm/hls.js@latest'; sc.onload=startHls; sc.onerror=()=>{$('playbackMessage').textContent='Unable to load video player.'}; document.head.appendChild(sc); }
        }
        video.play().catch(()=>{}); return true;
    }
    if(/\.(mp4|webm|ogg)(\?.*)?$/i.test(clean)){ $('videoWrap').classList.add('show'); tap.style.display = 'none'; video.src = clean; video.load(); video.play().catch(()=>{}); return true; }
    frame.src = clean; frame.style.display = 'block'; tap.style.display = 'none'; return true;
}
function loadPlayerUrl(url){ return playVideoSource(url); }

function loadDubsForEpisode(episodeId){
    $('dubSelect').innerHTML = '<option value="">Loading dubs…</option>'; playbackDubs = []; playbackSources = {};
    if(!episodeId) return;
    db.ref(`episodes/${currentPlaybackItem.id}/${episodeId}/dubs`).once('value').then(snap => {
        playbackDubs = sortByOrder(onlyEnabled(toArray(snap.val())));
        populateDubSelect(); renderDubPills();
        if(playbackDubs.length) selectPlaybackDub(playbackDubs[0].id);
    }).catch(() => { $('playbackMessage').textContent = 'Unable to load dubs.'; });
}
function populateDubSelect(){ $('dubSelect').innerHTML = playbackDubs.length ? playbackDubs.map(d => `<option value="${d.id}">${escapeHtml(d.name || 'Default')}</option>`).join('') : '<option value="">No dub / language</option>'; }
function renderDubPills(){
    const row = $('dubPills');
    row.innerHTML = playbackDubs.length ? playbackDubs.map((d, i) => `<button type="button" class="server-item ${i === 0 ? 'active' : ''}" data-dub-id="${escapeHtml(d.id)}">SERVER ${i + 1}<small>${escapeHtml(d.name || 'MULTICLOUD')}</small></button>`).join('') : '';
    row.querySelectorAll('.server-item').forEach(btn => {
        btn.addEventListener('click', () => { row.querySelectorAll('.server-item').forEach(b => b.classList.remove('active')); btn.classList.add('active'); $('dubSelect').value = btn.dataset.dubId; selectPlaybackDub(btn.dataset.dubId); });
    });
}
function selectPlaybackDub(dubId){
    const dub = playbackDubs.find(d => String(d.id) === String(dubId));
    if(!dub){ $('playbackMessage').textContent = 'No playable server has been added.'; return; }
    let url = '';
    if(dub.sources && typeof dub.sources === 'object'){ const preferred = ['1080p','720p','480p','360p','auto','4K']; for(const q of preferred){ if(dub.sources[q]){ url = String(dub.sources[q]).trim(); break; } } if(!url){ const first = Object.values(dub.sources).find(Boolean); if(first) url = String(first).trim(); } }
    url = url || String(dub.url || dub.src || dub.videoUrl || dub.streamUrl || '').trim();
    if(url && /^https?:\/\//i.test(url)){ playVideoSource(url); $('playbackMessage').textContent = ''; }
    else { const fallback = String(currentPlaybackEpisode?.websiteUrl || currentPlaybackEpisode?.externalUrl || currentPlaybackEpisode?.watchUrl || currentPlaybackEpisode?.url || '').trim(); if(fallback) playVideoSource(fallback); else $('playbackMessage').textContent = 'No video source has been added for this server.'; }
}

$('tapPlay').addEventListener('click', () => {
    if(currentPlaybackEpisode){
        if(playbackDubs.length) selectPlaybackDub(playbackDubs[0].id);
        else { const url = String(currentPlaybackEpisode.websiteUrl || currentPlaybackEpisode.externalUrl || currentPlaybackEpisode.watchUrl || currentPlaybackEpisode.url || '').trim(); if(url) playVideoSource(url); else $('playbackMessage').textContent = 'No video source has been added for this episode.'; }
    }
});

$('streamVideo').addEventListener('timeupdate', savePlaybackProgress);
$('streamVideo').addEventListener('pause', savePlaybackProgress);
$('streamVideo').addEventListener('ended', () => { savePlaybackProgress(); if(effectiveAutoNextEnabled()) setTimeout(playNextEpisode,250); });

$('seasonSelect').addEventListener('change', e => { currentPlaybackSeason = playbackSeasons.find(s => String(s.id) === String(e.target.value)) || null; if(currentPlaybackItem && currentPlaybackSeason) updateAppRoute(currentPlaybackItem, getSeasonNumber(currentPlaybackSeason, playbackSeasons.indexOf(currentPlaybackSeason)), ''); loadEpisodesForSeason(e.target.value); });
$('episodeSelect').addEventListener('change', e => loadDubsForEpisode(e.target.value));
$('dubSelect').addEventListener('change', e => selectPlaybackDub(e.target.value));
$('modalClose').addEventListener('click', closeModal);
const autoNextToggle=$('autoNextToggle'); if(autoNextToggle){ autoNextToggle.checked=autoNextEnabled(); autoNextToggle.addEventListener('change',e=>setAutoNext(e.target.checked)); }
const advToggle=$('advancedSearchToggle'); if(advToggle) advToggle.addEventListener('click',()=>{$('advancedSearchPanel').classList.toggle('show');});
['advType','advCategory','advYear','advLanguage'].forEach(id=>{const el=$(id);if(el)el.addEventListener('change',applyAdvancedSearch);});

$('modalBackdrop').addEventListener('click', (e) => { if(e.target.id === 'modalBackdrop') closeModal(); });

function closeModal(updateRoute = true){
    const v = $('streamVideo'); v.pause(); v.removeAttribute('src'); v.load();
    $('modalBackdrop').classList.remove('show'); document.body.classList.remove('modal-page'); resetPlaybackUI(); currentPlaybackItem = null;
    if(updateRoute && (parseAppRoute().type === 'detail' || document.body.classList.contains('modal-page'))){ history.pushState({},'', '#/'); }
}

const sections = ['home', 'trending', 'continueWatching', 'movies', 'tvshows', 'anime'];
function updateActiveNav(){ const scrollY = window.scrollY + 120; let activeId = 'home'; for(const id of sections){ const el = $(id); if(el){ const rect = el.getBoundingClientRect(); const top = rect.top + window.scrollY; if(scrollY >= top - 60) activeId = id; } } document.querySelectorAll('.sidebar-nav a').forEach(link => { link.classList.toggle('active', link.dataset.section === activeId); }); }
window.addEventListener('scroll', updateActiveNav);
window.addEventListener('load', updateActiveNav);

db.ref('content').on('value', () => renderContinueWatching());

console.log('Anime Box — Hero slider redesigned: card inline with text, smaller text.');
