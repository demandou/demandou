// Monta as linhas de legenda a partir das palavras do plano. Faz parte do motor:
// é o mesmo em todos os modelos e também é usado pelo scripts/legendas.mjs.
import type { Palavra, Plano } from "../plano";

type Faixa = { de: number; ate: number };
export type Frase = { de: number; ate: number; palavras: Palavra[] };

const MAX_CARACTERES = 34;
const dentro = (t: number, faixas: Faixa[]) => faixas.some((f) => t >= f.de && t < f.ate);
// palavras que não podem terminar uma linha: artigos, preposições, conjunções… e números
// sem pontuação, que ficam presos ao que vem depois ("60 | mil", "20 | minutos")
const FUNCIONAIS = new Set(
  "a o as os e é um uma uns umas de do da dos das em no na nos nas ao aos à às que se eu te me lhe com por pra pro pras pros para sem sua seu mas ou nem já".split(" "),
);
const curta = (p: Palavra) =>
  !/[.?!…,;:]$/.test(p.w) && (FUNCIONAIS.has(p.w.toLowerCase()) || /^(r\$)?\d+([.,]\d+)?%?$/i.test(p.w));
const texto = (f: { palavras: Palavra[] }) => f.palavras.map((p) => p.w).join(" ");

// Onde a legenda não aparece: durante momentos que já mostram o que é dito.
export const faixasSemLegenda = (plano: Plano): Faixa[] => [
  ...plano.momentos.filter((m) => !m.legenda).map((m) => ({ de: m.de - 0.05, ate: m.ate })),
  ...(plano.semLegenda ?? []),
];

// Aplica `correcoes`: uma ou mais palavras seguidas viram outra coisa ("chat GPT" → "ChatGPT");
// substituir por "" apaga. A pontuação colada na última palavra é preservada.
export const corrigirPalavras = (palavras: Palavra[], correcoes: Record<string, string> = {}): Palavra[] => {
  const regras = Object.entries(correcoes)
    .map(([de, para]) => ({ de: de.trim().split(/\s+/), para }))
    .filter((r) => r.de[0])
    .sort((a, b) => b.de.length - a.de.length);
  if (regras.length === 0) return palavras;
  const nucleo = (w: string) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
  const saida: Palavra[] = [];
  for (let i = 0; i < palavras.length; i++) {
    const regra = regras.find((r) => r.de.every((w, k) => palavras[i + k] && (nucleo(palavras[i + k].w) || palavras[i + k].w) === (nucleo(w) || w)));
    if (!regra) {
      saida.push(palavras[i]);
      continue;
    }
    const ultima = palavras[i + regra.de.length - 1];
    const pontuacao = ultima.w.match(/[^\p{L}\p{N}]+$/u)?.[0] ?? "";
    // se a correção já traz a própria pontuação ("Ré?", "4-7-8."), ela vale no lugar da original
    const temPontuacao = /[^\p{L}\p{N}]$/u.test(regra.para);
    if (regra.para) saida.push({ em: palavras[i].em, ate: ultima.ate, w: temPontuacao ? regra.para : `${regra.para}${pontuacao}` });
    i += regra.de.length - 1;
  }
  return saida;
};

// Agrupa as palavras em linhas: quebra em pontuação, pausa ou limite de largura,
// sem deixar palavra curta ("e", "de", "um") pendurada no fim da linha.
export const montarFrases = (plano: Plano): Frase[] => {
  const semLegenda = faixasSemLegenda(plano);
  const visiveis = corrigirPalavras(plano.palavras, plano.correcoes).filter((p) => !dentro(p.em, semLegenda));
  const frases: Frase[] = [];
  let atual: Palavra[] = [];
  let caracteres = 0;

  const fechar = (moverCurtas: boolean) => {
    const sobra: Palavra[] = [];
    while (moverCurtas && atual.length > 2 && curta(atual[atual.length - 1]) && sobra.length < 2) {
      sobra.unshift(atual.pop() as Palavra);
    }
    frases.push({ de: atual[0].em, ate: atual[atual.length - 1].ate, palavras: atual });
    atual = sobra;
    caracteres = sobra.reduce((n, x) => n + x.w.length + 1, 0);
  };

  visiveis.forEach((p, i) => {
    atual.push(p);
    caracteres += p.w.length + 1;
    const prox = visiveis[i + 1];
    const fimDeFrase = /[.?!…]$/.test(p.w);
    // vírgula entre números ("80, 90, 99%") não quebra
    const virgula = /[,;:]$/.test(p.w) && caracteres > 16 && !(/\d,$/.test(p.w) && prox && /^\d/.test(prox.w));
    const semProxima = !prox || semLegenda.some((f) => f.de >= p.em && f.de < prox.em);
    const pausa = !semProxima && prox.em - p.ate > 0.55;
    const estoura = !!prox && caracteres + prox.w.length > MAX_CARACTERES;
    if (fimDeFrase || virgula || semProxima) fechar(false);
    else if (pausa || estoura) fechar(true);
  });
  if (atual.length) fechar(false);

  // palavra sozinha no fim de uma fala sobe para a linha anterior (ou a anterior empresta uma)
  for (let i = frases.length - 1; i > 0; i--) {
    const [antes, esta] = [frases[i - 1], frases[i]];
    const continua = esta.palavras.length === 1 && esta.de - antes.ate < 0.4 && !/[.?!…]$/.test(texto(antes));
    if (continua && texto(antes).length + texto(esta).length + 1 <= MAX_CARACTERES + 8) {
      antes.palavras.push(...esta.palavras);
      antes.ate = esta.ate;
      frases.splice(i, 1);
    } else if (continua && antes.palavras.length >= 3) {
      // desce uma palavra — e mais as curtas que ficariam penduradas ("de um")
      do {
        const desce = antes.palavras.pop() as Palavra;
        esta.palavras.unshift(desce);
        esta.de = desce.em;
      } while (antes.palavras.length > 2 && curta(antes.palavras[antes.palavras.length - 1]) && esta.palavras.length < 4);
      antes.ate = antes.palavras[antes.palavras.length - 1].ate;
    }
  }

  // cada linha fica na tela até a próxima começar, um instante depois de terminar,
  // ou até um momento entrar
  return frases.map((f, i) => {
    const proxima = frases[i + 1];
    const limite = semLegenda.filter((s) => s.de > f.de).map((s) => s.de);
    return { ...f, ate: Math.min(f.ate + 0.35, proxima ? proxima.de : Infinity, ...limite, plano.duracao) };
  });
};
