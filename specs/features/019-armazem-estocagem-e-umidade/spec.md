# 019 · Armazém: custo de estocagem, umidade e perda de peso

|                        |                                                                        |
| ---------------------- | ---------------------------------------------------------------------- |
| **Estado**             | rascunho                                                               |
| **Fase**               | 2                                                                      |
| **Depende de**         | `007-cafe-talhoes-e-safras`, `011-vendas-logistica-preco-liquido`      |
| **Princípios em jogo** | constitution §4, §5, §6                                                |

---

## Problema

O café colhido não é vendido no mesmo dia. Ele vai para a tulha ou para o armazém da
cooperativa e fica lá meses, esperando preço melhor. Enquanto espera, duas coisas
acontecem — e nenhuma das duas aparece na planilha.

**A primeira é o custo de guardar.** Armazém cobra taxa por saca e por período, mais
seguro e, às vezes, beneficiamento. Esse custo corre todo mês, silencioso, e só vira
visível quando a nota chega.

**A segunda é a perda de peso.** Café entra no armazém com uma umidade e sai com
outra. Se entrou com 12% e saiu com 10,5%, mil sacas viraram pouco mais de 983. As
16,8 sacas que faltam não foram roubadas: evaporaram. A um preço de R$ 1.560, são
quase R$ 26 mil que desapareceram sem nenhum lançamento.

Nas palavras do produtor: *"geralmente quem faz é o armazém, porém se fica estocado
por muito tempo ele perde umidade e consequentemente peso, gerando prejuízo"*.

Hoje ninguém mede isso. A conferência é a nota do armazém no fim — e aí já passou.

## Usuários e perfis afetados

| Perfil   | O que passa a fazer                                                   | O que **não** pode ver                    |
| -------- | --------------------------------------------------------------------- | ----------------------------------------- |
| Dono     | Vê quanto custa manter o café guardado e quanto já evaporou           | —                                         |
| Gerente  | Registra entrada, pesagem, umidade, taxas e saída do armazém          | —                                         |
| Operador | Registra pesagem e leitura de umidade na tulha da fazenda             | Taxa, custo acumulado, valor da perda     |

## Histórias

- Como **gerente**, quero registrar quanto café entrou no armazém, com peso e umidade.
- Como **gerente**, quero lançar a taxa de armazenagem do mês e vê-la entrar no custo
  do lote.
- Como **dono**, quero saber quanto peso já perdi por secagem desde que guardei.
- Como **dono**, quero que o custo de carregar o café entre na conta antes de eu
  decidir segurar mais um mês (feature `021`).

## Critérios de aceite

### CA-01 · Entrada no armazém com peso e umidade

- **Dado** um lote de café que vai para o armazém
- **Quando** a entrada é registrada
- **Então** ficam gravados peso em kg, **umidade percentual**, data, local e
  responsável
- **E** o local pode ser tulha própria da fazenda ou armazém de terceiro, com a
  contraparte identificada (feature `016`)

### CA-02 · Perda de peso por redução de umidade

- **Dado** 60.000 kg que entraram a **12,0%** de umidade
- **Quando** a pesagem seguinte acusa **10,5%**
- **Então** o peso equivalente calculado é **58.994,4 kg**, pela fórmula de matéria
  seca `peso₂ = peso₁ × (100 − U₁) ÷ (100 − U₂)`
- **E** a perda é **1.005,6 kg**, ou **16,76 sacas** de 60 kg
- **E** o cálculo é determinístico, testado, e roda no mesmo código no cliente e no
  servidor (constitution §4)

### CA-03 · Perda de peso é separada de quebra e de furto

- **Dado** uma perda apurada entre duas pesagens
- **Quando** ela é classificada
- **Então** o sistema distingue `moisture_loss` (explicada pela umidade),
  `handling_loss` (quebra de manuseio) e `unexplained` (sobra sem explicação)
- **E** a parcela `unexplained` alimenta a feature `026`

### CA-04 · Custo de estocagem corre no tempo

- **Dado** 1.000 sacas no armazém a R$ 1,20 por saca por mês, mais seguro de 0,05% do
  valor ao mês
- **Quando** passam três meses
- **Então** o custo acumulado de estocagem do lote é calculado e apresentado por saca
  e no total
- **E** cada competência mensal gera lançamento com duas datas (ADR-0008) — competência
  no mês do serviço, caixa na data do pagamento

### CA-05 · O custo acumulado entra no preço líquido

- **Dado** um lote com custo de estocagem acumulado
- **Quando** uma proposta de venda é avaliada (feature `011`)
- **Então** o custo de estocagem e a perda de peso entram no líquido na porteira
- **E** o líquido por saca considera as sacas **que restaram**, não as que entraram

### CA-06 · Café em armazém de terceiro é conferido

- **Dado** um extrato de posição enviado pelo armazém
- **Quando** o gerente o registra
- **Então** o sistema compara a posição do armazém com a posição do sistema
- **E** a divergência em sacas e em valor é destacada e fica aberta até ser resolvida

### CA-07 · Umidade fora da faixa comercial é sinalizada

- **Dado** uma leitura de umidade fora da faixa comercial acordada (ver dúvida 2)
- **Quando** ela é registrada
- **Então** o sistema sinaliza, indicando se o risco é de deságio na classificação
  (acima) ou de perda de peso (abaixo)
- **E** **não** recomenda ação de secagem nem parâmetro de secador: apenas apresenta o
  dado (constitution §7)

### CA-OFF · Cenário offline

- **Dado** que o operador está na tulha, sem sinal, com o medidor de umidade na mão
- **Quando** registra peso e umidade
- **Então** a leitura é gravada no banco local com UUID v7 do cliente e aparece como
  `pendente`
- **E** a perda em relação à leitura anterior é calculada localmente e aparece na hora,
  em sacas
- **E** ao sincronizar, as leituras entram como eventos somados à série, sem
  sobrescrever a posição

### CA-OP · Cenário de operador

- **Dado** um operador alocado na fazenda A
- **Quando** ele registra a pesagem e a umidade
- **Então** vê peso, umidade e a variação em **kg e sacas**
- **E** não recebe taxa de armazenagem, custo acumulado, valor da perda nem preço — os
  campos não entram na projeção nem no sync (constitution §6)
- **E** ao tentar acessar lote da fazenda B, recebe 403

## Regras de negócio

1. Armazém é `warehouse` (glossário); pode ser próprio ou de terceiro.
2. Todo volume é guardado em **kg** e apresentado em **sacas** de 60 kg (glossário).
3. A conversão de peso entre umidades usa `peso₂ = peso₁ × (100 − U₁) ÷ (100 − U₂)`.
4. Perda classificada como `moisture_loss` é perda **física esperada** e não indica
   problema; `unexplained` indica, e vai para a `026`.
5. Custo de estocagem é apropriado por competência mensal ao lote, não ao talhão —
   é custo pós-colheita.
6. O custo de estocagem **não** entra no custo por saca da safra (feature `007`), que
   mede produção; entra no resultado da venda.
7. A posição de armazém de terceiro é conferida contra extrato; divergência aberta
   bloqueia o fechamento do lote.
8. Operador nunca recebe valor (constitution §6).

## Fora de escopo

- Rastreabilidade completa talhão → colheita → secagem → armazém → venda — Fase 2,
  item próprio do roadmap.
- Controle do processo de secagem (terreiro, secador, horas, lenha) — ver dúvida 5.
- Decisão de vender ou segurar — feature `021`.
- Classificação e qualidade do lote — feature `022`.
- Armazenagem de grão de lavoura eventual (milho) — ver dúvida 6.

## Dúvidas abertas

| #   | Dúvida                                                                                                                          | Para quem | Estado |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | --------- | ------ |
| 1   | O café fica em tulha própria, em armazém de terceiro, ou na cooperativa? Quanto fica em cada um?                                | produtor  | aberta |
| 2   | Levantado: a referência técnica de armazenamento é **11% a 12%** (acima disso, fungo; abaixo de 10%, perda de peso). Qual a faixa acordada na venda dele e o deságio por ponto? | produtor  | aberta |
| 3   | A umidade é medida por quem, com que aparelho e com que frequência? Ou só o armazém mede?                                       | produtor  | aberta |
| 4   | Como a cooperativa cobra a armazenagem: por saca/mês, percentual sobre o valor, ou embutido na venda?                           | produtor  | aberta |
| 5   | A secagem é feita na fazenda? Se sim, o custo (lenha, energia, mão de obra) deve ser rateado por lote?                          | produtor  | aberta |
| 6   | Milho em grão também é armazenado? Mesmo tratamento?                                                                            | produtor  | aberta |
| 7   | A perda de peso por umidade é despesa dedutível ou simples ajuste de estoque no livro caixa?                                    | contador  | aberta |
