# 📘 Instruções Práticas de Migração de Dados

## 🎯 Objetivo
Migrar dados do banco antigo (JSF) para o banco novo (Angular/Quarkus) sem perder informações.

## ⚠️ ANTES DE COMEÇAR

### 1. Faça Backup Completo
```bash
# Via linha de comando (recomendado)
mysqldump -u [usuario] -p [banco_antigo] > backup_completo_$(date +%Y%m%d_%H%M%S).sql

# Ou apenas das tabelas principais
mysqldump -u [usuario] -p [banco_antigo] fabricante perfil usuario fcu os product tipo_servico > backup_principais.sql
```

### 2. Identifique os Bancos
- **Banco Antigo**: Onde estão os dados atuais (produção JSF)
- **Banco Novo**: Onde será implantado o sistema novo (pode ser o mesmo banco com estrutura atualizada)

### 3. Ambiente de Teste
**IMPORTANTE**: Teste primeiro em ambiente de desenvolvimento!

## 📋 Passo a Passo

### ETAPA 1: Preparação

1. **Conecte-se ao MySQL**
   ```sql
   mysql -u [usuario] -p
   ```

2. **Execute o script de backup interno** (opcional, cria backup no próprio MySQL)
   ```sql
   SOURCE C:/Aero Suite/Migracao/backend/EstruturaBanco/01_backup_banco_antigo.sql;
   ```

3. **Compare as estruturas**
   ```sql
   SOURCE C:/Aero Suite/Migracao/backend/EstruturaBanco/02_comparar_estruturas.sql;
   ```
   - Revise as diferenças entre tabelas antigas e novas
   - Anote colunas que foram adicionadas, removidas ou renomeadas

### ETAPA 2: Migração (Ordem Importante!)

Execute os scripts **na ordem abaixo**, validando cada etapa antes de prosseguir:

#### 2.1. Migrar Fabricantes
```sql
SOURCE C:/Aero Suite/Migracao/backend/EstruturaBanco/03_migrar_fabricante.sql;
```
- ✅ Verifique se todos os fabricantes foram migrados
- ✅ Confirme que não há duplicatas

#### 2.2. Migrar Perfis
```sql
SOURCE C:/Aero Suite/Migracao/backend/EstruturaBanco/04_migrar_perfil.sql;
```
- ✅ Confirme que existe pelo menos o perfil ADMIN
- ✅ Verifique se outros perfis foram migrados (se existiam)

#### 2.3. Migrar Usuários
```sql
SOURCE C:/Aero Suite/Migracao/backend/EstruturaBanco/05_migrar_usuario.sql;
```
- ✅ Verifique se todos os usuários foram migrados
- ✅ Confirme que todos têm perfil atribuído
- ✅ Teste login com um usuário migrado

#### 2.4. Migrar FCUs
```sql
SOURCE C:/Aero Suite/Migracao/backend/EstruturaBanco/06_migrar_fcu.sql;
```
- ✅ Verifique se todos os FCUs foram migrados
- ✅ Confirme que os fabricantes estão corretos

#### 2.5. Migrar Ordens de Serviço
```sql
SOURCE C:/Aero Suite/Migracao/backend/EstruturaBanco/07_migrar_os.sql;
```
- ✅ Verifique se todas as OSs foram migradas
- ✅ Confirme relacionamentos com FCU e Fabricante

### ETAPA 3: Validação

```sql
SOURCE C:/Aero Suite/Migracao/backend/EstruturaBanco/08_validar_migracao.sql;
```

Este script verifica:
- ✅ Contagem de registros (antigo vs novo)
- ✅ Integridade referencial (foreign keys)
- ✅ Dados críticos (perfis, usuários)
- ✅ Duplicatas

## 🔧 Ajustes Necessários

### Antes de Executar os Scripts

1. **Ajuste os nomes dos bancos** nos scripts:
   - Procure por `aerosuite_backup_antigo` e substitua pelo nome do seu banco de backup
   - Procure por `aerosuite` e confirme que é o banco destino correto

2. **Verifique nomes de colunas**:
   - Os scripts assumem certos nomes de colunas
   - Compare com sua estrutura real usando `DESCRIBE tabela;`
   - Ajuste os scripts se necessário

3. **Colunas Novas**:
   - Se a nova estrutura tem colunas que não existiam no antigo (ex: `ultimo_acesso`, `foto_perfil`), elas serão preenchidas com valores padrão ou NULL
   - Revise os scripts para ajustar valores padrão se necessário

## 🚨 Problemas Comuns e Soluções

### Problema 1: "Table doesn't exist"
**Solução**: Verifique se o nome do banco está correto nos scripts

### Problema 2: "Foreign key constraint fails"
**Solução**: 
- Verifique se migrou as tabelas na ordem correta
- Confirme que os dados referenciados existem (ex: fabricante antes de FCU)

### Problema 3: "Duplicate entry"
**Solução**: 
- Os scripts usam `INSERT IGNORE` ou verificam existência antes de inserir
- Se ainda ocorrer, pode haver dados duplicados no banco antigo

### Problema 4: "Column doesn't exist"
**Solução**: 
- Compare a estrutura real com o que está no script
- Ajuste os nomes das colunas no script

### Problema 5: Dados não aparecem após migração
**Solução**:
- Verifique se executou COMMIT (os scripts usam transações)
- Confirme que não houve erros durante a execução
- Execute o script de validação para identificar problemas

## ✅ Checklist Final

Antes de considerar a migração concluída:

- [ ] Backup completo realizado
- [ ] Todas as tabelas migradas na ordem correta
- [ ] Script de validação executado sem erros
- [ ] Login testado com usuários migrados
- [ ] OSs aparecem corretamente no sistema
- [ ] Relacionamentos funcionando (FCU-OS, Fabricante-OS)
- [ ] Contagem de registros confere
- [ ] Nenhum dado crítico foi perdido

## 📞 Próximos Passos

Após a migração bem-sucedida:

1. **Teste o sistema completo**:
   - Login/logout
   - Visualização de OSs
   - Criação de nova OS
   - Edição de dados

2. **Monitore por alguns dias**:
   - Verifique logs de erro
   - Confirme que não há problemas de performance
   - Valide que os dados estão consistentes

3. **Documente**:
   - Anote qualquer ajuste feito nos scripts
   - Documente problemas encontrados e soluções
   - Mantenha o backup por pelo menos 30 dias

## 🔄 Rollback (Se Necessário)

Se precisar reverter a migração:

1. **Restaurar do backup**:
   ```bash
   mysql -u [usuario] -p [banco_novo] < backup_completo_[data].sql
   ```

2. **Ou usar o banco de backup criado**:
   ```sql
   -- Copiar dados de volta do banco de backup
   TRUNCATE TABLE fabricante;
   INSERT INTO fabricante SELECT * FROM aerosuite_backup_antigo.backup_fabricante;
   -- Repetir para outras tabelas...
   ```

## 📝 Notas Importantes

- ⚠️ **NUNCA** execute migrações diretamente em produção sem testar antes
- ⚠️ **SEMPRE** faça backup antes de qualquer operação
- ⚠️ Os scripts usam **TRANSACTIONS**, então você pode fazer ROLLBACK se necessário
- ⚠️ Revise e ajuste os scripts conforme sua estrutura específica

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs do MySQL
2. Execute o script de validação para identificar problemas específicos
3. Revise os erros retornados pelos scripts
4. Compare estruturas antigas vs novas usando o script de comparação

