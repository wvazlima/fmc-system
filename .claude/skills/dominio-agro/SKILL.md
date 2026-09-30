---
name: dominio-agro
description: Regras de negócio e fórmulas do agro no FMC — gado como mercadoria, café por talhão e safra, lavouras eventuais, custos compartilhados. Use ao escrever ou revisar qualquer cálculo de custo, margem, giro, rateio ou transferência interna; ao modelar tabela de domínio; e sempre que aparecer termo do agro (talhão, safra, saca, lote, GTA, IATF) que você não tem certeza de como tratar.
---

# Domínio: gado, café, lavouras e custos

O vocabulário está em `specs/glossario.md` — consulte antes de nomear qualquer coisa.
Aqui estão as **fórmulas** e as **regras que não são óbvias**.

## Antes de qualquer cálculo

| Grandeza       | Unidade armazenada                                  | Unidade apresentada                 |
| -------------- | --------------------------------------------------- | ----------------------------------- |
| Dinheiro       | centavos (inteiro) no TS · `numeric(14,2)` no banco | R$ com 2 casas                      |
| Café           | **kg**                                              | sacas de **60 kg**                  |
| Área           | m² (derivado da geometria)                          | **hectares** (m² ÷ 10.000)          |
| Peso de animal | kg                                                  | kg ou @ (arroba = 15 kg de carcaça) |

Confusão de unidade é o erro de cálculo mais comum e o mais difícil de enxergar. Declare
a unidade no nome: `totalCostCents`, `weightKg`, `areaHa`, `volumeKg`.

**Safra:** ano agrícola de **julho a junho**, rotulada `26/27`. O custo entra na safra
pela **competência** (`accrual_date`), nunca pelo pagamento.

## Café

```
custo_por_hectare = custo_total_do_talhao_na_safra / area_ha
custo_por_saca    = custo_total_do_talhao_na_safra / sacas_colhidas
sacas_por_hectare = sacas_colhidas / area_ha
```

- `custo_total_do_talhao_na_safra` = custos **diretos** do talhão (adubação, foliar,
  herbicida, defensivo, mão de obra da operação) **+** a parcela de custo compartilhado
  rateada até ele.
- **Custo por saca só é definitivo depois do fechamento da colheita da safra.** Antes
  disso é projeção, e precisa ser rotulado como projeção na tela.
- Gasto por categoria soma as aplicações por `category`, na competência.
- Talhão com área mudada no meio da safra usa a área **vigente na data da competência**
  do custo. Guarde o histórico de área.

## Gado

```
custo_acumulado  = preco_compra + custos_atribuidos + rateio_recebido
margem_por_cabeca = preco_venda_liquido - custo_acumulado
margem_do_lote    = soma das margens dos animais do lote
giro_dias         = data_saida - data_entrada
custo_por_dia     = custo_acumulado / dias_na_fazenda
```

Regras que se erra com frequência:

- **A margem atravessa transferências.** Animal que foi da fazenda A para a B continua
  com a mesma apuração, da compra à venda. A transferência **não encerra** nada: ela
  **adiciona** frete e custo de GTA ao `custo_acumulado`.
- `preco_venda_liquido` já desconta frete, comissão, taxa de leilão e **quebra de peso**.
- Custo de IATF (protocolo hormonal, sêmen, mão de obra) é atribuído **ao animal**, não
  diluído no lote.
- Morte ou descarte: o custo acumulado vira **perda do lote**, não desaparece.
- Animal comprado prenhe tem o valor da prenhez embutido no preço de compra. A
  comparação "comprar prenha × emprenhar aqui" confronta:

```
comprar_prenha   = preco_compra_prenha + custos_ate_a_venda
emprenhar_aqui   = preco_compra_vazia + custo_iatf + custo_dos_dias_a_mais + custos_ate_a_venda
```

O `custo_dos_dias_a_mais` é o que quase sempre é esquecido: a novilha emprenhada aqui
fica mais tempo na fazenda, e cada dia custa.

## Lavouras eventuais e transferência interna

Silagem consumida pelo gado é **transferência interna de custo** — não há dinheiro
envolvido:

```
custo_unitario_silagem = custo_total_da_lavoura / toneladas_produzidas
valor_transferido      = toneladas_consumidas * custo_unitario_silagem
```

- Sai do centro de custo da lavoura, entra no do gado.
- **Pelo custo de produção, nunca por preço de mercado.** Usar preço de mercado infla o
  resultado da lavoura e destrói a margem do gado com um número que não é caixa.
- Sobra de silagem não consumida fica como estoque no custo da lavoura.

## Rateio em dois níveis

Custo compartilhado (funcionário, diesel, máquina, energia) é rateado em **dois passos**.
Rateio em um passo só está errado.

```
1º nível — entre fazendas:
   parcela_fazenda = custo_total * criterio_fazenda

2º nível — entre frentes, dentro da fazenda:
   parcela_frente = parcela_fazenda * criterio_frente
```

Critérios possíveis, por tipo de custo:

| Custo                             | Critério típico do 1º nível  | Critério típico do 2º nível |
| --------------------------------- | ---------------------------- | --------------------------- |
| Funcionário fixo                  | fazenda de alocação (100%)   | horas apontadas por frente  |
| Funcionário volante               | dias trabalhados por fazenda | horas apontadas por frente  |
| Diesel                            | litros por fazenda           | horas de máquina por frente |
| Máquina (depreciação, manutenção) | horas de uso por fazenda     | horas de uso por frente     |
| Energia                           | medidor da fazenda           | área ou uso declarado       |

- **O critério é dado configurável e versionado**, não constante no código. Ele muda, e
  relatório antigo precisa continuar reproduzível.
- A soma das parcelas é **exatamente** o custo total. Trate o arredondamento: a diferença
  de centavos vai para a maior parcela.
- **Pessoal** (casa, jardim, despesa dos proprietários) **não entra em rateio produtivo.**

## Preço líquido na porteira

```
liquido_por_saca = preco_bruto - frete_por_saca - taxas_por_saca - perda_por_quebra
```

**O preço bruto nunca é apresentado sozinho.** A proposta com o maior preço
frequentemente não é a que paga mais. Vale igual para gado: comprador que busca na
fazenda × leilão, com frete, GTA e quebra de peso no transporte.

## Histórico importado

Registro com `source = 'import'` pode ter campo opcional que um lançamento novo
exigiria. Relatório que mistura histórico e dado nativo **sinaliza** o período
importado. Nunca afrouxe a validação do lançamento novo por causa do importador.

## Quando parar e perguntar

Você **não inventa regra de negócio**. Se a fórmula ou a regra não está aqui nem no
glossário, a resposta correta é registrar a dúvida:

- Qual critério de rateio o produtor usa hoje para X?
- A quebra de peso é medida ou estimada por percentual?
- O custo de funcionário inclui encargos no rateio, ou só salário?
- Café de lotes diferentes misturado na tulha: como atribuir o custo?

Chute vira número errado num painel que decide compra e venda.
