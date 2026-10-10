// Abertura: o visor liga e a detecção de rosto acha a pessoa (moldura branca fina em volta do
// rosto, nunca por cima dele); o título se monta palavra por palavra num rótulo de vidro no peito.
import { Palavras, normalizar, prog, saindo, temposDoTexto } from "../anim";
import type { Abertura as TipoAbertura, Palavra } from "../plano";
import { cor, mono, sans } from "../tema";
import { TITULO, encaixar } from "../medida";
import { vidro } from "./Etiqueta";

// Moldura de canto em volta do rosto (detecção de rosto / quadrado de foco)
export const Moldura: React.FC<{ cx: number; cy: number; lado: number; corTraco: string; espessura?: number; braco?: number; opacidade?: number }> = ({
  cx,
  cy,
  lado,
  corTraco,
  espessura = 3.5,
  braco,
  opacidade = 1,
}) => {
  const h = lado / 2;
  const a = braco ?? lado * 0.16;
  const [x0, y0, x1, y1] = [cx - h, cy - h, cx + h, cy + h];
  const d = [
    `M ${x0} ${y0 + a} L ${x0} ${y0} L ${x0 + a} ${y0}`,
    `M ${x1 - a} ${y0} L ${x1} ${y0} L ${x1} ${y0 + a}`,
    `M ${x1} ${y1 - a} L ${x1} ${y1} L ${x1 - a} ${y1}`,
    `M ${x0 + a} ${y1} L ${x0} ${y1} L ${x0} ${y1 - a}`,
  ].join(" ");
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: opacidade, filter: "drop-shadow(0 0 3px rgba(0,0,0,0.45))" }}>
      <path d={d} fill="none" stroke={corTraco} strokeWidth={espessura} strokeLinecap="square" />
    </svg>
  );
};

export const Abertura: React.FC<{
  m: TipoAbertura;
  t: number;
  fim: number;
  palavras: Palavra[];
  rosto: { x: number; y: number; lado: number };
  // borda de baixo do rótulo (px)
  base: number;
}> = ({ m, t, fim, palavras, rosto, base }) => {
  // `linhas` (escritas à mão) mandam; senão o `texto` é quebrado em até 3 linhas e reduzido até caber
  const q = m.linhas ? null : encaixar(m.texto ?? "", { largura: 952 - 68, max: 86, min: 54, linhas: 3, estilo: () => TITULO });
  const linhas = m.linhas ?? q!.linhas.map((l) => l.map((w) => w.w).join(" "));
  const tamanho = q ? q.tamanho : 86;
  const texto = linhas.join(" ");
  const tempos = temposDoTexto(texto, palavras, m.de, fim, m.em ?? m.de);
  const sai = saindo(t, fim, 0.3);
  const entra = prog(t, Math.max(0, tempos[0] - 0.2), 0.4);
  // detecção de rosto: entra larga e fecha no rosto na primeira palavra
  const acha = prog(t, Math.max(0.1, tempos[0] - 0.05), 0.45);
  const piscando = acha < 1 ? (Math.floor(t * 12) % 2 === 0 ? 1 : 0.55) : 1;
  // `destaque` pode ser uma palavra ou um trecho: as palavras seguidas que casam ganham o acento
  const alvo = m.destaque ? m.destaque.split(/\s+/).map(normalizar) : [];
  const todas = texto.split(/\s+/).map(normalizar);
  const acesas = new Set<number>();
  for (let i = 0; alvo.length && i + alvo.length <= todas.length; i++) if (alvo.every((a, j) => todas[i + j] === a)) alvo.forEach((_, j) => acesas.add(i + j));
  let k = 0;
  return (
    <>
      <Moldura cx={rosto.x} cy={rosto.y} lado={rosto.lado * (1.22 - 0.22 * acha)} corTraco={cor.branco} opacidade={acha * piscando * (1 - sai)} espessura={3} />
      <div
        style={{
          position: "absolute",
          left: 64,
          bottom: 1920 - base,
          maxWidth: 952,
          padding: "22px 34px 28px",
          opacity: entra * (1 - sai),
          translate: `0 ${(1 - entra) * 30 - sai * 14}px`,
          ...vidro,
        }}
      >
        {m.rotulo ? (
          <div style={{ fontFamily: mono, fontWeight: 600, fontSize: 32, letterSpacing: "0.14em", color: cor.acento, marginBottom: 8 }}>{m.rotulo.toUpperCase()}</div>
        ) : null}
        {linhas.map((linha, i) => {
          const n = linha.split(/\s+/).filter(Boolean).length;
          const ts = tempos.slice(k, k + n);
          const base0 = k;
          k += n;
          return (
            <Palavras
              key={`${linha}-${i}`}
              texto={linha}
              tempos={ts}
              t={t}
              esboco={cor.lapis}
              corDe={(j) => (acesas.has(base0 + j) ? cor.acento : undefined)}
              style={{ fontFamily: sans, fontWeight: 700, fontSize: tamanho, lineHeight: 1.06, color: cor.branco, letterSpacing: "-0.015em" }}
            />
          );
        })}
      </div>
    </>
  );
};
