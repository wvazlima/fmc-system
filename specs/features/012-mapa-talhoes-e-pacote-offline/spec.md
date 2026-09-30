# 012 · Mapa de talhões e pacote offline

|                        |                                  |
| ---------------------- | -------------------------------- |
| **Estado**             | rascunho                         |
| **Fase**               | 1                                |
| **Depende de**         | `007-cafe-talhoes-e-safras`      |
| **Princípios em jogo** | constitution §1, §3, §8, §9, §10 |

---

## Problema

O talhão é a unidade de custo do café, mas hoje ele é só um nome numa célula. Não há
desenho, não há área confiável, e a área é o denominador de quase todo indicador: custo
por hectare, sacas por hectare, dose por hectare.

Além disso, o lançamento no campo depende de o funcionário escolher o talhão certo numa
lista de nomes parecidos. Tocar no mapa é muito mais rápido e erra menos — **desde que
o mapa funcione sem sinal**, que é justamente onde ele é usado.

Há uma restrição dura: o uso é comercial, e os termos do Google Maps, Mapbox e Bing
**proíbem cache offline de tiles** (constitution §10). O mapa base tem que ser nosso.

## Usuários e perfis afetados

| Perfil   | O que passa a fazer                                              | O que **não** pode ver        |
| -------- | ---------------------------------------------------------------- | ----------------------------- |
| Dono     | Vê os talhões desenhados e a área real de cada um                | —                             |
| Gerente  | Desenha e ajusta talhões; baixa o pacote de mapa de cada fazenda | —                             |
| Operador | Abre o mapa offline e lança tocando no talhão                    | Custo ou valor sobre o talhão |

## Histórias

- Como **gerente**, quero desenhar o polígono de cada talhão sobre a imagem de satélite
  e que a área em hectares saia sozinha.
- Como **operador**, quero abrir o mapa no meio do cafezal, sem sinal, e lançar tocando
  no talhão onde estou.
- Como **gerente**, quero baixar o pacote de mapa de uma fazenda por Wi-Fi, sabendo o
  tamanho antes.
- Como **dono**, quero ver a área total em café de cada fazenda.

## Critérios de aceite

### CA-01 · Desenhar o talhão

- **Dado** o mapa da fazenda aberto
- **Quando** o gerente desenha um polígono e o associa a um talhão
- **Então** a geometria é gravada em **SRID 4326**
- **E** polígono inválido (auto-interseção) é **rejeitado** com mensagem clara, não
  corrigido em silêncio

### CA-02 · Área calculada, não digitada

- **Dado** um talhão com geometria
- **Quando** a área é exibida
- **Então** ela é calculada pelo banco a partir do polígono, em hectares
- **E** não existe campo editável de área
- **E** o valor bate com a medição em campo dentro de uma tolerância acordada
  (ver dúvida 3)

### CA-03 · Lançar tocando no talhão

- **Dado** o mapa aberto, com ou sem sinal
- **Quando** o operador toca dentro de um talhão
- **Então** abre o lançamento já com o talhão preenchido
- **E** o alvo de toque é generoso o bastante para uso com luva

### CA-04 · Pacote de mapa offline

- **Dado** uma fazenda com pacote de mapa publicado
- **Quando** o gerente abre a tela de pacotes
- **Então** vê o tamanho em MB e a data da imagem **antes** de baixar
- **E** após o download, o mapa daquela fazenda funciona **inteiramente** sem rede

### CA-05 · Mapa base é próprio

- **Dado** o mapa exibido no app
- **Quando** ele carrega
- **Então** o raster vem de **PMTiles gerados do Sentinel-2**, servidos pelo R2
- **E** a atribuição "Contains modified Copernicus Sentinel data" está visível
- **E** **nenhum** tile de Google, Mapbox ou Bing é requisitado ou cacheado
  (constitution §10, ADR-0007)

### CA-06 · Vetores vêm do banco local

- **Dado** o mapa aberto offline
- **Quando** os talhões são desenhados
- **Então** os polígonos vêm do **Dexie**, não de requisição de rede
- **E** um talhão criado offline aparece no mapa antes de sincronizar

### CA-07 · Histórico de área

- **Dado** um talhão cuja geometria foi alterada
- **Quando** a mudança é salva
- **Então** a geometria anterior é preservada com sua vigência
- **E** um custo com competência anterior continua usando a área daquela época
  (feature `007`, CA-07)

### CA-OFF · Cenário offline

- **Dado** que o operador está no meio do cafezal, sem sinal, com o pacote da fazenda
  já baixado
- **Quando** abre o mapa e toca num talhão para lançar
- **Então** o mapa renderiza, o talhão é identificado e o lançamento é gravado
  localmente
- **E** nada disso faz uma única requisição de rede

### CA-OP · Cenário de operador

- **Dado** um operador alocado na fazenda A
- **Quando** ele abre o mapa
- **Então** vê os talhões da fazenda A com nome e área
- **E** não recebe custo, valor ou qualquer indicador financeiro sobre o talhão
- **E** não vê talhões da fazenda B, nem no mapa nem no banco local

## Regras de negócio

1. Geometria em **SRID 4326**, com índice **GiST** (`.claude/rules/db.md`).
2. Área em hectares calculada com `ST_Area(geography)` ou reprojeção para **EPSG
   31983**; nunca `ST_Area` direto em 4326 (skill `postgis-mapas`).
3. Polígono inválido é **rejeitado**; `ST_MakeValid` muda a área sem avisar.
4. **Área é sempre derivada da geometria**, nunca digitada.
5. Mapa base gerado do **Sentinel-2 / Copernicus**, publicado como PMTiles no R2, com
   atribuição obrigatória (ADR-0007).
6. **Proibido** cache offline de tiles de Google, Mapbox ou Bing (constitution §10).
7. Renderização com **MapLibre GL** (BSD-3); vetores de talhão vêm do Dexie.
8. R2 guarda **só** PMTiles (constitution §9).
9. Geometria alterada preserva o histórico com vigência.
10. Operador nunca recebe valor (constitution §6).

## Fora de escopo

- NDVI e vigor por satélite — Fase 2 (a mesma pipeline de cenas serve aos dois).
- Rastreamento de GPS do funcionário.
- Importação de KML ou shapefile do CAR — avaliar depois; hoje o desenho é manual.
- Mapa de gado por pasto e rotação de pastagem.
- Geração automatizada dos PMTiles: na Fase 1 o recorte é manual; o job Python é da
  Fase 2.

## Dúvidas abertas

| #   | Dúvida                                                                                                      | Para quem | Estado |
| --- | ----------------------------------------------------------------------------------------------------------- | --------- | ------ |
| 1   | Já existe o desenho dos talhões em algum lugar (CAR, agrônomo, KML)? Isso evitaria desenhar tudo à mão.     | produtor  | aberta |
| 2   | Qual a área total aproximada de cada fazenda? Dimensiona o tamanho do pacote PMTiles.                       | produtor  | aberta |
| 3   | Qual tolerância de erro é aceitável na área? A resolução do Sentinel-2 é de 10 m/pixel.                     | produtor  | aberta |
| 4   | A área declarada hoje na planilha é medida ou estimada? Vamos ter divergência e precisamos saber qual vale. | produtor  | aberta |
| 5   | Os aparelhos têm espaço para o pacote de mapa de mais de uma fazenda?                                       | produtor  | aberta |
| 6   | Com que frequência a imagem de satélite precisa ser atualizada na Fase 1? Uma vez basta?                    | produtor  | aberta |
