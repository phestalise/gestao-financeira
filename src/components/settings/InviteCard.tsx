"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Heart, Share2 } from "lucide-react";
import { Card } from "@/components/ui/Card";

// Link de cadastro com o nome de quem convidou, para a tela de cadastro dizer "Fulano te convidou".
export function InviteCard({ name }: { name?: string }) {
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    const url = new URL("/cadastro", window.location.origin);
    if (name) url.searchParams.set("convite", name.split(" ")[0]);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a origem só existe no navegador
    setLink(url.toString());
    setCanShare(typeof navigator.share === "function");
  }, [name]);

  const message = `Tô usando o Meu Dinheiro para organizar minhas finanças com IA. Cria sua conta, é grátis (e cada um vê só os próprios dados): ${link}`;

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function share() {
    await navigator.share({ title: "Meu Dinheiro", text: message }).catch(() => {});
  }

  return (
    <Card className="mb-4 overflow-hidden p-0">
      <div className="app-hero p-5">
        <p className="flex items-center gap-2 text-sm font-medium text-white/80">
          <Heart className="h-4 w-4" /> Convide quem você gosta
        </p>
        <p className="mt-1 text-lg font-semibold text-white">Irmã, amigos, família: cada um com sua conta.</p>
        <p className="mt-1 text-sm text-white/70">Ninguém vê os números de ninguém.</p>
      </div>
      <div className="space-y-3 p-5">
        <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5">
          <span className="min-w-0 flex-1 truncate text-sm text-[var(--muted)]">{link || "…"}</span>
          <button
            onClick={copy}
            disabled={!link}
            className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-[var(--accent-text)] hover:bg-[var(--surface-hover)]"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: "#1faa59" }}
          >
            WhatsApp
          </a>
          <button
            onClick={canShare ? share : copy}
            className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm font-medium hover:bg-[var(--surface-hover)]"
          >
            <Share2 className="h-4 w-4" />
            {canShare ? "Compartilhar" : "Copiar convite"}
          </button>
        </div>
      </div>
    </Card>
  );
}
