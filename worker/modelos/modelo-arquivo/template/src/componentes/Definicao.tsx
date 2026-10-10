import { Datilo, preciso, prog } from "../anim";
import { partesDaRegiao, type Regiao } from "../layout";
import { encaixar } from "../medida";
import type { Definicao as TDefinicao, Layout } from "../plano";
import { cor, mono, sans, sombraPapel } from "../tema";
import { Deslizar } from "./Papel";

// Ficha catalográfica (a ficha de biblioteca/arquivo): o termo datilografado em cima, um filete
// vermelho embaixo dele, e o significado datilografado nas linhas pautadas; furo no pé da ficha.
// As linhas já estão impressas antes de o significado ser dito (nunca há ficha vazia).
export const Definicao: React.FC<{ m: TDefinicao; t: number; fim: number; regiao: Regiao; layout: Layout }> = ({ m, t, fim, regiao, layout }) => {
  const termo = m.termo.toUpperCase();
  // altura da pauta: acompanha o corpo do significado
  let LINHA = 74;
  // no canto, o termo fica na folha ao lado da foto e a ficha começa embaixo dela
  const noCanto = layout === "canto";
  const partes = partesDaRegiao(layout, regiao, 0);
  const larguraTermo = (noCanto ? partes.cabeca.w : regiao.w - 80) - 8;
  // no canto o termo enche o pedaço ao lado da foto (até 3 linhas grandes)
  const fitTermo = noCanto
    ? encaixar(termo, { largura: larguraTermo, max: 104, min: 52, linhas: Math.max(2, Math.min(3, termo.split(" ").length)), fonte: { peso: 800, espacamento: 0.01 } })
    : encaixar(termo, { largura: larguraTermo, max: 84, min: 48, linhas: 2, fonte: { peso: 800, espacamento: 0.01 } });
  const alturaTermo = fitTermo.linhas.length * fitTermo.tamanho * 1.04;
  const MARGEM_ESQ = 92;
  const larguraSignificado = (noCanto ? partes.corpo.w : regiao.w) - MARGEM_ESQ - 50;
  const espacoMax = noCanto ? Math.min(partes.corpo.h - 10, 760) : regiao.h - 16;
  const topoTexto = noCanto ? 50 : 40 + alturaTermo + 46;
  const linhasMax = Math.max(2, Math.min(5, Math.floor((espacoMax - topoTexto - 80) / LINHA)));
  const fit = encaixar(m.significado, { largura: larguraSignificado, max: 64, min: 40, linhas: linhasMax, fonte: { mono: true } });
  LINHA = Math.round(Math.max(74, fit.tamanho * 1.36));
  // a ficha tem o tamanho do que vai escrito nela (mais uma linha em branco e o furo)
  const nLinhas = Math.min(linhasMax + 1, fit.linhas.length + 1);
  const alturaFicha = Math.min(espacoMax, Math.max(noCanto ? 560 : 380, topoTexto + nLinhas * LINHA + 90));
  // no canto, a ficha fica no meio do espaço abaixo da foto (sem um terço vazio embaixo)
  const ficha = noCanto ? { x: partes.corpo.x, y: partes.corpo.y + Math.max(0, (partes.corpo.h - 10 - alturaFicha) * 0.42), w: partes.corpo.w, h: alturaFicha } : { x: regiao.x, y: regiao.y + 6, w: regiao.w, h: alturaFicha };
  const filete = prog(t, m.em + 0.4, 0.5, preciso);
  const termoEl = (
    <div style={{ fontFamily: sans, fontWeight: 800, fontSize: fitTermo.tamanho, lineHeight: 1.04, letterSpacing: "0.01em", color: cor.tinta }}>
      {fitTermo.linhas.map((l, i) => (
        <div key={i} style={{ whiteSpace: "nowrap" }}>
          <Datilo texto={l} em={m.em + i * 0.25} t={t} semente={600 + i} />
        </div>
      ))}
    </div>
  );
  return (
    <Deslizar t={t} de={m.de} fim={fim}>
      {noCanto ? (
        <div style={{ position: "absolute", left: partes.cabeca.x + 4, top: partes.cabeca.y + 30, width: partes.cabeca.w }}>
          {termoEl}
          <div style={{ marginTop: 22, height: 8, width: Math.min(partes.cabeca.w * 0.6, 300) * filete, background: cor.vermelho }} />
        </div>
      ) : null}
      <div style={{ position: "absolute", left: ficha.x, top: ficha.y, width: ficha.w, height: ficha.h, background: cor.cartao, boxShadow: sombraPapel, rotate: "-0.6deg", overflow: "hidden" }}>
        {/* margem vermelha e linhas pautadas da ficha */}
        <div style={{ position: "absolute", left: MARGEM_ESQ - 26, top: 0, bottom: 0, width: 3, background: cor.vermelho, opacity: 0.75 }} />
        {Array.from({ length: nLinhas }, (_, k) => (
          <div key={k} style={{ position: "absolute", left: 0, right: 0, top: topoTexto + k * LINHA + Math.round(LINHA * 0.84), height: 2, background: cor.linha }} />
        ))}
        {noCanto ? null : (
          <div style={{ position: "absolute", left: MARGEM_ESQ, top: 34, width: ficha.w - MARGEM_ESQ - 40 }}>
            {termoEl}
            <div style={{ marginTop: 16, height: 6, width: (ficha.w - MARGEM_ESQ - 40) * filete, background: cor.vermelho }} />
          </div>
        )}
        <div style={{ position: "absolute", left: MARGEM_ESQ, top: topoTexto, fontFamily: mono, fontWeight: 700, fontSize: fit.tamanho, lineHeight: `${LINHA}px`, color: cor.tinta }}>
          {fit.linhas.map((l, i) => (
            <div key={i} style={{ whiteSpace: "nowrap", height: LINHA }}>
              <Datilo texto={l} em={m.significadoEm + i * 0.35} t={t} dur={Math.min(0.9, Math.max(0.25, l.length * 0.035))} semente={620 + i} />
            </div>
          ))}
        </div>
        {/* furo da ficha */}
        <div
          style={{
            position: "absolute",
            left: ficha.w / 2 - 22,
            bottom: 24,
            width: 44,
            height: 44,
            borderRadius: 22,
            background: cor.papel,
            boxShadow: "inset 0 3px 5px rgba(21,21,21,0.25)",
          }}
        />
      </div>
    </Deslizar>
  );
};
