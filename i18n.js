/**
 * StrategyLab — locale & currency (EN/FR, multi-currency display)
 * Rates vs GHS are approximate; shown amounts are indicative.
 */
(function () {
  'use strict';

  var STORAGE_LANG = 'strategylab_locale';
  var STORAGE_CUR = 'strategylab_currency';

  /** How many GHS one unit of this currency equals (approximate, as of Jul 2026). */
  var GHS_PER_UNIT = { GHS: 1, XOF: 0.0196 };

  var SUPPORTED_LANGS = ['en', 'fr'];
  var SUPPORTED_CUR = ['GHS', 'XOF'];

  var bundle = {};
  var currentLang = 'en';
  var currentCur = 'GHS';
  var listeners = [];
  var initPromise = null;
  var controlsWired = false;

  function detectLang() {
    var langs = [];
    try {
      if (Array.isArray(navigator.languages)) langs = navigator.languages.slice(0);
    } catch (e) {}
    if (!langs.length) langs = [navigator.language || 'en'];
    for (var i = 0; i < langs.length; i++) {
      var base = String(langs[i] || '')
        .split('-')[0]
        .toLowerCase();
      if (SUPPORTED_LANGS.indexOf(base) !== -1) return base;
    }
    return 'en';
  }

  function detectCurrencyFromLang(lang) {
    /* French-speaking visitors are more likely in the CFA (XOF) zone; everyone else defaults to GHS. */
    return lang === 'fr' ? 'XOF' : 'GHS';
  }

  function getAtPath(obj, path) {
    if (!obj || !path) return null;
    var parts = path.split('.');
    var v = obj;
    for (var i = 0; i < parts.length; i++) {
      if (v == null) return null;
      v = v[parts[i]];
    }
    return v;
  }

  function getNested(obj, path) {
    var v = getAtPath(obj, path);
    return typeof v === 'string' || typeof v === 'number' ? String(v) : '';
  }

  function interpolate(str, vars) {
    if (!str || !vars) return str;
    return str.replace(/\{\{(\w+)\}\}/g, function (_, k) {
      return vars[k] != null ? String(vars[k]) : '';
    });
  }

  function t(key, vars) {
    var raw = getNested(bundle[currentLang], key);
    if (!raw && currentLang !== 'en') raw = getNested(bundle.en, key);
    return vars ? interpolate(raw, vars) : raw;
  }

  function tArray(key) {
    var v = getAtPath(bundle[currentLang], key);
    if ((!v || !Array.isArray(v)) && currentLang !== 'en') v = getAtPath(bundle.en, key);
    return Array.isArray(v) ? v : [];
  }

  /** Convert amount in selected display currency → GHS (internal estimator). */
  function displayToGhs(amount) {
    var rate = GHS_PER_UNIT[currentCur] || 1;
    return Math.round(amount * rate);
  }

  /** Convert GHS → display currency amount. */
  function ghsToDisplay(ghs) {
    var rate = GHS_PER_UNIT[currentCur] || 1;
    return ghs / rate;
  }

  function formatMoney(displayAmount) {
    var loc = currentLang === 'fr' ? 'fr-FR' : 'en-GB';
    try {
      return new Intl.NumberFormat(loc, {
        style: 'currency',
        currency: currentCur,
        maximumFractionDigits: currentCur === 'GHS' ? 0 : 0
      }).format(displayAmount);
    } catch (e) {
      return currentCur + ' ' + Number(displayAmount).toLocaleString(loc);
    }
  }

  function formatMoneyRounded(displayAmount) {
    return formatMoney(Math.round(displayAmount));
  }

  function getSliderLimitsGhs() {
    return { min: 800, max: 80000, maxInput: 150000 };
  }

  function getSliderLimitsDisplay() {
    var L = getSliderLimitsGhs();
    return {
      min: Math.round(ghsToDisplay(L.min)),
      max: Math.round(ghsToDisplay(L.max)),
      maxInput: Math.round(ghsToDisplay(L.maxInput))
    };
  }

  function setLang(lang) {
    if (SUPPORTED_LANGS.indexOf(lang) === -1) return;
    currentLang = lang;
    try {
      localStorage.setItem(STORAGE_LANG, lang);
    } catch (e) {}
    document.documentElement.lang = lang === 'fr' ? 'fr' : 'en';
    applyDom(document);
    updateMeta();
    syncControls();
    notify();
  }

  function setCurrency(code) {
    if (SUPPORTED_CUR.indexOf(code) === -1) return;
    currentCur = code;
    try {
      localStorage.setItem(STORAGE_CUR, code);
    } catch (e) {}
    syncHiddenFormFields();
    applyDom(document);
    syncControls();
    notify();
  }

  function updateMeta() {
    var isQuote = document.body && document.body.classList.contains('page-quote');
    var title = isQuote ? t('quote_page.meta_title') : t('meta.title');
    var desc = isQuote ? t('quote_page.meta_desc') : t('meta.description');
    if (title) document.title = title;
    var md = document.querySelector('meta[name="description"]');
    if (md && desc) md.setAttribute('content', desc);
  }

  function applyDom(root) {
    root = root || document;
    root.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (!key) return;
      var val = t(key);
      if (val) el.textContent = val;
    });
    root.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      if (!key) return;
      var val = t(key);
      if (val) el.innerHTML = val;
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (!key) return;
      var val = t(key);
      if (val) el.setAttribute('placeholder', val);
    });
    root.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria');
      if (!key) return;
      var val = t(key);
      if (val) el.setAttribute('aria-label', val);
    });
    root.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-title');
      if (!key) return;
      var val = t(key);
      if (val) el.setAttribute('title', val);
    });
    /* Option elements: data-i18n on parent select + data-i18n-opt="value" on option */
    root.querySelectorAll('select option[data-i18n-opt]').forEach(function (opt) {
      var key = opt.getAttribute('data-i18n-opt');
      if (!key) return;
      var val = t(key);
      if (val) opt.textContent = val;
    });
    syncHiddenFormFields();
    refreshContactBudgetSelect();
    root.querySelectorAll('[data-i18n-tpl]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-tpl');
      if (!key) return;
      var val = t(key, { currency: currentCur });
      if (val) el.textContent = val;
    });
  }

  function syncHiddenFormFields() {
    document.querySelectorAll('[data-sync-locale]').forEach(function (el) {
      el.value = currentLang;
    });
    document.querySelectorAll('[data-sync-currency]').forEach(function (el) {
      el.value = currentCur;
    });
  }

  function budgetRangeLabels() {
    var pairs = [
      [800, 2000],
      [2000, 5000],
      [5000, 10000],
      [10000, 20000]
    ];
    var labels = pairs.map(function (p) {
      return (
        formatMoneyRounded(ghsToDisplay(p[0])) +
        ' – ' +
        formatMoneyRounded(ghsToDisplay(p[1]))
      );
    });
    labels.push(formatMoneyRounded(ghsToDisplay(20000)) + '+');
    return labels;
  }

  function refreshContactBudgetSelect() {
    var sel = document.getElementById('budget');
    if (!sel || !sel.getAttribute('data-budget-select')) return;
    var ranges = ['800-2000', '2000-5000', '5000-10000', '10000-20000', '20000+'];
    var opts = budgetRangeLabels();
    var val = sel.value;
    sel.querySelectorAll('option[data-range]').forEach(function (o) {
      o.remove();
    });
    var placeholder = sel.querySelector('option[value=""]');
    if (placeholder) placeholder.textContent = t('contact.budget_placeholder');
    for (var i = 0; i < ranges.length && i < opts.length; i++) {
      var o = document.createElement('option');
      o.value = ranges[i];
      o.setAttribute('data-range', '1');
      o.textContent = opts[i];
      sel.appendChild(o);
    }
    if (val && valuesContains(sel, val)) sel.value = val;
  }

  function valuesContains(select, v) {
    for (var i = 0; i < select.options.length; i++) {
      if (select.options[i].value === v) return true;
    }
    return false;
  }

  function onChange(cb) {
    listeners.push(cb);
  }

  function notify() {
    listeners.forEach(function (fn) {
      try {
        fn();
      } catch (e) {}
    });
  }

  function syncControls() {
    document.querySelectorAll('.locale-select').forEach(function (ls) {
      ls.value = currentLang;
    });
    document.querySelectorAll('.currency-select').forEach(function (cs) {
      cs.value = currentCur;
    });
  }

  function wireControls() {
    if (controlsWired) return;
    controlsWired = true;
    /* Supports multiple instances of each control (e.g. desktop nav + mobile nav), kept in sync. */
    document.querySelectorAll('.locale-select').forEach(function (ls) {
      ls.value = currentLang;
      ls.addEventListener('change', function () {
        var next = ls.value;
        loadBundle(next)
          .then(function () {
            setLang(next);
          })
          .catch(function () {
            setLang('en');
          });
      });
    });
    document.querySelectorAll('.currency-select').forEach(function (cs) {
      cs.value = currentCur;
      cs.addEventListener('change', function () {
        setCurrency(cs.value);
      });
    });
  }

  function loadBundle(lang) {
    if (bundle[lang]) return Promise.resolve();
    return fetch('locales/' + lang + '.json')
      .then(function (r) {
        if (!r.ok) throw new Error('fetch');
        return r.json();
      })
      .then(function (json) {
        bundle[lang] = json;
      })
      .catch(function () {
        if (lang === 'en') return Promise.reject(new Error('Missing locales/en.json'));
        bundle[lang] = bundle.en || {};
        return Promise.resolve();
      });
  }

  function init() {
    if (initPromise) return initPromise;
    try {
      // If user didn't explicitly choose a language yet, auto-detect from browser (fr-CA, fr-FR, etc.).
      currentLang = localStorage.getItem(STORAGE_LANG) || detectLang();
      currentCur = localStorage.getItem(STORAGE_CUR) || detectCurrencyFromLang(currentLang);
    } catch (e) {
      currentLang = detectLang();
      currentCur = detectCurrencyFromLang(currentLang);
    }
    if (SUPPORTED_LANGS.indexOf(currentLang) === -1) currentLang = 'en';
    if (SUPPORTED_CUR.indexOf(currentCur) === -1) currentCur = 'GHS';

    document.documentElement.lang = currentLang === 'fr' ? 'fr' : 'en';

    initPromise = loadBundle('en')
      .then(function () {
        return currentLang === 'en' ? Promise.resolve() : loadBundle(currentLang);
      })
      .then(function () {
        if (!bundle[currentLang]) currentLang = 'en';
        wireControls();
        applyDom(document);
        notify();
      })
      .catch(function () {
        wireControls();
      });
    return initPromise;
  }

  window.StrategyLabI18n = {
    init: init,
    t: t,
    tArray: tArray,
    setLang: setLang,
    setCurrency: setCurrency,
    getLang: function () {
      return currentLang;
    },
    getCurrency: function () {
      return currentCur;
    },
    formatMoney: formatMoney,
    formatMoneyRounded: formatMoneyRounded,
    displayToGhs: displayToGhs,
    ghsToDisplay: ghsToDisplay,
    getSliderLimitsGhs: getSliderLimitsGhs,
    getSliderLimitsDisplay: getSliderLimitsDisplay,
    applyDom: applyDom,
    onChange: onChange,
    syncHiddenFormFields: syncHiddenFormFields,
    GHS_PER_UNIT: GHS_PER_UNIT
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init().catch(function () {});
    });
  } else {
    init().catch(function () {});
  }
})();
