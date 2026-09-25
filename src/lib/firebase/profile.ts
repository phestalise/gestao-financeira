import { currentUserDoc } from "@/lib/firebase/admin";
import { UserProfile } from "@/types";

const DEFAULT_PROFILE: UserProfile = {
  income: 0,
  savingsGoalPercent: 20,
  onboardingComplete: false,
};

export async function getProfile(): Promise<UserProfile> {
  const doc = await (await currentUserDoc()).get();
  if (!doc.exists) return DEFAULT_PROFILE;
  return { ...DEFAULT_PROFILE, ...doc.data() } as UserProfile;
}

export async function saveProfile(data: Partial<UserProfile>): Promise<UserProfile> {
  await (await currentUserDoc()).set(data, { merge: true });
  return getProfile();
}
