/**
 * common.js — общий код для всех страниц
 * Navbar scroll-поведение + Lenis smooth scroll + GSAP ScrollTrigger
 */

(function () {
  'use strict';

  // ─── Nav-cover: скрытие/показ + фон при скролле ───

  var navCover = document.querySelector('.nav-cover');
  if (navCover) {
    var lastScrollTop = 0;
    window.addEventListener('scroll', function () {
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      if (scrollTop > lastScrollTop && scrollTop > 100) {
        navCover.style.transform = 'translateY(-100%)';
        navCover.classList.remove('scrolled-up', 'starting');
      } else {
        navCover.style.transform = 'translateY(0)';
        if (scrollTop > 100 && scrollTop <= 200) {
          navCover.classList.add('starting');
          navCover.classList.remove('scrolled-up');
        } else if (scrollTop <= 100) {
          navCover.classList.remove('scrolled-up', 'starting');
        } else {
          navCover.classList.add('scrolled-up');
          navCover.classList.remove('starting');
        }
      }
      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    });
  }

  // ─── Navbar / Navbar2: показ/скрытие по направлению скролла ───

  document.addEventListener('DOMContentLoaded', function () {
    ['.navbar', '.navbar2'].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (!el) return;
      var last = 0;
      var offset = 20;
      window.addEventListener('scroll', function () {
        var top = window.pageYOffset || document.documentElement.scrollTop;
        if (Math.abs(top - last) > offset) {
          if (top > last) {
            el.classList.remove('active');
          } else {
            el.classList.add('active');
          }
          last = top;
        }
      });
    });

    // ─── Lenis smooth scroll + GSAP ScrollTrigger ───

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && typeof Lenis !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
      var lenis = new Lenis();
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);

      // ─── Marquee: случайный порядок фото внутри каждой .marque-track ───
      // Fisher-Yates shuffle при загрузке страницы.
      document.querySelectorAll('.marque-track').forEach(function (track) {
        var items = Array.prototype.slice.call(track.children);
        for (var i = items.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var tmp = items[i]; items[i] = items[j]; items[j] = tmp;
        }
        items.forEach(function (el) { track.appendChild(el); });
      });

      // ─── Marquee: горизонтальный сдвиг ленты при скролле страницы ───
      // Восстанавливает Webflow-анимацию SCROLLING_IN_VIEW (action a-20).
      // Чётные ленты двигаются влево, нечётные — вправо (зеркально).
      document.querySelectorAll('.marquee-wrapper').forEach(function (wrapper, idx) {
        var container = wrapper.querySelector('.marque-container');
        if (!container) return;
        var goesLeft = idx % 2 === 0;
        gsap.fromTo(
          container,
          { xPercent: goesLeft ? 0 : -50 },
          {
            xPercent: goesLeft ? -50 : 0,
            ease: 'none',
            scrollTrigger: {
              trigger: wrapper,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1
            }
          }
        );
      });
    }
  });
})();
