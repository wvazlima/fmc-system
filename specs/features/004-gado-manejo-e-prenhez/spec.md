# 004 · Gado: manejo e prenhez

|                        |                                     |
| ---------------------- | ----------------------------------- |
| **Estado**             | rascunho                            |
| **Fase**               | 1                                   |
| **Depende de**         | `003-gado-entrada-e-lotes`          |
| **Princípios em jogo** | constitution §1, §4, §5, §6, §7, §8 |

---

## Problema

Entre a compra e a venda, o animal recebe vacina, trato, protocolo hormonal,
inseminação e diagnóstico de gestação. Cada um desses eventos custa dinheiro, e o custo
é o que separa a margem real da margem imaginada.

Na planilha, nada disso aparece por animal. O protocolo de IATF é uma linha de despesa
do mês; o sêmen, outra. Quando a novilha é vendida, ninguém sabe quanto ela custou de
verdade — só quanto o lote inteiro custou, dividido pela quantidade.

Pior: a taxa de prenhez, que é o indicador central da operação, é conferida contando
animal no caderno do inseminador.

## Usuários e perfis afetados

| Perfil   | O que passa a fazer                                                | O que **não** pode ver                              |
| -------- | ------------------------------------------------------------------ | --------------------------------------------------- |
| Dono     | Vê taxa de prenhez, custo de manejo por animal e por lote          | —                                                   |
| Gerente  | Registra eventos com custo; confere prenhez; acompanha o protocolo | —                                                   |
| Operador | Registra manejo, vacina, inseminação e diagnóstico, no curral      | Custo de qualquer evento; custo acumulado do animal |

## Histórias

- Como **operador**, quero registrar a inseminação de cada animal no curral, pelo
  celular, sem sinal.
- Como **operador**, quero registrar o resultado do diagnóstico de gestação animal por
  animal, rápido, com o braço sujo.
- Como **gerente**, quero que o custo do protocolo e do sêmen seja atribuído aos animais
  que participaram, e não diluído no lote.
- Como **dono**, quero ver a taxa de prenhez por lote e por fazenda.

## Critérios de aceite

### CA-01 · Evento de manejo com custo

- **Dado** um animal ou um conjunto de animais
- **Quando** o gerente registra um evento (vacina, trato, protocolo, sêmen) com data de
  competência, data de caixa e valor
- **Então** o evento é gravado como **append-only** (não conflita no sync)
- **E** o custo é atribuído **aos animais participantes**, não diluído no lote
- **E** a soma dos custos atribuídos é exatamente o valor do evento

### CA-02 · IATF

- **Dado** um conjunto de animais em protocolo
- **Quando** o gerente registra a inseminação com data, sêmen usado e responsável
- **Então** cada animal recebe o custo do protocolo hormonal, do sêmen e da mão de obra
- **E** a condição de prenhez de cada um passa a `suspected`

### CA-03 · Diagnóstico de gestação

- **Dado** animais com condição `suspected`
- **Quando** o diagnóstico é registrado com data, método e resultado
- **Então** a condição passa a `confirmed` ou volta a `open`
- **E** o histórico guarda todas as transições, com data e autor

### CA-04 · Taxa de prenhez

- **Dado** um lote com 24 animais, 21 com prenhez confirmada
- **Quando** o gerente abre o lote
- **Então** vê a taxa de prenhez como 21 de 24 (87,5%)
- **E** vê os 3 animais que ainda não confirmaram

> O número é calculado por consulta determinística, nunca por IA (constitution §4).

### CA-05 · Correção é estorno, não edição

- **Dado** um evento de manejo registrado com valor errado
- **Quando** o gerente corrige
- **Então** é criado um **evento de estorno** e um evento novo
- **E** o evento original permanece no histórico
- **E** o custo acumulado do animal reflete o valor correto

### CA-06 · Lançamento de operador pode entrar "a revisar"

- **Dado** que a organização ativou a revisão de lançamentos de operador
- **Quando** um operador registra um manejo
- **Então** o registro entra com estado `pending_review`
- **E** aparece para o gerente numa fila de conferência
- **E** o estado `pending_review` não se confunde com `pending_sync`

### CA-OFF · Cenário offline

- **Dado** que o operador está no curral, sem sinal, com 24 animais em protocolo
- **Quando** ele registra a inseminação de todos
- **Então** os 24 eventos são gravados localmente e confirmados na tela na hora
- **E** ao voltar o sinal, sincronizam sem duplicar
- **E** dois dispositivos registrando eventos no mesmo lote não conflitam (append-only)

### CA-OP · Cenário de operador

- **Dado** um operador alocado na fazenda A
- **Quando** ele acessa a tela ou o endpoint de manejo
- **Então** registra o evento sem informar nem receber valor algum
- **E** o payload de sync não traz o custo do evento nem o custo acumulado do animal
- **E** ao tentar acessar animal da fazenda B, recebe 403

## Regras de negócio

1. Todo evento de manejo é **append-only**; correção é estorno (`.claude/rules/sync.md`).
2. Custo de **IATF** (protocolo, sêmen, mão de obra) é atribuído **ao animal**, nunca
   diluído no lote (skill `dominio-agro`).
3. Condição de prenhez: `open` → `suspected` → `confirmed` (ou de volta a `open`). Todas
   as transições ficam no histórico.
4. Todo evento com custo gera lançamento com **duas datas** (ADR-0008).
5. O operador registra o **fato**; o custo é informado pelo gerente ou vem de um preço
   cadastrado.
6. `pending_review` ≠ `pending_sync` (`specs/glossario.md`).
7. O sistema **registra** o que foi aplicado; **não recomenda** produto nem dose
   (constitution §7).

## Fora de escopo

- Receituário e prescrição — proibido (constitution §7).
- Controle de estoque de sêmen, vacina e hormônio com saldo em tempo real — feature
  `017`, que trata o estoque de insumos como frente própria.
- Genealogia, genética e escolha de touro.
- Calendário sanitário com alerta automático — Fase 2.
- Curva de ganho de peso.

## Dúvidas abertas

| #   | Dúvida                                                                                              | Para quem | Estado |
| --- | --------------------------------------------------------------------------------------------------- | --------- | ------ |
| 1   | O protocolo de IATF usado tem quantos manejos? Precisamos modelar o protocolo ou só o evento final? | agrônomo  | aberta |
| 2   | O custo do protocolo é conhecido por animal, ou vem como uma nota única para o grupo?               | produtor  | aberta |
| 3   | Repasse de touro depois da IATF acontece? Como isso entra no custo e na apuração de prenhez?        | produtor  | aberta |
| 4   | A revisão de lançamento de operador deve ser ligada desde o início, ou só se houver problema?       | produtor  | aberta |
| 5   | Quem faz o diagnóstico de gestação — veterinário externo? O custo dele é por animal ou por visita?  | produtor  | aberta |
