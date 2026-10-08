"use client";

import { ArrowDown, ArrowUp, Check, Film, ListOrdered, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_PARTES, type CriterioDaOrdem } from "@/lib/media/partes-da-gravacao";

/**
 * AS PARTES DA GRAVAÇÃO (08/10/2026): a lista que aparece quando a pessoa
 * escolhe mais de um arquivo para o mesmo vídeo.
 *
 * O pedido do Bruno: a própria plataforma pede a ordem, 1, 2, 3. Por isso a
 * lista nasce numerada na ordem SUGERIDA (pela data de gravação de cada
 * arquivo quando o navegador dá uma que informe, senão pelo nome), faz a
 * pergunta com todas as letras e só libera o envio depois do "Confirmar esta
 * ordem". Mexer em qualquer coisa (subir, descer, tirar, acrescentar) pede a
 * confirmação de novo: a ordem que vai para a edição é a que a pessoa viu.
 *
 * Reordenar é pelas setas, e não por arrastar: arrastar no celular com o dedo
 * disputa com a rolagem da página e não tem jeito simples de ser acessível; a
 * seta funciona com toque, mouse, teclado e leitor de tela.
 *
 * Só desenha: quem guarda o estado e envia é `VideoUpload`
 * (components/video/video-upload.tsx).
 */

export type ParteNaTela = {
  id: string;
  nome: string;
  bytes: number;
  duracao: number;
  largura: number | null;
  altura: number | null;
  /** Um quadro do começo, em data URL. Null quando o navegador não deu. */
  miniatura: string | null;
  /** 0 a 100 enquanto sobe; null antes de começar. */
  progresso: number | null;
  /** Já está no storage (sobrou de um envio interrompido, ou acabou de subir). */
  enviada: boolean;
};

/** "4:05" ou "1:02:30". */
export function duracaoCurta(segundos: number): string {
  const s = Math.max(0, Math.round(segundos));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${r}` : `${m}:${r}`;
}

function tamanho(bytes: number): string {
  const mb = bytes / 1048576;
  return mb >= 1024 ? `${(mb / 1024).toFixed(1).replace(".", ",")} GB` : `${mb.toFixed(0)} MB`;
}

function formato(p: ParteNaTela): string | null {
  if (!p.largura || !p.altura) return null;
  return p.altura > p.largura ? "em pé" : p.altura === p.largura ? "quadrado" : "deitado";
}

export function PartesDaGravacao({
  partes,
  criterio,
  confirmada,
  bloqueada,
  onMover,
  onRemover,
  onAcrescentar,
  onConfirmar,
}: {
  partes: ParteNaTela[];
  criterio: CriterioDaOrdem | "manual";
  confirmada: boolean;
  /** Enviando ou lendo: nada se mexe. */
  bloqueada: boolean;
  onMover: (de: number, para: number) => void;
  onRemover: (indice: number) => void;
  onAcrescentar: () => void;
  onConfirmar: () => void;
}) {
  const totalSeg = partes.reduce((t, p) => t + (p.duracao || 0), 0);
  const totalBytes = partes.reduce((t, p) => t + p.bytes, 0);
  const formatos = new Set(partes.map(formato).filter(Boolean));

  return (
    <section
      className="rounded-xl border p-4 mb-4 space-y-3"
      style={{ background: "var(--bg-primary)", borderColor: "var(--border)" }}
      aria-labelledby="ordem-das-partes"
      data-partes-da-gravacao
    >
      <div className="flex items-start gap-2">
        <ListOrdered className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
        <div>
          <h3 id="ordem-das-partes" className="font-semibold text-[var(--text-primary)]">
            Em que ordem estes trechos entram no vídeo?
          </h3>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {criterio === "data"
              ? "Sugerimos pela hora em que cada arquivo foi gravado."
              : criterio === "nome"
                ? "Sugerimos pelo nome dos arquivos."
                : "Esta é a ordem que você montou."}{" "}
            O número 1 abre o vídeo. Confira e use as setas se precisar mudar.
          </p>
        </div>
      </div>

      <ol className="space-y-2" aria-label="Partes da gravação, na ordem do vídeo">
        {partes.map((p, i) => {
          const f = formato(p);
          return (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-lg border p-2"
              style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
              data-parte={i + 1}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div
                className="h-12 w-16 shrink-0 overflow-hidden rounded-md flex items-center justify-center"
                style={{ background: "var(--bg-primary)" }}
              >
                {p.miniatura ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.miniatura} alt="" className="h-full w-full object-contain" />
                ) : (
                  <Film className="h-5 w-5 text-[var(--text-muted)]" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                  <span className="sr-only">Parte {i + 1}: </span>
                  {p.nome}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {p.duracao > 0 ? duracaoCurta(p.duracao) : "duração não lida"}, {tamanho(p.bytes)}
                  {f ? `, ${f}` : ""}
                  {p.enviada ? ", já enviada" : ""}
                </p>
                {p.progresso !== null && !p.enviada && (
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full" style={{ background: "var(--bg-primary)" }}>
                    <div className="h-full bg-orange-500 transition-all" style={{ width: `${p.progresso}%` }} />
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  disabled={bloqueada || i === 0}
                  onClick={() => onMover(i, i - 1)}
                  aria-label={`Subir a parte ${i + 1} (${p.nome})`}
                  title="Subir"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  disabled={bloqueada || i === partes.length - 1}
                  onClick={() => onMover(i, i + 1)}
                  aria-label={`Descer a parte ${i + 1} (${p.nome})`}
                  title="Descer"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  disabled={bloqueada}
                  onClick={() => onRemover(i)}
                  aria-label={`Tirar a parte ${i + 1} (${p.nome})`}
                  title="Tirar da lista"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="text-sm text-[var(--text-muted)]">
        {partes.length} partes, {duracaoCurta(totalSeg)} no total, {tamanho(totalBytes)}. Viram um vídeo só, nesta ordem, antes da
        edição.
        {formatos.size > 1 ? " As partes em outro formato entram inteiras, com faixa nas laterais, sem esticar a imagem." : ""}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {partes.length < MAX_PARTES && (
          <Button type="button" variant="outline" size="sm" onClick={onAcrescentar} disabled={bloqueada}>
            <Plus className="h-4 w-4" />
            Acrescentar outra parte
          </Button>
        )}
        {confirmada ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-400" role="status">
            <Check className="h-4 w-4" />
            Ordem confirmada: {partes.map((_, i) => i + 1).join(", ")}
          </span>
        ) : (
          <Button type="button" size="sm" onClick={onConfirmar} disabled={bloqueada}>
            <Check className="h-4 w-4" />
            Confirmar esta ordem
          </Button>
        )}
      </div>
    </section>
  );
}
