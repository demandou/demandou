// A assinatura do Palco: o assunto ocupa a tela num painel grande; a pessoa vira uma janela num
// canto de baixo (Edicao.tsx). Este arquivo desenha as páginas do palco:
// - a moldura da página (o painel) e a troca entre páginas: a nova cobre a anterior deslizando da
//   direita, opaca (nunca duas páginas transparentes uma sobre a outra, nunca quadro vazio);
// - o conteúdo do bloco `palco`: a foto ou o print enquadrado pelo foco, aproximando devagar, as
//   anotações no ponto citado, o título no alto, o rótulo embaixo e a segunda imagem que divide
//   o painel quando é dita.
import { Img, staticFile } from "remotion";
import { encaixar, larguraTexto } from "../medida";
import { SemImagem, imagemDoPlano, temImagem, type Imagem } from "../motor/imagem";
import { DUR_TROCA, type Cena } from "../cenas";
import { ajusteDo, fimDaPagina, inicioDaPagina, mapaDaFoto, metade, VAO_METADES } from "../palco";
import type { Anotacao, Canto, MomentoDePalco, Palco as TPalco, Plano } from "../plano";
import { COR, FONTE, PAINEL, SOMBRA_PECA, prog, troca } from "../tema";
import { UmaAnotacao } from "./Anotacoes";
import { ConteudoDoBloco } from "./BlocosPalco";

// ——— peças ———

// Etiqueta do título, no alto do painel: marcador azul (número) + texto; revela da esquerda.
export const Titulo: React.FC<{ texto: string; etiqueta?: string; t: number; em: number; x?: number; y?: number; larguraMax?: number }> = ({
  texto,
  etiqueta,
  t,
  em,
  x = 24,
  y = 24,
  larguraMax = PAINEL.w - 48,
}) => {
  const e = prog(t, em, 0.4);
  if (e <= 0) return null;
  const alt = 76;
  const marca = etiqueta ? 54 : 0;
  const pad = 24;
  const fit = encaixar(texto, { largura: larguraMax - pad * 2 - (marca ? marca + 14 : 0), max: 38, min: 26, linhas: 1, fonte: { peso: 800 } });
  const w = Math.ceil(larguraTexto(fit.linhas[0] ?? texto, fit.tamanho, { peso: 800 })) + pad * 2 + (marca ? marca + 14 - pad + 11 : 0);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: alt,
        borderRadius: 20,
        background: "rgba(19,21,24,0.9)",
        boxShadow: "0 8px 22px rgba(0,0,0,0.3)",
        clipPath: `inset(0 ${((1 - e) * 100).toFixed(2)}% 0 0 round 20px)`,
        display: "flex",
        alignItems: "center",
        paddingLeft: marca ? 11 : pad,
        boxSizing: "border-box",
      }}
    >
      {etiqueta ? (
        <div
          style={{
            width: marca,
            height: marca,
            flex: "none",
            borderRadius: 14,
            background: COR.azul,
            color: COR.branco,
            fontFamily: FONTE,
            fontWeight: 800,
            fontSize: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 14,
          }}
        >
          {etiqueta}
        </div>
      ) : null}
      <div style={{ fontFamily: FONTE, fontWeight: 800, fontSize: fit.tamanho, color: COR.texto, whiteSpace: "nowrap", transform: `translateX(${(1 - e) * -10}px)` }}>
        {fit.linhas.join(" ")}
      </div>
    </div>
  );
};

// Rótulo de uma imagem: pílula clara pequena, no canto de baixo oposto à janela da pessoa.
const Rotulo: React.FC<{ texto: string; t: number; em: number; W: number; H: number; canto: Canto }> = ({ texto, t, em, W, H, canto }) => {
  const e = prog(t, em, 0.34);
  if (e <= 0) return null;
  const tam = 32;
  const alt = 58;
  const w = Math.ceil(larguraTexto(texto, tam, { peso: 800 })) + 44;
  const x = canto === "esq" ? W - 22 - w : 22;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: H - 22 - alt,
        width: w,
        height: alt,
        borderRadius: alt / 2,
        background: COR.texto,
        boxShadow: "0 6px 18px rgba(0,0,0,0.3)",
        clipPath: `inset(0 ${((1 - e) * 100).toFixed(2)}% 0 0 round ${alt / 2}px)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONTE,
        fontWeight: 800,
        fontSize: tam,
        color: COR.palco,
        whiteSpace: "nowrap",
      }}
    >
      {texto}
    </div>
  );
};

// ——— a foto num lugar do painel, com as anotações presas a ela ———

const FotoComAnotacoes: React.FC<{
  img: Imagem | null;
  W: number;
  H: number;
  ajuste: "cobrir" | "inteira";
  foco?: { x: number; y: number };
  t: number;
  de: number;
  ate: number;
  anotacoes: Anotacao[];
  fimAnotacoes: number;
}> = ({ img, W, H, ajuste, foco, t, de, ate, anotacoes, fimAnotacoes }) => {
  if (!temImagem(img)) {
    // sem imagem: o cartão com a palavra (nunca uma imagem errada)
    return (
      <SemImagem texto={img?.palavra ?? img?.id ?? ""} largura={W} altura={H} de={de} ate={undefined} t={t} fundo={COR.painelClaro} cor={COR.texto} fonte={FONTE} peso={800} entrada="corte" />
    );
  }
  // aproximação lenta: 4% no tempo da página (prints quase parados)
  const p = Math.min(1, Math.max(0, (t - de) / Math.max(0.5, ate - de)));
  const z = 1 + (ajuste === "inteira" ? 0.015 : 0.045) * (0.5 - Math.cos(Math.PI * p) / 2);
  const mapa = mapaDaFoto(img, W, H, ajuste, foco, z);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, overflow: "hidden" }}>
      <Img
        src={staticFile(img.arquivo)}
        style={{
          position: "absolute",
          left: mapa.x,
          top: mapa.y,
          width: mapa.w,
          height: mapa.h,
          maxWidth: "none",
          borderRadius: ajuste === "inteira" ? 16 : 0,
          boxShadow: ajuste === "inteira" ? "0 10px 30px rgba(0,0,0,0.35)" : undefined,
          transformOrigin: `${mapa.ox - mapa.x}px ${mapa.oy - mapa.y}px`,
          transform: `scale(${z})`,
        }}
      />
      {anotacoes.map((a, i) => {
        const q = mapa.ponto(a.x, a.y);
        return <UmaAnotacao key={i} a={a} px={q.x} py={q.y} W={W} H={H} t={t} ate={fimAnotacoes} />;
      })}
    </div>
  );
};

// ——— o bloco `palco` ———

const ConteudoPalco: React.FC<{ plano: Plano; m: TPalco; canto: Canto; t: number; de: number; fim: number }> = ({ plano, m, canto, t, de, fim }) => {
  const img1 = imagemDoPlano(plano, m.imagem);
  const seg = m.segunda;
  // a divisão: a primeira imagem sobe para a metade de cima, a segunda entra por baixo
  const ps = seg ? prog(t, seg.em - 0.06, 0.45, troca) : 0;
  const h1 = PAINEL.h - (PAINEL.h - metade()) * ps;
  const y2 = h1 + VAO_METADES;
  const img2 = seg ? imagemDoPlano(plano, seg.imagem) : null;
  const ajuste = ajusteDo(m, img1);
  return (
    <>
      <FotoComAnotacoes img={img1} W={PAINEL.w} H={h1} ajuste={ajuste} foco={m.imagem.foco} t={t} de={de} ate={fim} anotacoes={m.anotacoes ?? []} fimAnotacoes={fim} />
      {m.rotulo ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: PAINEL.w, height: h1 }}>
          <Rotulo texto={m.rotulo} t={t} em={m.rotuloEm ?? (m.em ?? m.de) + 0.25} W={PAINEL.w} H={h1} canto={canto} />
        </div>
      ) : null}
      {seg && ps > 0 ? (
        <div style={{ position: "absolute", left: 0, top: y2, width: PAINEL.w, height: metade() }}>
          <FotoComAnotacoes img={img2} W={PAINEL.w} H={metade()} ajuste="cobrir" foco={seg.imagem.foco} t={t} de={seg.em} ate={fim} anotacoes={seg.anotacoes ?? []} fimAnotacoes={fim} />
          {seg.rotulo ? <Rotulo texto={seg.rotulo} t={t} em={seg.em + 0.3} W={PAINEL.w} H={metade()} canto={canto} /> : null}
        </div>
      ) : null}
      {m.titulo ? <Titulo texto={m.titulo} etiqueta={m.etiqueta} t={t} em={m.tituloEm ?? m.de} /> : null}
    </>
  );
};

// ——— a página: moldura, troca e conteúdo ———

export const PaginaDoPalco: React.FC<{ plano: Plano; cena: Cena; i: number; t: number }> = ({ plano, cena, i, t }) => {
  const ini = inicioDaPagina(cena, i);
  const fim = fimDaPagina(cena, i);
  if (t < ini - 0.4 || t >= fim) return null;
  const { m, canto } = cena.paginas[i];
  // entrada: a primeira já está lá (a pessoa encolhe e revela); as outras cobrem a anterior
  const entra = i === 0 ? 1 : prog(t, ini, DUR_TROCA, troca);
  const proxima = i + 1 < cena.paginas.length ? prog(t, inicioDaPagina(cena, i + 1), DUR_TROCA, troca) : 0;
  const assenta = i === 0 ? 1.03 - 0.03 * prog(t, ini, DUR_TROCA + 0.3) : 1;
  const dx = (1 - entra) * (1080 - PAINEL.x + 30) - proxima * 220;
  return (
    <div
      style={{
        position: "absolute",
        left: PAINEL.x,
        top: PAINEL.y,
        width: PAINEL.w,
        height: PAINEL.h,
        borderRadius: PAINEL.raio,
        overflow: "hidden",
        background: COR.painel,
        boxShadow: SOMBRA_PECA,
        transform: `translateX(${dx.toFixed(1)}px) scale(${assenta})`,
        visibility: t < ini ? "hidden" : "visible",
      }}
    >
      <ConteudoDaPagina plano={plano} m={m} canto={canto} t={t} de={Math.max(ini, m.de - 0.2)} fim={m.ate + DUR_TROCA} />
    </div>
  );
};

const ConteudoDaPagina: React.FC<{ plano: Plano; m: MomentoDePalco; canto: Canto; t: number; de: number; fim: number }> = ({ plano, m, canto, t, de, fim }) =>
  m.tipo === "palco" ? <ConteudoPalco plano={plano} m={m} canto={canto} t={t} de={de} fim={fim} /> : <ConteudoDoBloco plano={plano} m={m} canto={canto} t={t} />;
