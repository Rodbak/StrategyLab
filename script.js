(function () {
  'use strict';

  // ——— Molten globe intro loader: exit after load + minimum display time ———
  (function () {
    var loaderEl = document.getElementById('page-loader');
    if (!loaderEl) return;
    var loaderMinMs = 2200;
    var loaderExitDelayMs = 600;
    var loadDone = false;
    var minTimeDone = false;

    function tryExit() {
      if (!loadDone || !minTimeDone) return;
      loaderEl.classList.add('exit');
      setTimeout(function () {
        if (loaderEl.parentNode) loaderEl.parentNode.removeChild(loaderEl);
      }, loaderExitDelayMs);
    }

    window.addEventListener('load', function () {
      loadDone = true;
      tryExit();
    });
    setTimeout(function () {
      minTimeDone = true;
      tryExit();
    }, loaderMinMs);
  })();

  // ——— Molten globe: interact only when mouse is ON the globe ———
  (function () {
    var globeGroup = document.getElementById('globe-group');
    var globeGlow = document.getElementById('globe-glow');
    var globeHit = document.getElementById('globe-hit');
    if (!globeGroup || !globeGlow || !globeHit) return;

    var mouseX = 0.5;
    var mouseY = 0.5;
    var currentX = 0;
    var currentY = 0;
    var isOverGlobe = false;
    var strength = 0.06;
    var smooth = 0.08;
    var smoothReturn = 0.04;

    function onMove(e) {
      mouseX = e.clientX / window.innerWidth;
      mouseY = e.clientY / window.innerHeight;
    }

    function onEnter() {
      isOverGlobe = true;
      globeGroup.classList.add('globe-hover');
    }

    function onLeave() {
      isOverGlobe = false;
      globeGroup.classList.remove('globe-hover');
    }

    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    function tick() {
      var targetX, targetY;
      if (isOverGlobe) {
        targetX = (mouseX - 0.5) * 2 * strength * 100;
        targetY = (mouseY - 0.5) * 2 * strength * 100;
        currentX = lerp(currentX, targetX, smooth);
        currentY = lerp(currentY, targetY, smooth);
      } else {
        targetX = 0;
        targetY = 0;
        currentX = lerp(currentX, targetX, smoothReturn);
        currentY = lerp(currentY, targetY, smoothReturn);
      }

      var tx = -50 + currentX;
      var ty = -50 + currentY;
      var tr = 'translate(' + tx + '%, ' + ty + '%)';

      globeGroup.style.transform = tr;
      globeGlow.style.transform = tr;
      globeHit.style.transform = tr;
      requestAnimationFrame(tick);
    }

    globeHit.addEventListener('mouseenter', onEnter);
    globeHit.addEventListener('mouseleave', onLeave);
    window.addEventListener('mousemove', onMove, { passive: true });
    requestAnimationFrame(tick);
  })();

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
      btn.disabled = true;
      btn.textContent = 'Sending…';

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      })
        .then(function (r) {
          if (r.ok) {
            if (formStatus) {
              formStatus.textContent = 'Thanks! We\'ll be in touch within 24 hours.';
              formStatus.className = 'form-status form-status-success';
            }
            btn.textContent = 'Sent!';
            form.reset();
          } else {
            throw new Error('Submit failed');
          }
        })
        .catch(function () {
          if (formStatus) {
            formStatus.textContent = 'Something went wrong. Please email us at hello@strategylab.com';
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
      stickyCta.classList.toggle('visible', window.scrollY > heroHeight * 0.6);
    }
    window.addEventListener('scroll', function () { checkSticky(); }, { passive: true });
    checkSticky();
  }

  // Scroll reveal: sections fade in when they enter the viewport
  var revealSections = document.querySelectorAll('.section-reveal');
  if (revealSections.length && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) entry.target.classList.add('revealed');
      });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0.1 });
    revealSections.forEach(function (el) { observer.observe(el); });
  }

  // Portfolio: load iframe only when card enters viewport (saves initial load)
  var portfolioIframes = document.querySelectorAll('.portfolio-visual iframe[data-src]');
  if (portfolioIframes.length && 'IntersectionObserver' in window) {
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
    portfolioIframes.forEach(function (iframe) { iframeObserver.observe(iframe); });
  }
})();
