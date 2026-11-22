// GlamGo Consumer Trust, Legal Policy Drawers & Referral / Gift Card Rewards Module
// Pure SVG icon() helpers and editorial warm-ivory/obsidian/champagne components.

export const POLICY_DOCS = {
  hygiene: {
    key: 'hygiene',
    eyebrow: 'HOSPITAL-GRADE PROTOCOL',
    title: 'GlamGo Hygiene & Safety Guarantee',
    intro: 'Every doorstep specialist and verified salon studio adheres to our 4-pillar clinical sanitation standard.',
    sections: [
      {
        icon: 'shield',
        heading: 'Sealed Single-Use Disposables',
        body: 'Wooden spatulas, sheet masks, waxing strips, cotton pads, and buffer blocks are unsealed in front of you and discarded immediately after your ritual.'
      },
      {
        icon: 'spark',
        heading: 'UV-C & Autoclave Metal Sterilization',
        body: 'Cuticle nippers, extraction tools, and shears undergo medical-grade ultrasonic cleaning followed by UV-C pouch sterilization prior to every visit.'
      },
      {
        icon: 'check',
        heading: '4-Digit Doorstep Arrival PIN & SOS Desk',
        body: 'Every confirmed booking generates a confidential 4-digit Arrival PIN in My bookings. Your specialist must verify this PIN at your doorstep before starting.'
      }
    ]
  },
  cancellation: {
    key: 'cancellation',
    eyebrow: 'FLEXIBLE SCHEDULING',
    title: 'Cancellation, Reschedule & Refund Policy',
    intro: 'Transparent booking flexibility and return-aligned multi-vendor protection.',
    sections: [
      {
        icon: 'calendar',
        heading: 'Complimentary 1-Tap Rescheduling',
        body: 'Reschedule any confirmed home or salon appointment in 1 tap from My bookings to any open slot at zero fee.'
      },
      {
        icon: 'clock',
        heading: 'Appointment Cancellations & Gateway Refunds',
        body: 'Cancellations made more than 2 hours before your slot receive a 100% automatic refund to your original UPI/Card payment method.'
      },
      {
        icon: 'bag',
        heading: '7-Day Beauty Store Return Protection',
        body: 'Unopened or transit-damaged skincare and cosmetics qualify for a 7-day return request directly from My orders, backed by T+7 seller escrow holds.'
      }
    ]
  },
  privacy: {
    key: 'privacy',
    eyebrow: 'DATA SOVEREIGNTY & PRIVACY',
    title: 'Privacy & Personal Data Protection Policy',
    intro: 'How GlamGo safeguards your addresses, GPS pins, and payment credentials.',
    sections: [
      {
        icon: 'pin',
        heading: 'Purpose-Bound Location & Address Usage',
        body: 'Your neighbourhood pin and saved delivery addresses are used strictly to compute salon distances, filter city-available specialists, and dispatch orders.'
      },
      {
        icon: 'shield',
        heading: 'Zero Plaintext Credential Storage',
        body: 'Passwords are salted and hashed with bcrypt; one-time passcodes use HMAC-SHA256 digests with automatic 5-attempt lockout protection.'
      },
      {
        icon: 'user',
        heading: 'Doorstep PIN Confidentiality',
        body: 'Your 4-digit Arrival PIN is visible only inside your authenticated customer account and is never exposed in partner listing APIs.'
      }
    ]
  },
  terms: {
    key: 'terms',
    eyebrow: 'PLATFORM TERMS',
    title: 'Terms of Service & Marketplace Charter',
    intro: 'Governing doorstep treatments, partner salon reservations, and multi-vendor retail orders.',
    sections: [
      {
        icon: 'check',
        heading: 'Upfront Fixed Pricing & Server Verification',
        body: 'All service tariffs, optional treatment add-ons, coupons, and wallet credits are verified server-side in integer paise with zero hidden travel fees.'
      },
      {
        icon: 'salon',
        heading: 'Verified Partner Curation',
        body: 'Independent specialists, salons, and beauty brands undergo administrative credential moderation before their studio or catalog listings go live.'
      },
      {
        icon: 'star',
        heading: 'Wallet Credits & Referral Rewards',
        body: 'GlamGo Wallet Credits earned via gift cards or friend referrals apply automatically toward eligible Beauty Store checkouts and do not expire.'
      }
    ]
  }
};

export const GIFT_CARDS_CATALOG = [
  { code: 'GLAM500', title: 'The Signature Gift Card', amount: 500, desc: 'Instant ₹500 credit for skincare & daily essentials' },
  { code: 'LUXE1000', title: 'The Atelier Ritual Card', amount: 1000, desc: '₹1,000 luxury credit for serums, hair oils & tools' },
  { code: 'BRIDAL2500', title: 'The Bridal Suite Card', amount: 2500, desc: '₹2,500 premier credit for complete beauty routines' }
];

export function renderPolicyModalContent(policyKey, { esc, icon }) {
  const key = POLICY_DOCS[policyKey] ? policyKey : 'hygiene';
  const doc = POLICY_DOCS[key];
  const tabs = [
    ['hygiene', 'Hygiene Guarantee'],
    ['cancellation', 'Cancellation & Refund'],
    ['privacy', 'Privacy Policy'],
    ['terms', 'Terms of Service']
  ];

  return '<div class="modal-head">' +
      '<p class="eyebrow">' + esc(doc.eyebrow) + '</p>' +
      '<h2>' + esc(doc.title) + '</h2>' +
      '<p>' + esc(doc.intro) + '</p>' +
    '</div>' +
    '<div class="policy-nav-pills" role="tablist" aria-label="Legal and trust policies">' +
      tabs.map(([k, label]) =>
        '<button type="button" role="tab" aria-selected="' + (k === key ? 'true' : 'false') + '" class="search-scope-pill ' + (k === key ? 'active' : '') + '" data-action="policy-open" data-id="' + esc(k) + '">' + esc(label) + '</button>'
      ).join('') +
    '</div>' +
    '<div class="policy-drawer-body">' +
      doc.sections.map(sec =>
        '<article class="policy-section-card">' +
          '<h4>' + icon(sec.icon || 'shield', 17) + '<span>' + esc(sec.heading) + '</span></h4>' +
          '<p>' + esc(sec.body) + '</p>' +
        '</article>'
      ).join('') +
    '</div>';
}

export function renderRewardsWalletPanel(state, { esc, icon, money }) {
  const balance = Number(state.walletCredits || 0);
  const referralCode = state.referralCode || 'GLAM-INVITE';

  return '<div class="rewards-wallet-grid">' +
      '<div class="rewards-balance-card">' +
        '<div>' +
          '<p class="eyebrow" style="color:var(--champagne)">GLAMGO WALLET BALANCE</p>' +
          '<div class="balance-val">' + money(balance) + '</div>' +
        '</div>' +
        '<p style="margin:0;font-size:12.5px;color:rgba(255,255,255,.78)">Available for instant 1-tap deduction at Beauty Store checkout.</p>' +
      '</div>' +
      '<div class="policy-section-card" style="display:flex;flex-direction:column;justify-content:space-between;gap:10px">' +
        '<div>' +
          '<p class="eyebrow">REFER A FRIEND · GIVE ₹300, GET ₹300</p>' +
          '<h4 style="margin-top:4px">' + icon('spark', 16) + '<span>Your Personal Invite Code</span></h4>' +
          '<p>Share your code with friends. When they redeem it, both of you receive ₹300 in GlamGo Wallet Credits.</p>' +
        '</div>' +
        '<div class="referral-code-box">' +
          '<code>' + esc(referralCode) + '</code>' +
          '<button type="button" class="btn btn-outline btn-sm" data-action="referral-copy" data-id="' + esc(referralCode) + '">' + icon('check', 14) + ' Copy Code</button>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="policy-section-card" style="margin-top:16px">' +
      '<h4>' + icon('star', 17) + '<span>Redeem a Gift Card or Friend Referral Code</span></h4>' +
      '<p style="margin-bottom:12px">Enter a referral code or select an official GlamGo Gift Card below to credit your wallet immediately.</p>' +
      '<form id="reward-redeem-form" class="coupon-form" style="margin-bottom:14px">' +
        '<input id="reward-code-input" name="code" required placeholder="Enter code (e.g. GLAM500 or friend code)" style="text-transform:uppercase" autocomplete="off">' +
        '<button type="submit" class="btn btn-primary">Redeem Credit ' + icon('arrow', 15) + '</button>' +
      '</form>' +
      '<div class="search-chips-wrap">' +
        '<span class="search-chips-label">COMPLIMENTARY SHOWCASE GIFT CARDS (1-TAP FILL)</span>' +
        '<div class="search-chips" style="margin-top:6px">' +
          GIFT_CARDS_CATALOG.map(g =>
            '<button type="button" class="search-chip" data-action="gift-card-fill" data-id="' + esc(g.code) + '">' +
              icon('sparkle', 13) + ' <strong>' + esc(g.code) + '</strong> (' + money(g.amount) + ')' +
            '</button>'
          ).join('') +
        '</div>' +
      '</div>' +
    '</div>';
}
