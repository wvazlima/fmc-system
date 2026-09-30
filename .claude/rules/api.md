---
paths:
  - 'apps/api/**'
  - 'apps/worker/**'
---

# Regras — API e Worker

Vale para `apps/api/**` e `apps/worker/**`. O worker reutiliza os mesmos módulos de
domínio da API (ADR-0003), então as regras de serviço e repositório valem nos dois.

## Estrutura de módulo

Todo módulo de domínio tem exatamente esta forma:

```
apps/api/src/modules/<dominio>/
├── routes.ts        # rotas Fastify — SEM lógica de negócio
├── service.ts       # regra de negócio
├── repository.ts    # acesso a dados via Drizzle
├── schemas.ts       # Zod (reexporta de @fmc/shared quando compartilhado)
└── __tests__/
```

Domínios: `farms`, `cattle`, `coffee`, `crops`, `finance`, `sync`, `maps`,
`accounting`, `users`.

- **Handler não tem lógica.** Ele valida a entrada, chama **um** método de serviço e
  serializa a saída. Se um handler passa de ~15 linhas, a lógica está no lugar errado.
- **Módulo não importa o `repository.ts` de outro módulo.** Comunicação entre módulos é
  de `service` para `service`.
- **Nenhum módulo acessa tabela de outro domínio direto pelo Drizzle.**
- Módulo novo exige ADR? Não — mas exige registro em `arquitetura.md` e revisão do
  agente `arquiteto`.

## Validação

- **Zod na borda, sempre.** Toda rota declara `body`, `params`, `querystring` e
  `response` com schema Zod.
- Schema que o front também usa mora em `@fmc/shared` e é **reexportado** pelo módulo —
  nunca duplicado.
- Nada de `any` e nada de `as` para atravessar a validação. Se o tipo não fecha, o
  schema está errado.
- A saída também é validada. Schema de resposta é a última linha de defesa contra
  vazamento de campo financeiro (constitution §6).

## Autorização — em toda rota, sem exceção

Toda rota resolve o escopo **antes** do domínio:

```ts
// o plugin de auth injeta isto na requisição
type AccessScope = {
  organizationId: string
  farmIds: string[] // fazendas que este usuário alcança
  role: 'owner' | 'manager' | 'operator'
}
```

- O serviço recebe o `AccessScope` como parâmetro. **Ele não lê a requisição.**
- **Nunca confie no `farmId` do corpo ou da URL.** Cheque contra `scope.farmIds` e
  devolva `403` quando não bater.
- Toda consulta filtra por `organization_id` **e** por `farm_id` do escopo.
- `operator` **nunca** recebe campo de valor, custo, margem ou preço. A remoção acontece
  na **consulta**, não na serialização (constitution §6).
- Sem `SELECT *` em rota acessível a operador. Liste as colunas.

## Erros

- Erros de domínio são **tipados**, com código estável (`CATTLE_LOT_NOT_FOUND`), status
  HTTP e mensagem em pt-BR para o usuário.
- Nada de `throw new Error('deu ruim')`. Use as classes de erro do módulo.
- O `errorHandler` global traduz erro de domínio em resposta; nenhuma rota monta resposta
  de erro na mão.
- **Nunca** logue CPF, valor financeiro, e-mail ou token. Logue o `id` e o código do erro.

## Idempotência e sync

- Toda mutação aceita `Idempotency-Key` e é segura para reenvio (ADR-0009).
- O servidor **nunca** gera ID de registro que veio do app. O ID vem no corpo.
- Escrita é **upsert por `(id, version)`**.
- Mudança que afeta o payload de sync exige atualização do protocolo em
  `@fmc/shared/sync` e da versão do schema local.

## Cálculos

- Custo, margem, rateio e giro são calculados em **SQL** ou em **TypeScript puro e
  testado** — nunca por LLM (constitution §4).
- Fórmula nova entra na skill `dominio-agro` **e** tem teste com número conferido à mão.
- Dinheiro: `numeric(14,2)` no banco, inteiro em centavos no TypeScript. Nunca `float`.

## Fastify

- Um plugin por preocupação transversal (auth, escopo, erro, log, CORS), registrado em
  `app.ts`.
- Nada de estado global mutável entre requisições.
- Toda rota tem `schema` declarado — é o que gera a validação e a documentação.
- Health check em `/health`: responde `200` só se o banco respondeu. É o que o
  `healthcheck` do Compose e o Cloud Run usam.
