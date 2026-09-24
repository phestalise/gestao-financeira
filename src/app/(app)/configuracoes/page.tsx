import { getProfile } from "@/lib/firebase/profile";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const profile = await getProfile();

  return (
    <div className="mx-auto max-w-xl px-4 pb-8 pt-[max(env(safe-area-inset-top),1.5rem)] sm:px-8 sm:pt-10">
      <h1 className="mb-1 text-xl font-semibold tracking-tight">Configurações</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">Ajuste sua renda e metas para deixar os cálculos mais precisos.</p>

      <Card className="mb-4 flex items-center justify-between p-5">
        <div>
          <p className="text-sm font-medium">Aparência</p>
          <p className="text-xs text-[var(--muted)]">Escolha como o app aparece para você.</p>
        </div>
        <ThemeToggle />
      </Card>

      <ProfileForm profile={profile} />
    </div>
  );
}
