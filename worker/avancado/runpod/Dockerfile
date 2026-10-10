# O ENDPOINT DO RECORTE NO RUNPOD SERVERLESS (editor avançado, 10/10/2026).
#
# A mesma esteira de recorte do worker (scripts/recorte-alfa.py) na GPU: o
# onnxruntime-gpu com a CUDA e o cuDNN que vêm pelo pip (o recorte-alfa.py
# chama ort.preload_dlls()), o ffmpeg do Debian (libvpx para o WebM VP9 com
# alfa) e o modelo RVM baixado na construção. Base Python enxuta: o driver da
# GPU é do host do RunPod. Contexto da construção: a pasta worker/avancado
# (ver LEIA.md, ao lado, e .github/workflows/imagem-do-recorte.yml).
#
# LICENÇA DO MODELO: Robust Video Matting (Peter Lin et al.), GPL-3.0. Roda no
# nosso endpoint; o modelo nunca é entregue a cliente.
FROM python:3.11-slim-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir \
        "onnxruntime-gpu[cuda,cudnn]==1.22.0" \
        numpy==2.2.6 \
        opencv-python-headless==4.11.0.86 \
        "runpod>=1.6,<2"

ADD https://github.com/PeterL1n/RobustVideoMatting/releases/download/v1.0.0/rvm_mobilenetv3_fp32.onnx /modelos/rvm_mobilenetv3_fp32.onnx
RUN chmod 644 /modelos/rvm_mobilenetv3_fp32.onnx \
    && python3 -c "import hashlib; h = hashlib.sha256(open('/modelos/rvm_mobilenetv3_fp32.onnx', 'rb').read()).hexdigest(); assert h == '88d4531297118f595bf2fd60f6f566aec2e559393802d1f436c380f0cbbd2828', 'RVM com sha256 diferente: ' + h"

WORKDIR /app
COPY scripts/recorte-alfa.py /app/recorte-alfa.py
COPY runpod/handler.py /app/handler.py

ENV MODELOS_DO_RECORTE=/modelos
# Prova em construção: o modelo carrega no onnxruntime e o handler compila (a GPU só existe na hora do trabalho).
RUN python3 -c "import onnxruntime as ort; s = ort.InferenceSession('/modelos/rvm_mobilenetv3_fp32.onnx', providers=['CPUExecutionProvider']); print('RVM provado na construcao:', ort.get_available_providers())" \
    && python3 -m py_compile /app/handler.py /app/recorte-alfa.py

CMD ["python3", "-u", "/app/handler.py"]
