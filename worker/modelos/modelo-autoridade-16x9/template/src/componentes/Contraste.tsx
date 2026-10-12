import { Fragment } from "react";
import { Bloco, Linha, prog, useTempo } from "../anim";
import type { Contraste as TContraste } from "../plano";
import { caberNaLargura, cor, serif, sombra } from "../tema";

// Pergunta + caminhos possíveis: cada opção acende quando é falada.
// No quadro deitado ele entra no quadro da esquerda (a pessoa na moldura): recebe a largura dele.
export const Contraste: React.FC<{ m: TContraste; largura: number }> = ({ m, largura }) => {
  const t = useTempo();
  const tamanho = caberNaLargura([m.pergunta], largura, 112);
  // os dois cartões dividem a largura; o texto encolhe junto se for longo
  const tamanhoOpcao = caberNaLargura(m.opcoes.map((o) => o.texto), (largura - 110) / 2 - 40, 70);

  return (
    <Bloco t={t} ate={m.ate} style={{ width: "100%" }}>
      <Linha
        p={prog(t, m.de, 0.55)}
        style={{ fontFamily: serif, fontSize: tamanho, lineHeight: 1.0, color: cor.papel, whiteSpace: "nowrap", textShadow: sombra }}
      >
        {m.pergunta}
      </Linha>
      <div style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 44, width: "100%" }}>
        {m.opcoes.map((op, i) => {
          const aceso = prog(t, op.em, 0.45);
          return (
            <Fragment key={op.texto}>
              {i > 0 && m.conector ? (
                <div
                  style={{
                    fontFamily: serif,
                    fontStyle: "italic",
                    fontSize: 46,
                    color: cor.lataoClaro,
                    opacity: prog(t, op.em - 0.2, 0.3),
                  }}
                >
                  {m.conector}
                </div>
              ) : null}
              <div
                style={{
                  flex: 1,
                  height: 150,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  border: "1.5px solid rgba(242,236,223,0.5)",
                  opacity: prog(t, m.de + 0.35 + i * 0.1, 0.4),
                  overflow: "hidden",
                }}
              >
                {/* o papel sobe e cobre o cartão */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: cor.papel,
                    translate: `0 ${(1 - aceso) * 101}%`,
                  }}
                />
                <div
                  style={{
                    position: "relative",
                    fontFamily: serif,
                    fontSize: tamanhoOpcao,
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                    color: aceso > 0.5 ? cor.tinta : "rgba(242,236,223,0.55)",
                  }}
                >
                  {op.texto}
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>
    </Bloco>
  );
};
