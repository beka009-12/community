import "server-only";
import { cache } from "react";
import { z } from "zod";
import type { RequestStatus } from "@/src/lib/api-enums";
import { authedGet, authedSend } from "./client";
import { nullIfNotFound } from "./errors";
import { requestNoContent } from "./http";
import {
  clientRequestDetailSchema,
  clientRequestListItemSchema,
  listOf,
  type ClientRequestDetail,
  type ClientRequestListItem,
} from "./schemas";

export interface ClientRequestWrite {
  name: string;
  company: string;
  email: string;
  phone: string;
  title: string;
  description: string;
  project_type: string;
  budget: number | null;
}

// Clients have no account, so this one goes out without a token. Any 2xx
// means saved: the response body isn't needed, and its shape is unverified.
export async function createClientRequest(data: ClientRequestWrite): Promise<void> {
  await requestNoContent("/client-requests/", { method: "POST", body: data, cache: "no-store" });
}

export const getClientRequests = cache(
  (): Promise<ClientRequestListItem[]> =>
    authedGet("/client-requests/", listOf(clientRequestListItemSchema)),
);

export const getClientRequest = cache(
  (id: number): Promise<ClientRequestDetail | null> =>
    nullIfNotFound(authedGet(`/client-requests/${id}/`, clientRequestDetailSchema)),
);

export async function setClientRequestStatus(id: number, status: RequestStatus): Promise<void> {
  await authedSend("PATCH", `/client-requests/${id}/`, { status }, z.unknown());
}
