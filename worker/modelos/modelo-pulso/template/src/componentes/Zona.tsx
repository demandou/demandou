// Uma zona em foco (e a definição), embaixo do relógio no alto: o nome acende na palavra, o balão de
// fala (que esperava "digitando") ganha o significado, e as leituras contam até o valor.
import { Digitos, escreverPace, Linhas, lerPace, mistura, prog, trava } from "../anim";
import { peDoRelogio, RELOGIO_ALTO } from "../layout";
import { encaixar, formatar } from "../medida";
import type { Leitura } from "../plano";
import { cor, letreiro, mostrador, sans, sombraCartao, zonaCor } from "../tema";

export const topoDaZona = () => Math.round(peDoRelogio(RELOGIO_ALTO) + 30);

export type DadosDaZona = {
  de: number;
  zona: number;
  em: number;
  titulo: string;
  balao?: { texto: string; em: number };
  leituras?: Leitura[];
  exemplo?: boolean;
};

const valorDe = (l: Leitura) => (typeof l.valor === "number" ? l.valor : Number(String(l.valor).replace(/\./g, "").replace(",", ".")));
const tipoDe = (l: Leitura) => l.tipo ?? "numero";
const unidadeDe = (l: Leitura) => l.unidade ?? (tipoDe(l) === "pace" ? "/km" : tipoDe(l) === "bpm" ? "bpm" : "");
const rotuloDe = (l: Leitura) => l.rotulo ?? (tipoDe(l) === "pace" ? "ritmo" : tipoDe(l) === "bpm" ? "frequência" : "");

// `pe` = onde termina a alça de baixo do relógio agora (enquanto ele sobe, o conteúdo sobe junto)
export const Zona: React.FC<{ m: DadosDaZona; t: number; desce: boolean; pe?: number }> = ({ m, t, desce, pe }) => {
  const z = zonaCor(m.zona);
  const leituras = (m.leituras ?? []).slice(0, 2);
  // sem leituras, o nome e o balão crescem e o bloco fica centrado no espaço embaixo do relógio
  const encTitulo = encaixar(m.titulo, { largura: 840, max: leituras.length ? 92 : 112, min: 60, linhas: 2 });
  const lhTitulo = Math.round(encTitulo.tamanho * 1.13);
  const balao = m.balao;
  const encBalao = balao ? encaixar(balao.texto, { largura: 840 - 96, max: leituras.length ? 60 : 72, min: 42, linhas: 2 }) : null;
  const lhBalao = encBalao ? Math.round(encBalao.tamanho * 1.2) : 0;
  const largBalao = encBalao ? Math.min(840, Math.round(encBalao.largura + 96)) : 0;
  const altBalao = encBalao ? Math.max(136, encBalao.linhas.length * lhBalao + 64) : 0;
  const altBloco = encTitulo.linhas.length * lhTitulo + (balao ? 28 + altBalao : 0);
  const abaixa = leituras.length ? 0 : Math.max(0, Math.min(110, (1520 - topoDaZona() - altBloco) / 2 - 30));
  const base = topoDaZona() + abaixa;
  // (no máximo 120 px abaixo do lugar final, para nada passar do limite de baixo na subida)
  const topo = Math.round(Math.max(base, Math.min((pe ?? 0) + 30, base + 120)));
  const nTitulo = m.titulo.split(/\s+/).filter(Boolean).length;
  const temposTitulo = Array.from({ length: nTitulo }, (_, i) => m.em - 0.06 * (nTitulo - 1 - i));
  // o nome só aparece quando já está abaixo da alça do relógio (nunca atrás dela, na subida)
  const livre = pe === undefined ? 1 : Math.min(1, Math.max(0, (topo + 14 - pe) / 30));

  // balão: espera tracejado com os três pontinhos "digitando"; na palavra, enche e ganha o texto
  const enche = balao ? prog(t, balao.em, 0.35) : 0;
  const topoBalao = topo + encTitulo.linhas.length * lhTitulo + 28;
  const xBalao = 540 - largBalao / 2;
  const nBalao = balao ? balao.texto.split(/\s+/).filter(Boolean).length : 0;
  const temposBalao = balao ? Array.from({ length: nBalao }, (_, i) => balao.em + 0.05 + i * 0.1) : [];

  // leituras: contam a partir da entrada da zona; depois oscilam de leve com o ponteiro
  const conta = prog(t, m.em, 0.8, trava);
  const oscila = Math.sin(((t - m.em - 0.75) / 1.25) * Math.PI * 2) * prog(t, m.em + 0.6, 0.5);
  const texto = (l: Leitura) => {
    const tipo = tipoDe(l);
    if (t < m.em - 0.02) return tipo === "pace" ? "-:--" : "---";
    if (tipo === "pace") {
      const alvo = lerPace(String(l.valor)) ?? 360;
      return escreverPace(mistura(alvo * (desce ? 0.72 : 1.3), alvo, conta));
    }
    const alvo = valorDe(l) || 0;
    if (tipo === "bpm") return String(Math.round(mistura(alvo * (desce ? 1.3 : 0.7), alvo, conta) + 2 * oscila));
    return formatar(conta >= 1 ? alvo : alvo * conta, l.casas ?? (Number.isInteger(alvo) ? 0 : 1));
  };
  const corLeitura = t >= m.em - 0.02 ? cor.tinta : cor.esboco;
  const exemplo = m.exemplo !== false && leituras.length > 0;
  const topoLeituras = topoBalao + (balao ? altBalao + 42 : 0);
  // leituras grandes encolhem se o espaço acabar
  const tamLeitura = Math.max(56, Math.min(80, Math.floor((1520 - topoLeituras - (exemplo ? 70 : 0) - 44) / 1.08)));

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* nome da zona (ou o termo) */}
      <div style={{ position: "absolute", inset: 0, opacity: livre }}>
        <Linhas
          linhas={encTitulo.linhas}
          tempos={temposTitulo}
          t={t}
          x={120}
          y={topo}
          largura={840}
          alturaLinha={lhTitulo}
          alinhar="center"
          estilo={{ fontFamily: mostrador, fontWeight: 700, fontSize: encTitulo.tamanho, color: z.texto, letterSpacing: "-0.01em" }}
          esboco={cor.esboco}
        />
      </div>

      {/* balão de fala */}
      {balao && encBalao ? (
        <>
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            {/* rabicho apontando para o relógio (a pessoa fala de dentro dele) */}
            <path
              d={`M${xBalao + largBalao * 0.3} ${topoBalao + 2} L${xBalao + largBalao * 0.3 + 18} ${topoBalao - 30} L${xBalao + largBalao * 0.3 + 54} ${topoBalao + 2} Z`}
              fill={enche > 0.01 ? cor.cartao : "none"}
              stroke={enche > 0.01 ? "none" : cor.esboco}
              strokeWidth={4}
              strokeDasharray="10 10"
              opacity={Math.max(enche, 1 - enche)}
            />
          </svg>
          <div style={{ position: "absolute", left: xBalao, top: topoBalao, width: largBalao, height: altBalao, borderRadius: 48, border: `4px dashed ${cor.esboco}`, opacity: 1 - enche }} />
          <div
            style={{
              position: "absolute",
              left: xBalao,
              top: topoBalao,
              width: largBalao,
              height: altBalao,
              borderRadius: 48,
              background: cor.cartao,
              boxShadow: sombraCartao,
              opacity: enche,
              scale: String(0.94 + 0.06 * enche),
            }}
          />
          {/* três pontinhos "digitando" enquanto o balão espera */}
          {enche < 0.99 ? <Digitando x={540} y={topoBalao + altBalao / 2} t={t} opacidade={1 - enche} /> : null}
          {enche > 0.2 ? (
            <Linhas
              linhas={encBalao.linhas}
              tempos={temposBalao}
              t={t}
              x={xBalao}
              y={topoBalao + (altBalao - encBalao.linhas.length * lhBalao) / 2}
              largura={largBalao}
              alturaLinha={lhBalao}
              alinhar="center"
              estilo={{ fontFamily: mostrador, fontWeight: 700, fontSize: encBalao.tamanho, color: cor.tinta }}
            />
          ) : null}
        </>
      ) : null}

      {/* leituras */}
      {leituras.length ? (
        <div style={{ position: "absolute", left: 120, width: 840, top: topoLeituras, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 0 }}>
            {leituras.map((l, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start" }}>
                {i > 0 ? <div style={{ width: 3, height: tamLeitura * 1.48, background: "#D5DAD3", margin: "6px 44px 0" }} /> : null}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, fontFamily: mostrador, fontWeight: 700, color: corLeitura, whiteSpace: "nowrap" }}>
                    <Digitos texto={texto(l)} tamanho={tamLeitura} style={{ fontSize: tamLeitura, lineHeight: `${Math.round(tamLeitura * 1.08)}px` }} />
                    {unidadeDe(l) ? (
                      <span style={{ fontSize: Math.round(tamLeitura * 0.48), fontWeight: 600, color: t >= m.em ? cor.tintaSuave : cor.esboco }}>{unidadeDe(l)}</span>
                    ) : null}
                  </div>
                  {rotuloDe(l) ? (
                    <span style={{ fontFamily: sans, fontSize: 34, fontWeight: 600, color: cor.tintaSuave, marginTop: 2, whiteSpace: "nowrap" }}>{rotuloDe(l)}</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          {exemplo ? (
            <div style={{ ...letreiro, fontSize: 30, color: cor.tintaFraca, border: `3px solid ${cor.esboco}`, borderRadius: 999, padding: "8px 20px 7px" }}>
              valores de exemplo
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

// três pontinhos "digitando", centrados em (x, y)
export const Digitando: React.FC<{ x: number; y: number; t: number; opacidade: number; cor?: string }> = ({ x, y, t, opacidade, cor: c }) => (
  <div style={{ position: "absolute", left: x - 66, top: y - 14, display: "flex", gap: 22, opacity: opacidade }}>
    {[0, 1, 2].map((i) => {
      const fase = (((t - i * 0.16) % 0.9) + 0.9) % 0.9;
      const sobe = Math.max(0, Math.sin((fase / 0.45) * Math.PI)) * (fase < 0.45 ? 1 : 0);
      return <div key={i} style={{ width: 28, height: 28, borderRadius: 99, background: c ?? cor.esboco, translate: `0 ${-10 * sobe}px` }} />;
    })}
  </div>
);

