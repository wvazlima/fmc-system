# 026 · Sentinela de desvio de mercadoria

|                        |                                                                       |
| ---------------------- | --------------------------------------------------------------------- |
| **Estado**             | rascunho                                                              |
| **Fase**               | 2                                                                     |
| **Depende de**         | `017-estoque-de-insumos`, `008-cafe-aplicacoes-e-custos`, `019`, `020` |
| **Princípios em jogo** | constitution §4, §6, §7                                               |

---

## Problema

Em fazenda, o que some não some de uma vez. Some devagar: dez litros de defensivo por
mês, um bezerro por semestre, meia tonelada de adubo que foi para um talhão que não
existe. Cada episódio isolado cabe dentro da margem de erro — e é exatamente por isso
que passa.

O pedido do produtor foi "sentinela de desvio de mercadoria: gado, defensivo agrícola,
controle de talhão, aplicação de insumos". Ele não está pedindo um alarme de roubo.
Está pedindo o que a planilha nunca deu: **um número esperado para comparar com o que
aconteceu de fato.**

A diferença entre as duas coisas é o que esta feature sustenta, e ela precisa ser dita
com todas as letras: **o sistema aponta divergência, não aponta pessoa.** Divergência
tem causas banais — erro de digitação, dose errada, animal que pulou a cerca, balança
descalibrada. Tratar divergência como acusação destrói a confiança de quem usa o
sistema e, na prática, faz o registro parar de acontecer.

## Usuários e perfis afetados

| Perfil   | O que passa a fazer                                                   | O que **não** pode ver                        |
| -------- | --------------------------------------------------------------------- | --------------------------------------------- |
| Dono     | Recebe as divergências, investiga e registra a conclusão              | —                                             |
| Gerente  | Vê as divergências da operação que conduz e explica as que conhece    | Divergências em que ele é parte interessada   |
| Operador | Nada — não vê divergência nenhuma                                     | Toda a superfície desta feature: 403          |

## Histórias

- Como **dono**, quero saber quando o consumo de um produto fugiu do padrão, com o
  número na mão.
- Como **dono**, quero conferir a contagem do rebanho contra o saldo do sistema.
- Como **gerente**, quero explicar uma divergência e fechá-la com justificativa.
- Como **dono**, quero ver o histórico de divergências por fazenda, sem que isso vire
  um ranking de pessoas.

## Critérios de aceite

### CA-01 · Divergência de estoque contra inventário

- **Dado** saldo de sistema de 1.700 kg e contagem física de 1.650 kg (feature `017`)
- **Quando** o inventário é fechado
- **Então** é aberta uma divergência de **−50 kg**, com o valor equivalente
- **E** ela entra na fila de investigação, com prazo e responsável pela apuração

### CA-02 · Dose fora do esperado por área

- **Dado** um talhão de 8,4 ha e uma dose de referência cadastrada de 350 kg/ha
- **Quando** é registrada aplicação de 4.200 kg nesse talhão
- **Então** o sistema aponta consumo **42,9% acima** do esperado (2.940 kg)
- **E** apresenta a conta por extenso: área, dose de referência, esperado, aplicado,
  diferença
- **E** a dose de referência é **cadastrada pelo produtor ou pelo agrônomo**, nunca
  sugerida pelo sistema (constitution §7)

### CA-03 · Contagem de rebanho contra saldo

- **Dado** um saldo de 318 cabeças na fazenda A
- **Quando** a contagem registra 314
- **Então** é aberta divergência de **4 cabeças**, com o custo acumulado associado
- **E** o sistema oferece as conciliações possíveis já registradas no período: mortes
  (feature `020`), transferências (feature `005`), vendas (features `006` e `024`)
- **E** só o que sobra depois dessas conciliações permanece como divergência

### CA-04 · Padrão, não episódio

- **Dado** um produto cujo consumo médio por hectare é de 350 kg
- **Quando** três meses seguidos ficam acima de 20% da média da própria fazenda
- **Então** é aberta uma divergência de **tendência**, separada das pontuais
- **E** a comparação é contra o histórico da própria fazenda e contra as demais
  fazendas da organização, apresentadas lado a lado

### CA-05 · O sistema descreve, não acusa

- **Dado** qualquer divergência
- **Quando** ela é apresentada
- **Então** o texto traz fato, número e comparação
- **E** **não** nomeia culpado, não atribui intenção e não usa as palavras furto,
  roubo, desvio ou fraude na descrição automática
- **E** a hipótese fica com quem investiga, nunca com o sistema (constitution §7)

### CA-06 · Toda divergência termina com uma conclusão registrada

- **Dado** uma divergência aberta
- **Quando** ela é fechada
- **Então** exige uma das conclusões: `erro_de_registro`, `perda_operacional`,
  `ajuste_de_parametro`, `sem_explicacao`, `em_apuracao_externa`
- **E** a conclusão fica no histórico com autor e data
- **E** divergência fechada como `ajuste_de_parametro` atualiza a referência usada, com
  versionamento

### CA-07 · Acesso restrito e auditado

- **Dado** o conteúdo desta feature
- **Quando** alguém o acessa
- **Então** o acesso é restrito ao dono e, nas divergências da operação que conduz, ao
  gerente
- **E** cada abertura de divergência registra quem acessou e quando
- **E** nenhum nome de funcionário aparece em log (`.claude/rules/security.md`, LGPD)

### CA-08 · Falso positivo é combatido explicitamente

- **Dado** um parâmetro que gera divergência recorrente sempre concluída como
  `erro_de_registro` ou `ajuste_de_parametro`
- **Quando** isso acontece três vezes
- **Então** o sistema sinaliza que o **parâmetro** está errado, não a operação
- **E** sugere revisar a referência, sem desligá-la sozinho

> Sentinela que grita toda semana é sentinela que ninguém escuta. O custo de um falso
> positivo aqui é a feature inteira.

### CA-OFF · Cenário offline

- **Dado** que o gerente está no barracão sem sinal, fazendo a contagem física
- **Quando** registra o inventário
- **Então** a contagem é gravada localmente com UUID v7 do cliente e aparece como
  `pendente`
- **E** a divergência contra o saldo local já é apresentada na hora
- **E** a divergência **oficial** é apurada no servidor, sobre o saldo consolidado, ao
  sincronizar — a conta local é indicativa e identificada como tal

### CA-OP · Cenário de operador

- **Dado** um usuário com perfil `operator`
- **Quando** ele tenta acessar qualquer tela ou endpoint desta feature
- **Então** recebe 403
- **E** nenhuma divergência, parâmetro ou valor entra no payload de sync do dispositivo
  dele (constitution §6)
- **E** ele não é notificado quando um registro dele gera divergência

## Regras de negócio

1. Divergência é sempre `esperado × realizado`, com a fórmula visível e os dois valores
   à mostra.
2. Toda referência (dose por hectare, consumo médio, percentual tolerado) é
   **cadastrada e versionada**; nenhuma é inferida pelo sistema.
3. A comparação de padrão usa o histórico da própria fazenda primeiro; entre fazendas,
   apenas como contexto.
4. O sistema não nomeia pessoa, não atribui intenção e não classifica conduta.
5. Divergência exige conclusão registrada para fechar; nenhuma expira sozinha.
6. Dado de divergência é restrito ao dono (e ao gerente no seu escopo), com acesso
   auditado.
7. Nome, CPF e dado pessoal nunca entram em log (`.claude/rules/security.md`).
8. Operador não tem nenhuma superfície nesta feature (constitution §6).

## Fora de escopo

- Qualquer conclusão automática sobre conduta de pessoa.
- Pontuação ou ranking de funcionário.
- Rastreamento de pessoa por GPS (feature `012` mantém fora de escopo).
- Câmera, sensor de porteira e controle de acesso físico.
- Auditoria de preço e de fornecedor — feature `027`.

## Dúvidas abertas

| #   | Dúvida                                                                                                                               | Para quem | Estado |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------ |
| 1   | Já houve desvio concreto, ou a preocupação é preventiva? Saber disso muda o quanto a feature precisa ser sensível.                    | produtor  | aberta |
| 2   | Quem deve ver as divergências? Só o dono, ou o gerente também? E se a divergência for na operação do próprio gerente?                 | produtor  | aberta |
| 3   | Existe contagem de rebanho periódica hoje? Com que frequência e quem faz?                                                            | produtor  | aberta |
| 4   | Quem define a dose de referência por talhão: o agrônomo, o gerente, ou não existe referência escrita?                                 | produtor  | aberta |
| 5   | Qual tolerância é aceitável antes de virar divergência? 5%? 10%? Precisa ser por produto?                                            | produtor  | aberta |
| 6   | Esta feature depende inteiramente da `017` (estoque). Sem estoque, só a parte de gado e de dose por talhão funciona. Confirmar escopo. | produtor  | aberta |
| 7   | Há implicação trabalhista em registrar divergência vinculada a uma operação conduzida por um funcionário identificado?                | —         | aberta |
