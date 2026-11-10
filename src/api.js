const API_BASE = window.GLAMGO_API_URL || '/api/v1';

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
      throw new Error(errMsg);
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

// Catalog
export async function apiGetServices(category = null, query = null) {
  const params = new URLSearchParams();
  if (category && category !== 'All') params.append('category', category);
  if (query) params.append('query', query);
  const qStr = params.toString() ? `?${params.toString()}` : '';
  return await apiRequest(`/services/${qStr}`);
}

export async function apiGetProfessionals() {
  return await apiRequest('/professionals/');
}

export async function apiGetSalons(category = null, sort = 'featured', query = null) {
  const params = new URLSearchParams();
  if (category && category !== 'All') params.append('category', category);
  if (sort) params.append('sort', sort);
  if (query) params.append('query', query);
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

// Admin
export async function apiGetAdminStats() {
  return await apiRequest('/admin/stats');
}

export async function apiGetAdminUsers(role = null) {
  const q = role ? `?role=${encodeURIComponent(role)}` : '';
  return await apiRequest(`/admin/users${q}`);
}

export async function apiToggleUserStatus(userId) {
  return await apiRequest(`/admin/users/${userId}/toggle-status`, {
    method: 'PATCH',
  });
}

export async function apiGetAdminBookings() {
  return await apiRequest('/admin/bookings');
}

export async function apiGetAdminOrders() {
  return await apiRequest('/admin/orders');
}

// Payments
export async function apiCreatePaymentOrder(amount, orderId = null, bookingId = null) {
  return await apiRequest('/payments/razorpay/create-order', {
    method: 'POST',
    body: JSON.stringify({ amount, order_id: orderId, booking_id: bookingId }),
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
