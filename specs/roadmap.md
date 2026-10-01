# Roadmap

Quatro blocos de entrega. O escopo comercial está em `docs/`; aqui está o recorte
técnico, com a feature correspondente em `specs/features/` quando já existe spec.

Prazo de referência da Fase 1: **16 semanas** a partir da assinatura, com marco de
gado em uso nas 5 fazendas na semana 8.

---

## Fase 1 · MVP

Objetivo: substituir as planilhas. Ao fim da fase, o produtor lança no campo, o gerente
fecha o mês e o contador recebe a exportação.

| #   | Feature                                                                          | Spec                                     |
| --- | -------------------------------------------------------------------------------- | ---------------------------------------- |
| 1   | Fundação multi-fazenda: organização, fazendas com IE, usuários, perfis, alocação | `001-fundacao-multifazenda`              |
| 2   | Sincronização offline: protocolo, outbox, idempotência, conflitos, iOS           | `002-sync-offline`                       |
| 3   | Gado: entrada e lotes                                                            | `003-gado-entrada-e-lotes`               |
| 4   | Gado: manejo e prenhez                                                           | `004-gado-manejo-e-prenhez`              |
| 5   | Gado: transferência entre fazendas                                               | `005-gado-transferencia-entre-fazendas`  |
| 6   | Gado: venda e margem                                                             | `006-gado-venda-e-margem`                |
| 7   | Café: talhões e safras                                                           | `007-cafe-talhoes-e-safras`              |
| 8   | Café: aplicações e custos                                                        | `008-cafe-aplicacoes-e-custos`           |
| 9   | Lançamentos financeiros com duas datas                                           | `009-lancamentos-financeiros-duas-datas` |
| 10  | Rateio de custos compartilhados                                                  | `010-rateio-custos-compartilhados`       |
| 11  | Vendas, logística e preço líquido na porteira                                    | `011-vendas-logistica-preco-liquido`     |
| 12  | Mapa de talhões e pacote offline (PMTiles)                                       | `012-mapa-talhoes-e-pacote-offline`      |
| 13  | Importação do histórico das planilhas                                            | `013-importacao-historico-planilhas`     |
| 14  | Importação de XML de notas fiscais                                               | `014-importacao-xml-notas-fiscais`       |
| 15  | Exportação contábil em planilha                                                  | `015-exportacao-contabil-planilha`       |
| 16  | Cadastro de contrapartes: fornecedores e clientes                                | `016-cadastro-contrapartes`              |
| 17  | Estoque de insumos e almoxarifado — **escopo a confirmar**                       | `017-estoque-de-insumos`                 |
| 24  | Leilão: venda de lote em pregão                                                  | `024-venda-em-leilao`                    |

As features 16, 17 e 24 vieram dos insumos de **2026-09-30** e **não estavam na
estimativa original das 16 semanas** — ver "Insumos de 2026-09-30", no fim deste
documento.

Ainda sem spec, previstos na Fase 1:

- Lavouras eventuais (milho para silagem e grão) com transferência interna de custo.
- Frente pessoal (casa, jardim, despesas dos proprietários), separada do produtivo.
- Painel consolidado do grupo e por fazenda.

### Cronograma

| Semanas | Trabalho                                                                     |
| ------- | ---------------------------------------------------------------------------- |
| 1–2     | Levantamento, coleta das planilhas, reunião com o contador                   |
| 2–5     | Base: fazendas, perfis, offline e sync (features 001 e 002)                  |
| 4–8     | Gado, com transferências (003 a 006) — **marco: gado em uso nas 5 fazendas** |
| 8–12    | Café, lavouras eventuais e pessoal (007 a 010)                               |
| 10–12   | Mapa dos talhões por fazenda (012)                                           |
| 12–14   | Importação do histórico e exportação contábil (013 a 015)                    |
| 14–16   | Testes nas fazendas, ajustes e treinamento — **entrega final**               |

---

## Fase 2 · Inteligência e integração contábil

Começa após 1 a 2 meses de uso real da Fase 1.

- **Serviço `agent`** (novo): assistente agronômico via Vertex AI (Claude/Gemini) com
  tools. Números sempre vindos de tools determinísticas (constitution §4); nunca
  prescreve defensivo nem dose (§7).
- **Integração com o Folhamatic**: importação da folha por arquivo texto, distribuição
  de salários e encargos por fazenda e por frente.
- **Livro caixa e LCDPR** (`029-livro-caixa-e-lcdpr`): livro caixa digital do produtor
  rural, regime de caixa, por imóvel, com participantes e contas bancárias, no layout
  oficial. **Sendo obrigação legal, é candidata a subir para a Fase 1** — depende da
  confirmação do contador.
- **Lançamento por áudio e foto**: o funcionário fala o que fez, o sistema monta o
  lançamento para conferência.
- **Relatórios com o assistente**: resumo semanal e relatório mensal de safra, gado e
  financeiro.
- **Clima por fazenda**: Google Weather API, chuva acumulada, pluviômetro no app,
  alertas de veranico, geada e excesso de chuva.
- **Vigor por satélite (NDVI)**: pipeline Python sobre Sentinel-2, série semanal por
  talhão, comparação entre talhões e entre fazendas.
- **Simulador de propostas**: compara propostas de venda pelo preço líquido na porteira.
- **Rastreabilidade de lotes de café**: talhão → colheita → secagem → armazém → venda,
  viabilizando a venda como café especial.
- **Armazém, umidade e perda de peso** (`019-armazem-estocagem-e-umidade`): custo de
  estocagem por competência e a perda de peso do café guardado.
- **Perdas de produção** (`020-perdas-de-producao`): morte de animal, perda de colheita
  e perda de insumo, com causa classificada.
- **Carregar ou vender** (`021-carregar-ou-vender-cafe`): preço de equilíbrio do
  carregamento — perdas e custo de armazém contra a valorização da saca.
- **Qualidade do café** (`022-qualidade-do-cafe`): classificação por lote, devolvida ao
  talhão de origem.
- **Cotações de mercado** (`023-cotacoes-de-mercado`): saca, arroba e câmbio, com
  referência manual enquanto não houver licença (constitution §10).
- **Sentinela de desvio** (`026-sentinela-de-desvio`): esperado × realizado em estoque,
  dose por talhão e contagem de rebanho. Aponta divergência, nunca pessoa.
- **Auditoria de compras** (`027-auditoria-de-compras`): preço pago contra a referência
  interna, concentração por fornecedor e compra sem contrapartida física.
- **Identificação do gado** (`028-identificacao-e-gps-do-gado`): brinco com histórico,
  leitura eletrônica e, condicionado à conta fechar, rastreador GPS.

---

## Fase Financeiro e Fiscal

Bloco comercial independente; pode rodar em paralelo à Fase 2.

- **Emissão de NF-e e MDF-e** via provedor externo (a emissão em si não é nossa; nós
  montamos o documento e acompanhamos o retorno).
- **Entrada automática de notas**: XML capturado e conciliado com o lançamento e com o
  pedido de compra, sem digitação. A Fase 1 entrega a importação manual de XML
  (`014-importacao-xml-notas-fiscais`); aqui ela vira automática.
- **Conciliação bancária** por OFX, casando extrato com os eventos de caixa.
- **Compras** (`018-compras-cotacao-e-autorizacao`): requisição, cotação, alçada de
  autorização, liberação, recebimento e casamento com a nota de entrada.
- **Contratos de venda** (`025-contratos-de-venda`) de café e gado, com acompanhamento
  de entrega e saldo. O sistema preenche a minuta do produtor; não redige cláusula.
- **Contas a pagar, a receber e fluxo de caixa** (`031-contas-a-pagar-e-receber`):
  títulos, baixas, projeção de saldo e previsto × realizado.
- **Adequação a IBS e CBS** (`030-adequacao-ibs-e-cbs`): parâmetros fiscais com
  vigência, fora do código. Depende inteiramente do contador.
- **Fechamento financeiro** por período, por fazenda e consolidado do grupo, com
  travamento do período fechado.
- **BI**: painéis analíticos por fazenda, frente e safra.

## Fase 3 · Visão computacional e WhatsApp

Começa após a primeira colheita registrada no sistema.

- **Maturação no pé**: percentual de verde, cereja, passa e seco a partir da foto,
  como apoio à decisão do ponto de colheita.
- **Doenças e pragas por foto**: sinais compatíveis com ferrugem, cercosporiose e
  bicho-mineiro, com local e data, encaminhados ao agrônomo. Apoio, nunca diagnóstico.
- **Pré-classificação de grãos**: contagem de defeitos a partir da foto da amostra. A
  classificação oficial continua com o classificador.
- **Assistente no WhatsApp**: conversa e lançamento pelo canal que o campo já usa.

Nesta fase entram os jobs Python de visão computacional. O restante do sistema segue
em TypeScript (ADR-0001).

---

## Fora de escopo, por ora

- Multi-cliente SaaS em produção. A arquitetura já carrega `organization_id`
  (constitution §3), mas onboarding, cobrança e isolamento operacional não estão
  planejados.
- Aplicativo nativo. O PWA instalável atende Android e iPhone.
- Gestão de máquinas e manutenção além do rateio de custo.

---

## Insumos de 2026-09-30

Dezenove pedidos chegaram pelo WhatsApp em 2026-09-30 e viraram as features **016 a
031**. Três coisas precisam ficar registradas aqui, porque mudam decisão:

**1. Estoque entrou e contradiz duas decisões anteriores.** O controle de estoque
estava em "Fora de escopo, por ora" neste roadmap, e as features `004` e `008` o
excluíam. Além disso, o gestor havia informado no levantamento que o insumo é comprado
**por aplicação, não estocado**. A feature `017` só deve ser aprovada depois que essa
contradição for resolvida — e a `026` (sentinela de desvio) depende dela para existir.

**2. "Gado leiteiro" apareceu pela primeira vez.** Até aqui, gado é mercadoria: compra,
emprenha, vende. Se houver produção de leite, é uma **quarta frente**, com litragem,
preço por litro e laticínio — e precisa de spec própria. Registrado como dúvida 1 da
feature `023`.

**3. O somatório não cabe nas 16 semanas da Fase 1.** A estimativa original já
precisava ser revista por causa do ADR-0015 (tela de digitação do escritório). Com
estas dezesseis features, a revisão de escopo, prazo e preço precisa acontecer **antes**
de qualquer `/spec-plan`.

As dezesseis specs acumulam **109 dúvidas abertas**, a maioria para o produtor e para o
contador. Nenhuma delas foi preenchida por suposição.
