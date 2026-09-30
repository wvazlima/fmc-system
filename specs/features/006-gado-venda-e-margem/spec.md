# 006 · Gado: venda e margem

|                        |                              |
| ---------------------- | ---------------------------- |
| **Estado**             | rascunho                     |
| **Fase**               | 1                            |
| **Depende de**         | `003`, `004`, `005`          |
| **Princípios em jogo** | constitution §4, §5, §6, §11 |

---

## Problema

É aqui que o dinheiro aparece — e é aqui que a planilha falha de forma mais cara.

Hoje a venda entra como uma linha de receita. A margem é calculada uma vez por ano,
grosso, dividindo a receita total pelo custo total. Com animais entrando e saindo em
dias ou semanas, isso não diz nada: um lote excelente e um lote ruim se cancelam e o
produtor não sabe qual foi qual.

Três perguntas ficam sem resposta: quanto cada cabeça deu de lucro; quanto custa um dia
de animal parado; e — a mais importante para decidir a próxima compra — **é melhor
comprar novilha prenha ou comprar vazia e emprenhar aqui?**

## Usuários e perfis afetados

| Perfil   | O que passa a fazer                                                 | O que **não** pode ver                       |
| -------- | ------------------------------------------------------------------- | -------------------------------------------- |
| Dono     | Vê margem por cabeça e por lote, giro, custo por dia e a comparação | —                                            |
| Gerente  | Registra a venda com comprador, valor, peso, frete e abatimentos    | —                                            |
| Operador | Registra embarque e pesagem de saída                                | Preço de venda, margem, giro, qualquer valor |

## Histórias

- Como **gerente**, quero registrar a venda informando comprador, preço, peso e as
  deduções, para saber o que de fato entrou.
- Como **dono**, quero ver a margem de cada cabeça e do lote inteiro.
- Como **dono**, quero saber quanto custa manter um animal parado por dia, para decidir
  quando vender.
- Como **dono**, quero comparar "comprar prenha" com "emprenhar aqui" usando os meus
  números, não estimativa.
- Como **gerente**, quero registrar morte ou descarte sem que o custo desapareça.

## Critérios de aceite

### CA-01 · Margem por cabeça

- **Dado** um animal com custo acumulado de R$ 3.437,00
- **Quando** ele é vendido por R$ 5.400,00, com frete de R$ 60,00 e comissão de
  R$ 108,00
- **Então** o preço de venda líquido é R$ 5.232,00
- **E** a margem por cabeça é **R$ 1.795,00**
- **E** o cálculo é feito por consulta determinística, nunca por IA (constitution §4)

### CA-02 · Margem do lote

- **Dado** um lote com 24 animais, todos vendidos
- **Quando** o gerente abre o lote
- **Então** vê a margem do lote como a soma das margens por cabeça
- **E** vê a margem média, a melhor e a pior cabeça

### CA-03 · Giro e custo por dia

- **Dado** um animal que entrou em 12/08 e saiu em 22/09
- **Quando** o dono abre a ficha dele
- **Então** vê giro de **41 dias**
- **E** custo por dia = custo acumulado ÷ 41

### CA-04 · Preço líquido, nunca o bruto sozinho

- **Dado** duas propostas de venda para o mesmo lote
- **Quando** o gerente as compara
- **Então** o sistema apresenta o **líquido** de cada uma (preço − frete − comissão −
  taxa de leilão − quebra de peso)
- **E** o preço bruto nunca é apresentado sozinho

### CA-05 · Comparação "comprar prenha × emprenhar aqui"

- **Dado** histórico suficiente de animais comprados prenhes e de animais emprenhados
  na fazenda
- **Quando** o dono abre a comparação
- **Então** vê, para cada caminho: custo médio total, giro médio, margem média por
  cabeça e taxa de sucesso
- **E** o **custo dos dias a mais** que a novilha emprenhada aqui passa na fazenda está
  incluído — é a parcela que costuma ser esquecida
- **E** se não houver histórico suficiente, o sistema diz isso em vez de mostrar um
  número frágil

### CA-06 · Morte e descarte

- **Dado** um animal que morreu
- **Quando** o gerente registra a saída como morte, com data e motivo
- **Então** o custo acumulado dele vira **perda do lote**
- **E** ele deixa de contar no estoque, mas continua no histórico e no resultado

### CA-07 · Venda parcelada

- **Dado** uma venda paga em três parcelas
- **Quando** o gerente registra
- **Então** há **um** registro de competência (`accrual_date`) e **três** eventos de
  caixa (`cash_date`) (ADR-0008)
- **E** a margem aparece no resultado da competência, independentemente do recebimento

### CA-OFF · Cenário offline

- **Dado** que o operador está no embarque, sem sinal
- **Quando** registra a pesagem de saída dos animais
- **Então** os registros são gravados localmente e confirmados na tela
- **E** ao voltar o sinal, sincronizam sem duplicar
- **E** a venda registrada depois pelo gerente usa esses pesos

### CA-OP · Cenário de operador

- **Dado** um operador alocado na fazenda A
- **Quando** ele acessa a tela ou o endpoint de venda
- **Então** registra embarque e peso, sem receber preço, margem, giro ou custo por dia
- **E** o payload de sync não contém nenhum desses campos
- **E** ao tentar acessar venda da fazenda B, recebe 403

## Regras de negócio

1. `margem_por_cabeça = preço_venda_líquido − custo_acumulado` (skill `dominio-agro`).
2. `preço_venda_líquido` já desconta frete, comissão, taxa de leilão e **quebra de
   peso**.
3. `custo_acumulado = preço_compra + custos_atribuídos + rateio_recebido`, somando
   **desde a compra**, atravessando transferências (feature `005`).
4. `giro_dias = data_saída − data_entrada`; `custo_por_dia = custo_acumulado ÷ dias`.
5. Morte ou descarte: o custo vira **perda do lote**, não desaparece.
6. Toda venda gera lançamento com **duas datas**; parcelamento é 1 competência para N
   caixas (ADR-0008).
7. **O preço bruto nunca é apresentado sozinho** (skill `dominio-agro`).
8. Animal vendido libera o brinco para reutilização, preservando o histórico.
9. Todo cálculo é determinístico e testado com número conferido à mão
   (constitution §4).
10. Operador nunca recebe valor (constitution §6).

## Fora de escopo

- Contrato de venda com acompanhamento de entrega — Fase Financeiro e Fiscal.
- Emissão de nota fiscal de venda — Fase Financeiro e Fiscal.
- Cotação de mercado e preço de referência (CEPEA depende de licença — constitution
  §10).
- Projeção de margem futura e simulação de cenário — Fase 2.
- Rateio de custo compartilhado sobre o gado — feature `010`, que alimenta o
  `custo_acumulado`.

## Dúvidas abertas

| #   | Dúvida                                                                                                    | Para quem | Estado |
| --- | --------------------------------------------------------------------------------------------------------- | --------- | ------ |
| 1   | A venda é por cabeça ou por arroba? Quais deduções aparecem na nota (comissão, taxa de leilão, Funrural)? | produtor  | aberta |
| 2   | A quebra de peso é medida (pesagem nas duas pontas) ou estimada por percentual?                           | produtor  | aberta |
| 3   | Quanto histórico existe para a comparação "prenha × emprenhar aqui"? Quantos lotes de cada tipo?          | produtor  | aberta |
| 4   | Funrural e outros encargos sobre a venda entram na margem gerencial ou só no fiscal?                      | contador  | aberta |
| 5   | Morte de animal tem tratamento fiscal específico (baixa por perda)?                                       | contador  | aberta |
| 6   | Venda parcelada é comum? Há juros embutidos que precisam ser separados do preço?                          | produtor  | aberta |
