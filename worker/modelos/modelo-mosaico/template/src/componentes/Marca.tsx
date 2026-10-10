import { prog } from "../anim";
import { encaixar } from "../medida";
import type { Marca as TMarca } from "../plano";
import { display, rotulo } from "../tema";
import { F_ROTULO, F_TITULO, respiro, type PropsBloco } from "./comum";

// Assinatura: nome e área de quem fala (campo `marca` do plano), como a assinatura de uma coluna de
// revista — a área em caixa alta, um filete que se desenha e o nome grande, assentado embaixo.
export const Marca: React.FC<PropsBloco<TMarca>> = ({ b, t, w, h, util, pal, janela, marca }) => {
  const pad = respiro(w, h);
  const interna = w - 2 * pad;
  const alto = Math.min(h, util);
  if (!marca.nome) return null;
  const nome = encaixar(marca.nome, { largura: interna, altura: alto * 0.5, max: 104, min: 44, linhas: 2, fonte: F_TITULO, entrelinha: 1.02 });
  const area = marca.area ? encaixar(marca.area, { largura: interna, max: 34, min: 30, linhas: 2, fonte: F_ROTULO, entrelinha: 1.25, equilibrado: false }) : null;
  const de = b.em ?? janela.de + 0.15;
  const pNome = prog(t, de, 0.5);
  const pLinha = prog(t, de + 0.15, 0.6);
  const pArea = prog(t, de + 0.3, 0.5);
  return (
    <div style={{ position: "absolute", left: pad, top: pad, width: interna, height: alto - 2 * pad, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 20 }}>
      {area ? (
        <div style={{ ...rotulo, fontSize: area.tamanho, color: pal.acento, lineHeight: 1.25, opacity: pArea }}>
          {area.linhas.map((l, i) => (
            <div key={i} style={{ whiteSpace: "nowrap" }}>
              {l}
            </div>
          ))}
        </div>
      ) : null}
      <div style={{ height: 3, width: `${pLinha * 100}%`, background: pal.suave, opacity: 0.5 }} />
      <div style={{ fontFamily: display, fontWeight: 700, fontSize: nome.tamanho, lineHeight: 1.02, color: pal.texto, letterSpacing: "-0.025em", opacity: pNome, translate: pNome < 0.999 ? `${(1 - pNome) * -24}px 0` : undefined }}>
        {nome.linhas.map((l, i) => (
          <div key={i} style={{ whiteSpace: "nowrap" }}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};
