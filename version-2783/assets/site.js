
(function(){
  const qs = (sel, root=document) => root.querySelector(sel);
  const qsa = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const slugify = (s) => String(s).toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g,'-').replace(/^-+|-+$/g,'');

  function initNav(){
    const btn = qs('.menu-toggle');
    const nav = qs('#site-nav');
    if (!btn || !nav) return;
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
  }

  function buildCard(m){
    const cat = (m.category_name || m.category || '').toString();
    const poster = m.poster || '';
    return `
      <article class="card movie-card" data-title="${escapeHtml(m.title)}" data-region="${escapeHtml(m.region || '')}" data-genre="${escapeHtml(m.genre || '')}" data-year="${escapeHtml(m.year || '')}" data-tags="${escapeHtml((m.tags || []).join(' '))}">
        <a href="${escapeHtml(m.path)}" class="poster-box" aria-label="${escapeHtml(m.title)}">
          <div class="poster-title">${escapeHtml(m.title)}</div>
          <div class="poster-sub">${escapeHtml((m.region || '') + ' · ' + (m.type || '') + ' · ' + (m.year || ''))}</div>
          <div class="poster-badges">
            ${cat ? `<span>${escapeHtml(cat)}</span>` : ''}
            ${m.tags && m.tags[0] ? `<span>${escapeHtml(m.tags[0])}</span>` : ''}
          </div>
        </a>
        <div class="card-body">
          <h3><a href="${escapeHtml(m.path)}">${escapeHtml(m.title)}</a></h3>
          <div class="meta"><span>${escapeHtml(m.year || '')}</span><span>${escapeHtml(m.region || '')}</span><span>${escapeHtml(m.genre || '')}</span></div>
          <div class="excerpt">${escapeHtml(m.snippet || '')}</div>
          <div class="card-actions"><a class="btn primary" href="${escapeHtml(m.path)}">立即查看</a><a class="btn" href="${escapeHtml(m.path)}">详情页</a></div>
        </div>
      </article>`;
  }

  function escapeHtml(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  function initSearchFilter(){
    const input = qs('[data-filter-input]');
    const cards = qsa('[data-title]');
    if (!input || !cards.length) return;
    const apply = () => {
      const q = input.value.trim().toLowerCase();
      let visible = 0;
      cards.forEach(card => {
        const text = [card.dataset.title, card.dataset.region, card.dataset.genre, card.dataset.year, card.dataset.tags].join(' ').toLowerCase();
        const hit = !q || text.includes(q);
        card.style.display = hit ? '' : 'none';
        if (hit) visible += 1;
      });
      const count = qs('[data-filter-count]');
      if (count) count.textContent = String(visible);
    };
    input.addEventListener('input', apply);
    apply();
  }

  function initSearchPage(){
    const mount = qs('[data-search-mount]');
    if (!mount || !window.SITE_MOVIES) return;
    const params = new URLSearchParams(location.search);
    const q = (params.get('q') || '').trim();
    const pageSize = Number(mount.dataset.pageSize || 60);
    const queryInput = qs('[data-search-query]');
    if (queryInput) queryInput.value = q;
    const state = { page: Math.max(1, Number(params.get('page') || 1)), query: q };

    function match(movie, term){
      if (!term) return true;
      const s = [movie.title, movie.region, movie.type, movie.genre, movie.snippet, (movie.tags||[]).join(' ')].join(' ').toLowerCase();
      return s.includes(term.toLowerCase());
    }

    function render(){
      const term = state.query;
      const all = window.SITE_MOVIES.filter(m => match(m, term));
      const total = all.length;
      const pages = Math.max(1, Math.ceil(total / pageSize));
      const page = Math.min(state.page, pages);
      const start = (page - 1) * pageSize;
      const slice = all.slice(start, start + pageSize);
      const countEl = qs('[data-search-count]');
      if (countEl) countEl.textContent = String(total);
      const pageEl = qs('[data-search-page]');
      if (pageEl) pageEl.textContent = `${page} / ${pages}`;
      const results = slice.map(buildCard).join('');
      mount.innerHTML = results || `<div class="empty">没有找到匹配内容，换个关键词试试。</div>`;
      const pager = qs('[data-search-pager]');
      if (pager) {
        const prev = page > 1 ? page - 1 : 1;
        const next = page < pages ? page + 1 : pages;
        pager.innerHTML = `
          <a href="#" data-pager="prev" data-go="${prev}">上一页</a>
          <span class="active">${page}</span>
          <a href="#" data-pager="next" data-go="${next}">下一页</a>
        `;
        qsa('a[data-go]', pager).forEach(a => a.addEventListener('click', (e) => {
          e.preventDefault();
          state.page = Number(a.dataset.go || 1);
          updateUrl();
          render();
          window.scrollTo({top: 0, behavior:'smooth'});
        }));
      }
    }

    function updateUrl(){
      const u = new URL(location.href);
      if (state.query) u.searchParams.set('q', state.query); else u.searchParams.delete('q');
      u.searchParams.set('page', String(state.page));
      history.replaceState({}, '', u);
    }

    const form = qs('[data-search-form]');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = queryInput ? queryInput.value.trim() : '';
        state.query = val;
        state.page = 1;
        updateUrl();
        render();
      });
    }
    render();
  }

  function initVideoPlayer(){
    const video = qs('video[data-player]');
    const overlay = qs('[data-play-overlay]');
    const btn = qs('[data-play-button]');
    if (!video) return;
    const showOverlay = () => overlay && overlay.classList.remove('hide');
    const hideOverlay = () => overlay && overlay.classList.add('hide');
    video.addEventListener('play', hideOverlay);
    video.addEventListener('pause', showOverlay);
    if (overlay && btn) {
      const play = async () => {
        try { await video.play(); } catch(e) {}
      };
      overlay.addEventListener('click', play);
      btn.addEventListener('click', play);
    }
    if (window.Hls && video.dataset.m3u8) {
      if (window.Hls.isSupported()) {
        const hls = new window.Hls();
        hls.loadSource(video.dataset.m3u8);
        hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = video.dataset.m3u8;
      }
    }
  }

  function initCategorySearchLink(){
    const input = qs('[data-site-search]');
    const form = qs('[data-site-search-form]');
    if (!input || !form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = input.value.trim();
      location.href = 'search.html' + (q ? `?q=${encodeURIComponent(q)}` : '');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initSearchFilter();
    initSearchPage();
    initVideoPlayer();
    initCategorySearchLink();
  });
})();
