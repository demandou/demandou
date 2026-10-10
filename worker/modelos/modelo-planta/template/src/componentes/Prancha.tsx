import { AbsoluteFill } from "remotion";
import { Palavras, preciso, prog, temposDoTexto, Traco } from "../anim";
import { circ, lin } from "../desenho/geometria";
import type { Palavra } from "../plano";
import { cor, MARGEM, mono, ROTULO, sans, traco } from "../tema";
import { encaixar } from "../texto";

// O papel da prancheta, com a grade milimetrada bem leve.
export const Papel: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: cor.papel }}>
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <pattern id="grade-fina" x={MARGEM} y={MARGEM} width={30} height={30} patternUnits="userSpaceOnUse">
          <path d="M30 0H0V30" fill="none" stroke={cor.grade} strokeWidth={1} />
        </pattern>
        <pattern id="grade-forte" x={MARGEM} y={MARGEM} width={150} height={150} patternUnits="userSpaceOnUse">
          <rect width={150} height={150} fill="url(#grade-fina)" />
          <path d="M150 0H0V150" fill="none" stroke={cor.gradeForte} strokeWidth={1} />
        </pattern>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#grade-forte)" />
    </svg>
  </AbsoluteFill>
);

// Número de prancha num círculo (01, 02…), como a chamada de vista num desenho técnico
export const NumeroCirculo: React.FC<{ n: string; p: number; tamanho?: number; corTraco?: string }> = ({ n, p, tamanho = 72, corTraco = cor.acento }) => {
  const r = tamanho / 2 - 3;
  return (
    <div style={{ position: "relative", width: tamanho, height: tamanho, flexShrink: 0 }}>
      <svg width={tamanho} height={tamanho} style={{ position: "absolute", inset: 0 }}>
        <Traco d={circ(tamanho / 2, tamanho / 2, r)} p={p} cor={corTraco} largura={traco.medio} />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: mono,
          fontWeight: 500,
          fontSize: Math.max(ROTULO, tamanho * 0.4),
          color: corTraco,
          opacity: Math.min(1, Math.max(0, (p - 0.35) * 2)),
        }}
      >
        {n}
      </div>
    </div>
  );
};

// Tamanhos do cabeçalho, medidos com as larguras da Sora: título até 2 linhas e nunca abaixo de 56 px
// (quebra antes de encolher), subtítulo até 2 linhas e nunca abaixo de 36 px
const RECUO_NUMERO = 72 + 24;
const medidasCabecalho = (c: { numero?: string; titulo?: string; subtitulo?: string }, largura: number, tamanho: number) => {
  const recuo = c.numero ? RECUO_NUMERO : 0;
  // uma linha só enquanto der para ficar com 64 px ou mais; senão, quebra em duas
  const fonte = { peso: 400 as const, espacamento: -0.015 };
  const umaLinha = c.titulo ? encaixar(c.titulo, { largura: largura - recuo, max: tamanho, min: Math.min(tamanho, 64), linhas: 1, fonte }) : null;
  const t = !c.titulo
    ? { tamanho, linhas: [] as string[] }
    : umaLinha && umaLinha.linhas.length === 1
      ? umaLinha
      : encaixar(c.titulo, { largura: largura - recuo, max: tamanho, min: Math.min(tamanho, 56), linhas: 2, fonte });
  const tamTitulo = t.tamanho;
  // subtítulo: no corpo cheio (2/3 do título) em até 2 linhas; só encolhe (até 36 px) se não couber
  const tamSubMax = Math.max(40, Math.round(tamTitulo * 0.66));
  const subCheio = c.subtitulo ? encaixar(c.subtitulo, { largura, max: tamSubMax, min: tamSubMax, linhas: 2, fonte: { peso: 300 } }) : null;
  const s = !c.subtitulo
    ? { tamanho: 40, linhas: [] as string[] }
    : subCheio && subCheio.linhas.length <= 2 && subCheio.tamanho === tamSubMax
      ? subCheio
      : encaixar(c.subtitulo, { largura, max: tamSubMax, min: 36, linhas: 2, fonte: { peso: 300 } });
  const altura =
    Math.max(c.numero ? 72 : 0, t.linhas.length * tamTitulo * 1.08) + 30 + (c.subtitulo ? 8 + s.linhas.length * s.tamanho * 1.15 : 0) + 28;
  return { tamTitulo, tamSub: s.tamanho, altura };
};

// Altura que o cabeçalho ocupa (para o componente reservar o espaço antes do desenho)
export const alturaCabecalho = (c: { numero?: string; titulo?: string; subtitulo?: string }, largura: number, tamanho: number) =>
  c.numero || c.titulo ? medidasCabecalho(c, largura, tamanho).altura : 0;

// Cabeçalho de uma vista na prancha: ① + título + régua fina + subtítulo. O texto entra "a lápis"
// junto com a prancha e cada palavra é passada a nanquim quando é falada.
export const Cabecalho: React.FC<{
  t: number;
  de: number;
  ate: number;
  palavras: Palavra[];
  numero?: string;
  titulo?: string;
  subtitulo?: string;
  largura: number;
  tamanho?: number;
}> = ({ t, de, ate, palavras, numero, titulo, subtitulo, largura, tamanho = 68 }) => {
  const pNum = prog(t, de + 0.05, 0.5, preciso);
  const { tamTitulo, tamSub } = medidasCabecalho({ numero, titulo, subtitulo }, largura, tamanho);
  const temposT = titulo ? temposDoTexto(titulo, palavras, de, ate, de + 0.2) : [];
  const ultimoT = temposT[temposT.length - 1] ?? de;
  const temposS = subtitulo ? temposDoTexto(subtitulo, palavras, ultimoT + 0.3, ate, ultimoT + 0.25) : [];
  const pRegua = prog(t, de + 0.15, 0.7, preciso);
  const lapis = { de: de - 0.2, corLapis: cor.rascunho, corTinta: cor.grafite };
  return (
    <div style={{ width: largura }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 24 }}>
        {numero ? <NumeroCirculo n={numero} p={pNum} /> : null}
        {titulo ? (
          <Palavras
            texto={titulo}
            tempos={temposT}
            t={t}
            rascunho={lapis}
            style={{
              flex: 1,
              minWidth: 0,
              paddingTop: numero ? Math.max(0, (72 - tamTitulo * 1.08) / 2) : 0,
              fontFamily: sans,
              fontWeight: 400,
              fontSize: tamTitulo,
              lineHeight: 1.08,
              letterSpacing: "-0.015em",
            }}
          />
        ) : null}
      </div>
      <svg width={largura} height={16} style={{ display: "block", marginTop: 14 }}>
        <Traco d={lin(0, 8, largura, 8)} p={pRegua} cor={cor.grafite} largura={traco.fino} />
      </svg>
      {subtitulo ? (
        <Palavras
          texto={subtitulo}
          tempos={temposS}
          t={t}
          rascunho={lapis}
          style={{ marginTop: 8, fontFamily: sans, fontWeight: 300, fontSize: tamSub, lineHeight: 1.15 }}
        />
      ) : null}
    </div>
  );
};
