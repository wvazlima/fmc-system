# ADR-0015 · Entrada primária de dados no escritório, com o campo como segunda superfície

|               |            |
| ------------- | ---------- |
| **Data**      | 2026-09-30 |
| **Estado**    | proposto   |
| **Substitui** | —          |

## Contexto

O projeto foi desenhado assumindo que o dado entra no campo, pelo celular de quem está
no curral ou no talhão. O levantamento com **Euzébio, gestor das cinco fazendas**
(2026-09-30, por WhatsApp) mostrou que hoje não é assim que o dado é produzido.

**Fatos do levantamento:**

- Passam **100 a 300 animais por mês**, com variação grande de mês para mês.
- O controle de gado é **individual por animal**, com prenhez e exames — não só por lote.
  Isso confirma o recorte das features `003-gado-entrada-e-lotes` e
  `004-gado-manejo-e-prenhez`.
- **Quem lança é uma secretária no escritório, dedicada exclusivamente a isso.** O
  campeiro passa a informação do campo e ela digita no sistema.
- Café: 10 talhões, 80 hectares, com plantio em expansão. Venda via cooperativa.
- Os funcionários trabalham em todas as frentes, e o custo de mão de obra já é lançado
  individualmente por talhão.
- Insumo é comprado por aplicação, não em volume estocado.

O que decorre disso: a pessoa que mais vai usar o sistema na Fase 1 está sentada, com
teclado, digitando em série. Uma tela projetada para uma mão enluvada no sol — alvo de
44 px, um caminho curto por tela — é a pior ferramenta possível para lançar 300 animais
e seus eventos. Se a digitação for lenta, ela não migra da planilha, e sem o dado de
entrada nada mais do sistema entrega valor.

**Suposições ainda não confirmadas** (nenhuma delas invalida a decisão, mas todas
mudam o dimensionamento da tela):

- Não se sabe se os 100–300 animais/mês são entradas, saídas ou a soma dos dois.
- Não se sabe em que ferramenta a secretária digita hoje — planilha ou software de
  pecuária.
- Não se sabe por qual meio o campeiro repassa a informação: papel, telefone ou áudio.
- A pergunta "qual decisão você quer tomar que hoje a planilha não permite" ainda não
  foi respondida.

**Tensão com a constitution §8, identificada e assumida:** a §8 diz que "o desktop é a
segunda tela, não a primeira". Este ADR **não altera a constitution** e não declara que
o desktop passa a ser a primeira tela em geral. A §8 continua valendo integralmente para
as telas de campo — operador, curral, talhão. O que este ADR acrescenta é uma **segunda
superfície**, de escritório, na qual os critérios obrigatórios da §8 (alvo de 44 px,
caminho comum numa tela sem rolagem) não se aplicam e seriam contraproducentes: ali o
critério de qualidade é velocidade de digitação. Mudar o texto da §8 exigiria um ADR
próprio; não é o que se faz aqui.

## Decisão

Na Fase 1, a superfície de entrada que recebe **prioridade de projeto e de entrega** é a
**tela de digitação em série no desktop**, usada pelo escritório:

1. Navegação **por teclado**, sem necessidade de mouse em nenhum passo do caminho comum.
2. **Foco que avança sozinho** entre campos e entre linhas.
3. **Repetição do último valor** nos campos que se repetem entre animais e entre eventos.
4. Lançamento de **muitos animais e muitos eventos numa única sessão**, sem sair da tela.
5. Densidade de informação de escritório: muitas linhas visíveis, não um campo por tela.

O celular no campo **continua existindo e continua offline-first**, mas deixa de ser o
caminho por onde o dado entra no dia 1.

Esta decisão é sobre **prioridade de entrega e critério de projeto de UI**. Ela não
altera nada abaixo da UI:

- A tela de escritório é **o mesmo PWA**. Lê e escreve no **Dexie** e passa pela **mesma
  outbox** (constitution §1, ADR-0004), com os mesmos UUID v7 gerados no cliente e a
  mesma idempotência (ADR-0009).
- A restrição da constitution §6 continua integral: **operador nunca recebe dado
  financeiro**, em nenhuma superfície.
- Mesmas rotas, mesma checagem de perfil e fazenda, mesmo schema local, mesmo caminho de
  sync.

## Alternativas consideradas

### A · Manter o mobile como entrada única, e a secretária usar o PWA mobile no navegador do desktop

- **A favor:** zero trabalho extra, uma superfície só para projetar, testar e manter, e
  coerência total com a constitution §8. É a leitura mais literal do que já foi decidido.
- **Contra:** digitar 100 a 300 animais por mês com alvos de 44 px e caminho curto de um
  passo por tela multiplica o número de toques e de trocas de contexto por lançamento.
- **Por que não:** a secretária volta para a planilha e o sistema não é adotado. O
  requisito que a §8 protege — "se o lançamento não for fácil, ele não acontece" — é
  exatamente o requisito que essa alternativa viola, só que para a pessoa que de fato
  digita hoje.

### B · Importação por planilha como via de entrada do escritório

A secretária continua na planilha; o sistema importa periodicamente, pela feature `013`.

- **A favor:** aproveita uma feature já prevista na Fase 1, não exige tela nova, não
  pede treinamento e respeita integralmente a rotina existente. É a alternativa de menor
  atrito de adoção no curto prazo.
- **Contra:** mantém a planilha como fonte de verdade; a validação sai do momento do
  lançamento e vira conferência de arquivo; a data real do evento se perde — sobra a data
  da importação.
- **Por que não:** transforma o produto num conversor de arquivo. Além disso, o
  histórico importado é marcado como tal por princípio (constitution §11): tratar a
  entrada corrente como importação significaria carregar a operação do dia a dia com
  `source = 'import'` e validação frouxa permanentemente.

### C · Duas aplicações separadas, uma de escritório e uma de campo

- **A favor:** cada superfície otimizada sem concessão, com dependências e ciclo de
  release próprios; a de escritório poderia até dispensar offline, ficando bem mais
  simples.
- **Contra:** dobra a superfície de UI a manter e duplica autorização, schema local e
  sync — as três áreas onde um erro é vazamento de dado, não bug de tela.
- **Por que não:** quebraria o ADR-0002 (monorepo com pacotes compartilhados) e o
  ADR-0003 (monólito modular) sem necessidade. As duas superfícies compartilham o mesmo
  domínio, o mesmo Dexie e a mesma outbox; o que difere é a camada de apresentação, e
  isso se resolve com telas diferentes, não com aplicações diferentes.

## Consequências

**Positivas**

- O dado entra onde ele de fato é digitado hoje, pela pessoa que hoje digita.
- O volume de 100 a 300 animais por mês deixa de ser gargalo de UX.
- A validação acontece **no ato do lançamento**, não na conferência de uma importação.

**Negativas e custos aceitos**

- Uma segunda superfície de UI a projetar e testar, **não prevista na estimativa
  original** da Fase 1.
- O ganho do offline-first fica adiado: ele só se paga de verdade quando o campeiro
  lançar direto, sem intermediação.
- Risco de o desktop virar o padrão de projeto por comodidade e as telas de campo
  ficarem para trás.

**O que passa a ser proibido**

- Aplicar o critério de 44 px como se fosse universal — e, no sentido inverso, desenhar
  tela de campo com densidade de escritório. Cada superfície tem seu critério: campo pela
  §8, escritório pela velocidade de digitação.
- Criar **rota, autorização, schema local ou caminho de sync próprios** para a tela de
  escritório. É o mesmo domínio, a mesma outbox e a mesma checagem de perfil e fazenda.
- Tratar a tela de escritório como exceção ao offline-first: ela também lê e escreve no
  Dexie e enfileira na outbox.

## Como verificar que a decisão está sendo respeitada

- `.claude/rules/web.md` e a skill `ui-mobile-first` passam a distinguir as duas
  superfícies: o critério da §8 vale para as telas de campo; a tela de escritório é
  avaliada por caminho completo no teclado.
- O agente `sync-auditor` continua sendo o verificador de que a tela de escritório não
  escreve fora da outbox e não tem caminho de sync próprio.
- O agente `security-reviewer` verifica que nenhuma rota nova nasceu para servir a tela
  de escritório sem checagem de perfil e fazenda.
- Os critérios `CA-OFF` e `CA-OP` do template de spec continuam obrigatórios em toda
  feature, inclusive nas que só têm tela de escritório.

## Pendências que este ADR não resolve

O estado é **proposto**. Passar para `aceito` depende de:

- resposta às quatro suposições listadas no Contexto;
- confirmação do produtor de que a prioridade de entrega no escritório é aceitável para
  o marco de gado da Fase 1.
