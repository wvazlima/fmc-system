# ADR-0008 · Duas datas em todo lançamento financeiro

|               |            |
| ------------- | ---------- |
| **Data**      | 2026-09-29 |
| **Estado**    | aceito     |
| **Substitui** | —          |

## Contexto

O sistema precisa responder a dois mundos com exigências diferentes:

- **Gestão:** qual o custo por saca da safra 26/27? O adubo comprado em outubro e
  aplicado no talhão pertence àquela safra, independentemente de quando foi pago.
- **Fisco:** o produtor rural pessoa física apura pelo **regime de caixa**, e o LCDPR é
  um livro **caixa** por imóvel. O que importa é a data do pagamento.

Um adubo comprado em outubro, pago em três parcelas e aplicado na safra 26/27 tem
**uma** competência e **três** eventos de caixa.

## Decisão

Todo lançamento financeiro tem, obrigatoriamente, duas datas:

| Coluna         | Significado                                                                 | Usada por                                                                         |
| -------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `accrual_date` | Competência: a qual safra, talhão, lote e período o fato econômico pertence | custo por saca, custo por hectare, margem, resultado da safra, painéis gerenciais |
| `cash_date`    | Caixa: quando o dinheiro efetivamente entrou ou saiu                        | livro caixa, LCDPR, fluxo de caixa, conciliação bancária                          |

Regras:

1. Lançamento parcelado gera **um registro de competência** e **N eventos de caixa**
   ligados a ele. `cash_date` do lançamento-pai fica nulo enquanto houver parcela em
   aberto.
2. Nenhum relatório mistura as duas bases. Todo relatório declara, no cabeçalho, se é
   por competência ou por caixa.
3. Quando as duas datas coincidem (pagamento à vista), ainda assim as duas colunas são
   preenchidas. Não existe "a data".

## Alternativas consideradas

### Uma data só, com ajuste no relatório

- **A favor:** modelo mais simples, formulário mais curto.
- **Contra:** é impossível derivar uma da outra. Escolher caixa quebra o custo por
  saca; escolher competência quebra o LCDPR.
- **Por que não:** perde informação que não tem como recuperar depois.

### Duas tabelas separadas (gerencial e fiscal)

- **A favor:** cada mundo com seu modelo.
- **Contra:** o mesmo fato lançado duas vezes, com risco permanente de divergência, e
  conciliação manual entre as duas.
- **Por que não:** um fato, um registro, duas datas.

## Consequências

**Positivas**

- Custo por saca correto e LCDPR correto, do mesmo dado.
- Fluxo de caixa e resultado por safra saem da mesma base, sem retrabalho.
- Parcelamento e conciliação bancária (Fase Financeiro e Fiscal) já têm onde encaixar.

**Negativas e custos aceitos**

- O formulário pede duas datas. Mitigado: por padrão a interface preenche as duas com o
  mesmo valor e só pede a segunda quando o usuário indica parcelamento ou pagamento
  futuro.
- Toda consulta financeira precisa declarar qual data usa. É chato — e é exatamente o
  ponto.

**O que passa a ser proibido**

- Tabela de lançamento com uma única coluna de data.
- Relatório gerencial filtrando por `cash_date`.
- Livro caixa ou LCDPR filtrando por `accrual_date`.
- Relatório sem indicar a base temporal.

## Como verificar que a decisão está sendo respeitada

`.claude/rules/db.md`; template de `plan.md` exige as duas colunas; skills
`dominio-agro` e `integracao-contabil`; agente `dominio-agro` na revisão de regra.
