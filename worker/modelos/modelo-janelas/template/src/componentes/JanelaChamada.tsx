// A pessoa: a janela de uma chamada de vídeo. É a única cópia do vídeo com som e fica montada
// o vídeo inteiro. Em tela cheia não tem moldura; como janela ganha barra de título, sombra e
// cantos redondos; minimizada vira uma miniatura flutuante. Funciona com qualquer gravação.
import { limitar, mistura } from "../anim";
import { type CaixaJanela, caixaDoVideo } from "../geometria";
import { VideoNaCaixa } from "../motor/caixa";
import type { Palavra } from "../plano";
import { BARRA_JANELA, cor, sans, sombraJanela, W } from "../tema";
import { BotoesJanela } from "./Janela";
import { Icone } from "./Icones";

// Barrinhas de voz da etiqueta: mexem enquanto uma palavra está sendo dita.
const Voz: React.FC<{ t: number; palavras: Palavra[]; tamanho: number }> = ({ t, palavras, tamanho }) => {
  const falando = palavras.some((p) => t >= p.em - 0.03 && t <= p.ate + 0.05);
  return (
    <div style={{ display: "flex", gap: tamanho * 0.12, alignItems: "center", height: tamanho }}>
      {[0, 1, 2].map((i) => {
        const onda = 0.5 + 0.5 * Math.sin(t * (17 + i * 6) + i * 1.7) * Math.sin(t * (5 + i * 2.3));
        const alt = falando ? 0.3 + 0.7 * Math.abs(onda) : 0.22;
        return <div key={i} style={{ width: tamanho * 0.18, height: tamanho * alt, borderRadius: tamanho, background: cor.violeta }} />;
      })}
    </div>
  );
};

export const JanelaChamada: React.FC<{
  t: number;
  j: CaixaJanela;
  video: string;
  rosto: { x: number; y: number };
  videoAltura: number;
  nome: string;
  area: string;
  palavras: Palavra[];
}> = ({ t, j, video, rosto, videoAltura, nome, area, palavras }) => {
  // 1 = tela cheia, 0 = janela
  const cheia = limitar((j.w - (W - 120)) / 120);
  const barra = j.barra * BARRA_JANELA;
  const v = caixaDoVideo(j);
  const pequena = j.w < 520;
  const etiqueta = pequena ? 0.9 : 1;
  return (
    <div
      style={{
        position: "absolute",
        left: j.x,
        top: j.y,
        width: j.w,
        height: j.h,
        borderRadius: j.raio,
        overflow: "hidden",
        background: "#000",
        boxShadow: cheia > 0.99 ? "none" : sombraJanela,
        outline: cheia > 0.99 ? "none" : `1.5px solid ${cor.linhaForte}`,
      }}
    >
      <VideoNaCaixa src={video} caixa={v} rosto={rosto} videoAltura={videoAltura} filtro="saturate(1.03) contrast(1.03)" />

      {/* barra de título: câmera, nome · área, botões */}
      {barra > 0.5 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: j.w,
            height: barra,
            overflow: "hidden",
            background: cor.barra,
            borderBottom: `1.5px solid ${cor.linha}`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 26,
              right: 22,
              top: (barra - BARRA_JANELA) / 2,
              height: BARRA_JANELA,
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontFamily: sans,
              whiteSpace: "nowrap",
            }}
          >
            <Icone nome="camera" tamanho={40} cor={cor.violeta} peso={3.8} />
            <div style={{ fontWeight: 800, fontSize: 38, color: cor.tinta }}>{nome || "Chamada"}</div>
            {area && j.w > 700 ? (
              <div style={{ fontWeight: 600, fontSize: 34, color: cor.tintaSuave, overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>
                · {area}
              </div>
            ) : (
              <div style={{ flex: 1 }} />
            )}
            <BotoesJanela />
          </div>
        </div>
      ) : null}

      {/* etiqueta da chamada: nome + barrinhas de voz */}
      {nome ? (
        <div
          style={{
            position: "absolute",
            left: mistura(22, 44, cheia),
            top: j.h - mistura(pequena ? 74 : 84, 430, cheia),
            display: "flex",
            alignItems: "center",
            gap: 12 * etiqueta,
            padding: `${10 * etiqueta}px ${20 * etiqueta}px ${10 * etiqueta}px ${16 * etiqueta}px`,
            borderRadius: 40,
            background: "rgba(250,249,253,0.92)",
            fontFamily: sans,
            fontWeight: 700,
            fontSize: 36 * etiqueta,
            color: cor.tinta,
          }}
        >
          <Voz t={t} palavras={palavras} tamanho={30 * etiqueta} />
          {nome}
        </div>
      ) : null}

      {/* miniatura: botão de restaurar no canto */}
      {pequena && j.barra < 0.5 ? (
        <div
          style={{
            position: "absolute",
            right: 16,
            top: 16,
            width: 58,
            height: 58,
            borderRadius: 18,
            background: "rgba(250,249,253,0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: limitar((520 - j.w) / 80),
          }}
        >
          <Icone nome="maximizar" tamanho={34} cor={cor.tinta} peso={3.6} />
        </div>
      ) : null}
    </div>
  );
};
