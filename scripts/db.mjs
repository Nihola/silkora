// Usage: node scripts/db.mjs push|seed — runs Supabase CLI against SUPABASE_DB_URL using session mode (5432).
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

if (existsSync(".env.local")) for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const i = line.indexOf("=");
  if (i > 0 && !line.startsWith("#")) process.env[line.slice(0, i).trim()] ??= line.slice(i + 1).trim();
}
const url = process.env.SUPABASE_DB_URL?.replace(/:6543\//, ":5432/");
if (!url) { console.error("SUPABASE_DB_URL is not set."); process.exit(1); }
const args = process.argv[2] === "seed" ? ["db", "query", "--yes", "--db-url", url, "-f", "supabase/seed.sql"] : ["db", "push", "--yes", "--db-url", url];
process.exit(spawnSync("npx", ["supabase", ...args], { stdio: "inherit", shell: process.platform === "win32" }).status ?? 1);
