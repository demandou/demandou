import { aPartirDe, DatiloFalado, prog, saindo, temposDoTexto } from "../anim";
import { encaixarBloco, trechoNoTexto } from "../medida";
import type { Frase as TFrase, Palavra } from "../plano";
import { cor, QUADRO, sans, sombraTexto } from "../tema";
import { topoDoVeu, Veu } from "./Veu";

// Citação de documentário: aspas vermelhas e a frase datilografada palavra por palavra sobre a
// imagem, na altura do peito. `destaque` = tarja vermelha; `risco` = rasura vermelha que corre
// pelas palavras quando elas são ditas (a correção à mão no documento).
export const Frase: React.FC<{
  m: TFrase;
  t: number;
  fim: number;
  area: { x: number; y: number; w: number; h: number };
  palavras: Palavra[];
}> = ({ m, t, fim, area, palavras }) => {
  const sai = saindo(t, fim - 0.12, 0.22);
  const entra = prog(t, m.de, 0.4);
  const inicio = m.em ?? m.de;
  const aspas = 120;
  const largura = area.w - (m.destaque ? 36 : 0);
  const alturaTexto = area.h - aspas * 0.62;
  const fit = encaixarBloco(m.texto, { largura, altura: alturaTexto, max: 88, min: 54, maxLinhas: 4, entrelinha: 1.06, fonte: { peso: 800 } });
  const tempos = aPartirDe(temposDoTexto(m.texto, palavras, m.de, m.ate, inicio), m.de + 0.05);
  const risco = trechoNoTexto(m.texto, m.risco);
  const riscoEm = m.riscoEm ?? (risco ? tempos[risco[0]] : 0);
  return (
    <>
      <Veu topo={topoDoVeu(area)} opacidade={entra * (1 - sai)} />
      <div
        style={{
          position: "absolute",
          left: area.x,
          width: area.w,
          bottom: QUADRO.h - (area.y + area.h),
          opacity: 1 - sai,
          translate: `0 ${sai * 20}px`,
          textShadow: sombraTexto,
        }}
      >
        <div
          style={{
            fontFamily: sans,
            fontWeight: 800,
            fontSize: aspas,
            lineHeight: 0.62,
            height: aspas * 0.5,
            color: cor.vermelho,
            textShadow: "none",
            opacity: entra,
            translate: `${(1 - entra) * -20}px 0`,
          }}
        >
          “
        </div>
        <DatiloFalado
          texto={m.texto}
          linhas={fit.linhas}
          tempos={tempos}
          t={t}
          enfase={m.destaque}
          tarja
          risco={risco}
          riscoEm={riscoEm}
          style={{ fontFamily: sans, fontWeight: 800, fontSize: fit.tamanho, lineHeight: 1.06, color: cor.claro }}
        />
      </div>
    </>
  );
};
