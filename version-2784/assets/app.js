(function () {
  var menuButton = document.querySelector('[data-menu-button]');
  var mobilePanel = document.querySelector('[data-mobile-panel]');
  if (menuButton && mobilePanel) {
    menuButton.addEventListener('click', function () {
      mobilePanel.classList.toggle('open');
    });
  }

  var hero = document.querySelector('[data-hero]');
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var current = 0;
    var timer = null;
    var show = function (index) {
      if (!slides.length) return;
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === current);
      });
    };
    var next = function () { show(current + 1); };
    var start = function () {
      timer = window.setInterval(next, 5200);
    };
    var reset = function () {
      if (timer) window.clearInterval(timer);
      start();
    };
    var prevButton = hero.querySelector('[data-hero-prev]');
    var nextButton = hero.querySelector('[data-hero-next]');
    if (prevButton) {
      prevButton.addEventListener('click', function () {
        show(current - 1);
        reset();
      });
    }
    if (nextButton) {
      nextButton.addEventListener('click', function () {
        show(current + 1);
        reset();
      });
    }
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        reset();
      });
    });
    start();
  }

  var searchInputs = Array.prototype.slice.call(document.querySelectorAll('[data-card-search]'));
  searchInputs.forEach(function (input) {
    input.addEventListener('input', function () {
      var root = input.closest('main') || document;
      var query = input.value.trim().toLowerCase();
      var cards = Array.prototype.slice.call(root.querySelectorAll('.movie-card'));
      cards.forEach(function (card) {
        var text = [
          card.getAttribute('data-title') || '',
          card.getAttribute('data-tags') || '',
          card.getAttribute('data-region') || '',
          card.getAttribute('data-year') || '',
          card.textContent || ''
        ].join(' ').toLowerCase();
        card.classList.toggle('is-hidden', query && text.indexOf(query) === -1);
      });
    });
  });

  var hlsLoading = null;
  var loadHls = function () {
    if (window.Hls) return Promise.resolve(window.Hls);
    if (hlsLoading) return hlsLoading;
    hlsLoading = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.20/dist/hls.min.js';
      script.async = true;
      script.onload = function () { resolve(window.Hls); };
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return hlsLoading;
  };

  var attachStream = function (video) {
    var stream = video.getAttribute('data-stream');
    if (!stream) return Promise.reject(new Error('empty stream'));
    if (video.getAttribute('data-ready') === '1') return Promise.resolve();
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = stream;
      video.setAttribute('data-ready', '1');
      return Promise.resolve();
    }
    return loadHls().then(function (Hls) {
      if (Hls && Hls.isSupported()) {
        var hls = new Hls({ enableWorker: true, lowLatencyMode: true, backBufferLength: 90 });
        hls.loadSource(stream);
        hls.attachMedia(video);
        video._hlsInstance = hls;
        video.setAttribute('data-ready', '1');
        return Promise.resolve();
      }
      video.src = stream;
      video.setAttribute('data-ready', '1');
      return Promise.resolve();
    });
  };

  var playFrom = function (target) {
    var panel = target.closest('.movie-player') || document.querySelector('.movie-player');
    if (!panel) return;
    var video = panel.querySelector('video');
    if (!video) return;
    attachStream(video).then(function () {
      panel.classList.add('is-playing');
      var attempt = video.play();
      if (attempt && typeof attempt.catch === 'function') {
        attempt.catch(function () {});
      }
    }).catch(function () {});
  };

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-player-trigger]');
    if (trigger) {
      event.preventDefault();
      playFrom(trigger);
    }
  });

  Array.prototype.slice.call(document.querySelectorAll('.movie-player video')).forEach(function (video) {
    video.addEventListener('click', function () {
      if (video.paused) playFrom(video);
    });
    video.addEventListener('play', function () {
      var panel = video.closest('.movie-player');
      if (panel) panel.classList.add('is-playing');
    });
  });
})();
