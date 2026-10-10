import { limitar, prog, saindo, temposDoTexto, Traco } from "../anim";
import { encaixarTitulo, trechoNoTexto } from "../medida";
import type { Regiao } from "../layout";
import type { Cta as CtaT, Palavra } from "../plano";
import { ajustarTitulo, cor, sans } from "../tema";
import { IconeDoBotao } from "./Icones";
import { TextoFalado } from "./Texto";

// Fechamento em tela cheia: a chamada se monta na fala, os botões se desenham quando são pedidos
// e a assinatura entra como a identificação de um prontuário (nome e área).
export const Cta: React.FC<{ m: CtaT; t: number; fim: number; area: Regiao; palavras: Palavra[]; marca: { nome: string; area: string } }> = ({
  m,
  t,
  fim,
  area,
  palavras,
  marca,
}) => {
  const sai = saindo(t, fim, 0.3);
  if (sai >= 1) return null;
  const disponivel = 1548 - (area.y - 20) - 190;
  const e = encaixarTitulo(m.texto, { largura: area.w, max: 106, min: 54, linhas: 4, peso: 800, espacamento: -0.02, altura: disponivel, entrelinha: 1.04 });
  const botao = 150;
  // `icone` (universal): um botão no instante em que a chamada começa; `botoes` (do Clínico): um ou dois
  const inicio = m.em ?? m.de;
  const botoes = m.botoes ?? (m.icone ? [{ em: inicio + 0.05, icone: m.icone }] : []);
  const larguraAssinatura = area.w - botoes.length * (botao + 24) - 40;
  const nomeTam = ajustarTitulo(marca.nome, larguraAssinatura, 1, 60, 42);
  const areaTam = ajustarTitulo(marca.area, larguraAssinatura, 1, 46, 40);
  const tempos = temposDoTexto(m.texto, palavras, inicio, m.ate, Math.max(m.de, inicio) + 0.1, inicio - 0.15);
  const assinaturaEm = m.assinaturaEm ?? (botoes.length ? botoes[botoes.length - 1].em + 0.5 : Math.max(m.de, inicio) + 0.8);
  const assina = prog(t, assinaturaEm, 0.6);
  return (
    <div
      style={{
        position: "absolute",
        left: area.x,
        top: area.y - 20,
        width: area.w,
        // a chamada fica no alto da névoa e os botões descem até perto da interface do app
        height: 1548 - (area.y - 20),
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        opacity: 1 - sai,
      }}
    >
      <TextoFalado
        linhas={e.linhas}
        tamanho={e.tamanho}
        peso={800}
        tempos={tempos}
        t={t}
        destaque={trechoNoTexto(m.texto, m.enfase ?? m.destaque)}
        entrelinha={1.04}
        espacamento={-0.02}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        {botoes.map((b, i) => {
          const p = prog(t, b.em, 0.5);
          const traco = prog(t, b.em + 0.1, 0.6);
          return (
            <div
              key={i}
              style={{
                width: botao,
                height: botao,
                borderRadius: "50%",
                background: i === 0 ? cor.azul : cor.branco,
                boxShadow: `inset 0 0 0 4.5px ${cor.azul}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: limitar(p * 1.5),
                scale: String(0.82 + 0.18 * p),
                flexShrink: 0,
              }}
            >
              <IconeDoBotao icone={b.icone} p={traco} tamanho={78} corTraco={i === 0 ? cor.branco : cor.azul} />
            </div>
          );
        })}
        {marca.nome ? (
          <div style={{ display: "flex", alignItems: "center", gap: 22, marginLeft: botoes.length ? 12 : 0, opacity: assina }}>
            {botoes.length ? (
              <svg width={4} height={130}>
                <Traco d="M 2 2 L 2 128" p={assina} cor={cor.cinzaClaro} largura={3} />
              </svg>
            ) : null}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, translate: `${(1 - assina) * 24}px 0` }}>
              <div style={{ fontFamily: sans, fontWeight: 800, fontSize: nomeTam, color: cor.tinta, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
                {marca.nome}
              </div>
              <div style={{ fontFamily: sans, fontWeight: 600, fontSize: areaTam, color: cor.azul, whiteSpace: "nowrap" }}>{marca.area}</div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
