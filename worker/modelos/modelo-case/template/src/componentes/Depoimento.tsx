// O depoimento: o "print" da mensagem de quem recebeu o resultado, numa conversa genérica (sem logo
// de app, sem hora inventada). Entra com "digitando…", o balão aparece na palavra e as estrelas
// acendem uma a uma. Com `arquivo`, o print de verdade entra no lugar do balão.
import { Img, staticFile } from "remotion";
import { entrada, prog, salto, soco } from "../anim";
import type { Depoimento as TDepoimento, Plano } from "../plano";
import { cor, fonte, mono, sombraCartao } from "../tema";
import { CabecaDePagina, caber, Icone, Texto } from "./Pecas";
import { type Pagina, PH, PW } from "./Relatorio";


const TOPO = 84;

export const paginaDepoimento = (m: TDepoimento, _plano: Plano): Pagina => {
  const etiqueta = m.etiqueta ?? "Depoimento";
  const nome = m.nome?.trim() || "Cliente";
  const textoEm = m.textoEm ?? m.em + 0.3;
  const n = Math.max(0, Math.min(5, Math.round(m.estrelas ?? 0)));
  const estrelasEm = m.estrelasEm ?? textoEm + 0.5;
  // geometria do cartão de conversa
  const W = 800;
  const x0 = (PW - W) / 2;
  const barra = 112;
  const largBalao = W - 120;
  const fB = caber(m.texto, largBalao - 64, 48, 32, 4, 700);
  const altTexto = fB.linhas.length * fB.tamanho * 1.24;
  const altBalao = m.arquivo ? 300 : altTexto + 56;
  const tamEstrela = 64;
  const altEstrelas = n ? tamEstrela + 34 : 0;
  const H = barra + 34 + altBalao + altEstrelas + 40;
  const y0 = TOPO + Math.max(18, (PH - TOPO - H) / 2);
  return {
    // a câmera chega com o balão (o cartão já sobe com "digitando…" na palavra que o anuncia)
    chegada: Math.max(m.em, textoEm - 0.12),
    etiqueta,
    altura: PH,
    momento: m,
    desenhar: (t) => {
      const eC = entrada(t, m.em - 0.04, { sobe: 30, de: 0.96 });
      const digitando = t >= m.em && t < textoEm;
      const pB = prog(t, textoEm, 0.3, salto);
      return (
        <>
          <CabecaDePagina t={t} texto={etiqueta} em={m.em} largura={PW} />
          <div style={{ position: "absolute", left: x0, top: y0, width: W, height: H, opacity: eC.opacity, transform: eC.transform }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 30, background: cor.conversa, boxShadow: sombraCartao, border: `2px solid ${cor.filete}` }} />
            {/* barra do contato */}
            <div style={{ position: "absolute", left: 0, top: 0, width: W, height: barra, borderRadius: "30px 30px 0 0", background: cor.cartao, borderBottom: `2px solid ${cor.filete}` }} />
            <div style={{ position: "absolute", left: 28, top: (barra - 68) / 2, width: 68, height: 68, borderRadius: 34, background: cor.acentoClaro, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              <div style={{ marginTop: 14 }}>
                <Icone nome="pessoa" tamanho={58} cor={cor.acentoEscuro} traco={2} />
              </div>
            </div>
            <div style={{ position: "absolute", left: 118, top: 22 }}>
              <div style={{ fontFamily: fonte, fontWeight: 800, fontSize: 38, color: cor.tinta, lineHeight: 1.1, letterSpacing: "-0.015em", whiteSpace: "nowrap" }}>{nome}</div>
              <div style={{ fontFamily: mono, fontSize: 21, color: digitando ? cor.acento : cor.tintaSuave, letterSpacing: "0.06em", marginTop: 4, whiteSpace: "nowrap" }}>
                {digitando ? "digitando…" : "mensagem nova"}
              </div>
            </div>
            {/* digitando… */}
            {digitando ? (
              <div style={{ position: "absolute", left: 32, top: barra + 34, width: 150, height: 74, borderRadius: "10px 30px 30px 30px", background: cor.cartao, display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ width: 16, height: 16, borderRadius: 8, background: cor.tintaFraca, transform: `translateY(${Math.sin((t - m.em) * 10 - i * 0.9) * 6}px)` }} />
                ))}
              </div>
            ) : null}
            {/* o balão (ou o print de verdade) */}
            {t >= textoEm ? (
              <div
                style={{
                  position: "absolute",
                  left: 32,
                  top: barra + 34,
                  width: m.arquivo ? W - 64 : largBalao,
                  height: altBalao,
                  borderRadius: "10px 30px 30px 30px",
                  background: cor.cartao,
                  boxShadow: "0 4px 12px rgba(18,23,34,0.08)",
                  overflow: "hidden",
                  opacity: Math.min(1, pB * 1.6),
                  transform: pB < 1 ? `scale(${0.9 + 0.1 * pB})` : undefined,
                  transformOrigin: "0% 0%",
                }}
              >
                {m.arquivo ? (
                  <Img src={staticFile(m.arquivo)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ position: "absolute", left: 32, top: 28 }}>
                    <Texto t={t} linhas={fB.linhas} tamanho={fB.tamanho} peso={700} altura={1.24} />
                  </div>
                )}
              </div>
            ) : null}
            {/* estrelas */}
            {n && t >= textoEm ? (
              <div style={{ position: "absolute", left: 32, top: barra + 34 + altBalao + 34, display: "flex", gap: 16 }}>
                {Array.from({ length: n }, (_, i) => {
                  // cada estrela já entra cheia, com um salto (nada de estrela vazia esperando)
                  const em = estrelasEm + i * 0.05;
                  const pE = prog(t, em, 0.22, salto);
                  const golpe = soco(t, em + 0.12, 0.3);
                  return (
                    <div key={i} style={{ visibility: t >= em ? "visible" : "hidden", opacity: Math.min(1, pE * 2), transform: `scale(${(0.3 + 0.7 * pE) * (1 + 0.18 * golpe)})` }}>
                      <Icone nome="estrela" tamanho={tamEstrela} cor={cor.acento} traco={1.8} preencher={cor.acento} />
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </>
      );
    },
  };
};
