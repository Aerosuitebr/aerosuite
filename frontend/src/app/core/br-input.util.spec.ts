import { describe, expect, it } from 'vitest';
import {
  digitsOnly,
  formatBrTitleCase,
  formatCep,
  formatCnpj,
  formatPhoneBr,
  displayPhoneBr,
  phoneTelHref,
  isValidCepLength,
  isValidCnpjChecksum,
  isValidCnpjLength,
  isValidPhoneBr,
  isValidProductPn,
  isDuplicateProductPn,
  sanitizeAddressField,
} from './br-input.util';

describe('br-input.util', () => {
  it('formats CEP', () => {
    expect(formatCep('01310100')).toBe('01310-100');
    expect(formatCep('01310-100')).toBe('01310-100');
  });

  it('formats CNPJ', () => {
    expect(formatCnpj('11222333000181')).toBe('11.222.333/0001-81');
  });

  it('formats Brazilian phone', () => {
    expect(formatPhoneBr('11987654321')).toBe('(11) 98765-4321');
    expect(formatPhoneBr('1134567890')).toBe('(11) 3456-7890');
    expect(formatPhoneBr('21990403514')).toBe('(21) 99040-3514');
    expect(formatPhoneBr('+5511987654321')).toBe('+5511987654321');
    expect(displayPhoneBr('21990403514')).toBe('(21) 99040-3514');
    expect(phoneTelHref('(21) 99040-3514')).toBe('tel:21990403514');
  });

  it('validates lengths', () => {
    expect(isValidCepLength('01310-100')).toBe(true);
    expect(isValidCnpjLength('11.222.333/0001-81')).toBe(true);
    expect(isValidPhoneBr('(11) 98765-4321')).toBe(true);
    expect(isValidPhoneBr('123')).toBe(false);
  });

  it('validates CNPJ checksum', () => {
    expect(isValidCnpjChecksum('11.222.333/0001-81')).toBe(true);
    expect(isValidCnpjChecksum('11.222.333/0001-82')).toBe(false);
  });

  it('strips non-digits', () => {
    expect(digitsOnly('(11) 98765-4321')).toBe('11987654321');
  });

  it('rejects phone with letters (homolog F08)', () => {
    expect(isValidPhoneBr('rarara')).toBe(false);
    expect(formatPhoneBr('rarara')).toBe('');
  });

  it('sanitizes CEP bairro residual separators (homolog C03)', () => {
    expect(sanitizeAddressField('Centro ·')).toBe('Centro');
    expect(sanitizeAddressField(' ·Bairro')).toBe('Bairro');
  });

  it('title-cases accented Portuguese addresses (homolog C02)', () => {
    expect(formatBrTitleCase('rua dr. araújo')).toBe('Rua Dr. Araújo');
  });

  it('validates product PN without spaces (homolog P11)', () => {
    expect(isValidProductPn('BELL-001')).toBe(true);
    expect(isValidProductPn('teste teste teste')).toBe(false);
    expect(isValidProductPn('PN-12345')).toBe(true);
  });

  it('detects duplicate product PN (homolog P11)', () => {
    const catalog = [
      { id: 1, productpn: 'BELL-001' },
      { id: 2, productpn: 'PN-12345' },
    ];
    expect(isDuplicateProductPn('bell-001', catalog)).toBe(true);
    expect(isDuplicateProductPn('PN-12345', catalog, 2)).toBe(false);
    expect(isDuplicateProductPn('NEW-99', catalog)).toBe(false);
  });
});
