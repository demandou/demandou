// A assinatura do Níveis: a FAIXA de cima, acima da cabeça.
// - Cartões de ~29% da largura, lado a lado, três colunas fixas (as mesmas em todos os ciclos).
// - Cada cartão entra em corte seco (1 quadro) na palavra do nível e fica até o corte seguinte.
// - O rótulo é branco, bold, caixa alta, sem caixa, centrado logo abaixo do cartão.
// - Fechamento: cartão do perfil com o botão "Seguir" no topo e, ~0,5 s depois, a pílula branca
//   `COMENTA "PALAVRA"` na altura do peito. Nada anima: tudo entra e sai em corte seco.
import { Img, staticFile } from "remotion";
import { Foto, imagemDoPlano, temImagem } from "../motor/imagem";
import { larguraTexto } from "../medida";
import type { Cta as TCta, Niveis as TNiveis, Nivel, Plano } from "../plano";
import { CARTAO_X, COR, FONTE, SOMBRA_TEXTO, medidas } from "../tema";

const FUNDO_PADRAO = "#F3F0E8";

const ConteudoDoCartao: React.FC<{ plano: Plano; n: Nivel; t: number; ate: number; w: number; h: number }> = ({ plano, n, t, ate, w, h }) => {
  const img = imagemDoPlano(plano, n.imagem);
  if (temImagem(img)) {
    // PNG transparente (objeto, recorte): inteiro, centrado sobre o fundo do cartão
    if (img.transparente) {
      return <Img src={staticFile(img.arquivo)} style={{ width: w * 0.9, height: h * 0.9, objectFit: "contain" }} />;
    }
    return <Foto imagem={img} foco={n.imagem?.foco} de={n.em} ate={ate} t={t} largura={w} altura={h} efeito="parado" />;
  }
  const texto = n.texto ?? img?.palavra ?? n.rotulo;
  let tam = 78;
  while (tam > 30 && larguraTexto(texto, tam, { peso: 800 }) > w - 50) tam -= 2;
  return <span style={{ fontFamily: FONTE, fontWeight: 800, fontSize: tam, color: COR.tinta, textAlign: "center", padding: 20, lineHeight: 1.1 }}>{texto}</span>;
};

// Um ciclo: de 1 a 3 cartões. Cada um vive de `em` até o fim do ciclo.
export const Niveis: React.FC<{ plano: Plano; m: TNiveis; t: number }> = ({ plano, m, t }) => {
  if (t < m.de || t >= m.ate) return null;
  const { cartaoTopo, cartaoAlt, cartaoLar, rotuloY } = medidas(plano);
  return (
    <>
      {m.itens.map((n, i) => {
        if (t < n.em || (n.ate !== undefined && t >= n.ate)) return null;
        const col = n.posicao ?? Math.min(i, 2);
        const x = CARTAO_X[col];
        const troca = n.depois && t >= n.depois.em ? n.depois.rotulo : n.rotulo;
        const maiusc = troca.toUpperCase();
        // rótulo: uma linha a 56 px (nunca abaixo de 52); se não couber, duas linhas
        let tam = 56;
        const larMax = cartaoLar + 6;
        const peso = { peso: 800 as const };
        while (tam > 52 && larguraTexto(maiusc, tam, peso) > larMax) tam -= 2;
        let linhas = [maiusc];
        const p = maiusc.split(/\s+/);
        if (larguraTexto(maiusc, tam, peso) > larMax && p.length > 1) {
          let melhor = 1;
          let dif = Infinity;
          for (let k = 1; k < p.length; k++) {
            const d = Math.abs(larguraTexto(p.slice(0, k).join(" "), tam, peso) - larguraTexto(p.slice(k).join(" "), tam, peso));
            if (d < dif) { dif = d; melhor = k; }
          }
          linhas = [p.slice(0, melhor).join(" "), p.slice(melhor).join(" ")];
        }
        // último recurso (palavra comprida): encolhe até caber
        while (tam > 30 && Math.max(...linhas.map((l) => larguraTexto(l, tam, peso))) > larMax) tam -= 2;
        return (
          <div key={i}>
            <div
              style={{
                position: "absolute",
                left: x,
                top: cartaoTopo,
                width: cartaoLar,
                height: cartaoAlt,
                borderRadius: 20,
                overflow: "hidden",
                background: n.fundo ?? FUNDO_PADRAO,
                boxShadow: "0 6px 22px rgba(0,0,0,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ConteudoDoCartao plano={plano} n={n} t={t} ate={m.ate} w={cartaoLar} h={cartaoAlt} />
            </div>
            <div
              style={{
                position: "absolute",
                left: x - 12,
                top: rotuloY,
                width: cartaoLar + 24,
                textAlign: "center",
                fontFamily: FONTE,
                fontWeight: 800,
                fontSize: tam,
                lineHeight: 1.12,
                color: COR.branco,
                letterSpacing: "0.01em",
                textShadow: "0 2px 12px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.6)",
              }}
            >
              {linhas.map((l, k) => (
                <div key={k} style={{ whiteSpace: "nowrap" }}>{l}</div>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
};

const VERIFICADO = (
  <svg width="30" height="30" viewBox="0 0 24 24" style={{ flex: "none" }}>
    <path d="M12 1.5l2.6 1.9 3.2-.1 1 3 2.6 1.9-1 3.1 1 3.1-2.6 1.9-1 3-3.2-.1L12 22.5l-2.6-1.9-3.2.1-1-3-2.6-1.9 1-3.1-1-3.1 2.6-1.9 1-3 3.2.1z" fill="#1D9BF0" />
    <path d="M7.8 12.3l3 3 5.4-5.9" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Fechamento: cartão do perfil no topo (de → ate) + pílula no peito (de + 0,5 → ate).
export const FechamentoCta: React.FC<{ plano: Plano; m: TCta; t: number }> = ({ plano, m, t }) => {
  if (t < m.de || t >= m.ate) return null;
  const { queixo } = medidas(plano);
  const usuario = plano.perfil?.usuario ?? plano.marca?.nome ?? "";
  const foto = plano.perfil?.foto;
  // pílula: 'Comenta "GPT"' em duas linhas (COMENTA / “GPT”)
  const bruto = (m.texto || "").trim();
  const casa = bruto.match(/^(comenta\w*)\s+(.+)$/i);
  const palavra = (m.destaque ?? "").replace(/["“”]/g, "");
  let l1 = casa ? casa[1].toUpperCase() : bruto.toUpperCase();
  let l2 = casa ? casa[2].replace(/^["“]|["”]$/g, "") : "";
  if (!casa && palavra) {
    l1 = "COMENTA";
    l2 = palavra;
  }
  if (l2) l2 = `“${l2.toUpperCase()}”`;
  const tam = 54;
  const w = Math.round(Math.max(larguraTexto(l1, tam, { peso: 800 }), larguraTexto(l2, tam, { peso: 800 })) + 150);
  const h = l2 ? 168 : 110;
  const yPilula = Math.round(Math.max(queixo + 90, 1060));
  const mostraPilula = t >= m.de + 0.5;
  return (
    <>
      {usuario ? (
        <div style={{ position: "absolute", left: 0, top: 84, width: 1080, display: "flex", justifyContent: "center" }}>
          <div style={{ width: 468, height: 132, borderRadius: 66, background: COR.papel, boxShadow: "0 6px 22px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", padding: "0 22px 0 18px", boxSizing: "border-box", gap: 16 }}>
            <div style={{ width: 92, height: 92, borderRadius: 46, flex: "none", overflow: "hidden", background: "#2B2B2B", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {foto ? (
                <Img src={staticFile(foto)} style={{ width: 92, height: 92, objectFit: "cover" }} />
              ) : (
                <span style={{ fontFamily: FONTE, fontWeight: 800, fontSize: 46, color: "#fff" }}>{usuario.slice(0, 1).toUpperCase()}</span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONTE, fontWeight: 800, fontSize: 36, color: COR.tinta, whiteSpace: "nowrap" }}>
                {usuario}
                {VERIFICADO}
              </div>
              <div style={{ marginTop: 8, height: 38, borderRadius: 10, background: "#4A5CF0", color: "#fff", fontFamily: FONTE, fontWeight: 700, fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>Seguir</div>
            </div>
          </div>
        </div>
      ) : null}
      {mostraPilula ? (
        <div style={{ position: "absolute", left: 0, top: yPilula, width: 1080, display: "flex", justifyContent: "center" }}>
          <div style={{ width: w, height: h, borderRadius: h / 2.2, background: COR.papel, boxShadow: "0 6px 22px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: FONTE, fontWeight: 800, fontSize: tam, color: COR.tinta, lineHeight: 1.12, whiteSpace: "nowrap" }}>{l1}</span>
            {l2 ? <span style={{ fontFamily: FONTE, fontWeight: 800, fontSize: tam, color: COR.tinta, lineHeight: 1.12, whiteSpace: "nowrap" }}>{l2}</span> : null}
          </div>
        </div>
      ) : null}
    </>
  );
};
