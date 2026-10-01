# 023 · Cotações de mercado: saca, arroba e câmbio

|                        |                                                                     |
| ---------------------- | ------------------------------------------------------------------- |
| **Estado**             | rascunho                                                            |
| **Fase**               | 2                                                                   |
| **Depende de**         | `011-vendas-logistica-preco-liquido`, `016-cadastro-contrapartes`   |
| **Princípios em jogo** | constitution §4, §6, §7, §9, §10                                    |

---

## Problema

O preço que o comprador oferece só significa alguma coisa comparado a alguma
referência. Hoje essa referência está na cabeça do produtor, no grupo de WhatsApp e no
que o vizinho comentou. Quando a proposta chega, não há com o que comparar — e a
decisão vira intuição.

O pedido foi direto: vincular a cotação da saca ao mercado internacional e a cotação
da arroba ao gado, de abate e leiteiro.

Tecnicamente é simples. **Juridicamente não é.** Cotação de bolsa e indicador de
instituição são dado licenciado: o uso comercial e a redistribuição dentro de um
sistema são cobrados, e a constitution §10 é explícita — *CEPEA só com licença
contratada; sem licença, o dado não entra*. O mesmo vale para a bolsa de Nova York.

Esta feature resolve as duas pontas: a estrutura de preço de referência, que funciona
desde já com cadastro manual, e o conector de fonte externa, que só liga quando houver
licença assinada.

## Usuários e perfis afetados

| Perfil   | O que passa a fazer                                                     | O que **não** pode ver         |
| -------- | ----------------------------------------------------------------------- | ------------------------------ |
| Dono     | Compara a proposta recebida com a referência de mercado                 | —                              |
| Gerente  | Cadastra a referência manual quando não há fonte licenciada             | —                              |
| Operador | Nada — esta feature é inteiramente financeira                           | Tudo: 403 em toda a superfície |

## Histórias

- Como **dono**, quero ver a proposta recebida ao lado da referência de mercado do dia.
- Como **dono**, quero a cotação de Nova York já convertida para reais por saca.
- Como **gerente**, quero cadastrar a referência manualmente enquanto não há licença.
- Como **dono**, quero a série histórica para saber se o preço de hoje é alto ou baixo
  para a época do ano.

## Critérios de aceite

### CA-01 · Série de preço com fonte identificada

- **Dado** qualquer preço de referência no sistema
- **Quando** ele é apresentado
- **Então** aparece sempre com **fonte**, **data/hora da coleta** e **tipo**
  (`manual`, `licensed_feed`, `counterparty`)
- **E** não existe nenhuma tela que mostre preço de referência sem a origem

### CA-02 · Funciona sem licença nenhuma

- **Dado** que nenhuma fonte licenciada está contratada
- **Quando** o gerente cadastra manualmente a referência da saca e da arroba
- **Então** todas as telas que usam referência funcionam normalmente, marcadas como
  `manual`
- **E** nenhuma cotação de terceiro é exibida, armazenada ou redistribuída
  (constitution §10)

### CA-03 · Conversão de Nova York para reais por saca

- **Dado** uma cotação de **320,00 US¢/lb** e câmbio de **R$ 5,40**
- **Quando** a conversão é calculada
- **Então** o equivalente é **US$ 423,29 por saca** de 60 kg (132,2774 lb) e
  **R$ 2.285,75 por saca**, antes do diferencial
- **E** o diferencial de praça e qualidade é uma premissa **cadastrada**, nunca
  inventada pelo sistema
- **E** o cálculo é determinístico e testado (constitution §4)

### CA-04 · Arroba de abate e descarte do leiteiro

- **Dado** referências separadas para boi gordo de abate e para vaca de descarte
- **Quando** o dono compara uma proposta de venda de gado
- **Então** o sistema usa a referência do tipo correspondente ao lote
- **E** se não houver referência cadastrada para aquele tipo, apresenta a ausência
  explicitamente, em vez de usar a do outro tipo

### CA-05 · Conector licenciado é desligável e auditável

- **Dado** uma fonte licenciada configurada
- **Quando** a licença vence ou é removida
- **Então** o conector para de coletar e as séries daquela fonte deixam de ser exibidas
- **E** fica registrado quem habilitou a fonte, quando, e sob qual contrato
- **E** os dados ficam no Cloud SQL, nunca em KV, D1 ou cache da borda
  (constitution §9)

### CA-06 · Referência nunca vira preço do lançamento

- **Dado** uma venda sendo registrada
- **Quando** o gerente informa o preço
- **Então** o preço do lançamento é o **negociado**, digitado
- **E** a referência de mercado aparece ao lado apenas como comparação, nunca
  preenchendo o campo automaticamente

### CA-07 · O sistema não aconselha

- **Dado** uma referência acima ou abaixo da proposta
- **Quando** o fato é apresentado
- **Então** o sistema mostra a diferença em reais e em percentual, sem recomendar
  aceitar, recusar ou esperar (constitution §7)

### CA-OFF · Cenário offline

- **Dado** que o dono está sem conexão avaliando uma proposta
- **Quando** abre a comparação
- **Então** vê a **última referência sincronizada**, com a data e hora da coleta em
  destaque
- **E** a tela deixa claro que o dado pode estar desatualizado, sem bloquear a decisão
- **E** a referência cadastrada manualmente offline grava com UUID v7 do cliente e
  sincroniza depois, sem duplicar

### CA-OP · Cenário de operador

- **Dado** um usuário com perfil `operator`
- **Quando** ele tenta acessar qualquer tela ou endpoint de cotação
- **Então** recebe 403
- **E** nenhuma série de preço entra no payload de sync do dispositivo dele
  (constitution §6)

## Regras de negócio

1. Toda cotação é um ponto de série: produto, tipo, praça, unidade, valor, moeda,
   data/hora e fonte.
2. Fonte tem estado de licença. Sem licença ativa, a série não é coletada nem exibida
   (constitution §10).
3. Conversão de arábica: `US$/saca = US¢/lb × 132,2774 ÷ 100`; depois câmbio; depois o
   diferencial cadastrado.
4. Câmbio é uma série própria, com a mesma exigência de fonte e licença. A API PTAX do
   Banco Central (ODbL) atende sem custo, com atribuição — ver
   `specs/levantamento/2026-09-30-pesquisa-normativa.md`.
5. Referência **nunca** preenche automaticamente o preço de um lançamento.
6. Preço de contraparte (o que um comprador ofereceu) é série do tipo `counterparty` e
   pertence à organização — não é dado de mercado.
7. Operador não acessa nenhuma parte desta feature (constitution §6).
8. Dado de cotação fica no Cloud SQL (constitution §9).

## Fora de escopo

- Previsão de preço, modelo estatístico ou de IA sobre a série.
- Execução de hedge, contrato futuro ou opção.
- Cotação de insumo (adubo, defensivo) — feature `027` trata do preço pago, não de
  índice de mercado.
- Preço de leite por litro — depende da dúvida 1.

## Dúvidas abertas

| #   | Dúvida                                                                                                                                              | Para quem | Estado |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------ |
| 1   | **"Gado leiteiro" apareceu pela primeira vez aqui.** Existe produção de leite nas fazendas, ou o pedido é só a cotação da vaca de descarte para abate? | produtor  | aberta |
| 2   | Se houver leite, é uma quarta frente (produção diária, litragem, laticínio) e precisa de spec própria. Confirmar.                                    | produtor  | aberta |
| 3   | Levantado: os indicadores CEPEA são **CC BY-NC 4.0** — uso comercial exige licença contratada. Há disposição a pagar?                                | produtor  | aberta |
| 4   | Qual referência ele usa hoje na prática para decidir: cooperativa, corretor, notícia, vizinho?                                                       | produtor  | aberta |
| 5   | O preço da cooperativa já serve de referência? Ela publica isso de forma utilizável?                                                                 | produtor  | aberta |
| 6   | Qual o diferencial de praça típico do café da região em relação a Nova York?                                                                         | produtor  | aberta |
| 7   | **Respondida:** o câmbio tem fonte pública e gratuita — API PTAX do Banco Central, sob Open Database License. Resta respeitar a atribuição da ODbL. | —         | fechada |
