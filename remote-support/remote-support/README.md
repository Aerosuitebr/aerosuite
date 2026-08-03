# AeroSupport

Plataforma independente de suporte remoto assistido, criada para Windows 10/11.

## Estado desta entrega

Esta entrega utilizável contém:

- console imersivo e responsivo do técnico;
- fluxo de início e encerramento de sessão;
- barra de ferramentas para monitores, qualidade, áudio, chat, arquivos e ações;
- painel lateral contextual;
- estados de conexão navegáveis e sincronizados em tempo real;
- ciclo local integrado de criação, validação, consentimento e encerramento da sessão;
- arquitetura documentada para transmissão, agente Windows, serviço privilegiado e controle;
- captura de tela consentida e transmissão WebRTC;
- chat e canal de controle separados;
- persistência opcional em SQLite, autenticação do técnico e limite de tentativas;
- aplicativos Electron e instaladores separados para Console e Agent.

A captura e o controle funcionam no aplicativo Agent para Windows depois do consentimento
explícito. Ações privilegiadas, tela segura, atualização assinada e uso em produção ainda
dependem das etapas descritas em `docs/ARCHITECTURE.md` e `docs/ROADMAP.md`.

## Executar a interface

```powershell
cd remote-support
npm run dev
```

Abra `http://127.0.0.1:4177`.

- Central do técnico: `http://127.0.0.1:4177/dashboard.html`
- Sessão imersiva: `http://127.0.0.1:4177/`
- Aplicativo do usuário atendido: `http://127.0.0.1:4177/agent.html`

## Validar e empacotar

```powershell
npm run verify
npm run desktop:pack
npm run agent:installer
```

Para uma sessão entre computadores, configure ambos os aplicativos com a mesma
`AEROSUPPORT_CONTROL_PLANE_URL`. Somente o Console recebe
`AEROSUPPORT_OPERATOR_TOKEN`.

## Estrutura

```text
apps/operator-console/  Console do técnico
apps/windows-agent/     Base do aplicativo atendido
services/control-plane/ Contratos do servidor de sessões
installer/              Base do instalador Windows
docs/                   Arquitetura, segurança e roadmap
```
