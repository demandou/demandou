// Acordes: dicionário das posições abertas mais ensinadas, leitura da forma e nome em português.
// Formas da 6ª corda (Mi grave) para a 1ª (mi agudo). x = não toca, 0 = corda solta.
// Dedos: 1 indicador, 2 médio, 3 anelar, 4 mínimo (0/x = sem dedo).
import type { Acorde } from "./plano";

export const DICIONARIO: Record<string, { forma: string; dedos: string }> = {
  C: { forma: "x32010", dedos: "x32010" },
  D: { forma: "xx0232", dedos: "xx0132" },
  E: { forma: "022100", dedos: "023100" },
  // pestana na 1ª casa
  F: { forma: "133211", dedos: "134211" },
  G: { forma: "320003", dedos: "210003" },
  A: { forma: "x02220", dedos: "x01230" },
  // pestana na 2ª casa
  B: { forma: "x24442", dedos: "x12341" },
  Am: { forma: "x02210", dedos: "x02310" },
  // pestana na 2ª casa
  Bm: { forma: "x24432", dedos: "x13421" },
  Dm: { forma: "xx0231", dedos: "xx0231" },
  Em: { forma: "022000", dedos: "023000" },
  A7: { forma: "x02020", dedos: "x02030" },
  B7: { forma: "x21202", dedos: "x21304" },
  C7: { forma: "x32310", dedos: "x32410" },
  D7: { forma: "xx0212", dedos: "xx0213" },
  E7: { forma: "020100", dedos: "020100" },
  G7: { forma: "320001", dedos: "320001" },
};

const RAIZES: Record<string, { nome: string; nota: number }> = {
  C: { nome: "Dó", nota: 0 },
  D: { nome: "Ré", nota: 2 },
  E: { nome: "Mi", nota: 4 },
  F: { nome: "Fá", nota: 5 },
  G: { nome: "Sol", nota: 7 },
  A: { nome: "Lá", nota: 9 },
  B: { nome: "Si", nota: 11 },
};

const QUALIDADES: [RegExp, string][] = [
  [/^m7\(?b5\)?$/, "meio diminuto"],
  [/^(maj7|7M)$/, "com sétima maior"],
  [/^m7$/, "menor com sétima"],
  [/^m$/, "menor"],
  [/^7$/, "com sétima"],
  [/^dim7?$|^°$/, "diminuto"],
  [/^sus4$/, "com quarta"],
  [/^sus2$/, "com segunda"],
  [/^(aug|\+)$/, "aumentado"],
  [/^$/, ""],
];

// "F#m" → { raiz: "F", acidente: "#", resto: "m" }
const partes = (cifra: string) => {
  const m = cifra.trim().match(/^([A-G])([#b]?)(.*)$/);
  return m ? { raiz: m[1], acidente: m[2], resto: m[3].split("/")[0] } : null;
};

// Nome falado em português: "Em" → "Mi menor", "F#m" → "Fá sustenido menor", "A7" → "Lá com sétima"
export const nomeDoAcorde = (cifra: string) => {
  const p = partes(cifra);
  if (!p) return cifra;
  const raiz = `${RAIZES[p.raiz].nome}${p.acidente === "#" ? " sustenido" : p.acidente === "b" ? " bemol" : ""}`;
  const qualidade = QUALIDADES.find(([re]) => re.test(p.resto))?.[1];
  return qualidade === undefined ? `${raiz} ${p.resto}` : `${raiz}${qualidade ? ` ${qualidade}` : ""}`;
};

// Nota da raiz (0 = Dó … 11 = Si), para o som de corda de cada acorde
export const notaDaRaiz = (cifra: string) => {
  const p = partes(cifra);
  if (!p) return 7;
  return (RAIZES[p.raiz].nota + (p.acidente === "#" ? 1 : p.acidente === "b" ? 11 : 0)) % 12;
};

const lerCasas = (texto: string): (number | null)[] => {
  const itens = texto.includes(",") ? texto.split(",") : texto.split("");
  return itens.slice(0, 6).map((c) => (/^[xX]$/.test(c.trim()) ? null : Number(c.trim())));
};

export type Forma = {
  cifra: string;
  nome: string;
  // casa de cada corda, da 6ª para a 1ª (null = não toca, 0 = solta)
  casas: (number | null)[];
  // dedo de cada corda (0 = sem dedo)
  dedos: number[];
};

// Junta o acorde do plano com o dicionário; sem forma conhecida, devolve null (o diagrama não é desenhado)
export const formaDoAcorde = (a: Pick<Acorde, "cifra" | "nome" | "forma" | "dedos">): Forma | null => {
  const doDicionario = DICIONARIO[a.cifra.trim()];
  const forma = a.forma ?? doDicionario?.forma;
  if (!forma) return null;
  const dedos = a.dedos ?? (a.forma ? undefined : doDicionario?.dedos);
  const casas = lerCasas(forma);
  if (casas.length !== 6 || casas.some((c) => c !== null && !Number.isFinite(c))) return null;
  const listaDedos = dedos ? lerCasas(dedos).map((d) => d ?? 0) : casas.map(() => 0);
  return { cifra: a.cifra.trim(), nome: a.nome ?? nomeDoAcorde(a.cifra), casas, dedos: listaDedos };
};

// O texto é uma cifra de acorde ("G", "F#m", "Cmaj7", "D/F#")? Senão é um texto qualquer ("Mercado").
export const ehCifra = (texto: string) =>
  /^[A-G][#b]?(m|maj7|7M|m7|7|9|6|m6|m9|dim|dim7|°|sus2|sus4|aug|\+|add9|m7b5|m7\(b5\))?(\/[A-G][#b]?)?$/.test(texto.trim());

// A cifra escrita para a tela: bemol e sustenido com os símbolos de música
export const cifraNaTela = (cifra: string) => cifra.replace(/^([A-G])#/, "$1♯").replace(/^([A-G])b/, "$1♭");
