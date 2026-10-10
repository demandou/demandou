// A célula de destaque, mesclada ao lado da pessoa: ilustra a linha da vez (∞ sem limite, regras com
// ícones, pizza de porcentagem, número que conta) ou a frase do preencher. Tudo espera "a lápis".
import { digitado, fimDaDigitacao, formatar, limitar, piscando, prog, temposDoTexto, Traco } from "../anim";
import type { Ret } from "../grade";
import { DURACAO_TROCA } from "../roteiro";
import type { Ilustracao as TDestaque, Linha, Palavra, Preencher } from "../plano";
import { encaixar, umaLinha } from "../medida";
import { cor, rotuloCaixaAlta, sans } from "../tema";
import { Icone, type NomeIcone } from "./Icones";
import { Esboco, TextoFalado } from "./Texto";

const INFINITO = "M60 50c-14-22-46-22-46 0s32 22 46 0c14-22 46-22 46 0s-32 22-46 0z";

const Cabeca: React.FC<{ rotulo: string; tempos: number[]; t: number; icone?: NomeIcone; iconeEm: number; largura: number }> = ({
  rotulo,
  tempos,
  t,
  icone,
  iconeEm,
  largura,
}) => {
  const tamanho = umaLinha(rotulo, largura - (icone ? 70 : 0), 32, 26, { peso: 700, caixaAlta: true, espacamento: 0.04 });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, height: 56 }}>
      {icone ? <Icone nome={icone} tamanho={54} cor={cor.tinta} peso={3.4} p={prog(t, iconeEm, 0.6)} /> : null}
      <TextoFalado texto={rotulo} tempos={tempos} t={t} style={{ ...rotuloCaixaAlta, fontWeight: 700, fontSize: tamanho, color: cor.acento, flexWrap: "nowrap" }} />
    </div>
  );
};

const Infinito: React.FC<{ d: Extract<TDestaque, { tipo: "infinito" }>; t: number; tempos: number[]; w: number; h: number }> = ({ d, t, tempos, w, h }) => {
  const p = prog(t, d.em, 0.9);
  const largura = Math.min(w - 80, 320);
  const enc = encaixar(d.texto, { largura: w - 56, max: 46, min: 36, linhas: 2, fonte: { peso: 600 } });
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
      <svg width={largura} height={largura * 0.55} viewBox="0 0 120 66" style={{ overflow: "visible" }}>
        <path d={INFINITO} fill="none" stroke={cor.esboco} strokeWidth={4} strokeDasharray="4 6" strokeLinecap="round" opacity={1 - limitar(p * 3)} transform="translate(0 -17)" />
        <g transform="translate(0 -17)">
          <Traco d={INFINITO} p={p} cor={cor.acento} largura={11} />
        </g>
      </svg>
      {t < (tempos[0] ?? d.em) ? (
        <Esboco w={(w - 80) * 0.7} h={20} />
      ) : (
        <TextoFalado texto={d.texto} tempos={tempos} t={t} alinhar="center" linhas={enc.linhas} style={{ fontFamily: sans, fontWeight: 600, fontSize: enc.tamanho, color: cor.tinta, lineHeight: 1.15 }} />
      )}
    </div>
  );
};

const Regras: React.FC<{ d: Extract<TDestaque, { tipo: "regras" }>; t: number; palavras: Palavra[]; ate: number; w: number }> = ({ d, t, palavras, ate, w }) => {
  // célula estreita (312 px): o ícone fica em cima do texto, que ganha a largura toda
  const estreita = w < 400;
  const lado = estreita ? 52 : 66;
  const largura = estreita ? w - 56 : w - 56 - lado - 18;
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: estreita ? 16 : 26 }}>
      {d.linhas.slice(0, 3).map((r, i) => {
        const tempos = temposDoTexto(r.texto, palavras, r.em - 0.3, ate, r.em);
        const p = prog(t, r.em, 0.5);
        const enc = encaixar(r.texto, { largura, max: estreita ? 42 : 46, min: 34, linhas: d.linhas.length > 2 ? 2 : estreita ? 2 : 3, fonte: { peso: 600 } });
        return (
          <div key={i} style={{ display: "flex", flexDirection: estreita ? "column" : "row", alignItems: estreita ? "flex-start" : "center", gap: estreita ? 8 : 18 }}>
            <div style={{ width: lado, height: lado, borderRadius: 14, background: p > 0 ? cor.acentoFundo : "transparent", border: p > 0 ? "none" : `2.5px dashed ${cor.esboco}`, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box", flexShrink: 0 }}>
              {r.icone ? <Icone nome={r.icone} tamanho={lado * 0.7} cor={p > 0 ? cor.acento : cor.esboco} peso={3.6} p={p > 0 ? p : 1} tracejado={p <= 0} /> : null}
            </div>
            {t < r.em ? (
              <Esboco w={largura * (0.5 + 0.2 * (i % 2))} h={20} />
            ) : (
              <TextoFalado texto={r.texto} tempos={tempos} t={t} linhas={enc.linhas} style={{ fontFamily: sans, fontWeight: 600, fontSize: enc.tamanho, color: cor.tinta, lineHeight: 1.08 }} />
            )}
          </div>
        );
      })}
    </div>
  );
};

const Pizza: React.FC<{ d: Extract<TDestaque, { tipo: "pizza" }>; t: number; palavras: Palavra[]; ate: number; w: number; h: number }> = ({ d, t, palavras, ate, w, h }) => {
  const diametro = Math.min(w - 120, h - 190, 250);
  const r = diametro / 2 - 20;
  const c = diametro / 2;
  const p = prog(t, d.em, 0.75);
  const pct = d.pct * p;
  const ang = (pct / 100) * Math.PI * 2;
  const x = c + r * Math.sin(ang);
  const y = c - r * Math.cos(ang);
  const arco = pct > 0.05 ? `M${c} ${c - r}A${r} ${r} 0 ${pct > 50 ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)}` : "";
  const textoEm = d.textoEm ?? d.em + 0.8;
  const ref = prog(t, textoEm, 0.4);
  const tempos = temposDoTexto(d.texto, palavras, textoEm - 0.3, ate, textoEm);
  const enc = encaixar(d.texto, { largura: w - 48, max: 46, min: 34, linhas: 2, fonte: { peso: 600 } });
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
      <div style={{ position: "relative", width: diametro, height: diametro }}>
        <svg width={diametro} height={diametro} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {/* o todo: anel cinza, que ganha o contorno de referência quando é dito */}
          <circle cx={c} cy={c} r={r} fill="none" stroke={p > 0 ? cor.esbocoClaro : "none"} strokeWidth={34} />
          {p <= 0 ? <circle cx={c} cy={c} r={r} fill="none" stroke={cor.esboco} strokeWidth={3} strokeDasharray="6 8" /> : null}
          {ref > 0 ? (
            <>
              <circle cx={c} cy={c} r={r + 21} fill="none" stroke={cor.acento} strokeWidth={3} strokeDasharray="10 8" strokeDashoffset={-t * 40} opacity={ref} />
              <circle cx={c} cy={c} r={r - 21} fill="none" stroke={cor.acento} strokeWidth={3} strokeDasharray="10 8" strokeDashoffset={t * 40} opacity={ref} />
            </>
          ) : null}
          {arco ? <path d={arco} fill="none" stroke={cor.acento} strokeWidth={34} strokeLinecap="butt" /> : null}
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans, fontWeight: 700, fontSize: Math.round(diametro * 0.27), color: p > 0 ? cor.tinta : cor.esboco, fontVariantNumeric: "tabular-nums" }}>
          {p > 0 ? `${formatar(Math.round(pct))}%` : "%"}
        </div>
      </div>
      {t < textoEm ? (
        <Esboco w={(w - 80) * 0.7} h={20} />
      ) : (
        <TextoFalado texto={d.texto} tempos={tempos} t={t} alinhar="center" linhas={enc.linhas} style={{ fontFamily: sans, fontWeight: 600, fontSize: enc.tamanho, color: cor.tinta, lineHeight: 1.1 }} />
      )}
    </div>
  );
};

const Numero: React.FC<{ d: Extract<TDestaque, { tipo: "numero" }>; t: number; palavras: Palavra[]; ate: number; w: number }> = ({ d, t, palavras, ate, w }) => {
  const p = prog(t, d.em, 0.8);
  const texto = `${d.prefixo ? `${d.prefixo} ` : ""}${formatar(d.valor * p, d.casas ?? 0)}${d.sufixo ?? ""}`;
  const final = `${d.prefixo ? `${d.prefixo} ` : ""}${formatar(d.valor, d.casas ?? 0)}${d.sufixo ?? ""}`;
  const tamanho = umaLinha(final, w - 56, 110, 40, { peso: 700 });
  const encT = d.texto ? encaixar(d.texto, { largura: w - 56, max: 46, min: 34, linhas: 2, fonte: { peso: 600 } }) : null;
  const tempos = d.texto ? temposDoTexto(d.texto, palavras, d.em - 0.3, ate, d.em + 0.3) : [];
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 }}>
      <div style={{ fontFamily: sans, fontWeight: 700, fontSize: tamanho, color: p > 0 ? cor.acento : cor.esboco, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", lineHeight: 1 }}>{p > 0 ? texto : final.replace(/\d/g, "0")}</div>
      {d.texto ? (
        t < (tempos[0] ?? d.em) ? (
          <Esboco w={(w - 80) * 0.6} h={20} />
        ) : (
          <TextoFalado texto={d.texto} tempos={tempos} t={t} linhas={encT?.linhas} style={{ fontFamily: sans, fontWeight: 600, fontSize: encT?.tamanho ?? 44, color: cor.tinta, lineHeight: 1.12 }} />
        )
      ) : null}
    </div>
  );
};

const SoIcone: React.FC<{ icone?: NomeIcone; texto?: string; em: number; t: number; palavras: Palavra[]; ate: number; w: number; h: number }> = ({
  icone,
  texto,
  em,
  t,
  palavras,
  ate,
  w,
  h,
}) => {
  const tempos = texto ? temposDoTexto(texto, palavras, em - 0.3, ate, em) : [];
  const enc = texto ? encaixar(texto, { largura: w - 48, max: 46, min: 34, linhas: 4, fonte: { peso: 600 } }) : null;
  const linhas = enc?.linhas.length ?? 0;
  const tamanho = enc?.tamanho ?? 46;
  const icon = Math.max(64, Math.min(150, h - 140 - linhas * tamanho * 1.15));
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
      {icone ? <Icone nome={icone} tamanho={icon} cor={cor.acento} peso={2.6} p={prog(t, em, 0.9)} /> : null}
      {texto ? (
        t < (tempos[0] ?? em) ? (
          <Esboco w={(w - 80) * 0.7} h={20} />
        ) : (
          <TextoFalado texto={texto} tempos={tempos} t={t} alinhar="center" linhas={enc?.linhas} style={{ fontFamily: sans, fontWeight: 600, fontSize: tamanho, color: cor.tinta, lineHeight: 1.12 }} />
        )
      ) : null}
    </div>
  );
};

// Moldura comum: a célula mesclada, com entrada e saída; o conteúdo vem do tipo.
const Moldura: React.FC<{ ret: Ret; t: number; de: number; ate: number; children: React.ReactNode }> = ({ ret, t, de, ate, children }) => {
  const entra = prog(t, de, 0.35);
  // não some antes da hora: a célula da pessoa passa por cima dela na troca seguinte e só então ela sai
  const sai = prog(t, ate + DURACAO_TROCA - 0.05, 0.1);
  return (
    <div
      style={{
        position: "absolute",
        left: ret.x,
        top: ret.y,
        width: ret.w,
        height: ret.h,
        background: cor.celula,
        boxShadow: `inset 0 0 0 1.5px ${cor.grade}`,
        // o fundo branco entra rápido (a célula "limpa" o que estava embaixo); o conteúdo vem logo depois
        opacity: Math.min(prog(t, de, 0.12), 1 - sai),
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0, padding: "26px 28px 28px", boxSizing: "border-box", display: "flex", flexDirection: "column", opacity: entra, translate: `0 ${(1 - entra) * 14}px` }}>{children}</div>
    </div>
  );
};

export const DestaqueDaLinha: React.FC<{ m: Linha; ret: Ret; t: number; palavras: Palavra[]; fim: number }> = ({ m, ret, t, palavras, fim }) => {
  const d = m.destaque;
  if (!d) return null;
  const temposRotulo = temposDoTexto(d.rotulo, palavras, m.item.em - 0.3, m.ate, m.item.em);
  const { w, h } = ret;
  const larguraUtil = w - 56;
  return (
    <Moldura ret={ret} t={t} de={m.de} ate={fim}>
      <Cabeca rotulo={d.rotulo} tempos={temposRotulo} t={t} icone={d.icone} iconeEm={m.item.em} largura={larguraUtil} />
      {d.tipo === "infinito" ? (
        <Infinito d={d} t={t} tempos={temposDoTexto(d.texto, palavras, d.em - 0.3, m.ate, d.em)} w={w} h={h} />
      ) : d.tipo === "regras" ? (
        <Regras d={d} t={t} palavras={palavras} ate={m.ate} w={w} />
      ) : d.tipo === "pizza" ? (
        <Pizza d={d} t={t} palavras={palavras} ate={m.ate} w={w} h={h} />
      ) : d.tipo === "numero" ? (
        <Numero d={d} t={t} palavras={palavras} ate={m.ate} w={w} />
      ) : (
        <SoIcone icone={d.icone} texto={d.texto} em={d.em ?? m.item.em} t={t} palavras={palavras} ate={m.ate} w={w} h={h} />
      )}
    </Moldura>
  );
};

export const DestaqueDoPreencher: React.FC<{ m: Preencher; ret: Ret; t: number; palavras: Palavra[]; fim: number }> = ({ m, ret, t, palavras, fim }) => {
  const tempos = temposDoTexto(m.texto, palavras, m.de, m.ate, m.de);
  const temposRotulo = m.rotulo ? temposDoTexto(m.rotulo, palavras, m.de, m.ate, m.de) : [];
  return (
    <Moldura ret={ret} t={t} de={m.de} ate={fim}>
      {m.rotulo ? <Cabeca rotulo={m.rotulo} tempos={temposRotulo} t={t} iconeEm={m.de} largura={ret.w - 56} /> : null}
      <SoIcone icone={m.icone ?? m.marca} texto={m.texto} em={tempos[0] ?? m.de} t={t} palavras={palavras} ate={m.ate} w={ret.w} h={ret.h - (m.rotulo ? 56 : 0)} />
    </Moldura>
  );
};
