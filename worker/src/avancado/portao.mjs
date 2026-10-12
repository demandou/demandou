/**
 * O PORTÃO DO CÓDIGO ESCRITO PELA IA (editor avançado, 10/10/2026).
 *
 * A cena do corte é código React escrito pelo Claude e executado no Chrome do
 * render. Antes de qualquer execução, este portão (puro, sem disco nem rede)
 * confere o texto:
 *
 *   1. os nomes de arquivo (só roteiro.json, comum.tsx e cena-NN.tsx);
 *   2. os imports, contra uma lista fechada (react, remotion, @remotion/three,
 *      three, @react-three/fiber, o kit e as outras cenas);
 *   3. o que as aulas e o remotion-best-practices proíbem (useFrame, animação
 *      e transição de CSS, relógio próprio, Math.random, Date) e o que a
 *      segurança proíbe (rede, disco, eval, globais do navegador, mídia fora
 *      do kit, delayRender, estado entre quadros);
 *   4. o roteiro: âncoras na fala que existem, caixas dentro do quadro, a
 *      legenda numa faixa livre longe da borda de baixo;
 *   5. o portão de tempo: todo `dito("...")` com texto literal que está na fala.
 *
 * O tsc, o bundle e o render vêm depois, num processo separado, só dentro da
 * pasta do trabalho (render-isolado.mjs).
 */

export const IMPORTS_PERMITIDOS = new Set(["react", "remotion", "@remotion/three", "three", "@react-three/fiber", "../kit"]);
export const TETO_DE_CENAS = 12;
export const TETO_DO_ARQUIVO = 60_000;
export const TECNICAS = ["maquete-3d", "recorte-letreiro", "graficos", "moldura-explicativa"];
const FORMAS = new Set(["reta", "arredondada", "assimetrica", "chanfrada"]);

/** O arquivo que a IA pode escrever em src/cenas. */
export function nomeDeArquivoValido(nome) {
  return nome === "roteiro.json" || nome === "comum.tsx" || /^cena-\d{2}\.tsx$/.test(nome);
}

/** Import relativo permitido: o kit e os arquivos de cena irmãos. */
function importPermitido(origem) {
  return IMPORTS_PERMITIDOS.has(origem) || /^\.\/(cena-\d{2}|comum)$/.test(origem);
}

/**
 * Separa o código dos textos: devolve o código com comentários e conteúdo de
 * string trocados por espaço (mesmas posições, para o número da linha valer)
 * e a lista das strings. Expressões dentro de template (`${...}`) continuam
 * sendo código.
 */
export function separarTextos(codigo) {
  const saida = codigo.split("");
  const textos = [];
  const n = codigo.length;
  let i = 0;
  const branco = (a, b) => {
    for (let x = a; x < b; x++) if (saida[x] !== "\n") saida[x] = " ";
  };
  // pilha de templates abertos: quando um `${` fecha, voltamos para dentro do template
  const pilha = [];
  let chaves = 0;
  const lerString = (aspa) => {
    const inicio = i;
    i++;
    let valor = "";
    while (i < n && codigo[i] !== aspa) {
      if (codigo[i] === "\\") {
        valor += codigo[i + 1] ?? "";
        i += 2;
        continue;
      }
      if (codigo[i] === "\n") break;
      valor += codigo[i];
      i++;
    }
    textos.push({ valor, pos: inicio });
    branco(inicio + 1, i);
    i++;
  };
  const lerTemplate = () => {
    // i está logo depois da crase (ou do } que fechou um ${)
    const inicio = i;
    let valor = "";
    while (i < n) {
      if (codigo[i] === "\\") {
        valor += codigo[i + 1] ?? "";
        i += 2;
        continue;
      }
      if (codigo[i] === "`") {
        textos.push({ valor, pos: inicio });
        branco(inicio, i);
        i++;
        return;
      }
      if (codigo[i] === "$" && codigo[i + 1] === "{") {
        textos.push({ valor, pos: inicio });
        branco(inicio, i);
        i += 2;
        pilha.push(chaves);
        chaves = 0;
        return;
      }
      valor += codigo[i];
      i++;
    }
    branco(inicio, i);
  };
  while (i < n) {
    const c = codigo[i];
    const d = codigo[i + 1];
    if (c === "/" && d === "/") {
      const fim = codigo.indexOf("\n", i);
      const ate = fim < 0 ? n : fim;
      branco(i, ate);
      i = ate;
    } else if (c === "/" && d === "*") {
      const fim = codigo.indexOf("*/", i + 2);
      const ate = fim < 0 ? n : fim + 2;
      branco(i, ate);
      i = ate;
    } else if (c === '"' || c === "'") {
      lerString(c);
    } else if (c === "`") {
      i++;
      lerTemplate();
    } else if (c === "{") {
      chaves++;
      i++;
    } else if (c === "}") {
      if (pilha.length && chaves === 0) {
        chaves = pilha.pop();
        i++;
        lerTemplate();
      } else {
        chaves = Math.max(0, chaves - 1);
        i++;
      }
    } else {
      i++;
    }
  }
  return { codigo: saida.join(""), textos };
}

const linhaDe = (texto, pos) => texto.slice(0, pos).split("\n").length;

/** As regras do código, com o motivo que volta para a IA corrigir. */
const REGRAS = [
  { re: /\buseFrame\b/, motivo: "useFrame é proibido (aula 8.1 e remotion-best-practices): o 3D anda pelo quadro (useTempo/useCurrentFrame)" },
  { re: /@keyframes|\banimation(Name|Duration|Delay|IterationCount|TimingFunction)?\s*:/, motivo: "animação de CSS não sai no render: anime pelo quadro com k()/interpolate()" },
  { re: /\btransition(Property|Duration|Delay|TimingFunction)?\s*:/, motivo: "transição de CSS não sai no render: anime pelo quadro com k()/interpolate()" },
  { re: /\bMath\s*\.\s*random\b/, motivo: "Math.random muda a cada quadro e entre as abas do render: use números fixos" },
  { re: /\bDate\b|\bperformance\s*\./, motivo: "relógio próprio é proibido: o tempo é o do quadro (useTempo)" },
  { re: /\b(setTimeout|setInterval|requestAnimationFrame|requestIdleCallback|queueMicrotask)\b/, motivo: "relógio próprio é proibido: o tempo é o do quadro (useTempo)" },
  { re: /\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|RTCPeerConnection|Image|FontFace|WebTransport)\b|\bopen\s*\(/, motivo: "a cena não acessa a rede nem carrega nada de fora" },
  { re: /\b(createElement|innerHTML|outerHTML|insertAdjacentHTML|alert|confirm|prompt|print)\b/, motivo: "a cena não mexe no documento: só o JSX dela" },
  { re: /\bimport\s*\(|\brequire\s*\(/, motivo: "import dinâmico e require são proibidos: só os imports fixos da lista" },
  { re: /\b(window|document|globalThis|self|navigator|location|localStorage|sessionStorage|indexedDB|caches|process)\b/, motivo: "a cena não usa globais do navegador nem do Node: só o kit, o React e o Remotion" },
  { re: /\b(eval|Function|Reflect|Proxy|WebAssembly|SharedArrayBuffer|Atomics)\b|\.constructor\b|__proto__|\bprototype\b/, motivo: "código dinâmico é proibido (eval, Function, constructor, Proxy)" },
  { re: /\b(Worker|SharedWorker|ServiceWorker|postMessage|importScripts|BroadcastChannel)\b/, motivo: "a cena não abre processo nem canal" },
  { re: /\b(staticFile|OffthreadVideo|Video|Audio|Img|IFrame|Html5Video|Html5Audio|AnimatedImage|CanvasImage|Gif|Lottie|prefetch)\b/, motivo: "mídia é do kit: o apresentador, a voz e as letras já entram pelo Palco; a cena só desenha" },
  { re: /\b(delayRender|continueRender|cancelRender|getInputProps|getRemotionEnvironment)\b/, motivo: "a cena não segura nem cancela o render" },
  { re: /\b(useState|useEffect|useLayoutEffect|useInsertionEffect|useReducer|useRef|useSyncExternalStore|useTransition|useDeferredValue|useImperativeHandle)\b/, motivo: "estado entre quadros quebra o render paralelo: a cena é função do quadro (use useMemo para o que é caro)" },
  { re: /\b(async|await|Promise)\b/, motivo: "a cena é síncrona: nada de async, await ou Promise" },
  { re: /dangerouslySetInnerHTML|<\s*(script|iframe|object|embed|link|style|img|video|audio|source|meta|base)\b/i, motivo: "a cena não injeta HTML, estilo global nem mídia" },
  { re: /while\s*\(\s*(true|1)\s*\)|for\s*\(\s*;\s*;\s*\)/, motivo: "laço sem fim é proibido" },
];

/** O lint de um arquivo de cena (.tsx). Devolve a lista de problemas (vazia passa). */
export function lintDaCena(codigo, arquivo = "cena.tsx") {
  const problemas = [];
  if (codigo.length > TETO_DO_ARQUIVO) problemas.push({ arquivo, linha: 1, motivo: `arquivo grande demais (${codigo.length} caracteres; teto ${TETO_DO_ARQUIVO})` });
  const { codigo: limpo, textos } = separarTextos(codigo);
  for (const r of REGRAS) {
    const re = new RegExp(r.re.source, r.re.flags.includes("g") ? r.re.flags : `${r.re.flags}g`);
    for (const m of limpo.matchAll(re)) {
      problemas.push({ arquivo, linha: linhaDe(limpo, m.index), motivo: `${r.motivo} (achado: ${m[0].trim()})` });
      break;
    }
  }
  // os imports, contra a lista (e nada de import sem "from" nem de reexportar de fora)
  const reImport = /^\s*(import|export)\b[^;'"`]*?\bfrom\s*(["'])([^"']+)\2/gm;
  for (const m of codigo.matchAll(reImport)) {
    if (!importPermitido(m[3])) problemas.push({ arquivo, linha: linhaDe(codigo, m.index), motivo: `import fora da lista: "${m[3]}" (permitidos: ${[...IMPORTS_PERMITIDOS].join(", ")}, ./cena-NN e ./comum)` });
  }
  for (const m of codigo.matchAll(/^\s*import\s*(["'])([^"']+)\1/gm)) {
    problemas.push({ arquivo, linha: linhaDe(codigo, m.index), motivo: `import sem uso de nome é proibido: "${m[2]}"` });
  }
  // texto: sem travessão (regra do Bruno) e sem endereço de rede
  for (const s of textos) {
    if (/[—–]/.test(s.valor)) problemas.push({ arquivo, linha: linhaDe(codigo, s.pos), motivo: `travessão no texto ("${s.valor.slice(0, 40)}"): use vírgula, dois-pontos ou ponto` });
    if (/\b(https?|wss?|ftp|file|data|blob|javascript):|\/\/[a-z0-9.-]+\.[a-z]{2,}/i.test(s.valor)) problemas.push({ arquivo, linha: linhaDe(codigo, s.pos), motivo: `endereço no texto ("${s.valor.slice(0, 40)}"): a cena não carrega nada de fora` });
  }
  // o travessão também no texto do JSX (fora de string e de comentário)
  limpo.split("\n").forEach((l, i) => {
    if (/[—–]/.test(l)) problemas.push({ arquivo, linha: i + 1, motivo: "travessão no texto da cena: use vírgula, dois-pontos ou ponto" });
  });
  // as exportações que o Palco usa
  if (arquivo !== "comum.tsx" && !/export\s+(const|function)\s+(Atras|Frente)\b/.test(codigo)) {
    problemas.push({ arquivo, linha: 1, motivo: "a cena precisa exportar Atras e/ou Frente (export const Atras: React.FC<CenaProps> = ...)" });
  }
  // o portão de tempo: dito()/ditoAte() só com texto literal
  for (const m of limpo.matchAll(/\b(dito|ditoAte)\s*\(/g)) {
    const resto = codigo.slice(m.index + m[0].length).trimStart();
    if (!/^["'`]/.test(resto)) problemas.push({ arquivo, linha: linhaDe(limpo, m.index), motivo: `${m[1]}() só com o texto da fala entre aspas (o portão de tempo confere cada um)` });
  }
  return problemas;
}

/** Os dito("frase", n) do código: frase e vez, para conferir contra a fala. */
export function ditosDoCodigo(codigo) {
  const lista = [];
  for (const m of codigo.matchAll(/\b(?:dito|ditoAte)\s*\(\s*(["'`])((?:(?!\1)[^\\]|\\.)*)\1\s*(?:,\s*(\d+)\s*)?\)/g)) {
    lista.push({ frase: m[2], vez: m[3] ? Number(m[3]) : 1 });
  }
  return lista;
}

// ─────────────────────────── a fala (a mesma conta do kit/tempo.ts) ───────────────────────────

export function normalizar(w) {
  return String(w)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** A n-ésima vez em que a frase é dita: { i, j } (índices da primeira e da última palavra) ou null. */
export function acharNaFala(palavras, frase, n = 1) {
  const alvo = normalizar(frase).split(" ").filter(Boolean);
  if (!alvo.length) return null;
  const tokens = [];
  palavras.forEach((p, i) => normalizar(p.w).split(" ").filter(Boolean).forEach((t) => tokens.push({ t, i })));
  let vez = 0;
  for (let a = 0; a + alvo.length <= tokens.length; a++) {
    let ok = true;
    for (let b = 0; b < alvo.length; b++) {
      if (tokens[a + b].t !== alvo[b]) {
        ok = false;
        break;
      }
    }
    if (ok && ++vez === n) return { i: tokens[a].i, j: tokens[a + alvo.length - 1].i };
  }
  return null;
}

/** O segundo de uma âncora do roteiro (o mesmo `emSegundos` do kit), ou null quando a palavra não está na fala. */
export function segundosDaAncora(a, palavras, duracao, padrao = 0) {
  let s;
  if (a === undefined) s = padrao;
  else if (a === "inicio") s = 0;
  else if (a === "fim") s = duracao;
  else if (typeof a === "number") s = a;
  else if (a && typeof a === "object" && typeof a.palavra === "string") {
    const r = acharNaFala(palavras, a.palavra, a.vez ?? 1);
    if (!r) return null;
    s = palavras[r.i].de + (Number(a.mais) || 0);
  } else return null;
  return Math.min(duracao, Math.max(0, s));
}

const descreverAncora = (a) => (a && typeof a === "object" ? `"${a.palavra}"${a.vez > 1 ? ` (vez ${a.vez})` : ""}` : JSON.stringify(a));

/**
 * O roteiro (src/cenas/roteiro.json) contra a fala e o quadro. Devolve os
 * problemas; vazio passa. `arquivos` são os nomes escritos nesta volta.
 */
export function conferirRoteiro(roteiro, { palavras, duracao, temRecorte, arquivos, quadro = null, adaptativo = false }) {
  const problemas = [];
  // o quadro do corte: 1080 × 1920 em pé (os cortes) ou 1920 × 1080 deitado (o completo, 11/10)
  const QW = Number(quadro?.largura) > 0 ? Number(quadro.largura) : 1080;
  const QH = Number(quadro?.altura) > 0 ? Number(quadro.altura) : 1920;
  // a borda de baixo da legenda: 1840 em 1920 (o mesmo respiro proporcional no deitado, 1035 em 1080)
  const fimDaLegenda = Math.round(QH * (1840 / 1920));
  const topoDaLegenda = Math.round(QH * (120 / 1920));
  const p = (motivo) => problemas.push({ arquivo: "roteiro.json", linha: 1, motivo });
  if (!roteiro || typeof roteiro !== "object") return [{ arquivo: "roteiro.json", linha: 1, motivo: "o roteiro não é um objeto JSON" }];
  if (!TECNICAS.includes(roteiro.tecnica)) p(`tecnica inválida: ${roteiro.tecnica} (use ${TECNICAS.join(", ")})`);
  // A MAQUETE É A COISA QUE A FALA NOMEIA (11/10, crítica do Bruno ao teste: "o que a casa tem a ver com o
  // que está sendo dito? o que são aqueles potes com uma bola?"). Na 8.1 o roteiro declara o objeto e a
  // palavra da fala que o nomeia; palavra que não foi dita reprova (a tenda da aula: "estica a corda").
  if (roteiro.tecnica === "maquete-3d") {
    const o = roteiro.objeto;
    if (!o || typeof o !== "object" || !String(o.nome ?? "").trim() || !String(o.palavra ?? "").trim()) {
      p('maquete-3d: falta "objeto": {"nome", "palavra"} com o objeto físico que a fala nomeia (a maquete é ESSA coisa, nunca uma metáfora abstrata)');
    } else if (!acharNaFala(palavras, String(o.palavra))) {
      p(`maquete-3d: o objeto "${o.nome}" não foi nomeado na fala ("${o.palavra}" não foi dito); escolha uma coisa que a pessoa nomeia com todas as letras`);
    }
  }
  if (roteiro.fundo !== undefined && !["estudio", "liso", "grade"].includes(roteiro.fundo)) p(`fundo inválido: ${roteiro.fundo}`);
  if (roteiro.paralaxe !== undefined && !(Number(roteiro.paralaxe) >= 0 && Number(roteiro.paralaxe) <= 1.5)) p("paralaxe fora de 0 a 1,5");
  const ancora = (a, onde, { obrigatoriaNaFala = false } = {}) => {
    if (obrigatoriaNaFala && !(a && typeof a === "object") && a !== "inicio" && a !== 0) {
      p(`${onde}: a entrada precisa estar presa a uma palavra da fala ({"palavra": "..."}), não a um número`);
      return null;
    }
    const s = segundosDaAncora(a, palavras, duracao);
    if (s === null) p(`${onde}: a âncora ${descreverAncora(a)} não está na fala do corte`);
    if (a && typeof a === "object" && a.mais !== undefined && !(Math.abs(Number(a.mais)) <= 0.6)) p(`${onde}: "mais" fora de -0,6 a 0,6 s (o que entra na tela entra com a palavra)`);
    return s;
  };
  const caixaOk = (c, onde) => {
    if (c === undefined) return;
    const ok = c && ["x", "y", "l", "a"].every((k) => Number.isFinite(Number(c[k])));
    if (!ok) return p(`${onde}: caixa precisa de x, y, l e a numéricos`);
    if (c.l < 0 || c.a < 0 || c.x < -200 || c.y < -200 || c.x + c.l > QW + 200 || c.y + c.a > QH + 200) p(`${onde}: caixa fora do quadro ${QW} × ${QH}`);
  };
  if (!Array.isArray(roteiro.apresentador) || !roteiro.apresentador.length) p("apresentador precisa de pelo menos um quadro");
  else {
    roteiro.apresentador.forEach((q, i) => {
      const onde = `apresentador[${i}]`;
      ancora(q.em, onde);
      caixaOk(q.caixa, onde);
      if (q.forma !== undefined && !FORMAS.has(q.forma)) p(`${onde}: forma inválida (${q.forma})`);
      if (q.recorte && !temRecorte) p(`${onde}: este corte não tem recorte com alfa; use recorte: false`);
      // A JANELA BAIXA DO RECORTE (12/10, o teste do Bruno): janela no meio da tela deixava a pessoa
      // cortada nos ombros e uma faixa vazia embaixo. No corte em pé, a base dela fica em 1700 ou mais.
      if (adaptativo && q.recorte && QH > QW && q.caixa && Number(q.caixa.a) > 0 && Number(q.caixa.y) + Number(q.caixa.a) < Math.round(QH * (1700 / 1920))) {
        p(`${onde}: com recorte, a janela fica baixa e larga: a base dela (y + a) precisa ficar em ${Math.round(QH * (1700 / 1920))} ou mais (1802 é a da aula 8.2), sem faixa vazia embaixo`);
      }
      // ...e não vira uma tira: altura de 560 ou mais (a da aula 8.2 é 622), largura de 800 ou mais.
      if (adaptativo && q.recorte && QH > QW && q.caixa && Number(q.caixa.a) > 0 && (Number(q.caixa.a) < 560 || Number(q.caixa.l) < 800)) {
        p(`${onde}: com recorte, a janela precisa de altura 560 ou mais e largura 800 ou mais (a da aula 8.2: l 940, a 622); uma tira baixa deixa a pessoa pequena`);
      }
      if (q.escala !== undefined && !(q.escala >= 0.2 && q.escala <= 4)) p(`${onde}: escala fora de 0,2 a 4`);
      if (q.inclinacao !== undefined && !(Math.abs(q.inclinacao) <= 12)) p(`${onde}: inclinação acima de 12 graus distorce o rosto`);
      if (q.transicao !== undefined && !(q.transicao >= 0.05 && q.transicao <= 3)) p(`${onde}: transição fora de 0,05 a 3 s`);
    });
  }
  const L = roteiro.legenda;
  if (!L || typeof L !== "object") p("legenda precisa de topo, esquerda e largura");
  else {
    const tamanho = L.tamanho ?? 48;
    if (!(tamanho >= 34 && tamanho <= 64)) p("legenda: tamanho fora de 34 a 64 (legível no celular)");
    if (!(L.esquerda >= 24) || !(L.esquerda + L.largura <= QW - 24)) p("legenda: precisa de 24 px de margem dos lados");
    if (!(L.largura >= 360)) p("legenda: largura pequena demais (mínimo 360)");
    // duas linhas cabem acima de 1840 (em pé) ou 1035 (deitado): longe da borda de baixo (aulas 7 a 8.2)
    if (!(L.topo >= topoDaLegenda) || !(L.topo + tamanho * 1.2 * 2 <= fimDaLegenda)) p(`legenda: as duas linhas precisam terminar acima de y = ${fimDaLegenda} (longe da borda de baixo) e começar abaixo de y = ${topoDaLegenda}`);
  }
  if (!Array.isArray(roteiro.cenas) || !roteiro.cenas.length) p("cenas precisa de pelo menos uma cena");
  else {
    if (roteiro.cenas.length > TETO_DE_CENAS) p(`cenas demais (${roteiro.cenas.length}; teto ${TETO_DE_CENAS})`);
    roteiro.cenas.forEach((c, i) => {
      const onde = `cenas[${i}] (${c.arquivo})`;
      if (!/^cena-\d{2}\.tsx$/.test(c.arquivo ?? "")) p(`${onde}: arquivo precisa ser cena-NN.tsx`);
      else if (arquivos && !arquivos.includes(c.arquivo)) p(`${onde}: o arquivo não foi escrito`);
      const de = ancora(c.de, `${onde}.de`, { obrigatoriaNaFala: true });
      const ate = segundosDaAncora(c.ate, palavras, duracao, duracao);
      if (ate === null) p(`${onde}.ate: a âncora ${descreverAncora(c.ate)} não está na fala do corte`);
      if (de !== null && ate !== null && ate - de < 0.5) p(`${onde}: termina antes de começar (ou dura menos de 0,5 s)`);
      if (!String(c.oQue ?? "").trim()) p(`${onde}: falta oQue (o que a cena explica)`);
    });
  }
  return problemas;
}

/** O portão de tempo do código: todo dito("...") e toda âncora {palavra} estão na fala. */
export function conferirDitos(codigo, arquivo, palavras) {
  return ditosDoCodigo(codigo)
    .filter((d) => !acharNaFala(palavras, d.frase, d.vez))
    .map((d) => ({ arquivo, linha: 1, motivo: `"${d.frase}"${d.vez > 1 ? ` (vez ${d.vez})` : ""} não está na fala do corte (portão de tempo): use exatamente as palavras ditas` }));
}

/**
 * O portão inteiro sobre os arquivos de uma volta: nomes, lint, roteiro e
 * tempo. `arquivos` é { nome: conteúdo }; o roteiro vem como texto JSON.
 */
export function conferirArquivos(arquivos, { palavras, duracao, temRecorte, quadro = null, adaptativo = false }) {
  const problemas = [];
  const nomes = Object.keys(arquivos);
  for (const n of nomes) if (!nomeDeArquivoValido(n)) problemas.push({ arquivo: n, linha: 1, motivo: "nome de arquivo fora do permitido (roteiro.json, comum.tsx, cena-NN.tsx)" });
  if (nomes.filter((n) => n.endsWith(".tsx")).length > TETO_DE_CENAS + 1) problemas.push({ arquivo: "*", linha: 1, motivo: `arquivos demais (teto ${TETO_DE_CENAS} cenas)` });
  let roteiro = null;
  if (!("roteiro.json" in arquivos)) problemas.push({ arquivo: "roteiro.json", linha: 1, motivo: "falta o roteiro.json" });
  else {
    try {
      roteiro = JSON.parse(arquivos["roteiro.json"]);
    } catch (e) {
      problemas.push({ arquivo: "roteiro.json", linha: 1, motivo: `roteiro.json não é JSON válido: ${e instanceof Error ? e.message : e}` });
    }
  }
  if (roteiro) problemas.push(...conferirRoteiro(roteiro, { palavras, duracao, temRecorte, arquivos: nomes, quadro, adaptativo }));
  for (const n of nomes.filter((x) => x.endsWith(".tsx") && nomeDeArquivoValido(x))) {
    problemas.push(...lintDaCena(arquivos[n], n));
    problemas.push(...conferirDitos(arquivos[n], n, palavras));
  }
  return { problemas, roteiro };
}

/** As cenas ativas num instante (para ligar um quadro ao arquivo que o desenhou). */
export function cenasNoInstante(roteiro, t, palavras, duracao) {
  return (roteiro?.cenas ?? []).filter((c) => {
    const de = segundosDaAncora(c.de, palavras, duracao);
    const ate = segundosDaAncora(c.ate, palavras, duracao, duracao);
    return de !== null && ate !== null && t >= de && t < ate;
  });
}

/**
 * Os instantes a olhar na conferência (passo 8 das aulas): um a cada `passo`
 * segundos, o começo assentado de cada cena (0,6 s depois) e o fim de cada
 * transição do apresentador. Sem vizinhos a menos de 0,4 s, no máximo `teto`.
 */
export function instantesDaConferencia(roteiro, palavras, duracao, { passo = 1.5, teto = 36 } = {}) {
  const ts = [];
  for (let t = 0.75; t < duracao - 0.15; t += passo) ts.push(+t.toFixed(2));
  for (const c of roteiro?.cenas ?? []) {
    const de = segundosDaAncora(c.de, palavras, duracao);
    const ate = segundosDaAncora(c.ate, palavras, duracao, duracao);
    if (de !== null && ate !== null) ts.push(+Math.min(ate - 0.1, de + 0.6).toFixed(2));
  }
  for (const q of roteiro?.apresentador ?? []) {
    const em = segundosDaAncora(q.em, palavras, duracao);
    if (em !== null) ts.push(+Math.min(duracao - 0.1, em + (q.transicao ?? 0.9) + 0.1).toFixed(2));
  }
  ts.sort((a, b) => a - b);
  const unicos = [];
  for (const t of ts) if (t >= 0 && t < duracao && (!unicos.length || t - unicos[unicos.length - 1] >= 0.4)) unicos.push(t);
  if (unicos.length <= teto) return unicos;
  return Array.from({ length: teto }, (_, i) => unicos[Math.floor((i * unicos.length) / teto)]);
}
