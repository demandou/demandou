// A tela do funil: o contorno do funil (largura de cada etapa = quantas pessoas chegam lá), os
// pontos que assentam no fundo de cada etapa e descem pelo gargalo, os contadores na lateral,
// a taxa de cada passo, o vazamento em laranja e o conserto em verde.
import { limitar, mistura, Palavras, prog, pulso, quandoDiz, saindo, temposDoTexto, Traco, troca } from "../anim";
import {
  arranjo,
  estadoDaVaga,
  estadoDoPasso,
  etapaAtiva,
  FUNIL,
  type Historia,
  larguraNaAltura,
  largurasNoTempo,
  posicaoNoTempo,
  notaDaUnidade,
  taxaNoTempo,
  valorNoTempo,
  voos,
} from "../funil";
import type { Conserto, Funil, Momento, Palavra } from "../plano";
import { caber, cor, fonte, formatar, LARGURA, larguraTexto, medir, porcento, tipo } from "../tema";
import { Icone } from "./Icones";

const corDaPeca = (c: "normal" | "conserto") => (c === "conserto" ? cor.conserto : cor.grafite);

// Número com algarismos de largura igual (o contador não "dança") e separador estreito
const Numero: React.FC<{ texto: string; tamanho: number; cor: string }> = ({ texto, tamanho, cor: c }) => (
  <span style={{ display: "inline-flex", fontSize: tamanho, fontWeight: 800, color: c, lineHeight: 1, letterSpacing: "-0.01em" }}>
    {[...texto].map((ch, i) =>
      /\d/.test(ch) ? (
        <span key={i} style={{ fontVariantNumeric: "tabular-nums" }}>
          {ch}
        </span>
      ) : (
        <span key={i} style={{ margin: "0 -0.04em" }}>
          {ch}
        </span>
      ),
    )}
  </span>
);

export const TelaDoFunil: React.FC<{ h: Historia; momentos: Momento[]; palavras: Palavra[]; t: number; aberta: number }> = ({
  h,
  momentos,
  palavras,
  t,
  aberta,
}) => {
  if (aberta <= 0.001) return null;
  const { funil } = h;
  const consertos = momentos.filter((m): m is Conserto => m.tipo === "conserto");
  const larguras = largurasNoTempo(h, t);
  // a primeira abertura: o contorno se desenha de cima para baixo, começando ainda por trás da
  // pessoa (quando ela encolhe, o funil já está pela metade: nenhum quadro vazio)
  const desenho = prog(t, funil.de - 0.4, 0.8, troca);
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: fonte }}>
      <Contorno h={h} larguras={larguras} desenho={desenho} />
      <Pontos h={h} t={t} />
      {funil.etapas.map((_, k) => (
        <Contador key={`n-${k}`} h={h} k={k} t={t} palavras={palavras} larguras={larguras} entrada={prog(t, funil.de - 0.2 + 0.08 * k, 0.45)} />
      ))}
      {funil.etapas.map((_, k) => (k === 0 ? null : <Selo key={`s-${k}`} h={h} k={k} t={t} larguras={larguras} entrada={prog(t, funil.de - 0.1 + 0.08 * k, 0.45)} />))}
      {consertos.map((m) => (m.caminho ? <Caminho key={`c-${m.de}`} h={h} m={m} palavras={palavras} t={t} larguras={larguras} /> : null))}
      {consertos.map((m) => (m.depois ? <Depois key={`d-${m.de}`} h={h} m={m} t={t} larguras={larguras} /> : null))}
      <Etiqueta h={h} palavras={palavras} t={t} />
    </div>
  );
};

// ——— o contorno do funil ———

// paredes do funil (esquerda de cima para baixo, direita de baixo para cima), com as larguras dadas
const paredes = (h: Historia, larguras: number[]) => {
  const { geo } = h;
  const esquerda: [number, number][] = [];
  const direita: [number, number][] = [];
  for (let k = 0; k <= geo.n; k++) {
    const w = k < geo.n ? larguras[k] : larguras[geo.n - 1];
    esquerda.push([geo.centro - w / 2, geo.y[k]]);
    direita.push([geo.centro + w / 2, geo.y[k]]);
  }
  return { esquerda, direita };
};

const Contorno: React.FC<{ h: Historia; larguras: number[]; desenho: number }> = ({ h, larguras, desenho }) => {
  const { geo } = h;
  const { esquerda, direita } = paredes(h, larguras);
  const fundo = `M ${esquerda.map(([x, y]) => `${x} ${y}`).join(" L ")} L ${[...direita].reverse().map(([x, y]) => `${x} ${y}`).join(" L ")} Z`;
  // o traço: as duas paredes descem juntas a partir da boca; o fundo do bico fecha no fim
  const linha = (pts: [number, number][]) => `M ${pts.map(([x, y]) => `${x} ${y}`).join(" L ")}`;
  const ultimoE = esquerda[esquerda.length - 1];
  const ultimoD = direita[direita.length - 1];
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      <path d={fundo} fill={cor.miolo} opacity={prog(desenho, 0.1, 0.6)} />
      {geo.y.slice(1, geo.n).map((y, i) => {
        const w = larguras[i + 1];
        const p = prog(desenho, 0.35 + 0.1 * i, 0.4);
        return <line key={i} x1={geo.centro - w / 2} y1={y} x2={geo.centro - w / 2 + w * p} y2={y} stroke={cor.fio} strokeWidth={2.5} />;
      })}
      <Traco d={linha(esquerda)} p={prog(desenho, 0, 0.85)} cor={cor.grafite} largura={4.5} />
      <Traco d={linha(direita)} p={prog(desenho, 0, 0.85)} cor={cor.grafite} largura={4.5} />
      <Traco d={`M ${ultimoE[0]} ${ultimoE[1]} L ${ultimoD[0]} ${ultimoD[1]}`} p={prog(desenho, 0.82, 0.18)} cor={cor.grafite} largura={4.5} />
      {/* a borda da boca: dois toquinhos para fora, como a aba de um funil */}
      <Traco d={`M ${esquerda[0][0] - 22} ${geo.y[0] - 10} L ${esquerda[0][0]} ${geo.y[0]}`} p={prog(desenho, 0, 0.2)} cor={cor.grafite} largura={4.5} />
      <Traco d={`M ${direita[0][0] + 22} ${geo.y[0] - 10} L ${direita[0][0]} ${geo.y[0]}`} p={prog(desenho, 0, 0.2)} cor={cor.grafite} largura={4.5} />
    </svg>
  );
};

// ——— os pontos (pessoas) ———

// fatia de círculo de `a` a `b` (frações da volta, a partir do topo, no sentido horário)
const fatia = (x: number, y: number, r: number, a: number, b: number) => {
  const ang = (f: number) => -Math.PI / 2 + f * 2 * Math.PI;
  const [x0, y0] = [x + r * Math.cos(ang(a)), y + r * Math.sin(ang(a))];
  const [x1, y1] = [x + r * Math.cos(ang(b)), y + r * Math.sin(ang(b))];
  return `M ${x} ${y} L ${x0} ${y0} A ${r} ${r} 0 ${b - a > 0.5 ? 1 : 0} 1 ${x1} ${y1} Z`;
};

const Ponto: React.FC<{ x: number; y: number; r: number; fatias: { de: number; ate: number; cor: string; opacidade?: number }[]; anel: boolean }> = ({
  x,
  y,
  r,
  fatias,
  anel,
}) => (
  <g>
    {anel ? <circle cx={x} cy={y} r={r - 1.5} fill={cor.branco} stroke={cor.grafite} strokeOpacity={0.7} strokeWidth={3} /> : null}
    {fatias.map((f, i) =>
      f.ate - f.de >= 0.999 ? (
        <circle key={i} cx={x} cy={y} r={r} fill={f.cor} opacity={f.opacidade ?? 1} />
      ) : f.ate - f.de > 0.002 ? (
        <path key={i} d={fatia(x, y, r, f.de, f.ate)} fill={f.cor} opacity={f.opacidade ?? 1} />
      ) : null,
    )}
  </g>
);

const Pontos: React.FC<{ h: Historia; t: number }> = ({ h, t }) => {
  const { geo } = h;
  const r = geo.ponto / 2;
  const itens: React.ReactNode[] = [];
  for (let k = 0; k < geo.n; k++) {
    const ultima = k === geo.n - 1;
    const saiu = h.primeiraSaida[k];
    const apaga = Number.isFinite(saiu) ? prog(t, saiu, 0.4) : 0;
    const vazou = estadoDoPasso(h, k + 1, t).alerta;
    const a = arranjo(h, k, t);
    const totalVagas = Math.max(a.vagas, ...h.chegadas[k].map((p) => p.vaga + 1));
    for (let v = 0; v < totalVagas; v++) {
      const est = estadoDaVaga(h, k, v, t);
      // o ponto aparece um instante antes de pousar (o voo termina nele)
      const proxima = h.chegadas[k].filter((p) => p.vaga === v && p.em > t && p.em - t < 0.06);
      if (est.cheio <= 0.001 && proxima.length === 0) continue;
      const pos = posicaoNoTempo(h, k, v, t);
      const primeira = h.chegadas[k].find((p) => p.vaga === v);
      const surge = primeira ? prog(t, primeira.em - 0.06, 0.18) : 1;
      // a primeira etapa: os pontos caem um pouco pela boca enquanto aparecem
      const cai = k === 0 ? (1 - surge) * -46 : 0;
      // quem acabou de ser escolhido para descer cresce um instante
      const escolhida = est.saiu.length ? est.saiu[est.saiu.length - 1].em : -10;
      const pulo = t - escolhida < 0.3 ? 1 + 0.35 * Math.sin(((t - escolhida) / 0.3) * Math.PI) : 1;
      // o ponto, por origem: grafite (montagem) ou verde (chegou por causa de um conserto)
      const chegou: { de: number; ate: number; cor: "normal" | "conserto" }[] = [];
      let c0 = 0;
      for (const p of est.chegou) {
        const q = Math.min(p.quanto, 1 - c0);
        if (q > 0) chegou.push({ de: c0, ate: c0 + q, cor: p.cor });
        c0 += q;
      }
      const fatias: { de: number; ate: number; cor: string; opacidade?: number }[] = [];
      if (ultima || t < saiu) {
        for (const c of chegou) fatias.push({ de: c.de, ate: c.ate, cor: corDaPeca(c.cor) });
      } else {
        // o que passou para baixo: cheio (verde, se passou por causa de um conserto)
        let cursor = 0;
        for (const p of est.saiu) {
          const q = Math.min(p.quanto, est.cheio - cursor);
          if (q <= 0) continue;
          fatias.push({ de: cursor, ate: cursor + q, cor: corDaPeca(p.cor) });
          cursor += q;
        }
        // o que ficou pelo caminho: a cor de origem, apagada; com o passo de baixo em alerta,
        // pulsa em laranja (o vazamento)
        for (const c of chegou) {
          const de = Math.max(c.de, cursor);
          if (c.ate - de <= 0.001) continue;
          // nos primeiros ~1,8 s o vazamento pisca; depois respira devagar, mais calmo
          if (vazou !== undefined)
            fatias.push({ de, ate: c.ate, cor: cor.alerta, opacidade: t - vazou < 1.8 ? 0.35 + 0.6 * pulso(t, vazou, 0.7) : 0.3 + 0.14 * pulso(t, vazou, 1.6) });
          else fatias.push({ de, ate: c.ate, cor: corDaPeca(c.cor), opacidade: mistura(1, c.cor === "conserto" ? 0.32 : 0.17, apaga) });
        }
      }
      itens.push(
        <g key={`p${k}-${v}`} opacity={surge}>
          <Ponto x={pos.x} y={pos.y + cai} r={r * pulo} fatias={fatias} anel={est.cheio < 0.999} />
          {ultima && est.cheio > 0 ? (
            <circle cx={pos.x} cy={pos.y} r={r + mistura(3, 10, prog(t, primeira?.em ?? 0, 0.5))} fill="none" stroke={cor.grafite} strokeWidth={2.5} opacity={0.4} />
          ) : null}
        </g>,
      );
    }
  }
  // pontos descendo pelo gargalo
  for (const [i, voo] of voos(h, t).entries()) {
    itens.push(<circle key={`voo-${i}`} cx={voo.x} cy={voo.y} r={voo.d / 2} fill={corDaPeca(voo.cor)} opacity={limitar(voo.p * 6)} />);
  }
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      {itens}
    </svg>
  );
};

// ——— o contador de cada etapa, na lateral do funil ———

// parede esquerda na altura y (com a maior largura que o funil chega a ter)
const paredeEsquerda = (h: Historia, y: number) => h.geo.centro - larguraNaAltura(h.geo, h.geo.larguraMax, y) / 2;

const Contador: React.FC<{ h: Historia; k: number; t: number; palavras: Palavra[]; larguras: number[]; entrada: number }> = ({
  h,
  k,
  t,
  palavras,
  entrada,
}) => {
  const { geo, funil } = h;
  const e = funil.etapas[k];
  const proxima = funil.etapas[k + 1]?.em ?? funil.ate;
  const ativa = etapaAtiva(h, k, t);
  const acende = prog(t, e.em - 0.02, 0.3);
  const valor = valorNoTempo(h, k, t);
  const alvo = [...h.transferencias].reverse().find((x) => x.para === k && x.inicio <= t)?.valorDepois ?? (k === 0 ? h.valores[0] : 0);
  const plural = !!e.plural && Math.round(valor) >= 2 && alvo !== 1;
  const texto = plural ? (e.plural as string) : e.texto;
  const palavrasDoRotulo = texto.split(/\s+/).filter(Boolean);
  const tempos = temposDoTexto(e.texto, palavras, e.em - 0.15, proxima, e.em - 0.05);
  // um conserto sem taxa dita mexeu neste número: ele passa a ser aproximado ("≈")
  const aproximado = h.consertos.some((c) => c.ilustrativo && c.etapa <= k && t >= c.em);
  const numero = ativa ? `${aproximado ? "≈ " : ""}${formatar(Math.round(valor))}` : "—";
  const corNumero = ativa ? cor.grafite : cor.lapis;
  const corRotulo = ativa ? cor.grafiteSuave : cor.lapis;
  const rotulo = (linhas: string[][], tamanho: number, alinhar: "left" | "right") => (
    <div style={{ fontSize: tamanho, fontWeight: 600, lineHeight: 1.06, color: corRotulo, textAlign: alinhar }}>
      {linhas.map((l, i) =>
        plural || !ativa ? (
          <div key={i} style={{ whiteSpace: "nowrap" }}>
            {l.join(" ")}
          </div>
        ) : (
          <Palavras
            key={i}
            palavras={l}
            tempos={tempos}
            base={linhas.slice(0, i).reduce((s, x) => s + x.length, 0)}
            t={t}
            fantasma={0.3}
            alinhar={alinhar === "right" ? "right" : "left"}
            style={{ whiteSpace: "nowrap", flexWrap: "nowrap" }}
            corDe={() => cor.grafite}
          />
        ),
      )}
    </div>
  );

  // etapa sem número dito: só o rótulo, maior, na mesma posição (o número não é inventado)
  if (!h.mostraNumero[k]) return <RotuloSemNumero h={h} k={k} t={t} palavras={palavras} entrada={entrada} />;

  if (k === 0) {
    // a primeira etapa: o contador fica acima da boca, numa linha só
    const esquerda = Math.max(36, geo.centro - geo.largura0[0] / 2);
    return (
      <div
        style={{
          position: "absolute",
          left: esquerda,
          top: geo.y[0] - 118,
          display: "flex",
          alignItems: "baseline",
          gap: 18,
          opacity: entrada,
          translate: `0 ${(1 - entrada) * 16}px`,
        }}
      >
        <span style={{ scale: String(1 + 0.06 * Math.sin(Math.PI * acende)) }}>
          <Numero texto={numero} tamanho={tipo.numero} cor={corNumero} />
        </span>
        {rotulo([palavrasDoRotulo], tipo.rotulo, "left")}
      </div>
    );
  }

  // as outras: à esquerda da parede, alinhadas à direita (encostadas no funil)
  const topo = geo.y[k] + 48;
  const direita = paredeEsquerda(h, topo) - 24;
  const disponivel = direita - 36;
  const umaLinha = larguraTexto(texto, tipo.rotulo) <= disponivel;
  const linhas = umaLinha ? [palavrasDoRotulo] : quebrar(palavrasDoRotulo);
  const tamanho = umaLinha ? tipo.rotulo : tipo.rotuloDuasLinhas;
  return (
    <div
      style={{
        position: "absolute",
        right: 1080 - direita,
        top: topo,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 6,
        opacity: entrada,
        translate: `${(1 - entrada) * -16}px 0`,
      }}
    >
      <span style={{ scale: String(1 + 0.06 * Math.sin(Math.PI * acende)), transformOrigin: "right center" }}>
        <Numero texto={numero} tamanho={tipo.numero} cor={corNumero} />
      </span>
      {rotulo(linhas, tamanho, "right")}
    </div>
  );
};

// Etapa sem número: o que as pessoas fazem, em grafite forte, com o mesmo traço de entrada.
// A primeira etapa fica acima da boca, numa linha; as outras, à esquerda da parede (até 3 linhas).
const RotuloSemNumero: React.FC<{ h: Historia; k: number; t: number; palavras: Palavra[]; entrada: number }> = ({ h, k, t, palavras, entrada }) => {
  const { geo, funil } = h;
  const e = funil.etapas[k];
  const proxima = funil.etapas[k + 1]?.em ?? funil.ate;
  const ativa = etapaAtiva(h, k, t);
  const acende = prog(t, e.em - 0.02, 0.3);
  const tempos = temposDoTexto(e.texto, palavras, e.em - 0.15, proxima, e.em - 0.05);
  const corTexto = ativa ? cor.grafite : cor.lapis;
  const linhasDe = (linhas: string[][], tamanho: number, alinhar: "left" | "right") => (
    <div style={{ fontSize: tamanho, fontWeight: 800, lineHeight: 1.04, letterSpacing: "-0.015em", color: corTexto, textAlign: alinhar }}>
      {linhas.map((l, i) => (
        <Palavras
          key={i}
          palavras={l}
          tempos={tempos}
          base={linhas.slice(0, i).reduce((s, x) => s + x.length, 0)}
          t={t}
          fantasma={0.3}
          alinhar={alinhar}
          style={{ whiteSpace: "nowrap", flexWrap: "nowrap" }}
          corDe={() => cor.grafite}
        />
      ))}
    </div>
  );
  if (k === 0) {
    const esquerda = Math.max(36, geo.centro - geo.largura0[0] / 2);
    const { tamanho, linhas } = caber(e.texto, 1080 - esquerda - 36, 64, 44, 1);
    return (
      <div
        style={{
          position: "absolute",
          left: esquerda,
          top: geo.y[0] - 40 - tamanho * 1.1,
          opacity: entrada,
          translate: `0 ${(1 - entrada) * 16}px`,
          scale: String(1 + 0.04 * Math.sin(Math.PI * acende)),
          transformOrigin: "left bottom",
        }}
      >
        {linhasDe(linhas, tamanho, "left")}
      </div>
    );
  }
  const topo = geo.y[k] + 44;
  const direita = paredeEsquerda(h, topo) - 24;
  const disponivel = Math.max(200, direita - 36);
  const alturaEtapa = geo.y[k + 1] - geo.y[k];
  const { tamanho, linhas } = caber(e.texto, disponivel, 52, 38, alturaEtapa > 230 ? 3 : 2);
  return (
    <div
      style={{
        position: "absolute",
        right: 1080 - direita,
        top: topo,
        opacity: entrada,
        translate: `${(1 - entrada) * -16}px 0`,
        scale: String(1 + 0.04 * Math.sin(Math.PI * acende)),
        transformOrigin: "right top",
      }}
    >
      {linhasDe(linhas, tamanho, "right")}
    </div>
  );
};

// quebra um rótulo em duas linhas equilibradas
const quebrar = (ws: string[]) => {
  let melhor = 1;
  let diferenca = Infinity;
  for (let i = 1; i < ws.length; i++) {
    const a = ws.slice(0, i).join(" ").length;
    const b = ws.slice(i).join(" ").length;
    if (Math.abs(a - b) < diferenca) {
      diferenca = Math.abs(a - b);
      melhor = i;
    }
  }
  return ws.length < 2 ? [ws] : [ws.slice(0, melhor), ws.slice(melhor)];
};

// ——— o selo da taxa, na divisa entre duas etapas (do lado de fora da parede) ———

// O texto do selo: o nome do passo (em alerta), o nome do conserto (consertado) e a taxa — só
// quando ela vem de números ditos. Sem números, o selo é só a seta (ou o nome, no alerta/conserto).
const rotuloDoSelo = (h: Historia, k: number, t: number) => {
  const e = h.funil.etapas[k];
  const { alerta, consertado } = estadoDoPasso(h, k, t);
  const conserto = consertado !== undefined ? [...h.consertos].reverse().find((c) => c.etapa === k && t >= c.em) : undefined;
  const nome = conserto ? (conserto.texto ?? e.passo) : alerta !== undefined ? e.passo : undefined;
  const comTaxa = h.mostraTaxa[k] && !(conserto?.ilustrativo ?? false);
  const partes = [nome ? nome.toUpperCase() : "", comTaxa ? porcento(taxaNoTempo(h, k, t)) : ""].filter(Boolean);
  return partes.join("  ");
};

// largura do selo para um rótulo num corpo (ícone + respiros + texto em caixa-alta)
const larguraNoCorpo = (rotulo: string, tamanho: number) =>
  Math.max(larguraTexto(rotulo, tamanho, LARGURA.caixaAlta * 0.94), medir(rotulo, tamanho) + rotulo.length * tamanho * 0.01) + 34 + 40;

// Selo com taxa (números ditos) pode avançar um pouco sobre a parede, como no exemplo; selo só com
// nome (sem números) diminui o corpo (até 30 px) para caber do lado de fora do funil.
const corpoDoSelo = (h: Historia, k: number, rotulo: string) => {
  const parede = h.geo.centro - h.geo.largura0[k] / 2;
  const comTaxa = /%/.test(rotulo);
  const limite = (comTaxa ? parede + 40 : parede - 10) - 36;
  let tamanho = tipo.chip;
  while (tamanho > 30 && larguraNoCorpo(rotulo, tamanho) > limite) tamanho -= 2;
  return tamanho;
};

export const larguraDoSelo = (h: Historia, k: number, t: number) => {
  const rotulo = rotuloDoSelo(h, k, t);
  if (!rotulo) return 58;
  return larguraNoCorpo(rotulo, corpoDoSelo(h, k, rotulo));
};

const Selo: React.FC<{ h: Historia; k: number; t: number; larguras: number[]; entrada: number }> = ({ h, k, t, larguras, entrada }) => {
  const e = h.funil.etapas[k];
  const y = h.geo.y[k];
  const surge = prog(t, e.em + 0.2, 0.4);
  const { alerta, consertado } = estadoDoPasso(h, k, t);
  const bate = alerta !== undefined ? pulso(t, alerta, 0.56) : 0;
  const primeiras = alerta !== undefined && t - alerta < 1.7 ? bate : bate * 0.35;
  const virou = consertado !== undefined ? prog(t, consertado, 0.3) : alerta !== undefined ? prog(t, alerta, 0.2) : 0;
  const fundo = consertado !== undefined ? cor.conserto : alerta !== undefined ? cor.alerta : cor.branco;
  const borda = consertado !== undefined ? cor.conserto : alerta !== undefined ? cor.alerta : cor.grafite;
  const texto = consertado !== undefined || alerta !== undefined ? cor.branco : cor.grafite;
  const icone = consertado !== undefined ? "check" : alerta !== undefined ? "alerta" : "seta";
  const rotulo = rotuloDoSelo(h, k, t);
  const largura = larguraDoSelo(h, k, t);
  const corpo = rotulo ? corpoDoSelo(h, k, rotulo) : tipo.chip;
  // encostado na parede, do lado de fora; se não couber até a margem, entra um pouco no funil
  const direita = Math.max(36 + largura, h.geo.centro - larguras[k] / 2 - 16);
  return (
    <div style={{ position: "absolute", left: direita - largura, top: y - 29, opacity: entrada }}>
      {/* esboço: um círculo tracejado com a seta, até o passo acontecer */}
      <div
        style={{
          position: "absolute",
          left: largura - 54,
          top: 2,
          width: 54,
          height: 54,
          borderRadius: 27,
          border: `2.5px dashed ${cor.lapis}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 1 - surge,
        }}
      >
        <Icone nome="seta" tamanho={28} cor={cor.lapis} />
      </div>
      <div
        style={{
          width: largura,
          height: 58,
          borderRadius: 29,
          background: fundo,
          border: `2.5px solid ${borda}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          fontSize: corpo,
          fontWeight: 800,
          color: texto,
          opacity: surge,
          transformOrigin: "right center",
          scale: String(mistura(0.7, 1, surge) * (1 + 0.08 * primeiras) * (1 + 0.08 * Math.sin(Math.PI * virou))),
          boxShadow: alerta !== undefined ? `0 0 0 ${5 + 9 * bate}px rgba(255,90,31,${0.24 * bate})` : undefined,
          whiteSpace: "nowrap",
        }}
      >
        <Icone nome={icone} tamanho={30} cor={texto} traco={2.8} />
        {rotulo ? <span style={{ letterSpacing: "0.01em" }}>{rotulo}</span> : null}
      </div>
    </div>
  );
};

// ——— o caminho: um traço laranja pela parede direita (ex.: do clique à compra) ———

const Caminho: React.FC<{ h: Historia; m: Conserto; palavras: Palavra[]; t: number; larguras: number[] }> = ({ h, m, palavras, t, larguras }) => {
  const c = m.caminho as NonNullable<Conserto["caminho"]>;
  const { geo } = h;
  const de = Math.max(0, Math.min(geo.n - 1, c.de));
  const ate = Math.max(de, Math.min(geo.n - 1, c.ate));
  const ateEm = c.ateEm ?? c.em + 1.2;
  const p = prog(t, c.em, Math.max(0.3, ateEm - c.em), troca);
  const fim = Math.min(m.ate, ...(m.consertos ?? []).map((q) => q.em - 0.15));
  const some = saindo(t, fim, 0.3);
  const surge = prog(t, c.em - 0.08, 0.25);
  if (surge <= 0 || some >= 1) return null;
  const afastado = 22;
  const pontos: [number, number][] = [];
  for (let k = de; k <= ate + 1; k++) {
    const y = k === ate + 1 ? geo.y[k] - 8 : k === de ? geo.y[k] + 8 : geo.y[k];
    pontos.push([geo.centro + larguraNaAltura(geo, larguras, y) / 2 + afastado, y]);
  }
  const d = `M ${pontos[0][0] - 16} ${pontos[0][1]} L ${pontos.map(([x, y]) => `${x} ${y}`).join(" L ")} L ${pontos[pontos.length - 1][0] - 16} ${pontos[pontos.length - 1][1]}`;
  const texto = c.texto ?? "o caminho";
  const ws = texto.split(/\s+/).filter(Boolean);
  const tempos = temposDoTexto(texto, palavras, c.em - 0.3, ateEm, c.em - 0.2);
  // o texto fica ao lado do traço, no primeiro ponto (de cima para baixo) em que cabe na tela
  const larguraTextoCaminho = larguraTexto(texto, 48, LARGURA.negrito);
  let yTexto = pontos[0][1] + 4;
  let xTexto = pontos[0][0] + 22;
  for (let y = pontos[0][1] + 4; y < pontos[pontos.length - 1][1] - 60; y += 10) {
    const x = geo.centro + larguraNaAltura(geo, larguras, y) / 2 + afastado + 22;
    yTexto = y;
    xTexto = x;
    if (x + larguraTextoCaminho <= 1080 - 36) break;
  }
  xTexto = Math.min(xTexto, 1080 - 36 - larguraTextoCaminho);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: surge * (1 - some) }}>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <Traco d={d} p={p} cor={cor.alerta} largura={6} />
      </svg>
      <div style={{ position: "absolute", left: xTexto, top: yTexto, fontSize: 48, fontWeight: 800, color: cor.grafite, lineHeight: 1 }}>
        <Palavras palavras={ws} tempos={tempos} t={t} fantasma={0.25} style={{ flexWrap: "nowrap", whiteSpace: "nowrap" }} />
      </div>
    </div>
  );
};

// ——— o botão que fica para depois (ex.: "+ R$ em tráfego") ———

const Depois: React.FC<{ h: Historia; m: Conserto; t: number; larguras: number[] }> = ({ h, m, t, larguras }) => {
  const d = m.depois as NonNullable<Conserto["depois"]>;
  const surge = prog(t, d.em - 0.05, 0.4);
  const carimboEm = d.carimboEm ?? d.em + 0.8;
  const espera = prog(t, carimboEm, 0.3);
  if (surge <= 0) return null;
  const largura = larguraTexto(d.texto, tipo.chip, 0.56) + 44;
  const direita = 36;
  const topo = 132;
  const alvoX = h.geo.centro + larguras[0] / 2 - 6;
  const alvoY = h.geo.y[0] - 14;
  const deX = 1080 - direita - largura * 0.5;
  const deY = topo + 62;
  const carimbo = (d.carimbo ?? "depois").toUpperCase();
  return (
    <div style={{ position: "absolute", inset: 0, opacity: surge }}>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <path
          d={`M ${deX} ${deY} C ${deX} ${deY + 50}, ${alvoX + 60} ${alvoY - 30}, ${alvoX} ${alvoY}`}
          fill="none"
          stroke={cor.grafite}
          strokeOpacity={mistura(0.8, 0.35, espera)}
          strokeWidth={3}
          strokeDasharray="8 9"
          strokeLinecap="round"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          right: direita,
          top: topo + (1 - surge) * -20,
          height: 60,
          padding: "0 22px",
          borderRadius: 30,
          border: `2.5px ${espera > 0.5 ? "dashed" : "solid"} ${cor.grafite}`,
          background: espera > 0.5 ? "transparent" : cor.branco,
          color: espera > 0.5 ? cor.grafiteSuave : cor.grafite,
          display: "flex",
          alignItems: "center",
          fontSize: tipo.chip,
          fontWeight: 800,
          whiteSpace: "nowrap",
        }}
      >
        {d.texto}
      </div>
      {/* o carimbo: pausa, fica para depois */}
      <div
        style={{
          position: "absolute",
          right: direita + 6,
          top: topo + 74,
          height: 52,
          padding: "0 18px 0 14px",
          borderRadius: 26,
          background: cor.grafite,
          color: cor.branco,
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: tipo.tag + 2,
          fontWeight: 800,
          letterSpacing: "0.12em",
          opacity: espera,
          translate: `0 ${(1 - espera) * -14}px`,
          whiteSpace: "nowrap",
        }}
      >
        <Icone nome="pausa" tamanho={26} cor={cor.branco} traco={3.2} />
        {carimbo}
      </div>
    </div>
  );
};

// ——— a etiqueta no alto ("EXEMPLO", "ILUSTRATIVO"), com o que cada ponto vale ———

const Etiqueta: React.FC<{ h: Historia; palavras: Palavra[]; t: number }> = ({ h, palavras, t }) => {
  const { funil } = h;
  const nota = notaDaUnidade(h);
  const rotulo = funil.rotulo?.trim() || (h.ilustrativo ? "Ilustrativo" : undefined);
  if (!rotulo && !nota) return null;
  const em = funil.rotuloEm ?? quandoDiz(funil.rotulo, palavras, funil.de - 0.3, funil.etapas[0]?.em ?? funil.ate) ?? funil.de + 0.25;
  const p = prog(t, em - 0.05, 0.4);
  const pNota = prog(t, funil.de + 0.2, 0.4);
  return (
    <div style={{ position: "absolute", left: 36, top: 136, display: "flex", alignItems: "center", gap: 18 }}>
      {rotulo ? (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            height: 56,
            padding: "0 22px 0 18px",
            borderRadius: 28,
            border: `2.5px solid ${cor.grafite}`,
            color: cor.grafite,
            fontSize: tipo.tag,
            fontWeight: 800,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            opacity: p,
            translate: `${(1 - p) * -20}px 0`,
            whiteSpace: "nowrap",
          }}
        >
          <svg width={14} height={14}>
            <circle cx={7} cy={7} r={6} fill={cor.grafite} />
          </svg>
          {rotulo}
        </div>
      ) : null}
      {nota ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 34, fontWeight: 600, color: cor.grafiteSuave, opacity: pNota, whiteSpace: "nowrap" }}>
          <svg width={26} height={26}>
            <circle cx={13} cy={13} r={9} fill={cor.grafite} />
          </svg>
          = {nota}
        </div>
      ) : null}
    </div>
  );
};
