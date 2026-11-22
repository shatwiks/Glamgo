const PRODUCTION_BACKEND_URL = 'https://glamgo-backend-lqn6.onrender.com/api/v1';

function resolveApiBase() {
  if (typeof window !== 'undefined' && window.GLAMGO_API_URL) {
    return window.GLAMGO_API_URL;
  }
  const envUrl = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.includes('glamgo-backend.onrender.com') && !envUrl.includes('glamgo-backend-lqn6.onrender.com')) {
    // Correct obsolete or typod Render URL lacking the dynamic suffix -lqn6
    return PRODUCTION_BACKEND_URL;
  }
  if (envUrl) {
    return envUrl;
  }
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('vercel.app')) {
    return PRODUCTION_BACKEND_URL;
  }
  return '/api/v1';
}

const API_BASE = resolveApiBase();

export const tokenStorage = {
  get: () => localStorage.getItem('glamgo_token'),
  set: (token) => localStorage.setItem('glamgo_token', token),
  remove: () => localStorage.removeItem('glamgo_token'),
  getRefresh: () => localStorage.getItem('glamgo_refresh_token'),
  setRefresh: (token) => localStorage.setItem('glamgo_refresh_token', token),
  removeRefresh: () => localStorage.removeItem('glamgo_refresh_token'),
};

export async function apiRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = tokenStorage.get();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, { ...options, headers });

    // MAJ-07: Intercept 401 Unauthorized for transparent token refresh
    if (res.status === 401 && !options._retry && !endpoint.startsWith('/auth/')) {
      const refreshToken = tokenStorage.getRefresh();
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
          });
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            tokenStorage.set(refreshData.access_token);
            tokenStorage.setRefresh(refreshData.refresh_token);
            headers['Authorization'] = `Bearer ${refreshData.access_token}`;
            return await apiRequest(endpoint, { ...options, _retry: true, headers });
          } else {
            tokenStorage.remove();
            tokenStorage.removeRefresh();
          }
        } catch {
          tokenStorage.remove();
          tokenStorage.removeRefresh();
        }
      }
    }

    if (!res.ok) {
      let errMsg = 'An unexpected error occurred.';
      try {
        const errData = await res.json();
        // MIN-04: Robust FastAPI 422 validation error parsing
        if (Array.isArray(errData.detail)) {
          errMsg = errData.detail.map(e => e.msg || `${e.loc?.slice(1).join('.')}: ${e.msg}`).join(', ');
        } else if (typeof errData.detail === 'string') {
          errMsg = errData.detail;
        } else if (errData.message) {
          errMsg = errData.message;
        }
      } catch {}
      const err = new Error(errMsg);
      err.status = res.status;
      throw err;
    }
    return await res.json();
  } catch (err) {
    console.warn(`[GlamGo API] ${endpoint} failed:`, err.message);
    throw err;
  }
}

// Authentication
export async function apiLogin(email, password) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  tokenStorage.set(data.access_token);
  tokenStorage.setRefresh(data.refresh_token);
  return data;
}

export async function apiRegister(name, email, password, phone, role = 'customer') {
  const data = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, phone, role }),
  });
  tokenStorage.set(data.access_token);
  tokenStorage.setRefresh(data.refresh_token);
  return data;
}

export async function apiGetMe() {
  return await apiRequest('/auth/me');
}

export async function apiRequestPasswordReset(email) {
  return await apiRequest('/auth/password-reset/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function apiConfirmPasswordReset(email, code, newPassword) {
  return await apiRequest('/auth/password-reset/confirm', {
    method: 'POST',
    body: JSON.stringify({ email, code, new_password: newPassword }),
  });
}

export async function apiRequestMobileOtp(phone) {
  return await apiRequest('/auth/otp/request', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export async function apiVerifyMobileOtp(phone, otp) {
  const data = await apiRequest('/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ phone, otp }),
  });
  tokenStorage.set(data.access_token);
  tokenStorage.setRefresh(data.refresh_token);
  return data;
}

// Catalog
export async function apiGetServices(category = null, query = null, city = null) {
  const params = new URLSearchParams();
  if (category && category !== 'All') params.append('category', category);
  if (query) params.append('query', query);
  if (city) params.append('city', city);
  const qStr = params.toString() ? `?${params.toString()}` : '';
  return await apiRequest(`/catalog/services${qStr}`);
}

export async function apiGetProfessionals(city = null, specialty = null) {
  const params = new URLSearchParams();
  if (city) params.append('city', city);
  if (specialty) params.append('specialty', specialty);
  const qStr = params.toString() ? `?${params.toString()}` : '';
  return await apiRequest(`/catalog/professionals${qStr}`);
}

export async function apiGetCatalogSalons(options = {}) {
  const {
    category = null,
    sort = 'featured',
    query = null,
    city = null,
    lat = null,
    lng = null,
    max_distance_km = null,
  } = options || {};
  const params = new URLSearchParams();
  if (category && category !== 'All') params.append('category', category);
  if (sort) params.append('sort', sort);
  if (query) params.append('query', query);
  if (city) params.append('city', city);
  if (lat !== null && lat !== undefined && Number.isFinite(Number(lat))) params.append('lat', String(lat));
  if (lng !== null && lng !== undefined && Number.isFinite(Number(lng))) params.append('lng', String(lng));
  if (max_distance_km !== null && max_distance_km !== undefined && Number.isFinite(Number(max_distance_km))) {
    params.append('max_distance_km', String(max_distance_km));
  }
  const qStr = params.toString() ? `?${params.toString()}` : '';
  return await apiRequest(`/catalog/salons${qStr}`);
}

export async function apiGetSalons(category = null, sort = 'featured', query = null, geo = null) {
  const params = new URLSearchParams();
  if (category && category !== 'All') params.append('category', category);
  if (sort) params.append('sort', sort);
  if (query) params.append('query', query);
  if (geo && typeof geo === 'object') {
    if (geo.city) params.append('city', geo.city);
    if (geo.lat !== null && geo.lat !== undefined && Number.isFinite(Number(geo.lat))) params.append('lat', String(geo.lat));
    if (geo.lng !== null && geo.lng !== undefined && Number.isFinite(Number(geo.lng))) params.append('lng', String(geo.lng));
    if (geo.max_distance_km !== null && geo.max_distance_km !== undefined && Number.isFinite(Number(geo.max_distance_km))) {
      params.append('max_distance_km', String(geo.max_distance_km));
    }
  }
  const qStr = params.toString() ? `?${params.toString()}` : '';
  return await apiRequest(`/salons/${qStr}`);
}

export async function apiGetProducts(category = null, sort = 'featured', query = null) {
  const params = new URLSearchParams();
  if (category && category !== 'All') params.append('category', category);
  if (sort) params.append('sort', sort);
  if (query) params.append('query', query);
  const qStr = params.toString() ? `?${params.toString()}` : '';
  return await apiRequest(`/products/${qStr}`);
}

// User Profile & Addresses
export async function apiUpdateProfile(payload) {
  return await apiRequest('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function apiGetAddresses() {
  return await apiRequest('/users/addresses');
}

export async function apiAddAddress(payload) {
  return await apiRequest('/users/addresses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteAddress(addressId) {
  return await apiRequest(`/users/addresses/${addressId}`, {
    method: 'DELETE',
  });
}

export async function apiGetNotifications() {
  return await apiRequest('/users/notifications');
}

// Bookings
export async function apiCreateBooking(payload) {
  return await apiRequest('/bookings/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiGetMyBookings() {
  return await apiRequest('/bookings/my');
}

export async function apiUpdateBookingStatus(bookingId, status) {
  return await apiRequest(`/bookings/${bookingId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function apiRescheduleBooking(bookingId, date, time) {
  return await apiRequest(`/bookings/${encodeURIComponent(bookingId)}/reschedule`, {
    method: 'PUT',
    body: JSON.stringify({ date, time }),
  });
}

export async function apiVerifyBookingArrivalOtp(bookingId, otp) {
  return await apiRequest(`/bookings/${encodeURIComponent(bookingId)}/verify-arrival-otp`, {
    method: 'POST',
    body: JSON.stringify({ otp }),
  });
}

// Orders & Checkout
export async function apiValidateCoupon(code, subtotal) {
  return await apiRequest('/orders/coupon/validate', {
    method: 'POST',
    body: JSON.stringify({ code, subtotal }),
  });
}

export async function apiCreateOrder(payload) {
  return await apiRequest('/orders/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiGetMyOrders() {
  return await apiRequest('/orders/my');
}

// Partners
export async function apiGetPartnerOverview(role) {
  return await apiRequest(`/partners/overview?role=${encodeURIComponent(role)}`);
}

export async function apiGetPartnerDrafts(role) {
  return await apiRequest(`/partners/drafts?role=${encodeURIComponent(role)}`);
}

export async function apiCreatePartnerDraft(payload) {
  return await apiRequest('/partners/drafts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiGetAvailability() {
  return await apiRequest('/partners/availability');
}

export async function apiToggleAvailability(day) {
  return await apiRequest(`/partners/availability/toggle?day=${encodeURIComponent(day)}`, {
    method: 'POST',
  });
}

export async function apiApplyForPartner(payload) {
  return await apiRequest('/partners/apply', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiGetProfessionalProfile() {
  return await apiRequest('/partners/professional/profile');
}

export async function apiUpdateProfessionalProfile(payload) {
  return await apiRequest('/partners/professional/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function apiGetProfessionalServices() {
  return await apiRequest('/partners/professional/services');
}

export async function apiAssignProfessionalService(serviceId) {
  return await apiRequest('/partners/professional/services', {
    method: 'POST',
    body: JSON.stringify({ service_id: serviceId }),
  });
}

export async function apiUnlinkProfessionalService(serviceId) {
  return await apiRequest(`/partners/professional/services/${encodeURIComponent(serviceId)}`, {
    method: 'DELETE',
  });
}

export async function apiGetProfessionalBookings() {
  return await apiRequest('/partners/professional/bookings');
}

export async function apiUpdateProfessionalBookingStatus(bookingId, status) {
  return await apiRequest(`/partners/professional/bookings/${encodeURIComponent(bookingId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function apiGetSalonProfile() {
  return await apiRequest('/partners/salon/profile');
}

export async function apiUpdateSalonProfile(payload) {
  return await apiRequest('/partners/salon/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function apiGetSalonStaff() {
  return await apiRequest('/partners/salon/staff');
}

export async function apiAddSalonStaff(payload) {
  return await apiRequest('/partners/salon/staff', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteSalonStaff(staffId) {
  return await apiRequest(`/partners/salon/staff/${encodeURIComponent(staffId)}`, {
    method: 'DELETE',
  });
}

export async function apiGetSalonBookings() {
  return await apiRequest('/partners/salon/bookings');
}

export async function apiUpdateSalonBookingStatus(bookingId, status) {
  return await apiRequest(`/partners/salon/bookings/${encodeURIComponent(bookingId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function apiGetSellerProducts() {
  return await apiRequest('/partners/seller/products');
}

export async function apiCreateSellerProduct(payload) {
  return await apiRequest('/partners/seller/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateSellerProduct(productId, payload) {
  return await apiRequest(`/partners/seller/products/${encodeURIComponent(productId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateSellerStock(productId, stock) {
  return await apiRequest(`/partners/seller/products/${encodeURIComponent(productId)}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ stock: Number(stock) }),
  });
}

export async function apiAddSellerVariant(productId, payload) {
  return await apiRequest(`/partners/seller/products/${encodeURIComponent(productId)}/variants`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiGetSellerOrders() {
  return await apiRequest('/partners/seller/orders');
}

export async function apiUpdateSellerOrderStatus(orderId, status) {
  return await apiRequest(`/partners/seller/orders/${encodeURIComponent(orderId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function apiGetPartnerFinancials(startDate = null, endDate = null) {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  const q = params.toString() ? `?${params.toString()}` : '';
  return await apiRequest(`/partners/financials${q}`);
}

// Admin
export async function apiGetAdminStats() {
  return await apiRequest('/admin/stats');
}

export async function apiGetAdminUsers(role = null, search = null) {
  const params = new URLSearchParams();
  if (role) params.append('role', role);
  if (search) params.append('search', search);
  const q = params.toString() ? `?${params.toString()}` : '';
  return await apiRequest(`/admin/users${q}`);
}

export async function apiToggleUserStatus(userId) {
  return await apiRequest(`/admin/users/${userId}/toggle-status`, {
    method: 'PATCH',
  });
}

export async function apiUpdateUserRole(userId, role) {
  return await apiRequest(`/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function apiGetAdminDrafts(status = null) {
  const q = status ? `?status=${encodeURIComponent(status)}` : '';
  return await apiRequest(`/admin/partners/drafts${q}`);
}

export async function apiApprovePartnerDraft(draftId) {
  return await apiRequest(`/admin/partners/drafts/${draftId}/approve`, {
    method: 'PATCH',
  });
}

export async function apiRejectPartnerDraft(draftId, rejectionReason) {
  return await apiRequest(`/admin/partners/drafts/${draftId}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ rejection_reason: rejectionReason }),
  });
}

export async function apiGetAuditLogs(action = null, limit = 50, offset = 0) {
  const params = new URLSearchParams();
  if (action) params.append('action', action);
  params.append('limit', limit);
  params.append('offset', offset);
  return await apiRequest(`/admin/audit-logs?${params.toString()}`);
}

export async function apiGetAdminBookings() {
  return await apiRequest('/admin/bookings');
}

export async function apiGetAdminOrders() {
  return await apiRequest('/admin/orders');
}

// Payments
export async function apiCreatePaymentOrder(amount, orderId = null, bookingId = null, idempotencyKey = null) {
  return await apiRequest('/payments/razorpay/create-order', {
    method: 'POST',
    body: JSON.stringify({
      amount,
      order_id: orderId,
      booking_id: bookingId,
      idempotency_key: idempotencyKey || undefined,
    }),
  });
}

export async function apiVerifyPayment(payload) {
  return await apiRequest('/payments/razorpay/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Reviews
export async function apiCreateReview(itemId, itemType, rating, comment) {
  return await apiRequest('/reviews', {
    method: 'POST',
    body: JSON.stringify({ item_id: itemId, item_type: itemType, rating, comment }),
  });
}

export async function apiGetReviews(itemId = null, itemType = null) {
  const params = new URLSearchParams();
  if (itemId) params.append('item_id', itemId);
  if (itemType) params.append('item_type', itemType);
  const q = params.toString() ? `?${params.toString()}` : '';
  return await apiRequest(`/reviews${q}`);
}

export async function apiGetMyReviews() {
  return await apiRequest('/reviews/my');
}

// ===========================================================================
// Phase 5: Multi-Vendor Commerce & Fulfillment Engine Client APIs
// ===========================================================================

export async function apiGetProductOffers(productId) {
  return await apiRequest(`/catalog/products/${productId}/offers`);
}

export async function apiReserveInventory(items) {
  return await apiRequest('/orders/reserve', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export async function apiMultiVendorCheckout(payload) {
  return await apiRequest('/orders/checkout', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiGetSellerListings() {
  return await apiRequest('/partners/seller/listings');
}

export async function apiCreateSellerListing(payload) {
  return await apiRequest('/partners/seller/listings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateSellerListing(listingId, payload) {
  return await apiRequest(`/partners/seller/listings/${listingId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function apiGetSellerSuborders(status = null) {
  const q = status ? `?status=${encodeURIComponent(status)}` : '';
  return await apiRequest(`/partners/seller/suborders${q}`);
}

export async function apiGetSellerSuborderDetail(suborderId) {
  return await apiRequest(`/partners/seller/suborders/${suborderId}`);
}

export async function apiPackSellerSuborder(suborderId) {
  return await apiRequest(`/partners/seller/suborders/${suborderId}/pack`, {
    method: 'POST',
  });
}

export async function apiShipSellerSuborder(suborderId, carrierName, trackingNumber, trackingUrl = null, notes = null) {
  return await apiRequest(`/partners/seller/suborders/${suborderId}/ship`, {
    method: 'POST',
    body: JSON.stringify({
      carrier_name: carrierName,
      tracking_number: trackingNumber,
      tracking_url: trackingUrl,
      notes,
    }),
  });
}

export async function apiDeliverSellerSuborder(suborderId) {
  return await apiRequest(`/partners/seller/suborders/${suborderId}/deliver`, {
    method: 'POST',
  });
}

export async function apiSubmitReturnRequest(suborderId, orderItemId, reason, detailedExplanation = '', evidenceImageUrl = '', qty = null) {
  const body = {
    order_item_id: orderItemId,
    reason,
    detailed_explanation: detailedExplanation,
    evidence_image_url: evidenceImageUrl,
  };
  if (qty !== null && qty !== undefined && Number(qty) > 0) {
    body.qty = Number(qty);
  }
  return await apiRequest(`/orders/suborders/${suborderId}/return`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiGetSellerReturns() {
  return await apiRequest('/partners/seller/returns');
}

export async function apiDecideSellerReturn(returnId, action, restockInventory = true, rejectionReason = '') {
  return await apiRequest(`/partners/seller/returns/${returnId}/decide`, {
    method: 'POST',
    body: JSON.stringify({
      action,
      restock_inventory: restockInventory,
      rejection_reason: rejectionReason,
    }),
  });
}

export async function apiGetSellerMultiVendorFinancials() {
  return await apiRequest('/partners/seller/financials');
}
