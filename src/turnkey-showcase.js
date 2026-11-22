// ═══════════════════════════════════════════════════════════════════════════════
// GlamGo Turnkey Platform Buyer & Partner Showcase Suite (src/turnkey-showcase.js)
// Covers TURN-02 (White-Label Brand Customizer), TURN-03 (Dual-Mode ROI Calculator),
// TURN-04 (3-Tier Comparison Matrix & Tech Architecture Spec), TURN-05 (Proposal Lead Capture)
// ═══════════════════════════════════════════════════════════════════════════════

export const WHITE_LABEL_STORAGE_KEY = 'glamgo-whitelabel-config-v1';

export const WHITE_LABEL_DEFAULTS = {
  brandName: 'GlamGo',
  currency: 'INR',
  accentPreset: 'champagne',
  customAccent: '#C5A059'
};

export const CURRENCY_CONFIG = {
  INR: { code: 'INR', symbol: '₹', locale: 'en-IN', rate: 1, label: '₹ INR' },
  USD: { code: 'USD', symbol: '$', locale: 'en-US', rate: 0.012, label: '$ USD' },
  AED: { code: 'AED', symbol: 'AED ', locale: 'en-AE', rate: 0.044, label: 'AED' },
  GBP: { code: 'GBP', symbol: '£', locale: 'en-GB', rate: 0.0095, label: '£ GBP' }
};

export const ACCENT_PRESETS = {
  champagne: {
    id: 'champagne',
    label: 'Brushed Champagne',
    champagne: '#C5A059',
    terracotta: '#B86B52',
    terracottaDeep: '#9B523B'
  },
  rose: {
    id: 'rose',
    label: 'Atelier Rose',
    champagne: '#C47D6A',
    terracotta: '#A4523E',
    terracottaDeep: '#843B2A'
  },
  emerald: {
    id: 'emerald',
    label: 'Botanical Emerald',
    champagne: '#3B7A66',
    terracotta: '#2B6251',
    terracottaDeep: '#1E493C'
  },
  plum: {
    id: 'plum',
    label: 'Velvet Plum',
    champagne: '#8E5A7A',
    terracotta: '#724260',
    terracottaDeep: '#562E47'
  }
};

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

function sanitizeWhiteLabelConfig(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const trimmedName = String(src.brandName ?? WHITE_LABEL_DEFAULTS.brandName).trim().slice(0, 32);
  const brandName = trimmedName.length >= 1 ? trimmedName : WHITE_LABEL_DEFAULTS.brandName;
  const currency = Object.prototype.hasOwnProperty.call(CURRENCY_CONFIG, src.currency)
    ? src.currency
    : WHITE_LABEL_DEFAULTS.currency;
  const accentPreset = (src.accentPreset === 'custom' || Object.prototype.hasOwnProperty.call(ACCENT_PRESETS, src.accentPreset))
    ? src.accentPreset
    : WHITE_LABEL_DEFAULTS.accentPreset;
  const customAccent = HEX_COLOR_RE.test(String(src.customAccent || ''))
    ? String(src.customAccent)
    : WHITE_LABEL_DEFAULTS.customAccent;
  return { brandName, currency, accentPreset, customAccent };
}

export function loadWhiteLabelConfig() {
  try {
    const raw = localStorage.getItem(WHITE_LABEL_STORAGE_KEY);
    if (!raw) return { ...WHITE_LABEL_DEFAULTS };
    return sanitizeWhiteLabelConfig(JSON.parse(raw));
  } catch {
    return { ...WHITE_LABEL_DEFAULTS };
  }
}

export function saveWhiteLabelConfig(cfg) {
  const clean = sanitizeWhiteLabelConfig(cfg);
  try {
    localStorage.setItem(WHITE_LABEL_STORAGE_KEY, JSON.stringify(clean));
  } catch {}
  return clean;
}

export function applyWhiteLabelTheme(cfg) {
  const clean = sanitizeWhiteLabelConfig(cfg);
  if (typeof document === 'undefined') return clean;
  const root = document.documentElement;
  if (clean.accentPreset === 'custom' && HEX_COLOR_RE.test(clean.customAccent)) {
    root.style.setProperty('--champagne', clean.customAccent);
    root.style.setProperty('--terracotta', clean.customAccent);
    root.style.setProperty('--terracotta-deep', clean.customAccent);
  } else {
    const preset = ACCENT_PRESETS[clean.accentPreset] || ACCENT_PRESETS.champagne;
    root.style.setProperty('--champagne', preset.champagne);
    root.style.setProperty('--terracotta', preset.terracotta);
    root.style.setProperty('--terracotta-deep', preset.terracottaDeep);
  }
  document.title = `${clean.brandName} — Luxury Beauty Services, Salon Booking & Skincare Marketplace`;
  return clean;
}

export function formatWhiteLabelMoney(inrAmount, cfg) {
  const clean = sanitizeWhiteLabelConfig(cfg);
  const curr = CURRENCY_CONFIG[clean.currency] || CURRENCY_CONFIG.INR;
  const num = Number(inrAmount) || 0;
  const converted = curr.code === 'INR' ? Math.round(num) : Math.max(1, Math.round(num * curr.rate));
  return curr.symbol + converted.toLocaleString(curr.locale, { maximumFractionDigits: 0 });
}

export function renderWhiteLabelWordmark(cfg, isLight, brandMarkHtml, esc) {
  const clean = sanitizeWhiteLabelConfig(cfg);
  const name = clean.brandName || 'GlamGo';
  const upper = name.toUpperCase();
  let innerHtml = '';
  if (upper.includes(' ')) {
    const parts = upper.split(/\s+/);
    const tail = parts.pop();
    innerHtml = esc(parts.join(' ') + ' ') + '<span class="brand-gold">' + esc(tail) + '</span>';
  } else if (upper.length > 4) {
    const splitIdx = Math.ceil(upper.length * 0.6);
    innerHtml = esc(upper.slice(0, splitIdx)) + '<span class="brand-gold">' + esc(upper.slice(splitIdx)) + '</span>';
  } else {
    innerHtml = '<span class="brand-gold">' + esc(upper) + '</span>';
  }
  return '<button class="wordmark' + (isLight ? ' light' : '') + '" data-action="landing" aria-label="' + esc(name) + ' home">' +
    brandMarkHtml +
    '<span class="wordmark-text">' + innerHtml + '</span>' +
  '</button>';
}

export function renderWhiteLabelCustomizerDrawer(cfg, isOpen, { esc, icon }) {
  if (!isOpen) return '';
  const clean = sanitizeWhiteLabelConfig(cfg);
  const activeHex = clean.accentPreset === 'custom'
    ? clean.customAccent
    : (ACCENT_PRESETS[clean.accentPreset]?.champagne || '#C5A059');

  return '<div class="tk-customizer-backdrop" data-action="tk-customizer-close">' +
    '<aside class="tk-customizer-drawer" role="dialog" aria-modal="true" aria-label="Live White-Label Brand Customizer">' +
      '<div class="tk-customizer-head">' +
        '<div>' +
          '<span class="eyebrow">WHITE-LABEL SANDBOX</span>' +
          '<h3>Preview With Your Brand</h3>' +
          '<p>Rebrand the entire storefront and all 4 operational dashboards in real time.</p>' +
        '</div>' +
        '<button type="button" class="icon-button" data-action="tk-customizer-close" aria-label="Close brand customizer">' + icon('close', 18) + '</button>' +
      '</div>' +
      '<div class="tk-customizer-body">' +
        '<label class="tk-wl-field">' +
          '<span>YOUR BRAND NAME (1–32 CHARS)</span>' +
          '<input id="tk-wl-brand-input" type="text" maxlength="32" value="' + esc(clean.brandName) + '" placeholder="e.g. Velvet Aura or LuxeGlow">' +
        '</label>' +
        '<div class="tk-wl-field">' +
          '<span>DISPLAY CURRENCY</span>' +
          '<div class="tk-wl-currency-grid" role="group" aria-label="Select display currency">' +
            Object.values(CURRENCY_CONFIG).map(c =>
              '<button type="button" class="tk-wl-curr-btn ' + (clean.currency === c.code ? 'active' : '') + '" data-action="tk-wl-currency" data-id="' + c.code + '">' +
                '<strong>' + esc(c.label) + '</strong>' +
              '</button>'
            ).join('') +
          '</div>' +
        '</div>' +
        '<div class="tk-wl-field">' +
          '<span>EDITORIAL ACCENT PALETTE</span>' +
          '<div class="tk-wl-swatch-grid" role="group" aria-label="Select editorial accent palette">' +
            Object.values(ACCENT_PRESETS).map(p =>
              '<button type="button" class="tk-wl-swatch ' + (clean.accentPreset === p.id ? 'active' : '') + '" data-action="tk-wl-accent" data-id="' + p.id + '">' +
                '<i style="background:' + p.champagne + '"></i>' +
                '<span>' + esc(p.label) + '</span>' +
              '</button>'
            ).join('') +
          '</div>' +
        '</div>' +
        '<label class="tk-wl-field tk-wl-color-row">' +
          '<span>CUSTOM HEX ACCENT</span>' +
          '<div class="tk-wl-color-control">' +
            '<input id="tk-wl-color-picker" type="color" value="' + esc(activeHex) + '" aria-label="Custom brand hex color">' +
            '<code>' + esc(activeHex.toUpperCase()) + '</code>' +
          '</div>' +
        '</label>' +
      '</div>' +
      '<div class="tk-customizer-foot">' +
        '<button type="button" class="btn btn-primary full" data-action="demo-admin">Preview in Admin Command ' + icon('arrow', 15) + '</button>' +
        '<div class="tk-customizer-foot-row">' +
          '<button type="button" class="btn btn-outline-light btn-sm" data-action="tk-proposal-open" data-tier="Turnkey White-Label License">Request License Proposal</button>' +
          '<button type="button" class="btn btn-outline-light btn-sm" data-action="tk-wl-reset">Reset Brand Defaults</button>' +
        '</div>' +
      '</div>' +
    '</aside>' +
  '</div>';
}

// ═══════════════════════════════════════════════════════════════════════════════
// TURN-03: Interactive Dual-Mode ROI & Partner Earnings Calculator
// ═══════════════════════════════════════════════════════════════════════════════

export const DEFAULT_ROI_STATE = {
  tab: 'platform',
  salons: 35,
  bookingsPerSalon: 90,
  avgTicketInr: 1600,
  monthlyOrders: 600,
  avgOrderInr: 1850,
  commissionPct: 15,
  spareChairs: 4,
  fillRatePct: 55,
  partnerTicketInr: 1400,
  retailUnits: 60
};

export function computePlatformRoi(r = DEFAULT_ROI_STATE) {
  const salons = Number(r.salons ?? 35);
  const bookingsPerSalon = Number(r.bookingsPerSalon ?? 90);
  const avgTicketInr = Number(r.avgTicketInr ?? 1600);
  const monthlyOrders = Number(r.monthlyOrders ?? 600);
  const avgOrderInr = Number(r.avgOrderInr ?? 1850);
  const commissionPct = Number(r.commissionPct ?? 15);

  const serviceGmv = salons * bookingsPerSalon * avgTicketInr;
  const commerceGmv = monthlyOrders * avgOrderInr;
  const monthlyGmv = serviceGmv + commerceGmv;
  const monthlyCommission = Math.round((monthlyGmv * commissionPct) / 100);
  const annualRevenue = monthlyCommission * 12;
  const paybackMonths = Math.max(2, Math.min(18, Math.ceil(1200000 / Math.max(1, monthlyCommission))));

  return {
    monthlyGmv,
    monthlyCommission,
    annualRevenue,
    paybackMonths,
    totalMonthlyTransactions: salons * bookingsPerSalon + monthlyOrders
  };
}

export function computePartnerRoi(r = DEFAULT_ROI_STATE) {
  const spareChairs = Number(r.spareChairs ?? 4);
  const fillRatePct = Number(r.fillRatePct ?? 55);
  const partnerTicketInr = Number(r.partnerTicketInr ?? 1400);
  const retailUnits = Number(r.retailUnits ?? 60);

  const incrementalBookings = Math.round((spareChairs * 26 * fillRatePct) / 100);
  const grossServiceInr = incrementalBookings * partnerTicketInr;
  const grossRetailInr = retailUnits * 1550;
  const totalGrossInr = grossServiceInr + grossRetailInr;
  const netMonthlyTakeHome = Math.round(totalGrossInr * 0.85);
  const annualPartnerUplift = netMonthlyTakeHome * 12;

  return {
    incrementalBookings,
    totalGrossInr,
    netMonthlyTakeHome,
    annualPartnerUplift
  };
}

export function renderTurnkeyRoiSection(roiState, wlCfg, { esc, icon, money }) {
  const r = { ...DEFAULT_ROI_STATE, ...(roiState || {}) };
  const isPlatform = r.tab !== 'partner';
  const plat = computePlatformRoi(r);
  const part = computePartnerRoi(r);
  const brand = esc(wlCfg?.brandName || 'GlamGo');

  return '<section class="section tk-roi-section" id="turnkey-roi" aria-labelledby="tk-roi-heading">' +
    '<div class="gg-wrap">' +
      '<div class="section-head">' +
        '<div>' +
          '<span class="eyebrow">INTERACTIVE REVENUE &amp; EARNINGS MODEL</span>' +
          '<h2 id="tk-roi-heading">Calculate your platform ROI or salon partner earnings</h2>' +
          '<p class="section-sub">Model marketplace commission revenue as a white-label platform owner, or switch tabs to estimate incremental monthly chair and skincare sales as a listed partner.</p>' +
        '</div>' +
        '<div class="tk-roi-tabs" role="tablist" aria-label="ROI calculator mode">' +
          '<button type="button" role="tab" aria-selected="' + (isPlatform ? 'true' : 'false') + '" class="tk-roi-tab ' + (isPlatform ? 'active' : '') + '" data-action="tk-roi-tab" data-id="platform">' + icon('shield', 15) + ' Platform Buyer ROI</button>' +
          '<button type="button" role="tab" aria-selected="' + (!isPlatform ? 'true' : 'false') + '" class="tk-roi-tab ' + (!isPlatform ? 'active' : '') + '" data-action="tk-roi-tab" data-id="partner">' + icon('salon', 15) + ' Salon / Brand Partner Earnings</button>' +
        '</div>' +
      '</div>' +
      '<div class="tk-roi-grid">' +
        '<div class="tk-roi-controls">' +
          (isPlatform
            ? '<label class="tk-slider-row">' +
                '<div class="tk-slider-top"><span>Active Partner Salons &amp; Studios</span><strong data-roi-label="salons">' + r.salons + ' studios</strong></div>' +
                '<input type="range" class="tk-roi-slider" data-roi-field="salons" min="10" max="200" step="5" value="' + r.salons + '">' +
              '</label>' +
              '<label class="tk-slider-row">' +
                '<div class="tk-slider-top"><span>Monthly Bookings per Studio</span><strong data-roi-label="bookingsPerSalon">' + r.bookingsPerSalon + ' bookings</strong></div>' +
                '<input type="range" class="tk-roi-slider" data-roi-field="bookingsPerSalon" min="20" max="250" step="10" value="' + r.bookingsPerSalon + '">' +
              '</label>' +
              '<label class="tk-slider-row">' +
                '<div class="tk-slider-top"><span>Average Appointment Ticket</span><strong data-roi-label="avgTicketInr">' + money(r.avgTicketInr) + '</strong></div>' +
                '<input type="range" class="tk-roi-slider" data-roi-field="avgTicketInr" min="600" max="4500" step="100" value="' + r.avgTicketInr + '">' +
              '</label>' +
              '<label class="tk-slider-row">' +
                '<div class="tk-slider-top"><span>Monthly Skincare Store Orders</span><strong data-roi-label="monthlyOrders">' + r.monthlyOrders + ' orders</strong></div>' +
                '<input type="range" class="tk-roi-slider" data-roi-field="monthlyOrders" min="100" max="3000" step="100" value="' + r.monthlyOrders + '">' +
              '</label>' +
              '<label class="tk-slider-row">' +
                '<div class="tk-slider-top"><span>Platform Commission Take-Rate</span><strong data-roi-label="commissionPct">' + r.commissionPct + '%</strong></div>' +
                '<input type="range" class="tk-roi-slider" data-roi-field="commissionPct" min="8" max="25" step="1" value="' + r.commissionPct + '">' +
              '</label>'
            : '<label class="tk-slider-row">' +
                '<div class="tk-slider-top"><span>Available Salon Chairs / Specialists Listed</span><strong data-roi-label="spareChairs">' + r.spareChairs + ' chairs</strong></div>' +
                '<input type="range" class="tk-roi-slider" data-roi-field="spareChairs" min="1" max="15" step="1" value="' + r.spareChairs + '">' +
              '</label>' +
              '<label class="tk-slider-row">' +
                '<div class="tk-slider-top"><span>Weekly Slot Utilization via ' + brand + '</span><strong data-roi-label="fillRatePct">' + r.fillRatePct + '%</strong></div>' +
                '<input type="range" class="tk-roi-slider" data-roi-field="fillRatePct" min="20" max="90" step="5" value="' + r.fillRatePct + '">' +
              '</label>' +
              '<label class="tk-slider-row">' +
                '<div class="tk-slider-top"><span>Average Treatment Ticket</span><strong data-roi-label="partnerTicketInr">' + money(r.partnerTicketInr) + '</strong></div>' +
                '<input type="range" class="tk-roi-slider" data-roi-field="partnerTicketInr" min="600" max="4000" step="100" value="' + r.partnerTicketInr + '">' +
              '</label>' +
              '<label class="tk-slider-row">' +
                '<div class="tk-slider-top"><span>Monthly Retail Skincare Units Sold</span><strong data-roi-label="retailUnits">' + r.retailUnits + ' units</strong></div>' +
                '<input type="range" class="tk-roi-slider" data-roi-field="retailUnits" min="0" max="400" step="10" value="' + r.retailUnits + '">' +
              '</label>'
          ) +
        '</div>' +
        '<div class="tk-roi-card-dark">' +
          '<div class="tk-roi-card-head">' +
            '<span class="acquire-badge acquire-badge-gold">' + icon('sparkle', 14) + ' ' + (isPlatform ? (brand + ' Marketplace Projection') : (brand + ' Partner Payout Projection')) + '</span>' +
            '<span class="tk-roi-note">' + (isPlatform ? '15% default marketplace take-rate' : 'Net after 15% platform curation fee') + '</span>' +
          '</div>' +
          '<div class="tk-roi-kpis">' +
            (isPlatform
              ? '<div class="tk-roi-kpi"><span>Projected Monthly GMV</span><strong data-roi-out="monthlyGmv">' + money(plat.monthlyGmv) + '</strong><small data-roi-out="totalTx">' + plat.totalMonthlyTransactions.toLocaleString('en-IN') + ' monthly bookings &amp; orders</small></div>' +
                '<div class="tk-roi-kpi tk-roi-kpi-gold"><span>Monthly Platform Net Commission</span><strong data-roi-out="monthlyCommission">' + money(plat.monthlyCommission) + '</strong><small>Direct platform fee revenue</small></div>' +
                '<div class="tk-roi-kpi"><span>Annualized Platform Revenue</span><strong data-roi-out="annualRevenue">' + money(plat.annualRevenue) + '</strong><small>12-month run rate at scale</small></div>' +
                '<div class="tk-roi-kpi"><span>Estimated License Payback</span><strong data-roi-out="paybackMonths">~' + plat.paybackMonths + ' months</strong><small>Turnkey white-label breakeven</small></div>'
              : '<div class="tk-roi-kpi"><span>Incremental Monthly Bookings</span><strong data-roi-out="incrementalBookings">' + part.incrementalBookings + ' visits</strong><small>New clients matched to your chairs</small></div>' +
                '<div class="tk-roi-kpi"><span>Gross Monthly Studio &amp; Retail Sales</span><strong data-roi-out="totalGrossInr">' + money(part.totalGrossInr) + '</strong><small>Combined chair + retail volume</small></div>' +
                '<div class="tk-roi-kpi tk-roi-kpi-gold"><span>Net Monthly Partner Take-Home</span><strong data-roi-out="netMonthlyTakeHome">' + money(part.netMonthlyTakeHome) + '</strong><small>85% settled directly via T+7 escrow</small></div>' +
                '<div class="tk-roi-kpi"><span>Annualized Partner Uplift</span><strong data-roi-out="annualPartnerUplift">' + money(part.annualPartnerUplift) + '</strong><small>12-month net studio earnings</small></div>'
            ) +
          '</div>' +
          '<div class="tk-roi-actions">' +
            (isPlatform
              ? '<button type="button" class="btn btn-primary" data-action="tk-proposal-open" data-tier="Turnkey White-Label License">Request White-Label Proposal ' + icon('arrow', 15) + '</button>' +
                '<button type="button" class="btn btn-outline-light" data-action="tk-customizer-toggle">' + icon('palette', 15) + ' Rebrand Live</button>'
              : '<button type="button" class="btn btn-primary" data-action="demo-apply-partner" data-id="Salon Owner">Apply to List Your Business ' + icon('arrow', 15) + '</button>' +
                '<button type="button" class="btn btn-outline-light" data-action="demo-salon">Preview Salon Hub</button>'
            ) +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</section>';
}

export function updateRoiOutputsInPlace(rootEl, roiState, money) {
  if (!rootEl) return;
  const r = { ...DEFAULT_ROI_STATE, ...(roiState || {}) };
  const setLabel = (key, text) => {
    const el = rootEl.querySelector(`[data-roi-label="${key}"]`);
    if (el) el.textContent = text;
  };
  const setOut = (key, text) => {
    const el = rootEl.querySelector(`[data-roi-out="${key}"]`);
    if (el) el.textContent = text;
  };

  if (r.tab !== 'partner') {
    setLabel('salons', `${r.salons} studios`);
    setLabel('bookingsPerSalon', `${r.bookingsPerSalon} bookings`);
    setLabel('avgTicketInr', money(r.avgTicketInr));
    setLabel('monthlyOrders', `${r.monthlyOrders} orders`);
    setLabel('commissionPct', `${r.commissionPct}%`);
    const plat = computePlatformRoi(r);
    setOut('monthlyGmv', money(plat.monthlyGmv));
    setOut('totalTx', `${plat.totalMonthlyTransactions.toLocaleString('en-IN')} monthly bookings & orders`);
    setOut('monthlyCommission', money(plat.monthlyCommission));
    setOut('annualRevenue', money(plat.annualRevenue));
    setOut('paybackMonths', `~${plat.paybackMonths} months`);
  } else {
    setLabel('spareChairs', `${r.spareChairs} chairs`);
    setLabel('fillRatePct', `${r.fillRatePct}%`);
    setLabel('partnerTicketInr', money(r.partnerTicketInr));
    setLabel('retailUnits', `${r.retailUnits} units`);
    const part = computePartnerRoi(r);
    setOut('incrementalBookings', `${part.incrementalBookings} visits`);
    setOut('totalGrossInr', money(part.totalGrossInr));
    setOut('netMonthlyTakeHome', money(part.netMonthlyTakeHome));
    setOut('annualPartnerUplift', money(part.annualPartnerUplift));
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TURN-04: 3-Tier Comparison Matrix & Tech Architecture Deliverables Spec
// ═══════════════════════════════════════════════════════════════════════════════

export const COMPARISON_TIERS = [
  {
    id: 'list-partner',
    badge: 'FOR SALONS, BRANDS & SPECIALISTS',
    title: 'List Salon / Brand on GlamGo',
    priceTag: '0 Upfront · 15% Commission',
    subtitle: 'Join the active marketplace and receive verified bookings and skincare orders with zero software setup cost.',
    featured: false,
    ctaLabel: 'Apply to List Now',
    ctaAction: 'demo-apply-partner',
    ctaId: 'Salon Owner',
    features: [
      'Dedicated Salon Hub, Seller Hub, or Specialist Studio workspace',
      'Live chair calendar, walk-in POS & stylist payroll split ledger',
      'Multi-vendor SKU inventory, batch shelf-life alerts & AWB dispatch',
      'Automated T+7 return-aligned escrow disbursement to your bank'
    ]
  },
  {
    id: 'turnkey-license',
    badge: 'MOST POPULAR · FULL SOURCE & BRAND',
    title: 'Turnkey White-Label License',
    priceTag: 'Complete Platform Ownership',
    subtitle: 'Acquire the entire 3-engine consumer storefront and all 4 operational dashboards deployed under your own brand and domain.',
    featured: true,
    ctaLabel: 'Request White-Label Proposal',
    ctaAction: 'tk-proposal-open',
    ctaTier: 'Turnkey White-Label License',
    features: [
      'Full source code: FastAPI + PostgreSQL 16 + Vite 7 ES module storefront',
      'Custom brand identity, domain, multi-currency (INR / USD / AED / GBP)',
      'All 4 role-isolated dashboards + immutable Admin audit trail & CSV exports',
      'Multi-city GPS Haversine distance engine + Razorpay split-order checkout',
      '7-day guided cloud deployment handoff (Vercel, Render, Railway, Docker)'
    ]
  },
  {
    id: 'enterprise-rollout',
    badge: 'MULTI-REGION & CUSTOM INTEGRATIONS',
    title: 'Enterprise Multi-City Rollout',
    priceTag: 'Custom Architecture & SLA',
    subtitle: 'Tailored national or GCC beauty marketplace rollout with bespoke ERP, CRM, tax, and high-availability cluster engineering.',
    featured: false,
    ctaLabel: 'Schedule Architecture Consult',
    ctaAction: 'tk-proposal-open',
    ctaTier: 'Enterprise Multi-City Rollout',
    features: [
      'Multi-region PostgreSQL + Redis high-availability cluster & read replicas',
      'Custom ERP, POS, Shiprocket/Delhivery & regional payment gateway adapters',
      'Multi-country GST / VAT tax invoicing & automated partner KYC onboarding',
      'Dedicated engineering sprint allocation & priority production SLA'
    ]
  }
];

export function renderComparisonMatrixSection(wlCfg, { esc, icon }) {
  const brand = esc(wlCfg?.brandName || 'GlamGo');
  return '<section class="section tk-matrix-section" id="turnkey-matrix" aria-labelledby="tk-matrix-heading">' +
    '<div class="gg-wrap">' +
      '<div class="section-head">' +
        '<div>' +
          '<span class="eyebrow">ACQUISITION &amp; ONBOARDING TIERS</span>' +
          '<h2 id="tk-matrix-heading">Choose your path: list your business or own the platform</h2>' +
          '<p class="section-sub">Whether you operate a single luxury salon or are launching a regional beauty marketplace under the ' + brand + ' architecture, compare exact deliverables below.</p>' +
        '</div>' +
      '</div>' +
      '<div class="tk-matrix-grid">' +
        COMPARISON_TIERS.map(t =>
          '<article class="tk-tier-card ' + (t.featured ? 'tk-tier-featured' : '') + '">' +
            '<div class="tk-tier-top">' +
              '<span class="tk-tier-badge">' + icon(t.featured ? 'shield' : 'spark', 13) + ' ' + esc(t.badge) + '</span>' +
              '<h3>' + esc(t.title) + '</h3>' +
              '<strong class="tk-tier-price">' + esc(t.priceTag) + '</strong>' +
              '<p>' + esc(t.subtitle) + '</p>' +
            '</div>' +
            '<ul class="tk-tier-list">' +
              t.features.map(f => '<li>' + icon('check', 15) + '<span>' + esc(f) + '</span></li>').join('') +
            '</ul>' +
            '<div class="tk-tier-foot">' +
              '<button type="button" class="btn ' + (t.featured ? 'btn-primary' : 'btn-outline') + ' full" data-action="' + esc(t.ctaAction) + '"' +
                (t.ctaId ? ' data-id="' + esc(t.ctaId) + '"' : '') +
                (t.ctaTier ? ' data-tier="' + esc(t.ctaTier) + '"' : '') +
              '>' + esc(t.ctaLabel) + ' ' + icon('arrow', 15) + '</button>' +
            '</div>' +
          '</article>'
        ).join('') +
      '</div>' +
    '</div>' +
  '</section>';
}

export const DELIVERABLES_SPEC = [
  {
    category: 'Backend & Data Architecture',
    iconName: 'shield',
    items: [
      'Python FastAPI async REST API with dual health probes (/health/live, /health/ready)',
      'SQLAlchemy 2.0 + PostgreSQL 16 & SQLite auto-migrating multi-city GPS schema',
      'Redis 7 read-through catalog cache with automatic in-memory sliding-window rate-limit fallback',
      '83+ passing automated pytest tests covering auth, bookings, multi-vendor escrow & RBAC'
    ]
  },
  {
    category: 'Consumer Storefront & Geo Engine',
    iconName: 'pin',
    items: [
      'Vanilla ES Module Vite 7 code-split frontend (< 350 kB core chunk, 0 chunks > 500 kB)',
      'Haversine GPS distance engine with Near you (<= 8 km) vs. Far from you badges & radius chips',
      'Leaflet interactive maps, city-scoped Cmd+K search, and BeautySalon JSON-LD SEO schema',
      'Zero horizontal overflow verified across 375px mobile and 1440px desktop viewports'
    ]
  },
  {
    category: '4 Role-Isolated Operational Dashboards',
    iconName: 'grid',
    items: [
      'Admin Command Centre: live GMV telemetry, partner approvals, disputes, payouts & Buyer Leads',
      'Salon Owner Hub: visual multi-stylist Chair Calendar, walk-in Front-Desk POS & backbar stock',
      'Product Seller Hub: FIFO batch/expiry tracker, AWB dispatch SLA queue & return hygiene QC',
      'Specialist Studio: live availability toggle, 4-digit arrival OTP sync, SOS safety log & portfolio'
    ]
  },
  {
    category: 'Commerce, Escrow & Cloud DevOps',
    iconName: 'truck',
    items: [
      'Multi-vendor split cart checkout with 15-minute atomic inventory reservation TTL',
      'Razorpay order creation & HMAC-SHA256 webhook verification with idempotency locks',
      'T+7 return-aligned escrow ledger with 15% platform commission & CSV formula sanitization',
      'Multi-cloud blueprints included: Docker non-root, Nginx, Vercel, Render, Railway & Fly.io'
    ]
  }
];

export function renderArchitectureDeliverablesSection({ esc, icon }) {
  return '<section class="section tk-spec-section" id="turnkey-architecture" aria-labelledby="tk-spec-heading">' +
    '<div class="gg-wrap">' +
      '<div class="section-head">' +
        '<div>' +
          '<span class="eyebrow">TECHNICAL DUE DILIGENCE &amp; DELIVERABLES</span>' +
          '<h2 id="tk-spec-heading">Production-grade architecture included in your handover</h2>' +
          '<p class="section-sub">Built for immediate deployment and engineering audit — zero legacy bloat, strict security headers, and automated test coverage.</p>' +
        '</div>' +
        '<button type="button" class="btn btn-primary" data-action="tk-proposal-open" data-tier="Turnkey White-Label License">Book Technical Walkthrough ' + icon('arrow', 15) + '</button>' +
      '</div>' +
      '<div class="tk-spec-grid">' +
        DELIVERABLES_SPEC.map(block =>
          '<article class="tk-spec-card">' +
            '<div class="tk-spec-head">' +
              '<span class="tk-spec-icon">' + icon(block.iconName, 18) + '</span>' +
              '<h3>' + esc(block.category) + '</h3>' +
            '</div>' +
            '<ul class="tk-spec-list">' +
              block.items.map(it => '<li>' + icon('check', 14) + '<span>' + esc(it) + '</span></li>').join('') +
            '</ul>' +
          '</article>'
        ).join('') +
      '</div>' +
    '</div>' +
  '</section>';
}

// ═══════════════════════════════════════════════════════════════════════════════
// TURN-05: Embedded Proposal Lead-Capture Modal & Admin Buyer/Partner Leads Panel
// ═══════════════════════════════════════════════════════════════════════════════

export const TURNKEY_LEADS_STORAGE_KEY = 'glamgo-turnkey-leads-v1';

export const DEFAULT_TURNKEY_LEADS = [
  {
    id: 'LEAD-SAMPLE01',
    createdAt: '2026-11-21 14:20',
    name: 'Aarav Singhania',
    email: 'aarav@aurabeauty.ae',
    phone: '+971 50 842 9910',
    company: 'Aura Luxury Salons Dubai',
    tier: 'Turnkey White-Label License',
    market: 'Dubai & Abu Dhabi, UAE',
    timeline: 'Immediate (Within 14 days)',
    notes: 'Evaluating white-label deployment in AED currency for 28 partner salons across Dubai.',
    previewBrand: 'AuraGlow',
    previewCurrency: 'AED',
    status: 'QUALIFIED',
    isSample: true
  },
  {
    id: 'LEAD-SAMPLE02',
    createdAt: '2026-11-21 18:05',
    name: 'Meghna Kulkarni',
    email: 'meghna@saffronsilk.in',
    phone: '+91 98450 77210',
    company: 'Saffron & Silk Flagship Studios',
    tier: 'List Salon / Brand on GlamGo',
    market: 'Indiranagar & Koramangala, Bengaluru',
    timeline: 'This Month (30 days)',
    notes: 'Looking to onboard 14 styling chairs and our clinical botanical retail shelf in Bengaluru.',
    previewBrand: 'GlamGo',
    previewCurrency: 'INR',
    status: 'NEW',
    isSample: true
  }
];

export function loadTurnkeyLeads() {
  try {
    const raw = localStorage.getItem(TURNKEY_LEADS_STORAGE_KEY);
    if (!raw) return [...DEFAULT_TURNKEY_LEADS];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : [...DEFAULT_TURNKEY_LEADS];
  } catch {
    return [...DEFAULT_TURNKEY_LEADS];
  }
}

export function saveTurnkeyLeads(leads) {
  const clean = Array.isArray(leads) ? leads : [...DEFAULT_TURNKEY_LEADS];
  try {
    localStorage.setItem(TURNKEY_LEADS_STORAGE_KEY, JSON.stringify(clean));
  } catch {}
  return clean;
}

export function renderProposalModalContent(draftState, wlCfg, roiState, { esc, icon, money }) {
  const d = draftState || {};
  const cleanWl = sanitizeWhiteLabelConfig(wlCfg);
  const plat = computePlatformRoi(roiState || DEFAULT_ROI_STATE);

  if (d.submittedLead) {
    const lead = d.submittedLead;
    const waText = `Hello GlamGo! I just submitted inquiry ${lead.id} (${lead.tier}) for ${lead.company || lead.name} in ${lead.market}. Brand preview: ${lead.previewBrand} (${lead.previewCurrency}).`;
    const waHref = 'https://wa.me/919876543210?text=' + encodeURIComponent(waText);

    return '<div class="tk-proposal-confirm">' +
      '<div class="modal-head">' +
        '<p class="eyebrow">INQUIRY LOGGED TO COMMAND CENTRE</p>' +
        '<h2>Proposal Request Received</h2>' +
        '<p>Reference <strong>' + esc(lead.id) + '</strong> has been recorded live inside <strong>Admin Command Centre &rarr; Buyer &amp; Partner Leads</strong>.</p>' +
      '</div>' +
      '<div class="tk-proposal-summary-card">' +
        '<div><span>Applicant / Organisation</span><strong>' + esc(lead.name) + (lead.company ? ' · ' + esc(lead.company) : '') + '</strong></div>' +
        '<div><span>Selected Package</span><strong>' + esc(lead.tier) + '</strong></div>' +
        '<div><span>Target Market &amp; Timeline</span><strong>' + esc(lead.market) + ' · ' + esc(lead.timeline) + '</strong></div>' +
        '<div><span>Active White-Label Preview</span><strong>' + esc(lead.previewBrand) + ' (' + esc(lead.previewCurrency) + ')</strong></div>' +
      '</div>' +
      '<div class="tk-proposal-confirm-actions">' +
        '<button type="button" class="btn btn-primary full" data-action="tk-open-admin-leads">' + icon('shield', 16) + ' View Lead in Admin Command ' + icon('arrow', 15) + '</button>' +
        '<a class="btn btn-outline full" href="' + waHref + '" target="_blank" rel="noopener noreferrer">' + icon('whatsapp', 16) + ' Also Send via WhatsApp</a>' +
      '</div>' +
    '</div>';
  }

  const selectedTier = d.tier || 'Turnkey White-Label License';
  const tiers = [
    'Turnkey White-Label License',
    'Enterprise Multi-City Rollout',
    'List Salon / Brand on GlamGo'
  ];

  return '<div class="modal-head">' +
    '<p class="eyebrow">ACQUISITION &amp; ONBOARDING DESK</p>' +
    '<h2>Request Proposal or Book Live Walkthrough</h2>' +
    '<p>Your inquiry is logged directly into the live <strong>Admin Command Centre</strong> so you can inspect the full lead-capture and CSV export workflow immediately.</p>' +
  '</div>' +
  '<div class="tk-proposal-preview-banner">' +
    '<span>' + icon('palette', 14) + ' Active Brand Preview: <strong>' + esc(cleanWl.brandName) + '</strong> (' + esc(cleanWl.currency) + ')</span>' +
    '<span>Modeled GMV: <strong>' + money(plat.monthlyGmv) + '/mo</strong></span>' +
  '</div>' +
  '<form id="tk-proposal-form" class="form-grid">' +
    '<label>Your full name<input name="name" required placeholder="e.g. Rohan Kapoor" value="' + esc(d.name || '') + '"></label>' +
    '<label>Work email<input name="email" type="email" required placeholder="rohan@company.com" value="' + esc(d.email || '') + '"></label>' +
    '<label>Phone / WhatsApp number<input name="phone" required placeholder="+91 98765 43210" value="' + esc(d.phone || '') + '"></label>' +
    '<label>Company / Salon / Brand name<input name="company" required placeholder="e.g. Maison Lumière Studios" value="' + esc(d.company || cleanWl.brandName) + '"></label>' +
    '<label>Package or inquiry tier' +
      '<select name="tier">' +
        tiers.map(t => '<option value="' + esc(t) + '" ' + (selectedTier === t ? 'selected' : '') + '>' + esc(t) + '</option>').join('') +
      '</select>' +
    '</label>' +
    '<label>Target city / region<input name="market" required placeholder="e.g. Bengaluru, Mumbai, Dubai" value="' + esc(d.market || 'Indiranagar, Bengaluru') + '"></label>' +
    '<label style="grid-column:1/-1">Target launch timeline' +
      '<select name="timeline">' +
        ['Immediate (Within 14 days)', 'This Month (30 days)', 'This Quarter (60–90 days)', 'Exploring / Technical Evaluation'].map(tl =>
          '<option value="' + esc(tl) + '">' + esc(tl) + '</option>'
        ).join('') +
      '</select>' +
    '</label>' +
    '<label style="grid-column:1/-1">Requirements, custom integrations, or number of salons/SKUs<textarea name="notes" rows="3" placeholder="Tell us about your target cities, salon count, skincare catalog, or custom payment gateway needs...">' + esc(d.notes || '') + '</textarea></label>' +
    '<button class="btn btn-primary full" type="submit" style="grid-column:1/-1">Submit Proposal Request ' + icon('arrow', 16) + '</button>' +
  '</form>';
}

export function renderAdminTurnkeyLeadsPanel(leads, { esc, icon }) {
  const list = Array.isArray(leads) && leads.length ? leads : DEFAULT_TURNKEY_LEADS;
  const newCount = list.filter(l => l.status === 'NEW').length;
  const qualifiedCount = list.filter(l => l.status === 'QUALIFIED' || l.status === 'DEMO_SCHEDULED').length;

  const statusBadgeClass = (st) => {
    const s = String(st || 'NEW').toUpperCase();
    if (s === 'QUALIFIED') return 'badge-approved';
    if (s === 'DEMO_SCHEDULED' || s === 'CONTACTED') return 'badge-info';
    return 'badge-pending';
  };

  return '<div class="admin-panel">' +
    '<div class="admin-panel-head">' +
      '<div>' +
        '<h3>Buyer &amp; Partner Acquisition Leads</h3>' +
        '<p class="admin-panel-sub">Inbound white-label platform buyer proposals and salon/brand onboarding inquiries captured from the showcase.</p>' +
      '</div>' +
      '<div class="admin-head-actions">' +
        '<span class="admin-metric-pill">' + list.length + ' Total · ' + newCount + ' New · ' + qualifiedCount + ' Qualified</span>' +
        '<button type="button" class="btn btn-outline btn-sm" data-action="tk-proposal-open" data-tier="Turnkey White-Label License">+ Test New Inquiry</button>' +
        '<button type="button" class="btn btn-primary btn-sm" data-action="tk-export-leads-csv">Export Leads CSV ' + icon('arrow', 14) + '</button>' +
      '</div>' +
    '</div>' +
    '<div class="admin-table-wrap">' +
      '<table class="admin-table tk-leads-table">' +
        '<thead>' +
          '<tr>' +
            '<th>Lead ID &amp; Date</th>' +
            '<th>Contact &amp; Organisation</th>' +
            '<th>Tier &amp; Target Market</th>' +
            '<th>Brand Preview</th>' +
            '<th>Notes</th>' +
            '<th>Status</th>' +
            '<th>Actions</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>' +
          list.map(l =>
            '<tr>' +
              '<td><strong>' + esc(l.id) + '</strong><br><small class="admin-muted">' + esc(l.createdAt || 'Recent') + '</small></td>' +
              '<td><strong>' + esc(l.name) + '</strong><br><small>' + esc(l.company || '—') + '</small><br><small class="admin-muted">' + esc(l.email) + ' · ' + esc(l.phone) + '</small></td>' +
              '<td><strong>' + esc(l.tier) + '</strong><br><small>' + esc(l.market) + ' · ' + esc(l.timeline || '') + '</small></td>' +
              '<td><span class="badge badge-info">' + esc(l.previewBrand || 'GlamGo') + ' · ' + esc(l.previewCurrency || 'INR') + '</span></td>' +
              '<td><small>' + esc(l.notes || '—') + '</small></td>' +
              '<td><span class="badge ' + statusBadgeClass(l.status) + '">' + esc(l.status || 'NEW') + '</span></td>' +
              '<td>' +
                '<div class="admin-actions">' +
                  '<button type="button" class="btn btn-outline btn-sm" data-action="tk-lead-status" data-id="' + esc(l.id) + '" data-status="CONTACTED">Contacted</button>' +
                  '<button type="button" class="btn btn-outline btn-sm" data-action="tk-lead-status" data-id="' + esc(l.id) + '" data-status="DEMO_SCHEDULED">Schedule Demo</button>' +
                  '<button type="button" class="btn btn-success btn-sm" data-action="tk-lead-status" data-id="' + esc(l.id) + '" data-status="QUALIFIED">Qualified</button>' +
                '</div>' +
              '</td>' +
            '</tr>'
          ).join('') +
        '</tbody>' +
      '</table>' +
    '</div>' +
  '</div>';
}
