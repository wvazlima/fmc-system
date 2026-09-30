---
name: importacao-planilhas
description: Pipeline de importação do histórico das planilhas — staging, mapeamento, limpeza, validação, lote reversível e conferência de totais. Use ao implementar ou depurar importação de Excel/CSV, ao tratar dado histórico, ao marcar registro como importado, ou ao investigar divergência entre planilha e sistema.
---

# Importação do histórico das planilhas

Anos de controle de gado, café e despesas de 5 fazendas vivem em Excel. Eles precisam
entrar **sem contaminar** o dado novo (constitution §11).

O risco real não é técnico: é o produtor perder a confiança no sistema porque um total
não bateu com a planilha dele.

## O pipeline — cinco etapas, nesta ordem

```
1. Staging      →  2. Mapeamento  →  3. Limpeza  →  4. Validação  →  5. Lote reversível
   (cru, fiel)      (de-para)        (normaliza)    (rejeita)        (+ conferência)
```

### 1. Staging — carregue cru

- Cada aba de cada arquivo vira uma tabela de staging com **as colunas como texto**, do
  jeito que estão. Nada é interpretado ainda.
- Guarde o **arquivo original** no storage, com hash. Quando algo não bater, você vai
  precisar dele.
- Registre: arquivo, aba, linha de origem. **Toda linha importada aponta para sua linha
  na planilha.** Sem isso, não há como investigar divergência.

### 2. Mapeamento — de-para explícito

- Coluna da planilha → campo do domínio, como **configuração versionada**, não código.
- Cada fazenda e cada ano provavelmente tem um layout diferente. Assuma isso desde o
  começo; um mapeamento por arquivo.
- Coluna que não mapeia para nada é registrada como **ignorada**, com o nome. Nunca
  descartada em silêncio.

### 3. Limpeza — normalize o que é normalizável

Os problemas que sempre aparecem:

| Problema                                       | Tratamento                                                               |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| Data em texto, em cinco formatos               | normalize; ambíguo (`03/04/22`) vai para revisão, não chute              |
| Número com `.` de milhar e `,` de decimal      | normalize para centavos; **nunca** `parseFloat` direto                   |
| Valor em célula de texto com `R$`, espaço, `-` | extraia; célula vazia ≠ zero                                             |
| Nome de fornecedor grafado de 6 jeitos         | agrupe por similaridade e **apresente** ao gerente; não unifique sozinho |
| Linha de total no meio dos dados               | detecte e exclua — ela **duplica** a soma                                |
| Célula mesclada                                | expanda o valor para as linhas cobertas                                  |
| Linha em branco separando blocos               | ignore, mas conte                                                        |
| Fórmula com `#REF!`, `#N/D`                    | vai para revisão                                                         |

**Nunca corrija dado em silêncio.** Toda transformação é registrada e mostrada.

### 4. Validação — tolerante, mas explícita

O importador tem **caminho próprio de validação**, mais tolerante que o lançamento novo:

- Campo que um lançamento novo exigiria pode faltar. Registre o que faltou.
- Cada linha rejeitada tem **motivo em pt-BR** e aponta para a linha da planilha.
- O gerente vê a lista de rejeitadas **antes** de confirmar a importação.

**Proibido afrouxar a validação do lançamento novo** para o importador passar. São dois
caminhos diferentes.

### 5. Lote reversível e conferência de totais

- Toda importação é um **lote**, com ID. Todo registro criado carrega
  `source = 'import'` e o ID do lote.
- **O lote pode ser desfeito inteiro**, mesmo depois de dias. Isso é requisito, não
  conforto: a primeira importação sempre sai errada.
- **Conferência de totais**, apresentada ao gerente antes da confirmação:

| Conferência     | Planilha      | Importado     | Diferença       |
| --------------- | ------------- | ------------- | --------------- |
| Nº de linhas    | 1.284         | 1.279         | −5 (rejeitadas) |
| Soma de valores | R$ 482.310,00 | R$ 482.310,00 | R$ 0,00         |
| Nº de animais   | 312           | 312           | 0               |
| Sacas colhidas  | 4.180         | 4.180         | 0               |

Diferença de **um centavo** é diferença. Investigue antes de confirmar.

## Marcação do histórico

- `source = 'import'` + referência ao lote, em todo registro.
- Relatório que mistura histórico e dado nativo **sinaliza o período importado**.
- O usuário consegue filtrar "só dado nativo" em qualquer relatório.

## Onde roda

No **`worker`** (Cloud Run Job), nunca no caminho de requisição. Planilha de milhares de
linhas leva minutos. O usuário acompanha o progresso e recebe o resultado.

O job é **idempotente**: reprocessar o mesmo arquivo não duplica — ele reconhece o lote
pelo hash.

## Bibliotecas

Leitura de `.xlsx` e `.csv` em TypeScript, com checagem de licença comercial antes de
adotar (constitution §10). Arquivo pode vir em **latin-1**; detecte, não assuma UTF-8.
