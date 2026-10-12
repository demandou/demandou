// O cartão de herbário dos blocos universais de tela cheia: `frase`, `pergunta`, `cta` (com `texto`)
// e `nota` (com `texto`). A pessoa em tela cheia, o cartão sobe até a altura do peito, um pouco
// inclinado: rótulo em versalete, fio de pena, o texto que nasce a lápis e ganha tinta na fala.
// No quadro deitado o cartão é largo e baixo, na faixa de baixo (do queixo até o limite de baixo):
// as opções da pergunta ficam lado a lado, numa fileira, e a assinatura vai na linha do rótulo.
// - frase: `destaque` em itálico verde-musgo com aguada; `risco` riscado à pena em garança no `riscoEm`;
// - pergunta: um medalhão com "?" no canto; as opções são etiquetas de espécime (a, b, c, d);
// - cta: o ícone (salvar, seguir, comentar, link) se desenha no canto; a assinatura "leg." embaixo.
// O cartão mede o próprio conteúdo e nunca desce para os controles do player.
import { prog, saindo, temposDoTexto, Traco } from "../anim";
import { encaixar } from "../medida";
import type { Cta, Frase, Nota, Palavra, Pergunta, Plano } from "../plano";
import { cor, LIMITE_APP, QUADRO, serif, traco, versalete } from "../tema";
import { Assinatura, ESCALA_RAMINHO, Icone, LARGURA_DEITADO, Raminho } from "./Cartao";
import { EtiquetaDeItem, medirEtiquetaDeItem, TextoNaFala } from "./Pecas";

type MomentoDoCartao = Frase | Pergunta | Cta | Nota;

const LARGURA = LARGURA_DEITADO;
const ESQUERDA = (QUADRO.w - LARGURA) / 2;
const PAD = 40;
const LIMITE = LIMITE_APP;
// vão entre as opções da pergunta, lado a lado
const VAO_OPCOES = 16;

const textoDe = (m: MomentoDoCartao) => (m.tipo === "nota" ? (m.texto ?? (m.linhas ?? []).join(" ")) : (m.texto ?? ""));

// Mede o cartão para um corpo máximo do texto principal. `comCanto` = o raminho (ou o "?") ocupa a
// direita do corpo; sem ele, o texto usa a largura toda e o sinal vai, pequeno, para a linha do rótulo.
const medir = (m: MomentoDoCartao, max: number, assinatura: string, comCanto: boolean) => {
  const pergunta = m.tipo === "pergunta";
  const icone = m.tipo === "cta" ? m.icone : undefined;
  const canto = comCanto ? (pergunta ? 150 : Math.round(196 * ESCALA_RAMINHO)) : 0;
  const larguraTexto = LARGURA - PAD * 2 - canto;
  const e = encaixar(textoDe(m), { largura: larguraTexto, max, min: Math.min(60, max), linhas: 3, fonte: "serif" });
  const cabecalho = icone ? 96 : 60;
  const linhaY = 30 + cabecalho + 2;
  const textoY = linhaY + 28;
  const alturaTexto = e.linhas.length * e.tamanho * 1.02;
  const opcoes = pergunta ? (m.opcoes ?? []).slice(0, 4) : [];
  // as opções numa fileira só, cada uma na sua coluna (todas da mesma largura)
  const larguraOpcao = opcoes.length ? (LARGURA - PAD * 2 - (opcoes.length - 1) * VAO_OPCOES) / opcoes.length : 0;
  const medidasOpcoes = opcoes.map((o) => medirEtiquetaDeItem(o.texto, larguraOpcao, { max: 50, min: 34 }));
  const alturaFileira = Math.max(0, ...medidasOpcoes.map((md) => md.altura));
  const alturaOpcoes = medidasOpcoes.length ? 26 + alturaFileira : 0;
  // a assinatura do fechamento vai na linha do rótulo (não ocupa altura)
  void assinatura;
  const conteudo = textoY + alturaTexto + alturaOpcoes + 40;
  const altura = comCanto ? Math.max(conteudo, pergunta ? linhaY + 190 : linhaY + 6 + 260 * ESCALA_RAMINHO + 24) : conteudo;
  return { e, larguraTexto, linhaY, textoY, alturaTexto, opcoes, medidasOpcoes, larguraOpcao, alturaFileira, altura, icone, pergunta, comCanto };
};

export const CartaoNovo: React.FC<{
  m: MomentoDoCartao;
  t: number;
  fim: number;
  palavras: Palavra[];
  marca: Plano["marca"];
  // topo desejado (logo abaixo do queixo)
  topo: number;
  entrada: number;
}> = ({ m, t, fim, palavras, marca, topo, entrada }) => {
  const sobe = prog(t, entrada, 0.7);
  const sai = saindo(t, fim, 0.3);
  if (sobe <= 0.001 || sai >= 1) return null;
  const assinatura = [marca.nome, marca.area].filter(Boolean).join(" · ");
  // o maior corpo em que o cartão cabe entre o queixo e a interface do app; com o raminho no canto
  // quando o texto continua grande (≥ 80 px), senão sem ele (o texto ganha a largura toda)
  const caber = (comCanto: boolean) => {
    let md = medir(m, 92, assinatura, comCanto);
    for (const max of [86, 80, 74, 68, 62]) {
      if (topo + md.altura <= LIMITE + 4) break;
      md = medir(m, max, assinatura, comCanto);
    }
    return md;
  };
  const comCanto = caber(true);
  const medida = comCanto.e.tamanho >= 80 && topo + comCanto.altura <= LIMITE + 4 ? comCanto : caber(false);
  const { e, larguraTexto, linhaY, textoY, alturaTexto, opcoes, medidasOpcoes, larguraOpcao, alturaFileira, altura, icone, pergunta } = medida;
  const y = Math.min(topo, LIMITE - altura);
  const em = m.tipo === "cta" || m.tipo === "frase" || m.tipo === "pergunta" ? (m.em ?? m.de) : m.de;
  const tempos = temposDoTexto(e.linhas.join(" "), palavras, em, m.ate, em);
  const fimTexto = tempos[tempos.length - 1] ?? m.de;
  const lapis = prog(t, entrada, 0.3);
  const rotulo =
    (m.tipo === "cta" ? undefined : m.rotulo) ?? (m.tipo === "pergunta" ? "Pergunta" : m.tipo === "cta" ? "Herbário" : "Nota");
  const emIcone = m.tipo === "cta" ? (m.em ?? m.de) + 0.15 : 0;
  const raminho = prog(t, fimTexto - 0.2, 0.9);
  const interrogacao = pergunta ? prog(t, em - 0.1, 0.6) : 0;
  const risco = m.tipo === "frase" ? m.risco : undefined;
  const riscoEm = m.tipo === "frase" ? m.riscoEm : undefined;
  const destaque = m.tipo === "pergunta" ? undefined : m.destaque;
  const yOpcoes = textoY + alturaTexto + 26 + alturaFileira / 2;

  return (
    <div
      style={{
        position: "absolute",
        left: ESQUERDA,
        top: y,
        width: LARGURA,
        height: altura,
        translate: `0 ${(1 - sobe) * (QUADRO.h - y + 40) + sai * 30}px`,
        rotate: `${-1.2 * sobe}deg`,
        opacity: 1 - sai,
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: cor.etiqueta, border: `2.5px solid ${cor.tinta}`, boxShadow: "0 18px 40px rgba(20,28,22,0.28)" }} />
      <div style={{ position: "absolute", inset: 12, border: `1.2px solid ${cor.tinta}`, opacity: 0.6 }} />
      <div style={{ position: "absolute", left: PAD, right: PAD, top: 30, height: linhaY - 30, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: versalete, fontWeight: 700, fontSize: 32, letterSpacing: "0.12em", textTransform: "uppercase", color: cor.musgo }}>{rotulo}</div>
        {m.tipo === "cta" && assinatura ? (
          <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
            <Assinatura texto={assinatura} />
            {icone ? <Icone icone={icone} p={prog(t, emIcone, 0.5)} /> : null}
          </div>
        ) : icone ? (
          <Icone icone={icone} p={prog(t, emIcone, 0.5)} />
        ) : null}
        {!medida.comCanto && pergunta ? (
          <svg width={64} height={64} viewBox="-32 -32 64 64" style={{ overflow: "visible" }}>
            <circle r={28} fill="none" stroke={cor.grafite} strokeWidth={2} opacity={lapis * (1 - interrogacao)} />
            <Traco d="M 0 -28 A 28 28 0 1 1 -0.1 -28" p={interrogacao} cor={cor.musgo} largura={traco.medio} />
            <text x={0} y={15} textAnchor="middle" fontFamily={serif} fontStyle="italic" fontWeight={600} fontSize={44} fill={interrogacao > 0.4 ? cor.musgo : cor.grafite}>
              ?
            </text>
          </svg>
        ) : null}
      </div>
      <div style={{ position: "absolute", left: PAD, right: PAD, top: linhaY, height: 2, background: cor.tinta, opacity: 0.7 }} />
      <div style={{ position: "absolute", left: PAD, top: textoY, width: larguraTexto }}>
        <TextoNaFala linhas={e.linhas} tempos={tempos} t={t} tamanho={e.tamanho} destaque={destaque} lapis={lapis} entrelinha={1.0} risco={risco} riscoEm={riscoEm} />
      </div>
      {opcoes.map((o, i) => (
        <EtiquetaDeItem
          key={i}
          x={PAD + i * (larguraOpcao + VAO_OPCOES)}
          y={yOpcoes}
          medida={{ ...medidasOpcoes[i], altura: alturaFileira }}
          largura={larguraOpcao}
          numero={String.fromCharCode(97 + i)}
          em={o.em}
          t={t}
        />
      ))}
      {!medida.comCanto ? null : pergunta ? (
        <svg width={150} height={150} viewBox="-75 -75 150 150" style={{ position: "absolute", right: PAD - 10, top: linhaY + 26, overflow: "visible" }}>
          <circle r={60} fill={cor.musgo} opacity={0.12 * interrogacao} />
          <circle r={60} fill="none" stroke={cor.grafite} strokeWidth={2} opacity={lapis * (1 - interrogacao)} />
          <Traco d="M 0 -60 A 60 60 0 1 1 -0.1 -60" p={interrogacao} cor={cor.musgo} largura={traco.forte} />
          <text x={0} y={30} textAnchor="middle" fontFamily={serif} fontStyle="italic" fontWeight={600} fontSize={92} fill={interrogacao > 0.4 ? cor.musgo : cor.grafite}>
            ?
          </text>
        </svg>
      ) : (
        <Raminho p={raminho} right={34} top={linhaY + 6} escala={ESCALA_RAMINHO} />
      )}
    </div>
  );
};
