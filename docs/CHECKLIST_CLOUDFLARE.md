# Checklist – Cloudflare (conferir no painel)

Use este checklist no **painel da Cloudflare** e no **Zero Trust** para o sistema ficar acessível na internet.

---

## 1. Tunnel (Zero Trust → Networks → Tunnels)

| Item | Onde ver | Deve estar |
|------|----------|------------|
| Tunnel **Active** / **Healthy** | Status do tunnel | Verde / Active |
| **cloudflared** rodando | Na máquina onde está o Docker (ex.: 172.16.0.10) | Serviço ou processo `cloudflared` em execução |

---

## 2. Public Hostname do Tunnel

Em **Tunnels** → seu tunnel → **Public Hostname** (ou **Routes**):

| Campo | Valor correto |
|--------|----------------|
| **Subdomain** | Ex.: `app` (resulta em `app.seudominio.com.br`) |
| **Domain** | Domínio que você gerencia no Cloudflare |
| **Service type** | **HTTP** |
| **URL** | **`localhost:8081`** ou **`127.0.0.1:8081`** |

Importante: a URL deve ser **HTTP** (não HTTPS) e a porta **8081** (porta do frontend no Docker). Não use barra no final.

---

## 3. DNS (Dashboard do domínio → DNS → Records)

| Item | Verificação |
|------|-------------|
| Registro do app | Existe um registro para o hostname que você usa (ex.: `app` ou `app.seudominio.com.br`)? |
| Tipo | Para tunnel: normalmente **CNAME** apontando para o tunnel (ex.: `...cfargotunnel.com`) **ou** o tunnel cria/atualiza o DNS automaticamente. Confirme que o hostname do app não aponta para um **IP fixo** antigo (senão o tráfego não passa pelo tunnel). |
| Proxy | Nuvem **laranja** (Proxied) para tráfego passar pelo Cloudflare. |

---

## 4. SSL/TLS (Dashboard do domínio → SSL/TLS)

| Item | Recomendado |
|------|-------------|
| **Overview** | **Full** ou **Flexible**. Com tunnel em HTTP para `localhost:8081`, **Flexible** é suficiente (visitante HTTPS, origem HTTP). |

---

## 5. Firewall / WAF (Security)

| Item | Verificação |
|------|-------------|
| Regras de firewall | Nenhuma regra bloqueando o hostname do app (ex.: `app.seudominio.com.br`) ou o país de acesso. |
| **Security** → **Events** | Se não carregar: ver se há requisições bloqueadas (ação "Block") e ajustar a regra ou colocar em "Allow". |

---

## 6. Na sua máquina (onde está o Docker)

| Item | Verificação |
|------|-------------|
| Containers no ar | `docker ps` mostra **aerosuite-frontend** e **aerosuite-backend** como **Up**. |
| Frontend responde | No próprio servidor: `http://localhost:8081` abre a aplicação ou `curl -I http://localhost:8081` retorna **200**. |
| Tunnel (cloudflared) | Rodando na **mesma máquina** que o Docker. |

---

## Resumo rápido

1. **Tunnel** ativo e **Public Hostname** = **HTTP** → **localhost:8081**.
2. **DNS** do app apontando para o tunnel (ou deixar o tunnel gerenciar).
3. **SSL** em **Flexible** (ou Full, conforme sua origem).
4. **Firewall/WAF** sem bloqueio para o app.
5. **Docker** e **cloudflared** rodando na mesma máquina.

Depois de alterar o **Public Hostname** ou o **nginx** do frontend, reconstrua o container do frontend:

```bash
docker compose build web
docker compose up -d web
```
