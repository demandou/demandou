"""
CONFERÊNCIA DO ALFA (aula 8.2: "apresente o trecho crítico de cabelo e mãos
também sobre fundo claro e escuro").

Lê o WebM com alfa como a composição lê (decodificador libvpx-vp9, que
preserva o canal alfa; o vp9 nativo do ffmpeg o descarta) e grava, para cada
quadro pedido: a pessoa sobre fundo claro e escuro lado a lado, e as
ampliações em tamanho real da cabeça (cabelo) e da mão mais afastada do
corpo, também sobre claro e escuro, e uma tira de 8 quadros seguidos da
borda da cabeça (a tremulação se vê nela: borda que pisca muda de um quadro
para o outro sem a cabeça mexer).

Uso: python conferir-alfa.py <alfa.webm> <pasta> <quadro,quadro,...>
"""
import json
import os
import subprocess
import sys

import cv2
import numpy as np

VIDEO, PASTA = sys.argv[1], sys.argv[2]
PEDIDOS = [int(x) for x in sys.argv[3].split(",")]
os.makedirs(PASTA, exist_ok=True)
sonda = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", VIDEO], capture_output=True, text=True).stdout)
W, H = sonda["streams"][0]["width"], sonda["streams"][0]["height"]
p = subprocess.Popen(["ffmpeg", "-v", "error", "-c:v", "libvpx-vp9", "-i", VIDEO, "-f", "rawvideo", "-pix_fmt", "rgba", "pipe:1"], stdout=subprocess.PIPE)
CLARO = np.array([236, 238, 240], np.float32)
ESCURO = np.array([30, 31, 34], np.float32)


def sobre(q, fundo):
    a = q[..., 3:4].astype(np.float32) / 255
    return (q[..., :3].astype(np.float32) * a + fundo * (1 - a)).astype(np.uint8)


def gravar(nome, rgb):
    cv2.imwrite(os.path.join(PASTA, nome), cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR))


tira = []
inicio_tira = PEDIDOS[0]
i = 0
while True:
    b = p.stdout.read(W * H * 4)
    if len(b) < W * H * 4:
        break
    q = np.frombuffer(b, np.uint8).reshape(H, W, 4)
    if inicio_tira <= i < inicio_tira + 8:
        tira.append(q.copy())
    if i in PEDIDOS:
        gravar(f"quadro-{i:03d}-claro-escuro.png", np.concatenate([sobre(q, CLARO), sobre(q, ESCURO)], axis=1))
        cheio = q[..., 3] > 128
        linhas = np.where(cheio.sum(axis=1) > 12)[0]
        if len(linhas):
            topo = int(linhas[0])
            xs = np.where(cheio[topo:topo + 140].any(axis=0))[0]
            cx = int(xs.mean())
            y0, x0 = max(0, topo - 50), max(0, min(W - 420, cx - 210))
            corte = q[y0:y0 + 320, x0:x0 + 420]
            gravar(f"quadro-{i:03d}-cabelo-100.png", np.concatenate([sobre(corte, CLARO), sobre(corte, ESCURO)], axis=1))
            # a mão: a coluna com pessoa mais longe do centro da cabeça, na metade de baixo
            baixo = cheio[H // 2 :]
            cols = np.where(baixo.any(axis=0))[0]
            if len(cols):
                ext = cols[np.argmax(np.abs(cols - cx))]
                ys = np.where(baixo[:, ext])[0]
                my = H // 2 + int(ys.mean()) if len(ys) else H - 200
                y1, x1 = max(0, min(H - 300, my - 150)), max(0, min(W - 360, ext - 180))
                corte = q[y1:y1 + 300, x1:x1 + 360]
                gravar(f"quadro-{i:03d}-mao-100.png", np.concatenate([sobre(corte, CLARO), sobre(corte, ESCURO)], axis=1))
    i += 1
if tira:
    # a mesma janela da cabeça em todos os quadros da tira, sobre escuro (onde halo e piscada aparecem)
    cheio = tira[0][..., 3] > 128
    linhas = np.where(cheio.sum(axis=1) > 12)[0]
    topo = int(linhas[0]) if len(linhas) else 0
    xs = np.where(cheio[topo:topo + 140].any(axis=0))[0]
    cx = int(xs.mean()) if len(xs) else W // 2
    y0, x0 = max(0, topo - 40), max(0, min(W - 300, cx - 150))
    gravar(f"tira-{inicio_tira:03d}-cabeca-escuro.png", np.concatenate([sobre(q[y0:y0 + 220, x0:x0 + 300], ESCURO) for q in tira], axis=1))
print(json.dumps({"quadros": i, "tira": len(tira)}))
