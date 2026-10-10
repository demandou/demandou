import { misturarCor, prog } from "../anim";
import { BASE_GRADE, cor, sans } from "../tema";

// Rodapé da página, como o fólio de uma revista: nome e área à esquerda; à direita, uma peça por
// momento (a do momento atual acende em verde). Fica sob a interface do app — é acabamento, não informação.
export const Rodape: React.FC<{ t: number; marca: { nome: string; area: string }; inicios: number[] }> = ({ t, marca, inicios }) => {
  const y = BASE_GRADE + 30;
  // uma peça por momento; com muitos momentos, as peças encolhem para caber ao lado do nome
  const lado = Math.max(12, Math.min(24, Math.floor(300 / Math.max(inicios.length, 1)) - 8));
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: y, height: 44, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 32, letterSpacing: "0.1em", textTransform: "uppercase", color: cor.tinta, whiteSpace: "nowrap" }}>
        {marca.nome}
        {marca.area ? <span style={{ color: cor.cinza, fontWeight: 600 }}>{`  ·  ${marca.area}`}</span> : null}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {inicios.map((de, i) => {
          const aceso = prog(t, de, 0.4) * (1 - prog(t, inicios[i + 1] ?? 9999, 0.4));
          const passou = prog(t, inicios[i + 1] ?? 9999, 0.4);
          return (
            <div
              key={i}
              style={{
                width: lado,
                height: lado,
                borderRadius: 5,
                background: aceso > 0.01 ? misturarCor(cor.pagina, cor.folha, aceso) : passou > 0.5 ? "rgba(38,40,33,0.28)" : "transparent",
                boxShadow: `inset 0 0 0 2.5px ${aceso > 0.5 ? cor.folha : "rgba(38,40,33,0.35)"}`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
