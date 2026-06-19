(() => {
  const video = document.getElementById('videoPlayer');
  const button = document.getElementById('playButton');
  const url = typeof streamUrl === 'string' ? streamUrl : '';
  let attached = false;
  let instance = null;

  const attach = () => {
    if (!video || !url || attached) {
      return;
    }
    attached = true;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
    } else if (window.Hls && window.Hls.isSupported()) {
      instance = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      instance.loadSource(url);
      instance.attachMedia(video);
    } else {
      video.src = url;
    }
  };

  const play = () => {
    attach();
    if (button) {
      button.classList.add('is-hidden');
    }
    if (video) {
      const promise = video.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(() => {});
      }
    }
  };

  if (button) {
    button.addEventListener('click', play);
  }
  if (video) {
    video.addEventListener('click', () => {
      if (!attached) {
        play();
      }
    });
  }
  window.addEventListener('pagehide', () => {
    if (instance) {
      instance.destroy();
    }
  });
})();
