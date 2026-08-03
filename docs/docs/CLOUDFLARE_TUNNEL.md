# Cloudflare Tunnel – Aero Suite

Configuração recomendada para expor a aplicação usando **Cloudflare Tunnel** (cloudflared).

---

## 1. Onde o Tunnel se conecta

O **cloudflared** roda na **mesma máquina** onde está o Docker. O Docker expõe:

- **Frontend:** `http://localhost:8081` (nginx na porta 80 do container, mapeada para 8081 no host)
- **Backend (API):** `http://localhost:8080`

O tunnel deve apontar **só para o frontend**. O usuário acessa um único domínio (ex.: `app.seudominio.com`); o frontend (Angular) chama `/api/` no mesmo host, e o nginx faz o proxy para o backend.

---

## 2. Configuração no Cloudflare (Zero Trust)

1. Acesse **Cloudflare Zero Trust** (ou **Dashboard** → **Zero Trust**).
2. Vá em **Networks** → **Tunnels**.
3. Crie um tunnel ou edite o existente.
4. Em **Public Hostname** (ou **Routes**), configure:

| Campo | Valor |
|--------|--------|
| **Subdomain** (ou hostname) | Ex.: `app` → fica `app.seudominio.com` |
| **Domain** | Seu domínio gerenciado no Cloudflare |
| **Service type** | **HTTP** |
| **URL** | **`localhost:8081`** ou **`127.0.0.1:8081`** |

Ou seja: o serviço que o tunnel expõe é **`http://localhost:8081`**.

5. Salve. O conector (cloudflared) precisa estar **rodando** na máquina onde está o Docker.

---

## 3. Resumo do fluxo

```
Usuário → https://app.seudominio.com (Cloudflare)
       → Tunnel (cloudflared na sua máquina)
       → http://localhost:8081 (frontend Docker)
       → Angular carrega e chama /api/...
       → nginx no frontend faz proxy para host.docker.internal:8080 (backend)
```

---

## 4. Checklist se não estiver acessível

- [ ] **Containers no ar:** `docker ps` mostra `aerosuite-frontend` e `aerosuite-backend` como **Up**.
- [ ] **Frontend responde no host:** no próprio servidor, abrir `http://localhost:8081` no navegador ou `curl -I http://localhost:8081` retorna 200.
- [ ] **Tunnel ativo:** no Zero Trust → **Networks** → **Tunnels**, o tunnel está **Healthy** / **Active**.
- [ ] **Public Hostname correto:** Service type = **HTTP**, URL = **`localhost:8081`** (sem `https`, sem porta errada).
- [ ] **cloudflared em execução:** o conector (instalado na mesma máquina do Docker) está rodando; no Windows pode ser um serviço ou janela do `cloudflared.exe`.

---

## 5. Múltiplos hostnames (opcional)

Se quiser um hostname só para a API (ex.: para testes):

- **Hostname 1:** `app.seudominio.com` → **HTTP** → `localhost:8081` (frontend)
- **Hostname 2:** `api.seudominio.com` → **HTTP** → `localhost:8080` (backend)

Para uso normal do sistema, **só o hostname do frontend (8081)** é necessário; o frontend usa caminhos relativos `/api/` no mesmo domínio.

---

## 6. SSL no Cloudflare

No **Dashboard do domínio** → **SSL/TLS**:

- **Overview:** modo **Full** ou **Full (strict)** se a origem tiver HTTPS; como o tunnel fala com `http://localhost:8081`, **Flexible** também funciona (visitante usa HTTPS, Cloudflare fala HTTP com o tunnel).
- O tunnel entre Cloudflare e o cloudflared já é criptografado; não é obrigatório ter certificado em localhost.

Com o tunnel apontando para **`http://localhost:8081`** e os containers escutando em **8081** e **8080** no host, a aplicação fica acessível pela internet via Cloudflare Tunnel.

---

## 7. Página de manutenção no deploy

Durante um **rebuild** do container `web`, a porta **8081** fica sem resposta e o Cloudflare mostra a página genérica de erro. Para exibir a mensagem **“Opa! Voltaremos em seguida…”** com a marca Aero Suite:

### Deploy automatizado (recomendado)

**Windows — duplo clique na raiz do projeto:**

- **`deploy.bat`** — menu com deploy completo, deploy rápido, ativar/desativar manutenção

**Atalhos em `scripts\deploy\`:**

- `redeploy-with-maintenance.cmd` — deploy completo
- `maintenance-on.cmd` / `maintenance-off.cmd` — só a página de manutenção

**Windows (PowerShell, na raiz do projeto):**

```powershell
.\scripts\deploy\redeploy-with-maintenance.ps1
```

**Linux (produção):**

```bash
chmod +x scripts/deploy/redeploy-with-maintenance.sh
./scripts/deploy/redeploy-with-maintenance.sh
```

O script:

1. Para o frontend e sobe um nginx leve só com a página de manutenção na **8081** (o tunnel continua a funcionar).
2. Faz rebuild da API e do frontend.
3. Troca de volta para a aplicação normal.

### Manutenção manual

```powershell
# Ativar (antes de parar/rebuildar o frontend)
.\scripts\deploy\maintenance-on.ps1

# ... deploy / manutenção ...

# Desativar
.\scripts\deploy\maintenance-off.ps1
```

### Manutenção suave (sem parar o container)

Com o frontend no ar, é possível mostrar a mesma página a todos os visitantes:

```powershell
New-Item -ItemType Directory -Force -Path data/nginx-maintenance | Out-Null
New-Item -ItemType File -Force -Path data/nginx-maintenance/on | Out-Null
docker exec aerosuite-frontend nginx -s reload
```

Para voltar: apague `data/nginx-maintenance/on` e execute `nginx -s reload` no container.

A página está em `frontend/maintenance/index.html` (PT/EN/ES/FR conforme idioma do browser) e também é servida em `/maintenance.html` dentro do frontend principal.
