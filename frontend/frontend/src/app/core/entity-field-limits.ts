/** Limites alinhados às colunas JPA (conformidade regulatória). */
export const CONFORMIDADE_FIELD_LIMITS = {
  calibracao: {
    identificador: 80,
    descricao: 255,
    localizacao: 120,
    certificadoRef: 120,
  },
  sgqDocumento: {
    codigo: 80,
    titulo: 255,
    revisao: 32,
    referenciaArquivo: 512,
  },
  habilitacao: {
    identificador: 120,
    escopo: 255,
    emissor: 120,
  },
  aeroDiretriz: {
    numero: 80,
    titulo: 500,
    emissor: 120,
    partNumber: 100,
  },
} as const;
