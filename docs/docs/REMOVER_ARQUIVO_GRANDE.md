# Como Remover Arquivo Grande do Git

## Problema
O arquivo `aerosuite-fullstack-pro.zip` (475 MB) excede o limite de 100 MB do GitHub.

## Solução Rápida

### 1. Remover o arquivo do histórico do Git

```bash
# Remover o arquivo do índice (staging area)
git rm --cached aerosuite-fullstack-pro.zip

# OU se o arquivo estiver em uma subpasta:
git rm --cached "caminho/para/aerosuite-fullstack-pro.zip"
```

### 2. Adicionar ao .gitignore

Certifique-se de que o `.gitignore` tem:

```gitignore
# Arquivos ZIP grandes
*.zip
aerosuite-fullstack-pro.zip
```

### 3. Fazer commit da remoção

```bash
git add .gitignore
git commit -m "Remove arquivo grande e atualiza .gitignore"
```

### 4. Fazer push

```bash
git push -u origin main
```

## Se o arquivo já foi commitado antes

Se você já fez commits com esse arquivo, precisa removê-lo do histórico:

### Opção 1: Remover do último commit (se ainda não fez push)

```bash
# Remover do último commit mas manter o arquivo localmente
git reset --soft HEAD~1
git rm --cached aerosuite-fullstack-pro.zip
git commit -m "Initial commit: Projeto Aero Suite Fullstack"
```

### Opção 2: Usar git filter-branch (se já fez vários commits)

```bash
# Remover o arquivo de todo o histórico
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch aerosuite-fullstack-pro.zip" \
  --prune-empty --tag-name-filter cat -- --all
```

### Opção 3: Usar BFG Repo-Cleaner (mais rápido, recomendado)

1. Baixe: https://rtyley.github.io/bfg-repo-cleaner/
2. Execute:
```bash
java -jar bfg.jar --delete-files aerosuite-fullstack-pro.zip
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

## Verificar se o arquivo foi removido

```bash
# Ver arquivos grandes no repositório
git ls-files | xargs ls -lh | sort -k5 -h | tail -10

# Verificar tamanho do repositório
du -sh .git
```

## Depois de remover, fazer push

```bash
git push -u origin main
```

Se ainda der erro, pode ser necessário forçar (cuidado!):

```bash
git push -u origin main --force
```

**⚠️ ATENÇÃO:** Use `--force` apenas se tiver certeza que ninguém mais está trabalhando no repositório.

