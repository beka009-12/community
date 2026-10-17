import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/media/[...path]/route";
import { toMediaPath } from "./media";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubEnv("API_URL", "http://api.test/ru");
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe("toMediaPath", () => {
  it("routes API media through our own /media path", () => {
    expect(toMediaPath("http://api.test/media/avatars/a.png")).toBe("/media/avatars/a.png");
    expect(toMediaPath("/media/projects/p.webp")).toBe("/media/projects/p.webp");
    expect(toMediaPath("media/cv/c.pdf")).toBe("/media/cv/c.pdf");
  });

  it("keeps external https media and drops everything else", () => {
    expect(toMediaPath("https://cdn.example.com/a.png")).toBe("https://cdn.example.com/a.png");
    expect(toMediaPath("http://other.example.com/a.png")).toBeNull();
    expect(toMediaPath("http://api.test/ru/admin/")).toBeNull();
    expect(toMediaPath("/media/../ru/admin/")).toBeNull();
    expect(toMediaPath("javascript:alert(1)")).toBeNull();
    expect(toMediaPath("")).toBeNull();
    expect(toMediaPath(null)).toBeNull();
  });
});

const call = (path: string[]) =>
  GET(new Request("http://localhost/media/x"), { params: Promise.resolve({ path }) });

describe("GET /media/[...path]", () => {
  it("streams images from the API host with safe headers", async () => {
    fetchMock.mockResolvedValue(
      new Response("png-bytes", { status: 200, headers: { "Content-Type": "image/png" } }),
    );
    const response = await call(["avatars", "a b.png"]);
    expect(fetchMock.mock.calls[0][0]).toBe("http://api.test/media/avatars/a%20b.png");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(await response.text()).toBe("png-bytes");
  });

  it("never serves other content types or walks out of /media", async () => {
    fetchMock.mockResolvedValue(
      new Response("<script>", { status: 200, headers: { "Content-Type": "text/html" } }),
    );
    expect((await call(["evil.html"])).status).toBe(404);
    expect((await call(["..", "ru", "admin"])).status).toBe(404);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("answers 404 for missing files and 502 when the API is down", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 404 }));
    expect((await call(["gone.png"])).status).toBe(404);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    expect((await call(["a.png"])).status).toBe(502);
  });
});
