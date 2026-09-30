# 011 · Vendas, logística e preço líquido na porteira

|                        |                                                               |
| ---------------------- | ------------------------------------------------------------- |
| **Estado**             | rascunho                                                      |
| **Fase**               | 1                                                             |
| **Depende de**         | `006-gado-venda-e-margem`, `007-cafe-talhoes-e-safras`, `009` |
| **Princípios em jogo** | constitution §4, §5, §6, §10                                  |

---

## Problema

Chegam três propostas para o mesmo café. A melhor delas paga R$ 1.560 a saca; a pior,
R$ 1.500. Parece óbvio.

Só que a de R$ 1.560 é entregue a 210 km e tem taxa de armazém; a de R$ 1.500 o
comprador retira na fazenda. Descontado tudo, a primeira paga **R$ 1.510** e a segunda
paga **R$ 1.500** — e a intermediária, de R$ 1.540 entregue a 85 km, paga **R$ 1.522**,
mais do que as duas.

**O maior preço nem sempre é o que paga mais.** Hoje essa conta é feita de cabeça, ou
não é feita. Vale igual para o gado: comprador que busca na fazenda × leilão, com
frete, comissão, GTA e quebra de peso.

## Usuários e perfis afetados

| Perfil   | O que passa a fazer                                                          | O que **não** pode ver |
| -------- | ---------------------------------------------------------------------------- | ---------------------- |
| Dono     | Compara propostas pelo líquido e decide                                      | —                      |
| Gerente  | Registra propostas, condições de entrega, custos logísticos; efetiva a venda | —                      |
| Operador | Registra embarque, pesagem e volume carregado                                | Preço, frete, líquido  |

## Histórias

- Como **gerente**, quero registrar as propostas recebidas com preço, condição de
  entrega e distância.
- Como **dono**, quero ver as propostas ordenadas pelo **líquido na porteira**, não pelo
  preço bruto.
- Como **gerente**, quero efetivar a proposta escolhida e que ela vire venda com
  lançamento financeiro.
- Como **gerente**, quero comparar o mesmo lote de gado entre venda direta e leilão.

## Critérios de aceite

### CA-01 · Cálculo do líquido

- **Dado** uma proposta de R$ 1.560,00 por saca, entregue a 210 km, com frete de
  R$ 38,00 e taxa de armazém de R$ 12,00 por saca
- **Quando** o líquido é calculado
- **Então** ele é **R$ 1.510,00** por saca
- **E** o cálculo é determinístico e testado (constitution §4)

### CA-02 · O bruto nunca aparece sozinho

- **Dado** qualquer tela ou relatório que mostre preço de proposta
- **Quando** ele é exibido
- **Então** o **líquido** aparece junto, com igual ou maior destaque
- **E** não existe tela que mostre só o bruto

### CA-03 · Comparação lado a lado

- **Dado** três propostas para o mesmo lote
- **Quando** o dono abre a comparação
- **Então** vê preço bruto, cada dedução discriminada e o líquido de cada uma
- **E** a lista é ordenada pelo **líquido**, decrescente
- **E** a diferença em reais entre a melhor e as demais é apresentada, no total do lote

### CA-04 · Gado com quebra de peso

- **Dado** uma proposta de venda de gado com entrega em leilão a 140 km
- **Quando** o líquido é calculado
- **Então** ele desconta frete, comissão, taxa de leilão, GTA e **quebra de peso**
- **E** a quebra usa o valor medido quando há pesagem nas duas pontas (feature `005`),
  ou o percentual configurado quando não há

### CA-05 · Efetivar a proposta

- **Dado** uma proposta escolhida
- **Quando** o gerente a efetiva
- **Então** é criada a venda, com lançamento financeiro de **duas datas** (ADR-0008)
- **E** cada dedução vira um lançamento vinculado, não some dentro do valor líquido
- **E** para o gado, a margem por cabeça é recalculada (feature `006`)

### CA-06 · Proposta não efetivada fica no histórico

- **Dado** propostas recusadas
- **Quando** o dono abre o histórico de vendas
- **Então** vê as propostas que foram recusadas, com o líquido de cada uma
- **E** consegue avaliar, depois, se a decisão foi boa

### CA-07 · Sem preço de mercado de terceiro sem licença

- **Dado** uma tela de comparação
- **Quando** ela é exibida
- **Então** não há indicador de preço de mercado vindo de fonte licenciada (CEPEA) sem
  contrato (constitution §10)
- **E** o produtor pode cadastrar manualmente um preço de referência próprio

### CA-OFF · Cenário offline

- **Dado** que o gerente está na fazenda, sem sinal, recebendo uma proposta por
  telefone
- **Quando** registra a proposta e vê o líquido
- **Então** o cálculo é feito **localmente** e o resultado aparece na hora
- **E** a proposta é gravada localmente e sincroniza depois, sem duplicar

> O cálculo do líquido precisa rodar no cliente. É na porteira, sem sinal, que a
> decisão é tomada.

### CA-OP · Cenário de operador

- **Dado** um operador alocado na fazenda A
- **Quando** ele registra o embarque e o volume carregado
- **Então** não recebe preço, frete, dedução nem líquido
- **E** não tem acesso à tela de propostas
- **E** ao tentar acessar venda da fazenda B, recebe 403

## Regras de negócio

1. `líquido = preço_bruto − frete − taxas − quebra_de_peso` (skill `dominio-agro`).
2. **O preço bruto nunca é apresentado sozinho.**
3. Café: deduções típicas são frete por saca, taxa de armazém, classificação e comissão.
4. Gado: deduções típicas são frete, comissão, taxa de leilão, GTA e **quebra de peso**.
5. A quebra de peso usa o valor **medido** quando existe; senão, o percentual
   configurado, marcado como estimativa.
6. Efetivar a proposta gera venda + lançamento com duas datas; cada dedução é um
   lançamento vinculado.
7. Proposta recusada permanece no histórico.
8. Preço de fonte licenciada só com licença contratada (constitution §10).
9. O cálculo roda no cliente e no servidor, a partir do **mesmo código** em
   `@fmc/shared`.
10. Operador nunca recebe valor (constitution §6).

## Fora de escopo

- Contrato de venda com acompanhamento de entrega — Fase Financeiro e Fiscal.
- Emissão de NF-e e MDF-e — Fase Financeiro e Fiscal.
- Cotação automática e integração com bolsa ou cooperativa.
- Simulador de cenários com projeção de preço — Fase 2.
- Rastreabilidade de lote de café e venda como especial — Fase 2.

## Dúvidas abertas

| #   | Dúvida                                                                                        | Para quem | Estado |
| --- | --------------------------------------------------------------------------------------------- | --------- | ------ |
| 1   | Quais deduções aparecem de fato numa venda de café? E numa de gado? Precisamos da lista real. | produtor  | aberta |
| 2   | O frete é cotado por viagem ou por saca/cabeça? Quem paga em cada condição de entrega?        | produtor  | aberta |
| 3   | Funrural e outros encargos sobre a venda entram no líquido gerencial?                         | contador  | aberta |
| 4   | Existe contrato futuro ou venda travada antecipada? Isso muda o modelo de proposta.           | produtor  | aberta |
| 5   | Há interesse em licenciar o CEPEA? Sem licença, o preço de referência é cadastro manual.      | produtor  | aberta |
| 6   | Qual o percentual de quebra de peso usado hoje quando não há pesagem nas duas pontas?         | produtor  | aberta |
