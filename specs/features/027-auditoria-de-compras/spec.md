# 027 · Auditoria de compras: privilégio e compra simulada

|                        |                                                                   |
| ---------------------- | ----------------------------------------------------------------- |
| **Estado**             | rascunho                                                          |
| **Fase**               | 2                                                                 |
| **Depende de**         | `016-cadastro-contrapartes`, `017-estoque-de-insumos`, `018`, `026` |
| **Princípios em jogo** | constitution §4, §6, §7                                           |

---

## Problema

O produtor pediu "comparação de privilégios e/ou compra simulada de insumos, como se
fosse um auditor do sistema". Traduzido para o que acontece na prática, são duas
perguntas que ninguém consegue responder hoje:

1. **Estou pagando mais caro para um fornecedor específico?** Não por acaso de uma
   compra, mas sistematicamente — sempre o mesmo, sempre um pouco acima, sempre com
   cotação única.
2. **Existe compra que nunca virou mercadoria?** Nota lançada, dinheiro pago, e nada
   entrou no barracão nem foi aplicado em talhão nenhum.

Nenhuma das duas se enxerga olhando lançamento por lançamento. Elas só aparecem no
padrão: na comparação entre fornecedores, na concentração, na frequência de compra sem
concorrência, na compra que não tem contrapartida física.

Vale aqui a mesma regra da feature `026`, e com mais força: **o sistema aponta padrão,
não aponta pessoa.** Preço acima da mediana pode ser urgência, prazo, qualidade ou
frete. Concentração pode ser o único revendedor da região. O achado é o começo de uma
conversa, nunca a conclusão dela.

## Usuários e perfis afetados

| Perfil   | O que passa a fazer                                                 | O que **não** pode ver                 |
| -------- | ------------------------------------------------------------------- | -------------------------------------- |
| Dono     | Recebe os achados, investiga e registra a conclusão                 | —                                      |
| Gerente  | Responde ao achado com a justificativa da compra                    | Achados em que ele é parte interessada |
| Operador | Nada — não tem superfície nesta feature                             | Tudo: 403                              |

## Histórias

- Como **dono**, quero saber se estou pagando acima do que os outros fornecedores
  cobram pelo mesmo item.
- Como **dono**, quero ver a concentração de compra por fornecedor, por fazenda e no
  grupo.
- Como **dono**, quero saber quais compras não têm contrapartida física nenhuma.
- Como **gerente**, quero justificar uma compra cara e encerrar o achado.

## Critérios de aceite

### CA-01 · Preço pago contra a referência interna

- **Dado** 12.000 kg de adubo comprados a **R$ 4,35/kg** e uma mediana de
  **R$ 3,78/kg** nas demais cotações do mesmo item no trimestre (feature `018`)
- **Quando** a auditoria roda
- **Então** o achado mostra **15,1% acima da mediana**, com impacto de **R$ 6.840,00**
- **E** mostra quantas cotações formaram a mediana e o período considerado
- **E** achado com base em menos de três cotações é marcado como **base fraca**

### CA-02 · Concentração por fornecedor

- **Dado** um fornecedor que concentra 78% das compras de defensivo do ano
- **Quando** o dono abre o painel
- **Então** vê a concentração por fornecedor, categoria e fazenda
- **E** vê quantas dessas compras tiveram cotação concorrente (feature `018`)
- **E** a concentração é apresentada como **fato**, não como irregularidade

### CA-03 · Compra sem contrapartida física

- **Dado** uma compra de insumo paga, sem entrada em estoque (feature `017`) e sem
  aplicação registrada em talhão (feature `008`)
- **Quando** passam os dias do prazo configurado
- **Então** é aberto achado de **compra sem contrapartida**, com valor e dias em aberto
- **E** o achado se fecha sozinho se a entrada ou a aplicação for registrada depois

### CA-04 · Compra que não combina com a operação

- **Dado** uma compra de insumo de café lançada numa fazenda que não tem talhão de café
- **Quando** a auditoria roda
- **Então** é aberto achado de **incompatibilidade com a frente**
- **E** o rateio entre fazendas (feature `010`) é considerado antes de abrir o achado,
  para não gerar falso positivo em custo compartilhado

### CA-05 · Conflito de interesse é declarado, nunca inferido

- **Dado** um fornecedor com relação declarada com alguém da operação
- **Quando** a relação é cadastrada **pelo produtor**
- **Então** as compras desse fornecedor passam a ser sinalizadas como `related_party`
- **E** o sistema **nunca** infere parentesco ou vínculo cruzando sobrenome, endereço,
  telefone ou qualquer dado pessoal (LGPD, `.claude/rules/security.md`)

### CA-06 · Fracionamento de compra

- **Dado** compras do mesmo item e fornecedor, na mesma fazenda, somando acima da
  alçada dentro de 7 dias (feature `018`)
- **Quando** a auditoria roda
- **Então** é aberto achado de **fracionamento**, com as compras listadas e o total
- **E** o achado referencia a aprovação que deixou de ocorrer

### CA-07 · Linguagem do achado

- **Dado** qualquer achado
- **Quando** ele é apresentado
- **Então** o texto traz fato, número, comparação e período
- **E** não nomeia culpado, não atribui intenção e não usa as palavras fraude, conluio,
  superfaturamento ou desvio na descrição automática (constitution §7)

### CA-08 · Todo achado termina em conclusão registrada

- **Dado** um achado aberto
- **Quando** ele é fechado
- **Então** exige uma das conclusões: `justificado`, `erro_de_registro`,
  `ajuste_de_processo`, `sem_explicacao`, `em_apuracao_externa`
- **E** a justificativa do gerente fica anexada, com autor e data
- **E** achados fechados alimentam o relatório do período, sem ranking de pessoas

### CA-OFF · Cenário offline

- **Dado** que esta feature analisa a base consolidada da organização
- **Quando** o dispositivo está sem conexão
- **Então** os achados **já sincronizados** ficam legíveis em leitura
- **E** nenhuma auditoria é executada localmente: a apuração acontece no servidor, onde
  está a base completa
- **E** a justificativa escrita offline é gravada localmente com UUID v7 do cliente e
  sincroniza depois, sem duplicar

> Auditar exige a base inteira. Rodar a análise num aparelho com um recorte parcial
> produziria achado errado — e achado errado aqui custa caro.

### CA-OP · Cenário de operador

- **Dado** um usuário com perfil `operator`
- **Quando** ele tenta acessar qualquer tela ou endpoint desta feature
- **Então** recebe 403
- **E** nenhum achado, preço ou comparação entra no payload de sync do dispositivo dele
  (constitution §6)

## Regras de negócio

1. Todo achado declara: regra aplicada, período, base de comparação, número de
   observações e impacto em reais.
2. A referência de preço é **interna** — as próprias cotações e compras da organização.
   Índice externo só com licença (constitution §10, feature `023`).
3. Achado com base estatística fraca (menos de três observações) é marcado como tal.
4. Relação com parte relacionada é **declarada pelo produtor**; o sistema não infere
   vínculo a partir de dado pessoal.
5. O sistema não nomeia pessoa, não atribui intenção e não classifica conduta.
6. Achado exige conclusão registrada para fechar.
7. Acesso restrito ao dono, auditado; o gerente responde aos achados do seu escopo.
8. Nenhum dado pessoal em log (`.claude/rules/security.md`).
9. Operador não tem superfície nesta feature (constitution §6).

## Fora de escopo

- Conclusão automática sobre conduta, intenção ou responsabilidade de pessoa.
- Consulta a base externa de sócios, parentesco ou vínculo societário.
- Bloqueio automático de fornecedor.
- Comparação com índice de mercado de insumo sem licença (constitution §10).
- Desvio de mercadoria física — feature `026`.

## Dúvidas abertas

| #   | Dúvida                                                                                                                       | Para quem | Estado |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | --------- | ------ |
| 1   | O que motivou o pedido: suspeita concreta ou precaução? A resposta muda a sensibilidade e a prioridade.                       | produtor  | aberta |
| 2   | Quem pode ver os achados? Se o gerente é quem compra, ele pode ver os achados sobre as próprias compras?                      | produtor  | aberta |
| 3   | Existe fornecedor com relação pessoal conhecida? Ele quer isso declarado no sistema?                                         | produtor  | aberta |
| 4   | Em quantas categorias existe mais de um fornecedor viável na região? Onde não existe, concentração não é achado.             | produtor  | aberta |
| 5   | Qual prazo razoável entre a compra e a entrada no estoque antes de abrir achado de compra sem contrapartida?                 | produtor  | aberta |
| 6   | Esta feature depende da `018` (cotações registradas). Sem histórico de cotação não há mediana. Confirmar a ordem de entrega. | produtor  | aberta |
