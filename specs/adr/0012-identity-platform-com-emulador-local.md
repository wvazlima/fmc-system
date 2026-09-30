# ADR-0012 · Identity Platform em produção, emulador Firebase no local

|               |            |
| ------------- | ---------- |
| **Data**      | 2026-09-29 |
| **Estado**    | aceito     |
| **Substitui** | —          |

## Contexto

O sistema precisa de autenticação por **e-mail/senha e Google**, sem SMS (custo e
cobertura ruim na zona rural). Os usuários são poucos e conhecidos: dono, gerentes e
operadores das 5 fazendas.

O app é **offline-first**: o token precisa continuar válido por tempo suficiente para o
usuário passar o dia no campo sem sinal, e a renovação tem de acontecer de forma
transparente quando o sinal volta.

Com o ADR-0010, o ambiente local precisa de um equivalente que rode em container e não
exija projeto na nuvem.

## Decisão

**Produção, staging e dev:** Google **Identity Platform** (Firebase Auth), com provedores
e-mail/senha e Google. **SMS desabilitado.**

**Local:** **Firebase Auth Emulator**, em container no Compose, na porta `9099`.

A troca é só por variável de ambiente: `FIREBASE_AUTH_EMULATOR_HOST=auth:9099`. **O
mesmo SDK e o mesmo fluxo de token** valem nos dois ambientes — não há caminho de
autenticação alternativo no código.

Autorização (perfil e fazendas acessíveis) **não** vem do provedor de identidade: vem
das tabelas `users` e `assignments` no Postgres. O token prova **quem é**; o banco diz
**o que pode**.

Custom claims do Firebase guardam apenas `organization_id`, para um descarte rápido de
requisição de outra organização. Nunca guardam perfil nem lista de fazendas — mudança de
permissão precisa ter efeito imediato, e claim em token já emitido não tem.

## Alternativas consideradas

### Autenticação própria (usuário, senha e JWT nossos)

- **A favor:** zero dependência, funciona igual em qualquer ambiente.
- **Contra:** reset de senha, verificação de e-mail, bloqueio por tentativa, rotação de
  chave, login com Google — tudo por nossa conta, e cada um é uma superfície de falha
  de segurança.
- **Por que não:** é o tipo de coisa que não se reimplementa num time pequeno.

### Auth0, Clerk ou Supabase Auth

- **A favor:** DX excelente.
- **Contra:** mais um fornecedor, custo por usuário ativo e dado de identidade fora do
  Google, onde já está todo o núcleo (constitution §9).
- **Por que não:** o Identity Platform já está no ecossistema escolhido e é barato neste
  volume.

### Adaptador local com JWT próprio no ambiente de desenvolvimento

- **A favor:** container mais leve, sem JRE.
- **Contra:** cria um caminho de autenticação que **nunca roda em produção** — exatamente
  o tipo de divergência que o ADR-0010 tenta evitar. Bug de verificação de token só
  apareceria em dev.
- **Por que não:** o custo de um container Java no local é menor que o de duas
  implementações de autenticação.

## Consequências

**Positivas**

- Um único fluxo de autenticação em todos os ambientes.
- Reset de senha, verificação de e-mail e login com Google prontos.
- Permissão no banco: revogar acesso de um operador tem efeito na requisição seguinte.

**Negativas e custos aceitos**

- O emulador exige Java; a imagem local é maior e o primeiro build é mais lento.
- Dependência do Google para login. Aceito: o núcleo já é Google (constitution §9).
- O token expira; offline por mais tempo que a validade exige um caminho de graça — o
  app continua **gravando localmente** mesmo com token expirado e só o **sync** fica
  bloqueado até renovar.

**O que passa a ser proibido**

- SMS como fator ou como provedor.
- Perfil ou lista de fazendas em custom claim.
- Caminho de autenticação que só exista em desenvolvimento.
- Bloquear a escrita local porque o token expirou.

## Como verificar que a decisão está sendo respeitada

`.claude/rules/api.md` e `.claude/rules/security.md`; agente `security-reviewer`;
teste de integração que valida token do emulador pelo mesmo caminho de produção.
