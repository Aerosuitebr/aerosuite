import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const PASSWORD_POLICY_MIN_LENGTH = 8;
export const PASSWORD_POLICY_MAX_DIGIT_SEQUENCE = 3;

export type PasswordStrengthLevel = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordPolicyChecks {
  minLength: boolean;
  uppercase: boolean;
  lowercase: boolean;
  digit: boolean;
  special: boolean;
  noLongSequence: boolean;
}

export interface PasswordStrength {
  level: PasswordStrengthLevel;
  percent: number;
  labelKey: string;
}

export interface PasswordPolicyEvaluation {
  valid: boolean;
  checks: PasswordPolicyChecks;
  metCount: number;
  strength: PasswordStrength;
}

export interface PasswordPolicyRule {
  key: string;
  met: boolean;
}

const STRENGTH_LABELS: Record<PasswordStrengthLevel, string> = {
  empty: 'auth.password.policy.strength.empty',
  weak: 'auth.password.policy.strength.weak',
  fair: 'auth.password.policy.strength.fair',
  good: 'auth.password.policy.strength.good',
  strong: 'auth.password.policy.strength.strong',
};

export function hasUppercase(password: string): boolean {
  return /[A-Z]/.test(password);
}

export function hasLowercase(password: string): boolean {
  return /[a-z]/.test(password);
}

export function hasDigit(password: string): boolean {
  return /\d/.test(password);
}

export function hasSpecial(password: string): boolean {
  return /[^A-Za-z0-9]/.test(password);
}

export function hasLongDigitSequence(
  password: string,
  maxRun = PASSWORD_POLICY_MAX_DIGIT_SEQUENCE
): boolean {
  let ascending = 1;
  let descending = 1;
  let prevDigit: number | null = null;

  for (const ch of password) {
    if (ch < '0' || ch > '9') {
      ascending = 1;
      descending = 1;
      prevDigit = null;
      continue;
    }
    const d = ch.charCodeAt(0) - 48;
    if (prevDigit !== null) {
      if (d === prevDigit + 1) {
        ascending += 1;
        descending = 1;
      } else if (d === prevDigit - 1) {
        descending += 1;
        ascending = 1;
      } else {
        ascending = 1;
        descending = 1;
      }
      if (ascending > maxRun || descending > maxRun) {
        return true;
      }
    }
    prevDigit = d;
  }
  return false;
}

export function evaluatePasswordPolicy(password: string): PasswordPolicyEvaluation {
  const value = password ?? '';
  const checks: PasswordPolicyChecks = {
    minLength: value.length >= PASSWORD_POLICY_MIN_LENGTH,
    uppercase: hasUppercase(value),
    lowercase: hasLowercase(value),
    digit: hasDigit(value),
    special: hasSpecial(value),
    noLongSequence: value.length === 0 || !hasLongDigitSequence(value),
  };

  const criteria = [
    checks.minLength,
    checks.uppercase,
    checks.lowercase,
    checks.digit,
    checks.special,
    checks.noLongSequence,
  ];
  const metCount = criteria.filter(Boolean).length;
  const valid = metCount === criteria.length && value.length > 0;

  let level: PasswordStrengthLevel = 'empty';
  if (value.length > 0) {
    // Uma senha abaixo do tamanho mínimo ainda é fraca, mesmo quando já
    // combina maiúsculas e minúsculas. Evita superestimar entradas curtas.
    if (!checks.minLength || metCount <= 2) {
      level = 'weak';
    } else if (metCount <= 4) {
      level = 'fair';
    } else if (metCount === 5) {
      level = 'good';
    } else {
      level = 'strong';
    }
  }

  const percent = value.length === 0 ? 0 : Math.round((metCount / criteria.length) * 100);

  return {
    valid,
    checks,
    metCount,
    strength: {
      level,
      percent,
      labelKey: STRENGTH_LABELS[level],
    },
  };
}

export function isPasswordPolicyValid(password: string): boolean {
  return evaluatePasswordPolicy(password).valid;
}

export function buildPasswordPolicyRules(evaluation: PasswordPolicyEvaluation): PasswordPolicyRule[] {
  return [
    { key: 'auth.password.policy.minLength', met: evaluation.checks.minLength },
    { key: 'auth.password.policy.uppercase', met: evaluation.checks.uppercase },
    { key: 'auth.password.policy.lowercase', met: evaluation.checks.lowercase },
    { key: 'auth.password.policy.digit', met: evaluation.checks.digit },
    { key: 'auth.password.policy.special', met: evaluation.checks.special },
    { key: 'auth.password.policy.noSequence', met: evaluation.checks.noLongSequence },
  ];
}

export function passwordPolicyValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value ?? '';
    if (!value) {
      return null;
    }
    return isPasswordPolicyValid(value) ? null : { passwordPolicy: true };
  };
}
