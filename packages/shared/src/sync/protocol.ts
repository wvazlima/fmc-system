import { z } from 'zod'
import { uuidV7Schema } from '../ids.js'

/**
 * Protocolo de sincronização offline (ADR-0004, ADR-0009).
 * O detalhamento operacional está em `.claude/skills/offline-sync/SKILL.md`.
 */

/** Versão do protocolo. Cliente com versão incompatível recebe pedido de atualização. */
export const SYNC_PROTOCOL_VERSION = 1

export const outboxStateSchema = z.enum(['pending', 'inflight', 'confirmed', 'failed'])
export type OutboxState = z.infer<typeof outboxStateSchema>

export const syncOperationSchema = z.enum(['upsert', 'delete'])
export type SyncOperation = z.infer<typeof syncOperationSchema>

/**
 * Item da outbox. Gravado na MESMA transação Dexie do registro de domínio — se uma
 * falha, as duas falham.
 */
export const outboxItemSchema = z.object({
  id: uuidV7Schema,
  entity: z.string().min(1),
  entityId: uuidV7Schema,
  op: syncOperationSchema,
  payload: z.unknown(),
  version: z.number().int().nonnegative(),
  state: outboxStateSchema,
  attempts: z.number().int().nonnegative(),
  /** Mensagem em pt-BR, mostrada ao usuário. Item em `failed` nunca some em silêncio. */
  lastError: z.string().optional(),
  createdAt: z.string().datetime(),
})

export type OutboxItem = z.infer<typeof outboxItemSchema>

export const pushRequestSchema = z.object({
  protocolVersion: z.number().int().positive(),
  clientSchemaVersion: z.number().int().positive(),
  items: z.array(outboxItemSchema).min(1).max(500),
})

export type PushRequest = z.infer<typeof pushRequestSchema>

export const pushAckSchema = z.object({
  id: uuidV7Schema,
  state: z.enum(['confirmed', 'failed']),
  error: z.string().optional(),
})

export const pushResponseSchema = z.object({
  acks: z.array(pushAckSchema),
  cursor: z.string(),
})

export type PushResponse = z.infer<typeof pushResponseSchema>

export const pullRequestSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().positive().max(1000).default(200),
})

export const syncChangeSchema = z.object({
  entity: z.string().min(1),
  entityId: uuidV7Schema,
  op: syncOperationSchema,
  version: z.number().int().nonnegative(),
  /** Já projetado pelo perfil: operador não recebe campo financeiro (constitution §6). */
  payload: z.unknown(),
})

export const pullResponseSchema = z.object({
  changes: z.array(syncChangeSchema),
  cursor: z.string(),
  hasMore: z.boolean(),
})

export type PullResponse = z.infer<typeof pullResponseSchema>

/** Cabeçalho de idempotência. Reenviar o mesmo lote não produz efeito adicional. */
export const IDEMPOTENCY_HEADER = 'idempotency-key'
