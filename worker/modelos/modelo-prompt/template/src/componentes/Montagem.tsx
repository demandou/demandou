// A bancada: título digitado embaixo da janela grande, vagas a lápis; depois a pessoa vai para o
// canto, as vagas crescem e cada peça entra pela esquerda, encaixa o dente na de cima e recebe o
// texto digitado na fala. Ao lado da janela, o cabeçalho diz qual peça está entrando.
import {
  desliza,
  indicesDoTrecho,
  misturaRet,
  prog,
  saindo,
  temposDoTexto,
} from "../anim";
import { ANTES_DA_PECA, CABECALHO, retDaPeca, retDaVaga, TITULO_BANCADA, TROCA } from "../geometria";
import { cabe, encaixar, quebrar } from "../medida";
import { TextoFalado } from "../texto";
import type { Montagem as TipoMontagem, Palavra } from "../plano";
import { cor, corDaPeca, mono, sans } from "../tema";
import { iconeDaPeca } from "./Icones";
import { FormaDaPeca, fundoDoLetreiro, Letreiro, Vaga } from "./Peca";

// Os tempos de uma montagem, usados também pela resposta (que recebe as peças) e pelos sons.
export const temposDaMontagem = (m: TipoMontagem) => {
  const n = m.itens.length;
  const troca = n ? (m.titulo ? Math.max(m.de + 0.8, m.itens[0].em - ANTES_DA_PECA) : m.de) : m.ate;
  // a peça sai da esquerda e assenta (0,42 s); a primeira espera a troca de lugar terminar
  const voo = m.itens.map((it, i) => (i === 0 ? Math.max(it.em + 0.02, troca + TROCA - 0.12) : it.em - 0.12));
  const encaixe = voo.map((v) => v + 0.42);
  return { troca, voo, encaixe };
};

export const textoDaPeca = (m: TipoMontagem, i: number, palavras: Palavra[]) => {
  const it = m.itens[i];
  const { encaixe } = temposDaMontagem(m);
  const ate = m.itens[i + 1]?.em ?? m.ate;
  return temposDoTexto(it.texto, palavras, it.em, ate).map((x) => Math.max(x, encaixe[i] - 0.05));
};

// onde o texto começa dentro da peça (abaixo do letreiro)
const topoDoTexto = (h: number) => Math.min(86, h * 0.4);

// tamanho do texto das peças: o mesmo em todas, o maior em que todos os textos cabem na altura da
// peça (medido com as larguras da fonte; nunca abaixo de 40)
const areaDoTexto = (m: TipoMontagem) => {
  const r = retDaPeca(0, m.itens.length);
  return { largura: r.w - 60, altura: r.h - topoDoTexto(r.h) - 12 };
};
export const tamanhoDasPecas = (m: TipoMontagem) => {
  const { largura, altura } = areaDoTexto(m);
  for (let tam = 56; tam >= 40; tam -= 2) {
    const linhas = Math.max(1, Math.floor(altura / (tam * 1.12)));
    if (m.itens.every((it) => cabe(it.texto, largura, tam, linhas, { peso: 600 }))) return tam;
  }
  return 40;
};
export const linhasDaPeca = (m: TipoMontagem, i: number) => {
  const { largura } = areaDoTexto(m);
  return quebrar(m.itens[i].texto, largura, tamanhoDasPecas(m), { peso: 600 });
};

// A peça cheia, com letreiro, contador e texto.
export const PecaCheia: React.FC<{
  m: TipoMontagem;
  i: number;
  r: { x: number; y: number; w: number; h: number };
  t: number;
  tempos: number[];
  cursorAte: number;
  sombra: number;
  // 1 = texto visível; 0 = só o letreiro (quando a peça encolhe para a caixa)
  texto?: number;
}> = ({ m, i, r, t, tempos, cursorAte, sombra, texto = 1 }) => {
  const it = m.itens[i];
  const c = corDaPeca(i);
  const n = m.itens.length;
  const icone = iconeDaPeca(it.nome ?? "", it.icone, i);
  const topoTexto = topoDoTexto(r.h);
  const tam = tamanhoDasPecas(m);
  return (
    <FormaDaPeca r={r} preenchimento={c.forte} sombra={sombra}>
      <Letreiro
        nome={it.nome ?? ""}
        icone={icone}
        corTexto={c.texto}
        fundo={fundoDoLetreiro(c)}
        estilo={{ position: "absolute", left: 22, top: Math.max(8, Math.min(24, (r.h - 52) / 2)) }}
      />
      <div
        style={{
          position: "absolute",
          right: 28,
          top: 30,
          fontFamily: mono,
          fontWeight: 600,
          fontSize: 32,
          color: c.texto,
          opacity: 0.72 * texto,
          letterSpacing: "0.04em",
        }}
      >
        {i + 1}/{n}
      </div>
      <div
        style={{
          position: "absolute",
          left: 30,
          top: topoTexto - 4,
          width: r.w - 60,
          height: Math.max(0, r.h - topoTexto - 10),
          display: "flex",
          alignItems: "center",
          opacity: texto,
        }}
      >
        <TextoFalado
          linhas={linhasDaPeca(m, i)}
          tempos={tempos}
          t={t}
          tamanho={tam}
          modo="digita"
          entrelinha={1.12}
          cursor={{ cor: c.texto, ate: cursorAte }}
          estilo={{ fontFamily: sans, fontWeight: 600, color: c.texto }}
        />
      </div>
    </FormaDaPeca>
  );
};

// A fila de peças pequenas do cabeçalho (progresso): a lápis até a peça encaixar.
const Fila: React.FC<{ m: TipoMontagem; t: number; encaixe: number[]; atual: number }> = ({ m, t, encaixe, atual }) => {
  const n = m.itens.length;
  const d = 12;
  const w = Math.min(124, (CABECALHO.w - d) / n);
  const h = 78;
  return (
    <div style={{ position: "relative", height: h }}>
      {m.itens.map((it, i) => {
        const c = corDaPeca(i);
        const p = prog(t, encaixe[i] - 0.05, 0.25);
        const r = { x: i * w, y: 0, w: w + 0.5, h };
        return (
          <div key={`fila-${i}`}>
            <FormaDaPeca r={r} preenchimento="rgba(255,255,255,0.45)" traco={cor.lapis} tracejado lateral raio={16} encaixe={i > 0} comDente={i < n - 1} opacidade={1 - p} />
            <FormaDaPeca r={r} preenchimento={c.forte} lateral raio={16} encaixe={i > 0} comDente={i < n - 1} opacidade={p} sombra={i === atual ? 1 : 0}>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: mono,
                  fontWeight: 700,
                  fontSize: 34,
                  color: c.texto,
                }}
              >
                {i + 1}
              </div>
            </FormaDaPeca>
            <div
              style={{
                position: "absolute",
                left: r.x,
                width: r.w,
                top: 0,
                height: h,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: mono,
                fontWeight: 600,
                fontSize: 34,
                color: cor.lapis,
                opacity: 1 - p,
              }}
            >
              {i + 1}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// o nome grande do cabeçalho: o nome da peça (ou, sem nome, o texto dela), no maior corpo que cabe
const nomeGrande = (m: TipoMontagem, i: number) => {
  const it = m.itens[i];
  const texto = it.nome?.trim() || it.texto;
  const max = Math.min(116, it.nome ? 116 : 76);
  return encaixar(texto, { largura: CABECALHO.w, max, min: 44, linhas: it.nome ? 1 : 2, fonte: { peso: 700 } });
};

export const Montagem: React.FC<{
  m: TipoMontagem;
  t: number;
  palavras: Palavra[];
  // a resposta vem logo depois e leva as peças embora (aqui elas param de ser desenhadas)
  entrega: boolean;
  fim: number;
  // depois vem a pessoa em tela cheia: ela cobre a bancada ao crescer, então nada some antes
  cobertaDepois?: boolean;
  // o bloco seguinte da bancada empurra esta página para fora (a troca é feita por fora)
  empurrado?: boolean;
}> = ({ m, t, palavras, entrega, fim, cobertaDepois, empurrado }) => {
  const n = m.itens.length;
  const { troca, voo, encaixe } = temposDaMontagem(m);
  // sem título, as vagas já nascem do tamanho das peças
  const pTroca = m.titulo ? prog(t, troca, 0.6, desliza) : 1;

  // título: palavra por palavra; as vagas aparecem no número dito (ou logo depois do título começar)
  const titulo = m.titulo ?? "";
  const temposTitulo = temposDoTexto(titulo, palavras, m.de, troca, m.de + 0.2);
  const palavrasTitulo = titulo.split(/\s+/).filter(Boolean);
  const kNumero = palavrasTitulo.findIndex((w) => /^\d+$/.test(w) || /^(duas|dois|tr[eê]s|quatro|cinco)$/i.test(w));
  const vagasEm = kNumero >= 0 ? temposTitulo[kNumero] : m.de + 0.6;
  const destaque = indicesDoTrecho(titulo, m.destaque);
  const sTitulo = prog(t, troca, 0.35);
  const encTitulo = encaixar(titulo, { largura: TITULO_BANCADA.w, max: 84, min: 60, linhas: 2, fonte: { peso: 700 } });

  // saída: se a resposta não leva as peças, tudo desliza para fora (ou é empurrado pelo bloco seguinte)
  const sai = entrega || empurrado ? 0 : cobertaDepois ? saindo(t, fim + 0.66, 0.06) : saindo(t, fim + 0.3, 0.35);
  // cabeçalho cruza com a caixa do prompt quando a resposta entra
  const sCabecalho = empurrado ? 0 : saindo(t, fim + 0.25, 0.3);

  // peça atual no cabeçalho
  let atual = 0;
  m.itens.forEach((it, i) => {
    if (t >= it.em - 0.05) atual = i;
  });

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - sai, translate: `${-80 * sai}px 0` }}>
      {/* título da bancada (enquanto a pessoa está na janela grande) */}
      {titulo && t < troca + 0.4 ? (
        <div
          style={{
            position: "absolute",
            left: TITULO_BANCADA.x,
            top: TITULO_BANCADA.y,
            width: TITULO_BANCADA.w,
            opacity: (1 - sTitulo) * prog(t, m.de + 0.05, 0.3),
            translate: `0 ${-40 * sTitulo}px`,
          }}
        >
          <TextoFalado
            linhas={encTitulo.linhas}
            tempos={temposTitulo}
            t={t}
            tamanho={encTitulo.tamanho}
            modo="sobe"
            entrelinha={1.04}
            corDe={(i) => (destaque.has(i) ? corDaPeca(0).escura : undefined)}
            estilo={{ fontFamily: sans, fontWeight: 700, color: cor.tinta, letterSpacing: "-0.015em" }}
          />
        </div>
      ) : null}

      {/* cabeçalho ao lado da janela do canto */}
      {t >= troca - 0.05 ? (
        <div
          style={{
            position: "absolute",
            left: CABECALHO.x,
            top: CABECALHO.y,
            width: CABECALHO.w,
            height: CABECALHO.h,
            opacity: prog(t, troca + 0.22, 0.35) * (1 - sCabecalho),
            translate: `0 ${(1 - prog(t, troca + 0.22, 0.45)) * 36}px`,
          }}
        >
          <div style={{ position: "relative", height: 60, overflow: "hidden" }}>
            {m.itens.map((it, i) => {
              const entra = i === 0 ? 1 : prog(t, it.em - 0.05, 0.35);
              const vai = i < n - 1 ? prog(t, m.itens[i + 1].em - 0.05, 0.35) : 0;
              if (entra <= 0 || vai >= 1) return null;
              return (
                <div
                  key={`rot-${i}`}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 8,
                    fontFamily: mono,
                    fontWeight: 600,
                    fontSize: 34,
                    letterSpacing: "0.07em",
                    color: cor.tintaSuave,
                    textTransform: "uppercase",
                    opacity: entra * (1 - vai),
                    translate: `0 ${(1 - entra) * 30 - vai * 30}px`,
                  }}
                >
                  Peça {i + 1} de {n}
                </div>
              );
            })}
          </div>
          <div style={{ position: "relative", height: 150, overflow: "hidden", marginTop: 4 }}>
            {m.itens.map((it, i) => {
              // a primeira peça: o nome aparece com a troca de lugar (ou quando é dito, se vier bem depois)
              const entra = i === 0 ? prog(t, Math.max(troca + 0.22, it.em - 0.3), 0.4) : prog(t, it.em - 0.05, 0.4);
              const vai = i < n - 1 ? prog(t, m.itens[i + 1].em - 0.05, 0.4) : 0;
              if (entra <= 0 || vai >= 1) return null;
              const grande = nomeGrande(m, i);
              return (
                <div
                  key={`nome-${i}`}
                  style={{
                    position: "absolute",
                    left: -4,
                    top: 0,
                    height: 150,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    fontFamily: sans,
                    fontWeight: 700,
                    fontSize: grande.tamanho,
                    lineHeight: 1.02,
                    letterSpacing: "-0.02em",
                    color: corDaPeca(i).escura,
                    whiteSpace: "nowrap",
                    opacity: entra * (1 - vai),
                    translate: `0 ${(1 - entra) * 110 - vai * 110}px`,
                  }}
                >
                  {grande.linhas.map((l, k) => (
                    <div key={k}>{l.join(" ")}</div>
                  ))}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 52 }}>
            <Fila m={m} t={t} encaixe={encaixe} atual={atual} />
          </div>
        </div>
      ) : null}

      {/* vagas a lápis: pequenas embaixo do título, depois do tamanho da peça na pilha */}
      {m.itens.map((it, i) => {
        const r = misturaRet(retDaVaga(i, n), retDaPeca(i, n), pTroca);
        const aparece = prog(t, m.de + 0.15 + i * 0.08, 0.35);
        const coberta = prog(t, encaixe[i] - 0.06, 0.08);
        if (aparece <= 0 || coberta >= 1 || (entrega && t >= fim)) return null;
        return (
          <Vaga
            key={`vaga-${i}`}
            r={{ ...r, y: r.y + (1 - aparece) * 24 }}
            nome={it.nome ?? ""}
            icone={iconeDaPeca(it.nome ?? "", it.icone, i)}
            opacidade={aparece * (1 - coberta)}
            tamanho={pTroca}
            cor={corDaPeca(i)}
            acesa={prog(t, vagasEm + i * 0.12, 0.25)}
          />
        );
      })}

      {/* peças: entram pela esquerda, sobem um pouco e descem encaixando */}
      {entrega && t >= fim
        ? null
        : m.itens.map((it, i) => {
            if (t < voo[i]) return null;
            const alvo = retDaPeca(i, n);
            const pv = prog(t, voo[i], 0.34);
            const assenta = prog(t, voo[i] + 0.3, 0.14);
            const r = { ...alvo, x: alvo.x - (1 - pv) * (alvo.x + alvo.w + 40), y: alvo.y - 16 * (1 - assenta) };
            return (
              <PecaCheia
                key={`peca-${i}`}
                m={m}
                i={i}
                r={r}
                t={t}
                tempos={textoDaPeca(m, i, palavras)}
                cursorAte={m.itens[i + 1]?.em ?? fim}
                sombra={1 + (1 - assenta)}
              />
            );
          })}
    </div>
  );
};
