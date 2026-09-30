---
paths:
  - 'packages/shared/src/sync/**'
  - 'apps/api/src/modules/sync/**'
  - 'apps/web/src/lib/db/**'
  - 'apps/web/src/lib/sync/**'
---

# Regras — Sincronização offline

O coração do produto. Ler ADR-0004 e ADR-0009 antes de mexer aqui. A skill
`offline-sync` tem o protocolo completo.

## Outbox

- **Toda** mutação grava o registro de domínio e o item de outbox na **mesma transação
  Dexie**. Se uma falha, as duas falham.
- Estados: `pending` → `inflight` → `confirmed` · `failed`. Não invente estado novo sem
  atualizar a skill `offline-sync`.
- A outbox é **FIFO por entidade**. Dependência (lote antes do animal) é respeitada pela
  ordem de criação.
- Item em `failed` **nunca é descartado em silêncio**. Ele aparece para o usuário com o
  motivo.
- Foto e áudio são itens de outbox próprios, comprimidos antes do upload.

## Identidade e idempotência

- **UUID v7 gerado no cliente** para toda entidade de negócio (ADR-0009).
- Nenhum ID vem do servidor. Se você precisou de um ID do servidor, o modelo está errado.
- Todo lote de push carrega `Idempotency-Key`. Reenviar o mesmo lote **não** pode duplicar
  nada.
- O servidor faz **upsert por `(id, version)`**.

## Conflitos

| Tipo de dado                                              | Estratégia                                                                                        |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Evento (aplicação, pesagem, colheita, manejo, lançamento) | **Append-only.** Não conflita. Correção é um novo evento de estorno, não um `UPDATE`.             |
| Cadastro (fazenda, talhão, animal, pessoa, produto)       | **Last-write-wins** por `updated_at`, com o valor sobrescrito gravado no histórico de alterações. |

- Exclusão é **soft delete** (`deleted_at`) e é propagada pelo sync. `DELETE` físico não
  atravessa o protocolo.
- Nunca resolva conflito descartando dado sem registro. O histórico de alterações é
  obrigatório.

## Schema local (Dexie)

- Toda mudança de schema local é uma **versão nova** do Dexie, com o passo de upgrade
  escrito e testado. Nunca edite uma versão já publicada.
- O upgrade precisa funcionar num banco com dados e com itens de outbox pendentes.
- A versão do schema local vai no handshake do sync. Servidor com protocolo incompatível
  responde pedindo atualização do app, em vez de corromper.

## Protocolo

- `POST /sync/push` — envia lote da outbox, devolve `acks` e `cursor`.
- `GET /sync/pull?cursor=` — devolve mudanças do servidor desde o cursor, **já
  projetadas pelo perfil**.
- O `pull` de `operator` **não contém tabela financeira**. Isso é checado por teste
  (constitution §6).
- Lote tem tamanho máximo; paginação é obrigatória no primeiro sync de um dispositivo
  novo.
- Retry com backoff exponencial e teto. Erro de rede reenvia; erro de validação vai para
  `failed`.

## iOS

- iOS **não tem** Background Sync nem Periodic Background Sync. Não escreva código que
  dependa deles como caminho principal.
- Gatilhos de sync: abrir o app (`visibilitychange`), evento `online`, checagem periódica
  em primeiro plano, e botão manual.
- Token expirado **não bloqueia a escrita local** — só o sync (ADR-0012).

## Testes obrigatórios

Toda entidade nova no protocolo precisa de:

1. push offline → volta a conexão → sincroniza sem duplicar;
2. o **mesmo lote enviado duas vezes** não duplica;
3. pull de `operator` não traz nenhum campo financeiro;
4. upgrade do schema local com dados e com outbox pendente;
5. conflito de cadastro registra o valor sobrescrito no histórico.
