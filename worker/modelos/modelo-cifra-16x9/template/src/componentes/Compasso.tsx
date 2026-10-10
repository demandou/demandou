// Momento `compasso`: a linha de compassos (‖: G | D | Em | C :‖) com um diagrama pequeno em cada,
// as setas de troca entre eles, o metrônomo de pêndulo e o andamento escrito ("devagar" → "acelera").
// O compasso em curso acende no tempo do metrônomo e a barrinha dele enche até a próxima batida.
// Com textos em vez de cifras (um tempo de uma rotina, de um ciclo), e no bloco `passos`, a mesma
// linha de compassos leva um texto em cada compasso (veja LinhaDeTextos.tsx).
import { ehCifra, type Forma, formaDoAcorde } from "../acordes";
import { mix, prog } from "../anim";
import { CABECALHO_METRONOMO, cifraDoCompasso, geometriaDoCompasso } from "../geometria";
import { andamentosDe, batidasDoCompasso, compassoEmCurso, emDoCompasso, textoDoCompasso } from "../layout";
import type { Compasso as TCompasso, Plano } from "../plano";
import { cor, rotulo, titulo } from "../tema";
import { CifraNoLugar } from "./Acordes";
import type { Area } from "./Cena";
import { Diagrama } from "./Diagrama";
import { LinhaDeTextos } from "./LinhaDeTextos";
import { Metronomo } from "./Metronomo";
import { Rolante, RotuloDoRolante, tamanhoDoRolante } from "./Rolante";

// a forma de uma cifra: a do momento `acordes` do plano (se houver) ou a do dicionário
export const formaNoPlano = (cifra: string, plano: Plano): Forma | null => {
  for (const m of plano.momentos) {
    if (m.tipo !== "acordes") continue;
    const a = m.acordes.find((x) => x.cifra.trim() === cifra.trim());
    if (a) return formaDoAcorde(a);
  }
  return formaDoAcorde({ cifra });
};

// Cifras soltas (até 4) = a linha de compassos com os diagramas; textos (ou 5 compassos) = um texto em cada compasso
export const modoAcordes = (m: TCompasso) =>
  m.compassos.length <= 4 && m.compassos.every((c) => typeof c === "string" && ehCifra(c));

type Props = {
  m: TCompasso;
  t: number;
  plano: Plano;
  fim: number;
  area: Area;
  lado: Area | null;
  // compassos cujos diagramas chegam viajando da grade de acordes (−1 = não chega), e até quando
  recebe?: { origens: number[]; ate: number };
};

export const Compasso: React.FC<Props> = (props) => (modoAcordes(props.m) ? <CompassoDeAcordes {...props} /> : <CompassoDeTextos {...props} />);

// compassos com texto: o compasso em curso anda no tempo do metrônomo; com `em`, cada um nasce a lápis
const CompassoDeTextos: React.FC<Props> = ({ m, t, plano, fim, area, lado }) => {
  const itens = m.compassos.slice(0, 5).map((c) => ({ texto: textoDoCompasso(c), em: emDoCompasso(c) }));
  const n = itens.length;
  const batidas = batidasDoCompasso(m, fim + 0.3);
  const emCurso = (x: number) => {
    const r = compassoEmCurso(x, m, batidas, n);
    const b = batidas.findIndex((y) => y.em === r.desde);
    const proxima = batidas[b + 1]?.em;
    const periodo = proxima ? proxima - r.desde : (andamentosDe(m).find((a) => a.em <= r.desde)?.periodo ?? 1);
    return { ...r, encher: r.indice < 0 ? 0 : Math.min(1, (x - r.desde) / periodo) };
  };
  const trocaEm = m.trocaEm ?? m.de + 0.4;
  return (
    <LinhaDeTextos
      t={t}
      area={area}
      lado={lado}
      fim={fim}
      palavras={plano.palavras}
      itens={itens}
      emCurso={emCurso}
      trocas={itens.slice(1).map((it, i) => Math.max(trocaEm + i * 0.14, (it.em ?? 0) - 0.05))}
      batidas={batidas}
      andamentos={andamentosDe(m).length}
      rolante={andamentosDe(m)}
      titulo={m.titulo ?? (m.andamentos?.length ? "andamento" : undefined)}
      de={m.de}
    />
  );
};

const CompassoDeAcordes: React.FC<{
  m: TCompasso;
  t: number;
  plano: Plano;
  fim: number;
  area: Area;
  lado: Area | null;
  // compassos cujos diagramas chegam viajando da grade de acordes (−1 = não chega), e até quando
  recebe?: { origens: number[]; ate: number };
}> = ({ m, t, plano, fim, area, lado, recebe }) => {
  const compassos = m.compassos.slice(0, 4).map(textoDoCompasso);
  const n = compassos.length;
  const comDiagrama = m.diagramas !== false;
  const g = geometriaDoCompasso(n, area, !!lado, comDiagrama);
  const batidas = batidasDoCompasso(m, fim + 0.3);
  const { indice, desde } = compassoEmCurso(t, m, batidas);
  const anterior = compassoEmCurso(desde - 0.01, m, batidas).indice;
  const periodo = (() => {
    const b = batidas.findIndex((x) => x.em === desde);
    const proxima = batidas[b + 1]?.em;
    return proxima ? proxima - desde : (andamentosDe(m).find((a) => a.em <= desde)?.periodo ?? 1);
  })();
  const caixaAtual = g.caixas[Math.max(0, indice)];
  const caixaAnterior = g.caixas[anterior < 0 ? Math.max(0, indice) : anterior];
  const passo = prog(t, desde, 0.16);
  const destaque = { x: mix(caixaAnterior.x, caixaAtual.x, passo), y: mix(caixaAnterior.y, caixaAtual.y, passo) };
  const encher = indice < 0 ? 0 : Math.min(1, (t - desde) / periodo);
  // a estrutura (barras, números, setas) se desenha quando os diagramas que viajam já chegaram
  const estrutura = recebe ? recebe.ate - 0.2 : m.de + 0.05;
  const linhas = prog(t, estrutura, 0.45);
  const inicioTroca = Math.max(m.trocaEm ?? m.de + 0.4, estrutura + 0.15);
  const metronomoAltura = lado ? 440 : CABECALHO_METRONOMO - 20;
  const colunaCifra = g.duasLinhas && comDiagrama ? g.larguraCompasso - g.mini.largura - 24 : g.larguraCompasso;

  const metronomo = (
    <Metronomo t={t} batidas={batidas} fim={fim} andamentos={andamentosDe(m).length} desenhoEm={m.de + 0.1} altura={metronomoAltura} />
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
            // a coluna fica onde a janela estava: a janela que se move revela o metrônomo
            opacity: prog(t, m.de, 0.12),
          }}
        >
          <div style={{ marginTop: 10 }}>{metronomo}</div>
          <div style={{ marginTop: 24, width: "100%" }}>
            <RotuloDoRolante texto={m.titulo ?? "andamento"} largura={lado.w - 20} />
          </div>
          <div style={{ width: "100%", marginTop: 12 }}>
            <Rolante lista={andamentosDe(m)} t={t} tamanho={tamanhoDoRolante(andamentosDe(m).map((a) => a.texto), lado.w - 20)} />
          </div>
        </div>
      ) : (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: area.w,
            height: CABECALHO_METRONOMO,
            display: "flex",
            alignItems: "center",
            gap: 40,
            // sem a coluna ao lado, o cabeçalho fica no caminho dos diagramas que viajam: espera eles passarem
            opacity: prog(t, recebe ? recebe.ate - 0.15 : m.de, recebe ? 0.2 : 0.12),
          }}
        >
          <div style={{ marginLeft: 40 }}>{metronomo}</div>
          <div style={{ flex: 1 }}>
            <RotuloDoRolante texto={m.titulo ?? "andamento"} largura={area.w - 380} />
            <div style={{ marginTop: 12 }}>
              <Rolante lista={andamentosDe(m)} t={t} tamanho={tamanhoDoRolante(andamentosDe(m).map((a) => a.texto), area.w - 380)} />
            </div>
          </div>
        </div>
      )}

      {/* compasso em curso */}
      <div
        style={{
          position: "absolute",
          left: destaque.x + 6,
          top: destaque.y,
          width: g.larguraCompasso - 12,
          height: g.alturaLinha,
          borderRadius: 22,
          background: cor.azulFundo,
          opacity: indice < 0 ? 0 : prog(t, m.tocarEm ?? desde, 0.2),
        }}
      />
      {/* barras de compasso, linha por linha, com sinal de repetição no começo e no fim */}
      <svg width={area.w} height={area.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {Array.from({ length: g.linhas }, (_, linha) => {
          const y0 = g.topoFaixa + linha * (g.alturaLinha + g.VAO);
          const naLinha = g.caixas.filter((c) => c.linha === linha).length;
          const h = g.alturaLinha * linhas;
          return Array.from({ length: naLinha + 1 }, (_, k) => {
            const x = g.REPETE + k * g.larguraCompasso;
            const comeco = linha === 0 && k === 0;
            const fimDaFaixa = linha === g.linhas - 1 && k === naLinha;
            return (
              <g key={`${linha}-${k}`}>
                <line x1={x} y1={y0} x2={x} y2={y0 + h} stroke={cor.marfim} strokeWidth={comeco || fimDaFaixa ? 4 : 3.5} />
                {comeco || fimDaFaixa ? (
                  <>
                    <line x1={comeco ? x - 14 : x + 14} y1={y0} x2={comeco ? x - 14 : x + 14} y2={y0 + h} stroke={cor.marfim} strokeWidth={9} />
                    <circle cx={comeco ? x + 15 : x - 15} cy={y0 + g.alturaLinha * 0.4} r={7} fill={cor.marfim} opacity={linhas} />
                    <circle cx={comeco ? x + 15 : x - 15} cy={y0 + g.alturaLinha * 0.6} r={7} fill={cor.marfim} opacity={linhas} />
                  </>
                ) : null}
              </g>
            );
          });
        })}
      </svg>
      {compassos.map((c, i) => {
        const forma = comDiagrama ? formaNoPlano(c, plano) : null;
        const viaja = recebe && (recebe.origens[i] ?? -1) >= 0;
        // quem não chega viajando já está no lugar (a janela que se move revela)
        const visivel = !viaja || t > (recebe?.ate ?? 0);
        const ativo = i === indice;
        const l = g.lugares[i];
        const caixa = g.caixas[i];
        return (
          <div key={`${c}-${i}`}>
            <div
              style={{
                ...rotulo,
                position: "absolute",
                left: caixa.x + 22,
                top: caixa.y + 14,
                color: ativo ? cor.azul : cor.marfimSuave,
                opacity: prog(t, estrutura + 0.1 + i * 0.07, 0.3),
              }}
            >
              {i + 1}
            </div>
            {visivel ? (
              <>
                <CifraNoLugar cifra={c} cx={l.cx - area.x} topo={l.topoCifra - area.y} cor={ativo ? cor.azul : cor.marfim} tamanho={cifraDoCompasso(g.duasLinhas)} />
                {forma ? (
                  <div style={{ position: "absolute", left: l.dx - area.x, top: l.dy - area.y }}>
                    <Diagrama forma={forma} t={t} em={-10} escala={g.escalaMini} numeros={false} ativo={ativo ? 1 : 0} />
                  </div>
                ) : null}
              </>
            ) : null}
            {/* barrinha do tempo do compasso (embaixo da cifra) */}
            <div
              style={{
                position: "absolute",
                left: caixa.x + 22,
                width: colunaCifra - 30,
                top: caixa.y + caixa.h - 30,
                height: 10,
                borderRadius: 5,
                background: cor.lapis,
                overflow: "hidden",
                opacity: linhas,
              }}
            >
              <div style={{ width: `${(ativo ? encher : 0) * 100}%`, height: "100%", background: cor.azul, borderRadius: 5 }} />
            </div>
          </div>
        );
      })}
      {/* setas de troca entre os compassos da mesma linha, embaixo dela */}
      <svg width={area.w} height={area.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {compassos.slice(0, -1).map((_, i) => {
          const a = g.caixas[i];
          const b = g.caixas[i + 1];
          if (a.linha !== b.linha) return null;
          const inicio = inicioTroca + i * 0.14;
          const p = prog(t, inicio, 0.42);
          const y = a.y + a.h + 6;
          const x1 = a.x + a.w * 0.5 + 18;
          const x2 = b.x + b.w * 0.5 - 18;
          const meio = (x1 + x2) / 2;
          const d = `M ${x1} ${y + 4} Q ${meio} ${y + 74} ${x2} ${y + 4}`;
          const comprimento = Math.abs(x2 - x1) * 1.25;
          return (
            <g key={i}>
              <path d={d} fill="none" stroke={cor.lapisForte} strokeWidth={3} strokeDasharray="6 9" opacity={(1 - p) * linhas} />
              <path
                d={d}
                fill="none"
                stroke={cor.marfim}
                strokeWidth={4}
                strokeLinecap="round"
                strokeDasharray={comprimento}
                strokeDashoffset={comprimento * (1 - p)}
              />
              <path
                d={`M ${x2 - 16} ${y + 10} L ${x2} ${y + 2} L ${x2 + 2} ${y + 20}`}
                fill="none"
                stroke={cor.marfim}
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={prog(t, inicio + 0.32, 0.12)}
              />
            </g>
          );
        })}
      </svg>
    </>
  );
};
