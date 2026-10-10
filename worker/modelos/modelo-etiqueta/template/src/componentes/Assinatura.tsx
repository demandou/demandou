// Peças de imagem compartilhadas: a etiqueta numa tarja e a foto em tela cheia (blocos de quadro cheio com imagem).
// A assinatura da Etiqueta mora em Prateleira.tsx.
import { AbsoluteFill } from "remotion";
import { prog, rapido, salto } from "../anim";
import { encaixar } from "../medida";
import { enquadrarFoto, Foto, imagemDoPlano, SemImagem, temImagem, type ImagemNoMomento } from "../motor/imagem";
import type { Plano } from "../plano";
import { cor, fonte, sombraDura } from "../tema";

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
  const { tamanho: S, linhas } = encaixar(texto, { largura: largura - 50, max: 46, min: 28, linhas: 2, fonte: { peso: 800, caixaAlta: true } });
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
        fontWeight: 800,
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
          peso={800}
        />
      )}
      {/* sombra leve no alto (barra de progresso) e embaixo (legenda), nunca um brilho */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 260, background: "linear-gradient(rgba(0,0,0,0.38), rgba(0,0,0,0))" }} />
      {escurecer > 0 ? <AbsoluteFill style={{ background: `rgba(10,8,14,${escurecer})` }} /> : null}
    </AbsoluteFill>
  );
};

