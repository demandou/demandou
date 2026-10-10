// Cartões de quadro cheio, na altura do peito: abertura (gancho), número, destaque, frase, pergunta
// e fechamento. O cartão é grafite (a cor do contorno do funil), o texto se monta palavra por palavra.
import { apuracao, indicesDoTrecho, limitar, mistura, Palavras, prog, pulso, quandoDiz, queda, saindo, temposDoTexto } from "../anim";
import type { Abertura, Cta, Destaque, Frase, Gancho, Numero, Palavra, Pergunta } from "../plano";
import { caber, cor, fonte, formatar, larguraTexto, LARGURA, medir, tipo } from "../tema";
import { Icone } from "./Icones";

type Zona = { esquerda: number; direita: number; topo: number; altura: number };

// Entrada e saída do cartão: sobe e assenta; sai descendo (cruza com o que entra).
const Cartao: React.FC<{
  zona: Zona;
  entra: number;
  sai: number;
  children: React.ReactNode;
  t: number;
  padding?: string;
}> = ({ zona, entra, sai, children, t, padding = "38px 44px 42px" }) => {
  const p = prog(t, entra, 0.42);
  const s = saindo(t, sai, 0.3);
  if (p <= 0 || s >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: zona.esquerda,
        right: zona.direita,
        top: zona.topo,
        fontFamily: fonte,
        opacity: Math.min(p * 1.6, 1) * (1 - s),
        translate: `0 ${(1 - p) * 46 + s * 40}px`,
      }}
    >
      <div
        style={{
          background: cor.grafite,
          borderRadius: 30,
          padding,
          clipPath: `inset(0 0 ${(1 - p) * 30}% 0 round 30px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Tamanho do título: o maior que cabe na largura (até o tamanho padrão)
const tamanhoQueCabe = (linhas: string[], largura: number, maximo: number) => {
  const maior = Math.max(...linhas.map((l) => l.length), 1);
  return Math.max(60, Math.min(maximo, Math.floor(largura / (maior * LARGURA.negrito))));
};

// Quebra o texto em até 3 linhas equilibradas que cabem na largura
const emLinhas = (texto: string, tamanho: number, largura: number) => {
  const ws = texto.split(/\s+/).filter(Boolean);
  const linhas: string[][] = [[]];
  for (const w of ws) {
    const atual = linhas[linhas.length - 1];
    const tentativa = [...atual, w].join(" ");
    if (atual.length && larguraTexto(tentativa, tamanho, LARGURA.negrito) > largura) linhas.push([w]);
    else atual.push(w);
  }
  return linhas;
};

const TituloFalado: React.FC<{
  texto: string;
  palavras: Palavra[];
  de: number;
  ate: number;
  t: number;
  largura: number;
  maximo?: number;
  destaque?: string;
  risco?: string;
  // trecho que ganha um sublinhado branco que se desenha quando é dito
  sublinhado?: string;
  // até este instante o texto aparece todo aceso (capa do post)
  capa?: number;
  // quando o risco começa (padrão: logo depois de o trecho riscado ser dito)
  riscoEm?: number;
  // quando o texto começa a ser dito (padrão: `de`)
  inicio?: number;
}> = ({ texto, palavras, de, ate, t, largura, maximo = tipo.titulo, destaque, risco, sublinhado, capa, riscoEm, inicio }) => {
  let tamanho = maximo;
  let linhas = emLinhas(texto, tamanho, largura);
  while (linhas.length > 3 && tamanho > 60) {
    tamanho -= 4;
    linhas = emLinhas(texto, tamanho, largura);
  }
  tamanho = Math.min(tamanho, tamanhoQueCabe(linhas.map((l) => l.join(" ")), largura, maximo));
  const comeco = inicio ?? de;
  const tempos = temposDoTexto(texto, palavras, comeco, ate, comeco - 0.1);
  const emDestaque = indicesDoTrecho(texto, destaque);
  const riscados = indicesDoTrecho(texto, risco);
  const sublinhados = indicesDoTrecho(texto, sublinhado);
  const primeiroRiscado = Math.min(Infinity, ...riscados);
  let base = 0;
  return (
    <div style={{ fontSize: tamanho, fontWeight: 800, lineHeight: 1.04, letterSpacing: "-0.015em", color: cor.branco }}>
      {linhas.map((l, i) => {
        const b = base;
        base += l.length;
        return (
          <Palavras
            key={i}
            palavras={l}
            tempos={tempos}
            base={b}
            t={t}
            fantasma={0.22}
            capa={capa}
            corDe={(k) => (emDestaque.has(k) ? cor.alerta : undefined)}
            extra={(k) => {
              const risca =
                riscados.has(k) && Number.isFinite(primeiroRiscado) ? (
                  <span
                    style={{
                      position: "absolute",
                      left: -6,
                      right: -6,
                      top: "52%",
                      height: Math.max(7, tamanho * 0.09),
                      marginTop: -Math.max(7, tamanho * 0.09) / 2,
                      borderRadius: 6,
                      background: cor.alerta,
                      transformOrigin: "left center",
                      scale: `${limitar((t - (riscoEm !== undefined ? riscoEm + 0.1 : tempos[primeiroRiscado] + 0.28) - (k - primeiroRiscado) * 0.16) / 0.28)} 1`,
                    }}
                  />
                ) : null;
              const sublinha = sublinhados.has(k) ? (
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: "-0.06em",
                    height: Math.max(6, tamanho * 0.08),
                    borderRadius: 4,
                    background: cor.branco,
                    transformOrigin: "left center",
                    scale: `${prog(t, (tempos[k] ?? de) + 0.18, 0.4)} 1`,
                  }}
                />
              ) : null;
              return (
                <>
                  {risca}
                  {sublinha}
                </>
              );
            }}
          />
        );
      })}
    </div>
  );
};

// ——— gancho ———

export const CartaoGancho: React.FC<{ m: Gancho | Abertura; palavras: Palavra[]; t: number; zona: Zona; fim: number; entra?: number }> = ({
  m,
  palavras,
  t,
  zona,
  fim,
  entra,
}) => {
  const largura = 1080 - zona.esquerda - zona.direita - 88;
  const quando = quandoDiz(m.destaque, palavras, m.em ?? m.de, m.ate) ?? m.de + (m.ate - m.de) * 0.6;
  const PONTOS = 14;
  // gancho no começo do vídeo: o primeiro quadro mostra o texto inteiro (vira a capa do post);
  // logo depois as palavras voltam ao esboço e acendem na fala
  const capa = m.de <= 0.25 ? 0.12 : undefined;
  // a fileira de pontos: no gancho, sempre (a não ser `pontos: false`); na abertura, quando há um
  // trecho em destaque (o problema) para eles caírem
  const comPontos = m.tipo === "gancho" ? m.pontos !== false : (m.pontos ?? !!m.destaque);
  return (
    <Cartao zona={zona} entra={m.de <= 0.25 ? -1 : (entra ?? m.de)} sai={fim} t={t}>
      <TituloFalado texto={m.texto} palavras={palavras} de={m.de} ate={m.ate} t={t} largura={largura} destaque={m.destaque} capa={capa} inicio={m.em} />
      {!comPontos ? null : (
        <div style={{ position: "relative", height: 34, marginTop: 26 }}>
          {Array.from({ length: PONTOS }, (_, i) => {
            const acende = capa !== undefined && t < capa ? 1 : prog(t, m.de + 0.15 + i * 0.045, 0.2);
            // quando o problema é dito, os pontos caem um a um e somem: ninguém chega à compra
            const cai = prog(t, quando + 0.08 + ((i * 7) % PONTOS) * 0.035, 0.55);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: i * 46,
                  top: 4 + cai * cai * 120,
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  background: cai > 0.02 ? cor.alerta : cor.branco,
                  opacity: acende * (1 - cai),
                }}
              />
            );
          })}
        </div>
      )}
    </Cartao>
  );
};

// ——— frase ———

export const CartaoFrase: React.FC<{ m: Frase; palavras: Palavra[]; t: number; zona: Zona; entra: number; fim: number }> = ({
  m,
  palavras,
  t,
  zona,
  entra,
  fim,
}) => {
  const largura = 1080 - zona.esquerda - zona.direita - 88;
  return (
    <Cartao zona={zona} entra={entra} sai={fim} t={t}>
      <TituloFalado
        texto={m.texto}
        palavras={palavras}
        de={m.de}
        ate={m.ate}
        t={t}
        largura={largura}
        destaque={m.destaque}
        risco={m.risco}
        riscoEm={m.riscoEm}
        inicio={m.em}
      />
    </Cartao>
  );
};

// ——— fechamento ———

export const CartaoCta: React.FC<{
  m: Cta;
  palavras: Palavra[];
  t: number;
  zona: Zona;
  entra: number;
  fim: number;
  marca: { nome: string; area: string };
}> = ({ m, palavras, t, zona, entra, fim, marca }) => {
  const largura = 1080 - zona.esquerda - zona.direita - 88;
  const icone = m.icone ?? "salvar";
  const comeco = m.em ?? m.de;
  const tempos = temposDoTexto(m.texto, palavras, comeco, m.ate, comeco - 0.1);
  const iconeP = prog(t, Math.max(entra + 0.2, (tempos[0] ?? m.de) - 0.05), 0.5);
  const assina = prog(t, Math.max(entra + 0.5, tempos[tempos.length - 1] ?? m.ate - 0.6) + 0.15, 0.45);
  const tamanhoIcone = 96;
  return (
    <Cartao zona={zona} entra={entra} sai={fim} t={t} padding="36px 40px 36px">
      <div style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
        <div
          style={{
            width: tamanhoIcone,
            height: tamanhoIcone,
            borderRadius: 24,
            background: cor.branco,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            scale: String(mistura(0.6, 1, iconeP)),
            opacity: iconeP,
          }}
        >
          <Icone nome={icone} tamanho={56} cor={cor.grafite} traco={2.4} p={prog(t, entra + 0.3, 0.6)} />
        </div>
        <div style={{ flex: 1 }}>
          <TituloFalado
            texto={m.texto}
            palavras={palavras}
            de={m.de}
            ate={m.ate}
            t={t}
            largura={largura - tamanhoIcone - 28}
            maximo={74}
            sublinhado={m.destaque}
            inicio={m.em}
          />
        </div>
      </div>
      {marca.nome ? (
        <div
          style={{
            marginTop: 26,
            paddingTop: 22,
            borderTop: `2px solid rgba(255,255,255,${0.28 * assina})`,
            display: "flex",
            alignItems: "baseline",
            gap: 16,
            opacity: assina,
            translate: `0 ${(1 - assina) * 12}px`,
          }}
        >
          <span style={{ fontSize: 44, fontWeight: 800, color: cor.branco }}>{marca.nome}</span>
          {marca.area ? <span style={{ fontSize: 36, fontWeight: 600, color: cor.claroSuave }}>{marca.area}</span> : null}
        </div>
      ) : null}
    </Cartao>
  );
};

// ——— peças comuns dos cartões novos ———

// Texto montado palavra por palavra, já quebrado em linhas que cabem (corpo entre `minimo` e `maximo`).
const TextoQueCabe: React.FC<{
  texto: string;
  palavras: Palavra[];
  de: number;
  ate: number;
  inicio: number;
  t: number;
  largura: number;
  maximo: number;
  minimo: number;
  linhas?: number;
  peso?: number;
  cor?: string;
  corDe?: (i: number) => string | undefined;
  fantasma?: number;
  capa?: number;
  entrelinha?: number;
  extra?: (i: number, tamanho: number, tempos: number[]) => React.ReactNode;
}> = ({ texto, palavras, de, ate, inicio, t, largura, maximo, minimo, linhas: maxLinhas = 3, peso = 800, cor: c = cor.branco, corDe, fantasma = 0.22, capa, entrelinha = 1.04, extra }) => {
  const { tamanho, linhas } = caber(texto, largura, maximo, minimo, maxLinhas, peso);
  const tempos = temposDoTexto(texto, palavras, de, ate, inicio);
  let base = 0;
  return (
    <div style={{ fontSize: tamanho, fontWeight: peso, lineHeight: entrelinha, letterSpacing: "-0.015em", color: c }}>
      {linhas.map((l, i) => {
        const b = base;
        base += l.length;
        return (
          <Palavras
            key={i}
            palavras={l}
            tempos={tempos}
            base={b}
            t={t}
            fantasma={fantasma}
            capa={capa}
            corDe={corDe}
            extra={extra ? (k) => extra(k, tamanho, tempos) : undefined}
          />
        );
      })}
    </div>
  );
};

// Fileira de pontos (pessoas) no pé do cartão: acendem em sequência; com `cai`, caem em laranja
// um a um e somem (quem fica pelo caminho).
const FileiraDePontos: React.FC<{ t: number; acende: number; cai?: number; quantos?: number; capa?: number }> = ({
  t,
  acende,
  cai,
  quantos = 14,
  capa,
}) => (
  <div style={{ position: "relative", height: 34, marginTop: 26 }}>
    {Array.from({ length: quantos }, (_, i) => {
      const a = capa !== undefined && t < capa ? 1 : prog(t, acende + i * 0.045, 0.2);
      const c = cai === undefined ? 0 : prog(t, cai + ((i * 7) % quantos) * 0.035, 0.55);
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: i * 46,
            top: 4 + c * c * 120,
            width: 26,
            height: 26,
            borderRadius: 13,
            background: c > 0.02 ? cor.alerta : cor.branco,
            opacity: a * (1 - c),
          }}
        />
      );
    })}
  </div>
);

// Etiqueta pequena em caixa-alta, contornada (ex.: "ILUSTRATIVO"), para o cartão grafite
const EtiquetaClara: React.FC<{ texto: string; p: number }> = ({ texto, p }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      height: 48,
      padding: "0 18px 0 14px",
      borderRadius: 24,
      border: `2.5px solid rgba(255,255,255,0.7)`,
      color: cor.claroSuave,
      fontSize: 30,
      fontWeight: 800,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      opacity: p,
      whiteSpace: "nowrap",
    }}
  >
    <svg width={12} height={12}>
      <circle cx={6} cy={6} r={5} fill="rgba(255,255,255,0.7)" />
    </svg>
    {texto}
  </div>
);

// ——— número ———

// número curto para as marcas da régua: 25000 → "25 mil"; 1500000 → "1,5 mi"
export const compacto = (v: number) => {
  const a = Math.abs(v);
  const corta = (x: number) => formatar(x, Number.isInteger(Math.round(x * 10) / 10) ? 0 : 1);
  if (a >= 1e9) return `${corta(v / 1e9)} bi`;
  if (a >= 1e6) return `${corta(v / 1e6)} mi`;
  if (a >= 1e4) return `${corta(v / 1e3)} mil`;
  return formatar(v, Number.isInteger(v) ? 0 : 1);
};

// o fim "redondo" da régua, um pouco acima do valor: 83.000 → 100.000; 7 → 10
const fimDaRegua = (v: number) => {
  const alvo = Math.max(1e-6, Math.abs(v) * 1.12);
  const pot = 10 ** Math.floor(Math.log10(alvo));
  const passo = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((f) => f * pot >= alvo) ?? 10;
  return passo * pot;
};

export const CartaoNumero: React.FC<{ m: Numero; palavras: Palavra[]; t: number; zona: Zona; entra: number; fim: number }> = ({
  m,
  palavras,
  t,
  zona,
  entra,
  fim,
}) => {
  const largura = 1080 - zona.esquerda - zona.direita - 88;
  const casas = m.casas ?? (Number.isInteger(m.valor) ? 0 : 1);
  // número no começo do vídeo: o primeiro quadro mostra o valor final (capa do post)
  const capa = m.de <= 0.25 ? 0.12 : undefined;
  const p = capa !== undefined && t < capa ? 1 : prog(t, m.em - 0.03, Math.min(1.3, Math.max(0.6, (m.ate - m.em) * 0.5)), apuracao);
  // poucos inteiros (até 12): o número já entra no valor e os pontos caem um a um (contar "1 vezes,
  // 2 vezes…" soaria errado); os outros números contam
  const poucos = (m.casas ?? 0) === 0 && Number.isInteger(m.valor) && m.valor >= 1 && m.valor <= 12 && m.sufixo?.trim() !== "%";
  const valor = poucos ? m.valor : m.valor * p;
  const quedaDosPontos = m.valor * p;
  const final = formatar(m.valor, casas);
  // antes de ser dito, o número fica "a lápis" (um traço), como os contadores do funil
  const dito = t >= m.em - 0.03 || (capa !== undefined && t < capa);
  const agora = dito ? formatar(valor, casas) : "—";
  const prefixo = m.prefixo?.trim();
  const sufixo = m.sufixo?.trim();
  const porcento = sufixo === "%";
  // gráfico do número: pontos (até 12 inteiros), grade de 100 pontos (%) ou régua
  const pontos = !porcento && casas === 0 && m.valor >= 1 && m.valor <= 12;
  const grade = porcento && m.valor > 0 && m.valor <= 100;
  const larguraNumero = grade ? largura - 260 : largura;
  // tamanho: o maior em que prefixo + número + sufixo cabem numa linha
  let tam = 170;
  const larguraTotal = (x: number) =>
    medir(final, x) + (prefixo ? medir(prefixo, x * 0.46) + x * 0.12 : 0) + (sufixo ? medir(sufixo, porcento ? x * 0.62 : x * 0.42) + x * 0.1 : 0);
  while (tam > 84 && larguraTotal(tam) > larguraNumero) tam -= 4;
  const rotuloEm = m.rotuloEm ?? Math.min(m.em, m.de + 0.1);
  // no começo do vídeo (capa), a régua e as marcas já estão desenhadas no primeiro quadro
  const e0 = capa !== undefined ? -1 : entra;
  const acende = prog(t, m.em - 0.03, 0.3);
  const fimRegua = fimDaRegua(m.valor);
  const marcas = [0, 0.25, 0.5, 0.75, 1].map((f) => f * fimRegua);
  const larguraRegua = largura - 20;
  const xMarcador = (Math.max(0, valor) / fimRegua) * larguraRegua;
  const pousou = prog(t, m.em + Math.min(1.3, Math.max(0.6, (m.ate - m.em) * 0.5)), 0.5);
  return (
    <Cartao zona={zona} entra={m.de <= 0.25 ? -1 : entra} sai={fim} t={t} padding="34px 44px 38px">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
        <TextoQueCabe
          texto={m.rotulo}
          palavras={palavras}
          de={m.de}
          ate={m.ate}
          inicio={rotuloEm - 0.05}
          t={t}
          largura={m.ilustrativo ? largura - 300 : largura}
          maximo={48}
          minimo={38}
          linhas={2}
          peso={700}
          cor={cor.claroSuave}
          fantasma={0.3}
          capa={capa}
        />
        {m.ilustrativo ? <EtiquetaClara texto="Ilustrativo" p={prog(t, e0 + 0.2, 0.4)} /> : null}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 36, marginTop: 6 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: tam * 0.1,
            color: t >= m.em - 0.03 || (capa !== undefined && t < capa) ? cor.branco : "rgba(255,255,255,0.3)",
            fontWeight: 800,
            lineHeight: 1,
            scale: String(1 + 0.04 * Math.sin(Math.PI * acende)),
            transformOrigin: "left center",
          }}
        >
          {prefixo ? <span style={{ fontSize: tam * 0.46, fontWeight: 700 }}>{prefixo}</span> : null}
          <span style={{ fontSize: tam, letterSpacing: "-0.01em", whiteSpace: "nowrap", display: "inline-flex" }}>
            {[...agora].map((ch, i) =>
              /\d/.test(ch) ? (
                <span key={i} style={{ fontVariantNumeric: "tabular-nums" }}>
                  {ch}
                </span>
              ) : (
                <span key={i} style={{ margin: "0 -0.05em" }}>
                  {ch}
                </span>
              ),
            )}
          </span>
          {sufixo ? <span style={{ fontSize: porcento ? tam * 0.62 : tam * 0.42, fontWeight: 700 }}>{sufixo}</span> : null}
        </div>
        {grade ? (
          <svg width={230} height={230} style={{ flexShrink: 0 }}>
            {Array.from({ length: 100 }, (_, i) => {
              const cheio = i < Math.round(valor);
              const x = (i % 10) * 23 + 11.5;
              const y = Math.floor(i / 10) * 23 + 11.5;
              return cheio ? (
                <circle key={i} cx={x} cy={y} r={8.5} fill={cor.branco} />
              ) : (
                <circle key={i} cx={x} cy={y} r={7.5} fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth={2} />
              );
            })}
          </svg>
        ) : null}
      </div>
      {pontos ? (
        <div style={{ position: "relative", height: 70, marginTop: 22 }}>
          {Array.from({ length: m.valor }, (_, i) => {
            const chega = capa !== undefined && t < capa ? 1 : limitar((quedaDosPontos - i) * 1.6);
            return (
              <div key={i} style={{ position: "absolute", left: i * 72, top: 4 }}>
                <div style={{ width: 54, height: 54, borderRadius: 27, border: "3px dashed rgba(255,255,255,0.3)", boxSizing: "border-box" }} />
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: (1 - queda(chega)) * -60,
                    width: 54,
                    height: 54,
                    borderRadius: 27,
                    background: cor.branco,
                    opacity: chega > 0 ? 1 : 0,
                  }}
                />
              </div>
            );
          })}
        </div>
      ) : grade ? null : (
        <div style={{ position: "relative", height: 92, marginTop: 30 }}>
          <svg width={larguraRegua + 40} height={40} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <line x1={0} y1={20} x2={larguraRegua * prog(t, e0 + 0.15, 0.6)} y2={20} stroke="rgba(255,255,255,0.45)" strokeWidth={4} strokeLinecap="round" />
            <line x1={0} y1={20} x2={xMarcador} y2={20} stroke={cor.branco} strokeWidth={6} strokeLinecap="round" />
            {marcas.map((v, i) => (
              <line key={i} x1={(v / fimRegua) * larguraRegua} y1={8} x2={(v / fimRegua) * larguraRegua} y2={32} stroke="rgba(255,255,255,0.45)" strokeWidth={3} opacity={prog(t, e0 + 0.2 + i * 0.08, 0.3)} />
            ))}
            {t >= m.em - 0.03 || capa !== undefined ? (
              <>
                <circle cx={xMarcador} cy={20} r={14} fill={cor.branco} />
                <circle cx={xMarcador} cy={20} r={14 + 14 * pousou} fill="none" stroke={cor.branco} strokeWidth={2.5} opacity={0.7 * (1 - pousou)} />
              </>
            ) : null}
          </svg>
          {marcas.map((v, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: 46,
                left: (v / fimRegua) * larguraRegua,
                translate: i === 0 ? "0 0" : i === marcas.length - 1 ? "-100% 0" : "-50% 0",
                fontSize: 30,
                fontWeight: 600,
                color: cor.claroSuave,
                whiteSpace: "nowrap",
                opacity: prog(t, e0 + 0.25 + i * 0.08, 0.3),
              }}
            >
              {compacto(v)}
            </div>
          ))}
        </div>
      )}
    </Cartao>
  );
};

// ——— destaque ———

export const CartaoDestaque: React.FC<{ m: Destaque; palavras: Palavra[]; t: number; zona: Zona; entra: number; fim: number }> = ({
  m,
  palavras,
  t,
  zona,
  entra,
  fim,
}) => {
  const largura = 1080 - zona.esquerda - zona.direita - 88;
  const alerta = m.nivel === "alerta";
  const { tamanho, linhas } = caber(m.texto, largura, 104, 64, 3);
  const tempos = temposDoTexto(m.texto, palavras, m.de, m.ate, m.em - 0.08);
  const ultima = tempos[tempos.length - 1] ?? m.em;
  const detalheEm = m.detalheEm ?? ultima + 0.4;
  let base = 0;
  return (
    <Cartao zona={zona} entra={entra} sai={fim} t={t} padding="36px 44px 40px">
      {alerta ? (
        <div style={{ marginBottom: 14, opacity: prog(t, entra + 0.1, 0.3) }}>
          <Icone nome="alerta" tamanho={60} cor={cor.alerta} traco={2.6} p={prog(t, entra + 0.15, 0.5)} />
        </div>
      ) : null}
      <div style={{ fontSize: tamanho, fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.02em", color: cor.branco }}>
        {linhas.map((l, i) => {
          const b = base;
          base += l.length;
          const ultimaLinha = i === linhas.length - 1;
          return (
            <div key={i} style={{ position: "relative", display: "inline-block", width: "100%" }}>
              <Palavras palavras={l} tempos={tempos} base={b} t={t} fantasma={0.22} corDe={() => (alerta ? cor.alerta : undefined)} />
              {!alerta && ultimaLinha ? (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    bottom: -4,
                    height: Math.max(7, tamanho * 0.08),
                    width: Math.min(largura, medir(l.join(" "), tamanho)),
                    borderRadius: 4,
                    background: cor.branco,
                    transformOrigin: "left center",
                    scale: `${prog(t, ultima + 0.2, 0.45)} 1`,
                  }}
                />
              ) : null}
            </div>
          );
        })}
      </div>
      {m.detalhe ? (
        <div style={{ marginTop: 20 }}>
          <TextoQueCabe
            texto={m.detalhe}
            palavras={palavras}
            de={Math.min(detalheEm, m.ate) - 0.3}
            ate={m.ate}
            inicio={detalheEm - 0.05}
            t={t}
            largura={largura}
            maximo={46}
            minimo={40}
            linhas={2}
            peso={600}
            cor={cor.claroSuave}
            fantasma={0.3}
          />
        </div>
      ) : null}
      {alerta ? <FileiraDePontos t={t} acende={entra + 0.15} cai={ultima + 0.25} /> : null}
    </Cartao>
  );
};

// ——— pergunta ———

export const CartaoPergunta: React.FC<{ m: Pergunta; palavras: Palavra[]; t: number; zona: Zona; entra: number; fim: number }> = ({
  m,
  palavras,
  t,
  zona,
  entra,
  fim,
}) => {
  const largura = 1080 - zona.esquerda - zona.direita - 88;
  const icone = 96;
  const surge = prog(t, entra + 0.15, 0.45);
  const opcoes = (m.opcoes ?? []).slice(0, 4);
  return (
    <Cartao zona={zona} entra={entra} sai={fim} t={t} padding="34px 40px 38px">
      <div style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
        <div
          style={{
            width: icone,
            height: icone,
            borderRadius: icone / 2,
            background: cor.branco,
            color: cor.grafite,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1,
            flexShrink: 0,
            scale: String(mistura(0.6, 1, surge)),
            opacity: surge,
          }}
        >
          <span style={{ translate: "0 -2px" }}>?</span>
        </div>
        <div style={{ flex: 1 }}>
          <TextoQueCabe
            texto={m.texto}
            palavras={palavras}
            de={m.em ?? m.de}
            ate={m.ate}
            inicio={(m.em ?? m.de) - 0.1}
            t={t}
            largura={largura - icone - 28}
            maximo={74}
            minimo={52}
            linhas={opcoes.length ? 3 : 4}
          />
        </div>
      </div>
      {opcoes.length ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "14px 16px", marginTop: 26 }}>
          {opcoes.map((o, i) => {
            const p = prog(t, o.em - 0.05, 0.4);
            const { tamanho } = caber(o.texto, largura - 50, 48, 36, 1, 700);
            return (
              <div
                key={i}
                style={{
                  height: tamanho * 1.5,
                  padding: `0 ${tamanho * 0.55}px`,
                  borderRadius: tamanho * 0.75,
                  border: p > 0.5 ? `3px solid ${cor.branco}` : "3px dashed rgba(255,255,255,0.35)",
                  display: "flex",
                  alignItems: "center",
                  fontSize: tamanho,
                  fontWeight: 700,
                  color: cor.branco,
                  whiteSpace: "nowrap",
                  translate: `0 ${(1 - p) * 14}px`,
                }}
              >
                <span style={{ opacity: 0.3 + 0.7 * p }}>{o.texto}</span>
              </div>
            );
          })}
        </div>
      ) : null}
    </Cartao>
  );
};

