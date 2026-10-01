# 029 · Livro caixa rural digital e LCDPR

|                        |                                                                     |
| ---------------------- | ------------------------------------------------------------------- |
| **Estado**             | rascunho                                                            |
| **Fase**               | 2 (candidata à Fase 1 — ver dúvida 1)                              |
| **Depende de**         | `001-fundacao-multifazenda`, `009-lancamentos-financeiros-duas-datas`, `015`, `016` |
| **Princípios em jogo** | constitution §3, §4, §5, §11                                        |

---

## Problema

O livro caixa do produtor rural não é um relatório gerencial: é **obrigação acessória**
entregue à Receita Federal, em layout definido, por imóvel, no regime de **caixa**,
com participante identificado e conta bancária em cada lançamento.

Quem entrega hoje é o escritório contábil, reconstruindo o ano a partir das planilhas e
dos extratos. Isso significa que o livro é montado meses depois do fato, por alguém que
não estava lá, com a informação que sobrou. Erro nesse caminho não é erro de relatório
— é multa e retificação.

O produtor trouxe o ponto com clareza: *"fazendas com faturamento de mais de 4 milhões
são obrigadas a entregar o livro caixa rural"*. O valor exato do limite e a situação
das cinco fazendas precisam ser confirmados com o contador (dúvida 1) — mas a
consequência de projeto independe do número: **se a obrigação se aplica, o livro deixa
de ser conveniência e passa a ser requisito legal**, com prazo.

A boa notícia é que a maior parte da fundação já existe neste sistema: duas datas em
todo lançamento (ADR-0008), separação por fazenda com inscrição estadual própria
(constitution §3) e participante identificado (feature `016`). O que falta é a
escrituração formal e o arquivo no layout.

## Usuários e perfis afetados

| Perfil   | O que passa a fazer                                                   | O que **não** pode ver              |
| -------- | --------------------------------------------------------------------- | ----------------------------------- |
| Dono     | Acompanha a situação da escrituração e assina o que vai à Receita     | —                                   |
| Gerente  | Confere o livro, resolve as pendências e gera o arquivo               | —                                   |
| Operador | Nada — não tem superfície nesta feature                               | Tudo: 403                           |

## Histórias

- Como **gerente**, quero ver o livro caixa de cada imóvel, mês a mês, com saldo.
- Como **gerente**, quero a lista do que impede a escrituração: lançamento sem
  participante, sem conta, sem data de caixa.
- Como **dono**, quero gerar o arquivo no layout oficial e entregar ao contador sem
  retrabalho.
- Como **gerente**, quero que o período entregue fique travado contra alteração.

## Critérios de aceite

### CA-01 · Livro por imóvel, em regime de caixa

- **Dado** lançamentos com competência e caixa em meses diferentes (ADR-0008)
- **Quando** o livro caixa é montado
- **Então** cada lançamento entra pela **data de caixa**, no imóvel correspondente
- **E** o livro é apresentado por fazenda, com a inscrição estadual própria
  (constitution §3)
- **E** o saldo é acumulado por imóvel, nunca somado entre imóveis no mesmo livro

### CA-02 · Lançamento incompleto bloqueia e aparece na lista

- **Dado** um pagamento sem participante identificado, sem conta bancária ou sem data
  de caixa
- **Quando** o gerente abre a escrituração do período
- **Então** o lançamento aparece na lista de pendências, com o que falta nomeado
- **E** a geração do arquivo é bloqueada enquanto houver pendência
- **E** a lista permite ir direto ao lançamento para corrigir

### CA-03 · Participantes e contas bancárias

- **Dado** um lançamento de caixa
- **Quando** ele entra no livro
- **Então** carrega o participante identificado por CPF ou CNPJ (feature `016`,
  glossário: `counterparty`)
- **E** carrega a conta bancária vinculada à fazenda (glossário: `bank_account`)

### CA-04 · Arquivo no layout oficial

- **Dado** um período sem pendências
- **Quando** o gerente gera o arquivo
- **Então** o arquivo sai no layout vigente, com os registros de identificação,
  imóveis, participantes, contas e movimento
- **E** o sistema valida o arquivo contra as regras de formato antes de entregar
- **E** a versão do layout usada fica registrada na geração

### CA-05 · Conferência contra o extrato

- **Dado** o saldo do livro no fim do mês
- **Quando** há conciliação bancária disponível
- **Então** o sistema compara o saldo do livro com o saldo da conta
- **E** a diferença é apresentada antes da geração do arquivo

### CA-06 · Período entregue é travado

- **Dado** um período já entregue
- **Quando** alguém tenta alterar um lançamento daquele período
- **Então** a alteração é bloqueada
- **E** a correção só é possível por lançamento de ajuste em período aberto, ou por
  retificação formal, que fica registrada

### CA-07 · Histórico importado é identificável no livro

- **Dado** lançamentos vindos da importação das planilhas (feature `013`)
- **Quando** eles entram no livro
- **Então** continuam marcados com `source = 'import'` e o lote de origem
  (constitution §11)
- **E** o gerente consegue listar o que foi escriturado a partir de histórico importado

### CA-OFF · Cenário offline

- **Dado** que esta feature consolida a base inteira do período
- **Quando** o dispositivo está sem conexão
- **Então** o livro **já sincronizado** fica disponível em leitura, com a data da
  última sincronização visível
- **E** a geração e a validação do arquivo exigem conexão: acontecem no servidor, sobre
  a base completa
- **E** correções feitas offline em lançamentos entram pela outbox normalmente
  (constitution §1)

### CA-OP · Cenário de operador

- **Dado** um usuário com perfil `operator`
- **Quando** ele tenta acessar qualquer tela ou endpoint desta feature
- **Então** recebe 403
- **E** nada do livro caixa entra no payload de sync do dispositivo dele
  (constitution §6)

## Regras de negócio

1. O livro caixa é **regime de caixa**: usa `cash_date` (constitution §5, glossário).
2. A escrituração é **por imóvel**, com inscrição estadual própria; não há livro
   consolidado do grupo para fins fiscais.
3. **A obrigatoriedade, porém, é avaliada pelo produtor**, somando a receita de todos
   os imóveis — não fazenda a fazenda. Com cinco fazendas, a soma pode ultrapassar o
   limite sem que nenhuma delas o ultrapasse sozinha. Limite: do produtor.
   Escrituração: por imóvel. **Confirmar com o contador (dúvida 2).**
4. Participante e conta bancária são obrigatórios nos lançamentos que vão ao livro.
5. Pendência bloqueia a geração; o sistema nunca preenche campo obrigatório por
   suposição.
6. A versão do layout é **configurada e versionada**; mudança de layout da Receita não
   exige alteração de código de domínio.
7. Período entregue é travado; correção é por ajuste ou retificação registrada.
8. Registro importado permanece marcado (constitution §11).
9. Operador não tem superfície nesta feature (constitution §6).

## Fora de escopo

- Transmissão do arquivo à Receita — quem entrega é o contador.
- Apuração de imposto de renda da pessoa física do produtor.
- Conciliação bancária por OFX — feature `031` e Fase Financeiro e Fiscal.
- Exportação para o plano de contas do escritório — feature `015`.
- Enquadramento em IBS e CBS — feature `030`.

## Dúvidas abertas

| #   | Dúvida                                                                                                                                                       | Para quem | Estado |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------ |
| 1   | **Levantado: o limite é R$ 4,8 milhões** de receita bruta anual da atividade rural (IN RFB 1.848/2018). O produtor falou em R$ 4 mi. **As fazendas ultrapassam?** | contador  | aberta |
| 2   | Entendimento atual: **o limite é do produtor** (soma de todos os imóveis) e **a escrituração é por imóvel**. Confirmar — e dizer também se é "acima de" ou "a partir de" R$ 4,8 milhões, que as fontes divergem. Com cinco fazendas, a soma pode passar sem que nenhuma passe sozinha. | contador  | aberta |
| 3   | Quem entrega hoje e com qual sistema? Dá para ver um arquivo entregue do ano passado?                                                                        | contador  | aberta |
| 4   | Levantado: leiaute na **versão 1.3** (registros 0000, 0010, 0030, 0040, 0050, Q100, Q200, 9999). Confirmar se é a usada pelo escritório.                      | contador  | aberta |
| 5   | Levantado: o `Q100` reserva os códigos de conta **`000` (espécie)** e **`999` (recurso em trânsito)**. Isso cobre a despesa de campo sem conta bancária?      | contador  | aberta |
| 6   | Levantado: a janela de entrega de 2026 foi **23/03 a 31/05**, sobre a receita do ano anterior. Se a obrigação se aplica, **há prazo correndo** — isso puxa a feature para a Fase 1? | contador  | aberta |
| 7   | Existe conta bancária por fazenda, ou uma conta só para tudo? Sem separação, o livro por imóvel fica difícil.                                                | produtor  | aberta |
