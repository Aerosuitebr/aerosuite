# Protocolo de sessão — protótipo local

O protótipo agora possui um ciclo de sessão funcional entre a Central do Técnico e o
Aplicativo do Usuário.

## Estados

```text
waiting -> authorized -> ended
       \-> expired
```

## Endpoints locais

- `POST /api/sessions` — cria código de uso único com validade de cinco minutos.
- `GET /api/sessions/code/{code}` — valida o convite no aplicativo do usuário.
- `GET /api/sessions/{id}` — acompanha estado e permissões.
- `GET /api/sessions/{id}/events` — canal SSE para mudanças em tempo real e reconexão.
- `GET /api/sessions/{id}/audit` — sequência estruturada de eventos da sessão.
- `POST /api/sessions/{id}/consent` — registra consentimento granular.
- `POST /api/sessions/{id}/control` — pausa ou retoma mouse e teclado a partir do
  dispositivo atendido.
- `POST /api/sessions/{id}/signal` — transporta ofertas, respostas e candidatos ICE
  da negociação WebRTC.
- `POST /api/sessions/{id}/end` — revoga a sessão.

O console imersivo recebe o identificador pela URL, acompanha o estado da sessão e
interrompe o controle imediatamente quando o usuário pausa ou encerra o atendimento.
O endpoint de controle também rejeita qualquer mudança quando a permissão `control` não
foi concedida, e o console mantém os comandos de entrada desabilitados nesse caso.

## Eventos auditáveis

- `session.created`
- `consent.granted`
- `control.paused`
- `control.resumed`
- `session.ended`

Cada evento possui número sequencial, ator, instante e detalhes mínimos. Conteúdo da tela,
teclas digitadas e dados da área de transferência não fazem parte da auditoria.

## Limites desta fase

Sem configuração adicional, o servidor usa memória. Ao definir `AEROSUPPORT_DB_PATH`,
sessões, sinais e auditoria são persistidos em SQLite e sobrevivem ao reinício. O endpoint
de criação aceita autenticação Bearer por `AEROSUPPORT_OPERATOR_TOKEN`, e a consulta por
código possui limite de tentativas por origem. A implementação de produção ainda deve
usar identidade/MFA completos, PostgreSQL/Redis, credenciais TURN efêmeras, trilha de
auditoria imutável e comunicação TLS.

O código temporário identifica um convite, mas não é a chave de criptografia do canal de
mídia. As chaves WebRTC serão efêmeras e negociadas separadamente.

## Mídia nesta fase

O Agent usa o seletor nativo `getDisplayMedia`; nenhuma tela é escolhida silenciosamente.
As trilhas selecionadas são adicionadas a uma conexão WebRTC e o Console substitui a
simulação pelo vídeo recebido. O áudio só é solicitado quando a permissão correspondente
está marcada.

A sinalização foi validada localmente. Uma sessão completa exige que uma pessoa confirme
a janela nativa de escolha do monitor. Conexões fora da rede local ainda precisarão de
STUN/TURN e do servidor público.


## Chat

O chat usa um data channel WebRTC dedicado, ordenado e separado do canal de controle.
As mensagens existem somente durante a conexão entre os participantes: seu conteúdo não
é enviado ao Control Plane, persistido ou incluído na trilha de auditoria.
