// O fechamento: a pessoa volta para a tela cheia e, no peito, o prompt salvo — as peças da última
// montagem em fila, encaixadas pelo lado (sem montagem, a fila das quatro cores) —, a chamada montada
// na fala e o botão tocado na palavra.
// Dois formatos: o universal (`texto`, `icone`, `destaque`: um botão largo, rotulado pela fala) e o
// antigo (`titulo`, `salvarEm`, `testarEm`, `acao`: Salvar + Testar/Seguir/Enviar), que o demo usa.
import { misturaCor, prog, temposDoTexto } from "../anim";
import { CARTAO_PEITO } from "../geometria";
import { encaixar, indicesDoTrecho, larguraTexto } from "../medida";
import type { Cta as TipoCta, Montagem, Palavra, Plano } from "../plano";
import { cor, corDaPeca, mono, sans } from "../tema";
import { TextoFalado } from "../texto";
import { Icone, iconeDaPeca } from "./Icones";
import { FormaDaPeca } from "./Peca";

export const ALTURA_CTA_ANTIGO = 438;
const P = 30;
const LARGURA = CARTAO_PEITO.w;

export const ctaAntigo = (m: TipoCta) => !m.icone && (m.titulo !== undefined || m.salvarEm !== undefined || m.testarEm !== undefined || m.acao !== undefined);
export const textoDoCta = (m: TipoCta) => (m.texto ?? m.titulo ?? "").trim();

// palavras de ação que a pessoa costuma dizer para cada botão
const VERBOS: Record<string, RegExp> = {
  salvar: /^salv/,
  seguir: /^segu/,
  comentar: /^coment/,
  link: /^(toc|clic|aces|link|saib|entr|assist)/,
};
const normal = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

export const temposDoCta = (m: TipoCta, palavras: Palavra[]) => {
  const texto = textoDoCta(m);
  const inicio = m.em ?? m.de + 0.25;
  const tempos = temposDoTexto(texto, palavras, m.em ?? m.de, m.ate, inicio);
  if (ctaAntigo(m)) {
    const salvar = m.salvarEm ?? Math.max(m.de + 0.3, tempos[0] ?? m.de + 0.3);
    const testar = m.testarEm ?? salvar + 0.4;
    return { tempos, salvar, testar, toque: salvar };
  }
  // o botão é tocado na primeira palavra do destaque, ou no verbo da ação, ou no fim da frase
  const ws = texto.split(/\s+/).filter(Boolean);
  const dest = [...indicesDoTrecho(texto, m.destaque)].sort((a, b) => a - b);
  const verbo = ws.findIndex((w) => VERBOS[m.icone ?? "salvar"]?.test(normal(w)));
  const k = dest.length ? dest[0] : verbo >= 0 ? verbo : ws.length - 1;
  const toque = Math.max(m.de + 0.45, (tempos[k] ?? inicio) + 0.12);
  return { tempos, salvar: toque, testar: toque + 0.4, toque };
};

export const Botao: React.FC<{
  texto: string;
  textoDepois: string;
  icone: "salvar" | "seta" | "seguir" | "enviar" | "link" | "balao";
  iconeDepois?: "salvo" | "check";
  t: number;
  em: number;
  largura: number;
  tamanho?: number;
  // o rótulo vem da fala: antes de ser dito, uma barra a lápis no lugar dele
  rotuloEm?: number;
}> = ({ texto, textoDepois, icone, iconeDepois, t, em, largura, tamanho = 44, rotuloEm }) => {
  const p = prog(t, em - 0.04, 0.2);
  const dito = rotuloEm === undefined ? 1 : prog(t, rotuloEm - 0.04, 0.2);
  const aperto = prog(t, em - 0.06, 0.06) - prog(t, em + 0.02, 0.2);
  const corTexto = misturaCor(cor.tinta, "#FFFFFF", p);
  return (
    <div
      style={{
        width: largura,
        height: 96,
        borderRadius: 48,
        border: `3px solid ${cor.tinta}`,
        background: misturaCor("#FFFFFF", cor.tinta, p),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        scale: String(1 - 0.05 * aperto),
        fontFamily: sans,
        fontWeight: 600,
        fontSize: tamanho,
        color: corTexto,
        whiteSpace: "nowrap",
      }}
    >
      <Icone nome={p > 0.5 && iconeDepois ? iconeDepois : icone} tamanho={44} cor={corTexto} espessura={4.2} />
      {dito >= 1 ? (
        p > 0.5 ? textoDepois : texto
      ) : (
        <span style={{ position: "relative", display: "inline-block" }}>
          <span style={{ opacity: dito, filter: dito > 0 ? `blur(${(6 * (1 - dito)).toFixed(2)}px)` : undefined }}>{p > 0.5 ? textoDepois : texto}</span>
          <span style={{ position: "absolute", left: 0, top: "50%", width: "100%", height: 22, marginTop: -11, borderRadius: 11, background: cor.lapisClaro, opacity: 1 - dito }} />
        </span>
      )}
    </div>
  );
};

// a fila de peças no alto do cartão: as peças da última montagem (com os nomes) ou, sem montagem,
// as quatro cores encaixando (a marca do estilo)
export const FilaDePecas: React.FC<{ t: number; de: number; montagem?: Montagem; largura: number; altura?: number }> = ({ t, de, montagem, largura, altura = 74 }) => {
  const itens = montagem?.itens ?? [];
  const n = itens.length || 4;
  const w = itens.length ? largura / n : Math.min(largura / 4, 96);
  return (
    <div style={{ position: "relative", width: largura, height: altura }}>
      {Array.from({ length: n }).map((_, i) => {
        const c = corDaPeca(i);
        const p = prog(t, de + 0.06 + i * 0.05, 0.3);
        const it = itens[i];
        return (
          <FormaDaPeca
            key={`fila-${i}`}
            r={{ x: i * w - (1 - p) * 30, y: 0, w: w + 0.5, h: altura }}
            preenchimento={c.forte}
            lateral
            raio={18}
            encaixe={i > 0}
            comDente={i < n - 1}
            opacidade={p}
          >
            {it ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  paddingLeft: i > 0 ? 10 : 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontFamily: mono,
                  fontWeight: 600,
                  fontSize: 32,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: c.texto,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              >
                {w > 230 ? <Icone nome={iconeDaPeca(it.nome ?? "", it.icone, i)} tamanho={32} cor={c.texto} espessura={4} /> : null}
                {it.nome ?? `${i + 1}`}
              </div>
            ) : null}
          </FormaDaPeca>
        );
      })}
    </div>
  );
};

// ---------- formato antigo (o demo) ----------
const ConteudoAntigo: React.FC<{ m: TipoCta; t: number; plano: Plano; palavras: Palavra[]; montagem?: Montagem }> = ({ m, t, plano, palavras, montagem }) => {
  const { tempos, salvar, testar } = temposDoCta(m, palavras);
  const n = montagem?.itens.length ?? 0;
  const largFila = LARGURA - 60 - 14;
  const acao = m.acao ?? "testar";
  const segundo =
    acao === "seguir"
      ? { texto: "Seguir", depois: "Seguindo", icone: "seguir" as const }
      : acao === "enviar"
        ? { texto: "Enviar", depois: "Enviado", icone: "enviar" as const }
        : { texto: "Testar agora", depois: "Testando", icone: "seta" as const };
  const texto = textoDoCta(m);
  return (
    <>
      {n ? (
        <div style={{ position: "absolute", left: 30, top: 28 }}>
          <FilaDePecas t={t} de={m.de} montagem={montagem} largura={largFila} />
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 30, right: 30, top: n ? 124 : 60 }}>
        <TextoFalado
          linhas={[texto.split(/\s+/).filter(Boolean)]}
          tempos={tempos}
          t={t}
          tamanho={72}
          modo="sobe"
          entrelinha={1.04}
          estilo={{ fontFamily: sans, fontWeight: 700, color: cor.tinta, letterSpacing: "-0.015em" }}
        />
      </div>
      <div style={{ position: "absolute", left: 30, right: 30, top: n ? 232 : 190, display: "flex", gap: 18 }}>
        <Botao texto="Salvar" textoDepois="Salvo" icone="salvar" iconeDepois="salvo" t={t} em={salvar} largura={262} />
        <Botao texto={segundo.texto} textoDepois={segundo.depois} icone={segundo.icone} t={t} em={testar} largura={LARGURA - 60 - 262 - 18} />
      </div>
      <Assinatura plano={plano} t={t} de={m.de} estilo={{ position: "absolute", left: 30, bottom: 26 }} />
    </>
  );
};

// nome · área; se não couber na largura do cartão, a área sai e o corpo diminui (até 30)
export const Assinatura: React.FC<{ plano: Plano; t: number; de: number; estilo?: React.CSSProperties; largura?: number }> = ({ plano, t, de, estilo, largura = LARGURA - 60 }) => {
  const { nome, area } = plano.marca;
  if (!nome) return null;
  const comArea = !!area && larguraTexto(nome, 36, { peso: 700 }) + 28 + larguraTexto(area, 36, { peso: 500 }) <= largura;
  let tam = 36;
  while (tam > 30 && larguraTexto(nome, tam, { peso: 700 }) > largura) tam -= 2;
  return <AssinaturaFixa plano={{ ...plano, marca: { nome, area: comArea ? area : "" } }} t={t} de={de} estilo={{ fontSize: tam, ...estilo }} />;
};

const AssinaturaFixa: React.FC<{ plano: Plano; t: number; de: number; estilo?: React.CSSProperties }> = ({ plano, t, de, estilo }) =>
  plano.marca.nome ? (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        fontFamily: sans,
        fontSize: 36,
        color: cor.tintaSuave,
        whiteSpace: "nowrap",
        opacity: prog(t, de + 0.3, 0.3),
        ...estilo,
      }}
    >
      <span style={{ fontWeight: 700, color: cor.tinta }}>{plano.marca.nome}</span>
      {plano.marca.area ? <span style={{ width: 7, height: 7, borderRadius: 4, background: cor.lapis }} /> : null}
      {plano.marca.area ? <span style={{ fontWeight: 500 }}>{plano.marca.area}</span> : null}
    </div>
  ) : null;

// ---------- formato universal ----------
const ROTULO: Record<string, { antes: string; depois: string; icone: "salvar" | "seguir" | "balao" | "link"; depoisIcone?: "salvo" | "check" }> = {
  salvar: { antes: "Salvar", depois: "Salvo", icone: "salvar", depoisIcone: "salvo" },
  seguir: { antes: "Seguir", depois: "Seguindo", icone: "seguir", depoisIcone: "check" },
  comentar: { antes: "Comentar", depois: "Comentário enviado", icone: "balao", depoisIcone: "check" },
  link: { antes: "Abrir o link", depois: "Abrindo", icone: "link", depoisIcone: "check" },
};

export const layoutCta = (m: TipoCta, plano: Plano, montagem: Montagem | undefined, livre: number) => {
  if (ctaAntigo(m)) return { h: ALTURA_CTA_ANTIGO, fila: true, texto: null };
  const texto = textoDoCta(m);
  const larg = LARGURA - 2 * P;
  const enc = encaixar(texto, { largura: larg, max: 68, min: 46, linhas: 2, fonte: { peso: 700 } });
  const altTexto = enc.linhas.length * enc.tamanho * 1.06;
  const assinatura = plano.marca.nome ? 56 : 0;
  const comFila = (montagem?.itens.length ?? 0) > 0;
  const cheio = (fila: number) => 28 + fila + altTexto + 22 + 96 + assinatura + 26;
  // sem montagem, a fila das quatro cores é enfeite: sai primeiro se faltar lugar
  let fila = comFila ? 74 + 20 : 52 + 20;
  if (!comFila && cheio(fila) > livre) fila = 0;
  return { h: cheio(fila), fila: fila > 0, texto: enc };
};

export const ConteudoCta: React.FC<{ m: TipoCta; t: number; plano: Plano; palavras: Palavra[]; montagem?: Montagem; livre: number }> = ({
  m,
  t,
  plano,
  palavras,
  montagem,
  livre,
}) => {
  if (ctaAntigo(m)) return <ConteudoAntigo m={m} t={t} plano={plano} palavras={palavras} montagem={montagem} />;
  const L = layoutCta(m, plano, montagem, livre);
  const enc = L.texto!;
  const { tempos, toque } = temposDoCta(m, palavras);
  const texto = textoDoCta(m);
  const dest = indicesDoTrecho(texto, m.destaque);
  const comFila = (montagem?.itens.length ?? 0) > 0;
  const filaH = L.fila ? (comFila ? 74 : 52) : 0;
  const yTexto = 28 + (L.fila ? filaH + 20 : 0);
  const altTexto = enc.linhas.length * enc.tamanho * 1.06;
  const r = ROTULO[m.icone ?? "salvar"];
  // no link, o botão leva as palavras da fala (o destaque: "Saiba Mais")
  const rotuloLink = m.icone === "link" && m.destaque ? m.destaque : null;
  const antes = rotuloLink ?? r.antes;
  const depois = rotuloLink ?? r.depois;
  const larguraBotao = LARGURA - 2 * P;
  const tamBotao = Math.min(44, Math.floor((44 * (larguraBotao - 120)) / Math.max(1, larguraTexto(depois.length > antes.length ? depois : antes, 44, { peso: 600 }))));
  return (
    <>
      {L.fila ? (
        <div style={{ position: "absolute", left: P, top: 28 }}>
          <FilaDePecas t={t} de={m.de} montagem={montagem} largura={comFila ? LARGURA - 2 * P - 14 : 4 * 96} altura={filaH} />
        </div>
      ) : null}
      <div style={{ position: "absolute", left: P, top: yTexto, width: LARGURA - 2 * P }}>
        <TextoFalado
          linhas={enc.linhas}
          tempos={tempos}
          t={t}
          tamanho={enc.tamanho}
          modo="sobe"
          entrelinha={1.06}
          corDe={(i) => (dest.has(i) ? corDaPeca(0).escura : undefined)}
          estilo={{ fontFamily: sans, fontWeight: 700, color: cor.tinta, letterSpacing: "-0.015em" }}
        />
      </div>
      <div style={{ position: "absolute", left: P, top: yTexto + altTexto + 22 }}>
        <Botao
          texto={antes}
          textoDepois={depois}
          icone={rotuloLink ? "link" : r.icone}
          iconeDepois={rotuloLink ? "check" : r.depoisIcone}
          t={t}
          em={toque}
          largura={larguraBotao}
          tamanho={Math.max(36, tamBotao)}
          rotuloEm={rotuloLink ? toque - 0.12 : undefined}
        />
      </div>
      <Assinatura plano={plano} t={t} de={m.de} estilo={{ position: "absolute", left: P, bottom: 26 }} />
    </>
  );
};
