import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { getDb } from "@/lib/firebase/admin";

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

// Quem já usava o app antes do cadastro existir tem os dados em users/default-user. Esse espaço
// não é herdado pelo cadastro do site, que não confirma o e-mail: qualquer um poderia se cadastrar
// com OWNER_EMAIL e levar os dados. A conta do dono é ligada a ele por scripts/reset-password.cjs.
function isOwnerEmail(email: string): boolean {
  const owner = process.env.OWNER_EMAIL;
  return !!owner && normalizeEmail(owner) === email;
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
  if (isOwnerEmail(email)) throw new EmailTakenError();
  const account: Account = {
    uid: getDb().collection("users").doc().id,
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
