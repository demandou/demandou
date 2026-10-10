// Fig. "trajeto": a Terra embaixo, a camada de ar em volta e um observador em pé no alto dela.
// Ao meio-dia (12h) o Sol está em cima: o raio é curto e azul ("pouco ar"). O Sol desce pelo
// caminho tracejado até o horizonte (18h), o céu vai do azul ao pôr do sol, e o raio novo fica
// longo: a medida dele dentro do ar ("mais ar"), o azul se soltando pelo caminho, e ele chega
// vermelho no observador.
import { caneta, limitar, mistura, prog, sorteio, temposDoTexto, vaiVem } from "../anim";
import { Cabecalho } from "../componentes/Cabecalho";
import type { Trajeto as TrajetoT } from "../plano";
import { comDestaque, FraseAMao, LinhaAMao, PalavraAMao } from "../tinta/Escrita";
import { circulo, Cota, Definicoes, Esboco, Seta, Tracejado, Traco } from "../tinta/Tinta";
import { CEU, cor, H, mono, W } from "../tema";
import { ajustar } from "../medir";
import type { PropsFigura } from "./comum";

export const Trajeto: React.FC<PropsFigura<TrajetoT>> = ({ m, t, areas, palavras, chegada, id, opCabecalho }) => {
  const a = areas.corpo;
  const sy = Math.min(1.06, a.h / 765);
  // o observador (pés) e o olho
  const O = { x: a.x + 270, y: a.y + 392 * sy };
  const E = { x: O.x, y: O.y - 132 };
  const rT = 600;
  const rA = 600 + 262 * sy;
  const C = { x: O.x, y: O.y + rT };
  // onde um raio que sai do olho na direção (ux, uy) deixa a camada de ar
  const saida = (ux: number, uy: number) => {
    const n = Math.hypot(ux, uy);
    const [vx, vy] = [ux / n, uy / n];
    const ox = E.x - C.x;
    const oy = E.y - C.y;
    const b = ox * vx + oy * vy;
    const cc = ox * ox + oy * oy - rA * rA;
    const s = -b + Math.sqrt(b * b - cc);
    return { x: E.x + s * vx, y: E.y + s * vy };
  };
  const rSol = 44;
  const sol12 = { x: O.x, y: a.y + 62 };
  const sol18 = { x: O.x + 600, y: O.y - rSol };
  // o Sol anda num arco em volta do observador, do alto até o horizonte
  const r12 = O.y - sol12.y;
  const r18 = Math.hypot(sol18.x - O.x, sol18.y - O.y);
  const ang12 = Math.PI / 2;
  const ang18 = Math.atan2(O.y - sol18.y, sol18.x - O.x);
  const posSol = (p: number) => {
    const ang = mistura(ang12, ang18, p);
    const r = mistura(r12, r18, p);
    return { x: O.x + r * Math.cos(ang), y: O.y - r * Math.sin(ang) };
  };
  const descida = prog(t, m.desceEm, 1.25, vaiVem);
  const sol = posSol(descida);
  const caminhoDoSol = Array.from({ length: 41 }, (_, i) => {
    const q = posSol(i / 40);
    return `${i === 0 ? "M" : "L"} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
  }).join(" ");

  // os dois raios: o do meio-dia (curto, azul) e o do Sol que desce (longo; chega vermelho)
  const pontaNoOlho = (de: { x: number; y: number }, folga: number) => {
    const d = Math.hypot(de.x - E.x, de.y - E.y);
    return { x: E.x + ((de.x - E.x) / d) * folga, y: E.y + ((de.y - E.y) / d) * folga };
  };
  const ini12 = { x: sol12.x, y: sol12.y + rSol + 10 };
  const fim12 = { x: E.x, y: E.y - 38 };
  const dRaio12 = `M ${ini12.x} ${ini12.y} L ${fim12.x} ${fim12.y}`;
  const iniSol = pontaNoOlho(sol, Math.hypot(sol.x - E.x, sol.y - E.y) - rSol - 10);
  const fimSol = pontaNoOlho(sol, 38);
  const dRaio = `M ${iniSol.x} ${iniSol.y} L ${fimSol.x} ${fimSol.y}`;
  const borda = saida(sol.x - E.x, sol.y - E.y);
  const bordaFinal = saida(sol18.x - E.x, sol18.y - E.y);
  const topoDoAr = { x: E.x, y: C.y - rA };

  const pRaio12 = prog(t, chegada + 0.35, 0.45, caneta);
  const pSobra = prog(t, m.sobraEm, 0.7, caneta);
  const pAtravessa = prog(t, m.atravessaEm, 0.45, caneta);
  const medidaEm = m.medidaEm ?? m.atravessaEm + 0.5;
  const pTrilha = prog(t, chegada + 0.5, 0.6, caneta);

  const arco = (r: number) => {
    const dx = Math.min(r - 1, a.w + 80);
    const yb = C.y - Math.sqrt(r * r - dx * dx);
    return `M ${C.x - dx} ${yb} A ${r} ${r} 0 0 1 ${C.x + dx} ${yb}`;
  };
  const baixo = a.y + a.h + 80;
  const anel = `${arco(rA)} L ${a.x + a.w + 100} ${baixo} L ${a.x - 100} ${baixo} Z`;
  const terra = `${arco(rT)} L ${a.x + a.w + 100} ${baixo} L ${a.x - 100} ${baixo} Z`;
  // rótulos impressos das duas posições (opcionais: o demo usa "12h" e "18h")
  const [h12, h18] = m.horas ?? ["", ""];

  // pontinhos azuis que se soltam ao longo do caminho longo
  const r = sorteio(5);
  const soltos = Array.from({ length: 14 }, (_, i) => {
    const s = 0.08 + 0.84 * (i / 13);
    const em = m.atravessaEm + 0.1 + s * 0.9 + r() * 0.12;
    const lado = r() > 0.4 ? 1 : -1;
    return { s, em, lado, dist: 40 + r() * 60, dx: (r() - 0.5) * 40 };
  });
  const sobra = m.sobra ?? "";
  const temposSobra = temposDoTexto(sobra, palavras, m.de, m.ate, m.sobraEm);
  const notaY = a.y + a.h - 118;
  const horizonte = `M ${O.x + 26} ${O.y} L ${a.x + a.w} ${O.y}`;

  // cota paralela a um segmento, deslocada `off` px para um lado
  const cotaAo = (de: { x: number; y: number }, ate: { x: number; y: number }, off: number) => {
    const d = Math.hypot(ate.x - de.x, ate.y - de.y);
    const nx = (-(ate.y - de.y) / d) * off;
    const ny = ((ate.x - de.x) / d) * off;
    return { de: { x: de.x + nx, y: de.y + ny }, ate: { x: ate.x + nx, y: ate.y + ny } };
  };
  const cota12 = cotaAo({ x: E.x, y: topoDoAr.y }, { x: E.x, y: E.y - 6 }, 46);
  const cotaLonga = cotaAo(E, borda, -46);

  return (
    <>
      {areas.cabecalho ? (
        <Cabecalho regiao={areas.cabecalho} t={t} de={m.de} ate={m.ate} palavras={palavras} rotulo={m.rotulo} titulo={m.titulo} destaque={m.destaque} corDestaque={m.corDestaque} chegada={chegada} opacidade={opCabecalho} />
      ) : null}
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <Definicoes id={id} />
        <defs>
          <linearGradient id={`${id}-dia`} x1="0" y1={C.y - rA} x2="0" y2={O.y + 160} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={CEU.dia[0]} />
            <stop offset="0.6" stopColor={CEU.dia[1]} />
            <stop offset="1" stopColor={CEU.dia[2]} />
          </linearGradient>
          <radialGradient id={`${id}-tarde`} cx={sol18.x} cy={sol18.y} r={a.w * 0.95} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={CEU.tarde[2]} />
            <stop offset="0.42" stopColor={CEU.tarde[1]} />
            <stop offset="1" stopColor={CEU.tarde[0]} />
          </radialGradient>
          <clipPath id={`${id}-area`}>
            <rect x={a.x - 40} y={a.y - 20} width={a.w + 80} height={a.h + 40} />
          </clipPath>
          <linearGradient id={`${id}-raio`} x1={iniSol.x} y1={iniSol.y} x2={fimSol.x} y2={fimSol.y} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={pSobra > 0 ? cor.ambar : "#FFFFFF"} />
            <stop offset={Math.max(0.01, 0.55 * pSobra)} stopColor={pSobra > 0 ? cor.vermelho : "#FFFFFF"} />
            <stop offset={Math.max(0.02, pSobra)} stopColor={pSobra > 0 ? cor.vermelho : "#FFFFFF"} />
            <stop offset="1" stopColor={pSobra >= 1 ? cor.vermelho : "#FFFFFF"} />
          </linearGradient>
        </defs>
        <g clipPath={`url(#${id}-area)`}>
          {/* o ar: céu de dia que vira pôr do sol enquanto o Sol desce */}
          <path d={anel} fill={`url(#${id}-dia)`} opacity={0.85} />
          <path d={anel} fill={`url(#${id}-tarde)`} opacity={0.94 * descida} />
          <path d={anel} fill={`url(#${id}-lapis)`} />
          {/* a Terra */}
          <path d={terra} fill={cor.papel} />
          <path d={terra} fill={`url(#${id}-hachura)`} />
          <g filter={`url(#${id}-mao)`}>
            <path d={arco(rT)} fill="none" stroke={cor.tinta} strokeWidth={6} />
            <path d={arco(rA)} fill="none" stroke={cor.tinta} strokeWidth={3} strokeDasharray="14 10" opacity={0.7} />
          </g>
          {/* o horizonte de quem está ali */}
          <path d={horizonte} stroke={cor.tinta} strokeWidth={3} strokeDasharray="10 9" opacity={0.75} />
        </g>
        {/* o caminho do Sol, a lápis */}
        <Tracejado id={`${id}-trilha`} d={caminhoDoSol} p={pTrilha} cor={cor.lapis} largura={3.5} tracos="10 10" />
        {/* 12h: raio curto e azul, com a medida curta */}
        <Esboco d={circulo(sol12.x, sol12.y, rSol)} largura={3.5} opacidade={limitar(descida * 4)} />
        <g filter={`url(#${id}-mao)`}>
          <Traco d={dRaio12} p={pRaio12} largura={22} />
          <Traco d={dRaio12} p={pRaio12} cor={cor.azul} largura={12} />
        </g>
        <Cota de={cota12.de} ate={cota12.ate} p={prog(t, chegada + 0.75, 0.35)} largura={4} perna={14} />
        {/* o raio do Sol que desce (longo); chega vermelho */}
        {descida > 0.03 ? (
          <g filter={`url(#${id}-mao)`}>
            <Traco d={dRaio} p={1} largura={24} />
            <Traco d={dRaio} p={1} cor={`url(#${id}-raio)`} largura={13} />
          </g>
        ) : null}
        <g opacity={limitar(descida * 2)}>
          <Cota de={cotaLonga.de} ate={cotaLonga.ate} p={1} cor={pAtravessa > 0 ? cor.tinta : cor.lapis} largura={pAtravessa > 0 ? 5 : 3.5} />
        </g>
        {/* o azul se soltando pelo caminho */}
        {soltos.map((q, i) => {
          const p = prog(t, q.em, 0.8);
          if (p <= 0) return null;
          const base = { x: borda.x + (E.x - borda.x) * q.s, y: borda.y + (E.y - borda.y) * q.s };
          return <circle key={i} cx={base.x + q.dx * p} cy={base.y - q.lado * q.dist * p} r={8} fill={cor.azul} opacity={1 - 0.55 * p} />;
        })}
        {/* o Sol */}
        <circle cx={sol.x} cy={sol.y} r={rSol} fill={cor.ambar} opacity={0.95} />
        <circle cx={sol.x} cy={sol.y} r={rSol} fill={cor.vermelho} opacity={0.9 * limitar((descida - 0.4) * 1.8)} />
        <circle cx={sol.x} cy={sol.y} r={rSol} fill={`url(#${id}-lapis)`} />
        <path d={circulo(sol.x, sol.y, rSol)} fill="none" stroke={cor.tinta} strokeWidth={5} />
        {/* o observador: uma pessoa em pé no alto da Terra (o olho é o ponto E) */}
        <g stroke={cor.tinta} strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round">
          {(() => {
            const tronco = `M ${O.x - 27} ${O.y - 98} Q ${O.x} ${O.y - 109} ${O.x + 27} ${O.y - 98} L ${O.x + 20} ${O.y - 50} L ${O.x - 20} ${O.y - 50} Z`;
            return (
              <>
                <path d={`M ${O.x - 11} ${O.y - 50} L ${O.x - 16} ${O.y} M ${O.x + 11} ${O.y - 50} L ${O.x + 16} ${O.y}`} fill="none" />
                <path d={tronco} fill={cor.azulClaro} />
                <path d={tronco} fill={`url(#${id}-hachura)`} />
                <path d={`M ${O.x - 27} ${O.y - 96} L ${O.x - 40} ${O.y - 52} M ${O.x + 27} ${O.y - 96} L ${O.x + 40} ${O.y - 52}`} fill="none" />
                <circle cx={E.x} cy={E.y} r={23} fill={cor.papelClaro} />
              </>
            );
          })()}
        </g>
        {sobra ? (
          <Seta de={{ x: a.x + 330, y: notaY - 30 }} ate={{ x: E.x + 34, y: E.y + 70 }} p={prog(t, m.sobraEm + 0.45, 0.4, caneta)} curva={-0.25} cor={cor.vermelho} />
        ) : null}
      </svg>
      {/* horas, rótulos e anotações */}
      <div style={{ position: "absolute", left: sol12.x + rSol + 16, top: sol12.y - 26, fontFamily: mono, fontWeight: 700, fontSize: 42, color: cor.tintaSuave }}>{h12}</div>
      <div style={{ position: "absolute", left: sol18.x - 60, top: O.y + 8, width: 120, textAlign: "center", fontFamily: mono, fontWeight: 700, fontSize: 42, color: cor.tinta, opacity: 0.3 + 0.7 * limitar((descida - 0.85) * 6) }}>
        {h18}
      </div>
      <div style={{ position: "absolute", left: O.x - 250, top: (topoDoAr.y + E.y) / 2 - 34, width: 200, textAlign: "right" }}>
        {m.curto ? <PalavraAMao texto={m.curto} corpo={ajustar(m.curto, 210, 46, 34, 1).corpo} p={prog(t, chegada + 0.85, 0.35, caneta)} /> : null}
      </div>
      <div style={{ position: "absolute", left: O.x - 196, top: O.y - 92, width: 136, textAlign: "right" }}>
        <PalavraAMao texto={m.observador ?? "você"} corpo={ajustar(m.observador ?? "você", 150, 46, 32, 1).corpo} p={prog(t, chegada + 0.6, 0.3, caneta)} />
      </div>
      <div style={{ position: "absolute", left: O.x + 300, top: O.y + 6 }}>
        <span style={{ fontFamily: mono, fontWeight: 700, fontSize: 32, letterSpacing: "0.12em", textTransform: "uppercase", color: cor.tintaSuave }}>horizonte</span>
      </div>
      {m.medida ? (
        <div style={{ position: "absolute", left: (E.x + bordaFinal.x) / 2 - 200, top: (E.y + bordaFinal.y) / 2 - 150, width: 400 }}>
          <FraseAMao texto={m.medida} em={medidaEm} ate={m.ate} palavras={palavras} t={t} corpo={ajustar(m.medida, 400, 60, 40, 1).corpo} alinhar="center" />
        </div>
      ) : null}
      {sobra ? (
        <div style={{ position: "absolute", left: a.x + 150, top: notaY - 36, width: 600 }}>
          <LinhaAMao palavras={comDestaque(sobra, temposSobra).map((p) => ({ ...p, cor: cor.vermelho }))} t={t} corpo={ajustar(sobra, 600, 64, 42, 1).corpo} alinhar="center" />
        </div>
      ) : null}
    </>
  );
};
