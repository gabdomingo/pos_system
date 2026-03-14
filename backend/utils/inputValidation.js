const LOGIN_EMAIL_REGEX = /^\S+@\S+$/i;
const STANDARD_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const VALID_ROLES = new Set(['admin', 'cashier', 'customer']);

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export function isValidLoginEmail(value) {
  return LOGIN_EMAIL_REGEX.test(normalizeEmail(value));
}

export function isValidStandardEmail(value) {
  return STANDARD_EMAIL_REGEX.test(normalizeEmail(value));
}

export function normalizePhilippinePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('63') && digits.length === 12) return `0${digits.slice(2)}`;
  if (digits.startsWith('9') && digits.length === 10) return `0${digits}`;
  return digits;
}

export function isValidPhilippinePhone(value) {
  return /^09\d{9}$/.test(normalizePhilippinePhone(value));
}

export function normalizeRole(value) {
  const role = String(value || '').trim().toLowerCase();
  return VALID_ROLES.has(role) ? role : null;
}
