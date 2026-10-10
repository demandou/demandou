import { Bloco, indicesDoTrecho, Palavras, prog, temposDoTexto, useTempo } from "../anim";
import { corpoDoRotulo, encaixarNaCaixa, ITALICO, SERIF } from "../medida";
import type { Cta as TCta, Palavra, Plano } from "../plano";
import { cor, rotulo, serif, sombra } from "../tema";
import { IconeTraco, Salvar } from "./Icones";

// Fechamento: o ícone do pedido se desenha (salvar, seguir, comentar, link), a chamada se monta
// na fala em serifada marfim (o destaque em itálico latão) e a assinatura aparece embaixo.
export const Cta: React.FC<{ m: TCta; marca: Plano["marca"]; fim: number; palavras: Palavra[]; largura: number; altura: number }> = ({
  m,
  marca,
  fim,
  palavras,
  largura,
  altura,
}) => {
  const t = useTempo();
  const inicio = Math.max(0, m.em ?? m.de);
  const destaque = indicesDoTrecho(m.texto, m.destaque);
  const estilo = (i: number) => (destaque.has(i) ? ITALICO : SERIF);
  const icone = 118;
  const alturaMarca = marca.nome ? 34 + 26 + 56 + (marca.area ? 40 : 0) + 1 : 0;
  const q = encaixarNaCaixa(m.texto, {
    largura: largura - icone - 26,
    altura: altura - alturaMarca - 10,
    max: 108,
    min: 64,
    linhas: 2,
    alturaLinha: 1.0,
    estilo,
  });
  // o texto entra no ritmo da fala, mas a primeira palavra nunca antes do ícone começar
  const tempos = temposDoTexto(m.texto, palavras, Math.max(inicio, m.de + 0.1), m.ate + 2);

  return (
    <Bloco t={t} ate={fim} style={{ textShadow: sombra }}>
      <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
        <div style={{ flexShrink: 0 }}>
          {m.icone && m.icone !== "salvar" ? (
            <IconeTraco nome={m.icone} p={prog(t, m.de, 0.9)} tamanho={icone} cor={cor.lataoClaro} />
          ) : (
            <Salvar traco={prog(t, m.de, 0.6)} cheio={prog(t, m.de + 0.55, 0.3)} tamanho={icone} cor={cor.papel} corCheio={cor.lataoClaro} />
          )}
        </div>
        <Palavras
          linhas={q.linhas}
          tempos={tempos}
          t={t}
          tamanho={q.tamanho}
          alturaLinha={1.0}
          alinhar="left"
          estilo={estilo}
          cor={(i) => (destaque.has(i) ? cor.lataoClaro : cor.papel)}
        />
      </div>
      {marca.nome ? (
        <>
          <div style={{ width: 640 * prog(t, m.de + 0.5, 0.7), height: 1, background: "rgba(242,236,223,0.4)", margin: "34px 0 26px" }} />
          <div style={{ opacity: prog(t, m.de + 0.7, 0.5), display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ fontFamily: serif, fontSize: 56, lineHeight: 1, color: cor.papel }}>{marca.nome}</div>
            {marca.area ? (
              <div style={{ ...rotulo, fontSize: corpoDoRotulo(marca.area, largura), color: cor.lataoClaro }}>{marca.area}</div>
            ) : null}
          </div>
        </>
      ) : null}
    </Bloco>
  );
};
