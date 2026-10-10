// Embaixo do relógio grande: o título se monta palavra por palavra e uma régua das cinco zonas
// (rótulos das pontas livres: "leve" → "máximo", "baixo" → "alto", "seguro" → "arriscado") acende
// junto com o anel do relógio.
import { Linhas, prog, temposDoTexto } from "../anim";
import { peDoRelogio, RELOGIO } from "../layout";
import { encaixar } from "../medida";
import type { Palavra, Zonas as ZonasT } from "../plano";
import { temposDasZonas } from "../relogio";
import { CONTEUDO, cor, mostrador, sans, ZONAS } from "../tema";

export const Zonas: React.FC<{ m: ZonasT; t: number; palavras: Palavra[] }> = ({ m, t, palavras }) => {
  const tempos = temposDoTexto(m.titulo, palavras, m.de, m.ate, m.de + 0.2);
  const escala = m.escala === null ? null : (m.escala ?? ["baixo", "alto"]);
  const topo = peDoRelogio(RELOGIO) + 40;
  // título: até 2 linhas; com régua, sobra menos lugar
  const espaco = 1520 - topo - (escala ? 26 + 20 + 10 + 40 : 0);
  const enc = encaixar(m.titulo, { largura: CONTEUDO.w, max: 92, min: 56, linhas: 2 });
  let tamanho = enc.tamanho;
  let linhas = enc.linhas;
  while (linhas.length * Math.round(tamanho * 1.08) > espaco && tamanho > 48) {
    tamanho -= 4;
    linhas = encaixar(m.titulo, { largura: CONTEUDO.w, max: tamanho, min: tamanho, linhas: 2 }).linhas;
  }
  const alturaLinha = Math.round(tamanho * 1.08);
  const acende = temposDasZonas(m).map((tz) => prog(t, tz, 0.3));
  const topoRegua = topo + linhas.length * alturaLinha + 26;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Linhas
        linhas={linhas}
        tempos={tempos}
        t={t}
        x={CONTEUDO.x}
        y={topo}
        largura={CONTEUDO.w}
        alturaLinha={alturaLinha}
        alinhar="center"
        estilo={{ fontFamily: mostrador, fontWeight: 700, fontSize: tamanho, color: cor.tinta, letterSpacing: "-0.01em" }}
        esboco={cor.esboco}
      />
      {escala ? (
        <div style={{ position: "absolute", left: 220, width: 640, top: topoRegua, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 8, height: 20 }}>
            {ZONAS.map((z, i) => (
              <div key={i} style={{ flex: 1, position: "relative", borderRadius: 10, border: `3px dashed ${cor.esboco}` }}>
                <div style={{ position: "absolute", inset: -3, borderRadius: 10, background: z.cor, opacity: acende[i], scale: `${0.4 + 0.6 * acende[i]} 1`, transformOrigin: "left" }} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: sans, fontWeight: 700, fontSize: 34, lineHeight: "40px", whiteSpace: "nowrap" }}>
            <span style={{ color: acende[0] > 0.5 ? cor.tintaSuave : cor.esbocoTexto }}>{escala[0]}</span>
            <span style={{ color: acende[4] > 0.5 ? cor.tintaSuave : cor.esbocoTexto }}>{escala[1]}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
};
