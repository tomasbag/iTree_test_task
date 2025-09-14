export const toNumber = (n: unknown): number | null => {
  if (typeof n === 'number') return Number.isFinite(n) ? n : null;
  if (typeof n === 'string' && n.trim() !== '') {
    const v = Number(n);
    return Number.isFinite(v) ? v : null;
  }
  return null;
}
