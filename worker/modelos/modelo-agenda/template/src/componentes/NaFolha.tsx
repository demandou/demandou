// Peças comuns dos blocos universais que acontecem na folha da agenda: a entrada e a saída (que
// cruzam com a pessoa mudando de lugar), o título do momento e o bloco que cai no seu lugar a lápis.
import { assenta, Linhas, prog, temposDoTexto } from "../anim";
import { type Agenda, cortinaNoTempo, type entradaESaida, recorteDaCortina } from "../agenda";
import type { Ret } from "../anim";
import { encaixar } from "../medida";
import type { Palavra } from "../plano";
import { type Categoria, CATEGORIAS, cor, RAIO_BLOCO, sans } from "../tema";

export type EntradaESaida = ReturnType<typeof entradaESaida>;

// Entrada e saída do conteúdo de um momento na folha (ver `entradaESaida` e a cortina em agenda.ts)
export const NaFolha: React.FC<{ t: number; es: EntradaESaida; ag: Agenda; children: React.ReactNode }> = ({ t, es, ag, children }) => {
  const p = prog(t, es.entra, es.durEntra);
  const s = prog(t, es.sai - es.durSai, es.durSai);
  if (p <= 0 || s >= 1) return null;
  const c = cortinaNoTempo(ag, t);
  const papel = c ? (c.entrando === es.i ? "entra" : c.saindo === es.i ? "sai" : null) : null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        fontFamily: sans,
        opacity: Math.min(p, 1 - s),
        translate: es.deslizar ? `0 ${(1 - p) * 46 - s * 30}px` : undefined,
        clipPath: recorteDaCortina(c, papel),
      }}
    >
      {children}
    </div>
  );
};

// A linha do "agora" que varre a folha na cortina (a mesma marcação vermelha das agendas)
export const LinhaDaCortina: React.FC<{ ag: Agenda; t: number }> = ({ ag, t }) => {
  const c = cortinaNoTempo(ag, t);
  if (!c) return null;
  const o = Math.min(1, c.q / 0.08, (1 - c.q) / 0.08);
  return (
    <div style={{ position: "absolute", left: 52, width: 976, top: c.y - 3, height: 6, opacity: o }}>
      <div style={{ position: "absolute", left: 14, right: 0, top: 0, height: 6, borderRadius: 3, background: cor.foco }} />
      <div style={{ position: "absolute", left: 0, top: -9, width: 24, height: 24, borderRadius: 12, background: cor.foco }} />
    </div>
  );
};

// O título do momento, no alto da área, montado na fala (a lápis antes)
export const layoutTitulo = (titulo: string | undefined, area: Ret) => {
  if (!titulo?.trim()) return null;
  // coluna estreita (pessoa na raia): o título pode ir a 3 linhas
  const e = encaixar(titulo, { largura: area.w, max: 66, min: 44, linhas: area.w < 700 ? 3 : 2, entrelinha: 1.06 });
  return { ...e, altura: e.linhas.length * e.tamanho * 1.06 };
};

export const TituloDoMomento: React.FC<{ titulo?: string; area: Ret; t: number; palavras: Palavra[]; de: number; ate: number }> = ({ titulo, area, t, palavras, de, ate }) => {
  const l = layoutTitulo(titulo, area);
  if (!l || !titulo) return null;
  const tempos = temposDoTexto(titulo, palavras, de - 0.3, ate, de);
  return (
    <div style={{ position: "absolute", left: area.x, top: area.y }}>
      <Linhas linhas={l.linhas} tempos={tempos} t={t} tamanho={l.tamanho} esboco={cor.esboco} cor={cor.tinta} />
    </div>
  );
};

// Um bloco que espera a lápis (contorno tracejado) e, em `em`, cai no lugar: vem de um pouco acima e
// maior, com sombra alta, e assenta no tamanho certo com sombra baixa (a queda dos blocos de tempo).
export const BlocoQueCai: React.FC<{
  r: Ret;
  em: number;
  t: number;
  categoria: Categoria;
  // tom do bloco depois de cair (o item da vez fica tomate; os anteriores, na cor da categoria)
  ativo?: number;
  esbocoDe?: number;
  apagado?: number;
  children?: React.ReactNode;
  // conteúdo do lugar a lápis (ex.: o número do item)
  lapis?: React.ReactNode;
}> = ({ r, em, t, categoria, ativo = 0, esbocoDe = -10, apagado = 0, children, lapis }) => {
  const queda = prog(t, em - 0.06, 0.42, assenta);
  const entrou = prog(t, em - 0.06, 0.14);
  const esboco = (1 - prog(t, em + 0.2, 0.25)) * prog(t, esbocoDe, 0.3);
  const cat = CATEGORIAS[categoria];
  const foco = CATEGORIAS.foco;
  const raio = Math.min(RAIO_BLOCO, r.h / 2);
  const fundo = ativo > 0.5 ? foco.fundo : cat.fundo;
  const faixa = ativo > 0.5 || cat.solido ? null : cat.forte;
  return (
    <>
      {esboco > 0.01 ? (
        <div
          style={{
            position: "absolute",
            left: r.x,
            top: r.y,
            width: r.w,
            height: r.h,
            borderRadius: raio,
            border: `3px dashed ${cor.esboco}`,
            background: "rgba(188,195,207,0.10)",
            opacity: esboco,
            boxSizing: "border-box",
          }}
        >
          {lapis}
        </div>
      ) : null}
      {t >= em - 0.06 ? (
        <div
          style={{
            position: "absolute",
            left: r.x,
            top: r.y - (1 - queda) * 46,
            width: r.w,
            height: r.h,
            borderRadius: raio,
            background: fundo,
            overflow: "hidden",
            opacity: entrou * (1 - apagado * 0.55),
            scale: String(1 + (1 - queda) * 0.06),
            boxShadow: `0 ${4 + (1 - queda) * 26}px ${10 + (1 - queda) * 40}px rgba(20,26,40,${0.1 + (1 - queda) * 0.16})`,
          }}
        >
          {faixa ? <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 12, background: faixa }} /> : null}
          {children}
        </div>
      ) : null}
    </>
  );
};

// cor do texto dentro de um bloco (tomate cheio = branco)
export const tintaDoBloco = (categoria: Categoria, ativo: number) => (ativo > 0.5 || CATEGORIAS[categoria].solido ? "#FFFFFF" : CATEGORIAS[categoria].texto);
