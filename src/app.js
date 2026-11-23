import { publicLanding } from './public-landing.js';
import {
  tokenStorage,
  apiLogin,
  apiRegister,
  apiGetMe,
  apiRequestPasswordReset,
  apiConfirmPasswordReset,
  apiRequestMobileOtp,
  apiVerifyMobileOtp,
  apiGetServices,
  apiGetProfessionals,
  apiGetCatalogSalons,
  apiGetSalons,
  apiGetProducts,
  apiUpdateProfile,
  apiGetAddresses,
  apiAddAddress,
  apiDeleteAddress,
  apiGetNotifications,
  apiGetMyRewards,
  apiRedeemRewardCode,
  apiCreateBooking,
  apiGetMyBookings,
  apiUpdateBookingStatus,
  apiRescheduleBooking,
  apiVerifyBookingArrivalOtp,
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
const AUTH_IMG = './assets/auth-editorial.webp';
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
  spark: '<path d="M12 2.7 6.3 8.4a8 8 0 1 0 11.4 0L12 2.7Z"/>',
  home: '<path d="m3 10 9-7 9 7v11H3V10Z"/><path d="M9 21v-7h6v7"/>',
  salon: '<path d="M4 21V7l8-4 8 4v14H4Z"/><path d="M4 10h16M9 21v-6h6v6"/>',
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
  truck: '<path d="M2 6h12v11H2V6ZM14 10h4l3 3v4h-7v-7Z"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
  logout: '<path d="M10 3H4v18h6M14 7l5 5-5 5M8 12h11"/>'
};

const icon = (name, size = 20, extra = '') => '<svg class="icon ' + extra + '" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (icons[name] || '') + '</svg>';
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
  {id:'home', eyebrow:'01 / AT-HOME BEAUTY', title:'Beauty, at your doorstep.', desc:'Book professional beauty experts who come directly to your home.', cta:'Explore Home Services', img:HOME_IMG, icon:'home'},
  {id:'salon', eyebrow:'02 / SALON & PARLOUR', title:'Your perfect salon awaits.', desc:'Discover the best salons and parlours around you and book appointments.', cta:'Explore Salons', img:SALON_IMG, icon:'salon'},
  {id:'shop', eyebrow:'03 / BEAUTY SHOPPING', title:'Everything beauty, in one place.', desc:'Discover and shop your favourite beauty and personal care products.', cta:'Explore Beauty Store', img:SHOP_IMG, icon:'bag'}
];

// Never bootstrap public listings from the old cache: it could contain demo rows.
// Keep customer state (cart, bookings, account and preferences) separately intact.
let services = [];
let professionals = [];
let salons = [];
let products = [];

const BOOKING_ADDONS = [
  { id: 'addon-head-massage', name: 'Ayurvedic Head Massage', duration: '15 min', price: 299 },
  { id: 'addon-sheet-mask', name: 'Collagen Peptide Sheet Mask', duration: '15 min', price: 349 },
  { id: 'addon-gel-removal', name: 'Gentle Gel Polish Removal', duration: '15 min', price: 249 },
  { id: 'addon-serum-ampoule', name: 'Vitamin C Glow Ampoule', duration: '10 min', price: 499 }
];

const NEAR_SALON_RADIUS_KM = 8;
const AREA_COORDS = {
  'bandra west': [19.0596, 72.8295],
  'bandra': [19.0596, 72.8295],
  'juhu': [19.1075, 72.8263],
  'khar west': [19.0708, 72.8339],
  'andheri west': [19.1364, 72.8296],
  'powai': [19.1176, 72.9060],
  'mumbai': [19.0760, 72.8777],
  'indiranagar': [12.9784, 77.6408],
  'koramangala': [12.9352, 77.6245],
  'whitefield': [12.9698, 77.7499],
  'hsr layout': [12.9121, 77.6446],
  'yelahanka': [13.1007, 77.5963],
  'bengaluru': [12.9716, 77.5946],
  'bangalore': [12.9716, 77.5946],
  'hauz khas': [28.5494, 77.2001],
  'south delhi': [28.5494, 77.2001],
  'delhi': [28.6139, 77.2090]
};
function normalizeCity(loc = '') {
  const raw = String(loc || '').trim().toLowerCase();
  if (!raw) return 'Mumbai';
  if (raw.includes('bangalore') || raw.includes('bengaluru') || raw.includes('indiranagar') || raw.includes('koramangala') || raw.includes('whitefield') || raw.includes('hsr') || raw.includes('yelahanka')) return 'Bengaluru';
  if (raw.includes('delhi') || raw.includes('hauz khas') || raw.includes('gurgaon') || raw.includes('gurugram') || raw.includes('noida')) return 'Delhi';
  if (raw.includes('mumbai') || raw.includes('bandra') || raw.includes('juhu') || raw.includes('khar') || raw.includes('andheri') || raw.includes('powai')) return 'Mumbai';
  const parts = String(loc).split(',').map(s => s.trim()).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : 'Mumbai';
}
function resolveUserCoords() {
  if (Array.isArray(state.userCoords) && state.userCoords.length === 2 && Number.isFinite(Number(state.userCoords[0])) && Number.isFinite(Number(state.userCoords[1]))) {
    return [Number(state.userCoords[0]), Number(state.userCoords[1])];
  }
  const text = String(state.location || '').trim().toLowerCase();
  const keys = Object.keys(AREA_COORDS).sort((a, b) => b.length - a.length);
  const direct = keys.find(k => text.includes(k));
  if (direct) return AREA_COORDS[direct];
  return AREA_COORDS[normalizeCity(state.location).toLowerCase()] || AREA_COORDS.mumbai;
}
function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = d => (Number(d) * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function resolveSalonCoords(s) {
  if (Number.isFinite(Number(s?.lat)) && Number.isFinite(Number(s?.lng))) return [Number(s.lat), Number(s.lng)];
  const hay = `${s?.area || ''} ${s?.city || ''}`.toLowerCase();
  const keys = Object.keys(AREA_COORDS).sort((a, b) => b.length - a.length);
  const k = keys.find(x => hay.includes(x));
  return AREA_COORDS[k || 'mumbai'];
}
function enrichSalonWithDistance(s) {
  const coords = Array.isArray(state.userCoords) ? state.userCoords : null;
  const hasPosition = coords && s.lat != null && s.lng != null && Number.isFinite(Number(s.lat)) && Number.isFinite(Number(s.lng));
  const km = hasPosition ? Math.round(haversineKm(coords[0], coords[1], Number(s.lat), Number(s.lng)) * 10) / 10 : null;
  return { ...s, distanceKm: km, isFar: km == null ? null : km > NEAR_SALON_RADIUS_KM, distanceLabel: km == null ? '' : `${km.toFixed(1)} km away` };
}
function isServiceAvailableInCity(s, city) {
  const c = String(city || '').trim().toLowerCase();
  if (!c) return true;
  if (Array.isArray(s?.cities) && s.cities.length) return s.cities.some(x => String(x).toLowerCase() === c);
  if (s?.city) return String(s.city).toLowerCase() === c;
  return true;
}
function isProAvailableInCity(p, city) {
  const c = String(city || '').trim().toLowerCase();
  if (!c) return true;
  if (p?.city) return String(p.city).toLowerCase() === c;
  if (p?.area) return normalizeCity(p.area).toLowerCase() === c;
  return true;
}
async function reverseGeocodeCoords(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      const addr = data?.address || {};
      const area = addr.suburb || addr.neighbourhood || addr.city_district || addr.road || '';
      const city = addr.city || addr.town || addr.state_district || '';
      const formatted = [area, city].filter(Boolean).join(', ');
      if (formatted) return formatted;
    }
  } catch {}
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

const homeCategories = ['All','Hair','Skin','Waxing','Threading','Nails','Makeup','Spa','Packages'];
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
  user: null,
  location:'Bandra West, Mumbai',
  userCoords: null,
  walletCredits: 0,
  referralCode: '',
  salonDistanceFilter: 'all',
  addresses:[],
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
  partnerServiceCatalog: [],
  partnerProductCatalog: [],
  productOffers: {},
  partnerFinancials: null,
  adminStats: null,
  adminUsers: [],
  adminDrafts: [],
  adminAuditLogs: [],
  adminBookings: [],
  adminOrders: [],
  adminServices: [],
  adminProducts: [],
  adminTab: 'overview',
  adminDraftFilter: 'ALL',
  adminUserFilter: 'ALL',
  adminUserSearch: ''
};

let saved = {};
try { saved = JSON.parse(localStorage.getItem('glamgo-state') || '{}'); } catch {}

const state = {
  ...defaults,
  ...saved,
  signedIn: Boolean(tokenStorage.get() && saved.signedIn),
  view: 'public',
  publicMenu: false,
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
  listingReviews: {},
  accountTab: 'Overview',
  partnerRole: 'Professional',
  partnerTab: 'Overview',
  partnerOverview: null,
  partnerDrafts: [],
  partnerFinancials: null,
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
  partnerDataReady: false,
  partnerServiceCatalog: [],
  partnerProductCatalog: [],
  partnerAvailabilityReady: false,
  availability: [],
  booking: null,
  checkoutPayment: 'UPI',
  authMode: 'signin',
  authOtpStage: 'request',
  authOtpPhone: '',
  authResetStage: 'request',
  authResetEmail: '',
  authDevHint: '',
  applyWalletCredit: false,
  rescheduleBooking: null,
  proVerifyBookingId: null,
  proVerifiedArrival: {},
  adminStats: null,
  adminUsers: [],
  adminDrafts: [],
  adminAuditLogs: [],
  adminBookings: [],
  adminOrders: [],
  adminServices: [],
  adminProducts: [],
  adminTab: 'overview',
  adminDraftFilter: 'ALL',
  adminUserFilter: 'ALL',
  adminUserSearch: '',
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
  bookingNotice: null
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
  return null;
};
const getStockInfo = (p, variant) => {
  const qty = getProductStock(p, variant);
  if (qty === null || !Number.isFinite(qty)) return { qty: null, soldOut: false, low: false, label: 'Availability at checkout' };
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
const getRelatedProducts = (p, limit = 3) => p ? products.filter(item => item.id !== p.id && item.category === p.category).slice(0, limit) : [];
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
      state.productReviews[id] = { loading: false, error: true, items: [] };
      if (state.view === 'product-detail' && state.selectedProduct === id) render();
    });
  }
};
const ensureListingReviews = (type, id) => {
  const key = `${type}:${id}`;
  if (state.listingReviews[key]) return;
  state.listingReviews[key] = { loading: true, items: [] };
  apiGetReviews(id, type).then(items => {
    state.listingReviews[key] = { loading: false, items: Array.isArray(items) ? items : [] };
  }).catch(() => {
    state.listingReviews[key] = { loading: false, error: true, items: [] };
  }).finally(() => {
    if ((type === 'service' && state.view === 'service-detail' && String(state.selectedService) === String(id)) ||
        (type === 'salon' && state.view === 'salon-detail' && String(state.selectedSalon) === String(id))) render();
  });
};
const listingReviewSection = (type, id) => {
  const reviews = state.listingReviews[`${type}:${id}`];
  const body = !reviews || reviews.loading ? '<p>Loading customer reviews…</p>'
    : reviews.error ? '<p>Reviews could not be loaded right now.</p>'
    : !reviews.items.length ? '<p>No customer reviews to show yet.</p>'
    : '<div class="pdp-review-list">'+reviews.items.map(r=>'<article class="pdp-review-item"><div class="pdp-review-head"><strong>'+esc(r.user_name || 'GlamGo customer')+'</strong><span class="rating">'+icon('star',14)+' '+esc(r.rating)+'/5</span></div>'+(r.comment?'<p>'+esc(r.comment)+'</p>':'')+'</article>').join('')+'</div>';
  return '<section class="detail-block"><h2>Customer reviews</h2>'+body+'</section>';
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
  if (hash === '#onboarding' || path === '/onboarding') {
    state.view = 'onboarding';
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
const image = (src, alt, cls='') => '<img class="'+esc(cls)+'" src="'+esc(src)+'" alt="'+esc(alt)+'" decoding="sync" onerror="this.style.opacity=0.15">';
const button = (label, action, cls='btn-primary', attrs='') => '<button class="btn '+cls+'" data-action="'+action+'" '+attrs+'>'+label+'</button>';
const sectionHead = (eyebrow,title,sub='',action='') => '<div class="section-head"><div><p class="eyebrow">'+eyebrow+'</p><h2>'+title+'</h2>'+(sub?'<p class="section-sub">'+sub+'</p>':'')+'</div>'+action+'</div>';

const empty = (symbol,title,text,action='') => '<div class="empty-state"><div class="empty-symbol">'+icon(symbol,28)+'</div><h3>'+title+'</h3><p>'+text+'</p>'+action+'</div>';
const catalogLoadingState = label => '<div class="catalog-loading-panel"><p>Curating live '+esc(label)+'...</p></div>';
const catalogUnavailableState = (title, message = 'Live inventory could not be loaded right now. Please try again in a moment.') => '<div class="catalog-unavailable">'+empty('bag', title + ' unavailable', message, button('Retry loading '+icon('arrow',16), 'retry-catalog', 'btn-primary'))+'</div>';
const canSafelyBackgroundRender = () => {
  // Public content is static and does not need replacing as catalog feeds arrive.
  if (state.view === 'public') return false;
  if (state.modal) return false;
  const active = document.activeElement;
  if (active && app.contains(active) && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) return false;
  return true;
};
const syncOverallCatalogLoading = () => {
  const f = state.catalogFeedsLoading;
  state.catalogLoading = Boolean(f.services || f.professionals || f.salons || f.products);
};
let catalogRequestGeneration = 0;
async function loadCatalogFeeds() {
  const generation = ++catalogRequestGeneration;
  services = []; professionals = []; salons = []; products = [];
  state.catalogErrors = { services: false, professionals: false, salons: false, products: false };
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
  const fetchFeed = (key, fetcher, applyValue) =>
    Promise.resolve().then(fetcher).then(data => {
      if (generation !== catalogRequestGeneration) return;
      if (!Array.isArray(data)) throw new Error('Invalid catalogue response');
      applyValue(data);
      state.catalogErrors[key] = false;
    }).catch(() => {
      if (generation !== catalogRequestGeneration) return;
      applyValue([]);
      state.catalogErrors[key] = true;
    }).finally(() => {
      if (generation !== catalogRequestGeneration) return;
      state.catalogFeedsLoading[key] = false;
      refreshUI();
    });

  const userCity = normalizeCity(state.location);
  const coords = Array.isArray(state.userCoords) ? state.userCoords : null;
  await Promise.allSettled([
    fetchFeed('services', () => apiGetServices(null, null, userCity), v => { services = v; }),
    fetchFeed('professionals', () => apiGetProfessionals(userCity), v => { professionals = v.filter(p => String(p.name || '').trim().toLowerCase() !== 'glamgo admin'); }),
    fetchFeed('salons', () => apiGetCatalogSalons({ city: userCity, lat: coords?.[0], lng: coords?.[1] }), v => { salons = v; }),
    fetchFeed('products', apiGetProducts, v => { products = v; })
  ]);
  if (generation !== catalogRequestGeneration) return;
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

function onboarding(){
  return '<div class="onboarding"><div class="onboard-top"><a class="wordmark" href="#" data-action="onboarding">GLAMGO<span>✦</span></a><div class="onboard-top-right"><span>YOUR BEAUTY. YOUR WAY.</span>'+button((state.signedIn?'My account ':'Sign in ')+icon('user',17),'account','btn-text')+'</div></div><div class="onboard-intro"><p class="eyebrow line-eyebrow">THREE EXPERIENCES. ONE BEAUTIFUL WORLD.</p><h1>Beauty is yours <em>to define.</em></h1><p>Where would you like to begin today?</p></div><div class="experience-grid">'+experiences.map(x=>'<button class="experience-card" data-action="experience" data-id="'+x.id+'"><div class="experience-photo">'+image(x.img,x.title)+'</div><div class="experience-content"><span class="eyebrow">'+x.eyebrow+'</span><h2>'+x.title+'</h2><p>'+x.desc+'</p><span class="experience-link">'+x.cta+' '+icon('arrow',18)+'</span></div></button>').join('')+'</div><div class="onboard-bottom"><span>ONE ACCOUNT. EVERY SIDE OF BEAUTY.</span><span>CURATED WITH CARE &nbsp; · &nbsp; MADE FOR YOU</span></div></div>';
}

function auth(){
  const mode = state.authMode || 'signin';
  const heading = mode==='signup'
    ? 'Create your account'
    : mode==='otp'
      ? 'Sign in with Mobile OTP.'
      : mode==='reset'
        ? 'Reset your password.'
        : 'A beautiful place to begin.';
  const sub = mode==='otp'
    ? 'Verify your registered mobile number with a one-time passcode.'
    : mode==='reset'
      ? 'Request a 6-digit verification code to set a new password.'
      : 'Find exceptional care at home, discover salons and shop your favourites.';
  const methodPills = mode!=='signup'
    ? '<div class="filter-row" style="margin-bottom:18px">' +
        '<button type="button" class="filter-chip '+(mode==='signin'?'active':'')+'" data-action="auth-mode-set" data-id="signin">Email &amp; Password</button>' +
        '<button type="button" class="filter-chip '+(mode==='otp'?'active':'')+'" data-action="auth-mode-set" data-id="otp">Mobile OTP</button>' +
      '</div>'
    : '';
  const hint = state.authDevHint
    ? '<p style="font-size:12px;margin:0 0 12px;padding:8px 12px;border:1px solid var(--border);color:var(--ink)">'+esc(state.authDevHint)+'</p>'
    : '';
  let formHtml = '';
  if(mode==='otp'){
    formHtml = state.authOtpStage==='verify'
      ? '<p style="margin-bottom:12px;font-size:13px">Code sent to <strong>'+esc(state.authOtpPhone)+'</strong></p>' + hint +
        '<form id="auth-otp-verify-form"><label>6-digit OTP<input name="otp" inputmode="numeric" required maxlength="8" placeholder="Enter 6-digit OTP" autocomplete="one-time-code"></label><button class="btn btn-primary full" type="submit">Verify &amp; Sign in '+icon('arrow',17)+'</button></form>' +
        '<p class="auth-switch"><button type="button" data-action="auth-otp-restart">Use a different mobile number</button></p>'
      : '<form id="auth-otp-request-form"><label>Registered mobile number<input name="phone" type="tel" required placeholder="+91 98765 43210" autocomplete="tel" value="'+esc(state.authOtpPhone||'')+'"></label><button class="btn btn-primary full" type="submit">Send OTP '+icon('arrow',17)+'</button></form>';
  } else if(mode==='reset'){
    formHtml = state.authResetStage==='confirm'
      ? '<p style="margin-bottom:12px;font-size:13px">Enter the code sent for <strong>'+esc(state.authResetEmail)+'</strong></p>' + hint +
        '<form id="auth-reset-confirm-form"><label>6-digit reset code<input name="code" inputmode="numeric" required maxlength="16" placeholder="Enter 6-digit code"></label><label>New password<input name="new_password" type="password" required minlength="6" placeholder="At least 6 characters" autocomplete="new-password"></label><button class="btn btn-primary full" type="submit">Reset password '+icon('arrow',17)+'</button></form>' +
        '<p class="auth-switch"><button type="button" data-action="auth-reset-restart">Use a different email</button></p>'
      : '<form id="auth-reset-request-form"><label>Account email address<input name="email" type="email" required placeholder="you@example.com" autocomplete="email" value="'+esc(state.authResetEmail||'')+'"></label><button class="btn btn-primary full" type="submit">Send reset code '+icon('arrow',17)+'</button></form>';
  } else {
    formHtml = '<form id="auth-form">' +
      (mode==='signup'?'<label>Full name<input name="name" required placeholder="Your full name" autocomplete="name"></label><label>Phone number<input name="phone" placeholder="Contact number"></label>':'') +
      '<label>Email address<input name="email" type="email" required placeholder="you@example.com" autocomplete="email"></label>' +
      '<label>Password<input name="password" type="password" required minlength="6" placeholder="At least 6 characters" autocomplete="'+(mode==='signup'?'new-password':'current-password')+'"></label>' +
      '<button class="btn btn-primary full" type="submit">'+(mode==='signup'?'Create account':'Sign in')+' '+icon('arrow',17)+'</button></form>' +
      (mode==='signin'?'<p class="auth-switch"><button type="button" data-action="auth-mode-set" data-id="reset">Forgot password?</button></p>':'');
  }
  const bottomSwitch = mode==='reset'
    ? '<p class="auth-switch"><button type="button" data-action="auth-mode-set" data-id="signin">Back to Email Sign In</button></p>'
    : '<p class="auth-switch">'+(mode==='signup'?'Already have an account?':'New to GlamGo?')+' <button data-action="auth-toggle">'+(mode==='signup'?'Sign in':'Create an account')+'</button></p>';
  return '<div class="auth-layout"><div class="auth-image">'+image(AUTH_IMG,'GlamGo beauty sanctuary')+'<div class="auth-image-copy"><a class="wordmark light" href="#onboarding" data-action="guest-browse">GLAMGO<span>✦</span></a><h1>Your beauty.<br><em>Your way.</em></h1><p>One account for every side of beauty.</p></div></div><div class="auth-panel"><div class="auth-box"><p class="eyebrow">WELCOME TO GLAMGO</p><h2>'+heading+'</h2><p>'+sub+'</p>'+methodPills+formHtml+bottomSwitch+'<p class="auth-switch" style="margin-top:10px"><button data-action="guest-browse">← Continue browsing as guest</button></p></div></div></div>';
}

function header(){
  const current = experiences.find(x => x.id === state.experience) || experiences[0];
  const userInitials = state.user?.name ? state.user.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() : 'AM';
  const accountBtn = state.signedIn
    ? '<button class="avatar-button" aria-label="My account" data-action="account">'+userInitials+'</button>'
    : '<button class="avatar-button" aria-label="Sign in" title="Sign in" data-action="account">'+icon('user',15)+'</button>';
  const activeKey = getActiveSubnavKey();
  const navBtn = (act, label, key, extraAttrs='') => '<button data-action="'+act+'" data-nav-key="'+key+'" class="'+(activeKey===key?'active':'')+'"'+(activeKey===key?' aria-current="page"':'')+(extraAttrs?' '+extraAttrs:'')+'>'+label+'</button>';
  return '<div class="site-shell"><div class="announcement">A more beautiful way to care for yourself <span>·</span> Discover GlamGo</div><header class="header"><a class="wordmark" href="/" data-action="public-home">GLAMGO<span>✦</span></a><div class="header-location"><button data-action="location">'+icon('pin',18)+'<span><small>YOUR LOCATION</small>'+esc(state.location)+'</span>'+icon('chevron',15)+'</button></div><button class="header-search" data-action="search-open">'+icon('search',19)+'<span>Search services, salons & products</span><kbd>⌘ K</kbd></button><div class="header-actions"><div class="switch-wrap"><button class="switch-button" data-action="switch-toggle" aria-expanded="'+state.menu+'"><span class="switch-icon">'+icon(current.icon,18)+'</span><span>Switch experience<small>'+current.eyebrow.split('/ ')[1]+'</small></span>'+icon('chevron',14)+'</button>'+(state.menu?'<div class="switch-menu"><p>EXPLORE GLAMGO</p>'+experiences.map(x=>'<button data-action="experience" data-id="'+x.id+'" class="'+(x.id===state.experience?'active':'')+'">'+icon(x.icon,19)+'<span>'+x.eyebrow.split('/ ')[1]+'<small>'+x.title+'</small></span>'+(x.id===state.experience?icon('check',16):'')+'</button>').join('')+'</div>':'')+'</div><button class="icon-button" aria-label="Wishlist" data-action="wishlist">'+icon('heart',21)+(state.wishlist.length?'<i></i>':'')+'</button><button class="icon-button" aria-label="Cart" data-action="cart">'+icon('bag',21)+(countCart()?'<b>'+countCart()+'</b>':'')+'</button><button class="icon-button notify-button" aria-label="Notifications" data-action="notifications">'+icon('bell',21)+(state.notifications.length?'<i></i>':'')+'</button>'+(state.user?.role==='admin'?'<button class="btn btn-outline btn-sm portal-btn admin-portal-btn" data-action="admin">Command Centre</button>':'')+'<button class="btn btn-outline btn-sm portal-btn" data-action="partners">Salon & Partner Portal</button>'+accountBtn+'</div><button class="mobile-menu-button" data-action="mobile-toggle" aria-label="'+(state.mobileMenu?'Close menu':'Open menu')+'" aria-expanded="'+state.mobileMenu+'">'+icon('menu',23)+'</button></header><nav class="subnav" aria-label="Section navigation"><div class="subnav-links">'+(state.experience==='home'?navBtn('landing','Home','landing')+navBtn('scroll','Categories','categories','data-target="categories"')+navBtn('scroll','Popular services','popular','data-target="popular"')+navBtn('scroll','Professionals','professionals','data-target="professionals"')+navBtn('scroll','How it works','how','data-target="how"'):state.experience==='salon'?navBtn('landing','Discover','landing')+navBtn('scroll','Salons near you','salons','data-target="salons"')+navBtn('scroll','Categories','salon-categories','data-target="salon-categories"')+navBtn('account-bookings','My appointments','account-bookings'):navBtn('shop-all','Shop all','landing')+navBtn('scroll','Categories','shop-categories','data-target="shop-categories"'))+'</div><span class="subnav-tag">YOUR BEAUTY. YOUR WAY.</span></nav>'+(state.mobileMenu?'<div class="mobile-menu"><div class="mobile-menu-head"><span>EXPLORE GLAMGO</span><button data-action="mobile-toggle" aria-label="Close menu">'+icon('close',20)+'</button></div>'+experiences.map(x=>'<button data-action="experience" data-id="'+x.id+'">'+icon(x.icon,20)+x.eyebrow.split('/ ')[1]+icon('arrow',16)+'</button>').join('')+'<button data-action="account">'+icon('user',20)+(state.signedIn?'My account':'Sign in')+icon('arrow',16)+'</button><button data-action="location">'+icon('pin',20)+esc(state.location)+icon('arrow',16)+'</button>'+(state.user?.role==='admin'?'<button data-action="admin">Admin Command Centre'+icon('arrow',16)+'</button>':'')+'</div>':'')+'</div>';
}

function footer(){
  return '<footer class="footer"><div class="footer-grid"><div><a class="wordmark" href="/" data-action="public-home">GLAMGO<span>✦</span></a><p>Beauty made personal, wherever you are.</p><span>YOUR BEAUTY. YOUR WAY.</span></div><div><h4>Explore</h4>'+experiences.map(x=>'<button data-action="experience" data-id="'+x.id+'">'+x.eyebrow.split('/ ')[1]+'</button>').join('')+'</div><div><h4>Your account</h4><button data-action="account">My profile</button><button data-action="account-bookings">My bookings</button><button data-action="orders">My orders</button><button data-action="wishlist">Wishlist</button></div><div><h4>GlamGo</h4><button data-action="partners">Partner with us</button>'+(state.user?.role==='admin'?'<button data-action="admin">Command Centre</button>':'')+'<button data-action="support">Customer support</button><button data-action="notifications">Notifications</button></div></div><div class="footer-bottom"><span>© '+new Date().getFullYear()+' GlamGo. Made for every side of beauty.</span><span>Thoughtfully curated care.</span></div></footer>';
}

function mobileNav(){
  return '<nav class="mobile-bottom" aria-label="Mobile navigation"><button data-action="landing" class="'+(state.view==='landing'?'active':'')+'">'+icon('home',21)+'<span>Explore</span></button><button data-action="search-open">'+icon('search',21)+'<span>Search</span></button><button data-action="switch-toggle" aria-expanded="'+state.mobileMenu+'">'+icon('grid',21)+'<span>Switch</span></button><button data-action="cart">'+icon('bag',21)+'<span>Cart</span></button><button data-action="account" class="'+(state.view==='account'?'active':'')+'">'+icon('user',21)+'<span>Account</span></button></nav>';
}

function homeCard(s){
  return '<article class="service-card"><button class="listing-image-button" data-action="service-detail" data-id="'+esc(s.id)+'" aria-label="View '+esc(s.name)+'">'+image(s.img,s.name,'card-img')+'</button><button class="wishlist-on-card '+(state.wishlist.includes(s.id)?'saved':'')+'" data-action="wish" data-id="'+esc(s.id)+'" aria-pressed="'+state.wishlist.includes(s.id)+'" aria-label="Save '+esc(s.name)+'">'+icon('heart',18)+'</button><div class="card-body"><span class="card-kicker">'+esc(s.category)+'</span><h3>'+esc(s.name)+'</h3><div class="card-meta">'+icon('clock',15)+esc(s.duration)+'</div><div class="card-bottom"><strong>'+money(s.price)+'</strong><button data-action="service-detail" data-id="'+esc(s.id)+'">View service '+icon('arrow',16)+'</button></div></div></article>';
}
function serviceDetail(){
  const s = services.find(x => String(x.id) === String(state.selectedService));
  if (!s) return '<main class="detail-page">'+backButton('landing','Back to services')+(state.catalogFeedsLoading.services?catalogLoadingState('service details'):state.catalogErrors.services?catalogUnavailableState('Service details'):empty('spark','Service unavailable','This service is no longer listed.'))+'</main>';
  return '<main class="detail-page">'+backButton('landing','Back to services')+'<div class="service-detail"><div class="service-detail-image">'+image(s.img,s.name)+'</div><div class="service-detail-copy"><p class="eyebrow">AT-HOME BEAUTY · '+esc(s.category)+'</p><h1>'+esc(s.name)+'</h1><p class="service-detail-intro">'+esc(s.desc || 'Explore this service and choose a professional during booking.')+'</p><div class="service-detail-facts"><div><span>Service price</span><strong>'+money(s.price)+'</strong></div><div><span>Duration</span><strong>'+esc(s.duration)+'</strong></div><div><span>Experience</span><strong>At your home</strong></div></div><p class="service-detail-note">Choose a professional, date and time in the next steps. Availability is confirmed during booking.</p><div class="service-detail-actions">'+button('Book this service '+icon('arrow',17),'book-home','btn-primary','data-id="'+esc(s.id)+'"')+'<button class="btn btn-outline" data-action="wish" data-id="'+esc(s.id)+'" aria-pressed="'+state.wishlist.includes(s.id)+'">'+icon('heart',17)+' '+(state.wishlist.includes(s.id)?'Saved':'Save service')+'</button></div></div></div><section class="detail-block service-detail-about"><p class="eyebrow">YOUR BEAUTY, YOUR WAY</p><h2>Care that comes to you.</h2><p>Discover the service, choose an independent professional, and plan your appointment in one place.</p></section>'+listingReviewSection('service',s.id)+'</main>';
}

function professionalCard(p){
  return '<article class="pro-card"><div class="pro-top">'+image(p.img,p.name,'pro-avatar')+'<div><h3>'+esc(p.name)+'</h3><span>'+esc(p.specialty)+'</span></div></div><p>'+esc(p.experience)+'</p><div class="pro-bottom">'+''+'<span>From '+money(p.price)+'</span></div><button class="pro-book" data-action="book-pro" data-id="'+p.id+'">View availability '+icon('arrow',16)+'</button></article>';
}

function homePage(){
  const userCity = normalizeCity(state.location);
  const cityServices = services.filter(s => isServiceAvailableInCity(s, userCity));
  let filtered = cityServices.filter(s => state.homeCategory === 'All' || s.category === state.homeCategory);
  if(state.sort === 'rating') filtered = [...filtered].sort((a,b) => Number(b.rating) - Number(a.rating));
  if(state.sort === 'price') filtered = [...filtered].sort((a,b) => a.price - b.price);
  const citySwitchBtns = '<div class="filter-row" style="justify-content:center;margin-top:14px">' +
    ['Bandra West, Mumbai','Indiranagar, Bengaluru','Hauz Khas, South Delhi'].map(loc => '<button type="button" class="filter-chip" data-action="location-set" data-id="'+loc+'">Switch to '+normalizeCity(loc)+'</button>').join('') +
    '</div>';
  const servicesSection = !services.length && state.catalogFeedsLoading.services
    ? catalogLoadingState('home treatments')
    : !services.length && state.catalogErrors.services
      ? catalogUnavailableState('Home treatments catalog')
      : filtered.length
        ? '<div class="card-grid">'+filtered.map(homeCard).join('')+'</div>'
        : empty('spark','No home services in '+esc(userCity)+' yet','Switch to another metro city or try All categories.', citySwitchBtns);
  const cityPros = professionals.filter(p => isProAvailableInCity(p, userCity));
  const prosSection = !professionals.length && state.catalogFeedsLoading.professionals
    ? catalogLoadingState('specialists')
    : !professionals.length && state.catalogErrors.professionals
      ? catalogUnavailableState('Professionals directory')
      : cityPros.length
        ? '<div class="pro-grid">'+cityPros.map(professionalCard).join('')+'</div>'
        : empty('user','No specialists listed in '+esc(userCity)+' yet','Try another city or check back later.');
  const homeCategoryImages = {
    Hair: './assets/cat-hair.webp',
    Skin: photo('photo-1570172619644-dfd03ed5d881', 640),
    Waxing: './assets/cat-waxing.webp',
    Threading: photo('photo-1516975080664-ed2fc6a32937', 640),
    Nails: './assets/cat-nails.webp',
    Makeup: './assets/cat-makeup.webp',
    Spa: photo('photo-1540555700478-4be289fbecef', 640),
    Packages: photo('photo-1515377905703-c4788e51af15', 640)
  };
  return '<main><section class="home-hero"><div class="hero-copy"><p class="eyebrow line-eyebrow">BEAUTY, BROUGHT TO YOU</p><h1>Professional beauty care. <em>Right at your doorstep.</em></h1><p>Expert hands, thoughtful rituals and time for yourself—beautifully brought to the comfort of home.</p><div class="hero-buttons">'+button('Book a service '+icon('arrow',18),'scroll','btn-primary','data-target="popular"')+button('How it works','scroll','btn-outline','data-target="how"')+'</div><div class="hero-proof"><span>'+icon('spark',17)+' Independent professionals</span><span>'+icon('spark',17)+' Care chosen for you</span></div></div><div class="hero-visual">'+image(HOME_IMG,'A professional beautician providing a facial treatment')+'<div class="visual-note"><span>THE GLAMGO EDIT</span><strong>Your moment of care,<br>in your own space.</strong></div></div></section><section class="search-strip"><div><span class="eyebrow">WHAT FEELS GOOD TODAY?</span><h2>Find your next moment of care.</h2></div><button data-action="search-open">'+icon('search',19)+' Search for a service <span>Explore '+icon('arrow',16)+'</span></button></section><section class="section" id="categories">'+sectionHead('EXPLORE BY CATEGORY','The care you\'re looking for.','From a little refresh to a complete ritual.')+'<div class="category-grid home-categories">'+homeCategories.slice(1).map((c,i)=>'<button data-action="home-category" data-id="'+c+'" class="category-tile"><div class="category-art cat-'+i+'">'+image(homeCategoryImages[c],c+' beauty services')+'</div><span>'+c+'</span>'+icon('arrow',17)+'</button>').join('')+'</div></section><section class="section soft-section" id="popular">'+sectionHead('BOOK WHAT YOU LOVE','Home services in '+esc(userCity)+'.','Expert care for the moments that matter.')+'<div class="listing-tools"><div class="filter-row">'+homeCategories.map(c=>'<button class="filter-chip '+(state.homeCategory===c?'active':'')+'" data-action="home-category" data-id="'+c+'" aria-pressed="'+(state.homeCategory===c)+'">'+c+'</button>').join('')+'</div><label class="sort-label">'+icon('filter',17)+' Sort by <select id="home-sort"><option value="featured" '+(state.sort==='featured'?'selected':'')+'>Featured</option><option value="price" '+(state.sort==='price'?'selected':'')+'>Price: low to high</option></select></label></div>'+servicesSection+'</section><section class="section" id="professionals">'+sectionHead('IN GOOD HANDS','Meet your beauty experts.','Explore professionals available in '+esc(userCity)+'.','<span class="section-aside">Personal service, every time.</span>')+' '+prosSection+'</section><section class="how-section" id="how"><div class="how-heading"><p class="eyebrow">SIMPLE BY DESIGN</p><h2>A beautiful experience, <em>from start to finish.</em></h2></div><div class="steps">'+[['01','Choose your service','Find the treatment or package that feels right.'],['02','Meet your professional','Select an expert whose style suits you.'],['03','Pick your moment','Book a date and time that fits your day.'],['04','Enjoy your service','Make room for beauty, right at home.']].map(x=>'<div class="step"><span>'+x[0]+'</span><h3>'+x[1]+'</h3><p>'+x[2]+'</p></div>').join('')+'</div></section><section class="section package-section"><div class="package-image">'+image(images.spa,'Relaxing beauty ritual')+'</div><div class="package-copy"><p class="eyebrow">THE GLAMGO EDIT</p><h2>Make time for <em>all of you.</em></h2><p>Explore spa services from independent beauty professionals and find a moment that feels right for you.</p>'+button('Explore spa services '+icon('arrow',17),'home-category','btn-primary','data-id="Spa"')+'</div></section><section class="section review-section">'+sectionHead('YOUR EXPERIENCE MATTERS','Care worth coming back to.','After every booking, your feedback helps shape a better GlamGo.')+'<div class="review-panel">'+icon('star',30)+'<div><h3>Your voice belongs here.</h3><p>Book a service and share a review from your account after your appointment.</p></div>'+button('Explore services '+icon('arrow',17),'scroll','btn-outline','data-target="popular"')+'</div></section></main>';
}

function salonCard(s){
  const distText = s.distanceLabel || '';
  return '<article class="salon-card"><div class="salon-image">'+image(s.img,s.name+' salon','card-img')+'</div><div class="salon-body"><div class="salon-title"><h3>'+s.name+'</h3>'+''+'</div><p>'+icon('pin',15)+esc(s.area)+(distText?' <i>·</i> '+esc(distText):'')+'</p><div class="salon-services">'+s.services.map(x=>'<span>'+x+'</span>').join('')+'</div><div class="card-bottom"><strong>Services from '+money(s.price)+'</strong><button data-action="salon-detail" data-id="'+s.id+'">View salon '+icon('arrow',16)+'</button></div></div></article>';
}

function salonPage(){
  const userCity = normalizeCity(state.location);
  const citySalons = salons
    .filter(s => String(s.city || normalizeCity(s.area) || '').toLowerCase() === userCity.toLowerCase())
    .map(enrichSalonWithDistance);
  const maxKm = !Array.isArray(state.userCoords) || state.salonDistanceFilter === 'all'
    ? Infinity
    : state.salonDistanceFilter === 'nearest'
      ? NEAR_SALON_RADIUS_KM
      : Number(state.salonDistanceFilter || Infinity);
  let list = citySalons.filter(s => (state.salonCategory === 'All' || s.services.includes(state.salonCategory)) && (maxKm === Infinity || (s.distanceKm != null && s.distanceKm <= maxKm)));
  if(state.sort === 'rating') list = [...list].sort((a,b) => Number(b.rating) - Number(a.rating));
  else if(state.sort === 'price') list = [...list].sort((a,b) => a.price - b.price);
  else list = [...list].sort((a,b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  const nearbyCount = citySalons.filter(s => s.isFar === false).length;
  const hasDistances = citySalons.some(s => s.distanceKm != null);
  const distanceOptions = [
    { id: 'all', label: 'All distances' },
    { id: 'nearest', label: 'Near you (≤8 km)' },
    { id: '5', label: 'Within 5 km' },
    { id: '10', label: 'Within 10 km' }
  ];
  const distanceRow = !hasDistances ? '' : '<div class="filter-row" style="margin:-14px 0 26px">' +
    distanceOptions.map(opt => '<button type="button" class="filter-chip '+((state.salonDistanceFilter||'all')===opt.id?'active':'')+'" data-action="salon-distance" data-id="'+opt.id+'">'+esc(opt.label)+'</button>').join('') +
    '</div>';
  const salonsSection = !salons.length && state.catalogFeedsLoading.salons
    ? catalogLoadingState('salons near you')
    : !salons.length && state.catalogErrors.salons
      ? catalogUnavailableState('Salons directory')
      : '<div class="salon-grid">'+list.map(salonCard).join('')+'</div>'+(list.length?'':empty('search',citySalons.length?'No salons match these filters':'No salons are listed in '+esc(userCity)+' yet',citySalons.length?'Try another category or distance.':'Try another city or check back later.', (hasDistances && state.salonDistanceFilter!=='all'?'<button type="button" class="btn btn-outline" data-action="salon-distance" data-id="all">Show all distances</button>':'')));
  return '<main><section class="salon-hero"><div class="salon-hero-image">'+image(SALON_IMG,'Luxury contemporary salon interior')+'</div><div class="salon-hero-copy"><p class="eyebrow line-eyebrow">THE SALON EDIT</p><h1>Discover salons that make you <em>feel your best.</em></h1><p>Explore independent salons and parlours in '+esc(userCity)+'.</p>'+button('Explore salons '+icon('arrow',18),'scroll','btn-primary','data-target="salons"')+'</div></section><section class="salon-search-box"><div><label>WHERE</label><button data-action="location">'+icon('pin',18)+esc(state.location)+'</button></div><div><label>WHAT</label><button data-action="search-open">'+icon('search',18)+' Service or salon name</button></div>'+button('Find salons '+icon('arrow',18),'scroll','btn-primary','data-target="salons"')+'</section><section class="section" id="salon-categories">'+sectionHead('FIND YOUR FIT','An appointment for every mood.','Discover a salon by the care you have in mind.')+'<div class="salon-category-grid">'+salonCategories.slice(1).map((c,i)=>'<button data-action="salon-category" data-id="'+c+'" class="salon-category-card">'+image([images.hair,images.facial,images.nails,images.makeup,images.spa][i],c+' services')+'<span>'+c+' '+icon('arrow',17)+'</span></button>').join('')+'</div></section><section class="section soft-section" id="salons">'+sectionHead('DISCOVER SALONS','Salons in '+esc(userCity)+'.',(citySalons.length?(citySalons.length+(citySalons.length===1?' salon in ':' salons in ')+esc(userCity)+(hasDistances?' · '+nearbyCount+' within 8 km':'')):('Discover independent salons in '+esc(userCity)+'.')))+'<div class="listing-tools"><div class="filter-row">'+salonCategories.map(c=>'<button class="filter-chip '+(state.salonCategory===c?'active':'')+'" data-action="salon-category" data-id="'+c+'" aria-pressed="'+(state.salonCategory===c)+'">'+c+'</button>').join('')+'</div><label class="sort-label">'+icon('filter',17)+' Sort by <select id="salon-sort"><option value="featured" '+((state.sort==='featured'||state.sort==='nearest')?'selected':'')+'>Featured</option><option value="price" '+(state.sort==='price'?'selected':'')+'>Price: low to high</option></select></label></div>'+distanceRow+salonsSection+'</section><section class="section salon-note"><div><p class="eyebrow">A LITTLE MORE PERSONAL</p><h2>Find your place. <em>Feel at home.</em></h2><p>Explore a salon’s services before you plan your visit.</p></div>'+button('View appointments '+icon('arrow',17),'account-bookings','btn-outline')+'</section></main>';
}

const backButton = (act, label = 'Go back') => '<button class="back-link" data-action="'+act+'" aria-label="'+esc(label)+'" title="'+esc(label)+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg></button>';
function salonDetail(){
  const rawSalon = salons.find(x => String(x.id) === String(state.selectedSalon));
  if (!rawSalon) return '<main class="detail-page">'+backButton('landing','Back to salons')+(state.catalogFeedsLoading.salons?catalogLoadingState('salon details'):state.catalogErrors.salons?catalogUnavailableState('Salon details'):empty('salon','Salon unavailable','This salon is no longer listed.'))+'</main>';
  const s = enrichSalonWithDistance(rawSalon);
  const staff = Array.isArray(s.staff) ? s.staff : [];
  const categories = Array.isArray(s.services) ? s.services : [];
  return '<main class="detail-page">'+backButton('landing','Back to salons')+'<div class="salon-profile-image">'+image(s.img,s.name+' salon')+'</div><div class="detail-header"><div><p class="eyebrow">SALON & PARLOUR</p><h1>'+esc(s.name)+'</h1><p>'+icon('pin',17)+esc(s.area)+(s.distanceLabel?' · '+esc(s.distanceLabel):'')+'</p></div></div><div class="detail-columns"><div><section class="detail-block"><h2>About the salon</h2><p>'+esc(s.about||'Discover the services offered by this independent salon.')+'</p></section><section class="detail-block"><h2>Explore services</h2><p>Explore the categories offered by this salon, then choose a service in the booking flow.</p>'+(categories.length?categories.map(c=>'<div class="service-line"><div><strong>'+esc(c)+'</strong></div></div>').join(''):'<p>Service categories are not available yet.</p>')+'</section><section class="detail-block"><h2>Meet the team</h2>'+(staff.length?'<div class="staff-row">'+staff.map(p=>'<div>'+(p.img?image(p.img,p.name):'')+'<strong>'+esc(p.name)+'</strong><span>'+esc(p.specialty||'Beauty professional')+'</span></div>').join('')+'</div>':'<p>Team information has not been added yet.</p>')+'</section>'+listingReviewSection('salon',s.id)+'</div><aside class="detail-aside"><p class="eyebrow">YOUR VISIT</p><h3>Plan your appointment</h3><p>'+icon('pin',17)+esc(s.area)+'</p>'+(s.hours?'<p>'+icon('clock',17)+esc(s.hours)+'</p>':'')+(s.price!=null?'<p>Services from <strong>'+money(s.price)+'</strong></p>':'')+'<p>Choose a service and appointment time in the booking flow.</p>'+button('Book an appointment '+icon('arrow',18),'book-salon','btn-primary full','data-id="'+esc(s.id)+'"')+'</aside></div></main>';
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
  return '<article class="product-card"><div class="product-image" data-action="product-detail" data-id="'+p.id+'">'+image(p.img,p.name)+''+'<button class="wishlist-on-card '+(state.wishlist.includes(p.id)?'saved':'')+'" data-action="wish" data-id="'+p.id+'" aria-pressed="'+(state.wishlist.includes(p.id)?'true':'false')+'" aria-label="Save '+esc(p.name)+'">'+icon('heart',16)+'</button></div><div class="product-body"><span class="product-brand">'+esc(p.brand)+'</span><button class="product-name" data-action="product-detail" data-id="'+p.id+'">'+esc(p.name)+'</button>'+(sizeHint||stockInfo.low?'<div class="product-meta-line">'+(sizeHint?'<span>'+esc(sizeHint)+'</span>':'')+(stockInfo.low?'<span class="product-low-stock">'+esc(stockInfo.label)+'</span>':'')+'</div>':'')+'<div class="product-bottom"><div class="product-pricing"><strong class="product-price">'+money(p.price)+'</strong>'+(hasMrp?'<del class="product-old">'+money(p.old)+'</del>'+(discountPct>0?'<span class="product-save">'+discountPct+'% off</span>':''):'')+'</div><button class="add-bag-btn'+(isSoldOut?' sold-out':isAdded?' added':'')+(isLoading?' is-loading':'')+'" data-action="add-cart" data-id="'+p.id+'"'+(defaultVariant?' data-variant="'+esc(defaultVariant)+'"':'')+(isSoldOut||isLoading?' disabled aria-disabled="true"':'')+' aria-label="'+esc(btnLabel)+' '+esc(p.name)+'">'+btnLabel+'</button></div></div></article>';
}

function shopPage(){
  if (!['All','OFFERS'].includes(state.shopCollection)) state.shopCollection = 'All';
  const list = getFilteredShopProducts(products);
  const catalogDown = !products.length && state.catalogErrors.products;
  const catalogBusy = !products.length && state.catalogFeedsLoading.products;
  const shopBrands = ['All', ...Array.from(new Set(products.map(p => p.brand).filter(Boolean)))];
  const visibleCollections = shopCollections.filter(col => col.id === 'All' || (col.id === 'OFFERS' && products.some(p => getDiscountPct(p) > 0)));
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
      : '<div class="product-grid">'+list.map(productCard).join('')+'</div>'+(list.length?'':'<div class="empty-filtered">'+empty('search',products.length?'No products match these filters':'No products are listed yet',products.length?'Try clearing one of your active filters or explore the full edit.':'Check back as independent sellers add their products.')+'<div class="empty-actions">'+button('Reset all filters '+icon('arrow',16),'shop-reset','btn-outline')+'</div></div>');
  const brandButtons = shopBrands.slice(1).map(b => '<button class="brand-pill'+(state.shopBrand===b?' active':'')+'" data-action="shop-brand" data-id="'+esc(b)+'">'+esc(b)+'</button>').join('');

  return '<main><section class="shop-hero"><div class="shop-hero-copy"><p class="eyebrow line-eyebrow">THE BEAUTY STORE</p><h1>Your beauty essentials, <em>thoughtfully curated.</em></h1><p>Meet the daily rituals, considered formulas and little luxuries you will love living with.</p>'+button('Shop the edit '+icon('arrow',18),'scroll','btn-primary','data-target="bestsellers"')+'</div><div class="shop-hero-image">'+image(SHOP_IMG,'Premium skincare and beauty products')+'</div></section><div class="shop-benefits"><span>'+icon('spark',18)+' Curated with care</span><span>'+icon('truck',19)+' Explore beauty sellers</span><span>'+icon('spark',18)+' Beauty for your routine</span></div><div class="shop-mobile-search"><button class="mobile-search-trigger" data-action="search-open" aria-label="Search beauty store products, ingredients or brands">'+icon('search',18)+'<span>Search products, brands or ingredients</span></button></div><section class="section" id="shop-categories">'+sectionHead('EXPLORE THE STORE','What are you looking for?','A considered collection for every part of your routine.')+'<div class="shop-category-grid">'+shopCategories.slice(1).map((c,i)=>{
    const count = products.filter(p => p.category === c).length;
    return '<button class="shop-category-card'+(state.shopCategory===c?' active':'')+'" data-action="shop-category" data-id="'+c+'"><div>'+image([images.serum,images.lipstick,images.haircare,images.cream,images.fragrance,images.tools][i],shopCategoryLabel(c))+'</div><span><span class="cat-copy"><span class="cat-label">'+shopCategoryLabel(c)+'</span>'+(products.length?'<small class="cat-count">'+count+(count===1?' product':' products')+'</small>':'')+'</span>'+icon('arrow',16)+'</span></button>';
  }).join('')+'</div></section><section class="section soft-section" id="bestsellers">'+sectionHead('THE GLAMGO EDIT','The beauty shelf.','Thoughtfully chosen formulas filtered by category, edit, brand and price.')+'<div class="collection-pills" role="group" aria-label="Filter by collection">'+visibleCollections.map(col => '<button class="collection-pill'+(state.shopCollection===col.id?' active':'')+'" data-action="shop-collection" data-collection="'+col.id+'" aria-pressed="'+(state.shopCollection===col.id)+'">'+col.label+'</button>').join('')+'</div><div class="listing-tools"><div class="filter-row" role="group" aria-label="Filter by category">'+shopCategories.map(c=>'<button class="filter-chip '+(state.shopCategory===c?'active':'')+'" data-action="shop-category" data-id="'+c+'" aria-pressed="'+(state.shopCategory===c)+'">'+shopCategoryLabel(c)+'</button>').join('')+'</div><div class="shop-controls-right">'+(shopBrands.length>2?'<label class="sort-label">Brand <select id="shop-brand-select" aria-label="Filter by brand">'+shopBrands.map(b=>'<option value="'+esc(b)+'" '+(state.shopBrand===b?'selected':'')+'>'+esc(b==='All'?'All brands':b)+'</option>').join('')+'</select></label>':'')+'<label class="sort-label">Sort by <select id="shop-sort"><option value="featured" '+(state.sort==='featured'?'selected':'')+'>Featured</option><option value="price-asc" '+(state.sort==='price-asc'||state.sort==='price'?'selected':'')+'>Price: low to high</option><option value="price-desc" '+(state.sort==='price-desc'?'selected':'')+'>Price: high to low</option></select></label></div></div>'+(products.length?'<div class="shop-shelf-meta"><span class="shelf-count">Showing <strong>'+list.length+'</strong> of '+products.length+(products.length===1?' product':' products')+'</span>'+(hasFilters?'<div class="active-filters">'+activeFilters.map(f=>'<button class="active-filter-chip" data-action="'+f.action+'" data-id="'+esc(f.id)+'" data-collection="All" aria-label="Remove '+esc(f.label)+' filter">'+esc(f.label)+' '+icon('close',13)+'</button>').join('')+'<button class="reset-filters-link" data-action="shop-reset">Reset all</button></div>':'')+'</div>':'')+shelfContent+'</section><section class="shop-editorial"><div>'+image(SHOP_IMG,'Curated beauty products')+'</div><div><p class="eyebrow">BEAUTY, CONSIDERED</p><h2>A routine that <em>feels like you.</em></h2><p>Beautiful essentials, selected for the way you live. Explore products offered by beauty sellers on GlamGo.</p>'+button('Discover skincare '+icon('arrow',17),'shop-category','btn-outline','data-id="Skincare"')+'</div></section>'+(brandButtons?'<section class="brand-section"><p class="eyebrow">DISCOVER BRANDS</p><div>'+brandButtons+'</div></section>':'')+'</main>';
}

function productDetail(){
  const p = products.find(x => String(x.id) === String(state.selectedProduct));
  if (!p) {
    return '<main class="detail-page">'+backButton('landing','Back to shop')+(state.catalogFeedsLoading.products?catalogLoadingState('product details'):catalogUnavailableState('Product details'))+'</main>';
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
  const offersHtml = offers.length ? '<div class="product-offers"><p class="eyebrow">MARKETPLACE MERCHANTS ('+offers.length+')</p><p class="offers-sub">Explore available offers from marketplace sellers.</p>'+offers.map(off=>{
    const offerVariant = off.variant_name || variant || '';
    return '<div class="offer-row"><div><strong>'+esc(off.seller_name||'Marketplace seller')+'</strong><small>'+(offerVariant?esc(offerVariant)+' · ':'')+'SKU: '+esc(off.sku)+' · '+off.stock+' in stock</small></div><div class="offer-row-right"><strong>'+money(off.price)+'</strong><button class="btn btn-outline btn-sm" data-action="add-cart" data-id="'+p.id+'" data-listing="'+off.id+'"'+(offerVariant?' data-variant="'+esc(offerVariant)+'"':'')+(off.stock<=0?' disabled':'')+'>Select Offer</button></div></div>';
  }).join('')+'</div>' : '';

  const ingredientItems = parseIngredientsList(p.ingredients);
  const reviewState = state.productReviews?.[p.id];
  const liveReviews = Array.isArray(reviewState?.items) ? reviewState.items : [];
  const activeTab = ['details','ingredients','delivery','reviews'].includes(state.pdpTab) ? state.pdpTab : 'details';

  let tabPanelHtml = '';
  if (activeTab === 'details') {
    tabPanelHtml = '<p class="pdp-tab-copy">'+esc(p.description)+'</p><dl class="pdp-specs"><div><dt>Brand</dt><dd>'+esc(p.brand)+'</dd></div><div><dt>Category</dt><dd>'+esc(shopCategoryLabel(p.category))+'</dd></div>'+(variants.length?'<div><dt>Available options</dt><dd>'+esc(variants.join(', '))+'</dd></div>':'')+'<div><dt>Availability</dt><dd>'+esc(stockInfo.label)+'</dd></div>'+''+'</dl>';
  } else if (activeTab === 'ingredients') {
    tabPanelHtml = ingredientItems.length
      ? '<p class="pdp-tab-sub">Key botanicals and formulation ingredients listed for this product:</p><div class="ingredient-chips">'+ingredientItems.map(ing=>'<span class="ingredient-chip">'+esc(ing)+'</span>').join('')+'</div><p class="pdp-tab-note">Full ingredient breakdown: '+esc(p.ingredients)+'</p>'
      : '<p class="pdp-tab-copy">See outer product packaging for complete batch ingredients.</p>';
  } else if (activeTab === 'delivery') {
    tabPanelHtml = '<div class="pdp-policy-list"><div><strong>Delivery</strong><p>Available delivery options and charges are shown during checkout.</p></div><div><strong>Returns &amp; support</strong><p>For help with an order, visit My orders or contact customer support.</p></div></div>';
  } else {
    const reviewsBody = reviewState?.loading
      ? '<p class="pdp-tab-sub">Loading customer reviews…</p>'
      : reviewState?.error
        ? '<p class="pdp-tab-sub">Reviews could not be loaded. Please try again later.</p>'
        : liveReviews.length
          ? '<div class="pdp-review-list">'+liveReviews.map(r=>'<article class="pdp-review-item"><div class="pdp-review-head"><strong>'+esc(r.user_name||'GlamGo customer')+'</strong><span class="rating">'+icon('star',14)+' '+Number(r.rating||0)+'</span></div>'+(r.comment?'<p>'+esc(r.comment)+'</p>':'')+'</article>').join('')+'</div>'
          : '<p class="pdp-tab-sub">No customer reviews to show yet.</p>';
    tabPanelHtml = reviewsBody;
  }

  const related = getRelatedProducts(p, 3);
  const relatedHtml = related.length
    ? '<section class="pdp-related" aria-label="More in this category"><div class="pdp-related-head"><div><p class="eyebrow">MORE TO DISCOVER</p><h2>More from the beauty shelf</h2></div>'+button('Browse full edit '+icon('arrow',16),'shop-all','btn-outline')+'</div><div class="product-grid pdp-related-grid">'+related.map(productCard).join('')+'</div></section>'
    : '';

  return '<main class="detail-page"><nav class="pdp-breadcrumb" aria-label="Breadcrumb"><button data-action="shop-all">Beauty Store</button><span>/</span><button data-action="shop-category" data-id="'+esc(p.category)+'">'+esc(shopCategoryLabel(p.category))+'</button><span>/</span><span aria-current="page">'+esc(p.name)+'</span></nav><div class="product-detail"><div class="product-detail-image">'+image(p.img,p.name)+''+(discountPct>0?'<span class="pdp-discount-badge">'+discountPct+'% OFF</span>':'')+'</div><div class="product-detail-info"><div class="pdp-brand-row"><button class="eyebrow pdp-brand-link" data-action="shop-brand" data-id="'+esc(p.brand)+'">'+esc(p.brand)+'</button>'+''+'</div><h1>'+esc(p.name)+'</h1><div class="pdp-rating-row"><button class="pdp-rating-jump" data-action="pdp-reviews-jump">Customer reviews</button><span class="stock-pill '+(stockInfo.soldOut?'out':stockInfo.low?'low':'in')+'">'+esc(stockInfo.label)+'</span></div><div class="product-detail-price">'+money(p.price)+(hasMrp?'<del>'+money(p.old)+'</del><span>Save '+money(p.old-p.price)+' ('+discountPct+'% off)</span>':'')+'</div>'+'<p class="product-desc">'+esc(p.description)+'</p>'+(variants.length?'<div class="variant-select"><span>'+getVariantHeading(p,variants)+'</span><div>'+variants.map(v=>{
    const vStock = getStockInfo(p, v);
    return '<button class="'+(v===variant?'active':'')+(vStock.soldOut?' sold-out-var':'')+'" data-action="variant" data-id="'+esc(v)+'">'+esc(v)+'</button>';
  }).join('')+'</div></div>':'')+'<div class="detail-actions">'+button(detailBtnLabel,'add-cart','btn-primary'+(isAdded?' added':''),'data-id="'+p.id+'"'+(variant?' data-variant="'+esc(variant)+'"':'')+(isSoldOut||isLoading?' disabled':''))+button('Buy now '+icon('arrow',17),'buy-now','btn-outline','data-id="'+p.id+'"'+(variant?' data-variant="'+esc(variant)+'"':'')+(isSoldOut?' disabled':''))+'<button class="detail-wish '+(state.wishlist.includes(p.id)?'saved':'')+'" data-action="wish" data-id="'+p.id+'" aria-pressed="'+(state.wishlist.includes(p.id)?'true':'false')+'" aria-label="Add to wishlist">'+icon('heart',20)+'</button></div>'+offersHtml+'<div class="product-facts"><div>'+icon('bag',20)+' Offered by marketplace sellers</div><div>'+icon('truck',20)+' Delivery options at checkout</div></div><div class="pdp-tabs" role="tablist" aria-label="Product information">'+[['details','Details'],['ingredients','Ingredients'],['delivery','Delivery & Returns'],['reviews','Reviews']].map(([tid,tlabel])=>'<button role="tab" aria-selected="'+(activeTab===tid?'true':'false')+'" class="pdp-tab '+(activeTab===tid?'active':'')+'" data-action="pdp-tab" data-id="'+tid+'">'+tlabel+'</button>').join('')+'</div><div class="pdp-tab-panel" id="pdp-tab-panel" role="tabpanel">'+tabPanelHtml+'</div></div></div>'+relatedHtml+'</main>';
}

function account(){
  const tabs = ['Overview','Personal information','Saved addresses','My bookings','My orders','Wishlist','Payment methods','Notifications','Coupons & rewards','Reviews','Customer support'];
  let content = '';
  if(state.accountTab==='Overview') content='<div class="account-welcome"><p class="eyebrow">GOOD TO SEE YOU</p><h2>Hello, '+esc(state.user.name.split(' ')[0])+'.</h2><p>Every side of beauty, together in one place.</p></div>'+(state.user?.role==='admin'?'<div class="account-block" style="border:1px solid var(--champagne);background:rgba(197,167,125,0.06);margin-bottom:20px"><h3>Platform Administrator</h3><p>You have full governance authority across partner onboarding, users, bookings, orders, and economics.</p>'+button('Admin Command Centre '+icon('arrow',16),'admin','btn-primary')+'</div>':'')+'<div class="account-quick"><button data-action="account-tab" data-id="My bookings">'+icon('calendar',23)+'<strong>'+state.bookings.length+(state.bookings.length===1?' booking':' bookings')+'</strong><span>Appointments and home services</span>'+icon('arrow',17)+'</button><button data-action="account-tab" data-id="My orders">'+icon('bag',23)+'<strong>'+state.orders.length+(state.orders.length===1?' order':' orders')+'</strong><span>Your beauty store purchases</span>'+icon('arrow',17)+'</button><button data-action="account-tab" data-id="Wishlist">'+icon('heart',23)+'<strong>'+state.wishlist.length+' saved</strong><span>Things you love</span>'+icon('arrow',17)+'</button></div><div class="account-block"><h3>Your details</h3><p>'+esc(state.user.email)+' · '+esc(state.user.phone)+'</p><button data-action="account-tab" data-id="Personal information">Edit information '+icon('arrow',15)+'</button></div>';
  else if(state.accountTab==='Personal information') content='<div class="account-block"><h2>Personal information</h2><p>Keep your contact details current for bookings and orders.</p><form id="profile-form" class="form-grid"><label>Full name<input name="name" required value="'+esc(state.user.name)+'"></label><label>Email address<input name="email" type="email" required value="'+esc(state.user.email)+'"></label><label>Phone number<input name="phone" required value="'+esc(state.user.phone)+'"></label><button class="btn btn-primary" type="submit">Save changes</button></form></div>';
  else if(state.accountTab==='Saved addresses') content='<div class="account-block"><div class="account-heading"><h2>Saved addresses</h2>'+button('Add address '+icon('plus',17),'address-add','btn-outline')+'</div>'+state.addresses.map((a,i)=>'<div class="address-card"><div>'+icon('pin',20)+'<span><strong>'+esc(a.label)+'</strong><small>'+esc(a.text)+'</small></span></div><button data-action="address-delete" data-id="'+i+'">Remove</button></div>').join('')+'</div>';
  else if(state.accountTab==='My bookings') content='<div class="account-block"><h2>My bookings</h2><p>Home services and salon appointments, together.</p>'+(state.bookings.length?state.bookings.map(b=>{
    const isPending = (b.status && b.status.toLowerCase() === 'pending') || (b.status && b.status.toLowerCase() === 'confirmed' && b.payment_status === 'pending');
    const isConfirmed = !isPending && (!b.status || b.status.toLowerCase() === 'confirmed');
    const isCompleted = b.status && b.status.toLowerCase() === 'completed';
    const isCancelled = b.status && b.status.toLowerCase() === 'cancelled';
    const rescheduleBtn = isConfirmed ? '<button class="text-action" style="margin-top:6px;margin-right:14px;font-size:12px;font-weight:600" data-action="booking-reschedule-open" data-id="'+esc(b.id)+'">1-tap Reschedule</button>' : '';
    const cancelBtn = (isConfirmed || isPending) ? '<button class="text-action" style="color:var(--burgundy,#b33939);margin-top:6px;font-size:12px;font-weight:600" data-action="booking-cancel" data-id="'+b.id+'">Cancel appointment</button>' : '';
    const reviewBtn = isCompleted ? '<button class="text-action" style="color:var(--champagne,#c5a77d);margin-top:6px;font-size:12px;font-weight:600" data-action="review-add">Write a review</button>' : '';
    const otpLine = (isConfirmed && b.payment_status === 'completed' && b.arrival_otp) ? '<small style="display:block;margin-top:3px;color:var(--ink)">Arrival PIN: <strong>'+esc(b.arrival_otp)+'</strong> (share with your specialist at doorstep)</small>' : '';
    const addonsLine = (Array.isArray(b.addons) && b.addons.length) ? '<small style="display:block;margin-top:3px;color:var(--muted)">Add-ons: '+esc(b.addons.map(x => x.name || x).join(', '))+'</small>' : '';
    const payStatus = b.payment_status ? '<small style="display:block;margin-top:3px;color:var(--muted)">Payment: '+esc(b.payment_status)+'</small>' : '';
    return '<div class="history-card"><div class="history-icon">'+icon(b.type==='home'?'home':'salon',22)+'</div><div><span class="eyebrow">'+(b.type==='home'?'AT-HOME SERVICE':'SALON APPOINTMENT')+'</span><h3>'+esc(b.title)+'</h3><p>'+formatDate(b.date)+' · '+b.time+' · '+esc(b.location)+'</p>'+addonsLine+otpLine+payStatus+'<div>'+rescheduleBtn+cancelBtn+reviewBtn+'</div></div><span class="status '+(isCancelled?'status-cancelled':isCompleted?'status-completed':'')+'">'+esc(b.payment_status==='expired'?'Expired':isPending?'Awaiting payment':b.status||'Confirmed')+'</span></div>';
  }).join(''):empty('calendar','Your next moment awaits','Choose a home service or salon appointment to see it here.',button('Explore beauty '+icon('arrow',16),'experience','btn-primary','data-id="home"')))+'</div>';
  else if(state.accountTab==='My orders') content='<div class="account-block"><h2>My orders</h2><p>Your beauty store purchases and delivery updates.</p>'+(state.orders.length?state.orders.map(o=>'<div class="history-card"><div class="history-icon">'+icon('bag',22)+'</div><div><span class="eyebrow">ORDER '+esc(o.id)+' · '+esc(String(o.status||'placed').replace('_',' ').toUpperCase())+'</span><h3>'+(o.items||[]).map(i=>esc(i.name)+(i.variant_name?' ('+esc(i.variant_name)+')':'')+' × '+i.qty).join(', ')+'</h3><p>'+formatDate(o.date)+' · '+money(o.total)+' · Payment: '+esc(o.payment_status||'pending')+'</p></div><button class="text-action" data-action="tracking" data-id="'+esc(o.id)+'">Track order '+icon('arrow',15)+'</button></div>').join(''):empty('bag','Your beauty bag is waiting','Discover your first favourite in the GlamGo beauty store.',button('Explore the store '+icon('arrow',16),'experience','btn-primary','data-id="shop"')))+'</div>';
  else if(state.accountTab==='Wishlist'){const liked=[...services,...products].filter(x=>state.wishlist.includes(x.id));content='<div class="account-block"><h2>Your wishlist</h2><p>A space for everything that catches your eye.</p>'+(liked.length?'<div class="wishlist-grid">'+liked.map(x=>x.brand?productCard(x):homeCard(x)).join('')+'</div>':empty('heart','Nothing saved yet','Tap the heart on a service or product to keep it close.'))+'</div>';}
  else if(state.accountTab==='Payment methods') content='<div class="account-block"><h2>Payment methods</h2>'+empty('bag','Pay the way you prefer','Choose UPI, card or cash when you confirm a booking or order.')+'</div>';
  else if(state.accountTab==='Notifications') content='<div class="account-block"><h2>Notifications</h2>'+(state.notifications.length?state.notifications.map(n=>'<div class="notification-row">'+icon(n.type==='order'?'bag':'calendar',20)+'<span>'+esc(n.text)+'</span></div>').join(''):empty('bell','All caught up','Booking confirmations and order updates will appear here.'))+'</div>';
  else if(state.accountTab==='Coupons & rewards') content='<div class="account-block"><h2>Coupons &amp; rewards</h2>' +
    '<div class="coupon-card" style="margin-bottom:16px"><p class="eyebrow">GLAMGO WALLET CREDITS</p><h3>'+money(state.walletCredits||0)+' available</h3><p>Apply wallet credits directly toward your Beauty Store order at checkout.</p>' +
    (state.referralCode ? '<p style="margin-top:8px">Your Referral Code: <strong>'+esc(state.referralCode)+'</strong> · Share with friends to earn ₹250 credit.</p>' : '') +
    '<form id="reward-redeem-form" class="coupon-form" style="margin-top:12px"><input name="code" required placeholder="Enter Gift Card (GLAM500, LUXE1000) or Referral Code"><button type="submit">Redeem</button></form></div>' +
    '<div class="coupon-card"><p class="eyebrow">WELCOME GIFT</p><h3>Take 10% off your first beauty store order.</h3><p>Use code <strong>GLAM10</strong> at checkout. Maximum discount ₹300.</p></div></div>';
  else if(state.accountTab==='Reviews') content='<div class="account-block"><div class="account-heading"><h2>My reviews</h2>'+button('Write a review '+icon('plus',17),'review-add','btn-outline')+'</div><p>Your reviews of services, salons, and products.</p>'+(state.reviews.length?state.reviews.map(r=>'<div class="history-card"><div class="history-icon">'+icon('star',22)+'</div><div><span class="eyebrow">'+r.rating+' ★ · '+esc(r.item_type).toUpperCase()+'</span><h3>'+esc(r.comment)+'</h3><p>Reviewed on '+formatDate(r.created_at)+'</p></div></div>').join(''):empty('star','No reviews yet','Share your experience on services you have booked or beauty products you have received.'))+'</div>';
  else content='<div class="account-block"><h2>Customer support</h2><p>We are here to make every experience feel effortless.</p><div class="support-card"><h3>How can we help?</h3><p>Support contact information is not available yet.</p></div></div>';
  return '<main class="account-page"><div class="account-title"><p class="eyebrow">YOUR GLAMGO ACCOUNT</p><h1>One account. <em>Every side of beauty.</em></h1></div><div class="account-layout"><aside class="account-sidebar"><div class="account-person"><span>'+(state.user?.name ? state.user.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() : 'AM')+'</span><div><strong>'+esc(state.user.name)+'</strong><small>'+esc(state.user.email)+'</small></div></div>'+tabs.map(t=>'<button class="'+(state.accountTab===t?'active':'')+'" data-action="account-tab" data-id="'+t+'">'+t+icon('arrow',15)+'</button>').join('')+'<button class="logout" data-action="logout">'+icon('logout',17)+' Log out</button></aside><div class="account-content">'+content+'</div></div></main>';
}

function cartPage(){
  const savedCount = countCart();
  const entries = getCartEntries();
  const popularPicks = products.slice(0,3);
  const unavailableKeys = Object.keys(state.cart || {}).filter(key => Number(state.cart[key]) > 0 && !products.some(p => String(p.id) === parseCartKey(key).productId));
  const catalogReady = !state.catalogFeedsLoading.products && !state.catalogErrors.products;
  const unavailableHtml = catalogReady && unavailableKeys.length ? '<div class="unavailable-cart-items" role="status"><h3>Unavailable items</h3><p>These items are no longer in the catalogue. Remove them before checkout.</p>'+unavailableKeys.map(key=>'<div><span>Item '+esc(parseCartKey(key).productId)+' · quantity '+Number(state.cart[key])+'</span><button class="text-action" data-action="cart-remove" data-id="'+esc(key)+'">Remove unavailable item</button></div>').join('')+'</div>' : '';
  if (unavailableHtml && !entries.length) return '<main class="cart-page"><div class="page-heading"><p class="eyebrow">THE BEAUTY STORE</p><h1>Your beauty bag.</h1></div>'+unavailableHtml+button('Explore the store '+icon('arrow',17),'shop-all','btn-outline')+'</main>';
  if (savedCount > 0 && !entries.length) {
    const noticeBody = state.catalogFeedsLoading.products
      ? catalogLoadingState('your saved beauty bag (' + savedCount + ' item' + (savedCount > 1 ? 's' : '') + ')')
      : catalogUnavailableState('Saved beauty bag pricing', 'Your bag still keeps ' + savedCount + ' saved item' + (savedCount > 1 ? 's' : '') + ', but live catalog pricing could not be verified right now.');
    return '<main class="cart-page"><div class="page-heading"><p class="eyebrow">THE BEAUTY STORE</p><h1>Your beauty bag.</h1><p>Saved items remain preserved until the catalog is ready.</p></div>'+noticeBody+'</main>';
  }
  const subtotal = entries.reduce((sum, e) => sum + e.lineTotal, 0);
  return '<main class="cart-page"><div class="page-heading"><p class="eyebrow">THE BEAUTY STORE</p><h1>Your beauty bag.</h1><p>Beautiful things, ready when you are.</p></div>'+(entries.length?'<div class="cart-layout"><div class="cart-items">'+entries.map(e=>'<div class="cart-item">'+image(e.product.img,e.product.name)+'<div><span class="product-brand">'+esc(e.product.brand)+'</span><h3>'+esc(e.product.name)+'</h3><p>'+esc(e.variant || '')+(e.sellerName?' · Sold by '+esc(e.sellerName):'')+'</p><button class="remove-link" data-action="cart-remove" data-id="'+esc(e.key)+'">Remove</button></div><div class="cart-item-end"><strong>'+money(e.lineTotal)+'</strong><div class="qty"><button data-action="cart-qty" data-id="'+esc(e.key)+'" data-delta="-1" aria-label="Decrease quantity">'+icon('minus',15)+'</button><span>'+e.qty+'</span><button data-action="cart-qty" data-id="'+esc(e.key)+'" data-delta="1" aria-label="Increase quantity">'+icon('plus',15)+'</button></div></div></div>').join('')+unavailableHtml+'</div><aside class="order-summary"><h3>Order summary</h3><div><span>Subtotal</span><strong>'+money(subtotal)+'</strong></div><div><span>Delivery</span><strong>'+'Calculated at checkout'+'</strong></div><div class="summary-total"><span>Estimated subtotal</span><strong>'+money(subtotal)+'</strong></div>'+button('Continue to checkout '+icon('arrow',17),'checkout','btn-primary full',unavailableKeys.length?'disabled aria-disabled="true"':'')+'<p>Delivery and payment options are shown at checkout.</p></aside></div>':'<div class="empty-cart-wrap">'+empty('bag','Your bag is waiting to be filled','Explore thoughtfully curated beauty and find something to love.',button('Explore the store '+icon('arrow',17),'shop-all','btn-primary'))+(popularPicks.length?'<section class="empty-cart-recs" aria-labelledby="empty-recs-title"><div class="empty-recs-head"><p class="eyebrow">EXPLORE THE STORE</p><h2 id="empty-recs-title">More to discover</h2></div><div class="product-grid empty-recs-grid">'+popularPicks.map(productCard).join('')+'</div></section>':(state.catalogErrors.products?catalogUnavailableState('Popular recommendations','We could not load live product picks right now.'):''))+'</div>')+'</main>';
}

function checkoutPage(){
  if(!countCart()) return cartPage();
  const entries = getCartEntries();
  if (state.catalogFeedsLoading.products || state.catalogErrors.products || Object.keys(state.cart || {}).some(key => Number(state.cart[key]) > 0 && !products.some(p => String(p.id) === parseCartKey(key).productId))) return cartPage();

  const fp = getCartItemsFingerprint(entries);
  const resState = state.pendingReservation;
  const resData = (resState && resState.fingerprint === fp && resState.data) ? resState.data : null;
  const resError = (resState && resState.fingerprint === fp && resState.error) ? resState.error : null;

  const subtotal = resData ? Number(resData.total_subtotal) : entries.reduce((s, e) => s + e.lineTotal, 0);
  const shipping = resData ? Number(resData.total_shipping) : (subtotal >= 1500 ? 0 : 100);
  const discount = state.pendingCheckoutOrder?.order?.discount != null
    ? Number(state.pendingCheckoutOrder.order.discount)
    : (state.coupon ? Number(state.couponDiscount || (state.coupon === 'GLAM10' ? Math.min(300, Math.round(subtotal * 0.1)) : 0)) : 0);
  const preCreditTotal = Math.max(0, subtotal + shipping - discount);
  const availWallet = Math.max(0, Number(state.walletCredits || 0));
  const creditApplied = (state.applyWalletCredit && availWallet > 0) ? Math.min(availWallet, preCreditTotal) : 0;
  const payableTotal = Math.max(0, preCreditTotal - creditApplied);
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

  const walletBtn = availWallet > 0
    ? '<div style="margin-top:14px"><button type="button" class="filter-chip '+(state.applyWalletCredit?'active':'')+'" data-action="checkout-toggle-credit" aria-pressed="'+(state.applyWalletCredit?'true':'false')+'">'+icon(state.applyWalletCredit?'check':'spark',14)+' Apply GlamGo Wallet Credit (Balance: '+money(availWallet)+')'+(state.applyWalletCredit?' · −'+money(creditApplied):'')+'</button></div>'
    : '';
  return '<main class="checkout-page">'+backButton('cart','Back to bag')+'<div class="page-heading"><p class="eyebrow">ALMOST THERE</p><h1>Checkout.</h1></div><div class="checkout-layout"><div><section class="checkout-block"><h2>01 &nbsp; Delivery address</h2><label>Deliver to<select id="checkout-address">'+state.addresses.map((a,i)=>'<option value="'+i+'"'+(i===addrIdx?' selected':'')+'>'+esc(a.label)+' — '+esc(a.text)+'</option>').join('')+'</select></label><button class="text-action" data-action="address-add">+ Add another address</button></section><section class="checkout-block"><h2>02 &nbsp; Payment method</h2><div class="payment-options">'+['UPI','Credit / debit card','Cash on delivery'].map(p=>'<button data-action="payment" data-id="'+p+'" class="'+(state.checkoutPayment===p?'active':'')+'"'+(state.checkoutBusy?' disabled':'')+'><span class="radio"></span>'+p+'</button>').join('')+'</div></section><section class="checkout-block"><h2>03 &nbsp; Coupon</h2><form id="coupon-form" class="coupon-form"><input name="coupon" placeholder="Enter coupon code" value="'+esc(state.coupon)+'"><button type="submit">Apply</button></form>'+(state.coupon && discount > 0?'<p class="success-note">'+icon('check',16)+' '+esc(state.coupon)+' applied — you save '+money(discount)+'</p>':'')+walletBtn+'</section></div><aside class="order-summary"><h3>Your order</h3>'+sellerPackagesHtml+'<hr><div><span>Subtotal</span><strong>'+money(subtotal)+'</strong></div>'+(discount?'<div><span>Discount</span><strong>−'+money(discount)+'</strong></div>':'')+'<div><span>Delivery &amp; shipping</span><strong>'+(shipping===0?'Complimentary':money(shipping))+'</strong></div>'+(creditApplied>0?'<div><span>Wallet credit applied</span><strong>−'+money(creditApplied)+'</strong></div>':'')+'<div class="summary-total"><span>Total payable</span><strong>'+money(payableTotal)+'</strong></div>'+resNoticeHtml+noticeHtml+button(payLabel,'place-order','btn-primary full',state.checkoutBusy?'disabled aria-disabled="true"':'')+'<p>Pricing and availability are checked with the seller before your order is placed.</p></aside></div></main>';
}

function orderSuccess(){
  const o = state.orders[0] || { id: 'GG000000', total: 0, address: { label: 'Home' } };
  return '<main class="success-page"><div class="success-mark">'+icon('check',34)+'</div><p class="eyebrow">ORDER CONFIRMED</p><h1>A beautiful delivery <em>is on its way.</em></h1><p>Thank you for shopping with GlamGo. Your order '+o.id+' has been placed and will be prepared with care.</p><div class="success-details"><span>ORDER TOTAL <strong>'+money(o.total)+'</strong></span><span>DELIVERING TO <strong>'+esc(o.address?.label||'Home')+'</strong></span></div><div class="success-actions">'+button('Track your order '+icon('arrow',17),'tracking','btn-primary','data-id="'+o.id+'"')+button('Continue shopping','experience','btn-outline','data-id="shop"')+'</div></main>';
}

function trackingPage(){
  const o = state.orders.find(x => x.id === state.trackingId) || state.orders[0];
  if(!o) return account();

  const stepOrder = ['placed', 'packed', 'in_transit', 'delivered'];
  const activeStepIdx = Math.max(0, stepOrder.indexOf(String(o.status || 'placed').toLowerCase()));

  let packagesHtml = '';
  if(o.suborders && o.suborders.length > 0) {
    packagesHtml = '<div class="tracking-packages"><h3>Seller packages (' + o.suborders.length + ')</h3>' +
      o.suborders.map(s => `
        <div class="package-card" style="border:1px solid #eaeaea;border-radius:8px;padding:16px;margin-bottom:14px;background:#faf9f8;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <strong>Package from ${esc(s.seller_name || 'Marketplace seller')}</strong>
            <span class="status-badge" style="background:#222;color:#fff;padding:3px 8px;border-radius:4px;font-size:11px;text-transform:uppercase;">${esc(s.status)}</span>
          </div>
          ${s.shipment ? `
            <p style="font-size:13px;color:#555;margin:4px 0;">
              Carrier: <strong>${esc(s.shipment.carrier_name)}</strong> · Tracking: <strong>${esc(s.shipment.tracking_number)}</strong>
              ${s.shipment.tracking_url ? `<a href="${esc(s.shipment.tracking_url)}" target="_blank" rel="noopener" style="margin-left:8px;color:#8f6d40;text-decoration:underline;">Track courier</a>` : ''}
            </p>
          ` : '<p style="font-size:13px;color:#888;margin:4px 0;">Package being prepared by seller.</p>'}
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
              ` : (it.return_eligible || s.status === 'delivered') ? `
                <button class="btn-outline" style="font-size:11px;padding:4px 8px;margin-top:4px;" data-action="return-request" data-suborder="${esc(s.suborder_id)}" data-item="${it.order_item_id}" data-qty="${it.qty}">Request return</button>
              ` : ''}
            `).join('')}
          </div>
        </div>
      `).join('') + '</div>';
  }

  return '<main class="tracking-page">'+backButton('orders','Back to orders')+'<div class="page-heading"><p class="eyebrow">ORDER '+esc(o.id)+'</p><h1>Your order journey.</h1><p>Placed '+formatDate(o.date)+' · '+money(o.total)+' · Payment: '+esc(o.payment_method||'')+' ('+esc(o.payment_status||'pending')+')</p></div><div class="tracking-card"><div class="tracking-steps">'+[['Order placed','Your order is confirmed and being prepared.'],['Packed with care','Our seller is preparing your beauty essentials.'],['On its way','You will receive a delivery update here.'],['Delivered','Enjoy your new favourites.']].map((x,i)=>'<div class="'+(i<=activeStepIdx?'active':'')+'"><span>'+icon(i<=activeStepIdx?'check':'bag',17)+'</span><div><strong>'+x[0]+'</strong><p>'+x[1]+'</p></div></div>').join('')+'</div><div class="tracking-items">'+(packagesHtml || ('<h3>In this order</h3>'+(o.items||[]).map(i=>'<p>'+esc(i.name)+(i.variant_name?' ('+esc(i.variant_name)+')':'')+' × '+i.qty+'</p>').join('')))+'<p style="margin-top:16px;"><strong>Delivery address</strong><br>'+esc(o.address?.text||state.addresses[0]?.text||'')+'</p></div></div></main>';
}

let partnerLoadSequence = 0;
async function loadPartnerData(){
  const role = state.partnerRole;
  const token = tokenStorage.get();
  const requestId = ++partnerLoadSequence;
  const isCurrent = () => requestId === partnerLoadSequence && token === tokenStorage.get() && role === state.partnerRole;
  state.partnerDataReady = false;
  state.partnerDataError = '';
  try {
    if(state.user?.role === 'customer'){
      try {
        const drafts = await apiGetPartnerDrafts(role);
        if(!isCurrent()) return;
        state.partnerDrafts = drafts;
        state.partnerDataReady = true;
      } catch {
        if(!isCurrent()) return;
        state.partnerDataError = 'Your application status could not be loaded. Please try again.';
      }
      render();
      return;
    }
    const [overviewRes, draftsRes, finRes] = await Promise.allSettled([
      apiGetPartnerOverview(role),
      apiGetPartnerDrafts(role),
      apiGetPartnerFinancials()
    ]);
    if(!isCurrent()) return;
    if(overviewRes.status === 'fulfilled') state.partnerOverview = overviewRes.value;
    if(draftsRes.status === 'fulfilled') state.partnerDrafts = draftsRes.value;
    if(finRes.status === 'fulfilled') state.partnerFinancials = finRes.value;
    const failures = [overviewRes, draftsRes, finRes].filter(r => r.status === 'rejected');

    if(role === 'Professional'){
      const [proRes, srvRes, bRes, catalogRes] = await Promise.allSettled([
        apiGetProfessionalProfile(),
        apiGetProfessionalServices(),
        apiGetProfessionalBookings(),
        apiGetServices()
      ]);
      if(!isCurrent()) return;
      if(proRes.status === 'fulfilled') state.partnerProProfile = proRes.value;
      if(srvRes.status === 'fulfilled') state.partnerProServices = srvRes.value;
      if(bRes.status === 'fulfilled') state.partnerProBookings = bRes.value;
      if(catalogRes.status === 'fulfilled') state.partnerServiceCatalog = catalogRes.value;
      failures.push(...[proRes, srvRes, bRes, catalogRes].filter(r => r.status === 'rejected'));
    } else if(role === 'Salon Owner'){
      const [salRes, staffRes, bRes] = await Promise.allSettled([
        apiGetSalonProfile(),
        apiGetSalonStaff(),
        apiGetSalonBookings()
      ]);
      if(!isCurrent()) return;
      if(salRes.status === 'fulfilled') state.partnerSalonProfile = salRes.value;
      if(staffRes.status === 'fulfilled') state.partnerSalonStaff = staffRes.value;
      if(bRes.status === 'fulfilled') state.partnerSalonBookings = bRes.value;
      failures.push(...[salRes, staffRes, bRes].filter(r => r.status === 'rejected'));
    } else if(role === 'Product Seller'){
      const [prodRes, ordRes, listRes, subRes, retRes, mvFinRes, catalogRes] = await Promise.allSettled([
        apiGetSellerProducts(),
        apiGetSellerOrders(),
        apiGetSellerListings(),
        apiGetSellerSuborders(),
        apiGetSellerReturns(),
        apiGetSellerMultiVendorFinancials(),
        apiGetProducts()
      ]);
      if(!isCurrent()) return;
      if(prodRes.status === 'fulfilled') state.partnerSellerProducts = prodRes.value;
      if(ordRes.status === 'fulfilled') state.partnerSellerOrders = ordRes.value;
      if(listRes.status === 'fulfilled') state.partnerSellerListings = listRes.value;
      if(subRes.status === 'fulfilled') state.partnerSellerSuborders = subRes.value;
      if(retRes.status === 'fulfilled') state.partnerSellerReturns = retRes.value;
      if(mvFinRes.status === 'fulfilled') state.partnerSellerMVFinancials = mvFinRes.value;
      if(catalogRes.status === 'fulfilled') state.partnerProductCatalog = catalogRes.value;
      failures.push(...[prodRes, ordRes, listRes, subRes, retRes, mvFinRes, catalogRes].filter(r => r.status === 'rejected'));
    }
    if(!isCurrent()) return;
    if(role !== 'Product Seller' && state.user?.role !== 'customer') {
      state.partnerAvailabilityReady = false;
      try { const days = await apiGetAvailability(); if(!isCurrent()) return; state.availability = days; state.partnerAvailabilityReady = true; } catch { if(!isCurrent()) return; failures.push({status:'rejected'}); }
    }
    state.partnerDataReady = failures.length === 0;
    state.partnerDataError = failures.length ? 'Some information could not be loaded. Please retry before making decisions based on this page.' : '';
    persist();
    render();
  } catch(err) {
    if(!isCurrent()) return;
    state.partnerDataError = 'Your workspace could not be loaded. Please try again.';
    render();
  }
}

function partnerPage(){
  const role = state.partnerRole, tabs = roleSections[role] || ['Overview'];
  const tab = state.partnerTab;
  const overview = state.partnerOverview;

  const ready = state.partnerDataReady;
  const value = (v, format = false) => v == null ? '—' : (format ? money(v) : v);
  const bookings = role === 'Professional' ? state.partnerProBookings : state.partnerSalonBookings;
  const fallbackMetrics = role === 'Professional' ? [
    ['Upcoming appointments', value((bookings || []).filter(b => b.status === 'confirmed').length)],
    ['Services listed', value(state.partnerProServices?.length)],
    ['Recorded earnings', value(state.partnerFinancials?.net_earnings, true)]
  ] : role === 'Salon Owner' ? [
    ['Appointments', value(bookings?.length)],
    ['Staff members', value(state.partnerSalonStaff?.length)],
    ['Recorded earnings', value(state.partnerFinancials?.net_earnings, true)]
  ] : [
    ['Products', value(state.partnerSellerProducts?.length)],
    ['Orders to fulfill', value((state.partnerSellerSuborders || []).filter(o => ['placed','packed'].includes(o.status)).length)],
    ['Available balance', value(state.partnerSellerMVFinancials?.matured_balance_available, true)]
  ];
  const metrics = (Array.isArray(overview?.metrics) && overview.metrics.length)
    ? overview.metrics.map(m => [m.label, m.value ?? '—'])
    : fallbackMetrics;

  let body = '';

  if(tab === 'Overview'){
    const quick = role === 'Professional' ? ['Upcoming appointments','Availability calendar','Services & pricing','Profile management'] : role === 'Salon Owner' ? ['Appointments','Staff management','Salon profile','Availability'] : ['Orders & fulfillment','Products','Inventory & stock','Returns & refunds'];
    const sellerRecent = (state.partnerSellerSuborders && state.partnerSellerSuborders.length)
      ? state.partnerSellerSuborders.slice(0,4)
      : (state.partnerSellerOrders && state.partnerSellerOrders.length)
        ? state.partnerSellerOrders.slice(0,4)
        : (overview?.orders || []).slice(0,4);
    const bookingRecent = (bookings && bookings.length)
      ? bookings.filter(b => b.status === 'confirmed').slice(0,4)
      : (overview?.bookings || []).filter(b => !b.status || b.status === 'confirmed').slice(0,4);
    const recent = role === 'Product Seller' ? sellerRecent : bookingRecent;
    body = '<div class="dash-intro"><div><p class="dash-kicker">YOUR WORKSPACE</p><h3>Welcome'+(state.user?.name ? ', '+esc(state.user.name.split(' ')[0]) : '')+'.</h3><p>Here’s a look at what matters to your business.</p></div></div>' +
      '<div class="dashboard-metrics">'+metrics.map(x=>'<div><span>'+x[0]+'</span><strong>'+x[1]+'</strong></div>').join('')+'</div>' +
      '<div class="dash-overview-grid"><section class="dashboard-panel"><div class="dash-panel-heading"><div><span class="dash-kicker">STAY ON TOP OF YOUR DAY</span><h3>'+(role === 'Product Seller' ? 'Recent orders' : 'Upcoming appointments')+'</h3></div><button class="dash-link" data-action="partner-tab" data-id="'+(role === 'Product Seller'?'Orders & fulfillment':role === 'Professional'?'Upcoming appointments':'Appointments')+'">View all →</button></div>' +
      (recent.length ? recent.map(b => '<div class="dash-row"><div><strong>'+esc(role === 'Product Seller' ? 'Order #'+(b.suborder_id || b.id) : b.title)+'</strong><small>'+esc(role === 'Product Seller' ? String(b.created_at || b.date || '').slice(0,10) : formatDate(b.date)+' · '+b.time)+'</small></div><span class="dash-status">'+esc(b.status || '')+'</span></div>').join('') : '<div class="dash-empty"><strong>Nothing to show yet</strong><p>'+(ready || overview ? 'New activity will appear here.' : 'Your workspace data is not available yet.')+'</p></div>')+'</section>' +
      '<section class="dashboard-panel"><span class="dash-kicker">QUICK ACTIONS</span><h3>Get things done.</h3><p>Jump straight back into your work.</p><div class="dashboard-actions">'+quick.map(t => '<button data-action="partner-tab" data-id="'+t+'">'+esc(t)+' '+icon('arrow',16)+'</button>').join('')+'</div></section></div>';
  } else if(tab.toLowerCase().includes('registration') || tab === 'Partner application'){
    const drafts = (state.partnerDrafts || []).filter(d => (d.role || '').toLowerCase() === role.toLowerCase() || (d.role || '') === role);
    const pendingDraft = drafts.find(d => d.status === 'PENDING');
    const regConfig = role === 'Salon Owner' ? {
      title: 'Salon & Studio Registration',
      subtitle: 'Register your physical salon or parlour to accept in-salon bookings and manage your team.',
      nameLabel: 'Salon / studio name',
      namePlaceholder: 'e.g. The Ivory Room Studio',
      nameValue: '',
      phoneLabel: 'Studio reception phone',
      cityLabel: 'Salon city & neighbourhood',
      cityPlaceholder: 'e.g. Bandra West, Mumbai',
      priceLabel: 'Average service price (₹)',
      priceValue: '1500',
      descLabel: 'About your salon, chairs & service menu',
      descPlaceholder: 'Describe your studio ambience, number of styling chairs, and core disciplines (Hair, Skin, Nails, Spa)...',
      docsLabel: 'Trade license / GST / hygiene certificate URLs (comma-separated)',
      docsPlaceholder: 'https://example.com/salon-license.pdf, https://example.com/gst.pdf',
      portLabel: 'Salon interior photos or website URLs (comma-separated)',
      portPlaceholder: 'https://instagram.com/your-salon, https://yoursalon.com',
      cta: 'Submit Salon Application'
    } : role === 'Product Seller' ? {
      title: 'Beauty Brand & Seller Registration',
      subtitle: 'Onboard your beauty brand or authorised distributorship to list SKUs in the GlamGo Store.',
      nameLabel: 'Brand or company name',
      namePlaceholder: 'e.g. Lumière Botanicals Pvt. Ltd.',
      nameValue: '',
      phoneLabel: 'Business contact number',
      cityLabel: 'Warehouse / dispatch city',
      cityPlaceholder: 'e.g. Mumbai, Bengaluru, Delhi',
      priceLabel: 'Average product price (₹)',
      priceValue: '1200',
      descLabel: 'Brand story, hero SKUs & product categories',
      descPlaceholder: 'Share your skincare, makeup, haircare or fragrance line, manufacturing standards, and fulfillment SLA...',
      docsLabel: 'GST / cosmetic license / brand authorisation URLs (comma-separated)',
      docsPlaceholder: 'https://example.com/gst-cert.pdf, https://example.com/brand-auth.pdf',
      portLabel: 'Brand store / product catalog URLs (comma-separated)',
      portPlaceholder: 'https://yourbrand.com, https://instagram.com/yourbrand',
      cta: 'Submit Seller Application'
    } : {
      title: 'Independent Beauty Professional Registration',
      subtitle: 'Join GlamGo as a verified at-home specialist for skin, hair, makeup, nails, or spa rituals.',
      nameLabel: 'Full professional name',
      namePlaceholder: 'e.g. Nisha Kapoor',
      nameValue: state.user?.name || '',
      phoneLabel: 'Direct mobile number',
      cityLabel: 'Service city',
      cityPlaceholder: 'Mumbai, Bengaluru, Delhi',
      priceLabel: 'Starting doorstep visit fee (₹)',
      priceValue: '799',
      descLabel: 'Specialties, years of experience & training',
      descPlaceholder: 'Describe your beauty disciplines, years of client experience, and hygiene/kit standards...',
      docsLabel: 'ID proof & beauty certification URLs (comma-separated)',
      docsPlaceholder: 'https://example.com/id-proof.pdf, https://example.com/academy-cert.pdf',
      portLabel: 'Portfolio / Instagram work links (comma-separated)',
      portPlaceholder: 'https://instagram.com/yourwork, https://portfolio.com',
      cta: 'Submit Professional Application'
    };

    body = '<div class="dashboard-panel">' +
      '<div class="account-heading">' +
        '<div>' +
          '<h3>'+regConfig.title+'</h3>' +
          '<p style="color:var(--muted);font-size:12px;margin:4px 0 0">'+regConfig.subtitle+'</p>' +
        '</div>' +
      '</div>' +
      (state.user?.role === 'customer' && !state.partnerDataReady ? '<div class="dash-empty"><strong>Checking your application</strong><p>'+(state.partnerDataError ? 'Please retry to see your application status.' : 'Loading your application status…')+'</p></div>' : pendingDraft ?
        '<div style="background:var(--ivory);border:1px solid var(--champagne);padding:24px;margin-top:20px">' +
          '<span class="badge badge-pending">APPLICATION UNDER REVIEW</span>' +
          '<h4 style="font-family:var(--serif);font-size:24px;margin:12px 0 6px">'+esc(pendingDraft.name)+'</h4>' +
          '<p style="color:var(--muted);font-size:12px;line-height:1.6">'+esc(pendingDraft.description)+'</p>' +
          '<small style="color:var(--muted)">Submitted on '+new Date(pendingDraft.created_at).toLocaleDateString()+' · Reference #'+pendingDraft.id+'</small>' +
        '</div>' :
        '<form id="partner-apply-form" class="form-grid" style="margin-top:20px">' +
          '<label>'+regConfig.nameLabel+'<input name="name" required placeholder="'+esc(regConfig.namePlaceholder)+'" value="'+esc(regConfig.nameValue)+'"></label>' +
          '<label>'+regConfig.phoneLabel+'<input name="phone" required placeholder="+91 98765 43210" value="'+esc(state.user?.phone||'')+'"></label>' +
          '<label>'+regConfig.cityLabel+'<input name="city" required placeholder="'+esc(regConfig.cityPlaceholder)+'" value="Mumbai"></label>' +
          '<label>'+regConfig.priceLabel+'<input name="price" type="number" required placeholder="'+regConfig.priceValue+'" value="'+regConfig.priceValue+'"></label>' +
          '<label style="grid-column:1/-1">'+regConfig.descLabel+'<textarea name="description" required rows="3" placeholder="'+esc(regConfig.descPlaceholder)+'"></textarea></label>' +
          '<label style="grid-column:1/-1">'+regConfig.docsLabel+'<input name="documents" placeholder="'+esc(regConfig.docsPlaceholder)+'"></label>' +
          '<label style="grid-column:1/-1">'+regConfig.portLabel+'<input name="portfolio" placeholder="'+esc(regConfig.portPlaceholder)+'"></label>' +
          '<button class="btn btn-primary" type="submit" style="grid-column:1/-1">'+regConfig.cta+' '+icon('arrow',17)+'</button>' +
        '</form>') +
      (drafts.length ? 
        '<div style="margin-top:35px;border-top:1px solid var(--border);padding-top:20px">' +
          '<h4>Application History</h4>' +
          drafts.map(d => '<div class="dash-row"><div><strong>#'+d.id+' · '+esc(d.name)+'</strong><small>'+money(d.price)+' · Submitted '+new Date(d.created_at).toLocaleDateString()+'</small></div><span class="badge badge-'+d.status.toLowerCase()+'">'+esc(d.status)+'</span></div>').join('') +
        '</div>' : '') +
    '</div>';
  } else if(tab === 'Profile management'){
    const pro = state.partnerProProfile || {};
    body = '<div class="dashboard-panel">' +
      '<h3>Professional Profile & Portfolio</h3>' +
      '<p>Keep your editorial bio, pricing, and certified specialty current for customer booking.</p>' +
      '<form id="partner-pro-profile-form" class="form-grid" style="margin-top:20px">' +
        '<label>Display name<input name="name" required value="'+esc(pro.name || state.user?.name || '')+'"></label>' +
        '<label>Specialty<input name="specialty" required placeholder="e.g. Bridal hair specialist" value="'+esc(pro.specialty || '')+'"></label>' +
        '<label>Experience level<input name="experience" required placeholder="e.g. 8 years of experience" value="'+esc(pro.experience || '')+'"></label>' +
        '<label>Base appointment price (₹)<input name="price" type="number" min="0" required value="'+(pro.price ?? '')+'"></label>' +
        '<label style="grid-column:1/-1">Portfolio image URL<input name="img" required value="'+esc(pro.img || '')+'"></label>' +
        '<button class="btn btn-primary" type="submit" style="grid-column:1/-1">Save Profile Updates '+icon('arrow',17)+'</button>' +
      '</form>' +
    '</div>';
  } else if(tab === 'Salon profile'){
    const sal = state.partnerSalonProfile || {};
    body = '<div class="dashboard-panel">' +
      '<h3>Salon Studio Profile</h3>' +
      '<p>Manage your studio details, neighborhood, operating hours, and photo assets.</p>' +
      '<form id="partner-salon-profile-form" class="form-grid" style="margin-top:20px">' +
        '<label>Studio name<input name="name" required value="'+esc(sal.name || '')+'"></label>' +
        '<label>Area / Locality<input name="area" required value="'+esc(sal.area || '')+'"></label>' +
        '<label>Operating hours<input name="hours" required placeholder="10:00 AM - 8:00 PM" value="'+esc(sal.hours || '')+'"></label>' +
        '<label>Starting price (₹)<input name="price" type="number" min="0" required value="'+(sal.price ?? '')+'"></label>' +
        '<label style="grid-column:1/-1">Studio exterior / Interior image URL<input name="img" required value="'+esc(sal.img || '')+'"></label>' +
        '<label style="grid-column:1/-1">About the studio<textarea name="about" required rows="3">'+esc(sal.about || '')+'</textarea></label>' +
        '<button class="btn btn-primary" type="submit" style="grid-column:1/-1">Save Studio Updates '+icon('arrow',17)+'</button>' +
      '</form>' +
    '</div>';
  } else if(tab === 'Staff management'){
    const staff = state.partnerSalonStaff || [];
    body = '<div class="dashboard-panel">' +
      '<div class="account-heading">' +
        '<div>' +
          '<h3>Salon Staff & Stylist Roster</h3>' +
          '<p style="color:var(--muted);font-size:12px;margin:4px 0 0">Add and manage stylists, therapists, and specialists available for client appointments.</p>' +
        '</div>' +
      '</div>' +
      '<form id="partner-staff-add-form" class="form-grid" style="margin:20px 0;padding:20px;background:var(--ivory);border:1px solid var(--border)">' +
        '<label>Stylist name<input name="name" required placeholder="Stylist full name"></label>' +
        '<label>Specialty<input name="specialty" required placeholder="e.g. Master Colorist, Skin Therapist"></label>' +
        '<label style="grid-column:1/-1">Avatar image URL<input name="img" placeholder="https://images.unsplash.com/..."></label>' +
        '<button class="btn btn-outline" type="submit" style="grid-column:1/-1">+ Add Stylist to Salon</button>' +
      '</form>' +
      (staff.length ? staff.map(st => '<div class="dash-row"><div><strong>'+esc(st.name)+'</strong><small>'+esc(st.specialty)+'</small></div><button class="btn btn-danger btn-sm" data-action="partner-staff-delete" data-id="'+st.id+'">Remove</button></div>').join('') : empty('user','No staff assigned yet','Add your stylists and specialists to allow customers to choose their expert.')) +
    '</div>';
  } else if(tab === 'Service catalogue'){
    const salonServices = state.partnerSalonProfile?.services || [];
    body = '<div class="dashboard-panel"><h3>Salon services</h3><p>Services currently shown on your salon profile.</p>'+(salonServices.length ? salonServices.map(s => '<div class="dash-row"><strong>'+esc(s)+'</strong></div>').join('') : '<div class="dash-empty"><strong>No services listed</strong><p>Your listed services will appear here.</p></div>')+'<p class="dashboard-note">Detailed service pricing and editing are not yet available here.</p></div>';
  } else if(tab.toLowerCase().includes('service')){
    const myServices = state.partnerProServices || [];
    body = '<div class="dashboard-panel">' +
      '<div class="account-heading">' +
        '<div>' +
          '<h3>Offered Services & Treatment Menu</h3>' +
          '<p style="color:var(--muted);font-size:12px;margin:4px 0 0">Services linked to your professional booking profile.</p>' +
        '</div>' +
      '</div>' +
      '<div class="dash-service-picker" style="margin:20px 0;padding:15px;background:var(--ivory);border:1px solid var(--border);display:flex;gap:12px;align-items:center">' +
        '<select id="partner-service-select" aria-label="Choose a service" class="admin-role-select" style="flex:1;height:42px">' +
          (state.partnerServiceCatalog || []).map(s => '<option value="'+esc(s.id)+'">'+esc(s.name)+' ('+esc(s.category)+') — '+money(s.price)+'</option>').join('') +
        '</select>' +
        '<button class="btn btn-primary btn-sm" data-action="partner-pro-assign-service">Assign Service</button>' +
      '</div>' +
      (myServices.length ? myServices.map(s => '<div class="dash-row"><div><strong>'+esc(s.name)+' ('+s.category+')</strong><small>'+s.duration+' · '+money(s.price)+'</small></div><button class="btn btn-danger btn-sm" data-action="partner-pro-unlink-service" data-id="'+s.id+'">Unlink</button></div>').join('') : '<p style="color:var(--muted);padding:15px 0">No services assigned yet. Select from the master catalog above.</p>') +
    '</div>';
  } else if(tab === 'Availability calendar' || tab === 'Availability'){
    body = '<div class="dashboard-panel">' +
      '<h3>Weekly Working Days</h3>' +
      '<p>Select the days you accept client appointments. Changes sync in real time.</p>' +
      '<div class="availability-grid" style="margin-top:20px">' +
        ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => '<button data-action="availability" data-id="'+day+'" '+(!state.partnerAvailabilityReady?'disabled':'')+' aria-pressed="'+state.availability.includes(day)+'" class="'+(state.availability.includes(day)?'active':'')+'"><strong>'+day+'</strong><span>'+(state.partnerAvailabilityReady ? (state.availability.includes(day)?'Available':'Unavailable') : 'Unavailable to load')+'</span></button>').join('') +
      '</div>' +
      '<p class="dashboard-note" style="margin-top:15px">Choose the days you are available. Individual time-slot controls are not available here yet.</p>' +
    '</div>';
  } else if(tab.toLowerCase().includes('booking') || tab.toLowerCase().includes('appointment')){
    let bList = role === 'Professional' ? (state.partnerProBookings || []) : (state.partnerSalonBookings || []);
    if(tab === 'Upcoming appointments') bList = bList.filter(b => b.status === 'confirmed');
    if(tab === 'Booking history') bList = bList.filter(b => ['completed','cancelled'].includes(b.status));
    if(tab === 'Booking requests') bList = bList.filter(b => b.status === 'pending');
    body = '<div class="dashboard-panel">' +
      '<div class="account-heading">' +
        '<div>' +
          '<h3>'+tab+'</h3>' +
          '<p style="color:var(--muted);font-size:12px;margin:4px 0 0">Review upcoming client bookings, update statuses, or mark appointments completed.</p>' +
        '</div>' +
      '</div>' +
      (bList.length ? '<label class="dash-search">Search appointments<input type="search" data-dashboard-search=".dash-row" placeholder="Search service, customer or date"></label>' : '') +
      (bList.length ? bList.map(b => '<div class="dash-row">' +
        '<div><strong>'+esc(b.title)+'</strong><small>'+formatDate(b.date)+' · '+b.time+' · '+esc(b.customer_name||'Client')+' · '+money(b.price)+'</small><small style="color:var(--muted)">Location: '+esc(b.location)+'</small>'+((Array.isArray(b.addons)&&b.addons.length)?'<small style="color:var(--muted)">Add-ons: '+esc(b.addons.map(x=>x.name||x).join(', '))+'</small>':'')+'</div>' +
        '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
          '<span class="badge badge-'+b.status.toLowerCase()+'">'+esc(b.status)+'</span>' +
          (b.status === 'confirmed' ? 
            (role === 'Professional' ? (state.proVerifiedArrival?.[b.id] ? '<span class="badge badge-approved">Arrival verified</span>' : '<button class="btn btn-outline btn-sm" data-action="pro-verify-otp-open" data-id="'+b.id+'">Verify arrival PIN</button>') : '') +
            '<button class="btn btn-success btn-sm" data-action="'+(role==='Professional'?'partner-pro-complete':'partner-salon-complete')+'" data-id="'+b.id+'">Complete</button>' +
            '<button class="btn btn-danger btn-sm" data-action="'+(role==='Professional'?'partner-pro-cancel':'partner-salon-cancel')+'" data-id="'+b.id+'">Cancel</button>' : '') +
        '</div>' +
      '</div>').join('') : empty('calendar','No appointments yet','New client booking requests will appear here.')) +
    '</div>';
  } else if(tab === 'Marketplace listings' || tab === 'Marketplace Listings'){
    const listings = state.partnerSellerListings || [];
    body = '<div class="dashboard-panel">' +
      '<div class="account-heading">' +
        '<div>' +
          '<h3>Multi-Vendor Marketplace Listings</h3>' +
          '<p style="color:var(--muted);font-size:12px;margin:4px 0 0">List your stock on shared master catalog products. Compete with pricing, verified inventory, and express fulfillment.</p>' +
        '</div>' +
      '</div>' +
      '<form id="partner-seller-listing-form" class="form-grid" style="margin:20px 0;padding:20px;background:var(--ivory);border:1px solid var(--border)">' +
        '<label>Master Product' +
          '<select name="product_id" required class="admin-role-select" style="width:100%;height:42px">' +
            (state.partnerProductCatalog || []).map(p => '<option value="'+esc(p.id)+'">'+esc(p.name)+' ('+esc(p.brand)+') — Ref ₹'+p.price+'</option>').join('') +
          '</select>' +
        '</label>' +
        '<label>Merchant SKU<input name="sku" required placeholder="e.g. LUX-SERUM-001"></label>' +
        '<label>Your Offer Price (₹)<input name="price" type="number" step="0.01" required placeholder="2650" value="2650"></label>' +
        '<label>Allocated Stock<input name="stock" type="number" required placeholder="50" value="50"></label>' +
        '<label>Min Order Qty<input name="min_order_qty" type="number" required placeholder="1" value="1"></label>' +
        '<button class="btn btn-primary" type="submit" style="grid-column:1/-1">+ Create Marketplace Listing</button>' +
      '</form>' +
      (listings.length ? '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Product & SKU</th><th>Offer Price</th><th>Available Stock</th><th>Moderation</th><th>Active</th><th>Actions</th></tr></thead><tbody>' +
        listings.map(l => '<tr>' +
          '<td><strong>'+esc(l.product_name || l.product_id)+'</strong><br><small>SKU: '+esc(l.sku)+'</small></td>' +
          '<td><input type="number" id="listing-price-'+l.id+'" value="'+l.price+'" style="width:80px;padding:4px 6px;border:1px solid var(--border)"></td>' +
          '<td><input type="number" id="listing-stock-'+l.id+'" value="'+l.stock+'" style="width:70px;padding:4px 6px;border:1px solid var(--border)"></td>' +
          '<td>'+(l.moderation_status ? '<span class="badge badge-'+(l.moderation_status==='APPROVED'?'approved':l.moderation_status==='REJECTED'?'rejected':'pending')+'">'+esc(l.moderation_status)+'</span>' : 'Not available')+'</td>' +
          '<td><span class="badge badge-'+(l.is_active?'active':'suspended')+'">'+(l.is_active?'ACTIVE':'INACTIVE')+'</span></td>' +
          '<td><button class="btn btn-outline btn-sm" data-action="partner-listing-update" data-id="'+l.id+'">Save Changes</button></td>' +
        '</tr>').join('') +
      '</tbody></table></div>' : empty('bag','No marketplace listings yet','Attach an offer to any master product above to start selling.')) +
    '</div>';
  } else if(tab === 'Products'){
    const prods = state.partnerSellerProducts || [];
    body = '<div class="dashboard-panel">' +
      '<div class="account-heading">' +
        '<div>' +
          '<h3>Brand Product Catalog</h3>' +
          '<p style="color:var(--muted);font-size:12px;margin:4px 0 0">List and manage your bespoke beauty cosmetics, skincare, and haircare items.</p>' +
        '</div>' +
      '</div>' +
      '<form id="partner-seller-product-form" class="form-grid" style="margin:20px 0;padding:20px;background:var(--ivory);border:1px solid var(--border)">' +
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
      (prods.length ? prods.map(p => '<details class="dash-product"><summary><span><strong>'+esc(p.name)+'</strong><small>'+esc(p.brand)+' · '+esc(p.category)+' · '+money(p.price)+'</small></span><span>Edit product ↓</span></summary><form class="form-grid partner-product-edit-form" data-product-id="'+esc(p.id)+'"><label>Brand<input name="brand" required value="'+esc(p.brand)+'"></label><label>Product name<input name="name" required value="'+esc(p.name)+'"></label><label>Category<input name="category" required value="'+esc(p.category)+'"></label><label>Price (₹)<input name="price" type="number" min="0.01" step="0.01" required value="'+p.price+'"></label><label>Image URL<input name="img" required value="'+esc(p.img || '')+'"></label><label>Ingredients<input name="ingredients" value="'+esc(p.ingredients || '')+'"></label><label style="grid-column:1/-1">Description<textarea name="description" required>'+esc(p.description || '')+'</textarea></label><button class="btn btn-primary" type="submit">Save product</button></form></details>').join('') : '<p style="color:var(--muted)">No products created yet.</p>') +
    '</div>';
  } else if(tab === 'Inventory' || tab === 'Inventory & stock'){
    const prods = state.partnerSellerProducts || [];
    const listings = state.partnerSellerListings || [];
    body = '<div class="dashboard-panel">' +
      '<div class="account-heading">' +
        '<div>' +
          '<h3>Real-Time Inventory & Stock Alerts</h3>' +
          '<p style="color:var(--muted);font-size:12px;margin:4px 0 0">Live stock tracking across products and marketplace listings. Low stock warning fires at 5 units or below.</p>' +
        '</div>' +
      '</div>' +
      (listings.length ? '<div style="margin-top:16px"><h4 style="margin-bottom:10px">Multi-Vendor Listings Stock</h4><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Product & SKU</th><th>Current Stock</th><th>Status</th><th>Update Stock</th></tr></thead><tbody>' +
        listings.map(l => '<tr>' +
          '<td><strong>'+esc(l.product_name || l.product_id)+'</strong><br><small>SKU: '+esc(l.sku)+'</small></td>' +
          '<td><strong>'+l.stock+' units</strong></td>' +
          '<td>'+(l.stock <= 5 ? '<span class="badge badge-warning">LOW STOCK</span>' : '<span class="badge badge-approved">HEALTHY</span>')+'</td>' +
          '<td><div style="display:flex;gap:6px"><input type="number" id="listing-stock-'+l.id+'" value="'+l.stock+'" style="width:70px;padding:4px 8px;border:1px solid var(--border)"><button class="btn btn-outline btn-sm" data-action="partner-listing-update" data-id="'+l.id+'">Update</button></div></td>' +
        '</tr>').join('') +
      '</tbody></table></div></div>' : '') +
      (prods.length ? '<div style="margin-top:24px"><h4 style="margin-bottom:10px">Direct Products Stock</h4><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Product</th><th>Category</th><th>Current Stock</th><th>Status</th><th>Update Stock</th></tr></thead><tbody>' +
        prods.map(p => '<tr>' +
          '<td><strong>'+esc(p.name)+'</strong><br><small>'+esc(p.brand)+'</small></td>' +
          '<td>'+esc(p.category)+'</td>' +
          '<td><strong>'+p.stock+' units</strong></td>' +
          '<td>'+(p.stock <= 5 ? '<span class="badge badge-warning">LOW STOCK ALERT</span>' : '<span class="badge badge-approved">HEALTHY</span>')+'</td>' +
          '<td><div style="display:flex;gap:6px"><input type="number" id="stock-input-'+p.id+'" value="'+p.stock+'" style="width:70px;padding:4px 8px;border:1px solid var(--border)"><button class="btn btn-outline btn-sm" data-action="partner-stock-update" data-id="'+p.id+'">Update</button></div></td>' +
        '</tr>').join('') +
      '</tbody></table></div></div>' : '') +
      (!listings.length && !prods.length ? '<p style="color:var(--muted);padding:20px 0">No products or listings available in inventory.</p>' : '') +
    '</div>';
  } else if(tab === 'Orders & fulfillment' || tab === 'Orders & Shipping' || tab.toLowerCase().includes('order') || tab === 'Shipping'){
    const suborders = state.partnerSellerSuborders || [];
    const legacyOrders = state.partnerSellerOrders || [];
    body = '<div class="dashboard-panel">' +
      '<div class="account-heading">' +
        '<div>' +
          '<h3>Multi-Vendor Suborders & Fulfillment</h3>' +
          '<p style="color:var(--muted);font-size:12px;margin:4px 0 0">Manage your packages independently. Pack items, assign carrier AWB tracking, and mark delivery milestones.</p>' +
        '</div>' +
      '</div>' +
      (suborders.length ? suborders.map(s => '<div class="dash-row" style="flex-direction:column;align-items:stretch;gap:12px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
          '<div><strong>Suborder #'+esc(s.suborder_id)+'</strong><small>Parent: '+esc(s.parent_order_id)+' · '+(s.created_at?.slice(0,10)||'Recent')+' · '+money(s.subtotal)+' · Shipping: '+money(s.shipping_fee)+' · Payment: '+esc(s.payment_status||'pending')+'</small></div>' +
          '<span class="badge badge-'+(s.status==='delivered'?'approved':s.status==='cancelled'?'rejected':'info')+'">'+esc(s.status).toUpperCase()+'</span>' +
        '</div>' +
        '<div style="font-size:11px;color:var(--muted)">Deliver to: '+esc(s.shipping_address_label||'Home')+' — '+esc(s.shipping_address_text||'')+'</div>' +
        (s.shipment ? '<div style="background:var(--ivory);padding:10px;border:1px solid var(--border);font-size:12px">Carrier: <strong>'+esc(s.shipment.carrier_name)+'</strong> · Tracking AWB: <strong>'+esc(s.shipment.tracking_number)+'</strong>'+(s.shipment.tracking_url?' · <a href="'+esc(s.shipment.tracking_url)+'" target="_blank" style="color:var(--champagne)">Live Courier Tracking</a>':'')+'</div>' : '') +
        '<div style="background:var(--ivory);padding:10px;border:1px solid var(--border)">' +
          (s.items || []).map(i => '<div style="font-size:11px">'+esc(i.name)+(i.variant_name?' ('+esc(i.variant_name)+')':'')+(i.sku?' · SKU: '+esc(i.sku):'')+' × '+i.qty+' ('+money(i.price)+')</div>').join('') +
        '</div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end">' +
          (s.status === 'placed' ? '<button class="btn btn-outline btn-sm" data-action="partner-suborder-pack" data-id="'+s.suborder_id+'">Pack Suborder</button>' : '') +
          (s.status === 'packed' ? '<button class="btn btn-primary btn-sm" data-action="partner-suborder-ship" data-id="'+s.suborder_id+'">Dispatch & Enter Tracking</button>' : '') +
          (s.status === 'in_transit' ? '<button class="btn btn-success btn-sm" data-action="partner-suborder-deliver" data-id="'+s.suborder_id+'">Confirm Delivery</button>' : '') +
        '</div>' +
      '</div>').join('') : (legacyOrders.length ? legacyOrders.map(o => '<div class="dash-row" style="flex-direction:column;align-items:stretch;gap:12px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
          '<div><strong>Order #'+esc(o.id)+'</strong><small>'+o.date+' · '+money(o.total)+' · Payment: '+esc(o.payment_status)+'</small></div>' +
          '<span class="badge badge-info">'+esc(o.status)+'</span>' +
        '</div>' +
        '<div style="font-size:11px;color:var(--muted)">Deliver to: '+esc(o.address_text)+'</div>' +
        '<div style="background:var(--ivory);padding:10px;border:1px solid var(--border)">' +
          (o.items || []).map(i => '<div style="font-size:11px">'+esc(i.name)+(i.variant_name?' ('+esc(i.variant_name)+')':'')+' × '+i.qty+' ('+money(i.price)+')</div>').join('') +
        '</div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end">' +
          (o.status === 'placed' ? '<button class="btn btn-outline btn-sm" data-action="partner-order-pack" data-id="'+o.id+'">Pack Order</button>' : '') +
          (o.status === 'packed' ? '<button class="btn btn-primary btn-sm" data-action="partner-order-ship" data-id="'+o.id+'">Ship Order</button>' : '') +
          (o.status === 'in_transit' ? '<button class="btn btn-success btn-sm" data-action="partner-order-deliver" data-id="'+o.id+'">Mark Delivered</button>' : '') +
        '</div>' +
      '</div>').join('') : empty('bag','No orders received yet','Customer purchases from your brand or listings will appear here.'))) +
    '</div>';
  } else if(tab === 'Returns & refunds' || tab.toLowerCase().includes('return')){
    const returns = state.partnerSellerReturns || [];
    body = '<div class="dashboard-panel">' +
      '<div class="account-heading">' +
        '<div>' +
          '<h3>Customer Returns & Reverse Logistics</h3>' +
          '<p style="color:var(--muted);font-size:12px;margin:4px 0 0">Inspect client return requests. Approved returns trigger gateway refund orchestration and optional restocking.</p>' +
        '</div>' +
      '</div>' +
      (returns.length ? returns.map(r => {
        const actionable = r.status === 'REQUESTED' || r.status === 'PENDING' || r.status === 'REFUND_FAILED';
        const badgeCls = (r.status==='REFUNDED'||r.status==='APPROVED') ? 'approved' : (r.status==='REJECTED'||r.status==='REFUND_FAILED') ? 'rejected' : 'pending';
        return '<div class="dash-row" style="flex-direction:column;align-items:stretch;gap:10px">' +
          '<div style="display:flex;justify-content:space-between;align-items:center">' +
            '<div><strong>Return #'+esc(r.id)+' · Suborder #'+esc(r.suborder_id)+'</strong><small>Requested: '+(r.created_at?.slice(0,10)||'Recent')+' · Item #'+r.order_item_id+' (Qty: '+(r.return_qty||1)+') · Refund: '+money(r.refund_amount||0)+'</small></div>' +
            '<span class="badge badge-'+badgeCls+'">'+esc(r.status)+'</span>' +
          '</div>' +
          '<div style="background:var(--ivory);padding:10px;border:1px solid var(--border);font-size:12px">' +
            '<strong>Reason:</strong> '+esc(r.reason)+'<br>' +
            '<strong>Refund state:</strong> '+esc(r.refund_status||'NONE')+(r.gateway_refund_id ? ' (Gateway Ref: <code>'+esc(r.gateway_refund_id)+'</code>)' : '')+'<br>' +
            (r.detailed_explanation ? '<span style="color:var(--muted)"><strong>Customer note:</strong> '+esc(r.detailed_explanation)+'</span><br>' : '') +
            (r.rejection_reason ? '<span style="color:#721c24"><strong>Seller decision reason:</strong> '+esc(r.rejection_reason)+'</span>' : '') +
          '</div>' +
          (actionable ? '<div style="display:flex;gap:8px;justify-content:flex-end">' +
            '<button class="btn btn-success btn-sm" data-action="partner-return-approve" data-id="'+esc(r.id)+'">'+(r.status==='REFUND_FAILED'?'Retry Refund':'Approve & Restock')+'</button>' +
            (r.status!=='REFUND_FAILED' ? '<button class="btn btn-danger btn-sm" data-action="partner-return-reject" data-id="'+esc(r.id)+'">Reject Return</button>' : '') +
          '</div>' : '') +
        '</div>';
      }).join('') : empty('shield','No return requests','When customers submit reverse logistics requests, you can inspect and decision them here.')) +
    '</div>';
  } else if(tab === 'Escrow & settlement' || ['Earnings','Revenue analytics','Sales analytics','Analytics'].includes(tab)){
    const mvFin = state.partnerSellerMVFinancials;
    if(role === 'Product Seller' && mvFin){
      body = '<div class="admin-kpi-grid">' +
        '<div class="admin-kpi-card"><span>HELD IN ESCROW</span><strong>'+money(mvFin.funds_in_escrow ?? 0)+'</strong><small>Pending delivery + 7-day return window</small></div>' +
        '<div class="admin-kpi-card"><span>MATURED / CLEARED</span><strong>'+money(mvFin.matured_balance_available ?? 0)+'</strong><small>Eligible (T+7, no open returns)</small></div>' +
        '<div class="admin-kpi-card"><span>SETTLED LEDGER</span><strong>'+money(mvFin.total_disbursed ?? 0)+'</strong><small>Marked settled internally</small></div>' +
        '<div class="admin-kpi-card"><span>TOTAL SALES VOLUME</span><strong>'+money(mvFin.gross_sales ?? 0)+'</strong><small>Commission (15%): '+money(mvFin.platform_commission_15pct ?? 0)+' · Refunds: '+money(mvFin.refund_deductions ?? 0)+'</small></div>' +
      '</div>' +
      '<div class="dashboard-panel" style="margin-top:20px">' +
        '<div class="account-heading">' +
          '<div>' +
            '<h3>Multi-Vendor Escrow & Settlement Ledger</h3>' +
            '<p style="color:var(--muted);font-size:12px;margin:4px 0 0">GlamGo Escrow holds merchant funds for 7 days (T+7) after confirmed delivery and blocks maturity while any return remains unresolved.</p>' +
          '</div>' +
          '<span class="badge badge-info">Policy: T+7 Return-Aligned Cooling Period</span>' +
        '</div>' +
        (mvFin.escrow_batches && mvFin.escrow_batches.length ? 
          '<div class="admin-table-wrap" style="margin-top:20px"><table class="admin-table"><thead><tr><th>Suborder</th><th>Net Settlement</th><th>Refunded</th><th>Comm. Reversed</th><th>Status</th><th>Maturity Date</th></tr></thead><tbody>' +
            mvFin.escrow_batches.map(rec => '<tr>' +
              '<td><strong>'+esc(rec.suborder_id)+'</strong></td>' +
              '<td><strong>'+money(rec.net_amount)+'</strong></td>' +
              '<td>'+money(rec.refunded_amount || 0)+'</td>' +
              '<td>'+money(rec.reversed_commission || 0)+'</td>' +
              '<td><span class="badge badge-'+(rec.status==='MATURED'||rec.status==='SETTLED'?'approved':rec.status==='CLAWBACK_REFUND'?'rejected':'pending')+'">'+esc(rec.status)+'</span></td>' +
              '<td><small>'+(rec.matures_at ? new Date(rec.matures_at).toLocaleDateString() : 'Pending Delivery')+'</small></td>' +
            '</tr>').join('') +
          '</tbody></table></div>' : '<p style="color:var(--muted);padding:25px 0">No escrow records initiated yet.</p>') +
      '</div>';
    } else {
      const fin = state.partnerFinancials || {
        gross_sales: 0,
        platform_commission: 0,
        refund_deductions: 0,
        net_earnings: 0,
        settlement_summary: { settled_amount: 0, pending_payout: 0, payout_status: 'pending_cycle' },
        statements: []
      };
      body = '<div class="admin-kpi-grid">' +
        '<div class="admin-kpi-card"><span>GROSS SALES</span><strong>'+money(fin.gross_sales)+'</strong><small>Total booking / order value</small></div>' +
        '<div class="admin-kpi-card"><span>COMMISSION (15%)</span><strong>'+money(fin.platform_commission)+'</strong><small>Platform curation & fee</small></div>' +
        '<div class="admin-kpi-card"><span>REFUND DEDUCTIONS</span><strong>'+money(fin.refund_deductions)+'</strong><small>Cancelled transactions</small></div>' +
        '<div class="admin-kpi-card"><span>NET EARNINGS</span><strong>'+money(fin.net_earnings)+'</strong><small>Calculated net earnings</small></div>' +
      '</div>' +
      '<div class="dashboard-panel" style="margin-top:20px">' +
        '<div class="account-heading">' +
          '<div>' +
            '<h3>Settlement Ledger & Statements</h3>' +
            '<p style="color:var(--muted);font-size:12px;margin:4px 0 0">Recorded transactions and calculated earnings. Settlement status does not confirm a bank payout.</p>' +
          '</div>' +
          '<span class="badge badge-info">Status: '+esc(fin.settlement_summary?.payout_status || 'Pending cycle')+'</span>' +
        '</div>' +
        (fin.statements?.length ? 
          '<div class="admin-table-wrap" style="margin-top:20px"><table class="admin-table"><thead><tr><th>Txn ID</th><th>Date</th><th>Item / Service</th><th>Gross</th><th>15% Fee</th><th>Net earnings</th><th>Status</th></tr></thead><tbody>' +
            fin.statements.map(s => '<tr>' +
              '<td><code>'+esc(s.transaction_id)+'</code></td>' +
              '<td>'+esc(s.date)+'</td>' +
              '<td><strong>'+esc(s.title)+'</strong></td>' +
              '<td>'+money(s.gross_amount)+'</td>' +
              '<td>'+money(s.commission_amount)+'</td>' +
              '<td><strong>'+money(s.net_amount)+'</strong></td>' +
              '<td><span class="badge badge-'+s.status.toLowerCase()+'">'+esc(s.status)+'</span></td>' +
            '</tr>').join('') +
          '</tbody></table></div>' : '<p style="color:var(--muted);padding:25px 0">No transaction statements recorded yet.</p>') +
      '</div>';
    }
  } else if(tab === 'Customer reviews' || tab === 'Reviews'){
    body = '<div class="dashboard-panel"><h3>Customer reviews</h3><p>Partner-specific reviews are not available in this workspace yet.</p></div>';
  } else {
    body = '<div class="dashboard-panel"><h3>'+esc(tab)+'</h3><p>This feature is not available in the dashboard yet.</p></div>';
  }

  const applicant = state.user?.role === 'customer';
  const navTabs = applicant ? ['Registration'] : tabs;
  return '<div class="partner-page dash-shell"><aside class="partner-sidebar dash-sidebar"><div class="dash-brand"><button class="wordmark" data-action="public-home">GLAMGO<span>✦</span></button><small>PARTNER WORKSPACE</small></div><div class="dash-role"><span>YOUR WORKSPACE</span><strong>'+esc(role)+'</strong></div><label class="dash-mobile-nav">Workspace section<select id="partner-mobile-nav">'+navTabs.map(t=>'<option value="'+esc(t)+'" '+(t===tab?'selected':'')+'>'+esc(t)+'</option>').join('')+'</select></label><nav aria-label="Partner navigation">'+navTabs.map(t => '<button class="'+(t===tab?'active':'')+'" '+(t===tab?'aria-current="page"':'')+' data-action="partner-tab" data-id="'+esc(t)+'"><span>'+esc(t)+'</span><span aria-hidden="true">→</span></button>').join('')+'</nav><button class="dash-exit" data-action="public-home">← Back to GlamGo</button></aside>'+
    '<main class="partner-main dash-main"><header class="dash-topbar"><div><span>GLAMGO / '+esc(role.toUpperCase())+'</span><strong>'+esc(tab)+'</strong></div><button class="dash-account" data-action="account">'+icon('user',17)+' <span>'+esc(state.user?.name || 'My account')+'</span></button></header>'+
    '<div class="dash-content">'+(applicant ? '<div class="role-picker" aria-label="Choose partner type">'+roles.map(r => '<button class="'+(r===role?'active':'')+'" data-action="partner-role" data-id="'+r+'">'+r+'</button>').join('')+'</div>' : '')+
    '<div class="dashboard-heading"><div><p class="eyebrow">'+esc(role.toUpperCase())+' DASHBOARD</p><h2>'+esc(tab)+'.</h2></div></div>'+
    (state.partnerDataError ? '<div class="dash-alert" role="status">'+esc(state.partnerDataError)+' <button data-action="partner-refresh">Retry</button></div>' : '')+body+'</div></main></div>';
}

let adminLoadSequence = 0;
async function loadAdminData(){
  if(state.user?.role !== 'admin') return;
  const token = tokenStorage.get();
  const requestId = ++adminLoadSequence;
  try {
    const [stats, users, drafts, logs, bookings, orders, servicesRes, productsRes] = await Promise.allSettled([
      apiGetAdminStats(),
      apiGetAdminUsers(),
      apiGetAdminDrafts(),
      apiGetAuditLogs(),
      apiGetAdminBookings(),
      apiGetAdminOrders(),
      apiGetServices(),
      apiGetProducts()
    ]);
    if(requestId !== adminLoadSequence || token !== tokenStorage.get() || state.user?.role !== 'admin') return;
    if(stats.status === 'fulfilled') state.adminStats = stats.value;
    if(users.status === 'fulfilled') state.adminUsers = users.value;
    if(drafts.status === 'fulfilled') state.adminDrafts = drafts.value;
    if(logs.status === 'fulfilled') state.adminAuditLogs = logs.value;
    if(bookings.status === 'fulfilled') state.adminBookings = bookings.value;
    if(orders.status === 'fulfilled') state.adminOrders = orders.value;
    if(servicesRes.status === 'fulfilled') state.adminServices = servicesRes.value;
    if(productsRes.status === 'fulfilled') state.adminProducts = productsRes.value;
    state.adminDataError = [stats, users, drafts, logs, bookings, orders, servicesRes, productsRes].some(r => r.status === 'rejected') ? 'Some information could not be loaded. Retry to refresh the dashboard.' : '';
    state.adminDataLoaded = true;
    render();
  } catch(err) {
    console.warn('[Admin] Live sync notice:', err);
  }
}

function adminPage(){
  if(state.user?.role !== 'admin'){
    return '<div class="admin-shell"><main class="admin-main"><div class="admin-panel"><h2>Access Restricted</h2><p>Administrator privileges are required to view this command centre.</p><button class="btn btn-primary" data-action="landing">Return to GlamGo Store</button></div></main></div>';
  }

  const tab = state.adminTab || 'overview';
  const pendingCount = (state.adminDrafts || []).filter(d => d.status === 'PENDING').length;

  const sidebar = '<aside class="admin-sidebar">' +
    '<div class="admin-sidebar-brand">' +
      '<a class="wordmark light" href="#" data-action="landing" style="text-decoration:none">GLAMGO<span>✦</span></a>' +
      '<h3>Command Centre</h3>' +
      '<span>PLATFORM GOVERNANCE</span>' +
    '</div>' +
    '<label class="dash-mobile-nav">Admin section<select id="admin-mobile-nav">'+[['overview','Overview'],['moderation','Partner applications'],['users','Users & accounts'],['bookings','Bookings'],['orders','Orders'],['services','Services'],['products','Products'],['audit-logs','Audit log']].map(([value,label])=>'<option value="'+value+'" '+(tab===value?'selected':'')+'>'+label+'</option>').join('')+'</select></label>' +
    '<button class="admin-nav-item '+(tab==='overview'?'active':'')+'" data-action="admin-tab" data-id="overview">' +
      icon('grid', 16) + '<span>Overview</span>' +
    '</button>' +
    '<button class="admin-nav-item '+(tab==='moderation'?'active':'')+'" data-action="admin-tab" data-id="moderation">' +
      icon('shield', 16) + '<span>Partner applications</span>' +
      (pendingCount > 0 ? '<span class="admin-nav-badge">'+pendingCount+'</span>' : '') +
    '</button>' +
    '<button class="admin-nav-item '+(tab==='users'?'active':'')+'" data-action="admin-tab" data-id="users">' +
      icon('user', 16) + '<span>Users & accounts</span>' +
    '</button>' +
    '<button class="admin-nav-item '+(tab==='bookings'?'active':'')+'" data-action="admin-tab" data-id="bookings">' +
      icon('calendar', 16) + '<span>Bookings</span>' +
    '</button>' +
    '<button class="admin-nav-item '+(tab==='orders'?'active':'')+'" data-action="admin-tab" data-id="orders">' +
      icon('bag', 16) + '<span>Orders</span>' +
    '</button>' +
    '<button class="admin-nav-item '+(tab==='services'?'active':'')+'" data-action="admin-tab" data-id="services">' +
      icon('spark', 16) + '<span>Services</span>' +
    '</button>' +
    '<button class="admin-nav-item '+(tab==='products'?'active':'')+'" data-action="admin-tab" data-id="products">' +
      icon('truck', 16) + '<span>Products</span>' +
    '</button>' +
    '<button class="admin-nav-item '+(tab==='audit-logs'?'active':'')+'" data-action="admin-tab" data-id="audit-logs">' +
      icon('clock', 16) + '<span>Audit log</span>' +
    '</button>' +
    '<div style="margin-top:auto;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1)">' +
      '<button class="admin-nav-item" data-action="partners">' +
        icon('spark', 16) + '<span>Salon & Partner Portal</span>' +
      '</button>' +
      '<button class="admin-nav-item" data-action="landing">' +
        icon('arrow', 16) + '<span>Exit to Store</span>' +
      '</button>' +
    '</div>' +
  '</aside>';

  let mainContent = '';

  if(tab === 'overview'){
    const stats = state.adminStats;
    const pending = (state.adminDrafts || []).filter(d => d.status === 'PENDING');
    const logs = (state.adminAuditLogs || []).slice(0,4);
    const metric = (label, val, note) => '<div class="admin-kpi-card"><span>'+label+'</span><strong>'+(val == null ? '—' : val)+'</strong><small>'+note+'</small></div>';
    mainContent = '<div class="dash-intro"><div><p class="dash-kicker">YOUR MARKETPLACE</p><h3>Good to see you'+(state.user?.name ? ', '+esc(state.user.name.split(' ')[0]) : '')+'.</h3><p>Review the activity that keeps GlamGo moving.</p></div></div>'+
      '<div class="admin-kpi-grid">'+metric('PENDING APPLICATIONS', state.adminDataLoaded && !state.adminDataError ? pending.length : null, 'Awaiting review')+metric('TOTAL BOOKINGS', stats?.total_bookings, 'At-home and salon appointments')+metric('TOTAL ORDERS', stats?.total_orders, 'Product orders')+metric('CUSTOMERS', stats?.customers_count, 'Registered customer accounts')+'</div>'+
      '<div class="dash-overview-grid"><section class="admin-panel"><div class="dash-panel-heading"><div><span class="dash-kicker">NEEDS ATTENTION</span><h2>Partner applications</h2></div><button class="dash-link" data-action="admin-tab" data-id="moderation">View all →</button></div>'+
      (pending.length ? pending.slice(0,4).map(d=>'<div class="dash-row"><div><strong>'+esc(d.name)+'</strong><small>'+esc(d.role)+' · '+esc(d.applicant_name || 'Applicant')+'</small></div><button class="dash-link" data-action="admin-tab" data-id="moderation">Review →</button></div>').join('') : '<div class="dash-empty"><strong>'+(state.adminDataLoaded && !state.adminDataError ? 'All caught up' : 'Applications unavailable')+'</strong><p>'+(state.adminDataLoaded && !state.adminDataError ? 'There are no pending applications.' : 'Refresh to see the latest applications.')+'</p></div>')+'</section>'+
      '<section class="admin-panel"><div class="dash-panel-heading"><div><span class="dash-kicker">PLATFORM ACTIVITY</span><h2>Recent activity</h2></div><button class="dash-link" data-action="admin-tab" data-id="audit-logs">View log →</button></div>'+
      (logs.length ? logs.map(l=>'<div class="dash-row"><div><strong>'+esc(l.action)+'</strong><small>'+esc(l.target_type)+' · '+new Date(l.created_at).toLocaleString()+'</small></div></div>').join('') : '<div class="dash-empty"><strong>No activity to show</strong><p>Administrative actions will appear here when available.</p></div>')+'</section></div>';
  } else if(tab === 'moderation'){
    const filter = state.adminDraftFilter || 'ALL';
    let drafts = state.adminDrafts || [];
    if(filter !== 'ALL') drafts = drafts.filter(d => d.status === filter);

    mainContent = '<div class="admin-panel">' +
      '<div class="admin-panel-head">' +
        '<div>' +
          '<h2>Partner Onboarding Moderation Queue</h2>' +
          '<p style="color:var(--muted);font-size:12px;margin:4px 0 0">Review applications from beauty professionals, salons, and product sellers.</p>' +
        '</div>' +
        '<div class="admin-actions">' +
          ['ALL','PENDING','APPROVED','REJECTED'].map(f => '<button class="btn btn-sm '+(filter===f?'btn-primary':'btn-outline')+'" data-action="admin-draft-filter" data-id="'+f+'">'+f+'</button>').join('') +
        '</div>' +
      '</div>' +
      (drafts.length ? '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>ID</th><th>Applicant</th><th>Role</th><th>Listing Title</th><th>Price</th><th>Status</th><th>Submitted</th><th>Action</th></tr></thead><tbody>' +
        drafts.map(d => '<tr><td>#'+d.id+'</td><td><strong>'+esc(d.applicant_name||d.user_id)+'</strong><br><small>'+esc(d.applicant_email||'')+'</small></td><td><span class="badge badge-info">'+esc(d.role)+'</span></td><td><strong>'+esc(d.name)+'</strong><br><small style="color:var(--muted)">'+esc(d.description||'').slice(0,40)+'...</small><br><button class="dash-link" data-action="admin-view-draft" data-id="'+d.id+'">View details</button></td><td><strong>'+money(d.price)+'</strong></td><td><span class="badge badge-'+d.status.toLowerCase()+'">'+esc(d.status)+'</span>'+(d.rejection_reason?'<br><small style="color:#721c24">Note: '+esc(d.rejection_reason)+'</small>':'')+'</td><td><small>'+new Date(d.created_at).toLocaleDateString()+'</small></td><td>'+(d.status==='PENDING'?'<div class="admin-actions"><button class="btn btn-success btn-sm" data-action="admin-approve-draft" data-id="'+d.id+'">Approve</button><button class="btn btn-danger btn-sm" data-action="admin-reject-draft" data-id="'+d.id+'">Reject</button></div>':'<small style="color:var(--muted)">Moderated by #'+esc(d.reviewed_by||'Admin')+'</small>')+'</td></tr>').join('') +
      '</tbody></table></div>' : '<div style="padding:40px;text-align:center;color:var(--muted)"><p>No partner applications in "'+filter+'" status.</p></div>') +
    '</div>';
  } else if(tab === 'users'){
    const q = (state.adminUserSearch || '').toLowerCase().trim();
    const filter = state.adminUserFilter || 'ALL';
    let users = state.adminUsers || [];
    if(filter !== 'ALL') users = users.filter(u => (u.role || '').toLowerCase() === filter.toLowerCase());
    if(q) users = users.filter(u => (u.name||'').toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q));

    mainContent = '<div class="admin-panel">' +
      '<div class="admin-panel-head">' +
        '<div>' +
          '<h2>Users & accounts & Role Management</h2>' +
          '<p style="color:var(--muted);font-size:12px;margin:4px 0 0">Search accounts, manage role permissions, and toggle access states.</p>' +
        '</div>' +
        '<div class="admin-actions">' +
          ['ALL','CUSTOMER','PROFESSIONAL','SALON_OWNER','SELLER','ADMIN'].map(f => '<button class="btn btn-sm '+(filter===f?'btn-primary':'btn-outline')+'" data-action="admin-user-filter" data-id="'+f+'">'+f+'</button>').join('') +
        '</div>' +
      '</div>' +
      '<div class="admin-filter-bar">' +
        '<input id="admin-user-search" data-dashboard-search="tbody tr" value="'+esc(state.adminUserSearch || '')+'" placeholder="Search by name or email..." autocomplete="off">' +
        '<span style="font-size:11px;color:var(--muted);margin-left:auto">Displaying '+users.length+' accounts</span>' +
      '</div>' +
      (users.length ? '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>ID</th><th>Name & Contact</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>' +
        users.map(u => '<tr><td>#'+u.id+'</td><td><strong>'+esc(u.name)+'</strong>'+(u.id===state.user.id?' <span class="badge badge-info">(You)</span>':'')+'<br><small>'+esc(u.email)+' · '+esc(u.phone||'N/A')+'</small></td><td><select class="admin-role-select" data-user-id="'+u.id+'" '+(u.id===state.user.id?'disabled':'')+'><option value="customer" '+(u.role==='customer'?'selected':'')+'>Customer</option><option value="professional" '+(u.role==='professional'?'selected':'')+'>Professional</option><option value="salon_owner" '+(u.role==='salon_owner'?'selected':'')+'>Salon Owner</option><option value="seller" '+(u.role==='seller'?'selected':'')+'>Product Seller</option><option value="admin" '+(u.role==='admin'?'selected':'')+'>Platform Admin</option></select></td><td><span class="badge badge-'+(u.is_active?'active':'suspended')+'">'+(u.is_active?'Active':'Suspended')+'</span></td><td>'+(u.id===state.user.id?'<small style="color:var(--muted)">Self-protection active</small>':'<button class="btn btn-sm '+(u.is_active?'btn-danger':'btn-success')+'" data-action="admin-toggle-user" data-id="'+u.id+'">'+(u.is_active?'Suspend Account':'Reactivate')+'</button>')+'</td></tr>').join('') +
      '</tbody></table></div>' : '<div style="padding:40px;text-align:center;color:var(--muted)"><p>No user accounts found matching query.</p></div>') +
    '</div>';
  } else if(tab === 'bookings'){
    const bList = state.adminBookings || [];
    mainContent = '<div class="admin-panel">' +
      '<div class="admin-panel-head">' +
        '<div><h2>Global Platform Bookings</h2><p style="color:var(--muted);font-size:12px;margin:4px 0 0">All at-home treatments and salon appointments across the platform.</p></div>' +
        '<span class="admin-status-pulse"><i></i> '+bList.length+' Bookings</span>' +
      '</div>' +
      (bList.length ? '<label class="dash-search">Search bookings<input type="search" data-dashboard-search="tbody tr" placeholder="Search by customer, service or status"></label>' : '') +
      (bList.length ? '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>ID</th><th>Service / Title</th><th>Customer</th><th>Type</th><th>Date & Time</th><th>Location</th><th>Price</th><th>Status</th></tr></thead><tbody>' +
        bList.map(b => '<tr><td>#'+b.id+'</td><td><strong>'+esc(b.title)+'</strong></td><td>'+(b.customer_name ? '<strong>'+esc(b.customer_name)+'</strong><br><small style="color:var(--muted)">'+esc(b.customer_email || ('User #'+b.customer_id))+'</small>' : 'User #'+(b.customer_id||'-'))+'</td><td><span class="badge badge-info">'+esc(b.type)+'</span></td><td>'+formatDate(b.date)+' · '+esc(b.time)+'</td><td><small>'+esc(b.location)+'</small></td><td><strong>'+money(b.price)+'</strong></td><td><span class="badge badge-approved">'+esc(b.status||'Confirmed')+'</span></td></tr>').join('') +
      '</tbody></table></div>' : '<p style="color:var(--muted);padding:20px">No bookings recorded in database.</p>') +
    '</div>';
  } else if(tab === 'orders'){
    const oList = state.adminOrders || [];
    mainContent = '<div class="admin-panel">' +
      '<div class="admin-panel-head">' +
        '<div><h2>Global E-Commerce Orders</h2><p style="color:var(--muted);font-size:12px;margin:4px 0 0">Beauty retail store purchases and shipment status.</p></div>' +
        '<span class="admin-status-pulse"><i></i> '+oList.length+' Orders</span>' +
      '</div>' +
      (oList.length ? '<label class="dash-search">Search orders<input type="search" data-dashboard-search="tbody tr" placeholder="Search by order, customer or status"></label>' : '') +
      (oList.length ? '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total Amount</th><th>Payment</th><th>Address</th><th>Status</th></tr></thead><tbody>' +
        oList.map(o => {
          const custHtml = o.customer_name
            ? '<strong>'+esc(o.customer_name)+'</strong><br><small style="color:var(--muted)">'+esc(o.customer_email || ('User #'+(o.customer_id || o.user_id || '')))+'</small>'
            : 'User #'+(o.customer_id || o.user_id || '-');
          const itemsHtml = (o.items && o.items.length)
            ? o.items.map(i=>esc(i.name)+' × '+i.qty).join(', ')
            : (o.items_count ? o.items_count + ' items' : '-');
          return '<tr><td><strong>'+esc(o.id)+'</strong></td><td>'+custHtml+'</td><td>'+itemsHtml+'</td><td><strong>'+money(o.total)+'</strong></td><td>'+esc(o.payment_method||'UPI')+'</td><td><small>'+esc(o.address_label||'')+(o.address_text ? ' — '+esc(o.address_text) : '')+'</small></td><td><span class="badge badge-approved">'+esc(o.status||'Placed')+'</span></td></tr>';
        }).join('') +
      '</tbody></table></div>' : '<p style="color:var(--muted);padding:20px">No orders recorded in database.</p>') +
    '</div>';
  } else if(tab === 'services'){
    mainContent = '<div class="admin-panel">' +
      '<div class="admin-panel-head"><div><h2>Services Catalog</h2><p style="color:var(--muted);font-size:12px;margin:4px 0 0">Platform doorstep and salon treatments.</p></div><span class="badge badge-info">'+state.adminServices.length+' Services</span></div>' +
      '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>ID</th><th>Name</th><th>Category</th><th>Duration</th><th>Price</th><th>Rating</th></tr></thead><tbody>' +
        state.adminServices.map(s => '<tr><td>'+s.id+'</td><td><strong>'+esc(s.name)+'</strong></td><td><span class="badge badge-info">'+esc(s.category)+'</span></td><td>'+esc(s.duration)+'</td><td><strong>'+money(s.price)+'</strong></td><td>'+s.rating+' ★ ('+s.reviews+')</td></tr>').join('') +
      '</tbody></table></div>' +
    '</div>';
  } else if(tab === 'products'){
    mainContent = '<div class="admin-panel">' +
      '<div class="admin-panel-head"><div><h2>Products</h2><p style="color:var(--muted);font-size:12px;margin:4px 0 0">Beauty store retail inventory.</p></div><span class="badge badge-info">'+state.adminProducts.length+' Products</span></div>' +
      '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>ID</th><th>Brand</th><th>Product Name</th><th>Category</th><th>Price</th><th>Tag</th></tr></thead><tbody>' +
        state.adminProducts.map(p => '<tr><td>'+p.id+'</td><td><strong>'+esc(p.brand)+'</strong></td><td>'+esc(p.name)+'</td><td><span class="badge badge-info">'+esc(p.category)+'</span></td><td><strong>'+money(p.price)+'</strong></td><td>'+(p.tag?'<span class="badge badge-approved">'+esc(p.tag)+'</span>':'-')+'</td></tr>').join('') +
      '</tbody></table></div>' +
    '</div>';
  } else if(tab === 'audit-logs'){
    const logs = state.adminAuditLogs || [];
    mainContent = '<div class="admin-panel">' +
      '<div class="admin-panel-head"><div><h2>Immutable Administrative Audit log</h2><p style="color:var(--muted);font-size:12px;margin:4px 0 0">Recorded administrative actions and their details.</p></div><span class="admin-status-pulse"><i></i> '+logs.length+' Events Logged</span></div>' +
      (logs.length ? '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Timestamp</th><th>Admin Actor</th><th>Action</th><th>Target</th><th>Client IP</th><th>Event Metadata</th></tr></thead><tbody>' +
        logs.map(l => '<tr><td><small>'+new Date(l.created_at).toLocaleString()+'</small></td><td><strong>'+esc(l.admin_name||('Admin #'+l.admin_id))+'</strong><br><small>'+esc(l.admin_email||'')+'</small></td><td><span class="badge badge-info">'+esc(l.action)+'</span></td><td>'+esc(l.target_type)+' #'+esc(l.target_id||'-')+'</td><td><code>'+esc(l.ip_address||'127.0.0.1')+'</code></td><td><pre style="margin:0;font-size:10px;font-family:monospace;max-width:240px;overflow-x:auto">'+esc(JSON.stringify(l.details||{}))+'</pre></td></tr>').join('') +
      '</tbody></table></div>' : '<p style="color:var(--muted);padding:20px">No audit events recorded yet.</p>') +
    '</div>';
  }

  return '<div class="admin-shell">' +
    sidebar +
    '<main class="admin-main">' +
      '<div class="admin-header">' +
        '<div>' +
          '<p class="dash-kicker">GLAMGO / ADMIN</p><h1>'+esc(({overview:'Marketplace overview', moderation:'Partner applications', users:'Users & accounts', bookings:'Bookings', orders:'Orders', services:'Services', products:'Products', 'audit-logs':'Audit log'})[tab] || 'Marketplace')+'.</h1>' +
          '<p>Manage the marketplace and review your latest activity.</p>' +
        '</div>' +
        '<div class="dash-account">'+icon('user',17)+' <span>'+esc(state.user.name)+'</span></div>' +
      '</div>' +
      (state.adminDataError ? '<div class="dash-alert" role="status">'+esc(state.adminDataError)+' <button data-action="admin-refresh">Retry</button></div>' : '') + mainContent +
    '</main>' +
  '</div>';
}

function modal(){
  if(!state.modal) return '';
  let inner = '';
  if(state.modal==='admin-view-draft'){
    const draft = (state.adminDrafts || []).find(d => d.id === state.selectedDraftId);
    inner = draft ? '<div class="modal-head"><p class="eyebrow">PARTNER APPLICATION · #'+esc(draft.id)+'</p><h2>'+esc(draft.name)+'</h2><p>'+esc(draft.role)+' · '+esc(draft.status)+'</p></div><div class="dash-application-detail"><p><strong>Applicant</strong><br>'+esc(draft.applicant_name || '—')+'<br>'+esc(draft.applicant_email || '')+'</p><p><strong>Application details</strong><br>'+esc(draft.description || 'No details provided.')+'</p>'+(draft.rejection_reason?'<p><strong>Rejection reason</strong><br>'+esc(draft.rejection_reason)+'</p>':'')+'</div>'+(draft.status === 'PENDING' ? '<div class="admin-actions"><button class="btn btn-primary" data-action="admin-approve-draft" data-id="'+draft.id+'">Approve application</button><button class="btn btn-outline" data-action="admin-reject-draft" data-id="'+draft.id+'">Reject application</button></div>' : '') : '<p>Application not found.</p>';
  }
  if(state.modal==='admin-reject-draft'){
    const draft = (state.adminDrafts || []).find(d => d.id === state.selectedDraftId);
    inner='<div class="modal-head"><p class="eyebrow">PARTNER MODERATION</p><h2>Reject application.</h2><p>Please provide a formal rejection reason for '+esc(draft?.applicant_name || 'the applicant')+'.</p></div><form id="admin-reject-form"><label>Rejection reason<textarea name="reason" required placeholder="e.g. Incomplete training credentials or invalid salon trade license" style="min-height:90px"></textarea></label><button class="btn btn-danger full" type="submit">Confirm rejection '+icon('arrow',17)+'</button></form>';
  }
  if(state.modal==='partner-suborder-ship') inner='<div class="modal-head"><p class="eyebrow">SHIP ORDER</p><h2>Enter tracking details.</h2><p>For suborder '+esc(state.shipSuborderId || '')+'.</p></div><form id="partner-ship-form"><label>Courier name<input name="carrier" required maxlength="100" placeholder="Courier or delivery partner" autocomplete="off"></label><label>Tracking number<input name="tracking" required maxlength="100" placeholder="Tracking or AWB number" autocomplete="off"></label><label>Tracking link (optional)<input name="tracking_url" type="url" placeholder="https://"></label><button class="btn btn-primary full" type="submit">Confirm dispatch '+icon('arrow',17)+'</button></form>';
  else if(state.modal==='location') inner='<div class="modal-head"><p class="eyebrow">YOUR LOCATION</p><h2>Where should we find you?</h2><p>View city-available services, specialists, and distance-sorted salons.</p></div><button type="button" class="btn btn-outline full" style="margin-bottom:14px" data-action="map-locate">'+icon('pin',16)+' Use my current location (GPS)</button><form id="location-form"><label>Enter area or city<input name="location" required value="'+esc(state.location)+'" placeholder="e.g. Bandra West, Mumbai" autofocus></label><button class="btn btn-primary full" type="submit">Save location '+icon('arrow',17)+'</button></form><div class="location-suggestions"><span>POPULAR LOCATIONS</span>'+['Indiranagar, Bengaluru','Koramangala, Bengaluru','Whitefield, Bengaluru','Bandra West, Mumbai','Juhu, Mumbai','Hauz Khas, South Delhi'].map(l=>'<button data-action="location-set" data-id="'+l+'">'+icon('pin',16)+l+'</button>').join('')+'</div>';
  else if(state.modal==='date') inner='<div class="modal-head"><p class="eyebrow">PLAN YOUR VISIT</p><h2>Choose a date.</h2><p>Browse salons for the day that suits you.</p></div><div class="date-grid modal-dates">'+dateOptions().map(d=>'<button class="'+(state.salonDate===d.value?'selected':'')+'" data-action="date-set" data-id="'+d.value+'"><span>'+d.day+'</span><strong>'+d.date+'</strong><small>'+d.month+'</small></button>').join('')+'</div>';
  else if(state.modal==='search'){
    const q = state.query.toLowerCase().trim();
    const userCity = normalizeCity(state.location);
    const searchable = [
      ...products.map(x=>({...x,type:'Product',inCity:true})),
      ...services.map(x=>({...x,type:'Service',inCity:isServiceAvailableInCity(x,userCity)})),
      ...salons.map(x=>({...x,type:'Salon',inCity:String(x.city||normalizeCity(x.area)||'').toLowerCase()===userCity.toLowerCase()}))
    ];
    const matched = searchable.filter(x=>{
      if(!q) return true;
      const hay = [x.name,x.category,x.area,x.city,x.brand,x.ingredients,x.tag,x.description].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
    matched.sort((a, b) => (a.inCity === b.inCity ? 0 : a.inCity ? -1 : 1));
    const results = matched.slice(0,9);
    const popularTerms = ['Serum','Lipstick','Niacinamide','Haircare','Fragrance','Facial'];
    const suggestionsHtml = '<div class="search-chips-wrap"><span class="search-chips-label">'+(q?'TRY SEARCHING':'POPULAR SEARCHES')+'</span><div class="search-chips">'+popularTerms.map(t=>'<button class="search-chip" data-action="search-quick" data-id="'+t+'">'+t+'</button>').join('')+'</div></div>';
    inner='<div class="modal-head"><p class="eyebrow">EXPLORE GLAMGO</p><h2>What are you looking for?</h2></div><div class="search-input">'+icon('search',21)+'<input id="global-search" value="'+esc(state.query)+'" placeholder="Search products, brands, ingredients or services" autocomplete="off" autofocus>'+(state.query?'<button class="search-clear-btn" data-action="search-clear" aria-label="Clear search">'+icon('close',16)+'</button>':'')+'</div>'+(!q?suggestionsHtml:'')+'<div class="search-results">'+(results.length?results.map(x=>'<button data-action="search-result" data-id="'+x.id+'" data-type="'+x.type+'"><span>'+icon(x.type==='Service'?'spark':x.type==='Salon'?'salon':'bag',20)+'</span><div><strong>'+esc(x.name)+(!x.inCity?' <small style="font-weight:500;color:var(--muted)">(Outside '+esc(userCity)+')</small>':'')+'</strong><small>'+x.type+(x.brand?' · '+esc(x.brand):'')+(x.category?' · '+esc(shopCategoryLabel(x.category)):'')+(x.area?' · '+esc(x.area):'')+(x.type==='Product'&&x.price?' · '+money(x.price):'')+'</small></div>'+icon('arrow',17)+'</button>').join(''):'<div class="search-empty-box">'+empty('search','No matches for "'+esc(state.query)+'"','Check spelling or explore popular beauty picks below.')+suggestionsHtml+'<div class="search-noresult-actions"><button class="btn btn-outline btn-sm" data-action="search-clear">Clear search</button><button class="btn btn-primary btn-sm" data-action="shop-all">Browse Beauty Store</button></div></div>')+'</div>';
  }
  else if(state.modal==='booking') inner=bookingModal();
  else if(state.modal==='booking-reschedule'){
    const rb = state.rescheduleBooking || {};
    inner='<div class="modal-head"><p class="eyebrow">1-TAP RESCHEDULE</p><h2>Pick a new date &amp; time.</h2><p>Rescheduling <strong>'+esc(rb.title||'Appointment')+'</strong> with '+esc(rb.professional||'your specialist')+'.</p></div>' +
      '<div class="date-grid modal-dates">'+dateOptions().map(d=>'<button type="button" class="'+(rb.date===d.value?'selected':'')+'" data-action="booking-reschedule-date" data-id="'+d.value+'"><span>'+d.day+'</span><strong>'+d.date+'</strong><small>'+d.month+'</small></button>').join('')+'</div>' +
      '<p class="slot-label" style="margin:14px 0 8px">PREFERRED TIMES</p>' +
      '<div class="time-grid" style="margin-bottom:18px">'+['9:00 AM','10:30 AM','12:00 PM','2:00 PM','3:30 PM','5:00 PM'].map(t=>'<button type="button" class="'+(rb.time===t?'selected':'')+'" data-action="booking-reschedule-time" data-id="'+t+'">'+t+'</button>').join('')+'</div>' +
      '<button type="button" class="btn btn-primary full" data-action="booking-reschedule-save">Confirm new slot '+icon('check',17)+'</button>';
  }
  else if(state.modal==='pro-verify-otp'){
    const bId = state.proVerifyBookingId || '';
    inner='<div class="modal-head"><p class="eyebrow">DOORSTEP ARRIVAL VERIFICATION</p><h2>Enter Customer Arrival PIN.</h2><p>Ask the client for the 4-digit Arrival PIN displayed in their My bookings card for booking <strong>#'+esc(bId)+'</strong>.</p></div>' +
      '<form id="pro-arrival-otp-form"><label>4-Digit Arrival PIN<input name="otp" inputmode="numeric" pattern="\\d{4}" minlength="4" maxlength="4" required placeholder="e.g. 4829" autocomplete="one-time-code" autofocus></label><button class="btn btn-primary full" type="submit">Verify Arrival PIN '+icon('shield',17)+'</button></form>';
  }
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
  const selectedAddons = Array.isArray(b.addons) ? b.addons : [];
  const addonObjects = BOOKING_ADDONS.filter(a => selectedAddons.includes(a.id));
  const addonsSum = addonObjects.reduce((acc, a) => acc + Number(a.price || 0), 0);
  const basePrice = Number(service?.price || 0);
  const totalPrice = basePrice + addonsSum;
  const userCity = normalizeCity(state.location);
  const addonsHtml = ''; // No partner-backed add-on catalogue is available yet.
  const steps = b.type==='home'?['Service','Professional','Date & time','Confirm']:['Service','Staff','Date & time','Confirm'];
  let body = '';
  if(b.step===0){
    const cityHomeServices = services.filter(s => isServiceAvailableInCity(s, userCity));
    const list0 = b.type==='home' ? cityHomeServices : services.filter(s=>salon&&salon.services.includes(s.category));
    body='<h3>Choose your service</h3>'+(salon?'<p class="booking-hint">Choose a catalogue service in one of this salon’s listed categories. Prices shown are catalogue prices.</p>':'')+'<div class="booking-options">'+(list0.length?list0.map(s=>'<button class="'+(b.serviceId===s.id?'selected':'')+'" data-action="booking-service" data-id="'+s.id+'"><span><strong>'+s.name+'</strong><small>'+s.duration+' · '+s.category+'</small></span><b>'+money(s.price)+'</b></button>').join(''):'<p>No services are available for this selection right now.</p>')+'</div>'+addonsHtml;
  }
  if(b.step===1){
    const cityPros = professionals.filter(p => isProAvailableInCity(p, userCity));
    const list1 = b.type==='home' ? cityPros : (Array.isArray(salon?.staff) ? salon.staff : []);
    body='<h3>'+(b.type==='home'?'Choose your professional':'Select a staff member')+'</h3><p class="booking-hint">Choose a specialist, or let us find the best available expert for you.</p><div class="booking-options"><button class="'+(b.professional==='Any available expert'?'selected':'')+'" data-action="booking-pro" data-id="Any available expert"><span><strong>Any available expert</strong><small>We will match you with a trusted professional.</small></span></button>'+list1.map(p=>'<button class="'+(b.professional===p.name?'selected':'')+'" data-action="booking-pro" data-id="'+esc(p.name)+'">'+(p.img?image(p.img,p.name,'booking-avatar'):'')+'<span><strong>'+p.name+'</strong><small>'+esc(p.specialty || 'Beauty professional')+'</small></span></button>').join('')+'</div>';
  }
  if(b.step===2) body='<h3>Pick your moment</h3><p class="booking-hint">Choose a preferred time for '+esc(salon?salon.name:'at-home beauty care')+'. Availability is checked when you book.</p><div class="date-grid">'+dateOptions().map(d=>'<button class="'+(b.date===d.value?'selected':'')+'" data-action="booking-date" data-id="'+d.value+'"><span>'+d.day+'</span><strong>'+d.date+'</strong><small>'+d.month+'</small></button>').join('')+'</div><p class="slot-label">PREFERRED TIMES</p><div class="time-grid">'+['9:00 AM','10:30 AM','12:00 PM','2:00 PM','3:30 PM','5:00 PM'].map(t=>'<button class="'+(b.time===t?'selected':'')+'" data-action="booking-time" data-id="'+t+'">'+t+'</button>').join('')+'</div>'+addonsHtml;
  if(b.step===3){
    const noticeHtml = state.bookingNotice
      ? '<div class="payment-notice payment-notice-'+esc(state.bookingNotice.type||'error')+'" role="alert"><strong>'+esc(state.bookingNotice.title)+'</strong><p>'+esc(state.bookingNotice.message)+'</p></div>'
      : '';
    const addonReviewRows = addonObjects.map(a => '<div><span>Add-on: '+esc(a.name)+' ('+esc(a.duration)+')</span><strong>+'+money(a.price)+'</strong></div>').join('');
    body='<h3>Review your booking</h3><div class="booking-review"><div><span>Service</span><strong>'+(service?.name||'Service')+' ('+money(basePrice)+')</strong></div>'+addonReviewRows+'<div><span>Professional</span><strong>'+esc(b.professional)+'</strong></div><div><span>Date & time</span><strong>'+formatDate(b.date)+' · '+b.time+'</strong></div><div><span>Location</span><strong>'+esc(salon?salon.name+', '+salon.area:state.addresses[0]?.text||state.location)+'</strong></div><div><span>Price</span><strong>'+money(totalPrice)+'</strong></div></div>'+noticeHtml+'<p class="booking-hint">Complete payment to confirm your appointment and receive your 4-digit Arrival PIN in My bookings.</p>';
  }
  const confirmLabel = b.step===3
    ? (state.bookingBusy ? 'Processing...' : (state.bookingNotice ? 'Retry payment '+icon('arrow',16) : 'Confirm booking '+icon('check',17)))
    : 'Continue '+icon('arrow',17);
  return '<div class="modal-head"><p class="eyebrow">'+(salon?'SALON APPOINTMENT':'AT-HOME BEAUTY')+'</p><h2>Book a beautiful moment.</h2><p>'+(salon?salon.name:'Expert care in the comfort of home.')+'</p></div><div class="booking-progress">'+steps.map((s,i)=>'<span class="'+(i<=b.step?'active':'')+'"><b>'+(i<b.step?'✓':i+1)+'</b>'+s+'</span>').join('')+'</div><div class="booking-step">'+body+'</div><div class="booking-footer">'+(b.step>0?button('Back','booking-back','btn-outline'):'<span></span>')+button(confirmLabel,b.step===3?'booking-confirm':'booking-next','btn-primary',(b.step===3 && state.bookingBusy)?'disabled aria-disabled="true"':'')+'</div>';
}

function bookingSuccess(){
  const b = state.bookings[0] || { title: 'Service', date: '2026-11-20', time: '10:00 AM', professional: 'Nisha Kapoor', type: 'home' };
  return '<main class="success-page"><div class="success-mark">'+icon('check',34)+'</div><p class="eyebrow">BOOKING CONFIRMED</p><h1>Your moment is <em>all set.</em></h1><p>'+esc(b.title)+' is booked for '+formatDate(b.date)+' at '+b.time+'. We have added the details to your account.</p><div class="success-details"><span>EXPERIENCE <strong>'+(b.type==='home'?'At-home beauty':'Salon & parlour')+'</strong></span><span>PROFESSIONAL <strong>'+esc(b.professional)+'</strong></span>'+(b.arrival_otp?'<span>ARRIVAL PIN <strong>'+esc(b.arrival_otp)+'</strong></span>':'')+'</div><div class="success-actions">'+button('View my bookings '+icon('arrow',17),'account-bookings','btn-primary')+button('Keep exploring','landing','btn-outline')+'</div></main>';
}

function render(){
  if(state.view === 'public'){
    app.innerHTML = publicLanding({ signedIn: state.signedIn, experience: state.experience, menu: state.publicMenu, icon });
    document.body.classList.remove('modal-open');
    return;
  }
  if(state.view === 'auth' || (!state.signedIn && PROTECTED_VIEWS.has(state.view))){ app.innerHTML = auth(); return; }
  if(state.view === 'onboarding'){ app.innerHTML = onboarding(); return; }
  if(state.view === 'partner'){
    app.innerHTML = partnerPage() + modal();
    document.body.classList.toggle('modal-open', !!state.modal);
    return;
  }
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
  let page = state.view==='landing' ? (state.experience==='home'?homePage():state.experience==='salon'?salonPage():shopPage()) : state.view==='service-detail'?serviceDetail():state.view==='salon-detail'?salonDetail():state.view==='product-detail'?productDetail():state.view==='account'?account():state.view==='cart'?cartPage():state.view==='checkout'?checkoutPage():state.view==='order-success'?orderSuccess():state.view==='tracking'?trackingPage():state.view==='booking-success'?bookingSuccess():state.view==='partner'?partnerPage():homePage();
  app.innerHTML = header() + page + footer() + mobileNav() + modal();
  document.body.classList.toggle('modal-open', !!state.modal);
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
    addons: [],
    step: selectedService ? 1 : 0
  };
  state.modal = 'booking';
  render();
}

let scrollLockUntil = 0;
const addedCartTimers = {};
async function action(el){
  const a = el.dataset.action, id = el.dataset.id;
  if(a==='public-home'){
    pendingAuthResume=null; state.publicMenu=false; state.view='public';
    if(window.location.protocol !== 'file:') window.history.replaceState(null, '', '/');
    render(); window.scrollTo({top:0,behavior:'instant'});
  }
  else if(a==='public-menu'){ state.publicMenu=!state.publicMenu; render(); document.querySelector('.public-menu-toggle')?.focus(); }
  else if(a==='public-scroll'){
    const target=el.dataset.target;
    if(state.publicMenu){ state.publicMenu=false; render(); }
    document.getElementById(target)?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }
  else if(a==='public-category'){
    const exp=el.dataset.experience;
    if(exp==='home') state.homeCategory=id;
    if(exp==='salon') state.salonCategory=id;
    if(exp==='shop') { state.shopCategory=id; state.shopCollection='All'; state.shopBrand='All'; }
    setExperience(exp);
    const target=exp==='home'?'popular':exp==='salon'?'salons':'bestsellers';
    setTimeout(()=>document.getElementById(target)?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}),80);
  }
  else if(a==='public-partner'){
    state.publicMenu=false;
    state.partnerRole=['Professional','Salon Owner','Product Seller'].includes(id)?id:'Professional';
    state.partnerTab='Registration';
    if(!requireAuth({view:'partner',partnerRole:state.partnerRole,partnerTab:'Registration'}, 'Sign in to apply as a GlamGo partner')) return;
    navigate('partner'); loadPartnerData();
  }
  else if(a==='onboarding'){ pendingAuthResume=null; state.view='onboarding'; render(); }
  else if(a==='guest-browse'){ pendingAuthResume=null; state.mobileMenu=false; state.menu=false; state.view=state.experience?'landing':'public'; render(); window.scrollTo({top:0,behavior:'instant'}); }
  else if(a==='landing'){ state.activeNav='landing'; navigate('landing'); }
  else if(a==='experience') setExperience(id);
  else if(a==='discover-goal'){
    const experience = el.dataset.experience;
    const category = el.dataset.category;
    if(experience === 'home' && homeCategories.includes(category)) state.homeCategory = category;
    if(experience === 'salon') { state.salonCategory = 'All'; state.salonDistanceFilter = 'all'; }
    if(experience === 'shop' && shopCategories.includes(category)){ state.shopCategory = category; state.shopCollection = 'All'; state.shopBrand = 'All'; }
    setExperience(experience);
    const target = experience === 'home' ? 'popular' : experience === 'salon' ? 'salons' : 'bestsellers';
    setTimeout(()=>document.getElementById(target)?.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'}),80);
  }
  else if(a==='switch-toggle'){
    if(window.innerWidth<=700){ state.mobileMenu=!state.mobileMenu; state.menu=false; }
    else { state.menu=!state.menu; state.mobileMenu=false; }
    render();
  }
  else if(a==='mobile-toggle'){ state.mobileMenu=!state.mobileMenu; render(); }
  else if(a==='location'){ state.mobileMenu=false; state.menu=false; state.modal='location'; render(); }
  else if(a==='location-set'){
    state.location=id;
    state.userCoords=null;
    state.salonDistanceFilter='all';
    state.modal=null;
    persist();
    render();
    toast('Location updated to ' + normalizeCity(id));
    void loadCatalogFeeds();
  }
  else if(a==='map-locate'){
    if(!navigator.geolocation){
      toast('Geolocation is not supported in this browser.');
      return;
    }
    toast('Finding your location...');
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        state.userCoords = [lat, lng];
        state.location = await reverseGeocodeCoords(lat, lng);
        state.salonDistanceFilter = 'all';
        state.modal = null;
        persist();
        render();
        toast('Location updated to ' + state.location);
        void loadCatalogFeeds();
      },
      err => toast(err?.code === 1
        ? 'Location access blocked — type your area or pick a city below.'
        : 'Unable to fetch GPS right now — type your area below.'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }
  else if(a==='salon-distance'){ state.salonDistanceFilter=id||'all'; render(); }
  else if(a==='checkout-toggle-credit'){ state.applyWalletCredit=!state.applyWalletCredit; invalidateCheckoutState(false); render(); }
  else if(a==='search-open'){ state.mobileMenu=false; state.menu=false; state.modal='search'; state.query=''; render(); setTimeout(()=>document.getElementById('global-search')?.focus(),20); }
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
    if(el.dataset.type==='Salon'){ state.experience='salon'; state.selectedSalon=id; navigate('salon-detail'); ensureListingReviews('salon',id); }
    else if(el.dataset.type==='Product'){ state.experience='shop'; state.selectedProduct=id; state.productVariant=null; state.pdpTab='details'; navigate('product-detail'); ensureProductExtras(id); }
    else { state.experience='home'; state.selectedService=id; navigate('service-detail'); ensureListingReviews('service',id); }
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
  else if(a==='book-home') openBooking('home',id);
  else if(a==='book-pro') openBooking('home',null,null,professionals.find(p=>String(p.id)===String(id))?.name);
  else if(a==='service-detail'){ state.selectedService=id; navigate('service-detail'); ensureListingReviews('service',id); }
  else if(a==='salon-detail'){ state.selectedSalon=id; navigate('salon-detail'); ensureListingReviews('salon',id); }
  else if(a==='book-salon') openBooking('salon',id,el.dataset.service?services.find(s=>s.category===el.dataset.service)?.id:null);
  else if(a==='salon-date'){ state.mobileMenu=false; state.menu=false; state.modal='date'; render(); }
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
    if (Object.keys(state.cart || {}).some(key => Number(state.cart[key]) > 0 && !products.some(p => String(p.id) === parseCartKey(key).productId))) { toast('Remove unavailable items before checkout.'); return; }
    if(!requireAuth({ view: 'checkout' }, 'Sign in to proceed to checkout')) return;
    navigate('checkout');
    ensureCheckoutReservation();
  }
  else if(a==='payment'){ state.checkoutPayment=id; state.paymentNotice=null; render(); }
  else if(a==='place-order'){
    if(state.checkoutBusy) return;
    if (state.catalogFeedsLoading.products || state.catalogErrors.products || Object.keys(state.cart || {}).some(key => Number(state.cart[key]) > 0 && !products.some(p => String(p.id) === parseCartKey(key).productId))) { toast('Review your bag before checkout.'); navigate('cart'); return; }
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
      wallet: Boolean(state.applyWalletCredit),
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
          idempotency_key: state.pendingCheckoutKey,
          apply_wallet_credit: Boolean(state.applyWalletCredit)
        });
        state.pendingCheckoutOrder = { fingerprint, order };
        if (Number(order?.wallet_credit_applied || 0) > 0) {
          state.walletCredits = Math.max(0, Number(state.walletCredits || 0) - Number(order.wallet_credit_applied));
        }
      }

      if (isCod || order.payment_status === 'completed' || Number(order.total) <= 0) {
        try {
          const freshOrders = await apiGetMyOrders();
          state.orders = freshOrders;
        } catch {
          if (!state.orders.some(o => o.id === order.id)) state.orders.unshift(order);
        }
        state.notifications.unshift({
          type: 'order',
          text: isCod
            ? `Your order ${order.id} is confirmed (Cash on Delivery).`
            : `Your order ${order.id} is confirmed with GlamGo Wallet Credits.`
        });
        state.cart = {};
        state.cartVariants = {};
        state.coupon = '';
        state.couponDiscount = 0;
        state.applyWalletCredit = false;
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
            if (verifyRes?.payment_status === 'refunded_oos' || verifyRes?.payment_status === 'refund_pending_oos' || verifyRes?.success === false) {
              state.paymentNotice = {
                type: 'error',
                title: 'Stock sold out after hold expired',
                message: verifyRes.message || 'An automatic full refund has been initiated. Please review your bag before retrying.'
              };
              state.pendingCheckoutOrder = null;
              state.pendingReservation = null;
              state.checkoutBusy = false;
              persist();
              render();
              toast('Order out of stock; full refund initiated.');
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
            state.applyWalletCredit = false;
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
    state.mobileMenu=false; state.menu=false;
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
  else if(a==='notifications'){ state.mobileMenu=false; state.menu=false; state.modal='notifications'; render(); }
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
    partnerLoadSequence++;
    adminLoadSequence++;
    for (const key of ['partnerDrafts','partnerProServices','partnerProBookings','partnerSalonStaff','partnerSalonBookings','partnerSellerProducts','partnerSellerOrders','partnerSellerListings','partnerSellerSuborders','partnerSellerReturns','partnerServiceCatalog','partnerProductCatalog','adminUsers','adminDrafts','adminAuditLogs','adminBookings','adminOrders','adminServices','adminProducts']) state[key] = [];
    for (const key of ['partnerOverview','partnerFinancials','partnerProProfile','partnerSalonProfile','partnerSellerMVFinancials','adminStats']) state[key] = null;
    state.partnerDataReady = false;
    state.partnerAvailabilityReady = false;
    state.partnerDataError = '';
    state.proVerifiedArrival = {};
    state.adminDataError = '';
    state.adminDataLoaded = false;
    state.availability = [];
    tokenStorage.remove();
    tokenStorage.removeRefresh();
    pendingAuthResume = null;
    state.signedIn = false;
    state.view = 'auth';
    persist();
    render();
    toast('Signed out');
  }
  else if(a==='auth-toggle'){ state.authMode=state.authMode==='signin'?'signup':'signin'; state.authDevHint=''; render(); }
  else if(a==='auth-mode-set'){
    state.authMode = id || 'signin';
    state.authDevHint = '';
    if(state.authMode === 'otp') state.authOtpStage = 'request';
    if(state.authMode === 'reset') state.authResetStage = 'request';
    render();
  }
  else if(a==='auth-otp-restart'){ state.authOtpStage='request'; state.authDevHint=''; render(); }
  else if(a==='auth-reset-restart'){ state.authResetStage='request'; state.authDevHint=''; render(); }
  else if(a==='pro-verify-otp-open'){
    state.proVerifyBookingId = id;
    state.modal = 'pro-verify-otp';
    render();
  }
  else if(a==='booking-reschedule-open'){
    const target = (state.bookings || []).find(b => String(b.id) === String(id));
    if(!target) return;
    state.rescheduleBooking = {
      id: target.id,
      title: target.title,
      professional: target.professional,
      date: target.date || dateOptions()[0]?.value,
      time: target.time || '10:30 AM'
    };
    state.modal = 'booking-reschedule';
    render();
  }
  else if(a==='booking-reschedule-date'){
    if(state.rescheduleBooking){ state.rescheduleBooking.date = id; render(); }
  }
  else if(a==='booking-reschedule-time'){
    if(state.rescheduleBooking){ state.rescheduleBooking.time = id; render(); }
  }
  else if(a==='booking-reschedule-save'){
    const rb = state.rescheduleBooking;
    if(!rb || !rb.date || !rb.time){
      toast('Please choose a new date and time slot.');
      return;
    }
    try {
      const updated = await apiRescheduleBooking(rb.id, rb.date, rb.time);
      const idx = (state.bookings || []).findIndex(b => String(b.id) === String(rb.id));
      if(idx !== -1) state.bookings[idx] = updated;
      state.modal = null;
      state.rescheduleBooking = null;
      persist();
      render();
      toast(`Appointment rescheduled to ${formatDate(updated.date)} at ${updated.time}`);
    } catch (err) {
      toast(err.message || 'Could not reschedule appointment');
    }
  }
  else if(a==='partners'){
    if(!requireAuth({ view: 'partner' }, 'Sign in to access the Salon & Partner Portal')) return;
    const roleMap = { seller: 'Product Seller', salon_owner: 'Salon Owner', professional: 'Professional' };
    if (roleMap[state.user?.role]) state.partnerRole = roleMap[state.user.role];
    state.partnerTab=state.user?.role === 'customer' ? 'Registration' : 'Overview';
    navigate('partner');
    loadPartnerData();
  }
  else if(a==='partner-role'){
    if(state.user?.role !== 'customer' && state.user?.role !== 'admin') return;
    state.partnerRole=id;
    state.partnerTab=state.user?.role === 'customer' ? 'Registration' : 'Overview';
    render();
    loadPartnerData();
  }
  else if(a==='partner-tab'){ state.partnerTab=id; render(); window.scrollTo({top:0,behavior:'instant'}); loadPartnerData(); }
  else if(a==='partner-refresh'){ await loadPartnerData(); }
  else if(a==='admin-refresh'){ await loadAdminData(); }
  else if(a==='partner-pro-assign-service'){
    const sEl = document.getElementById('partner-service-select');
    if(sEl && sEl.value){
      try {
        await apiAssignProfessionalService(sEl.value);
        const pool = (Array.isArray(state.partnerServiceCatalog) && state.partnerServiceCatalog.length) ? state.partnerServiceCatalog : services;
        const matched = pool.find(s => String(s.id) === String(sEl.value));
        if(matched && !(state.partnerProServices || []).some(s => String(s.id) === String(sEl.value))){
          state.partnerProServices = [...(state.partnerProServices || []), matched];
        }
        persist();
        render();
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
      state.partnerProServices = (state.partnerProServices || []).filter(s => String(s.id) !== String(id));
      persist();
      render();
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
    if(!confirm('Cancel this appointment?')) return;
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
    if(!confirm('Cancel this appointment?')) return;
    try {
      await apiUpdateSalonBookingStatus(id, 'cancelled');
      toast('Salon appointment cancelled & refund queued');
      await loadPartnerData();
    } catch(err) {
      toast(err.message || 'Failed to cancel appointment');
    }
  }
  else if(a==='partner-staff-delete'){
    if(!confirm('Remove this staff member from your salon?')) return;
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
      const nextStock = parseInt(String(stInput.value), 10);
      if(!Number.isFinite(nextStock) || nextStock < 0){
        toast('Enter a valid stock quantity (0 or more)');
        return;
      }
      try {
        const res = await apiUpdateSellerStock(id, nextStock);
        const appliedStock = Number.isFinite(Number(res?.stock)) ? Number(res.stock) : nextStock;
        state.partnerSellerProducts = (state.partnerSellerProducts || []).map(p => String(p.id) === String(id) ? { ...p, stock: appliedStock } : p);
        state.partnerSellerListings = (state.partnerSellerListings || []).map(l => String(l.product_id) === String(id) ? { ...l, stock: appliedStock } : l);
        persist();
        render();
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
    state.shipSuborderId = id;
    state.modal = 'partner-suborder-ship';
    render();
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
    if(!confirm('Approve this return and initiate a customer refund?')) return;
    const restock = confirm('Restock the returned item? Choose Cancel to approve without restocking.');
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
    if(stockInput){
      const nextStock = parseInt(String(stockInput.value), 10);
      const nextPrice = priceInput ? parseFloat(String(priceInput.value)) : null;
      if(!Number.isFinite(nextStock) || nextStock < 0 || (priceInput && (!Number.isFinite(nextPrice) || nextPrice <= 0))){
        toast('Enter valid listing price and stock values');
        return;
      }
      try {
        const update = { stock: nextStock };
        if(priceInput) update.price = nextPrice;
        await apiUpdateSellerListing(id, update);
        state.partnerSellerListings = (state.partnerSellerListings || []).map(l => String(l.id) === String(id) ? { ...l, ...update } : l);
        persist();
        render();
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
    window.scrollTo({top:0,behavior:'instant'});
    loadAdminData();
  }
  else if(a==='admin-tab'){
    state.adminTab = id;
    render();
    window.scrollTo({top:0,behavior:'instant'});
  }
  else if(a==='admin-draft-filter'){
    state.adminDraftFilter = id;
    render();
  }
  else if(a==='admin-user-filter'){
    state.adminUserFilter = id;
    render();
  }
  else if(a==='admin-approve-draft'){
    if(!confirm('Approve this partner application and update their role?')) return;
    try {
      const res = await apiApprovePartnerDraft(Number(id));
      const idx = (state.adminDrafts || []).findIndex(d => d.id === Number(id));
      if (idx !== -1) state.adminDrafts[idx] = res;
      state.modal = null;
      toast('Partner application approved & user promoted!');
      const [uRes, aRes] = await Promise.allSettled([apiGetAdminUsers(), apiGetAuditLogs()]);
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
  else if(a==='admin-view-draft'){
    state.selectedDraftId = Number(id);
    state.modal = 'admin-view-draft';
    render();
  }
  else if(a==='admin-toggle-user'){
    if(!confirm('Change this account’s access status?')) return;
    try {
      const updated = await apiToggleUserStatus(Number(id));
      const idx = state.adminUsers.findIndex(u => u.id === Number(id));
      if (idx !== -1) state.adminUsers[idx] = updated;
      toast(`User status updated: ${updated.is_active ? 'Active' : 'Suspended'}`);
      try {
        state.adminAuditLogs = await apiGetAuditLogs();
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
    } catch (err) {
      toast(err.message || 'Could not update availability. Please try again.');
    }
    persist();
    render();
  }
  else if(a==='modal-close'){ state.modal=null; render(); }
  else if(a==='booking-service'){ state.booking.serviceId=id; render(); }
  else if(a==='booking-addon-toggle'){
    if (!state.booking) return;
    const cur = Array.isArray(state.booking.addons) ? state.booking.addons : [];
    state.booking.addons = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id];
    state.pendingBooking = null;
    state.pendingBookingKey = null;
    render();
  }
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
      location: salon ? `${salon.name}, ${salon.area}` : (state.addresses[0]?.text || state.location),
      addons: Array.isArray(b.addons) ? b.addons : []
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
        const bookingIndex = state.bookings.findIndex(item => item.id === booked.id);
        if (bookingIndex < 0) state.bookings.unshift(booked); else state.bookings[bookingIndex] = booked;
        persist();
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
              await apiVerifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                booking_id: booked.id
              });
              let paidBooking = { ...booked, status: 'confirmed', payment_status: 'completed', razorpay_order_id: payOrder.razorpay_order_id };
              try { const refreshed = await apiGetMyBookings(); paidBooking = refreshed.find(item => item.id === booked.id) || paidBooking; } catch {}
              const bookingIndex = state.bookings.findIndex(item => item.id === booked.id);
              if (bookingIndex < 0) state.bookings.unshift(paidBooking); else state.bookings[bookingIndex] = { ...paidBooking, status: 'confirmed' };
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
      if (resume.partnerRole) state.partnerRole = resume.partnerRole;
      if (resume.partnerTab) state.partnerTab = resume.partnerTab;
      loadPartnerData();
    }
    if (resume.view === 'checkout') ensureCheckoutReservation();
    return null;
  }
  state.view = state.experience ? 'landing' : 'public';
  return null;
}

document.addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target, d = new FormData(f);
  if(f.id === 'partner-ship-form'){
    const carrier = String(d.get('carrier') || '').trim();
    const tracking = String(d.get('tracking') || '').trim();
    const trackingUrl = String(d.get('tracking_url') || '').trim();
    if(!carrier || !tracking){ toast('Enter a courier name and tracking number.'); return; }
    if(trackingUrl && !/^https?:\/\//i.test(trackingUrl)){ toast('Enter a valid http or https tracking link.'); return; }
    const submitButton = f.querySelector('button[type="submit"]');
    if(submitButton) submitButton.disabled = true;
    try {
      await apiShipSellerSuborder(state.shipSuborderId, carrier, tracking, trackingUrl || null);
      state.modal = null;
      state.shipSuborderId = null;
      toast('Order dispatched with tracking details');
      await loadPartnerData();
    } catch(err) {
      if(submitButton) submitButton.disabled = false;
      toast(err.message || 'Failed to ship order');
    }
    return;
  }
  if(f.classList.contains('partner-product-edit-form')){
    try {
      await apiUpdateSellerProduct(f.dataset.productId, {
        brand: String(d.get('brand') || '').trim(),
        name: String(d.get('name') || '').trim(),
        category: String(d.get('category') || '').trim(),
        price: Number(d.get('price')),
        img: String(d.get('img') || '').trim(),
        ingredients: String(d.get('ingredients') || '').trim(),
        description: String(d.get('description') || '').trim()
      });
      toast('Product updated');
      await loadPartnerData();
    } catch(err) { toast(err.message || 'Could not update product'); }
  }
  else if(f.id === 'pro-arrival-otp-form'){
    const otp = String(d.get('otp') || '').trim();
    const bId = state.proVerifyBookingId;
    if (!/^\d{4}$/.test(otp)) {
      toast('Please enter a valid 4-digit numeric Arrival PIN.');
      return;
    }
    try {
      await apiVerifyBookingArrivalOtp(bId, otp);
      state.proVerifiedArrival = { ...(state.proVerifiedArrival || {}), [bId]: true };
      state.modal = null;
      state.proVerifyBookingId = null;
      persist();
      render();
      toast(`Arrival PIN verified for booking #${bId}`);
    } catch (err) {
      toast(err.message || 'Invalid 4-digit Arrival PIN');
    }
    return;
  }
  if(f.id === 'auth-otp-request-form'){
    const phone = String(d.get('phone') || '').trim();
    try {
      const res = await apiRequestMobileOtp(phone);
      state.authOtpPhone = phone;
      state.authOtpStage = 'verify';
      state.authDevHint = res?.dev_otp ? `Dev OTP: ${res.dev_otp}` : '';
      render();
      toast(res?.message || 'Verification code requested.');
    } catch (err) {
      toast(err.message || 'Could not request OTP');
    }
    return;
  }
  if(f.id === 'auth-otp-verify-form'){
    const otp = String(d.get('otp') || '').trim();
    try {
      const res = await apiVerifyMobileOtp(state.authOtpPhone, otp);
      state.signedIn = true;
      state.user = { id: res.user_id, name: res.name, email: res.email, phone: res.phone || state.authOtpPhone || '', role: res.role };
      state.authMode = 'signin';
      state.authOtpStage = 'request';
      state.authDevHint = '';
      const bookingResume = applyPostAuthNavigation(res.role);
      const [myB, myO, myA, myN, myRw] = await Promise.allSettled([
        apiGetMyBookings(),
        apiGetMyOrders(),
        apiGetAddresses(),
        apiGetNotifications(),
        apiGetMyRewards()
      ]);
      if(myB.status==='fulfilled') state.bookings = myB.value;
      if(myO.status==='fulfilled') state.orders = myO.value;
      if(myA.status==='fulfilled') state.addresses = myA.value;
      if(myN.status==='fulfilled') state.notifications = myN.value;
      if(myRw.status==='fulfilled' && myRw.value){
        state.walletCredits = Number(myRw.value.wallet_credits || 0);
        state.referralCode = myRw.value.referral_code || state.referralCode;
      }
      persist();
      render();
      if (bookingResume) openBooking(...bookingResume.args);
      toast(`Welcome back, ${res.name.split(' ')[0]}`);
    } catch (err) {
      toast(err.message || 'Invalid OTP');
    }
    return;
  }
  if(f.id === 'auth-reset-request-form'){
    const email = String(d.get('email') || '').trim();
    try {
      const res = await apiRequestPasswordReset(email);
      state.authResetEmail = email;
      state.authResetStage = 'confirm';
      state.authDevHint = res?.dev_code ? `Dev Reset Code: ${res.dev_code}` : '';
      render();
      toast(res?.message || 'Reset code requested.');
    } catch (err) {
      toast(err.message || 'Could not request password reset');
    }
    return;
  }
  if(f.id === 'auth-reset-confirm-form'){
    const code = String(d.get('code') || '').trim();
    const newPassword = String(d.get('new_password') || '').trim();
    try {
      const res = await apiConfirmPasswordReset(state.authResetEmail, code, newPassword);
      state.authMode = 'signin';
      state.authResetStage = 'request';
      state.authDevHint = '';
      render();
      toast(res?.message || 'Password updated. Please sign in.');
    } catch (err) {
      toast(err.message || 'Password reset failed');
    }
    return;
  }
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
        const [myB, myO, myA, myN, myRw] = await Promise.allSettled([
          apiGetMyBookings(),
          apiGetMyOrders(),
          apiGetAddresses(),
          apiGetNotifications(),
          apiGetMyRewards()
        ]);
        if(myB.status==='fulfilled') state.bookings = myB.value;
        if(myO.status==='fulfilled') state.orders = myO.value;
        if(myA.status==='fulfilled') state.addresses = myA.value;
        if(myN.status==='fulfilled') state.notifications = myN.value;
        if(myRw.status==='fulfilled' && myRw.value){
          state.walletCredits = Number(myRw.value.wallet_credits || 0);
          state.referralCode = myRw.value.referral_code || state.referralCode;
        }
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
    const nextLoc = String(d.get('location') || '').trim();
    if(nextLoc && nextLoc !== state.location) state.userCoords = null;
    if(nextLoc) state.location = nextLoc;
    state.salonDistanceFilter = 'all';
    state.modal = null;
    persist();
    render();
    toast('Location updated to ' + normalizeCity(state.location));
    void loadCatalogFeeds();
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
  else if(f.id === 'reward-redeem-form'){
    const code = String(d.get('code') || '').trim().toUpperCase();
    if (!code) return;
    try {
      const res = await apiRedeemRewardCode(code);
      state.walletCredits = Number(res.wallet_credits || 0);
      try { state.notifications = await apiGetNotifications(); } catch {}
      persist();
      render();
      toast(res.message || `Redeemed ${code} (+${money(res.credited_amount)})`);
    } catch (err) {
      toast(err.message || 'Could not redeem reward code');
    }
  }
  else if(f.id === 'partner-apply-form'){
    try {
      const docs = String(d.get('documents')||'').split(',').map(s=>s.trim()).filter(Boolean);
      const ports = String(d.get('portfolio')||'').split(',').map(s=>s.trim()).filter(Boolean);
      const res = await apiApplyForPartner({
        role: ({'Professional':'professional','Salon Owner':'salon_owner','Product Seller':'seller'})[state.partnerRole],
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
      render();
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
        state.adminAuditLogs = await apiGetAuditLogs();
      } catch {}
      render();
    } catch (err) {
      toast('Failed to reject application: ' + (err.message || 'Server error'));
    }
  }
});

document.addEventListener('input', e => {
  if(e.target.dataset.dashboardSearch){
    const query = e.target.value.trim().toLowerCase();
    const panel = e.target.closest('.dashboard-panel, .admin-panel');
    panel?.querySelectorAll(e.target.dataset.dashboardSearch).forEach(row => { row.hidden = !row.textContent.toLowerCase().includes(query); });
  }
  if(e.target.id === 'global-search'){
    state.query = e.target.value;
    const focus = e.target.selectionStart;
    render();
    const input = document.getElementById('global-search');
    input?.focus();
    input?.setSelectionRange(focus, focus);
  }
  if(e.target.id === 'admin-user-search'){
    state.adminUserSearch = e.target.value;
    const focus = e.target.selectionStart;
    render();
    const input = document.getElementById('admin-user-search');
    input?.focus();
    input?.setSelectionRange(focus, focus);
  }
});

document.addEventListener('change', async e => {
  if(e.target.id === 'partner-mobile-nav'){
    state.partnerTab = e.target.value;
    render();
    window.scrollTo({top:0,behavior:'instant'});
    loadPartnerData();
    return;
  }
  if(e.target.id === 'admin-mobile-nav'){
    state.adminTab = e.target.value;
    render();
    window.scrollTo({top:0,behavior:'instant'});
    return;
  }
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
  if(e.target.classList.contains('admin-role-select') && e.target.dataset.userId){
    const userId = Number(e.target.dataset.userId);
    const newRole = e.target.value;
    if(!confirm('Change this user’s role to '+newRole+'?')) { render(); return; }
    try {
      const res = await apiUpdateUserRole(userId, newRole);
      const idx = (state.adminUsers || []).findIndex(u => u.id === userId);
      if (idx !== -1) state.adminUsers[idx] = res;
      toast(`User role updated to ${newRole}`);
      try {
        state.adminAuditLogs = await apiGetAuditLogs();
      } catch {}
      render();
    } catch (err) {
      toast('Failed to update role: ' + (err.message || 'Server error'));
      render();
    }
  }
});

window.addEventListener('scroll', () => {
  if (state.view !== 'landing' || Date.now() < scrollLockUntil) return;
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
  } else if(window.location.hash === '#salon' || window.location.hash === '#partner' || window.location.hash === '#partners'){
    if(!requireAuth({ view: 'partner' }, 'Sign in to access the Salon & Partner Portal')) return;
    state.view = 'partner';
    const roleMap = { seller:'Product Seller', salon_owner:'Salon Owner', professional:'Professional' };
    state.partnerRole = roleMap[state.user?.role] || (window.location.hash === '#salon' ? 'Salon Owner' : state.partnerRole);
    state.partnerTab = state.user?.role === 'customer' ? 'Registration' : 'Overview';
    render();
    loadPartnerData();
  }
});

document.addEventListener('keydown', e => {
  if(e.key === 'Escape' && state.view === 'public' && state.publicMenu){
    state.publicMenu = false;
    render();
    document.querySelector('.public-menu-toggle')?.focus();
  }
  if(e.key === 'Escape' && (state.modal || state.mobileMenu || state.menu)){
    state.modal = null;
    state.mobileMenu = false;
    state.menu = false;
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
  applyRouteFromLocation();
  if(window.location.hash === '#admin' && state.user?.role === 'admin' && state.signedIn){
    state.view = 'admin';
  } else if((window.location.hash === '#salon' || window.location.hash === '#partner' || window.location.hash === '#partners') && state.signedIn){
    state.view = 'partner';
    const roleMap = { seller:'Product Seller', salon_owner:'Salon Owner', professional:'Professional' };
    state.partnerRole = roleMap[state.user?.role] || (window.location.hash === '#salon' ? 'Salon Owner' : state.partnerRole);
    state.partnerTab = state.user?.role === 'customer' ? 'Registration' : 'Overview';
    loadPartnerData();
  }
  render();
  try {
    const hydrateSession = async () => {
      if (!tokenStorage.get()) return;
      try {
        const me = await apiGetMe();
        state.user = { id: me.id, name: me.name, email: me.email, phone: me.phone, role: me.role };
        state.addresses = me.addresses || state.addresses;
        state.signedIn = true;
        const [myB, myO, myN, myR, myRw] = await Promise.allSettled([
          apiGetMyBookings(),
          apiGetMyOrders(),
          apiGetNotifications(),
          apiGetMyReviews(),
          apiGetMyRewards()
        ]);
        if(myB.status === 'fulfilled') state.bookings = myB.value;
        if(myO.status === 'fulfilled') state.orders = myO.value;
        if(myN.status === 'fulfilled') state.notifications = myN.value;
        if(myR.status === 'fulfilled') state.reviews = myR.value;
        if(myRw.status === 'fulfilled' && myRw.value){
          state.walletCredits = Number(myRw.value.wallet_credits || 0);
          state.referralCode = myRw.value.referral_code || state.referralCode;
        }

        if(me.role === 'admin'){
          if(window.location.hash === '#admin' || window.location.pathname === '/admin'){
            state.view = 'admin';
          }
          await loadAdminData();
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
