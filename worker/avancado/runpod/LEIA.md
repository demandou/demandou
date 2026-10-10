# O recorte do editor avançado no RunPod Serverless

Decisão do Bruno (10/10/2026): a GPU sob demanda do recorte com alfa (aula 8.2) é o RunPod Serverless. O worker do Railway continua fazendo tudo o resto; só o RVM vai para a GPU. Enquanto `RUNPOD_API_KEY` e `RUNPOD_ENDPOINT_RECORTE` não existirem no worker, o recorte roda na CPU (o padrão). Nada foi criado no RunPod ainda.

## Construir e publicar a imagem (uma vez, e a cada mudança em `scripts/recorte-alfa.py` ou `runpod/handler.py`)

O contexto da construção é a pasta `worker/avancado`:

```bash
cd worker/avancado
docker build -f runpod/Dockerfile -t <usuario-do-docker-hub>/demandou-recorte:1 .
docker push <usuario-do-docker-hub>/demandou-recorte:1
```

(Ou pelo GitHub Container Registry: `ghcr.io/<conta>/demandou-recorte:1`, com `docker login ghcr.io`.)

## Criar o endpoint no RunPod

1. Console do RunPod > Serverless > New Endpoint > Custom (imagem Docker): `<usuario>/demandou-recorte:1`.
2. GPU: L4 ou RTX A4000/A5000 (24 GB sobram; o RVM mobilenetv3 usa menos de 2 GB). Workers: mínimo 0 (paga só o uso), máximo 2. Idle timeout: 5 s. Execution timeout: 900 s.
3. Para devolver o WebM por URL (um corte de 40 s passa de 15 MB, o teto da resposta em bytes): em Environment Variables do endpoint, `BUCKET_ENDPOINT_URL`, `BUCKET_ACCESS_KEY_ID` e `BUCKET_SECRET_ACCESS_KEY` de um bucket S3 compatível (o próprio volume S3 do RunPod, ou um R2/S3). Sem bucket, o handler devolve os bytes e recusa o que passa de 15 MB.
4. Copie o ID do endpoint e crie uma API key (Settings > API Keys, permissão de leitura e escrita no Serverless).

## Ligar no worker (Railway)

- `RUNPOD_API_KEY`: a chave da API.
- `RUNPOD_ENDPOINT_RECORTE`: o ID do endpoint.
- `BLOB_PUBLIC_READ_WRITE_TOKEN` já existe: o worker publica o trecho no Blob público (URL não adivinhável) para o RunPod baixar, e apaga no fim do corte.
- `RECORTE_BACKEND=cpu` volta para a CPU sem tirar as variáveis.

Se o RunPod falhar (fila, partida a frio, erro), o worker refaz o recorte na CPU: o corte demora mais, mas sai.

## Provar antes de ligar

```bash
curl -s -X POST https://api.runpod.ai/v2/$RUNPOD_ENDPOINT_RECORTE/runsync \
  -H "Authorization: Bearer $RUNPOD_API_KEY" -H "Content-Type: application/json" \
  -d '{"input": {"url_do_trecho": "<url pública de um trecho de 5 s>", "duracao": 5, "caixa": "300,0,1320,1080"}}'
```

A resposta traz `medida.ms_modelo_por_quadro` e `medida.segundos_no_endpoint` (ainda não medidos em GPU: a prova no Modal não rodou, o cartão foi recusado; na CPU do i3 de desenvolvimento o modelo leva ~470 ms por quadro e a esteira inteira de 30 a 60 s por segundo de vídeo) e o WebM.
