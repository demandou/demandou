import { aPartirDe, DatiloFalado, preciso, prog, saindo, temposDoTexto } from "../anim";
import { encaixarBloco } from "../medida";
import type { Abertura as TAbertura, Palavra } from "../plano";
import { cor, mono, sans, sombraTexto } from "../tema";
import { Veu } from "./Veu";

// Abertura de documentário: o rótulo pré-impresso (o assunto) e o título datilografado palavra por
// palavra na altura do peito, em caixa alta; o `destaque` vira uma tarja vermelha quando é dito e
// um traço vermelho fecha o título.
export const Abertura: React.FC<{
  m: TAbertura;
  t: number;
  fim: number;
  area: { x: number; y: number; w: number; h: number };
  palavras: Palavra[];
  assunto?: string;
}> = ({ m, t, fim, area, palavras, assunto }) => {
  const sai = saindo(t, fim - 0.12, 0.22);
  const entra = prog(t, m.de, 0.4);
  const inicio = m.em ?? m.de;
  const titulo = m.texto.toUpperCase();
  const rotulo = m.rotulo ?? assunto;
  // altura disponível: o rótulo (~48 px) e o traço (~40 px) também ocupam a área
  const alturaTexto = area.h - (rotulo ? 48 : 0) - 40;
  // a tarja do destaque ocupa um pouco mais que o texto
  const largura = area.w - (m.destaque ? 36 : 0);
  const fit = encaixarBloco(titulo, { largura, altura: alturaTexto, max: 96, min: 56, maxLinhas: 4, entrelinha: 1.04, fonte: { peso: 800, espacamento: 0.01 } });
  // nenhuma palavra antes de o título aparecer (o início pode esperar a foto crescer)
  const tempos = aPartirDe(temposDoTexto(titulo, palavras, m.de, m.ate, inicio), m.de + 0.05);
  const ultimo = tempos[tempos.length - 1] ?? inicio;
  const traco = prog(t, ultimo + 0.25, 0.5, preciso);
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
          gap: 16,
          opacity: 1 - sai,
          translate: `0 ${sai * 20}px`,
          textShadow: sombraTexto,
        }}
      >
        {rotulo ? (
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
              opacity: entra * 0.92,
              translate: `${(1 - entra) * -24}px 0`,
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            <div style={{ width: 16, height: 16, background: cor.vermelho, flexShrink: 0 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{rotulo}</span>
          </div>
        ) : null}
        <DatiloFalado
          texto={titulo}
          linhas={fit.linhas}
          tempos={tempos}
          t={t}
          enfase={m.destaque?.toUpperCase()}
          tarja
          style={{ fontFamily: sans, fontWeight: 800, fontSize: fit.tamanho, lineHeight: 1.04, letterSpacing: "0.01em", color: cor.claro }}
        />
        <div style={{ width: 160 * traco, height: 6, background: cor.vermelho }} />
      </div>
    </>
  );
};
