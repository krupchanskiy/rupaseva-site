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

      // ─── Marquee: случайный порядок фото с min-distance между копиями ───
      // Объединяем оба .marque-track одной ленты в общий пул (поток непрерывный
      // при анимации), перемешиваем с условием "между копиями одной фото ≥ 4
      // других", раскидываем обратно по двум track пополам.
      var MIN_DISTANCE = 4;
      var keyOf = function (el) {
        var img = el.querySelector('img');
        return img ? (img.getAttribute('src') || '') : '';
      };
      var shuffleWithMinDistance = function (items, minDistance) {
        var n = items.length;
        for (var attempt = 0; attempt < 50; attempt++) {
          var pool = items.slice();
          for (var i = pool.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
          }
          var out = [];
          var ok = true;
          while (pool.length) {
            var recent = out.slice(-minDistance).map(keyOf);
            var pickedIdx = -1;
            for (var k = 0; k < pool.length; k++) {
              if (recent.indexOf(keyOf(pool[k])) === -1) { pickedIdx = k; break; }
            }
            if (pickedIdx === -1) { ok = false; pickedIdx = 0; }
            out.push(pool[pickedIdx]);
            pool.splice(pickedIdx, 1);
          }
          if (ok) return out;
        }
        // best-effort, если ограничение недостижимо (слишком много дублей) —
        // понижаем требуемую дистанцию на 1 и пробуем снова.
        if (minDistance > 1) return shuffleWithMinDistance(items, minDistance - 1);
        return items.slice();
      };

      document.querySelectorAll('.marquee-wrapper').forEach(function (wrapper) {
        var tracks = wrapper.querySelectorAll('.marque-track');
        if (tracks.length === 0) return;
        var all = [];
        tracks.forEach(function (t) {
          Array.prototype.forEach.call(t.children, function (c) { all.push(c); });
        });
        var shuffled = shuffleWithMinDistance(all, MIN_DISTANCE);
        // Раскидываем обратно поровну
        var perTrack = Math.ceil(shuffled.length / tracks.length);
        tracks.forEach(function (t, ti) {
          while (t.firstChild) t.removeChild(t.firstChild);
          shuffled.slice(ti * perTrack, (ti + 1) * perTrack).forEach(function (el) {
            t.appendChild(el);
          });
        });
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
