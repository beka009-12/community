import { afterEach, beforeEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

// Each test gets a fresh seeded store in a temp dir.
export function setupTempDb(): void {
  let dir = "";
  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "mc-repo-"));
    process.env.DB_FILE = path.join(dir, "db.json");
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });
}
