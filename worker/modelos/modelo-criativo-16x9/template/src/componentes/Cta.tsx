// O fechamento do Criativo: o BOTÃO (pílula na cor da marca, seta que aponta para baixo, pulso a
// cada ~1,2 s, toque do dedo em `toqueEm`) e, no palco, o cartão final com o produto. Fica até o
// último quadro. No quadro deitado (16:9), o botão fica embaixo do cartão final, no quadro da
// esquerda; sem cartão, no peito, logo acima da legenda (o layout diz o centro: `x`, `y`).
import { prog, salto, saindo } from "../anim";
import { larguraTexto } from "../medida";
import type { Cta as TCta } from "../plano";
import { cor, fonte, type Tons } from "../tema";
import { CartaoHeroi, Placa, type PropsPalco } from "./Assinatura";
import { Icone } from "./Vidro";

export const Botao: React.FC<{ t: number; m: TCta; x: number; y: number; tons: Tons }> = ({ t, m, x, y, tons }) => {
  const entra = m.em ?? m.de;
  if (t < entra - 0.1) return null;
  const p = prog(t, entra - 0.1, 0.4, salto);
  const vida = Math.max(0, t - entra);
  const toque = m.toqueEm ?? entra + 0.5;
  // o dedo chega, aperta e sai
  const pDedo = prog(t, toque - 0.32, 0.3);
  const aperto = t >= toque && t < toque + 0.22 ? Math.sin(((t - toque) / 0.22) * Math.PI) : 0;
  const pOnda = prog(t, toque, 0.6);
  const sai = saindo(t, toque + 0.75, 0.3);
  let S = 56;
  const icone = 84;
  const largura = (s: number) => larguraTexto(m.texto, s, { peso: 800 }) + icone + 3 * 30;
  while (S > 34 && largura(S) > 900) S -= 2;
  const w = Math.round(largura(S));
  const h = 126;
  // o dedo toca no círculo da seta, sem cobrir o texto do botão
  const alvo = w - 30 - icone / 2;
  // pulso suave a cada 1,2 s (o botão nunca fica parado)
  const ciclo = (vida % 1.2) / 1.2;
  const pulso = vida > 0.6 ? ciclo : 0;
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, opacity: Math.min(1, p * 2.5), transform: `translateY(${(1 - p) * 40}px) scale(${(0.86 + 0.14 * p) * (1 - 0.06 * aperto)})` }}>
      {pulso > 0 ? (
        <div style={{ position: "absolute", inset: -pulso * 22, borderRadius: h, border: `3px solid ${tons.destaque}`, opacity: 0.6 * (1 - pulso) }} />
      ) : null}
      {pOnda > 0 && pOnda < 1 ? (
        <div style={{ position: "absolute", left: alvo - 90 * pOnda, top: h / 2 - 90 * pOnda, width: 180 * pOnda, height: 180 * pOnda, borderRadius: "50%", background: "rgba(255,255,255,0.5)", opacity: 1 - pOnda }} />
      ) : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: h,
          background: tons.destaque,
          boxShadow: `0 18px 44px rgba(0,0,0,0.38), inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -6px 14px rgba(0,0,0,0.14)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 26,
          paddingLeft: 30,
          paddingRight: 30,
        }}
      >
        <span style={{ fontFamily: fonte, fontWeight: 800, fontSize: S, color: tons.sobreDestaque, letterSpacing: "-0.02em", whiteSpace: "nowrap", lineHeight: 1 }}>{m.texto}</span>
        <div style={{ width: icone, height: icone, borderRadius: icone / 2, background: tons.sobreDestaque, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ transform: `translateY(${Math.sin(vida * 5.5) * 5}px)` }}>
            <Icone nome={m.icone && m.icone !== "link" ? m.icone : "seta-baixo"} tamanho={icone * 0.6} cor={tons.destaque} traco={3} />
          </div>
        </div>
      </div>
      {pDedo > 0 && sai < 1 ? (
        <div
          style={{
            position: "absolute",
            left: alvo - 30 + (1 - pDedo) * 120,
            top: h * 0.42 + (1 - pDedo) * 110 + aperto * 8,
            opacity: Math.min(1, pDedo * 2) * (1 - sai),
            filter: "drop-shadow(0 8px 14px rgba(0,0,0,0.4))",
          }}
        >
          <div style={{ width: 96, height: 96, borderRadius: 48, background: "rgba(255,255,255,0.95)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icone nome="toque" tamanho={64} cor={cor.tinta} traco={2} />
          </div>
        </div>
      ) : null}
    </div>
  );
};

// O cartão final no palco (abaixo do botão): o produto herói, ou a chamada numa placa se não houver produto.
export const CartaoFinal: React.FC<PropsPalco & { m: TCta }> = ({ t, plano, m, fim, palco, tons, imediato }) => {
  if (m.imagem) {
    return (
      <CartaoHeroi
        t={t}
        plano={plano}
        imagem={m.imagem}
        em={m.de}
        fim={fim}
        ret={palco}
        tons={tons}
        imediato={imediato}
        titulo={m.titulo}
        tituloEm={m.tituloEm}
        destaque={m.destaque}
        de={m.de}
      />
    );
  }
  if (!m.titulo) return null;
  return <Placa t={t} plano={plano} texto={m.titulo} em={m.tituloEm ?? m.de} ate={fim} destaque={m.destaque} ret={palco} tons={tons} imediato={imediato} modo="aparece" entra={m.de} />;
};
