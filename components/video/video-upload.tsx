"use client";

import { useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Video, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  MB_POR_MINUTO_RECOMENDADO,
  LIMITES_SEM_PLANO,
  TIPOS_ACEITOS,
  duracaoPorExtenso,
  validarVideo,
  creditosEmDuasPartes,
  creditosNaTela,
  CREDITOS_POR_GB_EXTRA,
  CORTES_SUGERIDOS,
  MAX_CORTES_APROVADOS,
  type LimitesDoEnvio,
  type Veredito,
} from "@/lib/media/limits";
import { CREDITOS_POR_GERACAO_HIGGSFIELD } from "@/lib/credits/higgsfield-tabela";
import { FaixaDeCota, PedidoDeUpgrade, type Estouro } from "@/components/planos/pedido-de-upgrade";
import { AvisoDeWifi, MedidorDeEnvio } from "@/components/video/medidor-de-envio";
import { BotaoDescartar } from "@/components/ui/descartar";
import { ARQUIVO_GRANDE_BYTES, emDadosMoveis } from "@/lib/media/velocidade-do-envio";
import { PartesDaGravacao } from "@/components/video/partes-da-gravacao";
import { MAX_PARTES, moverParte, sugerirOrdem, type CriterioDaOrdem } from "@/lib/media/partes-da-gravacao";

/**
 * Envio do vídeo semanal.
 *
 * A validação acontece no navegador, antes de subir um byte, porque é o único
 * lugar onde a duração e o tamanho já são conhecidos e ainda dá tempo de
 * recusar. Deixar a pessoa esperar 45 minutos de upload para descobrir que o
 * arquivo não serve seria a pior experiência possível, e é exatamente o que
 * aconteceria com a taxa de gravação padrão do OBS.
 *
 * O arquivo não passa pela nossa função: o navegador envia direto para o
 * storage. Função serverless tem limite de corpo na casa das dezenas de
 * megabytes, e um vídeo de 20 minutos passa de 1 GB.
 */

/**
 * Um arquivo escolhido. Desde 08/10 a gravação pode vir em PARTES (vários
 * arquivos, na ordem que a pessoa confirma): `url` guarda a parte que já
 * subiu, para um envio interrompido continuar de onde parou, e a miniatura só
 * é lida quando há mais de uma parte (o arquivo único segue como antes).
 */
type Arquivo = {
  id: string;
  file: File;
  duracao: number;
  veredito: Veredito;
  largura: number | null;
  altura: number | null;
  /** undefined: ainda não tentou; null: o navegador não deu. */
  miniatura?: string | null;
  url: string | null;
  progresso: number | null;
};

async function lerVideo(file: File): Promise<{ duracao: number; largura: number | null; altura: number | null }> {
  return new Promise((resolve) => {
    const el = document.createElement("video");
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      URL.revokeObjectURL(el.src);
      resolve({ duracao: el.duration, largura: el.videoWidth || null, altura: el.videoHeight || null });
    };
    el.onerror = () => {
      URL.revokeObjectURL(el.src);
      resolve({ duracao: 0, largura: null, altura: null });
    };
    el.src = URL.createObjectURL(file);
  });
}

/** Um quadro do começo da parte, pequeno, para a lista das partes. Null se o navegador não der. */
async function lerMiniatura(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const el = document.createElement("video");
    const url = URL.createObjectURL(file);
    let feito = false;
    const fim = (m: string | null) => {
      if (feito) return;
      feito = true;
      clearTimeout(prazo);
      URL.revokeObjectURL(url);
      resolve(m);
    };
    // Celular que não decodifica sem toque nunca chega ao `seeked`: fica o ícone.
    const prazo = setTimeout(() => fim(null), 4000);
    el.preload = "auto";
    el.muted = true;
    el.playsInline = true;
    el.onloadedmetadata = () => {
      const d = Number.isFinite(el.duration) ? el.duration : 0;
      el.currentTime = Math.min(1, d / 2);
    };
    el.onseeked = () => {
      try {
        const largura = 160;
        const altura = el.videoWidth && el.videoHeight ? Math.round((largura * el.videoHeight) / el.videoWidth) : 90;
        const c = document.createElement("canvas");
        c.width = largura;
        c.height = altura;
        c.getContext("2d")?.drawImage(el, 0, 0, largura, altura);
        fim(c.toDataURL("image/jpeg", 0.7));
      } catch {
        fim(null);
      }
    };
    el.onerror = () => fim(null);
    el.src = url;
  });
}

function novoId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

/** O que cada parte manda ao servidor, na ordem da lista. */
function partesParaEnviar(lista: Arquivo[]) {
  return lista.map((a) => ({ url: a.url, nome: a.file.name, bytes: a.file.size, duracaoSeg: a.duracao > 0 && Number.isFinite(a.duracao) ? a.duracao : null }));
}

export function VideoUpload({
  projectId,
  onEnviado,
}: {
  projectId: string;
  onEnviado?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Um arquivo (o caso de sempre) ou as PARTES da gravação, na ordem do vídeo (08/10).
  const [arquivos, setArquivos] = useState<Arquivo[]>([]);
  const arquivo = arquivos[0] ?? null;
  const emPartes = arquivos.length > 1;
  // Como a ordem foi sugerida, e se a pessoa já confirmou a que está na tela.
  const [criterio, setCriterio] = useState<CriterioDaOrdem | "manual">("nome");
  const [confirmada, setConfirmada] = useState(false);
  // O próximo arquivo escolhido ACRESCENTA uma parte (e não troca a lista).
  const acrescentar = useRef(false);
  const miniaturasPedidas = useRef(new Set<string>());
  const [lendo, setLendo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  // Os bytes que já saíram, para o medidor de velocidade (item 14, 29/09).
  const [enviados, setEnviados] = useState(0);
  // Dados móveis, quando o navegador sabe dizer (só Chrome e derivados).
  const [movel, setMovel] = useState<boolean | null>(null);
  useEffect(() => setMovel(emDadosMoveis()), []);

  // Fechar a aba no meio do envio perde o arquivo: o navegador pergunta antes.
  useEffect(() => {
    if (!enviando) return;
    const segurar = (ev: BeforeUnloadEvent) => {
      ev.preventDefault();
      ev.returnValue = "";
    };
    window.addEventListener("beforeunload", segurar);
    return () => window.removeEventListener("beforeunload", segurar);
  }, [enviando]);
  const [erro, setErro] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);

  /**
   * A cota de gravacoes do ciclo, perguntada ANTES de deixar escolher arquivo.
   *
   * Existe desde 18/09, quando os limites de plano passaram a valer. A pergunta
   * acontece aqui e nao so na hora do upload porque a hora do upload e o pior
   * momento possivel para descobrir: a pessoa ja escolheu um arquivo de 900 MB e
   * ja esperou. O portao de verdade continua no servidor, que e o unico que
   * uma aba com devtools aberto nao contorna.
   */
  const [limite, setLimite] = useState<Estouro | null>(null);
  const [restantes, setRestantes] = useState<number | null>(null);
  const [renovaEm, setRenovaEm] = useState<string | null>(null);
  // Os tetos do PLANO (29/09): 1, 2 ou 5 horas. Até a resposta chegar vale o
  // maior teto, e o servidor recusa no token se passar do plano.
  const [envio, setEnvio] = useState<LimitesDoEnvio>(LIMITES_SEM_PLANO);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        // /api/videos/limites, e não /api/videos/cota, que é a cota do vídeo
        // por IA: até 29/09 esta tela lia a rota errada e a oferta nunca vinha.
        const r = await fetch("/api/videos/limites");
        if (!r.ok || !vivo) return;
        const data = await r.json();
        if (data.envio) setEnvio(data.envio as LimitesDoEnvio);
        if (!data.pode && data.limite) setLimite(data.limite as Estouro);
        // Admin e quem nao tem cota nao veem contagem: mostrar "0 de 0" para
        // quem opera a plataforma seria o produto cobrando plano do dono.
        if (data.uso && !data.uso.admin && !data.uso.semPlano) {
          setRestantes(data.uso.restantes as number);
          setRenovaEm((data.uso.renovaEm as string | null) ?? null);
        }
      } catch {
        // Sem resposta, a tela segue como antes. O servidor recusa se precisar,
        // e um erro de rede aqui nao pode impedir alguem de enviar video.
      }
    })();
    return () => {
      vivo = false;
    };
  }, [pronto]);

  // A miniatura de cada parte, só quando há mais de uma (o arquivo único segue
  // sem ela, como antes): um quadro do começo, lido no navegador.
  useEffect(() => {
    if (arquivos.length < 2) return;
    for (const a of arquivos) {
      if (a.miniatura !== undefined || miniaturasPedidas.current.has(a.id)) continue;
      miniaturasPedidas.current.add(a.id);
      void lerMiniatura(a.file).then((m) => setArquivos((xs) => xs.map((x) => (x.id === a.id ? { ...x, miniatura: m } : x))));
    }
  }, [arquivos]);

  /**
   * Os arquivos escolhidos. Um só: exatamente o caminho de sempre. Mais de um
   * (de uma vez, ou acrescentando depois): as PARTES, numeradas na ordem
   * sugerida, esperando a confirmação. Se a pessoa já mexeu na ordem, o que
   * chega depois entra no fim, para não desfazer o que ela montou.
   */
  async function escolher(files: File[], somar: boolean) {
    setErro(null);
    setPronto(false);
    // O mesmo arquivo escolhido duas vezes entraria duas vezes no vídeo.
    const mesmo = (a: File, b: File) => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
    const repetidos = somar ? files.filter((f) => arquivos.some((a) => mesmo(a.file, f))) : [];
    files = files.filter((f, i) => !repetidos.includes(f) && files.findIndex((g) => mesmo(g, f)) === i);
    if (repetidos.length) setErro(`"${repetidos[0].name}" já está na lista e não entrou de novo.`);
    if (!files.length) return;
    setLendo(true);
    const lidos: Arquivo[] = [];
    for (const file of files) {
      const { duracao, largura, altura } = await lerVideo(file);
      lidos.push({ id: novoId(), file, duracao, largura, altura, veredito: validarVideo(file.size, duracao, envio), url: null, progresso: null });
    }
    const base = somar ? arquivos : [];
    const ordenar = (lista: Arquivo[]) => {
      const s = sugerirOrdem(lista.map((a) => ({ nome: a.file.name, modificadoEm: a.file.lastModified })));
      return { lista: s.ordem.map((i) => lista[i]), criterio: s.criterio };
    };
    let lista: Arquivo[];
    let novoCriterio: CriterioDaOrdem | "manual";
    if (somar && criterio === "manual") {
      lista = [...base, ...ordenar(lidos).lista];
      novoCriterio = "manual";
    } else {
      const s = ordenar([...base, ...lidos]);
      lista = s.lista;
      novoCriterio = s.criterio;
    }
    if (lista.length > MAX_PARTES) {
      lista = lista.slice(0, MAX_PARTES);
      setErro(`Uma gravação aceita até ${MAX_PARTES} partes. Ficaram as ${MAX_PARTES} primeiras da lista.`);
    }
    setArquivos(lista);
    setCriterio(novoCriterio);
    setConfirmada(false);
    setLendo(false);
  }

  function abrirEscolha(somar: boolean) {
    acrescentar.current = somar;
    inputRef.current?.click();
  }

  /** O que manda na tela e no envio: o arquivo único, ou a soma das partes. */
  const duracaoTotal = arquivos.reduce((t, a) => t + (Number.isFinite(a.duracao) ? a.duracao : 0), 0);
  const bytesTotal = arquivos.reduce((t, a) => t + a.file.size, 0);
  const ilegivel = arquivos.findIndex((a) => !a.duracao || !Number.isFinite(a.duracao));
  const vereditoDasPartes: Veredito | null = !emPartes
    ? null
    : ilegivel >= 0
      ? {
          ok: false,
          motivo: `Não consegui ler a duração de "${arquivos[ilegivel].file.name}" (parte ${ilegivel + 1}).`,
          dica: "Tente exportar esse arquivo em MP4, ou tire essa parte da lista.",
        }
      : (() => {
          // A régua é a da gravação JUNTADA (a soma), e a frase diz isso: o
          // teto de tamanho do plano vale para a gravação inteira.
          const r = validarVideo(bytesTotal, duracaoTotal, envio);
          return r.ok ? r : { ...r, motivo: r.motivo.replace(/^Esse vídeo tem/, "As partes somam").replace(/^O arquivo tem/, "As partes somam").replace(/ por arquivo\./, " por gravação.") };
        })();

  /**
   * AS PARTES, uma por uma, pelo mesmo caminho do arquivo único (Blob
   * privado). Cada pedido de token leva a lista inteira na ordem confirmada,
   * com a URL das que já subiram: o aviso da última parte registra o vídeo
   * mesmo se a aba fechar. Parte que já subiu num envio interrompido não sobe
   * de novo. No fim, o registro com a lista, como o do arquivo único.
   */
  async function enviarPartes(): Promise<Response> {
    const lista = arquivos.map((a) => ({ ...a }));
    let antes = lista.filter((a) => a.url).reduce((t, a) => t + a.file.size, 0);
    for (let i = 0; i < lista.length; i++) {
      const a = lista[i];
      if (a.url) continue;
      setArquivos((xs) => xs.map((x) => (x.id === a.id ? { ...x, progresso: 0 } : x)));
      const blob = await upload(`videos/${projectId}/${a.file.name}`, a.file, {
        access: "private",
        multipart: true,
        handleUploadUrl: "/api/videos/upload",
        clientPayload: JSON.stringify({ projectId, parte: { indice: i, criterio, partes: partesParaEnviar(lista) } }),
        onUploadProgress: (p) => {
          setArquivos((xs) => xs.map((x) => (x.id === a.id ? { ...x, progresso: Math.round(p.percentage) } : x)));
          setEnviados(antes + p.loaded);
          setProgresso(Math.round(((antes + p.loaded) / Math.max(1, bytesTotal)) * 100));
        },
      });
      a.url = blob.url;
      antes += a.file.size;
      setArquivos((xs) => xs.map((x) => (x.id === a.id ? { ...x, url: blob.url, progresso: 100 } : x)));
    }
    return fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, criterio, partes: partesParaEnviar(lista) }),
    });
  }

  async function enviar() {
    if (!arquivo) return;
    if (emPartes ? !vereditoDasPartes?.ok || !confirmada : !arquivo.veredito.ok) return;
    setEnviando(true);
    setErro(null);
    setProgresso(0);
    setEnviados(0);
    try {
      if (emPartes) {
        const registro = await enviarPartes();
        if (!registro.ok) {
          const corpo = (await registro.json().catch(() => ({}))) as { error?: string; limite?: Estouro };
          if (corpo.limite?.recurso === "gravacoes") {
            setArquivos([]);
            setLimite(corpo.limite);
            return;
          }
          throw new Error(corpo.error ?? "Não consegui registrar as partes da gravação.");
        }
        setPronto(true);
        setArquivos([]);
        onEnviado?.();
        return;
      }

      const blob = await upload(`videos/${projectId}/${arquivo.file.name}`, arquivo.file, {
        // Privado de propósito: vídeo cru do cliente é material não publicado e
        // não pode ficar alcançável por quem tiver a URL.
        access: "private",
        // Recomendado acima de 100 MB: divide em partes, sobe em paralelo e
        // repete só a parte que falhar, em vez de perder o upload inteiro.
        multipart: true,
        handleUploadUrl: "/api/videos/upload",
        clientPayload: JSON.stringify({ projectId }),
        onUploadProgress: (p) => {
          setProgresso(Math.round(p.percentage));
          setEnviados(p.loaded);
        },
      });

      // Em desenvolvimento o callback do storage não alcança o localhost, então
      // o registro também é exposto aqui. A rota é idempotente.
      const registro = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          blobUrl: blob.url,
          originalName: arquivo.file.name,
          sizeBytes: arquivo.file.size,
          // A duração lida aqui (08/10): a trava dos minutos do mês vale já no registro.
          duracaoSeg: Number.isFinite(arquivo.duracao) && arquivo.duracao > 0 ? arquivo.duracao : null,
        }),
      });

      // A COTA CONFERIDA DE NOVO NO REGISTRO (30/09). O token foi emitido com
      // gravação livre, mas outra aba pode ter usado a última enquanto este
      // arquivo subia. Até aqui a resposta nem era lida: a tela dizia "vídeo
      // recebido" para um registro que não existia.
      if (!registro.ok) {
        const corpo = (await registro.json().catch(() => ({}))) as { error?: string; limite?: Estouro };
        if (corpo.limite?.recurso === "gravacoes") {
          setArquivos([]);
          setLimite(corpo.limite);
          return;
        }
        throw new Error(corpo.error ?? "Não consegui registrar o vídeo.");
      }

      setPronto(true);
      setArquivos([]);
      onEnviado?.();
    } catch (e) {
      // Internet que caiu no meio do envio: dizer o que houve e o que fazer,
      // em vez do texto técnico do navegador ("Failed to fetch").
      const semRede = typeof navigator !== "undefined" && navigator.onLine === false;
      const msg = e instanceof Error ? e.message : "";
      setErro(
        semRede || /fetch|network|rede|conex/i.test(msg)
          ? "A sua internet caiu durante o envio e o vídeo não chegou inteiro. Nada foi cobrado. Quando a conexão voltar, toque em \"Enviar e montar a semana\" de novo."
          : msg || "Falha ao enviar o vídeo."
      );
    } finally {
      setEnviando(false);
    }
  }

  const v = emPartes ? vereditoDasPartes : arquivo?.veredito;

  // Cota esgotada: o cartao de envio SOME e a oferta toma o lugar dele. Deixar o
  // cartao na tela, desabilitado, convida a tentar e falhar, que e o contrario
  // do que uma oferta faz.
  if (limite) return <PedidoDeUpgrade estouro={limite} />;

  return (
    <div className="space-y-4">
    {/* O aviso de penultima e ultima gravacao, que so aparece perto do fim:
        aviso que fica na tela o ciclo inteiro nao e aviso, e decoracao. */}
    {restantes !== null && restantes > 0 && restantes <= 2 && (
      <FaixaDeCota restantes={restantes} renovaEm={renovaEm} sugestao={null} />
    )}
    <div
      className="rounded-xl border p-6"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      <div className="flex items-start gap-3 mb-5">
        <Video className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
        <div>
          <h2 className="font-bold text-[var(--text-primary)]">
            Envie a gravação da semana
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Fale do jeito que você falaria com um cliente. O squad transcreve,
            escolhe os melhores trechos e escreve o conteúdo de cada rede.
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={TIPOS_ACEITOS.join(",")}
        className="hidden"
        onChange={(e) => {
          // Vários de uma vez (08/10): a gravação feita em partes. O valor é
          // limpo para o mesmo arquivo poder ser escolhido de novo.
          const fs = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (fs.length) void escolher(fs, acrescentar.current);
          acrescentar.current = false;
        }}
      />

      {!arquivo && !pronto && (
        <button
          onClick={() => abrirEscolha(false)}
          disabled={lendo}
          className="w-full rounded-xl border border-dashed p-8 text-center transition-colors hover:border-orange-500/40"
          style={{ borderColor: "var(--border)", background: "var(--bg-primary)" }}
        >
          {lendo ? (
            <span className="inline-flex items-center gap-2 text-[var(--text-muted)]">
              <Loader2 className="w-4 h-4 animate-spin" />
              Lendo o arquivo
            </span>
          ) : (
            <>
              <Upload className="w-6 h-6 mx-auto mb-2 text-[var(--text-muted)]" />
              <span className="block text-[var(--text-primary)] font-medium">
                Escolher vídeo
              </span>
              <span className="block text-sm text-[var(--text-muted)] mt-1">
                {/* O número vem da constante, e não escrito à mão. O limite
                    subiu de 60 para 120 em 22/08 e este texto ficou para trás,
                    prometendo metade do que a plataforma aceita. */}
                {/* OS MINUTOS DO MÊS (08/10): o teto do envio é o que sobra dos
                    minutos do cartão; zerado, a frase diz isso em vez de "até 0 minutos". */}
                {envio.minutos && envio.minutos.restantes <= 0
                  ? `MP4, MOV, MKV ou WebM. Os ${envio.minutos.porMes} minutos de vídeo deste mês${envio.plano ? ` do ${envio.plano}` : ""} já foram usados.`
                  : `MP4, MOV, MKV ou WebM. Até ${duracaoPorExtenso(envio.duracaoMaximaSeg)}${envio.plano ? ` no ${envio.plano}` : ""}${envio.minutos ? ` (${envio.minutos.porMes} minutos de vídeo por mês)` : ""}.`}
              </span>
              <span className="block text-xs text-[var(--text-muted)] mt-1">
                Gravou em partes? Escolha todos os arquivos de uma vez e diga a ordem em seguida.
              </span>
            </>
          )}
        </button>
      )}

      {pronto && (
        <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-5 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-[var(--text-primary)] font-medium">
              Vídeo recebido. O squad já começou.
            </p>
            <button
              onClick={() => {
                setPronto(false);
                abrirEscolha(false);
              }}
              className="text-sm text-orange-400 mt-1 hover:underline"
            >
              Enviar outro
            </button>
          </div>
        </div>
      )}

      {arquivo && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {emPartes ? (
            <PartesDaGravacao
              partes={arquivos.map((a) => ({
                id: a.id,
                nome: a.file.name,
                bytes: a.file.size,
                duracao: Number.isFinite(a.duracao) ? a.duracao : 0,
                largura: a.largura,
                altura: a.altura,
                miniatura: a.miniatura ?? null,
                progresso: a.progresso,
                enviada: Boolean(a.url),
              }))}
              criterio={criterio}
              confirmada={confirmada}
              bloqueada={enviando || lendo}
              onMover={(de, para) => {
                setArquivos((xs) => moverParte(xs, de, para));
                setCriterio("manual");
                setConfirmada(false);
              }}
              onRemover={(i) => {
                setArquivos((xs) => xs.filter((_, j) => j !== i));
                setConfirmada(false);
              }}
              onAcrescentar={() => abrirEscolha(true)}
              onConfirmar={() => setConfirmada(true)}
            />
          ) : (
            <div
              className="rounded-xl border p-4 mb-4"
              style={{ background: "var(--bg-primary)", borderColor: "var(--border)" }}
            >
              <p className="text-[var(--text-primary)] font-medium truncate">
                {arquivo.file.name}
              </p>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                {Math.round(arquivo.duracao / 60)} min,{" "}
                {(arquivo.file.size / 1048576).toFixed(0)} MB
              </p>
              {/* A gravação em partes (08/10): o arquivo único pode ganhar
                  outra parte depois, e aí a tela pede a ordem. */}
              <button
                type="button"
                onClick={() => abrirEscolha(true)}
                disabled={enviando || lendo}
                className="text-sm text-orange-400 mt-2 hover:underline disabled:opacity-50"
              >
                Gravou em mais de um arquivo? Acrescentar outra parte
              </button>
            </div>
          )}

          {v && !v.ok && (
            <div className="rounded-xl border border-orange-500/25 bg-orange-500/10 p-4 mb-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[var(--text-primary)] font-medium">{v.motivo}</p>
                {v.dica && (
                  <p className="text-sm text-[var(--text-muted)] mt-1">{v.dica}</p>
                )}
              </div>
            </div>
          )}

          {v && v.ok && (
            <div
              className="rounded-xl border p-4 mb-4 space-y-3"
              style={{ background: "var(--bg-primary)", borderColor: "var(--border)" }}
            >
              {/* OS CRÉDITOS EM DUAS PARTES (30/09, tela de roteiro): o cliente
                  paga no envio só o que roda antes de aprovar, e o resto só
                  depois de escolher os cortes e aprovar as cenas. Os números
                  saem de `creditosEmDuasPartes` (lib/media/limits.ts), no preço
                  em vigor desde 01/10. Desde então passam de mil, e vão com
                  separador de milhar: "3174" se lê errado, "3.174" não. */}
              {(() => {
                // Com partes (08/10), a conta é a da gravação juntada: a soma.
                const partes = creditosEmDuasPartes(duracaoTotal, bytesTotal);
                return (
                  <>
                    <p className="text-sm text-[var(--text-muted)]">
                      <strong className="text-[var(--text-primary)]">Primeira parte, agora no envio:</strong>{" "}
                      <strong className="text-[var(--text-primary)]">{creditosNaTela(partes.roteiro)} créditos</strong>.
                      Eu transcrevo, limpo a sua fala, escolho cerca de{" "}
                      <strong className="text-[var(--text-primary)]">{v.clipes} cortes possíveis</strong>, escrevo a
                      semana de peças e preparo o roteiro da edição para você aprovar.
                    </p>
                    <p className="text-sm text-[var(--text-muted)]">
                      <strong className="text-[var(--text-primary)]">Segunda parte, só quando você aprovar o roteiro:</strong>{" "}
                      <strong className="text-[var(--text-primary)]">{creditosNaTela(partes.aprovacaoMax)} créditos</strong>{" "}
                      com os {CORTES_SUGERIDOS} cortes que eu sugiro, sendo {creditosNaTela(partes.completo)} do vídeo completo
                      editado (com a abertura dos melhores momentos) e {creditosNaTela(partes.porCorte)} por corte que você
                      escolher, até {MAX_CORTES_APROVADOS}. Nada de imagem, cena ou corte é gerado antes da sua aprovação.
                    </p>
                    <div className="text-xs text-[var(--text-muted)] space-y-1">
                      <p>
                        <strong className="text-[var(--text-primary)]">
                          No total, {creditosNaTela(partes.total)} créditos com {CORTES_SUGERIDOS} cortes.
                        </strong>{" "}
                        Se você não aprovar o roteiro, só a primeira parte é usada. Com 1 corte em vez de {CORTES_SUGERIDOS}, a segunda
                        parte fica {creditosNaTela(partes.porCorte * (CORTES_SUGERIDOS - 1))} créditos menor; cada corte a mais soma{" "}
                        {creditosNaTela(partes.porCorte)}.
                      </p>
                      <p>
                        Já incluso: legenda e edição na linguagem que você escolheu, as capas e o arquivo acima do
                        tamanho recomendado ({CREDITOS_POR_GB_EXTRA} créditos por GB, na primeira parte). À parte, só
                        se você escolher: a abertura com movimento de câmera por IA, {CREDITOS_POR_GERACAO_HIGGSFIELD}{" "}
                        créditos por cena gerada.
                      </p>
                    </div>
                  </>
                );
              })()}

              {/*
                Sugestão em vez de bloqueio (decisão do Bruno, 22/08). A versão
                anterior recusava o vídeo por taxa de gravação alta; agora ele
                sobe, custa mais, e a pessoa fica sabendo quanto economizaria
                gravando mais leve. Quem grava na taxa recomendada não vê nada.
              */}
              {/* Antes de começar, o que dá para dizer sem medir: o tempo é da
                  rede de quem envia, e arquivo grande pede wi-fi. A velocidade
                  de verdade aparece nos primeiros segundos do envio. */}
              {!enviando && (
                <p className="text-xs text-[var(--text-muted)]">
                  O tempo de envio depende da sua internet. Assim que começar, mostramos a velocidade da sua rede e
                  quanto falta.
                </p>
              )}
              {!enviando && (bytesTotal > ARQUIVO_GRANDE_BYTES || movel === true) && <AvisoDeWifi movel={movel === true} />}

              {v.sugestao && (
                <p className="text-sm text-orange-300 border-t pt-3" style={{ borderColor: "var(--border)" }}>
                  {v.sugestao}
                </p>
              )}
            </div>
          )}

          {enviando && (
            <div className="mb-4">
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: "var(--bg-primary)" }}
              >
                <div
                  className="h-full bg-orange-500 transition-all"
                  style={{ width: `${progresso}%` }}
                />
              </div>
              <p className="text-sm text-[var(--text-muted)] mt-2">
                {emPartes
                  ? `Enviando as ${arquivos.length} partes (${arquivos.filter((a) => a.url).length} de ${arquivos.length} prontas), ${progresso}%`
                  : `Enviando, ${progresso}%`}
              </p>
              <MedidorDeEnvio enviados={enviados} total={bytesTotal} />
              {/* O ÚNICO MOMENTO QUE PEDE A PÁGINA ABERTA (03/10): o arquivo sai
                  do aparelho do cliente. Depois do envio, tudo roda nos nossos
                  servidores e o e-mail chama de volta. */}
              <p className="text-sm mt-3 rounded-lg px-3 py-2" style={{ background: "var(--bg-primary)" }}>
                <span className="font-semibold">Mantenha esta página aberta só até o envio chegar a 100%.</span> Depois
                disso pode fechar, desligar ou ficar sem internet: a edição continua nos nossos servidores e avisamos
                aqui e por e-mail quando precisarmos de você ou quando estiver pronto.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={enviar} disabled={!v?.ok || enviando || (emPartes && !confirmada)}>
              {enviando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Enviar e montar a semana
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setArquivos([]);
                setConfirmada(false);
                setErro(null);
              }}
              disabled={enviando}
            >
              {emPartes ? "Recomeçar" : "Escolher outro"}
            </Button>
          </div>
          {/* A ordem antes do envio (08/10): o botão fica parado até a pessoa confirmar. */}
          {emPartes && !confirmada && v?.ok && !enviando && (
            <p className="text-xs text-[var(--text-muted)] mt-2">Confirme a ordem das partes para enviar.</p>
          )}
        </motion.div>
      )}

      {/* O erro do envio: X só local (07/10). */}
      {erro && (
        <p className="flex items-start gap-1 text-sm text-orange-400 mt-4">
          <span className="flex-1">{erro}</span>
          <BotaoDescartar compacto aoDescartar={() => setErro(null)} className="-my-0.5" />
        </p>
      )}

      <p className="text-xs text-[var(--text-muted)] mt-5">
        Dica que economiza o seu tempo: grave a 4 Mbps (
        {MB_POR_MINUTO_RECOMENDADO} MB por minuto). No OBS é Configurações,
        Saída, Taxa de bits do vídeo, 4000 Kbps. Para alguém falando na frente da
        câmera a imagem é a mesma, e o arquivo sobe em segundos em vez de
        minutos.
      </p>
    </div>
    </div>
  );
}
