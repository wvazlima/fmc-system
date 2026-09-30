---
name: clean-code
description: Padrões de código do projeto com exemplos bons e ruins em TypeScript — nomes, tamanho de função, tratamento de erro, tipos, duplicação, acoplamento. Use ao escrever código novo, ao revisar código, ou quando estiver em dúvida sobre como estruturar uma função, um erro ou um tipo.
user-invocable: false
---

# Clean code no FMC

Exemplos em TypeScript, tirados do domínio real. Nomes de domínio vêm sempre do
`specs/glossario.md`.

## Nomes

```ts
// ❌ o que é "data"? o que é "process"?
function process(data: any) { ... }
const d = getData()

// ✅ diz o que é e o que faz
function calculateCostPerBag(input: CostPerBagInput): Cents { ... }
const activeCattleLots = await listActiveCattleLots(scope)
```

- Termo do domínio em **inglês**, exatamente como no glossário: `plot`, não `field`;
  `cattle_lot`, não `batch`; `accrual_date`, não `competence_date`.
- **Declare a unidade no nome:** `totalCostCents`, `weightKg`, `areaHa`, `volumeKg`.
  Confusão de unidade é o erro mais caro do projeto.
- Booleano começa com `is`, `has`, `should`, `can`: `isPregnant`, `hasPendingSync`.
- Função é verbo; valor é substantivo. Função chamada `cattleLot` está errada.
- `data`, `info`, `item`, `handle`, `process`, `manager`, `util`, `helper` quase sempre
  escondem falta de entendimento do que a coisa é.

## Funções

```ts
// ❌ faz três coisas, e o nome só conta uma
async function saveCattleLot(input: unknown, req: FastifyRequest) {
  const scope = resolveScope(req) // 1. autorização
  const parsed = cattleLotSchema.parse(input) // 2. validação
  if (!scope.farmIds.includes(parsed.farmId)) throw new Error('403')
  const cost = parsed.animals.reduce((s, a) => s + a.priceCents, 0) // 3. cálculo
  return db.insert(cattleLots).values({ ...parsed, totalCostCents: cost })
}

// ✅ cada camada no seu lugar
// routes.ts — valida e delega
app.post('/farms/:farmId/cattle-lots', { schema }, async (req) =>
  cattleLotService.create(req.scope, req.body),
)

// service.ts — regra de negócio
async function create(scope: AccessScope, input: CreateCattleLotInput) {
  assertFarmAccess(scope, input.farmId)
  const totalCostCents = sumAnimalPrices(input.animals)
  return cattleLotRepository.insert({ ...input, totalCostCents })
}
```

- Uma função faz **uma** coisa. Se você precisou de "e" para descrevê-la, são duas.
- Handler Fastify com mais de ~15 linhas tem lógica no lugar errado.
- **Early return** em vez de pirâmide de `if`.
- Mais de três níveis de aninhamento é sinal de função para extrair.

## Tipos

```ts
// ❌ any atravessa a validação e some o erro
function apply(input: any) { return input.doseValue * input.area }

// ❌ tipo primitivo não diz nada
function transfer(from: string, to: string, amount: number) { ... }

// ✅ o tipo carrega a intenção
type Cents = number & { readonly __brand: 'Cents' }
type FarmId = string & { readonly __brand: 'FarmId' }

function transferCattle(params: {
  fromFarmId: FarmId
  toFarmId: FarmId
  animalIds: AnimalId[]
  freightCents: Cents
}): Promise<FarmTransfer> { ... }
```

- **Nunca `any`.** Se o tipo não fecha, o schema Zod está errado.
- `as` só para estreitar o que você provou; nunca para atravessar a validação.
- Parâmetro nomeado (objeto) a partir de três argumentos — `transfer(a, b, c, d)` é
  convite a trocar a ordem.
- Tipos compartilhados vivem em `@fmc/shared`, derivados dos schemas Zod.
- Union discriminada em vez de booleano opcional:
  `{ status: 'confirmed' } | { status: 'failed', reason: string }`.

## Erros

```ts
// ❌ erro genérico, engolido, e ainda loga dado pessoal
try {
  await syncPush(items)
} catch (e) {
  console.log('erro no sync', items) // items tem valores financeiros
}

// ✅ erro tipado, com código estável e mensagem para o usuário
export class CattleLotNotFoundError extends DomainError {
  readonly code = 'CATTLE_LOT_NOT_FOUND'
  readonly status = 404
  constructor(readonly lotId: string) {
    super(`Lote de gado não encontrado.`)
  }
}

try {
  await syncPush(items)
} catch (error) {
  logger.warn({ itemCount: items.length, code: toErrorCode(error) }, 'sync push falhou')
  throw error
}
```

- Erro de domínio é **classe tipada** com código estável, status e mensagem em pt-BR.
- **Nunca** `throw new Error('string solta')`.
- **`catch` vazio é proibido.** `catch` que só loga e segue também — decida: tratar ou
  propagar.
- **Nunca logue** CPF, valor financeiro, e-mail, token. Logue `id` e código.

## Duplicação e abstração

- Regra de negócio implementada duas vezes vai divergir. Extraia.
- **Mas:** abstração criada para dois casos que só _parecem_ iguais é pior que a
  duplicação. Espere o terceiro caso.
- Cálculo do domínio mora em **um** lugar, testado, e é consumido por API, worker e web.

## Acoplamento

- Módulo **não** importa o `repository.ts` de outro (ADR-0003). Fale com o `service.ts`.
- Serviço **recebe** o `AccessScope`; ele não lê a requisição.
- Componente de tela não conhece o formato do banco nem calcula número de negócio.
- Dependência de fronteira (relógio, storage, identidade, terceiro) entra por parâmetro
  ou injeção — é o que torna o teste possível sem mock frágil.

## Comentários

```ts
// ❌ repete o código
// incrementa o contador
counter++

// ✅ explica o porquê
// A margem atravessa transferências: o animal que mudou de fazenda mantém a apuração
// desde a compra. Ver specs/glossario.md → farm_transfer.
const costBasis = await sumCostSincePurchase(animalId)
```

- Comentário explica **por quê**, nunca **o quê**.
- **Código comentado é lixo** — apague, o git lembra.
- `TODO` sem dono e sem data é mentira. Ou vira issue, ou sai.

## Antes de dizer que terminou

Rode `pnpm lint`, `pnpm typecheck` e `pnpm test` do pacote afetado. **Olhe a saída.**
"Deve funcionar" não conta.
