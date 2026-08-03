/**
 * Aero Suite — tour em vídeo (poster + modal com player, tela cheia e compartilhar).
 */
(function () {
  'use strict';

  function initTourVideo(root) {
    if (!root || root.dataset.asTourVideoInit === '1') return;
    root.dataset.asTourVideoInit = '1';

    var modal = root.querySelector('[data-as-tour-video-modal]');
    var dialog = null;
    if (modal) dialog = modal.querySelector('[role="dialog"]');
    var video = root.querySelector('[data-as-tour-video-player]');
    var playerWrap = root.querySelector('[data-as-tour-video-player-wrap]');
    var openBtn = root.querySelector('[data-as-tour-video-open]');
    var shareBtn = root.querySelector('[data-as-tour-video-share]');
    var shareMenu = root.querySelector('[data-as-tour-video-share-menu]');
    var copyBtn = root.querySelector('[data-as-tour-video-copy-link]');
    var fullscreenBtn = root.querySelector('[data-as-tour-video-fullscreen]');
    var closeEls = root.querySelectorAll('[data-as-tour-video-close]');
    var shareUrl = root.getAttribute('data-as-share-url') || window.location.href;
    var shareText = root.getAttribute('data-as-share-text') || document.title;
    var lastFocus = null;

    if (!modal || !video || !openBtn) return;

    function setShareMenu(open) {
      if (!shareMenu || !shareBtn) return;
      shareMenu.hidden = !open;
      shareBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function openModal() {
      lastFocus = document.activeElement;
      modal.hidden = false;
      modal.setAttribute('aria-hidden', 'false');
      document.documentElement.classList.add('as-tour-video-modal-open');
      try {
        video.currentTime = 0;
        var playPromise = video.play();
        if (playPromise) {
          if (playPromise.catch) {
            playPromise.catch(function () {
              /* autoplay bloqueado — usuário usa controles nativos */
            });
          }
        }
      } catch (err) {
        /* ignore */
      }
      var closeBtn = modal.querySelector('.as-tour-video-modal__btn--close');
      if (closeBtn) closeBtn.focus();
    }

    function closeModal() {
      video.pause();
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'true');
      document.documentElement.classList.remove('as-tour-video-modal-open');
      setShareMenu(false);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(function () {});
      }
      if (lastFocus) {
        if (lastFocus.focus) lastFocus.focus();
      }
    }

    function toggleFullscreen() {
      var target = playerWrap || video;
      if (!target) return;
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(function () {});
        return;
      }
      if (target.requestFullscreen) {
        target.requestFullscreen().catch(function () {
          if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
        });
      } else if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
      }
    }

    function copyShareLink() {
      var text = shareUrl;
      if (navigator.clipboard) {
        if (navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(showCopied).catch(fallbackCopy);
          return;
        }
      }
      fallbackCopy();
    }

    function fallbackCopy() {
      var ta = document.createElement('textarea');
      ta.value = shareUrl;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        showCopied();
      } catch (err) {
        /* ignore */
      }
      document.body.removeChild(ta);
    }

    function showCopied() {
      if (!copyBtn) return;
      var prev = copyBtn.textContent;
      copyBtn.textContent = 'Link copiado!';
      setTimeout(function () {
        copyBtn.textContent = prev;
      }, 2000);
    }

    function nativeShare() {
      if (!navigator.share) return false;
      navigator
        .share({ title: shareText, text: shareText, url: shareUrl })
        .catch(function () {});
      return true;
    }

    openBtn.addEventListener('click', openModal);

    closeEls.forEach(function (el) {
      el.addEventListener('click', closeModal);
    });

    if (shareBtn) {
      shareBtn.addEventListener('click', function () {
        if (navigator.share) {
          nativeShare();
          return;
        }
        var menuHidden = shareMenu ? shareMenu.hidden : true;
        setShareMenu(menuHidden);
      });
    }

    if (copyBtn) copyBtn.addEventListener('click', copyShareLink);

    if (fullscreenBtn) fullscreenBtn.addEventListener('click', toggleFullscreen);

    document.addEventListener('keydown', function (e) {
      if (modal.hidden) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
      }
    });

    modal.addEventListener('click', function (e) {
      if (e.target === modal.querySelector('.as-tour-video-modal__backdrop')) {
        closeModal();
      }
    });

    if (window.location.hash === '#video-tour') {
      if (/[?&]play=1(?:&|$)/.test(window.location.search)) {
        setTimeout(openModal, 400);
      }
    }
  }

  function boot() {
    document.querySelectorAll('[data-as-tour-video-root]').forEach(initTourVideo);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
