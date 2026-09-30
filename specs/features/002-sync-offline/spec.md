# 002 · Sincronização offline

|                        |                             |
| ---------------------- | --------------------------- |
| **Estado**             | rascunho                    |
| **Fase**               | 1                           |
| **Depende de**         | `001-fundacao-multifazenda` |
| **Princípios em jogo** | constitution §1, §2, §3, §6 |

---

## Problema

O lançamento acontece no meio do cafezal e no curral, onde o sinal é ruim ou não
existe. Se o app exigir rede para salvar, o funcionário anota no papel — e o papel vira
planilha de novo, ou some.

Não é um problema de conforto: é o problema que decide se o sistema recebe dado de
entrada. Sem lançamento no momento do fato, custo por saca e margem por cabeça são
estimativa.

Esta feature entrega o **mecanismo** de sincronização, sem nenhuma entidade de negócio
em cima dele. As features seguintes apenas registram suas entidades no protocolo.

## Usuários e perfis afetados

| Perfil   | O que passa a fazer                                              | O que **não** pode ver                              |
| -------- | ---------------------------------------------------------------- | --------------------------------------------------- |
| Dono     | Lança sem sinal e vê o contador de pendências                    | —                                                   |
| Gerente  | Lança sem sinal, acompanha e corrige itens que falharam          | —                                                   |
| Operador | Lança sem sinal; o dispositivo dele nunca recebe dado financeiro | Qualquer tabela ou coluna financeira, mesmo offline |

## Histórias

- Como **operador**, quero registrar o que fiz no talhão sem sinal e ver a confirmação
  na hora, para não precisar anotar no papel.
- Como **operador**, quero ver quantos lançamentos ainda não subiram, para saber que
  preciso passar numa área com sinal antes de ir embora.
- Como **gerente**, quero que um lançamento rejeitado apareça com o motivo e um caminho
  de correção, em vez de sumir.
- Como **gerente**, quero poder forçar a sincronização, porque no iPhone ela só
  acontece com o app aberto.

## Critérios de aceite

### CA-01 · Escrita local é instantânea

- **Dado** um usuário autenticado, com ou sem conexão
- **Quando** ele confirma um lançamento
- **Então** o registro e o item de outbox são gravados na **mesma transação Dexie**
- **E** a tela confirma em menos de 200 ms, sem tocar na rede
- **E** o registro aparece com o estado `pendente`

### CA-02 · Reenvio não duplica

- **Dado** um lote da outbox já enviado e confirmado pelo servidor
- **Quando** o **mesmo lote** é enviado de novo (mesma `Idempotency-Key`)
- **Então** nenhum registro é duplicado
- **E** a resposta devolve os mesmos `acks`

### CA-03 · Dependência respeita a ordem

- **Dado** que o usuário criou, offline, um lote de gado e em seguida um animal dentro
  dele
- **Quando** a sincronização ocorre
- **Então** o lote é enviado antes do animal
- **E** se o lote falha, o animal permanece `pending` em vez de falhar por referência

### CA-04 · Falha é visível e corrigível

- **Dado** um item rejeitado pelo servidor por validação
- **Quando** o usuário abre a lista de pendências
- **Então** vê o item com o motivo em pt-BR e uma ação para corrigir
- **E** o item **não** é reenviado em laço nem descartado

### CA-05 · Conflito de cadastro preserva o valor sobrescrito

- **Dado** o mesmo cadastro editado em dois dispositivos, offline, com valores
  diferentes
- **Quando** ambos sincronizam
- **Então** vence o de `updated_at` mais recente
- **E** o valor sobrescrito fica registrado no histórico de alterações, com autor e data

### CA-06 · Evento não conflita

- **Dado** dois eventos criados offline para a mesma entidade, em dispositivos
  diferentes
- **Quando** ambos sincronizam
- **Então** os dois são preservados (append-only), sem sobrescrita
- **E** a correção de um evento é um evento de estorno, não um `UPDATE`

### CA-07 · Contador de pendências

- **Dado** que existem itens em `pending`, `inflight` ou `failed`
- **Quando** o usuário está em qualquer tela
- **Então** vê o número de pendências no chrome do app
- **E** o número chega a zero quando tudo foi confirmado

### CA-08 · Migração do schema local

- **Dado** um dispositivo na versão N do schema local, com dados e itens de outbox
  pendentes
- **Quando** o app é atualizado para a versão N+1
- **Então** os dados são migrados sem perda
- **E** os itens pendentes continuam válidos e sincronizam

### CA-09 · Token expirado não bloqueia a escrita

- **Dado** um token de autenticação expirado
- **Quando** o usuário faz um lançamento
- **Então** o registro é gravado localmente normalmente
- **E** apenas a sincronização fica em espera até a renovação do token

### CA-OFF · Cenário offline

- **Dado** que o dispositivo está sem conexão há um dia inteiro, com 40 lançamentos
  acumulados
- **Quando** a conexão volta
- **Então** os 40 sincronizam em lotes, com backoff em caso de falha de rede
- **E** nenhum é duplicado
- **E** o contador de pendências chega a zero

### CA-OP · Cenário de operador

- **Dado** um usuário com perfil `operator` alocado na fazenda A
- **Quando** o `pull` é executado no dispositivo dele
- **Então** o payload não contém nenhuma tabela financeira nem coluna de valor, custo,
  margem ou preço
- **E** não contém nada da fazenda B
- **E** a remoção acontece na **consulta** do servidor, não na serialização

## Regras de negócio

1. A tela lê e escreve **sempre** no Dexie (constitution §1).
2. Todo registro nasce com **UUID v7 gerado no cliente** (ADR-0009).
3. Toda mutação carrega `Idempotency-Key`; o servidor faz upsert por `(id, version)`.
4. Estados da outbox: `pending` → `inflight` → `confirmed` · `failed`.
5. Evento é append-only; cadastro é last-write-wins com histórico
   (`.claude/rules/sync.md`).
6. Exclusão é **soft delete**, propagada pelo sync.
7. O `pull` é **projetado pelo perfil** no servidor (constitution §6).
8. iOS não tem Background Sync: gatilhos são abrir o app, evento `online`, checagem
   periódica em primeiro plano e botão manual (ADR-0004).
9. `navigator.storage.persist()` é solicitado no primeiro uso.
10. Cliente com versão de protocolo incompatível recebe pedido de atualização, e não
    escrita parcial.

## Fora de escopo

- Entidades de negócio no protocolo — cada feature registra a sua.
- Upload de foto e áudio — o mecanismo é o mesmo, mas a mídia entra com a feature que a
  usa.
- Resolução manual de conflito pelo usuário. A Fase 1 é automática, com histórico.
- Background Sync no Android. Otimização posterior, opcional.
- Criptografia do banco local.

## Dúvidas abertas

| #   | Dúvida                                                                                                  | Para quem | Estado |
| --- | ------------------------------------------------------------------------------------------------------- | --------- | ------ |
| 1   | Quanto tempo, na prática, um funcionário fica sem sinal? Horas ou dias? Isso dimensiona a outbox.       | produtor  | aberta |
| 2   | Qual o volume esperado de lançamentos por dia, por fazenda, no pico (colheita, IATF)?                   | produtor  | aberta |
| 3   | Os aparelhos são do produtor ou pessoais? Isso muda a política de dado no dispositivo e o descarte.     | produtor  | aberta |
| 4   | Um mesmo aparelho é usado por mais de um funcionário? Se sim, trocar de usuário precisa limpar o local. | produtor  | aberta |
| 5   | Há fazenda com Wi-Fi na sede? Sincronizar ao chegar na sede pode ser o caminho principal.               | produtor  | aberta |
