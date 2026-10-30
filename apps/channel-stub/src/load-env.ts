import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../..");

for (const file of [".env", ".env.local"]) {
  const path = resolve(repoRoot, file);
  if (existsSync(path)) {
    config({ path });
  }
}
