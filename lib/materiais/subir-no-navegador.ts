import { LIMITES_DO_MATERIAL, type MaterialNaTela } from "@/lib/materiais/tipos";

/**
 * O ENVIO DE UM MATERIAL, NO NAVEGADOR (03/10/2026; separado da biblioteca em
 * 08/10 para a janela da campanha subir foto nova pelo MESMO caminho).
 *
 * Celular primeiro: a foto é reduzida no próprio aparelho (2560 px, JPEG)
 * antes de subir, o que também resolve a orientação e o HEIC do iPhone; do
 * vídeo saem a duração, uma miniatura e uma folha de três quadros, que é o
 * que a visão lê. Tudo vai para o Blob privado pela rota de token do projeto
 * (`/materiais/upload`), e o registro (`POST /materiais`) confere a pasta de
 * novo e lê as etiquetas depois da resposta. Quem usa o projeto (dono ou
 * membro da equipe) sobe; as rotas conferem.
 *
 * As dependências do navegador (canvas, vídeo, envio, fetch) entram por
 * parâmetro, com o padrão de verdade: o teste troca por falsos e roda sem rede.
 */

export type ArquivoParaPreparar = Blob & { name?: string; type: string; size: number };

export interface FotoPreparada {
  arquivo: Blob;
  mini: Blob;
  largura: number;
  altura: number;
}

export interface VideoPreparado {
  mini: Blob;
  folha: Blob;
  duracao: number;
  largura: number;
  altura: number;
}

export interface DependenciasDoEnvio {
  /** Sobe um arquivo para o Blob privado e devolve a URL. */
  enviar: (caminho: string, dado: Blob, opcoes: { handleUploadUrl: string; clientPayload: string; contentType: string; multipart: boolean }) => Promise<{ url: string }>;
  /** Registra o material na biblioteca do projeto. */
  registrar: (projectId: string, corpo: Record<string, unknown>) => Promise<{ ok: boolean; corpo: { material?: MaterialNaTela; error?: string } }>;
  prepararFoto: (f: ArquivoParaPreparar) => Promise<FotoPreparada>;
  prepararVideo: (f: ArquivoParaPreparar) => Promise<VideoPreparado>;
  agora: () => number;
}

function paraJpeg(c: HTMLCanvasElement, q = 0.9): Promise<Blob> {
  return new Promise((ok, erro) => c.toBlob((b) => (b ? ok(b) : erro(new Error("não consegui converter a imagem"))), "image/jpeg", q));
}

function canvasDe(fonte: CanvasImageSource, w: number, h: number, max: number): HTMLCanvasElement {
  const s = Math.min(1, max / Math.max(w, h));
  const c = document.createElement("canvas");
  c.width = Math.round(w * s);
  c.height = Math.round(h * s);
  c.getContext("2d")!.drawImage(fonte, 0, 0, c.width, c.height);
  return c;
}

export async function prepararFotoNoNavegador(f: ArquivoParaPreparar): Promise<FotoPreparada> {
  const bmp = await createImageBitmap(f, { imageOrientation: "from-image" });
  const c = canvasDe(bmp, bmp.width, bmp.height, 2560);
  const grande = await paraJpeg(c, 0.9);
  const mini = await paraJpeg(canvasDe(bmp, bmp.width, bmp.height, 480), 0.8);
  bmp.close();
  return { arquivo: grande, mini, largura: c.width, altura: c.height };
}

export function prepararVideoNoNavegador(f: ArquivoParaPreparar): Promise<VideoPreparado> {
  return new Promise((ok, erro) => {
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    const url = URL.createObjectURL(f);
    v.src = url;
    const quadros: HTMLCanvasElement[] = [];
    let tempos: number[] = [];
    const fim = (e?: Error) => {
      URL.revokeObjectURL(url);
      if (e) erro(e);
    };
    v.onerror = () => fim(new Error("não consegui abrir o vídeo neste aparelho"));
    v.onloadedmetadata = () => {
      const d = v.duration;
      if (!Number.isFinite(d) || d <= 0) return fim(new Error("vídeo sem duração"));
      if (d > LIMITES_DO_MATERIAL.video.maxSegundos + 1) return fim(new Error(`vídeo de ${Math.round(d)} s; aqui vão vídeos de até ${LIMITES_DO_MATERIAL.video.maxSegundos / 60} minutos`));
      tempos = [0.15, 0.5, 0.85].map((x) => x * d);
      v.currentTime = tempos[0];
    };
    v.onseeked = async () => {
      quadros.push(canvasDe(v, v.videoWidth, v.videoHeight, 480));
      if (quadros.length < tempos.length) {
        v.currentTime = tempos[quadros.length];
        return;
      }
      try {
        const mini = await paraJpeg(quadros[1], 0.8);
        const folha = document.createElement("canvas");
        folha.width = quadros.reduce((s, q) => s + q.width, 0);
        folha.height = Math.max(...quadros.map((q) => q.height));
        let x = 0;
        for (const q of quadros) {
          folha.getContext("2d")!.drawImage(q, x, 0);
          x += q.width;
        }
        const out = { mini, folha: await paraJpeg(folha, 0.8), duracao: v.duration, largura: v.videoWidth, altura: v.videoHeight };
        fim();
        ok(out);
      } catch (e) {
        fim(e instanceof Error ? e : new Error("falha ao ler o vídeo"));
      }
    };
  });
}

export const nomeSeguro = (n: string) => n.normalize("NFD").replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").slice(-60) || "arquivo";

/** O envio de verdade, no navegador. */
export const ENVIO_DO_NAVEGADOR: DependenciasDoEnvio = {
  enviar: async (caminho, dado, opcoes) => {
    const { upload } = await import("@vercel/blob/client");
    return upload(caminho, dado, { access: "private", ...opcoes });
  },
  registrar: async (projectId, corpo) => {
    const r = await fetch(`/api/projects/${projectId}/materiais`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
    return { ok: r.ok, corpo: (await r.json().catch(() => ({}))) as { material?: MaterialNaTela; error?: string } };
  },
  prepararFoto: prepararFotoNoNavegador,
  prepararVideo: prepararVideoNoNavegador,
  agora: () => Date.now(),
};

/**
 * Sobe UM arquivo (foto ou vídeo curto) e registra na biblioteca. Devolve o
 * material como a tela recebe (as etiquetas chegam depois, em segundos).
 * `soFoto`: a janela da campanha só aceita foto (vídeo vai pela biblioteca).
 * Lança com a frase que a pessoa lê.
 */
export async function subirMaterial(
  projectId: string,
  f: ArquivoParaPreparar,
  o: { soFoto?: boolean; dependencias?: DependenciasDoEnvio } = {}
): Promise<MaterialNaTela> {
  const d = o.dependencias ?? ENVIO_DO_NAVEGADOR;
  const video = f.type.startsWith("video/");
  if (video && o.soFoto) throw new Error("aqui vão só fotos; vídeo sobe pela biblioteca de materiais");
  if (!video && !f.type.startsWith("image/")) throw new Error("só foto ou vídeo");
  const base = `materiais/${projectId}/${d.agora()}-${nomeSeguro((f.name ?? "arquivo").replace(/\.[^.]+$/, ""))}`;
  const subirUm = (caminho: string, dado: Blob, tipo: "foto" | "video" | "miniatura", contentType: string) =>
    d.enviar(caminho, dado, {
      handleUploadUrl: `/api/projects/${projectId}/materiais/upload`,
      clientPayload: JSON.stringify({ tipo, tamanho: dado.size }),
      contentType,
      multipart: dado.size > 20 * 1024 * 1024,
    });
  let corpo: Record<string, unknown>;
  if (video) {
    if (f.size > LIMITES_DO_MATERIAL.video.maxBytes) throw new Error("vídeo acima de 400 MB");
    const p = await d.prepararVideo(f);
    const tipoDoVideo = f.type === "video/quicktime" || f.type === "video/webm" ? f.type : "video/mp4";
    const [arq, mini, folha] = [
      await subirUm(`${base}.${tipoDoVideo === "video/quicktime" ? "mov" : tipoDoVideo === "video/webm" ? "webm" : "mp4"}`, f, "video", tipoDoVideo),
      await subirUm(`${base}-mini.jpg`, p.mini, "miniatura", "image/jpeg"),
      await subirUm(`${base}-folha.jpg`, p.folha, "miniatura", "image/jpeg"),
    ];
    corpo = { tipo: "video", url: arq.url, miniaturaUrl: mini.url, folhaUrl: folha.url, duracaoSec: p.duracao, largura: p.largura, altura: p.altura, sizeBytes: f.size, mimeType: tipoDoVideo, nome: f.name };
  } else {
    const p = await d.prepararFoto(f);
    const arq = await subirUm(`${base}.jpg`, p.arquivo, "foto", "image/jpeg");
    const mini = await subirUm(`${base}-mini.jpg`, p.mini, "miniatura", "image/jpeg");
    corpo = { tipo: "foto", url: arq.url, miniaturaUrl: mini.url, largura: p.largura, altura: p.altura, sizeBytes: p.arquivo.size, mimeType: "image/jpeg", nome: f.name };
  }
  const r = await d.registrar(projectId, corpo);
  if (!r.ok || !r.corpo.material) throw new Error(r.corpo.error ?? "não registrou");
  return r.corpo.material;
}
