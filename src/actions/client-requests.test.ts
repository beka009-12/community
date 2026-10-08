import { afterEach, describe, expect, it, vi } from "vitest";
import { updateTag } from "next/cache";
import { createClientRequest } from "@/src/server/api/client-requests";
import { ApiError } from "@/src/server/api/errors";
import { submitClientRequest } from "./client-requests";

vi.mock("next/cache", () => ({ updateTag: vi.fn() }));
vi.mock("@/src/server/api/client-requests", () => ({ createClientRequest: vi.fn() }));

const valid = {
  name: "Айбек",
  company: "Склад-Сервис",
  email: "aibek@company.kg",
  phone: "+996 555 123 456",
  title: "CRM для склада",
  description: "Нужна система учёта остатков на складе.",
  project_type: "Веб-системы",
};

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => data.set(key, value));
  return data;
};

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("submitClientRequest", () => {
  it("sends API field names and refreshes the stats", async () => {
    vi.mocked(createClientRequest).mockResolvedValue(undefined);
    await expect(submitClientRequest({}, form({ ...valid, budget: "150000" }))).resolves.toEqual({ ok: true });
    expect(createClientRequest).toHaveBeenCalledWith({ ...valid, budget: 150000 });
    expect(updateTag).toHaveBeenCalledWith("stats");
  });

  it("puts DRF field errors back onto the form", async () => {
    vi.mocked(createClientRequest).mockRejectedValue(
      new ApiError("validation", 400, "", { phone: "Неверный номер." }),
    );
    const state = await submitClientRequest({}, form({ ...valid, budget: "" }));
    expect(state.fieldErrors).toEqual({ phone: "Неверный номер." });
    expect(state.values?.name).toBe("Айбек");
  });

  it("keeps the brief when the API is down", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(createClientRequest).mockRejectedValue(new ApiError("unavailable", 0, "x"));
    const state = await submitClientRequest({}, form({ ...valid, budget: "" }));
    expect(state.error).toMatch(/Не удалось отправить заявку/);
    expect(state.values?.title).toBe("CRM для склада");
  });
});
