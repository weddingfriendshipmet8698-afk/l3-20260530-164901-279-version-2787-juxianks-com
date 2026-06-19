(function () {
  var menuButton = document.querySelector('[data-menu-button]');
  var navMenu = document.querySelector('[data-nav-menu]');

  if (menuButton && navMenu) {
    menuButton.addEventListener('click', function () {
      navMenu.classList.toggle('is-open');
    });
  }

  var searchInput = document.querySelector('[data-card-search]');
  if (searchInput) {
    var cards = Array.prototype.slice.call(document.querySelectorAll('.movie-card'));
    searchInput.addEventListener('input', function () {
      var keyword = searchInput.value.trim().toLowerCase();
      cards.forEach(function (card) {
        var haystack = [
          card.getAttribute('data-title'),
          card.getAttribute('data-tags'),
          card.getAttribute('data-region'),
          card.getAttribute('data-year')
        ].join(' ').toLowerCase();
        card.classList.toggle('is-hidden-card', keyword && haystack.indexOf(keyword) === -1);
      });
    });
  }

  var hero = document.querySelector('[data-hero]');
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var current = 0;
    var timer = null;

    function showSlide(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(function () {
        showSlide(current + 1);
      }, 5200);
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        showSlide(index);
        restart();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        showSlide(current - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        showSlide(current + 1);
        restart();
      });
    }

    restart();
  }
})();
