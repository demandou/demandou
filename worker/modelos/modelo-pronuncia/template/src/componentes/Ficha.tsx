import { prog, saindo, useRotulos } from "../anim";
import type { Janela } from "../layout";
import { encaixar, largura as medir } from "../medida";
import { Foto, imagemDoPlano, temImagem } from "../motor/imagem";
import type { Plano, Pronuncia, Silaba } from "../plano";
import { cor, fonetica, rotulo, sans } from "../tema";
import { type Alvo, Ponto, Traco } from "./Ponto";

// A ficha de som (assinatura do Pronúncia): a palavra enorme dividida em sílabas, o ponto
// pulando até a sílaba forte, a fonética, a pronúncia errada riscada, o jeito certo de ler com
// um traço desenhado embaixo e a foto do significado no canto. Fica no painel de cima; a pessoa
// está na moldura larga embaixo.

export const silabasDe = (m: Pronuncia): Silaba[] =>
  m.silabas?.length ? m.silabas : [{ texto: m.palavra, forte: true }];

// partes da leitura ("KÂMF-ter-bou" → ["KÂMF", "ter", "bou"]); a forte é a que está em maiúsculas
export const partesDaLeitura = (leitura?: string) => (leitura ?? "").split(/[-·.\s]+/).filter(Boolean);
const ehForte = (parte: string) => parte.length > 1 && parte === parte.toUpperCase() && /\p{L}/u.test(parte);

// Onde cada sílaba falada (não muda) toca durante a repetição: os limites que a ferramenta mediu
// na voz, ou uma divisão proporcional ao tamanho de cada sílaba.
export const temposDasSilabas = (m: Pronuncia, j: Janela) => {
  const faladas = silabasDe(m).filter((s) => !s.muda);
  const n = faladas.length;
  const cortes =
    j.silabas && j.silabas.length === n - 1
      ? j.silabas
      : (() => {
          const pesos = faladas.map((s) => Math.max(1, s.texto.length));
          const soma = pesos.reduce((x, y) => x + y, 0);
          let acc = 0;
          return pesos.slice(0, -1).map((p) => {
            acc += p;
            return j.a + 0.03 + ((j.b - j.a - 0.08) * acc) / soma;
          });
        })();
  // início de cada sílaba no relógio do vídeo final
  const inicioFonte = [j.a + 0.03, ...cortes];
  return inicioFonte.map((s) => j.em + (s - j.a) / j.ritmo);
};

const TOPO_PALAVRA = 196;

export const Ficha: React.FC<{
  m: Pronuncia;
  plano: Plano;
  t: number;
  indice: number;
  total: number;
  janela: Janela | null;
}> = ({ m, plano, t, indice, total, janela }) => {
  const R = useRotulos();
  const sil = silabasDe(m);
  // a palavra: maior corpo em que as sílabas (com um ponto estreito entre elas) cabem em 940 px
  const SEP = 0.46;
  const somaBase = sil.reduce((s, x) => s + medir(x.texto, 100, { peso: 800 }), 0) / 100;
  const tamanho = Math.max(64, Math.min(190, Math.floor(940 / (somaBase + SEP * (sil.length - 1)))));
  const larguraSep = SEP * tamanho;
  const larguras = sil.map((s) => medir(s.texto, tamanho, { peso: 800 }));
  const total_ = larguras.reduce((a, b) => a + b, 0) + larguraSep * (sil.length - 1);
  let x = (960 - total_) / 2;
  const xs = larguras.map((l) => {
    const atual = x;
    x += l + larguraSep;
    return atual;
  });

  const em = m.em;
  // as sílabas entram uma a uma; o ponto pula de sílaba falada em sílaba falada e pousa na forte
  const passo = Math.min(0.12, 0.5 / Math.max(1, sil.length));
  const faladas = sil.map((s, i) => ({ s, i })).filter((o) => !o.s.muda);
  const iForte = Math.max(0, sil.findIndex((s) => s.forte));
  const yPonto = tamanho * 0.05;
  const alvos: Alvo[] = [];
  faladas.forEach((o, k) => alvos.push({ t: em + o.i * passo + 0.02, x: xs[o.i] + larguras[o.i] / 2, y: yPonto }));
  alvos.push({ t: em + sil.length * passo + 0.18, x: xs[iForte] + larguras[iForte] / 2, y: yPonto });
  // na câmera lenta, o ponto acompanha cada sílaba da voz e volta para a forte no fim
  if (janela) {
    const tempos = temposDasSilabas(m, janela);
    faladas.forEach((o, k) => alvos.push({ t: tempos[k] ?? janela.em, x: xs[o.i] + larguras[o.i] / 2, y: yPonto }));
    alvos.push({ t: janela.fim + 0.05, x: xs[iForte] + larguras[iForte] / 2, y: yPonto });
  }
  alvos.sort((a, b) => a.t - b.t);
  const sMuda = prog(t, m.mudaEm ?? Infinity, 0.35);

  // linhas de baixo: errado (riscado) e o jeito certo de ler (com traço)
  const temFoto = temImagem(imagemDoPlano(plano, m.imagem));
  const larguraLinhas = temFoto ? 590 : 960;
  const yLinha1 = 580;
  const partes = partesDaLeitura(m.leitura);
  const tamLeitura = m.leitura ? encaixar(partes.join("-"), larguraLinhas, 100, 52, 1, { peso: 800 }).tamanho : 0;
  const tamErrado = m.errado ? encaixar(m.errado, larguraLinhas - 20, 66, 44, 1, { peso: 700 }).tamanho : 0;
  const yErrado = yLinha1;
  const yCerto = m.errado ? yLinha1 + 170 : yLinha1;
  const pErrado = prog(t, m.erradoEm ?? Infinity, 0.25);
  const pRisco = prog(t, (m.erradoEm ?? Infinity) + 0.35, 0.3);
  const tLeitura = m.leituraEm ?? m.em + 0.6;
  const pLeitura = prog(t, tLeitura, 0.28);
  const pTraco = prog(t, tLeitura + 0.25, 0.4);
  const lLeitura = m.leitura ? medir(partes.join("-"), tamLeitura, { peso: 800 }) : 0;
  const pFon = prog(t, m.em + 0.35, 0.3);
  const pNota = prog(t, m.notaEm ?? Infinity, 0.25);
  const cabecalho = prog(t, m.de - 0.05, 0.3);
  const idioma = m.idioma ?? R.idioma;
  const sotaque = m.sotaque ?? (idioma === R.idioma ? R.sotaque : "");

  return (
    <div style={{ position: "absolute", left: 60, top: 0, width: 960, height: 1040 }}>
      {/* cabeçalho: qual palavra é (1 de 3) e o sotaque */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 92, display: "flex", justifyContent: "space-between", opacity: cabecalho }}>
        <div style={{ ...rotulo, color: cor.tinta }}>
          {total > 1 ? (
            <>
              <span style={{ color: cor.coral }}>{indice}</span>
              <span style={{ color: cor.lilas }}> {R.de} {total}</span>
            </>
          ) : (
            R.pronuncia
          )}
        </div>
        <div style={rotulo}>{sotaque ? `${idioma} · ${sotaque}` : idioma}</div>
      </div>

      {/* antes da palavra ser dita ("a segunda…"): o número dela, grande, no lugar da palavra */}
      {m.em - m.de > 0.35 && t < m.em ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            width: 960,
            top: TOPO_PALAVRA + 40,
            textAlign: "center",
            fontFamily: sans,
            fontWeight: 800,
            fontSize: 260,
            lineHeight: 1.12,
            letterSpacing: "-0.03em",
            whiteSpace: "nowrap",
            opacity: prog(t, m.de - 0.05, 0.25) * (1 - prog(t, m.em - 0.2, 0.15)),
          }}
        >
          {total > 1 ? (
            <>
              <span style={{ color: cor.coral }}>{indice}</span>
              <span style={{ color: cor.lilas, fontSize: 130 }}> {R.de} {total}</span>
            </>
          ) : (
            <span style={{ color: cor.lilas, fontSize: 96 }}>{idioma}</span>
          )}
        </div>
      ) : null}

      {/* a palavra em sílabas */}
      <div style={{ position: "absolute", left: 0, top: TOPO_PALAVRA, width: 960, height: tamanho * 1.2 }}>
        {sil.map((s, i) => {
          const p = prog(t, em + i * passo - 0.06, 0.26);
          const muda = s.muda && sMuda > 0;
          return (
            <div key={i}>
              <div
                style={{
                  position: "absolute",
                  left: xs[i],
                  top: 0,
                  fontFamily: sans,
                  fontWeight: 800,
                  fontSize: tamanho,
                  lineHeight: 1.12,
                  letterSpacing: "-0.02em",
                  color: muda ? `rgba(251,246,238,${1 - 0.66 * sMuda})` : cor.tinta,
                  whiteSpace: "nowrap",
                  ...(p >= 1 ? {} : { opacity: p, translate: `0 ${(1 - p) * 26}px` }),
                }}
              >
                {s.texto}
                {muda ? (
                  <div
                    style={{
                      position: "absolute",
                      left: -6,
                      top: "56%",
                      width: `calc(${sMuda * 100}% + 12px)`,
                      height: Math.max(6, tamanho * 0.07),
                      borderRadius: 4,
                      background: cor.coral,
                    }}
                  />
                ) : null}
              </div>
              {i < sil.length - 1 ? (
                <div
                  style={{
                    position: "absolute",
                    left: xs[i] + larguras[i],
                    width: larguraSep,
                    overflow: "visible",
                    top: 0,
                    textAlign: "center",
                    fontFamily: sans,
                    fontWeight: 800,
                    fontSize: tamanho,
                    lineHeight: 1.12,
                    color: cor.lilas,
                    opacity: 0.55 * p,
                  }}
                >
                  ·
                </div>
              ) : null}
            </div>
          );
        })}
        <Ponto alvos={alvos} t={t} raio={Math.round(Math.max(11, tamanho * 0.085))} />
      </div>

      {/* fonética + nota */}
      <div
        style={{
          position: "absolute",
          left: 0,
          width: 960,
          top: TOPO_PALAVRA + tamanho * 1.22 + 14,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 28,
        }}
      >
        {m.fonetica ? (
          <div style={{ fontFamily: fonetica, fontSize: 60, color: cor.lilas, opacity: pFon, whiteSpace: "nowrap" }}>{m.fonetica}</div>
        ) : null}
        {m.nota && pNota > 0 ? (
          <div
            style={{
              fontFamily: sans,
              fontWeight: 800,
              fontSize: 36,
              color: cor.fundo,
              background: cor.coral,
              padding: "8px 22px 10px",
              borderRadius: 40,
              whiteSpace: "nowrap",
              ...(pNota >= 1 ? {} : { opacity: pNota, scale: `${0.85 + 0.15 * pNota}` }),
            }}
          >
            {m.nota}
          </div>
        ) : null}
      </div>

      {/* não é: a pronúncia errada, riscada */}
      {m.errado && pErrado > 0 ? (
        <div style={{ position: "absolute", left: 0, top: yErrado, opacity: pErrado }}>
          <div style={rotulo}>{R.naoE}</div>
          <div
            style={{
              position: "relative",
              marginTop: 10,
              fontFamily: sans,
              fontWeight: 700,
              fontSize: tamErrado,
              color: pRisco > 0 ? cor.apagado : cor.lilas,
              whiteSpace: "nowrap",
              display: "inline-block",
            }}
          >
            {m.errado}
            {pRisco > 0 ? (
              <div style={{ position: "absolute", left: -6, top: "52%", height: 6, borderRadius: 3, width: `calc(${pRisco * 100}% + 12px)`, background: cor.coral }} />
            ) : null}
          </div>
        </div>
      ) : null}

      {/* é assim: o jeito de ler, com a sílaba forte em coral e o traço desenhado */}
      {m.leitura && pLeitura > 0 ? (
        <div style={{ position: "absolute", left: 0, top: yCerto, ...(pLeitura >= 1 ? {} : { opacity: pLeitura, translate: `0 ${(1 - pLeitura) * 14}px` }) }}>
          <div style={{ ...rotulo, color: cor.tinta }}>{m.rotuloLeitura ?? R.leitura}</div>
          <div style={{ position: "relative", marginTop: 8, whiteSpace: "nowrap", fontFamily: sans, fontWeight: 800, fontSize: tamLeitura, letterSpacing: "-0.01em" }}>
            {partes.map((parte, i) => (
              <span key={i}>
                <span style={{ color: ehForte(parte) ? cor.coral : cor.tinta }}>{parte}</span>
                {i < partes.length - 1 ? <span style={{ color: cor.lilas }}>-</span> : null}
              </span>
            ))}
            {pTraco > 0 ? <Traco largura={lLeitura} p={pTraco} style={{ left: 0, top: tamLeitura * 1.18 }} /> : null}
          </div>
        </div>
      ) : null}

      {/* a foto do significado, no canto */}
      {temFoto ? (
        <Foto
          imagem={imagemDoPlano(plano, m.imagem)}
          foco={m.imagem?.foco}
          de={m.em + 0.3}
          efeito={m.imagem?.efeito ?? "aproximar"}
          entrada="subir"
          durEntrada={0.4}
          largura={330}
          altura={370}
          t={t}
          style={{
            position: "absolute",
            left: 630,
            top: yLinha1 - 10,
            borderRadius: 30,
            border: `6px solid ${cor.tinta}`,
            rotate: "-3deg",
            boxShadow: "0 18px 40px rgba(8,5,30,0.45)",
          }}
        />
      ) : null}
    </div>
  );
};

// some quando sai (usado pelo Edicao quando a ficha não sai por cortina)
export const opacidadeDeSaida = (t: number, fim: number) => 1 - saindo(t, fim, 0.2);
