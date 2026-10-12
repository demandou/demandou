import React, { createContext, useContext } from "react";
import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { ALTURA, DADOS, LARGURA } from "./dados";
import { MARCA } from "./marca";
import { caminhoDaMoldura, cantosDaForma, misturarCaixa, misturarCantos, recuarMoldura, type Caixa, type Cantos } from "./moldura";
import { emSegundos, type QuadroDoApresentador } from "./roteiro";
import { k, MEIO, mix, suavizar } from "./tempo";

/**
 * O APRESENTADOR, desenhado pelo kit e nunca pela cena (aulas 7, 8.1 e 8.2):
 *
 * - tela cheia ou numa janela (moldura) com o rosto centrado pelo rastro do
 *   Face Landmarker, acompanhando a gravação sem tremer;
 * - a transição entre enquadramentos é uma interpolação da janela, dos cantos,
 *   da escala e do rosto (nada de corte seco nem de empurrar a pessoa);
 * - com RECORTE (o WebM com alfa do RVM), o fundo da gravação some e a pessoa
 *   fica sobre o estúdio; com moldura, o corpo fica dentro dela e, com
 *   `cabecaPorFora`, cabeça e ombros passam por cima da borda de cima, pelas
 *   máscaras complementares da MESMA camada no MESMO quadro (nada se duplica);
 * - o que a cena põe em Atras fica atrás da pessoa (oclusão real pelo alfa), e
 *   o que põe em Frente fica à frente.
 *
 * A geometria do quadro atual vai para as cenas por `useApresentador()`.
 */
const W = DADOS.gravacao.largura;
const H = DADOS.gravacao.altura;
const CHEIA: Caixa = { x: 0, y: 0, l: LARGURA, a: ALTURA };
const RECUO = 8;

type Estado = {
  caixa: Caixa;
  cantos: Cantos;
  borda: number;
  recorte: number;
  cabecaPorFora: number;
  escala: number;
  rosto: { x: number; y: number };
  base: number;
  acompanhar: number;
  inclinacao: number;
};

const ehCheia = (c: Caixa) => c.x <= 0 && c.y <= 0 && c.l >= LARGURA && c.a >= ALTURA;

/**
 * O CORPO QUE A GRAVAÇÃO TEM (12/10, o teste do Bruno): do topo da cabeça até
 * onde a gravação termina, em px da gravação. A escala fixa de 1,15 só servia à
 * gravação do teste; a gravação do OBS, de busto, saía cortada nos ombros numa
 * janela pequena e com uma faixa vazia embaixo.
 */
const medianaDe = (xs: number[]) => (xs.length ? [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] : 0);
const TOPO_DA_CABECA_NA_GRAVACAO = DADOS.recorte ? DADOS.recorte.caixa[1] + medianaDe(DADOS.recorte.cabeca.filter(Boolean).map((c) => c!.topo)) : H * 0.2;
const CORPO_NA_GRAVACAO = Math.max(1, H - TOPO_DA_CABECA_NA_GRAVACAO);

/**
 * A ESCALA DO RECORTE PELO CORPO, para qualquer gravação: o corpo vai do topo da
 * cabeça pedido até a base (a da janela, ou a do quadro na tela cheia). Com a
 * cabeça por fora, ela passa 12% da janela acima da borda; sem, fica 5% abaixo.
 * Na tela cheia, o topo da cabeça fica a 29% da altura (560 de 1920, a aula 8.2).
 * Puro (testado pelas provas do roteiro).
 */
export function escalaDoRecorte(caixa: Caixa, base: number, cabecaPorFora: boolean, corpo = CORPO_NA_GRAVACAO): number {
  const alvoDoTopo = ehCheia(caixa) || caixa.a <= 0 ? ALTURA * 0.29 : cabecaPorFora ? caixa.y - caixa.a * 0.12 : caixa.y + caixa.a * 0.05;
  const e = (base - alvoDoTopo) / corpo;
  return Math.min(2.4, Math.max(0.7, Number.isFinite(e) ? e : 1.15));
}
const cobrir = (c: Caixa) => Math.max(c.l / W, c.a / H);

function resolver(q: QuadroDoApresentador): Estado {
  const caixa = q.caixa ?? CHEIA;
  const cheia = ehCheia(caixa);
  const recorte = Boolean(q.recorte && DADOS.recorte);
  const borda = q.borda ?? !cheia;
  // Com recorte NO CORTE EM PÉ, a base e a escala são do KIT (12/10): o corpo até a base, qualquer
  // que seja a gravação; na tela cheia, o corpo chega à base do quadro (sem faixa vazia embaixo).
  // O completo deitado segue como foi aprovado (escala 1, nativa).
  const baseDoRecorte = q.base ?? (borda && !cheia && caixa.a > 0 ? caixa.y + caixa.a : ALTURA);
  if (recorte && ALTURA > LARGURA && (DADOS as { enquadramento?: string }).enquadramento === "adaptativo") {
    return {
      caixa,
      cantos: cantosDaForma(q.forma ?? (cheia ? "reta" : "arredondada"), caixa),
      borda: borda ? 1 : 0,
      recorte: 1,
      cabecaPorFora: q.cabecaPorFora ? 1 : 0,
      escala: escalaDoRecorte(caixa, baseDoRecorte, Boolean(q.cabecaPorFora)),
      rosto: q.rosto ?? { x: caixa.x + caixa.l / 2, y: caixa.y + caixa.a * 0.38 },
      base: baseDoRecorte,
      acompanhar: Math.min(1, Math.max(0, q.acompanhar ?? 0.6)),
      inclinacao: q.inclinacao ?? 0,
    };
  }
  return {
    caixa,
    cantos: cantosDaForma(q.forma ?? (cheia ? "reta" : "arredondada"), caixa),
    borda: borda ? 1 : 0,
    recorte: recorte ? 1 : 0,
    cabecaPorFora: q.cabecaPorFora ? 1 : 0,
    escala: q.escala ?? (recorte ? 1.15 : cheia ? cobrir(caixa) : cobrir(caixa) * 1.08),
    rosto: q.rosto ?? { x: caixa.x + caixa.l / 2, y: caixa.y + caixa.a * 0.38 },
    base: q.base ?? (borda && !cheia && caixa.a > 0 ? caixa.y + caixa.a : Math.round(ALTURA * 0.9375)),
    acompanhar: Math.min(1, Math.max(0, q.acompanhar ?? 0.6)),
    inclinacao: q.inclinacao ?? 0,
  };
}

function misturar(a: Estado, b: Estado, p: number): Estado {
  return {
    caixa: misturarCaixa(a.caixa, b.caixa, p),
    cantos: misturarCantos(a.cantos, b.cantos, p),
    borda: mix(a.borda, b.borda, p),
    recorte: mix(a.recorte, b.recorte, p),
    cabecaPorFora: mix(a.cabecaPorFora, b.cabecaPorFora, p),
    escala: mix(a.escala, b.escala, p),
    rosto: { x: mix(a.rosto.x, b.rosto.x, p), y: mix(a.rosto.y, b.rosto.y, p) },
    base: mix(a.base, b.base, p),
    acompanhar: mix(a.acompanhar, b.acompanhar, p),
    inclinacao: mix(a.inclinacao, b.inclinacao, p),
  };
}

// O rosto: o rastro (já suavizado em 0,8 s) e a tendência lenta (3 s). A janela segue a
// tendência e `acompanhar` da diferença: segue a pessoa sem tremer junto com cada gesto.
const ROSTO = DADOS.rosto.length ? DADOS.rosto : [{ x: W / 2, y: H * 0.4, queixo: H * 0.55 }];
const LENTO_X = suavizar(ROSTO.map((r) => r.x), 45);
const LENTO_Y = suavizar(ROSTO.map((r) => r.y), 45);
const pontoDoRosto = (f: number) => ROSTO[Math.min(ROSTO.length - 1, Math.max(0, f))];

// A cabeça do recorte (topo e centro), com o último valor conhecido onde o quadro não achou.
const CABECA = (() => {
  const lista = DADOS.recorte?.cabeca ?? [];
  let ultimo = lista.find(Boolean) ?? null;
  return lista.map((c) => (ultimo = c ?? ultimo));
})();
const CABECA_X = suavizar(CABECA.map((c) => c?.x ?? 0), 6);

export type QuadrosResolvidos = { em: number; transicao: number; estado: Estado }[];

export function resolverQuadros(quadros: QuadroDoApresentador[]): QuadrosResolvidos {
  const lista = (quadros.length ? quadros : [{ em: 0 } as QuadroDoApresentador])
    .map((q) => ({ em: emSegundos(q.em), transicao: Math.max(0.05, q.transicao ?? 0.9), estado: resolver(q) }))
    .sort((a, b) => a.em - b.em);
  return lista;
}

function estadoEm(t: number, qs: QuadrosResolvidos): { estado: Estado; transicao: number } {
  let i = 0;
  for (let j = 0; j < qs.length; j++) if (qs[j].em <= t) i = j;
  if (i === 0 || t < qs[0].em) return { estado: qs[0].estado, transicao: 1 };
  const p = k(t, qs[i].em, qs[i].em + qs[i].transicao, MEIO);
  return { estado: misturar(qs[i - 1].estado, qs[i].estado, p), transicao: p };
}

export type Apresentador = {
  /** A janela agora (px do quadro). Na tela cheia, o quadro inteiro. */
  caixa: Caixa;
  /** A janela recuada (onde a imagem da pessoa está de fato). */
  dentro: Caixa;
  /** 0 a 1: quanto da moldura está desenhada. */
  borda: number;
  /** 0 a 1: quanto do recorte está valendo (1 = sem o fundo da gravação). */
  recorte: number;
  cheia: boolean;
  /** O centro do rosto, o queixo e uma caixa em volta do rosto, em px do quadro. Não cubra esta caixa. */
  rosto: { x: number; y: number; queixo: number; caixa: Caixa };
  /** Com recorte: o topo da cabeça e o centro dela em px do quadro (para pôr a palavra atrás da cabeça). */
  cabeca: { x: number; topo: number } | null;
  /** Com recorte: o y onde a gravação termina (a base do corpo). */
  baseDaGravacao: number;
};

const Contexto = createContext<Apresentador | null>(null);

/** A geometria do apresentador no quadro atual (dentro de uma cena). */
export function useApresentador(): Apresentador {
  const a = useContext(Contexto);
  if (!a) throw new Error("useApresentador() só funciona dentro do Palco");
  return a;
}

/**
 * A ÁREA LIVRE AO LADO DA JANELA (11/10, teste da Maquete 3D em 16:9: o título do topo,
 * centrado no quadro, passava por cima da moldura da pessoa). O maior retângulo do quadro
 * que não cruza a janela: o lado (esquerdo ou direito) mais largo; se a janela ocupa a
 * largura toda, a faixa de cima ou de baixo mais alta. `margem` afasta da janela e da borda. Puro.
 */
export function areaLivreDe(caixa: Caixa, largura: number, altura: number, margem = 40): Caixa {
  const esquerda = caixa.x - 2 * margem;
  const direita = largura - (caixa.x + caixa.l) - 2 * margem;
  if (Math.max(esquerda, direita) >= largura * 0.25) {
    return direita >= esquerda
      ? { x: caixa.x + caixa.l + margem, y: margem, l: direita, a: altura - 2 * margem }
      : { x: margem, y: margem, l: esquerda, a: altura - 2 * margem };
  }
  const cima = caixa.y - 2 * margem;
  const baixo = altura - (caixa.y + caixa.a) - 2 * margem;
  return cima >= baixo
    ? { x: margem, y: margem, l: largura - 2 * margem, a: Math.max(0, cima) }
    : { x: margem, y: caixa.y + caixa.a + margem, l: largura - 2 * margem, a: Math.max(0, baixo) };
}

/** A área livre no quadro atual (dentro de uma cena): título e cartão vão nela e nunca cruzam a janela. */
export function useAreaLivre(margem = 40): Caixa {
  return areaLivreDe(useApresentador().caixa, LARGURA, ALTURA, margem);
}

type Desenho = { estado: Estado; plano: { x: number; y: number; escala: number }; alfa: { x: number; y: number; escala: number }; apresentador: Apresentador };

/** A conta do quadro atual: onde fica cada camada e o que a cena precisa saber. */
export function medirApresentador(f: number, t: number, qs: QuadrosResolvidos): Desenho {
  const { estado: e } = estadoEm(t, qs);
  const r = pontoDoRosto(f);
  const lx = LENTO_X[Math.min(LENTO_X.length - 1, f)] ?? r.x;
  const ly = LENTO_Y[Math.min(LENTO_Y.length - 1, f)] ?? r.y;
  const sx = lx + e.acompanhar * (r.x - lx);
  const sy = ly + e.acompanhar * (r.y - ly);

  // sem recorte: a gravação cobre a janela inteira, com o rosto no alvo até onde der
  const escPlano = Math.max(e.escala, cobrir(e.caixa));
  const px = Math.min(e.caixa.x, Math.max(e.caixa.x + e.caixa.l - W * escPlano, e.rosto.x - sx * escPlano));
  const py = Math.min(e.caixa.y, Math.max(e.caixa.y + e.caixa.a - H * escPlano, e.rosto.y - sy * escPlano));
  // com recorte: o rosto no alvo na horizontal; na vertical, a base da gravação na base pedida
  const ax = e.rosto.x - sx * e.escala;
  const ay = e.base - H * e.escala;

  const usaAlfa = e.recorte >= 0.5;
  const ox = usaAlfa ? ax : px;
  const oy = usaAlfa ? ay : py;
  const esc = usaAlfa ? e.escala : escPlano;
  const rx = ox + r.x * esc;
  const ry = oy + r.y * esc;
  const rq = oy + r.queixo * esc;
  const meio = Math.max(20, rq - ry);
  const c = CABECA[Math.min(CABECA.length - 1, f)];
  const cabeca =
    DADOS.recorte && c
      ? { x: ax + (DADOS.recorte.caixa[0] + (CABECA_X[Math.min(CABECA_X.length - 1, f)] || c.x)) * e.escala, topo: ay + (DADOS.recorte.caixa[1] + c.topo) * e.escala }
      : null;
  const dentro = recuarMoldura(e.caixa, e.cantos, RECUO).caixa;
  return {
    estado: e,
    plano: { x: px, y: py, escala: escPlano },
    alfa: { x: ax, y: ay, escala: e.escala },
    apresentador: {
      caixa: e.caixa,
      dentro,
      borda: e.borda,
      recorte: e.recorte,
      cheia: ehCheia(e.caixa),
      rosto: { x: rx, y: ry, queixo: rq, caixa: { x: rx - meio * 1.15, y: ry - meio * 1.55, l: meio * 2.3, a: meio * 2.75 } },
      cabeca,
      baseDaGravacao: usaAlfa ? ay + H * e.escala : py + H * escPlano,
    },
  };
}

export const ProvedorDoApresentador: React.FC<{ valor: Apresentador; children: React.ReactNode }> = ({ valor, children }) => (
  <Contexto.Provider value={valor}>{children}</Contexto.Provider>
);

/** A camada do apresentador (moldura, painel, vídeo e acabamento). Desenhada pelo Palco. */
export const CamadaDoApresentador: React.FC<{ desenho: Desenho }> = ({ desenho }) => {
  const { estado: e, plano, alfa } = desenho;
  const caminho = caminhoDaMoldura(e.caixa, e.cantos);
  const rec = recuarMoldura(e.caixa, e.cantos, RECUO);
  const caminhoDentro = caminhoDaMoldura(rec.caixa, rec.cantos);
  const temJanela = e.caixa.a > 2 && e.caixa.l > 2;
  const cheia = ehCheia(e.caixa);
  const moldura = e.borda > 0.01 && temJanela && !cheia;
  const opPlano = 1 - e.recorte;
  const opAlfa = DADOS.recorte ? e.recorte : 0;
  const R = DADOS.recorte;
  const fundoDaGravacao = alfa.y + H * alfa.escala;
  // Corte entre as duas máscaras do recorte: 1 px de sobreposição (sem fresta na emenda).
  const corte = temJanela ? rec.caixa.y + 1 : fundoDaGravacao;
  const estiloAlfa: React.CSSProperties = R
    ? { position: "absolute", left: alfa.x + R.caixa[0] * alfa.escala, top: alfa.y + R.caixa[1] * alfa.escala, width: R.caixa[2] * alfa.escala, height: R.caixa[3] * alfa.escala }
    : {};
  const desbotarBase = `linear-gradient(to bottom, #000 0px, #000 ${Math.round(fundoDaGravacao - 240)}px, transparent ${Math.round(fundoDaGravacao - 8)}px)`;
  const giro = e.inclinacao ? { transform: `perspective(1600px) rotateY(${e.inclinacao}deg)`, transformOrigin: `${e.caixa.x}px ${e.caixa.y + e.caixa.a / 2}px` } : {};

  // o canto chanfrado maior leva o destaque da marca (aulas 8.1 e 8.2)
  // (empate, como na chanfrada: o de cima à direita, como na prova da aula 8.1)
  let cantoDoDestaque = -1;
  for (const i of [1, 2, 3, 0]) {
    const c = e.cantos[i];
    if (c.chanfro > 8 && (cantoDoDestaque < 0 || c.chanfro > e.cantos[cantoDoDestaque].chanfro + 0.5)) cantoDoDestaque = i;
  }
  const destaque = (() => {
    if (cantoDoDestaque < 0) return null;
    const { x, y, l, a } = e.caixa;
    const C = e.cantos[cantoDoDestaque].chanfro;
    const s = 36;
    switch (cantoDoDestaque) {
      case 0:
        return `M ${x} ${y + C + s} L ${x} ${y + C} L ${x + C} ${y} L ${x + C + s} ${y}`;
      case 1:
        return `M ${x + l - C - s} ${y} L ${x + l - C} ${y} L ${x + l} ${y + C} L ${x + l} ${y + C + s}`;
      case 2:
        return `M ${x + l} ${y + a - C - s} L ${x + l} ${y + a - C} L ${x + l - C} ${y + a} L ${x + l - C - s} ${y + a}`;
      default:
        return `M ${x + C + s} ${y + a} L ${x + C} ${y + a} L ${x} ${y + a - C} L ${x} ${y + a - C - s}`;
    }
  })();
  const todosChanfrados = e.cantos.every((c) => c.chanfro > 8);
  const contornoFora = todosChanfrados ? caminhoDaMoldura({ x: e.caixa.x - 12, y: e.caixa.y - 12, l: e.caixa.l + 24, a: e.caixa.a + 24 }, e.cantos.map((c) => ({ raio: c.raio + 12, chanfro: c.chanfro + 5 })) as Cantos) : null;
  const assimetrica = e.cantos[0].raio > 60 && e.cantos[2].chanfro > 20;

  return (
    <AbsoluteFill style={giro}>
      {/* painel e sombra da moldura (atrás da pessoa) */}
      {moldura ? (
        <svg width={LARGURA} height={ALTURA} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <defs>
            <linearGradient id="kit-painel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={MARCA.painelClaro} />
              <stop offset="1" stopColor={MARCA.fundo} />
            </linearGradient>
            <filter id="kit-sombra" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="18" stdDeviation="22" floodColor="#000" floodOpacity={MARCA.escuro ? 0.55 : 0.25} />
            </filter>
          </defs>
          <path d={caminho} fill="url(#kit-painel)" opacity={e.borda} filter="url(#kit-sombra)" />
        </svg>
      ) : null}

      {/* a gravação com o fundo (sem recorte), dentro da janela */}
      {opPlano > 0.001 && temJanela ? (
        <AbsoluteFill style={{ clipPath: cheia ? undefined : `path("${caminho}")`, opacity: opPlano }}>
          <OffthreadVideo
            src={staticFile("trecho.mp4")}
            muted
            style={{ position: "absolute", left: plano.x, top: plano.y, width: W * plano.escala, height: H * plano.escala, maxWidth: "none" }}
          />
        </AbsoluteFill>
      ) : null}

      {/* o recorte: dentro da janela (forma recuada) */}
      {opAlfa > 0.001 && R ? (
        <>
          <AbsoluteFill style={{ clipPath: cheia ? undefined : `path("${caminhoDentro}")`, opacity: opAlfa, ...(cheia ? { WebkitMaskImage: desbotarBase, maskImage: desbotarBase } : {}) }}>
            <OffthreadVideo src={staticFile("alfa.webm")} transparent muted style={{ ...estiloAlfa, maxWidth: "none" }} />
          </AbsoluteFill>
          {/* fora da janela: só acima da borda de cima (cabeça e ombros), com a base desbotada */}
          {!cheia && e.cabecaPorFora > 0.001 ? (
            <AbsoluteFill
              style={{
                opacity: opAlfa * e.cabecaPorFora,
                clipPath: `polygon(-3000px -3000px, 4080px -3000px, 4080px ${corte}px, -3000px ${corte}px)`,
                WebkitMaskImage: desbotarBase,
                maskImage: desbotarBase,
              }}
            >
              <OffthreadVideo src={staticFile("alfa.webm")} transparent muted style={{ ...estiloAlfa, maxWidth: "none" }} />
            </AbsoluteFill>
          ) : null}
        </>
      ) : null}

      {/* o acabamento à frente: a borda se desenha, o contorno duplo e o canto em destaque */}
      {moldura ? (
        <svg width={LARGURA} height={ALTURA} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <path d={caminho} fill="none" stroke={MARCA.titulo} strokeWidth={3} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - e.borda} />
          {contornoFora ? <path d={contornoFora} fill="none" stroke={MARCA.titulo} strokeOpacity={0.45 * e.borda} strokeWidth={1.5} /> : null}
          {destaque ? (
            <path
              d={destaque}
              fill="none"
              stroke={MARCA.destaque}
              strokeWidth={7}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={1 - k(e.borda, 0.55, 1)}
            />
          ) : null}
          {assimetrica
            ? [
                [e.caixa.x - 22, e.caixa.y + e.caixa.a + 22, 1, -1],
                [e.caixa.x + e.caixa.l + 22, e.caixa.y - 22, -1, 1],
              ].map(([x, y, sx, sy], i) => (
                <path key={i} d={`M ${x} ${y + sy * 34} L ${x} ${y} L ${x + sx * 34} ${y}`} fill="none" stroke={MARCA.linhaForte} strokeWidth={2} opacity={k(e.borda, 0.6 + i * 0.1, 1)} />
              ))
            : null}
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};
