# Changelog

Formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/);
versionamento [semântico](https://semver.org/lang/pt-BR/).

Uma linha por mudança **visível para quem usa** — refactor interno não entra.

## [Não publicado]

### Adicionado

- Estrutura inicial do repositório: specs (constitution, glossário, arquitetura,
  roadmap, 12 ADRs, templates e as 15 specs da Fase 1), configuração do Claude Code
  (rules, agentes, skills, comandos e hooks), esqueleto do monorepo e ambiente local
  completo em Docker.
- Decisões de infraestrutura registradas: Terragrunt sobre Terraform (ADR-0013) e um
  único ambiente de nuvem na Fase 1, com o local fazendo o papel de dev (ADR-0014).
