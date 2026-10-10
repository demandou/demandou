import { limitar, mistura, preciso, prog, saindo, Traco } from "../anim";
import { DesenhoCena } from "../desenho/Cena";
import { lin } from "../desenho/geometria";
import type { Regiao } from "../layout";
import type { AntesDepois as TAntesDepois, Layout, LadoComparado } from "../plano";
import { caber, cor, rotuloMono, sans, traco } from "../tema";

// Duas vistas: ANTES (já pronta, recua para o cinza) e DEPOIS (acende e recebe as mudanças no ritmo da fala).
// Na prancha cheia, o ANTES fica pequeno ao lado da janela da pessoa e o DEPOIS ocupa a prancha;
// na dividida, lado a lado; na lateral, um sobre o outro.
export const AntesDepois: React.FC<{
  m: TAntesDepois;
  t: number;
  fim: number;
  regiao: Regiao;
  layout: Layout;
  larguraTitulo?: number;
  alturaTitulo?: number;
}> = ({ m, t, fim, regiao, layout, larguraTitulo, alturaTitulo }) => {
  const s = saindo(t, fim, 0.28);
  const alturaResumo = m.resumo?.length ? 96 : 0;
  const util = { ...regiao, h: regiao.h - alturaResumo };
  const gap = 40;
  const caixas: [Regiao, Regiao] = (() => {
    if (layout === "cheia") {
      const topo = alturaTitulo ?? 460;
      return [
        { x: util.x, y: util.y + 12, w: larguraTitulo ?? util.w * 0.6, h: topo - 30 },
        { x: util.x, y: util.y + topo + 10, w: util.w, h: util.h - topo - 10 },
      ];
    }
    if (layout === "lateral") {
      const h = (util.h - gap) / 2;
      return [
        { x: util.x, y: util.y, w: util.w, h },
        { x: util.x, y: util.y + h + gap, w: util.w, h },
      ];
    }
    const w = (util.w - gap) / 2;
    return [
      { x: util.x, y: util.y, w, h: util.h },
      { x: util.x + w + gap, y: util.y, w, h: util.h },
    ];
  })();
  const acende = prog(t, m.depois.em, 0.5, preciso);

  const Lado: React.FC<{ lado: LadoComparado; r: Regiao; depois: boolean }> = ({ lado, r, depois }) => {
    const rotulo = lado.rotulo ?? (depois ? "Depois" : "Antes");
    const pRegua = prog(t, m.de + (depois ? 0.2 : 0.05), 0.6, preciso);
    const corRotulo = depois ? (acende > 0.5 ? cor.acento : cor.cinza) : cor.grafite;
    const recuo = depois ? 1 : mistura(1, 0.45, acende);
    const cena: Regiao = { x: r.x, y: r.y + 64, w: r.w, h: r.h - 64 };
    return (
      <>
        <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w }}>
          <div style={{ ...rotuloMono, fontSize: 32, color: corRotulo, opacity: prog(t, m.de + 0.1, 0.4) }}>{rotulo}</div>
          <svg width={r.w} height={18} style={{ display: "block", marginTop: 10 }}>
            <Traco d={lin(0, 8, r.w, 8)} p={pRegua} cor={depois && acende > 0.5 ? cor.acento : cor.grafite} largura={traco.fino} />
          </svg>
        </div>
        <div style={{ position: "absolute", inset: 0, opacity: recuo }}>
          {lado.objetos && m.ambiente ? (
            <DesenhoCena
              cena={{ vista: m.vista, ambiente: m.ambiente, objetos: lado.objetos, circulacao: lado.circulacao, areas: lado.areas }}
              regiao={cena}
              t={t}
              inicio={m.de}
              compacto={cena.w < 700}
            />
          ) : (
            <div
              style={{
                position: "absolute",
                left: cena.x,
                top: cena.y,
                width: cena.w,
                height: cena.h,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                fontFamily: sans,
                fontWeight: 300,
                fontSize: Math.max(52, caber(lado.texto ?? "", cena.w * 1.6, 76)),
                lineHeight: 1.12,
                color: cor.grafite,
                opacity: depois ? acende : prog(t, m.de + 0.2, 0.4),
              }}
            >
              <span style={{ position: "relative" }}>
                {lado.texto}
                {!depois ? (
                  <span
                    style={{ position: "absolute", left: 0, top: "52%", height: 4, width: `${prog(t, m.depois.em, 0.5, preciso) * 100}%`, background: cor.acento }}
                  />
                ) : null}
              </span>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - s }}>
      <Lado lado={m.antes} r={caixas[0]} depois={false} />
      <Lado lado={m.depois} r={caixas[1]} depois />
      {m.resumo?.length ? (
        <div
          style={{
            position: "absolute",
            left: regiao.x,
            top: regiao.y + regiao.h - alturaResumo + 14,
            width: regiao.w,
            display: "flex",
            gap: 22,
            justifyContent: "center",
          }}
        >
          {m.resumo.map((r, i) => {
            const p = prog(t, r.em - 0.05, 0.45);
            const [numero, ...resto] = r.texto.split(" ");
            const temNumero = /\d/.test(numero);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 14,
                  padding: "10px 28px 14px",
                  border: `3px solid ${cor.grafite}`,
                  background: cor.papel,
                  opacity: limitar(p * 1.5),
                  translate: `0 ${(1 - p) * 24}px`,
                  fontFamily: sans,
                  fontSize: 50,
                  lineHeight: 1,
                  color: cor.grafite,
                }}
              >
                {temNumero ? <span style={{ fontWeight: 600, color: cor.acento }}>{numero}</span> : null}
                <span style={{ fontWeight: 300 }}>{temNumero ? resto.join(" ") : r.texto}</span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};
