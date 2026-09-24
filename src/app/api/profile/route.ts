import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProfile, saveProfile } from "@/lib/firebase/profile";

const profileInputSchema = z.object({
  name: z.string().max(60).optional(),
  income: z.number().nonnegative().optional(),
  savingsGoalPercent: z.number().min(0).max(100).optional(),
  onboardingComplete: z.boolean().optional(),
});

export async function GET() {
  const profile = await getProfile();
  return NextResponse.json({ profile });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const result = profileInputSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const profile = await saveProfile(result.data);
  return NextResponse.json({ profile });
}
