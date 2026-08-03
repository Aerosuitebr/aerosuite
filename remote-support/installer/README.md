# Instalador Windows

Distribuição alvo:

- `AeroSupport Quick Assist.exe`: execução assistida sem instalação do serviço.
- `AeroSupport Agent.msi`: instalação corporativa, serviço e atualização.
- `AeroSupport Console.msix`: console do técnico.

Antes de distribuição externa:

1. adquirir certificado de assinatura de código;
2. assinar binários, pacotes e manifesto de atualização;
3. validar SmartScreen em canal controlado;
4. oferecer desinstalação integral e remoção do vínculo do dispositivo;
5. documentar opções de implantação corporativa.

## Empacotamento atual

```powershell
npm run desktop:pack
npm run desktop:installer
npm run agent:installer
```

O shell desktop usa isolamento de contexto, sandbox do renderer, integração Node
desativada, instância única e bloqueio de navegação para origens externas.
