// Os 11 blocos universais na linguagem da vitrine do Balcão: letras pintadas no vidro, adesivos de
// preço mostarda, carimbo, potes de vidro que enchem, torta fatiada, cardápio e o balão de pedido.
// Tudo acontece DENTRO do vidro da vitrine; no quadro deitado (16:9) a vitrine fica à esquerda e a
// pessoa, durante o bloco, na moldura da direita, atrás do balcão.
import { Easing, Img, staticFile } from "remotion";
import { formatar, prog, saida, saindo, salto, suave, temposDoTexto } from "../anim";
import { encaixar, larguraTexto } from "../medida";
import { imagemDoPlano, temImagem } from "../motor/imagem";
import type {
  Abertura as TAbertura,
  Comparacao as TComparacao,
  Cta as TCta,
  Definicao as TDefinicao,
  Destaque as TDestaque,
  Frase as TFrase,
  Grafico as TGrafico,
  Numero as TNumero,
  Passos as TPassos,
  Pergunta as TPergunta,
  Plano,
  Produto,
  Topicos as TTopicos,
} from "../plano";
import { AREA, CENTRO_X, cor, fonte, QUADRO, VIDRO } from "../tema";
import { Ilustracao } from "./Ilustracoes";
import { Interior } from "./Interior";
import { Adesivo, caber, Carimbo, EtiquetaPrateleira, estiloFonte, Icone, type NomeIcone, medirCarimbo, Texto } from "./Pecas";
import { alturaLetreiro, LetreiroDoVidro, PRAT_Y } from "./Vitrine";

type Comum = { t: number; plano: Plano; fim: number };
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const CENTRO_Y = (AREA.y + AREA.base) / 2;

// tudo de um bloco some junto no fim dele
const Saida: React.FC<{ t: number; fim: number; children: React.ReactNode }> = ({ t, fim, children }) => {
  const s = saindo(t, fim, 0.16);
  return <div style={{ position: "absolute", inset: 0, opacity: 1 - s, transform: s > 0 ? `translateY(${-24 * s}px)` : undefined }}>{children}</div>;
};

// ——— abertura: letras pintadas no vidro, palavra por palavra ———
// Com `cena`, o interior ilustrado da loja fica atrás (prateleira, expositor, plaquinha) e as letras no alto.
// Com uma vitrine logo depois (`vira`), o título encolhe e sobe: vira o letreiro da vitrine.
// (o vertical usava y 790: 120 px acima da base da área útil; o vidro tem as mesmas medidas)
const LIMITE_TARJA = AREA.base - 120;
export const Abertura: React.FC<Comum & { m: TAbertura; vira?: number }> = ({ t, plano, m, fim, vira }) => {
  const em = m.em ?? m.de;
  const inicio = em <= 0.2 ? em - 0.16 : em;
  const tempos = temposDoTexto(m.texto, inicio, plano.palavras, m.ate).map((x, i) => (i === 0 ? inicio : x));
  const topoZona = AREA.y + (m.placa ? 150 : 10);
  const grande = m.cena ? caber(m.texto, AREA.w, 92, 52, 2) : caber(m.texto, AREA.w, 100, 56, 3);
  const altG = grande.linhas.length * grande.tamanho * 1.14;
  // com a cena da loja, as letras ficam no alto do vidro (o interior ocupa o resto)
  const yG = m.cena ? AREA.y : (topoZona + LIMITE_TARJA) / 2 - altG / 2;
  const pM = vira !== undefined ? prog(t, vira - 0.05, 0.45, suave) : 0;
  const cab = caber(m.texto, AREA.w, 52, 34, 2);
  const corpoGrande = (
    <div style={{ position: "absolute", left: AREA.x, width: AREA.w, top: yG }}>
      <Texto t={t} linhas={grande.linhas} tamanho={grande.tamanho} tempos={tempos} destaque={m.destaque} />
    </div>
  );
  if (pM <= 0)
    return (
      <Saida t={t} fim={fim}>
        {m.cena ? <Interior t={t} cena={m.cena} /> : null}
        {corpoGrande}
      </Saida>
    );
  // o título encolhendo até o letreiro da vitrine
  const altC = cab.linhas.length * cab.tamanho * 1.14;
  const escala = 1 - (1 - cab.tamanho / grande.tamanho) * pM;
  const dy = (AREA.y + altC / 2 - (yG + altG / 2)) * pM;
  const sublinha = prog(t, vira! + 0.25, 0.3);
  return (
    <Saida t={t} fim={fim}>
      {/* o grande some na primeira metade da subida; o letreiro só aparece depois (nunca os dois juntos) */}
      {pM < 0.45 ? (
        <div style={{ position: "absolute", inset: 0, opacity: 1 - pM / 0.45, transform: `translateY(${dy}px) scale(${escala})`, transformOrigin: `${CENTRO_X}px ${yG + altG / 2}px` }}>{corpoGrande}</div>
      ) : null}
      <div style={{ position: "absolute", left: AREA.x, width: AREA.w, top: AREA.y, opacity: clamp((pM - 0.45) / 0.4, 0, 1), transform: pM >= 1 ? undefined : `translateY(${(1 - pM) * 30}px)` }}>
        <Texto t={t} linhas={cab.linhas} tamanho={cab.tamanho} destaque={m.destaque} />
      </div>
      <div style={{ position: "absolute", left: CENTRO_X - 50 * sublinha, top: AREA.y + altC + 8, width: 100 * sublinha, height: 7, borderRadius: 4, background: cor.acento }} />
    </Saida>
  );
};

// ——— tópicos e passos: linhas pintadas no vidro, cada uma com o seu adesivo ———
export const Lista: React.FC<Comum & { m: TTopicos | TPassos }> = ({ t, plano, m, fim }) => {
  const passos = m.tipo === "passos";
  const altT = alturaLetreiro(m.titulo);
  const topo = AREA.y + altT + (m.titulo ? 14 : 10);
  const n = m.itens.length;
  const vao = 18;
  const alt = Math.min(150, (AREA.base - topo - vao * (n - 1)) / n);
  const y0 = topo + (AREA.base - topo - (alt * n + vao * (n - 1))) / 2;
  const entrou = m.itens.filter((it) => t >= it.em).length;
  const d = Math.min(96, alt - 12);
  const xTexto = AREA.x + d + 30;
  const largTexto = AREA.w - d - 40;
  return (
    <Saida t={t} fim={fim}>
      <LetreiroDoVidro t={t} plano={plano} texto={m.titulo} em={m.de} ate={m.itens[0]?.em ?? m.ate} />
      {passos && n > 1 ? (
        <svg width={QUADRO.w} height={QUADRO.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {m.itens.slice(1).map((it, i) => {
            const a = y0 + i * (alt + vao) + alt / 2 + d / 2;
            const b = y0 + (i + 1) * (alt + vao) + alt / 2 - d / 2;
            const p = prog(t, it.em - 0.25, 0.3, suave);
            return p > 0 ? <line key={i} x1={AREA.x + d / 2} y1={a} x2={AREA.x + d / 2} y2={a + (b - a) * p} stroke={cor.acento} strokeWidth={6} strokeDasharray="10 10" strokeLinecap="round" /> : null;
          })}
        </svg>
      ) : null}
      {m.itens.map((it, i) => {
        if (t < it.em - 0.02) return null;
        const y = y0 + i * (alt + vao);
        const atual = i === entrou - 1 ? 1 - prog(t, (m.itens[i + 1]?.em ?? fim) - 0.05, 0.15) : 0;
        const temDet = !!it.detalhe;
        const fit = caber(it.texto, largTexto, temDet ? 52 : 60, 28, temDet ? 1 : 2, 800);
        const fitD = temDet ? caber(it.detalhe as string, largTexto, 32, 22, 1, 600) : null;
        const altTxt = fit.linhas.length * fit.tamanho * 1.14 + (fitD ? fitD.tamanho * 1.2 + 4 : 0);
        const p = prog(t, it.em, 0.3, saida);
        const lTexto = Math.min(largTexto, Math.max(...fit.linhas.map((l) => larguraTexto(l, fit.tamanho, { peso: 800 }))));
        return (
          <div key={i}>
            <div style={{ position: "absolute", left: AREA.x, top: y + (alt - d) / 2 }}>
              <Adesivo t={t} colado={it.em} d={d} giro={[-8, 6, -4, 9, -6][i % 5]}>
                {passos ? <span style={{ ...estiloFonte(800, d * 0.46) }}>{i + 1}</span> : <Icone nome="certo" tamanho={d * 0.5} cor={cor.tinta} traco={3.2} />}
              </Adesivo>
            </div>
            <div style={{ position: "absolute", left: xTexto, top: y + (alt - altTxt) / 2, width: largTexto, opacity: Math.min(1, p * 2), transform: p >= 1 ? undefined : `translateX(${(1 - p) * 24}px)` }}>
              <Texto t={t} linhas={fit.linhas} tamanho={fit.tamanho} alinhar="left" />
              {fitD ? (
                <div style={{ marginTop: 4 }}>
                  <Texto t={t} linhas={fitD.linhas} tamanho={fitD.tamanho} peso={600} cor={cor.tintaSuave} alinhar="left" />
                </div>
              ) : null}
              {atual > 0 ? <div style={{ height: 7, width: lTexto * atual, borderRadius: 4, background: cor.acento, marginTop: 6 }} /> : null}
            </div>
          </div>
        );
      })}
    </Saida>
  );
};

// ——— número: o adesivo de preço gigante, o número contando dentro; o rótulo numa etiqueta ———
export const Numero: React.FC<Comum & { m: TNumero }> = ({ t, m, fim }) => {
  const casas = m.casas ?? 0;
  const conta = suave(clamp((t - m.em) / 0.9, 0, 1));
  const valor = m.valor * conta;
  const texto = `${m.prefixo ? m.prefixo + (m.prefixo.endsWith("$") ? " " : "") : ""}${formatar(valor, casas)}${m.sufixo ?? ""}`;
  const final = `${m.prefixo ? m.prefixo + (m.prefixo.endsWith("$") ? " " : "") : ""}${formatar(m.valor, casas)}${m.sufixo ?? ""}`;
  const d = 420;
  const f = encaixar(final, { largura: d * 0.72, max: 150, min: 48, linhas: 1, fonte: { peso: 800 } });
  const cy = CENTRO_Y - 70;
  const rotEm = m.rotuloEm ?? m.em + 0.3;
  const pR = prog(t, rotEm, 0.3, salto);
  return (
    <Saida t={t} fim={fim}>
      <div style={{ position: "absolute", left: CENTRO_X - d / 2, top: cy - d / 2 }}>
        <Adesivo t={t} colado={m.em} d={d} giro={-6}>
          <span style={{ ...estiloFonte(800, f.tamanho), lineHeight: 1 }}>{texto}</span>
        </Adesivo>
      </div>
      {m.ilustrativo ? (
        <div style={{ position: "absolute", left: CENTRO_X + d * 0.22, top: cy - d / 2 - 6, padding: "6px 16px", borderRadius: 18, background: cor.tinta, color: cor.papel, fontFamily: fonte, fontWeight: 700, fontSize: 24, letterSpacing: "0.06em", opacity: prog(t, m.em + 0.3, 0.3) }}>
          ILUSTRATIVO
        </div>
      ) : null}
      {t >= rotEm - 0.02 ? (
        <div style={{ position: "absolute", left: CENTRO_X - 330, top: cy + d / 2 + 24, width: 660, opacity: Math.min(1, pR * 2), transform: pR >= 1 ? undefined : `translateY(${(1 - pR) * -20}px)` }}>
          <EtiquetaPrateleira texto={m.rotulo} largura={660} max={46} />
        </div>
      ) : null}
    </Saida>
  );
};

// ——— comparação: a vitrine dividida em duas folhas por um montante de madeira ———
export const Comparacao: React.FC<Comum & { m: TComparacao }> = ({ t, plano, m, fim }) => {
  const altT = alturaLetreiro(m.titulo);
  const topo = AREA.y + altT + (m.titulo ? 10 : 0);
  const pM = prog(t, m.de, 0.4, saida);
  const meia = (AREA.w - 40) / 2;
  const venc = m.vencedor;
  const vencEm = m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.7;
  const pV = venc !== undefined ? prog(t, vencEm, 0.3) : 0;
  return (
    <Saida t={t} fim={fim}>
      <LetreiroDoVidro t={t} plano={plano} texto={m.titulo} em={m.de} ate={m.lados[0].em} />
      <div style={{ position: "absolute", left: CENTRO_X - 9, top: topo, width: 18, height: (AREA.base - topo) * pM, borderRadius: 9, background: cor.madeira, boxShadow: `inset 0 0 0 3px ${cor.madeiraEscura}` }} />
      {m.lados.map((l, i) => {
        if (t < l.em - 0.02) return null;
        const x = AREA.x + i * (meia + 40);
        const p = prog(t, l.em, 0.36, salto);
        const perde = venc !== undefined && venc !== i ? pV : 0;
        const img = imagemDoPlano(plano, l.imagem);
        const temImg = temImagem(img);
        const fR = caber(l.rotulo, meia - 60, 30, 22, 1, 800);
        const fT = caber(l.texto, meia - 30, temImg ? 56 : 80, 30, temImg ? 2 : 4, 800);
        const altTxt = fT.linhas.length * fT.tamanho * 1.14;
        const ladoImg = temImg ? Math.min(meia - 60, 240) : 0;
        const bloco = 60 + 24 + (temImg ? ladoImg + 24 : 0) + altTxt;
        const y = topo + (AREA.base - topo - bloco) / 2;
        const sinal: NomeIcone | null = m.modo === "errado-certo" ? (i === 0 ? "errado" : "certo") : venc === i ? "certo" : null;
        const sinalEm = m.modo === "errado-certo" ? l.em + 0.15 : vencEm;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: meia, height: bloco, opacity: Math.min(1, p * 2) * (1 - 0.6 * perde), transform: p >= 1 ? undefined : `translateY(${(1 - p) * 30}px)` }}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ padding: "10px 26px", borderRadius: 30, background: cor.tinta, color: cor.papel, fontFamily: fonte, fontWeight: 800, fontSize: fR.tamanho, letterSpacing: "0.06em", whiteSpace: "nowrap", textTransform: "uppercase" }}>
                {fR.linhas[0]}
              </div>
            </div>
            {temImg ? (
              <div style={{ margin: "24px auto 0", width: ladoImg, height: ladoImg, borderRadius: 22, overflow: "hidden", border: `6px solid ${cor.papel}`, boxSizing: "border-box", boxShadow: "0 10px 20px rgba(59,36,22,0.18)" }}>
                <Img src={staticFile(img.arquivo)} style={{ width: "100%", height: "100%", objectFit: img.transparente ? "contain" : "cover" }} />
              </div>
            ) : null}
            <div style={{ marginTop: 24 }}>
              <Texto t={t} linhas={fT.linhas} tamanho={fT.tamanho} />
            </div>
            {sinal ? (
              <div style={{ position: "absolute", right: -6, top: -40 }}>
                <Adesivo t={t} colado={sinalEm} d={110} giro={10} fundo={sinal === "errado" ? cor.acento : cor.adesivo} borda={sinal === "errado" ? cor.acentoEscuro : cor.adesivoEscuro}>
                  <Icone nome={sinal} tamanho={56} cor={sinal === "errado" ? cor.papel : cor.tinta} traco={3.4} />
                </Adesivo>
              </div>
            ) : null}
          </div>
        );
      })}
    </Saida>
  );
};

// ——— gráfico: potes de vidro que enchem (barras), linha pintada no vidro, torta fatiada (pizza) ———
const CORES_FATIA = [cor.acento, cor.adesivo, cor.salvia, cor.kraft, cor.madeiraEscura, cor.toldoCremeSombra];
export const Grafico: React.FC<Comum & { m: TGrafico }> = ({ t, plano, m, fim }) => {
  const altT = alturaLetreiro(m.titulo);
  const topo = AREA.y + altT + (m.titulo ? 16 : 6);
  const dados = m.dados ?? [];
  const un = m.unidade ?? "";
  const fmt = (v: number) => {
    const casas = Number.isInteger(v) ? 0 : 1;
    return un === "R$" || un === "US$" ? `${un} ${formatar(v, casas)}` : `${formatar(v, casas)}${un}`;
  };
  const conteudo = () => {
    if (!dados.length) {
      // sem números ditos: a curva pintada no vidro + "ilustrativo"
      const w = AREA.w - 80;
      const h = AREA.base - topo - 120;
      const p = prog(t, m.tendenciaEm ?? m.de, 1.2, suave);
      const pts = Array.from({ length: 41 }, (_, i) => {
        const x = i / 40;
        const y = m.tendencia === "cai" ? 0.15 + 0.7 * x + 0.06 * Math.sin(x * 9) : m.tendencia === "oscila" ? 0.5 + 0.3 * Math.sin(x * 11) * (1 - 0.3 * x) : 0.85 - 0.7 * x + 0.06 * Math.sin(x * 9);
        return `${(AREA.x + 40 + x * w).toFixed(1)},${(topo + 40 + y * h).toFixed(1)}`;
      });
      const comp = w * 1.6;
      return (
        <>
          <svg width={QUADRO.w} height={QUADRO.h} style={{ position: "absolute", left: 0, top: 0 }}>
            <line x1={AREA.x + 30} y1={topo + 40 + h + 10} x2={AREA.x + 40 + w} y2={topo + 40 + h + 10} stroke={cor.madeira} strokeWidth={6} strokeLinecap="round" />
            <polyline points={pts.join(" ")} fill="none" stroke={cor.acento} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${comp * p} ${comp * 2}`} />
          </svg>
          <div style={{ position: "absolute", left: AREA.x + AREA.w - 230, top: AREA.base - 70, padding: "8px 18px", borderRadius: 20, background: cor.tinta, color: cor.papel, fontFamily: fonte, fontWeight: 700, fontSize: 26, letterSpacing: "0.06em" }}>ILUSTRATIVO</div>
        </>
      );
    }
    const max = Math.max(...dados.map((d) => d.valor), 1e-9);
    if (m.forma === "pizza") {
      const total = dados.reduce((s, d) => s + d.valor, 0) || 1;
      const R = Math.min(230, (AREA.base - topo) / 2 - 20);
      const cx = AREA.x + R + 20;
      const cy = (topo + AREA.base) / 2;
      let a0 = -Math.PI / 2;
      const fatias = dados.map((d, i) => {
        const a1 = a0 + (d.valor / total) * Math.PI * 2;
        const r = { a0, a1, d, i };
        a0 = a1;
        return r;
      });
      return (
        <>
          <svg width={QUADRO.w} height={QUADRO.h} style={{ position: "absolute", left: 0, top: 0 }}>
            <circle cx={cx} cy={cy} r={R + 14} fill={cor.kraft} stroke={cor.kraftEscuro} strokeWidth={4} />
            {fatias.map(({ a0: a, a1: b, d, i }) => {
              const p = prog(t, d.em, 0.4, salto);
              if (p <= 0) return null;
              const meio = (a + b) / 2;
              const ox = Math.cos(meio) * 10 * (1 - p);
              const oy = Math.sin(meio) * 10 * (1 - p);
              const grande = b - a > Math.PI ? 1 : 0;
              return (
                <path
                  key={i}
                  d={`M ${cx + ox} ${cy + oy} L ${cx + ox + R * Math.cos(a)} ${cy + oy + R * Math.sin(a)} A ${R} ${R} 0 ${grande} 1 ${cx + ox + R * Math.cos(b)} ${cy + oy + R * Math.sin(b)} Z`}
                  fill={CORES_FATIA[i % CORES_FATIA.length]}
                  stroke={cor.papel}
                  strokeWidth={5}
                  opacity={Math.min(1, p * 2)}
                />
              );
            })}
          </svg>
          {dados.map((d, i) => {
            if (t < d.em - 0.02) return null;
            const y = topo + 20 + i * Math.min(110, (AREA.base - topo - 40) / dados.length);
            const f = caber(`${fmt(d.valor)} ${d.rotulo}`, AREA.w - 2 * R - 140, 46, 26, 1, 800);
            return (
              <div key={i} style={{ position: "absolute", left: cx + R + 50, top: y, display: "flex", alignItems: "center", gap: 16, opacity: prog(t, d.em, 0.25) }}>
                <div style={{ width: 34, height: 34, borderRadius: 17, background: CORES_FATIA[i % CORES_FATIA.length], border: `3px solid ${cor.papel}`, flexShrink: 0 }} />
                <span style={estiloFonte(800, f.tamanho)}>{f.linhas[0]}</span>
              </div>
            );
          })}
        </>
      );
    }
    const n = dados.length;
    const w = AREA.w / n;
    const altMax = PRAT_Y - topo - 150;
    if (m.forma === "linha") {
      const pontos = dados.map((d, i) => ({ x: AREA.x + w * (i + 0.5), y: PRAT_Y - 20 - (d.valor / max) * altMax, d }));
      const atual = dados.filter((d) => t >= d.em).length;
      return (
        <>
          <svg width={QUADRO.w} height={QUADRO.h} style={{ position: "absolute", left: 0, top: 0 }}>
            <line x1={AREA.x} y1={PRAT_Y} x2={AREA.x + AREA.w} y2={PRAT_Y} stroke={cor.madeira} strokeWidth={8} strokeLinecap="round" />
            {pontos.slice(1).map((pt, i) => {
              const a = pontos[i];
              const p = prog(t, pt.d.em - 0.2, 0.35, suave);
              return p > 0 ? <line key={i} x1={a.x} y1={a.y} x2={a.x + (pt.x - a.x) * p} y2={a.y + (pt.y - a.y) * p} stroke={cor.acento} strokeWidth={10} strokeLinecap="round" /> : null;
            })}
            {pontos.map((pt, i) => (t >= pt.d.em ? <circle key={i} cx={pt.x} cy={pt.y} r={14} fill={cor.papel} stroke={cor.acento} strokeWidth={7} /> : null))}
          </svg>
          {pontos.map((pt, i) => {
            if (t < pt.d.em - 0.02) return null;
            const fV = encaixar(fmt(pt.d.valor), { largura: 100, max: 34, min: 20, linhas: 1, fonte: { peso: 800 } });
            return (
              <div key={i}>
                <div style={{ position: "absolute", left: pt.x - 60, top: pt.y - 140 }}>
                  <Adesivo t={t} colado={pt.d.em} d={120} giro={i % 2 ? 6 : -6}>
                    <span style={estiloFonte(800, fV.tamanho)}>{fV.linhas[0]}</span>
                  </Adesivo>
                </div>
                <div style={{ position: "absolute", left: pt.x - Math.min(w - 16, 260) / 2, top: PRAT_Y + 26, width: Math.min(w - 16, 260), opacity: i < atual ? 1 : 0 }}>
                  <EtiquetaPrateleira texto={pt.d.rotulo} largura={Math.min(w - 16, 260)} max={30} />
                </div>
              </div>
            );
          })}
        </>
      );
    }
    // barras: potes de vidro na prateleira, cada um enche até o valor
    return (
      <>
        <div style={{ position: "absolute", left: VIDRO.x + 10, top: PRAT_Y - 2, width: VIDRO.w - 20, height: 14, borderRadius: 4, background: cor.madeiraClara, borderBottom: `14px solid ${cor.madeira}` }} />
        {dados.map((d, i) => {
          if (t < d.em - 0.02) return null;
          const cx = AREA.x + w * (i + 0.5);
          const pw = Math.min(170, w - 40);
          const ph = altMax;
          const enche = suave(clamp((t - d.em) / 0.8, 0, 1)) * (d.valor / max);
          const e = prog(t, d.em, 0.36, salto);
          const fV = encaixar(fmt(d.valor), { largura: 104, max: 34, min: 20, linhas: 1, fonte: { peso: 800 } });
          return (
            <div key={i}>
              <div style={{ position: "absolute", left: cx - pw / 2, top: PRAT_Y - ph, width: pw, height: ph, opacity: Math.min(1, e * 2), transform: e >= 1 ? undefined : `translateY(${(1 - e) * -50}px)` }}>
                <div style={{ position: "absolute", left: pw * 0.12, top: 0, width: pw * 0.76, height: 22, borderRadius: 6, background: cor.madeiraClara, border: `3px solid ${cor.madeiraEscura}`, boxSizing: "border-box" }} />
                <div style={{ position: "absolute", left: 0, top: 18, width: pw, height: ph - 18, borderRadius: "18px 18px 24px 24px", border: `5px solid rgba(122,90,69,0.55)`, boxSizing: "border-box", background: "rgba(255,255,255,0.45)", overflow: "hidden" }}>
                  <div style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: `${enche * 100}%`, background: i % 2 ? cor.adesivo : cor.acento }} />
                  <div style={{ position: "absolute", left: 12, top: 12, width: 12, height: (ph - 18) * 0.6, borderRadius: 6, background: "rgba(255,255,255,0.5)" }} />
                </div>
              </div>
              <div style={{ position: "absolute", left: cx - 60, top: PRAT_Y - ph - 92 }}>
                <Adesivo t={t} colado={d.em + 0.25} d={120} giro={i % 2 ? 7 : -7}>
                  <span style={estiloFonte(800, fV.tamanho)}>{fV.linhas[0]}</span>
                </Adesivo>
              </div>
              <div style={{ position: "absolute", left: cx - Math.min(w - 16, 260) / 2, top: PRAT_Y + 30, width: Math.min(w - 16, 260) }}>
                <EtiquetaPrateleira texto={d.rotulo} largura={Math.min(w - 16, 260)} max={30} />
              </div>
            </div>
          );
        })}
      </>
    );
  };
  return (
    <Saida t={t} fim={fim}>
      <LetreiroDoVidro t={t} plano={plano} texto={m.titulo} em={m.de} ate={dados[0]?.em ?? m.ate} />
      {conteudo()}
    </Saida>
  );
};

// ——— destaque: o carimbo grande ———
export const Destaque: React.FC<Comum & { m: TDestaque }> = ({ t, plano, m, fim }) => {
  const alerta = m.nivel === "alerta";
  // linhas do carimbo: até 3, o maior corpo que cabe em 800 px
  let s = 104;
  let linhas: string[] = [m.texto];
  for (; s >= 44; s -= 4) {
    const f = encaixar(m.texto.toLocaleUpperCase("pt-BR"), { largura: 700, max: s, min: s, linhas: 3, fonte: { peso: 800, espacamento: 0.04 } });
    linhas = f.linhas;
    if (medirCarimbo(linhas, linhas.map(() => s)).w <= 800 && linhas.length <= 3) break;
  }
  const med = medirCarimbo(linhas, linhas.map(() => s));
  const fD = m.detalhe ? caber(m.detalhe, AREA.w - 60, 46, 28, 2, 700) : null;
  const altD = fD ? fD.linhas.length * fD.tamanho * 1.14 + 40 : 0;
  const y = CENTRO_Y - (med.h + altD) / 2;
  return (
    <Saida t={t} fim={fim}>
      <div style={{ position: "absolute", left: CENTRO_X - med.w / 2, top: y }}>
        <Carimbo t={t} bate={m.em} linhas={linhas} tamanhos={linhas.map(() => s)} giro={-5} tinta={alerta ? cor.acento : cor.tinta} />
      </div>
      <div style={{ position: "absolute", left: CENTRO_X + med.w / 2 - 70, top: y - 56 }}>
        <Adesivo t={t} colado={m.em + 0.2} d={118} giro={12} fundo={alerta ? cor.acento : cor.adesivo} borda={alerta ? cor.acentoEscuro : cor.adesivoEscuro}>
          <Icone nome={alerta ? "alerta" : "certo"} tamanho={60} cor={alerta ? cor.papel : cor.tinta} traco={3.6} />
        </Adesivo>
      </div>
      {fD ? (
        <div style={{ position: "absolute", left: AREA.x, width: AREA.w, top: y + med.h + 40 }}>
          <Texto t={t} linhas={fD.linhas} tamanho={fD.tamanho} peso={700} cor={cor.tintaSuave} tempos={temposDoTexto(m.detalhe as string, m.detalheEm ?? m.em + 0.5, plano.palavras, fim)} />
        </div>
      ) : null}
    </Saida>
  );
};

// ——— definição: a linha do cardápio (termo ……… e a explicação embaixo) ———
export const Definicao: React.FC<Comum & { m: TDefinicao }> = ({ t, plano, m, fim }) => {
  const w = AREA.w - 20;
  const fT = caber(m.termo, w - 160, 78, 40, 2, 800);
  const fS = caber(m.significado, w - 80, 48, 28, 4, 700);
  const altT = fT.linhas.length * fT.tamanho * 1.14;
  const altS = fS.linhas.length * fS.tamanho * 1.2;
  const h = 60 + altT + 50 + altS + 60;
  const y = CENTRO_Y - h / 2;
  const p = prog(t, m.de, 0.4, saida);
  const pontos = prog(t, m.em + 0.2, 0.5, suave);
  return (
    <Saida t={t} fim={fim}>
      <div style={{ position: "absolute", left: CENTRO_X - w / 2, top: y, width: w, height: h, opacity: p, transform: p >= 1 ? undefined : `translateY(${(1 - p) * 40}px)` }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 26, background: cor.papel, border: `4px solid ${cor.tinta}`, boxShadow: "0 16px 30px rgba(59,36,22,0.2)" }} />
        <div style={{ position: "absolute", inset: 12, borderRadius: 18, border: `2px solid ${cor.papelBorda}` }} />
        <div style={{ position: "absolute", left: 40, top: 60, width: w - 160 }}>
          <Texto t={t} linhas={fT.linhas} tamanho={fT.tamanho} alinhar="left" tempos={temposDoTexto(m.termo, m.em, plano.palavras, m.significadoEm)} />
        </div>
        {/* a linha pontilhada do cardápio e o adesivo no fim */}
        <div style={{ position: "absolute", left: 40, top: 60 + altT + 16, width: (w - 150) * pontos, borderTop: `5px dotted ${cor.tintaSuave}` }} />
        <div style={{ position: "absolute", right: 30, top: 60 + altT - 66 }}>
          <Adesivo t={t} colado={m.em + 0.6} d={92} giro={8}>
            <Icone nome="certo" tamanho={48} cor={cor.tinta} traco={3.4} />
          </Adesivo>
        </div>
        <div style={{ position: "absolute", left: 40, top: 60 + altT + 50, width: w - 80 }}>
          <Texto t={t} linhas={fS.linhas} tamanho={fS.tamanho} peso={700} cor={cor.tintaSuave} alinhar="left" entrelinha={1.2} tempos={temposDoTexto(m.significado, m.significadoEm, plano.palavras, fim)} />
        </div>
      </div>
    </Saida>
  );
};

// ——— frase: letras pintadas no vidro com as aspas num adesivo ———
export const Frase: React.FC<Comum & { m: TFrase }> = ({ t, plano, m, fim }) => {
  const em = m.em ?? m.de;
  const f = caber(m.texto, AREA.w, 84, 40, 4);
  const alt = f.linhas.length * f.tamanho * 1.14;
  const y = CENTRO_Y - (alt + 130) / 2 + 130;
  return (
    <Saida t={t} fim={fim}>
      <div style={{ position: "absolute", left: CENTRO_X - 55, top: y - 140 }}>
        <Adesivo t={t} colado={em - 0.05} d={110} giro={-8} fundo={cor.acento} borda={cor.acentoEscuro}>
          <Icone nome="aspas" tamanho={60} cor={cor.papel} traco={3} />
        </Adesivo>
      </div>
      <div style={{ position: "absolute", left: AREA.x, width: AREA.w, top: y }}>
        <Texto t={t} linhas={f.linhas} tamanho={f.tamanho} tempos={temposDoTexto(m.texto, em, plano.palavras, m.ate)} destaque={m.destaque} risco={m.risco} riscoEm={m.riscoEm} />
      </div>
    </Saida>
  );
};

// ——— pergunta: o adesivo "?" e a pergunta pintada; as opções são etiquetas na prateleira ———
export const Pergunta: React.FC<Comum & { m: TPergunta }> = ({ t, plano, m, fim }) => {
  const em = m.em ?? m.de;
  const ops = m.opcoes ?? [];
  const f = caber(m.texto, AREA.w, ops.length ? 70 : 88, 40, 3);
  const alt = f.linhas.length * f.tamanho * 1.14;
  const yTexto = ops.length ? AREA.y + 150 : CENTRO_Y - alt / 2 + 60;
  const giro = Math.sin(t * 1.4) * 4;
  return (
    <Saida t={t} fim={fim}>
      <div style={{ position: "absolute", left: CENTRO_X - 62, top: yTexto - 150, transform: `rotate(${giro}deg)` }}>
        <Adesivo t={t} colado={em - 0.05} d={124} giro={0}>
          <Icone nome="interrogacao" tamanho={70} cor={cor.tinta} traco={3} />
        </Adesivo>
      </div>
      <div style={{ position: "absolute", left: AREA.x, width: AREA.w, top: yTexto }}>
        <Texto t={t} linhas={f.linhas} tamanho={f.tamanho} tempos={temposDoTexto(m.texto, em, plano.palavras, ops[0]?.em ?? m.ate)} />
      </div>
      {ops.map((o, i) => {
        if (t < o.em - 0.02) return null;
        const colunas = ops.length <= 2 ? ops.length : 2;
        const linha = Math.floor(i / colunas);
        const col = i % colunas;
        const w = (AREA.w - 30 * (colunas - 1)) / colunas;
        const linhas = Math.ceil(ops.length / colunas);
        const yBase = AREA.base - linhas * 120 - (linhas - 1) * 20;
        const p = prog(t, o.em, 0.3, salto);
        return (
          <div key={i} style={{ position: "absolute", left: AREA.x + col * (w + 30), top: yBase + linha * 140, width: w, opacity: Math.min(1, p * 2), transform: p >= 1 ? undefined : `translateY(${(1 - p) * -24}px)` }}>
            <EtiquetaPrateleira texto={o.texto} largura={w} max={44} />
          </div>
        );
      })}
    </Saida>
  );
};

// ——— fechamento: o balão de pedido ———
// O texto se escreve dentro do balão de conversa (genérico, sem marca de aplicativo); enquanto
// faltam palavras, os três pontinhos "digitando" ficam no fim. Com `pedido`, os produtos da última
// vitrine aparecem pequenos dentro do balão. No fim, o botão pulsa: enviar (comentar, o padrão),
// salvar, seguir ou link, conforme o `icone`.
export const Cta: React.FC<Comum & { m: TCta; itens?: Produto[] }> = ({ t, plano, m, fim, itens = [] }) => {
  const em = m.em ?? m.de;
  const w = AREA.w - 40;
  const f = caber(m.texto, w - 90, 96, 44, 3);
  const altT = f.linhas.length * f.tamanho * 1.14;
  const fotos = itens.slice(0, 3);
  const altLinha = fotos.length ? 150 : 92;
  const h = 50 + altT + 30 + altLinha + 40;
  const x = AREA.x + 20;
  const y = CENTRO_Y - h / 2 - 40;
  const p = prog(t, em - 0.04, 0.4, Easing.bezier(0.3, 1.35, 0.5, 1));
  const tempos = temposDoTexto(m.texto, em, plano.palavras, fim);
  const ultimo = tempos[tempos.length - 1] ?? em;
  const digitando = t < ultimo - 0.02;
  const pEnviar = prog(t, ultimo + 0.1, 0.3, salto);
  const icone: NomeIcone = m.icone ?? "comentar";
  const pulso = t > ultimo + 0.4 ? ((t - ultimo - 0.4) % 1.1) / 1.1 : -1;
  const yLinha = 50 + altT + 30;
  return (
    <Saida t={t} fim={fim}>
      <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: Math.min(1, p * 2.5), transformOrigin: "60px 100%", transform: p >= 1 ? undefined : `scale(${0.4 + 0.6 * p})` }}>
        {/* o balão com a pontinha embaixo à esquerda */}
        <svg width={w} height={h + 40} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: "drop-shadow(0 16px 26px rgba(59,36,22,0.22))" }}>
          <path d={`M 40 0 H ${w - 40} Q ${w} 0 ${w} 40 V ${h - 40} Q ${w} ${h} ${w - 40} ${h} H 150 L 70 ${h + 38} L 92 ${h} H 40 Q 0 ${h} 0 ${h - 40} V 40 Q 0 0 40 0 Z`} fill={cor.papel} stroke={cor.papelBorda} strokeWidth={4} />
        </svg>
        <div style={{ position: "absolute", left: 45, top: 50, width: w - 90 }}>
          <Texto t={t} linhas={f.linhas} tamanho={f.tamanho} tempos={tempos} destaque={m.destaque} alinhar="left" />
        </div>
        {fotos.length ? (
          <div style={{ position: "absolute", left: 45, top: yLinha, display: "flex", gap: 18 }}>
            {fotos.map((pr, i) => {
              const img = imagemDoPlano(plano, pr.imagem);
              const pF = prog(t, em + 0.15 + i * 0.12, 0.3, salto);
              return (
                <div key={i} style={{ width: 130, height: 150, borderRadius: 20, background: cor.vidroFundo, display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "hidden", opacity: Math.min(1, pF * 2), transform: pF >= 1 ? undefined : `scale(${0.6 + 0.4 * pF})` }}>
                  {temImagem(img) ? (
                    <Img src={staticFile(img.arquivo)} style={{ height: 136, objectFit: "contain" }} />
                  ) : pr.ilustracao ? (
                    <Ilustracao nome={pr.ilustracao} tamanho={110} />
                  ) : (
                    <span style={{ ...estiloFonte(800, 26), whiteSpace: "normal", textAlign: "center", padding: 8 }}>{pr.texto}</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}
        {/* "digitando" enquanto faltam palavras; depois, o botão de enviar */}
        <div style={{ position: "absolute", right: 40, top: yLinha + altLinha - 92, width: 92, height: 92 }}>
          {digitando && t >= em ? (
            <div style={{ position: "absolute", left: -40, top: 26, width: 132, height: 40, display: "flex", gap: 12, justifyContent: "center", alignItems: "center" }}>
              {[0, 1, 2].map((k) => (
                <div key={k} style={{ width: 16, height: 16, borderRadius: 8, background: cor.tintaSuave, opacity: 0.3 + 0.7 * Math.max(0, Math.sin(t * 7 - k * 0.9)) }} />
              ))}
            </div>
          ) : null}
          {pulso >= 0 ? <div style={{ position: "absolute", inset: -24 * pulso, borderRadius: "50%", border: `4px solid ${cor.acento}`, opacity: 1 - pulso }} /> : null}
          {t >= ultimo + 0.08 ? (
            <div style={{ position: "absolute", inset: 0, borderRadius: 46, background: cor.acento, display: "flex", alignItems: "center", justifyContent: "center", opacity: Math.min(1, pEnviar * 2), transform: pEnviar >= 1 ? undefined : `scale(${0.5 + 0.5 * pEnviar})` }}>
              <Icone nome={icone === "comentar" ? "enviar" : icone} tamanho={50} cor={cor.papel} traco={2.4} />
            </div>
          ) : null}
        </div>
      </div>
    </Saida>
  );
};
