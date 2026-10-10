// A conta: um recibo de papel com serrilha. Cada linha nasce a lápis e ganha tinta quando é dita; o
// valor conta até o número, a barra ganha o pedaço daquela linha e o total soma.
// Sem valores ditos (conta qualitativa), cada linha ganha o seu pedaço da barra (`peso`) e o total
// mostra o texto do resultado ("Prejuízo", "Cansaço"), com a nota "ilustrativo".
// Estreita (ao lado da porta, o demo) ou larga (na parede, acima da porta de baixo).
import { useMemo } from "react";
import { contar, Linhas, prog, quebrar, temposDoTexto } from "../anim";
import { encaixar, larguraTexto, numeroBR, SERIFA_TITULO } from "../medida";
import type { Item, Palavra, PainelConta } from "../plano";
import { cor, grotesca, rotulo, titulo as estiloTitulo } from "../tema";
import { Visto } from "./Icones";

// a cor de cada linha (o pedaço dela na barra e o marcador)
export const CORES_DA_CONTA = [cor.verde, cor.latao, cor.madeiraEscura, cor.texto2];

const serrilha = (w: number, h: number, dente = 22) => {
  let d = `M 0 0 H ${w} V ${h - dente / 2}`;
  const n = Math.max(2, Math.round(w / dente));
  const passo = w / n;
  for (let i = n; i > 0; i--) {
    const x = i * passo;
    d += ` L ${x - passo / 2} ${h} L ${x - passo} ${h - dente / 2}`;
  }
  return `${d} Z`;
};

const G700 = { nome: "g700" as const };
const G600 = { nome: "g600" as const };

// formato dos valores: prefixo ("R$", "US$"), número em pt-BR e sufixo ("kg", "h", "%")
const formatador = (p: PainelConta) => (v: number) => {
  const n = numeroBR(v, p.casas ?? 0);
  const pre = p.prefixo?.trim();
  const suf = p.sufixo?.trim();
  return `${pre ? `${pre} ` : ""}${n}${suf ? (suf === "%" ? "%" : ` ${suf}`) : ""}`;
};
const vazio = (p: PainelConta) => `${p.prefixo?.trim() ? `${p.prefixo.trim()} ` : ""}···`;

// o estado da conta num instante (comum às duas versões)
const usarConta = (painel: PainelConta, t: number) => {
  const linhas = painel.linhas.slice(0, 4);
  const qualitativa = linhas.every((l) => l.valor === undefined);
  const pesos = linhas.map((l) => (qualitativa ? (l.peso ?? 1) : Math.max(0, l.valor ?? 0)));
  const soma = pesos.reduce((n, v) => n + v, 0) || 1;
  let totalAgora = 0;
  if (!qualitativa)
    linhas.forEach((l, i) => {
      const antes = linhas.slice(0, i).reduce((n, x) => n + (x.valor ?? 0), 0);
      if (t >= l.em) totalAgora = contar(t, l.em, 0.5, antes, antes + (l.valor ?? 0));
    });
  const ultima = Math.max(...linhas.map((l) => l.em));
  const fechou = prog(t, ultima + 0.25, 0.35);
  const fmt = formatador(painel);
  const nota = painel.nota ?? (qualitativa ? "ilustrativo" : "");
  return { linhas, qualitativa, pesos, soma, totalAgora, ultima, fechou, fmt, nota };
};

const Barra: React.FC<{ painel: PainelConta; t: number; altura: number; marginTop: number }> = ({ painel, t, altura, marginTop }) => {
  const { linhas, pesos, soma } = usarConta(painel, t);
  let x = 0;
  return (
    <div style={{ position: "relative", height: altura, marginTop, borderRadius: 8, border: `2.5px dashed ${cor.lapis}`, overflow: "hidden" }}>
      {linhas.map((l, i) => {
        const fracao = (prog(t, l.em, 0.5, (q) => 1 - Math.pow(1 - q, 3)) * pesos[i] * 100) / soma;
        const esquerda = x;
        x += (pesos[i] / soma) * 100;
        return <div key={i} style={{ position: "absolute", left: `${esquerda}%`, top: 0, bottom: 0, width: `${Math.max(0, fracao)}%`, background: CORES_DA_CONTA[i] }} />;
      })}
    </div>
  );
};

type Props = { m: Item; painel: PainelConta; palavras: Palavra[]; t: number; largura: number; altura: number; numero: number; total: number };

export const Conta: React.FC<Props> = (props) => (props.largura > props.altura * 1.3 ? <ContaLarga {...props} /> : <ContaEstreita {...props} />);

const ContaEstreita: React.FC<Props> = ({ m, painel, palavras, t, largura, altura, numero, total }) => {
  const linhasTitulo = useMemo(() => quebrar(m.titulo, 14), [m.titulo]);
  const tempos = useMemo(() => temposDoTexto(m.titulo, palavras, m.de, m.ate, m.de + 0.1), [m.titulo, palavras, m.de, m.ate]);
  const { linhas, qualitativa, totalAgora, fechou, fmt, nota } = usarConta(painel, t);
  const pad = 36;
  const textoTotal = painel.total ?? "Total";
  const tamTotal = qualitativa ? encaixar(textoTotal, { largura: largura - pad * 2, max: 96, min: 52, linhas: 1, fonte: G700 }).tamanho : 108;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={largura} height={altura} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: "drop-shadow(0 16px 22px rgba(30,20,10,0.25))" }}>
        <path d={serrilha(largura, altura)} fill={cor.papel} />
        <rect x={0} y={0} width={largura} height={16} fill={cor.verde} />
      </svg>
      <div style={{ position: "absolute", left: pad, right: pad, top: pad + 22, bottom: 96, display: "flex", flexDirection: "column" }}>
        <div style={{ ...rotulo, fontSize: 32, color: cor.verde }}>
          {total > 1 ? `Item ${numero} de ${total}` : "\u00a0"}
        </div>
        <Linhas linhas={linhasTitulo} tempos={tempos} t={t} style={{ ...estiloTitulo, fontSize: 70, color: cor.preto, marginTop: 14 }} />
        <div style={{ borderTop: `3px dashed ${cor.lapisClaro}`, margin: "26px 0 8px" }} />
        {linhas.map((l, i) => {
          const p = prog(t, l.em - 0.04, 0.3);
          const valor = contar(t, l.em, 0.5, 0, l.valor ?? 0);
          return (
            <div key={`${l.rotulo}-${i}`} style={{ display: "flex", alignItems: "center", padding: "32px 0", borderBottom: `2px solid ${cor.lapisClaro}` }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 5,
                  marginRight: 16,
                  background: p > 0.5 ? CORES_DA_CONTA[i] : "transparent",
                  border: p > 0.5 ? "none" : `2.5px dashed ${cor.lapis}`,
                  scale: `${0.6 + 0.4 * p}`,
                }}
              />
              <div style={{ fontFamily: grotesca, fontWeight: 600, fontSize: 52, color: p > 0.5 ? cor.preto : cor.lapis, flex: 1, translate: `${(1 - p) * 10}px 0` }}>{l.rotulo}</div>
              {qualitativa ? (
                p > 0.01 ? (
                  <Visto tamanho={44} fundo={cor.verde} traco={cor.papel} p={prog(t, l.em + 0.1, 0.3)} />
                ) : null
              ) : (
                <div style={{ fontFamily: grotesca, fontWeight: 700, fontSize: 52, color: p > 0.5 ? cor.preto : cor.lapisClaro, fontVariantNumeric: "tabular-nums" }}>
                  {p > 0.02 ? fmt(valor) : vazio(painel)}
                </div>
              )}
            </div>
          );
        })}
        <Barra painel={painel} t={t} altura={52} marginTop={40} />
        <div style={{ flex: 1 }} />
        <div style={{ borderTop: `3px dashed ${cor.lapisClaro}`, paddingTop: 22 }}>
          {qualitativa ? null : <div style={{ ...rotulo, fontSize: 34, color: cor.texto2 }}>{textoTotal}</div>}
          <div
            style={{
              fontFamily: grotesca,
              fontWeight: 700,
              fontSize: tamTotal,
              lineHeight: 1,
              marginTop: 12,
              color: (qualitativa ? fechou > 0 : totalAgora > 0) ? (qualitativa ? cor.preto : cor.verde) : cor.lapisClaro,
              fontVariantNumeric: "tabular-nums",
              translate: `0 ${-6 * Math.sin(Math.PI * fechou)}px`,
              whiteSpace: "nowrap",
            }}
          >
            {qualitativa ? (fechou > 0 ? textoTotal : "···") : totalAgora > 0 ? fmt(totalAgora) : vazio(painel)}
          </div>
        </div>
        {nota ? <div style={{ fontFamily: grotesca, fontWeight: 500, fontSize: 32, color: cor.texto2, marginTop: 14 }}>{nota}</div> : null}
      </div>
    </div>
  );
};

// A conta larga: as linhas à esquerda (com a barra embaixo) e o total grande à direita
const ContaLarga: React.FC<Props> = ({ m, painel, palavras, t, largura, altura, numero, total }) => {
  const pad = 34;
  // o título e o "Item N de M" dividem a linha de cima (sobra altura para as linhas da conta)
  const larguraItem = total > 1 ? 230 : 0;
  const tituloFit = useMemo(() => encaixar(m.titulo, { largura: largura - pad * 2 - larguraItem, max: 60, min: 44, linhas: 1, fonte: SERIFA_TITULO }), [m.titulo, largura, larguraItem]);
  const tempos = useMemo(() => temposDoTexto(m.titulo, palavras, m.de, m.ate, m.de + 0.1), [m.titulo, palavras, m.de, m.ate]);
  const { linhas, qualitativa, totalAgora, fechou, fmt, nota } = usarConta(painel, t);
  const colEsq = Math.round((largura - pad * 2) * 0.6);
  const colDir = largura - pad * 2 - colEsq - 30;
  const topoCorpo = pad + 22 + tituloFit.tamanho * 1.06 + 14;
  const corpo = altura - topoCorpo - 40;
  const alturaLinha = Math.min(80, (corpo - 70) / Math.max(1, linhas.length));
  const tamLinha = Math.min(48, Math.round(alturaLinha * 0.62));
  const textoTotal = painel.total ?? "Total";
  const maiorValor = qualitativa ? 0 : larguraTexto(fmt(linhas.reduce((n, l) => n + (l.valor ?? 0), 0)), 100, G700);
  const tamTotal = qualitativa
    ? encaixar(textoTotal, { largura: colDir, max: 84, min: 44, linhas: 2, fonte: G700 })
    : { tamanho: Math.max(48, Math.min(100, Math.floor((100 * colDir) / Math.max(1, maiorValor)))), linhas: [] as string[] };
  const larguraValor = Math.max(...linhas.map((l) => larguraTexto(qualitativa ? "" : fmt(l.valor ?? 0), tamLinha, G700)), 60);
  const rotulos = linhas.map((l) => encaixar(l.rotulo, { largura: colEsq - 24 - 40 - larguraValor - 20, max: tamLinha, min: Math.min(32, tamLinha), linhas: 1, fonte: G600 }));

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={largura} height={altura} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: "drop-shadow(0 16px 22px rgba(30,20,10,0.25))" }}>
        <path d={serrilha(largura, altura)} fill={cor.papel} />
        <rect x={0} y={0} width={largura} height={16} fill={cor.verde} />
      </svg>
      <div style={{ position: "absolute", left: pad, right: pad, top: pad + 12, display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <Linhas linhas={tituloFit.linhas} tempos={tempos} t={t} style={{ ...estiloTitulo, fontSize: tituloFit.tamanho, color: cor.preto, whiteSpace: "nowrap" }} />
        {total > 1 ? <div style={{ ...rotulo, fontSize: 32, color: cor.verde, whiteSpace: "nowrap" }}>{`Item ${numero} de ${total}`}</div> : null}
      </div>
      <div style={{ position: "absolute", left: pad, width: colEsq, top: topoCorpo, height: corpo, display: "flex", flexDirection: "column", justifyContent: "center", paddingRight: 24, boxSizing: "border-box" }}>
        {linhas.map((l, i) => {
          const p = prog(t, l.em - 0.04, 0.3);
          const valor = contar(t, l.em, 0.5, 0, l.valor ?? 0);
          return (
            <div key={`${l.rotulo}-${i}`} style={{ display: "flex", alignItems: "center", height: alturaLinha, borderBottom: `2px solid ${cor.lapisClaro}` }}>
              <div style={{ width: 22, height: 22, borderRadius: 5, marginRight: 16, flexShrink: 0, background: p > 0.5 ? CORES_DA_CONTA[i] : "transparent", border: p > 0.5 ? "none" : `2.5px dashed ${cor.lapis}`, scale: `${0.6 + 0.4 * p}` }} />
              <div style={{ fontFamily: grotesca, fontWeight: 600, fontSize: rotulos[i].tamanho, color: p > 0.5 ? cor.preto : cor.lapis, flex: 1, whiteSpace: "nowrap", translate: `${(1 - p) * 10}px 0` }}>{rotulos[i].linhas.join(" ")}</div>
              {qualitativa ? (
                p > 0.01 ? <Visto tamanho={40} fundo={cor.verde} traco={cor.papel} p={prog(t, l.em + 0.1, 0.3)} /> : null
              ) : (
                <div style={{ fontFamily: grotesca, fontWeight: 700, fontSize: tamLinha, color: p > 0.5 ? cor.preto : cor.lapisClaro, whiteSpace: "nowrap" }}>{p > 0.02 ? fmt(valor) : vazio(painel)}</div>
              )}
            </div>
          );
        })}
        <Barra painel={painel} t={t} altura={40} marginTop={24} />
      </div>
      <div style={{ position: "absolute", right: pad, width: colDir, top: topoCorpo, height: corpo, display: "flex", flexDirection: "column", justifyContent: "center", borderLeft: `3px dashed ${cor.lapisClaro}`, paddingLeft: 26, boxSizing: "content-box" }}>
        {qualitativa ? null : <div style={{ ...rotulo, fontSize: 32, color: cor.texto2 }}>{textoTotal}</div>}
        <div
          style={{
            fontFamily: grotesca,
            fontWeight: 700,
            fontSize: tamTotal.tamanho,
            lineHeight: 1.02,
            marginTop: 12,
            color: (qualitativa ? fechou > 0 : totalAgora > 0) ? (qualitativa ? cor.preto : cor.verde) : cor.lapisClaro,
            translate: `0 ${-6 * Math.sin(Math.PI * fechou)}px`,
            whiteSpace: "nowrap",
          }}
        >
          {qualitativa ? (fechou > 0 ? tamTotal.linhas.map((x, k) => <div key={k}>{x}</div>) : "···") : totalAgora > 0 ? fmt(totalAgora) : vazio(painel)}
        </div>
        {nota ? <div style={{ fontFamily: grotesca, fontWeight: 500, fontSize: 30, color: cor.texto2, marginTop: 14 }}>{nota}</div> : null}
      </div>
    </div>
  );
};
