---
name: sdd-workflow
description: Como escrever spec, plan, tasks e ADR no padrão deste projeto, com exemplo completo. Use ao criar uma feature nova, ao transformar uma conversa em spec, ao gerar plano e tarefas, ao registrar uma decisão de arquitetura, ou quando estiver em dúvida sobre qual etapa do fluxo SDD vem agora.
---

# Fluxo Spec-Driven Development

O ciclo tem seis passos. **Nenhum código de feature é escrito antes do passo 3.**

```
1. Descobrir  →  2. Spec  →  [APROVAÇÃO HUMANA]  →  3. Plano  →
4. Implementar  →  5. Revisar  →  6. Fechar
```

| Passo          | Comando                | Agente                                                                        | Saída                             |
| -------------- | ---------------------- | ----------------------------------------------------------------------------- | --------------------------------- |
| 1. Descobrir   | —                      | conversa com quem usa                                                         | entendimento                      |
| 2. Spec        | `/spec-new <nome>`     | `spec-writer`                                                                 | `specs/features/NNN-slug/spec.md` |
| 3. Plano       | `/spec-plan <NNN>`     | `planner` + `arquiteto`                                                       | `plan.md` e `tasks.md`            |
| 4. Implementar | `/implement <NNN> <T>` | `backend-api`, `frontend-pwa`, `dados-postgis`, `offline-sync`, `test-writer` | código + teste                    |
| 5. Revisar     | `/review <NNN>`        | `spec-reviewer`, `clean-code-reviewer`, `security-reviewer`, `sync-auditor`   | relatório                         |
| 6. Fechar      | `/release-check`       | `doc-writer`                                                                  | PR                                |

## 1. Descobrir

Entenda o problema com quem vive ele. Como é feito hoje na planilha, quanto custa, o que
dói. **Nada de solução, nada de código.** Anote as perguntas que sobraram — elas viram
as dúvidas abertas da spec.

## 2. Spec — o que a feature precisa entregar

Template: `specs/_templates/spec.md`. A spec descreve **problema e resultado**, não
solução técnica.

O que separa uma spec boa de uma ruim:

- **Critério de aceite verificável.** Se não dá para escrever um teste a partir dele,
  está mal escrito.
- **`CA-OFF` e `CA-OP` obrigatórios.** Toda spec descreve o comportamento offline e o
  que o operador vê e não vê.
- **Fora de escopo generoso.** É o que impede a feature de inchar.
- **Dúvida aberta em vez de invenção.** Nunca preencha um buraco de regra de negócio com
  suposição.

### Exemplo de critério bem escrito

```markdown
### CA-04 · Transferência não encerra a apuração de margem

- **Dado** um animal comprado na fazenda A por R$ 3.200,00, com R$ 180,00 de custos
- **Quando** ele é transferido para a fazenda B com frete de R$ 45,00 e GTA de R$ 12,00
- **Então** o animal aparece na fazenda B com custo acumulado de R$ 3.437,00
- **E** nenhuma margem é apurada na fazenda A
- **E** ao ser vendido na fazenda B, a margem considera o custo desde a compra
```

Compare com um ruim: _"o sistema deve permitir transferir animais entre fazendas"_ — não
diz o que verificar.

**A spec é aprovada por um humano antes do passo 3.** Este é um portão real.

## 3. Plano — como construir

Templates: `specs/_templates/plan.md` e `tasks.md`.

O `plan.md` fecha: modelo de dados (com as colunas obrigatórias e os índices),
endpoints (com o que acontece para `operator`), impacto no sync (entidades, projeção,
conflito, versão do Dexie), telas, permissões, cálculos por extenso, riscos e testes.

O `tasks.md` quebra em tarefas de um commit, na ordem **banco → API → sync → web →
fechamento**, cada uma com **critério de pronto verificável** e **teste associado**.

O `planner` chama o `arquiteto` ao final, e o veredito entra no plano.

## 4. Implementar

Uma tarefa por vez. Código **e** teste. Marque o checkbox em `tasks.md` **só quando o
teste passar** — e depois de ter olhado a saída.

Se a tarefa exigir uma decisão que não está no plano: **pare e pergunte**. Não invente
regra de negócio.

## 5. Revisar

`/review NNN` roda os quatro revisores e consolida. Bloqueante é bloqueante: não se
abre exceção "só desta vez".

## 6. Fechar

`/release-check`, `doc-writer` atualiza documentação e changelog, PR pelo template.

## ADR — quando registrar

Decisão de arquitetura que aparece no caminho vira ADR (`/adr <título>`), **nunca**
comentário no código.

**Precisa de ADR:** dependência nova relevante, serviço novo, mudança de fronteira entre
módulos, mudança de schema que amarra o modelo, escolha entre abordagens com
consequência de longo prazo, qualquer coisa que contrarie um ADR existente.

**Não precisa:** detalhe de implementação, escolha de nome, refactor interno, algo
barato de reverter depois.

O ADR mais importante não é a decisão: são as **alternativas consideradas**, com um
argumento honesto a favor de cada uma e o porquê da rejeição. Se você não consegue
defender a alternativa que rejeitou, você ainda não entendeu o problema.

**ADR aplicado é imutável.** Mudou? ADR novo que substitui o anterior, e o antigo é
marcado como `substituído por ADR-NNNN`.
