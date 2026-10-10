// Células mescladas grandes: o título da abertura (em cima da pessoa), a célula larga do fechamento
// e da frase (embaixo da pessoa) e a célula da própria pessoa.
import { digitado, fimDaDigitacao, formatar, limitar, piscando, prog, temposDoTexto } from "../anim";
import type { CaixaPessoa, Ret } from "../grade";
import { VideoNaCaixa } from "../motor/caixa";
import { type Abertura, type Celula as TCelula, type Cta, type Palavra, textoDaAbertura } from "../plano";
import { encaixar, larguraTexto, quebrarLinhas, umaLinha } from "../medida";
import { cor, rotuloCaixaAlta, sans } from "../tema";
import { Esboco, TextoFalado } from "./Texto";
import { Icone } from "./Icones";

// Maior corpo (entre `min` e `max`) em que o texto cabe em `linhas` linhas de `largura`, medido com as
// larguras reais da fonte (peso 600). `extra`: largura de algo que vem depois do texto (o selo).
const corpoQueCabe = (texto: string, largura: number, linhas: number, max: number, min: number, extra = 0) => {
  for (let s = max; s > min; s -= 2) {
    const quebra = quebrarLinhas(texto, largura, s, { peso: 600 });
    const ultima = quebra[quebra.length - 1] ?? "";
    let n = quebra.length;
    if (extra > 0 && larguraTexto(ultima, s, { peso: 600 }) + s * 0.3 + extra > largura) n++;
    if (n <= linhas && quebra.every((l) => larguraTexto(l, s, { peso: 600 }) <= largura)) return s;
  }
  return min;
};

// ---------- abertura ----------

export const CelulaTitulo: React.FC<{ m: Abertura; ret: Ret; t: number; palavras: Palavra[]; fim: number }> = ({ m, ret, t, palavras, fim }) => {
  const titulo = textoDaAbertura(m);
  const tempos = temposDoTexto(titulo, palavras, m.em !== undefined ? m.em - 0.3 : m.de, m.ate, m.em ?? m.de);
  const selo = m.selo;
  const temposSelo = selo ? temposDoTexto(selo.texto, palavras, tempos[tempos.length - 1] ?? m.de, m.ate, (tempos[tempos.length - 1] ?? m.de) + 0.2) : [];
  const confirma = selo ? prog(t, selo.confirmaEm ?? (temposSelo[temposSelo.length - 1] ?? m.ate) + 0.2, 0.3) : 0;
  const larguraSelo = selo ? larguraTexto(selo.texto, 40, { peso: 600 }) + 60 + 48 : 0;
  const tamanho = corpoQueCabe(titulo, ret.w - 64, 3, 76, 56, larguraSelo + 20);
  const fimTitulo = fimDaDigitacao(titulo, tempos);
  const editando = t >= (tempos[0] ?? 0) && t < fimTitulo + 0.4;
  // fica até a pessoa subir por cima dela (a célula de destaque cobre o lado direito)
  const sai = prog(t, fim + 0.3, 0.2);
  const seloVisivel = selo ? digitado(selo.texto, temposSelo, t) : "";
  return (
    <div style={{ position: "absolute", left: ret.x, top: ret.y, width: ret.w, height: ret.h, background: cor.celula, boxShadow: `inset 0 0 0 1.5px ${cor.grade}`, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          opacity: 1 - sai,
          translate: `0 ${-30 * sai}px`,
        }}
      >
        {t < (tempos[0] ?? m.de) - 0.02 ? (
          // antes da primeira palavra: o título espera "a lápis"
          <div style={{ position: "absolute", left: 32, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 22 }}>
            <Esboco w={ret.w * 0.62} h={26} />
            <Esboco w={ret.w * 0.38} h={26} />
          </div>
        ) : null}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", fontFamily: sans, fontWeight: 600, fontSize: tamanho, lineHeight: 1.06, color: cor.tinta, letterSpacing: "-0.01em" }}>
          <TextoFalado texto={titulo} tempos={tempos} t={t} destaque={m.destaque} cursor={!seloVisivel} style={{ display: "contents" }} />
          {selo && seloVisivel ? (
            <div
              style={{
                marginLeft: tamanho * 0.3,
                display: "flex",
                alignItems: "center",
                gap: 10,
                height: 62,
                padding: "0 24px",
                borderRadius: 31,
                border: `3px solid ${cor.acento}`,
                background: `rgba(${cor.acentoRgb},${confirma})`,
                color: confirma > 0.5 ? "#FFFFFF" : cor.acento,
                fontSize: 40,
                fontWeight: 600,
                letterSpacing: 0,
                whiteSpace: "nowrap",
              }}
            >
              {confirma > 0 ? <Icone nome="check" tamanho={36 * confirma} cor="#FFFFFF" peso={5} p={confirma} /> : null}
              {seloVisivel}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

// ---------- célula larga (fechamento e frase) ----------

const Moldura: React.FC<{ ret: Ret; t: number; de: number; fim: number; children: React.ReactNode }> = ({ ret, t, de, fim, children }) => {
  const entra = prog(t, de, 0.4);
  const sai = prog(t, fim - 0.25, 0.25);
  return (
    <div style={{ position: "absolute", left: ret.x, top: ret.y, width: ret.w, height: ret.h, background: cor.celula, boxShadow: `inset 0 0 0 1.5px ${cor.grade}`, opacity: Math.min(prog(t, de, 0.12), 1 - sai), overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, padding: "30px 40px", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 34, opacity: entra, translate: `0 ${(1 - entra) * 20}px` }}>{children}</div>
    </div>
  );
};

export const CelulaCta: React.FC<{ m: Cta; ret: Ret; t: number; palavras: Palavra[]; fim: number }> = ({ m, ret, t, palavras, fim }) => {
  const tempos = temposDoTexto(m.texto, palavras, m.em !== undefined ? m.em - 0.3 : m.de, m.ate + 1, m.em ?? m.de);
  const iconeEm = m.iconeEm ?? tempos[0] ?? m.de + 0.3;
  const p = prog(t, iconeEm, 0.4);
  const icone = m.icone ?? "salvar";
  // o ladrilho do ícone acompanha a altura da célula (célula baixa = ladrilho menor)
  const ladrilho = Math.min(170, ret.h - 70);
  const larguraUtil = ret.w - 80 - ladrilho - 34;
  const enc = encaixar(m.texto, { largura: larguraUtil, max: ret.h >= 400 ? 84 : 72, min: 52, linhas: 2, fonte: { peso: 600 } });
  return (
    <Moldura ret={ret} t={t} de={m.de} fim={fim}>
      <div style={{ width: ladrilho, height: ladrilho, borderRadius: ladrilho * 0.22, background: `rgba(${cor.acentoRgb},${0.1 + 0.9 * p})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, scale: String(1 + 0.06 * Math.sin(limitar(p) * Math.PI)) }}>
        <Icone nome={icone} tamanho={ladrilho * 0.61} cor={p > 0.5 ? "#FFFFFF" : cor.acento} peso={3.6} cheio={icone === "salvar" ? p : 0} p={icone === "salvar" ? 1 : Math.max(0.001, prog(t, iconeEm - 0.1, 0.6))} />
      </div>
      {t < (tempos[0] ?? m.de) ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <Esboco w={larguraUtil * 0.8} h={24} />
          <Esboco w={larguraUtil * 0.5} h={24} />
        </div>
      ) : (
        <TextoFalado texto={m.texto} tempos={tempos} t={t} destaque={m.destaque} linhas={enc.linhas} cursor style={{ fontFamily: sans, fontWeight: 600, fontSize: enc.tamanho, color: cor.tinta, lineHeight: 1.06, letterSpacing: "-0.01em" }} />
      )}
    </Moldura>
  );
};

export const CelulaFrase: React.FC<{ m: TCelula; ret: Ret; t: number; palavras: Palavra[]; fim: number }> = ({ m, ret, t, palavras, fim }) => {
  const tempos = temposDoTexto(m.texto, palavras, m.de, m.ate, m.de);
  const n = m.numero;
  const pn = n ? prog(t, n.em, 0.8) : 0;
  const numeroFinal = n ? `${n.prefixo ? `${n.prefixo} ` : ""}${formatar(n.valor, n.casas ?? 0)}${n.sufixo ?? ""}` : "";
  const numeroAgora = n ? `${n.prefixo ? `${n.prefixo} ` : ""}${formatar(n.valor * pn, n.casas ?? 0)}${n.sufixo ?? ""}` : "";
  const larguraTexto = ret.w - 80;
  // altura útil: rótulo (30) + texto + número cabem na célula
  const tamanho = corpoQueCabe(m.texto, larguraTexto, n ? 2 : 3, n ? 62 : 76, 52);
  const tamanhoNumero = umaLinha(numeroFinal, larguraTexto, n && ret.h < 380 ? 92 : 120, 60, { peso: 700 });
  return (
    <Moldura ret={ret} t={t} de={m.de} fim={fim}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: larguraTexto }}>
        {m.rotulo ? <div style={{ ...rotuloCaixaAlta, fontWeight: 700, color: cor.acento }}>{m.rotulo}</div> : null}
        {t < (tempos[0] ?? m.de) ? (
          <Esboco w={larguraTexto * 0.75} h={24} />
        ) : (
          <TextoFalado texto={m.texto} tempos={tempos} t={t} destaque={m.destaque} style={{ fontFamily: sans, fontWeight: 600, fontSize: tamanho, color: cor.tinta, lineHeight: 1.06 }} />
        )}
        {n ? (
          <div style={{ fontFamily: sans, fontWeight: 700, fontSize: tamanhoNumero, color: pn > 0 ? cor.acento : cor.esboco, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
            {pn > 0 ? numeroAgora : numeroFinal.replace(/\d/g, "0")}
          </div>
        ) : null}
      </div>
    </Moldura>
  );
};

// ---------- a pessoa ----------

// A célula da pessoa: o vídeo dentro de uma célula mesclada, com a etiqueta do nome no pé.
// É a única cópia do vídeo (com som) e fica montada o vídeo inteiro.
export const CelulaPessoa: React.FC<{ c: CaixaPessoa; video: string; rosto: { x: number; y: number }; videoAltura: number; nome: string; area: string }> = ({
  c,
  video,
  rosto,
  videoAltura,
  nome,
  area,
}) => {
  // a área só aparece se couber inteira na etiqueta (célula estreita mostra só o nome)
  const larguraEtiqueta = (nome.length * 0.6 + (area ? area.length * 0.56 + 1.2 : 0)) * 34 + 70;
  const mostraArea = !!area && larguraEtiqueta <= c.w - 36;
  return (
    <div style={{ position: "absolute", left: c.x, top: c.y, width: c.w, height: c.h, overflow: "hidden", background: "#000", boxShadow: `0 0 0 1.5px ${cor.gradeForte}` }}>
      <VideoNaCaixa src={video} caixa={{ ...c, x: 0, y: 0 }} rosto={rosto} videoAltura={videoAltura} filtro="saturate(1.02) contrast(1.03)" />
      {nome ? (
        <div
          style={{
            position: "absolute",
            left: 18,
            bottom: 18,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 18px 9px 14px",
            borderRadius: 12,
            background: "rgba(255,255,255,0.94)",
            fontFamily: sans,
            fontSize: 34,
            lineHeight: 1.1,
            whiteSpace: "nowrap",
            maxWidth: c.w - 36,
            overflow: "hidden",
            boxSizing: "border-box",
          }}
        >
          <div style={{ width: 8, height: 34, borderRadius: 4, background: cor.acento }} />
          <span style={{ fontWeight: 700, color: cor.tinta }}>{nome}</span>
          {mostraArea ? <span style={{ fontWeight: 500, color: cor.tintaSuave }}>· {area}</span> : null}
        </div>
      ) : null}
    </div>
  );
};

// Formigas: o contorno tracejado que anda em volta do lugar para onde a célula da pessoa vai
// (como o "recortar" de uma planilha).
export const Formigas: React.FC<{ ret: Ret; t: number; de: number; ate: number }> = ({ ret, t, de, ate }) => {
  const o = Math.min(prog(t, de, 0.12), 1 - prog(t, ate - 0.18, 0.18));
  if (o <= 0) return null;
  return (
    <svg style={{ position: "absolute", left: ret.x - 3, top: ret.y - 3, overflow: "visible" }} width={ret.w + 6} height={ret.h + 6}>
      <rect x={1.5} y={1.5} width={ret.w + 3} height={ret.h + 3} fill="none" stroke="#FFFFFF" strokeWidth={5} opacity={o} />
      <rect x={1.5} y={1.5} width={ret.w + 3} height={ret.h + 3} fill="none" stroke={cor.acento} strokeWidth={5} strokeDasharray="16 12" strokeDashoffset={-t * 70} opacity={o} />
    </svg>
  );
};
