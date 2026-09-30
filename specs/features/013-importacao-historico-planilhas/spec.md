# 013 · Importação do histórico das planilhas

|                        |                                                     |
| ---------------------- | --------------------------------------------------- |
| **Estado**             | rascunho                                            |
| **Fase**               | 1                                                   |
| **Depende de**         | `003`, `007`, `009` (as entidades precisam existir) |
| **Princípios em jogo** | constitution §3, §4, §5, §11                        |

---

## Problema

Há anos de controle de gado, café e despesas das cinco fazendas em Excel. Esse
histórico é o que torna o sistema útil no primeiro dia: sem ele, a primeira comparação
entre safras só existe daqui a dois anos.

O risco não é técnico. É de confiança. Se o produtor abrir o sistema e o total de 2024
não bater com a planilha dele, ele para de acreditar em tudo — inclusive no que está
certo. E as planilhas têm tudo o que planilha real tem: linha de total no meio dos
dados, data em cinco formatos, o mesmo fornecedor escrito de seis jeitos, célula
mesclada e `#REF!`.

## Usuários e perfis afetados

| Perfil   | O que passa a fazer                                                  | O que **não** pode ver |
| -------- | -------------------------------------------------------------------- | ---------------------- |
| Dono     | Confere os totais importados contra as planilhas originais           | —                      |
| Gerente  | Envia arquivos, mapeia colunas, revisa rejeições, confirma ou desfaz | —                      |
| Operador | Nada                                                                 | **Tudo**               |

## Histórias

- Como **gerente**, quero enviar as planilhas e ver o que o sistema entendeu antes de
  confirmar qualquer coisa.
- Como **gerente**, quero ver a lista de linhas rejeitadas com o motivo e a linha
  original da planilha.
- Como **dono**, quero conferir que a soma importada bate com a soma da planilha, até o
  centavo.
- Como **gerente**, quero poder desfazer uma importação inteira, mesmo dias depois.

## Critérios de aceite

### CA-01 · Staging fiel

- **Dado** uma planilha enviada
- **Quando** ela é carregada
- **Então** cada aba vira uma tabela de staging com as **colunas como texto**, sem
  interpretação
- **E** o arquivo original é guardado no storage, com hash
- **E** cada linha de staging aponta para arquivo, aba e número da linha de origem

### CA-02 · Mapeamento explícito

- **Dado** uma aba em staging
- **Quando** o gerente mapeia as colunas para campos do domínio
- **Então** o mapeamento fica salvo e versionado, reutilizável em arquivos de layout
  igual
- **E** coluna não mapeada é registrada como **ignorada**, com o nome, nunca descartada
  em silêncio

### CA-03 · Limpeza registrada, nunca silenciosa

- **Dado** valores como `R$ 1.234,56`, `03/04/22` e `#REF!`
- **Quando** a limpeza roda
- **Então** o valor monetário é convertido para centavos corretamente
- **E** a data ambígua (`03/04/22`) vai para **revisão**, sem chute
- **E** `#REF!` vai para revisão
- **E** toda transformação aplicada fica registrada e visível

### CA-04 · Linha de total é detectada

- **Dado** uma aba com linha de total no meio dos dados
- **Quando** a importação roda
- **Então** a linha de total é detectada e **excluída** dos registros
- **E** é usada para conferência, não somada duas vezes

### CA-05 · Agrupamento de nomes é sugerido, nunca automático

- **Dado** o mesmo fornecedor grafado de seis maneiras
- **Quando** a limpeza roda
- **Então** o sistema **apresenta** os grupos por similaridade ao gerente
- **E** só unifica o que ele confirmar

### CA-06 · Validação tolerante e explícita

- **Dado** uma linha sem um campo que um lançamento novo exigiria
- **Quando** a validação roda
- **Então** a linha é aceita, com o campo faltante registrado
- **E** a validação do lançamento **novo** não é afrouxada por causa disso

### CA-07 · Conferência de totais antes de confirmar

- **Dado** uma importação pronta para confirmação
- **Quando** o gerente abre o resumo
- **Então** vê a tabela de conferência: número de linhas, soma de valores, número de
  animais e sacas — planilha × importado × diferença
- **E** diferença de **um centavo** é apresentada como diferença
- **E** ele confirma ou cancela

### CA-08 · Lote reversível

- **Dado** uma importação confirmada há vários dias
- **Quando** o gerente a desfaz
- **Então** todos os registros daquele lote são removidos
- **E** nenhum registro criado depois, fora do lote, é afetado
- **E** se algum registro do lote foi referenciado por dado novo, o sistema avisa e
  pede decisão antes de prosseguir

### CA-09 · Histórico marcado

- **Dado** registros importados
- **Quando** eles aparecem em qualquer relatório
- **Então** carregam `source = 'import'` e a referência ao lote
- **E** o relatório que mistura histórico e dado nativo **sinaliza** o período importado
- **E** existe filtro "só dado nativo"

### CA-10 · Reprocessar o mesmo arquivo não duplica

- **Dado** um arquivo já importado
- **Quando** o mesmo arquivo é enviado de novo
- **Então** o sistema reconhece pelo hash e avisa, em vez de duplicar

### CA-OFF · Cenário offline

- **Dado** que esta feature roda no **navegador do gerente, no escritório**, e o
  processamento é um job do `worker`
- **Quando** não há conexão
- **Então** o envio do arquivo fica pendente e é retomado quando a conexão volta
- **E** nenhuma importação é processada parcialmente

> Diferente das demais features: importação **exige** conexão, porque processa no
> servidor. O que precisa ser tolerante é o envio.

### CA-OP · Cenário de operador

- **Dado** um usuário com perfil `operator`
- **Quando** ele usa o app
- **Então** não existe nenhuma tela, rota ou dado de importação acessível a ele
- **E** qualquer requisição a um endpoint de importação devolve 403

## Regras de negócio

1. Pipeline em cinco etapas: **staging → mapeamento → limpeza → validação → lote
   reversível** (skill `importacao-planilhas`).
2. Toda linha importada aponta para arquivo, aba e linha de origem.
3. Nenhuma correção é silenciosa; toda transformação é registrada e mostrada.
4. Toda importação é um **lote reversível**, desfazível por inteiro.
5. Conferência de totais é apresentada **antes** da confirmação.
6. `source = 'import'` + referência ao lote em todo registro (constitution §11).
7. A validação do importador é própria e mais tolerante; **jamais** se afrouxa a
   validação do lançamento novo.
8. Processa no **`worker`**, nunca no caminho de requisição. O job é idempotente.
9. Arquivo pode vir em **latin-1**: detectar, não assumir UTF-8.
10. Lançamento importado precisa das **duas datas**; quando a planilha só tem uma, ela
    vai para as duas e o registro é marcado (ver dúvida 4).

## Fora de escopo

- Importação de XML de nota fiscal — feature `014`.
- Importação da folha do Folhamatic — Fase 2.
- Importação contínua (planilha como fonte permanente). Isto é migração única.
- Conciliação automática entre histórico importado e dado nativo.
- OCR de documento em papel.

## Dúvidas abertas

| #   | Dúvida                                                                                                               | Para quem | Estado |
| --- | -------------------------------------------------------------------------------------------------------------------- | --------- | ------ |
| 1   | Quantos arquivos, quantas abas e quantos anos? Precisamos ver as planilhas reais antes de planejar.                  | produtor  | aberta |
| 2   | O layout é o mesmo entre fazendas e entre anos, ou cada um é diferente?                                              | produtor  | aberta |
| 3   | Até que ano vale a pena importar? Histórico antigo demais pode ter mais ruído que valor.                             | produtor  | aberta |
| 4   | As planilhas têm data de competência **e** de pagamento, ou só uma? Isso define a qualidade do histórico (ADR-0008). | produtor  | aberta |
| 5   | O gado antigo tem brinco individual na planilha, ou só quantidade por lote?                                          | produtor  | aberta |
| 6   | Os totais que o produtor quer conferir são quais, exatamente? A conferência precisa bater com o que ele já acredita. | produtor  | aberta |
