/**
 * Frameworks & Drivers: two implementations of the `ResultLog` output boundary.
 *
 * This is the outermost circle — the only place in this folder tree allowed to
 * know about `node:fs`. Neither implementation is exported from the package;
 * `tsconfig.json` keeps `src/tests/` out of `dist/`. A production driver would
 * live in `plugins/`, built exactly the same way.
 *
 * Read these next to `ports/outbound/result.log.port.ts` to see the payoff: the
 * use case in `app/geometry.ts` works with either one and can tell them apart
 * only by what ends up on disk.
 */

import { readFile, unlink, writeFile } from "node:fs/promises";

import type {
  CalculationRecord,
  ResultLog,
} from "../ports/outbound/result.log.port.js";

/** A `ResultLog` backed by a JSON file, plus the extras a test needs. */
export interface FileResultLog extends ResultLog {
  /** Absolute path being written. */
  readonly path: string;
  /** Reads the file back. Deliberately *not* part of the port. */
  readonly readLast: () => Promise<CalculationRecord | undefined>;
  /** Removes the file if it exists. */
  readonly clear: () => Promise<void>;
}

/**
 * Writes the last result to a file under `/tmp`.
 *
 * @param path - file to write; defaults to a shared location under `/tmp`
 */
export function createTmpFileResultLog(
  path = "/tmp/webapp-platform-last-result.json",
): FileResultLog {
  return {
    path,

    recordLast: async (entry) => {
      await writeFile(path, `${JSON.stringify(entry, null, 2)}\n`, "utf8");
    },

    readLast: async () => {
      try {
        return JSON.parse(await readFile(path, "utf8")) as CalculationRecord;
      } catch {
        return undefined;
      }
    },

    clear: async () => {
      await unlink(path).catch(() => undefined);
    },
  };
}

/** A `ResultLog` that keeps every entry in memory, for assertions. */
export interface FakeResultLog extends ResultLog {
  /** Everything recorded so far, oldest first. */
  readonly entries: readonly CalculationRecord[];
}

/**
 * The cheapest possible driver. Proves the use case never needed a filesystem
 * — only something that satisfies the contract.
 */
export function createFakeResultLog(): FakeResultLog {
  const entries: CalculationRecord[] = [];

  return {
    entries,
    recordLast: async (entry) => {
      entries.push(entry);
    },
  };
}

/** A driver whose write always fails, to show the rejection propagating. */
export function createFailingResultLog(message = "disk on fire"): ResultLog {
  return {
    recordLast: () => Promise.reject(new Error(message)),
  };
}
