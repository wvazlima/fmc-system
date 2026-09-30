# Banco local (Dexie)

A **fonte de verdade da tela** (ADR-0004). Todo componente lê e escreve aqui — nunca na
API.

Cada mutação grava, **na mesma transação Dexie**, o registro de domínio e o item de
outbox. Se uma falha, as duas falham.

Aqui vão morar: a definição do schema Dexie (com versionamento e passos de upgrade) e
os repositórios locais por entidade.

**Migração do schema local:** versão nova sempre; nunca edite uma versão publicada. O
upgrade precisa funcionar num banco **com dados e com outbox pendente**.

Ver `.claude/rules/sync.md` e a skill `offline-sync`.
