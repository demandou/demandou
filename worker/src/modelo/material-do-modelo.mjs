import { spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readSync, openSync, closeSync, rmSync } from "node:fs";
import { join } from "node:path";

/**
 * O MATERIAL DO CLIENTE NO PROJETO DO TRABALHO (10/10/2026).
 *
 * Seis modelos do curso pedem material do cliente (catalogo.json, `pede`). O
 * app guarda as fotos marcadas para o modelo (lib/media/editor-do-curso/
 * material-do-modelo.ts: quantos, de que tipo, quando a edição pode começar)
 * e manda as URLs no pedido (`pedido.material.itens`). Aqui fica o que é do
 * TEMPLATE: em que pasta o curso espera cada arquivo, com que nome e formato,
 * que ferramenta do curso o registra e como o plano.json o cita. O fluxo é o
 * do curso, na ordem do SKILL.md:
 *
 *   1  baixarMaterial      logo depois de criar o projeto (falha cedo, antes do
 *                          preparar): cada arquivo na pasta do template, em JPG,
 *                          medido (largura, altura, proporção altura ÷ largura)
 *                          e reduzido a 900 px para o redator olhar (o "sips -Z
 *                          900" do curso).
 *   6b pedidosFixos        a Transformação entra pelo imagens.mjs: os dois
 *                          pedidos (antes e depois, da pasta imagens/) e o
 *                          `--offline`, como o passo 6b dela manda.
 *   6b registrarMaterial   Etapas e Guia: `node ferramentas/capturar.mjs
 *                          <id>=imagens/<id>.jpg ...`, a ferramenta do curso
 *                          para "print do usuário" (copia para public/img/<id> e
 *                          registra em plano.imagens). Roda DEPOIS do passo das
 *                          imagens, porque o imagens.mjs refaz plano.imagens
 *                          inteiro a cada escolha.
 *   7  o redator recebe a lista (id, nome e descrição do cliente, arquivo,
 *      medidas e a miniatura) e a regra de usar só estes; a conferência do
 *      material (conferirMaterialNoPlano) reprova o plano que cita arquivo que
 *      não existe ou que não usa nenhum.
 *
 * NUNCA TELA GERADA POR IA: o modelo só recebe o que o cliente mandou. As
 * ferramentas do curso que capturam página pública (capturar.mjs com URL,
 * capturar-tela.mjs) não são chamadas: o material é o do produto do cliente.
 */

/**
 * O MAPA, modelo a modelo (fonte: referencias/SKILL.md, plano.md e o template de cada um).
 *   pasta     onde o arquivo fica no projeto do trabalho
 *   arquivo   o nome com que fica lá (<id> = o id que o app deu, do nome do cliente)
 *   formato   o formato que o template lê
 *   registro  a ferramenta do curso que leva o arquivo ao plano (null: o template lê direto)
 *   noPlano   como o plano.json cita o arquivo (vai para o redator)
 *   fonte     onde o curso diz isso
 */
export const MATERIAL_NO_TEMPLATE = Object.freeze({
  "modelo-demo": {
    oQue: "capturas de tela do produto do cliente",
    pasta: "public/tela",
    arquivo: "<id>.jpg",
    formato: "jpg",
    registro: null,
    noPlano:
      'no momento "tela", "captura": "<id>" (o arquivo public/tela/<id>.jpg, sem a extensão) e "proporcao": a proporção altura÷largura dada para o arquivo; a câmera ("ini", "fim") e o "cursor" são frações do arquivo inteiro. Em "split" (padrão) ou "cheio" (em "cheio", zoom ≥ 1920 ÷ (1080 × proporção)). O resultado pode ficar parado vários segundos numa "tela".',
    fonte: 'SKILL.md 6b ("Material do usuário em public/tela/ passa na frente"; ".jpg em public/tela/; a proporção é altura ÷ largura"); plano.md, campos captura e proporcao; src/componentes/Tela.tsx (staticFile(`tela/${captura}.jpg`))',
  },
  "modelo-tela-viva": {
    oQue: "capturas de tela do produto do cliente",
    pasta: "public/tela",
    arquivo: "<id>.jpg",
    formato: "jpg",
    registro: null,
    noPlano:
      'no momento "tela", "captura": "<id>" (o arquivo public/tela/<id>.jpg, sem a extensão) e "proporcao": a proporção altura÷largura dada para o arquivo; a câmera ("ini", "fim") e o "cursor" são frações do arquivo inteiro. Cada cena (4 a 10 s) é uma "tela"; a segunda prova usa o arquivo mais impressionante.',
    fonte: 'SKILL.md 6b ("Material do usuário em public/tela/ passa na frente"; "ponha o arquivo .jpg em public/tela/"); plano.md, campos captura e proporcao; src/componentes/Tela.tsx (staticFile(`tela/${captura}.jpg`))',
  },
  "modelo-etapas": {
    oQue: "prints das etapas do processo do cliente",
    pasta: "imagens",
    arquivo: "<id>.jpg",
    formato: "jpg",
    registro: "capturar",
    noPlano:
      '"imagem": { "id": "<id>" } nas "telas" de cada "etapa" (2 a 8 telas, trocando a cada 0,3 a 1 s, com "rolar" e "zoom" para pontos diferentes do mesmo print), nas telas da "grade" (2 a 5, na ordem das etapas) e na "prova" (um print parado, ~6 s, com "foco" em frações do print). O id já está registrado em plano.imagens.',
    fonte: 'SKILL.md "Antes de começar" (prints próprios na pasta imagens/) e 6b ("node ferramentas/capturar.mjs --arquivo agenda=imagens/agenda.png"); ferramentas/capturar.mjs (copia para public/img/<id> e registra em plano.imagens); plano.md, etapa/grade/prova',
  },
  "modelo-guia": {
    oQue: "prints das telas que o cliente ensina a usar",
    pasta: "imagens",
    arquivo: "<id>.jpg",
    formato: "jpg",
    registro: "capturar",
    noPlano:
      'no momento "print", "imagem": { "id": "<id>" }, com "setas" cuja ponta ("x", "y") é a fração do print inteiro onde está o botão citado, na palavra dele; "endereco" e "rotulo" opcionais. O id já está registrado em plano.imagens.',
    fonte: 'SKILL.md 6b ("Prints do usuário: node ferramentas/capturar.mjs --arquivo menu=imagens/menu-projetos.png"); plano.md, print; além do recorte da pessoa (public/pessoa.webm, ferramentas/recortar.mjs, Vision do macOS), que o worker ainda não faz',
  },
  "modelo-transformacao": {
    oQue: "o par de fotos antes e depois do cliente",
    pasta: "imagens",
    arquivo: "antes.jpg e depois.jpg",
    formato: "jpg",
    registro: "imagens-offline",
    noPlano:
      'na assinatura "antesdepois", "antes": { "id": "antes" } e "depois": { "id": "depois" }; os "marcadores" usam "foco" e "ponto" em frações da foto (a área de cada dica), sem aproximar logo, rosto de terceiros ou texto pequeno. As duas já estão em plano.imagens.',
    fonte: 'SKILL.md "Antes de começar" (imagens/antes.jpg e imagens/depois.jpg) e 6b (work/imagens.json com os dois pedidos e "node scripts/imagens.mjs --offline"); plano.md, antesdepois',
  },
  "modelo-janelas": {
    oQue: null,
    pasta: null,
    arquivo: null,
    formato: null,
    registro: null,
    noPlano: null,
    fonte: "SKILL.md e plano.md não pedem arquivo do usuário: a área de trabalho e as janelas são do template; ferramentas/teclas.mjs só ouve as sílabas das teclas em public/base.mp4",
  },
});

export function materialNoTemplate(modelo) {
  return MATERIAL_NO_TEMPLATE[modelo] ?? null;
}

const FFMPEG = process.env.FFMPEG_BIN ?? "ffmpeg";

function rodarProcesso(bin, args, prazoMs = 2 * 60_000) {
  return new Promise((resolve, reject) => {
    const p = spawn(bin, args);
    let out = "";
    let err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    const t = setTimeout(() => p.kill("SIGKILL"), prazoMs);
    p.on("error", (e) => {
      clearTimeout(t);
      reject(e);
    });
    p.on("close", (codigo) => {
      clearTimeout(t);
      resolve({ codigo, out, err });
    });
  });
}

function ehJpeg(arquivo) {
  const fd = openSync(arquivo, "r");
  try {
    const b = Buffer.alloc(3);
    readSync(fd, b, 0, 3, 0);
    return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  } finally {
    closeSync(fd);
  }
}

async function medir(arquivo) {
  const r = await rodarProcesso("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", arquivo]);
  const [w, h] = String(r.out).trim().split(",").map(Number);
  if (!(w > 0 && h > 0)) throw new Error(`não consegui medir ${arquivo}`);
  return { largura: w, altura: h };
}

const ID_VALIDO = /^[a-z][a-z0-9-]{0,40}$/;

/**
 * PASSO 1b: baixa cada arquivo do material para a pasta onde o template espera,
 * em JPG, e mede. `material.itens`: [{ id, url, nome, descricao, papel }] (o id
 * vem do app). `baixar(url, destino)` é o download do worker (store privado ou
 * público). Devolve os arquivos para o redator, ainda sem o registro do 6b.
 */
export async function baixarMaterial(projeto, modelo, material, { baixar, miniaturas = true } = {}) {
  const regra = materialNoTemplate(modelo);
  if (!regra) throw new Error(`o modelo ${modelo} não recebe material do cliente`);
  if (!regra.pasta) return [];
  const itens = Array.isArray(material?.itens) ? material.itens : [];
  if (!itens.length) throw new Error(`o modelo ${modelo} pede ${regra.oQue} e o pedido veio sem nenhum arquivo`);
  if (typeof baixar !== "function") throw new Error("falta quem baixe o material");
  const pasta = join(projeto, regra.pasta);
  const temporaria = join(projeto, "work", "material");
  mkdirSync(pasta, { recursive: true });
  mkdirSync(temporaria, { recursive: true });
  const arquivos = [];
  const usados = new Set();
  for (const [i, it] of itens.entries()) {
    const id = String(it?.id ?? "");
    if (!ID_VALIDO.test(id) || usados.has(id)) throw new Error(`id de material inválido ou repetido: "${id}"`);
    if (!it?.url) throw new Error(`o material "${id}" veio sem URL`);
    usados.add(id);
    const bruto = join(temporaria, `${i + 1}-${id}.bruto`);
    await baixar(it.url, bruto);
    if (!existsSync(bruto)) throw new Error(`o material "${id}" não baixou`);
    const destino = join(pasta, `${id}.jpg`);
    // O template lê JPG (Tela.tsx: `tela/${captura}.jpg`); o que vier em outro formato vira JPG de qualidade alta.
    if (ehJpeg(bruto)) copyFileSync(bruto, destino);
    else {
      const r = await rodarProcesso(FFMPEG, ["-y", "-v", "error", "-i", bruto, "-frames:v", "1", "-q:v", "2", destino]);
      if (r.codigo !== 0 || !existsSync(destino)) throw new Error(`não consegui converter o material "${id}" em JPG: ${r.err.trim().slice(-200)}`);
    }
    rmSync(bruto, { force: true });
    const { largura, altura } = await medir(destino);
    let miniatura = null;
    if (miniaturas) {
      const pequena = join(temporaria, `${id}-900.jpg`);
      const r = await rodarProcesso(FFMPEG, ["-y", "-v", "error", "-i", destino, "-vf", "scale=w=900:h=900:force_original_aspect_ratio=decrease", "-q:v", "4", pequena]);
      if (r.codigo === 0 && existsSync(pequena)) miniatura = readFileSync(pequena).toString("base64");
    }
    arquivos.push({
      id,
      nome: String(it.nome ?? "").slice(0, 60),
      descricao: String(it.descricao ?? "").slice(0, 300),
      papel: it.papel ?? null,
      arquivo: `${regra.pasta}/${id}.jpg`,
      largura,
      altura,
      proporcao: +(altura / largura).toFixed(4),
      miniatura,
    });
  }
  if (regra.registro === "imagens-offline") {
    for (const papel of ["antes", "depois"]) {
      if (!arquivos.some((a) => a.id === papel)) throw new Error(`a Transformação pede a foto de ${papel} e ela não veio`);
    }
  }
  return arquivos;
}

/**
 * PASSO 6b da Transformação: os dois pedidos do work/imagens.json que o curso
 * manda escrever ("antes" e "depois", com o `arquivo` da pasta imagens/). O
 * imagens.mjs os acha na pasta e eles entram já escolhidos. Vazio nos outros.
 */
export function pedidosFixosDoMaterial(modelo, arquivos) {
  if (materialNoTemplate(modelo)?.registro !== "imagens-offline") return [];
  return (arquivos ?? [])
    .filter((a) => a.id === "antes" || a.id === "depois")
    .map((a, i) => ({ id: a.id, em: i * 0.01, palavra: a.id, tipo: "foto", arquivo: `${a.id}.jpg` }));
}

/** O imagens.mjs deste modelo roda sem internet (só a pasta imagens/, o cache e os cartões)? */
export function imagensSoDoCliente(modelo) {
  return materialNoTemplate(modelo)?.registro === "imagens-offline";
}

/**
 * PASSO 6b de Etapas e Guia: registra os prints do cliente pela ferramenta do
 * curso (capturar.mjs, "print do usuário"). Id que o imagens.mjs já usou ganha
 * o sufixo "-cliente" (o print do cliente não apaga a imagem escolhida e vice
 * versa). Devolve os arquivos com o id e o caminho finais.
 */
export async function registrarMaterial(projeto, modelo, arquivos, rodar) {
  const regra = materialNoTemplate(modelo);
  if (!regra || regra.registro !== "capturar" || !arquivos?.length) return arquivos ?? [];
  const plano = JSON.parse(readFileSync(join(projeto, "src", "plano.json"), "utf8"));
  const ocupados = new Set(Object.keys(plano.imagens ?? {}));
  const finais = arquivos.map((a) => {
    let id = a.id;
    if (ocupados.has(id)) id = `${a.id}-cliente`;
    ocupados.add(id);
    return { ...a, id };
  });
  const pares = finais.map((a, i) => `${a.id}=${regra.pasta}/${arquivos[i].id}.jpg`);
  const r = await rodar(projeto, ["ferramentas/capturar.mjs", ...pares], { prazoMs: 2 * 60_000 });
  if (r.codigo !== 0) throw new Error(`capturar.mjs (material do cliente) falhou: ${String(r.saida ?? "").trim().split("\n").slice(-6).join("\n")}`);
  const depois = JSON.parse(readFileSync(join(projeto, "src", "plano.json"), "utf8"));
  for (const a of finais) {
    const registrado = depois.imagens?.[a.id];
    if (!registrado?.arquivo) throw new Error(`o print "${a.id}" do cliente não entrou em plano.imagens`);
    a.arquivo = `public/${registrado.arquivo}`;
  }
  return finais;
}

/** O material como vai ao redator do plano (o mesmo formato de lib/media/editor-do-curso/material-do-modelo.ts). */
export function materialParaORedator(modelo, arquivos) {
  const regra = materialNoTemplate(modelo);
  if (!regra?.noPlano || !arquivos?.length) return null;
  return { modelo, oQue: regra.oQue, noPlano: regra.noPlano, arquivos };
}

/** Os ids que o plano cita como material: a `captura` dos momentos e todo `imagem.id` (em qualquer nível). */
function citacoesDoPlano(plano) {
  const capturas = [];
  const imagens = [];
  const andar = (v, chave) => {
    if (Array.isArray(v)) return v.forEach((x) => andar(x, chave));
    if (!v || typeof v !== "object") return;
    for (const [k, x] of Object.entries(v)) {
      if (k === "captura" && typeof x === "string") capturas.push(x);
      else if ((k === "imagem" || k === "antes" || k === "depois") && x && typeof x === "object" && typeof x.id === "string") imagens.push(x.id);
      andar(x, k);
    }
  };
  for (const m of plano?.momentos ?? []) andar(m, "");
  return { capturas, imagens };
}

/**
 * A CONFERÊNCIA DO MATERIAL (a regra "usar só esses"): o plano não cita
 * captura nem imagem que não existe no projeto, e usa o material do cliente
 * pelo menos uma vez. Devolve as falhas como o redator lê; vazio é aprovado.
 * `imagensDoPlano`: o plano.imagens gravado (o que o imagens.mjs e o
 * capturar.mjs registraram).
 */
export function conferirMaterialNoPlano(modelo, plano, arquivos, imagensDoPlano = {}) {
  const regra = materialNoTemplate(modelo);
  if (!regra?.pasta || !arquivos?.length) return [];
  const ids = arquivos.map((a) => a.id);
  const { capturas, imagens } = citacoesDoPlano(plano);
  const falhas = [];
  if (regra.pasta === "public/tela") {
    for (const c of new Set(capturas)) if (!ids.includes(c)) falhas.push(`a captura "${c}" não existe: use só ${ids.map((i) => `"${i}"`).join(", ")}`);
    if (!capturas.some((c) => ids.includes(c))) falhas.push(`nenhum momento "tela" usa o material do cliente (${ids.map((i) => `"${i}"`).join(", ")})`);
  } else {
    const registrados = new Set(Object.keys(imagensDoPlano ?? {}));
    for (const id of new Set(imagens)) if (!registrados.has(id)) falhas.push(`a imagem "${id}" não está em plano.imagens: use só ${[...registrados].map((i) => `"${i}"`).join(", ")}`);
    if (!imagens.some((id) => ids.includes(id))) falhas.push(`o plano não usa nenhum arquivo do cliente (${ids.map((i) => `"${i}"`).join(", ")})`);
  }
  return falhas.map((f) => `MATERIAL DO CLIENTE: ${f}.`);
}
