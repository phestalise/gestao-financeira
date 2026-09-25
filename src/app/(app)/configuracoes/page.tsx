import { getProfile } from "@/lib/firebase/profile";
import { listRecurring } from "@/lib/firebase/recurring";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { RecurringExpensesForm } from "@/components/settings/RecurringExpensesForm";
import { InviteCard } from "@/components/settings/InviteCard";
import { LogoutButton } from "@/components/settings/LogoutButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Card } from "@/components/ui/Card";
import { Palette } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ bemvindo?: string }>;
}

export default async function ConfiguracoesPage({ searchParams }: Props) {
  const [{ bemvindo }, profile, recurring] = await Promise.all([searchParams, getProfile(), listRecurring()]);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-8 pt-[max(env(safe-area-inset-top),1.5rem)] sm:px-8 sm:pt-10">
      {bemvindo ? (
        <div className="app-hero mb-6 overflow-hidden rounded-2xl p-5 text-white">
          <p className="text-2xl">👋</p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">
            Bem-vindo{profile.name ? `, ${profile.name.split(" ")[0]}` : ""}! Sua história começa aqui.
          </h1>
          <p className="mt-1 text-sm text-white/75">
            Informe sua renda mensal abaixo para o app calcular quanto sobra. Depois é só lançar os gastos, do seu jeito.
          </p>
        </div>
      ) : (
        <>
          <h1 className="mb-1 text-3xl font-semibold tracking-tight">
            Seus <span className="brand-serif brand-gradient pr-1">ajustes</span>
          </h1>
          <p className="mb-6 text-sm text-[var(--muted)]">Sua renda, metas e gastos fixos deixam os cálculos do painel certeiros.</p>
        </>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <ProfileForm profile={profile} />
          <RecurringExpensesForm recurring={recurring} />
        </div>

        <div className="space-y-4 lg:sticky lg:top-8">
          <Card className="flex items-center gap-3 p-5">
            <span className="app-hero flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white">
              {(profile.name ?? profile.email ?? "?").trim().charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{profile.name || "Sua conta"}</p>
              <p className="truncate text-xs text-[var(--muted)]">{profile.email ?? "Conectado"}</p>
            </div>
            <LogoutButton />
          </Card>

          <InviteCard name={profile.name} />

          <Card className="flex items-center justify-between gap-3 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--primary-soft)] text-[var(--accent-text)]">
                <Palette className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-sm font-medium">Aparência</p>
                <p className="text-xs text-[var(--muted)]">Claro ou escuro.</p>
              </div>
            </div>
            <ThemeToggle />
          </Card>
        </div>
      </div>
    </div>
  );
}
