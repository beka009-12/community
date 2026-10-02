import "server-only";
import { randomUUID } from "node:crypto";
import { mutateDb, readDb } from "@/src/server/db/store";
import type { DbClientRequest, RequestStatus } from "@/src/server/db/types";
import { NotFoundError } from "./errors";

export type ClientRequestInput = Omit<DbClientRequest, "id" | "status" | "createdAt">;

// Stored newest first, so listing needs no sort.
export async function createClientRequest(
  input: ClientRequestInput,
): Promise<DbClientRequest> {
  return mutateDb((db) => {
    const request: DbClientRequest = {
      ...input,
      id: randomUUID(),
      status: "NEW",
      createdAt: new Date().toISOString(),
    };
    db.clientRequests.unshift(request);
    return request;
  });
}

export async function listClientRequests(
  status?: RequestStatus,
): Promise<DbClientRequest[]> {
  const { clientRequests } = await readDb();
  return status ? clientRequests.filter((item) => item.status === status) : clientRequests;
}

export async function getClientRequest(id: string): Promise<DbClientRequest | null> {
  const { clientRequests } = await readDb();
  return clientRequests.find((item) => item.id === id) ?? null;
}

export async function setClientRequestStatus(
  id: string,
  status: RequestStatus,
): Promise<void> {
  await mutateDb((db) => {
    const request = db.clientRequests.find((item) => item.id === id);
    if (!request) throw new NotFoundError("Заявка не найдена");
    request.status = status;
  });
}
