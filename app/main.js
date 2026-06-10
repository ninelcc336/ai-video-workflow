const DEFAULT_VIDEO_PATH = "/data/videos/delta-firestorm-sample.json";
const AXES = ["信息", "机动", "压制", "生存", "功能", "难度"];
const CENTER = 300;
const OUTER_RADIUS = 230;

const state = {
  config: null,
  currentIndex: 0,
  isPlaying: true,
  timer: null
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
  radarRoot: document.querySelector("#radar-root"),
  stage: document.querySelector("#video-stage"),
  statusLine: document.querySelector("#status-line"),
  togglePlay: document.querySelector("#toggle-play"),
  transitionMode: document.querySelector("#transition-mode"),
  videoTitle: document.querySelector("#video-title")
};

function getVideoPath() {
  const params = new URLSearchParams(window.location.search);
  return params.get("video") || DEFAULT_VIDEO_PATH;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function validateConfig(config) {
  assert(config && typeof config === "object", "Config root must be an object.");
  assert(config.meta?.title, "Missing `meta.title`.");
  assert(Number(config.meta?.durationPerItem) > 0, "`meta.durationPerItem` must be positive.");
  assert(Array.isArray(config.theme?.radarAxes), "Missing `theme.radarAxes`.");
  assert(JSON.stringify(config.theme.radarAxes) === JSON.stringify(AXES), "Radar axes must stay in the fixed 6-axis order.");
  assert(Array.isArray(config.items) && config.items.length > 0, "`items` must be a non-empty array.");

  for (const item of config.items) {
    assert(item.id, "Each item requires `id`.");
    assert(item.name, `Item ${item.id} is missing \`name\`.`);
    assert(item.image, `Item ${item.id} is missing \`image\`.`);
    assert(item.scores && typeof item.scores === "object", `Item ${item.id} is missing \`scores\`.`);
    for (const axis of AXES) {
      const score = Number(item.scores[axis]);
      assert(Number.isFinite(score), `Item ${item.id} is missing score: ${axis}`);
      assert(score >= 0 && score <= 10, `Item ${item.id} score out of range for ${axis}.`);
    }
  }
}

function buildRadarGrid() {
  const svgParts = [];
  const ringCount = 5;

  for (let ring = ringCount; ring >= 1; ring -= 1) {
    const scale = ring / ringCount;
    svgParts.push(`<polygon class="radar__grid-ring" points="${pointsToAttribute(getPolygonPoints([scale, scale, scale, scale, scale, scale]))}"></polygon>`);
  }

  for (let index = 0; index < AXES.length; index += 1) {
    const angle = getAngle(index);
    const x = CENTER + OUTER_RADIUS * Math.cos(angle);
    const y = CENTER + OUTER_RADIUS * Math.sin(angle);
    svgParts.push(`<line class="radar__grid-axis" x1="${CENTER}" y1="${CENTER}" x2="${x}" y2="${y}"></line>`);
  }

  elements.radarGrid.innerHTML = svgParts.join("");
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

function scoreMapToNormalizedArray(scores) {
  return AXES.map((axis) => Number(scores[axis]) / 10);
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
  elements.operatorImage.className = "operator";
  elements.operatorImage.classList.add(`operator--${animationName}`);
}

function setRadarAnimation(animationName) {
  elements.radarData.className = "radar__data";
  elements.radarData.classList.add(`radar__data--${animationName}`);
}

function renderMeta() {
  const { config } = state;
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

  elements.displayName.textContent = displayName;
  elements.operatorImage.src = item.image;
  elements.operatorImage.alt = item.name;
  elements.statusLine.textContent = `${index + 1} / ${state.config.items.length}  ${displayName}`;

  setOperatorAnimation(state.config.animation.characterEnter);
  setRadarAnimation(state.config.animation.radarBuild);
  applyTransitionEffect(state.config.animation.transition);

  const normalizedScores = scoreMapToNormalizedArray(item.scores);
  const points = getPolygonPoints(normalizedScores);
  elements.radarData.setAttribute("points", pointsToAttribute(points));
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
  const response = await fetch(getVideoPath(), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load config: ${response.status}`);
  }
  return response.json();
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
    buildRadarGrid();
    const config = await loadConfig();
    validateConfig(config);
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

