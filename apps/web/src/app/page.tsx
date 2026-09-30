import { brand } from '@fmc/config/brand'
import { SYNC_PROTOCOL_VERSION } from '@fmc/shared/sync'

/**
 * Tela inicial provisória. As telas de verdade nascem com as features, a partir de
 * uma spec aprovada (`specs/features/`).
 */
export default function HomePage() {
  return (
    <main style={{ padding: '1.5rem', maxWidth: '40rem' }}>
      <h1 style={{ color: 'var(--fmc-brand)', marginBottom: '0.5rem' }}>{brand.name}</h1>
      <p style={{ color: 'var(--fmc-muted)', marginTop: 0 }}>{brand.description}</p>

      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1rem' }}>Esqueleto do PWA</h2>
        <p>
          Nenhuma tela de negócio foi implementada ainda. O fluxo do projeto é Spec-Driven: cada
          tela nasce de uma spec aprovada em <code>specs/features/</code>.
        </p>
        <dl>
          <dt>Versão do protocolo de sync</dt>
          <dd>{SYNC_PROTOCOL_VERSION}</dd>
        </dl>
      </section>
    </main>
  )
}
