import type { Metadata } from "next";
import { Landing } from "@/components/landing/Landing";
import { getOptionalUserId } from "@/lib/auth/current-user";

export const metadata: Metadata = {
  title: "Meu Dinheiro · seu dinheiro conta uma história",
  description:
    "Controle financeiro pessoal com IA. Escreva do seu jeito, a IA organiza e te conta o que está acontecendo com o seu mês.",
};

export default async function HomePage() {
  const uid = await getOptionalUserId().catch(() => null);
  return <Landing loggedIn={Boolean(uid)} />;
}
