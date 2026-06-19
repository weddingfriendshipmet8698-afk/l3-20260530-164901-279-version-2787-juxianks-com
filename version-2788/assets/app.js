(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function initMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var menu = document.querySelector("[data-mobile-menu]");
    if (!toggle || !menu) {
      return;
    }
    toggle.addEventListener("click", function () {
      menu.classList.toggle("is-open");
    });
  }

  function initHero() {
    var slider = document.querySelector("[data-hero-slider]");
    if (!slider) {
      return;
    }
    var slides = Array.prototype.slice.call(slider.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(slider.querySelectorAll(".hero-dots button"));
    var prev = slider.querySelector("[data-hero-prev]");
    var next = slider.querySelector("[data-hero-next]");
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        start();
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        start();
      });
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        start();
      });
    });
    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function initFilters() {
    var panels = Array.prototype.slice.call(document.querySelectorAll("[data-filter-panel]"));
    panels.forEach(function (panel) {
      var scope = panel.getAttribute("data-filter-scope") || "body";
      var root = scope === "body" ? document : document.querySelector(scope) || document;
      var input = panel.querySelector("[data-filter-input]");
      var selects = Array.prototype.slice.call(panel.querySelectorAll("[data-filter-select]"));
      var buttons = Array.prototype.slice.call(panel.querySelectorAll("[data-filter-button]"));
      var cards = Array.prototype.slice.call(root.querySelectorAll("[data-card]"));
      var empty = root.querySelector("[data-empty-state]");
      var activeQuick = "";

      function matchCard(card) {
        var text = [
          card.getAttribute("data-title"),
          card.getAttribute("data-year"),
          card.getAttribute("data-region"),
          card.getAttribute("data-type"),
          card.getAttribute("data-genre"),
          card.getAttribute("data-category")
        ].map(normalize).join(" ");
        var q = input ? normalize(input.value) : "";
        var ok = !q || text.indexOf(q) !== -1;
        if (activeQuick) {
          ok = ok && text.indexOf(normalize(activeQuick)) !== -1;
        }
        selects.forEach(function (select) {
          var value = normalize(select.value);
          if (value) {
            ok = ok && text.indexOf(value) !== -1;
          }
        });
        return ok;
      }

      function apply() {
        var visible = 0;
        cards.forEach(function (card) {
          var show = matchCard(card);
          card.classList.toggle("is-hidden", !show);
          if (show) {
            visible += 1;
          }
        });
        if (empty) {
          empty.classList.toggle("is-visible", visible === 0);
        }
      }

      if (input) {
        input.addEventListener("input", apply);
        var params = new URLSearchParams(window.location.search);
        if (!input.value && params.get("q")) {
          input.value = params.get("q");
        }
      }
      selects.forEach(function (select) {
        select.addEventListener("change", apply);
      });
      buttons.forEach(function (button) {
        button.addEventListener("click", function () {
          activeQuick = button.getAttribute("data-filter-button") || "";
          buttons.forEach(function (item) {
            item.classList.toggle("is-active", item === button);
          });
          apply();
        });
      });
      apply();
    });
  }

  window.initPlayer = function (videoId, coverId, messageId, streamUrl) {
    var video = document.getElementById(videoId);
    var cover = document.getElementById(coverId);
    var message = document.getElementById(messageId);
    var loaded = false;
    var hls = null;

    if (!video || !cover || !streamUrl) {
      return;
    }

    function setMessage(text) {
      if (message) {
        message.textContent = text || "";
      }
    }

    function bindStream() {
      if (loaded) {
        return;
      }
      loaded = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = streamUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.ERROR, function (_, data) {
          if (data && data.fatal) {
            if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
            } else if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
              hls.startLoad();
            } else {
              setMessage("视频暂时无法播放");
            }
          }
        });
      } else {
        setMessage("视频暂时无法播放");
      }
    }

    function play() {
      bindStream();
      var started = video.play();
      if (started && typeof started.catch === "function") {
        started.catch(function () {
          setMessage("点击播放器继续观看");
        });
      }
    }

    cover.addEventListener("click", play);
    video.addEventListener("play", function () {
      cover.classList.add("is-hidden");
      setMessage("");
    });
    video.addEventListener("pause", function () {
      if (!video.ended) {
        cover.classList.remove("is-hidden");
      }
    });
    video.addEventListener("ended", function () {
      cover.classList.remove("is-hidden");
    });
    window.addEventListener("pagehide", function () {
      if (hls) {
        hls.destroy();
      }
    });
  };

  ready(function () {
    initMenu();
    initHero();
    initFilters();
  });
})();
