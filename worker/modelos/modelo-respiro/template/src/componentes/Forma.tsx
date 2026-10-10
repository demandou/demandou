import { ar, formaOrganica, limitar, mistura, prog, saindo } from "../anim";
import type { Orbe } from "../layout";
import type { Fase } from "../plano";
import { encaixar } from "../medida";
import { chegaEmDe, contaEmDe, marcasDaFase } from "../respiro";
import { cor, serif } from "../tema";

// A forma do respiro: três camadas chapadas de damasco (véu, meio, núcleo), cada uma com a borda
// ondulando devagar. Sem brilho nem degradê: é papel recortado que respira.
export const Forma: React.FC<{ orbe: Orbe; ar: number; t: number; aperto: number; segurando: number; opacidade?: number }> = ({
  orbe,
  ar,
  t,
  aperto,
  segurando,
  opacidade = 1,
}) => {
  const r = mistura(orbe.rMin, orbe.rMax, ar) * (1 - 0.22 * aperto);
  if (r < 1 || opacidade <= 0.01) return null;
  // segurando o ar: a borda fica um pouco mais viva (o corpo cheio, parado, mas vivo)
  const viva = 1 + 0.25 * segurando;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: opacidade }}>
      <path d={formaOrganica(orbe.cx, orbe.cy, r * 1.12, t, 0.3, 1.25 * viva)} fill={cor.damascoClaro} />
      <path d={formaOrganica(orbe.cx, orbe.cy, r, t * 1.1, 2.1, viva)} fill={cor.damascoMedio} />
      <path d={formaOrganica(orbe.cx, orbe.cy, r * 0.74, t * 1.25, 4.4, 0.9 * viva)} fill={cor.damasco} />
    </svg>
  );
};

// O anel da contagem em volta da forma: as marcas (uma por número) já estão a lápis e um traço
// de tinta corre pelo anel, contínuo, do começo da frase até o número final; cada marca ganha tinta
// quando o traço passa por ela. No centro, o número da contagem troca: subindo devagar quando a
// contagem é lenta; dissolvendo de um para o outro, sem tique, quando ela é rápida (a pausa
// "segura… sete" tem que parecer um ar parado, não um relógio).
export const Contagem: React.FC<{ m: Fase; orbe: Orbe; t: number; desde: number; fim: number; alvoDesde?: number }> = ({
  m,
  orbe,
  t,
  desde,
  fim,
  alvoDesde,
}) => {
  const marcas = marcasDaFase(m);
  const n = marcas.length;
  const conta = contaEmDe(m);
  const chega = chegaEmDe(m);
  // no centro: o número contado, ou a palavra marcada (`marcas`)
  const rotulos = m.marcas?.length ? m.marcas.map((x) => x.texto) : marcas.map((_, i) => String(i + 1));
  const comPalavras = !!m.marcas?.length;
  const R = orbe.rMax + 52;
  const visivel = Math.min(prog(t, desde, 0.55), 1 - saindo(t, fim, 0.55));
  if (visivel <= 0.01) return null;
  const { cx, cy } = orbe;
  const angulo = (i: number) => -Math.PI / 2 + ((i + 1) / n) * Math.PI * 2;
  const passo = n > 1 ? (chega - conta) / (n - 1) : 0.6;
  const suave = passo < 0.45;

  // o traço chega à marca i no instante da marca i, sem degraus entre elas
  const preparo = Math.max(0.2, Math.min(passo, conta - desde));
  const inicio = conta - preparo;
  const percorrido =
    n === 0
      ? limitar((t - conta) / Math.max(0.05, chega - conta))
      : t < conta
        ? (1 / n) * limitar((t - inicio) / preparo)
        : 1 / n + (1 - 1 / n) * limitar((t - conta) / Math.max(0.05, chega - conta));
  const circ = 2 * Math.PI * R;
  const numero: React.CSSProperties = {
    position: "absolute",
    left: cx - 200,
    top: cy - 130,
    width: 400,
    height: 260,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: serif,
    fontWeight: 400,
    fontSize: 200,
    lineHeight: 1,
    fontVariantNumeric: "lining-nums",
  };

  return (
    <div style={{ position: "absolute", inset: 0, opacity: visivel }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {/* trilho a lápis */}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={cor.lapis} strokeWidth={3} strokeDasharray="2 12" strokeLinecap="round" />
        {/* o que já foi contado, em tinta, a partir do alto, no sentido do relógio */}
        {percorrido > 0.002 ? (
          <circle
            cx={cx}
            cy={cy}
            r={R}
            fill="none"
            stroke={cor.tinta}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={`${percorrido * circ} ${circ}`}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        ) : null}
        {marcas.map((em, i) => {
          const a = angulo(i);
          const x = cx + Math.cos(a) * R;
          const y = cy + Math.sin(a) * R;
          // na contagem rápida a marca enche devagar, sem estalo
          const cheia = suave ? prog(t, em - passo * 0.3, passo * 0.9, ar) : prog(t, em - 0.04, 0.3);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={13} fill={cor.papel} stroke={cor.lapis} strokeWidth={3} />
              {cheia > 0.01 ? <circle cx={x} cy={y} r={13 * (0.45 + 0.55 * cheia)} fill={cor.tinta} opacity={cheia} /> : null}
            </g>
          );
        })}
      </svg>
      {/* número da contagem no centro */}
      {marcas.map((em, i) => {
        const proxima = marcas[i + 1];
        const entra = suave ? prog(t, em - passo * 0.2, passo * 0.7, ar) : prog(t, em - 0.03, 0.2);
        const sai =
          proxima === undefined ? saindo(t, fim, 0.5) : suave ? prog(t, proxima - passo * 0.2, passo * 0.7, ar) : prog(t, proxima - 0.07, 0.1);
        if (entra <= 0.01 || sai >= 0.99) return null;
        const estilo: React.CSSProperties = suave
          ? {
              opacity: entra * (1 - sai),
              scale: String(0.94 + 0.06 * entra + 0.03 * sai),
              filter: entra < 0.999 || sai > 0.001 ? `blur(${((1 - entra) * 6 + sai * 6).toFixed(2)}px)` : undefined,
            }
          : { opacity: entra * (1 - sai), translate: `0 ${((1 - entra) * 34 - sai * 26).toFixed(1)}px` };
        // palavra marcada: encaixa na largura da forma, até 2 linhas
        const ajuste = comPalavras ? encaixar(rotulos[i], { largura: 380, max: 130, min: 56, linhas: 2, fonte: { familia: "serif", peso: 400 } }) : null;
        return (
          <div key={i} style={{ ...numero, color: cor.tinta, ...estilo, ...(ajuste ? { fontSize: ajuste.tamanho, lineHeight: 1.05, textAlign: "center", flexDirection: "column" } : {}) }}>
            {ajuste ? ajuste.linhas.map((l, k) => <span key={k}>{l.join(" ")}</span>) : rotulos[i]}
          </div>
        );
      })}
      {/* antes da primeira marca: o total, apagado, esperando a contagem */}
      {n > 0 && !comPalavras && t < marcas[0] ? (
        <div
          style={{
            ...numero,
            color: cor.tintaSuave,
            opacity: 0.4 * prog(t, alvoDesde ?? desde, 0.4) * (1 - prog(t, marcas[0] - 0.2, 0.2)),
          }}
        >
          {n}
        </div>
      ) : null}
    </div>
  );
};
