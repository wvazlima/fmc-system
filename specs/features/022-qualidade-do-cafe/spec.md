# 022 · Qualidade do café: classificação por lote

|                        |                                                             |
| ---------------------- | ----------------------------------------------------------- |
| **Estado**             | rascunho                                                    |
| **Fase**               | 2                                                           |
| **Depende de**         | `007-cafe-talhoes-e-safras`, `019-armazem-estocagem-e-umidade` |
| **Princípios em jogo** | constitution §4, §6, §7                                     |

---

## Problema

Duas sacas do mesmo talhão podem valer preços diferentes. O que separa uma da outra é
a classificação: bebida, tipo, peneira e defeitos. É ela que define o ágio ou o
deságio na venda — e, no limite, se o lote entra como commodity ou como café especial.

Hoje a classificação existe, mas só no papel do classificador e na nota da
cooperativa. Ela não volta para o talhão. Então ninguém consegue responder a pergunta
que decide investimento: **qual talhão produz o café que paga mais?**

Sem isso, aduba-se igual, colhe-se igual e vende-se tudo misturado — e o talhão bom
subsidia o ruim sem que ninguém perceba.

## Usuários e perfis afetados

| Perfil   | O que passa a fazer                                                | O que **não** pode ver              |
| -------- | ------------------------------------------------------------------ | ----------------------------------- |
| Dono     | Vê a qualidade por talhão e por safra, e o que ela pagou a mais    | —                                   |
| Gerente  | Registra amostra, laudo de classificação e o ágio/deságio aplicado | —                                   |
| Operador | Registra a coleta da amostra e a identificação do lote             | Ágio, deságio, preço, valor do lote |

## Histórias

- Como **gerente**, quero registrar o laudo de classificação de cada lote.
- Como **dono**, quero ver a qualidade média de cada talhão ao longo das safras.
- Como **dono**, quero saber quanto a mais a qualidade me pagou nesta safra.
- Como **gerente**, quero comparar a classificação do armazém com a que eu esperava.

## Critérios de aceite

### CA-01 · Laudo vinculado ao lote e ao talhão

- **Dado** um lote de café com talhão de origem (glossário: `coffee_lot`)
- **Quando** o gerente registra a classificação
- **Então** ficam gravados bebida, tipo, peneira, contagem de defeitos, umidade, data,
  classificador e origem do laudo (próprio, cooperativa, comprador)
- **E** o laudo fica ligado ao talhão e à safra de origem do lote

### CA-02 · Lote misturado preserva a proporção

- **Dado** um lote formado por café de dois talhões, 70% do T-04 e 30% do T-07
- **Quando** o laudo é registrado
- **Então** a qualidade é atribuída aos dois talhões na proporção do volume
- **E** o sistema deixa explícito que a atribuição é **proporcional**, não medida por
  talhão

### CA-03 · Ágio e deságio viram dinheiro rastreável

- **Dado** uma venda com deságio de R$ 25,00 por saca por tipo abaixo do contratado
- **Quando** a venda é efetivada
- **Então** o deságio é um lançamento vinculado à venda, não um desconto embutido no
  preço (mesma regra da feature `011`)
- **E** o motivo do deságio é a classificação registrada

### CA-04 · Divergência entre laudos

- **Dado** uma classificação própria e outra do comprador para o mesmo lote
- **Quando** as duas são registradas
- **Então** o sistema apresenta as duas lado a lado, com a diferença destacada
- **E** nenhuma é descartada: a divergência é o dado

### CA-05 · Qualidade por talhão ao longo do tempo

- **Dado** três safras com laudos registrados
- **Quando** o dono abre a ficha do talhão
- **Então** vê a evolução de bebida, tipo e peneira, e o ágio médio obtido
- **E** os números vêm de consulta ao banco (constitution §4)

### CA-06 · O sistema não prescreve manejo

- **Dado** um talhão com queda de qualidade
- **Quando** o fato é apresentado
- **Então** o sistema mostra o número e a comparação, **sem** recomendar adubação,
  defensivo, dose ou prática de colheita (constitution §7)

### CA-OFF · Cenário offline

- **Dado** que o operador coletou a amostra no terreiro, sem sinal
- **Quando** registra a coleta com identificação do lote e foto
- **Então** o registro é gravado localmente com UUID v7 do cliente e aparece como
  `pendente`
- **E** o laudo registrado depois pelo gerente se vincula à mesma amostra, sem
  duplicar o lote

### CA-OP · Cenário de operador

- **Dado** um operador alocado na fazenda A
- **Quando** ele registra a coleta da amostra
- **Então** informa lote, local e data
- **E** não recebe ágio, deságio, preço nem valor do lote (constitution §6)
- **E** ao tentar acessar lote da fazenda B, recebe 403

## Regras de negócio

1. Classificação usa os termos do glossário: `cup_quality`, `coffee_type`,
   `screen_size`, `defects`.
2. Um lote pode ter **vários** laudos, de origens diferentes; nenhum sobrescreve o
   outro.
3. Qualidade de lote misturado é atribuída por proporção de volume, sempre marcada
   como proporcional.
4. Ágio e deságio são lançamentos vinculados à venda, nunca embutidos no preço.
5. A umidade do laudo é a mesma grandeza da feature `019` — um dado, não dois.
6. O sistema registra e compara; não recomenda (constitution §7).
7. Operador nunca recebe valor (constitution §6).

## Fora de escopo

- Pré-classificação de defeitos por foto — Fase 3.
- Análise sensorial própria com pontuação SCA e certificação de café especial — ver
  dúvida 5.
- Rastreabilidade completa do lote até a venda como especial — Fase 2, item próprio.
- Recomendação de manejo para melhorar qualidade (constitution §7).

## Dúvidas abertas

| #   | Dúvida                                                                                                        | Para quem | Estado |
| --- | --------------------------------------------------------------------------------------------------------------- | --------- | ------ |
| 1   | Quem classifica hoje: a cooperativa, um classificador contratado, o comprador?                                | produtor  | aberta |
| 2   | O laudo volta em papel ou arquivo? Dá para digitalizar ou tem que digitar?                                    | produtor  | aberta |
| 3   | O café dos cinco imóveis é misturado antes de vender, ou cada talhão vira lote?                               | produtor  | aberta |
| 4   | Qual a tabela de ágio e deságio praticada pela cooperativa? Por tipo, bebida e peneira?                       | produtor  | aberta |
| 5   | Existe intenção de vender como café especial? Isso muda a prioridade da rastreabilidade.                      | produtor  | aberta |
| 6   | A classificação influencia a decisão de segurar o lote (feature `021`)?                                       | produtor  | aberta |
