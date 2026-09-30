# Módulos de domínio

Monólito modular (ADR-0003). Um diretório por domínio, sempre com a mesma forma:

```
<dominio>/
├── routes.ts        # rotas Fastify — SEM lógica de negócio
├── service.ts       # regra de negócio; recebe o AccessScope como parâmetro
├── repository.ts    # acesso a dados via Drizzle
├── schemas.ts       # Zod (reexporta de @fmc/shared quando compartilhado)
└── __tests__/
```

Domínios previstos: `farms`, `cattle`, `coffee`, `crops`, `finance`, `sync`, `maps`,
`accounting`, `users`.

Cada um nasce com a feature que o exige, a partir de uma spec aprovada — não antes.

**Regras:** módulo não importa o `repository.ts` de outro; a comunicação é de `service`
para `service`; nenhum módulo acessa tabela de outro domínio direto pelo Drizzle. Ver
`.claude/rules/api.md`.
