---
name: postgis-mapas
description: Geometria de talhões, cálculo de área, MapLibre, geração de PMTiles a partir do Sentinel-2 e publicação no R2. Use ao modelar ou consultar coluna de geometria, calcular área de talhão, implementar tela de mapa, gerar ou atualizar pacote de mapa offline, ou ao lidar com projeção e SRID.
---

# PostGIS, mapas e pacote offline

Base: ADR-0005 (PostGIS) e ADR-0007 (mapa base próprio do Sentinel-2).

## SRID — a pegadinha número um

- **Armazene em 4326** (WGS 84, graus). Declare na coluna:
  `geometry(Polygon, 4326)`. Coluna sem SRID declarado não passa em revisão.
- **`ST_Area` em 4326 devolve graus quadrados**, que não significam nada. Nunca use
  direto.
- Para área correta, duas opções:

```sql
-- 1. cast para geography (metros, bom o bastante para talhão)
SELECT ST_Area(geom::geography) / 10000.0 AS area_ha FROM plots WHERE id = $1;

-- 2. reprojetar para UTM local (SIRGAS 2000 / UTM 23S, cobre o Sul de Minas)
SELECT ST_Area(ST_Transform(geom, 31983)) / 10000.0 AS area_ha FROM plots WHERE id = $1;
```

A diferença entre as duas fica abaixo de 0,1% em talhão de dezenas de hectares. Use
`geography` por padrão; use 31983 quando a precisão for contratual.

- **Hectares = m² ÷ 10.000.** Área de talhão é **sempre derivada da geometria**, nunca
  digitada (`specs/glossario.md`).

## Modelagem

```sql
CREATE TABLE plots (
  id               uuid PRIMARY KEY,           -- v7, do cliente
  organization_id  uuid NOT NULL,
  farm_id          uuid NOT NULL,
  name             text NOT NULL,
  geom             geometry(Polygon, 4326) NOT NULL,
  -- ... colunas obrigatórias de .claude/rules/db.md
  CONSTRAINT plots_geom_valid CHECK (ST_IsValid(geom))
);
CREATE INDEX plots_geom_gix ON plots USING GIST (geom);
CREATE INDEX plots_scope_idx ON plots (organization_id, farm_id);
```

- Índice **GiST** em toda coluna de geometria.
- Valide com `ST_IsValid` na entrada. Polígono inválido é **rejeitado com erro de
  domínio**, não corrigido em silêncio (`ST_MakeValid` muda a área sem avisar ninguém).
- Talhão que mudou de área guarda **histórico**: o custo usa a área vigente na data de
  competência.

## Consultas úteis

```sql
-- área total em café por fazenda
SELECT farm_id, SUM(ST_Area(geom::geography)) / 10000.0 AS area_ha
FROM plots WHERE organization_id = $1 AND deleted_at IS NULL GROUP BY farm_id;

-- talhão que contém um ponto (lançamento tocando no mapa)
SELECT id, name FROM plots
WHERE organization_id = $1 AND farm_id = ANY($2)
  AND ST_Contains(geom, ST_SetSRID(ST_MakePoint($3, $4), 4326));

-- bounding box da fazenda, para enquadrar o mapa
SELECT ST_AsGeoJSON(ST_Envelope(ST_Collect(geom))) FROM plots WHERE farm_id = $1;
```

Toda consulta filtra por `organization_id` e pelas fazendas do escopo.

## MapLibre no cliente

- **MapLibre GL** (BSD-3), lendo **PMTiles** direto via protocolo `pmtiles://`.
- Raster de fundo = PMTiles do pacote de mapa. Vetores de talhão vêm do **Dexie**,
  desenhados por cima como GeoJSON.
- Offline: o PMTiles é baixado uma vez por fazenda e guardado pelo app. A tela de mapa
  precisa funcionar **inteira** sem rede.
- Atribuição obrigatória e visível: **"Contains modified Copernicus Sentinel data"**.
- Toque no talhão abre o lançamento. Alvo de toque generoso — o usuário está de luva.

## Pacote de mapa (PMTiles)

Pipeline (manual na Fase 1, job Python na Fase 2):

1. Selecionar a cena **Sentinel-2** com menor cobertura de nuvem na janela desejada.
2. Compor em cor verdadeira (bandas B04, B03, B02), ajustar contraste.
3. Recortar pelo envelope da fazenda, com folga.
4. Gerar pirâmide de tiles e empacotar em **PMTiles**.
5. Publicar no **R2**, com `Cache-Control: public, max-age=86400` e ETag.
6. Registrar no banco: fazenda, data da cena, tamanho, URL, checksum.

O app oferece o download do pacote por fazenda e mostra o tamanho antes de baixar.

## Licenças — leia antes de mudar de fonte

- **Sentinel-2 / Copernicus:** licença aberta, **atribuição obrigatória**. É a nossa base.
- **Proibido** cachear tile de Google Maps, Mapbox ou Bing — os termos de uso vedam cache
  offline, e o uso aqui é comercial (constitution §10).
- **OpenStreetMap** (ODbL) pode entrar como camada vetorial complementar, com atribuição.
  Não substitui a imagem de satélite: o usuário identifica o talhão pela mancha do
  cafezal.

Resolução do Sentinel-2 é de **10 m/pixel**. Suficiente para o talhão; insuficiente para
ver planta individual. Se alguém pedir mais resolução, a conversa é sobre imagem aérea
contratada, e é decisão de custo.
