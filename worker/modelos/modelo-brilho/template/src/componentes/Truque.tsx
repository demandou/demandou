// O passo numerado: cartão que sobe de baixo (quadro cheio / perto) ou painel creme ao lado da
// pessoa (layout "lado"). O número entra quando é dito, o nome do produto entra com a amostra
// e cada dica entra quando é dita. No painel, linhas-guia ligam a marca do rosto à dica.
import { limitar, mistura, misturarCor, Palavras, prog, saindo, temposDoTexto, Traco, vaiVem } from "../anim";
import type { Caixa } from "../motor/caixa";
import type { Lado, Palavra, Plano, Truque as TTruque } from "../plano";
import type { Regiao } from "../layout";
import type { RostoNaTela } from "../rosto";
import { encaixar, larguraTexto } from "../medida";
import { baseDoCartao, caber, cor, corDoProduto, fonte, quebrar, rotulo } from "../tema";
import { Gode, Passada } from "./Amostra";
import { Icone } from "./Icones";
import { ancoraDaMarca, ladoDaMarca } from "./Marcas";

const iconeDaDica = (i: number, m: TTruque) => m.dicas[i].icone ?? (i === m.dicas.length - 1 ? "check" : "pincel");
const numeroComZero = (n?: number) => (n === undefined ? "" : String(n).padStart(2, "0"));
const brilhante = (m: TTruque) => /ilumin|brilh|glow|glitter|gloss/i.test(`${m.produto} ${m.cor ?? ""}`);
// Rótulo em caixa alta que sempre cabe numa linha: aperta o espaçamento (0,2 → 0,06 em) e, só se
// ainda faltar, desce o corpo
const estiloDoRotulo = (texto: string, largura: number): React.CSSProperties => {
  for (const esp of [0.2, 0.16, 0.12, 0.08, 0.06]) {
    if (larguraTexto(texto, 30, { peso: 700, caixaAlta: true, espacamento: esp }) <= largura) return { ...rotulo, letterSpacing: `${esp}em` };
  }
  let tam = 30;
  while (tam > 22 && larguraTexto(texto, tam, { peso: 700, caixaAlta: true, espacamento: 0.06 }) > largura) tam--;
  return { ...rotulo, fontSize: tam, letterSpacing: "0.06em", whiteSpace: "nowrap" };
};

// o rótulo em caixa alta: "Truque 2 de 3", "Passo 1 de 4", "Erro" (o plano escolhe a palavra; "" esconde)
const textoDoRotulo = (m: TTruque, total: number) => {
  const palavra = m.rotulo ?? (m.numero !== undefined ? "Passo" : "");
  if (!palavra) return "";
  return m.numero !== undefined && total > 1 ? `${palavra} ${m.numero} de ${total}` : palavra;
};

// ---------- cartão (sobe de baixo) ----------

// Texto das dicas em semibold (a Quicksand fina fica fraca no celular): largura média maior
const FATOR_SEMIBOLD = 0.56;
const CARTAO = { x: 40, w: 1000, pad: 44, cabecalho: 158, linha: 60, fonteDica: 48 };

// Nome do produto: entra "a lápis" com o cartão e ganha a cor da tinta quando é dito
const Produto: React.FC<{ texto: string; t: number; entra: number; em: number; tamanho: number; linhas?: string[]; style?: React.CSSProperties }> = ({
  texto,
  t,
  entra,
  em,
  tamanho,
  linhas,
  style,
}) => {
  const p = prog(t, entra, 0.5);
  const tinta = prog(t, em - 0.04, 0.35);
  const lista = linhas ?? [texto];
  return (
    <div style={{ overflow: p >= 0.999 ? "visible" : "hidden", paddingBottom: 10, ...style }}>
      <div
        style={{
          fontWeight: 600,
          fontSize: tamanho,
          lineHeight: 1.05,
          letterSpacing: "-0.01em",
          color: misturarCor(cor.lapis, cor.tinta, tinta),
          translate: p >= 0.999 ? undefined : `0 ${(1 - p) * 110}%`,
        }}
      >
        {lista.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
};

// Nome do passo medido: uma linha no tamanho cheio; nome longo quebra em até 2 (cartão) ou 3 (painel)
// linhas antes de ficar pequeno demais
const medirProduto = (texto: string, largura: number, max: number, linhas: number) => {
  const umaLinha = caber(texto, largura, max, FATOR_SEMIBOLD);
  if (umaLinha >= Math.min(max, 76)) return { tamanho: umaLinha, linhas: [texto] };
  return encaixar(texto, { largura, max: Math.min(max, 88), min: 52, linhas, fonte: { peso: 600 } });
};

export const CartaoTruque: React.FC<{ m: TTruque; t: number; fim: number; palavras: Palavra[]; total: number; limiteTopo?: number }> = ({
  m,
  t,
  fim,
  palavras,
  total,
  limiteTopo = 0,
}) => {
  const inicio = Math.max(0, m.de);
  const entra = prog(t, inicio + 0.02, 0.55);
  const sai = saindo(t, fim, 0.35);
  if (entra <= 0 || sai >= 1) return null;
  const c = corDoProduto(m.cor);
  const interna = CARTAO.w - 2 * CARTAO.pad;
  const larguraTexto = interna - 72;
  const temNumero = m.numero !== undefined;
  const xTexto = temNumero ? 196 : 0;
  const nomeDoPasso = medirProduto(m.produto, interna - xTexto - 170, 88, 2);
  const tamanhoProduto = nomeDoPasso.tamanho;
  const cabecalho = Math.max(CARTAO.cabecalho, 10 + 42 + nomeDoPasso.linhas.length * tamanhoProduto * 1.05 + 14);
  // dicas: o corpo cheio (48) e, se o cartão passar do queixo, menor (até 40)
  const maximo = baseDoCartao(m) - limiteTopo;
  let fonteDica = CARTAO.fonteDica;
  let linha = CARTAO.linha;
  let blocos = m.dicas.map((d) => quebrar(d.texto, larguraTexto, fonteDica, FATOR_SEMIBOLD));
  const alturaCheia = (b: string[][], l: number) => CARTAO.pad + cabecalho + 30 + b.reduce((s, x) => s + x.length * l + 14, 0) + CARTAO.pad * 0.7;
  while (alturaCheia(blocos, linha) > maximo && fonteDica > 40) {
    fonteDica -= 4;
    linha = Math.round(fonteDica * 1.25);
    blocos = m.dicas.map((d) => quebrar(d.texto, larguraTexto, fonteDica, FATOR_SEMIBOLD));
  }
  const alturas = blocos.map((b) => b.length * linha + 14);
  const aparece = m.dicas.map((d) => prog(t, d.em - 0.12, 0.45, vaiVem));
  const alturaDicas = alturas.reduce((s, h, i) => s + h * aparece[i], 0);
  const h = CARTAO.pad + cabecalho + (alturaDicas > 0 ? 30 * Math.min(1, aparece[0] * 2) : 0) + alturaDicas + CARTAO.pad * 0.7;
  const y = baseDoCartao(m) - h;
  const desloc = (1 - entra) * (h + 140) + sai * (h + 140);
  const produtoEm = m.produtoEm ?? inicio + 0.3;
  const atual = m.dicas.reduce((k, d, i) => (t >= d.em - 0.1 ? i : k), -1);
  const pNum = prog(t, inicio + 0.08, 0.55);
  const textoRotulo = textoDoRotulo(m, total);
  let cursor = 0;

  return (
    <div
      style={{
        position: "absolute",
        left: CARTAO.x,
        top: y + desloc,
        width: CARTAO.w,
        height: h,
        background: cor.creme,
        borderRadius: 48,
        boxShadow: "0 18px 50px rgba(30,14,22,0.28)",
        overflow: "hidden",
        fontFamily: fonte,
        color: cor.tinta,
      }}
    >
      {temNumero ? (
        <>
          <div style={{ position: "absolute", left: CARTAO.pad - 8, top: CARTAO.pad - 12, height: 164, overflow: "hidden" }}>
            <div style={{ fontSize: 160, fontWeight: 400, lineHeight: 1, letterSpacing: "-0.05em", color: cor.berry, translate: `0 ${(1 - pNum) * 100}%` }}>
              {numeroComZero(m.numero)}
            </div>
          </div>
          <svg width={4} height={132} style={{ position: "absolute", left: CARTAO.pad + 170, top: CARTAO.pad + 12 }}>
            <Traco d="M2,2 L2,130" p={prog(t, inicio + 0.2, 0.5, vaiVem)} cor={cor.cremeEscuro} largura={3} />
          </svg>
        </>
      ) : null}
      <div style={{ position: "absolute", left: CARTAO.pad + xTexto, top: CARTAO.pad + 10, right: CARTAO.pad + 160 }}>
        {textoRotulo ? (
          <div style={{ ...estiloDoRotulo(textoRotulo, interna - xTexto - 170), color: cor.berry, opacity: prog(t, inicio + 0.06, 0.4) }}>{textoRotulo}</div>
        ) : null}
        <Produto texto={m.produto} linhas={nomeDoPasso.linhas} t={t} entra={inicio + 0.1} em={produtoEm} tamanho={tamanhoProduto} style={{ marginTop: textoRotulo ? 12 : 0 }} />
      </div>
      <div style={{ position: "absolute", right: CARTAO.pad, top: CARTAO.pad + 2, width: 144, height: 144 }}>
        <Gode cor={c} t={t} em={produtoEm} tamanho={144} id={`gode-${m.de}`} rascunho={inicio + 0.12} />
      </div>
      {alturaDicas > 0 ? (
        <svg width={interna} height={4} style={{ position: "absolute", left: CARTAO.pad, top: CARTAO.pad + cabecalho + 6 }}>
          <Traco d={`M2,2 L${interna - 2},2`} p={prog(t, m.dicas[0].em - 0.15, 0.6, vaiVem)} cor={cor.cremeEscuro} largura={2.5} />
        </svg>
      ) : null}
      {m.dicas.map((d, i) => {
        const topo = CARTAO.pad + cabecalho + 34 + cursor;
        cursor += alturas[i] * aparece[i];
        if (aparece[i] <= 0) return null;
        const tempos = temposDoTexto(d.texto, palavras, d.em - 0.2, (m.dicas[i + 1]?.em ?? m.ate) + 0.2, d.em);
        let k = 0;
        const antiga = i < atual;
        return (
          <div key={i} style={{ position: "absolute", left: CARTAO.pad, top: topo, width: interna, opacity: antiga ? 0.55 : 1 }}>
            <div style={{ position: "absolute", left: 0, top: 8 }}>
              <Icone nome={iconeDaDica(i, m)} p={prog(t, d.em, 0.6)} tamanho={fonteDica} cor={cor.berry} largura={8} />
            </div>
            {blocos[i].map((linha, j) => {
              const n = linha.split(/\s+/).length;
              const fatia = tempos.slice(k, k + n);
              k += n;
              return (
                <Palavras
                  key={j}
                  texto={linha}
                  tempos={fatia}
                  t={t}
                  style={{ marginLeft: 72, fontSize: fonteDica, fontWeight: 600, lineHeight: `${linha}px`, height: linha }}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// ---------- painel (layout "lado") ----------

export const PAINEL = {
  pad: 40,
  costura: 40,
  topoRotulo: 92,
  numero: 300,
  topoProduto: 418,
  topoAmostra: 552,
  alturaAmostra: 156,
  topoDicas: 768,
  baseDicas: 1452,
  // ícone numa linha e o texto embaixo, na largura toda do painel
  icone: 60,
  fonteDica: 54,
  linha: 64,
  topoProgresso: 1494,
};

// Geometria do painel (a mesma para desenhar e para ligar as marcas às dicas). Com número: rótulo,
// "02" grande, nome, amostra, dicas (as medidas do demo). Sem número, tudo sobe. Nome longo quebra
// em linhas; dicas longas encolhem (54 → 44) até caberem acima da base.
export const layoutDoPainel = (m: TTruque, regiao: Regiao, lado: Lado) => {
  // lado = onde está a PESSOA; o conteúdo encosta na costura (do lado da pessoa)
  const noLadoDireito = lado === "esquerda";
  const interna = regiao.w - PAINEL.pad - PAINEL.costura;
  const x0 = noLadoDireito ? regiao.x + PAINEL.costura : regiao.x + PAINEL.pad;
  const temNumero = m.numero !== undefined;
  const temRotulo = !!(m.rotulo ?? (temNumero ? "Passo" : ""));
  const nome = medirProduto(m.produto, interna, 110, 3);
  const extra = (nome.linhas.length - 1) * nome.tamanho * 1.05;
  const topoProduto = temNumero ? PAINEL.topoProduto : PAINEL.topoRotulo + (temRotulo ? 70 : 0);
  const topoAmostra = topoProduto + (PAINEL.topoAmostra - PAINEL.topoProduto) + extra;
  const topoDicas = topoAmostra + (PAINEL.topoDicas - PAINEL.topoAmostra);
  let fonteDica = PAINEL.fonteDica;
  let linha = PAINEL.linha;
  const medirDicas = () => {
    const blocos = m.dicas.map((d) => quebrar(d.texto, interna, fonteDica, FATOR_SEMIBOLD));
    const alturas = blocos.map((b) => PAINEL.icone + 12 + b.length * linha);
    return { blocos, alturas, soma: alturas.reduce((s, h) => s + h, 0) };
  };
  let med = medirDicas();
  const n = Math.max(1, m.dicas.length);
  while (med.soma + (n - 1) * 36 > PAINEL.baseDicas - topoDicas && fonteDica > 44) {
    fonteDica -= 2;
    linha = Math.round(fonteDica * 1.19);
    med = medirDicas();
  }
  // as dicas se espalham pela altura livre, a última encostando na base (o painel fica cheio até embaixo)
  const intervalo = n === 1 ? 0 : Math.max(36, Math.min(260, (PAINEL.baseDicas - topoDicas - med.soma) / (n - 1)));
  let y = topoDicas;
  const dicas = med.blocos.map((linhas, i) => {
    const bloco = { y, linhas, altura: med.alturas[i] };
    y += bloco.altura + intervalo;
    // centro do ícone, do lado da costura
    const icone = { x: noLadoDireito ? x0 + PAINEL.icone / 2 : x0 + interna - PAINEL.icone / 2, y: bloco.y + PAINEL.icone / 2 };
    return { ...bloco, icone };
  });
  return { x0, interna, noLadoDireito, dicas, nome, topoProduto, topoAmostra, fonteDica, linha };
};

const deslocamento = (regiao: Regiao, regiaoFinal: Regiao, direito: boolean) =>
  direito ? regiao.x - regiaoFinal.x : regiao.x + regiao.w - (regiaoFinal.x + regiaoFinal.w);

export const PainelTruque: React.FC<{
  m: TTruque;
  t: number;
  fim: number;
  palavras: Palavra[];
  regiao: Regiao;
  regiaoFinal: Regiao;
  lado: Lado;
  total: number;
}> = ({ m, t, fim, palavras, regiao, regiaoFinal, lado, total }) => {
  const inicio = Math.max(0, m.de);
  const g = layoutDoPainel(m, regiaoFinal, lado);
  // o conteúdo acompanha a borda da pessoa enquanto ela desliza
  const desloc = deslocamento(regiao, regiaoFinal, g.noLadoDireito);
  // na troca, a borda da pessoa empurra o painel para fora da tela (o que sai cruza com o que entra)
  const some = saindo(t, fim + 0.75, 0.15);
  if (some >= 1) return null;
  const c = corDoProduto(m.cor);
  const alinhar: React.CSSProperties = { textAlign: g.noLadoDireito ? "left" : "right" };
  const produtoEm = m.produtoEm ?? inicio + 0.35;
  const tamanhoProduto = g.nome.tamanho;
  const atual = m.dicas.reduce((k, d, i) => (t >= d.em - 0.1 ? i : k), -1);
  const pNum = prog(t, inicio + 0.12, 0.6);
  const textoRotulo = textoDoRotulo(m, total);

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, translate: `${desloc}px 0`, opacity: 1 - some, fontFamily: fonte, color: cor.tinta }}>
      <div style={{ position: "absolute", left: g.x0, top: PAINEL.topoRotulo, width: g.interna, ...alinhar }}>
        {textoRotulo ? <div style={{ ...estiloDoRotulo(textoRotulo, g.interna), color: cor.berry, opacity: prog(t, inicio + 0.05, 0.4) }}>{textoRotulo}</div> : null}
        {m.numero !== undefined ? (
          <div style={{ overflow: "hidden", height: PAINEL.numero * 0.9, marginTop: 4 }}>
            <div
              style={{
                fontWeight: 300,
                fontSize: PAINEL.numero,
                lineHeight: 0.9,
                color: cor.berry,
                letterSpacing: "-0.05em",
                marginLeft: g.noLadoDireito ? -14 : 0,
                translate: `0 ${(1 - pNum) * 100}%`,
              }}
            >
              {numeroComZero(m.numero)}
            </div>
          </div>
        ) : null}
      </div>
      <Produto
        texto={m.produto}
        linhas={g.nome.linhas}
        t={t}
        entra={inicio + (m.numero === undefined ? 0.1 : 0.3)}
        em={produtoEm}
        tamanho={tamanhoProduto}
        style={{ position: "absolute", left: g.x0, top: g.topoProduto, width: g.interna, ...alinhar }}
      />
      <div style={{ position: "absolute", left: g.x0, top: g.topoAmostra, width: g.interna, height: PAINEL.alturaAmostra }}>
        <Passada
          cor={c}
          t={t}
          em={produtoEm + 0.1}
          largura={g.interna}
          altura={PAINEL.alturaAmostra}
          id={`passada-${m.de}`}
          espelhar={!g.noLadoDireito}
          brilho={brilhante(m)}
          rascunho={inicio + (m.numero === undefined ? 0.15 : 0.4)}
        />
      </div>
      {m.dicas.map((d, i) => {
        const b = g.dicas[i];
        const p = prog(t, d.em - 0.1, 0.45);
        if (p <= 0) return null;
        const tempos = temposDoTexto(d.texto, palavras, d.em - 0.2, (m.dicas[i + 1]?.em ?? m.ate) + 0.2, d.em);
        let k = 0;
        const antiga = i < atual;
        return (
          <div key={i} style={{ position: "absolute", left: g.x0, top: b.y, width: g.interna, opacity: antiga ? 0.55 : 1 }}>
            <div
              style={{
                marginLeft: g.noLadoDireito ? 0 : g.interna - PAINEL.icone,
                width: PAINEL.icone,
                height: PAINEL.icone,
                borderRadius: "50%",
                background: antiga ? "transparent" : cor.berry,
                border: `3.5px solid ${cor.berry}`,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                scale: String(mistura(0.4, 1, p)),
                marginBottom: 12,
              }}
            >
              <Icone nome={iconeDaDica(i, m)} p={prog(t, d.em + 0.05, 0.5)} tamanho={32} cor={antiga ? cor.berry : cor.creme} largura={10} />
            </div>
            {b.linhas.map((linha, j) => {
              const n = linha.split(/\s+/).length;
              const fatia = tempos.slice(k, k + n);
              k += n;
              return (
                <Palavras
                  key={j}
                  texto={linha}
                  tempos={fatia}
                  t={t}
                  style={{
                    justifyContent: g.noLadoDireito ? "flex-start" : "flex-end",
                    fontSize: g.fonteDica,
                    fontWeight: 600,
                    lineHeight: `${g.linha}px`,
                    height: g.linha,
                  }}
                />
              );
            })}
          </div>
        );
      })}
      {total > 1 && m.numero !== undefined && !m.legenda ? (
        <div
          style={{
            position: "absolute",
            left: g.x0,
            top: PAINEL.topoProgresso,
            width: g.interna,
            display: "flex",
            gap: 16,
            justifyContent: g.noLadoDireito ? "flex-start" : "flex-end",
            opacity: prog(t, inicio + 0.3, 0.5),
          }}
        >
          {Array.from({ length: total }, (_, i) => {
            const ativo = i + 1 === m.numero;
            const w = ativo ? mistura(28, 92, prog(t, inicio + 0.3, 0.6, vaiVem)) : 28;
            return (
              <div
                key={i}
                style={{
                  height: 28,
                  width: w,
                  borderRadius: 14,
                  background: i + 1 <= (m.numero ?? 0) ? cor.berry : "transparent",
                  border: `3.5px solid ${cor.berry}`,
                  boxSizing: "border-box",
                  opacity: ativo ? 1 : 0.5,
                }}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

// ---------- linhas-guia: da marca no rosto até a dica no painel ----------
// A linha é creme por cima do vídeo e vira berry ao cruzar para o painel.
export const Ligacoes: React.FC<{
  m: TTruque;
  t: number;
  fim: number;
  rosto: RostoNaTela;
  plano: Plano;
  caixa: Caixa;
  regiao: Regiao;
  regiaoFinal: Regiao;
  lado: Lado;
  id: string;
}> = ({ m, t, fim, rosto, plano, caixa, regiao, regiaoFinal, lado, id }) => {
  const g = layoutDoPainel(m, regiaoFinal, lado);
  const desloc = deslocamento(regiao, regiaoFinal, g.noLadoDireito);
  const op = 1 - saindo(t, fim, 0.3);
  if (op <= 0) return null;
  const preferido: 1 | -1 = g.noLadoDireito ? 1 : -1;
  const linhas = m.dicas
    .map((d, i) => ({ d, i }))
    .filter(({ d }) => d.liga !== undefined && (m.marcas ?? [])[d.liga])
    .map(({ d, i }) => {
      const marca = (m.marcas ?? [])[d.liga as number];
      const s = ladoDaMarca(marca, preferido);
      const a = ancoraDaMarca(marca, s, rosto, plano, t);
      const alvo = { x: g.dicas[i].icone.x + desloc + (g.noLadoDireito ? -1 : 1) * (PAINEL.icone / 2 + 8), y: g.dicas[i].icone.y };
      const p = prog(t, Math.max(d.em, marca.em) + 0.2, 0.6, vaiVem);
      // curva: sai da marca na horizontal e chega na dica na horizontal
      const dx = alvo.x - a.x;
      const dPath = `M${a.x.toFixed(1)},${a.y.toFixed(1)} C${(a.x + dx * 0.55).toFixed(1)},${a.y.toFixed(1)} ${(alvo.x - dx * 0.45).toFixed(1)},${alvo.y.toFixed(1)} ${alvo.x.toFixed(1)},${alvo.y.toFixed(1)}`;
      // a linha de uma dica antiga some quando a próxima ligação entra
      const proxima = m.dicas.slice(i + 1).find((o) => o.liga !== undefined);
      const apaga = proxima ? 1 - prog(t, proxima.em + 0.2, 0.4) : 1;
      return { dPath, p, a, alvo, i, apaga };
    });
  if (!linhas.length) return null;
  const clipVideo = `${id}-v`;
  const clipPainel = `${id}-p`;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: op, pointerEvents: "none" }}>
      <defs>
        <clipPath id={clipVideo}>
          <rect x={caixa.x} y={caixa.y} width={caixa.w} height={caixa.h} />
        </clipPath>
        <clipPath id={clipPainel}>
          <rect x={regiao.x} y={regiao.y} width={regiao.w} height={regiao.h} />
        </clipPath>
      </defs>
      {linhas.map(({ dPath, p, a, alvo, i, apaga }) =>
        apaga <= 0 ? null : (
          <g key={i} opacity={apaga}>
            <g clipPath={`url(#${clipVideo})`} style={{ filter: `drop-shadow(0 1px 2.5px ${cor.sombraTraco})` }}>
              <circle cx={a.x} cy={a.y} r={10} fill="none" stroke={cor.traco} strokeWidth={3.5} opacity={limitar(p * 3)} />
              <Traco d={dPath} p={p} cor={cor.traco} largura={3.5} />
            </g>
            <g clipPath={`url(#${clipPainel})`}>
              <Traco d={dPath} p={p} cor={cor.berry} largura={3.5} />
              <circle cx={alvo.x} cy={alvo.y} r={7} fill={cor.berry} opacity={limitar((p - 0.9) * 10)} />
            </g>
          </g>
        ),
      )}
    </svg>
  );
};
