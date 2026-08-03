# Guia de Validação - Sistema de Usuários Externos

## 1. Validação do Banco de Dados

### 1.1 Execute o script SQL
```bash
# No MySQL Workbench, execute:
# db/init/usuario_externo.sql
```

### 1.2 Verificar tabelas criadas
```sql
-- Listar tabelas de usuário externo
SELECT TABLE_NAME, TABLE_COMMENT 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'aerosuite' 
AND TABLE_NAME LIKE '%externo%'
ORDER BY TABLE_NAME;

-- Resultado esperado:
-- funcionalidade_externa
-- log_acesso_externo
-- password_reset_token_externo
-- usuario_externo
-- usuario_externo_documento
-- usuario_externo_funcionalidade
-- usuario_externo_os

-- Verificar funcionalidades cadastradas
SELECT id, nome, codigo, rota, ativo FROM funcionalidade_externa;

-- Resultado esperado: 4 funcionalidades (Home, OS, Documentos, Perfil)
```

---

## 2. Validação do Backend (API REST)

### 2.1 Iniciar o Backend
```bash
cd backend
./mvnw quarkus:dev
# ou
mvn quarkus:dev
```

### 2.2 Testar Endpoints com cURL ou Postman

#### A) Criar Usuário Externo (requer autenticação de admin)
```bash
# Primeiro, faça login como admin para obter o token
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@aerosuite.com", "password": "admin123"}'

# Use o token retornado para criar usuário externo
curl -X POST http://localhost:8080/api/usuarios-externos?criadoPor=1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "nome": "Cliente Teste",
    "email": "cliente@teste.com",
    "empresa": "Empresa Teste Ltda",
    "telefone": "(11) 99999-9999",
    "cargo": "Gerente"
  }'
```

#### B) Listar Usuários Externos
```bash
curl -X GET "http://localhost:8080/api/usuarios-externos?page=0&size=10" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

#### C) Login como Usuário Externo
```bash
curl -X POST http://localhost:8080/api/auth-externo/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cliente@teste.com",
    "password": "SENHA_TEMPORARIA_DO_EMAIL"
  }'
```

#### D) Listar Funcionalidades Externas
```bash
curl -X GET http://localhost:8080/api/usuarios-externos/funcionalidades \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

#### E) Conceder Funcionalidades ao Usuário
```bash
curl -X POST http://localhost:8080/api/usuarios-externos/1/funcionalidades \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "funcionalidadeIds": [1, 2, 3, 4],
    "concedidoPor": 1
  }'
```

#### F) Conceder Acesso a uma OS
```bash
curl -X POST http://localhost:8080/api/usuarios-externos/1/os/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "concedidoPor": 1,
    "observacoes": "Acesso concedido para acompanhamento"
  }'
```

---

## 3. Validação do Frontend

### 3.1 Iniciar o Frontend
```bash
cd frontend
npm install
npm start
# ou
ng serve
```

### 3.2 Testes Manuais no Navegador

#### A) Portal do Admin - Gestão de Usuários Externos
1. Acesse: `http://localhost:4200/login`
2. Faça login como admin
3. Navegue até: `http://localhost:4200/usuarios-externos`
4. Verifique:
   - [ ] Lista de usuários externos carrega
   - [ ] Botão "Novo Usuário Externo" funciona
   - [ ] Filtros de busca funcionam
   - [ ] Botões de ação (ver, editar, permissões) funcionam

#### B) Criar Novo Usuário Externo
1. Clique em "Novo Usuário Externo"
2. Preencha o formulário:
   - Nome: Cliente Validação
   - Email: validacao@teste.com
   - Empresa: Empresa Validação
3. Clique em "Criar Usuário"
4. Verifique:
   - [ ] Mensagem de sucesso aparece
   - [ ] Email de boas-vindas seria enviado (verificar logs)
   - [ ] Usuário aparece na lista

#### C) Gerenciar Permissões
1. Na lista, clique no ícone de chave (Gerenciar Permissões)
2. Verifique:
   - [ ] Aba "Funcionalidades" mostra checkboxes
   - [ ] Aba "Ordens de Serviço" permite adicionar OS
   - [ ] Aba "Documentos" mostra documentos liberados
3. Marque todas as funcionalidades
4. Clique em "Salvar Funcionalidades"
5. Verifique mensagem de sucesso

#### D) Portal do Cliente (Externo)
1. Acesse: `http://localhost:4200/externo/login`
2. Verifique:
   - [ ] Tela de login carrega com design promocional
   - [ ] Logo AEROSUITE aparece
   - [ ] Campos de email e senha funcionam

3. Faça login com o usuário externo criado:
   - Email: validacao@teste.com
   - Senha: (senha temporária do email ou do banco)

4. Verifique o redirect para troca de senha (se for primeiro acesso)

5. Após login bem-sucedido, verifique:
   - [ ] Sidebar com menu lateral aparece
   - [ ] Home promocional carrega com serviços AEROSUITE
   - [ ] Menu mostra apenas funcionalidades liberadas
   - [ ] Navegação entre páginas funciona

#### E) Visualização de OS (Portal Externo)
1. No portal externo, clique em "Minhas Ordens de Serviço"
2. Verifique:
   - [ ] Lista de OS permitidas carrega
   - [ ] Botão "Ver Detalhes" funciona
   - [ ] Detalhes da OS são read-only (sem edição)

#### F) Logout
1. Clique no botão "Sair" no menu
2. Verifique:
   - [ ] Token é removido
   - [ ] Redirect para login funciona
   - [ ] Não é possível acessar rotas protegidas

---

## 4. Checklist Final de Validação

### Backend
- [ ] Endpoint POST /api/usuarios-externos cria usuário
- [ ] Endpoint GET /api/usuarios-externos lista usuários
- [ ] Endpoint PUT /api/usuarios-externos/{id} atualiza usuário
- [ ] Endpoint DELETE /api/usuarios-externos/{id} desativa usuário
- [ ] Endpoint POST /api/auth-externo/login autentica usuário externo
- [ ] Endpoint GET /api/usuarios-externos/funcionalidades lista funcionalidades
- [ ] Endpoint POST /api/usuarios-externos/{id}/funcionalidades concede funcionalidades
- [ ] Endpoint POST /api/usuarios-externos/{id}/os/{osId} concede acesso a OS

### Frontend - Admin
- [ ] Tela de listagem de usuários externos
- [ ] Formulário de criação de usuário externo
- [ ] Formulário de edição de usuário externo
- [ ] Tela de gerenciamento de permissões
- [ ] Ações de ativar/desativar usuário

### Frontend - Portal Externo
- [ ] Tela de login com design promocional
- [ ] Fluxo de primeiro acesso (troca de senha)
- [ ] Home promocional com serviços AEROSUITE
- [ ] Sidebar com menu dinâmico
- [ ] Lista de OS (somente visualização)
- [ ] Detalhes de OS (read-only)
- [ ] Lista de documentos
- [ ] Tela de perfil
- [ ] Logout funcional

### Segurança
- [ ] Rotas do portal externo são protegidas por AuthExternoGuard
- [ ] Token JWT expira corretamente
- [ ] Usuário só vê OS/documentos liberados para ele
- [ ] Admin pode gerenciar usuários externos
- [ ] Usuário externo não acessa área administrativa

---

## 5. Dados de Teste

### Criar Usuário de Teste via SQL
```sql
-- Inserir usuário externo de teste
INSERT INTO usuario_externo (nome, email, senha, empresa, ativo, precisa_trocar_senha, data_cadastro)
VALUES ('Cliente Teste', 'teste@externo.com', 'senha123', 'Empresa Teste', 1, 0, CURDATE());

-- Pegar o ID do usuário criado
SET @usuario_id = LAST_INSERT_ID();

-- Conceder todas as funcionalidades
INSERT INTO usuario_externo_funcionalidade (usuario_externo_id, funcionalidade_externa_id)
SELECT @usuario_id, id FROM funcionalidade_externa WHERE ativo = 1;

-- Conceder acesso a uma OS (ajuste o ID da OS conforme necessário)
INSERT INTO usuario_externo_os (usuario_externo_id, os_id, pode_visualizar)
VALUES (@usuario_id, 1, 1);

-- Verificar dados criados
SELECT * FROM usuario_externo WHERE email = 'teste@externo.com';
SELECT uef.*, fe.nome as funcionalidade 
FROM usuario_externo_funcionalidade uef 
JOIN funcionalidade_externa fe ON uef.funcionalidade_externa_id = fe.id
WHERE uef.usuario_externo_id = @usuario_id;
```

---

## 6. Troubleshooting

### Problema: Login externo não funciona
- Verificar se o endpoint `/api/auth-externo/login` existe
- Verificar se o usuário está ativo (`ativo = 1`)
- Verificar logs do backend para erros

### Problema: Menu não mostra funcionalidades
- Verificar se funcionalidades foram concedidas na tabela `usuario_externo_funcionalidade`
- Verificar se as funcionalidades estão ativas (`ativo = 1`)
- Verificar se o token inclui as funcionalidades

### Problema: OS não aparece para usuário externo
- Verificar se o acesso foi concedido na tabela `usuario_externo_os`
- Verificar se `pode_visualizar = 1`
- Verificar logs do backend

### Problema: Erro de CORS
- Verificar configuração de CORS no backend
- Verificar se a origem está permitida

---

## 7. URLs de Teste

| Ambiente | URL |
|----------|-----|
| Admin Login | http://localhost:4200/login |
| Admin - Usuários Externos | http://localhost:4200/usuarios-externos |
| Portal Externo - Login | http://localhost:4200/externo/login |
| Portal Externo - Home | http://localhost:4200/externo |
| Portal Externo - OS | http://localhost:4200/externo/os |
| Portal Externo - Documentos | http://localhost:4200/externo/documentos |
| API - Swagger (se habilitado) | http://localhost:8080/q/swagger-ui |
