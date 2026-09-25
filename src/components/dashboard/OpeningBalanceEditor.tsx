"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

export function OpeningBalanceEditor({ month, value }: { month: string; value: number }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value || ""));
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/months/${month}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openingBalance: Number(draft.replace(",", ".")) || 0 }),
    });
    setSaving(false);
    if (res.ok) {
      setEditing(false);
      router.refresh();
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(String(value || ""));
          setEditing(true);
        }}
        className="mt-3 flex items-center gap-1.5 text-xs text-white/70 hover:text-white"
      >
        Valor na conta no início do mês: <span className="font-medium tabular-nums">{formatCurrency(value)}</span>
        <Pencil className="h-3 w-3" />
      </button>
    );
  }

  return (
    <form onSubmit={save} className="mt-3 flex items-center gap-2 text-xs text-white/80">
      <label htmlFor="opening-balance">Valor na conta: R$</label>
      <input
        id="opening-balance"
        type="number"
        step="0.01"
        inputMode="decimal"
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="w-28 rounded-lg bg-white/15 px-2 py-1 text-sm text-white outline-none placeholder:text-white/50 focus:bg-white/25"
        placeholder="0,00"
      />
      <button
        type="submit"
        disabled={saving}
        aria-label="Salvar valor na conta"
        className="rounded-lg bg-white/20 p-1.5 hover:bg-white/30"
      >
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
      </button>
    </form>
  );
}
