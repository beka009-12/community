import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClientRequest } from "./client-requests";

vi.mock("./client", () => ({ authedGet: vi.fn(), authedSend: vi.fn() }));

const fetchMock = vi.fn<typeof fetch>();

const data = {
  name: "Айбек",
  company: "Склад-Сервис",
  email: "aibek@company.kg",
  phone: "+996 555 123 456",
  title: "CRM для склада",
  description: "Нужна система учёта остатков на складе.",
  project_type: "Веб-системы",
  budget: null,
};

beforeEach(() => {
  vi.stubEnv("API_URL", "http://api.test/ru");
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe("createClientRequest", () => {
  it("treats any 2xx answer as saved, whatever its body", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ name: "Айбек" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    await expect(createClientRequest(data)).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "POST", body: JSON.stringify(data) });
  });
});
