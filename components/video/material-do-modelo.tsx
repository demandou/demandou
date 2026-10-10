"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, ImagePlus, Images, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BotaoDescartar } from "@/components/ui/descartar";
import { subirMaterial } from "@/lib/materiais/subir-no-navegador";
import { LIMITES_DO_MATERIAL, type MaterialNaTela } from "@/lib/materiais/tipos";
import { ROTULO_DO_PAPEL, type PapelDoMaterial, type PedidoDeMaterialNaTela, type SituacaoDoMaterial } from "@/lib/media/editor-do-curso/material-do-modelo";

/**
 * O MATERIAL QUE O MODELO PEDE (10/10/2026). Seis modelos do curso usam
 * material do cliente (capturas de tela, prints, as fotos de antes e depois).
 * Escolhido o modelo, esta caixa diz o que ele usa e quantos ("Este modelo usa
 * capturas de tela do seu produto: envie de 3 a 8"), com envio direto e a
 * escolha na Biblioteca de materiais do projeto. Cada arquivo leva um nome e
 * uma descrição do cliente, que o editor lê para pôr cada tela no lugar certo.
 *
 * Sem o mínimo, o modelo fica escolhido, a edição dos cortes não começa e a
 * caixa diz o que falta. Nunca geramos tela de produto com IA: seria inventar
 * o produto do cliente.
 */

type ItemNaTela = { materialId: string; nome: string; descricao: string; papel?: PapelDoMaterial | null; miniatura: string };

const urlDaMiniatura = (projectId: string, id: string) => `/api/projects/${projectId}/materiais/${id}/arquivo?v=mini`;
const corpoDe = (modelo: string, itens: ItemNaTela[]) =>
  JSON.stringify({ modelo, itens: itens.map(({ materialId, nome, descricao, papel }) => ({ materialId, nome, descricao, papel: papel ?? null })) });
const semExtensao = (n: string | null | undefined) => (n ?? "").replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[-_]+/g, " ").trim().slice(0, 60);

export function MaterialDoModelo({
  projectId,
  modelo,
  pedido,
  aoMudar,
}: {
  projectId: string;
  modelo: { id: string; nome: string };
  pedido: PedidoDeMaterialNaTela;
  /** A situação depois de cada gravação (basta ou o que falta), para quem chama. */
  aoMudar?: (s: SituacaoDoMaterial) => void;
}) {
  const [itens, setItens] = useState<ItemNaTela[] | null>(null);
  const [situacao, setSituacao] = useState<SituacaoDoMaterial | null>(null);
  const [biblioteca, setBiblioteca] = useState<MaterialNaTela[] | null>(null);
  const [abrirBiblioteca, setAbrirBiblioteca] = useState(false);
  const [envio, setEnvio] = useState<{ feitos: number; total: number } | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const arquivo = useRef<HTMLInputElement>(null);
  // O último corpo guardado: sair de um campo sem mudar nada não grava de novo.
  const ultimoGuardado = useRef<string>("");
  const aoMudarRef = useRef(aoMudar);
  useEffect(() => {
    aoMudarRef.current = aoMudar;
  }, [aoMudar]);

  useEffect(() => {
    let vivo = true;
    setItens(null);
    fetch(`/api/projects/${projectId}/modelo-do-curso/material?modelo=${encodeURIComponent(modelo.id)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { itens?: ItemNaTela[]; situacao?: SituacaoDoMaterial } | null) => {
        if (!vivo) return;
        setItens(d?.itens ?? []);
        setSituacao(d?.situacao ?? null);
        ultimoGuardado.current = corpoDe(modelo.id, d?.itens ?? []);
      })
      .catch(() => vivo && setItens([]));
    return () => {
      vivo = false;
    };
  }, [projectId, modelo.id]);

  const salvar = useCallback(
    async (novos: ItemNaTela[]) => {
      setItens(novos);
      const corpo = corpoDe(modelo.id, novos);
      if (corpo === ultimoGuardado.current) return;
      setSalvando(true);
      try {
        const r = await fetch(`/api/projects/${projectId}/modelo-do-curso/material`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: corpo });
        const d = (await r.json().catch(() => ({}))) as { situacao?: SituacaoDoMaterial; error?: string };
        if (!r.ok || !d.situacao) throw new Error(d.error);
        ultimoGuardado.current = corpo;
        setSituacao(d.situacao);
        setErro(null);
        aoMudarRef.current?.(d.situacao);
      } catch (e) {
        setErro(e instanceof Error && e.message ? e.message : "Não consegui guardar o material. Tente de novo.");
      } finally {
        setSalvando(false);
      }
    },
    [projectId, modelo.id]
  );

  const papelLivre = (lista: ItemNaTela[]): PapelDoMaterial | null => pedido.papeis?.find((p) => !lista.some((i) => i.papel === p)) ?? null;

  function acrescentar(lista: ItemNaTela[], m: MaterialNaTela): ItemNaTela[] {
    if (lista.some((i) => i.materialId === m.id)) return lista;
    const item: ItemNaTela = { materialId: m.id, nome: semExtensao(m.nome) || `${pedido.unidade.um} ${lista.length + 1}`, descricao: m.descricao ?? "", miniatura: urlDaMiniatura(projectId, m.id) };
    if (pedido.papeis?.length) item.papel = papelLivre(lista);
    return [...lista, item];
  }

  async function enviar(arquivos: FileList | null) {
    if (!arquivos?.length || !itens) return;
    const lista = Array.from(arquivos).slice(0, Math.max(1, Math.min(LIMITES_DO_MATERIAL.porEnvio, pedido.maximo - itens.length)));
    let novos = itens;
    const falhas: string[] = [];
    setEnvio({ feitos: 0, total: lista.length });
    for (const [k, f] of lista.entries()) {
      setEnvio({ feitos: k, total: lista.length });
      try {
        // O mesmo envio da Biblioteca de materiais (o arquivo fica nela também, para usar de novo).
        const m = await subirMaterial(projectId, f, { soFoto: true });
        novos = acrescentar(novos, m);
        setBiblioteca((b) => (b ? [m, ...b] : b));
      } catch (e) {
        falhas.push(`${f.name}: ${e instanceof Error ? e.message : "falhou"}`);
      }
    }
    setEnvio(null);
    if (arquivo.current) arquivo.current.value = "";
    if (falhas.length) setErro(falhas.slice(0, 3).join(" "));
    if (novos !== itens) await salvar(novos);
  }

  async function verBiblioteca() {
    setAbrirBiblioteca((v) => !v);
    if (biblioteca) return;
    const r = await fetch(`/api/projects/${projectId}/materiais`, { cache: "no-store" }).catch(() => null);
    const d = r?.ok ? ((await r.json()) as { materiais?: MaterialNaTela[] }) : null;
    setBiblioteca((d?.materiais ?? []).filter((m) => m.tipo === "foto"));
  }

  const trocar = (id: string, campo: Partial<ItemNaTela>) => setItens((l) => l?.map((i) => (i.materialId === id ? { ...i, ...campo } : i)) ?? l);

  const quantos = itens?.length ?? 0;
  const cheio = quantos >= pedido.maximo;
  const basta = Boolean(situacao?.basta);

  return (
    <section aria-label={`Material do modelo ${modelo.nome}`} className="mb-3 rounded-lg border p-3" style={{ borderColor: basta ? "var(--border)" : "rgb(249 115 22 / 0.6)", background: "var(--bg-surface)" }}>
      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        {pedido.frase}
      </p>
      {pedido.dica && (
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          {pedido.dica} Nada disso é criado por IA: o seu produto aparece como ele é.
        </p>
      )}
      {pedido.aviso && (
        <p className="mt-2 flex items-start gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-400" aria-hidden="true" />
          <span>{pedido.aviso}</span>
        </p>
      )}

      <div role="status" className={cn("mt-2 rounded-md px-2.5 py-2 text-xs", basta ? "bg-emerald-500/10" : "bg-orange-500/10")} style={{ color: "var(--text-primary)" }}>
        {itens === null ? (
          <span className="flex items-center gap-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Lendo o material deste modelo
          </span>
        ) : basta ? (
          <span className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
            Pronto: os seus cortes saem no {modelo.nome} com {quantos === 1 ? `esta ${pedido.unidade.um}` : `estas ${quantos} ${pedido.unidade.varios}`}.
          </span>
        ) : (
          <span>
            <b>A edição dos cortes no {modelo.nome} ainda não começou.</b> {situacao?.falta ?? `Envie ${pedido.oQue}.`} Enquanto isso, os cortes esperam; se preferir não esperar, volte ao editor de antes.
          </span>
        )}
      </div>

      {itens && itens.length > 0 && (
        <ul className="mt-3 space-y-2">
          {itens.map((i) => (
            <li key={i.materialId} className="flex gap-2.5 rounded-md border p-2" style={{ borderColor: "var(--border)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={i.miniatura} alt={i.nome || "Material"} loading="lazy" className="h-20 w-16 shrink-0 rounded object-cover" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <input
                    value={i.nome}
                    onChange={(e) => trocar(i.materialId, { nome: e.target.value.slice(0, 60) })}
                    onBlur={() => itens && void salvar(itens)}
                    placeholder="Nome (ex.: tela de cadastro)"
                    aria-label="Nome do arquivo"
                    className="min-h-9 min-w-0 flex-1 rounded-md border bg-transparent px-2 text-xs"
                    style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                  />
                  {pedido.papeis && (
                    <select
                      value={i.papel ?? ""}
                      onChange={(e) => void salvar(itens.map((x) => (x.materialId === i.materialId ? { ...x, papel: (e.target.value || null) as PapelDoMaterial | null } : x)))}
                      aria-label="Antes ou depois"
                      className="min-h-9 rounded-md border bg-transparent px-2 text-xs"
                      style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                    >
                      <option value="">Antes ou depois?</option>
                      {pedido.papeis.map((p) => (
                        <option key={p} value={p}>
                          {ROTULO_DO_PAPEL[p]}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={() => void salvar(itens.filter((x) => x.materialId !== i.materialId))}
                    disabled={salvando}
                    aria-label="Tirar deste modelo (continua na Biblioteca)"
                    className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-md border disabled:opacity-50"
                    style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <textarea
                  value={i.descricao}
                  onChange={(e) => trocar(i.materialId, { descricao: e.target.value.slice(0, 300) })}
                  onBlur={() => itens && void salvar(itens)}
                  rows={2}
                  placeholder="O que aparece aqui, e quando você fala disso no vídeo"
                  aria-label="Descrição do arquivo"
                  className="w-full resize-none rounded-md border bg-transparent px-2 py-1.5 text-xs"
                  style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => arquivo.current?.click()}
          disabled={Boolean(envio) || cheio || itens === null}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-orange-500 px-3 text-xs font-semibold text-white disabled:opacity-50"
        >
          {envio ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />}
          {envio ? `Enviando ${envio.feitos + 1} de ${envio.total}` : `Enviar ${pedido.unidade.varios}`}
        </button>
        <button
          type="button"
          onClick={() => void verBiblioteca()}
          disabled={itens === null}
          aria-expanded={abrirBiblioteca}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold disabled:opacity-50"
          style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
        >
          <Images className="h-3.5 w-3.5" aria-hidden="true" /> Escolher da Biblioteca
        </button>
        {salvando && (
          <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
            <Loader2 className="h-3 w-3 animate-spin" /> guardando
          </span>
        )}
        <input ref={arquivo} type="file" accept="image/*" multiple className="hidden" onChange={(e) => void enviar(e.target.files)} />
      </div>

      {abrirBiblioteca && (
        <div className="mt-3">
          {biblioteca === null ? (
            <p className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Abrindo a Biblioteca
            </p>
          ) : biblioteca.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              A Biblioteca deste projeto ainda não tem fotos. Envie as {pedido.unidade.varios} pelo botão acima: elas ficam guardadas lá também.
            </p>
          ) : (
            <>
              <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>
                Toque para marcar para este modelo ({quantos} de até {pedido.maximo}).
              </p>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {biblioteca.map((m) => {
                  const marcado = Boolean(itens?.some((i) => i.materialId === m.id));
                  return (
                    <button
                      key={m.id}
                      type="button"
                      aria-pressed={marcado}
                      disabled={salvando || (!marcado && cheio)}
                      onClick={() => itens && void salvar(marcado ? itens.filter((i) => i.materialId !== m.id) : acrescentar(itens, m))}
                      className={cn("relative aspect-square overflow-hidden rounded-md border disabled:opacity-40", marcado && "ring-2 ring-orange-500")}
                      style={{ borderColor: "var(--border)" }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={urlDaMiniatura(projectId, m.id)} alt={m.descricao ?? m.nome ?? "Foto"} loading="lazy" className="h-full w-full object-cover" />
                      {marcado && (
                        <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white">
                          <Check className="h-3 w-3" aria-hidden="true" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {erro && (
        <p role="alert" className="mt-2 flex items-start gap-1 text-xs text-orange-400">
          <span className="min-w-0 flex-1">{erro}</span>
          <BotaoDescartar compacto aoDescartar={() => setErro(null)} />
        </p>
      )}
    </section>
  );
}
