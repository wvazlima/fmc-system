# 009 · Lançamentos financeiros com duas datas

|                        |                                                 |
| ---------------------- | ----------------------------------------------- |
| **Estado**             | rascunho                                        |
| **Fase**               | 1                                               |
| **Depende de**         | `001-fundacao-multifazenda`, `002-sync-offline` |
| **Princípios em jogo** | constitution §3, §5, §6, §11                    |

---

## Problema

O sistema precisa responder a dois mundos com exigências incompatíveis em uma data só.

**Gestão** pergunta: quanto custou a safra 26/27? O adubo comprado em outubro pertence
a ela, tenha sido pago quando for.

**Fisco** pergunta: quanto saiu do caixa e quando? O produtor rural pessoa física apura
por **regime de caixa**, e o LCDPR é um livro **caixa por imóvel**.

Na planilha há uma coluna de data, e ela é a do pagamento. Resultado: o custo por saca
sai errado sempre que houver parcelamento ou compra antecipada — que é o caso de todo
insumo. E quando o contador pede o livro caixa, alguém reconcilia à mão.

Esta feature entrega o **lançamento** como conceito central, com competência e caixa
separados. Ela é o alicerce de `010`, `011`, `015` e de toda a Fase Financeiro e Fiscal.

## Usuários e perfis afetados

| Perfil   | O que passa a fazer                                                      | O que **não** pode ver |
| -------- | ------------------------------------------------------------------------ | ---------------------- |
| Dono     | Vê resultado por competência e fluxo de caixa, por fazenda e consolidado | —                      |
| Gerente  | Lança entradas e saídas, parcela, categoriza, vincula a talhão ou lote   | —                      |
| Operador | Nada. Esta feature é inteiramente invisível para ele                     | **Tudo**               |

## Histórias

- Como **gerente**, quero lançar uma compra informando a que safra ela pertence e
  quando será paga, sem escolher entre as duas.
- Como **gerente**, quero parcelar um lançamento em três vezes e que o custo continue
  inteiro na safra.
- Como **dono**, quero ver o resultado da safra por competência e o fluxo de caixa por
  data de pagamento, e saber sempre qual dos dois estou olhando.
- Como **gerente**, quero vincular o lançamento ao talhão, ao lote ou à frente, para o
  custo cair no lugar certo.

## Critérios de aceite

### CA-01 · Toda linha tem duas datas

- **Dado** um lançamento sendo criado
- **Quando** ele é salvo
- **Então** `accrual_date` é obrigatória
- **E** `cash_date` é preenchida quando o pagamento é à vista, ou fica nula enquanto
  houver parcela em aberto
- **E** não existe caminho que grave um lançamento com uma data só

### CA-02 · Pagamento à vista preenche as duas

- **Dado** uma compra paga no ato
- **Quando** o gerente informa a data uma vez
- **Então** o sistema preenche `accrual_date` e `cash_date` com o mesmo valor
- **E** só pede a segunda data quando o usuário indica parcelamento ou pagamento futuro

### CA-03 · Parcelamento é 1 competência para N caixas

- **Dado** adubo de R$ 90.000,00 comprado em 10/10/2026, em três parcelas mensais
- **Quando** o gerente registra
- **Então** existe **um** lançamento de competência com `accrual_date = 10/10/2026` e
  valor R$ 90.000,00
- **E** existem **três** eventos de caixa de R$ 30.000,00, em 10/11, 10/12 e 10/01
- **E** o custo da safra 26/27 é R$ 90.000,00, inteiro

### CA-04 · Relatórios declaram a base

- **Dado** qualquer relatório financeiro
- **Quando** ele é exibido ou exportado
- **Então** o cabeçalho declara se é por **competência** ou por **caixa**
- **E** nenhum relatório mistura as duas bases

### CA-05 · Vínculo com o objeto de custo

- **Dado** um lançamento de saída
- **Quando** o gerente o categoriza
- **Então** ele é vinculado a uma **frente** (gado, café, lavoura, pessoal) e,
  opcionalmente, a um talhão, lote ou animal
- **E** lançamento sem frente fica numa fila de classificação, visível ao gerente

### CA-06 · Pessoal é separado do produtivo

- **Dado** um lançamento da frente `pessoal` (casa, jardim, despesa dos proprietários)
- **Quando** o custo por saca ou a margem do gado é calculada
- **Então** ele **não** entra em nenhum dos dois

### CA-07 · Estorno, não edição

- **Dado** um lançamento já sincronizado, com valor errado
- **Quando** o gerente corrige
- **Então** é criado um estorno e um lançamento novo; o original permanece no histórico
  com autor e data

### CA-08 · Participante e conta bancária

- **Dado** um lançamento
- **Quando** o gerente informa o participante (CPF ou CNPJ) e a conta bancária
- **Então** o CPF/CNPJ é validado na entrada
- **E** os dois campos ficam disponíveis para o LCDPR (Fase 2) e a exportação contábil
  (feature `015`)

### CA-OFF · Cenário offline

- **Dado** que o gerente está numa fazenda sem sinal
- **Quando** registra um lançamento parcelado
- **Então** o lançamento e os eventos de caixa são gravados localmente, na mesma
  transação, e confirmados na tela
- **E** ao voltar o sinal, sincronizam como uma unidade, sem duplicar

### CA-OP · Cenário de operador

- **Dado** um usuário com perfil `operator`
- **Quando** ele usa o app
- **Então** não existe nenhuma tela, rota ou registro financeiro acessível a ele
- **E** o `pull` de sync dele **não contém** a tabela de lançamentos
- **E** qualquer requisição a um endpoint financeiro devolve 403

## Regras de negócio

1. Todo lançamento tem `accrual_date` (competência) e `cash_date` (caixa) — ADR-0008.
2. Relatório gerencial usa competência; livro caixa e LCDPR usam caixa. **Nunca se
   misturam.**
3. Parcelamento: **um** registro de competência, **N** eventos de caixa.
4. Dinheiro é `numeric(14,2)` no banco e centavos no TypeScript. Nunca `float`.
5. Todo lançamento pertence a uma **fazenda** e a uma **frente** (centro de custo).
6. A frente `pessoal` não entra em custo produtivo nem em margem.
7. Lançamento é **append-only**; correção é estorno.
8. Participante identificado por CPF ou CNPJ, validado na entrada — exigência do LCDPR
   (skill `integracao-contabil`).
9. Dado importado carrega `source = 'import'` (constitution §11).
10. **Operador nunca acessa nada aqui** (constitution §6).

## Fora de escopo

- Rateio de custos compartilhados — feature `010`.
- Conciliação bancária por OFX — Fase Financeiro e Fiscal.
- Geração do arquivo do LCDPR — Fase 2.
- Exportação contábil em planilha — feature `015`.
- Contas a pagar e a receber com cobrança e vencimento gerenciado.
- Emissão de nota fiscal — Fase Financeiro e Fiscal.

## Dúvidas abertas

| #   | Dúvida                                                                                                            | Para quem | Estado |
| --- | ----------------------------------------------------------------------------------------------------------------- | --------- | ------ |
| 1   | Qual a lista de categorias de despesa e receita que o contador usa hoje? Ela precisa casar com o plano de contas. | contador  | aberta |
| 2   | O LCDPR é obrigatório para este produtor no ano-base corrente?                                                    | contador  | aberta |
| 3   | Quantas contas bancárias existem, e elas são por fazenda ou compartilhadas?                                       | produtor  | aberta |
| 4   | Compra parcelada com juros: os juros devem ser separados do custo do insumo?                                      | contador  | aberta |
| 5   | Despesa que atravessa fazendas num mesmo documento fiscal (uma nota, três fazendas) — como o contador quer isso?  | contador  | aberta |
| 6   | Existe adiantamento a fornecedor? Ele é caixa sem competência até a entrega?                                      | contador  | aberta |
