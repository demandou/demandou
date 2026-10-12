// Cartão de produto: amostra do tecido, linhas de atributo (cor, tecido, corte…), amostras
// alternativas ("couro ou metal"), cores que combinam e preço. Chega já desenhado "a lápis"
// (rótulos e esboços cinza) e cada linha ganha tinta quando a palavra dela é dita.
import { prog, Sobe, tinta } from "../anim";
import type { Peca } from "../plano";
import { corDe, cor, rotulo, serifa, sans, caber, LARGURA_SERIFA } from "../tema";
import { encaixar, largura as medirLargura } from "../medida";
import { Amostra } from "./Amostra";

const PAD = 36;
// alturas (px) usadas para posicionar o cartão sem medir o DOM
const H_ROTULO = 36;
const H_VALOR = 68;
const H_FIO = 38;
const H_NOME = 160;

// rótulo em caixa alta: uma linha (ou duas, se for longo)
const linhasDoRotulo = (texto: string, largura: number) =>
  medirLargura(texto, 32, "sans500", 0.18, true) <= largura ? 1 : 2;
const Rotulo: React.FC<{ texto: string; p: number; largura?: number }> = ({ texto, p, largura = 9999 }) => (
  <div style={{ ...rotulo, color: p > 0.5 ? cor.grafite : cor.lapis, height: linhasDoRotulo(texto, largura) > 1 ? H_ROTULO * 2 : undefined }}>{texto}</div>
);

// valor medido: o corpo de sempre se couber numa linha; senão, quebra em duas (até 40 px)
const medirValor = (texto: string, largura: number, tamanho = 52) => {
  const corpo = caber(texto, largura, tamanho, LARGURA_SERIFA * 0.92, 44);
  if (medirLargura(texto, corpo, "serifa") <= largura) return { corpo, linhas: [texto] };
  const e = encaixar(texto, { largura, max: corpo, min: 40, linhas: 2, estilo: "serifa", entrelinha: 1.1 });
  return { corpo: e.tamanho, linhas: e.linhas };
};
const alturaDoValor = (texto: string, largura: number, tamanho = 52) => {
  const v = medirValor(texto, largura, tamanho);
  return Math.max(H_VALOR, 12 + v.linhas.length * v.corpo * 1.1);
};

// valor: antes da palavra, um traço tracejado a lápis; depois, o texto sobe em tinta
const Valor: React.FC<{ texto: string; p: number; largura: number; tamanho?: number }> = ({ texto, p, largura, tamanho = 52 }) => {
  const { corpo, linhas } = medirValor(texto, largura, tamanho);
  return (
    <div style={{ position: "relative", height: alturaDoValor(texto, largura, tamanho) - 6, marginTop: 6 }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: corpo * 0.62,
          width: Math.min(largura, texto.length * corpo * 0.42),
          borderTop: `3px dashed ${cor.lapis}`,
          opacity: 1 - prog(p, 0, 0.5),
        }}
      />
      <div style={{ position: "absolute", left: 0, top: 0, fontFamily: serifa, fontSize: corpo, lineHeight: 1.1, color: cor.tinta, whiteSpace: "nowrap" }}>
        {linhas.map((l, i) => (
          <Sobe key={i} p={p}>
            {l}
          </Sobe>
        ))}
      </div>
    </div>
  );
};

const Fio: React.FC = () => <div style={{ height: 2, background: "rgba(23,22,20,0.16)", margin: `${(H_FIO - 2) / 2}px 0` }} />;

// bolinha dividida: metade a cor da peça, metade a outra cor ("combina com")
const Par: React.FC<{ a: string; b: string; p: number; r: number }> = ({ a, b, p, r }) => {
  const s = prog(p, 0, 1);
  return (
    <svg width={r * 2 + 4} height={r * 2 + 4} style={{ display: "block", overflow: "visible" }}>
      <circle cx={r + 2} cy={r + 2} r={r} fill="none" stroke={cor.lapis} strokeWidth={2.5} strokeDasharray="7 6" opacity={1 - s} />
      <g opacity={s} transform={`translate(${r + 2} ${r + 2}) scale(${0.6 + 0.4 * s}) translate(${-r - 2} ${-r - 2})`}>
        <path d={`M${r + 2} 2 A${r} ${r} 0 0 0 ${r + 2} ${2 * r + 2} Z`} fill={a} />
        <path d={`M${r + 2} 2 A${r} ${r} 0 0 1 ${r + 2} ${2 * r + 2} Z`} fill={b} />
        <circle cx={r + 2} cy={r + 2} r={r} fill="none" stroke="rgba(23,22,20,0.35)" strokeWidth={2} />
      </g>
    </svg>
  );
};

// cartão com pouca coisa embaixo ganha uma amostra mais alta (o cartão não fica magro)
const alturaDaAmostra = (m: Peca, comNome: boolean) => {
  const secoes = (m.atributos ?? []).length + (m.variantes ? 1.5 : 0) + (m.combina ? 1 : 0) + (m.preco ? 0.5 : 0) + (comNome ? 1 : 0);
  return secoes <= 1 ? 250 : 176;
};

const H_VARIANTES = H_ROTULO + 14 + 124 + 10 + 50;
const H_COMBINA = H_ROTULO + 14 + 80;

// cartão só com uma ou duas linhas (sem amostra nem extras): o valor dito fica maior
const fichaCurta = (m: Peca) => !m.amostra && !m.variantes && !m.combina && (m.atributos ?? []).length <= 2;

// o cartão tem algo para mostrar além do nome?
export const temConteudo = (m: Peca) => !!(m.amostra || m.atributos?.length || m.variantes || m.combina || m.preco);

// nome do item dentro do cartão (layouts sem coluna): uma linha, ou duas quando é longo
const medirNome = (m: Peca, largura: number) => {
  const junto = m.nome + (m.complemento ? ` ${m.complemento}` : "");
  const s = caber(junto, largura, 86, 0.4, 60);
  if (medirLargura(m.nome, s, "italico") + (m.complemento ? medirLargura(` ${m.complemento}`, s * 0.62, "serifa") : 0) <= largura) return { tamanho: s, duas: false };
  const e = encaixar(m.nome, { largura, max: 72, min: 48, linhas: 2, estilo: "italico" });
  return { tamanho: e.tamanho, duas: true, linhas: e.linhas };
};
const alturaDoNome = (m: Peca, largura: number) => {
  const n = medirNome(m, largura);
  if (!n.duas) return H_NOME;
  return 50 + (n.linhas?.length ?? 1) * n.tamanho * 1.12 + (m.complemento ? 50 : 0) + 10;
};

export const alturaDaFicha = (m: Peca, comAmostra: boolean, comNome: boolean, w = 470) => {
  const largura = w - PAD * 2;
  let h = PAD * 2;
  if (comNome) h += alturaDoNome(m, largura);
  if (comAmostra && m.amostra) h += alturaDaAmostra(m, comNome) + 26;
  const atributos = m.atributos ?? [];
  const linhas = atributos.length;
  h += atributos.reduce((a, at) => a + H_ROTULO * linhasDoRotulo(at.rotulo, largura) + alturaDoValor(at.valor, largura, fichaCurta(m) ? 76 : 52), 0) + Math.max(0, linhas - 1) * H_FIO;
  if (m.variantes) h += (linhas ? H_FIO : 0) + H_VARIANTES;
  if (m.combina) h += (linhas || m.variantes ? H_FIO : 0) + H_COMBINA;
  if (m.preco) h += H_FIO + 70;
  return h;
};

export const Ficha: React.FC<{
  m: Peca;
  t: number;
  x: number;
  y: number;
  w: number;
  // de onde o cartão chega: -1 esquerda, 1 direita, 0 de baixo
  lado: -1 | 0 | 1;
  fora: number;
  id: string;
  comAmostra?: boolean;
  comNome?: boolean;
}> = ({ m, t, x, y, w, lado, fora, id, comAmostra = true, comNome = false }) => {
  const entra = prog(t, m.de + 0.28, 0.6);
  const largura = w - PAD * 2;
  const base = corDe(m.amostra?.cor);
  const desloca = (1 - entra) * 90 + fora * 60;
  const tx = lado === 0 ? 0 : lado * desloca;
  const ty = lado === 0 ? desloca : 0;
  const atributos = m.atributos ?? [];
  const numero = m.numero ? String(m.numero).padStart(2, "0") : null;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        padding: PAD,
        boxSizing: "border-box",
        background: cor.folha,
        boxShadow: "0 22px 48px rgba(30,24,16,0.20), 0 2px 6px rgba(30,24,16,0.10)",
        opacity: Math.min(1, entra * 1.6) * (1 - fora),
        translate: `${tx}px ${ty}px`,
      }}
    >
      {comNome && medirNome(m, largura).duas ? (
        <div style={{ height: alturaDoNome(m, largura) }}>
          {numero ? <div style={{ ...rotulo, color: cor.indigo }}>Nº {numero}</div> : null}
          <div style={{ fontFamily: serifa, fontStyle: "italic", fontSize: medirNome(m, largura).tamanho, lineHeight: 1.12, color: cor.tinta, marginTop: 10, whiteSpace: "nowrap" }}>
            {(medirNome(m, largura).linhas ?? [m.nome]).map((l, i) => (
              <Sobe key={i} p={prog(t, m.nomeEm - 0.04, 0.4)}>
                {l}
              </Sobe>
            ))}
          </div>
          {m.complemento ? (
            <div style={{ fontFamily: sans, fontSize: 40, color: cor.grafite, marginTop: 6, opacity: prog(t, (m.complementoEm ?? m.nomeEm + 0.25) - 0.04, 0.35) }}>{m.complemento}</div>
          ) : null}
        </div>
      ) : comNome ? (
        <div style={{ height: H_NOME }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
            {numero ? <div style={{ ...rotulo, color: cor.indigo }}>Nº {numero}</div> : null}
          </div>
          <div style={{ fontFamily: serifa, fontStyle: "italic", fontSize: caber(m.nome + (m.complemento ? ` ${m.complemento}` : ""), largura, 86, 0.4, 60), lineHeight: 1.12, color: tinta(t, m.nomeEm) > 0.5 ? cor.tinta : cor.lapis, marginTop: 10 }}>
            <Sobe p={Math.max(0.0001, prog(t, m.nomeEm - 0.04, 0.4))}>
              {m.nome}
              {m.complemento ? (
                <span style={{ fontSize: "0.62em", color: cor.grafite, marginLeft: "0.3em", opacity: prog(t, (m.complementoEm ?? m.nomeEm + 0.25) - 0.04, 0.35) }}>
                  {m.complemento}
                </span>
              ) : null}
            </Sobe>
          </div>
        </div>
      ) : null}

      {comAmostra && m.amostra ? (
        <div style={{ position: "relative", marginBottom: 26 }}>
          <Amostra id={`${id}-amostra`} w={largura} h={alturaDaAmostra(m, comNome)} base={base} tecido={m.amostra.tecido} p={prog(t, m.amostra.em - 0.04, 0.55)} />
        </div>
      ) : null}

      {atributos.map((a, i) => {
        const p = tinta(t, a.em);
        return (
          <div key={`${a.rotulo}-${i}`}>
            {i > 0 ? <Fio /> : null}
            <Rotulo texto={a.rotulo} p={p} largura={largura} />
            <Valor texto={a.valor} p={prog(t, a.em - 0.04, 0.42)} largura={largura} tamanho={fichaCurta(m) ? 76 : 52} />
          </div>
        );
      })}

      {m.variantes ? (
        <div>
          {atributos.length ? <Fio /> : null}
          <Rotulo texto={m.variantes.rotulo} p={prog(t, (m.variantes.em ?? m.variantes.itens[0].em) - 0.04, 0.3)} />
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginTop: 14 }}>
            {m.variantes.itens.map((v, i) => {
              const p = prog(t, v.em - 0.04, 0.5);
              const lado2 = Math.floor((largura - 84 * (m.variantes!.itens.length - 1)) / m.variantes!.itens.length);
              return (
                <div key={v.nome} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  {i > 0 ? (
                    <div style={{ width: 56, textAlign: "center", fontFamily: serifa, fontStyle: "italic", fontSize: 48, color: p > 0.3 ? cor.grafite : cor.lapis, paddingTop: 30 }}>
                      {m.variantes!.conector ?? "ou"}
                    </div>
                  ) : null}
                  <div style={{ width: lado2 }}>
                    <Amostra id={`${id}-var-${i}`} w={lado2} h={124} base={corDe(v.cor)} tecido={v.tecido} p={p} />
                    <div style={{ fontFamily: sans, fontWeight: 400, fontSize: 44, lineHeight: 1.1, marginTop: 10, color: p > 0.4 ? cor.tinta : cor.lapis }}>{v.nome}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {m.combina ? (
        <div>
          {atributos.length || m.variantes ? <Fio /> : null}
          <Rotulo texto={m.combina.rotulo ?? "Combina com"} p={prog(t, m.combina.em - 0.04, 0.3)} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
            {m.combina.cores.map((c, i) => {
              const n = m.combina!.cores.length;
              const fim = m.combina!.ate ?? m.combina!.em + 0.9;
              const em = m.combina!.em + ((fim - m.combina!.em) * i) / Math.max(1, n - 1);
              const r = Math.min(38, Math.floor((largura - (n - 1) * 12) / n / 2));
              return <Par key={`${c}-${i}`} a={base} b={corDe(c)} r={r} p={prog(t, em - 0.04, 0.35)} />;
            })}
          </div>
        </div>
      ) : null}

      {m.preco ? (
        <div>
          <Fio />
          <div style={{ fontFamily: serifa, fontSize: 60, lineHeight: 1.1, color: cor.indigo }}>
            <Sobe p={prog(t, m.preco.em - 0.04, 0.42)}>{m.preco.valor}</Sobe>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export const NOME_TECIDO: Record<string, string> = {
  liso: "",
  algodao: "algodão",
  linho: "linho",
  sarja: "sarja",
  jeans: "jeans",
  malha: "malha",
  la: "lã",
  seda: "seda",
  couro: "couro",
  metal: "metal",
};
