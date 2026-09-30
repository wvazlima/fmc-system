import { describe, expect, it, vi, afterEach } from 'vitest'
import worker, { type Env } from '../index.js'

const env: Env = {
  EDGE_SECRET: 'segredo-de-teste',
  API_ORIGIN: 'http://api.interno:3001',
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Worker de borda (ADR-0006)', () => {
  it('responde à própria saúde sem tocar na origem', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const response = await worker.fetch(new Request('https://app.fmc/__edge/health'), env)

    expect(response.status).toBe(200)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('recusa caminho fora de /api sem tocar na origem', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const response = await worker.fetch(new Request('https://app.fmc/admin'), env)

    expect(response.status).toBe(404)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('injeta o cabeçalho secreto e remove o prefixo /api ao encaminhar', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('ok', { status: 200 }))

    await worker.fetch(new Request('https://app.fmc/api/sync/pull?cursor=abc'), env)

    expect(fetchSpy).toHaveBeenCalledOnce()
    const forwarded = fetchSpy.mock.calls[0]![0] as Request
    expect(forwarded.url).toBe('http://api.interno:3001/sync/pull?cursor=abc')
    expect(forwarded.headers.get('X-Edge-Secret')).toBe('segredo-de-teste')
  })

  it('não vaza a origem quando ela está fora do ar', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED api.interno'))

    const response = await worker.fetch(new Request('https://app.fmc/api/health'), env)
    const body = await response.text()

    expect(response.status).toBe(502)
    expect(body).not.toContain('api.interno')
  })
})
