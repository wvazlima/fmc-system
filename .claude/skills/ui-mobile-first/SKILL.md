---
name: ui-mobile-first
description: Padrões de tela para uso no campo — formulário curto, estados offline e pendente, alvo de toque, contraste sob sol, perfil operador. Use ao criar ou revisar qualquer tela do PWA, ao decidir layout de formulário, ao tratar estado de sincronização na interface, ou ao desenhar a experiência do operador.
---

# Interface para quem está no campo

O usuário está de bota, no sol, talvez de luva, com uma mão segurando o celular e a
outra ocupada. Pode estar sem sinal. Ele tem trinta segundos entre uma tarefa e outra.

Se o lançamento não for fácil aqui, ele não acontece — e sem dado de entrada o sistema
inteiro não entrega nada.

## Regras duras

| Regra                                   | Número                                                              |
| --------------------------------------- | ------------------------------------------------------------------- |
| Alvo de toque mínimo                    | **44 × 44 px**                                                      |
| Contraste de texto                      | mínimo **WCAG AA**; alvo **AAA** em texto principal e número grande |
| Largura de projeto                      | **360 px** primeiro; desktop é `md:` e acima                        |
| Caminho comum do formulário             | **cabe numa tela, sem rolagem**                                     |
| Toques para o lançamento mais frequente | **3 ou menos**, da tela inicial                                     |

## Formulário

- **Campo obrigatório na primeira tela; opcional atrás de "mais detalhes".** Um
  formulário de 12 campos onde 4 bastam é um formulário que não será preenchido.
- **Valor padrão inteligente:** data = hoje, fazenda = a última usada, talhão = o mais
  próximo se houver GPS.
- Teclado certo: `inputMode="decimal"` em número, `inputMode="numeric"` em contagem,
  `type="date"` em data.
- **Seleção em vez de digitação** sempre que a lista for curta. Chip grande, não
  `<select>` nativo apertado.
- `<label>` associado em todo campo. **`placeholder` não é label** — ele some quando o
  usuário começa a digitar.
- Validação **ao sair do campo**, não ao enviar. Mensagem em pt-BR, dizendo o que fazer.
- **Botão primário na zona do polegar**, na parte de baixo, fixo. Não no topo.
- Ação destrutiva exige confirmação, e o botão de confirmar **não** fica no mesmo lugar
  do botão que se aperta sem pensar.

## Os cinco estados de toda tela

Nenhuma tela passa em revisão sem os cinco:

| Estado         | O que mostrar                                                     |
| -------------- | ----------------------------------------------------------------- |
| **Carregando** | esqueleto do conteúdo, não spinner centralizado                   |
| **Vazio**      | o que é esta tela, por que está vazia e **a ação para preencher** |
| **Pendente**   | o registro está lá, com indicador de que ainda não sincronizou    |
| **Erro**       | o que aconteceu em pt-BR e o que fazer; nunca código de erro cru  |
| **Offline**    | a tela funciona normalmente; o chrome indica que está offline     |

Um erro de sincronização **não é um erro da tela**. O dado foi salvo. Comunique isso:
"salvo no aparelho, será enviado quando houver sinal".

## Sincronização na interface

- **Contador de pendências sempre visível** no chrome do app. É como o usuário sabe que
  precisa passar numa área com sinal.
- Indicador de `pendente` em cada registro não sincronizado. Discreto, mas presente.
- Item que **falhou** aparece com o motivo e uma ação de correção. Nunca sumir em
  silêncio.
- Botão manual de "sincronizar agora" — no iOS, é o caminho de escape.
- **Nunca desabilite um botão esperando resposta do servidor.** A ação confirma local.

## Sol, luva e uma mão

- Contraste alto de verdade. Cinza claro sobre branco desaparece ao sol.
- Tamanho mínimo de fonte 16 px no corpo; número importante bem maior.
- Nada crítico dependendo de `hover`, de arrastar ou de gesto sem alternativa por
  botão.
- Espaçamento generoso entre alvos de toque — dedo com luva erra.
- Feedback tátil ou visual imediato em todo toque.

## Perfil operador

A tela do operador é uma **tela diferente**, não a mesma com campos escondidos.

- Ela **não tem caminho** para valor, custo, margem ou preço — o dado sequer chega ao
  dispositivo dele (constitution §6).
- Nunca esconda com CSS ou com `if` de renderização: se o campo está no objeto, o
  vazamento já aconteceu.
- O que ele faz: manejo, aplicação, colheita, pesagem, foto, áudio. Rápido e sem
  fricção.
- Lançamento dele pode entrar como **"a revisar"** — deixe isso visível, sem parecer
  punição.

## Acessibilidade

HTML semântico antes de `div` com `role`. Foco visível. Ordem de tabulação coerente.
`aria-live` para mensagem de sincronização. Texto alternativo em imagem informativa;
`aria-hidden` em ícone decorativo.
