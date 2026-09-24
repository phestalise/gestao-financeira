import { getDb, OWNER_ID } from "@/lib/firebase/admin";
import { UserProfile } from "@/types";

const DEFAULT_PROFILE: UserProfile = {
  income: 0,
  savingsGoalPercent: 20,
  onboardingComplete: false,
};

function docRef() {
  return getDb().collection("users").doc(OWNER_ID);
}

export async function getProfile(): Promise<UserProfile> {
  const doc = await docRef().get();
  if (!doc.exists) return DEFAULT_PROFILE;
  return { ...DEFAULT_PROFILE, ...doc.data() } as UserProfile;
}

export async function saveProfile(data: Partial<UserProfile>): Promise<UserProfile> {
  await docRef().set(data, { merge: true });
  return getProfile();
}
