# Glossário do domínio

Vocabulário único do projeto. Sempre que houver dúvida sobre como nomear algo no
código, a resposta está aqui.

**Regra de nomenclatura:** o termo de domínio é usado em português na conversa, nos
comentários, nas specs e na interface. No **código, no banco e nas APIs o nome é em
inglês**, exatamente como está na coluna "Código".

Formato de cada entrada: definição em uma linha, nome em inglês usado no código e a
regra de negócio relevante quando existir.

---

## Estrutura e organização

| Termo              | Código               | Definição e regra                                                                                                                                 |
| ------------------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Organização        | `organization`       | O cliente do sistema; hoje, o grupo do produtor. Raiz de todo dado. **Regra:** toda tabela de negócio referencia `organization_id`.               |
| Fazenda            | `farm`               | Imóvel rural com operação própria. **Regra:** toda tabela de negócio referencia `farm_id`; são 5 hoje, arquitetura pronta para 1 a 10.            |
| Inscrição estadual | `state_registration` | Registro estadual do produtor por imóvel. **Regra:** uma por fazenda; é a chave da separação contábil e do LCDPR.                                 |
| Talhão             | `plot`               | Área contínua de cultivo dentro de uma fazenda, com geometria própria. **Regra:** área em hectares é calculada do polígono PostGIS, não digitada. |
| Safra              | `season`             | Ano agrícola de **julho a junho**. **Regra:** rotulada `26/27`; o custo é atribuído à safra pela data de competência, não pela data de pagamento. |
| Centro de custo    | `cost_center`        | Frente de negócio à qual um custo pertence: gado, café, lavoura eventual ou pessoal.                                                              |

## Café

| Termo             | Código              | Definição e regra                                                                                                                                            |
| ----------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Saca              | `bag`               | Unidade de 60 kg de café beneficiado. **Regra:** todo volume de café é armazenado em kg e apresentado em sacas.                                              |
| Custo por hectare | `cost_per_hectare`  | Custo total do talhão na safra ÷ área em ha.                                                                                                                 |
| Custo por saca    | `cost_per_bag`      | Custo total do talhão na safra ÷ sacas colhidas. **Regra:** só é definitivo após o fechamento da colheita da safra.                                          |
| Aplicação         | `application`       | Evento de aplicação de insumo num talhão, com data, produto, dose e responsável.                                                                             |
| Trato cultural    | `cultural_practice` | Operação de manejo que não é aplicação de insumo (arruação, esparramação, desbrota, poda).                                                                   |
| Adubação          | `fertilization`     | Categoria de insumo: fertilizante de solo.                                                                                                                   |
| Foliar            | `foliar`            | Categoria de insumo: nutrição aplicada na folha.                                                                                                             |
| Herbicida         | `herbicide`         | Categoria de insumo: controle de plantas daninhas.                                                                                                           |
| Defensivo         | `pesticide`         | Categoria de insumo: fungicida, inseticida, acaricida. **Regra:** o sistema registra o que foi aplicado; nunca recomenda produto nem dose (constitution §7). |
| Colheita          | `harvest`           | Evento de retirada do café do talhão, com data, volume e % de maduros.                                                                                       |
| Maturação         | `maturity`          | Estádio do fruto: `green` (verde), `cherry` (cereja), `raisin` (passa), `dry` (seco).                                                                        |
| Secagem           | `drying`            | Processo de redução de umidade. Método: `patio` (terreiro) ou `mechanical` (secador).                                                                        |
| Tulha / armazém   | `warehouse`         | Local de guarda do café beneficiado.                                                                                                                         |
| Lote de café      | `coffee_lot`        | Quantidade de café rastreada como unidade, do talhão à venda. **Regra:** um lote guarda talhão de origem, colheita e secagem (rastreabilidade, Fase 2).      |
| Bebida            | `cup_quality`       | Classificação sensorial: mole, apenas mole, dura, riada, rio.                                                                                                |
| Tipo              | `coffee_type`       | Classificação oficial por defeitos (Tipo 2 a Tipo 8).                                                                                                        |
| Defeitos          | `defects`           | Contagem de grãos defeituosos na amostra: pretos, ardidos, verdes, brocados, quebrados.                                                                      |
| Peneira           | `screen_size`       | Classificação por tamanho de grão (13 a 19).                                                                                                                 |

## Gado

| Termo                        | Código                  | Definição e regra                                                                                                                                                        |
| ---------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Lote de gado                 | `cattle_lot`            | Conjunto de animais comprados e gerenciados como unidade. **Regra:** a margem é apurada por cabeça **e** por lote.                                                       |
| Animal                       | `animal`                | Cabeça individual, rastreada por brinco.                                                                                                                                 |
| Brinco                       | `ear_tag`               | Identificador físico do animal. **Regra:** único dentro da organização; pode ser reutilizado após a saída do animal, com histórico preservado.                           |
| Novilha                      | `heifer`                | Fêmea jovem que ainda não pariu. Principal mercadoria da frente de gado.                                                                                                 |
| Prenhez                      | `pregnancy`             | Estado de gestação do animal. Status: `open` (vazia), `suspected` (a confirmar), `confirmed` (prenha).                                                                   |
| IATF                         | `fixed_time_ai`         | Inseminação artificial em tempo fixo. **Regra:** é um evento com custo (protocolo hormonal, sêmen, mão de obra) atribuído ao animal.                                     |
| Diagnóstico de gestação      | `pregnancy_check`       | Evento de confirmação de prenhez, com data, método e resultado.                                                                                                          |
| GTA                          | `animal_transit_permit` | Guia de Trânsito Animal. **Regra:** obrigatória em toda entrada, saída e transferência entre fazendas; número e data são armazenados.                                    |
| Transferência entre fazendas | `farm_transfer`         | Movimentação de animais de uma fazenda para outra. **Regra:** gera custo de frete e GTA, e **não** encerra a apuração de margem do animal — ela segue da compra à venda. |
| Giro                         | `turnover_days`         | Dias entre a entrada e a saída do animal ou do lote.                                                                                                                     |
| Margem por cabeça            | `margin_per_head`       | Preço de venda − (preço de compra + custos atribuídos + rateio).                                                                                                         |
| Custo por dia                | `cost_per_day`          | Custo acumulado do animal ÷ dias na fazenda.                                                                                                                             |
| Quebra de peso               | `weight_shrink`         | Perda de peso entre a pesagem de saída e a de chegada. **Regra:** entra no cálculo de preço líquido da venda.                                                            |

## Lavouras eventuais

| Termo                          | Código                   | Definição e regra                                                                                                                                                                                                                      |
| ------------------------------ | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lavoura eventual               | `temporary_crop`         | Plantio de ciclo definido, com data de início e de fim (milho para silagem ou grão).                                                                                                                                                   |
| Silagem                        | `silage`                 | Volumoso produzido da lavoura e consumido pelo gado.                                                                                                                                                                                   |
| Transferência interna de custo | `internal_cost_transfer` | Movimento que tira o custo de uma frente e coloca em outra sem que haja dinheiro envolvido. **Regra:** silagem consumida pelo gado sai do custo da lavoura e entra no custo do gado, pelo custo de produção, não por preço de mercado. |

## Financeiro e fiscal

| Termo            | Código              | Definição e regra                                                                                                                                                                    |
| ---------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Lançamento       | `transaction`       | Registro financeiro de entrada ou saída. **Regra:** sempre com duas datas (constitution §5).                                                                                         |
| Competência      | `accrual_date`      | Data à qual o custo pertence economicamente (define safra, talhão, lote).                                                                                                            |
| Caixa            | `cash_date`         | Data em que o dinheiro efetivamente entrou ou saiu. Base do livro caixa e do LCDPR.                                                                                                  |
| Rateio           | `allocation`        | Distribuição de um custo compartilhado. **Regra:** dois níveis — primeiro entre fazendas, depois entre frentes dentro da fazenda. O critério de cada nível é explícito e versionado. |
| Participante     | `counterparty`      | Pessoa física ou jurídica do outro lado do lançamento, identificada por CPF ou CNPJ. **Regra:** obrigatório no LCDPR.                                                                |
| Conta bancária   | `bank_account`      | Conta usada nos lançamentos de caixa. **Regra:** vinculada à fazenda para o LCDPR.                                                                                                   |
| LCDPR            | `lcdpr`             | Livro Caixa Digital do Produtor Rural. **Regra:** regime de **caixa**, por imóvel, com participantes e contas bancárias; layout definido pela Receita Federal.                       |
| Folhamatic       | `folhamatic`        | Sistema de folha de pagamento (IOB) usado pelo escritório contábil. **Regra:** integração por arquivo texto; Fase 2.                                                                 |
| Plano de contas  | `chart_of_accounts` | Estrutura de contas contábeis acordada com o contador.                                                                                                                               |
| De-para contábil | `account_mapping`   | Tradução entre a categoria do sistema e a conta do plano de contas do escritório.                                                                                                    |

## Vendas e logística

| Termo                     | Código                | Definição e regra                                                                                                                        |
| ------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Condição de entrega       | `delivery_terms`      | Quem entrega e onde: retirada na fazenda, entrega na cooperativa, entrega em armazém.                                                    |
| Destino                   | `destination`         | Local de entrega, com distância em km.                                                                                                   |
| Preço líquido na porteira | `net_farm_gate_price` | Preço da proposta − frete − taxas − quebra de peso. **Regra:** é o número que decide a venda; o preço bruto nunca é apresentado sozinho. |

## Mapas e satélite

| Termo          | Código        | Definição e regra                                                                                                                                                     |
| -------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NDVI           | `ndvi`        | Índice de vegetação por diferença normalizada; proxy de vigor. Fase 2.                                                                                                |
| Vigor          | `vigor`       | Leitura do NDVI apresentada ao usuário em faixas: alto, médio, baixo, crítico.                                                                                        |
| Pacote de mapa | `map_package` | Arquivo **PMTiles** com o mapa base de uma fazenda, baixado para uso offline. **Regra:** gerado do Sentinel-2; nunca de tiles do Google ou Mapbox (constitution §10). |

## Acesso e fluxo

| Termo               | Código           | Definição e regra                                                                                                                             |
| ------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Dono                | `owner`          | Acesso total a todas as fazendas, incluindo o consolidado do grupo.                                                                           |
| Gerente             | `manager`        | Acesso total a todas as fazendas; lança, edita, aprova e gera relatórios.                                                                     |
| Operador            | `operator`       | Acesso apenas às fazendas onde está alocado e apenas ao operacional. **Regra:** nunca recebe valor, custo, margem ou preço (constitution §6). |
| Alocação            | `assignment`     | Vínculo de um usuário operador a uma fazenda.                                                                                                 |
| A revisar           | `pending_review` | Estado de um lançamento feito por operador que aguarda conferência do gerente.                                                                |
| Pendente (sync)     | `pending_sync`   | Estado local de um registro que ainda não foi confirmado pelo servidor. Não confundir com `pending_review`.                                   |
| Histórico importado | `imported`       | Registro originado das planilhas antigas. **Regra:** `source = 'import'` e referência ao lote de importação (constitution §11).               |
