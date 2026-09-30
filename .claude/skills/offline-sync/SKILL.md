---
name: offline-sync
description: Protocolo de sincronização offline do FMC — outbox, estados, retry, idempotência, conflitos, limitações do iOS e testes de sync. Use ao implementar ou alterar qualquer coisa de sync, ao adicionar entidade ao protocolo, ao migrar o schema local do Dexie, ao investigar dado duplicado ou perdido, e ao escrever o cenário CA-OFF de uma spec.
---

# Protocolo de sincronização offline

Base: ADR-0004 (offline-first com outbox) e ADR-0009 (UUID v7 e idempotência).
Regras operacionais em `.claude/rules/sync.md`.

## O modelo mental

```
Tela  →  Dexie (fonte de verdade da tela)  →  Outbox  →  Sync engine  →  API  →  Postgres
```

A tela **nunca** espera a rede. O sync engine vive fora da árvore de componentes.

## Outbox

Toda mutação grava, **na mesma transação Dexie**, o registro de domínio e o item de
outbox. Se uma falha, as duas falham.

```ts
type OutboxItem = {
  id: string // uuid v7 do próprio item
  entity: string // 'cattle_lot', 'application', ...
  entityId: string // uuid v7 do registro
  op: 'upsert' | 'delete'
  payload: unknown // o registro completo, já validado por Zod
  version: number // versão do registro após esta mutação
  state: 'pending' | 'inflight' | 'confirmed' | 'failed'
  attempts: number
  lastError?: string // mensagem em pt-BR, mostrada ao usuário
  createdAt: string
}
```

### Estados

| Estado      | Significado                          | Sai para                                                              |
| ----------- | ------------------------------------ | --------------------------------------------------------------------- |
| `pending`   | na fila, aguardando envio            | `inflight`                                                            |
| `inflight`  | enviado, aguardando ack              | `confirmed` · `pending` (erro de rede) · `failed` (erro de validação) |
| `confirmed` | o servidor confirmou                 | removido após retenção curta                                          |
| `failed`    | rejeitado por validação ou permissão | corrigido pelo usuário → `pending`                                    |

**Item em `failed` nunca é descartado em silêncio.** Ele aparece na tela com o motivo em
pt-BR e uma ação de correção.

### Ordem

FIFO **por entidade**. Dependência é respeitada pela ordem de criação: o lote é enviado
antes do animal que pertence a ele. Se um item falha, os que dependem dele esperam.

## Push e pull

```
POST /sync/push
  Headers: Idempotency-Key: <uuid v7 do lote>
  Body:    { items: OutboxItem[], clientSchemaVersion: number }
  200:     { acks: [{ id, state, error? }], cursor: string }

GET /sync/pull?cursor=<cursor>&limit=<n>
  200:     { changes: Change[], cursor: string, hasMore: boolean }
```

- O servidor faz **upsert por `(id, version)`**. Reenviar o mesmo lote não produz efeito
  adicional.
- O `pull` devolve **apenas o que o perfil pode ver**. Para `operator`, nenhuma tabela
  financeira, nenhuma coluna de valor (constitution §6).
- Lote tem tamanho máximo. O primeiro sync de um dispositivo novo é **paginado**.
- `clientSchemaVersion` incompatível → o servidor responde pedindo atualização do app,
  em vez de aceitar dado que não entende.

## Retry

| Situação                   | Ação                                                                           |
| -------------------------- | ------------------------------------------------------------------------------ |
| Erro de rede, timeout, 5xx | volta para `pending`, backoff exponencial com teto (≈ 1s, 2s, 4s … 5min)       |
| 401 / token expirado       | pausa o sync, renova o token, retoma. **A escrita local continua funcionando** |
| 403 permissão              | `failed`, com mensagem clara. Não adianta repetir                              |
| 409 conflito de versão     | resolve pela regra de conflito abaixo, gera nova versão, reenvia               |
| 422 validação              | `failed`, com o motivo do servidor mostrado ao usuário                         |

## Conflitos

| Tipo                                                          | Estratégia                                                                                       |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Evento** — aplicação, pesagem, colheita, manejo, lançamento | **Append-only.** Não conflita. Correção é um evento de estorno, nunca `UPDATE`                   |
| **Cadastro** — fazenda, talhão, animal, pessoa, produto       | **Last-write-wins** por `updated_at`, com o valor sobrescrito gravado no histórico de alterações |

- Exclusão é **soft delete** (`deleted_at`), propagada pelo sync. `DELETE` físico não
  atravessa o protocolo.
- **Nada é descartado sem registro.** O histórico de alterações não é opcional.

## iOS — o que não existe

iOS **não implementa** Background Sync nem Periodic Background Sync. Não escreva código
que dependa deles como caminho principal (no Android eles são otimização opcional).

Gatilhos reais de sync:

1. app volta a ficar visível (`visibilitychange`);
2. evento `online`;
3. checagem periódica **em primeiro plano**;
4. botão manual de "sincronizar agora".

Além disso:

- peça `navigator.storage.persist()` no primeiro uso, senão o Safari pode descartar o
  IndexedDB por pressão de armazenamento;
- o **contador de pendências fica sempre visível** — é como o usuário sabe que precisa
  abrir o app numa área com sinal;
- token expirado **não bloqueia escrita local**, só o sync.

## Mídia

Foto e áudio entram na outbox como **item próprio**, comprimidos antes do upload
(foto: redimensionar e recomprimir; áudio: bitrate baixo). O registro de domínio
referencia a mídia por ID e fica utilizável antes do upload terminar.

## Migração do schema local

- **Versão nova sempre.** Nunca edite uma versão publicada do Dexie.
- O upgrade precisa funcionar num banco **com dados e com outbox pendente**. Esse é o
  caso que quebra.
- Teste o caminho: versão N com 3 itens pendentes → upgrade para N+1 → os itens
  continuam válidos e sincronizam.

## Os cinco testes obrigatórios

Toda entidade nova no protocolo precisa de:

1. **Offline e volta:** push offline → conexão volta → sincroniza sem duplicar.
2. **Reenvio:** o mesmo lote enviado duas vezes não duplica nada.
3. **Operador:** o `pull` de `operator` não traz nenhum campo financeiro.
4. **Upgrade:** schema local N → N+1 com dados e outbox pendente.
5. **Conflito:** cadastro com escrita concorrente registra o valor sobrescrito no
   histórico.

## Sintomas e causas

| Sintoma                              | Causa provável                                    |
| ------------------------------------ | ------------------------------------------------- |
| Registro duplicado no servidor       | ID gerado no servidor, ou upsert por chave errada |
| Registro sumiu depois de sincronizar | escrita fora da transação da outbox               |
| Operador vê valor                    | projeção feita na serialização, não na consulta   |
| Sync trava em `inflight`             | falta de timeout, ou ack que nunca chega          |
| App iOS não sincroniza               | dependência de Background Sync                    |
| Dado corrompido após atualizar o app | upgrade do Dexie sem testar com dados             |
