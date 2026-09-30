# 007 · Café: talhões e safras

|                        |                                                 |
| ---------------------- | ----------------------------------------------- |
| **Estado**             | rascunho                                        |
| **Fase**               | 1                                               |
| **Depende de**         | `001-fundacao-multifazenda`, `002-sync-offline` |
| **Princípios em jogo** | constitution §3, §4, §8, §11                    |

---

## Problema

O café é controlado por talhão e por safra — só que a planilha não sabe o que é um
talhão. Ela tem uma aba por ano, com linhas de despesa e uma coluna de "local"
preenchida por extenso, às vezes "Baixada", às vezes "baixada", às vezes "Talhão da
Baixada".

Consequência: não dá para comparar a mesma área entre safras, nem duas áreas na mesma
safra. E a área em hectares, que é o denominador de quase todo indicador, é um número
digitado que ninguém sabe de onde veio.

Esta feature entrega o **cadastro** — talhão, área, variedade, número de pés, e a safra
como unidade de apuração. Os custos vêm na `008`.

## Usuários e perfis afetados

| Perfil   | O que passa a fazer                                                   | O que **não** pode ver                     |
| -------- | --------------------------------------------------------------------- | ------------------------------------------ |
| Dono     | Vê os talhões, a área em café por fazenda e a comparação entre safras | —                                          |
| Gerente  | Cadastra talhões, abre e fecha safras, registra a colheita            | —                                          |
| Operador | Vê os talhões da fazenda onde atua, para lançar aplicação e colheita  | Custo por hectare, custo por saca, valores |

## Histórias

- Como **gerente**, quero cadastrar cada talhão com nome, área, variedade, ano de
  plantio e número de pés.
- Como **gerente**, quero abrir a safra 26/27 e que os lançamentos caiam nela pela data
  de competência, não pela de pagamento.
- Como **dono**, quero comparar o mesmo talhão entre safras, e talhões diferentes na
  mesma safra.
- Como **gerente**, quero registrar a colheita por talhão, em sacas.

## Critérios de aceite

### CA-01 · Cadastro de talhão

- **Dado** um gerente numa fazenda do seu escopo
- **Quando** cadastra um talhão com nome, variedade, ano de plantio, espaçamento e
  número de pés
- **Então** o talhão é criado com `organization_id`, `farm_id` e UUID v7 do cliente
- **E** o nome é único dentro da fazenda

### CA-02 · Área vem da geometria, não da digitação

- **Dado** um talhão com polígono desenhado (feature `012`)
- **Quando** a área é exibida
- **Então** ela é calculada pelo banco a partir da geometria, em hectares
- **E** não existe campo editável de área quando há geometria
- **E** enquanto não houver geometria, a área pode ser informada manualmente e fica
  **marcada como estimada**

### CA-03 · Safra é de julho a junho

- **Dado** um lançamento com competência em 15/09/2026
- **Quando** ele é atribuído a uma safra
- **Então** cai na safra **26/27**
- **E** um lançamento com competência em 15/05/2026 cai na safra **25/26**

### CA-04 · Atribuição pela competência

- **Dado** adubo comprado em 10/10/2026, pago em três parcelas até 10/01/2027, aplicado
  no talhão em 20/10/2026
- **Quando** o custo é atribuído à safra
- **Então** ele pertence inteiramente à safra **26/27**, pela `accrual_date`
- **E** as três parcelas aparecem no caixa nas suas próprias datas (ADR-0008)

### CA-05 · Colheita por talhão

- **Dado** uma safra aberta
- **Quando** o gerente registra a colheita de um talhão com data, volume em kg e
  percentual de maduros
- **Então** o volume é armazenado em **kg** e apresentado em **sacas de 60 kg**
- **E** vários registros de colheita para o mesmo talhão na mesma safra são somados

### CA-06 · Fechamento da safra

- **Dado** uma safra com toda a colheita registrada
- **Quando** o gerente a fecha
- **Então** o custo por saca passa a ser **definitivo**
- **E** antes do fechamento ele é exibido explicitamente como **projeção**

### CA-07 · Histórico de área

- **Dado** um talhão cuja área mudou no meio da safra (renovação, erradicação)
- **Quando** um custo com competência anterior à mudança é calculado por hectare
- **Então** usa a área **vigente naquela data**, não a atual

### CA-08 · Comparação entre safras

- **Dado** o mesmo talhão com três safras registradas
- **Quando** o dono abre a comparação
- **Então** vê, lado a lado, sacas por hectare, custo por hectare e custo por saca
- **E** safras que contêm dado importado são sinalizadas (constitution §11)

### CA-OFF · Cenário offline

- **Dado** que o gerente está no campo, sem sinal
- **Quando** cadastra um talhão novo e registra uma colheita
- **Então** ambos são gravados localmente, com UUID v7, e confirmados na tela
- **E** a colheita referencia o talhão local, antes de qualquer sincronização
- **E** ao voltar o sinal, o talhão sobe antes da colheita e nada duplica

### CA-OP · Cenário de operador

- **Dado** um operador alocado na fazenda A
- **Quando** ele acessa a tela ou o endpoint de talhões e safras
- **Então** vê nome, área e variedade dos talhões da fazenda A
- **E** não recebe custo por hectare, custo por saca nem qualquer valor
- **E** ao tentar acessar talhão da fazenda B, recebe 403

## Regras de negócio

1. **Talhão** (`plot`): área contínua de cultivo dentro de uma fazenda
   (`specs/glossario.md`).
2. **Safra** (`season`): ano agrícola de **julho a junho**, rotulada `26/27`.
3. Atribuição à safra é pela **`accrual_date`** (ADR-0008).
4. **Área em hectares é derivada da geometria**, nunca digitada, quando há geometria.
   Sem geometria, é estimada e marcada como tal.
5. Volume de café em **kg**; apresentado em **sacas de 60 kg**.
6. **Custo por saca só é definitivo após o fechamento da colheita da safra**; antes
   disso é projeção rotulada (skill `dominio-agro`).
7. Talhão não é excluído: é desativado (soft delete).
8. Talhão com área alterada guarda histórico com vigência.
9. Dado importado carrega `source = 'import'` e é sinalizado nos relatórios
   (constitution §11).

## Fora de escopo

- Geometria e mapa — feature `012`. Aqui é só o cadastro e a área derivada.
- Aplicações, tratos culturais e custos — feature `008`.
- Secagem, tulha, lote de café e rastreabilidade — Fase 2.
- Classificação (bebida, tipo, peneira, defeitos) — Fase 2 e 3.
- Venda e preço líquido — feature `011`.
- Estimativa de safra antes da colheita.

## Dúvidas abertas

| #   | Dúvida                                                                                                     | Para quem | Estado |
| --- | ---------------------------------------------------------------------------------------------------------- | --------- | ------ |
| 1   | Quantos talhões existem, por fazenda? Eles já têm nome consolidado ou cada um chama de um jeito?           | produtor  | aberta |
| 2   | O ano agrícola de julho a junho confere com a prática da fazenda, ou o corte é outro?                      | produtor  | aberta |
| 3   | O café colhido é pesado por talhão, ou vários talhões vão para o mesmo lote no terreiro?                   | produtor  | aberta |
| 4   | Se os talhões se misturam na colheita, como o volume deve ser atribuído — por área, por estimativa, outro? | produtor  | aberta |
| 5   | O volume registrado é café da roça (coco) ou beneficiado? O rendimento precisa ser convertido?             | produtor  | aberta |
| 6   | Há talhão em formação (ainda sem produção)? O custo dele é despesa da safra ou investimento?               | contador  | aberta |
