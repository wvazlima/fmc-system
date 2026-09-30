# Jobs

Um arquivo por job. Em produção, cada um é um **Cloud Run Job** disparado pelo **Cloud
Scheduler**; no local, roda no processo do container `worker`.

Previstos:

| Job                   | Fase | Feature                         |
| --------------------- | ---- | ------------------------------- |
| `import-spreadsheets` | 1    | 013 — importação do histórico   |
| `import-invoice-xml`  | 1    | 014 — XML de notas fiscais      |
| `export-accounting`   | 1    | 015 — exportação contábil       |
| `build-map-package`   | 1    | 012 — geração de PMTiles        |
| `fetch-weather`       | 2    | clima por fazenda               |
| `compute-ndvi`        | 2    | vigor por satélite (job Python) |
| `generate-reports`    | 2    | relatórios com o assistente     |
| `import-payroll`      | 2    | Folhamatic                      |

**Todo job é idempotente**: rodar duas vezes não duplica efeito. Job pesado nunca roda
no caminho de deploy nem no caminho de requisição do usuário.
