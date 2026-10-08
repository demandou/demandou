"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Check, ImagePlus, Images, Library, Loader2, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { GaleriaDaBiblioteca } from "@/components/biblioteca-de-design/galeria-da-biblioteca";
import { CriarEstilo } from "@/components/estilo-dos-posts/criar-estilo";
import { AvisoDescartavel } from "@/components/ui/descartar";
import type { DesignDaGaleria } from "@/lib/biblioteca-de-design/tipos";
import { designServeAoPost, escolhaDoDesign, ROTULO_DO_POST, type ModeloDoPost, type PostVisual } from "@/lib/estilo-dos-posts/tipos";
import { modeloPorId } from "@/lib/modelos-de-arte/catalogo";
import { LIMITES_DO_MATERIAL, ROTULO_DA_ETIQUETA, type MaterialNaTela } from "@/lib/materiais/tipos";
import { subirMaterial } from "@/lib/materiais/subir-no-navegador";
import {
  alternarFoto,
  comEstiloDaFoto,
  comFotoNova,
  distribuirFotos,
  ESTILO_MESTRE,
  MAXIMO_DE_FOTOS,
  moverFoto,
  postRecebeAFoto,
  postsQueRecebemFoto,
  resumoDoPost,
  ROTULO_DA_PORTA,
  type FotoDaCampanha,
  type MaterialProprio,
  type PortaDoEstilo,
} from "@/lib/materiais/material-da-campanha";

/**
 * MATERIAL SEU NESTA CAMPANHA (08/10/2026).
 *
 * O pedido do Bruno: "durante a criação da campanha, mesmo que ele já tenha
 * subido lá na configuração, é legal ele ter a opção: você vai usar material
 * seu, foto sua, escritório seu? Vai usar essas que já existem ou vai subir
 * uma nova? (...) Aí ele seleciona quais fotos vai usar nessa campanha: a foto
 * 1, a 5, a 10. E em qual estilo cada foto vai se encaixar: deve escolher um
 * estilo POR FOTO. (...) Se for carrossel, ele escolhe várias fotos."
 *
 * Um bloco só, encaixado na janela da campanha por tema e no passo dos posts
 * da semana do vídeo:
 *   1. a pergunta (sim, não desta vez; sem responder vale a regra de hoje);
 *   2. as fotos da Biblioteca de materiais, com seleção múltipla, e o botão de
 *      subir foto nova ali mesmo (o mesmo envio da biblioteca, que grava e
 *      etiqueta: lib/materiais/subir-no-navegador.ts);
 *   3. por foto: o post em que ela entra (a regra padrão distribui, e a
 *      pessoa troca) e o estilo dela, nas três portas da plataforma: "Estilo
 *      mestre" (segue o estilo do post), "Da biblioteca" e "Criar o meu";
 *   4. por post: onde as fotos entram (a lâmina, no carrossel) e o que sai
 *      sem foto, sem prometer nada que a esteira não faz.
 *
 * Membro da equipe usa igual ao dono: subir foto, escolher e criar o modelo
 * de um post não mudam nada do projeto. Quem não tem foto nenhuma segue sem
 * material próprio: nada aqui tranca a campanha. As regras moram em
 * lib/materiais/material-da-campanha.ts.
 */

const formatosDoBook = (catalogoId: string) => modeloPorId(catalogoId)?.formatos;

/** O design da biblioteca tem lugar para uma foto? O do book diz; o criado por cliente é foto inteira. */
function designRecebeFoto(d: DesignDaGaleria, formato: PostVisual["formato"]): boolean {
  if (!designServeAoPost(d, formato, formatosDoBook)) return false;
  if (!d.catalogoId) return true;
  const m = modeloPorId(d.catalogoId);
  return !m || m.foto !== "nenhuma";
}

const miniatura = (projectId: string, id: string) => `/api/projects/${projectId}/materiais/${id}/arquivo?v=mini`;

/** "Segunda 13 · Foto": o dia como a janela chama e o tipo do post. */
function rotuloCurto(p: PostVisual): string {
  return `${p.rotulo} · ${ROTULO_DO_POST[p.formato]}`;
}

export function MaterialDaCampanha({
  projectId,
  posts,
  laminas,
  valor,
  aoMudar,
  modelosDosPosts,
  nota,
}: {
  projectId: string;
  /** Os posts visuais da campanha (o bloco usa os de foto e de carrossel). */
  posts: PostVisual[];
  /** Quantas lâminas cada carrossel tem: é o teto de fotos de um carrossel. */
  laminas: number;
  /** A escolha de agora; null: a pessoa ainda não respondeu (vale a regra de hoje). */
  valor: MaterialProprio | null;
  aoMudar: (novo: MaterialProprio | null) => void;
  /** O modelo de cada post, para o "Estilo mestre" dizer o que a foto segue. */
  modelosDosPosts?: Record<string, ModeloDoPost | undefined>;
  /** Uma linha a mais sobre esta campanha (a quinzenal, por exemplo). */
  nota?: string;
}) {
  const [biblioteca, setBiblioteca] = useState<MaterialNaTela[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [envio, setEnvio] = useState<{ feitos: number; total: number } | null>(null);
  const [painel, setPainel] = useState<{ id: string; porta: Exclude<PortaDoEstilo, "mestre"> } | null>(null);
  const entrada = useRef<HTMLInputElement>(null);
  // Quem chama recria as funções a cada desenho; o envio (assíncrono) lê a escolha de agora.
  const atual = useRef({ valor, aoMudar, posts, laminas });
  useEffect(() => {
    atual.current = { valor, aoMudar, posts, laminas };
  });

  const alvos = useMemo(() => postsQueRecebemFoto(posts), [posts]);
  const usar = valor?.usar === true;

  async function carregar() {
    setErro(null);
    try {
      const r = await fetch(`/api/projects/${projectId}/materiais`, { cache: "no-store" });
      if (!r.ok) throw new Error();
      const j = (await r.json()) as { materiais: MaterialNaTela[] };
      setBiblioteca(j.materiais.filter((m) => m.tipo === "foto"));
    } catch {
      setErro("Não consegui ler a sua biblioteca agora.");
      setBiblioteca((b) => b ?? []);
    }
  }

  // A biblioteca só é lida quando a pessoa diz que vai usar material dela.
  useEffect(() => {
    if (usar && biblioteca === null) void carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usar]);

  // Os posts mudaram (um dia virou texto, o carrossel perdeu lâminas): só a
  // foto que ficou sem lugar procura outro, pela regra padrão; as outras ficam
  // onde a pessoa já viu.
  const chaveDosPosts = alvos.map((p) => `${p.chave}:${p.formato}`).join("|");
  useEffect(() => {
    const { valor: v, aoMudar: mudar, posts: ps, laminas: n } = atual.current;
    if (!v?.usar) return;
    const arrumado = distribuirFotos(v, ps, n, { manterValidas: true });
    if (JSON.stringify(arrumado) !== JSON.stringify(v)) mudar(arrumado);
  }, [chaveDosPosts, laminas]);

  // As fotos que aparecem para escolher: as da biblioteca (sem documento), e
  // as já marcadas sempre (mesmo que a leitura as tenha etiquetado depois).
  const marcadas = useMemo(() => new Map((valor?.fotos ?? []).map((f, i) => [f.id, i] as const)), [valor]);
  const visiveis = useMemo(() => (biblioteca ?? []).filter((m) => marcadas.has(m.id) || !m.etiquetas.includes("documento")), [biblioteca, marcadas]);
  const porId = useMemo(() => new Map((biblioteca ?? []).map((m) => [m.id, m] as const)), [biblioteca]);

  function responder(sim: boolean) {
    setPainel(null);
    if (sim) aoMudar(valor?.usar ? valor : distribuirFotos({ usar: true, fotos: [] }, posts, laminas));
    else aoMudar({ usar: false, fotos: [] });
  }

  async function subir(lista: FileList | null) {
    if (!lista?.length) return;
    const arquivos = Array.from(lista).slice(0, LIMITES_DO_MATERIAL.porEnvio);
    let feitos = 0;
    const falhas: string[] = [];
    for (const f of arquivos) {
      setEnvio({ feitos, total: arquivos.length });
      try {
        const m = await subirMaterial(projectId, f, { soFoto: true });
        setBiblioteca((b) => [m, ...(b ?? [])]);
        const { valor: v, aoMudar: mudar, posts: ps, laminas: n } = atual.current;
        const novo = comFotoNova(v, m.id, ps, n);
        atual.current = { ...atual.current, valor: novo };
        mudar(novo);
        feitos++;
      } catch (e) {
        falhas.push(`${f.name}: ${e instanceof Error ? e.message : "falhou"}`);
      }
    }
    setEnvio(null);
    if (feitos) toast.success(feitos === 1 ? "Foto salva na sua biblioteca e marcada para esta campanha." : `${feitos} fotos salvas na sua biblioteca e marcadas para esta campanha.`);
    if (falhas.length) toast.error(falhas.slice(0, 3).join("\n"), { duration: 8000 });
    if (entrada.current) entrada.current.value = "";
  }

  function escolherEstilo(foto: FotoDaCampanha, porta: PortaDoEstilo, modelo?: ModeloDoPost) {
    const { valor: v, aoMudar: mudar } = atual.current;
    if (!v) return;
    if (porta === "mestre") {
      mudar(comEstiloDaFoto(v, foto.id, ESTILO_MESTRE));
      setPainel(null);
      return;
    }
    if (modelo) {
      mudar(comEstiloDaFoto(v, foto.id, { porta, modelo }));
      setPainel(null);
    }
  }

  const fotosDoPost = (chave: string) => (valor?.fotos ?? []).filter((f) => f.post === chave);
  const foraDaCampanha = (valor?.fotos ?? []).filter((f) => f.post === null);

  return (
    <section className="flex flex-col gap-3 rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }} aria-label="Material seu nesta campanha">
      <div>
        <p className="flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
          <Images className="h-4 w-4 text-orange-400" />
          Material seu nesta campanha
        </p>
        <p className="mt-0.5 text-[12px] leading-snug" style={{ color: "var(--text-muted)" }}>
          Vai usar foto sua, do seu escritório ou do seu produto nos posts desta campanha?
        </p>
      </div>

      {alvos.length === 0 ? (
        <p className="text-[12px] leading-snug" style={{ color: "var(--text-muted)" }}>
          Esta campanha ainda não tem dia de foto ou de carrossel, que é onde a sua foto entra. Marque um dia assim e escolha as fotos aqui.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Usar material seu nesta campanha">
            {(
              [
                [true, "Sim, usar fotos minhas"],
                [false, "Não desta vez"],
              ] as const
            ).map(([sim, rotulo]) => {
              const ativo = valor !== null && valor.usar === sim;
              return (
                <button
                  key={rotulo}
                  type="button"
                  role="radio"
                  aria-checked={ativo}
                  onClick={() => responder(sim)}
                  className={cn("h-9 rounded-lg border px-3 text-xs font-semibold transition-all", ativo ? "border-orange-500 bg-orange-500/10" : "hover:border-orange-500/40")}
                  style={{ borderColor: ativo ? undefined : "var(--border)", color: "var(--text-primary)" }}
                >
                  {rotulo}
                </button>
              );
            })}
            {valor !== null && (
              <button type="button" onClick={() => { setPainel(null); aoMudar(null); }} className="h-9 px-2 text-[11px] underline-offset-2 hover:underline" style={{ color: "var(--text-muted)" }}>
                Deixar o squad decidir
              </button>
            )}
          </div>

          {valor === null && (
            <p className="text-[12px] leading-snug" style={{ color: "var(--text-muted)" }}>
              Sem responder, vale o de sempre: o squad usa uma foto da sua biblioteca quando ela serve ao post.
            </p>
          )}
          {valor?.usar === false && (
            <p className="text-[12px] leading-snug" style={{ color: "var(--text-muted)" }}>
              Nesta campanha nenhuma foto sua entra: as artes saem geradas no modelo de cada post.
            </p>
          )}

          {usar && (
            <div className="flex flex-col gap-3">
              {erro && (
                <AvisoDescartavel key={erro} chave={null} className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>{erro} Você ainda pode subir uma foto nova aqui, ou seguir sem material próprio.</span>
                    <button type="button" onClick={() => void carregar()} className="inline-flex items-center gap-1 rounded-md border px-2 py-1 font-semibold" style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}>
                      <RefreshCw className="h-3.5 w-3.5" /> Tentar de novo
                    </button>
                  </div>
                </AvisoDescartavel>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>
                  {visiveis.length ? "Escolha as fotos desta campanha" : "Suba as fotos desta campanha"}
                  {valor && valor.fotos.length > 0 && <span style={{ color: "var(--text-muted)", fontWeight: 400 }}> · {valor.fotos.length} marcada{valor.fotos.length === 1 ? "" : "s"}</span>}
                </p>
                <button
                  type="button"
                  onClick={() => entrada.current?.click()}
                  disabled={Boolean(envio)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-orange-500 px-3 text-xs font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
                >
                  {envio ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                  {envio ? `Enviando ${envio.feitos + 1} de ${envio.total}` : "Subir foto nova"}
                </button>
                <input ref={entrada} type="file" accept="image/*" multiple className="hidden" onChange={(e) => void subir(e.target.files)} />
              </div>

              {biblioteca === null ? (
                <p className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Lendo a sua biblioteca
                </p>
              ) : visiveis.length === 0 ? (
                <button
                  type="button"
                  onClick={() => entrada.current?.click()}
                  className="flex flex-col items-center gap-1 rounded-xl border border-dashed px-4 py-6 text-center transition-colors hover:border-orange-500/50"
                  style={{ borderColor: "var(--border)" }}
                >
                  <ImagePlus className="h-6 w-6 text-orange-400" />
                  <span className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                    Você ainda não tem fotos na biblioteca
                  </span>
                  <span className="max-w-[420px] text-[12px]" style={{ color: "var(--text-muted)" }}>
                    Suba uma sua de frente, do seu espaço ou do seu produto. Prefere seguir sem? Toque em Não desta vez.
                  </span>
                </button>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Fotos da sua biblioteca">
                  {visiveis.map((m) => {
                    const ordem = marcadas.get(m.id);
                    const sel = ordem !== undefined;
                    const cheio = !sel && (valor?.fotos.length ?? 0) >= MAXIMO_DE_FOTOS;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => valor && aoMudar(alternarFoto(valor, m.id, posts, laminas))}
                        disabled={cheio}
                        aria-pressed={sel}
                        aria-label={`${sel ? "Desmarcar" : "Marcar"} ${m.descricao ?? m.nome ?? "foto"}`}
                        title={m.descricao ?? undefined}
                        className={cn("relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all disabled:opacity-40", sel ? "border-orange-500" : "border-transparent opacity-80 hover:opacity-100")}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={miniatura(projectId, m.id)} alt="" loading="lazy" className="h-full w-full object-cover" />
                        {sel && (
                          <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
                            {ordem + 1}
                          </span>
                        )}
                        {m.status === "analisando" ? (
                          <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 text-[10px] text-white">lendo</span>
                        ) : m.etiquetas[0] ? (
                          <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 text-[10px] text-white">{ROTULO_DA_ETIQUETA[m.etiquetas[0]]}</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}

              {valor && valor.fotos.length === 0 && (biblioteca?.length ?? 0) > 0 && (
                <p className="text-[12px] leading-snug" style={{ color: "var(--text-muted)" }}>
                  Nenhuma foto marcada ainda. Sem marcar, vale o de sempre: o squad usa uma foto da sua biblioteca quando ela serve ao post.
                </p>
              )}

              {valor && valor.fotos.length > 0 && (
                <ul className="flex flex-col divide-y rounded-lg border" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }} aria-label="As fotos marcadas e o estilo de cada uma">
                  {valor.fotos.map((f, i) => {
                    const m = porId.get(f.id);
                    const destino = alvos.find((p) => p.chave === f.post) ?? null;
                    const aberto = painel?.id === f.id ? painel : null;
                    const doPost = destino ? modelosDosPosts?.[destino.chave] : undefined;
                    return (
                      <li key={f.id} className="flex flex-col gap-2 p-2.5" style={{ borderColor: "var(--border)" }}>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md" style={{ background: "var(--bg-card)" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={miniatura(projectId, f.id)} alt={m?.descricao ?? `Foto ${i + 1}`} className="h-full w-full object-cover" />
                            <span className="absolute left-0.5 top-0.5 rounded bg-black/70 px-1 text-[10px] font-bold text-white">{i + 1}</span>
                          </span>
                          <label className="flex min-w-[160px] flex-1 flex-col gap-0.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
                            Vai em
                            <select
                              value={f.post ?? ""}
                              onChange={(e) => valor && aoMudar(moverFoto(valor, f.id, e.target.value || null, posts, laminas))}
                              className="h-8 rounded-md border px-2 text-xs outline-none"
                              style={{ borderColor: "var(--border)", background: "var(--bg-input)", color: "var(--text-primary)" }}
                            >
                              {alvos.map((p) => {
                                const outra = p.formato === "image" ? valor.fotos.findIndex((x) => x.id !== f.id && x.post === p.chave) : -1;
                                const cheio = f.post !== p.chave && !postRecebeAFoto(valor, f.id, p, laminas);
                                return (
                                  <option key={p.chave} value={p.chave} disabled={cheio}>
                                    {rotuloCurto(p)}
                                    {outra >= 0 ? ` (troca com a foto ${outra + 1})` : ""}
                                    {cheio ? " (todas as lâminas já têm foto)" : ""}
                                  </option>
                                );
                              })}
                              <option value="">Fica fora desta campanha</option>
                            </select>
                          </label>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                              Estilo desta foto
                            </span>
                            <div className="flex flex-wrap gap-1" role="radiogroup" aria-label={`O estilo da foto ${i + 1}`}>
                              {(["mestre", "biblioteca", "criado"] as const).map((porta) => {
                                const ativo = f.estilo.porta === porta;
                                const Icone = porta === "mestre" ? Sparkles : porta === "biblioteca" ? Library : Wand2;
                                return (
                                  <button
                                    key={porta}
                                    type="button"
                                    role="radio"
                                    aria-checked={ativo}
                                    onClick={() => (porta === "mestre" ? escolherEstilo(f, "mestre") : setPainel(aberto?.porta === porta ? null : { id: f.id, porta }))}
                                    className={cn("inline-flex h-8 items-center gap-1 rounded-full border px-2.5 text-[11px] font-semibold", ativo ? "border-orange-500 bg-orange-500/10" : "")}
                                    style={{ borderColor: ativo ? undefined : "var(--border)", color: ativo ? "var(--text-primary)" : "var(--text-muted)" }}
                                  >
                                    <Icone className="h-3.5 w-3.5" /> {ROTULO_DA_PORTA[porta]}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        <p className="flex items-center gap-1 text-[11px] leading-snug" style={{ color: "var(--text-muted)" }}>
                          <Check className="h-3.5 w-3.5 shrink-0 text-green-600" />
                          {f.estilo.porta === "mestre"
                            ? destino
                              ? doPost?.catalogoId && modeloPorId(doPost.catalogoId)?.foto === "nenhuma"
                                ? `O modelo do post ("${doPost.nome ?? "só texto"}") é só texto: a foto entra num molde com foto, nas cores e na letra da sua marca.`
                                : `Segue o estilo do post${doPost?.nome ? ` ("${doPost.nome}")` : ""}.`
                              : "Segue o estilo do post em que entrar."
                            : `${ROTULO_DA_PORTA[f.estilo.porta]}: "${f.estilo.modelo.nome ?? "modelo escolhido"}".`}
                          {!destino && " Esta foto fica fora: não entra em nenhum post desta campanha."}
                        </p>
                        {aberto?.porta === "biblioteca" && (
                          <div className="rounded-lg border p-2" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}>
                            <GaleriaDaBiblioteca
                              projectId={projectId}
                              tipoFixo="imagem"
                              semEscrever
                              titulo={`Um estilo para a foto ${i + 1}`}
                              descricao="Só os modelos com lugar para a sua foto. O texto do post vai por cima, no modelo."
                              filtrar={(d: DesignDaGaleria) => designRecebeFoto(d, destino?.formato ?? "image")}
                              rotuloDoUsar="Usar nesta foto"
                              aoEscolher={async (d) => escolherEstilo(f, "biblioteca", escolhaDoDesign(d))}
                            />
                          </div>
                        )}
                        {aberto?.porta === "criado" && (
                          <div className="rounded-lg border p-2" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}>
                            <CriarEstilo
                              projectId={projectId}
                              paraOPost
                              aoCriar={(r) => {
                                // O modelo criado já vale para esta foto; a conversa fica aberta para ajustar.
                                const atualizado = atual.current.valor;
                                if (atualizado) atual.current.aoMudar(comEstiloDaFoto(atualizado, f.id, { porta: "criado", modelo: escolhaDoDesign(r.design) }));
                                toast.success(`"${r.design.nome}" é o estilo da foto ${i + 1}.`, { id: `estilo-foto-${f.id}` });
                              }}
                            />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              {valor && valor.fotos.length > 0 && (
                <ul className="flex flex-col gap-1 text-[12px]" aria-label="Onde as suas fotos entram">
                  {alvos.map((p) => (
                    <li key={p.chave} style={{ color: "var(--text-muted)" }}>
                      <b className="font-semibold" style={{ color: "var(--text-primary)" }}>
                        {rotuloCurto(p)}
                      </b>
                      : {resumoDoPost({ post: p, fotos: fotosDoPost(p.chave), laminas })}
                    </li>
                  ))}
                  {foraDaCampanha.length > 0 && (
                    <li style={{ color: "var(--text-muted)" }}>
                      {foraDaCampanha.length === 1 ? "1 foto fica fora" : `${foraDaCampanha.length} fotos ficam fora`}: não sobrou post de foto ou lâmina livre. Troque o post de outra foto ou marque mais um dia de foto.
                    </li>
                  )}
                </ul>
              )}

              <p className="text-[11px] leading-snug" style={{ color: "var(--text-muted)" }}>
                A regra padrão: a primeira foto vai no primeiro post de foto ou carrossel, a segunda no seguinte, e as que sobram vão para as lâminas dos carrosséis. Troque em Vai em. Foto que você não marcar não entra nesta campanha.
                {nota ? ` ${nota}` : ""}
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
