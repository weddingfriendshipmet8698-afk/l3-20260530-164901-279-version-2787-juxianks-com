(function () {
  'use strict';

  function getRoot() {
    return document.body.getAttribute('data-root') || '';
  }

  function resolveUrl(path) {
    if (!path) {
      return '#';
    }
    if (/^(https?:)?\/\//.test(path) || path.startsWith('#')) {
      return path;
    }
    return getRoot() + path.replace(/^\.\//, '');
  }

  function closeMobileMenu() {
    var menu = document.querySelector('[data-mobile-menu]');
    if (menu) {
      menu.classList.remove('is-open');
    }
  }

  function initMobileMenu() {
    var button = document.querySelector('[data-menu-toggle]');
    var menu = document.querySelector('[data-mobile-menu]');
    if (!button || !menu) {
      return;
    }
    button.addEventListener('click', function () {
      menu.classList.toggle('is-open');
    });
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMobileMenu);
    });
  }

  function initHero() {
    var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
    var next = document.querySelector('[data-hero-next]');
    var prev = document.querySelector('[data-hero-prev]');
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer = null;

    function showSlide(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        showSlide(index + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        showSlide(Number(dot.getAttribute('data-hero-dot')) || 0);
        start();
      });
    });

    if (next) {
      next.addEventListener('click', function () {
        showSlide(index + 1);
        start();
      });
    }

    if (prev) {
      prev.addEventListener('click', function () {
        showSlide(index - 1);
        start();
      });
    }

    var carousel = document.querySelector('.hero-carousel');
    if (carousel) {
      carousel.addEventListener('mouseenter', stop);
      carousel.addEventListener('mouseleave', start);
    }

    showSlide(0);
    start();
  }

  function buildSearchItem(movie) {
    var link = document.createElement('a');
    link.href = resolveUrl(movie.url);
    link.className = 'search-result-item';

    var img = document.createElement('img');
    img.src = resolveUrl(movie.cover);
    img.alt = movie.title;
    img.loading = 'lazy';

    var text = document.createElement('span');
    text.innerHTML = '<strong>' + escapeHtml(movie.title) + '</strong><small>' +
      escapeHtml(movie.category + ' · ' + movie.year + ' · ★ ' + movie.rating) + '</small>';

    link.appendChild(img);
    link.appendChild(text);
    return link;
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function initGlobalSearch() {
    var input = document.querySelector('.site-search-input');
    var results = document.querySelector('[data-search-results]');
    var movies = window.MOVIE_SEARCH_INDEX || [];
    if (!input || !results || !movies.length) {
      return;
    }

    input.addEventListener('input', function () {
      var query = input.value.trim().toLowerCase();
      results.innerHTML = '';
      if (!query) {
        results.classList.remove('is-open');
        return;
      }

      var matched = movies.filter(function (movie) {
        var haystack = [
          movie.title,
          movie.category,
          movie.year,
          movie.region,
          movie.type,
          movie.genre
        ].join(' ').toLowerCase();
        return haystack.indexOf(query) !== -1;
      }).slice(0, 12);

      if (!matched.length) {
        var empty = document.createElement('div');
        empty.className = 'search-empty';
        empty.textContent = '没有找到匹配影片';
        results.appendChild(empty);
      } else {
        matched.forEach(function (movie) {
          results.appendChild(buildSearchItem(movie));
        });
      }
      results.classList.add('is-open');
    });

    document.addEventListener('click', function (event) {
      if (!event.target.closest('.search-bar')) {
        results.classList.remove('is-open');
      }
    });
  }

  function initCategoryFilter() {
    var list = document.querySelector('[data-filter-list]');
    if (!list) {
      return;
    }
    var cards = Array.prototype.slice.call(list.querySelectorAll('.movie-card'));
    var input = document.querySelector('.category-filter-input');
    var year = document.querySelector('.category-filter-year');
    var type = document.querySelector('.category-filter-type');
    var count = document.querySelector('[data-filter-count]');

    function applyFilter() {
      var query = input ? input.value.trim().toLowerCase() : '';
      var yearValue = year ? year.value : '';
      var typeValue = type ? type.value : '';
      var visibleCount = 0;

      cards.forEach(function (card) {
        var text = [
          card.getAttribute('data-title'),
          card.getAttribute('data-region'),
          card.getAttribute('data-type'),
          card.getAttribute('data-genre'),
          card.getAttribute('data-year')
        ].join(' ').toLowerCase();
        var matchesQuery = !query || text.indexOf(query) !== -1;
        var matchesYear = !yearValue || card.getAttribute('data-year') === yearValue;
        var matchesType = !typeValue || card.getAttribute('data-type') === typeValue;
        var visible = matchesQuery && matchesYear && matchesType;
        card.hidden = !visible;
        if (visible) {
          visibleCount += 1;
        }
      });

      if (count) {
        count.textContent = '显示 ' + visibleCount + ' 部影片';
      }
    }

    [input, year, type].forEach(function (control) {
      if (control) {
        control.addEventListener('input', applyFilter);
        control.addEventListener('change', applyFilter);
      }
    });

    applyFilter();
  }

  function initImages() {
    document.querySelectorAll('img').forEach(function (img) {
      img.addEventListener('error', function () {
        img.classList.add('image-missing');
        img.alt = img.alt || '影片封面';
      }, { once: true });
    });
  }

  function initPlayer(video, overlay) {
    var source = video.getAttribute('data-src');
    if (!source) {
      return;
    }
    if (video.dataset.ready === 'true') {
      video.play().catch(function () {});
      return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
      video.dataset.ready = 'true';
      video.play().catch(function () {});
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      var hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      hls.loadSource(source);
      hls.attachMedia(video);
      video.dataset.ready = 'true';
      video.addEventListener('canplay', function () {
        video.play().catch(function () {});
      }, { once: true });
      return;
    }

    video.src = source;
    video.dataset.ready = 'true';
    video.play().catch(function () {});
  }

  function initPlayers() {
    document.querySelectorAll('.player-card').forEach(function (card) {
      var video = card.querySelector('.js-hls-player');
      var overlay = card.querySelector('[data-player-start]');
      if (!video) {
        return;
      }

      function startPlayer() {
        if (overlay) {
          overlay.classList.add('is-hidden');
        }
        initPlayer(video, overlay);
      }

      if (overlay) {
        overlay.addEventListener('click', startPlayer);
      }

      video.addEventListener('click', function () {
        if (video.dataset.ready !== 'true') {
          startPlayer();
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
    initHero();
    initGlobalSearch();
    initCategoryFilter();
    initImages();
    initPlayers();
  });
}());
