"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2 } from "lucide-react";
import { AddTransactionSheet } from "@/components/transactions/AddTransactionSheet";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { getCategoryById } from "@/constants/categories";
import { formatCurrency } from "@/lib/utils/currency";
import { AIParsedTransaction } from "@/types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  preview?: AIParsedTransaction;
}

const SUGGESTIONS = [
  "Quanto gastei esse mês?",
  "Como estão minhas finanças?",
  "Me mostre meus maiores gastos",
  "Quanto posso gastar?",
];

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `msg-${idCounter}`;
}

export function ChatAssistant() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: nextId(),
      role: "assistant",
      content: "Oi! Conte o que aconteceu com seu dinheiro ou pergunte algo sobre suas finanças.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastTransactionId, setLastTransactionId] = useState<string | null>(null);
  const [editingPreview, setEditingPreview] = useState<AIParsedTransaction | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollToEnd() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMessage: ChatMessage = { id: nextId(), role: "user", content: text };
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    scrollToEnd();

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history, lastTransactionId }),
      });
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "assistant", content: data.reply, preview: data.preview },
      ]);

      if (data.action === "update_transaction" || data.action === "delete_transaction") {
        if (data.action === "delete_transaction") setLastTransactionId(null);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "assistant", content: "Tive um problema para responder agora. Tenta de novo?" },
      ]);
    } finally {
      setLoading(false);
      scrollToEnd();
    }
  }

  async function confirmTransaction(preview: AIParsedTransaction) {
    setLoading(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preview),
      });
      const data = await res.json();
      if (res.ok) {
        setLastTransactionId(data.transaction.id);
        setMessages((prev) => [...prev, { id: nextId(), role: "assistant", content: "Registrado! ✅" }]);
        router.refresh();
      } else {
        setMessages((prev) => [
          ...prev,
          { id: nextId(), role: "assistant", content: "Não consegui registrar. Tenta de novo?" },
        ]);
      }
    } finally {
      setLoading(false);
      scrollToEnd();
    }
  }

  return (
    <div className="flex h-[calc(100vh-7.5rem)] flex-col sm:h-[calc(100vh-4rem)]">
      <div className="border-b border-[var(--border)] px-4 pb-3 pt-[max(env(safe-area-inset-top),1.25rem)] sm:px-8 sm:pt-6">
        <h1 className="text-lg font-semibold">Assistente financeiro</h1>
      </div>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 pb-4 pt-4 sm:px-8">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line ${
                m.role === "user"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "bg-[var(--surface-2)] text-[var(--foreground)]"
              }`}
            >
              {m.content}
              {m.preview && (
                <PreviewCard
                  preview={m.preview}
                  onConfirm={() => confirmTransaction(m.preview!)}
                  onEdit={() => setEditingPreview(m.preview!)}
                />
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-[var(--surface-2)] px-4 py-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--muted)]" />
            </div>
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 px-4 pb-2 sm:px-8">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:bg-[var(--surface-2)]"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="flex items-center gap-2 border-t border-[var(--border)] bg-[var(--surface)] p-3 sm:px-8"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Conte o que aconteceu..."
          className="flex-1 rounded-full border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      <AddTransactionSheet
        open={editingPreview !== null}
        onClose={() => setEditingPreview(null)}
        initialValues={editingPreview ?? undefined}
      />
    </div>
  );
}

function PreviewCard({
  preview,
  onConfirm,
  onEdit,
}: {
  preview: AIParsedTransaction;
  onConfirm: () => void;
  onEdit: () => void;
}) {
  const category = getCategoryById(preview.categoryId);
  return (
    <div className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--foreground)]">
      <div className="mb-2 flex items-center gap-2.5">
        <CategoryBadge categoryId={preview.categoryId} icon={category?.icon ?? "more-horizontal"} size="sm" />
        <span className="text-sm font-medium">{category?.name ?? preview.categoryId}</span>
      </div>
      <p className="text-lg font-semibold tabular-nums">{formatCurrency(preview.amount)}</p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={onConfirm}
          className="flex-1 rounded-lg bg-[var(--primary)] px-3 py-2 text-xs font-medium text-[var(--primary-foreground)]"
        >
          Registrar
        </button>
        <button
          onClick={onEdit}
          className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium"
        >
          Editar
        </button>
      </div>
    </div>
  );
}
