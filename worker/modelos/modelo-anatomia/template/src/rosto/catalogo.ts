// O catálogo do rosto: cada estrutura que o plano pode citar (músculos e áreas). Para cada uma:
// onde a câmera vai (foco), a retícula que marca a região, o ponto do rótulo, as rugas que ela faz e a
// deformação (sobrancelha que sobe, testa que franze, olho que aperta). Coordenadas de cabeça (lado
// direito, x > 0): coroa y −0,80, sobrancelha −0,17, olhos −0,06, nariz 0,26, boca 0,38, queixo 0,63.

export type Rugas = "testa" | "glabela" | "pes" | "sulco" | "labial" | "marionete";
export type Deform = "fr" | "co" | "or";

export type ItemDoCatalogo = {
  // músculos desenhados que acendem (vazio = área da pele)
  musculos: string[];
  // câmera: ponto do rosto que vai para a tela, aproximação (px por unidade de cabeça) e giro
  foco: { fx: number; fy: number; S: number; yaw: number };
  // retícula (centro e raios, lado direito; no centro do rosto, x = 0)
  alvo: { x: number; y: number; rx: number; ry: number };
  // ponto onde a linha-guia do rótulo encosta (lado direito; espelha quando o rótulo vai à esquerda)
  ancora: [number, number];
  // true = no meio do rosto (o rótulo pode ir para qualquer lado)
  central: boolean;
  rugas?: Rugas;
  deform?: Deform;
  // traço da pele que acende junto (olheira, lábios)
  traco?: "olheira" | "labios" | "nariz";
};

const M = (musculos: string[], foco: [number, number, number, number], alvo: [number, number, number, number], ancora: [number, number], central: boolean, extra: Partial<ItemDoCatalogo> = {}): ItemDoCatalogo => ({
  musculos,
  foco: { fx: foco[0], fy: foco[1], S: foco[2], yaw: foco[3] },
  alvo: { x: alvo[0], y: alvo[1], rx: alvo[2], ry: alvo[3] },
  ancora,
  central,
  ...extra,
});

export const CATALOGO: Record<string, ItemDoCatalogo> = {
  // ——— músculos ———
  frontal: M(["frontal"], [0, -0.36, 520, 0.1], [0, -0.41, 0.39, 0.17], [0.22, -0.41], true, { rugas: "testa", deform: "fr" }),
  corrugador: M(["corrugador"], [0, -0.15, 730, 0.06], [0, -0.16, 0.1, 0.075], [0.13, -0.178], true, { rugas: "glabela", deform: "co" }),
  procero: M(["procero"], [0, -0.12, 780, 0], [0, -0.13, 0.065, 0.1], [0.03, -0.1], true, { rugas: "glabela", deform: "co" }),
  orbicularOlho: M(["orbicularOlho"], [0.25, -0.07, 900, -0.3], [0.2, -0.055, 0.21, 0.16], [0.37, -0.02], false, { rugas: "pes", deform: "or" }),
  orbicularBoca: M(["orbicularBoca"], [0, 0.38, 780, 0], [0, 0.382, 0.25, 0.12], [0.2, 0.43], true, { rugas: "labial" }),
  zigomaticoMaior: M(["zigomaticoMaior"], [0.25, 0.2, 640, -0.25], [0.28, 0.22, 0.1, 0.17], [0.33, 0.14], false, { rugas: "sulco" }),
  zigomaticoMenor: M(["zigomaticoMenor"], [0.22, 0.2, 700, -0.2], [0.22, 0.2, 0.07, 0.15], [0.25, 0.1], false, { rugas: "sulco" }),
  levantadorLabio: M(["levantadorLabio"], [0.17, 0.2, 720, -0.15], [0.17, 0.2, 0.07, 0.14], [0.18, 0.12], false, { rugas: "sulco" }),
  levantadorAsa: M(["levantadorAsa"], [0.08, 0.15, 760, -0.1], [0.085, 0.15, 0.05, 0.19], [0.09, 0.03], false),
  nasal: M(["nasal"], [0, 0.12, 800, 0], [0.04, 0.13, 0.09, 0.05], [0.07, 0.13], true, { traco: "nariz" }),
  risorio: M(["risorio"], [0.3, 0.36, 700, -0.25], [0.32, 0.37, 0.11, 0.04], [0.38, 0.36], false),
  depressorAngulo: M(["depressorAngulo"], [0.2, 0.48, 720, -0.2], [0.24, 0.48, 0.08, 0.09], [0.28, 0.5], false, { rugas: "marionete" }),
  depressorLabio: M(["depressorLabio"], [0.08, 0.48, 780, -0.1], [0.09, 0.49, 0.06, 0.07], [0.12, 0.5], false),
  mentual: M(["mentual"], [0, 0.52, 780, 0], [0, 0.53, 0.07, 0.07], [0.05, 0.55], true),
  masseter: M(["masseter"], [0.34, 0.25, 560, -0.42], [0.39, 0.25, 0.075, 0.2], [0.43, 0.2], false),
  temporal: M(["temporal"], [0.36, -0.2, 560, -0.42], [0.43, -0.2, 0.05, 0.18], [0.44, -0.26], false),
  // ——— áreas (pele: a camada de músculos não aparece) ———
  testa: M([], [0, -0.36, 520, 0.1], [0, -0.41, 0.39, 0.17], [0.22, -0.41], true, { rugas: "testa" }),
  glabela: M([], [0, -0.15, 730, 0.06], [0, -0.16, 0.1, 0.075], [0.08, -0.16], true, { rugas: "glabela" }),
  pesDeGalinha: M([], [0.27, -0.07, 900, -0.32], [0.34, -0.055, 0.075, 0.08], [0.38, -0.05], false, { rugas: "pes" }),
  olheira: M([], [0.2, -0.01, 900, -0.22], [0.19, 0.015, 0.1, 0.04], [0.27, 0.02], false, { traco: "olheira" }),
  palpebra: M([], [0.2, -0.07, 900, -0.22], [0.2, -0.085, 0.1, 0.035], [0.27, -0.09], false),
  nariz: M([], [0, 0.1, 680, 0], [0, 0.1, 0.09, 0.19], [0.08, 0.16], true, { traco: "nariz" }),
  macas: M([], [0.26, 0.08, 640, -0.28], [0.27, 0.09, 0.1, 0.07], [0.33, 0.07], false),
  bochecha: M([], [0.27, 0.25, 600, -0.3], [0.29, 0.25, 0.11, 0.1], [0.36, 0.24], false),
  sulco: M([], [0.15, 0.3, 720, -0.15], [0.165, 0.3, 0.05, 0.1], [0.19, 0.3], false, { rugas: "sulco" }),
  labios: M([], [0, 0.38, 800, 0], [0, 0.385, 0.2, 0.065], [0.15, 0.4], true, { rugas: "labial", traco: "labios" }),
  queixo: M([], [0, 0.53, 700, 0], [0, 0.54, 0.12, 0.08], [0.08, 0.56], true),
  mandibula: M([], [0.25, 0.42, 560, -0.32], [0.31, 0.43, 0.12, 0.14], [0.38, 0.42], false),
  pele: M([], [0, -0.08, 370, 0], [0, -0.08, 0.5, 0.62], [0.42, -0.2], true),
};

// nomes alternativos que a IA do aluno pode usar
const APELIDOS: Record<string, string> = {
  orbicular: "orbicularOlho",
  orbicularDoOlho: "orbicularOlho",
  orbicularDaBoca: "orbicularBoca",
  zigomatico: "zigomaticoMaior",
  bigodeChines: "sulco",
  nasogeniano: "sulco",
  malar: "macas",
  "11": "glabela",
  onze: "glabela",
  labio: "labios",
  boca: "labios",
  olho: "orbicularOlho",
  olhos: "orbicularOlho",
  mandibular: "mandibula",
  papada: "queixo",
  depressor: "depressorAngulo",
};

export const doCatalogo = (id: string): ItemDoCatalogo => CATALOGO[id] ?? CATALOGO[APELIDOS[id] ?? ""] ?? CATALOGO.pele;
export const ehMusculo = (id: string) => doCatalogo(id).musculos.length > 0;
