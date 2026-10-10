import { limitar, prog, saindo, temposDoTexto } from "../anim";
import { tempoDaVolta } from "../cena";
import type { Cronometro, Palavra } from "../plano";
import { corpoQueCabe } from "../medida";
import { cor, sans, serifa, sombraCartao } from "../tema";

// Divide uma frase em duas linhas de tamanho parecido (sem palavra órfã)
const duasLinhas = (palavras: string[]) => {
  if (palavras.length < 2) return palavras.length;
  const total = palavras.join(" ").length;
  let melhor = Infinity;
  let quebra = 1;
  for (let k = 1; k < palavras.length; k++) {
    const a = palavras.slice(0, k).join(" ").length;
    const d = Math.abs(a - (total - a - 1));
    if (d < melhor) {
      melhor = d;
      quebra = k;
    }
  }
  return quebra;
};

// O cronômetro de leitura: o ponteiro dá uma volta enquanto a pessoa fala e o arco vermelho
// acompanha; embaixo, a frase dita assenta palavra por palavra. Número no mostrador só quando
// a pessoa diz o número (`segundos`).
export const Mostrador: React.FC<{ m: Cronometro; t: number; fim: number; palavras: Palavra[] }> = ({ m, t, fim, palavras }) => {
  const entrada = m.de + 0.42;
  const entra = prog(t, entrada, 0.45);
  const sai = saindo(t, fim - 0.25, 0.25);
  if (sai >= 1 || entra <= 0) return null;
  const cx = 892;
  const cy = 1046;
  const r = 150;
  const n = m.segundos ? Math.max(2, Math.min(12, Math.round(m.segundos))) : 12;
  const volta = tempoDaVolta(m);
  const inicio = entrada + 0.1;
  const p = limitar((t - inicio) / Math.max(0.4, volta - inicio));
  const sub = 5;
  const marcas: React.ReactNode[] = [];
  for (let i = 0; i < n * sub; i++) {
    const a = (i / (n * sub)) * Math.PI * 2 - Math.PI / 2;
    const forte = i % sub === 0;
    const r1 = r - (forte ? 30 : 17);
    const passou = p > 0 && i / (n * sub) <= p + 1e-6;
    marcas.push(
      <line
        key={i}
        x1={cx + Math.cos(a) * r1}
        y1={cy + Math.sin(a) * r1}
        x2={cx + Math.cos(a) * (r - 9)}
        y2={cy + Math.sin(a) * (r - 9)}
        stroke={passou ? cor.vermelho : forte ? cor.tinta : cor.lapis}
        strokeWidth={forte ? 5 : 3}
        strokeLinecap="round"
      />,
    );
  }
  const numeros = m.segundos
    ? Array.from({ length: n }, (_, i) => {
        const a = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
        return (
          <text key={i} x={cx + Math.cos(a) * (r - 62)} y={cy + Math.sin(a) * (r - 62) + 12} textAnchor="middle" fontFamily={sans} fontWeight={700} fontSize={34} fill={cor.tinta}>
            {i + 1}
          </text>
        );
      })
    : null;
  const ra = r + 16;
  const arco = (() => {
    if (p <= 0) return "";
    if (p >= 0.999) return `M ${cx} ${cy - ra} A ${ra} ${ra} 0 1 1 ${cx - 0.01} ${cy - ra}`;
    const a = p * Math.PI * 2 - Math.PI / 2;
    return `M ${cx} ${cy - ra} A ${ra} ${ra} 0 ${p > 0.5 ? 1 : 0} 1 ${cx + Math.cos(a) * ra} ${cy + Math.sin(a) * ra}`;
  })();
  const pa = p * Math.PI * 2 - Math.PI / 2;

  // a frase dita, palavra por palavra, em duas linhas
  const frase = (m.frase ?? "").split(/\s+/).filter(Boolean);
  const tempos = temposDoTexto(m.frase ?? "", palavras, m.de, fim).map((x, i) => Math.max(x, entrada + 0.15 + i * 0.1));
  const quebra = duasLinhas(frase);
  const linhas = [frase.slice(0, quebra), frase.slice(quebra)].filter((l) => l.length);
  const tamanho = Math.min(...linhas.map((l) => corpoQueCabe(l.join(" "), 340, 54, 34, { fonte: "serifa", peso: 700 })), 54);
  const assenta = prog(t, volta, 0.3);
  let k = 0;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: entra * (1 - sai), translate: `${(1 - entra) * 60}px 0` }}>
      <div style={{ position: "absolute", left: cx - r, top: cy - r, width: 2 * r, height: 2 * r, borderRadius: r, background: cor.papel, boxShadow: sombraCartao }} />
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {/* coroa do cronômetro */}
        <rect x={cx - 9} y={cy - r - 22} width={18} height={24} fill={cor.tinta} />
        <rect x={cx - 26} y={cy - r - 44} width={52} height={24} rx={6} fill={cor.tinta} />
        {arco ? <path d={arco} fill="none" stroke={cor.vermelho} strokeWidth={8} strokeLinecap="round" /> : null}
        {marcas}
        {numeros}
        <line x1={cx} y1={cy} x2={cx + Math.cos(pa) * (r - 24)} y2={cy + Math.sin(pa) * (r - 24)} stroke={cor.vermelho} strokeWidth={7} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={13} fill={cor.vermelho} />
        <circle cx={cx} cy={cy} r={5} fill={cor.papel} />
      </svg>
      {m.segundos ? (
        <div
          style={{
            position: "absolute",
            left: cx - 180,
            width: 360,
            top: cy + r + 30,
            display: "flex",
            alignItems: "baseline",
            justifyContent: "center",
            gap: 14,
            fontFamily: serifa,
            fontWeight: 700,
            color: cor.tinta,
            opacity: assenta,
            translate: `0 ${(1 - assenta) * 24}px`,
          }}
        >
          <span style={{ fontSize: 104, lineHeight: 1 }}>{m.segundos}</span>
          <span style={{ fontSize: 50, fontWeight: 600 }}>{m.unidade ?? "segundos"}</span>
        </div>
      ) : null}
      {linhas.length ? (
        <div
          style={{
            position: "absolute",
            left: cx - 180,
            width: 360,
            top: cy + r + (m.segundos ? 150 : 40),
            fontFamily: serifa,
            fontWeight: 700,
            fontSize: tamanho,
            lineHeight: 1.16,
            color: cor.tinta,
            textAlign: "center",
          }}
        >
          {linhas.map((linha, li) => (
            <div key={li} style={{ display: "flex", justifyContent: "center" }}>
              {linha.map((w, wi) => {
                const em = tempos[k++] ?? m.de;
                const a = prog(t, em, 0.24);
                return (
                  <span key={`${w}-${wi}`} style={{ display: "inline-block", marginRight: wi === linha.length - 1 ? 0 : "0.26em", opacity: a, translate: `0 ${(1 - a) * 0.25}em` }}>
                    {w}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};
