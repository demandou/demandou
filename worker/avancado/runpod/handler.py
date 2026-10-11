"""
O RECORTE COM ALFA NA GPU DO RUNPOD SERVERLESS (editor avançado, 10/10/2026).

Decisão do Bruno: a GPU sob demanda do recorte é o RunPod Serverless (o Modal
recusou o cartão). Este é o handler do endpoint: a MESMA esteira do worker
(scripts/recorte-alfa.py: o RVM mobilenetv3, o aquecimento no começo do
trecho, a cor da borda sem a parede e o WebM VP9 com alfa), só que com o
onnxruntime na GPU (--provedor cuda).

Entrada (o corpo que o worker manda em POST /run, worker/src/avancado/recorte.mjs, pedidoDoRunpod):
  {"input": {"url_do_trecho": "...", "inicio": 0, "duracao": 32.3, "aquecer": 1.5,
             "aquecer_no_comeco": true, "razao": 0.25, "caixa": "300,0,1320,1080",
             "saida": {"put_url": "...", "cabecalhos": {...}}  (opcional)}}

Saída: {"medida": {...}, "rastro": {...}, "url": "..."} quando o WebM sobe para
o put_url pedido (o worker manda um destino no Blob da Vercel com token de
cliente só para aquele arquivo) ou para um bucket (as variáveis BUCKET_* do
RunPod); senão {"webm_base64": "..."} (só até ~15 MB: o RunPod limita o
tamanho da resposta). Com "so_medida": true, só a medida e o rastro.

O modelo vai na imagem (Dockerfile ao lado), sob a licença GPL-3.0 do Robust
Video Matting: roda no nosso endpoint, nunca é entregue a cliente.
"""
import base64
import json
import os
import subprocess
import tempfile
import time
import urllib.request

import runpod

SCRIPT = "/app/recorte-alfa.py"
TETO_DOS_BYTES = 15 * 1024 * 1024


def baixar(url, destino):
    with urllib.request.urlopen(url, timeout=600) as r, open(destino, "wb") as f:
        while True:
            pedaco = r.read(1 << 20)
            if not pedaco:
                break
            f.write(pedaco)


def enviar(arquivo, entrada):
    """Sobe o WebM: o put_url pedido, o bucket do RunPod (BUCKET_ENDPOINT_URL...), ou bytes na resposta."""
    saida = entrada.get("saida") or {}
    if not saida.get("put_url") and os.environ.get("BUCKET_ENDPOINT_URL"):
        from runpod.serverless.utils import rp_upload

        return {"url": rp_upload.upload_file_to_bucket(file_name=f"recorte-{int(time.time())}.webm", file_location=arquivo)}
    if saida.get("put_url"):
        # o destino que o worker preparou (o Blob da Vercel com um token de cliente só para este arquivo)
        with open(arquivo, "rb") as f:
            pedido = urllib.request.Request(saida["put_url"], data=f.read(), method="PUT", headers={"Content-Type": "video/webm", **(saida.get("cabecalhos") or {})})
        with urllib.request.urlopen(pedido, timeout=600) as r:
            if r.status >= 300:
                raise RuntimeError(f"o envio do WebM respondeu {r.status}")
            corpo = r.read().decode("utf-8", "replace")
        try:
            url = json.loads(corpo).get("url")
        except ValueError:
            url = None
        return {"url": url or saida.get("url_publica") or saida["put_url"].split("?")[0]}
    if entrada.get("so_medida"):
        return {}
    tamanho = os.path.getsize(arquivo)
    if tamanho > TETO_DOS_BYTES:
        raise RuntimeError(f"WebM de {tamanho} bytes não cabe na resposta: configure o bucket do endpoint")
    with open(arquivo, "rb") as f:
        return {"webm_base64": base64.b64encode(f.read()).decode("ascii")}


def handler(trabalho):
    e = trabalho.get("input") or {}
    if not e.get("url_do_trecho") or not e.get("duracao"):
        return {"erro": "faltam url_do_trecho e duracao"}
    t0 = time.time()
    with tempfile.TemporaryDirectory() as pasta:
        trecho = os.path.join(pasta, "trecho.mp4")
        alfa = os.path.join(pasta, "alfa.webm")
        rastro = os.path.join(pasta, "rastro.json")
        baixar(e["url_do_trecho"], trecho)
        cmd = [
            "python3", SCRIPT, "--video", trecho, "--inicio", str(e.get("inicio", 0)), "--duracao", str(e["duracao"]),
            "--aquecer", str(e.get("aquecer", 1.5)), "--saida", alfa, "--rastro", rastro, "--provedor", "cuda",
            "--razao", str(e.get("razao", 0.25)),
        ]
        if e.get("aquecer_no_comeco", True):
            cmd.append("--aquecer-no-comeco")
        if e.get("caixa"):
            cmd += ["--caixa", str(e["caixa"])]
        r = subprocess.run(cmd, capture_output=True, text=True, env={**os.environ, "MODELOS_DO_RECORTE": "/modelos"})
        if r.returncode != 0:
            return {"erro": f"recorte-alfa.py falhou: {r.stderr[-1500:]}"}
        medida = json.loads(r.stdout.strip().splitlines()[-1])
        medida["segundos_no_endpoint"] = round(time.time() - t0, 1)
        with open(rastro, encoding="utf-8") as f:
            dados_do_rastro = json.load(f)
        return {"medida": medida, "rastro": dados_do_rastro, **enviar(alfa, e)}


runpod.serverless.start({"handler": handler})
