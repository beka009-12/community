import { describe, expect, it } from "vitest";
import { setupTempDb } from "./test-db";
import {
  createClientRequest,
  getClientRequest,
  listClientRequests,
  setClientRequestStatus,
} from "./requests";

setupTempDb();

describe("client requests repository", () => {
  it("creates NEW requests and lists newest first, filtered by status", async () => {
    const a = await createClientRequest({ name: "A", email: "a@a.kg", title: "A", description: "d" });
    const b = await createClientRequest({ name: "B", email: "b@b.kg", title: "B", description: "d" });
    expect(a.status).toBe("NEW");
    expect((await listClientRequests()).map((r) => r.id)).toEqual([b.id, a.id]);
    await setClientRequestStatus(a.id, "REVIEWING");
    expect((await listClientRequests("NEW")).map((r) => r.id)).toEqual([b.id]);
    expect((await getClientRequest(a.id))?.status).toBe("REVIEWING");
  });
});
