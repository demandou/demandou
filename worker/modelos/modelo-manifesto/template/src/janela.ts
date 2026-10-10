// A palavra-janela dos blocos universais: uma palavra curta do próprio texto, quebrada em linhas de
// 2 a 3 letras, como num cartaz ("VO/CÊ", "AGO/RA", "CO/ME/ÇA"). O plano pode escolher (`janela`);
// sem isso, o template procura sozinho uma palavra curta e forte no texto.
import { caixaAlta } from "./tema";

// palavras de ligação: nunca viram janela sozinhas
const FRACAS = new Set(
  (
    "A O AS OS UM UMA UNS UMAS DE DA DO DAS DOS EM NA NO NAS NOS E OU QUE SE POR PRA PRO PARA COM MAS NEM AO AOS À ÀS " +
    "ME TE LHE SEU SUA SEUS SUAS MEU MINHA TEU TUA ESSE ESSA ESTE ESTA ISSO ISTO AQUI ALI LÁ É ERA SÃO FOI SER TER TEM " +
    "VAI VOU HÁ COMO QUAL ONDE QUEM ENTÃO AINDA TAMBÉM BEM MUITO MAIS MENOS ATÉ SOBRE ENTRE APÓS DESDE ELE ELA ELES " +
    "ELAS NÓS EU TU LO LA LOS LAS NUM NUMA DUM DUMA PELO PELA PELOS PELAS"
  ).split(" "),
);
// … mas estas, quando vêm sozinhas e com força, são ótimas janelas
const FORTES = new Set(["EU", "NÃO", "SIM", "JÁ", "SEM", "VAI", "TEM", "É", "HÁ", "MAIS", "MENOS", "ATÉ"]);

export const limpar = (w: string) => caixaAlta(w).replace(/[^\p{L}\p{N}]/gu, "");

// a palavra serve de janela? (2 a 6 letras ou algarismos, não é palavra de ligação)
export const serveDeJanela = (w: string, fortes = false) => {
  const l = limpar(w);
  if (l.length < 2 || l.length > 6) return false;
  if (FRACAS.has(l)) return fortes && FORTES.has(l);
  return true;
};

const VOGAL = /[AEIOUÁÀÂÃÉÊÍÓÔÕÚÜ]/;
const GRUPOS = new Set(["BR", "CR", "DR", "FR", "GR", "PR", "TR", "VR", "BL", "CL", "FL", "GL", "PL", "CH", "LH", "NH", "QU", "GU"]);

// Sílabas aproximadas (bastam para quebrar a palavra num cartaz): corta antes de consoante+vogal e
// entre duas consoantes, sem separar os grupos (BR, CH, LH, NH…).
export const silabas = (palavra: string) => {
  const p = [...palavra];
  const cortes: number[] = [];
  for (let i = 1; i < p.length; i++) {
    const a = p[i - 1];
    const b = p[i];
    const c = p[i + 1];
    const vA = VOGAL.test(a);
    const vB = VOGAL.test(b);
    if (vA && !vB && c && VOGAL.test(c)) cortes.push(i); // VO|CÊ
    else if (vA && !vB && c && GRUPOS.has(b + c) && p[i + 2] && VOGAL.test(p[i + 2])) cortes.push(i); // LU|CRO
    else if (!vA && !vB && c && VOGAL.test(c) && !GRUPOS.has(a + b) && i >= 2 && VOGAL.test(p[i - 2])) cortes.push(i); // AL|TA
  }
  const partes: string[] = [];
  let ini = 0;
  for (const c of cortes) {
    partes.push(p.slice(ini, c).join(""));
    ini = c;
  }
  partes.push(p.slice(ini).join(""));
  return partes.filter(Boolean);
};

// Quebra a palavra em linhas de 2 a 3 letras (a primeira com 2 ou 3: o rosto fica nela).
// "VO/CÊ" no plano manda: a barra marca onde quebrar.
export const linhasDaJanela = (palavra: string): string[] => {
  if (palavra.includes("/")) return palavra.split("/").map((l) => limpar(l)).filter(Boolean);
  const w = limpar(palavra);
  if (w.length <= 3) return [w];
  // números ficam inteiros (83, 2026)
  if (/^\p{N}+$/u.test(w)) return w.length <= 4 ? [w] : [w.slice(0, w.length - 3), w.slice(-3)];
  const sil = silabas(w);
  // junta sílabas em linhas de até 3 letras; sílaba maior que 3 fica sozinha
  const linhas: string[] = [];
  for (const s of sil) {
    const ultima = linhas[linhas.length - 1];
    if (ultima !== undefined && ultima.length + s.length <= 3) linhas[linhas.length - 1] = ultima + s;
    else linhas.push(s);
  }
  // uma letra sozinha não segura o rosto: junta com a vizinha
  for (let i = 0; i < linhas.length; i++) {
    if (linhas[i].length === 1) {
      if (i + 1 < linhas.length) {
        linhas[i + 1] = linhas[i] + linhas[i + 1];
        linhas.splice(i, 1);
        i--;
      } else if (i > 0) {
        linhas[i - 1] += linhas[i];
        linhas.splice(i, 1);
      }
    }
  }
  // sem sílabas boas (ditongo, "MAIS"): 4 letras ficam numa linha só; 5 ou 6, divididas ao meio
  if (linhas.length === 1 && w.length >= 5) return [w.slice(0, 3), w.slice(3)];
  return linhas;
};

// Candidatas a janela num texto, da melhor para a pior: as do destaque (da última para a primeira),
// depois as outras (da última para a primeira: a frase costuma terminar na palavra para onde aponta).
// Devolve o índice da palavra no texto.
export const candidatas = (palavras: string[], destaque?: { de: number; ate: number }) => {
  const idx = palavras.map((_, i) => i);
  const ok = (i: number) => serveDeJanela(palavras[i], true);
  const noDestaque = destaque ? idx.filter((i) => i >= destaque.de && i < destaque.ate && ok(i)).reverse() : [];
  const outras = idx.filter((i) => ok(i) && !noDestaque.includes(i) && !FRACAS.has(limpar(palavras[i]))).reverse();
  const fracasFortes = idx.filter((i) => ok(i) && !noDestaque.includes(i) && FRACAS.has(limpar(palavras[i]))).reverse();
  return [...noDestaque, ...outras, ...fracasFortes];
};

// Acha um trecho (sequência de palavras) dentro do texto, ignorando caixa e pontuação.
export const acharTrecho = (palavras: string[], trecho?: string) => {
  if (!trecho) return undefined;
  const alvo = trecho.split(/\s+/).map(limpar).filter(Boolean);
  if (!alvo.length) return undefined;
  const limpas = palavras.map(limpar);
  for (let i = 0; i + alvo.length <= limpas.length; i++) {
    if (alvo.every((a, k) => limpas[i + k] === a)) return { de: i, ate: i + alvo.length };
  }
  return undefined;
};
