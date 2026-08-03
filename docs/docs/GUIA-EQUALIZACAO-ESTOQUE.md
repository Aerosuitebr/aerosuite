# Guia do Suprimento — Como deixar o estoque do sistema igual ao real

Este guia é para quem trabalha no Suprimento. A linguagem é simples de propósito.
Leia uma vez do começo ao fim antes de começar a mexer no sistema.

---

## 1. O que está acontecendo (resumo)

Hoje, no sistema, existem **dois lugares onde a quantidade do produto aparece**:

1. **Lista de Produtos** (cadastro do catálogo).
   Esse é o número antigo, que aparece na coluna "Quantidade" da lista de produtos.
   Esse número **não é controlado** pelo sistema — alguém digitou ali um dia e ficou.

2. **Itens de Estoque** (módulo Estoque novo).
   Aqui cada peça tem nota fiscal, lote, valor, certificado e código de rastreio.
   **É daqui que o sistema baixa quando uma OS é aberta com FCU.**

O problema é que, hoje, esses dois lugares não conversam:

- A **Lista de Produtos** diz que tem peça (ex.: 1952 unidades do PIN 118554).
- O **Itens de Estoque** diz que não tem nada (zero linhas para o mesmo PIN).

Quando o mecânico abre uma OS, o sistema olha **só** os Itens de Estoque.
Por isso aparece a mensagem **"OS aberta com déficit no kit FCU"** — mesmo
quando o produto está fisicamente lá na prateleira.

**A solução é simples:** dar entrada das peças no módulo Estoque novo,
do mesmo jeito que se faz quando chega uma nota fiscal nova. Assim os dois
mundos ficam iguais e o sistema para de reclamar.

---

## 2. Antes de começar

### 2.1 Onde está a planilha com os produtos para corrigir

A pessoa da TI gerou **duas planilhas** para vocês. Elas ficam aqui:

```
D:\aerosuite-fullstack-pro\docs\produtos-discrepancia-estoque.csv
D:\aerosuite-fullstack-pro\docs\produtos-duplicados-catalogo.csv
```

Clique duas vezes na primeira. Vai abrir no Excel. Você vai ver estas colunas:

| Coluna | O que significa |
|---|---|
| `id_produto` | Número interno do produto (não precisa preocupar com ele) |
| `pn` | Part Number — a "matrícula" da peça |
| `nome` | Nome da peça (PIN, PACKING, BEARING...) |
| `local_catalogo` | Onde estava anotado no cadastro (prateleira) |
| `qty_catalogo` | Quantidade que aparece **HOJE** na Lista de Produtos |
| `qty_estoque_disponivel` | Quantidade que o sistema **realmente conhece** (geralmente 0) |
| `diferenca` | `qty_catalogo` − `qty_estoque_disponivel`. É a quantidade que falta dar entrada |
| `cadastros_no_catalogo` | Quantas vezes o P/N foi cadastrado |
| `ids_duplicados` | Se cadastros é maior que 1, esses são os IDs dos duplicados |
| `classificacao` | Tipo do problema (ver tabela abaixo) |

### 2.2 Os três tipos de problema

| Classificação na planilha | O que significa | O que fazer |
|---|---|---|
| **SEM_ENTRADA_NO_MODULO_ESTOQUE** | Tem no catálogo, mas nunca foi dado entrada no módulo Estoque | **Dar entrada** (a maioria dos casos) |
| **CATALOGO_MAIOR_QUE_ESTOQUE** | Tem entrada no módulo Estoque, mas o catálogo mostra um número maior | Conferir fisicamente: se a quantidade do estoque está certa, **zerar a Quantidade do catálogo**. Se faltou dar entrada de uma NF, dar a entrada que falta |
| **ESTOQUE_MAIOR_QUE_CATALOGO** | O módulo Estoque tem mais que o catálogo (raro) | Só ignorar — o catálogo está desatualizado e isso não afeta a OS |

> **Atenção:** apenas a primeira coluna **`classificacao`** é o que importa.
> Não dá pra começar pelos casos mais complicados. Comece pelos
> **SEM_ENTRADA_NO_MODULO_ESTOQUE**, que são a maioria (138 produtos).

---

## 3. Antes de dar entrada — confira o Fornecedor

A entrada de produto **exige um fornecedor cadastrado**. Faça isso antes:

1. No menu lateral azul (Estoque), clique em **Fornecedores**.
2. Veja se o fornecedor da peça já está na lista.
3. Se **não estiver**, clique no botão **+ Novo Fornecedor**. Preencha:
   - **Razão Social** (obrigatório) — nome da empresa, ex.: "Aero Suite Controls Inc."
   - **País de Origem** (obrigatório) — selecione na lista.
   - As outras informações pode deixar em branco se não souber.
   - Clique em **Salvar Fornecedor**.

> **Dica:** quando você não sabe o fornecedor original (ex.: peça antiga
> que está no almoxarifado há anos), pode cadastrar um fornecedor chamado
> **"INVENTÁRIO INICIAL"** (País: Brasil) só para "carimbar" essas entradas
> antigas. Combine com o supervisor antes.

---

## 4. Como dar entrada de uma peça (PASSO A PASSO)

Vamos usar como exemplo o **primeiro produto da planilha**:
- P/N: `118554`
- Nome: PIN
- Quantidade no catálogo: 1952

### Passo 1 — Abrir a tela de Entrada

1. No menu azul à esquerda, clique em **Entrada** (ícone de seta entrando).
2. Vai abrir a tela **"Entrada de Mercadoria"**.
3. Em cima aparecem três etapas: **Origem → Produto → Localização**.

### Passo 2 — Origem da Mercadoria

1. Em **Fornecedor**, selecione o fornecedor (use "INVENTÁRIO INICIAL"
   se for o caso).
2. **Invoice (opcional)** — pode deixar vazio se não tiver nota fiscal.
3. Clique no botão **Próximo →**.

### Passo 3 — Dados do Produto

1. No campo **"Buscar no cadastro de produtos"**, digite o P/N: `118554`.
   - Vai aparecer o produto na lista. Clique nele.
   - O Part Number, descrição e nome são preenchidos sozinhos.
2. **Quantidade** — digite a quantidade que está fisicamente na prateleira.
   - Para o exemplo, se você contou e tem 1952 PINs, digita `1952`.
   - **MUITO IMPORTANTE:** se ao contar tiver MENOS do que está na planilha
     (`qty_catalogo`), digite o número **que você CONTOU**, não o da planilha.
     A planilha é só uma referência do que o sistema antigo dizia.
3. **Unidade** — selecione (geralmente "UN" para unidade).
4. **Valor Unitário (USD ou BRL)** — se souber, preencha. Se não souber,
   deixe vazio.
5. Clique em **Próximo →**.

### Passo 4 — Localização e Certificação

1. **Localização no Estoque** — digite onde a peça está fisicamente.
   Use o valor da coluna `local_catalogo` da planilha como referência
   (ex.: "C3").
2. **Prateleira** e **Gaveta** — preencha se souber.
3. **Certificado de Conformidade** — número do certificado, se houver.
   Pode deixar vazio.
4. **Data de Fabricação / Validade** — se souber.
5. Marque o checkbox **"Criar novo lote automaticamente"** (já vem marcado).
6. Clique no botão verde **Registrar Entrada**.

### Passo 5 — Conferência

Vai aparecer uma janela verde **"Entrada Registrada!"** com:
- Código de Rastreio (BLW-...)
- Part Number
- Lote
- QR Code

Pronto. Essa peça agora está no módulo Estoque novo e o sistema **vai conseguir
baixar dela** quando uma OS for aberta. Imprima a etiqueta se quiser.

Clique em **Nova Entrada** para fazer o próximo da planilha.

---

## 5. Marcando o que já foi feito

Para não se perder, recomenda-se:

1. Abrir a planilha `produtos-discrepancia-estoque.csv` no Excel.
2. Adicionar uma coluna nova chamada **"FEITO"** no final.
3. A cada produto que você terminar, escrever **"OK"** nessa coluna e a **data**.

Exemplo:

| id_produto | pn | nome | qty_catalogo | classificacao | FEITO |
|---|---|---|---:|---|---|
| 21 | 118554 | PIN | 1952 | SEM_ENTRADA_NO_MODULO_ESTOQUE | OK 11/05 |
| 99 | 379-S-17 | PACKING | 774 | SEM_ENTRADA_NO_MODULO_ESTOQUE | OK 11/05 |
| 113 | 901211-K1 | PIN | 377 | SEM_ENTRADA_NO_MODULO_ESTOQUE | |

Salve o Excel a cada lote feito (não perca o trabalho).

---

## 6. Caso especial — Produtos duplicados no catálogo

Abra a outra planilha: `produtos-duplicados-catalogo.csv`.

Lá vão aparecer P/Ns que **estão cadastrados duas vezes** no catálogo
(provavelmente alguém cadastrou sem perceber que já existia). Exemplo:

| pn | cadastros | ids | quantidades |
|---|---:|---|---|
| 118554 | 2 | 21,598 | 1952 |
| M25988-1-916 | 2 | 228,533 | 74,138 |

**Importante:** quando você for dar entrada do `118554`, faça **apenas UMA VEZ**.
Não dar entrada duas vezes só porque tem dois cadastros — é a mesma peça.

Depois que a TI ou o supervisor unificar os duplicados (operação interna),
o cadastro extra é desativado e fica apenas um.

> **Atenção especial ao M25988-1-916:** o cadastro 228 diz que tem 74,
> o 533 diz que tem 138. **Só conta fisicamente uma vez** e dá entrada
> da quantidade real contada.

---

## 7. Como saber se está dando certo

A qualquer momento você pode conferir o resultado:

1. No menu de Estoque, clique em **Itens**.
2. Use a busca para procurar pelo P/N que você acabou de dar entrada
   (ex.: `118554`).
3. Deve aparecer pelo menos uma linha com **status DISPONIVEL** e a quantidade
   que você digitou.

Outra forma de conferir:

1. Peça pra alguém abrir uma OS de teste com o FCU que tem esse P/N no kit.
2. Se **não aparecer** o aviso de déficit para esse P/N, está certo.

---

## 8. Dicionário rápido (siglas e termos)

| Termo | O que é |
|---|---|
| **P/N** ou **Part Number** | "Matrícula" da peça (ex.: 118554, MS9058-04) |
| **S/N** ou **Serial Number** | Número de série (cada peça tem um único — opcional) |
| **OS** | Ordem de Serviço |
| **FCU** | Conjunto/equipamento de aviação que entra para revisão |
| **Kit FCU** | Lista de peças que sempre saem para revisar um FCU |
| **Catálogo** ou **Produto** | Cadastro com informações gerais da peça (nome, P/N, foto). Não tem nota fiscal nem lote |
| **Itens de Estoque** | Cadastro físico/fiscal de cada peça com NF, lote, valor, certificado |
| **Lote** | Conjunto de peças que entraram na mesma NF, mesmo dia, mesmo fornecedor |
| **Invoice** | Nota fiscal de importação |
| **Déficit** | "Falta" — o sistema diz que precisa de mais do que tem |
| **DISPONIVEL** | Status da peça quando ela está pronta para uso |
| **CONSUMIDO** | Status quando a peça já foi usada em uma OS |
| **DESCARTADO** | Status quando a peça foi inutilizada (refugada) |

---

## 9. Quando pedir ajuda

Você pode mandar mensagem para a TI quando:

- Aparecer **mensagem de erro vermelha** na tela.
- O P/N que você está procurando **não existe** no cadastro de produtos
  (precisa cadastrar antes — converse com o supervisor).
- O sistema **não deixar salvar a entrada** mesmo preenchendo tudo certo.
- Você tiver dúvida sobre que **fornecedor** usar para uma peça antiga.
- Encontrar **muitos produtos duplicados** além dos 10 que estão na planilha.

---

## 10. Cronograma sugerido

A planilha tem **159 linhas**. Dá pra fazer aos poucos:

| Quem | Quanto por dia | Tempo total |
|---|---|---|
| 1 pessoa, dedicação parcial | 10 a 15 entradas/dia | 2 a 3 semanas |
| 1 pessoa, dedicação total | 30 a 40 entradas/dia | 4 a 5 dias |
| 2 pessoas em revezamento | 40 a 50 entradas/dia | 3 a 4 dias |

**Prioridade:** comece pelas linhas do topo da planilha — elas estão ordenadas
por maior diferença, ou seja, são as peças que mais "quebram" o cálculo
do kit FCU quando uma OS é aberta.

---

_Documento gerado pela TI._
_Em caso de dúvida, mostre este guia ao supervisor antes de mexer no sistema._
