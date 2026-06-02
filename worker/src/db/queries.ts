export const DEFAULT_CATEGORIES = [
  { name: '餐饮', icon: '餐', color: '#22a84d' },
  { name: '交通', icon: '行', color: '#2f86df' },
  { name: '日用', icon: '用', color: '#f4a62a' },
  { name: '房租', icon: '房', color: '#f5be42' },
  { name: '医疗', icon: '医', color: '#ef5f5f' },
  { name: '教育', icon: '学', color: '#8c6be8' },
  { name: '娱乐', icon: '乐', color: '#ff6f91' },
  { name: '其他', icon: '其', color: '#a0a7a0' },
];

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => chars[b % chars.length]).join('');
}
