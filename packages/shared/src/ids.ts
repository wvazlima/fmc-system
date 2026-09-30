import { z } from 'zod'

/**
 * Identidade de registro — UUID v7 gerado no cliente (ADR-0009).
 *
 * O servidor NUNCA gera o id de um registro que veio do app. Offline, o registro
 * precisa existir e ser referenciável antes de haver servidor.
 *
 * v7 e não v4 porque o prefixo de timestamp mantém boa localidade de inserção nos
 * índices B-tree do Postgres.
 */
const UUID_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const uuidV7Schema = z
  .string()
  .regex(UUID_V7, 'Identificador precisa ser um UUID v7 gerado no cliente (ADR-0009).')

export type UuidV7 = z.infer<typeof uuidV7Schema>

export function isUuidV7(value: string): boolean {
  return UUID_V7.test(value)
}
