// A assinatura do Viral: o CORTE (a imagem toma a tela inteira por ~1 s, aproximando devagar)
// e o POP (a pessoa vai para a moldura da direita e um cartão com a imagem salta no quadro da
// esquerda). No quadro deitado (16:9) a tela cheia é 1920×1080; no vertical o cartão saltava
// acima da cabeça, com a pessoa embaixo.
import { AbsoluteFill } from "remotion";
import { prog, rapido, salto } from "../anim";
import { AREA, COSTURA, MARGEM, QUADRO } from "../layout";
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
  const f = temImagem(img) && img.largura && img.altura ? enquadrarFoto(QUADRO.w, QUADRO.h, img.largura, img.altura, img.foco) : { focoX: QUADRO.w / 2, focoY: QUADRO.h / 2 };
  // com zoom, o assunto sobe para ~40% da altura (fica acima da legenda), sem mostrar a borda da foto
  const dy = Math.max(-(QUADRO.h - f.focoY) * (z - 1), Math.min(f.focoY * (z - 1), 0.4 * QUADRO.h - f.focoY));
  return (
    <AbsoluteFill style={{ opacity: t >= de ? 1 : 0, transform: p >= 1 ? undefined : `scale(${1.07 - 0.07 * p})` }}>
      {temImagem(img) ? (
        <AbsoluteFill style={{ transform: z > 1 ? `translateY(${dy}px) scale(${z})` : undefined, transformOrigin: `${f.focoX}px ${f.focoY}px` }}>
        <Foto
          imagem={img}
          de={de}
          ate={ate}
          t={t}
          largura={QUADRO.w}
          altura={QUADRO.h}
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
          largura={QUADRO.w}
          altura={QUADRO.h}
          de={de}
          ate={ate}
          t={t}
          fundo={cor.fundo}
          cor={cor.tinta}
          fonte={fonte}
          peso={900}
        />
      )}
      {/* sombra leve no alto (barra de progresso), nunca um brilho */}
      <div style={{ position: "absolute", left: 0, top: 0, width: QUADRO.w, height: 200, background: "linear-gradient(rgba(0,0,0,0.38), rgba(0,0,0,0))" }} />
      {escurecer > 0 ? <AbsoluteFill style={{ background: `rgba(10,8,14,${escurecer})` }} /> : null}
    </AbsoluteFill>
  );
};

export const Corte: React.FC<{ m: TCorte; t: number; plano: Plano }> = ({ m, t, plano }) => (
  <>
    <TelaCheia plano={plano} ref_={m.imagem} de={m.de} ate={m.ate} t={t} zoom={m.zoom} />
    {m.rotulo && t >= m.de && t < m.ate ? <Etiqueta texto={m.rotulo} t={t} em={m.de + 0.12} style={{ left: MARGEM, top: 110 }} /> : null}
  </>
);

// Tamanho do cartão: segue a proporção da imagem, dentro do quadro da esquerda (que no deitado é
// mais alto que a metade de cima do vertical: cabe um cartão de até 880 × 660).
const tamanhoDoCartao = (proporcao: number) => {
  const a = Math.max(0.74, Math.min(1.62, proporcao));
  const maxW = 880;
  const maxH = 660;
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
  // o centro do quadro da esquerda
  const cx = AREA.x + AREA.w / 2;
  const cy = (AREA.y + AREA.base) / 2;

  // objeto recortado (PNG transparente): adesivo solto, sem cartão
  if (temImagem(img) && img.transparente) {
    return (
      <AbsoluteFill style={{ opacity: 1 - sai }}>
        <Recorte imagem={img} de={em} t={t} largura={560} entrada="salto" giro={giro} style={{ position: "absolute", left: cx - 280, top: cy - 310 }} />
        {m.rotulo ? <Etiqueta texto={m.rotulo} t={t} em={m.rotuloEm ?? em + 0.2} style={{ left: AREA.x + 20, top: AREA.base - 110 }} /> : null}
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
      {/* fundo do quadro da esquerda: a própria imagem, desfocada e escura */}
      {temImagem(img) ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: COSTURA, height: QUADRO.h, overflow: "hidden", opacity: prog(t, m.de, 0.3) }}>
          <Foto
            imagem={img}
            de={m.de}
            t={t}
            largura={COSTURA}
            altura={QUADRO.h}
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
