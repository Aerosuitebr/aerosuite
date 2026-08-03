# Impressão térmica (PPLB) — Elgin L42 e similares

O Aero Suite envia etiquetas em **PPLB** para impressoras térmicas via um pequeno programa no Windows, o **Aero Suite Print Bridge**. O usuário não precisa abrir PowerShell nem salvar arquivos `.pplb` manualmente.

## Instalação (uma vez por PC)

**Pelo Aero Suite (recomendado para o usuário final):**

1. Módulo **Estoque** → botão **Impressora térmica** no cabeçalho (ou ao imprimir etiqueta se o bridge estiver inativo).
2. Leia o guia, clique em **Baixar instalador (Windows)**.
3. Extraia o ZIP e execute **`Instalar Print Bridge.bat`**.
4. No mesmo guia, clique em **Testar conexão** (status verde).

**Pelo repositório (TI / desenvolvimento):**

1. Conecte e ligue a impressora (ex.: **ELGIN L42PRO FULL**).
2. Pasta `print-bridge/` → **`Instalar Print Bridge.bat`**.
3. Confirme em `http://127.0.0.1:19428/health` — JSON com `"ok": true`.

O ZIP servido pelo frontend fica em `frontend/src/assets/downloads/AeroSuite-PrintBridge.zip`.

O instalador:

- Copia o serviço para `%LOCALAPPDATA%\AeroSuite\PrintBridge\`
- Detecta impressora Elgin/L42, se existir
- Cria atalho na **Inicialização** do Windows (bridge sempre ativo após login)

## Uso no Aero Suite

Em **Estoque** (lista de itens, entrada de mercadoria, consulta QR), ao clicar em **Imprimir etiqueta** (formato padrão 100×60 mm):

1. O sistema tenta enviar **PPLB** ao Print Bridge.
2. Se o bridge estiver ativo → impressão direta na térmica.
3. Se não estiver → abre impressão pelo **navegador** (HTML) e exibe aviso para instalar o bridge.

**Impressão normal (padrão):** o botão **Imprimir** abre a etiqueta no navegador (diálogo do Windows / impressora de escritório). Não exige Print Bridge.

**Impressão térmica (opcional):** menu ao lado do botão Imprimir → «Impressora térmica (PPLB)», ou botão dedicado no diálogo de consulta QR / entrada. Requer Print Bridge instalado.

Modo gravado em `localStorage` (`aerosuite.thermalPrint.mode`): **`browser`** (padrão), `auto` (térmica se o bridge estiver ativo) ou `thermal`. Configure em **Estoque → Impressora térmica** no cabeçalho.

## Configuração da impressora

Edite `%LOCALAPPDATA%\AeroSuite\PrintBridge\config.json`:

```json
{
  "port": 19428,
  "printerName": "ELGIN L42PRO FULL"
}
```

Etiqueta física recomendada: **100 mm × 60 mm**, driver em modo compatível PPLB, gap calibrado.

### Orientação (etiqueta invertida)

Em `pplb-etiqueta.builder.ts`, `PPLB_LABEL_ORIENTATION`:

- `'flip180'` (padrão): espelha posições e usa rotação **2** (= 180°) em `A`/`B`; o QR só reposiciona `x,y` (o `0` em `M,0,M1` não é rotação).
- `'zb'`: comando **ZB** após `N` (alternativa só no firmware).
- `'normal'`: layout original.

**Não** use `180` no campo de rotação do PPLB (valores válidos: `0`–`3`); isso zera a impressão.

## Arquivos PPLB externos

Para testes, ainda é possível enviar um `.pplb` manualmente com o script em `Downloads\enviar-pplb-l42.ps1` (desenvolvimento). Em produção, o fluxo oficial é pelo Aero Suite + Print Bridge.

## Segurança

O bridge escuta apenas em **127.0.0.1** (localhost). Não expõe a rede local.

## Estrutura no projeto

| Caminho | Descrição |
|---------|-----------|
| `print-bridge/aero-print-bridge.ps1` | Serviço HTTP RAW |
| `print-bridge/install-windows.ps1` | Instalador |
| `frontend/.../pplb-etiqueta.builder.ts` | Geração PPLB 100×60 |
| `frontend/.../etiqueta-thermal-print.service.ts` | Orquestração impressão |
| `frontend/.../thermal-print-bridge.client.ts` | Cliente HTTP |
