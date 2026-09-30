---
description: Revisão de clean code focada num caminho, com lista priorizada
argument-hint: [caminho]
arguments: caminho
allowed-tools: Read, Grep, Glob, Bash
---

Revisão de clean code em **$caminho**.

Se `$caminho` estiver vazio, revise o que mudou: use `git diff` (ou
`git diff main...HEAD` se houver branch).

## Passos

1. Delimite o escopo. Se for uma pasta grande, liste os arquivos e diga o que vai
   revisar.
2. Leia as rules de `.claude/rules/` que se aplicam ao caminho.
3. Acione o subagente **`clean-code-reviewer`** com esse escopo.
4. Se o caminho tocar regra de domínio (cálculo, termo do agro, unidade), acione também
   **`dominio-agro`**.

## Relatório

Lista priorizada, sem reescrever o código:

- **🔴 Bloqueante** — viola constitution, ADR ou rule; ou quebra em produção.
- **🟡 Importante** — duplicação de regra, acoplamento indevido, erro engolido, nome que
  engana.
- **🔵 Sugestão** — melhoraria a leitura.

Cada item: `arquivo:linha` · o que está errado · **por que importa** · a direção da
correção em uma ou duas linhas.

Ao final, pergunte se quer que as correções sejam aplicadas. **Não aplique sem
confirmação.**

Se o código está bom, diga que está bom.
