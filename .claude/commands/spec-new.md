---
description: Cria a pasta da feature com spec.md a partir do template, usando o spec-writer
argument-hint: <nome-da-feature>
arguments: nome
allowed-tools: Read, Grep, Glob, Write, Edit, Bash(ls:*), Bash(git status:*)
---

Criar a spec da feature **$nome**.

## Passos

1. Liste `specs/features/` e determine o **próximo número** da sequência (`NNN`, três
   dígitos). Slug: `$nome` em minúsculas, sem acento, separado por hífen.
2. Leia `specs/_templates/spec.md`, `specs/glossario.md`, `specs/constitution.md` e
   `specs/roadmap.md`. Olhe as specs das features vizinhas.
3. Se a pasta já existir, **pare e avise** — não sobrescreva nada.
4. Acione o subagente **`spec-writer`** para escrever
   `specs/features/NNN-<slug>/spec.md`, passando tudo o que já foi conversado sobre
   esta feature nesta sessão.
5. Acione o subagente **`dominio-agro`** para revisar a spec: nomenclatura contra o
   glossário, unidades, regras de gado, café e custo. Aplique as correções apontadas.

## Ao final

Mostre:

- o caminho do arquivo criado;
- os critérios de aceite em uma lista curta, incluindo `CA-OFF` e `CA-OP`;
- **as dúvidas abertas que bloqueiam a implementação**, em destaque, com para quem
  perguntar (produtor, contador ou agrônomo).

Lembre que a spec precisa de **aprovação humana** antes de `/spec-plan`. Não gere plano
nem código.
