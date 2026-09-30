import { readAppEnv } from '@fmc/config'
import { beat } from './heartbeat.js'

/**
 * Worker de trabalho pesado e agendado.
 *
 * Em produção, cada job é um Cloud Run Job disparado pelo Cloud Scheduler. No local,
 * este processo mantém o batimento e aguarda — os jobs entram em `src/jobs/`, um por
 * feature (importação de planilhas, relatórios, NDVI, clima, geração de PMTiles).
 *
 * Todo job é idempotente: rodar duas vezes não duplica efeito.
 */
const appEnv = readAppEnv()
const TICK_MS = 15_000

let running = true
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    console.warn(`${signal} recebido, encerrando o worker.`)
    running = false
  })
}

console.warn(`worker iniciado (APP_ENV=${appEnv}). Nenhum job registrado ainda.`)

while (running) {
  await beat()
  await new Promise((resolve) => setTimeout(resolve, TICK_MS))
}
