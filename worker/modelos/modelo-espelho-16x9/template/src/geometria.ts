// Geometria da página (no vertical, a faixa de cima, acima da linha do espelho; no deitado, o quadro
// da esquerda, ao lado da moldura da pessoa): onde fica cada texto e cada desenho de cada
// componente, dada a altura da base da página (a "linha"). Funções puras, usadas pelo layout e pelos componentes.
// Tudo se ajusta à linha: com a linha mais alta (pessoa com a cabeça grande no quadro), o desenho
// encolhe e os textos descem até os corpos mínimos de leitura.
import { ROSTO_H, ROSTO_W } from "./componentes/Rosto";
import type { Abertura, Area, Comparacao, Cta, Figura, Manchete, Mapa, Plano } from "./plano";
import { SIMBOLOS } from "./anim";
import { FIGURAS, vagasPara } from "./figuras";
import { corpoQueCabe, encaixar, larguraTexto, lembrar, quebrarLinhas } from "./medida";
import { FOLGA_DA_LINHA, FONTE_ITALICO, FONTE_ITALICO_500, FONTE_ROTULO, FONTE_TITULO, LIMITE_DIREITO, MARGEM_ESQUERDA, TOPO_SEGURO } from "./tema";

const mistura = (a: number, b: number, p: number) => a + (b - a) * p;
const soma = (lista: number[]) => lista.reduce((s, v) => s + v, 0);

export const NOMES_DAS_AREAS: Record<Area, string> = {
  testa: "Testa",
  glabela: "Entre as sobrancelhas",
  pesDeGalinha: "Pés de galinha",
  olheiras: "Olheiras",
  macas: "Maçãs do rosto",
  nariz: "Nariz",
  bigodeChines: "Bigode chinês",
  labios: "Lábios",
  queixo: "Queixo",
  contorno: "Contorno do rosto",
};

// ---------------------------------------------------------------- manchete
// centrada na página (de x 120 a x 960; no deitado a página fica no meio do quadro da esquerda)
export const LARGURA_MANCHETE = 840;
// respiro acima e abaixo do bloco de texto da manchete
const RESPIRO_MANCHETE = 46;
// a linha nunca sobe mais que isto numa manchete (a faixa de cima não fica estreita demais)
export const LINHA_MIN_MANCHETE = 430;

// largura de uma linha da manchete: palavras medidas, símbolos desenhados (0,8 do corpo) e o selo
const larguraDaLinhaDaManchete = (l: string, tamanho: number, comSelo: boolean) => {
  const palavras = l.split(/\s+/).filter(Boolean);
  const simbolos = palavras.filter((w) => SIMBOLOS.has(w)).length;
  const texto = palavras.filter((w) => !SIMBOLOS.has(w)).join(" ");
  return larguraTexto(texto, tamanho, FONTE_TITULO) + simbolos * 1.04 * tamanho + (comSelo ? 0.82 * tamanho : 0);
};

// A abertura universal vira uma manchete: o texto é quebrado em 1 a 3 linhas equilibradas
export const comoManchete = (m: Abertura): Manchete =>
  lembrar(`ab|${JSON.stringify(m)}`, () => {
    const e = encaixar(m.texto, { largura: LARGURA_MANCHETE, max: 104, min: 72, linhas: 3, fonte: FONTE_TITULO, preferirMenos: 0.8 });
    return { tipo: "manchete", de: m.de, ate: m.ate, legenda: m.legenda, linhas: e.linhas, enfase: m.destaque, em: m.em };
  });

export const geometriaDaManchete = (m: Manchete, linhaMaxima: number) =>
  lembrar(`man|${linhaMaxima}|${JSON.stringify(m)}`, () => {
    const tamanhoAbre = m.abre ? corpoQueCabe([m.abre], LARGURA_MANCHETE, 60, 40, FONTE_ITALICO) : 0;
    const tamanhoRotulo = m.rotulo ? corpoQueCabe([m.rotulo], LARGURA_MANCHETE, 36, 28, { ...FONTE_ROTULO, espacamento: 0.18 }) : 0;
    const tamanhoSub = m.sub ? corpoQueCabe([m.sub], LARGURA_MANCHETE, 34, 28, { ...FONTE_ROTULO, espacamento: 0.22 }) : 0;
    const alturaRotulo = m.rotulo ? 36 + 24 : 0;
    const alturaSub = m.sub ? 26 + 34 : 0;
    const alturaAbre = m.abre ? tamanhoAbre * 1.12 + 14 : 0;
    const extras = alturaRotulo + alturaSub + alturaAbre;
    // corpo: o maior que cabe na largura (até 104 px) e na altura que a pessoa deixa
    let porLargura = 104;
    while (porLargura > 48 && m.linhas.some((l, i) => larguraDaLinhaDaManchete(l, porLargura, m.seloEm !== undefined && i === m.linhas.length - 1) > LARGURA_MANCHETE)) porLargura -= 2;
    const disponivel = linhaMaxima - FOLGA_DA_LINHA - TOPO_SEGURO - 2 * RESPIRO_MANCHETE - extras;
    const porAltura = Math.floor(disponivel / (m.linhas.length * 1.06));
    // nunca abaixo de 72 px por falta de altura (a linha desce e a moldura da pessoa estreita)
    const tamanho = Math.min(porLargura, Math.max(72, porAltura));
    const alturaTexto = extras + m.linhas.length * tamanho * 1.06;
    const linha = Math.round(Math.max(LINHA_MIN_MANCHETE, TOPO_SEGURO + 2 * RESPIRO_MANCHETE + alturaTexto + FOLGA_DA_LINHA));
    // o bloco fica centrado na faixa entre o topo seguro e a linha
    const topoTexto = TOPO_SEGURO + Math.max(0, (linha - FOLGA_DA_LINHA - TOPO_SEGURO - alturaTexto) / 2);
    return { tamanho, tamanhoAbre, tamanhoRotulo, tamanhoSub, alturaTexto, linha, topoTexto };
  });

// ---------------------------------------------------------------- mapa
// Qual figura um mapa desenha (o rosto, quando há áreas ou efeito do rosto; senão o espelho de mão)
export const figuraDoMapa = (m: Mapa): Figura => m.figura ?? (m.areas?.length || m.efeito ? "rosto" : "espelho");

// Áreas do rosto usadas quando um mapa do rosto recebe `pontos` (de cima para baixo)
const AREAS_PARA_PONTOS: Record<2 | 3 | 4 | 5, Area[]> = {
  2: ["testa", "labios"],
  3: ["testa", "macas", "labios"],
  4: ["testa", "olheiras", "labios", "queixo"],
  5: ["testa", "olheiras", "macas", "labios", "queixo"],
};

// Os itens numerados do mapa, na ordem em que acendem: áreas do rosto ou pontos de qualquer figura
export const itensDoMapa = (m: Mapa) => {
  const figura = figuraDoMapa(m);
  if (m.areas?.length) return m.areas.map((a) => ({ texto: a.texto ?? NOMES_DAS_AREAS[a.area], em: a.em, area: a.area as Area | undefined, vaga: -1 }));
  const pontos = [...(m.pontos ?? [])].slice(0, 5).sort((x, y) => x.em - y.em);
  if (!pontos.length) return [];
  if (figura === "rosto") {
    const areas = AREAS_PARA_PONTOS[Math.max(2, pontos.length) as 2 | 3 | 4 | 5];
    return pontos.map((p, i) => ({ texto: p.texto, em: p.em, area: areas[i] as Area | undefined, vaga: -1 }));
  }
  const vagas = vagasPara(FIGURAS[figura], pontos.length);
  return pontos.map((p, i) => ({ texto: p.texto, em: p.em, area: undefined as Area | undefined, vaga: vagas[i] }));
};

// rótulo em caixa alta com espaçamento 0,2em
const FONTE_ROTULO_MAPA = { ...FONTE_ROTULO, espacamento: 0.2 };

// A figura ocupa um lado da faixa de cima, de pé na linha do espelho, o maior possível; do outro
// lado, uma coluna com rótulo e título no alto e, embaixo (junto da linha), a nota e a legenda do
// mapa. Procura o maior desenho em que a coluna cabe com corpos generosos; se não der, encolhe os
// corpos até os mínimos de leitura.
export const geometriaDoMapa = (m: Mapa, linha: number) =>
  lembrar(`mapa|${linha}|${JSON.stringify(m)}`, () => {
    const x0 = MARGEM_ESQUERDA;
    const x1 = LIMITE_DIREITO;
    const largura = x1 - x0;
    const esquerda = m.lado !== "direita";
    const base = linha - FOLGA_DA_LINHA;
    const altura = base - TOPO_SEGURO;
    const vao = 52;
    const titulo = m.titulo ?? "";
    const nomes = itensDoMapa(m).map((a) => a.texto);

    const def = figuraDoMapa(m) === "rosto" ? null : FIGURAS[figuraDoMapa(m) as Exclude<Figura, "rosto">];
    // largura útil do desenho (o rosto usa a caixa toda; as outras figuras, só a extensão delas)
    const [ex0, ex1] = def ? def.extensao : [0, ROSTO_W];
    const medir = (escala: number, k: number) => {
      const rostoW = (ex1 - ex0) * escala;
      const colunaW = largura - rostoW - vao;
      const tamanhoRotulo = k >= 0.5 ? 36 : 34;
      const quebraRotulo = m.rotulo ? quebrarLinhas(m.rotulo, colunaW, tamanhoRotulo, FONTE_ROTULO_MAPA) : [];
      const alturaRotulo = quebraRotulo.length ? quebraRotulo.length * tamanhoRotulo * 1.18 + 12 : 0;
      const eTitulo = titulo ? encaixar(titulo, { largura: colunaW, max: Math.round(mistura(76, 90, k)), min: 66, linhas: 2, fonte: FONTE_TITULO }) : null;
      const tamanhoTitulo = eTitulo?.tamanho ?? 0;
      const linhasTitulo = eTitulo?.linhas.length ?? 0;
      const alturaCabecalho = alturaRotulo + linhasTitulo * tamanhoTitulo * 1.02;

      const circulo = Math.round(mistura(52, 62, k));
      const eNota = m.nota ? encaixar(m.nota, { largura: colunaW, max: Math.round(mistura(48, 58, k)), min: 46, linhas: 2, fonte: FONTE_ITALICO_500 }) : null;
      const tamanhoNota = eNota?.tamanho ?? 0;
      const linhasNota = eNota?.linhas.length ?? 0;
      const larguraNome = colunaW - circulo - 22;
      const tamanhoLegenda = nomes.length ? Math.max(44, Math.min(...nomes.map((n) => corpoQueCabe([n], larguraNome, Math.round(mistura(46, 58, k)), 44, FONTE_TITULO)))) : 0;
      const quebrasLegenda = nomes.map((n) => quebrarLinhas(n, larguraNome, tamanhoLegenda, FONTE_TITULO));
      const alturasLegenda = quebrasLegenda.map((q) => Math.max(circulo + 12, q.length * tamanhoLegenda * 1.04 + 14));
      const alturaNota = linhasNota * tamanhoNota * 1.1;
      const vaoNota = m.nota && nomes.length ? 30 : 0;
      const alturaBloco = alturaNota + vaoNota + soma(alturasLegenda);
      const total = alturaCabecalho + (alturaBloco > 0 ? 40 : 0) + alturaBloco;
      const cabe = total <= altura && linhasTitulo <= 2 && ROSTO_H * escala <= altura;
      const semQuebra = quebrasLegenda.every((q) => q.length === 1);
      return {
        escala,
        rostoW,
        colunaW,
        tamanhoRotulo,
        alturaRotulo,
        tamanhoTitulo,
        linhasTitulo,
        quebraTitulo: eTitulo?.linhas ?? [],
        alturaCabecalho,
        circulo,
        tamanhoNota,
        linhasNota,
        quebraNota: eNota?.linhas ?? [],
        larguraNome,
        tamanhoLegenda,
        quebrasLegenda,
        alturasLegenda,
        alturaNota,
        vaoNota,
        alturaBloco,
        cabe,
        semQuebra,
      };
    };
    const passo = (de: number, ate: number) => Array.from({ length: Math.round((de - ate) / 0.05) + 1 }, (_, i) => +(de - i * 0.05).toFixed(2));
    // o rosto vai até 1,05 (o desenho aprovado); as outras figuras, mais estreitas, até 1,2
    const maior = def ? 1.3 : 1.05;
    // (nas figuras da biblioteca, o desenho grande vale mais que o nome numa linha só)
    const grande = def ? 1 : 0.85;
    const tentativas: [number, number, boolean][] = [
      // desenho grande, corpos generosos e nomes da legenda numa linha só
      ...passo(maior, grande).flatMap((e) => [1, 0.85, 0.7].map((k): [number, number, boolean] => [e, k, true])),
      // desenho ainda grande, com nomes longos quebrando em 2 linhas
      ...passo(maior, grande).flatMap((e) => [1, 0.7, 0.4, 0].map((k): [number, number, boolean] => [e, k, false])),
      ...(def ? passo(0.95, 0.85).flatMap((e) => [1, 0.85, 0.7, 0.4, 0].map((k): [number, number, boolean] => [e, k, false])) : []),
      // depois, desenho menor e corpos até o mínimo
      ...passo(0.8, 0.6).flatMap((e) => [1, 0.7, 0.4, 0].map((k): [number, number, boolean] => [e, k, false])),
    ];
    let g = medir(0.6, 0);
    for (const [e, k, inteiros] of tentativas) {
      const r = medir(e, k);
      const legendaEmDuas = r.quebrasLegenda.every((q) => q.length <= 2);
      if (r.cabe && (inteiros ? r.semQuebra : legendaEmDuas || e <= 0.8)) {
        g = r;
        break;
      }
    }
    const rostoH = ROSTO_H * g.escala;
    const rostoX = esquerda ? x0 : x1 - g.rostoW;
    const rostoY = base - rostoH;
    const colunaX = esquerda ? x0 + g.rostoW + vao : x0;
    // nota e legenda descem até a linha (ficam ao lado do pé do desenho); o cabeçalho fica no alto
    const blocoTopo = Math.max(TOPO_SEGURO + g.alturaCabecalho + 40, base - g.alturaBloco);

    return {
      ...g,
      x0,
      x1,
      largura,
      esquerda,
      base,
      rostoX,
      // onde fica a caixa de 400 × 540 do desenho (a extensão começa em rostoX)
      desenhoX: rostoX - ex0 * g.escala,
      rostoY,
      rostoH,
      eixoX: rostoX + g.rostoW / 2,
      colunaX,
      // topo da nota (o filete fica logo acima) e da legenda
      colunaTopo: blocoTopo,
      nomes,
    };
  });

// ---------------------------------------------------------------- comparação
// a régua do tempo, na base da página (no deitado, um fio dourado na base do quadro da esquerda):
// 0 em x0, o fim da escala em x1 (a faixa da página vai de x 90 a 990)
export const EIXO = { x0: 114, x1: 958 };
export const BARRA = 30;
const UNIDADE = 32;

export const geometriaDaComparacao = (m: Comparacao, linha: number) => {
  const base = linha - FOLGA_DA_LINHA;
  const topoLinhas = TOPO_SEGURO + (m.rotulo ? 36 + 30 : 0);
  const disponivel = base - topoLinhas;
  const vao = 22;
  const comEscala = !!m.escala;
  const nItens = Math.max(1, ...[m.esquerda, m.direita].map((l) => Math.min(3, l?.itens?.length ?? 0)));

  // o maior conjunto de corpos em que as duas linhas cabem
  const opcoes = comEscala
    ? [
        [84, 128],
        [80, 120],
        [76, 112],
        [72, 104],
        [72, 96],
      ]
    : [
        [88, 58],
        [84, 56],
        [80, 54],
        [76, 52],
        [72, 48],
      ];
  const medir = ([nome, segundo]: number[]) => {
    if (comEscala) {
      const bloco = segundo * 0.92 + 10 + UNIDADE;
      return { nome, numero: segundo, item: 0, bloco, alturaLinha: nome + 10 + bloco + 16 + BARRA };
    }
    return { nome, numero: 0, item: segundo, bloco: 0, alturaLinha: nome + 12 + nItens * segundo * 1.14 };
  };
  let escolha = medir(opcoes[opcoes.length - 1]);
  for (const o of opcoes) {
    const r = medir(o);
    if (2 * r.alturaLinha + vao <= disponivel) {
      escolha = r;
      break;
    }
  }
  const sobra = Math.max(0, disponivel - (2 * escolha.alturaLinha + vao));
  const topo1 = topoLinhas + sobra / 2;
  const linhas = [topo1, topo1 + escolha.alturaLinha + vao].map((topo) => ({
    topo,
    yNumero: topo + escolha.nome + 10,
    yBarra: topo + escolha.nome + 10 + escolha.bloco + 16 + BARRA / 2,
    base: topo + escolha.alturaLinha,
  }));
  const xDe = (v: number) => (m.escala ? EIXO.x0 + ((EIXO.x1 - EIXO.x0) * v) / m.escala.ate : EIXO.x0);
  return { base, linha, ...escolha, linhas, xDe, sobra };
};

// A comparação com régua usa o desenho próprio do Espelho (Comparacao.tsx), que fala a forma
// antiga (`esquerda`, `direita`, `rotulo`). A forma universal (`lados` + `escala`) é traduzida.
export const ehRegua = (m: Comparacao) => !!m.escala || (!m.lados && !!m.esquerda);
export const comoReguaAntiga = (m: Comparacao): Comparacao => {
  if (!m.lados) return m;
  const lado = (l: NonNullable<Comparacao["lados"]>[number]) => ({
    titulo: l.rotulo,
    em: l.em,
    areas: l.areas,
    faixa: l.faixa,
    textos: { inicio: l.texto, ...(l.textos ?? {}) },
  });
  return { ...m, rotulo: m.titulo ?? m.rotulo, esquerda: lado(m.lados[0]), direita: lado(m.lados[1]) };
};

// ---------------------------------------------------------------- fechamento
const RESPIRO_FECHO = 56;
// nome do botão desenhado (no link, o trecho em destaque da chamada, se houver)
export const nomeDoBotao = (m: Cta) => {
  const icone = m.icone ?? "seguir";
  if (icone === "link") return (m.destaque ?? "Abrir link").toUpperCase();
  return icone === "salvar" ? "SALVAR" : icone === "comentar" ? "COMENTAR" : "SEGUIR";
};
export const geometriaDoFechamento = (m: Cta, plano: Plano) =>
  lembrar(`fecho|${JSON.stringify(plano.marca)}|${JSON.stringify(m)}`, () => {
    const nome = plano.marca.nome.trim();
    const temNome = nome.length > 0;
    const temArea = temNome && !!plano.marca.area;
    // centrados no quadro: até 840 px de largura (de x 120 a 960); nome longo vai em 2 linhas
    const eNome = temNome ? encaixar(nome, { largura: 840, max: 96, min: 72, linhas: 2, fonte: FONTE_TITULO }) : null;
    const tamanhoNome = eNome?.tamanho ?? 0;
    const linhasNome = eNome?.linhas.length ?? 0;
    const tamanhoArea = temArea ? corpoQueCabe([plano.marca.area], 840, 36, 28, FONTE_ROTULO) : 0;
    const eCta = encaixar(m.texto, { largura: 840, max: 64, min: 48, linhas: 2, fonte: FONTE_ITALICO });
    const tamanhoCta = eCta.tamanho;
    const alturaNome = linhasNome * tamanhoNome * 1.04;
    const alturaArea = temArea ? 26 + 36 : 0;
    const alturaCta = eCta.linhas.length * tamanhoCta * 1.1;
    // botão: ícone + nome em caixa alta, largura medida
    const rotuloBotao = nomeDoBotao(m);
    const tamanhoBotao = corpoQueCabe([rotuloBotao], 560, 34, 28, { ...FONTE_ROTULO, espacamento: 0.22 });
    const larguraBotao = Math.round(Math.max(300, 118 + larguraTexto(rotuloBotao, tamanhoBotao, { ...FONTE_ROTULO, espacamento: 0.22 }) + 52));
    // nome · área · filete · chamada · botão
    const total = alturaNome + alturaArea + 44 + alturaCta + 38 + 88;
    const linha = Math.round(Math.max(620, Math.min(900, TOPO_SEGURO + 2 * RESPIRO_FECHO + total + FOLGA_DA_LINHA)));
    const topo = TOPO_SEGURO + Math.max(0, (linha - FOLGA_DA_LINHA - TOPO_SEGURO - total) / 2);
    const topoNome = topo;
    const topoArea = topo + alturaNome + 26;
    const yFilete = topo + alturaNome + alturaArea + 22;
    const topoCta = yFilete + 22;
    const topoBotao = topoCta + alturaCta + 38;
    return {
      linha,
      temNome,
      temArea,
      tamanhoNome,
      linhasNome: eNome?.linhas ?? [],
      tamanhoArea,
      tamanhoCta,
      linhasCta: eCta.linhas,
      topoNome,
      topoArea,
      yFilete,
      topoCta,
      topoBotao,
      rotuloBotao,
      tamanhoBotao,
      larguraBotao,
    };
  });
