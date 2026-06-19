(function () {
  var menuButton = document.querySelector('.menu-toggle');
  var mobileNav = document.querySelector('.mobile-nav');

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', function () {
      var isOpen = mobileNav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(isOpen));
    });
  }

  var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('.hero-dot'));
  var slideIndex = 0;

  function showSlide(nextIndex) {
    if (!slides.length) {
      return;
    }

    slideIndex = (nextIndex + slides.length) % slides.length;

    slides.forEach(function (slide, index) {
      slide.classList.toggle('active', index === slideIndex);
    });

    dots.forEach(function (dot, index) {
      dot.classList.toggle('active', index === slideIndex);
    });
  }

  dots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      var nextIndex = Number(dot.getAttribute('data-slide')) || 0;
      showSlide(nextIndex);
    });
  });

  if (slides.length > 1) {
    setInterval(function () {
      showSlide(slideIndex + 1);
    }, 5600);
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function bindFilter(input) {
    var grid = input.closest('section') ? input.closest('section').nextElementSibling : document;
    var cards = Array.prototype.slice.call(document.querySelectorAll('.searchable-card'));

    input.addEventListener('input', function () {
      var keyword = normalize(input.value);
      var sourceCards = grid ? Array.prototype.slice.call(grid.querySelectorAll('.searchable-card')) : cards;

      if (!sourceCards.length) {
        sourceCards = cards;
      }

      sourceCards.forEach(function (card) {
        var haystack = normalize([
          card.getAttribute('data-title'),
          card.getAttribute('data-year'),
          card.getAttribute('data-type'),
          card.getAttribute('data-genre'),
          card.textContent
        ].join(' '));
        card.style.display = !keyword || haystack.indexOf(keyword) !== -1 ? '' : 'none';
      });
    });
  }

  Array.prototype.slice.call(document.querySelectorAll('[data-filter-input]')).forEach(bindFilter);

  var params = new URLSearchParams(window.location.search);
  var q = params.get('q');
  var searchInput = document.querySelector('#global-search-form [data-filter-input]');

  if (q && searchInput) {
    searchInput.value = q;
    searchInput.dispatchEvent(new Event('input'));
  }

  function setupPlayer(video) {
    var source = video.getAttribute('data-hls') || '';
    var shell = video.closest('.player-shell');
    var cover = shell ? shell.querySelector('.play-cover') : null;
    var started = false;

    function attachSource() {
      if (started) {
        return;
      }
      started = true;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
      } else if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls();
        hls.loadSource(source);
        hls.attachMedia(video);
      } else {
        video.src = source;
      }
    }

    function startPlayback() {
      attachSource();
      if (cover) {
        cover.classList.add('hidden');
      }
      var attempt = video.play();
      if (attempt && typeof attempt.catch === 'function') {
        attempt.catch(function () {});
      }
    }

    if (cover) {
      cover.addEventListener('click', startPlayback);
    }

    video.addEventListener('click', function () {
      if (video.paused) {
        startPlayback();
      }
    });

    video.addEventListener('play', function () {
      if (cover) {
        cover.classList.add('hidden');
      }
    });
  }

  Array.prototype.slice.call(document.querySelectorAll('video[data-hls]')).forEach(setupPlayer);
})();
