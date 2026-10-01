# 001 · Fundação multi-fazenda

|                        |                             |
| ---------------------- | --------------------------- |
| **Estado**             | rascunho                    |
| **Fase**               | 1                           |
| **Depende de**         | —                           |
| **Princípios em jogo** | constitution §2, §3, §6, §8 |

---

## Problema

O produtor tem cinco fazendas em cidades diferentes do Sul de Minas, cada uma com sua
inscrição estadual e sua operação. Hoje isso é uma planilha por fazenda, quando não uma
por fazenda e por ano. Não existe cadastro comum de pessoas, de fazendas nem de quem
pode ver o quê: o controle de acesso é o arquivo estar ou não no computador de alguém.

Duas coisas custam caro nisso. A primeira: para comparar custo por hectare entre
fazendas, alguém abre cinco arquivos e consolida à mão, e o número sai diferente
dependendo de quem consolidou. A segunda: o funcionário de campo não tem como lançar
nada, porque dar acesso à planilha significa dar acesso aos valores.

Esta feature é a base de todas as outras: sem organização, fazenda, usuário e perfil,
nenhum outro dado tem onde se pendurar.

## Usuários e perfis afetados

| Perfil   | O que passa a fazer                                                         | O que **não** pode ver                                      |
| -------- | --------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Dono     | Cadastra fazendas e usuários; vê todas as fazendas e o consolidado do grupo | —                                                           |
| Gerente  | Cadastra fazendas e usuários; aloca operadores; vê todas as fazendas        | —                                                           |
| Operador | Entra no app e vê apenas as fazendas onde está alocado                      | Qualquer valor; a lista de usuários; fazendas onde não atua |

## Histórias

- Como **dono**, quero cadastrar minhas cinco fazendas com a inscrição estadual de cada
  uma, para que os lançamentos e a contabilidade fiquem separados por imóvel.
- Como **gerente**, quero alocar um funcionário a uma fazenda, para que ele lance o que
  faz no campo sem enxergar as outras fazendas.
- Como **gerente**, quero remover a alocação de um funcionário e que isso tenha efeito
  imediato, sem esperar sincronização.
- Como **operador**, quero entrar no app e ver só a fazenda onde trabalho, para não me
  perder em informação que não é minha.

## Critérios de aceite

### CA-01 · Cadastro de fazenda com inscrição estadual

- **Dado** um gerente autenticado
- **Quando** ele cadastra uma fazenda com nome, município, UF e inscrição estadual
- **Então** a fazenda é criada com `organization_id` da organização dele e um `id`
  UUID v7 gerado no cliente
- **E** a inscrição estadual é única dentro da organização
- **E** tentar cadastrar outra fazenda com a mesma inscrição estadual devolve erro
  explicando qual fazenda já a usa

### CA-02 · Alocação de operador

- **Dado** um usuário com perfil `operator` e uma fazenda A
- **Quando** o gerente aloca esse usuário à fazenda A
- **Então** o `AccessScope` dele passa a conter a fazenda A
- **E** ele não recebe nenhuma outra fazenda da organização

### CA-03 · Revogação tem efeito imediato

- **Dado** um operador alocado à fazenda A
- **Quando** o gerente remove a alocação
- **Então** a **próxima requisição** dele à API já não alcança a fazenda A
- **E** o `pull` de sync seguinte remove os dados da fazenda A do dispositivo dele

> O perfil e a lista de fazendas vêm do banco, nunca de claim do token (ADR-0012) —
> este critério é o que prova essa decisão.

### CA-04 · Fazenda de fora do escopo é negada

- **Dado** um operador alocado apenas à fazenda A
- **Quando** ele faz qualquer requisição informando o `farmId` da fazenda B
- **Então** recebe `403`, independentemente de o recurso existir ou não

### CA-05 · Consolidado do grupo

- **Dado** um dono ou gerente
- **Quando** ele abre o painel do grupo
- **Então** vê a lista das cinco fazendas e pode alternar entre a visão consolidada e a
  de cada fazenda

### CA-OFF · Cenário offline

- **Dado** que o dispositivo está sem conexão
- **Quando** o gerente cadastra uma fazenda nova
- **Então** ela é gravada no banco local com UUID v7 e aparece como `pendente`
- **E** já pode ser usada como destino de outros cadastros locais, antes de sincronizar
- **E** quando a conexão volta, sincroniza sem duplicar

### CA-OP · Cenário de operador

- **Dado** um usuário com perfil `operator` alocado na fazenda A
- **Quando** ele acessa a tela de fazendas ou o endpoint correspondente
- **Então** recebe apenas a fazenda A, sem nenhum campo de valor, custo ou margem
- **E** não recebe a lista de usuários da organização
- **E** ao tentar acessar dado da fazenda B, recebe 403

## Regras de negócio

1. Uma **organização** (`organization`) é a raiz de todo dado. Hoje há uma só; a
   arquitetura já prevê várias (constitution §3).
2. Toda **fazenda** (`farm`) tem exatamente uma **inscrição estadual**
   (`state_registration`), única dentro da organização. É ela que separa a escrita
   contábil (skill `integracao-contabil`).
3. Perfis: `owner`, `manager`, `operator` (`specs/glossario.md`). Dono e gerente
   alcançam **todas** as fazendas da organização, sem alocação explícita.
4. **Alocação** (`assignment`) só existe para `operator`.
5. Usuário pertence a **uma** organização. Multi-organização fica para o SaaS.
6. Fazenda não é excluída: é **desativada** (soft delete). Histórico e contabilidade
   dependem dela.
7. O `AccessScope` é resolvido **uma vez**, antes do domínio, e vem do banco
   (`.claude/rules/api.md`).
8. Toda fazenda tem **forma de posse** (`tenure`): `owned` ou `leased`. **Hoje as cinco
   são próprias** — o produtor confirmou em 2026-09-30 que não há arrendamento, mas que
   pode vir a haver. O campo entra **agora**, com `owned` como padrão.

> O campo custa uma coluna hoje e custa uma migração com reprocessamento contábil
> depois. Arrendamento muda o tratamento no livro caixa e no LCDPR (feature `029`): o
> arrendatário lança o arrendamento como despesa e o imóvel aparece com participação
> diferente. Descobrir isso com dois anos de lançamentos dentro é caro.

## Fora de escopo

- Autoatendimento de cadastro (onboarding de nova organização) — fica para o SaaS.
- Convite por e-mail e recuperação de senha pela interface — a Fase 1 usa o fluxo
  padrão do Identity Platform.
- Permissão granular por módulo. São três perfis fixos.
- **Tratamento contábil do arrendamento** — o campo existe, a regra não. Entra quando
  houver a primeira fazenda arrendada, com a resposta do contador (dúvida 2).
- Módulos comerciais (o que a organização contratou) — ver dúvida 6.
- Geometria da fazenda e dos talhões — feature `012`.
- Consolidado com números — depende de `009` e `010`; aqui é só a navegação.

## Dúvidas abertas

| #   | Dúvida                                                                                             | Para quem | Estado |
| --- | -------------------------------------------------------------------------------------------------- | --------- | ------ |
| 1   | As cinco fazendas são todas do mesmo CPF, ou há imóveis em nome de mais de um proprietário?        | produtor  | aberta |
| 2   | **Respondida em 2026-09-30 (produtor): não há arrendamento hoje, mas pode vir a haver.** O campo `tenure` entra agora. Falta a parte do contador: quando houver, como o arrendamento é lançado no livro caixa e como o imóvel aparece no LCDPR? | contador  | aberta |
| 3   | Quantos operadores por fazenda, e há quem trabalhe em mais de uma no mesmo período?                | produtor  | aberta |
| 4   | Gerente pode cadastrar fazenda, ou só o dono?                                                      | produtor  | aberta |
| 5   | Além de nome, município, UF e IE, o cadastro precisa de área total, matrícula ou código do imóvel? | contador  | aberta |
| 6   | **Respondida pelo ADR-0017:** existe entitlement por organização, resolvido na mesma camada do `AccessScope`. A organização do piloto nasce com plano `unlimited`. O modelo comercial (preço por porte, quais módulos se vendem juntos) segue aberto, mas não bloqueia o código. | —         | fechada |
