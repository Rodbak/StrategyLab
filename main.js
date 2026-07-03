/**
 * StrategyLab — site interactions (mobile nav, scroll state, counters)
 * No framework, no build step — plain DOM.
 */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    /* ---- Floating nav: scrolled state ---- */
    var navOuter = document.querySelector('.nav-float-outer');
    if (navOuter) {
      var onScroll = function () {
        navOuter.classList.toggle('is-scrolled', window.scrollY > 12);
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    /* ---- Mobile nav toggle ---- */
    var menuBtn = document.querySelector('.nav-menu-btn');
    var mobileNav = document.querySelector('.nav-mobile');
    if (menuBtn && mobileNav) {
      var closeMobile = function () {
        mobileNav.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded', 'false');
      };
      menuBtn.addEventListener('click', function () {
        var open = mobileNav.classList.toggle('is-open');
        menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      mobileNav.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', closeMobile);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeMobile();
      });
    }

    /* ---- Count-up stats when scrolled into view ---- */
    var counters = document.querySelectorAll('[data-counter]');
    if (counters.length && 'IntersectionObserver' in window) {
      var animate = function (el) {
        var target = parseFloat(el.getAttribute('data-counter'));
        var prefix = el.getAttribute('data-prefix') || '';
        var suffix = el.getAttribute('data-suffix') || '';
        var decimals = el.getAttribute('data-decimals') ? parseInt(el.getAttribute('data-decimals'), 10) : 0;
        var dur = 1400;
        var start = null;
        function step(ts) {
          if (start === null) start = ts;
          var p = Math.min(1, (ts - start) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          var val = target * eased;
          el.textContent = prefix + val.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suffix;
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      };
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animate(entry.target);
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      counters.forEach(function (c) { io.observe(c); });
    }

    /* ---- Current year in footer ---- */
    var yearEls = document.querySelectorAll('[data-year]');
    yearEls.forEach(function (el) { el.textContent = new Date().getFullYear(); });
  });
})();
