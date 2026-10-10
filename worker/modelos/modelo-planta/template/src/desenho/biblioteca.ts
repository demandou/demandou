// Biblioteca de desenhos a traço, no estilo de prancha de arquitetura.
// Cada desenho recebe a largura e a profundidade/altura JÁ EM PX e devolve caminhos SVG locais.
// PLANTA (vista de cima): posição canônica com a FRENTE do móvel para baixo (+y).
// ELEVAÇÃO (vista de frente): y = 0 no topo do objeto, y = h na base (apoio no chão).
import type { TipoObjeto } from "../plano";
import { circ, lin, onda, poli, ret, retR } from "./geometria";

export type Peso = "forte" | "medio" | "fino";
export type Linha = { d: string; peso: Peso; tracejado?: boolean };
export type Desenho = { fundo?: string; linhas: Linha[] };

// Tamanhos padrão em cm: planta = [largura, profundidade]; elevação = [largura, altura, altura da base]
export const TAMANHO_PLANTA: Record<TipoObjeto, [number, number]> = {
  sofa: [210, 90],
  poltrona: [80, 80],
  mesaCentro: [100, 55],
  mesa: [160, 90],
  mesaRedonda: [110, 110],
  cadeira: [45, 45],
  cama: [160, 200],
  criado: [45, 40],
  armario: [180, 60],
  estante: [160, 35],
  rack: [180, 45],
  tv: [120, 8],
  aparador: [140, 40],
  tapete: [200, 140],
  luminaria: [45, 45],
  pendente: [40, 40],
  vaso: [50, 50],
  cortina: [200, 15],
  bancada: [200, 60],
  janela: [120, 15],
  porta: [80, 80],
  quadro: [80, 4],
};

export const TAMANHO_ELEVACAO: Record<TipoObjeto, [number, number, number]> = {
  sofa: [210, 85, 0],
  poltrona: [80, 90, 0],
  mesaCentro: [100, 42, 0],
  mesa: [160, 75, 0],
  mesaRedonda: [110, 75, 0],
  cadeira: [45, 90, 0],
  cama: [160, 100, 0],
  criado: [45, 55, 0],
  armario: [180, 240, 0],
  estante: [160, 200, 0],
  rack: [180, 50, 0],
  tv: [120, 70, 90],
  aparador: [140, 80, 0],
  tapete: [200, 2, 0],
  luminaria: [45, 160, 0],
  pendente: [40, 30, 160],
  vaso: [45, 90, 0],
  cortina: [60, 250, 0],
  bancada: [200, 90, 0],
  janela: [160, 140, 90],
  porta: [80, 210, 0],
  quadro: [80, 60, 140],
};

const F = (d: string): Linha => ({ d, peso: "forte" });
const M = (d: string): Linha => ({ d, peso: "medio" });
const S = (d: string, tracejado = false): Linha => ({ d, peso: "fino", tracejado });

// ---------------- PLANTA ----------------

export const desenharPlanta = (tipo: TipoObjeto, w: number, h: number): Desenho => {
  const m = Math.min(w, h);
  switch (tipo) {
    case "sofa":
    case "poltrona": {
      const r = Math.min(8, m * 0.1);
      const encosto = h * (tipo === "sofa" ? 0.24 : 0.26);
      const braco = Math.min(w * (tipo === "sofa" ? 0.1 : 0.19), h * 0.3);
      const linhas = [
        F(retR(0, 0, w, h, r)),
        M(lin(braco, encosto, w - braco, encosto)),
        M(lin(braco, encosto, braco, h)),
        M(lin(w - braco, encosto, w - braco, h)),
      ];
      if (tipo === "sofa") {
        const n = w / h > 1.9 ? 3 : 2;
        for (let i = 1; i < n; i++) {
          const x = braco + (i * (w - 2 * braco)) / n;
          linhas.push(S(lin(x, encosto, x, h)));
        }
      }
      return { fundo: retR(0, 0, w, h, r), linhas };
    }
    case "cadeira":
      return { fundo: retR(0, 0, w, h, m * 0.12), linhas: [F(retR(0, 0, w, h, m * 0.12)), M(lin(0, h * 0.22, w, h * 0.22))] };
    case "mesaCentro":
    case "aparador":
    case "mesa": {
      const i = Math.min(m * 0.14, 10);
      return { fundo: ret(0, 0, w, h), linhas: [F(ret(0, 0, w, h)), S(ret(i, i, w - 2 * i, h - 2 * i))] };
    }
    case "mesaRedonda":
      return { fundo: circ(w / 2, h / 2, m / 2), linhas: [F(circ(w / 2, h / 2, m / 2)), S(circ(w / 2, h / 2, m * 0.4))] };
    case "cama": {
      const cabeceira = h * 0.06;
      const tt = h * 0.1;
      const tb = h * 0.23;
      return {
        fundo: ret(0, 0, w, h),
        linhas: [
          F(ret(0, 0, w, h)),
          M(lin(0, cabeceira, w, cabeceira)),
          S(retR(w * 0.08, tt, w * 0.38, tb - tt, 4)),
          S(retR(w * 0.54, tt, w * 0.38, tb - tt, 4)),
          M(lin(0, h * 0.32, w, h * 0.32)),
          S(lin(w * 0.62, h * 0.32, w, h * 0.5)),
        ],
      };
    }
    case "criado":
      return { fundo: ret(0, 0, w, h), linhas: [F(ret(0, 0, w, h)), S(circ(w / 2, h / 2, m * 0.24))] };
    case "armario": {
      const linhas = [F(ret(0, 0, w, h)), S(lin(w * 0.04, h * 0.5, w * 0.96, h * 0.5))];
      const cabides = Math.min(14, Math.floor(w / 14));
      for (let i = 1; i < cabides; i++) {
        const x = (i * w) / cabides;
        linhas.push(S(lin(x, h * 0.28, x, h * 0.72)));
      }
      return { fundo: ret(0, 0, w, h), linhas };
    }
    case "estante": {
      const linhas = [F(ret(0, 0, w, h))];
      const n = Math.max(2, Math.round(w / 55));
      for (let i = 1; i < n; i++) linhas.push(S(lin((i * w) / n, 0, (i * w) / n, h)));
      return { fundo: ret(0, 0, w, h), linhas };
    }
    case "rack":
      return {
        fundo: ret(0, 0, w, h),
        linhas: [F(ret(0, 0, w, h)), M(ret(w * 0.16, h * 0.14, w * 0.68, Math.max(3, h * 0.16)))],
      };
    case "tv":
    case "quadro":
      return { fundo: ret(0, 0, w, h), linhas: [F(ret(0, 0, w, h))] };
    case "tapete": {
      const i = Math.min(m * 0.06, 9);
      const linhas = [M(ret(0, 0, w, h)), S(ret(i, i, w - 2 * i, h - 2 * i), true)];
      // franjas nas pontas
      const passo = 9;
      for (let y = passo / 2; y < h; y += passo) {
        linhas.push(S(lin(-7, y, 0, y)));
        linhas.push(S(lin(w, y, w + 7, y)));
      }
      return { linhas };
    }
    case "luminaria":
      return {
        fundo: circ(w / 2, h / 2, m * 0.34),
        linhas: [M(circ(w / 2, h / 2, m * 0.34)), S(lin(w / 2 - m * 0.5, h / 2, w / 2 + m * 0.5, h / 2)), S(lin(w / 2, h / 2 - m * 0.5, w / 2, h / 2 + m * 0.5))],
      };
    case "pendente":
      return { linhas: [S(circ(w / 2, h / 2, m * 0.45), true), S(circ(w / 2, h / 2, m * 0.08))] };
    case "vaso": {
      const linhas = [M(circ(w / 2, h / 2, m * 0.26))];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + 0.3;
        linhas.push(S(lin(w / 2 + Math.cos(a) * m * 0.12, h / 2 + Math.sin(a) * m * 0.12, w / 2 + Math.cos(a) * m * 0.5, h / 2 + Math.sin(a) * m * 0.5)));
      }
      return { fundo: circ(w / 2, h / 2, m * 0.26), linhas };
    }
    case "cortina":
      return { linhas: [M(lin(0, h * 0.12, w, h * 0.12)), M(onda(0, w, h * 0.6, h * 0.28, Math.max(10, h * 0.9)))] };
    case "bancada": {
      const linhas = [F(ret(0, 0, w, h)), S(retR(w * 0.1, h * 0.2, w * 0.3, h * 0.6, 6)), S(circ(w * 0.25, h * 0.5, 3))];
      for (const [cx, cy] of [
        [0.6, 0.33],
        [0.8, 0.33],
        [0.6, 0.67],
        [0.8, 0.67],
      ])
        linhas.push(S(circ(w * cx, h * cy, Math.min(w * 0.07, h * 0.14))));
      return { fundo: ret(0, 0, w, h), linhas };
    }
    case "janela":
      return { fundo: ret(0, 0, w, h), linhas: [S(ret(0, 0, w, h)), S(lin(0, h / 2, w, h / 2))] };
    case "porta":
      return { linhas: [M(lin(0, 0, 0, h)), S(`M0 ${h}A${w} ${h} 0 0 0 ${w} 0`, true)] };
  }
};

// Pés do móvel (planta): cantos, recuados. Os da frente ficam do lado de baixo (y = h).
export const pesDoObjeto = (tipo: TipoObjeto, w: number, h: number) => {
  if (!["sofa", "poltrona", "cama", "mesa", "mesaCentro", "cadeira", "aparador", "rack", "criado"].includes(tipo)) return null;
  const r = Math.min(10, Math.min(w, h) * 0.1);
  return {
    frente: [
      [r, h - r],
      [w - r, h - r],
    ] as [number, number][],
    tras: [
      [r, r],
      [w - r, r],
    ] as [number, number][],
  };
};

// ---------------- ELEVAÇÃO ----------------

export const desenharElevacao = (tipo: TipoObjeto, w: number, h: number): Desenho => {
  switch (tipo) {
    case "janela": {
      const i = Math.min(8, w * 0.05);
      return {
        fundo: ret(0, 0, w, h),
        linhas: [F(ret(0, 0, w, h)), S(ret(i, i, w - 2 * i, h - 2 * i)), S(lin(w / 2, i, w / 2, h - i)), M(lin(-10, h, w + 10, h))],
      };
    }
    case "cortina": {
      const linhas = [M(lin(0, 0, 0, h)), M(lin(w, 0, w, h)), M(lin(0, h, w, h))];
      const dobras = Math.max(2, Math.round(w / 15));
      for (let i = 1; i < dobras; i++) linhas.push(S(lin((i * w) / dobras, 0, (i * w) / dobras, h)));
      return { fundo: ret(0, 0, w, h), linhas };
    }
    case "porta":
      return {
        fundo: ret(0, 0, w, h),
        linhas: [F(ret(0, 0, w, h)), S(ret(6, 6, w - 12, h - 6)), M(lin(w * 0.76, h * 0.5, w * 0.88, h * 0.5))],
      };
    case "sofa":
    case "poltrona": {
      const b = w * (tipo === "sofa" ? 0.09 : 0.16);
      const fundo = poli(
        [
          [b, 0],
          [w - b, 0],
          [w - b, h * 0.3],
          [w, h * 0.3],
          [w, h * 0.86],
          [0, h * 0.86],
          [0, h * 0.3],
          [b, h * 0.3],
        ],
        true,
      );
      const linhas = [
        F(fundo),
        M(lin(b, h * 0.3, b, h * 0.86)),
        M(lin(w - b, h * 0.3, w - b, h * 0.86)),
        M(lin(b, h * 0.52, w - b, h * 0.52)),
        S(lin(w * 0.05, h * 0.86, w * 0.05, h)),
        S(lin(w * 0.95, h * 0.86, w * 0.95, h)),
      ];
      if (tipo === "sofa") linhas.push(S(lin(w / 2, h * 0.52, w / 2, h * 0.86)), S(lin(w / 2, h * 0.04, w / 2, h * 0.52)));
      return { fundo, linhas };
    }
    case "mesa":
    case "mesaRedonda":
    case "mesaCentro": {
      const tampo = Math.max(4, h * 0.08);
      return {
        fundo: ret(0, 0, w, tampo),
        linhas: [F(ret(0, 0, w, tampo)), M(ret(w * 0.06, tampo, w * 0.035, h - tampo)), M(ret(w * 0.905, tampo, w * 0.035, h - tampo))],
      };
    }
    case "cadeira":
      return {
        linhas: [F(lin(0, h * 0.5, w, h * 0.5)), M(ret(w * 0.08, 0, w * 0.84, h * 0.08)), M(lin(w * 0.12, h * 0.08, w * 0.12, h)), M(lin(w * 0.88, h * 0.08, w * 0.88, h))],
      };
    case "bancada": {
      const tampo = Math.max(4, h * 0.05);
      const linhas = [F(ret(-5, 0, w + 10, tampo)), M(ret(0, tampo, w, h * 0.9 - tampo)), S(ret(w * 0.03, h * 0.9, w * 0.94, h * 0.1))];
      const portas = Math.max(2, Math.round(w / 60));
      for (let i = 1; i < portas; i++) linhas.push(S(lin((i * w) / portas, tampo, (i * w) / portas, h * 0.9)));
      for (let i = 0; i < portas; i++) {
        const cx = ((i + 0.5) * w) / portas;
        linhas.push(M(lin(cx - w * 0.05, tampo + h * 0.08, cx + w * 0.05, tampo + h * 0.08)));
      }
      return { fundo: ret(-5, 0, w + 10, h), linhas };
    }
    case "armario":
    case "rack":
    case "aparador":
    case "criado": {
      const pe = tipo === "armario" ? 0.04 : 0.12;
      const linhas = [F(ret(0, 0, w, h * (1 - pe))), S(lin(w * 0.04, h * (1 - pe), w * 0.04, h)), S(lin(w * 0.96, h * (1 - pe), w * 0.96, h))];
      const portas = Math.max(tipo === "criado" ? 1 : 2, Math.round(w / 60));
      for (let i = 1; i < portas; i++) linhas.push(S(lin((i * w) / portas, 0, (i * w) / portas, h * (1 - pe))));
      for (let i = 0; i < portas; i++) {
        const cx = ((i + 0.5) * w) / portas;
        const y = tipo === "armario" ? h * 0.45 : h * 0.2;
        linhas.push(M(lin(cx - Math.min(12, w * 0.04), y, cx + Math.min(12, w * 0.04), y)));
      }
      return { fundo: ret(0, 0, w, h), linhas };
    }
    case "estante": {
      const linhas = [F(ret(0, 0, w, h))];
      const n = Math.max(3, Math.round(h / 45));
      for (let i = 1; i < n; i++) linhas.push(S(lin(0, (i * h) / n, w, (i * h) / n)));
      return { fundo: ret(0, 0, w, h), linhas };
    }
    case "tv":
      return { fundo: ret(0, 0, w, h), linhas: [F(ret(0, 0, w, h)), S(ret(5, 5, w - 10, h - 10))] };
    case "quadro": {
      const i = Math.min(w, h) * 0.14;
      return { fundo: ret(0, 0, w, h), linhas: [F(ret(0, 0, w, h)), S(ret(i, i, w - 2 * i, h - 2 * i))] };
    }
    case "pendente": {
      const fundo = poli(
        [
          [w * 0.3, 0],
          [w * 0.7, 0],
          [w, h],
          [0, h],
        ],
        true,
      );
      return { fundo, linhas: [F(fundo)] };
    }
    case "luminaria":
      return {
        linhas: [
          F(poli([[w * 0.2, 0], [w * 0.8, 0], [w, h * 0.22], [0, h * 0.22]], true)),
          M(lin(w / 2, h * 0.22, w / 2, h)),
          M(lin(w * 0.25, h, w * 0.75, h)),
        ],
      };
    case "vaso": {
      const vaso = poli([[w * 0.18, h * 0.62], [w * 0.82, h * 0.62], [w * 0.72, h], [w * 0.28, h]], true);
      return {
        fundo: vaso,
        linhas: [
          M(vaso),
          S(`M${w * 0.5} ${h * 0.62}Q${w * 0.1} ${h * 0.4} ${w * 0.18} ${h * 0.12}Q${w * 0.42} ${h * 0.34} ${w * 0.5} ${h * 0.62}`),
          S(`M${w * 0.5} ${h * 0.62}Q${w * 0.9} ${h * 0.42} ${w * 0.84} ${h * 0.16}Q${w * 0.58} ${h * 0.36} ${w * 0.5} ${h * 0.62}`),
          S(`M${w * 0.5} ${h * 0.62}Q${w * 0.44} ${h * 0.2} ${w * 0.52} 0Q${w * 0.62} ${h * 0.28} ${w * 0.5} ${h * 0.62}`),
        ],
      };
    }
    case "cama":
      return {
        fundo: ret(0, 0, w, h),
        linhas: [F(ret(w * 0.02, 0, w * 0.96, h * 0.5)), F(ret(0, h * 0.45, w, h * 0.3)), M(ret(0, h * 0.75, w, h * 0.13)), S(lin(w * 0.04, h * 0.88, w * 0.04, h)), S(lin(w * 0.96, h * 0.88, w * 0.96, h))],
      };
    case "tapete":
      return { linhas: [M(ret(0, 0, w, Math.max(2, h)))] };
  }
};
