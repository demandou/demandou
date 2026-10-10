// O quadro de chaves: uma régua de madeira com um gancho por item. Cada item vira uma etiqueta
// pendurada: nasce a lápis no gancho, acende em verde e balança quando o item é dito, e fica no
// papel (com um visto) quando o próximo item começa.
import { balanco, prog } from "../anim";
import { encaixar, ROTULO } from "../medida";
import type { Item } from "../plano";
import { cor, grotesca, MARGEM, QUADRO, rotulo, serifa, W } from "../tema";
import { FundoEtiqueta } from "./Etiqueta";
import { Visto } from "./Icones";

export type EtiquetaDoQuadro = { item: Item; em: number; fim: number };

const PINO_Y = QUADRO.ganchoY + 10;
const ARGOLA_R = 19;
// o furo da etiqueta fica na curva de baixo da argola
const topoDaEtiqueta = (largura: number) => ARGOLA_R * 2 - 7 - Math.min(largura * 0.24, 46) * 0.95;

const Regua: React.FC = () => {
  const largura = W - 2 * MARGEM;
  return (
    <svg width={largura} height={QUADRO.altura + 16} style={{ position: "absolute", left: MARGEM, top: QUADRO.y, overflow: "visible" }}>
      <rect x={0} y={6} width={largura} height={QUADRO.altura} rx={9} fill="rgba(40,30,20,0.18)" />
      <rect x={0} y={0} width={largura} height={QUADRO.altura} rx={9} fill={cor.madeira} />
      {/* veios */}
      {[11, 19, 30, 36].map((y, i) => (
        <path
          key={y}
          d={`M 14 ${y} C ${largura * 0.3} ${y + (i % 2 ? 3 : -3)}, ${largura * 0.6} ${y + (i % 2 ? -2 : 3)}, ${largura - 14} ${y}`}
          stroke={cor.veio}
          strokeWidth={2}
          fill="none"
        />
      ))}
      <rect x={0} y={QUADRO.altura - 6} width={largura} height={6} rx={3} fill={cor.madeiraEscura} opacity={0.45} />
      {/* parafusos */}
      {[26, largura - 26].map((x) => (
        <g key={x}>
          <circle cx={x} cy={QUADRO.altura / 2} r={8} fill={cor.lataoEscuro} />
          <path d={`M ${x - 5} ${QUADRO.altura / 2} H ${x + 5}`} stroke={cor.madeiraEscura} strokeWidth={2.5} />
        </g>
      ))}
    </svg>
  );
};

const Pino: React.FC<{ x: number }> = ({ x }) => (
  <svg width={30} height={40} style={{ position: "absolute", left: x - 15, top: QUADRO.y + QUADRO.altura - 10, overflow: "visible" }}>
    <rect x={9} y={0} width={12} height={26} rx={4} fill={cor.preto} />
    <circle cx={15} cy={27} r={8} fill={cor.preto} />
  </svg>
);

export const Quadro: React.FC<{ etiquetas: EtiquetaDoQuadro[]; presenca: number; t: number }> = ({ etiquetas, presenca, t }) => {
  if (presenca <= 0.001 || etiquetas.length === 0) return null;
  const n = etiquetas.length;
  const vao = (W - 2 * MARGEM) / n;
  const largura = Math.min(250, vao - 44);
  const altura = QUADRO.etiquetaAltura;
  const sobe = (1 - presenca) * -(QUADRO.fundo + 60);
  // o rótulo de cada etiqueta cabe na largura dela (até 2 linhas, nunca abaixo de 30 px)
  const rotulos = etiquetas.map((e) => encaixar(e.item.etiqueta, { largura: largura - 26, max: 32, min: 30, linhas: 2, fonte: ROTULO }));
  const rotuloDe = (i: number, c: string) => (
    <div style={{ ...rotulo, fontFamily: grotesca, fontSize: rotulos[i].tamanho, lineHeight: rotulos[i].linhas.length > 1 ? 1.08 : 1, marginTop: 14, color: c, textAlign: "center" }}>
      {rotulos[i].linhas.map((l, k) => (
        <div key={k}>{l}</div>
      ))}
    </div>
  );

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: QUADRO.fundo + 40, translate: `0 ${sobe}px` }}>
      <Regua />
      {etiquetas.map((e, i) => {
        const x = MARGEM + vao * (i + 0.5);
        // a etiqueta de verdade chega no gancho (cai um pouco) e balança
        const chega = prog(t, e.em - 0.05, 0.32);
        const acesa = chega * (1 - prog(t, e.fim - 0.05, 0.4));
        const feita = prog(t, e.fim - 0.05, 0.4);
        const angulo = balanco(t, e.em + 0.1, 10) + (feita > 0 ? balanco(t, e.fim, 2.5) : 0);
        const numeroCor = acesa > 0.5 ? cor.papel : cor.preto;
        return (
          <div key={`${e.item.de}-${i}`}>
            <Pino x={x} />
            {/* esboço a lápis no gancho (some quando a etiqueta chega) */}
            {chega < 0.999 ? (
              <div style={{ position: "absolute", left: x - largura / 2, top: PINO_Y + topoDaEtiqueta(largura), width: largura, height: altura, opacity: 1 - chega }}>
                <FundoEtiqueta w={largura} h={altura} esboco={1} />
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 34 }}>
                  <div style={{ fontFamily: serifa, fontSize: 92, lineHeight: 1, fontVariantNumeric: "lining-nums", color: cor.lapis }}>{i + 1}</div>
                  {rotuloDe(i, cor.lapisClaro)}
                </div>
              </div>
            ) : null}
            {chega > 0.001 ? (
              <div
                style={{
                  position: "absolute",
                  left: x - largura / 2 - 40,
                  top: PINO_Y,
                  width: largura + 80,
                  height: altura + 60,
                  transformOrigin: `${largura / 2 + 40}px 0px`,
                  rotate: `${angulo}deg`,
                  translate: `0 ${(1 - chega) * -46}px`,
                  opacity: Math.min(1, chega * 1.6),
                }}
              >
                <div style={{ position: "absolute", left: 40, top: topoDaEtiqueta(largura), width: largura, height: altura }}>
                  <FundoEtiqueta w={largura} h={altura} acesa={acesa} />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingTop: 34,
                    }}
                  >
                    <div style={{ fontFamily: serifa, fontSize: 92, lineHeight: 1, fontVariantNumeric: "lining-nums", color: numeroCor }}>{i + 1}</div>
                    {rotuloDe(i, acesa > 0.5 ? cor.papel : cor.texto2)}
                  </div>
                  {feita > 0.01 ? (
                    <div style={{ position: "absolute", right: 14, top: 52, opacity: feita, scale: `${1.25 - 0.25 * feita}` }}>
                      <Visto tamanho={44} fundo={cor.verde} traco={cor.papel} p={prog(t, e.fim + 0.1, 0.3)} />
                    </div>
                  ) : null}
                </div>
                {/* argola */}
                <svg width={ARGOLA_R * 2 + 12} height={ARGOLA_R * 2 + 12} style={{ position: "absolute", left: largura / 2 + 40 - ARGOLA_R - 6, top: -6, overflow: "visible" }}>
                  <circle cx={ARGOLA_R + 6} cy={ARGOLA_R + 6} r={ARGOLA_R} fill="none" stroke={cor.lataoEscuro} strokeWidth={7} />
                  <circle cx={ARGOLA_R + 6} cy={ARGOLA_R + 6} r={ARGOLA_R} fill="none" stroke={cor.latao} strokeWidth={4} />
                </svg>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
