---
description: Implementa uma tarefa do tasks.md, roda os testes e marca o checkbox
argument-hint: <NNN> <T-NN>
arguments: numero tarefa
allowed-tools: Read, Grep, Glob, Write, Edit, Bash
---

Implementar a tarefa **$tarefa** da feature **$numero**.

## Antes de escrever código

1. Leia `specs/features/$numero-*/spec.md` e `plan.md`.
2. Leia a tarefa **$tarefa** em `tasks.md`: o critério de pronto e o teste associado.
3. Confirme que as tarefas das quais ela depende estão marcadas como prontas. Se não,
   **pare e avise**.
4. Leia as rules de `.claude/rules/` das áreas que a tarefa toca.

## Implementar

Escolha o subagente pela natureza da tarefa:

| Tarefa é de…                                  | Subagente       |
| --------------------------------------------- | --------------- |
| tabela, migração, consulta, geometria         | `dados-postgis` |
| endpoint, módulo, serviço da API              | `backend-api`   |
| outbox, push, pull, conflito, schema do Dexie | `offline-sync`  |
| tela, componente, repositório local           | `frontend-pwa`  |
| integração com terceiro                       | `integracoes`   |
| Terraform, Docker, Worker, CI                 | `infra-cloud`   |

Depois, acione **`test-writer`** para os testes, se o subagente de implementação não os
escreveu completos.

Se a tarefa exigir uma decisão que **não está no plano**, pare e pergunte. Não invente
regra de negócio.

## Verificar — obrigatório antes de fechar

Rode e **olhe a saída**:

```
pnpm --filter <pacote> typecheck
pnpm --filter <pacote> lint
pnpm --filter <pacote> test
```

Se a tarefa mexeu em migração, aplique e reverta no banco local (`make migrate`).
Se mexeu em serviço, confirme com `make health`.

**Só marque o checkbox em `tasks.md` depois de ver o teste passar.** Não escreva que
está pronto sem ter rodado.

## Ao final

Mostre: os arquivos alterados, a saída resumida dos testes, e o que a tarefa deixou em
aberto (se algo).
