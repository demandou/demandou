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


def rodar(cmd, pasta, env, prazo_s=600):
    """Roda com prazo: um navegador que trava não segura o trabalho (e a GPU paga) até o limite do endpoint."""
    try:
        return subprocess.run(cmd, capture_output=True, text=True, cwd=pasta, env=env, timeout=prazo_s)
    except subprocess.TimeoutExpired as x:
        return subprocess.CompletedProcess(cmd, 124, (x.stdout or b"").decode("utf-8", "replace") if isinstance(x.stdout, bytes) else (x.stdout or ""), f"passou do prazo de {prazo_s} s")


def gpu():
    try:
        return subprocess.run(["nvidia-smi", "--query-gpu=name,driver_version", "--format=csv,noheader"], capture_output=True, text=True, timeout=20).stdout.strip()
    except Exception as e:  # noqa: BLE001
        return f"sem nvidia-smi ({e})"


def rodar_script(e, projeto, t0):
    """
    O modo do worker (RENDER_3D_NA_GPU): roda o script do próprio projeto (o
    scripts/render.mjs do curso, com a conferência do plano e o -14 LUFS) com o
    gl da GPU em GL_DOS_MODELOS, e sobe o arquivo que ele gerou.
    """
    arquivo = os.path.join(projeto, e.get("arquivo") or "out/video-editado.mp4")
    env = {**os.environ, **{k: str(v) for k, v in (e.get("env") or {}).items()}, "GL_DOS_MODELOS": e.get("gl") or "angle-egl"}
    t1 = time.time()
    r = rodar(["node", e.get("script") or "scripts/render.mjs", *[str(a) for a in (e.get("args") or [])]], projeto, env, int(e.get("prazo_s") or 1700))
    render_s = round(time.time() - t1, 1)
    if r.returncode != 0 or not os.path.exists(arquivo):
        return {"erro": f"o script saiu com {r.returncode}: {(r.stderr or r.stdout)[-1500:]}", "gpu": gpu()}
    duracao = None
    try:
        duracao = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", arquivo], capture_output=True, text=True, timeout=60).stdout.strip())
    except Exception:  # noqa: BLE001
        pass
    url = enviar(arquivo, e["saida"]) if (e.get("saida") or {}).get("put_url") else None
    if not url:
        return {"erro": "o MP4 não subiu (sem put_url ou sem url na resposta)", "gpu": gpu()}
    medida = {"gl": env["GL_DOS_MODELOS"], "render_s": render_s, "segundos_de_video": duracao, "render_por_s": round(render_s / duracao, 2) if duracao else None}
    return {"gpu": gpu(), "medida": medida, "url": url, "segundos_no_endpoint": round(time.time() - t0, 1)}


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
        if e.get("modo") == "script":
            return rodar_script(e, projeto, t0)
        medidas = []
        enviado = None
        for gl in e.get("gls") or ["angle-egl"]:
            saida = os.path.join(pasta, f"corte-{gl}.mp4")
            cmd = ["node", "/app/render-3d.mjs", projeto, saida, gl, e.get("id") or "Edicao"]
            if e.get("de") is not None:
                cmd += [str(e["de"]), str(e["ate"] if e.get("ate") is not None else 10**9)]
                if e.get("concorrencia"):
                    cmd.append(str(e["concorrencia"]))
            r = rodar(cmd, projeto, {**os.environ, **({"RENDER_LOG": e["log"]} if e.get("log") else {})})
            linhas = [l for l in r.stdout.strip().splitlines() if l.startswith("{")]
            medida = json.loads(linhas[-1]) if linhas else {"ok": False, "gl": gl, "erro": (r.stderr or r.stdout)[-1500:]}
            if not medida.get("ok"):
                medida["log"] = (r.stderr or "")[-6000:] + "\n---\n" + (r.stdout or "")[-3000:]
            medidas.append(medida)
            if medida.get("ok") and enviado is None and (e.get("saida") or {}).get("put_url"):
                enviado = enviar(saida, e["saida"])
        return {"gpu": gpu(), "medidas": medidas, "url": enviado, "segundos_no_endpoint": round(time.time() - t0, 1), "diagnostico": diagnostico()}


def diagnostico():
    """O que o host montou do driver (EGL, GLX, Vulkan): sem isso o Chrome não cria o WebGL na GPU."""
    achados = []
    for pasta in ["/usr/lib/x86_64-linux-gnu", "/usr/lib64", "/usr/local/nvidia/lib64"]:
        try:
            achados += [os.path.join(pasta, n) for n in os.listdir(pasta) if "nvidia" in n.lower() or n.startswith("libcuda")]
        except OSError:
            pass
    return {
        "capacidades": os.environ.get("NVIDIA_DRIVER_CAPABILITIES"),
        "bibliotecas": sorted(achados)[:60],
        "egl_vendor": os.listdir("/usr/share/glvnd/egl_vendor.d") if os.path.isdir("/usr/share/glvnd/egl_vendor.d") else [],
        "nucleos": os.cpu_count(),
        "nproc": subprocess.run(["nproc"], capture_output=True, text=True).stdout.strip(),
        "compositor": [n for n in os.listdir("/app/node_modules/@remotion") if n.startswith("compositor")],
    }


runpod.serverless.start({"handler": handler})
