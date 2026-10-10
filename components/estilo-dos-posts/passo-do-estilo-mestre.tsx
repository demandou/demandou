"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, Sparkles } from "lucide-react";
import { EstiloDoProjeto } from "@/components/video/estilo-do-projeto";
import { CaixaDoMeuEstilo } from "@/components/estilo-proprio/caixa-do-meu-estilo";
import { ModelosDoCurso } from "@/components/video/modelos-do-curso";
import { SeloBeta } from "@/components/video/catalogo-de-estilos";
import { ESCOLHAS_DOS_POSTS, type ModoDosPosts } from "@/lib/estilo-dos-posts/estilo-mestre";

/**
 * O ESTILO VEM PRIMEIRO EM TODA JORNADA (08/10/2026). Pedido do Bruno: em toda
 * porta de entrada da campanha ("Editar o meu vídeo", "O meu gêmeo digital",
 * "Gerar tudo com IA"), o primeiro passo depois de escolher a porta é escolher
 * o ESTILO MESTRE (a linguagem do vídeo, como Autoridade high ticket ou Vox,
 * ou um estilo criado a partir de uma ideia), e logo depois a escolha: "todas
 * as peças seguem o estilo mestre" (o padrão) ou "quero mudar os posts". Vale
 * para tudo que a IA gera: a edição do vídeo, as artes, os carrosséis, o
 * vídeo por IA e o gêmeo. A única porta sem este passo é "Conteúdo pronto
 * seu": ali nada é gerado.
 *
 * Nada aqui é estilo novo: o estilo mestre é o mesmo do vídeo
 * (components/video/estilo-do-projeto.tsx, o comando ou o catálogo, com o
 * cenário), e "quero mudar os posts" leva à escolha post a post de sempre
 * (components/estilo-dos-posts/modelos-dos-posts.tsx), que quem chama mostra
 * onde os posts da campanha já existem.
 */

/**
 * O padrão dos posts do projeto (o estilo mestre, a não ser que o dono tenha
 * escolhido um estilo próprio em Configurações), para a escolha vir marcada.
 * Null enquanto lê; falhou a leitura, o padrão de todos: o estilo mestre.
 */
export function useModoPadraoDosPosts(projectId: string | null | undefined): ModoDosPosts | null {
  const [modo, setModo] = useState<ModoDosPosts | null>(null);
  useEffect(() => {
    if (!projectId) return;
    let vivo = true;
    fetch(`/api/projects/${projectId}/estilo-dos-posts`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { modo?: string } | null) => {
        if (vivo) setModo(d?.modo === "por-post" ? "por-post" : "mestre");
      })
      .catch(() => vivo && setModo("mestre"));
    return () => {
      vivo = false;
    };
  }, [projectId]);
  return modo;
}

/** A escolha logo depois do estilo: todas as peças no estilo mestre, ou mudar os posts. */
export function EscolhaDosPosts({ valor, aoMudar }: { valor: ModoDosPosts; aoMudar: (m: ModoDosPosts) => void }) {
  return (
    <section className="space-y-2" aria-label="As peças da campanha">
      <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
        E as peças da campanha?
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-label="As peças da campanha">
        {ESCOLHAS_DOS_POSTS.map((o) => {
          const ativo = valor === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={ativo}
              onClick={() => aoMudar(o.id)}
              className="rounded-lg border p-3 text-left transition-colors"
              style={ativo ? { borderColor: "#f97316", background: "rgba(249,115,22,0.10)" } : { borderColor: "var(--border)" }}
            >
              <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {ativo ? <Check className="h-3.5 w-3.5 text-orange-500" /> : null}
                {o.rotulo}
              </span>
              <span className="mt-0.5 block text-xs leading-snug" style={{ color: "var(--text-muted)" }}>
                {o.explicacao}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function PassoDoEstiloMestre({
  projectId,
  estilo,
  musica,
  termos,
  comCenario,
  modo,
  aoMudarModo,
  material,
  depoisDaEscolha,
}: {
  projectId: string;
  /** Project.videoStyle (o que o passo do estilo recebe). */
  estilo: string | null;
  musica: string | null;
  termos: string | null;
  /** Com gravação (o vídeo, o gêmeo): a escolha do cenário aparece junto do estilo. */
  comCenario: boolean;
  modo: ModoDosPosts;
  aoMudarModo: (m: ModoDosPosts) => void;
  /**
   * O LUGAR DO MATERIAL PRÓPRIO DA CAMPANHA (08/10): a escolha das fotos
   * (usar as que existem ou subir novas, e o estilo de cada foto) entra aqui,
   * logo depois do estilo, pelo ramo material-proprio-0810. Sem nada, não
   * aparece nada.
   */
  material?: ReactNode;
  /** O que vem logo depois da escolha (a lista post a post, onde quem chama já a tem). */
  depoisDaEscolha?: ReactNode;
}) {
  // UMA TELA SÓ DE ESTILO (10/10, "as telas e as jornadas têm muita coisa, está confuso"): o modelo
  // do vídeo em cima (com as peças no mesmo estilo e a prévia), "não gostei" abre a caixa do meu
  // estilo, e o editor de antes (catálogo, comando, câmera, legenda, cenário) fica recolhido.
  const [modeloDoCurso, setModeloDoCurso] = useState<{ id: string; nome: string } | null>(null);
  const [criarOMeu, setCriarOMeu] = useState(false);
  const [avancado, setAvancado] = useState<boolean | null>(null);
  const caixa = useRef<HTMLDivElement | null>(null);
  const abertoAvancado = avancado ?? !modeloDoCurso;
  return (
    <div className="space-y-4">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          <Sparkles className="h-4 w-4 text-orange-500" /> O estilo da sua campanha
        </h3>
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          Escolha o modelo do vídeo: as artes, os carrosséis, os infográficos e os vídeos curtos saem no mesmo estilo, com a cor da sua marca nos destaques. Não gostou? Crie o seu, falando ou escrevendo.
        </p>
      </div>
      <ModelosDoCurso
        projectId={projectId}
        aoMudar={setModeloDoCurso}
        reserva="o editor de antes (mais abaixo)"
        aoNaoGostar={() => {
          setCriarOMeu(true);
          setTimeout(() => caixa.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
        }}
      />
      {/* A CAIXA "CRIE O SEU ESTILO" (08/10): sem modelo do curso, é o caminho de criar; com ele, abre no "não gostei". */}
      {(!modeloDoCurso || criarOMeu) && (
        <div ref={caixa} className="scroll-mt-4">
          <CaixaDoMeuEstilo projectId={projectId} />
        </div>
      )}
      <section className="rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
        <button
          type="button"
          onClick={() => setAvancado(!abertoAvancado)}
          aria-expanded={abertoAvancado}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          <span>
            <span className="flex flex-wrap items-center gap-2">
              {modeloDoCurso ? "Ajustes finos e o editor de antes (reserva)" : "Os estilos do editor de antes"}
              <SeloBeta />
            </span>
            <span className="block text-xs font-normal" style={{ color: "var(--text-muted)" }}>
              {modeloDoCurso ? "Câmera, legenda, cenário e o estilo que entra se o modelo não conseguir montar um corte." : "O catálogo de estilos, a câmera, a legenda e o cenário."}
            </span>
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${abertoAvancado ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
        {abertoAvancado && (
          <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: "var(--border)" }}>
            <EstiloDoProjeto projectId={projectId} inicial={estilo} musicaInicial={musica} termosIniciais={termos} mostrar="estilo" semCenario={!comCenario} semModelosDoCurso />
          </div>
        )}
      </section>
      <EscolhaDosPosts valor={modo} aoMudar={aoMudarModo} />
      {depoisDaEscolha}
      {material ? <div data-lugar="material-da-campanha">{material}</div> : null}
    </div>
  );
}
