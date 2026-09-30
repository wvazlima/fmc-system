import Fastify, { type FastifyInstance } from 'fastify'
import { createPool, ping } from '@fmc/db'
import { SYNC_PROTOCOL_VERSION } from '@fmc/shared/sync'
import type { ApiConfig } from './config.js'
import edgeGuard from './plugins/edge-guard.js'

export async function buildApp(config: ApiConfig): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.logLevel,
      // Nunca logue CPF, valor financeiro, e-mail ou token (.claude/rules/security.md).
      redact: ['req.headers.authorization', 'req.headers["x-edge-secret"]'],
    },
  })

  const pool = createPool(config.databaseUrl)
  app.addHook('onClose', async () => {
    await pool.end()
  })

  await app.register(edgeGuard, { edgeSecret: config.edgeSecret })

  /**
   * Saúde. Responde 200 apenas se o banco respondeu — é o que o healthcheck do
   * Compose e o do Cloud Run usam.
   */
  app.get('/health', async (_request, reply) => {
    try {
      const { postgis } = await ping(pool)
      return {
        status: 'ok',
        appEnv: config.appEnv,
        syncProtocolVersion: SYNC_PROTOCOL_VERSION,
        database: { reachable: true, postgis },
      }
    } catch (error) {
      app.log.error({ err: error }, 'health check falhou: banco inacessível')
      return reply.code(503).send({
        status: 'degraded',
        database: { reachable: false },
      })
    }
  })

  // Módulos de domínio entram aqui, um por feature, a partir de uma spec aprovada:
  // farms, cattle, coffee, crops, finance, sync, maps, accounting, users.
  // Ver apps/api/src/modules/README.md e .claude/rules/api.md.

  return app
}
