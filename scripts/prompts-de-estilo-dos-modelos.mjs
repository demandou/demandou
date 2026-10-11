// O PROMPT DE ESTILO DE CADA MODELO DO CURSO (11/10/2026).
//
// Decisão do Bruno (11/10, 01h25): "os posts que herdam o design têm que herdar
// um PROMPT para enviar para os nossos modelos de IA". Este script lê, para cada
// modelo do catálogo, o worker/modelos/<id>/referencias/estilo.md, a parte do
// estilo do SKILL.md (o estilo e a assinatura em qualquer assunto) e o
// exemplo/quadros.jpg, e pede ao Gemini (visão, uma vez, barato) a tradução do
// modelo para um POST PARADO feito por modelo de imagem: atmosfera, elemento
// visual, composições variadas, tipografia, textura, luz e o que evitar.
//
// As cores do modelo NÃO entram: a peça sai sempre nas cores da marca do projeto
// (o prompt descreve só os PAPÉIS das cores). A janela da pessoa também não: o
// post não tem a pessoa (as caixas vazias foram o defeito do template).
//
// Saída: lib/media/editor-do-curso/prompts-de-estilo.json (vai no repo; nenhuma
// campanha paga por isto). Rodar de novo só quando um modelo mudar.
//
// Uso: node scripts/prompts-de-estilo-dos-modelos.mjs [--so modelo-torre,modelo-manifesto] [--refazer]
// A chave GEMINI_API_KEY vem do .env.local do repositório principal (nunca impressa).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SAIDA = path.join(RAIZ, "lib/media/editor-do-curso/prompts-de-estilo.json");
const CATALOGO = JSON.parse(readFileSync(path.join(RAIZ, "lib/media/editor-do-curso/catalogo.json"), "utf8"));
const MODELO = "gemini-2.5-flash";
// US$ por milhão de tokens (entrada, saída) do gemini-2.5-flash.
const PRECO = { entrada: 0.3, saida: 2.5 };

function chave() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
  for (const p of [path.join(RAIZ, ".env.local"), path.resolve(RAIZ, "../../../.env.local")]) {
    if (!existsSync(p)) continue;
    const m = /^GEMINI_API_KEY=(.*)$/m.exec(readFileSync(p, "utf8"));
    if (m) return m[1].trim().replace(/^"|"$/g, "");
  }
  throw new Error("GEMINI_API_KEY não encontrada");
}

/** As seções do SKILL.md que dizem o estilo (e não o fluxo de edição). */
function estiloDoSkill(md) {
  const secoes = md.split(/\n(?=## )/);
  const quer = (s) => /^## (O estilo|A assinatura)/.test(s);
  const abertura = secoes[0].split("\n").slice(0, 12).join("\n");
  return [abertura, ...secoes.filter(quer)].join("\n\n").slice(0, 9000);
}

// As cores que o prompt não pode nomear (a marca do projeto manda), em inglês e português.
const COR = /\b(blue|navy|gold(en)?|champagne|ivory|red|crimson|scarlet|green|yellow|orange|purple|violet|pink|teal|cyan|magenta|beige|cream|brown|azul|dourad[oa]|champanhe|marfim|vermelh[oa]|verde|amarel[oa]|laranja|roxo|rosa|bege|marrom|grafite)\b/i;
// Sinal de que a resposta saiu em português (as palavras curtas mais comuns).
const PORTUGUES = /(^|\s)(não|com|uma|para|fundo|texto|cor|são|sobre)(\s|$)/i;

// Chaves em inglês no esquema: com chaves em português o Gemini respondia em português.
const ESQUEMA = {
  type: "OBJECT",
  properties: {
    styleName: { type: "STRING" },
    mood: { type: "STRING" },
    visualElement: { type: "STRING" },
    layouts: { type: "ARRAY", items: { type: "STRING" } },
    typography: { type: "STRING" },
    texture: { type: "STRING" },
    lighting: { type: "STRING" },
    colorRoles: { type: "STRING" },
    avoid: { type: "STRING" },
    typeOnly: { type: "BOOLEAN" },
  },
  required: ["styleName", "mood", "visualElement", "layouts", "typography", "texture", "lighting", "colorRoles", "avoid", "typeOnly"],
};

const SISTEMA = `You are an art director who translates a VIDEO editing template into a STATIC social media post style for an AI image model (Nano Banana Pro, GPT Image).
The post is a single still image (Instagram 4:5 feed post or carousel slide) with ONE short Portuguese sentence as the hero text, rendered by the image model itself.
Describe the template's visual language so faithfully that a designer would recognize it, but as a still poster, never as a video frame.
Hard rules for what you write (EVERY field in ENGLISH even though the sources are in Portuguese; concise, concrete; no hex codes, no brand names, no long dash):
- NEVER include the presenter, a person, a video window, a rounded frame for a face, subtitles, a progress bar, UI chrome of the video, or any recording equipment (camera, microphone, ring light, tripod, studio).
- NEVER name ANY color (no blue, gold, champagne, red, ivory, navy...) and no hex codes: the post always uses the CLIENT's brand colors. Describe colors only by ROLE (background, text, accent) and by value contrast (dark/light), e.g. "dark background, light text, one thin accent". Light can be "warm" or "cool".
- Where the template shows the presenter (inside giant letters, in a rounded frame, in a window, in a circle), the still post REPLACES the presenter with a subject related image, scene or texture that fills that shape completely. Never a person, never an empty box or empty frame.
- The visual element must be GENERIC and adaptable to ANY subject (finance, church, health, software...), like the template's "signature in any subject" section says: describe the KIND of element and how it is rendered (e.g. "a stylized 3D night city with lit windows and one tall tower made of the idea", "a technical cutaway illustration of an object with labeled parts and thin leader lines", "pure typographic poster, no image").
- No real logos, no fake UI text, no extra words: the only words in the image will be the provided sentence (no labels, no numbers, no names of places).
Fields:
styleName: 2 to 5 words naming the look.
mood: 1 to 2 sentences: mood, era, premium level.
visualElement: 2 to 3 sentences: which kind of visual element carries the idea and how it is rendered (3D, flat, photo, illustration, collage, paper, chalk...), and how it relates to the sentence.
layouts: EXACTLY 5 different layouts for a 4:5 still post in this style (each 1 sentence: where the hero text sits, where the visual element sits, scale, negative space). Clearly different from each other, all in the same template language.
typography: 1 to 2 sentences: the template's type families described by style (e.g. "elegant high contrast serif like Cormorant Garamond for the key words, wide tracked uppercase geometric sans like Manrope"), weight, case, tracking, hierarchy.
texture: 1 sentence: surfaces, grain, paper, glass, depth.
lighting: 1 sentence: lighting of the scene.
colorRoles: 1 sentence on how the brand palette is distributed (which role dominates, where the accent goes, never tinting photos).
avoid: 1 to 2 sentences: what breaks this style (from the template's own "never do" list, translated to a still post).
typeOnly: true only if the template has no illustrative visual element at all (pure type on color).`;

async function descrever(id, k, tentativaDoTexto = 1, aviso = "") {
  const ref = path.join(RAIZ, "worker/modelos", id, "referencias");
  const estilo = existsSync(path.join(ref, "estilo.md")) ? readFileSync(path.join(ref, "estilo.md"), "utf8").slice(0, 10000) : "";
  const skill = existsSync(path.join(ref, "SKILL.md")) ? estiloDoSkill(readFileSync(path.join(ref, "SKILL.md"), "utf8")) : "";
  const quadros = path.join(ref, "exemplo/quadros.jpg");
  const parts = [];
  if (existsSync(quadros)) {
    parts.push({ text: "Contact sheet of the template's example video (one frame per moment). Ignore the presenter and the captions; look at the graphic language." });
    parts.push({ inlineData: { mimeType: "image/jpeg", data: readFileSync(quadros).toString("base64") } });
  }
  parts.push({
    text:
      `TEMPLATE ${id}\n\n=== estilo.md ===\n${estilo}\n\n=== SKILL.md (style part) ===\n${skill}\n\n` +
      `Write the still post style as JSON. Every field in ENGLISH (translate). Do NOT name any color at all: only roles (background, text, accent) and dark/light.` +
      (aviso ? `\nYOUR PREVIOUS ANSWER WAS REJECTED: ${aviso}. Fix it.` : ""),
  });
  const corpo = {
    systemInstruction: { parts: [{ text: SISTEMA }] },
    contents: [{ role: "user", parts }],
    generationConfig: { responseMimeType: "application/json", responseSchema: ESQUEMA, temperature: 0.3, maxOutputTokens: 6000, mediaResolution: "MEDIA_RESOLUTION_MEDIUM", thinkingConfig: { thinkingBudget: 512 } },
  };
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": k },
      body: JSON.stringify(corpo),
      signal: AbortSignal.timeout(120_000),
    });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      if (tentativa < 3 && (r.status === 429 || r.status >= 500)) {
        await new Promise((x) => setTimeout(x, 4000 * tentativa));
        continue;
      }
      throw new Error(`HTTP ${r.status}: ${t.slice(0, 200)}`);
    }
    const j = await r.json();
    const texto = (j.candidates?.[0]?.content?.parts ?? []).filter((p) => !p.thought).map((p) => p.text ?? "").join("");
    const u = j.usageMetadata ?? {};
    gasto += ((u.promptTokenCount ?? 0) * PRECO.entrada + ((u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0)) * PRECO.saida) / 1e6;
    const limpo = (s) => String(s ?? "").replace(/\s*[—–]\s*/g, ", ").replace(/\s+/g, " ").trim();
    const d = JSON.parse(texto.slice(texto.indexOf("{"), texto.lastIndexOf("}") + 1));
    const comp = (Array.isArray(d.layouts) ? d.layouts : []).map(limpo).filter(Boolean).slice(0, 5);
    if (comp.length < 3) throw new Error("menos de 3 composições");
    const tudo = [d.mood, d.visualElement, ...comp, d.typography, d.texture, d.lighting, d.colorRoles, d.avoid].join(" ");
    const cor = COR.exec(tudo);
    const pt = PORTUGUES.test(tudo);
    if ((cor || pt) && tentativaDoTexto < 3) {
      return descrever(id, k, tentativaDoTexto + 1, [cor ? `it names the color "${cor[0]}"` : "", pt ? "it is not in English" : ""].filter(Boolean).join(" and "));
    }
    if (cor || pt) console.warn(`${id}: ficou com ${cor ? `a cor "${cor[0]}"` : "texto em português"} depois de 3 tentativas`);
    return {
      nomeDoEstilo: limpo(d.styleName),
      atmosfera: limpo(d.mood),
      elementoVisual: limpo(d.visualElement),
      composicoes: comp,
      tipografia: limpo(d.typography),
      textura: limpo(d.texture),
      luz: limpo(d.lighting),
      papeisDasCores: limpo(d.colorRoles),
      evitar: limpo(d.avoid),
      soTipografico: d.typeOnly === true,
      fonte: existsSync(quadros) ? "estilo.md + SKILL.md + quadros.jpg" : "estilo.md + SKILL.md",
    };
  }
  throw new Error("sem resposta");
}

let gasto = 0;
const argv = process.argv.slice(2);
const soIdx = argv.indexOf("--so");
const so = soIdx >= 0 ? new Set(argv[soIdx + 1].split(",")) : null;
const refazer = argv.includes("--refazer");
const atual = existsSync(SAIDA) ? JSON.parse(readFileSync(SAIDA, "utf8")) : {};
const k = chave();
const ids = CATALOGO.map((m) => m.id).filter((id) => !so || so.has(id)).filter((id) => refazer || !atual[id]);
const fila = [...ids];
async function trabalhador() {
  while (fila.length) {
    const id = fila.shift();
    try {
      atual[id] = await descrever(id, k);
      console.log(`${id}: ${atual[id].nomeDoEstilo}`);
    } catch (e) {
      console.error(`${id}: FALHOU ${e instanceof Error ? e.message : e}`);
    }
  }
}
await Promise.all([1, 2, 3, 4].map(trabalhador));
const ordenado = Object.fromEntries(Object.keys(atual).sort().map((id) => [id, atual[id]]));
writeFileSync(SAIDA, JSON.stringify(ordenado, null, 1) + "\n");
console.log(`\n${ids.length} modelo(s) pedidos, ${Object.keys(ordenado).length} no arquivo. Custo desta rodada (com as voltas): US$ ${gasto.toFixed(4)}`);
