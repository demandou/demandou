import { Datilo } from "../anim";
import { encaixar } from "../medida";
import { cor, sans } from "../tema";

// Título de um documento, datilografado direto na folha (em caixa alta, tinta preta).
// Mede o texto e devolve a altura que ocupa, para o corpo do documento começar logo abaixo.
export const medirCabeca = (titulo: string | undefined, largura: number, max = 72, linhas = 2) => {
  if (!titulo?.trim()) return { fit: null, altura: 0 };
  const fit = encaixar(titulo.toUpperCase(), { largura, max, min: 48, linhas, fonte: { peso: 800, espacamento: 0.01 } });
  return { fit, altura: fit.linhas.length * fit.tamanho * 1.04 + 34 };
};

export const Cabeca: React.FC<{
  fit: { tamanho: number; linhas: string[] } | null;
  x: number;
  y: number;
  em: number;
  t: number;
  semente?: number;
}> = ({ fit, x, y, em, t, semente = 0 }) =>
  fit ? (
    <div style={{ position: "absolute", left: x + 4, top: y, fontFamily: sans, fontWeight: 800, fontSize: fit.tamanho, lineHeight: 1.04, letterSpacing: "0.01em", color: cor.tinta }}>
      {fit.linhas.map((l, i) => (
        <div key={i} style={{ whiteSpace: "nowrap" }}>
          <Datilo texto={l} em={em + i * 0.3} t={t} semente={semente + i} />
        </div>
      ))}
    </div>
  ) : null;
