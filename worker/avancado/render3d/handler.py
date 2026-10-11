"""
O RENDER 3D NA GPU DO RUNPOD SERVERLESS (11/10/2026).

Entrada: {"input": {"url_do_projeto": "<tar.gz do projeto Remotion, sem node_modules>",
                    "id": "Edicao", "de": 0, "ate": null, "gls": ["angle-egl"],
                    "concorrencia": null,
                    "saida": {"put_url": "...", "cabecalhos": {...}} (opcional)}}
Para cada gl pedido, renderiza com worker/avancado/render3d/render-3d.mjs e mede.
O vídeo do primeiro gl que deu certo sobe para o put_url (o Blob da Vercel com
token de cliente que o worker gera); sem put_url, só a medida volta.
"""
import json
import os
import subprocess
import tarfile
import tempfile
import time
import urllib.request

import runpod


def baixar(url, destino):
    with urllib.request.urlopen(url, timeout=600) as r, open(destino, "wb") as f:
        while True:
            pedaco = r.read(1 << 20)
            if not pedaco:
                break
            f.write(pedaco)


def enviar(arquivo, saida):
    with open(arquivo, "rb") as f:
        pedido = urllib.request.Request(saida["put_url"], data=f.read(), method="PUT", headers={"Content-Type": "video/mp4", **(saida.get("cabecalhos") or {})})
    with urllib.request.urlopen(pedido, timeout=600) as r:
        corpo = r.read().decode("utf-8", "replace")
    try:
        return json.loads(corpo).get("url")
    except ValueError:
        return None


def gpu():
    try:
        return subprocess.run(["nvidia-smi", "--query-gpu=name,driver_version", "--format=csv,noheader"], capture_output=True, text=True, timeout=20).stdout.strip()
    except Exception as e:  # noqa: BLE001
        return f"sem nvidia-smi ({e})"


def handler(trabalho):
    e = trabalho.get("input") or {}
    if not e.get("url_do_projeto"):
        return {"erro": "falta url_do_projeto"}
    t0 = time.time()
    with tempfile.TemporaryDirectory() as pasta:
        tar = os.path.join(pasta, "projeto.tar.gz")
        baixar(e["url_do_projeto"], tar)
        projeto = os.path.join(pasta, "projeto")
        with tarfile.open(tar) as t:
            t.extractall(projeto)
        os.symlink("/app/node_modules", os.path.join(projeto, "node_modules"))
        medidas = []
        enviado = None
        for gl in e.get("gls") or ["angle-egl"]:
            saida = os.path.join(pasta, f"corte-{gl}.mp4")
            cmd = ["node", "/app/render-3d.mjs", projeto, saida, gl, e.get("id") or "Edicao"]
            if e.get("de") is not None:
                cmd += [str(e["de"]), str(e["ate"] if e.get("ate") is not None else 10**9)]
                if e.get("concorrencia"):
                    cmd.append(str(e["concorrencia"]))
            r = subprocess.run(cmd, capture_output=True, text=True, cwd=projeto)
            linhas = [l for l in r.stdout.strip().splitlines() if l.startswith("{")]
            medida = json.loads(linhas[-1]) if linhas else {"ok": False, "gl": gl, "erro": (r.stderr or r.stdout)[-1500:]}
            medidas.append(medida)
            if medida.get("ok") and enviado is None and (e.get("saida") or {}).get("put_url"):
                enviado = enviar(saida, e["saida"])
        return {"gpu": gpu(), "medidas": medidas, "url": enviado, "segundos_no_endpoint": round(time.time() - t0, 1)}


runpod.serverless.start({"handler": handler})
