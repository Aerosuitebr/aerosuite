import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Máscara formatada: CPF 14 chars, CNPJ 18 chars. */
export const DOCUMENTO_IDENTIFICACAO_MAX = 18;

const MULTI_DOC_RE = /\s+e\s+|\s*;\s*|\s*,\s*(?=\d)|\s+\/\s+(?=\d)|\s+e\s+cpf|\s+e\s+cnpj/i;

/** Remove pontuação; letras maiúsculas. */
export function normalizarDocumento(raw: string | null | undefined): string {
  if (!raw) return '';
  return String(raw).trim().toUpperCase().replace(/[^0-9A-Z]/g, '');
}

export function pareceMultiploDocumento(raw: string | null | undefined): boolean {
  if (!raw || !String(raw).trim()) return false;
  if (MULTI_DOC_RE.test(String(raw).trim())) return true;
  return normalizarDocumento(raw).length > 14;
}

function digitoCpf(cpf: string, len: number, pesoInicial: number): number {
  let soma = 0;
  for (let i = 0; i < len; i++) {
    soma += Number(cpf[i]) * (pesoInicial - i);
  }
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function isCpfValido(cpf11: string): boolean {
  if (!/^\d{11}$/.test(cpf11)) return false;
  if (/^(\d)\1{10}$/.test(cpf11)) return false;
  const d1 = digitoCpf(cpf11, 9, 10);
  const d2 = digitoCpf(cpf11, 10, 11);
  return Number(cpf11[9]) === d1 && Number(cpf11[10]) === d2;
}

/** Valor ASCII - 48 (manual RFB CNPJ alfanumérico). */
function calcularDvCnpj(corpo: string): number {
  let soma = 0;
  let peso = 2;
  for (let i = corpo.length - 1; i >= 0; i--) {
    const valor = corpo.charCodeAt(i) - 48;
    soma += valor * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  const resto = soma % 11;
  return resto === 0 || resto === 1 ? 0 : 11 - resto;
}

export function isCnpjValido(cnpj14: string): boolean {
  const base = (cnpj14 || '').toUpperCase();
  if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(base)) return false;
  if (/^\d{14}$/.test(base) && /^(\d)\1{13}$/.test(base)) return false;
  const dv1 = String(calcularDvCnpj(base.slice(0, 12)));
  const dv2 = String(calcularDvCnpj(base.slice(0, 12) + dv1));
  return base[12] === dv1 && base[13] === dv2;
}

export function formatarCpf(cpf11: string): string {
  return `${cpf11.slice(0, 3)}.${cpf11.slice(3, 6)}.${cpf11.slice(6, 9)}-${cpf11.slice(9, 11)}`;
}

export function formatarCnpj(cnpj14: string): string {
  const u = cnpj14.toUpperCase();
  return `${u.slice(0, 2)}.${u.slice(2, 5)}.${u.slice(5, 8)}/${u.slice(8, 12)}-${u.slice(12, 14)}`;
}

export function formatarDocumentoIdentificacao(raw: string | null | undefined): string {
  const base = normalizarDocumento(raw);
  if (!base) return '';
  if (base.length <= 11 && /^\d*$/.test(base)) {
    // Máscara progressiva CPF
    const d = base.slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }
  // CNPJ (numérico ou alfanumérico) — máscara XX.XXX.XXX/XXXX-XX
  const u = base.slice(0, 14);
  if (u.length <= 2) return u;
  if (u.length <= 5) return `${u.slice(0, 2)}.${u.slice(2)}`;
  if (u.length <= 8) return `${u.slice(0, 2)}.${u.slice(2, 5)}.${u.slice(5)}`;
  if (u.length <= 12) return `${u.slice(0, 2)}.${u.slice(2, 5)}.${u.slice(5, 8)}/${u.slice(8)}`;
  return `${u.slice(0, 2)}.${u.slice(2, 5)}.${u.slice(5, 8)}/${u.slice(8, 12)}-${u.slice(12)}`;
}

/**
 * Normaliza para persistência. Lança Error se inválido.
 * Retorna null se vazio.
 */
export function normalizarDocumentoParaPersistencia(raw: string | null | undefined): string | null {
  if (raw == null || !String(raw).trim()) return null;
  const trimmed = String(raw).trim();
  if (pareceMultiploDocumento(trimmed)) {
    throw new Error('Informe apenas um documento (CPF ou CNPJ). Não combine dois documentos no mesmo campo.');
  }
  const base = normalizarDocumento(trimmed);
  if (!base) return null;
  if (base.length === 11 && /^\d{11}$/.test(base)) {
    if (!isCpfValido(base)) throw new Error('CPF inválido.');
    return formatarCpf(base);
  }
  if (base.length === 14) {
    if (!isCnpjValido(base)) throw new Error('CNPJ inválido (numérico ou alfanumérico).');
    return formatarCnpj(base);
  }
  throw new Error('Documento inválido. Use CPF (11 dígitos) ou CNPJ (14 posições, numérico ou alfanumérico).');
}

export function documentoIdentificacaoValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value == null || String(value).trim() === '') return null;
    const trimmed = String(value).trim();
    if (pareceMultiploDocumento(trimmed)) {
      return {
        documentoIdentificacao:
          'Informe apenas um documento (CPF ou CNPJ). Não combine dois documentos no mesmo campo.'
      };
    }
    const base = normalizarDocumento(trimmed);
    // Ainda digitando: não invalidar parcialmente
    if (base.length < 11) return null;
    if (base.length > 11 && base.length < 14) return null;
    try {
      normalizarDocumentoParaPersistencia(trimmed);
      return null;
    } catch (e: any) {
      return { documentoIdentificacao: e?.message || 'Documento inválido' };
    }
  };
}
