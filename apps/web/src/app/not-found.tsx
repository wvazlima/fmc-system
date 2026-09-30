import Link from 'next/link'

/**
 * 404 do App Router.
 *
 * Sem esta tela, o Next cai no `_error` do Pages Router para gerar a página padrão, o
 * que quebra o export estático. E, de qualquer forma, o usuário merece uma mensagem em
 * pt-BR com um caminho de volta.
 */
export default function NotFound() {
  return (
    <main style={{ padding: '1.5rem', maxWidth: '40rem' }}>
      <h1 style={{ color: 'var(--fmc-brand)' }}>Página não encontrada</h1>
      <p style={{ color: 'var(--fmc-muted)' }}>
        O endereço que você abriu não existe. Se você chegou aqui por um link antigo, ele pode ter
        mudado.
      </p>
      <Link href="/" data-touch-target style={{ display: 'inline-flex', alignItems: 'center' }}>
        Voltar para o início
      </Link>
    </main>
  )
}
