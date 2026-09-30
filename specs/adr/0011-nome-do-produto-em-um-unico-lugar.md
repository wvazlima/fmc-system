# ADR-0011 · Nome do produto concentrado num único lugar

|               |            |
| ------------- | ---------- |
| **Data**      | 2026-09-29 |
| **Estado**    | aceito     |
| **Substitui** | —          |

## Contexto

O nome **"FMC Gestão Agrícola"** é **provisório**. O produto nasce para um cliente
(Fazenda Morro Cavado) mas a arquitetura já prevê SaaS multi-cliente. É bastante
provável que o nome mude antes do lançamento, e é certo que o nome do cliente não deve
estar espalhado pelo código.

Nome de produto tem a péssima característica de vazar para todo canto: título de página,
manifest do PWA, `<title>`, cabeçalho de e-mail, rodapé de relatório, nome de bucket,
mensagem de log, README.

## Decisão

Todo texto de marca vem de **um único módulo**: `packages/config/src/brand.ts`.

```ts
export const brand = {
  name: 'FMC Gestão Agrícola',
  shortName: 'FMC',
  description: 'Gestão de gado, café e custos, mesmo sem internet.',
  themeColor: '#1f3d2b',
  backgroundColor: '#ffffff',
} as const
```

Regras:

1. Nenhum arquivo além de `brand.ts` contém o nome do produto em texto literal.
2. O **manifest do PWA** é **gerado** a partir de `brand`, não escrito à mão.
3. O `<title>`, o cabeçalho e o rodapé de relatório leem de `brand`.
4. **Nome técnico é separado de nome de marca.** O escopo dos pacotes (`@fmc/`), o nome
   do repositório (`fmc-system`) e os identificadores de infraestrutura **não** mudam
   quando a marca mudar. Renomear pacote e bucket é caro e não traz valor.
5. O nome do **cliente** ("Fazenda Morro Cavado") não aparece em lugar nenhum do código:
   ele é o registro `organizations.name` no banco.

## Alternativas consideradas

### Nome direto no código, trocar com "localizar e substituir" quando mudar

- **A favor:** zero infraestrutura.
- **Contra:** sempre sobra ocorrência; e o substituir cego acerta o que não devia
  (`@fmc/shared`, `fmc-system`).
- **Por que não:** a troca do nome é provável, não hipotética.

### Sistema de i18n desde já, com o nome como chave de tradução

- **A favor:** resolve nome e futuro multi-idioma.
- **Contra:** peso de infraestrutura para um produto que hoje é só pt-BR.
- **Por que não:** exagero agora. Quando i18n entrar, `brand.ts` vira uma das fontes.

### Nome vindo do banco, por organização (white-label)

- **A favor:** caminho natural do SaaS multi-cliente.
- **Contra:** o manifest do PWA é estático e servido pelo Pages; não dá para variar por
  organização sem complicar bastante o build.
- **Por que não:** prematuro. `brand.ts` é o passo intermediário certo e não atrapalha
  essa evolução.

## Consequências

**Positivas**

- Trocar o nome do produto é editar um arquivo e rebuildar.
- Nome de marca e nome técnico ficam desacoplados.

**Negativas e custos aceitos**

- O manifest do PWA passa a ser gerado no build, um passo a mais.
- É preciso disciplina para não escrever o nome direto numa tela nova.

**O que passa a ser proibido**

- Nome do produto em texto literal fora de `brand.ts`.
- Nome do cliente em qualquer lugar do código.
- `manifest.json` escrito à mão.

## Como verificar que a decisão está sendo respeitada

Regra de lint proibindo a literal fora de `brand.ts`; `.claude/rules/web.md`; revisão
do agente `arquiteto` em toda tela nova.
