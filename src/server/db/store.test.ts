import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { mutateDb, readDb, StoreError } from "./store";

let dir: string;
let file: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "mc-db-"));
  file = path.join(dir, "db.json");
  process.env.DB_FILE = file;
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("store", () => {
  it("seeds a missing file", async () => {
    const db = await readDb();
    expect(db.users.length).toBeGreaterThan(0);
    const onDisk = JSON.parse(await readFile(file, "utf8")) as typeof db;
    expect(onDisk.users).toHaveLength(db.users.length);
  });

  it("keeps both of two concurrent writes", async () => {
    await readDb();
    await Promise.all([
      mutateDb((db) => {
        db.teams.push({ id: "a", name: "A", description: "", createdAt: "" });
      }),
      mutateDb((db) => {
        db.teams.push({ id: "b", name: "B", description: "", createdAt: "" });
      }),
    ]);
    const ids = (await readDb()).teams.map((team) => team.id);
    expect(ids).toEqual(expect.arrayContaining(["a", "b"]));
  });

  it("throws StoreError on corrupt JSON and leaves the file alone", async () => {
    await writeFile(file, "{not json", "utf8");
    await expect(readDb()).rejects.toBeInstanceOf(StoreError);
    expect(await readFile(file, "utf8")).toBe("{not json");
  });
});
