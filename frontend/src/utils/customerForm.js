export const CHECKOUT_DEFAULTS = {
  fulfillmentType: 'delivery',
  paymentMethod: 'Card',
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  regionCode: '',
  provinceName: '',
  municipalityName: '',
  barangayName: '',
  postalCode: '',
  deliveryAddress: '',
  landmark: '',
  cardHolder: '',
  cardNumber: '',
  cardExpiry: '',
  cardCvv: '',
  gcashNumber: '',
  paymentReference: ''
};

const STANDARD_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
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

export function getProvinceOptions(addresses, regionCode) {
  return addresses.find((region) => region.code === regionCode)?.provinces || [];
}

export function getMunicipalityOptions(addresses, regionCode, provinceName) {
  return getProvinceOptions(addresses, regionCode).find((province) => province.name === provinceName)?.municipalities || [];
}

export function getBarangayOptions(addresses, regionCode, provinceName, municipalityName) {
  return getMunicipalityOptions(addresses, regionCode, provinceName).find((municipality) => municipality.name === municipalityName)?.barangays || [];
}

export function getSelectedMunicipality(addresses, regionCode, provinceName, municipalityName) {
  return getMunicipalityOptions(addresses, regionCode, provinceName).find((municipality) => municipality.name === municipalityName) || null;
}

export function composeDeliveryAddress(form, addresses) {
  const region = addresses.find((entry) => entry.code === form.regionCode);
  const municipality = getSelectedMunicipality(addresses, form.regionCode, form.provinceName, form.municipalityName);
  const parts = [
    String(form.deliveryAddress || '').trim(),
    form.landmark ? `Landmark: ${String(form.landmark).trim()}` : '',
    form.barangayName,
    municipality?.name || form.municipalityName,
    form.provinceName,
    region?.name || '',
    municipality?.postalCode || form.postalCode
  ].filter(Boolean);
  return parts.join(', ');
}
