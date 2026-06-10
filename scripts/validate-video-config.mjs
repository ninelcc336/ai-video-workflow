import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const REQUIRED_AXES = ["信息", "机动", "压制", "生存", "功能", "难度"];
const REQUIRED_ANIMATIONS = ["characterEnter", "radarBuild", "transition"];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function validateScores(scores) {
  assert(scores && typeof scores === "object", "`scores` must be an object.");
  const keys = Object.keys(scores);
  assert(keys.length === REQUIRED_AXES.length, "`scores` must contain exactly 6 axes.");

  for (const axis of REQUIRED_AXES) {
    assert(axis in scores, `Missing score axis: ${axis}`);
    const value = Number(scores[axis]);
    assert(Number.isFinite(value), `Score for ${axis} must be numeric.`);
    assert(value >= 0 && value <= 10, `Score for ${axis} must be between 0 and 10.`);
  }
}

function validateConfig(config) {
  assert(config && typeof config === "object", "Config root must be an object.");
  assert(config.meta && typeof config.meta === "object", "Missing `meta`.");
  assert(config.theme && typeof config.theme === "object", "Missing `theme`.");
  assert(config.animation && typeof config.animation === "object", "Missing `animation`.");
  assert(Array.isArray(config.items) && config.items.length > 0, "`items` must be a non-empty array.");

  assert(typeof config.meta.title === "string" && config.meta.title.length > 0, "`meta.title` is required.");
  assert(Number(config.meta.durationPerItem) > 0, "`meta.durationPerItem` must be positive.");

  assert(Array.isArray(config.theme.radarAxes), "`theme.radarAxes` must be an array.");
  assert(
    JSON.stringify(config.theme.radarAxes) === JSON.stringify(REQUIRED_AXES),
    "`theme.radarAxes` must match the fixed 6-axis order."
  );

  for (const animationKey of REQUIRED_ANIMATIONS) {
    assert(
      typeof config.animation[animationKey] === "string" && config.animation[animationKey].length > 0,
      `Missing animation option: ${animationKey}`
    );
  }

  for (const item of config.items) {
    assert(typeof item.id === "string" && item.id.length > 0, "Each item requires `id`.");
    assert(typeof item.name === "string" && item.name.length > 0, `Item ${item.id} requires \`name\`.`);
    assert(typeof item.image === "string" && item.image.length > 0, `Item ${item.id} requires \`image\`.`);
    validateScores(item.scores);
  }
}

async function main() {
  const fileArg = process.argv[2];
  assert(fileArg, "Usage: node scripts/validate-video-config.mjs <path-to-video.json>");
  const absolutePath = path.resolve(rootDir, fileArg);
  const raw = await readFile(absolutePath, "utf8");
  const config = JSON.parse(raw);
  validateConfig(config);
  console.log(`Config valid: ${absolutePath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

