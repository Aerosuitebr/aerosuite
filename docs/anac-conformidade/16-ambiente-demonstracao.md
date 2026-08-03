# 16. Ambiente de demonstração

Cenário tecnicamente realista para apresentação comercial, treinamento, validação e discussão com ANAC/consultores — conforme Seção 12 do guia ANAC.

## 16.1 Conteúdo mínimo do cenário

| Elemento | Descrição |
|----------|-----------|
| 1 aeronave / FCU | Matrícula, P/N, S/N, TSN/TSO |
| 1 OS completa | Abertura → execução hangar → anexos → fechamento |
| Peças aplicadas | Com certificado FAA/EASA/ANAC e rastreio |
| Responsáveis | Mecânico, inspetor, RT com habilitações válidas |
| Inspeção | Assinaturas EXECUCAO + INSPECAO no job card |
| CRS | Emitido por RT/inspetor (não pelo executor) |
| AD/SB | Pelo menos 1 diretriz aplicável |
| Logs | Entradas visíveis em auditoria OS e dossiê |
| Export | PDF dossiê + ZIP pacote + `sgq/snapshot.json` |

## 16.2 Preparação do tenant demo

### Sanitização (homologação)

```bash
mysql -u root -p aerosuite < db/scripts/sanitize-demo-tenant-homologacao.sql
```

Substitui nomes sensíveis por "Cliente Demo NN" mantendo estrutura técnica. Também alinha `backup_config` para Docker (`/app/backups`, `host.docker.internal`).

### Backup (Docker local)

Com API no Docker, o caminho de backup deve ser **`/app/backups`** (volume `./backups` no projeto). Não use `D:\Backup\BD` dentro do container.

```powershell
# Ajuste pontual no MySQL (se já existir config antiga):
mysql -u root -p aerosuite < db/scripts/fix-backup-path-docker-local.sql

# Validar dump real:
.\scripts\test\verify-backup-docker.ps1
```

Produção Linux: `/mnt/backups` conforme `docker-compose.production.yml`.

### Provisionamento (se necessário)

```powershell
.\scripts\test\provision-tenant-demo.ps1
.\scripts\test\provision-e2e-hangar-os.ps1
```

## 16.3 Usuários de demonstração

Criar ou usar:

| Usuário | Perfil | Uso na demo |
|---------|--------|-------------|
| `rt.demo@...` | P145_RT | CRS, dossiê |
| `inspetor.demo@...` | P145_INSPETOR | Segregação |
| `mecanico.demo@...` | P145_EXECUCAO | Hangar (bloqueado CRS) |
| `almox.demo@...` | P145_ALMOX | Estoque |

**Não usar** contas compartilhadas em demonstração regulatória.

## 16.4 Roteiro de demonstração (30 min)

1. **Login** mecânico → hangar → apontamento + assinatura execução.
2. **Login** inspetor → assinatura inspeção → tentativa CRS pelo mecânico (falha segregação).
3. **Login** RT → emitir CRS → PDF.
4. **Dossiê** → export PDF + pacote ZIP → mostrar `os_auditoria` e `sgq/`.
5. **Estoque** → rastreio peça → PDF linha do tempo.
6. **Painel qualidade** → alertas treino/calibração/AD.

## 16.5 Dados para validação formal

Repetir o roteiro em ambiente **congelado** (versão tag) e capturar:

- `evidencias/os-amostra-dossie.pdf`
- `evidencias/pacote-auditoria.zip`
- Screenshots UI
- `ultima-execucao.json`

## 16.6 Referências

- Jornada oficina (marketing): `docs/wordpress/apresentacao-jornada-oficina.html`
- Demo scenario: `docs/wordpress/demo-jornada-oficina-scenario.mjs`
