import { gesto, prog, PalavraAMao, RiscoSobre, saindo, TextoAMao } from "../anim";
import { LEQUE } from "../cena";
import type { Paginas } from "../plano";
import { cor, mao, sans, serifa } from "../tema";

// O contador de páginas do momento `paginas`: o número grande é riscado e a caneta escreve o
// certo ao lado; embaixo do leque, a nota à mão.
export const Contador: React.FC<{ m: Paginas; t: number; fim: number; alturaFolha: number }> = ({ m, t, fim, alturaFolha }) => {
  const entra = prog(t, m.de - 0.02, 0.4);
  const sai = saindo(t, fim - 0.05, 0.3);
  if (sai >= 1 || entra <= 0) return null;
  const risco = prog(t, m.xEm - 0.05, 0.3, gesto);
  const n = Math.max(1, m.total);
  const unidade = m.unidade ?? "páginas";
  const ultimaY = LEQUE.y + (n - 1) * LEQUE.dy + alturaFolha * LEQUE.s;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 52,
          top: LEQUE.y - 236,
          display: "flex",
          alignItems: "flex-end",
          gap: 26,
          opacity: entra * (1 - sai),
          translate: `${(1 - entra) * -40}px ${-sai * 30}px`,
        }}
      >
        <div style={{ position: "relative", fontFamily: serifa, fontWeight: 700, fontSize: 196, lineHeight: 0.9, color: cor.tinta }}>
          {m.total}
          <RiscoSobre p={risco} alturaPx={176} largura={12} altura={0.5} semente={5} />
        </div>
        {/* o número certo, escrito à mão: abre espaço e empurra "páginas" para a direita */}
        <div
          style={{
            width: 132 * String(m.ideal).length * prog(t, m.xEm + 0.12, 0.3),
            marginRight: -26 * (1 - prog(t, m.xEm + 0.12, 0.3)),
            overflow: "visible",
            fontFamily: mao,
            fontWeight: 700,
            fontSize: 196,
            lineHeight: 0.9,
            color: cor.vermelho,
          }}
        >
          <PalavraAMao w={String(m.ideal)} em={m.xEm + 0.22} t={t} dur={0.3} />
        </div>
        <div style={{ fontFamily: sans, fontWeight: 600, fontSize: unidade.length > 9 ? 44 : 52, color: cor.tinta, paddingBottom: 18, whiteSpace: "nowrap" }}>{unidade}</div>
      </div>
      {m.nota ? (
        <div style={{ position: "absolute", left: 60, top: Math.min(1380, ultimaY + 36), opacity: 1 - sai }}>
          <TextoAMao
            texto={m.nota.texto}
            tempos={m.nota.texto.split(/\s+/).map((_, i) => m.nota!.em + i * 0.13)}
            t={t}
            style={{ fontSize: 58, lineHeight: 1.1, flexWrap: "nowrap", whiteSpace: "nowrap" }}
          />
        </div>
      ) : null}
    </>
  );
};

