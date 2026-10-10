// Os cartões das paradas, na faixa de baixo das telas de mapa: cartão-postal ilustrado de cada lugar,
// bilhete do transporte e o cartão da dica. Um grupo por parada: as vagas já nascem "a lápis" (traço
// cinza, nome apagado) e ganham papel, cor e tinta no instante em que o lugar é dito.
import { useId } from "react";
import { indicesDoTrecho, limitar, misturarCor, prog, temposDoTexto, TextoALapis } from "../anim";
import type { Lugar, Palavra, Transporte } from "../plano";
import { encaixar, encaixarNaCaixa } from "../medida";
import { CARTOES, CARTOES_ALTO, cor, display, sans } from "../tema";
import { Carimbo } from "./Carimbo";
import { Desenho, type NomeDesenho } from "./Desenhos";
import { type Caixa, PAINEL_FUNDO, Papel, Rotulo } from "./Papel";
import { CartaoComparacao, CartaoGrafico, CartaoLista, type FichaComparacao, type FichaGrafico, type FichaLista } from "./Universais";

export type Ficha =
  | { tipo: "lugar"; em: number; lugar: Lugar; numero: number; periodo?: string }
  | { tipo: "bilhete"; em: number; transporte: Transporte; rotulo: string; numero?: string; numeroEm?: number; periodo?: string }
  | {
      tipo: "dica";
      em: number;
      de: number;
      ate: number;
      rotulo: string;
      titulo: string;
      destaque?: string;
      icones: { em: number; desenho: NomeDesenho; rotulo?: string }[];
    }
  | FichaLista
  | FichaComparacao
  | FichaGrafico;

export type Grupo = {
  // quando o grupo entra (e o anterior sai)
  de: number;
  // quando o próximo grupo entra (ou o bloco de mapa acaba)
  ate: number;
  fichas: Ficha[];
  carimboEm?: number;
  // texto de baixo do carimbo (o período)
  carimboBase?: string;
  // texto do carimbo (padrão VISITADO) e tinta de alerta (telha)
  carimboTexto?: string;
  carimboAlerta?: boolean;
  // último grupo do bloco de mapa: sai descendo para fora da tela (a pessoa volta à tela cheia)
  fimDoBloco?: boolean;
  // grupo dos blocos universais (lista, comparação, gráfico): faixa mais alta
  alto?: boolean;
};

const NOME_DO_TRANSPORTE: Record<Transporte, string> = {
  bonde: "Bonde",
  trem: "Trem",
  metro: "Metrô",
  onibus: "Ônibus",
  barco: "Barco",
  aviao: "Avião",
  "a-pe": "A pé",
  bike: "Bike",
  carro: "Carro",
};
export const nomeDoTransporte = (t: Transporte) => NOME_DO_TRANSPORTE[t];

// ---------- pedaço de mapa: o desenho de um lugar sem ilustração (etapas, metáforas) ----------

const BLOCOS_MINI: [number, number, number, number][] = [
  [10, 14, 44, 26], [62, 10, 40, 30], [112, 16, 52, 24], [176, 12, 50, 28],
  [8, 52, 38, 28], [58, 54, 30, 24], [150, 50, 36, 26], [196, 54, 34, 30],
  [14, 138, 52, 30], [78, 146, 42, 24], [132, 140, 48, 28], [192, 142, 38, 26],
];

const MiniMapa: React.FC<{ largura: number; p: number; lapis?: boolean; numero: number }> = ({ largura, p, lapis, numero }) => {
  const rota = "M20 118 C 64 124 82 84 128 82 S 176 70 196 58";
  const pino = { x: 196, y: 58 };
  const cheio = lapis ? 0 : limitar((p - 0.2) / 0.5);
  const queda = lapis ? 0 : limitar((p - 0.45) / 0.4);
  const id = useId();
  return (
    <svg width={largura} height={largura * 0.75} viewBox="0 0 240 180" style={{ overflow: "visible" }}>
      <defs>
        <clipPath id={id}>
          <rect x={0} y={0} width={240 * limitar(p * 1.6)} height={180} />
        </clipPath>
      </defs>
      {BLOCOS_MINI.map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} rx={4} fill={cor.areiaFunda} opacity={lapis ? 0.5 : 0.5 + 0.5 * cheio} />
      ))}
      <path d="M0 100 C 60 94 120 112 240 90" fill="none" stroke={cor.papel} strokeWidth={13} opacity={lapis ? 0.6 : 1} />
      <path d={rota} fill="none" stroke={lapis ? cor.lapis : cor.azulejo} strokeWidth={5.5} strokeLinecap="round" strokeDasharray={lapis ? "1 11" : "0.1 11"} opacity={lapis ? 0.8 : 1} clipPath={lapis ? undefined : `url(#${id})`} />
      <circle cx={20} cy={118} r={6} fill={lapis ? cor.lapis : cor.azulejo} opacity={lapis ? 0.8 : cheio} />
      <g transform={`translate(${pino.x - 17} ${pino.y - 46 - (1 - queda) * 36}) scale(0.54)`} opacity={lapis ? 0.7 : limitar(queda * 1.6)}>
        <path d="M32 84 C 26 68, 5 54, 5 31 A 27 27 0 1 1 59 31 C 59 54, 38 68, 32 84 Z" fill={lapis ? "rgba(251,246,236,0.55)" : cor.azulejo} stroke={lapis ? cor.lapis : cor.papel} strokeWidth={5} strokeDasharray={lapis ? "8 8" : undefined} />
        <text x={32} y={42} textAnchor="middle" fontFamily={sans} fontWeight={700} fontSize={32} fill={lapis ? cor.lapis : cor.papel}>
          {numero}
        </text>
      </g>
    </svg>
  );
};

// ---------- cartão-postal de um lugar ----------

const CartaoLugar: React.FC<{ f: Extract<Ficha, { tipo: "lugar" }>; caixa: Caixa; t: number; giro: number; largo: boolean; direita?: boolean }> = ({
  f,
  caixa,
  t,
  giro,
  largo,
  direita,
}) => {
  const tinta = prog(t, f.em - 0.12, 0.45);
  const desenho = prog(t, f.em - 0.05, 1.0);
  const nome = f.lugar.nome;
  const pad = 22;
  if (largo) {
    // inteiro: ilustração à esquerda, nome à direita
    const painel = { w: 400, h: caixa.h - 2 * pad };
    const larguraTexto = caixa.w - painel.w - 3 * pad - 14;
    const { tamanho: corpo, linhas } = encaixar(nome, { largura: larguraTexto, max: 84, min: 58, linhas: 3, fonte: { peso: 600 } });
    return (
      <Papel caixa={caixa} tinta={tinta} giro={giro}>
        <div style={{ position: "absolute", left: pad, top: pad, width: painel.w, height: painel.h, borderRadius: 12, background: PAINEL_FUNDO(tinta), display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {f.lugar.desenho ? (
            <div style={{ position: "relative" }}>
              {tinta < 1 ? <Desenho nome={f.lugar.desenho} largura={painel.w - 24} lapis style={{ position: "absolute", left: 0, top: 0, opacity: 1 - tinta }} /> : null}
              <Desenho nome={f.lugar.desenho} largura={painel.w - 24} p={desenho} />
            </div>
          ) : (
            <MiniMapa largura={painel.w - 24} p={desenho} lapis={tinta < 0.05} numero={f.numero} />
          )}
        </div>
        <div style={{ position: "absolute", left: pad * 2 + painel.w + 8, top: pad + 8 }}>
          <Rotulo numero={f.numero} texto={f.periodo ?? ""} tinta={tinta} />
        </div>
        <div
          style={{
            position: "absolute",
            left: pad * 2 + painel.w + 8,
            width: larguraTexto,
            bottom: pad + 14,
            fontFamily: display,
            fontWeight: 600,
            fontSize: corpo,
            lineHeight: 1.04,
            color: misturarCor(cor.lapis, cor.tinta, tinta),
          }}
        >
          {linhas.map((l, i) => (
            <div key={i} style={{ whiteSpace: "nowrap" }}>
              {l}
            </div>
          ))}
        </div>
      </Papel>
    );
  }
  // metade: ilustração em cima (com a etiqueta do número e do período no canto), nome embaixo
  const painel = { w: caixa.w - 2 * pad, h: 214 };
  const { tamanho: corpo, linhas } = encaixar(nome, { largura: painel.w - 8, max: 72, min: 52, linhas: 2, fonte: { peso: 600 } });
  return (
    <Papel caixa={caixa} tinta={tinta} giro={giro}>
      <div style={{ position: "absolute", left: pad, top: pad, width: painel.w, height: painel.h, borderRadius: 12, background: PAINEL_FUNDO(tinta), display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {f.lugar.desenho ? (
          <div style={{ position: "relative", marginTop: 34 }}>
            {tinta < 1 ? <Desenho nome={f.lugar.desenho} largura={232} lapis style={{ position: "absolute", left: 0, top: 0, opacity: 1 - tinta }} /> : null}
            <Desenho nome={f.lugar.desenho} largura={232} p={desenho} traco={4.4} />
          </div>
        ) : (
          <div style={{ marginTop: 34 }}>
            <MiniMapa largura={232} p={desenho} lapis={tinta < 0.05} numero={f.numero} />
          </div>
        )}
      </div>
      {/* no cartão da direita a etiqueta vai para o canto direito: o carimbo bate no meio, entre os dois */}
      <div
        style={{
          position: "absolute",
          ...(direita ? { right: pad + 10 } : { left: pad + 10 }),
          top: pad + 10,
          padding: "0 16px 0 0",
          borderRadius: 26,
          background: `rgba(251,246,236,${0.4 + 0.5 * tinta})`,
        }}
      >
        <Rotulo numero={f.numero} texto={f.periodo ?? ""} tinta={tinta} />
      </div>
      <div
        style={{
          position: "absolute",
          left: pad + 4,
          width: painel.w,
          top: pad + painel.h + 14,
          fontFamily: display,
          fontWeight: 600,
          fontSize: corpo,
          lineHeight: 1.02,
          color: misturarCor(cor.lapis, cor.tinta, tinta),
        }}
      >
        {linhas.map((l, i) => (
          <div key={i} style={{ whiteSpace: "nowrap" }}>
            {l}
          </div>
        ))}
      </div>
    </Papel>
  );
};

// ---------- bilhete do transporte ----------

const Bilhete: React.FC<{ f: Extract<Ficha, { tipo: "bilhete" }>; caixa: Caixa; t: number; giro: number }> = ({ f, caixa, t, giro }) => {
  const tinta = prog(t, f.em - 0.12, 0.45);
  const desenho = prog(t, f.em - 0.05, 1.0);
  const numero = f.numero ? prog(t, (f.numeroEm ?? f.em) - 0.08, 0.35) : 0;
  const corte = caixa.h - 132;
  const pad = 22;
  const nomeDesenho = f.transporte as NomeDesenho;
  return (
    <div style={{ position: "absolute", left: caixa.x, top: caixa.y, width: caixa.w, height: caixa.h, rotate: `${giro}deg` }}>
      {/* papel com os dois recortes da picotagem */}
      <svg width={caixa.w} height={caixa.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: `drop-shadow(0 12px 18px rgba(60,44,20,${0.09 + 0.11 * tinta}))` }}>
        <path
          d={`M18 0 H${caixa.w - 18} Q${caixa.w} 0 ${caixa.w} 18 V${corte - 18} A18 18 0 0 0 ${caixa.w} ${corte + 18} V${caixa.h - 18} Q${caixa.w} ${caixa.h} ${caixa.w - 18} ${caixa.h} H18 Q0 ${caixa.h} 0 ${caixa.h - 18} V${corte + 18} A18 18 0 0 0 0 ${corte - 18} V18 Q0 0 18 0 Z`}
          fill={cor.papel}
          stroke={tinta < 0.98 ? cor.lapis : "none"}
          strokeOpacity={1 - tinta}
          strokeWidth={3}
          strokeDasharray="10 8"
        />
        <line x1={28} y1={corte} x2={caixa.w - 28} y2={corte} stroke={misturarCor(cor.lapis, cor.azulejo, tinta)} strokeOpacity={0.6} strokeWidth={3} strokeDasharray="2 10" strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", left: pad + 4, top: pad }}>
        <Rotulo texto={`Bilhete${f.periodo ? ` · ${f.periodo}` : ""}`} tinta={tinta} />
      </div>
      <div style={{ position: "absolute", left: pad, top: pad + 60, width: caixa.w - 2 * pad, height: corte - pad - 76, borderRadius: 12, background: PAINEL_FUNDO(tinta * 0.7), display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <div style={{ position: "relative" }}>
          {tinta < 1 ? <Desenho nome={nomeDesenho} largura={250} lapis style={{ position: "absolute", left: 0, top: 0, opacity: 1 - tinta }} /> : null}
          <Desenho nome={nomeDesenho} largura={250} p={desenho} traco={4.4} />
        </div>
      </div>
      {/* canhoto: o nome do transporte e a linha */}
      <div
        style={{
          position: "absolute",
          left: pad + 6,
          top: corte + 18,
          height: caixa.h - corte - 36,
          display: "flex",
          alignItems: "center",
          fontFamily: display,
          fontWeight: 600,
          fontSize: 64,
          color: misturarCor(cor.lapis, cor.tinta, tinta),
        }}
      >
        {f.rotulo}
      </div>
      {f.numero ? (
        <div
          style={{
            position: "absolute",
            right: pad + 8,
            top: corte + 8,
            height: caixa.h - corte - 16,
            display: "flex",
            alignItems: "center",
            fontFamily: display,
            fontWeight: 700,
            fontSize: 104,
            lineHeight: 1,
            color: misturarCor(cor.lapis, cor.azulejo, numero),
          }}
        >
          <span style={{ opacity: numero > 0 ? 1 : 0.9, translate: `0 ${(1 - numero) * 10}px`, display: "inline-block" }}>{numero > 0.02 ? f.numero : "··"}</span>
        </div>
      ) : null}
    </div>
  );
};

// ---------- cartão da dica ----------

const CartaoDica: React.FC<{ f: Extract<Ficha, { tipo: "dica" }>; caixa: Caixa; t: number; palavras: Palavra[] }> = ({ f, caixa, t, palavras }) => {
  const tinta = prog(t, f.em - 0.12, 0.45);
  const pad = 30;
  const larguraTexto = caixa.w - 2 * pad - 10;
  const { tamanho: corpo, linhas } = encaixar(f.titulo, { largura: larguraTexto, max: 76, min: 58, linhas: 2, fonte: { peso: 600 } });
  const tempos = temposDoTexto(f.titulo, palavras, f.de, f.ate, f.em);
  const destaque = indicesDoTrecho(f.titulo, f.destaque);
  const icones = f.icones.slice(0, 4);
  return (
    <Papel caixa={caixa} tinta={tinta} giro={-0.8}>
      <div style={{ position: "absolute", left: pad, top: pad - 4 }}>
        <Rotulo
          texto={f.rotulo}
          tinta={tinta}
          icone={
            <svg width={44} height={44} viewBox="0 0 44 44">
              <circle cx={22} cy={22} r={19} fill="none" stroke={cor.azulejo} strokeWidth={3} />
              <path d="M22 7 L27 22 L22 37 L17 22 Z" fill={cor.azulejo} />
              <path d="M22 22 L27 22 L22 37 Z" fill={cor.sol} />
            </svg>
          }
        />
      </div>
      <TextoALapis
        linhas={linhas}
        tempos={tempos}
        t={t}
        tinta={cor.tinta}
        lapis={cor.lapis}
        destaque={destaque}
        corDestaque={cor.azulejo}
        estiloDestaque={{ fontStyle: "italic" }}
        style={{ position: "absolute", left: pad, top: pad + 64, fontFamily: display, fontWeight: 600, fontSize: corpo, lineHeight: 1.06 }}
      />
      <div style={{ position: "absolute", left: pad, right: pad, bottom: pad - 2, display: "flex", gap: 26 }}>
        {icones.map((ic, i) => {
          const a = prog(t, ic.em - 0.1, 0.4);
          const d = prog(t, ic.em - 0.05, 0.9);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, opacity: 0.25 + 0.75 * a }}>
              <div
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: 52,
                  background: a > 0.5 ? cor.azulejoVeu : "transparent",
                  border: `3px ${a > 0.5 ? "solid" : "dashed"} ${misturarCor(cor.lapis, cor.azulejo, a)}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxSizing: "border-box",
                  scale: String(0.9 + 0.1 * a),
                }}
              >
                <Desenho nome={ic.desenho} largura={84} traco={3.2} p={d} lapis={a < 0.05} />
              </div>
              {ic.rotulo ? (
                <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 40, color: misturarCor(cor.lapis, cor.tinta, a), whiteSpace: "nowrap" }}>{ic.rotulo}</div>
              ) : null}
            </div>
          );
        })}
      </div>
    </Papel>
  );
};

// ---------- o grupo de uma parada ----------

const ESPACO = 14;
export const caixasDoGrupo = (n: number, alto = false): Caixa[] => {
  const faixa = alto ? CARTOES_ALTO : CARTOES;
  const h = faixa.base - faixa.topo;
  const largura = 1080 - 2 * 60;
  if (n <= 1) return [{ x: 60, y: faixa.topo, w: largura, h }];
  const w = (largura - ESPACO) / 2;
  return [
    { x: 60, y: faixa.topo, w, h },
    { x: 60 + w + ESPACO, y: faixa.topo, w, h },
  ];
};

export const GrupoDeCartoes: React.FC<{ g: Grupo; t: number; palavras: Palavra[]; saidaFinal: number }> = ({ g, t, palavras, saidaFinal }) => {
  // entra subindo por cima do grupo anterior (que apaga por baixo dele, sem se mexer);
  // o último do bloco desce para fora da tela enquanto a pessoa volta para a tela cheia
  // cartões de papel opaco "dados" sobre a pilha: o novo grupo sobe por cima do anterior, que fica
  // parado embaixo até ser coberto (nunca há quadro vazio nem um grupo transparecendo no outro)
  const entrada = prog(t, g.de + 0.05, 0.5);
  const fim = Math.min(g.ate, saidaFinal);
  const saida = g.fimDoBloco ? prog(t, fim - 0.05, 0.5, (x) => x * x) : prog(t, fim + 0.48, 0.08);
  if (entrada <= 0 || saida >= 1) return null;
  const fichas = g.fichas.slice(-2);
  const caixas = caixasDoGrupo(fichas.length, g.alto);
  const giros = fichas.length > 1 ? [-1.3, 1.1] : [-0.6];
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: limitar(entrada * 4) * (g.fimDoBloco ? 1 - limitar((saida - 0.6) / 0.4) : 1 - saida),
        translate: `0 ${(1 - entrada) * 380 + (g.fimDoBloco ? saida * 560 : 0)}px`,
      }}
    >
      {fichas.map((f, i) => {
        const caixa = caixas[i];
        if (f.tipo === "lugar") return <CartaoLugar key={i} f={f} caixa={caixa} t={t} giro={giros[i]} largo={fichas.length === 1} direita={i === 1} />;
        if (f.tipo === "bilhete") return <Bilhete key={i} f={f} caixa={caixa} t={t} giro={giros[i]} />;
        if (f.tipo === "lista") return <CartaoLista key={i} f={f} caixa={caixa} t={t} />;
        if (f.tipo === "comparacao") return <CartaoComparacao key={i} f={f} caixa={caixa} t={t} />;
        if (f.tipo === "grafico") return <CartaoGrafico key={i} f={f} caixa={caixa} t={t} />;
        return <CartaoDica key={i} f={f} caixa={caixa} t={t} palavras={palavras} />;
      })}
      {g.carimboEm !== undefined ? (
        <Carimbo
          x={fichas.length > 1 ? 540 : 1080 - 60 - 112}
          y={CARTOES.topo + (fichas.length > 1 ? 40 : -6)}
          r={fichas.length > 1 ? 100 : 96}
          em={g.carimboEm}
          t={t}
          topo={g.carimboTexto}
          alerta={g.carimboAlerta}
          base={g.carimboBase}
          giro={-13}
          ondas={fichas.length > 1}
        />
      ) : null}
    </div>
  );
};
