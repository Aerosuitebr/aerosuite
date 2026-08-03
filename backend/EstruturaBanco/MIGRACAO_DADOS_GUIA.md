# Guia de Migração de Dados - JSF para Angular/Quarkus

## 📋 Visão Geral

Este guia fornece uma estratégia completa para migrar dados do banco de dados antigo (JSF) para o novo banco (Angular/Quarkus), garantindo que nenhum dado seja perdido.

## 🎯 Estratégia de Migração

### Fase 1: Preparação e Análise
1. **Backup completo do banco antigo**
2. **Comparação de estruturas** (tabelas antigas vs novas)
3. **Identificação de diferenças** (colunas novas, removidas, renomeadas)
4. **Mapeamento de dados** (como os dados antigos se relacionam com a nova estrutura)

### Fase 2: Migração por Dependências
Migrar na ordem correta respeitando foreign keys:
1. **Tabelas independentes** (sem foreign keys)
2. **Tabelas dependentes** (com foreign keys)

### Fase 3: Validação
1. **Contagem de registros**
2. **Validação de integridade**
3. **Testes funcionais**

## 📊 Ordem de Migração Recomendada

### 1. Tabelas Base (Sem Dependências)
- `fabricante`
- `perfil`
- `tipo_servico`
- `tpfiles`

### 2. Tabelas Dependentes Nível 1
- `usuario` (depende de `perfil`)
- `product` (pode depender de `fabricante`)
- `fcu` (depende de `fabricante`)

### 3. Tabelas Dependentes Nível 2
- `os` (depende de `fabricante`, `fcu`)
- `associacao_fcu` (depende de `fcu`)
- `funcionalidade` (pode depender de outras)

### 4. Tabelas de Suporte
- `password_reset_token` (nova, sem dados antigos)
- `files` e `files_details` (se existirem)

## 🔧 Scripts de Migração

Execute os scripts na ordem abaixo:

1. `01_backup_banco_antigo.sql` - Criar backup
2. `02_comparar_estruturas.sql` - Comparar tabelas
3. `03_migrar_fabricante.sql` - Migrar fabricantes
4. `04_migrar_perfil.sql` - Migrar perfis
5. `05_migrar_usuario.sql` - Migrar usuários
6. `06_migrar_fcu.sql` - Migrar FCUs
7. `07_migrar_os.sql` - Migrar Ordens de Serviço
8. `08_validar_migracao.sql` - Validar dados migrados

## ⚠️ Importante

- **SEMPRE faça backup antes de executar qualquer script**
- **Teste em ambiente de desenvolvimento primeiro**
- **Execute scripts em transações** para poder reverter se necessário
- **Valide os dados após cada etapa**

## 📝 Notas

- Algumas colunas podem ter sido adicionadas na nova estrutura (ex: `ultimo_acesso`, `foto_perfil` em `usuario`)
- Algumas colunas podem ter sido renomeadas
- Alguns dados podem precisar de transformação/conversão

