// O relatório: a folha em cima, com o cabeçalho fixo e a janela por onde a "câmera" desce pelo
// documento. Cada momento do plano vira uma ou mais PÁGINAS (a altura da janela), empilhadas com um
// filete tracejado entre elas. A câmera chega a cada página um instante antes da primeira palavra
// dela; as páginas anteriores continuam lá em cima (o relatório se acumula) e os pontos do
// cabeçalho contam as seções. Nada de corte: é sempre a mesma folha.
import { prog, suave } from "../anim";
import { larguraTexto } from "../medida";
import type { Momento, Plano } from "../plano";
import { CABECALHO, CONTEUDO, cor, FOLHA, mono, sombraFolha, VAO_PAGINAS, VISOR } from "../tema";

export type Pagina = { chegada: number; etiqueta: string; altura: number; desenhar: (t: number) => React.ReactNode; momento: Momento };

export const PW = VISOR.w;
export const PH = VISOR.h;
const DUR = 0.42;
// faixas livres acima e abaixo das páginas, dentro da janela (entre o filete do cabeçalho e a borda da folha)
const FOLGA_CIMA = VISOR.y - CABECALHO.y - CABECALHO.h - 2;
const FOLGA_BAIXO = FOLHA.y + FOLHA.h - VISOR.y - VISOR.h - 2;
const ANTECIPA = 0.15;

// Onde cada página começa no documento (px).
export const posicoes = (paginas: Pagina[]) => {
  let y = 0;
  return paginas.map((p) => {
    const r = y;
    y += Math.min(PH, p.altura) + VAO_PAGINAS;
    return r;
  });
};

// Onde a câmera para em cada página: o mínimo de descida para a página caber inteira.
const paradas = (paginas: Pagina[], pos: number[]) => {
  let antes = 0;
  return paginas.map((p, k) => {
    if (k === 0) return 0;
    const o = Math.min(pos[k], Math.max(pos[k] + Math.min(PH, p.altura) - PH, antes));
    antes = o;
    return o;
  });
};

// Deslocamento da câmera (px) no instante t: desce até a página atual, encadeando as viagens.
export const deslocamento = (t: number, paginas: Pagina[]) => {
  const alvo = paradas(paginas, posicoes(paginas));
  let y = 0;
  paginas.forEach((p, k) => {
    if (k === 0) return;
    const a = prog(t, p.chegada - ANTECIPA, DUR, suave);
    if (a > 0) y = y + (alvo[k] - y) * a;
  });
  return y;
};

export const paginaAtual = (t: number, paginas: Pagina[]) => {
  let k = 0;
  paginas.forEach((p, i) => {
    if (i > 0 && t >= p.chegada - ANTECIPA) k = i;
  });
  return k;
};

// A folha, o cabeçalho e as páginas.
export const Folha: React.FC<{ t: number; plano: Plano; paginas: Pagina[] }> = ({ t, plano, paginas }) => {
  const y = deslocamento(t, paginas);
  const pos = posicoes(paginas);
  const atual = paginaAtual(t, paginas);
  const titulo = (plano.relatorio ?? "Relatório").toLocaleUpperCase("pt-BR");
  const larguraPontos = paginas.length * 18 + Math.max(0, paginas.length - 1) * 12;
  // o título do cabeçalho (mono, 32 px; reduz até 30 se for longo)
  let tamTitulo = 32;
  while (tamTitulo > 30 && larguraTexto(titulo, tamTitulo, { mono: true, espacamento: 0.12 }) + 34 + larguraPontos + 30 > CONTEUDO.w) tamTitulo -= 1;
  const chegou = atual > 0 && paginas[atual] ? prog(t, paginas[atual].chegada - ANTECIPA + 0.1, 0.3) : 1;
  return (
    <>
      {/* a folha */}
      <div style={{ position: "absolute", left: FOLHA.x, top: FOLHA.y, width: FOLHA.w, height: FOLHA.h, borderRadius: FOLHA.raio, background: cor.papel, boxShadow: sombraFolha }} />
      {/* cabeçalho */}
      <div style={{ position: "absolute", left: CONTEUDO.x, top: CABECALHO.y, width: CONTEUDO.w, height: CABECALHO.h, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 18, height: 18, borderRadius: 4, background: cor.acento }} />
          <span style={{ fontFamily: mono, fontSize: tamTitulo, letterSpacing: "0.12em", color: cor.tinta, whiteSpace: "nowrap" }}>{titulo}</span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {paginas.map((_, i) => (
            <div
              key={i}
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                background: i < atual ? cor.tinta : i === atual ? cor.acento : "transparent",
                border: i > atual ? `2.5px solid ${cor.tintaFraca}` : "none",
                boxSizing: "border-box",
                transform: i === atual && chegou < 1 ? `scale(${0.6 + 0.4 * chegou})` : undefined,
              }}
            />
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", left: CONTEUDO.x, top: CABECALHO.y + CABECALHO.h, width: CONTEUDO.w, height: 2, background: cor.tinta }} />
      {/* a janela das páginas: vai do filete do cabeçalho até a borda da folha; parada, nada fica nas
          faixas de cima e de baixo (só o que está passando, ao rolar, some suave nelas) */}
      <div style={{ position: "absolute", left: VISOR.x - 30, top: VISOR.y - FOLGA_CIMA, width: VISOR.w + 60, height: VISOR.h + FOLGA_CIMA + FOLGA_BAIXO, overflow: "hidden" }}>
        {paginas.map((p, k) => {
          const topo = pos[k] - y + FOLGA_CIMA;
          const h = Math.min(PH, p.altura);
          if (topo > PH + 20 || topo + h + VAO_PAGINAS < -20) return null;
          return (
            <div key={k} style={{ position: "absolute", left: 30, top: topo, width: PW, height: h }}>
              {p.desenhar(t)}
              {k < paginas.length - 1 ? (
                <div style={{ position: "absolute", left: 0, top: h + VAO_PAGINAS / 2 - 1, width: PW, height: 0, borderTop: `2px dashed ${cor.filete}` }} />
              ) : null}
            </div>
          );
        })}
        {/* o papel some suave nas bordas da janela */}
        <div style={{ position: "absolute", left: 0, top: 0, width: VISOR.w + 60, height: FOLGA_CIMA, background: `linear-gradient(${cor.papel} 30%, rgba(250,250,247,0))` }} />
        <div style={{ position: "absolute", left: 0, bottom: 0, width: VISOR.w + 60, height: FOLGA_BAIXO, background: `linear-gradient(rgba(250,250,247,0), ${cor.papel} 70%)` }} />
      </div>
    </>
  );
};
