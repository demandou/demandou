// Abertura: a porta do apartamento (folha de madeira com número, olho mágico e maçaneta) destrava e
// se abre para dentro, revelando a pessoa; o batente fica como moldura. O título se monta numa
// etiqueta deitada, no peito, e as etiquetas-esboço "1 2 3" acendem quando o número é dito.
import { useMemo } from "react";
import { balanco, Linhas, indicesDoTrecho, prog, saida, temposDoTexto, troca } from "../anim";
import { encaixar, SERIFA_TITULO } from "../medida";
import type { Abertura as TipoAbertura, Palavra, Porta as TipoPorta } from "../plano";
import { cor, grotesca, H, rotulo as estiloRotulo, serifa, titulo, W } from "../tema";
import { FundoEtiqueta } from "./Etiqueta";

// ---------- a folha da porta ----------

// a folha é um tom mais escura que o batente, para a moldura ler como moldura
const COR_DA_FOLHA = "#93633D";

// veios verticais da madeira (pseudoaleatórios, mas sempre os mesmos)
const veios = (w: number, h: number) => {
  const linhas: string[] = [];
  let semente = 7;
  const aleatorio = () => {
    semente = (semente * 9301 + 49297) % 233280;
    return semente / 233280;
  };
  for (let x = 18; x < w; x += 16 + aleatorio() * 22) {
    const amp = 4 + aleatorio() * 10;
    const fase = aleatorio() * h;
    let d = `M ${x.toFixed(1)} 0`;
    for (let y = 120; y <= h + 120; y += 120) {
      const dx = Math.sin((y + fase) / 260) * amp;
      d += ` S ${(x + dx).toFixed(1)} ${(y - 60).toFixed(1)}, ${(x + dx * 0.6).toFixed(1)} ${y}`;
    }
    linhas.push(d);
  }
  return linhas;
};

export const FolhaDaPorta: React.FC<{ numero?: string; de: number; t: number; espessura: number }> = ({ numero, de, t, espessura: e }) => {
  const w = W - 2 * e;
  const h = H - e;
  const linhas = useMemo(() => veios(w, h), [w, h]);
  // a maçaneta desce (destrava), depois a folha gira para dentro
  const destrava = prog(t, de, 0.12) * (1 - prog(t, de + 0.28, 0.2));
  const abre = prog(t, de + 0.08, 0.74, troca);
  const angulo = abre * 98;
  if (angulo >= 97.5) return null;
  const sombra = Math.sin((Math.min(angulo, 90) * Math.PI) / 180) * 0.42;
  const mx = w - 150;
  const my = h * 0.53;
  return (
    <div style={{ position: "absolute", left: e, top: e, width: w, height: h, perspective: 2600, perspectiveOrigin: "50% 40%" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "left center",
          transform: `rotateY(${angulo}deg)`,
          backfaceVisibility: "hidden",
        }}
      >
        <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
          <rect width={w} height={h} fill={COR_DA_FOLHA} />
          {linhas.map((d, i) => (
            <path key={i} d={d} stroke={i % 4 === 0 ? "rgba(60,34,16,0.30)" : "rgba(60,34,16,0.17)"} strokeWidth={i % 3 === 0 ? 3 : 1.6} fill="none" />
          ))}
          {/* frisos horizontais */}
          {[0.24, 0.76].map((f) => (
            <g key={f}>
              <rect x={0} y={h * f} width={w} height={5} fill={cor.madeiraEscura} opacity={0.75} />
              <rect x={0} y={h * f + 5} width={w} height={3} fill={cor.madeiraClara} opacity={0.6} />
            </g>
          ))}
          {/* olho mágico */}
          <circle cx={w / 2} cy={h * 0.29} r={22} fill={cor.latao} stroke={cor.lataoEscuro} strokeWidth={4} />
          <circle cx={w / 2} cy={h * 0.29} r={10} fill={cor.preto} />
          {/* espelho e alavanca da maçaneta */}
          <rect x={mx - 26} y={my - 70} width={52} height={200} rx={26} fill={cor.preto} />
          <g transform={`rotate(${destrava * 22} ${mx} ${my})`}>
            <rect x={mx - 190} y={my - 17} width={210} height={34} rx={17} fill={cor.preto} />
          </g>
          <circle cx={mx} cy={my} r={20} fill="#2E2C29" />
          <path d={`M ${mx} ${my + 74} m -7 0 a 7 7 0 1 1 14 0 l 4 26 h -22 z`} fill={cor.parede} opacity={0.75} />
        </svg>
        {numero ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              width: w,
              top: h * 0.135,
              textAlign: "center",
              fontFamily: grotesca,
              fontWeight: 700,
              fontSize: 128,
              letterSpacing: "0.08em",
              color: cor.preto,
              lineHeight: 1,
            }}
          >
            {numero}
          </div>
        ) : null}
        {/* a folha escurece enquanto gira (a luz do corredor bate de frente) */}
        <div style={{ position: "absolute", inset: 0, background: "#000", opacity: sombra }} />
      </div>
    </div>
  );
};

// ---------- o título no peito ----------

export const Abertura: React.FC<{ m: TipoPorta | TipoAbertura; palavras: Palavra[]; t: number; topo: number; fim: number; centro?: number; entradaMin?: number }> = ({
  m,
  palavras,
  t,
  topo,
  fim,
  centro = W / 2,
  entradaMin = -1,
}) => {
  const largura = 940;
  // a abertura universal chega com o texto corrido: mede e quebra em até 3 linhas que cabem na etiqueta
  // e na altura do peito (a do formato antigo já vem quebrada em `linhas`)
  const disponivel = 1548 - (topo + 16);
  const temRotulo = !!m.rotulo;
  const ajuste = useMemo(() => {
    if (m.tipo === "porta") return { linhas: m.linhas, tamanho: m.linhas.length >= 3 ? 80 : 88 };
    let max = 88;
    for (;;) {
      const e = encaixar(m.texto, { largura: largura - 104 - 44, max, min: Math.min(60, max), linhas: 3, fonte: SERIFA_TITULO });
      const alt = 64 + (temRotulo ? 50 : 0) + e.linhas.length * e.tamanho * 1.06;
      if (alt <= disponivel || e.tamanho <= 44) return e;
      max = e.tamanho - 4;
    }
  }, [m, disponivel, temRotulo]);
  const linhas = ajuste.linhas;
  const texto = linhas.join(" ");
  const inicio = m.tipo === "abertura" ? (m.em ?? m.de) : m.de;
  const entrada = Math.max(entradaMin, m.tipo === "abertura" ? Math.max(m.de + 0.2, inicio - 0.25) : m.de + 0.2);
  const tempos = useMemo(() => temposDoTexto(texto, palavras, m.tipo === "porta" ? m.de : Math.min(m.de, inicio - 0.1), m.ate, Math.max(entrada + 0.08, inicio)), [texto, palavras, m.de, m.ate, entrada, inicio]);
  const enfase = useMemo(() => indicesDoTrecho(texto, m.tipo === "porta" ? m.enfase : m.destaque), [texto, m]);
  const pEntra = prog(t, entrada, 0.5);
  const s = saida(t, fim - 0.06, 0.3);
  if (t < entrada - 0.01 || s >= 1) return null;

  const tamanho = ajuste.tamanho;
  const altura = 64 + (temRotulo ? 50 : 0) + linhas.length * tamanho * 1.06;
  const x = Math.min(W - largura - 20, Math.max(20, centro - largura / 2));
  const n = m.tipo === "porta" ? (m.etiquetas?.n ?? 0) : 0;
  const etiquetas = m.tipo === "porta" ? m.etiquetas : undefined;
  // a etiqueta grande entra subindo e assenta girando um pouco em volta do furo
  const giro = (1 - pEntra) * -4 + balanco(t, entrada + 0.25, 1.2, 0.8, 0.35);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: topo + 16,
        width: largura,
        height: altura,
        opacity: Math.min(1, pEntra * 1.5),
        translate: `0 ${(1 - pEntra) * 90 + s * (H - topo + 40)}px`,
        transformOrigin: `40px ${altura / 2}px`,
        rotate: `${giro}deg`,
      }}
    >
      <FundoEtiqueta w={largura} h={altura} deitada />
      <div style={{ position: "absolute", left: 104, top: 32, right: 40 }}>
        {temRotulo ? <div style={{ ...estiloRotulo, fontSize: 32, color: cor.verde, marginBottom: 18 }}>{m.rotulo}</div> : null}
        <Linhas
          linhas={linhas}
          tempos={tempos}
          t={t}
          esboco={0.2}
          style={{ ...titulo, fontSize: tamanho, color: cor.preto }}
          corDe={(i) => (enfase.has(i) ? cor.verde : undefined)}
        />
      </div>
      {/* etiquetas-esboço "1 2 3" penduradas na borda de baixo, à direita */}
      {Array.from({ length: n }, (_, i) => {
        const em = (etiquetas?.em ?? m.de) + i * 0.17;
        const acende = prog(t, em, 0.28);
        const wE = 74;
        const hE = 100;
        const cx = largura - 70 - (n - 1 - i) * 96;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: cx - wE / 2,
              top: altura - 10,
              width: wE,
              height: hE,
              transformOrigin: `${wE / 2}px 0px`,
              rotate: `${balanco(t, em + 0.05, 9, 0.55, 0.28)}deg`,
            }}
          >
            <svg width={20} height={24} style={{ position: "absolute", left: wE / 2 - 10, top: -12, overflow: "visible" }}>
              <circle cx={10} cy={12} r={9} fill="none" stroke={acende > 0.5 ? cor.lataoEscuro : cor.lapis} strokeWidth={4} />
            </svg>
            <div style={{ position: "absolute", left: 0, top: 6, width: wE, height: hE }}>
              <FundoEtiqueta w={wE} h={hE} esboco={1 - acende} acesa={acende} sombra />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  paddingTop: 22,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontFamily: serifa,
                  fontSize: 46,
                  fontVariantNumeric: "lining-nums",
                  color: acende > 0.5 ? cor.papel : cor.lapis,
                }}
              >
                {i + 1}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

