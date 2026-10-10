// Os blocos que acontecem com a pessoa em quadro cheio (as frases-chave): abertura, frase, destaque,
// pergunta e cta. O texto fica entre o queixo e a interface do app, em serifa, com sombra
// discreta e nenhuma faixa ou escurecimento sobre ela (a cor do vídeo nunca muda).
import { encaixar, larguraTexto } from "../medida";
import type { Abertura as TAbertura, Cta as TCta, Destaque as TDestaque, Frase as TFrase, Pergunta as TPergunta, Plano } from "../plano";
import { COR, FONTE, MARGEM, SERIFA, SOMBRA_LEVE, SOMBRA_TEXTO, UI_BASE, medidas, prog, suave } from "../tema";
import { FundoDaPrancha } from "./Cena";
import { disporTexto, TextoFalado } from "./Texto";

const LARGURA = 1080 - MARGEM * 2;

// some junto, no fim do momento (nada fica fantasma sobre o que vem depois)
const saida = (t: number, ate: number) => 1 - prog(t, ate - 0.24, 0.24, suave);

export const Abertura: React.FC<{ plano: Plano; m: TAbertura; t: number }> = ({ plano, m, t }) => {
  if (t < m.de - 0.1 || t >= m.ate) return null;
  const inicio = m.em ?? m.de;
  const d = disporTexto(m.texto, { largura: LARGURA, max: 92, min: 56, linhas: 3, fala: plano.palavras, de: inicio, ate: m.ate, destaque: m.destaque });
  const { textoTopo } = medidas(plano);
  const y = Math.min(textoTopo + 20, UI_BASE - 40 - d.altura);
  const fundo = prog(t, m.de, 0.3, suave) * saida(t, m.ate);
  return (
    <>
      {m.imagem ? <FundoDaPrancha plano={plano} m={m} t={t} sobreCena={false} opacidade={fundo} fim={m.ate} /> : null}
      <div style={{ position: "absolute", inset: 0, opacity: saida(t, m.ate) }}>
        <div style={{ position: "absolute", left: 540 - 30, top: y - 34, width: 60 * prog(t, inicio - 0.1, 0.5), height: 3, background: COR.vermelhao, boxShadow: SOMBRA_LEVE }} />
        <TextoFalado d={d} x={MARGEM} y={y} t={t} />
      </div>
    </>
  );
};

export const Frase: React.FC<{ plano: Plano; m: TFrase; t: number }> = ({ plano, m, t }) => {
  if (t < m.de - 0.1 || t >= m.ate) return null;
  const inicio = m.em ?? m.de;
  const d = disporTexto(m.texto, {
    largura: LARGURA,
    max: 80,
    min: 50,
    linhas: 3,
    fonte: { serifa: true, italico: true, peso: 500 },
    entrelinha: 1.2,
    fala: plano.palavras,
    de: inicio,
    ate: m.ate,
    destaque: m.destaque,
    risco: m.risco,
  });
  const { textoTopo } = medidas(plano);
  const y = Math.min(textoTopo + 70, UI_BASE - 30 - d.altura);
  const aspas = prog(t, inicio - 0.15, 0.4);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: saida(t, m.ate) }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          width: 1080,
          top: y - 128,
          textAlign: "center",
          fontFamily: SERIFA,
          fontWeight: 600,
          fontSize: 150,
          lineHeight: "150px",
          color: COR.vermelhao,
          opacity: aspas,
          transform: aspas >= 1 ? undefined : `translateY(${(1 - aspas) * 10}px)`,
          textShadow: SOMBRA_LEVE,
        }}
      >
        “
      </div>
      <TextoFalado d={d} x={MARGEM} y={y} t={t} riscoEm={m.riscoEm} />
    </div>
  );
};

export const Destaque: React.FC<{ plano: Plano; m: TDestaque; t: number }> = ({ plano, m, t }) => {
  if (t < m.de - 0.1 || t >= m.ate) return null;
  const fit = encaixar(m.texto, { largura: LARGURA * 0.95, max: 124, min: 60, linhas: 2, fonte: { serifa: true, peso: 700 } });
  const lh = Math.round(fit.tamanho * 1.08);
  const { textoTopo } = medidas(plano);
  const temDetalhe = !!m.detalhe?.trim();
  const altura = lh * fit.linhas.length + (temDetalhe ? 70 : 0);
  const y = Math.min(textoTopo + 40, UI_BASE - 30 - altura);
  const e = prog(t, m.em - 0.05, 0.4);
  const cor = m.nivel === "alerta" ? COR.vermelhao : COR.marfim;
  const de = m.detalheEm ?? m.em + 0.5;
  const ed = prog(t, de, 0.35);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: saida(t, m.ate) }}>
      <div style={{ position: "absolute", left: 540 - 36, top: y - 30, width: 72 * prog(t, m.em - 0.2, 0.5), height: 4, background: COR.vermelhao, boxShadow: SOMBRA_LEVE }} />
      {e > 0
        ? fit.linhas.map((l, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 0,
                width: 1080,
                top: y + i * lh,
                height: lh,
                lineHeight: `${lh}px`,
                textAlign: "center",
                fontFamily: SERIFA,
                fontWeight: 700,
                fontSize: fit.tamanho,
                color: cor,
                whiteSpace: "nowrap",
                opacity: e,
                transform: e >= 1 ? undefined : `translateY(${(1 - e) * 16}px)`,
                textShadow: SOMBRA_TEXTO,
              }}
            >
              {l}
            </div>
          ))
        : null}
      {temDetalhe && ed > 0 ? (
        <div
          style={{
            position: "absolute",
            left: MARGEM,
            width: LARGURA,
            top: y + lh * fit.linhas.length + 14,
            textAlign: "center",
            fontFamily: FONTE,
            fontWeight: 600,
            fontSize: 38,
            color: COR.marfim,
            opacity: ed,
            textShadow: SOMBRA_TEXTO,
          }}
        >
          {m.detalhe}
        </div>
      ) : null}
    </div>
  );
};

export const Pergunta: React.FC<{ plano: Plano; m: TPergunta; t: number }> = ({ plano, m, t }) => {
  if (t < m.de - 0.1 || t >= m.ate) return null;
  const inicio = m.em ?? m.de;
  const opcoes = m.opcoes ?? [];
  const muitas = opcoes.length >= 3;
  const d = disporTexto(m.texto, { largura: LARGURA, max: muitas ? 66 : 78, min: 46, linhas: 3, fala: plano.palavras, de: inicio, ate: m.ate });
  const tamOp = muitas ? 36 : 40;
  const altOp = Math.round(tamOp * 1.9);
  const { textoTopo } = medidas(plano);
  const altura = d.altura + (opcoes.length ? 34 + opcoes.length * (altOp + 14) : 0);
  const y = Math.max(textoTopo - 30, Math.min(textoTopo + 30, UI_BASE - 20 - altura));
  const larguraOp = Math.min(
    LARGURA,
    Math.max(420, ...opcoes.map((o) => larguraTexto(o.texto, tamOp, { peso: 700 }) + 120)),
  );
  return (
    <div style={{ position: "absolute", inset: 0, opacity: saida(t, m.ate) }}>
      <TextoFalado d={d} x={MARGEM} y={y} t={t} />
      {opcoes.map((o, i) => {
        const e = prog(t, o.em - 0.05, 0.35);
        if (e <= 0) return null;
        const fit = encaixar(o.texto, { largura: larguraOp - 120, max: tamOp, min: 26, linhas: 1, fonte: { peso: 700 } });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 540 - larguraOp / 2,
              top: y + d.altura + 34 + i * (altOp + 14),
              width: larguraOp,
              height: altOp,
              borderRadius: altOp / 2,
              border: `2px solid ${COR.marfim}`,
              display: "flex",
              alignItems: "center",
              gap: 18,
              paddingLeft: 26,
              boxSizing: "border-box",
              opacity: e,
              transform: e >= 1 ? undefined : `translateY(${(1 - e) * 12}px)`,
              boxShadow: "0 2px 14px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ fontFamily: SERIFA, fontWeight: 700, fontSize: tamOp, color: COR.vermelhao, textShadow: SOMBRA_LEVE }}>{String.fromCharCode(65 + i)}</div>
            <div style={{ fontFamily: FONTE, fontWeight: 700, fontSize: fit.tamanho, color: COR.marfim, whiteSpace: "nowrap", textShadow: SOMBRA_TEXTO }}>{o.texto}</div>
          </div>
        );
      })}
    </div>
  );
};

// ícones de traço, no estilo dos fios do letreiro
const Icone: React.FC<{ nome: TCta["icone"]; tamanho: number }> = ({ nome, tamanho }) => {
  const p = { fill: "none", stroke: COR.marfim, strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24">
      {nome === "seguir" ? (
        <>
          <circle cx="10" cy="8" r="4" {...p} />
          <path d="M3 20c0-3.9 3.1-7 7-7s7 3.1 7 7" {...p} />
          <path d="M19 7v6M16 10h6" {...p} stroke={COR.vermelhao} />
        </>
      ) : nome === "comentar" ? (
        <path d="M4 5h16v11H9l-5 4z" {...p} />
      ) : nome === "link" ? (
        <>
          <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" {...p} />
          <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" {...p} />
        </>
      ) : (
        <path d="M6 3h12v18l-6-4-6 4z" {...p} />
      )}
    </svg>
  );
};

export const Cta: React.FC<{ plano: Plano; m: TCta; t: number }> = ({ plano, m, t }) => {
  if (t < m.de - 0.1 || t >= m.ate) return null;
  const inicio = m.em ?? m.de;
  const d = disporTexto(m.texto, { largura: LARGURA, max: 80, min: 50, linhas: 3, fala: plano.palavras, de: inicio, ate: m.ate, destaque: m.destaque });
  const { textoTopo } = medidas(plano);
  const tamIcone = 112;
  const y = Math.min(textoTopo + 30, UI_BASE - 30 - d.altura - tamIcone - 30);
  const e = prog(t, inicio - 0.1, 0.45);
  // o anel do ícone se fecha devagar enquanto a frase é dita (nunca parado)
  const anel = prog(t, inicio, Math.max(0.6, m.ate - inicio - 0.3), suave);
  const r = tamIcone / 2 - 3;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: saida(t, m.ate) }}>
      <div style={{ position: "absolute", left: 540 - tamIcone / 2, top: y, width: tamIcone, height: tamIcone, opacity: e, transform: e >= 1 ? undefined : `scale(${0.9 + 0.1 * e})` }}>
        <svg width={tamIcone} height={tamIcone} style={{ position: "absolute", inset: 0, filter: "drop-shadow(0 1px 6px rgba(0,0,0,0.45))" }}>
          <circle cx={tamIcone / 2} cy={tamIcone / 2} r={r} fill="none" stroke={COR.linha} strokeWidth={2} />
          <circle
            cx={tamIcone / 2}
            cy={tamIcone / 2}
            r={r}
            fill="none"
            stroke={COR.vermelhao}
            strokeWidth={3}
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - anel)}
            transform={`rotate(-90 ${tamIcone / 2} ${tamIcone / 2})`}
          />
        </svg>
        <div style={{ position: "absolute", left: tamIcone * 0.25, top: tamIcone * 0.25, filter: "drop-shadow(0 1px 6px rgba(0,0,0,0.45))" }}>
          <Icone nome={m.icone ?? "salvar"} tamanho={tamIcone * 0.5} />
        </div>
      </div>
      <TextoFalado d={d} x={MARGEM} y={y + tamIcone + 30} t={t} />
    </div>
  );
};
