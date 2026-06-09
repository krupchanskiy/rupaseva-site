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
      // Объединяем оба .marque-track одной ленты в общий пул, обрезаем лишние
      // копии каждой фото до математически допустимого предела (чтобы между
      // соседними копиями было ≥ MIN_BETWEEN других фото), перемешиваем
      // greedy-алгоритмом, раскидываем обратно по двум track поровну.
      var MIN_BETWEEN = 5; // минимум 5 других фото между копиями
      var keyOf = function (el) {
        var img = el.querySelector('img');
        return img ? (img.getAttribute('src') || '') : '';
      };

      // Жадная расстановка с условием: новый элемент не должен совпадать
      // ни с одним из последних `minBetween` уже размещённых.
      var shuffleWithMinDistance = function (items, minBetween) {
        for (var attempt = 0; attempt < 50; attempt++) {
          var pool = items.slice();
          for (var i = pool.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
          }
          var out = [];
          var ok = true;
          while (pool.length) {
            var recent = out.slice(-minBetween).map(keyOf);
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
        return null;
      };

      document.querySelectorAll('.marquee-wrapper').forEach(function (wrapper) {
        var tracks = wrapper.querySelectorAll('.marque-track');
        if (tracks.length === 0) return;

        var all = [];
        tracks.forEach(function (t) {
          Array.prototype.forEach.call(t.children, function (c) { all.push(c); });
        });

        // Считаем, сколько копий каждой фото допустимо при текущем размере ленты:
        // (maxCopies − 1) пар × (MIN_BETWEEN + 1) + 1 ≤ N  →  maxCopies ≤ (N − 1) / (MIN_BETWEEN + 1) + 1
        // Эквивалентно floor((N + MIN_BETWEEN) / (MIN_BETWEEN + 1)).
        var maxCopies = Math.max(1, Math.floor((all.length + MIN_BETWEEN) / (MIN_BETWEEN + 1)));
        var seen = {};
        var trimmed = [];
        var dropped = [];
        all.forEach(function (el) {
          var k = keyOf(el);
          seen[k] = (seen[k] || 0) + 1;
          if (seen[k] <= maxCopies) trimmed.push(el);
          else dropped.push(el);
        });
        // Удалённые элементы — выкидываем из DOM (родителю они больше не нужны).
        dropped.forEach(function (el) { if (el.parentNode) el.parentNode.removeChild(el); });

        var shuffled = shuffleWithMinDistance(trimmed, MIN_BETWEEN) || trimmed.slice();

        // Раскидываем обратно поровну между track'ами
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
