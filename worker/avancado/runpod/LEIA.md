# O recorte do editor avançado no RunPod Serverless

Decisão do Bruno (10/10/2026): a GPU sob demanda do recorte com alfa (aula 8.2) é o RunPod Serverless. O worker do Railway continua fazendo tudo o resto; só o RVM vai para a GPU. Enquanto `RUNPOD_API_KEY` e `RUNPOD_ENDPOINT_RECORTE` não existirem no worker, o recorte roda na CPU (o padrão). Se o RunPod falhar (fila, partida a frio, erro), o worker refaz o recorte na CPU: o corte demora mais, mas sai.

## A imagem (GitHub Actions para o GHCR)

`.github/workflows/imagem-do-recorte.yml` constrói `worker/avancado/runpod/Dockerfile` (contexto `worker/avancado`) e publica `ghcr.io/<dono do repositório>/demandou-recorte:<commit>` e `:latest`. Roda sozinho quando `runpod/`, `scripts/recorte-alfa.py` ou o próprio workflow mudam, ou à mão (Actions > Imagem do recorte > Run workflow). No repositório de backup (`areticon/demandou-backup`) a imagem é `ghcr.io/areticon/demandou-recorte`.

A imagem fica PRIVADA no GHCR, de propósito: o modelo é GPL-3.0 e uma imagem pública seria distribuição. Para o RunPod baixar: crie um token do GitHub (classic) só com `read:packages` e cadastre em RunPod > Settings > Container Registry Auth (usuário `areticon`, senha o token).

Construir na mão, se precisar: `cd worker/avancado && docker build -f runpod/Dockerfile -t demandou-recorte .`

## Criar o endpoint no RunPod (uma vez)

1. Serverless > New Endpoint > Custom Source (imagem Docker): `ghcr.io/areticon/demandou-recorte:latest`, com a credencial do GHCR acima.
2. GPU: L4, RTX A4000 ou A5000 (o RVM mobilenetv3 usa menos de 2 GB). Workers: mínimo 0 (paga só o uso), máximo 2. Idle timeout: 5 s. Execution timeout: 900 s. Container disk: 15 GB.
3. Para devolver o WebM por URL (um corte de 40 s passa de 15 MB, o teto da resposta em bytes): em Environment Variables do endpoint, `BUCKET_ENDPOINT_URL`, `BUCKET_ACCESS_KEY_ID` e `BUCKET_SECRET_ACCESS_KEY` de um bucket S3 compatível (o S3 do RunPod, um R2 ou um S3). Sem bucket, o handler devolve os bytes e recusa o que passa de 15 MB (aí o worker cai na CPU).
4. Copie o ID do endpoint e crie uma API key (Settings > API Keys).

## Ligar no worker (Railway)

- `RUNPOD_API_KEY`: a chave da API.
- `RUNPOD_ENDPOINT_RECORTE`: o ID do endpoint.
- O worker publica o trecho no Blob público (URL não adivinhável) para o RunPod baixar e apaga no fim do corte (`BLOB_PUBLIC_READ_WRITE_TOKEN`, que já existe).
- `RECORTE_BACKEND=cpu` volta para a CPU sem tirar as variáveis.

## Provar antes de ligar

```bash
curl -s -X POST "https://api.runpod.ai/v2/$RUNPOD_ENDPOINT_RECORTE/runsync" \
  -H "Authorization: Bearer $RUNPOD_API_KEY" -H "Content-Type: application/json" \
  -d '{"input": {"url_do_trecho": "<url pública de um trecho de 5 s>", "duracao": 5, "caixa": "300,0,1320,1080"}}'
```

A resposta traz `medida.ms_modelo_por_quadro` e `medida.segundos_no_endpoint` (ainda não medidos em GPU: a prova no Modal não rodou, o cartão foi recusado; na CPU do i3 de desenvolvimento o modelo leva de 470 a 800 ms por quadro e a esteira inteira de 30 a 51 s por segundo de vídeo).
