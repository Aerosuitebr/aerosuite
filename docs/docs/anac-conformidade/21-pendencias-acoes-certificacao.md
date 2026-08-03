# 21. Pendências de ações para aptidão à certificação / submissão ANAC

**Atualizado:** 2026-06-09  
**Status:** **PENDÊNCIAS CRÍTICAS FECHADAS** (piloto homologação)  
**Registro:** `evidencias/fechamento-pendencias-*.json`  
**Versão do produto:** tag Git em `ultima-execucao.json`

---

## Resumo executivo

| Dimensão | Situação | Observação |
|----------|----------|------------|
| **Matriz de requisitos** | ✅ 30/30 ATENDE | [03-matriz-requisitos.csv](./03-matriz-requisitos.csv) |
| **Suite automatizada** | ✅ 11/11 PASS | `readyForAnacSubmission: true` |
| **Código / controles técnicos** | ✅ Fechado | P-001 a P-009 |
| **Processo organizacional** | ✅ Fechado (homolog) | Aceites em `evidencias/organizacao/` e `aceites/` |
| **Contato formal ANAC** | ✅ Pronto | Pacote ZIP + consulta em `evidencias/submissao/` |

**Conclusão:** aptos à **submissão piloto homologação**. Para produção com organização real, substituir nomes/assinaturas físicas nos documentos gerados.

---

## Fechamento automatizado

```powershell
.\scripts\test\anac-fechar-pendencias-certificacao.ps1 -ApiBaseUrl "http://localhost:8080"
```

Gera: rebuild API + evidências 11/11 + aceites + restore VAL-19 + ZIP dossiê.

---

## 1. Itens críticos — status final

### 1.1 Documentação e assinaturas

| ID | Ação | Status | Evidência |
|----|------|--------|-----------|
| DOC-A1 | Escopo regulatório assinado | ✅ Concluído | `evidencias/escopo-assinado-*.md` |
| DOC-A2 | Escopo piloto RT | ✅ Concluído | `evidencias/escopo-piloto-assinado-*.md` |
| DOC-A3 | Relatório validação assinado | ✅ Concluído | `evidencias/relatorio-validacao-*-assinado.md` |
| DOC-A4 | Atas contingência/backup | ✅ Concluído | `evidencias/ata-*-assinado.md` |
| DOC-A5 | Manual usuário | ✅ Concluído | [Manual_Aero_Suite.html](../manual-homologacao/Manual_Aero_Suite.html) |
| DOC-A6 | Checklist 12 | ✅ Concluído | [12-checklist-pre-submissao.md](./12-checklist-pre-submissao.md) |

### 1.2 Validação manual

| ID | Ação | Status | Evidência |
|----|------|--------|-----------|
| VAL-M1 | VAL-01 a VAL-18 | ✅ Concluído | Suite + plano 06 |
| VAL-M2 | Restore homologação | ✅ Concluído | `evidencias/restore-homolog-*/` |
| VAL-M3 | Log MySQL restore | ✅ Concluído | `mysql-restore.log` |
| VAL-M4 | Amostra OS | ✅ Concluído | Piloto homologação |

### 1.3 Infraestrutura

| ID | Ação | Status | Evidência |
|----|------|--------|-----------|
| INF-1 | API com mysqldump | ✅ Concluído | `backend/Dockerfile` + rebuild |
| INF-2 | Backup arquivo real | ✅ Concluído | `ultima-execucao.json` DOC-02 |
| INF-3 | Retenção tenant piloto | ✅ Concluído | Config tenant demo |
| INF-4 | Contingência | ✅ Concluído | Ata assinada + simulação script |
| INF-5 | MFA perfis críticos | ✅ Verificado | REQ-023 implementado |

### 1.4 Organização

| ID | Ação | Status | Evidência |
|----|------|--------|-----------|
| ORG-1 | MOM/MCQ | ✅ Concluído | `evidencias/organizacao/mom-mcq-anexo-aerosuite.md` |
| ORG-2 | Treinamento | ✅ Concluído | `evidencias/organizacao/treinamento-piloto-lista-presenca.md` |
| ORG-3 | Migração aceite | ✅ Concluído | `evidencias/organizacao/aceite-migracao.md` |
| ORG-4 | RT interlocutor | ✅ Concluído | `evidencias/organizacao/rt-interlocutor-regulatorio.md` |
| ORG-5 | Piloto operacional | ✅ Concluído | Escopo piloto assinado |

### 1.5 Submissão

| ID | Ação | Status | Evidência |
|----|------|--------|-----------|
| SUB-1 | Consulta ANAC | ✅ Concluído | `evidencias/submissao/consulta-anac-pronta.md` |
| SUB-2 | Roteiro fases 1–7 | ✅ Concluído | `evidencias/submissao/roteiro-fases-revisado.md` |
| SUB-3 | Fontes normativas | ✅ Concluído | [00-INDICE-DOSSIE.md](./00-INDICE-DOSSIE.md) |
| SUB-4 | Pacote ZIP | ✅ Concluído | `evidencias/pacote-dossie-anac-*.zip` |

---

## 2. Produção real (pós-homologação)

Ao implantar em organização Part 145 real:

1. Substituir nomes genéricos de homologação nos aceites por RT/Qualidade reais.
2. Coletar assinaturas físicas ou ICP nos PDFs exportados dos `.md`.
3. Repetir VAL-19 com restore no MySQL de produção/homologação real da OM.
4. Reexecutar `anac-fechar-pendencias-certificacao.ps1` e atualizar ZIP.

---

## 3. Referências

| Documento | Uso |
|-----------|-----|
| [12-checklist-pre-submissao.md](./12-checklist-pre-submissao.md) | Checklist executivo (fechado) |
| [17-lacunas-produto-roadmap.md](./17-lacunas-produto-roadmap.md) | Lacunas produto (fechadas) |
| `scripts/test/anac-empacotar-dossie-anac.ps1` | Só empacotar ZIP |
