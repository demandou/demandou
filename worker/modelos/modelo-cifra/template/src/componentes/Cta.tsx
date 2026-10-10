// Momento `cta`: quadro cheio, cartão de palco no peito com a palheta, o nome e a área, a chamada
// falada e o botão (com o ícone de salvar, seguir, comentar ou link) que é "apertado" quando a pessoa
// diz o destaque ("segue", "salva", "Saiba Mais").
import { prog, temposDasPalavras } from "../anim";
import { caber, indicesDoTrecho, largura } from "../medida";
import type { Cta as TCta, Palavra } from "../plano";
import { cor, fonte, titulo } from "../tema";
import { TextoFalado } from "../texto";
import { Cartao, INTERNO } from "./Cartao";
import type { Area } from "./Cena";

// palheta de violão, a traço cheio, com a marca de uso no meio
export const Palheta: React.FC<{ p: number; tamanho?: number; corPalheta?: string }> = ({ p, tamanho = 124, corPalheta = cor.azul }) => (
  <svg width={tamanho} height={(tamanho * 142) / 124} viewBox="0 0 124 142" style={{ display: "block", overflow: "visible" }}>
    <path
      d="M 62 136 C 44 128 8 82 6 46 C 4 16 30 6 62 6 C 94 6 120 16 118 46 C 116 82 80 128 62 136 Z"
      fill={corPalheta}
      opacity={p}
      transform={`rotate(${(1 - p) * -14} 62 70)`}
    />
    <path d="M 40 50 Q 62 40 84 50" fill="none" stroke={cor.palco} strokeWidth={6} strokeLinecap="round" opacity={0.55 * p} />
  </svg>
);

const NOMES = { salvar: "Salvar", seguir: "Seguir", comentar: "Comentar", link: "Saiba mais" } as const;

// ícones a traço, na cor do texto do botão
const Icone: React.FC<{ tipo: keyof typeof NOMES; corTraco: string }> = ({ tipo, corTraco }) => {
  const comum = { fill: "none", stroke: corTraco, strokeWidth: 4.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={40} height={40} viewBox="0 0 40 40" style={{ display: "block", flexShrink: 0 }}>
      {tipo === "salvar" ? <path d="M 11 5 L 29 5 L 29 35 L 20 27 L 11 35 Z" {...comum} /> : null}
      {tipo === "seguir" ? (
        <g {...comum}>
          <circle cx={16} cy={13} r={7} />
          <path d="M 3 35 C 4 25 28 25 29 35" />
          <path d="M 33 9 L 33 21 M 27 15 L 39 15" />
        </g>
      ) : null}
      {tipo === "comentar" ? <path d="M 6 8 L 34 8 L 34 28 L 18 28 L 10 35 L 10 28 L 6 28 Z" {...comum} /> : null}
      {tipo === "link" ? (
        <g {...comum}>
          <path d="M 17 23 L 23 17" />
          <path d="M 14 19 L 10 23 C 6 27 13 34 17 30 L 21 26" />
          <path d="M 26 21 L 30 17 C 34 13 27 6 23 10 L 19 14" />
        </g>
      ) : null}
    </svg>
  );
};

export const Cta: React.FC<{ m: TCta; t: number; area: Area; palavras: Palavra[]; fim: number; marca: { nome: string; area: string } }> = ({
  m,
  t,
  area,
  palavras,
  fim,
  marca,
}) => {
  const inicio = m.em ?? m.de;
  const { tempos } = temposDasPalavras(m.texto, palavras, inicio, fim, inicio);
  const icone = m.icone ?? "seguir";
  const rotuloBotao = m.botao ?? NOMES[icone] ?? "Seguir";
  const temMarca = !!marca.nome;
  const comIcone = !!m.icone;
  const larguraBotao = Math.min(400, largura(rotuloBotao, 44, { peso: 800 }) + 72 + (comIcone ? 54 : 0));
  // a chamada cabe numa linha ao lado do botão (≥ 48 px)? senão, o botão sobe para a linha do nome
  // e a chamada ganha a largura toda embaixo
  const aoLado = caber(m.texto, { largura: INTERNO - larguraBotao - 24, max: 54, min: 48, linhas: 1 });
  const botaoEmCima = temMarca && aoLado.linhas.length > 1;
  // sem nome e com a chamada comprida: a chamada ganha a largura toda e o botão vai embaixo dela
  const botaoEmbaixo = !temMarca && aoLado.linhas.length > 1;
  const larguraTexto = botaoEmCima || botaoEmbaixo ? INTERNO : INTERNO - larguraBotao - 24;
  const disponivel = Math.max(120, area.h - 78 - (temMarca ? 142 + 28 : 0) - (botaoEmbaixo ? 92 + 24 : 0));
  // com o botão na linha do nome, o nome encolhe para caber (a palheta também)
  const palheta = botaoEmCima ? 100 : 124;
  const tamNome = botaoEmCima
    ? caber(marca.nome, { largura: INTERNO - palheta - 60 - larguraBotao, max: 64, min: 40, linhas: 1 }).tamanho
    : caber(marca.nome, { largura: INTERNO - palheta - 30, max: 76, min: 44, linhas: 1 }).tamanho;
  let enc = caber(m.texto, { largura: larguraTexto, max: botaoEmCima || botaoEmbaixo ? 64 : 54, min: 40, linhas: 3 });
  if (enc.linhas.length * enc.tamanho * 1.08 > disponivel) enc = caber(m.texto, { largura: larguraTexto, max: 48, min: 36, linhas: 2 });
  const destaque = indicesDoTrecho(enc.palavras, m.destaque);
  const primeiroDestaque = destaque.size ? Math.min(...destaque) : -1;
  const aperto = m.botaoEm ?? (primeiroDestaque >= 0 ? tempos[primeiroDestaque] : (tempos[0] ?? m.de) + 0.4);
  const pAperto = prog(t, aperto - 0.02, 0.22);
  // o botão afunda e volta (sem quique)
  const afunda = t >= aperto - 0.02 && t < aperto + 0.3 ? 1 - 0.06 * Math.sin(Math.PI * Math.min(1, (t - aperto + 0.02) / 0.3)) : 1;
  const entra = prog(t, m.de + 0.05, 0.4);
  const corBotao = pAperto > 0.5 ? cor.palco : cor.azul;

  const botao = (
    <div
      style={{
        flexShrink: 0,
        height: 92,
        padding: "0 40px",
        borderRadius: 46,
        border: `4px solid ${cor.azul}`,
        background: pAperto > 0 ? `rgba(134,197,238,${pAperto})` : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        fontFamily: fonte,
        fontWeight: 800,
        fontSize: 44,
        whiteSpace: "nowrap",
        color: corBotao,
        scale: String(afunda),
        opacity: entra,
      }}
    >
      {comIcone ? <Icone tipo={icone} corTraco={corBotao} /> : null}
      {rotuloBotao}
    </div>
  );

  return (
    <Cartao t={t} de={m.de} area={area}>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {temMarca ? (
          <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
            <Palheta p={entra} tamanho={palheta} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, minWidth: 0 }}>
              <div style={{ ...titulo, fontSize: tamNome, color: cor.marfim, opacity: entra, whiteSpace: "nowrap" }}>{marca.nome}</div>
              {marca.area ? (
                <div style={{ fontFamily: fonte, fontWeight: 600, fontSize: botaoEmCima ? 40 : 44, color: cor.marfimSuave, opacity: prog(t, m.de + 0.2, 0.4), whiteSpace: "nowrap" }}>
                  {marca.area}
                </div>
              ) : null}
            </div>
            {botaoEmCima ? botao : null}
          </div>
        ) : null}
        <div
          style={{
            display: "flex",
            flexDirection: botaoEmbaixo ? "column" : "row",
            alignItems: botaoEmbaixo ? "flex-start" : "center",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <div style={{ width: larguraTexto }}>
            <TextoFalado enc={enc} tempos={tempos} t={t} cor={cor.marfim} peso={700} destaque={destaque} sublinhar />
          </div>
          {botaoEmCima ? null : botao}
        </div>
      </div>
    </Cartao>
  );
};
