import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadVideoConfig, REQUIRED_AXES } from "./video-config.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const templatePath = path.join(rootDir, "video-src", "index.template.html");
const outputPath = path.join(rootDir, "index.html");
const outputMetaPath = path.join(rootDir, "meta.json");

const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 30;
const OUTER_RADIUS = 254;
const CENTER = 320;
const ITEM_GAP_SECONDS = 0;

function getRadarScaleConfig(theme) {
  const radarScaleMax = Number(theme?.radarScaleMax ?? 10);
  const radarOverflowMax = Number(theme?.radarOverflowMax ?? radarScaleMax);
  return {
    radarScaleMax,
    radarOverflowMax
  };
}

function getAngle(index) {
  return (-90 + index * 60) * (Math.PI / 180);
}

function getPolygonPoints(values) {
  return values.map((value, index) => {
    const angle = getAngle(index);
    const radius = OUTER_RADIUS * value;
    return {
      x: CENTER + radius * Math.cos(angle),
      y: CENTER + radius * Math.sin(angle)
    };
  });
}

function pointsToAttribute(points) {
  return points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
}

function buildRadarGridMarkup() {
  const ringCount = 5;
  const parts = [];

  for (let ring = ringCount; ring >= 1; ring -= 1) {
    const scale = ring / ringCount;
    const normalized = REQUIRED_AXES.map(() => scale);
    parts.push(
      `<polygon class="radar-grid-ring" points="${pointsToAttribute(getPolygonPoints(normalized))}"></polygon>`
    );
  }

  for (let index = 0; index < REQUIRED_AXES.length; index += 1) {
    const angle = getAngle(index);
    const x = CENTER + OUTER_RADIUS * Math.cos(angle);
    const y = CENTER + OUTER_RADIUS * Math.sin(angle);
    parts.push(`<line class="radar-grid-axis" x1="${CENTER}" y1="${CENTER}" x2="${x}" y2="${y}"></line>`);
  }

  return parts.join("\n");
}

function normalizeImagePath(imagePath) {
  if (imagePath.startsWith("/")) {
    return `.${imagePath}`;
  }

  return imagePath;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function createTimelineSnippet(item, index, animation, isLastItem, nextItemId) {
  const sceneSelector = `#scene-${item.id}`;
  const frameSelector = `${sceneSelector} .scene__frame`;
  const nameplateSelector = `${sceneSelector} .nameplate`;
  const operatorWrapSelector = `${sceneSelector} .operator-wrap`;
  const operatorSelector = `${sceneSelector} .operator`;
  const rightPanelSelector = `${sceneSelector} .scene__right`;
  const leftGlowSelector = `${sceneSelector} .scene__glow--left`;
  const rightGlowSelector = `${sceneSelector} .scene__glow--right`;
  const ghostSelector = `${sceneSelector} .scene__ghost`;
  const scanlineSelector = `${sceneSelector} .scene__scanline`;
  const gridSelector = `${sceneSelector} .scene__grid`;
  const radarSelector = `#radar-data-${index}`;
  const baseTime = item.sceneStart;
  const lines = [
    `tl.set("${scanlineSelector}", { scaleX: 0 }, ${baseTime});`,
    `tl.fromTo("${nameplateSelector}", { opacity: 0, y: -26 }, { opacity: 1, y: 0, duration: 0.46, ease: "expo.out", overwrite: "auto" }, ${baseTime + 0.2});`,
    `tl.fromTo("${leftGlowSelector}", { scale: 0.84, opacity: 0.2 }, { scale: 1.05, opacity: 1, duration: 0.82, ease: "sine.out", overwrite: "auto" }, ${baseTime + 0.18});`,
    `tl.fromTo("${rightGlowSelector}", { scale: 0.86, opacity: 0.18 }, { scale: 1.02, opacity: 1, duration: 0.78, ease: "power2.out", overwrite: "auto" }, ${baseTime + 0.26});`,
    `tl.fromTo("${gridSelector}", { opacity: 0, scale: 0.985 }, { opacity: 0.32, scale: 1, duration: 0.62, ease: "power3.out", overwrite: "auto" }, ${baseTime + 0.22});`,
    `tl.fromTo("${ghostSelector}", { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.52, ease: "power2.out", overwrite: "auto" }, ${baseTime + 0.34});`,
    `tl.to("${scanlineSelector}", { scaleX: 1, duration: 0.58, ease: "power2.out", overwrite: "auto" }, ${baseTime + 0.28});`
  ];

  if (animation.characterEnter === "fade-up-soft") {
    lines.push(
      `tl.fromTo("${operatorWrapSelector}", { opacity: 0, y: 86, scale: 0.988 }, { opacity: 1, y: 0, scale: 1, duration: 0.95, ease: "power3.out", overwrite: "auto" }, ${baseTime + 0.12});`
    );
  } else if (animation.characterEnter === "zoom-in-soft") {
    lines.push(
      `tl.fromTo("${operatorWrapSelector}", { opacity: 0, scale: 0.93, x: -10 }, { opacity: 1, scale: 1, x: 0, duration: 0.96, ease: "expo.out", overwrite: "auto" }, ${baseTime + 0.1});`
    );
  } else {
    lines.push(
      `tl.fromTo("${operatorWrapSelector}", { opacity: 0, x: -64, scale: 0.985 }, { opacity: 1, x: 0, scale: 1, duration: 0.96, ease: "power4.out", overwrite: "auto" }, ${baseTime + 0.12});`
    );
  }

  lines.push(
    `tl.fromTo("${operatorSelector}", { scale: 1 }, { scale: 1.03, duration: 3.2, ease: "none", overwrite: "auto" }, ${baseTime + 0.42});`,
    `tl.fromTo("${rightPanelSelector}", { opacity: 0.86, x: 20 }, { opacity: 1, x: 0, duration: 0.54, ease: "power2.out", overwrite: "auto" }, ${baseTime + 0.22});`
  );

  if (animation.radarBuild === "radial-draw") {
    lines.push(
      `tl.fromTo("${radarSelector}", { opacity: 0.16, strokeDasharray: 1800, strokeDashoffset: 1800, scale: 0.96 }, { opacity: 1, strokeDashoffset: 0, scale: 1, duration: 1, ease: "expo.out", overwrite: "auto" }, ${baseTime + 0.14});`
    );
  } else if (animation.radarBuild === "pulse-build") {
    lines.push(
      `tl.fromTo("${radarSelector}", { opacity: 0, scale: 0.12 }, { opacity: 1, scale: 1.08, duration: 0.62, ease: "back.out(1.7)", overwrite: "auto" }, ${baseTime + 0.16});`,
      `tl.to("${radarSelector}", { scale: 1, duration: 0.3, ease: "power2.out", overwrite: "auto" }, ${baseTime + 0.78});`
    );
  } else {
    lines.push(
      `tl.fromTo("${radarSelector}", { opacity: 0, scale: 0.06 }, { opacity: 1, scale: 1, duration: 0.96, ease: "expo.out", overwrite: "auto" }, ${baseTime + 0.14});`
    );
  }

  lines.push(
    `tl.to("${radarSelector}", { scale: 1.018, duration: 1.42, ease: "sine.inOut", yoyo: true, repeat: 1, overwrite: "auto" }, ${baseTime + 1.16});`,
    `tl.to("${leftGlowSelector}", { scale: 1.09, duration: 1.68, ease: "sine.inOut", yoyo: true, repeat: 1, overwrite: "auto" }, ${baseTime + 1.1});`,
    `tl.to("${rightGlowSelector}", { scale: 1.08, duration: 1.58, ease: "sine.inOut", yoyo: true, repeat: 1, overwrite: "auto" }, ${baseTime + 1.18});`
  );

  if (isLastItem) {
    lines.push(
      `tl.to("${frameSelector}", { opacity: 0, duration: 0.22, ease: "power2.in", overwrite: "auto" }, ${item.sceneEnd - 0.22});`
    );
  } else if (animation.transition === "flash-cut") {
    lines.push(
      `tl.fromTo("${frameSelector}", { filter: "brightness(1)" }, { filter: "brightness(1.42)", duration: 0.12, ease: "power2.in", overwrite: "auto" }, ${item.sceneEnd - 0.22});`,
      `tl.fromTo("#scene-${nextItemId} .scene__frame", { opacity: 0.82, filter: "brightness(1.35)" }, { opacity: 1, filter: "brightness(1)", duration: 0.18, ease: "power3.out", overwrite: "auto" }, ${item.sceneEnd - 0.12});`
    );
  } else if (animation.transition === "blur-cut") {
    lines.push(
      `tl.fromTo("#scene-${nextItemId} .scene__frame", { opacity: 0.62, filter: "blur(18px)", scale: 1.016 }, { opacity: 1, filter: "blur(0px)", scale: 1, duration: 0.24, ease: "power3.out", overwrite: "auto" }, ${item.sceneEnd - 0.18});`
    );
  }

  return lines.join("\n      ");
}

function buildSceneMarkup(item, index, radarGridMarkup, radarAxes, durationPerItem) {
  const labels = [
    { text: radarAxes[0], className: "radar-label radar-label--top" },
    { text: radarAxes[1], className: "radar-label radar-label--top-right" },
    { text: radarAxes[2], className: "radar-label radar-label--bottom-right" },
    { text: radarAxes[3], className: "radar-label radar-label--bottom" },
    { text: radarAxes[4], className: "radar-label radar-label--bottom-left" },
    { text: radarAxes[5], className: "radar-label radar-label--top-left" }
  ];
  const labelMarkup = labels
    .map((label) => `<div class="${label.className}">${escapeHtml(label.text)}</div>`)
    .join("");

  return `
      <section
        id="scene-${item.id}"
        class="scene clip"
        data-start="${item.sceneStart}"
        data-duration="${durationPerItem}"
        data-track-index="1"
      >
        <div class="scene__frame">
          <div class="scene__backdrop" data-layout-ignore>
            <div class="scene__glow scene__glow--left"></div>
            <div class="scene__glow scene__glow--right"></div>
            <div class="scene__grid"></div>
            <div class="scene__ghost" data-layout-ignore>RANK</div>
            <div class="scene__scanline"></div>
          </div>

          <div class="scene__shell">
            <div class="scene__left">
              <div class="nameplate">
                <div class="nameplate__alias">${escapeHtml(item.displayName)}</div>
              </div>
              <div class="operator-wrap" data-layout-allow-overflow>
                <img class="operator" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" crossorigin="anonymous" />
              </div>
            </div>

            <div class="scene__right">
              <div class="radar">
                ${labelMarkup}
                <svg viewBox="0 0 640 640" aria-label="radar chart">
                  <g>${radarGridMarkup}</g>
                  <polygon id="radar-data-${index}" class="radar-data${item.hasOverflow ? " radar-data--overflow" : ""}" points="${item.points}"></polygon>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>`;
}

function buildItemData(config) {
  const { radarScaleMax } = getRadarScaleConfig(config.theme);
  return config.items.map((item, index) => {
    const displayName = item.displayName || item.name;
    const scores = REQUIRED_AXES.map((axis) => Number(item.scores[axis]) / radarScaleMax);
    const points = pointsToAttribute(getPolygonPoints(scores));
    const sceneStart = index * (Number(config.meta.durationPerItem) + ITEM_GAP_SECONDS);
    const sceneEnd = sceneStart + Number(config.meta.durationPerItem);
    const hasOverflow = REQUIRED_AXES.some((axis) => Number(item.scores[axis]) > radarScaleMax);

    return {
      id: item.id,
      name: item.name,
      displayName,
      image: normalizeImagePath(item.image),
      points,
      scores,
      hasOverflow,
      sceneStart,
      sceneEnd
    };
  });
}

function buildCompositionData(config) {
  const items = buildItemData(config);
  const totalDuration = items.length * Number(config.meta.durationPerItem);
  return {
    meta: {
      title: config.meta.title,
      durationPerItem: Number(config.meta.durationPerItem),
      fps: FPS,
      width: WIDTH,
      height: HEIGHT,
      totalDuration
    },
    theme: {
      radarAxes: REQUIRED_AXES,
      ...getRadarScaleConfig(config.theme)
    },
    animation: config.animation,
    radarGridMarkup: buildRadarGridMarkup(),
    items
  };
}

async function main() {
  const fileArg = process.argv[2] || "data/videos/delta-firestorm-sample.json";
  const { config } = await loadVideoConfig(rootDir, fileArg);
  const compositionData = buildCompositionData(config);
  const sceneMarkup = compositionData.items
    .map((item, index) =>
      buildSceneMarkup(
        item,
        index,
        compositionData.radarGridMarkup,
        compositionData.theme.radarAxes,
        compositionData.meta.durationPerItem
      )
    )
    .join("\n");
  const timelineScript = compositionData.items
    .map((item, index) =>
      createTimelineSnippet(
        item,
        index,
        compositionData.animation,
        index === compositionData.items.length - 1,
        compositionData.items[index + 1]?.id
      )
    )
    .join("\n\n      ");

  const template = await readFile(templatePath, "utf8");
  const html = template
    .replaceAll("__TOTAL_DURATION__", String(compositionData.meta.totalDuration))
    .replace("__SCENES_MARKUP__", sceneMarkup)
    .replace("__TIMELINE_SCRIPT__", timelineScript);

  await mkdir(rootDir, { recursive: true });
  await writeFile(outputPath, html, "utf8");
  await writeFile(
    outputMetaPath,
    JSON.stringify(
      {
        id: "radar-panel-video",
        name: escapeHtml(config.meta.title),
        createdAt: new Date().toISOString()
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(`HyperFrames composition generated: ${path.relative(rootDir, outputPath)}`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
