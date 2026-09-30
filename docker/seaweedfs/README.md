# SeaweedFS — stand-in local de Cloud Storage e R2

Em produção, mídia (foto e áudio) fica no **Cloud Storage** e os pacotes de mapa
(PMTiles) ficam no **R2**. No local, os dois são buckets num **SeaweedFS** com API S3,
atrás do mesmo adaptador `ObjectStorage` (ADR-0010).

O MinIO seria a escolha óbvia, mas suas imagens passaram a exigir autenticação para
download (Docker Hub e quay.io respondem 401). O SeaweedFS expõe a mesma API S3, tem
imagem pública e roda leve.

## Credenciais

`s3.template.json` é renderizado na subida do container com as variáveis
`STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY` e `STORAGE_BUCKET_MAPS` do `.env` — assim as
credenciais têm **uma** fonte, e não duas que saem de sincronia.

A identidade `anonymous` tem leitura no bucket de mapas, espelhando o R2, onde os
PMTiles são artefato público derivado. O bucket de mídia **não** é público.

## Diferenças em relação a Cloud Storage e R2

Política de acesso, URL assinada e classes de armazenamento não são idênticas. Por isso
o adaptador `ObjectStorage` tem teste de contrato rodado nos dois ambientes — o que
passa aqui precisa passar em `dev` também.
