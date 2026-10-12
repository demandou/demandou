// Fechamento: a pessoa volta para a tela cheia e um cartão de lembrete sobe ao lado do peito (a
// coluna livre do quadro deitado). O botão
// ("Salvar", "Seguir", "Comentar", "Abrir") afunda e muda na palavra; o título se monta com a fala;
// as etiquetas (quando, onde) esperam a lápis e acendem na palavra. Se houve blocos de tempo, o dia
// aparece em miniatura (concluído, se houve a frase antes).
import { Linhas, prog, temposDoTexto } from "../anim";
import { type Agenda, CARTAO_CTA, colunaDoPeito, yNoPeito } from "../agenda";
import { encaixar, trechoNoTexto } from "../medida";
import type { Cta as TCta, Palavra } from "../plano";
import { CATEGORIAS, cor, rotuloCaixaAlta, sans, sombraCartao } from "../tema";
import { Icone, type NomeIcone } from "./Icones";

type Acao = NonNullable<TCta["icone"]>;
const ACOES: Record<Acao, { antes: string; depois: string; icone: NomeIcone; iconeDepois: NomeIcone }> = {
  salvar: { antes: "Salvar", depois: "Salvo", icone: "salvar", iconeDepois: "salvarCheio" },
  seguir: { antes: "Seguir", depois: "Seguindo", icone: "seguir", iconeDepois: "seguir" },
  comentar: { antes: "Comentar", depois: "Comentado", icone: "comentar", iconeDepois: "comentar" },
  link: { antes: "Abrir", depois: "Aberto", icone: "link", iconeDepois: "link" },
};

export const textoDoCta = (m: TCta) => (m.texto ?? m.titulo ?? "").trim();

// título do cartão: uma linha de 84 se couber, senão duas (até 72), senão três (até 60); `largura`
// é a do texto dentro do cartão
export const tituloDoCta = (texto: string, largura: number) => {
  const opcoes = [
    { max: 84, min: 84, linhas: 1 },
    { max: 72, min: 60, linhas: 2 },
    { max: 60, min: 48, linhas: 3 },
  ];
  for (const o of opcoes) {
    const e = encaixar(texto, { largura, ...o, entrelinha: 1.04, menos: false });
    if (e.linhas.length <= o.linhas && e.tamanho >= o.min) return { tamanho: e.tamanho, linhas: e.linhas, altura: Math.max(100, Math.ceil(e.linhas.length * e.tamanho * 1.04 + 12)) };
  }
  const e = encaixar(texto, { largura, max: 48, min: 40, linhas: 4, entrelinha: 1.04 });
  return { tamanho: e.tamanho, linhas: e.linhas, altura: Math.ceil(e.linhas.length * e.tamanho * 1.04 + 12) };
};

export const alturaDoCta = (comBarra: boolean, texto: string, comEtiquetas: boolean, largura: number) =>
  CARTAO_CTA.pad * 2 + CARTAO_CTA.botao + 22 + tituloDoCta(texto, largura).altura + (comBarra ? 22 + CARTAO_CTA.barra : 0) + (comEtiquetas ? 26 + 78 : 0);

export const Cta: React.FC<{ m: TCta; t: number; palavras: Palavra[]; ag: Agenda; concluido: boolean }> = ({ m, t, palavras, ag, concluido }) => {
  const texto = textoDoCta(m);
  const comBarra = ag.blocos.some((b) => b.em < m.de);
  const comEtiquetas = !!m.etiquetas?.length;
  const acao = ACOES[m.icone ?? m.acao ?? "salvar"];
  const inicio = m.em ?? m.de;
  const tempos = temposDoTexto(texto, palavras, inicio, m.ate, inicio);
  const grifo = trechoNoTexto(texto, m.destaque);
  // entra depois que o texto do momento anterior saiu; o botão afunda na palavra (ou logo que o cartão assenta)
  const entra = prog(t, m.de + 0.1, 0.42);
  const apertou = Math.max(m.acaoEm ?? inicio + 0.3, m.de + 0.4);
  const aperto = prog(t, apertou, 0.3);
  const afunda = 1 - 0.06 * Math.sin(Math.PI * Math.min(1, Math.max(0, (t - apertou) / 0.22)));
  const coluna = colunaDoPeito(ag, m.de, m.ate);
  const barraW = coluna.w - 2 * CARTAO_CTA.pad;
  const altura = alturaDoCta(comBarra, texto, comEtiquetas, barraW);
  const y = yNoPeito(ag, altura, coluna, m.legenda);
  const titulo = tituloDoCta(texto, barraW);
  const yBarra = CARTAO_CTA.pad + CARTAO_CTA.botao + 22 + titulo.altura + 22;
  const yEtiquetas = (comBarra ? yBarra + CARTAO_CTA.barra : CARTAO_CTA.pad + CARTAO_CTA.botao + 22 + titulo.altura) + 26;

  return (
    <div
      style={{
        position: "absolute",
        left: coluna.x,
        top: y + (1 - entra) * 90,
        width: coluna.w,
        height: altura,
        borderRadius: 38,
        background: "#FFFFFF",
        boxShadow: sombraCartao,
        opacity: entra,
        fontFamily: sans,
      }}
    >
      {/* letreiro + botão */}
      <div
        style={{
          position: "absolute",
          left: CARTAO_CTA.pad,
          right: CARTAO_CTA.pad,
          top: CARTAO_CTA.pad,
          height: CARTAO_CTA.botao,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ ...rotuloCaixaAlta, fontSize: 34, color: cor.focoEscuro, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: cor.foco }} />
          {m.rotulo ?? "Lembrete"}
        </div>
        <div
          style={{
            height: CARTAO_CTA.botao,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 30px 0 24px",
            borderRadius: 999,
            border: `3px solid ${cor.foco}`,
            background: aperto > 0.5 ? cor.foco : "#FFFFFF",
            color: aperto > 0.5 ? "#FFFFFF" : cor.focoEscuro,
            fontSize: 42,
            fontWeight: 700,
            scale: String(afunda),
          }}
        >
          <Icone nome={aperto > 0.5 ? acao.iconeDepois : acao.icone} tamanho={42} cor={aperto > 0.5 ? "#FFFFFF" : cor.focoEscuro} peso={4} />
          {aperto > 0.5 ? acao.depois : acao.antes}
        </div>
      </div>
      {/* título com as palavras faladas */}
      <div style={{ position: "absolute", left: CARTAO_CTA.pad, right: CARTAO_CTA.pad, top: CARTAO_CTA.pad + CARTAO_CTA.botao + 22, height: titulo.altura, display: "flex", alignItems: "center" }}>
        <Linhas
          linhas={titulo.linhas}
          tempos={tempos}
          t={t}
          tamanho={titulo.tamanho}
          entrelinha={1.04}
          esboco={cor.esboco}
          cor={cor.tinta}
          corDe={(i) => (grifo && i >= grifo[0] && i <= grifo[1] ? cor.foco : undefined)}
        />
      </div>
      {/* a linha do dia em miniatura (o plano que está sendo salvo) */}
      {comBarra ? (
        <div style={{ position: "absolute", left: CARTAO_CTA.pad, top: yBarra, width: barraW, height: CARTAO_CTA.barra }}>
          {ag.blocos.map((b, i) => {
            const cat = CATEGORIAS[b.categoria];
            const x = (b.inicio / ag.total) * barraW;
            const w = Math.max(5, ((b.maxMinutos ?? b.minutos) / ag.total) * barraW - 4);
            const p = prog(t, m.de + 0.3 + i * 0.03, 0.3);
            return (
              <div
                key={b.id}
                style={{
                  position: "absolute",
                  left: x,
                  top: 0,
                  width: w,
                  height: CARTAO_CTA.barra,
                  borderRadius: 10,
                  background: cat.solido ? cat.forte : cat.fundo,
                  overflow: "hidden",
                  opacity: p,
                  translate: `0 ${(1 - p) * 12}px`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {!cat.solido ? <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: Math.min(8, w * 0.15), background: cat.forte }} /> : null}
                {concluido && w >= 34 ? <Icone nome="check" tamanho={30} cor={cat.solido ? "#FFFFFF" : cat.texto} peso={6} /> : null}
              </div>
            );
          })}
        </div>
      ) : null}
      {/* etiquetas: quando, onde */}
      {comEtiquetas ? (
        <div style={{ position: "absolute", left: CARTAO_CTA.pad, right: CARTAO_CTA.pad, top: yEtiquetas, height: 78, display: "flex", gap: 18 }}>
          {(m.etiquetas ?? []).slice(0, 2).map((e, i) => {
            const p = prog(t, e.em, 0.3);
            return (
              <div
                key={i}
                style={{
                  height: 78,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "0 28px 0 20px",
                  borderRadius: 20,
                  border: `3px ${p > 0.5 ? "solid" : "dashed"} ${p > 0.5 ? cor.outroFundo : cor.esboco}`,
                  background: p > 0.5 ? cor.outroFundo : "#FFFFFF",
                  color: p > 0.5 ? cor.tinta : cor.esbocoTexto,
                  fontSize: 40,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  maxWidth: (barraW - 18) / Math.min(2, m.etiquetas?.length ?? 1),
                }}
              >
                <Icone nome={e.icone ?? "calendario"} tamanho={40} cor={p > 0.5 ? cor.foco : cor.esboco} peso={4} p={0.3 + 0.7 * p} />
                {e.texto}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};
