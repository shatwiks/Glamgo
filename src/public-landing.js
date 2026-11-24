// Public partner-first introduction rendered with the existing marketplace actions.
export function publicLanding({ signedIn, experience, menu, icon }) {
  const arrow = icon('arrow', 17);
  const experienceNames = {
    home: 'At-home services',
    salon: 'Salons & parlours',
    shop: 'Beauty shopping'
  };

  const navLinks = [
    '<button type="button" data-action="public-scroll" data-target="public-partners">Partner Roles</button>',
    '<button type="button" data-action="public-scroll" data-target="public-how">How It Works</button>',
    '<button type="button" data-action="public-scroll" data-target="public-experiences">For Customers</button>'
  ].join('');

  const partnerRoles = [
    {
      role: 'Salon Owner',
      label: 'Salons & parlours',
      title: 'Salon & parlour owners',
      desc: 'Present your salon space, service menu, and team so local customers can book visits.',
      cta: 'Register your salon',
      image: './assets/salon-editorial.webp',
      alt: 'Contemporary salon interior with styling chairs and mirrors'
    },
    {
      role: 'Professional',
      label: 'At-home services',
      title: 'Independent professionals',
      desc: 'Share your profile, set available days, and accept at-home beauty appointments.',
      cta: 'Apply as a professional',
      image: './assets/home-editorial.webp',
      alt: 'Independent beauty professional providing an at-home facial treatment'
    },
    {
      role: 'Product Seller',
      label: 'Sellers & brands',
      title: 'Beauty sellers & brands',
      desc: 'List skincare, haircare, and makeup products for customers shopping on GlamGo.',
      cta: 'Apply as a seller',
      image: './assets/shop-editorial.webp',
      alt: 'Curated beauty and personal care products arranged in natural light'
    }
  ].map(item => (
    '<article class="public-card">' +
      '<div class="public-card-media"><img src="' + item.image + '" alt="' + item.alt + '" loading="lazy"></div>' +
      '<div class="public-card-body">' +
        '<p class="public-eyebrow">' + item.label + '</p>' +
        '<h3>' + item.title + '</h3>' +
        '<p>' + item.desc + '</p>' +
        '<button type="button" class="public-text-link" data-action="public-partner" data-id="' + item.role + '">' + item.cta + ' ' + arrow + '</button>' +
      '</div>' +
    '</article>'
  )).join('');

  const steps = [
    ['01', 'Create an account', 'Sign in or register and choose the partner role that fits your business.'],
    ['02', 'Submit your application', 'Share your business details, city, and services or product focus.'],
    ['03', 'Manage your presence', 'Once approved, update offerings, pricing, and availability in your partner workspace.']
  ].map(([num, title, desc]) => (
    '<div class="public-step">' +
      '<span class="public-step-num" aria-hidden="true">' + num + '</span>' +
      '<div><h3>' + title + '</h3><p>' + desc + '</p></div>' +
    '</div>'
  )).join('');

  const customerExperiences = [
    {
      id: 'home',
      label: 'At-home services',
      title: 'Beauty at your doorstep',
      desc: 'Book independent beauty professionals for skin, hair, and spa care at home.',
      cta: 'Explore at-home services',
      image: './assets/home-editorial.webp',
      alt: 'Beauty professional delivering facial care at home'
    },
    {
      id: 'salon',
      label: 'Salons & parlours',
      title: 'Salons near you',
      desc: 'Browse independent salons and parlours, compare menus, and reserve your visit.',
      cta: 'Explore salons & parlours',
      image: './assets/salon-editorial.webp',
      alt: 'Independent salon interior ready for appointments'
    },
    {
      id: 'shop',
      label: 'Beauty shopping',
      title: 'Beauty from sellers & brands',
      desc: 'Shop skincare, haircare, and makeup offered by independent sellers and brands.',
      cta: 'Explore beauty shopping',
      image: './assets/shop-editorial.webp',
      alt: 'Skincare and beauty products displayed on stone'
    }
  ].map(item => (
    '<article class="public-card">' +
      '<div class="public-card-media"><img src="' + item.image + '" alt="' + item.alt + '" loading="lazy"></div>' +
      '<div class="public-card-body">' +
        '<p class="public-eyebrow">' + item.label + '</p>' +
        '<h3>' + item.title + '</h3>' +
        '<p>' + item.desc + '</p>' +
        '<button type="button" class="public-text-link" data-action="experience" data-id="' + item.id + '">' + item.cta + ' ' + arrow + '</button>' +
      '</div>' +
    '</article>'
  )).join('');

  const returnLink = experience
    ? '<button type="button" class="public-return" data-action="experience" data-id="' + experience + '">Return to ' + (experienceNames[experience] || 'your last experience') + ' ' + arrow + '</button>'
    : '';

  return (
    '<div class="public-page" id="top">' +
      '<a class="public-skip" href="#public-main">Skip to content</a>' +
      '<header class="public-header">' +
        '<a class="wordmark public-logo" href="/" data-action="public-home" aria-label="GlamGo home"><img src="./assets/glamgo-logo.png" alt="GLAMGO" class="brand-logo-img"></a>' +
        '<nav class="public-nav" aria-label="Main navigation">' + navLinks + '</nav>' +
        '<div class="public-header-actions">' +
          '<button type="button" class="public-signin" data-action="account">' + (signedIn ? 'My Account' : 'Sign In') + ' ' + arrow + '</button>' +
          '<button type="button" class="public-menu-toggle" data-action="public-menu" aria-label="' + (menu ? 'Close navigation' : 'Open navigation') + '" aria-expanded="' + Boolean(menu) + '">' + icon(menu ? 'close' : 'menu', 22) + '</button>' +
        '</div>' +
        (menu
          ? '<nav class="public-mobile-nav" aria-label="Mobile navigation">' +
              navLinks +
              '<button type="button" data-action="account">' + (signedIn ? 'My Account' : 'Sign In / Create Account') + ' ' + arrow + '</button>' +
            '</nav>'
          : '') +
      '</header>' +
      '<main id="public-main">' +
        '<section class="public-hero" aria-labelledby="public-hero-title">' +
          '<div class="public-hero-copy">' +
            '<p class="public-eyebrow public-kicker"><span></span>Independent beauty marketplace</p>' +
            '<h1 id="public-hero-title">Connect your beauty<br><em>business with customers.</em></h1>' +
            '<p class="public-hero-description">GlamGo connects independent beauty professionals, salon owners, and beauty sellers with customers across at-home services, salon visits, and beauty shopping.</p>' +
            '<div class="public-hero-actions">' +
              '<button type="button" class="public-button public-button-dark" data-action="public-scroll" data-target="public-partners">Apply as a Partner ' + arrow + '</button>' +
              returnLink +
            '</div>' +
          '</div>' +
          '<div class="public-hero-art">' +
            '<div class="public-art-main"><img src="./assets/salon-editorial.webp" alt="Independent salon interior with warm lighting and styling chairs"></div>' +
            '<div class="public-art-small"><img src="./assets/home-editorial.webp" alt="Beauty professional offering at-home skincare care"></div>' +
            '<div class="public-art-small"><img src="./assets/shop-editorial.webp" alt="Beauty products from independent sellers and brands"></div>' +
          '</div>' +
        '</section>' +
        '<section class="public-section public-partners" id="public-partners" aria-labelledby="partners-heading">' +
          '<div class="public-section-head">' +
            '<div>' +
              '<p class="public-eyebrow">Partner with GlamGo</p>' +
              '<h2 id="partners-heading">Three ways independent businesses <em>join.</em></h2>' +
            '</div>' +
            '<p>Select your business type to register and manage your own profile, offerings, pricing, and schedule.</p>' +
          '</div>' +
          '<div class="public-card-grid">' + partnerRoles + '</div>' +
        '</section>' +
        '<section class="public-how" id="public-how" aria-labelledby="how-heading">' +
          '<div class="public-how-inner">' +
            '<div class="public-how-intro">' +
              '<p class="public-eyebrow">How joining works</p>' +
              '<h2 id="how-heading">Three steps to <em>go live.</em></h2>' +
              '<p>GlamGo gives independent partners a dedicated workspace without operating your salon or employing your staff.</p>' +
            '</div>' +
            '<div class="public-steps">' + steps + '</div>' +
          '</div>' +
        '</section>' +
        '<section class="public-section public-experiences" id="public-experiences" aria-labelledby="experiences-heading">' +
          '<div class="public-section-head">' +
            '<div>' +
              '<p class="public-eyebrow">For customers</p>' +
              '<h2 id="experiences-heading">Explore three <em>beauty experiences.</em></h2>' +
            '</div>' +
            '<p>Discover independent professionals, salons, and beauty sellers together with one account.</p>' +
          '</div>' +
          '<div class="public-card-grid">' + customerExperiences + '</div>' +
        '</section>' +
      '</main>' +
      '<footer class="public-footer">' +
        '<div class="public-footer-grid">' +
          '<div class="public-footer-brand">' +
            '<a class="wordmark" href="/" data-action="public-home"><img src="./assets/glamgo-logo-light.png" alt="GLAMGO" class="brand-logo-img"></a>' +
            '<p>Connecting independent beauty professionals, salons, and sellers with customers.</p>' +
          '</div>' +
          '<div class="public-footer-col">' +
            '<h3>Customers</h3>' +
            '<button type="button" data-action="experience" data-id="home">At-home services</button>' +
            '<button type="button" data-action="experience" data-id="salon">Salons &amp; parlours</button>' +
            '<button type="button" data-action="experience" data-id="shop">Beauty shopping</button>' +
          '</div>' +
          '<div class="public-footer-col">' +
            '<h3>Partners &amp; Account</h3>' +
            '<button type="button" data-action="public-partner" data-id="Salon Owner">Salon &amp; parlour owners</button>' +
            '<button type="button" data-action="public-partner" data-id="Professional">Independent professionals</button>' +
            '<button type="button" data-action="public-partner" data-id="Product Seller">Beauty sellers &amp; brands</button>' +
            '<button type="button" data-action="account">' + (signedIn ? 'My Account' : 'Sign In / Create Account') + '</button>' +
            '<button type="button" data-action="support">Customer support</button>' +
          '</div>' +
        '</div>' +
        '<div class="public-footer-bottom">' +
          '<span>&copy; ' + new Date().getFullYear() + ' GlamGo. All rights reserved.</span>' +
        '</div>' +
      '</footer>' +
    '</div>'
  );
}
