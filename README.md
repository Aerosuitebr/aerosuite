# Aerosuite

Plataforma mãe do ecossistema: marca, site institucional e operações compartilhadas (Vultr, Cloudflare, deploy).

| Item | Valor |
|------|--------|
| Produto | Aerosuite |
| Site | https://aerosuite.com.br |
| Dev | http://localhost:4300 |
| Org | [Aerosuitebr](https://github.com/Aerosuitebr) |

## Ecossistema

| Repo | Papel | Domínio |
|------|--------|---------|
| [aerosuite](https://github.com/Aerosuitebr/aerosuite) | Marca + ops | aerosuite.com.br |
| [mira](https://github.com/Aerosuitebr/mira) | Busca B2B | search.aerosuite.com.br |
| [resolva-jato](https://github.com/Aerosuitebr/resolva-jato) | Hub de ferramentas | resolvajato.com.br |

No VPS Vultr:

- Resolva Jato → `127.0.0.1:3000` + tunnel `cloudflared-resolvajato`
- Evolution WhatsApp Aerosuite → porta **18082** (RJ usa **18083**)

## Como rodar

```bash
npm install
npm run dev
```

## Status

Repo recriado após perda do SSD. Código legado em `D:\Desenvolvimento\aerosuite` não estava neste ambiente.
