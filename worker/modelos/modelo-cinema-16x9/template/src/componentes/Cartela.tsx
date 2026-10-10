import { Easing, interpolate } from "remotion";
import { prog, saindo, temposDasPalavras, useTempo, usePalavras } from "../anim";
import { encaixar, larguraTexto } from "../medida";
import type { Cartela as CartelaT } from "../plano";
import { cor, credito, sans, serif } from "../tema";
import { DesenhoDaCartela, LARGURA_DO_DESENHO, PROPORCAO_DO_DESENHO } from "./Desenhos";
import { LinhasEmFoco, quebrarEmLinhas, TextoEmFoco } from "./Foco";

const pousa = Easing.bezier(0.16, 0.84, 0.24, 1);

// "18:00", "1998", "83.000", "1,5": só dígitos e separadores → os dígitos rolam até o valor
export const ehNumerico = (s?: string) => !!s && /^[\d:.,h]+$/.test(s) && /\d/.test(s);

// ponto de partida padrão da rolagem: alguns minutos antes de uma hora, alguns anos antes de um ano,
// zero para os outros números
const partidaPadrao = (alvo: string) => {
  const hora = alvo.match(/^(\d{1,2})([:h])(\d{2})$/);
  if (hora) {
    const total = (Number(hora[1]) * 60 + Number(hora[3]) - 8 + 1440) % 1440;
    const hh = String(Math.floor(total / 60)).padStart(hora[1].length, "0");
    return `${hh}${hora[2]}${String(total % 60).padStart(2, "0")}`;
  }
  if (/^\d{4}$/.test(alvo)) return String(Number(alvo) - 12);
  return alvo.replace(/\d/g, "0");
};

// Largura de um algarismo da Cormorant com números alinhados e de largura igual (fração do corpo).
export const LARGURA_ALGARISMO = 0.52;

// Dígitos que rolam como um contador mecânico e pousam juntos no valor final.
// `em`: quando os dígitos começam a rolar; `pousaEm`: quando param no valor final (padrão: ~1 s
// depois); `apareceEm`: se dado, os dígitos já estão na tela, parados no valor de partida, desde
// esse instante (usado no letreiro que abre o vídeo: a hora já está lá no primeiro quadro).
// `voltas`: como um hodômetro — os algarismos da direita dão voltas inteiras antes de pousar
// (para números que contam a partir do zero).
export const Digitos: React.FC<{ texto: string; de?: string; em: number; pousaEm?: number; apareceEm?: number; tamanho: number; voltas?: boolean; corSeparador?: string }> = ({
  texto,
  de,
  em,
  pousaEm,
  apareceEm,
  tamanho,
  voltas,
  corSeparador = cor.ambar,
}) => {
  const t = useTempo();
  const inicio = (de ?? partidaPadrao(texto)).padStart(texto.length, "0").slice(-texto.length);
  const fim = Math.max(em + 0.5, pousaEm ?? em + 1.05);
  const p = interpolate(t, [em + 0.05, fim], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: pousa });
  const surge = prog(t, Math.min(em, apareceEm ?? em) - 0.2, 0.45);
  const posicoes = texto.split("").map((c, i) => (/\d/.test(c) ? i : -1)).filter((i) => i >= 0);
  return (
    <div
      style={{
        display: "flex",
        fontFamily: serif,
        fontWeight: 600,
        fontSize: tamanho,
        lineHeight: 1,
        color: cor.marfim,
        fontVariantNumeric: "lining-nums tabular-nums",
        opacity: surge,
      }}
    >
      {texto.split("").map((c, i) => {
        if (!/\d/.test(c)) {
          return (
            <span
              key={i}
              style={
                c === ":"
                  ? { display: "inline-block", padding: "0 0.02em", translate: "0 -0.06em", color: corSeparador }
                  : // ponto e vírgula de milhar/decimal: na linha de base dos algarismos
                    { display: "inline-block", padding: "0 0.01em", height: "1.12em", lineHeight: "1.12em", translate: "0 0.06em", color: corSeparador }
              }
            >
              {c}
            </span>
          );
        }
        const a = Number(/\d/.test(inicio[i]) ? inicio[i] : c);
        const b = Number(c);
        // hodômetro: quanto mais à direita, mais voltas (até 3)
        const ordem = posicoes.indexOf(i);
        const extra = voltas ? 10 * Math.max(0, Math.min(3, ordem)) : 0;
        const passos = ((b - a + 10) % 10) + extra;
        const sequencia = Array.from({ length: passos + 1 }, (_, k) => (a + k) % 10);
        const pos = passos * p;
        // desfoque de movimento enquanto roda (some ao pousar)
        const borrao = passos > 0 && p < 0.999 ? Math.sin(Math.PI * Math.min(1, p * 1.15)) * Math.min(5, passos * 0.9) : 0;
        if (p >= 0.999 || passos === 0) {
          // terminada a rolagem, o algarismo é desenhado simples (sem máscara nem coluna)
          return (
            <span key={i} style={{ display: "inline-block", height: "1.12em", lineHeight: "1.12em", textAlign: "center", translate: "0 0.06em" }}>
              {c}
            </span>
          );
        }
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              height: "1.12em",
              overflow: "hidden",
              maskImage: "linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%)",
            }}
          >
            <span style={{ display: "flex", flexDirection: "column", translate: `0 ${(0.06 - pos * 1.12).toFixed(4)}em`, filter: borrao > 0.2 ? `blur(${borrao.toFixed(2)}px)` : undefined }}>
              {sequencia.map((d, k) => (
                <span key={k} style={{ height: "1.12em", lineHeight: "1.12em", textAlign: "center" }}>
                  {d}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </div>
  );
};

// Rótulo de crédito: as letras se aproximam até o espaçamento final ("tracking in").
// O espaçamento de partida é limitado para o crédito nunca passar da `largura`.
export const RotuloDeCredito: React.FC<{ texto: string; em: number; tamanho?: number; style?: React.CSSProperties; largura?: number }> = ({
  texto,
  em,
  tamanho = 36,
  style,
  largura = 960,
}) => {
  const t = useTempo();
  const p = prog(t, em - 0.05, 1.1);
  const letras = [...texto].length;
  const semEspaco = larguraTexto(texto, tamanho, "sans", 0);
  const maximo = Math.max(0.34, Math.min(0.84, (largura - semEspaco) / Math.max(1, letras * tamanho)));
  const espaco = 0.34 + (maximo - 0.34) * (1 - p);
  return (
    <div
      style={{
        ...credito,
        fontSize: tamanho,
        letterSpacing: `${espaco.toFixed(3)}em`,
        // compensa o espaço depois da última letra, para o texto ficar centrado
        marginRight: `-${espaco.toFixed(3)}em`,
        opacity: p,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {texto}
    </div>
  );
};

// Cartela em tela preta: rótulo, título (dígitos que rolam), desenho e frases da narração.
// No quadro deitado (16:9) a pilha alta do vertical vira uma FILEIRA: com desenho, ele fica numa
// coluna e o texto (rótulo, título, frases) na outra, lado a lado; `lugar: "acima"` põe o desenho
// primeiro (à esquerda) e `"abaixo"` depois (à direita). Sem desenho, o texto fica numa coluna só,
// no meio da tela. Tudo dentro das margens seguras (96 px dos lados, acima dos controles do player).
const AREA = { x: 96, y: 96, w: 1920 - 2 * 96, h: 984 - 96 };
const VAO_FILEIRA = 96;
// o desenho nunca passa desta altura (px), para caber com folga no quadro de 1080
const ALTURA_MAX_DO_DESENHO = 600;

export const Cartela: React.FC<{ m: CartelaT; primeira: boolean }> = ({ m, primeira }) => {
  const t = useTempo();
  const palavras = usePalavras();
  // espera as barras fecharem; na cartela que abre o vídeo a tela já começa preta, e tempos
  // negativos valem (o que já está na tela no primeiro quadro, a capa do vídeo)
  const pronto = primeira ? m.de : m.de + 0.4;
  const piso = primeira ? -3 : pronto;
  const sai = saindo(t, m.ate, 0.4);
  const desenho = m.desenho;
  const lugar = desenho?.lugar ?? (m.titulo ? "abaixo" : "acima");
  const numerico = ehNumerico(m.titulo);
  const linhas = m.linhas ?? [];
  const temTexto = !!(m.rotulo || m.titulo || linhas.length);
  // as colunas: o desenho com a largura dele (limitada pela altura), o texto com o resto
  const larguraDesenho = desenho
    ? Math.min(LARGURA_DO_DESENHO[desenho.tipo], temTexto ? AREA.w - 900 - VAO_FILEIRA : AREA.w, ALTURA_MAX_DO_DESENHO * PROPORCAO_DO_DESENHO[desenho.tipo])
    : 0;
  const larguraColuna = desenho ? Math.min(1000, AREA.w - larguraDesenho - VAO_FILEIRA) : 1100;
  const larguraLinha = larguraColuna - 20;
  // as frases têm o mesmo corpo (o da que precisa de menos), até 84 px, e quebram em até 2 linhas
  const tamanhoLinha = Math.min(
    84,
    ...linhas.map((l) => encaixar(l.texto.split(/\s+/).filter(Boolean), { largura: larguraLinha, max: 84, min: 48, linhas: 2 }).tamanho),
  );
  const tamanhoTitulo = numerico ? Math.min(230, Math.floor(larguraColuna / (m.titulo!.length * LARGURA_ALGARISMO))) : 0;

  const blocoDesenho = desenho ? (
    <div style={{ width: larguraDesenho, flexShrink: 0 }}>
      <DesenhoDaCartela d={desenho} t={t} inicio={Math.max(piso, desenho.em ?? pronto)} fim={m.ate} hora={numerico ? m.titulo : undefined} />
    </div>
  ) : null;

  const coluna = temTexto || !desenho ? (
    <div style={{ width: larguraColuna, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      {m.rotulo ? <RotuloDeCredito texto={m.rotulo} em={Math.max(piso, m.rotuloEm ?? pronto)} largura={larguraColuna} style={{ marginBottom: m.titulo ? 26 : 34 }} /> : null}
      {m.titulo ? (
        numerico ? (
          <Digitos
            texto={m.titulo}
            de={m.contarDe}
            em={Math.max(piso, m.tituloEm ?? pronto + 0.2)}
            pousaEm={m.pousaEm}
            apareceEm={primeira ? -1 : undefined}
            tamanho={tamanhoTitulo}
          />
        ) : (
          // título de texto: entra inteiro desfocado e cada palavra ganha foco quando é dita
          <TextoEmFoco
            texto={m.titulo}
            em={Math.max(piso, m.tituloEm ?? pronto + 0.2)}
            entrada={pronto}
            limite={m.ate + 0.3}
            largura={larguraColuna}
            max={150}
            min={64}
            linhas={2}
            entrelinha={1.05}
            capa={primeira}
          />
        )
      ) : null}
      {linhas.length ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: m.titulo ? 44 : 0 }}>
          {linhas.map((l, i) => {
            const textos = l.texto.split(/\s+/).filter(Boolean);
            const proxima = linhas[i + 1]?.em ?? Infinity;
            const tempos = temposDasPalavras(palavras, Math.max(piso, l.em), textos, proxima);
            // a linha anterior recua quando a seguinte começa
            const recua = prog(t, proxima - 0.1, 0.6);
            return (
              <div key={i} style={{ opacity: 1 - 0.42 * recua }}>
                <LinhasEmFoco
                  linhas={quebrarEmLinhas(textos.map((w, k) => ({ w, em: tempos[k] })), tamanhoLinha, larguraLinha)}
                  entrada={Math.max(piso, l.em)}
                  estilo={{ fontFamily: serif, fontWeight: 600, fontSize: tamanhoLinha, lineHeight: 1.12, color: cor.marfim }}
                />
              </div>
            );
          })}
        </div>
      ) : null}
      {/* uma régua fina âmbar fecha a composição quando não há frases nem desenho */}
      {!linhas.length && !desenho ? (
        <div
          style={{
            marginTop: 40,
            height: 2,
            width: 220 * prog(t, pronto + 0.5, 1.2),
            background: cor.ambar,
            opacity: 0.7,
            fontFamily: sans,
          }}
        />
      ) : null}
    </div>
  ) : null;

  return (
    <div
      style={{
        position: "absolute",
        left: AREA.x,
        top: AREA.y,
        width: AREA.w,
        height: AREA.h,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: VAO_FILEIRA,
        opacity: 1 - sai,
        filter: sai > 0.02 ? `blur(${(sai * 6).toFixed(2)}px)` : undefined,
      }}
    >
      {lugar === "acima" ? blocoDesenho : null}
      {coluna}
      {lugar === "abaixo" ? blocoDesenho : null}
    </div>
  );
};
