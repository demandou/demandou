import { spawn } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/** O recorte.py mora ao lado deste arquivo, e não na pasta temporária. */
const AQUI = dirname(fileURLToPath(import.meta.url));

/**
 * A ponte para o recorte da pessoa, que roda em Python.
 *
 * Existe porque segmentação de pessoa precisa de modelo, e o único que roda
 * rápido em CPU sem GPU é o Selfie Segmenter do MediaPipe, com binding maduro só
 * em Python. O `recorte.py` faz o trabalho e devolve duas coisas: um vídeo em
 * tons de cinza, que é a máscara, e a caixa APERTADA em pixels.
 *
 * A caixa apertada importa tanto quanto a máscara. O Node precisa recortar a
 * imagem colorida exatamente onde o Python recortou, senão a máscara fica
 * deslocada da pessoa e o resultado é um recorte torto, que é pior que não
 * recortar.
 *
 * ## Falhar aqui não derruba o corte
 *
 * Mesma regra do agente de visão: sem recorte o vídeo sai na composição antiga,
 * que é pior mas existe. Entregar corte mediano é melhor que não entregar corte
 * porque o modelo de segmentação teve um dia ruim.
 */

/**
 * O interpretador do recorte. No contêiner é o python3 do Debian; no Windows
 * de desenvolvimento o "python3" é o atalho da loja, e o Python com MediaPipe
 * é outro. A variável existe só para a prova local rodar o MESMO código.
 */
const PYTHON = process.env.PYTHON_DO_RECORTE ?? "python3";

const MODELO =
  process.env.MODELO_SEGMENTACAO ?? "/app/modelos/selfie_segmenter.tflite";

/** O tempo que a segmentação pode levar, proporcional ao trecho.
 *
 * Medido em 23/08 no vídeo real: 180 quadros em 11,9 s, ou seja perto de 2x o
 * tempo real, contando a decodificação e a codificação da máscara. Seis vezes a
 * duração dá folga de três, e o piso de dois minutos cobre trecho curto, em que
 * a partida do Python pesa mais que o trabalho.
 */
function prazo(duracaoSec) {
  return Math.max(120_000, Math.round(duracaoSec * 6_000));
}

/**
 * Gera a máscara de recorte de um trecho.
 *
 * Devolve `null` quando não dá para recortar, e quem chama cai na composição
 * antiga.
 */
export async function gerarMatte(entrada, pasta, indice, inicio, duracao, caixa) {
  if (!caixa) return null;

  const saida = join(pasta, `matte-${indice}.mp4`);
  const config = JSON.stringify({
    video: entrada,
    saida,
    inicio,
    duracao,
    fps: 30,
    modelo: MODELO,
    caixa,
  });

  const texto = await new Promise((resolve) => {
    const p = spawn(PYTHON, [join(AQUI, "recorte.py"), config], {
      cwd: pasta,
    });
    let saidaPadrao = "";
    let erro = "";
    p.stdout.on("data", (d) => (saidaPadrao += d));
    p.stderr.on("data", (d) => (erro += d));

    const relogio = setTimeout(() => {
      p.kill("SIGKILL");
      resolve(null);
    }, prazo(duracao));

    p.on("close", (codigo) => {
      clearTimeout(relogio);
      if (codigo !== 0) {
        // O stderr do MediaPipe é barulhento mesmo quando dá certo, então só
        // interessa quando o processo morreu.
        console.error(
          `[recorte ${indice}] python saiu com ${codigo}: ${erro.slice(-400)}`
        );
        return resolve(null);
      }
      resolve(saidaPadrao);
    });
    p.on("error", (e) => {
      clearTimeout(relogio);
      console.error(`[recorte ${indice}] não consegui rodar o python: ${e.message}`);
      resolve(null);
    });
  });

  if (!texto) return null;

  try {
    // O MediaPipe escreve avisos no stdout em algumas versões, então pega a
    // última linha que é JSON em vez de assumir que a saída inteira é JSON.
    const linha = texto
      .trim()
      .split(String.fromCharCode(10))
      .reverse()
      .find((l) => l.trim().startsWith("{"));
    if (!linha) return null;

    const r = JSON.parse(linha);
    if (!r.ok || !r.recorte || r.quadros < 1) return null;
    return {
      arquivo: saida,
      recorte: r.recorte,
      quadros: r.quadros,
      // Onde a pessoa esta na horizontal, em fracao da largura do recorte. Sem
      // isso a composicao centraliza a CAIXA e nao a pessoa, e ela sai
      // deslocada: medido na gravacao real, ela fica em 33% da caixa.
      centro: typeof r.centro === "number" ? r.centro : 0.5,
    };
  } catch {
    return null;
  }
}

/**
 * Acha ONDE a pessoa esta, sem segmentar, pela regiao que se move.
 *
 * A rede de seguranca para quando o agente de visao nao devolve a caixa da
 * pessoa, o que aconteceu em 24/08 com ele DESCREVENDO a webcam no motivo. A
 * deteccao e deterministica (diferenca entre quadros distantes) e ja provou
 * precisao de poucos pixels contra medicao a olho.
 *
 * Devolve null quando nao ha regiao clara de movimento, e quem chama segue
 * sem caixa, como antes.
 */
export async function acharCaixaDaPessoa(entrada, pasta, indice, inicio, duracao) {
  const config = JSON.stringify({
    modo: "caixa",
    video: entrada,
    inicio,
    duracao,
  });
  const texto = await new Promise((resolve) => {
    const p = spawn(PYTHON, [join(AQUI, "recorte.py"), config], { cwd: pasta });
    let saidaPadrao = "";
    p.stdout.on("data", (d) => (saidaPadrao += d));
    p.stderr.on("data", () => {});
    const relogio = setTimeout(() => {
      p.kill("SIGKILL");
      resolve(null);
    }, 60_000);
    p.on("close", (codigo) => {
      clearTimeout(relogio);
      resolve(codigo === 0 ? saidaPadrao : null);
    });
    p.on("error", () => {
      clearTimeout(relogio);
      resolve(null);
    });
  });
  if (!texto) return null;
  try {
    const linha = texto
      .trim()
      .split(String.fromCharCode(10))
      .reverse()
      .find((l) => l.trim().startsWith("{"));
    if (!linha) return null;
    const r = JSON.parse(linha);
    return r.ok && r.caixa ? r.caixa : null;
  } catch {
    return null;
  }
}

const MODELO_ROSTO = process.env.MODELO_ROSTO ?? "/app/modelos/face_landmarker.task";
const MODELO_MULTICLASSE = process.env.MODELO_MULTICLASSE ?? "/app/modelos/selfie_multiclass.tflite";

/** Roda o quadro-da-capa.py com um pedido e devolve a última linha JSON, ou null. */
async function rodarQuadroDaCapa(config, nome) {
  const texto = await new Promise((resolve) => {
    const p = spawn(PYTHON, [join(AQUI, "quadro-da-capa.py"), JSON.stringify(config)], { cwd: dirname(config.saida) });
    let saidaPadrao = "";
    let erro = "";
    p.stdout.on("data", (d) => (saidaPadrao += d));
    p.stderr.on("data", (d) => (erro += d));
    // Cada quadro custa uma busca do ffmpeg e uma inferência (perto de 1 s
    // medido na máquina de desenvolvimento); 40 quadros cabem em 3 min.
    const relogio = setTimeout(() => {
      p.kill("SIGKILL");
      resolve(null);
    }, 180_000);
    p.on("close", (codigo) => {
      clearTimeout(relogio);
      if (codigo !== 0) console.error(`[capa ${nome}] python saiu com ${codigo}: ${erro.slice(-400)}`);
      resolve(codigo === 0 ? saidaPadrao : null);
    });
    p.on("error", (e) => {
      clearTimeout(relogio);
      console.error(`[capa ${nome}] não consegui rodar o python: ${e.message}`);
      resolve(null);
    });
  });
  if (!texto) return null;
  try {
    const linha = texto
      .trim()
      .split(String.fromCharCode(10))
      .reverse()
      .find((l) => l.trim().startsWith("{"));
    return linha ? JSON.parse(linha) : null;
  } catch {
    return null;
  }
}

/**
 * O QUADRO DA CAPA (30/09; nítido desde 11/10): o melhor quadro real como
 * foto, e a pessoa recortada dele. Ver quadro-da-capa.py (a medida) e
 * quadro-nitido.mjs (a regra: olho aberto, rosto inteiro e grande o bastante,
 * nítido, de frente, sem ampliar demais).
 *
 * `fonte` é { video, instantes, alvo? } para escolher entre quadros, ou
 * { imagem } para só recortar um quadro já escolhido. Devolve null quando
 * nenhum quadro serve: quem chama segue SEM a foto da pessoa (nunca com um
 * quadro ruim). `alvo` ({ largura, altura }) é o destino, quando conhecido:
 * o quadro que precisaria ampliar mais de 2x para cobri-lo não serve.
 */
export async function quadroDaCapa(fonte, pasta, nome) {
  const base = { saida: join(pasta, nome), modelo_rosto: MODELO_ROSTO, modelo_segmentacao: MODELO_MULTICLASSE };
  if (fonte.imagem) {
    const r = await rodarQuadroDaCapa({ ...base, imagem: fonte.imagem }, nome);
    return r && !r.erro ? r : null;
  }
  const medidas = await rodarQuadroDaCapa({ ...base, video: fonte.video, instantes: fonte.instantes }, nome);
  if (!medidas || !Array.isArray(medidas.candidatos)) return null;
  const { escolherQuadroNitido } = await import("./quadro-nitido.mjs");
  const { escolhido, descartados } = escolherQuadroNitido(medidas.candidatos, { alvo: fonte.alvo ?? null });
  if (!escolhido) {
    console.log(`[capa ${nome}] nenhum quadro nítido em ${medidas.avaliados} (${descartados.slice(0, 6).map((d) => `${d.instante}s: ${d.motivos.join(", ")}`).join("; ")}): a capa sai sem a foto`);
    return null;
  }
  const recorte = await rodarQuadroDaCapa({ ...base, saida: join(pasta, `${nome}-final`), imagem: escolhido.quadro }, nome);
  if (!recorte || recorte.erro) return null;
  return {
    ...recorte,
    instante: escolhido.instante,
    quadro: escolhido.quadro,
    notas: escolhido.medida,
    rosto: escolhido.medida.caixa,
    avaliados: medidas.avaliados,
    descartados: descartados.length,
  };
}

/**
 * VÁRIOS QUADROS NÍTIDOS E DIFERENTES (11/10): um por peça da campanha, para
 * a janela da pessoa do modelo não repetir o mesmo quadro em todas. Mede os
 * instantes uma vez, fica com os que passam na regra, em ordem de nota, a pelo
 * menos `distancia` segundos uns dos outros. Sem recorte (o modelo usa o
 * quadro inteiro). Devolve [] quando nenhum serve.
 */
export async function quadrosNitidos(fonte, pasta, nome, { quantos = 1, distancia = 8 } = {}) {
  const base = { saida: join(pasta, nome), modelo_rosto: MODELO_ROSTO, modelo_segmentacao: MODELO_MULTICLASSE };
  const medidas = await rodarQuadroDaCapa({ ...base, video: fonte.video, instantes: fonte.instantes }, nome);
  if (!medidas || !Array.isArray(medidas.candidatos)) return [];
  const { escolherVariosNitidos } = await import("./quadro-nitido.mjs");
  return escolherVariosNitidos(medidas.candidatos, { quantos, distancia, alvo: fonte.alvo ?? null });
}

/** Instantes espalhados num intervalo, fugindo das bordas (entrada e saída de fala). */
export function instantesEspalhados(inicio, duracao, quantos) {
  return Array.from({ length: quantos }, (_, i) =>
    Math.round((inicio + duracao * (0.04 + (0.92 * i) / Math.max(1, quantos - 1))) * 100) / 100
  );
}
