import { limitar, Palavras, prog, saindo, temposDoTexto } from "../anim";
import type { Areas } from "../layout";
import type { Checklist as ChecklistT, Layout, Palavra } from "../plano";
import { ajustarTitulo, cor, linhasDoTexto, sans } from "../tema";
import { Cabecalho } from "./Cabecalho";
import { IconeDoItem } from "./Icones";
import { pSelo, Selo } from "./Selo";

// A receita: cada linha entra quando é dita, com um ícone que se move e o ✓ (ou ✗) no fim.
// Em tela cheia fica na névoa branca; na lupa, embaixo do cabeçalho.
export const Checklist: React.FC<{ m: ChecklistT; t: number; fim: number; areas: Areas; layout: Layout; palavras: Palavra[] }> = ({
  m,
  t,
  fim,
  areas,
  layout,
  palavras,
}) => {
  const sai = saindo(t, fim, 0.3);
  if (sai >= 1) return null;
  const cheio = layout === "cheio";
  const area = areas.corpo;
  const tituloTam = ajustarTitulo(m.titulo, area.w - 130, 1, 108, 64);
  const temposTitulo = temposDoTexto(m.titulo, palavras, m.de, m.ate, m.de + 0.1);
  // em tela cheia o bloco começa um pouco acima da zona e desce até perto da interface do app
  const topo = cheio ? area.y - 40 : area.y;
  const altura = cheio ? 1548 - topo : area.h;
  const linha = Math.min(164, (altura - (cheio ? tituloTam * 1.1 + 26 : 0)) / Math.max(1, m.itens.length));
  const icone = Math.min(134, linha - 26);
  const selo = Math.min(48, linha * 0.3);
  const larguraItem = area.w - icone - selo * 2 - 64;
  // uma linha por item; se algum não cabe nem em 48 px, todos passam a ter até duas linhas
  const duasLinhas = m.itens.some((i) => linhasDoTexto(i.texto, larguraItem, 48) > 1);
  const textoTam = duasLinhas
    ? Math.min(Math.floor(linha / 2.5), ...m.itens.map((i) => ajustarTitulo(i.texto, larguraItem, 2, 64, 40)))
    : Math.min(78, ...m.itens.map((i) => ajustarTitulo(i.texto, larguraItem, 1, 78, 48)));

  return (
    <>
      {!cheio ? (
        <Cabecalho
          area={areas.cabecalho}
          titulo={m.titulo}
          enfase={m.enfase}
          palavras={palavras}
          de={m.de}
          ate={m.ate}
          t={t}
          fim={fim}
          alinhar={layout === "topo" || layout === "centro" ? "centro" : "esquerda"}
          maxLinhas={layout === "topo" ? 2 : 3}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: area.x,
          top: topo,
          width: area.w,
          display: "flex",
          flexDirection: "column",
          opacity: 1 - sai,
          translate: `0 ${14 * sai}px`,
        }}
      >
        {cheio ? (
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 26 }}>
            {m.marcaEm !== undefined ? (
              <svg width={108} height={108} style={{ overflow: "visible", flexShrink: 0 }}>
                <Selo cx={54} cy={54} r={52} tipo="certo" p={pSelo(t, m.marcaEm)} />
              </svg>
            ) : null}
            <Palavras
              texto={m.titulo}
              tempos={temposTitulo}
              t={t}
              enfase={m.enfase}
              corEnfase={cor.azul}
              style={{ fontFamily: sans, fontWeight: 800, fontSize: tituloTam, lineHeight: 1.05, letterSpacing: "-0.02em", color: cor.tinta }}
            />
          </div>
        ) : null}
        {m.itens.map((it, i) => {
          const entra = prog(t, it.em - 0.05, 0.45);
          const tipo = it.tipo ?? "certo";
          const tempos = temposDoTexto(it.texto, palavras, it.em - 0.1, m.ate, it.em);
          return (
            <div
              key={i}
              style={{
                height: linha,
                display: "flex",
                alignItems: "center",
                gap: 32,
                borderTop: `2.5px solid ${cor.cinzaClaro}`,
                opacity: limitar(entra * 1.4),
                translate: `${(1 - entra) * -30}px 0`,
              }}
            >
              <div
                style={{
                  width: icone,
                  height: icone,
                  borderRadius: "50%",
                  background: cor.fundo,
                  boxShadow: `inset 0 0 0 4px ${cor.azul}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <IconeDoItem icone={it.icone ?? "check"} t={t} em={it.em} tamanho={icone * 0.68} />
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                <Palavras
                  texto={it.texto}
                  tempos={tempos}
                  t={t}
                  style={{ fontFamily: sans, fontWeight: 700, fontSize: textoTam, lineHeight: 1.05, letterSpacing: "-0.01em", color: cor.tinta, textWrap: duasLinhas ? "balance" : "nowrap", maxWidth: larguraItem }}
                />
                {it.semanaEm !== undefined ? (
                  <div style={{ display: "flex", gap: 14 }}>
                    {Array.from({ length: 7 }, (_, k) => {
                      const a = prog(t, it.semanaEm! + k * 0.08, 0.3);
                      return (
                        <div
                          key={k}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            boxShadow: `inset 0 0 0 3px ${a > 0 ? cor.azul : cor.cinzaLinha}`,
                            background: a > 0.5 ? cor.azul : "transparent",
                            scale: String(0.7 + 0.3 * a),
                            opacity: prog(t, it.em + 0.2, 0.4),
                          }}
                        />
                      );
                    })}
                  </div>
                ) : null}
              </div>
              <svg width={selo * 2 + 4} height={selo * 2 + 4} style={{ overflow: "visible", flexShrink: 0 }}>
                <Selo cx={selo + 2} cy={selo + 2} r={selo} tipo={tipo} p={pSelo(t, it.em + 0.35)} />
              </svg>
            </div>
          );
        })}
      </div>
    </>
  );
};
