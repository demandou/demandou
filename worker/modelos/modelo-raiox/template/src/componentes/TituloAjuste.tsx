// Bloco do título de cada chapa do negatoscópio, na parede ao lado da chapa da pessoa: a contagem
// de chapas (as já vistas com ✓, a atual acesa), a etiqueta ("AJUSTE 1/3", "RAIO-X", "PASSO 2/3"…),
// o título que se revela palavra por palavra no ritmo da fala e a linha de apoio. Sem título, o
// bloco mostra um contador grande do item da vez (lista, passos, dados) ou os dois lados da
// comparação.
import { Linhas, prog, saindo, temposDoTexto } from "../anim";
import type { GrupoDoRaioX, Trecho } from "../layout";
import { diagramar, medir } from "../medidas";
import { ehPostura, type Palavra } from "../plano";
import { apoio as estiloApoio, BLOCO_TITULO, cor, MARGEM, marcacao, PESSOA_ESQUERDA, titulo as estiloTitulo, W, DIREITA_SEGURA } from "../tema";

type TrechoDeChapa = Extract<Trecho, { tipo: "chapa" }>;

// os instantes em que cada item da chapa é dito (para o contador e para a etiqueta "PASSO 2/3")
const marcasDoMomento = (tr: TrechoDeChapa): number[] => {
  const m = tr.momento;
  if (m.tipo === "topicos" || m.tipo === "passos") return m.itens.map((i) => i.em);
  if (m.tipo === "grafico") return (m.dados ?? []).map((d) => d.em);
  if (m.tipo === "ajuste" && m.itens) return m.itens.map((i) => i.em);
  return [];
};

const etiquetaPadrao = (tr: TrechoDeChapa, atual: number, total: number, grupo?: GrupoDoRaioX) => {
  const m = tr.momento;
  if (m.tipo === "ajuste") return m.rotulo ?? (ehPostura(m) ? `Ajuste ${tr.ajuste}/${tr.ajustes}` : grupo && grupo.tamanho > 1 ? `Raio-X ${grupo.indice + 1}/${grupo.tamanho}` : "Raio-X");
  if (m.tipo === "topicos") return "Achados";
  if (m.tipo === "passos") return `Passo ${Math.max(1, atual)}/${total}`;
  if (m.tipo === "comparacao") return m.modo === "antes-depois" ? "Antes e depois" : m.modo === "errado-certo" ? "Errado × certo" : "Comparativo";
  return m.ilustrativo || !m.dados?.length ? "Ilustrativo" : "Medida";
};

export const TituloAjuste: React.FC<{
  trecho: TrechoDeChapa;
  t: number;
  inicio: number;
  fim: number;
  palavras: Palavra[];
  grupo?: GrupoDoRaioX;
}> = ({ trecho, t, inicio, fim, palavras, grupo }) => {
  const m = trecho.momento;
  const largura = BLOCO_TITULO.largura;
  // o bloco fica do lado oposto ao da pessoa
  const x = trecho.lado === "esquerda" ? DIREITA_SEGURA - largura : MARGEM;
  const entrada = prog(t, inicio, 0.4);
  const saida = saindo(t, fim, 0.26);
  if (entrada <= 0 || saida >= 1) return null;
  const marcas = marcasDoMomento(trecho);
  const atual = marcas.filter((e) => t >= e - 0.05).length;
  const total = marcas.length;
  const rotulo = etiquetaPadrao(trecho, atual, total, grupo);
  // título: o do plano; na comparação sem título, os dois lados ("Mercado × Seu bolso")
  const titulo = m.titulo ?? (m.tipo === "comparacao" ? `${m.lados[0].rotulo} × ${m.lados[1].rotulo}` : undefined);
  const tit = titulo ? diagramar(titulo, largura, 88, 62, 4, "sans700") : null;
  const apoio = m.tipo === "ajuste" ? m.apoio : undefined;
  const apo = apoio ? diagramar(apoio, largura, 48, 44, 3, "sans500") : null;
  const tTit = titulo ? temposDoTexto(titulo, palavras, m.de, m.ate, inicio + 0.05) : [];
  const tApo = apoio ? temposDoTexto(apoio, palavras, m.de, m.ate, inicio + 0.05) : [];
  // os quadradinhos: uma chapa cada (some se não couber ao lado da etiqueta)
  const quadros = trecho.total;
  const larguraQuadros = quadros * 34 + (quadros - 1) * 8;
  const cabemQuadros = larguraQuadros + 18 + medir(rotulo.toUpperCase(), 32, "mono", 0.06) <= largura;
  // desliza para fora, do lado de onde a pessoa vai sair
  const paraFora = trecho.lado === "esquerda" ? 1 : -1;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: BLOCO_TITULO.y,
        width: largura,
        height: BLOCO_TITULO.h,
        opacity: entrada * (1 - saida),
        translate: `${(paraFora * 40 * saida + paraFora * 24 * (1 - entrada)).toFixed(1)}px 0`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18, height: 40 }}>
        {cabemQuadros ? (
          <div style={{ display: "flex", gap: 8 }}>
            {Array.from({ length: quadros }, (_, i) => {
              const feito = i < trecho.numero - 1;
              const agora = i === trecho.numero - 1;
              const acende = agora ? prog(t, inicio + 0.1, 0.4) : 1;
              return (
                <div
                  key={i}
                  style={{
                    width: 34,
                    height: 26,
                    borderRadius: 4,
                    border: `2px solid ${feito || agora ? cor.ciano : cor.esbocoTraco}`,
                    background: feito ? cor.ciano : agora ? `rgba(92,200,232,${(0.28 * acende).toFixed(3)})` : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {feito ? (
                    <svg width={18} height={14} viewBox="0 0 18 14">
                      <path d="M 2 7 L 7 12 L 16 2" fill="none" stroke={cor.sala} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}
        <div style={{ ...marcacao, fontSize: 32, color: cor.ciano, whiteSpace: "nowrap" }}>{rotulo}</div>
      </div>
      {tit ? (
        <Linhas linhas={tit.linhas} tempos={tTit} t={t} style={{ ...estiloTitulo, fontSize: tit.tamanho, marginTop: 30 }} />
      ) : (
        <Contador t={t} atual={atual} total={total} marcas={marcas} tendencia={m.tipo === "grafico" && !m.dados?.length ? (m.tendencia ?? "sobe") : undefined} inicio={inicio} />
      )}
      {apo ? <Linhas linhas={apo.linhas} tempos={tApo} t={t} style={{ ...estiloApoio, fontSize: apo.tamanho, marginTop: 22 }} fantasma={0.14} /> : null}
    </div>
  );
};

// Contador grande ("02/03") com uma régua de segmentos que acendem; numa tendência sem números, a
// seta da tendência desenhada em ciano.
const Contador: React.FC<{ t: number; atual: number; total: number; marcas: number[]; tendencia?: "sobe" | "cai" | "oscila"; inicio: number }> = ({ t, atual, total, marcas, tendencia, inicio }) => {
  if (tendencia || total === 0) {
    const p = prog(t, inicio + 0.2, 0.8);
    const d = tendencia === "cai" ? "M 10 40 L 120 150 M 120 80 L 120 150 L 50 150" : tendencia === "oscila" ? "M 6 100 C 40 20, 70 20, 100 100 S 160 180, 196 100" : "M 10 150 L 120 40 M 50 40 L 120 40 L 120 110";
    return (
      <svg width={220} height={200} style={{ marginTop: 40, overflow: "visible" }}>
        <path d={d} fill="none" stroke={cor.ciano} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${p} 1`} />
      </svg>
    );
  }
  const ultimo = marcas[Math.max(0, atual - 1)] ?? inicio;
  const troca = prog(t, ultimo - 0.05, 0.3);
  return (
    <div style={{ marginTop: 26 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ ...marcacao, fontSize: 132, fontWeight: 700, letterSpacing: 0, color: atual > 0 ? cor.texto : cor.esboco, opacity: atual > 0 ? 0.6 + 0.4 * troca : 1 }}>{String(Math.max(1, atual)).padStart(2, "0")}</span>
        <span style={{ ...marcacao, fontSize: 56, letterSpacing: 0, color: cor.textoSuave }}>/{String(total).padStart(2, "0")}</span>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} style={{ flex: 1, height: 10, borderRadius: 5, background: i < atual ? cor.ciano : cor.esboco }} />
        ))}
      </div>
    </div>
  );
};

// largura útil para o texto quando a pessoa está do outro lado (para o Guias)
export const blocoDoTitulo = (lado: "esquerda" | "direita") => ({
  x: lado === "esquerda" ? DIREITA_SEGURA - BLOCO_TITULO.largura : MARGEM,
  y: BLOCO_TITULO.y,
  w: BLOCO_TITULO.largura,
  h: BLOCO_TITULO.h,
  pessoa: lado === "esquerda" ? PESSOA_ESQUERDA.x : W - MARGEM - PESSOA_ESQUERDA.w,
});
