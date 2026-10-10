// O que cada tipo de momento desenha no espaço: os corpos em 3D, o fundo (calor das estrelas), o que
// fica atrás da pessoa e o que fica na frente; e os sons.
import React from "react";
import type { CorpoNaCena } from "../espaco/Corpos";
import type { Estacao } from "../espaco/camera";
import type { Momento, Plano } from "../plano";
import { CaminhoDaLuz, CoronaDaOrbita, Explosao, RotulosDaOrbita, corposDaOrbita, temposDaOrbita } from "./Orbita";
import { CoronaDoCeu, RotulosDoCeu, corposDoCeu } from "./Ceu";
import { UNIVERSAIS } from "./Universais";

export type PropsDoBloco = { plano: Plano; e: Estacao; t: number; proxEm: number | null };
export type Som = { t: number; src: string; vol: number };
export type BlocoDoEspaco = {
  corpos?: (plano: Plano, e: Estacao) => CorpoNaCena[];
  Fundo?: React.FC<PropsDoBloco>;
  Atras?: React.FC<PropsDoBloco>;
  Frente: React.FC<PropsDoBloco>;
  sons?: (m: Momento) => Som[];
};

const ORBITA: BlocoDoEspaco = {
  corpos: (_p, e) => corposDaOrbita(e),
  Fundo: ({ plano, e, t, proxEm }) => <CoronaDaOrbita plano={plano} e={e} t={t} ceuEm={proxEm} />,
  Atras: ({ plano, e, t, proxEm }) => <CaminhoDaLuz plano={plano} e={e} t={t} ceuEm={proxEm} />,
  Frente: ({ plano, e, t, proxEm }) => (
    <>
      <Explosao plano={plano} e={e} t={t} />
      <RotulosDaOrbita plano={plano} e={e} t={t} ceuEm={proxEm} />
    </>
  ),
  sons: (m) => {
    if (m.tipo !== "orbita") return [];
    const T = temposDaOrbita(m);
    const s: Som[] = [{ t: m.de - 0.1, src: "sfx/recuo.wav", vol: 0.3 }];
    if (T.ev !== null && m.evento) {
      if (m.evento.efeito === "apaga") s.push({ t: T.ev - 0.04, src: "sfx/apaga.wav", vol: 0.55 });
      if (m.evento.efeito === "acende") s.push({ t: T.ev - 1.7, src: "sfx/acende.wav", vol: 0.42 });
      if (m.evento.efeito === "explode") s.push({ t: T.ev - 0.02, src: "sfx/explode.wav", vol: 0.45 }, { t: T.ev + 0.35, src: "sfx/apaga.wav", vol: 0.3 });
    }
    return s;
  },
};

const CEU: BlocoDoEspaco = {
  corpos: (_p, e) => corposDoCeu(e),
  Fundo: ({ plano, e, t }) => <CoronaDoCeu plano={plano} e={e} t={t} />,
  Frente: ({ plano, e, t }) => <RotulosDoCeu plano={plano} e={e} t={t} />,
  sons: (m) => [{ t: m.de, src: "sfx/ceu.wav", vol: 0.28 }],
};

export const BLOCOS: Record<string, BlocoDoEspaco> = { orbita: ORBITA, ceu: CEU, ...UNIVERSAIS };

