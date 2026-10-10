import { calculo, contar, PalavraAPalavra, prog, Revela, useTempo } from "../anim";
import type { Gancho as TGancho } from "../plano";
import { cor, formatar, mono, rotulo, sans } from "../tema";
import { Cartao, type Zona } from "./Cartao";
import { caminho, curvaComposta } from "./curvas";
import { corpoQueCabe, Valor } from "./Valor";

const temDigito = (w: string) => /\d/.test(w);

// Abertura: a frase se monta palavra por palavra e o número-chave se transforma contando.
export const Gancho: React.FC<{ m: TGancho; zona: Zona; t0: number; rotuloPadrao?: string }> = ({ m: original, zona, t0, rotuloPadrao }) => {
  const t = useTempo();
  // sem rótulo no plano, a área da pessoa (marca.area) faz o papel: o cartão nunca abre vazio
  const m = original.rotulo || !rotuloPadrao ? original : { ...original, rotulo: rotuloPadrao };
  const n = m.numero;
  const duracaoConta = n ? Math.max(0.6, Math.min(1.2, m.ate - n.em - 0.4)) : 1;
  const valor = n ? contar(t, n, duracaoConta) : 0;
  const pConta = n ? prog(t, n.em, duracaoConta, calculo) : 0;
  const cai = n ? n.para < (n.de ?? 0) : false;
  const corNumero = cai ? cor.negativo : cor.positivo;
  const mostrarCurva = n && m.curva !== false;

  // curva de crescimento que se desenha junto com a contagem
  const W = 300;
  const H = 150;
  const pontos = curvaComposta(28, 2.6).map((p) => ({ x: p.x * W, y: H - (cai ? 1 - p.y : p.y) * H }));
  const visiveis = pontos.filter((p) => p.x <= pConta * W + 0.01);
  const fim = visiveis[visiveis.length - 1] ?? pontos[0];

  // tamanhos que cabem: as linhas dividem a largura com a curva; o número usa a largura toda
  const larguraUtil = 1080 - zona.esquerda - zona.direita - 88;
  const maiorLinha = Math.max(1, ...m.linhas.slice(0, 2).map((l) => l.texto.length));
  const corpoLinhas = Math.min(64, Math.floor((mostrarCurva ? larguraUtil - 360 : larguraUtil) / (maiorLinha * 0.52)));
  const corpoNumero = n
    ? corpoQueCabe({ prefixo: n.prefixo, numero: formatar(n.para, n.casas ?? 0), sufixo: n.sufixo }, larguraUtil, 156)
    : 0;

  return (
    <Cartao de={t0} ate={m.ate} style={{ width: 1080 - zona.esquerda - zona.direita, padding: "38px 44px 40px" }}>
      {m.rotulo ? (
        <Revela p={prog(t, t0 + 0.1, 0.5)}>
          <div style={{ ...rotulo, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: cor.ambar }} />
            {m.rotulo}
          </div>
        </Revela>
      ) : null}
      <div style={{ display: "flex", flexDirection: "column", marginTop: m.rotulo ? 22 : 0 }}>
        {m.linhas.slice(0, 2).map((l, i) => (
          // o cartão cresce conforme o título se monta: nada de espaço vazio esperando
          <div key={l.texto} style={{ height: i === 0 ? undefined : corpoLinhas * 1.19 * prog(t, l.em - 0.12, 0.3), overflow: "visible" }}>
            <PalavraAPalavra
              texto={l.texto}
              em={l.em}
              limite={m.linhas[i + 1]?.em ?? m.numero?.em}
              style={{
                marginTop: i === 0 ? 0 : 4,
                fontFamily: sans,
                fontWeight: 600,
                fontSize: corpoLinhas,
                lineHeight: 1.12,
                letterSpacing: "-0.015em",
                color: i === 0 ? cor.texto : cor.suave,
                whiteSpace: "nowrap",
              }}
              estiloPalavra={(w) => (temDigito(w) ? { fontFamily: mono, fontWeight: 500, color: cor.ambar } : undefined)}
            />
          </div>
        ))}
      </div>
      {mostrarCurva ? (
        <svg
          width={W + 20}
          height={H + 20}
          style={{ position: "absolute", right: 40, top: 64, overflow: "visible", opacity: prog(t, n.em - 0.2, 0.3) }}
        >
          <line x1={0} x2={W} y1={H + 10} y2={H + 10} stroke={cor.linhaForte} strokeWidth={2} />
          <path d={caminho(visiveis)} fill="none" stroke={corNumero} strokeWidth={5} strokeLinecap="round" />
          <circle cx={fim.x} cy={fim.y} r={9} fill={cor.fundo} stroke={corNumero} strokeWidth={4} />
        </svg>
      ) : null}
      {n ? (
        <div style={{ height: (corpoNumero + 14) * prog(t, n.em - 0.3, 0.35) }}>
          <div style={{ paddingTop: 14 }}>
            <Revela p={prog(t, n.em - 0.15, 0.35)}>
              <Valor
                v={{ prefixo: n.prefixo, numero: formatar(valor, n.casas ?? 0), sufixo: n.sufixo }}
                tamanho={corpoNumero}
                cor={corNumero}
              />
            </Revela>
          </div>
        </div>
      ) : null}
    </Cartao>
  );
};
