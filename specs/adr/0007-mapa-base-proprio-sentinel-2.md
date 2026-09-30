# ADR-0007 · Mapa base próprio gerado do Sentinel-2

|               |            |
| ------------- | ---------- |
| **Data**      | 2026-09-29 |
| **Estado**    | aceito     |
| **Substitui** | —          |

## Contexto

O app precisa mostrar os talhões desenhados sobre imagem de satélite, **e esse mapa
precisa funcionar offline** — é justamente no meio da lavoura, sem sinal, que ele é
usado.

Este é um produto **comercial**. Os termos de uso do Google Maps, do Mapbox e do Bing
**proíbem o cache offline de tiles**. Não há plano pago que libere isso de forma
trivial, e violar termo de uso expõe o cliente.

## Decisão

Geramos **mapa base próprio** a partir das imagens **Sentinel-2 (Copernicus)**, que têm
licença aberta com atribuição obrigatória.

- Um job (Python, Fase 2; recorte manual na Fase 1) baixa as cenas, faz composição em
  cor verdadeira, recorta pela área de cada fazenda e gera um arquivo **PMTiles**.
- O PMTiles é publicado no **R2** e baixado pelo app como **pacote de mapa** por fazenda.
- Renderização no cliente com **MapLibre GL** (BSD-3), lendo o PMTiles direto.
- Atribuição "Contains modified Copernicus Sentinel data" visível no mapa.
- Vetores de talhão vêm do Postgres via sync, desenhados por cima do raster.

## Alternativas consideradas

### Google Maps ou Mapbox como base

- **A favor:** qualidade e resolução superiores, integração trivial.
- **Contra:** **cache offline proibido** pelos termos de uso.
- **Por que não:** o offline é requisito, não conforto. E violar licença é proibido pela
  constitution §10.

### OpenStreetMap raster

- **A favor:** licença aberta (ODbL), tiles prontos.
- **Contra:** não é imagem de satélite. O usuário identifica o talhão pela mancha do
  cafezal, não pela linha da estrada.
- **Por que não:** não resolve o problema visual. Fica como camada complementar
  opcional.

### Imagem aérea contratada (drone ou provedor comercial)

- **A favor:** resolução muito maior.
- **Contra:** custo por hectare e por revisita, para 5 fazendas.
- **Por que não:** caro demais para a Fase 1. Continua possível como upgrade por fazenda.

## Consequências

**Positivas**

- Offline legítimo, sem risco jurídico.
- Sem custo por tile ou por visualização — só armazenamento e egress (zero no R2).
- A mesma pipeline serve o NDVI da Fase 2: as cenas já estão sendo baixadas.

**Negativas e custos aceitos**

- Resolução de 10 m/pixel. Suficiente para identificar talhão; insuficiente para ver
  planta individual.
- Precisamos manter a pipeline de geração e o processo de atualização das cenas.
- Cobertura de nuvem exige escolher a melhor cena da janela.

**O que passa a ser proibido**

- Cachear tile de Google, Mapbox ou Bing, em qualquer camada.
- Publicar o mapa sem a atribuição do Copernicus.

## Como verificar que a decisão está sendo respeitada

Skill `postgis-mapas`; `.claude/rules/infra.md`; agente `integracoes` na checagem de
licença; revisão de toda dependência nova de mapa.
