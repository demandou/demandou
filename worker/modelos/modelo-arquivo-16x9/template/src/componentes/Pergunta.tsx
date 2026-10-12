import { aPartirDe, Datilo, DatiloFalado, preciso, prog, saindo, temposDoTexto } from "../anim";
import { encaixar, encaixarBloco, larguraTexto } from "../medida";
import type { Palavra, Pergunta as TPergunta } from "../plano";
import { cor, MARGEM, QUADRO, sans, sombraTexto } from "../tema";
import { topoDoVeu, Veu } from "./Veu";

// respiros da tira de cada opção: padding esquerdo, casinha, vão, padding direito e folga
const CROMO_OPCAO = 18 + 40 + 22 + 24 + 6;
const VAO_OPCOES = 16;

// Pergunta para quem assiste: um "?" carimbado em vermelho e a pergunta datilografada palavra por
// palavra sobre a imagem; as opções chegam como tiras de papel de questionário, cada uma com a
// casinha de marcar (vazia: quem marca é quem assiste), no instante em que são ditas.
// No quadro deitado a faixa abaixo do queixo é baixa: as opções entram numa FILEIRA, lado a lado,
// embaixo da pergunta (não numa pilha alta).
export const Pergunta: React.FC<{
  m: TPergunta;
  t: number;
  fim: number;
  area: { x: number; y: number; w: number; h: number };
  palavras: Palavra[];
}> = ({ m, t, fim, area, palavras }) => {
  const sai = saindo(t, fim - 0.08, 0.22);
  const entra = prog(t, m.de, 0.4);
  const inicio = m.em ?? m.de;
  const opcoes = (m.opcoes ?? []).slice(0, 4);
  const SELO = 76;
  const larguraTexto0 = area.w - SELO - 26;
  // a fileira das opções começa alinhada com o texto (depois do selo) e vai até a margem direita
  const larguraFileira = QUADRO.w - MARGEM - (area.x + SELO + 26);
  const n = Math.max(1, opcoes.length);
  const larguraOpcao = (larguraFileira - VAO_OPCOES * (n - 1)) / n - CROMO_OPCAO;
  // um corpo só para todas as opções (até 2 linhas cada), o maior que caiba em todas
  const corpoOpcao = opcoes.length
    ? Math.min(...opcoes.map((o) => encaixar(o.texto, { largura: larguraOpcao, max: 46, min: 34, linhas: 2, fonte: { peso: 700 } }).tamanho))
    : 0;
  const linhasOpcao = opcoes.length
    ? Math.max(...opcoes.map((o) => encaixar(o.texto, { largura: larguraOpcao, max: corpoOpcao, min: corpoOpcao, linhas: 2, fonte: { peso: 700 } }).linhas.length))
    : 0;
  const alturaOpcao = linhasOpcao * corpoOpcao * 1.12 + 28;
  const espacoOpcoes = opcoes.length ? alturaOpcao + 22 : 0;
  const alturaPergunta = Math.max(SELO, area.h - espacoOpcoes);
  const fit = encaixarBloco(m.texto, { largura: larguraTexto0, altura: alturaPergunta, max: 76, min: 46, maxLinhas: 3, entrelinha: 1.06, fonte: { peso: 800 } });
  const tempos = aPartirDe(temposDoTexto(m.texto, palavras, m.de, m.ate, inicio), m.de + 0.05);
  const selo = prog(t, inicio - 0.1, 0.25, preciso);
  return (
    <>
      <Veu topo={topoDoVeu(area)} opacidade={entra * (1 - sai)} />
      <div
        style={{
          position: "absolute",
          left: area.x,
          width: QUADRO.w - MARGEM - area.x,
          bottom: QUADRO.h - (area.y + area.h),
          display: "flex",
          flexDirection: "column",
          gap: 22,
          opacity: 1 - sai,
          translate: `0 ${sai * 20}px`,
        }}
      >
        <div style={{ display: "flex", gap: 26, alignItems: "flex-start", width: area.w }}>
          <div
            style={{
              width: SELO,
              height: SELO,
              flexShrink: 0,
              background: cor.vermelho,
              color: cor.cartao,
              fontFamily: sans,
              fontWeight: 800,
              fontSize: 60,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              rotate: `${-4 * selo}deg`,
              scale: String(1.3 - 0.3 * selo),
              opacity: selo,
              marginTop: Math.max(0, (fit.tamanho * 1.06 - SELO) / 2),
            }}
          >
            ?
          </div>
          <div style={{ textShadow: sombraTexto }}>
            <DatiloFalado
              texto={m.texto}
              linhas={fit.linhas}
              tempos={tempos}
              t={t}
              style={{ fontFamily: sans, fontWeight: 800, fontSize: fit.tamanho, lineHeight: 1.06, color: cor.claro }}
            />
          </div>
        </div>
        {opcoes.length ? (
          <div style={{ display: "flex", flexDirection: "row", gap: VAO_OPCOES, alignItems: "stretch", marginLeft: SELO + 26 }}>
            {opcoes.map((o, i) => {
              const p = prog(t, o.em - 0.12, 0.38);
              const linha = encaixar(o.texto, { largura: larguraOpcao, max: corpoOpcao, min: corpoOpcao, linhas: 2, fonte: { peso: 700 } });
              const largura = Math.max(...linha.linhas.map((l) => larguraTexto(l, linha.tamanho, { peso: 700 })));
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 22,
                    background: cor.cartao,
                    boxSizing: "border-box",
                    padding: "14px 24px 14px 18px",
                    width: largura + CROMO_OPCAO,
                    minHeight: alturaOpcao,
                    boxShadow: "0 12px 28px rgba(0,0,0,0.35)",
                    rotate: `${i % 2 ? 0.8 : -0.8}deg`,
                    opacity: p,
                    translate: `0 ${(1 - p) * 40}px`,
                  }}
                >
                  <div style={{ width: 40, height: 40, flexShrink: 0, border: `3.5px solid ${cor.tinta}` }} />
                  <div style={{ fontFamily: sans, fontWeight: 700, fontSize: linha.tamanho, lineHeight: 1.12, color: cor.tinta }}>
                    {linha.linhas.map((l, k) => (
                      <div key={k} style={{ whiteSpace: "nowrap" }}>
                        <Datilo texto={l} em={o.em + k * 0.25} t={t} semente={180 + i * 3 + k} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </>
  );
};
