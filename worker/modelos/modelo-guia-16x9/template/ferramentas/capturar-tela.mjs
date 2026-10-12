// Guia — print real de uma página com interação: abre a página no Chrome headless do projeto, faz
// cliques e digita (sem enviar nada) e tira a foto. Serve para o print "da etapa": o menu aberto, a
// caixa de mensagem com o prompt escrito, o botão que a pessoa manda clicar.
//
// Uso:
//   node ferramentas/capturar-tela.mjs <id> <url> [--largura 1280 --altura 800 --escala 2 --espera 12]
//        [--agente desktop|mobile] [--idioma pt-BR] [--acoes '<json>']
//
// --acoes é uma lista executada em ordem, por exemplo:
//   '[{"clicar":"#prompt-textarea"},{"digitar":"Escreva um e-mail..."},{"esperar":1}]'
//   '[{"clicarTexto":"ChatGPT"},{"esperar":1.5}]'      (clica no elemento visível com esse texto)
//   '[{"tecla":"Escape"}]'   '[{"clicarEm":[300,20]}]' (x,y em px da janela; --inspecionar 1 lista os elementos e posições)
// Nunca envie formulário, nunca faça login, nunca clique em "Enviar": o print é só a tela.
// A imagem vai para public/img/<id>.png e é registrada em src/plano.json → imagens.<id>.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { argumentos, exigirProjeto, gravarJson, lerJson } from "../scripts/comum.mjs";

exigirProjeto();
const { opcoes, posicionais } = argumentos();
const [id, url] = posicionais;
if (!id || !/^https?:\/\//.test(url ?? "")) {
  console.error("Uso: node ferramentas/capturar-tela.mjs <id> <url> [--acoes '[...]']");
  process.exit(1);
}
const largura = Number(opcoes.largura ?? 1280);
const altura = Number(opcoes.altura ?? 800);
const escala = Number(opcoes.escala ?? 2);
const espera = Number(opcoes.espera ?? 12);
const idioma = String(opcoes.idioma ?? "pt-BR");
const UA = {
  desktop: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  mobile: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
};
const agente = UA[opcoes.agente ?? "desktop"] ?? UA.desktop;
// --recorte x,y,largura,altura (px da janela): grava só esse trecho, já em alta (o que a fala cita)
const recorte = opcoes.recorte ? String(opcoes.recorte).split(",").map(Number) : null;
const acoes = opcoes.acoes ? JSON.parse(String(opcoes.acoes)) : [];

const achaChrome = () => {
  const raiz = "node_modules/.remotion/chrome-headless-shell";
  const pilha = existsSync(raiz) ? [raiz] : [];
  while (pilha.length) {
    const d = pilha.pop();
    for (const f of readdirSync(d)) {
      const p = path.join(d, f);
      if (statSync(p).isDirectory()) pilha.push(p);
      else if (f === "chrome-headless-shell") return path.resolve(p);
    }
  }
  throw new Error("Chrome headless do Remotion não encontrado: rode `npx remotion browser ensure`.");
};

const dorme = (s) => new Promise((r) => setTimeout(r, s * 1000));
const perfil = mkdtempSync(path.join(os.tmpdir(), "guia-print-"));
const chrome = spawn(achaChrome(), ["--no-sandbox", "--hide-scrollbars", "--remote-debugging-port=0", `--user-data-dir=${perfil}`, `--lang=${idioma}`, `--accept-lang=${idioma}`, "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
const wsBrowser = await new Promise((ok, erro) => {
  let buf = "";
  chrome.stderr.on("data", (d) => {
    buf += d;
    const m = buf.match(/ws:\/\/[^\s]+/);
    if (m) ok(m[0]);
  });
  setTimeout(() => erro(new Error("o Chrome não abriu")), 20000);
});
const porta = new URL(wsBrowser).port;
const alvos = await (await fetch(`http://127.0.0.1:${porta}/json/list`)).json();
const ws = new WebSocket(alvos.find((a) => a.type === "page").webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let seq = 0;
const pendentes = new Map();
ws.addEventListener("message", (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pendentes.has(msg.id)) {
    pendentes.get(msg.id)(msg);
    pendentes.delete(msg.id);
  }
});
const cdp = (method, params = {}) =>
  new Promise((ok, erro) => {
    const n = ++seq;
    pendentes.set(n, (msg) => (msg.error ? erro(new Error(`${method}: ${msg.error.message}`)) : ok(msg.result)));
    ws.send(JSON.stringify({ id: n, method, params }));
  });
const avaliar = async (expr) => (await cdp("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true })).result.value;
const clicarEm = async (x, y) => {
  for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) await cdp("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 });
};

try {
  await cdp("Emulation.setDeviceMetricsOverride", { width: largura, height: altura, deviceScaleFactor: escala, mobile: opcoes.agente === "mobile" });
  await cdp("Network.enable");
  await cdp("Network.setUserAgentOverride", { userAgent: agente, acceptLanguage: idioma });
  await cdp("Page.enable");
  await cdp("Page.navigate", { url });
  await dorme(espera);
  if (opcoes.inspecionar) {
    // lista os elementos clicáveis e campos (para achar o seletor de cada ação)
    console.log(await avaliar(`[...document.querySelectorAll("button,a,[role=button],[role=combobox],textarea,[contenteditable=true]")].filter(e=>e.offsetParent).map(e=>{const b=e.getBoundingClientRect();return [e.tagName.toLowerCase(),e.id&&"#"+e.id,e.dataset.testid&&"[data-testid="+e.dataset.testid+"]",JSON.stringify(e.textContent.trim().slice(0,40)),Math.round(b.x)+","+Math.round(b.y)].filter(Boolean).join(" ")}).join("\\n")`));
  }
  for (const a of acoes) {
    if (a.esperar) await dorme(a.esperar);
    if (a.clicar || a.clicarTexto) {
      const busca = a.clicar
        ? `document.querySelector(${JSON.stringify(a.clicar)})`
        : `[...document.querySelectorAll("button,a,[role=button],[role=combobox],div,span")].filter(e=>e.offsetParent&&e.textContent.trim()===${JSON.stringify(a.clicarTexto)}).sort((p,q)=>p.getBoundingClientRect().width-q.getBoundingClientRect().width)[0]`;
      const r = await avaliar(`(()=>{const e=${busca};if(!e)return null;const b=e.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()`);
      if (!r) throw new Error(`não achei ${a.clicar ?? a.clicarTexto} na página`);
      await clicarEm(r.x, r.y);
      await dorme(0.6);
    }
    if (a.clicarEm) {
      await clicarEm(a.clicarEm[0], a.clicarEm[1]);
      await dorme(0.6);
    }
    if (a.digitar) {
      await cdp("Input.insertText", { text: a.digitar });
      await dorme(0.6);
    }
    if (a.tecla) {
      await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: a.tecla });
      await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: a.tecla });
      await dorme(0.4);
    }
  }
  const { data } = await cdp("Page.captureScreenshot", recorte ? { format: "png", clip: { x: recorte[0], y: recorte[1], width: recorte[2], height: recorte[3], scale: 1 } } : { format: "png" });
  const [wF, hF] = recorte ? [recorte[2], recorte[3]] : [largura, altura];
  mkdirSync("public/img", { recursive: true });
  const arquivo = `img/${id}.png`;
  writeFileSync(path.join("public", arquivo), Buffer.from(data, "base64"));
  const plano = lerJson("src/plano.json");
  plano.imagens ??= {};
  plano.imagens[id] = { arquivo, largura: wF * escala, altura: hF * escala, foco: { x: 0.5, y: 0.5 }, transparente: false, palavra: id };
  gravarJson("src/plano.json", plano);
  console.log(`  ${id}: ${arquivo} (${wF * escala}×${hF * escala}). Olhe o print antes de usar.`);
} finally {
  ws.close();
  chrome.kill();
}
