"""
O RECORTE COM ALFA DO APRESENTADOR (aula 8.2), por CPU, para o worker.

A aula 8.2 usa o @remotion/video-matting, que precisa de WebGPU: o contêiner
do Railway não tem GPU. Aqui o recorte sai de um processo Python com
onnxruntime em CPU e vira um WebM VP9 com alfa (yuva420p), que a composição
do Remotion põe em camadas com <OffthreadVideo transparent>.

## O motor e por que ele (banco de provas de 10/10/2026, scripts/banco-recorte.py)

No mesmo trecho de 5 s da gravação do Bruno (cabelo, mãos abertas com borrão
de movimento), sobre fundo claro, escuro e laranja:

  RVM mobilenetv3 (GPL-3.0)   0,47 s/quadro  borda limpa, mão com borrão inteira, estável no tempo
  MODNet (Apache-2.0)         2,0 s/quadro   halo claro, buraco na mão, rosto meio transparente
  MediaPipe multiclasse        1,7 s/quadro   borda mole e larga, pegou a cadeira
  BiRefNet lite (MIT)          18 a 25 s/quadro, borda dura na mão borrada

Só o RVM passa na régua da aula ("não aprove halos, tremulação, cabelo ou mãos
desaparecendo"). Ele é recorrente: lembra os quadros anteriores, por isso não
treme e não precisa de suavização no tempo. A licença é GPL-3.0: rodar no
nosso servidor não é distribuição e não obriga abrir o código, mas o modelo
nunca pode ir para o navegador, app ou qualquer coisa entregue ao cliente.

## O que este script faz além do modelo

1. Aquecimento: o RVM começa sem memória e erra nos primeiros quadros. O trecho
   é lido desde `aquecer` segundos antes, e esses quadros são descartados.
2. Cor da frente na borda: onde o alfa é parcial, a cor da gravação traz o azul
   da parede, que vira halo claro sobre fundo escuro. A cor da borda passa a ser
   a média das cores de dentro da pessoa, ponderada pelo alfa (sem a parede).
   A mesma cor se estende para fora da silhueta: o VP9 guarda a cor em meia
   resolução (4:2:0), e sem isso a borda puxaria o preto do transparente.
3. Aperto leve do alfa (`aperto`): tira a franja de 1 ou 2 px que o modelo deixa
   transparente demais em volta do ombro, sem comer cabelo.

Uso:
  python recorte-alfa.py --video original.mp4 --inicio 64.45 --duracao 15 \
      --saida alfa.webm [--aquecer 1.5] [--razao 0.25] [--provas pasta]

Saída: o WebM com alfa e uma linha de JSON com quadros e tempos (s por s de vídeo).
O modelo fica em MODELOS_DO_RECORTE/rvm_mobilenetv3_fp32.onnx (fora do repositório).
"""
import argparse
import json
import os
import subprocess
import time

import cv2
import numpy as np
import onnxruntime as ort

ap = argparse.ArgumentParser()
ap.add_argument("--video", required=True)
ap.add_argument("--inicio", type=float, required=True)
ap.add_argument("--duracao", type=float, required=True)
ap.add_argument("--saida", required=True)
ap.add_argument("--aquecer", type=float, default=1.5)
ap.add_argument("--aquecer-no-comeco", action="store_true", help="o trecho começa no 0 (corte já emendado): a memória do RVM aquece nos primeiros quadros do próprio trecho, que depois são lidos de novo")
ap.add_argument("--razao", type=float, default=0.25)
ap.add_argument("--aperto", type=float, default=0.06)
ap.add_argument("--fps", type=int, default=30)
ap.add_argument("--provas", default=None, help="pasta para os quadros de conferência (claro, escuro, laranja)")
ap.add_argument("--caixa", default=None, help="x,y,l,a em px da gravação: só esta região vai para o WebM (o modelo vê o quadro inteiro)")
ap.add_argument("--rastro", default=None, help="JSON com o topo e o centro da cabeça por quadro (no sistema da caixa)")
ap.add_argument("--metodo", default="rvm", choices=["rvm", "modnet"], help="modnet só para comparação (é o padrão do @remotion/video-matting)")
ap.add_argument("--provedor", default="cpu", choices=["cpu", "cuda"], help="cuda: a mesma esteira numa GPU (Modal, worker/avancado/modal_recorte.py)")
ap.add_argument("--modelo", default=None)
args = ap.parse_args()
PASTA_MODELOS = os.environ.get("MODELOS_DO_RECORTE", "/app/modelos")
if not args.modelo:
    args.modelo = os.path.join(PASTA_MODELOS, "rvm_mobilenetv3_fp32.onnx" if args.metodo == "rvm" else "modnet.onnx")

sonda = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", args.video], capture_output=True, text=True).stdout)
W, H = sonda["streams"][0]["width"], sonda["streams"][0]["height"]
CX, CY, CW, CH = [int(v) for v in args.caixa.split(",")] if args.caixa else (0, 0, W, H)
CX, CY = max(0, CX), max(0, CY)
CW, CH = min(CW, W - CX) // 2 * 2, min(CH, H - CY) // 2 * 2
aquecer = min(args.aquecer, args.inicio)
n_aquecer = int(round(aquecer * args.fps))
n_total = int(round(args.duracao * args.fps))

entrada = subprocess.Popen(
    ["ffmpeg", "-v", "error", "-ss", f"{args.inicio - aquecer:.3f}", "-i", args.video, "-t", f"{aquecer + args.duracao + 0.5:.3f}",
     "-vf", f"fps={args.fps}", "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1"],
    stdout=subprocess.PIPE,
)
saida = subprocess.Popen(
    ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{CW}x{CH}", "-r", str(args.fps), "-i", "pipe:0",
     "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "16", "-row-mt", "1", "-deadline", "good", "-cpu-used", "4",
     "-auto-alt-ref", "0", "-metadata:s:v:0", "alpha_mode=1", args.saida],
    stdin=subprocess.PIPE,
)

so = ort.SessionOptions()
so.intra_op_num_threads = os.cpu_count() or 4
if args.provedor == "cuda":
    if hasattr(ort, "preload_dlls"):
        ort.preload_dlls()  # as bibliotecas CUDA/cuDNN que vêm pelo pip (onnxruntime-gpu[cuda,cudnn])
    provedores = ["CUDAExecutionProvider", "CPUExecutionProvider"]
else:
    provedores = ["CPUExecutionProvider"]
sess = ort.InferenceSession(args.modelo, so, providers=provedores)
if args.provedor == "cuda" and "CUDAExecutionProvider" not in sess.get_providers():
    raise SystemExit("a GPU não carregou no onnxruntime (CUDAExecutionProvider ausente)")
rec = [np.zeros([1, 1, 1, 1], np.float32)] * 4
razao = np.array([args.razao], np.float32)
alfa_anterior = None
img_anterior = None

if args.aquecer_no_comeco and args.metodo == "rvm" and args.aquecer > 0:
    # O corte emendado não tem "antes" para aquecer: a memória passa pelos primeiros
    # quadros do próprio trecho (descartados) e a leitura de verdade recomeça do 0.
    preparo = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-ss", f"{args.inicio:.3f}", "-i", args.video, "-t", f"{args.aquecer:.3f}",
         "-vf", f"fps={args.fps}", "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1"],
        stdout=subprocess.PIPE,
    )
    while True:
        b = preparo.stdout.read(W * H * 3)
        if len(b) < W * H * 3:
            break
        src = (np.frombuffer(b, np.uint8).reshape(H, W, 3).astype(np.float32) * (1 / 255.0)).transpose(2, 0, 1)[None]
        _fgr, _pha, *rec = sess.run(None, {"src": src, "r1i": rec[0], "r2i": rec[1], "r3i": rec[2], "r4i": rec[3], "downsample_ratio": razao})
    preparo.kill()


def cor_da_frente(img, alfa):
    """Cor de dentro da pessoa espalhada para a borda e para fora (sem o azul da parede)."""
    f = img.astype(np.float32)
    # Em meia resolução: a cor da borda varia devagar e o custo cai a um quarto.
    pequeno = cv2.resize(f, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
    peso = cv2.resize(alfa, (W // 2, H // 2), interpolation=cv2.INTER_AREA) ** 6
    soma = np.zeros_like(pequeno)
    soma_peso = np.zeros_like(peso)
    for r in (5, 15, 45):
        soma += cv2.blur(pequeno * peso[..., None], (r, r))
        soma_peso += cv2.blur(peso, (r, r))
    est = soma / np.maximum(soma_peso[..., None], 1e-6)
    est = cv2.resize(est, (W, H), interpolation=cv2.INTER_LINEAR)
    # Dentro (alfa quase 1) vale a cor real; na borda, a mistura vai para a estimada.
    # O limiar alto (0,9) pega também o dedo borrado pelo movimento, que deixa a
    # parede azul aparecer através dele (prova de 10/10, mão aberta a 77 s).
    m = np.clip((alfa - 0.9) / 0.08, 0, 1)[..., None]
    return f * m + est * (1 - m)


provas = {}
rastro = []
tempos_modelo, tempos_total = [], []
larguras = []
indice = 0
escrito = 0
t_inicio = time.perf_counter()
while escrito < n_total:
    b = entrada.stdout.read(W * H * 3)
    if len(b) < W * H * 3:
        break
    img = np.frombuffer(b, np.uint8).reshape(H, W, 3)
    t0 = time.perf_counter()
    if args.metodo == "rvm":
        src = (img.astype(np.float32) * (1 / 255.0)).transpose(2, 0, 1)[None]
        _fgr, pha, *rec = sess.run(None, {"src": src, "r1i": rec[0], "r2i": rec[1], "r3i": rec[2], "r4i": rec[3], "downsample_ratio": razao})
        bruto = pha[0, 0]
    else:
        # MODNet: quadro a quadro em 512 de altura; a média com o quadro anterior só onde a imagem parou
        x = cv2.resize(img, (896, 512), interpolation=cv2.INTER_AREA).astype(np.float32)
        x = ((x / 255.0 - 0.5) / 0.5).transpose(2, 0, 1)[None]
        bruto = cv2.resize(sess.run(None, {"input": x})[0][0, 0], (W, H), interpolation=cv2.INTER_LINEAR)
        if alfa_anterior is not None:
            d = cv2.blur(np.abs(img.astype(np.int16) - img_anterior.astype(np.int16)).max(axis=2).astype(np.float32), (9, 9))
            parado = np.clip(1.0 - d / 12.0, 0, 1) * 0.5
            bruto = bruto * (1 - parado) + alfa_anterior * parado
        alfa_anterior, img_anterior = bruto, img
    t1 = time.perf_counter()
    indice += 1
    if indice <= n_aquecer:
        continue
    alfa = np.clip((bruto - args.aperto) / (1 - args.aperto), 0, 1)
    frente = cor_da_frente(img, alfa)
    rgba = np.empty((H, W, 4), np.uint8)
    rgba[..., :3] = np.clip(frente, 0, 255)
    rgba[..., 3] = np.round(alfa * 255)
    rgba = np.ascontiguousarray(rgba[CY:CY + CH, CX:CX + CW])
    saida.stdin.write(rgba.tobytes())
    tempos_modelo.append(t1 - t0)
    tempos_total.append(time.perf_counter() - t0)
    cheio = alfa > 0.5
    cols = np.where(cheio.any(axis=0))[0]
    larguras.append(int(cols.max() - cols.min()) if len(cols) else 0)
    # A cabeça: a primeira linha com pessoa e o centro das 140 linhas abaixo dela.
    linhas = np.where(cheio.sum(axis=1) > 12)[0]
    if len(linhas):
        topo = int(linhas[0])
        xs = np.where(cheio[topo:topo + 140].any(axis=0))[0]
        rastro.append({"topo": topo - CY, "x": round(float(xs.mean()) - CX, 1)})
    else:
        rastro.append(None)
    if args.provas:
        # Quadros críticos: um a cada 4 s e o de mão mais aberta (só o maior até agora fica guardado).
        if escrito % (4 * args.fps) == 0:
            provas[escrito] = rgba.copy()
        if larguras[-1] >= max(larguras):
            provas = {k: v for k, v in provas.items() if k % (4 * args.fps) == 0}
            provas[escrito] = rgba.copy()
    escrito += 1

saida.stdin.close()
saida.wait()
entrada.kill()
total = time.perf_counter() - t_inicio

if args.provas:
    os.makedirs(args.provas, exist_ok=True)
    fundos = {"claro": (236, 238, 240), "escuro": (30, 31, 34), "laranja": (249, 115, 22)}
    for k in sorted(provas):
        q = provas[k].astype(np.float32)
        a = q[..., 3:4] / 255
        for nome, cor in fundos.items():
            comp = q[..., :3] * a + np.array(cor, np.float32) * (1 - a)
            cv2.imwrite(os.path.join(args.provas, f"q{k:04d}-{nome}.png"), cv2.cvtColor(comp.astype(np.uint8), cv2.COLOR_RGB2BGR))
        cv2.imwrite(os.path.join(args.provas, f"q{k:04d}-alfa.png"), provas[k][..., 3])

if args.rastro:
    with open(args.rastro, "w", encoding="utf-8") as f:
        json.dump({"fps": args.fps, "caixa": [CX, CY, CW, CH], "gravacao": [W, H], "inicio": args.inicio, "cabeca": rastro}, f)

print(json.dumps({
    "quadros": escrito,
    "aquecimento": n_aquecer,
    "largura": W,
    "altura": H,
    "ms_modelo_por_quadro": round(1000 * float(np.mean(tempos_modelo)), 1),
    "ms_total_por_quadro": round(1000 * float(np.mean(tempos_total)), 1),
    "s_de_processo_por_s_de_video": round(total / max(1e-6, escrito / args.fps), 2),
    "segundos_totais": round(total, 1),
    "quadro_mais_aberto": int(np.argmax(larguras)) if larguras else None,
}))
