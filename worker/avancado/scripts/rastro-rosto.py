"""
O RASTRO DO ROSTO num trecho (aula 7 e 8.1: "mantenha o rosto centralizado
dentro da moldura, acompanhando os movimentos da gravação").

O Face Landmarker do MediaPipe (Apache-2.0, o mesmo modelo de
worker/src/modelo/medir-rosto.py e da capa) lê o centro do rosto e o queixo
num quadro a cada `passo`; os outros quadros vêm por interpolação, e a curva
é suavizada por média móvel centrada (o enquadramento acompanha a pessoa sem
tremer junto com cada gesto).

Uso: python rastro-rosto.py <video> <inicio> <duracao> <saida.json> [passo=3] [janela_s=0.8]
Saída: {"fps", "largura", "altura", "rosto": [{"x","y","queixo"} em px da gravação, por quadro]}
"""
import json
import os
import subprocess
import sys

import mediapipe as mp
import numpy as np
from mediapipe.tasks.python import BaseOptions, vision

VIDEO, INICIO, DURACAO, SAIDA = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
PASSO = int(sys.argv[5]) if len(sys.argv) > 5 else 3
JANELA = float(sys.argv[6]) if len(sys.argv) > 6 else 0.8
FPS = 30
MODELO = os.environ.get("MODELO_ROSTO") or os.path.join(os.environ.get("MODELOS_DO_RECORTE", "/app/modelos"), "face_landmarker.task")

sonda = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", VIDEO], capture_output=True, text=True).stdout)
W, H = sonda["streams"][0]["width"], sonda["streams"][0]["height"]
ff = subprocess.Popen(["ffmpeg", "-v", "error", "-ss", str(INICIO), "-i", VIDEO, "-t", str(DURACAO), "-vf", f"fps={FPS}", "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1"], stdout=subprocess.PIPE)
det = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(base_options=BaseOptions(model_asset_path=MODELO), num_faces=1))

n = int(round(DURACAO * FPS))
medidas = {}
for i in range(n):
    b = ff.stdout.read(W * H * 3)
    if len(b) < W * H * 3:
        n = i
        break
    if i % PASSO:
        continue
    img = np.frombuffer(b, np.uint8).reshape(H, W, 3)
    r = det.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(img)))
    if r.face_landmarks:
        p = r.face_landmarks[0]
        c = [p[168], p[1], p[33], p[263]]
        medidas[i] = (sum(q.x for q in c) / 4 * W, sum(q.y for q in c) / 4 * H, p[152].y * H)
ff.kill()
det.close()
if not medidas:
    raise SystemExit("nenhum rosto no trecho")

idx = sorted(medidas)
serie = np.array([[np.interp(i, idx, [medidas[k][j] for k in idx]) for j in range(3)] for i in range(n)])
meia = max(1, int(JANELA * FPS / 2))
nucleo = np.ones(2 * meia + 1) / (2 * meia + 1)
suave = np.stack([np.convolve(np.pad(serie[:, j], meia, mode="edge"), nucleo, mode="valid") for j in range(3)], axis=1)
with open(SAIDA, "w", encoding="utf-8") as f:
    json.dump({"fps": FPS, "largura": W, "altura": H, "inicio": INICIO, "rosto": [{"x": round(a, 1), "y": round(b, 1), "queixo": round(c, 1)} for a, b, c in suave]}, f)
print(json.dumps({"quadros": n, "medidos": len(medidas), "x_min": round(float(suave[:, 0].min())), "x_max": round(float(suave[:, 0].max()))}))
