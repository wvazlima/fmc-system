# NNN · Tarefas — <Nome da feature>

Cada tarefa é pequena o bastante para caber num commit. Cada uma tem critério de pronto
e teste associado. Marque o checkbox só quando o teste passar.

**Legenda:** `[ ]` pendente · `[~]` em andamento · `[x]` pronta

---

## Banco

- [ ] **T-01** — <descrição>
  - **Pronto quando:** migração gerada, aplicada em local e revertida com sucesso
  - **Teste:** `packages/db/src/__tests__/<arquivo>.test.ts`
  - **Depende de:** —

## API

- [ ] **T-02** — <descrição>
  - **Pronto quando:** endpoint responde ao contrato do plano; `operator` recebe 403 ou
    payload sem campo financeiro
  - **Teste:** `apps/api/src/modules/<modulo>/__tests__/<arquivo>.test.ts`
  - **Depende de:** T-01

## Sync

- [ ] **T-03** — <descrição>
  - **Pronto quando:** push e pull da entidade funcionam; reenvio do mesmo lote não
    duplica
  - **Teste:** teste de integração de sync
  - **Depende de:** T-02

## Web

- [ ] **T-04** — <descrição>
  - **Pronto quando:** funciona com a rede desligada; estado `pendente` visível; alvo de
    toque ≥ 44 px
  - **Teste:** `apps/web/src/**/__tests__/<arquivo>.test.tsx`
  - **Depende de:** T-03

## Fechamento

- [ ] **T-99** — Revisão final
  - **Pronto quando:** `/review NNN` sem item bloqueante; `pnpm lint`, `pnpm typecheck`,
    `pnpm test` e `pnpm build` verdes; `docker compose up` saudável
