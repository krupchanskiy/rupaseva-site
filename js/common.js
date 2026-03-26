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
    }
  });
})();
