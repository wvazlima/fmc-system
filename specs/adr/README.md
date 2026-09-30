# Registro de Decisões de Arquitetura (ADR)

Uma decisão por arquivo, numerada e imutável. Quando uma decisão muda, **não se edita o
ADR antigo**: cria-se um novo que a substitui e marca-se o anterior como `substituído
por ADR-NNNN`.

Use `/adr <título>` para criar um a partir de `specs/_templates/adr.md`.

| #                                                    | Decisão                                            | Estado |
| ---------------------------------------------------- | -------------------------------------------------- | ------ |
| [0001](0001-typescript-em-todo-o-stack.md)           | TypeScript em todo o stack                         | aceito |
| [0002](0002-monorepo-pnpm-turborepo.md)              | Monorepo com pnpm e Turborepo                      | aceito |
| [0003](0003-monolito-modular-na-api.md)              | Monólito modular na API                            | aceito |
| [0004](0004-offline-first-com-outbox.md)             | Offline-first com outbox no cliente                | aceito |
| [0005](0005-postgres-postgis-drizzle.md)             | PostgreSQL + PostGIS com Drizzle ORM               | aceito |
| [0006](0006-cloudflare-na-borda.md)                  | Cloudflare na borda, com Worker como proxy reverso | aceito |
| [0007](0007-mapa-base-proprio-sentinel-2.md)         | Mapa base próprio gerado do Sentinel-2             | aceito |
| [0008](0008-duas-datas-nos-lancamentos.md)           | Duas datas em todo lançamento financeiro           | aceito |
| [0009](0009-uuid-v7-gerado-no-cliente.md)            | UUID v7 gerado no cliente                          | aceito |
| [0010](0010-ambiente-local-completo-em-docker.md)    | Ambiente local completo em Docker Compose          | aceito |
| [0011](0011-nome-do-produto-em-um-unico-lugar.md)    | Nome do produto concentrado num único lugar        | aceito |
| [0012](0012-identity-platform-com-emulador-local.md) | Identity Platform com emulador Firebase no local   | aceito |
