# 016 · Cadastro de contrapartes: fornecedores e clientes

|                        |                                                   |
| ---------------------- | ------------------------------------------------- |
| **Estado**             | rascunho                                          |
| **Fase**               | 1                                                 |
| **Depende de**         | `001-fundacao-multifazenda`                       |
| **Princípios em jogo** | constitution §3, §6, §11                          |

---

## Problema

Toda compra tem um fornecedor e toda venda tem um comprador, mas hoje esse nome só
existe como texto solto na planilha: "Agro Minas", "agrominas", "Agro Minas Ltda" e
"AGROMINAS" são a mesma empresa em quatro linhas diferentes. Não dá para responder
quanto se comprou daquele revendedor no ano, nem comparar o preço que ele cobra com o
do concorrente, nem saber se o mesmo fornecedor atende três fazendas por preços
diferentes.

O problema não é de cadastro, é de consequência. Sem contraparte identificada por
CPF ou CNPJ:

- o **LCDPR não fecha** — participante é campo obrigatório do layout (glossário:
  `counterparty`);
- a **nota fiscal importada** não casa com ninguém (feature `014`);
- a **comparação de preço entre fornecedores** não existe (features `018` e `027`);
- o **contrato de venda** não tem a quem endereçar (feature `025`).

É cadastro de fundação: quatro features dependem dele e nenhuma consegue ser
construída antes.

## Usuários e perfis afetados

| Perfil   | O que passa a fazer                                             | O que **não** pode ver                            |
| -------- | --------------------------------------------------------------- | ------------------------------------------------- |
| Dono     | Consulta o histórico por contraparte                            | —                                                 |
| Gerente  | Cadastra, edita e inativa fornecedores e clientes               | —                                                 |
| Operador | No máximo escolhe o fornecedor já cadastrado numa aplicação     | CPF/CNPJ, histórico de compras, valores, contatos |

## Histórias

- Como **gerente**, quero cadastrar um fornecedor uma vez e reutilizá-lo em todas as
  fazendas, sem redigitar.
- Como **gerente**, quero que o sistema recuse um CNPJ repetido, para não ter o mesmo
  fornecedor duas vezes.
- Como **dono**, quero ver quanto comprei de cada fornecedor no ano, por fazenda e no
  consolidado.
- Como **gerente**, quero que a nota fiscal importada encontre sozinha o fornecedor
  pelo CNPJ.

## Critérios de aceite

### CA-01 · Uma contraparte, vários papéis

- **Dado** uma empresa que vende insumo e também compra café
- **Quando** o gerente a cadastra
- **Então** ela é um único registro com os papéis `supplier` e `customer` marcados
- **E** aparece nas duas listas, sem duplicar o cadastro

### CA-02 · Documento único e validado

- **Dado** um CNPJ já cadastrado na organização
- **Quando** o gerente tenta cadastrar outro com o mesmo documento
- **Então** o sistema recusa, mostra o cadastro existente e oferece abri-lo
- **E** CPF e CNPJ têm o dígito verificador validado na entrada (Zod, na borda)

### CA-03 · A contraparte é da organização, não da fazenda

- **Dado** um fornecedor cadastrado a partir de uma compra da fazenda A
- **Quando** o gerente lança uma compra na fazenda B
- **Então** o mesmo fornecedor está disponível, sem novo cadastro
- **E** o histórico mostra o total por fazenda **e** o consolidado

### CA-04 · Histórico por contraparte

- **Dado** um fornecedor com compras em três fazendas
- **Quando** o dono abre a ficha dele
- **Então** vê total comprado no período, número de notas, última compra e os itens
  mais comprados
- **E** os números vêm de consulta ao banco, nunca de estimativa (constitution §4)

### CA-05 · Inativar, nunca apagar

- **Dado** um fornecedor com lançamentos históricos
- **Quando** o gerente o inativa
- **Então** ele deixa de aparecer nas listas de seleção
- **E** continua visível nos lançamentos antigos e nos relatórios do período

### CA-06 · Casamento automático pela nota

- **Dado** um XML de NF-e importado (feature `014`) cujo emitente já está cadastrado
- **Quando** a nota é processada
- **Então** o fornecedor é vinculado automaticamente pelo CNPJ
- **E** se não existir, o sistema propõe o cadastro já preenchido com os dados do XML,
  para confirmação humana

### CA-07 · Contraparte importada é marcada

- **Dado** uma contraparte criada pela importação do histórico (feature `013`)
- **Quando** ela é gravada
- **Então** tem `source = 'import'` e referência ao lote de importação
  (constitution §11)

### CA-OFF · Cenário offline

- **Dado** que o gerente está sem conexão e precisa lançar uma compra de um fornecedor
  novo
- **Quando** ele cadastra a contraparte
- **Então** o registro é gravado no banco local com UUID v7 do cliente e aparece como
  `pendente`
- **E** já pode ser usada no lançamento imediatamente, ainda offline
- **E** ao sincronizar, se o mesmo documento tiver sido cadastrado por outra pessoa, o
  conflito é apresentado para fusão manual — nunca resolvido em silêncio

### CA-OP · Cenário de operador

- **Dado** um operador alocado na fazenda A
- **Quando** ele registra uma aplicação de insumo e escolhe o fornecedor
- **Então** recebe apenas `id` e nome fantasia das contrapartes ativas
- **E** não recebe CPF, CNPJ, endereço, contato, nem qualquer valor ou histórico de
  compra — o campo não entra na projeção da consulta (constitution §6)
- **E** não tem acesso à tela de cadastro
- **E** ao tentar acessar contraparte fora do escopo dele, recebe 403

## Regras de negócio

1. Contraparte é `counterparty` (glossário), raiz na `organization`, **não** na fazenda.
2. Papéis são um conjunto: `supplier`, `customer`, `carrier`, `employee`, `other`. Uma
   contraparte pode ter mais de um.
3. Documento (CPF ou CNPJ) é único por organização e validado por dígito verificador.
4. Contraparte sem documento é permitida apenas como rascunho local; **não** pode ser
   usada em lançamento que vá para o LCDPR.
5. Inativação é lógica. Exclusão física só é possível se não houver nenhum vínculo.
6. Nome completo, CPF/CNPJ, endereço, telefone e e-mail **nunca** entram em log
   (`.claude/rules/security.md`, LGPD).
7. A ficha da contraparte traz endereço de entrega e inscrição estadual quando houver —
   são necessários para NF-e na Fase Financeiro e Fiscal.
8. A tela de digitação do escritório (ADR-0015) permite cadastro rápido no meio do
   lançamento, sem sair da tela.

## Fora de escopo

- Avaliação ou nota de fornecedor — feature `027`.
- Limite de crédito e análise de risco do cliente.
- Consulta automática de CNPJ em serviço externo (Receita, Serpro) — depende de
  licença e de custo por consulta (constitution §10); fica como dúvida 4.
- Cadastro de funcionário com vínculo trabalhista — frente pessoal, Fase 1, outra spec.
- Emissão de documento fiscal para a contraparte — Fase Financeiro e Fiscal.

## Dúvidas abertas

| #   | Dúvida                                                                                                        | Para quem | Estado |
| --- | ------------------------------------------------------------------------------------------------------------- | --------- | ------ |
| 1   | Quantos fornecedores ativos existem hoje, aproximadamente? E compradores?                                     | produtor  | aberta |
| 2   | Os mesmos fornecedores atendem as cinco fazendas, ou cada região tem os seus?                                 | produtor  | aberta |
| 3   | Existe fornecedor que também é comprador (cooperativa, por exemplo)? É o caso da cooperativa do café?         | produtor  | aberta |
| 4   | Vale pagar consulta automática de CNPJ, ou o cadastro é sempre digitado e conferido pela secretária?          | produtor  | aberta |
| 5   | O LCDPR exige participante em todo lançamento ou só acima de um valor? Como tratar despesa sem participante?  | contador  | aberta |
| 6   | Nas planilhas atuais, o fornecedor aparece com documento ou só com nome? Isso define o esforço da feature 013. | produtor  | aberta |
