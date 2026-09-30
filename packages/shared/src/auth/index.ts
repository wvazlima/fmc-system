import { z } from 'zod'
import { uuidV7Schema } from '../ids.js'

/**
 * Perfis de acesso. A restrição do operador é estrutural, não cosmética:
 * ele nunca recebe dado financeiro — nem na API, nem no sync, nem no dispositivo
 * (constitution §6).
 */
export const roleSchema = z.enum(['owner', 'manager', 'operator'])
export type Role = z.infer<typeof roleSchema>

/**
 * Escopo de acesso resolvido uma única vez, antes do domínio.
 *
 * O serviço RECEBE o escopo como parâmetro; ele não lê a requisição. Nenhuma consulta
 * confia em `farmId` vindo do cliente sem checar contra `farmIds`.
 */
export const accessScopeSchema = z.object({
  organizationId: uuidV7Schema,
  userId: uuidV7Schema,
  role: roleSchema,
  /** Fazendas que este usuário alcança. Para owner e manager, todas da organização. */
  farmIds: z.array(uuidV7Schema).readonly(),
})

export type AccessScope = z.infer<typeof accessScopeSchema>

/** Verdadeiro quando o perfil pode ver valor, custo, margem e preço. */
export function canSeeFinancials(role: Role): boolean {
  return role !== 'operator'
}

/** Verdadeiro quando o escopo alcança a fazenda. Use antes de qualquer consulta. */
export function hasFarmAccess(scope: AccessScope, farmId: string): boolean {
  return scope.farmIds.includes(farmId)
}
