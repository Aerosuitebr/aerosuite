# Credenciais — auditoria WCAG (homologação)

**Não commitar** este ficheiro com senhas reais. Copie para uso local ou 1Password:

```bash
cp docs/wcag-evidencias/CREDENCIAIS-AUDITORIA-HOMOLOG.example.md CREDENCIAIS-AUDITORIA-HOMOLOG.local.md
```

---

## Ambiente

| Campo | Valor |
|-------|-------|
| URL portal interno | `https://app.aerosuite.com.br` |
| URL portal externo | `https://app.aerosuite.com.br/externo/login` |
| API (mesma origem) | `https://app.aerosuite.com.br/api` |
| Tenant | `default` |
| Staging alternativo (K8s) | `https://staging.aerosuite.app` _(se activo)_ |

**Antes da sessão:** executar `db/scripts/sanitize-demo-tenant-homologacao.sql` no MySQL de homologação.

---

## Contas (homologação)

| Perfil | Email | Acesso | MFA |
|--------|-------|--------|-----|
| Admin plataforma | `admin@aerosuite.com` | Perfil Administrador — **todas** as funcionalidades ativas | Desligado após script |
| Auditor WCAG | `wcag-auditor@aerosuite.com.br` | **Mesmo perfil_id que admin** (acesso total) | Desligado |

**Provisionar no MySQL:**

```bash
mysql -u root -p aerosuite < db/scripts/provision-wcag-auditor-homologacao.sql
# ou
.\scripts\provision-wcag-auditor-homologacao.ps1
```

Senha inicial da conta WCAG: ver cabeçalho de `db/scripts/provision-wcag-auditor-homologacao.sql` (alterar após 1.º login em produção de auditoria).

Contas opcionais (ainda não automatizadas): `wcag-restrito@…` (403), `wcag-externo@…` (portal).

**MFA:** produto suporta TOTP (`/settings/seguranca`); o script deixa `mfa_enabled = 0` em admin e wcag-auditor.

---

## Contacto técnico

| | |
|---|---|
| Nome | Wellem Lyra — Diretoria de TI |
| E-mail | wellemlyra@aerosuite.com.br |
| Comercial RFP | comercial@aerosuite.com.br |

---

*Modelo interno — junho/2026*
