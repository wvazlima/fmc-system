# 003 · Gado: entrada e lotes

|                        |                                                 |
| ---------------------- | ----------------------------------------------- |
| **Estado**             | rascunho                                        |
| **Fase**               | 1                                               |
| **Depende de**         | `001-fundacao-multifazenda`, `002-sync-offline` |
| **Princípios em jogo** | constitution §3, §5, §6, §8, §11                |

---

## Problema

O gado é tratado como **mercadoria**: compram-se novilhas (vazias ou prenhas),
emprenha-se, vende-se. O giro é de dias a semanas. Na planilha, a compra entra como uma
linha só — "24 novilhas, R$ 76.800" — e a partir daí o animal individual desaparece.

Isso impede três coisas que decidem dinheiro: saber a margem **por cabeça** (e não só
do lote), saber o custo acumulado de um animal que ainda está na fazenda, e comparar
"comprar prenha × emprenhar aqui", porque a novilha comprada vazia não é distinguível
da prenha depois que entrou na planilha.

Esta feature entrega a **entrada**: o lote, os animais, o rateio do preço de compra e a
GTA de entrada.

## Usuários e perfis afetados

| Perfil   | O que passa a fazer                                                 | O que **não** pode ver                           |
| -------- | ------------------------------------------------------------------- | ------------------------------------------------ |
| Dono     | Vê lotes, animais, custo acumulado e composição do lote             | —                                                |
| Gerente  | Registra compra, cria lote, cadastra animais, informa valores e GTA | —                                                |
| Operador | Cadastra animal, brinco, peso e condição; confere o lote no curral  | Preço de compra, custo acumulado, qualquer valor |

## Histórias

- Como **gerente**, quero registrar a compra de um lote com fornecedor, valor total,
  GTA e data, para que o custo nasça no lugar certo.
- Como **gerente**, quero cadastrar os animais do lote com brinco, peso de entrada e
  condição (vazia, prenha, a confirmar), para acompanhar cada um.
- Como **operador**, quero cadastrar os animais no curral, pelo celular, sem sinal e
  sem ver valor nenhum.
- Como **dono**, quero ver quanto já custou cada animal que está na fazenda hoje.

## Critérios de aceite

### CA-01 · Compra de lote

- **Dado** um gerente numa fazenda do seu escopo
- **Quando** ele registra a compra com fornecedor, data de competência, data de caixa,
  valor total, quantidade e número da GTA
- **Então** é criado um `cattle_lot` com `organization_id`, `farm_id` e UUID v7 do
  cliente
- **E** é criado o lançamento financeiro correspondente com **`accrual_date` e
  `cash_date`** (constitution §5)

### CA-02 · Cadastro de animal

- **Dado** um lote criado
- **Quando** um animal é cadastrado com brinco, peso de entrada e condição
  (`open`, `suspected`, `confirmed`)
- **Então** ele fica vinculado ao lote e à fazenda
- **E** o brinco é único entre os animais **ativos** da organização
- **E** um brinco de animal já vendido ou morto pode ser reutilizado, preservando o
  histórico do anterior

### CA-03 · Rateio do preço de compra por cabeça

- **Dado** um lote comprado por R$ 76.800,00 com 24 animais
- **Quando** os 24 animais são cadastrados
- **Então** cada um recebe custo de compra de R$ 3.200,00
- **E** a soma dos 24 é **exatamente** R$ 76.800,00 (a diferença de arredondamento vai
  para a maior parcela)

> Se a compra tiver preço por cabeça diferente (lote misto de vazias e prenhas), o
> preço é informado por animal e o total precisa fechar com o valor da nota.

### CA-04 · Compra por peso

- **Dado** uma compra negociada por arroba
- **Quando** o gerente informa preço por arroba e o peso de cada animal
- **Então** o custo de compra por animal é calculado do peso dele
- **E** o total do lote confere com o valor da nota; divergência acima de R$ 0,01 é
  apontada antes de confirmar

### CA-05 · Custo acumulado

- **Dado** um animal na fazenda
- **Quando** o gerente abre a ficha dele
- **Então** vê o custo acumulado: preço de compra + custos atribuídos + rateio recebido
- **E** vê há quantos dias ele está na fazenda

### CA-06 · GTA obrigatória na entrada

- **Dado** o registro de uma compra
- **Quando** o número ou a data da GTA não é informado
- **Então** o lançamento é aceito, mas marcado como **pendente de GTA** e listado para
  regularização

> A GTA às vezes chega depois do animal. Bloquear a entrada faria o gerente não lançar.

### CA-OFF · Cenário offline

- **Dado** que o operador está no curral, sem sinal
- **Quando** cadastra os 24 animais do lote
- **Então** todos são gravados localmente, com UUID v7, referenciando o lote local
- **E** aparecem como `pendentes`
- **E** ao voltar o sinal, o lote sobe antes dos animais e nada é duplicado

### CA-OP · Cenário de operador

- **Dado** um operador alocado na fazenda A
- **Quando** ele acessa a tela ou o endpoint de lotes e animais
- **Então** não recebe preço de compra, custo acumulado, custo por dia nem qualquer
  valor — nem na API, nem no sync, nem no banco local
- **E** ao tentar acessar um lote da fazenda B, recebe 403

## Regras de negócio

1. **Lote de gado** (`cattle_lot`): conjunto comprado e gerido como unidade
   (`specs/glossario.md`).
2. **Brinco** (`ear_tag`): único entre animais ativos da organização; reutilizável após
   a saída, com histórico preservado.
3. Peso em **kg**. Se a negociação for por arroba, a conversão é explícita e registrada
   (arroba = 15 kg de carcaça — **confirmar com o produtor**, ver dúvida 2).
4. Dinheiro em `numeric(14,2)` no banco e centavos no TypeScript.
5. A compra gera lançamento financeiro com **duas datas** (ADR-0008).
6. Condição de prenhez na entrada: `open`, `suspected`, `confirmed`. Animal comprado
   prenhe tem o valor da prenhez embutido no preço — é o que permite a comparação
   "comprar prenha × emprenhar aqui" (feature `006`).
7. Animal importado do histórico carrega `source = 'import'` e pode ter campo opcional
   faltando (constitution §11).
8. Operador nunca recebe valor (constitution §6).

## Fora de escopo

- Manejo, IATF e diagnóstico de gestação — feature `004`.
- Transferência entre fazendas — feature `005`.
- Venda, margem e giro — feature `006`.
- Rateio de custo compartilhado sobre o gado — feature `010`.
- Controle sanitário e conformidade com o órgão estadual além do registro da GTA.
- Pesagens periódicas e curva de ganho de peso.

## Dúvidas abertas

| #   | Dúvida                                                                                                       | Para quem | Estado |
| --- | ------------------------------------------------------------------------------------------------------------ | --------- | ------ |
| 1   | A compra é normalmente por cabeça ou por arroba? Os dois casos ocorrem no mesmo lote?                        | produtor  | aberta |
| 2   | Qual o rendimento de carcaça usado na conversão peso vivo → arroba?                                          | produtor  | aberta |
| 3   | Todo animal é brincado na entrada, ou há lote que roda sem identificação individual?                         | produtor  | aberta |
| 4   | Quando se compra lote misto (vazias e prenhas), o preço vem separado na nota ou é um valor único?            | produtor  | aberta |
| 5   | Fora novilhas, entram outras categorias (bezerro, garrote, vaca de descarte)? Isso muda o modelo?            | produtor  | aberta |
| 6   | Existe compra parcelada? Se sim, são N eventos de caixa para uma competência (ADR-0008) — confirmar o fluxo. | contador  | aberta |
