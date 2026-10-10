// A assinatura do Multicâmera, além da câmera (camera.ts):
// - `cena`: o corte seco para a "câmera C", a imagem do que é citado em tela cheia, com movimento
//   lento. Foto em pé ou grande cobre a tela ("cheia"); foto deitada ou pequena entra inteira na
//   largura da tela, sobre um fundo feito dela mesma, desfocado e escurecido ("faixa"), para não
//   ficar mole. Sem imagem, a cena mostra a palavra num cartão grafite (nunca uma imagem errada).
// - `capitulo`: o título do capítulo numa tarja discreta no terço de baixo, com o número no
//   quadrado vermelho e a linha de tempo correndo por baixo.
// - a tarja de nome e área no começo.
import { Foto, SemImagem, imagemDoPlano, temImagem, type Imagem } from "../motor/imagem";
import type { Capitulo as TCapitulo, Cena as TCena, Plano } from "../plano";
import { COR, FONTE, MARGEM, medidas } from "../tema";
import { Tarja, medirTarja } from "./Pecas";

export const formaDaCena = (img: Imagem, m: TCena): "cheia" | "faixa" => {
  if (m.forma) return m.forma;
  if (!img.largura || !img.altura) return "cheia";
  // quanto a foto precisa crescer para cobrir 1080×1920
  const escala = Math.max(1080 / img.largura, 1920 / img.altura);
  return escala <= 1.4 ? "cheia" : "faixa";
};

export const Cena: React.FC<{ plano: Plano; m: TCena; t: number }> = ({ plano, m, t }) => {
  if (t < m.de - 0.5 || t >= m.ate) return null;
  const img = imagemDoPlano(plano, m.imagem);
  const palavra = m.rotulo ?? img?.palavra ?? m.imagem.id;
  const rotuloEm = Math.max(m.de + 0.15, m.rotuloEm ?? m.em ?? m.de);
  const tamRotulo = 34;
  const hRotulo = medirTarja(palavra, tamRotulo, true).h;

  if (!temImagem(img)) {
    if (t < m.de) return null;
    return <SemImagem texto={palavra} largura={1080} altura={1920} de={m.de} ate={m.ate} t={t} fundo={COR.grafite} cor={COR.branco} fonte={FONTE} peso={800} style={{ position: "absolute", left: 0, top: 0 }} />;
  }

  const forma = formaDaCena(img, m);
  const efeito = m.imagem.efeito ?? "aproximar";
  if (forma === "cheia") {
    return (
      <>
        <Foto imagem={img} de={m.de} ate={m.ate} t={t} largura={1080} altura={1920} efeito={efeito} intensidade={0.06} style={{ position: "absolute", left: 0, top: 0 }} />
        {m.rotulo ? <Tarja x={MARGEM} y={150} t={t} de={rotuloEm} ate={m.ate} texto={m.rotulo} tamanho={tamRotulo} quadrado="" /> : null}
      </>
    );
  }

  // faixa: a foto inteira na largura, um pouco acima do meio (a legenda fica livre embaixo)
  const a = img.largura && img.altura ? img.largura / img.altura : 1.5;
  const h = Math.round(Math.min(1240, Math.max(560, 1080 / a)));
  const centro = Math.min(medidas(plano).baseComLegenda - h / 2 - 40, 820);
  const topo = Math.round(Math.max(200, centro - h / 2));
  return (
    <>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: COR.grafite, visibility: t >= m.de ? "visible" : "hidden" }}>
        <Foto
          imagem={img}
          de={m.de}
          ate={m.ate}
          t={t}
          largura={1080}
          altura={1920}
          efeito="parado"
          style={{ position: "absolute", left: 0, top: 0, transform: "scale(1.18)" }}
          estiloDaImagem={{ filter: "blur(42px) brightness(0.42)" }}
        />
      </div>
      <Foto imagem={img} de={m.de} ate={m.ate} t={t} largura={1080} altura={h} efeito={efeito} intensidade={0.08} style={{ position: "absolute", left: 0, top: topo }} />
      {m.rotulo ? <Tarja x={MARGEM} y={topo - hRotulo - 22} t={t} de={rotuloEm} ate={m.ate} texto={m.rotulo} tamanho={tamRotulo} quadrado="" /> : null}
    </>
  );
};

// número de cada capítulo: o pedido ou a ordem no plano
const numeroDoCapitulo = (plano: Plano, m: TCapitulo) => {
  if (m.numero !== undefined) return String(m.numero);
  const caps = plano.momentos.filter((x) => x.tipo === "capitulo").sort((a, b) => a.de - b.de);
  return String(caps.indexOf(m) + 1);
};

export const Capitulo: React.FC<{ plano: Plano; m: TCapitulo; t: number }> = ({ plano, m, t }) => {
  if (t < m.de || t >= m.ate) return null;
  const num = numeroDoCapitulo(plano, m);
  // o título cabe ao lado do quadrado: reduz o corpo se for longo
  let tamanho = 42;
  while (tamanho > 28 && medirTarja(m.texto, tamanho, true).total > 896) tamanho -= 2;
  const { h } = medirTarja(m.texto, tamanho, true);
  const y = medidas(plano).baseComLegenda - h;
  return <Tarja x={MARGEM} y={y} t={t} de={m.em ?? m.de} ate={m.ate} texto={m.texto} tamanho={tamanho} quadrado={num} tempo />;
};

// Tarja de nome e área no começo: discreta, no alto à esquerda (acima da cabeça).
export const Marca: React.FC<{ plano: Plano; t: number }> = ({ plano, t }) => {
  const { nome, area } = plano.marca ?? { nome: "", area: "" };
  if (!nome) return null;
  const primeiraCena = plano.momentos.filter((m) => m.tipo === "cena").map((m) => m.de).sort((a, b) => a - b)[0] ?? 99;
  const ate = Math.min(3.8, primeiraCena, plano.duracao);
  const de = 0.3;
  const h = medirTarja(nome, 32, true).h;
  return (
    <>
      <Tarja x={MARGEM} y={140} t={t} de={de} ate={ate} texto={nome} tamanho={32} quadrado="" />
      {area ? <Tarja x={MARGEM + h + 6} y={140 + h + 6} t={t} de={de + 0.2} ate={ate - 0.05} texto={area} tamanho={26} quadrado={false} /> : null}
    </>
  );
};
