# Migração de base de dados: `bellows` → `aerosuite`

A aplicação (Quarkus + Docker Compose) já aponta por omissão para a base **`aerosuite`**.  
Se os seus dados ainda estão em **`bellows`**, use um dos métodos abaixo para clonar tudo (tabelas + dados).

## Pré-requisitos

- Cliente `mysql` e `mysqldump` no PATH **ou** MySQL no Docker (`aerosuite-mysql-local`).
- Base **`bellows`** acessível com o mesmo utilizador que a API usa (normalmente `root`).

## Windows (recomendado)

Na raiz do repositório:

```powershell
cd db\scripts
.\Clone-BellowsDatabaseToAerosuite.ps1 -Password root -DropTarget -UpdateEnvFile
```

Com MySQL no Docker Compose local:

```powershell
.\Clone-BellowsDatabaseToAerosuite.ps1 -UseDocker -DockerContainer aerosuite-mysql-local -Password root -DropTarget -UpdateEnvFile
```

Parâmetros úteis:

| Parâmetro | Descrição |
|-----------|-----------|
| `-DropTarget` | Apaga e recria `aerosuite` antes de importar |
| `-UpdateEnvFile` | Troca `/bellows` por `/aerosuite` no `.env` |
| `-SaveDumpPath C:\temp\bellows_dump.sql` | Guarda cópia do dump |

## Linux / macOS

```bash
chmod +x db/scripts/clone_bellows_to_aerosuite.sh
export MYSQL_PWD=root
# Docker:
export DOCKER_CONTAINER=aerosuite-mysql-local
./db/scripts/clone_bellows_to_aerosuite.sh
```

## Depois do clone

1. Confirme o `.env` na raiz:

   ```properties
   QUARKUS_DATASOURCE_JDBC_URL=jdbc:mysql://host.docker.internal:3306/aerosuite?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=America/Sao_Paulo
   ```

2. Reinicie a API:

   ```powershell
   docker compose restart api
   ```

3. Login: **`admin@aerosuite.com`** (senha inalterada em relação ao admin antigo).

4. Flyway continuará a aplicar migrações pendentes (ex. V16) no arranque.

## Sincronizar tabelas com acentuação correta (bellows → aerosuite)

Se `aerosuite` já existe mas textos aparecem com `?` (ex.: **INSPE????O**, **Tha??s**), a origem em `bellows` costuma estar correta. Na raiz do repositório:

```powershell
.\scripts\sync-os-auditoria-from-bellows.ps1
.\scripts\sync-tipos-servico-from-bellows.ps1
.\scripts\sync-templates-from-bellows.ps1
.\scripts\sync-fornecedores-from-bellows.ps1
.\scripts\sync-propostas-from-bellows.ps1
```

Scripts SQL equivalentes em `db/scripts/sync_*_bellows_to_aerosuite.sql`.

## Só estrutura vazia (sem clonar)

Para ambiente novo sem dados legados:

```powershell
docker compose -f docker-compose.yml -f docker-compose.local-mysql.yml up -d mysql
# ou importar db/init/aerosuite_complete.sql manualmente
```

## Renomear em vez de clonar (avançado)

No mesmo servidor MySQL, sem duplicar espaço em disco, pode usar apenas dump/restore com `-DropTarget` como acima.  
Não existe `RENAME DATABASE` fiável no MySQL 8 — o clone via `mysqldump | mysql` é o método suportado.
