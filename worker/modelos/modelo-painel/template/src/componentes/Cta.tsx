import { prog, temposDasPalavras, usePalavras, useTempo } from "../anim";
import { encaixar } from "../medida";
import type { Cta as TCta, Plano } from "../plano";
import { cor, mono, rotulo, sans } from "../tema";
import { Cartao, type Zona } from "./Cartao";
import { TituloNaFala } from "./Titulo";

// Ícones de traço (viewBox 48×48), desenhados enquanto a chamada entra.
const TRACOS: Record<NonNullable<TCta["icone"]>, string[]> = {
  seguir: ["M25,17 a6,6 0 1,0 -0.01,0", "M8,40 c1,-8 5,-12 11,-12 s10,4 11,12", "M37,13 v12", "M31,19 h12"],
  salvar: ["M13,7 h22 v34 l-11,-8 l-11,8 z"],
  comentar: ["M8,10 h32 v22 h-18 l-8,7 v-7 h-6 z"],
  link: ["M20,28 l8,-8", "M17,24 l-4,4 a6,6 0 0,0 8.5,8.5 l4,-4", "M31,24 l4,-4 a6,6 0 0,0 -8.5,-8.5 l-4,4"],
};

const Icone: React.FC<{ nome: NonNullable<TCta["icone"]>; p: number }> = ({ nome, p }) => (
  <svg width={84} height={84} viewBox="0 0 48 48">
    <rect x={1} y={1} width={46} height={46} rx={12} fill={cor.positivo} fillOpacity={0.12 * p} stroke={cor.positivo} strokeOpacity={0.5 * p} strokeWidth={1.2} />
    {TRACOS[nome].map((d) => (
      <path
        key={d}
        d={d}
        fill="none"
        stroke={cor.positivo}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - p}
      />
    ))}
  </svg>
);

// Campo que digita valores: "faça a conta com o seu valor".
const textoDigitado = (t: number, em: number, valores: string[]) => {
  const LETRA = 0.075;
  const APAGA = 0.035;
  const ESPERA = 0.75;
  let cursor = em;
  for (let i = 0; i < valores.length; i++) {
    const v = valores[i];
    const fimDigitar = cursor + v.length * LETRA;
    if (t < fimDigitar) return v.slice(0, Math.max(0, Math.floor((t - cursor) / LETRA)));
    const ultimo = i === valores.length - 1;
    if (ultimo || t < fimDigitar + ESPERA) return v;
    const fimApagar = fimDigitar + ESPERA + v.length * APAGA;
    if (t < fimApagar) return v.slice(0, v.length - Math.floor((t - fimDigitar - ESPERA) / APAGA));
    cursor = fimApagar;
  }
  return valores[valores.length - 1] ?? "";
};

// Fechamento: a chamada se monta na fala, o campo digita valores e a assinatura fecha.
// O cartão cresce a cada parte que entra: nada de espaço vazio esperando.
export const Cta: React.FC<{ m: TCta; marca: Plano["marca"]; fim: number; zona: Zona; t0: number }> = ({
  m,
  marca,
  fim,
  zona,
  t0,
}) => {
  const t = useTempo();
  const icone = m.icone ?? "seguir";
  const campo = m.campo;
  const digitado = campo ? textoDigitado(t, campo.em + 0.25, campo.valores) : "";
  const cursorVisivel = Math.floor(t * 2.2) % 2 === 0;
  // a linha de apoio começa na palavra falada logo depois da chamada
  const palavras = usePalavras();
  const nTexto = m.texto.split(/\s+/).filter(Boolean).length;
  // a chamada começa no `em` (ou no começo do momento), nunca no início atrasado da animação
  const emTexto = m.em ?? m.de;
  const apoioEm = m.apoio ? temposDasPalavras(palavras, emTexto, nTexto + 1)[nTexto] : undefined;
  const largura = 1080 - zona.esquerda - zona.direita;
  // a chamada cabe em até 3 linhas ao lado do ícone; o apoio, em até 2 linhas embaixo
  const medidaTexto = encaixar(m.texto, { largura: largura - 88 - 84 - 26, max: 76, min: 50, linhas: 3, fonte: { peso: 600, espacamento: -0.02 } });
  const medidaApoio = m.apoio ? encaixar(m.apoio, { largura: largura - 88, max: 42, min: 34, linhas: 2, fonte: { peso: 500 } }) : null;
  const assinaturaEm = Math.min(fim - 0.7, Math.max(t0 + 0.9, campo ? campo.em + 0.45 : (apoioEm ?? t0) + 0.8));

  return (
    <Cartao de={t0} ate={fim} style={{ width: 1080 - zona.esquerda - zona.direita, padding: "32px 44px 34px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
        <Icone nome={icone} p={prog(t, t0 + 0.1, 0.8)} />
        <TituloNaFala
          texto={m.texto}
          medida={medidaTexto}
          em={emTexto}
          limite={apoioEm}
          fonte={sans}
          destaque={m.destaque}
          entrelinha={1.05}
          espacamento="-0.02em"
          crescer
        />
      </div>
      {m.apoio && medidaApoio ? (
        <div style={{ height: (medidaApoio.linhas.length * medidaApoio.tamanho * 1.2 + 15.6) * prog(t, (apoioEm ?? t0 + 0.4) - 0.14, 0.3) }}>
          <div style={{ paddingTop: 14 }}>
            <TituloNaFala
              texto={m.apoio}
              medida={medidaApoio}
              em={apoioEm ?? t0 + 0.4}
              fonte={sans}
              peso={500}
              corTexto={cor.suave}
              entrelinha={1.2}
              espacamento="0em"
            />
          </div>
        </div>
      ) : null}
      {campo ? (
        <div style={{ height: 128 * prog(t, campo.em - 0.2, 0.3) }}>
          <div
            style={{
              marginTop: 24,
              height: 104,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              gap: 24,
              padding: "0 26px",
              borderRadius: 16,
              border: `2px solid ${prog(t, campo.em, 0.3) > 0.5 ? cor.positivo : cor.linha}`,
              background: "rgba(95,221,164,0.06)",
              opacity: prog(t, campo.em - 0.1, 0.35),
            }}
          >
            <div style={{ ...rotulo, fontSize: 32 }}>{campo.rotulo}</div>
            <div style={{ fontFamily: mono, fontWeight: 500, fontSize: 58, lineHeight: 1, color: cor.texto, whiteSpace: "nowrap" }}>
              {digitado}
              <span
                style={{
                  display: "inline-block",
                  width: 5,
                  height: 54,
                  marginLeft: 6,
                  verticalAlign: "-6px",
                  background: cor.positivo,
                  opacity: cursorVisivel ? 1 : 0,
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
      {marca.nome ? (
        <div style={{ height: 98 * prog(t, assinaturaEm - 0.15, 0.3), opacity: prog(t, assinaturaEm, 0.4) }}>
          <div style={{ height: 2, marginTop: 26, width: `${100 * prog(t, assinaturaEm - 0.1, 0.7)}%`, background: cor.linha, marginBottom: 20 }} />
          <div style={{ display: "flex", alignItems: "baseline", gap: 18, flexWrap: "wrap" }}>
            <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 42, color: cor.texto }}>{marca.nome}</div>
            {marca.area ? <div style={{ fontFamily: mono, fontSize: 32, color: cor.suave, letterSpacing: "0.01em" }}>{marca.area}</div> : null}
          </div>
        </div>
      ) : null}
    </Cartao>
  );
};
