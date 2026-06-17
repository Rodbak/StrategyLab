(function () {
  'use strict';

  var DOMAIN_PRICES = { com: 120, org: 110, net: 110, 'com.gh': 85, gh: 180 };
  var HOSTING_ESTIMATE = 400;
  var LOADING_DURATION = 3200;

  function I() {
    return window.StrategyLabI18n;
  }

  function qc(k) {
    return I() ? I().t('quote.c.' + k) : '';
  }

  function fmtGhs(ghs) {
    return I() ? I().formatMoneyRounded(I().ghsToDisplay(ghs)) : 'GHS ' + ghs;
  }

  function getBudgetGhs() {
    var el = document.getElementById('budget-input');
    var n = el ? parseInt(el.value, 10) : 10000;
    if (isNaN(n)) n = 10000;
    if (I()) n = I().displayToGhs(n);
    var L = I() ? I().getSliderLimitsGhs() : { min: 800, max: 150000 };
    return Math.min(L.maxInput || 150000, Math.max(L.min, n));
  }

  function getSelections() {
    var projectType = (document.querySelector('input[name="project_type"]:checked') || {}).value || 'simple-website';
    return {
      budget: getBudgetGhs(),
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
    var nextStep = qc('next_step');

    if (sel.projectType === 'ads-only') {
      packageName = qc('pkg_ads');
      included.push(qc('inc_ads_0'));
      included.push(qc('inc_ads_1'));
      included.push(qc('inc_ads_2'));
      if (budget >= 8000) included.push(qc('inc_ads_3'));
      excluded.push(qc('exc_ads_0'));
      excluded.push(qc('exc_ads_1'));
      if (sel.wantLandingPages) addons.push(qc('add_ads_land'));
      if (sel.wantSeo) addons.push(qc('add_ads_seo'));
      timelineText = qc('time_ads');
    } else if (budget < 4000) {
      packageName = qc('pkg_starter');
      included.push(qc('inc_st_0'));
      included.push(qc('inc_st_1'));
      included.push(qc('inc_st_2'));
      excluded.push(qc('exc_st_0'));
      excluded.push(qc('exc_st_1'));
      if (sel.needDomainHosting) addons.push(qc('add_st_dh'));
      if (sel.wantAds) addons.push(qc('add_st_ads'));
      timelineText = qc('time_st');
    } else if (budget < 12000) {
      packageName = qc('pkg_ess');
      included.push(qc('inc_es_0'));
      included.push(qc('inc_es_1'));
      included.push(qc('inc_es_2'));
      included.push(qc('inc_es_3'));
      if (sel.hasBranding) included.push(qc('inc_es_brand'));
      excluded.push(qc('exc_es_0'));
      if (sel.wantAds) addons.push(qc('add_es_ads'));
      if (sel.wantLandingPages) addons.push(qc('add_es_land'));
      if (sel.wantMaintenance) addons.push(qc('add_es_maint'));
      if (sel.needDomainHosting) addons.push(qc('add_es_dh'));
      timelineText = qc('time_es');
    } else if (budget < 25000) {
      packageName = qc('pkg_growth');
      included.push(qc('inc_gr_0'));
      included.push(qc('inc_gr_1'));
      included.push(qc('inc_gr_2'));
      included.push(qc('inc_gr_3'));
      if (sel.wantLandingPages) included.push(qc('inc_gr_land'));
      if (sel.hasBranding) included.push(qc('inc_gr_brand'));
      excluded.push(qc('exc_gr_0'));
      if (sel.wantAds) addons.push(qc('add_gr_ads'));
      if (sel.wantMaintenance) addons.push(qc('add_gr_maint'));
      if (sel.needDomainHosting) addons.push(qc('add_gr_dh'));
      timelineText = qc('time_gr');
    } else {
      packageName = qc('pkg_prem');
      included.push(qc('inc_pr_0'));
      included.push(qc('inc_pr_1'));
      included.push(qc('inc_pr_2'));
      included.push(qc('inc_pr_3'));
      if (sel.wantAds) included.push(qc('inc_pr_ads'));
      if (sel.wantMaintenance) included.push(qc('inc_pr_maint'));
      if (sel.needDomainHosting) included.push(qc('inc_pr_dh'));
      excluded.push(qc('exc_pr_0'));
      timelineText = qc('time_pr');
    }

    if (sel.projectType === 'redesign') {
      var parts = packageName.split('—');
      var part = parts.length > 1 ? parts.slice(1).join('—').trim() : packageName;
      packageName = I() ? I().t('quote.c.pkg_redesign', { part: part }) : 'Website redesign — ' + part;
      included.unshift(qc('redesign_audit'));
      included.unshift(qc('redesign_migrate'));
    }

    if (sel.projectType === 'website-ads' && budget >= 15000) {
      packageName = qc('pkg_combo');
      var lineFull = qc('inc_pr_ads');
      var lineSetup = qc('add_combo_ads');
      if (included.indexOf(lineFull) === -1 && included.indexOf(lineSetup) === -1) {
        included.push(lineSetup);
      }
    }

    return {
      packageName: packageName,
      included: included.filter(Boolean),
      excluded: excluded,
      addons: addons,
      timelineText: timelineText,
      nextStep: nextStep
    };
  }

  function getThirdParty(sel) {
    if (!I()) return { lines: [], adsNote: '' };
    var lines = [];
    if (sel.needDomainHosting) {
      lines.push({
        term: I().t('quote.tp.domain'),
        detail:
          '.com ' +
          fmtGhs(DOMAIN_PRICES.com) +
          ', .com.gh ' +
          fmtGhs(DOMAIN_PRICES['com.gh']) +
          ', .gh ' +
          fmtGhs(DOMAIN_PRICES.gh)
      });
      lines.push({
        term: I().t('quote.tp.hosting'),
        detail: fmtGhs(HOSTING_ESTIMATE) + I().t('quote.tp.hosting_suffix')
      });
    }
    lines.push({
      term: I().t('quote.tp.plugins'),
      detail: I().t('quote.tp.plugins_d')
    });
    var adsNote = '';
    if (sel.wantAds) {
      adsNote = I().t('quote.tp.ads_note', {
        low: fmtGhs(500),
        high: fmtGhs(2000)
      });
    }
    return { lines: lines, adsNote: adsNote };
  }

  function renderResults(estimate, thirdParty) {
    if (!I()) return;
    var pkg = document.getElementById('results-package');
    var inc = document.getElementById('results-included');
    var exc = document.getElementById('results-excluded');
    var add = document.getElementById('results-addons');
    var time = document.getElementById('results-timeline');
    var next = document.getElementById('results-next');
    var third = document.getElementById('results-third-party');
    var adsNoteEl = document.getElementById('third-party-ads-note');

    if (pkg) pkg.textContent = I().t('quote.r.recommended', { pkg: estimate.packageName });
    if (inc) {
      inc.innerHTML = '';
      var incDt = document.createElement('dt');
      incDt.textContent = I().t('quote.r.included_dt');
      var incDd = document.createElement('dd');
      incDd.textContent = estimate.included.join(' · ');
      inc.appendChild(incDt);
      inc.appendChild(incDd);
    }
    if (exc) {
      exc.innerHTML = '';
      if (estimate.excluded.length) {
        var excDt = document.createElement('dt');
        excDt.textContent = I().t('quote.r.excluded_dt');
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
        addDt.textContent = I().t('quote.r.addons_dt');
        var addDd = document.createElement('dd');
        addDd.textContent = estimate.addons.join(' · ');
        add.appendChild(addDt);
        add.appendChild(addDd);
      }
    }
    if (time) time.textContent = I().t('quote.r.timeline', { text: estimate.timelineText });
    if (next) next.textContent = I().t('quote.r.next', { text: estimate.nextStep });

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
    var msgs = I() ? I().tArray('quote_page.loading') : [];
    if (!msgs.length) msgs = ['…'];
    if (formSec) formSec.setAttribute('aria-hidden', 'true');
    if (loadSec) {
      loadSec.hidden = false;
      loadSec.setAttribute('aria-busy', 'true');
    }
    var step = 0;
    var interval = setInterval(function () {
      if (textEl && msgs[step]) {
        textEl.textContent = msgs[step];
        step++;
      }
    }, LOADING_DURATION / msgs.length);
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
    if (!I()) return '';
    var T = I().t.bind(I());
    var parts = [
      T('quote.sum.budget') + ': ' + I().formatMoneyRounded(I().ghsToDisplay(sel.budget)),
      T('quote.sum.project') + ': ' + (sel.projectType || ''),
      T('quote.sum.package') + ': ' + estimate.packageName
    ];
    if (sel.needDomainHosting) parts.push(T('quote.sum.domain'));
    if (sel.wantAds) parts.push(T('quote.sum.ads'));
    if (sel.wantLandingPages) parts.push(T('quote.sum.land'));
    if (sel.wantSeo) parts.push(T('quote.sum.seo'));
    if (sel.wantMaintenance) parts.push(T('quote.sum.maint'));
    parts.push('locale:' + I().getLang() + ' currency:' + I().getCurrency());
    return parts.join(' | ');
  }

  var budgetSlider = document.getElementById('budget-slider');
  var budgetInput = document.getElementById('budget-input');
  var budgetDisplay = document.getElementById('budget-display');

  function syncBudget(fromSlider) {
    if (!I()) return;
    var L = I().getSliderLimitsDisplay();
    var val = fromSlider ? parseInt(budgetSlider.value, 10) : parseInt(budgetInput.value, 10);
    val = Math.min(L.maxInput, Math.max(L.min, isNaN(val) ? Math.round((L.min + L.max) / 2) : val));
    if (budgetSlider) {
      budgetSlider.min = L.min;
      budgetSlider.max = L.max;
      budgetSlider.value = val;
    }
    if (budgetInput) {
      budgetInput.min = L.min;
      budgetInput.max = L.maxInput;
      budgetInput.value = val;
    }
    if (budgetDisplay) budgetDisplay.textContent = I().formatMoneyRounded(val);
    if (budgetSlider) {
      budgetSlider.setAttribute('aria-valuetext', I().formatMoneyRounded(val));
    }
    var bl = document.getElementById('budget-label-tpl');
    if (bl) bl.textContent = I().t('quote_page.budget_label', { currency: I().getCurrency() });
    if (budgetInput) {
      budgetInput.setAttribute('aria-label', I().t('quote_page.budget_aria', { currency: I().getCurrency() }));
    }
  }

  function onCurrencyOrLocaleChange() {
    var ghs = getBudgetGhs();
    var disp = I().ghsToDisplay(ghs);
    var rounded = Math.round(disp);
    if (budgetSlider) budgetSlider.value = rounded;
    if (budgetInput) budgetInput.value = rounded;
    syncBudget(true);
    if (window.__quoteEstimate) {
      var q = window.__quoteEstimate;
      renderResults(q.estimate, q.thirdParty);
      var leadSummary = document.getElementById('lead-estimate-summary');
      if (leadSummary) leadSummary.value = buildSummaryText(q.sel, q.estimate);
    }
  }

  function bindBudget() {
    if (budgetSlider) budgetSlider.addEventListener('input', function () {
      syncBudget(true);
    });
    if (budgetInput) {
      budgetInput.addEventListener('change', function () {
        syncBudget(false);
      });
      budgetInput.addEventListener('blur', function () {
        syncBudget(false);
      });
    }
    if (I()) I().onChange(onCurrencyOrLocaleChange);
  }

  function runQuoteApp() {
    bindBudget();
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
        var sending = I() ? I().t('common.sending') : 'Sending…';
        if (btn) {
          btn.disabled = true;
          btn.textContent = sending;
        }
        if (status) status.textContent = '';
        if (I()) I().syncHiddenFormFields();

        fetch(leadForm.action, {
          method: 'POST',
          body: new FormData(leadForm),
          headers: { Accept: 'application/json' }
        })
          .then(function (r) {
            if (r.ok) {
              if (status) {
                status.textContent = I().t('quote_page.lead_success');
                status.className = 'form-status form-status-success';
              }
              if (btn) btn.textContent = I().t('common.sent');
              leadForm.reset();
              if (leadSummary) leadSummary.value = '';
            } else {
              throw new Error('Submit failed');
            }
          })
          .catch(function () {
            if (status) {
              status.textContent = I().t('quote_page.lead_error');
              status.className = 'form-status form-status-error';
            }
            if (btn) btn.textContent = originalText;
          })
          .finally(function () {
            if (btn) {
              btn.disabled = false;
              setTimeout(function () {
                btn.textContent = originalText;
              }, 3000);
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

    // Nav "More" dropdown — same behaviour as the home page
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
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!window.StrategyLabI18n) {
      runQuoteApp();
      return;
    }
    window.StrategyLabI18n.init()
      .then(function () {
        runQuoteApp();
      })
      .catch(function () {
        runQuoteApp();
      });
  });
})();
