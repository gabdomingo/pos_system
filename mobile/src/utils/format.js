function withCommas(intPart) {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function fallbackFormat(value, options = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';

  const min = Math.max(0, Number(options.minimumFractionDigits) || 0);
  const maxFromOpt = Number(options.maximumFractionDigits);
  const max = Number.isFinite(maxFromOpt) ? Math.max(min, maxFromOpt) : min;

  const sign = n < 0 ? '-' : '';
  const rounded = Math.abs(n).toFixed(max);
  const [intRaw, decRaw = ''] = rounded.split('.');
  let decimals = decRaw;

  if (max > min) {
    decimals = decimals.replace(/0+$/, '');
    if (decimals.length < min) decimals = decimals.padEnd(min, '0');
  }

  const intPart = withCommas(intRaw);
  return decimals ? `${sign}${intPart}.${decimals}` : `${sign}${intPart}`;
}

export function formatNumber(value, options = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';

  try {
    return new Intl.NumberFormat('en-PH', options).format(n);
  } catch (e) {
    return fallbackFormat(n, options);
  }
}

export function formatCurrency(value, fractionDigits = 2) {
  const digits = Math.max(0, Number(fractionDigits) || 0);
  return `₱${formatNumber(value, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  })}`;
}

