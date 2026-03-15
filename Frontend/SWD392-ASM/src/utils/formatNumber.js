// utils/formatNumber.js
// Number formatting utilities

/**
 * Format number with locale separators
 * @param {number} num
 * @returns {string}
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return '—';
  return num.toLocaleString('vi-VN');
}

/**
 * Format number with +/- prefix (dùng cho lines added/deleted)
 * @param {number} num
 * @param {string} prefix - '+' hoặc '-'
 * @returns {string}
 */
export function formatLines(num, prefix = '+') {
  if (num === null || num === undefined) return '—';
  return `${prefix}${num.toLocaleString('vi-VN')}`;
}

/**
 * Format percentage
 * @param {number} value
 * @param {number} total
 * @returns {string}
 */
export function formatPercent(value, total) {
  if (!total || total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}
