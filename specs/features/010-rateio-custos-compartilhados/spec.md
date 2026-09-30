# 010 · Rateio de custos compartilhados

|                        |                                          |
| ---------------------- | ---------------------------------------- |
| **Estado**             | rascunho                                 |
| **Fase**               | 1                                        |
| **Depende de**         | `009-lancamentos-financeiros-duas-datas` |
| **Princípios em jogo** | constitution §3, §4, §5, §6, §11         |

---

## Problema

Funcionário, diesel, máquina e energia atendem a tudo ao mesmo tempo: o mesmo tratorista
faz o café de manhã e o trato do gado à tarde; o mesmo caminhão leva insumo e leva
animal; a mesma conta de luz serve casa e curral.

Se esses custos não forem distribuídos, o custo por saca e a margem por cabeça ficam
**subestimados** — e por muito. Mão de obra é uma das maiores linhas de custo do café;
deixá-la de fora faz a operação parecer mais lucrativa do que é, o que leva a decisões
de compra e de venda erradas.

Se forem distribuídos por um critério errado ou opaco, é pior: o número parece
confiável e não é.

## Usuários e perfis afetados

| Perfil   | O que passa a fazer                                                      | O que **não** pode ver |
| -------- | ------------------------------------------------------------------------ | ---------------------- |
| Dono     | Vê o custo já rateado nos indicadores e como cada rateio foi feito       | —                      |
| Gerente  | Configura os critérios, aponta horas, revisa e fecha o rateio do período | —                      |
| Operador | Aponta as próprias horas por fazenda e por frente                        | Salário, valor, rateio |

## Histórias

- Como **gerente**, quero definir como cada tipo de custo compartilhado é distribuído,
  e que essa definição fique registrada.
- Como **gerente**, quero apontar as horas do tratorista por frente e que o salário
  siga esse apontamento.
- Como **dono**, quero que o custo por saca já inclua a parcela de mão de obra e diesel
  que cabe àquele talhão.
- Como **dono**, quero abrir um indicador e ver **de onde** veio a parcela rateada.

## Critérios de aceite

### CA-01 · Rateio em dois níveis

- **Dado** um custo compartilhado de R$ 12.000,00
- **Quando** o rateio é executado
- **Então** ele é distribuído primeiro **entre fazendas**, pelo critério do 1º nível
- **E** depois, dentro de cada fazenda, **entre frentes**, pelo critério do 2º nível
- **E** rateio de um nível só é rejeitado

### CA-02 · A soma fecha exatamente

- **Dado** um custo de R$ 12.000,00 distribuído entre 5 fazendas e 4 frentes
- **Quando** o rateio é executado
- **Então** a soma de todas as parcelas é **exatamente** R$ 12.000,00
- **E** a diferença de arredondamento vai para a maior parcela

### CA-03 · Critério é dado configurável e versionado

- **Dado** que o critério de rateio de diesel muda em 01/03
- **Quando** um relatório de janeiro é gerado depois dessa mudança
- **Então** ele usa o critério **vigente em janeiro**
- **E** o relatório continua reproduzível

### CA-04 · Apontamento de horas

- **Dado** um funcionário fixo alocado na fazenda A
- **Quando** suas horas do mês são apontadas — 60% café, 30% gado, 10% lavoura
- **Então** o salário e os encargos dele são distribuídos nessa proporção
- **E** a parcela do café entra na categoria mão de obra do talhão, na competência

### CA-05 · Pessoal fica fora

- **Dado** um custo da frente `pessoal` (casa, jardim, despesa dos proprietários)
- **Quando** o rateio produtivo é executado
- **Então** ele **não** é distribuído entre café, gado e lavoura

### CA-06 · Rastreabilidade do rateio

- **Dado** um talhão com custo por saca calculado
- **Quando** o dono abre o detalhe
- **Então** vê a parcela direta e a parcela rateada, separadas
- **E** consegue navegar da parcela rateada até o lançamento de origem e o critério
  usado

### CA-07 · Rateio é reexecutável

- **Dado** um rateio já executado para um período
- **Quando** um lançamento daquele período é corrigido, ou um apontamento muda
- **Então** o rateio do período pode ser reexecutado
- **E** as parcelas anteriores são **estornadas**, não editadas
- **E** período contábil já fechado não é reexecutado sem ação explícita do gerente

### CA-08 · Cálculo determinístico

- **Dado** qualquer rateio
- **Quando** ele é executado
- **Então** o resultado vem de SQL ou TypeScript testado, nunca de IA
  (constitution §4)
- **E** existe teste com número conferido à mão

### CA-OFF · Cenário offline

- **Dado** que o operador está no campo, sem sinal
- **Quando** aponta as horas que trabalhou por fazenda e por frente
- **Então** o apontamento é gravado localmente e confirmado na tela
- **E** ao voltar o sinal, sincroniza sem duplicar

> A **execução** do rateio roda no servidor (job do `worker`), não no dispositivo: ela
> precisa de todos os lançamentos do período.

### CA-OP · Cenário de operador

- **Dado** um operador alocado na fazenda A
- **Quando** ele aponta horas
- **Então** informa apenas fazenda, frente, data e quantidade de horas
- **E** não recebe salário, valor-hora, custo rateado nem qualquer valor
- **E** não vê o apontamento de outros funcionários

## Regras de negócio

1. Rateio em **dois níveis**: entre fazendas, depois entre frentes
   (skill `dominio-agro`). Um nível só está errado.
2. Critérios típicos: funcionário fixo → fazenda de alocação, depois horas apontadas;
   volante → dias por fazenda, depois horas; diesel → litros por fazenda, depois horas
   de máquina; máquina → horas de uso; energia → medidor, depois área ou uso declarado.
3. O critério é **dado configurável e versionado**, nunca constante no código.
4. A soma das parcelas é **exatamente** o custo total; o arredondamento vai para a maior
   parcela.
5. **Pessoal não entra em rateio produtivo.**
6. A parcela rateada preserva as duas datas do lançamento de origem (ADR-0008).
7. Reexecução **estorna** e recria; nunca edita.
8. Cálculo determinístico e testado (constitution §4).
9. Operador nunca recebe valor (constitution §6).

## Fora de escopo

- Importação da folha do Folhamatic — Fase 2. Aqui o salário é lançado manualmente
  (feature `009`).
- Depreciação de máquinas com regra contábil formal.
- Controle de abastecimento com bomba e medidor automático.
- Ponto eletrônico. O apontamento de horas é manual.
- Rateio entre organizações (SaaS).

## Dúvidas abertas

| #   | Dúvida                                                                                                  | Para quem | Estado |
| --- | ------------------------------------------------------------------------------------------------------- | --------- | ------ |
| 1   | Qual critério o produtor usa hoje para dividir funcionário, diesel, máquina e energia entre as frentes? | produtor  | aberta |
| 2   | Existe apontamento de horas hoje, em qualquer forma? Se não, quem vai apontar e com que frequência?     | produtor  | aberta |
| 3   | Encargos entram no rateio junto com o salário, ou separados?                                            | contador  | aberta |
| 4   | Máquina: rateia por hora de uso ou por área atendida? Há horímetro?                                     | produtor  | aberta |
| 5   | Energia tem medidor por fazenda, ou vem uma conta só?                                                   | produtor  | aberta |
| 6   | Qual a periodicidade do fechamento do rateio — mensal? E quem confere antes de fechar?                  | produtor  | aberta |
| 7   | O rateio gerencial precisa bater com o rateio contábil, ou são visões diferentes?                       | contador  | aberta |
