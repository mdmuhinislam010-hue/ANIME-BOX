
/* ===== Original inline script 1 ===== */
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

        // ===== Admin Web Manager live sync (Firebase Realtime Database) =====
        // Admin panel saves to: settings/webManager
        (function initWebManagerLiveSync() {
            const webManagerRef = db.ref('settings/webManager');
            let configuredTabTitle = '';

            function applyWebManagerSettings(settings) {
                if (!settings || typeof settings !== 'object') return;

                const title = typeof settings.tabTitle === 'string' ? settings.tabTitle.trim() : '';
                if (title) {
                    configuredTabTitle = title;
                    if (document.title !== configuredTabTitle) document.title = configuredTabTitle;
                }

                const faviconUrl = typeof settings.faviconUrl === 'string' ? settings.faviconUrl.trim() : '';
                if (faviconUrl) {
                    let iconLinks = Array.from(document.querySelectorAll('link[rel~="icon"]'));
                    if (!iconLinks.length) {
                        const link = document.createElement('link');
                        link.rel = 'icon';
                        document.head.appendChild(link);
                        iconLinks = [link];
                    }
                    iconLinks.forEach(link => {
                        link.href = faviconUrl;
                        link.type = 'image/png';
                    });
                }

                const homeName = typeof settings.homeName === 'string' ? settings.homeName.trim() : '';
                if (homeName) {
                    document.querySelectorAll('.sidebar-brand .logo-text').forEach(el => {
                        el.textContent = homeName;
                    });
                    // Keep the website name in the sidebar and accessible logo labels in sync.
                    document.querySelectorAll('.sidebar-brand .logo-img, .header-left .logo-img').forEach(img => {
                        img.alt = homeName + ' Logo';
                    });
                }

                const homeLogoUrl = typeof settings.homeLogoUrl === 'string' ? settings.homeLogoUrl.trim() : '';
                if (homeLogoUrl) {
                    document.querySelectorAll('.sidebar-brand .logo-img, .header-left .logo-img').forEach(img => {
                        img.src = homeLogoUrl;
                    });
                }

                if (typeof settings.showHomeLogo === 'boolean') {
                    document.querySelectorAll('.sidebar-brand .logo-img, .header-left .logo-img').forEach(img => {
                        img.style.display = settings.showHomeLogo ? '' : 'none';
                    });
                }
            }

            // If app navigation changes document.title, keep the Admin-selected tab title active.
            const titleObserver = new MutationObserver(() => {
                if (configuredTabTitle && document.title !== configuredTabTitle) {
                    document.title = configuredTabTitle;
                }
            });
            titleObserver.observe(document.querySelector('title'), { childList: true, characterData: true, subtree: true });

            webManagerRef.on('value', snapshot => {
                applyWebManagerSettings(snapshot.val());
            }, error => {
                console.warn('Web Manager settings could not be loaded:', error.message || error);
            });
        })();
        // ===== End Web Manager live sync =====


        let heroSlides = [];
        let banners = [];
        let categories = [];
        let types = [];
        let content = [];
        // Keep direct detail links in place while Firebase is still loading content.
        let contentDataLoaded = false;
        let heroIndex = 0, bannerIndex = 0;
        let heroRandomized = false;
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
        let adminTypeLabels = {movie:'Movie', tv:'TV Show', anime:'Anime'};
        function typeDisplayName(key){ const built={movie:adminTypeLabels.movie||'Movie',tv:adminTypeLabels.tv||'TV Show',anime:adminTypeLabels.anime||'Anime'}; if(built[key]) return built[key]; const t=types.find(x=>(x.key||normalizeType(x.name))===key); return t?.name || key; }
        function applyAdminTypeLabels(labels){
            adminTypeLabels=Object.assign({movie:'Movie',tv:'TV Show',anime:'Anime'},labels||{});
            const setNav=(section,label)=>{const a=document.querySelector(`#sidebarNav a[data-section="${section}"]`);if(a){const icon=a.querySelector('.nav-icon');a.textContent='';if(icon)a.appendChild(icon);a.appendChild(document.createTextNode(' '+label));}};
            setNav('movies',adminTypeLabels.movie+'s');
            setNav('tvshows',adminTypeLabels.tv==='TV Show'?'TV Shows':adminTypeLabels.tv);
            setNav('anime',adminTypeLabels.anime);
            const heading=(id,label)=>{const h=document.querySelector('#'+id+' .section-head h2');if(h){const dot=h.querySelector('.dot');h.textContent='';if(dot)h.appendChild(dot);h.appendChild(document.createTextNode(label));}};
            heading('movies',adminTypeLabels.movie+'s');heading('tvshows',adminTypeLabels.tv==='TV Show'?'TV Shows':adminTypeLabels.tv);heading('anime',adminTypeLabels.anime);
            const filterLabels={movie:adminTypeLabels.movie+'s',tv:adminTypeLabels.tv==='TV Show'?'TV Shows':adminTypeLabels.tv,anime:adminTypeLabels.anime};
            const adv=document.getElementById('advType');if(adv){Array.from(adv.options).forEach(o=>{if(filterLabels[o.value])o.textContent=filterLabels[o.value];});}
        }
        db.ref('settings/typeLabels').on('value',snap=>{applyAdminTypeLabels(snap.val()||{});},err=>console.warn('Type labels could not be loaded:',err?.message||err));
        function typeKeyOf(t){ return t.key || normalizeType(t.name); }
        function isBuiltInType(key){ return ['movie','tv','anime'].includes(key); }
        function isTypeValid(key){ if(!key) return false; if(isBuiltInType(key)) return true; return types.some(t => typeKeyOf(t) === key && t.enabled !== false); }

        db.ref('heroSlides').on('value', snap => {
            heroSlides = sortByOrder(onlyEnabled(toArray(snap.val())));
            // Choose a random starting hero once when the slider data first arrives.
            // Later Firebase updates keep the current slide instead of jumping randomly.
            if (!heroRandomized && heroSlides.length > 0) {
                heroIndex = heroSlides.length > 1 ? Math.floor(Math.random() * heroSlides.length) : 0;
                heroRandomized = true;
            }
            renderHero();
        });
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

        // Clean URL routing: use normal paths instead of hash (#) routes.
        function getHashRoute(){ const path = window.location.pathname || '/'; const query = (window.location.search || '').replace(/^\?/, ''); return { path: path || '/', query }; }
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
        function buildDetailPath(item, seasonNo='', episodeNo=''){ const slug = slugifyWatch(item?.title || item?.name || item?.id); let path = '/home/detail/' + encodeURIComponent(slug); if(seasonNo !== '' && seasonNo != null) path += '/season/' + encodeURIComponent(String(seasonNo)); if(episodeNo !== '' && episodeNo != null) path += '/ep/' + encodeURIComponent(String(episodeNo)); return path; }
        function updateAppRoute(item, seasonNo='', episodeNo='', replace=false){ if(!item) return; const path = buildDetailPath(item, seasonNo, episodeNo); if((window.location.pathname + window.location.search) !== path){ (replace ? history.replaceState : history.pushState).call(history, {}, '', path); } }

        function handleAppRoute(){
            const route=parseAppRoute();
            // Stop the official trailer as soon as navigation leaves a detail page.
            if(route.type !== 'detail' && typeof closeOfficialTrailer === 'function') closeOfficialTrailer();
            const q=getSearchFromUrl(); const cat=getCategoryFromUrl();
            if(q){ renderSearchPage(); window.scrollTo({top:0,behavior:'auto'}); return; }
            if(cat){ renderCategoryPage(); window.scrollTo({top:0,behavior:'auto'}); return; }
            if(route.type !== 'detail'){ closeModal(false); goHome(); return; }
            const item=findContentByRouteSlug(route.slug);
            // On a fresh visit, the URL can be ready before Firebase returns its content.
            // Do not redirect to Home during that short loading window; the content listener
            // calls handleAppRoute again after the data arrives.
            if(!item){
                if(!contentDataLoaded) return;
                closeModal(false); goHome(); return;
            }
            openContentById(item.id, true, route);
            window.scrollTo({top:0,behavior:'auto'});
        }

        window.addEventListener('popstate', handleAppRoute);
        window.addEventListener('hashchange', handleAppRoute);

        function openSearchPage(query){
            if(typeof closeOfficialTrailer === 'function') closeOfficialTrailer();
            query=String(query||'').trim(); if(!query) return;
            const encoded=encodeURIComponent(query); const url='/home?search='+encoded;
            if((window.location.pathname + window.location.search) !== url) history.pushState({},'',url);
            currentSearchFilter='all';
            const tabs=$('searchPageTabs'); if(tabs) tabs.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.filter==='all'));
            const input=$('searchInput'); if(input) input.value=query;
            const results=$('searchResults'); if(results) results.classList.remove('show');
            renderSearchPage(); window.scrollTo({top:0,behavior:'auto'});
        }

        function goSearchBack(){ if(window.history.length>1) history.back(); else goHome(); }

        function openBrowseYearPage(){
            if(typeof closeOfficialTrailer === 'function') closeOfficialTrailer();
            document.body.classList.add('search-mode');
            const title=$('searchPageTitle'), crumb=$('searchPageCrumb'), count=$('searchPageCount'), tabs=$('searchPageTabs'), grid=$('searchPageGrid');
            if(title) title.textContent='Browse by Year'; if(crumb) crumb.textContent='Browse by Year'; if(count) count.textContent='';
            if(tabs) tabs.style.display='none';
            if(grid){ grid.classList.add('year-browse-layout'); grid.innerHTML='<div class="year-page-controls"><label for="dedicatedYearSelect">Release Year</label><select id="dedicatedYearSelect"><option value="">Select year...</option></select></div><div id="dedicatedYearResults" class="search-page-grid"></div>'; }
            const select=$('dedicatedYearSelect');
            const years=[...new Set(content.map(x=>Number(x.year||x.releaseYear)).filter(y=>y>=1900&&y<=2100))].sort((a,b)=>b-a);
            select.innerHTML='<option value="">Select year...</option>'+years.map(y=>`<option value="${y}">${y}</option>`).join('');
            select.onchange=()=>{const year=select.value;const items=content.filter(x=>String(x.year||x.releaseYear||'')===year);const out=$('dedicatedYearResults');if(out)out.innerHTML=year?(items.length?items.map(searchCardHTML).join(''):`<div class="year-browse-placeholder">No titles found for ${year}.</div>`):'<div class="year-browse-placeholder">Select a year to see its movies, series and anime.</div>';const c=$('searchPageCount');if(c)c.textContent=year?items.length+' titles':'';};
            window.scrollTo({top:0,behavior:'auto'});
        }

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
                  <img src="${escapeHtml(poster)}" loading="lazy" decoding="async" alt="${escapeHtml(title)}" onerror="this.style.opacity='.25'">
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
            const searchGrid=$('searchPageGrid'); if(searchGrid) searchGrid.classList.remove('year-browse-layout');
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
            let matches=content.filter(item=>{ const text=[item.title,item.name,item.type,item.category,item.genre,item.language,item.lang,item.tags,item.description,item.overview,item.country,item.year,item.releaseYear,item.cast,item.actors].filter(Boolean).join(' ').toLowerCase(); return text.includes(q); });
            matches.sort((a,b)=>{const at=String(a.title||a.name||'').toLowerCase(),bt=String(b.title||b.name||'').toLowerCase();return (at===q?-3:at.startsWith(q)?-2:at.includes(q)?-1:0)-(bt===q?-3:bt.startsWith(q)?-2:bt.includes(q)?-1:0);});
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
            if(typeof closeOfficialTrailer === 'function') closeOfficialTrailer();
            const clean = String(type || '').toLowerCase().trim(); if(!clean) return;
            const norm = normalizeType(clean); if(!isTypeValid(norm)) return;
            const url = '/home?category=' + encodeURIComponent(norm);
            if((window.location.pathname + window.location.search) !== url) history.pushState({}, '', url);
            const input = $('searchInput'); if(input) input.value = '';
            const results = $('searchResults'); if(results) results.classList.remove('show');
            renderCategoryPage(); window.scrollTo({top:0,behavior:'auto'});
        }

        function goHome(){
            if(typeof closeOfficialTrailer === 'function') closeOfficialTrailer();
            history.pushState({},'', '/');
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
        // Keep the full-page loader visible on direct links until Firebase content is ready and the requested route has been handled.

        function hideInitialLoaderWhenPageIsReady(){
            // Wait until the browser has painted the actual destination page/modal,
            // not merely until the Firebase callback has started running.
            requestAnimationFrame(() => requestAnimationFrame(() => {
                const loader = $('loader');
                if (!loader) return;
                const route = parseAppRoute();
                if (route.type === 'detail') {
                    const item = findContentByRouteSlug(route.slug);
                    const modal = $('modalBackdrop');
                    // Keep the loader covering the screen until the requested detail is visible.
                    if (item && modal && !modal.classList.contains('show')) {
                        handleAppRoute();
                        requestAnimationFrame(() => requestAnimationFrame(() => {
                            const readyModal = $('modalBackdrop');
                            if (readyModal && readyModal.classList.contains('show')) loader.classList.add('hide');
                        }));
                        return;
                    }
                    if (!item) {
                        // Don't reveal Home as a temporary screen while a direct detail route is resolving.
                        // Once Firebase has completed its first read, show a clear not-found state instead.
                        const title = $('loader').querySelector('.loader-message');
                        if (title) title.textContent = 'This title could not be found. Please check the link.';
                        setTimeout(() => loader.classList.add('hide'), 900);
                        return;
                    }
                    if (!modal || !modal.classList.contains('show')) return;
                }
                loader.classList.add('hide');
            }));
        }

        db.ref('content').on('value', snap => {
            contentDataLoaded = true;
            content = shuffleForRefresh(sortByOrder(onlyEnabled(toArray(snap.val()))));
            if(typeof heroSlides !== 'undefined' && heroSlides.length && typeof renderHero === 'function') renderHero();
            const searchRendered = renderSearchPage();
            const categoryRendered = !searchRendered && renderCategoryPage();
            if (!searchRendered && !categoryRendered) {
                updateRandomFeedState(); renderAll(); renderCustomTypeSections(); setupRandomFeed();
                if(parseAppRoute().type === 'detail') handleAppRoute();
                requestAnimationFrame(() => {
                    const sentinel = $('randomFeedSentinel');
                    const hasNew = getRandomFeedPool().some(item => !randomFeedUsed.has(item.id));
                    if(sentinel && hasNew && sentinel.getBoundingClientRect().top < window.innerHeight + 1000) loadRandomFeed();
                });
            }
            hideInitialLoaderWhenPageIsReady();
        }, error => {
            console.warn('Content could not be loaded:', error && error.message || error);
            const message = $('loader') && $('loader').querySelector('.loader-message');
            if (message) message.textContent = 'Unable to load content. Check your connection and try again.';
            // Avoid trapping users behind a permanent loading screen on a Firebase error.
            setTimeout(() => { const loader = $('loader'); if (loader) loader.classList.add('hide'); }, 1800);
        });

        const sidebar = $('sidebar'); const overlay = $('sidebarOverlay'); const hamburger = $('hamburgerBtn');
        // Remember the desktop sidebar state so it stays hidden/shown after Home navigation or reload.
        try {
            if (window.innerWidth > 820 && localStorage.getItem('animeBoxSidebarHidden') === 'true') {
                document.body.classList.add('sidebar-collapsed');
            }
        } catch (e) { /* Storage may be unavailable in private browsing. */ }
        function toggleSidebar(open){
            // Desktop: the hamburger always remains available to turn the sidebar back ON.
            // Mobile: use the slide-in drawer and overlay.
            if(window.innerWidth > 820){
                const shouldHide = open !== undefined ? !open : !document.body.classList.contains('sidebar-collapsed');
                document.body.classList.toggle('sidebar-collapsed', shouldHide);
                try { localStorage.setItem('animeBoxSidebarHidden', String(shouldHide)); } catch (e) {}
                sidebar.classList.remove('open');
                overlay.classList.remove('open');
                document.body.style.overflow = '';
                if(hamburger) {
                    hamburger.setAttribute('aria-expanded', String(!shouldHide));
                    hamburger.setAttribute('aria-label', shouldHide ? 'Show menu' : 'Hide menu');
                    hamburger.title = shouldHide ? 'Show menu' : 'Hide menu';
                }
                return;
            }
            const shouldOpen = open !== undefined ? open : !sidebar.classList.contains('open');
            sidebar.classList.toggle('open', shouldOpen);
            overlay.classList.toggle('open', shouldOpen);
            document.body.style.overflow = shouldOpen ? 'hidden' : '';
            if(hamburger) {
                hamburger.setAttribute('aria-expanded', String(shouldOpen));
                hamburger.setAttribute('aria-label', shouldOpen ? 'Hide menu' : 'Show menu');
            }
        }
        if(hamburger) hamburger.addEventListener('click', () => toggleSidebar());
        if(overlay) overlay.addEventListener('click', () => toggleSidebar(false));
        window.addEventListener('resize', () => {
            if(window.innerWidth > 820){ sidebar.classList.remove('open'); overlay.classList.remove('open'); document.body.style.overflow=''; }
        });

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
                else if(target === 'browseYear'){ openBrowseYearPage(); }
                else if(['trending','continueWatching','watchHistory','myList'].includes(target)){ goHome(); setTimeout(() => { const el = $(target); if(el) el.scrollIntoView({behavior:'smooth', block:'start'}); }, 80); }
                else { openCategoryPage(target); }
                if(window.innerWidth <= 820) toggleSidebar(false);
            });
        }

        function renderHero(){
            const el = $('heroSection');
            if(!heroSlides.length){ el.innerHTML = `<div class="empty-state" style="padding-top:80px;">No hero slides published yet.</div>`; return; }
            if(heroIndex >= heroSlides.length) heroIndex = 0;
            const activeHeroImage = heroSlides[heroIndex] && heroSlides[heroIndex].image;
            if(activeHeroImage && /^https?:\/\//i.test(activeHeroImage)) {
                let heroPreload = document.querySelector('link[data-hero-preload]');
                if(!heroPreload) { heroPreload = document.createElement('link'); heroPreload.rel = 'preload'; heroPreload.as = 'image'; heroPreload.setAttribute('data-hero-preload', ''); document.head.appendChild(heroPreload); }
                if(heroPreload.href !== activeHeroImage) heroPreload.href = activeHeroImage;
            }
            el.innerHTML = heroSlides.map((s, i) => {
                const linkedCard = content.find(c => String(c.id) === String(s.link || s.contentId || s.animeId || ''));
                const value = (...vals) => vals.find(v => v !== undefined && v !== null && String(v).trim() !== '');
                const linkedPoster = linkedCard && value(linkedCard.poster, linkedCard.image, linkedCard.thumbnail, linkedCard.backdrop, linkedCard.cover);
                const posterToShow = value(linkedPoster, s.linkedPoster, s.poster, s.image, '');
                const title = value(linkedCard && linkedCard.title, linkedCard && linkedCard.name, s.linkedTitle, s.title, 'Untitled');
                const type = value(linkedCard && linkedCard.type, s.type, s.category, 'Movie');
                const typeKey = String(type).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                const category = value(linkedCard && linkedCard.category, linkedCard && linkedCard.genre, s.category, type);
                const rating = value(linkedCard && linkedCard.rating, linkedCard && linkedCard.score, s.rating, '—');
                const year = value(linkedCard && linkedCard.year, linkedCard && linkedCard.releaseYear, s.year, '—');
                const language = value(linkedCard && linkedCard.language, linkedCard && linkedCard.lang, linkedCard && linkedCard.audioLanguage, s.language, '—');
                const genre = value(linkedCard && linkedCard.genre, linkedCard && linkedCard.genres, s.genre, '');
                const description = value(linkedCard && linkedCard.description, linkedCard && linkedCard.overview, linkedCard && linkedCard.synopsis, s.subtitle, 'Watch the latest title now.');
                const linkId = value(s.link, linkedCard && linkedCard.id, '');
                return `
                <div class="hero-slide ${i === heroIndex ? 'active' : ''}" data-hero-index="${i}" data-hero-video="${escapeHtml(s.video || '')}" style="${i === heroIndex ? 'background-image:url(' + (s.image || '') + ')' : ''}">
                    ${s.video ? `<video class="hero-bg-video" muted playsinline preload="none" aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:none;z-index:0"></video>` : ''}
                    <div class="hero-content">
                        <div class="hero-poster-card">
                            <img src="${escapeHtml(posterToShow)}" alt="${escapeHtml(title)}" loading="${i === heroIndex ? 'eager' : 'lazy'}" fetchpriority="${i === heroIndex ? 'high' : 'low'}" decoding="async" onerror="this.style.opacity='.4'">
                        </div>
                        <div class="hero-text-block">
                            <div class="hero-badge hero-type-${escapeHtml(typeKey)}"><span class="html-icon html-icon-fire">◆</span> ${escapeHtml(type)}</div>
                            <h1>${escapeHtml(title)}</h1>
                            <div class="hero-meta">
                                <span class="meta-chip hero-type-${escapeHtml(typeKey)}">▣ ${escapeHtml(category)}</span>
                                <span>★ ${escapeHtml(rating)}</span>
                                <span class="meta-chip">${escapeHtml(year)}</span>
                                ${language ? `<span class="dot-sep">•</span><span>${escapeHtml(language)}</span>` : ''}
                                ${genre ? `<span class="dot-sep">•</span><span>${escapeHtml(Array.isArray(genre) ? genre.join(', ') : genre)}</span>` : ''}
                            </div>
                            <p>${escapeHtml(description)}</p>
                            <div class="hero-actions">
                                <button class="btn btn-primary" onclick="openContentById('${String(linkId).replace(/'/g, "\\\\'")}')">▶ Watch Now</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            }).join('') + `
                <button class="hero-arrow left" onclick="heroNav(-1)">‹</button>
                <button class="hero-arrow right" onclick="heroNav(1)">›</button>
                <div class="hero-dots">${heroSlides.map((_, i) => `<div class="hero-dot ${i === heroIndex ? 'active' : ''}" onclick="heroGo(${i})"></div>`).join('')}</div>
            `;
            restartHeroTimer();
        }
        function heroNav(dir){ heroGo((heroIndex + dir + heroSlides.length) % heroSlides.length); }
        function heroGo(i){ heroIndex = i; renderHero(); }
        // Image-only slides remain visible for 7s. Video slides show image for 3s,
        // then video for 6s, then advance. A direct MP4/WebM URL is required.
        let heroPhaseTimer = null;
        function restartHeroTimer(){
            clearInterval(heroTimer); clearTimeout(heroPhaseTimer);
            const slide = heroSlides[heroIndex];
            if(!slide) return;
            const slideEl = document.querySelector('.hero-slide.active');
            const videoUrl = String(slide.video || '').trim();
            const videoEl = slideEl && slideEl.querySelector('.hero-bg-video');
            if(videoEl && videoUrl){
                videoEl.pause(); videoEl.removeAttribute('src'); videoEl.load();
                videoEl.style.display = 'none';
                heroPhaseTimer = setTimeout(() => {
                    if(!document.querySelector('.hero-slide.active') || heroIndex >= heroSlides.length) return;
                    videoEl.src = videoUrl;
                    videoEl.style.display = 'block';
                    const playPromise = videoEl.play();
                    if(playPromise && playPromise.catch) playPromise.catch(()=>{});
                    heroPhaseTimer = setTimeout(() => heroNav(1), 6000);
                }, 3000);
            } else if(heroSlides.length > 1) {
                heroPhaseTimer = setTimeout(() => heroNav(1), 7000);
            }
        }

        function renderBanner(){
            const el = $('bannerStrip');
            if(!banners.length){ el.style.display = 'none'; return; }
            el.style.display = 'block';
            if(bannerIndex >= banners.length) bannerIndex = 0;
            el.innerHTML = banners.map((b, i) => `
                <div class="banner-slide ${i === bannerIndex ? 'active' : ''}" style="${i === bannerIndex ? 'background-image:url(' + (b.image || '') + ')' : ''}" onclick="openContentById('${b.link || ''}')"></div>
            `).join('');
            clearInterval(bannerTimer);
            if(banners.length > 1){ bannerTimer = setInterval(() => { bannerIndex = (bannerIndex + 1) % banners.length; renderBanner(); }, 9000); }
        }

        function renderCategoryTabs(){
            const catNames = categories.map(c => c.name);
            buildTabs('movieCatTabs', catNames, activeMovieCat, (c)=>{ activeMovieCat = c; renderGrids(); });
            buildTabs('tvCatTabs', catNames, activeTvCat, (c)=>{ activeTvCat = c; renderGrids(); });
            buildTabs('animeCatTabs', catNames, activeAnimeCat, (c)=>{ activeAnimeCat = c; renderGrids(); });
        }
        function buildTabs(containerId, catNames, active, onClick){
            const el = $(containerId); if(!el) return;
            // Home category tabs: hide the 'All' button while keeping all titles visible by default.
            el.innerHTML = catNames.map(c => `<button class="tab-btn ${c === active ? 'active' : ''}" data-cat="${c}">${c}</button>`).join('');
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
                        <img src="${escapeHtml(poster)}" loading="lazy" decoding="async" alt="${escapeHtml(title)}" onerror="this.style.display='none';this.parentElement.classList.add('no-image')">
                        <div class="simple-badges-on-poster">
                            ${badge ? `<span class="simple-badge badge-main">${escapeHtml(badge)}</span>` : ''}
                            ${language ? `<span class="simple-badge badge-lang">${escapeHtml(language)}</span>` : ''}
                            ${year ? `<span class="simple-badge badge-date">${escapeHtml(year)}</span>` : ''}
                        </div>
                        <span class="simple-quality">${escapeHtml(quality)}</span>
                        <button type="button" class="simple-view-btn" title="Views" onclick="event.stopPropagation();incrementView(this)">
                            <span class="html-icon" style="width:auto;min-width:0;height:auto;font-size:9px;color:#60a5fa;filter:none;">◉</span>
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

        function getContentYear(item){ const raw=String(item?.year ?? item?.releaseYear ?? item?.release_date ?? item?.first_air_date ?? '').trim(); const match=raw.match(/(?:19|20|21)\d{2}/); return match ? match[0] : ''; }
        function renderYearBrowse(){
            const select=$('homeYearSelect'), grid=$('homeYearGrid'), count=$('yearBrowseCount');
            if(!select||!grid||!count)return;
            const years=[...new Set(content.map(getContentYear).filter(Boolean))].sort((a,b)=>Number(b)-Number(a));
            const selected=select.value;
            const options='<option value="">Select year...</option>'+years.map(y=>`<option value="${y}">${y}</option>`).join('');
            if(select.dataset.years!==years.join(',')){select.innerHTML=options;select.dataset.years=years.join(',');if(years.includes(selected))select.value=selected;}
            const year=select.value;
            if(!year){count.textContent=content.length+' titles available';grid.innerHTML='<div class="year-browse-placeholder">Choose a release year above to show matching movies, series and anime.</div>';return;}
            const items=content.filter(item=>getContentYear(item)===year);
            count.textContent=items.length+' title'+(items.length===1?'':'s')+' • '+year;
            grid.innerHTML=items.length?items.map(searchCardHTML).join(''):`<div class="year-browse-placeholder">No titles found for ${escapeHtml(year)}.</div>`;
        }
        const homeYearSelect=$('homeYearSelect');
        if(homeYearSelect)homeYearSelect.addEventListener('change',renderYearBrowse);
        const clearHomeYear=$('clearHomeYear');
        if(clearHomeYear)clearHomeYear.addEventListener('click',()=>{if(homeYearSelect)homeYearSelect.value='';renderYearBrowse();});

        function setupHomeRowArrows(root=document){
            // Add the same five-card arrow behavior to Home category rows and Trending Now.
            root.querySelectorAll('.type-row-wrap,.row-scroll-wrapper').forEach(wrap=>{
                const row=wrap.querySelector('.type-row,.row-scroll');
                if(!row) return;
                let left=wrap.querySelector(':scope > .type-row-arrow.left');
                let right=wrap.querySelector(':scope > .type-row-arrow.right');
                if(!left || !right){
                    left=document.createElement('button');
                    left.type='button'; left.className='type-row-arrow left'; left.textContent='‹';
                    left.setAttribute('aria-label','Scroll back five cards');
                    right=document.createElement('button');
                    right.type='button'; right.className='type-row-arrow right'; right.textContent='›';
                    right.setAttribute('aria-label','Scroll forward five cards');
                    wrap.append(left,right);
                }
                const cards=()=>[...row.children].filter(el=>el.matches('.simple-card,.card'));
                const step=()=>{
                    const list=cards();
                    if(list.length>=5){
                        const first=list[0], fifth=list[4];
                        return fifth.offsetLeft + fifth.offsetWidth - first.offsetLeft + (parseFloat(getComputedStyle(row).gap)||0);
                    }
                    return row.clientWidth;
                };
                const refresh=()=>{
                    const list=cards();
                    const hasMoreThanFive=list.length>5 && row.scrollWidth>row.clientWidth+2;
                    right.style.display=hasMoreThanFive && row.scrollLeft < row.scrollWidth-row.clientWidth-2 ? 'flex':'none';
                    // The back arrow is intentionally hidden until the user clicks forward once.
                    left.style.display=hasMoreThanFive && wrap.dataset.hasScrolledForward==='1' && row.scrollLeft>2 ? 'flex':'none';
                };
                if(wrap.dataset.arrowsBound!=='1'){
                    wrap.dataset.arrowsBound='1';
                    left.addEventListener('click',()=>row.scrollBy({left:-step(),behavior:'smooth'}));
                    right.addEventListener('click',()=>{wrap.dataset.hasScrolledForward='1';row.scrollBy({left:step(),behavior:'smooth'});setTimeout(refresh,220);setTimeout(refresh,500);});
                    row.addEventListener('scroll',refresh,{passive:true});
                    if(typeof ResizeObserver!=='undefined'){const ro=new ResizeObserver(refresh);ro.observe(row);}
                }
                refresh();
            });
        }
        setupHomeRowArrows();
        const homeRowObserver = new MutationObserver(()=>setupHomeRowArrows(document));
        homeRowObserver.observe(document.body,{childList:true,subtree:true});

        function renderAll(){ renderTrending(); renderGrids(); renderCustomTypeSections(); renderContinueWatching(); renderYearBrowse(); setupHomeRowArrows(); }
        function renderTrending(){ const row = $('trendingRow'); const items = content.filter(c => c.trending); row.innerHTML = items.length ? items.map(cardHTML).join('') : `<div class="empty-state">No trending titles right now.</div>`; }
        function renderGrids(){ renderTypeGrid('movie', 'moviesGrid', activeMovieCat); renderTypeGrid('tv', 'tvGrid', activeTvCat); renderTypeGrid('anime', 'animeGrid', activeAnimeCat); }
        function renderTypeGrid(type, gridId, cat){ let items = content.filter(c => c.type === type); if(cat && cat !== 'all') items = items.filter(c => c.category === cat); const el = $(gridId); if(!el) return; el.innerHTML = items.length ? items.map(cardHTML).join('') : `<div class="empty-state">No titles found.</div>`; }

        let randomFeedUsed = new Set(); let randomFeedLoading = false; let randomFeedFinished = false; let randomFeedStarted = false; let randomFeedObserver = null;
        const RANDOM_BATCH_SIZE = 8;
        function randomShuffle(arr){ const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
        function getRandomFeedPool(){ return content.filter(item => { const type = String(item.type || '').trim().toLowerCase().replace(/[_-]+/g,' ').replace(/\\s+/g,' '); return ['anime','movie','tv','tv show','tvshow','series'].includes(type); }); }
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
            const matches = content.filter(c => {
                const title = String(c.title || c.name || '').trim().toLowerCase();
                const meta = [c.year,c.releaseYear,c.category,c.type,c.language,c.lang,c.genre,c.tags].filter(Boolean).join(' ').toLowerCase();
                return title && (title.includes(q) || meta.includes(q));
            }).sort((a,b) => {
                const at=String(a.title||a.name||'').toLowerCase(), bt=String(b.title||b.name||'').toLowerCase();
                return (at===q?-2:at.startsWith(q)?-1:0)-(bt===q?-2:bt.startsWith(q)?-1:0);
            }).slice(0, 20);
            searchResults.innerHTML = matches.length ? matches.map(m => { const id = encodeURIComponent(String(m.id)); const title = escapeHtml(m.title || m.name || 'Untitled'); const meta=[m.year||m.releaseYear,m.category||m.type,m.language||m.lang].filter(Boolean).map(escapeHtml).join(' • '); return `<div class="search-item" onclick="selectSearchResult('${id}')"><div class="si-info"><b>${title}</b><span>${meta}</span></div></div>`; }).join('') + `<div class="search-item" onclick="openSearchPage(decodeURIComponent('${encodeURIComponent(searchInput.value.trim())}'))"><div class="si-info"><b>See all results for “${escapeHtml(searchInput.value.trim())}” →</b></div></div>` : `<div class="search-empty">No results for "${escapeHtml(q)}"</div>`;
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
                return `<div class="card" onclick="resumeFromContinue('${item.id}','${e.episodeId || ''}')"><div class="poster-wrap"><img src="${item.poster || ''}" loading="lazy" decoding="async" alt="${item.title || ''}" /><div class="overlay"><div class="play-btn">▶</div></div><div class="cw-progress"><i style="width:${pct}%"></i></div></div><div class="title">${item.title || ''}</div><div class="meta">${item.year || ''} ${item.category ? '• ' + item.category : ''}</div></div>`;
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
        function renderWatchHistory(){ const section=$('watchHistory'),row=$('watchHistoryRow'); if(!section||!row)return; const h=getHistory(); const cards=h.map(e=>{const item=content.find(c=>String(c.id)===String(e.itemId));if(!item)return '';return `<div class="card" onclick="openContentById('${item.id}')"><div class="poster-wrap"><img src="${item.poster||''}" loading="lazy" decoding="async" alt=""><div class="overlay"><div class="play-btn">▶</div></div></div><div class="title">${escapeHtml(item.title||'')}</div><div class="meta">${e.title?'EP • '+escapeHtml(e.title):'Watched'}</div></div>`}).filter(Boolean).join(''); row.innerHTML=cards||'<div class="empty" style="width:100%">No watch history yet.</div>'; section.style.display=h.length?'block':'none'; }
        function clearWatchHistory(){ safeStorage.removeItem(SB_KEYS.history); renderWatchHistory(); }
        function renderMyList(){ const section=$('myList'),row=$('myListRow'); if(!section||!row)return; const fav=getFavorites(); const cards=fav.map(id=>{const item=content.find(c=>String(c.id)===String(id));if(!item)return '';return `<div class="card" onclick="openContentById('${item.id}')"><div class="poster-wrap"><img src="${item.poster||''}" loading="lazy" decoding="async" alt=""><button class="favorite-badge active" data-favorite-id="${item.id}" onclick="event.stopPropagation();toggleFavorite('${item.id}')">♥</button></div><div class="title">${escapeHtml(item.title||'')}</div><div class="meta">${escapeHtml(item.type||'')}</div></div>`}).filter(Boolean).join(''); row.innerHTML=cards||'<div class="empty" style="width:100%">Your My List is empty.</div>'; section.style.display=fav.length?'block':'none'; }
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
        function getPlaybackGroupWord(group, item = currentPlaybackItem){ const raw = String(group?.groupType || '').trim().toLowerCase(); if(raw === 'chapter') return 'Chapter'; if(raw === 'season') return 'Season'; const label = String(group?.name || group?.title || '').trim().toLowerCase(); if(/^chapter(?:\s|\d|$)/.test(label)) return 'Chapter'; if(/^season(?:\s|\d|$)/.test(label)) return 'Season'; return String(item?.type || '').toLowerCase() === 'movie' ? 'Chapter' : 'Season'; }
        function getEpisodeNumber(episode, index = 0){ const n = episode?.episodeNumber ?? episode?.number ?? String(episode?.title || episode?.name || '').match(/\d+/)?.[0]; return Number(n) || (index + 1); }

        function openContentById(id, fromUrl = false, watchState = null){
            if(!id) return;
            // If the user opens a different detail page, stop the previous trailer first.
            if (typeof closeOfficialTrailer === 'function') closeOfficialTrailer();
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
            const trailerUrl = String(item.trailerUrl || item.trailer || '').trim();
            const trailerWrap = $('modalTrailerWrap'), trailerBtn = $('modalTrailerBtn');
            if (trailerWrap && trailerBtn) {
                trailerWrap.style.display = trailerUrl ? 'block' : 'none';
                trailerBtn.onclick = () => { if (trailerUrl && typeof openOfficialTrailer === 'function') openOfficialTrailer(trailerUrl, item.title || item.name || 'Official Trailer'); };
            }
            const castWrap = $('modalCastWrap'), castGrid = $('modalCastGrid');
            const castList = Array.isArray(item.cast) ? item.cast : [];
            if (castWrap && castGrid) {
                castGrid.innerHTML = castList.length ? castList.map(person => {
                    const name = escapeHtml(person.name || 'Unknown');
                    const character = escapeHtml(person.character || '');
                    const photo = String(person.photo || person.image || '').trim();
                    return `<div style="flex:0 0 92px;width:92px;text-align:center;">${photo ? `<img src="${escapeHtml(photo)}" alt="${name}" loading="lazy" style="width:76px;height:76px;object-fit:cover;border-radius:50%;background:#222;" onerror="this.style.display='none'">` : `<div style="width:76px;height:76px;margin:auto;border-radius:50%;display:grid;place-items:center;background:#242424;font-size:24px;">👤</div>`}<div style="font-size:12px;font-weight:700;margin-top:6px;overflow-wrap:anywhere;">${name}</div>${character ? `<div style="font-size:11px;opacity:.7;overflow-wrap:anywhere;">${character}</div>` : ''}</div>`;
                }).join('') : '';
                castWrap.style.display = castList.length ? 'block' : 'none';
            }
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

        let randomRecommendationUsed = new Set();
        let randomRecommendationObserver = null;
        let randomRecommendationLoading = false;
        let randomRecommendationFinished = false;

        function getRandomRecommendationPool() {
            // All content types added by admin are eligible for recommendations.
            return content.filter(item => item && item.id != null && (item.title || item.name || item.poster || item.backdrop));
        }

        function loadMoreRandomRecommendations() {
            const wrap = $('randomCardScrollWrap');
            const loader = $('randomCardScrollLoader');
            if (!wrap || randomRecommendationLoading || randomRecommendationFinished) return;
            const available = getRandomRecommendationPool().filter(item => !randomRecommendationUsed.has(String(item.id)));
            if (!available.length) {
                randomRecommendationFinished = true;
                if (loader) loader.textContent = wrap.children.length ? 'All available titles have been shown.' : 'No titles available.';
                return;
            }
            randomRecommendationLoading = true;
            if (loader) loader.textContent = 'Loading more random titles…';
            const batch = randomShuffle(available).slice(0, 12);
            batch.forEach(item => randomRecommendationUsed.add(String(item.id)));
            const html = batch.map(item => {
                const poster = item.poster || item.backdrop || '';
                const title = item.title || item.name || 'Untitled';
                const year = item.year || '';
                const safeId = encodeURIComponent(String(item.id));
                return `<div class="simple-card" onclick="openSearchResultPlayer('${safeId}')"><div class="simple-card-poster"><img src="${escapeHtml(poster)}" loading="lazy" decoding="async" alt="${escapeHtml(title)}" onerror="this.style.display='none';this.parentElement.classList.add('no-image')"><div class="simple-badges-on-poster">${year ? `<span class="simple-badge badge-date">${escapeHtml(year)}</span>` : ''}</div></div><div class="simple-card-info"><div class="simple-title">${escapeHtml(title)}</div></div></div>`;
            }).join('');
            wrap.insertAdjacentHTML('beforeend', html);
            randomRecommendationLoading = false;
            const more = getRandomRecommendationPool().some(item => !randomRecommendationUsed.has(String(item.id)));
            if (loader) loader.textContent = more ? 'Scroll down to load more' : 'All available titles have been shown.';
            if (!more) randomRecommendationFinished = true;
        }

        function renderRandomCardsInPanel() {
            const wrap = $('randomCardScrollWrap');
            if (!wrap) return;
            if (randomRecommendationObserver) { randomRecommendationObserver.disconnect(); randomRecommendationObserver = null; }
            randomRecommendationUsed = new Set();
            randomRecommendationLoading = false;
            randomRecommendationFinished = false;
            wrap.innerHTML = '';
            const sentinel = $('randomCardScrollSentinel');
            const loader = $('randomCardScrollLoader');
            if (loader) loader.textContent = 'Loading random titles…';
            if (sentinel && 'IntersectionObserver' in window) {
                randomRecommendationObserver = new IntersectionObserver(entries => {
                    if (entries.some(entry => entry.isIntersecting)) loadMoreRandomRecommendations();
                }, { root: null, rootMargin: '0px 0px 500px 0px', threshold: 0 });
                randomRecommendationObserver.observe(sentinel);
            }
            loadMoreRandomRecommendations();
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
                else { $('seasonField').style.display = 'none'; $('episodeField').style.display = 'none'; $('dubField').style.display = 'none'; $('playbackMessage').textContent = (String(currentPlaybackItem?.type || '').toLowerCase() === 'movie' ? 'No chapters have been added by the admin yet.' : 'No seasons or chapters have been added by the admin yet.'); }
            }).catch(() => { if(String(currentPlaybackItem?.type || '').toLowerCase() === 'movie'){ loadMovieDubs(contentId); } else $('playbackMessage').textContent = 'Unable to load seasons or chapters.'; });
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
            const grid = $('seasonPills');
            const select = $('seasonSelect');
            if (!grid) return;
            const selectedId = String(activeSeasonId || playbackSeasons[0]?.id || '');
            const currentGroup = playbackSeasons.find(item => String(item.id) === selectedId) || playbackSeasons[0];
            const groupWord = currentGroup ? getPlaybackGroupWord(currentGroup) : (String(currentPlaybackItem?.type || '').toLowerCase() === 'movie' ? 'Chapter' : 'Season');
            const barLabel = $('seasonBarLabel'); if(barLabel) barLabel.textContent = 'Seasons / Chapters';
            const chooseLabel = $('chooseSeasonLabel'); if(chooseLabel) chooseLabel.textContent = 'CHOOSE ' + groupWord.toUpperCase();
            const countLabel = $('seasonCountLabel'); if(countLabel) countLabel.textContent = 'Seasons / Chapters';
            // Keep both controls in sync; the reference design uses the dropdown.
            if (select) {
                select.innerHTML = playbackSeasons.map((season, i) => {
                    const n = getSeasonNumber(season, i);
                    const groupWord = getPlaybackGroupWord(season); return `<option value="${escapeHtml(season.id)}" ${String(season.id) === selectedId ? 'selected' : ''}>${groupWord} ${n}</option>`;
                }).join('');
                select.onchange = () => {
                    const seasonId = select.value;
                    currentPlaybackSeason = playbackSeasons.find(season => String(season.id) === String(seasonId)) || null;
                    if (currentPlaybackItem && currentPlaybackSeason) {
                        updateAppRoute(currentPlaybackItem, getSeasonNumber(currentPlaybackSeason, playbackSeasons.indexOf(currentPlaybackSeason)), '');
                    }
                    loadEpisodesForSeason(seasonId);
                };
            }
            grid.innerHTML = playbackSeasons.length ? playbackSeasons.map((season, i) => {
                const n = getSeasonNumber(season, i);
                const groupWord = getPlaybackGroupWord(season); const label = groupWord + ' ' + n;
                return `<div class="season-card ${String(season.id) === selectedId ? 'active' : ''}" data-season-id="${escapeHtml(season.id)}"><span class="season-number">${label}</span><span class="season-name">${escapeHtml(season.name || season.title || label)}</span></div>`;
            }).join('') : '<div class="episode-empty">No seasons</div>';
            grid.querySelectorAll('.season-card').forEach(card => {
                card.addEventListener('click', () => {
                    if (select) select.value = card.dataset.seasonId;
                    const seasonId = card.dataset.seasonId;
                    currentPlaybackSeason = playbackSeasons.find(season => String(season.id) === String(seasonId)) || null;
                    if (currentPlaybackItem && currentPlaybackSeason) updateAppRoute(currentPlaybackItem, getSeasonNumber(currentPlaybackSeason, playbackSeasons.indexOf(currentPlaybackSeason)), '');
                    loadEpisodesForSeason(seasonId);
                });
            });
        }

        function loadEpisodesForSeason(seasonId, wantedEpisodeId = ''){
            $('episodeSelect').innerHTML = '<option value="">Loading episodes…</option>'; $('dubSelect').innerHTML = '<option value="">Choose dub / language</option>'; $('episodePills').innerHTML = ''; $('dubPills').innerHTML = '';
            playbackEpisodes = []; playbackDubs = []; playbackSources = {};
            $('videoWrap').classList.remove('show'); $('qualityRow').style.display = 'none'; $('subtitleNote').style.display = 'none';
            if(!seasonId) return;
            const selectedSeason = playbackSeasons.find(s => String(s.id) === String(seasonId));
            const selectedSeasonNo = selectedSeason ? getSeasonNumber(selectedSeason, playbackSeasons.indexOf(selectedSeason)) : '';
            const episodeSeasonLabel = $('episodeSeasonLabel');
            if (episodeSeasonLabel) episodeSeasonLabel.textContent = selectedSeasonNo ? `${getPlaybackGroupWord(selectedSeason)} ${selectedSeasonNo} • Select an episode` : 'Select an episode';
            db.ref(`episodes/${currentPlaybackItem.id}`).once('value').then(snap => {
                const all = toArray(snap.val());
                playbackEpisodes = sortByOrder(onlyEnabled(all.filter(e => {
                  if(e.seasonId != null && String(e.seasonId) !== '') return String(e.seasonId) === String(seasonId);
                  return String(e.season) === String(seasonId);
                })));
                renderEpisodePills();
                if(playbackEpisodes.length){
                    currentPlaybackSeason = playbackSeasons.find(s => String(s.id) === String(seasonId)) || currentPlaybackSeason;
                    const wantedEpNo = String(wantedEpisodeId || '').match(/x(\d+)$/)?.[1] || '';
                    const wantedEpisode = wantedEpNo ? playbackEpisodes.find((e, i) => String(getEpisodeNumber(e, i)) === wantedEpNo) : null;
                    const episode = wantedEpisode || playbackEpisodes[0];
                    currentPlaybackEpisode = episode; renderEpisodePills(episode.id); $('watchExternalNote').style.display = 'block'; loadDubsForEpisode(episode.id);
                } else { $('playbackMessage').textContent = (String(currentPlaybackItem?.type || '').toLowerCase() === 'movie' ? 'No episodes have been added to this chapter yet.' : 'No episodes have been added to this season yet.'); }
            }).catch(() => { $('playbackMessage').textContent = 'Unable to load episodes.'; });
        }

        function renderEpisodePills(activeEpisodeId = ''){
            const row = $('episodePills');
            if (!row) return;
            row.innerHTML = playbackEpisodes.length ? playbackEpisodes.map((episode, i) => {
                const n = getEpisodeNumber(episode, i);
                const title = episode.title || episode.name || episode.episodeName || ('Episode ' + n);
                const active = String(episode.id) === String(activeEpisodeId || playbackEpisodes[0]?.id);
                const seasonNo = currentPlaybackSeason ? getSeasonNumber(currentPlaybackSeason, playbackSeasons.indexOf(currentPlaybackSeason)) : 1;
                return `<div class="episode-card ${active ? 'active' : ''}" data-episode-id="${escapeHtml(episode.id)}" data-ep-label="EP ${String(n).padStart(2,'0')}" role="button" tabindex="0" aria-label="Play Episode ${n}"><span class="episode-number">Episode ${escapeHtml(n)}</span><span class="episode-name">${getPlaybackGroupWord(currentPlaybackSeason)} ${escapeHtml(seasonNo)} · ${escapeHtml(episode.duration || '24 min')}</span></div>`;
            }).join('') : '<div class="episode-empty">No episodes</div>';
            row.querySelectorAll('.episode-card').forEach(card => {
                const choose = () => {
                    row.querySelectorAll('.episode-card').forEach(item => item.classList.remove('active'));
                    card.classList.add('active');
                    const episode = playbackEpisodes.find(item => String(item.id) === String(card.dataset.episodeId));
                    if (episode) {
                        currentPlaybackEpisode = episode;
                        currentPlaybackSeason = playbackSeasons.find(season => String(season.id) === String(episode.seasonId || episode.season)) || currentPlaybackSeason;
                        handleEpisodeClick(episode);
                    }
                };
                card.addEventListener('click', choose);
                card.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(); } });
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
            // Stop the official trailer whenever the detail page is closed or navigation leaves it.
            if (typeof closeOfficialTrailer === 'function') closeOfficialTrailer();
            const v = $('streamVideo'); v.pause(); v.removeAttribute('src'); v.load();
            $('modalBackdrop').classList.remove('show'); document.body.classList.remove('modal-page'); resetPlaybackUI(); currentPlaybackItem = null;
            if(updateRoute && (parseAppRoute().type === 'detail' || document.body.classList.contains('modal-page'))){ history.pushState({},'', '/'); }
        }

        const sections = ['home', 'trending', 'continueWatching', 'movies', 'tvshows', 'anime'];
        function updateActiveNav(){ const scrollY = window.scrollY + 120; let activeId = 'home'; for(const id of sections){ const el = $(id); if(el){ const rect = el.getBoundingClientRect(); const top = rect.top + window.scrollY; if(scrollY >= top - 60) activeId = id; } } document.querySelectorAll('.sidebar-nav a').forEach(link => { link.classList.toggle('active', link.dataset.section === activeId); }); }
        window.addEventListener('scroll', updateActiveNav);
        window.addEventListener('load', updateActiveNav);

        db.ref('content').on('value', () => renderContinueWatching());

        console.log('Anime Box — Hero slider redesigned: card inline with text, smaller text.');


/* ===== Original inline script 2 ===== */
function openWebsitePopup(url,title){document.getElementById('popupTitle').textContent=title;document.getElementById('popupFrame').src=url;document.getElementById('websitePopup').classList.add('show')}function closeWebsitePopup(){document.getElementById('popupFrame').src='';document.getElementById('websitePopup').classList.remove('show')}document.addEventListener('keydown',e=>{if(e.key==='Escape')closeWebsitePopup()});


/* ===== Original inline script 3 ===== */
(function(){
  const T={
    en:{home:'Home',movies:'Movies',tv:'TV Shows',anime:'Anime',trending:'Trending',continue:'Continue Watching',menu:'Menu',search:'Search movies, shows, anime...',download:'⬇ Download App',trendingTitle:'Trending Now',continueTitle:'Continue Watching',moviesTitle:'Movies',tvTitle:'TV Shows',animeTitle:'Anime',watch:'Watch Now',more:'More',rated:'people rated'},
    fr:{home:'Accueil',movies:'Films',tv:'Séries TV',anime:'Anime',trending:'Tendances',continue:'Continuer à regarder',menu:'Menu',search:'Rechercher des films, séries, anime...',download:'⬇ Télécharger l’application',trendingTitle:'Tendances',continueTitle:'Continuer à regarder',moviesTitle:'Films',tvTitle:'Séries TV',animeTitle:'Anime',watch:'Regarder',more:'Plus',rated:'personnes ont noté'},
    es:{home:'Inicio',movies:'Películas',tv:'Series',anime:'Anime',trending:'Tendencias',continue:'Seguir viendo',menu:'Menú',search:'Buscar películas, series, anime...',download:'⬇ Descargar App',trendingTitle:'Tendencias',continueTitle:'Seguir viendo',moviesTitle:'Películas',tvTitle:'Series',animeTitle:'Anime',watch:'Ver ahora',more:'Más',rated:'personas calificaron'},
    de:{home:'Startseite',movies:'Filme',tv:'TV-Serien',anime:'Anime',trending:'Trends',continue:'Weiter ansehen',menu:'Menü',search:'Filme, Serien, Anime suchen...',download:'⬇ App herunterladen',trendingTitle:'Trends',continueTitle:'Weiter ansehen',moviesTitle:'Filme',tvTitle:'TV-Serien',animeTitle:'Anime',watch:'Jetzt ansehen',more:'Mehr',rated:'Personen bewertet'},
    ja:{home:'ホーム',movies:'映画',tv:'TVシリーズ',anime:'アニメ',trending:'トレンド',continue:'続きを見る',menu:'メニュー',search:'映画・番組・アニメを検索...',download:'⬇ アプリをダウンロード',trendingTitle:'トレンド',continueTitle:'続きを見る',moviesTitle:'映画',tvTitle:'TVシリーズ',animeTitle:'アニメ',watch:'今すぐ見る',more:'もっと見る',rated:'人が評価'},
    zh:{home:'首页',movies:'电影',tv:'电视剧',anime:'动漫',trending:'热门',continue:'继续观看',menu:'菜单',search:'搜索电影、剧集、动漫...',download:'⬇ 下载应用',trendingTitle:'热门',continueTitle:'继续观看',moviesTitle:'电影',tvTitle:'电视剧',animeTitle:'动漫',watch:'立即观看',more:'更多',rated:'人评分'}
  };
  const $=id=>document.getElementById(id);
  function setText(el,key,t){if(el&&t[key]) el.textContent=t[key];}
  function translate(lang){
    const t=T[lang]||T.en;
    document.documentElement.lang=lang;
    document.querySelectorAll('[data-section="home"]').forEach(e=>{const n=e.querySelector('.nav-icon'); e.textContent=''; if(n)e.appendChild(n); e.append(' '+t.home);});
    document.querySelectorAll('[data-section="movies"]').forEach(e=>{const n=e.querySelector('.nav-icon'); if(n){e.textContent='';e.appendChild(n);e.append(' '+t.movies)}else e.textContent=t.movies});
    document.querySelectorAll('[data-section="tvshows"]').forEach(e=>{const n=e.querySelector('.nav-icon'); if(n){e.textContent='';e.appendChild(n);e.append(' '+t.tv)}else e.textContent=t.tv});
    document.querySelectorAll('[data-section="anime"]').forEach(e=>{const n=e.querySelector('.nav-icon'); if(n){e.textContent='';e.appendChild(n);e.append(' '+t.anime)}else e.textContent=t.anime});
    document.querySelectorAll('[data-section="trending"]').forEach(e=>{const n=e.querySelector('.nav-icon'); if(n){e.textContent='';e.appendChild(n);e.append(' '+t.trending)}else e.textContent=t.trending});
    document.querySelectorAll('[data-section="continueWatching"]').forEach(e=>{const n=e.querySelector('.nav-icon'); if(n){e.textContent='';e.appendChild(n);e.append(' '+t.continue)}else e.textContent=t.continue});
    const label=document.querySelector('.nav-label'); setText(label,'menu',t);
    const search=$('searchInput'); if(search) search.placeholder=t.search;
    const download=document.querySelector('.btn-download'); setText(download,'download',t);
    const headings={trending:'trendingTitle',continueWatching:'continueTitle',movies:'moviesTitle',tvshows:'tvTitle',anime:'animeTitle'};
    Object.entries(headings).forEach(([id,key])=>{const h=document.querySelector('#'+id+' .section-head h2'); if(h){const dot=h.querySelector('.dot'); h.textContent=''; if(dot)h.appendChild(dot); h.append(' '+t[key]);}});
    safeStorage.setItem('siteLanguage',lang);
  }
  const langSelect=$('sidebarLang');
  if(langSelect){langSelect.addEventListener('change',()=>translate(langSelect.value)); const saved=safeStorage.getItem('siteLanguage')||'en'; langSelect.value=saved; translate(saved);}
})();


/* ===== Original inline script 4 ===== */
(function(){
 const backdrop=document.getElementById('appDownloadBackdrop');
 const openBtn=document.querySelector('.btn-download');
 const closeBtn=document.getElementById('closeAppDownload');
 function open(){backdrop.classList.add('open');backdrop.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}
 function close(){backdrop.classList.remove('open');backdrop.setAttribute('aria-hidden','true');document.body.style.overflow='';}
 if(openBtn) openBtn.addEventListener('click',open); if(closeBtn) closeBtn.addEventListener('click',close);
 backdrop.addEventListener('click',e=>{if(e.target===backdrop)close();}); document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
 function renderDownloads(d){d=d||{};['Windows','Mac','Linux','Android'].forEach(os=>{const k=os.toLowerCase(),url=String(d[k+'Url']||'').trim(),status=document.getElementById('download'+os+'Status'),link=document.getElementById('download'+os+'Link');if(url){link.href=url;link.hidden=false;status.textContent=d[k+'Note']||({'Windows':'x86_64 Installer (.exe)','Mac':'Apple Silicon & Intel (.dmg)','Linux':'Debian / Ubuntu (.deb)','Android':'Universal APK (.apk)'}[os]);}else{link.hidden=true;link.removeAttribute('href');status.textContent=d[k+'Note']||({'Windows':'Windows build not yet generated','Mac':'macOS build not yet generated','Linux':'Linux build not yet generated','Android':'Android build not yet generated'}[os]);}});}
 function init(){if(!window.firebase||!firebase.database)return;firebase.database().ref('settings/appDownloads').on('value',s=>renderDownloads(s.val()),e=>console.warn('Download settings unavailable',e));}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();


/* ===== Original inline script 5 ===== */
(function(){
  function ensureTrailerDock(){
    let dock=document.getElementById('persistentOfficialTrailerDock');
    if(!dock){
      dock=document.createElement('div'); dock.id='persistentOfficialTrailerDock';
      dock.style.cssText='display:none;position:fixed;right:14px;bottom:14px;width:min(360px,calc(100vw - 28px));aspect-ratio:16/9;max-height:220px;background:#000;border:1px solid rgba(255,255,255,.25);border-radius:10px;overflow:hidden;z-index:1000000;box-shadow:0 8px 28px rgba(0,0,0,.55)';
      dock.innerHTML='<div id="persistentOfficialTrailerMedia" style="width:100%;height:100%"></div><button type="button" id="persistentOfficialTrailerClose" aria-label="Stop trailer" style="position:absolute;right:5px;top:5px;z-index:4;background:rgba(0,0,0,.82);color:#fff;border:0;border-radius:6px;padding:4px 8px;cursor:pointer">✕</button>';
      document.body.appendChild(dock);
      dock.querySelector('#persistentOfficialTrailerClose').addEventListener('click',function(){closeOfficialTrailer();});
    }
    return dock;
  }
  window.openOfficialTrailer=function(url,title){
    const stage=document.getElementById('officialTrailerInlineStage');
    const media=document.getElementById('officialTrailerInlineMedia');
    const wrap=document.getElementById('modalTrailerWrap');
    if(!stage||!media||!url)return;
    // If an already playing trailer is docked, restore the same media node without restarting it.
    const dock=document.getElementById('persistentOfficialTrailerDock');
    const dockMedia=document.getElementById('persistentOfficialTrailerMedia');
    if(dockMedia && dockMedia.childElementCount){
      while(dockMedia.firstChild) media.appendChild(dockMedia.firstChild);
      if(dock) dock.style.display='none';
      stage.style.display='block';
      if(wrap) wrap.scrollIntoView({behavior:'smooth',block:'nearest'});
      return;
    }
    media.innerHTML='';
    let embed='';
    try {
      const u=new URL(url,location.href); let vid='';
      if(u.hostname.includes('youtu.be')) vid=u.pathname.split('/').filter(Boolean)[0]||'';
      else if(u.hostname.includes('youtube.com')||u.hostname.includes('youtube-nocookie.com')) { vid=u.searchParams.get('v')||''; if(!vid){const m=u.pathname.match(/\/(?:embed|shorts|live)\/([^/?]+)/);if(m)vid=m[1];} }
      if(vid) embed='https://www.youtube-nocookie.com/embed/'+encodeURIComponent(vid)+'?autoplay=1&rel=0';
    } catch(e) {}
    if(embed){media.innerHTML='<iframe title="Official trailer" src="'+embed+'" style="width:100%;height:100%;border:0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>';}
    else if(/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)){const video=document.createElement('video');video.src=url;video.controls=true;video.autoplay=true;video.playsInline=true;video.style.cssText='width:100%;height:100%;object-fit:contain';media.appendChild(video);const play=video.play();if(play&&play.catch)play.catch(()=>{});}
    else {const frame=document.createElement('iframe');frame.src=url;frame.title=title||'Official trailer';frame.allow='autoplay; encrypted-media; picture-in-picture';frame.allowFullscreen=true;frame.style.cssText='width:100%;height:100%;border:0';media.appendChild(frame);}
    stage.style.display='block';
    if(wrap) wrap.scrollIntoView({behavior:'smooth',block:'nearest'});
  };
  // Trailer is intentionally stopped when the detail page closes; no persistent mini-player.
  window.closeOfficialTrailer=function(){
    const stage=document.getElementById('officialTrailerInlineStage');
    const media=document.getElementById('officialTrailerInlineMedia');
    const dock=document.getElementById('persistentOfficialTrailerDock');
    const dockMedia=document.getElementById('persistentOfficialTrailerMedia');
    if(media) media.innerHTML='';
    if(dockMedia) dockMedia.innerHTML='';
    if(stage) stage.style.display='none';
    if(dock) dock.style.display='none';
  };
})();

