(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Only hide reveal elements once this script is running, so the page is fully visible without it
  document.documentElement.classList.add('js');

  /* 1. Split the hero headline into words that rise one by one */
  document.querySelectorAll('.split').forEach(function (el) {
    var text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';
    text.split(/\s+/).forEach(function (word, i) {
      var wrap = document.createElement('span');
      wrap.className = 'word';
      wrap.setAttribute('aria-hidden', 'true');
      var inner = document.createElement('span');
      inner.textContent = word;
      inner.style.setProperty('--i', i);
      wrap.appendChild(inner);
      el.appendChild(wrap);
    });
  });

  /* 2. Reveal sections as they scroll into view */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el, i) {
      // small stagger for siblings inside the same grid or list
      var siblings = el.parentElement ? el.parentElement.children : [];
      var index = Array.prototype.indexOf.call(siblings, el);
      if (index > 0) el.style.transitionDelay = Math.min(index, 4) * 0.12 + 's';
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* 3. Count numbers up from 0 when they become visible */
  function format(value, el) {
    return el.dataset.format === 'comma' ? value.toLocaleString('en-US') : String(value);
  }

  function countUp(el) {
    var target = parseInt(el.dataset.target, 10);
    if (reduceMotion) { el.textContent = format(target, el); return; }
    var duration = 2000, start = null;
    function step(t) {
      if (start === null) start = t;
      var p = Math.min((t - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = format(Math.round(target * eased), el);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var nums = document.querySelectorAll('.num');
  if (!reduceMotion) nums.forEach(function (el) { el.textContent = format(0, el); });
  if ('IntersectionObserver' in window) {
    var numObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          countUp(entry.target);
          numObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    nums.forEach(function (el) { numObserver.observe(el); });
  } else {
    nums.forEach(countUp);
  }

  /* 4. Hero parallax: background moves slowly, text moves faster */
  var layers = Array.prototype.slice.call(document.querySelectorAll('.hero [data-speed]'));
  var ticking = false;

  function parallax() {
    var y = window.scrollY;
    if (y < window.innerHeight * 1.5) {
      layers.forEach(function (el) {
        el.style.translate = '0 ' + (y * parseFloat(el.dataset.speed)) + 'px';
      });
    }
    ticking = false;
  }

  /* 5. Header hides when scrolling down, returns when scrolling up */
  var header = document.getElementById('top-bar');
  var nav = document.getElementById('main-nav');
  var menuBtn = document.querySelector('.menu-btn');
  var lastY = window.scrollY;

  function headerState() {
    var y = window.scrollY;
    var menuOpen = nav.classList.contains('open');
    header.classList.toggle('hide', y > lastY && y > 160 && !menuOpen);
    lastY = y;
  }

  window.addEventListener('scroll', function () {
    headerState();
    if (!reduceMotion && !ticking) {
      ticking = true;
      requestAnimationFrame(parallax);
    }
  }, { passive: true });

  /* 6. Mobile menu */
  menuBtn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      nav.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    }
  });

  /* 7. Model carousel buttons */
  var track = document.querySelector('.track');
  document.querySelectorAll('.arrow').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var card = track.querySelector('.card');
      var step = card ? card.getBoundingClientRect().width + 24 : 400;
      track.scrollBy({ left: step * parseInt(btn.dataset.dir, 10), behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });
  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') track.scrollBy({ left: 400, behavior: 'smooth' });
    if (e.key === 'ArrowLeft') track.scrollBy({ left: -400, behavior: 'smooth' });
  });
})();
