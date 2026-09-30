---
description: Cria um ADR numerado a partir do template e atualiza o índice
argument-hint: <título da decisão>
arguments: titulo
allowed-tools: Read, Grep, Glob, Write, Edit, Bash(ls:*)
---

Registrar a decisão de arquitetura: **$titulo**.

## Antes de escrever

1. Liste `specs/adr/` e determine o **próximo número** (`NNNN`, quatro dígitos).
2. Leia `specs/adr/README.md` e verifique se **já existe um ADR sobre este assunto**.
   Se existir:
   - a decisão continua válida? Então não há ADR novo — aplique a existente e explique.
   - a decisão está sendo **substituída**? O ADR novo declara `Substitui: ADR-NNNN`, e o
     antigo passa a `substituído por ADR-NNNN`. **Não edite o conteúdo do antigo.**
3. Leia `specs/constitution.md` — se a decisão viola um princípio, ela não vira ADR:
   ela é barrada, ou a constitution precisa mudar (e isso é uma conversa, não um
   arquivo).

## Escrever

Acione o subagente **`arquiteto`** para escrever
`specs/adr/NNNN-<slug-do-titulo>.md` a partir de `specs/_templates/adr.md`.

O ADR precisa ter, de verdade:

- **Contexto** — a situação que força a decisão, o que é fato e o que é suposição.
- **Decisão** — em voz ativa e no presente, específica o bastante para ser verificável.
- **Alternativas consideradas** — pelo menos duas, cada uma com um argumento **honesto a
  favor** e o porquê da rejeição. Esta é a parte mais importante do documento. Se você
  não consegue defender a alternativa rejeitada, ainda não entendeu o problema.
- **Consequências** — positivas, negativas e custos aceitos, e **o que passa a ser
  proibido**.
- **Como verificar** — qual rule, agente, teste ou hook sustenta esta decisão no dia a
  dia.

## Ao final

- Atualize a tabela em `specs/adr/README.md`.
- Se a decisão muda a arquitetura, atualize `specs/arquitetura.md`.
- Mostre o caminho do arquivo e a decisão em uma frase.
