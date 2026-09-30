# ADR-0001 · TypeScript em todo o stack

|               |            |
| ------------- | ---------- |
| **Data**      | 2026-09-29 |
| **Estado**    | aceito     |
| **Substitui** | —          |

## Contexto

O sistema tem front (PWA), API, workers e um Worker de borda. O time de desenvolvimento
é pequeno. Boa parte do valor está em regras de domínio compartilhadas — validação de
lançamento, cálculo de custo, protocolo de sync — que precisam rodar **nos dois lados**:
no cliente, porque ele é offline-first e valida antes de enfileirar, e no servidor,
porque ele é a autoridade.

Existe ainda um bloco de trabalho futuro (Fases 2 e 3) que é genuinamente de outro
ecossistema: processamento de imagem de satélite e visão computacional.

## Decisão

Usamos **TypeScript em todo o stack**: `web`, `api`, `worker` e `edge`.

**Python** é permitido exclusivamente para jobs de satélite (NDVI sobre Sentinel-2) e
visão computacional, das Fases 2 e 3, isolados como jobs que se comunicam pelo banco e
pelo storage — nunca como biblioteca importada pelo resto do sistema.

**Go** fica reservado. Só entra mediante novo ADR, com número medido que justifique.

## Alternativas consideradas

### Node para a API e Python para workers desde o início

- **A favor:** Python é mais confortável para manipulação de dados e planilhas.
- **Contra:** a importação de planilhas precisa aplicar **exatamente** as mesmas regras
  de validação do lançamento normal. Em Python, essas regras viram uma segunda
  implementação que diverge da primeira em silêncio.
- **Por que não:** duplicar regra de domínio é o custo mais caro que existe neste projeto.

### Go na API

- **A favor:** desempenho e binário único.
- **Contra:** nenhuma reutilização com o front; o gargalo real é rede ruim no campo e
  I/O de banco, não CPU de API.
- **Por que não:** paga-se um custo grande de duplicação por um ganho que não existe no
  perfil de carga deste produto.

## Consequências

**Positivas**

- Schemas Zod, tipos e protocolo de sync definidos uma vez em `packages/shared` e
  consumidos por front, API e worker.
- Um único toolchain: pnpm, Turborepo, ESLint, Vitest, `tsc`.
- Quem revisa o front consegue revisar a API.

**Negativas e custos aceitos**

- Processamento de imagem em TypeScript é ruim; por isso a exceção de Python.
- Node consome mais memória por instância que Go. Aceito: Cloud Run escala por
  requisição e o volume é baixo.

**O que passa a ser proibido**

- Regra de domínio implementada duas vezes, em linguagens diferentes.
- Python ou Go em qualquer serviço do caminho de requisição do usuário.

## Como verificar que a decisão está sendo respeitada

`.claude/rules/api.md` e `.claude/rules/tests.md`; CI roda `typecheck` em todos os
pacotes; qualquer pasta nova fora de `apps/` e `packages/` exige revisão do agente
`arquiteto`.
