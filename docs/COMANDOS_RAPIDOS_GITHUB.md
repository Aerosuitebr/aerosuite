# Comandos Rápidos - GitHub

## Primeira Vez (Subir Projeto)

```bash
# 1. Inicializar Git (se ainda não foi feito)
git init

# 2. Adicionar todos os arquivos
git add .

# 3. Fazer primeiro commit
git commit -m "Initial commit: Projeto Aero Suite Fullstack"

# 4. Adicionar repositório remoto (SUBSTITUA SEU-USUARIO)
git remote add origin https://github.com/SEU-USUARIO/aerosuite-fullstack-pro.git

# 5. Renomear branch para main (se necessário)
git branch -M main

# 6. Enviar para o GitHub
git push -u origin main
```

## Trabalho Diário

```bash
# Ver o que mudou
git status

# Adicionar mudanças
git add .

# Fazer commit
git commit -m "Descrição do que foi feito"

# Enviar para o GitHub
git push
```

## Criar Nova Branch

```bash
# Criar e mudar para nova branch
git checkout -b nome-da-branch

# Fazer mudanças, commits...

# Enviar branch para GitHub
git push -u origin nome-da-branch
```

## Atualizar do GitHub

```bash
# Baixar mudanças do GitHub
git pull
```

## Ver Histórico

```bash
# Histórico resumido
git log --oneline

# Histórico completo
git log
```

## Desfazer Mudanças

```bash
# Desfazer mudanças não commitadas
git checkout -- arquivo.txt

# Desfazer último commit (mantém mudanças)
git reset --soft HEAD~1

# Desfazer último commit (remove mudanças)
git reset --hard HEAD~1
```

