import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  tokenStorage,
  apiLogin,
  apiRegister,
  apiGetMe,
  apiGetServices,
  apiGetProfessionals,
  apiGetSalons,
  apiGetProducts,
  apiUpdateProfile,
  apiGetAddresses,
  apiAddAddress,
  apiDeleteAddress,
  apiGetNotifications,
  apiCreateBooking,
  apiGetMyBookings,
  apiUpdateBookingStatus,
  apiValidateCoupon,
  apiCreateOrder,
  apiGetMyOrders,
  apiGetPartnerOverview,
  apiGetPartnerDrafts,
  apiCreatePartnerDraft,
  apiApplyForPartner,
  apiGetProfessionalProfile,
  apiUpdateProfessionalProfile,
  apiGetProfessionalServices,
  apiAssignProfessionalService,
  apiUnlinkProfessionalService,
  apiGetProfessionalBookings,
  apiUpdateProfessionalBookingStatus,
  apiGetSalonProfile,
  apiUpdateSalonProfile,
  apiGetSalonStaff,
  apiAddSalonStaff,
  apiDeleteSalonStaff,
  apiGetSalonBookings,
  apiUpdateSalonBookingStatus,
  apiGetSellerProducts,
  apiCreateSellerProduct,
  apiUpdateSellerProduct,
  apiUpdateSellerStock,
  apiAddSellerVariant,
  apiGetSellerOrders,
  apiUpdateSellerOrderStatus,
  apiGetPartnerFinancials,
  apiGetAvailability,
  apiToggleAvailability,
  apiGetAdminStats,
  apiGetAdminUsers,
  apiToggleUserStatus,
  apiUpdateUserRole,
  apiGetAdminDrafts,
  apiApprovePartnerDraft,
  apiRejectPartnerDraft,
  apiGetAuditLogs,
  apiGetAdminBookings,
  apiGetAdminOrders,
  apiCreatePaymentOrder,
  apiVerifyPayment,
  apiCreateReview,
  apiGetReviews,
  apiGetMyReviews,
  apiGetProductOffers,
  apiReserveInventory,
  apiMultiVendorCheckout,
  apiGetSellerListings,
  apiCreateSellerListing,
  apiUpdateSellerListing,
  apiGetSellerSuborders,
  apiGetSellerSuborderDetail,
  apiPackSellerSuborder,
  apiShipSellerSuborder,
  apiDeliverSellerSuborder,
  apiSubmitReturnRequest,
  apiGetSellerReturns,
  apiDecideSellerReturn,
  apiGetSellerMultiVendorFinancials
} from './api.js';

const HOME_IMG = './assets/home-editorial.webp';
const SALON_IMG = './assets/salon-editorial.webp';
const SHOP_IMG = './assets/shop-editorial.webp';
const photo = (id, w = 900) => 'https://images.unsplash.com/' + id + '?auto=format&fit=crop&w=' + w + '&q=85';

const icons = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
  pin: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  arrow: '<path d="M4 12h16m-7-7 7 7-7 7"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  bag: '<path d="M4 8h16l-1 13H5L4 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  close: '<path d="M5 5 19 19M19 5 5 19"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3L7 14.2l-5-4.9 6.9-1L12 2Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  plus: '<path d="M12 4v16M4 12h16"/>',
  minus: '<path d="M4 12h16"/>',
  filter: '<path d="M4 7h16M7 12h10M10 17h4"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="1"/><path d="M7 3v4M17 3v4M3 10h18"/>',
  shield: '<path d="M12 2 4 5v6c0 6 4 9 8 11 4-2 8-5 8-11V5l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
  spark: '<path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2ZM19 17l.5 1.5L21 19l-1.5.5L19 21l-.5-1.5L17 19l1.5-.5L19 17Z"/>',
  home: '<path d="m3 10 9-7 9 7v11H3V10Z"/><path d="M9 21v-7h6v7"/>',
  salon: '<path d="M4 21V7l8-4 8 4v14H4Z"/><path d="M4 10h16M9 21v-6h6v6"/>',
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
  truck: '<path d="M2 6h12v11H2V6ZM14 10h4l3 3v4h-7v-7Z"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
  logout: '<path d="M10 3H4v18h6M14 7l5 5-5 5M8 12h11"/>'
};

const icon = (name, size = 20, extra = '') => '<svg class="icon ' + (name === 'arrow' ? 'm-arrow ' : '') + extra + '" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (icons[name] || '') + '</svg>';
const brandMark = '<span class="gg-mark" data-mark="dots" aria-hidden="true"><i></i><i></i><i></i></span>';
const money = n => '₹' + Number(n).toLocaleString('en-IN');
const esc = str => String(str ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const images = {
  facial: photo('photo-1570172619644-dfd03ed5d881'),
  hair: photo('photo-1562322140-8baeececf3df'),
  nails: photo('photo-1604654894610-df63bc536371'),
  makeup: photo('photo-1522335789203-aabd1fc54bc9'),
  spa: photo('photo-1540555700478-4be289fbecef'),
  salon2: photo('photo-1560066984-138dadb4c035'),
  salon3: photo('photo-1521590832167-7bcbfaa6381f'),
  serum: './assets/serum.webp',
  cream: './assets/moisturiser.webp',
  lipstick: './assets/lipstick.webp',
  haircare: './assets/hair-oil.webp',
  fragrance: './assets/fragrance.webp',
  tools: './assets/brushes.webp'
};

const experiences = [
  {id:'home', eyebrow:'AT-HOME SERVICES', title:'Salon care at home', desc:'Verified beauticians arrive at your door with sterile kits for facials, waxing, hair, and nails.', cta:'Book home services', img:HOME_IMG, icon:'home'},
  {id:'salon', eyebrow:'SALONS & PARLOURS', title:'Appointments nearby', desc:'Check local salon menus, ratings, and available time slots before you visit.', cta:'Browse salons', img:SALON_IMG, icon:'salon'},
  {id:'shop', eyebrow:'BEAUTY STORE', title:'Skincare & daily formulas', desc:'Shop botanical serums, hair oils, SPF, and makeup directly from verified sellers.', cta:'Shop beauty store', img:SHOP_IMG, icon:'bag'}
];

const CATALOG_CACHE_KEY = 'glamgo-catalog-cache-v1';
const CATALOG_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
function readCatalogCache() {
  try {
    const raw = localStorage.getItem(CATALOG_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed.ts && Date.now() - Number(parsed.ts) > CATALOG_CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}
function writeCatalogCache() {
  try {
    localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify({
      ts: Date.now(),
      services,
      professionals,
      salons,
      products
    }));
  } catch {}
}
const initialCatalogCache = readCatalogCache();
let services = Array.isArray(initialCatalogCache?.services) ? initialCatalogCache.services : [];
let professionals = Array.isArray(initialCatalogCache?.professionals) ? initialCatalogCache.professionals : [];
let salons = Array.isArray(initialCatalogCache?.salons) ? initialCatalogCache.salons : [];
let products = Array.isArray(initialCatalogCache?.products) ? initialCatalogCache.products : [];

const homeCategories = ['All','Hair','Skin','Waxing','Threading','Nails','Makeup','Spa','Packages'];
const homeCategoryImages = {
  Hair: images.hair,
  Skin: images.facial,
  Waxing: photo('photo-1519823551278-64ac92734fb1'),
  Threading: photo('photo-1516975080664-ed2fc6a32937'),
  Nails: images.nails,
  Makeup: images.makeup,
  Spa: images.spa,
  Packages: HOME_IMG
};
const shopCategories = ['All','Skincare','Makeup','Haircare','Body Care','Fragrance','Beauty Tools'];
const shopCategoryLabel = c => (c === 'Beauty Tools' ? 'Tools' : c);
const salonCategories = ['All','Hair','Skin','Nails','Makeup','Spa'];
const roles = ['Professional','Salon Owner','Product Seller'];
const roleSections = {
  Professional:['Overview','Registration','Identity verification','Profile management','Services & pricing','Availability calendar','Booking requests','Upcoming appointments','Booking history','Earnings','Customer reviews'],
  'Salon Owner':['Overview','Registration','Salon profile','Branches','Service catalogue','Staff management','Appointments','Availability','Revenue analytics','Customer reviews'],
  'Product Seller':['Overview','Registration','Marketplace listings','Products','Inventory & stock','Orders & fulfillment','Returns & refunds','Escrow & settlement']
};

const defaults = {
  signedIn: false,
  experience: null,
  user: {name:'Aanya Mehta', email:'aanya@example.com', phone:'98765 43210', role:'customer'},
  location:'Bandra West, Mumbai',
  addresses:[{label:'Home',text:'24 Sea View Road, Bandra West, Mumbai 400050'}],
  wishlist:[],
  cart:{},
  bookings:[],
  orders:[],
  reviews:[],
  notifications:[],
  coupon:'',
  cartVariants:{},
  partnerProfiles:{},
  partnerDrafts:[],
  showcasePartnerRole:'Salon Owner',
  availability:['Mon','Tue','Wed','Thu','Fri'],
  partnerOverview: null,
  partnerProProfile: null,
  partnerProServices: [],
  partnerProBookings: [],
  partnerSalonProfile: null,
  partnerSalonStaff: [],
  partnerSalonBookings: [],
  partnerSellerProducts: [],
  partnerSellerOrders: [],
  partnerSellerListings: [],
  partnerSellerSuborders: [],
  partnerSellerReturns: [],
  partnerSellerMVFinancials: null,
  productOffers: {},
  partnerFinancials: null,
  adminStats: null,
  adminUsers: [],
  adminDrafts: [],
  adminAuditLogs: [],
  adminBookings: [],
  adminOrders: [],
  adminTab: 'overview',
  adminDraftFilter: 'ALL',
  adminDraftSearch: '',
  adminUserFilter: 'ALL',
  adminUserSearch: '',
  adminBookingFilter: 'ALL',
  adminBookingSearch: '',
  adminOrderFilter: 'ALL',
  adminOrderSearch: '',
  adminCatalogSearch: '',
  adminAuditSearch: '',
  adminLastSynced: '',
  partnerBookingFilter: 'ALL',
  partnerBookingSearch: '',
  partnerOrderFilter: 'ALL',
  partnerOrderSearch: '',
  partnerCatalogSearch: '',
  partnerLastSynced: ''
};

let saved = {};
try { saved = JSON.parse(localStorage.getItem('glamgo-state') || '{}'); } catch {}

const state = {
  ...defaults,
  ...saved,
  signedIn: Boolean(tokenStorage.get() && saved.signedIn),
  view: saved.experience ? 'landing' : 'onboarding',
  modal: null,
  menu: false,
  mobileMenu: false,
  searchOpen: false,
  query: '',
  homeCategory: 'All',
  salonCategory: 'All',
  salonDate: null,
  shopCategory: 'All',
  shopCollection: 'All',
  shopBrand: 'All',
  sort: 'featured',
  activeNav: null,
  addedCartIds: {},
  addingCartId: null,
  selectedSalon: null,
  selectedProduct: null,
  productVariant: null,
  pdpTab: 'details',
  productReviews: {},
  accountTab: 'Overview',
  partnerRole: 'Professional',
  partnerTab: 'Overview',
  booking: null,
  checkoutPayment: 'UPI',
  authMode: 'signin',
  adminStats: null,
  adminUsers: [],
  adminDrafts: [],
  adminAuditLogs: [],
  adminBookings: [],
  adminOrders: [],
  adminTab: 'overview',
  adminDraftFilter: 'ALL',
  adminDraftSearch: '',
  adminUserFilter: 'ALL',
  adminUserSearch: '',
  adminBookingFilter: 'ALL',
  adminBookingSearch: '',
  adminOrderFilter: 'ALL',
  adminOrderSearch: '',
  adminCatalogSearch: '',
  adminAuditSearch: '',
  adminLastSynced: '',
  partnerBookingFilter: 'ALL',
  partnerBookingSearch: '',
  partnerOrderFilter: 'ALL',
  partnerOrderSearch: '',
  partnerCatalogSearch: '',
  partnerLastSynced: '',
  selectedDraftId: null,
  reviews: [],
  catalogFeedsLoading: {
    services: !services.length,
    professionals: !professionals.length,
    salons: !salons.length,
    products: !products.length
  },
  catalogLoading: !(services.length && professionals.length && salons.length && products.length),
  catalogErrors: { services: false, professionals: false, salons: false, products: false },
  checkoutBusy: false,
  selectedCheckoutAddressIdx: 0,
  pendingReservation: null,
  pendingCheckoutOrder: null,
  pendingCheckoutKey: null,
  pendingPaymentKey: null,
  couponDiscount: 0,
  paymentNotice: null,
  bookingBusy: false,
  pendingBooking: null,
  pendingBookingKey: null,
  bookingNotice: null,
  activeChapter: 0
};

const app = document.getElementById('app');
const persist = () => localStorage.setItem('glamgo-state', JSON.stringify(Object.fromEntries(Object.keys(defaults).map(k => [k,state[k]]))));
const toast = message => {
  const root = document.getElementById('toast-root');
  root.innerHTML = '';
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = icon('check',16) + esc(message);
  root.append(el);
  setTimeout(() => el.remove(), 3300);
};

const getDiscountPct = p => (p && Number(p.old) > Number(p.price) && Number(p.price) > 0) ? Math.round(((Number(p.old) - Number(p.price)) / Number(p.old)) * 100) : 0;
const getProductStock = (p, variant) => {
  if (!p) return 0;
  const vs = p.variant_stocks && typeof p.variant_stocks === 'object' ? p.variant_stocks : null;
  if (variant && vs && Object.prototype.hasOwnProperty.call(vs, variant)) return Number(vs[variant]);
  if (p.stock !== undefined && p.stock !== null) return Number(p.stock);
  return 100;
};
const getStockInfo = (p, variant) => {
  const qty = getProductStock(p, variant);
  if (qty <= 0) return { qty: 0, soldOut: true, low: false, label: 'Sold out' };
  if (qty <= 5) return { qty, soldOut: false, low: true, label: 'Low stock · ' + qty + ' left' };
  return { qty, soldOut: false, low: false, label: 'In stock' };
};
const getVariantHeading = (p, variants) => {
  if (!variants || !variants.length) return 'OPTION';
  const joined = variants.join(' ');
  if (/\d+\s?(ml|g|mg|oz|l)\b/i.test(joined)) return variants.length > 1 ? 'SELECT SIZE' : 'PACK SIZE';
  if (p && p.category === 'Makeup') return variants.length > 1 ? 'SELECT SHADE' : 'SHADE';
  return variants.length > 1 ? 'SELECT OPTION' : 'OPTION';
};
const shopCollections = [
  { id: 'All', label: 'All products' },
  { id: 'BESTSELLER', label: 'Best sellers' },
  { id: 'NEW', label: 'New arrivals' },
  { id: 'TRENDING', label: 'Trending' },
  { id: 'OFFERS', label: 'Offers' }
];
const matchesShopCollection = (p, col) => {
  if (!col || col === 'All') return true;
  if (col === 'OFFERS') return Number(p && p.old) > Number(p && p.price);
  const norm = String((p && p.tag) || '').toUpperCase().replace(/[\s_-]+/g, '');
  if (!norm) return false;
  if (col === 'BESTSELLER') return norm.includes('BEST');
  if (col === 'NEW') return norm.startsWith('NEW');
  if (col === 'TRENDING') return norm.includes('TREND');
  return norm === col.toUpperCase();
};
const getFilteredShopProducts = (items = products) => {
  const filtered = (items || []).filter(p => {
    if (state.shopCategory !== 'All' && p.category !== state.shopCategory) return false;
    if (state.shopBrand !== 'All' && p.brand !== state.shopBrand) return false;
    if (!matchesShopCollection(p, state.shopCollection)) return false;
    return true;
  });
  const sorted = [...filtered];
  if (state.sort === 'price' || state.sort === 'price-asc') sorted.sort((a, b) => Number(a.price) - Number(b.price));
  else if (state.sort === 'price-desc') sorted.sort((a, b) => Number(b.price) - Number(a.price));
  else if (state.sort === 'rating') sorted.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
  else if (state.sort === 'reviews') sorted.sort((a, b) => Number(b.reviews || 0) - Number(a.reviews || 0));
  return sorted;
};
const getRelatedProducts = (p, limit = 3) => {
  if (!p) return [];
  const others = products.filter(item => item.id !== p.id);
  const sameCategory = others.filter(item => item.category === p.category);
  const rest = others.filter(item => item.category !== p.category).sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
  return [...sameCategory, ...rest].slice(0, limit);
};
const parseIngredientsList = raw => String(raw || '').split(/[,;•\n]+/).map(s => s.trim()).filter(Boolean);
const ensureProductExtras = id => {
  if (!id) return;
  if (!state.productOffers) state.productOffers = {};
  if (!Object.prototype.hasOwnProperty.call(state.productOffers, id)) {
    state.productOffers[id] = { offers: [] };
    apiGetProductOffers(id).then(res => {
      state.productOffers[id] = res || { offers: [] };
      if (state.view === 'product-detail' && state.selectedProduct === id) render();
    }).catch(e => console.warn('[ProductOffers]', e));
  }
  if (!state.productReviews) state.productReviews = {};
  if (!Object.prototype.hasOwnProperty.call(state.productReviews, id)) {
    state.productReviews[id] = { loading: true, items: [] };
    apiGetReviews(id, 'product').then(res => {
      state.productReviews[id] = { loading: false, items: Array.isArray(res) ? res : (res?.reviews || []) };
      if (state.view === 'product-detail' && state.selectedProduct === id) render();
    }).catch(() => {
      state.productReviews[id] = { loading: false, items: [] };
      if (state.view === 'product-detail' && state.selectedProduct === id) render();
    });
  }
};
const getActiveSubnavKey = () => {
  if (state.view === 'landing') {
    if (state.experience === 'shop') {
      if (state.shopCollection === 'BESTSELLER') return 'bestsellers';
      if (state.shopCollection === 'NEW') return 'new-arrivals';
    }
    return state.activeNav || 'landing';
  }
  if (state.view === 'account' && state.experience === 'salon' && state.accountTab === 'My bookings') return 'account-bookings';
  return '';
};
const syncSubnavActive = () => {
  const activeKey = getActiveSubnavKey();
  document.querySelectorAll('.subnav-links button[data-nav-key]').forEach(btn => {
    const isActive = Boolean(activeKey && btn.dataset.navKey === activeKey);
    btn.classList.toggle('active', isActive);
    if (isActive) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  });
};
let pendingAuthResume = null;
const PROTECTED_VIEWS = new Set(['checkout', 'account', 'order-success', 'booking-success', 'tracking', 'partner', 'admin']);
const PUBLIC_EXPERIENCE_ROUTES = {
  '#shop': 'shop',
  '/shop': 'shop',
  '#home': 'home',
  '/home': 'home',
  '#services': 'home',
  '/services': 'home',
  '#salons': 'salon',
  '/salons': 'salon'
};
const routeHashForExperience = id => '#' + (id === 'salon' ? 'salons' : id);
let pendingOnboardingScroll = null;
function applyRouteFromLocation() {
  const hash = window.location.hash;
  const path = window.location.pathname;
  const exp = PUBLIC_EXPERIENCE_ROUTES[hash] || PUBLIC_EXPERIENCE_ROUTES[path];
  if (exp) {
    state.experience = exp;
    state.view = 'landing';
    state.activeNav = 'landing';
    return true;
  }
  if (hash === '#partners' || path === '/partners') {
    state.view = 'onboarding';
    pendingOnboardingScroll = 'partner-showcase';
    return true;
  }
  if (hash === '#onboarding' || path === '/onboarding') {
    state.view = 'onboarding';
    pendingOnboardingScroll = null;
    return true;
  }
  const prodMatch = (hash || '').match(/^#product\/([^/?#]+)$/) || (path || '').match(/^\/product\/([^/?#]+)$/);
  if (prodMatch) {
    state.experience = 'shop';
    state.selectedProduct = decodeURIComponent(prodMatch[1]);
    state.productVariant = null;
    state.pdpTab = 'details';
    state.view = 'product-detail';
    ensureProductExtras(state.selectedProduct);
    return true;
  }
  return false;
}
function requireAuth(resume = null, message = 'Please sign in to continue.') {
  if (state.signedIn) return true;
  pendingAuthResume = resume;
  state.view = 'auth';
  state.modal = null;
  state.menu = false;
  state.mobileMenu = false;
  render();
  window.scrollTo({ top: 0, behavior: 'instant' });
  if (message) toast(message);
  return false;
}
const setExperience = id => { state.experience = id; state.view = 'landing'; state.activeNav = 'landing'; state.modal = null; state.menu = false; state.mobileMenu = false; state.searchOpen = false; persist(); if (window.location.protocol !== 'file:') window.history.replaceState(null, '', '/' + routeHashForExperience(id)); render(); window.scrollTo({top:0,behavior:'instant'}); };
const navigate = view => { state.view = view; if (view === 'landing' && !state.activeNav) state.activeNav = 'landing'; state.modal = null; state.menu = false; state.mobileMenu = false; render(); window.scrollTo({top:0,behavior:'instant'}); };
const image = (src, alt, cls='') => '<img class="'+cls+'" src="'+src+'" alt="'+esc(alt)+'" decoding="sync" onerror="this.style.opacity=0.15">';
const button = (label, action, cls='btn-primary', attrs='') => '<button class="btn '+cls+'" data-action="'+action+'" '+attrs+'>'+label+'</button>';
const sectionHead = (_eyebrow,title,sub='',action='') => '<div class="section-head"><div><h2>'+title+'</h2>'+(sub?'<p class="section-sub">'+sub+'</p>':'')+'</div>'+action+'</div>';
const rating = (value,count) => '<span class="rating">'+icon('star',14)+' '+value+' <span>('+count+')</span></span>';
const empty = (symbol,title,text,action='') => '<div class="empty-state"><div class="empty-symbol">'+icon(symbol,28)+'</div><h3>'+title+'</h3><p>'+text+'</p>'+action+'</div>';
const catalogLoadingState = label => '<div class="catalog-loading-panel"><p>Curating live '+esc(label)+'...</p></div>';
const catalogUnavailableState = (title, message = 'Live inventory could not be loaded right now. Please try again in a moment.') => '<div class="catalog-unavailable">'+empty('bag', title + ' unavailable', message, button('Retry loading '+icon('arrow',16), 'retry-catalog', 'btn-primary'))+'</div>';
const canSafelyBackgroundRender = () => {
  if (state.modal) return false;
  const active = document.activeElement;
  if (active && app.contains(active) && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) return false;
  return true;
};
const syncOverallCatalogLoading = () => {
  const f = state.catalogFeedsLoading;
  state.catalogLoading = Boolean(f.services || f.professionals || f.salons || f.products);
};
async function loadCatalogFeeds() {
  state.catalogFeedsLoading = {
    services: true,
    professionals: true,
    salons: true,
    products: true
  };
  state.catalogLoading = true;
  let deferredRender = false;
  const refreshUI = () => {
    syncOverallCatalogLoading();
    if (canSafelyBackgroundRender()) render();
    else deferredRender = true;
  };
  const fetchFeed = (key, fetcher, applyValue, resetEmpty) =>
    Promise.resolve()
      .then(fetcher)
      .then(data => {
        if (Array.isArray(data)) {
          applyValue(data);
          state.catalogErrors[key] = false;
          writeCatalogCache();
        } else {
          resetEmpty();
          state.catalogErrors[key] = true;
        }
      })
      .catch(() => {
        resetEmpty();
        state.catalogErrors[key] = true;
      })
      .finally(() => {
        state.catalogFeedsLoading[key] = false;
        refreshUI();
      });

  await Promise.allSettled([
    fetchFeed('services', apiGetServices, v => { services = v; }, () => { if (!services.length) services = []; }),
    fetchFeed('professionals', apiGetProfessionals, v => { professionals = v; }, () => { if (!professionals.length) professionals = []; }),
    fetchFeed('salons', apiGetSalons, v => { salons = v; }, () => { if (!salons.length) salons = []; }),
    fetchFeed('products', apiGetProducts, v => { products = v; }, () => { if (!products.length) products = []; })
  ]);
  state.catalogLoading = false;
  if (deferredRender && canSafelyBackgroundRender()) render();
}

let razorpayLoadPromise = null;
function ensureRazorpayLoaded(timeoutMs = 8000) {
  if (typeof window.Razorpay === 'function') return Promise.resolve(true);
  if (razorpayLoadPromise) return razorpayLoadPromise;
  razorpayLoadPromise = new Promise(resolve => {
    const finish = ok => {
      if (!ok) razorpayLoadPromise = null;
      resolve(ok);
    };
    const existing = Array.from(document.scripts || []).find(s => (s.src || '').includes('checkout.razorpay.com/v1/checkout.js'));
    if (existing && existing.dataset?.error !== '1' && existing.dataset?.loaded !== '1') {
      const timer = setTimeout(() => finish(typeof window.Razorpay === 'function'), timeoutMs);
      existing.addEventListener('load', () => { clearTimeout(timer); finish(typeof window.Razorpay === 'function'); }, { once: true });
      existing.addEventListener('error', () => { clearTimeout(timer); finish(false); }, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    const timer = setTimeout(() => finish(typeof window.Razorpay === 'function'), timeoutMs);
    script.onload = () => {
      script.dataset.loaded = '1';
      clearTimeout(timer);
      finish(typeof window.Razorpay === 'function');
    };
    script.onerror = () => {
      script.dataset.error = '1';
      clearTimeout(timer);
      finish(false);
    };
    document.head.appendChild(script);
  });
  return razorpayLoadPromise;
}
const makeCartKey = (productId, variant = '', listingId = null) =>
  `${productId}::${String(variant || '').trim()}::${listingId || ''}`;
const parseCartKey = key => {
  const raw = String(key || '');
  if (!raw.includes('::')) {
    const p = products.find(x => x.id === raw);
    const v = state.cartVariants?.[raw] || (p?.variants?.[0] || '');
    const lid = (v && p?.variant_listings?.[v]) || p?.default_listing_id || null;
    return { productId: raw, variant: v, listingId: lid ? Number(lid) : null };
  }
  const [productId, variant, lidStr] = raw.split('::');
  return {
    productId,
    variant: variant || '',
    listingId: lidStr ? Number(lidStr) : null
  };
};
const resolveCartListingMeta = (p, variant = '', explicitListingId = null) => {
  const offers = state.productOffers?.[p?.id]?.offers || [];
  const chosenListingId =
    explicitListingId ||
    (variant && p?.variant_listings?.[variant]) ||
    p?.default_listing_id ||
    null;
  const offer = offers.find(o => Number(o.id) === Number(chosenListingId));
  const unitPrice = offer ? Number(offer.price) : Number(p?.price || 0);
  const sellerName = offer?.seller_name || '';
  return { listingId: chosenListingId ? Number(chosenListingId) : null, unitPrice, sellerName };
};
const getCartEntries = () =>
  Object.entries(state.cart || {})
    .filter(([, qty]) => Number(qty) > 0)
    .map(([key, qty]) => {
      const parsed = parseCartKey(key);
      const product = products.find(p => p.id === parsed.productId);
      if (!product) return null;
      const variant = parsed.variant || (product.variants?.[0] || '');
      const meta = resolveCartListingMeta(product, variant, parsed.listingId);
      return {
        key,
        product,
        productId: parsed.productId,
        variant,
        listingId: meta.listingId,
        sellerName: meta.sellerName,
        qty: Number(qty),
        unitPrice: meta.unitPrice,
        lineTotal: meta.unitPrice * Number(qty)
      };
    })
    .filter(Boolean);
const getCartItemsFingerprint = entries =>
  JSON.stringify((entries || []).map(e => ({ k: e.key, q: e.qty })).sort((a, b) => a.k.localeCompare(b.k)));
const invalidateCheckoutState = (resetReservation = true) => {
  if (resetReservation) state.pendingReservation = null;
  state.pendingCheckoutOrder = null;
  state.pendingCheckoutKey = null;
  state.pendingPaymentKey = null;
  state.paymentNotice = null;
};
async function ensureCheckoutReservation(force = false) {
  const entries = getCartEntries();
  if (!entries.length) return null;
  const fp = getCartItemsFingerprint(entries);
  const existing = state.pendingReservation;
  if (!force && existing && existing.fingerprint === fp) {
    if (existing.loading) return null;
    if (existing.data) {
      const expMs = new Date(existing.data.expires_at).getTime();
      if (!Number.isNaN(expMs) && expMs - Date.now() > 15000) {
        return existing.data;
      }
    }
  }
  state.pendingReservation = { fingerprint: fp, loading: true, error: null, data: null };
  render();
  try {
    const resItems = entries.map(e => ({
      listing_id: e.listingId || null,
      product_id: e.productId,
      variant_name: e.variant || '',
      qty: e.qty
    }));
    const data = await apiReserveInventory(resItems);
    state.pendingReservation = { fingerprint: fp, loading: false, error: null, data };
    render();
    return data;
  } catch (err) {
    state.pendingReservation = {
      fingerprint: fp,
      loading: false,
      error: err.message || 'Unable to verify live seller inventory right now.',
      data: null
    };
    render();
    return null;
  }
}
const countCart = () => Object.values(state.cart || {}).reduce((a, b) => a + Number(b || 0), 0);
const cartTotal = () => getCartEntries().reduce((sum, e) => sum + e.lineTotal, 0);
const dateOptions = () => Array.from({length:6},(_,i)=>{const d=new Date();d.setDate(d.getDate()+i+1);return {value:d.toISOString().slice(0,10),day:d.toLocaleDateString('en-IN',{weekday:'short'}),date:d.getDate(),month:d.toLocaleDateString('en-IN',{month:'short'})};});
const formatDate = value => new Date(value+'T12:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});

const heroChapters = [
  {num:'01', title:'Pick a treatment and fixed price', desc:'Browse facials, waxing, nails, hair, and full 150-minute home sessions with upfront pricing.', img:images.facial, alt:'A beautician preparing a hydrating facial mask'},
  {num:'02', title:'Choose a verified specialist', desc:'Inspect years of experience, verified ratings, and past customer reviews before booking.', img:images.hair, alt:'Hair stylist finishing waves in natural light'},
  {num:'03', title:'Lock date, slot, and address', desc:'Reserve an appointment window 7 days a week for your saved home or office address.', img:images.nails, alt:'Manicure preparation with neutral polish tones'},
  {num:'04', title:'Clean kits arrive at your door', desc:'Single-use applicators, fresh linens, and treatment formulas come directly with your artist.', img:images.makeup, alt:'Brush set and cosmetic palette arranged for an appointment'}
];
let heroAnimKey = null;
function heroEnterAttr(key) {
  if (heroAnimKey === key) return '';
  heroAnimKey = key;
  return ' data-enter="1"';
}
const getCatalogMinPrice = (items, fallback) => {
  const prices = (items || []).map(x => Number(x && x.price)).filter(n => Number.isFinite(n) && n > 0);
  return prices.length ? Math.min(...prices) : fallback;
};

const showcaseRolesData = {
  'Salon Owner': {
    title: 'Salon Owner Studio',
    summary: 'Publish live service menus, assign chair stylists, manage branches, and confirm studio appointments from one calendar.',
    modules: ['Salon profile & hours', 'Branches & locations', 'Service catalogue', 'Staff management', 'Appointments calendar', 'Revenue analytics']
  },
  'Product Seller': {
    title: 'Product Seller Studio',
    summary: 'List multi-variant SKUs on canonical stock ledgers, fulfill split suborders, handle customer returns, and track T+7 payouts.',
    modules: ['Marketplace listings', 'Product & variant SKUs', 'Inventory & stock ledger', 'Orders & fulfillment', 'Returns & restocking', 'Escrow & settlement (T+7)']
  },
  'Professional': {
    title: 'Independent Specialist Studio',
    summary: 'Set home-visit treatment availability across 7 weekly days, confirm bookings, and track completed session earnings.',
    modules: ['Identity verification', 'Profile management', 'Services & pricing', 'Weekly availability', 'Booking requests', 'Recorded earnings']
  }
};

function onboarding(){
  const minPrice = getCatalogMinPrice(services, 299);
  const serviceCount = services.length || 8;
  const salonCount = salons.length || 3;
  const productCount = products.length || 7;
  const sampleSalon = salons[0] || { name: 'The Ivory Room Studio', area: state.location, hours: '09:00–21:00', rating: '4.9', reviews: 312, services: ['Hair','Skin','Nails'] };
  const sampleProd = products[0] || { name: 'The Daily Renewal Serum', brand: 'LUMIÈRE', price: 1890, variants: ['50 ml', '30 ml'], variant_stocks: { '50 ml': 18, '30 ml': 12 } };
  const activeRole = state.showcasePartnerRole || 'Salon Owner';
  const roleInfo = showcaseRolesData[activeRole] || showcaseRolesData['Salon Owner'];
  const variantsList = Array.isArray(sampleProd.variants) && sampleProd.variants.length ? sampleProd.variants.slice(0, 2) : ['50 ml', '30 ml'];

  return '<div class="onboarding-page">' +
    '<section class="onboarding-first" aria-labelledby="onboard-hero-h">' +
      '<a class="skip-link" href="#top-choices">Skip to marketplace</a>' +
      '<header class="onboard-top gg-wrap">' +
        '<a class="wordmark" href="#" data-action="onboarding">'+brandMark+'<span>GLAMGO</span></a>' +
        '<nav class="onboard-nav" aria-label="Audience navigation">' +
          '<button type="button" data-action="experience" data-id="home">At-home care</button>' +
          '<button type="button" data-action="experience" data-id="salon">Salons</button>' +
          '<button type="button" data-action="experience" data-id="shop">Beauty store</button>' +
          '<button type="button" data-action="scroll-onboard" data-target="partner-showcase">Salon owners</button>' +
          '<button type="button" data-action="scroll-onboard" data-target="partners-seller">Product sellers</button>' +
        '</nav>' +
        '<div class="onboard-top-right">' +
          '<span class="onboard-fact">'+esc(state.location)+' · From '+money(minPrice)+'</span>' +
          '<button class="btn btn-outline btn-sm portal-btn" data-action="partners">Partner Studio</button>' +
          button((state.signedIn?'My account ':'Sign in ')+icon('user',17),'account','btn-text') +
        '</div>' +
      '</header>' +
      '<main id="top-choices" class="onboard-main gg-wrap"'+heroEnterAttr('onboarding')+'>' +
        '<div class="onboard-intro">' +
          '<h1 id="onboard-hero-h" class="enter-line">Beauty bookings, skincare orders, and partner studios</h1>' +
          '<p class="onboard-lead">'+serviceCount+' home treatments starting at '+money(minPrice)+', '+salonCount+' partner salons in '+esc(state.location)+', '+productCount+' multi-variant products, plus calendars and T+7 escrow tools for businesses.</p>' +
        '</div>' +
        '<div class="experience-grid">' +
          experiences.map(x=>'<button class="experience-card" data-action="experience" data-id="'+x.id+'"><div class="experience-photo">'+image(x.img,x.title)+'</div><div class="experience-content"><h2>'+x.title+'</h2><p>'+x.desc+'</p><span class="experience-link">'+x.cta+' '+icon('arrow',17)+'</span></div></button>').join('') +
        '</div>' +
      '</main>' +
      '<div class="onboard-bottom gg-wrap">' +
        '<span>Running a salon, studio chair, or skincare brand? Compare workflows for owners, sellers, and stylists.</span>' +
        '<div class="onboard-bottom-actions">' +
          '<button type="button" class="onboard-partner-jump" data-action="scroll-onboard" data-target="partner-showcase">For Salon Owners & Product Sellers '+icon('arrow',16)+'</button>' +
        '</div>' +
      '</div>' +
    '</section>' +
    '<section class="partner-band cream-band" id="partner-showcase" aria-labelledby="partner-salon-h">' +
      '<div class="gg-wrap split-pair">' +
        '<div class="partner-copy">' +
          '<h2 id="partner-salon-h">Fill salon chairs and manage every branch from one calendar</h2>' +
          '<p class="partner-lead">Publish treatment menus with upfront pricing, assign stylists by specialty, set weekly opening hours, and track studio bookings in real time.</p>' +
          '<ul class="partner-list">' +
            '<li>'+icon('check',17)+'<span><strong>Branches & staff roster:</strong> Link stylists across Hair, Skin, Nails, Makeup, and Spa so guests pick their expert.</span></li>' +
            '<li>'+icon('check',17)+'<span><strong>30-minute slot control:</strong> Toggle open weekly working days and confirm or complete client bookings without double-booking.</span></li>' +
            '<li>'+icon('check',17)+'<span><strong>Verified directory presence:</strong> Surface studio reviews, starting rates, and distance to shoppers in '+esc(state.location)+'.</span></li>' +
          '</ul>' +
          '<div class="partner-actions">' +
            '<button class="btn btn-primary" data-action="partners-apply" data-role="Salon Owner">Open Salon Owner Studio '+icon('arrow',17)+'</button>' +
            '<button class="btn btn-outline" data-action="experience" data-id="salon">Browse partner salons</button>' +
          '</div>' +
        '</div>' +
        '<div class="studio-preview">' +
          '<div class="studio-preview-photo">'+image(SALON_IMG,'Sunlight streaming through mirrors and styling chairs in a partner salon')+'</div>' +
          '<div class="studio-card">' +
            '<div class="studio-card-head"><div><strong>'+esc(sampleSalon.name)+'</strong><span>'+esc(sampleSalon.area)+' · Open daily '+esc(sampleSalon.hours)+'</span></div><span class="studio-pill">'+esc(sampleSalon.rating)+' ★ ('+esc(sampleSalon.reviews)+')</span></div>' +
            '<div class="studio-rows">' +
              '<div class="studio-row"><span>Disciplines active</span><b>'+esc((sampleSalon.services||[]).join(' · '))+'</b></div>' +
              '<div class="studio-row"><span>Booking actions</span><b>Confirm · Complete · Cancel</b></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</section>' +
    '<section class="partner-band dark-band" id="partners-seller" aria-labelledby="partner-seller-h">' +
      '<div class="gg-wrap split-pair">' +
        '<div class="ledger-panel">' +
          '<div class="ledger-head"><strong>'+esc(sampleProd.name)+'</strong><span>Canonical Inventory &amp; T+7 Escrow</span></div>' +
          variantsList.map(v => {
            const qty = sampleProd.variant_stocks?.[v] ?? 15;
            return '<div class="ledger-row"><div><strong>'+esc(sampleProd.brand)+' · '+esc(v)+'</strong><small>Locked per seller offer at checkout</small></div><span class="ledger-val">'+qty+' units</span><span class="ledger-tag">'+(qty>0?'IN STOCK':'SOLD OUT')+'</span></div>';
          }).join('') +
          '<div class="ledger-row"><div><strong>Suborder fulfillment</strong><small>Independent per-seller shipping package</small></div><span class="ledger-val">Pack → Ship</span><span class="ledger-tag">VERIFIED</span></div>' +
          '<div class="ledger-row"><div><strong>Post-delivery escrow settlement</strong><small>Blocks maturity if a return request stays open</small></div><span class="ledger-val">T+7 days</span><span class="ledger-tag">SETTLED</span></div>' +
        '</div>' +
        '<div class="partner-copy">' +
          '<h2 id="partner-seller-h">List product variants once and ship directly to buyers</h2>' +
          '<p class="partner-lead">Attach stock and pricing to master catalog products by size or shade, fulfill multi-vendor suborders per package, and track return-aligned payouts.</p>' +
          '<ul class="partner-list">' +
            '<li>'+icon('check',17)+'<span><strong>Zero overselling at checkout:</strong> Atomic row locks hold selected variant stock for active buyers before payment capture.</span></li>' +
            '<li>'+icon('check',17)+'<span><strong>Independent pack &amp; ship pipeline:</strong> Fulfill only your brand packages with explicit paid/COD verification gates.</span></li>' +
            '<li>'+icon('check',17)+'<span><strong>Safe returns &amp; T+7 settlement ledger:</strong> Approve or reject requests with idempotent gateway refunds and restock guards.</span></li>' +
          '</ul>' +
          '<div class="partner-actions">' +
            '<button class="btn btn-invert" data-action="partners-apply" data-role="Product Seller">Open Product Seller Studio '+icon('arrow',17)+'</button>' +
            '<button class="btn btn-dark-ghost" data-action="experience" data-id="shop">Visit beauty store</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</section>' +
    '<section class="partner-band ivory-band" id="partners-pro" aria-labelledby="partner-pro-h">' +
      '<div class="gg-wrap split-pair">' +
        '<div class="partner-copy">' +
          '<h2 id="partner-pro-h">Take at-home visits and preview every partner workspace</h2>' +
          '<p class="partner-lead">Independent stylists, aestheticians, and makeup artists link treatments from '+money(minPrice)+', manage 7-day schedules, and review completed session earnings.</p>' +
          '<ul class="partner-list">' +
            '<li>'+icon('check',17)+'<span><strong>Verified practitioner profile:</strong> Surface years of experience, specialty, and verified client ratings before booking.</span></li>' +
            '<li>'+icon('check',17)+'<span><strong>Flexible weekly hours:</strong> Switch working days on or off with instant slot generation between 09:00 and 19:00.</span></li>' +
          '</ul>' +
          '<div class="partner-actions">' +
            '<button class="btn btn-primary" data-action="partners-apply" data-role="Professional">Join as Specialist '+icon('arrow',17)+'</button>' +
          '</div>' +
        '</div>' +
        '<div class="role-explorer" id="partner-role-explorer">' +
          '<div class="role-tabs" role="tablist" aria-label="Partner role workflows">' +
            ['Salon Owner','Product Seller','Professional'].map(r => '<button type="button" role="tab" aria-selected="'+(r===activeRole?'true':'false')+'" class="role-tab-btn'+(r===activeRole?' active':'')+'" data-action="showcase-partner-tab" data-role="'+r+'">'+r+'</button>').join('') +
          '</div>' +
          '<h3>'+esc(roleInfo.title)+'</h3>' +
          '<p>'+esc(roleInfo.summary)+'</p>' +
          '<div class="role-modules">' +
            roleInfo.modules.map(m => '<div class="role-module"><span>'+esc(m)+'</span>'+icon('check',15)+'</div>').join('') +
          '</div>' +
          '<button class="btn btn-outline full" data-action="partners-apply" data-role="'+esc(activeRole)+'">Launch '+esc(activeRole)+' Studio '+icon('arrow',16)+'</button>' +
        '</div>' +
      '</div>' +
    '</section>' +
    '<footer class="footer closing">' +
      '<div class="closing-cta gg-wrap">' +
        '<div><h2>Start as a shopper or open your studio today</h2><p>Move directly between home treatments, nearby salons, the skincare store, and studio operations.</p></div>' +
        '<div class="partner-actions">' +
          '<button class="btn btn-invert btn-xl" data-action="experience" data-id="home">Explore services '+icon('arrow',18)+'</button>' +
          '<button class="btn btn-dark-ghost btn-xl" data-action="partners-apply" data-role="Salon Owner">Apply as Partner '+icon('arrow',18)+'</button>' +
        '</div>' +
      '</div>' +
      '<div class="footer-grid gg-wrap">' +
        '<div><a class="wordmark light" href="#" data-action="onboarding">'+brandMark+'<span>GLAMGO</span></a><p>At-home beauty visits, local salons, skincare shopping, and partner software.</p><span class="footer-loc">'+esc(state.location)+' · Daily 8:00–21:00</span></div>' +
        '<div><h3>For Shoppers</h3>'+experiences.map(x=>'<button data-action="experience" data-id="'+x.id+'">'+x.title+'</button>').join('')+'</div>' +
        '<div><h3>For Partners</h3><button data-action="partners-apply" data-role="Salon Owner">Salon Owner Studio</button><button data-action="partners-apply" data-role="Product Seller">Product Seller Studio</button><button data-action="partners-apply" data-role="Professional">Specialist Studio</button></div>' +
        '<div><h3>Account</h3><button data-action="account">Sign in / My account</button><button data-action="partners">Open Partner Portal</button></div>' +
      '</div>' +
      '<div class="footer-bottom gg-wrap"><span>© '+new Date().getFullYear()+' GlamGo</span><details class="credits"><summary>Photographs via Unsplash</summary><p>Editorial treatment and salon imagery sourced under Unsplash License; product stills hosted locally.</p></details></div>' +
    '</footer>' +
  '</div>';
}

function auth(){
  const isPartnerAuth = pendingAuthResume?.view === 'partner';
  const rawRole = pendingAuthResume?.partnerRole || state.partnerRole || 'Partner';
  const partnerRoleLabel = rawRole === 'Professional' ? 'Specialist' : rawRole;
  const leftTitle = isPartnerAuth ? ('Open your '+partnerRoleLabel+' studio') : 'Beauty bookings and essentials';
  const leftSub = isPartnerAuth ? 'Manage salon schedules, multi-variant inventory, split suborders, and T+7 settlements.' : 'Sign in once for home visits, salon slots, and store orders.';
  const rightHeading = state.authMode==='signup'
    ? (isPartnerAuth ? 'Create your partner account' : 'Create your account')
    : (isPartnerAuth ? 'Sign in to Partner Studio' : 'Welcome back');
  const rightCopy = isPartnerAuth
    ? 'Sign in or create an account to access your '+partnerRoleLabel+' application and workspace.'
    : 'Access saved addresses, live order tracking, and upcoming appointments.';
  const leftImg = isPartnerAuth ? SALON_IMG : HOME_IMG;
  return '<div class="auth-layout"><div class="auth-image">'+image(leftImg,isPartnerAuth?'Partner salon studio interior':'At-home beauty treatment')+'<div class="auth-image-copy"><a class="wordmark light" href="#onboarding" data-action="guest-browse">'+brandMark+'<span>GLAMGO</span></a><h1>'+leftTitle+'</h1><p>'+leftSub+'</p></div></div><div class="auth-panel"><div class="auth-box"><h2>'+rightHeading+'</h2><p>'+rightCopy+'</p><form id="auth-form">'+(state.authMode==='signup'?'<label>Full name<input name="name" required placeholder="Your full name" autocomplete="name"></label><label>Phone number<input name="phone" placeholder="Contact number"></label>':'')+'<label>Email address<input name="email" type="email" required placeholder="you@example.com" autocomplete="email"></label><label>Password<input name="password" type="password" required minlength="6" placeholder="At least 6 characters" autocomplete="'+(state.authMode==='signup'?'new-password':'current-password')+'"></label><button class="btn btn-primary full" type="submit">'+(state.authMode==='signup'?'Create account':'Sign in')+' '+icon('arrow',17)+'</button></form><p class="auth-switch">'+(state.authMode==='signup'?'Already have an account?':'New to GlamGo?')+' <button data-action="auth-toggle">'+(state.authMode==='signup'?'Sign in':'Create an account')+'</button></p><p class="auth-switch" style="margin-top:10px"><button data-action="guest-browse">← Continue browsing</button></p></div></div></div>';
}

function header(){
  const current = experiences.find(x => x.id === state.experience) || experiences[0];
  const userInitials = state.user?.name ? state.user.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() : 'AM';
  const accountBtn = state.signedIn
    ? '<button class="avatar-button" aria-label="My account" data-action="account">'+userInitials+'</button>'
    : '<button class="avatar-button" aria-label="Sign in" title="Sign in" data-action="account">'+icon('user',15)+'</button>';
  const activeKey = getActiveSubnavKey();
  const navBtn = (act, label, key, extraAttrs='') => '<button data-action="'+act+'" data-nav-key="'+key+'" class="'+(activeKey===key?'active':'')+'"'+(activeKey===key?' aria-current="page"':'')+(extraAttrs?' '+extraAttrs:'')+'>'+label+'</button>';
  const isPartnerView = state.view === 'partner';
  const subTag = state.experience==='shop' ? 'Free shipping over '+money(1500) : 'Serving '+esc(state.location);
  const subnavLinksHtml = state.experience==='home'
    ? navBtn('landing','Home','landing')+navBtn('scroll','Categories','categories','data-target="categories"')+navBtn('scroll','Treatments','popular','data-target="popular"')+navBtn('scroll','Specialists','professionals','data-target="professionals"')+navBtn('scroll','How it works','how','data-target="how"')
    : state.experience==='salon'
      ? navBtn('landing','Salons','landing')+navBtn('scroll','Near you','salons','data-target="salons"')+navBtn('scroll','Categories','salon-categories','data-target="salon-categories"')+navBtn('account-bookings','Appointments','account-bookings')
      : navBtn('shop-all','Store','landing')+navBtn('scroll','Categories','shop-categories','data-target="shop-categories"')+navBtn('shop-collection','Best sellers','bestsellers','data-collection="BESTSELLER" data-target="bestsellers"')+navBtn('shop-collection','New arrivals','new-arrivals','data-collection="NEW" data-target="bestsellers"');
  const subnavHtml = isPartnerView
    ? ''
    : '<nav class="subnav" aria-label="Section navigation"><div class="subnav-inner gg-wrap"><div class="subnav-links">'+subnavLinksHtml+'</div><span class="subnav-tag">'+subTag+'</span></div></nav>';
  return '<div class="site-shell"><a class="skip-link" href="#top">Skip to content</a><header class="header"><div class="header-inner gg-wrap"><a class="wordmark" href="#" data-action="onboarding">'+brandMark+'<span>GLAMGO</span></a><div class="header-location"><button data-action="location">'+icon('pin',18)+'<span><small>LOCATION</small>'+esc(state.location)+'</span>'+icon('chevron',15)+'</button></div><button class="header-search" data-action="search-open">'+icon('search',18)+'<span>Search treatments, salons, or products</span><kbd>⌘K</kbd></button><div class="header-actions"><div class="switch-wrap"><button class="switch-button" data-action="switch-toggle"><span class="switch-icon">'+icon(current.icon,17)+'</span><span>Experience<small>'+current.eyebrow+'</small></span>'+icon('chevron',14)+'</button>'+(state.menu?'<div class="switch-menu"><p>SWITCH PORTAL</p>'+experiences.map(x=>'<button data-action="experience" data-id="'+x.id+'" class="'+(x.id===state.experience?'active':'')+'">'+icon(x.icon,18)+'<span>'+x.eyebrow+'<small>'+x.title+'</small></span>'+(x.id===state.experience?icon('check',16):'')+'</button>').join('')+'<button data-action="partners">'+icon('shield',18)+'<span>FOR BUSINESSES<small>Salon owners &amp; product sellers</small></span></button></div>':'')+'</div><button class="icon-button" aria-label="Wishlist" data-action="wishlist">'+icon('heart',20)+(state.wishlist.length?'<i></i>':'')+'</button><button class="icon-button" aria-label="Cart" data-action="cart">'+icon('bag',20)+(countCart()?'<b>'+countCart()+'</b>':'')+'</button><button class="icon-button notify-button" aria-label="Notifications" data-action="notifications">'+icon('bell',20)+(state.notifications.length?'<i></i>':'')+'</button>'+(state.user?.role==='admin'?'<button class="btn btn-outline btn-sm portal-btn admin-portal-btn" data-action="admin">Command Centre</button>':'')+'<button class="btn btn-outline btn-sm portal-btn" data-action="partners">Partner Portal</button>'+accountBtn+'</div><button class="mobile-menu-button" data-action="mobile-toggle" aria-expanded="'+(state.mobileMenu?'true':'false')+'" aria-label="Open menu">'+icon('menu',23)+'</button></div></header>'+subnavHtml+(state.mobileMenu?'<div class="mobile-menu"><div class="mobile-menu-head"><span>SWITCH PORTAL</span><button data-action="mobile-toggle" aria-label="Close menu">'+icon('close',20)+'</button></div>'+experiences.map(x=>'<button data-action="experience" data-id="'+x.id+'">'+icon(x.icon,20)+x.eyebrow+icon('arrow',16)+'</button>').join('')+'<button data-action="partners">'+icon('shield',20)+'Partner Portal'+icon('arrow',16)+'</button><button data-action="account">'+icon('user',20)+(state.signedIn?'My account':'Sign in')+icon('arrow',16)+'</button><button data-action="location">'+icon('pin',20)+esc(state.location)+icon('arrow',16)+'</button>'+(state.user?.role==='admin'?'<button data-action="admin">Admin Command Centre'+icon('arrow',16)+'</button>':'')+'</div>':'')+'</div>';
}

function footer(){
  const closeCfg = state.experience === 'salon'
    ? { heading: 'Book your next salon appointment', sub: 'Compare treatments and pick an open slot near '+esc(state.location)+'.', cta: 'Browse salons', act: 'scroll', target: 'salons' }
    : state.experience === 'shop'
    ? { heading: 'Restock daily skincare formulas', sub: 'Orders over '+money(1500)+' qualify for complimentary shipping across India.', cta: 'Shop beauty store', act: 'scroll', target: 'bestsellers' }
    : { heading: 'Book a verified home specialist', sub: 'Facials, waxing, hair, and nails brought to '+esc(state.location)+' 7 days a week.', cta: 'Book a service', act: 'scroll', target: 'popular' };
  const ctaAttr = state.view === 'landing' ? 'data-target="'+closeCfg.target+'"' : '';
  const ctaAct = state.view === 'landing' ? closeCfg.act : 'landing';
  return '<footer class="footer closing"><div class="closing-cta gg-wrap"><div><h2>'+closeCfg.heading+'</h2><p>'+closeCfg.sub+'</p></div>'+button(closeCfg.cta+' '+icon('arrow',18), ctaAct, 'btn-invert btn-xl', ctaAttr)+'</div><div class="footer-grid gg-wrap"><div><a class="wordmark light" href="#" data-action="landing">'+brandMark+'<span>GLAMGO</span></a><p>Home beauty visits, local salons, and direct skincare orders.</p><span class="footer-loc">'+esc(state.location)+' · Daily 8:00–21:00</span></div><div><h3>Experiences</h3>'+experiences.map(x=>'<button data-action="experience" data-id="'+x.id+'">'+x.title+'</button>').join('')+'</div><div><h3>Account</h3><button data-action="account">My profile</button><button data-action="account-bookings">My bookings</button><button data-action="orders">My orders</button><button data-action="wishlist">Wishlist</button></div><div><h3>Portals</h3><button data-action="partners">Partner Portal</button>'+(state.user?.role==='admin'?'<button data-action="admin">Command Centre</button>':'')+'<button data-action="support">Customer support</button><button data-action="notifications">Notifications</button></div></div><div class="footer-bottom gg-wrap"><span>© '+new Date().getFullYear()+' GlamGo</span><details class="credits"><summary>Photographs via Unsplash</summary><p>Treatment and salon editorial photography via Unsplash (Unsplash License); product stills hosted locally.</p></details></div></footer>';
}

function mobileNav(){
  return '<nav class="mobile-bottom" aria-label="Mobile navigation"><button data-action="landing" class="'+(state.view==='landing'?'active':'')+'">'+icon('home',21)+'<span>Home</span></button><button data-action="search-open">'+icon('search',21)+'<span>Search</span></button><button data-action="switch-toggle">'+icon('grid',21)+'<span>Portals</span></button><button data-action="cart">'+icon('bag',21)+'<span>Cart</span></button><button data-action="account" class="'+(state.view==='account'?'active':'')+'">'+icon('user',21)+'<span>Account</span></button></nav>';
}

function homeCard(s){
  return '<article class="service-card">'+image(s.img,s.name,'card-img')+'<button class="wishlist-on-card '+(state.wishlist.includes(s.id)?'saved':'')+'" data-action="wish" data-id="'+s.id+'" aria-label="Save '+esc(s.name)+'">'+icon('heart',18)+'</button><div class="card-body"><span class="card-kicker">'+esc(s.category)+'</span><h3>'+esc(s.name)+'</h3><div class="card-meta">'+icon('clock',15)+'<span>'+esc(s.duration)+'</span>'+rating(s.rating,s.reviews)+'</div><div class="card-bottom"><strong>From '+money(s.price)+'</strong><button data-action="book-home" data-id="'+s.id+'">Book now '+icon('arrow',16)+'</button></div></div></article>';
}

function professionalCard(p){
  return '<article class="pro-card"><div class="pro-top">'+image(p.img,p.name,'pro-avatar')+'<div><h3>'+esc(p.name)+'</h3><span>'+esc(p.specialty)+'</span></div></div><p>'+esc(p.experience)+'</p><div class="verified">'+icon('shield',15)+' Background verified</div><div class="pro-bottom">'+rating(p.rating,p.reviews)+'<span>From '+money(p.price)+'</span></div><button class="pro-book" data-action="book-pro" data-id="'+p.id+'">Check availability '+icon('arrow',16)+'</button></article>';
}

function homePage(){
  let filtered = services.filter(s => state.homeCategory === 'All' || s.category === state.homeCategory);
  if(state.sort === 'rating') filtered = [...filtered].sort((a,b) => Number(b.rating) - Number(a.rating));
  if(state.sort === 'price') filtered = [...filtered].sort((a,b) => a.price - b.price);
  const minPrice = getCatalogMinPrice(services, 799);
  const serviceCount = services.length || 8;
  const activeStep = Math.max(0, Math.min(heroChapters.length - 1, Number(state.activeChapter || 0)));
  const servicesSection = !services.length && state.catalogFeedsLoading.services
    ? catalogLoadingState('home treatments')
    : !services.length && state.catalogErrors.services
      ? catalogUnavailableState('Home treatments catalog')
      : '<div class="card-grid">'+filtered.map(homeCard).join('')+'</div>';
  const prosSection = !professionals.length && state.catalogFeedsLoading.professionals
    ? catalogLoadingState('specialists')
    : !professionals.length && state.catalogErrors.professionals
      ? catalogUnavailableState('Professionals directory')
      : '<div class="pro-grid">'+professionals.map(professionalCard).join('')+'</div>';
  return '<main id="top"><section class="hero-stage"'+heroEnterAttr('home')+' aria-labelledby="home-hero-h"><div class="home-hero gg-wrap"><div class="hero-copy"><p class="hero-fact-line enter-line">'+esc(state.location)+' · '+serviceCount+' treatments from '+money(minPrice)+'</p><h1 id="home-hero-h" class="enter-line">At-home beauty treatments at your door</h1><p class="hero-lead enter-fade">Verified specialists bring sterile tools, botanical skincare, and salon furnishings to '+esc(state.location)+' in 45 to 150 minute appointments.</p><div class="hero-buttons enter-fade">'+button('Book a service '+icon('arrow',17),'scroll','btn-primary','data-target="popular"')+button('How bookings work','scroll','btn-outline','data-target="how"')+'</div><dl class="hero-proof enter-fade"><div><dt>Appointments</dt><dd>45–150 min visits</dd></div><div><dt>Specialists</dt><dd>Background checked</dd></div><div><dt>Hours</dt><dd>Daily, 8:00–21:00</dd></div></dl></div><div class="hero-visual enter-media">'+image(HOME_IMG,'Beautician applying a facial treatment inside a bright living space')+'</div></div></section><section class="section" id="categories"><div class="gg-wrap">'+sectionHead('CATEGORIES','Treatment categories','Filter the home menu by facials, hair, nails, waxing, or full-body rituals.','<button class="text-jump" data-action="search-open">'+icon('search',16)+' Search catalog</button>')+'<div class="category-grid home-categories">'+homeCategories.slice(1).map((c,i)=>'<button data-action="home-category" data-id="'+c+'" class="category-tile'+(state.homeCategory===c?' active':'')+'"><div class="category-art cat-'+i+'">'+image(homeCategoryImages[c] || HOME_IMG, c+' at-home treatment')+'</div><span>'+c+'</span>'+icon('arrow',15)+'</button>').join('')+'</div></div></section><section class="section soft-section" id="popular"><div class="gg-wrap">'+sectionHead('MENU','At-home treatments & packages','Fixed upfront rates with no home-visit travel fee.')+'<div class="listing-tools"><div class="filter-row">'+homeCategories.map(c=>'<button class="filter-chip '+(state.homeCategory===c?'active':'')+'" data-action="home-category" data-id="'+c+'">'+c+'</button>').join('')+'</div><label class="sort-label">'+icon('filter',17)+' Sort by <select id="home-sort"><option value="featured" '+(state.sort==='featured'?'selected':'')+'>Featured</option><option value="rating" '+(state.sort==='rating'?'selected':'')+'>Top rated</option><option value="price" '+(state.sort==='price'?'selected':'')+'>Price: low to high</option></select></label></div>'+servicesSection+'</div></section><section class="section" id="professionals"><div class="gg-wrap">'+sectionHead('TEAM','Verified beauty specialists','Rated practitioners equipped for home visits across '+esc(state.location)+'.','<span class="section-aside">Background-checked artists</span>')+' '+prosSection+'</div></section><section class="how-section dark-band" id="how" data-moment="pinned-chapters" aria-labelledby="how-h"><div class="gg-wrap chapters-layout"><div class="chapters-text"><p class="eyebrow">HOW IT WORKS</p><h2 id="how-h">Booking a home visit in four steps</h2><ol class="chapters-steps">'+heroChapters.map((ch, idx)=>'<li class="chapter-step'+(idx===activeStep?' active':'')+'" data-step="'+idx+'"><button type="button" class="chapter-btn" data-action="chapter-select" data-step="'+idx+'" aria-pressed="'+(idx===activeStep?'true':'false')+'"><span>'+ch.num+'</span><div><h3>'+ch.title+'</h3><p>'+ch.desc+'</p></div></button></li>').join('')+'</ol></div><div class="chapters-stage"><div class="chapters-frame">'+heroChapters.map((ch, idx)=>'<img class="chapter-img'+(idx===activeStep?' active':'')+'" src="'+ch.img+'" alt="'+esc(ch.alt)+'" loading="eager" decoding="async" onerror="this.style.opacity=0.15">').join('')+'</div></div></div></section><section class="section package-section" id="ritual"><div class="gg-wrap split-pair"><div class="package-copy"><p class="eyebrow">SIGNATURE PACKAGE</p><h2>The Complete Glow 150-minute session</h2><p>Combines a hydrating botanical facial, classic manicure with nail care, and a salon blowout into one booked appointment.</p><div class="package-price">From '+money(3299)+' <span>· 150 minutes · Single visit</span></div>'+button('Book Complete Glow '+icon('arrow',17),'book-home','btn-primary','data-id="s8"')+'</div><div class="package-image frame-media">'+image(images.spa,'Spa candles and cotton towels arranged for an extended treatment')+'</div></div></section></main>';
}

const AREA_COORDS = {
  'bandra west': [19.0596, 72.8295],
  'bandra': [19.0596, 72.8295],
  'khar west': [19.0708, 72.8339],
  'khar': [19.0708, 72.8339],
  'juhu': [19.1075, 72.8263],
  'lower parel': [18.9977, 72.8295],
  'colaba': [18.9067, 72.8147],
  'powai': [19.1176, 72.9060],
  'andheri': [19.1136, 72.8697],
  'worli': [19.0176, 72.8179],
  'indiranagar': [12.9784, 77.6408],
  'koramangala': [12.9352, 77.6245],
  'bengaluru': [12.9716, 77.5946],
  'delhi': [28.6139, 77.2090],
  'south delhi': [28.5494, 77.2244],
  'koregaon park': [18.5362, 73.8939],
  'pune': [18.5204, 73.8567],
  'hyderabad': [17.3850, 78.4867],
  'mumbai': [19.0760, 72.8777]
};

function resolveSalonCoords(s){
  if(s && Number.isFinite(Number(s.lat)) && Number.isFinite(Number(s.lng))){
    return [Number(s.lat), Number(s.lng)];
  }
  const area = String(s?.area || state.location || 'Mumbai').toLowerCase();
  const match = Object.keys(AREA_COORDS).find(k => area.includes(k));
  const base = AREA_COORDS[match || 'mumbai'];
  const hash = String(s?.id || s?.name || '1').split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const offsetLat = ((hash % 7) - 3) * 0.0014;
  const offsetLng = (((hash >> 2) % 7) - 3) * 0.0014;
  return [base[0] + offsetLat, base[1] + offsetLng];
}

let activeLeafletMaps = [];
function destroyActiveMaps(){
  activeLeafletMaps.forEach(m => {
    try { m.stop(); m.off(); m.remove(); } catch {}
  });
  activeLeafletMaps = [];
}

function addTileLayerWithFallback(map){
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);
}

async function reverseGeocodeCoords(lat, lng){
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`, {
      headers: { Accept: 'application/json' }
    });
    if(!res.ok) throw new Error('nominatim');
    const data = await res.json();
    const a = data.address || {};
    const area = a.suburb || a.neighbourhood || a.city_district || a.town || a.village || '';
    const city = a.city || a.state_district || a.state || '';
    const formatted = [area, city].filter(Boolean).join(', ');
    if(formatted) return formatted;
  } catch {}
  return `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`;
}

function mountSalonMaps(){
  const locEl = document.getElementById('location-picker-map');
  if(locEl && !locEl._leaflet_id){
    const center = Array.isArray(state.userCoords)
      ? state.userCoords
      : resolveSalonCoords({ area: state.location });
    const map = L.map(locEl, {
      scrollWheelZoom: false,
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false
    }).setView(center, 13);
    addTileLayerWithFallback(map);
    const pinIcon = L.divIcon({
      className: 'gg-map-pin-wrap',
      html: '<span class="gg-map-pin gg-map-pin-active">Selected</span>',
      iconSize: [74, 28],
      iconAnchor: [37, 14]
    });
    const marker = L.marker(center, { icon: pinIcon }).addTo(map);
    map.on('click', async (ev) => {
      const { lat, lng } = ev.latlng;
      state.userCoords = [lat, lng];
      marker.setLatLng([lat, lng]);
      const input = document.querySelector('#location-form input[name="location"]');
      if(input) input.value = 'Updating location…';
      const label = await reverseGeocodeCoords(lat, lng);
      state.location = label;
      const freshInput = document.querySelector('#location-form input[name="location"]');
      if(freshInput) freshInput.value = label;
    });
    activeLeafletMaps.push(map);
  }

  const detailEl = document.getElementById('salon-detail-map');
  if(detailEl && !detailEl._leaflet_id){
    const s = salons.find(x => x.id === state.selectedSalon) || salons[0];
    if(s){
      const coords = resolveSalonCoords(s);
      const map = L.map(detailEl, {
        scrollWheelZoom: false,
        zoomAnimation: false,
        fadeAnimation: false,
        markerZoomAnimation: false
      }).setView(coords, 14);
      addTileLayerWithFallback(map);
      const pinIcon = L.divIcon({
        className: 'gg-map-pin-wrap',
        html: '<span class="gg-map-pin gg-map-pin-active">' + esc(money(s.price)) + '</span>',
        iconSize: [64, 28],
        iconAnchor: [32, 14]
      });
      L.marker(coords, { icon: pinIcon }).addTo(map).bindPopup('<div class="gg-map-popup"><strong>' + esc(s.name) + '</strong><span>' + esc(s.area) + ' · ' + esc(s.hours) + '</span></div>').openPopup();
      activeLeafletMaps.push(map);
    }
  }
}

function salonCard(s){
  return '<article class="salon-card"><div class="salon-image">'+image(s.img,s.name+' salon interior','card-img')+'<span>'+esc(s.tag)+'</span></div><div class="salon-body"><div class="salon-title"><h3>'+esc(s.name)+'</h3>'+rating(s.rating,s.reviews)+'</div><p>'+icon('pin',15)+esc(s.area)+' <i>·</i> '+esc(s.distance)+'</p><div class="salon-services">'+s.services.map(x=>'<span>'+esc(x)+'</span>').join('')+'</div><div class="card-bottom"><strong>From '+money(s.price)+'</strong><button data-action="salon-detail" data-id="'+s.id+'">View salon '+icon('arrow',16)+'</button></div></div></article>';
}

function salonPage(){
  let list = salons.filter(s => state.salonCategory === 'All' || s.services.includes(state.salonCategory));
  if(state.sort === 'rating') list = [...list].sort((a,b) => Number(b.rating) - Number(a.rating));
  if(state.sort === 'price') list = [...list].sort((a,b) => a.price - b.price);
  const minSalonPrice = getCatalogMinPrice(salons, 999);
  const salonCount = salons.length || 6;
  const salonsSection = !salons.length && state.catalogFeedsLoading.salons
    ? catalogLoadingState('salons near you')
    : !salons.length && state.catalogErrors.salons
      ? catalogUnavailableState('Salons directory')
      : '<div class="salon-grid">'+list.map(salonCard).join('')+'</div>'+(list.length?'':empty('search','No salons in this category','Try another treatment filter to view more studios.'));
  return '<main id="top"><section class="hero-stage"'+heroEnterAttr('salon')+' aria-labelledby="salon-hero-h"><div class="salon-hero gg-wrap"><div class="salon-hero-copy"><p class="hero-fact-line enter-line">'+esc(state.location)+' · '+salonCount+' partner studios from '+money(minSalonPrice)+'</p><h1 id="salon-hero-h" class="enter-line">Local salon studios with live booking slots</h1><p class="hero-lead enter-fade">Review menus, specialist rosters, and verified customer ratings before locking your appointment time.</p><div class="hero-buttons enter-fade">'+button('Browse salons '+icon('arrow',17),'scroll','btn-primary','data-target="salons"')+button('Pick visit date','salon-date','btn-outline')+'</div></div><div class="salon-hero-image enter-media">'+image(SALON_IMG,'Contemporary salon chairs and warm daylight mirrors')+'</div></div></section><section class="salon-search-wrap"><div class="gg-wrap"><div class="salon-search-box"><div><label>AREA</label><button data-action="location">'+icon('pin',17)+esc(state.location)+'</button></div><div><label>TREATMENT</label><button data-action="search-open">'+icon('search',17)+' Service or studio name</button></div><div><label>DATE</label><button data-action="salon-date">'+icon('calendar',17)+' '+(state.salonDate?formatDate(state.salonDate):'Select a date')+'</button></div>'+button('Find salons '+icon('arrow',17),'scroll','btn-primary','data-target="salons"')+'</div></div></section><section class="section" id="salon-categories"><div class="gg-wrap">'+sectionHead('DISCIPLINES','Appointments by specialty','Choose a discipline to jump straight to participating salons.')+'<div class="salon-category-grid">'+salonCategories.slice(1).map((c,i)=>'<button data-action="salon-category" data-id="'+c+'" class="salon-category-card'+(state.salonCategory===c?' active':'')+'">'+image([images.hair,images.facial,images.nails,images.makeup,images.spa][i],c+' salon treatments')+'<span>'+c+' '+icon('arrow',17)+'</span></button>').join('')+'</div></div></section><section class="section soft-section" id="salons"><div class="gg-wrap">'+sectionHead('DIRECTORY','Partner salons near '+esc(state.location),'Verified studios with transparent opening hours and upfront service menus.')+'<div class="listing-tools"><div class="filter-row">'+salonCategories.map(c=>'<button class="filter-chip '+(state.salonCategory===c?'active':'')+'" data-action="salon-category" data-id="'+c+'">'+c+'</button>').join('')+'</div><label class="sort-label">'+icon('filter',17)+' Sort by <select id="salon-sort"><option value="featured" '+(state.sort==='featured'?'selected':'')+'>Featured</option><option value="rating" '+(state.sort==='rating'?'selected':'')+'>Top rated</option><option value="price" '+(state.sort==='price'?'selected':'')+'>Price: low to high</option></select></label></div>'+salonsSection+'</div></section></main>';
}

function salonDetail(){
  const s = salons.find(x => x.id === state.selectedSalon) || salons[0];
  if (!s) {
    return '<main class="detail-page"><button class="back-link" data-action="landing">← Back to salons</button>'+(state.catalogFeedsLoading.salons?catalogLoadingState('salon details'):catalogUnavailableState('Salon details'))+'</main>';
  }
  const staffList = (s.staff && s.staff.length) ? s.staff : professionals.slice(0, 2);
  const galleryExtras = [SALON_IMG, images.salon2, images.salon3, images.spa].filter(u => u && u !== s.img);
  const dirUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(s.name + ', ' + s.area);
  return '<main class="detail-page"><button class="back-link" data-action="landing">← Back to salons</button><div class="salon-detail-gallery"><div>'+image(s.img,s.name+' interior')+'</div><div>'+image(galleryExtras[0]||images.salon2,'Salon styling space')+image(galleryExtras[1]||images.salon3,'Salon seating')+'</div></div><div class="detail-header"><div><p class="eyebrow">SALON & PARLOUR</p><h1>'+s.name+'</h1><p>'+icon('pin',17)+s.area+' · '+s.distance+'</p></div><div class="detail-header-rating">'+rating(s.rating,s.reviews)+'<span>Verified by GlamGo</span></div></div><div class="detail-columns"><div><section class="detail-block"><h2>About the salon</h2><p>'+s.about+'</p></section><section class="detail-block"><h2>Services & pricing</h2>'+s.services.map((c,i)=>'<div class="service-line"><div><strong>'+({Hair:'Signature cut & style',Skin:'Radiance facial',Nails:'Classic manicure',Makeup:'Occasion makeup',Spa:'Restorative ritual'}[c]||c)+'</strong><span>'+c+' · '+[60,75,50,90,60][i%5]+' min</span></div><strong>From '+money(s.price+i*350)+'</strong><button data-action="book-salon" data-id="'+s.id+'" data-service="'+c+'">Book</button></div>').join('')+'</section><section class="detail-block"><h2>Our team</h2><div class="staff-row">'+staffList.map(p=>'<div>'+image(p.img||images.pro1,p.name)+'<strong>'+esc(p.name)+'</strong><span>'+esc(p.specialty||'Specialist')+'</span></div>').join('')+'</div></section><section class="detail-block"><h2>Reviews</h2><p>'+rating(s.rating,s.reviews)+' &nbsp; Rated by GlamGo customers. Reviews appear here after completed appointments.</p></section></div><aside class="detail-aside"><h3>Plan your visit</h3><p>'+icon('pin',17)+s.area+'</p><p>'+icon('clock',17)+'Open daily · '+s.hours+'</p><div id="salon-detail-map" class="gg-map-detail" role="region" aria-label="Map showing salon location"></div><a class="btn btn-outline full gg-directions-link" href="'+dirUrl+'" target="_blank" rel="noopener noreferrer">'+icon('pin',15)+' Get Directions</a>'+button('Book an appointment '+icon('arrow',18),'book-salon','btn-primary full','data-id="'+s.id+'"')+'</aside></div></main>';
}

function productCard(p){
  const defaultVariant = (Array.isArray(p.variants) && p.variants.length) ? p.variants[0] : '';
  const stockInfo = getStockInfo(p, defaultVariant);
  const isSoldOut = stockInfo.soldOut || p.in_stock === false || p.soldOut === true;
  const isLoading = state.addingCartId === p.id;
  const isAdded = Boolean(state.addedCartIds?.[p.id]);
  const hasMrp = Boolean(p.old && Number(p.old) > Number(p.price));
  const discountPct = getDiscountPct(p);
  const tagClass = p.tag ? 'tag-' + String(p.tag).toLowerCase().replace(/[^a-z0-9]+/g,'-') : '';
  const btnLabel = isSoldOut ? 'Sold out' : isLoading ? 'Adding...' : isAdded ? 'Added '+icon('check',15) : 'Add to Bag';
  const sizeHint = p.variants && p.variants.length ? (p.variants.length > 1 ? defaultVariant + ' · ' + p.variants.length + ' options' : defaultVariant) : '';
  return '<article class="product-card"><div class="product-image" data-action="product-detail" data-id="'+p.id+'">'+image(p.img,p.name)+(p.tag?'<span class="product-tag '+tagClass+'">'+esc(p.tag)+'</span>':'')+'<button class="wishlist-on-card '+(state.wishlist.includes(p.id)?'saved':'')+'" data-action="wish" data-id="'+p.id+'" aria-pressed="'+(state.wishlist.includes(p.id)?'true':'false')+'" aria-label="Save '+esc(p.name)+'">'+icon('heart',16)+'</button></div><div class="product-body"><span class="product-brand">'+esc(p.brand)+'</span><button class="product-name" data-action="product-detail" data-id="'+p.id+'">'+esc(p.name)+'</button><div class="product-rating">'+rating(p.rating,p.reviews)+'</div>'+(sizeHint||stockInfo.low?'<div class="product-meta-line">'+(sizeHint?'<span>'+esc(sizeHint)+'</span>':'')+(stockInfo.low?'<span class="product-low-stock">'+esc(stockInfo.label)+'</span>':'')+'</div>':'')+'<div class="product-bottom"><div class="product-pricing"><strong class="product-price">'+money(p.price)+'</strong>'+(hasMrp?'<del class="product-old">'+money(p.old)+'</del>'+(discountPct>0?'<span class="product-save">'+discountPct+'% off</span>':''):'')+'</div><button class="add-bag-btn'+(isSoldOut?' sold-out':isAdded?' added':'')+(isLoading?' is-loading':'')+'" data-action="add-cart" data-id="'+p.id+'"'+(defaultVariant?' data-variant="'+esc(defaultVariant)+'"':'')+(isSoldOut||isLoading?' disabled aria-disabled="true"':'')+' aria-label="'+esc(btnLabel)+' '+esc(p.name)+'">'+btnLabel+'</button></div></div></article>';
}

function shopPage(){
  const list = getFilteredShopProducts(products);
  const catalogDown = !products.length && state.catalogErrors.products;
  const catalogBusy = !products.length && state.catalogFeedsLoading.products;
  const shopBrands = ['All', ...Array.from(new Set(products.map(p => p.brand).filter(Boolean)))];
  const visibleCollections = shopCollections.filter(col => col.id === 'All' || products.some(p => matchesShopCollection(p, col.id)));
  const activeFilters = [];
  if (state.shopCollection !== 'All') {
    const colObj = shopCollections.find(c => c.id === state.shopCollection);
    activeFilters.push({ key: 'collection', label: (colObj ? colObj.label : state.shopCollection), action: 'shop-collection', id: 'All' });
  }
  if (state.shopCategory !== 'All') {
    activeFilters.push({ key: 'category', label: shopCategoryLabel(state.shopCategory), action: 'shop-category', id: 'All' });
  }
  if (state.shopBrand !== 'All') {
    activeFilters.push({ key: 'brand', label: state.shopBrand, action: 'shop-brand', id: 'All' });
  }
  if (state.sort !== 'featured') {
    activeFilters.push({ key: 'sort', label: ({ price: 'Price: low to high', 'price-asc': 'Price: low to high', 'price-desc': 'Price: high to low', rating: 'Top rated', reviews: 'Most reviewed' }[state.sort] || 'Sorted'), action: 'shop-sort-reset', id: 'featured' });
  }
  const hasFilters = activeFilters.length > 0;
  const shelfContent = catalogBusy
    ? catalogLoadingState('beauty store')
    : catalogDown
      ? catalogUnavailableState('Storefront catalog', 'We could not load live product pricing and availability right now. Demo inventory is disabled to protect your checkout accuracy.')
      : '<div class="product-grid">'+list.map(productCard).join('')+'</div>'+(list.length?'':'<div class="empty-filtered">'+empty('search','No products match these filters','Try clearing one of your active filters or explore the full edit.')+'<div class="empty-actions">'+button('Reset all filters '+icon('arrow',16),'shop-reset','btn-outline')+'</div></div>');
  const brandButtons = (shopBrands.length > 1 ? shopBrands.slice(1) : ['LUMIÈRE','THE BOTANIST','VELVET FORM','MAISON CALME']).map(b => '<button class="brand-pill'+(state.shopBrand===b?' active':'')+'" data-action="shop-brand" data-id="'+esc(b)+'">'+esc(b)+'</button>').join('');
  const minShopPrice = getCatalogMinPrice(products, 599);
  const prodCount = products.length || 7;

  return '<main id="top"><section class="hero-stage"'+heroEnterAttr('shop')+' aria-labelledby="shop-hero-h"><div class="shop-hero gg-wrap"><div class="shop-hero-copy"><p class="hero-fact-line enter-line">'+prodCount+' daily formulas from '+money(minShopPrice)+' · Free shipping over '+money(1500)+'</p><h1 id="shop-hero-h" class="enter-line">Skincare, haircare, and colour essentials</h1><p class="hero-lead enter-fade">Independent formulations with full ingredient lists, pack sizes, and live partner seller stock.</p><div class="hero-buttons enter-fade">'+button('Shop beauty essentials '+icon('arrow',17),'scroll','btn-primary','data-target="bestsellers"')+button('Browse categories','scroll','btn-outline','data-target="shop-categories"')+'</div></div><div class="shop-hero-image enter-media">'+image(SHOP_IMG,'Glass dropper serum, moisturiser, and lip balm bottles')+'</div></div></section><div class="shop-benefits"><div class="shop-benefits-inner gg-wrap"><span>'+icon('spark',17)+' Full INCI ingredient lists</span><span>'+icon('truck',18)+' Free delivery above '+money(1500)+'</span><span>'+icon('shield',17)+' Verified partner sellers</span></div></div><div class="shop-mobile-search"><button class="mobile-search-trigger" data-action="search-open" aria-label="Search beauty store products, ingredients or brands">'+icon('search',18)+'<span>Search products, brands or ingredients</span></button></div><section class="section" id="shop-categories"><div class="gg-wrap">'+sectionHead('DEPARTMENTS','Shop by routine','Choose a department to filter the live inventory below.')+'<div class="shop-category-grid">'+shopCategories.slice(1).map((c,i)=>{
    const count = products.filter(p => p.category === c).length;
    return '<button class="shop-category-card'+(state.shopCategory===c?' active':'')+'" data-action="shop-category" data-id="'+c+'"><div>'+image([images.serum,images.lipstick,images.haircare,images.cream,images.fragrance,images.tools][i],shopCategoryLabel(c))+'</div><span><span class="cat-copy"><span class="cat-label">'+shopCategoryLabel(c)+'</span>'+(products.length?'<small class="cat-count">'+count+(count===1?' product':' products')+'</small>':'')+'</span>'+icon('arrow',16)+'</span></button>';
  }).join('')+'</div></div></section><section class="section soft-section" id="bestsellers"><div class="gg-wrap">'+sectionHead('CATALOG','The beauty shelf','Live variants and stock across partner sellers.')+'<div class="collection-pills" role="group" aria-label="Filter by collection">'+visibleCollections.map(col => '<button class="collection-pill'+(state.shopCollection===col.id?' active':'')+'" data-action="shop-collection" data-collection="'+col.id+'">'+col.label+'</button>').join('')+'</div><div class="listing-tools"><div class="filter-row" role="group" aria-label="Filter by category">'+shopCategories.map(c=>'<button class="filter-chip '+(state.shopCategory===c?'active':'')+'" data-action="shop-category" data-id="'+c+'">'+shopCategoryLabel(c)+'</button>').join('')+'</div><div class="shop-controls-right">'+(shopBrands.length>2?'<label class="sort-label">Brand <select id="shop-brand-select" aria-label="Filter by brand">'+shopBrands.map(b=>'<option value="'+esc(b)+'" '+(state.shopBrand===b?'selected':'')+'>'+esc(b==='All'?'All brands':b)+'</option>').join('')+'</select></label>':'')+'<label class="sort-label">Sort by <select id="shop-sort"><option value="featured" '+(state.sort==='featured'?'selected':'')+'>Featured</option><option value="price-asc" '+(state.sort==='price-asc'||state.sort==='price'?'selected':'')+'>Price: low to high</option><option value="price-desc" '+(state.sort==='price-desc'?'selected':'')+'>Price: high to low</option><option value="rating" '+(state.sort==='rating'?'selected':'')+'>Top rated</option><option value="reviews" '+(state.sort==='reviews'?'selected':'')+'>Most reviewed</option></select></label></div></div>'+(products.length?'<div class="shop-shelf-meta"><span class="shelf-count">Showing <strong>'+list.length+'</strong> of '+products.length+(products.length===1?' product':' products')+'</span>'+(hasFilters?'<div class="active-filters">'+activeFilters.map(f=>'<button class="active-filter-chip" data-action="'+f.action+'" data-id="'+esc(f.id)+'" data-collection="All" aria-label="Remove '+esc(f.label)+' filter">'+esc(f.label)+' '+icon('close',13)+'</button>').join('')+'<button class="reset-filters-link" data-action="shop-reset">Reset all</button></div>':'')+'</div>':'')+shelfContent+'</div></section><section class="section shop-editorial"><div class="gg-wrap split-pair"><div class="shop-editorial-copy"><p class="eyebrow">SKINCARE LINEUP</p><h2>Active niacinamide and barrier creams</h2><p>Compare pack sizes from 30 ml to 150 ml, inspect key actives, and add directly from multi-seller offers.</p>'+button('Shop skincare '+icon('arrow',17),'shop-category','btn-outline','data-id="Skincare"')+'</div><div class="shop-editorial-photo frame-media">'+image(SHOP_IMG,'Skincare serums and creams on warm stone surface')+'</div></div></section><section class="brand-section"><div class="gg-wrap"><p class="eyebrow">PARTNER BRANDS</p><div>'+brandButtons+'</div></div></section></main>';
}

function productDetail(){
  const p = products.find(x => x.id === state.selectedProduct) || products[0];
  if (!p) {
    return '<main class="detail-page"><button class="back-link" data-action="landing">← Back to shop</button>'+(state.catalogFeedsLoading.products?catalogLoadingState('product details'):catalogUnavailableState('Product details'))+'</main>';
  }
  const variants = Array.isArray(p.variants) && p.variants.length ? p.variants : [];
  const variant = state.productVariant || variants[0] || '';
  const stockInfo = getStockInfo(p, variant);
  const isSoldOut = stockInfo.soldOut || p.in_stock === false || p.soldOut === true;
  const isLoading = state.addingCartId === p.id;
  const isAdded = Boolean(state.addedCartIds?.[p.id]);
  const hasMrp = Boolean(p.old && Number(p.old) > Number(p.price));
  const discountPct = getDiscountPct(p);
  const couponSave = Math.min(300, Math.round(Number(p.price) * 0.1));
  const couponPrice = Math.max(1, Number(p.price) - couponSave);
  const couponApplied = state.coupon === 'GLAM10';
  const detailBtnLabel = isSoldOut ? 'Sold out' : isLoading ? 'Adding...' : isAdded ? 'Added to Bag '+icon('check',17) : 'Add to Bag '+icon('bag',18);
  const offersData = state.productOffers ? state.productOffers[p.id] : null;
  const offers = (offersData && offersData.offers) || [];
  const offersHtml = offers.length ? '<div class="product-offers"><p class="eyebrow">MARKETPLACE MERCHANTS ('+offers.length+')</p><p class="offers-sub">Verified partners fulfilling this product with real-time stock.</p>'+offers.map(off=>{
    const offerVariant = off.variant_name || variant || '';
    return '<div class="offer-row"><div><strong>'+esc(off.seller_name||'Certified Merchant')+'</strong><small>'+(offerVariant?esc(offerVariant)+' · ':'')+'SKU: '+esc(off.sku)+' · '+off.stock+' in stock</small></div><div class="offer-row-right"><strong>'+money(off.price)+'</strong><button class="btn btn-outline btn-sm" data-action="add-cart" data-id="'+p.id+'" data-listing="'+off.id+'"'+(offerVariant?' data-variant="'+esc(offerVariant)+'"':'')+(off.stock<=0?' disabled':'')+'>Select Offer</button></div></div>';
  }).join('')+'</div>' : '';

  const ingredientItems = parseIngredientsList(p.ingredients);
  const reviewState = state.productReviews?.[p.id];
  const liveReviews = Array.isArray(reviewState?.items) ? reviewState.items : [];
  const activeTab = ['details','ingredients','delivery','reviews'].includes(state.pdpTab) ? state.pdpTab : 'details';

  let tabPanelHtml = '';
  if (activeTab === 'details') {
    tabPanelHtml = '<p class="pdp-tab-copy">'+esc(p.description)+'</p><dl class="pdp-specs"><div><dt>Brand</dt><dd>'+esc(p.brand)+'</dd></div><div><dt>Category</dt><dd>'+esc(shopCategoryLabel(p.category))+'</dd></div>'+(variants.length?'<div><dt>Available options</dt><dd>'+esc(variants.join(', '))+'</dd></div>':'')+'<div><dt>Availability</dt><dd>'+esc(stockInfo.label)+'</dd></div>'+(p.tag?'<div><dt>Edit</dt><dd>'+esc(p.tag)+'</dd></div>':'')+'</dl>';
  } else if (activeTab === 'ingredients') {
    tabPanelHtml = ingredientItems.length
      ? '<p class="pdp-tab-sub">Key botanicals and formulation ingredients listed for this product:</p><div class="ingredient-chips">'+ingredientItems.map(ing=>'<span class="ingredient-chip">'+esc(ing)+'</span>').join('')+'</div><p class="pdp-tab-note">Full ingredient breakdown: '+esc(p.ingredients)+'</p>'
      : '<p class="pdp-tab-copy">See outer product packaging for complete batch ingredients.</p>';
  } else if (activeTab === 'delivery') {
    tabPanelHtml = '<div class="pdp-policy-list"><div><strong>Shipping</strong><p>Complimentary delivery across India calculated transparently at checkout.</p></div><div><strong>Authenticity</strong><p>100% authentic curated inventory fulfilled from verified stock ('+esc(stockInfo.label)+').</p></div><div><strong>Returns &amp; Support</strong><p>Delivered orders can request returns directly from <em>My orders</em> or via <code>care@glamgo.example</code>.</p></div></div>';
  } else {
    const reviewsBody = reviewState?.loading
      ? '<p class="pdp-tab-sub">Loading customer reviews…</p>'
      : liveReviews.length
        ? '<div class="pdp-review-list">'+liveReviews.map(r=>'<article class="pdp-review-item"><div class="pdp-review-head"><strong>'+esc(r.user_name||'Verified buyer')+'</strong><span class="rating">'+icon('star',14)+' '+Number(r.rating||0)+'</span></div>'+(r.comment?'<p>'+esc(r.comment)+'</p>':'')+'</article>').join('')+'</div>'
        : '<p class="pdp-tab-sub">Rated '+p.rating+' across '+p.reviews+' ratings. Detailed written feedback appears here once delivered buyers submit a review from My orders.</p>';
    tabPanelHtml = '<div class="pdp-review-summary"><div><strong>'+Number(p.rating||0).toFixed(1)+'</strong><span class="rating">'+icon('star',15)+' · '+p.reviews+' ratings</span></div></div>'+reviewsBody;
  }

  const related = getRelatedProducts(p, 3);
  const relatedHtml = related.length
    ? '<section class="pdp-related" aria-label="Pairs well with"><div class="pdp-related-head"><div><p class="eyebrow">COMPLETE THE ROUTINE</p><h2>More from the beauty shelf</h2></div>'+button('Browse full edit '+icon('arrow',16),'shop-all','btn-outline')+'</div><div class="product-grid pdp-related-grid">'+related.map(productCard).join('')+'</div></section>'
    : '';

  return '<main class="detail-page"><nav class="pdp-breadcrumb" aria-label="Breadcrumb"><button data-action="shop-all">Beauty Store</button><span>/</span><button data-action="shop-category" data-id="'+esc(p.category)+'">'+esc(shopCategoryLabel(p.category))+'</button><span>/</span><span aria-current="page">'+esc(p.name)+'</span></nav><div class="product-detail"><div class="product-detail-image">'+image(p.img,p.name)+(p.tag?'<span class="product-tag">'+esc(p.tag)+'</span>':'')+(discountPct>0?'<span class="pdp-discount-badge">'+discountPct+'% OFF</span>':'')+'</div><div class="product-detail-info"><div class="pdp-brand-row"><button class="eyebrow pdp-brand-link" data-action="shop-brand" data-id="'+esc(p.brand)+'">'+esc(p.brand)+'</button>'+(p.tag?'<span class="pdp-edit-pill">'+esc(p.tag)+'</span>':'')+'</div><h1>'+esc(p.name)+'</h1><div class="pdp-rating-row"><button class="pdp-rating-jump" data-action="pdp-reviews-jump" aria-label="Jump to product reviews">'+rating(p.rating,p.reviews)+'</button><span class="stock-pill '+(stockInfo.soldOut?'out':stockInfo.low?'low':'in')+'">'+esc(stockInfo.label)+'</span></div><div class="product-detail-price">'+money(p.price)+(hasMrp?'<del>'+money(p.old)+'</del><span>Save '+money(p.old-p.price)+' ('+discountPct+'% off)</span>':'')+'</div><p class="pdp-tax-note">Inclusive of all taxes · Complimentary delivery across India</p>'+(couponSave>0?'<div class="pdp-coupon-banner"><div><strong>Save with code GLAM10</strong><span>Get 10% off up to ₹300 · Est. '+money(couponPrice)+'</span></div><button class="btn-link-accent" data-action="apply-pdp-coupon" data-code="GLAM10">'+(couponApplied?'Code applied '+icon('check',14):'Apply code')+'</button></div>':'')+'<p class="product-desc">'+esc(p.description)+'</p>'+(variants.length?'<div class="variant-select"><span>'+getVariantHeading(p,variants)+'</span><div>'+variants.map(v=>{
    const vStock = getStockInfo(p, v);
    return '<button class="'+(v===variant?'active':'')+(vStock.soldOut?' sold-out-var':'')+'" data-action="variant" data-id="'+esc(v)+'">'+esc(v)+'</button>';
  }).join('')+'</div></div>':'')+'<div class="detail-actions">'+button(detailBtnLabel,'add-cart','btn-primary'+(isAdded?' added':''),'data-id="'+p.id+'"'+(variant?' data-variant="'+esc(variant)+'"':'')+(isSoldOut||isLoading?' disabled':''))+button('Buy now '+icon('arrow',17),'buy-now','btn-outline','data-id="'+p.id+'"'+(variant?' data-variant="'+esc(variant)+'"':'')+(isSoldOut?' disabled':''))+'<button class="detail-wish '+(state.wishlist.includes(p.id)?'saved':'')+'" data-action="wish" data-id="'+p.id+'" aria-pressed="'+(state.wishlist.includes(p.id)?'true':'false')+'" aria-label="Add to wishlist">'+icon('heart',20)+'</button></div>'+offersHtml+'<div class="product-facts"><div>'+icon('truck',20)+' Delivery across India</div><div>'+icon('shield',20)+' 100% authentic curated products</div></div><div class="pdp-tabs" role="tablist" aria-label="Product information">'+[['details','Details'],['ingredients','Ingredients'],['delivery','Delivery & Returns'],['reviews','Reviews ('+p.reviews+')']].map(([tid,tlabel])=>'<button role="tab" aria-selected="'+(activeTab===tid?'true':'false')+'" class="pdp-tab '+(activeTab===tid?'active':'')+'" data-action="pdp-tab" data-id="'+tid+'">'+tlabel+'</button>').join('')+'</div><div class="pdp-tab-panel" id="pdp-tab-panel" role="tabpanel">'+tabPanelHtml+'</div></div></div>'+relatedHtml+'</main>';
}

function account(){
  const tabs = ['Overview','Personal information','Saved addresses','My bookings','My orders','Wishlist','Payment methods','Notifications','Coupons & rewards','Reviews','Customer support'];
  let content = '';
  if(state.accountTab==='Overview') content='<div class="account-welcome"><p class="eyebrow">GOOD TO SEE YOU</p><h2>Hello, '+esc(state.user.name.split(' ')[0])+'.</h2><p>Every side of beauty, together in one place.</p></div>'+(state.user?.role==='admin'?'<div class="account-block" style="border:1px solid var(--champagne);background:rgba(197,167,125,0.06);margin-bottom:20px"><h3>Platform Administrator</h3><p>You have full governance authority across partner onboarding, users, bookings, orders, and economics.</p>'+button('Admin Command Centre '+icon('arrow',16),'admin','btn-primary')+'</div>':'')+'<div class="account-quick"><button data-action="account-tab" data-id="My bookings">'+icon('calendar',23)+'<strong>'+state.bookings.length+(state.bookings.length===1?' booking':' bookings')+'</strong><span>Appointments and home services</span>'+icon('arrow',17)+'</button><button data-action="account-tab" data-id="My orders">'+icon('bag',23)+'<strong>'+state.orders.length+(state.orders.length===1?' order':' orders')+'</strong><span>Your beauty store purchases</span>'+icon('arrow',17)+'</button><button data-action="account-tab" data-id="Wishlist">'+icon('heart',23)+'<strong>'+state.wishlist.length+' saved</strong><span>Things you love</span>'+icon('arrow',17)+'</button></div><div class="account-block"><h3>Your details</h3><p>'+esc(state.user.email)+' · '+esc(state.user.phone)+'</p><button data-action="account-tab" data-id="Personal information">Edit information '+icon('arrow',15)+'</button></div>';
  else if(state.accountTab==='Personal information') content='<div class="account-block"><h2>Personal information</h2><p>Keep your contact details current for bookings and orders.</p><form id="profile-form" class="form-grid"><label>Full name<input name="name" required value="'+esc(state.user.name)+'"></label><label>Email address<input name="email" type="email" required value="'+esc(state.user.email)+'"></label><label>Phone number<input name="phone" required value="'+esc(state.user.phone)+'"></label><button class="btn btn-primary" type="submit">Save changes</button></form></div>';
  else if(state.accountTab==='Saved addresses') content='<div class="account-block"><div class="account-heading"><h2>Saved addresses</h2>'+button('Add address '+icon('plus',17),'address-add','btn-outline')+'</div>'+state.addresses.map((a,i)=>'<div class="address-card"><div>'+icon('pin',20)+'<span><strong>'+esc(a.label)+'</strong><small>'+esc(a.text)+'</small></span></div><button data-action="address-delete" data-id="'+i+'">Remove</button></div>').join('')+'</div>';
  else if(state.accountTab==='My bookings') content='<div class="account-block"><h2>My bookings</h2><p>Home services and salon appointments, together.</p>'+(state.bookings.length?state.bookings.map(b=>{
    const isConfirmed = !b.status || b.status.toLowerCase() === 'confirmed';
    const isCompleted = b.status && b.status.toLowerCase() === 'completed';
    const isCancelled = b.status && b.status.toLowerCase() === 'cancelled';
    const cancelBtn = isConfirmed ? '<button class="text-action" style="color:var(--burgundy,#b33939);margin-top:6px;font-size:12px;font-weight:600" data-action="booking-cancel" data-id="'+b.id+'">Cancel appointment</button>' : '';
    const reviewBtn = isCompleted ? '<button class="text-action" style="color:var(--champagne,#c5a77d);margin-top:6px;font-size:12px;font-weight:600" data-action="review-add">Write a review</button>' : '';
    const payStatus = b.payment_status ? '<small style="display:block;margin-top:3px;color:var(--muted)">Payment: '+esc(b.payment_status)+'</small>' : '';
    return '<div class="history-card"><div class="history-icon">'+icon(b.type==='home'?'home':'salon',22)+'</div><div><span class="eyebrow">'+(b.type==='home'?'AT-HOME SERVICE':'SALON APPOINTMENT')+'</span><h3>'+esc(b.title)+'</h3><p>'+formatDate(b.date)+' · '+b.time+' · '+esc(b.location)+'</p>'+payStatus+cancelBtn+reviewBtn+'</div><span class="status '+(isCancelled?'status-cancelled':isCompleted?'status-completed':'')+'">'+esc(b.status||'Confirmed')+'</span></div>';
  }).join(''):empty('calendar','Your next moment awaits','Choose a home service or salon appointment to see it here.',button('Explore beauty '+icon('arrow',16),'experience','btn-primary','data-id="home"')))+'</div>';
  else if(state.accountTab==='My orders') content='<div class="account-block"><h2>My orders</h2><p>Your beauty store purchases and delivery updates.</p>'+(state.orders.length?state.orders.map(o=>'<div class="history-card"><div class="history-icon">'+icon('bag',22)+'</div><div><span class="eyebrow">ORDER '+esc(o.id)+' · '+esc(String(o.status||'placed').replace('_',' ').toUpperCase())+'</span><h3>'+(o.items||[]).map(i=>esc(i.name)+(i.variant_name?' ('+esc(i.variant_name)+')':'')+' × '+i.qty).join(', ')+'</h3><p>'+formatDate(o.date)+' · '+money(o.total)+' · Payment: '+esc(formatOrderPaymentStatusLabel(o.payment_status))+(o.oos_refund_id?' · Refund: '+esc(o.oos_refund_id):'')+'</p></div><button class="text-action" data-action="tracking" data-id="'+esc(o.id)+'">Track order '+icon('arrow',15)+'</button></div>').join(''):empty('bag','Your beauty bag is waiting','Discover your first favourite in the GlamGo beauty store.',button('Explore the store '+icon('arrow',16),'experience','btn-primary','data-id="shop"')))+'</div>';
  else if(state.accountTab==='Wishlist'){const liked=[...services,...products].filter(x=>state.wishlist.includes(x.id));content='<div class="account-block"><h2>Your wishlist</h2><p>A space for everything that catches your eye.</p>'+(liked.length?'<div class="wishlist-grid">'+liked.map(x=>x.brand?productCard(x):homeCard(x)).join('')+'</div>':empty('heart','Nothing saved yet','Tap the heart on a service or product to keep it close.'))+'</div>';}
  else if(state.accountTab==='Payment methods') content='<div class="account-block"><h2>Payment methods</h2>'+empty('bag','Pay the way you prefer','Choose UPI, card or cash when you confirm a booking or order.')+'</div>';
  else if(state.accountTab==='Notifications') content='<div class="account-block"><h2>Notifications</h2>'+(state.notifications.length?state.notifications.map(n=>'<div class="notification-row">'+icon(n.type==='order'?'bag':'calendar',20)+'<span>'+esc(n.text)+'</span></div>').join(''):empty('bell','All caught up','Booking confirmations and order updates will appear here.'))+'</div>';
  else if(state.accountTab==='Coupons & rewards') content='<div class="account-block"><h2>Coupons & rewards</h2><div class="coupon-card"><p class="eyebrow">WELCOME GIFT</p><h3>Take 10% off your first beauty store order.</h3><p>Use code <strong>GLAM10</strong> at checkout. Maximum discount ₹300.</p></div></div>';
  else if(state.accountTab==='Reviews') content='<div class="account-block"><div class="account-heading"><h2>My reviews</h2>'+button('Write a review '+icon('plus',17),'review-add','btn-outline')+'</div><p>Verified reviews for completed doorstep care, salon appointments, and products.</p>'+(state.reviews.length?state.reviews.map(r=>'<div class="history-card"><div class="history-icon">'+icon('star',22)+'</div><div><span class="eyebrow">'+r.rating+' ★ · '+esc(r.item_type).toUpperCase()+'</span><h3>'+esc(r.comment)+'</h3><p>Reviewed on '+formatDate(r.created_at)+'</p></div></div>').join(''):empty('star','No reviews yet','Share your experience on services you have booked or beauty products you have received.'))+'</div>';
  else content='<div class="account-block"><h2>Customer support</h2><p>We are here to make every experience feel effortless.</p><div class="support-card"><h3>How can we help?</h3><p>For help with a booking or order, send us a message and include your booking or order number.</p><a href="mailto:care@glamgo.example">care@glamgo.example '+icon('arrow',16)+'</a></div></div>';
  return '<main class="account-page"><div class="account-title"><p class="eyebrow">YOUR GLAMGO ACCOUNT</p><h1>One account. <em>Every side of beauty.</em></h1></div><div class="account-layout"><aside class="account-sidebar"><div class="account-person"><span>'+(state.user?.name ? state.user.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() : 'AM')+'</span><div><strong>'+esc(state.user.name)+'</strong><small>'+esc(state.user.email)+'</small></div></div>'+tabs.map(t=>'<button class="'+(state.accountTab===t?'active':'')+'" data-action="account-tab" data-id="'+t+'">'+t+icon('arrow',15)+'</button>').join('')+'<button class="logout" data-action="logout">'+icon('logout',17)+' Log out</button></aside><div class="account-content">'+content+'</div></div></main>';
}

function cartPage(){
  const savedCount = countCart();
  const entries = getCartEntries();
  const popularPicks = [...products].sort((a,b)=> (b.tag==='BESTSELLER'?3:b.tag==='TRENDING'?2:b.tag==='NEW'?1:0) - (a.tag==='BESTSELLER'?3:a.tag==='TRENDING'?2:a.tag==='NEW'?1:0) || Number(b.rating)-Number(a.rating)).slice(0,3);
  if (savedCount > 0 && !entries.length) {
    const noticeBody = state.catalogFeedsLoading.products
      ? catalogLoadingState('your saved beauty bag (' + savedCount + ' item' + (savedCount > 1 ? 's' : '') + ')')
      : catalogUnavailableState('Saved beauty bag pricing', 'Your bag still keeps ' + savedCount + ' saved item' + (savedCount > 1 ? 's' : '') + ', but live catalog pricing could not be verified right now.');
    return '<main class="cart-page"><div class="page-heading"><p class="eyebrow">THE BEAUTY STORE</p><h1>Your beauty bag.</h1><p>Saved items remain preserved until the catalog is ready.</p></div>'+noticeBody+'</main>';
  }
  const subtotal = entries.reduce((sum, e) => sum + e.lineTotal, 0);
  return '<main class="cart-page"><div class="page-heading"><p class="eyebrow">THE BEAUTY STORE</p><h1>Your beauty bag.</h1><p>Beautiful things, ready when you are.</p></div>'+(entries.length?'<div class="cart-layout"><div class="cart-items">'+entries.map(e=>'<div class="cart-item">'+image(e.product.img,e.product.name)+'<div><span class="product-brand">'+esc(e.product.brand)+'</span><h3>'+esc(e.product.name)+'</h3><p>'+esc(e.variant || '')+(e.sellerName?' · Sold by '+esc(e.sellerName):'')+'</p><button class="remove-link" data-action="cart-remove" data-id="'+esc(e.key)+'">Remove</button></div><div class="cart-item-end"><strong>'+money(e.lineTotal)+'</strong><div class="qty"><button data-action="cart-qty" data-id="'+esc(e.key)+'" data-delta="-1" aria-label="Decrease quantity">'+icon('minus',15)+'</button><span>'+e.qty+'</span><button data-action="cart-qty" data-id="'+esc(e.key)+'" data-delta="1" aria-label="Increase quantity">'+icon('plus',15)+'</button></div></div></div>').join('')+'</div><aside class="order-summary"><h3>Order summary</h3><div><span>Subtotal</span><strong>'+money(subtotal)+'</strong></div><div><span>Delivery</span><strong>'+(subtotal >= 1500 ? 'Complimentary (≥ ₹1,500/seller)' : 'Calculated per seller at checkout')+'</strong></div><div class="summary-total"><span>Estimated subtotal</span><strong>'+money(subtotal)+'</strong></div>'+button('Continue to checkout '+icon('arrow',17),'checkout','btn-primary full')+'<p>Secure checkout · Authentic products</p></aside></div>':'<div class="empty-cart-wrap">'+empty('bag','Your bag is waiting to be filled','Explore thoughtfully curated beauty and find something to love.',button('Explore Bestsellers '+icon('arrow',17),'explore-bestsellers','btn-primary'))+(popularPicks.length?'<section class="empty-cart-recs" aria-labelledby="empty-recs-title"><div class="empty-recs-head"><p class="eyebrow">POPULAR PICKS</p><h2 id="empty-recs-title">Most-loved beauty rituals</h2></div><div class="product-grid empty-recs-grid">'+popularPicks.map(productCard).join('')+'</div></section>':(state.catalogErrors.products?catalogUnavailableState('Popular recommendations','We could not load live product picks right now.'):''))+'</div>')+'</main>';
}

function checkoutPage(){
  if(!countCart()) return cartPage();
  const entries = getCartEntries();
  if(!entries.length && (state.catalogFeedsLoading.products || state.catalogErrors.products)) return cartPage();

  const fp = getCartItemsFingerprint(entries);
  const resState = state.pendingReservation;
  const resData = (resState && resState.fingerprint === fp && resState.data) ? resState.data : null;
  const resError = (resState && resState.fingerprint === fp && resState.error) ? resState.error : null;

  const subtotal = resData ? Number(resData.total_subtotal) : entries.reduce((s, e) => s + e.lineTotal, 0);
  const shipping = resData ? Number(resData.total_shipping) : (subtotal >= 1500 ? 0 : 100);
  const discount = state.pendingCheckoutOrder?.order?.discount != null
    ? Number(state.pendingCheckoutOrder.order.discount)
    : (state.coupon ? Number(state.couponDiscount || (state.coupon === 'GLAM10' ? Math.min(300, Math.round(subtotal * 0.1)) : 0)) : 0);
  const payableTotal = Math.max(0, subtotal + shipping - discount);
  const addrIdx = Math.min(Number(state.selectedCheckoutAddressIdx || 0), Math.max(0, state.addresses.length - 1));

  const sellerPackagesHtml = resData && Array.isArray(resData.sellers) && resData.sellers.length
    ? '<div class="checkout-seller-packages" style="margin:8px 0 12px;border-top:1px solid #eee;padding-top:10px;">' +
        resData.sellers.map(s => '<div style="margin-bottom:8px;font-size:12px;">' +
          '<div style="display:flex;justify-content:space-between;color:#666;"><span><strong>'+esc(s.seller_name)+'</strong> package</span><span>Shipping: '+(Number(s.estimated_shipping_fee)===0?'Complimentary':money(s.estimated_shipping_fee))+'</span></div>' +
          (s.items||[]).map(it => '<div style="display:flex;justify-content:space-between;margin-top:3px;"><span>'+esc(it.product_name)+(it.variant_name?' ('+esc(it.variant_name)+')':'')+' × '+it.qty+'</span><strong>'+money(it.line_total)+'</strong></div>').join('') +
        '</div>').join('') +
      '</div>'
    : entries.map(e => '<div><span>'+esc(e.product.name)+(e.variant?' ('+esc(e.variant)+')':'')+' × '+e.qty+'</span><strong>'+money(e.lineTotal)+'</strong></div>').join('');

  const resNoticeHtml = resError
    ? '<div class="payment-notice payment-notice-error" role="alert"><strong>Inventory check issue</strong><p>'+esc(resError)+'</p></div>'
    : '';
  const noticeHtml = state.paymentNotice
    ? '<div class="payment-notice payment-notice-'+esc(state.paymentNotice.type||'error')+'" role="alert"><strong>'+esc(state.paymentNotice.title)+'</strong><p>'+esc(state.paymentNotice.message)+'</p></div>'
    : '';
  const payLabel = state.checkoutBusy
    ? 'Processing...'
    : (state.paymentNotice && state.checkoutPayment !== 'Cash on delivery' ? 'Retry payment '+icon('arrow',17) : 'Place order '+icon('arrow',17));

  return '<main class="checkout-page"><button class="back-link" data-action="cart">← Back to bag</button><div class="page-heading"><p class="eyebrow">ALMOST THERE</p><h1>Checkout.</h1></div><div class="checkout-layout"><div><section class="checkout-block"><h2>01 &nbsp; Delivery address</h2><label>Deliver to<select id="checkout-address">'+state.addresses.map((a,i)=>'<option value="'+i+'"'+(i===addrIdx?' selected':'')+'>'+esc(a.label)+' — '+esc(a.text)+'</option>').join('')+'</select></label><button class="text-action" data-action="address-add">+ Add another address</button></section><section class="checkout-block"><h2>02 &nbsp; Payment method</h2><div class="payment-options">'+['UPI','Credit / debit card','Cash on delivery'].map(p=>'<button data-action="payment" data-id="'+p+'" class="'+(state.checkoutPayment===p?'active':'')+'"'+(state.checkoutBusy?' disabled':'')+'><span class="radio"></span>'+p+'</button>').join('')+'</div></section><section class="checkout-block"><h2>03 &nbsp; Coupon</h2><form id="coupon-form" class="coupon-form"><input name="coupon" placeholder="Enter coupon code" value="'+esc(state.coupon)+'"><button type="submit">Apply</button></form>'+(state.coupon && discount > 0?'<p class="success-note">'+icon('check',16)+' '+esc(state.coupon)+' applied — you save '+money(discount)+'</p>':'')+'</section></div><aside class="order-summary"><h3>Your order</h3>'+sellerPackagesHtml+'<hr><div><span>Subtotal</span><strong>'+money(subtotal)+'</strong></div>'+(discount?'<div><span>Discount</span><strong>−'+money(discount)+'</strong></div>':'')+'<div><span>Delivery &amp; shipping</span><strong>'+(shipping===0?'Complimentary':money(shipping))+'</strong></div><div class="summary-total"><span>Total payable</span><strong>'+money(payableTotal)+'</strong></div>'+resNoticeHtml+noticeHtml+button(payLabel,'place-order','btn-primary full',state.checkoutBusy?'disabled aria-disabled="true"':'')+'<p>Server-verified pricing, live stock hold &amp; secure checkout.</p></aside></div></main>';
}

function formatOrderPaymentStatusLabel(payStatus){
  const s = String(payStatus || 'pending').toLowerCase();
  if (s === 'completed') return 'Paid & Confirmed';
  if (s === 'cod_pending') return 'Cash on Delivery (Due)';
  if (s === 'cod_collected') return 'Cash Collected';
  if (s === 'partially_refunded') return 'Partially Refunded';
  if (s === 'refund_pending_oos') return 'Cancelled — Auto-Refund Pending (OOS)';
  if (s === 'refunded_oos') return 'Cancelled — Automatically Refunded (OOS)';
  if (s === 'refunded') return 'Refunded';
  if (s === 'expired') return 'Hold Expired';
  if (s === 'failed') return 'Payment Failed';
  return 'Awaiting Payment';
}

function isOrderRefundOrCancelled(o){
  const st = String(o?.status || '').toLowerCase();
  const ps = String(o?.payment_status || '').toLowerCase();
  return st === 'cancelled' || ['refund_pending_oos', 'refunded_oos', 'refunded', 'expired'].includes(ps);
}

function canSellerFulfillOrder(paymentMethod, paymentStatus, itemStatus, parentStatus){
  const st = String(itemStatus || '').toLowerCase();
  const pst = String(parentStatus || '').toLowerCase();
  const ps = String(paymentStatus || '').toLowerCase();
  if (st === 'cancelled' || pst === 'cancelled') return false;
  if (['refund_pending_oos', 'refunded_oos', 'refunded', 'expired', 'failed'].includes(ps)) return false;
  const isCod = ['COD', 'CASH ON DELIVERY', 'CASH'].includes(String(paymentMethod || '').trim().toUpperCase());
  if (isCod) return true;
  return ps === 'completed' || ps === 'partially_refunded';
}

function orderSuccess(){
  const o = state.orders[0] || { id: 'GG000000', total: 0, address: { label: 'Home' } };
  if (isOrderRefundOrCancelled(o)) {
    state.trackingId = o.id;
    return trackingPage();
  }
  return '<main class="success-page"><div class="success-mark">'+icon('check',34)+'</div><p class="eyebrow">ORDER CONFIRMED</p><h1>A beautiful delivery <em>is on its way.</em></h1><p>Thank you for shopping with GlamGo. Your order '+o.id+' has been placed and will be prepared with care.</p><div class="success-details"><span>ORDER TOTAL <strong>'+money(o.total)+'</strong></span><span>DELIVERING TO <strong>'+esc(o.address?.label||'Home')+'</strong></span></div><div class="success-actions">'+button('Track your order '+icon('arrow',17),'tracking','btn-primary','data-id="'+o.id+'"')+button('Continue shopping','experience','btn-outline','data-id="shop"')+'</div></main>';
}

function trackingPage(){
  const o = state.orders.find(x => x.id === state.trackingId) || state.orders[0];
  if(!o) return account();

  const payStatusLower = String(o.payment_status || 'pending').toLowerCase();
  const orderStatusLower = String(o.status || 'placed').toLowerCase();
  const isCancelledOrder = isOrderRefundOrCancelled(o);

  const stepOrder = ['placed', 'packed', 'in_transit', 'delivered'];
  const activeStepIdx = isCancelledOrder ? -1 : Math.max(0, stepOrder.indexOf(orderStatusLower));

  let statusBannerHtml = '';
  if (payStatusLower === 'refund_pending_oos') {
    statusBannerHtml = '<div class="payment-notice payment-notice-warn" role="alert" style="margin-bottom:16px"><strong>Automatic refund in progress (Out of Stock)</strong><p>Order #' + esc(o.id) + ' was cancelled because inventory sold out after your hold expired. Your captured payment is scheduled for automatic full refund' + (o.oos_refund_status ? ' (status: ' + esc(o.oos_refund_status) + ')' : '') + (o.oos_refund_id ? ' · Ref: <code>' + esc(o.oos_refund_id) + '</code>' : '') + '.</p></div>';
  } else if (payStatusLower === 'refunded_oos') {
    statusBannerHtml = '<div class="payment-notice" role="status" style="margin-bottom:16px;border-left:4px solid #2e6b4f;background:#f3f9f5;padding:12px 14px"><strong>Automatic full refund completed (Out of Stock)</strong><p>Order #' + esc(o.id) + ' was cancelled because stock sold out after hold expiry. Your full payment has been refunded' + (o.oos_refund_id ? ' (Gateway Ref: <code>' + esc(o.oos_refund_id) + '</code>)' : '') + '.</p></div>';
  } else if (payStatusLower === 'refunded') {
    statusBannerHtml = '<div class="payment-notice" role="status" style="margin-bottom:16px;padding:12px 14px"><strong>Order refunded</strong><p>Your payment for order #' + esc(o.id) + ' has been fully refunded.</p></div>';
  } else if (orderStatusLower === 'cancelled') {
    statusBannerHtml = '<div class="payment-notice payment-notice-error" role="alert" style="margin-bottom:16px"><strong>Order cancelled</strong><p>Order #' + esc(o.id) + ' has been cancelled (' + esc(formatOrderPaymentStatusLabel(payStatusLower)) + ').</p></div>';
  }

  let packagesHtml = '';
  if(o.suborders && o.suborders.length > 0) {
    packagesHtml = '<div class="tracking-packages"><h3>Seller packages (' + o.suborders.length + ')</h3>' +
      o.suborders.map(s => `
        <div class="package-card" style="border:1px solid #eaeaea;border-radius:8px;padding:16px;margin-bottom:14px;background:#faf9f8;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <strong>Package from ${esc(s.seller_name || 'Verified Merchant')}</strong>
            <span class="status-badge" style="background:#222;color:#fff;padding:3px 8px;border-radius:4px;font-size:11px;text-transform:uppercase;">${esc(s.status)}</span>
          </div>
          ${s.shipment ? `
            <p style="font-size:13px;color:#555;margin:4px 0;">
              Carrier: <strong>${esc(s.shipment.carrier_name)}</strong> · Tracking: <strong>${esc(s.shipment.tracking_number)}</strong>
              ${s.shipment.tracking_url ? `<a href="${esc(s.shipment.tracking_url)}" target="_blank" rel="noopener" style="margin-left:8px;color:#8f6d40;text-decoration:underline;">Track courier</a>` : ''}
            </p>
          ` : (s.status === 'cancelled' || isCancelledOrder)
            ? '<p style="font-size:13px;color:#888;margin:4px 0;">Package cancelled — not fulfilled.</p>'
            : '<p style="font-size:13px;color:#888;margin:4px 0;">Package being prepared by seller.</p>'}
          <div style="margin-top:8px;border-top:1px solid #eee;padding-top:8px;">
            ${(s.items || []).map(it => `
              <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
                <span>${esc(it.name)}${it.variant_name ? ' (' + esc(it.variant_name) + ')' : ''}${it.sku ? ' · SKU: ' + esc(it.sku) : ''} × ${it.qty}</span>
                <span>₹${(Number(it.price) * Number(it.qty) - Number(it.allocated_discount || 0)).toFixed(2).replace(/\.00$/, '')}</span>
              </div>
              ${it.return_status ? `
                <div style="font-size:12px;color:#6f5230;margin:4px 0;">
                  Return: <strong>${esc(it.return_status)}</strong> · Refund: <strong>${esc(it.refund_status || 'PENDING')}</strong>${it.gateway_refund_id ? ' (' + esc(it.gateway_refund_id) + ')' : ''}
                </div>
              ` : (!isCancelledOrder && (it.return_eligible || s.status === 'delivered')) ? `
                <button class="btn-outline" style="font-size:11px;padding:4px 8px;margin-top:4px;" data-action="return-request" data-suborder="${esc(s.suborder_id)}" data-item="${it.order_item_id}" data-qty="${it.qty}">Request return</button>
              ` : ''}
            `).join('')}
          </div>
        </div>
      `).join('') + '</div>';
  }

  return '<main class="tracking-page"><button class="back-link" data-action="orders">← Back to orders</button><div class="page-heading"><p class="eyebrow">ORDER '+esc(o.id)+' · '+esc(String(o.status||'placed').toUpperCase())+'</p><h1>Your order journey.</h1><p>Placed '+formatDate(o.date)+' · '+money(o.total)+' · Payment: '+esc(o.payment_method||'')+' ('+esc(formatOrderPaymentStatusLabel(o.payment_status))+')</p></div>'+statusBannerHtml+'<div class="tracking-card"><div class="tracking-steps">'+[['Order placed','Your order is confirmed and being prepared.'],['Packed with care','Our seller is preparing your beauty essentials.'],['On its way','You will receive a delivery update here.'],['Delivered','Enjoy your new favourites.']].map((x,i)=>'<div class="'+(i<=activeStepIdx?'active':'')+'"><span>'+icon(i<=activeStepIdx?'check':'bag',17)+'</span><div><strong>'+x[0]+'</strong><p>'+x[1]+'</p></div></div>').join('')+'</div><div class="tracking-items">'+(packagesHtml || ('<h3>In this order</h3>'+(o.items||[]).map(i=>'<p>'+esc(i.name)+(i.variant_name?' ('+esc(i.variant_name)+')':'')+' × '+i.qty+'</p>').join('')))+'<p style="margin-top:16px;"><strong>Delivery address</strong><br>'+esc(o.address?.text||state.addresses[0]?.text||'')+'</p></div></div></main>';
}

const partnerRoleFromUser = r => ({ seller: 'Product Seller', salon_owner: 'Salon Owner', professional: 'Professional' }[r] || null);

async function loadPartnerData(){
  if (!state.signedIn) return;
  const role = state.partnerRole;
  const userPartnerRole = partnerRoleFromUser(state.user?.role);
  const canQueryRoleApi = state.user?.role === 'admin' || userPartnerRole === role;
  try {
    const baseCalls = [apiGetPartnerDrafts(role)];
    if (canQueryRoleApi) {
      baseCalls.push(apiGetPartnerOverview(role), apiGetPartnerFinancials());
    }
    const baseRes = await Promise.allSettled(baseCalls);
    if(baseRes[0]?.status === 'fulfilled') state.partnerDrafts = baseRes[0].value;
    if(baseRes[1]?.status === 'fulfilled') state.partnerOverview = baseRes[1].value;
    if(baseRes[2]?.status === 'fulfilled') state.partnerFinancials = baseRes[2].value;
    state.partnerLastSynced = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (!canQueryRoleApi) {
      render();
      return;
    }

    if(role === 'Professional'){
      const [proRes, srvRes, bRes] = await Promise.allSettled([
        apiGetProfessionalProfile(),
        apiGetProfessionalServices(),
        apiGetProfessionalBookings()
      ]);
      if(proRes.status === 'fulfilled') state.partnerProProfile = proRes.value;
      if(srvRes.status === 'fulfilled') state.partnerProServices = srvRes.value;
      if(bRes.status === 'fulfilled') state.partnerProBookings = bRes.value;
    } else if(role === 'Salon Owner'){
      const [salRes, staffRes, bRes] = await Promise.allSettled([
        apiGetSalonProfile(),
        apiGetSalonStaff(),
        apiGetSalonBookings()
      ]);
      if(salRes.status === 'fulfilled') state.partnerSalonProfile = salRes.value;
      if(staffRes.status === 'fulfilled') state.partnerSalonStaff = staffRes.value;
      if(bRes.status === 'fulfilled') state.partnerSalonBookings = bRes.value;
    } else if(role === 'Product Seller'){
      const [prodRes, ordRes, listRes, subRes, retRes, mvFinRes] = await Promise.allSettled([
        apiGetSellerProducts(),
        apiGetSellerOrders(),
        apiGetSellerListings(),
        apiGetSellerSuborders(),
        apiGetSellerReturns(),
        apiGetSellerMultiVendorFinancials()
      ]);
      if(prodRes.status === 'fulfilled') state.partnerSellerProducts = prodRes.value;
      if(ordRes.status === 'fulfilled') state.partnerSellerOrders = ordRes.value;
      if(listRes.status === 'fulfilled') state.partnerSellerListings = listRes.value;
      if(subRes.status === 'fulfilled') state.partnerSellerSuborders = subRes.value;
      if(retRes.status === 'fulfilled') state.partnerSellerReturns = retRes.value;
      if(mvFinRes.status === 'fulfilled') state.partnerSellerMVFinancials = mvFinRes.value;
    }
    state.partnerLastSynced = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    render();
  } catch(err) {
    console.warn('[Partner] Live sync notice:', err);
  }
}

function partnerPage(){
  const role = state.partnerRole || 'Professional';
  const roleDisplay = role === 'Professional' ? 'Specialist' : role;
  const tabs = roleSections[role] || ['Overview'];
  const tab = tabs.includes(state.partnerTab) ? state.partnerTab : 'Overview';
  const isRoleMatched = state.user?.role === 'admin' || partnerRoleFromUser(state.user?.role) === role;

  const proBookings = state.partnerProBookings || [];
  const proServices = state.partnerProServices || [];
  const salonBookings = state.partnerSalonBookings || [];
  const salonStaff = state.partnerSalonStaff || [];
  const sellerListings = state.partnerSellerListings || [];
  const sellerProds = state.partnerSellerProducts || [];
  const sellerSuborders = state.partnerSellerSuborders || [];
  const sellerLegacyOrders = state.partnerSellerOrders || [];
  const sellerReturns = state.partnerSellerReturns || [];
  const mvFin = state.partnerSellerMVFinancials;
  const fin = state.partnerFinancials || {};
  const draftsForRole = (state.partnerDrafts || []).filter(d => (d.role || '').toLowerCase() === role.toLowerCase());
  const pendingDraft = draftsForRole.find(d => d.status === 'PENDING');

  const proUpcomingCount = proBookings.filter(b => b.status === 'confirmed').length;
  const salonUpcomingCount = salonBookings.filter(b => b.status === 'confirmed').length;
  const pendingOrdersCount = sellerSuborders.length
    ? sellerSuborders.filter(s => ['placed', 'packed', 'in_transit'].includes(s.status)).length
    : sellerLegacyOrders.filter(o => ['placed', 'packed', 'in_transit'].includes(o.status)).length;
  const openReturnsCount = sellerReturns.filter(r => ['REQUESTED', 'PENDING', 'REFUND_FAILED'].includes(r.status)).length;
  const lowStockCount = sellerListings.filter(l => l.stock <= 5).length + sellerProds.filter(p => p.stock <= 5).length;

  const statusTone = (status) => {
    const s = String(status || '').toLowerCase();
    if(s.includes('cancel') || s.includes('reject') || s.includes('suspend') || s.includes('fail')) return 'rejected';
    if(s.includes('pend') || s.includes('pack') || s.includes('transit') || s.includes('request')) return 'pending';
    if(s.includes('approv') || s.includes('active') || s.includes('complet') || s.includes('deliver') || s.includes('confirm') || s.includes('refunded') || s.includes('matured') || s.includes('settled')) return 'approved';
    return 'info';
  };

  const tabMetaMap = {
    'Overview': { title: roleDisplay + ' Overview', sub: 'At-a-glance metrics, next actions, and studio health.' },
    'Registration': { title: 'Partner Registration', sub: 'Submit credentials and track onboarding verification.' },
    'Salon profile': { title: 'Salon Profile', sub: 'Public studio name, neighbourhood, hours, and gallery image.' },
    'Staff management': { title: 'Staff Management', sub: 'Curate your stylist roster so clients can select their expert.' },
    'Service catalogue': { title: 'Service Catalogue', sub: 'Doorstep & studio rituals synced with customer booking.' },
    'Branches': { title: 'Studio Branches', sub: 'Location details and hours served across GlamGo.' },
    'Appointments': { title: 'Salon Appointments', sub: 'Manage confirmed, completed, and cancelled chair bookings.' },
    'Availability': { title: 'Availability Calendar', sub: 'Toggle active weekly days for 30-minute client slot generation.' },
    'Availability calendar': { title: 'Availability Calendar', sub: 'Toggle active weekly days for 30-minute client slot generation.' },
    'Revenue analytics': { title: 'Revenue Analytics', sub: 'Gross sales, 15% platform curation fee, and net payout ledger.' },
    'Customer reviews': { title: 'Client Reviews', sub: 'Verified post-appointment and post-delivery client feedback.' },
    'Identity verification': { title: 'Identity & Credentials', sub: 'Onboarding compliance and live profile verification status.' },
    'Profile management': { title: 'Specialist Profile', sub: 'Public artist bio, certified specialty, and base ticket.' },
    'Services & pricing': { title: 'Services & Pricing', sub: 'Link or unlink signature treatments to your artist profile.' },
    'Booking requests': { title: 'Booking Requests', sub: 'Active client appointments awaiting completion or updates.' },
    'Upcoming appointments': { title: 'Upcoming Appointments', sub: 'Scheduled doorstep visits requiring specialist attendance.' },
    'Booking history': { title: 'Booking History', sub: 'Completed and cancelled client visits archived for reference.' },
    'Earnings': { title: 'Earnings & Payouts', sub: 'Track gross bookings, 15% fee, and net specialist earnings.' },
    'Marketplace listings': { title: 'Marketplace Listings', sub: 'List verified stock and competitive prices on master SKUs.' },
    'Products': { title: 'Brand Products', sub: 'Create and publish original beauty cosmetics and skincare.' },
    'Inventory & stock': { title: 'Inventory & Stock', sub: 'Real-time SKU stock levels with low-stock alerts at ≤ 5 units.' },
    'Orders & fulfillment': { title: 'Orders & Fulfillment', sub: 'Pack suborders, attach carrier tracking AWB, and confirm delivery.' },
    'Returns & refunds': { title: 'Returns & Refunds', sub: 'Inspect client return requests and orchestrate gateway refunds.' },
    'Escrow & settlement': { title: 'Escrow & Settlement', sub: 'T+7 return-aligned escrow holds, maturity dates, and payouts.' }
  };
  const currentMeta = tabMetaMap[tab] || { title: tab, sub: 'Manage your ' + roleDisplay.toLowerCase() + ' workspace.' };

  const sidebarGroups = role === 'Salon Owner' ? [
    { label: 'Overview', items: [{ id: 'Overview', icon: 'grid', text: 'Salon Overview' }] },
    { label: 'Operations', items: [
      { id: 'Appointments', icon: 'calendar', text: 'Appointments', count: salonBookings.length, alert: salonUpcomingCount },
      { id: 'Availability', icon: 'clock', text: 'Availability' },
      { id: 'Staff management', icon: 'user', text: 'Staff Roster', count: salonStaff.length }
    ]},
    { label: 'Studio', items: [
      { id: 'Salon profile', icon: 'spark', text: 'Salon Profile' },
      { id: 'Service catalogue', icon: 'scissors', text: 'Service Catalogue', count: services.length },
      { id: 'Branches', icon: 'pin', text: 'Branches' }
    ]},
    { label: 'Business', items: [
      { id: 'Revenue analytics', icon: 'star', text: 'Revenue & Ledger' },
      { id: 'Customer reviews', icon: 'heart', text: 'Reviews', count: (state.reviews || []).length },
      { id: 'Registration', icon: 'shield', text: 'Registration', alert: pendingDraft ? 1 : 0 }
    ]}
  ] : role === 'Product Seller' ? [
    { label: 'Overview', items: [{ id: 'Overview', icon: 'grid', text: 'Seller Overview' }] },
    { label: 'Commerce', items: [
      { id: 'Orders & fulfillment', icon: 'bag', text: 'Orders & Packing', count: sellerSuborders.length || sellerLegacyOrders.length, alert: pendingOrdersCount },
      { id: 'Returns & refunds', icon: 'shield', text: 'Returns & Refunds', count: sellerReturns.length, alert: openReturnsCount },
      { id: 'Inventory & stock', icon: 'truck', text: 'Inventory Alerts', count: sellerListings.length + sellerProds.length, alert: lowStockCount }
    ]},
    { label: 'Catalog', items: [
      { id: 'Marketplace listings', icon: 'spark', text: 'Marketplace Listings', count: sellerListings.length },
      { id: 'Products', icon: 'plus', text: 'Brand Products', count: sellerProds.length }
    ]},
    { label: 'Finance & Trust', items: [
      { id: 'Escrow & settlement', icon: 'check', text: 'Escrow & T+7 Payouts' },
      { id: 'Registration', icon: 'user', text: 'Registration', alert: pendingDraft ? 1 : 0 }
    ]}
  ] : [
    { label: 'Overview', items: [{ id: 'Overview', icon: 'grid', text: 'Specialist Overview' }] },
    { label: 'Schedule', items: [
      { id: 'Upcoming appointments', icon: 'calendar', text: 'Upcoming Visits', count: proUpcomingCount, alert: proUpcomingCount },
      { id: 'Booking requests', icon: 'clock', text: 'Booking Requests', count: proBookings.length },
      { id: 'Booking history', icon: 'check', text: 'Booking History', count: proBookings.filter(b => b.status !== 'confirmed').length },
      { id: 'Availability calendar', icon: 'spark', text: 'Weekly Availability' }
    ]},
    { label: 'Practice', items: [
      { id: 'Profile management', icon: 'user', text: 'Artist Profile' },
      { id: 'Services & pricing', icon: 'scissors', text: 'Services & Pricing', count: proServices.length }
    ]},
    { label: 'Business & Trust', items: [
      { id: 'Earnings', icon: 'star', text: 'Earnings & Ledger' },
      { id: 'Customer reviews', icon: 'heart', text: 'Client Reviews', count: (state.reviews || []).length },
      { id: 'Identity verification', icon: 'shield', text: 'Credentials' },
      { id: 'Registration', icon: 'plus', text: 'Registration', alert: pendingDraft ? 1 : 0 }
    ]}
  ];

  const renderNavBtn = (item) =>
    '<button type="button" class="partner-nav-btn ' + (tab === item.id ? 'active' : '') + '" data-action="partner-tab" data-id="' + esc(item.id) + '">' +
      icon(item.icon || 'grid', 15) +
      '<span class="partner-nav-label">' + esc(item.text) + '</span>' +
      (item.alert > 0
        ? '<span class="partner-nav-badge">' + item.alert + '</span>'
        : (typeof item.count === 'number' ? '<span class="partner-nav-count">' + item.count + '</span>' : '')) +
    '</button>';

  const roleDesc = role === 'Product Seller'
    ? 'Manage multi-vendor SKUs, stock thresholds, independent suborder shipping, and T+7 escrow payouts.'
    : role === 'Salon Owner'
      ? 'Oversee studio profile details, stylist roster, active appointments, and studio revenue.'
      : 'Manage doorstep treatments, weekly calendar availability, client bookings, and earnings.';

  const kpiCards = role === 'Product Seller' ? [
    { label: 'Held in Escrow', val: money(mvFin?.funds_in_escrow ?? 0), sub: 'T+7 return protection period', tag: 'Escrow', featured: true },
    { label: 'Matured Payout', val: money(mvFin?.matured_balance_available ?? fin.net_earnings ?? 0), sub: 'Eligible for disbursement', tag: 'Cleared' },
    { label: 'Active Orders', val: sellerSuborders.length || sellerLegacyOrders.length, sub: pendingOrdersCount + ' awaiting fulfillment', tag: 'Commerce' },
    { label: 'Catalog SKUs', val: sellerListings.length + sellerProds.length, sub: lowStockCount + ' low-stock items (≤5)', tag: 'Inventory' }
  ] : role === 'Salon Owner' ? [
    { label: 'Net Studio Revenue', val: money(fin.net_earnings || 0), sub: 'After 15% platform curation', tag: 'Revenue', featured: true },
    { label: 'Appointments', val: salonBookings.length, sub: salonUpcomingCount + ' upcoming confirmed', tag: 'Calendar' },
    { label: 'Active Stylists', val: salonStaff.length, sub: 'Assigned to ' + esc(state.partnerSalonProfile?.name || 'Studio'), tag: 'Roster' },
    { label: 'Open Days / Wk', val: (state.availability || []).length + ' / 7', sub: esc(state.partnerSalonProfile?.hours || '10:00 AM - 8:00 PM'), tag: 'Schedule' }
  ] : [
    { label: 'Net Specialist Earnings', val: money(fin.net_earnings || 0), sub: 'Gross: ' + money(fin.gross_sales || 0), tag: 'Payouts', featured: true },
    { label: 'Upcoming Visits', val: proUpcomingCount, sub: proBookings.length + ' total recorded bookings', tag: 'Schedule' },
    { label: 'Linked Treatments', val: proServices.length, sub: 'Synced to artist booking card', tag: 'Catalog' },
    { label: 'Available Days', val: (state.availability || []).length + ' / 7', sub: '30-min intervals · 9AM–7PM', tag: 'Calendar' }
  ];

  let body = '';

  if(tab === 'Overview'){
    const previewBookings = role === 'Salon Owner' ? salonBookings : proBookings;
    const confirmedBookings = previewBookings.filter(b => b.status === 'confirmed').slice(0, 4);
    const activeOrders = (sellerSuborders.length ? sellerSuborders : sellerLegacyOrders).slice(0, 4);

    let leftPanel = '';
    let rightPanel = '';

    if(role === 'Product Seller'){
      leftPanel = '<div class="dashboard-panel">' +
        '<div class="account-heading">' +
          '<div><h3>Recent Suborders</h3><p class="partner-panel-sub">Next shipments requiring packing or tracking updates.</p></div>' +
          '<button type="button" class="btn btn-outline btn-sm" data-action="partner-tab" data-id="Orders & fulfillment">Manage all</button>' +
        '</div>' +
        (activeOrders.length ? '<div class="partner-feed">' + activeOrders.map(s => {
          const sid = s.suborder_id || s.id;
          return '<div class="dash-row">' +
            '<div><strong>#' + esc(sid) + '</strong><small>' + esc(s.created_at?.slice(0, 10) || s.date || 'Recent') + ' · ' + money(s.subtotal ?? s.total ?? 0) + ' · ' + esc(s.payment_status || 'pending') + '</small></div>' +
            '<span class="badge badge-' + statusTone(s.status) + '">' + esc(s.status || 'placed') + '</span>' +
          '</div>';
        }).join('') + '</div>' : empty('bag', 'No active orders yet', 'New customer orders for your brand products or marketplace offers will appear here.')) +
      '</div>';

      const lowItems = [
        ...sellerListings.filter(l => l.stock <= 5).map(l => ({ title: l.product_name || ('Product #' + l.product_id), meta: 'SKU: ' + l.sku, stock: l.stock })),
        ...sellerProds.filter(p => p.stock <= 5).map(p => ({ title: p.name, meta: p.brand, stock: p.stock }))
      ].slice(0, 4);

      rightPanel = '<div class="dashboard-panel">' +
        '<div class="account-heading">' +
          '<div><h3>Stock & Quick Actions</h3><p class="partner-panel-sub">' + (lowItems.length ? lowItems.length + ' items at 5 units or below' : 'All inventory levels look healthy') + '</p></div>' +
          '<button type="button" class="btn btn-outline btn-sm" data-action="partner-tab" data-id="Inventory & stock">Open stock</button>' +
        '</div>' +
        (lowItems.length ? '<div class="partner-feed" style="margin-bottom:14px">' + lowItems.map(x =>
          '<div class="dash-row"><div><strong>' + esc(x.title) + '</strong><small>' + esc(x.meta) + '</small></div><span class="badge badge-warning">' + x.stock + ' left</span></div>'
        ).join('') + '</div>' : '') +
        '<div class="dashboard-actions">' +
          '<button type="button" data-action="partner-tab" data-id="Marketplace listings">Add marketplace offer ' + icon('arrow', 15) + '</button>' +
          '<button type="button" data-action="partner-tab" data-id="Products">Publish new product ' + icon('arrow', 15) + '</button>' +
          '<button type="button" data-action="partner-tab" data-id="Returns & refunds">Inspect returns (' + openReturnsCount + ') ' + icon('arrow', 15) + '</button>' +
          '<button type="button" data-action="partner-tab" data-id="Escrow & settlement">Escrow ledger ' + icon('arrow', 15) + '</button>' +
        '</div>' +
      '</div>';
    } else if(role === 'Salon Owner'){
      leftPanel = '<div class="dashboard-panel">' +
        '<div class="account-heading">' +
          '<div><h3>Upcoming Appointments</h3><p class="partner-panel-sub">Confirmed studio bookings needing completion or updates.</p></div>' +
          '<button type="button" class="btn btn-outline btn-sm" data-action="partner-tab" data-id="Appointments">All bookings</button>' +
        '</div>' +
        (confirmedBookings.length ? '<div class="partner-feed">' + confirmedBookings.map(b =>
          '<div class="dash-row">' +
            '<div><strong>' + esc(b.title) + '</strong><small>' + formatDate(b.date) + ' · ' + esc(b.time) + ' · ' + esc(b.customer_name || 'Client') + ' · ' + money(b.price) + '</small></div>' +
            '<div class="admin-actions"><button type="button" class="btn btn-success btn-sm" data-action="partner-salon-complete" data-id="' + b.id + '">Complete</button><button type="button" class="btn btn-danger btn-sm" data-action="partner-salon-cancel" data-id="' + b.id + '">Cancel</button></div>' +
          '</div>'
        ).join('') + '</div>' : empty('calendar', 'No upcoming appointments', 'Confirmed client bookings at your salon will appear here.')) +
      '</div>';

      rightPanel = '<div class="dashboard-panel">' +
        '<div class="account-heading">' +
          '<div><h3>Studio Team & Controls</h3><p class="partner-panel-sub">' + (salonStaff.length ? salonStaff.length + ' active stylists in roster' : 'Add stylists to showcase specialists to clients') + '</p></div>' +
          '<button type="button" class="btn btn-outline btn-sm" data-action="partner-tab" data-id="Staff management">Manage roster</button>' +
        '</div>' +
        (salonStaff.length ? '<div class="partner-feed" style="margin-bottom:14px">' + salonStaff.slice(0, 3).map(st =>
          '<div class="dash-row"><div><strong>' + esc(st.name) + '</strong><small>' + esc(st.specialty) + '</small></div><span class="badge badge-active">Active</span></div>'
        ).join('') + '</div>' : '') +
        '<div class="dashboard-actions">' +
          '<button type="button" data-action="partner-tab" data-id="Salon profile">Edit studio profile ' + icon('arrow', 15) + '</button>' +
          '<button type="button" data-action="partner-tab" data-id="Availability">Weekly hours & days ' + icon('arrow', 15) + '</button>' +
          '<button type="button" data-action="partner-tab" data-id="Revenue analytics">Settlement ledger ' + icon('arrow', 15) + '</button>' +
          '<button type="button" data-action="partner-tab" data-id="Customer reviews">Client reviews ' + icon('arrow', 15) + '</button>' +
        '</div>' +
      '</div>';
    } else {
      leftPanel = '<div class="dashboard-panel">' +
        '<div class="account-heading">' +
          '<div><h3>Next Doorstep Visits</h3><p class="partner-panel-sub">Confirmed client appointments assigned to you.</p></div>' +
          '<button type="button" class="btn btn-outline btn-sm" data-action="partner-tab" data-id="Upcoming appointments">Full schedule</button>' +
        '</div>' +
        (confirmedBookings.length ? '<div class="partner-feed">' + confirmedBookings.map(b =>
          '<div class="dash-row">' +
            '<div><strong>' + esc(b.title) + '</strong><small>' + formatDate(b.date) + ' · ' + esc(b.time) + ' · ' + esc(b.customer_name || 'Client') + ' · ' + money(b.price) + '</small></div>' +
            '<div class="admin-actions"><button type="button" class="btn btn-success btn-sm" data-action="partner-pro-complete" data-id="' + b.id + '">Complete</button><button type="button" class="btn btn-danger btn-sm" data-action="partner-pro-cancel" data-id="' + b.id + '">Cancel</button></div>' +
          '</div>'
        ).join('') + '</div>' : empty('calendar', 'No upcoming visits', 'Confirmed doorstep treatment bookings will appear here.')) +
      '</div>';

      rightPanel = '<div class="dashboard-panel">' +
        '<div class="account-heading">' +
          '<div><h3>Weekly Availability & Setup</h3><p class="partner-panel-sub">Tap days to toggle live booking slots.</p></div>' +
          '<button type="button" class="btn btn-outline btn-sm" data-action="partner-tab" data-id="Availability calendar">Calendar view</button>' +
        '</div>' +
        '<div class="availability-grid partner-avail-mini">' +
          ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => '<button type="button" data-action="availability" data-id="' + day + '" class="' + (state.availability.includes(day) ? 'active' : '') + '"><strong>' + day + '</strong><span>' + (state.availability.includes(day) ? 'Open' : 'Off') + '</span></button>').join('') +
        '</div>' +
        '<div class="dashboard-actions">' +
          '<button type="button" data-action="partner-tab" data-id="Profile management">Edit artist profile ' + icon('arrow', 15) + '</button>' +
          '<button type="button" data-action="partner-tab" data-id="Services & pricing">Services & pricing ' + icon('arrow', 15) + '</button>' +
          '<button type="button" data-action="partner-tab" data-id="Earnings">View earnings ' + icon('arrow', 15) + '</button>' +
          '<button type="button" data-action="partner-tab" data-id="Identity verification">Credentials & status ' + icon('arrow', 15) + '</button>' +
        '</div>' +
      '</div>';
    }

    body = (!isRoleMatched ? '<div class="payment-notice payment-notice-warn" style="margin-bottom:18px"><strong>Partner Application Required</strong><p>You are viewing the ' + esc(roleDisplay) + ' workspace while signed in as <strong>' + esc(state.user?.role || 'guest') + '</strong>. Submit an application in Registration to activate live role write permissions.</p></div>' : '') +
      '<section class="admin-kpi-grid" aria-label="Role metrics">' +
        kpiCards.map(k => '<div class="admin-kpi-card ' + (k.featured ? 'admin-kpi-featured' : '') + '">' +
          '<div class="admin-kpi-top"><span>' + esc(k.label) + '</span><span class="admin-kpi-tag">' + esc(k.tag) + '</span></div>' +
          '<strong class="admin-num">' + k.val + '</strong>' +
          '<small>' + esc(k.sub) + '</small>' +
        '</div>').join('') +
      '</section>' +
      '<div class="partner-split-grid">' + leftPanel + rightPanel + '</div>';

  } else if(tab.toLowerCase().includes('registration') || tab === 'Partner application'){
    body = '<div class="dashboard-panel">' +
      '<div class="account-heading">' +
        '<div>' +
          '<h3>Partner Application & Onboarding</h3>' +
          '<p class="partner-panel-sub">Apply to join GlamGo as a verified ' + esc(roleDisplay) + '. Applications undergo credential review by platform administrators.</p>' +
        '</div>' +
      '</div>' +
      (pendingDraft ?
        '<div class="partner-callout">' +
          '<span class="badge badge-pending">APPLICATION UNDER REVIEW</span>' +
          '<h4>' + esc(pendingDraft.name) + '</h4>' +
          '<p>' + esc(pendingDraft.description) + '</p>' +
          '<small>Submitted on ' + new Date(pendingDraft.created_at).toLocaleDateString() + ' · Reference #' + pendingDraft.id + '</small>' +
        '</div>' :
        '<form id="partner-apply-form" class="form-grid" style="margin-top:18px">' +
          '<label>Business or professional name<input name="name" required placeholder="e.g. Maison Atelier" value="' + esc(state.user?.name || '') + '"></label>' +
          '<label>Direct contact number<input name="phone" required placeholder="+91 98765 43210" value="' + esc(state.user?.phone || '') + '"></label>' +
          '<label>Operating city<input name="city" required placeholder="Mumbai, Bengaluru, Delhi" value="Mumbai"></label>' +
          '<label>Base service price / Expected ticket (₹)<input name="price" type="number" required placeholder="1500" value="1500"></label>' +
          '<label style="grid-column:1/-1">Professional bio & business description<textarea name="description" required rows="3" placeholder="Describe your experience, luxury training, and specialties..."></textarea></label>' +
          '<label style="grid-column:1/-1">Certifications & ID proof URLs (comma-separated)<input name="documents" placeholder="https://example.com/certificate.pdf, https://example.com/license.pdf"></label>' +
          '<label style="grid-column:1/-1">Portfolio / Studio lookbook URLs (comma-separated)<input name="portfolio" placeholder="https://instagram.com/atelier, https://portfolio.com"></label>' +
          '<button class="btn btn-primary" type="submit" style="grid-column:1/-1">Submit Application for Review ' + icon('arrow', 17) + '</button>' +
        '</form>') +
      (draftsForRole.length ?
        '<div class="partner-subpanel">' +
          '<h4>Application History</h4>' +
          draftsForRole.map(d => '<div class="dash-row"><div><strong>#' + d.id + ' · ' + esc(d.name) + '</strong><small>' + money(d.price) + ' · Submitted ' + new Date(d.created_at).toLocaleDateString() + '</small></div><span class="badge badge-' + statusTone(d.status) + '">' + esc(d.status) + '</span></div>').join('') +
        '</div>' : '') +
    '</div>';

  } else if(tab === 'Identity verification'){
    const pro = state.partnerProProfile || {};
    body = '<div class="dashboard-panel">' +
      '<div class="account-heading">' +
        '<div><h3>Identity & Practice Credentials</h3><p class="partner-panel-sub">Verification status for your GlamGo Specialist account.</p></div>' +
        '<span class="badge badge-' + (isRoleMatched ? 'approved' : 'pending') + '">' + (isRoleMatched ? 'ROLE ACTIVE' : 'VERIFICATION REQUIRED') + '</span>' +
      '</div>' +
      '<div class="verification-list">' +
        '<div>' + icon(state.signedIn ? 'check' : 'shield', 18) + '<span><strong>Account Identity:</strong> ' + esc(state.user?.name || 'Guest') + ' (' + esc(state.user?.email || 'Not signed in') + ')</span></div>' +
        '<div>' + icon(pro.specialty ? 'check' : 'clock', 18) + '<span><strong>Specialist Profile:</strong> ' + (pro.name ? esc(pro.name) + ' · ' + esc(pro.specialty || 'Specialist') : 'Complete your artist bio & image under Artist Profile.') + '</span></div>' +
        '<div>' + icon(draftsForRole.length ? 'check' : 'shield', 18) + '<span><strong>Submitted Onboarding Records:</strong> ' + draftsForRole.length + ' application(s) on file.</span></div>' +
      '</div>' +
      '<div class="dashboard-actions">' +
        '<button type="button" data-action="partner-tab" data-id="Profile management">Update artist profile ' + icon('arrow', 15) + '</button>' +
        '<button type="button" data-action="partner-tab" data-id="Registration">View / submit application ' + icon('arrow', 15) + '</button>' +
      '</div>' +
    '</div>';

  } else if(tab === 'Profile management'){
    const pro = state.partnerProProfile || {};
    body = '<div class="dashboard-panel">' +
      '<h3>Specialist Profile & Portfolio</h3>' +
      '<p class="partner-panel-sub">Keep your editorial bio, base pricing, and certified specialty current for client booking.</p>' +
      '<form id="partner-pro-profile-form" class="form-grid" style="margin-top:18px">' +
        '<label>Display name<input name="name" required value="' + esc(pro.name || state.user?.name || '') + '"></label>' +
        '<label>Specialty<input name="specialty" required placeholder="e.g. Bridal & Editorial Hair Specialist" value="' + esc(pro.specialty || 'Specialist') + '"></label>' +
        '<label>Experience level<input name="experience" required placeholder="e.g. 8 years luxury salon experience" value="' + esc(pro.experience || 'Certified Specialist') + '"></label>' +
        '<label>Base appointment price (₹)<input name="price" type="number" required value="' + (pro.price || 1500) + '"></label>' +
        '<label style="grid-column:1/-1">Portfolio image URL<input name="img" required value="' + esc(pro.img || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500') + '"></label>' +
        '<button class="btn btn-primary" type="submit" style="grid-column:1/-1">Save Profile Updates ' + icon('arrow', 17) + '</button>' +
      '</form>' +
    '</div>';

  } else if(tab === 'Salon profile'){
    const sal = state.partnerSalonProfile || {};
    body = '<div class="dashboard-panel">' +
      '<h3>Salon Studio Profile</h3>' +
      '<p class="partner-panel-sub">Manage your studio name, locality, operating hours, and cover photography.</p>' +
      '<form id="partner-salon-profile-form" class="form-grid" style="margin-top:18px">' +
        '<label>Studio name<input name="name" required value="' + esc(sal.name || '') + '"></label>' +
        '<label>Area / Locality<input name="area" required value="' + esc(sal.area || 'Bandra West') + '"></label>' +
        '<label>Operating hours<input name="hours" required placeholder="10:00 AM - 8:00 PM" value="' + esc(sal.hours || '10:00 AM - 8:00 PM') + '"></label>' +
        '<label>Base service ticket (₹)<input name="price" type="number" required value="' + (sal.price || 2000) + '"></label>' +
        '<label style="grid-column:1/-1">Studio exterior / Interior image URL<input name="img" required value="' + esc(sal.img || '') + '"></label>' +
        '<label style="grid-column:1/-1">About the studio<textarea name="about" required rows="3">' + esc(sal.about || '') + '</textarea></label>' +
        '<button class="btn btn-primary" type="submit" style="grid-column:1/-1">Save Studio Updates ' + icon('arrow', 17) + '</button>' +
      '</form>' +
    '</div>';

  } else if(tab === 'Branches'){
    const sal = state.partnerSalonProfile || {};
    body = '<div class="dashboard-panel">' +
      '<div class="account-heading">' +
        '<div><h3>Studio Flagship Location</h3><p class="partner-panel-sub">Primary salon address and service hours currently published to customers.</p></div>' +
        '<button type="button" class="btn btn-outline btn-sm" data-action="partner-tab" data-id="Salon profile">Edit location</button>' +
      '</div>' +
      '<div class="partner-callout">' +
        '<span class="badge badge-approved">PRIMARY BRANCH ACTIVE</span>' +
        '<h4>' + esc(sal.name || 'Your GlamGo Flagship Salon') + '</h4>' +
        '<p><strong>Locality:</strong> ' + esc(sal.area || 'Bandra West') + ' · <strong>Hours:</strong> ' + esc(sal.hours || '10:00 AM - 8:00 PM') + ' · <strong>Starting Ticket:</strong> ' + money(sal.price || 2000) + '</p>' +
        '<small>Note: Multi-branch location management is scheduled for a future platform update; your studio profile currently manages your flagship location.</small>' +
      '</div>' +
    '</div>';

  } else if(tab === 'Staff management'){
    body = '<div class="dashboard-panel">' +
      '<div class="account-heading">' +
        '<div><h3>Salon Staff & Stylist Roster</h3><p class="partner-panel-sub">Add stylists, therapists, and specialists clients can book.</p></div>' +
        '<span class="admin-metric-pill">' + salonStaff.length + ' Stylists</span>' +
      '</div>' +
      '<form id="partner-staff-add-form" class="form-grid partner-form-card">' +
        '<label>Stylist name<input name="name" required placeholder="Stylist full name"></label>' +
        '<label>Specialty<input name="specialty" required placeholder="e.g. Master Colorist, Skin Therapist"></label>' +
        '<label style="grid-column:1/-1">Avatar image URL<input name="img" placeholder="https://images.unsplash.com/..."></label>' +
        '<button class="btn btn-outline" type="submit" style="grid-column:1/-1">+ Add Stylist to Salon</button>' +
      '</form>' +
      (salonStaff.length ? '<div class="partner-feed">' + salonStaff.map(st =>
        '<div class="dash-row"><div><strong>' + esc(st.name) + '</strong><small>' + esc(st.specialty) + '</small></div><button type="button" class="btn btn-danger btn-sm" data-action="partner-staff-delete" data-id="' + st.id + '">Remove</button></div>'
      ).join('') + '</div>' : empty('user', 'No staff assigned yet', 'Add your stylists and specialists above to let clients select their preferred expert.')) +
    '</div>';

  } else if(tab === 'Service catalogue'){
    const q = (state.partnerCatalogSearch || '').toLowerCase().trim();
    const sList = q ? services.filter(s => (s.name || '').toLowerCase().includes(q) || (s.category || '').toLowerCase().includes(q)) : services;
    body = '<div class="dashboard-panel">' +
      '<div class="account-heading">' +
        '<div><h3>Master Service Catalogue</h3><p class="partner-panel-sub">Platform treatments curated across GlamGo doorstep and salon verticals.</p></div>' +
        '<span class="admin-metric-pill">' + services.length + ' Services</span>' +
      '</div>' +
      '<div class="admin-toolbar">' +
        '<div class="admin-search-box admin-search-wide">' +
          '<input id="partner-catalog-search" value="' + esc(state.partnerCatalogSearch || '') + '" placeholder="Search services or category…" autocomplete="off">' +
          '<span class="admin-result-count">' + sList.length + ' shown</span>' +
        '</div>' +
      '</div>' +
      (sList.length ? '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Treatment</th><th>Category</th><th>Duration</th><th>Reference Price</th><th>Rating</th></tr></thead><tbody>' +
        sList.map(s => '<tr>' +
          '<td><strong>' + esc(s.name) + '</strong></td>' +
          '<td><span class="badge badge-info">' + esc(s.category) + '</span></td>' +
          '<td>' + esc(s.duration) + '</td>' +
          '<td class="admin-num"><strong>' + money(s.price) + '</strong></td>' +
          '<td class="admin-num">' + s.rating + ' ★ <small class="admin-muted">(' + s.reviews + ')</small></td>' +
        '</tr>').join('') +
      '</tbody></table></div>' : '<div class="admin-empty-inline">No services match your search.</div>') +
    '</div>';

  } else if(tab.toLowerCase().includes('service')){
    body = '<div class="dashboard-panel">' +
      '<div class="account-heading">' +
        '<div><h3>Offered Services & Treatment Menu</h3><p class="partner-panel-sub">Link master treatments to your specialist profile so clients can book them.</p></div>' +
        '<span class="admin-metric-pill">' + proServices.length + ' Linked</span>' +
      '</div>' +
      '<div class="partner-inline-bar">' +
        '<select id="partner-service-select" class="admin-role-select" style="flex:1;height:40px">' +
          services.map(s => '<option value="' + s.id + '">' + esc(s.name) + ' (' + esc(s.category) + ') — ' + money(s.price) + '</option>').join('') +
        '</select>' +
        '<button type="button" class="btn btn-primary btn-sm" data-action="partner-pro-assign-service">Assign Service</button>' +
      '</div>' +
      (proServices.length ? '<div class="partner-feed">' + proServices.map(s =>
        '<div class="dash-row"><div><strong>' + esc(s.name) + ' (' + esc(s.category) + ')</strong><small>' + esc(s.duration) + ' · ' + money(s.price) + '</small></div><button type="button" class="btn btn-danger btn-sm" data-action="partner-pro-unlink-service" data-id="' + s.id + '">Unlink</button></div>'
      ).join('') + '</div>' : empty('scissors', 'No services linked yet', 'Choose a treatment from the catalog selector above to add it to your menu.')) +
    '</div>';

  } else if(tab === 'Availability calendar' || tab === 'Availability'){
    body = '<div class="dashboard-panel">' +
      '<h3>Weekly Working Days</h3>' +
      '<p class="partner-panel-sub">Select the days you accept client appointments. Changes sync live with customer slot pickers.</p>' +
      '<div class="availability-grid" style="margin-top:20px">' +
        ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => '<button type="button" data-action="availability" data-id="' + day + '" class="' + (state.availability.includes(day) ? 'active' : '') + '"><strong>' + day + '</strong><span>' + (state.availability.includes(day) ? 'Available' : 'Unavailable') + '</span></button>').join('') +
      '</div>' +
      '<p class="dashboard-note">Appointment intervals run in 30-minute blocks between 09:00 AM and 07:00 PM.</p>' +
    '</div>';

  } else if(tab.toLowerCase().includes('booking') || tab.toLowerCase().includes('appointment')){
    const rawList = role === 'Professional' ? proBookings : salonBookings;
    const defaultStatusFilter = tab === 'Upcoming appointments' ? 'confirmed' : (tab === 'Booking history' ? 'history' : 'ALL');
    const filter = state.partnerBookingFilter || 'ALL';
    const effectiveFilter = (filter === 'ALL' && defaultStatusFilter !== 'ALL') ? defaultStatusFilter : filter;
    const q = (state.partnerBookingSearch || '').toLowerCase().trim();

    let bList = rawList;
    if(effectiveFilter === 'confirmed') bList = bList.filter(b => b.status === 'confirmed');
    else if(effectiveFilter === 'completed') bList = bList.filter(b => b.status === 'completed');
    else if(effectiveFilter === 'cancelled') bList = bList.filter(b => b.status === 'cancelled');
    else if(effectiveFilter === 'history') bList = bList.filter(b => b.status !== 'confirmed');
    if(q) bList = bList.filter(b =>
      String(b.id).includes(q) ||
      (b.title || '').toLowerCase().includes(q) ||
      (b.customer_name || '').toLowerCase().includes(q) ||
      (b.location || '').toLowerCase().includes(q)
    );

    const completeAct = role === 'Professional' ? 'partner-pro-complete' : 'partner-salon-complete';
    const cancelAct = role === 'Professional' ? 'partner-pro-cancel' : 'partner-salon-cancel';

    body = '<div class="dashboard-panel">' +
      '<div class="admin-toolbar">' +
        '<div class="admin-pill-group">' +
          [['ALL','All'], ['confirmed','Upcoming'], ['completed','Completed'], ['cancelled','Cancelled']].map(([val, lbl]) =>
            '<button type="button" class="admin-pill ' + (effectiveFilter === val ? 'active' : '') + '" data-action="partner-booking-filter" data-id="' + val + '">' + lbl + '</button>'
          ).join('') +
        '</div>' +
        '<div class="admin-search-box">' +
          '<input id="partner-booking-search" value="' + esc(state.partnerBookingSearch || '') + '" placeholder="Search service, client, or location…" autocomplete="off">' +
          '<span class="admin-result-count">' + bList.length + ' shown</span>' +
        '</div>' +
      '</div>' +
      (bList.length ? '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>ID</th><th>Treatment</th><th>Client</th><th>Date & Time</th><th>Location</th><th>Price</th><th>Status</th><th>Action</th></tr></thead><tbody>' +
        bList.map(b => '<tr>' +
          '<td class="admin-num admin-muted">#' + b.id + '</td>' +
          '<td><strong>' + esc(b.title) + '</strong></td>' +
          '<td>' + esc(b.customer_name || 'Client') + '</td>' +
          '<td class="admin-num">' + formatDate(b.date) + ' · ' + esc(b.time) + '</td>' +
          '<td><small>' + esc(b.location) + '</small></td>' +
          '<td class="admin-num"><strong>' + money(b.price) + '</strong></td>' +
          '<td><span class="badge badge-' + statusTone(b.status) + '">' + esc(b.status) + '</span></td>' +
          '<td>' + (b.status === 'confirmed'
            ? '<div class="admin-actions"><button type="button" class="btn btn-success btn-sm" data-action="' + completeAct + '" data-id="' + b.id + '">Complete</button><button type="button" class="btn btn-danger btn-sm" data-action="' + cancelAct + '" data-id="' + b.id + '">Cancel</button></div>'
            : '<span class="admin-muted">—</span>') + '</td>' +
        '</tr>').join('') +
      '</tbody></table></div>' : empty('calendar', 'No appointments match this filter', 'New client bookings or other status views will appear here.')) +
    '</div>';

  } else if(tab === 'Marketplace listings' || tab === 'Marketplace Listings'){
    body = '<div class="dashboard-panel">' +
      '<div class="account-heading">' +
        '<div><h3>Multi-Vendor Marketplace Listings</h3><p class="partner-panel-sub">Attach offers to shared master catalog SKUs with your price and dedicated inventory.</p></div>' +
        '<span class="admin-metric-pill">' + sellerListings.length + ' Listings</span>' +
      '</div>' +
      '<form id="partner-seller-listing-form" class="form-grid partner-form-card">' +
        '<label>Master Product' +
          '<select name="product_id" required class="admin-role-select" style="width:100%;height:42px">' +
            products.map(p => '<option value="' + p.id + '">' + esc(p.name) + ' (' + esc(p.brand) + ') — Ref ₹' + p.price + '</option>').join('') +
          '</select>' +
        '</label>' +
        '<label>Merchant SKU<input name="sku" required placeholder="e.g. LUX-SERUM-001"></label>' +
        '<label>Your Offer Price (₹)<input name="price" type="number" step="0.01" required placeholder="2650" value="2650"></label>' +
        '<label>Allocated Stock<input name="stock" type="number" required placeholder="50" value="50"></label>' +
        '<label>Min Order Qty<input name="min_order_qty" type="number" required placeholder="1" value="1"></label>' +
        '<button class="btn btn-primary" type="submit" style="grid-column:1/-1">+ Create Marketplace Listing</button>' +
      '</form>' +
      (sellerListings.length ? '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Product & SKU</th><th>Offer Price</th><th>Available Stock</th><th>Moderation</th><th>Active</th><th>Actions</th></tr></thead><tbody>' +
        sellerListings.map(l => '<tr>' +
          '<td><strong>' + esc(l.product_name || l.product_id) + '</strong><br><small class="admin-muted">SKU: ' + esc(l.sku) + '</small></td>' +
          '<td><input type="number" id="listing-price-' + l.id + '" value="' + l.price + '" class="partner-compact-input"></td>' +
          '<td><input type="number" id="listing-stock-' + l.id + '" value="' + l.stock + '" class="partner-compact-input partner-compact-sm"></td>' +
          '<td><span class="badge badge-' + statusTone(l.moderation_status) + '">' + esc(l.moderation_status) + '</span></td>' +
          '<td><span class="badge badge-' + (l.is_active ? 'active' : 'suspended') + '">' + (l.is_active ? 'ACTIVE' : 'INACTIVE') + '</span></td>' +
          '<td><button type="button" class="btn btn-outline btn-sm" data-action="partner-listing-update" data-id="' + l.id + '">Save</button></td>' +
        '</tr>').join('') +
      '</tbody></table></div>' : empty('bag', 'No marketplace listings yet', 'Create an offer on any master product above to start selling.')) +
    '</div>';

  } else if(tab === 'Products'){
    body = '<div class="dashboard-panel">' +
      '<div class="account-heading">' +
        '<div><h3>Brand Product Catalog</h3><p class="partner-panel-sub">Create and manage original beauty cosmetics, skincare, and haircare items.</p></div>' +
        '<span class="admin-metric-pill">' + sellerProds.length + ' Products</span>' +
      '</div>' +
      '<form id="partner-seller-product-form" class="form-grid partner-form-card">' +
        '<label>Brand name<input name="brand" required placeholder="e.g. Maison GlamGo"></label>' +
        '<label>Product title<input name="name" required placeholder="e.g. Botanical Facial Oil"></label>' +
        '<label>Category<input name="category" required placeholder="Skincare, Haircare, Cosmetics" value="Skincare"></label>' +
        '<label>Retail price (₹)<input name="price" type="number" required placeholder="2400" value="2400"></label>' +
        '<label>Initial stock<input name="stock" type="number" required placeholder="50" value="50"></label>' +
        '<label>Tag (optional)<input name="tag" placeholder="Bestseller, Organic"></label>' +
        '<label style="grid-column:1/-1">Product image URL<input name="img" required value="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500"></label>' +
        '<label style="grid-column:1/-1">Description<textarea name="description" required rows="2" placeholder="Cold-pressed organic ingredients..."></textarea></label>' +
        '<button class="btn btn-primary" type="submit" style="grid-column:1/-1">+ Create & List Product</button>' +
      '</form>' +
      (sellerProds.length ? '<div class="partner-feed">' + sellerProds.map(p =>
        '<div class="dash-row"><div><strong>' + esc(p.name) + '</strong><small>' + esc(p.brand) + ' · ' + esc(p.category) + ' · ' + money(p.price) + '</small></div><span class="badge badge-' + (p.stock <= 5 ? 'warning' : 'approved') + '">' + p.stock + ' in stock</span></div>'
      ).join('') + '</div>' : empty('bag', 'No brand products yet', 'Publish your first direct product using the form above.')) +
    '</div>';

  } else if(tab === 'Inventory' || tab === 'Inventory & stock'){
    const q = (state.partnerCatalogSearch || '').toLowerCase().trim();
    const listFiltered = q ? sellerListings.filter(l => (l.product_name || '').toLowerCase().includes(q) || (l.sku || '').toLowerCase().includes(q)) : sellerListings;
    const prodFiltered = q ? sellerProds.filter(p => (p.name || '').toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q)) : sellerProds;

    body = '<div class="dashboard-panel">' +
      '<div class="account-heading">' +
        '<div><h3>Real-Time Inventory & Stock Alerts</h3><p class="partner-panel-sub">Update allocated stock across marketplace offers and brand SKUs. Alerts fire at 5 units or below.</p></div>' +
        (lowStockCount ? '<span class="badge badge-warning">' + lowStockCount + ' Low Stock</span>' : '<span class="badge badge-approved">Healthy Stock</span>') +
      '</div>' +
      '<div class="admin-toolbar">' +
        '<div class="admin-search-box admin-search-wide">' +
          '<input id="partner-catalog-search" value="' + esc(state.partnerCatalogSearch || '') + '" placeholder="Search by product name, brand, or SKU…" autocomplete="off">' +
          '<span class="admin-result-count">' + (listFiltered.length + prodFiltered.length) + ' SKUs</span>' +
        '</div>' +
      '</div>' +
      (listFiltered.length ? '<div class="partner-table-section"><h4>Multi-Vendor Listings Stock</h4><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Product & SKU</th><th>Current Stock</th><th>Status</th><th>Update Stock</th></tr></thead><tbody>' +
        listFiltered.map(l => '<tr>' +
          '<td><strong>' + esc(l.product_name || l.product_id) + '</strong><br><small class="admin-muted">SKU: ' + esc(l.sku) + '</small></td>' +
          '<td class="admin-num"><strong>' + l.stock + ' units</strong></td>' +
          '<td>' + (l.stock <= 5 ? '<span class="badge badge-warning">LOW STOCK</span>' : '<span class="badge badge-approved">HEALTHY</span>') + '</td>' +
          '<td><div class="admin-actions"><input type="number" id="listing-stock-' + l.id + '" value="' + l.stock + '" class="partner-compact-input partner-compact-sm"><button type="button" class="btn btn-outline btn-sm" data-action="partner-listing-update" data-id="' + l.id + '">Update</button></div></td>' +
        '</tr>').join('') +
      '</tbody></table></div></div>' : '') +
      (prodFiltered.length ? '<div class="partner-table-section"><h4>Direct Brand Products</h4><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Product</th><th>Category</th><th>Current Stock</th><th>Status</th><th>Update Stock</th></tr></thead><tbody>' +
        prodFiltered.map(p => '<tr>' +
          '<td><strong>' + esc(p.name) + '</strong><br><small class="admin-muted">' + esc(p.brand) + '</small></td>' +
          '<td><span class="badge badge-info">' + esc(p.category) + '</span></td>' +
          '<td class="admin-num"><strong>' + p.stock + ' units</strong></td>' +
          '<td>' + (p.stock <= 5 ? '<span class="badge badge-warning">LOW STOCK</span>' : '<span class="badge badge-approved">HEALTHY</span>') + '</td>' +
          '<td><div class="admin-actions"><input type="number" id="stock-input-' + p.id + '" value="' + p.stock + '" class="partner-compact-input partner-compact-sm"><button type="button" class="btn btn-outline btn-sm" data-action="partner-stock-update" data-id="' + p.id + '">Update</button></div></td>' +
        '</tr>').join('') +
      '</tbody></table></div></div>' : '') +
      (!listFiltered.length && !prodFiltered.length ? empty('truck', 'No inventory items match', 'Add marketplace offers or brand products to manage live inventory here.') : '') +
    '</div>';

  } else if(tab === 'Orders & fulfillment' || tab === 'Orders & Shipping' || tab.toLowerCase().includes('order') || tab === 'Shipping'){
    const filter = state.partnerOrderFilter || 'ALL';
    const q = (state.partnerOrderSearch || '').toLowerCase().trim();
    const filterList = (arr, isSub) => {
      let res = arr;
      if(filter !== 'ALL') res = res.filter(x => String(x.status || '').toLowerCase() === filter);
      if(q) res = res.filter(x => {
        const oid = String(isSub ? x.suborder_id : x.id).toLowerCase();
        const addr = String(isSub ? x.shipping_address_text : x.address_text || '').toLowerCase();
        const itemsText = (x.items || []).map(i => i.name + ' ' + (i.sku || '')).join(' ').toLowerCase();
        return oid.includes(q) || addr.includes(q) || itemsText.includes(q);
      });
      return res;
    };

    const filteredSuborders = filterList(sellerSuborders, true);
    const filteredLegacy = filterList(sellerLegacyOrders, false);

    body = '<div class="dashboard-panel">' +
      '<div class="admin-toolbar">' +
        '<div class="admin-pill-group">' +
          [['ALL','All'], ['placed','Placed'], ['packed','Packed'], ['in_transit','In Transit'], ['delivered','Delivered'], ['cancelled','Cancelled']].map(([val, lbl]) =>
            '<button type="button" class="admin-pill ' + (filter === val ? 'active' : '') + '" data-action="partner-order-filter" data-id="' + val + '">' + lbl + '</button>'
          ).join('') +
        '</div>' +
        '<div class="admin-search-box">' +
          '<input id="partner-order-search" value="' + esc(state.partnerOrderSearch || '') + '" placeholder="Search suborder ID, product, or address…" autocomplete="off">' +
          '<span class="admin-result-count">' + (filteredSuborders.length || filteredLegacy.length) + ' orders</span>' +
        '</div>' +
      '</div>' +
      (filteredSuborders.length ? '<div class="partner-order-stack">' + filteredSuborders.map(s => {
        const fulfillOk = canSellerFulfillOrder(s.payment_method, s.payment_status, s.status, s.parent_order_status);
        const payBlockedNote = !fulfillOk && ['placed', 'packed', 'in_transit'].includes(s.status)
          ? '<span class="partner-block-note">Fulfillment blocked — ' + esc(formatOrderPaymentStatusLabel(s.payment_status)) + '</span>'
          : (s.payment_status === 'refund_pending_oos' || s.payment_status === 'refunded_oos'
              ? '<span class="partner-block-note">' + esc(formatOrderPaymentStatusLabel(s.payment_status)) + '</span>'
              : '');
        return '<div class="partner-order-card">' +
          '<div class="partner-order-head">' +
            '<div><strong>Suborder #' + esc(s.suborder_id) + '</strong><small>Parent ' + esc(s.parent_order_id) + ' · ' + (s.created_at?.slice(0, 10) || 'Recent') + ' · Subtotal ' + money(s.subtotal) + ' · Ship ' + money(s.shipping_fee) + ' · Pay: ' + esc(s.payment_status || 'pending') + '</small></div>' +
            '<span class="badge badge-' + statusTone(s.status) + '">' + esc(s.status) + '</span>' +
          '</div>' +
          '<div class="partner-order-addr">Deliver to: <strong>' + esc(s.shipping_address_label || 'Home') + '</strong> — ' + esc(s.shipping_address_text || '') + '</div>' +
          (s.shipment ? '<div class="partner-order-box">Carrier: <strong>' + esc(s.shipment.carrier_name) + '</strong> · Tracking AWB: <strong>' + esc(s.shipment.tracking_number) + '</strong>' + (s.shipment.tracking_url ? ' · <a href="' + esc(s.shipment.tracking_url) + '" target="_blank" rel="noopener">Live Courier Tracking</a>' : '') + '</div>' : '') +
          '<div class="partner-order-box">' +
            (s.items || []).map(i => '<div class="partner-order-item"><span>' + esc(i.name) + (i.variant_name ? ' (' + esc(i.variant_name) + ')' : '') + (i.sku ? ' · SKU ' + esc(i.sku) : '') + '</span><strong class="admin-num">× ' + i.qty + ' · ' + money(i.price) + '</strong></div>').join('') +
          '</div>' +
          '<div class="partner-order-foot">' +
            payBlockedNote +
            (fulfillOk && s.status === 'placed' ? '<button type="button" class="btn btn-outline btn-sm" data-action="partner-suborder-pack" data-id="' + s.suborder_id + '">Pack Suborder</button>' : '') +
            (fulfillOk && s.status === 'packed' ? '<button type="button" class="btn btn-primary btn-sm" data-action="partner-suborder-ship" data-id="' + s.suborder_id + '">Dispatch & Tracking</button>' : '') +
            (fulfillOk && s.status === 'in_transit' ? '<button type="button" class="btn btn-success btn-sm" data-action="partner-suborder-deliver" data-id="' + s.suborder_id + '">Confirm Delivery</button>' : '') +
          '</div>' +
        '</div>';
      }).join('') + '</div>' : (filteredLegacy.length ? '<div class="partner-order-stack">' + filteredLegacy.map(o => {
        const fulfillOk = canSellerFulfillOrder(o.payment_method, o.payment_status, o.status, o.status);
        const payBlockedNote = !fulfillOk
          ? '<span class="partner-block-note">Fulfillment blocked — ' + esc(formatOrderPaymentStatusLabel(o.payment_status)) + '</span>'
          : '';
        return '<div class="partner-order-card">' +
          '<div class="partner-order-head">' +
            '<div><strong>Order #' + esc(o.id) + '</strong><small>' + esc(o.date) + ' · ' + money(o.total) + ' · Payment: ' + esc(o.payment_status) + '</small></div>' +
            '<span class="badge badge-' + statusTone(o.status) + '">' + esc(o.status) + '</span>' +
          '</div>' +
          '<div class="partner-order-addr">Deliver to: ' + esc(o.address_text) + '</div>' +
          '<div class="partner-order-box">' +
            (o.items || []).map(i => '<div class="partner-order-item"><span>' + esc(i.name) + (i.variant_name ? ' (' + esc(i.variant_name) + ')' : '') + '</span><strong class="admin-num">× ' + i.qty + ' · ' + money(i.price) + '</strong></div>').join('') +
          '</div>' +
          '<div class="partner-order-foot">' +
            payBlockedNote +
            (fulfillOk && o.status === 'placed' ? '<button type="button" class="btn btn-outline btn-sm" data-action="partner-order-pack" data-id="' + o.id + '">Pack Order</button>' : '') +
            (fulfillOk && o.status === 'packed' ? '<button type="button" class="btn btn-primary btn-sm" data-action="partner-order-ship" data-id="' + o.id + '">Ship Order</button>' : '') +
            (fulfillOk && o.status === 'in_transit' ? '<button type="button" class="btn btn-success btn-sm" data-action="partner-order-deliver" data-id="' + o.id + '">Mark Delivered</button>' : '') +
          '</div>' +
        '</div>';
      }).join('') + '</div>' : empty('bag', 'No matching orders found', 'Customer orders matching this status or query will appear here.'))) +
    '</div>';

  } else if(tab === 'Returns & refunds' || tab.toLowerCase().includes('return')){
    body = '<div class="dashboard-panel">' +
      '<div class="account-heading">' +
        '<div><h3>Customer Returns & Reverse Logistics</h3><p class="partner-panel-sub">Review return requests, approve restocking & gateway refunds, or decline invalid claims.</p></div>' +
        '<span class="admin-metric-pill">' + sellerReturns.length + ' Requests</span>' +
      '</div>' +
      (sellerReturns.length ? '<div class="partner-order-stack">' + sellerReturns.map(r => {
        const needsOp = r.refund_status === 'REQUIRES_OPERATOR';
        const isPendingSync = r.status === 'REFUND_PENDING' && !needsOp;
        const actionable = !needsOp && (r.status === 'REQUESTED' || r.status === 'PENDING' || r.status === 'REFUND_FAILED' || isPendingSync);
        const badgeCls = (r.status === 'REFUNDED' || r.status === 'APPROVED') ? 'approved' : (r.status === 'REJECTED' || r.status === 'REFUND_FAILED' || needsOp) ? 'rejected' : 'pending';
        const approveLabel = r.status === 'REFUND_FAILED' ? 'Retry Refund' : (isPendingSync ? 'Reconcile Status' : 'Approve & Restock');
        const allowReject = ['REQUESTED', 'PENDING', 'APPROVED'].includes(r.status);
        return '<div class="partner-order-card">' +
          '<div class="partner-order-head">' +
            '<div><strong>Return #' + esc(r.id) + ' · Suborder #' + esc(r.suborder_id) + '</strong><small>Requested ' + (r.created_at?.slice(0, 10) || 'Recent') + ' · Item #' + r.order_item_id + ' (Qty ' + (r.return_qty || 1) + ') · Refund ' + money(r.refund_amount || 0) + '</small></div>' +
            '<span class="badge badge-' + badgeCls + '">' + esc(r.status) + '</span>' +
          '</div>' +
          '<div class="partner-order-box">' +
            '<div><strong>Reason:</strong> ' + esc(r.reason) + '</div>' +
            '<div><strong>Refund state:</strong> ' + esc(r.refund_status || 'NONE') + (r.gateway_refund_id ? ' (Ref: <code>' + esc(r.gateway_refund_id) + '</code>)' : '') + '</div>' +
            (needsOp ? '<div class="partner-block-note"><strong>Operator attention required:</strong> Automatic refund retries reached limit or failed validation.</div>' : '') +
            (r.detailed_explanation ? '<div class="admin-muted"><strong>Customer note:</strong> ' + esc(r.detailed_explanation) + '</div>' : '') +
            (r.rejection_reason ? '<div class="partner-block-note"><strong>Seller decision reason:</strong> ' + esc(r.rejection_reason) + '</div>' : '') +
          '</div>' +
          (actionable ? '<div class="partner-order-foot">' +
            '<button type="button" class="btn btn-success btn-sm" data-action="partner-return-approve" data-id="' + esc(r.id) + '">' + approveLabel + '</button>' +
            (allowReject ? '<button type="button" class="btn btn-danger btn-sm" data-action="partner-return-reject" data-id="' + esc(r.id) + '">Reject Return</button>' : '') +
          '</div>' : '') +
        '</div>';
      }).join('') + '</div>' : empty('shield', 'No return requests', 'Customer reverse logistics requests will appear here when submitted.')) +
    '</div>';

  } else if(tab === 'Escrow & settlement' || ['Earnings','Revenue analytics','Sales analytics','Analytics'].includes(tab)){
    if(role === 'Product Seller' && mvFin){
      body = '<section class="admin-kpi-grid">' +
        '<div class="admin-kpi-card admin-kpi-featured"><span>Held in Escrow</span><strong class="admin-num">' + money(mvFin.funds_in_escrow ?? 0) + '</strong><small>Pending delivery + 7-day return window</small></div>' +
        '<div class="admin-kpi-card"><span>Matured / Cleared</span><strong class="admin-num">' + money(mvFin.matured_balance_available ?? 0) + '</strong><small>Eligible (T+7, no open returns)</small></div>' +
        '<div class="admin-kpi-card"><span>Settled Ledger</span><strong class="admin-num">' + money(mvFin.total_disbursed ?? 0) + '</strong><small>Marked settled internally</small></div>' +
        '<div class="admin-kpi-card"><span>Total Sales Volume</span><strong class="admin-num">' + money(mvFin.gross_sales ?? 0) + '</strong><small>15% Fee: ' + money(mvFin.platform_commission_15pct ?? 0) + ' · Refunds: ' + money(mvFin.refund_deductions ?? 0) + '</small></div>' +
      '</section>' +
      '<div class="dashboard-panel" style="margin-top:18px">' +
        '<div class="account-heading">' +
          '<div><h3>Multi-Vendor Escrow & Settlement Ledger</h3><p class="partner-panel-sub">Merchant funds remain in escrow for 7 days (T+7) after delivery until open returns resolve.</p></div>' +
          '<span class="badge badge-info">Policy: T+7 Return-Aligned</span>' +
        '</div>' +
        (mvFin.escrow_batches && mvFin.escrow_batches.length ?
          '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Suborder</th><th>Net Settlement</th><th>Refunded</th><th>Comm. Reversed</th><th>Status</th><th>Maturity Date</th></tr></thead><tbody>' +
            mvFin.escrow_batches.map(rec => '<tr>' +
              '<td class="admin-num"><strong>' + esc(rec.suborder_id) + '</strong></td>' +
              '<td class="admin-num"><strong>' + money(rec.net_amount) + '</strong></td>' +
              '<td class="admin-num">' + money(rec.refunded_amount || 0) + '</td>' +
              '<td class="admin-num">' + money(rec.reversed_commission || 0) + '</td>' +
              '<td><span class="badge badge-' + statusTone(rec.status) + '">' + esc(rec.status) + '</span></td>' +
              '<td class="admin-num"><small>' + (rec.matures_at ? new Date(rec.matures_at).toLocaleDateString() : 'Pending Delivery') + '</small></td>' +
            '</tr>').join('') +
          '</tbody></table></div>' : empty('clock', 'No escrow records yet', 'Delivered customer suborders will generate T+7 escrow ledger batches here.')) +
      '</div>';
    } else {
      const f = {
        gross_sales: fin.gross_sales || 0,
        platform_commission: fin.platform_commission || 0,
        refund_deductions: fin.refund_deductions || 0,
        net_earnings: fin.net_earnings || 0,
        settlement_summary: fin.settlement_summary || { payout_status: 'pending_cycle' },
        statements: fin.statements || []
      };
      body = '<section class="admin-kpi-grid">' +
        '<div class="admin-kpi-card"><span>Gross Sales</span><strong class="admin-num">' + money(f.gross_sales) + '</strong><small>Total completed booking value</small></div>' +
        '<div class="admin-kpi-card"><span>Commission (15%)</span><strong class="admin-num">' + money(f.platform_commission) + '</strong><small>Platform curation & fee</small></div>' +
        '<div class="admin-kpi-card"><span>Refund Deductions</span><strong class="admin-num">' + money(f.refund_deductions) + '</strong><small>Cancelled or refunded visits</small></div>' +
        '<div class="admin-kpi-card admin-kpi-featured"><span>Net Earnings</span><strong class="admin-num">' + money(f.net_earnings) + '</strong><small>Payable to partner</small></div>' +
      '</section>' +
      '<div class="dashboard-panel" style="margin-top:18px">' +
        '<div class="account-heading">' +
          '<div><h3>Settlement Ledger & Statements</h3><p class="partner-panel-sub">Verified payout accounting across completed appointments.</p></div>' +
          '<span class="badge badge-info">Status: ' + esc(f.settlement_summary?.payout_status || 'Pending cycle') + '</span>' +
        '</div>' +
        (f.statements?.length ?
          '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Txn ID</th><th>Date</th><th>Service</th><th>Gross</th><th>15% Fee</th><th>Net Payout</th><th>Status</th></tr></thead><tbody>' +
            f.statements.map(s => '<tr>' +
              '<td><code class="admin-ip">' + esc(s.transaction_id) + '</code></td>' +
              '<td class="admin-num">' + esc(s.date) + '</td>' +
              '<td><strong>' + esc(s.title) + '</strong></td>' +
              '<td class="admin-num">' + money(s.gross_amount) + '</td>' +
              '<td class="admin-num">' + money(s.commission_amount) + '</td>' +
              '<td class="admin-num"><strong>' + money(s.net_amount) + '</strong></td>' +
              '<td><span class="badge badge-' + statusTone(s.status) + '">' + esc(s.status) + '</span></td>' +
            '</tr>').join('') +
          '</tbody></table></div>' : empty('clock', 'No statements recorded yet', 'Completed appointments will appear in your settlement ledger.')) +
      '</div>';
    }

  } else if(tab === 'Customer reviews' || tab === 'Reviews'){
    body = '<div class="dashboard-panel">' +
      '<div class="account-heading">' +
        '<div><h3>Client Feedback & Reviews</h3><p class="partner-panel-sub">Verified ratings from recent GlamGo bookings and product orders.</p></div>' +
        '<span class="admin-metric-pill">' + (state.reviews || []).length + ' Reviews</span>' +
      '</div>' +
      ((state.reviews || []).length ? '<div class="partner-feed">' + state.reviews.map(r =>
        '<div class="dash-row"><div><strong>' + r.rating + ' ★ · ' + esc(r.comment) + '</strong><small>' + esc(r.user_name || 'Customer') + ' · ' + formatDate(r.created_at) + '</small></div><span class="badge badge-info">' + esc(r.item_type) + '</span></div>'
      ).join('') + '</div>' : empty('star', 'No reviews yet', 'Verified customer reviews will appear after treatments or deliveries are completed.')) +
    '</div>';

  } else {
    body = '<div class="dashboard-panel"><h3>' + esc(tab) + '</h3><p class="partner-panel-sub">Your ' + esc(tab.toLowerCase()) + ' workspace is ready.</p>' + empty('grid', 'Clean workspace', 'Activity for this section will populate as your GlamGo presence grows.') + '</div>';
  }

  return '<div class="partner-shell">' +
    '<aside class="partner-nav-sidebar" aria-label="' + esc(roleDisplay) + ' navigation">' +
      '<div class="partner-side-head">' +
        '<span class="partner-side-role">' + esc(roleDisplay) + ' Studio</span>' +
        '<p class="partner-side-desc">' + esc(roleDesc) + '</p>' +
      '</div>' +
      '<div class="partner-role-switcher" role="tablist" aria-label="Switch partner role">' +
        roles.map(r => {
          const shortLabel = r === 'Professional' ? 'Specialist' : r === 'Salon Owner' ? 'Salon' : 'Seller';
          const fullLabel = r === 'Professional' ? 'Specialist' : r;
          return '<button type="button" role="tab" aria-label="' + fullLabel + '" title="' + fullLabel + '" aria-selected="' + (r === role ? 'true' : 'false') + '" class="' + (r === role ? 'active' : '') + '" data-action="partner-role" data-id="' + r + '">' + shortLabel + '</button>';
        }).join('') +
      '</div>' +
      '<nav class="partner-nav-groups">' +
        sidebarGroups.map(g =>
          '<div class="partner-nav-group">' +
            '<div class="partner-nav-group-label">' + esc(g.label) + '</div>' +
            g.items.map(renderNavBtn).join('') +
          '</div>'
        ).join('') +
      '</nav>' +
      '<div class="partner-side-foot">' +
        '<button type="button" class="partner-nav-btn" data-action="landing">' + icon('arrow', 15) + '<span class="partner-nav-label">Back to GlamGo</span></button>' +
      '</div>' +
    '</aside>' +
    '<main class="partner-workspace">' +
      '<header class="partner-topbar">' +
        '<div>' +
          '<h1>' + esc(currentMeta.title) + '</h1>' +
          '<p>' + esc(currentMeta.sub) + (state.partnerLastSynced ? ' · Synced ' + esc(state.partnerLastSynced) : '') + '</p>' +
        '</div>' +
        '<div class="partner-topbar-actions">' +
          '<button type="button" class="btn btn-outline btn-sm admin-refresh-btn" data-action="partner-refresh">Refresh</button>' +
          '<span class="badge badge-' + (isRoleMatched ? 'approved' : 'pending') + '">' + (isRoleMatched ? 'Live Studio' : 'Preview Mode') + '</span>' +
        '</div>' +
      '</header>' +
      '<div class="partner-content">' + body + '</div>' +
    '</main>' +
  '</div>';
}

async function loadAdminData(){
  if(state.user?.role !== 'admin') return;
  try {
    const [stats, users, drafts, logs, bookings, orders] = await Promise.allSettled([
      apiGetAdminStats(),
      apiGetAdminUsers(),
      apiGetAdminDrafts(),
      apiGetAuditLogs(null, 50, 0),
      apiGetAdminBookings(),
      apiGetAdminOrders()
    ]);
    if(stats.status === 'fulfilled') state.adminStats = stats.value;
    if(users.status === 'fulfilled') state.adminUsers = users.value;
    if(drafts.status === 'fulfilled') state.adminDrafts = drafts.value;
    if(logs.status === 'fulfilled') state.adminAuditLogs = logs.value;
    if(bookings.status === 'fulfilled') state.adminBookings = bookings.value;
    if(orders.status === 'fulfilled') state.adminOrders = orders.value;
    state.adminLastSynced = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    render();
  } catch(err) {
    console.warn('[Admin] Live sync notice:', err);
  }
}

function adminPage(){
  if(state.user?.role !== 'admin'){
    return '<div class="admin-shell"><main class="admin-main"><div class="admin-panel admin-empty-state"><h2>Access Restricted</h2><p>Administrator privileges are required to view this command centre.</p><button class="btn btn-primary" data-action="landing">Return to GlamGo Store</button></div></main></div>';
  }

  const tab = state.adminTab || 'overview';
  const allDrafts = state.adminDrafts || [];
  const allUsers = state.adminUsers || [];
  const allBookings = state.adminBookings || [];
  const allOrders = state.adminOrders || [];
  const allLogs = state.adminAuditLogs || [];
  const pendingCount = allDrafts.filter(d => d.status === 'PENDING').length;

  const initials = (str) => {
    const parts = String(str || 'GA').trim().split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || parts[0]?.[1] || '')).toUpperCase() || 'GA';
  };

  const statusTone = (status) => {
    const s = String(status || '').toLowerCase();
    if(s.includes('cancel') || s.includes('reject') || s.includes('suspend') || s.includes('fail')) return 'rejected';
    if(s.includes('pend') || s.includes('progress') || s.includes('process') || s.includes('hold')) return 'pending';
    if(s.includes('approv') || s.includes('active') || s.includes('complet') || s.includes('deliver') || s.includes('confirm') || s.includes('paid')) return 'approved';
    return 'info';
  };

  const formatAuditAction = (action) => String(action || 'EVENT').replace(/_/g, ' ');

  const formatAuditMeta = (details) => {
    if(!details || typeof details !== 'object') return '<span class="admin-muted">—</span>';
    const entries = Object.entries(details).filter(([, v]) => v !== null && v !== undefined && v !== '');
    if(!entries.length) return '<span class="admin-muted">—</span>';
    return '<div class="admin-meta-chips">' + entries.slice(0, 4).map(([k, v]) => {
      const val = typeof v === 'object' ? JSON.stringify(v) : String(v);
      return '<span class="admin-meta-chip"><b>' + esc(k.replace(/_/g, ' ')) + ':</b> ' + esc(val.length > 34 ? val.slice(0, 34) + '…' : val) + '</span>';
    }).join('') + '</div>';
  };

  const TAB_META = {
    overview: { title: 'Executive Overview', subtitle: 'Platform GMV, vertical revenue mix, pending approvals, and governance signals.' },
    moderation: { title: 'Partner Moderation', subtitle: 'Verify and approve incoming salon owners, beauty specialists, and product sellers.' },
    users: { title: 'User Governance', subtitle: 'Manage customer, partner, and administrator roles and account access.' },
    bookings: { title: 'Global Bookings', subtitle: 'Monitor doorstep beauty rituals and in-parlour salon appointments.' },
    orders: { title: 'Global Orders', subtitle: 'Track beauty e-commerce checkouts, payment states, and fulfillment.' },
    services: { title: 'Service Catalog', subtitle: 'Curated doorstep treatments and salon service listings across GlamGo.' },
    products: { title: 'Product Inventory', subtitle: 'Active beauty retail catalogue, brands, and pricing.' },
    'audit-logs': { title: 'Audit Trail', subtitle: 'Immutable record of administrative actions, targets, and client IPs.' }
  };
  const currentMeta = TAB_META[tab] || TAB_META.overview;

  const navBtn = (id, ico, label, count, alertCount) =>
    '<button class="admin-nav-item ' + (tab === id ? 'active' : '') + '" data-action="admin-tab" data-id="' + id + '">' +
      icon(ico, 15) +
      '<span class="admin-nav-label">' + label + '</span>' +
      (alertCount > 0
        ? '<span class="admin-nav-badge">' + alertCount + '</span>'
        : (typeof count === 'number' ? '<span class="admin-nav-count">' + count + '</span>' : '')) +
    '</button>';

  const sidebar = '<aside class="admin-sidebar" aria-label="Admin navigation">' +
    '<div class="admin-sidebar-brand">' +
      '<a class="admin-brand-link" href="#landing" data-action="landing">' +
        '<span class="admin-brand-word">GLAMGO</span><span class="admin-brand-dot" aria-hidden="true"></span>' +
      '</a>' +
      '<div class="admin-brand-sub">Command Centre</div>' +
    '</div>' +
    '<nav class="admin-nav-groups">' +
      '<div class="admin-nav-group">' +
        '<div class="admin-nav-group-label">Overview</div>' +
        navBtn('overview', 'grid', 'Executive Overview', null, 0) +
      '</div>' +
      '<div class="admin-nav-group">' +
        '<div class="admin-nav-group-label">Operations</div>' +
        navBtn('moderation', 'shield', 'Partner Moderation', allDrafts.length, pendingCount) +
        navBtn('bookings', 'calendar', 'Global Bookings', allBookings.length, 0) +
        navBtn('orders', 'bag', 'Global Orders', allOrders.length, 0) +
      '</div>' +
      '<div class="admin-nav-group">' +
        '<div class="admin-nav-group-label">Catalog</div>' +
        navBtn('services', 'spark', 'Service Catalog', services.length, 0) +
        navBtn('products', 'truck', 'Product Inventory', products.length, 0) +
      '</div>' +
      '<div class="admin-nav-group">' +
        '<div class="admin-nav-group-label">Governance</div>' +
        navBtn('users', 'user', 'User Governance', allUsers.length, 0) +
        navBtn('audit-logs', 'clock', 'Audit Trail', allLogs.length, 0) +
      '</div>' +
    '</nav>' +
    '<div class="admin-sidebar-footer">' +
      '<div class="admin-profile-card">' +
        '<div class="admin-avatar">' + esc(initials(state.user.name)) + '</div>' +
        '<div class="admin-profile-meta">' +
          '<strong>' + esc(state.user.name) + '</strong>' +
          '<span>' + esc(state.user.email) + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="admin-footer-links">' +
        '<button class="admin-nav-item" data-action="partners">' + icon('spark', 15) + '<span class="admin-nav-label">Partner Portal</span></button>' +
        '<button class="admin-nav-item" data-action="landing">' + icon('arrow', 15) + '<span class="admin-nav-label">Exit to Store</span></button>' +
      '</div>' +
    '</div>' +
  '</aside>';

  let mainContent = '';

  if(tab === 'overview'){
    const stats = state.adminStats || {
      customers_count: 0,
      professionals_count: 0,
      salons_count: 0,
      sellers_count: 0,
      total_bookings: 0,
      total_orders: 0,
      gross_merchandise_value: 0,
      platform_commission: 0,
      services_gmv: 0,
      salons_gmv: 0,
      ecommerce_gmv: 0,
      average_booking_value: 0,
      average_order_value: 0
    };

    const avgBookingVal = stats.average_booking_value ?? stats.avg_booking_value ?? 0;
    const avgOrderVal = stats.average_order_value ?? stats.avg_order_value ?? 0;
    const gmvTotal = Number(stats.gross_merchandise_value || 0);
    const servicesGmv = Number(stats.services_gmv || 0);
    const salonsGmv = Number(stats.salons_gmv || 0);
    const ecomGmv = Number(stats.ecommerce_gmv || 0);
    const splitSum = servicesGmv + salonsGmv + ecomGmv;
    const pct = (v) => splitSum > 0 ? Math.round((v / splitSum) * 100) : 0;
    const svcPct = pct(servicesGmv);
    const salPct = pct(salonsGmv);
    const ecoPct = splitSum > 0 ? Math.max(0, 100 - svcPct - salPct) : 0;
    const totalTx = (stats.total_bookings || 0) + (stats.total_orders || 0);
    const takeRate = gmvTotal > 0 ? ((Number(stats.platform_commission || 0) / gmvTotal) * 100).toFixed(1) : '15.0';

    const pendingDrafts = allDrafts.filter(d => d.status === 'PENDING').slice(0, 5);
    const recentLogs = allLogs.slice(0, 5);

    mainContent = '<section class="admin-kpi-grid" aria-label="Key metrics">' +
      '<div class="admin-kpi-card admin-kpi-featured">' +
        '<div class="admin-kpi-top"><span>Total GMV</span><span class="admin-kpi-tag">Gross</span></div>' +
        '<strong class="admin-num">' + money(gmvTotal) + '</strong>' +
        '<small>' + totalTx + ' total bookings & retail orders</small>' +
      '</div>' +
      '<div class="admin-kpi-card">' +
        '<div class="admin-kpi-top"><span>Platform Commission</span><span class="admin-kpi-tag">' + takeRate + '%</span></div>' +
        '<strong class="admin-num">' + money(stats.platform_commission || 0) + '</strong>' +
        '<small>Net platform revenue</small>' +
      '</div>' +
      '<div class="admin-kpi-card">' +
        '<div class="admin-kpi-top"><span>Total Bookings</span><span class="admin-kpi-tag">Services</span></div>' +
        '<strong class="admin-num">' + (stats.total_bookings || 0) + '</strong>' +
        '<small>Avg ' + money(avgBookingVal) + ' / booking</small>' +
      '</div>' +
      '<div class="admin-kpi-card">' +
        '<div class="admin-kpi-top"><span>Total Orders</span><span class="admin-kpi-tag">Retail</span></div>' +
        '<strong class="admin-num">' + (stats.total_orders || 0) + '</strong>' +
        '<small>Avg ' + money(avgOrderVal) + ' / order</small>' +
      '</div>' +
    '</section>' +

    '<section class="admin-panel">' +
      '<div class="admin-panel-head">' +
        '<div>' +
          '<h2>Vertical GMV Contribution</h2>' +
          '<p class="admin-panel-sub">Revenue distribution across doorstep services, salon parlours, and beauty retail.</p>' +
        '</div>' +
        '<span class="admin-metric-pill">' + money(splitSum || gmvTotal) + ' combined</span>' +
      '</div>' +
      '<div class="admin-gmv-bar" role="img" aria-label="GMV split: At-home ' + svcPct + '%, Salons ' + salPct + '%, E-commerce ' + ecoPct + '%">' +
        (splitSum > 0
          ? '<span class="admin-gmv-seg seg-home" style="width:' + svcPct + '%"></span>' +
            '<span class="admin-gmv-seg seg-salon" style="width:' + salPct + '%"></span>' +
            '<span class="admin-gmv-seg seg-shop" style="width:' + ecoPct + '%"></span>'
          : '<span class="admin-gmv-seg seg-empty" style="width:100%"></span>') +
      '</div>' +
      '<div class="admin-vertical-grid">' +
        '<div class="admin-vertical-card">' +
          '<div class="admin-vertical-head"><i class="admin-dot dot-home"></i><span>At-Home Services</span><b class="admin-num">' + svcPct + '%</b></div>' +
          '<strong class="admin-num">' + money(servicesGmv) + '</strong>' +
          '<small>Doorstep rituals & specialists</small>' +
        '</div>' +
        '<div class="admin-vertical-card">' +
          '<div class="admin-vertical-head"><i class="admin-dot dot-salon"></i><span>Salon Appointments</span><b class="admin-num">' + salPct + '%</b></div>' +
          '<strong class="admin-num">' + money(salonsGmv) + '</strong>' +
          '<small>In-parlour chair bookings</small>' +
        '</div>' +
        '<div class="admin-vertical-card">' +
          '<div class="admin-vertical-head"><i class="admin-dot dot-shop"></i><span>Beauty E-Commerce</span><b class="admin-num">' + ecoPct + '%</b></div>' +
          '<strong class="admin-num">' + money(ecomGmv) + '</strong>' +
          '<small>Multi-vendor retail store</small>' +
        '</div>' +
      '</div>' +
      '<div class="admin-roster-strip">' +
        '<button class="admin-roster-item" data-action="admin-jump-users" data-id="CUSTOMER"><span>Customers</span><strong class="admin-num">' + (stats.customers_count || 0) + '</strong></button>' +
        '<button class="admin-roster-item" data-action="admin-jump-users" data-id="PROFESSIONAL"><span>Professionals</span><strong class="admin-num">' + (stats.professionals_count || 0) + '</strong></button>' +
        '<button class="admin-roster-item" data-action="admin-jump-users" data-id="SALON_OWNER"><span>Salons</span><strong class="admin-num">' + (stats.salons_count || 0) + '</strong></button>' +
        '<button class="admin-roster-item" data-action="admin-jump-users" data-id="SELLER"><span>Product Sellers</span><strong class="admin-num">' + (stats.sellers_count || 0) + '</strong></button>' +
      '</div>' +
    '</section>' +

    '<section class="admin-split-grid">' +
      '<div class="admin-panel">' +
        '<div class="admin-panel-head">' +
          '<div>' +
            '<h2>Pending Applications</h2>' +
            '<p class="admin-panel-sub">' + (pendingCount ? pendingCount + ' awaiting moderation review' : 'Queue is clear') + '</p>' +
          '</div>' +
          '<button class="btn btn-outline btn-sm" data-action="admin-tab" data-id="moderation">View queue</button>' +
        '</div>' +
        (pendingDrafts.length ? '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Applicant</th><th>Role</th><th>Listing</th><th>Action</th></tr></thead><tbody>' +
          pendingDrafts.map(d => '<tr>' +
            '<td><div class="admin-cell-user"><span class="admin-mini-avatar">' + esc(initials(d.applicant_name || ('U' + d.user_id))) + '</span><div><strong>' + esc(d.applicant_name || ('User #' + d.user_id)) + '</strong><small>' + esc(d.applicant_email || '') + '</small></div></div></td>' +
            '<td><span class="badge badge-info">' + esc(d.role) + '</span></td>' +
            '<td><strong>' + esc(d.name) + '</strong><br><small class="admin-num">' + money(d.price) + '</small></td>' +
            '<td><div class="admin-actions"><button class="btn btn-success btn-sm" data-action="admin-approve-draft" data-id="' + d.id + '">Approve</button><button class="btn btn-danger btn-sm" data-action="admin-reject-draft" data-id="' + d.id + '">Reject</button></div></td>' +
          '</tr>').join('') +
        '</tbody></table></div>' : '<div class="admin-empty-inline">All partner applications have been reviewed.</div>') +
      '</div>' +
      '<div class="admin-panel">' +
        '<div class="admin-panel-head">' +
          '<div>' +
            '<h2>Recent Audit Events</h2>' +
            '<p class="admin-panel-sub">Latest administrative actions across GlamGo</p>' +
          '</div>' +
          '<button class="btn btn-outline btn-sm" data-action="admin-tab" data-id="audit-logs">Full ledger</button>' +
        '</div>' +
        (recentLogs.length ? '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Action</th><th>Target</th><th>Time</th></tr></thead><tbody>' +
          recentLogs.map(l => '<tr>' +
            '<td><span class="badge badge-info">' + esc(formatAuditAction(l.action)) + '</span></td>' +
            '<td><strong>' + esc(l.target_type) + '</strong> <span class="admin-muted">#' + esc(l.target_id || '-') + '</span></td>' +
            '<td><small class="admin-num">' + new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</small></td>' +
          '</tr>').join('') +
        '</tbody></table></div>' : '<div class="admin-empty-inline">No audit events recorded yet.</div>') +
      '</div>' +
    '</section>';

  } else if(tab === 'moderation'){
    const filter = state.adminDraftFilter || 'ALL';
    const q = (state.adminDraftSearch || '').toLowerCase().trim();
    const counts = {
      ALL: allDrafts.length,
      PENDING: allDrafts.filter(d => d.status === 'PENDING').length,
      APPROVED: allDrafts.filter(d => d.status === 'APPROVED').length,
      REJECTED: allDrafts.filter(d => d.status === 'REJECTED').length
    };
    let drafts = allDrafts;
    if(filter !== 'ALL') drafts = drafts.filter(d => d.status === filter);
    if(q) drafts = drafts.filter(d =>
      (d.applicant_name || '').toLowerCase().includes(q) ||
      (d.applicant_email || '').toLowerCase().includes(q) ||
      (d.name || '').toLowerCase().includes(q) ||
      (d.role || '').toLowerCase().includes(q)
    );

    mainContent = '<div class="admin-panel">' +
      '<div class="admin-toolbar">' +
        '<div class="admin-pill-group">' +
          ['ALL','PENDING','APPROVED','REJECTED'].map(f =>
            '<button class="admin-pill ' + (filter === f ? 'active' : '') + '" data-action="admin-draft-filter" data-id="' + f + '">' + f + ' <span>' + counts[f] + '</span></button>'
          ).join('') +
        '</div>' +
        '<div class="admin-search-box">' +
          '<input id="admin-draft-search" value="' + esc(state.adminDraftSearch || '') + '" placeholder="Search applicant, listing, or role…" autocomplete="off">' +
          '<span class="admin-result-count">' + drafts.length + ' shown</span>' +
        '</div>' +
      '</div>' +
      (drafts.length ? '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>ID</th><th>Applicant</th><th>Role</th><th>Listing</th><th>Price</th><th>Status</th><th>Submitted</th><th>Action</th></tr></thead><tbody>' +
        drafts.map(d => '<tr>' +
          '<td class="admin-num admin-muted">#' + d.id + '</td>' +
          '<td><div class="admin-cell-user"><span class="admin-mini-avatar">' + esc(initials(d.applicant_name || ('U' + d.user_id))) + '</span><div><strong>' + esc(d.applicant_name || ('User #' + d.user_id)) + '</strong><small>' + esc(d.applicant_email || '') + '</small></div></div></td>' +
          '<td><span class="badge badge-info">' + esc(d.role) + '</span></td>' +
          '<td><strong>' + esc(d.name) + '</strong><br><small class="admin-muted">' + esc((d.description || '').slice(0, 48)) + ((d.description || '').length > 48 ? '…' : '') + '</small></td>' +
          '<td class="admin-num"><strong>' + money(d.price) + '</strong></td>' +
          '<td><span class="badge badge-' + statusTone(d.status) + '">' + esc(d.status) + '</span>' + (d.rejection_reason ? '<br><small class="admin-reject-note">Note: ' + esc(d.rejection_reason) + '</small>' : '') + '</td>' +
          '<td class="admin-num"><small>' + new Date(d.created_at).toLocaleDateString() + '</small></td>' +
          '<td>' + (d.status === 'PENDING'
            ? '<div class="admin-actions"><button class="btn btn-success btn-sm" data-action="admin-approve-draft" data-id="' + d.id + '">Approve</button><button class="btn btn-danger btn-sm" data-action="admin-reject-draft" data-id="' + d.id + '">Reject</button></div>'
            : '<small class="admin-muted">Reviewed by #' + esc(d.reviewed_by || 'Admin') + '</small>') + '</td>' +
        '</tr>').join('') +
      '</tbody></table></div>' : '<div class="admin-empty-inline">No partner applications match this filter.</div>') +
    '</div>';

  } else if(tab === 'users'){
    const q = (state.adminUserSearch || '').toLowerCase().trim();
    const filter = state.adminUserFilter || 'ALL';
    const roleCounts = { ALL: allUsers.length };
    ['CUSTOMER','PROFESSIONAL','SALON_OWNER','SELLER','ADMIN'].forEach(r => {
      roleCounts[r] = allUsers.filter(u => (u.role || '').toUpperCase() === r).length;
    });
    let users = allUsers;
    if(filter !== 'ALL') users = users.filter(u => (u.role || '').toLowerCase() === filter.toLowerCase());
    if(q) users = users.filter(u =>
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q)
    );

    mainContent = '<div class="admin-panel">' +
      '<div class="admin-toolbar">' +
        '<div class="admin-pill-group">' +
          ['ALL','CUSTOMER','PROFESSIONAL','SALON_OWNER','SELLER','ADMIN'].map(f =>
            '<button class="admin-pill ' + (filter === f ? 'active' : '') + '" data-action="admin-user-filter" data-id="' + f + '">' + f.replace('_', ' ') + ' <span>' + (roleCounts[f] || 0) + '</span></button>'
          ).join('') +
        '</div>' +
        '<div class="admin-search-box">' +
          '<input id="admin-user-search" value="' + esc(state.adminUserSearch || '') + '" placeholder="Search by name, email, or phone…" autocomplete="off">' +
          '<span class="admin-result-count">' + users.length + ' accounts</span>' +
        '</div>' +
      '</div>' +
      (users.length ? '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>ID</th><th>Account</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>' +
        users.map(u => '<tr>' +
          '<td class="admin-num admin-muted">#' + u.id + '</td>' +
          '<td><div class="admin-cell-user"><span class="admin-mini-avatar">' + esc(initials(u.name)) + '</span><div><strong>' + esc(u.name) + (u.id === state.user.id ? ' <span class="badge badge-info">You</span>' : '') + '</strong><small>' + esc(u.email) + ' · ' + esc(u.phone || 'N/A') + '</small></div></div></td>' +
          '<td><select class="admin-role-select" data-user-id="' + u.id + '" ' + (u.id === state.user.id ? 'disabled' : '') + '>' +
            '<option value="customer" ' + (u.role === 'customer' ? 'selected' : '') + '>Customer</option>' +
            '<option value="professional" ' + (u.role === 'professional' ? 'selected' : '') + '>Professional</option>' +
            '<option value="salon_owner" ' + (u.role === 'salon_owner' ? 'selected' : '') + '>Salon Owner</option>' +
            '<option value="seller" ' + (u.role === 'seller' ? 'selected' : '') + '>Product Seller</option>' +
            '<option value="admin" ' + (u.role === 'admin' ? 'selected' : '') + '>Platform Admin</option>' +
          '</select></td>' +
          '<td><span class="badge badge-' + (u.is_active ? 'active' : 'suspended') + '">' + (u.is_active ? 'Active' : 'Suspended') + '</span></td>' +
          '<td>' + (u.id === state.user.id
            ? '<small class="admin-muted">Self-protection active</small>'
            : '<button class="btn btn-sm ' + (u.is_active ? 'btn-danger' : 'btn-success') + '" data-action="admin-toggle-user" data-id="' + u.id + '">' + (u.is_active ? 'Suspend' : 'Reactivate') + '</button>') + '</td>' +
        '</tr>').join('') +
      '</tbody></table></div>' : '<div class="admin-empty-inline">No user accounts match your search.</div>') +
    '</div>';

  } else if(tab === 'bookings'){
    const filter = state.adminBookingFilter || 'ALL';
    const q = (state.adminBookingSearch || '').toLowerCase().trim();
    let bList = allBookings;
    if(filter === 'HOME') bList = bList.filter(b => String(b.type || '').toLowerCase().includes('home'));
    else if(filter === 'SALON') bList = bList.filter(b => String(b.type || '').toLowerCase().includes('salon'));
    else if(filter === 'COMPLETED') bList = bList.filter(b => String(b.status || '').toLowerCase().includes('complet'));
    else if(filter === 'CANCELLED') bList = bList.filter(b => String(b.status || '').toLowerCase().includes('cancel'));
    if(q) bList = bList.filter(b =>
      String(b.id).includes(q) ||
      (b.title || '').toLowerCase().includes(q) ||
      (b.customer_name || '').toLowerCase().includes(q) ||
      (b.customer_email || '').toLowerCase().includes(q) ||
      (b.location || '').toLowerCase().includes(q)
    );

    mainContent = '<div class="admin-panel">' +
      '<div class="admin-toolbar">' +
        '<div class="admin-pill-group">' +
          ['ALL','HOME','SALON','COMPLETED','CANCELLED'].map(f =>
            '<button class="admin-pill ' + (filter === f ? 'active' : '') + '" data-action="admin-booking-filter" data-id="' + f + '">' + f + '</button>'
          ).join('') +
        '</div>' +
        '<div class="admin-search-box">' +
          '<input id="admin-booking-search" value="' + esc(state.adminBookingSearch || '') + '" placeholder="Search booking ID, service, customer, or location…" autocomplete="off">' +
          '<span class="admin-result-count">' + bList.length + ' bookings</span>' +
        '</div>' +
      '</div>' +
      (bList.length ? '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>ID</th><th>Service</th><th>Customer</th><th>Type</th><th>Schedule</th><th>Location</th><th>Price</th><th>Status</th></tr></thead><tbody>' +
        bList.map(b => '<tr>' +
          '<td class="admin-num admin-muted">#' + b.id + '</td>' +
          '<td><strong>' + esc(b.title) + '</strong></td>' +
          '<td>' + (b.customer_name ? '<strong>' + esc(b.customer_name) + '</strong><br><small class="admin-muted">' + esc(b.customer_email || ('User #' + b.customer_id)) + '</small>' : 'User #' + (b.customer_id || '-')) + '</td>' +
          '<td><span class="badge badge-info">' + esc(b.type) + '</span></td>' +
          '<td class="admin-num">' + formatDate(b.date) + ' · ' + esc(b.time) + '</td>' +
          '<td><small>' + esc(b.location) + '</small></td>' +
          '<td class="admin-num"><strong>' + money(b.price) + '</strong></td>' +
          '<td><span class="badge badge-' + statusTone(b.status) + '">' + esc(b.status || 'Confirmed') + '</span></td>' +
        '</tr>').join('') +
      '</tbody></table></div>' : '<div class="admin-empty-inline">No bookings match your current filter.</div>') +
    '</div>';

  } else if(tab === 'orders'){
    const filter = state.adminOrderFilter || 'ALL';
    const q = (state.adminOrderSearch || '').toLowerCase().trim();
    let oList = allOrders;
    if(filter !== 'ALL') oList = oList.filter(o => String(o.status || '').toUpperCase().includes(filter));
    if(q) oList = oList.filter(o =>
      String(o.id || '').toLowerCase().includes(q) ||
      (o.customer_name || '').toLowerCase().includes(q) ||
      (o.customer_email || '').toLowerCase().includes(q) ||
      (o.address_text || '').toLowerCase().includes(q)
    );

    mainContent = '<div class="admin-panel">' +
      '<div class="admin-toolbar">' +
        '<div class="admin-pill-group">' +
          ['ALL','PLACED','DELIVERED','CANCELLED'].map(f =>
            '<button class="admin-pill ' + (filter === f ? 'active' : '') + '" data-action="admin-order-filter" data-id="' + f + '">' + f + '</button>'
          ).join('') +
        '</div>' +
        '<div class="admin-search-box">' +
          '<input id="admin-order-search" value="' + esc(state.adminOrderSearch || '') + '" placeholder="Search order ID, customer, or address…" autocomplete="off">' +
          '<span class="admin-result-count">' + oList.length + ' orders</span>' +
        '</div>' +
      '</div>' +
      (oList.length ? '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Address</th><th>Status</th></tr></thead><tbody>' +
        oList.map(o => {
          const custHtml = o.customer_name
            ? '<strong>' + esc(o.customer_name) + '</strong><br><small class="admin-muted">' + esc(o.customer_email || ('User #' + (o.customer_id || o.user_id || ''))) + '</small>'
            : 'User #' + (o.customer_id || o.user_id || '-');
          const itemsHtml = (o.items && o.items.length)
            ? o.items.map(i => esc(i.name) + ' × ' + i.qty).join(', ')
            : (o.items_count ? o.items_count + ' items' : '—');
          const payMeta = o.payment_status ? ' · ' + esc(formatOrderPaymentStatusLabel(o.payment_status)) : '';
          return '<tr>' +
            '<td class="admin-num"><strong>' + esc(o.id) + '</strong></td>' +
            '<td>' + custHtml + '</td>' +
            '<td><small>' + itemsHtml + '</small></td>' +
            '<td class="admin-num"><strong>' + money(o.total) + '</strong></td>' +
            '<td><span class="badge badge-info">' + esc(o.payment_method || 'UPI') + '</span><small class="admin-muted">' + payMeta + '</small></td>' +
            '<td><small>' + esc(o.address_label || '') + (o.address_text ? ' — ' + esc(o.address_text) : '') + '</small></td>' +
            '<td><span class="badge badge-' + statusTone(o.status) + '">' + esc(o.status || 'Placed') + '</span></td>' +
          '</tr>';
        }).join('') +
      '</tbody></table></div>' : '<div class="admin-empty-inline">No orders match your current filter.</div>') +
    '</div>';

  } else if(tab === 'services'){
    const q = (state.adminCatalogSearch || '').toLowerCase().trim();
    const sList = q ? services.filter(s => (s.name || '').toLowerCase().includes(q) || (s.category || '').toLowerCase().includes(q)) : services;
    mainContent = '<div class="admin-panel">' +
      '<div class="admin-toolbar">' +
        '<div class="admin-search-box admin-search-wide">' +
          '<input id="admin-catalog-search" value="' + esc(state.adminCatalogSearch || '') + '" placeholder="Filter services by name or category…" autocomplete="off">' +
          '<span class="admin-result-count">' + sList.length + ' of ' + services.length + ' services</span>' +
        '</div>' +
      '</div>' +
      (sList.length ? '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>ID</th><th>Service</th><th>Category</th><th>Duration</th><th>Price</th><th>Rating</th></tr></thead><tbody>' +
        sList.map(s => '<tr>' +
          '<td class="admin-num admin-muted">#' + s.id + '</td>' +
          '<td><strong>' + esc(s.name) + '</strong></td>' +
          '<td><span class="badge badge-info">' + esc(s.category) + '</span></td>' +
          '<td>' + esc(s.duration) + '</td>' +
          '<td class="admin-num"><strong>' + money(s.price) + '</strong></td>' +
          '<td class="admin-num">' + s.rating + ' ★ <small class="admin-muted">(' + s.reviews + ')</small></td>' +
        '</tr>').join('') +
      '</tbody></table></div>' : '<div class="admin-empty-inline">No services match your search.</div>') +
    '</div>';

  } else if(tab === 'products'){
    const q = (state.adminCatalogSearch || '').toLowerCase().trim();
    const pList = q ? products.filter(p => (p.name || '').toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q)) : products;
    mainContent = '<div class="admin-panel">' +
      '<div class="admin-toolbar">' +
        '<div class="admin-search-box admin-search-wide">' +
          '<input id="admin-catalog-search" value="' + esc(state.adminCatalogSearch || '') + '" placeholder="Filter products by brand, name, or category…" autocomplete="off">' +
          '<span class="admin-result-count">' + pList.length + ' of ' + products.length + ' products</span>' +
        '</div>' +
      '</div>' +
      (pList.length ? '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>ID</th><th>Brand</th><th>Product Name</th><th>Category</th><th>Price</th><th>Tag</th></tr></thead><tbody>' +
        pList.map(p => '<tr>' +
          '<td class="admin-num admin-muted">#' + p.id + '</td>' +
          '<td><strong>' + esc(p.brand) + '</strong></td>' +
          '<td>' + esc(p.name) + '</td>' +
          '<td><span class="badge badge-info">' + esc(p.category) + '</span></td>' +
          '<td class="admin-num"><strong>' + money(p.price) + '</strong></td>' +
          '<td>' + (p.tag ? '<span class="badge badge-approved">' + esc(p.tag) + '</span>' : '<span class="admin-muted">—</span>') + '</td>' +
        '</tr>').join('') +
      '</tbody></table></div>' : '<div class="admin-empty-inline">No products match your search.</div>') +
    '</div>';

  } else if(tab === 'audit-logs'){
    const q = (state.adminAuditSearch || '').toLowerCase().trim();
    const logs = q ? allLogs.filter(l =>
      (l.action || '').toLowerCase().includes(q) ||
      (l.admin_name || '').toLowerCase().includes(q) ||
      (l.admin_email || '').toLowerCase().includes(q) ||
      (l.target_type || '').toLowerCase().includes(q) ||
      JSON.stringify(l.details || {}).toLowerCase().includes(q)
    ) : allLogs;

    mainContent = '<div class="admin-panel">' +
      '<div class="admin-toolbar">' +
        '<div class="admin-search-box admin-search-wide">' +
          '<input id="admin-audit-search" value="' + esc(state.adminAuditSearch || '') + '" placeholder="Search action, admin actor, target, or metadata…" autocomplete="off">' +
          '<span class="admin-result-count">' + logs.length + ' events</span>' +
        '</div>' +
      '</div>' +
      (logs.length ? '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Timestamp</th><th>Admin Actor</th><th>Action</th><th>Target</th><th>Client IP</th><th>Metadata</th></tr></thead><tbody>' +
        logs.map(l => '<tr>' +
          '<td class="admin-num"><small>' + new Date(l.created_at).toLocaleString() + '</small></td>' +
          '<td><strong>' + esc(l.admin_name || ('Admin #' + l.admin_id)) + '</strong><br><small class="admin-muted">' + esc(l.admin_email || '') + '</small></td>' +
          '<td><span class="badge badge-info">' + esc(formatAuditAction(l.action)) + '</span></td>' +
          '<td><strong>' + esc(l.target_type) + '</strong> <span class="admin-muted">#' + esc(l.target_id || '-') + '</span></td>' +
          '<td><code class="admin-ip">' + esc(l.ip_address || '127.0.0.1') + '</code></td>' +
          '<td>' + formatAuditMeta(l.details) + '</td>' +
        '</tr>').join('') +
      '</tbody></table></div>' : '<div class="admin-empty-inline">No audit events match your search.</div>') +
    '</div>';
  }

  return '<div class="admin-shell">' +
    sidebar +
    '<main class="admin-main">' +
      '<header class="admin-topbar">' +
        '<div class="admin-topbar-title">' +
          '<h1>' + esc(currentMeta.title) + '</h1>' +
          '<p>' + esc(currentMeta.subtitle) + (state.adminLastSynced ? ' · Synced ' + esc(state.adminLastSynced) : '') + '</p>' +
        '</div>' +
        '<div class="admin-topbar-actions">' +
          (pendingCount > 0 && tab !== 'moderation'
            ? '<button class="btn btn-sm admin-pending-cta" data-action="admin-tab" data-id="moderation">Review ' + pendingCount + ' Pending</button>'
            : '') +
          '<button class="btn btn-outline btn-sm admin-refresh-btn" data-action="admin-refresh" title="Refresh live metrics">Refresh</button>' +
          '<div class="admin-status-pulse"><i></i> Operational</div>' +
        '</div>' +
      '</header>' +
      '<div class="admin-content">' + mainContent + '</div>' +
    '</main>' +
  '</div>';
}

function modal(){
  if(!state.modal) return '';
  let inner = '';
  if(state.modal==='admin-reject-draft'){
    const draft = (state.adminDrafts || []).find(d => d.id === state.selectedDraftId);
    inner='<div class="modal-head"><p class="eyebrow">PARTNER MODERATION</p><h2>Reject application.</h2><p>Please provide a formal rejection reason for '+esc(draft?.applicant_name || 'the applicant')+'.</p></div><form id="admin-reject-form"><label>Rejection reason<textarea name="reason" required placeholder="e.g. Incomplete training credentials or invalid salon trade license" style="min-height:90px"></textarea></label><button class="btn btn-danger full" type="submit">Confirm rejection '+icon('arrow',17)+'</button></form>';
  }
  if(state.modal==='location') inner='<div class="modal-head"><p class="eyebrow">YOUR LOCATION</p><h2>Where should we find you?</h2><p>Discover services and salons around your neighbourhood.</p></div><div class="gg-location-map-bar"><span>Tap anywhere on the map to drop your pin</span><button type="button" class="btn btn-outline btn-sm gg-locate-btn" data-action="map-locate">'+icon('pin',14)+' Use my location</button></div><div id="location-picker-map" class="gg-map-modal" role="region" aria-label="Pick your location on the map"></div><form id="location-form"><label>Enter area or city<input name="location" required value="'+esc(state.location)+'" placeholder="e.g. Bandra West, Mumbai" autofocus></label><button class="btn btn-primary full" type="submit">Save location '+icon('arrow',17)+'</button></form><div class="location-suggestions"><span>POPULAR LOCATIONS</span>'+['Bandra West, Mumbai','Juhu, Mumbai','Khar West, Mumbai','Andheri West, Mumbai'].map(l=>'<button data-action="location-set" data-id="'+l+'">'+icon('pin',16)+l+'</button>').join('')+'</div>';
  else if(state.modal==='date') inner='<div class="modal-head"><p class="eyebrow">PLAN YOUR VISIT</p><h2>Choose a date.</h2><p>Browse salons for the day that suits you.</p></div><div class="date-grid modal-dates">'+dateOptions().map(d=>'<button class="'+(state.salonDate===d.value?'selected':'')+'" data-action="date-set" data-id="'+d.value+'"><span>'+d.day+'</span><strong>'+d.date+'</strong><small>'+d.month+'</small></button>').join('')+'</div>';
  else if(state.modal==='search'){
    const q = state.query.toLowerCase().trim();
    const searchable = [
      ...products.map(x=>({...x,type:'Product'})),
      ...services.map(x=>({...x,type:'Service'})),
      ...salons.map(x=>({...x,type:'Salon'}))
    ];
    const results = searchable.filter(x=>{
      if(!q) return true;
      const hay = [x.name,x.category,x.area,x.brand,x.ingredients,x.tag,x.description].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    }).slice(0,9);
    const popularTerms = ['Serum','Lipstick','Niacinamide','Haircare','Fragrance','Facial'];
    const suggestionsHtml = '<div class="search-chips-wrap"><span class="search-chips-label">'+(q?'TRY SEARCHING':'POPULAR SEARCHES')+'</span><div class="search-chips">'+popularTerms.map(t=>'<button class="search-chip" data-action="search-quick" data-id="'+t+'">'+t+'</button>').join('')+'</div></div>';
    inner='<div class="modal-head"><p class="eyebrow">EXPLORE GLAMGO</p><h2>What are you looking for?</h2></div><div class="search-input">'+icon('search',21)+'<input id="global-search" value="'+esc(state.query)+'" placeholder="Search products, brands, ingredients or services" autocomplete="off" autofocus>'+(state.query?'<button class="search-clear-btn" data-action="search-clear" aria-label="Clear search">'+icon('close',16)+'</button>':'')+'</div>'+(!q?suggestionsHtml:'')+'<div class="search-results">'+(results.length?results.map(x=>'<button data-action="search-result" data-id="'+x.id+'" data-type="'+x.type+'"><span>'+icon(x.type==='Service'?'spark':x.type==='Salon'?'salon':'bag',20)+'</span><div><strong>'+esc(x.name)+'</strong><small>'+x.type+(x.brand?' · '+esc(x.brand):'')+(x.category?' · '+esc(shopCategoryLabel(x.category)):'')+(x.area?' · '+esc(x.area):'')+(x.type==='Product'&&x.price?' · '+money(x.price):'')+'</small></div>'+icon('arrow',17)+'</button>').join(''):'<div class="search-empty-box">'+empty('search','No matches for "'+esc(state.query)+'"','Check spelling or explore popular beauty picks below.')+suggestionsHtml+'<div class="search-noresult-actions"><button class="btn btn-outline btn-sm" data-action="search-clear">Clear search</button><button class="btn btn-primary btn-sm" data-action="shop-all">Browse Beauty Store</button></div></div>')+'</div>';
  }
  else if(state.modal==='booking') inner=bookingModal();
  else if(state.modal==='address') inner='<div class="modal-head"><p class="eyebrow">SAVED ADDRESS</p><h2>Add an address.</h2><p>For home services and thoughtful deliveries.</p></div><form id="address-form"><label>Label<input name="label" required placeholder="Home, Work..."></label><label>Full address<textarea name="text" required placeholder="Street, area, city and postal code"></textarea></label><button class="btn btn-primary full" type="submit">Save address '+icon('arrow',17)+'</button></form>';
  else if(state.modal==='notifications') inner='<div class="modal-head"><p class="eyebrow">YOUR UPDATES</p><h2>Notifications.</h2></div>'+(state.notifications.length?state.notifications.map(n=>'<div class="notification-row">'+icon(n.type==='order'?'bag':'calendar',20)+'<span>'+esc(n.text)+'</span></div>').join(''):empty('bell','All caught up','Your booking and order updates will appear here.'));
  else if(state.modal==='partner-add') inner='<div class="modal-head"><p class="eyebrow">PARTNER STUDIO</p><h2>Add a new listing.</h2><p>Create a draft for your catalogue.</p></div><form id="listing-form"><label>Name<input name="name" required placeholder="Listing name"></label><label>Price (₹)<input name="price" type="number" min="1" required placeholder="Starting price"></label><label>Description<textarea name="description" required placeholder="What makes it special?"></textarea></label><button class="btn btn-primary full" type="submit">Save draft '+icon('arrow',17)+'</button></form>';
  else if(state.modal==='review-add'){
    const options = [
      ...state.bookings.map(b => ({ id: b.service_id || b.id, name: b.title, type: b.type === 'home' ? 'service' : 'salon' })),
      ...state.orders.flatMap(o => (o.items || []).map(i => ({ id: i.id || i.product_id, name: i.name, type: 'product' })))
    ];
    inner='<div class="modal-head"><p class="eyebrow">VERIFIED REVIEW</p><h2>Share your experience.</h2><p>Help other customers choose the best beauty experiences.</p></div><form id="review-form"><label>Select Experience or Product<select name="item_select" required>'+(options.length ? options.map((opt, i) => `<option value="${opt.id}:::${opt.type}">${esc(opt.name)} (${opt.type})</option>`).join('') : '<option value="s1:::service">Signature Glow Facial (service)</option><option value="b1:::product">The Daily Renewal Serum (product)</option>')+'</select></label><label>Rating (1-5 stars)<select name="rating"><option value="5">★★★★★ (5/5 Excellent)</option><option value="4">★★★★☆ (4/5 Great)</option><option value="3">★★★☆☆ (3/5 Average)</option><option value="2">★★☆☆☆ (2/5 Poor)</option><option value="1">★☆☆☆☆ (1/5 Needs improvement)</option></select></label><label>Your review<textarea name="comment" required placeholder="Tell us about the texture, specialist punctuality, or results..."></textarea></label><button class="btn btn-primary full" type="submit">Submit review '+icon('arrow',17)+'</button></form>';
  }
  return '<div class="modal-backdrop"><div class="modal '+(state.modal==='booking'?'booking-modal':'')+'" role="dialog" aria-modal="true" aria-label="GlamGo dialog"><button class="modal-close" data-action="modal-close" aria-label="Close">'+icon('close',21)+'</button>'+inner+'</div></div>';
}

function bookingModal(){
  const b = state.booking, salon = b.type==='salon'?salons.find(x=>x.id===b.itemId):null, service = services.find(x=>x.id===b.serviceId);
  const steps = b.type==='home'?['Service','Professional','Date & time','Confirm']:['Service','Staff','Date & time','Confirm'];
  let body = '';
  if(b.step===0) body='<h3>Choose your service</h3><div class="booking-options">'+(b.type==='home'?services:services.filter(s=>salon&&salon.services.includes(s.category))).map(s=>'<button class="'+(b.serviceId===s.id?'selected':'')+'" data-action="booking-service" data-id="'+s.id+'"><span><strong>'+s.name+'</strong><small>'+s.duration+' · '+s.category+'</small></span><b>'+money(s.price)+'</b></button>').join('')+'</div>';
  if(b.step===1) body='<h3>'+(b.type==='home'?'Choose your professional':'Select a staff member')+'</h3><p class="booking-hint">Choose a specialist, or let us find the best available expert for you.</p><div class="booking-options"><button class="'+(b.professional==='Any available expert'?'selected':'')+'" data-action="booking-pro" data-id="Any available expert"><span><strong>Any available expert</strong><small>We will match you with a trusted professional.</small></span></button>'+professionals.map(p=>'<button class="'+(b.professional===p.name?'selected':'')+'" data-action="booking-pro" data-id="'+p.name+'">'+image(p.img,p.name,'booking-avatar')+'<span><strong>'+p.name+'</strong><small>'+p.specialty+' · '+p.rating+' ★</small></span></button>').join('')+'</div>';
  if(b.step===2) body='<h3>Pick your moment</h3><p class="booking-hint">Available appointments for '+(salon?salon.name:'at-home beauty care')+'.</p><div class="date-grid">'+dateOptions().map(d=>'<button class="'+(b.date===d.value?'selected':'')+'" data-action="booking-date" data-id="'+d.value+'"><span>'+d.day+'</span><strong>'+d.date+'</strong><small>'+d.month+'</small></button>').join('')+'</div><p class="slot-label">AVAILABLE TIMES</p><div class="time-grid">'+['9:00 AM','10:30 AM','12:00 PM','2:00 PM','3:30 PM','5:00 PM'].map(t=>'<button class="'+(b.time===t?'selected':'')+'" data-action="booking-time" data-id="'+t+'">'+t+'</button>').join('')+'</div>';
  if(b.step===3){
    const noticeHtml = state.bookingNotice
      ? '<div class="payment-notice payment-notice-'+esc(state.bookingNotice.type||'error')+'" role="alert"><strong>'+esc(state.bookingNotice.title)+'</strong><p>'+esc(state.bookingNotice.message)+'</p></div>'
      : '';
    body='<h3>Review your booking</h3><div class="booking-review"><div><span>Service</span><strong>'+(service?.name||'Service')+'</strong></div><div><span>Professional</span><strong>'+esc(b.professional)+'</strong></div><div><span>Date & time</span><strong>'+formatDate(b.date)+' · '+b.time+'</strong></div><div><span>Location</span><strong>'+esc(salon?salon.name+', '+salon.area:state.addresses[0]?.text||state.location)+'</strong></div><div><span>Price</span><strong>'+money(service?.price||0)+'</strong></div></div>'+noticeHtml+'<p class="booking-hint">Complete payment to confirm your appointment in My bookings.</p>';
  }
  const confirmLabel = b.step===3
    ? (state.bookingBusy ? 'Processing...' : (state.bookingNotice ? 'Retry payment '+icon('arrow',16) : 'Confirm booking '+icon('check',17)))
    : 'Continue '+icon('arrow',17);
  return '<div class="modal-head"><p class="eyebrow">'+(salon?'SALON APPOINTMENT':'AT-HOME BEAUTY')+'</p><h2>Book a beautiful moment.</h2><p>'+(salon?salon.name:'Expert care in the comfort of home.')+'</p></div><div class="booking-progress">'+steps.map((s,i)=>'<span class="'+(i<=b.step?'active':'')+'"><b>'+(i<b.step?'✓':i+1)+'</b>'+s+'</span>').join('')+'</div><div class="booking-step">'+body+'</div><div class="booking-footer">'+(b.step>0?button('Back','booking-back','btn-outline'):'<span></span>')+button(confirmLabel,b.step===3?'booking-confirm':'booking-next','btn-primary',(b.step===3 && state.bookingBusy)?'disabled aria-disabled="true"':'')+'</div>';
}

function bookingSuccess(){
  const b = state.bookings[0] || { title: 'Service', date: '2026-11-20', time: '10:00 AM', professional: 'Nisha Kapoor', type: 'home' };
  return '<main class="success-page"><div class="success-mark">'+icon('check',34)+'</div><p class="eyebrow">BOOKING CONFIRMED</p><h1>Your moment is <em>all set.</em></h1><p>'+esc(b.title)+' is booked for '+formatDate(b.date)+' at '+b.time+'. We have added the details to your account.</p><div class="success-details"><span>EXPERIENCE <strong>'+(b.type==='home'?'At-home beauty':'Salon & parlour')+'</strong></span><span>PROFESSIONAL <strong>'+esc(b.professional)+'</strong></span></div><div class="success-actions">'+button('View my bookings '+icon('arrow',17),'account-bookings','btn-primary')+button('Keep exploring','landing','btn-outline')+'</div></main>';
}

function render(){
  destroyActiveMaps();
  if(state.view === 'auth' || (!state.signedIn && PROTECTED_VIEWS.has(state.view))){ app.innerHTML = auth(); return; }
  if(state.view === 'onboarding'){ app.innerHTML = onboarding(); return; }
  if(state.view === 'admin'){
    if(state.user?.role !== 'admin'){
      toast('Unauthorized access. Administrator privileges required.');
      state.view = 'landing';
    } else {
      app.innerHTML = adminPage() + modal();
      document.body.classList.toggle('modal-open', !!state.modal);
      return;
    }
  }
  let page = state.view==='landing' ? (state.experience==='home'?homePage():state.experience==='salon'?salonPage():shopPage()) : state.view==='salon-detail'?salonDetail():state.view==='product-detail'?productDetail():state.view==='account'?account():state.view==='cart'?cartPage():state.view==='checkout'?checkoutPage():state.view==='order-success'?orderSuccess():state.view==='tracking'?trackingPage():state.view==='booking-success'?bookingSuccess():state.view==='partner'?partnerPage():homePage();
  app.innerHTML = header() + page + footer() + mobileNav() + modal();
  document.body.classList.toggle('modal-open', !!state.modal);
  requestAnimationFrame(mountSalonMaps);
}

function openBooking(type, itemId, serviceId = null, pro = null){
  if(!requireAuth({ type: 'booking', args: [type, itemId, serviceId, pro] }, 'Sign in to book an appointment')) return;
  const selectedService = serviceId || (type === 'home' ? itemId : null);
  state.pendingBooking = null;
  state.pendingBookingKey = null;
  state.bookingNotice = null;
  state.bookingBusy = false;
  state.booking = {
    type,
    itemId,
    serviceId: selectedService,
    professional: pro || null,
    date: type === 'salon' ? state.salonDate : null,
    time: null,
    step: selectedService ? 1 : 0
  };
  state.modal = 'booking';
  render();
}

let scrollLockUntil = 0;
const addedCartTimers = {};
async function action(el){
  const a = el.dataset.action, id = el.dataset.id;
  if(a==='map-locate'){
    if(!navigator.geolocation){
      toast('Geolocation is not supported in this browser.');
      return;
    }
    toast('Finding your location…');
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        state.userCoords = [lat, lng];
        state.location = await reverseGeocodeCoords(lat, lng);
        render();
        toast('Pinned your current location on the map.');
      },
      () => toast('Location permission denied — tap the map or type your area.')
    );
  }
  else if(a==='onboarding'){ pendingAuthResume=null; state.view='onboarding'; render(); window.scrollTo({top:0,behavior:'instant'}); }
  else if(a==='guest-browse'){ pendingAuthResume=null; state.view=state.experience?'landing':'onboarding'; render(); }
  else if(a==='scroll-onboard'){
    const targetId = el.dataset.target;
    if(state.view !== 'onboarding'){
      state.view = 'onboarding';
      render();
      setTimeout(()=>document.getElementById(targetId)?.scrollIntoView({behavior:'smooth'}),60);
    } else {
      document.getElementById(targetId)?.scrollIntoView({behavior:'smooth'});
    }
  }
  else if(a==='showcase-partner-tab'){
    state.showcasePartnerRole = el.dataset.role || 'Salon Owner';
    render();
  }
  else if(a==='partners-apply'){
    const chosenRole = el.dataset.role || 'Salon Owner';
    state.partnerRole = chosenRole;
    if(!requireAuth({ view: 'partner', partnerRole: chosenRole }, 'Sign in or create an account to open your '+chosenRole+' Studio')) return;
    const mapped = partnerRoleFromUser(state.user?.role);
    if(mapped && mapped === chosenRole){
      state.partnerTab = 'Overview';
    } else if(state.user?.role === 'admin'){
      state.partnerTab = 'Overview';
    } else {
      state.partnerTab = 'Registration';
    }
    navigate('partner');
    loadPartnerData();
  }
  else if(a==='landing'){ state.activeNav='landing'; navigate('landing'); }
  else if(a==='experience') setExperience(id);
  else if(a==='switch-toggle'){
    if(window.innerWidth<=700){ state.mobileMenu=!state.mobileMenu; state.menu=false; }
    else { state.menu=!state.menu; state.mobileMenu=false; }
    render();
  }
  else if(a==='mobile-toggle'){ state.mobileMenu=!state.mobileMenu; render(); }
  else if(a==='location'){ state.modal='location'; render(); }
  else if(a==='location-set'){ state.location=id; state.userCoords=null; state.modal=null; persist(); render(); toast('Location updated'); }
  else if(a==='search-open'){ state.modal='search'; state.query=''; render(); setTimeout(()=>document.getElementById('global-search')?.focus(),20); }
  else if(a==='search-quick'){
    state.query = id || '';
    render();
    const input = document.getElementById('global-search');
    if(input){ input.focus(); const len = input.value.length; input.setSelectionRange(len, len); }
  }
  else if(a==='search-clear'){
    state.query = '';
    render();
    document.getElementById('global-search')?.focus();
  }
  else if(a==='search-result'){
    state.modal=null;
    if(el.dataset.type==='Salon'){ state.experience='salon'; state.selectedSalon=id; navigate('salon-detail'); }
    else if(el.dataset.type==='Product'){ state.experience='shop'; state.selectedProduct=id; state.productVariant=null; state.pdpTab='details'; navigate('product-detail'); ensureProductExtras(id); }
    else { state.experience='home'; openBooking('home',id); }
    persist();
  }
  else if(a==='scroll'){
    const target = el.dataset.target;
    state.activeNav = target || 'landing';
    scrollLockUntil = Date.now() + 700;
    if(state.view!=='landing'){
      navigate('landing');
      setTimeout(()=>document.getElementById(target)?.scrollIntoView({behavior:'smooth'}),80);
    } else {
      syncSubnavActive();
      document.getElementById(target)?.scrollIntoView({behavior:'smooth'});
    }
  }
  else if(a==='shop-all'){
    state.modal=null;
    state.experience='shop';
    state.shopCategory='All';
    state.shopCollection='All';
    state.shopBrand='All';
    state.sort='featured';
    state.activeNav='landing';
    scrollLockUntil = Date.now() + 700;
    persist();
    if(state.view!=='landing') navigate('landing'); else render();
    window.scrollTo({top:0,behavior:'smooth'});
  }
  else if(a==='explore-bestsellers'){
    state.experience='shop';
    state.shopCategory='All';
    state.shopCollection='BESTSELLER';
    state.activeNav='bestsellers';
    scrollLockUntil = Date.now() + 800;
    persist();
    navigate('landing');
    setTimeout(()=>document.getElementById('bestsellers')?.scrollIntoView({behavior:'smooth'}),80);
  }
  else if(a==='home-category'){ state.homeCategory=id; state.activeNav='popular'; state.view='landing'; render(); document.getElementById('popular')?.scrollIntoView({behavior:'smooth'}); }
  else if(a==='salon-category'){ state.salonCategory=id; state.activeNav='salons'; state.view='landing'; render(); document.getElementById('salons')?.scrollIntoView({behavior:'smooth'}); }
  else if(a==='shop-category'){
    state.experience='shop';
    state.shopCategory=id || 'All';
    state.activeNav = el.closest('#shop-categories') ? 'categories' : 'bestsellers';
    scrollLockUntil = Date.now() + 700;
    persist();
    if(state.view!=='landing') navigate('landing'); else render();
    setTimeout(()=>document.getElementById('bestsellers')?.scrollIntoView({behavior:'smooth'}),80);
  }
  else if(a==='shop-collection'){
    const col = el.dataset.collection || id || 'All';
    const fromSubnav = Boolean(el.closest('.subnav'));
    state.experience='shop';
    state.shopCollection = (!fromSubnav && state.shopCollection === col && col !== 'All') ? 'All' : col;
    state.activeNav = state.shopCollection === 'NEW' ? 'new-arrivals' : 'bestsellers';
    scrollLockUntil = Date.now() + 700;
    persist();
    if(state.view!=='landing') navigate('landing'); else render();
    if(fromSubnav || el.dataset.target) setTimeout(()=>document.getElementById(el.dataset.target||'bestsellers')?.scrollIntoView({behavior:'smooth'}),80);
  }
  else if(a==='shop-brand'){
    state.experience='shop';
    const nextBrand = (!el.classList.contains('pdp-brand-link') && state.shopBrand === id && id !== 'All') ? 'All' : (id || 'All');
    state.shopBrand = nextBrand;
    state.activeNav = 'bestsellers';
    scrollLockUntil = Date.now() + 700;
    persist();
    if(state.view!=='landing') navigate('landing'); else render();
    setTimeout(()=>document.getElementById('bestsellers')?.scrollIntoView({behavior:'smooth'}),80);
  }
  else if(a==='shop-sort-reset'){
    state.sort='featured';
    render();
  }
  else if(a==='shop-reset'){
    state.shopCategory='All';
    state.shopCollection='All';
    state.shopBrand='All';
    state.sort='featured';
    state.activeNav='bestsellers';
    scrollLockUntil = Date.now() + 700;
    persist();
    render();
    document.getElementById('bestsellers')?.scrollIntoView({behavior:'smooth'});
  }
  else if(a==='chapter-select'){
    const idx = Number(el.dataset.step || 0);
    chapterClickLockUntil = Date.now() + 900;
    setActiveChapter(idx);
  }
  else if(a==='book-home') openBooking('home',id);
  else if(a==='book-pro') openBooking('home',null,null,professionals.find(p=>p.id===id)?.name);
  else if(a==='salon-detail'){ state.selectedSalon=id; navigate('salon-detail'); }
  else if(a==='book-salon') openBooking('salon',id,el.dataset.service?services.find(s=>s.category===el.dataset.service)?.id:null);
  else if(a==='salon-date'){ state.modal='date'; render(); }
  else if(a==='date-set'){ state.salonDate=id; state.modal=null; render(); toast('Visit date selected'); }
  else if(a==='product-detail'){
    state.selectedProduct=id;
    state.productVariant=null;
    state.pdpTab='details';
    navigate('product-detail');
    ensureProductExtras(id);
  }
  else if(a==='variant'){ state.productVariant=id; render(); }
  else if(a==='pdp-tab'){ state.pdpTab=id||'details'; if(state.pdpTab==='reviews'&&state.selectedProduct) ensureProductExtras(state.selectedProduct); render(); }
  else if(a==='pdp-reviews-jump'){
    state.pdpTab='reviews';
    if(state.selectedProduct) ensureProductExtras(state.selectedProduct);
    render();
    setTimeout(()=>document.getElementById('pdp-tab-panel')?.scrollIntoView({behavior:'smooth',block:'nearest'}),50);
  }
  else if(a==='apply-pdp-coupon'){
    state.coupon = el.dataset.code || 'GLAM10';
    persist();
    render();
    toast('Code GLAM10 saved for checkout');
  }
  else if(a==='wish'){
    state.wishlist = state.wishlist.includes(id) ? state.wishlist.filter(x=>x!==id) : [...state.wishlist,id];
    persist();
    render();
    toast(state.wishlist.includes(id)?'Saved to your wishlist':'Removed from wishlist');
  }
  else if(a==='retry-catalog'){
    await loadCatalogFeeds();
    render();
    return;
  }
  else if(a==='add-cart'){
    const prod = products.find(p => p.id === id);
    if(!prod) return;
    const chosenVariant = el.dataset.variant || (state.selectedProduct === id && state.productVariant) || prod?.variants?.[0] || '';
    const chosenListingId = el.dataset.listing ? Number(el.dataset.listing) : ((chosenVariant && prod.variant_listings?.[chosenVariant]) || prod.default_listing_id || null);
    if(getStockInfo(prod, chosenVariant).soldOut || prod.in_stock === false || prod.soldOut === true) return;
    const cartKey = makeCartKey(id, chosenVariant, chosenListingId);
    state.cart[cartKey] = (state.cart[cartKey] || 0) + 1;
    invalidateCheckoutState(true);
    if(chosenVariant){
      if(!state.cartVariants) state.cartVariants = {};
      state.cartVariants[id] = chosenVariant;
    }
    state.addedCartIds = { ...(state.addedCartIds || {}), [id]: true };
    clearTimeout(addedCartTimers[id]);
    addedCartTimers[id] = setTimeout(() => {
      if(state.addedCartIds?.[id]){
        delete state.addedCartIds[id];
        document.querySelectorAll('.add-bag-btn[data-id="'+id+'"]').forEach(btn => {
          btn.classList.remove('added');
          btn.textContent = 'Add to Bag';
        });
      }
    }, 1500);
    persist();
    render();
    toast('Added to your beauty bag');
  }
  else if(a==='buy-now'){
    const prod = products.find(p => p.id === id);
    if(!prod) return;
    const chosenVariant = el.dataset.variant || (state.selectedProduct === id && state.productVariant) || prod?.variants?.[0] || '';
    const chosenListingId = el.dataset.listing ? Number(el.dataset.listing) : ((chosenVariant && prod.variant_listings?.[chosenVariant]) || prod.default_listing_id || null);
    if(getStockInfo(prod, chosenVariant).soldOut || prod.in_stock === false || prod.soldOut === true) return;
    const cartKey = makeCartKey(id, chosenVariant, chosenListingId);
    state.cart[cartKey] = (state.cart[cartKey] || 0) + 1;
    invalidateCheckoutState(true);
    if(chosenVariant){
      if(!state.cartVariants) state.cartVariants = {};
      state.cartVariants[id] = chosenVariant;
    }
    persist();
    if(!requireAuth({ view: 'checkout' }, 'Sign in to proceed to checkout')) return;
    navigate('checkout');
    ensureCheckoutReservation();
  }
  else if(a==='cart') navigate('cart');
  else if(a==='cart-remove'){
    delete state.cart[id];
    const parsedRm = parseCartKey(id);
    if(state.cartVariants) delete state.cartVariants[parsedRm.productId];
    invalidateCheckoutState(true);
    persist();
    render();
  }
  else if(a==='cart-qty'){
    state.cart[id] = Math.max(0,(state.cart[id]||0)+Number(el.dataset.delta));
    if(!state.cart[id]){
      delete state.cart[id];
      const parsedQty = parseCartKey(id);
      if(state.cartVariants) delete state.cartVariants[parsedQty.productId];
    }
    invalidateCheckoutState(true);
    persist();
    render();
  }
  else if(a==='checkout'){
    if(!requireAuth({ view: 'checkout' }, 'Sign in to proceed to checkout')) return;
    navigate('checkout');
    ensureCheckoutReservation();
  }
  else if(a==='payment'){ state.checkoutPayment=id; state.paymentNotice=null; render(); }
  else if(a==='place-order'){
    if(state.checkoutBusy) return;
    if(!requireAuth({ view: 'checkout' }, 'Sign in to place your order')) return;
    if(!state.addresses.length){
      state.modal='address';
      render();
      toast('Add a delivery address first');
      return;
    }
    const selIdx = Number(document.getElementById('checkout-address')?.value ?? state.selectedCheckoutAddressIdx ?? 0);
    state.selectedCheckoutAddressIdx = selIdx;
    const addr = state.addresses[selIdx] || state.addresses[0];
    const entries = getCartEntries();
    if(!entries.length){
      toast('Your bag is empty or catalog data is unavailable.');
      return;
    }
    const isCod = state.checkoutPayment === 'Cash on delivery';
    const itemsFingerprint = entries.map(e => ({ k: e.key, q: e.qty })).sort((a, b) => a.k.localeCompare(b.k));
    const fingerprint = JSON.stringify({
      items: itemsFingerprint,
      coupon: state.coupon || '',
      addr: (addr.label || '') + '|' + (addr.text || ''),
      mode: isCod ? 'cod' : 'online'
    });
    state.checkoutBusy = true;
    state.paymentNotice = null;
    render();
    try {
      let order;
      if (state.pendingCheckoutOrder && state.pendingCheckoutOrder.fingerprint === fingerprint && state.pendingCheckoutOrder.order?.status !== 'cancelled') {
        order = state.pendingCheckoutOrder.order;
      } else {
        const resData = await ensureCheckoutReservation();
        if (!resData || !resData.reservation_token) {
          state.paymentNotice = {
            type: 'error',
            title: 'Inventory reservation failed',
            message: (state.pendingReservation?.error || 'Could not reserve selected items from seller inventory.') + ' Your bag selection is preserved.'
          };
          toast(state.pendingReservation?.error || 'Could not reserve stock');
          return;
        }
        if (!state.pendingCheckoutKey || state.pendingCheckoutOrder?.fingerprint !== fingerprint) {
          state.pendingCheckoutKey = 'ord-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
          state.pendingPaymentKey = 'pay-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
        }
        order = await apiMultiVendorCheckout({
          reservation_token: resData.reservation_token,
          address_label: addr.label,
          address_text: addr.text,
          payment_method: state.checkoutPayment,
          coupon_code: state.coupon || null,
          idempotency_key: state.pendingCheckoutKey
        });
        state.pendingCheckoutOrder = { fingerprint, order };
      }

      if (isCod) {
        try {
          const freshOrders = await apiGetMyOrders();
          state.orders = freshOrders;
        } catch {
          if (!state.orders.some(o => o.id === order.id)) state.orders.unshift(order);
        }
        state.notifications.unshift({ type: 'order', text: `Your order ${order.id} is confirmed (Cash on Delivery).` });
        state.cart = {};
        state.cartVariants = {};
        state.coupon = '';
        state.couponDiscount = 0;
        invalidateCheckoutState(true);
        persist();
        navigate('order-success');
        return;
      }

      const rzpReady = await ensureRazorpayLoaded();
      if (!rzpReady || typeof window.Razorpay !== 'function') {
        state.paymentNotice = {
          type: 'error',
          title: 'Payment window unavailable',
          message: 'The payment script did not load. Please check your connection and retry payment, or switch to Cash on delivery. Your bag has been preserved.'
        };
        toast('Payment gateway script unavailable. Your bag is saved.');
        render();
        return;
      }

      if (!state.pendingPaymentKey) {
        state.pendingPaymentKey = 'pay-' + order.id + '-' + Date.now();
      }
      const payOrder = await apiCreatePaymentOrder(order.total, order.id, null, state.pendingPaymentKey);
      let terminalOutcome = false;
      const rzp = new window.Razorpay({
        key: payOrder.key_id || import.meta.env?.VITE_RAZORPAY_KEY_ID,
        amount: payOrder.amount_paise ?? Math.round(payOrder.amount * 100),
        currency: payOrder.currency || 'INR',
        name: 'GlamGo Luxury Beauty',
        description: `Order #${order.id}`,
        order_id: payOrder.razorpay_order_id,
        prefill: {
          name: state.user?.name || '',
          email: state.user?.email || '',
          contact: state.user?.phone || ''
        },
        theme: { color: '#1E1C1A' },
        handler: async function (response) {
          terminalOutcome = true;
          try {
            const verifyRes = await apiVerifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id: order.id
            });
            if (
              verifyRes?.payment_status === 'refunded_oos'
              || verifyRes?.payment_status === 'refund_pending_oos'
              || verifyRes?.payment_status === 'refunded'
              || verifyRes?.success !== true
              || verifyRes?.payment_status !== 'completed'
            ) {
              try {
                state.orders = await apiGetMyOrders();
              } catch {}
              const isRefundDone = verifyRes?.payment_status === 'refunded_oos' || verifyRes?.payment_status === 'refunded';
              const isOosPending = verifyRes?.payment_status === 'refund_pending_oos';
              const refNote = verifyRes?.refund_id ? ` (Ref: ${verifyRes.refund_id})` : '';
              state.paymentNotice = {
                type: isOosPending ? 'warn' : 'error',
                title: isRefundDone
                  ? 'Order cancelled — automatic full refund completed'
                  : (isOosPending
                    ? 'Order cancelled — automatic full refund in progress'
                    : 'Payment not confirmed as fulfillable'),
                message: (verifyRes?.message || 'Please review your bag and orders before trying again.') + refNote
              };
              state.pendingCheckoutOrder = null;
              state.pendingReservation = null;
              state.pendingPaymentKey = null;
              state.checkoutBusy = false;
              persist();
              render();
              toast(isRefundDone ? 'Order out of stock; full refund completed.' : 'Order cancelled; automatic refund in progress.');
              return;
            }
            try {
              const freshOrders = await apiGetMyOrders();
              state.orders = freshOrders;
            } catch {
              const paidOrder = { ...order, payment_status: 'completed', razorpay_order_id: payOrder.razorpay_order_id };
              if (!state.orders.some(o => o.id === order.id)) state.orders.unshift(paidOrder);
            }
            state.notifications.unshift({ type: 'order', text: `Your order ${order.id} is confirmed & paid.` });
            state.cart = {};
            state.cartVariants = {};
            state.coupon = '';
            state.couponDiscount = 0;
            invalidateCheckoutState(true);
            state.checkoutBusy = false;
            persist();
            navigate('order-success');
            toast('Payment verified and order confirmed!');
          } catch (verifyErr) {
            state.paymentNotice = {
              type: 'error',
              title: 'Payment verification failed',
              message: (verifyErr.message || 'We could not verify your payment with the gateway.') + ' Your bag remains saved — retry payment or contact support with order #' + order.id + '.'
            };
            state.checkoutBusy = false;
            persist();
            render();
            toast(verifyErr.message || 'Payment verification failed');
          }
        },
        modal: {
          ondismiss: function() {
            if (terminalOutcome) return;
            state.paymentNotice = {
              type: 'warn',
              title: 'Payment cancelled',
              message: 'You closed the payment window before completing payment. Your bag is preserved — click Retry payment whenever you are ready.'
            };
            state.checkoutBusy = false;
            persist();
            render();
            toast('Payment cancelled. Your bag is saved.');
          }
        }
      });
      if (typeof rzp.on === 'function') {
        rzp.on('payment.failed', function (failureResp) {
          terminalOutcome = true;
          const desc = failureResp?.error?.description || 'Payment was declined or interrupted.';
          state.paymentNotice = {
            type: 'error',
            title: 'Payment failed',
            message: desc + ' Your bag is still saved — please retry or choose another payment method.'
          };
          state.checkoutBusy = false;
          persist();
          render();
          toast('Payment failed. Please retry.');
        });
      }
      rzp.open();
    } catch (err) {
      state.paymentNotice = {
        type: 'error',
        title: 'Unable to complete checkout',
        message: (err.message || 'Payment initiation failed.') + ' Your bag has been preserved — please try again.'
      };
      toast(err.message || 'Unable to start payment');
      render();
    } finally {
      state.checkoutBusy = false;
      render();
    }
  }
  else if(a==='tracking'){ state.trackingId=id; navigate('tracking'); }
  else if(a==='return-request'){
    const suborderId = el.dataset.suborder;
    const itemId = parseInt(el.dataset.item, 10);
    const maxQty = parseInt(el.dataset.qty || '1', 10) || 1;
    let retQty = 1;
    if (maxQty > 1) {
      const qStr = prompt(`How many units are you returning? (1 to ${maxQty})`, String(maxQty));
      if (qStr === null) return;
      const parsedQty = parseInt(qStr, 10);
      if (!parsedQty || parsedQty < 1 || parsedQty > maxQty) {
        toast(`Please enter a valid quantity between 1 and ${maxQty}`);
        return;
      }
      retQty = parsedQty;
    }
    const reason = prompt('Please specify reason for return (e.g. Damaged in transit, Defective formula, Wrong shade, Unopened return):');
    if(!reason || !reason.trim()) return;
    const explanation = prompt('Additional details / notes for the seller (optional):') || '';
    try {
      await apiSubmitReturnRequest(suborderId, itemId, reason.trim(), explanation.trim(), '', retQty);
      toast('Return request submitted to the merchant for inspection & refund.');
      const myOrders = await apiGetMyOrders();
      state.orders = myOrders;
      persist();
      render();
    } catch(err) {
      toast(err.message || 'Failed to submit return request');
    }
  }
  else if(a==='account' || a==='account-bookings' || a==='orders' || a==='wishlist' || a==='support'){
    const tabMap = { account: 'Overview', 'account-bookings': 'My bookings', orders: 'My orders', wishlist: 'Wishlist', support: 'Customer support' };
    const targetTab = tabMap[a];
    if(!requireAuth({ view: 'account', accountTab: targetTab }, 'Sign in to access your account')) return;
    state.accountTab = targetTab;
    navigate('account');
  }
  else if(a==='account-tab'){ state.accountTab=id; render(); }
  else if(a==='booking-cancel'){
    if(!requireAuth({ view: 'account', accountTab: 'My bookings' }, 'Sign in to manage bookings')) return;
    if(confirm('Are you sure you wish to cancel this appointment?')){
      try {
        const updated = await apiUpdateBookingStatus(id, 'cancelled');
        const idx = state.bookings.findIndex(b => b.id === id);
        if(idx !== -1) state.bookings[idx] = updated;
        persist();
        render();
        toast('Appointment cancelled');
      } catch (err) {
        toast('Failed to cancel appointment: ' + (err.message || 'Server error'));
      }
    }
  }
  else if(a==='notifications'){ state.modal='notifications'; render(); }
  else if(a==='address-add'){ state.modal='address'; render(); }
  else if(a==='address-delete'){
    const addrObj = state.addresses[Number(id)];
    if(addrObj?.id){
      try {
        await apiDeleteAddress(addrObj.id);
        state.addresses.splice(Number(id),1);
        persist();
        render();
        toast('Address removed');
      } catch (err) {
        toast('Failed to remove address: ' + (err.message || 'Server error'));
      }
    } else {
      state.addresses.splice(Number(id),1);
      persist();
      render();
      toast('Address removed');
    }
  }
  else if(a==='logout'){
    tokenStorage.remove();
    tokenStorage.removeRefresh();
    pendingAuthResume = null;
    state.signedIn = false;
    state.view = 'auth';
    persist();
    render();
    toast('Signed out');
  }
  else if(a==='auth-toggle'){ state.authMode=state.authMode==='signin'?'signup':'signin'; render(); }
  else if(a==='partners'){
    const chosenRole = state.partnerRole || 'Salon Owner';
    if(!requireAuth({ view: 'partner', partnerRole: chosenRole }, 'Sign in to access your Partner Studio')) return;
    const mapped = partnerRoleFromUser(state.user?.role);
    if (mapped) {
      state.partnerRole = mapped;
      state.partnerTab = 'Overview';
    } else if (state.user?.role === 'admin') {
      state.partnerTab = 'Overview';
    } else {
      state.partnerTab = 'Registration';
    }
    navigate('partner');
    loadPartnerData();
  }
  else if(a==='partner-role'){
    state.partnerRole=id;
    state.partnerTab='Overview';
    render();
    loadPartnerData();
  }
  else if(a==='partner-tab'){
    state.partnerTab=id;
    state.partnerBookingFilter='ALL';
    state.partnerOrderFilter='ALL';
    render();
    loadPartnerData();
  }
  else if(a==='partner-refresh'){
    await loadPartnerData();
    toast('Studio metrics refreshed');
  }
  else if(a==='partner-booking-filter'){
    state.partnerBookingFilter = id;
    render();
  }
  else if(a==='partner-order-filter'){
    state.partnerOrderFilter = id;
    render();
  }
  else if(a==='partner-pro-assign-service'){
    const sEl = document.getElementById('partner-service-select');
    if(sEl && sEl.value){
      try {
        await apiAssignProfessionalService(sEl.value);
        toast('Service assigned to your profile');
        await loadPartnerData();
      } catch(err) {
        toast(err.message || 'Failed to assign service');
      }
    }
  }
  else if(a==='partner-pro-unlink-service'){
    try {
      await apiUnlinkProfessionalService(id);
      toast('Service unlinked');
      await loadPartnerData();
    } catch(err) {
      toast(err.message || 'Failed to unlink service');
    }
  }
  else if(a==='partner-pro-complete'){
    try {
      await apiUpdateProfessionalBookingStatus(id, 'completed');
      toast('Appointment marked completed');
      await loadPartnerData();
    } catch(err) {
      toast(err.message || 'Failed to complete appointment');
    }
  }
  else if(a==='partner-pro-cancel'){
    try {
      await apiUpdateProfessionalBookingStatus(id, 'cancelled');
      toast('Appointment cancelled & refund queued');
      await loadPartnerData();
    } catch(err) {
      toast(err.message || 'Failed to cancel appointment');
    }
  }
  else if(a==='partner-salon-complete'){
    try {
      await apiUpdateSalonBookingStatus(id, 'completed');
      toast('Salon appointment marked completed');
      await loadPartnerData();
    } catch(err) {
      toast(err.message || 'Failed to complete appointment');
    }
  }
  else if(a==='partner-salon-cancel'){
    try {
      await apiUpdateSalonBookingStatus(id, 'cancelled');
      toast('Salon appointment cancelled & refund queued');
      await loadPartnerData();
    } catch(err) {
      toast(err.message || 'Failed to cancel appointment');
    }
  }
  else if(a==='partner-staff-delete'){
    try {
      await apiDeleteSalonStaff(id);
      toast('Staff member removed from salon');
      await loadPartnerData();
    } catch(err) {
      toast(err.message || 'Failed to remove staff member');
    }
  }
  else if(a==='partner-stock-update'){
    const stInput = document.getElementById(`stock-input-${id}`);
    if(stInput){
      try {
        await apiUpdateSellerStock(id, Number(stInput.value));
        toast('Stock updated');
        await loadPartnerData();
      } catch(err) {
        toast(err.message || 'Failed to update stock');
      }
    }
  }
  else if(a==='partner-order-pack'){
    try {
      await apiUpdateSellerOrderStatus(id, 'packed');
      toast('Order status updated: Packed');
      await loadPartnerData();
    } catch(err) {
      toast(err.message || 'Failed to update order');
    }
  }
  else if(a==='partner-order-ship'){
    try {
      await apiUpdateSellerOrderStatus(id, 'in_transit');
      toast('Order status updated: In Transit');
      await loadPartnerData();
    } catch(err) {
      toast(err.message || 'Failed to update order');
    }
  }
  else if(a==='partner-order-deliver'){
    try {
      await apiUpdateSellerOrderStatus(id, 'delivered');
      toast('Order status updated: Delivered');
      await loadPartnerData();
    } catch(err) {
      toast(err.message || 'Failed to update order');
    }
  }
  else if(a==='partner-suborder-pack'){
    try {
      await apiPackSellerSuborder(id);
      toast('Suborder status updated: Packed');
      await loadPartnerData();
    } catch(err) {
      toast(err.message || 'Failed to pack suborder');
    }
  }
  else if(a==='partner-suborder-ship'){
    const carrier = prompt('Enter courier / logistics partner name:', 'BlueDart Express') || 'BlueDart Express';
    const tracking = prompt('Enter consignment tracking AWB number:', 'BLU' + Math.floor(10000000 + Math.random() * 90000000));
    if(!tracking || !tracking.trim()) return;
    const trackingUrl = `https://track.example.com/${encodeURIComponent(tracking.trim())}`;
    try {
      await apiShipSellerSuborder(id, carrier.trim(), tracking.trim(), trackingUrl);
      toast('Suborder dispatched in transit with tracking details');
      await loadPartnerData();
    } catch(err) {
      toast(err.message || 'Failed to ship suborder');
    }
  }
  else if(a==='partner-suborder-deliver'){
    try {
      await apiDeliverSellerSuborder(id);
      toast('Suborder delivered. Escrow maturity initiated.');
      await loadPartnerData();
    } catch(err) {
      toast(err.message || 'Failed to deliver suborder');
    }
  }
  else if(a==='partner-return-approve'){
    const restock = confirm('Approve return and initiate customer refund?\n\nPress OK to restock item back into inventory, or Cancel to approve refund without restocking.');
    try {
      const res = await apiDecideSellerReturn(id, 'APPROVE', restock);
      toast(res?.status === 'REFUNDED' ? 'Return approved & gateway refund completed.' : `Return updated: ${res?.status || 'REFUND_PENDING'} (${res?.refund_status || 'PENDING'})`);
      await loadPartnerData();
    } catch(err) {
      toast(err.message || 'Failed to approve return');
    }
  }
  else if(a==='partner-return-reject'){
    const reason = prompt('Please specify the reason for rejecting this return:');
    if(!reason || !reason.trim()) return;
    try {
      await apiDecideSellerReturn(id, 'REJECT', false, reason.trim());
      toast('Return request rejected.');
      await loadPartnerData();
    } catch(err) {
      toast(err.message || 'Failed to reject return');
    }
  }
  else if(a==='partner-listing-update'){
    const priceInput = document.getElementById(`listing-price-${id}`);
    const stockInput = document.getElementById(`listing-stock-${id}`);
    if(priceInput && stockInput){
      try {
        await apiUpdateSellerListing(id, {
          price: parseFloat(priceInput.value),
          stock: parseInt(stockInput.value, 10)
        });
        toast('Listing updated successfully');
        await loadPartnerData();
      } catch(err) {
        toast(err.message || 'Failed to update listing');
      }
    }
  }
  else if(a==='admin'){
    if(state.user?.role !== 'admin'){
      toast('Unauthorized access. Administrator privileges required.');
      return;
    }
    state.view = 'admin';
    state.adminTab = 'overview';
    window.location.hash = 'admin';
    render();
    loadAdminData();
  }
  else if(a==='admin-tab'){
    state.adminTab = id;
    render();
  }
  else if(a==='admin-refresh'){
    await loadAdminData();
    toast('Admin telemetry refreshed');
  }
  else if(a==='admin-jump-users'){
    state.adminTab = 'users';
    state.adminUserFilter = id || 'ALL';
    state.adminUserSearch = '';
    render();
  }
  else if(a==='admin-draft-filter'){
    state.adminDraftFilter = id;
    render();
  }
  else if(a==='admin-user-filter'){
    state.adminUserFilter = id;
    render();
  }
  else if(a==='admin-booking-filter'){
    state.adminBookingFilter = id;
    render();
  }
  else if(a==='admin-order-filter'){
    state.adminOrderFilter = id;
    render();
  }
  else if(a==='admin-approve-draft'){
    try {
      const res = await apiApprovePartnerDraft(Number(id));
      const idx = (state.adminDrafts || []).findIndex(d => d.id === Number(id));
      if (idx !== -1) state.adminDrafts[idx] = res;
      toast('Partner application approved & user promoted!');
      const [uRes, aRes] = await Promise.allSettled([apiGetAdminUsers(), apiGetAuditLogs(null, 50, 0)]);
      if (uRes.status === 'fulfilled') state.adminUsers = uRes.value;
      if (aRes.status === 'fulfilled') state.adminAuditLogs = aRes.value;
      render();
    } catch (err) {
      toast('Failed to approve draft: ' + (err.message || 'Server error'));
    }
  }
  else if(a==='admin-reject-draft'){
    state.selectedDraftId = Number(id);
    state.modal = 'admin-reject-draft';
    render();
  }
  else if(a==='admin-toggle-user'){
    try {
      const updated = await apiToggleUserStatus(Number(id));
      const idx = state.adminUsers.findIndex(u => u.id === Number(id));
      if (idx !== -1) state.adminUsers[idx] = updated;
      toast(`User status updated: ${updated.is_active ? 'Active' : 'Suspended'}`);
      try {
        state.adminAuditLogs = await apiGetAuditLogs(null, 50, 0);
      } catch {}
      render();
    } catch (err) {
      toast('Failed to update user status: ' + (err.message || 'Error'));
    }
  }
  else if(a==='review-add'){ state.modal='review-add'; render(); }
  else if(a==='partner-tab'){ state.partnerTab=id; render(); }
  else if(a==='partner-add'){ state.modal='partner-add'; render(); }
  else if(a==='availability'){
    try {
      const updated = await apiToggleAvailability(id);
      state.availability = updated;
    } catch {
      state.availability = state.availability.includes(id) ? state.availability.filter(d=>d!==id) : [...state.availability,id];
    }
    persist();
    render();
  }
  else if(a==='modal-close'){ state.modal=null; render(); }
  else if(a==='booking-service'){ state.booking.serviceId=id; render(); }
  else if(a==='booking-pro'){ state.booking.professional=id; render(); }
  else if(a==='booking-date'){ state.booking.date=id; render(); }
  else if(a==='booking-time'){ state.booking.time=id; render(); }
  else if(a==='booking-back'){ state.booking.step--; render(); }
  else if(a==='booking-next'){
    const b = state.booking;
    if(b.step===0&&!b.serviceId||b.step===1&&!b.professional||b.step===2&&(!b.date||!b.time)){
      toast('Please make a selection to continue');
      return;
    }
    b.step++;
    render();
  }
  else if(a==='booking-confirm'){
    if(state.bookingBusy) return;
    if(!requireAuth({ view: state.experience ? 'landing' : 'onboarding' }, 'Sign in to confirm your booking')) return;
    const b = state.booking;
    const s = services.find(x => x.id === b.serviceId);
    const salon = salons.find(x => x.id === b.itemId);
    const payload = {
      type: b.type,
      service_id: b.serviceId,
      professional: b.professional,
      salon_id: salon ? salon.id : null,
      date: b.date,
      time: b.time,
      location: salon ? `${salon.name}, ${salon.area}` : (state.addresses[0]?.text || state.location)
    };
    const fingerprint = JSON.stringify(payload);
    state.bookingBusy = true;
    state.bookingNotice = null;
    render();
    try {
      let booked;
      if (state.pendingBooking && state.pendingBooking.fingerprint === fingerprint) {
        booked = state.pendingBooking.booked;
      } else {
        if (!state.pendingBookingKey || state.pendingBooking?.fingerprint !== fingerprint) {
          state.pendingBookingKey = 'bkg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
        }
        booked = await apiCreateBooking({ ...payload, idempotency_key: state.pendingBookingKey });
        state.pendingBooking = { fingerprint, booked };
      }

      if (booked.price > 0) {
        const rzpReady = await ensureRazorpayLoaded();
        if (!rzpReady || typeof window.Razorpay !== 'function') {
          state.bookingNotice = {
            type: 'error',
            title: 'Payment window unavailable',
            message: 'The payment gateway script failed to load. Please retry.'
          };
          toast('Payment window unavailable. Please retry.');
          return;
        }
        const payOrder = await apiCreatePaymentOrder(booked.price, null, booked.id);
        let terminalOutcome = false;
        const rzp = new window.Razorpay({
          key: payOrder.key_id || import.meta.env?.VITE_RAZORPAY_KEY_ID,
          amount: payOrder.amount_paise ?? Math.round(payOrder.amount * 100),
          currency: payOrder.currency || 'INR',
          name: 'GlamGo Luxury Beauty',
          description: `Appointment #${booked.id} (${s?.name || 'Service'})`,
          order_id: payOrder.razorpay_order_id,
          prefill: {
            name: state.user?.name || '',
            email: state.user?.email || '',
            contact: state.user?.phone || ''
          },
          theme: { color: '#1E1C1A' },
          handler: async function (response) {
            terminalOutcome = true;
            try {
              const bVerify = await apiVerifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                booking_id: booked.id
              });
              if (bVerify?.success !== true) {
                throw new Error(bVerify?.message || 'Booking payment could not be confirmed.');
              }
              const paidBooking = { ...booked, payment_status: 'completed', razorpay_order_id: payOrder.razorpay_order_id };
              if (!state.bookings.some(item => item.id === booked.id)) state.bookings.unshift(paidBooking);
              state.notifications.unshift({ type: 'booking', text: `Your ${s?.name||'service'} appointment #${booked.id} is confirmed & paid.` });
              state.modal = null;
              state.pendingBooking = null;
              state.pendingBookingKey = null;
              state.bookingNotice = null;
              state.bookingBusy = false;
              persist();
              navigate('booking-success');
              toast('Booking paid & confirmed!');
            } catch (verifyErr) {
              state.bookingNotice = {
                type: 'error',
                title: 'Booking payment verification failed',
                message: (verifyErr.message || 'Could not verify booking payment.') + ' Please retry payment.'
              };
              state.bookingBusy = false;
              render();
              toast(verifyErr.message || 'Booking payment verification failed');
            }
          },
          modal: {
            ondismiss: function() {
              if (terminalOutcome) return;
              state.bookingNotice = {
                type: 'warn',
                title: 'Payment cancelled',
                message: 'Payment window was closed. Retry payment to finish booking #' + booked.id + '.'
              };
              state.bookingBusy = false;
              render();
              toast('Booking payment cancelled.');
            }
          }
        });
        if (typeof rzp.on === 'function') {
          rzp.on('payment.failed', function (failureResp) {
            terminalOutcome = true;
            state.bookingNotice = {
              type: 'error',
              title: 'Booking payment failed',
              message: (failureResp?.error?.description || 'Payment declined.') + ' Please retry.'
            };
            state.bookingBusy = false;
            render();
            toast('Booking payment failed.');
          });
        }
        rzp.open();
        return;
      }

      if (!state.bookings.some(item => item.id === booked.id)) state.bookings.unshift(booked);
      state.notifications.unshift({ type: 'booking', text: `Your ${s?.name||'service'} booking is confirmed for ${formatDate(b.date)}.` });
      state.modal = null;
      state.pendingBooking = null;
      state.pendingBookingKey = null;
      state.bookingNotice = null;
      persist();
      navigate('booking-success');
    } catch (err) {
      state.bookingNotice = {
        type: 'error',
        title: 'Unable to complete booking',
        message: err.message || 'Booking conflict or payment initiation error.'
      };
      toast(err.message || 'Booking conflict or error');
    } finally {
      state.bookingBusy = false;
      render();
    }
  }
}

document.addEventListener('click', e => {
  if(e.target.classList.contains('modal-backdrop')){ state.modal=null; render(); return; }
  const el = e.target.closest('[data-action]');
  if(!el) return;
  e.preventDefault();
  action(el);
});

function applyPostAuthNavigation(role) {
  const resume = pendingAuthResume;
  pendingAuthResume = null;
  if (role === 'admin' && (window.location.hash === '#admin' || resume?.view === 'admin')) {
    state.view = 'admin';
    loadAdminData();
    return null;
  }
  if (resume?.type === 'booking') {
    state.view = 'landing';
    return resume;
  }
  if (resume?.view) {
    if (resume.accountTab) state.accountTab = resume.accountTab;
    state.view = resume.view;
    if (resume.view === 'partner') {
      const mapped = partnerRoleFromUser(role);
      if (mapped) {
        state.partnerRole = mapped;
        state.partnerTab = 'Overview';
      } else if (role === 'admin') {
        state.partnerRole = resume.partnerRole || state.partnerRole || 'Salon Owner';
        state.partnerTab = 'Overview';
      } else {
        state.partnerRole = resume.partnerRole || state.partnerRole || 'Salon Owner';
        state.partnerTab = 'Registration';
      }
      loadPartnerData();
    }
    if (resume.view === 'checkout') ensureCheckoutReservation();
    return null;
  }
  state.view = state.experience ? 'landing' : 'onboarding';
  return null;
}

document.addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target, d = new FormData(f);
  if(f.id === 'auth-form'){
    const email = String(d.get('email')).trim();
    const password = String(d.get('password')).trim();
    const name = String(d.get('name') || '').trim();
    const phone = String(d.get('phone') || '').trim();

    if(state.authMode === 'signup'){
      try {
        const res = await apiRegister(name, email, password, phone);
        state.signedIn = true;
        state.user = { id: res.user_id, name: res.name, email: res.email, phone: res.phone || phone || '', role: res.role };
        const bookingResume = applyPostAuthNavigation(res.role);
        persist();
        render();
        if (bookingResume) openBooking(...bookingResume.args);
        toast('Account created successfully');
      } catch (err) {
        toast(err.message || 'Registration failed');
      }
    } else {
      try {
        const res = await apiLogin(email, password);
        state.signedIn = true;
        state.user = { id: res.user_id, name: res.name, email: res.email, phone: res.phone || state.user?.phone || '', role: res.role };
        const bookingResume = applyPostAuthNavigation(res.role);
        const [myB, myO, myA, myN] = await Promise.allSettled([
          apiGetMyBookings(),
          apiGetMyOrders(),
          apiGetAddresses(),
          apiGetNotifications()
        ]);
        if(myB.status==='fulfilled') state.bookings = myB.value;
        if(myO.status==='fulfilled') state.orders = myO.value;
        if(myA.status==='fulfilled') state.addresses = myA.value;
        if(myN.status==='fulfilled') state.notifications = myN.value;
        persist();
        render();
        if (bookingResume) openBooking(...bookingResume.args);
        toast(`Welcome back, ${res.name.split(' ')[0]}`);
      } catch (err) {
        toast(err.message || 'Login failed');
      }
    }
  }
  else if(f.id === 'location-form'){
    state.location = String(d.get('location')).trim();
    state.modal = null;
    persist();
    render();
    toast('Location updated');
  }
  else if(f.id === 'profile-form'){
    const name = String(d.get('name')).trim();
    const email = String(d.get('email')).trim();
    const phone = String(d.get('phone')).trim();
    try {
      const updated = await apiUpdateProfile({ name, email, phone });
      state.user = { ...state.user, name: updated.name, email: updated.email, phone: updated.phone };
      persist();
      render();
      toast('Profile updated');
    } catch (err) {
      toast(err.message || 'Failed to update profile');
    }
  }
  else if(f.id === 'address-form'){
    const label = String(d.get('label')).trim();
    const text = String(d.get('text')).trim();
    try {
      const added = await apiAddAddress({ label, text });
      state.addresses.push(added);
      state.modal = null;
      persist();
      render();
      toast('Address saved');
    } catch (err) {
      toast(err.message || 'Failed to save address');
    }
  }
  else if(f.id === 'coupon-form'){
    const code = String(d.get('coupon')).trim().toUpperCase();
    try {
      const val = await apiValidateCoupon(code, cartTotal());
      if(val.valid){
        state.coupon = val.code;
        state.couponDiscount = Number(val.discount || 0);
        invalidateCheckoutState(false);
        toast(val.message);
      } else {
        state.coupon = '';
        state.couponDiscount = 0;
        invalidateCheckoutState(false);
        toast(val.message || 'This coupon is not available');
      }
      persist();
      render();
    } catch {
      toast('Coupon verification failed');
    }
  }
  else if(f.id === 'partner-apply-form'){
    try {
      const docs = String(d.get('documents')||'').split(',').map(s=>s.trim()).filter(Boolean);
      const ports = String(d.get('portfolio')||'').split(',').map(s=>s.trim()).filter(Boolean);
      const res = await apiApplyForPartner({
        role: state.partnerRole.toLowerCase(),
        name: String(d.get('name')).trim(),
        phone: String(d.get('phone')).trim(),
        city: String(d.get('city')).trim(),
        price: parseFloat(String(d.get('price')||'0')),
        description: String(d.get('description')).trim(),
        documents: docs,
        portfolio_links: ports
      });
      if(!state.partnerDrafts) state.partnerDrafts = [];
      state.partnerDrafts.unshift(res);
      toast('Application submitted for curation review!');
      await loadPartnerData();
    } catch (err) {
      toast(err.message || 'Failed to submit application');
    }
  }
  else if(f.id === 'partner-pro-profile-form'){
    try {
      const res = await apiUpdateProfessionalProfile({
        name: String(d.get('name')).trim(),
        specialty: String(d.get('specialty')).trim(),
        experience: String(d.get('experience')).trim(),
        price: parseFloat(String(d.get('price')||'1500')),
        img: String(d.get('img')).trim()
      });
      state.partnerProProfile = res;
      toast('Professional profile updated!');
      await loadPartnerData();
    } catch(err) {
      toast(err.message || 'Failed to update profile');
    }
  }
  else if(f.id === 'partner-salon-profile-form'){
    try {
      const res = await apiUpdateSalonProfile({
        name: String(d.get('name')).trim(),
        area: String(d.get('area')).trim(),
        hours: String(d.get('hours')).trim(),
        price: parseFloat(String(d.get('price')||'2000')),
        img: String(d.get('img')).trim(),
        about: String(d.get('about')).trim()
      });
      state.partnerSalonProfile = res;
      toast('Salon studio profile updated!');
      await loadPartnerData();
    } catch(err) {
      toast(err.message || 'Failed to update studio profile');
    }
  }
  else if(f.id === 'partner-staff-add-form'){
    try {
      const res = await apiAddSalonStaff({
        name: String(d.get('name')).trim(),
        specialty: String(d.get('specialty')).trim(),
        img: String(d.get('img')||'').trim() || null
      });
      if(!state.partnerSalonStaff) state.partnerSalonStaff = [];
      state.partnerSalonStaff.push(res);
      toast('Stylist added to salon roster!');
      await loadPartnerData();
    } catch(err) {
      toast(err.message || 'Failed to add stylist');
    }
  }
  else if(f.id === 'partner-seller-product-form'){
    try {
      const res = await apiCreateSellerProduct({
        brand: String(d.get('brand')).trim(),
        name: String(d.get('name')).trim(),
        category: String(d.get('category')).trim(),
        price: parseFloat(String(d.get('price')||'0')),
        stock: parseInt(String(d.get('stock')||'50'), 10),
        tag: String(d.get('tag')||'').trim(),
        img: String(d.get('img')).trim(),
        description: String(d.get('description')).trim()
      });
      if(!state.partnerSellerProducts) state.partnerSellerProducts = [];
      state.partnerSellerProducts.unshift(res);
      toast('Product created and listed!');
      await loadPartnerData();
    } catch(err) {
      toast(err.message || 'Failed to create product');
    }
  }
  else if(f.id === 'partner-seller-listing-form'){
    try {
      const res = await apiCreateSellerListing({
        product_id: String(d.get('product_id')).trim(),
        sku: String(d.get('sku')).trim(),
        price: parseFloat(String(d.get('price')||'0')),
        stock: parseInt(String(d.get('stock')||'50'), 10),
        min_order_qty: parseInt(String(d.get('min_order_qty')||'1'), 10)
      });
      if(!state.partnerSellerListings) state.partnerSellerListings = [];
      state.partnerSellerListings.unshift(res);
      toast('Marketplace listing added and live!');
      await loadPartnerData();
    } catch(err) {
      toast(err.message || 'Failed to create marketplace listing');
    }
  }
  else if(f.id === 'partner-form'){
    state.partnerProfiles[state.partnerRole] = {
      name: String(d.get('name')).trim(),
      email: String(d.get('email')).trim(),
      phone: String(d.get('phone')).trim(),
      city: String(d.get('city')).trim()
    };
    persist();
    render();
    toast('Partner details saved');
  }
  else if(f.id === 'listing-form'){
    try {
      const draft = await apiCreatePartnerDraft({
        role: state.partnerRole,
        name: String(d.get('name')).trim(),
        price: Number(d.get('price')),
        description: String(d.get('description')).trim()
      });
      state.partnerDrafts.push(draft);
      state.modal = null;
      persist();
      render();
      toast('Draft listing saved');
    } catch (err) {
      toast(err.message || 'Failed to save draft');
    }
  }
  else if(f.id === 'review-form'){
    const [itemId, itemType] = (String(d.get('item_select') || 's1:::service')).split(':::');
    const rating = parseFloat(String(d.get('rating') || '5'));
    const comment = String(d.get('comment')).trim();
    try {
      const review = await apiCreateReview(itemId, itemType, rating, comment);
      state.reviews.unshift(review);
      state.modal = null;
      persist();
      render();
      toast('Thank you for sharing your review!');
    } catch (err) {
      toast(err.message || 'Failed to submit review');
    }
  }
  else if(f.id === 'admin-reject-form'){
    const reason = String(d.get('reason')).trim();
    if(!state.selectedDraftId || !reason){
      toast('Rejection reason is required');
      return;
    }
    try {
      const res = await apiRejectPartnerDraft(state.selectedDraftId, reason);
      const idx = (state.adminDrafts || []).findIndex(d => d.id === state.selectedDraftId);
      if (idx !== -1) state.adminDrafts[idx] = res;
      state.modal = null;
      state.selectedDraftId = null;
      toast('Partner application rejected');
      try {
        state.adminAuditLogs = await apiGetAuditLogs(null, 50, 0);
      } catch {}
      render();
    } catch (err) {
      toast('Failed to reject application: ' + (err.message || 'Server error'));
    }
  }
});

document.addEventListener('input', e => {
  if(e.target.id === 'global-search'){
    state.query = e.target.value;
    const focus = e.target.selectionStart;
    render();
    const input = document.getElementById('global-search');
    input?.focus();
    input?.setSelectionRange(focus, focus);
  }
  const adminSearchMap = {
    'admin-user-search': 'adminUserSearch',
    'admin-draft-search': 'adminDraftSearch',
    'admin-booking-search': 'adminBookingSearch',
    'admin-order-search': 'adminOrderSearch',
    'admin-catalog-search': 'adminCatalogSearch',
    'admin-audit-search': 'adminAuditSearch',
    'partner-booking-search': 'partnerBookingSearch',
    'partner-order-search': 'partnerOrderSearch',
    'partner-catalog-search': 'partnerCatalogSearch'
  };
  if(adminSearchMap[e.target.id]){
    const targetId = e.target.id;
    state[adminSearchMap[targetId]] = e.target.value;
    const focus = e.target.selectionStart;
    render();
    const input = document.getElementById(targetId);
    input?.focus();
    input?.setSelectionRange(focus, focus);
  }
});

document.addEventListener('change', async e => {
  if(e.target.id === 'salon-sort' || e.target.id === 'shop-sort' || e.target.id === 'home-sort'){
    state.sort = e.target.value;
    render();
  }
  if(e.target.id === 'shop-brand-select'){
    state.shopBrand = e.target.value || 'All';
    render();
  }
  if(e.target.id === 'checkout-address'){
    state.selectedCheckoutAddressIdx = Number(e.target.value || 0);
    invalidateCheckoutState(false);
  }
  if(e.target.classList.contains('admin-role-select')){
    const userId = Number(e.target.dataset.userId);
    const newRole = e.target.value;
    try {
      const res = await apiUpdateUserRole(userId, newRole);
      const idx = (state.adminUsers || []).findIndex(u => u.id === userId);
      if (idx !== -1) state.adminUsers[idx] = res;
      toast(`User role updated to ${newRole}`);
      try {
        state.adminAuditLogs = await apiGetAuditLogs(null, 50, 0);
      } catch {}
      render();
    } catch (err) {
      toast('Failed to update role: ' + (err.message || 'Server error'));
      render();
    }
  }
});

let chapterClickLockUntil = 0;
function setActiveChapter(idx) {
  const clamped = Math.max(0, Math.min(heroChapters.length - 1, Number(idx) || 0));
  if (state.activeChapter === clamped && document.querySelector('.chapter-step.active')?.dataset.step === String(clamped)) return;
  state.activeChapter = clamped;
  document.querySelectorAll('.chapter-step').forEach((li, i) => {
    const isAct = i === clamped;
    li.classList.toggle('active', isAct);
    const btn = li.querySelector('.chapter-btn');
    if (btn) btn.setAttribute('aria-pressed', isAct ? 'true' : 'false');
  });
  document.querySelectorAll('.chapter-img').forEach((img, i) => {
    img.classList.toggle('active', i === clamped);
  });
}

window.addEventListener('scroll', () => {
  if (state.view !== 'landing') return;
  if (state.experience === 'home' && Date.now() >= chapterClickLockUntil && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const steps = document.querySelectorAll('#how .chapter-step');
    if (steps.length) {
      let bestIdx = state.activeChapter || 0;
      const focusY = window.innerHeight * 0.42;
      steps.forEach((step, i) => {
        const r = step.getBoundingClientRect();
        if (r.top <= focusY) bestIdx = i;
      });
      setActiveChapter(bestIdx);
    }
  }
  if (Date.now() < scrollLockUntil) return;
  const targets = state.experience === 'shop'
    ? ['shop-categories', 'bestsellers']
    : state.experience === 'salon'
    ? ['salons', 'salon-categories']
    : ['categories', 'popular', 'professionals', 'how'];
  let current = 'landing';
  if (window.scrollY > 180) {
    for (const id of targets) {
      const sec = document.getElementById(id);
      if (sec && sec.getBoundingClientRect().top <= 160) current = id;
    }
  }
  if (state.activeNav !== current) {
    state.activeNav = current;
    syncSubnavActive();
  }
}, { passive: true });

window.addEventListener('hashchange', () => {
  if(applyRouteFromLocation()){
    render();
    if (pendingOnboardingScroll) {
      const targetId = pendingOnboardingScroll;
      pendingOnboardingScroll = null;
      requestAnimationFrame(() => document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' }));
    } else {
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    }
    return;
  }
  if(window.location.hash === '#admin'){
    if(state.user?.role === 'admin' && state.signedIn){
      state.view = 'admin';
      render();
      loadAdminData();
    } else {
      toast('Unauthorized access. Administrator privileges required.');
    }
  } else if(window.location.hash === '#salon' || window.location.hash === '#partner'){
    const targetRole = window.location.hash === '#salon' ? 'Salon Owner' : (partnerRoleFromUser(state.user?.role) || state.partnerRole || 'Salon Owner');
    if(!requireAuth({ view: 'partner', partnerRole: targetRole }, 'Sign in to access your Partner Studio')) return;
    state.view = 'partner';
    state.partnerRole = partnerRoleFromUser(state.user?.role) || targetRole;
    state.partnerTab = (state.user?.role === 'customer') ? 'Registration' : 'Overview';
    render();
    loadPartnerData();
  }
});

document.addEventListener('keydown', e => {
  if(e.key === 'Escape' && state.modal){
    state.modal = null;
    render();
  }
  if((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'){
    e.preventDefault();
    state.modal = 'search';
    render();
    setTimeout(()=>document.getElementById('global-search')?.focus(),20);
  }
  if((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && document.activeElement?.classList?.contains('pdp-tab')){
    const tabs = Array.from(document.querySelectorAll('.pdp-tab'));
    const idx = tabs.indexOf(document.activeElement);
    if(idx !== -1){
      e.preventDefault();
      const next = tabs[(idx + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      next.click();
      next.focus();
    }
  }
});

// Initial boot and background live sync
async function init() {
  const initialHash = window.location.hash;
  const initialPath = window.location.pathname;
  const matchedRoute = applyRouteFromLocation();
  if(initialHash === '#admin' && state.user?.role === 'admin' && state.signedIn){
    state.view = 'admin';
  } else if((initialHash === '#salon' || initialHash === '#partner') && state.signedIn){
    state.view = 'partner';
    state.partnerRole = initialHash === '#salon' ? 'Salon Owner' : (partnerRoleFromUser(state.user?.role) || state.partnerRole || 'Salon Owner');
    state.partnerTab = state.user?.role === 'customer' ? 'Registration' : 'Overview';
    loadPartnerData();
  }
  render();
  if (matchedRoute) {
    if (pendingOnboardingScroll) {
      const targetId = pendingOnboardingScroll;
      pendingOnboardingScroll = null;
      requestAnimationFrame(() => document.getElementById(targetId)?.scrollIntoView({ behavior: 'instant' }));
    } else {
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    }
  }
  try {
    const hydrateSession = async () => {
      if (!tokenStorage.get()) {
        if ((initialHash === '#salon' || initialHash === '#partner') && state.view !== 'auth') {
          requireAuth({ view: 'partner', partnerRole: initialHash === '#salon' ? 'Salon Owner' : 'Salon Owner' }, 'Sign in to access your Partner Studio');
        }
        return;
      }
      try {
        const me = await apiGetMe();
        state.user = { id: me.id, name: me.name, email: me.email, phone: me.phone, role: me.role };
        state.addresses = me.addresses || state.addresses;
        state.signedIn = true;
        const [myB, myO, myN, myR] = await Promise.allSettled([
          apiGetMyBookings(),
          apiGetMyOrders(),
          apiGetNotifications(),
          apiGetMyReviews()
        ]);
        if(myB.status === 'fulfilled') state.bookings = myB.value;
        if(myO.status === 'fulfilled') state.orders = myO.value;
        if(myN.status === 'fulfilled') state.notifications = myN.value;
        if(myR.status === 'fulfilled') state.reviews = myR.value;

        if(me.role === 'admin'){
          if(initialHash === '#admin' || initialPath === '/admin'){
            state.view = 'admin';
          }
          await loadAdminData();
        }
        if(initialHash === '#partner' || initialHash === '#salon'){
          const mapped = partnerRoleFromUser(me.role);
          state.view = 'partner';
          state.partnerRole = initialHash === '#salon' ? 'Salon Owner' : (mapped || state.partnerRole || 'Salon Owner');
          state.partnerTab = (mapped || me.role === 'admin') ? 'Overview' : 'Registration';
          await loadPartnerData();
        }
      } catch {
        tokenStorage.remove();
        state.signedIn = false;
      }
      if (canSafelyBackgroundRender()) render();
    };

    await Promise.allSettled([loadCatalogFeeds(), hydrateSession()]);
    if (canSafelyBackgroundRender()) render();
  } catch (err) {
    console.warn('[GlamGo] Live sync initialization notice:', err);
  }
}

init();
