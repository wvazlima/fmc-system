## Spec

<!-- Link para specs/features/NNN-slug/spec.md. Se não há spec, explique por quê. -->

- Feature: `specs/features/NNN-.../spec.md`
- Tarefas de `tasks.md` concluídas nesta PR: T-NN, T-NN

## O que muda

<!-- Duas ou três linhas. O que passa a funcionar, na linguagem de quem usa. -->

## Critérios de aceite atendidos

| Critério         | Atendido | Teste                 |
| ---------------- | -------- | --------------------- |
| CA-01            | ✅       | `caminho/do/teste.ts` |
| CA-OFF (offline) | ✅       |                       |
| CA-OP (operador) | ✅       |                       |

<!-- CA-OFF e CA-OP são obrigatórios. Se algum não se aplica, explique. -->

## Impacto no sync

- [ ] Nenhum
- [ ] Entidade nova no protocolo: `...`
- [ ] Mudança na projeção por perfil
- [ ] **Versão do schema local do Dexie:** N → N+1 (passo de upgrade testado com dados
      e outbox pendente)

Os cinco testes obrigatórios de `.claude/rules/sync.md` foram feitos?

- [ ] push offline → reconexão → sem duplicar
- [ ] mesmo lote enviado duas vezes → sem duplicar
- [ ] pull de `operator` → sem nenhum campo financeiro
- [ ] upgrade do schema local com dados e outbox pendente
- [ ] conflito de cadastro → valor sobrescrito no histórico

## Impacto em permissões

- [ ] Nenhum
- [ ] Rota nova: perfis autorizados `...` — checagem de perfil **e** de fazenda feita
- [ ] Mudança no que o `operator` recebe. **A remoção acontece na consulta, não na
      serialização?**

## Banco

- [ ] Nenhuma migração
- [ ] Migração nova, **aplicada e revertida em local**
- [ ] Migração **destrutiva** (requer confirmação humana — descreva o impacto)

## Prints mobile

<!-- Obrigatório quando a PR toca a interface. Largura de 360 px. -->
<!-- Inclua os estados: vazio, pendente, offline e erro. -->

## Revisão

- [ ] `/review NNN` rodado, sem item bloqueante
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` verdes
- [ ] `make up` e `make health` com todos os serviços saudáveis
- [ ] Documentação atualizada (`doc-writer`), se necessário
