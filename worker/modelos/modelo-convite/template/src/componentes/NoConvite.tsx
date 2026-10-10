// Os blocos que acontecem no convite grande, embaixo do lacre: abertura, número ("save the date"),
// definição, destaque, frase, pergunta (cartão de resposta) e o fechamento. Todo texto é medido e
// encolhe até caber na área (ver medida.ts); cada palavra ganha tinta quando é dita.
import { pena, prog, temposDoTexto, Traco } from "../anim";
import { E, type Encaixe, encaixar, type Estilo, indicesDe, largura, type Pedaco, pedeGravado, separar } from "../medida";
import type { Abertura as AberturaM, Cta, Definicao, Destaque, Frase, Numero, Palavra, Pergunta, Plano } from "../plano";
import { cor, formatar, gravado, TAM } from "../tema";
import { type Area, Assinatura, Ornamento } from "./Convite";
import { IconeCta } from "./Icones";
import { TextoEscrito } from "./Texto";

// tempos das palavras de um texto na fala; no começo do vídeo, só depois de a foto em arco se formar
const tempos = (txt: string, palavras: Palavra[], de: number, ate: number, inicio = de) =>
  temposDoTexto(txt, palavras, de, ate, inicio).map((x, i) => (de < 0.3 ? Math.max(x, 0.42 + i * 0.16) : x));

const coube = (enc: Encaixe, min: number, linhas: number, altura?: number) =>
  enc.tamanho >= min && enc.linhas.length <= linhas && (altura === undefined || enc.altura <= altura + 0.5);

const pedacos = (ws: string[], estilo: (w: string, i: number) => Estilo): Pedaco[] => ws.map((w, i) => ({ w, e: estilo(w, i) }));

// caligrafia para palavras; letra gravada para o que tem algarismo ou símbolo ("Ctrl + T", "R$")
const caligrafiaOuGravado = (w: string): Estilo => (pedeGravado(w) ? { ...E.numero, escala: 0.62 } : E.caligrafia);

// Título curto em caligrafia; se não couber grande, itálico com o destaque em caligrafia.
// (caligrafia só em texto curto: até `curto` letras)
const tituloFlexivel = (
  txt: string,
  destaque: string | undefined,
  L: number,
  altura: number,
  opc: { max?: number; min?: number; maxItalico?: number; curto?: number } = {},
) => {
  const ws = separar(txt);
  const cal = pedacos(ws, caligrafiaOuGravado);
  const encCal = encaixar(cal, { largura: L, max: opc.max ?? TAM.tituloCaligrafia, min: opc.min ?? 96, linhas: 2, altura, gap: 0.2 });
  if (txt.length <= (opc.curto ?? 24) && coube(encCal, opc.min ?? 96, 2, altura)) return { ps: cal, enc: encCal, gap: 0.2 };
  const marcadas = indicesDe(ws, destaque);
  const ita = pedacos(ws, (w, i) => (marcadas.has(i) ? { ...caligrafiaOuGravado(w), escala: pedeGravado(w) ? 0.9 : 1.45 } : pedeGravado(w) ? { ...E.numero, escala: 0.82 } : E.italico));
  return { ps: ita, enc: encaixar(ita, { largura: L, max: opc.maxItalico ?? 84, min: 50, linhas: 4, altura, gap: 0.24 }), gap: 0.24 };
};

const Coluna: React.FC<{ area: Area; alvo: Area; opacidade: number; children: React.ReactNode; justificar?: React.CSSProperties["justifyContent"] }> = ({
  area,
  alvo,
  opacidade,
  children,
  justificar = "space-evenly",
}) => (
  <div
    style={{
      position: "absolute",
      left: area.x,
      width: area.w,
      top: area.topo,
      height: alvo.base - alvo.topo,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: justificar,
      opacity: opacidade,
    }}
  >
    {children}
  </div>
);

type Props<M> = { m: M; t: number; palavras: Palavra[]; area: Area; alvo: Area; opacidade: number; plano: Plano };

// ——— abertura ———
export const AberturaNoConvite: React.FC<Props<AberturaM>> = ({ m, t, palavras, area, alvo, opacidade }) => {
  const L = alvo.w - 60;
  const H = alvo.base - alvo.topo;
  const sub = separar(m.subtitulo ?? "");
  const { ps, enc, gap } = tituloFlexivel(m.texto, m.destaque, L, H - (sub.length ? 130 : 70));
  const tt = tempos(m.texto, palavras, m.de, m.ate, m.em ?? m.de);
  const fim = Math.max(...tt, m.em ?? m.de);
  const tSub = tempos(m.subtitulo ?? "", palavras, m.de, m.ate, fim + 0.3);
  const psSub = pedacos(sub, () => E.gravado);
  const encSub = encaixar(psSub, { largura: L, max: TAM.rotulo + 4, min: TAM.minRotulo, linhas: 2, gap: 0.5 });
  return (
    <Coluna area={area} alvo={alvo} opacidade={opacidade}>
      <TextoEscrito ps={ps} enc={enc} tempos={tt} t={t} cor={cor.tinta} gap={gap} dur={0.42} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <Ornamento p={prog(t, (tSub[0] ?? fim) - 0.2, 0.6, pena)} />
        {sub.length ? <TextoEscrito ps={psSub} enc={encSub} tempos={tSub} t={t} cor={cor.tinta} gap={0.5} dur={0.3} /> : null}
      </div>
      <div style={{ height: 6 }} />
    </Coluna>
  );
};

// ——— número: o "save the date" ———
export const NumeroNoConvite: React.FC<Props<Numero>> = ({ m, t, palavras, area, alvo, opacidade }) => {
  const L = alvo.w - 60;
  const H = alvo.base - alvo.topo;
  const casas = m.casas ?? 0;
  const final = formatar(m.valor, casas);
  const prefixo = m.prefixo?.trim() ?? "";
  const sufixo = m.sufixo?.trim() ?? "";
  // o número: o maior corpo em que prefixo + número + sufixo cabem numa linha
  const larguraEm = (s: number) =>
    largura(final, s, E.numero) + (prefixo ? largura(prefixo, s * 0.42, E.numero) + s * 0.12 : 0) + (sufixo ? largura(sufixo, s * 0.42, E.numero) + s * 0.12 : 0);
  let corpo = 176;
  while (corpo > 64 && larguraEm(corpo) > L) corpo -= 2;
  // o rótulo em cima
  const ws = separar(m.rotulo);
  const psRot = pedacos(ws, caligrafiaOuGravado);
  const altRot = H - corpo * 1.12 - (m.ilustrativo ? 110 : 64);
  let encRot = encaixar(psRot, { largura: L, max: 112, min: TAM.minCaligrafia, linhas: 2, altura: altRot, gap: 0.2 });
  let psR = psRot;
  if (!coube(encRot, TAM.minCaligrafia, 2, altRot)) {
    psR = pedacos(ws, (w) => (pedeGravado(w) ? { ...E.numero, escala: 0.82 } : E.italico));
    encRot = encaixar(psR, { largura: L, max: 64, min: TAM.minTexto, linhas: 3, altura: altRot, gap: 0.24 });
  }
  const tRot = tempos(m.rotulo, palavras, m.de, m.ate, m.rotuloEm ?? m.de);
  // conta de 0 até o valor: rápido no começo, assenta no fim
  const pConta = prog(t, m.em - 0.05, 1.3, (x) => 1 - Math.pow(1 - x, 3));
  const agora = pConta >= 0.999 ? final : formatar(m.valor * pConta, casas);
  const dito = t >= m.em - 0.05;
  const corNum = dito ? cor.tinta : cor.lapis;
  const pOrn = prog(t, m.em + 0.9, 0.6, pena);
  return (
    <Coluna area={area} alvo={alvo} opacidade={opacidade}>
      <TextoEscrito ps={psR} enc={encRot} tempos={tRot} t={t} cor={cor.tinta} esboco={cor.lapis} gap={0.2} dur={0.4} />
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: corpo * 0.12, fontFamily: gravado, fontWeight: 600, color: corNum, lineHeight: 1.05 }}>
        {prefixo ? <span style={{ fontSize: corpo * 0.42, color: dito ? cor.tintaSuave : cor.lapis, opacity: dito ? 1 : 0.8 }}>{prefixo}</span> : null}
        <span style={{ fontSize: corpo }}>{dito ? agora : "0"}</span>
        {sufixo ? <span style={{ fontSize: corpo * 0.42, color: dito ? cor.tintaSuave : cor.lapis }}>{sufixo}</span> : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <Ornamento p={pOrn} />
        {m.ilustrativo ? (
          <div style={{ fontFamily: gravado, fontWeight: 600, fontSize: TAM.minRotulo + 2, letterSpacing: "0.18em", color: cor.tintaSuave, opacity: pOrn }}>ILUSTRATIVO</div>
        ) : null}
      </div>
    </Coluna>
  );
};

// ——— definição: o termo em caligrafia, o significado embaixo do filete ———
export const DefinicaoNoConvite: React.FC<Props<Definicao>> = ({ m, t, palavras, area, alvo, opacidade }) => {
  const L = alvo.w - 60;
  const H = alvo.base - alvo.topo;
  const ws = separar(m.termo);
  let psT = pedacos(ws, caligrafiaOuGravado);
  let encT = encaixar(psT, { largura: L, max: 140, min: 84, linhas: 2, altura: H * 0.48, gap: 0.2 });
  if (!coube(encT, 84, 2, H * 0.48)) {
    psT = pedacos(ws, (w) => (pedeGravado(w) ? { ...E.numero, escala: 0.82 } : { ...E.texto }));
    encT = encaixar(psT, { largura: L, max: 80, min: TAM.minTexto, linhas: 3, altura: H * 0.48, gap: 0.24 });
  }
  const tT = tempos(m.termo, palavras, m.de, m.ate, m.em);
  const wsS = separar(m.significado);
  const psS = pedacos(wsS, (w) => (pedeGravado(w) ? { ...E.numero, escala: 0.82 } : E.italico));
  const altS = H - encT.altura - 70;
  const encS = encaixar(psS, { largura: L, max: 74, min: TAM.minTexto, linhas: 3, altura: altS, gap: 0.24 });
  const tS = tempos(m.significado, palavras, m.de, m.ate, m.significadoEm);
  return (
    <Coluna area={area} alvo={alvo} opacidade={opacidade}>
      <TextoEscrito ps={psT} enc={encT} tempos={tT} t={t} cor={cor.tinta} esboco={cor.lapis} gap={0.2} dur={0.42} />
      <Ornamento p={prog(t, m.significadoEm - 0.35, 0.5, pena)} largura={300} />
      <TextoEscrito ps={psS} enc={encS} tempos={tS} t={t} cor={cor.tinta} esboco={cor.lapis} gap={0.24} />
    </Coluna>
  );
};

// ——— destaque: a frase curta que bate forte, sublinhada a pena ———
export const DestaqueNoConvite: React.FC<Props<Destaque>> = ({ m, t, palavras, area, alvo, opacidade }) => {
  const L = alvo.w - 60;
  const H = alvo.base - alvo.topo;
  const alerta = m.nivel === "alerta";
  const corTexto = alerta ? cor.alerta : cor.tinta;
  const detalhe = separar(m.detalhe ?? "");
  const altTexto = H - (detalhe.length ? 150 : 50);
  const { ps, enc, gap } = tituloFlexivel(m.texto, undefined, L, altTexto, { max: 150, min: 84, maxItalico: 90, curto: 32 });
  const tt = tempos(m.texto, palavras, m.de, m.ate, m.em);
  const fim = Math.max(...tt);
  const psD = pedacos(detalhe, () => E.italico);
  const encD = encaixar(psD, { largura: L, max: 60, min: TAM.minTexto, linhas: 2, gap: 0.24 });
  const tD = tempos(m.detalhe ?? "", palavras, m.de, m.ate, m.detalheEm ?? fim + 0.4);
  // o sublinhado a pena, com a largura da linha mais larga
  const w = Math.min(L, enc.largura + 40);
  const pSub = prog(t, fim + 0.15, 0.55, pena);
  return (
    <Coluna area={area} alvo={alvo} opacidade={opacidade}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <TextoEscrito ps={ps} enc={enc} tempos={tt} t={t} cor={corTexto} esboco={cor.lapis} gap={gap} dur={0.4} />
        <svg width={w} height={30} viewBox={`0 -15 ${w} 30`} style={{ overflow: "visible", marginTop: -4 }}>
          <Traco d={`M6 4 C${w * 0.3} -8 ${w * 0.62} 12 ${w - 6} -2`} p={pSub} cor={alerta ? cor.alerta : cor.cera} largura={5} />
        </svg>
      </div>
      {detalhe.length ? <TextoEscrito ps={psD} enc={encD} tempos={tD} t={t} cor={cor.tinta} esboco={cor.lapis} gap={0.24} /> : null}
    </Coluna>
  );
};

// ——— frase: palavra por palavra, destaque em caligrafia, risco em tinta vermelha ———
export const FraseNoConvite: React.FC<Props<Frase>> = ({ m, t, palavras, area, alvo, opacidade, plano }) => {
  const L = alvo.w - 60;
  const H = alvo.base - alvo.topo;
  const ws = separar(m.texto);
  const dest = indicesDe(ws, m.destaque);
  const risco = indicesDe(ws, m.risco);
  const ps = pedacos(ws, (w, i) => (dest.has(i) ? { ...caligrafiaOuGravado(w), escala: pedeGravado(w) ? 0.9 : 1.5, entrelinha: 0.9 } : pedeGravado(w) ? { ...E.numero, escala: 0.82 } : E.italico));
  // frase curta fica grande; a longa encolhe até 52 px
  const enc = encaixar(ps, { largura: L, max: m.texto.length <= 28 ? 78 : m.texto.length <= 44 ? 66 : TAM.frase, min: 50, linhas: 4, altura: H - 80, gap: 0.24 });
  const tt = tempos(m.texto, palavras, m.de, m.ate, m.em ?? m.de);
  const riscados = [...risco].sort((a, b) => a - b);
  const inicioRisco = m.riscoEm ?? (riscados.length ? tt[riscados[0]] : 0);
  const pRisco = riscados.length ? prog(t, Math.max(inicioRisco, (tt[riscados[riscados.length - 1]] ?? 0) - 0.2), 0.22 + 0.08 * riscados.length, (x) => x) : 0;
  return (
    <Coluna area={area} alvo={alvo} opacidade={opacidade} justificar="space-between">
      <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 30px" }}>
        <TextoEscrito
          ps={ps}
          enc={enc}
          tempos={tt}
          t={t}
          cor={cor.tinta}
          esboco={cor.lapis}
          gap={0.24}
          risco={riscados.length ? { indices: risco, p: pRisco, cor: cor.alerta } : undefined}
          corDe={(i) => (risco.has(i) && pRisco > 0.5 ? cor.tintaSuave : undefined)}
        />
      </div>
      <Assinatura plano={plano} p={prog(t, m.de + 0.4, 0.6)} />
    </Coluna>
  );
};

// ——— pergunta: o cartão de resposta, com o quadradinho em cada opção ———
export const PerguntaNoConvite: React.FC<Props<Pergunta>> = ({ m, t, palavras, area, alvo, opacidade }) => {
  const L = alvo.w - 60;
  const H = alvo.base - alvo.topo;
  const opcoes = (m.opcoes ?? []).slice(0, 4);
  // as opções primeiro (cada uma com até 2 linhas), o resto da altura para a pergunta
  const caixa = 44;
  const Lop = L - caixa - 26;
  const encsOp = opcoes.map((o) => {
    const ps = pedacos(separar(o.texto), () => E.texto);
    return { ps, ws: separar(o.texto) };
  });
  let corpoOp = 58;
  const medirOps = (c: number) => encsOp.map((o) => encaixar(o.ps, { largura: Lop, max: c, min: c, linhas: 2, gap: 0.24, equilibrar: false }));
  let ops = medirOps(corpoOp);
  const altOps = () => ops.reduce((s, e) => s + e.altura, 0) + Math.max(0, ops.length - 1) * 14;
  while (corpoOp > TAM.minTexto && (altOps() > H * 0.55 || ops.some((e) => e.linhas.length > 2))) {
    corpoOp -= 2;
    ops = medirOps(corpoOp);
  }
  const altP = H - (opcoes.length ? altOps() + 60 : 40);
  const { ps, enc, gap } = tituloFlexivel(m.texto, undefined, L, altP, { max: 140, min: 96, maxItalico: 76 });
  const tt = tempos(m.texto, palavras, m.de, m.ate, m.em ?? m.de);
  const fim = Math.max(...tt);
  return (
    <Coluna area={area} alvo={alvo} opacidade={opacidade}>
      <TextoEscrito ps={ps} enc={enc} tempos={tt} t={t} cor={cor.tinta} esboco={cor.lapis} gap={gap} dur={0.4} />
      {opcoes.length ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 14 }}>
          {opcoes.map((o, i) => {
            const tO = tempos(o.texto, palavras, o.em - 0.3, (opcoes[i + 1]?.em ?? m.ate) + 0.1, o.em);
            const pCaixa = prog(t, o.em - 0.1, 0.5, pena);
            return (
              <div key={`${o.texto}-${i}`} style={{ display: "flex", alignItems: "center", gap: 26 }}>
                <svg width={caixa} height={caixa} viewBox="0 0 44 44" style={{ flexShrink: 0, overflow: "visible" }}>
                  <rect x={3} y={3} width={38} height={38} rx={3} fill="none" stroke={cor.lapis} strokeWidth={2} strokeDasharray="2 5" />
                  <Traco d="M3 3 H41 V41 H3 Z" p={pCaixa} cor={cor.tinta} largura={3} />
                </svg>
                <TextoEscrito ps={encsOp[i].ps} enc={ops[i]} tempos={tO} t={t} cor={cor.tinta} esboco={cor.lapis} gap={0.24} alinhar="flex-start" />
              </div>
            );
          })}
        </div>
      ) : (
        <Ornamento p={prog(t, fim + 0.1, 0.6, pena)} />
      )}
    </Coluna>
  );
};

// ——— fechamento: a chamada (curta, em caligrafia grande), o complemento e a assinatura ———
export const Fechamento: React.FC<Props<Cta>> = ({ m, t, palavras, area, alvo, opacidade, plano }) => {
  const L = alvo.w - 60;
  const H = alvo.base - alvo.topo;
  const ws = separar(m.texto);
  const comp = separar(m.complemento ?? "");
  const destTexto = indicesDe(ws, m.destaque);
  const destComp = destTexto.size ? new Set<number>() : indicesDe(comp, m.destaque);
  const inicio = m.em ?? m.de + 0.1;
  const tChamada = tempos(m.texto, palavras, m.de, m.ate, inicio);
  const fimChamada = Math.max(...tChamada, m.de);
  const tComp = tempos(m.complemento ?? "", palavras, m.de, m.ate, fimChamada + 0.15);
  const fimDaFala = Math.max(...tComp, ...tChamada, m.de);
  const icone = m.icone;
  // chamada curta e sem destaque: caligrafia grande (até 180 px), com o ícone ao lado
  const curta = m.texto.length <= 12 && destTexto.size === 0;
  const ICONE = 112;
  // o complemento primeiro (até 2 linhas), o resto da altura para a chamada
  const psC = pedacos(comp, (w, i) => (destComp.has(i) ? { ...E.caligrafia, escala: 1.45, entrelinha: 0.9 } : { ...E.italico, entrelinha: 1.1 }));
  const encC = encaixar(psC, { largura: L, max: m.complemento && m.complemento.length <= 24 ? 66 : TAM.frase, min: TAM.minTexto, linhas: 2, gap: 0.24 });
  const altChamada = H - (comp.length ? encC.altura + 10 : 0) - 64 - (icone && !curta ? ICONE + 10 : 0);
  let ps: Pedaco[];
  let enc: Encaixe;
  let gap = 0.2;
  if (curta) {
    ps = pedacos(ws, (w) => ({ ...caligrafiaOuGravado(w), entrelinha: 1.12 }));
    const max = TAM.tituloCaligrafia * (m.texto.length <= 6 ? 1.15 : m.texto.length > 10 ? 10 / m.texto.length : 1);
    enc = encaixar(ps, { largura: L - (icone ? ICONE + 24 : 0), max, min: TAM.minCaligrafia + 14, linhas: 2, gap: 0.2, altura: altChamada });
  } else {
    gap = 0.24;
    ps = pedacos(ws, (w, i) => (destTexto.has(i) ? { ...caligrafiaOuGravado(w), escala: 1.45, entrelinha: 0.95 } : pedeGravado(w) ? { ...E.numero, escala: 0.82 } : E.italico));
    enc = encaixar(ps, { largura: L, max: 92, min: 52, linhas: 3, gap: 0.24, altura: altChamada });
  }
  const pIcone = prog(t, inicio - 0.1, 0.8, pena);
  const chamada = <TextoEscrito ps={ps} enc={enc} tempos={tChamada} t={t} cor={cor.tinta} gap={gap} dur={0.45} corDe={(i) => (destTexto.has(i) ? cor.cera : undefined)} />;
  return (
    <Coluna area={area} alvo={alvo} opacidade={opacidade} justificar="space-between">
      {icone && !curta ? <IconeCta nome={icone} tamanho={ICONE} p={pIcone} /> : null}
      {icone && curta ? (
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <IconeCta nome={icone} tamanho={ICONE} p={pIcone} />
          {chamada}
        </div>
      ) : (
        chamada
      )}
      {comp.length ? (
        <TextoEscrito
          ps={psC}
          enc={encC}
          tempos={tComp}
          t={t}
          cor={cor.tinta}
          esboco={cor.lapis}
          gap={0.24}
          corDe={(i) => (destComp.has(i) ? cor.cera : undefined)}
          style={{ marginTop: -6 }}
        />
      ) : null}
      <Assinatura plano={plano} p={prog(t, fimDaFala + 0.25, 0.6)} />
    </Coluna>
  );
};
