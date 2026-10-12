import { gesto, prog, PalavraAMao, RiscoSobre, saindo, TextoAMao } from "../anim";
import { geometriaDoLeque, MARGEM_X } from "../cena";
import { corpoQueCabe } from "../medida";
import type { Paginas } from "../plano";
import { cor, MARGEM, mao, sans, serifa } from "../tema";

// No quadro deitado o contador fica no alto do quadro da esquerda, em cima do leque (que se abre
// para o lado), e a nota à mão entra à direita da última folha, antes da coluna do bilhete.
// Os corpos são os do vertical vezes ~0,84 (o quadro deitado é mais baixo).
const NUMERO = 164;

// O contador de páginas do momento `paginas`: o número grande é riscado e a caneta escreve o
// certo ao lado; ao lado do leque, a nota à mão.
export const Contador: React.FC<{ m: Paginas; t: number; fim: number; alturaFolha: number }> = ({ m, t, fim, alturaFolha }) => {
  const entra = prog(t, m.de - 0.02, 0.4);
  const sai = saindo(t, fim - 0.05, 0.3);
  if (sai >= 1 || entra <= 0) return null;
  const risco = prog(t, m.xEm - 0.05, 0.3, gesto);
  const n = Math.max(1, m.total);
  const unidade = m.unidade ?? "páginas";
  const g = geometriaDoLeque(n, alturaFolha);
  // a nota: à direita da última folha, na altura do terço de baixo dela, sem chegar no bilhete
  const notaX = g.x + (n - 1) * g.dx + g.larg + 40;
  const notaY = g.y + (n - 1) * g.dy + alturaFolha * g.s * 0.62;
  const notaTam = m.nota ? corpoQueCabe(m.nota.texto, MARGEM_X - 48 - notaX, 50, 30, { fonte: "mao", peso: 600 }) : 50;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: MARGEM,
          top: g.y - 200,
          display: "flex",
          alignItems: "flex-end",
          gap: 26,
          opacity: entra * (1 - sai),
          translate: `${(1 - entra) * -40}px ${-sai * 30}px`,
        }}
      >
        <div style={{ position: "relative", fontFamily: serifa, fontWeight: 700, fontSize: NUMERO, lineHeight: 0.9, color: cor.tinta }}>
          {m.total}
          <RiscoSobre p={risco} alturaPx={NUMERO * 0.9} largura={11} altura={0.5} semente={5} />
        </div>
        {/* o número certo, escrito à mão: abre espaço e empurra "páginas" para a direita */}
        <div
          style={{
            width: 0.67 * NUMERO * String(m.ideal).length * prog(t, m.xEm + 0.12, 0.3),
            marginRight: -26 * (1 - prog(t, m.xEm + 0.12, 0.3)),
            overflow: "visible",
            fontFamily: mao,
            fontWeight: 700,
            fontSize: NUMERO,
            lineHeight: 0.9,
            color: cor.vermelho,
          }}
        >
          <PalavraAMao w={String(m.ideal)} em={m.xEm + 0.22} t={t} dur={0.3} />
        </div>
        <div style={{ fontFamily: sans, fontWeight: 600, fontSize: unidade.length > 9 ? 38 : 44, color: cor.tinta, paddingBottom: 15, whiteSpace: "nowrap" }}>{unidade}</div>
      </div>
      {m.nota ? (
        <div style={{ position: "absolute", left: notaX, top: notaY, opacity: 1 - sai }}>
          <TextoAMao
            texto={m.nota.texto}
            tempos={m.nota.texto.split(/\s+/).map((_, i) => m.nota!.em + i * 0.13)}
            t={t}
            style={{ fontSize: notaTam, lineHeight: 1.1, flexWrap: "nowrap", whiteSpace: "nowrap" }}
          />
        </div>
      ) : null}
    </>
  );
};

