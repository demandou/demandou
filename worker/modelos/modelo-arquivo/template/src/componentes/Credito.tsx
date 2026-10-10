import { Datilo, prog, saindo } from "../anim";
import { encaixar, larguraTexto } from "../medida";
import type { Credito as TCredito } from "../plano";
import { caber, cor, LARGURA_SANS_CAIXA_ALTA, mono, sans, sombraTexto } from "../tema";
import { Veu } from "./Veu";

// Crédito de documentário: lugar e data datilografados sobre a imagem, alinhados à esquerda,
// na altura do peito. Cada parte da data bate quando é dita.
export const Credito: React.FC<{
  m: TCredito;
  t: number;
  fim: number;
  area: { x: number; y: number; w: number; h: number };
}> = ({ m, t, fim, area }) => {
  const sai = saindo(t, fim - 0.12, 0.22);
  const entra = prog(t, m.de, 0.4);
  const lugar = m.lugar.texto.toUpperCase();
  // o corpo de sempre quando cabe numa linha; senão, medido e quebrado em até 2 linhas
  const antigo = caber(lugar, area.w, 96, LARGURA_SANS_CAIXA_ALTA, 56);
  const fitLugar =
    larguraTexto(lugar, antigo, { peso: 800, espacamento: 0.02 }) <= area.w
      ? { tamanho: antigo, linhas: [lugar] }
      : encaixar(lugar, { largura: area.w, max: 92, min: 56, linhas: 2, fonte: { peso: 800, espacamento: 0.02 } });
  const tamLugar = fitLugar.tamanho;
  const separador = m.separador ?? ".";
  const linhaData = (m.data ?? []).map((p, i) => `${i > 0 ? separador : ""}${p.texto}`).join("");
  const tamData = Math.min(76, Math.max(44, Math.floor(area.w / (Math.max(1, linhaData.length) * 0.6 * 1.03 * 1.04))));
  const fimLugar = m.lugar.em + Math.min(0.8, lugar.length * 0.05);
  const traco = prog(t, fimLugar, 0.5);
  return (
    <>
    <Veu topo={area.y + area.h - 560} opacidade={entra * (1 - sai)} />
    <div
      style={{
        position: "absolute",
        left: area.x,
        width: area.w,
        bottom: 1920 - (area.y + area.h),
        display: "flex",
        flexDirection: "column",
        gap: 18,
        opacity: 1 - sai,
        translate: `0 ${sai * 20}px`,
        textShadow: sombraTexto,
      }}
    >
      {m.rotulo ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontFamily: mono,
            fontWeight: 700,
            fontSize: 30,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: cor.claro,
            opacity: entra * 0.9,
            translate: `${(1 - entra) * -24}px 0`,
          }}
        >
          <div style={{ width: 16, height: 16, background: cor.vermelho }} />
          {m.rotulo}
        </div>
      ) : null}
      <div style={{ fontFamily: sans, fontWeight: 800, fontSize: tamLugar, lineHeight: 1, letterSpacing: "0.02em", color: cor.claro }}>
        {fitLugar.linhas.map((l, i) => (
          <div key={i} style={{ whiteSpace: "nowrap" }}>
            <Datilo texto={l} em={m.lugar.em + i * 0.3} t={t} dur={fimLugar - m.lugar.em} />
          </div>
        ))}
      </div>
      <div style={{ width: 150 * traco, height: 6, background: cor.vermelho, boxShadow: "none" }} />
      {m.data?.length ? (
        <div style={{ fontFamily: mono, fontWeight: 700, fontSize: tamData, lineHeight: 1, letterSpacing: "0.04em", color: cor.claro, whiteSpace: "nowrap" }}>
          {m.data.map((parte, i) => (
            <Datilo key={i} texto={`${i > 0 ? separador : ""}${parte.texto}`} em={parte.em} t={t} semente={i + 3} />
          ))}
        </div>
      ) : null}
      {m.detalhe ? (
        <div style={{ fontFamily: mono, fontWeight: 400, fontSize: 36, letterSpacing: "0.06em", color: cor.claro }}>
          <Datilo texto={m.detalhe.texto} em={m.detalhe.em} t={t} semente={11} />
        </div>
      ) : null}
    </div>
    </>
  );
};
