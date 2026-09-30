import { afterEach, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../app.js'
import type { ApiConfig } from '../config.js'

const config: ApiConfig = {
  appEnv: 'local',
  host: '127.0.0.1',
  port: 0,
  logLevel: 'silent',
  databaseUrl: 'postgres://fmc:changeme@127.0.0.1:1/fmc',
  edgeSecret: 'segredo-de-teste',
}

let app: FastifyInstance | undefined

afterEach(async () => {
  await app?.close()
  app = undefined
})

describe('proteção da origem pelo cabeçalho da borda (ADR-0006)', () => {
  it('rejeita com 403 uma requisição sem o cabeçalho', async () => {
    app = await buildApp(config)
    const response = await app.inject({ method: 'GET', url: '/sync/pull' })
    expect(response.statusCode).toBe(403)
  })

  it('rejeita com 403 uma requisição com o cabeçalho errado', async () => {
    app = await buildApp(config)
    const response = await app.inject({
      method: 'GET',
      url: '/sync/pull',
      headers: { 'x-edge-secret': 'segredo-errado' },
    })
    expect(response.statusCode).toBe(403)
  })

  it('deixa /health passar sem o cabeçalho — é o healthcheck do Compose', async () => {
    app = await buildApp(config)
    const response = await app.inject({ method: 'GET', url: '/health' })
    // o banco de teste não existe, então a saúde é 503 — o que importa aqui é não ser 403
    expect(response.statusCode).not.toBe(403)
  })
})
