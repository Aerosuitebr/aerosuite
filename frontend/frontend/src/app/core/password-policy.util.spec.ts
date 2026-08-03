import { describe, expect, it } from 'vitest';
import {
  evaluatePasswordPolicy,
  hasLongDigitSequence,
  isPasswordPolicyValid,
} from './password-policy.util';

describe('password-policy.util', () => {
  it('accepts a compliant password', () => {
    expect(isPasswordPolicyValid('Aero@2026')).toBe(true);
  });

  it('rejects short passwords', () => {
    expect(isPasswordPolicyValid('Ab1!')).toBe(false);
  });

  it('rejects long ascending digit sequences', () => {
    expect(hasLongDigitSequence('Aero@1234')).toBe(true);
    expect(isPasswordPolicyValid('Aero@1234')).toBe(false);
  });

  it('allows interrupted digit sequences', () => {
    expect(isPasswordPolicyValid('Pass1!234')).toBe(true);
  });

  it('rejects long descending digit sequences', () => {
    expect(hasLongDigitSequence('Aero@9876')).toBe(true);
  });

  it('allows sequences of three digits', () => {
    expect(isPasswordPolicyValid('Aero@123')).toBe(true);
  });

  it('computes progressive strength', () => {
    const empty = evaluatePasswordPolicy('');
    expect(empty.strength.level).toBe('empty');
    expect(empty.strength.percent).toBe(0);

    const partial = evaluatePasswordPolicy('Aero');
    expect(partial.strength.level).toBe('weak');

    const strong = evaluatePasswordPolicy('Aero@2026');
    expect(strong.strength.level).toBe('strong');
    expect(strong.valid).toBe(true);
  });
});
