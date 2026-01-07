'use strict';

(function () {
  /** @type {HTMLInputElement} */
  const shopInput = document.getElementById('shop');
  /** @type {HTMLInputElement} */
  const amountInput = document.getElementById('amount');
  /** @type {HTMLSelectElement} */
  const periodSelect = document.getElementById('period');
  // provider is fixed to STRIPE, no select
  /** @type {HTMLInputElement} */
  const baseUrlInput = document.getElementById('baseUrl');
  /** @type {HTMLInputElement} */
  const trialDaysInput = document.getElementById('trialDays');
  /** @type {HTMLInputElement} */
  const trialEndDateInput = document.getElementById('trialEndDate');
  /** @type {HTMLInputElement} */
  const variableFeePercentageInput = document.getElementById('variableFeePercentage');
  /** @type {HTMLSelectElement} */
  const variableTypeSelect = document.getElementById('variableType');
  /** @type {HTMLInputElement} */
  const redirectCheckbox = document.getElementById('redirect');
  /** @type {HTMLInputElement} */
  const rememberCheckbox = document.getElementById('remember');
  /** @type {HTMLFormElement} */
  const form = document.getElementById('builderForm');
  /** @type {HTMLInputElement} */
  const resultUrl = document.getElementById('resultUrl');
  /** @type {HTMLButtonElement} */
  const copyBtn = document.getElementById('copyBtn');
  /** @type {HTMLButtonElement} */
  const openBtn = document.getElementById('openBtn');
  /** @type {HTMLButtonElement} */
  const shareBtn = document.getElementById('shareBtn');
  /** @type {HTMLButtonElement} */
  const resetBtn = document.getElementById('resetBtn');

  const ERRORS = {
    shop: document.querySelector('[data-error-for="shop"]'),
    amount: document.querySelector('[data-error-for="amount"]'),
    period: document.querySelector('[data-error-for="period"]'),
    trialDays: document.querySelector('[data-error-for="trialDays"]'),
    trialEndDate: document.querySelector('[data-error-for="trialEndDate"]'),
    variableFeePercentage: document.querySelector('[data-error-for="variableFeePercentage"]'),
  };

  const STORAGE_KEY = 'subscribe-enterprise-form:v1';

  function saveState() {
    if (!rememberCheckbox.checked) return;
    const state = {
      shop: shopInput.value.trim(),
      amount: amountInput.value.trim(),
      period: periodSelect.value,
      baseUrl: baseUrlInput.value.trim(),
      trialDays: trialDaysInput.value.trim(),
      trialEndDate: trialEndDateInput.value.trim(),
      variableFeePercentage: variableFeePercentageInput.value.trim(),
      variableType: variableTypeSelect.value,
      redirect: redirectCheckbox.checked,
      remember: rememberCheckbox.checked,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage errors
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const state = JSON.parse(raw);
      if (typeof state !== 'object' || state === null) return;
      if (state.shop) shopInput.value = state.shop;
      if (state.amount) amountInput.value = state.amount;
      if (state.period) periodSelect.value = state.period;
      if (state.baseUrl) baseUrlInput.value = state.baseUrl;
      if (state.trialDays) trialDaysInput.value = state.trialDays;
      if (state.trialEndDate) trialEndDateInput.value = state.trialEndDate;
      if (state.variableFeePercentage) variableFeePercentageInput.value = state.variableFeePercentage;
      if (state.variableType) variableTypeSelect.value = state.variableType;
      if (typeof state.redirect === 'boolean') redirectCheckbox.checked = state.redirect;
      if (typeof state.remember === 'boolean') rememberCheckbox.checked = state.remember;
    } catch {
      // ignore parse errors
    }
  }

  function normalizedShop(value) {
    const v = (value || '').trim();
    if (!v) return '';
    return v.toLowerCase();
  }

  function validate() {
    let ok = true;
    // Clear previous
    Object.values(ERRORS).forEach(el => (el.textContent = ''));

    const shopRaw = shopInput.value.trim();
    const shop = normalizedShop(shopRaw);
    if (!shop) {
      ERRORS.shop.textContent = 'Shop domain is required.';
      ok = false;
    } else if (/^https?:\/\//i.test(shopRaw)) {
      ERRORS.shop.textContent = 'Enter shop domain only, not a full URL.';
      ok = false;
    } else if (!/^[a-z0-9-]+\.myshopify\.com$/.test(shop)) {
      ERRORS.shop.textContent = 'Enter a valid *.myshopify.com domain.';
      ok = false;
    }

    const amount = Number(amountInput.value);
    if (!Number.isFinite(amount) || amount < 1) {
      ERRORS.amount.textContent = 'Enter a valid amount (>= 1).';
      ok = false;
    } else if (!Number.isInteger(amount)) {
      ERRORS.amount.textContent = 'Amount must be a whole USD amount.';
      ok = false;
    }

    const allowedPeriods = new Set(['MONTHLY', 'YEARLY']);
    if (!allowedPeriods.has(periodSelect.value)) {
      ERRORS.period.textContent = 'Choose MONTHLY or YEARLY.';
      ok = false;
    }

    // trialDays vs trialEndDate mutual exclusivity and validation
    const trialDaysRaw = trialDaysInput.value.trim();
    const trialEndRaw = trialEndDateInput.value.trim();
    if (trialDaysRaw && trialEndRaw) {
      ERRORS.trialEndDate.textContent = 'Provide either trialDays or trialEndDate, not both.';
      ok = false;
    }
    if (trialDaysRaw) {
      const td = Number(trialDaysRaw);
      if (!Number.isInteger(td) || td < 0) {
        ERRORS.trialDays.textContent = 'trialDays must be a whole number >= 0.';
        ok = false;
      }
    }
    if (trialEndRaw) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(trialEndRaw)) {
        ERRORS.trialEndDate.textContent = 'Use YYYY-MM-DD format.';
        ok = false;
      } else {
        const parsed = new Date(trialEndRaw);
        if (isNaN(parsed.getTime())) {
          ERRORS.trialEndDate.textContent = 'Invalid date.';
          ok = false;
        } else if (parsed.getTime() <= Date.now()) {
          ERRORS.trialEndDate.textContent = 'Date must be in the future.';
          ok = false;
        }
      }
    }

    // variable fee percentage validation (optional)
    const vfpRaw = variableFeePercentageInput.value.trim();
    if (vfpRaw) {
      const v = Number(vfpRaw);
      if (!Number.isFinite(v) || v < 0) {
        ERRORS.variableFeePercentage.textContent = 'Enter a valid non-negative number.';
        ok = false;
      }
    }

    try {
      // Basic URL validation for base
      const u = new URL(baseUrlInput.value);
      if (!/^https?:$/.test(u.protocol)) throw new Error('Invalid protocol');
    } catch {
      // We do not surface base URL errors loudly; keep advanced quiet
    }

    return ok;
  }

  function buildUrl() {
    const base = baseUrlInput.value.trim() || 'https://api.appbrew.tech/billing/subscribe-enterprise-plan';
    const url = new URL(base);
    const shop = normalizedShop(shopInput.value);
    const amount = String(Number(amountInput.value));
    const period = periodSelect.value;
    const provider = 'STRIPE';
    const trialDaysValue = trialDaysInput.value.trim();
    const trialEndValue = trialEndDateInput.value.trim();
    const variableFee = variableFeePercentageInput.value.trim();
    const variableType = variableTypeSelect.value;
    const redirect = redirectCheckbox.checked;

    url.searchParams.set('shop', shop);
    url.searchParams.set('amountInUSD', amount);
    url.searchParams.set('period', period);
    url.searchParams.set('provider', provider);
    // Only one of trialDays or trialEndDate
    if (trialEndValue) {
      url.searchParams.set('trialEndDate', trialEndValue);
      url.searchParams.set('trialDays', '0');
    } else if (trialDaysValue) {
      url.searchParams.set('trialDays', String(Number(trialDaysValue)));
    }
    if (variableFee) {
      url.searchParams.set('variableFeePercentage', variableFee);
    }
    if (variableType) {
      url.searchParams.set('variableType', variableType);
    }
    if (redirect === false) {
      url.searchParams.set('redirect', 'false');
    }
    return url.toString();
  }

  function updatePreview() {
    if (!shopInput.value && !amountInput.value) {
      resultUrl.value = '';
      return;
    }
    if (!validate()) {
      // Don't block preview entirely; still try building if basic params exist
    }
    const url = buildUrl();
    resultUrl.value = url;
  }

  function onSubmit(e) {
    e.preventDefault();
    if (!validate()) {
      updatePreview();
      return;
    }
    const url = buildUrl();
    resultUrl.value = url;
    saveState();
  }

  async function copyToClipboard() {
    const text = resultUrl.value.trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast('Copied link to clipboard');
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        document.execCommand('copy');
        toast('Copied link to clipboard');
      } catch {
        toast('Copy failed');
      } finally {
        document.body.removeChild(ta);
      }
    }
  }

  function openInNewTab() {
    const url = resultUrl.value.trim();
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async function shareLink() {
    const url = resultUrl.value.trim();
    if (!url) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Enterprise Subscribe Link', url });
      } catch {
        // user cancelled or unsupported
      }
    } else {
      await copyToClipboard();
    }
  }

  function toast(message) {
    const el = document.createElement('div');
    el.textContent = message;
    el.style.position = 'fixed';
    el.style.bottom = '20px';
    el.style.left = '50%';
    el.style.transform = 'translateX(-50%)';
    el.style.background = '#1a2340';
    el.style.border = '1px solid #273457';
    el.style.color = '#e6e8ee';
    el.style.padding = '8px 12px';
    el.style.borderRadius = '10px';
    el.style.boxShadow = '0 8px 20px rgba(0,0,0,0.35)';
    el.style.zIndex = '9999';
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity 200ms ease';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 220);
    }, 1300);
  }

  function wireEvents() {
    form.addEventListener('submit', onSubmit);
    [shopInput, amountInput, periodSelect, baseUrlInput, trialDaysInput, trialEndDateInput, variableFeePercentageInput, variableTypeSelect, redirectCheckbox].forEach(el => {
      el.addEventListener('input', updatePreview);
      el.addEventListener('change', () => {
        updatePreview();
        saveState();
      });
    });
    // Mutual exclusivity UX: clear and disable the other field when one is filled
    trialDaysInput.addEventListener('input', () => {
      if (trialDaysInput.value.trim()) {
        trialEndDateInput.value = '';
        trialEndDateInput.disabled = true;
      } else {
        trialEndDateInput.disabled = false;
      }
    });
    trialEndDateInput.addEventListener('input', () => {
      if (trialEndDateInput.value.trim()) {
        trialDaysInput.value = '';
        trialDaysInput.disabled = true;
      } else {
        trialDaysInput.disabled = false;
      }
    });
    copyBtn.addEventListener('click', copyToClipboard);
    openBtn.addEventListener('click', openInNewTab);
    shareBtn.addEventListener('click', shareLink);
    resetBtn.addEventListener('click', () => {
      Object.values(ERRORS).forEach(el => (el.textContent = ''));
      resultUrl.value = '';
      setTimeout(() => {
        // Keep base URL and remember toggle on reset
        trialEndDateInput.disabled = false;
        trialDaysInput.disabled = false;
        updatePreview();
        saveState();
      }, 0);
    });
  }

  // Bootstrap
  loadState();
  wireEvents();
  updatePreview();
})();


