"""
Escolhe o quadro da capa pelo ROSTO e recorta a pessoa do fundo (30/09/2026).

## Por que existe

No teste de 29/09 o Bruno viu duas capas ruins pelo mesmo motivo de fundo:

1. O quadro real escolhido para a capa do corte pegava ele de OLHOS FECHADOS
   (o quadro saía de um instante fixo do trecho, a 15% do começo).
2. Para "consertar" o quadro, a capa pedia ao modelo de imagem para mudar a
   expressão, e o modelo redesenhou o rosto: sorriso inventado, feições de
   outra pessoa. Publicar o rosto errado de um cliente é dano que capa bonita
   nenhuma compensa.

A saída é não pedir nada ao modelo sobre o rosto: achar, entre muitos quadros
reais, o melhor como FOTO, e recortar a pessoa em código. O modelo de imagem
passa a fazer só o fundo, que não tem ninguém.

## Como o quadro é escolhido

O Face Landmarker do MediaPipe devolve 52 "blendshapes", notas de 0 a 1 para
cada movimento do rosto. As que importam para foto:

- eyeBlinkLeft/Right: olho fechado. É o defeito que mais estraga capa.
- jawOpen: boca aberta no meio de uma sílaba.
- mouthSmileLeft/Right: sorriso, que rende mais em canal pessoal.

E o tamanho do rosto no quadro (rosto minúsculo não serve de capa), e se ele
olha para a câmera (a matriz de transformação dá o giro da cabeça).

Roda em CPU, sem custo de API, e decide igual toda vez.

## Como o recorte é feito

Segmentador multiclasse do MediaPipe (fundo, cabelo, pele, roupa), que separa
o cabelo melhor que o de selfie usado no vídeo. Numa foto só, o custo não pesa.
A máscara ganha borda suave de 2 px e fica só o maior pedaço conectado, para
não levar almofada e prateleira junto.

## A nitidez (11/10/2026)

O Bruno, em 10/10: "as thumbs estão ficando horríveis, pegando uma imagem
distorcida da pessoa do vídeo; sempre pegar uma imagem nítida ou não colocar
foto". A nota acima olhava olho, boca e giro, e nada de nitidez: quadro no
meio de um gesto (borrão de movimento) ou rosto pequeno ampliado passava. Agora
cada candidato leva também a NITIDEZ do rosto: a variância do Laplaciano na
região do rosto, com o rosto levado a 256 px de largura (rosto pequeno ampliado
até lá perde detalhe e a nota cai, que é o que se quer). Quem DECIDE o quadro
é worker/src/quadro-nitido.mjs (regra pura, testada): este script só mede.

## Contrato

Entra (argumento 1, JSON): {"video" ou "imagem", "instantes": [s...],
"saida": prefixo, "modelo_rosto", "modelo_segmentacao"}.
Com "video": mede cada instante e sai {"candidatos": [{"instante", "quadro":
caminho jpg, "largura", "altura", "medida": {...} ou null}], "avaliados": n},
sem recorte (o recorte vem depois, com "imagem", do quadro escolhido).
Com "imagem": {"quadro", "recorte": caminho png RGBA, "rosto": caixa em
fração, "notas": {...}, "largura", "altura"}.
"""

import json
import subprocess
import sys

import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks.python import vision, BaseOptions


def ler_quadro(video, instante):
    """Um quadro em resolução cheia, BGR. None quando o ffmpeg não devolve."""
    dados = subprocess.run(
        ["ffmpeg", "-v", "error", "-ss", f"{instante:.3f}", "-i", video,
         "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "-"],
        capture_output=True,
    ).stdout
    if not dados:
        return None
    return cv2.imdecode(np.frombuffer(dados, np.uint8), cv2.IMREAD_COLOR)


def nitidez_do_rosto(bgr, caixa):
    """A variância do Laplaciano no rosto, com o rosto em 256 px de largura.

    A caixa ganha 15% de folga (testa e queixo entram). Rosto grande é
    reduzido (área); rosto pequeno é ampliado (linear) e perde nota, que é o
    certo: ampliado, ele sai mole na capa do mesmo jeito.
    """
    h, w = bgr.shape[:2]
    fx = caixa["w"] * 0.15
    fy = caixa["h"] * 0.15
    x0 = max(0, int((caixa["x"] - fx) * w))
    y0 = max(0, int((caixa["y"] - fy) * h))
    x1 = min(w, int((caixa["x"] + caixa["w"] + fx) * w))
    y1 = min(h, int((caixa["y"] + caixa["h"] + fy) * h))
    if x1 - x0 < 8 or y1 - y0 < 8:
        return 0.0
    cinza = cv2.cvtColor(bgr[y0:y1, x0:x1], cv2.COLOR_BGR2GRAY)
    escala = 256.0 / cinza.shape[1]
    modo = cv2.INTER_AREA if escala < 1 else cv2.INTER_LINEAR
    cinza = cv2.resize(cinza, (256, max(8, int(round(cinza.shape[0] * escala)))), interpolation=modo)
    return float(cv2.Laplacian(cinza, cv2.CV_64F).var())


def nota_do_rosto(detector, bgr):
    """A nota do quadro como FOTO de capa, e o que pesou nela.

    Os pesos saíram de olhar os quadros do vídeo de teste: olho fechado é o
    pior defeito (peso 3), boca aberta vem logo atrás (2), sorriso ajuda sem
    mandar (0,8). Cabeça virada mais de 25 graus perde a capa, porque rosto de
    perfil não conversa com quem vê a miniatura.
    """
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    r = detector.detect(img)
    if not r.face_landmarks:
        return None
    pts = r.face_landmarks[0]
    xs = [p.x for p in pts]
    ys = [p.y for p in pts]
    caixa = {"x": min(xs), "y": min(ys), "w": max(xs) - min(xs), "h": max(ys) - min(ys)}
    b = {c.category_name: c.score for c in r.face_blendshapes[0]} if r.face_blendshapes else {}
    piscada = max(b.get("eyeBlinkLeft", 0), b.get("eyeBlinkRight", 0))
    boca = b.get("jawOpen", 0)
    sorriso = (b.get("mouthSmileLeft", 0) + b.get("mouthSmileRight", 0)) / 2
    # Giro da cabeça pela matriz: o eixo z do rosto projetado no plano da imagem.
    giro = 0.0
    if r.facial_transformation_matrixes:
        m = np.array(r.facial_transformation_matrixes[0])
        giro = float(np.degrees(np.arctan2(m[0][2], m[2][2])))
    tamanho = max(0.0, caixa["w"]) * max(0.0, caixa["h"])
    nota = (
        -3.0 * piscada
        - 2.0 * boca
        + 0.8 * sorriso
        + min(tamanho, 0.12) * 8
        - (1.5 if abs(giro) > 25 else abs(giro) / 40)
    )
    return {
        "nota": round(nota, 4),
        "piscada": round(piscada, 3),
        "boca": round(boca, 3),
        "sorriso": round(sorriso, 3),
        "giro": round(giro, 1),
        "nitidez": round(nitidez_do_rosto(bgr, caixa), 1),
        "caixa": {k: round(v, 4) for k, v in caixa.items()},
    }


def recortar(segmentador, bgr):
    """A pessoa com fundo transparente (BGRA), borda suave e sem sobra."""
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    r = segmentador.segment(img)
    # No multiclasse a máscara 0 é o fundo; a pessoa é o complemento.
    fundo = np.squeeze(r.confidence_masks[0].numpy_view())
    pessoa = 1.0 - fundo
    if pessoa.shape[:2] != bgr.shape[:2]:
        pessoa = cv2.resize(pessoa, (bgr.shape[1], bgr.shape[0]), interpolation=cv2.INTER_LINEAR)
    dura = (pessoa > 0.5).astype(np.uint8)
    # Só o maior pedaço: o segmentador às vezes liga um objeto ao ombro.
    n, rotulos, stats, _ = cv2.connectedComponentsWithStats(dura, 8)
    if n > 1:
        maior = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
        dura = (rotulos == maior).astype(np.uint8)
    # Borda suave: a confiança do modelo dentro da região escolhida, com um
    # desfoque leve que tira o serrilhado sem deixar halo.
    alfa = np.clip(pessoa * dura, 0, 1)
    alfa = cv2.GaussianBlur(alfa, (0, 0), 1.2)
    alfa = np.clip((alfa - 0.15) / 0.7, 0, 1)
    bgra = cv2.cvtColor(bgr, cv2.COLOR_BGR2BGRA)
    bgra[:, :, 3] = (alfa * 255).astype(np.uint8)
    return bgra


def main():
    cfg = json.loads(sys.argv[1])
    detector = vision.FaceLandmarker.create_from_options(
        vision.FaceLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=cfg["modelo_rosto"]),
            output_face_blendshapes=True,
            output_facial_transformation_matrixes=True,
            num_faces=1,
        )
    )

    if cfg.get("imagem"):
        # Uma imagem pronta (o quadro já escolhido): mede e recorta.
        bgr = cv2.imread(cfg["imagem"], cv2.IMREAD_COLOR)
        if bgr is None:
            print(json.dumps({"erro": "imagem ilegível", "avaliados": 0}))
            return
        nota = nota_do_rosto(detector, bgr)
        # O segmentador só carrega aqui: a medição dos candidatos não recorta.
        segmentador = vision.ImageSegmenter.create_from_options(
            vision.ImageSegmenterOptions(
                base_options=BaseOptions(model_asset_path=cfg["modelo_segmentacao"]),
                output_category_mask=False,
                output_confidence_masks=True,
            )
        )
        quadro = cfg["saida"] + "-quadro.jpg"
        recorte_png = cfg["saida"] + "-recorte.png"
        cv2.imwrite(quadro, bgr, [cv2.IMWRITE_JPEG_QUALITY, 92])
        cv2.imwrite(recorte_png, recortar(segmentador, bgr))
        print(json.dumps({
            "instante": None,
            "quadro": quadro,
            "recorte": recorte_png,
            "rosto": nota["caixa"] if nota else None,
            "notas": nota,
            "avaliados": 1,
            "largura": int(bgr.shape[1]),
            "altura": int(bgr.shape[0]),
        }))
        return

    # Um vídeo: mede cada instante e guarda o quadro em resolução cheia. A
    # escolha é de quadro-nitido.mjs; o recorte sai depois, só do escolhido.
    candidatos = []
    avaliados = 0
    for i, t in enumerate(cfg["instantes"]):
        bgr = ler_quadro(cfg["video"], t)
        if bgr is None:
            continue
        avaliados += 1
        nota = nota_do_rosto(detector, bgr)
        if nota is None:
            candidatos.append({"instante": t, "quadro": None, "largura": int(bgr.shape[1]), "altura": int(bgr.shape[0]), "medida": None})
            continue
        quadro = f"{cfg['saida']}-c{i}.jpg"
        cv2.imwrite(quadro, bgr, [cv2.IMWRITE_JPEG_QUALITY, 95])
        candidatos.append({"instante": t, "quadro": quadro, "largura": int(bgr.shape[1]), "altura": int(bgr.shape[0]), "medida": nota})
    print(json.dumps({"candidatos": candidatos, "avaliados": avaliados}))


if __name__ == "__main__":
    main()
