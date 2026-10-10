// Vinheta "DICA N" em quadro cheio, na altura do peito: o quadrado amarelo com o número e a tarja
// escura com as marcas das dicas. Entra com o número falado e sai quando a pessoa encolhe.
// O fundo entra varrendo; os textos aparecem inteiros; na saída a vinheta inteira desliza e some.
import { conteudoDaTarja, prog, saidaDaTarja, saindo, varredura } from "../anim";
import { inicioVisual, type Janela } from "../layout";
import { cor, larga, rotulo } from "../tema";

export const Vinheta: React.FC<{ janela: Janela; janelas: Janela[]; total: number; t: number; topo: number }> = ({ janela, janelas, total, t, topo }) => {
  const { dica, numero } = janela;
  // entra quando a pessoa já voltou ao quadro cheio (depois da dica anterior)
  const de = inicioVisual(dica.de, janelas.filter((j) => j !== janela));
  // sai cedo: já sumiu quando a caixa da pessoa passa por cima dela
  const ate = janela.entra + 0.1;
  // sem tempo para a vinheta (a prancheta entra logo no começo da dica): o placar do canto basta
  if (janela.entra - dica.de < 0.3) return null;
  if (t < de - 0.05 || t > ate + 0.05) return null;
  const pFundo = prog(t, de + 0.02, 0.32);
  const pNum = prog(t, de + 0.1, 0.38);
  const s = saindo(t, ate, 0.22);
  const lado = 270;
  const largura = 540;
  return (
    <div style={{ position: "absolute", left: (1080 - lado - largura) / 2, top: topo + 30, width: lado + largura, height: lado, ...saidaDaTarja(s) }}>
      {/* fundo: quadrado amarelo + tarja escura, varrendo juntos */}
      <div style={{ position: "absolute", inset: 0, clipPath: varredura(pFundo), filter: "drop-shadow(0 18px 34px rgba(0,0,0,0.32))" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: lado, height: lado, background: cor.placar, borderRadius: "12px 0 0 12px" }} />
        <div style={{ position: "absolute", left: lado, top: 0, width: largura, height: lado, background: cor.tv, borderRadius: "0 12px 12px 0" }} />
      </div>
      {/* o número sobe de trás da borda do quadrado */}
      <div style={{ position: "absolute", left: 0, top: 0, width: lado, height: lado, overflow: "hidden", opacity: pFundo > 0.3 ? 1 : 0 }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", translate: `0 ${(1 - pNum) * 100}%` }}>
          <span style={{ ...larga, fontSize: 250, color: cor.tv, lineHeight: 1 }}>{numero}</span>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: lado,
          top: 0,
          width: largura,
          height: lado,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 44px",
          ...conteudoDaTarja(pFundo),
        }}
      >
        <span style={{ ...larga, fontSize: 112, color: cor.giz }}>Dica</span>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 26 }}>
          {Array.from({ length: total }, (_, i) => {
            const cheia = i + 1 < numero ? 1 : i + 1 === numero ? prog(t, de + 0.25, 0.4) : 0;
            return (
              <div key={i} style={{ position: "relative", width: 56, height: 16, borderRadius: 4, background: "rgba(243,246,239,0.2)", overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${cheia * 100}%`, background: cor.placar }} />
              </div>
            );
          })}
          <span style={{ ...rotulo, fontSize: 36, color: cor.tvTexto, marginLeft: 10, whiteSpace: "nowrap" }}>
            {numero} de {total}
          </span>
        </div>
      </div>
    </div>
  );
};
