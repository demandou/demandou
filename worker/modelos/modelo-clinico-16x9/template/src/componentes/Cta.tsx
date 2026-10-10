import { limitar, prog, saindo, temposDoTexto, Traco } from "../anim";
import { encaixarTitulo, larguraTexto, trechoNoTexto } from "../medida";
import type { Regiao } from "../layout";
import type { Cta as CtaT, Palavra } from "../plano";
import { ajustarTitulo, cor, sans } from "../tema";
import { IconeDoBotao } from "./Icones";
import { TextoFalado } from "./Texto";

const BOTAO = 150;
const VAO_BOTAO = 24;

// Fechamento em tela cheia: a chamada se monta na fala, os botões se desenham quando são pedidos
// e a assinatura entra como a identificação de um prontuário (nome e área).
// No quadro deitado a névoa é uma faixa larga e baixa na base do quadro: a chamada fica numa coluna
// à esquerda e os botões com a assinatura numa fileira à direita (no vertical, um embaixo do outro).
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
  // `icone` (universal): um botão no instante em que a chamada começa; `botoes` (do Clínico): um ou dois
  const inicio = m.em ?? m.de;
  const botoes = m.botoes ?? (m.icone ? [{ em: inicio + 0.05, icone: m.icone }] : []);
  // a fileira da direita: botões, o traço e a assinatura
  const larguraBotoes = botoes.length ? botoes.length * BOTAO + (botoes.length - 1) * VAO_BOTAO : 0;
  const temAssinatura = !!marca.nome;
  const nomeTam = temAssinatura ? ajustarTitulo(marca.nome, 520, 1, 60, 42) : 0;
  const areaTam = temAssinatura ? ajustarTitulo(marca.area, 520, 1, 46, 40) : 0;
  const larguraAssinatura = temAssinatura
    ? Math.min(520, Math.max(larguraTexto(marca.nome, nomeTam, 800, -0.01), larguraTexto(marca.area, areaTam, 600)) + 12)
    : 0;
  const larguraFileira = larguraBotoes + (temAssinatura ? (botoes.length ? 12 + 4 + 22 : 0) + larguraAssinatura : 0);
  // a chamada usa o resto da faixa; se a fileira não deixar lugar, a assinatura desce para baixo dos botões
  const empilhar = larguraFileira > area.w * 0.48;
  const larguraDireita = empilhar ? Math.max(larguraBotoes, larguraAssinatura) : larguraFileira;
  const VAO = 72;
  const larguraChamada = area.w - larguraDireita - VAO;
  const e = encaixarTitulo(m.texto, { largura: larguraChamada, max: 106, min: 54, linhas: 3, peso: 800, espacamento: -0.02, altura: area.h, entrelinha: 1.04 });
  const alturaChamada = e.linhas.length * e.tamanho * 1.04;
  const tempos = temposDoTexto(m.texto, palavras, inicio, m.ate, Math.max(m.de, inicio) + 0.1, inicio - 0.15);
  const assinaturaEm = m.assinaturaEm ?? (botoes.length ? botoes[botoes.length - 1].em + 0.5 : Math.max(m.de, inicio) + 0.8);
  const assina = prog(t, assinaturaEm, 0.6);

  const assinatura = temAssinatura ? (
    <div style={{ display: "flex", alignItems: "center", gap: 22, marginLeft: botoes.length && !empilhar ? 12 : 0, opacity: assina }}>
      {botoes.length && !empilhar ? (
        <svg width={4} height={130}>
          <Traco d="M 2 2 L 2 128" p={assina} cor={cor.cinzaClaro} largura={3} />
        </svg>
      ) : null}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, translate: `${(1 - assina) * 24}px 0` }}>
        <div style={{ fontFamily: sans, fontWeight: 800, fontSize: nomeTam, color: cor.tinta, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>{marca.nome}</div>
        <div style={{ fontFamily: sans, fontWeight: 600, fontSize: areaTam, color: cor.azul, whiteSpace: "nowrap" }}>{marca.area}</div>
      </div>
    </div>
  ) : null;

  return (
    <div style={{ position: "absolute", left: area.x, top: area.y, width: area.w, height: area.h, opacity: 1 - sai }}>
      <div style={{ position: "absolute", left: 0, top: Math.max(0, (area.h - alturaChamada) / 2), width: larguraChamada }}>
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
      </div>
      <div
        style={{
          position: "absolute",
          left: area.w - larguraDireita,
          top: 0,
          width: larguraDireita,
          height: area.h,
          display: "flex",
          flexDirection: empilhar ? "column" : "row",
          alignItems: empilhar ? "flex-start" : "center",
          justifyContent: "center",
          gap: empilhar ? 22 : VAO_BOTAO,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: VAO_BOTAO }}>
          {botoes.map((b, i) => {
            const p = prog(t, b.em, 0.5);
            const traco = prog(t, b.em + 0.1, 0.6);
            return (
              <div
                key={i}
                style={{
                  width: BOTAO,
                  height: BOTAO,
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
        </div>
        {assinatura}
      </div>
    </div>
  );
};
