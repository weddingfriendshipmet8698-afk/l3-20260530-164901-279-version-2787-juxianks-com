(function () {
  const body = document.body;
  const menuButton = document.querySelector('.menu-toggle');
  if (menuButton) {
    menuButton.addEventListener('click', function () {
      const opened = body.classList.toggle('menu-open');
      menuButton.setAttribute('aria-expanded', opened ? 'true' : 'false');
    });
  }

  const slides = Array.from(document.querySelectorAll('.hero-slide'));
  const dots = Array.from(document.querySelectorAll('.hero-dots button'));
  let current = 0;
  function showSlide(index) {
    if (!slides.length) return;
    current = (index + slides.length) % slides.length;
    slides.forEach(function (slide, i) {
      slide.classList.toggle('active', i === current);
    });
    dots.forEach(function (dot, i) {
      dot.classList.toggle('active', i === current);
    });
  }
  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () {
      showSlide(i);
    });
  });
  if (slides.length > 1) {
    showSlide(0);
    setInterval(function () {
      showSlide(current + 1);
    }, 5200);
  }

  const searchInput = document.querySelector('[data-filter-input]');
  const yearSelect = document.querySelector('[data-filter-year]');
  const typeSelect = document.querySelector('[data-filter-type]');
  const cards = Array.from(document.querySelectorAll('[data-title]'));
  function applyFilter() {
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const year = yearSelect ? yearSelect.value : '';
    const type = typeSelect ? typeSelect.value : '';
    cards.forEach(function (card) {
      const text = [
        card.dataset.title,
        card.dataset.region,
        card.dataset.type,
        card.dataset.genre,
        card.dataset.tags
      ].join(' ').toLowerCase();
      const okQuery = !query || text.indexOf(query) !== -1;
      const okYear = !year || card.dataset.year === year;
      const okType = !type || card.dataset.type === type;
      card.classList.toggle('hidden-card', !(okQuery && okYear && okType));
    });
  }
  [searchInput, yearSelect, typeSelect].forEach(function (el) {
    if (el) el.addEventListener('input', applyFilter);
    if (el) el.addEventListener('change', applyFilter);
  });
})();

function setupPlayer(streamUrl) {
  const video = document.querySelector('[data-player]');
  const cover = document.querySelector('[data-player-cover]');
  const button = document.querySelector('[data-player-button]');
  if (!video || !streamUrl) return;
  let loaded = false;
  function loadVideo() {
    if (loaded) return;
    loaded = true;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
    } else if (window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls({ enableWorker: true });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
    } else {
      video.src = streamUrl;
    }
  }
  function start() {
    loadVideo();
    if (cover) cover.classList.add('hidden');
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function () {});
    }
  }
  if (cover) cover.addEventListener('click', start);
  if (button) button.addEventListener('click', start);
  video.addEventListener('play', function () {
    if (cover) cover.classList.add('hidden');
  });
  video.addEventListener('click', function () {
    if (!loaded) start();
  });
}
