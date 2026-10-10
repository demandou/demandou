// O gol visto de frente: traves, rede, as seis zonas (esboço a lápis que acende), o goleiro,
// quem chuta (na frente da tela, de costas para nós) e a bola.
import { entra, mistura, prog, Traco, troca } from "../anim";
import { alvoDaZona, type Curva, GOL, pontoNaCurva, retanguloDaZona, TODAS_AS_ZONAS, trechoDaCurva } from "../campo";
import type { AcaoGol, Gol, Zona } from "../plano";
import { cor, fonte, H, W } from "../tema";
import { BolaSvg, Etiqueta, Ficha } from "./Pecas";

const ALTURA_GOLEIRO = 236;
// o desenho do goleiro acompanha o tamanho do gol (feito para um gol de 900 px)
const ESCALA_GOLEIRO = (GOL.direita - GOL.esquerda) / 900;

// O goleiro de frente, desenho chapado: pés em (0,0), cabeça para cima. `bracos` 0 = base
// (braços abertos, baixos), 1 = esticados acima da cabeça (no pulo).
const Goleiro: React.FC<{ bracos: number }> = ({ bracos }) => {
  const h = ALTURA_GOLEIRO;
  const ombroY = -h * 0.76;
  const maoBase = { x: 104, y: -h * 0.5 };
  const maoEsticada = { x: 44, y: -h * 1.2 };
  const mao = { x: mistura(maoBase.x, maoEsticada.x, bracos), y: mistura(maoBase.y, maoEsticada.y, bracos) };
  const perna = (s: number) => `M ${s * 22} ${-h * 0.42} L ${s * 40} ${-h * 0.18} L ${s * 34} -4`;
  return (
    <g>
      {/* pernas flexionadas e braços: contorno de giz por baixo, corpo escuro por cima */}
      {[-1, 1].map((s) => (
        <g key={`p${s}`}>
          <path d={perna(s)} stroke={cor.giz} strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d={`M ${s * 40} ${ombroY + 8} L ${s * mao.x} ${mao.y}`} stroke={cor.giz} strokeWidth={28} strokeLinecap="round" />
        </g>
      ))}
      {[-1, 1].map((s) => (
        <g key={`c${s}`}>
          <path d={perna(s)} stroke={cor.tv} strokeWidth={28} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d={`M ${s * 40} ${ombroY + 8} L ${s * mao.x} ${mao.y}`} stroke={cor.tv} strokeWidth={22} strokeLinecap="round" />
          {/* luvas */}
          <circle cx={s * mao.x} cy={mao.y} r={17} fill={cor.giz} stroke={cor.tv} strokeWidth={3} />
        </g>
      ))}
      <rect x={-46} y={ombroY - 4} width={92} height={h * 0.38} rx={24} fill={cor.tv} stroke={cor.giz} strokeWidth={3} />
      <circle cx={0} cy={ombroY - 34} r={27} fill={cor.tv} stroke={cor.giz} strokeWidth={3} />
    </g>
  );
};

const rotuloDaZona = (zonas: Zona[]) => {
  const rs = zonas.map(retanguloDaZona);
  const x0 = Math.min(...rs.map((r) => r.x));
  const x1 = Math.max(...rs.map((r) => r.x + r.w));
  // a fileira de baixo inteira leva a etiqueta embaixo do gol; o resto, em cima
  const fileiraDeBaixo = rs.length === 3 && rs.every((r) => r.linha === "baixo");
  return { x: (x0 + x1) / 2, acima: !fileiraDeBaixo };
};

// caminho da bola de quem chuta até a zona: rasteira pelo chão, ou subindo em arco
const caminhoAte = (z: Zona): Curva & { baixo: boolean } => {
  const ini = { x: GOL.bolaInicio.x, y: GOL.bolaInicio.y };
  const fim = alvoDaZona(z);
  const baixo = z.endsWith("baixo");
  // rasteira: quase reta, com uma barriga leve; alta: sobe em arco antes de cair no canto
  const meio = { x: (ini.x + fim.x) / 2, y: (ini.y + fim.y) / 2 };
  const ctrl = baixo ? { x: meio.x + (fim.x < ini.x ? -1 : 1) * 18, y: meio.y + 26 } : { x: meio.x, y: fim.y - 150 };
  return { p0: ini, p1: ctrl, p2: fim, baixo };
};

const RastroDoChute: React.FC<{ c: Curva; p: number }> = ({ c, p }) => {
  if (p <= 0.002) return null;
  // traço que afina com a distância (a bola se afasta da câmera)
  const partes = 10;
  return (
    <g>
      {Array.from({ length: partes }, (_, i) => {
        const u0 = (p * i) / partes;
        const u1 = (p * (i + 1)) / partes;
        return <path key={i} d={trechoDaCurva(c, u0, u1)} fill="none" stroke={cor.placar} strokeWidth={mistura(13, 6, u1)} strokeLinecap="round" />;
      })}
    </g>
  );
};

export const GolFrente: React.FC<{
  gol: Gol;
  t: number;
  // quando a vista aparece
  aparece: number;
  // a vista abre sozinha (sem vir do campo): as traves se desenham
  desenhar: boolean;
  // opacidade do gramado desta vista (na entrada vinda do campo, chega por último)
  fundo?: number;
  // vindo do campo: a bola, o rastro e quem chuta desta vista só aparecem quando a câmera já
  // chegou ao gol (a bola do campo some antes: nunca há duas bolas na tela)
  chegada?: number;
}> = ({ gol, t, aparece, desenhar, fundo = 1, chegada = 1 }) => {
  const acoes = [...gol.acoes].sort((a, b) => a.em - b.em);
  const pTraves = desenhar ? prog(t, aparece + 0.05, 0.55) : 1;
  const pRede = desenhar ? prog(t, aparece + 0.3, 0.4) : 1;
  const pZonas = (i: number) => (desenhar ? prog(t, aparece + 0.4 + i * 0.05, 0.3) : 1);
  const pFrente = prog(t, aparece + (desenhar ? 0.45 : 0.25), 0.4);

  // goleiro: posição base, o ajuste para o lado da bola e o pulo
  const baseX = 540 + (gol.goleiro ?? 0) * 265;
  const defesa = acoes.find((a) => a.tipo === "defesa") as Extract<AcaoGol, { tipo: "defesa" }> | undefined;
  const pPulo = defesa ? prog(t, defesa.em, 0.55, troca) : 0;
  const sinal = defesa?.lado === "esquerda" ? -1 : 1;
  const alcanca = defesa?.alcanca ?? false;
  const giro = sinal * (alcanca ? 80 : 62) * pPulo;
  const dx = sinal * (alcanca ? 225 : 150) * pPulo;
  // sobe no começo do pulo e cai um pouco no fim
  const dy = -Math.sin(Math.PI * Math.min(1, pPulo * 1.1)) * 60 - pPulo * 34;
  const origem = acoes.find((a) => a.tipo === "origem") as Extract<AcaoGol, { tipo: "origem" }> | undefined;
  const ajuste = origem ? (origem.lado === "direita" ? 1 : -1) * 36 * prog(t, origem.em, 0.7, troca) : 0;
  const pGoleiro = desenhar ? prog(t, aparece + 0.35, 0.45) : 1;

  // a bola: chute nesta vista, ou já dentro do gol
  const chute = acoes.find((a) => a.tipo === "chute") as Extract<AcaoGol, { tipo: "chute" }> | undefined;
  const pBola = chute ? prog(t, chute.em, 0.6, entra) : gol.bola ? 1 : 0;
  const caminho = chute ? caminhoAte(chute.alvo) : gol.bola ? caminhoAte(gol.bola) : null;

  const zonaAcesa = (z: Zona) => {
    let p = 0;
    let forte = false;
    for (const a of acoes) {
      if (a.tipo !== "zona" || !a.zonas.includes(z)) continue;
      const q = prog(t, a.em, 0.4);
      if (q > 0) {
        p = Math.max(p, q);
        if (a.zonas.length === 1) forte = true;
      }
    }
    return { p, forte };
  };

  const etiquetas: React.ReactNode[] = [];
  acoes.forEach((a, i) => {
    if (a.tipo === "zona" && a.rotulo) {
      const r = rotuloDaZona(a.zonas);
      etiquetas.push(
        <Etiqueta
          key={`z-${i}`}
          texto={a.rotulo}
          x={r.x}
          y={r.acima ? GOL.travessao - GOL.trave - 34 : GOL.chao + 30}
          ancora={r.acima ? "acima" : "abaixo"}
          t={t}
          em={a.em + 0.1}
        />,
      );
    }
    if (a.tipo === "origem" && a.rotulo) {
      const direita = a.lado === "direita";
      etiquetas.push(<Etiqueta key={`o-${i}`} texto={a.rotulo} x={direita ? 740 : 340} y={1340} ancora="acima" t={t} em={a.em + 0.15} />);
    }
  });

  // faixas do gramado na frente do gol: abrem para a câmera
  const faixas = [0, 1, 2, 3, 4, 5].map((i) => ({
    y0: GOL.chao + (i === 0 ? 0 : 34 * Math.pow(1.8, i - 1)),
    y1: GOL.chao + 34 * Math.pow(1.8, i),
    clara: i % 2 === 0,
  }));

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <g opacity={fundo}>
          <rect x={-6 * W} y={-6 * H} width={13 * W} height={13 * H} fill={cor.foraDoCampo} />
          <rect x={-6 * W} y={GOL.chao - 150} width={13 * W} height={150} fill="#10442A" />
          {faixas.map((f, i) => (
            <rect key={i} x={-6 * W} y={f.y0} width={13 * W} height={i === faixas.length - 1 ? 6 * H : f.y1 - f.y0 + 0.5} fill={f.clara ? cor.gramaClara : cor.grama} />
          ))}
        </g>
        <Traco d={`M -40 ${GOL.chao} L ${W + 40} ${GOL.chao}`} p={pTraves} cor={cor.giz} largura={7} />
        <Traco d={`M -40 ${GOL.pequenaArea} L ${W + 40} ${GOL.pequenaArea}`} p={pTraves} cor={cor.giz} largura={6} opacity={0.9} />

        {/* rede */}
        <g opacity={pRede} stroke={cor.giz} fill="none">
          {Array.from({ length: 21 }, (_, i) => {
            const x = GOL.fundo.esquerda + ((GOL.fundo.direita - GOL.fundo.esquerda) * i) / 20;
            return <path key={`v${i}`} d={`M ${x} ${GOL.fundo.topo} L ${x} ${GOL.fundo.chao}`} strokeOpacity={0.26} strokeWidth={2} />;
          })}
          {Array.from({ length: 8 }, (_, i) => {
            const y = GOL.fundo.topo + ((GOL.fundo.chao - GOL.fundo.topo) * i) / 7;
            return <path key={`h${i}`} d={`M ${GOL.fundo.esquerda} ${y} L ${GOL.fundo.direita} ${y}`} strokeOpacity={0.26} strokeWidth={2} />;
          })}
          {Array.from({ length: 11 }, (_, i) => {
            const f = i / 10;
            const xf = GOL.esquerda + (GOL.direita - GOL.esquerda) * f;
            const xb = GOL.fundo.esquerda + (GOL.fundo.direita - GOL.fundo.esquerda) * f;
            return <path key={`t${i}`} d={`M ${xf} ${GOL.travessao} L ${xb} ${GOL.fundo.topo}`} strokeOpacity={0.22} strokeWidth={2} />;
          })}
          {Array.from({ length: 6 }, (_, i) => {
            const f = i / 5;
            const yf = GOL.travessao + (GOL.chao - GOL.travessao) * f;
            const yb = GOL.fundo.topo + (GOL.fundo.chao - GOL.fundo.topo) * f;
            return (
              <g key={`l${i}`}>
                <path d={`M ${GOL.esquerda} ${yf} L ${GOL.fundo.esquerda} ${yb}`} strokeOpacity={0.22} strokeWidth={2} />
                <path d={`M ${GOL.direita} ${yf} L ${GOL.fundo.direita} ${yb}`} strokeOpacity={0.22} strokeWidth={2} />
              </g>
            );
          })}
          <path
            d={`M ${GOL.fundo.esquerda} ${GOL.fundo.chao} L ${GOL.fundo.esquerda} ${GOL.fundo.topo} L ${GOL.fundo.direita} ${GOL.fundo.topo} L ${GOL.fundo.direita} ${GOL.fundo.chao}`}
            strokeOpacity={0.5}
            strokeWidth={3}
          />
        </g>

        {/* zonas: esboço a lápis (tracejado) que acende em amarelo */}
        {TODAS_AS_ZONAS.map((z, i) => {
          const r = retanguloDaZona(z);
          const { p, forte } = zonaAcesa(z);
          const m = 8;
          const cx = r.x + r.w / 2;
          const cy = r.y + r.h / 2;
          return (
            <g key={z} opacity={pZonas(i)}>
              <rect x={r.x + m} y={r.y + m} width={r.w - 2 * m} height={r.h - 2 * m} rx={6} fill="none" stroke={cor.gizApagado} strokeWidth={3} strokeDasharray="12 10" />
              {p > 0 ? (
                <g transform={`translate(${cx} ${cy}) scale(${0.7 + 0.3 * p}) translate(${-cx} ${-cy})`} opacity={p}>
                  <rect
                    x={r.x + m}
                    y={r.y + m}
                    width={r.w - 2 * m}
                    height={r.h - 2 * m}
                    rx={6}
                    fill={forte ? "rgba(255,203,46,0.5)" : cor.placarFundo}
                    stroke={cor.placar}
                    strokeWidth={forte ? 8 : 5}
                  />
                </g>
              ) : null}
            </g>
          );
        })}

        {/* rastro do chute (contínuo, amarelo) e a bola: passam por trás do goleiro */}
        <g opacity={chegada}>
        {caminho ? <RastroDoChute c={caminho} p={pBola} /> : null}
        {caminho && pBola > 0
          ? (() => {
              const b = pontoNaCurva(caminho, pBola);
              const r = mistura(GOL.bolaInicio.r, 27, pBola);
              const fimChute = chute ? chute.em + 0.6 : -10;
              const pAnel = prog(t, fimChute, 0.45);
              return (
                <g>
                  {chute && pBola >= 0.999 && pAnel < 1 ? (
                    <circle cx={b.x} cy={b.y} r={r + 14 + 34 * pAnel} fill="none" stroke={cor.placar} strokeWidth={4} opacity={1 - pAnel} />
                  ) : null}
                  <BolaSvg x={b.x} y={b.y} r={r} giro={pBola * 540} sombra={caminho.baixo} />
                </g>
              );
            })()
          : null}
        </g>

        {/* goleiro */}
        <g opacity={pGoleiro} transform={`translate(${baseX + ajuste + dx} ${GOL.chao - 6 + dy}) rotate(${giro}) scale(${(0.85 + 0.15 * pGoleiro) * ESCALA_GOLEIRO})`}>
          <Goleiro bracos={Math.min(1, pPulo * 1.6)} />
        </g>

        {/* traves e travessão */}
        <Traco
          d={`M ${GOL.esquerda - GOL.trave / 2} ${GOL.chao} L ${GOL.esquerda - GOL.trave / 2} ${GOL.travessao - GOL.trave / 2} L ${GOL.direita + GOL.trave / 2} ${GOL.travessao - GOL.trave / 2} L ${GOL.direita + GOL.trave / 2} ${GOL.chao}`}
          p={pTraves}
          cor={cor.giz}
          largura={GOL.trave}
          strokeLinecap="butt"
          strokeLinejoin="miter"
        />

        {/* de onde a bola veio: passe tracejado entrando pela lateral até quem chuta */}
        {origem
          ? (() => {
              const p = prog(t, origem.em, 0.55);
              if (p <= 0.001) return null;
              const s = origem.lado === "direita" ? 1 : -1;
              const c: Curva = {
                p0: { x: 540 + s * 445, y: 1372 },
                p1: { x: 540 + s * 250, y: 1366 },
                p2: { x: GOL.atacante.x + s * (s > 0 ? 200 : 110), y: GOL.atacante.y - 74 },
              };
              const u = Math.max(0.02, p);
              const fim = pontoNaCurva(c, u);
              const ang = Math.atan2(fim.y - c.p1.y, fim.x - c.p1.x);
              const k = 30;
              const a1 = { x: fim.x - Math.cos(ang - 0.5) * k, y: fim.y - Math.sin(ang - 0.5) * k };
              const a2 = { x: fim.x - Math.cos(ang + 0.5) * k, y: fim.y - Math.sin(ang + 0.5) * k };
              return (
                <g>
                  <BolaSvg x={c.p0.x + s * 4} y={c.p0.y - 2} r={26} sombra />
                  <path d={trechoDaCurva(c, 0.08, Math.max(0.09, u - 0.03))} fill="none" stroke={cor.giz} strokeWidth={7} strokeDasharray="22 15" />
                  <polygon points={`${fim.x},${fim.y} ${a1.x},${a1.y} ${a2.x},${a2.y}`} fill={cor.giz} />
                </g>
              );
            })()
          : null}

        {/* quem chuta: ficha amarela na frente, de costas para nós */}
        {gol.atacante ? (
          <g opacity={pFrente * chegada}>
            <Ficha x={GOL.atacante.x} y={GOL.atacante.y + GOL.atacante.r * 0.62} r={GOL.atacante.r} time="nosso" numero={gol.atacante} p={pFrente} fonte={fonte} />
          </g>
        ) : null}
        {/* a bola parada no pé, antes do chute */}
        {chute && pBola <= 0 ? <BolaSvg x={GOL.bolaInicio.x} y={GOL.bolaInicio.y} r={GOL.bolaInicio.r} opacidade={pFrente * chegada} /> : null}
      </svg>
      {etiquetas}
    </div>
  );
};
