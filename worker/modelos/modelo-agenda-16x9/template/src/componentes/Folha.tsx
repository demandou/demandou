// A folha da agenda (o "app"): cartão branco sobre o fundo cinza-frio, cabeçalho com o título e o
// dia, régua de horas com linhas finas a cada 15 minutos. A escala acompanha a cena.
import { escreverHora, mistura, prog } from "../anim";
import { ANTES, type Agenda, cortinaNoTempo, recorteDaCortina, tituloNoTempo, trechoNoTempo } from "../agenda";
import { CABECALHO, cor, FOLHA, MARGEM, numeros, RAIA, sans, sombraFolha } from "../tema";
import { medir } from "../medida";
import { Icone } from "./Icones";

export const Folha: React.FC<{ t: number; ag: Agenda; dia: string; tituloEm: number }> = ({ t, ag, dia, tituloEm }) => {
  const { atual, anterior, p } = trechoNoTempo(t, ag.trechos);
  // a folha já está inteira (cabeçalho, régua, lugares a lápis) embaixo da pessoa que encolhe;
  // na volta para a tela cheia ela só some quando a pessoa já a cobriu
  const inicio = atual.de - ANTES;
  const entrando = anterior.cena.folha === 0 && atual.cena.folha > 0;
  const saindoDaFolha = anterior.cena.folha > 0 && atual.cena.folha === 0;
  const visivel = entrando ? prog(t, inicio, 0.12) : saindoDaFolha ? 1 - prog(t, inicio + 0.45, 0.15) : mistura(anterior.cena.folha, atual.cena.folha, p);
  if (visivel < 0.01) return null;
  const cabecalho = prog(t, tituloEm, 0.2);

  // régua: só nas cenas de agenda (entrando do nada, já vem na escala nova). Na cortina, a régua é
  // a da agenda (a que sai ou a que entra) e a linha do "agora" a recorta.
  const cortina = cortinaNoTempo(ag, t);
  const ladoDaAgenda = cortina ? (cortina.agendaSai ? anterior.cena : cortina.agendaEntra ? atual.cena : null) : null;
  const c = ladoDaAgenda ?? atual.cena;
  const a = ladoDaAgenda ?? (entrando ? c : anterior.cena);
  const reguaAntes = a.modo === "agenda" ? 1 : 0;
  const reguaAgora = c.modo === "agenda" ? 1 : 0;
  const pr = entrando || ladoDaAgenda ? 1 : p;
  const regua = mistura(reguaAntes, reguaAgora, pr);
  const ref = c.modo === "agenda" ? c : a;
  const escalaR = a.modo === "agenda" && c.modo === "agenda" ? mistura(a.escala, c.escala, p) : ref.escala;
  const topoR = a.modo === "agenda" && c.modo === "agenda" ? mistura(a.topoAgenda, c.topoAgenda, p) : ref.topoAgenda;
  const fimR = Math.max(a.modo === "agenda" ? a.fim : 0, c.modo === "agenda" ? c.fim : 0);
  const passo = escalaR * 15 >= 70 ? 15 : 30;
  const linhas: number[] = [];
  for (let m = 0; m <= fimR + 0.01; m += passo) linhas.push(m);

  const rotulos = [
    ...c.rotulos.map((r) => ({ ...r, peso: c.modo === "agenda" ? pr : 0 })),
    ...a.rotulos.filter((r) => !c.rotulos.some((x) => x.min === r.min)).map((r) => ({ ...r, peso: a.modo === "agenda" ? 1 - pr : 0 })),
  ];

  return (
    <div
      style={{
        position: "absolute",
        left: FOLHA.x,
        top: FOLHA.y,
        width: FOLHA.w,
        height: FOLHA.h,
        borderRadius: FOLHA.raio,
        background: cor.folha,
        boxShadow: sombraFolha,
        opacity: visivel,
        overflow: "hidden",
      }}
    >
      {/* cabeçalho: marca de cor + título da agenda; o dia à direita */}
      <div
        style={{
          position: "absolute",
          // dentro da margem segura do quadro deitado
          left: MARGEM - FOLHA.x,
          right: MARGEM - FOLHA.x,
          top: 0,
          height: CABECALHO,
          display: "flex",
          alignItems: "center",
          gap: 18,
          fontFamily: sans,
          opacity: cabecalho,
        }}
      >
        <div style={{ width: 28, height: 28, borderRadius: 8, background: cor.foco, flexShrink: 0 }} />
        <Titulo ag={ag} t={t} />
        {dia ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: cor.tintaSuave, fontSize: 40, fontWeight: 600 }}>
            <Icone nome="calendario" tamanho={40} cor={cor.tintaSuave} peso={3.6} />
            {dia}
          </div>
        ) : null}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: CABECALHO, height: 2, background: cor.linha, opacity: cabecalho }} />

      {/* régua de horas (a parte que rola para cima some embaixo do cabeçalho) */}
      <div style={{ position: "absolute", inset: 0, clipPath: `inset(${CABECALHO + 2}px 0 0 0)` }}>
      <div style={{ position: "absolute", inset: 0, clipPath: recorteDaCortina(cortina, cortina ? (cortina.agendaSai ? "sai" : "entra") : null, FOLHA.y, FOLHA.h) }}>
      {regua > 0.01
        ? linhas.map((m) => (
            <div
              key={`l${m}`}
              style={{
                position: "absolute",
                left: RAIA.x - FOLHA.x - 10,
                right: 24,
                top: topoR + m * escalaR - FOLHA.y - 1,
                height: 2,
                background: m % 60 === 0 ? cor.linhaForte : cor.linha,
                opacity: regua,
              }}
            />
          ))
        : null}
      {regua > 0.01
        ? rotulos.map((r) => {
            const o = regua * r.peso * prog(t, r.de, 0.25);
            if (o < 0.01) return null;
            return (
              <div
                key={`r${r.min}-${r.texto}`}
                style={{
                  position: "absolute",
                  left: 0,
                  width: RAIA.x - FOLHA.x - 22,
                  top: topoR + r.min * escalaR - FOLHA.y - 23,
                  textAlign: "right",
                  fontFamily: sans,
                  fontSize: r.texto === "hora" ? 37 : Math.max(30, Math.min(37, Math.floor((RAIA.x - FOLHA.x - 22) / Math.max(1, medir(r.texto, 1, { peso: 600, tabular: true }))))),
                  fontWeight: 600,
                  lineHeight: "46px",
                  whiteSpace: "nowrap",
                  color: cor.tintaSuave,
                  opacity: o,
                  ...numeros,
                }}
              >
                {r.texto === "hora" ? escreverHora(ag.inicio + r.min) : r.texto}
              </div>
            );
          })
        : null}
      </div>
      </div>
    </div>
  );
};

// O nome da agenda: quando um momento troca o nome, o antigo rola para cima e o novo entra por baixo
const Titulo: React.FC<{ ag: Agenda; t: number }> = ({ ag, t }) => {
  const { atual, anterior } = tituloNoTempo(ag, t);
  const p = anterior ? prog(t, atual.de + 0.1, 0.4) : 1;
  // título longo: o corpo desce (até 36 px) para caber ao lado do dia
  const disponivel = FOLHA.w - 2 * (MARGEM - FOLHA.x) - 28 - 18 - 240;
  const corpo = (texto: string) => Math.max(34, Math.min(48, Math.floor((disponivel / Math.max(1, medir(texto, 1, { peso: 700 }))) * 1)));
  const estilo: React.CSSProperties = { width: "100%", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 700, color: cor.tinta, whiteSpace: "nowrap", letterSpacing: "-0.01em", lineHeight: "60px" };
  return (
    <div style={{ position: "relative", flex: 1, height: 60, overflow: "hidden" }}>
      {anterior && p < 1 ? <div style={{ ...estilo, fontSize: corpo(anterior.texto), position: "absolute", left: 0, top: 0, translate: `0 ${-p * 100}%` }}>{anterior.texto}</div> : null}
      <div style={{ ...estilo, fontSize: corpo(atual.texto), position: "absolute", left: 0, top: 0, translate: `0 ${(1 - p) * 100}%` }}>{atual.texto}</div>
    </div>
  );
};
