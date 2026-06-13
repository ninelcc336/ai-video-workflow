import { readFile } from "node:fs/promises";
import path from "node:path";

const ACTIVE_VIDEO_CONFIG_PATH = path.join("data", "videos", "active-video.json");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export async function loadActiveVideoPath(rootDir) {
  const absolutePath = path.join(rootDir, ACTIVE_VIDEO_CONFIG_PATH);
  const raw = await readFile(absolutePath, "utf8");
  const parsed = JSON.parse(raw);
  const videoConfig = parsed?.videoConfig;

  assert(typeof videoConfig === "string" && videoConfig.length > 0, "`videoConfig` must be a non-empty string.");

  if (videoConfig.startsWith("/")) {
    return videoConfig.slice(1).replaceAll("/", path.sep);
  }

  return videoConfig;
}
