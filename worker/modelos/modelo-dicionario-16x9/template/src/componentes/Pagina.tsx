import { AbsoluteFill, staticFile } from "remotion";
import type { Regiao } from "../layout";
import type { Palavra, Vizinho } from "../plano";
import { Abonacao } from "./Abonacao";
import { BASE, cor, LARGURA_UTIL, MARGEM, sans, serif, TOPO, CABECALHO_Y, W } from "../tema";

// Corpo dos verbetes vizinhos (fundo da página): legível, mas recuado em tinta
export const CORPO_VIZINHO = 36;
const ENTRELINHA = 1.27;
const ESPACO_ENTRE = 8;

// Quantas linhas um verbete vizinho ocupa numa coluna (estimativa sem medir o DOM)
const linhasDe = (v: Vizinho, largura: number) => {
  const porLinha = Math.floor((largura - 26) / (CORPO_VIZINHO * 0.47));
  const texto = `${v.palavra} ${v.classe ?? ""} ${v.def}`.trim();
  return Math.max(1, Math.ceil(texto.length / porLinha));
};
export const alturaDoVizinho = (v: Vizinho, largura: number) =>
  linhasDe(v, largura) * CORPO_VIZINHO * ENTRELINHA + ESPACO_ENTRE;

// Os vizinhos que cabem numa altura: do fim da lista (os mais perto do verbete) ou do começo
export const vizinhosQueCabem = (lista: Vizinho[], largura: number, altura: number, doFim: boolean) => {
  const ordem = doFim ? [...lista].reverse() : [...lista];
  const cabem: Vizinho[] = [];
  let soma = 0;
  for (const v of ordem) {
    const a = alturaDoVizinho(v, largura);
    if (soma + a > altura) break;
    cabem.push(v);
    soma += a;
  }
  return { lista: doFim ? cabem.reverse() : cabem, altura: soma };
};

// Um verbete vizinho: palavra em negrito, classe em itálico, tradução; recuo pendente de dicionário
export const VerbeteVizinho: React.FC<{ v: Vizinho }> = ({ v }) => (
  <div
    style={{
      fontFamily: serif,
      fontSize: CORPO_VIZINHO,
      lineHeight: ENTRELINHA,
      color: cor.tinta,
      paddingLeft: 26,
      textIndent: -26,
      marginBottom: ESPACO_ENTRE,
    }}
  >
    <span style={{ fontWeight: 700 }}>{v.palavra}</span>{" "}
    {v.classe ? (
      <>
        <span style={{ fontStyle: "italic", color: cor.cinza }}>{v.classe}</span>{" "}
      </>
    ) : null}
    <span style={{ color: cor.cinza }}>{v.def}</span>
  </div>
);

// Sem vizinhos no plano: linhas de texto apagadas (barras a lápis), para a coluna nunca ficar vazia
export const LinhasApagadas: React.FC<{ regiao: Regiao; semente?: number }> = ({ regiao, semente = 1 }) => {
  const passo = CORPO_VIZINHO * ENTRELINHA;
  const n = Math.max(0, Math.floor(regiao.h / passo));
  return (
    <div style={{ position: "absolute", left: regiao.x, top: regiao.y, width: regiao.w, height: regiao.h, overflow: "hidden" }}>
      {Array.from({ length: n }, (_, i) => {
        const r = Math.abs(Math.sin((i + 1) * 12.9898 + semente * 78.233)) % 1;
        const inicio = i % 3 === 0;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: i * passo + passo * 0.38,
              left: inicio ? 0 : 26,
              width: `${(inicio ? 0.9 : 0.62) * 100 - r * 30}%`,
              height: 12,
              borderRadius: 6,
              background: cor.lapis,
              opacity: 0.45,
            }}
          />
        );
      })}
    </div>
  );
};

// Coluna de vizinhos numa região (alinhados em cima, ou embaixo quando `doFim`)
// Sem vizinhos no plano: a abonação (a fala do momento) quando `fala` vem; senão, linhas apagadas.
export const ColunaDeVizinhos: React.FC<{
  regiao: Regiao;
  lista?: Vizinho[];
  doFim?: boolean;
  opacidade?: number;
  fala?: { palavras: Palavra[]; de: number; ate: number; t: number };
}> = ({ regiao, lista, doFim = false, opacidade = 0.62, fala }) => {
  if (!lista || lista.length === 0)
    return fala ? <Abonacao regiao={regiao} palavras={fala.palavras} de={fala.de} ate={fala.ate} t={fala.t} /> : <LinhasApagadas regiao={regiao} />;
  const { lista: cabem } = vizinhosQueCabem(lista, regiao.w, regiao.h, doFim);
  return (
    <div
      style={{
        position: "absolute",
        left: regiao.x,
        top: regiao.y,
        width: regiao.w,
        height: regiao.h,
        display: "flex",
        flexDirection: "column",
        justifyContent: doFim ? "flex-end" : "flex-start",
        opacity: opacidade,
      }}
    >
      {cabem.map((v) => (
        <VerbeteVizinho key={v.palavra} v={v} />
      ))}
    </div>
  );
};

// O chão de toda página: papel-bíblia, cabeçalho com palavras-guia e número, fio entre colunas.
export const Papel: React.FC<{
  guia?: { primeira: string; ultima: string };
  numero?: number;
  // o fio entre as colunas: posição e trecho vertical
  fio?: { x: number; de: number; ate: number } | null;
  children?: React.ReactNode;
}> = ({ guia, numero, fio = { x: W / 2, de: TOPO, ate: BASE }, children }) => (
  <AbsoluteFill style={{ backgroundColor: cor.papel, overflow: "hidden" }}>
    <AbsoluteFill style={{ backgroundImage: `url(${staticFile("papel.png")})`, backgroundSize: "512px 512px" }} />
    {/* a curva do papel perto da lombada (à esquerda): uma sombra bem leve */}
    <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(27,26,31,0.10) 0px, rgba(27,26,31,0) 70px)" }} />
    {guia ? (
      <>
        <div
          style={{
            position: "absolute",
            left: MARGEM,
            top: CABECALHO_Y,
            width: LARGURA_UTIL,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            fontFamily: serif,
            fontWeight: 700,
            fontSize: 36,
            color: cor.tinta,
            lineHeight: 1,
          }}
        >
          <span>{guia.primeira}</span>
          {numero ? <span style={{ fontFamily: sans, fontWeight: 600, fontSize: 32, color: cor.cinza, letterSpacing: "0.06em" }}>{numero}</span> : null}
          <span>{guia.ultima}</span>
        </div>
        <div style={{ position: "absolute", left: MARGEM, top: CABECALHO_Y + 50, width: LARGURA_UTIL, height: 2.5, background: cor.tinta, opacity: 0.75 }} />
      </>
    ) : null}
    {fio ? <div style={{ position: "absolute", left: fio.x - 0.75, top: fio.de, width: 1.5, height: fio.ate - fio.de, background: cor.fio }} /> : null}
    {children}
  </AbsoluteFill>
);

// Página virando, presa na lombada (borda esquerda). angulo 0 = deitada; -90 = de pé (some).
// A perspectiva acompanha a largura da folha (no quadro deitado a página é mais larga que no vertical).
export const Virando: React.FC<{ angulo: number; children: React.ReactNode }> = ({ angulo, children }) => {
  const s = Math.sin((Math.abs(angulo) * Math.PI) / 180);
  if (angulo <= -89.5) return null;
  return (
    <AbsoluteFill style={{ transformOrigin: "0% 50%", transform: `perspective(${Math.round(W * 2.4)}px) rotateY(${angulo}deg)` }}>
      {children}
      {/* a folha escurece de leve enquanto levanta (a luz vem de frente) */}
      <AbsoluteFill
        style={{ background: `linear-gradient(90deg, rgba(27,26,31,${0.04 * s}) 0%, rgba(27,26,31,${0.3 * s}) 100%)` }}
      />
    </AbsoluteFill>
  );
};

// Sombra que a folha que vira joga na página de baixo (perto da lombada)
export const SombraDaFolha: React.FC<{ angulo: number }> = ({ angulo }) => {
  const s = Math.sin((Math.abs(angulo) * Math.PI) / 180);
  if (s < 0.01) return null;
  const alcance = W * Math.cos((angulo * Math.PI) / 180) + 160;
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(90deg, rgba(27,26,31,${0.34 * s}) 0px, rgba(27,26,31,${0.1 * s}) ${alcance * 0.6}px, rgba(27,26,31,0) ${alcance}px)`,
      }}
    />
  );
};
