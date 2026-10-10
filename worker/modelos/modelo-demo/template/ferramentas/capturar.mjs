// Captura uma página pública como imagem de "gravação de tela" (página inteira, sem interface do
// navegador), usando o Chrome headless que o Remotion já baixou. Sem biblioteca extra.
//
// Uso:  node ferramentas/capturar.mjs <url> <nome> [--largura 1440] [--altura 1000] [--max 5200]
//                                     [--clicar "texto 1" --clicar "texto 2"] [--esperar 2.5]
//
// Grava public/tela/<nome>.jpg (e imprime largura x altura). Use o nome no campo `captura` de um
// momento `tela`. `--clicar` abre acordeões e abas pelo texto visível do botão antes de capturar
// (use para mostrar o item que a pessoa cita). `--max` limita a altura total da página (px de CSS).
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, writeFileSync, rmSync, mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
const pos = [];
const op = { largura: 1440, altura: 1000, max: 5200, esperar: 2.5, clicar: [] };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--clicar") op.clicar.push(args[++i]);
  else if (a.startsWith("--")) op[a.slice(2)] = Number(args[++i]);
  else pos.push(a);
}
const [url, nome] = pos;
if (!url || !nome) {
  console.error('Uso: node ferramentas/capturar.mjs <url> <nome> [--largura 1440] [--altura 1000] [--max 5200] [--clicar "texto"] [--esperar 2.5]');
  process.exit(2);
}

// o Chrome headless que o Remotion baixou
const achar = (dir, depth = 0) => {
  if (!existsSync(dir) || depth > 5) return null;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isFile() && /^chrome-headless-shell(\.exe)?$/.test(e.name)) return p;
    if (e.isDirectory()) {
      const r = achar(p, depth + 1);
      if (r) return r;
    }
  }
  return null;
};
const chrome = achar(path.resolve("node_modules/.remotion"));
if (!chrome) {
  console.error("Chrome headless do Remotion não encontrado em node_modules/.remotion. Rode `npx remotion browser ensure`.");
  process.exit(1);
}

const perfil = mkdtempSync(path.join(os.tmpdir(), "tv-chrome-"));
const porta = 9300 + Math.floor(Math.random() * 500);
const proc = spawn(chrome, [`--remote-debugging-port=${porta}`, `--user-data-dir=${perfil}`, "--no-sandbox", "--hide-scrollbars", "--disable-gpu", "--lang=pt-BR", "about:blank"], { stdio: "ignore" });
const fim = (cod) => {
  try { proc.kill(); } catch {}
  try { rmSync(perfil, { recursive: true, force: true }); } catch {}
  process.exit(cod);
};
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  let alvo = null;
  for (let i = 0; i < 60 && !alvo; i++) {
    await dormir(250);
    try {
      const lista = await (await fetch(`http://127.0.0.1:${porta}/json`)).json();
      alvo = lista.find((x) => x.type === "page");
    } catch {}
  }
  if (!alvo) throw new Error("não consegui abrir o Chrome");
  const ws = new WebSocket(alvo.webSocketDebuggerUrl);
  await new Promise((r, e) => { ws.onopen = r; ws.onerror = e; });
  let n = 0;
  const pend = new Map();
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
  };
  const cdp = (method, params = {}) => new Promise((res, rej) => {
    const id = ++n;
    pend.set(id, (d) => (d.error ? rej(new Error(d.error.message)) : res(d.result)));
    ws.send(JSON.stringify({ id, method, params }));
  });
  const js = async (expressao) => (await cdp("Runtime.evaluate", { expression: expressao, returnByValue: true, awaitPromise: true })).result?.value;

  await cdp("Page.enable");
  await cdp("Emulation.setDeviceMetricsOverride", { width: op.largura, height: op.altura, deviceScaleFactor: 2, mobile: false });
  await cdp("Page.navigate", { url });
  await dormir(op.esperar * 1000 + 2500);
  // fecha avisos de cookies/entrar mais comuns (só os botões de recusar/fechar)
  await js(`(()=>{for(const b of document.querySelectorAll('button,[role=button]')){const t=(b.innerText||b.getAttribute('aria-label')||'').trim().toLowerCase();if(['rejeitar tudo','recusar','rejeitar','reject all','fechar','close','não, obrigado'].includes(t)){try{b.click()}catch(e){}}}})()`);
  for (const texto of op.clicar) {
    const ok = await js(`(()=>{const q=${JSON.stringify(texto.toLowerCase())};const els=[...document.querySelectorAll('button,[role=button],[role=tab],summary,a')];const el=els.find(e=>(e.innerText||'').trim().toLowerCase().startsWith(q));if(!el)return false;el.scrollIntoView({block:'center'});el.click();return true})()`);
    console.log(ok ? `clicou em "${texto}"` : `AVISO: não achei "${texto}"`);
    await dormir(700);
  }
  await js("window.scrollTo(0,0)");
  let altura = await js("Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)");
  altura = Math.min(Math.round(altura), op.max);
  const { data } = await cdp("Page.captureScreenshot", { format: "jpeg", quality: 88, captureBeyondViewport: true, clip: { x: 0, y: 0, width: op.largura, height: altura, scale: 1 } });
  mkdirSync("public/tela", { recursive: true });
  writeFileSync(`public/tela/${nome}.jpg`, Buffer.from(data, "base64"));
  console.log(`public/tela/${nome}.jpg  (${op.largura * 2} x ${altura * 2} px; proporção altura/largura = ${(altura / op.largura).toFixed(3)})`);
  ws.close();
  fim(0);
} catch (e) {
  console.error("Falhou:", e.message);
  fim(1);
}
