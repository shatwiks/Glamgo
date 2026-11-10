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
  apiValidateCoupon,
  apiCreateOrder,
  apiGetMyOrders,
  apiGetPartnerOverview,
  apiGetPartnerDrafts,
  apiCreatePartnerDraft,
  apiGetAvailability,
  apiToggleAvailability,
  apiGetAdminStats,
  apiGetAdminUsers,
  apiToggleUserStatus,
  apiGetAdminBookings,
  apiGetAdminOrders,
  apiCreateReview,
  apiGetReviews,
  apiGetMyReviews
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

let services = [
  {id:'s1',name:'The Signature Facial',category:'Skin',price:1499,duration:'75 min',rating:'4.9',reviews:126,img:images.facial,desc:'A restorative cleanse, massage and glow treatment tailored to your skin.'},
  {id:'s2',name:'Express Hair Styling',category:'Hair',price:899,duration:'45 min',rating:'4.8',reviews:98,img:images.hair,desc:'A polished blowout and styling session for every occasion.'},
  {id:'s3',name:'Classic Manicure',category:'Nails',price:699,duration:'50 min',rating:'4.9',reviews:84,img:images.nails,desc:'Nail shaping, cuticle care, hand massage and a flawless finish.'},
  {id:'s4',name:'Occasion Makeup',category:'Makeup',price:2499,duration:'90 min',rating:'4.9',reviews:112,img:images.makeup,desc:'A look made for you, from soft radiance to evening glamour.'},
  {id:'s5',name:'Relax & Restore Massage',category:'Spa',price:1799,duration:'60 min',rating:'4.8',reviews:71,img:images.spa,desc:'A calm, deeply relaxing ritual in the comfort of your home.'},
  {id:'s6',name:'Smooth Finish Waxing',category:'Waxing',price:599,duration:'40 min',rating:'4.8',reviews:63,img:images.facial,desc:'Gentle, professional waxing with quality products and careful technique.'},
  {id:'s7',name:'Brow & Threading Edit',category:'Threading',price:299,duration:'25 min',rating:'4.9',reviews:103,img:images.makeup,desc:'Precise brow shaping and threading for a beautifully defined finish.'},
  {id:'s8',name:'The Complete Glow',category:'Packages',price:3299,duration:'150 min',rating:'4.9',reviews:56,img:images.spa,desc:'Facial, manicure and hair styling in one considered package.'}
];

let professionals = [
  {id:1,name:'Nisha Kapoor',experience:'8 years of experience',rating:'4.9',reviews:212,price:699,img:photo('photo-1559839734-2b71ea197ec2',500),specialty:'Skin & makeup'},
  {id:2,name:'Riya Malhotra',experience:'6 years of experience',rating:'4.9',reviews:186,price:599,img:photo('photo-1534528741775-53994a69daeb',500),specialty:'Hair & styling'},
  {id:3,name:'Meera Shah',experience:'10 years of experience',rating:'4.8',reviews:241,price:799,img:photo('photo-1580489944761-15a19d654956',500),specialty:'Spa & wellness'}
];

let salons = [
  {id:'l1',name:'The Ivory Room',area:'Bandra West, Mumbai',distance:'1.8 km away',rating:'4.9',reviews:312,price:800,img:SALON_IMG,tag:'Most loved',services:['Hair','Skin','Nails'],hours:'10:00 AM – 8:00 PM',about:'A quiet, contemporary salon where considered care meets effortless style.'},
  {id:'l2',name:'Atelier Beauty House',area:'Juhu, Mumbai',distance:'3.2 km away',rating:'4.8',reviews:204,price:650,img:images.salon2,tag:'Popular',services:['Hair','Makeup','Spa'],hours:'9:30 AM – 8:30 PM',about:'A warm, creative space for personal beauty rituals and expert styling.'},
  {id:'l3',name:'Maison de Glow',area:'Khar West, Mumbai',distance:'2.4 km away',rating:'4.9',reviews:178,price:900,img:images.salon3,tag:'New to GlamGo',services:['Skin','Nails','Spa'],hours:'10:00 AM – 7:30 PM',about:'Skin and wellness treatments in a calming neighbourhood retreat.'}
];

let products = [
  {id:'b1',brand:'LUMIÈRE',name:'The Daily Renewal Serum',category:'Skincare',price:1890,old:2290,rating:'4.9',reviews:86,img:images.serum,tag:'BESTSELLER',description:'A lightweight daily serum for skin that feels hydrated and quietly radiant.',ingredients:'Niacinamide, hyaluronic acid, glycerin',variants:['30 ml','50 ml']},
  {id:'b2',brand:'THE BOTANIST',name:'Barrier Repair Moisturiser',category:'Skincare',price:1490,old:0,rating:'4.8',reviews:67,img:images.cream,tag:'NEW',description:'Comforting everyday moisture with a soft, non-greasy finish.',ingredients:'Ceramides, squalane, oat extract',variants:['50 ml','100 ml']},
  {id:'b3',brand:'VELVET FORM',name:'Satin Colour Lipstick',category:'Makeup',price:990,old:1290,rating:'4.8',reviews:124,img:images.lipstick,tag:'TRENDING',description:'Rich colour and a smooth satin feel that lasts beautifully.',ingredients:'Jojoba oil, vitamin E, colour pigments',variants:['Rosewood','Soft Nude','Deep Berry']},
  {id:'b4',brand:'NOURISH & CO.',name:'Restorative Hair Oil',category:'Haircare',price:1190,old:0,rating:'4.7',reviews:42,img:images.haircare,tag:'',description:'A pre-wash ritual to nourish lengths and leave hair feeling softer.',ingredients:'Argan oil, almond oil, rosemary',variants:['100 ml','200 ml']},
  {id:'b5',brand:'MAISON CALME',name:'Linen & Neroli Eau de Parfum',category:'Fragrance',price:3490,old:0,rating:'4.9',reviews:31,img:images.fragrance,tag:'NEW',description:'A delicate, airy fragrance with a warm, lasting trail.',ingredients:'Neroli, white musk, cedarwood',variants:['30 ml','75 ml']},
  {id:'b6',brand:'STUDIO EDIT',name:'The Everyday Brush Set',category:'Beauty Tools',price:1790,old:2190,rating:'4.8',reviews:59,img:images.tools,tag:'',description:'Five thoughtfully chosen brushes for an easy, polished routine.',ingredients:'Soft synthetic bristles, wooden handles',variants:['5 piece set']},
  {id:'b7',brand:'THE BOTANIST',name:'Soft Skin Body Cream',category:'Body Care',price:1290,old:0,rating:'4.8',reviews:38,img:images.cream,tag:'',description:'A rich daily body cream that leaves skin comfortable and softly scented.',ingredients:'Shea butter, oat extract, glycerin',variants:['200 ml','400 ml']}
];

const homeCategories = ['All','Hair','Skin','Waxing','Threading','Nails','Makeup','Spa','Packages'];
const shopCategories = ['All','Skincare','Makeup','Haircare','Body Care','Fragrance','Beauty Tools'];
const salonCategories = ['All','Hair','Skin','Nails','Makeup','Spa'];
const roles = ['Professional','Salon Owner','Product Seller','Admin'];
const roleSections = {
  Professional:['Overview','Registration','Identity verification','Profile management','Services & pricing','Availability calendar','Booking requests','Upcoming appointments','Booking history','Earnings','Customer reviews'],
  'Salon Owner':['Overview','Registration','Salon profile','Branches','Service catalogue','Staff management','Appointments','Availability','Revenue analytics','Customer reviews'],
  'Product Seller':['Overview','Registration','Products','Product images','Pricing','Inventory','Orders','Shipping','Sales analytics'],
  Admin:['Overview','Customers','Professionals','Salons','Sellers','Services','Products','Bookings','Orders','Payments','Commissions','Refunds','Reviews','Analytics']
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
  partnerProfiles:{},
  partnerDrafts:[],
  availability:['Mon','Tue','Wed','Thu','Fri'],
  adminStats: null,
  adminUsers: [],
  adminBookings: [],
  adminOrders: []
};

let saved = {};
try { saved = JSON.parse(localStorage.getItem('glamgo-state') || '{}'); } catch {}

const state = {
  ...defaults,
  ...saved,
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
  sort: 'featured',
  selectedSalon: null,
  selectedProduct: null,
  productVariant: null,
  accountTab: 'Overview',
  partnerRole: 'Professional',
  partnerTab: 'Overview',
  booking: null,
  checkoutPayment: 'UPI',
  authMode: 'signin',
  adminStats: null,
  adminUsers: [],
  adminBookings: [],
  adminOrders: [],
  reviews: []
};

const app = document.getElementById('app');
const persist = () => localStorage.setItem('glamgo-state', JSON.stringify(Object.fromEntries(Object.keys(defaults).map(k => [k,state[k]]))));
const toast = message => {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = icon('check',16) + esc(message);
  document.getElementById('toast-root').append(el);
  setTimeout(() => el.remove(), 3300);
};

const setExperience = id => { state.experience = id; state.view = 'landing'; state.modal = null; state.menu = false; state.mobileMenu = false; state.searchOpen = false; persist(); render(); window.scrollTo({top:0,behavior:'instant'}); };
const navigate = view => { state.view = view; state.modal = null; state.menu = false; state.mobileMenu = false; render(); window.scrollTo({top:0,behavior:'instant'}); };
const image = (src, alt, cls='') => '<img class="'+cls+'" src="'+src+'" alt="'+esc(alt)+'" loading="lazy" onerror="this.style.opacity=0.15">';
const button = (label, action, cls='btn-primary', attrs='') => '<button class="btn '+cls+'" data-action="'+action+'" '+attrs+'>'+label+'</button>';
const sectionHead = (eyebrow,title,sub='',action='') => '<div class="section-head"><div><p class="eyebrow">'+eyebrow+'</p><h2>'+title+'</h2>'+(sub?'<p class="section-sub">'+sub+'</p>':'')+'</div>'+action+'</div>';
const rating = (value,count) => '<span class="rating">'+icon('star',14)+' '+value+' <span>('+count+')</span></span>';
const empty = (symbol,title,text,action='') => '<div class="empty-state"><div class="empty-symbol">'+icon(symbol,28)+'</div><h3>'+title+'</h3><p>'+text+'</p>'+action+'</div>';
const countCart = () => Object.values(state.cart).reduce((a,b)=>a+b,0);
const cartTotal = () => products.reduce((sum,p)=>sum+p.price*(state.cart[p.id]||0),0);
const dateOptions = () => Array.from({length:6},(_,i)=>{const d=new Date();d.setDate(d.getDate()+i+1);return {value:d.toISOString().slice(0,10),day:d.toLocaleDateString('en-IN',{weekday:'short'}),date:d.getDate(),month:d.toLocaleDateString('en-IN',{month:'short'})};});
const formatDate = value => new Date(value+'T12:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});

function onboarding(){
  return '<div class="onboarding"><div class="onboard-top"><a class="wordmark" href="#" data-action="onboarding">GLAMGO<span>✦</span></a><div class="onboard-top-right"><span>YOUR BEAUTY. YOUR WAY.</span>'+button('My account '+icon('user',17),'account','btn-text')+'</div></div><div class="onboard-intro"><p class="eyebrow line-eyebrow">THREE EXPERIENCES. ONE BEAUTIFUL WORLD.</p><h1>Beauty is yours <em>to define.</em></h1><p>Where would you like to begin today?</p></div><div class="experience-grid">'+experiences.map(x=>'<button class="experience-card" data-action="experience" data-id="'+x.id+'"><div class="experience-photo">'+image(x.img,x.title)+'</div><div class="experience-content"><span class="eyebrow">'+x.eyebrow+'</span><h2>'+x.title+'</h2><p>'+x.desc+'</p><span class="experience-link">'+x.cta+' '+icon('arrow',18)+'</span></div></button>').join('')+'</div><div class="onboard-bottom"><span>ONE ACCOUNT. EVERY SIDE OF BEAUTY.</span><span>CURATED WITH CARE &nbsp; · &nbsp; MADE FOR YOU</span></div></div>';
}

function auth(){
  return '<div class="auth-layout"><div class="auth-image">'+image(HOME_IMG,'At-home beauty treatment')+'<div class="auth-image-copy"><a class="wordmark light" href="#" data-action="onboarding">GLAMGO<span>✦</span></a><h1>Your beauty.<br><em>Your way.</em></h1><p>One account for every side of beauty.</p></div></div><div class="auth-panel"><div class="auth-box"><p class="eyebrow">WELCOME TO GLAMGO</p><h2>'+(state.authMode==='signup'?'Create your account':'A beautiful place to begin.')+'</h2><p>Find exceptional care at home, discover salons and shop your favourites.</p><form id="auth-form">'+(state.authMode==='signup'?'<label>Full name<input name="name" required placeholder="Your full name" autocomplete="name"></label><label>Phone number<input name="phone" placeholder="Contact number"></label>':'')+'<label>Email address<input name="email" type="email" required placeholder="you@example.com" autocomplete="email"></label><label>Password<input name="password" type="password" required minlength="6" placeholder="At least 6 characters" autocomplete="'+(state.authMode==='signup'?'new-password':'current-password')+'"></label><button class="btn btn-primary full" type="submit">'+(state.authMode==='signup'?'Create account':'Sign in')+' '+icon('arrow',17)+'</button></form><p class="auth-switch">'+(state.authMode==='signup'?'Already have an account?':'New to GlamGo?')+' <button data-action="auth-toggle">'+(state.authMode==='signup'?'Sign in':'Create an account')+'</button></p><p class="form-note">FastAPI + PostgreSQL secured JWT authentication.</p></div></div></div>';
}

function header(){
  const current = experiences.find(x => x.id === state.experience) || experiences[0];
  const userInitials = state.user?.name ? state.user.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() : 'AM';
  return '<div class="site-shell"><div class="announcement">A more beautiful way to care for yourself <span>·</span> Discover GlamGo</div><header class="header"><a class="wordmark" href="#" data-action="landing">GLAMGO<span>✦</span></a><div class="header-location"><button data-action="location">'+icon('pin',18)+'<span><small>YOUR LOCATION</small>'+esc(state.location)+'</span>'+icon('chevron',15)+'</button></div><button class="header-search" data-action="search-open">'+icon('search',19)+'<span>Search services, salons & products</span><kbd>⌘ K</kbd></button><div class="header-actions"><div class="switch-wrap"><button class="switch-button" data-action="switch-toggle"><span class="switch-icon">'+icon(current.icon,18)+'</span><span>Switch experience<small>'+current.eyebrow.split('/ ')[1]+'</small></span>'+icon('chevron',14)+'</button>'+(state.menu?'<div class="switch-menu"><p>EXPLORE GLAMGO</p>'+experiences.map(x=>'<button data-action="experience" data-id="'+x.id+'" class="'+(x.id===state.experience?'active':'')+'">'+icon(x.icon,19)+'<span>'+x.eyebrow.split('/ ')[1]+'<small>'+x.title+'</small></span>'+(x.id===state.experience?icon('check',16):'')+'</button>').join('')+'</div>':'')+'</div><button class="icon-button" aria-label="Wishlist" data-action="wishlist">'+icon('heart',21)+(state.wishlist.length?'<i></i>':'')+'</button><button class="icon-button" aria-label="Cart" data-action="cart">'+icon('bag',21)+(countCart()?'<b>'+countCart()+'</b>':'')+'</button><button class="icon-button notify-button" aria-label="Notifications" data-action="notifications">'+icon('bell',21)+(state.notifications.length?'<i></i>':'')+'</button><button class="avatar-button" aria-label="My account" data-action="account">'+userInitials+'</button></div><button class="mobile-menu-button" data-action="mobile-toggle" aria-label="Open menu">'+icon('menu',23)+'</button></header><nav class="subnav"><div class="subnav-links">'+(state.experience==='home'?'<button data-action="landing">Home</button><button data-action="scroll" data-target="categories">Categories</button><button data-action="scroll" data-target="popular">Popular services</button><button data-action="scroll" data-target="professionals">Professionals</button><button data-action="scroll" data-target="how">How it works</button>':state.experience==='salon'?'<button data-action="landing">Discover</button><button data-action="scroll" data-target="salons">Salons near you</button><button data-action="scroll" data-target="salon-categories">Categories</button><button data-action="account-bookings">My appointments</button>':'<button data-action="landing">Shop all</button><button data-action="scroll" data-target="shop-categories">Categories</button><button data-action="scroll" data-target="bestsellers">Best sellers</button><button data-action="scroll" data-target="new-arrivals">New arrivals</button>')+'</div><span class="subnav-tag">YOUR BEAUTY. YOUR WAY.</span></nav>'+(state.mobileMenu?'<div class="mobile-menu"><div class="mobile-menu-head"><span>EXPLORE GLAMGO</span><button data-action="mobile-toggle" aria-label="Close menu">'+icon('close',20)+'</button></div>'+experiences.map(x=>'<button data-action="experience" data-id="'+x.id+'">'+icon(x.icon,20)+x.eyebrow.split('/ ')[1]+icon('arrow',16)+'</button>').join('')+'<button data-action="account">'+icon('user',20)+'My account'+icon('arrow',16)+'</button><button data-action="location">'+icon('pin',20)+esc(state.location)+icon('arrow',16)+'</button></div>':'')+'</div>';
}

function footer(){
  return '<footer class="footer"><div class="footer-grid"><div><a class="wordmark" href="#" data-action="landing">GLAMGO<span>✦</span></a><p>Beauty made personal, wherever you are.</p><span>YOUR BEAUTY. YOUR WAY.</span></div><div><h4>Explore</h4>'+experiences.map(x=>'<button data-action="experience" data-id="'+x.id+'">'+x.eyebrow.split('/ ')[1]+'</button>').join('')+'</div><div><h4>Your account</h4><button data-action="account">My profile</button><button data-action="account-bookings">My bookings</button><button data-action="orders">My orders</button><button data-action="wishlist">Wishlist</button></div><div><h4>GlamGo</h4><button data-action="partners">Partner with us</button><button data-action="support">Customer support</button><button data-action="notifications">Notifications</button></div></div><div class="footer-bottom"><span>© '+new Date().getFullYear()+' GlamGo. Made for every side of beauty.</span><span>Thoughtfully curated care.</span></div></footer>';
}

function mobileNav(){
  return '<nav class="mobile-bottom" aria-label="Mobile navigation"><button data-action="landing" class="'+(state.view==='landing'?'active':'')+'">'+icon('home',21)+'<span>Explore</span></button><button data-action="search-open">'+icon('search',21)+'<span>Search</span></button><button data-action="switch-toggle">'+icon('grid',21)+'<span>Switch</span></button><button data-action="cart">'+icon('bag',21)+'<span>Cart</span></button><button data-action="account" class="'+(state.view==='account'?'active':'')+'">'+icon('user',21)+'<span>Account</span></button></nav>';
}

function homeCard(s){
  return '<article class="service-card">'+image(s.img,s.name,'card-img')+'<button class="wishlist-on-card '+(state.wishlist.includes(s.id)?'saved':'')+'" data-action="wish" data-id="'+s.id+'" aria-label="Save '+s.name+'">'+icon('heart',18)+'</button><div class="card-body"><span class="card-kicker">'+s.category.toUpperCase()+'</span><h3>'+s.name+'</h3><div class="card-meta">'+icon('clock',15)+s.duration+rating(s.rating,s.reviews)+'</div><div class="card-bottom"><strong>From '+money(s.price)+'</strong><button data-action="book-home" data-id="'+s.id+'">Book now '+icon('arrow',16)+'</button></div></div></article>';
}

function professionalCard(p){
  return '<article class="pro-card"><div class="pro-top">'+image(p.img,p.name,'pro-avatar')+'<div><h3>'+p.name+'</h3><span>'+p.specialty+'</span></div></div><p>'+p.experience+'</p><div class="verified">'+icon('shield',15)+' GlamGo verified</div><div class="pro-bottom">'+rating(p.rating,p.reviews)+'<span>From '+money(p.price)+'</span></div><button class="pro-book" data-action="book-pro" data-id="'+p.id+'">View availability '+icon('arrow',16)+'</button></article>';
}

function homePage(){
  const filtered = services.filter(s => state.homeCategory === 'All' || s.category === state.homeCategory);
  return '<main><section class="home-hero"><div class="hero-copy"><p class="eyebrow line-eyebrow">BEAUTY, BROUGHT TO YOU</p><h1>Professional beauty care. <em>Right at your doorstep.</em></h1><p>Expert hands, thoughtful rituals and time for yourself—beautifully brought to the comfort of home.</p><div class="hero-buttons">'+button('Book a service '+icon('arrow',18),'scroll','btn-primary','data-target="popular"')+button('How it works','scroll','btn-outline','data-target="how"')+'</div><div class="hero-proof"><span>'+icon('shield',17)+' Verified professionals</span><span>'+icon('spark',17)+' Care chosen for you</span></div></div><div class="hero-visual">'+image(HOME_IMG,'A professional beautician providing a facial treatment')+'<div class="visual-note"><span>THE GLAMGO EDIT</span><strong>Your moment of care,<br>in your own space.</strong></div></div></section><section class="search-strip"><div><span class="eyebrow">WHAT FEELS GOOD TODAY?</span><h2>Find your next moment of care.</h2></div><button data-action="search-open">'+icon('search',19)+' Search for a service <span>Explore '+icon('arrow',16)+'</span></button></section><section class="section" id="categories">'+sectionHead('EXPLORE BY CATEGORY','The care you\'re looking for.','From a little refresh to a complete ritual.')+'<div class="category-grid home-categories">'+homeCategories.slice(1).map((c,i)=>'<button data-action="home-category" data-id="'+c+'" class="category-tile"><div class="category-art cat-'+i+'">'+icon(['spark','grid','spark','spark','spark','spark','spark','spark'][i],29)+'</div><span>'+c+'</span>'+icon('arrow',17)+'</button>').join('')+'</div></section><section class="section soft-section" id="popular">'+sectionHead('BOOK WHAT YOU LOVE','Popular home services.','Expert care for the moments that matter.')+'<div class="filter-row">'+homeCategories.map(c=>'<button class="filter-chip '+(state.homeCategory===c?'active':'')+'" data-action="home-category" data-id="'+c+'">'+c+'</button>').join('')+'</div><div class="card-grid">'+filtered.map(homeCard).join('')+'</div></section><section class="section" id="professionals">'+sectionHead('IN GOOD HANDS','Meet your beauty experts.','Experienced professionals, carefully verified and rated.','<span class="section-aside">Personal service, every time.</span>')+'<div class="pro-grid">'+professionals.map(professionalCard).join('')+'</div></section><section class="how-section" id="how"><div class="how-heading"><p class="eyebrow">SIMPLE BY DESIGN</p><h2>A beautiful experience, <em>from start to finish.</em></h2></div><div class="steps">'+[['01','Choose your service','Find the treatment or package that feels right.'],['02','Meet your professional','Select an expert whose style suits you.'],['03','Pick your moment','Book a date and time that fits your day.'],['04','Enjoy your service','Make room for beauty, right at home.']].map(x=>'<div class="step"><span>'+x[0]+'</span><h3>'+x[1]+'</h3><p>'+x[2]+'</p></div>').join('')+'</div></section><section class="section package-section"><div class="package-image">'+image(images.spa,'Relaxing beauty ritual')+'</div><div class="package-copy"><p class="eyebrow">THE GLAMGO RITUAL</p><h2>Make time for <em>all of you.</em></h2><p>The Complete Glow brings together facial care, manicure and hair styling into one unhurried moment.</p><div class="package-price">From '+money(3299)+' <span>· 150 minutes</span></div>'+button('Explore the package '+icon('arrow',17),'book-home','btn-primary','data-id="s8"')+'</div></section><section class="section review-section">'+sectionHead('YOUR EXPERIENCE MATTERS','Care worth coming back to.','After every booking, your feedback helps shape a better GlamGo.')+'<div class="review-panel">'+icon('star',30)+'<div><h3>Your voice belongs here.</h3><p>Book a service and share a review from your account after your appointment.</p></div>'+button('Explore services '+icon('arrow',17),'scroll','btn-outline','data-target="popular"')+'</div></section></main>';
}

function salonCard(s){
  return '<article class="salon-card"><div class="salon-image">'+image(s.img,s.name+' salon','card-img')+'<span>'+s.tag+'</span></div><div class="salon-body"><div class="salon-title"><h3>'+s.name+'</h3>'+rating(s.rating,s.reviews)+'</div><p>'+icon('pin',15)+s.area+' <i>·</i> '+s.distance+'</p><div class="salon-services">'+s.services.map(x=>'<span>'+x+'</span>').join('')+'</div><div class="card-bottom"><strong>Services from '+money(s.price)+'</strong><button data-action="salon-detail" data-id="'+s.id+'">View salon '+icon('arrow',16)+'</button></div></div></article>';
}

function salonPage(){
  let list = salons.filter(s => state.salonCategory === 'All' || s.services.includes(state.salonCategory));
  if(state.sort === 'rating') list = [...list].sort((a,b) => Number(b.rating) - Number(a.rating));
  if(state.sort === 'price') list = [...list].sort((a,b) => a.price - b.price);
  return '<main><section class="salon-hero"><div class="salon-hero-image">'+image(SALON_IMG,'Luxury contemporary salon interior')+'</div><div class="salon-hero-copy"><p class="eyebrow line-eyebrow">THE SALON EDIT</p><h1>Discover salons that make you <em>feel your best.</em></h1><p>Beautiful spaces, trusted hands and the perfect appointment—find your next favourite salon nearby.</p>'+button('Explore salons '+icon('arrow',18),'scroll','btn-primary','data-target="salons"')+'</div></section><section class="salon-search-box"><div><label>WHERE</label><button data-action="location">'+icon('pin',18)+esc(state.location)+'</button></div><div><label>WHAT</label><button data-action="search-open">'+icon('search',18)+' Service or salon name</button></div><div><label>WHEN</label><button data-action="salon-date">'+icon('calendar',18)+' '+(state.salonDate?formatDate(state.salonDate):'Choose a date')+'</button></div>'+button('Find salons '+icon('arrow',18),'scroll','btn-primary','data-target="salons"')+'</section><section class="section" id="salon-categories">'+sectionHead('FIND YOUR FIT','An appointment for every mood.','Discover a salon by the care you have in mind.')+'<div class="salon-category-grid">'+salonCategories.slice(1).map((c,i)=>'<button data-action="salon-category" data-id="'+c+'" class="salon-category-card">'+image([images.hair,images.facial,images.nails,images.makeup,images.spa][i],c+' services')+'<span>'+c+' '+icon('arrow',17)+'</span></button>').join('')+'</div></section><section class="section soft-section" id="salons">'+sectionHead('CURATED NEAR YOU','Salons worth discovering.','Thoughtful spaces and talented teams around '+esc(state.location)+'.')+'<div class="listing-tools"><div class="filter-row">'+salonCategories.map(c=>'<button class="filter-chip '+(state.salonCategory===c?'active':'')+'" data-action="salon-category" data-id="'+c+'">'+c+'</button>').join('')+'</div><label class="sort-label">'+icon('filter',17)+' Sort by <select id="salon-sort"><option value="featured" '+(state.sort==='featured'?'selected':'')+'>Featured</option><option value="rating" '+(state.sort==='rating'?'selected':'')+'>Top rated</option><option value="price" '+(state.sort==='price'?'selected':'')+'>Price: low to high</option></select></label></div><div class="salon-grid">'+list.map(salonCard).join('')+'</div>'+(list.length?'':empty('search','No salons in this category','Try another category to discover more beautiful spaces.'))+'</section><section class="section salon-note"><div><p class="eyebrow">A LITTLE MORE PERSONAL</p><h2>Find your place. <em>Feel at home.</em></h2><p>Browse real services and available times before you commit to an appointment.</p></div>'+button('View appointments '+icon('arrow',17),'account-bookings','btn-outline')+'</section></main>';
}

function salonDetail(){
  const s = salons.find(x => x.id === state.selectedSalon) || salons[0];
  return '<main class="detail-page"><button class="back-link" data-action="landing">← Back to salons</button><div class="salon-detail-gallery"><div>'+image(s.img,s.name+' interior')+'</div><div>'+image(images.salon2,'Salon styling space')+image(images.salon3,'Salon seating')+'</div></div><div class="detail-header"><div><p class="eyebrow">SALON & PARLOUR</p><h1>'+s.name+'</h1><p>'+icon('pin',17)+s.area+' · '+s.distance+'</p></div><div class="detail-header-rating">'+rating(s.rating,s.reviews)+'<span>Verified by GlamGo</span></div></div><div class="detail-columns"><div><section class="detail-block"><h2>About the salon</h2><p>'+s.about+'</p></section><section class="detail-block"><h2>Services & pricing</h2>'+s.services.map((c,i)=>'<div class="service-line"><div><strong>'+({Hair:'Signature cut & style',Skin:'Radiance facial',Nails:'Classic manicure',Makeup:'Occasion makeup',Spa:'Restorative ritual'}[c]||c)+'</strong><span>'+c+' · '+[60,75,50,90,60][i%5]+' min</span></div><strong>From '+money(s.price+i*350)+'</strong><button data-action="book-salon" data-id="'+s.id+'" data-service="'+c+'">Book</button></div>').join('')+'</section><section class="detail-block"><h2>Our team</h2><div class="staff-row">'+professionals.slice(0,2).map(p=>'<div>'+image(p.img,p.name)+'<strong>'+p.name+'</strong><span>'+p.specialty+'</span></div>').join('')+'</div></section><section class="detail-block"><h2>Reviews</h2><p>'+rating(s.rating,s.reviews)+' &nbsp; Rated by GlamGo customers. Reviews appear here after completed appointments.</p></section></div><aside class="detail-aside"><h3>Plan your visit</h3><p>'+icon('pin',17)+s.area+'</p><p>'+icon('clock',17)+'Open daily · '+s.hours+'</p><div class="map-placeholder"><span>'+icon('pin',30)+'</span><strong>'+s.area+'</strong><small>Map preview</small></div>'+button('Book an appointment '+icon('arrow',18),'book-salon','btn-primary full','data-id="'+s.id+'"')+'</aside></div></main>';
}

function productCard(p){
  return '<article class="product-card"><div class="product-image" data-action="product-detail" data-id="'+p.id+'">'+image(p.img,p.name)+(p.tag?'<span class="product-tag">'+p.tag+'</span>':'')+'<button class="wishlist-on-card '+(state.wishlist.includes(p.id)?'saved':'')+'" data-action="wish" data-id="'+p.id+'" aria-label="Save '+p.name+'">'+icon('heart',18)+'</button></div><div class="product-body"><span class="product-brand">'+p.brand+'</span><button class="product-name" data-action="product-detail" data-id="'+p.id+'">'+p.name+'</button><div class="product-rating">'+rating(p.rating,p.reviews)+'</div><div class="product-bottom"><div><strong>'+money(p.price)+'</strong>'+(p.old?'<del>'+money(p.old)+'</del>':'')+'</div><button data-action="add-cart" data-id="'+p.id+'" aria-label="Add '+p.name+' to cart">'+icon('plus',18)+'</button></div></div></article>';
}

function shopPage(){
  let list = products.filter(p => state.shopCategory === 'All' || p.category === state.shopCategory);
  return '<main><section class="shop-hero"><div class="shop-hero-copy"><p class="eyebrow line-eyebrow">THE BEAUTY STORE</p><h1>Your beauty essentials, <em>thoughtfully curated.</em></h1><p>Meet the daily rituals, considered formulas and little luxuries you will love living with.</p>'+button('Shop the edit '+icon('arrow',18),'scroll','btn-primary','data-target="bestsellers"')+'</div><div class="shop-hero-image">'+image(SHOP_IMG,'Premium skincare and beauty products')+'</div></section><div class="shop-benefits"><span>'+icon('spark',18)+' Curated with care</span><span>'+icon('truck',19)+' Thoughtful delivery</span><span>'+icon('shield',18)+' Authentic products</span></div><section class="section" id="shop-categories">'+sectionHead('EXPLORE THE STORE','What are you looking for?','A considered collection for every part of your routine.')+'<div class="shop-category-grid">'+shopCategories.slice(1).map((c,i)=>'<button class="shop-category-card" data-action="shop-category" data-id="'+c+'"><div>'+image([images.serum,images.lipstick,images.haircare,images.cream,images.fragrance,images.tools][i],c)+'</div><span>'+c+' '+icon('arrow',17)+'</span></button>').join('')+'</div></section><section class="section soft-section" id="bestsellers">'+sectionHead('THE GLAMGO EDIT','The beauty shelf.','Thoughtfully chosen products for your everyday.')+'<div class="listing-tools"><div class="filter-row">'+shopCategories.map(c=>'<button class="filter-chip '+(state.shopCategory===c?'active':'')+'" data-action="shop-category" data-id="'+c+'">'+c+'</button>').join('')+'</div><label class="sort-label">Sort by <select id="shop-sort"><option value="featured" '+(state.sort==='featured'?'selected':'')+'>Featured</option><option value="price" '+(state.sort==='price'?'selected':'')+'>Price: low to high</option><option value="rating" '+(state.sort==='rating'?'selected':'')+'>Top rated</option></select></label></div><div class="product-grid">'+(state.sort==='price'?[...list].sort((a,b)=>a.price-b.price):state.sort==='rating'?[...list].sort((a,b)=>Number(b.rating)-Number(a.rating)):list).map(productCard).join('')+'</div>'+(list.length?'':empty('bag','A new edit is coming','Explore another category while we curate more favourites.'))+'</section><section class="shop-editorial"><div>'+image(SHOP_IMG,'Curated beauty products')+'</div><div><p class="eyebrow">BEAUTY, CONSIDERED</p><h2>A routine that <em>feels like you.</em></h2><p>Beautiful essentials, selected for the way you live. Explore the pieces that make every day feel a little more yours.</p>'+button('Discover skincare '+icon('arrow',17),'shop-category','btn-outline','data-id="Skincare"')+'</div></section><section class="section" id="trending">'+sectionHead('IN THE MOMENT','Trending now.','Beauty favourites earning their place on your shelf.')+'<div class="product-grid">'+products.filter(p=>p.tag==='TRENDING'||p.tag==='BESTSELLER').map(productCard).join('')+'</div></section><section class="section" id="new-arrivals">'+sectionHead('JUST ARRIVED','New on the shelf.','Fresh discoveries to make room for.')+'<div class="product-grid">'+products.filter(p=>p.tag==='NEW'||p.tag==='TRENDING').map(productCard).join('')+'</div></section><section class="brand-section"><p class="eyebrow">THE BRANDS WE LOVE</p><div><span>LUMIÈRE</span><span>THE BOTANIST</span><span>VELVET FORM</span><span>MAISON CALME</span></div></section></main>';
}

function productDetail(){
  const p = products.find(x => x.id === state.selectedProduct) || products[0];
  const variant = state.productVariant || p.variants[0];
  return '<main class="detail-page"><button class="back-link" data-action="landing">← Back to beauty store</button><div class="product-detail"><div class="product-detail-image">'+image(p.img,p.name)+'</div><div class="product-detail-info"><p class="eyebrow">'+p.brand+'</p><h1>'+p.name+'</h1>'+rating(p.rating,p.reviews)+'<div class="product-detail-price">'+money(p.price)+(p.old?'<del>'+money(p.old)+'</del><span>Save '+money(p.old-p.price)+'</span>':'')+'</div><p class="product-desc">'+p.description+'</p><div class="variant-select"><span>SELECT VARIANT</span><div>'+p.variants.map(v=>'<button class="'+(v===variant?'active':'')+'" data-action="variant" data-id="'+esc(v)+'">'+v+'</button>').join('')+'</div></div><div class="detail-actions">'+button('Add to cart '+icon('bag',18),'add-cart','btn-primary','data-id="'+p.id+'"')+button('Buy now '+icon('arrow',17),'buy-now','btn-outline','data-id="'+p.id+'"')+'<button class="detail-wish '+(state.wishlist.includes(p.id)?'saved':'')+'" data-action="wish" data-id="'+p.id+'" aria-label="Add to wishlist">'+icon('heart',20)+'</button></div><div class="product-facts"><div>'+icon('truck',20)+' Delivery across India</div><div>'+icon('shield',20)+' Authentic products, thoughtfully sourced</div></div><details><summary>Details & ingredients '+icon('plus',16)+'</summary><p>'+p.description+' Key ingredients: '+p.ingredients+'.</p></details><details><summary>Reviews '+icon('plus',16)+'</summary><p>Rated '+p.rating+' by '+p.reviews+' customers. Verified purchase reviews appear after an order is delivered.</p></details></div></div></main>';
}

function account(){
  const tabs = ['Overview','Personal information','Saved addresses','My bookings','My orders','Wishlist','Payment methods','Notifications','Coupons & rewards','Reviews','Customer support'];
  let content = '';
  if(state.accountTab==='Overview') content='<div class="account-welcome"><p class="eyebrow">GOOD TO SEE YOU</p><h2>Hello, '+esc(state.user.name.split(' ')[0])+'.</h2><p>Every side of beauty, together in one place.</p></div><div class="account-quick"><button data-action="account-tab" data-id="My bookings">'+icon('calendar',23)+'<strong>'+state.bookings.length+' bookings</strong><span>Appointments and home services</span>'+icon('arrow',17)+'</button><button data-action="account-tab" data-id="My orders">'+icon('bag',23)+'<strong>'+state.orders.length+' orders</strong><span>Your beauty store purchases</span>'+icon('arrow',17)+'</button><button data-action="account-tab" data-id="Wishlist">'+icon('heart',23)+'<strong>'+state.wishlist.length+' saved</strong><span>Things you love</span>'+icon('arrow',17)+'</button></div><div class="account-block"><h3>Your details</h3><p>'+esc(state.user.email)+' · '+esc(state.user.phone)+'</p><button data-action="account-tab" data-id="Personal information">Edit information '+icon('arrow',15)+'</button></div>';
  else if(state.accountTab==='Personal information') content='<div class="account-block"><h2>Personal information</h2><p>Keep your contact details current for bookings and orders.</p><form id="profile-form" class="form-grid"><label>Full name<input name="name" required value="'+esc(state.user.name)+'"></label><label>Email address<input name="email" type="email" required value="'+esc(state.user.email)+'"></label><label>Phone number<input name="phone" required value="'+esc(state.user.phone)+'"></label><button class="btn btn-primary" type="submit">Save changes</button></form></div>';
  else if(state.accountTab==='Saved addresses') content='<div class="account-block"><div class="account-heading"><h2>Saved addresses</h2>'+button('Add address '+icon('plus',17),'address-add','btn-outline')+'</div>'+state.addresses.map((a,i)=>'<div class="address-card"><div>'+icon('pin',20)+'<span><strong>'+esc(a.label)+'</strong><small>'+esc(a.text)+'</small></span></div><button data-action="address-delete" data-id="'+i+'">Remove</button></div>').join('')+'</div>';
  else if(state.accountTab==='My bookings') content='<div class="account-block"><h2>My bookings</h2><p>Home services and salon appointments, together.</p>'+(state.bookings.length?state.bookings.map(b=>'<div class="history-card"><div class="history-icon">'+icon(b.type==='home'?'home':'salon',22)+'</div><div><span class="eyebrow">'+(b.type==='home'?'AT-HOME SERVICE':'SALON APPOINTMENT')+'</span><h3>'+esc(b.title)+'</h3><p>'+formatDate(b.date)+' · '+b.time+' · '+esc(b.location)+'</p></div><span class="status">'+esc(b.status||'Confirmed')+'</span></div>').join(''):empty('calendar','Your next moment awaits','Choose a home service or salon appointment to see it here.',button('Explore beauty '+icon('arrow',16),'experience','btn-primary','data-id="home"')))+'</div>';
  else if(state.accountTab==='My orders') content='<div class="account-block"><h2>My orders</h2><p>Your beauty store purchases and delivery updates.</p>'+(state.orders.length?state.orders.map(o=>'<div class="history-card"><div class="history-icon">'+icon('bag',22)+'</div><div><span class="eyebrow">ORDER '+esc(o.id)+'</span><h3>'+(o.items||[]).map(i=>esc(i.name)).join(', ')+'</h3><p>'+formatDate(o.date)+' · '+money(o.total)+' · '+(o.items||[]).length+' item'+((o.items||[]).length>1?'s':'')+'</p></div><button class="text-action" data-action="tracking" data-id="'+esc(o.id)+'">Track order '+icon('arrow',15)+'</button></div>').join(''):empty('bag','Your beauty bag is waiting','Discover your first favourite in the GlamGo beauty store.',button('Explore the store '+icon('arrow',16),'experience','btn-primary','data-id="shop"')))+'</div>';
  else if(state.accountTab==='Wishlist'){const liked=[...services,...products].filter(x=>state.wishlist.includes(x.id));content='<div class="account-block"><h2>Your wishlist</h2><p>A space for everything that catches your eye.</p>'+(liked.length?'<div class="wishlist-grid">'+liked.map(x=>x.brand?productCard(x):homeCard(x)).join('')+'</div>':empty('heart','Nothing saved yet','Tap the heart on a service or product to keep it close.'))+'</div>';}
  else if(state.accountTab==='Payment methods') content='<div class="account-block"><h2>Payment methods</h2>'+empty('bag','Pay the way you prefer','Choose UPI, card or cash when you confirm a booking or order.')+'</div>';
  else if(state.accountTab==='Notifications') content='<div class="account-block"><h2>Notifications</h2>'+(state.notifications.length?state.notifications.map(n=>'<div class="notification-row">'+icon(n.type==='order'?'bag':'calendar',20)+'<span>'+esc(n.text)+'</span></div>').join(''):empty('bell','All caught up','Booking confirmations and order updates will appear here.'))+'</div>';
  else if(state.accountTab==='Coupons & rewards') content='<div class="account-block"><h2>Coupons & rewards</h2><div class="coupon-card"><p class="eyebrow">WELCOME GIFT</p><h3>Take 10% off your first beauty store order.</h3><p>Use code <strong>GLAM10</strong> at checkout. Maximum discount ₹300.</p></div></div>';
  else if(state.accountTab==='Reviews') content='<div class="account-block"><div class="account-heading"><h2>My reviews</h2>'+button('Write a review '+icon('plus',17),'review-add','btn-outline')+'</div><p>Verified reviews for completed doorstep care, salon appointments, and products.</p>'+(state.reviews.length?state.reviews.map(r=>'<div class="history-card"><div class="history-icon">'+icon('star',22)+'</div><div><span class="eyebrow">'+r.rating+' ★ · '+esc(r.item_type).toUpperCase()+'</span><h3>'+esc(r.comment)+'</h3><p>Reviewed on '+formatDate(r.created_at)+'</p></div></div>').join(''):empty('star','No reviews yet','Share your experience on services you have booked or beauty products you have received.'))+'</div>';
  else content='<div class="account-block"><h2>Customer support</h2><p>We are here to make every experience feel effortless.</p><div class="support-card"><h3>How can we help?</h3><p>For help with a booking or order, send us a message and include your booking or order number.</p><a href="mailto:care@glamgo.example">care@glamgo.example '+icon('arrow',16)+'</a></div></div>';
  return '<main class="account-page"><div class="account-title"><p class="eyebrow">YOUR GLAMGO ACCOUNT</p><h1>One account. <em>Every side of beauty.</em></h1></div><div class="account-layout"><aside class="account-sidebar"><div class="account-person"><span>'+(state.user?.name ? state.user.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() : 'AM')+'</span><div><strong>'+esc(state.user.name)+'</strong><small>'+esc(state.user.email)+'</small></div></div>'+tabs.map(t=>'<button class="'+(state.accountTab===t?'active':'')+'" data-action="account-tab" data-id="'+t+'">'+t+icon('arrow',15)+'</button>').join('')+'<button class="logout" data-action="logout">'+icon('logout',17)+' Log out</button></aside><div class="account-content">'+content+'</div></div></main>';
}

function cartPage(){
  const items = products.filter(p => state.cart[p.id]);
  return '<main class="cart-page"><div class="page-heading"><p class="eyebrow">THE BEAUTY STORE</p><h1>Your beauty bag.</h1><p>Beautiful things, ready when you are.</p></div>'+(items.length?'<div class="cart-layout"><div class="cart-items">'+items.map(p=>'<div class="cart-item">'+image(p.img,p.name)+'<div><span class="product-brand">'+esc(p.brand)+'</span><h3>'+esc(p.name)+'</h3><p>'+esc(p.variants[0]||'')+'</p><button class="remove-link" data-action="cart-remove" data-id="'+p.id+'">Remove</button></div><div class="cart-item-end"><strong>'+money(p.price*state.cart[p.id])+'</strong><div class="qty"><button data-action="cart-qty" data-id="'+p.id+'" data-delta="-1" aria-label="Decrease quantity">'+icon('minus',15)+'</button><span>'+state.cart[p.id]+'</span><button data-action="cart-qty" data-id="'+p.id+'" data-delta="1" aria-label="Increase quantity">'+icon('plus',15)+'</button></div></div></div>').join('')+'</div><aside class="order-summary"><h3>Order summary</h3><div><span>Subtotal</span><strong>'+money(cartTotal())+'</strong></div><div><span>Delivery</span><strong>Complimentary</strong></div><div class="summary-total"><span>Total</span><strong>'+money(cartTotal())+'</strong></div>'+button('Continue to checkout '+icon('arrow',17),'checkout','btn-primary full')+'<p>Secure checkout · Authentic products</p></aside></div>':empty('bag','Your bag is waiting to be filled','Explore thoughtfully curated beauty and find something to love.',button('Explore the beauty store '+icon('arrow',17),'experience','btn-primary','data-id="shop"')))+'</main>';
}

function checkoutPage(){
  if(!countCart()) return cartPage();
  const discount = state.coupon === 'GLAM10' ? Math.min(300, Math.round(cartTotal() * .1)) : 0;
  return '<main class="checkout-page"><button class="back-link" data-action="cart">← Back to bag</button><div class="page-heading"><p class="eyebrow">ALMOST THERE</p><h1>Checkout.</h1></div><div class="checkout-layout"><div><section class="checkout-block"><h2>01 &nbsp; Delivery address</h2><label>Deliver to<select id="checkout-address">'+state.addresses.map((a,i)=>'<option value="'+i+'">'+esc(a.label)+' — '+esc(a.text)+'</option>').join('')+'</select></label><button class="text-action" data-action="address-add">+ Add another address</button></section><section class="checkout-block"><h2>02 &nbsp; Payment method</h2><div class="payment-options">'+['UPI','Credit / debit card','Cash on delivery'].map(p=>'<button data-action="payment" data-id="'+p+'" class="'+(state.checkoutPayment===p?'active':'')+'"><span class="radio"></span>'+p+'</button>').join('')+'</div></section><section class="checkout-block"><h2>03 &nbsp; Coupon</h2><form id="coupon-form" class="coupon-form"><input name="coupon" placeholder="Enter coupon code" value="'+esc(state.coupon)+'"><button type="submit">Apply</button></form>'+(state.coupon==='GLAM10'?'<p class="success-note">'+icon('check',16)+' GLAM10 applied — you save '+money(discount)+'</p>':'')+'</section></div><aside class="order-summary"><h3>Your order</h3>'+products.filter(p=>state.cart[p.id]).map(p=>'<div><span>'+esc(p.name)+' × '+state.cart[p.id]+'</span><strong>'+money(p.price*state.cart[p.id])+'</strong></div>').join('')+'<hr><div><span>Subtotal</span><strong>'+money(cartTotal())+'</strong></div>'+(discount?'<div><span>Discount</span><strong>−'+money(discount)+'</strong></div>':'')+'<div><span>Delivery</span><strong>Complimentary</strong></div><div class="summary-total"><span>Total</span><strong>'+money(cartTotal()-discount)+'</strong></div>'+button('Place order '+icon('arrow',17),'place-order','btn-primary full')+'<p>PostgreSQL-backed order. Server verified pricing.</p></aside></div></main>';
}

function orderSuccess(){
  const o = state.orders[0] || { id: 'GG000000', total: 0, address: { label: 'Home' } };
  return '<main class="success-page"><div class="success-mark">'+icon('check',34)+'</div><p class="eyebrow">ORDER CONFIRMED</p><h1>A beautiful delivery <em>is on its way.</em></h1><p>Thank you for shopping with GlamGo. Your order '+o.id+' has been placed and will be prepared with care.</p><div class="success-details"><span>ORDER TOTAL <strong>'+money(o.total)+'</strong></span><span>DELIVERING TO <strong>'+esc(o.address?.label||'Home')+'</strong></span></div><div class="success-actions">'+button('Track your order '+icon('arrow',17),'tracking','btn-primary','data-id="'+o.id+'"')+button('Continue shopping','experience','btn-outline','data-id="shop"')+'</div></main>';
}

function trackingPage(){
  const o = state.orders.find(x => x.id === state.trackingId) || state.orders[0];
  if(!o) return account();
  return '<main class="tracking-page"><button class="back-link" data-action="orders">← Back to orders</button><div class="page-heading"><p class="eyebrow">ORDER '+o.id+'</p><h1>Your order journey.</h1><p>Placed '+formatDate(o.date)+' · '+money(o.total)+'</p></div><div class="tracking-card"><div class="tracking-steps">'+[['Order placed','Your order is confirmed and being prepared.'],['Packed with care','Our seller is preparing your beauty essentials.'],['On its way','You will receive a delivery update here.'],['Delivered','Enjoy your new favourites.']].map((x,i)=>'<div class="'+(i===0?'active':'')+'"><span>'+icon(i===0?'check':'bag',17)+'</span><div><strong>'+x[0]+'</strong><p>'+x[1]+'</p></div></div>').join('')+'</div><div class="tracking-items"><h3>In this order</h3>'+(o.items||[]).map(i=>'<p>'+i.name+' × '+i.qty+'</p>').join('')+'<p><strong>Delivery address</strong><br>'+esc(o.address?.text||state.addresses[0]?.text||'')+'</p></div></div></main>';
}

function partnerPage(){
  const role = state.partnerRole, tabs = roleSections[role];
  const tab = state.partnerTab, profile = state.partnerProfiles[role] || {};
  const metrics = role === 'Professional' ? [
    ['Upcoming appointments', state.bookings.filter(b=>b.type==='home').length],
    ['Services listed', services.length],
    ['Customer reviews', '4.9 ★']
  ] : role === 'Salon Owner' ? [
    ['Appointments', state.bookings.filter(b=>b.type==='salon').length],
    ['Active staff', 2],
    ['Branches', 1]
  ] : role === 'Product Seller' ? [
    ['Products', products.length],
    ['Orders', state.orders.length],
    ['Inventory alerts', 0]
  ] : state.adminStats ? [
    ['Customers', state.adminStats.customers_count],
    ['Bookings', state.adminStats.total_bookings],
    ['Orders', state.adminStats.total_orders],
    ['Gross Merch Value', money(state.adminStats.gross_merchandise_value || 0)],
    ['Marketplace Commission', money(state.adminStats.platform_commission || 0)]
  ] : [
    ['Customers', state.adminUsers?.length || 1],
    ['Bookings', state.bookings.length],
    ['Orders', state.orders.length]
  ];

  let body = '';
  if(state.partnerTab === 'Overview') body = '<div class="dashboard-metrics">'+metrics.map(x=>'<div><span>'+x[0]+'</span><strong>'+x[1]+'</strong></div>').join('')+'</div><div class="dashboard-panel"><h3>Getting started</h3><p>Manage your '+role.toLowerCase()+' presence in one calm, organised space.</p><div class="dashboard-actions">'+tabs.slice(1,5).map(t=>'<button data-action="partner-tab" data-id="'+t+'">'+t+' '+icon('arrow',16)+'</button>').join('')+'</div></div>';
  else if(tab.toLowerCase().includes('registration')||tab==='Profile management'||tab==='Salon profile') body='<div class="dashboard-panel"><h3>'+tab+'</h3><p>Keep the details customers see clear and current. Synced to your PostgreSQL profile.</p><form id="partner-form" class="form-grid"><label>Business or professional name<input name="name" required placeholder="Your name or business" value="'+esc(profile.name||state.user.name||'')+'"></label><label>Contact email<input name="email" type="email" required placeholder="you@example.com" value="'+esc(profile.email||state.user.email||'')+'"></label><label>Phone number<input name="phone" required placeholder="Contact number" value="'+esc(profile.phone||state.user.phone||'')+'"></label><label>City<input name="city" required placeholder="City" value="'+esc(profile.city||'Mumbai')+'"></label><button class="btn btn-primary" type="submit">Save details '+icon('arrow',17)+'</button></form></div>';
  else if(tab==='Identity verification') body='<div class="dashboard-panel"><h3>Identity verification</h3><p>Professional verification helps customers book with confidence.</p><div class="verification-list"><div>'+icon('check',18)+' Create your professional profile</div><div>'+icon('shield',18)+' Government ID and training credentials</div><div>'+icon('calendar',18)+' Final review by the GlamGo team</div></div><p class="dashboard-note">Verification status: Active and verified.</p></div>';
  else if(tab==='Availability calendar'||tab==='Availability') body='<div class="dashboard-panel"><h3>Weekly availability</h3><p>Select the days you accept appointments. Toggles save to PostgreSQL.</p><div class="availability-grid">'+['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day=>'<button data-action="availability" data-id="'+day+'" class="'+(state.availability.includes(day)?'active':'')+'"><strong>'+day+'</strong><span>'+(state.availability.includes(day)?'Available':'Unavailable')+'</span></button>').join('')+'</div><p class="dashboard-note">Individual appointment times are scheduled during customer booking.</p></div>';
  else if(tab.toLowerCase().includes('booking')||tab.toLowerCase().includes('appointment')){
    const bList = role === 'Admin' && state.adminBookings && state.adminBookings.length ? state.adminBookings : state.bookings.filter(b=>role==='Professional'?b.type==='home':role==='Salon Owner'?b.type==='salon':true);
    body='<div class="dashboard-panel"><h3>'+(role==='Admin'?'Platform-wide Bookings':tab)+'</h3>'+(bList.length?bList.map(b=>'<div class="dash-row"><div><strong>'+esc(b.title)+'</strong><small>'+formatDate(b.date)+' · '+b.time+' · '+esc(b.professional||'Expert')+' · '+money(b.price)+'</small></div><span class="status">'+esc(b.status||'Confirmed')+'</span></div>').join(''):empty('calendar','No appointments yet','New booking requests and upcoming appointments will appear here.'))+'</div>';
  }
  else if(tab.toLowerCase().includes('order')||tab==='Shipping'){
    const oList = role === 'Admin' && state.adminOrders && state.adminOrders.length ? state.adminOrders : state.orders;
    body='<div class="dashboard-panel"><h3>'+(role==='Admin'?'Platform-wide Orders':tab)+'</h3>'+(oList.length?oList.map(o=>'<div class="dash-row"><div><strong>'+esc(o.id)+'</strong><small>'+(o.items||[]).length+' items · '+money(o.total)+' · '+esc(o.address?.label||o.address_label||'Home')+'</small></div><span class="status">'+esc(o.status||'Placed')+'</span></div>').join(''):empty('bag','No orders yet','Customer orders and shipping tasks will appear here when they are placed.'))+'</div>';
  }
  else if(tab.toLowerCase().includes('product')||tab.toLowerCase().includes('inventory')||tab==='Pricing') body='<div class="dashboard-panel"><div class="account-heading"><h3>'+tab+'</h3>'+button('Add product '+icon('plus',17),'partner-add','btn-outline')+'</div><p class="dashboard-note">Catalogue active · Add a draft to preview your own listing.</p>'+state.partnerDrafts.filter(d=>d.role===role).map(d=>'<div class="dash-row"><div><strong>'+esc(d.name)+'</strong><small>'+money(d.price)+' · Draft</small></div><span class="status">Draft</span></div>').join('')+products.slice(0,5).map(p=>'<div class="dash-row"><div><strong>'+esc(p.name)+'</strong><small>'+esc(p.brand)+' · '+money(p.price)+'</small></div><span class="status">Sample</span></div>').join('')+'</div>';
  else if(tab.toLowerCase().includes('service')) body='<div class="dashboard-panel"><div class="account-heading"><h3>'+tab+'</h3>'+button('Add service '+icon('plus',17),'partner-add','btn-outline')+'</div><p class="dashboard-note">Catalogue active · Add a draft to preview your own service.</p>'+state.partnerDrafts.filter(d=>d.role===role).map(d=>'<div class="dash-row"><div><strong>'+esc(d.name)+'</strong><small>'+money(d.price)+' · Draft</small></div><span class="status">Draft</span></div>').join('')+services.slice(0,5).map(s=>'<div class="dash-row"><div><strong>'+esc(s.name)+'</strong><small>'+esc(s.duration)+' · '+money(s.price)+'</small></div><span class="status">Sample</span></div>').join('')+'</div>';
  else if(tab.toLowerCase().includes('branch')) body='<div class="dashboard-panel"><h3>Branches</h3>'+salons.slice(0,1).map(s=>'<div class="dash-row"><div><strong>'+esc(s.name)+'</strong><small>'+esc(s.area)+' · '+esc(s.hours)+'</small></div><span class="status">Sample</span></div>').join('')+'<p class="dashboard-note">Branch creation active.</p></div>';
  else if(tab==='Staff management') body='<div class="dashboard-panel"><h3>Staff management</h3>'+professionals.slice(0,2).map(p=>'<div class="dash-row"><div><strong>'+esc(p.name)+'</strong><small>'+esc(p.specialty)+' · '+esc(p.experience)+'</small></div><span class="status">Sample</span></div>').join('')+'</div>';
  else if(['Earnings','Revenue analytics','Sales analytics','Analytics'].includes(tab)){
    if(role === 'Admin' && state.adminStats){
      body='<div class="dashboard-panel"><h3>Platform Financial Analytics</h3><p>Server-aggregated real-time metrics from PostgreSQL.</p><div class="dashboard-metrics"><div><span>GROSS MERCHANDISE VALUE</span><strong>'+money(state.adminStats.gross_merchandise_value)+'</strong></div><div><span>COMMISSION EARNED (15%)</span><strong>'+money(state.adminStats.platform_commission)+'</strong></div><div><span>SERVICE BOOKING REVENUE</span><strong>'+money(state.adminStats.booking_revenue)+'</strong></div><div><span>PRODUCT ORDER REVENUE</span><strong>'+money(state.adminStats.order_revenue)+'</strong></div></div></div>';
    } else {
      const total=tab==='Sales analytics'?state.orders.reduce((n,o)=>n+o.total,0):state.bookings.reduce((n,b)=>n+b.price,0);
      body='<div class="dashboard-panel"><h3>'+tab+'</h3><p>Live metrics from PostgreSQL database.</p><div class="analytics-summary"><span>RECORDED VALUE</span><strong>'+money(total)+'</strong><small>'+(tab==='Sales analytics'?state.orders.length+' orders':state.bookings.length+' bookings')+' in this platform</small></div>'+empty('grid','More insight comes with activity','Performance trends will appear as bookings and orders grow.')+'</div>';
    }
  }
  else if(tab==='Customer reviews'||tab==='Reviews') body='<div class="dashboard-panel"><h3>'+tab+'</h3>'+(state.reviews.length?state.reviews.map(r=>'<div class="dash-row"><div><strong>'+r.rating+' ★ · '+esc(r.comment)+'</strong><small>'+esc(r.user_name||'Customer')+' · '+formatDate(r.created_at)+'</small></div><span class="status">'+esc(r.item_type)+'</span></div>').join(''):empty('star','Reviews will appear here','Customer feedback is shown after completed appointments or deliveries.'))+'</div>';
  else if(tab==='Customers'){
    const userList = (role === 'Admin' && state.adminUsers && state.adminUsers.length) ? state.adminUsers : [state.user];
    body='<div class="dashboard-panel"><h3>'+(role==='Admin'?'Platform Users & Customers':'Customers')+'</h3><p>User management synced to PostgreSQL database.</p>'+userList.map(u=>'<div class="dash-row"><div><strong>'+esc(u.name||u.full_name||'User')+'</strong><small>'+esc(u.email)+' · Role: '+esc(u.role)+'</small></div>'+(role==='Admin'?'<button class="text-action" data-action="admin-toggle-user" data-id="'+u.id+'">'+(u.is_active?'Deactivate':'Activate')+'</button>':'<span class="status">Active</span>')+'</div>').join('')+'</div>';
  }
  else if(tab==='Professionals') body='<div class="dashboard-panel"><h3>Professionals</h3>'+professionals.map(p=>'<div class="dash-row"><div><strong>'+esc(p.name)+'</strong><small>'+esc(p.specialty)+' · '+esc(p.experience)+'</small></div><span class="status">Verified</span></div>').join('')+'</div>';
  else if(tab==='Salons') body='<div class="dashboard-panel"><h3>Salons</h3>'+salons.map(s=>'<div class="dash-row"><div><strong>'+esc(s.name)+'</strong><small>'+esc(s.area)+'</small></div><span class="status">Active</span></div>').join('')+'</div>';
  else if(tab==='Sellers') body='<div class="dashboard-panel"><h3>Sellers</h3>'+[...new Set(products.map(p=>p.brand))].map(b=>'<div class="dash-row"><div><strong>'+esc(b)+'</strong><small>Beauty store brand</small></div><span class="status">Verified</span></div>').join('')+'</div>';
  else if(['Payments','Commissions','Refunds'].includes(tab)) body='<div class="dashboard-panel"><h3>'+tab+'</h3><p>Platform Commission: 15% marketplace fee. Razorpay transaction gateway active.</p><div class="analytics-summary"><span>PLATFORM COMMISSION (15%)</span><strong>'+money(Math.round(cartTotal() * 0.15))+'</strong><small>Calculated on settled transactions</small></div></div>';
  else body='<div class="dashboard-panel"><h3>'+state.partnerTab+'</h3><p>Your '+state.partnerTab.toLowerCase()+' workspace is ready.</p>'+empty('grid','A clean slate','Information and activity for this section will appear here as your GlamGo presence grows.')+'</div>';
  return '<main class="partner-page"><div class="partner-top"><button class="back-link" data-action="landing">← Back to GlamGo</button><div><p class="eyebrow">GLAMGO FOR PARTNERS</p><h1>Welcome to your <em>workspace.</em></h1><p>Designed to help every beauty business do its best work.</p></div></div><div class="role-picker">'+roles.map(r=>'<button class="'+(r===role?'active':'')+'" data-action="partner-role" data-id="'+r+'">'+r+'</button>').join('')+'</div><div class="partner-layout"><aside class="partner-sidebar"><strong>'+role+' dashboard</strong>'+tabs.map(t=>'<button class="'+(t===state.partnerTab?'active':'')+'" data-action="partner-tab" data-id="'+t+'">'+t+'</button>').join('')+'</aside><div class="partner-main"><div class="dashboard-heading"><div><p class="eyebrow">'+role.toUpperCase()+'</p><h2>'+state.partnerTab+'</h2></div><span>GlamGo partner studio</span></div>'+body+'</div></div></main>';
}

function modal(){
  if(!state.modal) return '';
  let inner = '';
  if(state.modal==='location') inner='<div class="modal-head"><p class="eyebrow">YOUR LOCATION</p><h2>Where should we find you?</h2><p>Discover services and salons around your neighbourhood.</p></div><form id="location-form"><label>Enter area or city<input name="location" required value="'+esc(state.location)+'" placeholder="e.g. Bandra West, Mumbai" autofocus></label><button class="btn btn-primary full" type="submit">Save location '+icon('arrow',17)+'</button></form><div class="location-suggestions"><span>POPULAR LOCATIONS</span>'+['Bandra West, Mumbai','Juhu, Mumbai','Khar West, Mumbai','Andheri West, Mumbai'].map(l=>'<button data-action="location-set" data-id="'+l+'">'+icon('pin',16)+l+'</button>').join('')+'</div>';
  else if(state.modal==='date') inner='<div class="modal-head"><p class="eyebrow">PLAN YOUR VISIT</p><h2>Choose a date.</h2><p>Browse salons for the day that suits you.</p></div><div class="date-grid modal-dates">'+dateOptions().map(d=>'<button class="'+(state.salonDate===d.value?'selected':'')+'" data-action="date-set" data-id="'+d.value+'"><span>'+d.day+'</span><strong>'+d.date+'</strong><small>'+d.month+'</small></button>').join('')+'</div>';
  else if(state.modal==='search'){
    const q = state.query.toLowerCase().trim();
    const results = [...services.map(x=>({...x,type:'Service'})),...salons.map(x=>({...x,type:'Salon'})),...products.map(x=>({...x,type:'Product'}))].filter(x=>!q||((x.name+' '+(x.category||'')+' '+(x.area||'')+' '+(x.brand||'')).toLowerCase().includes(q))).slice(0,8);
    inner='<div class="modal-head"><p class="eyebrow">EXPLORE GLAMGO</p><h2>What are you looking for?</h2></div><div class="search-input">'+icon('search',21)+'<input id="global-search" value="'+esc(state.query)+'" placeholder="Try facial, salon or serum" autocomplete="off" autofocus></div><div class="search-results">'+(results.length?results.map(x=>'<button data-action="search-result" data-id="'+x.id+'" data-type="'+x.type+'"><span>'+icon(x.type==='Service'?'spark':x.type==='Salon'?'salon':'bag',20)+'</span><div><strong>'+x.name+'</strong><small>'+x.type+(x.area?' · '+x.area:'')+'</small></div>'+icon('arrow',17)+'</button>').join(''):empty('search','No matches yet','Try another service, salon or product name.'))+'</div>';
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
  if(b.step===3) body='<h3>Review your booking</h3><div class="booking-review"><div><span>Service</span><strong>'+(service?.name||'Service')+'</strong></div><div><span>Professional</span><strong>'+esc(b.professional)+'</strong></div><div><span>Date & time</span><strong>'+formatDate(b.date)+' · '+b.time+'</strong></div><div><span>Location</span><strong>'+esc(salon?salon.name+', '+salon.area:state.addresses[0]?.text||state.location)+'</strong></div><div><span>Price</span><strong>'+money(service?.price||0)+'</strong></div></div><p class="booking-hint">Payment can be arranged after confirmation. Your appointment will appear in My bookings.</p>';
  return '<div class="modal-head"><p class="eyebrow">'+(salon?'SALON APPOINTMENT':'AT-HOME BEAUTY')+'</p><h2>Book a beautiful moment.</h2><p>'+(salon?salon.name:'Expert care in the comfort of home.')+'</p></div><div class="booking-progress">'+steps.map((s,i)=>'<span class="'+(i<=b.step?'active':'')+'"><b>'+(i<b.step?'✓':i+1)+'</b>'+s+'</span>').join('')+'</div><div class="booking-step">'+body+'</div><div class="booking-footer">'+(b.step>0?button('Back','booking-back','btn-outline'):'<span></span>')+button(b.step===3?'Confirm booking '+icon('check',17):'Continue '+icon('arrow',17),b.step===3?'booking-confirm':'booking-next','btn-primary')+'</div>';
}

function bookingSuccess(){
  const b = state.bookings[0] || { title: 'Service', date: '2026-11-20', time: '10:00 AM', professional: 'Nisha Kapoor', type: 'home' };
  return '<main class="success-page"><div class="success-mark">'+icon('check',34)+'</div><p class="eyebrow">BOOKING CONFIRMED</p><h1>Your moment is <em>all set.</em></h1><p>'+esc(b.title)+' is booked for '+formatDate(b.date)+' at '+b.time+'. We have added the details to your account.</p><div class="success-details"><span>EXPERIENCE <strong>'+(b.type==='home'?'At-home beauty':'Salon & parlour')+'</strong></span><span>PROFESSIONAL <strong>'+esc(b.professional)+'</strong></span></div><div class="success-actions">'+button('View my bookings '+icon('arrow',17),'account-bookings','btn-primary')+button('Keep exploring','landing','btn-outline')+'</div></main>';
}

function render(){
  if(!state.signedIn){ app.innerHTML = auth(); return; }
  if(state.view === 'onboarding'){ app.innerHTML = onboarding(); return; }
  let page = state.view==='landing' ? (state.experience==='home'?homePage():state.experience==='salon'?salonPage():shopPage()) : state.view==='salon-detail'?salonDetail():state.view==='product-detail'?productDetail():state.view==='account'?account():state.view==='cart'?cartPage():state.view==='checkout'?checkoutPage():state.view==='order-success'?orderSuccess():state.view==='tracking'?trackingPage():state.view==='booking-success'?bookingSuccess():state.view==='partner'?partnerPage():homePage();
  app.innerHTML = header() + page + footer() + mobileNav() + modal();
  document.body.classList.toggle('modal-open', !!state.modal);
}

function openBooking(type, itemId, serviceId = null, pro = null){
  const selectedService = serviceId || (type === 'home' ? itemId : null);
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

async function action(el){
  const a = el.dataset.action, id = el.dataset.id;
  if(a==='onboarding'){ state.view='onboarding'; render(); }
  else if(a==='landing') navigate('landing');
  else if(a==='experience') setExperience(id);
  else if(a==='switch-toggle'){
    if(window.innerWidth<=700){ state.mobileMenu=!state.mobileMenu; state.menu=false; }
    else { state.menu=!state.menu; state.mobileMenu=false; }
    render();
  }
  else if(a==='mobile-toggle'){ state.mobileMenu=!state.mobileMenu; render(); }
  else if(a==='location'){ state.modal='location'; render(); }
  else if(a==='location-set'){ state.location=id; state.modal=null; persist(); render(); toast('Location updated'); }
  else if(a==='search-open'){ state.modal='search'; state.query=''; render(); setTimeout(()=>document.getElementById('global-search')?.focus(),20); }
  else if(a==='search-result'){
    state.modal=null;
    if(el.dataset.type==='Salon'){ state.experience='salon'; state.selectedSalon=id; navigate('salon-detail'); }
    else if(el.dataset.type==='Product'){ state.experience='shop'; state.selectedProduct=id; navigate('product-detail'); }
    else { state.experience='home'; openBooking('home',id); }
    persist();
  }
  else if(a==='scroll'){
    if(state.view!=='landing'){
      navigate('landing');
      setTimeout(()=>document.getElementById(el.dataset.target)?.scrollIntoView({behavior:'smooth'}),80);
    } else {
      document.getElementById(el.dataset.target)?.scrollIntoView({behavior:'smooth'});
    }
  }
  else if(a==='home-category'){ state.homeCategory=id; state.view='landing'; render(); document.getElementById('popular')?.scrollIntoView({behavior:'smooth'}); }
  else if(a==='salon-category'){ state.salonCategory=id; state.view='landing'; render(); document.getElementById('salons')?.scrollIntoView({behavior:'smooth'}); }
  else if(a==='shop-category'){ state.shopCategory=id; state.view='landing'; render(); document.getElementById('bestsellers')?.scrollIntoView({behavior:'smooth'}); }
  else if(a==='book-home') openBooking('home',id);
  else if(a==='book-pro') openBooking('home',null,null,professionals.find(p=>p.id===id)?.name);
  else if(a==='salon-detail'){ state.selectedSalon=id; navigate('salon-detail'); }
  else if(a==='book-salon') openBooking('salon',id,el.dataset.service?services.find(s=>s.category===el.dataset.service)?.id:null);
  else if(a==='salon-date'){ state.modal='date'; render(); }
  else if(a==='date-set'){ state.salonDate=id; state.modal=null; render(); toast('Visit date selected'); }
  else if(a==='product-detail'){ state.selectedProduct=id; state.productVariant=null; navigate('product-detail'); }
  else if(a==='variant'){ state.productVariant=id; render(); }
  else if(a==='wish'){
    state.wishlist = state.wishlist.includes(id) ? state.wishlist.filter(x=>x!==id) : [...state.wishlist,id];
    persist();
    render();
    toast(state.wishlist.includes(id)?'Saved to your wishlist':'Removed from wishlist');
  }
  else if(a==='add-cart'){ state.cart[id]=(state.cart[id]||0)+1; persist(); render(); toast('Added to your beauty bag'); }
  else if(a==='buy-now'){ state.cart[id]=(state.cart[id]||0)+1; persist(); navigate('checkout'); }
  else if(a==='cart') navigate('cart');
  else if(a==='cart-remove'){ delete state.cart[id]; persist(); render(); }
  else if(a==='cart-qty'){
    state.cart[id] = Math.max(0,(state.cart[id]||0)+Number(el.dataset.delta));
    if(!state.cart[id]) delete state.cart[id];
    persist();
    render();
  }
  else if(a==='checkout') navigate('checkout');
  else if(a==='payment'){ state.checkoutPayment=id; render(); }
  else if(a==='place-order'){
    if(!state.addresses.length){
      state.modal='address';
      render();
      toast('Add a delivery address first');
      return;
    }
    const addr = state.addresses[Number(document.getElementById('checkout-address')?.value || 0)] || state.addresses[0];
    const items = products.filter(p => state.cart[p.id]).map(p => ({
      id: p.id,
      qty: state.cart[p.id]
    }));
    try {
      const order = await apiCreateOrder({
        items,
        address_label: addr.label,
        address_text: addr.text,
        payment_method: state.checkoutPayment,
        coupon: state.coupon || null
      });
      state.orders.unshift(order);
      state.notifications.unshift({ type: 'order', text: `Your order ${order.id} is confirmed.` });
      state.cart = {};
      state.coupon = '';
      persist();
      navigate('order-success');
    } catch (err) {
      toast(err.message || 'Failed to place order');
    }
  }
  else if(a==='tracking'){ state.trackingId=id; navigate('tracking'); }
  else if(a==='account'){ state.accountTab='Overview'; navigate('account'); }
  else if(a==='account-tab'){ state.accountTab=id; render(); }
  else if(a==='account-bookings'){ state.accountTab='My bookings'; navigate('account'); }
  else if(a==='orders'){ state.accountTab='My orders'; navigate('account'); }
  else if(a==='wishlist'){ state.accountTab='Wishlist'; navigate('account'); }
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
  else if(a==='support'){ state.accountTab='Customer support'; navigate('account'); }
  else if(a==='logout'){
    tokenStorage.remove();
    tokenStorage.removeRefresh();
    state.signedIn = false;
    state.view = 'auth';
    persist();
    render();
    toast('Signed out');
  }
  else if(a==='auth-toggle'){ state.authMode=state.authMode==='signin'?'signup':'signin'; render(); }
  else if(a==='partners'){ state.partnerTab='Overview'; navigate('partner'); }
  else if(a==='partner-role'){
    state.partnerRole=id;
    state.partnerTab='Overview';
    render();
    if(id === 'Admin'){
      try {
        const [aStats, aUsers, aBookings, aOrders] = await Promise.allSettled([
          apiGetAdminStats(),
          apiGetAdminUsers(),
          apiGetAdminBookings(),
          apiGetAdminOrders()
        ]);
        if(aStats.status === 'fulfilled') state.adminStats = aStats.value;
        if(aUsers.status === 'fulfilled') state.adminUsers = aUsers.value;
        if(aBookings.status === 'fulfilled') state.adminBookings = aBookings.value;
        if(aOrders.status === 'fulfilled') state.adminOrders = aOrders.value;
        render();
      } catch (err) {
        console.warn('Admin fetch notice:', err);
      }
    }
  }
  else if(a==='admin-toggle-user'){
    try {
      const updated = await apiToggleUserStatus(Number(id));
      const idx = state.adminUsers.findIndex(u => u.id === Number(id));
      if (idx !== -1) state.adminUsers[idx] = updated;
      toast(`User status updated: ${updated.is_active ? 'Active' : 'Deactivated'}`);
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
    try {
      const booked = await apiCreateBooking(payload);
      state.bookings.unshift(booked);
      state.notifications.unshift({ type: 'booking', text: `Your ${s?.name||'service'} booking is confirmed for ${formatDate(b.date)}.` });
      state.modal = null;
      persist();
      navigate('booking-success');
    } catch (err) {
      toast(err.message || 'Booking conflict or error');
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
        state.user = { id: res.user_id, name: res.name, email: res.email, phone: phone || '98765 43210', role: res.role };
        state.view = state.experience ? 'landing' : 'onboarding';
        persist();
        render();
        toast('Account created successfully');
      } catch (err) {
        toast(err.message || 'Registration failed');
      }
    } else {
      try {
        const res = await apiLogin(email, password);
        state.signedIn = true;
        state.user = { id: res.user_id, name: res.name, email: res.email, phone: state.user.phone || '98765 43210', role: res.role };
        state.view = state.experience ? 'landing' : 'onboarding';
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
        toast(val.message);
      } else {
        toast(val.message || 'This coupon is not available');
      }
      persist();
      render();
    } catch {
      toast('Coupon verification failed');
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
});

document.addEventListener('change', e => {
  if(e.target.id === 'salon-sort' || e.target.id === 'shop-sort'){
    state.sort = e.target.value;
    render();
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
  }
});

// Initial boot and background live sync
async function init() {
  render();
  try {
    const [sData, pData, lData, bData] = await Promise.allSettled([
      apiGetServices(),
      apiGetProfessionals(),
      apiGetSalons(),
      apiGetProducts()
    ]);
    if(sData.status === 'fulfilled' && sData.value.length) services = sData.value;
    if(pData.status === 'fulfilled' && pData.value.length) professionals = pData.value;
    if(lData.status === 'fulfilled' && lData.value.length) salons = lData.value;
    if(bData.status === 'fulfilled' && bData.value.length) products = bData.value;

    if(tokenStorage.get()){
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
          const [aStats, aUsers, aBookings, aOrders] = await Promise.allSettled([
            apiGetAdminStats(),
            apiGetAdminUsers(),
            apiGetAdminBookings(),
            apiGetAdminOrders()
          ]);
          if(aStats.status === 'fulfilled') state.adminStats = aStats.value;
          if(aUsers.status === 'fulfilled') state.adminUsers = aUsers.value;
          if(aBookings.status === 'fulfilled') state.adminBookings = aBookings.value;
          if(aOrders.status === 'fulfilled') state.adminOrders = aOrders.value;
        }
      } catch {
        tokenStorage.remove();
      }
    }
    render();
  } catch (err) {
    console.warn('[GlamGo] Live sync initialization notice:', err);
  }
}

init();
