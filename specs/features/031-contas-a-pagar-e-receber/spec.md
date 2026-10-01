# 031 · Contas a pagar, a receber e fluxo de caixa

|                        |                                                                     |
| ---------------------- | ------------------------------------------------------------------- |
| **Estado**             | rascunho                                                            |
| **Fase**               | Financeiro e Fiscal (a confirmar — ver dúvida 1)                   |
| **Depende de**         | `009-lancamentos-financeiros-duas-datas`, `016-cadastro-contrapartes` |
| **Princípios em jogo** | constitution §3, §4, §5, §6                                         |

---

## Problema

O pedido veio como "parte financeira completa". A feature `009` já garante o essencial
— todo lançamento com competência e caixa — mas ela registra o que **aconteceu**. O
que falta é o que **vai acontecer**.

Hoje o que vence está na memória do gerente e em papéis na gaveta. As consequências são
conhecidas: boleto que vence sem ninguém lembrar, duplicata paga duas vezes, parcela de
leilão que ninguém cobrou, e a pergunta mais básica de todas sem resposta — **tenho
dinheiro para pagar o que vence nos próximos trinta dias?**

Em fazenda isso é mais grave do que em outros negócios, porque a entrada de caixa é
concentrada (a safra, o lote vendido) e a saída é contínua (folha, insumo, energia,
combustível). Entre uma venda e outra, o caixa é um vale — e quem não enxerga o vale
entra nele sem perceber.

## Usuários e perfis afetados

| Perfil   | O que passa a fazer                                                   | O que **não** pode ver              |
| -------- | --------------------------------------------------------------------- | ----------------------------------- |
| Dono     | Vê o que vence, o que entra e a projeção de saldo por conta           | —                                   |
| Gerente  | Programa pagamentos, registra recebimentos e concilia o extrato       | —                                   |
| Operador | Nada — não tem superfície nesta feature                               | Tudo: 403                           |

## Histórias

- Como **gerente**, quero ver tudo o que vence nos próximos 30 dias, por fazenda.
- Como **dono**, quero saber se o saldo projetado cobre os compromissos do mês.
- Como **gerente**, quero baixar um título pelo pagamento efetivo, com juros e desconto
  separados.
- Como **dono**, quero o fluxo por fazenda e o consolidado do grupo.

## Critérios de aceite

### CA-01 · Título é previsão; baixa é o fato

- **Dado** uma compra a prazo de R$ 24.000,00 em três parcelas
- **Quando** ela é registrada
- **Então** nascem três títulos a pagar, com vencimento e valor
- **E** a competência da despesa é única, na data do fato (ADR-0008)
- **E** cada baixa é o evento de caixa, na data do pagamento efetivo

### CA-02 · Baixa com juro, multa e desconto separados

- **Dado** um título de R$ 8.000,00 pago com R$ 120,00 de juros e R$ 50,00 de multa
- **Quando** a baixa é registrada
- **Então** o pagamento total é R$ 8.170,00
- **E** juros e multa são lançamentos próprios, vinculados ao título, com sua própria
  classificação
- **E** o custo original não é alterado pelo encargo do atraso

### CA-03 · Baixa parcial

- **Dado** um título de R$ 8.000,00 com pagamento parcial de R$ 5.000,00
- **Quando** a baixa parcial é registrada
- **Então** o saldo em aberto passa a R$ 3.000,00, com o vencimento original preservado
- **E** o histórico mostra as duas movimentações

### CA-04 · Projeção de caixa por fazenda e consolidada

- **Dado** o saldo atual das contas e os títulos em aberto
- **Quando** o dono abre o fluxo de caixa
- **Então** vê, semana a semana, entradas previstas, saídas previstas e saldo projetado
- **E** vê por fazenda (constitution §3) e no consolidado do grupo
- **E** saldo projetado negativo é destacado, com a semana em que ocorre

### CA-05 · Previsto e realizado lado a lado

- **Dado** um mês encerrado
- **Quando** o dono compara
- **Então** vê previsto × realizado por categoria, com o desvio em reais e em percentual
- **E** título vencido e não baixado aparece como pendência, nunca some da previsão

### CA-06 · Nada de pagamento duplicado

- **Dado** um título já baixado
- **Quando** alguém tenta baixá-lo de novo
- **Então** o sistema recusa e mostra a baixa existente
- **E** títulos com mesmo fornecedor, valor e vencimento são sinalizados como possível
  duplicidade antes do pagamento

### CA-07 · Origem rastreável

- **Dado** um título qualquer
- **Quando** o gerente o abre
- **Então** vê a origem: compra (feature `018`), venda (features `011` e `024`),
  contrato (feature `025`), folha, ou lançamento avulso
- **E** títulos gerados por outra feature não podem ser editados soltos: a correção é
  feita na origem

### CA-OFF · Cenário offline

- **Dado** que o gerente está sem conexão
- **Quando** abre o que vence no período
- **Então** vê a posição **já sincronizada**, com a data da última sincronização em
  destaque
- **E** consegue registrar a baixa de um título, gravada localmente com UUID v7 do
  cliente como `pendente`
- **E** ao sincronizar, uma baixa já registrada por outra pessoa gera conflito
  apresentado para resolução — nunca duplicação de pagamento

> Pagamento é o caso em que duplicar custa dinheiro de verdade. A idempotência aqui
> (constitution §2) não é detalhe técnico, é requisito de negócio.

### CA-OP · Cenário de operador

- **Dado** um usuário com perfil `operator`
- **Quando** ele tenta acessar qualquer tela ou endpoint desta feature
- **Então** recebe 403
- **E** nenhum título, saldo ou projeção entra no payload de sync do dispositivo dele
  (constitution §6)

## Regras de negócio

1. Título é **previsão de caixa**; a baixa é o evento de caixa (constitution §5).
2. A competência da despesa ou receita é única e independe do número de parcelas
   (ADR-0008).
3. Juros, multa e desconto são lançamentos próprios, nunca embutidos no valor original.
4. Baixa parcial preserva vencimento e saldo; o título só encerra em saldo zero.
5. Título com origem em outra feature é corrigido na origem.
6. Todo título tem fazenda (constitution §3) e contraparte (feature `016`).
7. Baixa é idempotente: reenvio não gera pagamento novo (constitution §2).
8. Operador não tem superfície nesta feature (constitution §6).

## Fora de escopo

- Conciliação bancária automática por OFX — Fase Financeiro e Fiscal.
- Emissão e envio de boleto, remessa e retorno CNAB.
- Pagamento efetivo integrado ao banco.
- Antecipação de recebível e desconto de duplicata — ver dúvida 5.
- Orçamento anual e acompanhamento orçamentário — ver dúvida 6.

## Dúvidas abertas

| #   | Dúvida                                                                                                                 | Para quem | Estado |
| --- | ------------------------------------------------------------------------------------------------------------------------ | --------- | ------ |
| 1   | "Parte financeira completa" inclui contas a pagar e receber na Fase 1, ou pode ficar na fase Financeiro e Fiscal?      | produtor  | aberta |
| 2   | Como se controla hoje o que vence? Agenda, papel, extrato, memória?                                                   | produtor  | aberta |
| 3   | Quantos títulos a pagar por mês, aproximadamente?                                                                     | produtor  | aberta |
| 4   | Existe conta bancária por fazenda ou uma só? (mesma dúvida da feature `029`)                                          | produtor  | aberta |
| 5   | Há financiamento de custeio, Pronaf ou dívida de investimento a controlar? Isso muda bastante o fluxo.                 | produtor  | aberta |
| 6   | Existe orçamento anual por fazenda, ou o controle é só de realizado?                                                   | produtor  | aberta |
| 7   | Quem paga: a secretária, o gerente ou o dono? Isso define quem precisa da tela.                                       | produtor  | aberta |
