# 008 · Café: aplicações e custos

|                        |                                     |
| ---------------------- | ----------------------------------- |
| **Estado**             | rascunho                            |
| **Fase**               | 1                                   |
| **Depende de**         | `007-cafe-talhoes-e-safras`         |
| **Princípios em jogo** | constitution §1, §4, §5, §6, §7, §8 |

---

## Problema

A pergunta que abriu este projeto: **quanto custou cada saca de café?**

Hoje ela não tem resposta. Adubação, foliar, herbicida, defensivo e mão de obra ficam
espalhados em abas diferentes, em datas de pagamento, sem ligação com o talhão onde
foram aplicados. No fim da safra, o produtor sabe quanto gastou no total e quantas
sacas colheu no total — e divide. O número resultante esconde que um talhão custou
R$ 380 a saca e outro custou R$ 620.

Sem custo por talhão, não há decisão de manejo baseada em dinheiro: renovar, erradicar,
mudar adubação, tudo vira intuição.

## Usuários e perfis afetados

| Perfil   | O que passa a fazer                                                    | O que **não** pode ver                       |
| -------- | ---------------------------------------------------------------------- | -------------------------------------------- |
| Dono     | Vê custo por hectare, custo por saca e gasto por categoria, por talhão | —                                            |
| Gerente  | Registra aplicações com produto, dose, área e custo; confere a fila    | —                                            |
| Operador | Registra o que aplicou no talhão, com foto, no campo                   | Custo do insumo, custo por hectare, por saca |

## Histórias

- Como **operador**, quero registrar a aplicação que fiz no talhão, pelo celular, sem
  sinal, em poucos toques.
- Como **gerente**, quero que o custo do insumo caia no talhão certo, na safra certa,
  pela data de competência.
- Como **dono**, quero ver o custo por saca de cada talhão e o gasto por categoria.
- Como **dono**, quero comparar o gasto com foliar desta safra com o da anterior.

## Critérios de aceite

### CA-01 · Registro de aplicação

- **Dado** um talhão numa safra aberta
- **Quando** é registrada uma aplicação com data, categoria, produto, dose por hectare,
  área aplicada e responsável
- **Então** o evento é gravado como **append-only**
- **E** o custo é atribuído ao talhão, na safra da `accrual_date`

### CA-02 · Aplicação em vários talhões

- **Dado** uma aplicação feita em três talhões no mesmo dia, com uma nota única de
  insumo
- **Quando** o gerente registra
- **Então** o custo é rateado **pela área aplicada** em cada talhão
- **E** a soma é exatamente o valor da nota

### CA-03 · Custo por hectare

- **Dado** um talhão de 12 ha com R$ 170.400,00 de custo na safra
- **Quando** o dono abre o talhão
- **Então** vê custo por hectare de **R$ 14.200,00**
- **E** o cálculo é uma consulta determinística (constitution §4)

### CA-04 · Custo por saca

- **Dado** o mesmo talhão, com 384 sacas colhidas na safra fechada
- **Quando** o dono abre o talhão
- **Então** vê custo por saca de **R$ 443,75**
- **E** vê produtividade de **32 sacas por hectare**

### CA-05 · Projeção antes do fechamento

- **Dado** uma safra ainda aberta
- **Quando** o custo por saca é exibido
- **Então** ele aparece explicitamente rotulado como **projeção**
- **E** o rótulo some quando a safra é fechada

### CA-06 · Gasto por categoria

- **Dado** uma safra com aplicações de várias categorias
- **Quando** o dono abre o painel do talhão ou da fazenda
- **Então** vê o gasto agrupado por adubação, foliar, herbicida, defensivo e mão de obra
- **E** a soma das categorias é o custo direto total

### CA-07 · Mão de obra

- **Dado** uma operação com mão de obra apontada por horas
- **Quando** o custo é atribuído
- **Então** entra na categoria mão de obra do talhão
- **E** quando a mão de obra é de funcionário fixo, o valor vem do **rateio** da feature
  `010`, não de lançamento direto

### CA-08 · Correção é estorno

- **Dado** uma aplicação registrada com valor errado
- **Quando** o gerente corrige
- **Então** é criado um evento de estorno e um evento novo; o original permanece no
  histórico

### CA-OFF · Cenário offline

- **Dado** que o operador está no meio do cafezal, sem sinal
- **Quando** registra a aplicação, escolhendo o talhão e a categoria, e anexa uma foto
- **Então** o registro e a foto são gravados localmente e confirmados na tela na hora
- **E** a foto entra na outbox como item próprio, comprimida
- **E** ao voltar o sinal, tudo sincroniza sem duplicar

### CA-OP · Cenário de operador

- **Dado** um operador alocado na fazenda A
- **Quando** ele registra e consulta aplicações
- **Então** informa produto, dose e área, mas **nunca** valor
- **E** não recebe custo do insumo, custo por hectare nem custo por saca — nem na API,
  nem no sync, nem no banco local
- **E** ao tentar acessar talhão da fazenda B, recebe 403

## Regras de negócio

1. `custo_por_hectare = custo_total_do_talhão_na_safra ÷ área_ha`
   (skill `dominio-agro`).
2. `custo_por_saca = custo_total_do_talhão_na_safra ÷ sacas_colhidas`.
3. `custo_total_do_talhão_na_safra` = custos **diretos** + parcela de custo
   compartilhado rateada até ele (feature `010`).
4. Categorias: `fertilization`, `foliar`, `herbicide`, `pesticide`, mão de obra
   (`specs/glossario.md`).
5. Aplicação em vários talhões é rateada **pela área aplicada**; a soma fecha com o
   valor da nota.
6. Atribuição à safra pela **`accrual_date`**; lançamento tem duas datas (ADR-0008).
7. Aplicação é **append-only**; correção é estorno.
8. Custo por saca antes do fechamento é **projeção rotulada**.
9. O sistema **registra** o que foi aplicado; **não recomenda** produto nem dose
   (constitution §7).
10. Operador nunca recebe valor (constitution §6).

## Fora de escopo

- Recomendação de produto ou dose — proibido (constitution §7).
- Receituário agronômico e obrigações do MAPA.
- Estoque de insumos com saldo em tempo real.
- Análise de solo e recomendação de adubação.
- Alerta de custo fora da curva — Fase 2, com o assistente.
- Rateio de custo compartilhado — feature `010`.

## Dúvidas abertas

| #   | Dúvida                                                                                                     | Para quem | Estado |
| --- | ---------------------------------------------------------------------------------------------------------- | --------- | ------ |
| 1   | As categorias (adubação, foliar, herbicida, defensivo, mão de obra) cobrem tudo, ou falta alguma?          | produtor  | aberta |
| 2   | Quando se compra insumo em quantidade e aplica ao longo de meses, o custo entra na compra ou na aplicação? | contador  | aberta |
| 3   | A mão de obra de safrista na colheita é por dia, por saca ou por hora?                                     | produtor  | aberta |
| 4   | O operador sabe o produto e a dose exatos, ou registra "adubação" genérica e o gerente detalha depois?     | produtor  | aberta |
| 5   | Há aplicação aérea ou terceirizada com nota de serviço separada do insumo?                                 | produtor  | aberta |
| 6   | Custo de calcário e de renovação é despesa da safra ou investimento amortizado?                            | contador  | aberta |
