// Prancheta do item: prancheta preta com prendedor de latão, folha com o título e a lista.
// - Com desenho (cômodos): cada miniatura nasce a lápis; quando é dita, a "foto" revela e o visto carimba.
// - Sem desenho (qualquer assunto): cada linha tem uma caixinha a lápis; quando é dita, a linha ganha
//   tinta e a caixinha ganha o visto verde.
// Funciona estreita (ao lado da porta, o demo) e larga (na parede, acima da porta de baixo).
import { useMemo } from "react";
import { Linhas, prog, quebrar, temposDoTexto } from "../anim";
import { encaixar, quebrarLinhas, SERIFA_TITULO } from "../medida";
import type { Comodo, Item, Palavra, PainelPrancheta } from "../plano";
import { cor, grotesca, rotulo, titulo as estiloTitulo } from "../tema";
import { Miniatura } from "./Comodos";
import { Visto } from "./Icones";

type Entrada = { texto: string; em: number; desenho?: Comodo };
export const entradasDaPrancheta = (p: PainelPrancheta): Entrada[] =>
  p.itens?.length ? p.itens : (p.comodos ?? []).map((c) => ({ texto: c.nome, em: c.em, desenho: c.desenho }));

type Props = { m: Item; painel: PainelPrancheta; palavras: Palavra[]; t: number; largura: number; altura: number; numero: number; total: number };

export const Prancheta: React.FC<Props> = (props) => {
  const { painel, largura, altura } = props;
  const entradas = entradasDaPrancheta(painel).slice(0, 5);
  const larga = largura > altura * 1.3;
  const comDesenho = entradas.length > 0 && entradas.every((e) => e.desenho);
  if (!larga && comDesenho) return <PranchetaEstreita {...props} entradas={entradas.slice(0, 4)} />;
  return <PranchetaGeral {...props} entradas={entradas} larga={larga} comDesenho={comDesenho} />;
};

// a prancheta preta e o prendedor de latão
const Corpo: React.FC<{ largura: number }> = ({ largura }) => (
  <>
    <div style={{ position: "absolute", inset: 0, background: cor.preto, borderRadius: 24, boxShadow: "0 18px 30px rgba(30,20,10,0.28)" }} />
    <svg width={200} height={74} style={{ position: "absolute", left: largura / 2 - 100, top: -20, overflow: "visible", zIndex: 2 }}>
      <rect x={0} y={20} width={200} height={50} rx={12} fill={cor.latao} stroke={cor.lataoEscuro} strokeWidth={3} />
      <rect x={40} y={0} width={120} height={34} rx={14} fill="none" stroke={cor.lataoEscuro} strokeWidth={9} />
      <rect x={40} y={0} width={120} height={34} rx={14} fill="none" stroke={cor.latao} strokeWidth={5} />
      <circle cx={26} cy={45} r={6} fill={cor.lataoEscuro} />
      <circle cx={174} cy={45} r={6} fill={cor.lataoEscuro} />
    </svg>
  </>
);

const Miniaturinha: React.FC<{ c: Entrada; t: number; celula: number; fotoAltura: number; id: string; tamanho: number; linhas?: string[] }> = ({ c, t, celula, fotoAltura, id, tamanho, linhas }) => {
  const foto = prog(t, c.em, 0.42);
  const carimbo = prog(t, c.em + 0.22, 0.3);
  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          width: celula,
          height: fotoAltura,
          borderRadius: 8,
          overflow: "hidden",
          outline: foto > 0.05 ? `3px solid ${cor.preto}` : `3px dashed ${cor.lapis}`,
          outlineOffset: -3,
        }}
      >
        <Miniatura comodo={c.desenho ?? "sala"} largura={celula} altura={fotoAltura} foto={foto} id={id} />
      </div>
      <div style={{ fontFamily: grotesca, fontWeight: 700, fontSize: tamanho, lineHeight: linhas && linhas.length > 1 ? 1.1 : undefined, marginTop: 8, color: foto > 0.5 ? cor.preto : cor.lapis }}>
        {linhas ? linhas.map((l, k) => <div key={k}>{l}</div>) : c.texto}
      </div>
      {carimbo > 0.01 ? (
        <div style={{ position: "absolute", right: -12, top: -14, opacity: Math.min(1, carimbo * 2), scale: `${1.35 - 0.35 * carimbo}` }}>
          <Visto tamanho={62} fundo={cor.verde} traco={cor.papel} p={prog(t, c.em + 0.3, 0.28)} />
        </div>
      ) : null}
    </div>
  );
};

// A prancheta estreita com miniaturas (a do demo, ao lado da porta)
const PranchetaEstreita: React.FC<Props & { entradas: Entrada[] }> = ({ m, painel, entradas, palavras, t, largura, altura, numero, total }) => {
  const linhasTitulo = useMemo(() => quebrar(m.titulo, 12), [m.titulo]);
  const linhasSub = useMemo(() => quebrar(painel.subtitulo ?? "", 19), [painel.subtitulo]);
  const tempos = useMemo(() => temposDoTexto(m.titulo, palavras, m.de, m.ate, m.de + 0.1), [m.titulo, palavras, m.de, m.ate]);
  const temposSub = useMemo(() => {
    if (!painel.subtitulo) return [];
    const depois = tempos[tempos.length - 1] ?? m.de;
    return temposDoTexto(painel.subtitulo, palavras, depois, m.ate, depois + 0.1);
  }, [painel.subtitulo, palavras, tempos, m.de, m.ate]);

  const colunas = entradas.length <= 2 ? entradas.length : 2;
  const folha = { x: 16, y: 50, w: largura - 32, h: altura - 66 };
  const pad = 24;
  const vao = 18;
  const celula = (folha.w - pad * 2 - vao * (colunas - 1)) / colunas;
  const fotoAltura = Math.round(celula * 0.8);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Corpo largura={largura} />
      <div
        style={{
          position: "absolute",
          left: folha.x,
          top: folha.y,
          width: folha.w,
          height: folha.h,
          background: cor.papel,
          borderRadius: 6,
          // o texto termina acima da interface do app; o papel continua até perto do piso
          padding: `${pad + 24}px ${pad}px 84px`,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ ...rotulo, fontSize: 32, color: cor.verde }}>
            {total > 1 ? `Item ${numero} de ${total}` : "\u00a0"}
          </div>
        </div>
        <Linhas linhas={linhasTitulo} tempos={tempos} t={t} style={{ ...estiloTitulo, fontSize: 70, color: cor.preto, marginTop: 14 }} />
        {linhasSub.length ? (
          <Linhas linhas={linhasSub} tempos={temposSub} t={t} style={{ fontFamily: grotesca, fontWeight: 600, fontSize: 44, lineHeight: 1.14, color: cor.texto2, marginTop: 14 }} />
        ) : null}
        <div style={{ height: 3, background: cor.lapisClaro, margin: "24px 0 0", borderRadius: 2 }} />
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${colunas}, ${celula}px)`, columnGap: vao, rowGap: 24 }}>
            {entradas.map((c, i) => (
              <Miniaturinha key={`${c.texto}-${i}`} c={c} t={t} celula={celula} fotoAltura={fotoAltura} id={`${m.de}-${i}`} tamanho={38} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// A prancheta geral: larga (na parede) ou estreita, com miniaturas ou com a lista de vistos
const PranchetaGeral: React.FC<Props & { entradas: Entrada[]; larga: boolean; comDesenho: boolean }> = ({
  m,
  painel,
  entradas,
  larga,
  comDesenho,
  palavras,
  t,
  largura,
  altura,
  numero,
  total,
}) => {
  const folha = { x: 16, y: 40, w: largura - 32, h: altura - 52 };
  const PAD = larga ? 34 : 24;
  const interna = folha.w - PAD * 2;
  // na prancheta larga, o título e o "Item N de M" dividem a linha de cima
  const larguraItem = larga && total > 1 ? 230 : 0;
  const tituloFit = useMemo(() => encaixar(m.titulo, { largura: interna - larguraItem, max: larga ? 60 : 66, min: 46, linhas: larga ? 1 : 2, fonte: SERIFA_TITULO }), [m.titulo, interna, larga, larguraItem]);
  const subFit = useMemo(() => (painel.subtitulo ? encaixar(painel.subtitulo, { largura: interna, max: 40, min: 34, linhas: 1 }) : null), [painel.subtitulo, interna]);
  const tempos = useMemo(() => temposDoTexto(m.titulo, palavras, m.de, m.ate, m.de + 0.1), [m.titulo, palavras, m.de, m.ate]);
  const temposSub = useMemo(() => {
    if (!painel.subtitulo) return [];
    const depois = tempos[tempos.length - 1] ?? m.de;
    return temposDoTexto(painel.subtitulo, palavras, depois, m.ate, depois + 0.1);
  }, [painel.subtitulo, palavras, tempos, m.de, m.ate]);
  const alturaCab = 30 + (larga ? 0 : 42) + tituloFit.linhas.length * tituloFit.tamanho * 1.06 + (subFit ? 10 + subFit.tamanho * 1.15 : 0) + 22;
  const corpoAltura = folha.h - alturaCab - 22;
  const n = entradas.length;

  // com desenho: miniaturas numa fileira (larga) ou em grade de 2 (estreita)
  const colunas = comDesenho ? (larga ? n : Math.min(2, n)) : 1;
  const vao = 18;
  const filasDesenho = Math.ceil(n / Math.max(1, colunas));
  const celula = comDesenho ? Math.min((interna - vao * (colunas - 1)) / colunas, (corpoAltura - filasDesenho * 56) / (filasDesenho * 0.72)) : 0;
  const nomesDesenho = useMemo(
    () => (comDesenho ? entradas.map((e) => encaixar(e.texto, { largura: celula, max: 38, min: 30, linhas: 1, fonte: { nome: "g700" } })) : []),
    [comDesenho, entradas, celula],
  );

  // sem desenho: linhas com caixinha, num corpo comum que caiba
  const CAIXA = 52;
  const lista = useMemo(() => {
    if (comDesenho) return null;
    const colsLista = larga && n >= 4 ? 2 : 1;
    const largCol = (interna - (colsLista - 1) * 30) / colsLista - CAIXA - 20;
    const filas = Math.ceil(n / colsLista);
    let ultimo = null as null | { s: number; ls: string[][]; fila: number; colsLista: number };
    for (let s = 50; s >= 34; s -= 2) {
      const ls = entradas.map((e) => quebrarLinhas(e.texto, largCol, s, { nome: "g600" }));
      const alt = Math.max(...ls.map((l) => l.length)) * s * 1.12;
      const fila = Math.max(CAIXA, alt) + 16;
      ultimo = { s, ls, fila, colsLista };
      if (fila * filas <= corpoAltura && ls.every((l) => l.length <= 2)) return ultimo;
    }
    return ultimo;
  }, [comDesenho, entradas, interna, larga, n, corpoAltura]);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Corpo largura={largura} />
      <div style={{ position: "absolute", left: folha.x, top: folha.y, width: folha.w, height: folha.h, background: cor.papel, borderRadius: 6 }}>
        <div style={{ position: "absolute", left: PAD, right: PAD, top: 30 }}>
          {larga ? (
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <Linhas linhas={tituloFit.linhas} tempos={tempos} t={t} style={{ ...estiloTitulo, fontSize: tituloFit.tamanho, color: cor.preto, whiteSpace: "nowrap" }} />
              {total > 1 ? <div style={{ ...rotulo, fontSize: 32, color: cor.verde, whiteSpace: "nowrap" }}>{`Item ${numero} de ${total}`}</div> : null}
            </div>
          ) : (
            <>
              <div style={{ ...rotulo, fontSize: 32, color: cor.verde }}>{total > 1 ? `Item ${numero} de ${total}` : "\u00a0"}</div>
              <Linhas linhas={tituloFit.linhas} tempos={tempos} t={t} style={{ ...estiloTitulo, fontSize: tituloFit.tamanho, color: cor.preto, marginTop: 10 }} />
            </>
          )}
          {subFit ? (
            <Linhas linhas={subFit.linhas} tempos={temposSub} t={t} style={{ fontFamily: grotesca, fontWeight: 600, fontSize: subFit.tamanho, lineHeight: 1.15, color: cor.texto2, marginTop: 10 }} />
          ) : null}
          <div style={{ height: 3, background: cor.lapisClaro, marginTop: 16, borderRadius: 2 }} />
        </div>
        <div style={{ position: "absolute", left: PAD, right: PAD, top: alturaCab, bottom: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {comDesenho ? (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${colunas}, ${celula}px)`, columnGap: vao, rowGap: 16 }}>
              {entradas.map((c, i) => (
                <Miniaturinha
                  key={`${c.texto}-${i}`}
                  c={c}
                  t={t}
                  celula={celula}
                  fotoAltura={Math.round(celula * 0.72)}
                  id={`${m.de}-${i}`}
                  tamanho={nomesDesenho[i]?.tamanho ?? 32}
                  linhas={nomesDesenho[i]?.linhas}
                />
              ))}
            </div>
          ) : lista ? (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${lista.colsLista}, 1fr)`, columnGap: 30, width: "100%" }}>
              {entradas.map((e, i) => {
                const p = prog(t, e.em - 0.04, 0.3);
                const visto = prog(t, e.em + 0.12, 0.3);
                const temposItem = temposDoTexto(e.texto, palavras, e.em - 0.1, entradas[i + 1]?.em ?? m.ate, e.em - 0.02);
                return (
                  <div key={`${e.texto}-${i}`} style={{ display: "flex", alignItems: "center", gap: 20, height: lista.fila }}>
                    <div style={{ position: "relative", width: CAIXA, height: CAIXA, flexShrink: 0 }}>
                      <div style={{ position: "absolute", inset: 0, borderRadius: 10, border: `3px dashed ${cor.lapis}`, opacity: 1 - p }} />
                      {p > 0.01 ? (
                        <div style={{ position: "absolute", inset: -4, opacity: Math.min(1, p * 2), scale: `${1.3 - 0.3 * p}` }}>
                          <Visto tamanho={CAIXA + 8} fundo={cor.verde} traco={cor.papel} p={visto} />
                        </div>
                      ) : null}
                    </div>
                    <Linhas linhas={lista.ls[i]} tempos={temposItem} t={t} esboco={0.3} style={{ fontFamily: grotesca, fontWeight: 600, fontSize: lista.s, lineHeight: 1.12, color: cor.preto }} />
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
