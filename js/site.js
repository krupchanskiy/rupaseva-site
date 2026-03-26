/**
 * site.js — замена webflow.js
 * Поддерживает компоненты: w-nav, w-dropdown, w-tabs, w-lightbox, w-background-video
 */

(function () {
  'use strict';

  // ─── W-NAV (навигация, бургер-меню) ───

  function initNav() {
    document.querySelectorAll('.w-nav').forEach(nav => {
      const btn = nav.querySelector('.w-nav-button');
      const menu = nav.querySelector('.w-nav-menu');
      const noScroll = nav.dataset.noScroll === '1';

      if (!btn || !menu) return;

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = menu.classList.toggle('w--open');
        btn.classList.toggle('w--open', isOpen);
        btn.setAttribute('aria-expanded', isOpen);

        if (noScroll) {
          document.body.style.overflow = isOpen ? 'hidden' : '';
        }
      });

      // Закрыть меню при клике на ссылку
      menu.querySelectorAll('.w-nav-link').forEach(link => {
        link.addEventListener('click', () => {
          menu.classList.remove('w--open');
          btn.classList.remove('w--open');
          btn.setAttribute('aria-expanded', 'false');
          if (noScroll) document.body.style.overflow = '';
        });
      });

      // Закрыть при клике вне меню
      document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && menu.classList.contains('w--open')) {
          menu.classList.remove('w--open');
          btn.classList.remove('w--open');
          btn.setAttribute('aria-expanded', 'false');
          if (noScroll) document.body.style.overflow = '';
        }
      });

      // Закрыть при ресайзе если экран стал широким
      const collapse = nav.dataset.collapse || 'medium';
      const breakpoints = { small: 480, medium: 768, large: 992 };
      const bp = breakpoints[collapse] || 768;

      window.addEventListener('resize', () => {
        if (window.innerWidth >= bp && menu.classList.contains('w--open')) {
          menu.classList.remove('w--open');
          btn.classList.remove('w--open');
          btn.setAttribute('aria-expanded', 'false');
          if (noScroll) document.body.style.overflow = '';
        }
      });
    });
  }

  // ─── W-DROPDOWN (выпадающие меню / тултипы на карте) ───

  function initDropdowns() {
    document.querySelectorAll('.w-dropdown').forEach(dd => {
      const toggle = dd.querySelector('.w-dropdown-toggle');
      const list = dd.querySelector('.w-dropdown-list');
      if (!toggle || !list) return;

      const hover = dd.dataset.hover === 'true';
      const delay = parseInt(dd.dataset.delay) || 0;
      let closeTimer = null;

      function open() {
        clearTimeout(closeTimer);
        // Закрыть другие
        document.querySelectorAll('.w-dropdown.w--open').forEach(other => {
          if (other !== dd) close(other);
        });
        dd.classList.add('w--open');
        list.classList.add('w--open');
        toggle.classList.add('w--open');
      }

      function close(target) {
        target = target || dd;
        target.classList.remove('w--open');
        target.querySelector('.w-dropdown-list')?.classList.remove('w--open');
        target.querySelector('.w-dropdown-toggle')?.classList.remove('w--open');
      }

      function scheduleClose() {
        closeTimer = setTimeout(() => close(), delay);
      }

      if (hover) {
        dd.addEventListener('mouseenter', open);
        dd.addEventListener('mouseleave', scheduleClose);
      }

      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (dd.classList.contains('w--open')) {
          close();
        } else {
          open();
        }
      });
    });

    // Закрыть при клике вне dropdown
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.w-dropdown')) {
        document.querySelectorAll('.w-dropdown.w--open').forEach(dd => {
          dd.classList.remove('w--open');
          dd.querySelector('.w-dropdown-list')?.classList.remove('w--open');
          dd.querySelector('.w-dropdown-toggle')?.classList.remove('w--open');
        });
      }
    });
  }

  // ─── W-TABS (вкладки) ───

  function initTabs() {
    document.querySelectorAll('.w-tabs').forEach(tabs => {
      const menu = tabs.querySelector('.w-tab-menu');
      const content = tabs.querySelector('.w-tab-content');
      if (!menu || !content) return;

      const links = menu.querySelectorAll('.w-tab-link');
      const panes = content.querySelectorAll('.w-tab-pane');

      links.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const tabName = link.dataset.wTab;

          // Деактивировать все
          links.forEach(l => l.classList.remove('w--current'));
          panes.forEach(p => p.classList.remove('w--tab-active'));

          // Активировать выбранную
          link.classList.add('w--current');
          panes.forEach(p => {
            if (p.dataset.wTab === tabName) {
              p.classList.add('w--tab-active');
            }
          });
        });
      });
    });
  }

  // ─── W-LIGHTBOX (просмотр изображений) ───

  function initLightbox() {
    let overlay = null;

    function createOverlay() {
      overlay = document.createElement('div');
      overlay.className = 'site-lb-overlay';
      overlay.innerHTML = `
        <div class="site-lb-backdrop"></div>
        <div class="site-lb-container">
          <div class="site-lb-content">
            <div class="site-lb-view">
              <img class="site-lb-img" src="" alt="">
            </div>
            <div class="site-lb-control site-lb-left"></div>
            <div class="site-lb-control site-lb-right"></div>
            <div class="site-lb-close"></div>
            <div class="site-lb-counter"></div>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      var style = document.createElement('style');
      style.textContent = `
        .site-lb-overlay {
          position: fixed; inset: 0; z-index: 10000;
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.3s;
          pointer-events: none;
        }
        .site-lb-overlay.w--open {
          opacity: 1; pointer-events: auto;
        }
        .site-lb-backdrop {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.9);
        }
        .site-lb-container {
          position: relative; z-index: 1;
          max-width: 90vw; max-height: 90vh;
        }
        .site-lb-content {
          position: relative;
        }
        .site-lb-img {
          max-width: 90vw; max-height: 90vh;
          object-fit: contain; display: block;
        }
        .site-lb-close {
          position: absolute; top: -40px; right: 0;
          width: 32px; height: 32px; cursor: pointer;
        }
        .site-lb-close::before, .site-lb-close::after {
          content: ''; position: absolute;
          top: 50%; left: 50%;
          width: 24px; height: 2px;
          background: white;
        }
        .site-lb-close::before { transform: translate(-50%, -50%) rotate(45deg); }
        .site-lb-close::after { transform: translate(-50%, -50%) rotate(-45deg); }
        .site-lb-control {
          position: absolute; top: 50%; width: 48px; height: 48px;
          cursor: pointer; transform: translateY(-50%);
        }
        .site-lb-control::after {
          content: ''; position: absolute;
          top: 50%; left: 50%;
          width: 16px; height: 16px;
          border: 2px solid white;
          border-top: none; border-right: none;
        }
        .site-lb-left { left: -60px; }
        .site-lb-left::after { transform: translate(-30%, -50%) rotate(45deg); }
        .site-lb-right { right: -60px; }
        .site-lb-right::after { transform: translate(-70%, -50%) rotate(-135deg); }
        .site-lb-counter {
          position: absolute; bottom: -32px; left: 50%;
          transform: translateX(-50%);
          color: rgba(255,255,255,0.6); font-size: 14px;
        }
        @media (max-width: 768px) {
          .site-lb-left { left: 8px; }
          .site-lb-right { right: 8px; }
          .site-lb-close { top: 8px; right: 8px; }
        }
      `;
      document.head.appendChild(style);

      overlay.querySelector('.site-lb-backdrop').addEventListener('click', closeLightbox);
      overlay.querySelector('.site-lb-close').addEventListener('click', closeLightbox);
      overlay.querySelector('.site-lb-left').addEventListener('click', function() { navigateLightbox(-1); });
      overlay.querySelector('.site-lb-right').addEventListener('click', function() { navigateLightbox(1); });

      // Свайп на мобильных
      var touchStartX = 0;
      overlay.addEventListener('touchstart', function(e) { touchStartX = e.changedTouches[0].screenX; });
      overlay.addEventListener('touchend', function(e) {
        var diff = e.changedTouches[0].screenX - touchStartX;
        if (Math.abs(diff) > 50) navigateLightbox(diff > 0 ? -1 : 1);
      });

      document.addEventListener('keydown', function(e) {
        if (!overlay || !overlay.classList.contains('w--open')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigateLightbox(-1);
        if (e.key === 'ArrowRight') navigateLightbox(1);
      });

      return overlay;
    }

    var currentItems = [];
    var currentIndex = 0;

    // Получить src для лайтбокса — берём из img элемента или из JSON
    function getLocalSrc(item) {
      // Если при сборе группы сохранили src из img — используем его
      if (item._localSrc) return item._localSrc;
      // Fallback — fileName из JSON
      return 'images/' + item.fileName;
    }

    function openLightbox(items, index) {
      if (!overlay) createOverlay();
      currentItems = items;
      currentIndex = index || 0;
      showItem(currentIndex);
      overlay.classList.add('w--open');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      if (!overlay) return;
      overlay.classList.remove('w--open');
      document.body.style.overflow = '';
    }

    function showItem(index) {
      if (!overlay || !currentItems.length) return;
      var item = currentItems[index];
      var img = overlay.querySelector('.site-lb-img');
      img.src = getLocalSrc(item);

      var hasMultiple = currentItems.length > 1;
      overlay.querySelector('.site-lb-left').style.display = hasMultiple ? '' : 'none';
      overlay.querySelector('.site-lb-right').style.display = hasMultiple ? '' : 'none';
      overlay.querySelector('.site-lb-counter').textContent = hasMultiple
        ? (index + 1) + ' / ' + currentItems.length : '';
    }

    function navigateLightbox(dir) {
      currentIndex = (currentIndex + dir + currentItems.length) % currentItems.length;
      showItem(currentIndex);
    }

    // Собрать группы: все lightbox-элементы с одинаковой group объединяются
    var groups = {};
    var lightboxElements = document.querySelectorAll('.w-lightbox');

    lightboxElements.forEach(function(el) {
      var jsonEl = el.querySelector('.w-json');
      if (!jsonEl) return;
      try {
        var data = JSON.parse(jsonEl.textContent);
        if (!data.items || !data.items.length) return;

        // Сохраняем src из img элемента — он уже содержит правильный относительный путь
        var imgEl = el.querySelector('img');
        var localSrc = imgEl ? imgEl.getAttribute('src') : null;
        if (localSrc) {
          data.items[0]._localSrc = localSrc;
        }

        var groupName = data.group || '';
        if (groupName) {
          if (!groups[groupName]) groups[groupName] = [];
          var groupIndex = groups[groupName].length;
          data.items.forEach(function(item) { groups[groupName].push(item); });
          el._lightboxGroup = groupName;
          el._lightboxIndex = groupIndex;
        } else {
          el._lightboxItems = data.items;
        }
      } catch (err) {
        // ignore
      }
    });

    // Клик на лайтбокс — делегирование на document
    document.addEventListener('click', function(e) {
      var el = e.target.closest('.w-lightbox');
      if (!el) return;

      e.preventDefault();

      if (el._lightboxGroup && groups[el._lightboxGroup]) {
        openLightbox(groups[el._lightboxGroup], el._lightboxIndex);
      } else if (el._lightboxItems) {
        openLightbox(el._lightboxItems, 0);
      }
    });
  }

  // ─── W-BACKGROUND-VIDEO ───

  function initBackgroundVideo() {
    document.querySelectorAll('.w-background-video').forEach(el => {
      const video = el.querySelector('video');
      if (!video) return;

      // Обеспечить автовоспроизведение
      if (el.dataset.autoplay === 'true') {
        video.muted = true;
        video.playsInline = true;
        video.play().catch(() => {});
      }
    });
  }

  // ─── W--CURRENT (активная ссылка) ───

  function initCurrentLinks() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';

    document.querySelectorAll('.w-nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      const linkPage = href.split('/').pop();
      if (linkPage === page) {
        link.classList.add('w--current');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('w--current');
        link.removeAttribute('aria-current');
      }
    });
  }

  // ─── CUSTOM CURSOR (блок «Что мы еще делаем») ───

  function initCustomCursor() {
    const cursorWrapper = document.getElementById('cursor-wrapper');
    const customCursor = document.getElementById('custom-cursor');
    const linksContainer = document.getElementById('links-container');
    if (!cursorWrapper || !customCursor || !linksContainer) return;

    // Только для устройств с hover (не тач)
    if (!window.matchMedia('(hover: hover)').matches) return;

    let isInside = false;
    let cursorX = 0, cursorY = 0;

    // Скрыть курсор изначально
    customCursor.style.opacity = '0';
    customCursor.style.position = 'fixed';
    customCursor.style.pointerEvents = 'none';
    customCursor.style.transform = 'translate(-50%, -50%)';
    customCursor.style.transition = 'opacity 0.2s';

    // Убрать flex-центровку у wrapper (позиционируем вручную)
    cursorWrapper.style.display = 'block';
    cursorWrapper.style.alignItems = '';
    cursorWrapper.style.justifyContent = '';

    document.addEventListener('mousemove', (e) => {
      cursorX = e.clientX;
      cursorY = e.clientY;
      if (isInside) {
        customCursor.style.left = cursorX + 'px';
        customCursor.style.top = cursorY + 'px';
      }
    });

    linksContainer.addEventListener('mouseenter', () => {
      isInside = true;
      customCursor.style.opacity = '1';
      customCursor.style.left = cursorX + 'px';
      customCursor.style.top = cursorY + 'px';
    });

    linksContainer.addEventListener('mouseleave', () => {
      isInside = false;
      customCursor.style.opacity = '0';
    });
  }

  // ─── Инициализация ───

  function init() {
    initNav();
    initDropdowns();
    initTabs();
    initLightbox();
    initBackgroundVideo();
    initCurrentLinks();
    initCustomCursor();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
