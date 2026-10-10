// O fundo da página: papel marfim com uma gravura fina de certificado (linhas onduladas que se
// cruzam e deslizam devagar), sempre viva; a moldura da pessoa e a tarja de nome. Nada disso toca na pessoa: a cor do vídeo não muda.
import { prog, saindo } from "../anim";
import type { Plano } from "../plano";
import { COSTURA, cor, fonte, MOLDURA } from "../tema";
import { caber } from "./Pecas";

// a gravura: linhas finas onduladas que se cruzam (como o fundo de uma cédula ou de um certificado),
// sem centro nem forma: ondulam e deslizam devagar, sempre vivas, sem chamar o olho.
const Onda: React.FC<{ y0: number; amp: number; comp: number; fase: number; traco: number }> = ({ y0, amp, comp, fase, traco }) => {
  const pts: string[] = [];
  for (let x = -20; x <= 1100; x += 20) pts.push(`${x},${(y0 + amp * Math.sin(((x / comp) * 2 + fase) * Math.PI)).toFixed(1)}`);
  return <polyline points={pts.join(" ")} fill="none" stroke={cor.gravura} strokeWidth={traco} />;
};

export const Cenario: React.FC<{ t: number }> = ({ t }) => {
  const linhas = Array.from({ length: 22 }, (_, i) => i);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: COSTURA + 80, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 85% 65% at 50% 42%, #FBF7EF 0%, ${cor.pagina} 55%, ${cor.paginaFundo} 100%)` }} />
      <svg width={1080} height={COSTURA + 80} style={{ position: "absolute", inset: 0 }}>
        {linhas.map((i) => (
          <Onda key={`a${i}`} y0={40 + i * 48} amp={22} comp={540} fase={t * 0.12 + i * 0.08} traco={1.4} />
        ))}
        {linhas.map((i) => (
          <Onda key={`b${i}`} y0={64 + i * 48} amp={22} comp={540} fase={-t * 0.1 + 1 + i * 0.08} traco={1.1} />
        ))}
      </svg>
      {/* a borda fina da página, como um certificado */}
      <div style={{ position: "absolute", left: 22, top: 22, right: 22, bottom: 60, border: `2px solid ${cor.gravura}`, borderRadius: 18 }} />
    </div>
  );
};

// o fundo escuro atrás da moldura (só aparece nas laterais) + sombra suave para fora
export const SombraDaMoldura: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: MOLDURA.x,
      top: MOLDURA.y,
      width: MOLDURA.w,
      height: MOLDURA.h,
      borderRadius: MOLDURA.raio,
      boxShadow: "0 -10px 34px rgba(15,51,40,0.18)",
      background: cor.moldura,
    }}
  />
);

// A tarja de nome: na costura, à esquerda (longe do rosto), nos primeiros segundos.
export const Tarja: React.FC<{ t: number; plano: Plano; de: number; ate: number }> = ({ t, plano, de, ate }) => {
  const nome = plano.marca?.nome?.trim();
  if (!nome || t < de || t > ate + 0.3) return null;
  const area = plano.marca?.area?.trim();
  const p = prog(t, de, 0.4);
  const s = saindo(t, ate, 0.3);
  const fN = caber(nome, 470, 40, 34, 1, 800);
  const fA = area ? caber(area, 470, 28, 22, 1, 600) : null;
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        top: COSTURA - 46,
        height: 92,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "0 30px 0 12px",
        borderRadius: 46,
        background: cor.cartao,
        border: `2px solid ${cor.cartaoBorda}`,
        boxShadow: "0 10px 24px rgba(15,51,40,0.18)",
        opacity: p * (1 - s),
        transform: `translateX(${(1 - p) * -40 + s * -40}px)`,
      }}
    >
      <div style={{ width: 62, height: 62, borderRadius: 31, background: cor.acento, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonte, fontWeight: 800, fontSize: 30, color: cor.cartao }}>
        {nome.replace(/^(prof\.?|dr\.?|dra\.?)\s+/i, "").slice(0, 1).toUpperCase()}
      </div>
      <div>
        <div style={{ fontFamily: fonte, fontWeight: 800, fontSize: fN.tamanho, color: cor.tinta, lineHeight: 1.1, whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>{nome}</div>
        {fA ? <div style={{ fontFamily: fonte, fontWeight: 600, fontSize: fA.tamanho, color: cor.tintaSuave, lineHeight: 1.2, whiteSpace: "nowrap" }}>{area}</div> : null}
      </div>
    </div>
  );
};
