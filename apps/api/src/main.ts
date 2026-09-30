import { buildApp } from './app.js'
import { loadApiConfig } from './config.js'

const config = loadApiConfig()
const app = await buildApp(config)

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    app.log.info(`${signal} recebido, encerrando.`)
    void app.close().then(() => process.exit(0))
  })
}

try {
  await app.listen({ host: config.host, port: config.port })
} catch (error) {
  app.log.error({ err: error }, 'falha ao subir a API')
  process.exit(1)
}
