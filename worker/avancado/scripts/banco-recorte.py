"""
BANCO DE PROVAS DO RECORTE (aula 8.2, ETAPA 2: "teste o alfa por 5 segundos").

Roda um candidato de recorte no mesmo trecho da gravação, mede o tempo por
quadro e grava, para três quadros (o de mão mais aberta, um do meio e um do
começo), a composição sobre fundo claro, escuro e laranja, o alfa puro e a
ampliação do cabelo em tamanho real. Também mede a tremulação: a média da
diferença do alfa entre quadros vizinhos, só na faixa de borda.

Uso:
  python banco-recorte.py <video> <inicio> <duracao> <pasta> <metodo> [limite_quadros]

Métodos (os modelos ficam em MODELOS_DO_RECORTE, nunca no repositório):
  rvm        Robust Video Matting mobilenetv3 (GPL-3.0, só como referência)
  modnet     MODNet retrato (Apache-2.0) + filtro guiado
  mp-multi   MediaPipe selfie multiclasse (Apache-2.0) + filtro guiado
  mp-selfie  MediaPipe selfie (Apache-2.0) + filtro guiado
  birefnet   BiRefNet lite swin-tiny (MIT) + filtro guiado
"""
import json
import os
import subprocess
import sys
import time

import cv2
import numpy as np

VIDEO, INICIO, DURACAO, PASTA, METODO = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4], sys.argv[5]
LIMITE = int(sys.argv[6]) if len(sys.argv) > 6 else 10**9
MODELOS = os.environ.get("MODELOS_DO_RECORTE", "/app/modelos")
W, H = 1920, 1080
os.makedirs(PASTA, exist_ok=True)

ffm = subprocess.Popen(
    ["ffmpeg", "-v", "error", "-ss", str(INICIO), "-i", VIDEO, "-t", str(DURACAO), "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1"],
    stdout=subprocess.PIPE,
)


def quadros():
    n = 0
    while n < LIMITE:
        b = ffm.stdout.read(W * H * 3)
        if len(b) < W * H * 3:
            break
        yield np.frombuffer(b, np.uint8).reshape(H, W, 3)
        n += 1


def refinar(img, alfa_baixa):
    """Sobe o alfa para a resolução cheia guiado pela própria imagem (filtro guiado)."""
    a = cv2.resize(alfa_baixa.astype(np.float32), (W, H), interpolation=cv2.INTER_LINEAR)
    guia = img.astype(np.float32) / 255.0
    a = cv2.ximgproc.guidedFilter(guia, a, 6, 1e-4)
    return np.clip(a, 0, 1)


def frente_estimada(img, alfa):
    """Cor da frente na borda: média das cores de dentro (tira o azul da parede do contorno)."""
    f = img.astype(np.float32)
    w = alfa**4
    acc = np.zeros_like(f)
    accw = np.zeros_like(w)
    for r in (3, 9, 27):
        acc += cv2.blur(f * w[..., None], (r, r))
        accw += cv2.blur(w, (r, r))
    est = acc / np.maximum(accw[..., None], 1e-4)
    return np.where((alfa < 0.98)[..., None], est, f)


if METODO in ("rvm", "modnet", "birefnet"):
    import onnxruntime as ort

    so = ort.SessionOptions()
    so.intra_op_num_threads = os.cpu_count()
    arquivo = {"rvm": "rvm_mobilenetv3_fp32.onnx", "modnet": "modnet.onnx", "birefnet": "birefnet_lite.onnx"}[METODO]
    sess = ort.InferenceSession(os.path.join(MODELOS, arquivo), so, providers=["CPUExecutionProvider"])
if METODO.startswith("mp-"):
    import mediapipe as mp
    from mediapipe.tasks.python import BaseOptions, vision

    arquivo = "selfie_multiclass.tflite" if METODO == "mp-multi" else "selfie_segmenter.tflite"
    seg = vision.ImageSegmenter.create_from_options(
        vision.ImageSegmenterOptions(base_options=BaseOptions(model_asset_path=os.path.join(MODELOS, arquivo)), output_confidence_masks=True)
    )

estado = {}
anterior = None
img_anterior = None
alfas, frentes, tempos = [], [], []
for i, img in enumerate(quadros()):
    t0 = time.perf_counter()
    if METODO == "rvm":
        src = (img.astype(np.float32) / 255.0).transpose(2, 0, 1)[None]
        rec = estado.get("rec", [np.zeros([1, 1, 1, 1], np.float32)] * 4)
        fgr, pha, *rec = sess.run(None, {"src": src, "r1i": rec[0], "r2i": rec[1], "r3i": rec[2], "r4i": rec[3], "downsample_ratio": np.array([0.25], np.float32)})
        estado["rec"] = rec
        alfa = pha[0, 0]
        frente = fgr[0].transpose(1, 2, 0) * 255.0
    elif METODO == "modnet":
        x = cv2.resize(img, (896, 512), interpolation=cv2.INTER_AREA).astype(np.float32)
        x = ((x / 255.0 - 0.5) / 0.5).transpose(2, 0, 1)[None]
        alfa = refinar(img, sess.run(None, {"input": x})[0][0, 0])
        frente = frente_estimada(img, alfa)
    elif METODO == "birefnet":
        x = cv2.resize(img, (1024, 1024), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
        x = ((x - np.array([0.485, 0.456, 0.406], np.float32)) / np.array([0.229, 0.224, 0.225], np.float32)).transpose(2, 0, 1)[None]
        logit = sess.run(None, {"input_image": x})[0][0, 0]
        alfa = refinar(img, 1 / (1 + np.exp(-logit)))
        frente = frente_estimada(img, alfa)
    else:
        r = seg.segment(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(img)))
        a = 1.0 - r.confidence_masks[0].numpy_view() if METODO == "mp-multi" else r.confidence_masks[0].numpy_view()
        a = np.clip((a - 0.25) / 0.5, 0, 1)
        alfa = refinar(img, cv2.resize(a, (W // 2, H // 2)))
        frente = frente_estimada(img, alfa)
    # Os modelos de quadro único tremem: média com o quadro anterior só onde a imagem ficou parada.
    if METODO != "rvm" and anterior is not None:
        d = cv2.blur(np.abs(img.astype(np.int16) - img_anterior.astype(np.int16)).max(axis=2).astype(np.float32), (9, 9))
        parado = np.clip(1.0 - d / 12.0, 0, 1) * 0.5
        alfa = alfa * (1 - parado) + anterior * parado
    anterior = alfa
    img_anterior = img
    tempos.append(time.perf_counter() - t0)
    alfas.append((np.clip(alfa, 0, 1) * 255).astype(np.uint8))
    frentes.append(np.clip(frente, 0, 255).astype(np.uint8))

n = len(alfas)
larguras = []
for a in alfas:
    cols = np.where((a > 128).any(axis=0))[0]
    larguras.append(cols.max() - cols.min() if len(cols) else 0)
escolhidos = sorted(set([int(np.argmax(larguras)), n // 2, min(n - 1, 10)]))
FUNDOS = [np.array(c, np.float32) for c in ((236, 238, 240), (30, 31, 34), (249, 115, 22))]
for k in escolhidos:
    a = alfas[k].astype(np.float32)[..., None] / 255.0
    f = frentes[k].astype(np.float32)
    linhas = [(f * a + fundo * (1 - a)).astype(np.uint8) for fundo in FUNDOS]
    linhas.append(np.repeat(alfas[k][..., None], 3, axis=2))
    folha = np.concatenate([np.concatenate(linhas[:2], axis=1), np.concatenate(linhas[2:], axis=1)], axis=0)
    cv2.imwrite(os.path.join(PASTA, f"{METODO}-q{k:03d}.jpg"), cv2.cvtColor(cv2.resize(folha, (1920, 1080)), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 90])
    rows = np.where((alfas[k] > 128).any(axis=1))[0]
    y0 = max(0, int(rows.min()) - 40) if len(rows) else 0
    linha_cabeca = alfas[k][min(H - 1, y0 + 120)] > 128
    cx = int(np.median(np.where(linha_cabeca)[0])) if linha_cabeca.any() else W // 2
    x0 = max(0, min(W - 480, cx - 240))
    zoom = [linhas[0][y0:y0 + 360, x0:x0 + 480], linhas[1][y0:y0 + 360, x0:x0 + 480]]
    cv2.imwrite(os.path.join(PASTA, f"{METODO}-q{k:03d}-cabelo.png"), cv2.cvtColor(np.concatenate(zoom, axis=1), cv2.COLOR_RGB2BGR))

trem = []
for k in range(1, n):
    a0 = alfas[k - 1].astype(np.float32) / 255
    a1 = alfas[k].astype(np.float32) / 255
    borda = ((a1 > 0.05) & (a1 < 0.95)) | ((a0 > 0.05) & (a0 < 0.95))
    trem.append(float(np.abs(a1 - a0)[borda].mean()) if borda.any() else 0.0)
np.save(os.path.join(PASTA, f"{METODO}-alfas.npy"), np.stack(alfas)[:, ::2, ::2])
media = float(np.mean(tempos[1:] if n > 1 else tempos))
print(json.dumps({
    "metodo": METODO,
    "quadros": n,
    "ms_por_quadro": round(1000 * media, 1),
    "s_por_s_de_video_30fps": round(media * 30, 2),
    "tremulacao_borda": round(float(np.mean(trem)) if trem else 0.0, 4),
    "escolhidos": escolhidos,
}))
ffm.kill()
