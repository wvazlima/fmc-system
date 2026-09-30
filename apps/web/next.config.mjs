/** @type {import('next').NextConfig} */
const nextConfig = {
  // PWA estático servido pelo Cloudflare Pages: sem SSR, sem rota de API no Next,
  // sem Server Action. A API é o Fastify, atrás do Worker de borda (ADR-0006).
  output: 'export',
  reactStrictMode: true,
  // Os pacotes do workspace são publicados como TypeScript cru (sem build próprio):
  // o Next precisa compilá-los, e é isso que faz a resolução de `./x.js` → `./x.ts`
  // funcionar do lado do webpack.
  transpilePackages: ['@fmc/config', '@fmc/shared', '@fmc/ui'],
  images: { unoptimized: true },
  // O monorepo é a raiz do rastreamento de arquivos.
  outputFileTracingRoot: new URL('../../', import.meta.url).pathname,
  webpack: (config) => {
    // Os pacotes do workspace são TypeScript cru e usam o especificador `./x.js` que o
    // TypeScript exige para saída ESM. Sem este alias, o webpack procura um `.js` que
    // não existe em disco.
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
    }
    return config
  },
}

export default nextConfig
