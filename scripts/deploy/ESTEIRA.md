# Esteira pelo Windows

Na raiz, abra `esteira.cmd` para o menu ou execute no terminal:

```bat
esteira.cmd start
esteira.cmd status
esteira.cmd logs
esteira.cmd check
esteira.cmd stop
esteira.cmd deploy
esteira.cmd prod-status
```

`start` compila API e frontend, sobe os containers e aguarda ambos responderem.
Requer Docker Desktop iniciado e `.env` configurado. Acesse http://localhost:8081.
Por padrao utiliza o banco indicado no `.env`. Para incluir MySQL no Docker,
acrescente `-LocalMysql` em todos os comandos locais; configure as credenciais
e uma porta `MYSQL_PORT` livre no `.env`. `stop` preserva os volumes.

`deploy` publica o commit HEAD no servidor Vultr, preservando as configuracoes
e dados do servidor. Alteracoes em arquivos de aplicacao rastreados precisam
estar commitadas. Arquivos novos precisam ser adicionados e commitados para
entrarem na publicacao. O build ocorre antes da troca dos containers. Uma
falha interrompe a esteira com codigo diferente de zero; consulte a saida.
O build Docker atual nao executa testes: execute o CI antes da publicacao.

Requer Git, OpenSSH e a chave `%USERPROFILE%\.ssh\aerosuite_ed25519`.
O servidor precisa estar no `known_hosts` do SSH. Para outro destino:

```bat
esteira.cmd deploy -ProductionHost IP -SshUser usuario -IdentityFile C:\chaves\deploy
```

A verificacao publica utiliza https://prod.aerosuite.com.br.
