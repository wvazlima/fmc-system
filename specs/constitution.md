# Constituição do FMC Gestão Agrícola

Este documento define os **princípios invioláveis** do produto. Toda decisão de
arquitetura, toda spec e todo código são avaliados contra ele.

Mudar um princípio exige um **ADR** em `specs/adr/` que substitua explicitamente o
anterior. Não é permitido "abrir exceção" numa feature isolada.

Quando uma regra aqui conflitar com uma conveniência de implementação, a regra vence.

---

## 1. Offline-first: o banco local é a fonte de verdade da tela

O app **sempre lê e escreve no banco local (Dexie/IndexedDB)**. A sincronização com
o servidor acontece por trás, através de uma **outbox**. A tela nunca espera a rede
para confirmar uma ação do usuário.

**Por quê:** o usuário está no meio do cafezal com sinal ruim ou sem sinal. Se o
lançamento depender da rede, ele não lança; e o que não é lançado no campo vira
planilha de novo.

**Proibido:**

- `fetch`/`axios` chamado direto de um componente de tela.
- Botão "Salvar" que fica desabilitado enquanto espera resposta do servidor.
- Tela que mostra erro de rede para uma ação que poderia ter sido enfileirada.

**Obrigatório:** todo lançamento vira um registro local + um item de outbox na mesma
transação do Dexie. A tela mostra o estado `pendente` até o sync confirmar.

---

## 2. IDs gerados no cliente (UUID v7) e escrita idempotente no servidor

Todo registro de negócio nasce com um **UUID v7 gerado no cliente**. O servidor nunca
gera o ID de um registro que veio do app.

Toda mutação enviada ao servidor carrega uma **chave de idempotência** e pode ser
reenviada quantas vezes for necessário sem duplicar efeito.

**Por quê:** offline, o registro precisa existir e ser referenciável antes de haver
servidor. E numa rede ruim o cliente não sabe se o `POST` chegou — ele precisa poder
repetir sem medo.

**Proibido:**

- `serial` / `bigserial` / `gen_random_uuid()` como default de PK de tabela de negócio.
- Endpoint de criação que não aceita o ID vindo do cliente.
- Endpoint de mutação sem tratamento de replay.

**Por que v7 e não v4:** UUID v7 é ordenável por tempo, o que mantém os índices B-tree
do Postgres com boa localidade de inserção.

---

## 3. Todo dado de negócio tem `farm_id` — e acima dele, `organization_id`

Toda tabela de negócio carrega `organization_id` e `farm_id`. Não existe registro
"solto no grupo": mesmo um custo compartilhado nasce ligado à fazenda que o originou e
só depois é rateado.

**Por quê:** o produto nasce multipropriedade (5 fazendas) e caminha para SaaS
multi-cliente. Retro-encaixar `organization_id` depois é uma migração dolorosa e um
risco de vazamento entre clientes.

**Proibido:**

- Tabela de negócio sem `organization_id` e `farm_id` (exceções: tabelas de catálogo
  global, como lista de UFs, e a própria tabela `organizations`).
- Consulta que não filtra por `organization_id`.
- Confiar em `farm_id` vindo do corpo da requisição sem checar se o usuário tem acesso
  àquela fazenda.

---

## 4. Números são calculados no banco e no código, nunca pela IA

Custo por hectare, custo por saca, margem por cabeça, giro, rateio: tudo é calculado
por SQL ou por código TypeScript **determinístico e testado**. A IA recebe números já
calculados e só os interpreta.

**Por quê:** o produtor vai tomar decisão de compra e venda em cima desses números. Um
número alucinado não é um bug de UX, é prejuízo. Além disso, número calculado é
auditável e reprodutível; número de LLM não é.

**Proibido:**

- LLM somando, dividindo, calculando percentual ou projetando resultado.
- Prompt que entrega dado bruto e pede o cálculo.

**Obrigatório:** o assistente acessa números via **tools** que executam consultas
determinísticas, e cita a origem do dado que usou.

---

## 5. Duas datas em todo lançamento financeiro: competência e caixa

Todo lançamento financeiro tem **`accrual_date`** (competência — a qual safra, talhão,
lote e período o custo pertence) e **`cash_date`** (caixa — quando o dinheiro saiu ou
entrou de fato).

**Por quê:** são dois mundos diferentes e ambos são obrigatórios. Custo por saca e
resultado da safra são **competência**. Livro caixa e LCDPR são **caixa** (regime de
caixa por imóvel). Uma data só força escolher entre gestão errada e fisco errado.

**Proibido:**

- Tabela de lançamento com uma única coluna de data.
- Relatório gerencial filtrando por `cash_date`, ou livro caixa por `accrual_date`.

**Nota:** o adubo comprado em outubro, pago em três parcelas e aplicado na safra 26/27
tem competência na safra 26/27 e três eventos de caixa.

---

## 6. Operador nunca recebe dado financeiro

O perfil **operador** não vê valor, custo, margem, preço nem qualquer derivado. A
restrição vale na **API**, no **payload de sync** e na **tela** — nessa ordem de
importância.

**Por quê:** funcionário de campo sabendo a margem do lote e o salário rateado é
problema humano dentro da fazenda. Esconder só na tela não resolve: o dado estaria no
IndexedDB do celular dele.

**Proibido:**

- Endpoint que devolve campo de valor e deixa o front esconder.
- Sync que empurra tabela financeira para dispositivo de operador.
- `SELECT *` em rota acessível a operador.

**Obrigatório:** a projeção de dados por perfil acontece na camada de dados, não na de
apresentação. O `sync-auditor` verifica isso continuamente.

---

## 7. A IA sugere e levanta hipóteses; não prescreve

O assistente pode dizer "o talhão da Baixada está com vigor abaixo dos demais há três
semanas, vale uma vistoria". Não pode dizer qual defensivo aplicar nem em que dose.

**Por quê:** recomendação de defensivo e dose é **receituário agronômico**, ato privativo
de profissional habilitado, com responsabilidade técnica e legal. E um erro de dose
queima lavoura.

**Proibido:** nome comercial de defensivo + dose + momento de aplicação como
recomendação. Diagnóstico afirmativo de doença ("é ferrugem").

**Permitido:** "sinais compatíveis com ferrugem", "custo de foliar acima da safra
passada", "três animais sem prenhez confirmada", sempre com o dado de origem e um
encaminhamento para o agrônomo.

---

## 8. Mobile-first e uso real no campo

A tela é desenhada primeiro para um celular na mão de quem está de bota, no sol, com
luva, com sinal ruim. O desktop é a segunda tela, não a primeira.

**Por quê:** se o lançamento não for fácil no celular, ele não acontece, e sem dado de
entrada o sistema inteiro não entrega nada.

**Obrigatório:**

- Alvos de toque de no mínimo 44×44 px.
- Contraste suficiente para leitura sob sol direto (mínimo WCAG AA, alvo AAA em texto
  principal).
- Formulário curto: o caminho comum cabe numa tela, sem rolagem.
- Estado de conectividade e contador de pendências sempre visíveis.
- Nenhuma ação crítica dependente de hover.

---

## 9. Nenhum dado de negócio fora do Cloud SQL

Os dados de negócio vivem no **Cloud SQL (Postgres + PostGIS)**. Cloudflare é **borda**:
DNS, WAF, TLS, cache de assets estáticos, Pages e R2 para pacotes de mapa. O núcleo é
Google Cloud.

**Por quê:** um único lugar com o dado significa um único lugar para backup, retenção,
auditoria e LGPD. Dado espalhado em KV, D1 e planilha vira dado sem dono.

**Proibido:**

- Tabela de negócio em Workers KV, D1 ou Durable Objects.
- Dado pessoal ou financeiro em log, em analytics de terceiro ou em cache de borda.
- R2 guardando qualquer coisa que não seja artefato público derivado (PMTiles).

---

## 10. Licenças de terceiros respeitadas — o uso é comercial

Este é um produto comercial. Toda fonte de dado e toda biblioteca precisa ter licença
compatível com uso comercial, verificada e registrada.

**Por quê:** cobrar por um sistema que viola termos de uso de terceiro expõe o cliente e
expõe quem desenvolveu.

**Regras firmadas:**

- **Mapa base próprio**, gerado a partir do **Sentinel-2 / Copernicus** (licença aberta,
  atribuição obrigatória), publicado como PMTiles no R2.
- **Proibido** cache offline de tiles do Google Maps, Mapbox ou Bing — viola os termos.
- **CEPEA** só com licença contratada; sem licença, o dado não entra.
- **Clima** via Google Weather API, dentro dos termos e com custo previsto.
- Toda dependência nova passa por checagem de licença (`MIT`, `Apache-2.0`, `BSD`, `ISC`
  liberadas; `GPL`/`AGPL` exigem análise).

---

## 11. Histórico importado é marcado como tal

Todo registro que veio das planilhas antigas carrega `source = 'import'`, o lote de
importação que o originou e pode ter campos opcionais que um registro novo exigiria.

**Por quê:** a planilha de 2021 não tem o rigor do lançamento de amanhã. Se o histórico
entrar disfarçado de dado nativo, todo relatório comparativo mente e ninguém consegue
mais distinguir o que é confiável do que é estimado.

**Obrigatório:**

- Lote de importação **reversível**: dá para desfazer inteiro.
- Conferência de totais: soma da planilha × soma do importado, apresentada ao gerente.
- Relatório que mistura histórico e dado nativo sinaliza o período importado.

**Proibido:** afrouxar a validação de um lançamento novo porque o importador precisava.
O importador tem seu próprio caminho de validação, mais tolerante e explicitamente
marcado.

---

## Como esta constituição é aplicada

| Princípio                        | Onde é verificado                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1. Offline-first                 | `.claude/rules/web.md`, `.claude/rules/sync.md`, agente `sync-auditor`, skill `offline-sync`      |
| 2. UUID v7 + idempotência        | `.claude/rules/sync.md`, `.claude/rules/db.md`, agente `sync-auditor`                             |
| 3. `farm_id` / `organization_id` | `.claude/rules/db.md`, `.claude/rules/api.md`, agente `security-reviewer`                         |
| 4. Números determinísticos       | `.claude/rules/api.md`, skill `ia-assistente`, skill `dominio-agro`                               |
| 5. Duas datas                    | `.claude/rules/db.md`, skill `dominio-agro`, skill `integracao-contabil`                          |
| 6. Operador sem financeiro       | `.claude/rules/security.md`, `.claude/rules/api.md`, agentes `security-reviewer` e `sync-auditor` |
| 7. IA não prescreve              | skill `ia-assistente`, agente `dominio-agro`                                                      |
| 8. Mobile-first                  | `.claude/rules/web.md`, skill `ui-mobile-first`, agente `frontend-pwa`                            |
| 9. Dado só no Cloud SQL          | `.claude/rules/infra.md`, skill `cloudflare-edge`, agente `infra-cloud`                           |
| 10. Licenças                     | `.claude/rules/infra.md`, skill `postgis-mapas`, agente `integracoes`                             |
| 11. Histórico marcado            | `.claude/rules/db.md`, skill `importacao-planilhas`, agente `dominio-agro`                        |
