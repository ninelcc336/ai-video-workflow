import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadVideoConfig } from "./video-config.mjs";
import { loadActiveVideoPath } from "./active-video-config.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

async function main() {
  const fileArg = process.argv[2] || await loadActiveVideoPath(rootDir);
  const { absolutePath, template } = await loadVideoConfig(rootDir, fileArg);
  console.log(`Config valid: ${absolutePath} -> ${template.id}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
