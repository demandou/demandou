import { Palavras, preciso, prog, temposDoTexto, Traco } from "../anim";
import { lin } from "../desenho/geometria";
import type { Cta as TCta, Palavra, Plano } from "../plano";
import { cor, rotuloMono, sans, traco } from "../tema";
import { encaixar, juntarTrecho, larguraTexto } from "../texto";
import { alturaMax, type AreaCartao, colocar } from "./Cartoes";
import { Cartao } from "./Cartao";
import { IconeTraco } from "./Icones";

const PAD = 40;
const ICONE = 92;

const medir = (m: TCta, marca: Plano["marca"], largura: number, maxAltura = 9999) => {
  const interna = largura - 2 * PAD - ICONE - 30;
  let max = 72;
  const fit = () => encaixar(juntarTrecho(m.texto, m.destaque), { largura: interna * (m.destaque ? 0.96 : 1), max, min: 48, linhas: 2, fonte: { peso: 400, espacamento: -0.02 } });
  let tx = fit();
  const altura = () => {
    const tamDetalhe = Math.min(42, Math.round(tx.tamanho * 0.62));
    const chamada = PAD + Math.max(ICONE, tx.linhas.length * tx.tamanho * 1.08 + (m.detalhe ? tamDetalhe * 1.3 : 0)) + PAD;
    return { chamada, total: chamada + (marca.nome ? 166 : 0), tamDetalhe };
  };
  while (altura().total > maxAltura && max > 48) {
    max -= 4;
    tx = fit();
  }
  return { tx, interna, ...altura() };
};

// Fechamento em forma de carimbo de prancha: a chamada no alto (palavra por palavra, com o `destaque`
// em terracota), autor e área nas células de baixo.
export const Cta: React.FC<{ m: TCta; marca: Plano["marca"]; palavras: Palavra[]; t: number; fim: number; area: AreaCartao }> = ({ m, marca, palavras, t, fim, area }) => {
  const { tx, interna, chamada: alturaChamada, total: h, tamDetalhe } = medir(m, marca, area.w, alturaMax(area));
  const y = colocar(area, h);
  const emTexto = m.em ?? m.de + 0.2;
  const tempos = temposDoTexto(m.texto, palavras, emTexto, m.ate, emTexto + 0.05);
  const ultimo = tempos[tempos.length - 1] ?? emTexto;
  const pIcone = prog(t, m.de + 0.3, 0.9, preciso);
  const pDetalhe = prog(t, Math.max(m.de + 0.45, ultimo + 0.2), 0.5);
  const pDivisaoH = prog(t, m.de + 0.45, 0.6, preciso);
  const pDivisaoV = prog(t, m.de + 0.8, 0.4, preciso);
  const pMarca = prog(t, m.de + 0.75, 0.5);
  const meio = area.w * 0.46;
  const temMarca = !!marca.nome;
  const tamNome = (() => {
    let s = 44;
    while (s > 32 && larguraTexto(marca.nome, s, { peso: 400 }) > meio - PAD - 20) s -= 2;
    return s;
  })();
  const altTexto = tx.linhas.length * tx.tamanho * 1.08 + (m.detalhe ? tamDetalhe * 1.3 : 0);

  return (
    <Cartao t={t} de={m.de} fim={fim} x={area.x} y={y} w={area.w} h={h}>
      <div style={{ position: "absolute", left: PAD, top: PAD, display: "flex", alignItems: "center", gap: 30, height: alturaChamada - 2 * PAD }}>
        <IconeTraco nome={m.icone ?? "seguir"} p={pIcone} tamanho={ICONE} cor={cor.acento} />
        <div style={{ width: interna, height: altTexto }}>
          <Palavras
            texto={m.texto}
            tempos={tempos}
            t={t}
            enfase={m.destaque}
            corEnfase={cor.acento}
            pesoEnfase={600}
            style={{ width: interna, fontFamily: sans, fontWeight: 400, fontSize: tx.tamanho, lineHeight: 1.08, color: cor.grafite, letterSpacing: "-0.02em" }}
          />
          {m.detalhe ? (
            <div
              style={{
                fontFamily: sans,
                fontWeight: 300,
                fontSize: tamDetalhe,
                lineHeight: 1.2,
                color: cor.cinza,
                opacity: pDetalhe,
                translate: `${(1 - pDetalhe) * -24}px 0`,
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              {m.detalhe}
            </div>
          ) : null}
        </div>
      </div>
      {temMarca ? (
        <>
          <svg width={area.w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
            <Traco d={lin(0, alturaChamada, area.w, alturaChamada)} p={pDivisaoH} cor={cor.grafite} largura={traco.medio} />
            {marca.area ? <Traco d={lin(meio, alturaChamada, meio, h)} p={pDivisaoV} cor={cor.grafite} largura={traco.fino} /> : null}
          </svg>
          <div style={{ position: "absolute", left: PAD, top: alturaChamada + 26, width: meio - PAD - 20, opacity: pMarca }}>
            <div style={{ ...rotuloMono, color: cor.cinza }}>Autor</div>
            <div style={{ fontFamily: sans, fontWeight: 400, fontSize: tamNome, lineHeight: 1.1, color: cor.grafite, marginTop: 14, whiteSpace: "nowrap" }}>{marca.nome}</div>
          </div>
          {marca.area ? (
            <div style={{ position: "absolute", left: meio + 30, top: alturaChamada + 26, width: area.w - meio - 30 - PAD, opacity: prog(t, m.de + 0.95, 0.5) }}>
              <div style={{ ...rotuloMono, color: cor.cinza }}>Área</div>
              <div style={{ fontFamily: sans, fontWeight: 300, fontSize: 38, lineHeight: 1.12, color: cor.grafite, marginTop: 14 }}>{marca.area}</div>
            </div>
          ) : null}
        </>
      ) : null}
    </Cartao>
  );
};

export const alturaCta = (m: TCta, marca: Plano["marca"], largura: number) => medir(m, marca, largura).total;
