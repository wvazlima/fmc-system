---
description: Checklist antes de deploy — testes, typecheck, migrations, variáveis, custos, changelog
allowed-tools: Read, Grep, Glob, Bash
---

Checklist de release. Rode **cada** verificação e **mostre a saída real**. Não marque
nada como ok sem ter executado.

## 1. Qualidade do código

```
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Qualquer um vermelho é **bloqueante**.

## 2. Ambiente local

```
make up
make health
```

**Todos** os serviços saudáveis. Serviço sem healthcheck verde é bloqueante (ADR-0010).

## 3. Migrações

- Liste as migrações novas desde o último release (`git diff` em
  `packages/db/migrations/`).
- Alguma migração **já aplicada** foi editada? Bloqueante.
- Toda migração nova foi **aplicada e revertida** em local?
- Alguma é **destrutiva** (drop de coluna, mudança de tipo com perda)? Se sim, destaque
  e exija confirmação humana.
- Alguma é pesada e deveria ser job no `worker` em vez de rodar no deploy?

## 4. Variáveis e segredos

- Toda variável nova está em **todos** os `.env.example`?
- Toda variável nova está configurada no ambiente de destino (Secret Manager, secrets do
  Worker, Terraform)?
- Há **segredo real** em algum arquivo versionado? (`git diff` procurando chave, token,
  senha, `.env`.) Bloqueante.

## 5. Segurança e sync

- Acione **`security-reviewer`** e **`sync-auditor`** sobre o diff do release.
- Qualquer achado **crítico**, **alto** ou **bloqueante** trava o release.

## 6. Custos

- Recurso novo de nuvem com custo fixo mensal? Diga **quanto custa**.
- Labels de custo por cliente nos recursos novos?
- Alerta de orçamento continua configurado em `fmc-prod`?

## 6b. Ambiente de ensaio (ADR-0014)

A Fase 1 tem **um ambiente de nuvem**. Verifique se alguma condição de disparo do
segundo ambiente já apareceu:

- [ ] Já existe **dado real em produção** cuja perda seria cara?
- [ ] Este release contém **migração destrutiva**?
- [ ] A cadência de release passou a ter janela?
- [ ] Entrou um segundo cliente?

Se **qualquer** uma for sim, sinalize: é hora de criar `dev` ou `staging`. E confirme
que o Cloud SQL de prod está com **backup diário e PITR** ativos — é a única rede de
segurança que existe hoje.

## 7. Documentação

- `CHANGELOG.md` atualizado com as mudanças visíveis ao usuário?
- `specs/arquitetura.md` reflete a arquitetura de agora?
- `specs/roadmap.md` com as features concluídas marcadas?
- `README.md` com comandos e serviços corretos? (Rode os comandos que você documentou.)
- Se faltou algo, acione **`doc-writer`**.

## 8. Features

- Toda feature deste release passou por `/review NNN` sem bloqueante?
- Dúvida aberta de spec que ainda bloqueia?

## Relatório

| #   | Verificação | Resultado | Observação |
| --- | ----------- | --------- | ---------- |

Termine com **LIBERADO** ou **BLOQUEADO**, e a lista do que falta.

Deploy para **produção** exige **confirmação humana explícita**. Este comando **não**
faz deploy.
