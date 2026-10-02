import "server-only";
import { randomUUID } from "node:crypto";
import { hashPassword } from "@/src/server/auth/password";
import { mutateDb, readDb } from "@/src/server/db/store";
import type {
  Db,
  DbProfile,
  DbUser,
  MembershipRole,
  UserStatus,
} from "@/src/server/db/types";
import { ConflictError, NotFoundError } from "./errors";

export interface AdminMember {
  user: DbUser;
  profile: DbProfile;
}

export interface MemberInput {
  login: string;
  role: MembershipRole;
  firstName: string;
  lastName: string;
  specializationId: string;
  roleTitle: string;
  stack: string;
  bio: string;
  skills: string[];
  github?: string;
  linkedin?: string;
  portfolio?: string;
  photo?: string;
}

const PLACEHOLDER_PHOTO = "/team/placeholder-1.webp";

export const joinMember = (db: Db, userId: string): AdminMember | null => {
  const user = db.users.find((item) => item.id === userId);
  const profile = db.profiles.find((item) => item.userId === userId);
  return user && profile ? { user, profile } : null;
};

// A login is taken if another user has it as their login OR as their id:
// ids come from the original login and never change (they're in public
// URLs), so a renamed member still owns their old login as an id.
const assertLoginFree = (db: Db, login: string, exceptId?: string) => {
  const wanted = login.toLowerCase();
  const taken = db.users.some(
    (user) =>
      user.id !== exceptId &&
      (user.login.toLowerCase() === wanted || user.id === wanted),
  );
  if (taken) throw new ConflictError("login", "Логин уже занят");
};

const toProfile = (userId: string, input: MemberInput, base?: DbProfile): DbProfile => ({
  userId,
  firstName: input.firstName,
  lastName: input.lastName,
  photo: input.photo ?? base?.photo ?? PLACEHOLDER_PHOTO,
  bio: input.bio,
  specializationId: input.specializationId,
  roleTitle: input.roleTitle,
  stack: input.stack,
  skills: input.skills,
  github: input.github,
  linkedin: input.linkedin,
  portfolio: input.portfolio,
  resume: base?.resume,
  experience: base?.experience ?? [],
  education: base?.education ?? [],
});

export async function listMembers(): Promise<AdminMember[]> {
  const db = await readDb();
  return db.users
    .map((user) => joinMember(db, user.id))
    .filter((member): member is AdminMember => member !== null);
}

export async function getMember(id: string): Promise<AdminMember | null> {
  return joinMember(await readDb(), id);
}

export async function createMember(
  input: MemberInput & { password: string },
): Promise<AdminMember> {
  const passwordHash = await hashPassword(input.password);
  const login = input.login.toLowerCase();
  return mutateDb((db) => {
    assertLoginFree(db, login);
    const user: DbUser = {
      id: login,
      login,
      passwordHash,
      role: input.role,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    };
    const profile = toProfile(user.id, input);
    db.users.push(user);
    db.profiles.push(profile);
    return { user, profile };
  });
}

// The id never changes (it's in public URLs); only the login can.
export async function updateMember(
  id: string,
  input: MemberInput,
): Promise<AdminMember> {
  const login = input.login.toLowerCase();
  return mutateDb((db) => {
    const current = joinMember(db, id);
    if (!current) throw new NotFoundError("Участник не найден");
    assertLoginFree(db, login, id);
    current.user.login = login;
    current.user.role = input.role;
    const profile = toProfile(id, input, current.profile);
    db.profiles = db.profiles.map((item) => (item.userId === id ? profile : item));
    return { user: current.user, profile };
  });
}

// Profile fields a member fills in themselves (ТЗ: Developer edits own
// profile). Admin edits are allowed but leave a notification behind.
export type MemberProfileInput = Omit<MemberInput, "login" | "role" | "photo">;

const PROFILE_FIELDS: (keyof MemberProfileInput)[] = [
  "firstName",
  "lastName",
  "specializationId",
  "roleTitle",
  "stack",
  "bio",
  "skills",
  "github",
  "linkedin",
  "portfolio",
];

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

export async function updateMemberProfileByAdmin(
  id: string,
  input: MemberProfileInput,
): Promise<string[]> {
  return mutateDb((db) => {
    const current = joinMember(db, id);
    if (!current) throw new NotFoundError("Участник не найден");
    const changed = PROFILE_FIELDS.filter((field) => !same(current.profile[field], input[field]));
    if (changed.length === 0) return changed;

    const profile = toProfile(id, { ...input, login: current.user.login, role: current.user.role }, current.profile);
    db.profiles = db.profiles.map((item) => (item.userId === id ? profile : item));
    db.notifications.unshift({
      id: randomUUID(),
      userId: id,
      kind: "PROFILE_EDITED_BY_ADMIN",
      fields: changed,
      createdAt: new Date().toISOString(),
    });
    return changed;
  });
}

export async function setMemberRole(id: string, role: MembershipRole): Promise<void> {
  await mutateDb((db) => {
    const user = db.users.find((item) => item.id === id);
    if (!user) throw new NotFoundError("Участник не найден");
    user.role = role;
  });
}

export async function setMemberStatus(id: string, status: UserStatus): Promise<void> {
  await mutateDb((db) => {
    const user = db.users.find((item) => item.id === id);
    if (!user) throw new NotFoundError("Участник не найден");
    user.status = status;
  });
}

export async function resetMemberPassword(id: string, password: string): Promise<void> {
  const passwordHash = await hashPassword(password);
  await mutateDb((db) => {
    const user = db.users.find((item) => item.id === id);
    if (!user) throw new NotFoundError("Участник не найден");
    user.passwordHash = passwordHash;
  });
}
