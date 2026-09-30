---
name: integracao-contabil
description: Integração com a contabilidade — Folhamatic por arquivo texto, de-para de plano de contas, LCDPR (regime de caixa, por imóvel, participantes e contas bancárias) e exportação por fazenda. Use ao implementar exportação contábil, importação de folha, livro caixa, ou ao decidir como um lançamento deve ser classificado para o contador.
---

# Integração contábil

O produtor é **pessoa física, sem CNPJ, com inscrição estadual por fazenda**. Isso
define tudo o que vem a seguir.

## O que separa gestão de contabilidade

|               | Gestão                                | Contabilidade / fisco                     |
| ------------- | ------------------------------------- | ----------------------------------------- |
| Base temporal | **competência** (`accrual_date`)      | **caixa** (`cash_date`)                   |
| Pergunta      | quanto custou a saca da safra 26/27?  | quanto entrou e saiu, e quando?           |
| Recorte       | talhão, lote, frente, safra           | **imóvel** (fazenda), participante, conta |
| Saída         | painéis, custo/ha, custo/saca, margem | livro caixa, LCDPR, lançamento contábil   |

**Nunca misture as duas bases** (ADR-0008). Todo relatório declara qual usa.

## Escrita separada por fazenda

Cada fazenda tem **inscrição estadual própria** e escrita contábil separada. Toda
exportação é **por fazenda**. Consolidado do grupo existe para a gestão, não para o
fisco.

## Plano de contas e de-para

- O plano de contas é **acordado com o contador**, não inventado por nós.
- O **de-para** (categoria do sistema → conta contábil) é **dado configurável e
  versionado**, nunca constante no código.
- Versionado porque muda: relatório de período antigo precisa continuar reproduzível com
  o de-para vigente naquela data.
- Categoria sem de-para configurado **bloqueia a exportação** com erro explicando qual
  categoria falta. Nunca exporte para uma conta genérica "outros".

## Exportação (Fase 1)

Planilha por fazenda e por período, no formato combinado com o escritório:

- base **caixa** (`cash_date`);
- uma linha por lançamento, com data, histórico, participante (CPF/CNPJ), conta
  contábil do de-para, valor, natureza (entrada/saída) e conta bancária;
- totais por conta, conferidos contra o total geral;
- **proteção contra injeção de fórmula**: célula que começa com `=`, `+`, `-` ou `@` é
  prefixada.

## LCDPR — Livro Caixa Digital do Produtor Rural

Obrigação da Receita Federal, em arquivo de layout definido.

**O que ele exige, e que o modelo de dados precisa sustentar:**

| Exigência                     | Consequência no modelo                                               |
| ----------------------------- | -------------------------------------------------------------------- |
| **Regime de caixa**           | `cash_date` obrigatório; lançamento sem caixa não entra              |
| **Por imóvel rural**          | cada fazenda com seu cadastro de imóvel (código, área, participação) |
| **Participante identificado** | CPF ou CNPJ obrigatório no lançamento                                |
| **Conta bancária**            | vinculada à fazenda; movimentação bancária identificada              |
| **Histórico do lançamento**   | texto descritivo, não só a categoria                                 |
| **Saldo inicial e final**     | por conta e por período                                              |

**Cuidados:**

- O layout **muda entre anos-base**. Verifique a versão vigente antes de implementar e
  **registre no código qual versão foi usada**.
- Encoding costuma ser **latin-1**, não UTF-8.
- Validação de CPF/CNPJ na entrada, não na hora da geração — corrigir no fechamento é
  tarde.
- Lançamento parcelado gera **um** registro de competência e **N** eventos de caixa; o
  LCDPR recebe os eventos de caixa.

## Folhamatic (Fase 2)

Folha de pagamento do escritório contábil (IOB). Integração **por arquivo texto**.

**Da folha para o sistema:**

- Importa salários e encargos do período.
- **Distribui por fazenda e por frente**, para que o custo da saca e a margem do gado
  fiquem reais. Sem isso, mão de obra fica de fora do custo — e ela é uma das maiores
  linhas.
- A distribuição usa o **rateio em dois níveis** (skill `dominio-agro`): o critério do
  2º nível normalmente é hora apontada por frente.

**Cuidados:**

- Layout de arquivo texto posicional: a especificação é do fornecedor e **muda entre
  versões**. Guarde o arquivo original.
- Encoding latin-1.
- Importação é **lote reversível com conferência de totais** (skill
  `importacao-planilhas`).

## Arquitetura: adaptador, não acoplamento

```
domínio  ←→  interface contábil  ←→  adaptador  ←→  formato do terceiro
```

O formato de terceiro **não vaza** para dentro do domínio. Outro sistema contábil entra
como adaptador novo, sem tocar no domínio. Isso está previsto no roadmap: "outros
sistemas contábeis entram como novos adaptadores".

## Perguntas que precisam de resposta humana

Não invente nenhuma destas — pergunte ao contador:

- Qual o plano de contas e como mapear cada categoria do sistema?
- O LCDPR é obrigatório para este produtor neste ano-base?
- Em que formato exato o escritório quer receber a planilha da Fase 1?
- Encargos entram no rateio junto com o salário, ou separados?
- Como tratar despesa que atravessa fazendas num mesmo documento fiscal?
