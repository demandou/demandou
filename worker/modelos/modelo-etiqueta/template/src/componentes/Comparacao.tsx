// Comparação na metade de cima: dois cartões que se encaram, cada um salta quando é dito.
// "contra" = VS no meio; "antes-depois" = seta; "errado-certo" = ✗ e ✓. O vencedor ganha a tarja.
import { AbsoluteFill } from "remotion";
import { entradaAdesivo, prog, salto } from "../anim";
import { TOPO } from "../layout";
import { encaixar } from "../medida";
import { Foto, imagemDoPlano, temImagem } from "../motor/imagem";
import type { Comparacao as TComparacao } from "../plano";
import { cor, fonte, sombraCartao, sombraDura } from "../tema";
import { Icone } from "./Icones";
import { alturaDoTitulo, saidaDoTopo, Titulo, type PropsTopo } from "./Topo";

export const Comparacao: React.FC<PropsTopo & { m: TComparacao }> = ({ m, t, plano, t0, saiCruzando }) => {
  const modo = m.modo ?? "contra";
  const hTitulo = alturaDoTitulo(m.titulo);
  const yCartoes = TOPO.y + hTitulo + (m.titulo ? 16 : 6);
  const vao = 70;
  const w = (TOPO.w - vao) / 2;
  const h = Math.min(560, TOPO.base - yCartoes);
  const algumaImagem = m.lados.some((l) => temImagem(imagemDoPlano(plano, l.imagem)));
  const vencedorEm = m.vencedorEm ?? (m.vencedor !== undefined ? Math.max(m.lados[0].em, m.lados[1].em) + 0.7 : Infinity);
  const temVeredito = m.vencedor !== undefined && t >= vencedorEm;
  const pV = Number.isFinite(vencedorEm) ? prog(t, vencedorEm, 0.3, salto) : 0;
  const emMeio = Math.max(t0, m.lados[0].em) + 0.15;
  const pMeio = prog(t, emMeio, 0.28, salto);

  return (
    <AbsoluteFill style={{ opacity: 1 - saidaDoTopo(t, m.ate, saiCruzando) }}>
      {m.titulo ? <Titulo t={t} texto={m.titulo} em={t0} plano={plano} ate={m.ate} /> : null}
      {/* antes de cada lado ser dito, o lugar dele espera com um "?" (a tela nunca fica vazia) */}
      {m.lados.map((l, k) => {
        const em = Math.max(t0, l.em);
        const aparece = t0 + 0.08 + k * 0.1;
        if (t >= em || t < aparece) return null;
        const p = prog(t, aparece, 0.26, salto);
        return (
          <div
            key={`vaga${k}`}
            style={{
              position: "absolute",
              left: TOPO.x + k * (w + vao),
              top: yCartoes,
              width: w,
              height: h,
              borderRadius: 30,
              border: "6px dashed rgba(255,255,255,0.4)",
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: Math.min(1, p * 3),
              transform: `rotate(${k === 0 ? -2 : 2}deg) scale(${(p >= 1 ? 1 : 0.7 + 0.3 * p) * (1 + 0.025 * Math.sin((t - aparece) * 6 + k))})`,
            }}
          >
            <div style={{ fontFamily: fonte, fontWeight: 800, fontSize: 150, color: cor.tarja, lineHeight: 1 }}>?</div>
          </div>
        );
      })}
      {m.lados.map((l, k) => {
        const em = Math.max(t0, l.em);
        if (t < em) return null;
        const giro = k === 0 ? -2 : 2;
        const e = entradaAdesivo(t, em, { giro, de: 0.6, dur: 0.3 });
        const img = imagemDoPlano(plano, l.imagem);
        const comImagem = temImagem(img);
        const alturaImagem = algumaImagem ? Math.round(h * 0.6) : 0;
        const rot = encaixar(l.rotulo, { largura: w - 70, max: 44, min: 26, linhas: 1, fonte: { peso: 800, caixaAlta: true } });
        const txt = encaixar(l.texto, { largura: w - 50, max: algumaImagem ? 50 : 66, min: 28, linhas: algumaImagem ? 2 : 4, fonte: { peso: 800, caixaAlta: true } });
        const venceu = temVeredito && m.vencedor === k;
        const perdeu = temVeredito && m.vencedor !== k;
        const marcaErradoCerto = modo === "errado-certo" ? (k === 0 ? "errado" : "certo") : null;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: TOPO.x + k * (w + vao),
              top: yCartoes,
              width: w,
              height: h,
              borderRadius: 30,
              background: cor.placaSolida,
              border: `8px solid ${venceu ? cor.tarja : cor.papel}`,
              boxSizing: "border-box",
              boxShadow: sombraCartao,
              overflow: "visible",
              opacity: e.opacity * (perdeu ? 1 - 0.45 * pV : 1),
              transform: venceu ? `${e.transform ?? ""} scale(${1 + 0.04 * pV})` : e.transform,
              filter: perdeu ? `grayscale(${pV})` : undefined,
            }}
          >
            {algumaImagem ? (
              <div style={{ position: "absolute", left: 0, top: 0, width: w - 16, height: alturaImagem, borderRadius: "22px 22px 0 0", overflow: "hidden", background: cor.fundo }}>
                {comImagem ? <Foto imagem={img} de={em} t={t} largura={w - 16} altura={alturaImagem} intensidade={0.09} /> : null}
              </div>
            ) : null}
            {/* rótulo na tarja, na emenda da foto */}
            <div
              style={{
                position: "absolute",
                left: 20,
                top: algumaImagem ? alturaImagem - rot.tamanho * 0.75 : 26,
                padding: `${rot.tamanho * 0.18}px ${rot.tamanho * 0.42}px`,
                borderRadius: rot.tamanho * 0.22,
                background: marcaErradoCerto === "certo" ? cor.certo : marcaErradoCerto === "errado" ? cor.alerta : cor.tarja,
                boxShadow: sombraDura(marcaErradoCerto === "certo" ? "#168A4C" : marcaErradoCerto === "errado" ? cor.alertaBorda : cor.tarjaBorda, 5),
                fontFamily: fonte,
                fontWeight: 800,
                fontSize: rot.tamanho,
                lineHeight: 1.1,
                color: marcaErradoCerto === "errado" ? cor.tintaEscura : cor.tinta,
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                transform: `rotate(${-giro}deg)`,
              }}
            >
              {l.rotulo}
            </div>
            <div
              style={{
                position: "absolute",
                left: 24,
                right: 24,
                top: algumaImagem ? alturaImagem + rot.tamanho * 0.7 : 26 + rot.tamanho * 1.6,
                bottom: 16,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              {txt.linhas.map((x, i) => (
                <div key={i} style={{ fontFamily: fonte, fontWeight: 800, fontSize: txt.tamanho, lineHeight: 1.1, color: cor.tinta, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                  {x}
                </div>
              ))}
            </div>
            {marcaErradoCerto || venceu || perdeu ? (
              <div
                style={{
                  position: "absolute",
                  right: -22,
                  top: -22,
                  width: 76,
                  height: 76,
                  borderRadius: 38,
                  background: (venceu || marcaErradoCerto === "certo") && !perdeu ? cor.certo : perdeu ? "#55505C" : cor.alerta,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 0 rgba(0,0,0,0.25)",
                }}
              >
                <Icone nome={venceu || (!perdeu && marcaErradoCerto === "certo") ? "certo" : "errado"} tamanho={50} cor={marcaErradoCerto === "errado" && !temVeredito ? cor.tintaEscura : cor.tinta} traco={3.4} />
              </div>
            ) : null}
          </div>
        );
      })}
      {/* o que fica entre os dois */}
      {modo !== "errado-certo" && t >= emMeio ? (
        <div
          style={{
            position: "absolute",
            left: 540 - 56,
            top: yCartoes + h * (algumaImagem ? 0.6 : 0.5) - 56,
            width: 112,
            height: 112,
            borderRadius: 56,
            background: cor.tarja,
            border: `6px solid ${cor.papel}`,
            boxShadow: sombraDura(cor.tarjaBorda, 6),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: fonte,
            fontWeight: 800,
            fontSize: 44,
            color: cor.tinta,
            opacity: Math.min(1, pMeio * 3),
            transform: pMeio >= 1 ? undefined : `scale(${0.4 + 0.6 * pMeio})`,
          }}
        >
          {modo === "contra" ? "VS" : <Icone nome="seta" tamanho={60} cor={cor.tinta} traco={3.4} />}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
