# Implantação do Control Plane e TURN

Esta composição separa o servidor central dos servidores locais usados para servir a
interface dos aplicativos.

## Antes de iniciar

1. Troque o `realm`, usuário e senha em `turnserver.conf`.
2. Publique o Control Plane atrás de HTTPS em uma origem dedicada.
3. Libere no firewall:
   - TCP/UDP 3478 para STUN/TURN;
   - TCP/UDP 5349 quando TLS/DTLS for configurado;
   - UDP 49160–49200 para relay de mídia.
4. Configure Console e Agent com:
   - `AEROSUPPORT_CONTROL_PLANE_URL`;
   - `AEROSUPPORT_ICE_SERVERS_JSON`.

Somente o Console recebe `AEROSUPPORT_OPERATOR_TOKEN`. O Agent nunca deve receber esse
segredo. O banco SQLite fica no volume `control-plane-data` e sobrevive à recriação do
container.

Os aplicativos mantêm a interface em `localhost` e encaminham somente `/api/*` ao
Control Plane. O proxy preserva o fluxo SSE usado por sessão.

## Iniciar

```powershell
docker compose -f deploy/control-plane/docker-compose.yml up -d --build
```

O Control Plane persiste sessões e auditoria em SQLite neste perfil e exige o token do
técnico para criar atendimentos. Antes de produção, identidade/MFA completos,
PostgreSQL/Redis, rate limiting distribuído e credenciais TURN efêmeras precisam
substituir os mecanismos locais desta entrega.
