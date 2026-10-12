// Os 11 blocos universais na linguagem do caderno de campo: cartões creme que pousam no painel,
// cabeçalhos verde-lavoura com rótulo em mono, números em Fira Mono, o grifo e a mira em amarelo de
// sinalização, a terra para o que cai e o lado ruim, o céu para água. Cada bloco reaproveita as
// peças da assinatura (estaca, mira, talhão, régua, pivô).
import { Easing } from "remotion";
import { formatar, pouso, prog, saindo, soco, suave, temposDoTexto } from "../anim";
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
  Topicos as TTopicos,
} from "../plano";
import { cor, fonte, mono, PAINEL, RAIO, sombra } from "../tema";
import { caber, caberMono, Cartao, Etiqueta, FotoCampo, Icone, type NomeIcone, Mira, Texto } from "./Pecas";

type Comum = { t: number; plano: Plano; fim: number };

const CENTRO_Y = (PAINEL.y + PAINEL.base) / 2;

const Saida: React.FC<{ t: number; fim: number; children: React.ReactNode }> = ({ t, fim, children }) => {
  const s = saindo(t, fim, 0.14);
  return <div style={{ position: "absolute", inset: 0, opacity: 1 - s }}>{children}</div>;
};

// Título no alto do painel: alinhado à esquerda, com a fita amarela de estaca acima.
const fitTitulo = (texto?: string) => (texto ? caber(texto, PAINEL.w, 64, 40, 2) : null);
const alturaTitulo = (texto?: string) => {
  const f = fitTitulo(texto);
  return f ? f.linhas.length * f.tamanho * 1.16 + 46 : 0;
};
const Titulo: React.FC<{ t: number; plano: Plano; texto?: string; em: number; ate: number }> = ({ t, plano, texto, em, ate }) => {
  const f = fitTitulo(texto);
  if (!f || !texto) return null;
  const p = prog(t, em - 0.05, 0.3);
  return (
    <>
      <div style={{ position: "absolute", left: PAINEL.x, top: PAINEL.y, width: 96 * p, height: 10, borderRadius: 3, background: cor.sinal }} />
      <div style={{ position: "absolute", left: PAINEL.x, width: PAINEL.w, top: PAINEL.y + 26 }}>
        <Texto t={t} linhas={f.linhas} tamanho={f.tamanho} tempos={temposDoTexto(texto, em, plano.palavras, ate)} alinhar="left" />
      </div>
    </>
  );
};

// ——— abertura: o título grande com os sulcos da lavoura se abrindo embaixo ———
export const Abertura: React.FC<Comum & { m: TAbertura }> = ({ t, plano, m, fim }) => {
  const em = m.em ?? m.de;
  const inicio = em <= 0.2 ? Math.max(0.02, em - 0.12) : em;
  const tempos = temposDoTexto(m.texto, inicio, plano.palavras, m.ate).map((x, i) => (i === 0 ? inicio : x));
  const f = caber(m.texto, PAINEL.w, 108, 56, 3);
  const altT = f.linhas.length * f.tamanho * 1.16;
  const altSulcos = 150;
  const total = 96 + 30 + altT + 40 + altSulcos;
  const y0 = CENTRO_Y - total / 2;
  const pE = prog(t, inicio - 0.1, 0.35);
  return (
    <Saida t={t} fim={fim}>
      <div style={{ position: "absolute", left: PAINEL.x, top: y0, width: 96, height: 96, borderRadius: 22, background: cor.sinal, display: "flex", alignItems: "center", justifyContent: "center", opacity: pE, transform: `translateY(${(1 - pE) * 16}px)` }}>
        <Icone nome="estaca" tamanho={58} cor={cor.verdeEscuro} traco={2.6} />
      </div>
      <div style={{ position: "absolute", left: PAINEL.x, width: PAINEL.w, top: y0 + 126 }}>
        <Texto t={t} linhas={f.linhas} tamanho={f.tamanho} tempos={tempos} destaque={m.destaque} alinhar="left" />
      </div>
      <svg width={PAINEL.w} height={altSulcos} style={{ position: "absolute", left: PAINEL.x, top: y0 + 126 + altT + 40, overflow: "visible" }}>
        {Array.from({ length: 5 }).map((_, i) => {
          const p = prog(t, inicio + 0.15 + i * 0.1, 1.1, suave);
          const yy = 12 + i * 32;
          return (
            <g key={i}>
              <line x1={0} y1={yy} x2={PAINEL.w * p} y2={yy} stroke={i % 2 ? cor.terra : cor.verde} strokeWidth={12} strokeLinecap="round" opacity={0.85 - i * 0.1} />
            </g>
          );
        })}
        {/* a semeadeira que anda no sulco de cima (sempre vivo) */}
        <circle cx={((t * 160) % PAINEL.w) * prog(t, inicio + 1.2, 0.2)} cy={12} r={14} fill={cor.sinal} stroke={cor.verdeEscuro} strokeWidth={4} opacity={prog(t, inicio + 1.2, 0.2)} />
      </svg>
    </Saida>
  );
};

// ——— tópicos e passos: talhões em fila; nos passos, a estrada de terra liga as estacas ———
export const Lista: React.FC<Comum & { m: TTopicos | TPassos }> = ({ t, plano, m, fim }) => {
  const passos = m.tipo === "passos";
  const altT = alturaTitulo(m.titulo);
  const topo = PAINEL.y + altT + (m.titulo ? 6 : 10);
  const n = m.itens.length;
  const vao = 18;
  const alt = Math.min(156, (PAINEL.base - topo - vao * (n - 1)) / n);
  const y0 = topo + (PAINEL.base - topo - (alt * n + vao * (n - 1))) / 2;
  const entrou = m.itens.filter((it) => t >= it.em - 0.02).length;
  const marcador = Math.min(84, alt - 36);
  const xMarc = 26;
  const larguraTexto0 = PAINEL.w - xMarc - marcador - 30 - 34;
  return (
    <Saida t={t} fim={fim}>
      <Titulo t={t} plano={plano} texto={m.titulo} em={m.de} ate={m.itens[0]?.em ?? m.ate} />
      {passos && n > 1 ? (
        <svg width={40} height={(n - 1) * (alt + vao)} style={{ position: "absolute", left: PAINEL.x + xMarc + marcador / 2 - 20, top: y0 + alt / 2, overflow: "visible" }}>
          <line x1={20} y1={0} x2={20} y2={(n - 1) * (alt + vao)} stroke={cor.palhaFundo} strokeWidth={14} strokeLinecap="round" />
          <line
            x1={20}
            y1={0}
            x2={20}
            y2={entrou >= 2 ? (entrou - 2 + prog(t, m.itens[entrou - 1].em, 0.4, suave)) * (alt + vao) : 0}
            stroke={cor.terra}
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray="22 12"
          />
        </svg>
      ) : null}
      {m.itens.map((it, i) => {
        if (t < it.em - 0.02) return null;
        const e = pouso(t, it.em, { de: 1.04, sobe: 18 });
        const atual = i === entrou - 1;
        const temDet = !!it.detalhe;
        const fit = caber(it.texto, larguraTexto0, temDet ? 48 : 54, 28, temDet ? 1 : 2, 700);
        const fitD = temDet ? caber(it.detalhe as string, larguraTexto0, 32, 22, 1, 600) : null;
        const altTxt = fit.linhas.length * fit.tamanho * 1.16 + (fitD ? fitD.tamanho * 1.2 + 4 : 0);
        const y = y0 + i * (alt + vao);
        return (
          <div key={i} style={{ position: "absolute", left: PAINEL.x, top: y, width: PAINEL.w, height: alt, opacity: e.opacity, transform: e.transform }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 22, background: cor.cartao, border: `3px solid ${atual ? cor.sinal : cor.cartaoBorda}`, boxShadow: sombra }} />
            <div style={{ position: "absolute", left: 0, top: 0, width: 12, height: alt, borderRadius: "22px 0 0 22px", background: i % 2 ? cor.terra : cor.verde }} />
            <div
              style={{
                position: "absolute",
                left: xMarc,
                top: (alt - marcador) / 2,
                width: marcador,
                height: marcador,
                borderRadius: passos ? marcador / 2 : 18,
                background: atual ? cor.sinal : cor.verdeClaro,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icone nome={passos ? "estaca" : "broto"} tamanho={marcador * 0.6} cor={cor.verdeEscuro} traco={2.6} />
            </div>
            <div style={{ position: "absolute", left: xMarc + marcador + 30, top: (alt - altTxt) / 2, width: larguraTexto0 }}>
              <Texto t={t} linhas={fit.linhas} tamanho={fit.tamanho} peso={700} alinhar="left" />
              {fitD ? (
                <div style={{ marginTop: 4 }}>
                  <Texto t={t} linhas={fitD.linhas} tamanho={fitD.tamanho} peso={600} cor={cor.tintaSuave} alinhar="left" />
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </Saida>
  );
};

// ——— número: a leitura de instrumento (mono contando + a régua de campo que enche) ———
export const Numero: React.FC<Comum & { m: TNumero }> = ({ t, m, fim }) => {
  const casas = m.casas ?? 0;
  const texto = (v: number) => `${m.prefixo ?? ""}${formatar(v, casas)}${m.sufixo ?? ""}`;
  const final = texto(m.valor);
  const W = PAINEL.w;
  const fN = caberMono(final, W - 120, 200, 80, 1);
  const pC = prog(t, m.em, 0.9, Easing.out(Easing.cubic));
  const entra = Math.max(m.de, m.em - 0.2);
  const e = pouso(t, entra, { de: 1.05, sobe: 24 });
  const altCard = fN.tamanho * 1.1 + 200;
  const rotuloEm = m.rotuloEm ?? m.em + 0.35;
  const fR = caber(m.rotulo, W - 120, 56, 30, 2, 700);
  const altR = fR.linhas.length * fR.tamanho * 1.16;
  const total = altCard + 34 + altR;
  const y0 = CENTRO_Y - total / 2;
  const golpe = soco(t, m.em + 0.9, 0.3);
  const regua = W - 120;
  return (
    <Saida t={t} fim={fim}>
      {e.visivel ? (
        <Cartao x={PAINEL.x} y={y0} w={W} h={altCard} style={{ opacity: e.opacity, transform: e.transform }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 44, textAlign: "center", transform: golpe ? `scale(${1 + 0.05 * golpe})` : undefined }}>
            <span style={{ fontFamily: mono, fontWeight: 700, fontSize: fN.tamanho, color: cor.verdeEscuro, letterSpacing: "-0.03em", lineHeight: 1.1, whiteSpace: "nowrap" }}>{texto(m.valor * pC)}</span>
          </div>
          {/* régua de campo */}
          <svg width={regua} height={70} style={{ position: "absolute", left: 60, bottom: 40 }}>
            <rect x={0} y={34} width={regua} height={18} rx={9} fill={cor.palha} />
            <rect x={0} y={34} width={regua * pC} height={18} rx={9} fill={cor.verde} />
            {Array.from({ length: 21 }).map((_, k) => (
              <line key={k} x1={(k / 20) * regua} x2={(k / 20) * regua} y1={k % 5 ? 18 : 6} y2={30} stroke={cor.tintaSuave} strokeWidth={k % 5 ? 2 : 4} />
            ))}
            <path d={`M${regua * pC - 12},4 h24 l-12,16z`} fill={cor.sinal} stroke={cor.sinalEscuro} strokeWidth={2} />
          </svg>
          {m.ilustrativo ? (
            <div style={{ position: "absolute", right: 24, top: 20 }}>
              <Etiqueta texto="ilustrativo" fundo={cor.palha} tinta={cor.tintaSuave} tamanho={20} />
            </div>
          ) : null}
        </Cartao>
      ) : null}
      <div style={{ position: "absolute", left: PAINEL.x, width: W, top: y0 + altCard + 34 }}>
        <Texto t={t} linhas={fR.linhas} tamanho={fR.tamanho} peso={700} tempos={fR.linhas.join(" ").split(" ").map((_, i) => rotuloEm + i * 0.08)} />
      </div>
    </Saida>
  );
};

// ——— comparação: dois talhões lado a lado; o vencedor ganha a mira e o ✓ ———
export const Comparacao: React.FC<Comum & { m: TComparacao }> = ({ t, plano, m, fim }) => {
  const altT = alturaTitulo(m.titulo);
  const topo = PAINEL.y + altT + (m.titulo ? 4 : 30);
  const base = PAINEL.base - (m.titulo ? 0 : 30);
  const vao = 26;
  const w = (PAINEL.w - vao) / 2;
  const h = base - topo;
  const vEm = m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.7;
  const pV = m.vencedor !== undefined ? prog(t, vEm, 0.3) : 0;
  const errCerto = m.modo === "errado-certo";
  return (
    <Saida t={t} fim={fim}>
      <Titulo t={t} plano={plano} texto={m.titulo} em={m.de} ate={m.lados[0].em} />
      {m.lados.map((l, i) => {
        if (t < l.em - 0.02) return null;
        const e = pouso(t, l.em, { de: 1.05, sobe: 20 });
        const x = PAINEL.x + i * (w + vao);
        const ruim = errCerto ? i === 0 : i === 0 && m.modo === "antes-depois";
        const corCab = ruim ? cor.terra : cor.verdeEscuro;
        const venceu = m.vencedor === i;
        const perdeu = m.vencedor !== undefined && m.vencedor !== i;
        const img = imagemDoPlano(plano, l.imagem);
        const altFoto = temImagem(img) ? Math.min(300, h * 0.42) : 0;
        const fRot = caberMono(l.rotulo.toLocaleUpperCase("pt-BR"), w - 110, 30, 20, 1);
        const fTx = caber(l.texto, w - 60, 62, 30, 4, 800);
        const altTx = fTx.linhas.length * fTx.tamanho * 1.16;
        const corpoY = 84 + altFoto;
        return (
          <div key={i}>
            <div style={{ position: "absolute", left: x, top: topo, width: w, height: h, opacity: e.opacity * (1 - 0.45 * pV * (perdeu ? 1 : 0)), transform: e.transform }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: RAIO, background: cor.cartao, border: `2px solid ${cor.cartaoBorda}`, boxShadow: sombra }} />
              <div style={{ position: "absolute", left: 0, top: 0, width: w, height: 84, borderRadius: `${RAIO}px ${RAIO}px 0 0`, background: perdeu && pV > 0.5 ? cor.apagado : corCab }} />
              <div style={{ position: "absolute", left: 28, top: (84 - fRot.tamanho * 1.2) / 2, fontFamily: mono, fontWeight: 700, fontSize: fRot.tamanho, lineHeight: 1.2, color: cor.cartao, whiteSpace: "nowrap", letterSpacing: "0.04em" }}>
                {l.rotulo.toLocaleUpperCase("pt-BR")}
              </div>
              {errCerto ? (
                <div style={{ position: "absolute", right: 22, top: 18 }}>
                  <Icone nome={i === 0 ? "errado" : "certo"} tamanho={48} cor={cor.sinal} traco={3.2} />
                </div>
              ) : null}
              {temImagem(img) ? (
                <div style={{ position: "absolute", left: 18, top: 102, width: w - 36, height: altFoto - 18 }}>
                  <FotoCampo t={t} img={img} w={w - 36} h={altFoto - 18} inicio={l.em} fim={fim} raio={16} />
                </div>
              ) : null}
              <div style={{ position: "absolute", left: 30, width: w - 60, top: corpoY + (h - corpoY - altTx) / 2 }}>
                <Texto t={t} linhas={fTx.linhas} tamanho={fTx.tamanho} alinhar="left" tempos={temposDoTexto(l.texto, l.em, plano.palavras, fim)} />
              </div>
            </div>
            {venceu && pV > 0 ? (
              <>
                <Mira t={t} em={vEm} x={x} y={topo} w={w} h={h} braco={52} />
                <div style={{ position: "absolute", left: x + w / 2 - 44, top: topo + h - 64, width: 88, height: 88, borderRadius: 44, background: cor.verde, border: `5px solid ${cor.cartao}`, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${0.6 + 0.4 * pV})`, opacity: pV }}>
                  <Icone nome="certo" tamanho={52} cor={cor.cartao} traco={3.4} />
                </div>
              </>
            ) : null}
          </div>
        );
      })}
    </Saida>
  );
};

// ——— gráfico: colunas que brotam da faixa de terra, linha de campo, ou o pivô central (pizza) ———
const TENDENCIAS = { sobe: [0.32, 0.46, 0.58, 0.74, 0.94], cai: [0.94, 0.76, 0.6, 0.46, 0.3], oscila: [0.5, 0.78, 0.44, 0.82, 0.58] };
const CORES_PIVO = [cor.verde, cor.sinal, cor.terra, cor.ceu, cor.verdeEscuro, "#93B95E"];

export const Grafico: React.FC<Comum & { m: TGrafico }> = ({ t, plano, m, fim }) => {
  const dados = m.dados?.length ? m.dados : null;
  const forma = m.forma === "pizza" && !dados ? "barras" : m.forma;
  const altT = alturaTitulo(m.titulo);
  const topo = PAINEL.y + altT + (m.titulo ? 6 : 20);
  const W = PAINEL.w;
  const h = PAINEL.base - topo;
  const e = pouso(t, m.de, { de: 1.04, sobe: 16 });
  const ini = m.tendenciaEm ?? dados?.[0]?.em ?? m.de + 0.2;
  // sem números, mas com nomes: poucas colunas rotuladas; a última é a que a fala destaca
  const rotulos = !dados && (m.rotulos?.length ?? 0) >= 2 ? (m.rotulos as string[]).slice(0, 5) : null;
  const nomeadas = (k: number) =>
    Array.from({ length: k }, (_, i) => {
      const u = k > 1 ? i / (k - 1) : 1;
      if (m.tendencia === "cai") return 0.97 - 0.5 * u;
      if (m.tendencia === "oscila") return i % 2 ? 0.92 : 0.58;
      return 0.47 + 0.5 * u;
    });
  const valores = dados ? dados.map((d) => d.valor) : rotulos ? nomeadas(rotulos.length) : TENDENCIAS[m.tendencia ?? "sobe"];
  const maximo = Math.max(...valores, 1e-6);
  const n = valores.length;
  const emDe = (i: number) => (dados ? dados[i].em : rotulos ? (i < n - 1 ? Math.min(ini - 0.1, m.de + 0.04 + i * 0.1) : ini) : ini + i * 0.13);
  const ilustrativo = !dados || m.ilustrativo;
  const casas = (v: number) => (Number.isInteger(v) ? 0 : 1);
  return (
    <Saida t={t} fim={fim}>
      <Titulo t={t} plano={plano} texto={m.titulo} em={m.de} ate={ini} />
      {e.visivel ? (
        <Cartao x={PAINEL.x} y={topo} w={W} h={h} style={{ opacity: e.opacity, transform: e.transform }}>
          {forma === "barras"
            ? (() => {
                const base = h - (dados ? 104 : rotulos ? 136 : 74);
                // folga no alto para a etiqueta "ilustrativo" e o broto da coluna mais alta
                const topoB = ilustrativo || m.unidade ? 118 : 96;
                const larg = W - 100;
                const bw = rotulos ? Math.min(250, (W - 200 - (n - 1) * 90) / n) : Math.min(150, (larg - (n - 1) * 26) / n);
                const vaoB = rotulos ? (n <= 2 ? 170 : 90) : n > 1 ? (larg - bw * n) / (n - 1) : 0;
                const x0 = rotulos ? (W - (n * bw + (n - 1) * vaoB)) / 2 : 50;
                return (
                  <>
                    {/* a faixa de terra */}
                    <div style={{ position: "absolute", left: 30, right: 30, top: base, height: 22, borderRadius: 11, background: cor.terra }} />
                    {valores.map((v, i) => {
                      const p = prog(t, emDe(i), rotulos && i < n - 1 ? 0.35 : 0.6, Easing.out(Easing.cubic));
                      const hh = (base - topoB) * (v / maximo) * p;
                      const x = x0 + i * (bw + vaoB);
                      const destaque = dados ? v === maximo : i === n - 1;
                      const fRot = dados ? caber(dados[i].rotulo, bw + vaoB - 12, 30, 18, 2, 700) : null;
                      const fNome = rotulos ? caber(rotulos[i], bw + Math.min(vaoB, 120) - 12, 40, 24, 2, 800) : null;
                      const fundoB = destaque ? `linear-gradient(180deg, ${cor.verde}, ${cor.verdeEscuro})` : rotulos ? cor.terraClara : cor.verdeClaro;
                      const bordaB = destaque ? undefined : `3px solid ${rotulos ? cor.terra : cor.verde}`;
                      return (
                        <div key={i}>
                          <div style={{ position: "absolute", left: x, top: base - hh, width: bw, height: hh, borderRadius: "16px 16px 4px 4px", background: fundoB, border: bordaB, boxSizing: "border-box" }} />
                          {p > 0.3 && !dados && (!rotulos || destaque) ? (
                            <div style={{ position: "absolute", left: x + bw / 2 - 22, top: base - hh - 46, opacity: prog(t, emDe(i) + 0.3, 0.25), transform: `rotate(${Math.sin(t * 2 + i) * 6}deg)`, transformOrigin: "50% 100%" }}>
                              <Icone nome="broto" tamanho={44} cor={destaque ? cor.verdeEscuro : cor.verde} traco={2.6} />
                            </div>
                          ) : null}
                          {dados && p > 0.1 ? (
                            <div style={{ position: "absolute", left: x - 30, width: bw + 60, top: base - hh - 56, textAlign: "center", fontFamily: mono, fontWeight: 700, fontSize: Math.min(44, bw * 0.42), color: cor.verdeEscuro, opacity: prog(t, emDe(i) + 0.2, 0.2) }}>
                              {formatar(v * Math.min(1, p * 1.2), casas(v))}
                              {m.unidade && m.unidade.length <= 3 ? m.unidade : ""}
                            </div>
                          ) : null}
                          {fNome ? (
                            <div style={{ position: "absolute", left: x - (Math.min(vaoB, 120) - 12) / 2, width: bw + Math.min(vaoB, 120) - 12, top: base + 36, opacity: prog(t, emDe(i), 0.25) }}>
                              <Texto t={t} linhas={fNome.linhas} tamanho={fNome.tamanho} peso={800} cor={destaque ? cor.verdeEscuro : cor.terraEscura} />
                            </div>
                          ) : null}
                          {fRot ? (
                            <div style={{ position: "absolute", left: x - vaoB / 2 + 6, width: bw + vaoB - 12, top: base + 32 }}>
                              <Texto t={t} linhas={fRot.linhas} tamanho={fRot.tamanho} peso={700} cor={cor.tintaSuave} />
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </>
                );
              })()
            : null}
          {forma === "linha"
            ? (() => {
                const gx = 60;
                const gw = W - 120;
                const gy = 70;
                const gh = h - (dados ? 190 : 150);
                const minimo = dados ? Math.min(...valores) : 0;
                const faixa = Math.max(1e-6, maximo - minimo * 0.8);
                const pts = valores.map((v, i) => ({ x: gx + (n > 1 ? (i / (n - 1)) * gw : gw / 2), y: gy + gh - ((v - minimo * 0.8) / faixa) * gh * 0.9 }));
                const ultimo = [...valores.keys()].filter((i) => t >= emDe(i) - 0.02).pop() ?? -1;
                const pSeg = ultimo >= 0 && ultimo < n - 1 ? 0 : 1;
                const visiveis = pts.slice(0, ultimo + 1);
                const d = visiveis.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join("");
                return (
                  <svg width={W} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
                    {[0, 0.5, 1].map((k) => (
                      <line key={k} x1={gx} x2={gx + gw} y1={gy + k * gh} y2={gy + k * gh} stroke={cor.linha} strokeWidth={2} />
                    ))}
                    {visiveis.length > 1 ? <path d={d} fill="none" stroke={cor.verde} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" /> : null}
                    {visiveis.map((p, i) => (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r={i === ultimo ? 14 + 2 * Math.sin(t * 6) : 10} fill={cor.cartao} stroke={i === ultimo ? cor.sinalEscuro : cor.verde} strokeWidth={6} />
                        {dados ? (
                          <text x={p.x} y={p.y - 30} textAnchor="middle" fontFamily={mono} fontWeight={700} fontSize={38} fill={cor.verdeEscuro}>
                            {formatar(valores[i], casas(valores[i]))}
                          </text>
                        ) : null}
                        {dados ? (
                          <text x={p.x} y={gy + gh + 60} textAnchor="middle" fontFamily={fonte} fontWeight={700} fontSize={28} fill={cor.tintaSuave}>
                            {dados[i].rotulo}
                          </text>
                        ) : null}
                      </g>
                    ))}
                    {pSeg === 0 ? null : null}
                  </svg>
                );
              })()
            : null}
          {forma === "pizza" && dados
            ? (() => {
                const total = valores.reduce((a, b) => a + b, 0) || 1;
                const r = Math.min(h - 100, W * 0.5) / 2;
                const cx = 60 + r;
                const cy = h / 2;
                let acc = 0;
                const giro = (t * 40) % 360;
                return (
                  <>
                    <svg width={W} height={h} style={{ position: "absolute", inset: 0 }}>
                      <circle cx={cx} cy={cy} r={r + 10} fill={cor.palha} />
                      {valores.map((v, i) => {
                        const a0 = (acc / total) * 360;
                        acc += v;
                        const a1 = (acc / total) * 360;
                        const p = prog(t, emDe(i), 0.5, suave);
                        const fimA = a0 + (a1 - a0) * p;
                        if (p <= 0) return null;
                        const ponto = (a: number) => [cx + r * Math.sin((a * Math.PI) / 180), cy - r * Math.cos((a * Math.PI) / 180)];
                        const [x0, y0] = ponto(a0);
                        const [x1, y1] = ponto(fimA);
                        const grande = fimA - a0 > 180 ? 1 : 0;
                        return <path key={i} d={`M${cx},${cy}L${x0},${y0}A${r},${r} 0 ${grande} 1 ${x1},${y1}Z`} fill={CORES_PIVO[i % CORES_PIVO.length]} stroke={cor.cartao} strokeWidth={4} />;
                      })}
                      {/* o braço do pivô central girando */}
                      <line x1={cx} y1={cy} x2={cx + r * Math.sin((giro * Math.PI) / 180)} y2={cy - r * Math.cos((giro * Math.PI) / 180)} stroke={cor.tinta} strokeWidth={6} strokeLinecap="round" opacity={0.55} />
                      <circle cx={cx} cy={cy} r={14} fill={cor.cartao} stroke={cor.tinta} strokeWidth={5} />
                    </svg>
                    {dados.map((d, i) => {
                      if (t < d.em - 0.02) return null;
                      const lx = cx + r + 60;
                      const ly = cy - (n * 96) / 2 + i * 96;
                      const fL = caber(d.rotulo, W - lx - 40, 34, 22, 1, 700);
                      return (
                        <div key={i} style={{ position: "absolute", left: lx, top: ly, opacity: prog(t, d.em, 0.25) }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                            <div style={{ width: 26, height: 26, borderRadius: 6, background: CORES_PIVO[i % CORES_PIVO.length] }} />
                            <span style={{ fontFamily: mono, fontWeight: 700, fontSize: 42, color: cor.tinta }}>
                              {formatar(d.valor, casas(d.valor))}
                              {m.unidade ?? ""}
                            </span>
                          </div>
                          <div style={{ marginLeft: 42, fontFamily: fonte, fontWeight: 700, fontSize: fL.tamanho, color: cor.tintaSuave, whiteSpace: "nowrap" }}>{fL.linhas.join(" ")}</div>
                        </div>
                      );
                    })}
                  </>
                );
              })()
            : null}
          {m.unidade && !(forma === "pizza") && m.unidade.length > 3 ? (
            <div style={{ position: "absolute", left: 30, top: 20 }}>
              <Etiqueta texto={m.unidade} tamanho={24} fundo={cor.verdeEscuro} tinta={cor.cartao} />
            </div>
          ) : null}
          {ilustrativo ? (
            <div style={{ position: "absolute", right: 24, top: 20 }}>
              <Etiqueta texto="ilustrativo" fundo={cor.palha} tinta={cor.tintaSuave} tamanho={22} />
            </div>
          ) : null}
        </Cartao>
      ) : null}
    </Saida>
  );
};

// ——— destaque: a placa de campo (amarela de sinalização; alerta = faixas de perigo) ———
export const Destaque: React.FC<Comum & { m: TDestaque }> = ({ t, plano, m, fim }) => {
  const alerta = m.nivel === "alerta";
  const W = PAINEL.w;
  const f = caber(m.texto, W - 140, 96, 48, 3);
  const altT = f.linhas.length * f.tamanho * 1.16;
  const fD = m.detalhe ? caber(m.detalhe, W - 100, 42, 26, 2, 700) : null;
  const altD = fD ? fD.linhas.length * fD.tamanho * 1.16 + 44 : 0;
  const hPlaca = altT + 150;
  const total = hPlaca + (fD ? 30 + altD : 0);
  const y0 = CENTRO_Y - total / 2;
  const e = pouso(t, m.em, { de: 1.06, sobe: 24 });
  const golpe = soco(t, m.em + 0.36, 0.3);
  const detalheEm = m.detalheEm ?? m.em + 0.6;
  const pD = pouso(t, detalheEm, { de: 1.04, sobe: 16 });
  const fundo = alerta ? cor.alerta : cor.sinal;
  const tinta = alerta ? cor.cartao : cor.tinta;
  return (
    <Saida t={t} fim={fim}>
      {e.visivel ? (
        <div style={{ position: "absolute", left: PAINEL.x, top: y0, width: W, height: hPlaca, opacity: e.opacity, transform: e.transform ?? (golpe ? `scale(${1 + 0.03 * golpe})` : undefined) }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 28, background: fundo, boxShadow: sombra }} />
          {alerta ? (
            <div style={{ position: "absolute", inset: 14, borderRadius: 18, border: `10px solid transparent`, backgroundImage: `repeating-linear-gradient(45deg, ${cor.cartao} 0 18px, ${cor.alerta} 18px 36px)`, backgroundOrigin: "border-box", WebkitMask: "linear-gradient(#000 0 0) padding-box, linear-gradient(#000 0 0)", WebkitMaskComposite: "xor", maskComposite: "exclude" }} />
          ) : (
            <div style={{ position: "absolute", inset: 14, borderRadius: 18, border: `5px solid ${cor.tinta}` }} />
          )}
          {[
            [34, 34],
            [W - 34, 34],
            [34, hPlaca - 34],
            [W - 34, hPlaca - 34],
          ].map(([x, y], k) => (
            <div key={k} style={{ position: "absolute", left: x - 9, top: y - 9, width: 18, height: 18, borderRadius: 9, background: alerta ? cor.cartao : cor.tinta, opacity: 0.85 }} />
          ))}
          <div style={{ position: "absolute", left: 70, width: W - 140, top: 75 }}>
            <Texto t={t} linhas={f.linhas} tamanho={f.tamanho} cor={tinta} tempos={temposDoTexto(m.texto, m.em, plano.palavras, fim)} />
          </div>
          <div style={{ position: "absolute", left: W / 2 - 30, top: -30, width: 60, height: 60, borderRadius: 30, background: alerta ? cor.cartao : cor.verdeEscuro, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: sombra }}>
            <Icone nome={alerta ? "alerta" : "estaca"} tamanho={36} cor={alerta ? cor.alerta : cor.sinal} traco={2.8} />
          </div>
        </div>
      ) : null}
      {fD && pD.visivel ? (
        <Cartao x={PAINEL.x + 30} y={y0 + hPlaca + 30} w={W - 60} h={altD} style={{ opacity: pD.opacity, transform: pD.transform }}>
          <div style={{ position: "absolute", left: 20, right: 20, top: 22 }}>
            <Texto t={t} linhas={fD.linhas} tamanho={fD.tamanho} peso={700} cor={cor.tintaSuave} />
          </div>
        </Cartao>
      ) : null}
    </Saida>
  );
};

// ——— definição: a ficha técnica (termo no cabeçalho verde, significado que se monta) ———
export const Definicao: React.FC<Comum & { m: TDefinicao }> = ({ t, plano, m, fim }) => {
  const W = PAINEL.w;
  const fT = caber(m.termo, W - 100, 92, 48, 2);
  const altCab = fT.linhas.length * fT.tamanho * 1.16 + 70;
  const fS = caber(m.significado, W - 100, 56, 32, 4, 700);
  const altS = fS.linhas.length * fS.tamanho * 1.16 + 80;
  const total = altCab + altS;
  const y0 = CENTRO_Y - total / 2;
  const e = pouso(t, m.em, { de: 1.05, sobe: 20 });
  return (
    <Saida t={t} fim={fim}>
      {e.visivel ? (
        <Cartao x={PAINEL.x} y={y0} w={W} h={total} style={{ opacity: e.opacity, transform: e.transform }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: W, height: altCab, borderRadius: `${RAIO}px ${RAIO}px 0 0`, background: cor.verdeEscuro }} />
          <div style={{ position: "absolute", left: 50, width: W - 100, top: 35 }}>
            <Texto t={t} linhas={fT.linhas} tamanho={fT.tamanho} cor={cor.cartao} alinhar="left" tempos={temposDoTexto(m.termo, m.em, plano.palavras, m.significadoEm)} />
          </div>
          <div style={{ position: "absolute", right: 30, top: altCab - 30, width: 60, height: 60, borderRadius: 16, background: cor.sinal, display: "flex", alignItems: "center", justifyContent: "center", transform: `rotate(${Math.sin(t * 1.5) * 3}deg)` }}>
            <Icone nome="estaca" tamanho={38} cor={cor.verdeEscuro} traco={2.6} />
          </div>
          <div style={{ position: "absolute", left: 50, width: W - 100, top: altCab + 40 }}>
            <Texto t={t} linhas={fS.linhas} tamanho={fS.tamanho} peso={700} alinhar="left" tempos={temposDoTexto(m.significado, m.significadoEm, plano.palavras, fim)} />
          </div>
        </Cartao>
      ) : null}
    </Saida>
  );
};

// ——— frase: o cartão de caderno com as aspas verdes; grifo amarelo e risco ———
export const Frase: React.FC<Comum & { m: TFrase }> = ({ t, plano, m, fim }) => {
  const em = m.em ?? m.de;
  const W = PAINEL.w;
  const f = caber(m.texto, W - 120, 84, 42, 4);
  const altT = f.linhas.length * f.tamanho * 1.16;
  const h = altT + 170;
  const y0 = CENTRO_Y - h / 2;
  const e = pouso(t, Math.max(m.de, em - 0.15), { de: 1.04, sobe: 18 });
  return (
    <Saida t={t} fim={fim}>
      {e.visivel ? (
        <Cartao x={PAINEL.x} y={y0} w={W} h={h} style={{ opacity: e.opacity, transform: e.transform }}>
          <div style={{ position: "absolute", left: 40, top: -40, fontFamily: fonte, fontWeight: 800, fontSize: 170, lineHeight: 1, color: cor.verde }}>“</div>
          <div style={{ position: "absolute", left: 60, width: W - 120, top: 100 }}>
            <Texto t={t} linhas={f.linhas} tamanho={f.tamanho} alinhar="left" tempos={temposDoTexto(m.texto, em, plano.palavras, fim)} destaque={m.destaque} risco={m.risco} riscoEm={m.riscoEm} />
          </div>
          <div style={{ position: "absolute", left: 60, bottom: 34, width: 120 * prog(t, em, 0.6), height: 8, borderRadius: 4, background: cor.terra }} />
        </Cartao>
      ) : null}
    </Saida>
  );
};

// ——— pergunta: a pergunta grande com a estaca "?"; opções como talhões ———
export const Pergunta: React.FC<Comum & { m: TPergunta }> = ({ t, plano, m, fim }) => {
  const em = m.em ?? m.de;
  const W = PAINEL.w;
  const ops = m.opcoes ?? [];
  const f = caber(m.texto, W, ops.length ? 72 : 96, 42, 3);
  const altT = f.linhas.length * f.tamanho * 1.16;
  const colunas = ops.length === 3 ? 3 : 2;
  const linhasOp = Math.ceil(ops.length / colunas);
  const altOp = ops.length ? Math.min(190, (PAINEL.base - PAINEL.y - altT - 160 - (linhasOp - 1) * 22) / linhasOp) : 0;
  const total = 110 + altT + (ops.length ? 40 + linhasOp * altOp + (linhasOp - 1) * 22 : 0);
  const y0 = ops.length ? PAINEL.y : CENTRO_Y - total / 2;
  const pE = prog(t, em - 0.1, 0.3);
  const wOp = (W - (colunas - 1) * 22) / colunas;
  return (
    <Saida t={t} fim={fim}>
      <div style={{ position: "absolute", left: PAINEL.x, top: y0, width: 86, height: 86, borderRadius: 22, background: cor.sinal, display: "flex", alignItems: "center", justifyContent: "center", opacity: pE, transform: `rotate(${Math.sin(t * 2) * 4}deg)` }}>
        <Icone nome="interrogacao" tamanho={56} cor={cor.verdeEscuro} traco={2.8} />
      </div>
      <div style={{ position: "absolute", left: PAINEL.x, width: W, top: y0 + 110 }}>
        <Texto t={t} linhas={f.linhas} tamanho={f.tamanho} alinhar="left" tempos={temposDoTexto(m.texto, em, plano.palavras, ops[0]?.em ?? fim)} />
      </div>
      {ops.map((o, i) => {
        if (t < o.em - 0.02) return null;
        const e = pouso(t, o.em, { de: 1.05, sobe: 18 });
        const col = i % colunas;
        const lin = Math.floor(i / colunas);
        const x = PAINEL.x + col * (wOp + 22);
        const y = y0 + 110 + altT + 40 + lin * (altOp + 22);
        const fO = caber(o.texto, wOp - 50, 52, 26, 3, 800);
        const altTx = fO.linhas.length * fO.tamanho * 1.16;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: wOp, height: altOp, opacity: e.opacity, transform: e.transform }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 22, background: cor.cartao, border: `3px solid ${cor.cartaoBorda}`, boxShadow: sombra }} />
            <div style={{ position: "absolute", left: 0, top: 0, width: wOp, height: 14, borderRadius: "22px 22px 0 0", background: [cor.verde, cor.terra, cor.ceu, cor.sinal][i % 4] }} />
            <div style={{ position: "absolute", left: 25, width: wOp - 50, top: (altOp - altTx) / 2 + 6 }}>
              <Texto t={t} linhas={fO.linhas} tamanho={fO.tamanho} />
            </div>
          </div>
        );
      })}
    </Saida>
  );
};

// ——— fechamento: o cartão de planilha que se preenche (o material) + a chamada com a palavra-chave ———
const ICONES_CTA: Record<NonNullable<TCta["icone"]>, NomeIcone> = { salvar: "salvar", seguir: "seguir", comentar: "comentar", link: "link" };

export const Cta: React.FC<Comum & { m: TCta }> = ({ t, plano, m, fim }) => {
  const em = m.em ?? m.de;
  const W = PAINEL.w;
  const mat = m.material;
  const fC = caber(m.texto, W - 150, mat ? 84 : 104, 44, 2);
  const altC = Math.max(118, fC.linhas.length * fC.tamanho * 1.16);
  const vaoC = 44;
  const altSheet = mat ? Math.min(600, PAINEL.base - PAINEL.y - altC - vaoC) : 0;
  const ySheet = PAINEL.y + (PAINEL.base - PAINEL.y - (altSheet + vaoC + altC)) / 2;
  const yC = mat ? ySheet + altSheet + vaoC : CENTRO_Y - altC / 2;
  const pI = prog(t, em - 0.08, 0.3);
  const pulsoAnel = ((t - em) * 1.2) % 1;
  const temposC = temposDoTexto(m.texto, em, plano.palavras, fim + 1);
  return (
    <Saida t={t} fim={fim}>
      {mat ? <Planilha t={t} plano={plano} mat={mat} y={ySheet} h={altSheet} fim={fim} /> : null}
      {t >= em - 0.1 ? (
        <div style={{ position: "absolute", left: PAINEL.x, width: W, top: yC, height: altC, display: "flex", alignItems: "center", gap: 30 }}>
          <div style={{ position: "relative", width: 118, height: 118, flexShrink: 0, opacity: pI, transform: `scale(${0.7 + 0.3 * pI})` }}>
            {t > em ? <div style={{ position: "absolute", inset: -14 * pulsoAnel, borderRadius: "50%", border: `5px solid ${cor.verde}`, opacity: 1 - pulsoAnel }} /> : null}
            <div style={{ position: "absolute", inset: 0, borderRadius: 59, background: cor.verde, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: sombra }}>
              <Icone nome={ICONES_CTA[m.icone ?? "comentar"]} tamanho={64} cor={cor.cartao} traco={2.6} />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <Texto t={t} linhas={fC.linhas} tamanho={fC.tamanho} alinhar="left" tempos={temposC} destaque={m.destaque} />
          </div>
        </div>
      ) : null}
    </Saida>
  );
};

// O material: com `linhas`, a planilha de verdade (cabeçalho verde com o nome, a coluna de itens
// escritos e a coluna de ✓ que marca linha a linha; uma linha "Total" ganha o amarelo). Sem `linhas`,
// o arquivo: o ícone da planilha, o nome e a seta de baixar. Nunca números: nenhum valor foi dito.
const CORES_ITEM = [cor.verde, cor.ceu, cor.terra, cor.sinalEscuro, cor.verdeEscuro];
const Planilha: React.FC<{ t: number; plano: Plano; mat: NonNullable<TCta["material"]>; y: number; h: number; fim: number }> = ({ t, plano, mat, y, h, fim }) => {
  const W = PAINEL.w;
  const e = pouso(t, mat.em, { de: 1.06, sobe: 26 });
  if (!e.visivel) return null;
  const linhas = (mat.linhas ?? []).filter((l) => l.trim()).slice(0, 6);
  const lista = mat.forma === "lista";
  const tempos = temposDoTexto(mat.texto, mat.em, plano.palavras, fim);
  const flutua = Math.sin(t * 1.6) * 4;
  if (!linhas.length) {
    // o arquivo para baixar
    const hA = Math.min(h, 380);
    const fT = caber(mat.texto, W - 330, 64, 36, 3);
    const altT = fT.linhas.length * fT.tamanho * 1.16;
    const pulo = Math.abs(Math.sin(t * 3.2)) * 10;
    return (
      <div style={{ position: "absolute", left: PAINEL.x, top: y + (h - hA) / 2 + flutua, width: W, height: hA, opacity: e.opacity, transform: e.transform }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: RAIO, background: cor.cartao, border: `2px solid ${cor.cartaoBorda}`, boxShadow: sombra }} />
        <svg width={190} height={240} viewBox="0 0 190 240" style={{ position: "absolute", left: 50, top: (hA - 240) / 2 }}>
          <path d="M12 6h120l52 52v170a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6V12a6 6 0 0 1 6-6z" fill={cor.verde} />
          <path d="M132 6v46a6 6 0 0 0 6 6h46z" fill={cor.verdeEscuro} />
          {lista ? (
            [0, 1, 2].map((k) => <path key={k} d={`M40 ${104 + k * 40}l10 10 20-20M86 ${108 + k * 40}h64`} stroke={cor.cartao} strokeWidth={9} strokeLinecap="round" fill="none" />)
          ) : (
            <g stroke={cor.cartao} strokeWidth={7} fill="none">
              <rect x={34} y={92} width={122} height={110} rx={6} />
              <path d="M34 128h122M34 165h122M80 92v110" />
            </g>
          )}
        </svg>
        <div style={{ position: "absolute", left: 280, width: W - 330, top: (hA - altT - 90) / 2 }}>
          <Texto t={t} linhas={fT.linhas} tamanho={fT.tamanho} alinhar="left" tempos={tempos} />
          <div style={{ marginTop: 24, display: "inline-flex", alignItems: "center", gap: 14, padding: "12px 24px", borderRadius: 14, background: cor.sinal, opacity: prog(t, mat.em + 0.5, 0.3) }}>
            <svg width={40} height={40} viewBox="0 0 24 24" style={{ transform: `translateY(${pulo * 0.3}px)` }}>
              <path d="M12 3v12M6.5 10l5.5 5.5 5.5-5.5M4 20h16" fill="none" stroke={cor.tinta} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <svg width={60} height={14} viewBox="0 0 60 14">
              {[0, 1, 2].map((k) => (
                <circle key={k} cx={8 + k * 22} cy={7} r={5} fill={cor.tinta} opacity={0.3 + 0.7 * Math.max(0, Math.sin(t * 5 - k * 0.9))} />
              ))}
            </svg>
          </div>
        </div>
      </div>
    );
  }
  // a planilha com os itens escritos
  const fT = caber(mat.texto, W - 260, 50, 32, 2);
  const altCab = Math.max(110, fT.linhas.length * fT.tamanho * 1.16 + 48);
  const altCol = 58;
  const n = linhas.length;
  const altLin = (h - altCab - altCol - 22) / n;
  const xCheck = W - 30 - 150;
  const ehTotal = (l: string) => /^total/i.test(l.trim());
  return (
    <div style={{ position: "absolute", left: PAINEL.x, top: y + flutua, width: W, height: h, opacity: e.opacity, transform: e.transform }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: RAIO, background: cor.cartao, border: `2px solid ${cor.cartaoBorda}`, boxShadow: sombra }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: altCab, borderRadius: `${RAIO}px ${RAIO}px 0 0`, background: cor.verdeEscuro }} />
      <div style={{ position: "absolute", left: 30, top: (altCab - 74) / 2, width: 74, height: 74, borderRadius: 16, background: cor.sinal, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icone nome={lista ? "certo" : "planilha"} tamanho={46} cor={cor.verdeEscuro} traco={2.4} />
      </div>
      <div style={{ position: "absolute", left: 128, width: W - 260, top: (altCab - fT.linhas.length * fT.tamanho * 1.16) / 2 }}>
        <Texto t={t} linhas={fT.linhas} tamanho={fT.tamanho} cor={cor.cartao} alinhar="left" tempos={tempos} />
      </div>
      {/* baixar: a seta que desce na bandeja */}
      <div style={{ position: "absolute", right: 30, top: (altCab - 64) / 2, width: 64, height: 64, borderRadius: 32, border: `3px solid ${cor.sinal}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={36} height={36} viewBox="0 0 24 24" style={{ transform: `translateY(${Math.abs(Math.sin(t * 3)) * 3}px)` }}>
          <path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" fill="none" stroke={cor.sinal} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {/* cabeçalho das colunas */}
      <div style={{ position: "absolute", left: 0, top: altCab, width: W, height: altCol, background: cor.palha }} />
      <div style={{ position: "absolute", left: 64, top: altCab + (altCol - 26 * 1.2) / 2, fontFamily: mono, fontWeight: 700, fontSize: 26, lineHeight: 1.2, color: cor.tintaSuave, letterSpacing: "0.06em" }}>ITEM</div>
      <div style={{ position: "absolute", left: xCheck, width: 150, top: altCab + (altCol - 34) / 2, display: "flex", justifyContent: "center" }}>
        <Icone nome="certo" tamanho={34} cor={cor.tintaSuave} traco={3} />
      </div>
      <div style={{ position: "absolute", left: xCheck, top: altCab, width: 2, height: h - altCab - 22, background: cor.linha }} />
      {linhas.map((l, i) => {
        const yy = altCab + altCol + i * altLin;
        const em = mat.em + 0.3 + i * 0.16;
        const pL = prog(t, em, 0.25);
        const pV = prog(t, em + 0.12, 0.22);
        const total = ehTotal(l) && i === n - 1;
        const fL = caber(l, xCheck - 110, Math.min(46, altLin * 0.5), 26, 1, total ? 800 : 700);
        return (
          <div key={i}>
            {total ? <div style={{ position: "absolute", left: 16, right: 16, top: yy + 6, height: altLin - 12, borderRadius: 14, background: cor.sinal, opacity: pL }} /> : null}
            {i > 0 && !total ? <div style={{ position: "absolute", left: 30, right: 30, top: yy, height: 2, background: cor.linha }} /> : null}
            <div style={{ position: "absolute", left: 34, top: yy + altLin / 2 - 9, width: 18, height: 18, borderRadius: 5, background: total ? cor.tinta : CORES_ITEM[i % CORES_ITEM.length], opacity: pL }} />
            <div style={{ position: "absolute", left: 70, top: yy + (altLin - fL.tamanho * 1.16) / 2, opacity: pL, transform: pL >= 1 ? undefined : `translateX(${(1 - pL) * -16}px)` }}>
              <Texto t={t} linhas={fL.linhas} tamanho={fL.tamanho} peso={total ? 800 : 700} alinhar="left" />
            </div>
            <div style={{ position: "absolute", left: xCheck + 75 - 24, top: yy + altLin / 2 - 24, width: 48, height: 48, borderRadius: 24, background: total ? cor.tinta : cor.verde, display: "flex", alignItems: "center", justifyContent: "center", opacity: pV, transform: `scale(${0.5 + 0.5 * pV})` }}>
              <Icone nome="certo" tamanho={30} cor={total ? cor.sinal : cor.cartao} traco={3.4} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
