# Sync engine

Serviço **fora da árvore de componentes**. Drena a outbox em lotes, com backoff
exponencial, e aplica as mudanças vindas do `pull`.

Gatilhos (iOS não tem Background Sync — ADR-0004):

1. o app volta a ficar visível (`visibilitychange`);
2. evento `online`;
3. checagem periódica em primeiro plano;
4. botão manual de "sincronizar agora".

O contador de pendências fica sempre visível no chrome do app. Token expirado **não
bloqueia a escrita local** — só o sync (ADR-0012).

Ver `.claude/rules/sync.md` e a skill `offline-sync`.
