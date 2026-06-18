(function () {
  'use strict';

  // Mobile menu
  var menuBtn = document.querySelector('.menu-btn');
  var navMobile = document.querySelector('.nav-mobile');
  if (menuBtn && navMobile) {
    menuBtn.addEventListener('click', function () {
      navMobile.classList.toggle('open');
      menuBtn.classList.toggle('open');
    });
    navMobile.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navMobile.classList.remove('open');
        menuBtn.classList.remove('open');
      });
    });
  }

  // Nav "More" dropdown — tuck secondary links away to declutter the bar
  var moreToggle = document.querySelector('.nav-dropdown-toggle');
  var moreMenu = document.getElementById('nav-more-menu');
  if (moreToggle && moreMenu) {
    var setMoreOpen = function (open) {
      moreToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) moreMenu.removeAttribute('hidden');
      else moreMenu.setAttribute('hidden', '');
    };
    moreToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      setMoreOpen(moreToggle.getAttribute('aria-expanded') !== 'true');
    });
    moreMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { setMoreOpen(false); });
    });
    document.addEventListener('click', function (e) {
      if (moreToggle.getAttribute('aria-expanded') === 'true' &&
          !moreMenu.contains(e.target) && !moreToggle.contains(e.target)) {
        setMoreOpen(false);
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMoreOpen(false);
    });
  }

  // Smooth scroll for anchor links (already in CSS, but ensure no jump)
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;
      var target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Contact form: submit to Formspree so messages are sent to your email
  var form = document.querySelector('.contact-form');
  var formStatus = document.getElementById('form-status');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var originalText = btn.textContent;
      if (formStatus) formStatus.textContent = '';
      if (window.StrategyLabI18n) window.StrategyLabI18n.syncHiddenFormFields();
      btn.disabled = true;
      btn.textContent =
        window.StrategyLabI18n && window.StrategyLabI18n.t('common.sending')
          ? window.StrategyLabI18n.t('common.sending')
          : 'Sending…';

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      })
        .then(function (r) {
          if (r.ok) {
            if (formStatus) {
              formStatus.textContent =
                window.StrategyLabI18n && window.StrategyLabI18n.t('contact.success')
                  ? window.StrategyLabI18n.t('contact.success')
                  : "Thanks! We'll be in touch within 24 hours.";
              formStatus.className = 'form-status form-status-success';
            }
            btn.textContent =
              window.StrategyLabI18n && window.StrategyLabI18n.t('common.sent')
                ? window.StrategyLabI18n.t('common.sent')
                : 'Sent!';
            form.reset();
            if (window.StrategyLabI18n) window.StrategyLabI18n.applyDom(form);
          } else {
            throw new Error('Submit failed');
          }
        })
        .catch(function () {
          if (formStatus) {
            formStatus.textContent =
              window.StrategyLabI18n && window.StrategyLabI18n.t('contact.error')
                ? window.StrategyLabI18n.t('contact.error')
                : 'Something went wrong. Please email us at bakorodolph@gmail.com';
            formStatus.className = 'form-status form-status-error';
          }
          btn.textContent = originalText;
        })
        .finally(function () {
          btn.disabled = false;
          setTimeout(function () {
            btn.textContent = originalText;
            if (formStatus) {
              formStatus.textContent = '';
              formStatus.className = 'form-status';
            }
          }, 5000);
        });
    });
  }

  // Portfolio preview: card click opens modal with iframe so user can preview without leaving
  var modal = document.getElementById('preview-modal');
  var modalIframe = document.getElementById('preview-modal-iframe');
  var visitLink = document.getElementById('preview-modal-visit');
  var closeBtns = document.querySelectorAll('.preview-modal-close, .preview-modal-close-btn');
  var backdrop = document.querySelector('.preview-modal-backdrop');

  function openPreview(url) {
    if (!modal || !modalIframe || !visitLink) return;
    modalIframe.src = url;
    visitLink.href = url;
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closePreview() {
    if (!modal || !modalIframe) return;
    modal.setAttribute('hidden', '');
    modalIframe.src = '';
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.portfolio-card-link').forEach(function (card) {
    card.addEventListener('click', function (e) {
      e.preventDefault();
      var url = this.getAttribute('href') || this.getAttribute('data-preview-url');
      if (url) openPreview(url);
    });
  });

  closeBtns.forEach(function (btn) {
    if (btn) btn.addEventListener('click', closePreview);
  });
  if (backdrop) backdrop.addEventListener('click', closePreview);
  if (visitLink) visitLink.addEventListener('click', function () { closePreview(); });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal && !modal.hasAttribute('hidden')) closePreview();
  });

  // Sticky CTA: show bar after scrolling past hero so CTA is always one click away
  var stickyCta = document.getElementById('sticky-cta');
  var hero = document.getElementById('home');
  if (stickyCta && hero) {
    var heroHeight = hero.offsetHeight;
    function checkSticky() {
      var visible = window.scrollY > heroHeight * 0.6;
      stickyCta.classList.toggle('visible', visible);
      document.body.classList.toggle('sticky-cta-visible', visible);
    }
    window.addEventListener('scroll', function () { checkSticky(); }, { passive: true });
    checkSticky();
  }

  // Header: add .scrolled for shadow when page is scrolled
  var header = document.querySelector('.header');
  if (header) {
    function checkHeader() {
      header.classList.toggle('scrolled', window.scrollY > 20);
    }
    window.addEventListener('scroll', function () { checkHeader(); }, { passive: true });
    checkHeader();
  }

  // Scroll reveal: sections fade in when they enter the viewport.
  // Robust against fast scrolling and missing/disabled JS — content must
  // never stay permanently hidden, so we always have a fallback that reveals all.
  var revealSections = document.querySelectorAll('.section-reveal');
  if (revealSections.length) {
    var revealAll = function () {
      revealSections.forEach(function (el) { el.classList.add('revealed'); });
    };

    var prefersReducedMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!('IntersectionObserver' in window) || prefersReducedMotion) {
      // No observer support, or the visitor opted out of motion: show everything.
      revealAll();
    } else {
      var pending = Array.prototype.slice.call(revealSections);
      var reveal = function (el) {
        el.classList.add('revealed');
        var i = pending.indexOf(el);
        if (i !== -1) pending.splice(i, 1);
      };

      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          // threshold:0 means this fires the moment any part enters, so normal
          // scrolling reveals sections with the intended staggered animation.
          if (entry.isIntersecting) {
            reveal(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0 });

      // Backstop: reveal any section whose top has scrolled into view. This
      // catches cases the observer can miss — very fast flings and instant
      // jumps from anchor links (#pricing etc.) deep into the page — where a
      // section can enter and leave between observer samples.
      var sweep = function () {
        if (!pending.length) return;
        var vh = window.innerHeight;
        pending.slice().forEach(function (el) {
          if (el.getBoundingClientRect().top < vh) {
            reveal(el);
            observer.unobserve(el);
          }
        });
      };

      var ticking = false;
      var onScroll = function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(function () { sweep(); ticking = false; });
      };

      revealSections.forEach(function (el) { observer.observe(el); });
      sweep(); // reveal whatever is already in view on load
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });

      // Final safety net: nothing should ever stay invisible. If the page is
      // restored mid-way or an observer hiccup leaves anything hidden, show it.
      window.setTimeout(revealAll, 3000);
    }
  }

  // Previews: load iframes only when cards enter viewport (saves initial load)
  var previewIframes = document.querySelectorAll('.portfolio-visual iframe[data-src], .graphics-visual iframe[data-src]');
  if (previewIframes.length && 'IntersectionObserver' in window) {
    var iframeObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var iframe = entry.target;
        var src = iframe.getAttribute('data-src');
        if (src) {
          iframe.setAttribute('src', src);
          iframe.removeAttribute('data-src');
        }
        iframeObserver.unobserve(iframe);
      });
    }, { rootMargin: '100px 0px', threshold: 0 });
    previewIframes.forEach(function (iframe) { iframeObserver.observe(iframe); });
  }

  // Pricing amounts: display in selected currency (base GHS)
  (function () {
    function applyMoney() {
      if (!window.StrategyLabI18n) return;
      document.querySelectorAll('[data-money-ghs]').forEach(function (el) {
        var raw = el.getAttribute('data-money-ghs');
        var ghs = Number(raw);
        if (!isFinite(ghs)) return;
        el.textContent = window.StrategyLabI18n.formatMoneyRounded(window.StrategyLabI18n.ghsToDisplay(ghs));
      });
    }

    // Apply once (after DOM ready). i18n init runs on DOMContentLoaded as well.
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        applyMoney();
        if (window.StrategyLabI18n && window.StrategyLabI18n.onChange) {
          window.StrategyLabI18n.onChange(applyMoney);
        }
      });
    } else {
      applyMoney();
      if (window.StrategyLabI18n && window.StrategyLabI18n.onChange) {
        window.StrategyLabI18n.onChange(applyMoney);
      }
    }
  })();
})();
