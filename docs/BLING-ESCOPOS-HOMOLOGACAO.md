# Bling — escopos para homologação Aero Suite (E2E)

## Onde configurar

1. Login na conta Bling trial (**sistema6598** / usuário Aero)
2. **Central de extensões** → **Área do integrador** → app **Aero Suite Homologação** (id `336994`)
3. Aba **Escopos** → **Adicionar** → marque todos abaixo → **Salvar**
4. **Importante:** ao salvar escopos, a Bling **revoga** tokens — reconecte em Aero Suite → Configurações → Integração Bling

## Escopos mínimos (contato → pedido → NF-e)

| Módulo Bling | Marcar |
|--------------|--------|
| **Cadastros → Contatos** | Gerenciar contatos, Visualizar contatos |
| **Cadastros → Produtos** | Gerenciar produtos (opcional) |
| **Vendas → Pedidos de venda** | Gerenciar pedidos, Visualizar pedidos |
| **Notas fiscais → NF-e** | Visualizar NF-e, Emitir NF-e |
| **Webhooks** | Contatos, Pedidos de venda, NF-e (criação/atualização) |

## Webhook

URL: `https://app.aerosuite.com.br/api/integracoes/bling/webhook`

## Verificar na Aero Suite

```powershell
# Após reconectar OAuth
.\scripts\test\api-bling-e2e.ps1 -SkipNfe
```

Ou na UI: **Configurações → Integração Bling → Testar conexão** (lista contatos, pedidos, NF-e).

API: `GET /api/integracoes/bling/scopes`

## Bootstrap (contato de teste)

Botão **Preparar homologação** na UI ou:

```http
POST /api/integracoes/bling/bootstrap/homologacao
```

Cria na Bling:
- Contato **Aero Suite Homologacao Cliente** (CNPJ da empresa demo)
- Defaults fiscais CFOP 5102, NCM 88073000
- Importa como `ClienteProposta` na Aero Suite

## Fluxo manual E2E

1. Bootstrap ou importar contato
2. **Propostas comerciais** → nova proposta → cliente Bling → itens → **APROVADA**
3. **Enviar pedido à Bling**
4. **Emitir NF-e** (requer certificado A1 no Aero Suite **e** no painel Bling)

## NF-e real

- Upload `.pfx` em Configurações → Bling → Certificado digital
- Mesmo certificado em Bling → Preferências → Certificado digital
- Natureza de operação e série alinhadas ao credenciamento SEFAZ da conta trial
