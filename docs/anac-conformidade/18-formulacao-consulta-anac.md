# 18. Formulação para consulta à ANAC

## 18.1 Texto base (carta / protocolo)

```
Assunto: Solicitação de orientação — software de registros de manutenção aeronáutica

À Agência Nacional de Aviação Civil — ANAC,

A organização [RAZÃO SOCIAL], certificada sob RBAC 145 nº [____], e o fornecedor 
do sistema Aero Suite, solicitam orientação quanto ao enquadramento regulatório 
do uso do software como ferramenta de gestão e geração/armazenamento de registros 
de manutenção aeronáutica.

O sistema será utilizado para [marcar conforme escopo assinado]:
( ) gestão operacional de ordens de serviço;
( ) registros eletrônicos oficiais de manutenção;
( ) emissão de Certificado de Liberação para Serviço (CRS) em formato eletrônico;
( ) complemento a registros em papel.

Solicitamos informações sobre:
1. Procedimento aplicável para demonstração de atendimento aos requisitos 
   dos RBAC 43 e 145 e instruções suplementares pertinentes;
2. Evidências necessárias para eventual ateste de registros eletrônicos, 
   conforme orientações da ANAC sobre Registros de Manutenção;
3. Necessidade de concordância prévia para meios alternativos previstos na 
   IS 145-009E, quando o sistema integrar o MOM/MCQ da organização.

Anexamos:
- Declaração de escopo regulatório assinada;
- Matriz de requisitos (requisito × funcionalidade × teste × evidência);
- Manual do usuário e manual técnico;
- Relatório de validação do software;
- Amostra de pacote de auditoria (OS, CRS, trilhas, anexos).

Responsável Técnico: [NOME — CREA/CANAC]
Contato: [e-mail / telefone]

[Local], [data]

[Assinatura RT]
[Assinatura representante legal]
```

## 18.2 Anexos obrigatórios (checklist)

1. `02-declaracao-escopo-regulatorio.pdf` (assinado)
2. `03-matriz-requisitos.csv` ou export PDF
3. `Manual_Aero_Suite_Homologacao.pdf`
4. `05-manual-tecnico.pdf` (export deste MD)
5. `templates/relatorio-validacao-assinado.pdf`
6. `evidencias/pacote-auditoria.zip` (amostra)
7. `evidencias/ultima-execucao.json`

## 18.3 Perguntas preparadas (respostas no dossiê)

| Pergunta ANAC | Documento resposta |
|---------------|-------------------|
| Quais requisitos o sistema atende? | [03-matriz-requisitos](./03-matriz-requisitos.md) |
| Substitui papel? | [02-declaracao-escopo](./02-declaracao-escopo-regulatorio.md) |
| Usuários autorizados em funções críticas? | [14-perfis-acesso-rbac](./14-perfis-acesso-rbac.md) |
| Alteração em registro encerrado? | REQ-009 + P-001 [17-lacunas](./17-lacunas-produto-roadmap.md) |
| Indisponibilidade? | [08-plano-contingencia](./08-plano-contingencia.md) |
| Retenção e export? | REQ-013, [DOSSIE-AUDITORIA](../DOSSIE-AUDITORIA.md) |
| Mudanças de versão? | [11-controle-mudancas](./11-controle-mudancas.md) |
| Treinamento? | [10-plano-treinamento](./10-plano-treinamento.md) |
| Coerência MOM/MCQ? | Responsabilidade org. + módulo SGQ |

## 18.4 Link oficial

Registros de Manutenção — Programa de Transformação Digital:  
https://www.gov.br/anac/pt-br/assuntos/regulados/programa-de-transformacao-digital/registros-de-manutencao
