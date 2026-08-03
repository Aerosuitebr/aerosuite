# 8. Plano de contingência operacional

## 8.1 Objetivo

Garantir continuidade da manutenção e integridade dos registros quando o Aero Suite estiver indisponível ou em manutenção programada.

## 8.2 Cenários

| Cenário | Impacto | Tempo máximo aceitável* |
|---------|---------|-------------------------|
| Indisponibilidade total (API/BD) | Sem acesso web | ___ h (definir com RT) |
| Hangar sem rede | Execução em campo | Ilimitado (modo offline) |
| Manutenção programada | Janela de deploy | Comunicado 48h antes |
| Perda de dados | Crítico | RPO ≤ ___ h |

\* Preencher na implantação da organização piloto.

## 8.3 Medidas preventivas (produto)

| Medida | Descrição |
|--------|-----------|
| **Hangar offline** | PWA + `localStorage`/IndexedDB + sync (`HangarOfflineSyncService`) |
| **Backup agendado** | `BackupConfigResource` — BD + documentação de pasta de uploads |
| **Export preventivo** | Pacote ZIP dossiê periódico (mensal/trimestral) armazenado offline |
| **Retenção** | Política configurável; export arquivo morto |

## 8.4 Procedimento — indisponibilidade total

### Acionamento

Responsável: **RT** ou **Coordenador de produção** + **TI**.

### Operação manual (enquanto sistema fora)

1. Registrar OS em **formulário padronizado ANAC** (papel) ou formulário interno aprovado no MOM.
2. Anotar: número OS, data, aeronave, escopo, executante, inspetor, peças aplicadas (P/N, S/N).
3. CRS/liberação: assinatura manual conforme MOM até restabelecimento do sistema.
4. Guardar cópias físicas/digitalizadas em pasta controlada pela qualidade.

### Reconciliação pós-restauração

| Passo | Responsável | Registro |
|-------|-------------|----------|
| 1. Confirmar disponibilidade do sistema | TI | Ticket / e-mail |
| 2. Inserir ou importar OS do período offline | Produção | OS no sistema com `numOsOriginal` / observação |
| 3. Anexar scans dos formulários papel | Qualidade | `os-files` upload |
| 4. Revisar duplicidade e consistência | RT | Checklist reconciliação |
| 5. Registrar evento de contingência | Qualidade | NC leve ou registro SGQ |

**Evidência:** ata de reconciliação em `evidencias/ata-contingencia-YYYYMMDD.pdf`.

## 8.5 Procedimento — hangar offline (parcial)

1. Técnico continua em `/hangar` com banner offline.
2. Execução, horas, fotos e assinaturas enfileirados localmente.
3. Ao reconectar: **Sincronizar agora** ou sync automático.
4. Verificar em `os_auditoria` se apontamentos foram registrados.

Teste: `e2e/tests/hangar-offline.spec.ts`, `api-hangar-offline-sync-smoke.ps1`.

## 8.6 Restauração de backup

1. Parar API.
2. Restaurar dump MySQL do último backup válido.
3. Verificar integridade (contagem OS, último `flyway_schema_history`).
4. Subir API e executar smoke: `api-smoke.ps1`.
5. Documentar RTO real na ata.

**Frequência de teste de restauração:** semestral (mínimo).

## 8.7 Comunicação

| Público | Canal | Conteúdo |
|---------|-------|----------|
| Equipe hangar | WhatsApp / mural | Modo offline ou papel |
| Qualidade | E-mail | Ativação contingência |
| Clientes | Conforme MOM | Atraso em entrega de documentos |

## 8.8 Integração MOM/MCQ

A organização deve incluir referência a este plano no **Manual da Organização de Manutenção**, seção “Meios alternativos / sistemas informatizados”, conforme IS 145-009E.
