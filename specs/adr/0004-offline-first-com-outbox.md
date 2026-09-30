# ADR-0004 · Offline-first com outbox no cliente

|               |            |
| ------------- | ---------- |
| **Data**      | 2026-09-29 |
| **Estado**    | aceito     |
| **Substitui** | —          |

## Contexto

O uso principal é no meio do cafezal e no curral, em áreas do Sul de Minas com sinal
ruim ou inexistente. O valor do produto depende do lançamento acontecer **na hora do
fato**. Um lançamento adiado para "quando pegar sinal" vira anotação no papel e, na
prática, planilha de novo.

## Decisão

O app é **offline-first com outbox**:

1. A tela lê e escreve **sempre** no **Dexie (IndexedDB)**. Nunca espera a rede.
2. Toda mutação grava, **na mesma transação Dexie**, o registro de domínio e um item na
   tabela `outbox`.
3. Um **sync engine** separado da UI drena a outbox em lotes, com backoff exponencial.
4. Estados do item de outbox: `pending` → `inflight` → `confirmed` · `failed`.
5. Conflitos: **eventos** (aplicação, pesagem, colheita, manejo) são append-only e não
   conflitam; **cadastros** usam last-write-wins por `updated_at`, com o valor
   sobrescrito preservado no histórico de alterações.
6. Foto e áudio entram na outbox como item próprio, comprimidos antes do upload.

## Alternativas consideradas

### Online-first com cache de leitura

- **A favor:** muito mais simples; sem outbox, sem conflito, sem schema local.
- **Contra:** escrita depende da rede. É exatamente o caso de uso que precisamos cobrir.
- **Por que não:** mata o produto.

### Biblioteca de sync pronta (RxDB, WatermelonDB, ElectricSQL, PowerSync)

- **A favor:** protocolo, conflito e replicação prontos.
- **Contra:** o requisito duro de **projeção por perfil** (operador não recebe dado
  financeiro, constitution §6) é filtro no servidor por linha e por coluna. As opções
  ou não suportam, ou suportam via um serviço de replicação que teríamos de operar, ou
  amarram o modelo de dados ao formato da ferramenta.
- **Por que não:** o requisito de segurança não é negociável e é o que mais restringe.
  Um protocolo próprio e pequeno (push/pull com cursor) é menos risco.

### Service Worker com Background Sync como motor

- **A favor:** sincroniza com o app fechado no Android.
- **Contra:** **iOS não implementa** Background Sync nem Periodic Background Sync.
- **Por que não:** teríamos dois motores. Usamos um só, em primeiro plano, e o
  Background Sync vira otimização opcional no Android.

## Consequências

**Positivas**

- Lançamento instantâneo, com ou sem sinal.
- O app funciona integralmente offline, não só "em modo leitura".
- Reenvio é seguro por construção (ver ADR-0009).

**Negativas e custos aceitos**

- Duas representações do dado (Dexie e Postgres) e uma migração de schema local a
  manter versionada.
- Complexidade real de teste: todo cenário precisa de um caso offline (obrigatório no
  template de spec).
- No iOS, sincronização só com o app aberto. Mitigado pelo contador de pendências
  visível e por `navigator.storage.persist()`.

**O que passa a ser proibido**

- `fetch`/`axios` em componente de tela.
- Escrita que não passa pela outbox.
- Botão desabilitado esperando resposta do servidor.

## Como verificar que a decisão está sendo respeitada

`.claude/rules/web.md` e `.claude/rules/sync.md`; skill `offline-sync`; agente
`sync-auditor` (só leitura) procura escrita fora da outbox; template de spec exige o
critério `CA-OFF`.
