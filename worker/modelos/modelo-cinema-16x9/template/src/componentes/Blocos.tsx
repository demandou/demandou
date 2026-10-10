// Os blocos universais de barra, na linguagem do Cinema, no quadro deitado (16:9): a pessoa vai
// para a moldura da direita (aula 9), a imagem (às vezes) escurece e o texto mora no quadro preto
// do lado esquerdo, nunca sobre o rosto. O que no vertical ia na barra de cima fica em cima no
// quadro; o que ia na de baixo, embaixo. O texto entra em foco palavra por palavra no ritmo da
// fala, como a narração.
import { prog, saindo, useTempo } from "../anim";
import { divisaoDoQuadro, LARGURA_TEXTO, VAO_DO_QUADRO, type Estado } from "../layout";
import { encaixar, formatarNumero, larguraTexto } from "../medida";
import type { Abertura as AberturaT, Comparacao as ComparacaoT, Definicao as DefinicaoT, Destaque as DestaqueT, Numero as NumeroT, Pergunta as PerguntaT, Plano } from "../plano";
import { cor, serif, sombra } from "../tema";
import { Coluna, Credito, Grupo, Ilustrativo, NoQuadro, Regua } from "./Barras";
import { Digitos, LARGURA_ALGARISMO } from "./Cartela";
import { DesenhoDaCartela, LARGURA_DO_DESENHO, PROPORCAO_DO_DESENHO } from "./Desenhos";
import { medirTexto, TextoEmFoco } from "./Foco";

type Props<M> = { m: M; estado: Estado; assentado: Estado; primeira: boolean; marca: Plano["marca"] };

// saída comum: o texto apaga e desfoca nos últimos 0,4 s do momento (antes de o próximo entrar)
const useSaida = (ate: number) => {
  const t = useTempo();
  const sai = saindo(t, ate, 0.4);
  return { opacity: 1 - sai, filter: sai > 0.02 ? `blur(${(sai * 6).toFixed(2)}px)` : undefined } as React.CSSProperties;
};

// No bloco que abre o vídeo, o primeiro quadro é a capa: crédito e desenho já estão lá
// (tempos negativos). Nos outros, nada entra antes de a moldura começar a assentar (`piso`).
const capa = (primeira: boolean, em: number, naCapa: number, piso: number) => (primeira ? Math.min(em, naCapa) : Math.max(piso, em));

// Desenho a traço que cabe numa altura (em cima, no quadro).
const DesenhoNaBarra: React.FC<{ d: NonNullable<AberturaT["desenho"]>; altura: number; inicio: number; fim: number }> = ({ d, altura, inicio, fim }) => {
  const t = useTempo();
  const largura = Math.min(LARGURA_DO_DESENHO[d.tipo] * 0.72, LARGURA_TEXTO, Math.max(0, altura) * PROPORCAO_DO_DESENHO[d.tipo]);
  if (largura < 120) return null;
  return (
    <div style={{ width: largura }}>
      <DesenhoDaCartela d={{ ...d, em: inicio }} t={t} inicio={inicio} fim={fim} />
    </div>
  );
};

// a reserva de cima quando há desenho (o desenho tem até ~240 px de altura)
const CIMA_COM_DESENHO = 330;

// --- abertura: o título do vídeo no quadro, com o crédito (e o desenho) em cima ---
export const Abertura: React.FC<Props<AberturaT>> = ({ m, estado, primeira, marca }) => {
  const saida = useSaida(m.ate);
  // no começo do vídeo, o primeiro quadro já mostra o título inteiro (a capa)
  const pronto = primeira ? m.de : m.de + 0.15;
  const piso = primeira ? -3 : pronto;
  const inicio = m.em ?? m.de;
  const credito = m.rotulo ?? marca.nome;
  const d = divisaoDoQuadro(m.desenho ? CIMA_COM_DESENHO : credito ? 70 : 20);
  const alturaDesenho = d.cima - (credito ? 80 : 20) - 30;
  return (
    <NoQuadro estado={estado}>
      <Coluna gap={VAO_DO_QUADRO} estilo={saida}>
        <Grupo gap={22}>
          {m.desenho ? <DesenhoNaBarra d={m.desenho} altura={alturaDesenho} inicio={capa(primeira, m.desenho.em ?? pronto, -1.2, piso)} fim={m.ate} /> : null}
          {credito ? <Credito texto={credito} em={capa(primeira, m.rotuloEm ?? pronto, -0.6, piso)} /> : null}
          {!m.desenho ? <Regua em={Math.max(piso, pronto + 0.2)} largura={credito ? 160 : 240} /> : null}
        </Grupo>
        <TextoEmFoco
          texto={m.texto}
          destaque={m.destaque}
          em={inicio}
          entrada={pronto}
          limite={m.ate + 0.3}
          largura={LARGURA_TEXTO}
          altura={d.baixo}
          max={104}
          min={56}
          linhas={3}
          entrelinha={1.08}
          capa={primeira}
          sombra
        />
      </Coluna>
    </NoQuadro>
  );
};

// --- número: o contador mecânico no quadro, o rótulo como crédito em cima ---
export const Numero: React.FC<Props<NumeroT>> = ({ m, estado, primeira }) => {
  const t = useTempo();
  const saida = useSaida(m.ate);
  const pronto = primeira ? m.de : m.de + 0.15;
  const piso = primeira ? -3 : pronto;
  const texto = formatarNumero(m.valor, m.casas ?? 0);
  const digitos = (texto.match(/\d/g) ?? []).length;
  const separadores = texto.length - digitos;
  const d = divisaoDoQuadro(m.desenho ? CIMA_COM_DESENHO + (m.ilustrativo ? 50 : 0) : m.ilustrativo ? 120 : 70);
  // prefixo e sufixo em corpo menor (42% do número), no mesmo alinhamento de base
  const largura = (T: number) =>
    digitos * LARGURA_ALGARISMO * T +
    separadores * 0.28 * T +
    (m.prefixo ? larguraTexto(m.prefixo, T * 0.42, "serif") + 0.12 * T : 0) +
    (m.sufixo ? larguraTexto(m.sufixo, T * 0.42, "serif") + 0.12 * T : 0);
  let T = Math.min(210, Math.floor((d.baixo - 50) / 1.14));
  while (T > 60 && largura(T) > LARGURA_TEXTO) T -= 2;
  const em = Math.max(piso, m.em);
  const pousa = em + 1.15;
  const pequeno: React.CSSProperties = { fontFamily: serif, fontWeight: 600, fontSize: T * 0.42, lineHeight: 1, color: cor.ambarClaro, paddingBottom: T * 0.2, whiteSpace: "nowrap" };
  return (
    <NoQuadro estado={estado}>
      <Coluna gap={VAO_DO_QUADRO} estilo={saida}>
        <Grupo gap={20}>
          {m.desenho ? (
            <DesenhoNaBarra d={m.desenho} altura={d.cima - 130 - (m.ilustrativo ? 50 : 0)} inicio={capa(primeira, m.desenho.em ?? pronto, -1.2, piso)} fim={m.ate} />
          ) : null}
          <Credito texto={m.rotulo} em={capa(primeira, m.rotuloEm ?? pronto, -0.6, piso)} limite={m.ate} />
          {m.ilustrativo ? <Ilustrativo em={Math.max(piso, pronto + 0.3)} /> : null}
        </Grupo>
        <Grupo gap={10}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: T * 0.12, textShadow: sombra, opacity: prog(t, Math.min(em, pronto) - 0.2, 0.45) }}>
            {m.prefixo ? <div style={pequeno}>{m.prefixo}</div> : null}
            <Digitos texto={texto} em={em} pousaEm={pousa} apareceEm={Math.min(em, pronto)} tamanho={T} voltas />
            {m.sufixo ? <div style={{ ...pequeno, color: cor.marfimSuave }}>{m.sufixo}</div> : null}
          </div>
          {/* a régua corre junto com a contagem e pousa com o número */}
          <div style={{ height: 2, width: Math.min(560, largura(T)) * prog(t, em, pousa - em), background: cor.ambar, opacity: 0.7 }} />
        </Grupo>
      </Coluna>
    </NoQuadro>
  );
};

// --- destaque: a frase curta grande no quadro; "alerta" esfria a imagem ---
export const Destaque: React.FC<Props<DestaqueT>> = ({ m, estado, primeira }) => {
  const saida = useSaida(m.ate);
  const pronto = primeira ? m.de : m.de + 0.15;
  const alerta = m.nivel !== "chave";
  const d = divisaoDoQuadro(10);
  const alturaDetalhe = m.detalhe ? 2 * 48 * 1.12 + 16 : 0;
  return (
    <NoQuadro estado={estado}>
      <Coluna gap={VAO_DO_QUADRO} estilo={saida}>
        <Regua em={Math.max(pronto, m.em - 0.1)} largura={alerta ? 300 : 200} corDaLinha={alerta ? cor.frio : cor.ambar} opacidade={0.8} />
        <Grupo gap={16}>
          <TextoEmFoco
            texto={m.texto}
            em={m.em}
            entrada={pronto}
            limite={m.ate + 0.3}
            largura={LARGURA_TEXTO}
            altura={d.baixo - alturaDetalhe}
            max={124}
            min={60}
            linhas={2}
            entrelinha={1.06}
            italico={!alerta}
            cor={alerta ? cor.marfim : cor.ambarClaro}
            capa={primeira}
            sombra
          />
          {m.detalhe ? (
            <TextoEmFoco
              texto={m.detalhe}
              em={m.detalheEm ?? m.em + 0.6}
              entrada={m.detalheEm ?? m.em + 0.6}
              limite={m.ate + 0.3}
              largura={LARGURA_TEXTO - 40}
              max={48}
              min={44}
              linhas={2}
              italico
              cor={cor.marfimSuave}
            />
          ) : null}
        </Grupo>
      </Coluna>
    </NoQuadro>
  );
};

// --- definição: o termo em cima, o significado embaixo, como legenda ---
export const Definicao: React.FC<Props<DefinicaoT>> = ({ m, estado, primeira }) => {
  const saida = useSaida(m.ate);
  const pronto = primeira ? m.de : m.de + 0.15;
  const d = divisaoDoQuadro(250);
  return (
    <NoQuadro estado={estado}>
      <Coluna gap={VAO_DO_QUADRO} estilo={saida}>
        <TextoEmFoco
          texto={m.termo}
          em={m.em}
          entrada={pronto}
          limite={m.significadoEm}
          largura={LARGURA_TEXTO}
          altura={d.cima}
          max={108}
          min={56}
          linhas={2}
          entrelinha={1.06}
          italico
          cor={cor.ambarClaro}
          capa={primeira}
        />
        <Grupo gap={20}>
          <Regua em={m.significadoEm - 0.1} largura={180} />
          <TextoEmFoco
            texto={m.significado}
            em={m.significadoEm}
            entrada={pronto}
            limite={m.ate + 0.3}
            largura={LARGURA_TEXTO}
            altura={d.baixo - 40}
            max={84}
            min={50}
            linhas={2}
            sombra
          />
        </Grupo>
      </Coluna>
    </NoQuadro>
  );
};

// --- comparação: um lado em cima, o outro embaixo, no quadro; o rosto na moldura ---
export const Comparacao: React.FC<Props<ComparacaoT>> = ({ m, estado, primeira }) => {
  const t = useTempo();
  const saida = useSaida(m.ate);
  const pronto = primeira ? m.de : m.de + 0.15;
  const vencedor = m.vencedor ?? (m.modo === "errado-certo" ? 1 : undefined);
  const vencedorEm = m.vencedorEm ?? (vencedor !== undefined ? m.lados[1].em + 0.9 : Infinity);
  const decide = prog(t, vencedorEm, 0.6);
  // os dois lados dividem o quadro (um vão maior entre eles, no lugar do rosto do vertical)
  const VAO_LADOS = 64;
  const metade = (divisaoDoQuadro(0).baixo - VAO_LADOS) / 2;
  // os dois textos com o mesmo corpo (o do que precisa de menos)
  const reservaTitulo = m.titulo ? 52 : 0;
  const alturas = [metade - 56 - reservaTitulo, metade - 56 - 24];
  const tamanho = Math.min(
    ...m.lados.map((l, i) => medirTexto({ texto: l.texto, largura: LARGURA_TEXTO, altura: alturas[i], max: 92, min: 50, linhas: 2 }).tamanho),
  );
  const lado = (i: 0 | 1) => {
    const l = m.lados[i];
    const perde = vencedor !== undefined && vencedor !== i;
    const ganha = vencedor === i;
    // o lado errado é riscado; num "contra" ou "antes-depois", o que perde só esfria
    const riscar = perde && m.modo === "errado-certo";
    const entrada = pronto;
    return (
      <Grupo gap={16}>
        {i === 0 && m.titulo ? <Credito texto={m.titulo} em={pronto} tamanho={32} /> : null}
        <Credito texto={l.rotulo} em={i === 0 ? Math.max(pronto, l.em - 0.2) : Math.max(pronto + 0.3, l.em - 0.2)} tamanho={34} corDoTexto={perde && decide > 0.5 ? cor.frio : undefined} />
        <div style={{ opacity: perde ? 1 - 0.35 * decide : 1 }}>
          <TextoEmFoco
            texto={l.texto}
            em={l.em}
            entrada={entrada}
            limite={i === 0 ? m.lados[1].em : m.ate + 0.3}
            largura={LARGURA_TEXTO}
            max={tamanho}
            min={Math.min(50, tamanho)}
            linhas={2}
            entrelinha={1.06}
            cor={perde && decide > 0 ? cor.frio : cor.marfim}
            risco={riscar ? l.texto : undefined}
            riscoEm={riscar ? vencedorEm : undefined}
            sombra
          />
        </div>
        {ganha ? <Regua em={vencedorEm} largura={240} /> : null}
      </Grupo>
    );
  };
  return (
    <NoQuadro estado={estado}>
      <Coluna gap={VAO_LADOS} estilo={saida}>
        {lado(0)}
        {lado(1)}
      </Coluna>
    </NoQuadro>
  );
};

// Marcador de opção: um círculo a traço que se fecha quando a opção é dita.
const Circulo: React.FC<{ em: number; tamanho: number; entrada: number }> = ({ em, tamanho, entrada }) => {
  const t = useTempo();
  const p = prog(t, em - 0.05, 0.6);
  const r = tamanho * 0.2;
  return (
    <svg width={tamanho * 0.5} height={tamanho * 0.5} viewBox={`0 0 ${tamanho * 0.5} ${tamanho * 0.5}`} style={{ flexShrink: 0, overflow: "visible", opacity: prog(t, entrada - 0.14, 0.34) }}>
      <circle cx={tamanho * 0.25} cy={tamanho * 0.25} r={r} fill="none" stroke={cor.marfimApagado} strokeWidth={3} />
      <circle
        cx={tamanho * 0.25}
        cy={tamanho * 0.25}
        r={r}
        fill="none"
        stroke={cor.ambar}
        strokeWidth={3.5}
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - p}
        transform={`rotate(-90 ${tamanho * 0.25} ${tamanho * 0.25})`}
      />
      <circle cx={tamanho * 0.25} cy={tamanho * 0.25} r={r * 0.42} fill={cor.ambar} opacity={prog(t, em + 0.35, 0.3)} />
    </svg>
  );
};

// --- pergunta: a pergunta em cima; as opções embaixo, cada uma na sua palavra ---
export const Pergunta: React.FC<Props<PerguntaT>> = ({ m, estado, primeira }) => {
  const saida = useSaida(m.ate);
  const pronto = primeira ? m.de : m.de + 0.15;
  const inicio = m.em ?? m.de;
  const opcoes = m.opcoes ?? [];
  const pergunta = (altura: number) => (
    <TextoEmFoco
      texto={m.texto}
      em={inicio}
      entrada={pronto}
      limite={opcoes[0]?.em ?? m.ate + 0.3}
      largura={LARGURA_TEXTO}
      altura={altura}
      max={104}
      min={52}
      linhas={3}
      entrelinha={1.08}
      italico
      capa={primeira}
      sombra
    />
  );
  if (!opcoes.length) {
    return (
      <NoQuadro estado={estado}>
        <Coluna estilo={saida}>{pergunta(divisaoDoQuadro(0).baixo)}</Coluna>
      </NoQuadro>
    );
  }
  // a pergunta fica com a altura que ela mede (até 3 linhas); as opções, com o resto
  const alturaPergunta = Math.ceil(medirTexto({ texto: m.texto, largura: LARGURA_TEXTO, altura: 360, max: 104, min: 52, linhas: 3, entrelinha: 1.08, italico: true }).alturaFinal);
  const d = divisaoDoQuadro(alturaPergunta);
  // as opções: o mesmo corpo para todas, cada uma numa linha (ou duas), empilhadas
  const larguraTextoOpcao = LARGURA_TEXTO - 80;
  let T = 76;
  const caber = (tam: number) => {
    let total = 0;
    for (const o of opcoes) {
      const enc = encaixar(o.texto.split(/\s+/).filter(Boolean), { largura: larguraTextoOpcao, max: tam, min: tam, linhas: 2 });
      if (enc.tamanho !== tam || enc.linhas.length > 2) return false;
      total += enc.linhas.length * tam * 1.08 + 18;
    }
    return total <= d.baixo;
  };
  while (T > 44 && !caber(T)) T -= 2;
  return (
    <NoQuadro estado={estado}>
      <Coluna gap={VAO_DO_QUADRO} estilo={saida}>
        {pergunta(d.cima)}
        <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "flex-start" }}>
          {opcoes.map((o, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <Circulo em={o.em} tamanho={T} entrada={Math.max(pronto, opcoes[0].em - 0.4)} />
              <TextoEmFoco
                texto={o.texto}
                em={o.em}
                entrada={Math.max(pronto, opcoes[0].em - 0.4)}
                limite={opcoes[i + 1]?.em ?? m.ate + 0.3}
                largura={larguraTextoOpcao}
                max={T}
                min={T}
                linhas={2}
                entrelinha={1.08}
                alinhar="flex-start"
                sombra
              />
            </div>
          ))}
        </div>
      </Coluna>
    </NoQuadro>
  );
};
