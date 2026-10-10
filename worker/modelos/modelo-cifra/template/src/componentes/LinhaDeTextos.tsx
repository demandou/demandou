// A linha de compassos com um TEXTO em cada compasso, o metrônomo de pêndulo ao lado e as setas de troca.
// É o bloco `passos` (cada passo num compasso, o pêndulo bate a cada passo dito) e o `compasso` com textos
// em vez de cifras (um tempo de uma rotina, de um ciclo). Como numa folha de cifra com um compasso por
// linha: ‖: 1 │ texto │ / 2 │ texto │ / 3 │ texto :‖ — o número grande à esquerda (onde a cifra fica no
// compasso de acordes), o texto à direita e a barrinha que enche embaixo. Cada compasso nasce a lápis e
// ganha tinta quando é dito; o compasso em curso fica azul; a seta de troca desce até o próximo.
import { mix, prog, temposDasPalavras } from "../anim";
import { CABECALHO_METRONOMO } from "../geometria";
import { caber, type Encaixe } from "../medida";
import type { Palavra } from "../plano";
import { cor, titulo as estiloTitulo } from "../tema";
import { TextoFalado } from "../texto";
import type { Area } from "./Cena";
import { Metronomo } from "./Metronomo";
import { Rolante, RotuloDoRolante, tamanhoDoRolante } from "./Rolante";

const REPETE = 46;
const VAO = 40;
const NUM = 104;

// `extras`: altura a mais de cada compasso (o detalhe embaixo do texto)
export const geometriaDeTextos = (n: number, area: Area, comLado: boolean, extras: number[] = []) => {
  const cabecalho = comLado ? 0 : CABECALHO_METRONOMO;
  const disponivel = area.h - cabecalho;
  const somaExtras = extras.reduce((s, x) => s + x, 0);
  const altura = Math.min(230, (disponivel - (n - 1) * VAO - somaExtras) / n);
  const alturas = Array.from({ length: n }, (_, i) => altura + (extras[i] ?? 0));
  const bloco = alturas.reduce((s, h) => s + h, 0) + (n - 1) * VAO;
  const topo = cabecalho + Math.max(0, (disponivel - bloco) / 2);
  const x0 = REPETE;
  const x1 = area.w - REPETE;
  const caixas = alturas.map((h, i) => ({ x: x0, y: topo + alturas.slice(0, i).reduce((s, a) => s + a + VAO, 0), w: x1 - x0, h }));
  return { altura, caixas, topo, x0, x1 };
};

// um corpo só para todos os compassos: o maior em que todos cabem em até 2 linhas, com a barrinha e o detalhe
const encaixarTextos = (textos: string[], largura: number, altura: number, reserva = 0): Encaixe[] => {
  const livre = altura - 44 - reserva;
  for (let t = 64; t >= 36; t -= 2) {
    const encs = textos.map((x) => caber(x, { largura, max: t, min: t, linhas: 2 }));
    if (encs.every((e) => e.tamanho === t && e.linhas.length * t * 1.08 <= livre)) return encs;
  }
  const t = Math.min(...textos.map((x) => caber(x, { largura, max: 36, min: 30, linhas: 2 }).tamanho));
  return textos.map((x) => caber(x, { largura, max: t, min: t, linhas: 3 }));
};

export const LinhaDeTextos: React.FC<{
  t: number;
  area: Area;
  lado: Area | null;
  fim: number;
  palavras: Palavra[];
  // os compassos: texto e quando ele é dito (sem `em`, já está na tela desde o começo, em marfim)
  itens: { texto: string; em?: number; detalhe?: string }[];
  // o compasso em curso agora (−1 = nenhum) e desde quando; quanto a barrinha dele já encheu (0–1)
  emCurso: (t: number) => { indice: number; desde: number; encher: number };
  // quando cada seta de troca (do compasso i para o i+1) se desenha
  trocas: number[];
  // as batidas do pêndulo e o número de andamentos (para o peso)
  batidas: { em: number; andamento: number }[];
  andamentos: number;
  // o texto que rola embaixo do metrônomo e o rótulo em cima dele
  rolante: { em: number; texto: string }[];
  titulo?: string;
  de: number;
}> = ({ t, area, lado, fim, palavras, itens, emCurso, trocas, batidas, andamentos, rolante, titulo, de }) => {
  const lista = itens.slice(0, 5);
  const n = lista.length;
  const x0 = REPETE;
  const xTexto = x0 + 34 + NUM + 18;
  const larguraTexto = area.w - REPETE - 24 - xTexto;
  // o detalhe (opcional) vai embaixo do texto, menor, numa linha; o compasso dele fica mais alto
  const detalhes = lista.map((i) => (i.detalhe ? caber(i.detalhe, { largura: larguraTexto, max: 38, min: 30, linhas: 1, estilo: { peso: 600 } }) : null));
  const extras = detalhes.map((d) => (d ? d.linhas.length * d.tamanho * 1.15 + 6 : 0));
  const g = geometriaDeTextos(n, area, !!lado, extras);
  const encs = encaixarTextos(
    lista.map((i) => i.texto),
    larguraTexto,
    g.altura,
  );
  const tamNumero = Math.round(Math.min(92, g.altura * 0.52));
  const { indice, desde, encher } = emCurso(t);
  const anterior = emCurso(desde - 0.01).indice;
  const caixaAtual = g.caixas[Math.max(0, indice)];
  const caixaAnterior = g.caixas[anterior < 0 ? Math.max(0, indice) : anterior];
  const passo = prog(t, desde, 0.16);
  const yDestaque = mix(caixaAnterior.y, caixaAtual.y, passo);
  const linhas = prog(t, de + 0.05, 0.45);
  const larguraLado = lado ? lado.w - 20 : area.w - 380;
  const metronomoAltura = lado ? (titulo && titulo.length > 22 ? 400 : 440) : CABECALHO_METRONOMO - 20;
  const metronomo = <Metronomo t={t} batidas={batidas} fim={fim} andamentos={andamentos} desenhoEm={de + 0.1} altura={metronomoAltura} />;
  const tamanhoRolante = tamanhoDoRolante(
    rolante.map((r) => r.texto),
    larguraLado,
  );
  const slot = (
    <>
      {titulo ? <RotuloDoRolante texto={titulo} largura={larguraLado} /> : null}
      <div style={{ width: "100%", marginTop: 12 }}>
        <Rolante lista={rolante} t={t} tamanho={tamanhoRolante} />
      </div>
    </>
  );

  return (
    <>
      {lado ? (
        <div
          style={{
            position: "absolute",
            left: lado.x - area.x,
            top: lado.y - area.y,
            width: lado.w,
            height: lado.h,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ marginTop: 10 }}>{metronomo}</div>
          <div style={{ marginTop: 22, width: "100%" }}>{slot}</div>
        </div>
      ) : (
        <div style={{ position: "absolute", left: 0, top: 0, width: area.w, height: CABECALHO_METRONOMO, display: "flex", alignItems: "center", gap: 40 }}>
          <div style={{ marginLeft: 40 }}>{metronomo}</div>
          <div style={{ flex: 1 }}>{slot}</div>
        </div>
      )}

      {/* compasso em curso */}
      <div
        style={{
          position: "absolute",
          left: g.x0 + 8,
          top: yDestaque,
          width: g.x1 - g.x0 - 16,
          height: g.altura,
          borderRadius: 22,
          background: cor.azulFundo,
          opacity: indice < 0 ? 0 : 1,
        }}
      />

      {/* barras de compasso, uma linha por compasso, com o sinal de repetição no começo e no fim */}
      <svg width={area.w} height={area.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {g.caixas.map((c, i) => {
          const h = c.h * linhas;
          const comeco = i === 0;
          const fimDaFaixa = i === n - 1;
          return (
            <g key={i}>
              <line x1={g.x0} y1={c.y} x2={g.x0} y2={c.y + h} stroke={cor.marfim} strokeWidth={comeco ? 4 : 3.5} />
              <line x1={g.x1} y1={c.y} x2={g.x1} y2={c.y + h} stroke={cor.marfim} strokeWidth={fimDaFaixa ? 4 : 3.5} />
              {/* a linha que separa o número do texto, como a barra entre cifra e diagrama */}
              <line x1={g.x0 + 34 + NUM} y1={c.y + 18} x2={g.x0 + 34 + NUM} y2={c.y + 18 + (c.h - 36) * linhas} stroke={cor.lapisForte} strokeWidth={2.5} />
              {comeco ? (
                <>
                  <line x1={g.x0 - 14} y1={c.y} x2={g.x0 - 14} y2={c.y + h} stroke={cor.marfim} strokeWidth={9} />
                  <circle cx={g.x0 + 15} cy={c.y + c.h * 0.4} r={7} fill={cor.marfim} opacity={linhas} />
                  <circle cx={g.x0 + 15} cy={c.y + c.h * 0.6} r={7} fill={cor.marfim} opacity={linhas} />
                </>
              ) : null}
              {fimDaFaixa ? (
                <>
                  <line x1={g.x1 + 14} y1={c.y} x2={g.x1 + 14} y2={c.y + h} stroke={cor.marfim} strokeWidth={9} />
                  <circle cx={g.x1 - 15} cy={c.y + c.h * 0.4} r={7} fill={cor.marfim} opacity={linhas} />
                  <circle cx={g.x1 - 15} cy={c.y + c.h * 0.6} r={7} fill={cor.marfim} opacity={linhas} />
                </>
              ) : null}
            </g>
          );
        })}
      </svg>

      {lista.map((item, i) => {
        const c = g.caixas[i];
        const enc = encs[i];
        const em = item.em ?? de;
        const dito = item.em === undefined ? 1 : prog(t, em - 0.04, 0.3);
        const ativo = i === indice;
        const proximo = lista[i + 1]?.em;
        const feito = indice > i || (proximo !== undefined && t >= proximo);
        const { tempos } = temposDasPalavras(item.texto, palavras, em - 0.15, Math.min(fim, (proximo ?? fim) + 0.3), em);
        const det = detalhes[i];
        const alturaDetalhe = det ? det.linhas.length * det.tamanho * 1.15 + 6 : 0;
        const alturaTexto = enc.linhas.length * enc.tamanho * 1.08 + alturaDetalhe;
        const topoTexto = c.y + Math.max(10, (c.h - 30 - alturaTexto) / 2);
        return (
          <div key={`${item.texto}-${i}`}>
            {/* o número grande, onde fica a cifra num compasso de acordes */}
            <div
              style={{
                ...estiloTitulo,
                position: "absolute",
                left: g.x0 + 34,
                width: NUM,
                top: c.y + (c.h - tamNumero) / 2 - 4,
                textAlign: "center",
                fontWeight: 900,
                fontSize: tamNumero,
                color: dito <= 0 ? cor.lapisForte : ativo ? cor.azul : cor.marfim,
                translate: `0 ${(1 - dito) * 8}px`,
              }}
            >
              {i + 1}
            </div>
            <div style={{ position: "absolute", left: xTexto, top: topoTexto, width: larguraTexto }}>
              <TextoFalado
                enc={enc}
                tempos={item.em === undefined ? enc.palavras.map(() => -10) : tempos}
                t={t}
                cor={ativo ? cor.azul : cor.marfim}
                peso={800}
              />
              {det ? (
                <div style={{ marginTop: 6 }}>
                  {/* o detalhe: a lápis, ganha tinta palavra por palavra quando é dito */}
                  <TextoFalado
                    enc={det}
                    tempos={temposDasPalavras(item.detalhe ?? "", palavras, em, Math.min(fim, (proximo ?? fim) + 0.3), em + 0.3).tempos}
                    t={t}
                    cor={cor.marfimSuave}
                    peso={600}
                    espacamento={0}
                    alturaLinha={1.15}
                  />
                </div>
              ) : null}
            </div>
            {/* barrinha do tempo do compasso */}
            <div
              style={{
                position: "absolute",
                left: xTexto,
                width: larguraTexto,
                top: c.y + c.h - 24,
                height: 10,
                borderRadius: 5,
                background: cor.lapis,
                overflow: "hidden",
                opacity: linhas,
              }}
            >
              <div style={{ width: `${(ativo ? encher : feito ? 1 : 0) * 100}%`, height: "100%", background: ativo ? cor.azul : cor.marfimSuave, borderRadius: 5 }} />
            </div>
          </div>
        );
      })}

      {/* setas de troca: embaixo do número, descendo de um compasso para o próximo */}
      <svg width={area.w} height={area.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {lista.slice(0, -1).map((_, i) => {
          const a = g.caixas[i];
          const b = g.caixas[i + 1];
          const inicio = trocas[i] ?? de + 0.4;
          const p = prog(t, inicio, 0.36);
          const x = g.x0 + 34 + NUM / 2;
          const y1 = a.y + a.h - 12;
          const y2 = b.y + 12;
          const d = `M ${x - 6} ${y1} Q ${x + 22} ${(y1 + y2) / 2} ${x} ${y2}`;
          const comprimento = (y2 - y1) * 1.4;
          return (
            <g key={i}>
              <path d={d} fill="none" stroke={cor.lapisForte} strokeWidth={3} strokeDasharray="5 7" opacity={(1 - p) * linhas} />
              <path d={d} fill="none" stroke={cor.marfim} strokeWidth={4} strokeLinecap="round" strokeDasharray={comprimento} strokeDashoffset={comprimento * (1 - p)} />
              <path
                d={`M ${x - 11} ${y2 - 10} L ${x} ${y2} L ${x + 9} ${y2 - 12}`}
                fill="none"
                stroke={cor.marfim}
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={prog(t, inicio + 0.26, 0.12)}
              />
            </g>
          );
        })}
      </svg>
    </>
  );
};
