import { getProfile } from "@/lib/firebase/profile";
import { listRecurring } from "@/lib/firebase/recurring";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { RecurringExpensesForm } from "@/components/settings/RecurringExpensesForm";
import { InviteCard } from "@/components/settings/InviteCard";
import { LogoutButton } from "@/components/settings/LogoutButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ bemvindo?: string }>;
}

export default async function ConfiguracoesPage({ searchParams }: Props) {
  const [{ bemvindo }, profile, recurring] = await Promise.all([searchParams, getProfile(), listRecurring()]);

  return (
    <div className="mx-auto max-w-xl px-4 pb-8 pt-[max(env(safe-area-inset-top),1.5rem)] sm:px-8 sm:pt-10">
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
          <p className="mb-6 text-sm text-[var(--muted)]">Ajuste sua renda e metas para deixar os cálculos mais precisos.</p>
        </>
      )}

      <ProfileForm profile={profile} />
      <RecurringExpensesForm recurring={recurring} />

      <div className="mt-4">
        <InviteCard name={profile.name} />
      </div>

      <Card className="mb-4 flex items-center justify-between p-5">
        <div>
          <p className="text-sm font-medium">Aparência</p>
          <p className="text-xs text-[var(--muted)]">Escolha como o app aparece para você.</p>
        </div>
        <ThemeToggle />
      </Card>

      <Card className="flex items-center justify-between p-5">
        <div className="min-w-0">
          <p className="text-sm font-medium">Sua conta</p>
          <p className="truncate text-xs text-[var(--muted)]">{profile.email ?? "Conectado"}</p>
        </div>
        <LogoutButton />
      </Card>
    </div>
  );
}
