# Vitrine de vídeos (AeroSuite)

Pasta de mídia servida pela API em `/api/vitrine/media/{arquivo}` (autenticado).

Prévia pública no login: `/api/public/vitrine/media/{arquivo}` (allowlist dos vídeos da vitrine).

Configuração: `aero.suite.vitrine.path` / `AERO_SUITE_VITRINE_PATH` (padrão `./vitrine-videos` na raiz do repositório).

Arquivos esperados (nomes normalizados):

- `aerosuite-visao-geral-plataforma.mp4` + `.jpg` (poster)
- `aerosuite-gestao-estoque-passo-a-passo.mp4` + `.jpg` (poster)

Para adicionar novos vídeos, coloque os arquivos aqui e registre o item em `frontend/src/app/vitrine/vitrine-video.catalog.ts`.

## Por que os `.mp4` não vão no Git

Os vídeos somam centenas de MB. Eles ficam **fora do repositório** (`.gitignore`) e são copiados manualmente para cada ambiente.

## Desenvolvimento local (Docker)

Com o repositório clonado, coloque os arquivos nesta pasta. O `docker-compose.yml` já monta:

`./vitrine-videos` → `/app/vitrine-videos` (somente leitura)

Reinicie a API após adicionar arquivos: `docker compose up -d api`.

## Produção (VPS)

1. Crie a pasta no servidor (se ainda não existir):

   ```bash
   sudo mkdir -p /var/aerosuite/vitrine-videos
   sudo chown -R $USER:$USER /var/aerosuite/vitrine-videos
   ```

2. Copie os vídeos do seu PC (PowerShell, ajuste IP e chave SSH):

   ```powershell
   scp -i $env:USERPROFILE\.ssh\aerosuite_ed25519 `
     D:\Desenvolvimento\aerosuite\vitrine-videos\*.mp4 `
     D:\Desenvolvimento\aerosuite\vitrine-videos\*.jpg `
     root@SEU_SERVIDOR:/var/aerosuite/vitrine-videos/
   ```

   Ou com `rsync` (incremental, retoma se cair):

   ```bash
   rsync -avz --progress vitrine-videos/ user@servidor:/var/aerosuite/vitrine-videos/
   ```

3. O `docker-compose.production.yml` monta `/var/aerosuite/vitrine-videos` no container da API. Após o upload, basta garantir que a API está no ar (`docker compose ... up -d api`).

4. Valide (com JWT de um usuário com funcionalidade `VITRINE`):

   ```bash
   curl -I "http://127.0.0.1:8080/api/vitrine/media/aerosuite-visao-geral-plataforma.mp4?access_token=SEU_JWT"
   ```

   Deve retornar `200` e `Content-Type: video/mp4`.

## Atualizar vídeos em produção

Substitua o arquivo na pasta do servidor e reinicie a API se necessário. Não é preciso rebuild do frontend — a mídia é servida só pela API.
