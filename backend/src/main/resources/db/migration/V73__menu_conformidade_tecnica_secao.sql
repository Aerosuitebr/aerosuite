-- R-05: alinhar agrupamento do menu lateral ao manual (cap. 5) — secção Conformidade Técnica.

UPDATE funcionalidade
SET secao = 'Conformidade Técnica'
WHERE codigo IN (
    'AD_SB_ALERTAS',
    'HABILITACAO_TECNICA',
    'SGQ_DOCUMENTO_CONTROLADO',
    'CONFORMIDADE_TREINAMENTO',
    'CONFORMIDADE_CALIBRACAO',
    'CONFORMIDADE_NC',
    'CONFORMIDADE_SUBCONTRATACAO',
    'CONFORMIDADE_PAINEL',
    'CONFORMIDADE_TREINAMENTO_OBRIG',
    'DOSSIE_AUDITORIA'
);

UPDATE funcionalidade
SET secao = 'Go-live'
WHERE codigo = 'GO_LIVE_MIGRACAO';

UPDATE funcionalidade
SET secao = 'Portal externo'
WHERE codigo = 'USUARIOS_EXTERNOS';
