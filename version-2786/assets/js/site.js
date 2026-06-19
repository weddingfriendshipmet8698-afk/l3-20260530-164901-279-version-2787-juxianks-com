(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function initMenu() {
    var toggle = qs('.menu-toggle');
    var panel = qs('.mobile-panel');
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener('click', function () {
      var open = panel.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function initHero() {
    var carousel = qs('[data-hero-carousel]');
    if (!carousel) {
      return;
    }
    var slides = qsa('.hero-slide', carousel);
    var dots = qsa('.hero-dot', carousel);
    var prev = qs('[data-hero-prev]', carousel);
    var next = qs('[data-hero-next]', carousel);
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-index')) || 0);
        restart();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        restart();
      });
    }

    restart();
  }

  function initFiltering() {
    var panels = qsa('.filter-panel');
    panels.forEach(function (panel) {
      var scope = panel.closest('.page-shell') || document;
      var input = qs('.movie-search-input', panel);
      var chips = qsa('.filter-chip', panel);
      var cards = qsa('.movie-card', scope);
      var empty = qs('.empty-state', scope);
      var currentType = 'all';

      function apply() {
        var query = input ? input.value.trim().toLowerCase() : '';
        var visible = 0;
        cards.forEach(function (card) {
          var haystack = (card.getAttribute('data-search') || '').toLowerCase();
          var type = (card.getAttribute('data-type') || '').toLowerCase();
          var typeMatch = currentType === 'all' || type.indexOf(currentType.toLowerCase()) !== -1 || haystack.indexOf(currentType.toLowerCase()) !== -1;
          var textMatch = !query || haystack.indexOf(query) !== -1;
          var show = typeMatch && textMatch;
          card.classList.toggle('is-hidden', !show);
          if (show) {
            visible += 1;
          }
        });
        if (empty) {
          empty.classList.toggle('is-visible', visible === 0);
        }
      }

      if (input) {
        input.addEventListener('input', apply);
      }

      chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          chips.forEach(function (item) {
            item.classList.remove('active');
          });
          chip.classList.add('active');
          currentType = chip.getAttribute('data-filter-value') || 'all';
          apply();
        });
      });

      var params = new URLSearchParams(window.location.search);
      var queryParam = params.get('q');
      if (queryParam && input) {
        input.value = queryParam;
      }
      apply();
    });
  }

  function initPlayers() {
    qsa('[data-player]').forEach(function (player) {
      var video = qs('video', player);
      var button = qs('.play-overlay', player);
      if (!video || !button) {
        return;
      }
      var stream = video.getAttribute('data-stream');
      var loaded = false;
      var hls = null;

      function load() {
        if (loaded || !stream) {
          return;
        }
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = stream;
        } else if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hls.loadSource(stream);
          hls.attachMedia(video);
        } else {
          video.src = stream;
        }
        loaded = true;
      }

      function play() {
        load();
        player.classList.add('is-playing');
        var promise = video.play();
        if (promise && typeof promise.catch === 'function') {
          promise.catch(function () {
            player.classList.remove('is-playing');
          });
        }
      }

      button.addEventListener('click', play);
      video.addEventListener('click', function () {
        if (video.paused) {
          play();
        }
      });
      video.addEventListener('play', function () {
        player.classList.add('is-playing');
      });
      video.addEventListener('pause', function () {
        if (!video.ended) {
          player.classList.remove('is-playing');
        }
      });
      window.addEventListener('beforeunload', function () {
        if (hls) {
          hls.destroy();
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMenu();
    initHero();
    initFiltering();
    initPlayers();
  });
})();
