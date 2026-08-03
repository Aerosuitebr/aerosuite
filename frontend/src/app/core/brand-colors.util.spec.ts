import { describe, expect, it } from 'vitest';
import { applyBrandPalette, brandPalette, darkenHex, normalizeHex } from './brand-colors.util';

describe('brand-colors.util', () => {
  it('normalizeHex defaults invalid input', () => {
    expect(normalizeHex(null)).toBe('#0ea5e9');
    expect(normalizeHex('')).toBe('#0ea5e9');
    expect(normalizeHex('not-a-color')).toBe('#0ea5e9');
  });

  it('normalizeHex accepts with or without hash', () => {
    expect(normalizeHex('#FF5500')).toBe('#ff5500');
    expect(normalizeHex('ff5500')).toBe('#ff5500');
  });

  it('darkenHex darkens #RRGGBB', () => {
    expect(darkenHex('#ffffff', 0.5)).toBe('#808080');
    expect(darkenHex('#000000', 0.5)).toBe('#000000');
  });

  it('brandPalette derives deep color', () => {
    const p = brandPalette('#ff0000');
    expect(p.primary).toBe('#ff0000');
    expect(p.primaryDeep).not.toBe('#ff0000');
  });

  it('applyBrandPalette replaces default Aero colors', () => {
    const html = '<span style="color:#0ea5e9">x</span>';
    const out = applyBrandPalette(html, '#ff0000', '#cc0000');
    expect(out).toContain('#ff0000');
    expect(out).not.toContain('#0ea5e9');
  });

  it('applyBrandPalette is no-op when palette is default', () => {
    const html = '<span style="color:#0ea5e9">x</span>';
    expect(applyBrandPalette(html, '#0ea5e9')).toBe(html);
  });
});
