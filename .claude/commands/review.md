---
description: Roda spec-reviewer, clean-code-reviewer, security-reviewer e sync-auditor e consolida um relatório único
argument-hint: <NNN>
arguments: numero
allowed-tools: Read, Grep, Glob, Bash
model: opus
---

Revisão completa da feature **$numero**.

## Preparação

1. Leia `specs/features/$numero-*/spec.md`, `plan.md` e `tasks.md`.
2. Rode `git diff` (ou `git diff main...HEAD`) para delimitar o que mudou.
3. Confirme que todas as tarefas de `tasks.md` estão marcadas. Liste as que não estão.

## Revisores

Acione os quatro **em paralelo**, cada um com o escopo do diff e o caminho da spec:

| Subagente             | Pergunta que ele responde                                                               |
| --------------------- | --------------------------------------------------------------------------------------- |
| `spec-reviewer`       | A implementação cumpre **todos** os critérios de aceite, incluindo `CA-OFF` e `CA-OP`?  |
| `sync-auditor`        | Há escrita fora da outbox, ID gerado no servidor ou vazamento financeiro para operador? |
| `security-reviewer`   | Autorização por perfil e fazenda, segredos, injeção, dado pessoal em log?               |
| `clean-code-reviewer` | Nomes, tamanho de função, duplicação, acoplamento, tratamento de erro?                  |

## Relatório consolidado

Junte tudo num único documento, **sem repetir** o mesmo achado citado por dois
revisores (consolide, mantendo a gravidade mais alta).

### 🔴 Bloqueantes

Viola a constitution, um ADR ou uma rule; critério de aceite não cumprido; teste
quebrado; vulnerabilidade crítica ou alta. Um por linha, com `arquivo:linha` e o
porquê.

### 🟡 Importantes

Vai custar caro depois.

### 🔵 Sugestões

Opcional.

### Cobertura dos critérios de aceite

A tabela do `spec-reviewer`, na íntegra.

### Veredito

**APROVADO** (nenhum bloqueante) ou **REPROVADO** (lista os bloqueantes).

Se reprovado, termine com a **ordem de correção** sugerida — o que consertar primeiro e
por quê.

Não corrija nada neste comando. Este comando **relata**.
