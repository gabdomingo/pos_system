const NUMBER_FORMATTERS = new Map();

function getFormatter(options = {}) {
  const key = JSON.stringify(options);
  if (!NUMBER_FORMATTERS.has(key)) {
    NUMBER_FORMATTERS.set(
      key,
      new Intl.NumberFormat('en-PH', options)
    );
  }
  return NUMBER_FORMATTERS.get(key);
}

export function formatNumber(value, options = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  return getFormatter(options).format(n);
}

export function formatCurrency(value, fractionDigits = 2) {
  const digits = Math.max(0, Number(fractionDigits) || 0);
  return `₱${formatNumber(value, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  })}`;
}

