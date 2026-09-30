---
paths:
  - 'apps/web/**'
  - 'packages/ui/**'
---

# Regras — PWA e UI

Vale para `apps/web/**` e `packages/ui/**`.

## Acesso a dados — a regra que mais se quebra

- **Componente nunca chama a API.** Sem `fetch`, sem `axios`, sem `useQuery` apontando
  para uma URL. A camada de dados é o **Dexie**.
- Leitura: hook de repositório local (`useCattleLots(farmId)`) que consulta o Dexie via
  `dexie-react-hooks` ou TanStack Query com o Dexie como fonte.
- Escrita: função de repositório que grava, **na mesma transação Dexie**, o registro de
  domínio e o item de outbox (ADR-0004).
- O sync engine é um serviço fora da árvore de componentes. Componente não dispara sync
  a não ser por um botão explícito de "sincronizar agora".
- **Nunca** desabilite um botão esperando resposta do servidor. A ação confirma local.

## Estado offline e pendente

- O estado de conectividade e o **contador de pendências** ficam visíveis o tempo todo
  no chrome do app.
- Todo registro que ainda não sincronizou mostra um indicador de `pendente`.
- Item que falhou na validação do servidor aparece para o usuário, com o motivo em
  pt-BR e uma ação de correção.
- Toda tela declara seus cinco estados: **carregando, vazio, pendente, erro, offline**.
  Tela sem estado vazio não passa em revisão.

## Mobile-first e uso no campo

- Escreva o layout para 360 px de largura primeiro. Desktop é `md:` e acima.
- **Alvo de toque mínimo 44×44 px.** Vale para ícone, chip e linha clicável.
- Contraste para leitura sob sol direto: mínimo WCAG **AA**, alvo **AAA** no texto
  principal e em número grande.
- O caminho comum de um formulário cabe numa tela, **sem rolagem**. Campo opcional fica
  atrás de "mais detalhes".
- Nenhuma ação crítica depende de `hover`, de arrastar ou de gesto sem alternativa.
- Teclado numérico em campo numérico (`inputMode`), teclado de data em data.
- Botão primário na **zona do polegar** (parte de baixo da tela), não no topo.

## Acessibilidade

- HTML semântico antes de `div` com `role`.
- Todo campo tem `<label>` associado. `placeholder` não é label.
- Foco visível, ordem de tabulação coerente, `aria-live` para mensagem de sync.
- Toda imagem informativa tem texto alternativo. Ícone decorativo é `aria-hidden`.

## Next.js e PWA

- App Router com **export estático** (`output: 'export'`). Nada de rota de API no
  Next, nada de Server Action, nada de SSR.
- Service Worker com **Serwist**. `sw.js` e `index.html` com `Cache-Control: no-cache`;
  asset com hash é `immutable`.
- `navigator.storage.persist()` pedido no primeiro uso.
- O **manifest é gerado** de `packages/config/src/brand.ts` (ADR-0011). Nunca escrito à
  mão.
- O nome do produto **não aparece como texto literal** em nenhum componente — vem de
  `brand`.

## Componentes

- `packages/ui` guarda o que é genérico e sem domínio. Componente que conhece
  `cattle_lot` mora em `apps/web`.
- Tailwind com os tokens do tema. Nada de cor solta em hex no componente.
- shadcn/ui como base; ajuste o componente copiado em vez de embrulhá-lo em três
  camadas.
- Componente de tela não faz cálculo de negócio. O número vem pronto do repositório
  local ou da API (constitution §4).

## Perfil operador

- A tela do operador **não pode ter caminho** para valor, custo, margem ou preço — o
  dado sequer chega ao dispositivo dele.
- Não esconda campo financeiro com CSS nem com `if` de renderização: se ele está no
  objeto, o vazamento já aconteceu (constitution §6).
