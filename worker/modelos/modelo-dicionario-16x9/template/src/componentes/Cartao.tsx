// O cartão de nota do verbete: na frente, o que a palavra PARECE (a leitura comum), que é riscada;
// ele vira (flip) e no verso aparece o que ela SIGNIFICA de verdade, com o carimbo.
// Chips de idioma ("PT", "ES") só quando o plano pede (`parece.idioma`, `idioma`).
import { bate, impressao, limitar, preciso, prog } from "../anim";
import type { Verbete } from "../plano";
import { encaixar, type Fonte, larguraTexto as medirTexto } from "../medida";
import { caber, cor, LARGURA_SERIF, LARGURA_SERIF_NEGRITO, rotulo, sans, serif, sombraPapel } from "../tema";
import { LinhasFaladas } from "./Texto";

const ITALICO: Fonte = { familia: "italico", peso: 400 };
const NEGRITO: Fonte = { familia: "serif", peso: 700 };
const TEXTO: Fonte = { familia: "serif", peso: 400 };
// texto padrão do carimbo (o plano troca em carimbo.texto)
export const CARIMBO_PADRAO = "Engano comum";
import { FiguraRiscavel, FIGURAS } from "./Figuras";

const PADDING = 34;
export const DUR_VIRA = 0.46;

// instantes derivados (o plano pode fixar cada um)
export const temposDoCartao = (m: Verbete) => {
  const tinta = m.parece.em - 0.45;
  const risca = m.parece.riscaEm ?? m.parece.em + 0.55;
  const vira = m.significa.viraEm ?? Math.max(risca + 0.25, m.significa.em - 0.45);
  return { tinta, risca, vira };
};

// Chip do idioma: PT contornado (o que parece), ES cheio (o que é)
export const Chip: React.FC<{ texto: string; cheio: boolean; corTraco?: string }> = ({ texto, cheio, corTraco = cor.tinta }) => (
  <span
    style={{
      ...rotulo,
      fontSize: 32,
      letterSpacing: "0.08em",
      padding: "8px 12px 7px",
      borderRadius: 8,
      border: `3px solid ${cheio ? cor.ameixa : corTraco}`,
      background: cheio ? cor.ameixa : "transparent",
      color: cheio ? cor.claro : corTraco,
      marginRight: 16,
    }}
  >
    {texto}
  </span>
);

// Carimbo editorial: moldura dupla arredondada, caixa-alta pesada, tinta ameixa. Bate seco no `em`.
export const Carimbo: React.FC<{ texto: string; em: number; t: number; corpo: number; giro?: number }> = ({ texto, em, t, corpo, giro = -8 }) => {
  if (t < em - 0.02) return null;
  const p = prog(t, em - 0.02, 0.14, bate);
  return (
    <div
      style={{
        transform: `rotate(${giro}deg) scale(${1.5 - 0.5 * p})`,
        opacity: limitar(p * 1.6) * 0.93,
        border: `5px solid ${cor.ameixa}`,
        borderRadius: 16,
        padding: 6,
        mixBlendMode: "multiply",
        background: "rgba(250,248,242,0.55)",
      }}
    >
      <div
        style={{
          border: `2px solid ${cor.ameixa}`,
          borderRadius: 10,
          padding: `${corpo * 0.2}px ${corpo * 0.42}px ${corpo * 0.16}px`,
          fontFamily: sans,
          fontWeight: 800,
          fontSize: corpo,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: cor.ameixa,
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        {texto}
      </div>
    </div>
  );
};

// Palavra com risco ameixa que se desenha da esquerda para a direita
export const Riscado: React.FC<{ p: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ p, children, style }) => (
  <span style={{ position: "relative", display: "inline-block", ...style }}>
    {children}
    {p > 0 ? (
      <span
        style={{
          position: "absolute",
          left: "-4%",
          top: "54%",
          width: `${108 * p}%`,
          height: "0.085em",
          minHeight: 7,
          borderRadius: 6,
          background: cor.ameixa,
          transform: "rotate(-3deg)",
          transformOrigin: "0% 50%",
        }}
      />
    ) : null}
  </span>
);

// Marca-texto ameixa clarinho por baixo da palavra certa
export const Grifado: React.FC<{ p: number; children: React.ReactNode }> = ({ p, children }) => (
  <span style={{ position: "relative", display: "inline-block" }}>
    <span
      style={{
        position: "absolute",
        left: "-0.06em",
        bottom: "0.08em",
        height: "0.42em",
        width: `calc(${p * 100}% + ${p * 0.12}em)`,
        background: cor.ameixaVeu,
        borderRadius: 4,
      }}
    />
    <span style={{ position: "relative" }}>{children}</span>
  </span>
);

export const Cartao: React.FC<{
  m: Verbete;
  t: number;
  x: number;
  y: number;
  w: number;
  h: number;
  largo: boolean;
}> = ({ m, t, x, y, w, h, largo }) => {
  const { tinta, risca, vira } = temposDoCartao(m);
  const pTinta = prog(t, tinta, 0.3);
  const pVira = prog(t, vira, DUR_VIRA, preciso);
  const angulo = 180 * pVira;
  const pRisca = prog(t, risca, 0.24);
  const carimboEm = m.carimbo?.em ?? Infinity;
  // o cartão afunda um tiquinho quando o carimbo bate
  const batida = t >= carimboEm ? Math.sin(limitar((t - carimboEm) / 0.16) * Math.PI) : 0;
  const levanta = Math.sin(pVira * Math.PI);

  const figFrente = m.parece.figura;
  const figVerso = m.significa.figura;
  const interno = { w: w - 2 * PADDING, h: h - 2 * PADDING };
  // com desenho: no cartão largo o desenho fica à esquerda; no estreito, em cima
  const ladoFig = (temFig: boolean) => (temFig ? (largo ? Math.min(interno.h, 330) : Math.min(interno.w * 0.8, 300)) : 0);
  const larguraTexto = (temFig: boolean) => (largo && temFig ? interno.w - ladoFig(true) - 30 : interno.w);

  const palavraFrente = m.parece.texto;
  const glosa = m.parece.glosa ? `= ${m.parece.glosa}` : "";
  // corpo da frente: o do exemplo aprovado (estimado) como teto; texto longo quebra em até duas linhas
  const tetoFrente = Math.max(56, Math.min(largo ? 100 : 84, Math.floor(larguraTexto(!!figFrente) / (Math.max(palavraFrente.length, 1) * LARGURA_SERIF * 1.02))));
  const encFrente = encaixar(palavraFrente, { largura: larguraTexto(!!figFrente), max: tetoFrente, min: 48, linhas: 2, fonte: ITALICO });
  const corpoFrente = encFrente.corpo;
  // no cartão largo, sem desenho, a glosa vai ao lado da palavra se couber
  const emLinha =
    largo &&
    !figFrente &&
    !!glosa &&
    encFrente.linhas.length === 1 &&
    palavraFrente.length * 0.5 * 100 + (glosa.length) * 0.5 * 60 + 34 < interno.w &&
    medirTexto(palavraFrente, corpoFrente, ITALICO) + medirTexto(glosa, 60, TEXTO) + 34 < interno.w;
  const corpoGlosa0 = emLinha ? 60 : largo ? 50 : 46;
  const encGlosa = glosa ? encaixar(glosa, { largura: emLinha ? interno.w : larguraTexto(!!figFrente), max: corpoGlosa0, min: 40, linhas: 2, fonte: TEXTO }) : null;
  const sentidos = [m.significa.texto, ...(m.significa.extra ? [m.significa.extra] : [])];
  const numerados = sentidos.length > 1;
  const larguraNumero = numerados ? 56 : 0;
  // o carimbo ocupa o canto de baixo: linhas que descem até lá ficam mais curtas
  const textoCarimbo = m.carimbo?.texto ?? CARIMBO_PADRAO;
  const corpoCarimbo = largo ? 44 : 36;
  const larguraCarimbo = m.carimbo ? medirTexto(textoCarimbo, corpoCarimbo, { familia: "sans", peso: 800, caixaAlta: true, espacamento: 0.1 }) + corpoCarimbo * 0.84 + 30 : 0;
  const tetoVerso = caber(m.significa.texto + (numerados ? "1. " : ""), larguraTexto(!!figVerso), largo ? 108 : 96, LARGURA_SERIF_NEGRITO, 56, NEGRITO);
  let encVerso = encaixar(m.significa.texto, { largura: larguraTexto(!!figVerso) - larguraNumero, max: tetoVerso, min: 48, linhas: 2, fonte: NEGRITO });
  if (encVerso.linhas.length > 1 && m.carimbo && largo) {
    encVerso = encaixar(m.significa.texto, { largura: larguraTexto(!!figVerso) - larguraNumero - larguraCarimbo * 0.6, max: tetoVerso, min: 48, linhas: 3, fonte: NEGRITO });
  }
  const corpoVerso = encVerso.linhas.length === 1 ? tetoVerso : encVerso.corpo;
  const corpoExtra0 = Math.max(44, Math.min(56, Math.round(corpoVerso * 0.56)));
  const encExtra = m.significa.extra
    ? encaixar(m.significa.extra, {
        largura: Math.max(200, larguraTexto(!!figVerso) - larguraNumero - (m.carimbo && largo ? larguraCarimbo : 0)),
        max: corpoExtra0,
        min: 40,
        linhas: 2,
        fonte: ITALICO,
      })
    : null;
  const corpoExtra = encExtra ? encExtra.corpo : corpoExtra0;

  const face: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    borderRadius: 18,
    padding: PADDING,
    display: "flex",
    flexDirection: largo ? "row" : "column",
    gap: 30,
    alignItems: largo ? "center" : "stretch",
  };

  const rotuloLinha = (chip: React.ReactNode, texto: string, corTexto: string) => (
    <div style={{ display: "flex", alignItems: "center", marginBottom: largo ? 18 : 22 }}>
      {chip}
      <span style={{ ...rotulo, color: corTexto }}>{texto}</span>
    </div>
  );

  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, perspective: 2000 }}>
      {/* esboço a lápis do cartão (some quando o cartão ganha tinta) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 18,
          border: `3px dashed ${cor.lapis}`,
          opacity: 1 - pTinta,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformStyle: "preserve-3d",
          transform: `translateY(${batida * 4}px) rotateY(${-angulo}deg) scale(${1 + 0.035 * levanta})`,
        }}
      >
        {/* FRENTE — PT: o que parece */}
        <div
          style={{
            ...face,
            background: `rgba(250,248,242,${pTinta})`,
            boxShadow: pTinta > 0.5 ? sombraPapel : "none",
          }}
        >
          {figFrente ? (
            <div style={{ alignSelf: largo ? "center" : "center", flex: "none" }}>
              <FiguraRiscavel nome={figFrente} t={t} em={m.parece.em} cor={cor.tinta} tamanho={ladoFig(true)} riscaEm={risca} />
            </div>
          ) : null}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
            {rotuloLinha(
              m.parece.idioma ? <Chip texto={m.parece.idioma} cheio={false} corTraco={pTinta > 0.5 ? cor.tinta : cor.lapis} /> : null,
              m.parece.rotulo ?? "Parece",
              pTinta > 0.5 ? cor.cinza : cor.lapis,
            )}
            <div style={{ display: "flex", flexDirection: emLinha ? "row" : "column", alignItems: emLinha ? "baseline" : "stretch", gap: emLinha ? 34 : 0 }}>
            <div style={{ fontFamily: serif, fontStyle: "italic", fontWeight: 400, fontSize: corpoFrente, lineHeight: 1.1, color: cor.tinta, opacity: 1 - 0.3 * pRisca }}>
              {t < m.parece.em - 0.02 ? (
                encFrente.linhas.map((_, i) => (
                  <div key={i} style={{ height: corpoFrente * 1.1, display: "flex", alignItems: "flex-end" }}>
                    <div style={{ width: i ? "45%" : "70%", borderBottom: `4px dashed ${cor.lapis}`, marginBottom: corpoFrente * 0.2 }} />
                  </div>
                ))
              ) : (
                <div style={impressao(t, m.parece.em)}>
                  {encFrente.linhas.map((l, i) => (
                    <div key={i} style={{ whiteSpace: "nowrap" }}>
                      {/* o risco passa linha por linha */}
                      <Riscado p={limitar(pRisca * encFrente.linhas.length - i)}>{l}</Riscado>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {encGlosa ? (
              <div
                style={{
                  fontFamily: serif,
                  fontSize: encGlosa.corpo,
                  lineHeight: 1.15,
                  color: cor.cinza,
                  marginTop: emLinha ? 0 : 10,
                  ...impressao(t, m.parece.em + 0.18),
                }}
              >
                {encGlosa.linhas.map((l, i) => (
                  <div key={i} style={{ whiteSpace: "nowrap" }}>
                    {l}
                  </div>
                ))}
              </div>
            ) : null}
            </div>
          </div>
        </div>

        {/* VERSO — ES: o que é de verdade */}
        <div
          style={{
            ...face,
            transform: "rotateY(180deg)",
            background: cor.cartao,
            boxShadow: sombraPapel,
          }}
        >
          {figVerso ? (
            <div style={{ alignSelf: "center", flex: "none" }}>
              {(() => {
                const Desenho = FIGURAS[figVerso];
                return <Desenho t={t} em={m.significa.em} cor={cor.tinta} tamanho={ladoFig(true)} />;
              })()}
            </div>
          ) : null}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
            {rotuloLinha(m.idioma ? <Chip texto={m.idioma} cheio /> : null, m.significa.rotulo ?? "Significa", cor.ameixa)}
            {sentidos.map((s, i) => {
              const em = i === 0 ? m.significa.em : m.significa.em + 0.3;
              const principal = i === 0;
              const enc = principal ? encVerso : encExtra;
              // texto que quebra em mais de uma linha: linhas medidas (o grifo passa em cada uma)
              if (enc && enc.linhas.length > 1)
                return (
                  <div key={s} style={{ display: "flex", alignItems: "flex-start", marginTop: principal ? 0 : 12 }}>
                    {numerados ? (
                      <span style={{ fontFamily: sans, fontWeight: 700, fontSize: principal ? 42 : 40, lineHeight: `${enc.corpo * 1.12}px`, color: cor.ameixa, width: larguraNumero, flex: "none", ...impressao(t, em) }}>
                        {i + 1}.
                      </span>
                    ) : null}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <LinhasFaladas
                        linhas={enc.linhas}
                        corpo={enc.corpo}
                        entrelinha={1.12}
                        fonte={principal ? NEGRITO : ITALICO}
                        tempos={enc.linhas.join(" ").split(" ").map((_, k) => em + k * 0.04)}
                        t={t}
                        cor={principal ? cor.tinta : cor.cinza}
                        grifo={principal ? { em: em + 0.12 } : undefined}
                        esboco="nada"
                      />
                    </div>
                  </div>
                );
              return (
                <div
                  key={s}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    fontFamily: serif,
                    fontWeight: principal ? 700 : 400,
                    fontStyle: principal ? "normal" : "italic",
                    fontSize: principal ? corpoVerso : corpoExtra,
                    lineHeight: 1.12,
                    color: principal ? cor.tinta : cor.cinza,
                    marginTop: principal ? 0 : 12,
                  }}
                >
                  {numerados ? (
                    <span style={{ fontFamily: sans, fontWeight: 700, fontSize: principal ? 42 : 40, color: cor.ameixa, marginRight: 14, ...impressao(t, em) }}>
                      {i + 1}.
                    </span>
                  ) : null}
                  {t < em - 0.02 ? (
                    <span style={{ display: "inline-block", width: "60%", borderBottom: `4px dashed ${cor.lapis}` }} />
                  ) : (
                    <span style={impressao(t, em)}>{principal ? <Grifado p={prog(t, em + 0.12, 0.35)}>{s}</Grifado> : s}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* carimbo por cima do canto do cartão (fica de fora da virada) */}
      {m.carimbo && pVira >= 0.99 ? (
        <div style={{ position: "absolute", right: largo ? 26 : -10, bottom: largo ? 26 : -26 }}>
          <Carimbo texto={textoCarimbo} em={m.carimbo.em} t={t} corpo={corpoCarimbo} giro={largo ? -8 : -6} />
        </div>
      ) : null}
    </div>
  );
};
