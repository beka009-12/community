import type {
  ProjectCategory,
  ProjectOrigin,
  ProjectStatus,
} from "@/src/data/projects";
import type { EducationEntry, ExperienceEntry } from "@/src/data/members";

export type Role = "ADMIN" | "TEAM_LEAD" | "DEVELOPER";
export type MembershipRole = "TEAM_LEAD" | "DEVELOPER";
export type UserStatus = "ACTIVE" | "INACTIVE";
export type RequestStatus =
  | "NEW"
  | "REVIEWING"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "REJECTED";

// The admin account lives in .env, never in the store.
export interface DbUser {
  id: string;
  login: string;
  passwordHash: string;
  role: Exclude<Role, "ADMIN">;
  status: UserStatus;
  createdAt: string;
}

export interface DbProfile {
  userId: string;
  firstName: string;
  lastName: string;
  photo: string;
  bio: string;
  specializationId: string;
  roleTitle: string;
  stack: string;
  skills: string[];
  github?: string;
  linkedin?: string;
  portfolio?: string;
  resume?: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
}

export interface DbTeam {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface DbTeamMember {
  teamId: string;
  userId: string;
  role: MembershipRole;
}

export interface DbProject {
  id: string;
  name: string;
  description: string;
  details: string;
  status: ProjectStatus;
  category: ProjectCategory;
  origin: ProjectOrigin;
  year: string;
  image: string;
  stack: string[];
  demoUrl?: string;
  githubUrl?: string;
  featured: boolean;
  createdAt: string;
}

export interface DbProjectMember {
  projectId: string;
  userId: string;
  role: MembershipRole;
}

export interface DbClientRequest {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  title: string;
  description: string;
  projectType?: ProjectCategory;
  budget?: string;
  status: RequestStatus;
  createdAt: string;
}

// Messages for a member (shown in their future dashboard). Today the
// only kind is "an admin edited your profile".
export interface DbNotification {
  id: string;
  userId: string;
  kind: "PROFILE_EDITED_BY_ADMIN";
  fields: string[];
  createdAt: string;
  readAt?: string;
}

export interface Db {
  users: DbUser[];
  profiles: DbProfile[];
  teams: DbTeam[];
  teamMembers: DbTeamMember[];
  projects: DbProject[];
  projectMembers: DbProjectMember[];
  clientRequests: DbClientRequest[];
  notifications: DbNotification[];
}
