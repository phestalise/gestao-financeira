import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { getDb, LEGACY_OWNER_ID } from "@/lib/firebase/admin";

const scrypt = promisify(scryptCb) as (password: string, salt: string, keylen: number) => Promise<Buffer>;

// Contas ficam em logins/{email}: o id do documento garante e-mail único, e o uid aponta
// para users/{uid}, onde estão os dados financeiros daquela pessoa.
export interface Account {
  uid: string;
  email: string;
  name: string;
  passwordHash: string;
  invitedBy?: string;
  createdAt: string;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function loginRef(email: string) {
  return getDb().collection("logins").doc(normalizeEmail(email));
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${hash.toString("hex")}`;
}

async function checkPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = await scrypt(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}

// Quem já usava o app antes do cadastro existir tem os dados em users/default-user.
// O e-mail em OWNER_EMAIL herda esse espaço ao criar a conta.
function uidForNewAccount(email: string): string {
  const owner = process.env.OWNER_EMAIL;
  if (owner && normalizeEmail(owner) === email) return LEGACY_OWNER_ID;
  return getDb().collection("users").doc().id;
}

export class EmailTakenError extends Error {
  constructor() {
    super("Esse e-mail já tem conta.");
  }
}

export async function createAccount(input: {
  name: string;
  email: string;
  password: string;
  invitedBy?: string;
}): Promise<Account> {
  const email = normalizeEmail(input.email);
  const account: Account = {
    uid: uidForNewAccount(email),
    email,
    name: input.name.trim(),
    passwordHash: await hashPassword(input.password),
    createdAt: new Date().toISOString(),
    ...(input.invitedBy ? { invitedBy: input.invitedBy.trim().slice(0, 60) } : {}),
  };

  try {
    // create() falha se o documento já existe, então dois cadastros simultâneos não colidem.
    await loginRef(email).create(account);
  } catch (err) {
    if ((err as { code?: number }).code === 6) throw new EmailTakenError(); // ALREADY_EXISTS
    throw err;
  }

  await getDb()
    .collection("users")
    .doc(account.uid)
    .set({ name: account.name, email }, { merge: true });

  return account;
}

export async function authenticate(email: string, password: string): Promise<Account | null> {
  const doc = await loginRef(email).get();
  if (!doc.exists) {
    // Gasta o mesmo tempo de um login real, para não revelar quais e-mails têm conta.
    await hashPassword(password);
    return null;
  }
  const account = doc.data() as Account;
  return (await checkPassword(password, account.passwordHash)) ? account : null;
}
