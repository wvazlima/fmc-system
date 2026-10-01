# 030 · Adequação a IBS e CBS

|                        |                                                                     |
| ---------------------- | ------------------------------------------------------------------- |
| **Estado**             | rascunho                                                            |
| **Fase**               | Financeiro e Fiscal (a confirmar — ver dúvida 1)                   |
| **Depende de**         | `009-lancamentos-financeiros-duas-datas`, `016`, `029`              |
| **Princípios em jogo** | constitution §4, §5, §11                                            |

---

## Problema

A reforma tributária substitui tributos sobre consumo pelo **IBS** e pela **CBS**, com
uma transição que atravessa vários anos. Para o produtor rural pessoa física, a
pergunta prática é dupla: **ele é contribuinte?** e, se não for, **o comprador perde
crédito ao comprar dele?** A resposta define preço, escolha de comprador e, no limite,
se vale a pena mudar de enquadramento.

O produtor foi explícito no levantamento: *"se adequar as normas IBS e CBS (tributos
para produtor rural que entraram em vigor) — pesquisar essa nova lei dos tributos"*.

Esta spec **não decide tributação**. Isso é do contador, e os parâmetros concretos
estão todos em aberto na tabela de dúvidas. O que ela define é a decisão de projeto que
precisa ser tomada agora, antes de qualquer linha de código fiscal:

> **Nenhuma alíquota, regime, limite de faturamento ou data de vigência pode ficar
> fixa no código.** Tudo é parâmetro com vigência, versionado, alterável sem deploy.

Essa regra não é preciosismo. Uma reforma em transição muda de número e de interpretação
mais de uma vez por ano. Sistema com alíquota no código vira sistema que precisa de
release a cada norma publicada — e o recálculo retroativo fica impossível.

## Usuários e perfis afetados

| Perfil   | O que passa a fazer                                                   | O que **não** pode ver              |
| -------- | --------------------------------------------------------------------- | ----------------------------------- |
| Dono     | Vê a carga tributária estimada e o enquadramento vigente              | —                                   |
| Gerente  | Mantém os parâmetros fiscais sob orientação do contador               | —                                   |
| Operador | Nada — não tem superfície nesta feature                               | Tudo: 403                           |

## Histórias

- Como **gerente**, quero registrar o enquadramento de cada imóvel e sua vigência.
- Como **dono**, quero ver a carga tributária estimada de uma venda antes de fechá-la.
- Como **gerente**, quero que uma mudança de alíquota não exija alteração de código.
- Como **contador**, quero que o livro caixa e a exportação reflitam o regime vigente
  em cada período.

## Critérios de aceite

### CA-01 · Parâmetro fiscal tem vigência

- **Dado** um parâmetro fiscal (alíquota, regime, limite, redutor)
- **Quando** ele é cadastrado
- **Então** carrega data de início e, quando houver, data de fim de vigência
- **E** um lançamento de 2027 é calculado com o parâmetro vigente em 2027, mesmo que o
  cadastro tenha mudado depois
- **E** nenhum parâmetro fiscal existe no código-fonte

### CA-02 · Enquadramento por imóvel e por período

- **Dado** cinco fazendas, possivelmente com enquadramentos diferentes
- **Quando** o enquadramento é registrado
- **Então** ele vale por imóvel e por período, com a inscrição estadual correspondente
  (constitution §3)
- **E** a mudança de enquadramento no meio do ano é suportada, sem reescrever o passado

### CA-03 · Cálculo demonstrado, nunca caixa-preta

- **Dado** uma operação com incidência
- **Quando** o tributo é calculado
- **Então** o sistema mostra base de cálculo, parâmetro aplicado, vigência e resultado
- **E** o cálculo é determinístico e testado (constitution §4)
- **E** o número **nunca** é produzido por IA (constitution §4)

### CA-04 · Crédito do adquirente é informação de venda

- **Dado** uma venda a comprador que apura crédito
- **Quando** a proposta é avaliada (feature `011`)
- **Então** o efeito tributário entra no comparativo quando os parâmetros estiverem
  cadastrados
- **E** enquanto não estiverem, o comparativo declara explicitamente que o efeito
  fiscal **não** está considerado — nunca o omite em silêncio

### CA-05 · Transição com dois regimes convivendo

- **Dado** um período em que tributos antigos e novos coexistem
- **Quando** o período é apurado
- **Então** o sistema calcula os dois conjuntos, identificados separadamente
- **E** o relatório mostra a carga total e a composição por tributo

### CA-06 · Recálculo retroativo é possível e rastreável

- **Dado** uma norma publicada depois do fato, com efeito retroativo
- **Quando** o parâmetro é corrigido com a vigência correta
- **Então** o sistema recalcula o período afetado
- **E** registra o recálculo: parâmetro anterior, novo, quem alterou e quando
- **E** período fiscal já travado (feature `029`) exige retificação formal, não edição

### CA-07 · Reflexo no livro caixa e na exportação contábil

- **Dado** lançamentos com tributo calculado
- **Quando** o livro caixa (feature `029`) e a exportação contábil (feature `015`) são
  gerados
- **Então** os valores refletem o regime vigente no período de cada lançamento
- **E** o de-para contábil distingue as contas dos tributos novos

### CA-OFF · Cenário offline

- **Dado** que o gerente registra uma venda sem conexão
- **Quando** o lançamento é gravado
- **Então** ele é gravado localmente com UUID v7 do cliente e aparece como `pendente`
- **E** o tributo é calculado com os parâmetros **já sincronizados** no aparelho,
  marcado como **estimativa local**
- **E** ao sincronizar, o servidor recalcula com os parâmetros vigentes e o valor
  oficial é o do servidor, com a diferença visível se houver

> Valor fiscal oficial é o do servidor. O cliente estima para não travar o trabalho no
> campo, e diz que está estimando.

### CA-OP · Cenário de operador

- **Dado** um usuário com perfil `operator`
- **Quando** ele tenta acessar qualquer tela ou endpoint desta feature
- **Então** recebe 403
- **E** nenhum valor de tributo entra no payload de sync do dispositivo dele
  (constitution §6)

## Regras de negócio

1. **Nenhum parâmetro fiscal no código.** Alíquota, regime, limite, redutor e data de
   vigência são dados, versionados por período.
2. O cálculo aplica o parâmetro **vigente na data do fato gerador**, não o atual.
3. Enquadramento é por imóvel e por período (constitution §3).
4. Todo cálculo é demonstrável: base, parâmetro, vigência e resultado à vista.
5. Número tributário nunca é produzido por IA (constitution §4).
6. Alteração de parâmetro é auditada: valor anterior, novo, autor, data, motivo.
7. Período travado exige retificação formal (feature `029`).
8. Operador não tem superfície nesta feature (constitution §6).

## Fora de escopo

- Consultoria ou decisão de enquadramento tributário — é do contador.
- Apuração e transmissão de obrigação acessória dos novos tributos.
- Emissão de documento fiscal com os novos campos — Fase Financeiro e Fiscal.
- Planejamento tributário e simulação de mudança de regime — ver dúvida 6.

## Dúvidas abertas

> Esta tabela está integralmente aberta **de propósito**. Nenhum parâmetro tributário
> entra no sistema por pesquisa nossa: entra pela palavra do contador, com a norma
> citada. O levantamento normativo serve para **preparar a conversa**, não para
> substituí-la.

| #   | Dúvida                                                                                                                      | Para quem | Estado |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | --------- | ------ |
| 1   | O produtor é ou será contribuinte de IBS e CBS? Em qual regime, por imóvel?                                                 | contador  | aberta |
| 2   | Levantado: **R$ 3,6 milhões/ano** (LC 214/2025), corrigidos por IPCA — abaixo disso o produtor **não é contribuinte**. Note que é limite **diferente** do LCDPR (R$ 4,8 mi). As fazendas ultrapassam? | contador  | aberta |
| 3   | O comprador aproveita crédito presumido ao comprar do produtor não contribuinte? Isso afeta o preço negociado?               | contador  | aberta |
| 4   | Levantado: 2026 fase de teste (0,9% CBS + 0,1% IBS), 2027 CBS cheia, 2029–2032 transição do ICMS/ISS, 2033 regime pleno. Qual parte se aplica a este produtor, ano a ano? | contador  | aberta |
| 5   | O que muda na venda para cooperativa em relação à venda direta?                                                             | contador  | aberta |
| 6   | Vale avaliar mudança de enquadramento (pessoa física × jurídica)? Isso é decisão do contador, não do sistema.               | contador  | aberta |
| 7   | Que obrigações acessórias novas aparecem, e quem as entrega?                                                                | contador  | aberta |
| 8   | Qual o prazo real? Se há vigência correndo, isso muda a prioridade de toda a fase fiscal.                                   | contador  | aberta |
| 9   | **Diferimento de insumos:** o tributo não é cobrado na compra e é adiado para a etapa seguinte. Para o contribuinte, isso vira tributação na saída **sem crédito**; para o não contribuinte, o valor diferido é **descontado do crédito presumido** repassado ao comprador. Como isso afeta o custo real do insumo aqui? | contador  | aberta |
