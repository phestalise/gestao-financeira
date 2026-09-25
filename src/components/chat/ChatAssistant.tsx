"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUp,
  Camera,
  Check,
  Loader2,
  MessageCircleQuestion,
  Paperclip,
  PencilLine,
  PlusCircle,
  RotateCcw,
  X,
} from "lucide-react";
import clsx from "clsx";
import { AddTransactionSheet } from "@/components/transactions/AddTransactionSheet";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { getCategoryById, PAYMENT_METHODS } from "@/constants/categories";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDateLabel } from "@/lib/utils/date";
import { AIParsedTransaction } from "@/types";

export interface MonthSnapshot {
  balance: number;
  expenses: number;
  budgetUsedPercent: number;
  status: "ok" | "warning" | "over";
  count: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  preview?: AIParsedTransaction;
  previewStatus?: "pending" | "saving" | "saved";
}

interface PendingImage {
  data: string;
  mimeType: string;
  previewUrl: string;
}

// Reduz a foto no navegador antes de enviar: fotos de celular passam fácil de 4 MB,
// que é o limite de corpo das funções na Vercel, e a IA não precisa de mais resolução que isso.
const MAX_IMAGE_SIDE = 1600;

async function prepareImage(file: File): Promise<PendingImage> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Não consegui abrir a imagem."));
      el.src = url;
    });
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    return { data: dataUrl.split(",")[1], mimeType: "image/jpeg", previewUrl: dataUrl };
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Exemplos de lançamento vão para a caixa de texto (para a pessoa ajustar o valor);
// perguntas são enviadas direto.
const LOG_EXAMPLES = ["gastei 35 no almoço hoje", "recebi 1.200 do freela", "paguei 120 de luz no pix"];
const QUESTIONS = ["Quanto ainda posso gastar este mês?", "Onde estou gastando mais?", "Como estou em relação ao mês passado?"];

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `msg-${idCounter}`;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function ChatAssistant({ firstName, snapshot }: { firstName?: string; snapshot: MonthSnapshot | null }) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastTransactionId, setLastTransactionId] = useState<string | null>(null);
  const [editingPreview, setEditingPreview] = useState<AIParsedTransaction | null>(null);
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [hello, setHello] = useState("Olá");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a hora local só existe no navegador
    setHello(greeting());
  }, []);

  // A caixa de texto cresce com o conteúdo, até umas 5 linhas.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [input]);

  function addAssistant(content: string, extra?: Partial<ChatMessage>) {
    setMessages((prev) => [...prev, { id: nextId(), role: "assistant", content, ...extra }]);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setPendingImage(await prepareImage(file));
      textareaRef.current?.focus();
    } catch {
      addAssistant("Não consegui abrir essa imagem. Tenta outra?");
    }
  }

  function scrollToEnd() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  function fillInput(text: string) {
    setInput(text);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      el?.focus();
      el?.setSelectionRange(text.length, text.length);
    });
  }

  function resetConversation() {
    setMessages([]);
    setLastTransactionId(null);
    setPendingImage(null);
    setInput("");
  }

  async function sendMessage(text: string) {
    const image = pendingImage;
    if ((!text.trim() && !image) || loading) return;

    const userMessage: ChatMessage = { id: nextId(), role: "user", content: text.trim(), imageUrl: image?.previewUrl };
    const history = messages.map((m) => ({
      role: m.role,
      content: m.content || (m.imageUrl ? "[imagem enviada]" : ""),
    }));
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setPendingImage(null);
    setLoading(true);
    scrollToEnd();

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          image: image ? { data: image.data, mimeType: image.mimeType } : null,
          history,
          lastTransactionId,
        }),
      });
      const data = await res.json();
      addAssistant(data.reply ?? "Tive um problema para responder agora. Tenta de novo?", {
        preview: data.preview,
        previewStatus: data.preview ? "pending" : undefined,
      });
      if (data.action === "delete_transaction") setLastTransactionId(null);
      if (data.action === "update_transaction" || data.action === "delete_transaction") router.refresh();
    } catch {
      addAssistant("Tive um problema para responder agora. Tenta de novo?");
    } finally {
      setLoading(false);
      scrollToEnd();
    }
  }

  function setPreviewStatus(id: string, previewStatus: ChatMessage["previewStatus"]) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, previewStatus } : m)));
  }

  async function confirmTransaction(message: ChatMessage) {
    if (!message.preview || message.previewStatus !== "pending") return;
    setPreviewStatus(message.id, "saving");
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message.preview),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setLastTransactionId(data.transaction.id);
      setPreviewStatus(message.id, "saved");
      router.refresh();
    } catch {
      setPreviewStatus(message.id, "pending");
      addAssistant("Não consegui registrar. Tenta de novo?");
    } finally {
      scrollToEnd();
    }
  }

  const empty = messages.length === 0;

  return (
    <div className="-mb-24 flex h-[calc(100dvh-4.5rem-env(safe-area-inset-bottom))] flex-col overflow-x-clip sm:-mb-8 sm:h-dvh">
      {/* cabeçalho */}
      <header className="flex items-center gap-3 border-b border-[var(--border)] px-4 pb-3 pt-[max(env(safe-area-inset-top),1rem)] sm:px-8 sm:pt-5">
        <span className="ai-orb relative h-9 w-9 shrink-0" data-busy={loading} />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold leading-tight">
            Assistente <span className="brand-serif text-[1.1em] text-[var(--accent-text)]">Meu Dinheiro</span>
          </p>
          <p className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--positive)]" />
            {loading ? "pensando…" : "online · conhece seus números"}
          </p>
        </div>
        {!empty && (
          <button
            onClick={resetConversation}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Nova conversa</span>
          </button>
        )}
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        {empty ? (
          <EmptyState
            hello={hello}
            firstName={firstName}
            snapshot={snapshot}
            onExample={fillInput}
            onQuestion={sendMessage}
            onPhoto={() => fileInputRef.current?.click()}
          />
        ) : (
          <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-8">
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="ai-msg-in flex justify-end">
                  <div
                    className="max-w-[85%] rounded-3xl rounded-br-lg px-4 py-3 text-[15px] leading-relaxed text-white shadow-[0_10px_30px_-12px_rgba(15,82,186,0.7)]"
                    style={{ background: "linear-gradient(135deg, #2f6fd6, #0f52ba)" }}
                  >
                    {m.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.imageUrl} alt="Imagem enviada" className={clsx("max-h-60 rounded-2xl object-contain", m.content && "mb-2")} />
                    )}
                    <span className="whitespace-pre-line">{m.content}</span>
                  </div>
                </div>
              ) : (
                <div key={m.id} className="ai-msg-in flex gap-3">
                  <span className="ai-orb relative mt-0.5 h-7 w-7 shrink-0" />
                  <div className="min-w-0 max-w-[85%] flex-1 pt-0.5">
                    <RichText text={m.content} />
                    {m.preview && (
                      <PreviewCard
                        preview={m.preview}
                        status={m.previewStatus ?? "pending"}
                        onConfirm={() => confirmTransaction(m)}
                        onEdit={() => setEditingPreview(m.preview!)}
                      />
                    )}
                  </div>
                </div>
              )
            )}
            {loading && (
              <div className="ai-msg-in flex items-center gap-3">
                <span className="ai-orb relative h-7 w-7 shrink-0" data-busy="true" />
                <div className="flex items-center gap-1 rounded-full bg-[var(--surface-2)] px-4 py-3">
                  <span className="ai-dot h-1.5 w-1.5 rounded-full bg-[var(--accent-text)]" />
                  <span className="ai-dot h-1.5 w-1.5 rounded-full bg-[var(--accent-text)]" />
                  <span className="ai-dot h-1.5 w-1.5 rounded-full bg-[var(--accent-text)]" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* caixa de mensagem */}
      <div className="px-3 pb-8 pt-2 sm:px-8 sm:pb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="ai-composer mx-auto max-w-3xl rounded-[26px] border border-[var(--border)] bg-[var(--surface)] p-2"
        >
          {pendingImage && (
            <div className="ai-msg-in mb-2 flex items-center gap-3 rounded-2xl bg-[var(--surface-2)] p-2">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pendingImage.previewUrl} alt="Imagem anexada" className="h-14 w-14 rounded-xl object-cover" />
                <button
                  type="button"
                  onClick={() => setPendingImage(null)}
                  aria-label="Remover imagem"
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--foreground)] text-[var(--background)]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-xs text-[var(--muted)]">Vou ler valor, data e local da imagem. Quer comentar algo?</p>
            </div>
          )}
          <div className="flex items-end gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              aria-label="Anexar foto de comprovante"
              title="Foto de comprovante, nota ou print de Pix"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] disabled:opacity-50"
            >
              <Paperclip className="h-[18px] w-[18px]" />
            </button>
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder={pendingImage ? "Comentário (opcional)" : "Conte um gasto ou pergunte algo…"}
              className="max-h-[140px] min-h-10 flex-1 resize-none bg-transparent py-2.5 text-[15px] leading-5 outline-none"
            />
            <button
              type="submit"
              disabled={loading || (!input.trim() && !pendingImage)}
              aria-label="Enviar"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-all enabled:hover:scale-105 disabled:opacity-35"
              style={{ background: "linear-gradient(135deg, #2f6fd6, #0f52ba)" }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-[18px] w-[18px]" />}
            </button>
          </div>
        </form>
        <p className="mx-auto mt-2 hidden max-w-3xl text-center text-[11px] text-[var(--muted-2)] sm:block">
          Enter envia · Shift + Enter quebra a linha · A IA pode errar, confira antes de registrar
        </p>
      </div>

      <AddTransactionSheet
        open={editingPreview !== null}
        onClose={() => setEditingPreview(null)}
        initialValues={editingPreview ?? undefined}
      />
    </div>
  );
}

function EmptyState({
  hello,
  firstName,
  snapshot,
  onExample,
  onQuestion,
  onPhoto,
}: {
  hello: string;
  firstName?: string;
  snapshot: MonthSnapshot | null;
  onExample: (text: string) => void;
  onQuestion: (text: string) => void;
  onPhoto: () => void;
}) {
  const statusColor =
    snapshot?.status === "over" ? "var(--negative)" : snapshot?.status === "warning" ? "var(--warning)" : "var(--positive)";

  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-center px-4 py-8 sm:px-8">
      <div className="ai-msg-in relative mb-6 h-16 w-16">
        <span className="ai-orb-glow absolute inset-[-40%] rounded-full bg-[radial-gradient(circle,rgba(47,111,214,0.45),transparent_65%)]" />
        <span className="ai-orb absolute inset-0" />
      </div>

      <p className="ai-msg-in text-[15px] text-[var(--muted)]" style={{ animationDelay: "60ms" }}>
        {hello}
        {firstName ? `, ${firstName}` : ""}! 👋
      </p>
      <h1 className="ai-msg-in mt-1 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl" style={{ animationDelay: "120ms" }}>
        O que aconteceu com seu <span className="brand-serif brand-gradient pr-1 text-[1.15em]">dinheiro</span> hoje?
      </h1>

      {snapshot && (
        <div className="ai-msg-in mt-5 flex flex-wrap gap-2 text-xs sm:text-sm" style={{ animationDelay: "180ms" }}>
          <span className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: statusColor }} />
            Sobra do mês <strong className="tabular-nums">{formatCurrency(snapshot.balance)}</strong>
          </span>
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[var(--muted)]">
            <strong className="text-[var(--foreground)] tabular-nums">{snapshot.budgetUsedPercent}%</strong> da renda gasto
          </span>
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[var(--muted)]">
            <strong className="text-[var(--foreground)] tabular-nums">{snapshot.count}</strong> lançamentos
          </span>
        </div>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <SuggestionCard icon={PlusCircle} title="Lançar" subtitle="Escreva do seu jeito" delay={240}>
          {LOG_EXAMPLES.map((t) => (
            <SuggestionItem key={t} onClick={() => onExample(t)}>
              “{t}”
            </SuggestionItem>
          ))}
        </SuggestionCard>
        <SuggestionCard icon={MessageCircleQuestion} title="Perguntar" subtitle="Com seus números reais" delay={300}>
          {QUESTIONS.map((t) => (
            <SuggestionItem key={t} onClick={() => onQuestion(t)}>
              {t}
            </SuggestionItem>
          ))}
        </SuggestionCard>
        <button
          type="button"
          onClick={onPhoto}
          className="ai-card ai-msg-in flex flex-col rounded-3xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-4 text-left"
          style={{ animationDelay: "360ms" }}
        >
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--accent-text)]">
            <Camera className="h-5 w-5" />
          </span>
          <p className="font-semibold">Ler comprovante</p>
          <p className="text-xs text-[var(--muted)]">Foto ou print</p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Mande a foto de uma nota, cupom ou print de Pix e eu preencho tudo pra você.
          </p>
        </button>
      </div>
    </div>
  );
}

function SuggestionCard({
  icon: Icon,
  title,
  subtitle,
  delay,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="ai-msg-in rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--accent-text)]">
        <Icon className="h-5 w-5" />
      </span>
      <p className="font-semibold">{title}</p>
      <p className="text-xs text-[var(--muted)]">{subtitle}</p>
      <div className="mt-3 space-y-1.5">{children}</div>
    </div>
  );
}

function SuggestionItem({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ai-card block w-full rounded-xl border border-transparent bg-[var(--surface-2)] px-3 py-2 text-left text-sm text-[var(--foreground)]"
    >
      {children}
    </button>
  );
}

function PreviewCard({
  preview,
  status,
  onConfirm,
  onEdit,
}: {
  preview: AIParsedTransaction;
  status: NonNullable<ChatMessage["previewStatus"]>;
  onConfirm: () => void;
  onEdit: () => void;
}) {
  const category = getCategoryById(preview.categoryId);
  const method = PAYMENT_METHODS.find((p) => p.id === preview.paymentMethod)?.label;
  const income = preview.type === "income";

  return (
    <div
      className={clsx(
        "relative mt-3 overflow-hidden rounded-3xl border bg-[var(--surface)] transition-colors",
        status === "saved" ? "border-[color-mix(in_srgb,var(--positive)_45%,transparent)]" : "border-[var(--border)]"
      )}
    >
      <div className="flex items-center gap-3 p-4">
        <CategoryBadge categoryId={preview.categoryId} icon={category?.icon ?? "more-horizontal"} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{preview.description || category?.name}</p>
          <p className="truncate text-xs text-[var(--muted)]">
            {[category?.name, formatDateLabel(preview.date ?? ""), method].filter(Boolean).join(" · ")}
          </p>
        </div>
        <p
          className="shrink-0 text-lg font-semibold tabular-nums"
          style={{ color: income ? "var(--positive)" : "var(--foreground)" }}
        >
          {income ? "+" : "−"}
          {formatCurrency(preview.amount)}
        </p>
      </div>

      {preview.confidence === "low" && status !== "saved" && (
        <p className="mx-4 mb-3 rounded-xl bg-[var(--warning-soft)] px-3 py-2 text-xs text-[var(--warning)]">
          Fiquei na dúvida em algum detalhe. Confere antes de registrar?
        </p>
      )}

      {status === "saved" ? (
        <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-3">
          <span className="ai-stamp flex items-center gap-1.5 rounded-lg border-2 border-[var(--positive)] px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-[var(--positive)]">
            <Check className="h-3.5 w-3.5" strokeWidth={3} /> Registrado
          </span>
          <span className="text-xs text-[var(--muted)]">Errou? É só me dizer.</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 border-t border-[var(--border)] p-3">
          <button
            onClick={onConfirm}
            disabled={status === "saving"}
            className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #2f6fd6, #0f52ba)" }}
          >
            {status === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Registrar
          </button>
          <button
            onClick={onEdit}
            disabled={status === "saving"}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm font-medium hover:bg-[var(--surface-2)]"
          >
            <PencilLine className="h-4 w-4" /> Ajustar
          </button>
        </div>
      )}
    </div>
  );
}

// Formatação leve das respostas da IA: parágrafos, listas, **negrito** e valores em R$ em destaque.
function RichText({ text }: { text: string }) {
  const blocks: { type: "p" | "ul" | "ol"; lines: string[] }[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) {
      blocks.push({ type: "p", lines: [] });
      continue;
    }
    const bullet = line.match(/^[-•*]\s+(.*)/);
    const numbered = line.match(/^\d+[.)]\s+(.*)/);
    const type = bullet ? "ul" : numbered ? "ol" : "p";
    const content = bullet?.[1] ?? numbered?.[1] ?? line;
    const last = blocks[blocks.length - 1];
    if (last && last.type === type && type !== "p") last.lines.push(content);
    else blocks.push({ type, lines: [content] });
  }

  return (
    <div className="space-y-2 text-[15px] leading-relaxed">
      {blocks
        .filter((b) => b.lines.length > 0)
        .map((b, i) =>
          b.type === "p" ? (
            <p key={i}>{b.lines.map((l, j) => <Inline key={j} text={l} />)}</p>
          ) : (
            <ul key={i} className={clsx("space-y-1 pl-5", b.type === "ol" ? "list-decimal" : "list-disc marker:text-[var(--accent-text)]")}>
              {b.lines.map((l, j) => (
                <li key={j}>
                  <Inline text={l} />
                </li>
              ))}
            </ul>
          )
        )}
    </div>
  );
}

function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|R\$\s?-?[\d.]+(?:,\d{1,2})?)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part.startsWith("R$"))
          return (
            <strong key={i} className="font-semibold tabular-nums text-[var(--accent-text)]">
              {part}
            </strong>
          );
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
