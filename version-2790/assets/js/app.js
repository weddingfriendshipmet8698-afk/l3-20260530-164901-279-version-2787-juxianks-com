(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function escapeText(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function setupMenu() {
    var button = qs('[data-menu-toggle]');
    var menu = qs('[data-mobile-nav]');
    if (!button || !menu) {
      return;
    }
    button.addEventListener('click', function () {
      menu.classList.toggle('is-open');
    });
  }

  function setupHero() {
    var hero = qs('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = qsa('[data-hero-slide]', hero);
    var dots = qsa('[data-hero-dot]', hero);
    var prev = qs('[data-hero-prev]', hero);
    var next = qs('[data-hero-next]', hero);
    var current = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5600);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        start();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        show(current - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(current + 1);
        start();
      });
    }

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function setupSearch() {
    var movies = window.SiteMovies || [];
    qsa('[data-search]').forEach(function (input) {
      var shell = input.closest('.search-shell');
      var results = shell ? qs('[data-search-results]', shell) : null;
      if (!results) {
        return;
      }

      function render() {
        var term = input.value.trim().toLowerCase();
        if (term.length < 1) {
          results.classList.remove('is-open');
          results.innerHTML = '';
          return;
        }
        var matched = movies.filter(function (movie) {
          var text = [movie.title, movie.region, movie.type, movie.year, movie.genre, movie.tags].join(' ').toLowerCase();
          return text.indexOf(term) !== -1;
        }).slice(0, 12);
        if (!matched.length) {
          results.innerHTML = '<div class="search-empty">未找到匹配影片</div>';
          results.classList.add('is-open');
          return;
        }
        results.innerHTML = matched.map(function (movie) {
          return '<a class="search-result-item" href="' + escapeText(movie.url) + '">' +
            '<img src="' + escapeText(movie.cover) + '" alt="' + escapeText(movie.title) + '">' +
            '<span><strong>' + escapeText(movie.title) + '</strong>' +
            '<span>' + escapeText(movie.year) + ' · ' + escapeText(movie.region) + ' · ' + escapeText(movie.type) + '</span></span>' +
            '</a>';
        }).join('');
        results.classList.add('is-open');
      }

      input.addEventListener('input', render);
      input.addEventListener('focus', render);
      document.addEventListener('click', function (event) {
        if (!shell.contains(event.target)) {
          results.classList.remove('is-open');
        }
      });
    });
  }

  function setupFilters() {
    qsa('[data-filter-panel]').forEach(function (panel) {
      var scope = panel.parentElement || document;
      var cards = qsa('[data-movie-card]', scope);
      var input = qs('.filter-input', panel);
      var selects = qsa('.filter-select', panel);

      selects.forEach(function (select) {
        var key = select.getAttribute('data-filter');
        var values = [];
        cards.forEach(function (card) {
          var value = card.getAttribute('data-' + key) || '';
          if (value && values.indexOf(value) === -1) {
            values.push(value);
          }
        });
        values.sort(function (a, b) {
          if (key === 'year') {
            return String(b).localeCompare(String(a));
          }
          return String(a).localeCompare(String(b), 'zh-Hans-CN');
        });
        values.forEach(function (value) {
          var option = document.createElement('option');
          option.value = value;
          option.textContent = value;
          select.appendChild(option);
        });
      });

      function apply() {
        var term = input ? input.value.trim().toLowerCase() : '';
        var active = {};
        selects.forEach(function (select) {
          active[select.getAttribute('data-filter')] = select.value;
        });
        cards.forEach(function (card) {
          var text = [
            card.getAttribute('data-title'),
            card.getAttribute('data-region'),
            card.getAttribute('data-year'),
            card.getAttribute('data-type'),
            card.getAttribute('data-genre'),
            card.getAttribute('data-tags')
          ].join(' ').toLowerCase();
          var visible = !term || text.indexOf(term) !== -1;
          Object.keys(active).forEach(function (key) {
            if (active[key] && card.getAttribute('data-' + key) !== active[key]) {
              visible = false;
            }
          });
          card.classList.toggle('is-hidden', !visible);
        });
      }

      if (input) {
        input.addEventListener('input', apply);
      }
      selects.forEach(function (select) {
        select.addEventListener('change', apply);
      });
    });
  }

  function setupPlayer() {
    var holder = qs('[data-player]');
    if (!holder) {
      return;
    }
    var video = qs('video', holder);
    var layer = qs('.play-layer', holder);
    if (!video || !layer) {
      return;
    }
    var stream = video.getAttribute('data-stream-url');
    var hls = null;

    function attach() {
      if (!stream) {
        return;
      }
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        if (!video.src) {
          video.src = stream;
        }
      } else if (window.Hls && window.Hls.isSupported()) {
        if (!hls) {
          hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });
          hls.loadSource(stream);
          hls.attachMedia(video);
        }
      } else if (!video.src) {
        video.src = stream;
      }
    }

    function play() {
      attach();
      video.controls = true;
      layer.classList.add('is-hidden');
      var promise = video.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {
          layer.classList.remove('is-hidden');
        });
      }
    }

    layer.addEventListener('click', play);
    video.addEventListener('click', function () {
      if (video.paused) {
        play();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupMenu();
    setupHero();
    setupSearch();
    setupFilters();
    setupPlayer();
  });
}());
