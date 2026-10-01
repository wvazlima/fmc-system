# ADR-0017 · Módulos contratados resolvidos na camada de acesso

|               |            |
| ------------- | ---------- |
| **Data**      | 2026-09-30 |
| **Estado**    | aceito     |
| **Substitui** | —          |

## Contexto

O sistema nasce com **um cliente** e arquitetura preparada para vários: toda tabela de
negócio carrega `organization_id` (constitution §3). O cliente do piloto terá **todos os
módulos, sem limite de porte** — é parte do acordo de fundador.

Três coisas diferentes costumam ser chamadas de "módulo", e confundi-las é o erro que
este ADR evita:

| Conceito                 | O que responde                   | Onde já está                       |
| ------------------------ | -------------------------------- | ---------------------------------- |
| **Módulo de código**     | como o código está organizado    | ADR-0003 — `apps/api/src/modules/` |
| **Módulo contratado**    | o que a organização **comprou**  | **não existe** — é o que falta     |
| **Perfil de acesso**     | o que o usuário **pode ver**     | `AccessScope`, três perfis fixos   |

O primeiro já está resolvido: `farms`, `cattle`, `coffee`, `crops`, `finance`, `sync`,
`maps`, `accounting`, `users`, cada um com rotas, serviço, repositório e testes
próprios, comunicando-se pela camada de serviço.

O terceiro também: perfil e lista de fazendas vêm do banco, resolvidos uma vez antes do
domínio (ADR-0012, `.claude/rules/security.md`).

**O segundo é o que viabiliza o segundo cliente.** Um cafeicultor sem gado não deve
pagar — nem ver — o módulo de pecuária. O levantamento de mercado de 2026-09-30 mostra
que os concorrentes cobram por **porte** (hectares, cabeças) e por **profundidade de
plano**, não por módulo de domínio; ainda assim, ligar e desligar módulo é o que reduz a
barreira de entrada e mantém a tela limpa.

A pergunta decisiva não é se o piloto precisa disso — ele não precisa, tem tudo. É
**quanto custa incluir depois**: sem a camada, o segundo cliente obriga a escolher entre
espalhar condicionais por todos os serviços ou subir uma instância por cliente.

## Decisão

Existe um **entitlement por organização**: o conjunto de módulos contratados e os
limites do plano.

1. O entitlement é resolvido **uma única vez, na mesma camada que resolve o
   `AccessScope`**, antes de qualquer código de domínio.
2. Ele vem **do banco**, nunca de claim do token — mudança de contrato vale na
   requisição seguinte, pelo mesmo motivo do ADR-0012.
3. **Nenhum serviço ou repositório consulta entitlement.** Se um `if (tem_modulo_x)`
   aparecer dentro de `service.ts`, a decisão foi violada.
4. Rota de módulo não contratado responde **403 com código próprio**
   (`module_not_contracted`), distinto do 403 de autorização. O cliente precisa saber
   que o recurso existe e pode ser contratado; o que ele não pode é alcançar o dado.
5. **Entitlement e autorização são ortogonais.** Contratar o módulo financeiro não faz
   o `operator` ver dinheiro — a constitution §6 continua valendo por cima.
6. **Módulo desligado não quebra cálculo que atravessa frentes.** O rateio de custos
   compartilhados (feature `010`) considera apenas as frentes contratadas e continua
   fechando em 100% entre elas. Dado de frente não contratada não entra no cálculo nem
   aparece no resultado.
7. A organização do piloto nasce com plano **`unlimited`**: todos os módulos, sem teto
   de porte.

**O modelo comercial fica fora deste ADR** — quais módulos se vendem juntos, o preço por
hectare ou por cabeça e a política de desconto são decisão de negócio, não de
arquitetura, e podem mudar sem tocar no código.

## Alternativas consideradas

### Não ter entitlement: tudo ligado para todos

- **A favor:** é o suficiente para o piloto, que tem tudo mesmo; nenhuma linha a mais
  agora; menos uma coisa no caminho da requisição.
- **Contra:** o segundo cliente não tem como entrar sem reescrita. A alternativa que
  sobra no desespero é condicional espalhada pelos serviços — a mesma bagunça que
  `.claude/rules/security.md` proíbe para autorização, e pelo mesmo motivo: regra
  espalhada é regra esquecida em algum lugar.
- **Por que não:** incluir agora custa uma tabela e uma checagem; incluir depois
  atravessa todas as rotas de todos os módulos.

### Uma instância por cliente

- **A favor:** isolamento total, sem risco de vazamento entre clientes, sem camada nova.
- **Contra:** o custo de um ambiente é dominado pelo Cloud SQL, que cobra parado
  (ADR-0014 e ADR-0016). Cada cliente passaria a custar um banco inteiro, e a operação
  se multiplicaria por cliente: deploy, migração, backup, monitoramento.
- **Por que não:** destrói a economia que faz o SaaS valer a pena. O `organization_id`
  da constitution §3 existe precisamente para evitar isto.

### Entitlement dentro do token (claim)

- **A favor:** zero consulta ao banco; o dado chega pronto na requisição.
- **Contra:** contratar um módulo só passaria a valer no próximo login do usuário. Um
  cliente que compra o módulo de gado numa terça não deveria esperar o token expirar.
- **Por que não:** é exatamente o que o ADR-0012 rejeitou para perfil e lista de
  fazendas. Repetir o erro para entitlement seria incoerente.

### Esconder o módulo apenas na interface

- **A favor:** trivial de implementar; o usuário não vê o que não comprou.
- **Contra:** não é proteção. Se o dado chegou ao objeto, o vazamento já aconteceu —
  o mesmo argumento que a regra de segurança usa para o perfil `operator`.
- **Por que não:** a tela é a última camada, nunca a primeira.

## Consequências

**Positivas**

- O segundo cliente entra **sem refactor**: contrata módulos, e o resto do sistema não
  muda.
- O piloto não percebe nada: nasce `unlimited`.
- Vender por módulo vira decisão comercial reversível, não obra de engenharia.
- O entitlement fica no mesmo lugar do `AccessScope` — um ponto para ler, um ponto para
  auditar.

**Negativas e custos aceitos**

- Mais uma coisa a resolver no início de cada requisição, e mais um dado a manter
  coerente.
- Todo módulo novo precisa declarar seu entitlement, e todo teste de rota precisa cobrir
  o caso "módulo não contratado".
- O rateio entre frentes passa a depender do conjunto contratado — é o ponto mais fácil
  de errar e o que mais merece teste.

**O que passa a ser proibido**

- Consultar entitlement dentro de `service.ts` ou `repository.ts`.
- Entitlement em claim de token.
- Esconder módulo apenas na renderização.
- Usar entitlement para substituir autorização, ou vice-versa.

## Como verificar que a decisão está sendo respeitada

- `.claude/rules/api.md` e `.claude/rules/security.md` passam a cobrir entitlement junto
  do `AccessScope`.
- O agente `security-reviewer` procura consulta a entitlement fora da camada de acesso,
  do mesmo jeito que já procura `if (role === ...)` espalhado.
- Teste por rota: módulo contratado responde; módulo não contratado responde 403 com
  `module_not_contracted`.
- Teste do rateio (feature `010`) com uma frente não contratada: a soma continua
  fechando em 100% entre as frentes restantes.
