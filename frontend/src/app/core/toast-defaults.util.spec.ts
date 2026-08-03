import { describe, expect, it } from 'vitest';
import { defaultToastLife } from './toast-defaults.util';

describe('toast-defaults.util', () => {
  it('assigns auto-dismiss life by severity (homolog F10)', () => {
    expect(defaultToastLife('error')).toBe(8000);
    expect(defaultToastLife('warn')).toBe(5000);
    expect(defaultToastLife('success')).toBe(4000);
    expect(defaultToastLife('info')).toBe(4000);
  });
});
