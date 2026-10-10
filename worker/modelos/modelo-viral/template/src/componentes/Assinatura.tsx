// A assinatura do Viral: o CORTE (a imagem toma a tela inteira por ~1 s, aproximando devagar)
// e o POP (a pessoa desce e um cartão com a imagem salta acima da cabeça).
import { AbsoluteFill } from "remotion";
import { prog, rapido, salto } from "../anim";
import { TOPO } from "../layout";
import { encaixar } from "../medida";
import { enquadrarFoto, Foto, imagemDoPlano, Recorte, SemImagem, temImagem, type ImagemNoMomento } from "../motor/imagem";
import type { Corte as TCorte, Plano, Pop as TPop } from "../plano";
import { cor, fonte, sombraCartao, sombraDura } from "../tema";

// Etiqueta curta numa tarja (rótulo do corte e do cartão).
export const Etiqueta: React.FC<{ texto: string; t: number; em: number; largura?: number; giro?: number; style?: React.CSSProperties }> = ({
  texto,
  t,
  em,
  largura = 620,
  giro = -3,
  style,
}) => {
  if (t < em) return null;
  const { tamanho: S, linhas } = encaixar(texto, { largura: largura - 50, max: 46, min: 28, linhas: 2, fonte: { peso: 900, caixaAlta: true } });
  const p = prog(t, em, 0.24, salto);
  return (
    <div
      style={{
        position: "absolute",
        padding: `${S * 0.22}px ${S * 0.5}px`,
        borderRadius: S * 0.22,
        background: cor.tarja,
        boxShadow: sombraDura(cor.tarjaBorda, 6),
        fontFamily: fonte,
        fontWeight: 900,
        fontSize: S,
        lineHeight: 1.12,
        color: cor.tinta,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        opacity: Math.min(1, p * 3),
        transform: p >= 1 ? `rotate(${giro}deg)` : `rotate(${giro}deg) scale(${0.6 + 0.4 * p})`,
        ...style,
      }}
    >
      {linhas.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
};

// Foto em tela cheia com o "tranco" de entrada (chega 7% maior e assenta em 0,22 s).
// `zoom` > 1: começa mais perto do foco (para um assunto pequeno numa foto larga).
export const TelaCheia: React.FC<{ plano: Plano; ref_: ImagemNoMomento; de: number; ate: number; t: number; escurecer?: number; zoom?: number }> = ({
  plano,
  ref_,
  de,
  ate,
  t,
  escurecer = 0,
  zoom = 1,
}) => {
  if (t < de - 0.6 || t >= ate) return null;
  const img = imagemDoPlano(plano, ref_);
  const p = prog(t, de, 0.22, rapido);
  const z = Math.max(1, Math.min(2, zoom));
  const f = temImagem(img) && img.largura && img.altura ? enquadrarFoto(1080, 1920, img.largura, img.altura, img.foco) : { focoX: 540, focoY: 960 };
  // com zoom, o assunto sobe para ~40% da altura (fica acima da legenda), sem mostrar a borda da foto
  const dy = Math.max(-(1920 - f.focoY) * (z - 1), Math.min(f.focoY * (z - 1), 0.4 * 1920 - f.focoY));
  return (
    <AbsoluteFill style={{ opacity: t >= de ? 1 : 0, transform: p >= 1 ? undefined : `scale(${1.07 - 0.07 * p})` }}>
      {temImagem(img) ? (
        <AbsoluteFill style={{ transform: z > 1 ? `translateY(${dy}px) scale(${z})` : undefined, transformOrigin: `${f.focoX}px ${f.focoY}px` }}>
        <Foto
          imagem={img}
          de={de}
          ate={ate}
          t={t}
          largura={1080}
          altura={1920}
          efeito={ref_.efeito ?? "aproximar"}
          intensidade={0.12}
          entrada="corte"
          saida="corte"
          antes={0.6}
        />
        </AbsoluteFill>
      ) : (
        <SemImagem
          texto={img?.palavra ?? ref_.id}
          largura={1080}
          altura={1920}
          de={de}
          ate={ate}
          t={t}
          fundo={cor.fundo}
          cor={cor.tinta}
          fonte={fonte}
          peso={900}
        />
      )}
      {/* sombra leve no alto (barra de progresso) e embaixo (legenda), nunca um brilho */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 260, background: "linear-gradient(rgba(0,0,0,0.38), rgba(0,0,0,0))" }} />
      {escurecer > 0 ? <AbsoluteFill style={{ background: `rgba(10,8,14,${escurecer})` }} /> : null}
    </AbsoluteFill>
  );
};

export const Corte: React.FC<{ m: TCorte; t: number; plano: Plano }> = ({ m, t, plano }) => (
  <>
    <TelaCheia plano={plano} ref_={m.imagem} de={m.de} ate={m.ate} t={t} zoom={m.zoom} />
    {m.rotulo && t >= m.de && t < m.ate ? <Etiqueta texto={m.rotulo} t={t} em={m.de + 0.12} style={{ left: 64, top: 150 }} /> : null}
  </>
);

// Tamanho do cartão: segue a proporção da imagem, dentro da metade de cima.
const tamanhoDoCartao = (proporcao: number) => {
  const a = Math.max(0.74, Math.min(1.62, proporcao));
  const maxW = 900;
  const maxH = 600;
  let w = maxW;
  let h = w / a;
  if (h > maxH) {
    h = maxH;
    w = h * a;
  }
  return { w: Math.round(w), h: Math.round(h) };
};

export const Pop: React.FC<{ m: TPop; t: number; plano: Plano; indice: number; fim: number; saiCruzando: boolean }> = ({
  m,
  t,
  plano,
  indice,
  fim,
  saiCruzando,
}) => {
  const img = imagemDoPlano(plano, m.imagem);
  const em = m.em ?? m.de;
  const giro = indice % 2 === 0 ? -3 : 2.5;
  const sai = saiCruzando ? prog(t, m.ate, 0.16) : 0;
  const cx = 540;
  const cy = (TOPO.y + TOPO.base) / 2 + 6;

  // objeto recortado (PNG transparente): adesivo solto, sem cartão
  if (temImagem(img) && img.transparente) {
    return (
      <AbsoluteFill style={{ opacity: 1 - sai }}>
        <Recorte imagem={img} de={em} t={t} largura={470} entrada="salto" giro={giro} style={{ position: "absolute", left: cx - 235, top: cy - 260 }} />
        {m.rotulo ? <Etiqueta texto={m.rotulo} t={t} em={m.rotuloEm ?? em + 0.2} style={{ left: 110, top: TOPO.base - 120 }} /> : null}
      </AbsoluteFill>
    );
  }

  const prop = temImagem(img) && img.largura && img.altura ? img.largura / img.altura : 1.4;
  const { w, h } = tamanhoDoCartao(prop);
  const p = prog(t, em, 0.34, salto);
  const visivel = t >= em;
  const borda = 12;

  return (
    <AbsoluteFill style={{ opacity: 1 - sai }}>
      {/* fundo da metade de cima: a própria imagem, desfocada e escura */}
      {temImagem(img) ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 900, overflow: "hidden", opacity: prog(t, m.de, 0.3) }}>
          <Foto
            imagem={img}
            de={m.de}
            t={t}
            largura={1080}
            altura={900}
            efeito="parado"
            entrada="corte"
            antes={0.6}
            estiloDaImagem={{ filter: "blur(34px) brightness(0.42) saturate(1.25)", transform: "scale(1.2)" }}
          />
        </div>
      ) : null}
      {visivel ? (
        <div
          style={{
            position: "absolute",
            left: cx - w / 2 - borda,
            top: cy - h / 2 - borda,
            width: w + borda * 2,
            height: h + borda * 2,
            borderRadius: 34,
            background: cor.papel,
            boxShadow: sombraCartao,
            opacity: Math.min(1, p * 4),
            transform: p >= 1 ? `rotate(${giro}deg)` : `rotate(${giro - 7 * (1 - p)}deg) scale(${0.45 + 0.55 * p})`,
          }}
        >
          <div style={{ position: "absolute", left: borda, top: borda, width: w, height: h, borderRadius: 24, overflow: "hidden" }}>
            {temImagem(img) ? (
              <Foto imagem={img} de={em} ate={fim} t={t} largura={w} altura={h} efeito={m.imagem.efeito ?? "aproximar"} intensidade={0.08} entrada="corte" />
            ) : (
              <SemImagem texto={img?.palavra ?? m.rotulo ?? m.imagem.id} largura={w} altura={h} de={em} t={t} fundo={cor.placaSolida} cor={cor.tinta} fonte={fonte} peso={900} />
            )}
          </div>
          {m.rotulo ? <Etiqueta texto={m.rotulo} t={t} em={m.rotuloEm ?? em + 0.22} largura={Math.min(620, w)} giro={-giro - 1} style={{ left: -18, bottom: -30 }} /> : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
