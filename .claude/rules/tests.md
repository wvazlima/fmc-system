---
paths:
  - '**/*.test.ts'
  - '**/*.test.tsx'
  - '**/__tests__/**'
  - '**/*.spec.ts'
---

# Regras — Testes

Vitest em todo o monorepo.

## O que precisa de teste

- **Todo critério de aceite da spec** tem pelo menos um teste que o verifica. O
  `spec-reviewer` confere essa correspondência.
- **Todo cálculo de negócio** (custo/ha, custo/saca, margem, giro, rateio, transferência
  interna) tem teste com número **conferido à mão** e escrito no comentário do teste
  (constitution §4).
- **Toda rota** tem teste de autorização: perfil certo passa, perfil errado recebe 403,
  fazenda de fora recebe 403.
- **Toda entidade nova no sync** tem os cinco testes obrigatórios de
  `.claude/rules/sync.md`.
- **Todo bug corrigido** ganha um teste que falha antes da correção.

## Estrutura

```ts
describe('calculateCostPerBag', () => {
  it('divide o custo total da safra pelas sacas colhidas', () => {
    // custo 450.000,00 / 1.000 sacas = 450,00 por saca
    expect(calculateCostPerBag({ totalCostCents: 45_000_000, bags: 1000 })).toBe(45_000)
  })
})
```

- Nome do teste descreve o **comportamento**, em pt-BR, não o nome do método.
- Um comportamento por `it`. Se precisou de "e" na descrição, são dois testes.
- **Arrange, Act, Assert** visualmente separados.
- Sem `if`, `for` ou `try` no corpo do teste. Caso a mais é `it.each`.

## Fixtures

- Fixtures em `__tests__/fixtures/`, construídas por **factory com sobrescrita parcial**:
  `makeCattleLot({ farmId })`. Nada de objeto literal gigante copiado em dez testes.
- Toda factory preenche `organization_id`, `farm_id`, `version`, `source` e as datas.
- **Dado fictício sempre.** Nunca dado real de cliente, nem "anonimizado" na mão.
- Datas fixas e explícitas. Nada de `new Date()` dentro do teste — congele o relógio.

## Isolamento

- **Nenhum teste depende de rede externa.** Sem chamada a API de terceiro, sem CDN, sem
  DNS.
- Teste de integração usa o Postgres do Compose, em banco próprio, com transação
  revertida ao final ou banco recriado.
- Ordem dos testes não importa: cada um monta e derruba o que precisa.
- Teste que só passa na segunda execução é bug do teste. Conserte, não repita.

## O que não fazer

- Não teste implementação: teste comportamento observável. Renomear um método privado
  não pode quebrar teste.
- Não faça mock do que você é dono. Mock é para a **fronteira** (relógio, storage,
  provedor de identidade, API de terceiro).
- Não use `expect(true).toBe(true)` para "cobrir" um caminho.
- Não coloque `console.log` em teste commitado.
- Cobertura é sinal, não meta. Perseguir número gera teste inútil.
