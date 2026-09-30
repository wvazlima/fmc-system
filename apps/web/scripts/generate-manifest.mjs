/**
 * Gera `public/manifest.webmanifest` a partir de `@fmc/config` (ADR-0011).
 *
 * O manifest NÃO é escrito à mão: o nome do produto é provisório e vive num único
 * lugar. Trocar a marca é editar `packages/config/src/brand.ts` e rebuildar.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const brandPath = resolve(here, '../../../packages/config/src/brand.ts')

// brand.ts é TypeScript; este script roda em Node puro, antes do bundler.
// Em vez de compilar, lemos os campos do objeto literal — que é `as const` e plano.
const source = await import('node:fs/promises').then((fs) => fs.readFile(brandPath, 'utf8'))

function field(name) {
  const match = source.match(new RegExp(`${name}:\\s*'([^']*)'`))
  if (!match) throw new Error(`Campo "${name}" não encontrado em brand.ts`)
  return match[1]
}

const manifest = {
  name: field('name'),
  short_name: field('shortName'),
  description: field('description'),
  lang: field('locale'),
  start_url: '/',
  scope: '/',
  display: 'standalone',
  orientation: 'portrait',
  theme_color: field('themeColor'),
  background_color: field('backgroundColor'),
  icons: [],
}

const out = resolve(here, '../public/manifest.webmanifest')
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
console.warn(`manifest gerado: ${manifest.name}`)
