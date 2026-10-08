import type { Product, Vendor, Order, DashboardStats, Review, User } from '../types';

const API_BASE = '/api';

let cachedCsrfToken: string | null = null;

/**
 * Retrieves and caches CSRF token from backend
 */
export async function getCsrfToken(): Promise<string> {
  if (cachedCsrfToken) return cachedCsrfToken;
  try {
    const res = await fetch(`${API_BASE}/csrf-token`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      cachedCsrfToken = data.csrfToken;
      return cachedCsrfToken || '';
    }
  } catch (err) {
    console.warn('Failed to fetch CSRF token:', err);
  }
  return '';
}

/**
 * Secure fetch wrapper with credentials and anti-CSRF headers for state-changing requests
 */
async function secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  // State-changing requests require CSRF token
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
    const token = await getCsrfToken();
    if (token) {
      headers.set('X-CSRF-Token', token);
    }
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Ensures httpOnly session cookies are transmitted
  });
}

export async function fetchProducts(
  category?: string,
  search?: string,
  sort?: string,
  vendorId?: number
): Promise<Product[]> {
  const params = new URLSearchParams();
  if (category && category !== 'all') params.append('category', category);
  if (search && search.trim() !== '') params.append('search', search.trim());
  if (sort && sort !== 'featured') params.append('sort', sort);
  if (vendorId) params.append('vendor_id', vendorId.toString());

  const res = await secureFetch(`${API_BASE}/products?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch products');
  const data = await res.json();
  return data.products || [];
}

export async function fetchProductById(id: number): Promise<Product> {
  const res = await secureFetch(`${API_BASE}/products/${id}`);
  if (!res.ok) throw new Error('Failed to fetch product details');
  const data = await res.json();
  return data.product;
}

export async function createProduct(productData: Partial<Product>): Promise<{ id: number; message: string }> {
  const res = await secureFetch(`${API_BASE}/products`, {
    method: 'POST',
    body: JSON.stringify(productData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to create product');
  }
  return res.json();
}

export async function deleteProduct(id: number): Promise<void> {
  const res = await secureFetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete product');
  }
}

export async function fetchVendors(): Promise<Vendor[]> {
  const res = await secureFetch(`${API_BASE}/vendors`);
  if (!res.ok) throw new Error('Failed to fetch vendors');
  const data = await res.json();
  return data.vendors || [];
}

export async function fetchVendorById(id: number): Promise<{ vendor: Vendor; products: Product[] }> {
  const res = await secureFetch(`${API_BASE}/vendors/${id}`);
  if (!res.ok) throw new Error('Failed to fetch vendor profile');
  const data = await res.json();
  return { vendor: data.vendor, products: data.products || [] };
}

export async function fetchProductReviews(productId: number): Promise<Review[]> {
  const res = await secureFetch(`${API_BASE}/products/${productId}/reviews`);
  if (!res.ok) throw new Error('Failed to fetch reviews');
  const data = await res.json();
  return data.reviews || [];
}

export async function createReview(reviewPayload: {
  product_id: number;
  customer_name: string;
  rating: number;
  comment: string;
}): Promise<void> {
  const res = await secureFetch(`${API_BASE}/reviews`, {
    method: 'POST',
    body: JSON.stringify(reviewPayload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to submit review');
  }
}

export async function createOrder(orderPayload: {
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  payment_method: string;
  total_amount: number;
  items: Array<{ id: number; name: string; price: number; quantity: number; image_url?: string }>;
}): Promise<{ order: Order; message: string }> {
  const res = await secureFetch(`${API_BASE}/orders`, {
    method: 'POST',
    body: JSON.stringify(orderPayload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to create order');
  }
  return res.json();
}

export async function fetchOrders(): Promise<Order[]> {
  const res = await secureFetch(`${API_BASE}/orders`);
  if (!res.ok) throw new Error('Failed to fetch orders');
  const data = await res.json();
  return data.orders || [];
}

export async function updateOrderStatus(orderId: number, status: string): Promise<void> {
  const res = await secureFetch(`${API_BASE}/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update order status');
  }
}

export async function fetchStats(): Promise<DashboardStats> {
  const res = await secureFetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  const data = await res.json();
  return data.stats;
}

export async function loginUser(credentials: {
  email: string;
  password: string;
  mfaCode?: string;
}): Promise<{ user?: User; mfaRequired?: boolean; message: string }> {
  const res = await secureFetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Login failed');
  }
  if (data.csrfToken) {
    cachedCsrfToken = data.csrfToken;
  }
  return data;
}

export async function registerUser(payload: {
  name: string;
  email: string;
  password: string;
  role?: string;
  phone?: string;
  address?: string;
}): Promise<{ user: User; message: string }> {
  const res = await secureFetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Registration failed');
  }
  if (data.csrfToken) {
    cachedCsrfToken = data.csrfToken;
  }
  return data;
}

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const res = await secureFetch(`${API_BASE}/auth/me`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  await secureFetch(`${API_BASE}/auth/logout`, { method: 'POST' });
  cachedCsrfToken = null;
}

export async function fetchDemoUsers(): Promise<User[]> {
  const res = await secureFetch(`${API_BASE}/auth/demo-users`);
  if (!res.ok) throw new Error('Failed to fetch demo accounts');
  const data = await res.json();
  return data.users || [];
}

export async function fetchUserOrders(userId: number): Promise<Order[]> {
  const res = await secureFetch(`${API_BASE}/users/${userId}/orders`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch user orders');
  }
  const data = await res.json();
  return data.orders || [];
}

export async function setupMfa(): Promise<{ secret: string; sampleVerificationCode: string }> {
  const res = await secureFetch(`${API_BASE}/auth/mfa/setup`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to setup MFA');
  return res.json();
}

export async function verifyMfa(code: string, secret: string): Promise<void> {
  const res = await secureFetch(`${API_BASE}/auth/mfa/verify`, {
    method: 'POST',
    body: JSON.stringify({ code, secret }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'MFA verification failed');
  }
}
