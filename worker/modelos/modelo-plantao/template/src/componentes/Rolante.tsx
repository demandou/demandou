// Um valor que rola de um número para outro, algarismo por algarismo, como um placar mecânico
// ("R$ 100" → "R$ 105": só o último algarismo gira, passando por 1, 2, 3, 4). Algarismos tabulares.
import { numeros } from "../tema";

export const Rolante: React.FC<{ de: string; para: string; p: number; style?: React.CSSProperties }> = ({ de, para, p, style }) => {
  // tamanhos diferentes: o valor inteiro rola, o novo empurra o antigo para cima (nunca os dois
  // um em cima do outro)
  if (de.length !== para.length) {
    return (
      <span style={{ position: "relative", display: "inline-block", overflow: "hidden", height: "1.04em", lineHeight: 1.04, verticalAlign: "top", ...numeros, ...style }}>
        <span style={{ visibility: "hidden", whiteSpace: "pre" }}>{de.length > para.length ? de : para}</span>
        <span style={{ position: "absolute", left: 0, top: 0, whiteSpace: "pre", translate: `0 ${-p * 105}%` }}>{de}</span>
        <span style={{ position: "absolute", left: 0, top: 0, whiteSpace: "pre", translate: `0 ${(1 - p) * 105}%` }}>{para}</span>
      </span>
    );
  }
  return (
    <span style={{ display: "inline-flex", ...numeros, ...style }}>
      {[...para].map((c, i) => {
        const a = de[i];
        if (a === c || !/\d/.test(a) || !/\d/.test(c)) return <span key={i} style={{ whiteSpace: "pre" }}>{c}</span>;
        const ia = Number(a);
        const ib = Number(c);
        const passos = ib >= ia ? ib - ia : ib + 10 - ia;
        const fita = Array.from({ length: passos + 1 }, (_, k) => (ia + k) % 10);
        return (
          <span key={i} style={{ position: "relative", display: "inline-block", overflow: "hidden", height: "1em", lineHeight: 1 }}>
            <span style={{ visibility: "hidden" }}>{c}</span>
            <span style={{ position: "absolute", left: 0, top: 0, display: "flex", flexDirection: "column", translate: `0 ${-p * passos}em` }}>
              {fita.map((d, k) => (
                <span key={k} style={{ height: "1em", lineHeight: 1 }}>
                  {d}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
};
