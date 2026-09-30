# 005 · Gado: transferência entre fazendas

|                        |                                                         |
| ---------------------- | ------------------------------------------------------- |
| **Estado**             | rascunho                                                |
| **Fase**               | 1                                                       |
| **Depende de**         | `003-gado-entrada-e-lotes`, `004-gado-manejo-e-prenhez` |
| **Princípios em jogo** | constitution §3, §5, §6, §11                            |

---

## Problema

O gado circula entre as cinco fazendas: vai para onde tem pasto, para onde tem curral
de manejo, para onde está o inseminador. Cada movimentação tem frete e GTA.

Na planilha, isso quebra a conta de duas maneiras. Primeira: o animal "sai" da planilha
da fazenda A e "entra" na da fazenda B como se fosse uma compra nova — o custo anterior
se perde, e a margem final sai errada. Segunda: o frete e a GTA da transferência viram
despesa avulsa do mês, sem ligação com os animais que foram transportados.

O princípio que resolve isso: **a apuração de margem atravessa a transferência**. O
animal é o mesmo, da compra à venda, mesmo que tenha morado em três fazendas.

## Usuários e perfis afetados

| Perfil   | O que passa a fazer                                                        | O que **não** pode ver                 |
| -------- | -------------------------------------------------------------------------- | -------------------------------------- |
| Dono     | Vê o histórico de fazendas por onde o animal passou e o custo acumulado    | —                                      |
| Gerente  | Registra a transferência, o frete e a GTA; confere a chegada               | —                                      |
| Operador | Registra embarque e desembarque, com pesagem, na fazenda onde está alocado | Frete, custo acumulado, qualquer valor |

## Histórias

- Como **gerente**, quero transferir um grupo de animais da fazenda A para a B
  informando frete e GTA, e que o custo deles continue somando.
- Como **operador da fazenda B**, quero confirmar a chegada e pesar os animais, mesmo
  sem sinal.
- Como **dono**, quero ver por quais fazendas o animal passou e quanto cada trecho
  custou.
- Como **gerente**, quero que a quebra de peso no transporte fique registrada.

## Critérios de aceite

### CA-01 · Transferência não encerra a apuração

- **Dado** um animal comprado na fazenda A por R$ 3.200,00, com R$ 180,00 de custos
- **Quando** ele é transferido para a fazenda B com frete de R$ 45,00 e GTA de R$ 12,00
- **Então** ele aparece na fazenda B com custo acumulado de **R$ 3.437,00**
- **E** nenhuma margem é apurada na fazenda A
- **E** ao ser vendido na fazenda B, a margem considera o custo desde a compra

### CA-02 · `farm_id` muda, histórico permanece

- **Dado** um animal transferido de A para B
- **Quando** a transferência é confirmada
- **Então** o `farm_id` do animal passa a ser o da fazenda B
- **E** o histórico registra o período em que ele esteve em cada fazenda, com as datas

### CA-03 · Rateio do frete

- **Dado** uma transferência de 18 animais com frete de R$ 810,00
- **Quando** ela é confirmada
- **Então** cada animal recebe R$ 45,00
- **E** a soma é exatamente R$ 810,00

### CA-04 · Transferência em trânsito

- **Dado** uma transferência registrada na saída
- **Quando** a chegada ainda não foi confirmada
- **Então** os animais ficam em estado de **trânsito**, visíveis nas duas fazendas e
  contados em nenhuma
- **E** o gerente vê a lista de transferências em trânsito

### CA-05 · Quebra de peso

- **Dado** o peso de embarque e o peso de desembarque
- **Quando** a chegada é confirmada
- **Então** a quebra de peso (`weight_shrink`) é calculada e registrada por animal
- **E** fica disponível para a apuração de venda (feature `006`)

### CA-06 · GTA na transferência

- **Dado** uma transferência entre fazendas
- **Quando** o número da GTA não é informado
- **Então** a transferência é aceita, mas marcada como **pendente de GTA**
- **E** aparece na lista de regularização

### CA-07 · Divergência entre embarcados e desembarcados

- **Dado** uma transferência de 18 animais
- **Quando** só 17 são confirmados na chegada
- **Então** a transferência não fecha
- **E** o gerente precisa registrar o desfecho do animal faltante (morte no transporte,
  erro de contagem) antes de encerrar

### CA-OFF · Cenário offline

- **Dado** que o operador da fazenda B está no curral, sem sinal
- **Quando** confirma a chegada e pesa os 18 animais
- **Então** tudo é gravado localmente e confirmado na tela
- **E** ao voltar o sinal, sincroniza sem duplicar
- **E** se a saída (registrada na fazenda A) ainda não sincronizou, a chegada aguarda a
  dependência, sem falhar

### CA-OP · Cenário de operador

- **Dado** um operador alocado apenas na fazenda B
- **Quando** ele acessa a transferência
- **Então** vê os animais, os brincos e os pesos, sem frete, custo acumulado ou valor
- **E** não consegue iniciar uma transferência a partir da fazenda A

## Regras de negócio

1. A **margem atravessa transferências**: a apuração é da compra à venda
   (skill `dominio-agro`).
2. A transferência **adiciona** frete e custo de GTA ao `custo_acumulado`; não encerra
   nada.
3. `farm_id` do animal muda; o histórico de permanência por fazenda é preservado.
4. Frete e GTA geram lançamento com **duas datas** (ADR-0008) e são rateados por cabeça.
5. A **GTA é obrigatória** legalmente; o sistema aceita o registro sem ela, mas
   **sinaliza** para regularização.
6. Animal em trânsito não é contado no estoque de nenhuma das duas fazendas.
7. Transferência é um **evento** (append-only). Correção é estorno.
8. Operador nunca recebe valor (constitution §6).

## Fora de escopo

- Emissão da GTA. Ela é emitida no sistema do órgão estadual; aqui só se registra número
  e data.
- Rastreamento em tempo real do caminhão.
- Contrato com transportadora e cotação de frete.
- Transferência para terceiros (venda) — feature `006`.

## Dúvidas abertas

| #   | Dúvida                                                                                                        | Para quem | Estado |
| --- | ------------------------------------------------------------------------------------------------------------- | --------- | ------ |
| 1   | Com que frequência o gado circula? Isso dimensiona o esforço da tela.                                         | produtor  | aberta |
| 2   | O frete é próprio (caminhão da fazenda) ou contratado? Se próprio, o custo vem do rateio de máquinas (`010`). | produtor  | aberta |
| 3   | A pesagem no embarque e no desembarque é sempre feita, ou só em alguns casos?                                 | produtor  | aberta |
| 4   | A transferência entre fazendas com inscrições estaduais diferentes tem efeito fiscal? Gera nota?              | contador  | aberta |
| 5   | Morte no transporte: como é tratada contabilmente? O custo acumulado vira perda de qual fazenda?              | contador  | aberta |
