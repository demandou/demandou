// A barra "EXPLICANDO" com relógio — o selo de plantão do modelo, no canto de cima à esquerda.
// Bloco vermelho (o ÚNICO vermelho do modelo) com um ponto que pulsa, o relógio que conta o tempo da
// explicação (o anel enche até a `meta`, ex.: 30 s) e, ao lado, o assunto numa tarja branca.
// O relógio para quando a explicação termina (a última palavra do vídeo).
import { limitar, prog, varredura } from "../anim";
import { BARRA, cor, numeros, rotulo } from "../tema";

const TAM_TEXTO = 34;
const TAM_RELOGIO = 38;

// Um algarismo que rola para cima quando muda (como num placar de estúdio)
const Algarismo: React.FC<{ atual: string; anterior: string; p: number }> = ({ atual, anterior, p }) => (
  <span style={{ position: "relative", display: "inline-block", overflow: "hidden", height: "1.05em", lineHeight: 1.05 }}>
    <span style={{ display: "inline-block", visibility: "hidden" }}>{atual}</span>
    {anterior !== atual && p < 1 ? (
      <span style={{ position: "absolute", left: 0, top: 0, translate: `0 ${-p * 100}%` }}>{anterior}</span>
    ) : null}
    <span style={{ position: "absolute", left: 0, top: 0, translate: `0 ${anterior !== atual ? (1 - p) * 100 : 0}%` }}>{atual}</span>
  </span>
);

const formatar = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export const Barra: React.FC<{
  t: number;
  de: number;
  // quando o relógio para
  fim: number;
  texto: string;
  tema?: string;
  temaEm?: number;
  meta?: number;
}> = ({ t, de, fim, texto, tema, temaEm, meta }) => {
  if (t < de - 0.02) return null;
  const pVermelho = prog(t, de, 0.34);
  const pRelogio = prog(t, de + 0.12, 0.34);
  const pTema = tema ? prog(t, temaEm ?? de + 0.3, 0.34) : 0;
  const decorrido = Math.max(0, Math.min(t, fim) - de);
  const seg = Math.floor(decorrido);
  // a troca de algarismo dura 0,22 s no começo de cada segundo
  const pTroca = Math.min(t, fim) < de ? 1 : limitar((decorrido - seg) / 0.22);
  const atual = formatar(seg);
  const anterior = formatar(Math.max(0, seg - 1));
  const parado = t >= fim;
  const pulso = parado ? 1 : 0.45 + 0.55 * (0.5 + 0.5 * Math.cos((t - de) * Math.PI * 2 * 0.9));
  const anel = meta ? limitar(decorrido / meta) : 0;
  const R = 12;
  const C = 2 * Math.PI * R;

  return (
    <div style={{ position: "absolute", left: BARRA.x, top: BARRA.y, height: BARRA.h, display: "flex" }}>
      <div style={{ clipPath: varredura(pVermelho), background: cor.plantao, display: "flex", alignItems: "center", gap: 14, padding: "0 24px 0 22px" }}>
        <div style={{ width: 16, height: 16, borderRadius: 8, background: cor.branco, opacity: limitar((pVermelho - 0.5) / 0.4) * pulso }} />
        <div style={{ ...rotulo, fontSize: TAM_TEXTO, color: cor.branco, opacity: limitar((pVermelho - 0.5) / 0.4), translate: `0 1px` }}>{texto}</div>
      </div>
      <div style={{ clipPath: varredura(pRelogio), background: cor.noite, display: "flex", alignItems: "center", gap: 12, padding: "0 20px 0 18px" }}>
        <svg width={30} height={30} viewBox="0 0 30 30" style={{ opacity: limitar((pRelogio - 0.5) / 0.4) }}>
          <circle cx={15} cy={15} r={R} fill="none" stroke="rgba(169,195,255,0.3)" strokeWidth={4} />
          <circle cx={15} cy={15} r={R} fill="none" stroke={cor.branco} strokeWidth={4} strokeDasharray={`${C * anel} ${C}`} transform="rotate(-90 15 15)" />
        </svg>
        <div style={{ ...rotulo, ...numeros, letterSpacing: "0.02em", fontSize: TAM_RELOGIO, color: cor.branco, display: "flex", opacity: limitar((pRelogio - 0.5) / 0.4) }}>
          {[...atual].map((c, i) => (
            <Algarismo key={i} atual={c} anterior={anterior.length === atual.length ? anterior[i] : c} p={pTroca} />
          ))}
        </div>
      </div>
      {tema ? (
        <div style={{ clipPath: varredura(pTema), background: cor.papel, display: "flex", alignItems: "center", padding: "0 22px" }}>
          <div style={{ ...rotulo, fontSize: TAM_TEXTO, color: cor.tinta, opacity: limitar((pTema - 0.5) / 0.4), translate: `${(1 - pTema) * -10}px 1px` }}>{tema}</div>
        </div>
      ) : null}
    </div>
  );
};
