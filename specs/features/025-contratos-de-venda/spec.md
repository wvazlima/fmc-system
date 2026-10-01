# 025 · Contratos de venda gerados pelo sistema

|                        |                                                                     |
| ---------------------- | ------------------------------------------------------------------- |
| **Estado**             | rascunho                                                            |
| **Fase**               | Financeiro e Fiscal                                                 |
| **Depende de**         | `016-cadastro-contrapartes`, `011-vendas-logistica-preco-liquido`   |
| **Princípios em jogo** | constitution §4, §5, §6, §9                                         |

---

## Problema

A venda é combinada no telefone e confirmada no WhatsApp. Quando há contrato, ele é
redigitado a cada negócio, num documento antigo que alguém copiou e ajustou — e os
erros aparecem onde doem: volume, prazo de entrega, condição de pagamento.

Pior que o contrato errado é o contrato esquecido. Vendidas 1.500 sacas para entrega
em três parcelas, ninguém controla o saldo: entregou 500, entregou mais 400, e o que
falta só aparece quando o comprador cobra.

O pedido foi "o sistema gera o contrato para o cliente". O que o sistema pode fazer é
**preencher a minuta que o advogado do produtor definiu** com os dados que já estão
no sistema, numerar, versionar e acompanhar o saldo de entrega. O que ele não pode
fazer é escrever cláusula — nem por modelo nem por IA.

## Usuários e perfis afetados

| Perfil   | O que passa a fazer                                                   | O que **não** pode ver                 |
| -------- | --------------------------------------------------------------------- | -------------------------------------- |
| Dono     | Aprova e acompanha os contratos e o saldo a entregar                  | —                                      |
| Gerente  | Gera o contrato a partir da negociação, registra aditivos e entregas  | —                                      |
| Operador | Registra o carregamento vinculado à entrega                           | Preço, valor total, condição, contrato |

## Histórias

- Como **gerente**, quero gerar o contrato já preenchido com os dados da negociação.
- Como **gerente**, quero registrar cada entrega e ver o saldo que falta.
- Como **dono**, quero ver todos os contratos abertos e quanto eles comprometem da
  safra.
- Como **gerente**, quero registrar um aditivo sem perder a versão anterior.

## Critérios de aceite

### CA-01 · Geração a partir de dados já existentes

- **Dado** uma negociação com contraparte, produto, volume, preço, condição de entrega
  e prazo de pagamento
- **Quando** o gerente gera o contrato
- **Então** o documento sai preenchido com esses dados, sem redigitação
- **E** recebe numeração sequencial por organização, única e não reutilizável

### CA-02 · A minuta é do produtor, não do sistema

- **Dado** um modelo de contrato cadastrado pelo produtor
- **Quando** o documento é gerado
- **Então** o texto das cláusulas vem **integralmente do modelo cadastrado**
- **E** o sistema apenas substitui campos identificados
- **E** nenhuma cláusula é redigida, sugerida ou alterada pelo sistema ou por IA

### CA-03 · Saldo de entrega

- **Dado** um contrato de 1.500 sacas
- **Quando** foram entregues 500 e depois 400
- **Então** o saldo é de **600 sacas**, visível no contrato e no painel
- **E** cada entrega é vinculada ao romaneio, à nota e ao lote correspondente
- **E** entrega acima do saldo é bloqueada até virar aditivo

### CA-04 · Versão e aditivo

- **Dado** um contrato assinado que sofre alteração de prazo
- **Quando** o aditivo é registrado
- **Então** nasce uma nova versão, com o que mudou destacado
- **E** a versão anterior permanece acessível, íntegra
- **E** o documento gerado anteriormente **não** é sobrescrito

### CA-05 · Reflexo no financeiro

- **Dado** um contrato com pagamento em três parcelas
- **Quando** cada entrega é efetivada
- **Então** são gerados os lançamentos com duas datas correspondentes (ADR-0008)
- **E** o contrato mostra, lado a lado, o entregue, o faturado e o recebido

### CA-06 · Contrato comprometendo safra

- **Dado** contratos abertos somando 2.400 sacas e uma produção estimada de 2.000
- **Quando** o dono abre o painel
- **Então** o sistema apresenta o volume comprometido contra o disponível e sinaliza o
  excesso
- **E** apresenta o fato sem recomendar ação (constitution §7)

### CA-07 · Documento guardado com integridade

- **Dado** um contrato gerado
- **Quando** ele é armazenado
- **Então** o arquivo vai para o storage da nuvem, com hash do conteúdo registrado
- **E** o dado de negócio permanece no Cloud SQL (constitution §9)
- **E** o nome do arquivo é normalizado, nunca usado direto em caminho
  (`.claude/rules/security.md`)

### CA-OFF · Cenário offline

- **Dado** que o gerente está sem conexão e fecha uma negociação
- **Quando** registra os termos acordados
- **Então** o registro é gravado localmente com UUID v7 do cliente e aparece como
  `pendente`
- **E** a **geração do documento final exige conexão** — offline, o contrato fica como
  rascunho não numerado
- **E** a numeração sequencial é atribuída pelo servidor, uma única vez, de forma
  idempotente

> Numeração sequencial é a exceção à regra de ID no cliente: ela precisa ser contínua e
> sem buraco, o que só o servidor garante. O **identificador** do registro continua
> sendo UUID v7 do cliente (constitution §2).

### CA-OP · Cenário de operador

- **Dado** um operador alocado na fazenda A
- **Quando** ele registra o carregamento de uma entrega
- **Então** informa volume, placa e data
- **E** não recebe preço, valor do contrato, condição de pagamento nem o documento
  (constitution §6)
- **E** ao tentar acessar contrato de venda da fazenda B, recebe 403

## Regras de negócio

1. O modelo de contrato é cadastrado pelo produtor; o sistema só preenche campos.
2. Numeração é sequencial por organização, atribuída pelo servidor, sem lacuna.
3. Contrato tem estados: `draft`, `issued`, `signed`, `partially_delivered`,
   `delivered`, `settled`, `cancelled`.
4. Alteração de contrato emitido só por **aditivo**, com nova versão; versões antigas
   são imutáveis.
5. Entrega consome saldo; entrega acima do saldo exige aditivo.
6. Faturamento e recebimento geram lançamentos com duas datas (constitution §5).
7. O sistema nunca redige, sugere ou revisa cláusula — inclusive a IA
   (constitution §7).
8. Operador nunca recebe valor (constitution §6).

## Fora de escopo

- Assinatura eletrônica e certificado digital — ver dúvida 3.
- Contrato de compra de insumo e barter — feature `018`, dúvida 6.
- Análise de risco de crédito do comprador.
- Emissão de NF-e vinculada à entrega — Fase Financeiro e Fiscal.
- Contrato futuro e trava de preço em bolsa — feature `021`, fora de escopo.

## Dúvidas abertas

| #   | Dúvida                                                                                                               | Para quem | Estado |
| --- | ---------------------------------------------------------------------------------------------------------------------- | --------- | ------ |
| 1   | Existe contrato escrito hoje nas vendas de café e de gado, ou o acerto é verbal?                                     | produtor  | aberta |
| 2   | Qual a minuta usada? Precisamos do documento real para mapear os campos.                                             | produtor  | aberta |
| 3   | A assinatura precisa ser eletrônica com validade jurídica? Isso implica provedor contratado e custo por documento.   | produtor  | aberta |
| 4   | A venda via cooperativa tem contrato próprio da cooperativa? Nesse caso, o sistema só registra, não gera.            | produtor  | aberta |
| 5   | Existe venda com entrega parcelada hoje? Com que frequência o saldo é perdido de vista?                              | produtor  | aberta |
| 6   | Contrato de venda futura muda o momento de reconhecer a receita no livro caixa?                                      | contador  | aberta |
