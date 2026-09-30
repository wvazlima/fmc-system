# 014 · Importação de XML de notas fiscais

|                        |                                          |
| ---------------------- | ---------------------------------------- |
| **Estado**             | rascunho                                 |
| **Fase**               | 1                                        |
| **Depende de**         | `009-lancamentos-financeiros-duas-datas` |
| **Princípios em jogo** | constitution §3, §5, §6, §11             |

---

## Problema

Toda compra de insumo, peça, combustível e serviço chega com uma NF-e, e o XML dela
tem exatamente o que o lançamento precisa: emitente com CNPJ, data de emissão, valor
total, itens com descrição, quantidade e valor unitário.

Hoje alguém digita isso de novo, a partir do DANFE impresso. Digitação errada é a fonte
mais comum de custo errado — e quando o custo por saca está errado, ninguém desconfia
do valor digitado.

Esta feature entrega a importação **manual** do XML: o gerente envia os arquivos e o
sistema monta os lançamentos para conferência. A captura automática dos XMLs é da Fase
Financeiro e Fiscal.

## Usuários e perfis afetados

| Perfil   | O que passa a fazer                                           | O que **não** pode ver |
| -------- | ------------------------------------------------------------- | ---------------------- |
| Dono     | Vê os lançamentos com o documento fiscal vinculado            | —                      |
| Gerente  | Envia XMLs, confere, classifica por frente e talhão, confirma | —                      |
| Operador | Nada                                                          | **Tudo**               |

## Histórias

- Como **gerente**, quero enviar os XMLs do mês e que o sistema monte os lançamentos
  sozinho, para eu só conferir e classificar.
- Como **gerente**, quero que o sistema reconheça um fornecedor que já usei e sugira a
  mesma classificação da última vez.
- Como **gerente**, quero distribuir os itens de uma nota entre talhões diferentes.
- Como **dono**, quero abrir um lançamento e ver a nota que o originou.

## Critérios de aceite

### CA-01 · Leitura do XML

- **Dado** um arquivo XML de NF-e válido
- **Quando** ele é enviado
- **Então** o sistema extrai emitente (nome e CNPJ), número, série, chave de acesso,
  data de emissão, valor total e os itens
- **E** o XML original é guardado no storage, vinculado ao lançamento

### CA-02 · Chave de acesso é única

- **Dado** um XML já importado
- **Quando** o mesmo arquivo é enviado de novo
- **Então** o sistema reconhece pela **chave de acesso** e avisa, sem duplicar

### CA-03 · Lançamento em rascunho

- **Dado** um XML lido
- **Quando** o lançamento é montado
- **Então** ele nasce como **rascunho**, aguardando conferência
- **E** `accrual_date` é pré-preenchida com a data de emissão, e `cash_date` fica em
  aberto até o gerente informar o pagamento (ADR-0008)
- **E** nada entra no custo antes da confirmação

### CA-04 · Participante reconhecido

- **Dado** um emitente cujo CNPJ já existe como participante
- **Quando** o XML é lido
- **Então** o participante existente é reutilizado, não duplicado
- **E** a classificação usada da última vez para esse participante é **sugerida**

### CA-05 · Distribuição de itens

- **Dado** uma nota com adubo destinado a três talhões
- **Quando** o gerente distribui os itens
- **Então** cada parcela vira um custo do talhão correspondente
- **E** a soma das parcelas é **exatamente** o valor da nota

### CA-06 · Nota que atravessa fazendas

- **Dado** uma nota única com itens para duas fazendas
- **Quando** o gerente distribui
- **Então** cada parcela recebe o `farm_id` correto (constitution §3)
- **E** o documento fiscal fica vinculado a todas as parcelas

### CA-07 · XML inválido ou de outro modelo

- **Dado** um arquivo que não é NF-e, está corrompido ou tem o produtor como
  destinatário errado
- **Quando** ele é enviado
- **Então** é rejeitado com motivo em pt-BR
- **E** nenhuma importação parcial acontece

### CA-08 · Rastreabilidade

- **Dado** um lançamento originado de XML
- **Quando** o dono o abre
- **Então** vê número, série, chave de acesso e emitente
- **E** consegue baixar o XML original

### CA-OFF · Cenário offline

- **Dado** que esta feature roda no escritório e o processamento é um job do `worker`
- **Quando** não há conexão
- **Então** o envio fica pendente e é retomado quando a conexão volta
- **E** nenhum XML é processado parcialmente

### CA-OP · Cenário de operador

- **Dado** um usuário com perfil `operator`
- **Quando** ele usa o app
- **Então** não existe nenhuma tela, rota ou dado de nota fiscal acessível a ele
- **E** qualquer requisição a um endpoint de notas devolve 403

## Regras de negócio

1. O XML é a **fonte**; o lançamento é o **derivado**. O original é sempre guardado.
2. **Chave de acesso** é única — é o que impede importar a mesma nota duas vezes.
3. Lançamento nasce em **rascunho**; nada entra no custo sem conferência.
4. `accrual_date` vem da emissão; `cash_date` é informada no pagamento (ADR-0008).
5. Participante identificado por CNPJ, reutilizado quando já existe
   (skill `integracao-contabil`).
6. Item distribuído entre talhões ou fazendas: a soma fecha com o valor da nota.
7. Registro carrega `source = 'import'` (constitution §11).
8. Processa no **`worker`**; o job é idempotente.
9. Encoding e acentuação: XML de NF-e é UTF-8, mas validar em vez de assumir.
10. **Operador não acessa nada aqui** (constitution §6).

## Fora de escopo

- **Captura automática** dos XMLs (consulta à SEFAZ, caixa de e-mail) — Fase Financeiro
  e Fiscal.
- Emissão de NF-e e MDF-e — Fase Financeiro e Fiscal.
- Conferência de impostos e escrituração fiscal.
- Conciliação entre nota, pedido de compra e recebimento — Fase Financeiro e Fiscal.
- CT-e e nota de serviço (NFS-e) municipal, cujo layout varia por município.
- Leitura de DANFE em PDF ou por OCR.

## Dúvidas abertas

| #   | Dúvida                                                                                                       | Para quem | Estado |
| --- | ------------------------------------------------------------------------------------------------------------ | --------- | ------ |
| 1   | Quem tem os XMLs hoje — o produtor ou o escritório contábil? Em que formato chegam?                          | contador  | aberta |
| 2   | Qual o volume mensal de notas de entrada?                                                                    | produtor  | aberta |
| 3   | O contador já faz a entrada dessas notas? Se sim, haveria duplicidade de trabalho — ou substituímos o fluxo? | contador  | aberta |
| 4   | Nota de serviço (NFS-e) é relevante? O layout muda por município e isso é um projeto à parte.                | contador  | aberta |
| 5   | A distribuição de itens por talhão é viável na prática, ou a nota é sempre de uma fazenda só?                | produtor  | aberta |
| 6   | CT-e (frete) precisa entrar na Fase 1, dado que frete afeta o preço líquido (feature `011`)?                 | produtor  | aberta |
