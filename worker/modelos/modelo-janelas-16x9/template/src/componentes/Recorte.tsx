// Recorte de tela: na última tecla a tela escurece e o mouse vira mira; o mouse arrasta um
// retângulo em volta do rosto (dentro dele, a tela continua clara); na captura, a imagem
// congelada voa para um aviso embaixo ("Print copiado"), e o véu se desfaz.
import { Freeze } from "remotion";
import { arrasto, mistura, Palavras, prog, saindo, temposDoTexto } from "../anim";
import { selecaoDoRecorte, tempoDoRecorte } from "../cena";
import { avisoDoRecorte, caixaDoVideo, lugarDoMomento, lugares } from "../geometria";
import { encaixar, larguraTexto } from "../medida";
import { TextoFalado } from "../texto";
import { VideoNaCaixa } from "../motor/caixa";
import type { Palavra, Plano, Recorte as TipoRecorte } from "../plano";
import { cor, H, MARGEM_JANELA, QUADRO, sans, sombraJanela, W } from "../tema";
import { Icone } from "./Icones";

// Véu escuro com um buraco (o retângulo selecionado)
export const VeuDoRecorte: React.FC<{ m: TipoRecorte; plano: Plano; t: number }> = ({ m, plano, t }) => {
  const { escurece, captura } = tempoDoRecorte(m);
  const veu = prog(t, escurece, 0.22) * (1 - prog(t, captura + 0.08, 0.32));
  if (veu <= 0.001) return null;
  const sel = selecaoDoRecorte(m, plano);
  const p = prog(t, m.selecionaEm, m.soltaEm - m.selecionaEm, arrasto);
  const w = Math.max(0, sel.w * p);
  const h = Math.max(0, sel.h * p);
  const buraco = t >= m.selecionaEm ? `M${sel.x} ${sel.y}h${w}v${h}h${-w}Z` : "";
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: veu }}>
      <path d={`M0 0H${W}V${H}H0Z ${buraco}`} fill={cor.veu} fillRule="evenodd" />
    </svg>
  );
};

// O retângulo, a frase presa nele, a imagem que voa e o aviso
// `camada`: "base" desenha retângulo, frase e aviso; "voo" só a imagem que voa (vai por cima das teclas)
export const Recorte: React.FC<{
  m: TipoRecorte;
  plano: Plano;
  palavras: Palavra[];
  t: number;
  fps: number;
  avisoAte: number;
  camada: "base" | "voo";
}> = ({ m, plano, palavras, t, fps, avisoAte, camada }) => {
  const { captura } = tempoDoRecorte(m);
  const AVISO_RECORTE = avisoDoRecorte(m);
  const sel = selecaoDoRecorte(m, plano);
  const p = prog(t, m.selecionaEm, m.soltaEm - m.selecionaEm, arrasto);
  const w = sel.w * p;
  const h = sel.h * p;
  const someBorda = prog(t, captura + 0.02, 0.2);
  const someRotulo = prog(t, captura + 0.32, 0.22);
  const lampejo = prog(t, captura - 0.02, 0.06) * (1 - prog(t, captura + 0.06, 0.12));

  // a imagem congelada voa do retângulo para a miniatura do aviso
  const voo = prog(t, captura + 0.06, 0.5, arrasto);
  const mini = { x: AVISO_RECORTE.x + 22, y: AVISO_RECORTE.y + 22, h: AVISO_RECORTE.h - 44 };
  const escalaMini = mini.h / sel.h;
  const L = lugares(plano);
  const j = L[lugarDoMomento(m)];
  const v = caixaDoVideo(j);
  const videoAltura = Math.min(QUADRO.h, plano.videoAltura ?? QUADRO.h);
  // a frase da seleção fica presa em cima do retângulo; perto da borda direita (a pessoa está na
  // moldura da direita), ela recua para a esquerda e nunca sai do quadro
  const larguraRotulo = m.rotuloSelecao ? larguraTexto(m.rotuloSelecao, 44, { peso: 800 }) + 48 : 0;
  const esquerdaRotulo = Math.max(MARGEM_JANELA, Math.min(sel.x - 4, W - 40 - larguraRotulo));

  const sai = saindo(t, avisoAte + 0.06, 0.2);
  const pAviso = prog(t, captura + 0.28, 0.34) * (1 - sai);
  // a vaga do aviso espera a lápis desde que as teclas entram
  const pVaga = prog(t, m.de + 0.5, 0.3) * (1 - prog(t, captura + 0.3, 0.2));
  const tRotulo = temposDoTexto(m.rotuloSelecao ?? "", palavras, m.de, m.ate, m.selecionaEm);
  const pRotulo = prog(t, (tRotulo[0] ?? m.selecionaEm) - 0.1, 0.25) * (1 - someRotulo);

  // o texto do aviso cabe sempre: o título (padrão: a frase da seleção) em até 2 linhas
  const larguraAviso = AVISO_RECORTE.w - (22 + sel.w * escalaMini + 30) - 30 - 64;
  const textoAviso = m.aviso ?? m.rotuloSelecao ?? "Capturado";
  const encDetalhe = m.avisoDetalhe ? encaixar(m.avisoDetalhe, { largura: larguraAviso + 64, max: 40, min: 32, linhas: 1, fonte: { peso: 700 } }) : null;
  const encAviso = encaixar(textoAviso, { largura: larguraAviso, max: 56, min: 38, linhas: encDetalhe ? 1 : 2 });

  if (camada === "voo") {
    if (t < captura + 0.04 || sai >= 0.999 || voo >= 0.999) return null;
    return (
      <div
        style={{
          position: "absolute",
          left: mistura(sel.x, mini.x, voo),
          top: mistura(sel.y, mini.y, voo),
          width: sel.w,
          height: sel.h,
          transformOrigin: "0 0",
          scale: String(mistura(1, escalaMini, voo)),
          overflow: "hidden",
          borderRadius: mistura(0, 18 / escalaMini, voo),
          boxShadow: "0 30px 60px rgba(16,12,30,0.35)",
          outline: voo > 0.02 ? `${8 / mistura(1, escalaMini, voo)}px solid #FFFFFF` : "none",
        }}
      >
        <Freeze frame={Math.round(captura * fps)}>
          <VideoNaCaixa
            mudo
            src={plano.video}
            caixa={{ ...v, x: j.x + v.x - sel.x, y: j.y + v.y - sel.y }}
            rosto={plano.rosto}
            videoAltura={videoAltura}
            filtro="saturate(1.03) contrast(1.03)"
          />
        </Freeze>
      </div>
    );
  }

  return (
    <>
      {/* retângulo de seleção */}
      {t >= m.selecionaEm && someBorda < 0.999 ? (
        <div
          style={{
            position: "absolute",
            left: sel.x,
            top: sel.y,
            width: w,
            height: h,
            border: `4px solid ${lampejo > 0.5 ? "#FFFFFF" : cor.violeta}`,
            opacity: 1 - someBorda,
          }}
        >
          {p > 0.98
            ? [
                [0, 0],
                [1, 0],
                [0, 1],
                [1, 1],
              ].map(([a, b], i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: a * w - 11,
                    top: b * h - 11,
                    width: 18,
                    height: 18,
                    background: "#FFFFFF",
                    border: `4px solid ${cor.violeta}`,
                  }}
                />
              ))
            : null}
        </div>
      ) : null}

      {/* a frase presa em cima do retângulo */}
      {m.rotuloSelecao && pRotulo > 0.001 ? (
        <div
          style={{
            position: "absolute",
            left: esquerdaRotulo,
            top: sel.y - 80,
            maxWidth: W - esquerdaRotulo - 40,
            background: cor.violeta,
            borderRadius: "18px 18px 18px 4px",
            padding: "8px 20px 10px",
            opacity: pRotulo,
          }}
        >
          <Palavras texto={m.rotuloSelecao} tempos={tRotulo} t={t} esboco="rgba(255,255,255,0.4)" style={{ fontFamily: sans, fontWeight: 800, fontSize: 44, color: "#FFFFFF", lineHeight: 1.1 }} />
        </div>
      ) : null}

      {/* vaga do aviso, a lápis */}
      {pVaga > 0.001 ? (
        <div
          style={{
            position: "absolute",
            left: AVISO_RECORTE.x,
            top: AVISO_RECORTE.y,
            width: AVISO_RECORTE.w,
            height: AVISO_RECORTE.h,
            borderRadius: 30,
            border: `4px dashed ${cor.esbocoParede}`,
            background: "rgba(255,255,255,0.18)",
            opacity: pVaga,
            display: "flex",
            alignItems: "center",
            gap: 30,
            padding: "0 22px",
          }}
        >
          <div style={{ width: sel.w * escalaMini, height: mini.h, borderRadius: 18, background: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icone nome="imagem" tamanho={60} cor="#FFFFFF" peso={3.4} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ width: 340, height: 34, borderRadius: 17, background: "rgba(255,255,255,0.4)" }} />
            <div style={{ width: 260, height: 26, borderRadius: 13, background: "rgba(255,255,255,0.3)" }} />
          </div>
        </div>
      ) : null}

      {/* aviso: miniatura + texto */}
      {pAviso > 0.001 ? (
        <div
          style={{
            position: "absolute",
            left: AVISO_RECORTE.x,
            top: AVISO_RECORTE.y,
            width: AVISO_RECORTE.w,
            height: AVISO_RECORTE.h,
            borderRadius: 30,
            background: cor.janela,
            boxShadow: sombraJanela,
            outline: `1.5px solid ${cor.linha}`,
            opacity: pAviso,
            translate: `0 ${(1 - pAviso) * 30}px`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 22 + sel.w * escalaMini + 30,
              right: 30,
              top: 0,
              bottom: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Icone nome="check" tamanho={50} cor={cor.violeta} peso={5} style={{ flexShrink: 0 }} />
              <TextoFalado enc={encAviso} t={t} cor={cor.tinta} alturaLinha={1.06} />
            </div>
            {encDetalhe ? <TextoFalado enc={encDetalhe} t={t} cor={cor.tintaSuave} fonte={{ peso: 700 }} alturaLinha={1.1} /> : null}
          </div>
        </div>
      ) : null}

      {/* a imagem capturada, já pousada na miniatura do aviso (o voo é a camada "voo") */}
      {voo >= 0.999 && sai < 0.999 ? (
        <div
          style={{
            position: "absolute",
            left: mistura(sel.x, mini.x, voo),
            top: mistura(sel.y, mini.y, voo),
            width: sel.w,
            height: sel.h,
            transformOrigin: "0 0",
            scale: String(mistura(1, escalaMini, voo)),
            overflow: "hidden",
            borderRadius: mistura(0, 18 / escalaMini, voo),
            boxShadow: voo < 0.98 ? "0 30px 60px rgba(16,12,30,0.35)" : "none",
            outline: voo > 0.02 && voo < 0.98 ? `${8 / mistura(1, escalaMini, voo)}px solid #FFFFFF` : "none",
            opacity: 1 - sai,
          }}
        >
          <Freeze frame={Math.round(captura * fps)}>
            <VideoNaCaixa
              mudo
              src={plano.video}
              caixa={{ ...v, x: j.x + v.x - sel.x, y: j.y + v.y - sel.y }}
              rosto={plano.rosto}
              videoAltura={videoAltura}
              filtro="saturate(1.03) contrast(1.03)"
            />
          </Freeze>
        </div>
      ) : null}
    </>
  );
};
