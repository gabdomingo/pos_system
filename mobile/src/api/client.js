import { API_BASE_URL } from '../constants/config';

async function request(path, { method = 'GET', token, body, headers = {} } = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    data = text;
  }

  if (!res.ok) {
    const message = data?.error || data?.message || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    error.payload = data;
    throw error;
  }

  return data;
}

export function login(payload) {
  return request('/api/login', { method: 'POST', body: payload });
}

export function register(payload) {
  return request('/api/register', { method: 'POST', body: payload });
}

export function getProducts(query = '') {
  if (!query.trim()) return request('/products');
  return request(`/products/search?q=${encodeURIComponent(query.trim())}`);
}

export function getDashboard(token) {
  return request('/reports/dashboard', { token });
}

export function createSale(payload, token) {
  return request('/sales', { method: 'POST', body: payload, token });
}

export function getSales(token, params = {}) {
  const query = new URLSearchParams(params).toString();
  const suffix = query ? `?${query}` : '';
  return request(`/sales${suffix}`, { token });
}

export function getSaleById(token, saleId) {
  return request(`/sales/${saleId}`, { token });
}

export function addProduct(token, payload) {
  return request('/products', { method: 'POST', token, body: payload });
}

export function updateProduct(token, id, payload) {
  return request(`/products/${id}`, { method: 'PUT', token, body: payload });
}

export function deleteProduct(token, id) {
  return request(`/products/${id}`, { method: 'DELETE', token });
}
