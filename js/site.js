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
      overlay.className = 'w-lightbox-overlay';
      overlay.innerHTML = `
        <div class="w-lightbox-backdrop"></div>
        <div class="w-lightbox-container">
          <div class="w-lightbox-content">
            <div class="w-lightbox-view">
              <img class="w-lightbox-img" src="" alt="">
            </div>
            <div class="w-lightbox-control w-lightbox-left"></div>
            <div class="w-lightbox-control w-lightbox-right"></div>
            <div class="w-lightbox-close"></div>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      // Стили для лайтбокса
      const style = document.createElement('style');
      style.textContent = `
        .w-lightbox-overlay {
          position: fixed; inset: 0; z-index: 10000;
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.3s;
          pointer-events: none;
        }
        .w-lightbox-overlay.w--open {
          opacity: 1; pointer-events: auto;
        }
        .w-lightbox-backdrop {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.9);
        }
        .w-lightbox-container {
          position: relative; z-index: 1;
          max-width: 90vw; max-height: 90vh;
        }
        .w-lightbox-content {
          position: relative;
        }
        .w-lightbox-img {
          max-width: 90vw; max-height: 90vh;
          object-fit: contain; display: block;
        }
        .w-lightbox-close {
          position: absolute; top: -40px; right: 0;
          width: 32px; height: 32px; cursor: pointer;
        }
        .w-lightbox-close::before, .w-lightbox-close::after {
          content: ''; position: absolute;
          top: 50%; left: 50%;
          width: 24px; height: 2px;
          background: white;
        }
        .w-lightbox-close::before { transform: translate(-50%, -50%) rotate(45deg); }
        .w-lightbox-close::after { transform: translate(-50%, -50%) rotate(-45deg); }
        .w-lightbox-control {
          position: absolute; top: 50%; width: 48px; height: 48px;
          cursor: pointer; transform: translateY(-50%);
        }
        .w-lightbox-control::after {
          content: ''; position: absolute;
          top: 50%; left: 50%;
          width: 16px; height: 16px;
          border: 2px solid white;
          border-top: none; border-right: none;
        }
        .w-lightbox-left { left: -60px; }
        .w-lightbox-left::after { transform: translate(-30%, -50%) rotate(45deg); }
        .w-lightbox-right { right: -60px; }
        .w-lightbox-right::after { transform: translate(-70%, -50%) rotate(-135deg); }
        @media (max-width: 768px) {
          .w-lightbox-left { left: 8px; }
          .w-lightbox-right { right: 8px; }
          .w-lightbox-close { top: 8px; right: 8px; }
        }
      `;
      document.head.appendChild(style);

      // Обработчики
      overlay.querySelector('.w-lightbox-backdrop').addEventListener('click', closeLightbox);
      overlay.querySelector('.w-lightbox-close').addEventListener('click', closeLightbox);
      overlay.querySelector('.w-lightbox-left').addEventListener('click', () => navigateLightbox(-1));
      overlay.querySelector('.w-lightbox-right').addEventListener('click', () => navigateLightbox(1));

      document.addEventListener('keydown', (e) => {
        if (!overlay.classList.contains('w--open')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigateLightbox(-1);
        if (e.key === 'ArrowRight') navigateLightbox(1);
      });

      return overlay;
    }

    let currentItems = [];
    let currentIndex = 0;

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
      const item = currentItems[index];
      const img = overlay.querySelector('.w-lightbox-img');
      // Используем локальный путь вместо CDN
      const src = item.url && item.url.includes('website-files.com')
        ? 'images/' + item.fileName
        : (item.url || 'images/' + item.fileName);
      img.src = src;

      // Показать/скрыть стрелки
      overlay.querySelector('.w-lightbox-left').style.display = currentItems.length > 1 ? '' : 'none';
      overlay.querySelector('.w-lightbox-right').style.display = currentItems.length > 1 ? '' : 'none';
    }

    function navigateLightbox(dir) {
      currentIndex = (currentIndex + dir + currentItems.length) % currentItems.length;
      showItem(currentIndex);
    }

    // Привязать к элементам w-lightbox
    document.querySelectorAll('.w-lightbox').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const jsonEl = el.querySelector('.w-json');
        if (!jsonEl) return;
        try {
          const data = JSON.parse(jsonEl.textContent);
          if (data.items && data.items.length) {
            openLightbox(data.items, 0);
          }
        } catch (err) {
          console.warn('Lightbox: ошибка парсинга JSON', err);
        }
      });
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
