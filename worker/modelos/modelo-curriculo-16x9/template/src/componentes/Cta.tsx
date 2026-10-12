import { caminhoVisto, fimDoTexto, gesto, LinhasAMao, prog, saindo, temposDesde, temposDoTexto, Traco } from "../anim";
import { encaixarNaAltura, larguraLinha, trechoNoTexto } from "../medida";
import type { Cta as TipoCta, Palavra, Plano } from "../plano";
import { cor, sans, sombraCartao } from "../tema";
import { type Area, topoDoCartao } from "./Abertura";
import { Icone } from "./Icones";

// Fechamento: a pessoa volta para a tela cheia e um cartão no peito recebe a chamada escrita à mão,
// palavra por palavra. O ícone da ação se preenche na primeira palavra; um visto fecha a frase.
// No quadro deitado a chamada vira uma fileira larga na faixa do peito; o cartão tem a largura do
// texto (não da faixa inteira) e cabe na altura dela.
export const Cta: React.FC<{ m: TipoCta; t: number; fim: number; area: Area; palavras: Palavra[]; marca: Plano["marca"] }> = ({
  m,
  t,
  fim,
  area,
  palavras,
  marca,
}) => {
  // entra quando a pessoa já está quase em tela cheia; as primeiras palavras alcançam a fala
  const entrada = m.de + 0.4;
  const entra = prog(t, entrada, 0.36);
  const sai = saindo(t, fim, 0.3);
  if (sai >= 1 || entra <= 0) return null;
  const brutos = m.em !== undefined ? temposDesde(m.texto, palavras, m.em, fim, 0.16) : temposDoTexto(m.texto, palavras, m.de, fim);
  const tempos = brutos.map((x, i) => Math.max(x, entrada + 0.14 + i * 0.12));
  const fimFala = Math.max(fimDoTexto(m.texto, palavras, m.de, fim), tempos[tempos.length - 1] ?? m.de);
  const preenche = prog(t, (tempos[0] ?? m.de) + 0.05, 0.3);
  // a chamada cabe ao lado do ícone em até 3 linhas (76 → 44 px); o cartão: 60 de margem, a linha
  // da assinatura (~70) e a chamada
  const larguraTexto = area.w - 20 - 80 - 84 - 26;
  const enc = encaixarNaAltura(m.texto, { largura: larguraTexto, max: 76, min: 44, altura: area.h - 130, alturaLinha: 1.18, linhas: 3, fonte: "mao", peso: 700 });
  const tamanho = enc.tamanho;
  const alturaCartao = 130 + enc.linhas.length * tamanho * 1.18;
  const topo = topoDoCartao(area, alturaCartao);
  // o cartão abraça o texto (com folga para a letra à mão e para a assinatura embaixo)
  const larguraCartao = Math.min(area.w - 100, Math.max(760, 80 + 84 + 26 + 24 + Math.max(...enc.linhas.map((l) => larguraLinha(l, tamanho, { fonte: "mao", peso: 700 })))));
  // destaque: uma palavra ganha círculo; um trecho, sublinhado — quando termina de ser dito
  const trecho = trechoNoTexto(m.texto, m.destaque);
  const grifo = trecho ? { de: trecho[0], ate: trecho[1], em: (tempos[trecho[1]] ?? m.de) + 0.25 } : null;
  return (
    <div
      style={{
        position: "absolute",
        left: area.x,
        width: area.w,
        top: topo,
        height: alturaCartao,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: entra * (1 - sai),
        translate: `0 ${(1 - entra) * 40}px`,
      }}
    >
      <div style={{ position: "relative", background: cor.papel, boxShadow: sombraCartao, padding: "30px 44px 30px 36px", rotate: "0.8deg", width: larguraCartao }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 26 }}>
          <div style={{ flexShrink: 0, paddingTop: 10 }}>
            <Icone nome={m.icone ?? "salvar"} tamanho={84} preenche={preenche} />
          </div>
          <div style={{ position: "relative", flex: 1 }}>
            <LinhasAMao
              linhas={enc.linhas}
              tempos={tempos}
              t={t}
              tamanho={tamanho}
              peso={700}
              alturaLinha={1.18}
              circulo={grifo && grifo.de === grifo.ate ? grifo : null}
              sublinhado={grifo && grifo.de !== grifo.ate ? grifo : null}
            />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", marginTop: 20, gap: 16 }}>
          <div style={{ height: 3, width: 54, background: cor.vermelho, opacity: prog(t, m.de + 0.4, 0.3) }} />
          <div
            style={{
              fontFamily: sans,
              fontWeight: 600,
              fontSize: 34,
              color: cor.cinza,
              whiteSpace: "nowrap",
              opacity: prog(t, m.de + 0.35, 0.35),
            }}
          >
            {[marca.nome, marca.area].filter(Boolean).join(" · ")}
          </div>
          <div style={{ flex: 1 }} />
          <svg width={64} height={50} style={{ overflow: "visible" }}>
            <Traco d={caminhoVisto(60, 46)} p={prog(t, fimFala + 0.05, 0.3, gesto)} largura={8} />
          </svg>
        </div>
      </div>
    </div>
  );
};
