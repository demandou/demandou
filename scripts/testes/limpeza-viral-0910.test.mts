// A limpeza que a prova do Viral (09/10) mostrou falha: "Porque porque" com as
// cópias sobrepostas na transcrição, e o "é" sozinho entre vírgulas que o JEV
// deu 0,66 e 0,72 para sair. Sem IA e sem rede: os tempos são os reais da
// gravação do Bruno (cmuvv0jje, 107,30 s e 60,02 s).
// Rodar: npx tsx --test scripts/testes/limpeza-viral-0910.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";

const { detectarRepeticoes } = await import("@/lib/media/limpeza");
const { emendarNoSilencio } = await import("@/lib/media/edicao");
const { isoladaPelaPontuacao } = await import("@/lib/media/decidir-retomadas");
const { falaDoCorte } = await import("@/lib/media/montagem-nos-cortes");

const w = (word: string, start: number, end: number) => ({ word, start, end, confidence: 0.99 });

// Palavras com "porque" medido em outras falas (0,25 s) para a duração típica.
const fundo = [w("porque", 10, 10.25), w("isso", 10.3, 10.5), w("porque", 20, 20.25), w("aquilo", 20.3, 20.6), w("porque", 30, 30.25), w("então", 30.3, 30.5)];
const viral = [
  w("motivo", 106.34, 106.74),
  w("também.", 106.74, 107.3),
  w("Porque", 107.3, 107.85),
  w("porque", 107.31, 107.47),
  w("produtividade", 107.47, 108.35),
  w("remete", 108.35, 108.75),
];

test("cópias sobrepostas: sai o vão menos a duração típica, e a emenda não mexe na borda", () => {
  const todas = [...fundo, ...viral];
  const r = detectarRepeticoes(todas).filter((x) => x.de >= 100);
  assert.equal(r.length, 1);
  assert.equal(r[0].de, 107.3);
  assert.ok(Math.abs(r[0].ate - 107.6) < 0.01, `ate=${r[0].ate}`);
  assert.match(r[0].motivo, /rabo gaguejado/);
  const [e] = emendarNoSilencio(r, todas);
  assert.ok(Math.abs(e.ate - 107.6) < 0.05, `emenda moveu a borda para ${e.ate}`);
});

test("a palavra cortada pelo começo e devolvida pelo fim entra uma vez no texto", async () => {
  const todas = [...fundo, ...viral];
  const fala = await falaDoCorte({
    palavras: todas,
    termos: null,
    inicio: 106,
    fim: 109,
    duracaoDaGravacao: 200,
    edicao: { inicio: 106, fim: 109, manter: [{ de: 0, ate: 1.3 }, { de: 1.6, ate: 3 }], em: "teste" },
  });
  const texto = fala.palavras.map((p) => p.texto).join(" ");
  assert.equal(texto, "motivo também. Porque produtividade remete");
  const porque = fala.palavras.find((p) => p.texto === "Porque")!;
  assert.ok(Math.abs(porque.inicio - 1.3) < 0.01, `Porque em ${porque.inicio}`);
  const prod = fala.palavras.find((p) => p.texto === "produtividade")!;
  assert.ok(prod.inicio >= porque.fim - 0.001, `produtividade em ${prod.inicio}, Porque acaba em ${porque.fim}`);
  for (let i = 1; i < fala.palavras.length; i++) assert.ok(fala.palavras[i].inicio >= fala.palavras[i - 1].inicio, "fora de ordem");
});

test("a palavra cuja remoção começa no ataque dela não aparece escrita", async () => {
  const falas = [w("a", 113.79, 113.95), w("mensagem,", 113.95, 114.59), w("tá?", 114.59, 115.07), w("Ah,", 115.55, 116.03), w("o", 116.03, 116.19), w("que", 116.19, 116.35)];
  const fala = await falaDoCorte({
    palavras: falas,
    termos: null,
    inicio: 113,
    fim: 117,
    duracaoDaGravacao: 200,
    edicao: { inicio: 113, fim: 117, manter: [{ de: 0, ate: 1.59 }, { de: 3.03, ate: 4 }], em: "teste" },
  });
  assert.equal(fala.palavras.map((p) => p.texto).join(" "), "a mensagem, o que");
});

test("é sozinho entre pausas de pontuação; o verbo colado no sujeito não", () => {
  const f = (s: string) => s.split(" ").map((x, i) => w(x, i, i + 0.3));
  const a = f("da marca do cristão. É, porém, eu estou");
  assert.equal(isoladaPelaPontuacao(a, 4), true);
  const b = f("nós temos, né? Então, é, o essencial");
  assert.equal(isoladaPelaPontuacao(b, 4), true);
  const c = f("O ponto é, não é a mudança");
  assert.equal(isoladaPelaPontuacao(c, 2), false);
  const d = f("a excelência é o produto mais caro, é o computador");
  assert.equal(isoladaPelaPontuacao(d, 2), false);
  assert.equal(isoladaPelaPontuacao(d, 7), false);
});
