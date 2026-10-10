// Blocos universais de quadro cheio, no cartão de palco:
// - `destaque`: a palavra grande e as seis cordas tocadas quando ela é dita. "chave" = azul, com o ○
//   (a corda que soa) e as cordas soando; "alerta" = marfim, com o × (a corda que não toca) e as cordas
//   que vibram um instante e abafam;
// - `pergunta`: a fermata (o sinal de "segura"), a pergunta palavra por palavra e as opções como
//   etiquetas que ganham a palheta e a tinta, cada uma na sua palavra.
// No quadro deitado o cartão é largo e baixo (no peito): o conteúdo se arruma em FILEIRAS em vez de
// pilha alta (a fermata ao lado da pergunta, as opções lado a lado quando cabem numa linha cada).
import { prog, suave, temposDasPalavras } from "../anim";
import { caber, type Encaixe } from "../medida";
import type { Destaque as TDestaque, Palavra, Pergunta as TPergunta } from "../plano";
import { cor } from "../tema";
import { TextoFalado } from "../texto";
import { Cartao, internoDe } from "./Cartao";
import type { Area } from "./Cena";
import { Marca, SeisCordas } from "./Cordas";
import { Palheta } from "./Cta";

export const Destaque: React.FC<{ m: TDestaque; t: number; area: Area; palavras: Palavra[]; fim: number }> = ({ m, t, area, palavras, fim }) => {
  const INTERNO = internoDe(area);
  const alerta = m.nivel === "alerta";
  const MARCA = 76;
  const larguraTexto = INTERNO - MARCA - 26;
  const { tempos } = temposDasPalavras(m.texto, palavras, m.em, fim, m.em);
  const ultimo = tempos[tempos.length - 1] ?? m.em;
  const encDetalhe = m.detalhe ? caber(m.detalhe, { largura: INTERNO, max: 46, min: 36, linhas: 2, estilo: { peso: 600 } }) : null;
  const alturaDetalhe = encDetalhe ? encDetalhe.linhas.length * encDetalhe.tamanho * 1.12 + 20 : 0;
  // no cartão baixo do quadro deitado, a palavra encolhe até caber em cima das cordas
  const disponivel = Math.max(84, area.h - 78 - 84 - 26 - alturaDetalhe);
  let enc: Encaixe = caber(m.texto, { largura: larguraTexto, max: 124, min: 64, linhas: 3 });
  for (let max = 116; enc.linhas.length * enc.tamanho * 1.08 > disponivel && max >= 52; max -= 6) {
    enc = caber(m.texto, { largura: larguraTexto, max, min: Math.min(max, 52), linhas: 3 });
  }
  const pMarca = prog(t, m.em - 0.03, 0.3);
  const tDetalhe = m.detalhe ? temposDasPalavras(m.detalhe, palavras, m.detalheEm ?? ultimo, fim, m.detalheEm ?? ultimo + 0.2).tempos : [];

  return (
    <Cartao t={t} de={m.de} area={area}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 26 }}>
          <div style={{ marginTop: Math.max(0, enc.tamanho * 0.54 - MARCA / 2), flexShrink: 0 }}>
            <Marca tipo={alerta ? "abafa" : "soa"} p={pMarca} tamanho={MARCA} corTraco={alerta ? cor.marfim : cor.azul} />
          </div>
          <div style={{ width: larguraTexto }}>
            <TextoFalado enc={enc} tempos={tempos} t={t} cor={alerta ? cor.marfim : cor.azul} peso={900} />
          </div>
        </div>
        <div style={{ marginTop: 26 }}>
          <SeisCordas w={INTERNO} t={t} em={m.em} abafaEm={alerta ? m.em + 0.22 : undefined} decai={alerta ? 0.07 : 0.55} azul={!alerta} />
        </div>
        {encDetalhe ? (
          <div style={{ marginTop: 20 }}>
            <TextoFalado enc={encDetalhe} tempos={tDetalhe} t={t} cor={cor.marfimSuave} peso={600} espacamento={0} alturaLinha={1.12} />
          </div>
        ) : null}
      </div>
    </Cartao>
  );
};

// a fermata: um arco com um ponto embaixo ("segura esta nota")
const Fermata: React.FC<{ p: number }> = ({ p }) => {
  const comprimento = 150;
  return (
    <svg width={140} height={78} viewBox="0 0 104 58" style={{ display: "block", overflow: "visible" }}>
      <path d="M 6 52 C 10 8 94 8 98 52" fill="none" stroke={cor.lapisForte} strokeWidth={3} strokeDasharray="6 7" opacity={1 - p} />
      <path
        d="M 6 52 C 10 8 94 8 98 52"
        fill="none"
        stroke={cor.azul}
        strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={comprimento}
        strokeDashoffset={comprimento * (1 - p)}
      />
      <circle cx={52} cy={46 - 18 * (1 - suave(prog(p, 0.6, 0.4)))} r={10} fill={cor.azul} opacity={prog(p, 0.6, 0.3)} />
    </svg>
  );
};

export const Pergunta: React.FC<{ m: TPergunta; t: number; area: Area; palavras: Palavra[]; fim: number }> = ({ m, t, area, palavras, fim }) => {
  const INTERNO = internoDe(area);
  const inicio = m.em ?? m.de;
  const opcoes = (m.opcoes ?? []).slice(0, 4);
  const fimTexto = opcoes[0]?.em ?? fim;
  const { tempos } = temposDasPalavras(m.texto, palavras, inicio, fimTexto + 0.1, inicio);
  // a fermata fica ao lado da pergunta (uma fileira): o cartão do quadro deitado é baixo
  const FERMATA = 140;
  const VAO_FERMATA = 28;
  const larguraPergunta = INTERNO - FERMATA - VAO_FERMATA;
  // opções: todas lado a lado se cada uma cabe numa linha; senão duas por fileira; senão uma por fileira
  const GAP = 18;
  const larguraDaCaixa = (k: number) => (INTERNO - GAP * (k - 1)) / k;
  const textoNaCaixa = (k: number) => larguraDaCaixa(k) - 116;
  const cabe = (k: number) =>
    opcoes.every((o) => caber(o.texto, { largura: textoNaCaixa(k), max: 44, min: 36, linhas: 1, estilo: { peso: 700 } }).linhas.length === 1);
  const porFileira = opcoes.length >= 2 ? ([opcoes.length, 2].find((k) => cabe(k)) ?? 1) : 1;
  const larguraOpcao = textoNaCaixa(porFileira);
  const tamOpcao = Math.min(...opcoes.map((o) => caber(o.texto, { largura: larguraOpcao, max: 44, min: 34, linhas: 2, estilo: { peso: 700 } }).tamanho), 44);
  const encsOpcoes = opcoes.map((o) => caber(o.texto, { largura: larguraOpcao, max: tamOpcao, min: tamOpcao, linhas: 2, estilo: { peso: 700 } }));
  const alturaOpcao = (e: Encaixe) => e.linhas.length * e.tamanho * 1.08 + 34;
  const filas = Math.ceil(opcoes.length / porFileira);
  const alturaOpcoes = opcoes.length
    ? Array.from({ length: filas }, (_, f) => Math.max(...encsOpcoes.slice(f * porFileira, f * porFileira + porFileira).map(alturaOpcao))).reduce((s, h) => s + h + 14, 10)
    : 0;
  const disponivel = Math.max(78, area.h - 78 - 24 - alturaOpcoes);
  let enc = caber(m.texto, { largura: larguraPergunta, max: 84, min: 50, linhas: 3 });
  for (let max = 78; enc.linhas.length * enc.tamanho * 1.08 > disponivel && max >= 40; max -= 4) {
    enc = caber(m.texto, { largura: larguraPergunta, max, min: Math.min(max, 40), linhas: 4 });
  }
  const pFermata = prog(t, inicio - 0.05, 0.45);

  return (
    <Cartao t={t} de={m.de} area={area}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: VAO_FERMATA }}>
          <div style={{ flexShrink: 0 }}>
            <Fermata p={pFermata} />
          </div>
          <div style={{ width: larguraPergunta }}>
            <TextoFalado enc={enc} tempos={tempos} t={t} cor={cor.marfim} peso={800} />
          </div>
        </div>
        {opcoes.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: `14px ${GAP}px`, marginTop: 24 }}>
            {opcoes.map((o, i) => {
              const p = prog(t, o.em - 0.04, 0.3);
              const { tempos: tOpcao } = temposDasPalavras(o.texto, palavras, o.em - 0.1, opcoes[i + 1]?.em ?? fim, o.em);
              return (
                <div
                  key={`${o.texto}-${i}`}
                  style={{
                    width: larguraDaCaixa(porFileira) - 1,
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    gap: 18,
                    padding: "16px 22px",
                    borderRadius: 24,
                    border: `3px ${p > 0.3 ? "solid" : "dashed"} ${p > 0.3 ? cor.azul : cor.lapisForte}`,
                    background: `rgba(134,197,238,${0.16 * p})`,
                  }}
                >
                  <div style={{ width: 46, flexShrink: 0, display: "flex", justifyContent: "center" }}>
                    <Palheta p={p} tamanho={44} />
                  </div>
                  <TextoFalado enc={encsOpcoes[i]} tempos={tOpcao} t={t} cor={cor.marfim} peso={700} espacamento={0} />
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </Cartao>
  );
};
