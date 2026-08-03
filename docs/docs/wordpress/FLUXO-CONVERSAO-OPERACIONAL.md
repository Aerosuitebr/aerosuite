# Fluxo de conversão — e-mail, Calendly e DNS

Checklist para zerar os apontamentos do relatório UX (seção 4.1).

## 1. E-mail transacional corporativo

| Item | Esperado | Como verificar |
|------|----------|----------------|
| Remetente | `contato@aerosuite.com.br` | Agendar demo teste e inspecionar cabeçalho `From:` |
| Plugin WP | WP Mail SMTP → Locaweb/SendGrid | WP Admin → WP Mail SMTP → Settings |
| Não usar | `wellemlyra@gmail.com` ou Gmail pessoal | — |

```bash
node docs/wordpress/check-conversion-infra.mjs
```

## 2. Título do evento Calendly

No painel [Calendly](https://calendly.com/comercial-aerosuite):

1. Abrir o tipo de evento **30 min**
2. Renomear para: **Demonstração Aero Suite — 30 minutos**
3. Remover palavras: `Teste`, `Equipe Aero Suite` (ambiente de teste)
4. Descrição sugerida: *Sessão guiada sobre OS, estoque, SGQ e conformidade para sua oficina MRO.*

Embed no site: `calendly.com/comercial-aerosuite/30min` (já em `aerosuite-site-secrets.local.mjs` ou env `AEROSUITE_CALENDLY`).

## 2.1 Idioma português (comercial + cliente)

Dois níveis no Calendly (não basta só o perfil da conta):

| Quem | Onde | Valor |
|------|------|--------|
| **Equipe (painel)** | Configurações da conta → Perfil → **Idioma** | Português (Brasil) |
| **Cliente (página + e-mails)** | Agendamento → tipo de evento → ⋮ → **Trocar idioma do convidado** | Português (Brasil) |

Também traduzir manualmente textos livres (mensagem de boas-vindas, descrição do evento, workflows com corpo customizado). O Calendly só traduz automaticamente rótulos padrão (datas, botões, confirmação).

Convites do **Google Calendar** podem manter trechos em inglês até o calendário conectado usar locale PT — isso é independente do Calendly.

## 3. SPF, DKIM e DMARC

Registros DNS do domínio `aerosuite.com.br` (Locaweb / painel DNS):

| Tipo | Nome | Valor (exemplo) |
|------|------|-----------------|
| TXT | `@` | `v=spf1 include:_spf.locaweb.com.br ~all` (ajustar ao provedor real) |
| TXT | `default._domainkey` | Chave DKIM fornecida pelo SMTP |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:contato@aerosuite.com.br` |

Após publicar, aguardar propagação (até 24h) e reexecutar `check-conversion-infra.mjs`.

## 4. Página `/obrigado`

- Layout: bloco `.as-thank-you` (deploy `run-gaps-deploy.mjs`)
- URL limpa: sem `?lead=calendly` (`aerosuite-analytics.js` + `sessionStorage`)

## 5. Teste ponta a ponta (manual)

1. Abrir `/contato/#agendar-demo` em aba anônima
2. Agendar horário de teste
3. Confirmar: e-mail de `contato@aerosuite.com.br`, título profissional no convite, `/obrigado/` alinhado
4. Registrar resultado em `conversion-test-log.json` (opcional)
