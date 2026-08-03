# Windows Agent

Aplicativo atendido, sempre visível durante uma sessão.

## Projetos previstos

- `AeroSupport.Agent.UI` — bandeja, consentimento, chat e controles locais (WinUI 3).
- `AeroSupport.Agent.Media` — captura, codificação e áudio.
- `AeroSupport.Agent.Input` — entrada remota limitada à sessão autorizada.
- `AeroSupport.Agent.Service` — operações privilegiadas tipadas.
- `AeroSupport.Agent.Contracts` — mensagens versionadas e assinadas.

O serviço privilegiado deve ser instalado apenas pelo instalador assinado. Desenvolvimento
e testes começam sem ele, usando somente sessões no desktop do usuário atual.

## Helper de entrada atual

`AeroSupport.InputHelper` recebe um protocolo JSON limitado pela entrada padrão e usa a
API `SendInput` do Windows para mouse, rolagem e uma lista fechada de teclas. Ele:

- é iniciado somente pelo Agent;
- termina junto com o Agent ou quando o usuário revoga o controle;
- não executa comandos, scripts ou operações de arquivos;
- não atravessa a tela segura do Windows;
- não implementa `Ctrl+Alt+Del` ou elevação UAC.

O canal WebRTC de controle só encaminha eventos enquanto tela, controle e sessão estão
simultaneamente autorizados e ativos.
