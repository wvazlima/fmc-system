# Regras — Segurança

Sem `paths`: vale para **todo** o repositório.

## Autorização — a regra mais importante deste projeto

- **Toda rota** checa perfil e fazenda. Rota sem checagem é bloqueante em revisão.
- **Nunca confie em `farmId` vindo do cliente.** Valide contra as fazendas do escopo do
  usuário e devolva `403`.
- **Toda consulta filtra por `organization_id`.** Um esquecimento aqui é vazamento entre
  clientes.
- Autorização é resolvida **uma vez**, numa camada, antes do domínio. Não espalhe `if
(role === ...)` pelos serviços.
- Perfil e lista de fazendas vêm do **banco**, nunca de claim do token — mudança de
  permissão precisa valer na requisição seguinte (ADR-0012).

## Operador e dado financeiro (constitution §6)

`operator` **nunca** recebe valor, custo, margem, preço ou qualquer derivado:

- **nem na API** — o campo não entra na projeção da consulta;
- **nem no sync** — a tabela financeira não vai para o dispositivo dele;
- **nem na tela** — mas isso é a última camada, não a primeira.

Esconder com CSS ou com `if` de renderização **não é proteção**: se o dado chegou ao
objeto, o vazamento já aconteceu. O agente `sync-auditor` procura exatamente isso.

## Dados pessoais e LGPD

- **Nunca logue:** CPF, CNPJ, nome completo, e-mail, telefone, endereço, coordenada de
  residência, valor financeiro, token, senha.
- Logue `id` e código de erro. Se precisa do contexto, logue o `organization_id` e o
  `farm_id`.
- Nada de dado pessoal em ferramenta de terceiro (analytics, monitoramento de erro de
  front) sem análise explícita.
- Dado pessoal em resposta de erro, nunca.

## Segredos

- Segredo vive no Secret Manager ou nos secrets do Worker. Nunca no repositório.
- `.env` real é gitignored; `.env.example` tem só chaves e valores óbvios de exemplo.
- Um hook bloqueia gravação de chave, token ou `.env` em arquivo versionado.
- Segredo que vazou é segredo **rotacionado**, não removido do histórico e esquecido.

## Injeção e entrada

- **Zod em toda entrada**, na borda. Nada entra sem schema.
- Drizzle com parâmetros. SQL cru só com `sql` template com placeholder — **nunca**
  concatenação de string com valor do usuário.
- Upload: valide tipo real (magic bytes), tamanho e extensão. Foto e áudio vão para
  storage, nunca para o sistema de arquivos da aplicação.
- Nome de arquivo vindo do usuário é normalizado; nunca usado direto em caminho.
- Saída para planilha: proteja contra injeção de fórmula (célula iniciada por `=`, `+`,
  `-`, `@`).

## Autenticação

- Token verificado pelo **mesmo caminho** em todos os ambientes (ADR-0012). Não existe
  atalho de autenticação em desenvolvimento.
- Rota autenticada por padrão; rota pública é **exceção declarada** e revisada.
- Sem SMS como fator.
- A API só aceita requisição com `X-Edge-Secret` válido (ADR-0006).

## Permissões: `deny` é quebra-molas, não fronteira

A lista `deny` em `.claude/settings.json` reduz acidente. Ela **não** é controle de
segurança, e tratá-la como tal é pior do que não tê-la, porque dá falsa confiança.

O motivo é estrutural: lista de negação nunca é completa. Sempre existe um comando
permitido que produz o mesmo efeito por outro caminho. Três exemplos que já estiveram
liberados neste repositório e contornavam todos os `rm -rf` do `deny`:

| Comando permitido                | Como escapava                                                     |
| -------------------------------- | ----------------------------------------------------------------- |
| `find:*`                         | `find specs -delete`, `find . -exec rm -rf {} +`                  |
| `docker compose exec:*`          | `docker compose exec api rm -rf /app/specs` — o repo é bind mount |
| `pnpm exec:*`, `pnpm --filter:*` | executam binário arbitrário                                       |

Os quatro foram removidos do `allow` e agora perguntam.

**Regra ao editar as permissões:**

- No `allow` só entra comando cujo **efeito seja conhecido pelo prefixo**. Se o sufixo
  pode virar execução arbitrária, não entra.
- Comando que executa outro comando (`exec`, `-exec`, `run`, `sh -c`) **nunca** vai
  para o `allow` com `:*`.
- `deny` serve para o que não deve acontecer nem por engano (`--force`, `terraform
apply`, deploy para prod). Não confie nele para conter intenção.
- Ao acrescentar entrada no `allow`, pergunte: _"qual o pior comando que casa com este
  padrão?"_ — e é esse que você está autorizando.

## Revisão

Antes de todo PR, o agente `security-reviewer` (só leitura) verifica: autorização por
perfil e fazenda em rota nova, segredo no diff, injeção, dado pessoal em log, e
vazamento financeiro para operador.
