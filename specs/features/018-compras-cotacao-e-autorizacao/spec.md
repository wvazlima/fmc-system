# 018 · Compras: cotação, autorização e liberação

|                        |                                                                       |
| ---------------------- | --------------------------------------------------------------------- |
| **Estado**             | rascunho                                                              |
| **Fase**               | Financeiro e Fiscal (a confirmar — ver dúvida 1)                      |
| **Depende de**         | `016-cadastro-contrapartes`, `017-estoque-de-insumos`, `009`          |
| **Princípios em jogo** | constitution §3, §4, §5, §6                                           |

---

## Problema

Hoje a compra acontece no telefone. O gerente liga para dois ou três revendedores,
anota os preços num papel, decide e manda comprar. O que fica registrado é a nota, no
fim do processo — a cotação que justificou a escolha não existe em lugar nenhum.

Três consequências:

1. **Ninguém consegue conferir a decisão depois.** Comprou daquele fornecedor porque
   era o mais barato, ou porque é sempre dele que se compra? Não há como saber.
2. **Não existe alçada.** Qualquer compra sai do mesmo jeito, seja de R$ 300 ou de
   R$ 80.000. O dono só descobre o valor quando a nota chega.
3. **Sem histórico de cotação, a feature `027` não tem o que auditar.** Comparar o
   preço pago com o preço de mercado exige que os preços recusados também tenham sido
   guardados.

O pedido do produtor foi explícito: autorização, cotação e liberação — as três etapas,
nessa ordem.

## Usuários e perfis afetados

| Perfil   | O que passa a fazer                                                  | O que **não** pode ver                 |
| -------- | -------------------------------------------------------------------- | -------------------------------------- |
| Dono     | Aprova compra acima da alçada; vê o comparativo das cotações         | —                                      |
| Gerente  | Abre a requisição, registra cotações, escolhe e libera               | —                                      |
| Operador | Pede o produto que faltou (requisição sem preço)                     | Preço, cotação, alçada, valor aprovado |

## Histórias

- Como **operador**, quero pedir o produto que acabou, para que alguém compre.
- Como **gerente**, quero registrar as cotações recebidas e escolher uma, deixando
  registrado o porquê quando não escolho a mais barata.
- Como **dono**, quero aprovar pessoalmente as compras acima de um valor.
- Como **dono**, quero ver, no fim do mês, quanto foi comprado fora da cotação.

## Critérios de aceite

### CA-01 · Ciclo completo e estados

- **Dado** uma necessidade de compra
- **Quando** o processo roda
- **Então** ele passa pelos estados `requested` → `quoting` → `pending_approval` →
  `approved` → `ordered` → `received` → `closed`
- **E** cada transição grava quem fez, quando e a partir de qual estado
- **E** `rejected` e `cancelled` são estados finais, com justificativa obrigatória

### CA-02 · Alçada por valor

- **Dado** uma alçada configurada em R$ 10.000,00 para o gerente
- **Quando** uma compra de R$ 12.400,00 é escolhida
- **Então** ela vai para `pending_approval` e **não** pode ser pedida ao fornecedor
- **E** só o dono pode aprová-la
- **E** uma compra de R$ 9.800,00 do mesmo gerente segue direto para `approved`

### CA-03 · Quebra de compra para fugir da alçada é detectada

- **Dado** duas compras do mesmo produto, mesmo fornecedor e mesma fazenda, somando
  acima da alçada, dentro de 7 dias
- **Quando** a segunda é liberada
- **Então** o sistema sinaliza a ocorrência e exige aprovação do dono
- **E** o caso é registrado para a feature `027`

### CA-04 · Comparativo de cotações

- **Dado** três cotações para o mesmo item: R$ 3,70/kg com frete por conta do
  comprador a R$ 0,18/kg; R$ 3,80/kg posto na fazenda; R$ 3,65/kg a 30 dias
- **Quando** o gerente abre o comparativo
- **Então** vê o preço **posto na fazenda** de cada uma, com frete e prazo
  considerados, ordenado do menor para o maior
- **E** o preço de tabela nunca aparece sozinho, pelo mesmo motivo da feature `011`

### CA-05 · Escolher a mais cara exige justificativa

- **Dado** um comparativo em que a escolhida não é a de menor preço posto
- **Quando** o gerente a seleciona
- **Então** o sistema exige justificativa textual para prosseguir
- **E** a justificativa fica no histórico da compra, visível ao dono

### CA-06 · Compra sem cotação é exceção registrada

- **Dado** uma compra urgente com uma única cotação
- **Quando** o gerente a libera
- **Então** ela é marcada como `single_quote` com motivo
- **E** o relatório mensal mostra quantas compras do período foram sem concorrência

### CA-07 · Recebimento, estoque e divergência

- **Dado** um pedido aprovado de 2.000 kg a R$ 3,70
- **Quando** chegam 1.950 kg
- **Então** o gerente registra o recebimento parcial
- **E** a entrada em estoque é de 1.950 kg (feature `017`)
- **E** a divergência de 50 kg fica aberta até ser resolvida como devolução, perda ou
  correção de pedido

### CA-08 · Casamento com a nota fiscal

- **Dado** um pedido recebido e um XML de NF-e importado (feature `014`)
- **Quando** a nota é processada
- **Então** o sistema propõe o casamento por fornecedor, valor e data
- **E** diferença entre o preço do pedido e o da nota é destacada antes do aceite

### CA-OFF · Cenário offline

- **Dado** que o gerente está na fazenda, sem sinal, e recebeu uma cotação por telefone
- **Quando** registra a cotação
- **Então** ela é gravada no banco local com UUID v7 do cliente e aparece como
  `pendente`
- **E** o comparativo é calculado localmente, com as cotações que o aparelho já tem
- **E** **aprovação exige conexão**: a transição para `approved` é confirmada pelo
  servidor, nunca aplicada só no dispositivo

> Aprovar é ato de autoridade e precisa de identidade verificada no servidor. Esta é
> uma exceção consciente à constitution §1, limitada às transições de aprovação.

### CA-OP · Cenário de operador

- **Dado** um operador alocado na fazenda A
- **Quando** ele abre uma requisição de compra
- **Então** informa produto, quantidade e urgência, sem nenhum campo de preço
- **E** não recebe cotação, valor, alçada nem o estado financeiro da compra — os campos
  não entram na projeção nem no sync (constitution §6)
- **E** ao tentar abrir requisição na fazenda B, recebe 403

## Regras de negócio

1. Requisição pode nascer de qualquer perfil; cotação e liberação, não.
2. A alçada é configurada por organização, por perfil e por fazenda, e é versionada:
   mudar a alçada não reescreve o histórico de aprovações.
3. Quem aprova não pode ser quem registrou a cotação escolhida — segregação de função.
   (Se o grupo for pequeno demais para isso, ver dúvida 3.)
4. A comparação usa **preço posto na fazenda**: preço + frete + impostos recuperáveis
   quando houver, ajustado pelo prazo (skill `dominio-agro`).
5. Toda cotação recusada é guardada, com fornecedor, preço e data — é insumo da `027`.
6. Compra aprovada gera lançamento financeiro com duas datas na efetivação (ADR-0008),
   não na aprovação.
7. Recebimento alimenta o estoque (feature `017`); pedido sem recebimento não vira
   custo.
8. Operador nunca recebe valor (constitution §6).

## Fora de escopo

- Cotação eletrônica enviada ao fornecedor por e-mail ou portal.
- Integração com marketplace agro ou tabela de preço de revenda.
- Contrato de fornecimento com preço travado por safra — ver dúvida 6.
- Pagamento e programação financeira do pedido — feature `031`.
- Auditoria de privilégio e simulação de compra — feature `027`.

## Dúvidas abertas

| #   | Dúvida                                                                                                                  | Para quem | Estado |
| --- | ------------------------------------------------------------------------------------------------------------------------- | --------- | ------ |
| 1   | Isso é para a Fase 1 ou pode esperar? O roadmap põe compras na fase Financeiro e Fiscal.                                 | produtor  | aberta |
| 2   | Qual o valor da alçada hoje, na prática? Existe um limite informal a partir do qual o dono é consultado?                 | produtor  | aberta |
| 3   | Quem pode aprovar? Só o dono, ou o gerente também, até certo valor? Dá para separar quem cota de quem aprova?            | produtor  | aberta |
| 4   | Quantas compras por mês, aproximadamente? E quantas delas são realmente cotadas hoje?                                   | produtor  | aberta |
| 5   | A urgência do campo (quebrou, precisa hoje) justifica um caminho rápido sem cotação? Com que limite?                     | produtor  | aberta |
| 6   | Existe compra programada por safra, com preço travado em barter (troca por café ou boi)? Isso muda bastante o modelo.    | produtor  | aberta |
| 7   | Insumo comprado em barter tem tratamento fiscal diferente no livro caixa?                                                | contador  | aberta |
| 8   | O **diferimento de IBS/CBS nos insumos** (LC 214/2025) muda o custo de aquisição e o caixa da compra. O comparativo de "preço posto na fazenda" precisa considerá-lo? Ver `specs/levantamento/2026-09-30-pesquisa-normativa.md`. | contador  | aberta |
