import { describe, it, expect } from 'vitest';
import { splitExecutionOrigin, combineExecutionOrigin } from './hangar-execution.util';

describe('Execution source metadata', () => {
  it.each(['Origem: proposta comercial PROP-20260607-0005','Source: commercial proposal PROP-5','Origen: propuesta comercial PROP-5','Origine : proposition commerciale PROP-5'])('separates and preserves %s', line => {
    const raw=line+'\n\nServiço: revisão\nObservação do mecânico'; const split=splitExecutionOrigin(raw);
    expect(split.line).toBe(line); expect(split.observations).toBe('Serviço: revisão\nObservação do mecânico');
    expect(combineExecutionOrigin(split,split.observations)).toBe(raw);
  });
  it('preserves Windows line endings on a round trip', () => {
    const raw='Origem: proposta comercial PROP-1\r\n\r\nTexto';const split=splitExecutionOrigin(raw);
    expect(combineExecutionOrigin(split,split.observations)).toBe(raw);
  });
  it('keeps source metadata when the operator clears or changes notes', () => {
    const split=splitExecutionOrigin('Origem: proposta comercial PROP-1\n\nAntes');
    expect(combineExecutionOrigin(split,'')).toBe('Origem: proposta comercial PROP-1');
    expect(combineExecutionOrigin(split,'Depois')).toBe('Origem: proposta comercial PROP-1\n\nDepois');
  });
  it('does not extract arbitrary notes that merely mention a source', () => {
    for (const raw of ['Origem: falha relatada pelo cliente','Observações\nOrigem: proposta comercial PROP-1','Texto livre']) {
      const split=splitExecutionOrigin(raw); expect(split.line).toBe(''); expect(combineExecutionOrigin(split,split.observations)).toBe(raw);
    }
  });
  it('supports source-only and empty records', () => {
    const split=splitExecutionOrigin('Origem: proposta comercial PROP-1');
    expect(split.observations).toBe(''); expect(combineExecutionOrigin(split,'Nova nota')).toBe(split.line+'\n\nNova nota');
    expect(splitExecutionOrigin(null).observations).toBe('');
  });
});
