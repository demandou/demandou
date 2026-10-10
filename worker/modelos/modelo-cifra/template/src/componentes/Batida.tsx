// Momento `batida`: o padrão de batida como setas (↓ baixo, ↑ cima) sobre as seis cordas.
// As setas nascem a lápis; cada uma se enche no sentido da palhetada quando é falada, e as cordas
// vibram na ordem em que a mão passa por elas (de cima para baixo na descida, ao contrário na subida).
import { prog, temposDasPalavras } from "../anim";
import { caber } from "../medida";
import type { Batida as TBatida, Palavra } from "../plano";
import { cor, fonte } from "../tema";
import { TextoFalado } from "../texto";
import type { Area } from "./Cena";

const ALTURA_SETA = 520;

const contornoSeta = (cx: number, y0: number, dir: "baixo" | "cima", h = ALTURA_SETA) => {
  const haste = 22;
  const cabeca = 68;
  const altCabeca = Math.min(124, h * 0.3);
  // seta para baixo; a de cima é espelhada
  const pts = [
    [cx - haste, 0],
    [cx + haste, 0],
    [cx + haste, h - altCabeca],
    [cx + cabeca, h - altCabeca],
    [cx, h],
    [cx - cabeca, h - altCabeca],
    [cx - haste, h - altCabeca],
  ].map(([x, y]) => [x, dir === "baixo" ? y0 + y : y0 + h - y]);
  return `M ${pts.map(([x, y]) => `${x} ${y}`).join(" L ")} Z`;
};

export const Batida: React.FC<{ m: TBatida; t: number; area: Area; palavras: Palavra[]; fim: number }> = ({ m, t, area, palavras, fim }) => {
  const setas = m.setas.slice(0, 6);
  const n = setas.length;
  const coluna = area.w / n;
  const { tempos } = temposDasPalavras(m.titulo, palavras, m.de, fim);
  // o título cabe sempre (até 2 linhas); as setas descem junto
  const encTitulo = caber(m.titulo, { largura: area.w, max: 84, min: 52, linhas: 2 });
  const alturaTitulo = encTitulo.linhas.length * encTitulo.tamanho * 1.08;
  const emCurso = setas.reduce((k, s, i) => (t >= s.em - 0.02 ? i : k), -1);

  const topoSetas = Math.round(alturaTitulo + 31);
  // os rótulos embaixo das setas: o maior corpo (44 → 30) em que todos cabem na coluna, em até 2 linhas
  const textos = setas.map((s) => s.rotulo ?? (s.dir === "baixo" ? "baixo" : "cima"));
  // um corpo só para todos (o menor dos que cabem, mas nunca abaixo de 34 por causa de um rótulo comprido:
  // esse fica menor sozinho)
  const tamanhos = textos.map((x) => caber(x, { largura: coluna - 10, max: 44, min: 30, linhas: 2, estilo: { peso: 700 } }).tamanho);
  const tamRotulo = Math.max(34, Math.min(44, ...tamanhos));
  const encRotulos = textos.map((x, i) =>
    caber(x, { largura: coluna - 10, max: Math.min(tamRotulo, tamanhos[i]), min: Math.min(tamRotulo, tamanhos[i]), linhas: 2, estilo: { peso: 700 } }),
  );
  const alturaRotulos = Math.max(...encRotulos.map((e) => e.linhas.length * e.tamanho * 1.08));
  // as setas ocupam o que sobra (até 520 px)
  const alturaSeta = Math.max(260, Math.min(ALTURA_SETA, area.h - topoSetas - 22 - alturaRotulos - 6));
  const passoCorda = (alturaSeta - 60) / 5;
  const cordasY = Array.from({ length: 6 }, (_, k) => topoSetas + 30 + k * passoCorda);

  // vibração de cada corda: soma das palhetadas recentes
  const vibracao = (k: number, x: number) => {
    let v = 0;
    for (const s of setas) {
      const ordem = s.dir === "baixo" ? k : 5 - k;
      const d = t - (s.em + ordem * 0.022);
      if (d < 0 || d > 1.2) continue;
      v += 9 * Math.exp(-d / 0.32) * Math.sin(2 * Math.PI * 7.5 * d + k) * Math.sin((Math.PI * x) / area.w);
    }
    return v;
  };

  return (
    <>
      {/* título: a lápis, cada palavra ganha tinta quando é falada */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0 }}>
        <TextoFalado enc={encTitulo} tempos={tempos} t={t} cor={cor.marfim} peso={800} alinhamento="center" />
      </div>

      <svg width={area.w} height={alturaSeta + 60} style={{ position: "absolute", left: 0, top: topoSetas - 20, overflow: "visible" }}>
        {/* as seis cordas */}
        {cordasY.map((y0, k) => {
          const y = y0 - (topoSetas - 20);
          const pontos = Array.from({ length: 49 }, (_, j) => {
            const x = (j / 48) * area.w;
            return `${x.toFixed(1)} ${(y + vibracao(k, x)).toFixed(1)}`;
          });
          return (
            <path
              key={k}
              d={`M ${pontos.join(" L ")}`}
              fill="none"
              stroke={cor.niquel}
              strokeOpacity={0.55}
              strokeWidth={2.2 + (5 - k) * 0.45}
            />
          );
        })}
        {/* setas */}
        {setas.map((s, i) => {
          const cx = coluna * (i + 0.5);
          const y0 = 20;
          const d = contornoSeta(cx, y0, s.dir, alturaSeta);
          const p = prog(t, s.em - 0.03, 0.24);
          const ativa = i === emCurso;
          const preenchida = ativa ? cor.azul : cor.marfim;
          const id = `seta-${i}-${Math.round(m.de * 100)}`;
          // a tinta entra no sentido da palhetada
          const recorteY = s.dir === "baixo" ? y0 : y0 + alturaSeta * (1 - p);
          return (
            <g key={i}>
              <defs>
                <clipPath id={id}>
                  <rect x={cx - 72} y={recorteY} width={144} height={alturaSeta * p} />
                </clipPath>
              </defs>
              <path d={d} fill={cor.palco} stroke={cor.lapisForte} strokeWidth={3} strokeDasharray="8 9" strokeLinejoin="round" />
              <path d={d} fill={preenchida} stroke={preenchida} strokeWidth={3} strokeLinejoin="round" clipPath={`url(#${id})`} />
            </g>
          );
        })}
      </svg>

      {/* baixo / cima (ou o rótulo de cada seta) */}
      {setas.map((s, i) => {
        const p = prog(t, s.em - 0.03, 0.26);
        const ativa = i === emCurso;
        const enc = encRotulos[i];
        return (
          <div
            key={`r${i}`}
            style={{
              position: "absolute",
              left: coluna * i,
              width: coluna,
              top: topoSetas + alturaSeta + 22,
              textAlign: "center",
              fontFamily: fonte,
              fontWeight: 700,
              fontSize: enc.tamanho,
              lineHeight: 1.08,
              color: p <= 0 ? cor.lapisForte : ativa ? cor.azul : cor.marfim,
            }}
          >
            {enc.linhas.map((l, k) => (
              <div key={k} style={{ whiteSpace: "nowrap" }}>
                {l.map((x) => enc.palavras[x]).join(" ")}
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
};
