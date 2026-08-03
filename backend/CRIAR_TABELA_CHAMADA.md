# Criar Tabela Chamada

## Problema
Quando você clica no botão de telefone no chat, nada acontece. Isso pode ser porque a tabela `chamada` não existe no banco de dados.

## Solução

### Opção 1: Via Endpoint (Após recompilar o backend)

1. Aguarde o backend reiniciar completamente
2. Acesse no navegador: `http://localhost:8080/api/fix/criar-tabela-chamada`
3. Ou execute via PowerShell:
```powershell
Invoke-WebRequest -Uri "http://localhost:8080/api/fix/criar-tabela-chamada" -UseBasicParsing
```

### Opção 2: Via SQL Manual (Recomendado)

Execute o seguinte SQL no MySQL:

```sql
USE aerosuite;

CREATE TABLE IF NOT EXISTS `chamada` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `conversa_id` BIGINT NOT NULL,
  `chamador_id` BIGINT NOT NULL,
  `chamador_nome` VARCHAR(255),
  `receptor_id` BIGINT NOT NULL,
  `receptor_nome` VARCHAR(255),
  `status` VARCHAR(20) NOT NULL DEFAULT 'CHAMANDO',
  `data_inicio` DATETIME NOT NULL,
  `data_atendimento` DATETIME,
  `data_fim` DATETIME,
  `duracao_segundos` BIGINT,
  `oferta_sdp` LONGTEXT,
  `resposta_sdp` LONGTEXT,
  `ice_candidates_chamador` LONGTEXT,
  `ice_candidates_receptor` LONGTEXT,
  PRIMARY KEY (`id`),
  INDEX `idx_chamada_conversa` (`conversa_id`),
  INDEX `idx_chamada_chamador` (`chamador_id`),
  INDEX `idx_chamada_receptor` (`receptor_id`),
  INDEX `idx_chamada_status` (`status`),
  INDEX `idx_chamada_recebida` (`receptor_id`, `status`),
  CONSTRAINT `fk_chamada_conversa` FOREIGN KEY (`conversa_id`) REFERENCES `conversa` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

## Verificar se Funcionou

1. Abra o DevTools do navegador (F12)
2. Vá para a aba Console
3. Clique no botão de telefone no chat
4. Verifique se aparecem logs começando com `=== INICIAR CHAMADA CLICADO ===`
5. Se aparecer erro, verifique a mensagem de erro

## Possíveis Erros

### Erro: "Table 'aerosuite.chamada' doesn't exist"
- **Solução**: Execute o SQL acima para criar a tabela

### Erro: "Não foi possível identificar o destinatário da chamada"
- **Causa**: A conversa não tem participantes ou não é uma conversa direta
- **Solução**: Verifique se a conversa tem participantes e é do tipo "DIRETA"

### Erro: "Já existe uma chamada em andamento"
- **Causa**: Você já está em uma chamada
- **Solução**: Encerre a chamada atual antes de iniciar uma nova

### Nada acontece ao clicar
- **Causa**: Pode ser erro silencioso ou permissão de microfone negada
- **Solução**: 
  1. Verifique o console do navegador (F12)
  2. Verifique se a permissão de microfone foi concedida
  3. Verifique se a tabela `chamada` foi criada
