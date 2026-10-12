import { batida, prog, saindo, useTempo } from "../anim";
import type { Plano } from "../plano";
import { caber, caixaAlta, cor, larguraEm, QUADRO, rotulo, sora, TRACKING } from "../tema";

// Largura máxima da assinatura (no pé do quadro de texto, à esquerda, longe da moldura).
const LARGURA = 420;

// Rodapé fixo do quadro de texto em todo momento na moldura: filete no acento, nome e profissão.
// É sempre no mesmo lugar (o pé do quadro, à esquerda), então ancora a composição.
// Sem `marca.nome` no plano, não aparece.
export const Assinatura: React.FC<{ marca: Plano["marca"]; x: number; base: number; de: number; saida: number }> = ({
  marca,
  x,
  base,
  de,
  saida,
}) => {
  const t = useTempo();
  if (!marca.nome) return null;
  const nome = caixaAlta(marca.nome);
  const tamNome = Math.min(46, caber(nome, LARGURA, 46));
  // a profissão cabe numa linha até 34 px; se for longa, desce até 30 px e quebra em duas
  const tamArea = Math.max(30, Math.min(34, Math.floor(LARGURA / larguraEm(caixaAlta(marca.area), 700, 0.1))));
  const pFilete = prog(t, de + 0.12, 0.26);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        bottom: QUADRO.h - base,
        width: LARGURA,
        opacity: 1 - saindo(t, saida, 0.12),
      }}
    >
      <div style={{ width: 72 * pFilete, height: 7, background: cor.volt, marginBottom: 22 }} />
      <div
        style={{
          fontFamily: sora,
          fontWeight: 800,
          fontSize: tamNome,
          lineHeight: 1,
          letterSpacing: `${TRACKING}em`,
          color: cor.papel,
          whiteSpace: "nowrap",
          ...batida(t, de + 0.18),
        }}
      >
        {nome}
      </div>
      {marca.area ? (
        <div style={{ ...rotulo, fontSize: tamArea, lineHeight: 1.2, letterSpacing: "0.1em", marginTop: 14, color: cor.papel, opacity: 0.7, ...batida(t, de + 0.26) }}>
          {marca.area}
        </div>
      ) : null}
    </div>
  );
};
