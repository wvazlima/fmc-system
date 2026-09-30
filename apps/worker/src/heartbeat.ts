import { writeFile } from 'node:fs/promises'

/**
 * Batimento de liveness. Em produção é o que uma sonda de liveness lê; no Compose é o
 * que o `healthcheck` do serviço `worker` verifica — ele não expõe porta HTTP.
 *
 * Mesmo comportamento nos dois ambientes: nada de caminho só-de-desenvolvimento
 * (ADR-0010).
 */
export const HEARTBEAT_PATH = '/tmp/fmc-worker.heartbeat'

export async function beat(path: string = HEARTBEAT_PATH): Promise<void> {
  await writeFile(path, new Date().toISOString(), 'utf8')
}
