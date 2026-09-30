# ADR-0003 · Monólito modular na API

|               |            |
| ------------- | ---------- |
| **Data**      | 2026-09-29 |
| **Estado**    | aceito     |
| **Substitui** | —          |

## Contexto

O domínio tem nove áreas: `farms`, `cattle`, `coffee`, `crops`, `finance`, `sync`,
`maps`, `accounting`, `users`. Elas são fortemente acopladas por natureza: uma venda de
gado mexe em `cattle` e em `finance`; um rateio atravessa todas as frentes; o `sync` toca
em tudo.

O volume é baixo — cinco fazendas, dezenas de usuários — e o time é pequeno.

## Decisão

A API é um **monólito modular**: **um** serviço Fastify (`apps/api`), internamente
dividido em módulos por domínio, cada um com a mesma estrutura:

```
apps/api/src/modules/<dominio>/
├── routes.ts        # rotas Fastify; sem lógica de negócio
├── service.ts       # regra de negócio
├── repository.ts    # acesso a dados via Drizzle
├── schemas.ts       # Zod (reexporta de @fmc/shared quando compartilhado)
└── __tests__/
```

Módulos se comunicam **pela camada de serviço**, nunca pelo repositório de outro módulo.

A separação em serviços é **por tipo de carga**, não por domínio: `api` (requisição de
usuário), `worker` (batch e agendado), `edge` (borda), `agent` (Fase 2).

## Alternativas consideradas

### Microsserviços por domínio

- **A favor:** escala e deploy independentes; fronteiras impostas pelo runtime.
- **Contra:** transação distribuída para uma venda de gado que lança no financeiro;
  nove pipelines; observabilidade distribuída; e um sync que precisaria compor dados de
  todos os serviços.
- **Por que não:** todo o custo, nenhum dos benefícios no volume que temos.

### Monólito sem módulos

- **A favor:** mais simples no começo.
- **Contra:** em seis meses, `finance` chama query de `cattle` direto e não há mais como
  separar nada.
- **Por que não:** a estrutura modular custa pouco agora e preserva a opção de extrair
  depois.

## Consequências

**Positivas**

- Transação de banco única cobrindo venda + lançamento financeiro.
- Um deploy, um log, um trace.
- `worker` reutiliza os mesmos módulos de domínio, sem chamada HTTP interna.

**Negativas e custos aceitos**

- A fronteira entre módulos é sustentada por disciplina e revisão, não pelo runtime.
- Toda a API escala junto.

**O que passa a ser proibido**

- `import` do `repository.ts` de outro módulo.
- Rota com lógica de negócio dentro do handler.
- Módulo acessando tabela de outro domínio direto pelo Drizzle.

## Como verificar que a decisão está sendo respeitada

`.claude/rules/api.md`; regra de ESLint de fronteira entre módulos; agentes
`arquiteto` e `clean-code-reviewer`.
