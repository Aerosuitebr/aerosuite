import { describe, expect, it } from 'vitest';

import { slugifyMenuSection } from './menu-i18n.util';

describe('slugifyMenuSection', () => {
  it.each([
    'Ações Rápidas',
    'ACOES_RAPIDAS',
    'AAES_RIPIDAS',
    'AES_RAPIDAS',
    'AÇÕES RÁPIDAS',
    'A??es R??pidas',
  ])('normaliza %s para a chave de ações rápidas', (section) => {
    expect(slugifyMenuSection(section)).toBe('ACOES_RAPIDAS');
  });

  it.each([
    'Publicações Técnicas',
    'PUBLICACOES_TECNICAS',
    'PUBLICAAES_TCNICAS',
  ])('normaliza %s para publicações técnicas', (section) => {
    expect(slugifyMenuSection(section)).toBe('PUBLICACOES_TECNICAS');
  });

  it.each([
    'Conformidade Técnica',
    'CONFORMIDADE_TECNICA',
    'CONFORMIDADE_TCNICA',
  ])('normaliza %s para conformidade técnica', (section) => {
    expect(slugifyMenuSection(section)).toBe('CONFORMIDADE_TECNICA');
  });
});
