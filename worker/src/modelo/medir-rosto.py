"""
Mede o rosto nos quadros de medida do curso (09/10/2026).

No curso, o aluno (ou o Claude no computador dele) olha work/medir-1..3.jpg,
que vêm com uma grade de 0,05 em 0,05, e lê três frações do vídeo ORIGINAL:
--rosto-x e --rosto-y (centro do rosto, entre os olhos e a ponta do nariz) e
--queixo-y (altura do queixo). O cortar.mjs usa as três para escolher o
recorte e pôr os componentes abaixo do queixo.

Na Demandou ninguém olha o quadro: o Face Landmarker do MediaPipe (o mesmo
modelo da capa, worker/src/quadro-da-capa.py) lê os pontos do rosto nos três
quadros e devolve as mesmas frações. O centro é a média dos pontos entre as
sobrancelhas (168), a ponta do nariz (1) e os cantos externos dos olhos (33 e
263); o queixo é o ponto 152. Com rosto em mais de um quadro, vale a mediana
(a pessoa balança; o rastreio do curso corrige o resto pela simetria).

Contrato: argumento 1 JSON {"quadros": [caminho...], "modelo_rosto": caminho}.
Sai (stdout, uma linha JSON): {"rostoX", "rostoY", "queixoY", "quadros": n,
"largura": largura do rosto em fração, "achados": [por quadro]}; sem rosto em
nenhum quadro, {"erro": "..."}.
"""

import json
import sys

import cv2
import mediapipe as mp
from mediapipe.tasks.python import vision, BaseOptions


def mediana(v):
    o = sorted(v)
    m = len(o) // 2
    return o[m] if len(o) % 2 else (o[m - 1] + o[m]) / 2


def main():
    pedido = json.loads(sys.argv[1])
    detector = vision.FaceLandmarker.create_from_options(
        vision.FaceLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=pedido["modelo_rosto"]),
            num_faces=1,
            output_face_blendshapes=False,
        )
    )
    achados = []
    for caminho in pedido["quadros"]:
        bgr = cv2.imread(caminho)
        if bgr is None:
            continue
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        r = detector.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb))
        if not r.face_landmarks:
            continue
        pts = r.face_landmarks[0]
        centro = [pts[168], pts[1], pts[33], pts[263]]
        achados.append(
            {
                "quadro": caminho,
                "rostoX": sum(p.x for p in centro) / len(centro),
                "rostoY": sum(p.y for p in centro) / len(centro),
                "queixoY": pts[152].y,
                # bochecha a bochecha (pontos 234 e 454), em fração da largura do quadro
                "largura": abs(pts[454].x - pts[234].x),
            }
        )
    detector.close()
    if not achados:
        print(json.dumps({"erro": "nenhum rosto encontrado nos quadros de medida", "quadros": 0}))
        return
    saida = {
        "rostoX": round(mediana([a["rostoX"] for a in achados]), 3),
        "rostoY": round(mediana([a["rostoY"] for a in achados]), 3),
        "queixoY": round(mediana([a["queixoY"] for a in achados]), 3),
        "largura": round(mediana([a["largura"] for a in achados]), 3),
        "quadros": len(achados),
        "achados": achados,
    }
    print(json.dumps(saida))


if __name__ == "__main__":
    main()
