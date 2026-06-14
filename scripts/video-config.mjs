import { readFile } from "node:fs/promises";
import path from "node:path";
import { loadTemplateById } from "./template-registry.mjs";

export const REQUIRED_AXES = ["信息", "机动", "压制", "生存", "功能", "难度"];
export const REQUIRED_ANIMATIONS = ["characterEnter", "radarBuild", "transition"];
const OPERATOR_IMAGE_MAP_PATH = path.join("data", "assets", "operator-image-map.json");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function validateScores(scores) {
  const radarScaleMax = Number(scores.__radarScaleMax || 10);
  const radarOverflowMax = Number(scores.__radarOverflowMax || radarScaleMax);
  assert(scores && typeof scores === "object", "`scores` must be an object.");
  const keys = Object.keys(scores);
  assert(keys.filter((key) => !key.startsWith("__")).length === REQUIRED_AXES.length, "`scores` must contain exactly 6 axes.");

  for (const axis of REQUIRED_AXES) {
    assert(axis in scores, `Missing score axis: ${axis}`);
    const value = Number(scores[axis]);
    assert(Number.isFinite(value), `Score for ${axis} must be numeric.`);
    assert(value >= 0 && value <= radarOverflowMax, `Score for ${axis} must be between 0 and ${radarOverflowMax}.`);
  }
}

function getRadarScaleConfig(theme) {
  const radarScaleMax = Number(theme?.radarScaleMax ?? 10);
  const radarOverflowMax = Number(theme?.radarOverflowMax ?? radarScaleMax);
  assert(Number.isFinite(radarScaleMax) && radarScaleMax > 0, "`theme.radarScaleMax` must be positive.");
  assert(Number.isFinite(radarOverflowMax) && radarOverflowMax >= radarScaleMax, "`theme.radarOverflowMax` must be >= `theme.radarScaleMax`.");
  return {
    radarScaleMax,
    radarOverflowMax
  };
}

function validateAudioConfig(audio) {
  if (audio == null) {
    return;
  }

  assert(audio && typeof audio === "object", "`audio` must be an object.");

  if (audio.bgm != null) {
    assert(typeof audio.bgm === "string", "`audio.bgm` must be a string.");
  }

  if (audio.volume != null) {
    const volume = Number(audio.volume);
    assert(Number.isFinite(volume) && volume >= 0 && volume <= 1, "`audio.volume` must be between 0 and 1.");
  }
}

function normalizeLookupKey(value) {
  return String(value || "").trim().toLowerCase();
}

function resolveItemImage(item, imageMap) {
  if (typeof item.image === "string" && item.image.length > 0) {
    return item.image;
  }

  const candidates = [item.imageKey, item.displayName, item.name];
  for (const candidate of candidates) {
    const lookupKey = normalizeLookupKey(candidate);
    if (!lookupKey) continue;
    if (imageMap[lookupKey]) {
      return imageMap[lookupKey];
    }
  }

  return "";
}

function normalizeImageMap(rawMap) {
  const normalized = {};
  for (const [key, value] of Object.entries(rawMap || {})) {
    normalized[normalizeLookupKey(key)] = value;
  }
  return normalized;
}

export function validateVideoConfig(config) {
  const template = arguments[1];
  assert(config && typeof config === "object", "Config root must be an object.");
  assert(typeof config.templateId === "string" && config.templateId.length > 0, "Missing `templateId`.");
  assert(config.meta && typeof config.meta === "object", "Missing `meta`.");
  assert(config.theme && typeof config.theme === "object", "Missing `theme`.");
  assert(config.animation && typeof config.animation === "object", "Missing `animation`.");
  assert(Array.isArray(config.items) && config.items.length > 0, "`items` must be a non-empty array.");
  validateAudioConfig(config.audio);

  assert(typeof config.meta.title === "string" && config.meta.title.length > 0, "`meta.title` is required.");
  assert(Number(config.meta.durationPerItem) > 0, "`meta.durationPerItem` must be positive.");

  assert(Array.isArray(config.theme.radarAxes), "`theme.radarAxes` must be an array.");
  const templateAxes = template?.constraints?.radarAxes || REQUIRED_AXES;
  assert(
    JSON.stringify(config.theme.radarAxes) === JSON.stringify(templateAxes),
    "`theme.radarAxes` must match the selected template axes."
  );
  assert(
    JSON.stringify(templateAxes) === JSON.stringify(REQUIRED_AXES),
    "Current renderer only supports the fixed 6-axis radar template family."
  );
  getRadarScaleConfig(config.theme);

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
    item.scores.__radarScaleMax = Number(config.theme.radarScaleMax ?? 10);
    item.scores.__radarOverflowMax = Number(config.theme.radarOverflowMax ?? item.scores.__radarScaleMax);
    validateScores(item.scores);
    delete item.scores.__radarScaleMax;
    delete item.scores.__radarOverflowMax;
  }
}

export async function loadVideoConfig(rootDir, fileArg) {
  assert(fileArg, "A path to video.json is required.");
  const absolutePath = path.resolve(rootDir, fileArg);
  const raw = await readFile(absolutePath, "utf8");
  const parsed = JSON.parse(raw);
  const template = await loadTemplateById(rootDir, parsed.templateId);
  const imageMapRaw = await readFile(path.join(rootDir, OPERATOR_IMAGE_MAP_PATH), "utf8");
  const imageMap = normalizeImageMap(JSON.parse(imageMapRaw));
  const config = {
    ...parsed,
    items: parsed.items.map((item) => ({
      ...item,
      image: resolveItemImage(item, imageMap)
    }))
  };
  validateVideoConfig(config, template);
  return {
    absolutePath,
    config,
    template
  };
}
