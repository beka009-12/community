import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ApiError, apiErrorMessage, nullIfNotFound, parseDrfErrors } from "./errors";
import { request, requestNoContent } from "./http";

const fetchMock = vi.fn<typeof fetch>();

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const failure = async (promise: Promise<unknown>): Promise<ApiError> => {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ApiError) return error;
    throw error;
  }
  throw new Error("expected the request to fail");
};

const item = z.object({ id: z.number() });

beforeEach(() => {
  vi.stubEnv("API_URL", "http://api.test/ru/");
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe("request", () => {
  it("GETs base + path and validates the body", async () => {
    fetchMock.mockResolvedValue(json({ id: 1, extra: true }));
    await expect(request("/stats/", item)).resolves.toEqual({ id: 1 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://api.test/ru/stats/");
    expect(init?.method).toBe("GET");
    expect(init?.redirect).toBe("manual");
    expect(new Headers(init?.headers).get("Authorization")).toBeNull();
  });

  it("sends JSON bodies and the bearer token", async () => {
    fetchMock.mockResolvedValue(json({ id: 2 }, 201));
    await request("/teams/", item, { method: "POST", body: { team_name: "A" }, token: "t0k" });
    const [, init] = fetchMock.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe("Bearer t0k");
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(init?.body).toBe('{"team_name":"A"}');
  });

  it("passes Next cache options through", async () => {
    fetchMock.mockResolvedValue(json({ id: 3 }));
    await request("/members/", item, { next: { revalidate: 60, tags: ["members"] } });
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      next: { revalidate: 60, tags: ["members"] },
    });
  });

  it("maps DRF 400 bodies to field errors and a form message", async () => {
    fetchMock.mockResolvedValue(
      json({ email: ["Введите правильный адрес."], non_field_errors: ["Проверьте данные."] }, 400),
    );
    const error = await failure(request("/client-requests/", item, { method: "POST", body: {} }));
    expect(error.kind).toBe("validation");
    expect(error.fieldErrors).toEqual({ email: "Введите правильный адрес." });
    expect(apiErrorMessage(error)).toBe("Проверьте данные.");
  });

  it.each([
    [401, "unauthorized"],
    [403, "forbidden"],
    [404, "not_found"],
    [500, "unavailable"],
    [502, "unavailable"],
  ] as const)("maps %i to %s", async (status, kind) => {
    fetchMock.mockResolvedValue(json({ detail: "x" }, status));
    expect((await failure(request("/teams/", item))).kind).toBe(kind);
  });

  it("treats a redirect as a blocked endpoint", async () => {
    fetchMock.mockResolvedValue(
      new Response(null, { status: 302, headers: { Location: "/ru/admin/login/" } }),
    );
    expect((await failure(request("/admin/members/", item))).kind).toBe("redirected");
  });

  it("turns network failures and timeouts into unavailable", async () => {
    fetchMock.mockRejectedValueOnce(new DOMException("The operation timed out.", "TimeoutError"));
    expect((await failure(request("/stats/", item))).kind).toBe("unavailable");
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    expect((await failure(request("/stats/", item))).kind).toBe("unavailable");
  });

  it("rejects non-JSON and off-schema bodies", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    fetchMock.mockResolvedValueOnce(new Response("<html></html>", { status: 200 }));
    expect((await failure(request("/stats/", item))).kind).toBe("bad_response");
    fetchMock.mockResolvedValueOnce(json({ id: "1" }));
    expect((await failure(request("/stats/", item))).kind).toBe("bad_response");
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it("accepts 204 for no-content calls", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(requestNoContent("/teams/1/", { method: "DELETE", token: "t" })).resolves.toBeUndefined();
  });

  it("fails clearly when API_URL is missing", async () => {
    vi.stubEnv("API_URL", "");
    expect((await failure(request("/stats/", item))).kind).toBe("unavailable");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("errors", () => {
  it("reads DRF detail and nested messages", () => {
    expect(parseDrfErrors({ detail: "Нет доступа" })).toEqual({ message: "Нет доступа", fieldErrors: {} });
    expect(parseDrfErrors({ members: [{ user: ["Неверный id"] }] }).fieldErrors).toEqual({
      members: "Неверный id",
    });
  });

  it("gives every kind a Russian message", () => {
    expect(apiErrorMessage(new ApiError("unavailable", 0, "x"))).toMatch(/Сервер недоступен/);
    expect(apiErrorMessage(new ApiError("validation", 400, ""))).toBe("Проверьте поля формы.");
  });

  it("nullIfNotFound turns only 404 into null", async () => {
    await expect(nullIfNotFound(Promise.reject(new ApiError("not_found", 404, "x")))).resolves.toBeNull();
    const forbidden = new ApiError("forbidden", 403, "x");
    await expect(nullIfNotFound(Promise.reject(forbidden))).rejects.toBe(forbidden);
  });
});
