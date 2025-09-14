import { toNumber } from './general';

describe('toNumber', () => {
  it('parses valid inputs', () => {
    expect(toNumber(10)).toBe(10);
    expect(toNumber('42')).toBe(42);
    expect(toNumber('  5  ')).toBe(5);
  });
  it('rejects invalid inputs', () => {
    expect(toNumber('')).toBeNull();
    expect(toNumber('abc')).toBeNull();
    expect(toNumber(NaN)).toBeNull();
    expect(toNumber(undefined)).toBeNull();
  });
});
