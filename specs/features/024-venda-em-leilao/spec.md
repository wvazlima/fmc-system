# 024 · Leilão: venda de lote em pregão

|                        |                                                                       |
| ---------------------- | --------------------------------------------------------------------- |
| **Estado**             | rascunho                                                              |
| **Fase**               | 1                                                                     |
| **Depende de**         | `006-gado-venda-e-margem`, `011-vendas-logistica-preco-liquido`, `016` |
| **Princípios em jogo** | constitution §4, §5, §6                                               |

---

## Problema

Vender no leilão não é vender direto com outro nome. O dinheiro não chega inteiro nem
de uma vez: sai comissão do leiloeiro, taxa de pista, frete até o recinto, GTA e
Funrural — e o pagamento costuma vir parcelado, 30/60/90 dias, às vezes com carta de
garantia.

O preço do martelo, aquele que todo mundo comenta na saída, é o número que menos
importa. Entre ele e o que entra na conta há uma distância que hoje só aparece semanas
depois, quando o extrato do leiloeiro chega.

E há um efeito pior: como o recebimento é parcelado, a venda e o caixa ficam em meses
diferentes. Sem as duas datas separadas (ADR-0008), o mês fecha errado nos dois lados.

A feature `011` já compara leilão com venda direta pelo líquido. Esta aqui trata o
leilão como o que ele é: **um evento, com data, lote ofertado, deduções próprias e
recebimento em parcelas.**

## Usuários e perfis afetados

| Perfil   | O que passa a fazer                                                       | O que **não** pode ver                   |
| -------- | ------------------------------------------------------------------------- | ---------------------------------------- |
| Dono     | Vê o líquido do pregão e compara com o que teria sido a venda direta      | —                                        |
| Gerente  | Cadastra o pregão, o lote ofertado, as deduções e concilia o extrato      | —                                        |
| Operador | Registra o embarque dos animais e a pesagem de saída                      | Martelo, comissão, líquido, parcelas     |

## Histórias

- Como **gerente**, quero cadastrar o pregão com a casa de leilão, data e o lote
  ofertado.
- Como **gerente**, quero lançar o preço de martelo e todas as deduções e ver o líquido.
- Como **dono**, quero saber quanto entra e **quando** entra, parcela a parcela.
- Como **gerente**, quero conferir o extrato do leiloeiro contra o que lancei.
- Como **dono**, quero comparar, no fim, se o leilão pagou mais que a proposta direta
  que eu recusei.

## Critérios de aceite

### CA-01 · Líquido do pregão

- **Dado** um lote de 40 novilhas arrematado a R$ 4.200,00 por cabeça (martelo
  R$ 168.000,00), comissão do leiloeiro de 2% (R$ 3.360,00), frete de R$ 2.800,00, GTA
  de R$ 60,00 e Funrural à alíquota configurada de 1,63% (R$ 2.738,40)
- **Quando** o líquido é apurado
- **Então** ele é **R$ 159.041,60**, ou **R$ 3.976,04 por cabeça**
- **E** cada dedução é um lançamento vinculado, discriminado — nenhuma some dentro do
  líquido (mesma regra da feature `011`)
- **E** o cálculo é determinístico e testado (constitution §4)

### CA-02 · Recebimento parcelado com duas datas

- **Dado** uma venda em leilão recebida em três parcelas, a 30, 60 e 90 dias
- **Quando** a venda é efetivada
- **Então** existe **uma** competência, na data do pregão, e **três** eventos de caixa,
  nas datas previstas (ADR-0008)
- **E** o resultado do mês do pregão reconhece a venda inteira
- **E** o fluxo de caixa reconhece cada parcela no seu mês

### CA-03 · Parcela atrasada é visível

- **Dado** uma parcela vencida e não recebida
- **Quando** o gerente abre a posição do pregão
- **Então** a parcela aparece como **em atraso**, com dias de atraso e valor
- **E** a venda não é considerada liquidada enquanto houver parcela aberta

### CA-04 · Margem por cabeça vai até o líquido

- **Dado** animais com custo acumulado desde a compra, inclusive transferências entre
  fazendas (feature `005`)
- **Quando** o lote é arrematado
- **Então** a margem por cabeça usa o **líquido rateado por animal**, não o martelo
- **E** o rateio das deduções entre os animais do lote é proporcional ao peso quando a
  venda é por arroba, e por cabeça quando a venda é por cabeça

### CA-05 · Quebra de peso do recinto

- **Dado** pesagem na fazenda e pesagem no recinto do leilão
- **Quando** as duas existem
- **Então** a quebra de peso é a **medida**, não a estimada (feature `011`)
- **E** quando só há uma pesagem, o percentual configurado é usado e marcado como
  estimativa

### CA-06 · Conciliação do extrato do leiloeiro

- **Dado** o extrato enviado pela casa de leilão
- **Quando** o gerente o registra
- **Então** o sistema compara linha a linha com as deduções lançadas
- **E** destaca diferença de comissão, taxa ou valor de martelo
- **E** a divergência fica aberta até ser resolvida, bloqueando o fechamento do pregão

### CA-07 · Lote não arrematado volta para o rebanho

- **Dado** um lote ofertado que não foi vendido
- **Quando** o pregão é fechado
- **Então** os animais voltam ao rebanho da fazenda de origem
- **E** o frete de ida e volta e a diária do recinto entram como **custo do lote**,
  sem venda correspondente
- **E** o custo acumulado por cabeça é atualizado

### CA-OFF · Cenário offline

- **Dado** que o gerente está no recinto do leilão, com sinal ruim
- **Quando** registra o resultado do pregão e as deduções
- **Então** o registro é gravado localmente com UUID v7 do cliente e aparece como
  `pendente`
- **E** o líquido é calculado localmente e aparece na hora
- **E** ao sincronizar, a venda não duplica, mesmo que o envio tenha sido repetido
  (constitution §2)

### CA-OP · Cenário de operador

- **Dado** um operador alocado na fazenda A
- **Quando** ele registra o embarque e a pesagem de saída dos animais
- **Então** informa quantidade, identificação e peso
- **E** não recebe preço de martelo, comissão, líquido nem as parcelas — os campos não
  entram na projeção nem no sync (constitution §6)
- **E** ao tentar acessar pregão de lote da fazenda B, recebe 403

## Regras de negócio

1. O pregão é um evento com casa de leilão (contraparte, feature `016`), data, local e
   lote ofertado.
2. Deduções típicas: comissão do leiloeiro, taxa de pista ou de recinto, frete, GTA,
   quebra de peso e Funrural quando devido.
3. `líquido = martelo − deduções` (feature `011`); o martelo nunca é apresentado
   sozinho.
4. Uma competência na data do pregão, um evento de caixa por parcela (constitution §5).
5. A margem por cabeça usa o líquido rateado, nunca o bruto.
6. Alíquotas e percentuais (Funrural, comissão padrão, quebra estimada) são
   **configurados e versionados**, nunca fixos no código. A alíquota do Funrural mudou
   em abril de 2026 (LC 224/2025) — é exatamente o caso que justifica a regra.
7. Funrural retido na fonte pela casa de leilão (sub-rogação) é **dedução do líquido**,
   não imposto a pagar pelo produtor.
8. Lote não arrematado gera custo sem receita, apropriado ao lote.
9. Operador nunca recebe valor (constitution §6).

## Fora de escopo

- Integração com sistema da casa de leilão ou importação automática do extrato.
- Leilão de compra (arrematar animais em pregão) — ver dúvida 5.
- Antecipação de recebível e desconto de parcela — feature `031`.
- Emissão da nota de venda — Fase Financeiro e Fiscal.

## Dúvidas abertas

| #   | Dúvida                                                                                                              | Para quem | Estado |
| --- | --------------------------------------------------------------------------------------------------------------------- | --------- | ------ |
| 1   | Quantas vendas por leilão acontecem por ano? Qual a participação sobre o total vendido?                             | produtor  | aberta |
| 2   | Quais as deduções reais do extrato do leiloeiro? Precisamos de um extrato de verdade para fechar a lista.           | produtor  | aberta |
| 3   | Qual o parcelamento praticado? Existe carta de garantia ou risco de calote assumido pela casa?                      | produtor  | aberta |
| 4   | A pesagem no recinto é informada em documento? Dá para registrar as duas pontas?                                    | produtor  | aberta |
| 5   | Compra-se gado em leilão também? Se sim, a entrada (feature `003`) precisa do mesmo tratamento.                     | produtor  | aberta |
| 6   | Levantado: desde abril/2026 a alíquota é **1,63%** (PF não segurado especial, LC 224/2025) e **a casa de leilão retém por sub-rogação**. Confirmar o enquadramento do produtor e a base aplicada. | contador  | aberta |
| 7   | A venda em leilão tem tratamento próprio no livro caixa e no LCDPR?                                                 | contador  | aberta |
