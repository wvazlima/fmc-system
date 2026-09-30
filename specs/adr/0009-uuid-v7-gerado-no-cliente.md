# ADR-0009 · UUID v7 gerado no cliente e escrita idempotente

|               |            |
| ------------- | ---------- |
| **Data**      | 2026-09-29 |
| **Estado**    | aceito     |
| **Substitui** | —          |

## Contexto

Consequência direta do ADR-0004. Offline, o registro precisa existir, ser referenciável
por outros registros (um animal pertence a um lote criado há dois minutos, ainda não
sincronizado) e ser exibido — tudo antes de haver qualquer servidor envolvido.

Além disso, numa rede ruim o cliente frequentemente **não sabe** se o `POST` chegou. Ele
precisa poder repetir sem duplicar.

## Decisão

1. Toda entidade de negócio tem PK `uuid`, **gerada no cliente no padrão UUID v7**.
2. O servidor **nunca** gera ID de registro que veio do app. Não há `serial`,
   `bigserial` nem `gen_random_uuid()` como default em tabela de negócio.
3. Toda requisição de mutação carrega um cabeçalho **`Idempotency-Key`**.
4. A escrita no servidor é **upsert por `(id, version)`**: reenviar o mesmo lote não
   produz efeito adicional.
5. Registros criados pelo próprio servidor (log de auditoria, lote de importação)
   também usam UUID v7, gerado no servidor. A regra é sobre origem, não sobre o tipo.

**Por que v7 e não v4:** UUID v7 tem prefixo de timestamp em milissegundos, então é
ordenável por tempo. Isso mantém boa localidade de inserção nos índices B-tree do
Postgres, evitando a fragmentação que o v4 causa em tabela grande.

## Alternativas consideradas

### ID gerado no servidor, com ID temporário no cliente e remapeamento

- **A favor:** IDs sequenciais, menores, mais amigáveis em log.
- **Contra:** exige reescrever todas as referências locais depois do sync. Com
  dependências em cadeia (lote → animal → evento de manejo → lançamento financeiro),
  vira uma máquina de estado frágil.
- **Por que não:** complexidade e risco de corromper referência muito maiores do que o
  ganho.

### UUID v4

- **A favor:** universal, sem informação embutida.
- **Contra:** aleatório puro fragmenta índice B-tree; inserção espalhada pelo índice
  inteiro.
- **Por que não:** v7 resolve isso sem nenhuma desvantagem relevante aqui. O timestamp
  exposto não é dado sensível: já existe `created_at`.

### ULID

- **A favor:** mesmas propriedades de ordenação, representação mais curta.
- **Contra:** não é UUID nativo do Postgres; ficaria em `text` ou exigiria conversão.
- **Por que não:** o tipo `uuid` nativo é mais eficiente e o v7 já entrega a ordenação.

## Consequências

**Positivas**

- Referência entre entidades funciona offline, sem remapeamento.
- Reenvio seguro por construção; a rede pode falhar em qualquer ponto.
- Índices com boa localidade de inserção.

**Negativas e custos aceitos**

- 16 bytes por chave, contra 4 ou 8 de um `serial`. Irrelevante neste volume.
- Confiamos no cliente para gerar ID. Mitigado: o servidor valida o formato e rejeita
  ID já usado por **outra** organização.
- IDs são ruins de ler em log e de ditar por telefone. Mitigado com código curto legível
  por humano em entidades que o usuário precisa referenciar (lote, nota).

**O que passa a ser proibido**

- `serial`, `bigserial` ou `gen_random_uuid()` como default de PK de tabela de negócio.
- Endpoint de criação que ignora o ID enviado pelo cliente.
- Mutação sem tratamento de replay.

## Como verificar que a decisão está sendo respeitada

`.claude/rules/db.md` e `.claude/rules/sync.md`; agente `sync-auditor` procura ID
gerado no servidor e escrita não idempotente; teste de sync que envia o mesmo lote duas
vezes e confere que não duplicou.
