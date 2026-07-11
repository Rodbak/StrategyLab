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

  function track(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }

  ready(function () {
    /* ---- Conversion tracking (GA4) ---- */
    document.addEventListener('click', function (e) {
      var node = e.target;
      while (node && node.tagName !== 'A') node = node.parentNode;
      if (!node) return;
      var href = node.getAttribute('href') || '';
      if (href.indexOf('wa.me/') !== -1) {
        var section = node.closest('section, footer, .nav-float-outer');
        var location = node.classList.contains('wa-float')
          ? 'floating_button'
          : (section && (section.id || section.className.split(' ')[0])) || 'page';
        track('whatsapp_click', { location: location, page: window.location.pathname });
      } else if (href.indexOf('get-a-quote') !== -1) {
        track('cta_click', { cta: 'get_a_quote', page: window.location.pathname });
      } else if (href === '#contact' || href === '/contact') {
        track('cta_click', { cta: 'contact', page: window.location.pathname });
      }
    });

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

    /* ---- Contact form: submit in place, show inline confirmation ---- */
    var contactForm = document.getElementById('contact-form');
    if (contactForm && window.fetch) {
      contactForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var fields = document.getElementById('form-fields');
        var status = document.getElementById('form-status');
        var submitBtn = contactForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        var i18n = window.StrategyLabI18n;
        var successMsg = (i18n && i18n.t('contact.success')) || "Thanks! We'll be in touch within 24 hours.";
        var errorMsg = (i18n && i18n.t('contact.error')) || 'Something went wrong. Please email us at bakorodolph@gmail.com';

        function showStatus(kind, msg) {
          if (!status) return;
          if (fields) fields.hidden = kind === 'success';
          status.hidden = false;
          status.className = 'form-status is-visible is-' + kind;
          var icon = kind === 'success'
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>';
          status.innerHTML = icon + '<p></p>';
          status.querySelector('p').textContent = msg;
        }

        fetch(contactForm.action, {
          method: 'POST',
          body: new FormData(contactForm),
          headers: { Accept: 'application/json' }
        }).then(function (res) {
          if (res.ok) {
            track('contact_form_submit', { page: window.location.pathname });
            contactForm.reset();
            showStatus('success', successMsg);
          } else {
            showStatus('error', errorMsg);
            if (submitBtn) submitBtn.disabled = false;
          }
        }).catch(function () {
          showStatus('error', errorMsg);
          if (submitBtn) submitBtn.disabled = false;
        });
      });
    }

    /* ---- Currency-aware amounts (hero card + stat chips) ----
       Elements with [data-amount-ghs] show a compact, currency-converted
       figure (e.g. "GHS 2.4M+", "$192K+") via the shared i18n engine, and
       re-render instantly whenever the visitor changes language/currency. */
    function renderAmount(el) {
      var i18n = window.StrategyLabI18n;
      var ghs = parseFloat(el.getAttribute('data-amount-ghs'));
      if (!i18n || isNaN(ghs)) return;
      el.textContent = i18n.formatMoneyCompact(i18n.ghsToDisplay(ghs)) + '+';
    }
    var amountEls = document.querySelectorAll('[data-amount-ghs]');
    if (amountEls.length && window.StrategyLabI18n) {
      window.StrategyLabI18n.onChange(function () {
        amountEls.forEach(renderAmount);
      });
    }

    /* ---- Count-up stats when scrolled into view ---- */
    var counters = document.querySelectorAll('[data-counter]');
    if (counters.length && 'IntersectionObserver' in window) {
      var animate = function (el) {
        var ghsAttr = el.getAttribute('data-amount-ghs');
        var i18n = window.StrategyLabI18n;
        var dur = 1400;
        var start = null;
        if (ghsAttr !== null && i18n) {
          var targetDisplay = i18n.ghsToDisplay(parseFloat(ghsAttr));
          (function stepMoney(ts) {
            if (start === null) start = ts;
            var p = Math.min(1, (ts - start) / dur);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = i18n.formatMoneyCompact(targetDisplay * eased) + '+';
            if (p < 1) requestAnimationFrame(stepMoney);
          })();
          return;
        }
        var target = parseFloat(el.getAttribute('data-counter'));
        var prefix = el.getAttribute('data-prefix') || '';
        var suffix = el.getAttribute('data-suffix') || '';
        var decimals = el.getAttribute('data-decimals') ? parseInt(el.getAttribute('data-decimals'), 10) : 0;
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

    /* Static (non-countup) currency amounts, e.g. the hero revenue card,
       render immediately on load rather than waiting for scroll. */
    document.querySelectorAll('[data-amount-ghs]:not([data-counter])').forEach(renderAmount);

    /* ---- Pricing: One-time / Retainer toggle ---- */
    var pricingToggle = document.querySelector('.pricing-toggle');
    if (pricingToggle) {
      var toggleBtns = pricingToggle.querySelectorAll('.toggle-btn');
      var pricingViews = document.querySelectorAll('.pricing-view');
      toggleBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var view = btn.getAttribute('data-view');
          toggleBtns.forEach(function (b) {
            var active = b === btn;
            b.classList.toggle('is-active', active);
            b.setAttribute('aria-pressed', active ? 'true' : 'false');
          });
          pricingViews.forEach(function (v) {
            v.hidden = v.getAttribute('data-view-panel') !== view;
          });
          track('pricing_toggle', { view: view });
        });
      });
    }

    /* ---- Current year in footer ---- */
    var yearEls = document.querySelectorAll('[data-year]');
    yearEls.forEach(function (el) { el.textContent = new Date().getFullYear(); });

    /* ---- Clean URL section navigation (no hash anchors) ----
       Same-page nav links (#services, #pricing, ...) are intercepted:
       we smooth-scroll and update the address bar with history.pushState
       to a clean path (e.g. /services) instead of an ugly #hash.
       Cross-page links already point at clean root paths (/services, /).
       vercel.json rewrites those paths back to index.html on reload. */
    var SECTION_PATHS = {
      'home': '/',
      'services': '/services',
      'pricing': '/pricing',
      'portfolio': '/portfolio',
      'contact': '/contact',
      'why-us': '/why-us'
    };
    var PATH_TO_ID = {};
    Object.keys(SECTION_PATHS).forEach(function (id) {
      PATH_TO_ID[SECTION_PATHS[id]] = id;
    });

    function scrollToSection(id) {
      var el = document.getElementById(id);
      if (!el) return false;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return true;
    }

    function sectionFromPath(pathname) {
      var p = (pathname || '').replace(/\/+$/, '');
      if (!p) p = '/';
      return PATH_TO_ID[p] || null;
    }

    // Intercept clicks on same-page hash links that map to a section.
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var node = e.target;
      while (node && (node.tagName !== 'A')) node = node.parentNode;
      if (!node) return;
      var href = node.getAttribute('href') || '';
      if (href.charAt(0) !== '#') return;
      var id = href.slice(1);
      if (!SECTION_PATHS[id]) return;            // not a section (e.g. #main-content)
      if (!document.getElementById(id)) return;  // target not on this page
      e.preventDefault();
      scrollToSection(id);
      if (window.history && window.history.pushState) {
        window.history.pushState({ section: id }, '', SECTION_PATHS[id]);
      }
    });

    // Restore the correct section on back/forward navigation.
    window.addEventListener('popstate', function () {
      var id = sectionFromPath(window.location.pathname);
      if (id) scrollToSection(id);
    });

    // On first load, scroll to the section named in the URL path
    // (e.g. arriving at /services from the quote page). Skip "/" so a
    // normal home visit doesn't force a scroll.
    var initialId = sectionFromPath(window.location.pathname);
    if (initialId && initialId !== 'home') {
      window.addEventListener('load', function () {
        scrollToSection(initialId);
      });
    }
  });
})();
