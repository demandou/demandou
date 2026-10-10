// Comparação: as duas coisas comparadas ficam em duas linhas, uma embaixo da outra, na faixa de
// cima; a pessoa continua embaixo. Com `escala`, a linha do espelho vira a régua do tempo (0 à
// esquerda, o tempo passando para a direita, tiques subindo da linha) e cada lado ganha uma faixa
// dourada que cresce sobre o seu trilho enquanto a pessoa fala o prazo, com os números em
// destaque em cima da faixa. Sem escala, cada linha mostra um rostinho com as áreas daquele lado
// e até 3 itens curtos (o rostinho troca de lado de uma linha para a outra, como um reflexo).
// A linha cujo nome está sendo falado fica em foco: nome inteiro e sublinhado em ouro.
import { mistura, PalavraRevelada, prog, saindo, temposDoTexto, Traco } from "../anim";
import { BARRA, EIXO, geometriaDaComparacao } from "../geometria";
import type { Comparacao as TComparacao, LadoComparado, Palavra } from "../plano";
import { caber, cor, LIMITE_DIREITO, MARGEM_ESQUERDA, rotulo, sans, serif } from "../tema";
import { Rosto, ROSTO_H, ROSTO_W } from "./Rosto";

// largura média de um caractere da Bodoni nos nomes (folgada: letras largas como m, n, h, P)
const FATOR_NOME = 0.57;
const UNIDADE = 32;
// largura aproximada de um rótulo em caixa alta (Jost 34 px, espaçado)
const larguraRotulo = (texto: string, tamanho = 34) => texto.length * tamanho * 0.82;

// "4 a 6 meses" → número "4 a 6" + unidade "meses"; "1 ano e meio" → "1" + "ano e meio"
const separar = (texto: string) => {
  const w = texto.split(/\s+/).filter(Boolean);
  let n = 0;
  while (n < w.length && (/^\d/.test(w[n]) || (/^(a|e|ou|–|-|×)$/i.test(w[n]) && /^\d/.test(w[n + 1] ?? "")))) n++;
  return { cabeca: w.slice(0, n), resto: w.slice(n) };
};
const larguraDoBloco = (texto: string, numero: number) => {
  const { cabeca, resto } = separar(texto);
  if (!cabeca.length) return texto.length * 64 * 0.5;
  return Math.max(cabeca.join(" ").length * numero * 0.5, larguraRotulo(resto.join(" "), UNIDADE));
};

const BlocoFaixa: React.FC<{ texto: string; tempos: number[]; t: number; direita: boolean; numero: number }> = ({ texto, tempos, t, direita, numero }) => {
  const { cabeca, resto } = separar(texto);
  const semNumero = cabeca.length === 0;
  const linha = (lista: string[], desde: number, estilo: React.CSSProperties) => (
    <div style={{ display: "flex", justifyContent: direita ? "flex-end" : "flex-start", ...estilo }}>
      {lista.map((w, i) => (
        <PalavraRevelada
          key={`${w}-${i}`}
          w={w}
          p={prog(t, tempos[desde + i] ?? 0, 0.42)}
          margem={i < lista.length - 1 ? (estilo.fontFamily === sans ? "0.45em" : "0.22em") : 0}
          style={/^(a|e|ou)$/i.test(w) && estilo.fontFamily === serif ? { fontStyle: "italic", fontWeight: 400 } : undefined}
        />
      ))}
    </div>
  );
  return (
    <div>
      {semNumero
        ? linha(resto, 0, { fontFamily: serif, fontWeight: 500, fontSize: 64, lineHeight: 1, color: cor.cafe })
        : linha(cabeca, 0, { fontFamily: serif, fontWeight: 500, fontSize: numero, lineHeight: 0.92, color: cor.cafe, letterSpacing: "-0.02em" })}
      {!semNumero && resto.length
        ? linha(resto, cabeca.length, { ...rotulo, fontFamily: sans, fontSize: UNIDADE, letterSpacing: "0.2em", marginTop: 10 })
        : null}
    </div>
  );
};

export const Comparacao: React.FC<{
  m: TComparacao;
  t: number;
  fim: number;
  // altura da linha do espelho neste momento (px)
  linha: number;
  palavras: Palavra[];
}> = ({ m, t, fim, linha, palavras }) => {
  const g = geometriaDaComparacao(m, linha);
  const sai = saindo(t, fim, 0.26);
  const lados: LadoComparado[] = [m.esquerda!, m.direita!];
  const escala = m.escala;
  // lado em foco: o último cujo nome já foi dito
  const ordem = [...lados].sort((a, b) => a.em - b.em);
  const foco = ordem.filter((l) => t >= l.em - 0.05).pop();

  const pRegua = prog(t, m.de + 0.15, 1.0);
  const passo = escala ? (escala.passo ?? escala.ate / 6) : 1;
  const marcas = escala ? Array.from({ length: Math.floor(escala.ate / passo + 1e-6) + 1 }, (_, i) => i * passo) : [];
  const temposRotulo = temposDoTexto(m.rotulo ?? "", palavras, m.de, m.ate, m.de + 0.3);
  const larguraTotal = LIMITE_DIREITO - MARGEM_ESQUERDA;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - sai }}>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {/* régua: tiques que sobem da linha do espelho */}
        {marcas.map((v, i) => {
          const x = g.xDe(v);
          const longa = i === 0 || i === marcas.length - 1 || Math.abs(v % (passo * 2)) < 1e-6;
          return (
            <Traco
              key={`m${v}`}
              d={`M ${x} ${linha - 1} L ${x} ${linha - (longa ? 26 : 14)}`}
              p={prog(pRegua, i / (marcas.length + 2), 0.3, (x) => x)}
              cor={cor.ouro}
              largura={2.5}
            />
          );
        })}
        {/* trilhos vazios e faixas que crescem */}
        {escala
          ? lados.map((lado, r) => {
              const y = g.linhas[r].yBarra;
              const f = lado.faixa;
              const p = f ? prog(t, f.em, Math.max(0.5, (f.emFim ?? f.em + 0.8) - f.em)) : 0;
              const x1 = f ? g.xDe(f.de) : 0;
              const x2 = f ? mistura(x1, g.xDe(f.ate), p) : 0;
              return (
                <g key={`f${r}`}>
                  <Traco d={`M ${EIXO.x0} ${y} L ${EIXO.x1} ${y}`} p={prog(pRegua, r * 0.12, 0.8)} cor={cor.nude} largura={BARRA} />
                  {f && p > 0 ? <line x1={x1} x2={Math.max(x1 + 0.1, x2)} y1={y} y2={y} stroke={cor.ouro} strokeWidth={BARRA} strokeLinecap="round" /> : null}
                </g>
              );
            })
          : null}
      </svg>

      {/* rótulo do que está sendo comparado */}
      {m.rotulo ? (
        <div style={{ position: "absolute", left: MARGEM_ESQUERDA, width: larguraTotal, top: 168, display: "flex", justifyContent: "center" }}>
          <div style={{ ...rotulo, fontSize: 36, display: "flex" }}>
            {m.rotulo.split(/\s+/).map((w, i, lista) => (
              <PalavraRevelada key={`${w}-${i}`} w={w} p={prog(t, temposRotulo[i], 0.4)} margem={i < lista.length - 1 ? "0.5em" : 0} semFio />
            ))}
          </div>
        </div>
      ) : null}

      {lados.map((lado, r) => {
        const L = g.linhas[r];
        const emFoco = foco === lado;
        // o lado que perdeu o foco apaga devagar; o que ainda não foi falado espera
        const jaFoiFoco = !!foco && lado.em < foco.em;
        const pFoco = emFoco ? prog(t, lado.em, 0.8) : jaFoiFoco ? 1 - prog(t, foco.em, 0.8) : 0;
        const opacity = mistura(foco && !emFoco ? 0.45 : 1, 1, pFoco);
        const pNome = prog(t, lado.em - 0.05, 0.5);
        const pSublinha = prog(t, lado.em, 0.6);
        const f = lado.faixa;
        const sobre = lado.textos?.sobre;
        const emInicio = lado.textos?.inicioEm ?? f?.em ?? lado.em;
        const emFim = lado.textos?.fimEm ?? (f?.emFim ?? lado.em + 1) - 1;
        const emSobre = lado.textos?.sobreEm ?? lado.em;
        const temposInicio = temposDoTexto(lado.textos?.inicio ?? "", palavras, emInicio, m.ate, emInicio);
        const temposFim = temposDoTexto(lado.textos?.fim ?? "", palavras, emFim, m.ate, emFim + 0.5);
        const temposSobre = temposDoTexto(sobre ?? "", palavras, emSobre, m.ate, emSobre + 0.3);

        if (!escala) {
          // sem régua: rostinho de um lado (troca de lado na segunda linha), nome e itens do outro
          const rostoEsquerda = r === 0;
          const esc = Math.min(0.56, (g.alturaLinha - 6) / ROSTO_H);
          const rw = ROSTO_W * esc;
          const rx = rostoEsquerda ? MARGEM_ESQUERDA : LIMITE_DIREITO - rw;
          const tx = rostoEsquerda ? MARGEM_ESQUERDA + rw + 48 : MARGEM_ESQUERDA;
          const tw = larguraTotal - rw - 48;
          const tamNome = Math.min(g.nome, caber(lado.titulo, tw, g.nome, FATOR_NOME));
          return (
            <div key={r}>
              <div style={{ position: "absolute", left: rx, top: L.topo + 3, opacity: mistura(0.5, 1, Math.max(pFoco, emFoco ? 1 : 0)) }}>
                <Rosto
                  t={t}
                  desenhoEm={lado.em - 0.05}
                  areas={(lado.areas ?? []).map((a, k) => ({ area: a, em: lado.em + 0.55 + k * 0.12 }))}
                  mapeamentoEm={lado.em + 0.7}
                  escala={esc}
                  peso={1.5}
                  numeros={false}
                />
              </div>
              <div style={{ position: "absolute", left: tx, width: tw, top: L.topo, opacity }}>
                <div style={{ height: g.nome, display: "flex", alignItems: "flex-end" }}>
                  <PalavraRevelada w={lado.titulo} p={pNome} style={{ fontFamily: serif, fontWeight: 500, fontSize: tamNome, lineHeight: 1, color: cor.cafe, whiteSpace: "nowrap" }} />
                </div>
                <div style={{ height: 3, marginTop: 8, background: cor.ouro, width: `${pSublinha * 36}%` }} />
              </div>
              {(lado.itens ?? []).slice(0, 3).map((it, k) => (
                <div key={k} style={{ position: "absolute", left: tx, width: tw, top: L.topo + g.nome + 14 + k * g.item * 1.22 }}>
                  <PalavraRevelada
                    w={it.texto}
                    p={prog(t, it.em, 0.45)}
                    style={{ fontFamily: serif, fontWeight: 500, fontSize: Math.min(g.item, caber(it.texto, tw, g.item, FATOR_NOME)), lineHeight: 1.1, color: cor.cafe, whiteSpace: "nowrap" }}
                  />
                </div>
              ))}
            </div>
          );
        }

        // com régua: nome (e a ressalva à direita) · números sobre a faixa · faixa
        const larguraSobre = sobre ? larguraRotulo(sobre) + 40 : 0;
        const tamNome = Math.min(g.nome, caber(lado.titulo, EIXO.x1 - EIXO.x0 - larguraSobre, g.nome, FATOR_NOME));
        const inicio = lado.textos?.inicio;
        const fimTexto = lado.textos?.fim;
        const xInicio = f ? g.xDe(f.de) : EIXO.x0;
        const wInicio = inicio ? larguraDoBloco(inicio, g.numero) : 0;
        // sem `fim`, o número fica no começo da faixa; se não couber até o fim da régua, alinha à direita
        const inicioADireita = !fimTexto && xInicio - 4 + wInicio > EIXO.x1;
        const xFim = f ? Math.min(LIMITE_DIREITO, g.xDe(f.ate) + 4) : EIXO.x1;
        // rostinho com as áreas deste lado, no espaço livre à direita do número (se couber)
        const alturaRostinho = g.nome + 10 + g.bloco;
        const escRostinho = Math.min(0.5, alturaRostinho / ROSTO_H);
        const wRostinho = ROSTO_W * escRostinho;
        const temRostinho = !!lado.areas?.length && !fimTexto && !sobre && !inicioADireita && xInicio + wInicio + 60 < EIXO.x1 - wRostinho;
        return (
          <div key={r}>
            <div style={{ position: "absolute", left: EIXO.x0 - 4, top: L.topo, opacity }}>
              <div style={{ height: g.nome, display: "flex", alignItems: "flex-end" }}>
                <PalavraRevelada w={lado.titulo} p={pNome} style={{ fontFamily: serif, fontWeight: 500, fontSize: tamNome, lineHeight: 1, color: cor.cafe, whiteSpace: "nowrap" }} />
              </div>
            </div>
            {/* sublinhado de foco, sob o nome */}
            <div style={{ position: "absolute", left: EIXO.x0, top: L.topo + g.nome + 2, height: 3, background: cor.ouro, width: pSublinha * Math.min(240, lado.titulo.length * tamNome * 0.3), opacity }} />
            {sobre ? (
              <div style={{ position: "absolute", left: EIXO.x0, width: EIXO.x1 - EIXO.x0, top: L.topo + g.nome - 40, display: "flex", justifyContent: "flex-end" }}>
                <div style={{ ...rotulo, display: "flex" }}>
                  {sobre.split(/\s+/).map((w, i, lista) => (
                    <PalavraRevelada key={`${w}-${i}`} w={w} p={prog(t, temposSobre[i], 0.4)} margem={i < lista.length - 1 ? "0.5em" : 0} semFio />
                  ))}
                </div>
              </div>
            ) : null}
            {inicio ? (
              <div
                style={{
                  position: "absolute",
                  left: inicioADireita ? EIXO.x1 - 600 : xInicio - 4,
                  width: 600,
                  top: L.yNumero,
                  display: "flex",
                  justifyContent: inicioADireita ? "flex-end" : "flex-start",
                }}
              >
                <BlocoFaixa texto={inicio} tempos={temposInicio} t={t} direita={inicioADireita} numero={g.numero} />
              </div>
            ) : null}
            {fimTexto ? (
              <div style={{ position: "absolute", left: xFim - 600, width: 600, top: L.yNumero, display: "flex", justifyContent: "flex-end" }}>
                <BlocoFaixa texto={fimTexto} tempos={temposFim} t={t} direita numero={g.numero} />
              </div>
            ) : null}
            {temRostinho ? (
              <div style={{ position: "absolute", left: EIXO.x1 - wRostinho, top: L.topo + 4, opacity: mistura(0.55, 1, Math.max(pFoco, emFoco ? 1 : 0)) }}>
                <Rosto
                  t={t}
                  desenhoEm={lado.em + 0.05}
                  areas={(lado.areas ?? []).map((a, k) => ({ area: a, em: lado.em + 0.55 + k * 0.12 }))}
                  mapeamentoEm={lado.em + 0.7}
                  escala={escRostinho}
                  peso={1.5}
                  numeros={false}
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
