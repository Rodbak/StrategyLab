(function () {
  'use strict';

  var CURRENCY = 'GHS';
  // Domain pricing: fallback estimates. Replace with API fetch when integrating a registrar/pricing API.
  var DOMAIN_PRICES = {
    'com': 120,
    'org': 110,
    'net': 110,
    'com.gh': 85,
    'gh': 180
  };
  var HOSTING_ESTIMATE = 400;
  var LOADING_MESSAGES = [
    'Reviewing your requirements...',
    'Calculating the best fit for your budget...',
    'Preparing your estimate...'
  ];
  var LOADING_DURATION = 3200;

  function formatGHS(num) {
    return CURRENCY + ' ' + Number(num).toLocaleString('en-GB');
  }

  function getBudget() {
    var el = document.getElementById('budget-input');
    return el ? parseInt(el.value, 10) || 10000 : 10000;
  }

  function getSelections() {
    var projectType = (document.querySelector('input[name="project_type"]:checked') || {}).value || 'simple-website';
    return {
      budget: getBudget(),
      businessType: document.getElementById('business-type').value,
      projectType: projectType,
      timeline: document.getElementById('timeline').value,
      hasBranding: document.getElementById('has-branding').checked,
      needDomainHosting: document.getElementById('need-domain-hosting').checked,
      wantAds: document.getElementById('want-ads').checked,
      wantLandingPages: document.getElementById('want-landing-pages').checked,
      wantSeo: document.getElementById('want-seo').checked,
      wantMaintenance: document.getElementById('want-maintenance').checked
    };
  }

  function computeEstimate(sel) {
    var budget = sel.budget;
    var included = [];
    var excluded = [];
    var addons = [];
    var packageName = '';
    var timelineText = '';
    var nextStep = 'Request a full quote or book a free consultation so we can confirm scope and deliver a final proposal.';

    if (sel.projectType === 'ads-only') {
      packageName = 'Ads management package';
      included.push('Campaign setup (Meta and/or Google)');
      included.push('Audience targeting and ad creative direction');
      included.push('Landing page or destination review');
      if (budget >= 8000) {
        included.push('Ongoing optimization and reporting');
      }
      excluded.push('Website design or build');
      excluded.push('Ad spend (you set and control your ad budget separately)');
      if (sel.wantLandingPages) addons.push('Dedicated landing page(s) for campaigns');
      if (sel.wantSeo) addons.push('SEO is separate from ads; we can quote it as an add-on');
      timelineText = 'Setup: 1–2 weeks. Ongoing management: monthly.';
    } else if (budget < 4000) {
      packageName = 'Starter — Landing page or simple site';
      included.push('Single landing page or very simple 1–3 page site');
      included.push('Mobile-responsive design');
      included.push('Contact / inquiry form');
      excluded.push('Multi-page company website');
      excluded.push('Advanced integrations or custom features');
      if (sel.needDomainHosting) addons.push('Domain and hosting (see third-party costs below)');
      if (sel.wantAds) addons.push('Ads management can be added; discuss in consultation');
      timelineText = '1–2 weeks typical.';
    } else if (budget < 12000) {
      packageName = 'Business website — Essential';
      included.push('Multi-page business website (typically 5–7 pages)');
      included.push('Mobile-first, responsive design');
      included.push('Clear calls to action and lead capture');
      included.push('Basic SEO setup (titles, meta)');
      if (sel.hasBranding) included.push('Use of your existing branding and content');
      excluded.push('Heavy custom functionality or large page counts');
      if (sel.wantAds) addons.push('Ads management — separate fee; we’ll quote based on scope');
      if (sel.wantLandingPages) addons.push('Additional landing pages for campaigns');
      if (sel.wantMaintenance) addons.push('Ongoing maintenance and updates');
      if (sel.needDomainHosting) addons.push('Domain and hosting (see below)');
      timelineText = '2–4 weeks typical.';
    } else if (budget < 25000) {
      packageName = 'Business website — Growth';
      included.push('Full business or company website (up to 10–12 pages)');
      included.push('Mobile-first, conversion-oriented design');
      included.push('Lead capture, forms, and clear CTAs');
      included.push('SEO setup and basic optimization');
      if (sel.wantLandingPages) included.push('1–2 campaign landing pages');
      if (sel.hasBranding) included.push('Use of your existing branding');
      excluded.push('Custom app or complex integrations without separate quote');
      if (sel.wantAds) addons.push('Ads management — we’ll quote setup + monthly management');
      if (sel.wantMaintenance) addons.push('Ongoing maintenance package');
      if (sel.needDomainHosting) addons.push('Domain and hosting (see below)');
      timelineText = '2–4 or 4–6 weeks depending on scope.';
    } else {
      packageName = 'Website + growth package — Premium';
      included.push('Full website (multi-page, conversion-focused)');
      included.push('Landing pages for campaigns');
      included.push('SEO setup and optimization');
      included.push('Mobile-first, professional design');
      if (sel.wantAds) included.push('Ads management setup and strategy (management fee separate from ad spend)');
      if (sel.wantMaintenance) included.push('Ongoing maintenance and support');
      if (sel.needDomainHosting) included.push('Domain and hosting guidance and setup');
      excluded.push('Custom development beyond agreed scope (we’ll quote separately)');
      timelineText = '4–8 weeks typical for full delivery.';
    }

    if (sel.projectType === 'redesign') {
      packageName = 'Website redesign — ' + (packageName.split('—')[1] || packageName);
      included.unshift('Audit of current site and strategy');
      included.unshift('Content migration and structure improvement');
    }
    if (sel.projectType === 'website-ads' && budget >= 15000) {
      packageName = 'Website + Ads growth package';
      if (included.indexOf('Ads management setup and strategy') === -1) {
        included.push('Ads management setup (management fee separate from ad spend)');
      }
    }

    return {
      packageName: packageName,
      included: included,
      excluded: excluded,
      addons: addons,
      timelineText: timelineText,
      nextStep: nextStep
    };
  }

  function getThirdParty(sel) {
    var lines = [];
    if (sel.needDomainHosting) {
      lines.push({ term: 'Domain (approx. per year)', detail: '.com ' + formatGHS(DOMAIN_PRICES.com) + ', .com.gh ' + formatGHS(DOMAIN_PRICES['com.gh']) + ', .gh ' + formatGHS(DOMAIN_PRICES.gh) });
      lines.push({ term: 'Hosting (approx. per year)', detail: formatGHS(HOSTING_ESTIMATE) + ' – we can recommend a plan' });
    }
    lines.push({ term: 'Optional premium tools/plugins', detail: 'Quoted per project if needed' });
    var adsNote = '';
    if (sel.wantAds) {
      adsNote = 'Ad spend is separate from our fees. We typically recommend starting with a test budget (e.g. ' + formatGHS(500) + '–' + formatGHS(2000) + '+/month) and scaling based on results.';
    }
    return { lines: lines, adsNote: adsNote };
  }

  function renderResults(estimate, thirdParty) {
    var pkg = document.getElementById('results-package');
    var inc = document.getElementById('results-included');
    var exc = document.getElementById('results-excluded');
    var add = document.getElementById('results-addons');
    var time = document.getElementById('results-timeline');
    var next = document.getElementById('results-next');
    var third = document.getElementById('results-third-party');
    var adsNoteEl = document.getElementById('third-party-ads-note');

    if (pkg) pkg.textContent = 'Recommended: ' + estimate.packageName;
    if (inc) {
      inc.innerHTML = '';
      var incDt = document.createElement('dt');
      incDt.textContent = 'Included in your budget';
      var incDd = document.createElement('dd');
      incDd.textContent = estimate.included.join(' · ');
      inc.appendChild(incDt);
      inc.appendChild(incDd);
    }
    if (exc) {
      exc.innerHTML = '';
      if (estimate.excluded.length) {
        var excDt = document.createElement('dt');
        excDt.textContent = 'Not included (or add separately)';
        var excDd = document.createElement('dd');
        excDd.textContent = estimate.excluded.join(' · ');
        exc.appendChild(excDt);
        exc.appendChild(excDd);
      }
    }
    if (add) {
      add.innerHTML = '';
      if (estimate.addons.length) {
        var addDt = document.createElement('dt');
        addDt.textContent = 'Possible add-ons';
        var addDd = document.createElement('dd');
        addDd.textContent = estimate.addons.join(' · ');
        add.appendChild(addDt);
        add.appendChild(addDd);
      }
    }
    if (time) time.textContent = 'Estimated timeline: ' + estimate.timelineText;
    if (next) next.textContent = 'Best next step: ' + estimate.nextStep;

    if (third) {
      third.innerHTML = '';
      thirdParty.lines.forEach(function (line) {
        var dt = document.createElement('dt');
        dt.textContent = line.term;
        var dd = document.createElement('dd');
        dd.textContent = line.detail;
        third.appendChild(dt);
        third.appendChild(dd);
      });
    }
    if (adsNoteEl) {
      adsNoteEl.textContent = thirdParty.adsNote || '';
      adsNoteEl.style.display = thirdParty.adsNote ? 'block' : 'none';
    }
  }

  function showLoading(callback) {
    var formSec = document.getElementById('quote-form-section');
    var loadSec = document.getElementById('quote-loading');
    var resultsSec = document.getElementById('quote-results');
    var textEl = document.getElementById('loading-text');
    if (formSec) formSec.setAttribute('aria-hidden', 'true');
    if (loadSec) {
      loadSec.hidden = false;
      loadSec.setAttribute('aria-busy', 'true');
    }
    var step = 0;
    var interval = setInterval(function () {
      if (textEl && LOADING_MESSAGES[step]) {
        textEl.textContent = LOADING_MESSAGES[step];
        step++;
      }
    }, LOADING_DURATION / LOADING_MESSAGES.length);
    setTimeout(function () {
      clearInterval(interval);
      if (loadSec) {
        loadSec.hidden = true;
        loadSec.removeAttribute('aria-busy');
      }
      if (resultsSec) {
        resultsSec.hidden = false;
        resultsSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (callback) callback();
    }, LOADING_DURATION);
  }

  function buildSummaryText(sel, estimate) {
    var parts = [
      'Budget: ' + formatGHS(sel.budget),
      'Project: ' + (sel.projectType || ''),
      'Package: ' + estimate.packageName
    ];
    if (sel.needDomainHosting) parts.push('Needs domain & hosting');
    if (sel.wantAds) parts.push('Wants ads management');
    if (sel.wantLandingPages) parts.push('Wants landing pages');
    if (sel.wantSeo) parts.push('Wants SEO');
    if (sel.wantMaintenance) parts.push('Wants maintenance');
    return parts.join(' | ');
  }

  var budgetSlider = document.getElementById('budget-slider');
  var budgetInput = document.getElementById('budget-input');
  var budgetDisplay = document.getElementById('budget-display');

  function syncBudget(fromSlider) {
    var val = fromSlider ? parseInt(budgetSlider.value, 10) : parseInt(budgetInput.value, 10);
    val = Math.min(150000, Math.max(800, isNaN(val) ? 10000 : val));
    if (budgetSlider) budgetSlider.value = val;
    if (budgetInput) budgetInput.value = val;
    if (budgetDisplay) budgetDisplay.textContent = formatGHS(val);
    if (budgetSlider) budgetSlider.setAttribute('aria-valuetext', formatGHS(val));
  }

  if (budgetSlider) {
    budgetSlider.addEventListener('input', function () { syncBudget(true); });
  }
  if (budgetInput) {
    budgetInput.addEventListener('change', function () { syncBudget(false); });
    budgetInput.addEventListener('blur', function () { syncBudget(false); });
  }
  syncBudget(true);

  var estimatorForm = document.getElementById('quote-estimator');
  var leadCapture = document.getElementById('quote-lead-capture');
  var leadForm = document.getElementById('quote-lead-form');
  var leadSummary = document.getElementById('lead-estimate-summary');
  var btnSendEstimate = document.getElementById('btn-send-estimate');

  if (estimatorForm) {
    estimatorForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var sel = getSelections();
      var estimate = computeEstimate(sel);
      var thirdParty = getThirdParty(sel);
      window.__quoteEstimate = { sel: sel, estimate: estimate, thirdParty: thirdParty };
      showLoading(function () {
        renderResults(estimate, thirdParty);
        if (leadSummary) leadSummary.value = buildSummaryText(sel, estimate);
      });
    });
  }

  if (btnSendEstimate) {
    btnSendEstimate.addEventListener('click', function () {
      if (leadCapture) {
        leadCapture.hidden = false;
        leadCapture.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  if (leadForm) {
    leadForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = leadForm.querySelector('button[type="submit"]');
      var status = document.getElementById('lead-form-status');
      var originalText = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      if (status) status.textContent = '';

      fetch(leadForm.action, {
        method: 'POST',
        body: new FormData(leadForm),
        headers: { Accept: 'application/json' }
      })
        .then(function (r) {
          if (r.ok) {
            if (status) {
              status.textContent = 'Thanks! We’ve received your details and will send your estimate and follow up shortly.';
              status.className = 'form-status form-status-success';
            }
            if (btn) btn.textContent = 'Sent!';
            leadForm.reset();
            if (leadSummary) leadSummary.value = '';
          } else {
            throw new Error('Submit failed');
          }
        })
        .catch(function () {
          if (status) {
            status.textContent = 'Something went wrong. Please email hello@strategylab.com or message us on WhatsApp.';
            status.className = 'form-status form-status-error';
          }
          if (btn) btn.textContent = originalText;
        })
        .finally(function () {
          if (btn) {
            btn.disabled = false;
            setTimeout(function () { btn.textContent = originalText; }, 3000);
          }
        });
    });
  }

  var menuBtn = document.querySelector('.menu-btn');
  var navMobile = document.querySelector('.nav-mobile');
  if (menuBtn && navMobile) {
    menuBtn.addEventListener('click', function () {
      navMobile.classList.toggle('open');
      menuBtn.classList.toggle('open');
    });
  }
})();
