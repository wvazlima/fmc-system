# NNN · <Nome da feature>

|                        |                                                              |
| ---------------------- | ------------------------------------------------------------ |
| **Estado**             | rascunho · em revisão · aprovada · em implementação · pronta |
| **Fase**               | 1 · 2 · Financeiro e Fiscal · 3                              |
| **Depende de**         | `NNN-outra-feature`                                          |
| **Princípios em jogo** | constitution §N, §N                                          |

---

## Problema

<O que dói hoje, na linguagem do produtor. Como é feito na planilha. Por que isso
custa dinheiro ou tempo. Sem falar de solução.>

## Usuários e perfis afetados

| Perfil   | O que passa a fazer | O que **não** pode ver |
| -------- | ------------------- | ---------------------- |
| Dono     |                     |                        |
| Gerente  |                     |                        |
| Operador |                     |                        |

## Histórias

- Como **<perfil>**, quero **<ação>**, para **<resultado>**.

## Critérios de aceite

Formato Dado/Quando/Então. Todo critério precisa ser verificável por um teste.

### CA-01 · <título>

- **Dado** que ...
- **Quando** ...
- **Então** ...

### CA-02 · <título>

- **Dado** que ...
- **Quando** ...
- **Então** ...

### CA-OFF · Cenário offline (obrigatório)

- **Dado** que o dispositivo está sem conexão
- **Quando** o usuário <ação principal desta feature>
- **Então** o registro é gravado no banco local e aparece como `pendente`
- **E** a tela confirma a ação imediatamente, sem erro de rede
- **E** quando a conexão volta, o registro sincroniza sem duplicar

### CA-OP · Cenário de operador (obrigatório)

- **Dado** um usuário com perfil `operator` alocado na fazenda A
- **Quando** ele acessa <tela/endpoint desta feature>
- **Então** ele não recebe nenhum valor, custo, margem ou preço — nem na API, nem no
  payload de sync, nem no banco local do dispositivo
- **E** ao tentar acessar dado da fazenda B, recebe 403

## Regras de negócio

<Numeradas. Cada uma com a referência ao glossário quando usar termo do domínio.>

1.
2.

## Fora de escopo

- <O que esta feature explicitamente não resolve, e em qual feature ou fase resolve.>

## Dúvidas abertas

| #   | Dúvida | Para quem                      | Estado |
| --- | ------ | ------------------------------ | ------ |
| 1   |        | produtor · contador · agrônomo | aberta |
