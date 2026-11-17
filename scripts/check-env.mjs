// Fails the build when a privileged key is exposed through a NEXT_PUBLIC_ variable. Prints no secret values.
import { existsSync, readFileSync } from "node:fs";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const i = line.indexOf("=");
    if (i > 0 && !line.startsWith("#")) process.env[line.slice(0, i).trim()] ??= line.slice(i + 1).trim();
  }
}
const role = (key = "") => {
  if (key.startsWith("sb_secret_")) return "service_role";
  if (key.startsWith("sb_publishable_")) return "anon";
  try { return JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString()).role ?? "unknown"; } catch { return "unknown"; }
};
const problems = [];
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (publicKey && role(publicKey) !== "anon") problems.push(`NEXT_PUBLIC_SUPABASE_ANON_KEY holds a "${role(publicKey)}" key. It ships to browsers; use the project's anon/publishable key.`);
const serverAnon = process.env.SUPABASE_ANON_KEY;
if (serverAnon && role(serverAnon) !== "anon") problems.push(`SUPABASE_ANON_KEY holds a "${role(serverAnon)}" key; expected the anon key.`);
if (problems.length) { console.error("\nEnvironment check failed:\n - " + problems.join("\n - ") + "\n"); process.exit(1); }
console.log("Environment check passed.");
