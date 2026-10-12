// Definição: o termo entra grande, em itálico, como o nome de uma peça; um pino crava embaixo
// dele e a linha fina de catálogo desce até o cartão onde o significado ganha tinta.
import { prog, saida, Sobe } from "../anim";
import { encaixar, largura } from "../medida";
import type { Area } from "../pessoa";
import type { Definicao, Plano } from "../plano";
import { cor, serifa, PAGINA } from "../tema";
import { Chamada } from "./Chamada";
import { Falado, folha, quando } from "./comum";
import { separar, temposDoTexto } from "../palavras";

const PAD = 40;

export const DefinicaoDeCatalogo: React.FC<{ m: Definicao; t: number; fim: number; area: Area; id: string; plano: Plano }> = ({ m, t, fim, area, id, plano }) => {
  const fora = saida(t, fim);
  const em = quando(m.em, m.de);
  const sEm = Math.max(quando(m.significadoEm, m.de), em + 0.35);
  const termo = encaixar(m.termo, { largura: area.w, max: 156, min: 64, linhas: 2, estilo: "italico", entrelinha: 1.04 });
  const cw = Math.round(area.w * 0.84);
  const tw = cw - PAD * 2;
  // o significado no maior corpo (até 80 px) que deixa o cartão no espaço abaixo do termo
  const livre = area.h - termo.altura - 80;
  let sig = encaixar(m.significado, { largura: tw, max: 80, min: 48, linhas: 3, estilo: "serifa", entrelinha: 1.14 });
  for (let s = sig.tamanho - 4; PAD * 2 + sig.altura > livre && s >= 40; s -= 4)
    sig = encaixar(m.significado, { largura: tw, max: s, min: Math.min(s, 40), linhas: 5, estilo: "serifa", entrelinha: 1.14 });
  const ch = PAD * 2 + sig.altura;
  const cx = area.x + area.w - cw;
  // o cartão assenta na base da área; a linha do pino desce do termo até ele
  const cy = Math.min(area.y + area.h - ch, area.y + termo.altura + 360);
  const pTermo = prog(t, em - 0.04, 0.45);
  // cada palavra do termo ganha tinta quando é dita (a primeira no `em`)
  const palavrasTermo = separar(termo.linhas.join(" "));
  const achados = temposDoTexto(palavrasTermo, plano, em - 0.1, sEm);
  const temposTermo = achados.map((v, i) => (i === 0 ? em : Math.max(em, Math.min(v, sEm - 0.1))));
  const sub = prog(t, em + 0.25, 0.5);
  const pSig = prog(t, sEm - 0.04, 0.45);
  const entra = prog(t, m.de + 0.15, 0.6);
  const pino = { x: area.x + 34, y: area.y + termo.altura + 46 };
  const alvo = { x: cx, y: cy + Math.min(ch / 2, 70) };
  const ultima = largura(termo.linhas[termo.linhas.length - 1], termo.tamanho, "italico");

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: PAGINA.w, height: PAGINA.h, opacity: 1 - fora, translate: `0 ${fora * 30}px` }}>
      <div style={{ position: "absolute", left: area.x, top: area.y, width: area.w, fontFamily: serifa, fontStyle: "italic", fontSize: termo.tamanho, lineHeight: 1.04, color: cor.tinta, whiteSpace: "nowrap" }}>
        {/* o termo chega a lápis com a página e ganha tinta quando é dito */}
        <div style={{ opacity: Math.min(1, entra * 1.5) }}>
          <Falado linhas={termo.linhas} tempos={temposTermo} t={t} tamanho={termo.tamanho} entrelinha={1.04} italico />
        </div>
        <div style={{ height: Math.max(5, termo.tamanho * 0.05), width: ultima * sub, background: cor.indigo, marginTop: 4 }} />
      </div>
      <div
        style={{
          ...folha,
          left: cx,
          top: cy,
          width: cw,
          height: ch,
          padding: PAD,
          opacity: Math.min(1, entra * 1.6),
          translate: `${(1 - entra) * 80}px 0`,
        }}
      >
        <div style={{ position: "absolute", left: PAD, top: PAD + sig.tamanho * 0.62, width: tw * 0.7, borderTop: `3px dashed ${cor.lapis}`, opacity: 1 - prog(pSig, 0, 0.4) }} />
        <div style={{ fontFamily: serifa, fontSize: sig.tamanho, lineHeight: 1.14, color: cor.tinta, whiteSpace: "nowrap" }}>
          {sig.linhas.map((l, i) => (
            <Sobe key={i} p={pSig}>
              {l}
            </Sobe>
          ))}
        </div>
      </div>
      <Chamada id={`${id}-def`} de={pino} ate={alvo} t={t} em={sEm - 0.35} fora={0} />
    </div>
  );
};
