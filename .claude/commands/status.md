---
description: Resume as features por estado e lista as pendências
allowed-tools: Read, Grep, Glob, Bash
---

Situação das features do projeto.

## Levantar

Para **cada** pasta em `specs/features/`:

1. Quais arquivos existem: `spec.md`, `plan.md`, `tasks.md`?
2. No `spec.md`: o campo **Estado** e a quantidade de **dúvidas abertas** ainda em
   aberto.
3. No `tasks.md` (se existir): tarefas totais, marcadas `[x]`, em andamento `[~]` e
   pendentes `[ ]`.
4. Há branch ou commit recente relacionado? (`git branch -a`, `git log --oneline -20`.)

## Classificar

| Estado               | Critério                                           |
| -------------------- | -------------------------------------------------- |
| **Spec**             | só `spec.md`, aguardando aprovação                 |
| **Planejada**        | tem `plan.md` e `tasks.md`, nenhuma tarefa marcada |
| **Em implementação** | pelo menos uma tarefa marcada, nem todas           |
| **Em revisão**       | todas as tarefas marcadas, sem PR fechado          |
| **Pronta**           | revisada e integrada                               |

## Apresentar

Uma tabela ordenada pelo número da feature:

| #   | Feature | Estado | Tarefas | Dúvidas abertas | Fase |
| --- | ------- | ------ | ------- | --------------- | ---- |

Depois da tabela, três blocos curtos:

**Bloqueado agora** — feature parada por dúvida aberta. Liste a dúvida e para quem
perguntar (produtor, contador, agrônomo).

**Pronto para o próximo passo** — spec aguardando aprovação, plano aguardando
implementação, feature aguardando `/review`.

**Fora do roadmap** — feature implementada sem spec, ou spec que não está no
`specs/roadmap.md`. Se não houver, diga que não há.
