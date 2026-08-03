# Cloudflare e acesso à aplicação na rede

Quando os containers estão **up** mas a aplicação **não fica acessível na internet**, verifique os itens abaixo.

---

## 1. Cloudflare (DNS / Proxy)

### 1.1 DNS
- No **Cloudflare Dashboard** → seu domínio → **DNS** → **Records**:
  - Existe um registro **A** ou **CNAME** apontando para o IP ou host onde o Docker está rodando?
  - O **IP do registro** é o IP público da máquina onde você subiu os containers? (Se for Cloudflare Tunnel, veja item 2.)

### 1.2 Proxy (nuvem laranja vs cinza)
- **Nuvem laranja (Proxied)**: tráfego passa pelo Cloudflare. O Cloudflare precisa conseguir acessar sua **origem** (sua máquina/servidor).
- **Nuvem cinza (DNS only)**: o DNS só resolve para o IP; o visitante acessa direto seu servidor (precisa ter porta 80/443 aberta e acessível).

### 1.3 SSL/TLS (Cloudflare Dashboard → SSL/TLS)
- **Modo “Flexible”**: visitante usa HTTPS no Cloudflare; Cloudflare acessa sua origem em **HTTP**. Sua aplicação pode estar só em HTTP (ex.: porta 80 ou 8081).
- **Modo “Full” ou “Full (strict)”**: Cloudflare espera HTTPS na origem. Aí você precisa de certificado válido no servidor (ou Tunnel com HTTPS).

### 1.4 Firewall / WAF (Cloudflare)
- Em **Security** → **WAF** ou **Firewall rules**: veja se há regras bloqueando o tráfego (país, IP, URI, etc.).
- Em **Security** → **Events**: confira se há requisições sendo bloqueadas.

---

## 2. Cloudflare Tunnel (cloudflared)

> **Guia detalhado:** [CLOUDFLARE_TUNNEL.md](CLOUDFLARE_TUNNEL.md) — URL do serviço, checklist e SSL.

Se você usa **Tunnel** para expor a aplicação (sem abrir portas no roteador):

1. O **cloudflared** está rodando na mesma máquina dos containers?
2. No **Zero Trust** → **Networks** → **Tunnels**: o tunnel está **Active**?
3. No **Public Hostname** do tunnel:
   - O **subdomínio** (ex.: `app.seudominio.com`) está correto?
   - **Service** deve apontar para onde o frontend responde, ex.:
     - **HTTP** → `localhost:8081` (se o tunnel e o Docker estão na mesma máquina), ou  
     - **HTTP** → `aerosuite-frontend:80` (se o cloudflared está na mesma rede Docker que o frontend).

Se o tunnel apontar para `localhost:8081`, os containers precisam estar com as portas mapeadas (ex.: `8081:80` no docker-compose). Se o tunnel e o frontend estão na mesma rede Docker, use o nome do serviço (ex.: `web:80` ou `aerosuite-frontend:80`).

---

## 3. Rede e firewall na máquina do servidor

- **Portas abertas** no firewall do **SO** (Windows/Linux):
  - **80** e **443** se algo (IIS, nginx, Caddy) faz proxy para o Docker, ou
  - **8081** (frontend) e **8080** (backend) se você acessa direto por IP:porta.
- **Firewall do roteador**: se o acesso é pela internet, o roteador precisa encaminhar (NAT) as portas 80/443 (ou 8081/8080) para o IP da máquina onde está o Docker.

---

## 4. Docker e bind de portas

- No **docker-compose**, os serviços estão com portas publicadas, por exemplo:
  - `api`: `8080:8080`
  - `web`: `8081:80`
- Por padrão o Docker publica em **0.0.0.0**, ou seja, em todas as interfaces. Se estiver algo como `127.0.0.1:8081:80`, a aplicação só será acessível na própria máquina.

---

## 5. Testes rápidos

- **Na máquina do servidor:**
  - `curl -I http://localhost:8081` (frontend)
  - `curl -I http://localhost:8080/api/...` (backend)
- **Na mesma rede local (outro PC/celular):**
  - `http://IP_DO_SERVIDOR:8081` (troque pelo IP da máquina onde está o Docker).
- Se funcionar na rede local e não na internet, o problema tende a ser: **DNS no Cloudflare**, **Tunnel** ou **roteador/firewall** (portas não abertas/encaminhadas).

---

## 6. Nginx e Cloudflare (já configurado no projeto)

O **nginx** do frontend já está configurado para usar o IP real do cliente quando o tráfego vem do Cloudflare (`CF-Connecting-IP` e `set_real_ip_from`). Depois de qualquer alteração no nginx, reconstrua o container do frontend:

```bash
docker compose build web
docker compose up -d web
```

---

Se disser como está o acesso (domínio, se usa Tunnel ou só DNS, e se o teste em `http://IP:8081` na rede local funciona), dá para afunilar exatamente o que checar no Cloudflare e na rede.
