"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Check, Clapperboard, Loader2, Palette, Pencil, RefreshCw, Sparkles } from "lucide-react";
import { GaleriaDaBiblioteca } from "@/components/biblioteca-de-design/galeria-da-biblioteca";
import { CriarEstilo } from "@/components/estilo-dos-posts/criar-estilo";
import { OpcoesDeEstilo } from "@/components/estilo-dos-posts/opcoes-de-estilo";
import { AvisoDescartavel } from "@/components/ui/descartar";
import type { DesignDaGaleria } from "@/lib/biblioteca-de-design/tipos";
import { CATALOGO_DE_ESTILOS, estiloEmDestaque } from "@/lib/media/catalogo-de-estilos";
import { modeloPorId } from "@/lib/modelos-de-arte/catalogo";
import { OPCOES_DE_ESTILO, type OpcaoDeEstilo } from "@/lib/estilo-dos-posts/estilo-mestre";
import {
  designServeAoPost,
  ESCOLHA_DO_MESTRE,
  escolhaDoDesign,
  modeloServeAoPost,
  oQueOPostPede,
  opcaoDaEscolha,
  padraoDaImagemDoEstado,
  postsSemModelo,
  preencherModelos,
  ROTULO_DO_POST,
  type EstadoDoEstiloDosPosts,
  type EstadoDoMestre,
  type ModeloDoPost,
  type ModelosDosPosts,
  type PostVisual,
} from "@/lib/estilo-dos-posts/tipos";

/**
 * O MODELO DE CADA POST (08/10/2026).
 *
 * Decisão do Bruno, literal: "o modelo precisa ser escolhido por post (quarta
 * é um carrossel, precisa escolher o modelo), quinta é uma foto (escolher
 * modelo) etc... sexta é um vídeo curto (short, reel e tiktok) escolher o
 * estilo". E: "essa parte só cria o modelo, depois no quadro a IA coloca o
 * conteúdo dentro do modelo selecionado ou criado".
 *
 * 08/10, à noite, O ESTILO MESTRE: "deixar a IA criar a partir do estilo
 * mestre selecionado (o estilo do vídeo; aí toda arte segue o mesmo design),
 * escolher um estilo da biblioteca ou criar meu próprio estilo a partir de uma
 * ideia". Cada post com peça visual mostra as TRÊS portas de sempre
 * (components/estilo-dos-posts/opcoes-de-estilo.tsx), na mesma ordem, e vem
 * PREENCHIDO com o estilo mestre:
 *   - foto e carrossel: o estilo mestre (a arte usa o design mestre, o
 *     design que sai do estilo do vídeo), um modelo da biblioteca que serve
 *     àquele tipo, ou um criado falando ou escrevendo;
 *   - vídeo por IA: o estilo mestre (a linguagem visual do vídeo), um estilo
 *     de vídeo do catálogo, ou um criado a partir de uma ideia;
 *   - vídeo curto (Shorts, Reels, TikTok): o estilo mestre (a edição do
 *     projeto) ou um estilo de edição do catálogo; o estilo de edição criado
 *     por você é o do vídeo inteiro, no estilo mestre;
 *   - infográfico e capa: não há modelo a escolher, e a linha diz que o dia
 *     sai nas cores e na letra da marca.
 * Quem chama guarda a escolha onde a campanha guarda os dias e só gera com
 * todos os dias escolhidos (`postsSemModelo`).
 *
 * Membro da equipe também escolhe e cria: o modelo vale para o post e não
 * muda o estilo do projeto, que é do dono. O design mestre é preparado aqui,
 * uma vez por mudança do estilo do vídeo, para a pessoa ver como a arte vai
 * sair antes de gerar (e a esteira não pagar por ele no meio da campanha).
 */

const formatosDoBook = (catalogoId: string) => modeloPorId(catalogoId)?.formatos;

/** O tipo do "último usado" de cada formato. */
function tipoDoUltimo(formato: PostVisual["formato"]): "image" | "carousel" | "short" | null {
  if (formato === "image" || formato === "carousel" || formato === "short") return formato;
  return null;
}

/** Como a linha do dia diz a escolha de agora. */
function textoDaEscolha(m: ModeloDoPost | undefined, pede: ReturnType<typeof oQueOPostPede>, mestre: EstadoDoMestre | null | undefined): string {
  const rotulo = OPCOES_DE_ESTILO[0].rotulo;
  if (m?.mestre) return mestre?.nome ? `${rotulo}: ${mestre.nome}` : rotulo;
  const tipo = pede === "edicao" ? "Estilo de edição" : pede === "video-ia" ? "Estilo do vídeo" : "Modelo";
  return `${tipo}: ${m?.nome ?? "escolhido"}`;
}

export function ModelosDosPosts({
  projectId,
  posts,
  valor,
  aoMudar,
  aoCarregar,
  explicacao,
  aoAbrirEstiloDoVideo,
}: {
  projectId: string;
  /** Os posts visuais da campanha (o dia e o formato de cada um). */
  posts: PostVisual[];
  /** As escolhas de agora, pela chave do dia. */
  valor: ModelosDosPosts;
  aoMudar: (novo: ModelosDosPosts) => void;
  /**
   * A leitura do projeto terminou (true) ou falhou (false). Quem chama não
   * tranca a geração quando ela falha: o servidor ainda segura a arte sem
   * modelo, sem gastar, como sempre.
   */
  aoCarregar?: (ok: boolean) => void;
  /** Uma linha sobre por que a lista aparece aqui. */
  explicacao?: string;
  /** Leva ao passo do estilo do vídeo (a jornada do vídeo): a porta de criar, no vídeo curto. */
  aoAbrirEstiloDoVideo?: () => void;
}) {
  const [estado, setEstado] = useState<EstadoDoEstiloDosPosts | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aberto, setAberto] = useState<string | null>(null);
  const [porta, setPorta] = useState<OpcaoDeEstilo>("mestre");
  const [preparandoMestre, setPreparandoMestre] = useState(false);
  // Quem chama recria as funções a cada desenho; a leitura não repete por isso.
  const atual = useRef({ valor, aoMudar, aoCarregar, posts });
  useEffect(() => {
    atual.current = { valor, aoMudar, aoCarregar, posts };
  });

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      const r = await fetch(`/api/projects/${projectId}/estilo-dos-posts`, { cache: "no-store" });
      const d = (await r.json().catch(() => ({}))) as EstadoDoEstiloDosPosts & { error?: string };
      if (!r.ok) throw new Error(d.error || "Não consegui ler os modelos do projeto.");
      setEstado(d);
      atual.current.aoCarregar?.(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui ler os modelos do projeto.");
      atual.current.aoCarregar?.(false);
    }
  }, [projectId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  // O PREENCHIMENTO: com o estado lido, todo dia sem escolha recebe o estilo
  // mestre (ou, com o estilo próprio do projeto, o último modelo daquele tipo).
  // Roda de novo quando um dia novo aparece; dia que já tem escolha não muda.
  const chaveDosPosts = posts.map((p) => `${p.chave}:${p.formato}`).join("|");
  useEffect(() => {
    if (!estado) return;
    const { valor: v, aoMudar: mudar, posts: ps } = atual.current;
    const preenchido = preencherModelos(ps, v, { ultimos: estado.ultimos, padraoDaImagem: padraoDaImagemDoEstado(estado), padraoDaEdicao: estado.edicao, modo: estado.modo });
    if (JSON.stringify(preenchido) !== JSON.stringify(v)) mudar(preenchido);
  }, [estado, chaveDosPosts]);

  // O DESIGN MESTRE, preparado uma vez por mudança do estilo do vídeo, quando
  // alguma foto ou carrossel vai sair nele: a pessoa vê o design antes de
  // gerar, e a esteira acha pronto. Com ele em dia, nada é pedido.
  const algumaArteNoMestre = posts.some((p) => oQueOPostPede(p.formato) === "modelo" && valor[p.chave]?.mestre);
  const pediuOMestre = useRef(false);
  useEffect(() => {
    if (!estado?.mestre || estado.mestre.emDia || !algumaArteNoMestre || pediuOMestre.current) return;
    pediuOMestre.current = true;
    setPreparandoMestre(true);
    fetch(`/api/projects/${projectId}/estilo-dos-posts/mestre`, { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { mestre?: EstadoDoMestre | null } | null) => {
        if (d?.mestre) setEstado((e) => (e ? { ...e, mestre: d.mestre } : e));
      })
      .catch(() => undefined)
      .finally(() => setPreparandoMestre(false));
  }, [estado, algumaArteNoMestre, projectId]);

  const faltam = useMemo(() => postsSemModelo(posts, valor), [posts, valor]);

  function escolher(post: PostVisual, modelo: ModeloDoPost, fechar = true) {
    atual.current.aoMudar({ ...atual.current.valor, [post.chave]: modelo });
    if (fechar) setAberto(null);
    // A próxima escolha deste tipo de post vem com este modelo (não trava nada se falhar).
    const tipo = tipoDoUltimo(post.formato);
    if (tipo) {
      void fetch(`/api/projects/${projectId}/estilo-dos-posts`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, modelo }),
      }).catch(() => undefined);
    }
  }

  if (!posts.length) return null;

  const mestre = estado?.mestre ?? null;

  return (
    <section className="space-y-2 rounded-xl border p-4" style={{ borderColor: faltam.length ? "rgba(234,88,12,0.45)" : "var(--border)", background: "var(--bg-surface)" }} aria-label="O modelo de cada post">
      <div>
        <h3 className="flex flex-wrap items-center gap-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          <Palette className="h-4 w-4 text-orange-500" /> O modelo de cada post
          {faltam.length > 0 ? (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "rgba(249,115,22,0.15)", color: "#ea580c" }}>
              {faltam.length === 1 ? "Falta 1 dia" : `Faltam ${faltam.length} dias`}
            </span>
          ) : (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "rgba(34,197,94,0.15)", color: "#16a34a" }}>
              Todos escolhidos
            </span>
          )}
        </h3>
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          {explicacao ?? "Cada dia com peça visual tem o seu estilo. No quadro, a IA coloca o conteúdo daquele dia dentro dele. Veio no estilo mestre, o do vídeo, para todas as peças saírem com o mesmo design: troque o que quiser."}
        </p>
        {/* O estilo mestre de agora e o design das artes que sai dele. */}
        {mestre && (
          <p className="mt-1 flex items-start gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-500" />
            <span>
              Estilo mestre: <b style={{ color: "var(--text-primary)" }}>{mestre.nome}</b>
              {mestre.referencia ? ` (${mestre.referencia})` : ""}.{" "}
              {preparandoMestre
                ? "Preparando o design das artes a partir do estilo do vídeo (uma vez por mudança do estilo)."
                : mestre.design
                  ? `As artes no mestre saem no design "${mestre.design.nome}"${mestre.design.descricao ? `: ${mestre.design.descricao}` : "."}`
                  : "O design das artes sai do estilo do vídeo na primeira arte, uma vez por mudança do estilo."}
            </span>
          </p>
        )}
      </div>

      {/* X só local (07/10): o erro é desta janela. */}
      {erro && (
        <AvisoDescartavel key={erro} chave={null} className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>{erro} Você ainda pode seguir: o dia sem modelo sai no estilo do projeto ou, sem estilo aprovado, espera a escolha sem gastar crédito de imagem.</span>
            <button type="button" onClick={() => void carregar()} className="inline-flex items-center gap-1 rounded-md border px-2 py-1 font-semibold" style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}>
              <RefreshCw className="h-3.5 w-3.5" /> Tentar de novo
            </button>
          </div>
        </AvisoDescartavel>
      )}

      <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
        {posts.map((post) => {
          const pede = oQueOPostPede(post.formato);
          const escolhido = valor[post.chave];
          const ok = modeloServeAoPost(escolhido, pede);
          const estaAberto = aberto === post.chave;
          return (
            <li key={post.chave} className="py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                    {post.rotulo} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>· {ROTULO_DO_POST[post.formato]}</span>
                  </p>
                  <p className="flex items-center gap-1 text-xs" style={{ color: ok ? "var(--text-muted)" : "#ea580c" }}>
                    {ok ? <Check className="h-3.5 w-3.5 text-green-600" /> : null}
                    {pede === "marca"
                      ? post.formato === "infographic"
                        ? "Desenhado nas cores e na letra da sua marca (não há modelo a escolher)."
                        : "A capa sai no estilo do projeto, nas cores e na letra da sua marca."
                      : ok
                        ? textoDaEscolha(escolhido, pede, mestre)
                        : pede === "edicao"
                          ? "Falta escolher o estilo de edição"
                          : pede === "video-ia"
                            ? "Falta escolher o estilo do vídeo"
                            : "Falta escolher o modelo"}
                  </p>
                </div>
                {pede !== "marca" && (
                  <button
                    type="button"
                    onClick={() => {
                      setAberto(estaAberto ? null : post.chave);
                      setPorta(opcaoDaEscolha(escolhido));
                    }}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold"
                    style={ok ? { borderColor: "var(--border)", color: "var(--text-primary)" } : { borderColor: "#f97316", background: "#f97316", color: "#fff" }}
                    aria-expanded={estaAberto}
                  >
                    {estaAberto ? "Fechar" : ok ? <><Pencil className="h-3.5 w-3.5" /> Trocar</> : "Escolher"}
                  </button>
                )}
              </div>

              {estaAberto && pede !== "marca" && pede !== null && (
                <div className="mt-2 space-y-2 rounded-lg border p-3" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}>
                  <OpcoesDeEstilo
                    rotulo={`O estilo de ${post.rotulo}`}
                    valor={porta}
                    aoMudar={(o) => {
                      setPorta(o);
                      // O estilo mestre não pede mais nada: escolher a porta já escolhe o estilo do post.
                      if (o === "mestre") escolher(post, { ...ESCOLHA_DO_MESTRE }, false);
                    }}
                  />

                  {porta === "mestre" && (
                    <p className="flex items-start gap-1.5 text-xs" style={{ color: "var(--text-primary)" }}>
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                      <span>
                        {pede === "edicao"
                          ? `O corte sai no estilo do vídeo do projeto${mestre?.nome ? ` (${mestre.nome})` : ""}, como o vídeo completo.`
                          : pede === "video-ia"
                            ? `O vídeo por IA sai na mesma linguagem visual do estilo do vídeo${mestre?.nome ? ` (${mestre.nome})` : ""}, nas cores da sua marca.`
                            : `A arte sai no design que vem do estilo do vídeo${mestre?.nome ? ` (${mestre.nome})` : ""}, com a sua letra e as suas cores.`}
                      </span>
                    </p>
                  )}

                  {porta === "biblioteca" && pede === "modelo" && (
                    <GaleriaDaBiblioteca
                      projectId={projectId}
                      tipoFixo="imagem"
                      semEscrever
                      titulo={`Modelos para ${ROTULO_DO_POST[post.formato].toLowerCase()}`}
                      descricao="Do mais usado ao menos: os modelos do nosso book e os que outros clientes criaram. A IA coloca o conteúdo do dia dentro do modelo."
                      filtrar={(d: DesignDaGaleria) => designServeAoPost(d, post.formato, formatosDoBook)}
                      rotuloDoUsar="Usar neste post"
                      aoEscolher={async (d) => escolher(post, escolhaDoDesign(d))}
                    />
                  )}

                  {porta === "biblioteca" && (pede === "edicao" || pede === "video-ia") && (
                    <>
                      <p className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                        <Clapperboard className="h-3.5 w-3.5" />
                        {pede === "edicao"
                          ? "O estilo de edição do corte que sai neste dia. O vídeo completo segue o estilo do projeto."
                          : "A linguagem visual das cenas do vídeo por IA deste dia, nas cores da sua marca."}
                      </p>
                      <div className="grid max-h-72 grid-cols-1 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
                        {[...CATALOGO_DE_ESTILOS]
                          .sort((a, b) => Number(estiloEmDestaque(b.id)) - Number(estiloEmDestaque(a.id)))
                          .map((e) => {
                            const ativo = !escolhido?.mestre && escolhido?.estiloId === e.id;
                            return (
                              <button
                                key={e.id}
                                type="button"
                                onClick={() => escolher(post, { estiloId: e.id, nome: e.nome })}
                                className="rounded-lg border p-2 text-left"
                                style={ativo ? { borderColor: "#f97316", background: "rgba(249,115,22,0.10)" } : { borderColor: "var(--border)" }}
                                aria-pressed={ativo}
                              >
                                <span className="block text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                                  {e.nome}
                                  {e.referencia ? <span style={{ color: "var(--text-muted)", fontWeight: 400 }}> ({e.referencia})</span> : null}
                                </span>
                                <span className="mt-0.5 block text-[11px] leading-snug" style={{ color: "var(--text-muted)" }}>
                                  {e.resumo}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    </>
                  )}

                  {porta === "criar" && pede === "modelo" && (
                    <CriarEstilo
                      projectId={projectId}
                      paraOPost
                      aoCriar={(r) => {
                        // O modelo criado já vale para este post; a conversa fica aberta para ajustar.
                        escolher(post, escolhaDoDesign(r.design), false);
                        toast.success(`"${r.design.nome}" é o modelo de ${post.rotulo}.`, { id: `modelo-${post.chave}` });
                      }}
                    />
                  )}

                  {porta === "criar" && pede === "video-ia" && (
                    <CriarEstilo
                      projectId={projectId}
                      paraOPost
                      tipo="video"
                      aoCriar={(r) => {
                        // O estilo criado vale para o vídeo por IA deste dia; a conversa fica aberta para ajustar.
                        escolher(post, { designId: r.design.id, nome: r.design.nome }, false);
                        toast.success(`"${r.design.nome}" é o estilo do vídeo de ${post.rotulo}.`, { id: `modelo-${post.chave}` });
                      }}
                    />
                  )}

                  {porta === "criar" && pede === "edicao" && (
                    // O vídeo curto é um corte do vídeo da pessoa: o estilo de edição criado por ela é o do vídeo inteiro.
                    <div className="space-y-2 text-xs" style={{ color: "var(--text-primary)" }}>
                      <p>
                        O vídeo curto é um corte do seu vídeo. O estilo de edição que você cria, falando ou escrevendo, é o estilo do vídeo: vale para o vídeo inteiro e para os cortes, e passa a ser o estilo mestre.
                      </p>
                      {aoAbrirEstiloDoVideo ? (
                        <button type="button" onClick={aoAbrirEstiloDoVideo} className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 font-semibold text-white">
                          <Sparkles className="h-3.5 w-3.5" /> Criar o estilo do vídeo
                        </button>
                      ) : (
                        <p style={{ color: "var(--text-muted)" }}>Crie o seu no estilo do vídeo do projeto (o estilo mestre), onde você escolhe como o vídeo é editado.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {!estado && !erro && (
        <p className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Lendo os modelos que você já usou
        </p>
      )}
    </section>
  );
}
