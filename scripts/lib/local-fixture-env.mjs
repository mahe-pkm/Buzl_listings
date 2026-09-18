import fs from "node:fs";
import path from "node:path";

/**
 * Load credentials exclusively from the ignored local fixture file for local
 * test tooling. Next.js does not read this file and no value is logged.
 */
export function loadLocalFixtureEnvironment({ optional = false } = {}) {
  const fixturePath = path.resolve(".env.fixtures.local");
  if (!fs.existsSync(fixturePath)) {
    if (optional) return;
    throw new Error(".env.fixtures.local is required for local fixture tooling");
  }

  for (const rawLine of fs.readFileSync(fixturePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator <= 0) continue;

    const name = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) && process.env[name] === undefined) {
      process.env[name] = value;
    }
  }
}
