(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const mobilePanel = document.querySelector('.mobile-panel');

  if (menuButton && mobilePanel) {
    menuButton.addEventListener('click', () => {
      const open = mobilePanel.hasAttribute('hidden');
      if (open) {
        mobilePanel.removeAttribute('hidden');
      } else {
        mobilePanel.setAttribute('hidden', '');
      }
      menuButton.setAttribute('aria-expanded', String(open));
    });
  }

  document.querySelectorAll('[data-carousel]').forEach((carousel) => {
    const slides = Array.from(carousel.querySelectorAll('.hero-slide'));
    const dots = Array.from(carousel.querySelectorAll('.hero-dot'));
    if (!slides.length || !dots.length) {
      return;
    }

    let activeIndex = 0;
    let timer = null;

    const show = (index) => {
      activeIndex = (index + slides.length) % slides.length;
      slides.forEach((slide, current) => {
        slide.classList.toggle('is-active', current === activeIndex);
      });
      dots.forEach((dot, current) => {
        dot.classList.toggle('active', current === activeIndex);
      });
    };

    const start = () => {
      window.clearInterval(timer);
      timer = window.setInterval(() => show(activeIndex + 1), 5200);
    };

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const next = Number(dot.getAttribute('data-slide') || '0');
        show(next);
        start();
      });
    });

    show(0);
    start();
  });

  document.querySelectorAll('[data-filter-scope]').forEach((scope) => {
    const input = scope.querySelector('[data-card-search]');
    const year = scope.querySelector('[data-year-filter]');
    const list = scope.parentElement ? scope.parentElement.querySelector('[data-card-list]') : null;
    const cards = list ? Array.from(list.querySelectorAll('.movie-card')) : [];

    if (!cards.length) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const query = params.get('q') || '';
    if (input && query) {
      input.value = query;
    }

    const filter = () => {
      const keyword = input ? input.value.trim().toLowerCase() : '';
      const yearValue = year ? year.value : '';
      cards.forEach((card) => {
        const haystack = [
          card.dataset.title || '',
          card.dataset.region || '',
          card.dataset.genre || '',
          card.dataset.tags || '',
          card.dataset.year || ''
        ].join(' ').toLowerCase();
        const keywordOk = !keyword || haystack.includes(keyword);
        const yearOk = !yearValue || card.dataset.year === yearValue;
        card.hidden = !(keywordOk && yearOk);
      });
    };

    if (input) {
      input.addEventListener('input', filter);
    }
    if (year) {
      year.addEventListener('change', filter);
    }
    filter();
  });
})();
