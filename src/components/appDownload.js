const BANNER_STORAGE_KEY = 'glamgo_app_banner_dismissed';

export function isAppBannerDismissed() {
  try {
    return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(BANNER_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function dismissAppBanner() {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(BANNER_STORAGE_KEY, 'true');
    }
  } catch {
    // Ignore storage restriction errors in private contexts
  }
}

export function renderAppDownloadBanner(dismissed) {
  if (dismissed || isAppBannerDismissed()) return '';
  return (
    '<div class="app-download-banner" role="region" aria-label="Download the GlamGo App">' +
      '<div class="app-banner-inner">' +
        '<div class="app-banner-copy">' +
          '<img class="app-banner-icon-img" src="./favicon.svg" alt="" width="28" height="28" aria-hidden="true">' +
          '<span class="app-banner-text">Download the GlamGo App for exclusive deals &amp; faster booking</span>' +
        '</div>' +
        '<div class="app-banner-actions">' +
          '<button type="button" class="app-banner-cta" data-action="app-download-open">Get App</button>' +
          '<button type="button" class="app-banner-close" data-action="app-download-dismiss" aria-label="Dismiss app download banner">×</button>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

export function renderAppDownloadModal({ open, phone, statusMsg, errorMsg, esc }) {
  if (!open) return '';
  return (
    '<div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="app-download-title">' +
      '<div class="modal app-download-modal">' +
        '<button type="button" class="modal-close" data-action="app-download-close" aria-label="Close app download modal">×</button>' +
        '<p class="eyebrow">GLAMGO MOBILE APP</p>' +
        '<h2 id="app-download-title">Beauty &amp; grooming, faster in your pocket.</h2>' +
        '<p class="app-modal-sub">Track specialists live, unlock app-only combo deals, and rebook in one tap.</p>' +
        '<div class="app-modal-grid">' +
          '<div class="app-modal-main">' +
            '<div class="app-store-row">' +
              '<a class="app-store-btn" href="#app-play" data-action="app-store-click" data-id="Google Play">' +
                '<small>GET IT ON</small><strong>Google Play</strong>' +
              '</a>' +
              '<a class="app-store-btn" href="#app-ios" data-action="app-store-click" data-id="Apple App Store">' +
                '<small>Download on the</small><strong>App Store</strong>' +
              '</a>' +
            '</div>' +
            '<form id="app-download-share-form" class="app-share-form" novalidate>' +
              '<label class="app-share-label" for="app-share-phone">Share App Link via SMS</label>' +
              '<div class="app-share-input-wrap">' +
                '<span class="app-share-prefix">+91</span>' +
                '<input id="app-share-phone" name="phone" type="tel" inputmode="numeric" maxlength="10" placeholder="Enter 10-digit mobile number" value="' + esc(phone || '') + '" autocomplete="tel-national">' +
                '<button type="submit" class="btn btn-primary btn-sm">Send Link</button>' +
              '</div>' +
              (errorMsg ? '<p class="app-share-feedback is-error" role="alert">' + esc(errorMsg) + '</p>' : '') +
              (statusMsg ? '<p class="app-share-feedback is-ok" role="status">' + esc(statusMsg) + '</p>' : '') +
            '</form>' +
          '</div>' +
          '<div class="app-qr-card" aria-label="Desktop QR code preview">' +
            '<div class="app-qr-svg" aria-hidden="true">' +
              '<svg viewBox="0 0 100 100" width="96" height="96">' +
                '<rect width="100" height="100" fill="#fff"/>' +
                '<rect x="6" y="6" width="28" height="28" fill="none" stroke="#1E1C1A" stroke-width="5"/>' +
                '<rect x="14" y="14" width="12" height="12" fill="#1E1C1A"/>' +
                '<rect x="66" y="6" width="28" height="28" fill="none" stroke="#1E1C1A" stroke-width="5"/>' +
                '<rect x="74" y="14" width="12" height="12" fill="#1E1C1A"/>' +
                '<rect x="6" y="66" width="28" height="28" fill="none" stroke="#1E1C1A" stroke-width="5"/>' +
                '<rect x="14" y="74" width="12" height="12" fill="#1E1C1A"/>' +
                '<rect x="42" y="10" width="8" height="8" fill="#1E1C1A"/>' +
                '<rect x="54" y="18" width="6" height="14" fill="#1E1C1A"/>' +
                '<rect x="42" y="42" width="16" height="16" fill="#C5A059"/>' +
                '<rect x="10" y="44" width="14" height="8" fill="#1E1C1A"/>' +
                '<rect x="28" y="48" width="8" height="12" fill="#1E1C1A"/>' +
                '<rect x="66" y="44" width="10" height="10" fill="#1E1C1A"/>' +
                '<rect x="82" y="46" width="12" height="14" fill="#1E1C1A"/>' +
                '<rect x="46" y="68" width="12" height="8" fill="#1E1C1A"/>' +
                '<rect x="64" y="66" width="14" height="14" fill="#1E1C1A"/>' +
                '<rect x="84" y="76" width="10" height="18" fill="#1E1C1A"/>' +
                '<rect x="48" y="84" width="12" height="10" fill="#1E1C1A"/>' +
              '</svg>' +
            '</div>' +
            '<span>Scan with phone camera</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}
