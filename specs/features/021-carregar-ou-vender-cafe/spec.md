# 021 · Carregar ou vender: perdas × valorização da saca

|                        |                                                                          |
| ---------------------- | ------------------------------------------------------------------------ |
| **Estado**             | rascunho                                                                 |
| **Fase**               | 2                                                                        |
| **Depende de**         | `011-vendas-logistica-preco-liquido`, `019-armazem-estocagem-e-umidade`, `020`, `023` |
| **Princípios em jogo** | constitution §4, §6, §7, §10                                             |

---

## Problema

Esta é a decisão que o produtor toma várias vezes por ano e sempre no escuro: **vendo
agora ou seguro esperando o preço subir?**

Segurar parece de graça. Não é. Enquanto o café espera, três coisas corroem o ganho:

- a **taxa de armazenagem**, que corre todo mês (feature `019`);
- a **perda de peso por secagem** — o lote encolhe sozinho (feature `019`);
- o **dinheiro parado**, que poderia estar pagando dívida ou custeio.

O número que importa não é "o preço subiu". É: **o preço subiu o suficiente para pagar
o custo de ter esperado?**

Com 1.000 sacas a R$ 1.560, armazenagem de R$ 1,20 por saca/mês e perda de umidade de
12,0% para 10,5% em três meses, o lote vira 983,24 sacas e acumula R$ 3.600 de taxa.
Para empatar com a venda de hoje, a saca precisa chegar a **R$ 1.590,25** — R$ 30,25 a
mais, **1,94%**. Se o mercado subiu 1,5%, segurar deu prejuízo mesmo com o preço em
alta.

O produtor pediu exatamente isso: *"comparativo das perdas versus a valorização da
saca"*. É também, muito provavelmente, a resposta à pergunta que ficou em aberto no
levantamento — qual decisão ele quer tomar e hoje não consegue por falta de informação.

## Usuários e perfis afetados

| Perfil   | O que passa a fazer                                                 | O que **não** pode ver              |
| -------- | ------------------------------------------------------------------- | ----------------------------------- |
| Dono     | Decide vender ou segurar com o ponto de equilíbrio na frente        | —                                   |
| Gerente  | Mantém as premissas (taxa, umidade, custo de capital) atualizadas   | —                                   |
| Operador | Nada — esta feature não tem superfície de operador                  | Tudo: a tela inteira é financeira   |

## Histórias

- Como **dono**, quero saber a quanto a saca precisa chegar para compensar mais um mês
  de armazém.
- Como **dono**, quero ver quanto já custou ter segurado este lote até hoje.
- Como **dono**, quero comparar, depois, a decisão que tomei com o que teria acontecido
  se eu tivesse vendido.
- Como **gerente**, quero ajustar as premissas e ver o ponto de equilíbrio mudar na
  hora.

## Critérios de aceite

### CA-01 · Preço de equilíbrio do carregamento

- **Dado** 1.000 sacas, preço líquido de hoje de R$ 1.560,00, taxa de R$ 1,20 por
  saca/mês e umidade indo de 12,0% a 10,5% em 3 meses
- **Quando** o dono simula segurar por 3 meses
- **Então** o sistema apresenta o lote projetado de **983,24 sacas**, custo de
  armazenagem de **R$ 3.600,00** e preço de equilíbrio de **R$ 1.590,25** por saca
- **E** mostra a diferença em reais (**R$ 30,25**) e em percentual (**1,94%**)
- **E** o cálculo é determinístico e testado (constitution §4)

### CA-02 · Custo de carregar já incorrido

- **Dado** um lote guardado há 5 meses
- **Quando** o dono abre a posição
- **Então** vê o custo de carregamento **já realizado**: taxas pagas, perda de peso
  medida e custo de capital, se configurado
- **E** vê o preço mínimo de venda que ainda empata com a decisão original

### CA-03 · Premissas explícitas e editáveis

- **Dado** a simulação
- **Quando** ela é apresentada
- **Então** cada premissa aparece nomeada, com o valor usado e a origem (medido,
  configurado ou estimado)
- **E** premissa estimada é visualmente distinta de premissa medida
- **E** alterar uma premissa recalcula tudo imediatamente, sem recarregar a tela

### CA-04 · Projeção de umidade é estimativa declarada

- **Dado** um lote sem histórico de leitura de umidade suficiente
- **Quando** a perda futura é projetada
- **Então** ela é marcada como **estimativa**, com a premissa usada visível
- **E** o sistema **não** apresenta a projeção com a mesma confiança de um dado medido

### CA-05 · O sistema não manda vender

- **Dado** qualquer resultado da simulação
- **Quando** ele é apresentado
- **Então** o texto mostra o ponto de equilíbrio e os cenários, **sem** recomendar
  vender ou segurar (constitution §7)
- **E** não há frase do tipo "o melhor momento para vender é…"

### CA-06 · Comparação posterior da decisão

- **Dado** uma decisão registrada de segurar o lote
- **Quando** o lote é vendido meses depois
- **Então** o sistema apresenta o resultado efetivo contra o cenário de ter vendido na
  data da decisão, em reais
- **E** o histórico guarda as premissas vigentes **naquela data**, não as atuais

### CA-07 · Preço de referência só com origem lícita

- **Dado** a necessidade de um preço de mercado para projetar
- **Quando** não há licença de fonte de cotação contratada
- **Então** o sistema usa o preço de referência **cadastrado manualmente** pelo
  produtor, identificado como tal (constitution §10, feature `023`)
- **E** nenhuma cotação de terceiro é exibida sem licença

### CA-OFF · Cenário offline

- **Dado** que o dono está sem conexão e quer decidir sobre uma proposta recebida por
  telefone
- **Quando** abre a simulação
- **Então** ela roda **localmente**, com as premissas e a posição já sincronizadas no
  aparelho
- **E** a data da última atualização do preço de referência aparece junto do resultado
- **E** a decisão registrada offline grava com UUID v7 do cliente e sincroniza depois,
  sem duplicar

> A conta precisa rodar no cliente. A decisão de vender acontece ao telefone, muitas
> vezes na fazenda, e não espera conexão.

### CA-OP · Cenário de operador

- **Dado** um usuário com perfil `operator`
- **Quando** ele tenta acessar qualquer tela ou endpoint desta feature
- **Então** recebe 403
- **E** nada desta feature entra no payload de sync do dispositivo dele
  (constitution §6)

## Regras de negócio

1. `custo_de_carregar = taxa_de_armazenagem + perda_de_peso_valorizada + custo_de_capital`.
2. `preço_de_equilíbrio = (receita_líquida_hoje + custo_de_carregar) ÷ sacas_projetadas`.
3. A receita de hoje é o **líquido na porteira** (feature `011`), nunca o preço bruto.
4. As sacas projetadas usam a fórmula de matéria seca da feature `019`.
5. Custo de capital é **opcional** e só entra se o produtor definir a taxa; sem
   definição, aparece como premissa ausente, não como zero disfarçado.
6. Toda premissa carrega origem: `measured`, `configured` ou `estimated`.
7. A decisão registrada congela as premissas da data, para comparação honesta depois.
8. O sistema apresenta cenários; não recomenda (constitution §7).
9. O mesmo código de cálculo roda no cliente e no servidor, em `@fmc/shared`.

## Fora de escopo

- Previsão de preço futuro, modelo estatístico ou de IA sobre cotação.
- Operação de hedge, contrato futuro ou opção na bolsa — ver dúvida 4.
- Venda travada e contrato a termo — feature `025`.
- A mesma decisão aplicada ao gado (segurar para engordar × vender) — ver dúvida 6.

## Dúvidas abertas

| #   | Dúvida                                                                                                                  | Para quem | Estado |
| --- | ------------------------------------------------------------------------------------------------------------------------- | --------- | ------ |
| 1   | **É esta a decisão que hoje é tomada no escuro?** Se for, ela organiza a prioridade de todas as features de café.        | produtor  | aberta |
| 2   | Quanto tempo o café costuma ficar guardado antes da venda? Qual o maior período já praticado?                           | produtor  | aberta |
| 3   | Existe custo de capital a considerar (financiamento de custeio, juros)? Qual taxa usar?                                 | produtor  | aberta |
| 4   | Já se usou contrato futuro, hedge ou venda travada na cooperativa? Isso muda o escopo.                                  | produtor  | aberta |
| 5   | A cooperativa dá adiantamento sobre o café entregue? Isso altera o custo de carregar.                                   | produtor  | aberta |
| 6   | A mesma lógica interessa para o gado (segurar para engordar × vender agora)? É outra feature.                           | produtor  | aberta |
| 7   | A decisão é do dono sozinho, ou o gerente também decide até certo volume?                                               | produtor  | aberta |
