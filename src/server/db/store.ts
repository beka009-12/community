import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildSeed } from "./seed";
import type { Db } from "./types";

export class StoreError extends Error {}

// Read per call (not at import) so tests can point it at a temp file.
// turbopackIgnore: a runtime data file, not something to trace into the build.
const dbFile = () =>
  process.env.DB_FILE ??
  path.join(/* turbopackIgnore: true */ process.cwd(), "data", "db.json");

let queue: Promise<unknown> = Promise.resolve();

async function save(db: Db): Promise<void> {
  const file = dbFile();
  await mkdir(path.dirname(file), { recursive: true });
  // Write-then-rename: a crash mid-write never leaves a truncated store.
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await rename(tmp, file);
}

async function load(): Promise<Db> {
  let raw: string;
  try {
    raw = await readFile(dbFile(), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw new StoreError("Cannot read the store file", { cause: error });
    }
    const seed = await buildSeed();
    await save(seed);
    return seed;
  }
  try {
    return JSON.parse(raw) as Db;
  } catch (error) {
    throw new StoreError("The store file is not valid JSON", { cause: error });
  }
}

// One queue for reads and writes: a read never sees a half-applied
// mutation and two mutations never clobber each other.
function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

export const readDb = (): Promise<Db> => enqueue(load);

export const mutateDb = <T>(fn: (db: Db) => T): Promise<T> =>
  enqueue(async () => {
    const db = await load();
    const result = fn(db);
    await save(db);
    return result;
  });
