// GlamGo Complete 4-Dashboard Operational Suite
// Modular extensions for Admin, At-Home Specialist, Salon Owner, and Product Seller portals.

const isoOffsetDays = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

export const DEFAULT_DASHBOARD_OPS = {
  // 1. Admin Operations
  adminCoupons: [
    { id: 'c1', code: 'GLAM10', discount: 10, maxDiscount: 300, minOrder: 999, scope: 'All Verticals', uses: 142, active: true },
    { id: 'c2', code: 'BRIDAL20', discount: 20, maxDiscount: 1200, minOrder: 2499, scope: 'At-Home Services', uses: 38, active: true },
    { id: 'c3', code: 'GLOWFREE', discount: 15, maxDiscount: 500, minOrder: 1499, scope: 'Beauty Retail', uses: 64, active: false }
  ],
  adminCommissions: {
    homePct: 15,
    salonPct: 15,
    retailPct: 18,
    escrowDays: 7,
    noShowFeePct: 25
  },
  adminDisputes: [
    { id: 'DSP-401', ref: 'ORD-9821', vertical: 'Beauty Retail', customer: 'Aanya Mehta', partner: 'Lumière Brand Manager', amount: 1890, reason: 'Glass serum dropper damaged during courier transit', status: 'OPEN', createdAt: isoOffsetDays(-1) },
    { id: 'DSP-402', ref: 'BK-2044', vertical: 'At-Home Services', customer: 'Diya Nair', partner: 'Nisha Kapoor', amount: 1499, reason: 'Late cancellation fee (>2h window) disputed by client', status: 'OPEN', createdAt: isoOffsetDays(-2) },
    { id: 'DSP-403', ref: 'SL-1180', vertical: 'Partner Salons', customer: 'Rhea Kapoor', partner: 'The Ivory Room', amount: 800, reason: 'Stylist emergency reschedule slot credit request', status: 'PARTIAL_REFUND', createdAt: isoOffsetDays(-4) }
  ],
  adminReviewQueue: [
    { id: 'REV-81', author: 'Kavya D.', target: 'Satin Colour Lipstick', rating: 2, comment: 'Packaging foil looked slightly scuffed though shade was genuine.', flagReason: 'Low Rating Alert', status: 'PENDING' },
    { id: 'REV-82', author: 'Mehek S.', target: 'The Ivory Room', rating: 5, comment: 'Warm staff, zero wait time, spotless manicure station.', flagReason: 'Verified Booking', status: 'APPROVED' },
    { id: 'REV-83', author: 'Anon_441', target: 'Linen & Neroli EDP', rating: 1, comment: 'PROMO SPAM VISIT CHEAPBUY...', flagReason: 'Automated Spam Filter', status: 'PENDING' }
  ],
  adminPayoutBatches: [
    { id: 'PAY-701', partner: 'The Ivory Room Owner', role: 'Salon Owner', gross: 48600, commission: 7290, net: 41310, escrowStatus: 'MATURED', dueDate: isoOffsetDays(0) },
    { id: 'PAY-702', partner: 'Atelier Beauty House Owner', role: 'Salon Owner', gross: 31200, commission: 4680, net: 26520, escrowStatus: 'MATURED', dueDate: isoOffsetDays(0) },
    { id: 'PAY-703', partner: 'Nisha Kapoor', role: 'Professional', gross: 24500, commission: 3675, net: 20825, escrowStatus: 'IN_ESCROW', dueDate: isoOffsetDays(3) },
    { id: 'PAY-704', partner: 'Lumière Brand Manager', role: 'Product Seller', gross: 64900, commission: 11682, net: 53218, escrowStatus: 'DISBURSED', dueDate: isoOffsetDays(-2) }
  ],

  // 2. Professional Operations
  proOnlineStatus: 'online',
  proTravelBufferMin: 30,
  proServiceRadiusKm: 12,
  proZones: 'Bandra West, Khar, Santacruz, Juhu',
  proJobStages: {},
  proClientNotes: [
    { id: 'pc1', name: 'Aanya Mehta', phone: '98765 43210', visits: 6, allergies: 'Sensitive to synthetic lavender fragrance', skinType: 'Combination / Dehydrated', formulaNotes: 'Uses mineral SPF only after Signature Facial; prefers 45-min lymphatic focus.', lastVisit: isoOffsetDays(-6) },
    { id: 'pc2', name: 'Diya Nair', phone: '98201 55412', visits: 3, allergies: 'None reported', skinType: 'Oily / Acne-prone', formulaNotes: 'Cool-toned undertone; Satin shade Soft Nude for daytime looks.', lastVisit: isoOffsetDays(-12) },
    { id: 'pc3', name: 'Kavya Deshmukh', phone: '98112 77890', visits: 9, allergies: 'Mild reaction to ammonia dyes', skinType: 'Dry / Mature', formulaNotes: 'Botanical hot oil infusion prior to blowout.', lastVisit: isoOffsetDays(-3) }
  ],
  proPortfolio: [
    { id: 'pf1', title: 'Soft Bridal Dewy Look', category: 'Makeup', duration: '90 min', img: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80', notes: 'Satin finish skin prep with zero heavy contour.' },
    { id: 'pf2', title: 'Glass-Skin Lymphatic Glow', category: 'Skin', duration: '75 min', img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80', notes: 'Enzyme botanical mask + sculpting gua sha.' },
    { id: 'pf3', title: 'Silk Press & Gloss Waves', category: 'Hair', duration: '45 min', img: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80', notes: 'Heat-protectant argan veil finish.' }
  ],
  proSosLogs: [],

  // 3. Salon Owner Operations
  salonBranches: [
    { id: 'br1', name: 'The Ivory Room — Bandra West (Flagship)', area: 'Bandra West, Mumbai', hours: '10:00 AM – 8:00 PM', chairs: 6, status: 'Active' },
    { id: 'br2', name: 'The Ivory Room — Juhu Annex', area: 'Juhu, Mumbai', hours: '10:30 AM – 8:30 PM', chairs: 4, status: 'Active' }
  ],
  salonChairBookings: [
    { id: 'ch1', stylist: 'Nisha Kapoor', time: '10:00 AM', client: 'Aanya Mehta', service: 'Signature Facial', price: 1499, status: 'Completed' },
    { id: 'ch2', stylist: 'Riya Malhotra', time: '11:30 AM', client: 'Rhea Kapoor', service: 'Express Hair Styling', price: 899, status: 'In-Chair' },
    { id: 'ch3', stylist: 'Meera Shah', time: '01:00 PM', client: 'Tara Singhania', service: 'Relax & Restore Massage', price: 1799, status: 'Checked-In' },
    { id: 'ch4', stylist: 'Nisha Kapoor', time: '03:00 PM', client: 'Diya Nair', service: 'Occasion Makeup', price: 2499, status: 'Booked' },
    { id: 'ch5', stylist: 'Riya Malhotra', time: '05:00 PM', client: 'Ananya Sen', service: 'Classic Manicure & Gel', price: 699, status: 'Booked' }
  ],
  salonPosBills: [
    { id: 'POS-901', client: 'Aanya Mehta', items: 'Signature Facial + Renewal Serum (30ml)', subtotal: 3389, discount: 300, tip: 250, total: 3339, paymentMethod: 'UPI', time: '11:15 AM' },
    { id: 'POS-902', client: 'Walk-In Guest', items: 'Express Hair Styling', subtotal: 899, discount: 0, tip: 100, total: 999, paymentMethod: 'Card', time: '12:40 PM' }
  ],
  salonBackbarStock: [
    { id: 'sb1', name: 'Botanical Lymphatic Elixir (1L)', type: 'Backbar', stock: 14, reorderAt: 5, unit: 'bottles' },
    { id: 'sb2', name: 'Keratin Ampoules Box (24x)', type: 'Backbar', stock: 3, reorderAt: 5, unit: 'boxes' },
    { id: 'sb3', name: 'UV Gel Base Coat Pro', type: 'Backbar', stock: 9, reorderAt: 4, unit: 'bottles' },
    { id: 'sb4', name: 'The Daily Renewal Serum (30ml)', type: 'Retail', stock: 12, reorderAt: 5, unit: 'units' },
    { id: 'sb5', name: 'Restorative Hair Oil (100ml)', type: 'Retail', stock: 4, reorderAt: 6, unit: 'units' }
  ],
  salonClientFormulas: [
    { id: 'cf1', name: 'Aanya Mehta', phone: '98765 43210', visits: 11, ltv: 24800, colorFormula: '7N Warm Beige + 20Vol (35m) · Gloss 9V', allergies: 'Sensitive to essential cinnamon oil', preferredStylist: 'Nisha Kapoor' },
    { id: 'cf2', name: 'Rhea Kapoor', phone: '98204 11890', visits: 7, ltv: 16400, colorFormula: '6A Cool Ash Root Melt + Olaplex #1 (7.5ml)', allergies: 'None reported', preferredStylist: 'Riya Malhotra' },
    { id: 'cf3', name: 'Tara Singhania', phone: '98921 64320', visits: 5, ltv: 11200, colorFormula: 'No color — Aromatherapy Deep Tissue 60m', allergies: 'Nut-free carrier oils only (jojoba preferred)', preferredStylist: 'Meera Shah' }
  ],
  salonStaffPayroll: {
    'Nisha Kapoor': { commissionPct: 30, bookings: 28, revenue: 46200, tips: 3400 },
    'Riya Malhotra': { commissionPct: 28, bookings: 24, revenue: 31800, tips: 2100 },
    'Meera Shah': { commissionPct: 32, bookings: 22, revenue: 41900, tips: 2950 }
  },

  // 4. Product Seller Operations
  sellerBatches: [
    { id: 'bat1', productId: 'b1', productName: 'The Daily Renewal Serum', variant: '30 ml', batchNo: 'LUM-2604-A', mfgDate: isoOffsetDays(-120), expiryDate: isoOffsetDays(380), qty: 42, clearancePct: 0, autoDelisted: false },
    { id: 'bat2', productId: 'b2', productName: 'Barrier Repair Moisturiser', variant: '50 ml', batchNo: 'BOT-2511-C', mfgDate: isoOffsetDays(-290), expiryDate: isoOffsetDays(58), qty: 28, clearancePct: 0, autoDelisted: false },
    { id: 'bat3', productId: 'b3', productName: 'Satin Colour Lipstick', variant: 'Soft Nude', batchNo: 'VLV-2508-N', mfgDate: isoOffsetDays(-330), expiryDate: isoOffsetDays(42), qty: 18, clearancePct: 15, autoDelisted: false },
    { id: 'bat4', productId: 'b5', productName: 'Linen & Neroli Eau de Parfum', variant: '30 ml', batchNo: 'MC-2602-F', mfgDate: isoOffsetDays(-90), expiryDate: isoOffsetDays(640), qty: 18, clearancePct: 0, autoDelisted: false },
    { id: 'bat5', productId: 'b4', productName: 'Restorative Hair Oil', variant: '100 ml', batchNo: 'NC-2409-H', mfgDate: isoOffsetDays(-400), expiryDate: isoOffsetDays(-14), qty: 6, clearancePct: 0, autoDelisted: true }
  ],
  sellerReturnQc: {},
  sellerFulfillmentFlags: {
    b1: ['Fragile Glass', 'Liquid'],
    b2: ['Temperature Sensitive (<25°C)'],
    b3: ['Fragile Stick'],
    b4: ['Liquid', 'Leak-Proof Seal'],
    b5: ['Fragile Glass', 'Surface Courier Only'],
    b6: ['Standard Parcel'],
    b7: ['Leak-Proof Jar']
  },
  sellerComplianceDocs: [
    { id: 'doc1', title: 'CDSCO Cosmetic Manufacturing & Import License', category: 'Regulatory', hsnCode: '3304', gstPct: 18, status: 'VERIFIED', validUntil: isoOffsetDays(410) },
    { id: 'doc2', title: 'Full INCI Ingredient & Patch-Test Certificate', category: 'Safety', hsnCode: '3304', gstPct: 18, status: 'VERIFIED', validUntil: isoOffsetDays(290) },
    { id: 'doc3', title: 'Cruelty-Free Botanical Sourcing Attestation', category: 'Ethics', hsnCode: '3305', gstPct: 18, status: 'VERIFIED', validUntil: isoOffsetDays(185) },
    { id: 'doc4', title: 'GSTIN & HSN 3303 Fragrance Tax Schedule', category: 'Tax', hsnCode: '3303', gstPct: 18, status: 'PENDING_RENEWAL', validUntil: isoOffsetDays(24) }
  ]
};

const listOf = (state, key) => (Array.isArray(state[key]) ? state[key] : [...DEFAULT_DASHBOARD_OPS[key]]);
const objOf = (state, key) => (state[key] && typeof state[key] === 'object' ? state[key] : { ...DEFAULT_DASHBOARD_OPS[key] });

export function exportCsvFile(filename, headers, rows) {
  const escapeCell = (v) => {
    const s = String(v ?? '');
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const csv = [headers.map(escapeCell).join(','), ...rows.map(r => r.map(escapeCell).join(','))].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. ADMIN RENDERERS
// ═══════════════════════════════════════════════════════════════════════════════

export function renderAdminPromotionsTab(state, h) {
  const { esc, money } = h;
  const coupons = listOf(state, 'adminCoupons');
  const comm = objOf(state, 'adminCommissions');
  const activeCount = coupons.filter(c => c.active).length;

  return '<div class="admin-split-grid" style="margin-bottom:20px">' +
    '<div class="admin-panel">' +
      '<div class="admin-panel-head"><div><h2>Commission & Escrow Guardrails</h2><p class="admin-panel-sub">Platform take-rate, return hold window, and late cancellation fees.</p></div><span class="badge badge-approved">Active Policy</span></div>' +
      '<form id="ops-commission-form" class="form-grid">' +
        '<label>At-Home Take Rate (%)<input name="homePct" type="number" min="0" max="50" required value="' + esc(comm.homePct) + '"></label>' +
        '<label>Salon Take Rate (%)<input name="salonPct" type="number" min="0" max="50" required value="' + esc(comm.salonPct) + '"></label>' +
        '<label>Retail Take Rate (%)<input name="retailPct" type="number" min="0" max="50" required value="' + esc(comm.retailPct) + '"></label>' +
        '<label>Escrow Hold (Days)<input name="escrowDays" type="number" min="1" max="30" required value="' + esc(comm.escrowDays) + '"></label>' +
        '<label style="grid-column:1/-1">Late Cancellation / No-Show Split Fee (%)<input name="noShowFeePct" type="number" min="0" max="100" required value="' + esc(comm.noShowFeePct) + '"></label>' +
        '<button type="submit" class="btn btn-primary btn-sm" style="grid-column:1/-1">Save Commission Rules</button>' +
      '</form>' +
    '</div>' +
    '<div class="admin-panel">' +
      '<div class="admin-panel-head"><div><h2>Launch Promo Coupon</h2><p class="admin-panel-sub">Create checkout discounts across verticals.</p></div><span class="badge badge-info">' + activeCount + ' Live</span></div>' +
      '<form id="ops-coupon-form" class="form-grid">' +
        '<label>Promo Code<input name="code" required placeholder="e.g. FESTIVE15" style="text-transform:uppercase"></label>' +
        '<label>Discount (%)<input name="discount" type="number" min="1" max="75" required value="15"></label>' +
        '<label>Max Cap (₹)<input name="maxDiscount" type="number" min="50" required value="400"></label>' +
        '<label>Min Order (₹)<input name="minOrder" type="number" min="0" required value="999"></label>' +
        '<label style="grid-column:1/-1">Applicable Vertical<select name="scope" class="admin-role-select" style="width:100%"><option>All Verticals</option><option>At-Home Services</option><option>Partner Salons</option><option>Beauty Retail</option></select></label>' +
        '<button type="submit" class="btn btn-primary btn-sm" style="grid-column:1/-1">+ Publish Coupon Code</button>' +
      '</form>' +
    '</div>' +
  '</div>' +
  '<div class="admin-panel">' +
    '<div class="admin-panel-head"><div><h2>Active Promotions & Coupon Codes</h2><p class="admin-panel-sub">Real-time coupon inventory with toggle controls.</p></div><span class="admin-metric-pill">' + coupons.length + ' Coupons</span></div>' +
    '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Code</th><th>Discount</th><th>Cap & Min Spend</th><th>Scope</th><th>Redemptions</th><th>Status</th><th>Actions</th></tr></thead><tbody>' +
      coupons.map(c => '<tr>' +
        '<td><code class="admin-ip">' + esc(c.code) + '</code></td>' +
        '<td class="admin-num"><strong>' + c.discount + '% OFF</strong></td>' +
        '<td class="admin-num">Up to ' + money(c.maxDiscount) + ' · Min ' + money(c.minOrder) + '</td>' +
        '<td><span class="badge badge-info">' + esc(c.scope) + '</span></td>' +
        '<td class="admin-num">' + c.uses + ' uses</td>' +
        '<td><span class="badge badge-' + (c.active ? 'approved' : 'suspended') + '">' + (c.active ? 'ACTIVE' : 'PAUSED') + '</span></td>' +
        '<td><div class="admin-actions">' +
          '<button type="button" class="btn btn-outline btn-sm" data-action="ops-coupon-toggle" data-id="' + esc(c.id) + '">' + (c.active ? 'Pause' : 'Activate') + '</button>' +
          '<button type="button" class="btn btn-danger btn-sm" data-action="ops-coupon-delete" data-id="' + esc(c.id) + '">Remove</button>' +
        '</div></td>' +
      '</tr>').join('') +
    '</tbody></table></div>' +
  '</div>';
}

export function renderAdminDisputesTab(state, h) {
  const { esc, money, statusTone } = h;
  const disputes = listOf(state, 'adminDisputes');
  const reviews = listOf(state, 'adminReviewQueue');
  const openCount = disputes.filter(d => d.status === 'OPEN').length;
  const flaggedCount = reviews.filter(r => r.status === 'PENDING').length;
  const refundedTotal = disputes.filter(d => d.status.includes('REFUND')).reduce((a, d) => a + Number(d.amount || 0), 0);

  return '<div class="admin-stock-kpi-grid">' +
    '<div class="admin-stock-kpi"><div class="admin-stock-kpi-top"><span>Open Disputes</span><span class="badge ' + (openCount ? 'badge-pending' : 'badge-approved') + '">' + (openCount ? 'Action Needed' : 'Clear') + '</span></div><strong>' + openCount + ' Cases</strong><small>Awaiting admin resolution</small></div>' +
    '<div class="admin-stock-kpi"><div class="admin-stock-kpi-top"><span>Refunds Issued</span><span class="badge badge-info">Disputes</span></div><strong>' + money(refundedTotal) + '</strong><small>Full & partial dispute settlements</small></div>' +
    '<div class="admin-stock-kpi"><div class="admin-stock-kpi-top"><span>Flagged Reviews</span><span class="badge ' + (flaggedCount ? 'badge-warning' : 'badge-approved') + '">Moderation</span></div><strong>' + flaggedCount + ' Pending</strong><small>Low rating or spam queue</small></div>' +
    '<div class="admin-stock-kpi"><div class="admin-stock-kpi-top"><span>Resolution SLA</span><span class="badge badge-approved">Optimal</span></div><strong>3.4 hrs</strong><small>Median platform response time</small></div>' +
  '</div>' +
  '<div class="admin-panel" style="margin-bottom:20px">' +
    '<div class="admin-panel-head"><div><h2>Disputes & Refund Resolution Desk</h2><p class="admin-panel-sub">Investigate damaged retail deliveries, late cancellations, and no-show splits.</p></div><span class="admin-metric-pill">' + disputes.length + ' Tickets</span></div>' +
    '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Ticket</th><th>Vertical & Parties</th><th>Issue Details</th><th>Claim Amount</th><th>Status</th><th>Decision</th></tr></thead><tbody>' +
      disputes.map(d => '<tr>' +
        '<td><strong>' + esc(d.id) + '</strong><br><small class="admin-muted">' + esc(d.ref) + ' · ' + esc(d.createdAt) + '</small></td>' +
        '<td><span class="badge badge-info">' + esc(d.vertical) + '</span><br><small>' + esc(d.customer) + ' vs ' + esc(d.partner) + '</small></td>' +
        '<td><small>' + esc(d.reason) + '</small></td>' +
        '<td class="admin-num"><strong>' + money(d.amount) + '</strong></td>' +
        '<td><span class="badge badge-' + statusTone(d.status) + '">' + esc(d.status.replace('_', ' ')) + '</span></td>' +
        '<td>' + (d.status === 'OPEN'
          ? '<div class="admin-actions"><button type="button" class="btn btn-success btn-sm" data-action="ops-dispute-resolve" data-id="' + esc(d.id) + '|REFUNDED">Full Refund</button><button type="button" class="btn btn-outline btn-sm" data-action="ops-dispute-resolve" data-id="' + esc(d.id) + '|PARTIAL_REFUND">50% Split</button><button type="button" class="btn btn-danger btn-sm" data-action="ops-dispute-resolve" data-id="' + esc(d.id) + '|REJECTED">Reject</button></div>'
          : '<small class="admin-muted">Resolved by Admin</small>') + '</td>' +
      '</tr>').join('') +
    '</tbody></table></div>' +
  '</div>' +
  '<div class="admin-panel">' +
    '<div class="admin-panel-head"><div><h2>Trust & Review Moderation Queue</h2><p class="admin-panel-sub">Verify flagged consumer reviews to protect listing integrity.</p></div><span class="admin-metric-pill">' + reviews.length + ' Queued</span></div>' +
    '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Author</th><th>Target</th><th>Rating & Comment</th><th>Trigger</th><th>Status</th><th>Action</th></tr></thead><tbody>' +
      reviews.map(r => '<tr>' +
        '<td><strong>' + esc(r.author) + '</strong></td>' +
        '<td>' + esc(r.target) + '</td>' +
        '<td><strong>' + r.rating + ' ★</strong> · <small>' + esc(r.comment) + '</small></td>' +
        '<td><span class="badge badge-warning">' + esc(r.flagReason) + '</span></td>' +
        '<td><span class="badge badge-' + (r.status === 'APPROVED' ? 'approved' : r.status === 'HIDDEN' ? 'rejected' : 'pending') + '">' + esc(r.status) + '</span></td>' +
        '<td><div class="admin-actions">' +
          '<button type="button" class="btn btn-success btn-sm" data-action="ops-review-moderate" data-id="' + esc(r.id) + '|APPROVED">Approve</button>' +
          '<button type="button" class="btn btn-danger btn-sm" data-action="ops-review-moderate" data-id="' + esc(r.id) + '|HIDDEN">Hide</button>' +
        '</div></td>' +
      '</tr>').join('') +
    '</tbody></table></div>' +
  '</div>';
}

export function renderAdminPayoutsTab(state, h) {
  const { esc, money, statusTone } = h;
  const batches = listOf(state, 'adminPayoutBatches');
  const sumWhere = (pred, key) => batches.filter(pred).reduce((a, b) => a + Number(b[key] || 0), 0);
  const inEscrow = sumWhere(b => b.escrowStatus === 'IN_ESCROW', 'net');
  const matured = sumWhere(b => b.escrowStatus === 'MATURED', 'net');
  const disbursed = sumWhere(b => b.escrowStatus === 'DISBURSED', 'net');
  const commissionEarned = sumWhere(() => true, 'commission');

  return '<div class="admin-stock-kpi-grid">' +
    '<div class="admin-stock-kpi"><div class="admin-stock-kpi-top"><span>Held in Escrow</span><span class="badge badge-info">T+7 Lock</span></div><strong>' + money(inEscrow) + '</strong><small>Within return & dispute window</small></div>' +
    '<div class="admin-stock-kpi"><div class="admin-stock-kpi-top"><span>Matured Payable</span><span class="badge badge-pending">Ready</span></div><strong>' + money(matured) + '</strong><small>Cleared for partner disbursement</small></div>' +
    '<div class="admin-stock-kpi"><div class="admin-stock-kpi-top"><span>Total Disbursed</span><span class="badge badge-approved">Settled</span></div><strong>' + money(disbursed) + '</strong><small>Transferred to verified banks</small></div>' +
    '<div class="admin-stock-kpi"><div class="admin-stock-kpi-top"><span>Platform Commission</span><span class="badge badge-approved">Net Fee</span></div><strong>' + money(commissionEarned) + '</strong><small>Retained marketplace margin</small></div>' +
  '</div>' +
  '<div class="admin-panel">' +
    '<div class="admin-panel-head">' +
      '<div><h2>Escrow & Partner Settlement Batches</h2><p class="admin-panel-sub">Approve matured payouts across specialists, salons, and brand sellers.</p></div>' +
      '<button type="button" class="btn btn-outline btn-sm" data-action="ops-export-payouts">Export Payouts CSV</button>' +
    '</div>' +
    '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Batch ID</th><th>Partner</th><th>Vertical Role</th><th>Gross Sales</th><th>Commission</th><th>Net Payout</th><th>Escrow State</th><th>Due Date</th><th>Action</th></tr></thead><tbody>' +
      batches.map(b => '<tr>' +
        '<td class="admin-num"><strong>' + esc(b.id) + '</strong></td>' +
        '<td><strong>' + esc(b.partner) + '</strong></td>' +
        '<td><span class="badge badge-info">' + esc(b.role) + '</span></td>' +
        '<td class="admin-num">' + money(b.gross) + '</td>' +
        '<td class="admin-num admin-muted">' + money(b.commission) + '</td>' +
        '<td class="admin-num"><strong>' + money(b.net) + '</strong></td>' +
        '<td><span class="badge badge-' + statusTone(b.escrowStatus) + '">' + esc(b.escrowStatus.replace('_', ' ')) + '</span></td>' +
        '<td class="admin-num"><small>' + esc(b.dueDate) + '</small></td>' +
        '<td>' + (b.escrowStatus === 'MATURED'
          ? '<button type="button" class="btn btn-success btn-sm" data-action="ops-payout-disburse" data-id="' + esc(b.id) + '">Disburse Payout</button>'
          : (b.escrowStatus === 'DISBURSED' ? '<small class="admin-muted">Paid</small>' : '<small class="admin-muted">In Hold Window</small>')) + '</td>' +
      '</tr>').join('') +
    '</tbody></table></div>' +
  '</div>';
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. PROFESSIONAL (SPECIALIST) RENDERERS
// ═══════════════════════════════════════════════════════════════════════════════

export function renderProTopbarControls(state, h) {
  const status = state.proOnlineStatus || 'online';
  return '<div class="ops-topbar-controls">' +
    '<div class="ops-status-group" role="group" aria-label="Availability status">' +
      [['online', 'Online'], ['break', 'On Break'], ['offline', 'Offline']].map(([k, lbl]) =>
        '<button type="button" class="ops-status-btn status-' + k + (status === k ? ' active' : '') + '" data-action="ops-pro-status" data-id="' + k + '"><i></i>' + lbl + '</button>'
      ).join('') +
    '</div>' +
    '<button type="button" class="ops-sos-btn" data-action="ops-pro-sos" title="Alert GlamGo 24x7 Safety Desk">' + h.icon('shield', 14) + ' Emergency SOS</button>' +
  '</div>';
}

export function renderProLifecycleBar(bookingId, stage) {
  const steps = [
    ['accepted', 'Accepted'],
    ['en_route', 'En Route'],
    ['arrived', 'Arrived (OTP)'],
    ['in_progress', 'In Progress'],
    ['completed', 'Done']
  ];
  const curIdx = Math.max(0, steps.findIndex(([k]) => k === (stage || 'accepted')));
  return '<div class="ops-stepper" aria-label="Job progress">' +
    steps.map(([key, label], i) => {
      const cls = i < curIdx ? 'done' : (i === curIdx ? 'active' : '');
      return '<button type="button" class="ops-step ' + cls + '" data-action="ops-pro-stage" data-id="' + bookingId + '|' + key + '">' + label + '</button>';
    }).join('') +
  '</div>';
}

export function renderProTravelControls(state, h) {
  const { esc } = h;
  const buf = state.proTravelBufferMin ?? 30;
  const rad = state.proServiceRadiusKm ?? 12;
  const zones = state.proZones || DEFAULT_DASHBOARD_OPS.proZones;
  return '<div class="dashboard-panel" style="margin-top:18px">' +
    '<div class="account-heading"><div><h3>Travel Buffer & Service Territory</h3><p class="partner-panel-sub">Prevent back-to-back commute delays by blocking automatic travel gaps between home visits.</p></div><span class="badge badge-info">' + buf + ' min buffer · ' + rad + ' km</span></div>' +
    '<form id="ops-pro-travel-form" class="form-grid" style="margin-top:14px">' +
      '<label>Inter-Visit Travel Buffer (minutes)<select name="proTravelBufferMin" class="admin-role-select" style="width:100%">' +
        [15, 30, 45, 60].map(m => '<option value="' + m + '" ' + (Number(buf) === m ? 'selected' : '') + '>' + m + ' minutes</option>').join('') +
      '</select></label>' +
      '<label>Max Travel Radius (km)<input name="proServiceRadiusKm" type="number" min="2" max="40" required value="' + esc(rad) + '"></label>' +
      '<label style="grid-column:1/-1">Preferred Pin-Codes / Neighbourhoods<input name="proZones" required value="' + esc(zones) + '"></label>' +
      '<button type="submit" class="btn btn-primary btn-sm" style="grid-column:1/-1">Save Territory & Buffer Settings</button>' +
    '</form>' +
  '</div>';
}

export function renderProClientCrmTab(state, h) {
  const { esc, empty } = h;
  const clients = listOf(state, 'proClientNotes');
  const sosLogs = listOf(state, 'proSosLogs');
  return '<div class="dashboard-panel" style="margin-bottom:18px">' +
    '<div class="account-heading"><div><h3>Client CRM, Skin Notes & Allergy Alerts</h3><p class="partner-panel-sub">Log sensitivities, shade preferences, and check-in history before arriving at a client doorstep.</p></div><span class="admin-metric-pill">' + clients.length + ' Clients</span></div>' +
    '<form id="ops-pro-client-form" class="form-grid partner-form-card">' +
      '<label>Client Name<input name="name" required placeholder="e.g. Ananya Sen"></label>' +
      '<label>Phone Number<input name="phone" required placeholder="+91 98200 11223"></label>' +
      '<label>Skin / Hair Type<input name="skinType" required placeholder="e.g. Dry / Sensitive"></label>' +
      '<label>Allergy / Sensitivity Alert<input name="allergies" required placeholder="e.g. Fragrance-free only, No ammonia"></label>' +
      '<label style="grid-column:1/-1">Treatment & Product Notes<textarea name="formulaNotes" rows="2" required placeholder="Preferred massage pressure, serum base, or shade match..."></textarea></label>' +
      '<button type="submit" class="btn btn-primary" style="grid-column:1/-1">+ Save Client Profile Note</button>' +
    '</form>' +
    (clients.length ? '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Client</th><th>Visits</th><th>Skin / Hair Profile</th><th>Allergy Alerts</th><th>Specialist Notes</th></tr></thead><tbody>' +
      clients.map(c => '<tr>' +
        '<td><strong>' + esc(c.name) + '</strong><br><small class="admin-muted">' + esc(c.phone) + '</small></td>' +
        '<td class="admin-num"><strong>' + c.visits + '</strong><br><small class="admin-muted">Last ' + esc(c.lastVisit) + '</small></td>' +
        '<td><span class="badge badge-info">' + esc(c.skinType) + '</span></td>' +
        '<td><span class="badge badge-' + (String(c.allergies).toLowerCase().includes('none') ? 'approved' : 'warning') + '">' + esc(c.allergies) + '</span></td>' +
        '<td><small>' + esc(c.formulaNotes) + '</small></td>' +
      '</tr>').join('') +
    '</tbody></table></div>' : empty('user', 'No client notes yet', 'Save client allergy and preference notes above.')) +
  '</div>' +
  '<div class="dashboard-panel">' +
    '<div class="account-heading"><div><h3>Field Safety & SOS Check-In Log</h3><p class="partner-panel-sub">Live doorstep safety dispatches shared with GlamGo Trust & Safety Desk.</p></div><button type="button" class="ops-sos-btn" data-action="ops-pro-sos">Trigger Test SOS Alert</button></div>' +
    (sosLogs.length ? '<div class="partner-feed">' + sosLogs.map(s => '<div class="dash-row"><div><strong>' + esc(s.timestamp) + '</strong><small>' + esc(s.note) + '</small></div><span class="badge badge-rejected">' + esc(s.status) + '</span></div>').join('') + '</div>'
      : '<div class="admin-empty-inline">All clear — 0 safety incidents recorded. Emergency SOS button in the top bar stays armed on every visit.</div>') +
  '</div>';
}

export function renderProPortfolioTab(state, h) {
  const { esc } = h;
  const items = listOf(state, 'proPortfolio');
  return '<div class="dashboard-panel">' +
    '<div class="account-heading"><div><h3>Before & After Transformation Portfolio</h3><p class="partner-panel-sub">Verified lookbook photographs shown on your public specialist booking card.</p></div><span class="admin-metric-pill">' + items.length + ' Looks</span></div>' +
    '<form id="ops-pro-portfolio-form" class="form-grid partner-form-card">' +
      '<label>Transformation Title<input name="title" required placeholder="e.g. Reception Soft Glam"></label>' +
      '<label>Category<select name="category" class="admin-role-select" style="width:100%"><option>Makeup</option><option>Skin</option><option>Hair</option><option>Nails</option><option>Spa</option></select></label>' +
      '<label>Duration<input name="duration" required value="60 min"></label>' +
      '<label>Lookbook Image URL<input name="img" required value="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80"></label>' +
      '<label style="grid-column:1/-1">Technique & Products Used<input name="notes" required placeholder="e.g. Hyaluronic prep + Velvet Form Soft Nude"></label>' +
      '<button type="submit" class="btn btn-primary" style="grid-column:1/-1">+ Publish Look to Portfolio</button>' +
    '</form>' +
    '<div class="ops-portfolio-grid">' +
      items.map(item => '<article class="ops-portfolio-card">' +
        '<img src="' + esc(item.img) + '" alt="' + esc(item.title) + '" loading="lazy">' +
        '<div class="ops-portfolio-body">' +
          '<div class="ops-portfolio-head"><span class="badge badge-info">' + esc(item.category) + '</span><small class="admin-muted">' + esc(item.duration) + '</small></div>' +
          '<h4>' + esc(item.title) + '</h4>' +
          '<p>' + esc(item.notes) + '</p>' +
        '</div>' +
      '</article>').join('') +
    '</div>' +
  '</div>';
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. SALON OWNER RENDERERS
// ═══════════════════════════════════════════════════════════════════════════════

export function renderSalonChairCalendarTab(state, h) {
  const { esc, money, statusTone } = h;
  const slots = listOf(state, 'salonChairBookings');
  const staffRoster = (state.partnerSalonStaff && state.partnerSalonStaff.length)
    ? state.partnerSalonStaff.map(s => s.name)
    : ['Nisha Kapoor', 'Riya Malhotra', 'Meera Shah'];
  const stylists = Array.from(new Set([...staffRoster, ...slots.map(s => s.stylist)]));
  const times = ['10:00 AM', '11:30 AM', '01:00 PM', '03:00 PM', '05:00 PM'];

  return '<div class="dashboard-panel" style="margin-bottom:18px">' +
    '<div class="account-heading"><div><h3>Multi-Stylist Chair Calendar</h3><p class="partner-panel-sub">Live front-desk column view. Click any chair card to advance status (Booked → Checked-In → In-Chair → Completed).</p></div><span class="admin-metric-pill">' + slots.length + ' Appointments Today</span></div>' +
    '<div class="ops-chair-grid-wrap">' +
      '<div class="ops-chair-grid" style="grid-template-columns: 92px repeat(' + stylists.length + ', minmax(190px, 1fr))">' +
        '<div class="ops-chair-corner">Time</div>' +
        stylists.map(st => '<div class="ops-chair-colhead">' + esc(st) + '</div>').join('') +
        times.map(t => {
          return '<div class="ops-chair-time">' + esc(t) + '</div>' + stylists.map(st => {
            const match = slots.find(s => s.stylist === st && s.time === t);
            if (!match) {
              return '<div class="ops-chair-cell empty"><span class="admin-muted">Open Slot</span></div>';
            }
            return '<div class="ops-chair-cell">' +
              '<button type="button" class="ops-chair-slot status-' + statusTone(match.status) + '" data-action="ops-salon-chair-cycle" data-id="' + esc(match.id) + '">' +
                '<div class="ops-chair-slot-top"><strong>' + esc(match.client) + '</strong><span class="badge badge-' + statusTone(match.status) + '">' + esc(match.status) + '</span></div>' +
                '<small>' + esc(match.service) + ' · ' + money(match.price) + '</small>' +
              '</button>' +
            '</div>';
          }).join('');
        }).join('') +
      '</div>' +
    '</div>' +
  '</div>' +
  '<div class="dashboard-panel">' +
    '<div class="account-heading"><div><h3>Add Walk-In or Waitlist Client</h3><p class="partner-panel-sub">Assign an instant chair slot for walk-in guests.</p></div></div>' +
    '<form id="ops-salon-walkin-form" class="form-grid">' +
      '<label>Guest Name<input name="client" required placeholder="e.g. Simran Kaur"></label>' +
      '<label>Assign Stylist<select name="stylist" class="admin-role-select" style="width:100%">' + stylists.map(st => '<option>' + esc(st) + '</option>').join('') + '</select></label>' +
      '<label>Time Slot<select name="time" class="admin-role-select" style="width:100%">' + times.map(t => '<option>' + esc(t) + '</option>').join('') + '</select></label>' +
      '<label>Treatment<input name="service" required placeholder="e.g. Gloss Blowout"></label>' +
      '<label>Service Fee (₹)<input name="price" type="number" required value="999"></label>' +
      '<button type="submit" class="btn btn-primary" style="grid-column:1/-1">+ Assign Chair Slot</button>' +
    '</form>' +
  '</div>';
}

export function renderSalonPosTab(state, h) {
  const { esc, money } = h;
  const bills = listOf(state, 'salonPosBills');
  const totalSales = bills.reduce((a, b) => a + Number(b.total || 0), 0);
  const upiTotal = bills.filter(b => b.paymentMethod === 'UPI').reduce((a, b) => a + Number(b.total || 0), 0);
  const cardTotal = bills.filter(b => b.paymentMethod === 'Card').reduce((a, b) => a + Number(b.total || 0), 0);
  const cashTotal = bills.filter(b => b.paymentMethod === 'Cash').reduce((a, b) => a + Number(b.total || 0), 0);

  return '<div class="admin-stock-kpi-grid">' +
    '<div class="admin-stock-kpi"><div class="admin-stock-kpi-top"><span>Today Z-Report</span><span class="badge badge-approved">POS</span></div><strong>' + money(totalSales) + '</strong><small>' + bills.length + ' settled invoices</small></div>' +
    '<div class="admin-stock-kpi"><div class="admin-stock-kpi-top"><span>UPI / QR</span><span class="badge badge-info">Instant</span></div><strong>' + money(upiTotal) + '</strong><small>Zero MDR settlement</small></div>' +
    '<div class="admin-stock-kpi"><div class="admin-stock-kpi-top"><span>Cards</span><span class="badge badge-info">Terminal</span></div><strong>' + money(cardTotal) + '</strong><small>Tap-to-pay receipts</small></div>' +
    '<div class="admin-stock-kpi"><div class="admin-stock-kpi-top"><span>Cash Drawer</span><span class="badge badge-info">Desk</span></div><strong>' + money(cashTotal) + '</strong><small>Counter till balance</small></div>' +
  '</div>' +
  '<div class="admin-split-grid">' +
    '<div class="dashboard-panel">' +
      '<div class="account-heading"><div><h3>Front-Desk POS Checkout</h3><p class="partner-panel-sub">Combine treatments, retail add-ons, membership discounts, and tips.</p></div></div>' +
      '<form id="ops-salon-pos-form" class="form-grid">' +
        '<label>Client Name<input name="client" required placeholder="e.g. Aanya Mehta"></label>' +
        '<label>Treatment / Service<select name="serviceName" class="admin-role-select" style="width:100%">' +
          (h.services || []).map(s => '<option value="' + esc(s.name + '|' + s.price) + '">' + esc(s.name) + ' (' + money(s.price) + ')</option>').join('') +
        '</select></label>' +
        '<label>Retail Shelf Add-On<select name="retailItem" class="admin-role-select" style="width:100%">' +
          '<option value="None|0">None</option>' +
          (h.products || []).slice(0, 5).map(p => '<option value="' + esc(p.name + '|' + p.price) + '">' + esc(p.name) + ' (' + money(p.price) + ')</option>').join('') +
        '</select></label>' +
        '<label>Discount / Coupon (₹)<input name="discount" type="number" min="0" value="0"></label>' +
        '<label>Stylist Tip (₹)<input name="tip" type="number" min="0" value="150"></label>' +
        '<label>Payment Method<select name="paymentMethod" class="admin-role-select" style="width:100%"><option>UPI</option><option>Card</option><option>Cash</option></select></label>' +
        '<button type="submit" class="btn btn-primary" style="grid-column:1/-1">Complete Checkout & Record Receipt</button>' +
      '</form>' +
    '</div>' +
    '<div class="dashboard-panel">' +
      '<div class="account-heading"><div><h3>Recent POS Bills</h3><p class="partner-panel-sub">Desk receipts settled today.</p></div><span class="admin-metric-pill">' + bills.length + ' Receipts</span></div>' +
      '<div class="partner-feed">' +
        bills.map(b => '<div class="dash-row">' +
          '<div><strong>' + esc(b.id) + ' · ' + esc(b.client) + '</strong><small>' + esc(b.items) + ' · Disc ' + money(b.discount) + ' · Tip ' + money(b.tip) + ' · ' + esc(b.time) + '</small></div>' +
          '<div style="text-align:right"><strong>' + money(b.total) + '</strong><br><span class="badge badge-info">' + esc(b.paymentMethod) + '</span></div>' +
        '</div>').join('') +
      '</div>' +
    '</div>' +
  '</div>';
}

export function renderSalonBackbarTab(state, h) {
  const { esc } = h;
  const stock = listOf(state, 'salonBackbarStock');
  const lowItems = stock.filter(i => i.stock <= i.reorderAt).length;

  return '<div class="dashboard-panel">' +
    '<div class="account-heading">' +
      '<div><h3>Backbar Supplies & Retail Shelf Inventory</h3><p class="partner-panel-sub">Track consumable treatment backbar bottles separately from take-home retail stock.</p></div>' +
      '<span class="badge badge-' + (lowItems ? 'warning' : 'approved') + '">' + (lowItems ? lowItems + ' Reorder Alerts' : 'All Stock Healthy') + '</span>' +
    '</div>' +
    '<form id="ops-salon-stock-form" class="form-grid partner-form-card">' +
      '<label>Item Name<input name="name" required placeholder="e.g. Botanical Clay Mask"></label>' +
      '<label>Stock Pool<select name="type" class="admin-role-select" style="width:100%"><option>Backbar</option><option>Retail</option></select></label>' +
      '<label>Initial Quantity<input name="stock" type="number" min="0" required value="12"></label>' +
      '<label>Unit Label<input name="unit" required value="bottles"></label>' +
      '<button type="submit" class="btn btn-primary" style="grid-column:1/-1">+ Add Supply Item</button>' +
    '</form>' +
    '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Item</th><th>Pool</th><th>On Hand</th><th>Reorder Point</th><th>Status</th><th>Adjust Stock</th></tr></thead><tbody>' +
      stock.map(i => '<tr>' +
        '<td><strong>' + esc(i.name) + '</strong></td>' +
        '<td><span class="badge badge-info">' + esc(i.type) + '</span></td>' +
        '<td class="admin-num"><strong>' + i.stock + ' ' + esc(i.unit) + '</strong></td>' +
        '<td class="admin-num admin-muted">' + i.reorderAt + ' ' + esc(i.unit) + '</td>' +
        '<td><span class="badge badge-' + (i.stock <= i.reorderAt ? 'warning' : 'approved') + '">' + (i.stock <= i.reorderAt ? 'REORDER SOON' : 'STOCKED') + '</span></td>' +
        '<td><div class="admin-actions"><button type="button" class="btn btn-outline btn-sm" data-action="ops-salon-stock-adj" data-id="' + esc(i.id) + '|-1">Use -1</button><button type="button" class="btn btn-success btn-sm" data-action="ops-salon-stock-adj" data-id="' + esc(i.id) + '|5">Restock +5</button></div></td>' +
      '</tr>').join('') +
    '</tbody></table></div>' +
  '</div>';
}

export function renderSalonFormulasTab(state, h) {
  const { esc, money } = h;
  const formulas = listOf(state, 'salonClientFormulas');
  return '<div class="dashboard-panel">' +
    '<div class="account-heading"><div><h3>Client Hair Formulas, Skin Logs & LTV</h3><p class="partner-panel-sub">Shared stylist reference sheet for repeatable color mixes, allergies, and preferred therapists.</p></div><span class="admin-metric-pill">' + formulas.length + ' Client Profiles</span></div>' +
    '<form id="ops-salon-formula-form" class="form-grid partner-form-card">' +
      '<label>Client Name<input name="name" required placeholder="e.g. Rhea Kapoor"></label>' +
      '<label>Phone<input name="phone" required placeholder="98200 12345"></label>' +
      '<label>Preferred Stylist<input name="preferredStylist" required placeholder="Nisha Kapoor"></label>' +
      '<label>Allergy / Waiver Alert<input name="allergies" required value="None reported"></label>' +
      '<label style="grid-column:1/-1">Color / Facial Formula Mix<textarea name="colorFormula" rows="2" required placeholder="e.g. 7N Beige + 20Vol developer (35m), gloss tone 9V"></textarea></label>' +
      '<button type="submit" class="btn btn-primary" style="grid-column:1/-1">+ Save Client Formula Record</button>' +
    '</form>' +
    '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Client</th><th>Visits & LTV</th><th>Preferred Expert</th><th>Allergy Notes</th><th>Saved Formula</th></tr></thead><tbody>' +
      formulas.map(f => '<tr>' +
        '<td><strong>' + esc(f.name) + '</strong><br><small class="admin-muted">' + esc(f.phone) + '</small></td>' +
        '<td class="admin-num"><strong>' + f.visits + ' visits</strong><br><small class="admin-muted">' + money(f.ltv) + ' LTV</small></td>' +
        '<td><span class="badge badge-info">' + esc(f.preferredStylist) + '</span></td>' +
        '<td><span class="badge badge-' + (String(f.allergies).toLowerCase().includes('none') ? 'approved' : 'warning') + '">' + esc(f.allergies) + '</span></td>' +
        '<td><small>' + esc(f.colorFormula) + '</small></td>' +
      '</tr>').join('') +
    '</tbody></table></div>' +
  '</div>';
}

export function renderSalonStaffPayrollAddon(state, salonStaff, h) {
  const { esc, money } = h;
  const payroll = objOf(state, 'salonStaffPayroll');
  const names = Array.from(new Set([...(salonStaff || []).map(s => s.name), ...Object.keys(payroll)]));
  if (!names.length) return '';
  return '<div class="partner-subpanel" style="margin-top:22px">' +
    '<div class="account-heading"><div><h4>Staff Commission & Monthly Payroll Summary</h4><p class="partner-panel-sub">Automated stylist commission splits and settled tip earnings.</p></div></div>' +
    '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Stylist</th><th>Bookings</th><th>Service Revenue</th><th>Commission Rate</th><th>Tips Earned</th><th>Total Stylist Payout</th></tr></thead><tbody>' +
      names.map(name => {
        const rec = payroll[name] || { commissionPct: 30, bookings: 12, revenue: 18500, tips: 1200 };
        const payout = Math.round((rec.revenue * rec.commissionPct) / 100) + Number(rec.tips || 0);
        return '<tr>' +
          '<td><strong>' + esc(name) + '</strong></td>' +
          '<td class="admin-num">' + rec.bookings + '</td>' +
          '<td class="admin-num">' + money(rec.revenue) + '</td>' +
          '<td class="admin-num"><span class="badge badge-info">' + rec.commissionPct + '%</span></td>' +
          '<td class="admin-num">' + money(rec.tips) + '</td>' +
          '<td class="admin-num"><strong>' + money(payout) + '</strong></td>' +
        '</tr>';
      }).join('') +
    '</tbody></table></div>' +
  '</div>';
}

export function renderSalonBranchesEnhanced(state, h) {
  const { esc } = h;
  const branches = listOf(state, 'salonBranches');
  return '<div class="dashboard-panel">' +
    '<div class="account-heading"><div><h3>Multi-Branch Studio Network</h3><p class="partner-panel-sub">Manage physical branches, chair capacity, and local operating windows.</p></div><span class="admin-metric-pill">' + branches.length + ' Branches Active</span></div>' +
    '<form id="ops-salon-branch-form" class="form-grid partner-form-card">' +
      '<label>Branch Name<input name="name" required placeholder="e.g. The Ivory Room — Worli Seaface"></label>' +
      '<label>Locality<input name="area" required placeholder="e.g. Worli, Mumbai"></label>' +
      '<label>Operating Hours<input name="hours" required value="10:00 AM – 8:00 PM"></label>' +
      '<label>Chair Count<input name="chairs" type="number" min="1" max="30" required value="5"></label>' +
      '<button type="submit" class="btn btn-primary" style="grid-column:1/-1">+ Add Studio Branch</button>' +
    '</form>' +
    '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Branch</th><th>Neighbourhood</th><th>Hours</th><th>Chairs</th><th>Status</th></tr></thead><tbody>' +
      branches.map(b => '<tr>' +
        '<td><strong>' + esc(b.name) + '</strong></td>' +
        '<td>' + esc(b.area) + '</td>' +
        '<td class="admin-num">' + esc(b.hours) + '</td>' +
        '<td class="admin-num">' + b.chairs + ' chairs</td>' +
        '<td><span class="badge badge-approved">' + esc(b.status) + '</span></td>' +
      '</tr>').join('') +
    '</tbody></table></div>' +
  '</div>';
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. PRODUCT SELLER RENDERERS
// ═══════════════════════════════════════════════════════════════════════════════

function classifyBatchShelfLife(batch) {
  const days = Math.ceil((new Date(batch.expiryDate).getTime() - Date.now()) / 86400000);
  if (days <= 0 || batch.autoDelisted) {
    return { tone: 'red', label: 'Expired (' + Math.abs(days) + 'd ago) · Auto-Delisted', days };
  }
  if (days <= 90) {
    return { tone: 'yellow', label: 'Near Expiry (' + days + 'd left)', days };
  }
  return { tone: 'green', label: 'Safe (' + days + 'd left)', days };
}

export function renderSellerBatchExpiryTab(state, h) {
  const { esc } = h;
  const batches = [...listOf(state, 'sellerBatches')].sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
  const counts = { green: 0, yellow: 0, red: 0, units: 0 };
  batches.forEach(b => {
    const info = classifyBatchShelfLife(b);
    counts[info.tone]++;
    counts.units += Number(b.qty || 0);
  });

  return '<div class="admin-stock-kpi-grid">' +
    '<div class="admin-stock-kpi"><div class="admin-stock-kpi-top"><span>Safe (>90 Days)</span><span class="badge badge-approved">Green</span></div><strong>' + counts.green + ' Batches</strong><small>Eligible for standard storefront sale</small></div>' +
    '<div class="admin-stock-kpi"><div class="admin-stock-kpi-top"><span>Near Expiry (≤90d)</span><span class="badge badge-warning">Yellow</span></div><strong>' + counts.yellow + ' Batches</strong><small>Eligible for FIFO & flash clearance</small></div>' +
    '<div class="admin-stock-kpi"><div class="admin-stock-kpi-top"><span>Expired / Quarantined</span><span class="badge badge-rejected">Red</span></div><strong>' + counts.red + ' Batches</strong><small>Auto-delisted to protect consumers</small></div>' +
    '<div class="admin-stock-kpi"><div class="admin-stock-kpi-top"><span>Tracked Lot Units</span><span class="badge badge-info">FIFO Sorted</span></div><strong>' + counts.units + ' Units</strong><small>Oldest valid lots picked first</small></div>' +
  '</div>' +
  '<div class="dashboard-panel">' +
    '<div class="account-heading"><div><h3>Cosmetic Batch, Lot & Expiry Governance (FIFO)</h3><p class="partner-panel-sub">Mandatory manufacturing/expiry compliance across all beauty & skincare SKUs. Batches are sorted earliest-expiry-first.</p></div><span class="badge badge-info">Pick Priority: FIFO</span></div>' +
    '<form id="ops-seller-batch-form" class="form-grid partner-form-card">' +
      '<label>Product SKU<select name="productKey" class="admin-role-select" style="width:100%">' +
        (h.products || []).map(p => '<option value="' + esc(p.id + '|' + p.name) + '">' + esc(p.name) + ' (' + esc(p.brand) + ')</option>').join('') +
      '</select></label>' +
      '<label>Variant / Size<input name="variant" required value="50 ml"></label>' +
      '<label>Batch / Lot Code<input name="batchNo" required placeholder="e.g. LUM-2611-X"></label>' +
      '<label>Units in Lot<input name="qty" type="number" min="1" required value="40"></label>' +
      '<label>Manufacturing Date<input name="mfgDate" type="date" required value="' + isoOffsetDays(-30) + '"></label>' +
      '<label>Expiry Date<input name="expiryDate" type="date" required value="' + isoOffsetDays(365) + '"></label>' +
      '<button type="submit" class="btn btn-primary" style="grid-column:1/-1">+ Register Cosmetic Batch</button>' +
    '</form>' +
    '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>FIFO Rank</th><th>Product & Variant</th><th>Batch No</th><th>Mfg / Expiry</th><th>Units</th><th>Shelf-Life Health</th><th>Actions</th></tr></thead><tbody>' +
      batches.map((b, idx) => {
        const shelf = classifyBatchShelfLife(b);
        return '<tr>' +
          '<td class="admin-num"><strong>#' + (idx + 1) + '</strong></td>' +
          '<td><strong>' + esc(b.productName) + '</strong><br><small class="admin-muted">' + esc(b.variant) + (b.clearancePct ? ' · ' + b.clearancePct + '% Flash Off' : '') + '</small></td>' +
          '<td><code class="admin-ip">' + esc(b.batchNo) + '</code></td>' +
          '<td class="admin-num"><small>Mfg ' + esc(b.mfgDate) + '<br>Exp <strong>' + esc(b.expiryDate) + '</strong></small></td>' +
          '<td class="admin-num"><strong>' + b.qty + '</strong></td>' +
          '<td><span class="ops-shelf-pill shelf-' + shelf.tone + '">' + esc(shelf.label) + '</span></td>' +
          '<td><div class="admin-actions">' +
            (shelf.tone === 'yellow' && !b.clearancePct ? '<button type="button" class="btn btn-outline btn-sm" data-action="ops-batch-clearance" data-id="' + esc(b.id) + '">20% Clearance</button>' : '') +
            (!b.autoDelisted ? '<button type="button" class="btn btn-danger btn-sm" data-action="ops-batch-quarantine" data-id="' + esc(b.id) + '">Quarantine</button>' : '<small class="admin-muted">Auto-Delisted</small>') +
          '</div></td>' +
        '</tr>';
      }).join('') +
    '</tbody></table></div>' +
  '</div>';
}

export function renderSellerComplianceTab(state, h) {
  const { esc } = h;
  const docs = listOf(state, 'sellerComplianceDocs');
  return '<div class="dashboard-panel">' +
    '<div class="account-heading">' +
      '<div><h3>Regulatory Documents, INCI Vault & HSN/GST</h3><p class="partner-panel-sub">Mandatory CDSCO licenses, cruelty-free proofs, and GST tax classification for marketplace clearance.</p></div>' +
      '<button type="button" class="btn btn-outline btn-sm" data-action="ops-export-gst">Export GST / HSN Ledger CSV</button>' +
    '</div>' +
    '<form id="ops-seller-compliance-form" class="form-grid partner-form-card">' +
      '<label>Document Title<input name="title" required placeholder="e.g. Dermatological Patch Test Report"></label>' +
      '<label>Category<select name="category" class="admin-role-select" style="width:100%"><option>Regulatory</option><option>Safety</option><option>Ethics</option><option>Tax</option></select></label>' +
      '<label>HSN Code<input name="hsnCode" required value="3304"></label>' +
      '<label>GST Slab (%)<input name="gstPct" type="number" min="0" max="28" required value="18"></label>' +
      '<label style="grid-column:1/-1">Valid Until Date<input name="validUntil" type="date" required value="' + isoOffsetDays(365) + '"></label>' +
      '<button type="submit" class="btn btn-primary" style="grid-column:1/-1">+ Upload Compliance Record</button>' +
    '</form>' +
    '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Compliance Document</th><th>Category</th><th>HSN / GST</th><th>Valid Until</th><th>Verification Status</th></tr></thead><tbody>' +
      docs.map(d => '<tr>' +
        '<td><strong>' + esc(d.title) + '</strong></td>' +
        '<td><span class="badge badge-info">' + esc(d.category) + '</span></td>' +
        '<td class="admin-num">HSN <code>' + esc(d.hsnCode) + '</code> · ' + esc(d.gstPct) + '%</td>' +
        '<td class="admin-num">' + esc(d.validUntil) + '</td>' +
        '<td><span class="badge badge-' + (d.status === 'VERIFIED' ? 'approved' : 'pending') + '">' + esc(d.status.replace('_', ' ')) + '</span></td>' +
      '</tr>').join('') +
    '</tbody></table></div>' +
  '</div>';
}

export function renderSellerFulfillmentBadges(items, state) {
  const flagsMap = objOf(state, 'sellerFulfillmentFlags');
  const flags = new Set();
  (items || []).forEach(it => {
    const pid = it.product_id || it.id || 'b1';
    (flagsMap[pid] || ['Fragile Parcel']).forEach(f => flags.add(f));
  });
  return '<div class="ops-handling-tags">' +
    '<span class="ops-sla-pill">Dispatch SLA: 4h 20m</span>' +
    Array.from(flags).map(f => '<span class="badge badge-info">' + f + '</span>').join('') +
  '</div>';
}

export function renderSellerQcAddon(ret, state, h) {
  const { esc } = h;
  const qcMap = objOf(state, 'sellerReturnQc');
  const qc = qcMap[ret.id] || { sealIntact: false, untampered: false, disposition: 'PENDING' };
  return '<div class="ops-qc-card">' +
    '<div class="ops-qc-head"><strong>Hygiene & Safety Seal QC Inspection</strong><span class="badge badge-' + (qc.disposition === 'RESTOCKED' ? 'approved' : qc.disposition === 'WRITEOFF' ? 'rejected' : 'pending') + '">' + esc(qc.disposition) + '</span></div>' +
    '<div class="ops-qc-checks">' +
      '<button type="button" class="btn btn-outline btn-sm" data-action="ops-qc-toggle" data-id="' + esc(ret.id) + '|sealIntact">' + (qc.sealIntact ? '✓ Safety Seal Intact' : '○ Verify Safety Seal') + '</button>' +
      '<button type="button" class="btn btn-outline btn-sm" data-action="ops-qc-toggle" data-id="' + esc(ret.id) + '|untampered">' + (qc.untampered ? '✓ Formula Untampered' : '○ Verify Untampered') + '</button>' +
      '<button type="button" class="btn btn-success btn-sm" data-action="ops-qc-dispose" data-id="' + esc(ret.id) + '|RESTOCKED">Restockable</button>' +
      '<button type="button" class="btn btn-danger btn-sm" data-action="ops-qc-dispose" data-id="' + esc(ret.id) + '|WRITEOFF">Dispose / Write-Off</button>' +
    '</div>' +
  '</div>';
}

export const SAMPLE_SELLER_RETURNS_FALLBACK = [
  { id: 'RET-301', suborder_id: 'SUB-8812', order_item_id: 1, return_qty: 1, refund_amount: 1890, reason: 'Damaged outer dropper box on arrival', status: 'REQUESTED', refund_status: 'PENDING', created_at: isoOffsetDays(-1), detailed_explanation: 'Glass pump intact inside secondary tray, requesting inspection.' },
  { id: 'RET-302', suborder_id: 'SUB-8790', order_item_id: 2, return_qty: 1, refund_amount: 990, reason: 'Opened lipstick shade mismatch', status: 'APPROVED', refund_status: 'PENDING', created_at: isoOffsetDays(-3), detailed_explanation: 'Hygiene seal broken — route for cosmetic disposal write-off.' }
];

// ═══════════════════════════════════════════════════════════════════════════════
// 5. UNIFIED ACTION & FORM SUBMIT HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

export function handleDashboardOpsAction(action, id, _el, state, ctx) {
  const { persist, render, toast } = ctx;

  if (action === 'ops-coupon-toggle') {
    state.adminCoupons = listOf(state, 'adminCoupons').map(c => c.id === id ? { ...c, active: !c.active } : c);
    toast('Coupon status updated');
  } else if (action === 'ops-coupon-delete') {
    state.adminCoupons = listOf(state, 'adminCoupons').filter(c => c.id !== id);
    toast('Coupon removed');
  } else if (action === 'ops-dispute-resolve') {
    const [dId, decision] = String(id).split('|');
    state.adminDisputes = listOf(state, 'adminDisputes').map(d => d.id === dId ? { ...d, status: decision } : d);
    toast('Dispute ' + dId + ' marked ' + decision.replace('_', ' '));
  } else if (action === 'ops-review-moderate') {
    const [rId, status] = String(id).split('|');
    state.adminReviewQueue = listOf(state, 'adminReviewQueue').map(r => r.id === rId ? { ...r, status } : r);
    toast('Review moderation saved: ' + status);
  } else if (action === 'ops-payout-disburse') {
    state.adminPayoutBatches = listOf(state, 'adminPayoutBatches').map(b => b.id === id ? { ...b, escrowStatus: 'DISBURSED' } : b);
    toast('Payout batch ' + id + ' disbursed to partner account');
  } else if (action === 'ops-export-payouts') {
    const batches = listOf(state, 'adminPayoutBatches');
    exportCsvFile('glamgo-payout-batches.csv', ['Batch ID', 'Partner', 'Role', 'Gross INR', 'Commission INR', 'Net Payout INR', 'Status', 'Due Date'],
      batches.map(b => [b.id, b.partner, b.role, b.gross, b.commission, b.net, b.escrowStatus, b.dueDate]));
    toast('Payout settlement ledger CSV exported');
    return;
  } else if (action === 'ops-pro-status') {
    state.proOnlineStatus = id;
    toast('Availability switched to ' + id.toUpperCase());
  } else if (action === 'ops-pro-sos') {
    const entry = { id: 'sos-' + Date.now(), timestamp: new Date().toLocaleString(), note: 'Live GPS pin & emergency ping dispatched to GlamGo Safety Team', status: 'DISPATCHED' };
    state.proSosLogs = [entry, ...listOf(state, 'proSosLogs')];
    toast('Emergency SOS Alert dispatched to Safety Desk');
  } else if (action === 'ops-pro-stage') {
    const [bId, stage] = String(id).split('|');
    state.proJobStages = { ...objOf(state, 'proJobStages'), [bId]: stage };
    toast('Booking #' + bId + ' updated to ' + stage.replace('_', ' ').toUpperCase());
  } else if (action === 'ops-salon-chair-cycle') {
    const cycle = ['Booked', 'Checked-In', 'In-Chair', 'Completed'];
    state.salonChairBookings = listOf(state, 'salonChairBookings').map(c => {
      if (c.id !== id) return c;
      const next = cycle[(cycle.indexOf(c.status) + 1) % cycle.length];
      return { ...c, status: next };
    });
    toast('Chair appointment status updated');
  } else if (action === 'ops-salon-stock-adj') {
    const [sId, deltaStr] = String(id).split('|');
    const delta = Number(deltaStr || 0);
    state.salonBackbarStock = listOf(state, 'salonBackbarStock').map(i => i.id === sId ? { ...i, stock: Math.max(0, Number(i.stock) + delta) } : i);
    toast('Salon inventory adjusted');
  } else if (action === 'ops-batch-clearance') {
    state.sellerBatches = listOf(state, 'sellerBatches').map(b => b.id === id ? { ...b, clearancePct: 20 } : b);
    toast('20% Near-Expiry Flash Clearance applied to batch');
  } else if (action === 'ops-batch-quarantine') {
    state.sellerBatches = listOf(state, 'sellerBatches').map(b => b.id === id ? { ...b, autoDelisted: true } : b);
    toast('Batch quarantined and auto-delisted from storefront');
  } else if (action === 'ops-export-gst') {
    const docs = listOf(state, 'sellerComplianceDocs');
    exportCsvFile('glamgo-seller-gst-hsn-ledger.csv', ['Document ID', 'Title', 'Category', 'HSN Code', 'GST %', 'Status', 'Valid Until'],
      docs.map(d => [d.id, d.title, d.category, d.hsnCode, d.gstPct, d.status, d.validUntil]));
    toast('GST / HSN ledger CSV exported');
    return;
  } else if (action === 'ops-qc-toggle') {
    const [retId, field] = String(id).split('|');
    const qcMap = objOf(state, 'sellerReturnQc');
    const cur = qcMap[retId] || { sealIntact: false, untampered: false, disposition: 'PENDING' };
    state.sellerReturnQc = { ...qcMap, [retId]: { ...cur, [field]: !cur[field] } };
    toast('Hygiene QC checklist updated');
  } else if (action === 'ops-qc-dispose') {
    const [retId, disposition] = String(id).split('|');
    const qcMap = objOf(state, 'sellerReturnQc');
    const cur = qcMap[retId] || { sealIntact: true, untampered: true, disposition: 'PENDING' };
    state.sellerReturnQc = { ...qcMap, [retId]: { ...cur, disposition } };
    toast('Return #' + retId + ' classified as ' + disposition);
  } else {
    return false;
  }

  persist();
  render();
  return true;
}

export function handleDashboardOpsSubmit(form, d, state, ctx) {
  const { persist, render, toast } = ctx;
  const fid = form.id;

  if (fid === 'ops-commission-form') {
    state.adminCommissions = {
      homePct: Number(d.get('homePct') || 15),
      salonPct: Number(d.get('salonPct') || 15),
      retailPct: Number(d.get('retailPct') || 18),
      escrowDays: Number(d.get('escrowDays') || 7),
      noShowFeePct: Number(d.get('noShowFeePct') || 25)
    };
    toast('Platform commission & escrow rules updated');
  } else if (fid === 'ops-coupon-form') {
    const code = String(d.get('code') || '').trim().toUpperCase();
    if (!code) return true;
    const item = {
      id: 'c-' + Date.now(),
      code,
      discount: Number(d.get('discount') || 10),
      maxDiscount: Number(d.get('maxDiscount') || 300),
      minOrder: Number(d.get('minOrder') || 999),
      scope: String(d.get('scope') || 'All Verticals'),
      uses: 0,
      active: true
    };
    state.adminCoupons = [item, ...listOf(state, 'adminCoupons')];
    form.reset();
    toast('Coupon ' + code + ' published');
  } else if (fid === 'ops-pro-travel-form') {
    state.proTravelBufferMin = Number(d.get('proTravelBufferMin') || 30);
    state.proServiceRadiusKm = Number(d.get('proServiceRadiusKm') || 12);
    state.proZones = String(d.get('proZones') || '').trim();
    toast('Travel buffer & territory saved');
  } else if (fid === 'ops-pro-client-form') {
    const rec = {
      id: 'pc-' + Date.now(),
      name: String(d.get('name') || '').trim(),
      phone: String(d.get('phone') || '').trim(),
      visits: 1,
      skinType: String(d.get('skinType') || '').trim(),
      allergies: String(d.get('allergies') || 'None reported').trim(),
      formulaNotes: String(d.get('formulaNotes') || '').trim(),
      lastVisit: isoOffsetDays(0)
    };
    state.proClientNotes = [rec, ...listOf(state, 'proClientNotes')];
    form.reset();
    toast('Client allergy & preference note saved');
  } else if (fid === 'ops-pro-portfolio-form') {
    const look = {
      id: 'pf-' + Date.now(),
      title: String(d.get('title') || '').trim(),
      category: String(d.get('category') || 'Makeup'),
      duration: String(d.get('duration') || '60 min').trim(),
      img: String(d.get('img') || '').trim(),
      notes: String(d.get('notes') || '').trim()
    };
    state.proPortfolio = [look, ...listOf(state, 'proPortfolio')];
    form.reset();
    toast('Look published to portfolio');
  } else if (fid === 'ops-salon-walkin-form') {
    const slot = {
      id: 'ch-' + Date.now(),
      stylist: String(d.get('stylist') || 'Nisha Kapoor'),
      time: String(d.get('time') || '03:00 PM'),
      client: String(d.get('client') || '').trim(),
      service: String(d.get('service') || '').trim(),
      price: Number(d.get('price') || 999),
      status: 'Checked-In'
    };
    state.salonChairBookings = [slot, ...listOf(state, 'salonChairBookings')];
    form.reset();
    toast('Walk-in client assigned to chair');
  } else if (fid === 'ops-salon-pos-form') {
    const [svcName, svcPrice] = String(d.get('serviceName') || 'Service|1000').split('|');
    const [retName, retPrice] = String(d.get('retailItem') || 'None|0').split('|');
    const subtotal = Number(svcPrice || 0) + Number(retPrice || 0);
    const discount = Number(d.get('discount') || 0);
    const tip = Number(d.get('tip') || 0);
    const total = Math.max(0, subtotal - discount + tip);
    const bill = {
      id: 'POS-' + String(900 + listOf(state, 'salonPosBills').length + 1),
      client: String(d.get('client') || 'Guest').trim(),
      items: retName !== 'None' ? svcName + ' + ' + retName : svcName,
      subtotal,
      discount,
      tip,
      total,
      paymentMethod: String(d.get('paymentMethod') || 'UPI'),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    state.salonPosBills = [bill, ...listOf(state, 'salonPosBills')];
    form.reset();
    toast('POS checkout ' + bill.id + ' settled (' + ctx.services.length + ' catalog synced)');
  } else if (fid === 'ops-salon-stock-form') {
    const item = {
      id: 'sb-' + Date.now(),
      name: String(d.get('name') || '').trim(),
      type: String(d.get('type') || 'Backbar'),
      stock: Number(d.get('stock') || 10),
      reorderAt: 5,
      unit: String(d.get('unit') || 'units').trim()
    };
    state.salonBackbarStock = [item, ...listOf(state, 'salonBackbarStock')];
    form.reset();
    toast('Supply item added to ' + item.type + ' inventory');
  } else if (fid === 'ops-salon-formula-form') {
    const rec = {
      id: 'cf-' + Date.now(),
      name: String(d.get('name') || '').trim(),
      phone: String(d.get('phone') || '').trim(),
      visits: 1,
      ltv: 1500,
      preferredStylist: String(d.get('preferredStylist') || 'Nisha Kapoor').trim(),
      allergies: String(d.get('allergies') || 'None reported').trim(),
      colorFormula: String(d.get('colorFormula') || '').trim()
    };
    state.salonClientFormulas = [rec, ...listOf(state, 'salonClientFormulas')];
    form.reset();
    toast('Client color/skin formula archived');
  } else if (fid === 'ops-salon-branch-form') {
    const br = {
      id: 'br-' + Date.now(),
      name: String(d.get('name') || '').trim(),
      area: String(d.get('area') || '').trim(),
      hours: String(d.get('hours') || '10:00 AM – 8:00 PM').trim(),
      chairs: Number(d.get('chairs') || 5),
      status: 'Active'
    };
    state.salonBranches = [...listOf(state, 'salonBranches'), br];
    form.reset();
    toast('Branch added to studio network');
  } else if (fid === 'ops-seller-batch-form') {
    const [productId, productName] = String(d.get('productKey') || 'b1|Product').split('|');
    const batch = {
      id: 'bat-' + Date.now(),
      productId,
      productName,
      variant: String(d.get('variant') || '50 ml').trim(),
      batchNo: String(d.get('batchNo') || '').trim().toUpperCase(),
      mfgDate: String(d.get('mfgDate') || isoOffsetDays(-30)),
      expiryDate: String(d.get('expiryDate') || isoOffsetDays(365)),
      qty: Number(d.get('qty') || 40),
      clearancePct: 0,
      autoDelisted: new Date(String(d.get('expiryDate'))).getTime() <= Date.now()
    };
    state.sellerBatches = [batch, ...listOf(state, 'sellerBatches')];
    form.reset();
    toast('Batch ' + batch.batchNo + ' registered in FIFO ledger');
  } else if (fid === 'ops-seller-compliance-form') {
    const doc = {
      id: 'doc-' + Date.now(),
      title: String(d.get('title') || '').trim(),
      category: String(d.get('category') || 'Regulatory'),
      hsnCode: String(d.get('hsnCode') || '3304').trim(),
      gstPct: Number(d.get('gstPct') || 18),
      validUntil: String(d.get('validUntil') || isoOffsetDays(365)),
      status: 'VERIFIED'
    };
    state.sellerComplianceDocs = [doc, ...listOf(state, 'sellerComplianceDocs')];
    form.reset();
    toast('Compliance certificate archived');
  } else {
    return false;
  }

  persist();
  render();
  return true;
}
