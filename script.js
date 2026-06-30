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

  // Nav "More" dropdown
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

  // Smooth scroll for anchor links
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

  // Contact form: submit to Formspree
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
      btn.textContent = window.StrategyLabI18n && window.StrategyLabI18n.t('common.sending')
        ? window.StrategyLabI18n.t('common.sending') : 'Sending…';

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      })
        .then(function (r) {
          if (r.ok) {
            if (formStatus) {
              formStatus.textContent = window.StrategyLabI18n && window.StrategyLabI18n.t('contact.success')
                ? window.StrategyLabI18n.t('contact.success') : "Thanks! We'll be in touch within 24 hours.";
              formStatus.className = 'form-status form-status-success';
            }
            btn.textContent = window.StrategyLabI18n && window.StrategyLabI18n.t('common.sent')
              ? window.StrategyLabI18n.t('common.sent') : 'Sent!';
            form.reset();
            if (window.StrategyLabI18n) window.StrategyLabI18n.applyDom(form);
          } else {
            throw new Error('Submit failed');
          }
        })
        .catch(function () {
          if (formStatus) {
            formStatus.textContent = window.StrategyLabI18n && window.StrategyLabI18n.t('contact.error')
              ? window.StrategyLabI18n.t('contact.error') : 'Something went wrong. Please email us at bakorodolph@gmail.com';
            formStatus.className = 'form-status form-status-error';
          }
          btn.textContent = originalText;
        })
        .finally(function () {
          btn.disabled = false;
          setTimeout(function () {
            btn.textContent = originalText;
            if (formStatus) { formStatus.textContent = ''; formStatus.className = 'form-status'; }
          }, 5000);
        });
    });
  }

  // Portfolio preview modal
  // Supports BOTH old anchor .portfolio-card-link[href] and new div .portfolio-card[data-preview-url]
  var modal = document.getElementById('preview-modal');
  var modalIframe = document.getElementById('preview-modal-iframe');
  var visitLink = document.getElementById('preview-modal-visit');
  var visitTop  = document.getElementById('preview-modal-visit-top');
  var titleEl   = document.getElementById('preview-modal-title');
  var urlLabel  = document.getElementById('preview-modal-url-label');
  var closeBtns = document.querySelectorAll('.preview-modal-close, .preview-modal-close-btn');
  var backdrop  = document.querySelector('.preview-modal-backdrop');

  function openPreview(url, name) {
    if (!modal || !modalIframe) return;
    if (titleEl && name) titleEl.textContent = name;
    if (urlLabel && url) urlLabel.textContent = url.replace('https://','');
    if (visitLink) visitLink.href = url;
    if (visitTop)  visitTop.href  = url;
    modalIframe.src = '';
    setTimeout(function() { modalIframe.src = url; }, 60);
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closePreview() {
    if (!modal || !modalIframe) return;
    modal.setAttribute('hidden', '');
    modalIframe.src = '';
    document.body.style.overflow = '';
  }

  // New div-based cards (data-preview-url)
  document.querySelectorAll('.portfolio-card[data-preview-url]').forEach(function (card) {
    card.addEventListener('click', function (e) {
      if (e.target.closest('.portfolio-visit-link')) return;
      var url  = this.getAttribute('data-preview-url');
      var name = this.getAttribute('data-site-name') || 'Preview';
      if (url) openPreview(url, name);
    });
  });

  // Legacy anchor-based cards (href)
  document.querySelectorAll('.portfolio-card-link[href]').forEach(function (card) {
    if (!card.hasAttribute('data-preview-url')) { // only if not already handled above
      card.addEventListener('click', function (e) {
        e.preventDefault();
        var url = this.getAttribute('data-preview-url') || this.getAttribute('href');
        if (url) openPreview(url, '');
      });
    }
  });

  closeBtns.forEach(function (btn) { if (btn) btn.addEventListener('click', closePreview); });
  if (backdrop) backdrop.addEventListener('click', closePreview);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal && !modal.hasAttribute('hidden')) closePreview();
  });

  // Sticky CTA — show after scrolling past hero
  var stickyCta = document.getElementById('sticky-cta');
  var hero = document.getElementById('home');
  if (stickyCta && hero) {
    function checkSticky() {
      var heroH = hero.offsetHeight;
      var visible = window.scrollY > heroH * 0.6;
      stickyCta.classList.toggle('visible', visible);
      stickyCta.setAttribute('aria-hidden', !visible);
      document.body.classList.toggle('sticky-cta-visible', visible);
    }
    window.addEventListener('scroll', checkSticky, { passive: true });
    checkSticky();
  }

  // Header scrolled class
  var header = document.querySelector('.header');
  if (header) {
    function checkHeader() { header.classList.toggle('scrolled', window.scrollY > 20); }
    window.addEventListener('scroll', checkHeader, { passive: true });
    checkHeader();
  }

  // Scroll reveal: sections + individual items
  var revealSections = document.querySelectorAll('.section-reveal');
  if (revealSections.length) {
    var revealAll = function () {
      document.querySelectorAll('.section-reveal .reveal-item, .section-reveal .reveal-list > *').forEach(function(el){
        el.classList.add('visible');
      });
    };
    var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!('IntersectionObserver' in window) || prefersReduced) {
      revealAll();
    } else {
      // Observe individual reveal-item elements for staggered entry
      var itemObs = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.isIntersecting){
            entry.target.classList.add('visible');
            itemObs.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -5% 0px', threshold: 0.08 });

      document.querySelectorAll('.section-reveal .reveal-item, .section-reveal .reveal-list > *').forEach(function(el, i){
        // Stagger via CSS delay already on class; observe each item
        itemObs.observe(el);
      });

      // Backstop
      window.setTimeout(revealAll, 3000);
    }
  }

  // Lazy-load preview iframes on scroll (performance)
  var previewIframes = document.querySelectorAll('.portfolio-visual iframe[data-src], .graphics-visual iframe[data-src]');
  if (previewIframes.length && 'IntersectionObserver' in window) {
    var iframeObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var iframe = entry.target;
        var src = iframe.getAttribute('data-src');
        if (src) { iframe.setAttribute('src', src); iframe.removeAttribute('data-src'); }
        iframeObs.unobserve(iframe);
      });
    }, { rootMargin: '120px 0px', threshold: 0 });
    previewIframes.forEach(function (iframe) { iframeObs.observe(iframe); });
  }

  // Currency display
  (function () {
    function applyMoney() {
      if (!window.StrategyLabI18n) return;
      document.querySelectorAll('[data-money-ghs]').forEach(function (el) {
        var ghs = Number(el.getAttribute('data-money-ghs'));
        if (!isFinite(ghs)) return;
        el.textContent = window.StrategyLabI18n.formatMoneyRounded(window.StrategyLabI18n.ghsToDisplay(ghs));
      });
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        applyMoney();
        if (window.StrategyLabI18n && window.StrategyLabI18n.onChange) window.StrategyLabI18n.onChange(applyMoney);
      });
    } else {
      applyMoney();
      if (window.StrategyLabI18n && window.StrategyLabI18n.onChange) window.StrategyLabI18n.onChange(applyMoney);
    }
  })();

})();
