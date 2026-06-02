export function formatMoney(value) {
  const sign = value < 0 ? '-' : value > 0 ? '+' : '';
  return `${sign} ¥ ${Math.abs(value).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPlainMoney(value) {
  return formatMoney(value).replace('+ ', '');
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);
  const ds = dateStr.slice(0, 10);

  if (ds === today) return '今天';
  if (ds === yesterday) return '昨天';
  return `${d.getMonth() + 1}-${String(d.getDate()).padStart(2, '0')}`;
}
