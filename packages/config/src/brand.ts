/**
 * Identidade do produto — fonte única (ADR-0011).
 *
 * O nome é provisório. Nenhum outro arquivo do repositório contém o nome do produto
 * como texto literal: telas, manifest do PWA, `<title>`, cabeçalho de relatório e
 * rodapé de e-mail leem daqui.
 *
 * Nome de marca ≠ nome técnico. O escopo dos pacotes (`@fmc/`), o nome do repositório
 * (`fmc-system`) e os identificadores de infraestrutura NÃO mudam quando a marca mudar.
 *
 * O nome do cliente não aparece aqui nem em lugar nenhum do código: ele é o registro
 * `organizations.name` no banco.
 */
export const brand = {
  name: 'FMC Gestão Agrícola',
  shortName: 'FMC',
  description: 'Gestão de gado, café e custos, mesmo sem internet.',
  themeColor: '#1f3d2b',
  backgroundColor: '#ffffff',
  locale: 'pt-BR',
} as const

export type Brand = typeof brand
