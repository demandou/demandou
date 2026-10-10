import { foco, prog, temposDasPalavras, travelling, useTempo, usePalavras } from "../anim";
import { encaixar, indicesDoTrecho } from "../medida";
import type { Creditos as CreditosT, Cta, Plano } from "../plano";
import { cor, serif, sombra } from "../tema";
import { RotuloDeCredito } from "./Cartela";
import { LinhasEmFoco } from "./Foco";

type Icones = NonNullable<CreditosT["icone"]>;

// Ícones a traço da chamada final (âmbar, sem preenchimento).
const Icone: React.FC<{ tipo: Icones; p: number; tamanho?: number }> = ({ tipo, p, tamanho = 72 }) => {
  const traco = { pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - p, fill: "none", stroke: cor.ambar, strokeWidth: tamanho > 72 ? 2.4 : 3.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 48 48" width={tamanho} height={tamanho}>
      {tipo === "seguir" ? (
        <>
          <circle cx={20} cy={16} r={7.5} {...traco} />
          <path d="M6 40 C6 30 12 26 20 26 C28 26 34 30 34 40" {...traco} />
          <path d="M39 13 L39 25 M33 19 L45 19" {...traco} />
        </>
      ) : null}
      {tipo === "salvar" ? <path d="M13 6 L35 6 L35 42 L24 33 L13 42 Z" {...traco} /> : null}
      {tipo === "comentar" ? <path d="M8 10 L40 10 L40 32 L22 32 L13 40 L13 32 L8 32 Z" {...traco} /> : null}
      {tipo === "link" ? <path d="M14 34 L34 14 M20 14 L34 14 L34 28" {...traco} /> : null}
    </svg>
  );
};

const ICONES: Icones[] = ["seguir", "salvar", "comentar", "link"];

// Créditos finais (o `cta` deste modelo): a assinatura na barra de cima (como crédito de filme) e
// a chamada na barra de baixo, palavra por palavra, com o ícone da ação se desenhando embaixo.
// `destaque` = trecho em itálico âmbar.
export const Creditos: React.FC<{ m: CreditosT | Cta; marca: Plano["marca"]; topoJanela: number; centro: number }> = ({ m, marca, topoJanela, centro }) => {
  const t = useTempo();
  const palavras = usePalavras();
  const textos = m.texto.split(/\s+/).filter(Boolean);
  const inicio = m.em ?? m.de;
  const tempos = temposDasPalavras(palavras, inicio, textos);
  const destacadas = indicesDoTrecho(textos, m.destaque);
  // até ~44 caracteres cabem em duas linhas grandes; mais que isso, a letra diminui (medida)
  const enc = encaixar(textos, { largura: 900, max: 72, min: 50, linhas: 2, fonteDe: (i) => (destacadas.has(i) ? "italico500" : "serif") });
  const tamanho = enc.tamanho;
  const linhas = enc.linhas.map((l) => l.map((i) => ({ w: textos[i], em: tempos[i] })));
  const nome = prog(t, m.de + 0.35, 1.2, travelling);
  // a régua e o ícone entram cedo, para estarem inteiros antes do fim do vídeo
  const ultima = Math.min(tempos[tempos.length - 1] ?? inicio, inicio + 0.8);
  const regua = prog(t, ultima + 0.1, 0.8, travelling);
  // assinatura no meio da parte visível da barra de cima (os ~200 px do topo ficam sob o app)
  const alturaDaBarra = Math.max(0, topoJanela - 200);
  const cabe = alturaDaBarra > 150;
  // sem assinatura (nome não informado), o ícone da ação ocupa a barra de cima, grande
  const iconeEmCima = !marca.nome && cabe;
  const icone: Icones = m.icone && ICONES.includes(m.icone) ? m.icone : "seguir";
  // o nome cabe sempre numa linha (nomes longos diminuem)
  const tamanhoNome = marca.nome ? Math.min(96, encaixar(marca.nome.split(/\s+/).filter(Boolean), { largura: 940, max: 96, min: 40, linhas: 1 }).tamanho) : 96;

  return (
    <>
      {iconeEmCima ? (
        <div
          style={{
            position: "absolute",
            left: 60,
            right: 60,
            top: 200 + alturaDaBarra / 2,
            translate: "0 -50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 30,
          }}
        >
          <div style={{ height: 2, width: 160 * regua, background: cor.ambar, opacity: 0.7 }} />
          <Icone tipo={icone} p={prog(t, m.de + 0.3, 1.0, travelling)} tamanho={Math.min(120, alturaDaBarra - 60)} />
          <div style={{ height: 2, width: 160 * regua, background: cor.ambar, opacity: 0.7 }} />
        </div>
      ) : null}
      {marca.nome && cabe ? (
        <div
          style={{
            position: "absolute",
            left: 60,
            right: 60,
            top: 200 + alturaDaBarra / 2,
            translate: "0 -50%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}
        >
          {marca.area ? <RotuloDeCredito texto={marca.area} em={m.de + 0.2} tamanho={32} /> : null}
          <div style={{ fontFamily: serif, fontWeight: 600, fontSize: tamanhoNome, lineHeight: 1, color: cor.marfim, whiteSpace: "nowrap", ...foco(nome, 10, 12) }}>{marca.nome}</div>
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          top: centro,
          translate: "0 -50%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 26,
        }}
      >
        <LinhasEmFoco
          linhas={linhas}
          entrada={m.de + 0.12}
          estilo={{ fontFamily: serif, fontWeight: 600, fontSize: tamanho, lineHeight: 1.14, color: cor.marfim, textShadow: sombra }}
          estiloPalavra={(_, i) => (destacadas.has(i) ? { fontStyle: "italic", fontWeight: 500, color: cor.ambarClaro } : undefined)}
        />
        {iconeEmCima ? (
          <div style={{ height: 2, width: 220 * regua, background: cor.ambar, opacity: 0.7 }} />
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <div style={{ height: 2, width: 120 * regua, background: cor.ambar, opacity: 0.7 }} />
            <Icone tipo={icone} p={prog(t, ultima + 0.2, 0.8, travelling)} />
            <div style={{ height: 2, width: 120 * regua, background: cor.ambar, opacity: 0.7 }} />
          </div>
        )}
      </div>
    </>
  );
};
