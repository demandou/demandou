// Fechamento: a pessoa volta para a tela cheia e o cartão de ação sobe no peito: letreiro, botão
// que afunda e muda ("Salvar" → "Salvo"), o texto com as palavras faladas e o resumo do vídeo em
// miniatura (a barra da divisão, se houve; senão, o traçado do pulso batendo a cada palavra).
import { Linhas, prog, temposDoTexto } from "../anim";
import type { Presenca } from "../layout";
import { encaixar, LETREIRO, larguraTexto, trechoNoTexto } from "../medida";
import type { Cta as CtaT, Divisao, Palavra } from "../plano";
import { cor, letreiro, mostrador, sans, sombraAlta, ZONAS, zonaCor } from "../tema";
import { casasDasPartes, casasDe, pctDas } from "./Divisao";
import { CARTAO_PEITO } from "./Gancho";
import { Icone, type NomeIcone } from "./Icones";
import { Pulso } from "./Pulso";

type Acao = NonNullable<CtaT["icone"]>;
const ACOES: Record<Acao, { antes: string; depois: string; icone: NomeIcone; iconeDepois: NomeIcone }> = {
  salvar: { antes: "Salvar", depois: "Salvo", icone: "salvar", iconeDepois: "salvarCheio" },
  seguir: { antes: "Seguir", depois: "Seguindo", icone: "seguir", iconeDepois: "check" },
  comentar: { antes: "Comentar", depois: "Comentado", icone: "comentar", iconeDepois: "check" },
  link: { antes: "Abrir", depois: "Aberto", icone: "link", iconeDepois: "check" },
};

export const Cta: React.FC<{ m: CtaT; t: number; palavras: Palavra[]; topo: number; divisao?: Divisao; pres: Presenca; fim: number }> = ({
  m,
  t,
  palavras,
  topo,
  divisao,
  pres,
  fim,
}) => {
  if (pres.opacidade <= 0.001) return null;
  const texto = (m.texto ?? m.titulo ?? "").trim();
  const acao = ACOES[m.icone ?? m.acao ?? "salvar"] ?? ACOES.salvar;
  const inicioTexto = m.em ?? m.de;
  const aperta = Math.max(m.acaoEm ?? m.de + 0.5, m.de + 0.5);
  const pAperto = prog(t, aperta, 0.3);
  const afunda = 1 - 0.07 * Math.sin(Math.min(1, prog(t, aperta - 0.05, 0.22, (x) => x)) * Math.PI);
  const feito = pAperto > 0.5;

  const pad = CARTAO_PEITO.pad;
  const largura = CARTAO_PEITO.w - 2 * pad;
  // botão: largura medida do texto mais largo (antes/depois), para não pular
  const largBotao = 22 + 38 + 12 + Math.max(larguraTexto(acao.antes, 40, { familia: "sans", peso: 800 }), larguraTexto(acao.depois, 40, { familia: "sans", peso: 800 })) + 28 + 8;
  const rotulo = (m.rotulo ?? "Próximo passo").trim();
  const largRotulo = largura - largBotao - 20 - 60;
  const tamRotulo = Math.max(26, Math.min(32, Math.floor((32 * largRotulo) / Math.max(1, larguraTexto(rotulo, 32, LETREIRO)))));
  const enc = encaixar(texto, { largura, max: 84, min: 56, linhas: 3 });
  const alturaLinha = Math.round(enc.tamanho * 1.1);
  const tempos = temposDoTexto(texto, palavras, Math.min(m.de, inicioTexto), m.ate, inicioTexto + 0.3);
  const destaque = trechoNoTexto(texto, m.destaque);
  const topoTitulo = topo + pad + 76 + 22;
  const topoResumo = topoTitulo + enc.linhas.length * alturaLinha + 26;
  const altResumo = divisao ? 104 : 96;
  const altura = topoResumo + altResumo + 34 - topo;
  const rotuloAceso = prog(t, m.de + 0.35, 0.3);

  // o pulso do resumo: um batimento por palavra do texto, até o fim do vídeo
  const inicioPulso = m.de + 0.3;
  const durPulso = Math.max(0.8, fim - inicioPulso - 0.2);
  const batidas = tempos.filter((tw, i) => i === 0 || tw - tempos[i - 1] >= 0.2).map((tw) => ({ pos: Math.min(0.97, (tw + 0.04 - inicioPulso) / durPulso) }));

  return (
    <div style={{ position: "absolute", inset: 0, opacity: pres.opacidade, translate: `${pres.dx}px ${pres.dy}px` }}>
      <div style={{ position: "absolute", left: CARTAO_PEITO.x, top: topo, width: CARTAO_PEITO.w, height: altura, borderRadius: 40, background: cor.cartao, boxShadow: sombraAlta }} />
      {/* letreiro */}
      <div style={{ position: "absolute", left: CARTAO_PEITO.x + pad, top: topo + pad, height: 76, display: "flex", alignItems: "center", gap: 14 }}>
        <Icone nome="coracaoCheio" tamanho={40} cor={rotuloAceso > 0.5 ? ZONAS[1].cor : cor.esboco} />
        <span style={{ ...letreiro, fontSize: tamRotulo, whiteSpace: "nowrap", color: rotuloAceso > 0.5 ? cor.tintaSuave : cor.esbocoTexto }}>{rotulo}</span>
      </div>
      {/* botão */}
      <div
        style={{
          position: "absolute",
          right: CARTAO_PEITO.x + pad,
          top: topo + pad,
          height: 76,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 28px 0 22px",
          borderRadius: 999,
          border: `4px solid ${cor.tinta}`,
          background: feito ? cor.tinta : "transparent",
          color: feito ? "#FFFFFF" : cor.tinta,
          fontFamily: sans,
          fontWeight: 800,
          fontSize: 40,
          whiteSpace: "nowrap",
          scale: String(afunda),
        }}
      >
        <Icone nome={feito ? acao.iconeDepois : acao.icone} tamanho={38} cor={feito ? ZONAS[1].cor : cor.tinta} peso={4} />
        {feito ? acao.depois : acao.antes}
      </div>
      {/* texto */}
      <Linhas
        linhas={enc.linhas}
        tempos={tempos}
        t={t}
        x={CARTAO_PEITO.x + pad}
        y={topoTitulo}
        largura={largura}
        alturaLinha={alturaLinha}
        estilo={{ fontFamily: mostrador, fontWeight: 700, fontSize: enc.tamanho, color: cor.tinta, letterSpacing: "-0.01em" }}
        esboco={cor.esboco}
        corDe={(i) => (destaque.has(i) ? ZONAS[1].texto : undefined)}
      />
      {/* resumo em miniatura */}
      {divisao ? (
        <div style={{ position: "absolute", left: CARTAO_PEITO.x + pad, width: largura, top: topoResumo }}>
          <ResumoDivisao m={divisao} t={t} de={m.de + 0.5} />
        </div>
      ) : (
        <Pulso
          x={CARTAO_PEITO.x + pad}
          y={topoResumo - 10}
          largura={largura}
          altura={altResumo}
          caneta={Math.min(1, Math.max(0, (t - inicioPulso) / durPulso))}
          batidas={batidas}
          corTraco={ZONAS[1].cor}
        />
      )}
    </div>
  );
};

const ResumoDivisao: React.FC<{ m: Divisao; t: number; de: number }> = ({ m, t, de }) => {
  const n = casasDe(m);
  const [ca] = casasDasPartes(m);
  const [a, b] = m.partes;
  const [pa, pb] = pctDas(m);
  const mostrarPct = !m.ilustrativo && a?.pct !== undefined;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 8, height: 46 }}>
        {Array.from({ length: n }, (_, i) => {
          const p = prog(t, de + i * 0.05, 0.25);
          const c = i < ca ? zonaCor(a.zona).cor : zonaCor(b?.zona ?? 4).cor;
          return <div key={i} style={{ flex: 1, borderRadius: 9, marginLeft: i === ca ? 16 : 0, background: p > 0.5 ? c : "#E3E6E1", scale: `1 ${0.6 + 0.4 * p}` }} />;
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: sans, fontWeight: 700, fontSize: 36, color: cor.tintaSuave, whiteSpace: "nowrap" }}>
        <span>
          {mostrarPct ? <span style={{ color: zonaCor(a.zona).texto }}>{pa}% </span> : null}
          {a.texto}
        </span>
        {b ? (
          <span>
            {mostrarPct ? <span style={{ color: zonaCor(b.zona).texto }}>{pb}% </span> : null}
            {b.texto}
          </span>
        ) : null}
      </div>
    </div>
  );
};
