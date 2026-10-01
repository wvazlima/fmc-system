# 020 · Perdas de produção

|                        |                                                                     |
| ---------------------- | ------------------------------------------------------------------- |
| **Estado**             | rascunho                                                            |
| **Fase**               | 2                                                                   |
| **Depende de**         | `007-cafe-talhoes-e-safras`, `017-estoque-de-insumos`, `019`        |
| **Princípios em jogo** | constitution §4, §6, §7                                             |

---

## Problema

Perda é o custo que não aparece. O talhão produziu menos do que devia; morreram
animais no lote; o café caiu no chão na colheita; o adubo endureceu no barracão. Nada
disso gera lançamento, porque não houve dinheiro saindo — e por isso tudo some.

O efeito é que o custo por saca e a margem por cabeça ficam **otimistas**: dividem o
custo real por uma produção que não existiu, ou ignoram um animal que foi pago e
nunca foi vendido. O produtor pediu literalmente: *"perda na produção tem que
controlar também"*.

Sem registro de perda não há como responder as perguntas que importam: qual talhão
perde mais, qual lote de gado teve mais mortalidade, quanto da perda é esperado e
quanto é sinal de problema.

## Usuários e perfis afetados

| Perfil   | O que passa a fazer                                            | O que **não** pode ver                |
| -------- | -------------------------------------------------------------- | ------------------------------------- |
| Dono     | Vê a perda do período em volume e em dinheiro, por frente      | —                                     |
| Gerente  | Classifica a perda, confirma a causa e fecha o registro        | —                                     |
| Operador | Registra o que viu: animal morto, café caído, produto vencido  | Valor da perda, impacto no custo      |

## Histórias

- Como **operador**, quero registrar um animal morto na hora em que encontro, com foto
  e local, mesmo sem sinal.
- Como **gerente**, quero classificar a causa da perda e ver se ela é recorrente.
- Como **dono**, quero ver quanto perdi na safra, em sacas e em reais, e em qual talhão.
- Como **dono**, quero comparar a mortalidade entre lotes e entre fazendas.

## Critérios de aceite

### CA-01 · Perda é evento, não ajuste

- **Dado** qualquer perda
- **Quando** ela é registrada
- **Então** vira um evento com data, fazenda, frente, quantidade, unidade, causa e
  responsável pelo registro
- **E** nunca é aplicada como edição silenciosa de um saldo ou de uma produção

### CA-02 · Perda de gado por morte

- **Dado** um animal com custo acumulado de R$ 3.437,00
- **Quando** a morte é registrada e confirmada
- **Então** o animal sai do rebanho ativo e **não** entra no cálculo de margem média
  como venda a zero
- **E** o custo acumulado dele é apropriado como **perda do lote**, visível separado da
  margem dos animais vendidos (feature `006`)
- **E** a causa é classificada (sanitária, acidente, predação, parto, desconhecida)

### CA-03 · Perda de café na lavoura e na colheita

- **Dado** um talhão com colheita registrada
- **Quando** o gerente registra perda de colheita em sacas
- **Então** a perda fica vinculada ao talhão e à safra, pela data de competência
- **E** o relatório da safra mostra produção colhida, perda e produção potencial
- **E** o custo por saca continua sendo calculado sobre as sacas **colhidas**, com a
  perda apresentada ao lado — nunca embutida sem aviso

### CA-04 · Perda de insumo em estoque

- **Dado** um produto vencido ou danificado no barracão (feature `017`)
- **Quando** a baixa é registrada
- **Então** gera movimento `loss_out`, com justificativa obrigatória
- **E** o valor da perda é o custo médio do produto na data

### CA-05 · Perda esperada × perda a investigar

- **Dado** um percentual de perda esperado configurado por frente e tipo
- **Quando** uma perda registrada ultrapassa esse percentual no período
- **Então** ela é marcada como **acima do esperado** e aparece no painel do gerente
- **E** o caso é encaminhado à feature `026`, que decide se há indício de desvio
- **E** o sistema **não** afirma causa nem culpa: apresenta o número e a comparação
  (constitution §7)

### CA-06 · Perda com evidência

- **Dado** uma perda registrada no campo
- **Quando** o operador anexa foto e posição
- **Então** a foto vai para o storage, nunca para o sistema de arquivos da aplicação
- **E** a posição é a do evento, não o rastreamento do funcionário (feature `012`
  mantém isso fora de escopo)

### CA-07 · Totais da perda no período

- **Dado** um período fechado
- **Quando** o dono abre o relatório de perdas
- **Então** vê, por fazenda e por frente, quantidade perdida, valor equivalente e
  participação sobre a produção
- **E** os números vêm de consulta ao banco (constitution §4)

### CA-OFF · Cenário offline

- **Dado** que o operador encontrou um animal morto no pasto, sem sinal
- **Quando** registra a perda com foto
- **Então** o registro e a foto são gravados localmente com UUID v7 do cliente e
  aparecem como `pendente`
- **E** a tela confirma na hora, sem erro de rede
- **E** ao voltar a conexão, o registro e a mídia sincronizam sem duplicar

### CA-OP · Cenário de operador

- **Dado** um operador alocado na fazenda A
- **Quando** ele registra uma perda
- **Então** informa o que, quanto e a causa observada
- **E** não recebe o valor da perda, o custo acumulado do animal nem o impacto no
  resultado (constitution §6)
- **E** não vê o relatório de perdas do período
- **E** ao tentar registrar perda na fazenda B, recebe 403

## Regras de negócio

1. Perda é sempre evento datado, com causa classificada e autor.
2. Causa tem taxonomia fechada por frente, com `other` exigindo texto livre.
3. Perda registrada por operador nasce em `pending_review` e precisa de confirmação do
   gerente para entrar nos totais (glossário).
4. Morte de animal não é venda a zero: sai do rebanho e vira perda do lote, preservando
   a margem dos animais efetivamente vendidos.
5. O custo por saca da safra usa as sacas colhidas; a perda é apresentada ao lado,
   nunca embutida.
6. Percentual esperado é configurável por organização, frente e tipo de perda, e é
   versionado.
7. Perda de peso por umidade no armazém **não** é tratada aqui — é `moisture_loss` na
   feature `019`.
8. Operador nunca recebe valor (constitution §6).

## Fora de escopo

- Diagnóstico de causa de morte ou de doença por foto — Fase 3, e sempre como apoio.
- Recomendação de manejo para reduzir perda (constitution §7).
- Perda de peso por umidade — feature `019`.
- Sinistro e seguro agrícola — ver dúvida 6.
- Quebra de peso no transporte de gado — já tratada nas features `005` e `011`.

## Dúvidas abertas

| #   | Dúvida                                                                                                            | Para quem | Estado |
| --- | ------------------------------------------------------------------------------------------------------------------- | --------- | ------ |
| 1   | Qual a mortalidade normal do rebanho hoje, em percentual? Existe esse número?                                     | produtor  | aberta |
| 2   | A perda de café na colheita é medida de alguma forma hoje, ou é só percepção?                                     | produtor  | aberta |
| 3   | Que causas de perda realmente ocorrem? Precisamos da lista real para fechar a taxonomia.                          | produtor  | aberta |
| 4   | Quem constata a morte no campo e quanto tempo depois ela é informada ao escritório?                               | produtor  | aberta |
| 5   | Animal morto gera obrigação de registro no órgão sanitário? Isso muda o fluxo?                                    | produtor  | aberta |
| 6   | Existe seguro agrícola ou de rebanho? Perda coberta tem tratamento diferente?                                     | produtor  | aberta |
| 7   | Perda de estoque e morte de animal são dedutíveis no livro caixa? Exigem laudo?                                   | contador  | aberta |
