import { readFile } from "node:fs/promises";
import path from "node:path";

const TEMPLATE_REGISTRY_PATH = path.join("data", "templates", "registry.json");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeManifestPath(manifestPath) {
  if (manifestPath.startsWith("/")) {
    return manifestPath.slice(1).replaceAll("/", path.sep);
  }

  return manifestPath;
}

function validateTemplateManifest(template) {
  assert(template && typeof template === "object", "Template manifest must be an object.");
  assert(typeof template.id === "string" && template.id.length > 0, "Template manifest requires `id`.");
  assert(typeof template.family === "string" && template.family.length > 0, "Template manifest requires `family`.");
  assert(Array.isArray(template.constraints?.radarAxes) && template.constraints.radarAxes.length > 0, "Template manifest requires `constraints.radarAxes`.");
  assert(typeof template.render?.templatePath === "string" && template.render.templatePath.length > 0, "Template manifest requires `render.templatePath`.");
  assert(Number(template.render?.width) > 0, "Template manifest requires positive `render.width`.");
  assert(Number(template.render?.height) > 0, "Template manifest requires positive `render.height`.");
  assert(Number(template.render?.fps) > 0, "Template manifest requires positive `render.fps`.");
  assert(Number(template.render?.radarCenter) > 0, "Template manifest requires positive `render.radarCenter`.");
  assert(Number(template.render?.radarOuterRadius) > 0, "Template manifest requires positive `render.radarOuterRadius`.");
  assert(Number(template.render?.radarViewBox) > 0, "Template manifest requires positive `render.radarViewBox`.");
  assert(typeof template.preview?.aspectRatio === "string" && template.preview.aspectRatio.length > 0, "Template manifest requires `preview.aspectRatio`.");
  assert(Number(template.preview?.radarCenter) > 0, "Template manifest requires positive `preview.radarCenter`.");
  assert(Number(template.preview?.radarOuterRadius) > 0, "Template manifest requires positive `preview.radarOuterRadius`.");
  assert(Number(template.preview?.radarViewBox) > 0, "Template manifest requires positive `preview.radarViewBox`.");
}

export async function loadTemplateRegistry(rootDir) {
  const absolutePath = path.join(rootDir, TEMPLATE_REGISTRY_PATH);
  const raw = await readFile(absolutePath, "utf8");
  const parsed = JSON.parse(raw);

  assert(Array.isArray(parsed?.templates) && parsed.templates.length > 0, "Template registry requires a non-empty `templates` array.");

  return parsed.templates;
}

export async function loadTemplateById(rootDir, templateId) {
  const registry = await loadTemplateRegistry(rootDir);
  const entry = registry.find((item) => item.id === templateId);

  assert(entry, `Unknown template id: ${templateId}`);
  assert(typeof entry.manifestPath === "string" && entry.manifestPath.length > 0, `Template registry entry ${templateId} requires \`manifestPath\`.`);

  const manifestAbsolutePath = path.join(rootDir, normalizeManifestPath(entry.manifestPath));
  const raw = await readFile(manifestAbsolutePath, "utf8");
  const template = JSON.parse(raw);
  validateTemplateManifest(template);
  assert(template.id === templateId, `Template manifest id mismatch: expected ${templateId}, got ${template.id}`);

  return template;
}
