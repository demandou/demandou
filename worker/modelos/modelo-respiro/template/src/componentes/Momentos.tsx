import { dissolver, limitar, mistura, prog, saindo, temposDoTexto, Traco } from "../anim";
import type { Orbe, Retangulo } from "../layout";
import type { Abertura as TAbertura, Ciclos as TCiclos, Cta as TCta, Fase, Lista as TLista, Nota as TNota, Palavra, Plano } from "../plano";
import { encaixar } from "../medida";
import { divideEmDe, ritmoDosCiclos, vezesDe } from "../respiro";
import { cor, mao, serif } from "../tema";
import { Icone } from "./Icones";
import { Escrita, FONTE_MAO, FONTE_SERIF, Serifa } from "./Texto";

type Props<M> = { m: M; t: number; fim: number; area: Retangulo; palavras: Palavra[]; livreEm: number };

// Tamanho que faz um texto caber numa largura sem medir o DOM. `porLetra` = largura média de uma
// letra em frações do tamanho da fonte (escrita à mão ~0,38; serifada ~0,46).
export const caber = (texto: string, largura: number, maximo: number, porLetra: number, minimo = 56) =>
  Math.max(minimo, Math.min(maximo, Math.floor(largura / (Math.max(1, texto.length) * porLetra))));

export const caixa = (area: Retangulo, s: number): React.CSSProperties => ({
  position: "absolute",
  left: area.x,
  top: area.y,
  width: area.w,
  height: area.h,
  ...dissolver(s),
});

// ---------- abertura ----------
// Nota à mão + título em serifada no alto do papel. O mapa do respiro (desenhado à parte, em
// layout.ts) ocupa a base; sem mapa, o título cresce e desce para o meio do papel.
export const Abertura: React.FC<Props<TAbertura>> = ({ m, t, fim, area, palavras, livreEm }) => {
  const s = saindo(t, fim, 0.55);
  const comMapa = !!m.mapaEm?.length;
  // `em`: quando o texto começa a ser dito (o momento pode começar antes da primeira palavra)
  const comeco = Math.max(livreEm, m.em !== undefined ? m.em - 0.1 : 0);
  const temposMao = m.mao ? temposDoTexto(m.mao, palavras, m.de, m.ate, livreEm) : [];
  const inicioTexto = temposMao.length ? temposMao[temposMao.length - 1] + 0.1 : comeco;
  const temposTexto = temposDoTexto(m.texto, palavras, m.em !== undefined ? m.em - 0.1 : m.de, m.ate, Math.max(inicioTexto, comeco));
  const destaque = m.destaque ?? m.enfase;
  // com o mapa embaixo o título tem até 2 linhas; sem mapa, até 3
  const encaixe = encaixar(m.texto, { largura: area.w, max: comMapa ? 104 : 118, min: 60, linhas: comMapa ? 2 : 3, fonte: FONTE_SERIF(400) });
  const encaixeMao = m.mao ? encaixar(m.mao, { largura: area.w, max: 96, min: 56, linhas: 1, fonte: FONTE_MAO(600) }) : undefined;
  return (
    // sem mapa, o bloco de texto fica no meio do papel (nada de metade vazia embaixo)
    <div style={{ ...caixa(area, s), display: "flex", flexDirection: "column", justifyContent: comMapa ? "flex-start" : "center", paddingBottom: comMapa ? 0 : 30 }}>
      {m.mao && encaixeMao ? <Escrita texto={m.mao} tempos={temposMao} t={t} encaixe={encaixeMao} cor={cor.tintaSuave} linha={1.05} /> : null}
      <Serifa
        texto={m.texto}
        tempos={temposTexto}
        t={t}
        encaixe={encaixe}
        linha={1.08}
        grifo={destaque}
        grifoEm={destaque ? temposTexto[temposTexto.length - 1] + 0.2 : undefined}
        estilo={{ marginTop: comMapa ? 2 : 14, maxWidth: area.w }}
      />
    </div>
  );
};

// ---------- fase: as notas ao lado da forma ----------
export const NotasDaFase: React.FC<Props<Fase>> = ({ m, t, fim, area, palavras, livreEm }) => {
  const s = saindo(t, fim, 0.5);
  const temposNota = temposDoTexto(m.nota, palavras, m.de, m.ate, livreEm);
  const inicioDetalhe = temposNota[temposNota.length - 1] + 0.25;
  const temposDetalhe = m.detalhe ? temposDoTexto(m.detalhe, palavras, m.de, m.ate, inicioDetalhe) : [];
  return (
    <div style={{ ...caixa(area, s), display: "flex", flexDirection: "column", alignItems: "center", paddingTop: area.h * 0.1 }}>
      <Escrita texto={m.nota} tempos={temposNota} t={t} encaixe={encaixar(m.nota, { largura: area.w - 10, max: 136, min: 60, linhas: 2, fonte: FONTE_MAO(700) })} peso={700} alinhar="center" linha={1} />
      {m.detalhe ? (
        <Escrita
          texto={m.detalhe}
          tempos={temposDetalhe}
          t={t}
          encaixe={encaixar(m.detalhe, { largura: area.w - 10, max: 84, min: 44, linhas: 2, fonte: FONTE_MAO(600) })}
          cor={cor.tintaSuave}
          alinhar="center"
          linha={1}
          estilo={{ marginTop: 14, maxWidth: area.w }}
        />
      ) : null}
    </div>
  );
};

// ---------- ciclos: a forma se divide e cada parte respira na sua vez ----------
export const NotasDosCiclos: React.FC<Props<TCiclos>> = ({ m, t, fim, area, palavras, livreEm }) => {
  const s = saindo(t, fim, 0.5);
  const nota = m.nota ?? (m.itens?.length ? undefined : `${vezesDe(m)} vezes`);
  const temposNota = nota ? temposDoTexto(nota, palavras, m.de, m.ate, livreEm) : [];
  const temposDetalhe = m.detalhe ? temposDoTexto(m.detalhe, palavras, m.de, m.ate, (temposNota[temposNota.length - 1] ?? livreEm) + 0.2) : [];
  const itens = (m.itens ?? []).slice(0, 6);
  // com itens, cada um se escreve na coluna quando é dito; a forma correspondente respira junto
  const tam = itens.length > 4 ? 56 : 64;
  return (
    <div style={{ ...caixa(area, s), display: "flex", flexDirection: "column", alignItems: "center", paddingTop: area.h * (itens.length ? 0.03 : 0.08) }}>
      {nota ? (
        <Escrita texto={nota} tempos={temposNota} t={t} encaixe={encaixar(nota, { largura: area.w - 10, max: itens.length ? 100 : 132, min: itens.length ? 56 : 60, linhas: 2, fonte: FONTE_MAO(700) })} peso={700} alinhar="center" linha={1} />
      ) : null}
      {m.detalhe ? <Escrita texto={m.detalhe} tempos={temposDetalhe} t={t} encaixe={encaixar(m.detalhe, { largura: area.w - 10, max: 88, min: 44, linhas: 2, fonte: FONTE_MAO(600) })} cor={cor.tintaSuave} alinhar="center" linha={1} estilo={{ marginTop: 10 }} /> : null}
      {itens.length ? (
        <div style={{ marginTop: 18, alignSelf: "stretch" }}>
          {itens.map((it, i) => {
            const enc = encaixar(it.texto, { largura: area.w - 78, max: tam, min: 40, linhas: 2, fonte: FONTE_MAO(600) });
            const tempos = temposDoTexto(it.texto, palavras, it.em - 0.3, it.em + 3, Math.max(it.em, livreEm));
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12, minHeight: 66 }}>
                <span style={{ fontFamily: serif, fontWeight: 500, fontSize: 52, width: 52, color: prog(t, it.em, 0.4) > 0.5 ? cor.tinta : cor.lapis, textAlign: "center" }}>{i + 1}</span>
                <Escrita texto={it.texto} tempos={tempos} t={t} encaixe={enc} linha={1.04} />
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

// As formas menores (uma por repetição) num círculo em volta de onde estava a forma grande.
// Os lugares já aparecem a lápis; elas saem da forma grande e voltam para ela como líquido
// (filtro "goo": as bordas se fundem quando se tocam) e respiram uma depois da outra.
export const FormasDosCiclos: React.FC<{ m: TCiclos; t: number; orbe: Orbe; id: string }> = ({ m, t, orbe, id }) => {
  const n = vezesDe(m);
  const divideEm = divideEmDe(m);
  // os lugares a lápis chegam quando o anel da fase anterior está saindo
  const esboco = Math.min(prog(t, Math.max(m.de + 0.15, divideEm - 0.35), 0.5), 1 - prog(t, m.ate - 0.5, 0.4));
  const sai = prog(t, divideEm - 0.05, 0.8);
  // juntam-se de volta até o fim do momento; a forma grande reaparece por cima, no mesmo tamanho
  const volta = prog(t, m.ate - 0.62, 0.62);
  const some = 1 - prog(t, m.ate - 0.05, 0.3);
  const abre = sai * (1 - volta);
  if (some <= 0.001 || (esboco <= 0.001 && sai <= 0.001)) return null;
  const { inicio, passo, dur, inicios } = ritmoDosCiclos(m);
  const Rc = Math.min(236, orbe.rMax * 0.86);
  const rBase = 80;
  const lugar = (i: number, k: number) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    return { x: orbe.cx + Math.cos(a) * Rc * k, y: orbe.cy + Math.sin(a) * Rc * k };
  };
  const pos = Array.from({ length: n }, (_, i) => lugar(i, abre));
  const vez = (i: number) => (t - (inicios[i] ?? inicio + i * passo)) / dur;
  // cada uma enche e esvazia na sua vez, e fica um pouco maior depois de "feita"
  const raio = (i: number) => {
    const k = vez(i);
    const ciclo = k > 0 && k < 1 ? Math.sin(Math.PI * k) : 0;
    const feita = limitar(k * 3);
    return (rBase + 38 * ciclo + 6 * feita) * (0.5 + 0.5 * abre);
  };
  const centro = orbe.rMin * (1 - sai) * 0.95 + orbe.rMin * 0.8 * volta;
  const arco = limitar((t - inicio) / Math.max(0.1, (inicios[n - 1] ?? inicio) + dur / 2 - inicio));
  const circ = 2 * Math.PI * Rc;
  const numeros = prog(t, divideEm + 0.3, 0.4) * (1 - prog(t, m.ate - 0.62, 0.25));
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: some }}>
      <defs>
        <filter id={`goo-${id}`} filterUnits="userSpaceOnUse" x={0} y={0} width={1080} height={1920}>
          <feGaussianBlur in="SourceGraphic" stdDeviation={12} result="b" />
          <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" />
        </filter>
      </defs>
      {/* trilho e lugares a lápis; o caminho já feito em tinta */}
      <g opacity={esboco}>
        <circle cx={orbe.cx} cy={orbe.cy} r={Rc} fill="none" stroke={cor.lapis} strokeWidth={3} strokeDasharray="2 12" strokeLinecap="round" />
        {Array.from({ length: n }, (_, i) => {
          const p = lugar(i, 1);
          return <circle key={i} cx={p.x} cy={p.y} r={rBase} fill="none" stroke={cor.lapis} strokeWidth={3} strokeDasharray="2 10" strokeLinecap="round" />;
        })}
        {arco > 0.002 ? (
          <circle
            cx={orbe.cx}
            cy={orbe.cy}
            r={Rc}
            fill="none"
            stroke={cor.tinta}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={`${arco * circ} ${circ}`}
            transform={`rotate(-90 ${orbe.cx} ${orbe.cy})`}
          />
        ) : null}
      </g>
      {sai > 0.001 ? (
        <>
          <g filter={`url(#goo-${id})`}>
            <circle cx={orbe.cx} cy={orbe.cy} r={centro * 1.17} fill={cor.damascoClaro} />
            {pos.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={raio(i) * 1.18} fill={cor.damascoClaro} />
            ))}
          </g>
          <g filter={`url(#goo-${id})`}>
            <circle cx={orbe.cx} cy={orbe.cy} r={centro} fill={cor.damascoMedio} />
            {pos.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={raio(i)} fill={cor.damascoMedio} />
            ))}
          </g>
          {pos.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={raio(i) * 0.7 * abre} fill={cor.damasco} />
          ))}
        </>
      ) : null}
      {pos.map((p, i) => {
        const feita = limitar(vez(i) * 2);
        return (
          <text
            key={i}
            x={p.x}
            y={p.y + 25}
            textAnchor="middle"
            fontFamily={serif}
            fontWeight={500}
            fontSize={72}
            fill={feita > 0.5 ? cor.tinta : cor.tintaSuave}
            opacity={numeros * (0.55 + 0.45 * feita)}
          >
            {i + 1}
          </text>
        );
      })}
    </svg>
  );
};

// ---------- nota do diário ----------
export const Nota: React.FC<Props<TNota>> = ({ m, t, fim, area, palavras, livreEm }) => {
  const s = saindo(t, fim, 0.55);
  const temposMao = m.mao ? temposDoTexto(m.mao, palavras, m.de, m.ate, livreEm) : [];
  const inicioTexto = temposMao.length ? temposMao[temposMao.length - 1] + 0.15 : livreEm;
  const temposTexto = temposDoTexto(m.texto, palavras, m.de, m.ate, inicioTexto);
  const comOnda = m.ondaEm !== undefined;
  return (
    // sem a onda, o bloco de texto fica no meio do papel
    <div style={{ ...caixa(area, s), display: "flex", flexDirection: "column", justifyContent: comOnda ? "flex-start" : "center", paddingBottom: comOnda ? 0 : 30 }}>
      {m.mao ? (
        <Escrita texto={m.mao} tempos={temposMao} t={t} tamanho={caber(m.mao, area.w, 96, 0.38, 64)} linha={1.05} sublinhar={m.sublinhar} sublinharEm={m.sublinharEm} />
      ) : null}
      <Serifa
        texto={m.texto}
        tempos={temposTexto}
        t={t}
        // com a onda, até duas linhas; sem ela, até três
        tamanho={caber(m.texto, area.w * (comOnda ? 2 : 3), 104, 0.44, 64)}
        linha={1.1}
        grifo={m.grifo}
        grifoEm={m.grifoEm}
        estilo={{ marginTop: 16, maxWidth: area.w }}
      />
      {/* a onda fica na base do papel: o lugar dela aparece logo, assim que a janela passa */}
      {comOnda ? <Onda em={m.ondaEm as number} t={t} area={area} esbocoEm={Math.min(livreEm, m.de + 0.5)} /> : null}
    </div>
  );
};

// A onda que desacelera: começa apertada (agitada) e vai abrindo até quase virar linha reta.
// Geometria comum ao esboço (a lápis, por trás da janela) e ao traço (em tinta, na frente).
const geometriaDaOnda = (area: Retangulo) => {
  const x0 = 20;
  const x1 = area.w - 30;
  const cy = area.h - 62;
  const amp = 44;
  const N = 260;
  const voltas = 8;
  const y = (u: number) => cy + amp * (1 - 0.6 * u) * Math.sin(2 * Math.PI * voltas * (1.9 * u - 0.9 * u * u));
  const pontos: [number, number][] = [];
  for (let i = 0; i <= N; i++) pontos.push([mistura(x0, x1, i / N), y(i / N)]);
  // comprimento acumulado, para o ponto andar junto com a ponta do traço
  const acumulado = [0];
  for (let i = 1; i <= N; i++) acumulado.push(acumulado[i - 1] + Math.hypot(pontos[i][0] - pontos[i - 1][0], pontos[i][1] - pontos[i - 1][1]));
  const d = `M ${pontos.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ")}`;
  return { pontos, acumulado, d, N };
};

// O lugar da onda, a lápis: fica no papel, POR TRÁS da janela, desde o começo da nota — a janela
// que sobe vai revelando a onda, como na abertura com o mapa.
export const EsbocoDaOnda: React.FC<{ m: TNota; t: number; area: Retangulo; fim: number }> = ({ m, t, area, fim }) => {
  const { d } = geometriaDaOnda(area);
  const visivel = Math.min(prog(t, m.de + 0.1, 0.6), 1 - saindo(t, fim, 0.55));
  if (visivel <= 0.01) return null;
  return (
    <svg width={area.w} height={area.h} style={{ position: "absolute", left: area.x, top: area.y, overflow: "visible", opacity: visivel * 0.9 }}>
      <path d={d} fill="none" stroke={cor.lapis} strokeWidth={3} strokeDasharray="2 11" strokeLinecap="round" />
    </svg>
  );
};

// O traço em tinta e o ponto de damasco na ponta — e vai ficando mais calmo.
const Onda: React.FC<{ em: number; t: number; area: Retangulo; esbocoEm: number }> = ({ em, t, area, esbocoEm }) => {
  const { pontos, acumulado, d, N } = geometriaDaOnda(area);
  const total = acumulado[N];
  const p = prog(t, em, 1.9, (x) => 1 - Math.pow(1 - x, 1.4));
  const alvo = p * total;
  let k = acumulado.findIndex((c) => c >= alvo);
  if (k < 0) k = N;
  const [px, py] = pontos[Math.max(0, k)];
  const chegou = prog(t, esbocoEm + 0.4, 0.5);
  const r = 19 + (p < 0.003 ? 3 * Math.sin(t * 2.4) : 0);
  return (
    <svg width={area.w} height={area.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <Traco d={d} p={p} cor={cor.tinta} largura={5} />
      {/* o ponto (a forma que desceu até aqui) espera no começo, respirando, e depois anda na ponta do traço */}
      {chegou > 0.01 ? (
        <g opacity={chegou}>
          <circle cx={px} cy={py} r={r} fill={cor.damasco} />
          <circle cx={px} cy={py} r={r} fill="none" stroke={cor.tinta} strokeWidth={3.5} />
        </g>
      ) : null}
    </svg>
  );
};

// ---------- lista ----------
export const Lista: React.FC<Props<TLista>> = ({ m, t, fim, area, palavras, livreEm }) => {
  const s = saindo(t, fim, 0.55);
  const temposTitulo = temposDoTexto(m.titulo, palavras, m.de, m.ate, livreEm);
  const itens = m.itens.slice(0, 4);
  const quatro = itens.length > 3;
  const altura = quatro ? 100 : 118;
  return (
    <div style={{ ...caixa(area, s), display: "flex", flexDirection: "column", justifyContent: "center", paddingBottom: 20 }}>
      <Serifa texto={m.titulo} tempos={temposTitulo} t={t} tamanho={caber(m.titulo, area.w, 104, 0.46, 64)} linha={1.08} grifo={m.enfase} grifoEm={temposTitulo[temposTitulo.length - 1] + 0.2} />
      <div style={{ marginTop: 18 }}>
        {itens.map((it, i) => {
          const tempos = temposDoTexto(it.texto, palavras, it.em - 0.3, it.em + 3, Math.max(it.em, livreEm));
          const cheia = prog(t, it.em, 0.5);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", height: altura }}>
              <svg width={76} height={76} style={{ flexShrink: 0, marginRight: 24 }}>
                <circle cx={38} cy={38} r={28} fill="none" stroke={cor.lapis} strokeWidth={3} strokeDasharray="2 8" strokeLinecap="round" />
                <circle cx={38} cy={38} r={28 * cheia} fill={cor.damasco} />
              </svg>
              <Escrita texto={it.texto} tempos={tempos} t={t} tamanho={caber(it.texto, area.w - 100, quatro ? 84 : 96, 0.38, 64)} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------- fechamento ----------
export const Cta: React.FC<Props<TCta> & { marca: Plano["marca"] }> = ({ m, t, fim, area, palavras, livreEm, marca }) => {
  const s = saindo(t, fim, 0.4);
  const comeco = Math.max(livreEm, m.em !== undefined ? m.em - 0.1 : 0);
  const tempos = temposDoTexto(m.texto, palavras, m.em !== undefined ? m.em - 0.1 : m.de, m.ate, comeco);
  const iconeEm = m.iconeEm ?? tempos[0];
  const assinaturaEm = m.assinaturaEm ?? tempos[tempos.length - 1] + 0.4;
  const assina = prog(t, assinaturaEm, 0.8);
  const largura = area.w - 210;
  const encaixe = encaixar(m.texto, { largura, max: 122, min: 72, linhas: 3, fonte: FONTE_MAO(700) });
  return (
    <div style={caixa(area, s)}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 40, marginTop: 16, paddingLeft: 18 }}>
        <div style={{ flexShrink: 0, marginTop: 14, scale: "1.3", transformOrigin: "left top", width: 146 }}>
          <Icone tipo={m.icone ?? "salvar"} t={t} esboco={prog(t, livreEm + 0.1, 0.4)} cheio={prog(t, iconeEm, 0.55)} />
        </div>
        <Escrita
          texto={m.texto}
          tempos={tempos}
          t={t}
          encaixe={encaixe}
          peso={700}
          linha={1}
          sublinhar={m.destaque}
          sublinharEm={m.destaque ? tempos[tempos.length - 1] + 0.1 : undefined}
          estilo={{ maxWidth: largura }}
        />
      </div>
      {marca.nome ? (
        <div style={{ position: "absolute", left: 104, top: area.h - 168, display: "flex", flexDirection: "column", gap: 4 }}>
          <div
            style={{
              fontFamily: serif,
              fontWeight: 500,
              fontSize: 72,
              lineHeight: 1.05,
              color: cor.tinta,
              opacity: assina,
              translate: `0 ${((1 - assina) * 16).toFixed(1)}px`,
              filter: assina < 0.999 ? `blur(${((1 - assina) * 6).toFixed(1)}px)` : undefined,
            }}
          >
            {marca.nome}
          </div>
          {marca.area ? (
            <div style={{ fontFamily: mao, fontWeight: 600, fontSize: 72, lineHeight: 1, color: cor.tintaSuave, opacity: prog(t, assinaturaEm + 0.25, 0.6) }}>
              {marca.area}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
