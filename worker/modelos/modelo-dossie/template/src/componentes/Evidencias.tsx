// A assinatura do Dossiê: as provas do `quadro`. Cada prova é uma peça presa na cortiça (polaroide,
// ficha datilografada, celular tocando, print de mensagem, print de notificação) com a etiqueta
// "PROVA A/B/C…". A câmera chega nela no `em` e o fio vermelho a liga à prova anterior.
import { Falado, prog, temposDoTexto } from "../anim";
import { encaixar, encaixarBloco, trechoNoTexto } from "../medida";
import { imagemDoPlano } from "../motor/imagem";
import type { Peca } from "../mundo";
import type { Evidencia, Plano } from "../plano";
import { COR, ELITE, SORA } from "../tema";
import { Datilo } from "../anim";
import { Etiqueta, Fita, Folha, Icone, Polaroide, Rotulo, Tarja, alturaPolaroide } from "./Pecas";

const LETRAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const rotuloDaProva = (ev: Evidencia, letra: number) => ev.rotulo ?? `Prova ${LETRAS[letra % 26]}`;

// a etiqueta da prova entra logo depois do pino
const etiqueta = (ev: Evidencia, letra: number, x: number, y: number, t: number, rot = -6) => (
  <Etiqueta texto={rotuloDaProva(ev, letra)} x={x} y={y} rot={rot} p={prog(t, ev.em + 0.22, 0.4)} />
);

export const formaDa = (ev: Evidencia) => ev.forma ?? (ev.imagem ? "foto" : "ficha");

export const pecaEvidencia = (ev: Evidencia, letra: number, plano: Plano, fim: number): Peca => {
  switch (formaDa(ev)) {
    case "foto":
      return pecaFoto(ev, letra, plano);
    case "ligacao":
      return pecaLigacao(ev, letra, fim);
    case "mensagem":
      return pecaMensagem(ev, letra, plano, fim);
    case "alerta":
      return pecaAlerta(ev, letra, plano, fim);
    default:
      return pecaFicha(ev, letra, plano, fim);
  }
};

// ——— polaroide ———
const pecaFoto = (ev: Evidencia, letra: number, plano: Plano): Peca => {
  const PW = 600;
  const hp = alturaPolaroide(PW, ev.titulo);
  const w = PW + 60;
  const h = hp + 110;
  const img = imagemDoPlano(plano, ev.imagem);
  return {
    w,
    h,
    pino: { x: w / 2, y: 52 },
    desenhar: (t) => (
      <>
        <div style={{ position: "absolute", left: 30, top: 30 }}>
          <Polaroide w={PW} imagem={img} palavra={img?.palavra ?? ev.titulo ?? ""} legenda={ev.titulo} t={t} desde={ev.em} />
        </div>
        {etiqueta(ev, letra, 0, h - 92, t)}
      </>
    ),
  };
};

// ——— ficha datilografada (campos com valor ou tarja de censura) ———
const pecaFicha = (ev: Evidencia, letra: number, plano: Plano, fim: number): Peca => {
  const W = 860;
  const PAD = 48;
  const interno = W - PAD * 2;
  const campos = (ev.campos ?? []).slice(0, 4);
  const fitTitulo = ev.titulo ? encaixar(ev.titulo, { largura: interno, max: 80, min: 46, linhas: 2, fonte: { peso: 800 } }) : null;
  const hTitulo = fitTitulo ? fitTitulo.linhas.length * fitTitulo.tamanho * 1.08 + 24 : 0;
  const fitTexto = ev.texto ? encaixarBloco(ev.texto, { largura: interno, altura: 150, max: 44, min: 30, maxLinhas: 3, fonte: { peso: 600 } }) : null;
  const hTexto = fitTexto ? fitTexto.linhas.length * fitTexto.tamanho * 1.15 + 30 : 0;
  const LINHA = 128;
  const topoCampos = 120 + hTitulo;
  const h = Math.round(topoCampos + campos.length * LINHA + hTexto + 56);
  const temposTitulo = ev.titulo ? temposDoTexto(ev.titulo, plano.palavras, ev.em, fim, ev.em) : [];
  const temposTexto = ev.texto ? temposDoTexto(ev.texto, plano.palavras, ev.textoEm ?? ev.em, fim, ev.textoEm ?? ev.em) : [];
  const enfase = ev.texto ? trechoNoTexto(ev.texto, ev.destaque) : null;
  return {
    w: W,
    h,
    pino: { x: W / 2, y: 30 },
    focos: campos.length > 1 ? campos.map((c, i) => ({ em: c.em, x: W / 2, y: topoCampos + i * LINHA + 60 })) : undefined,
    desenhar: (t) => (
      <>
        <Folha w={W} h={h} cor={COR.ficha}>
          <div style={{ position: "absolute", left: PAD, top: 52, right: PAD, display: "flex", justifyContent: "space-between" }}>
            <Rotulo tamanho={28}>Ficha</Rotulo>
            <div style={{ display: "flex", gap: 10 }}>
              {[0, 1, 2].map((k) => (
                <div key={k} style={{ width: 14, height: 14, border: `2px solid ${COR.tinta}`, background: k === 0 ? COR.tinta : "transparent" }} />
              ))}
            </div>
          </div>
          <div style={{ position: "absolute", left: PAD, right: PAD, top: 96, height: 3, background: COR.tinta }} />
          {fitTitulo ? (
            <div style={{ position: "absolute", left: PAD, top: 120, width: interno, fontFamily: SORA }}>
              <Falado linhas={fitTitulo.linhas} tempos={temposTitulo} t={t} tamanho={fitTitulo.tamanho} peso={800} />
            </div>
          ) : null}
          {campos.map((c, i) => {
            const y = topoCampos + i * LINHA;
            return (
              <div key={i} style={{ position: "absolute", left: PAD, top: y, width: interno }}>
                <Rotulo tamanho={30} cor={COR.grafite}>
                  {c.rotulo}
                </Rotulo>
                <div style={{ position: "relative", marginTop: 14, height: 62, borderBottom: `2px solid ${COR.linha}` }}>
                  {c.tarja ? (
                    <div style={{ position: "absolute", left: 0, top: 4 }}>
                      <Tarja w={Math.min(interno, 520 + (i % 2) * 90)} h={52} em={c.em} t={t} semente={i + 2} />
                    </div>
                  ) : (
                    <Datilo texto={c.valor ?? ""} em={c.em} t={t} style={{ fontFamily: ELITE, fontSize: 50, lineHeight: "60px", color: COR.tinta }} />
                  )}
                </div>
              </div>
            );
          })}
          {fitTexto ? (
            <div style={{ position: "absolute", left: PAD, top: topoCampos + campos.length * LINHA + 24, width: interno, fontFamily: SORA }}>
              <Falado linhas={fitTexto.linhas} tempos={temposTexto} t={t} tamanho={fitTexto.tamanho} peso={600} entrelinha={1.15} enfase={enfase} enfaseEm={ev.destaqueEm} />
            </div>
          ) : null}
        </Folha>
        {etiqueta(ev, letra, -18, h - 50, t)}
      </>
    ),
  };
};

// ——— celular tocando ———
const pecaLigacao = (ev: Evidencia, letra: number, fim: number): Peca => {
  const W = 560;
  const H = 880;
  const FW = 420;
  const FH = 780;
  const fx = 70;
  const fy = 80;
  const tela = { w: FW - 24, h: FH - 24 };
  const fitNome = encaixar(ev.titulo ?? "", { largura: tela.w - 60, max: 56, min: 36, linhas: 3, fonte: { peso: 700 } });
  const fitSub = ev.texto ? encaixar(ev.texto, { largura: tela.w - 60, max: 36, min: 26, linhas: 2, fonte: { peso: 600 } }) : null;
  const toca = (t: number) => t >= ev.em && t < Math.min(fim, ev.em + 3.6);
  return {
    w: W,
    h: H,
    // o celular fica solto na cortiça: os pinos são cravados em volta dele
    pino: { x: W / 2, y: 36 },
    ancoras: { esq: { x: 34, y: 60 }, dir: { x: W - 34, y: 60 }, baixo: { x: W / 2, y: H - 14 } },
    // o celular ocupa ~60% da altura do quadro
    zoom: 1.17,
    desenhar: (t) => {
      // vibra em rajadas (0,7 s sim, 0,35 s não)
      const ciclo = (t - ev.em) % 1.05;
      const vibrando = toca(t) && ciclo < 0.7;
      const giro = vibrando ? Math.sin(t * 2 * Math.PI * 21) * 1.3 : 0;
      const pulso = toca(t) ? 1 + 0.07 * Math.sin((t - ev.em) * Math.PI * 2 * 1.4) : 1;
      return (
        <>
          {/* ondas da chamada, atrás do aparelho */}
          {toca(t)
            ? [0, 1, 2].map((k) => {
                const fase = ((t - ev.em) / 0.95 + k / 3) % 1;
                return (
                  <div
                    key={k}
                    style={{
                      position: "absolute",
                      left: fx,
                      top: fy,
                      width: FW,
                      height: FH,
                      borderRadius: 70,
                      border: "4px solid rgba(240,228,200,0.55)",
                      transform: `scale(${1 + fase * 0.16})`,
                      opacity: (1 - fase) * 0.8,
                    }}
                  />
                );
              })
            : null}
          <div
            style={{
              position: "absolute",
              left: fx,
              top: fy,
              width: FW,
              height: FH,
              borderRadius: 70,
              background: "#2B2E33",
              boxShadow: "0 4px 6px rgba(0,0,0,0.55), 0 26px 44px rgba(0,0,0,0.6), inset 0 0 0 2px #4A4E55",
              rotate: `${giro}deg`,
            }}
          >
            <div style={{ position: "absolute", left: 12, top: 12, width: tela.w, height: tela.h, borderRadius: 58, overflow: "hidden", background: "linear-gradient(180deg, #2A3038 0%, #171A1F 55%, #0F1114 100%)" }}>
              <div style={{ position: "absolute", left: "50%", top: 18, width: 116, height: 32, marginLeft: -58, borderRadius: 16, background: "#050607" }} />
              <div style={{ position: "absolute", left: "50%", top: 130, width: 156, height: 156, marginLeft: -78, borderRadius: "50%", background: "#3A4049", display: "flex", alignItems: "center", justifyContent: "center", color: COR.manilaClaro }}>
                <Icone nome={ev.icone ?? "pessoa"} tamanho={92} espessura={1.7} />
              </div>
              <div style={{ position: "absolute", left: 30, right: 30, top: 322, textAlign: "center", fontFamily: SORA, fontWeight: 700, fontSize: fitNome.tamanho, lineHeight: 1.1, color: "#FFFFFF" }}>
                {fitNome.linhas.map((l, i) => (
                  <div key={i}>{l}</div>
                ))}
                {fitSub ? (
                  <div style={{ marginTop: 18, fontWeight: 600, fontSize: fitSub.tamanho, color: "#B5BCC6", opacity: prog(t, ev.textoEm ?? ev.em, 0.3) }}>
                    {fitSub.linhas.map((l, i) => (
                      <div key={i}>{l}</div>
                    ))}
                  </div>
                ) : null}
              </div>
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 70, display: "flex", justifyContent: "space-around", padding: "0 34px" }}>
                <div style={{ width: 118, height: 118, borderRadius: "50%", background: "#B8463E", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF" }}>
                  <Icone nome="desligar" tamanho={62} espessura={1.9} />
                </div>
                <div style={{ width: 118, height: 118, borderRadius: "50%", background: "#3B9F63", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", transform: `scale(${pulso})` }}>
                  <Icone nome="telefone" tamanho={58} espessura={1.9} />
                </div>
              </div>
            </div>
          </div>
          {etiqueta(ev, letra, W - 250, H - 96, t, 5)}
        </>
      );
    },
  };
};

// ——— print de mensagem ———
const pecaMensagem = (ev: Evidencia, letra: number, plano: Plano, fim: number): Peca => {
  const W = 860;
  const B = 20;
  const texto = ev.texto ?? "";
  const fit = encaixarBloco(texto, { largura: 690, altura: 360, max: 74, min: 36, maxLinhas: 5, entrelinha: 1.14, fonte: { peso: 600 } });
  const hBolha = fit.linhas.length * fit.tamanho * 1.14 + 64;
  const h = Math.round(B + 116 + 44 + hBolha + 56 + B);
  const enfase = trechoNoTexto(texto, ev.destaque);
  const tempos = fit.linhas.join(" ").split(/\s+/).map(() => ev.em + 0.2);
  const inicial = (ev.titulo ?? "?").trim().charAt(0).toUpperCase();
  return {
    w: W,
    h,
    pino: { x: W / 2, y: 34 },
    desenhar: (t) => {
      const bolha = prog(t, ev.em + 0.12, 0.35);
      return (
        <>
          <Folha w={W} h={h} cor="#FBFAF7" grao={0.3}>
            <div style={{ position: "absolute", left: B, top: B, right: B, bottom: B, background: "#E9ECEF", overflow: "hidden" }}>
              <div style={{ height: 116, background: "#F8F9FA", display: "flex", alignItems: "center", gap: 22, padding: "0 30px", borderBottom: "2px solid #DDE1E5" }}>
                <div style={{ width: 70, height: 70, borderRadius: 35, background: "#2E3238", color: "#FFF", fontFamily: SORA, fontWeight: 700, fontSize: 34, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                  {ev.icone === "predio" ? <Icone nome="predio" tamanho={40} cor="#E9ECEF" /> : inicial}
                </div>
                <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: encaixar(ev.titulo ?? "", { largura: 620, max: 38, min: 26, linhas: 1, fonte: { peso: 700 } }).tamanho, color: "#1F2328", whiteSpace: "nowrap" }}>{ev.titulo}</div>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 34,
                  top: 116 + 44,
                  maxWidth: 770,
                  padding: "32px 36px",
                  background: "#FFFFFF",
                  borderRadius: "10px 34px 34px 34px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
                  fontFamily: SORA,
                  transformOrigin: "0 0",
                  transform: bolha < 1 ? `scale(${0.85 + 0.15 * bolha})` : undefined,
                  opacity: bolha,
                }}
              >
                <Falado linhas={fit.linhas} tempos={tempos} t={t} tamanho={fit.tamanho} peso={600} cor="#1F2328" entrelinha={1.14} enfase={enfase} enfaseEm={ev.destaqueEm} />
              </div>
            </div>
          </Folha>
          <Fita x={130} y={18} rot={-10} />
          <Fita x={W - 130} y={18} rot={9} />
          {etiqueta(ev, letra, -18, h - 50, t)}
        </>
      );
    },
  };
};

// ——— print de notificação ———
const pecaAlerta = (ev: Evidencia, letra: number, plano: Plano, fim: number): Peca => {
  const W = 860;
  const B = 20;
  const texto = ev.texto ?? "";
  const fit = encaixar(texto, { largura: 560, max: 84, min: 44, linhas: 3, fonte: { peso: 800 } });
  const hCartao = Math.max(200, 70 + fit.linhas.length * fit.tamanho * 1.06 + 48);
  const h = Math.round(B + 90 + hCartao + 90 + B);
  const tempos = temposDoTexto(texto, plano.palavras, ev.em, fim, ev.textoEm ?? ev.em);
  const enfase = trechoNoTexto(texto, ev.destaque);
  return {
    w: W,
    h,
    pino: { x: W / 2, y: 34 },
    desenhar: (t) => {
      const desce = prog(t, ev.em - 0.05, 0.45);
      return (
        <>
          <Folha w={W} h={h} cor="#FBFAF7" grao={0.3}>
            <div style={{ position: "absolute", left: B, top: B, right: B, bottom: B, overflow: "hidden", background: "linear-gradient(160deg, #3A3F47 0%, #1D2026 60%, #121418 100%)" }}>
              <div
                style={{
                  position: "absolute",
                  left: 34,
                  right: 34,
                  top: 90,
                  height: hCartao,
                  borderRadius: 36,
                  background: "rgba(244,243,240,0.96)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
                  transform: `translateY(${(1 - desce) * -160}px)`,
                  opacity: desce,
                  display: "flex",
                  gap: 26,
                  padding: "34px 30px",
                }}
              >
                <div style={{ width: 92, height: 92, borderRadius: 24, background: COR.manila, display: "flex", alignItems: "center", justifyContent: "center", color: COR.tinta, flex: "none" }}>
                  <Icone nome="alerta" tamanho={60} espessura={2.1} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {ev.titulo ? (
                    <div style={{ fontFamily: SORA, fontWeight: 600, fontSize: encaixar(ev.titulo, { largura: 560, max: 30, min: 22, linhas: 1, fonte: { peso: 600 } }).tamanho, color: "#5E636B", letterSpacing: "0.04em", textTransform: "uppercase", whiteSpace: "nowrap", marginBottom: 14 }}>
                      {ev.titulo}
                    </div>
                  ) : null}
                  <div style={{ fontFamily: SORA }}>
                    <Falado linhas={fit.linhas} tempos={tempos} t={t} tamanho={fit.tamanho} peso={800} cor="#16181C" entrelinha={1.06} enfase={enfase} enfaseEm={ev.destaqueEm} />
                  </div>
                </div>
              </div>
            </div>
          </Folha>
          <Fita x={130} y={18} rot={-9} />
          <Fita x={W - 130} y={18} rot={8} />
          {etiqueta(ev, letra, -18, h - 50, t)}
        </>
      );
    },
  };
};
