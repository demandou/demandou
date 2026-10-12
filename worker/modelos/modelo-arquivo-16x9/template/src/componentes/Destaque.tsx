import { Datilo, duracaoDatilo, preciso, prog, saindo } from "../anim";
import { encaixar, encaixarBloco, larguraTexto } from "../medida";
import type { Destaque as TDestaque } from "../plano";
import { cor, mono, QUADRO, sans } from "../tema";
import { Carimbo } from "./Carimbo";
import { topoDoVeu, Veu } from "./Veu";

// Destaque: uma tira de papel entra no terço de baixo (abaixo do queixo) e a palavra bate nela.
// "alerta" = carimbo vermelho de filete duplo, que desce e bate seco com a tinta falhada;
// "chave"  = a palavra datilografada em preto, sublinhada por um traço vermelho.
export const Destaque: React.FC<{
  m: TDestaque;
  t: number;
  fim: number;
  area: { x: number; y: number; w: number; h: number };
}> = ({ m, t, fim, area }) => {
  const alerta = (m.nivel ?? "alerta") === "alerta";
  const sai = saindo(t, fim - 0.05, 0.25);
  // a tira chega junto com a palavra (sem ficar vazia esperando)
  const chega = Math.max(m.de, m.em - 0.3);
  const entra = prog(t, chega, 0.3);
  const texto = m.texto.toUpperCase();
  const PAD = 34;
  // carimbo: filete duplo + respiro interno (~70 px na largura); chave: texto puro
  const largura = area.w - 2 * PAD - (alerta ? 80 : 0);
  const detalhe = m.detalhe ? encaixar(m.detalhe, { largura: area.w - 2 * PAD, max: 40, min: 34, linhas: 2, fonte: { mono: true } }) : null;
  // no quadro deitado a faixa é baixa: a palavra cabe na altura que sobra (respiros, filete do
  // carimbo e o detalhe), em até 2 linhas; a tira larga quase sempre a deixa numa linha só
  const alturaTexto = area.h - (PAD - 6) - PAD - (alerta ? 50 : 17) - (detalhe ? 18 + detalhe.linhas.length * detalhe.tamanho * 1.15 : 0);
  const fit = encaixarBloco(texto, { largura, altura: alturaTexto, max: alerta ? 78 : 84, min: 50, maxLinhas: 2, entrelinha: 1.04, fonte: { peso: 800, espacamento: 0.06 } });
  const larguraLinhas = Math.max(...fit.linhas.map((l) => larguraTexto(l, fit.tamanho, { peso: 800, espacamento: 0.06 })));
  const detalheEm = m.detalheEm ?? m.em + 0.6;
  const larguraDetalhe = detalhe ? Math.max(...detalhe.linhas.map((l) => larguraTexto(l, detalhe.tamanho, { mono: true }))) : 0;
  const larguraTira = Math.min(area.w, Math.max(larguraLinhas + (alerta ? 80 : 0), larguraDetalhe) + 2 * PAD + 10);
  const durTexto = duracaoDatilo(texto);
  const sublinha = prog(t, m.em + durTexto + 0.1, 0.45, preciso);
  // a tira se desenrola junto com o texto (nunca uma faixa de papel vazia esperando a palavra):
  // no alerta ela abre inteira até o carimbo bater; na chave, acompanha a datilografia
  const desenrola = alerta
    ? Math.max(0.14 * entra, prog(t, m.em - 0.26, 0.26, preciso))
    : Math.max(0.14 * entra, prog(t, m.em - 0.05, durTexto + 0.35, preciso));
  return (
    <>
      <Veu topo={topoDoVeu(area)} opacidade={entra * (1 - sai)} />
      <div
        style={{
          position: "absolute",
          left: area.x,
          bottom: QUADRO.h - (area.y + area.h),
          width: larguraTira,
          background: cor.cartao,
          boxSizing: "border-box",
          padding: `${PAD - 6}px ${PAD}px ${PAD}px`,
          rotate: "-1.2deg",
          boxShadow: "0 16px 36px rgba(0,0,0,0.38)",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 18,
          translate: `${(1 - entra) * -140 - sai * 40}px ${sai * 20}px`,
          clipPath: `inset(-60px ${(1 - desenrola) * 100}% -60px -60px)`,
          opacity: (1 - sai) * Math.min(1, entra * 3),
        }}
      >
        {alerta ? (
          <div style={{ minHeight: fit.linhas.length * fit.tamanho * 1.04 + 50, display: "flex", alignItems: "center" }}>
            <Carimbo texto={texto} linhas={fit.linhas} corpo={fit.tamanho} em={m.em} t={t} rot={-2.5} semente={17} />
          </div>
        ) : (
          <div style={{ fontFamily: sans, fontWeight: 800, fontSize: fit.tamanho, lineHeight: 1.04, letterSpacing: "0.06em", color: cor.tinta }}>
            {fit.linhas.map((l, i) => (
              <div key={i} style={{ whiteSpace: "nowrap" }}>
                <Datilo texto={l} em={m.em + i * 0.25} t={t} semente={160 + i} />
              </div>
            ))}
            <div style={{ height: 7, marginTop: 10, width: larguraLinhas * sublinha, background: cor.vermelho }} />
          </div>
        )}
        {detalhe ? (
          <div style={{ fontFamily: mono, fontWeight: 700, fontSize: detalhe.tamanho, lineHeight: 1.15, color: cor.grafite }}>
            {detalhe.linhas.map((l, i) => (
              <div key={i} style={{ whiteSpace: "nowrap" }}>
                <Datilo texto={l} em={detalheEm + i * 0.3} t={t} semente={170 + i} />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
};
