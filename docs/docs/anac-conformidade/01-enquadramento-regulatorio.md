# 1. Enquadramento regulatório

## 1.1 Papel do Aero Suite na cadeia de manutenção

O Aero Suite é uma **plataforma SaaS multi-tenant** de gestão para oficinas de manutenção aeronáutica (MRO / Part 145). Atua como:

- Ferramenta de **ordens de serviço**, execução (job card/hangar), estoque com rastreio e certificados de peça;
- Gerador e repositório de **evidências** para auditoria (dossiê, pacote ZIP, trilhas);
- Apoio ao **SGQ operacional** (documentos controlados, treinamentos, calibração, NC/CAPA, subcontratação);
- Emissor de **CRS** (Certificado de Liberação para Serviço) em PDF, com segregação de funções.

**Não substitui:** MOM, MCQ, programa de manutenção da aeronave, SMS completo, nem parecer de aeronavegabilidade fora do escopo configurado pela organização.

## 1.2 Classificação prática (guia ANAC)

| Nível | Descrição | Aero Suite |
|-------|-----------|------------|
| 1 | CRM/comercial sem impacto em manutenção | Módulo comercial isolado (propostas) — risco baixo |
| 2 | Apoio: cadastros, alertas, relatórios internos | FCU, AD/SB, painel qualidade |
| **3** | **OS, execução, inspeção, rastreabilidade, docs técnicos** | **Escopo principal — ATENDE** |
| **4** | **Registros eletrônicos oficiais, assinatura, liberação, guarda** | **CRS + retenção + dossiê — PARCIAL** (ver matriz) |

**Enquadramento recomendado para consulta ANAC:** Nível **3 com extensão 4** — o sistema pode armazenar registros adotados como oficiais pela organização, mediante ateste e atualização dos manuais internos (MOM/MCQ).

## 1.3 Referenciais normativos aplicáveis

| Referencial | Aplicação na suite |
|-------------|-------------------|
| **RBAC 43** | Registros de manutenção, dados técnicos, rastreabilidade |
| **RBAC 145** | Organização de manutenção, CRS, segregação, qualidade |
| **IS 145-009E** | MOM/MCQ — integração pelo cliente; meios alternativos |
| **Registros eletrônicos ANAC** | Ateste quando registros substituem papel |
| **LGPD** | Dados pessoais de usuários e clientes |

## 1.4 Diferença: homologar software vs demonstrar conformidade

A ANAC avalia o **cumprimento no contexto da organização**, não uma “licença de software”. A estratégia correta:

1. A oficina define quais registros do sistema são **oficiais**;
2. O fornecedor entrega este dossiê + evidências de que o sistema **suporta** os requisitos;
3. A organização integra o uso ao MOM/MCQ e solicita **orientação/ateste** quando aplicável.

## 1.5 Posicionamento comercial (alinhado ao produto)

Evitar claims de “homologação ANAC do software”. Linguagem aprovada:

> *“Evidências operacionais integradas para auditorias Part 145 — não substitui o SGQ certificado da organização.”*

Ver `docs/marketing/AERO-SUITE-ROTEIROS-VIDEO.json` — `avoid_claims`.
