# 015 · Exportação contábil em planilha

|                        |                                                 |
| ---------------------- | ----------------------------------------------- |
| **Estado**             | rascunho                                        |
| **Fase**               | 1                                               |
| **Depende de**         | `009-lancamentos-financeiros-duas-datas`, `010` |
| **Princípios em jogo** | constitution §3, §5, §6, §11                    |

---

## Problema

Todo mês, o escritório contábil precisa dos lançamentos. Hoje isso é um pacote de
documentos e uma planilha montada à mão, por fazenda, com a categoria traduzida de
cabeça para a conta contábil. Leva tempo, erra, e quando o contador devolve uma dúvida
ninguém sabe de onde veio o número.

Duas exigências tornam isso mais delicado do que parece. Primeira: o produtor é pessoa
física **com inscrição estadual por fazenda** — a escrita é separada por imóvel, e um
arquivo consolidado não serve. Segunda: a contabilidade trabalha em **regime de caixa**,
enquanto os indicadores de gestão trabalham em competência. Exportar a base errada
invalida o trabalho todo.

Esta feature entrega a exportação da Fase 1: **planilha por fazenda e período, no
formato combinado com o contador**. O arquivo oficial do LCDPR é da Fase 2.

## Usuários e perfis afetados

| Perfil   | O que passa a fazer                                                | O que **não** pode ver |
| -------- | ------------------------------------------------------------------ | ---------------------- |
| Dono     | Acompanha o que foi enviado ao escritório e quando                 | —                      |
| Gerente  | Configura o de-para, gera e baixa a exportação, resolve pendências | —                      |
| Operador | Nada                                                               | **Tudo**               |

## Histórias

- Como **gerente**, quero gerar a planilha do mês de uma fazenda no formato que o
  escritório pede, sem montar nada à mão.
- Como **gerente**, quero configurar de-para entre as categorias do sistema e as contas
  do plano de contas.
- Como **gerente**, quero que o sistema me impeça de exportar quando faltar
  classificação, em vez de jogar tudo em "outros".
- Como **dono**, quero ver o que foi exportado, quando e por quem.

## Critérios de aceite

### CA-01 · Exportação é por fazenda

- **Dado** um período e uma fazenda
- **Quando** o gerente gera a exportação
- **Então** o arquivo contém **apenas** os lançamentos daquela fazenda
- **E** traz a inscrição estadual dela no cabeçalho
- **E** não existe exportação consolidada do grupo para fins contábeis

### CA-02 · Base é caixa

- **Dado** uma exportação de um período
- **Quando** os lançamentos são selecionados
- **Então** o critério é a **`cash_date`** (ADR-0008)
- **E** o cabeçalho declara que a base é caixa
- **E** lançamento de competência ainda sem evento de caixa **não** entra

### CA-03 · De-para configurável e versionado

- **Dado** o de-para entre categoria do sistema e conta contábil
- **Quando** ele é alterado em março
- **Então** uma reexportação de janeiro usa o de-para **vigente em janeiro**
- **E** o arquivo gerado em janeiro continua reproduzível

### CA-04 · Categoria sem de-para bloqueia

- **Dado** um lançamento cuja categoria não tem conta configurada
- **Quando** o gerente tenta exportar
- **Então** a exportação é **bloqueada**, com a lista de categorias faltando
- **E** nada é jogado numa conta genérica "outros"

### CA-05 · Conteúdo da planilha

- **Dado** uma exportação gerada
- **Quando** o arquivo é aberto
- **Então** cada linha traz: data de caixa, histórico, participante (nome e CPF/CNPJ),
  conta contábil, valor, natureza (entrada ou saída) e conta bancária
- **E** há totais por conta, conferidos contra o total geral

### CA-06 · Proteção contra injeção de fórmula

- **Dado** um histórico ou nome de participante que começa com `=`, `+`, `-` ou `@`
- **Quando** a planilha é gerada
- **Então** a célula é prefixada para não ser interpretada como fórmula
- **E** o texto original permanece legível

### CA-07 · Participante e conta bancária

- **Dado** um lançamento sem participante identificado
- **Quando** a exportação é gerada
- **Então** ele aparece numa lista de pendências antes da geração
- **E** o gerente decide corrigir ou exportar assinalando a ausência

> O LCDPR (Fase 2) **exige** participante. Resolver isso já na Fase 1 evita retrabalho.

### CA-08 · Histórico importado sinalizado

- **Dado** um período que contém lançamentos com `source = 'import'`
- **Quando** a exportação é gerada
- **Então** esses lançamentos são sinalizados no arquivo (constitution §11)

### CA-09 · Registro do que foi exportado

- **Dado** uma exportação gerada
- **Quando** o dono abre o histórico
- **Então** vê período, fazenda, data de geração, autor, total e a versão do de-para
- **E** consegue baixar o arquivo de novo, idêntico

### CA-OFF · Cenário offline

- **Dado** que esta feature roda no escritório e a geração é um job do `worker`
- **Quando** não há conexão
- **Então** a tela indica que a exportação exige conexão
- **E** nenhuma exportação parcial é gerada nem baixada

### CA-OP · Cenário de operador

- **Dado** um usuário com perfil `operator`
- **Quando** ele usa o app
- **Então** não existe nenhuma tela, rota ou arquivo de exportação acessível a ele
- **E** qualquer requisição a um endpoint de exportação devolve 403

## Regras de negócio

1. Exportação é **por fazenda** — cada uma tem inscrição estadual e escrita própria
   (skill `integracao-contabil`).
2. Base é **caixa** (`cash_date`); nunca competência (ADR-0008).
3. O de-para é **dado configurável e versionado**, nunca constante no código.
4. Categoria sem de-para **bloqueia** a exportação. Nada de conta genérica.
5. Participante identificado por CPF ou CNPJ — exigência do LCDPR, antecipada aqui.
6. Proteção contra injeção de fórmula na planilha (`.claude/rules/security.md`).
7. Registro importado é sinalizado (constitution §11).
8. Toda exportação fica registrada, reproduzível e rebaixável.
9. Gera no **`worker`**; o job é idempotente.
10. **Operador não acessa nada aqui** (constitution §6).

## Fora de escopo

- Arquivo oficial do **LCDPR** no layout da Receita — Fase 2.
- Importação da folha do **Folhamatic** — Fase 2.
- Envio automático ao escritório (e-mail, integração direta).
- Escrituração fiscal, apuração de imposto e obrigações acessórias.
- Balanço e DRE. Isto é entrega de lançamentos, não contabilidade completa.
- Retorno do escritório para o sistema (lançamentos de ajuste).

## Dúvidas abertas

| #   | Dúvida                                                                                        | Para quem | Estado |
| --- | --------------------------------------------------------------------------------------------- | --------- | ------ |
| 1   | Em que formato exato o escritório quer receber? Precisamos de um modelo de arquivo real.      | contador  | aberta |
| 2   | Qual é o plano de contas? Precisamos dele para montar o de-para.                              | contador  | aberta |
| 3   | O escritório aceita planilha, ou prefere um layout de importação do sistema dele desde já?    | contador  | aberta |
| 4   | Qual a periodicidade — mensal? E até que dia do mês seguinte?                                 | contador  | aberta |
| 5   | O escritório precisa dos documentos (XML, PDF) junto, ou só dos lançamentos?                  | contador  | aberta |
| 6   | Lançamento sem participante identificado é aceitável em alguma situação, ou sempre bloqueia?  | contador  | aberta |
| 7   | Qual sistema o escritório usa? Isso define o próximo adaptador (skill `integracao-contabil`). | contador  | aberta |
