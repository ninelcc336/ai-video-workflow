const ACTIVE_VIDEO_PATH = "/data/videos/active-video.json";
const TEMPLATE_REGISTRY_PATH = "/data/templates/registry.json";
const OPERATOR_IMAGE_MAP_PATH = "/data/assets/operator-image-map.json";
const AXES = ["信息", "机动", "压制", "生存", "功能", "难度"];

const state = {
  config: null,
  template: null,
  currentIndex: 0,
  isPlaying: true,
  timer: null,
  radarScaleMax: 10
};

const elements = {
  characterEnter: document.querySelector("#character-enter"),
  displayName: document.querySelector("#display-name"),
  durationPerItem: document.querySelector("#duration-per-item"),
  errorBox: document.querySelector("#error-box"),
  flashLayer: document.querySelector("#flash-layer"),
  itemCount: document.querySelector("#item-count"),
  nextButton: document.querySelector("#next-item"),
  operatorImage: document.querySelector("#operator-image"),
  prevButton: document.querySelector("#prev-item"),
  radarBuild: document.querySelector("#radar-build"),
  radarData: document.querySelector("#radar-data"),
  radarGrid: document.querySelector("#radar-grid"),
  radarLabels: Array.from(document.querySelectorAll(".radar__label")),
  radarRoot: document.querySelector("#radar-root"),
  radarSvg: document.querySelector("#radar-svg"),
  stage: document.querySelector("#video-stage"),
  stageWrap: document.querySelector("#stage-wrap"),
  statusLine: document.querySelector("#status-line"),
  togglePlay: document.querySelector("#toggle-play"),
  transitionMode: document.querySelector("#transition-mode"),
  videoTitle: document.querySelector("#video-title")
};

async function getVideoPath() {
  const params = new URLSearchParams(window.location.search);
  const directVideoPath = params.get("video");
  if (directVideoPath) {
    return directVideoPath;
  }

  const response = await fetch(ACTIVE_VIDEO_PATH, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load active video config: ${response.status}`);
  }

  const activeConfig = await response.json();
  if (!activeConfig?.videoConfig) {
    throw new Error("Missing `videoConfig` in active video config.");
  }

  return activeConfig.videoConfig;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function validateConfig(config) {
  const template = arguments[1];
  assert(config && typeof config === "object", "Config root must be an object.");
  assert(config.templateId, "Missing `templateId`.");
  assert(config.meta?.title, "Missing `meta.title`.");
  assert(Number(config.meta?.durationPerItem) > 0, "`meta.durationPerItem` must be positive.");
  assert(Array.isArray(config.theme?.radarAxes), "Missing `theme.radarAxes`.");
  const templateAxes = template?.constraints?.radarAxes || AXES;
  assert(JSON.stringify(config.theme.radarAxes) === JSON.stringify(templateAxes), "Radar axes must match the selected template.");
  const radarScaleMax = Number(config.theme?.radarScaleMax ?? 10);
  const radarOverflowMax = Number(config.theme?.radarOverflowMax ?? radarScaleMax);
  assert(Number.isFinite(radarScaleMax) && radarScaleMax > 0, "`theme.radarScaleMax` must be positive.");
  assert(Number.isFinite(radarOverflowMax) && radarOverflowMax >= radarScaleMax, "`theme.radarOverflowMax` must be >= `theme.radarScaleMax`.");
  assert(Array.isArray(config.items) && config.items.length > 0, "`items` must be a non-empty array.");

  for (const item of config.items) {
    assert(item.id, "Each item requires `id`.");
    assert(item.name, `Item ${item.id} is missing \`name\`.`);
    assert(item.image, `Item ${item.id} is missing \`image\`.`);
    assert(item.scores && typeof item.scores === "object", `Item ${item.id} is missing \`scores\`.`);
    for (const axis of AXES) {
      const score = Number(item.scores[axis]);
      assert(Number.isFinite(score), `Item ${item.id} is missing score: ${axis}`);
      assert(score >= 0 && score <= radarOverflowMax, `Item ${item.id} score out of range for ${axis}.`);
    }
  }
}

async function loadTemplate(templateId) {
  const registryResponse = await fetch(TEMPLATE_REGISTRY_PATH, { cache: "no-store" });
  if (!registryResponse.ok) {
    throw new Error(`Failed to load template registry: ${registryResponse.status}`);
  }

  const registry = await registryResponse.json();
  const entry = registry?.templates?.find((item) => item.id === templateId);
  if (!entry?.manifestPath) {
    throw new Error(`Unknown template id: ${templateId}`);
  }

  const manifestResponse = await fetch(entry.manifestPath, { cache: "no-store" });
  if (!manifestResponse.ok) {
    throw new Error(`Failed to load template manifest: ${manifestResponse.status}`);
  }

  return manifestResponse.json();
}

function normalizeLookupKey(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeImageMap(rawMap) {
  const normalized = {};
  for (const [key, value] of Object.entries(rawMap || {})) {
    normalized[normalizeLookupKey(key)] = value;
  }
  return normalized;
}

function resolveItemImage(item, imageMap) {
  if (item.image) {
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

function resolveConfigImages(config, imageMap) {
  return {
    ...config,
    items: config.items.map((item) => ({
      ...item,
      image: resolveItemImage(item, imageMap)
    }))
  };
}

function buildRadarGrid() {
  const radarAxes = state.template?.constraints?.radarAxes || AXES;
  const radarCenter = Number(state.template?.preview?.radarCenter ?? 300);
  const radarOuterRadius = Number(state.template?.preview?.radarOuterRadius ?? 230);
  const svgParts = [];
  const ringCount = 5;

  for (let ring = ringCount; ring >= 1; ring -= 1) {
    const scale = ring / ringCount;
    svgParts.push(`<polygon class="radar__grid-ring" points="${pointsToAttribute(getPolygonPoints(radarAxes.map(() => scale), radarCenter, radarOuterRadius))}"></polygon>`);
  }

  for (let index = 0; index < radarAxes.length; index += 1) {
    const angle = getAngle(index);
    const x = radarCenter + radarOuterRadius * Math.cos(angle);
    const y = radarCenter + radarOuterRadius * Math.sin(angle);
    svgParts.push(`<line class="radar__grid-axis" x1="${radarCenter}" y1="${radarCenter}" x2="${x}" y2="${y}"></line>`);
  }

  elements.radarGrid.innerHTML = svgParts.join("");
}

function getAngle(index) {
  return (-90 + index * 60) * (Math.PI / 180);
}

function getPolygonPoints(values, radarCenter, radarOuterRadius) {
  return values.map((value, index) => {
    const angle = getAngle(index);
    const radius = radarOuterRadius * value;
    return {
      x: radarCenter + radius * Math.cos(angle),
      y: radarCenter + radius * Math.sin(angle)
    };
  });
}

function pointsToAttribute(points) {
  return points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
}

function scoreMapToNormalizedArray(scores, radarScaleMax) {
  const radarAxes = state.template?.constraints?.radarAxes || AXES;
  return radarAxes.map((axis) => Number(scores[axis]) / radarScaleMax);
}

function hasOverflowScore(scores, radarScaleMax) {
  const radarAxes = state.template?.constraints?.radarAxes || AXES;
  return radarAxes.some((axis) => Number(scores[axis]) > radarScaleMax);
}

function resetAnimationClass(element, className) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}

function applyTransitionEffect(mode) {
  if (mode === "flash-cut") {
    resetAnimationClass(elements.flashLayer, "is-flashing");
    return;
  }

  if (mode === "blur-cut") {
    resetAnimationClass(elements.stage, "is-blur-cut");
  }
}

function setOperatorAnimation(animationName) {
  elements.operatorImage.setAttribute("class", `operator operator--${animationName}`);
}

function setRadarAnimation(animationName, isOverflow) {
  const overflowClass = isOverflow ? " radar__data--overflow" : "";
  elements.radarData.setAttribute("class", `radar__data radar__data--${animationName}${overflowClass}`);
}

function renderMeta() {
  const { config } = state;
  state.radarScaleMax = Number(config.theme?.radarScaleMax ?? 10);
  elements.videoTitle.textContent = config.meta.title;
  elements.itemCount.textContent = `${config.items.length}`;
  elements.durationPerItem.textContent = `${config.meta.durationPerItem}s`;
  elements.characterEnter.textContent = config.animation.characterEnter;
  elements.radarBuild.textContent = config.animation.radarBuild;
  elements.transitionMode.textContent = config.animation.transition;
}

function renderItem(index) {
  const item = state.config.items[index];
  const displayName = item.displayName || item.name;
  const radarCenter = Number(state.template?.preview?.radarCenter ?? 300);
  const radarOuterRadius = Number(state.template?.preview?.radarOuterRadius ?? 230);

  elements.displayName.textContent = displayName;
  elements.operatorImage.src = item.image;
  elements.operatorImage.alt = item.name;
  elements.statusLine.textContent = `${index + 1} / ${state.config.items.length}  ${displayName}`;

  setOperatorAnimation(state.config.animation.characterEnter);
  setRadarAnimation(state.config.animation.radarBuild, hasOverflowScore(item.scores, state.radarScaleMax));
  applyTransitionEffect(state.config.animation.transition);

  const normalizedScores = scoreMapToNormalizedArray(item.scores, state.radarScaleMax);
  const points = getPolygonPoints(normalizedScores, radarCenter, radarOuterRadius);
  elements.radarData.setAttribute("points", pointsToAttribute(points));
}

function applyTemplate(template) {
  state.template = template;
  if (template.family !== "operator-radar-panel") {
    throw new Error(`Unsupported preview template family: ${template.family}`);
  }

  elements.stageWrap.style.setProperty("--stage-aspect-ratio", template.preview.aspectRatio);
  elements.radarSvg.setAttribute("viewBox", `0 0 ${template.preview.radarViewBox} ${template.preview.radarViewBox}`);
  elements.radarData.style.transformOrigin = `${template.preview.radarCenter}px ${template.preview.radarCenter}px`;
  const radarAxes = template.constraints?.radarAxes || AXES;
  radarAxes.forEach((axis, index) => {
    if (elements.radarLabels[index]) {
      elements.radarLabels[index].textContent = axis;
    }
  });
}

function clearTimer() {
  if (state.timer) {
    window.clearTimeout(state.timer);
    state.timer = null;
  }
}

function scheduleNextTick() {
  clearTimer();
  if (!state.isPlaying) return;
  state.timer = window.setTimeout(() => {
    goToIndex((state.currentIndex + 1) % state.config.items.length);
  }, Number(state.config.meta.durationPerItem) * 1000);
}

function goToIndex(index) {
  state.currentIndex = index;
  renderItem(index);
  scheduleNextTick();
}

function togglePlayback() {
  state.isPlaying = !state.isPlaying;
  elements.togglePlay.textContent = state.isPlaying ? "暂停" : "播放";
  if (state.isPlaying) {
    scheduleNextTick();
  } else {
    clearTimer();
  }
}

async function loadConfig() {
  const videoPath = await getVideoPath();
  const [configResponse, imageMapResponse] = await Promise.all([
    fetch(videoPath, { cache: "no-store" }),
    fetch(OPERATOR_IMAGE_MAP_PATH, { cache: "no-store" })
  ]);
  if (!configResponse.ok) {
    throw new Error(`Failed to load config: ${configResponse.status}`);
  }
  if (!imageMapResponse.ok) {
    throw new Error(`Failed to load operator image map: ${imageMapResponse.status}`);
  }

  const [config, rawImageMap] = await Promise.all([configResponse.json(), imageMapResponse.json()]);
  const resolvedConfig = resolveConfigImages(config, normalizeImageMap(rawImageMap));
  const template = await loadTemplate(resolvedConfig.templateId);
  return {
    config: resolvedConfig,
    template
  };
}

function bindEvents() {
  elements.togglePlay.addEventListener("click", togglePlayback);
  elements.prevButton.addEventListener("click", () => {
    const nextIndex = (state.currentIndex - 1 + state.config.items.length) % state.config.items.length;
    goToIndex(nextIndex);
  });
  elements.nextButton.addEventListener("click", () => {
    const nextIndex = (state.currentIndex + 1) % state.config.items.length;
    goToIndex(nextIndex);
  });
}

async function bootstrap() {
  try {
    const { config, template } = await loadConfig();
    validateConfig(config, template);
    applyTemplate(template);
    buildRadarGrid();
    state.config = config;
    renderMeta();
    bindEvents();
    goToIndex(0);
  } catch (error) {
    elements.errorBox.hidden = false;
    elements.errorBox.textContent = error.stack || error.message;
    elements.statusLine.textContent = "预览加载失败";
  }
}

bootstrap();
