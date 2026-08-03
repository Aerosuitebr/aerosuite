# GitHub — conta, organização e estrutura de produção

Este guia prepara o repositório remoto da **Aero Suite** para CI/CD e deploy em produção (Hetzner + Docker). O código local já está em `d:\Desenvolvimento\aerosuite` **sem `origin`** configurado.

---

## 1. Criar conta / organização no GitHub

### Opção A — Organização `@aerosuite` (recomendado para produção)

1. Autentique-se no terminal:
   ```powershell
   gh auth login
   ```
   Escolha: **GitHub.com** → **HTTPS** → **Login with a web browser** (ou token PAT).

2. Execute o bootstrap (cria org + repo privado + remote + push):
   ```powershell
   cd d:\Desenvolvimento\aerosuite
   node scripts/github/bootstrap-producao-github.mjs
   ```

   Variáveis opcionais:
   ```powershell
   $env:GITHUB_OWNER = "aerosuite"      # organização
   $env:GITHUB_REPO = "aerosuite"       # nome do repositório
   $env:VISIBILITY = "private"          # private | public
   $env:GITHUB_DEFAULT_BRANCH = "master"
   node scripts/github/bootstrap-producao-github.mjs
   ```

   Simular sem alterar nada:
   ```powershell
   node scripts/github/bootstrap-producao-github.mjs --dry-run
   ```

O script cria (se não existirem):

| Recurso | Valor padrão |
|---------|----------------|
| Organização | `aerosuite-br` |
| Repositório | `aerosuite` (privado) |
| URL | `https://github.com/aerosuite-br/aerosuite` |
| Branches enviadas | `master`, `desenv` |
| Branch padrão (produção) | `master` |

Se o nome `aerosuite` já estiver ocupado no GitHub, use outro owner/repo:
```powershell
$env:GITHUB_OWNER = "aerosuite-br"
$env:GITHUB_REPO = "aerosuite-platform"
```

### Opção B — Conta pessoal (piloto rápido)

Se ainda não quiser criar organização, use a sua conta (ex.: `wellemlyra`):

```powershell
$env:GITHUB_OWNER = "wellemlyra"
$env:GITHUB_REPO = "aerosuite-fullstack-pro"
node scripts/github/bootstrap-producao-github.mjs
```

Depois pode transferir o repositório para uma organização em **Settings → General → Transfer ownership**.

### Opção C — Manual (sem script)

1. https://github.com/organizations/plan — criar org **aerosuite**
2. https://github.com/new — repo **aerosuite**, privado, sem README
3. ```powershell
   git remote add origin https://github.com/aerosuite/aerosuite.git
   git push -u origin master
   git push -u origin desenv
   ```

---

## 2. Estratégia de branches

| Branch | Uso |
|--------|-----|
| `master` | **Produção** — apenas merges via PR após homologação |
| `desenv` | Desenvolvimento e homologação UX (branch atual de trabalho) |
| `saas/**` | Features SaaS isoladas (CI já monitoriza) |

Fluxo sugerido:

```
desenv ──PR──► master ──tag v*──► deploy produção
```

Tags de release: `v1.0.0`, `v1.0.1`, etc.

---

## 3. Proteção e ambientes no GitHub

Após o primeiro push, em **Settings → Branches**:

- **Branch protection** em `master`:
  - Require pull request before merging
  - Require status checks: `Backend (Maven)`, `Frontend (npm)`, `Menu i18n audit`
  - Do not allow bypassing

Em **Settings → Environments**:

| Environment | Uso |
|-------------|-----|
| `staging` | Homologação / preview |
| `production` | Deploy Hetzner (secrets de SSH, `.env`) |

Secrets para CI: ver [CI-SECRETS.md](./CI-SECRETS.md).

---

## 4. CI/CD

Workflows existentes:

| Ficheiro | Disparo |
|----------|---------|
| `.github/workflows/ci.yml` | push/PR em `master`, `desenv`, `develop`, `saas/**` |
| `.github/workflows/integration-smoke.yml` | manual |
| `.github/workflows/covered-suite.yml` | manual |

Deploy no servidor (manual hoje): [DEPLOY-PRODUCAO.md](./DEPLOY-PRODUCAO.md) e pasta `producao/`.

---

## 5. Checklist pós-bootstrap

- [x] `gh auth status` — autenticado (`workflow` + `repo`)
- [x] `git remote -v` — `https://github.com/aerosuite-br/aerosuite.git`
- [x] Branches `master` e `desenv` no GitHub
- [x] Secrets de teste em Actions (ver tabela abaixo)
- [x] Environments `staging` (branch `desenv`) e `production` (branch `master`)
- [ ] Branch protection em `master` — **requer GitHub Team/Pro** em repo privado (plano Free: usar PR + CODEOWNERS manualmente)
- [ ] Clonar no servidor: `/opt/aerosuite` ([DEPLOY-PRODUCAO.md](./DEPLOY-PRODUCAO.md))

### Secrets configurados (repo)

| Secret | Valor |
|--------|--------|
| `AEROSUITE_TEST_EMAIL` | `admin@aerosuite.com` |
| `AEROSUITE_TEST_PASSWORD` | *(seed dev/homolog — trocar em staging real)* |
| `AEROSUITE_TEST_TENANT` | `default` |
| `AEROSUITE_DEMO_EMAIL` | `admin@demo.local` |
| `AEROSUITE_DEMO_TENANT` | `demo` |
| `AEROSUITE_TEST_MULTI_TENANT_EMAIL` | `multi-tenant-test@aerosuite.local` |
| `AEROSUITE_TEST_MULTI_TENANT_PASSWORD` | *(provision script)* |

### Variables

| Variable | Valor atual |
|----------|-------------|
| `AEROSUITE_WEB_URL` | `https://app.aerosuite.com.br` |
| `AEROSUITE_API_URL` | `https://app.aerosuite.com.br/api` |

---

## 6. Comandos úteis

```powershell
# Estado
gh auth status
git remote -v
git branch -a

# Novo push diário (desenv)
git push origin desenv

# Release para produção
git checkout master
git merge desenv
git push origin master
git tag v1.0.0
git push origin v1.0.0
```

---

## Referências

- [GUIA_GITHUB_INICIAL.md](./GUIA_GITHUB_INICIAL.md) — primeiro uso do Git
- [COMANDOS_RAPIDOS_GITHUB.md](./COMANDOS_RAPIDOS_GITHUB.md)
- [CORRIGIR_REMOTE_GITHUB.md](./CORRIGIR_REMOTE_GITHUB.md)
- [PROXIMOS-PASSOS-DESENV.md](./PROXIMOS-PASSOS-DESENV.md) — item A3/A4
