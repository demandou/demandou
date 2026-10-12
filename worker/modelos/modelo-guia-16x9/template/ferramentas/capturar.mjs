// Etapas — captura prints de páginas públicas (ou registra prints do usuário) para a tela do topo.
//
// Uso:  node ferramentas/capturar.mjs nutri=https://pt.wikipedia.org/wiki/Nutricionista cardapio=https://...
//       node ferramentas/capturar.mjs --arquivo agenda=imagens/agenda.png     (print do próprio usuário)
//       opções: --largura 1280  --altura 3000  (a página inteira cabe numa captura alta; a tela rola por ela)
//
// Cada captura vai para public/img/<id>.png e é registrada em src/plano.json → imagens.<id>, pronta
// para `{ "imagem": { "id": "nutri" } }` nas telas de `etapa`, `grade` e `prova`. Usa o Chrome headless
// que o Remotion baixa (node_modules/.remotion). Só páginas públicas, sem login. Nunca capture uma
// página com o nome da ferramenta de edição à mostra.
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { argumentos, exigirProjeto, ffprobe, lerJson, gravarJson } from "../scripts/comum.mjs";

exigirProjeto();
const { opcoes, posicionais } = argumentos();
const largura = Number(opcoes.largura ?? 1280);
const altura = Number(opcoes.altura ?? 3000);
// --escala 2 grava em dobro (texto nítido no cartão); --agente mobile simula um celular
const escala = Number(opcoes.escala ?? 1);
// --espera 20: segundos de carregamento antes da foto (apps em JavaScript demoram); --idioma en-US
const AGENTES = { mobile: ["--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"], desktop: ["--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"] };
// apps que escondem a página do navegador headless: use --agente desktop (ou mobile)
const agente = AGENTES[opcoes.agente] ?? [];
mkdirSync("public/img", { recursive: true });

const achaChrome = () => {
  const raiz = "node_modules/.remotion/chrome-headless-shell";
  if (!existsSync(raiz)) return null;
  const pilha = [raiz];
  while (pilha.length) {
    const d = pilha.pop();
    for (const f of readdirSync(d)) {
      const p = path.join(d, f);
      if (statSync(p).isDirectory()) pilha.push(p);
      else if (f === "chrome-headless-shell") return path.resolve(p);
    }
  }
  return null;
};

const medir = (arq) => {
  const s = ffprobe(["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", arq]).trim().split(",");
  return { largura: Number(s[0]), altura: Number(s[1]) };
};

const plano = lerJson("src/plano.json");
plano.imagens ??= {};
const registrar = (id, arquivo) => {
  const { largura: w, altura: h } = medir(path.join("public", arquivo));
  plano.imagens[id] = { arquivo, largura: w, altura: h, foco: { x: 0.5, y: 0.5 }, transparente: false, palavra: id };
  console.log(`  ${id}: ${arquivo} (${w}×${h})`);
};

const pedidos = posicionais.filter((p) => p.includes("="));
if (opcoes.arquivo) pedidos.push(String(opcoes.arquivo));
if (pedidos.length === 0) {
  console.error('Uso: node ferramentas/capturar.mjs id=https://pagina ...   |   --arquivo id=imagens/print.png');
  process.exit(1);
}
const chrome = achaChrome();
for (const p of pedidos) {
  const i = p.indexOf("=");
  const id = p.slice(0, i);
  const alvo = p.slice(i + 1);
  if (/^https?:\/\//.test(alvo)) {
    if (!chrome) throw new Error("Chrome headless do Remotion não encontrado: rode `npx remotion browser ensure` e tente de novo.");
    const arquivo = `img/${id}.png`;
    const r = spawnSync(chrome, ["--no-sandbox", "--hide-scrollbars", `--force-device-scale-factor=${escala}`, ...agente, `--lang=${opcoes.idioma ?? "pt-BR"}`, `--accept-lang=${opcoes.idioma ?? "pt-BR"}`, `--window-size=${largura},${altura}`, `--virtual-time-budget=${Number(opcoes.espera ?? 8) * 1000}`, `--screenshot=public/${arquivo}`, alvo], { stdio: "ignore" });
    if (r.status !== 0 || !existsSync(`public/${arquivo}`)) {
      console.error(`  ${id}: falhou ao capturar ${alvo}`);
      continue;
    }
    registrar(id, arquivo);
  } else {
    const ext = path.extname(alvo) || ".png";
    const arquivo = `img/${id}${ext}`;
    copyFileSync(alvo, path.join("public", arquivo));
    registrar(id, arquivo);
  }
}
gravarJson("src/plano.json", plano);
console.log("Registrado em src/plano.json → imagens. Olhe os prints antes de usar (banner, cookie, página errada).");
