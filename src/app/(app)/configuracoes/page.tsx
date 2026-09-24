import { getProfile } from "@/lib/firebase/profile";
import { ProfileForm } from "@/components/settings/ProfileForm";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const profile = await getProfile();

  return (
    <div className="mx-auto max-w-xl px-4 pt-6 sm:px-8 sm:pt-10">
      <h1 className="mb-1 text-xl font-semibold">Configurações</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">Ajuste sua renda e metas para deixar os cálculos mais precisos.</p>
      <ProfileForm profile={profile} />
    </div>
  );
}
