import { describe, expect, it } from 'vitest';
import { formatarDocumentoIdentificacao, normalizarDocumentoParaPersistencia, isCnpjValido, isCpfValido } from './documento-identificacao.util';
describe('documentos de propostas', () => {
  it('formata CPF e CNPJ preservando zeros', () => {
    expect(formatarDocumentoIdentificacao('52998224725')).toBe('529.982.247-25');
    expect(formatarDocumentoIdentificacao('11222333000181')).toBe('11.222.333/0001-81');
    expect(isCpfValido('00000000000')).toBe(false);
    expect(isCnpjValido('11222333000181')).toBe(true);
  });
  it('rejeita documentos combinados e dígitos verificadores inválidos', () => {
    expect(() => normalizarDocumentoParaPersistencia('529.982.247-25; 11.222.333/0001-81')).toThrow();
    expect(() => normalizarDocumentoParaPersistencia('52998224726')).toThrow();
  });
});
