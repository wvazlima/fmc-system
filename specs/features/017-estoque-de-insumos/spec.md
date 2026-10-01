# 017 · Estoque de insumos e almoxarifado

|                        |                                                                  |
| ---------------------- | ---------------------------------------------------------------- |
| **Estado**             | rascunho                                                         |
| **Fase**               | 1 (a confirmar — ver dúvida 1)                                   |
| **Depende de**         | `008-cafe-aplicacoes-e-custos`, `016-cadastro-contrapartes`      |
| **Princípios em jogo** | constitution §1, §3, §4, §6                                      |

---

## Problema

Compra-se adubo para aplicar. Sobra. A sobra vai para o barracão e, a partir daí,
ninguém sabe quanto tem. Na safra seguinte compra-se de novo porque é mais rápido do
que ir conferir — e o produto que estava lá vence. Ou acontece o contrário: o produto
sai do barracão e não chega ao talhão, e ninguém consegue provar.

Hoje o custo do insumo é lançado na compra, por aplicação. Isso funciona enquanto o
que se compra é exatamente o que se aplica. Quando sobra, o custo da safra fica errado
nos dois sentidos: a safra que comprou paga por produto que a safra seguinte usou.

Há ainda uma consequência que não é de custo: **sem saldo teórico não existe
conferência**. A feature `026` (sentinela de desvio) só funciona se houver um número
esperado para comparar com a contagem física. Sem estoque, não há o que auditar.

> **Atenção de escopo.** O roadmap atual lista "controle de estoque de insumos com
> saldo em tempo real" como **fora de escopo**, e as features `004` e `008` o excluem
> explicitamente. O gestor informou no levantamento que o insumo é comprado **por
> aplicação, não em volume estocado**. Esta spec contradiz as duas coisas e só deve ser
> aprovada depois que a dúvida 1 for respondida.

## Usuários e perfis afetados

| Perfil   | O que passa a fazer                                                    | O que **não** pode ver                   |
| -------- | ---------------------------------------------------------------------- | ---------------------------------------- |
| Dono     | Vê o valor imobilizado em estoque e o que está perto do vencimento     | —                                        |
| Gerente  | Registra entrada, saída, transferência, inventário e ajuste            | —                                        |
| Operador | Registra a retirada do produto para a aplicação, em quantidade         | Custo unitário, valor do saldo, total    |

## Histórias

- Como **gerente**, quero saber quanto tenho de cada produto em cada fazenda, agora.
- Como **gerente**, quero que a aplicação no talhão baixe o estoque automaticamente,
  sem lançamento duplo.
- Como **dono**, quero saber quanto dinheiro está parado no barracão.
- Como **gerente**, quero ser avisado do produto que vence nos próximos 60 dias.
- Como **gerente**, quero registrar a contagem física e ver a diferença contra o saldo
  do sistema.

## Critérios de aceite

### CA-01 · Entrada pela compra

- **Dado** uma compra de 2.000 kg de adubo por R$ 7.400,00 para a fazenda A
- **Quando** a entrada é registrada
- **Então** o saldo do produto na fazenda A passa a 2.000 kg
- **E** o custo médio unitário passa a R$ 3,70 por kg
- **E** o lançamento financeiro é criado com duas datas (ADR-0008), **sem** virar custo
  de safra ainda

### CA-02 · Saída pela aplicação

- **Dado** 2.000 kg em estoque a R$ 3,70 o kg
- **Quando** é registrada uma aplicação de 300 kg no talhão T-04 (feature `008`)
- **Então** o saldo cai para 1.700 kg
- **E** R$ 1.110,00 entram no custo do talhão T-04, na safra da data de competência
- **E** **não** existe duplo lançamento: o custo sai do estoque e entra no talhão, é
  transferência, não despesa nova

### CA-03 · Custo médio móvel

- **Dado** 1.700 kg a R$ 3,70 e uma compra nova de 1.000 kg por R$ 4,10 o kg
- **Quando** a entrada é registrada
- **Então** o saldo passa a 2.700 kg
- **E** o custo médio passa a **R$ 3,848148...** por kg, arredondado na apresentação e
  guardado com precisão suficiente para não acumular erro no fechamento
- **E** o cálculo é determinístico, testado e idêntico no cliente e no servidor
  (constitution §4)

### CA-04 · Saldo nunca fica negativo em silêncio

- **Dado** 50 kg em estoque
- **Quando** alguém registra aplicação de 300 kg
- **Então** o sistema aceita o registro (o produto foi aplicado de fato) mas marca a
  movimentação como **divergente**
- **E** gera pendência de conferência para o gerente, com a quantidade faltante
- **E** a divergência alimenta a feature `026`

### CA-05 · Inventário físico

- **Dado** um saldo de sistema de 1.700 kg
- **Quando** o gerente registra contagem física de 1.650 kg
- **Então** o sistema grava o inventário, a diferença de −50 kg e o valor da diferença
- **E** exige justificativa para fechar o ajuste
- **E** o ajuste é um movimento próprio, rastreável, nunca uma edição do saldo

### CA-06 · Estoque é por fazenda

- **Dado** o mesmo produto em duas fazendas
- **Quando** o saldo é consultado
- **Então** cada fazenda tem seu saldo e seu custo médio próprios (constitution §3)
- **E** mover produto entre fazendas é uma transferência que leva o custo junto, sem
  gerar despesa

### CA-07 · Validade e lote do fabricante

- **Dado** um defensivo com data de validade
- **Quando** faltam 60 dias para vencer
- **Então** o produto aparece no alerta de vencimento, com quantidade e valor
- **E** o produto vencido continua no saldo, destacado, até ser baixado com
  justificativa

### CA-OFF · Cenário offline

- **Dado** que o operador está no barracão, sem sinal, retirando produto para aplicar
- **Quando** registra a retirada
- **Então** o movimento é gravado no banco local com UUID v7 do cliente e aparece como
  `pendente`
- **E** o saldo local é atualizado na hora, para que a próxima retirada já parta do
  número certo
- **E** ao sincronizar, dois dispositivos que baixaram o mesmo produto **somam** os
  movimentos — o saldo é derivado dos movimentos, nunca enviado como valor absoluto

> Saldo é **sempre** o resultado da soma dos movimentos. Sincronizar "saldo = 1.700"
> perde a escrita do outro aparelho; sincronizar "saída de 300" não perde.

### CA-OP · Cenário de operador

- **Dado** um operador alocado na fazenda A
- **Quando** ele abre a tela de retirada de insumo
- **Então** vê produto, unidade e quantidade disponível
- **E** não recebe custo unitário, custo médio, valor do saldo nem total do estoque —
  o campo não entra na projeção da consulta nem no payload de sync (constitution §6)
- **E** ao tentar consultar estoque da fazenda B, recebe 403

## Regras de negócio

1. O saldo é **derivado dos movimentos**, nunca um campo editável.
2. Tipos de movimento: `purchase_in`, `application_out`, `transfer_in`,
   `transfer_out`, `inventory_adjust`, `loss_out`, `return_in`.
3. Valoração por **custo médio móvel** por fazenda e produto. (A alternativa PEPS fica
   como dúvida 3.)
4. Entrada em estoque **não** é custo de safra; o custo entra na safra na **saída**,
   pela data de competência do uso (constitution §5).
5. Movimento de estoque nunca é apagado; correção é movimento novo de ajuste.
6. Produto tem unidade fixa (kg, L, dose, saco). Conversão entre unidades é explícita e
   registrada.
7. Defensivo guarda lote do fabricante e validade — exigência de rastreabilidade e
   base para a feature `026`.
8. Estoque de sêmen, vacina e hormônio segue as mesmas regras (hoje excluído pela
   feature `004`).
9. Operador nunca recebe valor (constitution §6).

## Fora de escopo

- Reserva de estoque e requisição com aprovação prévia — feature `018`.
- Compra automática por ponto de pedido.
- Estoque de combustível com medição de tanque — ver dúvida 5.
- Estoque de produto acabado (café beneficiado) — feature `019`.
- Código de barras e leitor no barracão — ver dúvida 6.

## Dúvidas abertas

| #   | Dúvida                                                                                                                                         | Para quem | Estado |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ------ |
| 1   | **Bloqueante.** O gestor disse que insumo é comprado por aplicação, sem estoque. Mudou? Existe barracão com sobra guardada hoje? Em quantas fazendas? | produtor  | aberta |
| 2   | Quantos produtos diferentes seriam controlados? Dez ou duzentos? Muda completamente o esforço.                                                 | produtor  | aberta |
| 3   | Custo médio móvel atende, ou o contador precisa de PEPS para o livro caixa?                                                                    | contador  | aberta |
| 4   | Quem faz a contagem física hoje e com que frequência? Existe inventário anual?                                                                 | produtor  | aberta |
| 5   | Combustível entra? Tem tanque próprio na fazenda, com medição?                                                                                 | produtor  | aberta |
| 6   | Vale leitor de código de barras no barracão, ou a digitação da secretária resolve?                                                             | produtor  | aberta |
| 7   | Estoque entrando no escopo, as features `004` e `008` precisam ser corrigidas — elas o excluem hoje. Confirmar a correção.                     | produtor  | aberta |
