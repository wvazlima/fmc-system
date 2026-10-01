# Levantamento normativo — 2026-09-30

Das **109 dúvidas abertas** nas features `016` a `031`, **27** tinham componente de
fato público: a resposta é a mesma para qualquer produtor rural e está em norma,
metodologia publicada ou catálogo de fornecedor. As outras **82** dependem da operação
do cliente e nenhuma pesquisa responde.

Este documento levanta as 27. Ele **não fecha dúvida nenhuma**.

> **Como usar.** Isto é insumo para a conversa com o contador e com o produtor, não
> fonte de regra. Nada daqui entra em spec como número fixo — a `030` foi escrita de
> propósito sem um único parâmetro tributário, e continua assim. O efeito pretendido é
> trocar *"qual é o limite?"* por *"o limite é X; nós passamos disso?"*.
>
> **Validade.** Levantado em **2026-09-30**, em fontes secundárias na maior parte.
> Matéria tributária em transição muda rápido. Confirme na norma antes de agir.

---

## 1. LCDPR — a obrigação existe e tem prazo correndo

| Achado                                                                               | Efeito |
| ------------------------------------------------------------------------------------ | ------ |
| Obrigatório para produtor rural PF com **receita bruta anual acima de R$ 4,8 milhões** da atividade rural. Instituído pela **IN RFB 1.848/2018**, alterada depois (IN RFB 2.072/2022). | O produtor falou em "mais de 4 milhões". O número é **4,8**, não 4. |
| Em 2026, a entrega é obrigatória para quem teve receita ≥ R$ 4,8 milhões **no ano anterior**. Janela de entrega: **23/03/2026 a 31/05/2026**. | Se a obrigação já se aplica, há **prazo legal correndo** e a feature `029` sobe de prioridade. |
| Leiaute na **versão 1.3**, com os registros `0000` (CPF), `0010` (parâmetros), `0030` (cadastro), `0040` (imóveis rurais), `0050` (contas bancárias), `Q100` (lançamentos), `Q200` (resultado) e `9999`. | Confirma o desenho da `029`: livro **por imóvel** (`0040`), com **conta bancária** (`0050`) e participante em cada lançamento (`Q100`). |
| No `Q100`, a conta pelo qual o recurso transitou usa códigos reservados: **`000` para pagamento em espécie** e **`999` para recurso em trânsito**. | Responde parcialmente a dúvida 5 da `029`: existe tratamento para despesa fora de conta bancária. |

**Continua aberto, e só o contador responde:** se as cinco fazendas ultrapassam o
limite; se ele é por CPF do produtor ou por imóvel; quem entrega hoje e com qual
sistema; se há prazo em curso agora.

Fontes: [Receita Federal — manual de preenchimento do LCDPR 1.3](https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/declaracoes-e-demonstrativos/lcdpr-livro-caixa-digital-do-produtor-rural/manual-de-preenchimento-do-lcdpr-1-3) ·
[Receita Federal — perguntas e respostas (PDF)](https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/declaracoes-e-demonstrativos/lcdpr-livro-caixa-digital-do-produtor-rural/perguntas-e-respostas-livro-caixa-digital-do-produtor-rural-lcdpr.pdf) ·
[Senior — prazos 2026](https://www.senior.com.br/blog/lcdpr-prazos-de-entrega-e-obrigacoes-fiscais-para-2026) ·
[Alterdata — configuração de contas Q100](https://ajuda.alterdata.com.br/bdcc/lcdpr-como-configurar-contas-q100-107065298.html)

---

## 2. IBS e CBS — o limite é R$ 3,6 milhões, e não é o mesmo do LCDPR

| Achado                                                                               | Efeito |
| ------------------------------------------------------------------------------------ | ------ |
| Pela **LC 214/2025**, o produtor rural (PF ou PJ) com receita **inferior a R$ 3,6 milhões** no ano-calendário **não é contribuinte** de IBS e CBS. O valor é corrigido anualmente pelo IPCA. | **São dois limites diferentes**: R$ 3,6 mi define contribuinte de IBS/CBS; R$ 4,8 mi obriga o LCDPR. Dá para estar obrigado a um e não ao outro. |
| O produtor **não contribuinte gera crédito presumido** ao vender para adquirente contribuinte (art. 168 da LC 214/2025). O percentual é apurado pelo Comitê Gestor do IBS e pela Receita. | Confirma a dúvida 3 da `030`: o enquadramento **afeta o preço negociado**, porque muda o que o comprador aproveita. Entra no comparativo da `011`. |
| **Diferimento nos insumos:** ao comprar fertilizante ou semente, o tributo não é cobrado na nota — é adiado para a etapa seguinte. Para o produtor **contribuinte**, isso significa tributação na saída **sem crédito correspondente**. Para o **não contribuinte**, o montante diferido é **descontado do crédito presumido** repassado ao comprador. | Achado que não estava em nenhuma spec e **muda a feature `018`**: o custo de aquisição do insumo e o efeito no caixa dependem do enquadramento. Também reforça a `031`. |
| Cronograma: **2026** fase de teste (0,9% CBS + 0,1% IBS, com dispensa de recolhimento para quem cumpre as acessórias); **2027** CBS cheia e extinção de PIS/COFINS; **2029–2032** transição ICMS/ISS → IBS; **2033** regime pleno. | A `030` está certa ao tratar parâmetro como dado versionado por vigência: há **oito anos** de números mudando. |

**Continua aberto, e só o contador responde:** se o produtor ultrapassa R$ 3,6 mi, por
imóvel ou no total; qual regime adotar; o que muda na venda para cooperativa; quais
acessórias aparecem e quem entrega; se vale avaliar PF × PJ.

Fontes: [LC 214/2025, art. 164](https://normas.leg.br/?urn=urn%3Alex%3Abr%3Afederal%3Alei.complementar%3A2025-01-16%3B214%21art164) ·
[ConJur — produtor rural e os créditos presumidos](https://www.conjur.com.br/2025-dez-18/o-produtor-rural-e-os-creditos-presumidos-na-reforma-tributaria/) ·
[ConJur — diferimento de IBS e CBS de insumos agrícolas](https://www.conjur.com.br/2026-jan-17/diferimento-de-ibs-e-cbs-de-insumos-agricolas-a-conta-vai-ficar-para-o-produtor-rural/) ·
[APET — crédito presumido na cadeia do agronegócio](https://apet.org.br/artigos/credito-presumido-na-cadeia-do-agronegocio-para-ibs-cbs-a-lei-complementar-214-25-parte-2/) ·
[CLM Controller — cronograma 2026–2033](https://clmcontroller.com.br/reforma-tributaria/cronograma-da-reforma-tributaria-linha-do-tempo-completa/)

---

## 3. Funrural — a alíquota mudou em abril de 2026

| Achado                                                                               | Efeito |
| ------------------------------------------------------------------------------------ | ------ |
| Com a **LC 224/2025**, desde **1º de abril de 2026** a alíquota total passou a **1,63%** para produtor PF não enquadrado como segurado especial (era 1,5%), e **2,23%** para PJ. | A spec `024` foi **corrigida**: o exemplo usava 1,5%. |
| Na venda em leilão a **sub-rogação se mantém no comprador** — frigorífico, cooperativa ou casa de leilão retém e recolhe. | Responde a dúvida 6 da `024`: no leilão, **a casa retém**. O líquido já chega descontado, e o sistema precisa registrar a retenção como dedução, não como imposto a pagar. |

**Continua aberto:** confirmar com o contador o enquadramento exato do produtor
(segurado especial ou não) e a base de cálculo aplicada nas vendas dele.

Fontes: [AgroDoc — LC 224/2025, Funrural pecuária](https://agrodocai.com.br/lc-224-2025-funrural-pecuaria) ·
[Aegro — Funrural 2026](https://aegro.com.br/blog/funrural-2026/) ·
[Famato — novas alíquotas a partir de abril de 2026](https://sistemafamato.org.br/blog/2026/04/09/funrural-tera-novas-aliquotas-a-partir-de-abril-de-2026-famato-orienta-produtores/)

---

## 4. Cotações — o CEPEA é não comercial, e isso resolve a questão

| Achado                                                                               | Efeito |
| ------------------------------------------------------------------------------------ | ------ |
| Os indicadores CEPEA/ESALQ (boi gordo CEPEA/B3, café) são publicados sob **Creative Commons BY-NC 4.0** — **atribuição, uso não comercial**. Uso comercial ou redistribuição em produto pago exige licença junto ao CEPEA. | Confirma a constitution §10 na prática: **nosso uso é comercial**, logo o dado não entra sem contrato. A `023` já foi escrita assim. |
| O indicador do café é em **R$ por saca de 60 kg**, cotado em São Paulo; o do boi gordo é média diária ponderada do estado de São Paulo, ambos ajustados pela taxa CDI do prazo de pagamento. | A referência de São Paulo **não é o preço na porteira do Sul de Minas**: existe diferencial de praça. Reforça a dúvida 6 da `023`. |
| **Câmbio tem alternativa pública e gratuita:** a API PTAX do Banco Central (`olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/`) publica cotação diária em JSON/XML/CSV sob **Open Database License (ODbL)**. | **Responde a dúvida 7 da `023`**: dá para ter câmbio oficial sem licença paga. Falta só respeitar a atribuição da ODbL. |

**Continua aberto:** se há disposição a pagar licença do CEPEA; qual referência ele usa
hoje de fato; se o preço da cooperativa serve; qual o diferencial da praça dele.

Fontes: [CEPEA — indicador boi gordo](https://www.cepea.org.br/br/indicador/boi-gordo.aspx) ·
[CEPEA — indicador café](https://cepea.org.br/br/indicador/cafe.aspx) ·
[CEPEA — metodologia do indicador boi gordo CEPEA/B3 (PDF)](https://www.cepea.org.br/upload/kceditor/files/Cepea_B3_Metodologia_Indicador_BOI_02_01_2020.pdf) ·
[Banco Central — API de taxas de câmbio, dados abertos](https://dadosabertos.bcb.gov.br/dataset/taxas-de-cambio-todos-os-boletins-diarios)

---

## 5. Umidade do café — a faixa existe e confirma o problema relatado

| Achado                                                                               | Efeito |
| ------------------------------------------------------------------------------------ | ------ |
| A umidade de armazenamento do café beneficiado é mantida entre **11% e 12%**; para beneficiamento, a referência citada é 10,5% a 11,5%. | Dá uma faixa de partida para a `019`, até o produtor informar a praticada na venda dele. |
| **Acima de 12%**, risco de fungos e perda de qualidade na estocagem. **Abaixo de 10%**, o café **perde peso** — prejuízo financeiro direto — fica quebradiço e compromete a torra. | Confirma exatamente o que o produtor descreveu: *"se fica estocado por muito tempo ele perde umidade e consequentemente peso, gerando prejuízo"*. A `019` está tratando um problema real, com as duas pontas do risco. |

**Continua aberto:** a faixa acordada na venda dele, o deságio por ponto, quem mede e
com que aparelho.

Fontes: [Embrapa — Circular Técnica 34, obtenção de café com qualidade (PDF)](https://www.infoteca.cnptia.embrapa.br/bitstream/doc/495398/1/cirtec34.pdf) ·
[Cooxupé — umidade do café e qualidade da bebida](https://hubdocafe.cooxupe.com.br/umidade-do-cafe-interfere-na-qualidade-da-bebida/) ·
[Café Point — armazenamento de café](https://www.cafepoint.com.br/noticias/tecnicas-de-producao/armazenamento-de-cafe-preservacao-da-qualidade-que-vem-do-campo-34893/)

---

## 6. Rastreamento de gado — a ordem de grandeza do custo

| Achado                                                                               | Efeito |
| ------------------------------------------------------------------------------------ | ------ |
| Brinco eletrônico **passivo** (só identificação, RFID): ordem de **R$ 6,50 por animal**. | É barato e resolve o problema real — leitura sem digitação no curral. |
| Brinco **conectado** com GPS: ordem de **R$ 45 por unidade + mensalidade**, em oferta de mercado citada; colar inteligente na casa de **R$ 499**. Soluções com 4G NB-IoT, eSIM, GPS e RFID. | Com giro de **100 a 300 animais por mês**, rastreador conectado em todo o rebanho não fecha: o animal fica poucos meses e o dispositivo precisa ser recuperado e reaproveitado — o que a `028` já previu. |
| Conectividade depende de **4G/NB-IoT** no pasto; há soluções satelitais para onde não há cobertura, em outro patamar de custo. | A dúvida 4 da `028` (cobertura de celular no pasto) é decisiva: ela separa "viável" de "caro demais". |

**Leitura:** a `028` separa bem as duas coisas. **Brinco eletrônico é fundação e paga a
conta sozinho** pela digitação economizada; **GPS é condicional** e só se justifica para
matriz ou animal de alto valor.

**Continua aberto:** se todo animal já tem brinco; se é visual ou eletrônico; se há
bastão leitor; cobertura no pasto; se existe balança com saída de dados — que, pelo
volume de digitação, pode valer mais que o GPS.

Fontes: [MobileTime — iBoi, brinco bovino com NB-IoT](https://www.mobiletime.com.br/noticias/07/10/2024/iboi/) ·
[Forbes Agro — rastreamento em tempo real no manejo de gado](https://forbes.com.br/forbes-agro/2025/05/com-ia-e-rastreamento-em-tempo-real-startup-quer-reinventar-o-manejo-de-gado-no-brasil/) ·
[Digital Agro — brinco solar com conexão via satélite](https://digitalagro.com.br/2021/08/24/brinco-movido-a-luz-do-sol-monitora-gado-e-os-conecta-via-satelite/)

---

## O que este levantamento mudou nas specs

| Spec  | Mudança                                                                                      |
| ----- | -------------------------------------------------------------------------------------------- |
| `024` | Funrural do exemplo corrigido de 1,5% para **1,63%** (LC 224/2025); líquido recalculado. Dúvida 6 passou a perguntar o **enquadramento**, não a alíquota. |
| `023` | Dúvida 7 **respondida**: PTAX do Banco Central, ODbL, gratuita. Dúvida 3 agora cita o CC BY-NC do CEPEA.  |
| `019` | Dúvida 2 agora parte da faixa de 11–12% em vez de perguntar do zero.                         |
| `029` | Dúvidas 1, 4 e 6 viraram perguntas de confirmação, com o número e a norma na frente.         |
| `030` | Dúvidas 2 e 4 idem. **Nenhum parâmetro entrou na spec** — segue sem números, por decisão.    |
| `018` | Dúvida nova: efeito do **diferimento** de IBS/CBS no caixa da compra de insumo.               |
