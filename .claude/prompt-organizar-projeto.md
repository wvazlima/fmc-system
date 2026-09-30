# Prompt — Organizar o repositório fmc-system (FMC Gestão Agrícola)

> Cole tudo abaixo da linha no Claude Code, na raiz do repositório.

---

Você vai organizar o repositório **`fmc-system`** do produto **FMC Gestão Agrícola** (nome provisório). Use o escopo **`@fmc/`** nos pacotes do monorepo (ex.: `@fmc/shared`, `@fmc/db`, `@fmc/ui`, `@fmc/config`) e **FMC Gestão Agrícola** como nome exibido no app (título do PWA, manifest e documentação). Como o nome pode mudar, concentre-o num único lugar de configuração (ex.: `packages/config/src/brand.ts` e o manifest do PWA) e registre isso num ADR, para que a troca futura seja simples.

É um projeto desenvolvido com **Spec-Driven Development (SDD)** e **desenvolvimento agêntico**. Nesta tarefa você **não escreve código de funcionalidade**: cria a estrutura, a documentação, as specs iniciais, a configuração do Claude Code (rules, subagentes, skills, commands, hooks) e o esqueleto mínimo do monorepo.

## Como trabalhar

1. **Antes de criar qualquer coisa**, leia o repositório atual (estrutura, arquivos existentes, package.json, README). Depois me mostre um plano curto: o que vai criar, o que já existe e o que pretende alterar.
2. **Nunca sobrescreva arquivos existentes sem me perguntar.** Se algo já existir, proponha um merge.
3. **Confirme o formato atual** de CLAUDE.md, `.claude/rules/`, `.claude/agents/`, `.claude/skills/`, `.claude/commands/` e hooks em `.claude/settings.json` na documentação oficial do Claude Code antes de gerar os arquivos. Se algum recurso tiver mudado de formato, use o formato atual e me avise.
4. Trabalhe em etapas, na ordem da seção "Ordem de execução", e me mostre um resumo ao fim de cada etapa.
5. Escreva toda a documentação em **português do Brasil**. Nomes de código, pastas técnicas, tabelas e variáveis em **inglês**; termos do domínio que não têm tradução boa (talhão, safra, GTA) podem ficar em português nos comentários e no glossário, com o nome em inglês no código definido no glossário.

---

## 1. Contexto do produto

**Nome:** FMC Gestão Agrícola (provisório). **Repositório:** `fmc-system`.

**O que é:** um sistema de gestão rural **multipropriedade**, mobile-first e **offline-first**, para um produtor rural pessoa física com **5 fazendas** (arquitetura pronta para 1 a 10 fazendas e, no futuro, SaaS multi-cliente) em cidades diferentes do Sul de Minas. Hoje tudo é controlado em planilhas de Excel.

**Frentes de negócio (centros de custo):**

- **Gado como mercadoria:** compra de novilhas (vazias ou prenhas), emprenha (IATF/touro), vende. Giro de dias a semanas. Métricas: margem por cabeça e por lote, custo por dia, giro médio, comparação "comprar prenha × emprenhar aqui". Gado circula entre fazendas (transferência com frete e GTA).
- **Café:** por talhão e por safra. Custo por hectare, custo por saca, gasto por categoria (adubação, foliar, herbicida, defensivos, mão de obra), produtividade (sacas/ha).
- **Lavouras eventuais:** milho para silagem ou grão; cada plantio com início e fim. Silagem consumida pelo gado é **transferência interna de custo**.
- **Pessoal:** despesas dos proprietários (casa, jardim), separadas do custo produtivo.
- **Custos compartilhados:** funcionários, diesel, máquinas, energia — rateio em dois níveis (entre frentes e entre fazendas).

**Situação fiscal:** produtor rural **pessoa física**, sem CNPJ, com **inscrição estadual por fazenda**. Lançamentos contábeis separados por fazenda. Possível obrigatoriedade de **LCDPR** (regime de caixa, por imóvel, com participantes e contas bancárias). Folha de pagamento no **Folhamatic (IOB)**, integração por arquivo texto.

**Perfis de acesso:**

- **Dono:** todas as fazendas, tudo, inclusive consolidado do grupo.
- **Gerente:** todas as fazendas, tudo; lança, edita, aprova, gera relatórios.
- **Operador:** só fazendas onde está alocado; só operacional, **nunca vê valores, margens ou financeiro**. Lançamentos de operador podem entrar como "a revisar".

---

## 2. Decisões de arquitetura (não reabra sem ADR)

**Stack**

- **TypeScript** em tudo (front, API, workers, borda). **Python** só para jobs de satélite e visão computacional (Fase 2 e 3). Go fica reservado para um eventual serviço com necessidade real de desempenho.
- **Monorepo** com pnpm + Turborepo.
- **Front:** Next.js (App Router) exportado como estático, PWA com Serwist, Dexie (IndexedDB) como banco local e fila de sincronização, TanStack Query, Tailwind + shadcn/ui, MapLibre GL.
- **API:** Node.js + Fastify, **monólito modular** por domínio (farms, cattle, coffee, crops, finance, sync, maps, accounting, users).
- **Banco:** PostgreSQL + PostGIS, Drizzle ORM, Zod para validação com schemas compartilhados.
- **Auth:** Identity Platform / Firebase Auth (e-mail ou Google; sem SMS).

**Serviços (microsserviços por tipo de carga, não por domínio)**

- `web` — PWA estático no Cloudflare Pages.
- `api` — Cloud Run, atrás do Cloudflare (Worker como proxy reverso com cabeçalho secreto para proteger a origem).
- `worker` — Cloud Run Jobs + Cloud Scheduler (importação de planilhas, relatórios, NDVI, clima).
- `agent` — Fase 2: assistente agronômico via Vertex AI (Claude/Gemini) com tools.

**Infra**

- Google Cloud: Cloud Run, Cloud SQL (Postgres + PostGIS), Cloud Storage, Secret Manager, Artifact Registry, Cloud Scheduler, Pub/Sub ou Cloud Tasks, Cloud Logging, Error Reporting, labels de custo por cliente, alerta de orçamento. Três projetos: dev, staging, prod.
- Cloudflare: DNS, WAF, TLS Full (strict), Pages, Workers, **R2 para pacotes de mapa offline (PMTiles)**.
- Terraform com providers Google e Cloudflare.

**Princípios invioláveis (vão para a constitution)**

1. **Offline-first:** o app lê e grava sempre no banco local; a sincronização acontece por trás, via outbox.
2. **IDs gerados no cliente (UUID v7)** e **escrita idempotente** no servidor.
3. **Todo dado de negócio tem `farm_id`** (e, acima, `organization_id`, pensando em SaaS).
4. **Números são calculados no banco/código, nunca pela IA.** A IA só interpreta dados já calculados.
5. **Duas datas em todo lançamento financeiro:** competência (gestão, custo/saca, safra) e caixa (livro caixa, LCDPR).
6. **Operador nunca recebe dados financeiros**, nem na API nem no sync.
7. **A IA sugere e levanta hipóteses; não prescreve defensivo nem dose.** Decisão técnica é do agrônomo.
8. **Mobile-first e uso no campo:** botões grandes, poucos campos, alto contraste ao sol, funciona com sinal ruim.
9. **Nenhum dado de negócio fora do Cloud SQL**; borda no Cloudflare, núcleo no Google.
10. **Licenças de terceiros respeitadas:** uso é comercial. Mapa base próprio gerado do Sentinel-2 (Copernicus); nada de cache offline de tiles do Google Maps; dados CEPEA só com licença; clima via Google Weather API.
11. **Histórico importado** das planilhas é marcado como tal e pode ter campos opcionais.

**Detalhes do offline e iOS**

- Service Worker com cache da casca; `sw.js` e `index.html` com `Cache-Control: no-cache`; assets com hash `immutable`.
- iOS não tem Background Sync: sincronizar ao abrir o app, no evento `online` e por checagem periódica. Pedir `navigator.storage.persist()`. Mostrar contador de pendências.
- Conflitos: eventos novos não conflitam; cadastros usam last-write-wins com histórico de alterações.
- Fotos e áudios entram na outbox, comprimidos antes do upload.

---

## 3. Glossário do domínio (base para `specs/glossario.md`)

Organização, fazenda (farm), inscrição estadual, talhão (plot), safra (season, ano agrícola jul–jun), saca (60 kg), custo por hectare, custo por saca, aplicação (application), trato cultural, adubação, foliar, herbicida, defensivo, colheita, maturação (verde, cereja, passa, seco), secagem (terreiro, secador), tulha/armazém, lote de café (coffee lot), bebida, tipo, defeitos, peneira; lote de gado (cattle lot), animal, brinco (ear tag), novilha, prenhez, IATF, diagnóstico de gestação, GTA, transferência entre fazendas, giro, margem por cabeça, quebra de peso; lavoura eventual, silagem, transferência interna de custo; centro de custo, rateio, competência, caixa, participante (CPF/CNPJ), conta bancária, LCDPR, Folhamatic, plano de contas, de-para contábil; condição de entrega, destino, preço líquido na porteira; NDVI, vigor, pacote de mapa (PMTiles); perfis dono/gerente/operador; lançamento "a revisar".

Para cada termo: definição em uma linha, nome em inglês usado no código, e regra de negócio relevante quando houver.

---

## 4. Estrutura esperada

```
/
├── CLAUDE.md
├── AGENTS.md                  # ponteiro curto para CLAUDE.md e specs (compatibilidade com outras ferramentas)
├── README.md
├── .claude/
│   ├── settings.json          # permissões e hooks
│   ├── rules/                 # regras por área, com escopo por caminho
│   ├── agents/                # subagentes especialistas
│   ├── skills/                # conhecimento especializado sob demanda
│   └── commands/              # atalhos de fluxo (SDD, revisão, auditoria)
├── specs/
│   ├── constitution.md
│   ├── glossario.md
│   ├── arquitetura.md
│   ├── roadmap.md
│   ├── _templates/            # spec.md, plan.md, tasks.md, adr.md
│   ├── adr/                   # decisões de arquitetura numeradas
│   └── features/
│       └── NNN-nome/          # spec.md, plan.md, tasks.md
├── apps/
│   ├── web/                   # Next.js PWA (só esqueleto)
│   ├── api/                   # Fastify (só esqueleto, módulos vazios)
│   ├── worker/                # Cloud Run Jobs (só esqueleto)
│   └── edge/                  # Cloudflare Worker proxy (só esqueleto)
├── packages/
│   ├── shared/                # schemas Zod, tipos, protocolo de sync
│   ├── db/                    # schema Drizzle e migrations
│   ├── ui/                    # componentes compartilhados
│   └── config/                # tsconfig, eslint, prettier compartilhados
├── infra/terraform/           # módulos e ambientes dev/staging/prod
└── .github/                   # workflows de CI, template de PR
```

O `agent` (Fase 2) ainda **não** deve ser criado; apenas citado no roadmap.

---

## 5. O que criar em cada parte

### 5.1 CLAUDE.md (máximo ~200 linhas)

Enxuto e acionável. Deve conter: resumo do produto em 5 linhas; stack; mapa do monorepo; comandos (instalar, dev, build, test, lint, typecheck, migrations); os 11 princípios invioláveis resumidos; o fluxo SDD em 6 passos; convenções (commits no padrão Conventional Commits em inglês, branches `feat/NNN-slug`, `fix/`, `chore/`); onde ficam specs, ADRs, rules, skills e agentes; a regra "na dúvida, consulte `specs/` antes de decidir". Material de referência longo vai para skills, não para o CLAUDE.md.

### 5.2 specs/

- **constitution.md:** os princípios invioláveis explicados, com o porquê de cada um e exemplos do que é proibido.
- **glossario.md:** a partir da seção 3.
- **arquitetura.md:** serviços, fluxo de dados, fluxo de sincronização (diagrama Mermaid), multi-fazenda, perfis e visibilidade de dados, borda Cloudflare, ambientes.
- **roadmap.md:** Fase 1 (MVP), Fase 2 (inteligência + Folhamatic/LCDPR), Fase Financeiro e Fiscal (NF-e/MDF-e via provedor, entrada de notas, OFX, compras, contratos, BI), Fase 3 (visão computacional, WhatsApp). Com a lista de features de cada uma.
- **\_templates/:**
  - `spec.md`: problema, usuários e perfis afetados, histórias, **critérios de aceite em Dado/Quando/Então** (incluindo cenário offline e cenário de operador), fora de escopo, dúvidas abertas.
  - `plan.md`: modelo de dados (tabelas, colunas, índices, `farm_id`), endpoints, impacto no sync, telas, regras de permissão, riscos, testes.
  - `tasks.md`: tarefas pequenas, numeradas, cada uma com critério de pronto e teste associado.
  - `adr.md`: contexto, decisão, alternativas, consequências.
- **adr/:** registre como ADRs as decisões da seção 2 (uma por decisão relevante: TypeScript, monorepo, monólito modular, offline-first com outbox, PostGIS, Cloudflare na borda, mapa próprio via Sentinel-2, duas datas nos lançamentos, UUID no cliente).
- **features/:** crie **apenas o `spec.md`** (sem plan e tasks) destas features iniciais, para eu revisar:
  - `001-fundacao-multifazenda` (organização, fazendas com IE, usuários, perfis, alocação)
  - `002-sync-offline` (protocolo, outbox, idempotência, conflitos, iOS)
  - `003-gado-entrada-e-lotes`
  - `004-gado-manejo-e-prenhez`
  - `005-gado-transferencia-entre-fazendas`
  - `006-gado-venda-e-margem`
  - `007-cafe-talhoes-e-safras`
  - `008-cafe-aplicacoes-e-custos`
  - `009-lancamentos-financeiros-duas-datas`
  - `010-rateio-custos-compartilhados`
  - `011-vendas-logistica-preco-liquido`
  - `012-mapa-talhoes-e-pacote-offline`
  - `013-importacao-historico-planilhas`
  - `014-importacao-xml-notas-fiscais`
  - `015-exportacao-contabil-planilha`

### 5.3 .claude/rules/ (regras com escopo por caminho)

Um arquivo por área, cada um limitado aos caminhos correspondentes:

- `api.md` (`apps/api/**`): estrutura de módulo, validação Zod na borda, erros tipados, autorização por perfil e fazenda em toda rota, nada de lógica de negócio em handler.
- `web.md` (`apps/web/**`): mobile-first, leitura e escrita sempre via banco local, nenhuma chamada direta de API em componente, acessibilidade, estados offline e pendente visíveis.
- `sync.md` (`packages/shared/src/sync/**`, módulos de sync): outbox, UUID, idempotência, versionamento de schema local.
- `db.md` (`packages/db/**`): toda tabela de negócio com `organization_id` e `farm_id`, migrations nunca editadas depois de aplicadas, índices, PostGIS com SRID definido.
- `infra.md` (`infra/**`, `apps/edge/**`): tudo em Terraform, segredos só no Secret Manager/secrets do Worker, labels de custo.
- `tests.md` (`**/*.test.ts`): padrão de testes, fixtures, nada de teste dependente de rede externa.
- `security.md` (global): nunca logar dados pessoais, CPF, valores financeiros de operador; checagem de permissão obrigatória.

### 5.4 .claude/agents/ (subagentes especialistas)

Cada um com frontmatter (nome, descrição clara de quando usar, ferramentas mínimas necessárias) e um prompt de sistema focado. Crie:

- `arquiteto` — valida decisões contra constitution e ADRs; propõe ADR quando algo muda.
- `spec-writer` — escreve spec.md a partir de uma conversa, com critérios de aceite completos.
- `spec-reviewer` — confere se a implementação cumpre os critérios de aceite da spec; aponta lacunas.
- `planner` — gera plan.md e tasks.md a partir de uma spec aprovada.
- `backend-api` — implementa módulos Fastify seguindo as rules.
- `frontend-pwa` — implementa telas mobile-first e integração com Dexie.
- `offline-sync` — especialista no protocolo de sincronização.
- `sync-auditor` — só leitura; procura escritas que não passam pela outbox, IDs gerados no servidor e vazamento de dados financeiros para operador.
- `dados-postgis` — modelagem, migrations, consultas de custo, geometria.
- `infra-cloud` — Terraform, Cloud Run, Cloud SQL, Cloudflare.
- `integracoes` — Folhamatic, LCDPR, XML de NF-e, provedores externos, respeitando licenças.
- `dominio-agro` — revisor de regras de negócio de gado, café e custos à luz do glossário.
- `test-writer` — escreve testes a partir dos critérios de aceite.
- `clean-code-reviewer` — só leitura; revisa legibilidade, nomes, funções pequenas, duplicação, acoplamento, complexidade, tratamento de erro e aderência às rules; entrega lista priorizada (bloqueante, importante, sugestão) sem reescrever o código sozinho.
- `security-reviewer` — só leitura; autorização por perfil e fazenda, segredos, injeção, dados pessoais.
- `doc-writer` — mantém README, arquitetura e changelog atualizados após cada feature.

### 5.5 .claude/skills/ (conhecimento sob demanda)

Cada skill com `SKILL.md` (frontmatter com nome e descrição que diga exatamente quando acionar) e arquivos de referência quando útil:

- `dominio-agro` — glossário expandido, fórmulas (custo/ha, custo/saca, margem por cabeça, giro, custo por dia, rateio em dois níveis, transferência interna), regras de negócio.
- `sdd-workflow` — como escrever spec, plan, tasks e ADR no padrão do projeto, com exemplo completo.
- `offline-sync` — protocolo, estados da outbox, retry, idempotência, conflitos, limitações do iOS, testes de sync.
- `postgis-mapas` — geometria de talhões, cálculo de área, MapLibre, geração de PMTiles a partir do Sentinel-2, publicação no R2.
- `gcp-deploy` — Cloud Run, Cloud SQL, Secret Manager, ambientes, custos e labels.
- `cloudflare-edge` — Pages, Worker proxy com cabeçalho secreto, regras de cache do PWA, WAF sem challenge na API, R2.
- `ui-mobile-first` — padrões de tela para o campo, estados offline/pendente, formulários curtos, perfil operador.
- `importacao-planilhas` — pipeline staging → mapeamento → limpeza → validação → lote reversível → conferência de totais; marcação de histórico importado.
- `integracao-contabil` — Folhamatic por arquivo texto, de-para de plano de contas, LCDPR (regime de caixa, participantes, contas, imóvel), exportação por fazenda.
- `ia-assistente` — regras do assistente agronômico: números só via tools, citar dado de origem, não prescrever, franquia de uso.
- `clean-code` — padrões de código do projeto com exemplos bons e ruins em TypeScript.

### 5.6 .claude/commands/ (fluxo do dia a dia)

- `/spec-new <nome>` — cria pasta da feature com spec.md a partir do template, usando o `spec-writer`.
- `/spec-plan <NNN>` — gera plan.md e tasks.md via `planner`, e aciona o `arquiteto` para revisar.
- `/implement <NNN> <task>` — implementa uma task, roda testes, atualiza o checkbox em tasks.md.
- `/review <NNN>` — roda `spec-reviewer`, `clean-code-reviewer`, `security-reviewer` e `sync-auditor` e consolida um relatório único.
- `/clean-code [caminho]` — revisão de clean code focada num caminho.
- `/adr <título>` — cria ADR numerado a partir do template.
- `/status` — resume features por estado (spec, plan, em implementação, revisão, pronta) e pendências.
- `/release-check` — checklist antes de deploy: testes, typecheck, migrations, variáveis, custos, changelog.

### 5.7 Hooks (.claude/settings.json)

- Depois de editar arquivos TS: formatar e rodar lint e typecheck do pacote afetado.
- Bloquear edição de migrations já aplicadas em `packages/db/migrations/`.
- Bloquear gravação de segredos (chaves, tokens, `.env` real) em arquivos versionados.
- Antes de commit: testes do pacote afetado.
- Permissões: negar comandos destrutivos (ex.: `rm -rf` fora de pastas de build, `terraform apply` e `terraform destroy`, deploy para prod) sem confirmação explícita.

### 5.8 Esqueleto do monorepo

Só o suficiente para os comandos funcionarem: `package.json` raiz com scripts, `pnpm-workspace.yaml`, `turbo.json`, configs compartilhadas em `packages/config`, cada app e pacote com `package.json`, `tsconfig.json` e um `src/index.ts` mínimo. Na API, as pastas vazias dos módulos de domínio com um README de uma linha. Sem lógica de negócio.

### 5.9 Git e CI

- `.gitignore` completo (node, Next, Terraform, `.env*` exceto `.env.example`).
- `.env.example` por app, sem valores reais.
- Template de PR com: link da spec, critérios de aceite atendidos, impacto no sync, impacto em permissões, prints mobile.
- Workflow de CI: install, lint, typecheck, test, build.

---

## 6. Ordem de execução

1. Ler o repositório e me apresentar o plano.
2. `specs/` (constitution, glossário, arquitetura, roadmap, templates, ADRs).
3. `CLAUDE.md` e `AGENTS.md`.
4. `.claude/rules/`, `.claude/skills/`, `.claude/agents/`, `.claude/commands/`, hooks.
5. Esqueleto do monorepo, Git e CI.
6. Specs das 15 features iniciais (só spec.md).
7. Validação final: rodar install, lint, typecheck e build do esqueleto; listar tudo o que foi criado; apontar dúvidas e decisões que ficaram para mim.

## 7. Critérios de pronto

- Nenhum arquivo existente foi sobrescrito sem minha confirmação.
- CLAUDE.md com até ~200 linhas.
- Toda regra da constitution aparece refletida em pelo menos uma rule, skill ou agente.
- Cada agente e skill tem descrição clara de quando deve ser usado.
- O esqueleto instala e passa em lint, typecheck e build.
- Relatório final com a árvore criada e a lista de dúvidas abertas.
