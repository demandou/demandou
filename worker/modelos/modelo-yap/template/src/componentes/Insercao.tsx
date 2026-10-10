// A assinatura do Yap: a imagem do que a pessoa cita.
// - "cartao": cartão de foto na altura do peito, ao lado do ombro (nunca sobre o rosto), entrando
//   por máscara; a foto aproxima devagar; a etiqueta com o nome entra quando é dito.
// - "tela": corte seco para a foto em tela cheia (0,8 a 1,2 s); a legenda continua por cima.
// - objeto com fundo transparente: vira adesivo ao lado do ombro, sem cartão.
// - sem imagem: o cartão mostra a palavra (nunca uma imagem errada).
import { Foto, Recorte, SemImagem, imagemDoPlano, temImagem } from "../motor/imagem";
import type { Insercao as TInsercao, Lado, Plano } from "../plano";
import { COR, FONTE, MARGEM, UI_DIREITA } from "../tema";
import { Cartao, Etiqueta, Marcador, xNoLado, zona } from "./Pecas";

// lado de cada cartão: o pedido ou alternando dir → esq a partir do primeiro
export const ladoDaInsercao = (plano: Plano, m: TInsercao): Lado => {
  if (m.lado) return m.lado;
  const cartoes = plano.momentos.filter((x): x is TInsercao => x.tipo === "insercao" && x.forma !== "tela").sort((a, b) => a.de - b.de);
  const i = cartoes.indexOf(m);
  return i % 2 === 0 ? "dir" : "esq";
};

export const Insercao: React.FC<{ plano: Plano; m: TInsercao; t: number }> = ({ plano, m, t }) => {
  const img = imagemDoPlano(plano, m.imagem);
  const tem = temImagem(img);
  const palavra = m.rotulo ?? img?.palavra ?? m.imagem.id;
  const quandoRotulo = m.rotuloEm ?? m.em + 0.15;

  // ——— tela cheia ———
  if (m.forma === "tela" && tem) {
    if (t < m.de - 0.5 || t >= m.ate) return null;
    return (
      <>
        <Foto imagem={img} de={m.de} ate={m.ate} t={t} largura={1080} altura={1920} efeito={m.imagem.efeito ?? "aproximar"} intensidade={0.05} style={{ position: "absolute", left: 0, top: 0 }} />
        {m.rotulo || m.etiqueta ? (
          <Etiqueta texto={palavra} x={MARGEM} y={226} t={t} em={Math.max(m.de, quandoRotulo)} ate={m.ate} marcador={m.etiqueta} tamanho={40} />
        ) : null}
      </>
    );
  }

  const z = zona(plano);
  const lado = ladoDaInsercao(plano, m);
  // o cartão cabe na zona e deixa a etiqueta pendurada embaixo
  const h = Math.round(Math.max(260, Math.min(440, z.altura - 22)));
  const a = tem && img.largura && img.altura ? img.largura / img.altura : 1.3;
  const w = Math.round(a >= 1.15 ? Math.min(640, h * 1.5) : a >= 0.85 ? h * 1.04 : h * 0.84);
  const x = xNoLado(lado, w);
  const y = z.topo + 4;
  if (t < m.de - 0.5 || t >= m.ate) return null;

  // objeto recortado (fundo transparente): adesivo, sem cartão
  if (tem && img.transparente) {
    const lw = Math.min(h, 380);
    const lx = xNoLado(lado, lw);
    return (
      <>
        <Recorte imagem={img} de={m.de} ate={m.ate} t={t} largura={lw} entrada="escala" style={{ position: "absolute", left: lx, top: y }} />
        <Etiqueta texto={palavra} x={lx + 10} y={y + lw - 20} t={t} em={quandoRotulo} ate={m.ate} marcador={m.etiqueta} direitaMax={UI_DIREITA} />
      </>
    );
  }

  return (
    <>
      <Cartao x={x} y={y} w={w} h={h} t={t} de={m.de} ate={m.ate}>
        {tem ? (
          <Foto imagem={img} de={m.de} ate={m.ate} t={t} largura={w} altura={h} efeito={m.imagem.efeito ?? "aproximar"} intensidade={0.07} />
        ) : (
          <SemImagem texto={palavra} largura={w} altura={h} de={m.de} ate={m.ate} t={t} fundo={COR.papel} cor={COR.tinta} fonte={FONTE} peso={800} />
        )}
        {m.etiqueta && (m.rotulo === undefined || !tem) ? (
          <div style={{ position: "absolute", left: 18, top: 18 }}>
            <Marcador texto={m.etiqueta} tamanho={56} />
          </div>
        ) : null}
      </Cartao>
      {tem && m.rotulo ? (
        <Etiqueta texto={m.rotulo} x={x + 22} y={y + h - 40} t={t} em={Math.max(m.de + 0.2, quandoRotulo)} ate={m.ate} marcador={m.etiqueta} direitaMax={UI_DIREITA} />
      ) : null}
    </>
  );
};
