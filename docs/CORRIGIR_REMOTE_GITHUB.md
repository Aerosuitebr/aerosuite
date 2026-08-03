# Como Corrigir o Remote do GitHub

## Problema
Você usou o email na URL, mas o GitHub precisa do **nome de usuário**.

## Solução

### 1. Descobrir seu nome de usuário do GitHub

Acesse: https://github.com/settings/profile

Seu nome de usuário aparece no topo da página (exemplo: `@wellemlyra` ou outro nome).

### 2. Remover o remote incorreto

```bash
git remote remove origin
```

### 3. Adicionar o remote correto

Substitua `SEU-USUARIO` pelo seu nome de usuário real do GitHub:

```bash
git remote add origin https://github.com/SEU-USUARIO/aerosuite-fullstack-pro.git
```

**Exemplo:**
Se seu usuário for `wellemlyra`:
```bash
git remote add origin https://github.com/wellemlyra/aerosuite-fullstack-pro.git
```

### 4. Verificar se está correto

```bash
git remote -v
```

Deve mostrar algo como:
```
origin  https://github.com/SEU-USUARIO/aerosuite-fullstack-pro.git (fetch)
origin  https://github.com/SEU-USUARIO/aerosuite-fullstack-pro.git (push)
```

### 5. Verificar se o repositório existe no GitHub

1. Acesse: https://github.com/SEU-USUARIO/aerosuite-fullstack-pro
2. Se não existir, crie em: https://github.com/new
   - Nome: `aerosuite-fullstack-pro`
   - Não marque nenhuma opção
   - Clique em "Create repository"

### 6. Fazer o push

```bash
git push -u origin main
```

## Se ainda der erro

### Erro: "Repository not found"
- Verifique se o repositório foi criado no GitHub
- Verifique se o nome do repositório está correto
- Verifique se você tem permissão (se for repositório privado)

### Erro de autenticação
Você precisará usar um **Personal Access Token**:

1. Crie um token: https://github.com/settings/tokens
2. Clique em "Generate new token" > "Generate new token (classic)"
3. Dê um nome (ex: "Aero Suite Push")
4. Marque a opção `repo`
5. Clique em "Generate token"
6. Copie o token
7. Quando pedir senha, use o token (não sua senha do GitHub)

