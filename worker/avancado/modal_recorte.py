"""
O RECORTE COM ALFA NA GPU DO MODAL (prova de 10/10/2026).

A mesma esteira do worker (scripts/recorte-alfa.py: o mesmo modelo, o mesmo
aquecimento, a mesma cor de borda e o mesmo WebM VP9 com alfa), só que com o
onnxruntime na GPU. Serve para comparar tempo, custo e qualidade com a CPU do
Railway, e para virar o serviço de recorte se a conta fechar.

Só `modal run` efêmero: nada fica implantado nem rodando depois.

Uso (de uma pasta SEM arquivo modal.py, por exemplo C:\\Users\\devan\\modal-demandou):
  python -m modal run <worktree>/worker/avancado/modal_recorte.py \
      --video trecho.mp4 --saida pasta --metodo rvm --inicio 1.5 --duracao 15 --caixa 300,0,1320,1080

O trecho mandado deve começar `inicio` segundos antes do que se quer (o
aquecimento do RVM). Os modelos vão na imagem a partir de MODELOS_DO_RECORTE.
"""
import json
import os
import pathlib
import subprocess
import time

import modal

AQUI = pathlib.Path(__file__).resolve().parent
MODELOS = pathlib.Path(os.environ.get("MODELOS_DO_RECORTE", AQUI / "modelos"))
GPU = os.environ.get("GPU_DO_RECORTE", "L4")

imagem = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg")
    .pip_install("onnxruntime-gpu[cuda,cudnn]==1.22.0", "numpy==2.2.6", "opencv-python-headless==4.11.0.86")
    .add_local_file(AQUI / "scripts" / "recorte-alfa.py", "/root/recorte-alfa.py")
    .add_local_file(MODELOS / "rvm_mobilenetv3_fp32.onnx", "/modelos/rvm_mobilenetv3_fp32.onnx")
    .add_local_file(MODELOS / "modnet.onnx", "/modelos/modnet.onnx")
)
app = modal.App("demandou-recorte-prova", image=imagem)


@app.function(gpu=GPU, cpu=4.0, memory=8192, timeout=900)
def recortar(video: bytes, metodo: str, inicio: float, duracao: float, caixa: str, razao: float) -> dict:
    t_entrou = time.time()
    entrada = "/tmp/trecho.mp4"
    with open(entrada, "wb") as f:
        f.write(video)
    gpu = subprocess.run(["nvidia-smi", "--query-gpu=name", "--format=csv,noheader"], capture_output=True, text=True).stdout.strip()
    saida = "/tmp/alfa.webm"
    cmd = [
        "python", "/root/recorte-alfa.py", "--video", entrada, "--inicio", str(inicio), "--duracao", str(duracao), "--aquecer", str(inicio),
        "--saida", saida, "--metodo", metodo, "--provedor", "cuda", "--razao", str(razao), "--rastro", "/tmp/rastro.json", "--provas", "/tmp/provas",
    ]
    if caixa:
        cmd += ["--caixa", caixa]
    r = subprocess.run(cmd, capture_output=True, text=True, env={**os.environ, "MODELOS_DO_RECORTE": "/modelos"})
    if r.returncode != 0:
        raise RuntimeError(f"recorte-alfa.py falhou:\n{r.stderr[-3000:]}")
    medida = json.loads(r.stdout.strip().splitlines()[-1])
    provas = {}
    for nome in sorted(os.listdir("/tmp/provas")):
        if nome.endswith("-claro.png") or nome.endswith("-escuro.png"):
            provas[nome] = open(os.path.join("/tmp/provas", nome), "rb").read()
    return {
        "gpu": gpu,
        "medida": medida,
        "segundos_na_funcao": round(time.time() - t_entrou, 1),
        "alfa": open(saida, "rb").read(),
        "rastro": open("/tmp/rastro.json", "rb").read(),
        "provas": provas,
    }


@app.local_entrypoint()
def main(video: str, saida: str, metodo: str = "rvm", inicio: float = 1.5, duracao: float = 15.0, caixa: str = "", razao: float = 0.25):
    pasta = pathlib.Path(saida)
    pasta.mkdir(parents=True, exist_ok=True)
    t0 = time.time()
    r = recortar.remote(pathlib.Path(video).read_bytes(), metodo, inicio, duracao, caixa, razao)
    total = time.time() - t0
    (pasta / f"{metodo}-gpu-alfa.webm").write_bytes(r["alfa"])
    (pasta / f"{metodo}-gpu-rastro.json").write_bytes(r["rastro"])
    for nome, dados in r["provas"].items():
        (pasta / f"{metodo}-gpu-{nome}").write_bytes(dados)
    resumo = {"gpu": r["gpu"], "metodo": metodo, "segundos_na_funcao": r["segundos_na_funcao"], "segundos_da_chamada_com_partida": round(total, 1), **r["medida"]}
    (pasta / f"{metodo}-gpu-medida.json").write_text(json.dumps(resumo, indent=1), encoding="utf-8")
    print(json.dumps(resumo))
