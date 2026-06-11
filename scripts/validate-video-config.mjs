import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadVideoConfig } from "./video-config.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

async function main() {
  const fileArg = process.argv[2];
  if (!fileArg) {
    throw new Error("Usage: node scripts/validate-video-config.mjs <path-to-video.json>");
  }
  const { absolutePath } = await loadVideoConfig(rootDir, fileArg);
  console.log(`Config valid: ${absolutePath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
