# Arquitetura alvo

## Componentes

1. **Operator Console** — aplicativo assinado do técnico, com interface da sessão.
2. **Windows Agent** — aplicativo visível na bandeja, consentimento e controles locais.
3. **Windows Service** — serviço mínimo e privilegiado para tela segura, UAC,
   reinicialização/reconexão e `Ctrl+Alt+Del`.
4. **Control Plane** — identidade, organizações, técnicos, políticas, códigos temporários,
   sinalização e auditoria.
5. **Media Relay** — TURN/STUN e relay WebRTC para redes que não permitem conexão direta.
6. **Update Service** — artefatos assinados, canais de atualização e rollback.

## Canais

- WebRTC com DTLS-SRTP para vídeo e áudio.
- Data channels separados para entrada, área de transferência, chat e arquivos.
- WebSocket autenticado apenas para sinalização e presença.
- TLS 1.3 entre todos os serviços públicos.
- Chaves efêmeras por sessão; segredos permanentes não atravessam o canal de mídia.

## Transmissão

- Captura via Windows Graphics Capture ou Desktop Duplication API.
- Codificação por hardware AV1, HEVC ou H.264 conforme capacidade.
- Modo texto com amostragem 4:4:4 e quantização reduzida.
- Ajuste independente de resolução, FPS e bitrate.
- Áudio de saída por WASAPI loopback.
- Cursor transmitido separadamente para maior nitidez e menor latência.

## Privilégios

O console nunca executa comandos diretamente como SYSTEM. O agente solicita ao serviço
uma operação tipada e assinada. O serviço valida sessão, consentimento, política, prazo e
nonce antes de executar uma lista pequena de ações permitidas. Nenhum terminal arbitrário
faz parte do MVP.

## Implantação inicial

- Control Plane: API stateless + PostgreSQL + Redis.
- Relay: coturn em pelo menos duas regiões.
- Objetos: armazenamento compatível com S3, com retenção e criptografia configuráveis.
- Observabilidade: métricas, logs sem conteúdo sensível e trilhas de auditoria imutáveis.

