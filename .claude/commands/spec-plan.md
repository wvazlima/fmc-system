---
description: Gera plan.md e tasks.md a partir de uma spec aprovada e aciona o arquiteto para revisar
argument-hint: <NNN>
arguments: numero
allowed-tools: Read, Grep, Glob, Write, Edit, Bash(ls:*), Bash(git status:*)
---

Gerar o plano de implementação da feature **$numero**.

## Antes de começar

1. Localize a pasta `specs/features/$numero-*/`. Se não existir, pare e avise.
2. Leia a `spec.md` inteira. **Se houver dúvida aberta que bloqueia o plano, pare e
   liste as dúvidas** — não planeje em cima de suposição.
3. Confirme que a spec foi aprovada. Se não houver sinal de aprovação, pergunte antes de
   seguir.

## Passos

1. Acione o subagente **`planner`** para escrever `plan.md` e `tasks.md` na pasta da
   feature, a partir dos templates em `specs/_templates/`.
2. Acione o subagente **`arquiteto`** para revisar o plano contra a
   `specs/constitution.md` e os ADRs. Inclua o veredito dele no fim do `plan.md`.
3. Se o veredito for **BLOQUEADO**, corrija o plano e revise de novo.
4. Se o veredito for **PRECISA DE ADR**, peça ao `arquiteto` que escreva o ADR e
   atualize `specs/adr/README.md` antes de fechar o plano.

## Ao final

Mostre:

- o caminho dos dois arquivos;
- o **modelo de dados** em resumo (tabelas novas e alteradas);
- o **impacto no sync** em uma frase;
- o número de tarefas e a ordem das fases;
- o **veredito do arquiteto**;
- os riscos marcados como altos.
