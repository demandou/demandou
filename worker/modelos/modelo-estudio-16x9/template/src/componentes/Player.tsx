// Player: o fechamento (`cta`, ou `player`, o nome antigo). O quadro da pessoa vira a capa de um player
// de podcast. No 16:9 o cartão do player ocupa a largura toda (um bloco de tela cheia, recomposto
// deitado): a capa fica à direita (com a onda presa embaixo dela) e, à esquerda, o rótulo falado, o
// título do episódio, o programa, a barra do episódio inteiro com o trecho do corte marcado, o tempo
// e os controles, no meio da altura do cartão; fora do cartão, embaixo, a chamada falada, com o verbo
// no botão que é apertado ("Segue", "Toca"). Chamada comprida quebra em até 3 linhas: a capa e o
// cartão encolhem para ela caber.
import { indicesDoTrecho, limitar, Linhas, prog, relogio, saindo, segundos, temposDoTexto } from "../anim";
import { ALTURA_BOTAO, diagramarChamada, type Fechamento, PASSO_LINHA, partesDaChamada, textoDaChamada } from "../chamada";
import { geometriaDoPlayer } from "../layout";
import { ESPACO, medir, medirMono } from "../medidas";
import type { Palavra, Plano } from "../plano";
import { comAlfa, cor, rotulo, sans, titulo } from "../tema";
import { IconeDoBotao } from "./comum";

// o cartão do player fica atrás da capa (desenhado antes da pessoa)
// o cartão abre a partir do quadro da pessoa (opaco: cobre o que estava embaixo, sem transparência)
export const FundoDoPlayer: React.FC<{ m: Fechamento; t: number; fim: number }> = ({ m, t, fim }) => {
  const { capa, cartao: C } = geometriaDoPlayer(m);
  const p = prog(t, m.de - 0.1, 0.6);
  const s = saindo(t, fim + 0.1, 0.3);
  // recorte que vai do retângulo da capa até o cartão inteiro
  const cima = (capa.y - C.y) * (1 - p);
  const baixo = (C.y + C.h - (capa.y + capa.h)) * (1 - p);
  const lado = (capa.x - C.x) * (1 - p);
  return (
    <div
      style={{
        position: "absolute",
        left: C.x,
        top: C.y,
        width: C.w,
        height: C.h,
        borderRadius: C.raio,
        background: cor.painel,
        boxShadow: `inset 0 0 0 1.5px ${cor.borda}`,
        clipPath: `inset(${cima}px ${lado}px ${baixo}px ${lado}px round ${C.raio}px)`,
        opacity: 1 - s,
      }}
    />
  );
};

// o título do player: o do plano, senão o texto da abertura, senão o programa
const tituloDo = (m: Fechamento, plano: Plano) => {
  if (m.titulo) return m.titulo;
  const abertura = plano.momentos.find((o) => o.tipo === "abertura");
  const texto = abertura?.tipo === "abertura" ? (abertura.texto ?? abertura.titulo) : undefined;
  return texto ?? plano.marca.area ?? "";
};

export const Player: React.FC<{ m: Fechamento; plano: Plano; palavras: Palavra[]; t: number; fim: number }> = ({ m, plano, palavras, t, fim }) => {
  const { capa, cartao: C } = geometriaDoPlayer(m);
  // a coluna do episódio: da borda do cartão até um pouco antes da capa
  const x0 = C.x + 56;
  const largura = capa.x - 56 - x0;
  // a altura da coluna (rótulo, título, programa, barra, tempos, controles), para centrar no cartão
  const textoTitulo = tituloDo(m, plano);
  const tamTitulo = Math.max(36, Math.min(58, largura / Math.max(0.1, medir(textoTitulo, 1, 800))));
  const alturaColuna = (m.rotulo ? 34 + 12 : 0) + tamTitulo * 1.1 + 6 + 36 + 28 + 22 + 46 + 80;
  let y = C.y + Math.max(40, (C.h - alturaColuna) / 2);
  const yRotulo = y;
  // sem rótulo, o título sobe para o lugar dele
  if (m.rotulo) y += 34 + 12;
  // o título cabe numa linha: o corpo diminui se for comprido (até 36 px)
  const yTitulo = y;
  y += tamTitulo * 1.1 + 6;
  const yMarca = y;
  // "Programa · Nome" numa linha: o corpo desce até 30 px; mais comprido que isso, reticências
  const textoMarca = [plano.marca.area, plano.marca.nome].filter(Boolean).join(" · ");
  const tamMarca = Math.max(30, Math.min(36, largura / Math.max(0.1, medir(textoMarca, 1, 600))));
  y += 36 + 28;
  const yBarra = y;
  const yTempos = y + 22;
  const yControles = yTempos + 46;

  const inicioFala = m.em ?? m.de;
  const entra = prog(t, m.de + 0.1, 0.45);
  const s = saindo(t, fim + 0.1, 0.3);

  // rótulo falado, em mono, palavra por palavra
  const textoRotulo = (m.rotulo ?? "").toUpperCase();
  const temposRotulo = temposDoTexto(textoRotulo, palavras, m.de, m.ate, inicioFala + 0.1);
  const tamRotulo = Math.max(30, Math.min(34, largura / Math.max(1, medirMono(textoRotulo, 1))));

  // barra do episódio: onde o corte fica dentro do episódio inteiro
  const total = segundos(plano.episodio?.total);
  const inicio = segundos(plano.episodio?.inicio);
  const temBarra = total > 0 && inicio < total;
  const agora = inicio + t;
  const xCorte = temBarra ? (inicio / total) * largura : 0;
  const wCorte = temBarra ? Math.max(18, (plano.duracao / total) * largura) : largura;
  const pAgulha = limitar(t / plano.duracao);
  const pBarra = prog(t, m.de + 0.15, 0.6);
  const restoEm = m.restoEm ?? Infinity;
  const pResto = prog(t, restoEm, 0.6);
  const minutosResto = temBarra ? Math.max(1, Math.round((total - inicio - plano.duracao) / 60)) : 0;

  // chamada: o verbo vai no botão (contornado até ser dito); o resto fica a lápis e acende na fala
  const chamada = textoDaChamada(m);
  const { palavras: ws, indice, origem } = partesDaChamada(m);
  const temposChamada = temposDoTexto(chamada, palavras, m.de, plano.duracao, inicioFala + 0.2);
  const seguirEm = m.seguirEm ?? temposChamada[origem[indice]] ?? Infinity;
  const aperta = prog(t, seguirEm - 0.02, 0.18);
  const assenta = prog(t, seguirEm + 0.16, 0.3);
  const destaque = indicesDoTrecho(chamada, m.destaque);
  const { linhas: linhasChamada, tam: tamChamada } = diagramarChamada(m, C.w);
  const yChamada = C.y + C.h + 20;
  const tamIcone = Math.round(tamChamada * 0.78);

  const palavra = (i: number) => {
    const w = ws[i];
    if (i === indice) {
      const tinta = aperta > 0.5 ? cor.sobreAcento : cor.acento;
      return (
        <div
          key={`b-${i}`}
          style={{
            height: ALTURA_BOTAO,
            padding: "0 28px",
            borderRadius: ALTURA_BOTAO / 2,
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexShrink: 0,
            background: aperta > 0.02 ? comAlfa(cor.acento, aperta) : "transparent",
            boxShadow: aperta > 0.98 ? "none" : `inset 0 0 0 3px ${cor.acento}`,
            scale: String(1 - 0.08 * aperta * (1 - assenta)),
          }}
        >
          {m.icone ? <IconeDoBotao nome={m.icone} tam={tamIcone} cor={tinta} /> : null}
          <span style={{ ...titulo, fontSize: tamChamada, lineHeight: 1, color: tinta, whiteSpace: "nowrap" }}>{w}</span>
        </div>
      );
    }
    return (
      <Linhas
        key={`w-${i}`}
        linhas={[w]}
        tempos={[temposChamada[origem[i]] ?? Infinity]}
        t={t}
        tam={tamChamada}
        modo="acende"
        entrelinha={1.2}
        estilo={{ ...titulo, fontSize: tamChamada }}
        corDe={() => (destaque.has(origem[i]) ? cor.acento : undefined)}
      />
    );
  };

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - s }}>
      <div style={{ position: "absolute", left: x0, top: 0, width: largura, height: "100%", opacity: entra, translate: `0 ${(1 - entra) * 40}px` }}>
        {textoRotulo ? (
          <div style={{ position: "absolute", left: 0, top: yRotulo }}>
            <Linhas linhas={[textoRotulo]} tempos={temposRotulo} t={t} tam={tamRotulo} modo="monta" entrelinha={1} estilo={{ ...rotulo, fontSize: tamRotulo }} corDe={() => cor.acento} />
          </div>
        ) : null}
        <div style={{ position: "absolute", left: 0, top: yTitulo, width: largura, ...titulo, fontSize: tamTitulo, lineHeight: 1.1, color: cor.texto, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {textoTitulo}
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: yMarca,
            width: largura,
            fontFamily: sans,
            fontWeight: 600,
            fontSize: tamMarca,
            lineHeight: 1.1,
            color: cor.textoSuave,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {textoMarca}
        </div>

        {/* a barra do episódio inteiro */}
        <div style={{ position: "absolute", left: 0, top: yBarra, width: largura, height: 10, borderRadius: 5, background: cor.apagado, overflow: "hidden" }}>
          {temBarra ? <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: xCorte * pBarra, background: comAlfa(cor.texto, 0.7) }} /> : null}
          {temBarra && pResto > 0 ? (
            <div style={{ position: "absolute", left: xCorte + wCorte, top: 0, height: "100%", width: (largura - xCorte - wCorte) * pResto, background: comAlfa(cor.acento, 0.42) }} />
          ) : null}
          <div style={{ position: "absolute", left: xCorte, top: 0, height: "100%", width: wCorte * (temBarra ? pBarra : pAgulha), background: cor.acento }} />
        </div>
        {/* a agulha do player, no ponto em que o corte está tocando */}
        <div
          style={{
            position: "absolute",
            left: (temBarra ? xCorte + wCorte * pAgulha : wCorte * pAgulha) - 11,
            top: yBarra - 6,
            width: 22,
            height: 22,
            borderRadius: 11,
            background: cor.texto,
            opacity: pBarra,
          }}
        />
        {temBarra && pResto > 0 ? (
          <div style={{ position: "absolute", right: 0, top: yBarra - 50, ...rotulo, fontSize: 32, color: cor.acento, opacity: pResto }}>+{minutosResto} MIN</div>
        ) : null}
        <div style={{ position: "absolute", left: 0, top: yTempos, width: largura, display: "flex", justifyContent: "space-between" }}>
          <span style={{ ...rotulo, fontSize: 32, color: cor.textoSuave }}>{relogio(temBarra ? agora : t)}</span>
          <span style={{ ...rotulo, fontSize: 32, color: cor.textoSuave }}>{temBarra ? relogio(total) : relogio(plano.duracao)}</span>
        </div>

        {/* controles: voltar, pausa (tocando), avançar */}
        <svg width={largura} height={80} style={{ position: "absolute", left: 0, top: yControles }}>
          <g transform={`translate(${largura / 2 - 150}, 40)`} fill={cor.textoSuave}>
            <path d="M8 -14 L8 14 L-12 0 Z M-12 -14 L-16 -14 L-16 14 L-12 14 Z" />
          </g>
          <circle cx={largura / 2} cy={40} r={38} fill={cor.acento} />
          <g fill={cor.sobreAcento}>
            <rect x={largura / 2 - 12} y={26} width={8} height={28} rx={2} />
            <rect x={largura / 2 + 4} y={26} width={8} height={28} rx={2} />
          </g>
          <g transform={`translate(${largura / 2 + 150}, 40)`} fill={cor.textoSuave}>
            <path d="M-8 -14 L-8 14 L12 0 Z M12 -14 L16 -14 L16 14 L12 14 Z" />
          </g>
        </svg>
      </div>

      {/* chamada: o verbo é o botão que é apertado; em até 3 linhas */}
      {ws.length ? (
        <div style={{ position: "absolute", left: C.x, top: yChamada, width: C.w, opacity: entra }}>
          {linhasChamada.map((linha, li) => (
            <div key={li} style={{ display: "flex", alignItems: "center", height: ALTURA_BOTAO, marginBottom: li < linhasChamada.length - 1 ? PASSO_LINHA - ALTURA_BOTAO : 0 }}>
              {linha.map((i, k) => {
                const proximo = linha[k + 1];
                const vao = proximo === undefined ? 0 : i === indice || proximo === indice ? tamChamada * 0.3 : tamChamada * ESPACO;
                return (
                  <div key={i} style={{ marginRight: vao, display: "flex" }}>
                    {palavra(i)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};
