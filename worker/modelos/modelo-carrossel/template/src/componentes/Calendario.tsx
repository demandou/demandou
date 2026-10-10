import { Easing } from "remotion";
import { Palavras, prog, temposDoTexto, TextoFalado, Traco, normalizar } from "../anim";
import { encaixar, larguraLinha } from "../medida";
import { CARTAO_PESSOA } from "../paginas";
import type { Calendario as TCalendario, Palavra } from "../plano";
import { ABAIXO_DO_CONTADOR, BASE_CONTEUDO, BASE_SEM_LEGENDA, cor, fonte, MARGEM, W } from "../tema";
import { Desenho, desenhoDe, misturarCor } from "./Desenhos";

// Página com a pessoa num cartão (em cima, à esquerda), o título na coluna ao lado e,
// embaixo, um calendário: cada linha (semana) se completa quando é dita; no fechamento,
// todos os dias ganham o visto numa onda.
export const Calendario: React.FC<{ m: TCalendario; palavras: Palavra[]; t: number; chegada: number }> = ({ m, palavras, t, chegada }) => {
  const colunaX = CARTAO_PESSOA.x + CARTAO_PESSOA.w + 44;
  const colunaW = W - MARGEM - colunaX;
  const palavrasTitulo = m.titulo.split(/\s+/).filter(Boolean);
  // título: o maior corpo em até 3 linhas curtas na coluna ao lado do cartão
  const medidaTitulo = encaixar(m.titulo, { largura: colunaW, max: 104, min: 60, linhas: 3, fonte: { peso: 800, espacamento: -0.03 }, preferirMenos: 1 });
  const linhasTitulo = medidaTitulo.linhas;
  const tamanho = medidaTitulo.tamanho;
  const tempos = temposDoTexto(m.titulo, palavras, m.de, m.ate, m.de + 0.1);
  const alvo = (m.destaque ?? "").split(/\s+/).filter(Boolean).map(normalizar);
  const destacadas = new Set<number>();
  for (let i = 0; alvo.length && i + alvo.length <= palavrasTitulo.length; i++) {
    if (alvo.every((a, k) => normalizar(palavrasTitulo[i + k]) === a)) {
      alvo.forEach((_, k) => destacadas.add(i + k));
      break;
    }
  }

  const celulas = m.celulas ?? 7;
  const linhas = m.linhas.slice(0, 5);
  const base = m.legenda ? BASE_CONTEUDO : BASE_SEM_LEGENDA;
  const topoGrade = CARTAO_PESSOA.y + CARTAO_PESSOA.h + 64;
  const alturaLinha = Math.min(162, Math.floor((base - topoGrade) / Math.max(linhas.length, 1)));
  const larguraRotulo = 240;
  // a coluna de desenhos só existe se alguma linha tem desenho
  const comDesenho = linhas.some((l) => desenhoDe(l));
  const tile = comDesenho ? Math.min(142, alturaLinha - 16) : 0;
  const areaCelulas = W - 2 * MARGEM - larguraRotulo - (comDesenho ? tile + 28 : 0);
  const passo = areaCelulas / celulas;
  const diam = Math.min(70, passo - 10);
  const fech = m.fechamento;
  const temposFech = fech ? temposDoTexto(fech.texto, palavras, fech.em, m.ate, fech.em) : [];
  const medidaFech = fech ? encaixar(fech.texto, { largura: colunaW, max: Math.round(tamanho * 0.56), min: 40, linhas: 3, fonte: { peso: 700 }, preferirMenos: 1 }) : null;
  // rótulos das linhas (semana, mês, fase…): encolhem para caber na coluna deles
  const corpoRotulo = Math.max(30, Math.min(42, ...linhas.map((l) => Math.floor((42 * (larguraRotulo - 16)) / Math.max(1, larguraLinha(l.rotulo, 42, { peso: 700 }))))));
  // o sublinhado corre depois que a última palavra assenta
  const pSublinha = fech ? prog(t, (temposFech[temposFech.length - 1] ?? fech.em) + 0.05, 0.4, Easing.inOut(Easing.cubic)) : 0;

  let cursor = 0;
  return (
    <>
      {/* título na coluna ao lado do cartão da pessoa */}
      {/* começa abaixo do canto do contador "6/7" */}
      <div style={{ position: "absolute", left: colunaX, top: ABAIXO_DO_CONTADOR, width: colunaW }}>
        {linhasTitulo.map((l, k) => {
          const ws = l.split(/\s+/);
          const base = cursor;
          cursor += ws.length;
          return (
            <Palavras
              key={`${l}-${k}`}
              palavras={ws}
              tempos={tempos.slice(base, base + ws.length)}
              t={t}
              corDe={(j) => (destacadas.has(base + j) ? cor.coral : undefined)}
              style={{ fontFamily: fonte, fontWeight: 800, fontSize: tamanho, lineHeight: 1.0, letterSpacing: "-0.03em", color: cor.petroleo }}
            />
          );
        })}
        {fech ? (
          <div style={{ marginTop: 34, position: "relative", width: "fit-content" }}>
            <TextoFalado
              linhas={medidaFech ? medidaFech.linhas : [fech.texto]}
              tempos={temposFech}
              t={t}
              tamanho={medidaFech ? medidaFech.tamanho : Math.round(tamanho * 0.56)}
              peso={700}
              cor={cor.petroleo}
              entrelinha={1.08}
              espacamento="0em"
            />
            <div
              style={{
                height: 10,
                marginTop: 18,
                borderRadius: 99,
                background: cor.coral,
                transformOrigin: "left center",
                scale: `${pSublinha} 1`,
              }}
            />
          </div>
        ) : null}
      </div>

      {/* calendário */}
      {linhas.map((ln, r) => {
        const y = topoGrade + r * alturaLinha;
        const pRotulo = prog(t, ln.em - 0.05, 0.3);
        const pTile = prog(t, ln.em, 0.8, Easing.inOut(Easing.cubic));
        const nomeDesenho = desenhoDe(ln);
        return (
          <div key={`${ln.rotulo}-${r}`} style={{ position: "absolute", left: MARGEM, top: y, width: W - 2 * MARGEM, height: alturaLinha }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                height: alturaLinha,
                display: "flex",
                alignItems: "center",
                fontFamily: fonte,
                fontWeight: 700,
                fontSize: corpoRotulo,
                whiteSpace: "nowrap",
                color: misturarCor("rgba(15,75,90,0.34)", cor.petroleo, pRotulo),
              }}
            >
              {ln.rotulo}
            </div>
            {Array.from({ length: celulas }, (_, c) => {
              const pc = prog(t, ln.em + 0.05 + c * 0.045, 0.24);
              // visto do fechamento: onda na diagonal (linha + coluna)
              const pv = fech ? prog(t, fech.em + 0.3 + (r + c) * 0.04, 0.28, Easing.inOut(Easing.cubic)) : 0;
              const cx = larguraRotulo + passo * c + passo / 2;
              return (
                <div
                  key={c}
                  style={{
                    position: "absolute",
                    left: cx - diam / 2,
                    top: alturaLinha / 2 - diam / 2,
                    width: diam,
                    height: diam,
                    borderRadius: diam / 2,
                    boxShadow: `inset 0 0 0 4px ${cor.areiaFunda}`,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: diam / 2,
                      background: cor.coral,
                      scale: String(0.4 + 0.6 * pc),
                      opacity: pc,
                    }}
                  />
                  {pv > 0 ? (
                    <svg width={diam} height={diam} viewBox="0 0 40 40" style={{ position: "absolute", inset: 0 }}>
                      <Traco d="M12 21 L18 27 L29 14" p={pv} cor={cor.creme} largura={4.2} />
                    </svg>
                  ) : null}
                </div>
              );
            })}
            {/* o que entrou naquela semana */}
            {comDesenho ? (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: (alturaLinha - tile) / 2,
                width: tile,
                height: tile,
                borderRadius: 28,
                background: nomeDesenho === "mais" ? "transparent" : misturarCor(cor.creme, cor.areia, pRotulo),
                boxShadow: nomeDesenho === "mais" ? undefined : `inset 0 0 0 3px rgba(15,75,90,${0.12 * (1 - pRotulo)})`,
                border: nomeDesenho === "mais" ? `3px dashed rgba(15,75,90,0.3)` : undefined,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {nomeDesenho ? (
                <Desenho
                  nome={nomeDesenho}
                  p={pTile}
                  tamanho={tile * 0.82}
                  traco={5}
                  cores={{ linha: cor.petroleo, corpo: cor.creme, acento: cor.coral }}
                  t={t}
                  gas
                />
              ) : null}
            </div>
            ) : null}
          </div>
        );
      })}
      {/* régua fina entre o topo e o calendário, que se estende quando a página chega */}
      <svg width={W - 2 * MARGEM} height={4} style={{ position: "absolute", left: MARGEM, top: topoGrade - 34, overflow: "visible" }}>
        <line
          x1={0}
          y1={2}
          x2={(W - 2 * MARGEM) * prog(t, chegada + 0.1, 0.8, Easing.inOut(Easing.cubic))}
          y2={2}
          stroke={cor.petroleo}
          strokeOpacity={0.18}
          strokeWidth={3}
          strokeLinecap="round"
        />
      </svg>
    </>
  );
};
