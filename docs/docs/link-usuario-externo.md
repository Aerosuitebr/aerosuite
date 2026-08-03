# Link para usuário externo (definir senha / acessar o sistema)

## Problema

Quando um usuário externo é cadastrado, ele recebe um email com **senha temporária** e um **link** para definir a senha e entrar na aplicação. Se esse link estiver errado (por exemplo apontando para um IP interno ou localhost), o usuário **não consegue acessar**.

## Solução

O link é montado com a **URL do frontend** configurada no backend. Em **produção** é obrigatório definir a URL que o usuário externo realmente usa para acessar o sistema.

### Configuração

A URL padrão do sistema está definida em **application.properties**:

- **Padrão:** `https://app.aerosuite.app` (sem barra no final)
- Os links nos emails (definir senha, reset, etc.) usam essa base.

Para usar outra URL (ex.: outro ambiente), defina a variável de ambiente:

```bash
FRONTEND_URL=https://outro-dominio.com.br
```

No **application.properties**:

```properties
frontend.url=${FRONTEND_URL:https://app.aerosuite.app}
```

### O que o sistema monta

- **Usuário externo (definir senha):**  
  `FRONTEND_URL` + `/externo/setup-password?token=...`  
  Exemplo: `https://sistema.seudominio.com.br/externo/setup-password?token=abc123`

- **Usuário interno (definir senha):**  
  `FRONTEND_URL` + `/setup-password?token=...`

- **Redefinição de senha:**  
  `FRONTEND_URL` + `/reset-password?token=...`

### Se não configurar

Se `FRONTEND_URL` (ou `frontend.url`) **não** estiver definido, o backend pode usar:

- IP detectado da máquina (ex.: `http://192.168.0.x:8081`) — **usuário externo fora da rede não acessa**
- Ou `http://localhost:8081` em desenvolvimento — **só funciona na própria máquina**

Por isso, em produção **sempre** defina `FRONTEND_URL` com a URL pública do sistema.
