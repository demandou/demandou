// Abertura: na altura do peito, uma chapa-cartão com uma chapa em miniatura e o texto que se revela
// no ritmo da fala. A miniatura é a coluna de frente, desalinhada (em qualquer assunto), ou o
// esqueleto à mesa com a postura toda errada (nos vídeos de postura). Os pontos de tensão acendem
// quando o `destaque` é dito (ou em `tensaoEm`); na `chamada` o texto dá lugar a "Ajusta 3 coisas" e
// cada ajuste ganha um número no desenho.
import { indicesDoTrecho, Linhas, normalizar, prog, temposDoTexto } from "../anim";
import { camera, centroDaTela } from "../esqueleto/Desenho";
import { CenaAjuste, PontoDeTensao, RECORTES } from "../esqueleto/Cena";
import { CenaColuna } from "../esqueleto/Frente";
import { juntas, posturaNaMesa, TUDO_ERRADO, type V } from "../esqueleto/pose";
import { diagramar } from "../medidas";
import type { Abertura as TAbertura, Palavra, Vista } from "../plano";
import { cor, marcacao, titulo as estiloTitulo } from "../tema";
import { Cartao, CARTAO } from "./Cartao";
import { topoDoCartao } from "./Cartoes";
import { Chapa } from "./Chapa";

const TODAS = ["tela", "pescoco", "tronco", "pernas", "antebraco", "cotovelo"] as const;

export const Abertura: React.FC<{
  m: TAbertura;
  t: number;
  topo: number;
  fim: number;
  palavras: Palavra[];
  // as vistas dos ajustes do plano, em ordem (para numerar no desenho)
  vistas: Vista[];
  // o vídeo é de postura (tem ajustes com o esqueleto à mesa): a miniatura é o esqueleto
  postura: boolean;
}> = ({ m, t, topo, fim, palavras, vistas, postura }) => {
  const altura = 440;
  const mini = { x: 22, y: 22, w: 292, h: altura - 2 * CARTAO.borda - 44 };
  const colX = mini.x + mini.w + 34;
  const colW = 900 - CARTAO.x - colX;
  const chamada = m.chamada;
  const fimTitulo = chamada ? chamada.em : fim;
  const texto = m.texto ?? m.titulo ?? "";
  const tit = diagramar(texto, colW, 88, 64, 4, "sans700");
  const tTit = m.em !== undefined ? temposDoTexto(texto, palavras, m.em - 0.3, fimTitulo, m.em - 0.05) : temposDoTexto(texto, palavras, m.de, fimTitulo, m.de + 0.05);
  const vermelhas = indicesDoTrecho(texto, m.destaque);
  // os pontos de tensão acendem na palavra da dor (ou na última palavra)
  const tensaoEm = m.tensaoEm ?? (vermelhas.size ? tTit[Math.min(...vermelhas)] : tTit[tTit.length - 1]);
  const saiTitulo = chamada ? prog(t, chamada.em - 0.1, 0.3) : 0;
  const cham = chamada ? diagramar(chamada.texto, colW, 116, 72, 2, "sans700") : null;
  const tCham = chamada ? temposDoTexto(chamada.texto, palavras, chamada.em - 0.1, fim, chamada.em) : [];
  const numeros = chamada ? new Set(chamada.texto.split(/\s+/).map((w, i) => (/^\d+$/.test(normalizar(w)) ? i : -1)).filter((i) => i >= 0)) : new Set<number>();

  // o desenho da miniatura e onde ficam os pontos
  const area = { w: mini.w, h: mini.h };
  const { proj } = camera(RECORTES.inteiro, area.w, area.h);
  const j = juntas(posturaNaMesa(TUDO_ERRADO));
  const pontos = [j.pontoPescoco, j.pontoOmbro, j.pontoLombar].map(proj);
  const ancoraDaVista = (vista: Vista): V => {
    if (vista === "tela") return proj(centroDaTela(0).centro);
    if (vista === "pernas") return proj(j.perna.planta);
    if (vista === "bracos") return proj(j.braco.cotovelo);
    if (vista === "coluna") return proj(j.l1);
    return proj(j.quadril);
  };
  const itens = chamada?.itens ?? [];

  return (
    <Cartao t={t} de={m.de} fim={fim} topo={topoDoCartao(topo, altura)} altura={altura}>
      <Chapa largura={mini.w} altura={mini.h} id="abertura" semFaixa estilo={{ left: mini.x, top: mini.y, boxShadow: "0 0 0 1.5px rgba(228,244,251,0.25)" }}>
        {postura ? (
          <CenaAjuste vista="inteiro" passos={[]} erradas={[...TODAS]} antebracoSegue t={t} largura={area.w} altura={area.h} id="abertura" miniatura />
        ) : (
          <CenaColuna itens={tensaoEm !== undefined ? [0, 1, 2].map((i) => ({ texto: "", em: tensaoEm + i * 0.12 })) : []} t={t} largura={area.w} altura={area.h} id="abertura-f" miniatura />
        )}
        <svg width={area.w} height={area.h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <defs>
            <filter id="luz-abertura" filterUnits="userSpaceOnUse" x={-40} y={-40} width={area.w + 80} height={area.h + 80}>
              <feGaussianBlur stdDeviation={2.6} result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {postura && tensaoEm !== undefined ? pontos.map((c, i) => <PontoDeTensao key={i} c={c} t={t} em={tensaoEm + i * 0.12} raio={8} id="abertura" />) : null}
          {itens.map((it, i) => {
            const vista = vistas[i];
            if (!vista) return null;
            const c = ancoraDaVista(vista);
            const p = prog(t, it.em, 0.35);
            if (p <= 0) return null;
            const r = 25;
            // o número fica um pouco acima e à direita do ponto, ligado por um fio
            const nx = Math.min(area.w - r - 8, c.x + 30);
            const ny = Math.max(r + 8, c.y - 34);
            return (
              <g key={i} opacity={p} transform={`translate(0 ${((1 - p) * 10).toFixed(1)})`}>
                <circle cx={c.x} cy={c.y} r={6} fill={cor.ciano} filter="url(#luz-abertura)" />
                <line x1={c.x} y1={c.y} x2={nx} y2={ny} stroke={cor.ciano} strokeWidth={2} />
                <circle cx={nx} cy={ny} r={r} fill={cor.ciano} />
                <text x={nx} y={ny + 11} textAnchor="middle" fill={cor.sala} style={{ ...marcacao, fontSize: 32, fontWeight: 700, letterSpacing: 0 }}>
                  {i + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </Chapa>
      <div style={{ position: "absolute", left: colX, top: 0, width: colW, height: altura - 2 * CARTAO.borda, display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", opacity: 1 - saiTitulo, translate: `0 ${(-34 * saiTitulo).toFixed(1)}px` }}>
          <Linhas linhas={tit.linhas} tempos={tTit} t={t} style={{ ...estiloTitulo, fontSize: tit.tamanho }} corDe={(i) => (vermelhas.has(i) ? cor.tensao : undefined)} />
        </div>
        {cham ? (
          <div style={{ position: "absolute", opacity: prog(t, chamada!.em - 0.05, 0.3), translate: `0 ${((1 - prog(t, chamada!.em - 0.05, 0.4)) * 30).toFixed(1)}px` }}>
            <Linhas linhas={cham.linhas} tempos={tCham} t={t} style={{ ...estiloTitulo, fontSize: cham.tamanho }} corDe={(i) => (numeros.has(i) ? cor.ciano : undefined)} />
          </div>
        ) : null}
      </div>
    </Cartao>
  );
};
