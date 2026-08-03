# 10. Plano de treinamento

## 10.1 Objetivo

Garantir que cada usuário exerça apenas funções para as quais foi capacitado, com registro auditável alinhado ao SGQ da organização.

## 10.2 Públicos e carga horária sugerida

| Público | Conteúdo | Carga | Modalidade |
|---------|----------|-------|------------|
| RT / Qualidade | Dossiê, CRS, segregação, retenção, contingência | 4h | Presencial + manual |
| Inspetor | Auditoria OS, CRS, hangar inspeção | 3h | Presencial |
| Mecânico | OS leitura, hangar execução, offline | 2h | Hangar / tablet |
| Almoxarifado | Estoque, certificado peça, quarentena, rastreio | 2h | Presencial |
| Administrador | RBAC, backup, enforcement, go-live | 3h | Remoto |
| Comercial | Propostas (sem CRS) | 1h | Remoto |

## 10.3 Materiais

| Material | Local |
|----------|-------|
| Manual do usuário PDF | `manuals/Manual_Aero_Suite_Homologacao.pdf` |
| Capítulos SGQ / conformidade | Manual Apêndice A (Fases 5–7) |
| Vídeos | `docs/marketing/AERO-SUITE-ROTEIROS-VIDEO.json` (V12 Conformidade) |
| Ambiente demo | [16-ambiente-demonstracao.md](./16-ambiente-demonstracao.md) |

## 10.4 Registro no sistema

| Ação | Módulo |
|------|--------|
| Cadastrar treinamento por usuário | `/conformidade/treinamentos` |
| Definir treinamento obrigatório por função | `/conformidade/treinamentos-obrigatorios` |
| Bloquear hangar/CRS sem treino | Flag `bloquearTreinoObrigatorio` |

API: `GET/POST /api/conformidade/treinamentos`, `GET/POST /api/conformidade/treinamentos-obrigatorios`.

## 10.5 Avaliação

- Checklist prático por perfil (apêndice do manual).
- RT assina lista de presença → digitalizar para `evidencias/treinamento-*.pdf`.
- Reciclagem: anual ou após mudança de versão major (ver [11-controle-mudancas.md](./11-controle-mudancas.md)).

## 10.6 Integração MOM

Incluir no MOE:

- Quem treina (qualidade/RH);
- Frequência de reciclagem;
- Registro de competência vs perfil RBAC no Aero Suite.
