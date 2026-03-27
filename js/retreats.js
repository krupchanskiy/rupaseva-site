/**
 * retreats.js — загрузка ретритов из Supabase и рендер карточек
 */

(function () {
  'use strict';

  var SUPABASE_URL = 'https://mymrijdfqeevoaocbzfy.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15bXJpamRmcWVldm9hb2NiemZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNzI3MzAsImV4cCI6MjA4NzY0ODczMH0.CWTCnvY8osSO5Hb43NmtlugahPuE3nUaSE0Iy3gQtvs';

  var MONTHS_RU = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  var MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Определяем язык по атрибуту <html lang> или по пути
  var lang = document.documentElement.lang || 'ru';
  if (location.pathname.indexOf('/en/') !== -1) lang = 'en';
  var isRu = lang === 'ru';
  var months = isRu ? MONTHS_RU : MONTHS_EN;

  // Путь к картинкам (en/ нужен ../)
  var imgPrefix = location.pathname.indexOf('/en/') !== -1 ? '../' : '';

  function parseLocalDate(dateStr) {
    // YYYY-MM-DD → локальная дата (без UTC-сдвига)
    var parts = dateStr.split('-');
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  }

  function formatDay(dateStr) {
    return parseLocalDate(dateStr).getDate();
  }

  function formatMonth(dateStr) {
    return months[parseLocalDate(dateStr).getMonth()];
  }

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderCard(retreat) {
    var name = isRu ? retreat.name_ru : (retreat.name_en || retreat.name_ru);
    var speakers = isRu ? retreat.speakers_ru : (retreat.speakers_en || retreat.speakers_ru);
    var link = retreat.registration_url || '#';
    var imgSrc = retreat.image_url ? imgPrefix + retreat.image_url : '';

    var html = '<div role="listitem" class="swiper-slide w-dyn-item">' +
      '<article class="card event-card">' +
        '<h3 class="h-3"><a href="' + escapeHtml(link) + '" class="card-link"' +
          (link !== '#' ? ' rel="noopener noreferrer" target="_blank"' : '') +
          '>' + escapeHtml(name) + '</a></h3>' +
        '<p>' +
          '<time datetime="' + retreat.start_date + '">' +
            '<span>' + formatDay(retreat.start_date) + '</span>' +
            '<span>' + formatMonth(retreat.start_date) + '</span>' +
          '</time>' +
          '<time datetime="' + retreat.end_date + '">' +
            '<span>' + formatDay(retreat.end_date) + '</span>' +
            '<span>' + formatMonth(retreat.end_date) + '</span>' +
          '</time>' +
        '</p>' +
        '<div data-event="speakers" class="_0-8-rem opacity-60 w-richtext">' +
          (speakers || '') +
        '</div>' +
        '<div data-corners="top-left top-right">' +
          (imgSrc ? '<img loading="lazy" src="' + escapeHtml(imgSrc) + '" alt="' + escapeHtml(name) + '">' : '') +
        '</div>' +
      '</article>' +
    '</div>';

    return html;
  }

  function initSwiper() {
    if (typeof Swiper === 'undefined') return;
    new Swiper('.swiper', {
      speed: 400,
      a11y: true,
      slidesPerView: 1.2,
      spaceBetween: 18,
      breakpoints: {
        400:  { slidesPerView: 1.5 },
        480:  { slidesPerView: 1.8 },
        540:  { slidesPerView: 2.1 },
        630:  { slidesPerView: 2.4 },
        780:  { slidesPerView: 2 },
        840:  { slidesPerView: 2 },
        1280: { slidesPerView: 2, spaceBetween: 24 },
        1720: { slidesPerView: 2, spaceBetween: 27 },
      },
      navigation: {
        nextEl: '#swiper_button__next',
        prevEl: '#swiper_button__prev',
      },
    });

    // Выравнивание высоты events-title по карточке (desktop)
    if (window.innerWidth > 1279) {
      var dataCornersEl = document.querySelector('.event-card [data-corners]');
      if (dataCornersEl) {
        var titleEl = document.getElementById('events-title');
        if (titleEl) titleEl.style.height = dataCornersEl.offsetHeight + 'px';
      }
    }
  }

  function loadRetreats() {
    var wrapper = document.querySelector('.swiper-wrapper');
    if (!wrapper) return;

    // Сегодня в формате YYYY-MM-DD
    var today = new Date();
    var todayStr = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');

    var fields = 'name_ru,name_en,start_date,end_date,image_url,speakers_ru,speakers_en,registration_url';
    var url = SUPABASE_URL + '/rest/v1/retreats' +
      '?select=' + fields +
      '&is_public=eq.true' +
      '&end_date=gte.' + todayStr +
      '&order=start_date.asc';

    fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      }
    })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (retreats) {
      if (!retreats || retreats.length === 0) {
        wrapper.innerHTML = '<p>' + (isRu ? 'Нет предстоящих мероприятий' : 'No upcoming events') + '</p>';
        return;
      }
      wrapper.innerHTML = retreats.map(renderCard).join('');
      initSwiper();
    })
    .catch(function (err) {
      console.error('Ошибка загрузки ретритов:', err);
      wrapper.innerHTML = '<p>' + (isRu ? 'Нет предстоящих мероприятий' : 'No upcoming events') + '</p>';
    });
  }

  // Запускаем при DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadRetreats);
  } else {
    loadRetreats();
  }
})();
