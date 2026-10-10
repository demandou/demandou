// Tópicos e passos na metade de cima: cada item é um cartão que salta quando é dito.
// O item que está sendo falado fica na tarja; os anteriores ficam brancos.
// Nos passos, um traço de tarja liga os números até o passo atual.
import { AbsoluteFill } from "remotion";
import { entradaAdesivo, prog, rapido } from "../anim";
import { TOPO } from "../layout";
import { larguraTexto, quebrarLinhas } from "../medida";
import { Foto, imagemDoPlano, temImagem } from "../motor/imagem";
import type { Passos as TPassos, Plano, Topicos as TTopicos } from "../plano";
import { cor, fonte, sombraCartao, sombraDura } from "../tema";
import { alturaDoTitulo, saidaDoTopo, Titulo, type PropsTopo } from "./Topo";

const F = { peso: 800 as const };

// mede todos os itens num corpo S: linhas e altura de cada cartão
const medirItens = (m: TTopicos | TPassos, S: number) => {
  const marca = S * 1.5;
  const larguraTexto_ = TOPO.w - marca - 26 - S * 1.1;
  return m.itens.map((it) => {
    const linhas = quebrarLinhas(it.texto, larguraTexto_, S, F);
    const largas = linhas.some((l) => larguraTexto(l, S, F) > larguraTexto_);
    const det = it.detalhe ? quebrarLinhas(it.detalhe, larguraTexto_, S * 0.62, { peso: 700 }) : [];
    const altura = linhas.length * S * 1.16 + det.length * S * 0.62 * 1.25 + S * 0.9;
    return { linhas, det, altura: Math.max(altura, marca + S * 0.5), largas };
  });
};

export const Lista: React.FC<PropsTopo & { m: TTopicos | TPassos }> = ({ m, t, plano, t0, saiCruzando }) => {
  const passos = m.tipo === "passos";
  const yTitulo = TOPO.y;
  const hTitulo = alturaDoTitulo(m.titulo);
  const yLista = yTitulo + hTitulo + (m.titulo ? 14 : 0);
  const espaco = TOPO.base - yLista;
  const vao = 16;
  // o maior corpo (até 62) em que tudo cabe, com no máximo 2 linhas por item
  let S = 62;
  let med = medirItens(m, S);
  while (S > 28) {
    const total = med.reduce((a, x) => a + x.altura, 0) + vao * (m.itens.length - 1);
    if (total <= espaco && med.every((x) => x.linhas.length <= 2 && !x.largas)) break;
    S -= 2;
    med = medirItens(m, S);
  }
  const marca = S * 1.5;
  // a lista fica centrada na altura livre (nunca grudada no título com um vazio embaixo)
  const altura = med.reduce((a, x) => a + x.altura, 0) + vao * (m.itens.length - 1);
  const ys: number[] = [];
  let y = yLista + Math.max(0, (espaco - altura) / 2) * 0.8;
  med.forEach((x) => {
    ys.push(y);
    y += x.altura + vao;
  });
  const visiveis = m.itens.filter((it) => t >= Math.max(t0, it.em)).length;
  const atual = visiveis - 1;
  // traço dos passos: do primeiro número até o atual
  const xMarca = TOPO.x + 14 + marca / 2;
  const yMarca = (k: number) => ys[k] + med[k].altura / 2;
  let yTraco = atual >= 0 ? yMarca(0) : 0;
  if (atual > 0) {
    const p = prog(t, Math.max(t0, m.itens[atual].em), 0.35, rapido);
    yTraco = yMarca(atual - 1) + (yMarca(atual) - yMarca(atual - 1)) * p;
  }

  return (
    <AbsoluteFill style={{ opacity: 1 - saidaDoTopo(t, m.ate, saiCruzando) }}>
      {m.titulo ? <Titulo t={t} texto={m.titulo} em={t0} plano={plano} ate={m.ate} y={yTitulo} /> : null}
      {passos && atual > 0 ? (
        <div style={{ position: "absolute", left: xMarca - 5, top: yMarca(0), width: 10, height: yTraco - yMarca(0), borderRadius: 5, background: cor.tarja }} />
      ) : null}
      {m.itens.map((it, k) => {
        const em = Math.max(t0, it.em);
        if (t < em) return null;
        const e = entradaAdesivo(t, em, { de: 0.82, dur: 0.24 });
        const naTarja = k === atual;
        const img = imagemDoPlano(plano, it.imagem);
        const comImagem = temImagem(img);
        const x = med[k];
        const pT = prog(t, em, 0.18);
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: TOPO.x,
              top: ys[k],
              width: TOPO.w,
              height: x.altura,
              borderRadius: S * 0.5,
              background: naTarja ? cor.tarja : cor.papel,
              boxShadow: naTarja ? sombraDura(cor.tarjaBorda, 6) : sombraCartao,
              opacity: e.opacity,
              transform: e.transform,
              transformOrigin: "20% 50%",
            }}
          >
            {/* marca: número (passos), ponto (tópicos) ou a foto do item */}
            <div
              style={{
                position: "absolute",
                left: 14,
                top: (x.altura - marca) / 2,
                width: marca,
                height: marca,
                borderRadius: comImagem ? marca / 2 : S * 0.36,
                overflow: "hidden",
                background: naTarja ? cor.papel : cor.tarja,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: fonte,
                fontWeight: 800,
                fontSize: S * 0.86,
                color: naTarja ? cor.tarja : cor.tinta,
              }}
            >
              {comImagem ? (
                <Foto imagem={img} de={em} t={t} largura={marca} altura={marca} efeito="parado" />
              ) : passos ? (
                k + 1
              ) : (
                <div style={{ width: S * 0.34, height: S * 0.34, borderRadius: S * 0.1, background: naTarja ? cor.tarja : cor.papel }} />
              )}
            </div>
            {comImagem && passos ? (
              <div
                style={{
                  position: "absolute",
                  left: 2,
                  top: (x.altura - marca) / 2 - 6,
                  width: S * 0.8,
                  height: S * 0.8,
                  borderRadius: S * 0.4,
                  background: cor.tarja,
                  border: `3px solid ${cor.papel}`,
                  color: cor.tinta,
                  fontFamily: fonte,
                  fontWeight: 800,
                  fontSize: S * 0.48,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {k + 1}
              </div>
            ) : null}
            <div
              style={{
                position: "absolute",
                left: 14 + marca + 26,
                top: 0,
                height: x.altura,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                opacity: pT,
              }}
            >
              {x.linhas.map((l, i) => (
                <div key={i} style={{ fontFamily: fonte, fontWeight: 800, fontSize: S, lineHeight: 1.16, color: naTarja ? cor.tinta : cor.tintaEscura, whiteSpace: "nowrap" }}>
                  {l}
                </div>
              ))}
              {x.det.map((l, i) => (
                <div
                  key={`d${i}`}
                  style={{ fontFamily: fonte, fontWeight: 700, fontSize: S * 0.62, lineHeight: 1.25, color: naTarja ? "rgba(255,255,255,0.86)" : "rgba(20,18,24,0.62)", whiteSpace: "nowrap" }}
                >
                  {l}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
