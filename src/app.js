import { publicLanding } from './public-landing.js';
import {
  isAppBannerDismissed,
  dismissAppBanner,
  renderAppDownloadBanner,
  renderAppDownloadModal
} from './components/appDownload.js';
import {
  tokenStorage,
  apiLogin,
  apiRegister,
  apiGetMe,
  apiRequestPasswordReset,
  apiConfirmPasswordReset,
  apiRequestMobileOtp,
  apiVerifyMobileOtp,
  apiRequestEmailOtp,
  apiVerifyEmailOtp,
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
  apiCreateProfessionalCustomService,
  apiUpdateProfessionalCustomService,
  apiGetProfessionalBookings,
  apiUpdateProfessionalBookingStatus,
  apiGetSalonProfile,
  apiUpdateSalonProfile,
  apiGetSalonServices,
  apiCreateSalonService,
  apiUpdateSalonService,
  apiDeleteSalonService,
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
  apiGetSellerMultiVendorFinancials,
  apiConciergeChat
} from './api.js';

const isDemoCatalogue = import.meta.env.VITE_DEMO_CATALOGUE === 'true';
const hasLocalDemo = import.meta.env.DEV && import.meta.env.VITE_LOCAL_DEMO_CATALOGUE === 'true';
const isPreviewId = id => String(id || '').startsWith('demo-');
const HOME_IMG = './assets/home-editorial.webp';
const AUTH_IMG = './assets/auth-editorial.webp';
const SALON_IMG = './assets/salon-editorial.webp';
const SHOP_IMG = './assets/shop-editorial.webp';
const MEN_HOME_IMG = './assets/men-home-editorial.webp';
const MEN_SALON_IMG = './assets/men-salon-editorial.webp';
const MEN_SHOP_IMG = './assets/men-shop-editorial.webp';
const MEN_CATEGORY_IMAGES = { Hair: './assets/men-hair.webp', Skin: './assets/men-skin.webp', Spa: './assets/men-massage.webp', Packages: './assets/men-beard.webp', Beard: './assets/men-beard.webp' };
const MEN_SHOP_CATEGORY_IMAGES = { Skincare: './assets/men-category-skincare.webp', Haircare: './assets/men-category-haircare.webp', 'Beard Care': './assets/men-category-beard.webp', 'Body Care': './assets/men-category-body.webp', Fragrance: './assets/men-category-body.webp', 'Beauty Tools': './assets/men-category-beard.webp' };
const photo = (id, w = 900) => 'https://images.unsplash.com/' + id + '?auto=format&fit=crop&w=' + w + '&q=85';

let leafletMod = null;
let leafletLoadPromise = null;
function loadLeaflet() {
  if (leafletMod) return Promise.resolve(leafletMod);
  if (leafletLoadPromise) return leafletLoadPromise;
  leafletLoadPromise = Promise.all([
    import('leaflet'),
    import('leaflet/dist/leaflet.css')
  ]).then(([lMod]) => {
    leafletMod = lMod.default || lMod;
    return leafletMod;
  }).catch(err => {
    leafletLoadPromise = null;
    console.warn('[GlamGo] Failed to lazy-load Leaflet:', err);
    return null;
  });
  return leafletLoadPromise;
}

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
  filter: '<line x1="4" y1="8" x2="20" y2="8"/><circle cx="15" cy="8" r="2.2" fill="currentColor"/><line x1="4" y1="16" x2="20" y2="16"/><circle cx="9" cy="16" r="2.2" fill="currentColor"/>',
  eye: '<path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="2.8"/>',
  eyeOff: '<path d="M9.9 4.2A10.4 10.4 0 0 1 12 4c6.2 0 10 8 10 8a18.5 18.5 0 0 1-3.2 4.3M6.6 6.6A17.7 17.7 0 0 0 2 12s3.8 8 10 8a9.8 9.8 0 0 0 5.4-1.6"/><path d="M14.1 14.1a3 3 0 0 1-4.2-4.2"/><path d="M3 3l18 18"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="1"/><path d="M7 3v4M17 3v4M3 10h18"/>',
  shield: '<path d="M12 2 4 5v6c0 6 4 9 8 11 4-2 8-5 8-11V5l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
  spark: '<path d="M12 2.7 6.3 8.4a8 8 0 1 0 11.4 0L12 2.7Z"/>',
  home: '<path d="m3 10 9-7 9 7v11H3V10Z"/><path d="M9 21v-7h6v7"/>',
  salon: '<path d="M4 21V7l8-4 8 4v14H4Z"/><path d="M4 10h16M9 21v-6h6v6"/>',
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
  truck: '<path d="M2 6h12v11H2V6ZM14 10h4l3 3v4h-7v-7Z"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
  logout: '<path d="M10 3H4v18h6M14 7l5 5-5 5M8 12h11"/>',
  female: '<circle cx="12" cy="8" r="4"/><path d="M12 12v9M9 17h6"/>',
  male: '<circle cx="10" cy="14" r="5"/><path d="m13.5 10.5 5.5-5.5m0 0h-4m4 0v4"/>',
  whatsapp: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/><path d="M16.5 14.5c-.3-.2-1.6-.8-1.9-.9-.2-.1-.4-.2-.5.1-.2.2-.6.8-.7 1-.1.1-.3.2-.5.1-.3-.2-1.2-.4-2.3-1.4-.8-.8-1.4-1.7-1.6-2-.2-.3 0-.4.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.4.1-.2 0-.3 0-.5s-.5-1.3-.7-1.7c-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s1 2.5 1.1 2.7c.2.2 2 3.1 4.8 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.3-.6-.5Z"/>',
  sparkle: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/>',
  bot: '<rect width="18" height="12" x="3" y="6" rx="2"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><path d="M12 2v4M2 12h1M21 12h1M7 18v2M17 18v2"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>'
};

const icon = (name, size = 20, extra = '') => '<svg class="icon ' + extra + '" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (icons[name] || '') + '</svg>';
const money = n => '₹' + Number(n).toLocaleString('en-IN');
const esc = str => String(str ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeHttpUrl = raw => {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  try {
    const u = new URL(s);
    return (u.protocol === 'http:' || u.protocol === 'https:') ? u.href : '';
  } catch {
    return '';
  }
};
if (typeof document !== 'undefined') {
  document.addEventListener('error', e => {
    const t = e.target;
    if (t && t.tagName === 'IMG') t.style.opacity = '0.15';
  }, true);
}

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
const INDIAN_STATES_OR_COUNTRY = new Set([
  'india', 'maharashtra', 'karnataka', 'tamil nadu', 'telangana', 'kerala',
  'gujarat', 'rajasthan', 'uttar pradesh', 'west bengal', 'punjab', 'haryana',
  'madhya pradesh', 'bihar', 'odisha', 'goa', 'assam', 'jharkhand', 'uttarakhand',
  'himachal pradesh', 'chhattisgarh', 'andhra pradesh', 'jammu and kashmir'
]);
function normalizeCity(loc = '') {
  const raw = String(loc || '').trim().toLowerCase();
  if (!raw) return 'Mumbai';
  if (raw.includes('bangalore') || raw.includes('bengaluru') || raw.includes('indiranagar') || raw.includes('koramangala') || raw.includes('whitefield') || raw.includes('hsr') || raw.includes('yelahanka')) return 'Bengaluru';
  if (raw.includes('delhi') || raw.includes('hauz khas') || raw.includes('gurgaon') || raw.includes('gurugram') || raw.includes('noida')) return 'Delhi';
  if (raw.includes('mumbai') || raw.includes('bandra') || raw.includes('juhu') || raw.includes('khar') || raw.includes('andheri') || raw.includes('powai')) return 'Mumbai';
  const parts = String(loc)
    .split(',')
    .map(s => s.trim())
    .filter(s => s && !/^\d{5,6}$/.test(s) && !INDIAN_STATES_OR_COUNTRY.has(s.toLowerCase()));
  return parts.length ? parts[parts.length - 1] : 'Mumbai';
}
const currentLocationCity = () => state.locationCity || normalizeCity(state.location);
function resolveUserCoords() {
  if (Array.isArray(state.userCoords) && state.userCoords.length === 2 && Number.isFinite(Number(state.userCoords[0])) && Number.isFinite(Number(state.userCoords[1]))) {
    return [Number(state.userCoords[0]), Number(state.userCoords[1])];
  }
  const text = String(state.location || '').trim().toLowerCase();
  const keys = Object.keys(AREA_COORDS).sort((a, b) => b.length - a.length);
  const direct = keys.find(k => text.includes(k));
  if (direct) return AREA_COORDS[direct];
  return AREA_COORDS[currentLocationCity().toLowerCase()] || null;
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
  return k ? AREA_COORDS[k] : null;
}
function enrichSalonWithDistance(s) {
  const userCoords = resolveUserCoords();
  const salonCoords = resolveSalonCoords(s);
  const km = userCoords && salonCoords
    ? Math.round(haversineKm(userCoords[0], userCoords[1], salonCoords[0], salonCoords[1]) * 10) / 10
    : (s?.distance_km != null && Number.isFinite(Number(s.distance_km)) ? Math.round(Number(s.distance_km) * 10) / 10 : null);
  return { ...s, distanceKm: km, isFar: km == null ? null : km > NEAR_SALON_RADIUS_KM, distanceLabel: km == null ? '' : `${km.toFixed(1)} km away` };
}
function isServiceAvailableInCity(s, city) {
  const c = String(city || '').trim().toLowerCase();
  if (!c) return true;
  if (Array.isArray(s?.cities) && s.cities.length) return s.cities.some(x => normalizeCity(x).toLowerCase() === c);
  if (s?.city) return normalizeCity(s.city).toLowerCase() === c;
  return false;
}
function isProAvailableInCity(p, city) {
  const c = String(city || '').trim().toLowerCase();
  if (!c) return true;
  if (p?.city) return normalizeCity(p.city).toLowerCase() === c;
  if (p?.area) return normalizeCity(p.area).toLowerCase() === c;
  return false;
}
function nearestKnownCityForCoords(lat, lng) {
  const hubs = [
    { city: 'Mumbai', label: 'Mumbai', coords: AREA_COORDS.mumbai },
    { city: 'Bengaluru', label: 'Bengaluru', coords: AREA_COORDS.bengaluru },
    { city: 'Delhi', label: 'Delhi', coords: AREA_COORDS.delhi }
  ];
  let best = null;
  for (const h of hubs) {
    const d = haversineKm(lat, lng, h.coords[0], h.coords[1]);
    if (d <= 60 && (!best || d < best.dist)) best = { ...h, dist: d };
  }
  return best ? { label: best.label, city: best.city } : null;
}
async function reverseGeocodeCoords(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10000) });
    if (res.ok) {
      const data = await res.json();
      const addr = data?.address || {};
      const area = addr.suburb || addr.neighbourhood || addr.city_district || addr.road || '';
      const rawCity = addr.city || addr.town || addr.municipality || addr.village || addr.state_district || addr.county || '';
      const city = rawCity ? normalizeCity(rawCity) : '';
      const formatted = [area, city].filter(Boolean).filter((v, i, a) => a.findIndex(x => x.toLowerCase() === v.toLowerCase()) === i).join(', ');
      if (city) return { label: formatted || city, city };
    }
  } catch {}
  return nearestKnownCityForCoords(lat, lng);
}
function requestLiveLocation({ silent = false } = {}) {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    if (!silent) toast('Live location is not supported in this browser.');
    return;
  }
  if (silent) {
    try {
      if (sessionStorage.getItem('glamgo-geo-asked') === '1') return;
      sessionStorage.setItem('glamgo-geo-asked', '1');
    } catch {}
  } else {
    toast('Detecting your live location…');
  }
  navigator.geolocation.getCurrentPosition(
    async pos => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const prevCity = currentLocationCity();
      state.userCoords = [lat, lng];
      const resolved = await reverseGeocodeCoords(lat, lng);
      if (resolved && resolved.city) {
        state.location = resolved.label;
        state.locationCity = resolved.city;
      }
      state.salonDistanceFilter = 'all';
      persist();
      if (!silent || (resolved && resolved.city.toLowerCase() !== prevCity.toLowerCase())) {
        toast('Showing listings for ' + (resolved?.label || state.location));
      }
      void loadCatalogFeeds();
      if (canSafelyBackgroundRender()) render();
    },
    err => {
      if (!silent) {
        toast(err?.code === 1
          ? 'Live location blocked in browser settings — choose your city in Location.'
          : 'Unable to detect live GPS right now — choose your city in Location.');
      }
    },
    { enableHighAccuracy: !silent, timeout: 10000, maximumAge: 300000 }
  );
}

let locationDraft = null;
let locationLookupSeq = 0;
let activeLeafletMaps = [];
let activeLocationMap = null;
let activeLocationMarker = null;
function destroyActiveMaps() {
  activeLeafletMaps.forEach(m => {
    try { m.stop(); m.off(); m.remove(); } catch {}
  });
  activeLeafletMaps = [];
  activeLocationMap = null;
  activeLocationMarker = null;
}

function addTileLayerWithFallback(map, L) {
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);
}

async function searchLocationSuggestions(query) {
  const q = String(query || '').trim();
  if (q.length < 2) return [];
  const bias = Array.isArray(state.userCoords) ? state.userCoords : [19.076, 72.8777];
  try {
    const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5&lang=en&lat=${encodeURIComponent(bias[0])}&lon=${encodeURIComponent(bias[1])}`);
    if (res.ok) {
      const data = await res.json();
      const features = Array.isArray(data?.features) ? data.features : [];
      const items = features.map(f => {
        const p = f.properties || {};
        const coords = f.geometry?.coordinates || [];
        const name = p.name || p.street || p.district || p.city || '';
        const sub = [p.district, p.city || p.county, p.state, p.country].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');
        const full = sub && !sub.toLowerCase().startsWith(name.toLowerCase()) ? `${name}, ${sub}` : (name || sub);
        return { label: name || sub, sub, full: full || sub, city: (['city', 'town', 'village'].includes(p.type) || (p.osm_key === 'place' && ['city', 'town', 'village'].includes(p.osm_value))) ? name : (p.city || p.town || p.village || p.county || ''), lat: Number(coords[1]), lng: Number(coords[0]) };
      }).filter(x => x.full && Number.isFinite(x.lat) && Number.isFinite(x.lng));
      if (items.length) return items;
    }
  } catch {}
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(q)}`, {
      headers: { Accept: 'application/json' }
    });
    if (res.ok) {
      const rows = await res.json();
      return (Array.isArray(rows) ? rows : []).map(r => {
        const parts = String(r.display_name || '').split(',').map(s => s.trim()).filter(Boolean);
        return {
          label: parts[0] || r.display_name,
          sub: parts.slice(1, 4).join(', '),
          full: parts.slice(0, 3).join(', '),
          city: r.address?.city || r.address?.town || r.address?.village || r.address?.municipality || r.address?.county || '',
          lat: Number(r.lat),
          lng: Number(r.lon)
        };
      }).filter(x => x.full && Number.isFinite(x.lat) && Number.isFinite(x.lng));
    }
  } catch {}
  return [];
}

async function selectLocationCoords(lat, lng) {
  const draft = locationDraft;
  if (!draft) return;
  const seq = ++locationLookupSeq;
  draft.pending = true;
  const save = document.querySelector('#location-form button[type="submit"]');
  if (save) save.disabled = true;
  const result = await reverseGeocodeCoords(lat, lng);
  if (draft !== locationDraft || seq !== locationLookupSeq || state.modal !== 'location') return;
  draft.pending = false;
  if (save) save.disabled = false;
  if (!result) {
    toast('Could not identify that location. Search for an area or try again.');
    const fallbackCoords = draft.coords || resolveSalonCoords({ area: draft.label });
    if (activeLocationMarker && fallbackCoords) activeLocationMarker.setLatLng(fallbackCoords);
    return;
  }
  Object.assign(draft, { label: result.label, city: result.city, coords: [lat, lng] });
  const input = document.getElementById('location-search-input');
  if (input) input.value = result.label;
}

async function mountLocationPickerMap() {
  const locEl = document.getElementById('location-picker-map');
  if (!locEl) return;
  const L = await loadLeaflet();
  if (!L) return;

  const currentLocEl = document.getElementById('location-picker-map');
  if (currentLocEl && !currentLocEl._leaflet_id) {
    const center = Array.isArray(locationDraft?.coords)
      ? locationDraft.coords
      : (resolveSalonCoords({ area: locationDraft?.label || state.location }) || AREA_COORDS.mumbai);
    const map = L.map(currentLocEl, {
      scrollWheelZoom: false,
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false
    }).setView(center, 13);
    addTileLayerWithFallback(map, L);
    const pinIcon = L.divIcon({
      className: 'gg-map-pin-wrap',
      html: '<span class="gg-map-pin gg-map-pin-active">Selected</span>',
      iconSize: [74, 28],
      iconAnchor: [37, 14]
    });
    const marker = L.marker(center, { icon: pinIcon }).addTo(map);
    activeLocationMap = map;
    activeLocationMarker = marker;
    map.on('click', ev => {
      const { lat, lng } = ev.latlng;
      marker.setLatLng([lat, lng]);
      void selectLocationCoords(lat, lng);
    });
    activeLeafletMaps.push(map);
    setTimeout(() => { try { map.invalidateSize(); } catch {} }, 100);
  }
}

const homeCategories = ['All','Hair','Skin','Waxing','Threading','Nails','Makeup','Spa','Packages','Beard'];
const shopCategories = ['All','Skincare','Makeup','Haircare','Body Care','Fragrance','Beauty Tools','Beard Care'];
const shopCategoryLabel = c => (c === 'Beauty Tools' ? 'Tools' : c);
const salonCategories = ['All','Hair','Skin','Nails','Makeup','Spa','Beard'];
const roles = ['Professional','Salon Owner','Product Seller'];
const roleSections = {
  Professional:['Overview','Registration','Identity verification','Profile management','Services & pricing','Availability calendar','Booking requests','Upcoming appointments','Booking history','Earnings','Customer reviews'],
  'Salon Owner':['Overview','Registration','Salon profile','Branches','Service catalogue','Staff management','Appointments','Availability','Revenue analytics','Customer reviews'],
  'Product Seller':['Overview','Registration','Marketplace listings','Products','Inventory & stock','Orders & fulfillment','Returns & refunds','Escrow & settlement']
};

const defaults = {
  signedIn: false,
  experience: 'home',
  audience: 'women',
  user: null,
  location:'Bandra West, Mumbai',
  locationCity: '',
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
  partnerSalonServices: [],
  partnerSalonStaff: [],
  partnerSalonBookings: [],
  editingPartnerService: null,
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
  experience: saved.experience || 'home',
  view: 'landing',
  publicMenu: false,
  modal: null,
  menu: false,
  mobileMenu: false,
  searchOpen: false,
  query: '',
  homeCategory: 'All',
  homeSort: 'featured',
  homeMinPrice: '',
  homeMaxPrice: '',
  salonCategory: 'All',
  salonSort: 'distance-asc',
  salonMinPrice: '',
  salonMaxPrice: '',
  salonDate: null,
  shopCategory: 'All',
  shopCollection: 'All',
  shopBrand: 'All',
  shopAvailability: 'all',
  shopSort: 'featured',
  shopMinPrice: '',
  shopMaxPrice: '',
  filterOpen: { home: false, salon: false, shop: false },
  filterDrawerOpen: false,
  filterDrawerDraft: null,
  activeNav: null,
  addedCartIds: {},
  addingCartId: null,
  quickViewProductId: null,
  quickSelectedVariants: {},
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
  partnerSalonServices: [],
  partnerSalonStaff: [],
  partnerSalonBookings: [],
  editingPartnerService: null,
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
  appDownloadModal: false,
  appSharePhone: '',
  appShareStatus: '',
  appShareError: '',
  appBannerDismissed: isAppBannerDismissed(),
  aiChatOpen: false,
  aiChatBusy: false,
  aiChatMessages: null,
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
const SORT_OPTIONS = [
  ['featured', 'Featured'],
  ['alpha-asc', 'Alphabetically, A-Z'],
  ['alpha-desc', 'Alphabetically, Z-A'],
  ['price-asc', 'Price, low to high'],
  ['price-desc', 'Price, high to low']
];
const SALON_SORT_OPTIONS = [
  ['distance-asc', 'Distance: Near to far'],
  ...SORT_OPTIONS
];
const SORT_LABELS = Object.fromEntries(SALON_SORT_OPTIONS);
const isProductInStock = p => {
  if (!p || p.in_stock === false || p.soldOut === true) return false;
  const vs = Array.isArray(p.variants) && p.variants.length ? p.variants : null;
  if (vs) return vs.some(v => !getStockInfo(p, v).soldOut);
  return !getStockInfo(p, '').soldOut;
};
const matchesPriceRange = (rawPrice, minVal, maxVal) => {
  const hasMin = minVal !== '' && minVal != null && !Number.isNaN(Number(minVal));
  const hasMax = maxVal !== '' && maxVal != null && !Number.isNaN(Number(maxVal));
  if (!hasMin && !hasMax) return true;
  if (rawPrice == null || rawPrice === '' || Number.isNaN(Number(rawPrice))) return false;
  const priceNum = Number(rawPrice);
  if (hasMin && priceNum < Number(minVal)) return false;
  if (hasMax && priceNum > Number(maxVal)) return false;
  return true;
};
const sortFilteredItems = (list, sortKey, priceGetter, fallbackCompare = null) => {
  const out = [...list];
  if (sortKey === 'distance-asc') out.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  else if (sortKey === 'alpha-asc') out.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  else if (sortKey === 'alpha-desc') out.sort((a, b) => String(b.name || '').localeCompare(String(a.name || '')));
  else if (sortKey === 'price' || sortKey === 'price-asc') out.sort((a, b) => (priceGetter(a) ?? Infinity) - (priceGetter(b) ?? Infinity));
  else if (sortKey === 'price-desc') out.sort((a, b) => (priceGetter(b) ?? -1) - (priceGetter(a) ?? -1));
  else if (fallbackCompare) out.sort(fallbackCompare);
  return out;
};
const getFiltersForExp = exp => {
  if (exp === 'home') return { exp: 'home', category: state.homeCategory, sort: state.homeSort, minPrice: state.homeMinPrice, maxPrice: state.homeMaxPrice };
  if (exp === 'salon') return { exp: 'salon', category: state.salonCategory, distance: state.salonDistanceFilter || 'all', sort: state.salonSort, minPrice: state.salonMinPrice, maxPrice: state.salonMaxPrice };
  return { exp: 'shop', category: state.shopCategory, collection: state.shopCollection, brand: state.shopBrand, availability: state.shopAvailability || 'all', sort: state.shopSort, minPrice: state.shopMinPrice, maxPrice: state.shopMaxPrice };
};
const applyFiltersToExp = (exp, f) => {
  if (exp === 'home') {
    state.homeCategory = f.category || 'All';
    state.homeSort = f.sort || 'featured';
    state.homeMinPrice = f.minPrice ?? '';
    state.homeMaxPrice = f.maxPrice ?? '';
  } else if (exp === 'salon') {
    state.salonCategory = f.category || 'All';
    state.salonDistanceFilter = f.distance || 'all';
    state.salonSort = f.sort || 'featured';
    state.salonMinPrice = f.minPrice ?? '';
    state.salonMaxPrice = f.maxPrice ?? '';
  } else {
    state.shopCategory = f.category || 'All';
    state.shopCollection = f.collection || 'All';
    state.shopBrand = f.brand || 'All';
    state.shopAvailability = f.availability || 'all';
    state.shopSort = f.sort || 'featured';
    state.shopMinPrice = f.minPrice ?? '';
    state.shopMaxPrice = f.maxPrice ?? '';
  }
};
const defaultFiltersForExp = exp => {
  if (exp === 'home') return { exp: 'home', category: 'All', sort: 'featured', minPrice: '', maxPrice: '' };
  if (exp === 'salon') return { exp: 'salon', category: 'All', distance: 'all', sort: 'distance-asc', minPrice: '', maxPrice: '' };
  return { exp: 'shop', category: 'All', collection: 'All', brand: 'All', availability: 'all', sort: 'featured', minPrice: '', maxPrice: '' };
};
const getHomeServicePrice = s => (s?.starting_price != null && Number(s.starting_price) > 0) ? Number(s.starting_price) : (s?.price != null ? Number(s.price) : null);
const getFilteredHomeServices = (items = [], filters = null) => {
  const f = filters || getFiltersForExp('home');
  const filtered = (items || []).filter(s => {
    if (f.category && f.category !== 'All' && s.category !== f.category) return false;
    if (!matchesPriceRange(getHomeServicePrice(s), f.minPrice, f.maxPrice)) return false;
    return true;
  });
  return sortFilteredItems(filtered, f.sort, getHomeServicePrice);
};
const getFilteredSalons = (items = [], filters = null) => {
  const f = filters || getFiltersForExp('salon');
  const maxKm = !f.distance || f.distance === 'all'
    ? Infinity
    : f.distance === 'nearest'
      ? NEAR_SALON_RADIUS_KM
      : Number(f.distance || Infinity);
  const filtered = (items || []).filter(s => {
    if (f.category && f.category !== 'All' && !(Array.isArray(s.services) && s.services.includes(f.category))) return false;
    if (maxKm !== Infinity && !(s.distanceKm != null && s.distanceKm <= maxKm)) return false;
    if (!matchesPriceRange(s.price != null && Number(s.price) > 0 ? Number(s.price) : null, f.minPrice, f.maxPrice)) return false;
    return true;
  });
  return sortFilteredItems(filtered, f.sort, s => (s.price != null && Number(s.price) > 0 ? Number(s.price) : null), (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
};
const getFilteredShopProducts = (items = products, filters = null) => {
  const f = filters || getFiltersForExp('shop');
  const filtered = (items || []).filter(p => {
    if (f.category && f.category !== 'All' && p.category !== f.category) return false;
    if (f.brand && f.brand !== 'All' && p.brand !== f.brand) return false;
    if (!matchesShopCollection(p, f.collection)) return false;
    if (f.availability === 'in_stock' && !isProductInStock(p)) return false;
    if (f.availability === 'out_of_stock' && isProductInStock(p)) return false;
    if (!matchesPriceRange(p.price, f.minPrice, f.maxPrice)) return false;
    return true;
  });
  return sortFilteredItems(filtered, f.sort, p => (p.price != null ? Number(p.price) : null));
};
const trapFocusIn = (container, e) => {
  if (!container || e.key !== 'Tab') return;
  const focusables = Array.from(container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter(el => el.offsetParent !== null);
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && (document.activeElement === first || !container.contains(document.activeElement))) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (document.activeElement === last || !container.contains(document.activeElement))) {
    e.preventDefault();
    first.focus();
  }
};
const getRelatedProducts = (p, limit = 3) => p ? products.filter(item => matchesAudience(item) && item.id !== p.id && item.category === p.category).slice(0, limit) : [];
const parseIngredientsList = raw => String(raw || '').split(/[,;•\n]+/).map(s => s.trim()).filter(Boolean);
const ensureProductExtras = id => {
  if (!id) return;
  if (isPreviewId(id)) {
    state.productOffers = state.productOffers || {};
    state.productReviews = state.productReviews || {};
    state.productOffers[id] = { offers: [] };
    state.productReviews[id] = { loading: false, items: [] };
    return;
  }
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
  if (isPreviewId(id)) { state.listingReviews[key] = { loading: false, items: [] }; return; }
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
    : !reviews.items.length ? '<p>No customer reviews yet.</p>'
    : '<div class="pdp-review-list">'+reviews.items.map(r=>'<article class="pdp-review-item"><div class="pdp-review-head"><strong>'+esc(r.user_name || 'GlamGo customer')+'</strong><span class="rating">'+icon('star',14)+' '+esc(r.rating)+'/5</span></div>'+(r.comment?'<p>'+esc(r.comment)+'</p>':'')+'</article>').join('')+'</div>';
  return '<section class="detail-block"><h2>Customer reviews</h2>'+body+'</section>';
};
const getActiveSubnavKey = () => {
  if (state.view === 'landing') {
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
const setExperience = id => { state.experience = id; state.view = 'landing'; state.activeNav = 'landing'; state.modal = null; state.menu = false; state.mobileMenu = false; state.filterDrawerOpen = false; state.filterDrawerDraft = null; state.searchOpen = false; persist(); if (window.location.protocol !== 'file:') window.history.replaceState(null, '', '/' + routeHashForExperience(id)); render(); window.scrollTo({top:0,behavior:'instant'}); };
const navigate = view => { state.view = view; if (view === 'landing' && !state.activeNav) state.activeNav = 'landing'; state.modal = null; state.menu = false; state.mobileMenu = false; state.filterDrawerOpen = false; state.filterDrawerDraft = null; render(); window.scrollTo({top:0,behavior:'instant'}); };
const image = (src, alt, cls='') => '<img class="'+esc(cls)+'" src="'+esc(src)+'" alt="'+esc(alt)+'" decoding="sync">';
const button = (label, action, cls='btn-primary', attrs='') => '<button class="btn '+cls+'" data-action="'+action+'" '+attrs+'>'+label+'</button>';
const sectionHead = (eyebrow,title,sub='',action='') => '<div class="section-head"><div><p class="eyebrow">'+eyebrow+'</p><h2>'+title+'</h2>'+(sub?'<p class="section-sub">'+sub+'</p>':'')+'</div>'+action+'</div>';

const empty = (symbol,title,text,action='') => '<div class="empty-state"><div class="empty-symbol">'+icon(symbol,28)+'</div><h3>'+title+'</h3><p>'+text+'</p>'+action+'</div>';
const catalogLoadingState = label => '<div class="catalog-loading-panel"><p>Curating live '+esc(label)+'...</p></div>';
const catalogUnavailableState = (title, message = 'Live inventory could not be loaded right now. Please try again in a moment.') => '<div class="catalog-unavailable">'+empty('bag', title + ' unavailable', message, button('Retry loading '+icon('arrow',16), 'retry-catalog', 'btn-primary'))+'</div>';
const canSafelyBackgroundRender = () => {
  // Public content is static and does not need replacing as catalog feeds arrive.
  if (state.view === 'public') return false;
  if (state.modal || state.mobileMenu || state.filterDrawerOpen) return false;
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

  const userCity = currentLocationCity();
  const coords = Array.isArray(state.userCoords) ? state.userCoords : null;
  const withDemo = async (remoteFetcher, demoPath) => {
    const live = await remoteFetcher();
    if (!hasLocalDemo) return live;
    try {
      const res = await fetch('/preview-api' + demoPath);
      if (!res.ok) throw new Error('Local demo unavailable');
      const local = await res.json();
      if (!Array.isArray(local)) throw new Error('Invalid demo response');
      const ids = new Set(live.map(item => String(item.id)));
      return [...live, ...local.filter(item => isPreviewId(item.id) && item.audience === 'men' && !ids.has(String(item.id)))];
    } catch (err) { console.warn('[Local preview]', err.message); return live; }
  };
  await Promise.allSettled([
    fetchFeed('services', () => withDemo(() => apiGetServices(null, null, userCity), '/catalog/services?city='+encodeURIComponent(userCity)), v => { services = v; }),
    fetchFeed('professionals', () => apiGetProfessionals(userCity), v => { professionals = v.filter(p => String(p.name || '').trim().toLowerCase() !== 'glamgo admin'); }),
    fetchFeed('salons', () => withDemo(() => apiGetCatalogSalons({ city: userCity, lat: coords?.[0], lng: coords?.[1] }), '/catalog/salons?city='+encodeURIComponent(userCity)), v => { salons = v; }),
    fetchFeed('products', () => withDemo(apiGetProducts, '/products/'), v => { products = v; })
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
  if (entries.some(entry => isPreviewId(entry.productId))) { toast('Remove demo items before checking out with real products.'); return null; }
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
  return '<div class="onboarding"><div class="onboard-top"><a class="wordmark" href="#" data-action="onboarding"><img src="./assets/glamgo-logo.png" alt="GLAMGO" class="brand-logo-img"></a><div class="onboard-top-right"><span>YOUR BEAUTY. YOUR WAY.</span>'+button((state.signedIn?'My account ':'Sign in ')+icon('user',17),'account','btn-text')+'</div></div><div class="onboard-intro"><p class="eyebrow line-eyebrow">THREE EXPERIENCES. ONE BEAUTIFUL WORLD.</p><h1>Beauty is yours <em>to define.</em></h1><p>Where would you like to begin today?</p></div><div class="experience-grid">'+experiences.map(x=>'<button class="experience-card" data-action="experience" data-id="'+x.id+'"><div class="experience-photo">'+image(x.img,x.title)+'</div><div class="experience-content"><span class="eyebrow">'+x.eyebrow+'</span><h2>'+x.title+'</h2><p>'+x.desc+'</p><span class="experience-link">'+x.cta+' '+icon('arrow',18)+'</span></div></button>').join('')+'</div><div class="onboard-bottom"><span>ONE ACCOUNT. EVERY SIDE OF BEAUTY.</span><span>CURATED WITH CARE &nbsp; · &nbsp; MADE FOR YOU</span></div></div>';
}

function auth(){
  const mode = state.authMode || 'signin';
  const heading = mode==='signup'
    ? 'Create your account'
    : mode==='otp'
      ? 'Sign in with Mobile OTP.'
      : mode==='email_otp'
        ? 'Sign in with Email OTP.'
        : mode==='reset'
          ? 'Reset your password.'
          : 'A beautiful place to begin.';
  const sub = mode==='otp'
    ? 'Enter your mobile number to receive a 6-digit verification code.'
    : mode==='email_otp'
      ? 'Enter your email to receive a 6-digit code. Real inboxes only.'
      : mode==='reset'
        ? 'Request a 6-digit verification code to set a new password.'
        : 'Find exceptional care at home, discover salons and shop your favourites.';
  const methodPills = mode!=='signup'
    ? '<div class="filter-row" style="margin-bottom:18px">' +
        '<button type="button" class="filter-chip '+(mode==='signin'?'active':'')+'" data-action="auth-mode-set" data-id="signin">Password</button>' +
        '<button type="button" class="filter-chip '+(mode==='email_otp'?'active':'')+'" data-action="auth-mode-set" data-id="email_otp">Email OTP</button>' +
        '<button type="button" class="filter-chip '+(mode==='otp'?'active':'')+'" data-action="auth-mode-set" data-id="otp">Mobile OTP</button>' +
      '</div>'
    : '';
  let formHtml = '';
  if(mode==='otp'){
    formHtml = state.authOtpStage==='verify'
      ? '<p style="margin-bottom:8px;font-size:13px">Code sent to <strong>'+esc(state.authOtpPhone)+'</strong></p>' +
        '<p style="margin-bottom:14px;font-size:12.5px;color:var(--muted);line-height:1.5;">Please enter the 6-digit verification code below.</p>' +
        '<form id="auth-otp-verify-form"><label>6-digit OTP<input name="otp" id="auth-otp-input" inputmode="numeric" required maxlength="8" placeholder="Enter 6-digit OTP" autocomplete="one-time-code" value=""></label><button class="btn btn-primary full" type="submit">Verify &amp; Sign in '+icon('arrow',17)+'</button></form>' +
        '<p class="auth-switch"><button type="button" data-action="auth-otp-restart">Use a different mobile number</button></p>'
      : '<form id="auth-otp-request-form"><label>Mobile number<input name="phone" type="tel" required placeholder="+91 98765 43210" autocomplete="tel" value="'+esc(state.authOtpPhone||'')+'"></label><button class="btn btn-primary full" type="submit">Send OTP '+icon('arrow',17)+'</button></form>';
  } else if(mode==='email_otp'){
    formHtml = state.authEmailOtpStage==='verify'
      ? '<p style="margin-bottom:8px;font-size:13px">Code sent to <strong>'+esc(state.authEmailOtpEmail)+'</strong></p>' +
        '<p style="margin-bottom:14px;font-size:12.5px;color:var(--muted);line-height:1.5;">Please check your email inbox and enter the 6-digit verification code below.</p>' +
        '<form id="auth-email-otp-verify-form"><label>6-digit OTP<input name="otp" id="auth-otp-input" inputmode="numeric" required maxlength="8" placeholder="Enter 6-digit OTP" autocomplete="one-time-code" value=""></label><button class="btn btn-primary full" type="submit">Verify &amp; Sign in '+icon('arrow',17)+'</button></form>' +
        '<p class="auth-switch"><button type="button" data-action="auth-email-otp-restart">Use a different email address</button></p>'
      : '<form id="auth-email-otp-request-form"><p style="margin-bottom:12px;font-size:12.5px;color:var(--muted);line-height:1.5;">Enter your real email. We verify active mail exchange servers and send a 6-digit code.</p><label>Email address<input name="email" type="email" required placeholder="you@example.com" autocomplete="email" value="'+esc(state.authEmailOtpEmail||'')+'"></label><button class="btn btn-primary full" type="submit">Send Email OTP '+icon('arrow',17)+'</button></form>';
  } else if(mode==='reset'){
    formHtml = state.authResetStage==='confirm'
      ? '<p style="margin-bottom:12px;font-size:13px">Enter the code sent for <strong>'+esc(state.authResetEmail)+'</strong></p>' + hint +
        '<form id="auth-reset-confirm-form"><label>6-digit reset code<input name="code" inputmode="numeric" required maxlength="16" placeholder="Enter 6-digit code"></label><label>New password<div class="password-field"><input name="new_password" type="password" required minlength="6" placeholder="At least 6 characters" autocomplete="new-password"><button type="button" class="password-toggle" data-action="toggle-password" aria-label="Show password" aria-pressed="false">'+icon('eye',18)+'</button></div></label><button class="btn btn-primary full" type="submit">Reset password '+icon('arrow',17)+'</button></form>' +
        '<p class="auth-switch"><button type="button" data-action="auth-reset-restart">Use a different email</button></p>'
      : '<form id="auth-reset-request-form"><label>Account email address<input name="email" type="email" required placeholder="you@example.com" autocomplete="email" value="'+esc(state.authResetEmail||'')+'"></label><button class="btn btn-primary full" type="submit">Send reset code '+icon('arrow',17)+'</button></form>';
  } else {
    formHtml = '<form id="auth-form">' +
      (mode==='signup'?'<label>Full name<input name="name" required placeholder="Your full name" autocomplete="name"></label><label>Phone number<input name="phone" placeholder="Contact number"></label>':'') +
      '<label>Email address<input name="email" type="email" required placeholder="you@example.com" autocomplete="email"></label>' +
      '<label>Password<div class="password-field"><input name="password" type="password" required minlength="6" placeholder="At least 6 characters" autocomplete="'+(mode==='signup'?'new-password':'current-password')+'"><button type="button" class="password-toggle" data-action="toggle-password" aria-label="Show password" aria-pressed="false">'+icon('eye',18)+'</button></div></label>' +
      '<button class="btn btn-primary full" type="submit">'+(mode==='signup'?'Create account':'Sign in')+' '+icon('arrow',17)+'</button></form>' +
      (mode==='signin'?'<p class="auth-switch"><button type="button" data-action="auth-mode-set" data-id="reset">Forgot password?</button></p>':'');
  }
  const bottomSwitch = mode==='reset'
    ? '<p class="auth-switch"><button type="button" data-action="auth-mode-set" data-id="signin">Back to Email Sign In</button></p>'
    : '<p class="auth-switch">'+(mode==='signup'?'Already have an account?':'New to GlamGo?')+' <button data-action="auth-toggle">'+(mode==='signup'?'Sign in':'Create an account')+'</button></p>';
  return '<div class="auth-layout"><div class="auth-image">'+image(AUTH_IMG,'GlamGo beauty sanctuary')+'<div class="auth-image-copy"><a class="wordmark light" href="#onboarding" data-action="guest-browse"><img src="./assets/glamgo-logo-light.png" alt="GLAMGO" class="brand-logo-img"></a><h1>Your beauty.<br><em>Your way.</em></h1><p>One account for every side of beauty.</p></div></div><div class="auth-panel"><div class="auth-box"><p class="eyebrow">WELCOME TO GLAMGO</p><h2>'+heading+'</h2><p>'+sub+'</p>'+methodPills+formHtml+bottomSwitch+'<p class="auth-switch" style="margin-top:10px"><button data-action="guest-browse">← Continue browsing as guest</button></p></div></div></div>';
}

function header(){
  const activeExp = state.experience || 'home';
  const expTabs = [
    { id: 'home', label: 'At Home', full: 'At-home services' },
    { id: 'salon', label: 'Salons', full: 'Salons & parlours' },
    { id: 'shop', label: 'Shop', full: 'Beauty shopping' }
  ];
  const expSwitcherHtml = '<nav class="exp-switcher" aria-label="Switch experience">' +
    expTabs.map(t => '<button type="button" class="exp-pill'+(activeExp===t.id?' active':'')+'" data-action="experience" data-id="'+t.id+'"'+(activeExp===t.id?' aria-current="page"':'')+'>'+t.label+'</button>').join('') +
    '</nav>';
  const mobileExpBarHtml = '<nav class="mobile-exp-bar" aria-label="Switch experience">' +
    expTabs.map(t => '<button type="button" class="exp-pill'+(activeExp===t.id?' active':'')+'" data-action="experience" data-id="'+t.id+'"'+(activeExp===t.id?' aria-current="page"':'')+'>'+t.label+'</button>').join('') +
    '</nav>';
  const userInitials = state.user?.name ? state.user.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() : 'GG';
  const accountBtn = state.signedIn
    ? '<button type="button" class="avatar-button" aria-label="My account" data-action="account">'+esc(userInitials)+'</button>'
    : '<button type="button" class="avatar-button" aria-label="Sign in" title="Sign in" data-action="account">'+icon('user',16)+'</button>';
  const activeKey = getActiveSubnavKey();
  const navBtn = (act, label, key, extraAttrs='') => '<button type="button" data-action="'+act+'" data-nav-key="'+key+'" class="'+(activeKey===key?'active':'')+'"'+(activeKey===key?' aria-current="page"':'')+(extraAttrs?' '+extraAttrs:'')+'>'+label+'</button>';
  const subnavHtml = state.view === 'landing'
    ? '<nav class="subnav" aria-label="Section navigation"><div class="subnav-links">' +
        (activeExp==='home'
          ? navBtn('landing','Overview','landing')+navBtn('scroll','Categories','categories','data-target="categories"')+navBtn('scroll','Services','popular','data-target="popular"')+navBtn('scroll','Professionals','professionals','data-target="professionals"')+navBtn('scroll','How it works','how','data-target="how"')
          : activeExp==='salon'
            ? navBtn('landing','Discover','landing')+navBtn('scroll','Categories','salon-categories','data-target="salon-categories"')+navBtn('scroll','Salons','salons','data-target="salons"')+navBtn('account-bookings','My bookings','account-bookings')
            : navBtn('shop-all','All products','landing')+navBtn('scroll','Categories','shop-categories','data-target="shop-categories"')+navBtn('scroll','Shelf','bestsellers','data-target="bestsellers"')) +
      '</div></nav>'
    : '';
  const cartCount = countCart();
  const wishCount = state.wishlist.length;
  const mobileDrawerHtml = state.mobileMenu
    ? '<div class="mobile-menu-backdrop" data-action="mobile-close"></div>' +
      '<div id="mobile-menu-drawer" class="mobile-menu" role="dialog" aria-modal="true" aria-label="Navigation menu">' +
        '<div class="mobile-menu-head"><span>MENU</span><button type="button" class="mobile-menu-close" data-action="mobile-close" aria-label="Close menu">'+icon('close',20)+'</button></div>' +
        '<div class="mobile-menu-group"><span class="mobile-menu-label">EXPERIENCES</span>' +
          expTabs.map(t => '<button type="button" class="mobile-menu-item'+(activeExp===t.id?' active':'')+'" data-action="experience" data-id="'+t.id+'">'+icon(t.id==='home'?'home':t.id==='salon'?'salon':'bag',18)+'<span>'+t.full+'</span>'+(activeExp===t.id?icon('check',16):icon('arrow',16))+'</button>').join('') +
        '</div>' +
        '<div class="mobile-menu-group"><span class="mobile-menu-label">YOUR GLAMGO</span>' +
          '<button type="button" class="mobile-menu-item" data-action="location">'+icon('pin',18)+'<span>'+esc(state.location)+'</span>'+icon('arrow',16)+'</button>' +
          '<button type="button" class="mobile-menu-item" data-action="account">'+icon('user',18)+'<span>'+(state.signedIn?'My account':'Sign in / Create account')+'</span>'+icon('arrow',16)+'</button>' +
          '<button type="button" class="mobile-menu-item" data-action="wishlist">'+icon('heart',18)+'<span>Wishlist'+(wishCount?' ('+wishCount+')':'')+'</span>'+icon('arrow',16)+'</button>' +
          '<button type="button" class="mobile-menu-item" data-action="notifications">'+icon('bell',18)+'<span>Notifications'+(state.notifications.length?' ('+state.notifications.length+')':'')+'</span>'+icon('arrow',16)+'</button>' +
          '<button type="button" class="mobile-menu-item" data-action="account-bookings">'+icon('calendar',18)+'<span>My bookings</span>'+icon('arrow',16)+'</button>' +
          '<button type="button" class="mobile-menu-item" data-action="orders">'+icon('bag',18)+'<span>My orders</span>'+icon('arrow',16)+'</button>' +
        '</div>' +
        '<div class="mobile-menu-group"><span class="mobile-menu-label">PARTNERS</span>' +
          '<button type="button" class="mobile-menu-item" data-action="partners">'+icon('spark',18)+'<span>Salon &amp; Partner Portal</span>'+icon('arrow',16)+'</button>' +
          (state.user?.role==='admin'?'<button type="button" class="mobile-menu-item" data-action="admin">'+icon('shield',18)+'<span>Command Centre</span>'+icon('arrow',16)+'</button>':'') +
        '</div>' +
      '</div>'
    : '';
  return '<div class="site-shell"><header class="header">' +
    '<a class="wordmark" href="/" data-action="public-home" aria-label="GLAMGO Home"><img src="./assets/glamgo-logo.png" alt="GLAMGO" class="brand-logo-img"></a>' +
    expSwitcherHtml +
    '<div class="header-location"><button type="button" class="header-location-btn" data-action="location" aria-label="Change location: '+esc(state.location)+'">'+icon('pin',16)+'<span class="header-location-text">'+esc(state.location)+'</span>'+icon('chevron',14)+'</button></div>' +
    '<button type="button" class="header-search" data-action="search-open" aria-label="Search services, salons and products">'+icon('search',17)+'<span>Search GlamGo</span><kbd>⌘K</kbd></button>' +
    '<div class="header-actions">' +
      '<button type="button" class="icon-button mobile-search-icon" aria-label="Search" data-action="search-open">'+icon('search',20)+'</button>' +
      '<button type="button" class="icon-button wishlist-btn" aria-label="Wishlist'+(wishCount?' ('+wishCount+' saved)':'')+'" data-action="wishlist">'+icon('heart',20)+(wishCount?'<i></i>':'')+'</button>' +
      '<button type="button" class="icon-button notify-button" aria-label="Notifications'+(state.notifications.length?' ('+state.notifications.length+')':'')+'" data-action="notifications">'+icon('bell',20)+(state.notifications.length?'<i></i>':'')+'</button>' +
      '<button type="button" class="icon-button cart-btn" aria-label="Shopping bag'+(cartCount?' ('+cartCount+' items)':'')+'" data-action="cart">'+icon('bag',20)+(cartCount?'<b>'+cartCount+'</b>':'')+'</button>' +
      (state.user?.role==='admin'?'<button type="button" class="btn btn-outline btn-sm portal-btn admin-portal-btn" data-action="admin">Command Centre</button>':'') +
      '<button type="button" class="portal-link" data-action="partners">Partner portal</button>' +
      accountBtn +
    '</div>' +
    '<button type="button" id="mobile-menu-trigger" class="mobile-menu-button" data-action="mobile-toggle" aria-label="'+(state.mobileMenu?'Close menu':'Open menu')+'" aria-expanded="'+state.mobileMenu+'" aria-controls="mobile-menu-drawer">'+icon(state.mobileMenu?'close':'menu',22)+'</button>' +
  '</header>' +
  mobileExpBarHtml +
  subnavHtml +
  mobileDrawerHtml +
  '</div>';
}

function footer(){
  return '<footer class="footer"><div class="footer-grid"><div><a class="wordmark" href="/" data-action="public-home"><img src="./assets/glamgo-logo-light.png" alt="GLAMGO" class="brand-logo-img"></a><p>Beauty made personal, wherever you are.</p></div><div><h4>Explore</h4>'+experiences.map(x=>'<button type="button" data-action="experience" data-id="'+x.id+'">'+x.eyebrow.split('/ ')[1]+'</button>').join('')+'</div><div><h4>Your account</h4><button type="button" data-action="account">My profile</button><button type="button" data-action="account-bookings">My bookings</button><button type="button" data-action="orders">My orders</button><button type="button" data-action="wishlist">Wishlist</button></div><div><h4>GlamGo</h4><button type="button" data-action="partners">Partner with us</button>'+(state.user?.role==='admin'?'<button type="button" data-action="admin">Command Centre</button>':'')+'<button type="button" data-action="support">Customer support</button><button type="button" data-action="notifications">Notifications</button></div></div><div class="footer-bottom"><span>© '+new Date().getFullYear()+' GlamGo.</span></div></footer>';
}

function mobileNav(){
  const cartCount = countCart();
  const wishCount = state.wishlist.length;
  return '<nav class="mobile-bottom" aria-label="Mobile navigation">' +
    '<button type="button" data-action="landing" class="'+(state.view==='landing'?'active':'')+'">'+icon('home',20)+'<span>Explore</span></button>' +
    '<button type="button" data-action="search-open" class="'+(state.modal==='search'?'active':'')+'">'+icon('search',20)+'<span>Search</span></button>' +
    '<button type="button" data-action="wishlist" class="'+(state.view==='account'&&state.accountTab==='Wishlist'?'active':'')+'">'+icon('heart',20)+(wishCount?'<i></i>':'')+'<span>Wishlist</span></button>' +
    '<button type="button" data-action="cart" class="'+(state.view==='cart'||state.view==='checkout'?'active':'')+'">'+icon('bag',20)+(cartCount?'<b>'+cartCount+'</b>':'')+'<span>Bag</span></button>' +
    '<button type="button" data-action="account" class="'+(state.view==='account'&&state.accountTab!=='Wishlist'?'active':'')+'">'+icon('user',20)+'<span>Account</span></button>' +
  '</nav>';
}

function homeCard(s){
  const proName = s.professional_name || s.professional || s.pro_name || '';
  const priceLabel = s.starting_price != null && Number(s.starting_price) > 0
    ? 'From ' + money(s.starting_price)
    : money(s.price);
  return '<article class="service-card">' +
    '<button type="button" class="listing-image-button" data-action="service-detail" data-id="'+esc(s.id)+'" aria-label="View '+esc(s.name)+'">'+image(s.img,s.name,'card-img')+'</button>' +
    '<button type="button" class="wishlist-on-card '+(state.wishlist.includes(s.id)?'saved':'')+'" data-action="wish" data-id="'+esc(s.id)+'" aria-pressed="'+state.wishlist.includes(s.id)+'" aria-label="Save '+esc(s.name)+'">'+icon('heart',18)+'</button>' +
    '<div class="card-body">' +
      '<span class="card-kicker">'+esc(s.category)+'</span>' + audienceBadge(s) +
      '<h3>'+esc(s.name)+'</h3>' +
      '<div class="card-meta">'+icon('clock',14)+'<span>'+esc(s.duration)+'</span></div>' +
      (proName ? '<div class="card-pro">With '+esc(proName)+'</div>' : '') +
      '<div class="card-bottom"><strong>'+priceLabel+'</strong><button type="button" data-action="service-detail" data-id="'+esc(s.id)+'">View service '+icon('arrow',16)+'</button></div>' +
    '</div></article>';
}
function serviceDetail(){
  const s = services.find(x => String(x.id) === String(state.selectedService));
  if (!s) return '<main class="detail-page">'+backButton('landing','Back to services')+(state.catalogFeedsLoading.services?catalogLoadingState('service details'):state.catalogErrors.services?catalogUnavailableState('Service details'):empty('spark','Service unavailable','This service is no longer listed.'))+'</main>';
  const proName = s.professional_name || s.professional || s.pro_name || '';
  return '<main class="detail-page">'+backButton('landing','Back to services') +
    '<div class="service-detail">' +
      '<div class="service-detail-image">'+image(s.img,s.name)+'</div>' +
      '<div class="service-detail-copy">' +
        '<p class="eyebrow">AT-HOME BEAUTY · '+esc(s.category)+'</p>' +
        '<h1>'+esc(s.name)+'</h1>' +
        (s.desc ? '<p class="service-detail-intro">'+esc(s.desc)+'</p>' : '') +
        '<div class="service-detail-facts">' +
          '<div><span>Price</span><strong>'+money(s.price)+'</strong></div>' +
          '<div><span>Duration</span><strong>'+esc(s.duration)+'</strong></div>' +
          (proName ? '<div><span>Specialist</span><strong>'+esc(proName)+'</strong></div>' : '<div><span>Location</span><strong>At your home</strong></div>') +
        '</div>' +
        '<p class="service-detail-note">Choose a specialist, date, and preferred time in booking. Preferred times are subject to availability.</p>' +
        '<div class="service-detail-actions">' +
          button('Book this service '+icon('arrow',17),'book-home','btn-primary','data-id="'+esc(s.id)+'"') +
          '<button type="button" class="btn btn-outline" data-action="wish" data-id="'+esc(s.id)+'" aria-pressed="'+state.wishlist.includes(s.id)+'">'+icon('heart',17)+' '+(state.wishlist.includes(s.id)?'Saved':'Save service')+'</button>' +
        '</div>' +
      '</div>' +
    '</div>' +
    listingReviewSection('service',s.id) +
  '</main>';
}

function professionalCard(p){
  const hasPrice = p.price != null && Number(p.price) > 0;
  return '<article class="pro-card">' +
    '<div class="pro-top">'+image(p.img,p.name,'pro-avatar')+'<div><h3>'+esc(p.name)+'</h3><span>'+esc(p.specialty)+'</span></div></div>' +
    audienceBadge(p) + (p.experience ? '<p>'+esc(p.experience)+'</p>' : '') +
    (hasPrice ? '<div class="pro-bottom"><span>From '+money(p.price)+'</span></div>' : '') +
    '<button type="button" class="pro-book" data-action="book-pro" data-id="'+p.id+'">Book with specialist '+icon('arrow',16)+'</button>' +
  '</article>';
}

const buildActiveFiltersForExp = (exp, f, visibleCollections = []) => {
  const list = [];
  if (exp === 'shop' && f.collection && f.collection !== 'All') {
    const colObj = visibleCollections.find(c => c.id === f.collection);
    list.push({ key: 'collection', label: (colObj ? colObj.label : f.collection), extra: 'data-exp="shop" data-key="collection"' });
  }
  if (f.category && f.category !== 'All') {
    const label = exp === 'shop' ? shopCategoryLabel(f.category) : f.category;
    list.push({ key: 'category', label, extra: 'data-exp="' + exp + '" data-key="category"' });
  }
  if (exp === 'shop' && f.brand && f.brand !== 'All') {
    list.push({ key: 'brand', label: f.brand, extra: 'data-exp="shop" data-key="brand"' });
  }
  if (exp === 'shop' && f.availability && f.availability !== 'all') {
    list.push({ key: 'availability', label: f.availability === 'in_stock' ? 'In stock' : 'Out of stock', extra: 'data-exp="shop" data-key="availability"' });
  }
  if (exp === 'salon' && f.distance && f.distance !== 'all') {
    const distMap = { '3': 'Within 3 km', '5': 'Within 5 km', nearest: 'Within 8 km', '10': 'Within 10 km', '15': 'Within 15 km' };
    list.push({ key: 'distance', label: distMap[f.distance] || ('Within ' + f.distance + ' km'), extra: 'data-exp="salon" data-key="distance"' });
  }
  if ((f.minPrice !== '' && f.minPrice != null) || (f.maxPrice !== '' && f.maxPrice != null)) {
    const minStr = f.minPrice !== '' && f.minPrice != null ? '₹' + esc(f.minPrice) : '₹0';
    const maxStr = f.maxPrice !== '' && f.maxPrice != null ? '₹' + esc(f.maxPrice) : 'Any';
    list.push({ key: 'price', label: minStr + ' – ' + maxStr, extra: 'data-exp="' + exp + '" data-key="price"' });
  }
  const defaultSort = exp === 'salon' ? 'distance-asc' : 'featured';
  if (f.sort && f.sort !== defaultSort) {
    list.push({ key: 'sort', label: SORT_LABELS[f.sort] || 'Sorted', extra: 'data-exp="' + exp + '" data-key="sort"' });
  }
  return list;
};

const renderFilterFieldsHtml = (exp, f, opts = {}, isDraft = false) => {
  const mode = isDraft ? 'draft' : 'live';
  const categories = opts.categories || [];
  const prefix = isDraft ? 'drawer-' + exp : 'panel-' + exp;
  const sortList = exp === 'salon' ? SALON_SORT_OPTIONS : SORT_OPTIONS;
  const sortHtml = '<details class="filter-group" open><summary>Sort by ' + icon('chevron', 14) + '</summary><div class="filter-list">' +
    sortList.map(([val, lbl]) => {
      const checked = f.sort === val || (val === 'price-asc' && f.sort === 'price');
      return '<label class="filter-radio-row"><input type="radio" name="' + prefix + '-sort" value="' + val + '" data-filter-exp="' + exp + '" data-filter-mode="' + mode + '" data-filter-field="sort"' + (checked ? ' checked' : '') + '><span>' + lbl + '</span></label>';
    }).join('') +
  '</div></details>';

  const categoryHtml = categories.length ? '<details class="filter-group" open><summary>Category ' + icon('chevron', 14) + '</summary><div class="filter-list">' +
    categories.map(c => {
      const lbl = exp === 'shop' ? shopCategoryLabel(c) : c;
      const checked = f.category === c;
      return '<label class="filter-radio-row"><input type="radio" name="' + prefix + '-category" value="' + esc(c) + '" data-filter-exp="' + exp + '" data-filter-mode="' + mode + '" data-filter-field="category"' + (checked ? ' checked' : '') + '><span>' + esc(lbl) + '</span></label>';
    }).join('') +
  '</div></details>' : '';

  const availabilityHtml = exp === 'shop' ? '<details class="filter-group" open><summary>Availability ' + icon('chevron', 14) + '</summary><div class="filter-list">' +
    [['in_stock', 'In stock'], ['out_of_stock', 'Out of stock']].map(([val, lbl]) => {
      const checked = f.availability === val;
      return '<label class="filter-check-row"><input type="checkbox" value="' + val + '" data-filter-exp="shop" data-filter-mode="' + mode + '" data-filter-field="availability"' + (checked ? ' checked' : '') + '><span>' + lbl + '</span></label>';
    }).join('') +
  '</div></details>' : '';

  const visibleCols = opts.collections || [];
  const collectionHtml = exp === 'shop' && visibleCols.length > 1 ? '<details class="filter-group" open><summary>Collection ' + icon('chevron', 14) + '</summary><div class="filter-list">' +
    visibleCols.map(col => '<label class="filter-radio-row"><input type="radio" name="' + prefix + '-collection" value="' + esc(col.id) + '" data-filter-exp="shop" data-filter-mode="' + mode + '" data-filter-field="collection"' + (f.collection === col.id ? ' checked' : '') + '><span>' + esc(col.label) + '</span></label>').join('') +
  '</div></details>' : '';

  const brands = opts.brands || [];
  const brandHtml = exp === 'shop' && brands.length > 2 ? '<details class="filter-group" open><summary>Brand ' + icon('chevron', 14) + '</summary><div class="filter-list">' +
    brands.map(b => '<label class="filter-radio-row"><input type="radio" name="' + prefix + '-brand" value="' + esc(b) + '" data-filter-exp="shop" data-filter-mode="' + mode + '" data-filter-field="brand"' + (f.brand === b ? ' checked' : '') + '><span>' + esc(b === 'All' ? 'All brands' : b) + '</span></label>').join('') +
  '</div></details>' : '';

  const distanceHtml = exp === 'salon' ? '<details class="filter-group" open><summary>Location &amp; distance ' + icon('chevron', 14) + '</summary>' +
    '<div class="filter-location-box">' +
      '<span class="filter-location-current">' + icon('pin', 13) + ' ' + esc(state.location) + '</span>' +
      '<div class="filter-location-actions">' +
        '<button type="button" class="btn btn-outline btn-sm" data-action="live-location">Use live location</button>' +
        '<button type="button" class="btn btn-outline btn-sm" data-action="location">Change city</button>' +
      '</div>' +
    '</div>' +
    (opts.hasDistances ? '<div class="filter-list">' +
      [['all', 'All in ' + currentLocationCity()], ['3', 'Within 3 km'], ['5', 'Within 5 km'], ['nearest', 'Within 8 km'], ['15', 'Within 15 km']].map(([val, lbl]) =>
        '<label class="filter-radio-row"><input type="radio" name="' + prefix + '-distance" value="' + val + '" data-filter-exp="salon" data-filter-mode="' + mode + '" data-filter-field="distance"' + ((f.distance || 'all') === val ? ' checked' : '') + '><span>' + esc(lbl) + '</span></label>'
      ).join('') +
    '</div>' : '') +
  '</details>' : '';

  const priceHtml = '<details class="filter-group" open><summary>Price ' + icon('chevron', 14) + '</summary>' +
    '<div class="price-range-inputs">' +
      '<label class="price-input-box"><span>From</span><div class="price-field"><i>₹</i><input id="' + prefix + '-min-price" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" placeholder="0" value="' + esc(f.minPrice ?? '') + '" data-filter-exp="' + exp + '" data-filter-mode="' + mode + '" data-filter-field="minPrice" aria-label="Minimum price"></div></label>' +
      '<label class="price-input-box"><span>To</span><div class="price-field"><i>₹</i><input id="' + prefix + '-max-price" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" placeholder="Max" value="' + esc(f.maxPrice ?? '') + '" data-filter-exp="' + exp + '" data-filter-mode="' + mode + '" data-filter-field="maxPrice" aria-label="Maximum price"></div></label>' +
    '</div>' +
  '</details>';

  return sortHtml + distanceHtml + availabilityHtml + priceHtml + categoryHtml + collectionHtml + brandHtml;
};

const renderFilterShelfSection = (exp, liveFilters, activeFilters, opts, countText, resultsHtml) => {
  const desktopOpen = Boolean(state.filterOpen?.[exp]);
  const drawerOpen = Boolean(state.filterDrawerOpen && state.filterDrawerDraft?.exp === exp);
  const triggerExpanded = desktopOpen || drawerOpen;
  const triggerLabel = desktopOpen ? 'Hide filters' : 'Show filters';
  const controlsHtml = '<div class="collection-controls-bar">' +
    '<div class="collection-controls-left">' +
      '<button type="button" id="exp-filter-trigger" class="filter-toggle-pill" data-action="exp-filter-toggle" data-exp="' + exp + '" aria-expanded="' + triggerExpanded + '" aria-controls="exp-filter-panel-' + exp + '">' +
        icon('filter', 16) +
        '<span>' + triggerLabel + '</span>' +
        (activeFilters.length ? '<span class="filter-badge">' + activeFilters.length + '</span>' : '') +
      '</button>' +
      (exp === 'shop' ? '<button type="button" class="shop-mobile-search-btn" data-action="search-open" aria-label="Search beauty store">' + icon('search', 16) + '<span>Search products</span></button>' : '') +
    '</div>' +
    (countText ? '<span class="shelf-count">' + countText + '</span>' : '') +
  '</div>';

  const activeChipsHtml = activeFilters.length
    ? '<div class="shop-shelf-meta"><div class="active-filters">' +
        activeFilters.map(item => '<button type="button" class="active-filter-chip" data-action="exp-clear-filter" ' + item.extra + ' aria-label="Remove ' + esc(item.label) + ' filter">' + esc(item.label) + ' ' + icon('close', 13) + '</button>').join('') +
        '<button type="button" class="reset-filters-link" data-action="exp-reset-all" data-exp="' + exp + '">Clear all</button>' +
      '</div></div>'
    : '';

  const sidebarHtml = desktopOpen
    ? '<aside id="exp-filter-panel-' + exp + '" class="filter-sidebar" aria-label="Filter and sort options">' +
        renderFilterFieldsHtml(exp, liveFilters, opts, false) +
        (activeFilters.length ? '<button type="button" class="btn btn-outline btn-sm full filter-sidebar-clear" data-action="exp-reset-all" data-exp="' + exp + '">Clear all filters</button>' : '') +
      '</aside>'
    : '';

  let drawerHtml = '';
  if (drawerOpen) {
    const draft = state.filterDrawerDraft || liveFilters;
    const draftMatches = opts.countDraftMatches ? opts.countDraftMatches(draft) : null;
    drawerHtml = '<div class="filter-drawer-backdrop" data-action="exp-filter-drawer-close"></div>' +
      '<div id="exp-filter-drawer" class="filter-drawer" role="dialog" aria-modal="true" aria-labelledby="filter-drawer-title">' +
        '<div class="filter-drawer-head">' +
          '<h3 id="filter-drawer-title">Filter &amp; sort</h3>' +
          '<button type="button" class="filter-drawer-close" data-action="exp-filter-drawer-close" aria-label="Close filters">' + icon('close', 20) + '</button>' +
        '</div>' +
        '<div class="filter-drawer-body">' + renderFilterFieldsHtml(exp, draft, opts, true) + '</div>' +
        '<div class="filter-drawer-footer">' +
          '<button type="button" class="btn btn-outline" data-action="exp-filter-drawer-reset" data-exp="' + exp + '">Reset</button>' +
          '<button type="button" class="btn btn-primary" data-action="exp-filter-drawer-apply" data-exp="' + exp + '">Apply' + (draftMatches !== null ? ' (' + draftMatches + ')' : '') + '</button>' +
        '</div>' +
      '</div>';
  }

  return controlsHtml + activeChipsHtml +
    '<div class="collection-layout' + (desktopOpen ? ' with-filters' : '') + '">' +
      sidebarHtml +
      '<div class="collection-results">' + resultsHtml + '</div>' +
    '</div>' +
    drawerHtml;
};

const isMenExperience = () => state.audience === 'men';
const audienceSwitcher = () => '<section class="audience-section" aria-label="Browse by preference">' +
  '<div class="audience-section-inner">' +
  '<div class="audience-switcher" role="group" aria-label="Choose browsing preference">' +
  ['women', 'men'].map(value => '<button type="button" class="audience-choice' + ((isMenExperience() ? 'men' : 'women') === value ? ' active' : '') + '" data-action="audience-set" data-id="' + value + '" aria-pressed="' + ((isMenExperience() ? 'men' : 'women') === value) + '">' +
    icon(value === 'men' ? 'male' : 'female', 16, 'audience-icon') +
    '<span>' + (value === 'men' ? 'Men' : 'Women') + '</span>' +
  '</button>').join('') +
  '</div></div></section>';
const matchesAudience = item => {
  const audience = (!item?.audience || item.audience === 'unspecified') ? 'unisex' : item.audience;
  return audience === state.audience || audience === 'unisex';
};
const audienceBadge = item => item?.audience === 'unisex' ? '<span class="audience-badge">Unisex</span>' : '';
const isVisibleInAudience = item => matchesAudience(item);
const generalCatalogueNote = () => '<div class="audience-catalogue-note">' + (isMenExperience() ? 'Showing Men and unisex listings.' : 'Showing Women and unisex listings.') + '</div>';


function homePage(){
  const isMen = isMenExperience();
  const userCity = currentLocationCity();
  const cityServices = services.filter(s => isServiceAvailableInCity(s, userCity) && isVisibleInAudience(s));
  const homeFilters = getFiltersForExp('home');
  const filtered = getFilteredHomeServices(cityServices, homeFilters);
  const activeFilters = buildActiveFiltersForExp('home', homeFilters);
  const isBengaluru = userCity.toLowerCase() === 'bengaluru';
  const switchBengaluruBtn = button('Switch to Bengaluru ' + icon('arrow', 16), 'location-set', 'btn-primary', 'data-id="Indiranagar, Bengaluru"');
  const bengaluruNoticeHtml = !isBengaluru
    ? '<div class="city-availability-banner" role="status">' +
        '<div><strong>At-home services are currently available in Bengaluru only.</strong><span>You are browsing '+esc(userCity)+'. Switch to Bengaluru to book verified at-home treatments.</span></div>' +
        switchBengaluruBtn +
      '</div>'
    : '';
  const servicesResultsHtml = !services.length && state.catalogFeedsLoading.services
    ? catalogLoadingState('home treatments')
    : !services.length && state.catalogErrors.services
      ? catalogUnavailableState('Home treatments catalog')
      : filtered.length
        ? '<div class="card-grid">'+filtered.map(homeCard).join('')+'</div>'
        : empty(
            'spark',
            isBengaluru ? 'No home services match in Bengaluru' : 'At-home services are only available in Bengaluru',
            isBengaluru ? 'Clear your active filters to see all Bengaluru treatments.' : 'Currently our at-home beauty services operate in Bengaluru. Switch your location in one click to explore.',
            activeFilters.length ? button('Clear all filters','exp-reset-all','btn-outline','data-exp="home"') : switchBengaluruBtn
          );
  const countText = cityServices.length ? 'Showing <strong>'+filtered.length+'</strong> of '+cityServices.length+(cityServices.length===1?' service':' services') : '';
  const servicesSection = bengaluruNoticeHtml + renderFilterShelfSection('home', homeFilters, activeFilters, {
    categories: homeCategories,
    countDraftMatches: draft => getFilteredHomeServices(cityServices, draft).length
  }, countText, servicesResultsHtml);
  const cityPros = professionals.filter(p => isProAvailableInCity(p, userCity) && isVisibleInAudience(p));
  const prosSection = !professionals.length && state.catalogFeedsLoading.professionals
    ? catalogLoadingState('specialists')
    : !professionals.length && state.catalogErrors.professionals
      ? catalogUnavailableState('Professionals directory')
      : cityPros.length
        ? '<div class="pro-grid">'+cityPros.map(professionalCard).join('')+'</div>'
        : empty('user','Specialists are available in Bengaluru','No specialists are listed in '+esc(userCity)+' yet. Switch to Bengaluru in one click.', !isBengaluru ? switchBengaluruBtn : '');
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
  return '<main>' +
    '<section class="home-hero">' +
      '<div class="hero-copy">' +
        '<p class="eyebrow line-eyebrow">'+(isMen?'AT-HOME GROOMING':'AT-HOME BEAUTY')+'</p>' +
        '<h1>'+(isMen?'Professional grooming, <em>at your doorstep.</em>':'Professional beauty care, <em>at your doorstep.</em>')+'</h1>' +
        '<p>'+(isMen?'Discover independent professionals offering care and wellness services at home in ':'Book independent beauty professionals for skin, hair, nails, and spa care in ')+esc(userCity)+'.</p>' +
        '<div class="hero-buttons">'+button('Explore services '+icon('arrow',18),'scroll','btn-primary','data-target="popular"')+'</div>' +
      '</div>' +
      '<div class="hero-visual">'+image(isMen ? MEN_HOME_IMG : HOME_IMG, isMen ? 'A customer receiving a facial at home' : 'A professional beautician providing a facial treatment')+'</div>' +
    '</section>' +
    '<section class="discovery-bar" aria-label="Location and search">' +
      '<button type="button" class="discovery-cell" data-action="location">'+icon('pin',18)+'<div><small>LOCATION</small><strong>'+esc(state.location)+'</strong></div></button>' +
      '<button type="button" class="discovery-cell discovery-search" data-action="search-open">'+icon('search',18)+'<div><small>SEARCH</small><strong>Search services, categories or specialists</strong></div>'+icon('arrow',16)+'</button>' +
    '</section>' +
    audienceSwitcher() +
    '<section class="section" id="categories">' +
      sectionHead('CATEGORIES','Browse by treatment.') +
      '<div class="category-grid home-categories">'+(isMen ? ['Hair','Skin','Spa','Packages',...(cityServices.some(s=>s.category==='Beard')?['Beard']:[])] : homeCategories.slice(1).filter(c=>c!=='Beard')).map((c,i)=>'<button type="button" data-action="home-category" data-id="'+c+'" class="category-tile'+(state.homeCategory===c?' active':'')+'"><div class="category-art cat-'+i+'">'+image(isMen ? MEN_CATEGORY_IMAGES[c] : homeCategoryImages[c],c+' services')+'</div><span>'+c+'</span></button>').join('')+'</div>' +
    '</section>' +
    '<section class="section soft-section" id="popular">' +
      sectionHead('HOME SERVICES','Services in '+esc(userCity)+'.') +
      generalCatalogueNote() + servicesSection +
    '</section>' +
    '<section class="section" id="professionals">' +
      sectionHead('SPECIALISTS','Professionals in '+esc(userCity)+'.') +
      prosSection +
    '</section>' +
    '<section class="how-section" id="how">' +
      '<div class="how-heading"><p class="eyebrow">HOW IT WORKS</p><h2>Simple from booking to care.</h2></div>' +
      '<div class="steps">'+[['01','spark','Choose a service','Pick the treatment and review clear pricing and duration.'],['02','user','Pick a specialist','Select a listed professional or any available expert.'],['03','calendar','Request your time','Choose a date and preferred slot subject to availability.'],['04','check','Confirm &amp; welcome','Complete payment to confirm your appointment.']].map((x,idx)=>'<div class="step" style="--step-i:'+idx+'"><div class="step-head"><span class="step-icon">'+icon(x[1],20)+'</span><span class="step-num">'+x[0]+'</span></div><h3>'+x[2]+'</h3><p>'+x[3]+'</p></div>').join('')+'</div>' +
    '</section>' +
  '</main>';
}

function salonCard(s){
  const distText = s.distanceLabel || '';
  const hasPrice = s.price != null && Number(s.price) > 0;
  const serviceTags = Array.isArray(s.services) ? s.services.slice(0, 4) : [];
  const extraCount = Array.isArray(s.services) && s.services.length > 4 ? s.services.length - 4 : 0;
  return '<article class="salon-card">' +
    '<button type="button" class="listing-image-button salon-image" data-action="salon-detail" data-id="'+esc(s.id)+'" aria-label="View '+esc(s.name)+'">'+image(s.img,s.name+' salon','card-img')+'</button>' +
    '<div class="salon-body">' +
      '<div class="salon-title"><h3>'+esc(s.name)+'</h3></div>' + audienceBadge(s) +
      '<p class="salon-location">'+icon('pin',15)+'<span>'+esc(s.area)+'</span>'+(distText?'<strong class="salon-km-pill">'+esc(distText)+'</strong>':'')+'</p>' +
      (serviceTags.length ? '<div class="salon-services">'+serviceTags.map(x=>'<span>'+esc(x)+'</span>').join('')+(extraCount?'<span>+'+extraCount+'</span>':'')+'</div>' : '') +
      '<div class="card-bottom">'+(hasPrice?'<strong>From '+money(s.price)+'</strong>':'<span></span>')+'<button type="button" data-action="salon-detail" data-id="'+esc(s.id)+'">View salon '+icon('arrow',16)+'</button></div>' +
    '</div></article>';
}

function salonPage(){
  const isMen = isMenExperience();
  const userCity = currentLocationCity();
  const citySalons = salons
    .filter(s => String(s.city || normalizeCity(s.area) || '').toLowerCase() === userCity.toLowerCase() && isVisibleInAudience(s))
    .map(enrichSalonWithDistance);
  const salonFilters = getFiltersForExp('salon');
  const list = getFilteredSalons(citySalons, salonFilters);
  const nearbyCount = citySalons.filter(s => s.isFar === false).length;
  const hasDistances = citySalons.some(s => s.distanceKm != null);
  const activeFilters = buildActiveFiltersForExp('salon', salonFilters);
  const salonsResultsHtml = !salons.length && state.catalogFeedsLoading.salons
    ? catalogLoadingState('salons near you')
    : !salons.length && state.catalogErrors.salons
      ? catalogUnavailableState('Salons directory')
      : '<div class="salon-grid">'+list.map(salonCard).join('')+'</div>'+(list.length?'':empty('search',citySalons.length?'No salons match these filters':'No matching salons are listed in '+esc(userCity)+' yet',citySalons.length?'Try clearing a filter to see more salons.':'Switch to Bengaluru in one click or choose another city.', activeFilters.length ? button('Clear all filters','exp-reset-all','btn-outline','data-exp="salon"') : (userCity.toLowerCase()!=='bengaluru'?button('Switch to Bengaluru '+icon('arrow',16),'location-set','btn-primary','data-id="Indiranagar, Bengaluru"'):'')));
  const countText = citySalons.length
    ? 'Showing <strong>'+list.length+'</strong> of '+citySalons.length+(citySalons.length===1?' salon':' salons')+' in '+esc(userCity)+(hasDistances?' · '+nearbyCount+' within 8 km':'')
    : '';
  const salonsSection = renderFilterShelfSection('salon', salonFilters, activeFilters, {
    categories: salonCategories,
    hasDistances,
    countDraftMatches: draft => getFilteredSalons(citySalons, draft).length
  }, countText, salonsResultsHtml);
  return '<main>' +
    '<section class="salon-hero">' +
      '<div class="salon-hero-image">'+image(isMen ? MEN_SALON_IMG : SALON_IMG, isMen ? 'A contemporary grooming studio' : 'Contemporary salon interior')+'</div>' +
      '<div class="salon-hero-copy">' +
        '<p class="eyebrow line-eyebrow">SALONS &amp; PARLOURS</p>' +
        '<h1>'+(isMen?'Find a salon in <em>'+esc(userCity)+'.</em>':'Discover salons in <em>'+esc(userCity)+'.</em>')+'</h1>' +
        '<p>'+(isMen?'Explore independent salons and grooming studios in '+esc(userCity)+', compare services and book a visit.':'Browse independent salons by category and location, then request an appointment.')+'</p>' +
        button('Explore salons '+icon('arrow',18),'scroll','btn-primary','data-target="salons"') +
      '</div>' +
    '</section>' +
    '<section class="discovery-bar discovery-bar-salons" aria-label="Salon location and search">' +
      '<button type="button" class="discovery-cell" data-action="location">'+icon('pin',18)+'<div><small>LOCATION</small><strong>'+esc(state.location)+'</strong></div></button>' +
      '<button type="button" class="discovery-cell discovery-search" data-action="search-open">'+icon('search',18)+'<div><small>SEARCH</small><strong>Search salon name or service</strong></div>'+icon('arrow',16)+'</button>' +
    '</section>' +
    audienceSwitcher() +
    '<section class="section" id="salon-categories">' +
      sectionHead('CATEGORIES','Browse by service.') +
      '<div class="salon-category-grid">'+(isMen ? ['Hair','Skin','Spa',...(citySalons.some(s=>s.services?.includes('Beard'))?['Beard']:[])] : salonCategories.slice(1).filter(c=>c!=='Beard')).map((c,i)=>'<button type="button" data-action="salon-category" data-id="'+c+'" class="salon-category-card'+(state.salonCategory===c?' active':'')+'">'+image(isMen ? MEN_CATEGORY_IMAGES[c] : [images.hair,images.facial,images.nails,images.makeup,images.spa][i],c+' services')+'<span>'+c+' '+icon('arrow',17)+'</span></button>').join('')+'</div>' +
    '</section>' +
    '<section class="section soft-section" id="salons">' +
      sectionHead('DISCOVER SALONS','Salons in '+esc(userCity)+'.') +
      generalCatalogueNote() + salonsSection +
    '</section>' +
  '</main>';
}

const backButton = (act, label = 'Go back') => '<button type="button" class="back-link" data-action="'+act+'" aria-label="'+esc(label)+'" title="'+esc(label)+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg></button>';
function salonDetail(){
  const rawSalon = salons.find(x => String(x.id) === String(state.selectedSalon));
  if (!rawSalon) return '<main class="detail-page">'+backButton('landing','Back to salons')+(state.catalogFeedsLoading.salons?catalogLoadingState('salon details'):state.catalogErrors.salons?catalogUnavailableState('Salon details'):empty('salon','Salon unavailable','This salon is no longer listed.'))+'</main>';
  const s = enrichSalonWithDistance(rawSalon);
  const staff = Array.isArray(s.staff) ? s.staff : [];
  const categories = Array.isArray(s.services) ? s.services : [];
  const menuServices = Array.isArray(s.menu_services) ? s.menu_services.filter(matchesAudience) : [];
  const hasPrice = s.price != null && Number(s.price) > 0;
  const hasHours = Boolean(s.hours && String(s.hours).trim());
  const bookable = menuServices.length > 0 || categories.length > 0;
  const servicesSectionHtml = menuServices.length
    ? menuServices.map(svc => '<div class="service-line"><div><strong>'+esc(svc.name)+'</strong><span>'+esc(svc.duration)+' · '+esc(svc.category)+(svc.audience && svc.audience !== 'unisex' ? ' · '+esc(svc.audience==='men'?'Men':'Women') : ' · Unisex')+(svc.desc ? ' — '+esc(svc.desc) : '')+'</span></div><b>'+money(svc.price)+'</b><button type="button" data-action="book-salon" data-id="'+esc(s.id)+'" data-service-id="'+esc(svc.id)+'">Book</button></div>').join('')
    : (categories.length ? '<div class="salon-detail-tags">'+categories.map(c=>'<div class="service-line"><div><strong>'+esc(c)+'</strong></div></div>').join('')+'</div>' : '<p>No services listed yet.</p>');
  return '<main class="detail-page">'+backButton('landing','Back to salons') +
    '<div class="salon-profile-image">'+image(s.img,s.name+' salon')+'</div>' +
    '<div class="detail-header"><div><p class="eyebrow">SALON &amp; PARLOUR</p><h1>'+esc(s.name)+'</h1><p>'+icon('pin',17)+esc(s.area)+(s.distanceLabel?' · '+esc(s.distanceLabel):'')+'</p></div></div>' +
    '<div class="detail-columns"><div>' +
      (s.about ? '<section class="detail-block"><h2>About</h2><p>'+esc(s.about)+'</p></section>' : '') +
      '<section class="detail-block"><h2>'+(menuServices.length ? 'Salon menu &amp; pricing' : 'Service categories')+'</h2>'+servicesSectionHtml+'</section>' +
      (staff.length ? '<section class="detail-block"><h2>Team</h2><div class="staff-row">'+staff.map(p=>'<div>'+(p.img?image(p.img,p.name):'')+'<strong>'+esc(p.name)+'</strong><span>'+esc(p.specialty||'Specialist')+'</span></div>').join('')+'</div></section>' : '') +
      listingReviewSection('salon',s.id) +
    '</div>' +
    '<aside class="detail-aside">' +
      '<p class="eyebrow">VISIT DETAILS</p>' +
      '<h3>'+esc(s.name)+'</h3>' +
      '<p>'+icon('pin',17)+esc(s.area)+(s.distanceLabel?' · '+esc(s.distanceLabel):'')+'</p>' +
      (hasHours ? '<p>'+icon('clock',17)+esc(s.hours)+'</p>' : '') +
      (hasPrice ? '<p>Services from <strong>'+money(s.price)+'</strong></p>' : '') +
      (bookable ? '<p class="detail-aside-note">Select a service, specialist, and preferred time in booking. Preferred times are subject to availability.</p>'+button('Book an appointment '+icon('arrow',18),'book-salon','btn-primary full','data-id="'+esc(s.id)+'"') : '<p class="detail-aside-note">Online booking is not available for this salon yet.</p>') +
    '</aside></div></main>';
}

function productCard(p){
  const variants = Array.isArray(p.variants) && p.variants.length ? p.variants : [];
  const rememberedVar = state.quickSelectedVariants?.[p.id];
  const activeVariant = (rememberedVar && variants.includes(rememberedVar)) ? rememberedVar : (variants[0] || '');
  const stockInfo = getStockInfo(p, activeVariant);
  const isSoldOut = stockInfo.soldOut || p.in_stock === false || p.soldOut === true;
  const isLoading = state.addingCartId === p.id;
  const isAdded = Boolean(state.addedCartIds?.[p.id]);
  const hasMrp = Boolean(p.old && Number(p.old) > Number(p.price));
  const discountPct = getDiscountPct(p);
  const sellerName = p.seller_name || state.productOffers?.[p.id]?.offers?.[0]?.seller_name || '';
  const ariaBtnText = isSoldOut ? 'Sold out' : isLoading ? 'Adding' : isAdded ? 'Added' : 'Add to Bag';
  const btnLabel = isSoldOut ? 'Sold out' : isLoading ? 'Adding...' : isAdded ? 'Added '+icon('check',15) : 'Add to Bag';
  const sizeHint = variants.length ? (variants.length > 1 ? activeVariant + ' · ' + variants.length + ' options' : activeVariant) : '';
  const overlayRaw = getVariantHeading(p, variants).replace(/^SELECT\s+/i, '');
  const overlayLabel = overlayRaw.charAt(0).toUpperCase() + overlayRaw.slice(1).toLowerCase() + ':';
  const quickOverlayHtml = '<div class="product-quick-overlay">' +
    (variants.length
      ? '<span class="quick-overlay-label">' + esc(overlayLabel) + '</span>' +
        '<div class="quick-overlay-options">' +
          variants.map(v => {
            const vOut = getStockInfo(p, v).soldOut || p.in_stock === false || p.soldOut === true;
            const vSel = v === activeVariant;
            return '<button type="button" class="quick-var-btn' + (vSel ? ' active' : '') + (vOut ? ' sold-out-var' : '') + '" data-action="quick-add-variant" data-id="' + esc(p.id) + '" data-variant="' + esc(v) + '"' + (vOut ? ' disabled aria-disabled="true"' : '') + '>' + esc(v) + '</button>';
          }).join('') +
        '</div>'
      : '<button type="button" class="btn btn-primary btn-sm full" data-action="add-cart" data-id="' + esc(p.id) + '"' + (isSoldOut || isLoading ? ' disabled aria-disabled="true"' : '') + '>' + btnLabel + '</button>') +
  '</div>';

  return '<article class="product-card">' +
    '<div class="product-image">' +
      '<button type="button" class="product-image-link" data-action="product-detail" data-id="'+esc(p.id)+'" aria-label="View details for '+esc(p.name)+'">'+image(p.img,p.name)+'</button>' +
      '<div class="product-card-media-actions">' +
        '<button type="button" class="product-quick-view-btn" data-action="quick-view" data-id="'+esc(p.id)+'" aria-label="Quick view '+esc(p.name)+'" title="Quick view">'+icon('eye',17)+'</button>' +
        '<button type="button" class="wishlist-on-card '+(state.wishlist.includes(p.id)?'saved':'')+'" data-action="wish" data-id="'+esc(p.id)+'" aria-pressed="'+(state.wishlist.includes(p.id)?'true':'false')+'" aria-label="Save '+esc(p.name)+'">'+icon('heart',16)+'</button>' +
      '</div>' +
      quickOverlayHtml +
    '</div>' +
    '<div class="product-body">' + audienceBadge(p) +
      '<span class="product-brand">'+esc(p.brand)+'</span>' +
      '<button type="button" class="product-name" data-action="product-detail" data-id="'+esc(p.id)+'">'+esc(p.name)+'</button>' +
      (sellerName ? '<span class="product-seller">Sold by '+esc(sellerName)+'</span>' : '') +
      (sizeHint || stockInfo.low || isSoldOut ? '<div class="product-meta-line">'+(sizeHint?'<span>'+esc(sizeHint)+'</span>':'')+(isSoldOut?'<span class="product-low-stock">Sold out</span>':stockInfo.low?'<span class="product-low-stock">'+esc(stockInfo.label)+'</span>':'')+'</div>' : '') +
      '<div class="product-bottom">' +
        '<div class="product-pricing"><strong class="product-price">'+money(p.price)+'</strong>'+(hasMrp?'<del class="product-old">'+money(p.old)+'</del>'+(discountPct>0?'<span class="product-save">'+discountPct+'% off</span>':''):'')+'</div>' +
        '<button type="button" class="add-bag-btn'+(isSoldOut?' sold-out':isAdded?' added':'')+(isLoading?' is-loading':'')+'" data-action="add-cart" data-id="'+esc(p.id)+'"'+(activeVariant?' data-variant="'+esc(activeVariant)+'"':'')+(isSoldOut||isLoading?' disabled aria-disabled="true"':'')+' aria-label="'+esc(ariaBtnText)+' '+esc(p.name)+'">'+btnLabel+'</button>' +
      '</div>' +
    '</div>' +
  '</article>';
}

function shopPage(){
  const isMen = isMenExperience();
  if (!['All','OFFERS'].includes(state.shopCollection)) state.shopCollection = 'All';
  const audienceProducts = products.filter(isVisibleInAudience);
  const shopFilters = getFiltersForExp('shop');
  const list = getFilteredShopProducts(audienceProducts, shopFilters);
  const catalogDown = !products.length && state.catalogErrors.products;
  const catalogBusy = !products.length && state.catalogFeedsLoading.products;
  const shopBrands = ['All', ...Array.from(new Set(audienceProducts.map(p => p.brand).filter(Boolean)))];
  const visibleCollections = shopCollections.filter(col => col.id === 'All' || (col.id === 'OFFERS' && products.some(p => getDiscountPct(p) > 0)));
  const activeFilters = buildActiveFiltersForExp('shop', shopFilters, visibleCollections);

  const shelfResultsHtml = catalogBusy
    ? catalogLoadingState('beauty store')
    : catalogDown
      ? catalogUnavailableState('Storefront catalog', 'We could not load live product pricing and availability right now. Demo inventory is disabled to protect your checkout accuracy.')
      : '<div class="product-grid">'+list.map(productCard).join('')+'</div>'+(list.length?'':'<div class="empty-filtered">'+empty('search',products.length && !audienceProducts.length?'No products are classified for this selection yet':products.length?'No products match these filters':'No products are listed yet',products.length && !audienceProducts.length?'Check back as sellers add more products.':products.length?'Try clearing one of your active filters to see more products.':'Check back as independent sellers add their products.')+'<div class="empty-actions">'+button('Clear all filters '+icon('arrow',16),'exp-reset-all','btn-outline','data-exp="shop"')+'</div></div>');

  const countText = audienceProducts.length ? 'Showing <strong>'+list.length+'</strong> of '+audienceProducts.length+(audienceProducts.length===1?' product':' products') : '';
  const shopShelfSection = renderFilterShelfSection('shop', shopFilters, activeFilters, {
    categories: shopCategories,
    collections: visibleCollections,
    brands: shopBrands,
    countDraftMatches: draft => getFilteredShopProducts(audienceProducts, draft).length
  }, countText, shelfResultsHtml);

  return '<main>' +
    '<section class="shop-hero">' +
      '<div class="shop-hero-copy">' +
        '<p class="eyebrow line-eyebrow">BEAUTY SHOPPING</p>' +
        '<h1>'+(isMen?'Everyday grooming, <em>thoughtfully chosen.</em>':'Thoughtfully curated <em>beauty essentials.</em>')+'</h1>' +
        '<p>'+(isMen?'Explore skin care, hair care and personal care from independent sellers and brands on GlamGo.':'Explore skincare, makeup, haircare, and personal care from independent sellers and brands.')+'</p>' +
        button('Shop all products '+icon('arrow',18),'scroll','btn-primary','data-target="bestsellers"') +
      '</div>' +
      '<div class="shop-hero-image">'+image(isMen ? MEN_SHOP_IMG : SHOP_IMG,isMen ? 'An editorial arrangement of grooming and personal care products' : 'Skincare and beauty products')+'</div>' +
    '</section>' +
    audienceSwitcher() +
    '<section class="section" id="shop-categories">' +
      sectionHead('CATEGORIES','Shop by category.') +
      '<div class="shop-category-grid">'+(isMen ? ['Skincare','Haircare','Beard Care','Body Care','Fragrance','Beauty Tools'] : shopCategories.slice(1).filter(c=>c!=='Beard Care')).map((c,i)=>{
        const count = audienceProducts.filter(p => p.category === c).length;
        return '<button type="button" class="shop-category-card'+(state.shopCategory===c?' active':'')+'" data-action="shop-category" data-id="'+c+'"><div>'+image(isMen ? MEN_SHOP_CATEGORY_IMAGES[c] : [images.serum,images.lipstick,images.haircare,images.cream,images.fragrance,images.tools][i],shopCategoryLabel(c))+'</div><span><span class="cat-copy"><span class="cat-label">'+shopCategoryLabel(c)+'</span>'+(products.length?'<small class="cat-count">'+count+(count===1?' product':' products')+'</small>':'')+'</span>'+icon('arrow',16)+'</span></button>';
      }).join('')+'</div>' +
    '</section>' +
    '<section class="section soft-section" id="bestsellers">' +
      sectionHead('THE BEAUTY SHELF','Products.') +
      generalCatalogueNote() + shopShelfSection +
    '</section>' +
  '</main>';
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
  const detailBtnLabel = isSoldOut ? 'Sold out' : isLoading ? 'Adding...' : isAdded ? 'Added to Bag '+icon('check',17) : 'Add to Bag '+icon('bag',18);
  const offersData = state.productOffers ? state.productOffers[p.id] : null;
  const offers = (offersData && offersData.offers) || [];
  const primarySeller = offers.length === 1
    ? (offers[0].seller_name || '')
    : offers.length > 1
      ? `${offers.length} marketplace sellers`
      : (p.seller_name || '');
  const offersHtml = offers.length ? '<div class="product-offers"><p class="eyebrow">SELLER OFFERS ('+offers.length+')</p><p class="offers-sub">Choose an offer from available sellers.</p>'+offers.map(off=>{
    const offerVariant = off.variant_name || variant || '';
    const offOut = Number(off.stock) <= 0;
    return '<div class="offer-row"><div><strong>'+esc(off.seller_name||'Marketplace seller')+'</strong><small>'+(offerVariant?esc(offerVariant)+' · ':'')+(off.sku?'SKU: '+esc(off.sku)+' · ':'')+(offOut?'Out of stock':off.stock+' in stock')+'</small></div><div class="offer-row-right"><strong>'+money(off.price)+'</strong><button type="button" class="btn btn-outline btn-sm" data-action="add-cart" data-id="'+esc(p.id)+'" data-listing="'+off.id+'"'+(offerVariant?' data-variant="'+esc(offerVariant)+'"':'')+(offOut?' disabled':'')+'>'+(offOut?'Sold out':'Select offer')+'</button></div></div>';
  }).join('')+'</div>' : '';

  const ingredientItems = parseIngredientsList(p.ingredients);
  const reviewState = state.productReviews?.[p.id];
  const liveReviews = Array.isArray(reviewState?.items) ? reviewState.items : [];
  const activeTab = ['details','ingredients','delivery','reviews'].includes(state.pdpTab) ? state.pdpTab : 'details';

  let tabPanelHtml = '';
  if (activeTab === 'details') {
    tabPanelHtml = '<p class="pdp-tab-copy">'+esc(p.description)+'</p><dl class="pdp-specs"><div><dt>Brand</dt><dd>'+esc(p.brand)+'</dd></div><div><dt>Category</dt><dd>'+esc(shopCategoryLabel(p.category))+'</dd></div>'+(variants.length?'<div><dt>Options</dt><dd>'+esc(variants.join(', '))+'</dd></div>':'')+'<div><dt>Availability</dt><dd>'+esc(stockInfo.label)+'</dd></div>'+(primarySeller?'<div><dt>Seller</dt><dd>'+esc(primarySeller)+'</dd></div>':'')+'</dl>';
  } else if (activeTab === 'ingredients') {
    tabPanelHtml = ingredientItems.length
      ? '<div class="ingredient-chips">'+ingredientItems.map(ing=>'<span class="ingredient-chip">'+esc(ing)+'</span>').join('')+'</div><p class="pdp-tab-note">Full ingredient list: '+esc(p.ingredients)+'</p>'
      : '<p class="pdp-tab-copy">Ingredient details are listed on the product packaging.</p>';
  } else if (activeTab === 'delivery') {
    tabPanelHtml = '<div class="pdp-policy-list"><div><strong>Delivery</strong><p>Available delivery options and shipping charges are shown at checkout.</p></div><div><strong>Returns</strong><p>Return requests for delivered items can be submitted from My orders.</p></div></div>';
  } else {
    const reviewsBody = reviewState?.loading
      ? '<p class="pdp-tab-sub">Loading customer reviews…</p>'
      : reviewState?.error
        ? '<p class="pdp-tab-sub">Reviews could not be loaded right now.</p>'
        : liveReviews.length
          ? '<div class="pdp-review-list">'+liveReviews.map(r=>'<article class="pdp-review-item"><div class="pdp-review-head"><strong>'+esc(r.user_name||'GlamGo customer')+'</strong><span class="rating">'+icon('star',14)+' '+Number(r.rating||0)+'/5</span></div>'+(r.comment?'<p>'+esc(r.comment)+'</p>':'')+'</article>').join('')+'</div>'
          : '<p class="pdp-tab-sub">No customer reviews yet.</p>';
    tabPanelHtml = reviewsBody;
  }

  const related = getRelatedProducts(p, 3);
  const relatedHtml = related.length
    ? '<section class="pdp-related" aria-label="More in this category"><div class="pdp-related-head"><div><p class="eyebrow">SIMILAR PRODUCTS</p><h2>More in '+esc(shopCategoryLabel(p.category))+'</h2></div>'+button('Browse store '+icon('arrow',16),'shop-all','btn-outline')+'</div><div class="product-grid pdp-related-grid">'+related.map(productCard).join('')+'</div></section>'
    : '';

  return '<main class="detail-page">' +
    '<nav class="pdp-breadcrumb" aria-label="Breadcrumb"><button type="button" data-action="shop-all">Beauty Store</button><span>/</span><button type="button" data-action="shop-category" data-id="'+esc(p.category)+'">'+esc(shopCategoryLabel(p.category))+'</button><span>/</span><span aria-current="page">'+esc(p.name)+'</span></nav>' +
    '<div class="product-detail">' +
      '<div class="product-detail-image">'+image(p.img,p.name)+(discountPct>0?'<span class="pdp-discount-badge">'+discountPct+'% OFF</span>':'')+'</div>' +
      '<div class="product-detail-info">' +
        '<div class="pdp-brand-row"><button type="button" class="eyebrow pdp-brand-link" data-action="shop-brand" data-id="'+esc(p.brand)+'">'+esc(p.brand)+'</button></div>' +
        '<h1>'+esc(p.name)+'</h1>' +
        (primarySeller ? '<p class="pdp-seller-line">Sold by <strong>'+esc(primarySeller)+'</strong></p>' : '') +
        '<div class="pdp-rating-row"><button type="button" class="pdp-rating-jump" data-action="pdp-reviews-jump">Reviews'+(liveReviews.length?' ('+liveReviews.length+')':'')+'</button><span class="stock-pill '+(stockInfo.soldOut?'out':stockInfo.low?'low':'in')+'">'+esc(stockInfo.label)+'</span></div>' +
        '<div class="product-detail-price">'+money(p.price)+(hasMrp?'<del>'+money(p.old)+'</del><span>Save '+money(p.old-p.price)+' ('+discountPct+'% off)</span>':'')+'</div>' +
        '<p class="product-desc">'+esc(p.description)+'</p>' +
        (variants.length?'<div class="variant-select"><span>'+getVariantHeading(p,variants)+'</span><div>'+variants.map(v=>{
          const vStock = getStockInfo(p, v);
          return '<button type="button" class="'+(v===variant?'active':'')+(vStock.soldOut?' sold-out-var':'')+'" data-action="variant" data-id="'+esc(v)+'" aria-pressed="'+(v===variant)+'">'+esc(v)+(vStock.soldOut?' (Out of stock)':'')+'</button>';
        }).join('')+'</div></div>':'') +
        '<div class="detail-actions">'+button(detailBtnLabel,'add-cart','btn-primary'+(isAdded?' added':''),'data-id="'+esc(p.id)+'"'+(variant?' data-variant="'+esc(variant)+'"':'')+(isSoldOut||isLoading?' disabled':''))+button('Buy now '+icon('arrow',17),'buy-now','btn-outline','data-id="'+esc(p.id)+'"'+(variant?' data-variant="'+esc(variant)+'"':'')+(isSoldOut?' disabled':''))+'<button type="button" class="detail-wish '+(state.wishlist.includes(p.id)?'saved':'')+'" data-action="wish" data-id="'+esc(p.id)+'" aria-pressed="'+(state.wishlist.includes(p.id)?'true':'false')+'" aria-label="Add to wishlist">'+icon('heart',20)+'</button></div>' +
        offersHtml +
        '<div class="pdp-tabs" role="tablist" aria-label="Product information">'+[['details','Details'],['ingredients','Ingredients'],['delivery','Delivery & Returns'],['reviews','Reviews']].map(([tid,tlabel])=>'<button type="button" role="tab" id="pdp-tab-'+tid+'" aria-controls="pdp-tab-panel" aria-selected="'+(activeTab===tid?'true':'false')+'" class="pdp-tab '+(activeTab===tid?'active':'')+'" data-action="pdp-tab" data-id="'+tid+'">'+tlabel+'</button>').join('')+'</div>' +
        '<div class="pdp-tab-panel" id="pdp-tab-panel" role="tabpanel" aria-labelledby="pdp-tab-'+activeTab+'">'+tabPanelHtml+'</div>' +
      '</div>' +
    '</div>' +
    relatedHtml +
  '</main>';
}

function account(){
  const tabs = ['Overview','Personal information','Saved addresses','My bookings','My orders','Wishlist','Payment methods','Notifications','Coupons & rewards','Reviews','Customer support'];
  let content = '';
  if(state.accountTab==='Overview') content='<div class="account-welcome"><p class="eyebrow">GOOD TO SEE YOU</p><h2>Hello, '+esc(state.user.name.split(' ')[0])+'.</h2><p>Every side of beauty, together in one place.</p></div>'+(state.user?.role==='admin'?'<div class="account-block" style="border:1px solid var(--champagne);background:rgba(197,167,125,0.06);margin-bottom:20px"><h3>Platform Administrator</h3><p>You have full governance authority across partner onboarding, users, bookings, orders, and economics.</p>'+button('Admin Command Centre '+icon('arrow',16),'admin','btn-primary')+'</div>':'')+'<div class="account-quick"><button data-action="account-tab" data-id="My bookings">'+icon('calendar',23)+'<strong>'+state.bookings.length+(state.bookings.length===1?' booking':' bookings')+'</strong><span>Appointments and home services</span>'+icon('arrow',17)+'</button><button data-action="account-tab" data-id="My orders">'+icon('bag',23)+'<strong>'+state.orders.length+(state.orders.length===1?' order':' orders')+'</strong><span>Your beauty store purchases</span>'+icon('arrow',17)+'</button><button data-action="account-tab" data-id="Wishlist">'+icon('heart',23)+'<strong>'+state.wishlist.length+' saved</strong><span>Things you love</span>'+icon('arrow',17)+'</button></div><div class="account-block"><h3>Your details</h3><p>'+esc(state.user.email)+' · '+esc(state.user.phone)+'</p><button data-action="account-tab" data-id="Personal information">Edit information '+icon('arrow',15)+'</button></div>';
  else if(state.accountTab==='Personal information') content='<div class="account-block"><h2>Personal information</h2><p>Keep your contact details current for bookings and orders.</p><form id="profile-form" class="form-grid"><label>Full name<input name="name" required value="'+esc(state.user.name)+'"></label><label>Email address<input name="email" type="email" required value="'+esc(state.user.email)+'"></label><label>Phone number<input name="phone" required value="'+esc(state.user.phone)+'"></label><button class="btn btn-primary" type="submit">Save changes</button></form></div>';
  else if(state.accountTab==='Saved addresses') content='<div class="account-block"><div class="account-heading"><h2>Saved addresses</h2>'+button('Add address '+icon('plus',17),'address-add','btn-outline')+'</div>'+state.addresses.map((a,i)=>'<div class="address-card"><div>'+icon('pin',20)+'<span><strong>'+esc(a.label)+'</strong><small>'+esc(a.text)+'</small></span></div><button data-action="address-delete" data-id="'+i+'">Remove</button></div>').join('')+'</div>';
  else if(state.accountTab==='My bookings') content='<div class="account-block"><h2>My bookings</h2><p>Home services and salon appointments, together.</p>'+(state.bookings.length?state.bookings.map(b=>{
    const rawStatus = String(b.status || '').toLowerCase();
    const rawPay = String(b.payment_status || '').toLowerCase();
    const isExpired = rawStatus === 'expired' || rawPay === 'expired';
    const isCancelled = !isExpired && rawStatus === 'cancelled';
    const isCompleted = !isExpired && !isCancelled && rawStatus === 'completed';
    const isPending = !isExpired && !isCancelled && !isCompleted && (rawStatus === 'pending' || rawPay === 'pending' || rawPay === 'failed');
    const isConfirmed = !isExpired && !isCancelled && !isCompleted && !isPending && rawStatus === 'confirmed';
    const statusLabel = isExpired ? 'Expired' : isCancelled ? 'Cancelled' : isCompleted ? 'Completed' : isPending ? 'Pending payment' : 'Confirmed';
    const statusCls = isExpired ? 'status-expired' : isCancelled ? 'status-cancelled' : isCompleted ? 'status-completed' : isPending ? 'status-pending' : 'status-confirmed';
    const rescheduleBtn = isConfirmed ? '<button type="button" class="text-action" data-action="booking-reschedule-open" data-id="'+esc(b.id)+'">Reschedule</button>' : '';
    const cancelBtn = (isConfirmed || isPending) ? '<button type="button" class="text-action text-action-danger" data-action="booking-cancel" data-id="'+esc(b.id)+'">Cancel appointment</button>' : '';
    const reviewBtn = isCompleted ? '<button type="button" class="text-action" data-action="review-add">Write a review</button>' : '';
    const otpLine = (isConfirmed && rawPay === 'completed' && b.arrival_otp) ? '<small class="booking-meta-note">Arrival PIN: <strong>'+esc(b.arrival_otp)+'</strong> (share with your specialist)</small>' : '';
    const pendingNote = isPending ? '<small class="booking-meta-note">Awaiting payment confirmation — not confirmed yet.</small>' : '';
    const addonsLine = (Array.isArray(b.addons) && b.addons.length) ? '<small class="booking-meta-note">Add-ons: '+esc(b.addons.map(x => x.name || x).join(', '))+'</small>' : '';
    const payStatus = b.payment_status ? '<small class="booking-meta-note">Payment: '+esc(b.payment_status)+'</small>' : '';
    return '<div class="history-card"><div class="history-icon">'+icon(b.type==='home'?'home':'salon',22)+'</div><div><span class="eyebrow">'+(b.type==='home'?'AT-HOME SERVICE':'SALON APPOINTMENT')+'</span><h3>'+esc(b.title)+'</h3><p>'+formatDate(b.date)+' · '+esc(b.time)+' · '+esc(b.location)+'</p>'+addonsLine+otpLine+pendingNote+payStatus+'<div class="booking-card-actions">'+rescheduleBtn+cancelBtn+reviewBtn+'</div></div><span class="status '+statusCls+'">'+esc(statusLabel)+'</span></div>';
  }).join(''):empty('calendar','No bookings yet','Choose a home service or salon appointment to see it here.',button('Explore services '+icon('arrow',16),'experience','btn-primary','data-id="home"')))+'</div>';
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
  const unavailableHtml = catalogReady && unavailableKeys.length
    ? '<div class="unavailable-cart-items" role="status"><div><h3>Unavailable items</h3>'+(unavailableKeys.length>1?'<button type="button" class="text-action" data-action="cart-remove-unavailable">Remove all unavailable</button>':'')+'</div><p>These items are no longer available in the catalogue. Remove them before checkout.</p>'+unavailableKeys.map(key=>'<div><span>Item '+esc(parseCartKey(key).productId)+' · qty '+Number(state.cart[key])+'</span><button type="button" class="text-action" data-action="cart-remove" data-id="'+esc(key)+'">Remove</button></div>').join('')+'</div>'
    : '';
  if (unavailableHtml && !entries.length) return '<main class="cart-page"><div class="page-heading"><p class="eyebrow">THE BEAUTY STORE</p><h1>Your beauty bag.</h1></div>'+unavailableHtml+button('Explore the store '+icon('arrow',17),'shop-all','btn-outline')+'</main>';
  if (savedCount > 0 && !entries.length) {
    const noticeBody = state.catalogFeedsLoading.products
      ? catalogLoadingState('your saved beauty bag (' + savedCount + ' item' + (savedCount > 1 ? 's' : '') + ')')
      : catalogUnavailableState('Saved beauty bag pricing', 'Your bag keeps ' + savedCount + ' saved item' + (savedCount > 1 ? 's' : '') + ', but live catalog pricing could not be verified right now.');
    return '<main class="cart-page"><div class="page-heading"><p class="eyebrow">THE BEAUTY STORE</p><h1>Your beauty bag.</h1><p>Saved items remain preserved until the catalog is ready.</p></div>'+noticeBody+'</main>';
  }
  const subtotal = entries.reduce((sum, e) => sum + e.lineTotal, 0);
  return '<main class="cart-page"><div class="page-heading"><p class="eyebrow">THE BEAUTY STORE</p><h1>Your beauty bag.</h1></div>' +
    (entries.length
      ? '<div class="cart-layout"><div class="cart-items">'+unavailableHtml+entries.map(e=>'<div class="cart-item">'+image(e.product.img,e.product.name)+'<div><span class="product-brand">'+esc(e.product.brand)+'</span><h3>'+esc(e.product.name)+'</h3>'+(e.variant?'<p>Option: '+esc(e.variant)+'</p>':'')+(e.sellerName?'<p class="cart-seller">Sold by '+esc(e.sellerName)+'</p>':'')+'<p>'+money(e.unitPrice)+' each</p><button type="button" class="remove-link" data-action="cart-remove" data-id="'+esc(e.key)+'">Remove</button></div><div class="cart-item-end"><strong>'+money(e.lineTotal)+'</strong><div class="qty"><button type="button" data-action="cart-qty" data-id="'+esc(e.key)+'" data-delta="-1" aria-label="Decrease quantity of '+esc(e.product.name)+'">'+icon('minus',15)+'</button><span>'+e.qty+'</span><button type="button" data-action="cart-qty" data-id="'+esc(e.key)+'" data-delta="1" aria-label="Increase quantity of '+esc(e.product.name)+'">'+icon('plus',15)+'</button></div></div></div>').join('')+'</div><aside class="order-summary"><h3>Order summary</h3><div><span>Subtotal</span><strong>'+money(subtotal)+'</strong></div><div><span>Delivery</span><strong>Calculated at checkout</strong></div><div class="summary-total"><span>Estimated subtotal</span><strong>'+money(subtotal)+'</strong></div>'+button('Continue to checkout '+icon('arrow',17),'checkout','btn-primary full',unavailableKeys.length?'disabled aria-disabled="true"':'')+'<p>Shipping and payment options are confirmed at checkout.</p></aside></div>'
      : '<div class="empty-cart-wrap">'+empty('bag','Your bag is empty','Explore the beauty store to add products to your bag.',button('Explore the store '+icon('arrow',17),'shop-all','btn-primary'))+(popularPicks.length?'<section class="empty-cart-recs" aria-labelledby="empty-recs-title"><div class="empty-recs-head"><p class="eyebrow">BEAUTY STORE</p><h2 id="empty-recs-title">Browse products</h2></div><div class="product-grid empty-recs-grid">'+popularPicks.map(productCard).join('')+'</div></section>':(state.catalogErrors.products?catalogUnavailableState('Product recommendations','We could not load live product picks right now.'):''))+'</div>') +
  '</main>';
}

function checkoutPage(){
  if(!countCart()) return cartPage();
  const entries = getCartEntries();
  if (state.catalogFeedsLoading.products || state.catalogErrors.products || Object.keys(state.cart || {}).some(key => Number(state.cart[key]) > 0 && !products.some(p => String(p.id) === parseCartKey(key).productId))) return cartPage();

  const fp = getCartItemsFingerprint(entries);
  const resState = state.pendingReservation;
  const resData = (resState && resState.fingerprint === fp && resState.data) ? resState.data : null;
  const resError = (resState && resState.fingerprint === fp && resState.error) ? resState.error : null;
  const resLoading = Boolean(resState && resState.fingerprint === fp && resState.loading);

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
    ? '<div class="checkout-seller-packages">' +
        resData.sellers.map(s => '<div class="checkout-seller-card">' +
          '<div class="checkout-seller-head"><span><strong>'+esc(s.seller_name)+'</strong></span><span>Shipping: '+(Number(s.estimated_shipping_fee)===0?'Complimentary':money(s.estimated_shipping_fee))+'</span></div>' +
          (s.items||[]).map(it => '<div class="checkout-item-row"><span>'+esc(it.product_name)+(it.variant_name?' ('+esc(it.variant_name)+')':'')+' × '+it.qty+'</span><strong>'+money(it.line_total)+'</strong></div>').join('') +
        '</div>').join('') +
      '</div>'
    : '<div class="checkout-seller-packages">'+entries.map(e => '<div class="checkout-item-row"><span>'+esc(e.product.name)+(e.variant?' ('+esc(e.variant)+')':'')+(e.sellerName?' · '+esc(e.sellerName):'')+' × '+e.qty+'</span><strong>'+money(e.lineTotal)+'</strong></div>').join('')+'</div>';

  const resLoadingHtml = resLoading
    ? '<div class="payment-notice payment-notice-loading" role="status">Checking live seller availability &amp; shipping…</div>'
    : '';
  const resNoticeHtml = resError
    ? '<div class="payment-notice payment-notice-error" role="alert"><strong>Inventory check issue</strong><p>'+esc(resError)+'</p></div>'
    : '';
  const noticeHtml = state.paymentNotice
    ? '<div class="payment-notice payment-notice-'+esc(state.paymentNotice.type||'error')+'" role="alert"><strong>'+esc(state.paymentNotice.title)+'</strong><p>'+esc(state.paymentNotice.message)+'</p></div>'
    : '';
  const payLabel = state.checkoutBusy
    ? 'Processing...'
    : (state.paymentNotice && state.checkoutPayment !== 'Cash on delivery' ? 'Retry payment '+icon('arrow',17) : 'Place order '+icon('arrow',17));

  const addressBlockHtml = state.addresses.length
    ? '<label>Deliver to<select id="checkout-address">'+state.addresses.map((a,i)=>'<option value="'+i+'"'+(i===addrIdx?' selected':'')+'>'+esc(a.label)+' — '+esc(a.text)+'</option>').join('')+'</select></label><button type="button" class="text-action" data-action="address-add">+ Add another address</button>'
    : '<div class="checkout-address-empty"><p>No delivery address saved yet.</p>'+button('+ Add delivery address','address-add','btn-outline')+'</div>';

  const walletBtn = availWallet > 0
    ? '<div class="checkout-wallet-row"><button type="button" class="filter-chip '+(state.applyWalletCredit?'active':'')+'" data-action="checkout-toggle-credit" aria-pressed="'+(state.applyWalletCredit?'true':'false')+'">'+icon(state.applyWalletCredit?'check':'spark',14)+' Apply GlamGo Wallet Credit (Balance: '+money(availWallet)+')'+(state.applyWalletCredit?' · −'+money(creditApplied):'')+'</button></div>'
    : '';
  return '<main class="checkout-page">'+backButton('cart','Back to bag') +
    '<div class="page-heading"><p class="eyebrow">CHECKOUT</p><h1>Complete your order.</h1></div>' +
    '<div class="checkout-layout"><div>' +
      '<section class="checkout-block"><h2>01 &nbsp; Delivery address</h2>'+addressBlockHtml+'</section>' +
      '<section class="checkout-block"><h2>02 &nbsp; Payment method</h2><div class="payment-options">'+['UPI','Credit / debit card','Cash on delivery'].map(p=>'<button type="button" data-action="payment" data-id="'+p+'" class="'+(state.checkoutPayment===p?'active':'')+'"'+(state.checkoutBusy?' disabled':'')+'><span class="radio"></span>'+p+'</button>').join('')+'</div></section>' +
      '<section class="checkout-block"><h2>03 &nbsp; Coupon &amp; credits</h2><form id="coupon-form" class="coupon-form"><input name="coupon" placeholder="Enter coupon code" value="'+esc(state.coupon)+'"><button type="submit">Apply</button></form>'+(state.coupon && discount > 0?'<p class="success-note">'+icon('check',16)+' <span>'+esc(state.coupon)+' applied — save '+money(discount)+'</span> <button type="button" class="text-action" data-action="coupon-remove">Remove</button></p>':'')+walletBtn+'</section>' +
    '</div>' +
    '<aside class="order-summary"><h3>Order summary</h3>'+sellerPackagesHtml+'<hr><div><span>Subtotal</span><strong>'+money(subtotal)+'</strong></div>'+(discount?'<div><span>Discount</span><strong>−'+money(discount)+'</strong></div>':'')+'<div><span>Delivery &amp; shipping</span><strong>'+(shipping===0?'Complimentary':money(shipping))+'</strong></div>'+(creditApplied>0?'<div><span>Wallet credit</span><strong>−'+money(creditApplied)+'</strong></div>':'')+'<div class="summary-total"><span>Total payable</span><strong>'+money(payableTotal)+'</strong></div>'+resLoadingHtml+resNoticeHtml+noticeHtml+button(payLabel,'place-order','btn-primary full',(state.checkoutBusy || resLoading)?'disabled aria-disabled="true"':'')+'<p>Inventory and shipping are verified with sellers before payment.</p></aside></div></main>';
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
              ${safeHttpUrl(s.shipment.tracking_url) ? `<a href="${esc(safeHttpUrl(s.shipment.tracking_url))}" target="_blank" rel="noopener noreferrer" style="margin-left:8px;color:#8f6d40;text-decoration:underline;">Track courier</a>` : ''}
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
      const [salRes, salSrvRes, staffRes, bRes] = await Promise.allSettled([
        apiGetSalonProfile(),
        apiGetSalonServices(),
        apiGetSalonStaff(),
        apiGetSalonBookings()
      ]);
      if(!isCurrent()) return;
      if(salRes.status === 'fulfilled') state.partnerSalonProfile = salRes.value;
      if(salSrvRes.status === 'fulfilled') state.partnerSalonServices = salSrvRes.value;
      if(staffRes.status === 'fulfilled') state.partnerSalonStaff = staffRes.value;
      if(bRes.status === 'fulfilled') state.partnerSalonBookings = bRes.value;
      failures.push(...[salRes, salSrvRes, staffRes, bRes].filter(r => r.status === 'rejected'));
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

const PARTNER_SERVICE_CATEGORIES = ['Hair','Skin','Nails','Makeup','Spa','Beard','Threading','Waxing','Packages'];
const partnerCustomServiceForm = ({ formId, editing = null, showCities = false, defaultCity = 'Mumbai' }) => {
  const catOptions = PARTNER_SERVICE_CATEGORIES.map(c =>
    '<option value="'+esc(c)+'"'+((editing?.category || 'Hair')===c?' selected':'')+'>'+esc(c)+'</option>'
  ).join('');
  return '<form id="'+formId+'" class="form-grid partner-service-form">' +
    (editing ? '<input type="hidden" name="service_id" value="'+esc(editing.id)+'">' : '') +
    '<label>Service name<input name="name" required minlength="2" placeholder="e.g. Signature Keratin Ritual" value="'+esc(editing?.name || '')+'"></label>' +
    '<label>Category<select name="category">'+catOptions+'</select></label>' +
    '<label>Price (₹)<input name="price" type="number" min="1" step="1" required placeholder="999" value="'+(editing?.price ?? '')+'"></label>' +
    '<label>Duration<input name="duration" required placeholder="e.g. 60 min" value="'+esc(editing?.duration || '45 min')+'"></label>' +
    audienceField(editing?.audience) +
    (showCities ? '<label>Cities (comma-separated)<input name="cities" placeholder="Mumbai, Bengaluru" value="'+esc((Array.isArray(editing?.cities) ? editing.cities.join(', ') : editing?.service_cities) || defaultCity)+'"></label>' : '') +
    '<label style="grid-column:1/-1">Service image URL (optional)<input name="img" placeholder="https://images.unsplash.com/..." value="'+esc(editing?.img || '')+'"></label>' +
    '<label style="grid-column:1/-1">Description<textarea name="desc" rows="2" placeholder="Describe what is included in this service…">'+esc(editing?.desc || '')+'</textarea></label>' +
    '<div class="partner-service-form-actions" style="grid-column:1/-1">' +
      '<button class="btn btn-primary" type="submit">'+(editing ? 'Save Service Changes ' : '+ Add Custom Service ')+icon('arrow',17)+'</button>' +
      (editing ? '<button class="btn btn-outline" type="button" data-action="partner-service-edit-cancel">Cancel edit</button>' : '') +
    '</div>' +
  '</form>';
};

const audienceOptions = value => ['unisex','women','men'].map(v => '<option value="'+v+'"'+((!value || value === 'unspecified' ? 'unisex' : value)===v?' selected':'')+'>'+({unisex:'Unisex',women:'Women',men:'Men'})[v]+'</option>').join('');
const audienceField = value => '<label>Suitable for<select name="audience">'+audienceOptions(value)+'</select></label>';

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
        audienceField(pro.audience) +
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
        audienceField(sal.audience) +
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
    const salonServices = state.partnerSalonServices || [];
    const legacyCats = state.partnerSalonProfile?.services || [];
    const editingSalonSvc = state.editingPartnerService?.role === 'Salon Owner' ? state.editingPartnerService.service : null;
    body = '<div class="dashboard-panel">' +
      '<div class="account-heading">' +
        '<div>' +
          '<h3>Salon Service Menu &amp; Pricing</h3>' +
          '<p style="color:var(--muted);font-size:12px;margin:4px 0 0">Add, price, and update the exact treatments customers can book at your salon.</p>' +
        '</div>' +
      '</div>' +
      partnerCustomServiceForm({ formId: 'partner-salon-service-form', editing: editingSalonSvc, showCities: false }) +
      (salonServices.length
        ? salonServices.map(s => '<div class="dash-row"><div><strong>'+esc(s.name)+' <span class="badge badge-info">'+esc(s.category)+'</span> <span class="badge badge-approved">'+esc((s.audience||'unisex').toUpperCase())+'</span></strong><small>'+esc(s.duration)+' · '+money(s.price)+(s.desc?' · '+esc(s.desc):'')+'</small></div><div class="partner-row-actions"><button class="btn btn-outline btn-sm" type="button" data-action="partner-salon-service-edit" data-id="'+esc(s.id)+'">Edit</button><button class="btn btn-danger btn-sm" type="button" data-action="partner-salon-service-delete" data-id="'+esc(s.id)+'">Remove</button></div></div>').join('')
        : '<div class="dash-empty"><strong>No custom menu services yet</strong><p>'+(legacyCats.length ? 'Customers currently see GlamGo category defaults ('+esc(legacyCats.join(', '))+'). Add your own salon services above to show custom pricing.' : 'Add your first salon service above so customers can book with your exact pricing.')+'</p></div>') +
    '</div>';
  } else if(tab.toLowerCase().includes('service')){
    const myServices = state.partnerProServices || [];
    const editingProSvc = state.editingPartnerService?.role === 'Professional' ? state.editingPartnerService.service : null;
    const proCity = state.partnerProProfile?.city || 'Mumbai';
    body = '<div class="dashboard-panel">' +
      '<div class="account-heading">' +
        '<div>' +
          '<h3>Offered Services &amp; Custom Menu</h3>' +
          '<p style="color:var(--muted);font-size:12px;margin:4px 0 0">Assign standard GlamGo treatments or publish your own custom at-home services with your pricing.</p>' +
        '</div>' +
      '</div>' +
      partnerCustomServiceForm({ formId: 'partner-pro-custom-service-form', editing: editingProSvc, showCities: true, defaultCity: proCity }) +
      '<div class="dash-service-picker" style="margin:20px 0;padding:15px;background:var(--ivory);border:1px solid var(--border);display:flex;gap:12px;align-items:center">' +
        '<select id="partner-service-select" aria-label="Choose a service" class="admin-role-select" style="flex:1;height:42px">' +
          (state.partnerServiceCatalog || []).map(s => '<option value="'+esc(s.id)+'">'+esc(s.name)+' ('+esc(s.category)+') — '+money(s.price)+'</option>').join('') +
        '</select>' +
        '<button class="btn btn-outline btn-sm" type="button" data-action="partner-pro-assign-service">Assign Master Service</button>' +
      '</div>' +
      (myServices.length ? myServices.map(s => '<div class="dash-row"><div><strong>'+esc(s.name)+' ('+esc(s.category)+') <span class="badge '+(s.is_custom?'badge-approved':'badge-info')+'">'+(s.is_custom?'Custom':'Catalog')+'</span></strong><small>'+esc(s.duration)+' · '+money(s.price)+(s.is_custom && s.audience?' · '+esc(s.audience.toUpperCase()):'')+'</small></div><div class="partner-row-actions">'+(s.is_custom?'<button class="btn btn-outline btn-sm" type="button" data-action="partner-pro-service-edit" data-id="'+esc(s.id)+'">Edit</button>':'')+'<button class="btn btn-danger btn-sm" type="button" data-action="partner-pro-unlink-service" data-id="'+esc(s.id)+'">'+(s.is_custom?'Remove':'Unlink')+'</button></div></div>').join('') : '<p style="color:var(--muted);padding:15px 0">No services added yet. Create a custom service above or assign one from the master catalog.</p>') +
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
        '<div><strong>'+esc(b.title)+'</strong><small>'+formatDate(b.date)+' · '+b.time+(b.professional?' · Staff: '+esc(b.professional):'')+' · '+esc(b.customer_name||'Client')+' · '+money(b.price)+'</small><small style="color:var(--muted)">Location: '+esc(b.location)+'</small>'+((Array.isArray(b.addons)&&b.addons.length)?'<small style="color:var(--muted)">Add-ons: '+esc(b.addons.map(x=>x.name||x).join(', '))+'</small>':'')+'</div>' +
        '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
          '<span class="badge badge-'+b.status.toLowerCase()+'">'+esc(b.status)+'</span>' +
          (b.status === 'pending' ? '<button class="btn btn-danger btn-sm" data-action="'+(role==='Professional'?'partner-pro-cancel':'partner-salon-cancel')+'" data-id="'+b.id+'">Cancel</button>' : '') +
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
        audienceField('unisex') +
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
      (prods.length ? prods.map(p => '<details class="dash-product"><summary><span><strong>'+esc(p.name)+'</strong><small>'+esc(p.brand)+' · '+esc(p.category)+' · '+money(p.price)+'</small></span><span>Edit product ↓</span></summary><form class="form-grid partner-product-edit-form" data-product-id="'+esc(p.id)+'">'+audienceField(p.audience)+'<label>Brand<input name="brand" required value="'+esc(p.brand)+'"></label><label>Product name<input name="name" required value="'+esc(p.name)+'"></label><label>Category<input name="category" required value="'+esc(p.category)+'"></label><label>Price (₹)<input name="price" type="number" min="0.01" step="0.01" required value="'+p.price+'"></label><label>Image URL<input name="img" required value="'+esc(p.img || '')+'"></label><label>Ingredients<input name="ingredients" value="'+esc(p.ingredients || '')+'"></label><label style="grid-column:1/-1">Description<textarea name="description" required>'+esc(p.description || '')+'</textarea></label><button class="btn btn-primary" type="submit">Save product</button></form></details>').join('') : '<p style="color:var(--muted)">No products created yet.</p>') +
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
        (s.shipment ? '<div style="background:var(--ivory);padding:10px;border:1px solid var(--border);font-size:12px">Carrier: <strong>'+esc(s.shipment.carrier_name)+'</strong> · Tracking AWB: <strong>'+esc(s.shipment.tracking_number)+'</strong>'+(safeHttpUrl(s.shipment.tracking_url)?' · <a href="'+esc(safeHttpUrl(s.shipment.tracking_url))+'" target="_blank" rel="noopener noreferrer" style="color:var(--champagne)">Live Courier Tracking</a>':'')+'</div>' : '') +
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
  return '<div class="partner-page dash-shell"><aside class="partner-sidebar dash-sidebar"><div class="dash-brand"><button class="wordmark" data-action="public-home"><img src="./assets/glamgo-logo-light.png" alt="GLAMGO" class="brand-logo-img"></button><small>PARTNER WORKSPACE</small></div><div class="dash-role"><span>YOUR WORKSPACE</span><strong>'+esc(role)+'</strong></div><label class="dash-mobile-nav">Workspace section<select id="partner-mobile-nav">'+navTabs.map(t=>'<option value="'+esc(t)+'" '+(t===tab?'selected':'')+'>'+esc(t)+'</option>').join('')+'</select></label><nav aria-label="Partner navigation">'+navTabs.map(t => '<button class="'+(t===tab?'active':'')+'" '+(t===tab?'aria-current="page"':'')+' data-action="partner-tab" data-id="'+esc(t)+'"><span>'+esc(t)+'</span><span aria-hidden="true">→</span></button>').join('')+'</nav><button class="dash-exit" data-action="public-home">← Back to GlamGo</button></aside>'+
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
      '<a class="wordmark light" href="#" data-action="landing" style="text-decoration:none"><img src="./assets/glamgo-logo-light.png" alt="GLAMGO" class="brand-logo-img"></a>' +
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
      (pending.length ? pending.slice(0,4).map(d=>'<div class="dash-row"><div><strong>'+esc(d.name)+'</strong><small>'+esc(d.role)+' · '+esc(d.applicant_name || 'Applicant')+'</small></div><button class="dash-link" data-action="admin-tab" data-id="moderation">Review →</button></div>').join('') : '<div class="dash-empty"><strong>'+(state.adminDataLoaded && !state.adminDataError ? 'All caught up' : state.adminDataError ? 'Applications unavailable' : 'Loading applications...')+'</strong><p>'+(state.adminDataLoaded && !state.adminDataError ? 'There are no pending applications.' : state.adminDataError ? 'Refresh to see the latest applications.' : 'Fetching latest partner applications.')+'</p></div>')+'</section>'+
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
          '<h2>Users & Role Management</h2>' +
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
      '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>ID</th><th>Name</th><th>Category</th><th>Duration</th><th>Price</th><th>Rating</th><th>Suitable for</th></tr></thead><tbody>' +
        state.adminServices.map(s => '<tr><td>'+s.id+'</td><td><strong>'+esc(s.name)+'</strong></td><td><span class="badge badge-info">'+esc(s.category)+'</span></td><td>'+esc(s.duration)+'</td><td><strong>'+money(s.price)+'</strong></td><td>'+s.rating+' ★ ('+s.reviews+')</td><td><select id="service-audience-'+esc(s.id)+'" aria-label="Audience for '+esc(s.name)+'">'+audienceOptions(s.audience)+'</select><button type="button" data-action="admin-save-audience" data-id="'+esc(s.id)+'">Save</button></td></tr>').join('') +
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
  else if(state.modal==='location') inner='<div class="modal-head"><p class="eyebrow">YOUR LOCATION</p><h2>Where should we find you?</h2><p>View city-available services, specialists, and distance-sorted salons.</p></div><div class="gg-location-map-bar"><span>Tap anywhere on the map to drop your pin</span><button type="button" class="btn btn-outline btn-sm gg-locate-btn" data-action="map-locate">'+icon('pin',14)+' Use my location</button></div><div id="location-picker-map" class="gg-map-modal" role="region" aria-label="Pick your location on the map"></div><form id="location-form"><label>Enter area or city<div class="gg-loc-field"><input id="location-search-input" name="location" required value="'+esc(locationDraft?.label || state.location)+'" placeholder="Search any area, street, or city…" autocomplete="off" autofocus><div id="location-autocomplete-list" class="gg-loc-dropdown" role="listbox" aria-label="Location suggestions" hidden></div></div></label><button class="btn btn-primary full" type="submit">Save location '+icon('arrow',17)+'</button></form><div class="location-suggestions"><span>POPULAR LOCATIONS</span>'+['Indiranagar, Bengaluru','Koramangala, Bengaluru','Whitefield, Bengaluru','Bandra West, Mumbai','Juhu, Mumbai','Hauz Khas, South Delhi'].map(l=>'<button data-action="location-set" data-id="'+l+'">'+icon('pin',16)+l+'</button>').join('')+'</div>';
  else if(state.modal==='date') inner='<div class="modal-head"><p class="eyebrow">PLAN YOUR VISIT</p><h2>Choose a date.</h2><p>Browse salons for the day that suits you.</p></div><div class="date-grid modal-dates">'+dateOptions().map(d=>'<button class="'+(state.salonDate===d.value?'selected':'')+'" data-action="date-set" data-id="'+d.value+'"><span>'+d.day+'</span><strong>'+d.date+'</strong><small>'+d.month+'</small></button>').join('')+'</div>';
  else if(state.modal==='search'){
    const q = state.query.toLowerCase().trim();
    const userCity = currentLocationCity();
    const searchable = [
      ...products.filter(matchesAudience).map(x=>({...x,type:'Product',inCity:true})),
      ...services.filter(matchesAudience).map(x=>({...x,type:'Service',inCity:isServiceAvailableInCity(x,userCity)})),
      ...salons.filter(matchesAudience).map(x=>({...x,type:'Salon',inCity:String(x.city||normalizeCity(x.area)||'').toLowerCase()===userCity.toLowerCase()}))
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
  else if(state.modal==='quick-view'){
    const p = products.find(x => String(x.id) === String(state.quickViewProductId));
    if(!p){
      inner = empty('bag','Product unavailable','This product is no longer listed.');
    } else {
      const variants = Array.isArray(p.variants) && p.variants.length ? p.variants : [];
      const remembered = state.quickSelectedVariants?.[p.id];
      const variant = (remembered && variants.includes(remembered)) ? remembered : (variants[0] || '');
      const stockInfo = getStockInfo(p, variant);
      const isSoldOut = stockInfo.soldOut || p.in_stock === false || p.soldOut === true;
      const hasMrp = Boolean(p.old && Number(p.old) > Number(p.price));
      const discountPct = getDiscountPct(p);
      const offersData = state.productOffers ? state.productOffers[p.id] : null;
      const offers = (offersData && offersData.offers) || [];
      const sellerName = offers.length === 1 ? (offers[0].seller_name || '') : (p.seller_name || '');
      const btnLabel = isSoldOut ? 'Sold out' : 'Add to Bag ' + icon('bag', 17);
      inner = '<div class="quick-view-grid">' +
        '<div class="quick-view-image">' + image(p.img, p.name) + (discountPct > 0 ? '<span class="pdp-discount-badge">' + discountPct + '% OFF</span>' : '') + '</div>' +
        '<div class="quick-view-info">' +
          '<p class="eyebrow">' + esc(p.brand) + '</p>' +
          '<h2>' + esc(p.name) + '</h2>' +
          (sellerName ? '<p class="pdp-seller-line">Sold by <strong>' + esc(sellerName) + '</strong></p>' : '') +
          '<div class="pdp-rating-row"><span class="stock-pill ' + (stockInfo.soldOut ? 'out' : stockInfo.low ? 'low' : 'in') + '">' + esc(stockInfo.label) + '</span></div>' +
          '<div class="product-detail-price">' + money(p.price) + (hasMrp ? '<del>' + money(p.old) + '</del><span>' + discountPct + '% off</span>' : '') + '</div>' +
          (p.description ? '<p class="quick-view-desc">' + esc(p.description) + '</p>' : '') +
          (variants.length ? '<div class="variant-select"><span>' + getVariantHeading(p, variants) + '</span><div>' + variants.map(v => {
            const vOut = getStockInfo(p, v).soldOut;
            return '<button type="button" class="' + (v === variant ? 'active' : '') + (vOut ? ' sold-out-var' : '') + '" data-action="quick-view-variant" data-id="' + esc(v) + '" aria-pressed="' + (v === variant) + '">' + esc(v) + (vOut ? ' (Out of stock)' : '') + '</button>';
          }).join('') + '</div></div>' : '') +
          '<div class="quick-view-actions">' +
            '<button type="button" class="btn btn-primary full" data-action="add-cart" data-id="' + esc(p.id) + '"' + (variant ? ' data-variant="' + esc(variant) + '"' : '') + (isSoldOut ? ' disabled aria-disabled="true"' : '') + '>' + btnLabel + '</button>' +
            '<button type="button" class="btn btn-outline full" data-action="product-detail" data-id="' + esc(p.id) + '">View full details ' + icon('arrow', 16) + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }
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
  return '<div class="modal-backdrop"><div class="modal '+(state.modal==='booking'?'booking-modal':state.modal==='quick-view'?'quick-view-modal':'')+'" role="dialog" aria-modal="true" aria-label="GlamGo dialog"><button class="modal-close" data-action="modal-close" aria-label="Close">'+icon('close',21)+'</button>'+inner+'</div></div>';
}

function bookingModal(){
  const b = state.booking, salon = b.type==='salon'?salons.find(x=>String(x.id)===String(b.itemId)):null;
  const salonMenu = Array.isArray(salon?.menu_services) ? salon.menu_services : [];
  const service = salonMenu.find(x => String(x.id) === String(b.serviceId)) || services.find(x => String(x.id) === String(b.serviceId));
  const selectedAddons = Array.isArray(b.addons) ? b.addons : [];
  const addonObjects = BOOKING_ADDONS.filter(a => selectedAddons.includes(a.id));
  const addonsSum = addonObjects.reduce((acc, a) => acc + Number(a.price || 0), 0);
  const basePrice = Number(service?.price || 0);
  const totalPrice = basePrice + addonsSum;
  const userCity = currentLocationCity();
  const steps = b.type==='home'?['Service','Specialist','Date & time','Review']:['Service','Staff','Date & time','Review'];
  const summaryParts = [];
  if (service) summaryParts.push(esc(service.name) + ' (' + money(basePrice) + ')');
  if (b.professional && b.step > 1) summaryParts.push(esc(b.professional));
  if (b.date && b.time && b.step > 2) summaryParts.push(formatDate(b.date) + ' · ' + esc(b.time));
  const stepSummaryHtml = summaryParts.length && b.step < 3
    ? '<div class="booking-step-summary" aria-label="Current selections"><span>Selected:</span> ' + summaryParts.join(' <i>·</i> ') + '</div>'
    : '';
  let body = '';
  if(b.step===0){
    const cityHomeServices = services.filter(s => !isPreviewId(s.id) && isServiceAvailableInCity(s, userCity) && matchesAudience(s));
    const list0 = b.type==='home'
      ? cityHomeServices
      : (salonMenu.length ? salonMenu.filter(matchesAudience) : cityHomeServices.filter(s=>salon&&salon.services.includes(s.category)));
    body='<h3>Choose a service</h3>'+(salon?'<p class="booking-hint">'+(salonMenu.length?'Select a service from '+esc(salon.name)+'’s menu.':'Select a service in one of '+esc(salon.name)+'’s categories.')+'</p>':'<p class="booking-hint">Select the treatment you would like to book.</p>')+'<div class="booking-options">'+(list0.length?list0.map(s=>'<button type="button" class="'+(b.serviceId===s.id?'selected':'')+'" data-action="booking-service" data-id="'+esc(s.id)+'"><span><strong>'+esc(s.name)+'</strong><small>'+esc(s.duration)+' · '+esc(s.category)+(s.professional_name?' · By '+esc(s.professional_name):'')+'</small></span><b>'+money(s.price)+'</b></button>').join(''):'<p>No services are available for this selection right now.</p>')+'</div>';
  }
  if(b.step===1){
    const cityPros = professionals.filter(p => isProAvailableInCity(p, userCity) && matchesAudience(p));
    const ownerPro = (b.type === 'home' && service?.professional_id)
      ? professionals.find(p => Number(p.id) === Number(service.professional_id) && isProAvailableInCity(p, userCity))
      : null;
    const list1 = b.type==='home'
      ? (ownerPro ? [ownerPro, ...cityPros.filter(p => Number(p.id) !== Number(ownerPro.id))] : cityPros)
      : (Array.isArray(salon?.staff) ? salon.staff : []);
    body='<h3>'+(b.type==='home'?'Choose a specialist':'Choose a staff member')+'</h3><p class="booking-hint">Select a listed specialist or choose any available expert.</p><div class="booking-options"><button type="button" class="'+(b.professional==='Any available expert'?'selected':'')+'" data-action="booking-pro" data-id="Any available expert"><span><strong>Any available expert</strong><small>Match with an available specialist.</small></span></button>'+list1.map(p=>'<button type="button" class="'+(b.professional===p.name?'selected':'')+'" data-action="booking-pro" data-id="'+esc(p.name)+'">'+(p.img?image(p.img,p.name,'booking-avatar'):'')+'<span><strong>'+esc(p.name)+'</strong><small>'+esc(p.specialty || 'Beauty professional')+'</small></span></button>').join('')+'</div>';
  }
  if(b.step===2){
    body='<h3>Pick a preferred date &amp; time</h3><p class="booking-hint">Preferred times for '+esc(salon?salon.name:'your at-home appointment')+' are subject to availability.</p><div class="date-grid">'+dateOptions().map(d=>'<button type="button" class="'+(b.date===d.value?'selected':'')+'" data-action="booking-date" data-id="'+d.value+'"><span>'+d.day+'</span><strong>'+d.date+'</strong><small>'+d.month+'</small></button>').join('')+'</div><p class="slot-label">PREFERRED TIMES (SUBJECT TO AVAILABILITY)</p><div class="time-grid">'+['9:00 AM','10:30 AM','12:00 PM','2:00 PM','3:30 PM','5:00 PM'].map(t=>'<button type="button" class="'+(b.time===t?'selected':'')+'" data-action="booking-time" data-id="'+t+'">'+t+'</button>').join('')+'</div>';
  }
  if(b.step===3){
    const noticeHtml = state.bookingNotice
      ? '<div class="payment-notice payment-notice-'+esc(state.bookingNotice.type||'error')+'" role="alert"><strong>'+esc(state.bookingNotice.title)+'</strong><p>'+esc(state.bookingNotice.message)+'</p></div>'
      : '';
    const addonReviewRows = addonObjects.map(a => '<div><span>Add-on: '+esc(a.name)+' ('+esc(a.duration)+')</span><strong>+'+money(a.price)+'</strong></div>').join('');
    body='<h3>Review your booking</h3><div class="booking-review"><div><span>Service</span><strong>'+esc(service?.name||'Service')+' ('+money(basePrice)+')</strong></div>'+addonReviewRows+'<div><span>Specialist</span><strong>'+esc(b.professional)+'</strong></div><div><span>Preferred date &amp; time</span><strong>'+formatDate(b.date)+' · '+esc(b.time)+'</strong></div><div><span>Location</span><strong>'+esc(salon?salon.name+', '+salon.area:state.addresses[0]?.text||state.location)+'</strong></div><div><span>Total payable</span><strong>'+money(totalPrice)+'</strong></div></div>'+noticeHtml+'<p class="booking-hint">'+(totalPrice>0?'Your appointment is only confirmed once payment succeeds. Unpaid bookings remain pending until payment is completed.':'Confirm your booking to save this appointment.')+'</p>';
  }
  const confirmLabel = b.step===3
    ? (state.bookingBusy ? 'Processing...' : (state.bookingNotice ? 'Retry payment '+icon('arrow',16) : (totalPrice > 0 ? 'Pay & confirm '+icon('check',17) : 'Confirm booking '+icon('check',17))))
    : 'Continue '+icon('arrow',17);
  return '<div class="modal-head"><p class="eyebrow">'+(salon?'SALON APPOINTMENT':'AT-HOME SERVICE')+' · STEP '+(b.step+1)+' OF 4</p><h2>'+(salon?esc(salon.name):'Book at-home care')+'</h2></div><div class="booking-progress">'+steps.map((s,i)=>'<span class="'+(i<=b.step?'active':'')+'"><b>'+(i<b.step?'✓':i+1)+'</b>'+s+'</span>').join('')+'</div>'+stepSummaryHtml+'<div class="booking-step">'+body+'</div><div class="booking-footer">'+(b.step>0?button('Back','booking-back','btn-outline'):'<span></span>')+button(confirmLabel,b.step===3?'booking-confirm':'booking-next','btn-primary',(b.step===3 && state.bookingBusy)?'disabled aria-disabled="true"':'')+'</div>';
}

function bookingSuccess(){
  const b = state.bookings[0] || { title: 'Service', date: '2026-11-20', time: '10:00 AM', professional: 'Specialist', type: 'home', status: 'confirmed', payment_status: 'completed' };
  const rawStatus = String(b.status || '').toLowerCase();
  const rawPay = String(b.payment_status || '').toLowerCase();
  const isConfirmed = rawStatus === 'confirmed' && rawPay !== 'pending' && rawPay !== 'expired' && rawPay !== 'failed';
  const badgeText = isConfirmed ? 'BOOKING CONFIRMED' : rawPay === 'expired' ? 'BOOKING EXPIRED' : 'BOOKING PENDING PAYMENT';
  const headingHtml = isConfirmed ? 'Your appointment is <em>confirmed.</em>' : 'Your booking is <em>pending payment.</em>';
  return '<main class="success-page"><div class="success-mark">'+icon(isConfirmed?'check':'clock',34)+'</div><p class="eyebrow">'+badgeText+'</p><h1>'+headingHtml+'</h1><p>'+esc(b.title)+' for '+formatDate(b.date)+' at '+esc(b.time)+'.'+(isConfirmed?' Details are saved in My bookings.':' Complete payment before expiry to confirm.')+'</p><div class="success-details"><span>EXPERIENCE <strong>'+(b.type==='home'?'At-home service':'Salon &amp; parlour')+'</strong></span><span>SPECIALIST <strong>'+esc(b.professional)+'</strong></span>'+(isConfirmed && b.arrival_otp?'<span>ARRIVAL PIN <strong>'+esc(b.arrival_otp)+'</strong></span>':'')+'</div><div class="success-actions">'+button('View my bookings '+icon('arrow',17),'account-bookings','btn-primary')+button('Keep exploring','landing','btn-outline')+'</div></main>';
}

const CONCIERGE_WHATSAPP_NUMBER = '916360849512';
const conciergeWaUrl = text => 'https://wa.me/' + CONCIERGE_WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text);

function getAiWelcomeMessage() {
  const city = currentLocationCity();
  const isMen = isMenExperience();
  const exp = state.experience || 'home';
  if (exp === 'shop') {
    return {
      sender: 'ai',
      text: `Welcome to GlamGo Beauty Store! Ask me for ${isMen ? 'men’s grooming, beard care, or skincare' : 'serums, clean makeup, or skincare'} tailored to your routine and budget.`,
      time: 'Just now',
      actions: [
        { label: isMen ? 'Beard & matte stylers' : 'Best serums under ₹1,500', prompt: isMen ? 'Recommend beard care and matte hair products' : 'Recommend a serum under ₹1500' },
        { label: 'Daily skincare routine', prompt: 'Build me a daily skincare routine from the Beauty Store' },
        { label: 'Chat on WhatsApp', url: conciergeWaUrl(`Hello GlamGo! I need skincare product advice from Beauty Store (${city}).`) }
      ]
    };
  }
  if (isMen) {
    return {
      sender: 'ai',
      text: `Welcome to GlamGo! I'm your AI Grooming Concierge for ${city}. Ask about at-home haircuts, beard sculpting, detox facials, or nearby grooming salons.`,
      time: 'Just now',
      actions: [
        { label: 'Beard sculpt & haircut', prompt: 'Recommend a haircut and beard sculpt at home' },
        { label: 'Men’s detox facial', prompt: 'Recommend a detox facial for men' },
        { label: `Salons in ${city}`, prompt: `Recommend top salons in ${city}` },
        { label: 'Chat on WhatsApp', url: conciergeWaUrl(`Hello GlamGo (${city})! I would like to inquire about men’s grooming services.`) }
      ]
    };
  }
  return {
    sender: 'ai',
    text: `Welcome to GlamGo! I'm your AI Beauty Concierge for ${city}. Ask for personalized skin, hair, bridal, or Beauty Store recommendations — or check your bookings.`,
    time: 'Just now',
    actions: [
      { label: 'Recommend a facial', prompt: 'Recommend a facial for glowing skin' },
      { label: 'Hair blowout at home', prompt: 'Tell me about at-home hair styling' },
      { label: `Salons in ${city}`, prompt: `Show me the best salons in ${city}` },
      { label: 'Chat on WhatsApp', url: conciergeWaUrl(`Hello GlamGo (${city})! I would like to inquire about booking a treatment.`) }
    ]
  };
}

function getAiQuickSuggestions() {
  const city = currentLocationCity();
  const isMen = isMenExperience();
  const exp = state.experience || 'home';
  const base = exp === 'shop'
    ? [
        [isMen ? 'Beard care' : 'Under ₹1,500 serums', isMen ? 'Recommend beard care products' : 'Best serums under ₹1500', 'spark'],
        ['Skincare routine', 'Build a skincare routine for glowing skin', 'sparkle'],
        ['Haircare picks', 'Best haircare products in the store', 'star']
      ]
    : isMen
      ? [
          ['Beard sculpt', 'Recommend a beard trim and haircut at home', 'spark'],
          ['Detox facial', 'Recommend a facial for men', 'sparkle'],
          [`Salons in ${city}`, `Top salons in ${city}`, 'salon'],
          ['Swedish massage', 'Tell me about massage packages', 'check']
        ]
      : [
          ['Glowing facial', 'Recommend a facial for glowing skin', 'spark'],
          ['Hair blowout', 'Tell me about at-home hair styling', 'sparkle'],
          ['Bridal makeup', 'Tell me about bridal and occasion makeup', 'star'],
          [`Salons in ${city}`, `Top salons in ${city}`, 'salon'],
          ['Beauty products', 'Recommend skincare products in the store', 'bag']
        ];
  if (state.signedIn) {
    base.push(['My bookings', 'Check my latest booking and Arrival PIN or orders', 'calendar']);
  }
  return base;
}

function conciergeContextWaUrl() {
  const city = currentLocationCity();
  const lastUser = [...(state.aiChatMessages || [])].reverse().find(m => m.sender === 'user');
  const note = lastUser
    ? `Hello GlamGo (${city})! Connecting from AI Concierge about: ${lastUser.text.slice(0, 120)}`
    : `Hello GlamGo (${city})! Connecting from AI chat for assistance.`;
  return conciergeWaUrl(note);
}

function floatingConciergeDock() {
  if (state.view === 'admin') return '';
  return '<aside class="floating-concierge-dock" aria-label="Customer concierge">' +
    '<div class="concierge-capsule-island">' +
      '<button type="button" class="capsule-ai-trigger ' + (state.aiChatOpen ? 'active' : '') + '" data-action="toggle-ai-chat" aria-label="Open GlamGo AI Beauty Concierge" title="GlamGo AI Beauty Concierge">' +
        '<span class="capsule-sparkle">✦</span>' +
        '<span class="capsule-label">AI Concierge</span>' +
        '<span class="capsule-badge">Ask AI</span>' +
      '</button>' +
      '<span class="capsule-divider"></span>' +
      '<a href="' + esc(conciergeWaUrl('Hello GlamGo! I would like to inquire about beauty services and salon appointments.')) + '" target="_blank" rel="noopener noreferrer" class="capsule-wa-trigger" aria-label="Chat with GlamGo on WhatsApp" title="WhatsApp Chat">' +
        icon('whatsapp', 16) +
        '<span class="capsule-wa-label">WhatsApp</span>' +
      '</a>' +
    '</div>' +
  '</aside>';
}

function aiChatDrawer() {
  if (state.view === 'admin') return '';
  const messages = (state.aiChatMessages && state.aiChatMessages.length) ? state.aiChatMessages : [getAiWelcomeMessage()];
  const hasConversation = Boolean(state.aiChatMessages && state.aiChatMessages.some(m => m.sender === 'user'));
  const suggestions = getAiQuickSuggestions();
  return '<div class="ai-chat-drawer ' + (state.aiChatOpen ? 'open' : '') + '" role="dialog" aria-modal="true" aria-label="GlamGo AI Concierge">' +
    '<div class="ai-chat-header">' +
      '<div class="ai-chat-profile">' +
        '<div class="ai-chat-avatar"><span>✦</span><i class="ai-online-dot"></i></div>' +
        '<div><h4>GlamGo AI Concierge</h4><p>Online · ' + esc(currentLocationCity()) + ' · Beauty Advisor</p></div>' +
      '</div>' +
      '<div class="ai-chat-actions">' +
        (hasConversation ? '<button type="button" class="ai-chat-reset-btn" data-action="ai-chat-reset" title="Start new chat">New</button>' : '') +
        '<a href="' + esc(conciergeContextWaUrl()) + '" target="_blank" rel="noopener noreferrer" class="ai-wa-link" title="Open WhatsApp">' + icon('whatsapp', 14) + ' WhatsApp</a>' +
        '<button type="button" class="ai-chat-close-btn" data-action="toggle-ai-chat" aria-label="Close chat">' + icon('close', 18) + '</button>' +
      '</div>' +
    '</div>' +
    '<div class="ai-chat-body" id="ai-chat-body">' +
      messages.map(m =>
        '<div class="ai-msg msg-' + m.sender + '">' +
          '<div class="ai-bubble">' + esc(m.text).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') + '</div>' +
          (m.actions && m.actions.length ?
            '<div class="ai-actions-wrap">' +
              m.actions.map(act => {
                const url = act.url ? safeHttpUrl(act.url) : '';
                if (url) {
                  return '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer" class="ai-action-btn ai-action-wa">' + icon('whatsapp', 14) + ' ' + esc(act.label) + ' ↗</a>';
                }
                return '<button type="button" class="ai-action-btn" data-action="' + esc(act.action || 'ai-prompt') + '"' +
                  (act.id ? ' data-id="' + esc(act.id) + '"' : '') +
                  (act.service_id ? ' data-service-id="' + esc(act.service_id) + '"' : '') +
                  (act.target ? ' data-target="' + esc(act.target) + '"' : '') +
                  (act.prompt ? ' data-prompt="' + esc(act.prompt) + '"' : '') +
                  '>' + esc(act.label) + ' →</button>';
              }).join('') +
            '</div>' : '') +
          '<span class="ai-time">' + esc(m.time || 'Just now') + '</span>' +
        '</div>'
      ).join('') +
      (state.aiChatBusy ? '<div class="ai-msg msg-ai"><div class="ai-bubble ai-typing-bubble">Curating the best match for you…</div></div>' : '') +
    '</div>' +
    '<div class="ai-chat-suggestions">' +
      suggestions.map(([label, prompt, ic]) =>
        '<button type="button" class="ai-sugg-pill" data-action="ai-prompt" data-prompt="' + esc(prompt) + '">' + icon(ic, 13) + ' ' + esc(label) + '</button>'
      ).join('') +
    '</div>' +
    '<form class="ai-chat-input-bar" id="ai-chat-form">' +
      '<input type="text" id="ai-chat-input" placeholder="Ask about treatments, salons, products, budget…" autocomplete="off" />' +
      '<button type="submit" class="ai-send-btn" aria-label="Send message"' + (state.aiChatBusy ? ' disabled' : '') + '>' + icon('arrow', 18) + '</button>' +
    '</form>' +
  '</div>';
}

function buildLocalAiReply(q) {
  const low = q.toLowerCase();
  if (low.includes('facial') || low.includes('skin') || low.includes('glow')) {
    return {
      reply: "For an instant radiant complexion, I recommend **The Signature Facial** (75 min, ₹1,499). It includes a gentle botanical cleanse, lymphatic massage, and an antioxidant vitamin infusion. Our verified specialists arrive with a sterile kit and fresh linens directly at your door.",
      actions: [
        { label: 'Book The Signature Facial (₹1,499)', action: 'book-home', id: 's1' },
        { label: 'View Skin Category', action: 'home-category', id: 'Skin' }
      ]
    };
  }
  if (low.includes('hair') || low.includes('blowout') || low.includes('styling')) {
    return {
      reply: "Our **Express Hair Styling** (45 min, ₹899) is ideal for polished blowouts, silk presses, or event curls. Our vetted hair stylists bring professional heat tools and styling serums to your home.",
      actions: [
        { label: 'Book Hair Styling (₹899)', action: 'book-home', id: 's2' },
        { label: 'View Hair Category', action: 'home-category', id: 'Hair' }
      ]
    };
  }
  if (low.includes('nail') || low.includes('manicure') || low.includes('pedicure')) {
    return {
      reply: "Treat your hands with the **Classic Manicure & Gel** (50 min, ₹699). Includes gentle cuticle care, shape refinement, nourishing hand massage, and long-wear chip-free polish.",
      actions: [
        { label: 'Book Classic Manicure (₹699)', action: 'book-home', id: 's3' },
        { label: 'View Nails Category', action: 'home-category', id: 'Nails' }
      ]
    };
  }
  if (low.includes('makeup') || low.includes('bridal') || low.includes('wedding') || low.includes('party')) {
    return {
      reply: "For special celebrations, our **Occasion & Bridal Makeup** (90 min, ₹2,499) provides bespoke high-definition looks using luxury, non-comedogenic cosmetics matched to your undertones.",
      actions: [
        { label: 'Book Occasion Makeup (₹2,499)', action: 'book-home', id: 's4' },
        { label: 'Explore Complete Glow Ritual', action: 'book-home', id: 's8' }
      ]
    };
  }
  if (low.includes('massage') || low.includes('spa') || low.includes('relax')) {
    return {
      reply: "Unwind with our **Relax & Restore Massage** (60 min, ₹1,799). A soothing, rhythmic full-body ritual using warm aromatic botanical oils.",
      actions: [{ label: 'Book Relax Massage (₹1,799)', action: 'book-home', id: 's5' }]
    };
  }
  if (low.includes('wax') || low.includes('waxing')) {
    return {
      reply: "Our **Smooth Botanical Waxing** (40 min, ₹599) uses gentle, low-heat strip-less peel wax and soothing aloe post-treatment care.",
      actions: [{ label: 'Book Botanical Waxing (₹599)', action: 'book-home', id: 's6' }]
    };
  }
  if (low.includes('thread') || low.includes('brow')) {
    return {
      reply: "Define your arches with the **Brow & Threading Precision Edit** (25 min, ₹299). Clean mapping and threading for a crisp, natural frame.",
      actions: [{ label: 'Book Brow Threading (₹299)', action: 'book-home', id: 's7' }]
    };
  }
  if (low.includes('package') || low.includes('complete glow')) {
    return {
      reply: "The **Complete Glow Ritual** (150 min, ₹3,299) is our premier head-to-toe package: combines a botanical facial, classic manicure, and polished salon blowout in a single visit.",
      actions: [{ label: 'Book Complete Glow (₹3,299)', action: 'book-home', id: 's8' }]
    };
  }
  if (low.includes('how') || low.includes('safe') || low.includes('sterile') || low.includes('hygiene') || low.includes('work')) {
    return {
      reply: "Booking with GlamGo takes 60 seconds: 1) Pick your treatment with upfront pricing, 2) Select your verified specialist, 3) Choose date, time slot & address, 4) Specialist arrives with hospital-grade sanitized tools in sealed pouches.",
      actions: [
        { label: 'Browse Treatments', action: 'scroll', target: 'popular' },
        { label: 'Chat with Support on WhatsApp', url: conciergeWaUrl('Hi GlamGo! I have a question about at-home treatments.') }
      ]
    };
  }
  if (low.includes('whatsapp') || low.includes('contact') || low.includes('call') || low.includes('human') || low.includes('support')) {
    return {
      reply: "Our dedicated customer care team is available on WhatsApp daily from 8:00 AM to 9:00 PM for custom bridal bookings, urgent questions, or personalized requests.",
      actions: [{ label: 'Chat on WhatsApp ↗', url: conciergeWaUrl('Hello GlamGo! Connecting from AI chat for assistance.') }]
    };
  }
  return {
    reply: "I'm delighted to assist you with GlamGo! We offer certified at-home beauty treatments, local salon chair bookings, and clean beauty store products across " + (state.location || 'your area') + ". What service can I help you book today?",
    actions: [
      { label: 'The Signature Facial (₹1,499)', action: 'book-home', id: 's1' },
      { label: 'Hair Blowout & Styling (₹899)', action: 'book-home', id: 's2' },
      { label: 'Chat on WhatsApp', url: conciergeWaUrl('Hi GlamGo! I would like more information.') }
    ]
  };
}

async function handleAiUserMessage(query) {
  const q = String(query || '').trim();
  if (!q || state.aiChatBusy) return;
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (!state.aiChatMessages) state.aiChatMessages = [getAiWelcomeMessage()];
  const history = state.aiChatMessages
    .slice(-8)
    .map(m => ({ role: m.sender === 'user' ? 'user' : 'ai', text: String(m.text || '').slice(0, 600) }))
    .filter(m => m.text);
  state.aiChatMessages.push({
    sender: 'user',
    text: q,
    time: now
  });
  state.aiChatBusy = true;
  render();
  setTimeout(() => {
    const el = document.getElementById('ai-chat-body');
    if (el) el.scrollTop = el.scrollHeight;
  }, 30);

  let replyPayload;
  try {
    replyPayload = await apiConciergeChat({
      message: q,
      location: state.location || '',
      city: currentLocationCity(),
      audience: state.audience || 'women',
      experience: state.experience || 'home',
      history
    });
  } catch {
    replyPayload = buildLocalAiReply(q);
  } finally {
    state.aiChatBusy = false;
  }

  state.aiChatMessages.push({
    sender: 'ai',
    text: replyPayload?.reply || "I'm here to help you book beauty treatments or connect on WhatsApp.",
    actions: Array.isArray(replyPayload?.actions) ? replyPayload.actions : [],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  render();
  setTimeout(() => {
    const el = document.getElementById('ai-chat-body');
    if (el) el.scrollTop = el.scrollHeight;
    document.getElementById('ai-chat-input')?.focus();
  }, 50);
}

function render(){
  const customerTheme = ['landing','service-detail','salon-detail','product-detail','account','cart','checkout','order-success','tracking','booking-success'].includes(state.view);
  document.body.classList.toggle('theme-men', customerTheme && isMenExperience());
  if (state.modal !== 'location' && locationDraft) { locationDraft = null; locationLookupSeq++; locationSearchSeq++; clearTimeout(locationSearchTimer); }
  destroyActiveMaps();
  if(state.view === 'public'){
    app.innerHTML = renderAppDownloadBanner(state.appBannerDismissed) +
      publicLanding({ signedIn: state.signedIn, experience: state.experience, menu: state.publicMenu, icon }) +
      renderAppDownloadModal({
        open: state.appDownloadModal,
        phone: state.appSharePhone,
        statusMsg: state.appShareStatus,
        errorMsg: state.appShareError,
        esc
      });
    document.body.classList.toggle('modal-open', Boolean(state.appDownloadModal));
    return;
  }
  if(state.view === 'auth' || (!state.signedIn && PROTECTED_VIEWS.has(state.view))){ app.innerHTML = auth(); document.body.classList.remove('modal-open'); return; }
  if(state.view === 'onboarding'){ app.innerHTML = onboarding(); document.body.classList.remove('modal-open'); return; }
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
  const activeExp = state.experience || 'home';
  let page = state.view==='landing' ? (activeExp==='home'?homePage():activeExp==='salon'?salonPage():shopPage()) : state.view==='service-detail'?serviceDetail():state.view==='salon-detail'?salonDetail():state.view==='product-detail'?productDetail():state.view==='account'?account():state.view==='cart'?cartPage():state.view==='checkout'?checkoutPage():state.view==='order-success'?orderSuccess():state.view==='tracking'?trackingPage():state.view==='booking-success'?bookingSuccess():state.view==='partner'?partnerPage():homePage();
  const appBannerHtml = renderAppDownloadBanner(state.appBannerDismissed);
  const appModalHtml = renderAppDownloadModal({
    open: state.appDownloadModal,
    phone: state.appSharePhone,
    statusMsg: state.appShareStatus,
    errorMsg: state.appShareError,
    esc
  });
  app.innerHTML = appBannerHtml + (isDemoCatalogue ? '<div class="demo-catalogue-notice" role="status">Local demo catalogue · Sample listings and prices · Bookings and checkout are disabled</div>' : hasLocalDemo ? '<div class="demo-catalogue-notice" role="status">Local preview · DEMO listings and prices are samples and cannot be booked or purchased</div>' : '') + header() + page + footer() + mobileNav() + modal() + appModalHtml + floatingConciergeDock() + aiChatDrawer();
  document.body.classList.toggle('modal-open', Boolean(state.modal || state.mobileMenu || state.filterDrawerOpen || state.appDownloadModal));
  if(state.modal === 'location'){
    void mountLocationPickerMap();
  }
}

function openBooking(type, itemId, serviceId = null, pro = null){
  if (isPreviewId(itemId) || isPreviewId(serviceId)) { toast('Demo listings are for preview only and cannot be booked.'); return; }
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
  if (el.closest('.ai-chat-drawer') && !['toggle-ai-chat', 'ai-prompt', 'ai-chat-reset'].includes(a)) {
    state.aiChatOpen = false;
  }
  if ((a === 'buy-now' && isPreviewId(id)) || (a === 'checkout' && Object.keys(state.cart || {}).some(key => isPreviewId(parseCartKey(key).productId)))) { toast('Remove demo items before checking out with real products.'); return; }
  if(isDemoCatalogue && ['book-home','book-salon','book-pro','checkout','buy-now'].includes(a)){ toast('Demo listings are for preview only. Booking and checkout are unavailable.'); return; }
  if(a==='ai-chat-reset'){
    state.aiChatMessages = null;
    render();
    document.getElementById('ai-chat-input')?.focus();
    return;
  }
  if(a==='toggle-ai-chat'){
    state.aiChatOpen = !state.aiChatOpen;
    render();
    if(state.aiChatOpen){
      setTimeout(()=>{
        document.getElementById('ai-chat-input')?.focus();
        const b = document.getElementById('ai-chat-body');
        if(b) b.scrollTop = b.scrollHeight;
      }, 50);
    }
    return;
  }
  if(a==='ai-prompt'){
    const p = el.dataset.prompt;
    if(p) handleAiUserMessage(p);
    return;
  }
  if(a==='public-home'){
    pendingAuthResume=null; state.publicMenu=false; state.experience='home'; state.view='landing'; state.activeNav='landing'; persist();
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
  else if(a==='guest-browse'){ pendingAuthResume=null; state.mobileMenu=false; state.menu=false; state.experience=state.experience||'home'; state.view='landing'; render(); window.scrollTo({top:0,behavior:'instant'}); }
  else if(a==='landing'){ state.activeNav='landing'; navigate('landing'); }
  else if(a==='experience') setExperience(id);
  else if(a==='toggle-password'){
    const input = el.closest('.password-field')?.querySelector('input');
    if(!input) return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    el.innerHTML = icon(show ? 'eyeOff' : 'eye', 18);
    el.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    el.setAttribute('aria-pressed', show ? 'true' : 'false');
    return;
  }
  else if(a==='app-download-open'){
    state.appDownloadModal = true;
    state.appShareError = '';
    state.appShareStatus = '';
    render();
  }
  else if(a==='app-download-close'){
    state.appDownloadModal = false;
    render();
  }
  else if(a==='app-download-dismiss'){
    dismissAppBanner();
    state.appBannerDismissed = true;
    render();
  }
  else if(a==='app-store-click'){
    e?.preventDefault?.();
    toast((id || 'GlamGo App') + ' download link ready — scan QR or enter your number below.');
  }
  else if(a==='audience-set'){
    if (!['women','men'].includes(id)) return;
    state.audience = id;
    if (id === 'men' && !['All','Hair','Skin','Spa','Packages','Beard'].includes(state.homeCategory)) state.homeCategory = 'All';
    if (id === 'men' && !['All','Hair','Skin','Spa','Beard'].includes(state.salonCategory)) state.salonCategory = 'All';
    if (id === 'women' && state.homeCategory === 'Beard') state.homeCategory = 'All';
    if (id === 'women' && state.salonCategory === 'Beard') state.salonCategory = 'All';
    if (id === 'women' && state.shopCategory === 'Beard Care') state.shopCategory = 'All';
    state.filterDrawerOpen = false; state.filterDrawerDraft = null;
    persist(); render();
    document.querySelector('.audience-choice[data-id="'+id+'"]')?.focus({ preventScroll: true });
  }
  else if(a==='admin-save-audience'){
    const value = document.getElementById('service-audience-'+id)?.value;
    try { await apiRequest('/admin/catalog/service/'+encodeURIComponent(id)+'/audience', { method:'PUT', body:JSON.stringify({audience:value}) }); toast('Service audience saved'); await loadAdminData(); } catch(err){ toast(err.message || 'Could not save audience'); }
  }
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
    state.mobileMenu=!state.mobileMenu; state.menu=false;
    render();
    if(state.mobileMenu) document.querySelector('#mobile-menu-drawer .mobile-menu-close')?.focus();
    else document.getElementById('mobile-menu-trigger')?.focus();
  }
  else if(a==='mobile-toggle'){
    state.mobileMenu=!state.mobileMenu;
    state.filterDrawerOpen=false;
    render();
    if(state.mobileMenu) document.querySelector('#mobile-menu-drawer .mobile-menu-close')?.focus();
    else document.getElementById('mobile-menu-trigger')?.focus();
  }
  else if(a==='mobile-close'){
    state.mobileMenu=false;
    render();
    document.getElementById('mobile-menu-trigger')?.focus();
  }
  else if(a==='exp-filter-toggle'){
    const exp = el.dataset.exp || state.experience || 'shop';
    state.mobileMenu = false;
    if(window.innerWidth <= 950){
      state.filterDrawerDraft = { ...getFiltersForExp(exp) };
      state.filterDrawerOpen = true;
      render();
      document.querySelector('#exp-filter-drawer .filter-drawer-close')?.focus();
    } else {
      if(!state.filterOpen) state.filterOpen = { home: false, salon: false, shop: false };
      state.filterOpen[exp] = !state.filterOpen[exp];
      render();
      document.getElementById('exp-filter-trigger')?.focus();
    }
  }
  else if(a==='exp-filter-drawer-close'){
    state.filterDrawerOpen = false;
    state.filterDrawerDraft = null;
    render();
    document.getElementById('exp-filter-trigger')?.focus();
  }
  else if(a==='exp-filter-drawer-reset'){
    const exp = el.dataset.exp || state.filterDrawerDraft?.exp || state.experience || 'shop';
    state.filterDrawerDraft = defaultFiltersForExp(exp);
    render();
    document.querySelector('#exp-filter-drawer [data-action="exp-filter-drawer-reset"]')?.focus();
  }
  else if(a==='exp-filter-drawer-apply'){
    const exp = el.dataset.exp || state.filterDrawerDraft?.exp || state.experience || 'shop';
    if(state.filterDrawerDraft){
      applyFiltersToExp(exp, state.filterDrawerDraft);
    }
    state.filterDrawerOpen = false;
    state.filterDrawerDraft = null;
    persist();
    render();
    document.getElementById('exp-filter-trigger')?.focus();
  }
  else if(a==='exp-clear-filter'){
    const exp = el.dataset.exp || state.experience || 'shop';
    const key = el.dataset.key;
    const cur = getFiltersForExp(exp);
    if(key === 'price'){ cur.minPrice = ''; cur.maxPrice = ''; }
    else if(key === 'sort') cur.sort = exp === 'salon' ? 'distance-asc' : 'featured';
    else if(key === 'availability') cur.availability = 'all';
    else if(key === 'distance') cur.distance = 'all';
    else if(key === 'category') cur.category = 'All';
    else if(key === 'collection') cur.collection = 'All';
    else if(key === 'brand') cur.brand = 'All';
    applyFiltersToExp(exp, cur);
    persist();
    render();
  }
  else if(a==='exp-reset-all'){
    const exp = el.dataset.exp || state.experience || 'shop';
    applyFiltersToExp(exp, defaultFiltersForExp(exp));
    persist();
    render();
  }
  else if(a==='quick-view'){
    state.quickViewProductId = id;
    ensureProductExtras(id);
    state.modal = 'quick-view';
    render();
  }
  else if(a==='quick-view-variant'){
    if(!state.quickSelectedVariants) state.quickSelectedVariants = {};
    if(state.quickViewProductId) state.quickSelectedVariants[state.quickViewProductId] = id;
    render();
  }
  else if(a==='quick-add-variant'){
    const prod = products.find(p => String(p.id) === String(id));
    if(!prod) return;
    const variant = el.dataset.variant || '';
    const chosenListingId = (variant && prod.variant_listings?.[variant]) || prod.default_listing_id || null;
    if(getStockInfo(prod, variant).soldOut || prod.in_stock === false || prod.soldOut === true) return;
    if(!state.quickSelectedVariants) state.quickSelectedVariants = {};
    state.quickSelectedVariants[id] = variant;
    const cartKey = makeCartKey(id, variant, chosenListingId);
    state.cart[cartKey] = (state.cart[cartKey] || 0) + 1;
    invalidateCheckoutState(true);
    if(variant){
      if(!state.cartVariants) state.cartVariants = {};
      state.cartVariants[id] = variant;
    }
    state.addedCartIds = { ...(state.addedCartIds || {}), [id]: true };
    clearTimeout(addedCartTimers[id]);
    addedCartTimers[id] = setTimeout(() => {
      if(state.addedCartIds?.[id]){
        delete state.addedCartIds[id];
        if(canSafelyBackgroundRender()) render();
      }
    }, 1500);
    persist();
    render();
    toast((variant ? variant + ' added' : 'Added') + ' to your beauty bag');
  }
  else if(a==='location'){ state.mobileMenu=false; state.menu=false; locationDraft={ label: state.location, city: state.locationCity || '', coords: state.userCoords, pending: false }; state.modal='location'; render(); }
  else if(a==='location-set'){
    if(state.modal === 'location' && locationDraft){
      locationLookupSeq++; locationSearchSeq++; clearTimeout(locationSearchTimer); hideLocationAutocomplete();
      Object.assign(locationDraft, { label: id, city: normalizeCity(id), coords: null, pending: false });
      const input = document.getElementById('location-search-input');
      if(input) input.value = id;
      const save = document.querySelector('#location-form button[type="submit"]');
      if(save) save.disabled = false;
      const pinCoords = resolveSalonCoords({ area: id }) || AREA_COORDS.mumbai;
      if(activeLocationMap) activeLocationMap.setView(pinCoords, 13);
      if(activeLocationMarker) activeLocationMarker.setLatLng(pinCoords);
      return;
    }
    state.location=id;
    state.locationCity=normalizeCity(id);
    state.userCoords=null;
    state.salonDistanceFilter='all';
    state.modal=null;
    persist();
    void loadCatalogFeeds();
    render();
    toast('Location updated to ' + normalizeCity(id));
  }
  else if(a==='location-pick'){
    if (!locationDraft) return;
    const label = el.dataset.label || '';
    const city = el.dataset.city || '';
    locationSearchSeq++; clearTimeout(locationSearchTimer);
    const lat = Number(el.dataset.lat), lng = Number(el.dataset.lng);
    locationLookupSeq++;
    Object.assign(locationDraft, { label, city: city ? normalizeCity(city) : '', coords: Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null, pending: false });
    if(locationDraft.coords){
      activeLocationMap?.setView(locationDraft.coords, 14);
      activeLocationMarker?.setLatLng(locationDraft.coords);
    }
    const input = document.getElementById('location-search-input');
    if(input) input.value = label;
    const save = document.querySelector('#location-form button[type="submit"]');
    if(save) save.disabled = false;
    hideLocationAutocomplete();
  }
  else if(a==='map-locate'){
    if(!navigator.geolocation){ toast('Geolocation is not supported in this browser.'); return; }
    const draft = locationDraft;
    const request = ++locationLookupSeq;
    if (!draft) return;
    draft.pending = true;
    const save = document.querySelector('#location-form button[type="submit"]');
    if (save) save.disabled = true;
    toast('Finding your location...');
    navigator.geolocation.getCurrentPosition(
      pos => {
        if (draft !== locationDraft || request !== locationLookupSeq || state.modal !== 'location') return;
        const { latitude: lat, longitude: lng } = pos.coords;
        activeLocationMap?.setView([lat, lng], 14);
        activeLocationMarker?.setLatLng([lat, lng]);
        void selectLocationCoords(lat, lng);
      },
      err => {
        if (draft !== locationDraft || request !== locationLookupSeq || state.modal !== 'location') return;
        draft.pending = false;
        if (save) save.disabled = false;
        toast(err?.code === 1 ? 'Location blocked in browser settings — tap the map or type your area.' : 'Unable to fetch GPS right now — tap the map or type your area.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }
  else if(a==='live-location'){ requestLiveLocation({ silent: false }); }
  else if(a==='salon-sort'){ state.salonSort=id||'distance-asc'; render(); }
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
    applyFiltersToExp('shop', defaultFiltersForExp('shop'));
    state.activeNav='landing';
    scrollLockUntil = Date.now() + 700;
    persist();
    if(state.view!=='landing') navigate('landing'); else render();
    window.scrollTo({top:0,behavior:'smooth'});
  }
  else if(a==='explore-bestsellers'){
    state.experience='shop';
    applyFiltersToExp('shop', { ...defaultFiltersForExp('shop'), collection: 'BESTSELLER' });
    state.activeNav='bestsellers';
    scrollLockUntil = Date.now() + 800;
    persist();
    navigate('landing');
    setTimeout(()=>document.getElementById('bestsellers')?.scrollIntoView({behavior:'smooth'}),80);
  }
  else if(a==='home-category'){
    const fromShelf = Boolean(el.closest('#popular'));
    state.homeCategory=id; state.activeNav='popular'; state.view='landing'; render();
    if(!fromShelf) document.getElementById('popular')?.scrollIntoView({behavior:'smooth'});
  }
  else if(a==='salon-category'){
    const fromShelf = Boolean(el.closest('#salons'));
    state.salonCategory=id; state.activeNav='salons'; state.view='landing'; render();
    if(!fromShelf) document.getElementById('salons')?.scrollIntoView({behavior:'smooth'});
  }
  else if(a==='shop-category'){
    const fromShelf = Boolean(el.closest('#bestsellers'));
    const wasLanding = state.view === 'landing';
    state.experience='shop';
    state.shopCategory=id || 'All';
    state.activeNav = el.closest('#shop-categories') ? 'categories' : 'bestsellers';
    scrollLockUntil = Date.now() + 700;
    persist();
    if(!wasLanding) navigate('landing'); else render();
    if(!fromShelf || !wasLanding) setTimeout(()=>document.getElementById('bestsellers')?.scrollIntoView({behavior:'smooth'}),80);
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
    state.shopSort='featured';
    render();
  }
  else if(a==='shop-reset'){
    applyFiltersToExp('shop', defaultFiltersForExp('shop'));
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
  else if(a==='book-salon'){
    const salonObj = salons.find(x => String(x.id) === String(id));
    const explicitId = el.dataset.serviceId || null;
    const catSvcId = el.dataset.service
      ? ((salonObj?.menu_services || []).find(s => s.category === el.dataset.service)?.id || services.find(s => s.category === el.dataset.service)?.id)
      : null;
    openBooking('salon', id, explicitId || catSvcId);
  }
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
  else if(a==='cart-remove-unavailable'){
    Object.keys(state.cart || {}).forEach(key => {
      if (Number(state.cart[key]) > 0 && !products.some(p => String(p.id) === parseCartKey(key).productId)) {
        delete state.cart[key];
      }
    });
    invalidateCheckoutState(true);
    persist();
    render();
    toast('Unavailable items removed');
  }
  else if(a==='coupon-remove'){
    state.coupon = '';
    state.couponDiscount = 0;
    invalidateCheckoutState(false);
    persist();
    render();
    toast('Coupon removed');
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
        order_id: payOrder.razorpay_order_id || payOrder.order_id,
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
    if(state.authMode === 'email_otp') state.authEmailOtpStage = 'request';
    if(state.authMode === 'reset') state.authResetStage = 'request';
    render();
  }
  else if(a==='auth-otp-restart'){ state.authOtpStage='request'; state.authDevHint=''; state.authDevOtpPrefill=''; render(); }
  else if(a==='auth-email-otp-restart'){ state.authEmailOtpStage='request'; state.authDevHint=''; state.authDevOtpPrefill=''; render(); }
  else if(a==='auth-reset-restart'){ state.authResetStage='request'; state.authDevHint=''; render(); }
  else if(a==='autofill-otp'){
    state.authDevOtpPrefill = id;
    const input = document.getElementById('auth-otp-input');
    if (input) input.value = id;
    render();
  }
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
      if(state.editingPartnerService?.service?.id === id) state.editingPartnerService = null;
      persist();
      render();
      toast('Service removed');
      await Promise.allSettled([loadPartnerData(), loadCatalogFeeds()]);
    } catch(err) {
      toast(err.message || 'Failed to remove service');
    }
  }
  else if(a==='partner-pro-service-edit'){
    const svc = (state.partnerProServices || []).find(s => String(s.id) === String(id));
    if(svc){
      state.editingPartnerService = { role: 'Professional', service: svc };
      render();
      document.getElementById('partner-pro-custom-service-form')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
  else if(a==='partner-salon-service-edit'){
    const svc = (state.partnerSalonServices || []).find(s => String(s.id) === String(id));
    if(svc){
      state.editingPartnerService = { role: 'Salon Owner', service: svc };
      render();
      document.getElementById('partner-salon-service-form')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
  else if(a==='partner-service-edit-cancel'){
    state.editingPartnerService = null;
    render();
  }
  else if(a==='partner-salon-service-delete'){
    if(!confirm('Remove this service from your salon menu?')) return;
    try {
      await apiDeleteSalonService(id);
      state.partnerSalonServices = (state.partnerSalonServices || []).filter(s => String(s.id) !== String(id));
      if(state.editingPartnerService?.service?.id === id) state.editingPartnerService = null;
      toast('Salon service removed');
      await Promise.allSettled([loadPartnerData(), loadCatalogFeeds()]);
    } catch(err) {
      toast(err.message || 'Failed to remove salon service');
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
  else if(a==='booking-service'){ if(isPreviewId(id)){ toast('Demo services cannot be booked.'); return; } state.booking.serviceId=id; render(); }
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
    if (isPreviewId(state.booking?.serviceId) || isPreviewId(state.booking?.itemId)) { toast('Demo listings cannot be booked.'); return; }
    if(state.bookingBusy) return;
    if(!requireAuth({ view: state.experience ? 'landing' : 'onboarding' }, 'Sign in to confirm your booking')) return;
    const b = state.booking;
    const salon = salons.find(x => String(x.id) === String(b.itemId));
    const s = (salon?.menu_services || []).find(x => String(x.id) === String(b.serviceId)) || services.find(x => String(x.id) === String(b.serviceId));
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
          order_id: payOrder.razorpay_order_id || payOrder.order_id,
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
  if (role !== 'admin' && window.location.hash === '#admin') {
    history.replaceState(null, '', '#home');
  }
  state.experience = state.experience || 'home';
  state.view = 'landing';
  return null;
}

document.addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target, d = new FormData(f);
  if(f.id === 'ai-chat-form'){
    const input = document.getElementById('ai-chat-input');
    const msg = input ? input.value : '';
    if(msg){
      input.value = '';
      handleAiUserMessage(msg);
    }
    return;
  }
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
        audience: String(d.get('audience')),
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
      state.authDevHint = '';
      state.authDevOtpPrefill = '';
      render();
      toast(res?.message || 'Verification code sent to your mobile phone.');
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
  if(f.id === 'auth-email-otp-request-form'){
    const email = String(d.get('email') || '').trim();
    try {
      const res = await apiRequestEmailOtp(email);
      state.authEmailOtpEmail = email;
      state.authEmailOtpStage = 'verify';
      state.authDevHint = '';
      state.authDevOtpPrefill = '';
      render();
      toast(res?.message || 'Verification code sent to your email. Please check your inbox.');
    } catch (err) {
      toast(err.message || 'Could not send Email OTP');
    }
    return;
  }
  if(f.id === 'auth-email-otp-verify-form'){
    const otp = String(d.get('otp') || '').trim();
    try {
      const res = await apiVerifyEmailOtp(state.authEmailOtpEmail, otp);
      state.signedIn = true;
      state.user = { id: res.user_id, name: res.name, email: res.email || state.authEmailOtpEmail, phone: res.phone || '', role: res.role };
      state.authMode = 'signin';
      state.authEmailOtpStage = 'request';
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
      toast(err.message || 'Invalid or expired OTP');
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
    if (!nextLoc || locationDraft?.pending) return;
    const matchesDraft = locationDraft && nextLoc === locationDraft.label;
    state.location = nextLoc;
    state.locationCity = matchesDraft ? (locationDraft.city || normalizeCity(nextLoc)) : normalizeCity(nextLoc);
    state.userCoords = matchesDraft ? locationDraft.coords : null;
    state.salonDistanceFilter = 'all';
    state.modal = null;
    persist();
    void loadCatalogFeeds();
    render();
    toast('Location updated to ' + currentLocationCity());
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
  else if(f.id === 'app-download-share-form'){
    const raw = String(d.get('phone') || '').replace(/\D/g, '');
    state.appSharePhone = raw.slice(0, 10);
    if (!/^[6-9]\d{9}$/.test(state.appSharePhone)) {
      state.appShareStatus = '';
      state.appShareError = 'Please enter a valid 10-digit Indian mobile number.';
    } else {
      state.appShareError = '';
      state.appShareStatus = 'App download link sent via SMS to +91 ' + state.appSharePhone + '!';
      toast('App link sent to +91 ' + state.appSharePhone);
    }
    render();
    return;
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
        audience: String(d.get('audience')),
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
  else if(f.id === 'partner-salon-service-form'){
    try {
      const editId = String(d.get('service_id') || '').trim();
      const payload = {
        name: String(d.get('name') || '').trim(),
        category: String(d.get('category') || 'Hair').trim(),
        price: parseFloat(String(d.get('price') || '0')),
        duration: String(d.get('duration') || '45 min').trim(),
        audience: String(d.get('audience') || 'unisex'),
        img: String(d.get('img') || '').trim() || null,
        desc: String(d.get('desc') || '').trim()
      };
      if(editId){
        await apiUpdateSalonService(editId, payload);
        toast('Salon service updated!');
      } else {
        await apiCreateSalonService(payload);
        toast('Salon service added to your menu!');
      }
      state.editingPartnerService = null;
      await Promise.allSettled([loadPartnerData(), loadCatalogFeeds()]);
    } catch(err) {
      toast(err.message || 'Failed to save salon service');
    }
  }
  else if(f.id === 'partner-pro-custom-service-form'){
    try {
      const editId = String(d.get('service_id') || '').trim();
      const payload = {
        name: String(d.get('name') || '').trim(),
        category: String(d.get('category') || 'Skin').trim(),
        price: parseFloat(String(d.get('price') || '0')),
        duration: String(d.get('duration') || '45 min').trim(),
        audience: String(d.get('audience') || 'unisex'),
        cities: String(d.get('cities') || '').trim() || null,
        img: String(d.get('img') || '').trim() || null,
        desc: String(d.get('desc') || '').trim()
      };
      if(editId){
        await apiUpdateProfessionalCustomService(editId, payload);
        toast('Custom service updated!');
      } else {
        await apiCreateProfessionalCustomService(payload);
        toast('Custom service published to your profile!');
      }
      state.editingPartnerService = null;
      await Promise.allSettled([loadPartnerData(), loadCatalogFeeds()]);
    } catch(err) {
      toast(err.message || 'Failed to save custom service');
    }
  }
  else if(f.id === 'partner-salon-profile-form'){
    try {
      const res = await apiUpdateSalonProfile({
        name: String(d.get('name')).trim(),
        area: String(d.get('area')).trim(),
        audience: String(d.get('audience')),
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
        audience: String(d.get('audience')),
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

let locationSearchTimer = null;
let locationSearchSeq = 0;
function hideLocationAutocomplete() {
  const dd = document.getElementById('location-autocomplete-list');
  if (dd) {
    dd.hidden = true;
  }
}

document.addEventListener('pointerdown', e => {
  const dd = document.getElementById('location-autocomplete-list');
  if (dd && !dd.hidden && !e.target.closest('.gg-loc-field')) {
    hideLocationAutocomplete();
  }
});

document.addEventListener('focusout', e => {
  if (e.target && e.target.id === 'location-search-input') {
    setTimeout(() => {
      if (!document.activeElement?.closest('.gg-loc-field')) {
        hideLocationAutocomplete();
      }
    }, 160);
  }
});

document.addEventListener('input', e => {
  if(e.target.id === 'location-search-input'){
    clearTimeout(locationSearchTimer);
    locationLookupSeq++;
    if (locationDraft) { locationDraft.pending = false; locationDraft.label = e.target.value; locationDraft.city = ''; locationDraft.coords = null; }
    const save = document.querySelector('#location-form button[type="submit"]');
    if (save) save.disabled = false;
    const seq = ++locationSearchSeq;
    const val = e.target.value;
    const dd = document.getElementById('location-autocomplete-list');
    if(!dd) return;
    if(val.trim().length < 2){
      dd.hidden = true;
      dd.innerHTML = '';
      return;
    }
    dd.hidden = false;
    dd.innerHTML = '<div class="gg-loc-status">Searching locations…</div>';
    locationSearchTimer = setTimeout(async () => {
      const results = await searchLocationSuggestions(val);
      if(seq !== locationSearchSeq) return;
      const box = document.getElementById('location-autocomplete-list');
      if(!box) return;
      if(!results.length){
        box.innerHTML = '<div class="gg-loc-status">No matching places found</div>';
        return;
      }
      box.innerHTML = results.map(item =>
        '<button type="button" class="gg-loc-option" role="option" data-action="location-pick" data-label="' + esc(item.full) + '" data-city="' + esc(item.city || '') + '" data-lat="' + item.lat + '" data-lng="' + item.lng + '">' +
          icon('pin', 15) +
          '<span><strong>' + esc(item.label) + '</strong>' + (item.sub ? '<small>' + esc(item.sub) + '</small>' : '') + '</span>' +
        '</button>'
      ).join('');
    }, 260);
    return;
  }
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
  if(e.target.dataset.filterExp && (e.target.dataset.filterField === 'minPrice' || e.target.dataset.filterField === 'maxPrice')){
    const exp = e.target.dataset.filterExp;
    const mode = e.target.dataset.filterMode;
    const field = e.target.dataset.filterField;
    const raw = String(e.target.value || '').replace(/[^0-9]/g, '');
    const pos = Math.min(raw.length, e.target.selectionStart ?? raw.length);
    const fid = e.target.id;
    if(mode === 'draft'){
      if(!state.filterDrawerDraft) state.filterDrawerDraft = { ...getFiltersForExp(exp) };
      state.filterDrawerDraft[field] = raw;
    } else {
      const cur = getFiltersForExp(exp);
      cur[field] = raw;
      applyFiltersToExp(exp, cur);
    }
    render();
    const restored = fid ? document.getElementById(fid) : null;
    if(restored){
      restored.focus();
      try { restored.setSelectionRange(pos, pos); } catch {}
    }
  }
});

document.addEventListener('change', async e => {
  if(e.target.dataset.filterExp && e.target.dataset.filterField && e.target.dataset.filterField !== 'minPrice' && e.target.dataset.filterField !== 'maxPrice'){
    const exp = e.target.dataset.filterExp;
    const mode = e.target.dataset.filterMode;
    const field = e.target.dataset.filterField;
    const fid = e.target.id;
    let val = e.target.value;
    if(field === 'availability'){
      const scope = e.target.closest('.filter-sidebar, .filter-drawer') || document;
      const checked = Array.from(scope.querySelectorAll('input[data-filter-field="availability"]:checked')).map(x => x.value);
      val = checked.length === 1 ? checked[0] : 'all';
    }
    if(mode === 'draft'){
      if(!state.filterDrawerDraft) state.filterDrawerDraft = { ...getFiltersForExp(exp) };
      state.filterDrawerDraft[field] = val;
    } else {
      const cur = getFiltersForExp(exp);
      cur[field] = val;
      applyFiltersToExp(exp, cur);
      persist();
    }
    render();
    if(fid) document.getElementById(fid)?.focus();
    else {
      const match = document.querySelector((mode === 'draft' ? '#exp-filter-drawer' : '#exp-filter-panel-' + exp) + ' input[data-filter-field="' + field + '"][value="' + CSS.escape(e.target.value) + '"]');
      match?.focus();
    }
    return;
  }
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
  if(e.key === 'Tab'){
    const filterDrawer = state.filterDrawerOpen ? document.getElementById('exp-filter-drawer') : null;
    const mobileDrawer = state.mobileMenu ? document.getElementById('mobile-menu-drawer') : null;
    const activeModal = state.modal ? document.querySelector('.modal') : null;
    if(filterDrawer) trapFocusIn(filterDrawer, e);
    else if(mobileDrawer) trapFocusIn(mobileDrawer, e);
    else if(activeModal) trapFocusIn(activeModal, e);
  }
  if(e.key === 'Escape' && state.view === 'public' && state.publicMenu){
    state.publicMenu = false;
    render();
    document.querySelector('.public-menu-toggle')?.focus();
  }
  if(e.key === 'Escape' && state.filterDrawerOpen){
    state.filterDrawerOpen = false;
    state.filterDrawerDraft = null;
    render();
    document.getElementById('exp-filter-trigger')?.focus();
    return;
  }
  if(e.key === 'Escape' && state.mobileMenu){
    state.mobileMenu = false;
    render();
    document.getElementById('mobile-menu-trigger')?.focus();
    return;
  }
  if(e.key === 'Escape'){
    const dd = document.getElementById('location-autocomplete-list');
    if (dd && !dd.hidden && document.activeElement?.id === 'location-search-input') {
      e.preventDefault();
      hideLocationAutocomplete();
      return;
    }
  }
  if(e.key === 'Escape' && (state.modal || state.menu)){
    state.modal = null;
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
  requestLiveLocation({ silent: true });
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
