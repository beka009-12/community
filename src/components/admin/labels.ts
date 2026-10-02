import type {
  MembershipRole,
  RequestStatus,
  Role,
  UserStatus,
} from "@/src/server/db/types";
import type { BadgeTone } from "./ui/StatusBadge";

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Админ",
  TEAM_LEAD: "Тимлид",
  DEVELOPER: "Разработчик",
};

export const MEMBERSHIP_LABELS: Record<MembershipRole, string> = {
  TEAM_LEAD: "Тимлид",
  DEVELOPER: "Разработчик",
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: "Активен",
  INACTIVE: "Неактивен",
};

export const USER_STATUS_TONE: Record<UserStatus, BadgeTone> = {
  ACTIVE: "positive",
  INACTIVE: "muted",
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  NEW: "Новая",
  REVIEWING: "На рассмотрении",
  ACCEPTED: "Принята",
  IN_PROGRESS: "В работе",
  COMPLETED: "Завершена",
  REJECTED: "Отклонена",
};

export const REQUEST_STATUS_TONE: Record<RequestStatus, BadgeTone> = {
  NEW: "accent",
  REVIEWING: "neutral",
  ACCEPTED: "positive",
  IN_PROGRESS: "accent",
  COMPLETED: "positive",
  REJECTED: "danger",
};

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
