import { describe, expect, it } from 'vitest'
import { canSeeFinancials, hasFarmAccess, type AccessScope } from '../auth/index.js'

const FARM_A = '0194b8c0-0000-7000-8000-000000000001'
const FARM_B = '0194b8c0-0000-7000-8000-000000000002'

function makeScope(overrides: Partial<AccessScope> = {}): AccessScope {
  return {
    organizationId: '0194b8c0-0000-7000-8000-0000000000aa',
    userId: '0194b8c0-0000-7000-8000-0000000000bb',
    role: 'operator',
    farmIds: [FARM_A],
    ...overrides,
  }
}

describe('canSeeFinancials', () => {
  it('nega dado financeiro ao operador', () => {
    expect(canSeeFinancials('operator')).toBe(false)
  })

  it('permite dado financeiro a dono e gerente', () => {
    expect(canSeeFinancials('owner')).toBe(true)
    expect(canSeeFinancials('manager')).toBe(true)
  })
})

describe('hasFarmAccess', () => {
  it('permite fazenda dentro do escopo', () => {
    expect(hasFarmAccess(makeScope(), FARM_A)).toBe(true)
  })

  it('nega fazenda fora do escopo, mesmo para gerente', () => {
    expect(hasFarmAccess(makeScope({ role: 'manager' }), FARM_B)).toBe(false)
  })
})
