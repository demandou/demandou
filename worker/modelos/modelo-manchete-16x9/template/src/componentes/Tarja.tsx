// A TARJA da Manchete: pílula rosa-vermelha centrada, montada na borda de baixo da faixa do B-roll
// (metade na foto, metade na pessoa), só no começo do Reel. Entra no primeiro quadro (sem animação) e
// fica ~6 s: sai em `tarjaAte` (padrão: o fim do momento), que deve cair num corte de B-roll — pode
// atravessar o primeiro corte. O modelo não tem selo.
import { encaixar, larguraTexto } from "../medida";
import type { Manchete, Plano } from "../plano";
import { COR, FONTE, LARGURA, MARGEM, TARJA } from "../tema";

export const Tarja: React.FC<{ plano: Plano; t: number }> = ({ plano, t }) => {
  const momentos = plano.momentos.filter((m): m is Manchete => m.tipo === "manchete").sort((a, b) => a.de - b.de);
  const m = momentos.find((x) => t >= x.de && t < (x.tarjaAte ?? x.ate));
  if (!m) return null;
  const texto = m.tarja.toUpperCase();
  // centrada; nunca passa da margem segura (64+ px de cada lado)
  const maxLarg = LARGURA - MARGEM * 2;
  const fit = encaixar(texto, { largura: maxLarg - TARJA.padding * 2, max: TARJA.max, min: TARJA.min, linhas: 1, fonte: { peso: 800 } });
  const larg = Math.min(maxLarg, Math.round(larguraTexto(texto, fit.tamanho, { peso: 800 }) + TARJA.padding * 2));
  return (
    <div
      style={{
        position: "absolute",
        left: Math.round((LARGURA - larg) / 2),
        top: TARJA.y,
        width: larg,
        height: TARJA.altura,
        borderRadius: TARJA.raio,
        boxShadow: "0 6px 18px rgba(0,0,0,0.3)",
        background: COR.tarja,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONTE,
        fontWeight: 800,
        fontSize: fit.tamanho,
        color: COR.branco,
        whiteSpace: "nowrap",
      }}
    >
      {texto}
    </div>
  );
};
